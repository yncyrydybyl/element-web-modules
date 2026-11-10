import { Watchable } from "@element-hq/element-web-module-api";
import { describe, expect, it, vi } from "vitest";

import { parsePraise, praiseContent } from "./praise";
import { parseSaved, SavedMessages, SAVED_TYPE } from "./saved";

describe("SavedMessages", () => {
    function setup() {
        const w = new Watchable<unknown>(undefined);
        const set = vi.fn(async (_type: string, content: unknown) => {
            w.value = content;
        });
        const api = { client: { accountData: { get: () => w, set, delete: vi.fn() } } };
        return { saved: new SavedMessages(api as never), set };
    }

    it("stores only room and event IDs, and toggles", async () => {
        const { saved, set } = setup();
        expect(await saved.toggle("!r", "$a", 5)).toBe(true);
        expect(set).toHaveBeenLastCalledWith(SAVED_TYPE, { version: 1, items: [{ room_id: "!r", event_id: "$a", saved_ts: 5 }] });
        expect(saved.has("$a")).toBe(true);
        expect(await saved.toggle("!r", "$a")).toBe(false);
        expect(saved.list()).toEqual([]);
    });

    it("is off until logged in", () => {
        const api = { client: { accountData: { get: () => { throw new Error("no client"); } } } };
        const saved = new SavedMessages(api as never);
        expect(saved.attach()).toBe(false);
        expect(saved.list()).toEqual([]);
    });

    it("drops malformed entries", () => {
        expect(parseSaved({ items: [{ room_id: "!r", event_id: "$a", saved_ts: 1 }, { room_id: 3 }, null] })).toHaveLength(1);
        expect(parseSaved("nope")).toEqual([]);
    });
});

describe("praise", () => {
    it("is a normal text message with a fallback, a mention and the structured field", () => {
        const c = praiseContent(
            { badge: "team_player", recipients: ["@bob:tw.test"], note: "Thanks <3" },
            { "@bob:tw.test": "Bob" },
            () => "Team player",
            "for",
        );
        expect(c.msgtype).toBe("m.text");
        expect(c.body).toBe("🤝 Team player — for Bob\nThanks <3");
        expect(c.formatted_body).toContain("Thanks &#60;3");
        expect(c["m.mentions"]).toEqual({ user_ids: ["@bob:tw.test"] });
        expect(parsePraise(c)).toEqual({ badge: "team_player", recipients: ["@bob:tw.test"], note: "Thanks <3" });
    });

    it("ignores unknown badges", () => {
        expect(parsePraise({ "de.datanauten.praise": { badge: "employee_of_the_month", recipients: [] } })).toBeUndefined();
    });
});
