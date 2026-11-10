import { describe, expect, it } from "vitest";

import { HISTORY_TYPE, HistoryStore, lastVisit, type Snapshot } from "./history";
import { mockApi } from "./tests/mockApi";

const DAY = 86_400_000;
const snap = (at: number, failing: string[] = []): Snapshot => ({ at, joined: 2, passing: 1, errors: failing.length, warnings: 0, failing });

describe("HistoryStore", () => {
    it("keeps one snapshot a day per space, and doesn't lose a quick second write", async () => {
        const { api, setAccountData } = mockApi();
        // Account data that only updates later (as with a real server): the store must not rely on it.
        setAccountData.mockImplementation(async () => {});
        const store = new HistoryStore(api);
        const now = Date.UTC(2026, 10, 8, 12);
        await store.record("!a:x", snap(now - DAY));
        await store.record("!a:x", snap(now, ["!r:x"]));
        await store.record("!a:x", snap(now + 1000, ["!r:x"]));
        await store.record("!b:x", snap(now));
        expect(store.get("!a:x").map((s) => s.at)).toEqual([now - DAY, now]);
        const last = setAccountData.mock.calls[setAccountData.mock.calls.length - 1];
        expect(last[0]).toBe(HISTORY_TYPE);
        expect(Object.keys((last[1] as { spaces: object }).spaces).sort()).toEqual(["!a:x", "!b:x"]);
        // Unchanged: not written again.
        expect(setAccountData).toHaveBeenCalledTimes(3);
        expect(lastVisit(store.get("!a:x"), now)?.at).toBe(now - DAY);
    });
});
