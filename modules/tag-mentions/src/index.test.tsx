import { afterEach, describe, expect, it, vi } from "vitest";
import type { Api } from "@element-hq/element-web-module-api";

import TagMentionsModule from "./index";
import { TAG_EVENT } from "./tags";
import { fakeClient, fakeRoom, MEMBERS } from "./tests/fakeClient";

function fakeApi(): Api & { dialogs: unknown[][]; renderers: unknown[][]; options: { type: string }[] } {
    const dialogs: unknown[][] = [];
    const renderers: unknown[][] = [];
    const options: { type: string }[] = [];
    return {
        dialogs,
        renderers,
        options,
        i18n: { register: vi.fn(), translate: (k: string) => k },
        config: { get: () => undefined },
        composer: { addFileUploadOption: (o: { type: string }) => options.push(o), insertPlaintextIntoComposer: vi.fn() },
        customComponents: { registerMessageRenderer: (...a: unknown[]) => renderers.push(a) },
        extras: { addRoomHeaderButtonCallback: vi.fn() },
        openDialog: (...a: unknown[]) => dialogs.push(a),
        createRoot: () => ({ render: vi.fn() }),
    } as unknown as Api & { dialogs: unknown[][]; renderers: unknown[][]; options: { type: string }[] };
}

describe("TagMentionsModule", () => {
    let mod: InstanceType<typeof TagMentionsModule> | undefined;
    afterEach(() => {
        mod?.dispose();
        delete (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg;
        vi.useRealTimers();
    });

    it("expands tags in messages from Element's composer once the client has synced", async () => {
        vi.useFakeTimers();
        const room = fakeRoom({ roomId: "!r:t", members: MEMBERS, state: { [TAG_EVENT]: { oncall: { user_ids: ["@bob:t", "@carol:t"] } } } });
        const client = fakeClient([room]);
        const original = client.sendMessage as ReturnType<typeof vi.fn>;
        let synced = false;
        client.isInitialSyncComplete = () => synced;
        (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg = { get: () => client };
        const api = fakeApi();
        mod = new TagMentionsModule(api);
        await mod.load();
        expect(api.options.map((o) => o.type)).toEqual(["de.datanauten.tag_mentions.insert"]);
        expect(api.renderers).toHaveLength(2); // the suite chain: one editable, one locked registration

        vi.advanceTimersByTime(2500);
        expect(client.sendMessage).toBe(original);
        synced = true;
        vi.advanceTimersByTime(2500);
        expect(client.sendMessage).not.toBe(original);

        await client.sendMessage("!r:t", null, { msgtype: "m.text", body: "@oncall deploy?", "m.mentions": {} });
        const sent = original.mock.calls[0][2] as Record<string, unknown>;
        expect(sent.body).toBe("@oncall (Bob, Carol) deploy?");
        expect(sent["m.mentions"]).toEqual({ user_ids: ["@bob:t", "@carol:t"] });

        await client.sendMessage("!r:t", null, { msgtype: "m.text", body: "@channel hi" });
        expect((original.mock.calls[1][2] as { body: string }).body).toBe("@room hi");
        expect(api.dialogs).toHaveLength(0);

        // A tag that can't be expanded is sent as typed, and the sender is told why.
        room.currentState.mayTriggerNotifOfType = () => false;
        await client.sendMessage("!r:t", null, { msgtype: "m.text", body: "@channel hi" });
        expect((original.mock.calls[2][2] as { body: string }).body).toBe("@channel hi");
        vi.advanceTimersByTime(1);
        expect(api.dialogs).toHaveLength(1);
    });

    it("re-hooks a new client after logging in again", async () => {
        vi.useFakeTimers();
        const first = fakeClient([]);
        const second = fakeClient([]);
        const firstOriginal = first.sendMessage;
        let current = first;
        (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg = { get: () => current };
        mod = new TagMentionsModule(fakeApi());
        await mod.load();
        vi.advanceTimersByTime(2500);
        expect(first.sendMessage).not.toBe(firstOriginal);
        current = second;
        vi.advanceTimersByTime(2500);
        expect(first.sendMessage).toBe(firstOriginal);
        expect(vi.isMockFunction(second.sendMessage)).toBe(false);
    });

    it("saves and deletes tags as state events", async () => {
        vi.useFakeTimers();
        const room = fakeRoom({ roomId: "!r:t", members: MEMBERS });
        const client = fakeClient([room]);
        (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg = { get: () => client };
        const api = fakeApi();
        mod = new TagMentionsModule(api);
        await mod.load();
        const header = (api.extras.addRoomHeaderButtonCallback as ReturnType<typeof vi.fn>).mock.calls[0][0] as (id: string) => { props: { onClick(): void } };
        header("!r:t").props.onClick();
        const props = api.dialogs[0][2] as { save(...a: unknown[]): Promise<void>; remove(...a: unknown[]): Promise<void> };
        await props.save("!r:t", "oncall", " On call ", ["@bob:t"]);
        await props.remove("!r:t", "oncall");
        expect(client.sent).toEqual([
            ["state", "!r:t", TAG_EVENT, { label: "On call", user_ids: ["@bob:t"] }, "oncall"],
            ["state", "!r:t", TAG_EVENT, {}, "oncall"],
        ]);
    });
});
