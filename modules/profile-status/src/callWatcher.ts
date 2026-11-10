/**
 * Automatic "In a call": watches Element's CallStore (the set of calls this device is connected
 * to: Element Call, group calls, video rooms) and writes MSC4426's `m.call` field while the set is
 * non-empty. `m.status` is never touched, so whatever status the user set is still there afterwards.
 *
 * Element 1.12.33 creates the store's listener as `window.mxCallStatusListener` (its own MSC4426
 * code, active only with the `feature_user_status` labs flag) and keeps the CallStore in its private
 * `callStore` field. That is the only handle on it from outside; without it the feature is off.
 */

export interface CallStoreLike {
    connectedCalls: Set<unknown>;
    on(event: string, listener: (now: Set<unknown>, prev: Set<unknown>) => void): unknown;
    off?(event: string, listener: (now: Set<unknown>, prev: Set<unknown>) => void): unknown;
    removeListener?(event: string, listener: (now: Set<unknown>, prev: Set<unknown>) => void): unknown;
}

/** `CallStoreEvent.ConnectedCalls` in Element. */
export const CONNECTED_CALLS = "connected_calls";
/** This device set `m.call` and hasn't cleared it yet (survives a closed tab). */
export const CALL_FLAG_KEY = "datanauten_profilestatus_call_set";
/** An `m.call` older than this is considered left over from a crashed client. */
export const STALE_CALL_MS = 12 * 60 * 60 * 1000;
/** Leaving and re-joining within this time doesn't produce two profile updates (MSC4426 asks for debouncing). */
export const DEBOUNCE_MS = 2000;

export function getElementCallStore(): CallStoreLike | undefined {
    const listener = (window as { mxCallStatusListener?: { callStore?: unknown } }).mxCallStatusListener;
    const store = listener?.callStore as CallStoreLike | undefined;
    if (!store || typeof store.on !== "function" || !(store.connectedCalls instanceof Set)) return undefined;
    return store;
}

interface Options {
    store(): CallStoreLike | undefined;
    /** Writes (`true`) or deletes (`false`) `m.call`. */
    write(inCall: boolean): Promise<void>;
    /** False while Element's own MSC4426 code handles `m.call`, or the user turned the feature off. */
    enabled(): boolean;
    onChange?(inCall: boolean): void;
}

export class CallWatcher {
    private store?: CallStoreLike;
    private written = false;
    private timer?: ReturnType<typeof setTimeout>;

    public constructor(private readonly opts: Options) {}

    /** Starts watching; false if Element's CallStore isn't reachable (yet). */
    public attach(): boolean {
        const store = this.opts.store();
        if (!store) return false;
        if (store === this.store) return true;
        this.detach();
        this.store = store;
        store.on(CONNECTED_CALLS, this.onConnectedCalls);
        return true;
    }

    public detach(): void {
        if (this.timer) clearTimeout(this.timer);
        if (!this.store) return;
        if (this.store.off) this.store.off(CONNECTED_CALLS, this.onConnectedCalls);
        else this.store.removeListener?.(CONNECTED_CALLS, this.onConnectedCalls);
        this.store = undefined;
    }

    public get inCall(): boolean {
        return (this.store?.connectedCalls.size ?? 0) > 0;
    }

    /**
     * At start-up: clears an `m.call` this device left behind (tab closed during a call), or one so
     * old that no client can still be in that call.
     */
    public async cleanUp(currentCallSince: number | undefined, now = Date.now()): Promise<void> {
        if (!this.opts.enabled() || this.inCall || currentCallSince === undefined) {
            if (currentCallSince === undefined) clearFlag();
            return;
        }
        if (readFlag() || now - currentCallSince > STALE_CALL_MS) await this.apply(false);
    }

    private onConnectedCalls = (now: Set<unknown>, prev: Set<unknown>): void => {
        const inCall = now.size > 0;
        if (inCall === prev.size > 0) return;
        this.opts.onChange?.(inCall);
        if (!this.opts.enabled()) return;
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.timer = undefined;
            if (this.written !== this.inCall) void this.apply(this.inCall);
        }, DEBOUNCE_MS);
    };

    private async apply(inCall: boolean): Promise<void> {
        try {
            await this.opts.write(inCall);
            this.written = inCall;
            if (inCall) setFlag();
            else clearFlag();
        } catch (e) {
            console.warn("[profile-status] Updating m.call failed", e);
        }
    }
}

function readFlag(): boolean {
    try {
        return localStorage.getItem(CALL_FLAG_KEY) === "1";
    } catch {
        return false;
    }
}

function setFlag(): void {
    try {
        localStorage.setItem(CALL_FLAG_KEY, "1");
    } catch {
        // Private mode etc.: only the stale-call clean-up gets less precise.
    }
}

function clearFlag(): void {
    try {
        localStorage.removeItem(CALL_FLAG_KEY);
    } catch {
        // see setFlag
    }
}
