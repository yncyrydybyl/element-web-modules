import { describe, expect, it } from "vitest";

import { buildGraph } from "./rooms";
import { fakeClient } from "./tests/fakeClient";
import { assignColumns, buildTubeLayout, COL, roundedPath } from "./tube";

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

    it("makes a line per space and group, with the rooms as stations", () => {
        expect(layout.lines.map((l) => l.label)).toEqual(["Engineering", "Team", "Infra", "Other rooms", "People"]);
        // In the space's order: by name, as none of these children has an `order`.
        expect(line("!eng:x").stations.map((s) => s.label)).toEqual(["Infra", "Ops", "Team", "Web"]);
        expect(line("rooms").colour).toBe(-1);
    });

    it("branches sub-spaces off their parent, furthest right nearest, without crossing", () => {
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

    it("lines up a room on several lines as an interchange, with a link", () => {
        const ops = layout.stations.filter((s) => s.roomId === "!ops:x");
        expect(ops).toHaveLength(2);
        expect(ops.every((s) => s.interchange)).toBe(true);
        expect(layout.links.map((l) => l.roomId)).toEqual(["!ops:x"]);
    });

    it("counts unread messages through sub-spaces", () => {
        expect(line("!eng:x")).toMatchObject({ unread: 3, highlight: 1 });
        expect(line("!infra:x")).toMatchObject({ unread: 1, highlight: 1 });
    });

    it("assigns columns that keep earlier interchanges in place where it can", () => {
        const placed = new Map([["b", 4]]);
        expect(assignColumns(["a", "b", "c"], 1, placed)).toEqual([["a", 1], ["c", 2], ["b", 4]]);
        // Too far ahead: not worth stretching the line.
        expect(assignColumns(["b"], 1, new Map([["b", 40]]))).toEqual([["b", 1]]);
        expect(COL).toBeGreaterThan(0);
    });

    it("rounds the corners of a path", () => {
        expect(roundedPath([[0, 0], [0, 100], [100, 100]], 10)).toBe("M0 0L0 90Q0 100 10 100L100 100");
    });
});
