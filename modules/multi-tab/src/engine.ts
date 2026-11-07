import { type Channel, RpcError, toWireError } from "./channel";
import { encodeCryptoEvent, CRYPTO_EVENTS } from "./codec";
import { classify, requestTarget } from "./endpoints";
import { type ClientPegLike, type MatrixClientLike, SESSION_LOCK } from "./hooks";
import { runForwarded } from "./cryptoTable";
import {
    type BatchResult,
    type DecryptRequest,
    type DecryptResult,
    type EncryptReply,
    type EncryptRequest,
    type FlushReply,
    type HelloReply,
    type PingReply,
    STOPPED,
    type SyncReply,
    type SyncRequest,
} from "./protocol";
import { SyncBuffer } from "./syncBuffer";
import { quietly, setBounded } from "./util";

/**
 * The engine role: stock Element plus a tee on its `/sync` responses and the RPC server mirrors talk to.
 *
 *   server ──/sync──▶ fetch tee ──▶ SyncBuffer.add ─(client processed it: "sync" event)─▶ markProcessed
 *                                                                                           │
 *   mirror ──"sync" {since}──────────────────────────────────▶ SyncBuffer.lookup ◀─────────┘
 *   mirror ──"decrypt" / "encrypt" / "crypto"──▶ the engine's Rust crypto
 */

/** Below this many responses to replay, a booting mirror starts from the last snapshot without a new save. */
const MAX_REPLAY_ON_BOOT = 50;
/** Events kept for decrypt requests (see `mappedEvent`) and failed decryptions remembered (see `onDecrypt`). */
const MAX_EVENTS_KEPT = 5_000;
/** How many `flush` durations the stats keep. */
const FLUSH_STATS_KEPT = 20;
/** When the engine writes its tokens again after a mirror booted (see `repersistTokensSoon`). */
const REPERSIST_DELAYS_MS = [3_000, 15_000];

export class Engine {
    public readonly buffer = new SyncBuffer();
    public client: MatrixClientLike | null = null;
    private fenced = false;
    private savingForSize = false;
    private readyWaiters: Array<() => void> = [];
    private hookedStore: unknown = null;
    /** The sync token of the last store save, i.e. of the snapshot a mirror boots from. */
    private savedToken: string | null = null;
    /** Events built for mirrors' decrypt requests, by id, so a retry reuses the object RustCrypto already tracks. */
    private readonly mapped = new Map<string, any>();
    /**
     * Decryptions that failed, by event id, with the crypto generation they failed in. Until new room keys or
     * trust changes arrive (`cryptoGeneration`), asking again would fail the same way, only slower: every
     * booting mirror asks for the same undecryptable history.
     */
    private readonly failed = new Map<string, { gen: number; err: DecryptResult }>();
    private cryptoGeneration = 0;
    private lastToken: string | null = null;
    private tokenSeq = 0;
    /** When the client last processed a sync response (for the "Open tabs" list). */
    public lastSyncAt: number | null = null;
    /** An initial sync went out; its token arrives with the next "sync" event. */
    private initialSyncPending = false;
    private announced = false;
    public stats = {
        served: 0,
        parked: 0,
        resync: 0,
        decrypts: 0,
        encrypts: 0,
        cryptoCalls: 0,
        /** Main-thread time spent preparing /sync responses for mirrors (parse, strip, stringify). */
        teeMsTotal: 0,
        teeMsMax: 0,
        maxBodyBytes: 0,
        /** Duration of the store saves mirrors asked for (`flush`). */
        flushMs: [] as number[],
    };

    public constructor(
        private readonly channel: Channel,
        private readonly homeserver: () => string | null,
    ) {
        channel.isEngine = true;
        channel.handle("hello", () => this.onHello());
        channel.handle("flush", () => this.onFlush());
        channel.handle("sync", (p: SyncRequest) => this.onSync(p));
        channel.handle("decrypt", (p: DecryptRequest) => this.onDecrypt(p));
        channel.handle("encrypt", (p: EncryptRequest) => this.onEncrypt(p));
        channel.handle("crypto", (p: { method: string; args: unknown[] }) => this.onCrypto(p.method, p.args));
        channel.handle("token", (p: { stale: string | null }) => this.onToken(p?.stale ?? null));
        channel.handle("ping", (): PingReply => ({ state: this.fenced ? STOPPED : (this.client?.getSyncState() ?? null) }));
        channel.handle("cryptoSet", (p: { prop: string; value: unknown }) => this.onCryptoSet(p.prop, p.value));
        channel.handle("logout", () => this.onLogout());
        channel.handle("cryptoBatch", (p: { calls: Array<{ method: string; args: unknown[] }> }) => this.onCryptoBatch(p.calls));
    }

    /** Wraps `window.fetch` to tee `/sync` responses. Must run in `load()`, before Element creates its client. */
    public installFetchTee(): void {
        const orig = window.fetch.bind(window);
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const { url, method } = requestTarget(input, init);
            // Fenced (another tab took over): nothing may leave this tab any more, not even a token refresh.
            if (this.fenced) throw new TypeError("multi-tab: this tab lost the engine role");
            const hs = this.homeserver();
            if (!hs || classify(url, method, hs) !== "sync") return orig(input, init);
            const res = await orig(input, init);
            if (res.ok && !this.fenced) {
                const since = new URL(url, location.href).searchParams.get("since");
                // An initial sync (the biggest response by far) is never served to mirrors: don't copy and parse
                // it just for its token, the "sync" event brings that.
                if (!since) {
                    this.initialSyncPending = true;
                    return res;
                }
                // Read the clone without delaying js-sdk, which reads the original.
                void res
                    .clone()
                    .text()
                    .then((body) => {
                        const t0 = performance.now();
                        this.buffer.add(since, body);
                        const ms = performance.now() - t0;
                        this.stats.teeMsTotal += ms;
                        this.stats.teeMsMax = Math.max(this.stats.teeMsMax, ms);
                        this.stats.maxBodyBytes = Math.max(this.stats.maxBodyBytes, body.length);
                        this.maybeSaveForSize();
                    })
                    .catch((e) => console.warn("[multi-tab] Couldn't read /sync response", e));
            }
            return res;
        };
    }

    /** Hooks the client as soon as Element creates it. */
    public watchClientPeg(peg: ClientPegLike): void {
        const origSet = peg.set.bind(peg);
        peg.set = (client: MatrixClientLike): void => {
            origSet(client);
            this.attach(client);
        };
        const existing = peg.get();
        if (existing) this.attach(existing);
    }

    private attach(client: MatrixClientLike): void {
        if (this.client === client) return;
        this.client = client;

        client.on("sync", (state: string, _prev: string | null, data?: { nextSyncToken?: string }) => {
            const next = data?.nextSyncToken;
            if (next) this.lastSyncAt = Date.now();
            if (next && this.initialSyncPending) {
                this.initialSyncPending = false;
                this.buffer.startChain(next);
            } else if (next) this.buffer.markProcessed(next);
            if (state === "PREPARED" || state === "SYNCING") this.wakeReady();
        });

        const store = client.store;
        this.hookedStore = store;
        const origStartup = store.startup.bind(store);
        store.startup = async () => {
            await origStartup();
            this.savedToken = await store.getSavedSyncToken().catch(() => null);
            this.buffer.onSaved(this.savedToken);
        };
        // `getSavedSyncToken` reports the in-memory token, i.e. what the save is about to persist.
        const origSave = store.save.bind(store);
        store.save = async (force?: boolean) => {
            if (this.fenced) return;
            const willSave = force || store.wantsSave() ? await store.getSavedSyncToken().catch(() => null) : null;
            await origSave(force);
            if (!willSave) return;
            this.savedToken = willSave;
            this.buffer.onSaved(willSave);
        };

        const origInit = client.initRustCrypto.bind(client);
        client.initRustCrypto = async (args?: unknown) => {
            await origInit(args);
            this.hookCrypto(client);
        };

        for (const name of CRYPTO_EVENTS) {
            client.on(name, (...args: unknown[]) => {
                this.cryptoGeneration++;
                try {
                    this.channel.send("*", "cryptoEvent", encodeCryptoEvent(name, args));
                } catch (e) {
                    // An argument that can't be cloned: mirrors miss this event (none of today's has one).
                    console.warn(`[multi-tab] Couldn't pass on "${name}"`, e);
                }
            });
        }
    }

    /** Tells mirrors when room keys arrive, so they retry events they couldn't decrypt. */
    private hookCrypto(client: MatrixClientLike): void {
        const backend = client["cryptoBackend"];
        if (!backend || typeof backend.onRoomKeysUpdated !== "function") return;
        const orig = backend.onRoomKeysUpdated.bind(backend);
        backend.onRoomKeysUpdated = async (keys: Array<{ roomId: { toString(): string }; sessionId: string }>) => {
            const r = await orig(keys);
            this.cryptoGeneration++;
            try {
                const byRoom: Record<string, string[]> = {};
                for (const k of keys) (byRoom[k.roomId.toString()] ??= []).push(k.sessionId);
                this.channel.send("*", "roomKeys", byRoom);
            } catch (e) {
                console.warn("[multi-tab] Couldn't announce room keys", e);
            }
            return r;
        };
    }

    /** The lock was stolen by a forced takeover: never touch the server again. */
    public fence(): void {
        this.fenced = true;
        this.channel.isEngine = false;
        try {
            this.client?.stopClient();
        } catch {
            // ignore
        }
    }

    public goodbye(): void {
        this.channel.send("*", "goodbye");
    }

    private isReady(): boolean {
        const s = this.client?.getSyncState();
        return s === "PREPARED" || s === "SYNCING" || s === "CATCHUP" || s === "RECONNECTING" || s === "ERROR";
    }

    private whenReady(): Promise<void> {
        if (this.isReady()) return Promise.resolve();
        return new Promise((resolve) => this.readyWaiters.push(resolve));
    }

    private wakeReady(): void {
        if (!this.announced) {
            this.announced = true;
            // Mirrors attached to a previous engine (crashed, so no goodbye) learn about the new one at once.
            this.channel.send("*", "engineUp", { engineTab: this.channel.tabId });
        }
        for (const w of this.readyWaiters.splice(0)) w();
    }

    private onHello(): HelloReply {
        const owner = quietly(() => localStorage.getItem(SESSION_LOCK.owner), null);
        return { ready: this.isReady() && !this.storeBroken(), broken: this.storeBroken(), engineTab: this.channel.tabId, owner };
    }

    /** Element replaced the IndexedDB store by a MemoryStore after an error: nothing is saved for mirrors. */
    private storeBroken(): boolean {
        return !!this.client && !!this.hookedStore && this.client.store !== this.hookedStore;
    }

    private async onFlush(): Promise<FlushReply> {
        await this.whenReady();
        const client = this.client!;
        // A save costs a few hundred ms (more on big accounts). A mirror can boot from the last snapshot as long
        // as the buffer still has every response since, and replaying a few of those is cheaper. So many mirrors
        // booting at once (after a promotion) mostly share one save.
        const t0 = performance.now();
        const behind = this.savedToken ? this.buffer.entriesSince(this.savedToken) : null;
        if (behind === null || behind > MAX_REPLAY_ON_BOOT) await client.store.save(true);
        this.stats.flushMs.push(Math.round(performance.now() - t0));
        if (this.stats.flushMs.length > FLUSH_STATS_KEPT) this.stats.flushMs.shift();
        const token = this.savedToken;
        this.buffer.pin(token);
        this.repersistTokensSoon();
        const { accessToken, seq } = this.currentToken();
        return { token, accessToken, tokenSeq: seq };
    }

    /**
     * A booting tab writes back the tokens it read at boot (`Lifecycle.persistCredentials`). If the engine
     * refreshed meanwhile, that would store a refresh token that has already been rotated out, and the next cold
     * start would fail. Writing the engine's current tokens again after the mirror's boot fixes that.
     */
    private repersistTokensSoon(): void {
        const opts = this.client?.http.opts;
        if (!opts?.refreshToken || typeof opts.onTokenRefresh !== "function") return;
        for (const delay of REPERSIST_DELAYS_MS) {
            setTimeout(() => {
                const o = this.client?.http.opts;
                if (!o?.refreshToken) return;
                void Promise.resolve(o.onTokenRefresh({ accessToken: o.accessToken, refreshToken: o.refreshToken })).catch(
                    (e: unknown) => console.warn("[multi-tab] Couldn't re-persist tokens", e),
                );
            }, delay);
        }
    }

    /** A mirror got a 401: make sure the engine's token is current (refreshing if needed) and hand it over. */
    private async onToken(stale: string | null): Promise<{ accessToken: string | null }> {
        const client = this.client;
        if (!client?.getAccessToken()) throw new RpcError("The engine has no session yet", "NOT_READY");
        if (stale && client.getAccessToken() === stale) {
            // Any authenticated request makes js-sdk refresh an expired token.
            await client.whoami?.().catch(() => {});
        }
        return { accessToken: client.getAccessToken() };
    }

    private async onSync({ since, tokenSeq }: SyncRequest): Promise<SyncReply> {
        if (!this.buffer.head || since !== this.buffer.head) this.stats.served++;
        else this.stats.parked++;
        const r = await this.buffer.lookup(since);
        if ("resync" in r) {
            this.stats.resync++;
            return { resync: true };
        }
        const token = this.currentToken();
        const reply: SyncReply = { text: r.entry.text, next: r.entry.next, tokenSeq: token.seq };
        if (tokenSeq !== token.seq) reply.accessToken = token.accessToken;
        return reply;
    }

    /** The engine's access token, numbered: the number goes up whenever the token changes (refresh). */
    private currentToken(): { accessToken: string | null; seq: number } {
        const accessToken = this.client?.getAccessToken() ?? null;
        if (accessToken !== this.lastToken) {
            this.lastToken = accessToken;
            this.tokenSeq++;
        }
        return { accessToken, seq: this.tokenSeq };
    }

    private crypto(): any {
        const backend = this.client?.["cryptoBackend"];
        if (!backend) throw new RpcError("The engine has no crypto", "NO_CRYPTO");
        return backend;
    }

    private async onDecrypt(req: DecryptRequest): Promise<DecryptResult[]> {
        const crypto = this.crypto();
        this.stats.decrypts += req.events.length;
        const room = this.client!.getRoom(req.roomId);
        return Promise.all(
            req.events.map(async (raw): Promise<DecryptResult> => {
                const id = typeof raw.event_id === "string" ? raw.event_id : undefined;
                const gen = this.cryptoGeneration;
                try {
                    // The engine's own copy, if it has already decrypted it: no second decryption.
                    const own = id ? room?.findEventById(id) : undefined;
                    const clear = own && !own.isBeingDecrypted?.() && !own.isDecryptionFailure() ? own.clearEvent : undefined;
                    if (own && clear) {
                        return {
                            ok: {
                                clearEvent: clear,
                                senderCurve25519Key: own.getSenderKey() ?? undefined,
                                claimedEd25519Key: own.getClaimedEd25519Key() ?? undefined,
                                keyForwardedBy: own.getKeyForwardingUser?.() ?? undefined,
                            },
                        };
                    }
                    const known = id ? this.failed.get(id) : undefined;
                    if (known?.gen === gen) return known.err;
                    const res = await crypto.decryptEvent(this.mappedEvent(raw, req.roomId));
                    if (id) this.failed.delete(id);
                    return { ok: res };
                } catch (e) {
                    const code = (e as { code?: unknown }).code;
                    const err: DecryptResult = {
                        err: { code: typeof code === "string" ? code : "UNKNOWN_ERROR", message: String(e) },
                    };
                    if (id) setBounded(this.failed, id, { gen, err }, MAX_EVENTS_KEPT);
                    return err;
                }
            }),
        );
    }

    /**
     * RustCrypto remembers every event that failed for a missing key until the key arrives (keyed by object).
     * Reusing one object per event id keeps that list from growing with every mirror retry.
     */
    private mappedEvent(raw: Record<string, unknown>, roomId: string): any {
        const id = typeof raw.event_id === "string" ? raw.event_id : undefined;
        const hit = id ? this.mapped.get(id) : undefined;
        if (hit) return hit;
        const ev = this.client!.getEventMapper({ preventReEmit: true, decrypt: false })({ ...raw, room_id: raw.room_id ?? roomId });
        if (id) setBounded(this.mapped, id, ev, MAX_EVENTS_KEPT);
        return ev;
    }

    /** Crypto settings changed in a mirror (Element writes them on the crypto object): apply them here. */
    /**
     * A mirror signs out: revoke this session with the current tokens (they rotate here). This tab reloads once
     * the mirror's Element has cleared the storage and said `loggedOut`.
     */
    private async onLogout(): Promise<void> {
        const client = this.client;
        if (!client?.logout) throw new RpcError("The engine has no client", "NOT_READY");
        await client.logout(true);
    }

    private onCryptoSet(prop: string, value: unknown): void {
        if (prop !== "globalBlacklistUnverifiedDevices" && prop !== "globalErrorOnUnknownDevices") return;
        this.crypto()[prop] = value;
    }

    private async onEncrypt(req: EncryptRequest): Promise<EncryptReply> {
        const client = this.client!;
        const crypto = this.crypto();
        const room = client.getRoom(req.roomId);
        if (!room) throw new RpcError(`The engine doesn't know room ${req.roomId}`, "UNKNOWN_ROOM");
        const raw: Record<string, unknown> = {
            type: req.type,
            content: req.content,
            room_id: req.roomId,
            sender: client.getUserId(),
            event_id: `~multi-tab-${Date.now()}-${Math.random()}`,
        };
        if (req.stateKey !== undefined) raw.state_key = req.stateKey;
        const ev = client.getEventMapper({ preventReEmit: true, decrypt: false })(raw);
        await crypto.encryptEvent(ev, room);
        this.stats.encrypts++;
        return {
            type: ev.getWireType(),
            content: ev.getWireContent(),
            senderKey: ev.getSenderKey(),
            claimedKey: ev.getClaimedEd25519Key(),
        };
    }

    private async onCrypto(method: string, args: unknown[]): Promise<unknown> {
        this.stats.cryptoCalls++;
        return runForwarded(this.crypto(), this.client!, method, args, (raw, roomId) => this.mappedEvent(raw, roomId));
    }

    /** Several forwarded calls in one message (a mirror rendering a timeline asks for many shields at once). */
    private onCryptoBatch(calls: Array<{ method: string; args: unknown[] }>): Promise<BatchResult[]> {
        return Promise.all(
            calls.map((c) =>
                this.onCrypto(c.method, c.args).then(
                    (ok): BatchResult => ({ ok }),
                    (e: unknown): BatchResult => ({ err: toWireError(e) }),
                ),
            ),
        );
    }

    /** Keeps the buffer bounded on busy accounts by saving early. */
    private maybeSaveForSize(): void {
        if (!this.buffer.wantsSave || this.savingForSize || !this.client) return;
        this.savingForSize = true;
        void this.client.store
            .save(true)
            .catch((e) => console.warn("[multi-tab] Forced save failed", e))
            .finally(() => (this.savingForSize = false));
    }
}

/** Element's session lock of a dead engine, which would otherwise make the promoted tab wait up to 15 s. */
export function clearDeadEngineLock(local: Storage, deadOwner: string | undefined): void {
    if (!deadOwner) return;
    quietly(() => {
        if (local.getItem(SESSION_LOCK.owner) !== deadOwner) return;
        local.removeItem(SESSION_LOCK.ping);
        local.removeItem(SESSION_LOCK.owner);
    }, undefined);
}

