import { describe, expect, it } from "vitest";

import { mergeState, parseState, shouldAutoOpen } from "./state";

describe("state", () => {
    it("parses only known, well-typed fields", () => {
        expect(parseState(null)).toEqual({});
        expect(parseState({ dismissed: "yes", utd_hint_off: true, dismissed_at: 5 })).toEqual({
            dismissed: undefined,
            dismissed_at: 5,
            utd_hint_off: true,
        });
    });

    it("opens by itself until dismissed, and never if the admin turned it off", () => {
        expect(shouldAutoOpen({}, true)).toBe(true);
        expect(shouldAutoOpen({ dismissed: true }, true)).toBe(false);
        expect(shouldAutoOpen({}, false)).toBe(false);
    });

    it("keeps fields it doesn't know when saving", () => {
        expect(mergeState({ future: 1, dismissed: true }, { utd_hint_off: true })).toEqual({ future: 1, dismissed: true, utd_hint_off: true });
    });
});
