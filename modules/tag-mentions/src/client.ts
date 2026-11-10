/**
 * The parts of Element's internals used here. The module API can't read room state, send state
 * events or touch outgoing messages, so this works on matrix-js-sdk's MatrixClient
 * (`window.mxMatrixClientPeg`). Everything is feature-checked; a missing piece turns the matching
 * feature off instead of breaking Element.
 */

export interface SdkEvent {
    getType(): string;
    getStateKey(): string | undefined;
    getContent(): Record<string, unknown>;
    getSender?(): string | undefined;
}

export interface SdkMember {
    userId: string;
    name: string;
    membership?: string;
}

export interface SdkRoomState {
    getStateEvents(eventType: string): SdkEvent[];
    getStateEvents(eventType: string, stateKey: string): SdkEvent | null;
    maySendStateEvent(eventType: string, userId: string): boolean;
    mayTriggerNotifOfType(notifLevelKey: string, userId: string): boolean;
}

export interface SdkRoom {
    roomId: string;
    name: string;
    currentState: SdkRoomState;
    getMember(userId: string): SdkMember | null;
    getJoinedMembers(): SdkMember[];
    getMyMembership?(): string;
    isSpaceRoom?(): boolean;
    loadMembersIfNeeded?(): Promise<boolean>;
}

export type SendMessage = (roomId: string, threadIdOrContent: unknown, contentOrTxnId?: unknown, txnId?: unknown) => Promise<{ event_id: string }>;

export interface SdkClient {
    getUserId(): string | null;
    isInitialSyncComplete?(): boolean;
    getRoom(roomId: string | undefined): SdkRoom | null;
    getRooms(): SdkRoom[];
    sendStateEvent(roomId: string, eventType: string, content: unknown, stateKey: string): Promise<{ event_id: string }>;
    sendEvent(roomId: string, eventType: string, content: unknown): Promise<{ event_id: string }>;
    sendEvent(roomId: string, threadId: string | null, eventType: string, content: unknown): Promise<{ event_id: string }>;
    sendMessage: SendMessage;
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

/** The room shown in the main view, from Element's URL (`#/room/!id` or `#/room/#alias`). */
export function roomIdFromHash(client: SdkClient | undefined, hash: string): string | null {
    const match = /^#\/room\/([^/?]+)/.exec(hash);
    if (!match) return null;
    const idOrAlias = decodeURIComponent(match[1]);
    if (idOrAlias.startsWith("!")) return idOrAlias;
    return (
        client?.getRooms().find((r) => {
            const alias = r.currentState.getStateEvents("m.room.canonical_alias", "")?.getContent().alias;
            return alias === idOrAlias;
        })?.roomId ?? null
    );
}
