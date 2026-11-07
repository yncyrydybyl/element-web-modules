import { afterEach, describe, expect, it, vi } from "vitest";

import { AvatarCache } from "./avatars";
import { fakeClient } from "./tests/fakeClient";

const png = () => new Response("x", { headers: { "Content-Type": "image/png" } });

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe("AvatarCache", () => {
    it("fetches with the access token, falls back to legacy media, and announces arrivals once", async () => {
        vi.useFakeTimers();
        const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
            if (url.includes("/x/legacy") && url.includes("/client/v1/")) return new Response("", { status: 404 });
            if (url.includes("/x/broken")) return new Response("nope", { status: 404 });
            if (url.includes("/x/html")) return new Response("<p>", { headers: { "Content-Type": "text/html" } });
            return url.includes("/client/v1/") && (init?.headers as Record<string, string>)?.Authorization !== "Bearer token"
                ? new Response("", { status: 401 })
                : png();
        });
        vi.stubGlobal("fetch", fetchMock);
        let n = 0;
        vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: () => `blob:${n++}`, revokeObjectURL: vi.fn() }));

        const cache = new AvatarCache(fakeClient([]));
        const listener = vi.fn();
        cache.subscribe(listener);
        cache.request(["mxc://x/auth", "mxc://x/legacy", "mxc://x/broken", "mxc://x/html", undefined, "https://not-mxc"]);
        cache.request(["mxc://x/auth"]);
        await vi.runAllTimersAsync();

        expect(cache.get("mxc://x/auth")).toMatch(/^blob:/);
        expect(cache.get("mxc://x/legacy")).toMatch(/^blob:/);
        expect(cache.get("mxc://x/broken")).toBeUndefined();
        expect(cache.get("mxc://x/html")).toBeUndefined();
        expect(fetchMock.mock.calls.filter(([url]) => url.includes("/x/auth"))).toHaveLength(1);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(cache.getVersion()).toBe(1);

        cache.dispose();
        expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
        expect(cache.get("mxc://x/auth")).toBeUndefined();
    });

    it("keeps avatars in Cache Storage between sessions when asked to, and deletes them", async () => {
        const store = new Map<string, Response>();
        const bucket = {
            match: vi.fn(async (key: string) => store.get(key)?.clone()),
            put: vi.fn(async (key: string, res: Response) => void store.set(key, res)),
        };
        const caches = { open: vi.fn(async () => bucket), delete: vi.fn(async () => store.clear() === undefined) };
        vi.stubGlobal("caches", caches);
        const fetchMock = vi.fn(async () => png());
        vi.stubGlobal("fetch", fetchMock);
        vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: () => "blob:x", revokeObjectURL: vi.fn() }));

        let persist = true;
        const first = new AvatarCache(fakeClient([]), () => persist);
        first.request(["mxc://x/a"]);
        await vi.waitFor(() => expect(first.get("mxc://x/a")).toBe("blob:x"));
        expect(store.size).toBe(1);

        // After a reload: from the cache, not the network.
        const second = new AvatarCache(fakeClient([]), () => persist);
        second.request(["mxc://x/a"]);
        await vi.waitFor(() => expect(second.get("mxc://x/a")).toBe("blob:x"));
        expect(fetchMock).toHaveBeenCalledTimes(1);

        persist = false;
        const third = new AvatarCache(fakeClient([]), () => persist);
        third.request(["mxc://x/a"]);
        await vi.waitFor(() => expect(third.get("mxc://x/a")).toBe("blob:x"));
        expect(fetchMock).toHaveBeenCalledTimes(2);

        await AvatarCache.clearPersisted();
        expect(caches.delete).toHaveBeenCalledWith("de.datanauten.space_room_map.avatars");
        expect(store.size).toBe(0);
    });
});
