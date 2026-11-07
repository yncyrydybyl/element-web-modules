import { describe, expect, it } from "vitest";

import { buildDistricts } from "./districts";
import { buildGraph, type RoomGraph } from "./rooms";
import { search } from "./search";
import { bigAccount, fakeClient } from "./tests/fakeClient";
import { buildAllGraph, refreshCounts, roomScore } from "./views";

const names = { communities: "Communities", events: "Events", people: "People", bridges: "Bridges", unsorted: "Unsorted", archive: "Archive" };
const all = (graph: RoomGraph) => buildAllGraph(graph, buildDistricts(graph), names);

describe("views", () => {
    const graph = buildGraph(
        fakeClient(
            [
                { id: "!eng:x", name: "Engineering", space: true, children: ["!web:x", "!ops:x"] },
                { id: "!web:x", name: "Web", lastActive: 100, unread: 2 },
                { id: "!ops:x", name: "Ops", lastActive: 50, highlight: 1, unread: 1 },
                { id: "!random:x", name: "Random", lastActive: 10 },
                { id: "!alice:x", name: "Alice", lastActive: 90 },
            ],
            { "@alice:x": ["!alice:x"] },
        ),
    );

    it("all: districts, their groups, and every room inside its parent's circle", () => {
        const g = all(graph);
        expect(g.mapNodes((_, a) => a.label).sort()).toEqual(["Alice", "Communities", "Engineering", "Matrix (older)", "Ops", "People", "Random", "Web"]);
        g.forEachNode((key, a) => {
            const parentKey = key.slice(0, key.lastIndexOf("/"));
            if (!g.hasNode(parentKey)) return;
            const p = g.getNodeAttributes(parentKey);
            expect(Math.hypot(a.x - p.x, a.y - p.y) + a.size).toBeLessThanOrEqual(p.size + 1e-6);
        });
        const eng = g.getNodeAttributes("d.communities/!eng:x");
        expect(eng.container).toBe(true);
        // Unread counts add up into the space.
        expect(eng).toMatchObject({ unread: 3, highlight: 1 });
    });

    it("knows each node's district, and takes new counts in place", () => {
        const g2 = buildGraph(
            fakeClient([
                { id: "!eng:x", name: "Engineering", space: true, children: ["!web:x", "!ops:x"] },
                { id: "!web:x", name: "Web", unread: 2 },
                { id: "!ops:x", name: "Ops" },
            ]),
        );
        const map = all(g2);
        expect(map.getNodeAttribute("d.communities/!eng:x/!web:x", "district")).toBe("communities");
        const xy = map.mapNodes((_, a) => [a.x, a.y, a.size]);
        g2.rooms.get("!ops:x")!.highlight = 1;
        g2.rooms.get("!ops:x")!.unread = 1;
        expect([...refreshCounts(map, g2)]).toEqual(["!ops:x"]);
        expect(map.getNodeAttributes("d.communities/!eng:x")).toMatchObject({ unread: 3, highlight: 1 });
        expect(map.getNodeAttributes("d.communities")).toMatchObject({ unread: 3, highlight: 1 });
        expect(map.mapNodes((_, a) => [a.x, a.y, a.size])).toEqual(xy);
        // Reading counts that went down lights nothing up.
        g2.rooms.get("!web:x")!.unread = 0;
        expect(refreshCounts(map, g2).size).toBe(0);
        expect(map.getNodeAttributes("d.communities/!eng:x")).toMatchObject({ unread: 1 });
    });

    it("scores rooms by use, recent activity and unread messages", () => {
        const opts = { usage: (id: string) => (id === "!random:x" ? 10 : 0), now: 0 };
        const score = (id: string) => roomScore(graph.rooms.get(id)!, opts);
        expect(score("!random:x")).toBeGreaterThan(score("!ops:x"));
        expect(score("!ops:x")).toBeGreaterThan(score("!alice:x"));
    });

    it("lays out a big account quickly", () => {
        const big = buildGraph(fakeClient(bigAccount(60, 50)));
        const start = performance.now();
        const g = all(big);
        expect(g.order).toBe(1 + 60 * 2 + 60 * 50);
        expect(performance.now() - start).toBeLessThan(500);
    });
});

describe("search", () => {
    it("matches names and aliases, ties going to the higher ranked", () => {
        const graph = buildGraph(
            fakeClient([
                { id: "!a:x", name: "Alpha", lastActive: 1 },
                { id: "!b:x", name: "Beta", lastActive: 2, alias: "#bravo:x" },
                { id: "!s:x", name: "Space", space: true },
            ]),
        );
        const rank = (r: { lastActive: number }) => r.lastActive;
        expect(search(graph, "", { rank })).toEqual([]);
        expect(search(graph, "a", { rank, exclude: "!b:x" }).map((r) => r.id)).toEqual(["!a:x", "!s:x"]);
        expect(search(graph, "brav", { rank }).map((r) => r.id)).toEqual(["!b:x"]);
        expect(search(graph, "spa", { rank }).map((r) => r.id)).toEqual(["!s:x"]);
        // match-sorter: prefix first, then substring matches by activity.
        expect(search(graph, "a", { rank }).map((r) => r.name)).toEqual(["Alpha", "Beta", "Space"]);
    });
});
