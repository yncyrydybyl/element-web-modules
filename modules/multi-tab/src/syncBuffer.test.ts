import { describe, expect, it } from "vitest";

import { SyncBuffer } from "./syncBuffer";

const body = (next: string, extra: Record<string, unknown> = {}): string =>
    JSON.stringify({ next_batch: next, rooms: { join: {} }, ...extra });

describe("SyncBuffer", () => {
    it("never buffers an initial sync but remembers its token as the head", () => {
        const b = new SyncBuffer();
        expect(b.add(null, body("s1"))).toBeNull();
        expect(b.size).toBe(0);
        expect(b.head).toBe("s1");
    });

    it("serves a response only after the engine processed it", async () => {
        const b = new SyncBuffer();
        b.add("s1", body("s2"));
        let done = false;
        const p = b.lookup("s1").then((r) => {
            done = true;
            return r;
        });
        await Promise.resolve();
        expect(done).toBe(false);
        b.markProcessed("s2");
        const r = await p;
        expect("entry" in r && r.entry.next).toBe("s2");
    });

    it("parks a request at the head until the next response is processed", async () => {
        const b = new SyncBuffer();
        b.add(null, body("s1"));
        const p = b.lookup("s1");
        b.add("s1", body("s2"));
        b.markProcessed("s2");
        const r = await p;
        expect("entry" in r && r.entry.next).toBe("s2");
    });

    it("tells a mirror with an unknown token to resync (invariant I3)", async () => {
        const b = new SyncBuffer();
        b.add("s1", body("s2"));
        expect(await b.lookup("elsewhere")).toEqual({ resync: true });
    });

    it("strips device-level fields and notes whether to-device events came", async () => {
        const b = new SyncBuffer();
        const e = b.add(
            "s1",
            body("s2", {
                to_device: { events: [{ type: "m.room.encrypted" }] },
                device_lists: { changed: ["@a:x"] },
                device_one_time_keys_count: { signed_curve25519: 50 },
                device_unused_fallback_key_types: [],
                "org.matrix.msc2732.device_unused_fallback_key_types": [],
            }),
        )!;
        const parsed = JSON.parse(e.text);
        expect(Object.keys(parsed).sort()).toEqual(["next_batch", "rooms"]);
        expect(e.hadToDevice).toBe(true);
    });

    it("answers an idle long-poll once but parks the next request at the same token (no busy loop)", async () => {
        const b = new SyncBuffer();
        b.add("w", body("x"));
        b.markProcessed("x");
        const first = b.lookup("x");
        b.add("x", body("x")); // Synapse: nothing new, same token
        expect(await first).toHaveProperty("entry");
        let answered = false;
        void b.lookup("x").then(() => (answered = true));
        await new Promise((r) => setTimeout(r, 5));
        expect(answered).toBe(false);
        b.add("x", body("y"));
        b.markProcessed("y");
        await new Promise((r) => setTimeout(r, 0));
        expect(answered).toBe(true);
    });

    it("keeps a token handed to a booting mirror across later saves", async () => {
        const b = new SyncBuffer();
        for (const [s, n] of [["s1", "s2"], ["s2", "s3"], ["s3", "s4"], ["s4", "s5"], ["s5", "s6"]]) {
            b.add(s, body(n));
            b.markProcessed(n);
        }
        b.pin("s1", 0);
        for (const t of ["s3", "s4", "s5", "s6"]) b.onSaved(t, 0);
        expect(await b.lookup("s1")).toHaveProperty("entry");
        b.onSaved("s7", 120_000); // pin expired
        expect(await b.lookup("s1")).toEqual({ resync: true });
    });

    it("keeps everything from the oldest of the last three saves", async () => {
        const b = new SyncBuffer();
        for (const [s, n] of [
            ["s1", "s2"],
            ["s2", "s3"],
            ["s3", "s4"],
            ["s4", "s5"],
        ]) {
            b.add(s, body(n));
            b.markProcessed(n);
        }
        b.onSaved("s2");
        expect(b.size).toBe(3); // s2, s3, s4
        b.onSaved("s3");
        b.onSaved("s4");
        expect(b.size).toBe(3); // still from s2: a mirror may have booted from that snapshot
        b.onSaved("s5");
        expect(b.size).toBe(2); // from s3
        expect(await b.lookup("s3")).toHaveProperty("entry");
        expect(await b.lookup("s2")).toEqual({ resync: true });
    });

    it("asks for a save once it grows past its limit, and drops the oldest if saves never come", () => {
        const b = new SyncBuffer(1000);
        b.add("s1", body("s2", { pad: "x".repeat(600) }));
        expect(b.wantsSave).toBe(true);
        b.add("s2", body("s3", { pad: "x".repeat(600) }));
        b.add("s3", body("s4", { pad: "x".repeat(600) }));
        expect(b.totalBytes).toBeLessThanOrEqual(2000);
        expect(b.size).toBe(1);
    });

    it("ignores bodies that aren't sync responses", () => {
        const b = new SyncBuffer();
        expect(b.add("s1", "not json")).toBeNull();
        expect(b.add("s1", JSON.stringify({ errcode: "M_UNKNOWN" }))).toBeNull();
    });

    it("counts how far behind a snapshot token is, and whether it can be served at all", () => {
        const b = new SyncBuffer();
        b.add(null, body("s1"));
        for (const [s, n] of [["s1", "s2"], ["s2", "s3"], ["s3", "s4"]]) b.add(s, body(n));
        expect(b.entriesSince("s4")).toBe(0);
        expect(b.entriesSince("s2")).toBe(2);
        expect(b.entriesSince("elsewhere")).toBeNull();
    });
});
