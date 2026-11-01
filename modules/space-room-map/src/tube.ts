/**
 * The tube map: every space is a line and its rooms are the stations along it. A sub-space is an
 * interchange on its parent's line, where its own line branches off; a room in several spaces is
 * an interchange too, linked across its lines.
 *
 * Lines run left to right, one row each. A space's branches are stacked below it, the one that
 * branches off furthest right nearest, so the branches' drops never cross another line of the tree.
 */

import { spaceStats, spaceTree, type RoomGraph, type RoomKind } from "./rooms";
import type { GroupLabels } from "./views";

/** Between stations. */
export const COL = 36;
/** Between lines: room for the slanted station names. */
export const ROW = 112;
/** Extra space between top-level spaces. */
const BLOCK_GAP = 32;
/** A shared room further along than this isn't worth stretching the line for: it gets a link instead. */
const MAX_JUMP = 8;
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
    /** From the branch point (or the start) to the end of the line. */
    points: Array<[number, number]>;
    stations: TubeStation[];
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
    /** The stations of a room that is on several lines. */
    links: TubeLink[];
    bounds: { x0: number; y0: number; x1: number; y1: number };
}

export function buildTubeLayout(graph: RoomGraph, labels: GroupLabels): TubeLayout {
    const stats = spaceStats(graph);
    const lines: TubeLine[] = [];
    const stations: TubeStation[] = [];
    /** The column of each room's first station, which later lines line up with. */
    const placed = new Map<string, number>();
    const hasLine = new Set<string>();
    let y = 0;
    let colour = 0;

    const addLine = (id: string, label: string, members: string[], depth: number, branch?: { col: number; y: number; parent: string }): void => {
        hasLine.add(id);
        const lineY = y;
        y += ROW;
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
            unread: 0,
            highlight: 0,
        };
        if (room) Object.assign(line, { unread: stats.get(id)?.unread ?? 0, highlight: stats.get(id)?.highlight ?? 0 });
        lines.push(line);

        const ids = members.filter((m) => graph.rooms.has(m)).slice(0, Math.max(0, MAX_STATIONS - stations.length));
        const first = branch ? branch.col + 1 : 0;
        for (const [roomId, col] of assignColumns(ids, first, placed)) {
            const r = graph.rooms.get(roomId)!;
            const station: TubeStation = {
                key: `${id}/${roomId}`,
                roomId,
                lineId: id,
                x: col * COL,
                y: lineY,
                label: r.name,
                kind: r.kind,
                unread: r.unread,
                highlight: r.highlight,
                invite: r.invite,
                interchange: r.kind === "space",
            };
            if (!placed.has(roomId)) placed.set(roomId, col);
            line.stations.push(station);
            stations.push(station);
        }
        if (!room) {
            line.unread = line.stations.reduce((n, s) => n + s.unread, 0);
            line.highlight = line.stations.reduce((n, s) => n + s.highlight, 0);
        }

        const end = (line.stations.at(-1)?.x ?? (branch ? (branch.col + 1) * COL : 0)) + COL / 2;
        line.points = branch
            ? [[branch.col * COL, branch.y], [branch.col * COL, lineY], [end, lineY]]
            : [[-COL / 2, lineY], [end, lineY]];

        // Branches, furthest right first, so each drop passes only lines that start further right.
        const branches = line.stations
            .filter((s) => s.kind === "space" && !hasLine.has(s.roomId))
            .sort((a, b) => b.x - a.x);
        for (const s of branches) {
            // An earlier branch may already have drawn it (a sub-space in two places).
            if (hasLine.has(s.roomId)) continue;
            const sub = graph.rooms.get(s.roomId)!;
            addLine(sub.id, sub.name, sub.children, depth + 1, { col: s.x / COL, y: lineY, parent: id });
        }
    };

    for (const { id, depth } of spaceTree(graph)) {
        if (depth > 0 || hasLine.has(id)) continue;
        addLine(id, graph.rooms.get(id)!.name, graph.rooms.get(id)!.children, 0);
        y += BLOCK_GAP;
    }
    // Spaces only reachable through a cycle, or below one already drawn elsewhere.
    for (const { id } of spaceTree(graph)) {
        if (hasLine.has(id)) continue;
        addLine(id, graph.rooms.get(id)!.name, graph.rooms.get(id)!.children, 0);
        y += BLOCK_GAP;
    }
    if (graph.orphans.length) {
        addLine("rooms", labels.rooms, graph.orphans, 0);
        y += BLOCK_GAP;
    }
    if (graph.dms.length) addLine("people", labels.people, graph.dms, 0);

    const byRoom = new Map<string, TubeStation[]>();
    for (const s of stations) byRoom.set(s.roomId, [...(byRoom.get(s.roomId) ?? []), s]);
    const links: TubeLink[] = [];
    for (const [roomId, list] of byRoom) {
        if (list.length < 2) continue;
        for (const s of list) s.interchange = true;
        links.push({ roomId, points: list.map((s) => [s.x, s.y] as [number, number]).sort((a, b) => a[1] - b[1]) });
    }

    let x1 = COL;
    for (const l of lines) x1 = Math.max(x1, ...l.points.map((p) => p[0]));
    return {
        lines,
        stations,
        links,
        // Station names slant up and to the right of their station.
        bounds: { x0: -COL, y0: -ROW * 0.7, x1: x1 + ROW * 0.7, y1: Math.max(0, y - ROW) + COL },
    };
}

/**
 * Columns for a line's stations, from `first` on. Rooms already on an earlier line keep that
 * line's column where they can, so the interchange lines up; the others fill the gaps in order.
 */
export function assignColumns(members: string[], first: number, placed: Map<string, number>): Array<[string, number]> {
    const fixed = members.filter((m) => placed.has(m)).sort((a, b) => placed.get(a)! - placed.get(b)!);
    const free = members.filter((m) => !placed.has(m));
    const out: Array<[string, number]> = [];
    let cursor = first;
    while (fixed.length || free.length) {
        const next = fixed[0];
        const col = next === undefined ? Infinity : placed.get(next)!;
        if (next !== undefined && (col <= cursor || !free.length)) {
            fixed.shift();
            const at = col >= cursor && col - cursor <= MAX_JUMP ? col : cursor;
            out.push([next, at]);
            cursor = at + 1;
        } else {
            out.push([free.shift()!, cursor++]);
        }
    }
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
