import { type Channel, RPC_TIMEOUT_MS, RpcError } from "./channel";
import { classify, requestTarget } from "./endpoints";
import { type FlushReply, type HelloReply, type PingReply, STOPPED, type SyncReply, type SyncRequest } from "./protocol";
import { type ClientPegLike, type MatrixClientLike, type PlatformLike } from "./hooks";
import { MirrorCrypto } from "./mirrorCrypto";
import { hideNotice, showNotice, showToast } from "./toast";
import { sleep } from "./util";

/**
 * The mirror role: a full Element whose `/sync` and crypto come from the engine tab.
 *
 *   load()                 patch session lock + notifications, route window.fetch
 *   Peg.set(client)        stub crypto, guard store writes, park store.startup on the handshake
 *   store.startup()        hello ─▶ welcome(ready) ─▶ flush ─▶ snapshot token T saved by the engine
 *   startClient            GET /sync?since=T ─▶ "sync" RPC ─▶ engine buffer
 */

/** How often a mirror asks an engine that isn't ready yet (or isn't there) whether it is. */
const HELLO_RETRY_MS = 1_000;
/** How often a mirror asks whether the engine has finished the identity confirmation after a fresh login. */
const VERIFY_POLL_MS = 2_000;
/** Element: set at a fresh login, forces that confirmation in every tab until cross-signing is ready. */
const FORCE_VERIFICATION_FLAG = "force_verification_on_at_login";
/** A mirror's /sync waits this long for an engine before it fails like a network error. */
const SYNC_TIMEOUT_MS = 90_000;
/**
 * The watchdog pings the engine this often. After a miss it checks again sooner, and after several misses in a
 * row, while the engine still holds the lock, it takes over: at most about 15 + 5 + (5 + 5) × 2 = 40 s after
 * the engine froze. A busy engine answers within the timeout (the ping is a message event, not a timer).
 */
const PING_INTERVAL_MS = 15_000;
const PING_TIMEOUT_MS = 5_000;
const PING_RETRY_MS = 5_000;
const PINGS_BEFORE_TAKEOVER = 3;

/** IndexedDBStore methods that write to IndexedDB and do nothing at all in a mirror (invariant I4). */
const STORE_NOOPS = ["save", "setSyncData", "deleteAllData", "saveToDeviceBatches", "removeToDeviceBatch"] as const;
/**
 * IndexedDBStore methods that update the in-memory `MemoryStore` and then IndexedDB. A mirror keeps the
 * in-memory part only.
 */
const STORE_MEMORY_ONLY = [
    "storeClientOptions",
    "setOutOfBandMembers",
    "clearOutOfBandMembers",
    "storeUserProfiles",
    "removeUserProfiles",
] as const;

export interface MirrorDeps {
    channel: Channel;
    homeserver: string;
    /**
     * Starts this tab over from the engine's latest snapshot: the engine doesn't know our sync token (invariant
     * I3), js-sdk wants an initial sync (no snapshot), or a new engine took over.
     */
    reload(reason: string): void;
    /** Called when the engine has been unresponsive long enough to take over. */
    takeover(): void;
    /** Whether the engine lock is currently held by someone. */
    engineLockHeld(): Promise<boolean>;
}

export class Mirror {
    public client: MatrixClientLike | null = null;
    public crypto: MirrorCrypto;
    /** Element session-lock owner id of the current engine. */
    public engineOwner: string | null = null;
    /** Tab id of the engine this mirror is attached to. */
    public engineTab: string | null = null;
    private engineUp: Promise<void>;
    private markEngineUp!: () => void;
    private accessToken: string | null = null;
    /** Which of the engine's access tokens this tab has (see `SyncRequest.tokenSeq`). */
    private tokenSeq?: number;
    private missedPings = 0;
    /** When the engine last answered a sync (for the "Open tabs" list). */
    public lastSyncAt: number | null = null;
    public stats = { syncs: 0, forbidden: 0, retries401: 0 };

    public constructor(private readonly deps: MirrorDeps) {
        this.engineUp = new Promise((r) => (this.markEngineUp = r));
        this.crypto = new MirrorCrypto(deps.channel);
        deps.channel.handle("goodbye", (_p: unknown, msg: { from: string }) => {
            if (!this.engineTab || msg.from === this.engineTab) this.onEngineGone();
        });
        deps.channel.handle("engineUp", (p: { engineTab: string }) => this.onEngineUp(p.engineTab));
        deps.channel.handle("roomKeys", (byRoom: Record<string, string[]>) => this.crypto.onRoomKeys(byRoom));
        deps.channel.handle("cryptoEvent", (e: { name: string; args: unknown[] }) => this.onCryptoEvent(e));
    }

    /** Element's own lock and notifications: the engine tab owns both. */
    public patchPlatform(platform: PlatformLike): void {
        platform.getSessionLock = async () => true;
        platform.checkSessionLockFree = () => true;
        platform.displayNotification = () => {};
        platform.loudNotification = () => {};
    }

    /** Keeps Element's device/backup nags in the engine tab: this tab has no keys of its own to report on. */
    public suppressDeviceListener(): void {
        const w = window as unknown as Record<string, unknown>;
        const patch = (v: unknown): unknown => {
            if (v && typeof v === "object" && "start" in v) (v as { start(): void }).start = () => {};
            return v;
        };
        let current = patch(w.mxDeviceListener);
        try {
            Object.defineProperty(w, "mxDeviceListener", {
                configurable: true,
                get: () => current,
                set: (v) => (current = patch(v)),
            });
        } catch (e) {
            console.warn("[multi-tab] Couldn't hook the device listener", e);
        }
    }

    public installFetchRouter(): void {
        const orig = window.fetch.bind(window);
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
            const { url, method } = requestTarget(input, init);
            const body = init?.body instanceof URLSearchParams ? init.body.toString() : init?.body;
            const route = classify(url, method, this.deps.homeserver, body);
            switch (route) {
                case "foreign":
                    return orig(input, init);
                case "forbidden":
                    this.stats.forbidden++;
                    console.warn(`[multi-tab] Blocked ${method} ${new URL(url, location.href).pathname} in a mirror tab`);
                    return jsonResponse(403, { errcode: "M_FORBIDDEN", error: "Not available in this tab (multi-tab)" });
                case "sync":
                    return this.syncViaEngine(url, init?.signal ?? undefined);
                case "homeserver":
                    return orig(input, init);
            }
        };
    }

    private async freshToken(): Promise<string | null> {
        await this.engineUp;
        const r = await this.deps.channel.request<{ accessToken: string | null }>(
            "engine",
            "token",
            { stale: this.client?.getAccessToken() ?? null },
            RPC_TIMEOUT_MS,
        );
        this.setToken(r.accessToken);
        return r.accessToken;
    }

    private setToken(token: string | null | undefined, seq?: number): void {
        if (seq !== undefined) this.tokenSeq = seq;
        if (!token || token === this.accessToken) return;
        this.accessToken = token;
        const c = this.client;
        if (c && c.getAccessToken() !== token) c.setAccessToken?.(token);
    }

    private async syncViaEngine(url: string, signal?: AbortSignal): Promise<Response> {
        const since = new URL(url, location.href).searchParams.get("since");
        if (!since) {
            // An initial sync can only mean the snapshot is gone (e.g. the store fell back to memory).
            this.deps.reload("mirror would need an initial sync");
            return new Promise<Response>(() => {});
        }
        const reply = await abortable(
            (async () => {
                await this.engineUp;
                const req: SyncRequest = { since, tokenSeq: this.tokenSeq };
                return this.deps.channel.request<SyncReply>("engine", "sync", req, SYNC_TIMEOUT_MS);
            })(),
            signal,
        ).catch((e: unknown) => {
            if ((e as Error)?.name === "AbortError") throw e;
            // Looks like a network error to js-sdk, which retries.
            throw new TypeError(`multi-tab: no answer from the engine (${(e as Error)?.message ?? e})`);
        });
        if (reply.resync) {
            this.deps.reload(`engine doesn't know sync token ${since}`);
            return new Promise<Response>(() => {});
        }
        this.stats.syncs++;
        this.lastSyncAt = Date.now();
        if (reply.accessToken !== undefined) this.setToken(reply.accessToken, reply.tokenSeq);
        return new Response(reply.text, { status: 200, headers: { "Content-Type": "application/json" } });
    }

    /** Hooks the client the moment Element creates it, before `assign()` starts its store and crypto. */
    public watchClientPeg(peg: ClientPegLike): void {
        const origSet = peg.set.bind(peg);
        peg.set = (client: MatrixClientLike): void => {
            this.patchClient(client);
            origSet(client);
        };
    }

    private patchClient(client: MatrixClientLike): void {
        this.client = client;
        this.crypto.attach(client);

        // Invariant I5: never open the Rust crypto store.
        client.initRustCrypto = async () => {
            client["cryptoBackend"] = this.crypto.backend;
        };

        // Invariant I4: never write the shared sync store.
        const store = client.store;
        const memoryStore = Object.getPrototypeOf(Object.getPrototypeOf(store)) as Record<string, unknown>;
        for (const name of STORE_NOOPS) {
            if (typeof store[name] === "function") store[name] = async () => {};
        }
        for (const name of STORE_MEMORY_ONLY) {
            const inMemory = memoryStore?.[name];
            if (typeof store[name] !== "function") continue;
            store[name] = async (...args: unknown[]) => {
                if (typeof inMemory === "function") await inMemory.apply(store, args);
            };
        }
        store.wantsSave = () => false;
        // Any error in an IndexedDBStore method makes it delete the whole database: the engine's too.
        const guardBackend = (): void => {
            const backend = store["_backend"] ?? store["backend"];
            if (backend && typeof backend.clearDatabase === "function") {
                backend.clearDatabase = async () => console.warn("[multi-tab] Kept the shared sync store from being deleted");
            }
        };
        guardBackend();

        // Boot from the snapshot the engine has just saved.
        const origStartup = store.startup.bind(store);
        store.startup = async () => {
            await this.handshake();
            await origStartup();
            // startup may have swapped the worker backend for a local one: guard that one too.
            guardBackend();
        };

        redirectTokenRefresh(client, () => this.freshToken());
        this.redirectLogout(client);

        // The to-device queue is shared in IndexedDB: only the engine may drain it.
        const queue = client["toDeviceMessageQueue"];
        if (queue) {
            queue.start = () => {};
            queue.stop?.();
        }

        // The engine notifies; a mirror is "silenced" like a session whose notifications are turned off.
        const silenced = `m.local_notification_settings.${client.getDeviceId()}`;
        const origGetAccountData = client.getAccountData?.bind(client);
        if (origGetAccountData) {
            client.getAccountData = (type: string) =>
                type === silenced ? { getContent: () => ({ is_silenced: true }), getType: () => type } : origGetAccountData(type);
        }
    }

    /**
     * The engine refreshes the tokens, so this tab's refresh token is out of date: signing out here would revoke
     * the access token only, and maybe not end the session (on servers where the refresh token outlives it).
     * The engine signs out with the current tokens. Element then goes on as usual here: it clears the storage
     * every tab shares and tells the others (`loggedOut`).
     */
    private redirectLogout(client: MatrixClientLike): void {
        const ownLogout = client.logout?.bind(client);
        if (!ownLogout) return;
        client.logout = async (stopClient?: boolean) => {
            if (stopClient) client.stopClient();
            try {
                await this.deps.channel.request("engine", "logout", null, RPC_TIMEOUT_MS);
                return {};
            } catch (e) {
                console.warn("[multi-tab] The engine tab didn't sign out; signing out from this tab", e);
                return ownLogout(false);
            }
        };
    }

    /** hello until an engine is ready, then flush so the snapshot in IndexedDB is fresh. */
    private async handshake(): Promise<void> {
        await this.helloUntilReady((hello) => {
            if (hello.broken) showToast("Your main Element tab can't share its data (storage error). Reload that tab.");
        });
        await this.waitForVerifiedEngine();
        const flushed = await this.deps.channel.request<FlushReply>("engine", "flush", null, SYNC_TIMEOUT_MS);
        this.setToken(flushed.accessToken, flushed.tokenSeq);
        this.markEngineUp();
        this.crypto.retryRpcFailures();
        this.startWatchdog();
    }

    /** Asks `hello` until an engine answers that it is ready, and remembers which tab that is. */
    private async helloUntilReady(notReady?: (hello: HelloReply) => void): Promise<void> {
        for (;;) {
            try {
                const hello = await this.deps.channel.request<HelloReply>("engine", "hello", null, HELLO_RETRY_MS);
                this.engineOwner = hello.owner;
                this.engineTab = hello.engineTab;
                if (hello.ready) return;
                notReady?.(hello);
            } catch {
                // no engine yet, or it is still starting
            }
            await sleep(HELLO_RETRY_MS);
        }
    }

    /**
     * After a fresh login Element makes every tab that starts with the session confirm the device's identity until
     * cross-signing is ready (`force_verification_on_at_login`). That happens in the engine; a mirror starting
     * meanwhile would show the same screen and never leave it, so it waits here, before Element looks.
     */
    private async waitForVerifiedEngine(): Promise<void> {
        let waiting = false;
        for (;;) {
            let ready = true;
            try {
                if (localStorage.getItem(FORCE_VERIFICATION_FLAG)) {
                    ready = await this.deps.channel.request<boolean>(
                        "engine",
                        "crypto",
                        { method: "isCrossSigningReady", args: [] },
                        HELLO_RETRY_MS,
                    );
                }
            } catch {
                // the engine is busy or went away: ask again
                ready = false;
            }
            if (ready) break;
            if (!waiting) {
                waiting = true;
                console.info("[multi-tab] Waiting until the engine tab has confirmed this device's identity");
                showNotice("Finish signing in in your other Element tab: this tab will follow by itself.");
            }
            await sleep(VERIFY_POLL_MS);
        }
        if (waiting) hideNotice();
    }

    private onEngineGone(): void {
        this.engineUp = new Promise((r) => (this.markEngineUp = r));
        this.deps.channel.failPending(new RpcError("The engine tab went away", "ENGINE_GONE"));
        // The next engine is a promoted mirror on a fresh chain: wait for it (its engineUp makes us reload).
        void this.helloUntilReady().then(() => {
            this.markEngineUp();
            this.crypto.retryRpcFailures();
        });
    }

    /**
     * A new engine is running. If it isn't ours, ours crashed (no goodbye): our sync token is on the old engine's
     * chain, which the new one doesn't know, so start over from its snapshot.
     */
    private onEngineUp(engineTab: string): void {
        if (!this.engineTab || engineTab === this.engineTab) return;
        this.deps.reload("a new engine tab took over");
    }

    private onCryptoEvent(e: { name: string; args: unknown[] }): void {
        const args = this.crypto.decodeEvent(e.name, e.args);
        if (args) this.client?.emit(e.name, ...args);
    }

    /** Detects an engine that holds the lock but doesn't answer (frozen or hung tab). */
    private startWatchdog(): void {
        const tick = async (): Promise<void> => {
            let alive = false;
            try {
                const pong = await this.deps.channel.request<PingReply>("engine", "ping", null, PING_TIMEOUT_MS);
                // An engine whose client stopped (soft logout, Element's lock taken by another tab) holds the lock
                // but will never sync again.
                alive = pong?.state !== STOPPED;
            } catch {
                // no answer
            }
            if (alive) this.missedPings = 0;
            else if (await this.deps.engineLockHeld()) this.missedPings++;
            else this.missedPings = 0;
            if (this.missedPings >= PINGS_BEFORE_TAKEOVER) {
                console.warn("[multi-tab] The engine tab stopped answering; taking over");
                this.deps.takeover();
                return;
            }
            setTimeout(() => void tick(), this.missedPings ? PING_RETRY_MS : PING_INTERVAL_MS);
        };
        setTimeout(() => void tick(), PING_INTERVAL_MS);
    }
}

/**
 * js-sdk refreshes an expired token by itself (`http-api/refresh.ts`, `TokenManager.doTokenRefresh`). In a mirror
 * that would rotate the refresh token behind the engine's back, and removing the refresh token would turn the
 * next 401 into a logout that wipes the storage all tabs share. So the mirror asks the engine for its current
 * token instead, and js-sdk's own retry and de-duplication stay as they are. The refresh token stays (unused),
 * as js-sdk also reads it when it revokes the tokens.
 */
export function redirectTokenRefresh(client: MatrixClientLike, fresh: () => Promise<string | null>): void {
    const tm = (client.http as Record<string, any>).tokenManager;
    if (!tm) return;
    // Never "logout": that would make Element log out the device and wipe the storage every tab shares. Only the
    // engine decides that the session is over.
    tm.doTokenRefresh = async (): Promise<"success" | "failure"> => {
        const stale = tm.opts.accessToken;
        try {
            const token = await fresh();
            // The same token again means the engine can't do better (revoked, soft logout): fail this request
            // instead of retrying it in a loop.
            if (!token || token === stale) return "failure";
            tm.opts.accessToken = token;
            return "success";
        } catch {
            return "failure";
        }
    };
}

function jsonResponse(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function abortable<T>(p: Promise<T>, signal?: AbortSignal): Promise<T> {
    if (!signal) return p;
    if (signal.aborted) return Promise.reject(new DOMException("Aborted", "AbortError"));
    return new Promise<T>((resolve, reject) => {
        const onAbort = (): void => reject(new DOMException("Aborted", "AbortError"));
        signal.addEventListener("abort", onAbort, { once: true });
        p.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
    });
}
