import { type Channel, RPC_TIMEOUT_MS, RpcError } from "./channel";
import { decodeCryptoEvent } from "./codec";
import { decodeResult, encodeArgs, kindOf } from "./cryptoTable";
import type { BatchResult, DecryptRequest, DecryptResult, EncryptReply, EncryptRequest } from "./protocol";
import type { MatrixClientLike } from "./hooks";
import { showToast } from "./toast";
import { setBounded } from "./util";

/**
 * What `client.getCrypto()` returns in a mirror: a `CryptoBackend` that forwards to the engine's Rust crypto.
 *
 * Decryption failures are remembered per Megolm session and retried when the engine announces new room keys
 * (`roomKeys`), which replaces RustCrypto's own retry of events waiting for a key.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** How many undecryptable events are kept for a retry; the oldest are dropped first. */
const MAX_PENDING = 2_000;
const UNKNOWN_ERROR = "UNKNOWN_ERROR";
/** Shields (`getEncryptionInfoForEvent`) are cached this long, and dropped earlier when the sender's trust changes. */
const SHIELD_TTL_MS = 60_000;
const MAX_SHIELDS_KEPT = 5_000;
/** "Not encrypted" answers are cached this long; "encrypted" is for good (a room can't turn encryption off). */
const UNENCRYPTED_TTL_MS = 30_000;
/** Pending-list key for events that failed because the engine didn't answer (not for lack of a key). */
const RPC_FAILED = "\u0000rpc";

export class MirrorUnsupportedError extends Error {
    public constructor(method: string) {
        super(`"${method}" is only available in the main Element tab`);
        this.name = "MirrorUnsupportedError";
    }
}

interface Queued {
    ev: any;
    resolve(r: any): void;
    reject(e: unknown): void;
}

export class MirrorCrypto {
    public readonly backend: any;
    private client: MatrixClientLike | null = null;
    /** sessionId → events that failed for lack of that session's key. */
    private readonly pending = new Map<string, Set<any>>();
    private pendingCount = 0;
    private readonly encryptedRooms = new Set<string>();
    private readonly unencryptedUntil = new Map<string, number>();
    private readonly shieldCache = new Map<string, { value: Promise<unknown>; until: number; sender: string | null }>();
    /** Decrypt requests made in the same tick go to the engine as one message per room. */
    private readonly decryptQueue = new Map<string, Queued[]>();
    private flushScheduled = false;
    /** Shield requests made in the same tick go to the engine as one message. */
    private shieldQueue: Array<{ args: unknown[]; resolve(v: unknown): void; reject(e: unknown): void }> = [];
    private readonly listeners = new Map<string, Set<(...a: any[]) => void>>();
    public stats = { decrypted: 0, failed: 0, retried: 0, unsupported: [] as string[] };

    public constructor(private readonly channel: Channel) {
        const self = this;
        const local: Record<string, any> = {
            globalBlacklistUnverifiedDevices: false,
            globalErrorOnUnknownDevices: false,
            stop: () => {},
            processSyncChanges: async () => [],
            onCryptoEvent: async () => {},
            onSyncCompleted: () => {},
            markAllTrackedUsersAsDirty: async () => {},
            getVersion: () => "Rust SDK (via the main tab, multi-tab)",
            setTrustCrossSignedDevices: () => {},
            getTrustCrossSignedDevices: () => true,
            getVerificationRequestsToDeviceInProgress: () => [],
            findVerificationRequestDMInProgress: () => undefined,
            isDehydrationSupported: async () => false,
            getSessionBackupPrivateKey: async () => null,
            decryptEvent: (ev: any) => self.decryptEvent(ev),
            encryptEvent: (ev: any, room: any) => self.encryptEvent(ev, room),
            // RustCrypto is an event emitter; Element's listeners are on the client, which re-emits ours.
            on: (n: string, fn: any) => (self.addListener(n, fn), self.backend),
            off: (n: string, fn: any) => (self.listeners.get(n)?.delete(fn), self.backend),
            addListener: (n: string, fn: any) => (self.addListener(n, fn), self.backend),
            removeListener: (n: string, fn: any) => (self.listeners.get(n)?.delete(fn), self.backend),
            once: (n: string, fn: any) => (self.addListener(n, fn), self.backend),
            emit: (n: string, ...a: any[]) => self.emit(n, ...a),
            listenerCount: (n: string) => self.listeners.get(n)?.size ?? 0,
        };

        this.backend = new Proxy(local, {
            get(target, prop, receiver) {
                if (typeof prop !== "string" || prop in target) return Reflect.get(target, prop, receiver);
                if (prop === "then" || prop === "toJSON") return undefined;
                const kind = kindOf(prop);
                if (kind === "forward") return (...args: any[]) => self.forward(prop, args);
                if (kind === "secret") return async () => null;
                return (..._args: any[]) => {
                    if (!self.stats.unsupported.includes(prop)) self.stats.unsupported.push(prop);
                    if (kind === undefined) console.warn(`[multi-tab] Unknown crypto method "${prop}" called in a mirror tab`);
                    showToast("This needs your main Element tab: switch to the tab you opened first.");
                    const err = new MirrorUnsupportedError(prop);
                    // Callers of async methods expect a rejected promise rather than a synchronous throw.
                    return Promise.reject(err);
                };
            },
            set(target, prop, value) {
                (target as any)[prop] = value;
                // Element writes these from its settings; the engine is the one that encrypts.
                if (prop === "globalBlacklistUnverifiedDevices" || prop === "globalErrorOnUnknownDevices") {
                    void self.channel.request("engine", "cryptoSet", { prop, value }, RPC_TIMEOUT_MS).catch(() => {});
                }
                return true;
            },
        });
    }

    /** Events this tab still can't decrypt (waiting for a key, or for the engine to answer again). */
    public get waiting(): number {
        return this.pendingCount;
    }

    public attach(client: MatrixClientLike): void {
        this.client = client;
    }

    private addListener(name: string, fn: (...a: any[]) => void): void {
        let set = this.listeners.get(name);
        if (!set) this.listeners.set(name, (set = new Set()));
        set.add(fn);
    }

    private emit(name: string, ...args: any[]): boolean {
        const set = this.listeners.get(name);
        if (!set?.size) return false;
        for (const fn of [...set]) fn(...args);
        return true;
    }

    /** `null` for events that aren't crypto events (see `decodeCryptoEvent`). */
    public decodeEvent(name: string, args: unknown[]): unknown[] | null {
        const decoded = decodeCryptoEvent(name, args);
        if (!decoded) return null;
        // (userId, status) and (userIds, initialFetch): only those senders' shields change.
        if (name === "userTrustStatusChanged") this.dropShields([decoded[0]]);
        else if (name === "crypto.devicesUpdated") this.dropShields(decoded[0]);
        else if (name === "crossSigning.keysChanged") this.clearShieldCache();
        return decoded;
    }

    private async forward(method: string, args: any[]): Promise<unknown> {
        if (method === "isEncryptionEnabledInRoom") {
            const known = this.knownEncryption(args[0]);
            if (known !== undefined) return known;
        }
        if (method === "getEncryptionInfoForEvent") return this.encryptionInfo(args[0]);
        return this.forwardNow(method, args);
    }

    /** Answers "is this room encrypted" without the engine where the mirror's own room state or cache can. */
    private knownEncryption(roomId: string): boolean | undefined {
        if (this.encryptedRooms.has(roomId)) return true;
        if (this.client?.getRoom(roomId)?.hasEncryptionStateEvent?.()) {
            this.encryptedRooms.add(roomId);
            return true;
        }
        if ((this.unencryptedUntil.get(roomId) ?? 0) > Date.now()) return false;
        return undefined;
    }

    /** Shields are asked for on every render of an event; the answer only changes when trust changes. */
    private encryptionInfo(ev: any): Promise<unknown> {
        const id: string | undefined = ev?.getId?.();
        const hit = id ? this.shieldCache.get(id) : undefined;
        if (hit && hit.until > Date.now()) return hit.value;
        const value = new Promise((resolve, reject) => {
            this.shieldQueue.push({ args: encodeArgs("getEncryptionInfoForEvent", [ev]), resolve, reject });
            if (this.shieldQueue.length === 1) queueMicrotask(() => void this.flushShields());
        });
        if (id) {
            setBounded(this.shieldCache, id, { value, until: Date.now() + SHIELD_TTL_MS, sender: ev.getSender?.() ?? null }, MAX_SHIELDS_KEPT);
            value.catch(() => this.shieldCache.delete(id));
        }
        return value;
    }

    private async flushShields(): Promise<void> {
        const batch = this.shieldQueue;
        this.shieldQueue = [];
        const calls = batch.map((b) => ({ method: "getEncryptionInfoForEvent", args: b.args }));
        let results: BatchResult[];
        try {
            results = await this.channel.request<BatchResult[]>("engine", "cryptoBatch", { calls }, RPC_TIMEOUT_MS);
        } catch (e) {
            for (const b of batch) b.reject(e);
            return;
        }
        batch.forEach((b, n) => {
            const r = results[n];
            if (r && "ok" in r) b.resolve(decodeResult("getEncryptionInfoForEvent", r.ok));
            else b.reject(new RpcError(r?.err.message ?? "No answer", r?.err.code, r?.err.name));
        });
    }

    private dropShields(userIds: unknown): void {
        if (!Array.isArray(userIds)) return this.clearShieldCache();
        const users = new Set(userIds);
        for (const [id, s] of this.shieldCache) if (s.sender === null || users.has(s.sender)) this.shieldCache.delete(id);
    }

    /** Trust changed in general (our own identity): shields must be computed again. */
    public clearShieldCache(): void {
        this.shieldCache.clear();
    }

    private async forwardNow(method: string, args: any[]): Promise<unknown> {
        const r = await this.channel.request("engine", "crypto", { method, args: encodeArgs(method, args) }, RPC_TIMEOUT_MS);
        if (method === "isEncryptionEnabledInRoom") {
            if (r === true) this.encryptedRooms.add(args[0]);
            else this.unencryptedUntil.set(args[0], Date.now() + UNENCRYPTED_TTL_MS);
        }
        return decodeResult(method, r);
    }

    private decryptEvent(ev: any): Promise<any> {
        const roomId: string = ev.getRoomId();
        return new Promise((resolve, reject) => {
            let q = this.decryptQueue.get(roomId);
            if (!q) this.decryptQueue.set(roomId, (q = []));
            q.push({ ev, resolve, reject });
            if (!this.flushScheduled) {
                this.flushScheduled = true;
                queueMicrotask(() => void this.flushDecrypts());
            }
        });
    }

    private async flushDecrypts(): Promise<void> {
        this.flushScheduled = false;
        const batches = [...this.decryptQueue.entries()];
        this.decryptQueue.clear();
        await Promise.all(
            batches.map(async ([roomId, items]) => {
                const req: DecryptRequest = { roomId, events: items.map((i) => i.ev.event) };
                let results: DecryptResult[];
                try {
                    results = await this.channel.request<DecryptResult[]>("engine", "decrypt", req, RPC_TIMEOUT_MS);
                } catch (e) {
                    // Engine gone or slow: keep them for a retry once it is back (`retryRpcFailures`).
                    for (const i of items) {
                        this.remember(i.ev, true);
                        i.reject(e);
                    }
                    return;
                }
                items.forEach((item, n) => {
                    const r = results[n];
                    if (r && "ok" in r) {
                        this.forget(item.ev);
                        this.stats.decrypted++;
                        item.resolve(r.ok);
                    } else {
                        this.stats.failed++;
                        this.remember(item.ev);
                        setFailureReason(item.ev, r?.err.code ?? UNKNOWN_ERROR);
                        item.reject(Object.assign(new Error(r?.err.message ?? "Decryption failed"), { code: r?.err.code }));
                    }
                });
            }),
        );
    }

    private async encryptEvent(ev: any, _room: any): Promise<void> {
        const req: EncryptRequest = {
            roomId: ev.getRoomId(),
            type: ev.getType(),
            content: ev.getContent(),
            stateKey: ev.isState() ? ev.getStateKey() : undefined,
        };
        const r = await this.channel.request<EncryptReply>("engine", "encrypt", req, RPC_TIMEOUT_MS);
        ev.makeEncrypted(r.type, r.content, r.senderKey, r.claimedKey);
    }

    private sessionOf(ev: any): string | undefined {
        return ev.getWireContent?.()?.session_id;
    }

    private remember(ev: any, rpcFailed = false): void {
        const sid = rpcFailed ? RPC_FAILED : (this.sessionOf(ev) ?? "*");
        let set = this.pending.get(sid);
        if (!set) this.pending.set(sid, (set = new Set()));
        if (set.has(ev)) return;
        set.add(ev);
        this.pendingCount++;
        if (this.pendingCount > MAX_PENDING) {
            const [oldestSid, oldest] = this.pending.entries().next().value!;
            const first = oldest.values().next().value;
            oldest.delete(first);
            this.pendingCount--;
            if (!oldest.size) this.pending.delete(oldestSid);
        }
    }

    private forget(ev: any): void {
        for (const sid of [this.sessionOf(ev) ?? "*", RPC_FAILED]) {
            const set = this.pending.get(sid);
            if (set?.delete(ev)) {
                this.pendingCount--;
                if (!set.size) this.pending.delete(sid);
            }
        }
    }

    /** New room keys reached the engine: retry what failed for lack of them. */
    public onRoomKeys(byRoom: Record<string, string[]>): void {
        const sessions = new Set(Object.values(byRoom).flat());
        this.retry([...this.pending.keys()].filter((sid) => sessions.has(sid) || sid === "*"));
    }

    /** Retries what failed because the engine didn't answer, once it answers again. */
    public retryRpcFailures(): void {
        // Taken out of the list: a failure now is for a missing key, and files them under their session.
        this.retryBucket(RPC_FAILED, true);
    }

    private retry(sessionIds: string[]): void {
        for (const sid of sessionIds) this.retryBucket(sid, false);
    }

    private retryBucket(key: string, take: boolean): void {
        const set = this.pending.get(key);
        if (!set) return;
        if (take) {
            this.pending.delete(key);
            this.pendingCount -= set.size;
        }
        for (const ev of [...set]) {
            this.stats.retried++;
            void ev.attemptDecryption(this.backend, { isRetry: true });
        }
    }
}

/**
 * js-sdk records why decryption failed only for its own `DecryptionError` class (an `instanceof` check), and
 * the mirror can't construct Element's copy of it. Keep the engine's reason on the event instead, so Element
 * shows the right "Unable to decrypt" message.
 */
const reasons = new WeakMap<object, string>();
function setFailureReason(ev: any, code: string): void {
    reasons.set(ev, code);
    if (Object.prototype.hasOwnProperty.call(ev, "_multiTabReason")) return;
    let stored: unknown = ev._decryptionFailureReason ?? null;
    try {
        Object.defineProperty(ev, "_decryptionFailureReason", {
            configurable: true,
            enumerable: false,
            get: () => stored,
            set: (v) => {
                stored = v === UNKNOWN_ERROR && reasons.has(ev) ? reasons.get(ev) : v;
                if (v === null) reasons.delete(ev);
            },
        });
        Object.defineProperty(ev, "_multiTabReason", { value: true });
    } catch {
        // frozen object or changed js-sdk: the generic message is shown
    }
}
