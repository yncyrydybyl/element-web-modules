import { describe, expect, it } from "vitest";

import type { MatrixClientLike } from "./hooks";
import { redirectTokenRefresh } from "./mirror";

function clientWithTokenManager(accessToken: string): { client: MatrixClientLike; tm: any } {
    const tm = { opts: { accessToken, refreshToken: "refresh-1" }, doTokenRefresh: async () => "logout" };
    return { client: { http: { opts: tm.opts, tokenManager: tm } } as unknown as MatrixClientLike, tm };
}

describe("redirectTokenRefresh", () => {
    it("takes the engine's newer token instead of refreshing", async () => {
        const { client, tm } = clientWithTokenManager("old");
        redirectTokenRefresh(client, async () => "new");
        await expect(tm.doTokenRefresh()).resolves.toBe("success");
        expect(tm.opts.accessToken).toBe("new");
    });

    it("fails the request, never logs out, when the engine has no better token", async () => {
        const { client, tm } = clientWithTokenManager("same");
        redirectTokenRefresh(client, async () => "same");
        await expect(tm.doTokenRefresh()).resolves.toBe("failure");
        redirectTokenRefresh(client, async () => null);
        await expect(tm.doTokenRefresh()).resolves.toBe("failure");
        redirectTokenRefresh(client, async () => {
            throw new Error("engine gone");
        });
        await expect(tm.doTokenRefresh()).resolves.toBe("failure");
    });

    it("keeps the refresh token, which js-sdk revokes on logout", () => {
        const { client, tm } = clientWithTokenManager("t");
        redirectTokenRefresh(client, async () => "t");
        expect(tm.opts.refreshToken).toBe("refresh-1");
    });
});
