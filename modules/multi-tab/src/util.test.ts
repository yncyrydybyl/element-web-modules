import { describe, expect, it } from "vitest";

import { fingerprint } from "./preflight";
import { isLoginCallback } from "./login";
import { clearDeadEngineLock } from "./engine";
import { SESSION_LOCK } from "./hooks";
import { quietly, setBounded, withTimeout } from "./util";

describe("helpers", () => {
    it("setBounded keeps the newest entries", () => {
        const m = new Map<string, number>();
        for (const [k, v] of [["a", 1], ["b", 2], ["a", 3], ["c", 4]] as const) setBounded(m, k, v, 2);
        expect([...m.entries()]).toEqual([
            ["a", 3],
            ["c", 4],
        ]);
    });

    it("quietly turns a throw into the fallback", () => {
        expect(
            quietly(() => {
                throw new Error("quota");
            }, 7),
        ).toBe(7);
    });

    it("withTimeout falls back on rejection and on time-out", async () => {
        await expect(withTimeout(Promise.reject(new Error("x")), 50, "fb")).resolves.toBe("fb");
        await expect(withTimeout(new Promise(() => {}), 5, "fb")).resolves.toBe("fb");
        await expect(withTimeout(Promise.resolve("v"), 50, "fb")).resolves.toBe("v");
    });

    it("fingerprint ignores a trailing slash on the homeserver URL", () => {
        const s = { userId: "@a:x", deviceId: "D", hsUrl: "https://hs.example/" };
        expect(fingerprint(s, "1")).toBe(fingerprint({ ...s, hsUrl: "https://hs.example" }, "1"));
        expect(fingerprint(s, "1")).not.toBe(fingerprint(s, "2"));
    });

    it("recognises the return from an SSO or OIDC login", () => {
        expect(isLoginCallback({ search: "?loginToken=abc", hash: "" } as Location)).toBe(true);
        expect(isLoginCallback({ search: "", hash: "#/?code=1&state=2" } as Location)).toBe(true);
        expect(isLoginCallback({ search: "", hash: "#/room/!r:x" } as Location)).toBe(false);
    });

    it("clears Element's session lock only if the dead engine still owns it", () => {
        localStorage.setItem(SESSION_LOCK.owner, "other");
        localStorage.setItem(SESSION_LOCK.ping, "1");
        clearDeadEngineLock(localStorage, "dead");
        expect(localStorage.getItem(SESSION_LOCK.owner)).toBe("other");
        localStorage.setItem(SESSION_LOCK.owner, "dead");
        clearDeadEngineLock(localStorage, "dead");
        expect(localStorage.getItem(SESSION_LOCK.owner)).toBeNull();
        expect(localStorage.getItem(SESSION_LOCK.ping)).toBeNull();
    });
});

describe("crypto events between tabs", () => {
    it("drop the emitter js-sdk appends, so they can be posted", async () => {
        const { encodeCryptoEvent, decodeCryptoEvent } = await import("./codec");
        const source = { on: () => {} }; // RustCrypto: has functions, can't be cloned
        const e = encodeCryptoEvent("crypto.devicesUpdated", [["@a:x"], false, source]);
        expect(e.args).toEqual([["@a:x"], false]);
        expect(() => structuredClone(e)).not.toThrow();
        expect(decodeCryptoEvent(e.name, e.args)).toEqual([["@a:x"], false]);
    });
});
