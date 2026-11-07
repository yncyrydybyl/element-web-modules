import {
    decodeDeviceMap,
    decodeDeviceStatus,
    decodeUserStatus,
    encodeDeviceStatus,
    encodeUserStatus,
} from "./codec";
import type { MatrixClientLike } from "./hooks";

/**
 * What a mirror does with each member of js-sdk's `CryptoBackend` / `CryptoApi` / `SyncCryptoCallbacks`
 * (matrix-js-sdk 45). A unit test fails if js-sdk grows a member that isn't listed here.
 *
 * - `forward`: the engine runs it on its Rust crypto; args and result cross the channel (via the codecs below).
 * - `local`: answered in the mirror without the engine.
 * - `secret`: returns key material; never leaves the engine. The mirror answers `null`.
 * - `unsupported`: changes this device's crypto identity or needs live objects/callbacks. The mirror throws
 *   `MirrorUnsupportedError` and shows "Do this in your main Element tab".
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type Kind = "forward" | "local" | "secret" | "unsupported";

export const CRYPTO_TABLE = {
    // CryptoBackend
    stop: "local",
    encryptEvent: "local", // `encrypt` RPC, see MirrorCrypto
    decryptEvent: "local", // `decrypt` RPC, see MirrorCrypto
    getBackupDecryptor: "unsupported",
    importBackedUpRoomKeys: "unsupported",
    shareRoomHistoryWithUser: "forward",
    maybeAcceptKeyBundle: "forward",
    markRoomAsPendingKeyBundle: "forward",
    globalErrorOnUnknownDevices: "local",
    // SyncCryptoCallbacks: the mirror's sync has no device data, the engine already processed it
    processSyncChanges: "local",
    onCryptoEvent: "local",
    onSyncCompleted: "local",
    markAllTrackedUsersAsDirty: "local",
    // CryptoApi
    globalBlacklistUnverifiedDevices: "local",
    setDeviceIsolationMode: "forward",
    getVersion: "local",
    getOwnDeviceKeys: "forward",
    isEncryptionEnabledInRoom: "forward",
    isStateEncryptionEnabledInRoom: "forward",
    prepareToEncrypt: "forward",
    forceDiscardSession: "forward",
    exportRoomKeys: "unsupported",
    exportRoomKeysAsJson: "unsupported",
    importRoomKeys: "unsupported",
    importRoomKeysAsJson: "unsupported",
    userHasCrossSigningKeys: "forward",
    getUserDeviceInfo: "forward",
    setTrustCrossSignedDevices: "local",
    getTrustCrossSignedDevices: "local",
    getUserVerificationStatus: "forward",
    pinCurrentUserIdentity: "unsupported",
    withdrawVerificationRequirement: "unsupported",
    getUserCrossSigningKeys: "forward",
    getDeviceVerificationStatus: "forward",
    setDeviceVerified: "unsupported",
    setDeviceBlocked: "unsupported",
    crossSignDevice: "unsupported",
    isCrossSigningReady: "forward",
    getCrossSigningKeyId: "forward",
    bootstrapCrossSigning: "unsupported",
    isSecretStorageReady: "forward",
    getSecretStorageStatus: "forward",
    bootstrapSecretStorage: "unsupported",
    getCrossSigningStatus: "forward",
    createRecoveryKeyFromPassphrase: "unsupported",
    getEncryptionInfoForEvent: "forward",
    encryptToDeviceMessages: "unsupported",
    resetEncryption: "unsupported",
    getVerificationRequestsToDeviceInProgress: "local",
    findVerificationRequestDMInProgress: "local",
    requestVerificationDM: "unsupported",
    requestOwnUserVerification: "unsupported",
    requestDeviceVerification: "unsupported",
    getSessionBackupPrivateKey: "secret",
    storeSessionBackupPrivateKey: "unsupported",
    loadSessionBackupPrivateKeyFromSecretStorage: "unsupported",
    getActiveSessionBackupVersion: "forward",
    isKeyBackupTrusted: "forward",
    getKeyBackupInfo: "forward",
    checkKeyBackupAndEnable: "unsupported",
    resetKeyBackup: "unsupported",
    disableKeyStorage: "unsupported",
    deleteKeyBackupVersion: "unsupported",
    restoreKeyBackup: "unsupported",
    restoreKeyBackupWithPassphrase: "unsupported",
    isDehydrationSupported: "local",
    startDehydration: "unsupported",
    exportSecretsBundle: "unsupported",
    importSecretsBundle: "unsupported",
} as const satisfies Record<string, Kind>;

export function kindOf(member: string): Kind | undefined {
    return (CRYPTO_TABLE as Record<string, Kind>)[member];
}

/** Turns a mirror-side argument into something that crosses the channel. */
export function encodeArgs(method: string, args: any[]): unknown[] {
    switch (method) {
        case "prepareToEncrypt":
            return [args[0]?.roomId];
        case "getEncryptionInfoForEvent": {
            const ev = args[0];
            // `event` is the event as received (still encrypted), not the decrypted view.
            return [{ roomId: ev.getRoomId(), raw: ev.event }];
        }
        default:
            return args;
    }
}

/** Rebuilds the mirror-side result from what the engine sent. */
export function decodeResult(method: string, r: any): unknown {
    switch (method) {
        case "getUserVerificationStatus":
            return decodeUserStatus(r);
        case "getDeviceVerificationStatus":
            return decodeDeviceStatus(r);
        case "getUserDeviceInfo":
            return decodeDeviceMap(r);
        default:
            return r;
    }
}

/** Engine side: runs a forwarded call on the real crypto backend. */
export async function runForwarded(
    crypto: any,
    client: MatrixClientLike,
    method: string,
    args: any[],
    mapEvent: (raw: Record<string, unknown>, roomId: string) => any,
): Promise<unknown> {
    if (kindOf(method) !== "forward") throw new Error(`multi-tab: "${method}" is not forwarded`);
    switch (method) {
        case "prepareToEncrypt": {
            const room = client.getRoom(args[0]);
            if (room) crypto.prepareToEncrypt(room);
            return undefined;
        }
        case "getEncryptionInfoForEvent": {
            const { roomId, raw } = args[0] as { roomId: string; raw: Record<string, any> };
            let ev = client.getRoom(roomId)?.findEventById(raw.event_id);
            if (!ev || ev.isDecryptionFailure()) {
                ev = mapEvent(raw, roomId);
                await client.decryptEventIfNeeded(ev);
            }
            return crypto.getEncryptionInfoForEvent(ev);
        }
        case "getUserVerificationStatus":
            return encodeUserStatus(await crypto.getUserVerificationStatus(...args));
        case "getDeviceVerificationStatus":
            return encodeDeviceStatus(await crypto.getDeviceVerificationStatus(...args));
        default:
            return crypto[method](...args);
    }
}
