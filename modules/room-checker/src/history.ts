/**
 * How a space's rooms did over time: one snapshot per space and day, kept in your account data
 * (`HISTORY_TYPE`), so it follows you to every device and nobody else sees it.
 */

import type { Api } from "@element-hq/element-web-module-api";

export const HISTORY_TYPE = "de.datanauten.room_checker.history";
/** Snapshots kept per space (one a day). */
const KEEP = 90;
/** Failing room IDs kept per snapshot. */
const KEEP_FAILING = 1000;

export interface Snapshot {
    at: number;
    /** Rooms you're in, and those of them that pass everything. */
    joined: number;
    passing: number;
    /** Rooms (joined or not) with errors, or with only warnings. */
    errors: number;
    warnings: number;
    /** IDs of the rooms with errors or warnings. */
    failing: string[];
}

type History = Record<string, Snapshot[]>;

function sanitise(value: unknown): History {
    const spaces = value && typeof value === "object" ? (value as { spaces?: unknown }).spaces : undefined;
    const out: History = {};
    if (!spaces || typeof spaces !== "object") return out;
    for (const [id, list] of Object.entries(spaces as Record<string, unknown>)) {
        if (!Array.isArray(list)) continue;
        out[id] = list.filter(
            (s): s is Snapshot =>
                s && typeof s === "object" && typeof s.at === "number" && typeof s.joined === "number" && typeof s.passing === "number" && Array.isArray(s.failing),
        );
    }
    return out;
}

const sameDay = (a: number, b: number): boolean => new Date(a).toDateString() === new Date(b).toDateString();

export class HistoryStore {
    /** What this store wrote, per space: account data only has it once the server echoes it back. */
    private written: History = {};

    public constructor(private readonly api: Api) {}

    /** Oldest first. Empty before login or when nothing was recorded. */
    public get(spaceId: string): Snapshot[] {
        return this.read()[spaceId] ?? [];
    }

    /** Today's snapshot replaces an earlier one from today; unchanged ones aren't written again. */
    public async record(spaceId: string, snapshot: Snapshot): Promise<void> {
        const history = this.read();
        const list = [...(history[spaceId] ?? [])];
        const last = list[list.length - 1];
        const s = { ...snapshot, failing: snapshot.failing.slice(0, KEEP_FAILING) };
        if (last && sameDay(last.at, s.at)) {
            if (same(last, s)) return;
            list[list.length - 1] = s;
        } else {
            list.push(s);
        }
        history[spaceId] = list.slice(-KEEP);
        this.written[spaceId] = history[spaceId];
        await this.api.client.accountData.set(HISTORY_TYPE, { version: 1, spaces: history });
    }

    private read(): History {
        let stored: History = {};
        try {
            stored = sanitise(this.api.client.accountData.get(HISTORY_TYPE).value);
        } catch {
            // Not logged in yet.
        }
        // Our own writes win until the server has them: two quick ones mustn't lose the first.
        for (const [id, list] of Object.entries(this.written)) {
            const theirs = stored[id];
            if (!theirs || (theirs[theirs.length - 1]?.at ?? 0) <= (list[list.length - 1]?.at ?? 0)) stored[id] = list;
        }
        return stored;
    }
}

function same(a: Snapshot, b: Snapshot): boolean {
    return a.joined === b.joined && a.passing === b.passing && a.errors === b.errors && a.warnings === b.warnings && a.failing.join() === b.failing.join();
}

/** The last snapshot from before today: what "since your last visit" compares with. */
export function lastVisit(list: Snapshot[], now = Date.now()): Snapshot | undefined {
    for (let i = list.length - 1; i >= 0; i--) if (!sameDay(list[i].at, now)) return list[i];
    return undefined;
}
