import { describe, expect, it } from "vitest";

import { parseConfig } from "./config";

describe("parseConfig", () => {
    it("applies defaults when there is no config", () => {
        expect(parseConfig(undefined)).toEqual({
            trigger_key: "?",
            allow_customisation: true,
            hidden_categories: [],
            hidden_shortcuts: [],
            extra_shortcuts: [],
        });
    });

    it("accepts extra shortcuts with localised labels", () => {
        const config = parseConfig({ extra_shortcuts: [{ label: { en: "Open store", de: "Store öffnen" }, keys: "Mod+Shift+M" }] });
        expect(config.extra_shortcuts[0].keys).toBe("Mod+Shift+M");
    });

    it("rejects invalid combos", () => {
        expect(() => parseConfig({ trigger_key: "Hyper+X" })).toThrow();
        expect(() => parseConfig({ extra_shortcuts: [{ label: "x", keys: "Foo+K" }] })).toThrow();
    });
});
