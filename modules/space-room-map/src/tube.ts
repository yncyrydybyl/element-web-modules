/**
 * The tube map: every space is a line and its rooms are the stations along it. A sub-space is an
 * interchange on its parent's line, where its own line branches off; a room in several spaces is
 * an interchange too, linked to its other stations where they're close.
 *
 * Each top-level space, with all its branches, is a block. A long line winds back and forth
 * within the block's width instead of running off to the right. A line's sub-spaces come first,
 * so their branches drop down on the left, past the line's later rows, which start further right;
 * the branch that leaves furthest right is placed nearest, so no drop crosses a line of its tree.
 * The blocks are then packed into columns (shortest column first) to roughly fill a screen.
 */

import { spaceStats, spaceTree, type RoomGraph, type RoomKind } from "./rooms";
import type { GroupLabels } from "./views";

/** Between stations. */
export const COL = 36;
/** Between rows: room for the slanted station names. */
export const ROW = 92;
/** Lines wrap at this column; a line that starts further right still gets MIN_RUN stations per row. */
const MAX_COL = 12;
const MIN_RUN = 4;
/** Above a block's first row: its name, then the slanted station names. */
const HEADER = 34;
const NAMES = ROW - 14;
/** How far the slanted station names reach right of the last column. */
const NAME_REACH = 84;
/** Between blocks. */
const GUTTER_X = 56;
const GUTTER_Y = 40;
/** Interchanges further apart than this aren't linked. */
const LINK_REACH = ROW * 1.5;
/** Protection against huge accounts: SVG slows down long before WebGL does. */
const MAX_STATIONS = 6000;

export interface TubeStation {
    /** `<line id>/<room id>`. */
    key: string;
    roomId: string;
    lineId: string;
    x: number;
    y: number;
    label: string;
    kind: RoomKind;
    /** For a sub-space: through all its rooms, like the list on the left. */
    unread: number;
    highlight: number;
    invite: boolean;
    /** A sub-space, or a room on several lines. */
    interchange: boolean;
}

export interface TubeLine {
    /** The space's id, or "rooms" / "people" for the groups. */
    id: string;
    roomId?: string;
    label: string;
    /** Index into the line palette; -1 for the groups. */
    colour: number;
    depth: number;
    parent?: string;
    /** From the branch point (or the start) to the end of the line, around every bend. */
    points: Array<[number, number]>;
    stations: TubeStation[];
    /** Top-level lines: where the block's name goes (its top left corner). */
    anchor?: [number, number];
    /** Through all sub-spaces, like the list on the left. */
    unread: number;
    highlight: number;
}

export interface TubeLink {
    roomId: string;
    points: Array<[number, number]>;
}

export interface TubeLayout {
    lines: TubeLine[];
    stations: TubeStation[];
    /** A room on several lines of the same block, linked. Across blocks, hovering shows the others. */
    links: TubeLink[];
    bounds: { x0: number; y0: number; x1: number; y1: number };
}

interface Block {
    lines: TubeLine[];
    stations: TubeStation[];
    width: number;
    height: number;
}

/** `aspect`: width / height of the view, which the packed blocks should roughly fill. */
export function buildTubeLayout(graph: RoomGraph, labels: GroupLabels, aspect = 1.6): TubeLayout {
    const stats = spaceStats(graph);
    const hasLine = new Set<string>();
    let colour = 0;
    let total = 0;

    /** One top-level space (or group) and its branches, at the origin. */
    const buildBlock = (id: string, label: string, members: string[]): Block => {
        const block: Block = { lines: [], stations: [], width: 0, height: 0 };
        /** The lowest row so far. */
        let bottom = HEADER + NAMES - ROW;
        let maxX = 0;

        const addLine = (id: string, label: string, members: string[], depth: number, branch?: { col: number; y: number; parent: string }): void => {
            hasLine.add(id);
            const room = graph.rooms.get(id);
            const line: TubeLine = {
                id,
                roomId: room?.id,
                label,
                colour: room ? colour++ : -1,
                depth,
                parent: branch?.parent,
                points: [],
                stations: [],
                unread: room ? (stats.get(id)?.unread ?? 0) : 0,
                highlight: room ? (stats.get(id)?.highlight ?? 0) : 0,
            };
            block.lines.push(line);

            const ids = members.filter((m) => graph.rooms.has(m)).slice(0, Math.max(0, MAX_STATIONS - total));
            total += ids.length;
            // Sub-spaces first: their branches drop down on the left.
            const isSpace = (m: string): boolean => graph.rooms.get(m)!.kind === "space";
            const ordered = [...ids.filter(isSpace), ...ids.filter((m) => !isSpace(m))];
            const junctions = ids.filter(isSpace).length;

            const start = branch ? branch.col + 1 : 0;
            // Later rows start right of the junctions and wind between `inner` and `inner + run - 1`.
            const inner = start + junctions;
            const run = Math.max(MIN_RUN, MAX_COL - inner);
            const firstRun = Math.max(junctions + MIN_RUN, MAX_COL - start);
            const rows: Array<{ y: number; cols: number[] }> = [];
            let i = 0;
            while (i < ordered.length || rows.length === 0) {
                const y = (bottom += ROW);
                const n = rows.length === 0 ? firstRun : run;
                const count = Math.min(n, ordered.length - i);
                const right = rows.length % 2 === 0;
                const cols =
                    rows.length === 0
                        ? Array.from({ length: count }, (_, j) => start + j)
                        : Array.from({ length: count }, (_, j) => (right ? inner + j : inner + run - 1 - j));
                rows.push({ y, cols });
                for (const col of cols) {
                    const r = graph.rooms.get(ordered[i++])!;
                    const s = stats.get(r.id);
                    const station: TubeStation = {
                        key: `${id}/${r.id}`,
                        roomId: r.id,
                        lineId: id,
                        x: col * COL,
                        y,
                        label: r.name,
                        kind: r.kind,
                        unread: r.kind === "space" ? (s?.unread ?? 0) : r.unread,
                        highlight: r.kind === "space" ? (s?.highlight ?? 0) : r.highlight,
                        invite: r.invite,
                        interchange: r.kind === "space",
                    };
                    line.stations.push(station);
                    block.stations.push(station);
                    maxX = Math.max(maxX, station.x);
                }
                if (!count) break;
            }

            // The track: in from the branch point (or the start), along each row, bending round to the next.
            const points: Array<[number, number]> = branch
                ? [[branch.col * COL, branch.y], [branch.col * COL, rows[0].y]]
                : [[start * COL - COL / 2, rows[0].y]];
            rows.forEach((row, r) => {
                const right = r % 2 === 0;
                const xs = row.cols.map((c) => c * COL);
                const next = rows[r + 1]?.cols.map((c) => c * COL) ?? [];
                const edge = right ? Math.max(...xs, ...next, start * COL) + COL / 2 : Math.min(...xs, ...next) - COL / 2;
                points.push([edge, row.y]);
                if (rows[r + 1]) points.push([edge, rows[r + 1].y]);
                maxX = Math.max(maxX, edge);
            });
            line.points = points;
            if (!room) {
                line.unread = line.stations.reduce((n, s) => n + s.unread, 0);
                line.highlight = line.stations.reduce((n, s) => n + s.highlight, 0);
            }

            const branches = line.stations
                .filter((s) => s.kind === "space" && !hasLine.has(s.roomId) && s.y === rows[0].y)
                .sort((a, b) => b.x - a.x);
            for (const s of branches) {
                // An earlier branch may have drawn it already (a sub-space in two places).
                if (hasLine.has(s.roomId)) continue;
                const sub = graph.rooms.get(s.roomId)!;
                addLine(sub.id, sub.name, sub.children, depth + 1, { col: s.x / COL, y: s.y, parent: id });
            }
        };

        addLine(id, label, members, 0);
        block.lines[0].anchor = [-COL / 2, 0];
        block.width = maxX + NAME_REACH;
        block.height = bottom + COL;
        return block;
    };

    const blocks: Block[] = [];
    // Top-level spaces, then any space not drawn yet (cut off by the limit).
    for (const id of [...graph.topSpaces, ...spaceTree(graph).map((s) => s.id)]) {
        if (!hasLine.has(id)) blocks.push(buildBlock(id, graph.rooms.get(id)!.name, graph.rooms.get(id)!.children));
    }
    if (graph.orphans.length) blocks.push(buildBlock("rooms", labels.rooms, graph.orphans));
    if (graph.dms.length) blocks.push(buildBlock("people", labels.people, graph.dms));

    const layout = pack(blocks, aspect);
    // Rooms on several lines; linked where the lines are in the same block.
    const byRoom = new Map<string, TubeStation[]>();
    for (const s of layout.stations) byRoom.set(s.roomId, [...(byRoom.get(s.roomId) ?? []), s]);
    const blockOf = new Map<string, number>();
    blocks.forEach((b, i) => b.lines.forEach((l) => blockOf.set(l.id, i)));
    for (const [roomId, list] of byRoom) {
        if (list.length < 2) continue;
        for (const s of list) s.interchange = true;
        // Only short links: a long one would cut across the block. Hovering shows the others anyway.
        for (const [, group] of groupBy(list, (s) => blockOf.get(s.lineId)!)) {
            const near = group.filter((s) => group.some((o) => o !== s && Math.abs(o.x - s.x) <= LINK_REACH && Math.abs(o.y - s.y) <= LINK_REACH));
            if (near.length > 1) layout.links.push({ roomId, points: near.map((s) => [s.x, s.y] as [number, number]).sort((a, b) => a[1] - b[1] || a[0] - b[0]) });
        }
    }
    return layout;
}

/** Blocks into columns, each into the shortest so far, with the number of columns that best fits `aspect`. */
function pack(blocks: Block[], aspect: number): TubeLayout {
    const colWidth = Math.max(COL * MIN_RUN, ...blocks.map((b) => b.width)) + GUTTER_X;
    const place = (n: number): { at: Array<[number, number]>; height: number } => {
        const heights = new Array<number>(n).fill(0);
        const at = blocks.map((b): [number, number] => {
            const c = heights.indexOf(Math.min(...heights));
            const pos: [number, number] = [c * colWidth, heights[c]];
            heights[c] += b.height + GUTTER_Y;
            return pos;
        });
        return { at, height: Math.max(0, ...heights) };
    };
    let best = place(1);
    let bestScore = Infinity;
    for (let n = 1; n <= Math.max(1, blocks.length); n++) {
        const p = place(n);
        const score = Math.abs(Math.log((n * colWidth) / Math.max(1, p.height) / aspect));
        if (score < bestScore) (best = p), (bestScore = score);
    }

    const layout: TubeLayout = { lines: [], stations: [], links: [], bounds: { x0: -COL, y0: 0, x1: COL, y1: COL } };
    blocks.forEach((b, i) => {
        const [dx, dy] = best.at[i];
        for (const l of b.lines) {
            l.points = l.points.map(([x, y]) => [x + dx, y + dy]);
            if (l.anchor) l.anchor = [l.anchor[0] + dx, l.anchor[1] + dy];
            layout.lines.push(l);
        }
        for (const s of b.stations) {
            s.x += dx;
            s.y += dy;
            layout.stations.push(s);
        }
        layout.bounds.x1 = Math.max(layout.bounds.x1, dx + b.width);
        layout.bounds.y1 = Math.max(layout.bounds.y1, dy + b.height);
    });
    return layout;
}

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
    const out = new Map<K, T[]>();
    for (const item of items) out.set(key(item), [...(out.get(key(item)) ?? []), item]);
    return out;
}

/** An SVG path through the points, with rounded corners. */
export function roundedPath(points: Array<[number, number]>, radius = 14): string {
    if (!points.length) return "";
    let d = `M${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
        const [x, y] = points[i];
        const next = points[i + 1];
        if (!next) {
            d += `L${x} ${y}`;
            break;
        }
        const [px, py] = points[i - 1];
        const r = Math.min(radius, Math.hypot(x - px, y - py) / 2, Math.hypot(next[0] - x, next[1] - y) / 2);
        const towards = (ax: number, ay: number): [number, number] => {
            const len = Math.hypot(ax - x, ay - y) || 1;
            return [x + ((ax - x) / len) * r, y + ((ay - y) / len) * r];
        };
        const [ax, ay] = towards(px, py);
        const [bx, by] = towards(next[0], next[1]);
        d += `L${ax} ${ay}Q${x} ${y} ${bx} ${by}`;
    }
    return d;
}
