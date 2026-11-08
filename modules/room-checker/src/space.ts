/**
 * A space's rooms and their state, read from Element's matrix-js-sdk client, and the quick fixes
 * that change it. The module API has no room state, so this goes through `window.mxMatrixClientPeg`.
 */

import { checkRoom, creatorsOf, POLICY_TYPE, sanitisePolicies, topicOf, type CheckedRoom, type PolicyConfig, type PolicyId, type PolicySet, type RoomReport } from "./policies";

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
    getRoomHierarchy?(roomId: string, limit?: number): Promise<{ rooms: Array<{ room_id: string; name?: string; canonical_alias?: string; room_type?: string }> }>;
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
        saved,
        by: saved ? ev?.getSender?.() : undefined,
        at: saved ? ev?.getTs?.() : undefined,
        canEdit: Boolean(space?.currentState.maySendStateEvent(POLICY_TYPE, me)),
    };
}

export function savePolicies(client: SdkClient, spaceId: string, policies: PolicySet): Promise<unknown> {
    return client.sendStateEvent(spaceId, POLICY_TYPE, { version: 1, policies }, "");
}

export interface RoomEntry {
    id: string;
    name: string;
    /** The (sub)space it's listed in. */
    parentSpace: string;
    /** Missing for rooms you aren't in: their state can't be read. */
    room?: SdkRoom;
    report?: RoomReport;
}

/**
 * Every room in the space and its sub-spaces (the sub-spaces themselves aren't checked), each
 * checked against the space's policies. Rooms listed twice count once, under the first space.
 */
export function spaceRooms(client: SdkClient, spaceId: string, policies: PolicySet, names: Map<string, string> = new Map()): RoomEntry[] {
    const out: RoomEntry[] = [];
    const seen = new Set<string>([spaceId]);
    const queue = [spaceId];
    while (queue.length) {
        const sid = queue.shift()!;
        const space = client.getRoom(sid);
        if (!space) continue;
        for (const ev of space.currentState.getStateEvents("m.space.child")) {
            const id = ev.getStateKey();
            const via = ev.getContent().via;
            if (!id || seen.has(id) || !Array.isArray(via) || !via.length) continue;
            seen.add(id);
            const room = client.getRoom(id);
            const joined = room && room.getMyMembership() === "join" ? room : undefined;
            if (joined?.isSpaceRoom()) {
                queue.push(id);
                continue;
            }
            if (!joined && names.get(id) === SUBSPACE) continue;
            const entry: RoomEntry = { id, name: joined?.name || names.get(id) || id, parentSpace: sid, room: joined };
            if (joined) entry.report = checkRoom(checkedRoom(joined, sid), policies);
            out.push(entry);
        }
    }
    return out;
}

/** Marks a sub-space you aren't in, in the names from the hierarchy. */
export const SUBSPACE = "\u0000space";

/** Names of the space's rooms you aren't in, from the server's space hierarchy. */
export async function hierarchyNames(client: SdkClient, spaceId: string): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    try {
        const res = await client.getRoomHierarchy?.(spaceId, 200);
        for (const r of res?.rooms ?? []) names.set(r.room_id, r.room_type === "m.space" ? SUBSPACE : r.name || r.canonical_alias || r.room_id);
    } catch {
        // Without names, room IDs it is.
    }
    return names;
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
