/**
 * Which requests a mirror may make itself. Shared by the mirror's fetch router, the engine's sync tee and the
 * e2e assertions, so the three never disagree.
 */

export type Route =
    /** Classic `GET /sync`: answered by the engine. */
    | "sync"
    /** Device-level crypto and token endpoints: only the engine may call them (invariant I2). */
    | "forbidden"
    /** Any other homeserver request: the mirror makes it itself. */
    | "homeserver"
    /** Not the homeserver at all: left alone. */
    | "foreign";

const CLIENT_PREFIX = "/_matrix/client/";

/** The URL and method of a `fetch(input, init)` call, whatever form `input` takes. */
export function requestTarget(input: RequestInfo | URL, init?: RequestInit): { url: string; method: string } {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    return { url, method };
}

/** Path patterns below `/_matrix/client/<version>/` that only the engine may call. */
const FORBIDDEN = [
    /^keys\//,
    /^sendToDevice\//,
    /^room_keys\//,
    /dehydrated_device/,
    /^refresh$/,
    // Simplified sliding sync: its connection state lives in one client only.
    /^org\.matrix\.simplified_msc3575\/sync$/,
];

const SYNC = /^sync$/;

/** `v3/keys/query` → `keys/query`; `unstable/org.matrix.msc3814.v1/dehydrated_device` → the part after the version. */
function clientPath(pathname: string): string | null {
    if (!pathname.startsWith(CLIENT_PREFIX)) return null;
    const rest = pathname.slice(CLIENT_PREFIX.length);
    const slash = rest.indexOf("/");
    return slash < 0 ? "" : rest.slice(slash + 1);
}

/**
 * @param url - The request URL.
 * @param method - HTTP method.
 * @param homeserver - The homeserver base URL of the session (e.g. `https://matrix.example.org`).
 * @param body - The request body if it is a string; used to spot OAuth refresh-token grants to any origin.
 */
export function classify(url: string, method: string, homeserver: string, body?: unknown): Route {
    if (typeof body === "string" && /(^|&)grant_type=refresh_token(&|$)/.test(body)) return "forbidden";

    let u: URL;
    let hs: URL;
    try {
        u = new URL(url, globalThis.location?.href);
        hs = new URL(homeserver);
    } catch {
        return "foreign";
    }
    if (u.origin !== hs.origin) return "foreign";
    const basePath = hs.pathname.replace(/\/$/, "");
    if (!u.pathname.startsWith(basePath + CLIENT_PREFIX)) return "homeserver";

    const path = clientPath(u.pathname.slice(basePath.length));
    if (path === null) return "homeserver";
    if (FORBIDDEN.some((re) => re.test(path))) return "forbidden";
    if (SYNC.test(path) && method.toUpperCase() === "GET") return "sync";
    return "homeserver";
}

/** Fields of a `/sync` response that only the device's crypto engine can use; never copied to mirrors. */
export const DEVICE_FIELDS = [
    "to_device",
    "device_lists",
    "device_one_time_keys_count",
    "device_unused_fallback_key_types",
    "org.matrix.msc2732.device_unused_fallback_key_types",
] as const;
