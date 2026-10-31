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
});
