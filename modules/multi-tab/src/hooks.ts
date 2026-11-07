/**
 * The Element and matrix-js-sdk internals this module relies on, typed as far as we use them. None of this is
 * module API: `preflight` checks every hook before anything is patched, and the module stays off if one is missing.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface IndexedDBStoreLike {
    startup(): Promise<void>;
    save(force?: boolean): Promise<void>;
    getSavedSyncToken(): Promise<string | null>;
    setSyncData(data: unknown): Promise<void>;
    storeClientOptions(opts: unknown): Promise<void>;
    deleteAllData(): Promise<void>;
    wantsSave(): boolean;
    [k: string]: any;
}

export interface MatrixClientLike {
    store: IndexedDBStoreLike;
    http: { opts: Record<string, any>; [k: string]: any };
    initRustCrypto(args?: unknown): Promise<void>;
    getUserId(): string | null;
    getDeviceId(): string | null;
    getAccessToken(): string | null;
    setAccessToken?(token: string): void;
    getHomeserverUrl(): string;
    getRoom(roomId: string): any;
    getEventMapper(opts?: unknown): (raw: unknown) => any;
    on(event: string, fn: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): boolean;
    stopClient(): void;
    logout?(stopClient?: boolean): Promise<unknown>;
    getSyncState(): string | null;
    [k: string]: any;
}

export interface ClientPegLike {
    get(): MatrixClientLike | null;
    set(client: MatrixClientLike): void;
}

export interface PlatformLike {
    getSessionLock(onNewInstance: () => Promise<void>): Promise<boolean>;
    checkSessionLockFree(): boolean;
    displayNotification(...args: any[]): void;
    loudNotification(...args: any[]): void;
    getAppVersion?(): Promise<string>;
}

interface ElementWindow {
    mxMatrixClientPeg?: ClientPegLike;
    mxPlatformPeg?: { get(): PlatformLike | null };
    mxSettingsStore?: { getValue(name: string, roomId?: string | null): unknown };
    mxDispatcher?: { register(fn: (payload: { action: string }) => void): string };
}

/** Element's IndexedDB sync store (`MatrixClientPeg`, `"riot-web-sync"`), deleted on logout. */
export const SYNC_STORE_DB = "matrix-js-sdk:riot-web-sync";

export function el(): ElementWindow {
    return window as unknown as ElementWindow;
}

/** Element's session-lock keys (`utils/SessionLock.ts`). Mirrors never write them (invariant I7). */
export const SESSION_LOCK = {
    ping: "react_sdk_session_lock_ping",
    owner: "react_sdk_session_lock_owner",
} as const;

/** The stored session as Element keeps it in localStorage (`Lifecycle.ts`, `utils/tokens/tokens.ts`). */
export interface StoredSession {
    userId: string;
    deviceId: string;
    hsUrl: string;
}

export function storedSession(local: Storage): StoredSession | null {
    try {
        const userId = local.getItem("mx_user_id");
        const deviceId = local.getItem("mx_device_id");
        const hsUrl = local.getItem("mx_hs_url");
        const guest = local.getItem("mx_is_guest");
        const soft = local.getItem("mx_soft_logout");
        const hasToken = local.getItem("mx_has_access_token") === "true" || !!local.getItem("mx_access_token");
        if (!userId || !deviceId || !hsUrl || !hasToken || guest === "true" || soft === "true") return null;
        return { userId, deviceId, hsUrl };
    } catch {
        return null;
    }
}
