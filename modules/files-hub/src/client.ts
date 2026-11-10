/**
 * The parts of Element's internals used here. The module API has no way to read timelines,
 * paginate or decrypt events, so this works on matrix-js-sdk's MatrixClient
 * (`window.mxMatrixClientPeg`). Everything is feature-checked; a missing piece turns the matching
 * feature off instead of breaking Element.
 */

export interface RawEvent {
    event_id: string;
    room_id?: string;
    type: string;
    sender: string;
    origin_server_ts: number;
    content: Record<string, unknown>;
    unsigned?: Record<string, unknown>;
    state_key?: string;
}

export interface SdkEvent {
    getId(): string | undefined;
    getRoomId(): string | undefined;
    getType(): string;
    getSender(): string | undefined;
    getContent(): Record<string, unknown>;
    getTs(): number;
    getStateKey?(): string | undefined;
    isRedacted(): boolean;
    isBeingDecrypted(): boolean;
    isDecryptionFailure(): boolean;
    isEncrypted?(): boolean;
    isState?(): boolean;
    getAssociatedId?(): string | undefined;
    threadRootId?: string;
}

export interface SdkThread {
    id: string;
    events?: SdkEvent[];
}

export interface SdkRoom {
    roomId: string;
    name: string;
    getMember(userId: string): { name?: string } | null;
    getType?(): string | undefined;
    isSpaceRoom?(): boolean;
    getMyMembership?(): string;
    hasEncryptionStateEvent?(): boolean;
    getLastActiveTimestamp?(): number;
    getLiveTimeline?(): { getEvents(): SdkEvent[] };
    getThreads?(): SdkThread[];
    currentState?: {
        getStateEvents(eventType: string): SdkEvent[];
        getStateEvents(eventType: string, stateKey: string): SdkEvent | null;
    };
}

export interface SdkClient {
    getUserId(): string | null;
    baseUrl?: string;
    isInitialSyncComplete?(): boolean;
    getRoom(roomId: string | undefined): SdkRoom | null;
    getRooms(): SdkRoom[];
    getAccessToken?(): string | null;
    getEventMapper?(opts?: { preventReEmit?: boolean; decrypt?: boolean }): (raw: RawEvent) => SdkEvent;
    decryptEventIfNeeded?(event: SdkEvent): Promise<void>;
    http?: {
        authedRequest<T>(
            method: string,
            path: string,
            query?: Record<string, string | number | undefined>,
            body?: unknown,
            opts?: { abortSignal?: AbortSignal },
        ): Promise<T>;
    };
    on(event: string, listener: (...args: never[]) => void): unknown;
    off(event: string, listener: (...args: never[]) => void): unknown;
}

export function getSdkClient(): SdkClient | undefined {
    const peg = (window as { mxMatrixClientPeg?: { get?(): SdkClient | null } }).mxMatrixClientPeg;
    try {
        return peg?.get?.() ?? undefined;
    } catch {
        return undefined;
    }
}

/** Opens a room at an event (Element's own permalink route). */
export function openEvent(roomId: string, eventId: string): void {
    window.location.hash = `#/room/${encodeURIComponent(roomId)}/${encodeURIComponent(eventId)}`;
}

export function isJoined(room: SdkRoom): boolean {
    return (room.getMyMembership?.() ?? "join") === "join";
}

export function isSpace(room: SdkRoom): boolean {
    return room.isSpaceRoom?.() ?? room.getType?.() === "m.space";
}

/** Whether a room is end-to-end encrypted, from its state (no network). */
export function isEncryptedRoom(room: SdkRoom): boolean {
    if (room.hasEncryptionStateEvent) return room.hasEncryptionStateEvent();
    return !!room.currentState?.getStateEvents("m.room.encryption", "");
}
