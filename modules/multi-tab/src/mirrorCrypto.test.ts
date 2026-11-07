import { describe, expect, it, vi } from "vitest";

import type { Channel } from "./channel";
import { MirrorCrypto } from "./mirrorCrypto";

function fakeChannel(handlers: Record<string, (p: any) => unknown>): Channel & { calls: Array<[string, any]> } {
    const calls: Array<[string, any]> = [];
    return {
        calls,
        request: async (_to: string, type: string, payload: any) => {
            calls.push([type, payload]);
            const h = handlers[type];
            if (!h) throw new Error(`no handler for ${type}`);
            return h(payload);
        },
    } as unknown as Channel & { calls: Array<[string, any]> };
}

function fakeEvent(id: string, session: string, roomId = "!r:x"): any {
    const ev: any = {
        event: { event_id: id, type: "m.room.encrypted", room_id: roomId, content: { session_id: session } },
        getRoomId: () => roomId,
        getWireContent: () => ev.event.content,
        attemptDecryption: vi.fn(async (crypto: any) => crypto.decryptEvent(ev).catch(() => {})),
    };
    return ev;
}

describe("MirrorCrypto", () => {
    it("batches decrypts of one tick into one request per room", async () => {
        const ch = fakeChannel({
            decrypt: (p) => p.events.map((e: any) => ({ ok: { clearEvent: { type: "m.room.message", content: { body: e.event_id } } } })),
        });
        const mc = new MirrorCrypto(ch);
        const results = await Promise.all([1, 2, 3].map((n) => mc.backend.decryptEvent(fakeEvent(`$${n}`, "s"))));
        expect(ch.calls.filter(([t]) => t === "decrypt")).toHaveLength(1);
        expect(results.map((r: any) => r.clearEvent.content.body)).toEqual(["$1", "$2", "$3"]);
    });

    it("retries a failed event when the engine announces its session's key", async () => {
        let haveKey = false;
        const ch = fakeChannel({
            decrypt: (p) =>
                p.events.map(() =>
                    haveKey ? { ok: { clearEvent: { type: "m.room.message", content: {} } } } : { err: { code: "MEGOLM_UNKNOWN_INBOUND_SESSION_ID", message: "no key" } },
                ),
        });
        const mc = new MirrorCrypto(ch);
        const ev = fakeEvent("$1", "sess-A");
        const other = fakeEvent("$2", "sess-B");
        await expect(mc.backend.decryptEvent(ev)).rejects.toMatchObject({ code: "MEGOLM_UNKNOWN_INBOUND_SESSION_ID" });
        await expect(mc.backend.decryptEvent(other)).rejects.toBeTruthy();
        haveKey = true;
        mc.onRoomKeys({ "!r:x": ["sess-A"] });
        expect(ev.attemptDecryption).toHaveBeenCalledWith(mc.backend, { isRetry: true });
        expect(other.attemptDecryption).not.toHaveBeenCalled();
    });

    it("keeps js-sdk's failure reason despite the cross-bundle instanceof check", async () => {
        const ch = fakeChannel({ decrypt: (p) => p.events.map(() => ({ err: { code: "HISTORICAL_MESSAGE_NO_KEY_BACKUP", message: "x" } })) });
        const mc = new MirrorCrypto(ch);
        const ev = fakeEvent("$1", "s");
        await mc.backend.decryptEvent(ev).catch(() => {});
        // What js-sdk's decryptionLoop does for an error that isn't its own DecryptionError:
        ev._decryptionFailureReason = "UNKNOWN_ERROR";
        expect(ev._decryptionFailureReason).toBe("HISTORICAL_MESSAGE_NO_KEY_BACKUP");
        ev._decryptionFailureReason = null;
        expect(ev._decryptionFailureReason).toBeNull();
    });

    it("never asks the engine for key material", async () => {
        const ch = fakeChannel({});
        const mc = new MirrorCrypto(ch);
        await expect(mc.backend.getSessionBackupPrivateKey()).resolves.toBeNull();
        expect(ch.calls).toHaveLength(0);
    });

    it("rejects identity-changing calls without contacting the engine", async () => {
        const ch = fakeChannel({});
        const mc = new MirrorCrypto(ch);
        await expect(mc.backend.bootstrapCrossSigning({})).rejects.toMatchObject({ name: "MirrorUnsupportedError" });
        await expect(mc.backend.someFutureMethod()).rejects.toMatchObject({ name: "MirrorUnsupportedError" });
        expect(mc.stats.unsupported).toEqual(["bootstrapCrossSigning", "someFutureMethod"]);
        expect(ch.calls).toHaveLength(0);
    });

    it("answers boot-time calls locally so Element's start never throws", async () => {
        const mc = new MirrorCrypto(fakeChannel({ crypto: () => undefined }));
        expect(() => mc.backend.setDeviceIsolationMode({})).not.toThrow();
        await expect(mc.backend.isDehydrationSupported()).resolves.toBe(false);
        await expect(mc.backend.processSyncChanges({})).resolves.toEqual([]);
        expect(typeof mc.backend.getVersion()).toBe("string");
        expect(mc.backend.then).toBeUndefined();
    });

    it("forwards reads and rebuilds class results", async () => {
        const ch = fakeChannel({
            crypto: (p) => {
                if (p.method === "getUserVerificationStatus") return { v: true, b: true, k: true, n: false };
                if (p.method === "getUserDeviceInfo") {
                    return new Map([["@a:x", new Map([["DEV", { deviceId: "DEV", userId: "@a:x", keys: new Map([["ed25519:DEV", "fp"]]) }]])]]);
                }
                if (p.method === "isEncryptionEnabledInRoom") return true;
                return null;
            },
        });
        const mc = new MirrorCrypto(ch);
        const s = await mc.backend.getUserVerificationStatus("@a:x");
        expect(s.isVerified()).toBe(true);
        const map = await mc.backend.getUserDeviceInfo(["@a:x"]);
        expect(map.get("@a:x").get("DEV").getFingerprint()).toBe("fp");
        await mc.backend.isEncryptionEnabledInRoom("!r:x");
        await mc.backend.isEncryptionEnabledInRoom("!r:x");
        expect(ch.calls.filter(([, p]) => p.method === "isEncryptionEnabledInRoom")).toHaveLength(1);
    });

    it("asks for the shields of one tick in one message, and drops only the changed senders' shields", async () => {
        const ch = fakeChannel({
            cryptoBatch: (p) => p.calls.map((c: any) => ({ ok: { shieldColour: 0, shieldReason: null, id: c.args[0].raw.event_id } })),
        });
        const mc = new MirrorCrypto(ch);
        const ev = (id: string, sender: string): any => ({
            event: { event_id: id, room_id: "!r:x" },
            getId: () => id,
            getRoomId: () => "!r:x",
            getSender: () => sender,
        });
        const a = ev("$a", "@alice:x");
        const b = ev("$b", "@bob:x");
        await Promise.all([mc.backend.getEncryptionInfoForEvent(a), mc.backend.getEncryptionInfoForEvent(b)]);
        expect(ch.calls.filter(([t]) => t === "cryptoBatch")).toHaveLength(1);
        expect(ch.calls[0][1].calls).toHaveLength(2);

        expect(mc.decodeEvent("crypto.devicesUpdated", [["@alice:x"], false])).not.toBeNull();
        await mc.backend.getEncryptionInfoForEvent(a);
        await mc.backend.getEncryptionInfoForEvent(b);
        const batches = ch.calls.filter(([t]) => t === "cryptoBatch");
        expect(batches).toHaveLength(2);
        expect(batches[1][1].calls.map((c: any) => c.args[0].raw.event_id)).toEqual(["$a"]);
    });

    it("ignores events that aren't crypto events (a forged Session.logged_out)", () => {
        const mc = new MirrorCrypto(fakeChannel({}));
        expect(mc.decodeEvent("Session.logged_out", [{ httpStatus: 401 }])).toBeNull();
    });

    it("answers 'is this room encrypted' from the room state", async () => {
        const ch = fakeChannel({ crypto: () => false });
        const mc = new MirrorCrypto(ch);
        mc.attach({ getRoom: (id: string) => ({ hasEncryptionStateEvent: () => id === "!enc:x" }) } as any);
        await expect(mc.backend.isEncryptionEnabledInRoom("!enc:x")).resolves.toBe(true);
        await expect(mc.backend.isEncryptionEnabledInRoom("!plain:x")).resolves.toBe(false);
        await expect(mc.backend.isEncryptionEnabledInRoom("!plain:x")).resolves.toBe(false);
        expect(ch.calls).toHaveLength(1);
    });
});
