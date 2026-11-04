import { describe, expect, it } from "vitest";

import { buildDistricts, firstWord, networkOf } from "./districts";
import { buildGraph } from "./rooms";
import { fakeClient } from "./tests/fakeClient";

describe("districts", () => {
    const graph = buildGraph(
        fakeClient(
            [
                { id: "!eng:x", name: "Engineering", space: true, children: ["!web:x", "!eng-sub:x"] },
                { id: "!eng-sub:x", name: "Backstage", space: true, children: ["!ops:x"] },
                { id: "!hub:x", name: "Hub", space: true, children: ["!c3:x"] },
                { id: "!c3:x", name: "38C3", space: true, children: ["!hall:x"] },
                { id: "!wa:x", name: "WhatsApp", space: true, children: ["!wa-group:x", "!wa-dm:x"] },
                { id: "!web:x", name: "Web", members: 20 },
                { id: "!ops:x", name: "Ops", members: 8 },
                { id: "!hall:x", name: "38C3 - Hall 1", members: 300 },
                { id: "!wa-group:x", name: "Family (WA)", members: 6 },
                { id: "!wa-dm:x", name: "Alice (WA)", members: 2 },
                { id: "!alice:x", name: "Alice", members: 2 },
                { id: "!pair:x", name: "@bob:x", members: 2 },
                { id: "!friends:x", name: "Friends", members: 5 },
                { id: "!eng-chat:x", name: "Engineering chat", members: 40, alias: "#eng-chat:x" },
                { id: "!f1:x", name: "Fit one", members: 30, alias: "#f1:y" },
                { id: "!f2:x", name: "Fit two", members: 30, alias: "#f2:y" },
                { id: "!f3:x", name: "Fit three", members: 30, alias: "#f3:y" },
                { id: "!tg:x", name: "Crypto chat (Telegram)", members: 50, alias: "#tg:x" },
                { id: "!old:x", name: "Deleted account 42" },
                { id: "!notes:x", name: "Notes", members: 1 },
                { id: "!big:x", name: "Lonely public room", members: 400, alias: "#lonely:z" },
            ],
            { "@alice:x": ["!alice:x"] },
        ),
    );
    const { groups, home } = buildDistricts(graph);
    const groupOf = (id: string) => groups.find((g) => g.key === home.get(id))!;

    it("files rooms in a space under its top-level space, events under the nearest event space", () => {
        expect(groupOf("!web:x")).toMatchObject({ district: "communities", label: "Engineering" });
        expect(groupOf("!ops:x")).toMatchObject({ district: "communities", label: "Engineering" });
        expect(groupOf("!hall:x")).toMatchObject({ district: "events", label: "38C3", spaceId: "!c3:x" });
    });

    it("puts DMs, rooms of two and small private groups with the people, by network", () => {
        expect(groupOf("!alice:x")).toMatchObject({ district: "people", label: "Matrix" });
        expect(groupOf("!pair:x")).toMatchObject({ district: "people", label: "Matrix" });
        expect(groupOf("!wa-dm:x")).toMatchObject({ district: "people", label: "WhatsApp" });
        expect(groupOf("!friends:x")).toMatchObject({ district: "people", label: "Small groups" });
    });

    it("gathers bridged group chats by network", () => {
        expect(groupOf("!wa-group:x")).toMatchObject({ district: "bridges", label: "WhatsApp" });
        expect(groupOf("!tg:x")).toMatchObject({ district: "bridges", label: "Telegram" });
    });

    it("sorts loose rooms next to a space they're named after, then by name prefix", () => {
        expect(groupOf("!eng-chat:x")).toMatchObject({ district: "communities", spaceId: "!eng:x" });
        expect(groupOf("!f1:x")).toMatchObject({ district: "unsorted", label: "Fit" });
        expect(groupOf("!big:x")).toMatchObject({ district: "unsorted", label: "Loose rooms" });
    });

    it("archives deleted rooms and rooms with nobody else in them", () => {
        expect(groupOf("!old:x")).toMatchObject({ district: "archive", label: "Deleted & tests" });
        expect(groupOf("!notes:x")).toMatchObject({ district: "archive", label: "Only you" });
    });

    it("gives every room that isn't a space exactly one home", () => {
        const rooms = [...graph.rooms.values()].filter((r) => r.kind !== "space");
        expect(rooms.every((r) => home.has(r.id))).toBe(true);
        const filed = groups.flatMap((g) => g.rooms).filter((id) => graph.rooms.get(id)!.kind !== "space");
        expect(filed).toHaveLength(rooms.length);
    });

    it("keeps top-level spaces without a group of their own findable", () => {
        // WhatsApp's rooms live with People and Bridges; Hub only holds an event space.
        expect(groups.find((g) => g.key === "unsorted/spaces")!.rooms.sort()).toEqual(["!hub:x", "!wa:x"]);
    });

    it("files people you haven't written with for half a year separately", () => {
        const now = Date.UTC(2026, 10, 1);
        const old = buildGraph(fakeClient([{ id: "!a:x", name: "A", lastActive: now - 400 * 86_400_000 }, { id: "!b:x", name: "B", lastActive: now - 86_400_000 }], { "@a:x": ["!a:x"], "@b:x": ["!b:x"] }));
        const d = buildDistricts(old, undefined, now);
        expect(d.home.get("!a:x")).toBe("people/Matrix-older");
        expect(d.home.get("!b:x")).toBe("people/Matrix");
    });

    it("reads networks and name prefixes", () => {
        expect(networkOf("Family (WA)")).toBe("WhatsApp");
        expect(networkOf("@signal_123:x")).toBe("Signal");
        expect(networkOf("Engineering")).toBeUndefined();
        expect(firstWord("38C3 - Hall 1")).toBe("38c3");
        expect(firstWord("The Matrix")).toBeUndefined();
        expect(firstWord("[WN] Thailand")).toBe("wn");
    });
});
