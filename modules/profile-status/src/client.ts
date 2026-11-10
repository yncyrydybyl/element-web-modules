/**
 * The parts of Element's internals used here. The module API (2.3.0) has no way to read or write
 * profile fields, send messages or watch calls, so this works on matrix-js-sdk's MatrixClient
 * (`window.mxMatrixClientPeg`) and, for calls, Element's CallStore. Everything is feature-checked;
 * a missing piece turns the matching feature off instead of breaking Element.
 */

export interface SdkEvent {
    getId(): string | undefined;
    getRoomId(): string | undefined;
    getType(): string;
    getSender(): string | undefined;
    getContent(): Record<string, unknown>;
    getTs(): number;
    isRedacted?(): boolean;
    isDecryptionFailure?(): boolean;
    isBeingDecrypted?(): boolean;
}

export interface SdkRoomMember {
    userId: string;
    name?: string;
    membership?: string;
}

export interface SdkRoom {
    roomId: string;
    name: string;
    getMember(userId: string): SdkRoomMember | null;
    getJoinedMembers(): SdkRoomMember[];
    getInvitedAndJoinedMemberCount?(): number;
    getJoinedMemberCount?(): number;
    findEventById?(eventId: string): SdkEvent | undefined;
    getMyMembership?(): string;
}

export interface SdkClient {
    getUserId(): string | null;
    isInitialSyncComplete?(): boolean;
    getRoom(roomId: string | undefined): SdkRoom | null;
    getRooms?(): SdkRoom[];
    getAccountData?(type: string): { getContent(): Record<string, unknown> } | undefined;
    sendEvent(roomId: string, eventType: string, content: unknown): Promise<{ event_id: string }>;
    doesServerSupportExtendedProfiles?(): Promise<boolean>;
    getExtendedProfile?(userId: string): Promise<Record<string, unknown>>;
    setExtendedProfileProperty?(key: string, value: unknown): Promise<void>;
    deleteExtendedProfileProperty?(key: string): Promise<void>;
    getCapabilities?(): Promise<Record<string, unknown>>;
    on(event: string, listener: (...args: never[]) => void): unknown;
    off?(event: string, listener: (...args: never[]) => void): unknown;
    removeListener?(event: string, listener: (...args: never[]) => void): unknown;
}

export function getSdkClient(): SdkClient | undefined {
    const peg = (window as { mxMatrixClientPeg?: { get?(): SdkClient | null } }).mxMatrixClientPeg;
    try {
        return peg?.get?.() ?? undefined;
    } catch {
        return undefined;
    }
}

/** Whether the client can read and write extended profile fields at all. */
export function hasProfileApi(client: SdkClient): boolean {
    return (
        typeof client.getExtendedProfile === "function" &&
        typeof client.setExtendedProfileProperty === "function" &&
        typeof client.deleteExtendedProfileProperty === "function"
    );
}

/**
 * The other person of a DM, from `m.direct` (the account data Element's own DM detection uses).
 * A two-person room that isn't marked as a DM is a room, not a chat with that person.
 */
export function dmPartner(client: SdkClient, roomId: string): string | undefined {
    const me = client.getUserId();
    const direct = client.getAccountData?.("m.direct")?.getContent();
    if (!direct || typeof direct !== "object") return undefined;
    for (const [userId, rooms] of Object.entries(direct)) {
        if (Array.isArray(rooms) && rooms.includes(roomId) && userId !== me) {
            // Still in the room? (m.direct isn't cleaned up when someone leaves.)
            const membership = client.getRoom(roomId)?.getMember(userId)?.membership;
            return membership && membership !== "join" && membership !== "invite" ? undefined : userId;
        }
    }
    return undefined;
}

export function off(client: SdkClient, event: string, listener: (...args: never[]) => void): void {
    if (client.off) client.off(event, listener);
    else client.removeListener?.(event, listener);
}

const MXID = /@[^\s:]+:[^\s]+/;

/** Pulls a Matrix user ID out of a string such as a tooltip ("Alice (@alice:example.org)"). */
export function findUserId(s: string | null | undefined): string | undefined {
    const m = s ? MXID.exec(s) : null;
    return m ? m[0].replace(/[)\]]+$/, "") : undefined;
}
