import { describe, expect, it } from "vitest";

import { categoryOf, fileFromEvent, filterFiles, formatSize, officeKindOf, type EventLike, type FileItem } from "./files";

const ev = (content: Record<string, unknown>, over: Partial<EventLike> = {}): EventLike => ({
    eventId: "$e",
    roomId: "!r",
    type: "m.room.message",
    sender: "@a:x",
    ts: 1000,
    content,
    ...over,
});

const encFile = { url: "mxc://x/enc", iv: "AAAA", hashes: { sha256: "h" }, key: { kty: "oct", key_ops: ["decrypt"], alg: "A256CTR", k: "k", ext: true }, v: "v2" };

describe("fileFromEvent", () => {
    it("reads an unencrypted file", () => {
        const f = fileFromEvent(ev({ msgtype: "m.file", body: "Report.docx", url: "mxc://x/1", info: { mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", size: 2048 } }));
        expect(f).toMatchObject({ name: "Report.docx", url: "mxc://x/1", size: 2048, category: "document", office: "word" });
        expect(f?.file).toBeUndefined();
    });

    it("reads an encrypted image and keeps the keys, not a plain URL", () => {
        const f = fileFromEvent(ev({ msgtype: "m.image", body: "cat.png", file: encFile, info: { mimetype: "image/png" } }));
        expect(f).toMatchObject({ category: "image", file: encFile });
        expect(f?.url).toBeUndefined();
    });

    it("prefers filename over a caption in body", () => {
        expect(fileFromEvent(ev({ msgtype: "m.file", body: "see this", filename: "Budget.xlsx", url: "mxc://x/1" }))?.name).toBe("Budget.xlsx");
    });

    it("ignores text, edits, redactions and other event types", () => {
        expect(fileFromEvent(ev({ msgtype: "m.text", body: "hi" }))).toBeNull();
        expect(fileFromEvent(ev({ msgtype: "m.file", body: "a", url: "mxc://x/1", "m.relates_to": { rel_type: "m.replace", event_id: "$o" } }))).toBeNull();
        expect(fileFromEvent(ev({ msgtype: "m.file", body: "a", url: "mxc://x/1" }, { redacted: true }))).toBeNull();
        expect(fileFromEvent(ev({ msgtype: "m.file", body: "a", url: "mxc://x/1" }, { type: "m.sticker" }))).toBeNull();
        expect(fileFromEvent(ev({ msgtype: "m.file", body: "a", url: "https://evil" }))).toBeNull();
    });

    it("remembers the thread", () => {
        expect(fileFromEvent(ev({ msgtype: "m.file", body: "a.pdf", url: "mxc://x/1", "m.relates_to": { rel_type: "m.thread", event_id: "$root" } }))?.threadId).toBe("$root");
    });
});

describe("classification", () => {
    it("categorises", () => {
        expect(categoryOf("m.file", "application/pdf", "a.pdf")).toBe("document");
        expect(categoryOf("m.file", undefined, "sheet.xlsx")).toBe("document");
        expect(categoryOf("m.file", "image/jpeg", "a.jpg")).toBe("image");
        expect(categoryOf("m.video", undefined, "a")).toBe("video");
        expect(categoryOf("m.file", "application/zip", "a.zip")).toBe("other");
        expect(categoryOf("m.audio", "audio/ogg", "voice.ogg")).toBe("other");
    });

    it("knows office kinds", () => {
        expect(officeKindOf(undefined, "Deck.PPTX")).toBe("powerpoint");
        expect(officeKindOf("application/vnd.ms-excel", "x")).toBe("excel");
        expect(officeKindOf("application/pdf", "x")).toBe("pdf");
        expect(officeKindOf("application/zip", "a.zip")).toBeNull();
    });

    it("formats sizes", () => {
        expect(formatSize(undefined)).toBe("");
        expect(formatSize(500)).toBe("500 B");
        expect(formatSize(1536)).toBe("1.5 KB");
        expect(formatSize(25 * 1024 * 1024)).toBe("25 MB");
    });
});

describe("filterFiles", () => {
    const item = (over: Partial<FileItem>): FileItem => ({
        roomId: "!a", eventId: Math.random().toString(), sender: "@a:x", ts: 1, name: "x", msgtype: "m.file", category: "other", office: null, ...over,
    });
    const items = [
        item({ name: "Report.docx", category: "document", ts: 3, size: 10 }),
        item({ name: "cat.png", category: "image", ts: 5, sender: "@b:x", roomId: "!b", size: 30 }),
        item({ name: "budget.xlsx", category: "document", ts: 1, roomId: "!b", size: 20 }),
    ];

    it("filters by type, person, rooms and name, newest first", () => {
        expect(filterFiles(items, {}).map((i) => i.name)).toEqual(["cat.png", "Report.docx", "budget.xlsx"]);
        expect(filterFiles(items, { category: "document" }).map((i) => i.name)).toEqual(["Report.docx", "budget.xlsx"]);
        expect(filterFiles(items, { sender: "@b:x" }).map((i) => i.name)).toEqual(["cat.png"]);
        expect(filterFiles(items, { roomIds: new Set(["!b"]) }).map((i) => i.name)).toEqual(["cat.png", "budget.xlsx"]);
        expect(filterFiles(items, { query: "  REP " }).map((i) => i.name)).toEqual(["Report.docx"]);
    });

    it("sorts by name and size", () => {
        expect(filterFiles(items, {}, "name").map((i) => i.name)).toEqual(["budget.xlsx", "cat.png", "Report.docx"]);
        expect(filterFiles(items, {}, "size").map((i) => i.size)).toEqual([30, 20, 10]);
    });
});
