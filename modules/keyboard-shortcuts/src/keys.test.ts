import { describe, expect, it } from "vitest";

import { comboFromEvent, comboToKeyCaps, combosEqual, matchesCombo, parseCombo, stringifyCombo } from "./keys";

const ev = (key: string, mods: Partial<KeyboardEvent> = {}) =>
    ({ key, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...mods }) as KeyboardEvent;
const t = (_key: string, fallback: string) => fallback;

describe("matchesCombo", () => {
    it("maps ctrlOrCmd to Ctrl on PC and ⌘ on Mac", () => {
        const combo = { ctrlOrCmdKey: true, key: "k" };
        expect(matchesCombo(ev("k", { ctrlKey: true }), combo, false)).toBe(true);
        expect(matchesCombo(ev("k", { metaKey: true }), combo, false)).toBe(false);
        expect(matchesCombo(ev("k", { metaKey: true }), combo, true)).toBe(true);
    });

    it("is case insensitive and requires exact modifiers", () => {
        const combo = { ctrlOrCmdKey: true, shiftKey: true, key: "l" };
        expect(matchesCombo(ev("L", { ctrlKey: true, shiftKey: true }), combo, false)).toBe(true);
        expect(matchesCombo(ev("L", { ctrlKey: true, shiftKey: true, altKey: true }), combo, false)).toBe(false);
    });

    it("matches any digit for the digits meta-key", () => {
        expect(matchesCombo(ev("3", { ctrlKey: true }), { ctrlOrCmdKey: true, key: "digits" }, false)).toBe(true);
    });
});

describe("parseCombo / stringifyCombo", () => {
    it.each([
        ["Mod+Shift+K", { ctrlOrCmdKey: true, shiftKey: true, key: "k" }],
        ["ctrl+alt+up", { ctrlKey: true, altKey: true, key: "ArrowUp" }],
        ["?", { key: "?" }],
        ["Mod++", { ctrlOrCmdKey: true, key: "+" }],
        ["Alt+Space", { altKey: true, key: " " }],
    ])("parses %s", (input, expected) => {
        expect(parseCombo(input)).toEqual(expected);
    });

    it("rejects unknown modifiers", () => {
        expect(() => parseCombo("Hyper+K")).toThrow(/Unknown modifier/);
    });

    it("round-trips", () => {
        for (const s of ["Mod+Shift+K", "Alt+ArrowDown", "Ctrl+Plus", "Mod+Space"]) {
            expect(stringifyCombo(parseCombo(s))).toBe(s);
        }
    });
});

describe("comboFromEvent", () => {
    it("ignores lone modifiers", () => {
        expect(comboFromEvent(ev("Control", { ctrlKey: true }), false)).toBeNull();
    });

    it("stores the primary modifier portably", () => {
        expect(comboFromEvent(ev("B", { ctrlKey: true, shiftKey: true }), false)).toEqual({ ctrlOrCmdKey: true, shiftKey: true, key: "b" });
        expect(comboFromEvent(ev("b", { metaKey: true }), true)).toEqual({ ctrlOrCmdKey: true, key: "b" });
    });
});

describe("combosEqual", () => {
    it("treats ctrlOrCmd and the platform modifier as equal", () => {
        expect(combosEqual({ ctrlOrCmdKey: true, key: "e" }, { ctrlKey: true, key: "E" }, false)).toBe(true);
        expect(combosEqual({ ctrlOrCmdKey: true, key: "e" }, { ctrlKey: true, key: "e" }, true)).toBe(false);
    });
});

describe("comboToKeyCaps", () => {
    it("renders PC and Mac labels", () => {
        expect(comboToKeyCaps({ ctrlOrCmdKey: true, shiftKey: true, key: "l" }, false, t)).toEqual(["Ctrl", "Shift", "L"]);
        expect(comboToKeyCaps({ ctrlOrCmdKey: true, shiftKey: true, key: "l" }, true, t)).toEqual(["⌘", "⇧", "L"]);
        expect(comboToKeyCaps({ altKey: true, key: "ArrowUp" }, false, t)).toEqual(["Alt", "↑"]);
        expect(comboToKeyCaps({ key: "Escape" }, false, t)).toEqual(["Esc"]);
    });
});
