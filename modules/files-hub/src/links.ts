/**
 * Recognises SharePoint and OneDrive links in a message so they can be labelled. Nothing is fetched:
 * the label comes from the URL alone (sharing-link type letter, file extension, tenant name).
 */

export type CloudKind = "word" | "excel" | "powerpoint" | "pdf" | "onenote" | "folder" | "image" | "video" | "file";

export interface CloudLink {
    url: string;
    service: "sharepoint" | "onedrive";
    kind: CloudKind;
    /** File name from the path, when the URL has one. */
    name?: string;
    /** Tenant (contoso in contoso.sharepoint.com). */
    tenant?: string;
}

const URL_RE = /https:\/\/[^\s<>"')\]]+/g;
const MAX_LINKS = 3;

/** Sharing links look like https://contoso.sharepoint.com/:w:/s/site/…; the letter is the type. */
const TYPE_LETTERS: Record<string, CloudKind> = { w: "word", x: "excel", p: "powerpoint", b: "pdf", o: "onenote", f: "folder", i: "image", v: "video", u: "file", t: "file" };

const EXT_KIND: Record<string, CloudKind> = {
    doc: "word", docx: "word", docm: "word", xls: "excel", xlsx: "excel", xlsm: "excel", csv: "excel", ppt: "powerpoint",
    pptx: "powerpoint", pdf: "pdf", one: "onenote", png: "image", jpg: "image", jpeg: "image", gif: "image", mp4: "video", mov: "video",
};

export function parseCloudLink(raw: string): CloudLink | null {
    let u: URL;
    try {
        u = new URL(raw.replace(/[.,;:!?]+$/, ""));
    } catch {
        return null;
    }
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    let service: CloudLink["service"];
    let tenant: string | undefined;
    const sp = /^([a-z0-9-]+?)(-my)?\.sharepoint\.com$/.exec(host);
    if (sp) {
        service = sp[2] ? "onedrive" : "sharepoint";
        tenant = sp[1];
    } else if (host === "1drv.ms" || host === "onedrive.live.com") service = "onedrive";
    else return null;

    const path = u.pathname;
    let kind: CloudKind = "file";
    const letter = /^\/:([a-z]):\//i.exec(path) ?? (host === "1drv.ms" ? /^\/([a-z])\//i.exec(path) : null);
    if (letter) kind = TYPE_LETTERS[letter[1].toLowerCase()] ?? "file";

    let name: string | undefined;
    const last = decodeSafe(path.split("/").filter(Boolean).pop() ?? "");
    const fromQuery = u.searchParams.get("file");
    const candidate = fromQuery ?? last;
    const ext = /\.([a-z0-9]{2,5})$/i.exec(candidate)?.[1]?.toLowerCase();
    if (ext && EXT_KIND[ext]) {
        name = candidate;
        if (kind === "file") kind = EXT_KIND[ext];
    }
    return { url: u.toString(), service, kind, name, tenant };
}

function decodeSafe(s: string): string {
    try {
        return decodeURIComponent(s);
    } catch {
        return s;
    }
}

export function findCloudLinks(text: string): CloudLink[] {
    const out: CloudLink[] = [];
    const seen = new Set<string>();
    for (const m of text.matchAll(URL_RE)) {
        const link = parseCloudLink(m[0]);
        if (!link || seen.has(link.url)) continue;
        seen.add(link.url);
        out.push(link);
        if (out.length >= MAX_LINKS) break;
    }
    return out;
}

/** Cheap pre-check for the message renderer filter (runs for every message). */
export function mayHaveCloudLink(text: string): boolean {
    return /sharepoint\.com|1drv\.ms|onedrive\.live\.com/i.test(text);
}
