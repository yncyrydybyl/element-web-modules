import { describe, expect, it } from "vitest";

import { CONTENT_KEY, expandContent, findTagNames, parseUsedTags } from "./expand";
import type { ResolvedTag } from "./tags";

const NAMES: Record<string, string> = { "@bob:t": "Bob", "@carol:t": "Carol <3", "@dave:t": "Dave" };
const name = (u: string): string => NAMES[u] ?? u;

const tag = (n: string, members: string[], extra: Partial<ResolvedTag> = {}): ResolvedTag => ({
    name: n,
    label: "",
    kind: "tag",
    members,
    absent: [],
    allowed: true,
    ...extra,
});
const oncall = tag("oncall", ["@bob:t", "@carol:t"]);
const design = tag("design", ["@carol:t", "@dave:t"]);
const channel = tag("channel", [], { kind: "channel" });
const opts = { tags: [oncall, design, channel], name, max: 50 };

describe("findTagNames", () => {
    it("finds @names, lower-cased and once each", () => {
        expect(findTagNames("@OnCall please, and @design. @oncall again")).toEqual(["oncall", "design"]);
    });

    it("ignores user IDs, e-mail addresses and code", () => {
        expect(findTagNames("ping @bob:t or ops@oncall.example, `@oncall` and\n```\n@design\n```")).toEqual([]);
    });

    it("accepts brackets and line starts before the @", () => {
        expect(findTagNames("(@oncall)\n@design")).toEqual(["oncall", "design"]);
    });
});

describe("expandContent", () => {
    it("adds every member to m.mentions and names them in body and HTML", () => {
        const r = expandContent({ msgtype: "m.text", body: "@oncall the build is red" }, opts)!;
        expect(r.used.map((t) => t.name)).toEqual(["oncall"]);
        expect(r.content.body).toBe("@oncall (Bob, Carol <3) the build is red");
        expect(r.content.format).toBe("org.matrix.custom.html");
        expect(r.content.formatted_body).toBe(
            '<strong>@oncall</strong> (<a href="https://matrix.to/#/@bob:t">Bob</a>, <a href="https://matrix.to/#/@carol:t">Carol &#60;3</a>) the build is red',
        );
        expect(r.content["m.mentions"]).toEqual({ user_ids: ["@bob:t", "@carol:t"] });
        expect(r.content[CONTENT_KEY]).toEqual([{ name: "oncall", user_ids: ["@bob:t", "@carol:t"] }]);
    });

    it("merges with the mentions Element already put in (pills, replies) and dedupes across tags", () => {
        const r = expandContent(
            { msgtype: "m.text", body: "@oncall @design hi Alice", "m.mentions": { user_ids: ["@alice:t", "@bob:t"] } },
            opts,
        )!;
        expect(r.content["m.mentions"]).toEqual({ user_ids: ["@alice:t", "@bob:t", "@carol:t", "@dave:t"] });
    });

    it("keeps existing HTML and leaves code and links alone", () => {
        const r = expandContent(
            {
                msgtype: "m.text",
                body: "**hi** @oncall `@design`",
                format: "org.matrix.custom.html",
                formatted_body: '<strong>hi</strong> <a href="https://x/@oncall">@oncall</a> @oncall <code>@design</code>',
            },
            opts,
        )!;
        expect(r.content.formatted_body).toBe(
            '<strong>hi</strong> <a href="https://x/@oncall">@oncall</a> <strong>@oncall</strong> (<a href="https://matrix.to/#/@bob:t">Bob</a>, <a href="https://matrix.to/#/@carol:t">Carol &#60;3</a>) <code>@design</code>',
        );
        expect(r.used.map((t) => t.name)).toEqual(["oncall"]);
    });

    it("escapes the plain body when building HTML from it", () => {
        const r = expandContent({ msgtype: "m.text", body: "<b>x</b>\n@oncall" }, opts)!;
        expect(r.content.formatted_body).toMatch(/^&#60;b&#62;x&#60;\/b&#62;<br><strong>@oncall<\/strong>/);
    });

    it("turns @channel into @room", () => {
        const r = expandContent({ msgtype: "m.text", body: "@channel release at 5" }, opts)!;
        expect(r.content.body).toBe("@room release at 5");
        expect(r.content["m.mentions"]).toEqual({ user_ids: [], room: true });
        expect(r.content[CONTENT_KEY]).toEqual([{ name: "channel", room: true }]);
    });

    it("skips what the sender may not use, empty tags and tags over the limit", () => {
        const big = tag("all-hands", ["@a:t", "@b:t", "@c:t"]);
        const r = expandContent(
            { msgtype: "m.text", body: "@channel @nobody @all-hands @oncall" },
            { name, max: 2, tags: [{ ...channel, allowed: false }, tag("nobody", []), big, oncall] },
        )!;
        expect(r.used.map((t) => t.name)).toEqual(["oncall"]);
        expect(r.skipped.map((s) => [s.tag.name, s.reason])).toEqual([
            ["channel", "not_allowed"],
            ["nobody", "empty"],
            ["all-hands", "too_many"],
        ]);
        expect(r.content.body).toBe("@channel @nobody @all-hands @oncall (Bob, Carol <3)");
    });

    it("returns the content unchanged with only skipped tags", () => {
        const content = { msgtype: "m.text", body: "@nobody" };
        const r = expandContent(content, { ...opts, tags: [tag("nobody", [])] })!;
        expect(r.used).toEqual([]);
        expect(r.content).toBe(content);
    });

    it("counts the members beyond the first ten instead of naming them", () => {
        const many = tag(
            "many",
            Array.from({ length: 13 }, (_, i) => `@u${i}:t`),
        );
        const r = expandContent({ msgtype: "m.text", body: "@many" }, { ...opts, tags: [many] })!;
        expect(r.content.body).toMatch(/@u9:t \+3\)$/);
        expect((r.content["m.mentions"] as { user_ids: string[] }).user_ids).toHaveLength(13);
    });

    it("leaves edits, non-text messages, unknown names and expanded messages alone", () => {
        expect(expandContent({ msgtype: "m.image", body: "@oncall" }, opts)).toBeUndefined();
        expect(expandContent({ msgtype: "m.text", body: "@unknown" }, opts)).toBeUndefined();
        expect(expandContent({ msgtype: "m.text", body: "* @oncall", "m.new_content": {} }, opts)).toBeUndefined();
        expect(expandContent({ msgtype: "m.text", body: "@oncall", "m.relates_to": { rel_type: "m.replace" } }, opts)).toBeUndefined();
        const once = expandContent({ msgtype: "m.text", body: "@oncall" }, opts)!.content;
        expect(expandContent(once, opts)).toBeUndefined();
    });

    it("does not change the input", () => {
        const content = { msgtype: "m.text", body: "@oncall", "m.mentions": {} };
        const copy = structuredClone(content);
        expandContent(content, opts);
        expect(content).toEqual(copy);
    });
});

describe("parseUsedTags", () => {
    it("reads what expandContent wrote and rejects junk", () => {
        const c = expandContent({ msgtype: "m.text", body: "@oncall @channel" }, opts)!.content;
        expect(parseUsedTags(c)).toEqual([
            { name: "oncall", user_ids: ["@bob:t", "@carol:t"], room: undefined },
            { name: "channel", room: true, user_ids: undefined },
        ]);
        expect(parseUsedTags({ [CONTENT_KEY]: "x" })).toBeUndefined();
        expect(parseUsedTags({ [CONTENT_KEY]: [{ nope: 1 }] })).toBeUndefined();
        expect(parseUsedTags(undefined)).toBeUndefined();
    });
});
