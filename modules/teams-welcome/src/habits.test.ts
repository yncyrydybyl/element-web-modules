import { describe, expect, it } from "vitest";

import { CHEAT_SHEET, formatKeys, resolveCheatSheet, SHORTCUTS } from "./habits";
import { translations } from "./i18n";

const table = translations as Record<string, { en: string; de: string }>;

describe("cheat sheet", () => {
    it("shows stock Element's answer when no sibling is loaded", () => {
        const rows = resolveCheatSheet(() => false);
        expect(rows.every((r) => r.module === undefined && r.elementKey.endsWith("_element"))).toBe(true);
    });

    it("prefers the first loaded sibling", () => {
        const rows = resolveCheatSheet((id) => id === "teamwork");
        expect(rows.find((r) => r.id === "activity")).toMatchObject({ module: "teamwork", elementKey: "datanauten_teamswelcome_cs_activity_teamwork" });
        expect(rows.find((r) => r.id === "schedule")?.module).toBe("teamwork");
        expect(rows.find((r) => r.id === "files")?.module).toBeUndefined();
        const both = resolveCheatSheet((id) => id === "teamwork" || id === "activity");
        expect(both.find((r) => r.id === "activity")?.module).toBe("activity");
    });

    it("has English and German text for every row and every sibling variant", () => {
        for (const e of CHEAT_SHEET) {
            for (const variant of ["teams", "element", ...(e.via ?? [])]) {
                const key = `datanauten_teamswelcome_cs_${e.id}_${variant}`;
                expect(table[key]?.en, key).toBeTruthy();
                expect(table[key]?.de, key).toBeTruthy();
            }
        }
        for (const s of SHORTCUTS) expect(table[s.labelKey]?.de, s.labelKey).toBeTruthy();
    });
});

describe("formatKeys", () => {
    it("writes Ctrl/Alt on Windows and Linux, ⌘/⌥ on macOS", () => {
        expect(formatKeys("Mod+Shift+U", false)).toBe("Ctrl+Shift+U");
        expect(formatKeys("Mod+Shift+U", true)).toBe("⌘+⇧+U");
        expect(formatKeys("Alt+↑ / Alt+↓", true)).toBe("⌥+↑ / ⌥+↓");
    });
});
