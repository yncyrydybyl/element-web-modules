import { describe, expect, it, vi } from "vitest";

import type { SdkClient, SdkEvent } from "./client";
import {
    defaultUrgentRecipients,
    ensureUrgentRule,
    priorityOf,
    stripFallback,
    UrgentReminders,
    URGENT_RULE_ID,
    withPriority,
    withUrgentMentions,
} from "./priority";

const label = (p: string): string => (p === "urgent" ? "Urgent" : "Important");

describe("withPriority", () => {
    it("marks the content and prefixes the fallback body", () => {
        const c = withPriority({ msgtype: "m.text", body: "Server down" }, "urgent", label);
        expect(c).toMatchObject({ "de.datanauten.priority": "urgent", body: "🚨 Urgent: Server down" });
        expect(priorityOf(c)).toBe("urgent");
        expect(stripFallback(c.body as string)).toBe("Server down");
    });

    it("leaves standard messages alone", () => {
        expect(withPriority({ body: "hi" }, undefined, label)).toEqual({ body: "hi" });
        expect(priorityOf({ "de.datanauten.priority": "whenever" })).toBeUndefined();
    });
});

describe("urgent mentions", () => {
    const people = (n: number): { userId: string }[] => Array.from({ length: n }, (_, i) => ({ userId: `@u${i}:x` }));

    it("mentions everyone in rooms of up to 20 others, nobody by default in bigger ones", () => {
        expect(defaultUrgentRecipients(people(1))).toEqual(["@u0:x"]);
        expect(defaultUrgentRecipients(people(20))).toHaveLength(20);
        expect(defaultUrgentRecipients(people(21))).toEqual([]);
    });

    it("adds m.mentions, merging with mentions already there", () => {
        expect(withUrgentMentions({ body: "x" }, [])).toEqual({ body: "x" });
        const c = withUrgentMentions({ body: "x", "m.mentions": { user_ids: ["@a:x"] } }, ["@a:x", "@b:x"]);
        expect(c["m.mentions"]).toEqual({ user_ids: ["@a:x", "@b:x"] });
    });
});

describe("ensureUrgentRule", () => {
    it("adds the override rule once, and not again after the user removed it", async () => {
        const addPushRule = vi.fn();
        const client = { getPushRules: async () => ({ global: { override: [] } }), addPushRule } as unknown as SdkClient;
        expect(await ensureUrgentRule(client, false)).toBe(true);
        expect(addPushRule).toHaveBeenCalledWith("global", "override", URGENT_RULE_ID, expect.objectContaining({
            conditions: [{ kind: "event_match", key: "content.de\\.datanauten\\.priority", pattern: "urgent" }],
        }));
        expect(await ensureUrgentRule(client, true)).toBe(false);
        expect(addPushRule).toHaveBeenCalledTimes(1);
    });
});

describe("UrgentReminders", () => {
    function setup() {
        let now = 1_000_000;
        let read = false;
        const show = vi.fn();
        const hide = vi.fn();
        const client = {
            getUserId: () => "@bob:tw.test",
            getRoom: () => ({ hasUserReadEvent: () => read }),
        } as unknown as SdkClient;
        const r = new UrgentReminders({ client: () => client, enabled: () => true, show, hide }, () => now);
        const ev = (over: Partial<Record<string, unknown>> = {}): SdkEvent =>
            ({
                getId: () => "$e1",
                getRoomId: () => "!r",
                getType: () => "m.room.message",
                getSender: () => "@alice:tw.test",
                getContent: () => ({ body: "🚨 Urgent: Call me", "de.datanauten.priority": "urgent" }),
                getTs: () => 1_000_000,
                isRedacted: () => false,
                sender: { name: "Alice" },
                ...over,
            }) as unknown as SdkEvent;
        return { r, ev, show, hide, setNow: (n: number) => (now = n), setRead: () => (read = true) };
    }

    it("reminds every 2 minutes until read", () => {
        const { r, ev, show, hide, setNow, setRead } = setup();
        r.consider(ev());
        expect(show).toHaveBeenLastCalledWith(expect.objectContaining({ sender: "Alice", text: "Call me", count: 1 }));
        setNow(1_000_000 + 60_000);
        r.tick();
        expect(show).toHaveBeenCalledTimes(1);
        setNow(1_000_000 + 2 * 60_000 + 1);
        r.tick();
        expect(show).toHaveBeenLastCalledWith(expect.objectContaining({ count: 2 }));
        setRead();
        r.tick();
        expect(hide).toHaveBeenCalledWith("$e1");
        expect(r.size).toBe(0);
    });

    it("stops after 20 minutes", () => {
        const { r, ev, hide, setNow } = setup();
        r.consider(ev());
        setNow(1_000_000 + 20 * 60_000 + 1);
        r.tick();
        expect(hide).toHaveBeenCalled();
    });

    it("ignores own, old and non-urgent messages", () => {
        const { r, ev, show } = setup();
        r.consider(ev({ getSender: () => "@bob:tw.test" }));
        r.consider(ev({ getTs: () => 1_000_000 - 21 * 60_000 }));
        r.consider(ev({ getContent: () => ({ body: "x", "de.datanauten.priority": "important" }) }));
        expect(show).not.toHaveBeenCalled();
    });
});
