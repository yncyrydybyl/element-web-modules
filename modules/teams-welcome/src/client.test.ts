import { afterEach, describe, expect, it, vi } from "vitest";

import { currentRoomId, describeMessage, getSecureStatus, isSecure, joinSpace, nextSecureAction, openSettings, runSecureAction, type SdkClient, type SdkEvent } from "./client";

afterEach(() => {
    delete (window as { mxDispatcher?: unknown }).mxDispatcher;
});

function client(crypto: Record<string, unknown> | undefined, extra: Partial<SdkClient> = {}): SdkClient {
    return {
        getUserId: () => "@u:x",
        getDeviceId: () => "DEV",
        getRoom: () => null,
        getCrypto: () => crypto,
        on: vi.fn(),
        off: vi.fn(),
        ...extra,
    } as SdkClient;
}

describe("getSecureStatus", () => {
    it("reads key storage, recovery and verification from the crypto API", async () => {
        const verification = vi.fn(async () => ({ crossSigningVerified: true }));
        const s = await getSecureStatus(
            client({
                getActiveSessionBackupVersion: async () => "1",
                getSecretStorageStatus: async () => ({ ready: false, defaultKeyId: null }),
                getDeviceVerificationStatus: verification,
            }),
        );
        expect(s).toEqual({ keyStorage: true, recovery: false, recoveryOutOfSync: false, verified: true });
        expect(verification).toHaveBeenCalledWith("@u:x", "DEV");
        expect(isSecure(s)).toBe(false);
        expect(nextSecureAction(s)).toBe("set_up_recovery");
    });

    it("is green only when all three are on", async () => {
        const s = await getSecureStatus(
            client({
                getActiveSessionBackupVersion: async () => "3",
                getSecretStorageStatus: async () => ({ ready: true, defaultKeyId: "k" }),
                getDeviceVerificationStatus: async () => ({ crossSigningVerified: true }),
            }),
        );
        expect(isSecure(s)).toBe(true);
        expect(nextSecureAction(s)).toBeNull();
    });

    it("says nothing (rather than red) when crypto is unavailable or throws", async () => {
        expect(await getSecureStatus(client(undefined))).toEqual({});
        const s = await getSecureStatus(client({ getActiveSessionBackupVersion: () => Promise.reject(new Error("x")) }));
        expect(s.keyStorage).toBeUndefined();
        expect(nextSecureAction(s)).toBeNull();
    });

    it("asks for things in Element's order", () => {
        expect(nextSecureAction({ verified: false, keyStorage: false, recovery: false })).toBe("verify");
        expect(nextSecureAction({ verified: true, keyStorage: false, recovery: false })).toBe("key_storage");
        expect(nextSecureAction({ verified: true, keyStorage: true, recovery: false, recoveryOutOfSync: true })).toBe("fix_recovery");
    });
});

describe("openSettings", () => {
    it("dispatches Element's view_user_settings action", () => {
        const dispatch = vi.fn();
        (window as { mxDispatcher?: unknown }).mxDispatcher = { dispatch };
        expect(runSecureAction("set_up_recovery")).toBe(true);
        expect(dispatch).toHaveBeenLastCalledWith({
            action: "view_user_settings",
            initialTabId: "USER_ENCRYPTION_TAB",
            props: { initialEncryptionState: "set_recovery_key" },
        });
        runSecureAction("verify");
        expect(dispatch).toHaveBeenLastCalledWith({ action: "view_user_settings", initialTabId: "USER_ENCRYPTION_TAB" });
        openSettings("USER_ACCOUNT_TAB");
        expect(dispatch).toHaveBeenLastCalledWith({ action: "view_user_settings", initialTabId: "USER_ACCOUNT_TAB" });
    });

    it("reports when Element's dispatcher is missing", () => {
        expect(openSettings("USER_ACCOUNT_TAB")).toBe(false);
    });
});

describe("joinSpace", () => {
    it("joins the space and its suggested rooms that aren't joined yet", async () => {
        const joinRoom = vi.fn(async (id: string) => ({ roomId: id === "#s:x" ? "!space" : id, name: "" }));
        const c = client(undefined, {
            joinRoom,
            getRoomHierarchy: async () => ({
                rooms: [{ room_id: "!space", room_type: "m.space" }, { room_id: "!a" }, { room_id: "!sub", room_type: "m.space" }, { room_id: "!b" }],
            }),
            getRoom: (id) => (id === "!b" ? { roomId: "!b", name: "B", getMyMembership: () => "join" } : null),
        });
        expect(await joinSpace(c, "#s:x", true)).toBe("!space");
        expect(joinRoom.mock.calls.map((c) => c[0])).toEqual(["#s:x", "!a"]);
    });

    it("joins only the space when asked to", async () => {
        const joinRoom = vi.fn(async () => ({ roomId: "!space", name: "" }));
        const hierarchy = vi.fn();
        await joinSpace(client(undefined, { joinRoom, getRoomHierarchy: hierarchy }), "#s:x", false);
        expect(joinRoom).toHaveBeenCalledTimes(1);
        expect(hierarchy).not.toHaveBeenCalled();
    });

    it("throws when the space itself can't be joined", async () => {
        await expect(joinSpace(client(undefined, { joinRoom: () => Promise.reject(new Error("forbidden")) }), "#s:x", true)).rejects.toThrow(
            "forbidden",
        );
    });
});

describe("currentRoomId and describeMessage", () => {
    const room = {
        roomId: "!r:x",
        name: "Ops",
        getCanonicalAlias: () => "#ops:x",
        getAltAliases: () => ["#old-ops:x"],
        getMember: (id: string) => (id === "@bob:x" ? { name: "Bob" } : null),
    };
    const client = { getRooms: () => [room], getRoom: (id: string | undefined) => (id === "!r:x" ? room : null) } as unknown as SdkClient;

    it("reads the open room from Element's URL, by ID or alias", () => {
        expect(currentRoomId(client, "#/room/!r:x")).toBe("!r:x");
        expect(currentRoomId(client, "#/room/!r:x/$event")).toBe("!r:x");
        expect(currentRoomId(client, "#/room/%23ops:x")).toBe("!r:x");
        expect(currentRoomId(client, "#/room/#old-ops:x")).toBe("!r:x");
        expect(currentRoomId(client, "#/home")).toBeUndefined();
    });

    it("names the room and the sender", () => {
        const ev = { getId: () => "$e", getRoomId: () => "!r:x", getSender: () => "@bob:x", getTs: () => 5 } as unknown as SdkEvent;
        expect(describeMessage(client, ev)).toEqual({ roomId: "!r:x", eventId: "$e", room: "Ops", sender: "Bob", ts: 5 });
    });
});
