import { DEVICE_FIELDS } from "./endpoints";

/**
 * The engine's recent `/sync` responses, chained by token, from which mirrors are served.
 *
 *   saved[0] ──▶ … ──▶ saved[1] ──▶ … ──▶ latest next_batch
 *   (previous store save)  (last save)      (mirrors long-poll here)
 *
 * A mirror boots from the IndexedDB snapshot, which is at one of the last save tokens, so the buffer keeps
 * everything from the oldest of the last three, and from any token recently handed to a booting mirror. A
 * response becomes visible to mirrors only once the engine's own client has processed it (`markProcessed`), so
 * room keys from the same response are already in the engine's crypto store when a mirror asks to decrypt.
 */

/** How many store saves back a mirror's snapshot may be. */
const KEEP_SAVES = 3;
/** How long a token handed to a booting mirror stays servable. */
const PIN_MS = 60_000;
/** Parked requests beyond this many are answered with resync (oldest first), so a stalled engine can't pile them up. */
const MAX_WAITERS = 200;

export interface SyncEntry {
    since: string;
    next: string;
    /** Response body without device-level fields. */
    text: string;
    bytes: number;
    /** Whether the original response carried to-device events (a hint that new room keys may have arrived). */
    hadToDevice: boolean;
    ready: boolean;
}

export type Lookup = { entry: SyncEntry } | { resync: true };

interface Waiter {
    since: string;
    resolve(r: Lookup): void;
}

export class SyncBuffer {
    private readonly bySince = new Map<string, SyncEntry>();
    private readonly waiters: Waiter[] = [];
    private latestNext: string | null = null;
    /** The last store save tokens, oldest first. A mirror may have booted from any of them. */
    private saved: string[] = [];
    /** Tokens handed to booting mirrors recently (`flush`): kept even if newer saves happen meanwhile. */
    private readonly pins = new Map<string, number>();
    public totalBytes = 0;

    public constructor(private readonly maxBytes = 20 * 1024 * 1024) {}

    /** The engine's latest `next_batch`, i.e. where a fully caught-up mirror long-polls. */
    public get head(): string | null {
        return this.latestNext;
    }

    /** Whether the buffer has grown past its limit and the engine should force a store save. */
    public get wantsSave(): boolean {
        return this.totalBytes > this.maxBytes;
    }

    /**
     * Records a response as it arrives at the engine (before its client processed it).
     * Responses without `since` (initial syncs) are never buffered.
     */
    public add(since: string | null, body: string): SyncEntry | null {
        let parsed: Record<string, unknown>;
        try {
            parsed = JSON.parse(body);
        } catch {
            return null;
        }
        const next = parsed.next_batch;
        if (typeof next !== "string") return null;
        if (!since) {
            this.latestNext = next;
            return null;
        }
        const td = parsed.to_device as { events?: unknown[] } | undefined;
        const hadToDevice = !!td?.events?.length;
        for (const f of DEVICE_FIELDS) delete parsed[f];
        const text = JSON.stringify(parsed);
        if (next === since && since === this.latestNext) {
            // An idle long-poll that came back with nothing (Synapse returns the same token). Answer whoever waits
            // at the head, but don't keep it: a mirror asking again must wait for real news, not loop.
            const idle: SyncEntry = { since, next, text, bytes: 0, hadToDevice, ready: true };
            this.wake(idle);
            return idle;
        }
        const old = this.bySince.get(since);
        if (old) this.totalBytes -= old.bytes;
        const entry: SyncEntry = { since, next, text, bytes: text.length * 2, hadToDevice, ready: false };
        this.bySince.set(since, entry);
        this.totalBytes += entry.bytes;
        this.latestNext = next;
        this.enforceHardLimit();
        return entry;
    }

    /** Independent of saves (which may never come, e.g. if the store fell back to memory): drop the oldest. */
    private enforceHardLimit(): void {
        for (const [since, e] of this.bySince) {
            if (this.totalBytes <= this.maxBytes * 2) return;
            if (this.waiters.some((w) => w.since === since)) continue;
            this.bySince.delete(since);
            this.totalBytes -= e.bytes;
        }
    }

    /** The engine did an initial sync ending in `next`: a new chain starts there (initial syncs aren't kept). */
    public startChain(next: string): void {
        this.latestNext = next;
    }

    /** A booting mirror was told to start from `token`: keep it servable for a while even across new saves. */
    public pin(token: string | null, now = Date.now()): void {
        if (token) this.pins.set(token, now + PIN_MS);
    }

    /** The engine's client finished processing the response that ended in `next`. */
    public markProcessed(next: string): SyncEntry | null {
        for (const entry of this.bySince.values()) {
            if (entry.next !== next || entry.ready) continue;
            entry.ready = true;
            this.wake(entry);
            return entry;
        }
        return null;
    }

    /** Answers a mirror's `/sync?since=…`, waiting if it is at the head or the response is still being processed. */
    public lookup(since: string): Promise<Lookup> {
        const entry = this.bySince.get(since);
        if (entry?.ready) return Promise.resolve({ entry });
        if (entry || since === this.latestNext) {
            return new Promise((resolve) => {
                this.waiters.push({ since, resolve });
                if (this.waiters.length > MAX_WAITERS) this.waiters.shift()!.resolve({ resync: true });
            });
        }
        return Promise.resolve({ resync: true });
    }

    /** The engine's store saved its state at `token`: drop what no mirror can still need. */
    public onSaved(token: string | null, now = Date.now()): void {
        if (!token || token === this.saved.at(-1)) return;
        this.saved.push(token);
        if (this.saved.length > KEEP_SAVES) this.saved.shift();
        for (const [t, until] of this.pins) if (until < now) this.pins.delete(t);
        const keep = new Set<string>();
        for (const from of [...this.saved, ...this.pins.keys()]) {
            for (let t: string | undefined = from; t && this.bySince.has(t) && !keep.has(t); ) {
                keep.add(t);
                t = this.bySince.get(t)!.next;
            }
        }
        for (const [since, e] of this.bySince) {
            if (keep.has(since)) continue;
            // Never drop what someone is waiting for.
            if (this.waiters.some((w) => w.since === since)) continue;
            this.bySince.delete(since);
            this.totalBytes -= e.bytes;
        }
    }

    /**
     * How many responses a mirror booting from `token` would fetch to catch up, or `null` if the buffer can't
     * serve that token any more.
     */
    public entriesSince(token: string): number | null {
        let n = 0;
        for (let t: string | undefined = token; t !== this.latestNext; n++) {
            const e: SyncEntry | undefined = t === undefined ? undefined : this.bySince.get(t);
            if (!e) return null;
            t = e.next;
        }
        return n;
    }

    public get size(): number {
        return this.bySince.size;
    }

    private wake(entry: SyncEntry): void {
        for (let i = this.waiters.length - 1; i >= 0; i--) {
            if (this.waiters[i].since !== entry.since) continue;
            this.waiters[i].resolve({ entry });
            this.waiters.splice(i, 1);
        }
    }
}
