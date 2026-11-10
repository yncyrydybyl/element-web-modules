/**
 * The parts of Element's internals used here. The module API (2.3.0) can't read the crypto state,
 * join rooms or open Element's settings, so this works on matrix-js-sdk's MatrixClient
 * (`window.mxMatrixClientPeg`) and Element's dispatcher (`window.mxDispatcher`). Everything is
 * feature-checked; a missing piece hides the matching action instead of breaking Element.
 */

export interface SdkEvent {
    getId(): string | undefined;
    getRoomId(): string | undefined;
    getType(): string;
    getTs(): number;
    getSender?(): string | undefined;
    isDecryptionFailure(): boolean;
    /** js-sdk's DecryptionFailureCode, e.g. "HISTORICAL_MESSAGE_USER_NOT_JOINED". */
    decryptionFailureReason?: string | null;
}

export interface SdkRoom {
    roomId: string;
    name: string;
    getMyMembership?(): string;
    getLiveTimeline?(): { getEvents(): SdkEvent[] };
    getCanonicalAlias?(): string | null;
    getAltAliases?(): string[];
    getMember?(userId: string): { name: string } | null;
}

export interface SdkCrypto {
    getActiveSessionBackupVersion?(): Promise<string | null>;
    getSecretStorageStatus?(): Promise<{ ready: boolean; defaultKeyId: string | null }>;
    getDeviceVerificationStatus?(userId: string, deviceId: string): Promise<{ crossSigningVerified: boolean } | null>;
}

export interface HierarchyRoom {
    room_id: string;
    room_type?: string;
    name?: string;
}

export interface SdkClient {
    getUserId(): string | null;
    getDeviceId?(): string | null;
    isInitialSyncComplete?(): boolean;
    getRoom(roomId: string | undefined): SdkRoom | null;
    getRooms?(): SdkRoom[];
    getCrypto?(): SdkCrypto | undefined;
    getRoomIdForAlias?(alias: string): Promise<{ room_id: string; servers?: string[] }>;
    joinRoom?(roomIdOrAlias: string, opts?: { viaServers?: string[] }): Promise<SdkRoom>;
    getRoomHierarchy?(roomId: string, limit?: number, maxDepth?: number, suggestedOnly?: boolean): Promise<{ rooms: HierarchyRoom[] }>;
    getProfileInfo?(userId: string): Promise<{ displayname?: string; avatar_url?: string }>;
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

/** Element's settings tabs (`UserTab` in Element). */
export type SettingsTab = "USER_ACCOUNT_TAB" | "USER_NOTIFICATIONS_TAB" | "USER_ENCRYPTION_TAB" | "USER_KEYBOARD_TAB";

/**
 * Opens Element's own settings dialog, the same way Element's toasts do (`Action.ViewUserSettings`).
 * `encryptionState` picks the panel of the Encryption tab, e.g. "set_recovery_key" for the recovery
 * key setup (Element v1.12.33 `EncryptionUserSettingsTab`). Returns false if the dispatcher is missing.
 */
export function openSettings(tab: SettingsTab, encryptionState?: string): boolean {
    const dispatcher = (window as { mxDispatcher?: { dispatch(payload: Record<string, unknown>): void } }).mxDispatcher;
    if (!dispatcher?.dispatch) return false;
    dispatcher.dispatch({
        action: "view_user_settings",
        initialTabId: tab,
        ...(encryptionState ? { props: { initialEncryptionState: encryptionState } } : {}),
    });
    return true;
}

export function canOpenSettings(): boolean {
    return typeof (window as { mxDispatcher?: { dispatch?: unknown } }).mxDispatcher?.dispatch === "function";
}

/** Where the user's message keys stand. `undefined` fields: the crypto API couldn't tell. */
export interface SecureStatus {
    /** Key storage (server-side key backup) is on for this device. */
    keyStorage?: boolean;
    /** A recovery key exists and holds all secrets. */
    recovery?: boolean;
    /** A recovery key exists but some secrets are missing from it (Element: "out of sync"). */
    recoveryOutOfSync?: boolean;
    /** This device is verified (cross-signed). */
    verified?: boolean;
}

export async function getSecureStatus(client: SdkClient): Promise<SecureStatus> {
    const crypto = client.getCrypto?.();
    if (!crypto) return {};
    const status: SecureStatus = {};
    const userId = client.getUserId();
    const deviceId = client.getDeviceId?.();
    await Promise.all([
        crypto.getActiveSessionBackupVersion?.().then(
            (v) => void (status.keyStorage = v !== null),
            () => undefined,
        ),
        crypto.getSecretStorageStatus?.().then(
            (s) => {
                status.recovery = s.ready;
                status.recoveryOutOfSync = !s.ready && s.defaultKeyId !== null;
            },
            () => undefined,
        ),
        userId && deviceId
            ? crypto.getDeviceVerificationStatus?.(userId, deviceId).then(
                  (s) => void (status.verified = !!s?.crossSigningVerified),
                  () => undefined,
              )
            : undefined,
    ]);
    return status;
}

export function isSecure(s: SecureStatus): boolean {
    return s.keyStorage === true && s.recovery === true && s.verified === true;
}

export type SecureAction = "verify" | "key_storage" | "fix_recovery" | "set_up_recovery";

/** The one thing to do next, in the order Element itself asks for them (DeviceListener). */
export function nextSecureAction(s: SecureStatus): SecureAction | null {
    if (s.verified === false) return "verify";
    if (s.keyStorage === false) return "key_storage";
    if (s.recoveryOutOfSync) return "fix_recovery";
    if (s.recovery === false) return "set_up_recovery";
    return null;
}

/** Runs Element's own flow for the action: its Encryption settings tab, at the right panel. */
export function runSecureAction(action: SecureAction | null): boolean {
    // "verify", "key_storage" and "fix_recovery" are what the tab's main panel shows on its own
    // (verify this device, the key storage toggle, "enter recovery key").
    return openSettings("USER_ENCRYPTION_TAB", action === "set_up_recovery" ? "set_recovery_key" : undefined);
}

export type Membership = "join" | "invite" | "leave" | "ban" | "knock" | "none";

export function membershipOf(client: SdkClient, roomId: string | undefined): Membership {
    if (!roomId) return "none";
    return (client.getRoom(roomId)?.getMyMembership?.() as Membership | undefined) ?? "none";
}

/**
 * Joins a space (by alias) and, if wanted, its suggested rooms, as Teams adds you to a team's
 * default channels. Failures on single rooms are ignored; a failure on the space itself throws.
 */
export async function joinSpace(client: SdkClient, alias: string, withSuggested: boolean): Promise<string> {
    if (!client.joinRoom) throw new Error("joinRoom unavailable");
    const space = await client.joinRoom(alias);
    if (withSuggested && client.getRoomHierarchy) {
        try {
            const { rooms } = await client.getRoomHierarchy(space.roomId, 50, 1, true);
            for (const r of rooms) {
                if (r.room_id === space.roomId || r.room_type === "m.space") continue;
                if (membershipOf(client, r.room_id) === "join") continue;
                await client.joinRoom(r.room_id).catch(() => undefined);
            }
        } catch {
            // The space is joined; its rooms are one click away in Element's space home.
        }
    }
    return space.roomId;
}

/** The room Element shows now, from its URL (`#/room/!id…` or `#/room/#alias…`). */
export function currentRoomId(client: SdkClient | undefined, hash: string = window.location.hash): string | undefined {
    const match = /^#\/room\/([^/?]+)/.exec(hash);
    if (!match) return undefined;
    let target: string;
    try {
        target = decodeURIComponent(match[1]);
    } catch {
        return undefined;
    }
    if (target.startsWith("!")) return target;
    return client?.getRooms?.().find((r) => r.getCanonicalAlias?.() === target || r.getAltAliases?.().includes(target))?.roomId;
}

/** Where a message is, for the "couldn't be decrypted" hint. */
export interface MessageInfo {
    roomId: string;
    eventId: string;
    room: string;
    sender: string;
    ts: number;
}

export function describeMessage(client: SdkClient | undefined, ev: SdkEvent): MessageInfo | undefined {
    const roomId = ev.getRoomId();
    const eventId = ev.getId();
    if (!roomId || !eventId) return undefined;
    const room = client?.getRoom(roomId);
    const senderId = ev.getSender?.() ?? "";
    return { roomId, eventId, room: room?.name || roomId, sender: room?.getMember?.(senderId)?.name || senderId, ts: ev.getTs() };
}

/** Opens the room at that message, highlighted, as a permalink in Element does. */
export function showMessage(info: Pick<MessageInfo, "roomId" | "eventId">): void {
    window.location.hash = `#/room/${info.roomId}/${info.eventId}`;
}
