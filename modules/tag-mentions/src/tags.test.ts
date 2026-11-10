import { describe, expect, it } from "vitest";

import { definitionsFor, matchTags, parentSpaces, parseTag, resolveTags, tagContent, TAG_EVENT, validateName } from "./tags";
import { fakeClient, fakeRoom, MEMBERS } from "./tests/fakeClient";

describe("names and content", () => {
    it("validates names", () => {
        expect(validateName("oncall")).toBeNull();
        expect(validateName("team-2_b")).toBeNull();
        expect(validateName("OnCall")).toBe("invalid");
        expect(validateName("-x")).toBe("invalid");
        expect(validateName("a".repeat(33))).toBe("invalid");
        expect(validateName("channel")).toBe("reserved");
        expect(validateName("room")).toBe("reserved");
    });

    it("parses tag state and treats empty content as deleted", () => {
        expect(parseTag("oncall", { label: "On call", user_ids: ["@bob:t", "@bob:t", "nope", 3] })).toEqual({
            label: "On call",
            user_ids: ["@bob:t"],
        });
        expect(parseTag("oncall", {})).toBeUndefined();
        expect(parseTag("oncall", { user_ids: [] })).toBeUndefined();
        expect(parseTag("Bad Name", { user_ids: ["@bob:t"] })).toBeUndefined();
        expect(parseTag("team", { user_ids: ["@bob:t"] })).toBeUndefined();
    });

    it("builds content without an empty label", () => {
        expect(tagContent("  ", ["@b:t", "@b:t"])).toEqual({ user_ids: ["@b:t"] });
        expect(tagContent(" Ops ", ["@b:t"])).toEqual({ label: "Ops", user_ids: ["@b:t"] });
    });
});

describe("resolveTags", () => {
    const space = fakeRoom({
        roomId: "!space:t",
        name: "Engineering",
        space: true,
        members: { ...MEMBERS, "@erin:t": "Erin" },
        state: {
            [TAG_EVENT]: {
                oncall: { user_ids: ["@dave:t"] },
                design: { label: "Designers", user_ids: ["@carol:t", "@erin:t"] },
            },
            "m.space.child": { "!room:t": { via: ["t"] } },
        },
    });
    const room = fakeRoom({
        roomId: "!room:t",
        name: "Ops",
        members: MEMBERS,
        state: { [TAG_EVENT]: { oncall: { label: "On call", user_ids: ["@alice:t", "@bob:t"] }, gone: {} } },
    });
    const client = fakeClient([space, room]);

    it("finds the spaces of a room via m.space.child as well as m.space.parent", () => {
        expect(parentSpaces(client, room).map((s) => s.roomId)).toEqual(["!space:t"]);
        const withParent = fakeRoom({ roomId: "!r2:t", state: { "m.space.parent": { "!space:t": { via: ["t"], canonical: true } } } });
        expect(parentSpaces(fakeClient([withParent, space]), withParent).map((s) => s.roomId)).toEqual(["!space:t"]);
    });

    it("lets a room tag win over the space tag of the same name", () => {
        const defs = definitionsFor(client, room);
        expect(defs.map((d) => [d.name, d.sourceId, d.fromSpace])).toEqual([
            ["design", "!space:t", true],
            ["oncall", "!room:t", false],
        ]);
    });

    it("mentions only members joined to the room, never the sender", () => {
        const tags = resolveTags(client, "!room:t");
        expect(tags.map((t) => t.name)).toEqual(["channel", "team", "design", "oncall"]);
        const design = tags.find((t) => t.name === "design")!;
        expect(design.members).toEqual(["@carol:t"]);
        expect(design.absent).toEqual(["@erin:t"]);
        expect(tags.find((t) => t.name === "oncall")!.members).toEqual(["@bob:t"]);
        const team = tags.find((t) => t.name === "team")!;
        expect(team.members).toEqual(["@bob:t", "@carol:t", "@dave:t"]);
        expect(team.label).toBe("Engineering");
    });

    it("gates @channel and @team on the room notification power level", () => {
        const strict = fakeRoom({ roomId: "!room:t", members: MEMBERS, mayNotifyRoom: false });
        const tags = resolveTags(fakeClient([strict]), "!room:t");
        expect(tags.map((t) => [t.name, t.allowed])).toEqual([["channel", false]]);
    });

    it("matches by prefix", () => {
        expect(matchTags(resolveTags(client, "!room:t"), "D").map((t) => t.name)).toEqual(["design"]);
        expect(matchTags(resolveTags(client, "!room:t"), "").length).toBe(4);
    });
});
