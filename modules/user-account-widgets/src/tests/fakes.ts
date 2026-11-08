import { vi } from "vitest";

import type { SdkClient, SdkEvent, SdkRoom } from "../client";

export interface RawEvent {
    event_id: string;
    room_id: string;
    type: string;
    sender?: string;
    state_key?: string;
    content: Record<string, unknown>;
}

export function fakeEvent(raw: RawEvent, opts: { decrypting?: boolean } = {}): SdkEvent & { decrypting: boolean } {
    return {
        decrypting: opts.decrypting ?? false,
        getId: () => raw.event_id,
        getRoomId: () => raw.room_id,
        getType: () => raw.type,
        getContent: () => raw.content,
        getStateKey: () => raw.state_key,
        getEffectiveEvent: () => raw,
        isBeingDecrypted() {
            return this.decrypting;
        },
        isDecryptionFailure: () => false,
    };
}

export function fakeRoom(roomId: string, timeline: SdkEvent[] = [], state: SdkEvent[] = []): SdkRoom {
    return {
        roomId,
        getCanonicalAlias: () => null,
        getMember: (userId) => (userId === "@alice:x" ? { name: "Alice" } : null),
        getLiveTimeline: () => ({
            getEvents: () => timeline,
            getState: () => ({
                getStateEvents: ((type: string, key?: string) => {
                    const matching = state.filter((e) => e.getType() === type);
                    if (key === undefined) return matching;
                    return matching.find((e) => e.getStateKey() === key) ?? null;
                }) as never,
            }),
        }),
    };
}

export type FakeClient = SdkClient & { emit(event: string, ...args: unknown[]): void; listeners: Map<string, Set<Function>> };

export function fakeClient(rooms: SdkRoom[] = []): FakeClient {
    const listeners = new Map<string, Set<Function>>();
    return {
        listeners,
        baseUrl: "https://hs.example",
        getUserId: () => "@alice:x",
        getDeviceId: () => "DEV",
        getAccessToken: () => "tok",
        getRoom: (id) => rooms.find((r) => r.roomId === id) ?? null,
        getRooms: () => rooms,
        sendEvent: vi.fn(async () => ({ event_id: "$sent" })),
        sendStateEvent: vi.fn(async () => ({ event_id: "$state" })),
        redactEvent: vi.fn(async () => ({ event_id: "$redaction" })),
        uploadContent: vi.fn(async () => ({ content_uri: "mxc://hs.example/up" })),
        mxcUrlToHttp: vi.fn((mxc: string) => (mxc.startsWith("mxc://") ? `https://hs.example/_matrix/client/v1/media/download/${mxc.slice(6)}` : null)),
        relations: vi.fn(async () => ({ events: [], nextBatch: null })),
        searchUserDirectory: vi.fn(async () => ({ limited: false, results: [{ user_id: "@bob:x", display_name: "Bob" }] })),
        getMediaConfig: vi.fn(async () => ({ "m.upload.size": 1000 })),
        queueToDevice: vi.fn(async () => {}),
        getCrypto: () => undefined,
        on(event, fn) {
            if (!listeners.has(event)) listeners.set(event, new Set());
            listeners.get(event)!.add(fn);
        },
        off(event, fn) {
            listeners.get(event)?.delete(fn);
        },
        emit(event, ...args) {
            for (const fn of listeners.get(event) ?? []) fn(...args);
        },
    };
}
