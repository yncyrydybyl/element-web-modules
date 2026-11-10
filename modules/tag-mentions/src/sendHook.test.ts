import { describe, expect, it, vi } from "vitest";

import { installSendHook } from "./sendHook";
import { fakeClient } from "./tests/fakeClient";

describe("installSendHook", () => {
    it("replaces the content in both sendMessage signatures and keeps the rest", async () => {
        const client = fakeClient([]);
        const original = client.sendMessage;
        installSendHook(client, (_room, c) => ({ ...c, body: "changed" }));
        await client.sendMessage("!r", { body: "a" }, "txn1");
        await client.sendMessage("!r", "$thread", { body: "b" }, "txn2");
        await client.sendMessage("!r", null, { body: "c" });
        expect((original as ReturnType<typeof vi.fn>).mock.calls).toEqual([
            ["!r", { body: "changed" }, "txn1", undefined],
            ["!r", "$thread", { body: "changed" }, "txn2"],
            ["!r", null, { body: "changed" }, undefined],
        ]);
    });

    it("sends unchanged when the transform returns nothing or throws", async () => {
        const client = fakeClient([]);
        const original = client.sendMessage as ReturnType<typeof vi.fn>;
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        let fail = false;
        installSendHook(client, () => {
            if (fail) throw new Error("boom");
            return undefined;
        });
        await client.sendMessage("!r", { body: "a" });
        fail = true;
        await client.sendMessage("!r", { body: "b" });
        expect(original.mock.calls.map((c) => c[1])).toEqual([{ body: "a" }, { body: "b" }]);
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it("doesn't stack when installed twice and restores the original", () => {
        const client = fakeClient([]);
        const original = client.sendMessage;
        installSendHook(client, () => undefined);
        const undo = installSendHook(client, () => undefined)!;
        undo();
        expect(client.sendMessage).toBe(original);
    });
});
