import { matchSorter } from "match-sorter";

import type { RoomGraph, RoomInfo } from "./rooms";

/**
 * Rooms and spaces for the result list, ranked by match-sorter (exact > prefix > word start >
 * substring > acronym > letters in order), ties broken by `rank`.
 */
export function search(graph: RoomGraph, query: string, opts: { exclude?: string; limit?: number; rank(r: RoomInfo): number }): RoomInfo[] {
    const q = query.trim();
    const limit = opts.limit ?? 8;
    const all = [...graph.rooms.values()].filter((r) => r.id !== opts.exclude);
    if (!q) return [];
    return matchSorter(all, q, {
        keys: ["name", (r) => r.aliases.map((a) => a.slice(1))],
        baseSort: (a, b) => opts.rank(b.item) - opts.rank(a.item),
    }).slice(0, limit);
}
