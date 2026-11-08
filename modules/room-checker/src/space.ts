/**
 * A space's rooms and their state, read from Element's matrix-js-sdk client, and the quick fixes
 * that change it. The module API has no room state, so this goes through `window.mxMatrixClientPeg`.
 */

import {
    checkRoom,
    creatorsOf,
    policyContent,
    POLICY_TYPE,
    sanitiseExceptions,
    sanitisePolicies,
    topicOf,
    withException,
    type CheckedRoom,
    type Exception,
    type Exceptions,
    type PolicyConfig,
    type PolicyId,
    type PolicySet,
    type RoomReport,
} from "./policies";

/** The parts of matrix-js-sdk's `MatrixEvent` used here. */
export interface SdkEvent {
    getContent(): Record<string, unknown>;
    getStateKey(): string | undefined;
    getSender?(): string | undefined;
    getTs?(): number;
}

/** The parts of matrix-js-sdk's `Room` used here. */
export interface SdkRoom {
    roomId: string;
    name: string;
    isSpaceRoom(): boolean;
    getMyMembership(): string;
    currentState: {
        getStateEvents(type: string): SdkEvent[];
        getStateEvents(type: string, stateKey: string): SdkEvent | null;
        maySendStateEvent(type: string, userId: string): boolean;
    };
}

/** The parts of matrix-js-sdk's `MatrixClient` used here. */
export interface SdkClient {
    getUserId(): string | null;
    getDomain?(): string | null;
    getRoom(roomId: string): SdkRoom | null;
    getVisibleRooms(): SdkRoom[];
    sendStateEvent(roomId: string, type: string, content: Record<string, unknown>, stateKey?: string): Promise<unknown>;
    setRoomTopic?(roomId: string, topic: string): Promise<unknown>;
    createAlias(alias: string, roomId: string): Promise<unknown>;
    uploadContent(file: File): Promise<{ content_uri: string }>;
    getRoomHierarchy?(roomId: string, limit?: number, maxDepth?: number, suggestedOnly?: boolean, fromToken?: string): Promise<{ rooms: HierarchyRoom[]; next_batch?: string }>;
    on?(event: string, listener: (...args: unknown[]) => void): unknown;
    removeListener?(event: string, listener: (...args: unknown[]) => void): unknown;
}

export function getSdkClient(): SdkClient | undefined {
    const peg = (window as { mxMatrixClientPeg?: { get?(): SdkClient | null } }).mxMatrixClientPeg;
    try {
        return peg?.get?.() ?? undefined;
    } catch {
        return undefined;
    }
}

export interface SpaceInfo {
    id: string;
    name: string;
    /** 0 for a top-level space, 1 for its sub-spaces … */
    depth: number;
}

/** The spaces you're in as a tree: top-level spaces by name, each followed by its sub-spaces. */
export function joinedSpaces(client: SdkClient): SpaceInfo[] {
    const spaces = client.getVisibleRooms().filter((r) => r.isSpaceRoom() && r.getMyMembership() === "join");
    const ids = new Set(spaces.map((r) => r.roomId));
    const children = new Map<string, string[]>();
    const isChild = new Set<string>();
    for (const r of spaces) {
        const kids = r.currentState
            .getStateEvents("m.space.child")
            .filter((ev) => Array.isArray(ev.getContent().via) && (ev.getContent().via as unknown[]).length)
            .map((ev) => ev.getStateKey()!)
            .filter((id) => ids.has(id) && id !== r.roomId);
        children.set(r.roomId, kids);
        kids.forEach((k) => isChild.add(k));
    }
    const name = (id: string): string => client.getRoom(id)?.name || id;
    const byName = (a: string, b: string): number => name(a).localeCompare(name(b));
    const out: SpaceInfo[] = [];
    const seen = new Set<string>();
    const walk = (id: string, depth: number): void => {
        if (seen.has(id)) return;
        seen.add(id);
        out.push({ id, name: name(id), depth });
        for (const k of [...(children.get(id) ?? [])].sort(byName)) walk(k, depth + 1);
    };
    for (const id of [...ids].filter((id) => !isChild.has(id)).sort(byName)) walk(id, 0);
    // Spaces only reachable through a loop of sub-spaces.
    for (const id of [...ids].sort(byName)) walk(id, 0);
    return out;
}

export interface SpacePolicies {
    policies: PolicySet;
    exceptions: Exceptions;
    /** False: the space has no policies yet and the defaults apply. */
    saved: boolean;
    by?: string;
    at?: number;
    /** You may change them (send the state event in the space). */
    canEdit: boolean;
}

export function readPolicies(client: SdkClient, spaceId: string): SpacePolicies {
    const space = client.getRoom(spaceId);
    const ev = space?.currentState.getStateEvents(POLICY_TYPE, "");
    const content = ev?.getContent();
    const saved = Boolean(content && Object.keys(content).length);
    const me = client.getUserId() ?? "";
    return {
        policies: sanitisePolicies(saved ? content : undefined),
        exceptions: sanitiseExceptions(content),
        saved,
        by: saved ? ev?.getSender?.() : undefined,
        at: saved ? ev?.getTs?.() : undefined,
        canEdit: Boolean(space?.currentState.maySendStateEvent(POLICY_TYPE, me)),
    };
}

/** Saves the policies, keeping the exceptions as they are in the space now. */
export function savePolicies(client: SdkClient, spaceId: string, policies: PolicySet): Promise<unknown> {
    const current = readPolicies(client, spaceId);
    return client.sendStateEvent(spaceId, POLICY_TYPE, policyContent(policies, current.exceptions), "");
}

/**
 * Accepts a failure for one room (or, without `reason`, takes that back). Reads the space's
 * current policies first, so a change someone else just made isn't overwritten.
 */
export function saveException(client: SdkClient, spaceId: string, roomId: string, id: PolicyId, reason?: string): Promise<unknown> {
    const current = readPolicies(client, spaceId);
    const exception: Exception | undefined = reason === undefined ? undefined : { reason, by: client.getUserId() ?? "", at: Date.now() };
    return client.sendStateEvent(spaceId, POLICY_TYPE, policyContent(current.policies, withException(current.exceptions, roomId, id, exception)), "");
}

export interface RoomEntry {
    id: string;
    name: string;
    /** The (sub)space it's listed in. */
    parentSpace: string;
    /** Missing for rooms you aren't in: they're checked from the server's summary, as far as it goes. */
    room?: SdkRoom;
    /** Missing when there's nothing to check it with (not joined, and the server didn't describe it). */
    report?: RoomReport;
}

/** A room as the server's space hierarchy describes it (also to people who aren't in it). */
export interface HierarchyRoom {
    room_id: string;
    name?: string;
    topic?: string;
    avatar_url?: string;
    canonical_alias?: string;
    join_rule?: string;
    world_readable?: boolean;
    guest_can_join?: boolean;
    room_type?: string;
    /** Room summary fields (MSC3266); Synapse adds them to the hierarchy. */
    room_version?: string;
    encryption?: string;
    "im.nheko.summary.encryption"?: string;
    children_state?: Array<{ state_key?: string; content?: { via?: unknown } }>;
}

/**
 * Every room in the space and its sub-spaces (the sub-spaces themselves aren't checked), each
 * checked against the space's policies. Rooms listed twice count once, under the first space.
 */
export function spaceRooms(
    client: SdkClient,
    spaceId: string,
    policies: PolicySet,
    exceptions: Exceptions = {},
    hierarchy: Map<string, HierarchyRoom> = new Map(),
): RoomEntry[] {
    const out: RoomEntry[] = [];
    const seen = new Set<string>([spaceId]);
    const queue = [spaceId];
    while (queue.length) {
        const sid = queue.shift()!;
        for (const id of childrenOf(client, sid, hierarchy)) {
            if (seen.has(id)) continue;
            seen.add(id);
            const room = client.getRoom(id);
            const joined = room && room.getMyMembership() === "join" ? room : undefined;
            const summary = hierarchy.get(id);
            // Sub-spaces you aren't in too: the server lists their children.
            if (joined ? joined.isSpaceRoom() : summary?.room_type === "m.space") {
                queue.push(id);
                continue;
            }
            const entry: RoomEntry = { id, name: joined?.name || summary?.name || summary?.canonical_alias || id, parentSpace: sid, room: joined };
            const checked = joined ? checkedRoom(joined, sid) : summary ? summaryRoom(summary, sid) : undefined;
            if (checked) entry.report = checkRoom(checked, policies, exceptions);
            out.push(entry);
        }
    }
    return out;
}

/** A space's children: from its state when you're in it, else from the server's hierarchy. */
function childrenOf(client: SdkClient, spaceId: string, hierarchy: Map<string, HierarchyRoom>): string[] {
    const space = client.getRoom(spaceId);
    const children =
        space && space.getMyMembership() === "join"
            ? space.currentState.getStateEvents("m.space.child").map((ev) => ({ state_key: ev.getStateKey(), content: ev.getContent() }))
            : (hierarchy.get(spaceId)?.children_state ?? []);
    return children.filter((c) => c.state_key && Array.isArray(c.content?.via) && (c.content.via as unknown[]).length).map((c) => c.state_key!);
}

/** At most this many hierarchy pages (of up to 100 rooms) per space. */
const HIERARCHY_PAGES = 20;

/** The space's rooms and sub-spaces as the server describes them, also those you aren't in. */
export async function fetchHierarchy(client: SdkClient, spaceId: string): Promise<Map<string, HierarchyRoom>> {
    const rooms = new Map<string, HierarchyRoom>();
    let from: string | undefined;
    try {
        for (let page = 0; page < HIERARCHY_PAGES && client.getRoomHierarchy; page++) {
            const res = await client.getRoomHierarchy(spaceId, 100, undefined, false, from);
            for (const r of res.rooms ?? []) rooms.set(r.room_id, r);
            from = res.next_batch;
            if (!from) break;
        }
    } catch {
        // What came so far; rooms you aren't in stay unchecked.
    }
    return rooms;
}

/** Policies the server's summary can't answer: the power levels and the room's parents aren't in it. */
const NOT_IN_SUMMARY = new Set<PolicyId>(["admins", "space_parent"]);
const HISTORY_FOR_MEMBERS = ["joined", "invited", "shared"];

/** A room you aren't in, checked from the server's summary of it. */
export function summaryRoom(r: HierarchyRoom, parentSpace: string): CheckedRoom {
    const encryption = r.encryption ?? r["im.nheko.summary.encryption"];
    // A server that sends summary fields leaves `encryption` out for unencrypted rooms.
    const knowsEncryption = encryption !== undefined || r.room_version !== undefined;
    const state: Record<string, Record<string, unknown> | undefined> = {
        "m.room.name": r.name ? { name: r.name } : undefined,
        "m.room.topic": r.topic ? { topic: r.topic } : undefined,
        "m.room.avatar": r.avatar_url ? { url: r.avatar_url } : undefined,
        "m.room.canonical_alias": r.canonical_alias ? { alias: r.canonical_alias } : undefined,
        "m.room.join_rules": r.join_rule ? { join_rule: r.join_rule } : undefined,
        "m.room.encryption": encryption ? { algorithm: encryption } : undefined,
        "m.room.guest_access": { guest_access: r.guest_can_join ? "can_join" : "forbidden" },
        // Not readable by anyone means members only, but not which of the three member settings.
        "m.room.history_visibility": { history_visibility: r.world_readable ? "world_readable" : "shared" },
    };
    return {
        id: r.room_id,
        parentSpace,
        state: (type, stateKey = "") => (stateKey ? undefined : state[type]),
        unknown: (id, config) =>
            NOT_IN_SUMMARY.has(id) ||
            (id === "encryption" && !knowsEncryption) ||
            (id === "join_rule" && !r.join_rule) ||
            // Members only: it passes when every members-only setting is allowed, else it depends on which.
            (id === "history_visibility" && !r.world_readable && !HISTORY_FOR_MEMBERS.every((v) => config.allowed?.includes(v))),
    };
}

export function checkedRoom(room: SdkRoom, parentSpace: string): CheckedRoom {
    const create = room.currentState.getStateEvents("m.room.create", "");
    const content = create?.getContent() ?? {};
    return {
        id: room.roomId,
        parentSpace,
        creators: creatorsOf(content.room_version, create?.getSender?.(), content.additional_creators),
        state: (type, stateKey = "") => {
            const content = room.currentState.getStateEvents(type, stateKey)?.getContent();
            return content && Object.keys(content).length ? content : undefined;
        },
    };
}

export function topicOfRoom(room: SdkRoom): string {
    return topicOf(room.currentState.getStateEvents("m.room.topic", "")?.getContent());
}

/** The state event each fix sends; policies without one can't be fixed here. */
export const FIX_EVENT: Partial<Record<PolicyId, string>> = {
    name: "m.room.name",
    topic: "m.room.topic",
    avatar: "m.room.avatar",
    encryption: "m.room.encryption",
    join_rule: "m.room.join_rules",
    history_visibility: "m.room.history_visibility",
    guest_access: "m.room.guest_access",
    address: "m.room.canonical_alias",
    space_parent: "m.space.parent",
};

/** What the fix asks for: typed text, a picture, or nothing (one click). */
export const FIX_INPUT: Partial<Record<PolicyId, "text" | "file">> = { name: "text", topic: "text", avatar: "file", address: "text" };

export function canFix(client: SdkClient, entry: RoomEntry, id: PolicyId): boolean {
    const type = FIX_EVENT[id];
    const me = client.getUserId();
    return Boolean(type && me && entry.room?.currentState.maySendStateEvent(type, me));
}

/** The value a one-click fix sets (join rule, history visibility): the first allowed one. */
export function fixValue(id: PolicyId, config: PolicyConfig): string | undefined {
    return id === "join_rule" || id === "history_visibility" ? config.allowed?.[0] : undefined;
}

export function serverOf(id: string): string {
    return id.slice(id.indexOf(":") + 1);
}

/** Changes the room so it passes the policy. `input` is the text or picture the fix asked for. */
export async function applyFix(client: SdkClient, entry: RoomEntry, id: PolicyId, config: PolicyConfig, input?: string | File): Promise<void> {
    const roomId = entry.id;
    const text = typeof input === "string" ? input.trim() : "";
    const send = (type: string, content: Record<string, unknown>, key = ""): Promise<unknown> => client.sendStateEvent(roomId, type, content, key);
    switch (id) {
        case "name":
            await send("m.room.name", { name: text });
            return;
        case "topic":
            if (client.setRoomTopic) await client.setRoomTopic(roomId, text);
            else await send("m.room.topic", { topic: text, "m.topic": { "m.text": [{ body: text, mimetype: "text/plain" }] } });
            return;
        case "avatar": {
            if (!(input instanceof File)) throw new Error("no picture");
            const { content_uri } = await client.uploadContent(input);
            await send("m.room.avatar", { url: content_uri });
            return;
        }
        case "encryption":
            await send("m.room.encryption", { algorithm: "m.megolm.v1.aes-sha2" });
            return;
        case "join_rule": {
            const rule = fixValue(id, config)!;
            const content: Record<string, unknown> = { join_rule: rule };
            // Restricted: members of the space may join.
            if (rule === "restricted" || rule === "knock_restricted") content.allow = [{ type: "m.room_membership", room_id: entry.parentSpace }];
            await send("m.room.join_rules", content);
            return;
        }
        case "history_visibility":
            await send("m.room.history_visibility", { history_visibility: fixValue(id, config)! });
            return;
        case "guest_access":
            await send("m.room.guest_access", { guest_access: "forbidden" });
            return;
        case "address": {
            const domain = client.getDomain?.() ?? serverOf(client.getUserId() ?? "");
            const local = text.replace(/^#/, "").replace(/:.*$/, "");
            const alias = `#${local}:${domain}`;
            await client.createAlias(alias, roomId);
            const current = entry.room?.currentState.getStateEvents("m.room.canonical_alias", "")?.getContent() ?? {};
            await send("m.room.canonical_alias", { ...current, alias });
            return;
        }
        case "space_parent":
            await send("m.space.parent", { via: [serverOf(entry.parentSpace)], canonical: true }, entry.parentSpace);
            return;
        case "admins":
            throw new Error("can't be fixed here");
    }
}

/** A room name as an address: "Team Berlin" → "team-berlin". */
export function aliasFromName(name: string): string {
    return name
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9._=-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
