import { describe, expect, it, vi } from "vitest";

import { ActivityFeed, classify, collectLocal, collectServer, isRead, merge, plainText, ReactionBuffer, TargetCache, type ActivityItem, type ClassifyContext } from "./activity";
import type { SdkClient, SdkEvent, SdkRoom } from "./client";

const ME = "@me:tw.test";
const NOW = 1_800_000_000_000;

interface Raw {
    event_id: string;
    type?: string;
    sender?: string;
    origin_server_ts?: number;
    content?: Record<string, unknown>;
    wire?: Record<string, unknown>;
    redacted?: boolean;
    failed?: boolean;
    room_id?: string;
}

function ev(r: Raw): SdkEvent {
    return {
        getId: () => r.event_id,
        getRoomId: () => r.room_id ?? "!r",
        getType: () => r.type ?? "m.room.message",
        getSender: () => r.sender ?? "@bob:tw.test",
        getContent: () => r.content ?? {},
        getWireContent: () => r.wire ?? r.content ?? {},
        getTs: () => r.origin_server_ts ?? NOW - 1000,
        isRedacted: () => !!r.redacted,
        isBeingDecrypted: () => false,
        isDecryptionFailure: () => !!r.failed,
    };
}

const mine = ev({ event_id: "$mine", sender: ME, content: { body: "Release notes are in the doc" } });
const ctx = (extra: SdkEvent[] = [], threads: string[] = []): ClassifyContext => {
    const all = new Map([mine, ...extra].map((e) => [e.getId()!, e]));
    return { me: ME, find: (id) => all.get(id), myThreads: new Set(threads) };
};

describe("classify", () => {
    it("finds reactions to my messages, including encrypted ones whose relation is only on the wire", () => {
        const r = ev({ event_id: "$r", type: "m.reaction", content: {}, wire: { "m.relates_to": { rel_type: "m.annotation", event_id: "$mine", key: "👍" } } });
        expect(classify(r, ctx())).toBe("reaction");
        const other = ev({ event_id: "$r2", type: "m.reaction", content: { "m.relates_to": { rel_type: "m.annotation", event_id: "$else", key: "👍" } } });
        expect(classify(other, ctx())).toBeUndefined();
    });

    it("prefers reply over the mention Element adds to replies", () => {
        const reply = ev({
            event_id: "$re",
            content: { body: "> <@me:tw.test> Release notes\n\nLooks good", "m.relates_to": { "m.in_reply_to": { event_id: "$mine" } }, "m.mentions": { user_ids: [ME] } },
        });
        expect(classify(reply, ctx())).toBe("reply");
    });

    it("counts thread replies only in threads I'm part of", () => {
        const t = ev({ event_id: "$t", content: { body: "in thread", "m.relates_to": { rel_type: "m.thread", event_id: "$root" } } });
        expect(classify(t, ctx([], ["$root"]))).toBe("thread");
        expect(classify(t, ctx())).toBeUndefined();
        // Thread messages carry a fallback reply to the latest message (often the root): still a thread reply.
        const fallback = ev({
            event_id: "$t2",
            content: { body: "x", "m.relates_to": { rel_type: "m.thread", event_id: "$mine", is_falling_back: true, "m.in_reply_to": { event_id: "$mine" } } },
        });
        expect(classify(fallback, ctx([], ["$mine"]))).toBe("thread");
    });

    it("finds mentions of me and of the room", () => {
        expect(classify(ev({ event_id: "$m", content: { body: "hi", "m.mentions": { user_ids: [ME] } } }), ctx())).toBe("mention");
        expect(classify(ev({ event_id: "$m2", content: { body: "all", "m.mentions": { room: true } } }), ctx())).toBe("mention");
        expect(classify(ev({ event_id: "$m3", content: { body: "hi", "m.mentions": { user_ids: ["@carol:tw.test"] } } }), ctx())).toBeUndefined();
    });

    it("ignores my own events, edits, redactions and undecryptable ones", () => {
        const mention = { body: "x", "m.mentions": { user_ids: [ME] } };
        expect(classify(ev({ event_id: "$a", sender: ME, content: mention }), ctx())).toBeUndefined();
        expect(classify(ev({ event_id: "$b", content: { ...mention, "m.relates_to": { rel_type: "m.replace", event_id: "$x" } } }), ctx())).toBeUndefined();
        expect(classify(ev({ event_id: "$c", content: mention, redacted: true }), ctx())).toBeUndefined();
        expect(classify(ev({ event_id: "$d", content: mention, failed: true }), ctx())).toBeUndefined();
    });
});

describe("plainText", () => {
    it("drops the legacy reply quote and the priority prefix", () => {
        expect(plainText("> <@me:tw.test> Release notes\n> second\n\nLooks good")).toBe("Looks good");
        expect(plainText("🚨 Urgent: Server down")).toBe("Server down");
    });
});

function room(roomId: string, events: SdkEvent[], opts: { read?: Set<string>; threads?: { id: string; rootEvent?: SdkEvent; events?: SdkEvent[] }[] } = {}): SdkRoom {
    return {
        roomId,
        name: roomId,
        findEventById: (id) => events.find((e) => e.getId() === id),
        getMember: (id) => ({ name: id.slice(1, 4) }),
        hasUserReadEvent: (_u, id) => !!opts.read?.has(id),
        getLiveTimeline: () => ({ getEvents: () => events }),
        getThreads: () => opts.threads ?? [],
        getMyMembership: () => "join",
    };
}

describe("collectLocal", () => {
    it("reads the live timeline and loaded threads, newest first, within 14 days", () => {
        const root = ev({ event_id: "$root", sender: ME, content: { body: "Thread about CI" } });
        const threadReply = ev({ event_id: "$tr", origin_server_ts: NOW - 10, content: { body: "fixed", "m.relates_to": { rel_type: "m.thread", event_id: "$root" } } });
        const mention = ev({ event_id: "$m", origin_server_ts: NOW - 500, content: { body: "@me look", "m.mentions": { user_ids: [ME] } } });
        const old = ev({ event_id: "$old", origin_server_ts: NOW - 20 * 86400000, content: { body: "old", "m.mentions": { user_ids: [ME] } } });
        const r = room("!r", [mine, root, mention, old], { read: new Set(["$m"]), threads: [{ id: "$root", rootEvent: root, events: [root, threadReply] }] });
        const client = { getUserId: () => ME, getRooms: () => [r] } as unknown as SdkClient;
        const items = collectLocal(client, NOW);
        expect(items.map((i) => [i.eventId, i.kind, i.read])).toEqual([
            ["$tr", "thread", false],
            ["$m", "mention", true],
        ]);
    });
});

describe("collectServer and merge", () => {
    it("pages until the age limit, decrypts unknown events and lets local items win", async () => {
        const decrypted = new Set<string>();
        class FakeEvent {
            private content: Record<string, unknown>;
            constructor(private readonly raw: { event_id: string; type: string; sender: string; origin_server_ts: number; content: Record<string, unknown>; room_id: string }) {
                this.content = raw.content;
            }
            getId = () => this.raw.event_id;
            getRoomId = () => this.raw.room_id;
            getType = () => (decrypted.has(this.raw.event_id) ? "m.room.message" : this.raw.type);
            getSender = () => this.raw.sender;
            getContent = () => (decrypted.has(this.raw.event_id) ? { body: "secret ping", "m.mentions": { user_ids: [ME] } } : this.content);
            getTs = () => this.raw.origin_server_ts;
            isRedacted = () => false;
            isBeingDecrypted = () => false;
            isDecryptionFailure = () => false;
            isEncrypted = () => this.raw.type === "m.room.encrypted";
        }
        const r = room("!r", [mine]);
        r.currentState = { getStateEvents: () => new FakeEvent({ event_id: "$create", type: "m.room.create", sender: ME, origin_server_ts: 0, content: {}, room_id: "!r" }) as unknown as SdkEvent };
        const raw = (id: string, ts: number, type = "m.room.encrypted") => ({
            room_id: "!r",
            read: false,
            ts,
            event: { event_id: id, type, sender: "@bob:tw.test", origin_server_ts: ts, content: { algorithm: "m.megolm.v1.aes-sha2" } },
        });
        const authedRequest = vi
            .fn()
            .mockResolvedValueOnce({ notifications: [raw("$e1", NOW - 100), raw("$e2", NOW - 200, "m.room.message")], next_token: "p2" })
            .mockResolvedValueOnce({ notifications: [raw("$e3", NOW - 20 * 86400000)], next_token: "p3" });
        const client = {
            getUserId: () => ME,
            getRoom: () => r,
            getRooms: () => [r],
            http: { authedRequest },
            decryptEventIfNeeded: async (e: SdkEvent) => void decrypted.add(e.getId()!),
        } as unknown as SdkClient;
        const server = await collectServer(client, NOW);
        expect(authedRequest).toHaveBeenCalledTimes(2);
        expect(authedRequest).toHaveBeenLastCalledWith("GET", "/notifications", { limit: 50, from: "p2" });
        // $e2 is a plain message without a mention: the server notified, but it doesn't concern me.
        expect(server.map((i) => [i.eventId, i.kind, i.text])).toEqual([["$e1", "mention", "secret ping"]]);

        const local: ActivityItem = { ...server[0], text: "from timeline", read: true };
        const merged = merge([local], server);
        expect(merged).toHaveLength(1);
        expect(merged[0]).toMatchObject({ text: "from timeline", read: true });
    });
});

describe("ActivityFeed", () => {
    it("marks all read with one receipt per room, at the newest unread item", async () => {
        const a1 = ev({ event_id: "$a1", room_id: "!a", origin_server_ts: NOW - 300, content: { body: "1", "m.mentions": { user_ids: [ME] } } });
        const a2 = ev({ event_id: "$a2", room_id: "!a", origin_server_ts: NOW - 100, content: { body: "2", "m.mentions": { user_ids: [ME] } } });
        const b1 = ev({ event_id: "$b1", room_id: "!b", origin_server_ts: NOW - 200, content: { body: "3", "m.mentions": { user_ids: [ME] } } });
        const ra = room("!a", [a1, a2]);
        const rb = room("!b", [b1]);
        const sendReadReceipt = vi.fn(async () => ({}));
        const client = {
            getUserId: () => ME,
            getRooms: () => [ra, rb],
            getRoom: (id: string) => (id === "!a" ? ra : rb),
            on: vi.fn(),
            off: vi.fn(),
            sendReadReceipt,
        } as unknown as SdkClient;
        vi.spyOn(Date, "now").mockReturnValue(NOW);
        const feed = new ActivityFeed(0);
        feed.attach(client);
        expect(feed.unreadCount()).toBe(3);
        await feed.markAllRead();
        expect(sendReadReceipt.mock.calls.map((c) => (c as unknown as [SdkEvent])[0].getId()).sort()).toEqual(["$a2", "$b1"]);
        feed.detach();
        vi.restoreAllMocks();
    });
});

describe("older targets", () => {
    it("fetches a reply's target once to learn it's mine, then classifies it as a reply", async () => {
        const reply = ev({ event_id: "$re", content: { body: "Count me in!", "m.relates_to": { "m.in_reply_to": { event_id: "$old" } } } });
        const r = room("!r", [reply]);
        class Raw {
            constructor(private readonly raw: { event_id: string; sender: string; content: Record<string, unknown> }) {}
            getId = () => this.raw.event_id;
            getSender = () => this.raw.sender;
            getContent = () => this.raw.content;
            getType = () => "m.room.message";
        }
        r.currentState = { getStateEvents: () => new Raw({ event_id: "$c", sender: ME, content: {} }) as unknown as SdkEvent };
        const authedRequest = vi.fn(async () => ({ event_id: "$old", type: "m.room.message", sender: ME, origin_server_ts: 1, content: { body: "Lunch at 12:30?" } }));
        const client = { getUserId: () => ME, getRooms: () => [r], getRoom: () => r, http: { authedRequest } } as unknown as SdkClient;
        const loaded = vi.fn();
        const targets = new TargetCache(client, loaded);
        expect(collectLocal(client, NOW, targets)).toEqual([]);
        await vi.waitFor(() => expect(loaded).toHaveBeenCalled());
        const items = collectLocal(client, NOW, targets);
        expect(items.map((i) => [i.kind, i.about])).toEqual([["reply", "Lunch at 12:30?"]]);
        collectLocal(client, NOW, targets);
        expect(authedRequest).toHaveBeenCalledTimes(1);
    });

    it("treats events older than my receipt as read even when they aren't loaded", () => {
        const newer = ev({ event_id: "$new", origin_server_ts: NOW - 10 });
        const r = room("!r", [newer], { read: new Set(["$new"]) });
        expect(isRead(r, ME, "$gone", NOW - 1000)).toBe(true);
        expect(isRead(r, ME, "$gone", NOW)).toBe(false);
    });
});

describe("ReactionBuffer", () => {
    it("keeps reactions js-sdk left out of the timeline, and drops encrypted events that weren't reactions", () => {
        let type = "m.room.encrypted";
        const encrypted = { ...ev({ event_id: "$enc", type: "m.room.encrypted" }), getType: () => type };
        const reaction = ev({ event_id: "$re", type: "m.reaction", content: { "m.relates_to": { rel_type: "m.annotation", event_id: "$mine", key: "🎉" } } });
        const onAdded = vi.fn();
        const buffer = new ReactionBuffer(onAdded, 2);
        buffer.onEvent(ev({ event_id: "$msg" }));
        buffer.onEvent(encrypted);
        buffer.onEvent(reaction);
        expect(onAdded).toHaveBeenCalledTimes(2);
        expect(buffer.list()).toHaveLength(2);
        type = "m.room.message";
        expect(buffer.list().map((e) => e.getId())).toEqual(["$re"]);

        // The buffered reaction becomes an item although the timeline doesn't have it.
        const r = room("!r", [mine]);
        const client = { getUserId: () => ME, getRooms: () => [r] } as unknown as SdkClient;
        expect(collectLocal(client, NOW, undefined, buffer.list()).map((i) => [i.kind, i.text, i.about])).toEqual([
            ["reaction", "🎉", "Release notes are in the doc"],
        ]);
    });
});
