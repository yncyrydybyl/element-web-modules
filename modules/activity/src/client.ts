/**
 * The parts of Element's internals used here (copied in part from the teamwork module). The module
 * API has no way to read timelines, decrypt events or send read receipts, so this works on
 * matrix-js-sdk's MatrixClient (`window.mxMatrixClientPeg`). Everything is feature-checked; a
 * missing piece makes the feed show less instead of breaking Element.
 */

export interface SdkEvent {
    getId(): string | undefined;
    getRoomId(): string | undefined;
    getType(): string;
    getSender(): string | undefined;
    getContent(): Record<string, unknown>;
    getTs(): number;
    isRedacted(): boolean;
    isBeingDecrypted(): boolean;
    isDecryptionFailure(): boolean;
    getWireContent?(): Record<string, unknown>;
    isEncrypted?(): boolean;
    sender?: { name?: string } | null;
}

export interface SdkThread {
    id: string;
    rootEvent?: SdkEvent;
    /** The thread's loaded events. */
    events?: SdkEvent[];
}

export interface SdkRoom {
    roomId: string;
    name: string;
    findEventById(eventId: string): SdkEvent | undefined;
    getMember(userId: string): { name?: string } | null;
    hasUserReadEvent(userId: string, eventId: string): boolean;
    getLiveTimeline?(): { getEvents(): SdkEvent[] };
    getThreads?(): SdkThread[];
    getMyMembership?(): string;
    currentState?: { getStateEvents(eventType: string, stateKey: string): SdkEvent | null };
}

export interface SdkClient {
    getUserId(): string | null;
    isInitialSyncComplete?(): boolean;
    getRoom(roomId: string | undefined): SdkRoom | null;
    getRooms(): SdkRoom[];
    decryptEventIfNeeded?(event: SdkEvent): Promise<void>;
    http?: { authedRequest<T>(method: string, path: string, query?: Record<string, string | number>, body?: unknown): Promise<T> };
    sendReadReceipt?(event: SdkEvent): Promise<unknown>;
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

/** Opens a room at an event (Element's own permalink route; thread events open their thread). */
export function openEvent(roomId: string, eventId: string): void {
    window.location.hash = `#/room/${encodeURIComponent(roomId)}/${encodeURIComponent(eventId)}`;
}
