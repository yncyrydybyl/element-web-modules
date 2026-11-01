import { describe, expect, it } from "vitest";

import { buildGraph } from "./rooms";
import { fakeClient } from "./tests/fakeClient";
import { buildTubeLayout, ROW, roundedPath } from "./tube";

const labels = { rooms: "Other rooms", people: "People" };

describe("tube map", () => {
    const graph = buildGraph(
        fakeClient(
            [
                { id: "!eng:x", name: "Engineering", space: true, children: ["!web:x", "!ops:x", "!infra:x", "!team:x"] },
                { id: "!infra:x", name: "Infra", space: true, children: ["!k8s:x", "!ops:x"] },
                { id: "!team:x", name: "Team", space: true, children: ["!lunch:x"] },
                { id: "!web:x", name: "Web", unread: 2 },
                { id: "!ops:x", name: "Ops", highlight: 1, unread: 1 },
                { id: "!k8s:x", name: "K8s" },
                { id: "!lunch:x", name: "Lunch" },
                { id: "!random:x", name: "Random" },
                { id: "!alice:x", name: "Alice" },
            ],
            { "@alice:x": ["!alice:x"] },
        ),
    );
    const layout = buildTubeLayout(graph, labels);
    const line = (id: string) => layout.lines.find((l) => l.id === id)!;

    it("makes a line per space and group, with the rooms as stations, sub-spaces first", () => {
        expect(layout.lines.map((l) => l.label)).toEqual(["Engineering", "Team", "Infra", "Other rooms", "People"]);
        expect(line("!eng:x").stations.map((s) => s.label)).toEqual(["Infra", "Team", "Ops", "Web"]);
        expect(line("rooms").colour).toBe(-1);
        // Only blocks (top-level lines) are named.
        expect(layout.lines.filter((l) => l.anchor).map((l) => l.id)).toEqual(["!eng:x", "rooms", "people"]);
    });

    it("branches sub-spaces off their parent, furthest right nearest", () => {
        const eng = line("!eng:x");
        const team = line("!team:x");
        const infra = line("!infra:x");
        expect(team.parent).toBe("!eng:x");
        const junction = eng.stations.find((s) => s.roomId === "!team:x")!;
        expect(team.points[0]).toEqual([junction.x, junction.y]);
        expect(team.points[1][1]).toBeLessThan(infra.points[1][1]);
        // Infra drops past Team's row at a column left of everything on Team's line.
        expect(infra.points[0][0]).toBeLessThan(team.stations[0].x);
    });

    it("marks a room on several lines as an interchange, and only links it where that's short", () => {
        const ops = layout.stations.filter((s) => s.roomId === "!ops:x");
        expect(ops).toHaveLength(2);
        expect(ops.every((s) => s.interchange)).toBe(true);
        // Ops on Engineering and on Infra, two rows further down: too far for a link.
        expect(Math.abs(ops[0].y - ops[1].y)).toBeGreaterThan(ROW * 1.5);
        expect(layout.links).toEqual([]);
    });

    it("counts unread messages through sub-spaces", () => {
        expect(line("!eng:x")).toMatchObject({ unread: 3, highlight: 1 });
        expect(line("!infra:x")).toMatchObject({ unread: 1, highlight: 1 });
        expect(line("!eng:x").stations.find((s) => s.roomId === "!infra:x")).toMatchObject({ unread: 1, highlight: 1 });
    });

    it("winds long lines back and forth, and packs blocks to the screen's shape", () => {
        const many = Array.from({ length: 60 }, (_, i) => ({ id: `!r${i}:x`, name: `Room ${i}` }));
        const spaces = Array.from({ length: 12 }, (_, i) => ({ id: `!s${i}:x`, name: `Space ${i}`, space: true, children: many.slice(i * 3, i * 3 + 3).map((r) => r.id) }));
        const big = buildTubeLayout(buildGraph(fakeClient([...spaces, ...many, { id: "!lone:x", name: "Lone" }])), labels, 1.6);
        const rows = new Set(big.lines.find((l) => l.id === "rooms")!.stations.map((s) => s.y));
        expect(rows.size).toBeGreaterThan(1);
        const xs = big.stations.map((s) => s.x);
        expect(new Set(big.lines.filter((l) => l.anchor).map((l) => l.anchor![0])).size).toBeGreaterThan(1);
        const { x0, x1, y0, y1 } = big.bounds;
        expect((x1 - x0) / (y1 - y0)).toBeGreaterThan(0.6);
        expect(Math.max(...xs)).toBeLessThanOrEqual(x1);
    });

    it("rounds the corners of a path", () => {
        expect(roundedPath([[0, 0], [0, 100], [100, 100]], 10)).toBe("M0 0L0 90Q0 100 10 100L100 100");
    });
});
