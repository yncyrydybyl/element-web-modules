/**
 * What a shared file is, how it's classified and filtered. Pure functions, no Element internals.
 */

/** `content.file` of an encrypted attachment (Matrix spec, EncryptedFile). */
export interface EncryptedFile {
    url: string;
    key: { kty: string; key_ops: string[]; alg: string; k: string; ext: boolean };
    iv: string;
    hashes: Record<string, string>;
    v: string;
}

export type Category = "document" | "image" | "video" | "other";
export type OfficeKind = "word" | "excel" | "powerpoint" | "pdf" | "text" | null;

export interface FileItem {
    roomId: string;
    eventId: string;
    sender: string;
    ts: number;
    name: string;
    mimetype?: string;
    size?: number;
    msgtype: string;
    category: Category;
    office: OfficeKind;
    /** Plain `mxc://` URL (unencrypted room) or the encrypted file's keys (encrypted room). */
    url?: string;
    file?: EncryptedFile;
    threadId?: string;
}

/** The fields of an event this needs; works for raw JSON and decrypted matrix-js-sdk events. */
export interface EventLike {
    eventId: string;
    roomId: string;
    type: string;
    sender: string;
    ts: number;
    content: Record<string, unknown>;
    redacted?: boolean;
    threadId?: string;
}

const FILE_MSGTYPES = new Set(["m.file", "m.image", "m.video", "m.audio"]);

/** A file item for an `m.room.message` with an attachment, or null. */
export function fileFromEvent(ev: EventLike): FileItem | null {
    if (ev.type !== "m.room.message" || ev.redacted) return null;
    const c = ev.content;
    const msgtype = typeof c.msgtype === "string" ? c.msgtype : "";
    if (!FILE_MSGTYPES.has(msgtype)) return null;
    // Edits carry the new content in m.new_content; the original event is what's listed.
    const rel = c["m.relates_to"] as { rel_type?: string; event_id?: string } | undefined;
    if (rel?.rel_type === "m.replace") return null;
    const file = isEncryptedFile(c.file) ? c.file : undefined;
    const url = typeof c.url === "string" && c.url.startsWith("mxc://") ? c.url : undefined;
    if (!file && !url) return null;
    const info = (c.info ?? {}) as { mimetype?: unknown; size?: unknown };
    // Since Matrix 1.10, `filename` is the file name and `body` may be a caption.
    const name = String((typeof c.filename === "string" && c.filename) || c.body || "file");
    const mimetype = typeof info.mimetype === "string" ? info.mimetype : undefined;
    const size = typeof info.size === "number" && info.size >= 0 ? info.size : undefined;
    const threadId = ev.threadId ?? (rel?.rel_type === "m.thread" ? rel.event_id : undefined);
    return {
        roomId: ev.roomId,
        eventId: ev.eventId,
        sender: ev.sender,
        ts: ev.ts,
        name,
        mimetype,
        size,
        msgtype,
        category: categoryOf(msgtype, mimetype, name),
        office: officeKindOf(mimetype, name),
        url: file ? undefined : url,
        file,
        threadId,
    };
}

function isEncryptedFile(v: unknown): v is EncryptedFile {
    const f = v as Partial<EncryptedFile> | undefined;
    return !!f && typeof f.url === "string" && typeof f.iv === "string" && !!f.key && !!f.hashes;
}

export function extensionOf(name: string): string {
    const m = /\.([a-z0-9]{1,8})$/i.exec(name.trim());
    return m ? m[1].toLowerCase() : "";
}

const DOC_EXT = new Set([
    "pdf", "doc", "docx", "docm", "dot", "dotx", "odt", "rtf", "txt", "md", "xls", "xlsx", "xlsm", "csv", "ods",
    "ppt", "pptx", "pptm", "odp", "key", "pages", "numbers", "one", "vsdx", "epub",
]);
const DOC_MIME = /^(application\/(pdf|msword|rtf|vnd\.ms-|vnd\.openxmlformats-officedocument|vnd\.oasis\.opendocument|epub)|text\/)/;

export function categoryOf(msgtype: string, mimetype: string | undefined, name: string): Category {
    const mime = (mimetype ?? "").toLowerCase();
    if (msgtype === "m.image" || mime.startsWith("image/")) return "image";
    if (msgtype === "m.video" || mime.startsWith("video/")) return "video";
    if (DOC_MIME.test(mime) || DOC_EXT.has(extensionOf(name))) return "document";
    return "other";
}

export function officeKindOf(mimetype: string | undefined, name: string): OfficeKind {
    const mime = (mimetype ?? "").toLowerCase();
    const ext = extensionOf(name);
    if (mime === "application/pdf" || ext === "pdf") return "pdf";
    if (/wordprocessingml|msword|opendocument\.text/.test(mime) || ["doc", "docx", "docm", "dot", "dotx", "odt", "rtf"].includes(ext)) return "word";
    if (/spreadsheetml|ms-excel|opendocument\.spreadsheet/.test(mime) || ["xls", "xlsx", "xlsm", "ods", "csv"].includes(ext)) return "excel";
    if (/presentationml|ms-powerpoint|opendocument\.presentation/.test(mime) || ["ppt", "pptx", "pptm", "odp"].includes(ext)) return "powerpoint";
    if (mime.startsWith("text/") || ["txt", "md"].includes(ext)) return "text";
    return null;
}

export function formatSize(bytes: number | undefined): string {
    if (bytes === undefined) return "";
    if (bytes < 1024) return `${bytes} B`;
    const units = ["KB", "MB", "GB"];
    let v = bytes / 1024;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
        v /= 1024;
        i++;
    }
    return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

export interface FileFilter {
    category?: Category | "all";
    sender?: string;
    /** Only these rooms (a room or a space's rooms); undefined means all. */
    roomIds?: ReadonlySet<string>;
    query?: string;
}

export type SortKey = "date" | "name" | "size";

export function filterFiles(items: Iterable<FileItem>, f: FileFilter, sort: SortKey = "date"): FileItem[] {
    const q = (f.query ?? "").trim().toLowerCase();
    const out: FileItem[] = [];
    for (const i of items) {
        if (f.category && f.category !== "all" && i.category !== f.category) continue;
        if (f.sender && i.sender !== f.sender) continue;
        if (f.roomIds && !f.roomIds.has(i.roomId)) continue;
        if (q && !i.name.toLowerCase().includes(q)) continue;
        out.push(i);
    }
    const by: Record<SortKey, (a: FileItem, b: FileItem) => number> = {
        date: (a, b) => b.ts - a.ts,
        name: (a, b) => a.name.localeCompare(b.name) || b.ts - a.ts,
        size: (a, b) => (b.size ?? -1) - (a.size ?? -1) || b.ts - a.ts,
    };
    return out.sort(by[sort]);
}
