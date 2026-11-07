import { describe, expect, it } from "vitest";

import { placeOf } from "./tabs";

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
