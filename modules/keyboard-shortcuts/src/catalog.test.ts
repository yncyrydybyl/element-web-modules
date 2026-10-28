import { describe, expect, it } from "vitest";

import { buildCatalog, CATEGORIES } from "./catalog";

const ctx = { isMac: false, isElectron: false, ctrlEnterToSend: false };

describe("buildCatalog", () => {
    it("has unique ids and only known categories", () => {
        const catalog = buildCatalog({ ...ctx, isElectron: true, isMac: true });
        expect(new Set(catalog.map((s) => s.id)).size).toBe(catalog.length);
        const categories = new Set(CATEGORIES.map((c) => c.id));
        for (const s of catalog) expect(categories.has(s.category)).toBe(true);
    });

    it("only offers desktop shortcuts in Element Desktop", () => {
        const web = buildCatalog(ctx).map((s) => s.id);
        const desktop = buildCatalog({ ...ctx, isElectron: true }).map((s) => s.id);
        expect(web).not.toContain("KeyBinding.switchToSpaceByNumber");
        expect(desktop).toContain("KeyBinding.switchToSpaceByNumber");
    });

    it("follows the Ctrl+Enter to send setting", () => {
        const send = (ctrlEnterToSend: boolean) =>
            buildCatalog({ ...ctx, ctrlEnterToSend }).find((s) => s.id === "KeyBinding.sendMessageInComposer")!.combo;
        expect(send(false)).toEqual({ key: "Enter", ctrlOrCmdKey: false });
        expect(send(true)).toEqual({ key: "Enter", ctrlOrCmdKey: true });
    });

    it("never makes context-dependent keys remappable", () => {
        for (const s of buildCatalog(ctx).filter((s) => s.remappable)) {
            expect(s.combo.ctrlOrCmdKey || s.combo.ctrlKey || s.combo.altKey || s.combo.metaKey || s.combo.shiftKey).toBeTruthy();
            expect(s.combo.key).not.toBe("digits");
        }
    });
});
