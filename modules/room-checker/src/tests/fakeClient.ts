import { vi } from "vitest";

import type { SdkClient, SdkEvent, SdkRoom } from "../space";

export const ME = "@me:x";

export interface FakeRoom {
    id: string;
    name?: string;
    space?: boolean;
    /** Not joined: the client knows nothing about it. */
    left?: boolean;
    /** Children (spaces only). */
    children?: string[];
    /** State: "type" or "type|stateKey" → content. */
    state?: Record<string, Record<string, unknown>>;
    /** Event types you may not send here. */
    denied?: string[];
}

/** A well-kept room: passes every default policy. */
export function goodState(spaceId: string, name: string): Record<string, Record<string, unknown>> {
    return {
        "m.room.name": { name },
        "m.room.topic": { topic: `All about ${name}, for everyone in the team` },
        "m.room.avatar": { url: "mxc://x/a" },
        "m.room.encryption": { algorithm: "m.megolm.v1.aes-sha2" },
        "m.room.join_rules": { join_rule: "restricted", allow: [{ type: "m.room_membership", room_id: spaceId }] },
        "m.room.history_visibility": { history_visibility: "shared" },
        "m.room.power_levels": { users: { [ME]: 100, "@b:x": 100 } },
        [`m.room.member|${ME}`]: { membership: "join" },
        "m.room.member|@b:x": { membership: "join" },
        [`m.space.parent|${spaceId}`]: { via: ["x"] },
    };
}

/** A client over the given rooms. `sendStateEvent` writes into their state and emits "RoomState.events". */
export function fakeClient(rooms: FakeRoom[]) {
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
    const state = new Map(rooms.map((r) => [r.id, new Map(Object.entries(r.state ?? {}).map(([k, v]) => [k.includes("|") ? k : `${k}|`, { ...v }]))]));
    const byId = new Map(rooms.map((r) => [r.id, r]));
    const event = (stateKey: string, content: Record<string, unknown>, sender = ME): SdkEvent => ({
        getContent: () => content,
        getStateKey: () => stateKey,
        getSender: () => sender,
        getTs: () => Date.now() - 3_600_000,
    });
    const sdkRoom = (r: FakeRoom): SdkRoom => {
        const s = state.get(r.id)!;
        if (r.space) for (const c of r.children ?? []) if (!s.has(`m.space.child|${c}`)) s.set(`m.space.child|${c}`, { via: ["x"] });
        function getStateEvents(type: string): SdkEvent[];
        function getStateEvents(type: string, key: string): SdkEvent | null;
        function getStateEvents(type: string, key?: string): SdkEvent[] | SdkEvent | null {
            if (key === undefined)
                return [...s.entries()].filter(([k]) => k.startsWith(`${type}|`)).map(([k, v]) => event(k.slice(type.length + 1), v));
            const v = s.get(`${type}|${key}`);
            return v ? event(key, v) : null;
        }
        return {
            roomId: r.id,
            name: String(s.get("m.room.name|")?.name ?? r.name ?? ""),
            isSpaceRoom: () => Boolean(r.space),
            getMyMembership: () => "join",
            currentState: { getStateEvents, maySendStateEvent: (type: string) => !r.denied?.includes(type) },
        };
    };
    const emit = (name: string): void => listeners.get(name)?.forEach((l) => l());
    const sendStateEvent = vi.fn(async (roomId: string, type: string, content: Record<string, unknown>, key = "") => {
        state.get(roomId)!.set(`${type}|${key}`, content);
        emit("RoomState.events");
        return {};
    });
    const client = {
        getUserId: () => ME,
        getDomain: () => "x",
        getRoom: (id: string) => (byId.has(id) && !byId.get(id)!.left ? sdkRoom(byId.get(id)!) : null),
        getVisibleRooms: () => rooms.filter((r) => !r.left).map(sdkRoom),
        sendStateEvent,
        createAlias: vi.fn(async () => ({})),
        uploadContent: vi.fn(async () => ({ content_uri: "mxc://x/new" })),
        getRoomHierarchy: vi.fn(async (spaceId: string) => ({
            rooms: (byId.get(spaceId)?.children ?? []).map((id) => ({ room_id: id, name: byId.get(id)?.name, room_type: byId.get(id)?.space ? "m.space" : undefined })),
        })),
        on: (name: string, l: (...args: unknown[]) => void) => void (listeners.get(name) ?? listeners.set(name, new Set()).get(name)!).add(l),
        removeListener: (name: string, l: (...args: unknown[]) => void) => void listeners.get(name)?.delete(l),
    };
    return { client: client as SdkClient & typeof client, sendStateEvent, listeners };
}
