import { vi } from "vitest";

import type { SdkClient, SdkEvent, SdkRoom } from "../client";

export interface FakeRoomInit {
    roomId: string;
    name?: string;
    space?: boolean;
    members?: Record<string, string>;
    /** type → stateKey → content */
    state?: Record<string, Record<string, Record<string, unknown>>>;
    canEdit?: boolean;
    mayNotifyRoom?: boolean;
}

export function event(type: string, stateKey: string, content: Record<string, unknown>): SdkEvent {
    return { getType: () => type, getStateKey: () => stateKey, getContent: () => content };
}

export function fakeRoom(init: FakeRoomInit): SdkRoom & { state: NonNullable<FakeRoomInit["state"]> } {
    const state = init.state ?? {};
    const members = init.members ?? {};
    function getStateEvents(type: string): SdkEvent[];
    function getStateEvents(type: string, key: string): SdkEvent | null;
    function getStateEvents(type: string, key?: string): SdkEvent[] | SdkEvent | null {
        const byKey = state[type] ?? {};
        if (key === undefined) return Object.entries(byKey).map(([k, c]) => event(type, k, c));
        return byKey[key] ? event(type, key, byKey[key]) : null;
    }
    return {
        roomId: init.roomId,
        name: init.name ?? init.roomId,
        state,
        currentState: {
            getStateEvents,
            maySendStateEvent: () => init.canEdit ?? true,
            mayTriggerNotifOfType: () => init.mayNotifyRoom ?? true,
        },
        getMember: (u) => (members[u] ? { userId: u, name: members[u] } : null),
        getJoinedMembers: () => Object.entries(members).map(([userId, name]) => ({ userId, name })),
        getMyMembership: () => "join",
        isSpaceRoom: () => !!init.space,
        loadMembersIfNeeded: async () => true,
    };
}

export function fakeClient(rooms: SdkRoom[], me = "@alice:t"): SdkClient & { sent: unknown[][] } {
    const sent: unknown[][] = [];
    const client = {
        sent,
        getUserId: () => me,
        isInitialSyncComplete: () => true,
        getRoom: (id: string | undefined) => rooms.find((r) => r.roomId === id) ?? null,
        getRooms: () => rooms,
        sendStateEvent: vi.fn(async (...args: unknown[]) => {
            sent.push(["state", ...args]);
            return { event_id: "$s" };
        }),
        sendEvent: vi.fn(async (...args: unknown[]) => {
            sent.push(["event", ...args]);
            return { event_id: "$e" };
        }),
        sendMessage: vi.fn(async (...args: unknown[]) => {
            sent.push(["message", ...args]);
            return { event_id: "$m" };
        }),
        on: vi.fn(),
        off: vi.fn(),
    };
    return client as unknown as SdkClient & { sent: unknown[][] };
}

export const MEMBERS = { "@alice:t": "Alice", "@bob:t": "Bob", "@carol:t": "Carol", "@dave:t": "Dave" };
