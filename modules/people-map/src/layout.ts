/**
 * The people map's layout: you in the middle, one sector per context (a space, an event, a bridge
 * network, your DMs …), and in each sector the people you're closest to nearest the middle.
 *
 * Distance from the middle stands for closeness across the whole map: the 10 % closest people are
 * on the inner rings in every sector. A sector with more people than its rings hold pushes the
 * rest outward. Positions only depend on who is there and their rank, so the map looks the same
 * every time you open it as long as little has changed.
 */

import Graph from "graphology";

import type { DistrictId } from "./districts";
import type { PeopleData, Person, PersonKind, Presence } from "./people";

export interface PeopleNode {
    x: number;
    y: number;
    /** Radius, in graph units. */
    size: number;
    label: string;
    /** Missing on your own node in the middle. */
    personId?: string;
    me?: boolean;
    avatar?: string;
    district: DistrictId;
    group: string;
    closeness: number;
    kind: PersonKind;
    presence?: Presence;
    hasDm: boolean;
}

export type PeopleGraph = Graph<PeopleNode>;

export interface Sector {
    key: string;
    label: string;
    district: DistrictId;
    /** Angles in radians, counter-clockwise from the right (graph coordinates, y up). */
    a0: number;
    a1: number;
    /** Out to where its last person sits. */
    r1: number;
    count: number;
}

export interface PeopleLayout {
    graph: PeopleGraph;
    sectors: Sector[];
    /** Radius of the innermost ring. */
    inner: number;
    /** Radius of the outermost person. */
    outer: number;
}

/** Distance between neighbours. */
export const STEP = 10;
export const ME_SIZE = 12;
const INNER = 28;
const GAP = 0.05;
/** Even a sector of one gets room for its label. */
const MIN_ANGLE = 0.22;

export const ME_NODE = "me";

export function nodeKey(personId: string): string {
    return `p:${personId}`;
}

export function buildLayout(data: PeopleData, meName: string, meAvatar?: string): PeopleLayout {
    const graph: PeopleGraph = new Graph({ type: "undirected" });
    graph.addNode(ME_NODE, {
        x: 0,
        y: 0,
        size: ME_SIZE,
        label: meName,
        me: true,
        avatar: meAvatar,
        district: "people",
        group: "",
        closeness: 1,
        kind: "person",
        hasDm: false,
    });

    const total = data.people.size;
    // A disc that holds everyone at STEP apart, a little roomier for the gaps.
    const range = Math.max(STEP * 6, Math.sqrt((total * STEP * STEP) / Math.PI) * 1.35);
    const groups = data.groups.filter((g) => g.people.length);
    const weights = groups.map((g) => Math.pow(g.people.length, 0.75));
    const free = Math.PI * 2 - GAP * groups.length;
    // Small sectors are widened to MIN_ANGLE; the others share what's left.
    const angles = fitAngles(weights, free);

    const sectors: Sector[] = [];
    // The biggest context starts at the top and they go round clockwise, like a clock face.
    let angle = Math.PI / 2 + (angles[0] ?? 0) / 2;
    let outer = INNER;
    groups.forEach((g, i) => {
        const a1 = angle;
        const a0 = a1 - angles[i];
        angle = a0 - GAP;
        const placed = place(g.people.map((id) => data.people.get(id)!), a0, a1, range);
        let r1 = INNER;
        for (const { person, x, y } of placed) {
            r1 = Math.max(r1, Math.hypot(x, y));
            graph.addNode(nodeKey(person.id), {
                x,
                y,
                size: 2.2 + person.closeness * 2.6,
                label: person.name,
                personId: person.id,
                avatar: person.avatar,
                district: g.district,
                group: g.key,
                closeness: person.closeness,
                kind: person.kind,
                presence: person.presence,
                hasDm: Boolean(person.dm),
            });
        }
        outer = Math.max(outer, r1);
        sectors.push({ key: g.key, label: g.label, district: g.district, a0, a1, r1: r1 + STEP, count: g.people.length });
    });
    return { graph, sectors, inner: INNER, outer };
}

/** Each sector's angle: proportional to its weight, but never below MIN_ANGLE (when there's room). */
export function fitAngles(weights: number[], free: number): number[] {
    const min = Math.min(MIN_ANGLE, free / Math.max(1, weights.length));
    const fixed = new Set<number>();
    for (;;) {
        const rest = free - fixed.size * min;
        const sum = weights.reduce((s, w, i) => (fixed.has(i) ? s : s + w), 0);
        const out = weights.map((w, i) => (fixed.has(i) ? min : sum > 0 ? (w / sum) * rest : rest / weights.length));
        const tooSmall = out.findIndex((a, i) => !fixed.has(i) && a < min);
        if (tooSmall < 0) return out;
        fixed.add(tooSmall);
    }
}

/**
 * People (closest first) into the sector between angles a0 and a1: each on the first ring at or
 * beyond where their closeness puts them that still has a free place, nearest the sector's middle.
 */
function place(people: Person[], a0: number, a1: number, range: number): Array<{ person: Person; x: number; y: number }> {
    const rings: Array<{ slots: number[]; next: number }> = [];
    const ring = (k: number): { slots: number[]; next: number } => {
        while (rings.length <= k) {
            const r = INNER + rings.length * STEP;
            const n = Math.max(1, Math.floor(((a1 - a0) * r) / STEP));
            // Slot angles, from the middle outwards: 0, +1, -1, +2, -2 …
            const mid = (a0 + a1) / 2;
            const step = (a1 - a0) / n;
            const order = Array.from({ length: n }, (_, i) => i).sort((p, q) => Math.abs(p - (n - 1) / 2) - Math.abs(q - (n - 1) / 2) || p - q);
            rings.push({ slots: order.map((i) => mid - (a1 - a0) / 2 + step * (i + 0.5)), next: 0 });
        }
        return rings[k];
    };
    const out: Array<{ person: Person; x: number; y: number }> = [];
    for (const person of people) {
        let k = Math.round(((1 - person.closeness) * range) / STEP);
        while (ring(k).next >= ring(k).slots.length) k++;
        const r = ring(k);
        const a = r.slots[r.next++];
        const radius = INNER + k * STEP;
        out.push({ person, x: Math.cos(a) * radius, y: Math.sin(a) * radius });
    }
    return out;
}
