import { describe, expect, it, vi } from "vitest";

import type { SdkClient } from "./client";
import { listScheduled, presets, ScheduleError, scheduleMessage } from "./schedule";

const ROOM = "!r:tw.test";

function mkClient(opts: { encrypted?: boolean; crypto?: boolean } = {}) {
    const http = { authedRequest: vi.fn().mockResolvedValue({ delay_id: "d1" }) };
    class FakeEvent {
        private wire?: { type: string; content: Record<string, unknown> };
        public constructor(public raw: { type: string; content: Record<string, unknown> }) {}
        public makeEncrypted(content: Record<string, unknown>): void {
            this.wire = { type: "m.room.encrypted", content };
        }
        public isEncrypted(): boolean {
            return !!this.wire;
        }
        public getWireType(): string {
            return this.wire?.type ?? this.raw.type;
        }
        public getWireContent(): Record<string, unknown> {
            return this.wire?.content ?? this.raw.content;
        }
    }
    const room = { roomId: ROOM, currentState: { getStateEvents: () => new FakeEvent({ type: "m.room.create", content: {} }) } };
    const client = {
        getUserId: () => "@alice:tw.test",
        getRoom: () => room,
        getCrypto: () => ({ isEncryptionEnabledInRoom: async () => !!opts.encrypted }),
        cryptoBackend:
            opts.crypto === false
                ? undefined
                : { encryptEvent: vi.fn(async (ev: FakeEvent) => ev.makeEncrypted({ algorithm: "m.megolm.v1.aes-sha2", ciphertext: "xyz" })) },
        http,
        makeTxnId: () => "t1",
        _unstable_sendDelayedEvent: vi.fn().mockResolvedValue({ delay_id: "d2" }),
    };
    return { client: client as unknown as SdkClient, http, raw: client };
}

describe("scheduleMessage", () => {
    it("uses js-sdk's delayed send in unencrypted rooms", async () => {
        const { client, raw } = mkClient();
        const id = await scheduleMessage(client, ROOM, { msgtype: "m.text", body: "hi" }, 61_000, null, 1_000);
        expect(id).toBe("d2");
        expect(raw._unstable_sendDelayedEvent).toHaveBeenCalledWith(ROOM, { delay: 60_000 }, null, "m.room.message", { msgtype: "m.text", body: "hi" });
    });

    it("schedules ciphertext, never the plain text, in encrypted rooms", async () => {
        const { client, http, raw } = mkClient({ encrypted: true });
        await scheduleMessage(client, ROOM, { msgtype: "m.text", body: "secret" }, 61_000, null, 1_000);
        expect(raw._unstable_sendDelayedEvent).not.toHaveBeenCalled();
        const [method, path, query, body] = http.authedRequest.mock.calls[0];
        expect(method).toBe("PUT");
        expect(path).toBe(`/rooms/${encodeURIComponent(ROOM)}/send/m.room.encrypted/t1`);
        expect(query).toEqual({ "org.matrix.msc4140.delay": 60_000 });
        expect(JSON.stringify(body)).not.toContain("secret");
    });

    it("refuses to schedule in an encrypted room when it can't encrypt", async () => {
        const { client, http, raw } = mkClient({ encrypted: true, crypto: false });
        await expect(scheduleMessage(client, ROOM, { msgtype: "m.text", body: "secret" }, 61_000, null, 1_000)).rejects.toBeInstanceOf(ScheduleError);
        expect(http.authedRequest).not.toHaveBeenCalled();
        expect(raw._unstable_sendDelayedEvent).not.toHaveBeenCalled();
    });

    it("puts a scheduled thread message into the thread", async () => {
        const { client, raw } = mkClient();
        await scheduleMessage(client, ROOM, { msgtype: "m.text", body: "hi" }, 61_000, "$root", 1_000);
        expect(raw._unstable_sendDelayedEvent.mock.calls[0][4]["m.relates_to"]).toEqual({
            rel_type: "m.thread",
            event_id: "$root",
            is_falling_back: true,
            "m.in_reply_to": { event_id: "$root" },
        });
    });
});

describe("listScheduled", () => {
    it("reads both response shapes and shows local previews for encrypted ones", async () => {
        const { client } = mkClient({ encrypted: true });
        await scheduleMessage(client, ROOM, { msgtype: "m.text", body: "mine", "de.datanauten.priority": "urgent" }, 61_000, null, 1_000);
        (client as unknown as { _unstable_getDelayedEvents: unknown })._unstable_getDelayedEvents = async () => ({
            scheduled: [
                { delay_id: "d1", room_id: ROOM, type: "m.room.encrypted", delay: 5_000, running_since: 10, content: {} },
                { delay_id: "d9", room_id: ROOM, type: "m.room.message", delay: 1_000, running_since: 10, content: { body: "plain" } },
                { delay_id: "dx", room_id: ROOM, type: "m.room.member", delay: 1, running_since: 1, content: {} },
            ],
        });
        const list = await listScheduled(client);
        expect(list.map((i) => [i.delayId, i.sendAt, i.preview, i.priority])).toEqual([
            ["d9", 1_010, "plain", undefined],
            ["d1", 5_010, "mine", "urgent"],
        ]);
    });
});

describe("presets", () => {
    it("offers in an hour, tomorrow 9:00 and next Monday 9:00", () => {
        // Wednesday 10 Nov 2027 15:30 local time.
        const now = new Date(2027, 10, 10, 15, 30, 20);
        const [hour, tomorrow, monday] = presets(now);
        expect(hour.at.getHours()).toBe(16);
        expect(hour.at.getSeconds()).toBe(0);
        expect([tomorrow.at.getDate(), tomorrow.at.getHours()]).toEqual([11, 9]);
        expect([monday.at.getDay(), monday.at.getDate(), monday.at.getHours()]).toEqual([1, 15, 9]);
    });

    it("means the following Monday when it is Monday", () => {
        const monday = presets(new Date(2027, 10, 15, 8, 0))[2];
        expect(monday.at.getDate()).toBe(22);
    });
});
