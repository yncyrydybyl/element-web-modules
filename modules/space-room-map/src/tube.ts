/**
 * The tube map: every space is a line and its rooms are the stations along it. A sub-space is an
 * interchange on its parent's line, where its own line branches off; a room in several spaces is
 * an interchange too, linked to its other stations where they're close.
 *
 * Each top-level space, with all its branches, is a block. A long line winds back and forth
 * within the block's width instead of running off to the right. A line's sub-spaces come first,
 * so their branches drop down on the left, past the line's later rows, which start further right;
 * the branch that leaves furthest right is placed nearest, so no drop crosses a line of its tree.
 * The blocks are then packed into columns (masonry, wide blocks spanning several) to roughly fill
 * a screen.
 */

import type { DistrictId, Districts, Group } from "./districts";
import type { RoomGraph, RoomKind } from "./rooms";

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
/** Above each district's blocks: its name. */
const DISTRICT_HEADER = 70;
/** Between districts: wider than between blocks, so the regions read as such. */
const DISTRICT_GAP = 200;
/** People and bridged chats in their network's colour. */
const NETWORK_COLOURS: Record<string, string> = { WhatsApp: "#25a35a", Telegram: "#229ed9", Signal: "#3a76f0", Discord: "#5865f2", Slack: "#9b4f96" };
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
    /** A group's own colour (a network's), instead of the palette. */
    hex?: string;
    district: DistrictId;
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

export interface TubeDistrict extends Record<"x0" | "y0" | "x1" | "y1", number> {
    id: DistrictId;
    label: string;
    rooms: number;
}

export interface TubeLayout {
    /** The districts' regions, named at their top left. */
    districts: TubeDistrict[];
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

/** `aspect`: width / height of the view, which each district's packed blocks should roughly fill. */
export function buildTubeLayout(graph: RoomGraph, districts: Districts, names: Record<DistrictId, string>, aspect = 1.6): TubeLayout {
    let colour = 0;
    let total = 0;
    const blocks: Block[] = [];

    /**
     * One group at the origin: a space and its branches, keeping only rooms whose home is this
     * group; or, for any other group, one line of its rooms.
     */
    const buildBlock = (group: Group): Block => {
        const block: Block = { lines: [], stations: [], width: 0, height: 0 };
        const hasLine = new Set<string>();
        const keptMemo = new Map<string, boolean>();
        /** A sub-space with any room of this group below it. */
        const keptSpace = (id: string, seen = new Set<string>()): boolean => {
            if (!group.spaceId) return false;
            if (keptMemo.has(id)) return keptMemo.get(id)!;
            if (seen.has(id)) return false;
            seen.add(id);
            const out = (graph.rooms.get(id)?.children ?? []).some((c) =>
                graph.rooms.get(c)?.kind === "space" ? keptSpace(c, seen) : districts.home.get(c) === group.key,
            );
            keptMemo.set(id, out);
            return out;
        };
        const keep = (id: string): boolean => {
            if (!group.spaceId) return true;
            return graph.rooms.get(id)?.kind === "space" ? keptSpace(id) : districts.home.get(id) === group.key;
        };
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
                hex: room ? undefined : (NETWORK_COLOURS[group.label] ?? undefined),
                district: group.district,
                depth,
                parent: branch?.parent,
                points: [],
                stations: [],
                unread: 0,
                highlight: 0,
            };
            block.lines.push(line);

            const ids = members.filter((m) => graph.rooms.has(m) && keep(m)).slice(0, Math.max(0, MAX_STATIONS - total));
            total += ids.length;
            // Sub-spaces that get a line of their own first: their branches drop down on the left.
            const branching = (m: string): boolean => graph.rooms.get(m)!.kind === "space" && !hasLine.has(m) && keptSpace(m);
            const ordered = [...ids.filter(branching), ...ids.filter((m) => !branching(m))];
            const junctions = ids.filter(branching).length;

            const start = branch ? branch.col + 1 : 0;
            // Later rows start right of the junctions and wind between `inner` and `inner + run - 1`;
            // a long line gets longer rows, so its block comes out roughly square instead of a tower.
            const inner = start + junctions;
            const run = Math.max(MIN_RUN, MAX_COL - inner, Math.ceil(Math.sqrt(((ordered.length - junctions) * ROW) / COL)));
            const firstRun = junctions + run;
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
                    const station: TubeStation = {
                        key: `${id}/${r.id}`,
                        roomId: r.id,
                        lineId: id,
                        x: col * COL,
                        y,
                        label: r.name,
                        kind: r.kind,
                        unread: r.kind === "space" ? 0 : r.unread,
                        highlight: r.kind === "space" ? 0 : r.highlight,
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

            const branches = line.stations.filter((s) => branching(s.roomId) && s.y === rows[0].y).sort((a, b) => b.x - a.x);
            for (const s of branches) {
                // An earlier branch may have drawn it already (a sub-space in two places).
                if (hasLine.has(s.roomId)) continue;
                const sub = graph.rooms.get(s.roomId)!;
                addLine(sub.id, sub.name, sub.children, depth + 1, { col: s.x / COL, y: s.y, parent: id });
            }
        };

        const space = group.spaceId ? graph.rooms.get(group.spaceId) : undefined;
        if (space) addLine(space.id, group.label, space.children, 0);
        else addLine(group.key, group.label, group.rooms, 0);
        block.lines[0].anchor = [-COL / 2, 0];
        block.width = maxX + NAME_REACH;
        block.height = bottom + COL;

        // Unread counts of this group's rooms only, through each line's branches; a sub-space's
        // interchange shows its branch's.
        // Each room counted once, even where it's on two lines.
        const roomsBelow = new Map<string, Map<string, TubeStation>>();
        for (const line of [...block.lines].reverse()) {
            const rooms = new Map(line.stations.filter((s) => s.kind !== "space").map((s) => [s.roomId, s]));
            const below = block.lines.filter((l) => l.parent === line.id);
            for (const l of below) for (const [id, s] of roomsBelow.get(l.id)!) rooms.set(id, s);
            roomsBelow.set(line.id, rooms);
            line.unread = [...rooms.values()].reduce((n, s) => n + s.unread, 0);
            line.highlight = [...rooms.values()].reduce((n, s) => n + s.highlight, 0);
            for (const l of below) {
                const junction = line.stations.find((s) => s.roomId === l.id);
                if (junction) Object.assign(junction, { unread: l.unread, highlight: l.highlight });
            }
        }
        return block;
    };

    // Each district packed on its own, then the districts in two fixed columns: the same
    // district is always in the same place.
    const layout: TubeLayout = { lines: [], stations: [], links: [], districts: [], bounds: { x0: -COL, y0: 0, x1: COL, y1: COL } };
    const columns: DistrictId[][] = [
        ["communities", "people", "unsorted"],
        ["events", "bridges", "archive"],
    ];
    let x = 0;
    for (const column of columns) {
        let y = 0;
        let width = 0;
        for (const id of column) {
            const own = districts.groups.filter((g) => g.district === id && g.rooms.length).map(buildBlock);
            if (!own.length) continue;
            blocks.push(...own);
            const part = pack(own, aspect);
            const dy = y + DISTRICT_HEADER;
            shift(part, x, dy);
            layout.lines.push(...part.lines);
            layout.stations.push(...part.stations);
            const region = { x0: x, y0: y, x1: x + part.bounds.x1, y1: dy + part.bounds.y1 };
            const rooms = districts.groups.filter((g) => g.district === id).reduce((n, g) => n + g.rooms.length, 0);
            layout.districts.push({ id, label: names[id], rooms, ...region });
            width = Math.max(width, part.bounds.x1);
            y = region.y1 + DISTRICT_GAP;
            layout.bounds.y1 = Math.max(layout.bounds.y1, region.y1);
        }
        x += width + DISTRICT_GAP;
        layout.bounds.x1 = Math.max(layout.bounds.x1, x - DISTRICT_GAP);
    }

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

function shift(part: Pick<TubeLayout, "lines" | "stations">, dx: number, dy: number): void {
    for (const l of part.lines) {
        l.points = l.points.map(([x, y]) => [x + dx, y + dy]);
        if (l.anchor) l.anchor = [l.anchor[0] + dx, l.anchor[1] + dy];
    }
    for (const s of part.stations) {
        s.x += dx;
        s.y += dy;
    }
}

/**
 * Blocks into columns of a standard width, each where it ends up highest; a wide block spans
 * several columns and is placed first. The number of columns is the one that best fits `aspect`.
 */
function pack(blocks: Block[], aspect: number): Omit<TubeLayout, "districts"> {
    const colWidth = MAX_COL * COL + NAME_REACH + GUTTER_X;
    const span = (b: Block): number => Math.max(1, Math.ceil((b.width + GUTTER_X) / colWidth));
    const order = [...blocks.keys()].sort((a, b) => span(blocks[b]) - span(blocks[a]) || a - b);
    const place = (n: number): { at: Array<[number, number]>; width: number; height: number } => {
        const heights = new Array<number>(n).fill(0);
        const at = new Array<[number, number]>(blocks.length);
        for (const i of order) {
            const w = Math.min(span(blocks[i]), n);
            let best = 0;
            let bestTop = Infinity;
            for (let c = 0; c + w <= n; c++) {
                const top = Math.max(...heights.slice(c, c + w));
                if (top < bestTop) (best = c), (bestTop = top);
            }
            at[i] = [best * colWidth, bestTop];
            for (let c = best; c < best + w; c++) heights[c] = bestTop + blocks[i].height + GUTTER_Y;
        }
        const width = Math.max(0, ...blocks.map((b, i) => at[i][0] + b.width));
        return { at, width, height: Math.max(0, ...heights) };
    };
    const widest = Math.max(1, ...blocks.map(span));
    let best = place(widest);
    let bestScore = Infinity;
    for (let n = widest; n <= Math.max(widest, blocks.length * widest); n++) {
        const p = place(n);
        const score = Math.abs(Math.log(p.width / Math.max(1, p.height) / aspect));
        if (score < bestScore) (best = p), (bestScore = score);
        // More columns only make it wider from here.
        if (p.width / Math.max(1, p.height) > aspect * 2) break;
    }

    const layout: Omit<TubeLayout, "districts"> = { lines: [], stations: [], links: [], bounds: { x0: -COL, y0: 0, x1: COL, y1: COL } };
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
