import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTO_REPLY_KEY, AutoReplier, localDay, type Settings } from "./autoReply";
import { CALL_FLAG_KEY, CallWatcher, CONNECTED_CALLS, DEBOUNCE_MS, getElementCallStore, STALE_CALL_MS, type CallStoreLike } from "./callWatcher";
import type { SdkClient, SdkEvent } from "./client";
import { dmPartner, findUserId } from "./client";
import { ProfileStore } from "./profileStore";

function fakeClient(over: Partial<SdkClient> = {}): SdkClient {
    return {
        getUserId: () => "@me:x",
        getRoom: () => null,
        sendEvent: vi.fn(async () => ({ event_id: "$sent" })),
        getExtendedProfile: vi.fn(async () => ({})),
        setExtendedProfileProperty: vi.fn(async () => {}),
        deleteExtendedProfileProperty: vi.fn(async () => {}),
        on: vi.fn(),
        off: vi.fn(),
        ...over,
    } as SdkClient;
}

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

describe("ProfileStore", () => {
    it("fetches once, serves the cache, and refetches when older than allowed", async () => {
        let now = 1000;
        const client = fakeClient({ getExtendedProfile: vi.fn(async () => ({ "org.matrix.msc4426.status": { emoji: "🔴", text: "x" } })) });
        const store = new ProfileStore({ client: () => client, now: () => now });
        const seen: string[] = [];
        store.subscribe((id) => seen.push(id));
        expect(store.request("@a:x")).toBeUndefined();
        store.request("@a:x");
        await flush();
        expect(client.getExtendedProfile).toHaveBeenCalledTimes(1);
        expect(store.get("@a:x")?.status?.text).toBe("x");
        expect(seen).toEqual(["@a:x"]);
        now += 10_000;
        store.request("@a:x", 60_000);
        expect(client.getExtendedProfile).toHaveBeenCalledTimes(1);
        now += 60_000;
        store.request("@a:x", 60_000);
        await flush();
        expect(client.getExtendedProfile).toHaveBeenCalledTimes(2);
    });

    it("treats 404 and 403 as an empty profile", async () => {
        const client = fakeClient({ getExtendedProfile: vi.fn(async () => Promise.reject(Object.assign(new Error("nope"), { httpStatus: 404 }))) });
        const store = new ProfileStore({ client: () => client });
        await store.refresh("@a:x");
        expect(store.get("@a:x")).toEqual({ status: undefined, callSince: undefined, card: {} });
    });

    it("waits for retry_after_ms after a 429 and tries again", async () => {
        vi.useFakeTimers();
        try {
            let calls = 0;
            const client = fakeClient({
                getExtendedProfile: vi.fn(async () => {
                    if (calls++ === 0) throw Object.assign(new Error("slow down"), { httpStatus: 429, data: { retry_after_ms: 500 } });
                    return { "de.datanauten.job_title": "CTO" };
                }),
            });
            const store = new ProfileStore({ client: () => client });
            store.request("@a:x");
            await vi.advanceTimersByTimeAsync(10);
            expect(store.get("@a:x")).toBeUndefined();
            await vi.advanceTimersByTimeAsync(600);
            expect(store.get("@a:x")?.card.job_title).toBe("CTO");
        } finally {
            vi.useRealTimers();
        }
    });

    it("stops when the server has no extended profiles", async () => {
        const client = fakeClient({ getExtendedProfile: vi.fn(async () => Promise.reject(new Error("Server does not support extended profiles"))) });
        const store = new ProfileStore({ client: () => client });
        await store.refresh("@a:x");
        expect(store.supported).toBe(false);
        store.request("@b:x");
        await flush();
        expect(client.getExtendedProfile).toHaveBeenCalledTimes(1);
    });
});

class FakeCallStore implements CallStoreLike {
    public connectedCalls = new Set<unknown>();
    private listener?: (now: Set<unknown>, prev: Set<unknown>) => void;
    public on(event: string, l: (now: Set<unknown>, prev: Set<unknown>) => void): void {
        expect(event).toBe(CONNECTED_CALLS);
        this.listener = l;
    }
    public off(): void {
        this.listener = undefined;
    }
    public set(calls: unknown[]): void {
        const prev = this.connectedCalls;
        this.connectedCalls = new Set(calls);
        this.listener?.(this.connectedCalls, prev);
    }
}

describe("CallWatcher", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("writes m.call when a call connects and deletes it afterwards, debounced", async () => {
        const store = new FakeCallStore();
        const write = vi.fn(async () => {});
        const w = new CallWatcher({ store: () => store, write, enabled: () => true });
        expect(w.attach()).toBe(true);
        store.set([1]);
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10);
        expect(write).toHaveBeenLastCalledWith(true);
        expect(localStorage.getItem(CALL_FLAG_KEY)).toBe("1");
        // A quick drop and re-join produces no update
        store.set([]);
        store.set([2]);
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10);
        expect(write).toHaveBeenCalledTimes(1);
        store.set([]);
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10);
        expect(write).toHaveBeenLastCalledWith(false);
        expect(localStorage.getItem(CALL_FLAG_KEY)).toBeNull();
    });

    it("does nothing while disabled (e.g. Element's own MSC4426 code is on)", async () => {
        const store = new FakeCallStore();
        const write = vi.fn(async () => {});
        const w = new CallWatcher({ store: () => store, write, enabled: () => false });
        w.attach();
        store.set([1]);
        await vi.advanceTimersByTimeAsync(DEBOUNCE_MS + 10);
        expect(write).not.toHaveBeenCalled();
    });

    it("cleans up a left-over m.call from this device, or a very old one", async () => {
        const write = vi.fn(async () => {});
        const w = new CallWatcher({ store: () => new FakeCallStore(), write, enabled: () => true });
        w.attach();
        await w.cleanUp(Date.now() - 1000);
        expect(write).not.toHaveBeenCalled(); // maybe in a call on another device
        localStorage.setItem(CALL_FLAG_KEY, "1");
        await w.cleanUp(Date.now() - 1000);
        expect(write).toHaveBeenCalledWith(false);
        write.mockClear();
        await w.cleanUp(Date.now() - STALE_CALL_MS - 1);
        expect(write).toHaveBeenCalledWith(false);
    });

    it("finds Element's CallStore through window.mxCallStatusListener, or nothing", () => {
        expect(getElementCallStore()).toBeUndefined();
        const store = new FakeCallStore();
        (window as { mxCallStatusListener?: unknown }).mxCallStatusListener = { callStore: store };
        expect(getElementCallStore()).toBe(store);
        delete (window as { mxCallStatusListener?: unknown }).mxCallStatusListener;
    });
});

function ev(over: Partial<Record<string, unknown>> = {}): SdkEvent {
    const v = { id: "$1", room: "!dm:x", type: "m.room.message", sender: "@bob:x", content: { msgtype: "m.text", body: "hi" }, ts: Date.now(), ...over };
    return {
        getId: () => v.id as string,
        getRoomId: () => v.room as string,
        getType: () => v.type as string,
        getSender: () => v.sender as string,
        getContent: () => v.content as Record<string, unknown>,
        getTs: () => v.ts as number,
    };
}

describe("AutoReplier", () => {
    function setup(settings: Settings, oooActive = true) {
        let s = settings;
        const client = fakeClient({
            getAccountData: (type: string) => (type === "m.direct" ? { getContent: () => ({ "@bob:x": ["!dm:x"] }) } : undefined),
        });
        const save = vi.fn(async (patch: Settings) => {
            s = { ...s, ...patch };
        });
        const r = new AutoReplier({
            client: () => client,
            settings: () => s,
            saveSettings: save,
            ooo: () => ({ active: oooActive, until: "2026-11-16" }),
            message: (until) => `away until ${until}`,
            allowed: () => true,
        });
        return { r, client, save, settings: () => s };
    }

    it("replies once per DM per day with a marked m.notice", async () => {
        const { r, client, settings } = setup({ auto_reply: true });
        expect(await r.handle(ev())).toBe(true);
        expect(client.sendEvent).toHaveBeenCalledWith("!dm:x", "m.room.message", { msgtype: "m.notice", body: "away until 2026-11-16", [AUTO_REPLY_KEY]: true });
        expect(settings().replied).toEqual({ "!dm:x": localDay(Date.now()) });
        expect(await r.handle(ev({ id: "$2" }))).toBe(false);
        expect(client.sendEvent).toHaveBeenCalledTimes(1);
    });

    it("respects a reply recorded by another device today, and forgets older days", async () => {
        const { r, client } = setup({ auto_reply: true, replied: { "!dm:x": localDay(Date.now()) } });
        expect(await r.handle(ev())).toBe(false);
        const other = setup({ auto_reply: true, replied: { "!dm:x": "2020-01-01", "!old:x": "2020-01-01" } });
        expect(await other.r.handle(ev())).toBe(true);
        expect(other.settings().replied).toEqual({ "!dm:x": localDay(Date.now()) });
        expect(client.sendEvent).not.toHaveBeenCalled();
    });

    it("stays quiet when off, not out of office, for notices, own messages, old messages and non-DMs", async () => {
        expect(await setup({}).r.handle(ev())).toBe(false);
        expect(await setup({ auto_reply: true }, false).r.handle(ev())).toBe(false);
        const { r, client } = setup({ auto_reply: true });
        expect(await r.handle(ev({ content: { msgtype: "m.notice", body: "bot" } }))).toBe(false);
        expect(await r.handle(ev({ id: "$a", content: { msgtype: "m.text", body: "x", [AUTO_REPLY_KEY]: true } }))).toBe(false);
        expect(await r.handle(ev({ id: "$b", sender: "@me:x" }))).toBe(false);
        expect(await r.handle(ev({ id: "$c", ts: Date.now() - 10 * 60 * 1000 }))).toBe(false);
        expect(await r.handle(ev({ id: "$d", room: "!group:x" }))).toBe(false);
        expect(await r.handle(ev({ id: "$e", type: "m.reaction" }))).toBe(false);
        expect(client.sendEvent).not.toHaveBeenCalled();
    });
});

describe("client helpers", () => {
    it("finds the DM partner from m.direct only, and not after they left", () => {
        const members: Record<string, { userId: string; membership: string }> = { "@bob:x": { userId: "@bob:x", membership: "join" } };
        const room = { roomId: "!dm:x", name: "", getMember: (u: string) => members[u] ?? null, getJoinedMembers: () => [] };
        const c = fakeClient({ getRoom: () => room, getAccountData: () => ({ getContent: () => ({ "@bob:x": ["!dm:x"] }) }) });
        expect(dmPartner(c, "!dm:x")).toBe("@bob:x");
        expect(dmPartner(c, "!twoPeople:x")).toBeUndefined();
        members["@bob:x"].membership = "leave";
        expect(dmPartner(c, "!dm:x")).toBeUndefined();
    });

    it("pulls user IDs out of tooltips", () => {
        expect(findUserId("Alice (@alice:status.test)")).toBe("@alice:status.test");
        expect(findUserId("@bob:example.org")).toBe("@bob:example.org");
        expect(findUserId("Alice")).toBeUndefined();
    });
});
