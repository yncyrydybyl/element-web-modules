/**
 * The parts of Element's internals used here. The module API has no way to send events, read
 * timelines or manage push rules, so this works on matrix-js-sdk's MatrixClient
 * (`window.mxMatrixClientPeg`). Everything is feature-checked; a missing piece turns the matching
 * feature off instead of breaking Element.
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
    sender?: { name?: string } | null;
}

export interface SdkRoom {
    roomId: string;
    name: string;
    findEventById(eventId: string): SdkEvent | undefined;
    getCanonicalAlias(): string | null;
    getMember(userId: string): { name?: string } | null;
    getJoinedMembers(): { userId: string; name: string }[];
    hasUserReadEvent(userId: string, eventId: string): boolean;
    getUnfilteredTimelineSet(): unknown;
    currentState?: { getStateEvents(eventType: string, stateKey: string): SdkEvent | null };
}

/** An event as matrix-js-sdk builds it before sending; only what encryption needs. */
export interface SdkOutgoingEvent extends SdkEvent {
    getWireType(): string;
    getWireContent(): Record<string, unknown>;
    isEncrypted(): boolean;
}

export interface DelayedEvent {
    delay_id: string;
    room_id: string;
    type: string;
    delay: number;
    running_since: number;
    content: Record<string, unknown>;
}

export interface PushRule {
    rule_id: string;
    enabled?: boolean;
}

export interface SdkClient {
    getUserId(): string | null;
    isInitialSyncComplete?(): boolean;
    getRoom(roomId: string | undefined): SdkRoom | null;
    getRooms(): SdkRoom[];
    sendEvent(roomId: string, eventType: string, content: unknown): Promise<{ event_id: string }>;
    sendEvent(roomId: string, threadId: string | null, eventType: string, content: unknown): Promise<{ event_id: string }>;
    getEventTimeline(timelineSet: unknown, eventId: string): Promise<{ getEvents(): SdkEvent[] } | null>;
    decryptEventIfNeeded?(event: SdkEvent): Promise<void>;
    doesServerSupportUnstableFeature(feature: string): Promise<boolean>;
    _unstable_sendDelayedEvent?(
        roomId: string,
        delayOpts: { delay: number },
        threadId: string | null,
        eventType: string,
        content: unknown,
    ): Promise<{ delay_id: string }>;
    _unstable_getDelayedEvents?(status?: string): Promise<{ delayed_events?: DelayedEvent[]; scheduled?: DelayedEvent[] }>;
    _unstable_cancelScheduledDelayedEvent?(delayId: string): Promise<unknown>;
    _unstable_sendScheduledDelayedEvent?(delayId: string): Promise<unknown>;
    _unstable_updateDelayedEvent?(delayId: string, action: string): Promise<unknown>;
    getCrypto?(): { isEncryptionEnabledInRoom(roomId: string): Promise<boolean> } | undefined;
    /** Internal: the Rust crypto backend. The only way to encrypt an event without sending it. */
    cryptoBackend?: { encryptEvent(event: SdkOutgoingEvent, room: SdkRoom): Promise<void> };
    http?: { authedRequest<T>(method: string, path: string, query?: Record<string, string | number>, body?: unknown): Promise<T> };
    makeTxnId?(): string;
    getPushRules?(): Promise<{ global?: { override?: PushRule[] } }>;
    addPushRule?(scope: string, kind: string, ruleId: string, body: unknown): Promise<unknown>;
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

/** The room an event belongs to: the open room first, then any room that has it loaded. */
export function findRoomOfEvent(client: SdkClient, eventId: string, hash = window.location.hash): string | undefined {
    const open = roomIdFromHash(client, hash);
    if (open && client.getRoom(open)?.findEventById(eventId)) return open;
    return client.getRooms().find((r) => r.findEventById(eventId))?.roomId;
}

export function roomIdFromHash(client: SdkClient | undefined, hash: string): string | null {
    const match = /^#\/room\/([^/?]+)/.exec(hash);
    if (!match) return null;
    const idOrAlias = decodeURIComponent(match[1]);
    if (idOrAlias.startsWith("!")) return idOrAlias;
    return client?.getRooms().find((r) => r.getCanonicalAlias() === idOrAlias)?.roomId ?? null;
}

/** Opens a room at an event (Element's own permalink route). */
export function openEvent(roomId: string, eventId: string): void {
    window.location.hash = `#/room/${encodeURIComponent(roomId)}/${encodeURIComponent(eventId)}`;
}
