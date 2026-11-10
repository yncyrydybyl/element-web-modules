/**
 * Downloading and decrypting attachments, the way Element's `DecryptFile.ts` does it
 * (matrix-encrypt-attachment: AES-CTR with the key from the event, SHA-256 of the ciphertext checked
 * first). Element doesn't expose that function to modules, so it's reimplemented here on WebCrypto
 * (about 30 lines, no dependency). Everything stays in this browser tab: the plaintext only ever
 * exists as a Blob in memory.
 */

import type { EncryptedFile, FileItem } from "./files";

export interface MediaClient {
    baseUrl?: string;
    getAccessToken?(): string | null;
}

/**
 * Element's allow-list for Blob MIME types (`utils/blobs.ts`): anything else becomes
 * application/octet-stream, so a Blob URL can never be rendered as HTML or SVG with script.
 */
const SAFE_MIMETYPES = new Set([
    "image/jpeg", "image/gif", "image/png", "image/apng", "image/webp", "image/avif",
    "video/mp4", "video/webm", "video/ogg", "video/quicktime",
    "audio/mp4", "audio/webm", "audio/aac", "audio/mpeg", "audio/ogg", "audio/wave", "audio/wav", "audio/x-wav",
    "audio/x-pn-wav", "audio/flac", "audio/x-flac",
]);

export function safeMimetype(mimetype: string | undefined): string {
    const m = (mimetype ?? "").split(";")[0].trim().toLowerCase();
    return SAFE_MIMETYPES.has(m) ? m : "application/octet-stream";
}

export type PreviewKind = "image" | "video" | "pdf" | null;

/** What can be shown inline: only allow-listed images and videos, and PDFs (see `pdfBlob`). */
export function previewKind(item: Pick<FileItem, "mimetype" | "office" | "category">): PreviewKind {
    const safe = safeMimetype(item.mimetype);
    if (item.category === "image" && safe.startsWith("image/")) return "image";
    if (item.category === "video" && safe.startsWith("video/")) return "video";
    if (item.office === "pdf") return "pdf";
    return null;
}

function parseMxc(mxc: string): { server: string; id: string } | null {
    const m = /^mxc:\/\/([^/]+)\/([^/?#]+)$/.exec(mxc);
    return m ? { server: m[1], id: m[2] } : null;
}

/** Downloads the (possibly encrypted) bytes; authenticated media first, legacy media as fallback. */
export async function download(client: MediaClient, mxc: string, signal?: AbortSignal): Promise<ArrayBuffer> {
    const parts = parseMxc(mxc);
    if (!parts || !client.baseUrl) throw new Error("Invalid media URL");
    const base = client.baseUrl.replace(/\/$/, "");
    const path = `${encodeURIComponent(parts.server)}/${encodeURIComponent(parts.id)}`;
    const token = client.getAccessToken?.();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    let res = await fetch(`${base}/_matrix/client/v1/media/download/${path}`, { headers, signal });
    if (res.status === 404 || res.status === 400 || res.status === 405) {
        // Servers older than Matrix 1.11 don't have authenticated media.
        const body = await res.clone().json().catch(() => ({}));
        if ((body as { errcode?: string }).errcode === "M_UNRECOGNIZED" || res.status === 405) {
            res = await fetch(`${base}/_matrix/media/v3/download/${path}`, { headers, signal });
        }
    }
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    return res.arrayBuffer();
}

/** matrix-encrypt-attachment's `decryptAttachment`, on WebCrypto. */
export async function decryptAttachment(data: ArrayBuffer, info: EncryptedFile): Promise<ArrayBuffer> {
    if (!info?.key || !info.iv || !info.hashes?.sha256) throw new Error("Invalid encrypted file info");
    if (info.v && !/^v[1-2]$/.test(info.v)) throw new Error(`Unsupported attachment version: ${info.v}`);
    const subtle = globalThis.crypto.subtle;
    const digest = await subtle.digest("SHA-256", data);
    if (encodeBase64(new Uint8Array(digest)) !== info.hashes.sha256.replace(/=+$/, "")) throw new Error("Mismatched SHA-256 digest");
    const key = await subtle.importKey("jwk", info.key as JsonWebKey, { name: "AES-CTR" }, false, ["decrypt"]);
    // Versions 1 and 2 use a 64-bit counter, version 0 a 128-bit one.
    const length = info.v === "v1" || info.v === "v2" ? 64 : 128;
    return subtle.decrypt({ name: "AES-CTR", counter: decodeBase64(info.iv), length }, key, data);
}

export function encodeBase64(bytes: Uint8Array): string {
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/=+$/, "");
}

export function decodeBase64(b64: string): Uint8Array<ArrayBuffer> {
    const std = b64.replace(/-/g, "+").replace(/_/g, "/");
    const s = atob(std + "===".slice(0, (4 - (std.length % 4)) % 4));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
}

/** The file's plaintext bytes: downloaded, and decrypted if it came from an encrypted room. */
export async function fileBytes(client: MediaClient, item: Pick<FileItem, "url" | "file">, signal?: AbortSignal): Promise<ArrayBuffer> {
    if (item.file) return decryptAttachment(await download(client, item.file.url, signal), item.file);
    if (item.url) return download(client, item.url, signal);
    throw new Error("No media");
}

/**
 * A PDF Blob for the browser's PDF viewer, or null if the bytes aren't a PDF. Element's allow-list
 * has no PDFs, because a Blob URL has Element's origin. A Blob typed application/pdf is handed to
 * the browser's PDF viewer (PDFium / pdf.js), which doesn't run page script with the embedding
 * origin; the magic-number check keeps a mislabelled file from being shown at all.
 */
export function pdfBlob(bytes: ArrayBuffer): Blob | null {
    const head = new Uint8Array(bytes, 0, Math.min(1024, bytes.byteLength));
    const text = String.fromCharCode(...head);
    return text.includes("%PDF-") ? new Blob([bytes], { type: "application/pdf" }) : null;
}

/** Saves bytes under the file's name. */
export function saveAs(bytes: ArrayBuffer, name: string, mimetype?: string): void {
    const url = URL.createObjectURL(new Blob([bytes], { type: safeMimetype(mimetype) }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
