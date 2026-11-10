import { describe, expect, it } from "vitest";

import { FileIndex } from "./scanner";
import { roomsInSpace, joinedSpaces } from "./spaces";
import { encryptedRaw, fakeClient, fileRaw, sdkEvent } from "./tests/fakeClient";

const DAY = 86400000;
const NOW = 1000 * DAY;
const opts = { maxAgeDays: 90, maxEventsPerRoom: 500, concurrency: 2 };
const flush = () => new Promise((r) => setTimeout(r, 60));

describe("FileIndex", () => {
    it("asks the server for files only in unencrypted rooms and pages until the age bound", async () => {
        const client = fakeClient([
            {
                roomId: "!plain",
                name: "Plain",
                pages: [
                    [fileRaw("!plain", "new.pdf", NOW - DAY), fileRaw("!plain", "mid.docx", NOW - 10 * DAY)],
                    [fileRaw("!plain", "old-but-ok.xlsx", NOW - 80 * DAY), fileRaw("!plain", "too-old.pptx", NOW - 100 * DAY)],
                    [fileRaw("!plain", "never.txt", NOW - 200 * DAY)],
                ],
            },
        ]);
        const index = new FileIndex(() => client, opts, () => NOW);
        await index.scan(["!plain"]);
        expect(index.list().map((i) => i.name).sort()).toEqual(["mid.docx", "new.pdf", "old-but-ok.xlsx"]);
        expect(client.requests).toHaveLength(2);
        const filter = JSON.parse(String(client.requests[0].query.filter));
        expect(filter).toMatchObject({ contains_url: true, types: ["m.room.message"] });
        expect(client.requests[1].query.from).toBe("p1");
        expect(index.progress(["!plain"])).toMatchObject({ running: false, roomsDone: 1, roomsWithMore: 1 });

        // "Search older" moves the window and resumes from the stored token.
        await index.searchOlder(["!plain"]);
        expect(index.list().map((i) => i.name)).toContain("too-old.pptx");
        expect(client.requests[2].query.from).toBe("p1");
    });

    it("decrypts events locally in encrypted rooms and counts what it can't decrypt", async () => {
        const plain = fileRaw("!enc", "secret.pdf", NOW - DAY, {}, { url: undefined, file: { url: "mxc://x/e", iv: "a", hashes: { sha256: "h" }, key: { k: "k" }, v: "v2" } });
        const text = { ...fileRaw("!enc", "x", NOW - DAY), content: { msgtype: "m.text", body: "hello" } };
        const client = fakeClient([
            { roomId: "!enc", name: "Enc", encrypted: true, pages: [[encryptedRaw("!enc", plain, NOW - DAY), encryptedRaw("!enc", text, NOW - DAY), encryptedRaw("!enc", null, NOW - 2 * DAY)]] },
        ]);
        const index = new FileIndex(() => client, opts, () => NOW);
        await index.scan(["!enc"]);
        expect(index.list()).toHaveLength(1);
        expect(index.list()[0]).toMatchObject({ name: "secret.pdf", file: { url: "mxc://x/e" } });
        const filter = JSON.parse(String(client.requests[0].query.filter));
        expect(filter.contains_url).toBeUndefined();
        expect(filter.types).toContain("m.room.encrypted");
        expect(index.progress(["!enc"])).toMatchObject({ undecryptable: 1, roomsWithMore: 0 });
    });

    it("stops at the event budget", async () => {
        const page = Array.from({ length: 100 }, (_, i) => fileRaw("!big", `f${i}.pdf`, NOW - DAY));
        const client = fakeClient([{ roomId: "!big", name: "Big", pages: [page, page, page] }]);
        const index = new FileIndex(() => client, { ...opts, maxEventsPerRoom: 150 }, () => NOW);
        await index.scan(["!big"]);
        expect(client.requests.map((r) => r.query.limit)).toEqual([100, 50]);
        expect(index.progress(["!big"]).roomsWithMore).toBe(1);
    });

    it("uses events Element already loaded without asking the server first", async () => {
        const loaded = sdkEvent(fileRaw("!r", "loaded.png", NOW, {}, { msgtype: "m.image", info: { mimetype: "image/png" } }));
        const client = fakeClient([{ roomId: "!r", name: "R", loaded: [loaded], pages: [] }], { hold: true });
        const index = new FileIndex(() => client, opts, () => NOW);
        const done = index.scan(["!r"]);
        expect(index.list().map((i) => i.name)).toEqual(["loaded.png"]);
        client.release!();
        await done;
    });

    it("can be cancelled and resumes the same page later", async () => {
        const client = fakeClient([{ roomId: "!r", name: "R", pages: [[fileRaw("!r", "a.pdf", NOW)]] }], { hold: true });
        const index = new FileIndex(() => client, opts, () => NOW);
        const run = index.scan(["!r"]);
        await flush();
        expect(index.isRunning()).toBe(true);
        index.cancel();
        client.release!();
        await run;
        expect(index.list()).toHaveLength(0);
        await index.scan(["!r"]);
        expect(index.list()).toHaveLength(1);
        expect(client.requests.map((r) => r.query.from)).toEqual([undefined, undefined]);
    });

    it("follows live events and redactions, and hides rooms the user left", async () => {
        const client = fakeClient([
            { roomId: "!r", name: "R", pages: [] },
            { roomId: "!gone", name: "Gone", membership: "leave", pages: [] },
        ]);
        const index = new FileIndex(() => client, opts, () => NOW);
        await index.scan(["!r"]);
        const live = sdkEvent(fileRaw("!r", "live.pdf", NOW));
        client.emit("Room.timeline", live, null, false);
        client.emit("Room.timeline", sdkEvent(fileRaw("!gone", "x.pdf", NOW)), null, false);
        expect(index.list().map((i) => i.name)).toEqual(["live.pdf"]);
        client.emit("Room.redaction", sdkEvent({ event_id: "$red", room_id: "!r", type: "m.room.redaction", sender: "@a:x", origin_server_ts: NOW, content: { redacts: live.getId() } }));
        expect(index.list()).toHaveLength(0);
        index.dispose();
    });

    it("scans the most recently active rooms first and skips spaces", () => {
        const client = fakeClient([
            { roomId: "!old", name: "Old", lastActive: 1 },
            { roomId: "!new", name: "New", lastActive: 9 },
            { roomId: "!space", name: "Space", space: true },
            { roomId: "!left", name: "Left", membership: "leave" },
        ]);
        const index = new FileIndex(() => client, opts, () => NOW);
        expect(index.scannableRooms()).toEqual(["!new", "!old"]);
        expect(index.scannableRooms(new Set(["!old"]))).toEqual(["!old"]);
    });
});

describe("spaces", () => {
    const child = (key: string, via = true) =>
        sdkEvent({ event_id: `$c${key}`, type: "m.space.child", state_key: key, sender: "@a:x", origin_server_ts: 0, content: via ? { via: ["x"] } : {} });

    it("collects rooms of a space and its subspaces, skipping removed children", () => {
        const client = fakeClient([
            { roomId: "!top", name: "Top", space: true, state: { "m.space.child": [child("!a"), child("!sub"), child("!removed", false)] } },
            { roomId: "!sub", name: "Sub", space: true, state: { "m.space.child": [child("!b"), child("!top")] } },
            { roomId: "!a", name: "A" },
            { roomId: "!b", name: "B" },
        ]);
        expect([...roomsInSpace(client, "!top")].sort()).toEqual(["!a", "!b"]);
        expect(joinedSpaces(client).map((s) => s.name)).toEqual(["Sub", "Top"]);
    });
});
