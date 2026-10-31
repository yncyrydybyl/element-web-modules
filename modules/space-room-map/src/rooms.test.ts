import { describe, expect, it } from "vitest";

import { breadcrumb, buildGraph, currentRoomId, spaceStats, spaceTree } from "./rooms";
import { fakeClient } from "./tests/fakeClient";

describe("buildGraph", () => {
    const client = fakeClient(
        [
            { id: "!eng:x", name: "Engineering", space: true, children: [{ id: "!web:x", order: "b" }, { id: "!backend:x", order: "a" }, "!gone:x"] },
            { id: "!web:x", name: "Web", space: true, children: ["!frontend:x", { id: "!old:x", via: [] }] },
            { id: "!backend:x", name: "Backend", alias: "#backend:x" },
            { id: "!frontend:x", name: "Frontend" },
            { id: "!old:x", name: "Old" },
            { id: "!random:x", name: "Random" },
            { id: "!alice:x", name: "Alice" },
            { id: "!inv:x", name: "Invite", membership: "invite" },
            { id: "!left:x", name: "Left", membership: "leave" },
        ],
        { "@alice:x": ["!alice:x"] },
    );
    const graph = buildGraph(client);

    it("nests spaces and orders children by `order`", () => {
        expect(graph.topSpaces).toEqual(["!eng:x"]);
        expect(graph.rooms.get("!eng:x")!.children).toEqual(["!backend:x", "!web:x"]);
        expect(graph.rooms.get("!web:x")!.children).toEqual(["!frontend:x"]);
    });

    it("drops removed children (no via), unknown rooms and left rooms", () => {
        expect(graph.rooms.has("!left:x")).toBe(false);
        expect(graph.orphans).toContain("!old:x");
    });

    it("splits rooms outside spaces into rooms and DMs", () => {
        expect(graph.orphans).toEqual(["!inv:x", "!old:x", "!random:x"]);
        expect(graph.dms).toEqual(["!alice:x"]);
        expect(graph.rooms.get("!inv:x")!.invite).toBe(true);
    });

    it("builds breadcrumbs and resolves the current room from the URL", () => {
        expect(breadcrumb(graph, "!frontend:x")).toEqual(["Engineering", "Web"]);
        expect(currentRoomId(graph, "#/room/!random:x")).toBe("!random:x");
        expect(currentRoomId(graph, "#/room/%23backend:x/$event")).toBe("!backend:x");
        expect(currentRoomId(graph, "#/home")).toBeUndefined();
    });

    it("survives space cycles", () => {
        const cyclic = buildGraph(
            fakeClient([
                { id: "!a:x", name: "A", space: true, children: ["!b:x"] },
                { id: "!b:x", name: "B", space: true, children: ["!a:x", "!r:x"] },
                { id: "!r:x", name: "R" },
            ]),
        );
        expect(cyclic.topSpaces).toHaveLength(1);
        expect(breadcrumb(cyclic, "!r:x").length).toBeGreaterThan(0);
    });

    it("lists spaces in tree order and counts the rooms below each", () => {
        expect(spaceTree(graph)).toEqual([
            { id: "!eng:x", depth: 0 },
            { id: "!web:x", depth: 1 },
        ]);
        expect(spaceStats(graph).get("!eng:x")).toEqual({ rooms: 2, unread: 0, highlight: 0 });
        expect(spaceStats(graph).get("!web:x")).toEqual({ rooms: 1, unread: 0, highlight: 0 });
    });
});

describe("avatars", () => {
    const client = fakeClient(
        [
            { id: "!a:x", name: "A", avatar: "mxc://x/room" },
            { id: "!dm:x", name: "Bob", memberAvatar: "mxc://x/bob" },
            { id: "!s:x", name: "S", space: true, memberAvatar: "mxc://x/nope" },
            { id: "!plain:x", name: "Plain" },
        ],
        { "@bob:x": ["!dm:x"] },
    );

    it("uses the room avatar, and the DM partner's for rooms without one", () => {
        const graph = buildGraph(client);
        expect(graph.rooms.get("!a:x")!.avatar).toBe("mxc://x/room");
        expect(graph.rooms.get("!dm:x")!.avatar).toBe("mxc://x/bob");
        expect(graph.rooms.get("!s:x")!.avatar).toBeUndefined();
        expect(graph.rooms.get("!plain:x")!.avatar).toBeUndefined();
    });
});
