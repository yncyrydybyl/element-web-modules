import type { RawEvent, SdkClient, SdkEvent, SdkRoom } from "../client";

/** An event in matrix-js-sdk's shape. Encrypted test events carry their cleartext in `content._plain`. */
export function sdkEvent(raw: RawEvent, state: { decrypted?: boolean } = {}): SdkEvent {
    let type = raw.type;
    let content = raw.content;
    let failed = false;
    const ev: SdkEvent & { decrypt(): void } = {
        getId: () => raw.event_id,
        getRoomId: () => raw.room_id,
        getType: () => type,
        getSender: () => raw.sender,
        getContent: () => content,
        getTs: () => raw.origin_server_ts,
        getStateKey: () => raw.state_key,
        isRedacted: () => !!raw.unsigned?.redacted_because,
        isBeingDecrypted: () => false,
        isDecryptionFailure: () => failed,
        getAssociatedId: () => raw.content.redacts as string | undefined,
        decrypt: () => {
            if (raw.type !== "m.room.encrypted") return;
            const plain = raw.content._plain as { type: string; content: Record<string, unknown> } | undefined;
            if (!plain) failed = true;
            else {
                type = plain.type;
                content = plain.content;
            }
        },
    };
    if (state.decrypted) ev.decrypt();
    return ev;
}

export interface FakeRoom {
    roomId: string;
    name: string;
    encrypted?: boolean;
    space?: boolean;
    membership?: string;
    lastActive?: number;
    /** `/messages` pages, newest first. */
    pages?: RawEvent[][];
    loaded?: SdkEvent[];
    state?: Record<string, SdkEvent[]>;
    members?: Record<string, string>;
}

export interface FakeClient extends SdkClient {
    requests: { roomId: string; query: Record<string, string | number | undefined> }[];
    emit(event: string, ...args: unknown[]): void;
    release?: () => void;
}

export function fakeClient(rooms: FakeRoom[], opts: { hold?: boolean } = {}): FakeClient {
    const listeners = new Map<string, Set<(...a: never[]) => void>>();
    const requests: FakeClient["requests"] = [];
    let gate: Promise<void> = Promise.resolve();
    let release: (() => void) | undefined;
    if (opts.hold) gate = new Promise((r) => (release = r));
    const sdkRooms = new Map<string, SdkRoom>(
        rooms.map((r) => [
            r.roomId,
            {
                roomId: r.roomId,
                name: r.name,
                getMember: (id: string) => (r.members?.[id] ? { name: r.members[id] } : null),
                getType: () => (r.space ? "m.space" : undefined),
                getMyMembership: () => r.membership ?? "join",
                hasEncryptionStateEvent: () => !!r.encrypted,
                getLastActiveTimestamp: () => r.lastActive ?? 0,
                getLiveTimeline: () => ({ getEvents: () => r.loaded ?? [] }),
                getThreads: () => [],
                currentState: {
                    getStateEvents: ((type: string, key?: string) => {
                        const list = r.state?.[type] ?? [];
                        return key === undefined ? list : (list.find((e) => e.getStateKey?.() === key) ?? null);
                    }) as NonNullable<SdkRoom["currentState"]>["getStateEvents"],
                },
            },
        ]),
    );
    const client: FakeClient = {
        requests,
        release: () => release?.(),
        baseUrl: "https://hs",
        getUserId: () => "@me:x",
        isInitialSyncComplete: () => true,
        getRoom: (id) => (id ? (sdkRooms.get(id) ?? null) : null),
        getRooms: () => [...sdkRooms.values()],
        getAccessToken: () => "tok",
        getEventMapper: () => (raw) => sdkEvent(raw),
        decryptEventIfNeeded: async (ev) => (ev as SdkEvent & { decrypt(): void }).decrypt(),
        http: {
            authedRequest: async <T,>(_m: string, path: string, query: Record<string, string | number | undefined> = {}, _b?: unknown, o?: { abortSignal?: AbortSignal }) => {
                const roomId = decodeURIComponent(/\/rooms\/([^/]+)\//.exec(path)![1]);
                requests.push({ roomId, query });
                await gate;
                if (o?.abortSignal?.aborted) throw new Error("aborted");
                const room = rooms.find((r) => r.roomId === roomId)!;
                const page = query.from ? Number(String(query.from).slice(1)) : 0;
                const chunk = (room.pages?.[page] ?? []).slice(0, Number(query.limit));
                const end = page + 1 < (room.pages?.length ?? 0) ? `p${page + 1}` : undefined;
                return { chunk, end } as T;
            },
        },
        on: (e, l) => listeners.set(e, (listeners.get(e) ?? new Set()).add(l)),
        off: (e, l) => listeners.get(e)?.delete(l),
        emit: (e, ...args) => listeners.get(e)?.forEach((l) => (l as (...a: unknown[]) => void)(...args)),
    };
    return client;
}

let n = 0;
export function fileRaw(roomId: string, name: string, ts: number, extra: Partial<RawEvent> = {}, content: Record<string, unknown> = {}): RawEvent {
    return {
        event_id: `$${name}-${n++}`,
        room_id: roomId,
        type: "m.room.message",
        sender: "@alice:x",
        origin_server_ts: ts,
        content: { msgtype: "m.file", body: name, url: `mxc://x/${name}`, ...content },
        ...extra,
    };
}

export function encryptedRaw(roomId: string, plain: RawEvent | null, ts: number): RawEvent {
    return {
        event_id: plain?.event_id ?? `$enc-${n++}`,
        room_id: roomId,
        type: "m.room.encrypted",
        sender: plain?.sender ?? "@bob:x",
        origin_server_ts: ts,
        content: { algorithm: "m.megolm.v1.aes-sha2", ciphertext: "…", ...(plain ? { _plain: { type: plain.type, content: plain.content } } : {}) },
    };
}
