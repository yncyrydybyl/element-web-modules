import { describe, expect, it } from "vitest";

import { parseConfig } from "./config";
import { parseUserWidgets, withoutWidget, withWidget } from "./widgets";

const sticker = {
    stickers: { type: "m.widget", id: "stickers", content: { type: "m.stickerpicker", url: "https://stickers.example/", name: "Stickers" } },
};

describe("m.widgets", () => {
    it("lists user widgets but not the sticker picker or broken entries", () => {
        const list = parseUserWidgets({
            ...sticker,
            pdf: { content: { type: "m.custom", url: "https://marcade.store/apps/pdf/", name: "PDF viewer" }, sender: "@a:x" },
            bad: { content: { url: "javascript:alert(1)" } },
            none: {},
            unnamed: { content: { url: "https://people.example/panel" } },
        });
        expect(list.map((w) => [w.id, w.name])).toEqual([
            ["pdf", "PDF viewer"],
            ["unnamed", "people.example"],
        ]);
        expect(list[0].creatorUserId).toBe("@a:x");
    });

    it("adds and removes a widget and keeps the sticker picker", () => {
        const added = withWidget(sticker, "@a:x", "PDF", "https://pdf.example/", "w1");
        expect(added.stickers).toBe(sticker.stickers);
        expect(added.w1).toEqual({
            type: "m.widget",
            state_key: "w1",
            sender: "@a:x",
            id: "w1",
            content: { id: "w1", type: "m.custom", url: "https://pdf.example/", name: "PDF", data: {}, creatorUserId: "@a:x" },
        });
        expect(parseUserWidgets(added).map((w) => w.id)).toEqual(["w1"]);
        expect(withoutWidget(added, "w1")).toEqual(sticker);
    });

    it("tolerates missing account data", () => {
        expect(parseUserWidgets(undefined)).toEqual([]);
        expect(Object.keys(withWidget(undefined, "@a:x", "A", "https://a.example/"))[0]).toMatch(/^de\.datanauten\.uaw_[0-9a-f]{16}$/);
    });
});

describe("config", () => {
    it("keeps only valid suggestions and prefixes", () => {
        expect(
            parseConfig({
                suggested: [{ name: "PDF", url: "https://pdf.example/" }, { name: "x" }, { name: "js", url: "javascript:1" }],
                approve_prefixes: ["https://marcade.store/apps/", 3],
            }),
        ).toEqual({ suggested: [{ name: "PDF", url: "https://pdf.example/" }], approvePrefixes: ["https://marcade.store/apps/"] });
        expect(parseConfig(undefined)).toEqual({ suggested: [], approvePrefixes: [] });
    });
});
