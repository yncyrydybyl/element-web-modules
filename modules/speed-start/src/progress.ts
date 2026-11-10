/**
 * What Element is doing while it starts, read from its Matrix client (`window.mxMatrixClientPeg`).
 * The public module API has nothing for this, so every read is guarded: if Element's internals
 * change, the probe reports "session" forever and the card just shows the first step.
 */

/**
 * The steps of a start, in order:
 * - `session`: Element is restoring the login from this browser (no client yet).
 * - `storage`: the client opens its cache in IndexedDB (`store.startup()`).
 * - `keys`: the encryption keys are opened (`initRustCrypto`).
 * - `rooms`: the cached rooms are rebuilt, one by one.
 * - `download`: no cache (first start on this device): waiting for the server's first answer.
 * - `waiting`: the server doesn't answer (sync error, reconnecting).
 * - `ready`: the first sync is done; Element is about to show the room list.
 */
export type Stage = "session" | "storage" | "keys" | "rooms" | "download" | "waiting" | "ready";

export const STEPS = ["session", "storage", "keys", "rooms"] as const;

export interface Probe {
    stage: Stage;
    /** Rooms the client knows so far. */
    rooms: number;
    /** The user's server name, e.g. `example.org`. */
    server?: string;
    /** The homeserver's base URL, to tell its requests from others. */
    baseUrl?: string;
}

interface ProbedClient {
    getDomain?(): string | null;
    getHomeserverUrl?(): string;
    getRooms?(): unknown[];
    getSyncState?(): string | null;
    getCrypto?(): unknown;
    store?: { startedUp?: unknown };
}

declare global {
    interface Window {
        mxMatrixClientPeg?: { get?(): ProbedClient | null };
    }
}

/** How long the room count may stay at 0 after the keys are open before we call it a download. */
export const EMPTY_CACHE_MS = 2_500;

export class StartProbe {
    private keysAt?: number;

    /** @param fresh - no cache is expected (a start right after logging in). */
    public constructor(
        private readonly fresh = false,
        private readonly win: Window = window,
        private readonly now: () => number = Date.now,
    ) {}

    public read(): Probe {
        let client: ProbedClient | null | undefined;
        try {
            client = this.win.mxMatrixClientPeg?.get?.();
        } catch {
            client = undefined;
        }
        if (!client) return { stage: "session", rooms: 0 };

        const server = safe(() => client.getDomain?.() ?? undefined);
        const baseUrl = safe(() => client.getHomeserverUrl?.());
        const rooms = safe(() => client.getRooms?.().length) ?? 0;
        const base = { rooms, server, baseUrl };
        const sync = safe(() => client.getSyncState?.());
        if (sync === "PREPARED" || sync === "SYNCING" || sync === "CATCHUP") return { ...base, stage: "ready" };
        if (sync === "ERROR" || sync === "RECONNECTING") return { ...base, stage: "waiting" };
        // `startedUp` is a private field of the IndexedDB store; a memory store has none.
        if (client.store?.startedUp === false) return { ...base, stage: "storage" };
        if (!safe(() => client.getCrypto?.())) return { ...base, stage: "keys" };

        this.keysAt ??= this.now();
        if (rooms > 0) return { ...base, stage: "rooms" };
        if (this.fresh || this.now() - this.keysAt >= EMPTY_CACHE_MS) return { ...base, stage: "download" };
        return { ...base, stage: "rooms" };
    }
}

function safe<T>(read: () => T): T | undefined {
    try {
        return read();
    } catch {
        return undefined;
    }
}

/**
 * Calls `onRequest` whenever a request to the homeserver finishes, from the browser's resource
 * timing. Only the URL's origin is looked at, nothing is stored.
 */
export function watchRequests(isHomeserver: (url: string) => boolean, onRequest: () => void): () => void {
    if (typeof PerformanceObserver === "undefined") return () => {};
    let observer: PerformanceObserver;
    try {
        observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) if (isHomeserver(entry.name)) onRequest();
        });
        observer.observe({ type: "resource", buffered: false });
    } catch {
        return () => {};
    }
    return () => observer.disconnect();
}
