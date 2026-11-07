/**
 * Request/response messaging between the tabs of one Element session, over `BroadcastChannel`s.
 *
 *   <base>             messages to "*" (every tab)
 *   <base>/engine      messages to "engine": only the engine tab listens
 *   <base>/tab/<id>    messages to one tab (replies, mostly): only that tab listens
 *
 * A `BroadcastChannel` copies each message to every listener, so with one shared channel a sync reply for one
 * mirror would be copied into all of them. `<base>` contains the session fingerprint, and every message carries
 * it too (`fp`), so tabs of a different session, device or build never act on each other's messages.
 */

export const PROTOCOL = 2;
/** How long a request to the engine may take, unless the caller says otherwise. */
export const RPC_TIMEOUT_MS = 20_000;
/** Posting ports to other tabs' inboxes kept open; the oldest is closed beyond this. */
const MAX_TAB_PORTS = 32;

export interface Envelope {
    v: number;
    fp: string;
    from: string;
    /** A tab id, `"engine"` (whichever tab is the engine) or `"*"` (everyone). */
    to: string;
    type: string;
    /** Set on requests that want a reply. */
    id?: number;
    /** Set on replies: the `id` of the request. */
    re?: number;
    payload?: unknown;
    error?: WireError;
}

export interface WireError {
    name: string;
    message: string;
    code?: string;
}

export class RpcError extends Error {
    public constructor(
        message: string,
        public readonly code?: string,
        name = "RpcError",
    ) {
        super(message);
        this.name = name;
    }
}

export class TimeoutError extends RpcError {
    public constructor(type: string, ms: number) {
        super(`No answer to "${type}" within ${ms} ms`, "TIMEOUT", "TimeoutError");
    }
}

type Handler = (payload: any, msg: Envelope) => unknown;

interface Pending {
    resolve(v: unknown): void;
    reject(e: unknown): void;
    timer: ReturnType<typeof setTimeout>;
    /** For `collect`: called for every reply, the request stays open until its timer ends. */
    each?(from: string, payload: unknown): void;
}

/** The part of `BroadcastChannel` we use, so tests can pass a fake. */
export interface Port {
    postMessage(msg: unknown): void;
    addEventListener(type: "message", fn: (ev: MessageEvent) => void): void;
    close(): void;
}

export type OpenPort = (name: string) => Port;

/** One answer to `collect`. */
export interface Collected<T> {
    from: string;
    payload: T;
    /** Milliseconds from the question to this answer. */
    receivedMs: number;
}

export class Channel {
    private nextId = 1;
    private readonly pending = new Map<number, Pending>();
    private readonly handlers = new Map<string, Handler>();
    private readonly shared: Port;
    private readonly inbox: Port;
    /** Listens on the engine inbox while this tab is the engine. */
    private engineInbox: Port | null = null;
    /** For posting only: the engine inbox, and other tabs' inboxes (most recent last). */
    private toEngine: Port | null = null;
    private readonly toTabs = new Map<string, Port>();

    public constructor(
        private readonly open: OpenPort,
        private readonly base: string,
        public readonly tabId: string,
        public readonly fp: string,
    ) {
        this.shared = this.listen(base);
        this.inbox = this.listen(`${base}/tab/${tabId}`);
    }

    private listen(name: string): Port {
        const port = this.open(name);
        port.addEventListener("message", (ev) => this.onMessage(ev.data as Envelope));
        return port;
    }

    /** Whether this tab answers messages addressed to `"engine"`. */
    public get isEngine(): boolean {
        return this.engineInbox !== null;
    }

    public set isEngine(on: boolean) {
        if (on === this.isEngine) return;
        if (on) this.engineInbox = this.listen(`${this.base}/engine`);
        else {
            this.engineInbox!.close();
            this.engineInbox = null;
        }
    }

    /** Registers the handler for a message type. Its return value (or rejection) is the reply to a request. */
    public handle(type: string, fn: Handler): void {
        this.handlers.set(type, fn);
    }

    public send(to: string, type: string, payload?: unknown): void {
        this.post({ v: PROTOCOL, fp: this.fp, from: this.tabId, to, type, payload });
    }

    public request<T = unknown>(to: string, type: string, payload: unknown, timeoutMs: number): Promise<T> {
        const id = this.nextId++;
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new TimeoutError(type, timeoutMs));
            }, timeoutMs);
            this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });
            this.post({ v: PROTOCOL, fp: this.fp, from: this.tabId, to, type, id, payload });
        });
    }

    /**
     * Asks every tab (`"*"`) and gathers the replies that arrive within `ms`. Tabs that don't handle `type`
     * don't answer.
     */
    public collect<T = unknown>(type: string, payload: unknown, ms: number): Promise<Array<Collected<T>>> {
        const id = this.nextId++;
        const sent = Date.now();
        const replies: Array<Collected<T>> = [];
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                resolve(replies);
            }, ms);
            this.pending.set(id, {
                resolve: () => {},
                reject: () => {},
                timer,
                each: (from, p) => replies.push({ from, payload: p as T, receivedMs: Date.now() - sent }),
            });
            this.post({ v: PROTOCOL, fp: this.fp, from: this.tabId, to: "*", type, id, payload });
        });
    }

    /** Rejects every outstanding request, e.g. when the engine went away and they will never be answered. */
    public failPending(error: Error): void {
        for (const [id, p] of this.pending) {
            if (p.each) continue;
            clearTimeout(p.timer);
            p.reject(error);
            this.pending.delete(id);
        }
    }

    public close(): void {
        this.failPending(new RpcError("Channel closed", "CLOSED"));
        for (const port of [this.shared, this.inbox, this.engineInbox, this.toEngine, ...this.toTabs.values()]) {
            port?.close();
        }
        this.engineInbox = this.toEngine = null;
        this.toTabs.clear();
    }

    private post(msg: Envelope): void {
        this.portFor(msg.to).postMessage(msg);
    }

    private portFor(to: string): Port {
        if (to === "*") return this.shared;
        if (to === "engine") return (this.toEngine ??= this.open(`${this.base}/engine`));
        let port = this.toTabs.get(to);
        if (port) this.toTabs.delete(to);
        else port = this.open(`${this.base}/tab/${to}`);
        this.toTabs.set(to, port);
        if (this.toTabs.size > MAX_TAB_PORTS) {
            const [oldest, old] = this.toTabs.entries().next().value!;
            this.toTabs.delete(oldest);
            old.close();
        }
        return port;
    }

    private addressedToMe(msg: Envelope): boolean {
        return msg.to === this.tabId || msg.to === "*" || (msg.to === "engine" && this.isEngine);
    }

    private onMessage(msg: Envelope): void {
        if (!msg || msg.v !== PROTOCOL || msg.fp !== this.fp || msg.from === this.tabId) return;
        if (!this.addressedToMe(msg)) return;

        if (msg.re !== undefined) {
            const p = this.pending.get(msg.re);
            if (!p) return;
            if (p.each) {
                if (!msg.error) p.each(msg.from, msg.payload);
                return;
            }
            this.pending.delete(msg.re);
            clearTimeout(p.timer);
            if (msg.error) p.reject(new RpcError(msg.error.message, msg.error.code, msg.error.name));
            else p.resolve(msg.payload);
            return;
        }

        const handler = this.handlers.get(msg.type);
        if (!handler) return;
        if (msg.id === undefined) {
            void Promise.resolve()
                .then(() => handler(msg.payload, msg))
                .catch((e) => console.warn(`[multi-tab] Handler for "${msg.type}" failed`, e));
            return;
        }
        const id = msg.id;
        void Promise.resolve()
            .then(() => handler(msg.payload, msg))
            .then(
                (payload) => this.post({ v: PROTOCOL, fp: this.fp, from: this.tabId, to: msg.from, type: msg.type, re: id, payload }),
                (e: unknown) =>
                    this.post({
                        v: PROTOCOL,
                        fp: this.fp,
                        from: this.tabId,
                        to: msg.from,
                        type: msg.type,
                        re: id,
                        error: toWireError(e),
                    }),
            );
    }
}

export function toWireError(e: unknown): WireError {
    if (e instanceof Error) {
        const code = (e as { code?: unknown }).code;
        return { name: e.name, message: e.message, code: typeof code === "string" ? code : undefined };
    }
    return { name: "Error", message: String(e) };
}
