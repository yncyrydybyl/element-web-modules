import { describe, expect, it } from "vitest";

import { classify } from "./endpoints";

const HS = "https://matrix.example.org";

describe("classify", () => {
    it.each([
        ["GET", `${HS}/_matrix/client/v3/sync?since=s1&timeout=30000`, "sync"],
        ["POST", `${HS}/_matrix/client/v3/sync`, "homeserver"],
        ["POST", `${HS}/_matrix/client/v3/keys/upload`, "forbidden"],
        ["POST", `${HS}/_matrix/client/v3/keys/query`, "forbidden"],
        ["POST", `${HS}/_matrix/client/v3/keys/claim`, "forbidden"],
        ["GET", `${HS}/_matrix/client/v3/keys/changes?from=a&to=b`, "forbidden"],
        ["POST", `${HS}/_matrix/client/v3/keys/signatures/upload`, "forbidden"],
        ["PUT", `${HS}/_matrix/client/v3/sendToDevice/m.room.encrypted/txn1`, "forbidden"],
        ["GET", `${HS}/_matrix/client/v3/room_keys/version`, "forbidden"],
        ["PUT", `${HS}/_matrix/client/unstable/org.matrix.msc3814.v1/dehydrated_device`, "forbidden"],
        ["POST", `${HS}/_matrix/client/v3/refresh`, "forbidden"],
        ["POST", `${HS}/_matrix/client/unstable/org.matrix.simplified_msc3575/sync`, "forbidden"],
        ["PUT", `${HS}/_matrix/client/v3/rooms/!r:x/send/m.room.message/t1`, "homeserver"],
        ["POST", `${HS}/_matrix/client/v3/user/@a:x/filter`, "homeserver"],
        ["GET", `${HS}/_matrix/client/versions`, "homeserver"],
        ["GET", `${HS}/_matrix/client/v1/media/download/x/y`, "homeserver"],
        ["GET", "https://other.example.org/_matrix/client/v3/sync", "foreign"],
        ["GET", "https://matrix.example.org:8448/_matrix/client/v3/sync", "foreign"],
    ])("%s %s → %s", (method, url, route) => {
        expect(classify(url, method, HS)).toBe(route);
    });

    it("blocks a refresh-token grant to any origin (invariant I2)", () => {
        expect(
            classify("https://auth.example.org/oauth2/token", "POST", HS, "grant_type=refresh_token&refresh_token=x"),
        ).toBe("forbidden");
        expect(classify("https://auth.example.org/oauth2/token", "POST", HS, "grant_type=authorization_code")).toBe(
            "foreign",
        );
    });

    it("respects a homeserver below a path", () => {
        const hs = "https://example.org/matrix";
        expect(classify("https://example.org/matrix/_matrix/client/v3/sync?since=a", "GET", hs)).toBe("sync");
        expect(classify("https://example.org/other", "GET", hs)).toBe("homeserver");
    });
});
