/**
 * The parts of Element's internals used here. The module API has no widget host and no viewed-room
 * store, so the driver works on matrix-js-sdk's MatrixClient (`window.mxMatrixClientPeg`) and
 * follows the room through `window.mxSdkContext.roomViewStore`, with the URL hash as a fallback.
 * Everything is feature-checked; without them the button is not shown.
 */

export interface SdkEvent {
    getId(): string | undefined;
    getRoomId(): string | undefined;
    getType(): string;
    getContent(): Record<string, unknown>;
    getStateKey(): string | undefined;
    getEffectiveEvent(): object;
    isBeingDecrypted(): boolean;
    isDecryptionFailure(): boolean;
}

export interface SdkRoomState {
    getStateEvents(eventType: string): SdkEvent[];
    getStateEvents(eventType: string, stateKey: string): SdkEvent | null;
}

export interface SdkRoom {
    roomId: string;
    getLiveTimeline(): { getEvents(): SdkEvent[]; getState(direction: "f"): SdkRoomState | undefined };
    getCanonicalAlias(): string | null;
    getMember(userId: string): { name?: string } | null;
}

export interface SdkCrypto {
    getUserDeviceInfo(userIds: string[], downloadUncached?: boolean): Promise<Map<string, Map<string, unknown>>>;
    encryptToDeviceMessages(
        eventType: string,
        devices: { userId: string; deviceId: string }[],
        payload: object,
    ): Promise<unknown>;
}

export interface SdkClient {
    baseUrl: string;
    getUserId(): string | null;
    getDeviceId(): string | null;
    getAccessToken(): string | null;
    getRoom(roomId: string | undefined): SdkRoom | null;
    getRooms(): SdkRoom[];
    sendEvent(roomId: string, eventType: string, content: unknown): Promise<{ event_id: string }>;
    sendStateEvent(roomId: string, eventType: string, content: unknown, stateKey: string): Promise<{ event_id: string }>;
    redactEvent(roomId: string, eventId: string): Promise<{ event_id: string }>;
    uploadContent(file: XMLHttpRequestBodyInit): Promise<{ content_uri: string }>;
    mxcUrlToHttp(
        mxc: string,
        width?: number,
        height?: number,
        resizeMethod?: string,
        allowDirectLinks?: boolean,
        allowRedirects?: boolean,
        useAuthentication?: boolean,
    ): string | null;
    relations(
        roomId: string,
        eventId: string,
        relationType: string | null,
        eventType: string | null,
        opts: { from?: string; to?: string; limit?: number; dir?: "f" | "b" },
    ): Promise<{ events: SdkEvent[]; nextBatch?: string | null; prevBatch?: string | null }>;
    searchUserDirectory(opts: { term: string; limit?: number }): Promise<{
        limited: boolean;
        results: { user_id: string; display_name?: string; avatar_url?: string }[];
    }>;
    getMediaConfig(): Promise<Record<string, unknown>>;
    queueToDevice(batch: unknown): Promise<void>;
    getCrypto(): SdkCrypto | undefined;
    decryptEventIfNeeded?(event: SdkEvent): Promise<void>;
    getAccountData?(eventType: string): { getContent(): unknown } | undefined;
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

interface RoomViewStore {
    getRoomId(): string | null | undefined;
    on(event: "update", listener: () => void): unknown;
    off(event: "update", listener: () => void): unknown;
}

function roomViewStore(): RoomViewStore | undefined {
    const store = (window as { mxSdkContext?: { roomViewStore?: RoomViewStore } }).mxSdkContext?.roomViewStore;
    return typeof store?.getRoomId === "function" && typeof store.on === "function" ? store : undefined;
}

/** The room shown in the main view, or null on the home page, settings, a space's overview …. */
export function viewedRoomId(client = getSdkClient(), hash = window.location.hash): string | null {
    const store = roomViewStore();
    if (store) return store.getRoomId() ?? null;
    return roomIdFromHash(client, hash);
}

export function roomIdFromHash(client: SdkClient | undefined, hash: string): string | null {
    const match = /^#\/room\/([^/?]+)/.exec(hash);
    if (!match) return null;
    const idOrAlias = decodeURIComponent(match[1]);
    if (idOrAlias.startsWith("!")) return idOrAlias;
    return client?.getRooms().find((r) => r.getCanonicalAlias() === idOrAlias)?.roomId ?? null;
}

/** Calls `cb` whenever the viewed room may have changed. Returns the unsubscribe function. */
export function onViewedRoomChange(cb: () => void): () => void {
    const store = roomViewStore();
    store?.on("update", cb);
    window.addEventListener("hashchange", cb);
    return () => {
        store?.off("update", cb);
        window.removeEventListener("hashchange", cb);
    };
}

/** Element's effective theme, from the Compound class it puts on `<html>`. */
export function currentTheme(): "light" | "dark" {
    return /\bcpd-theme-dark/.test(document.documentElement.className) ? "dark" : "light";
}

export function onThemeChange(cb: (theme: "light" | "dark") => void): () => void {
    let last = currentTheme();
    const observer = new MutationObserver(() => {
        const theme = currentTheme();
        if (theme !== last) cb((last = theme));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
}
