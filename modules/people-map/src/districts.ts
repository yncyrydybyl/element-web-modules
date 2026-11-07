/**
 * Districts: a fixed "geography" for the map. Every room gets one home, in one of a few districts
 * that always sit in the same place, and within that a named group:
 *
 * - Communities: the user's spaces with rooms in them; each top-level space is a group.
 * - Events: spaces about an event (a year, "camp", "conference", "C3" …), each a group, even
 *   when it sits inside a bigger space.
 * - People: DMs, rooms of two that are DMs in all but name (by network), and small private
 *   group chats outside any space.
 * - Bridges: group chats bridged from WhatsApp, Telegram, Signal …, one group per network.
 * - Unsorted: the remaining rooms outside any space, grouped by a shared name prefix, a space
 *   whose name they start with, or the server they live on.
 * - Archive: deleted, test and nameless rooms, and rooms nobody else is in.
 *
 * Positions come only from district and group, so a room stays where it is between openings;
 * unread messages and activity change how it looks, never where it is.
 */

import type { RoomGraph, RoomInfo } from "./rooms";

export type DistrictId = "communities" | "events" | "people" | "bridges" | "unsorted" | "archive";

export const DISTRICTS: DistrictId[] = ["communities", "events", "people", "bridges", "unsorted", "archive"];

export interface Group {
    /** Stable: `<district>/<what it's grouped by>`. */
    key: string;
    district: DistrictId;
    label: string;
    /** The top-level space the group stands for, if any. */
    spaceId?: string;
    rooms: string[];
}

export interface Districts {
    groups: Group[];
    /** Room id → group key. Every room that isn't a space has exactly one. */
    home: Map<string, string>;
}

/** The fixed names of groups, translated. Networks and spaces are named as they are. */
export interface GroupNames {
    older: string;
    smallGroups: string;
    loose: string;
    otherSpaces: string;
    junk: string;
    nameless: string;
    solo: string;
}

export const ENGLISH_NAMES: GroupNames = {
    older: "%(network)s (older)",
    smallGroups: "Small groups",
    loose: "Loose rooms",
    otherSpaces: "Other spaces",
    junk: "Deleted & tests",
    nameless: "No name",
    solo: "Only you",
};

export const NETWORKS: Array<[string, RegExp]> = [
    ["WhatsApp", /whatsapp|\(WA\)|@whatsapp_/i],
    ["Telegram", /telegram|\(TG\)|@telegram_/i],
    ["Signal", /signal|@signal_/i],
    ["Discord", /discord|@discord_/i],
    ["Slack", /slack|@slack_/i],
    ["IRC", /\birc\b|libera|oftc/i],
];

const EVENT = /\b(19|20)\d{2}\b|\b\d{1,2}c3\b|camp|conference|congress|summit|fosdem|froscon|fossasia|hackathon|meetup|festival|workation|easterhegg|ethberlin|ethbrno|\bevents?\b/i;
const JUNK = /^(deleted|test|testing|tmp|old)\b|^\(deleted|\btest-?room\b/i;
/** People you haven't written with for this long are filed separately. */
const OLDER_MS = 180 * 86_400_000;
/** Up to this many members, a room without an address and outside any space is a private group chat. */
const SMALL_GROUP = 10;
/** Below this many rooms, a prefix or server doesn't make a group of its own. */
const MIN_GROUP = 3;
const NO_PREFIX = new Set(["the", "a", "an", "my", "our", "der", "die", "das", "re", "fwd", "new"]);

/** The network a room is bridged from, by its name, aliases or the network of a space it's in. */
export function networkOf(text: string): string | undefined {
    return NETWORKS.find(([, re]) => re.test(text))?.[0];
}

export function buildDistricts(graph: RoomGraph, names: GroupNames = ENGLISH_NAMES, now = Date.now()): Districts {
    const groups = new Map<string, Group>();
    const home = new Map<string, string>();
    const put = (key: string, district: DistrictId, label: string, roomId: string, spaceId?: string): void => {
        let g = groups.get(key);
        if (!g) groups.set(key, (g = { key, district, label, spaceId, rooms: [] }));
        g.rooms.push(roomId);
        home.set(roomId, key);
    };

    // Each room's top-level spaces, nearest first.
    const tops = new Map<string, string[]>();
    const topOf = (id: string, seen = new Set<string>()): string[] => {
        if (tops.has(id)) return tops.get(id)!;
        const room = graph.rooms.get(id);
        if (!room || seen.has(id)) return [];
        seen.add(id);
        const out = room.parents.length ? [...new Set(room.parents.flatMap((p) => (graph.rooms.get(p)!.parents.length ? topOf(p, seen) : [p])))] : [];
        tops.set(id, out);
        return out;
    };
    const spaceNetwork = (spaceId: string): string | undefined => networkOf(graph.rooms.get(spaceId)!.name);
    const isEvent = (r: RoomInfo): boolean => EVENT.test(r.name) || r.aliases.some((a) => /events\.|\.events/.test(a));
    /** The nearest event space above a room, following first parents. */
    const eventSpaceOf = (id: string): string | undefined => {
        const seen = new Set<string>();
        let parent = graph.rooms.get(id)?.parents[0];
        while (parent && !seen.has(parent)) {
            seen.add(parent);
            if (isEvent(graph.rooms.get(parent)!)) return parent;
            parent = graph.rooms.get(parent)?.parents[0];
        }
        return undefined;
    };

    const rooms = [...graph.rooms.values()].filter((r) => r.kind !== "space");
    const unsorted: RoomInfo[] = [];
    for (const r of rooms) {
        const text = [r.name, ...r.aliases].join(" ");
        const spaces = topOf(r.id);
        const bridgeSpace = spaces.map(spaceNetwork).find(Boolean);
        const network = networkOf(text) ?? bridgeSpace;
        const unnamed = r.name.startsWith("@") || r.name.startsWith("!");
        if (JUNK.test(r.name)) {
            put("archive/junk", "archive", names.junk, r.id);
        } else if (r.name.startsWith("!") && !spaces.length) {
            put("archive/nameless", "archive", names.nameless, r.id);
        } else if (r.members <= 1 && r.kind !== "dm" && !spaces.length) {
            put("archive/solo", "archive", names.solo, r.id);
        } else if (r.kind === "dm" || (r.members <= 2 && (unnamed || !spaces.length || bridgeSpace))) {
            const net = network ?? "Matrix";
            // The busiest network is split by activity; a missing timestamp counts as recent.
            if (net === "Matrix" && r.lastActive > 0 && now - r.lastActive > OLDER_MS) {
                put("people/Matrix-older", "people", names.older.replace("%(network)s", net), r.id);
            } else {
                put(`people/${net}`, "people", net, r.id);
            }
        } else if (spaces.length && !bridgeSpace) {
            // An event space anywhere above the room makes its group, even inside a bigger space.
            const event = eventSpaceOf(r.id);
            const top = event ?? spaces[0];
            put(`${event ? "events" : "communities"}/${top}`, event ? "events" : "communities", graph.rooms.get(top)!.name, r.id, top);
        } else if (network) {
            put(`bridges/${network}`, "bridges", network, r.id);
        } else {
            unsorted.push(r);
        }
    }

    // Unsorted rooms: next to a space whose name they start with, or with others of the same
    // name prefix, or of the same server; whatever is left stays loose.
    const spaceByWord = new Map<string, RoomInfo>();
    for (const id of graph.topSpaces) {
        const w = firstWord(graph.rooms.get(id)!.name);
        if (w && !spaceByWord.has(w)) spaceByWord.set(w, graph.rooms.get(id)!);
    }
    const byPrefix = groupBy(unsorted, (r) => firstWord(r.name));
    const byServer = groupBy(unsorted, (r) => serverOf(r));
    const homeServer = mostCommon(rooms.map(serverOf));
    for (const r of unsorted) {
        const w = firstWord(r.name);
        const space = w ? spaceByWord.get(w) : undefined;
        const server = serverOf(r);
        if (space && graph.rooms.get(space.id)) {
            const event = isEvent(space);
            put(`${event ? "events" : "communities"}/${space.id}`, event ? "events" : "communities", space.name, r.id, space.id);
        } else if (isEvent(r) && w && (byPrefix.get(w)?.length ?? 0) >= MIN_GROUP) {
            put(`events/~${w}`, "events", capitalise(w), r.id);
        } else if (w && (byPrefix.get(w)?.length ?? 0) >= MIN_GROUP) {
            put(`unsorted/~${w}`, "unsorted", capitalise(w), r.id);
        } else if (server && server !== homeServer && (byServer.get(server)?.length ?? 0) >= MIN_GROUP) {
            put(`unsorted/@${server}`, "unsorted", server, r.id);
        } else if (r.members <= SMALL_GROUP && !r.aliases.length) {
            // A handful of people and no address: a private group chat.
            put("people/groups", "people", names.smallGroups, r.id);
        } else {
            put("unsorted/loose", "unsorted", names.loose, r.id);
        }
    }

    // Top-level spaces with no group of their own (empty, or all their rooms live elsewhere,
    // like a bridge's space) are still somewhere to go.
    const shown = new Set([...groups.values()].map((g) => g.spaceId));
    for (const id of graph.topSpaces) if (!shown.has(id)) put("unsorted/spaces", "unsorted", names.otherSpaces, id);

    const order = (g: Group): number => DISTRICTS.indexOf(g.district);
    return {
        groups: [...groups.values()].sort((a, b) => order(a) - order(b) || b.rooms.length - a.rooms.length || a.label.localeCompare(b.label)),
        home,
    };
}

/** The first word of a name, lower case, if it's a useful one ("38c3" of "38C3 - Hall 1"). */
export function firstWord(name: string): string | undefined {
    const w = /^[\s[(#]*([\p{L}\p{N}][\p{L}\p{N}.+'-]*)/u.exec(name)?.[1]?.toLowerCase().replace(/[.'-]+$/, "");
    return w && w.length >= 2 && !NO_PREFIX.has(w) ? w : undefined;
}

function serverOf(r: RoomInfo): string | undefined {
    return (r.aliases[0] ?? r.id).split(":").slice(1).join(":") || undefined;
}

function capitalise(w: string): string {
    return w.charAt(0).toUpperCase() + w.slice(1);
}

function groupBy<T, K>(items: T[], key: (item: T) => K | undefined): Map<K, T[]> {
    const out = new Map<K, T[]>();
    for (const item of items) {
        const k = key(item);
        if (k !== undefined) out.set(k, [...(out.get(k) ?? []), item]);
    }
    return out;
}

function mostCommon<T>(items: Array<T | undefined>): T | undefined {
    const counts = new Map<T, number>();
    for (const i of items) if (i !== undefined) counts.set(i, (counts.get(i) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
}
