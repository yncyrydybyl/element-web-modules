import { describe, expect, it } from "vitest";

import { buildGraph } from "./rooms";
import { search } from "./search";
import { bigAccount, fakeClient } from "./tests/fakeClient";
import { buildAllGraph, roomScore } from "./views";

const labels = { rooms: "Other rooms", people: "People" };

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

    it("all: every space and room, children inside their parent's circle", () => {
        const g = buildAllGraph(graph, labels);
        expect(g.mapNodes((_, a) => a.label).sort()).toEqual(["Alice", "Engineering", "Ops", "Other rooms", "People", "Random", "Web"]);
        g.forEachNode((key, a) => {
            const parentKey = key.slice(0, key.lastIndexOf("/"));
            if (!g.hasNode(parentKey)) return;
            const p = g.getNodeAttributes(parentKey);
            expect(Math.hypot(a.x - p.x, a.y - p.y) + a.size).toBeLessThanOrEqual(p.size + 1e-6);
        });
        const eng = g.getNodeAttributes("/!eng:x");
        expect(eng.container).toBe(true);
        // Unread counts add up into the space.
        expect(eng).toMatchObject({ unread: 3, highlight: 1 });
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
        const g = buildAllGraph(big, labels);
        expect(g.order).toBe(60 * 2 + 60 * 50);
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
