import { describe, expect, it } from "vitest";

import { COLOURS, pickColour, placeOf, TabColour } from "./tabs";

describe("placeOf", () => {
    const client = { getRoom: (id: string) => (id === "!r:x" ? { name: "Team" } : null) };

    it("names the open room, or Home", () => {
        expect(placeOf("#/room/!r:x", client)).toBe("Team");
        expect(placeOf("#/room/!r:x/$event", client)).toBe("Team");
        expect(placeOf("#/room/%23alias:x", client)).toBe("#alias:x");
        expect(placeOf("#/home", client)).toBe("Home");
        expect(placeOf("", client)).toBe("Home");
        expect(placeOf("#/user/@a:x", client)).toBeNull();
    });
});

describe("pickColour", () => {
    const tab = (tabId: string, colour: number, colourSince = 100, openedAt = 0) => ({ tabId, colour, colourSince, openedAt });

    it("takes the first free colour", () => {
        expect(pickColour(tab("me", -1), [])).toBe(0);
        expect(pickColour(tab("me", -1), [tab("a", 0), tab("b", 2)])).toBe(1);
    });

    it("keeps its colour unless an older claim has it", () => {
        expect(pickColour(tab("me", 3, 100), [tab("a", 0)])).toBe(3);
        expect(pickColour(tab("me", 0, 200), [tab("a", 0, 100)])).toBe(1);
        expect(pickColour(tab("me", 0, 100), [tab("a", 0, 200)])).toBe(0);
    });

    it("on a tie, the tab open longer keeps it (a duplicated tab copies sessionStorage)", () => {
        expect(pickColour(tab("me", 0, 100, 50), [tab("a", 0, 100, 10)])).toBe(1);
        expect(pickColour(tab("me", 0, 100, 10), [tab("a", 0, 100, 50)])).toBe(0);
    });

    it("repeats colours only when all are taken", () => {
        const others = Array.from({ length: COLOURS }, (_, c) => tab(`t${c}`, c, 1));
        expect(pickColour(tab("me", 2, 100), others)).toBe(2);
        expect(pickColour(tab("me", -1), [...others, tab("x", 0, 1)])).toBe(1);
    });
});

describe("TabColour", () => {
    it("keeps the colour across reloads of the tab", () => {
        const first = new TabColour(sessionStorage, () => 100);
        expect(first.settle("me", 0, [{ tabId: "a", openedAt: 0, colour: 0, colourSince: 1 }])).toBe(1);
        const reloaded = new TabColour(sessionStorage, () => 999);
        expect(reloaded.colour).toBe(1);
        expect(reloaded.since).toBe(100);
        sessionStorage.clear();
    });

    it("ignores a saved value that isn't a colour", () => {
        sessionStorage.setItem("de.datanauten.multi_tab.colour", JSON.stringify({ colour: 42, since: 1 }));
        expect(new TabColour(sessionStorage).colour).toBe(-1);
        sessionStorage.setItem("de.datanauten.multi_tab.colour", "{broken");
        expect(new TabColour(sessionStorage).colour).toBe(-1);
        sessionStorage.clear();
    });
});
