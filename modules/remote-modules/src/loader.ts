/**
 * Fetches a module build and runs it like Element's own ModuleLoader would.
 *
 * Element's Content Security Policy only runs scripts from Element's origin (and, with the
 * server change described in the README, `blob:` URLs). So the source is fetched as text
 * (allowed: `connect-src *`), wrapped in a Blob and imported from its `blob:` URL.
 */

import type { Api, ModuleFactory } from "@element-hq/element-web-module-api";

/** The parts of matrix-js-sdk's MatrixClient used here. */
export interface SdkClient {
    getUserId(): string | null;
    getAccessToken(): string | null;
    mxcUrlToHttp(
        mxcUrl: string,
        width?: number,
        height?: number,
        resizeMethod?: string,
        allowDirectLinks?: boolean,
        allowRedirects?: boolean,
        useAuthentication?: boolean,
    ): string | null;
    uploadContent(file: File | Blob, opts?: { name?: string; type?: string; includeFilename?: boolean }): Promise<{ content_uri: string }>;
}

export function getSdkClient(): SdkClient | undefined {
    const peg = (window as { mxMatrixClientPeg?: { get?(): SdkClient | null } }).mxMatrixClientPeg;
    try {
        return peg?.get?.() ?? undefined;
    } catch {
        return undefined;
    }
}

export type ModuleStatus =
    | { state: "loading" }
    | { state: "loaded"; apiVersion?: string }
    | { state: "failed"; error: string }
    | { state: "disabled" }
    /** Turned off or removed after it was loaded: only a reload unloads it. */
    | { state: "reload"; apiVersion?: string };

export type Importer = (url: string) => Promise<{ default?: unknown }>;

const nativeImport: Importer = (url) => import(/* @vite-ignore */ url);

export async function fetchSource(source: string, client: SdkClient | undefined): Promise<string> {
    let url = source;
    const headers: Record<string, string> = {};
    if (source.startsWith("mxc://")) {
        if (!client) throw new Error("Not logged in");
        // Authenticated media (Matrix 1.11): needs the access token.
        url = client.mxcUrlToHttp(source, undefined, undefined, undefined, false, true, true) ?? "";
        if (!url) throw new Error(`Can't resolve ${source}`);
        const token = client.getAccessToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }
    // no-store: while developing, a module at the same URL changes all the time.
    const response = await fetch(url, { headers, cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText || "error"} fetching ${source}`);
    return response.text();
}

/** Runs one module's source with the given API, like Element's ModuleLoader. */
export async function runModule(code: string, api: Api, importer: Importer = nativeImport): Promise<{ apiVersion?: string }> {
    const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
    let exports: { default?: unknown };
    try {
        exports = await importer(url);
    } catch (e) {
        throw new Error(
            e instanceof Error && /Content Security Policy|Failed to fetch dynamically imported module|error loading dynamically/i.test(e.message)
                ? `Element's Content Security Policy blocked it: the server must allow blob: scripts (see the remote-modules README). ${e.message}`
                : `Import failed: ${e instanceof Error ? e.message : String(e)}`,
        );
    } finally {
        URL.revokeObjectURL(url);
    }
    const factory = exports.default as ModuleFactory | undefined;
    if (typeof factory !== "function" || typeof factory.prototype?.load !== "function") {
        throw new Error("Not an Element module: the default export must be a class with a load() method");
    }
    const module = new factory(api);
    await module.load();
    return { apiVersion: factory.moduleApiVersion };
}
