import { describe, expect, it, vi } from "vitest";

import { parseConfig } from "./config";

describe("parseConfig", () => {
    it("has sensible defaults without any config", () => {
        const c = parseConfig(undefined);
        expect(c).toMatchObject({ spaces: [], autoOpen: true, utdHint: true, joinSuggestedRooms: true });
        // No spaces configured: nothing to join, so that step is left out.
        expect(c.steps).toEqual(["secure", "habits", "profile"]);
        expect(c.organisation).toBeUndefined();
    });

    it("reads every option", () => {
        const c = parseConfig({
            organisation: "Contoso",
            help_url: "https://intranet.example/it",
            help_label: "IT desk",
            spaces: ["#a:example.org", { alias: "#b:example.org", name: "B", description: "The B team" }],
            steps: ["spaces", "secure"],
            language: "de",
            auto_open: false,
            utd_hint: false,
            join_suggested_rooms: false,
        });
        expect(c).toEqual({
            organisation: "Contoso",
            helpUrl: "https://intranet.example/it",
            helpLabel: "IT desk",
            spaces: [{ alias: "#a:example.org" }, { alias: "#b:example.org", name: "B", description: "The B team" }],
            steps: ["spaces", "secure"],
            language: "de",
            autoOpen: false,
            utdHint: false,
            joinSuggestedRooms: false,
        });
    });

    it("ignores invalid values with a warning instead of throwing", () => {
        const warn = vi.fn();
        const c = parseConfig(
            {
                organisation: 42,
                help_url: "javascript:alert(1)",
                spaces: ["not-an-alias", { alias: "#ok:x" }, "#ok:x", 7],
                steps: ["secure", "bogus", "secure"],
                language: "fr",
                auto_open: "yes",
            },
            warn,
        );
        expect(c.organisation).toBeUndefined();
        expect(c.helpUrl).toBeUndefined();
        expect(c.spaces).toEqual([{ alias: "#ok:x" }]);
        expect(c.steps).toEqual(["secure"]);
        expect(c.language).toBeUndefined();
        expect(c.autoOpen).toBe(true);
        expect(warn.mock.calls.length).toBeGreaterThanOrEqual(6);
    });

    it("accepts mailto: and room IDs", () => {
        const c = parseConfig({ help_url: "mailto:it@example.org", spaces: ["!abc:example.org"] });
        expect(c.helpUrl).toBe("mailto:it@example.org");
        expect(c.spaces).toEqual([{ alias: "!abc:example.org" }]);
        expect(c.steps).toContain("spaces");
    });
});
