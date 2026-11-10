import { afterEach, describe, expect, it, vi } from "vitest";

import type { EncryptedFile } from "./files";
import { decryptAttachment, download, encodeBase64, fileBytes, pdfBlob, previewKind, safeMimetype } from "./media";

/** Encrypts like matrix-encrypt-attachment's encryptAttachment (v2, 64-bit counter). */
async function encrypt(plain: Uint8Array<ArrayBuffer>): Promise<{ data: ArrayBuffer; info: EncryptedFile }> {
    const subtle = globalThis.crypto.subtle;
    const iv = new Uint8Array(16);
    globalThis.crypto.getRandomValues(iv.subarray(0, 8));
    const key = await subtle.generateKey({ name: "AES-CTR", length: 256 }, true, ["encrypt", "decrypt"]);
    const jwk = await subtle.exportKey("jwk", key);
    const data = await subtle.encrypt({ name: "AES-CTR", counter: iv, length: 64 }, key, plain);
    const sha = new Uint8Array(await subtle.digest("SHA-256", data));
    return { data, info: { url: "mxc://x/enc", v: "v2", key: jwk as EncryptedFile["key"], iv: encodeBase64(iv), hashes: { sha256: encodeBase64(sha) } } };
}

afterEach(() => vi.unstubAllGlobals());

describe("decryptAttachment", () => {
    it("round-trips", async () => {
        const plain = new TextEncoder().encode("%PDF-1.7 hello");
        const { data, info } = await encrypt(plain);
        const out = new Uint8Array(await decryptAttachment(data, info));
        expect(new TextDecoder().decode(out)).toBe("%PDF-1.7 hello");
    });

    it("refuses tampered ciphertext", async () => {
        const { data, info } = await encrypt(new Uint8Array([1, 2, 3]));
        const bad = new Uint8Array(data.slice(0));
        bad[0] ^= 1;
        await expect(decryptAttachment(bad.buffer, info)).rejects.toThrow(/SHA-256/);
    });
});

describe("download", () => {
    it("uses authenticated media with the access token and falls back to legacy media", async () => {
        const calls: { url: string; auth?: string }[] = [];
        vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
            calls.push({ url, auth: (init.headers as Record<string, string>).Authorization });
            if (url.includes("/client/v1/")) return new Response(JSON.stringify({ errcode: "M_UNRECOGNIZED" }), { status: 404 });
            return new Response(new Uint8Array([7, 8]));
        });
        const bytes = await download({ baseUrl: "https://hs.example/", getAccessToken: () => "tok" }, "mxc://srv/abc");
        expect(new Uint8Array(bytes)).toEqual(new Uint8Array([7, 8]));
        expect(calls).toEqual([
            { url: "https://hs.example/_matrix/client/v1/media/download/srv/abc", auth: "Bearer tok" },
            { url: "https://hs.example/_matrix/media/v3/download/srv/abc", auth: "Bearer tok" },
        ]);
    });

    it("decrypts encrypted files after downloading the ciphertext", async () => {
        const { data, info } = await encrypt(new TextEncoder().encode("secret"));
        vi.stubGlobal("fetch", async () => new Response(data));
        const out = await fileBytes({ baseUrl: "https://hs", getAccessToken: () => "t" }, { file: info });
        expect(new TextDecoder().decode(out)).toBe("secret");
    });

    it("rejects a missing file", async () => {
        vi.stubGlobal("fetch", async () => new Response("nope", { status: 404 }));
        await expect(download({ baseUrl: "https://hs" }, "mxc://srv/abc")).rejects.toThrow(/404/);
    });
});

describe("safety", () => {
    it("only allows Element's blob-safe MIME types", () => {
        expect(safeMimetype("image/png")).toBe("image/png");
        expect(safeMimetype("image/svg+xml")).toBe("application/octet-stream");
        expect(safeMimetype("text/html; charset=utf-8")).toBe("application/octet-stream");
    });

    it("previews only safe images, videos and PDFs", () => {
        expect(previewKind({ category: "image", office: null, mimetype: "image/png" })).toBe("image");
        expect(previewKind({ category: "image", office: null, mimetype: "image/svg+xml" })).toBeNull();
        expect(previewKind({ category: "document", office: "pdf", mimetype: "application/pdf" })).toBe("pdf");
        expect(previewKind({ category: "document", office: "word" })).toBeNull();
    });

    it("only makes a PDF blob from real PDF bytes", () => {
        expect(pdfBlob(new TextEncoder().encode("%PDF-1.4\n...").buffer)?.type).toBe("application/pdf");
        expect(pdfBlob(new TextEncoder().encode("<html><script>alert(1)</script>").buffer)).toBeNull();
    });
});
