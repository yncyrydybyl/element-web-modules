import { describe, expect, it } from "vitest";

import { buildLayout, fitAngles, ME_NODE, nodeKey, STEP } from "./layout";
import { buildPeople } from "./people";
import { buildGraph } from "./rooms";
import { fakeClient, type FakeRoom } from "./tests/fakeClient";

function layoutOf(rooms: FakeRoom[]) {
    const c = fakeClient(rooms);
    const data = buildPeople(c, buildGraph(c), { largeRooms: false, bots: false });
    return { data, layout: buildLayout(data, "Me") };
}

describe("fitAngles", () => {
    it("shares the circle by weight, but gives small sectors a minimum", () => {
        const angles = fitAngles([100, 1, 1], 6);
        expect(angles.reduce((a, b) => a + b, 0)).toBeCloseTo(6);
        expect(angles[1]).toBeCloseTo(0.22);
        expect(angles[0]).toBeGreaterThan(5);
        // More sectors than there's room for at the minimum: all equal.
        expect(fitAngles(Array(40).fill(1), 6).every((a) => Math.abs(a - 6 / 40) < 1e-9)).toBe(true);
    });
});

describe("buildLayout", () => {
    const rooms: FakeRoom[] = [
        { id: "!a:x", name: "A", space: true, children: ["!a1:x", "!a2:x"] },
        { id: "!b:x", name: "B", space: true, children: ["!b1:x"] },
        // Close: a room of three.
        { id: "!a1:x", name: "A1", people: ["@close:x", "@mid:x"] },
        { id: "!a2:x", name: "A2", people: ["@mid:x", ...Array.from({ length: 30 }, (_, i) => `@a${i}:x`)] },
        { id: "!b1:x", name: "B1", people: Array.from({ length: 60 }, (_, i) => `@b${i}:x`) },
    ];

    it("puts you in the middle and closer people nearer to you", () => {
        const { layout } = layoutOf(rooms);
        const g = layout.graph;
        expect(g.getNodeAttributes(ME_NODE)).toMatchObject({ x: 0, y: 0, me: true, label: "Me" });
        const r = (id: string) => Math.hypot(g.getNodeAttribute(nodeKey(id), "x"), g.getNodeAttribute(nodeKey(id), "y"));
        expect(r("@close:x")).toBeLessThan(r("@a29:x"));
        expect(r("@close:x")).toBeLessThanOrEqual(r("@mid:x"));
        expect(g.getNodeAttribute(nodeKey("@close:x"), "size")).toBeGreaterThan(g.getNodeAttribute(nodeKey("@b0:x"), "size"));
    });

    it("gives each context its own sector, without overlaps", () => {
        const { layout, data } = layoutOf(rooms);
        expect(layout.sectors.map((s) => s.label).sort()).toEqual(["A", "B"]);
        const nodes = layout.graph.filterNodes((_, a) => !a.me).map((k) => layout.graph.getNodeAttributes(k));
        expect(nodes).toHaveLength(data.people.size);
        for (const n of nodes) {
            const s = layout.sectors.find((x) => x.key === n.group)!;
            let a = Math.atan2(n.y, n.x);
            while (a < s.a0 - 1e-9) a += Math.PI * 2;
            while (a > s.a1 + 1e-9) a -= Math.PI * 2;
            expect(a).toBeGreaterThanOrEqual(s.a0 - 1e-9);
            expect(a).toBeLessThanOrEqual(s.a1 + 1e-9);
        }
        for (let i = 0; i < nodes.length; i++)
            for (let j = i + 1; j < nodes.length; j++) expect(Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y)).toBeGreaterThan(STEP * 0.5);
    });

    it("is the same every time", () => {
        const a = layoutOf(rooms).layout.graph;
        const b = layoutOf(rooms).layout.graph;
        a.forEachNode((k, attrs) => expect([attrs.x, attrs.y]).toEqual([b.getNodeAttribute(k, "x"), b.getNodeAttribute(k, "y")]));
    });
});
