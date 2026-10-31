/**
 * The user's spaces and rooms as a graph, read from Element's matrix-js-sdk client.
 *
 * The module API only exposes a flat room list (id, name, last activity), with no spaces, room
 * types or unread counts. Element Web keeps its client on `window.mxMatrixClientPeg`, so the
 * module reads the hierarchy from there and falls back to the flat list when it isn't available.
 */

import type { Api } from "@element-hq/element-web-module-api";

import type { AvatarClient } from "./avatars";

/** The parts of matrix-js-sdk's `Room` used here. */
export interface SdkRoom {
    roomId: string;
    name: string;
    isSpaceRoom(): boolean;
    getMyMembership(): string;
    getCanonicalAlias(): string | null;
    getAltAliases?(): string[];
    getJoinedMemberCount(): number;
    getLastActiveTimestamp(): number;
    getUnreadNotificationCount(type?: "total" | "highlight"): number;
    getMxcAvatarUrl?(): string | null;
    /** The other person in a DM, whose avatar Element shows when the room has none. */
    getAvatarFallbackMember?(): { getMxcAvatarUrl(): string | undefined } | undefined;
    currentState: { getStateEvents(type: string): SdkEvent[] };
}

export interface SdkEvent {
    getStateKey(): string | undefined;
    getContent(): Record<string, unknown>;
}

export interface SdkClient extends AvatarClient {
    getVisibleRooms(): SdkRoom[];
    getAccountData(type: string): { getContent(): Record<string, unknown> } | undefined;
}

export type RoomKind = "space" | "room" | "dm";

export interface RoomInfo {
    id: string;
    name: string;
    kind: RoomKind;
    aliases: string[];
    members: number;
    lastActive: number;
    unread: number;
    highlight: number;
    invite: boolean;
    /** `mxc://` URL of the room's avatar (or, for a DM without one, the other person's). */
    avatar?: string;
    /** Joined child spaces and rooms (spaces only), in the space's `order`. */
    children: string[];
    /** Joined spaces that list this room as a child. */
    parents: string[];
}

export interface RoomGraph {
    rooms: Map<string, RoomInfo>;
    /** Spaces that aren't a child of another joined space. */
    topSpaces: string[];
    /** Rooms (not DMs) in no joined space. */
    orphans: string[];
    dms: string[];
}

export function getSdkClient(): SdkClient | undefined {
    const peg = (window as { mxMatrixClientPeg?: { get?(): SdkClient | null } }).mxMatrixClientPeg;
    try {
        return peg?.get?.() ?? undefined;
    } catch {
        return undefined;
    }
}

export function buildGraph(client: SdkClient): RoomGraph {
    const dmIds = new Set<string>();
    const direct = client.getAccountData("m.direct")?.getContent() ?? {};
    for (const ids of Object.values(direct)) if (Array.isArray(ids)) for (const id of ids) dmIds.add(String(id));

    const rooms = new Map<string, RoomInfo>();
    const sdkRooms = client.getVisibleRooms().filter((r) => ["join", "invite"].includes(r.getMyMembership()));
    for (const r of sdkRooms) {
        const isSpace = r.isSpaceRoom();
        rooms.set(r.roomId, {
            id: r.roomId,
            name: r.name || r.getCanonicalAlias() || r.roomId,
            kind: isSpace ? "space" : dmIds.has(r.roomId) ? "dm" : "room",
            aliases: [r.getCanonicalAlias(), ...(r.getAltAliases?.() ?? [])].filter((a): a is string => Boolean(a)),
            members: r.getJoinedMemberCount(),
            lastActive: r.getLastActiveTimestamp(),
            unread: isSpace ? 0 : r.getUnreadNotificationCount("total"),
            highlight: isSpace ? 0 : r.getUnreadNotificationCount("highlight"),
            invite: r.getMyMembership() === "invite",
            avatar: r.getMxcAvatarUrl?.() || (isSpace ? undefined : r.getAvatarFallbackMember?.()?.getMxcAvatarUrl()) || undefined,
            children: [],
            parents: [],
        });
    }

    for (const r of sdkRooms) {
        const space = rooms.get(r.roomId);
        if (space?.kind !== "space" || space.invite) continue;
        const children = r.currentState
            .getStateEvents("m.space.child")
            // A child event without `via` is a removed child.
            .filter((ev) => Array.isArray(ev.getContent().via) && (ev.getContent().via as unknown[]).length > 0)
            .map((ev) => ({ id: ev.getStateKey() ?? "", order: ev.getContent().order }))
            .filter((c) => c.id !== r.roomId && rooms.has(c.id))
            .sort((a, b) => compareOrder(a.order, b.order) || rooms.get(a.id)!.name.localeCompare(rooms.get(b.id)!.name));
        for (const child of children) {
            space.children.push(child.id);
            rooms.get(child.id)!.parents.push(space.id);
        }
    }

    const byName = (a: string, b: string): number => rooms.get(a)!.name.localeCompare(rooms.get(b)!.name);
    const all = [...rooms.values()];
    const topSpaces = all.filter((r) => r.kind === "space" && r.parents.length === 0).map((r) => r.id);
    // Spaces that only appear inside a cycle (A ⊃ B ⊃ A) would otherwise vanish.
    const reached = reachable(rooms, topSpaces);
    for (const r of all) if (r.kind === "space" && !reached.has(r.id)) topSpaces.push(r.id), reachable(rooms, [r.id], reached);

    return {
        rooms,
        topSpaces: topSpaces.sort(byName),
        orphans: all.filter((r) => r.kind === "room" && r.parents.length === 0).map((r) => r.id).sort(byName),
        dms: all.filter((r) => r.kind === "dm" && r.parents.length === 0).map((r) => r.id).sort(byName),
    };
}

/** Spaces in tree order with their depth, for the list on the left. */
export function spaceTree(graph: RoomGraph): Array<{ id: string; depth: number }> {
    const out: Array<{ id: string; depth: number }> = [];
    const seen = new Set<string>();
    const walk = (id: string, depth: number): void => {
        const room = graph.rooms.get(id);
        if (room?.kind !== "space" || seen.has(id)) return;
        seen.add(id);
        out.push({ id, depth });
        for (const child of room.children) walk(child, depth + 1);
    };
    for (const id of graph.topSpaces) walk(id, 0);
    return out;
}

export interface SpaceStats {
    rooms: number;
    unread: number;
    highlight: number;
}

/** Rooms below each space, through its sub-spaces and each counted once, with their unread messages. */
export function spaceStats(graph: RoomGraph): Map<string, SpaceStats> {
    const stats = new Map<string, SpaceStats>();
    for (const space of graph.rooms.values()) {
        if (space.kind !== "space") continue;
        const s: SpaceStats = { rooms: 0, unread: 0, highlight: 0 };
        for (const id of reachable(graph.rooms, [space.id])) {
            const r = graph.rooms.get(id)!;
            if (r.kind === "space") continue;
            s.rooms++;
            s.unread += r.unread;
            s.highlight += r.highlight;
        }
        stats.set(space.id, s);
    }
    return stats;
}

/** Flat fallback from the module API when the SDK client isn't reachable. */
export function buildFlatGraph(api: Api): RoomGraph {
    const rooms = new Map<string, RoomInfo>();
    for (const r of api.stores.roomListStore.getRooms().value) {
        rooms.set(r.id, {
            id: r.id,
            name: r.name.value || r.id,
            kind: "room",
            aliases: [],
            members: 1,
            lastActive: r.getLastActiveTimestamp(),
            unread: 0,
            highlight: 0,
            invite: false,
            children: [],
            parents: [],
        });
    }
    return { rooms, topSpaces: [], orphans: [...rooms.keys()], dms: [] };
}

function reachable(rooms: Map<string, RoomInfo>, from: string[], seen = new Set<string>()): Set<string> {
    const stack = [...from];
    while (stack.length) {
        const id = stack.pop()!;
        if (seen.has(id)) continue;
        seen.add(id);
        stack.push(...(rooms.get(id)?.children ?? []));
    }
    return seen;
}

/** `m.space.child` ordering: valid `order` strings first, compared by code point. */
function compareOrder(a: unknown, b: unknown): number {
    const valid = (o: unknown): o is string => typeof o === "string" && o.length <= 50 && /^[\x20-\x7E]*$/.test(o);
    if (valid(a) && valid(b)) return a < b ? -1 : a > b ? 1 : 0;
    if (valid(a)) return -1;
    if (valid(b)) return 1;
    return 0;
}

/** The room currently open in Element, from the URL (`#/room/!id` or `#/room/#alias`). */
export function currentRoomId(graph: RoomGraph, hash = window.location.hash): string | undefined {
    const match = /^#\/room\/([^/?]+)/.exec(hash);
    if (!match) return undefined;
    const idOrAlias = decodeURIComponent(match[1]);
    if (graph.rooms.has(idOrAlias)) return idOrAlias;
    for (const r of graph.rooms.values()) if (r.aliases.includes(idOrAlias)) return r.id;
    return undefined;
}

/** "Space › Subspace" for each room, following its first parent. */
export function breadcrumb(graph: RoomGraph, id: string): string[] {
    const path: string[] = [];
    const seen = new Set([id]);
    let parent = graph.rooms.get(id)?.parents[0];
    while (parent && !seen.has(parent)) {
        seen.add(parent);
        path.unshift(graph.rooms.get(parent)!.name);
        parent = graph.rooms.get(parent)?.parents[0];
    }
    return path;
}
