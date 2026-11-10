import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { interpolate, makeTranslate, P, translations } from "./i18n";

const table = translations as Record<string, { en: string; de: string }>;

function sources(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
        d.isDirectory() ? sources(join(dir, d.name)) : /\.tsx?$/.test(d.name) && !d.name.includes(".test.") ? [join(dir, d.name)] : [],
    );
}

describe("translations", () => {
    it("never contain | in a key (Element's path separator)", () => {
        expect(Object.keys(table).filter((k) => k.includes("|"))).toEqual([]);
    });

    it("cover every literal key the code uses, in English and German, with the same placeholders", () => {
        const used = new Set<string>();
        for (const file of sources(join(__dirname))) {
            for (const m of readFileSync(file, "utf8").matchAll(/\$\{P\}([a-z_]+)`/g)) used.add(P + m[1]);
        }
        expect(used.size).toBeGreaterThan(40);
        for (const key of used) {
            // Dynamic prefixes (`${P}step_${s}`, `${P}${body}`) end in "_" or are empty.
            if (key.endsWith("_") || key === P) continue;
            expect(table[key], key).toBeDefined();
        }
        for (const [key, { en, de }] of Object.entries(table)) {
            const vars = (s: string): string[] => [...s.matchAll(/%\((\w+)\)s/g)].map((m) => m[1]).sort();
            expect(vars(de), key).toEqual(vars(en));
        }
    });

    it("follows Element's language unless the admin forces one", () => {
        const element = (key: string): string => `element:${key}`;
        expect(makeTranslate(element)(`${P}close`)).toBe(`element:${P}close`);
        const de = makeTranslate(element, "de");
        expect(de(`${P}close`)).toBe("Schließen");
        expect(de(`${P}step_of`, { n: 2, total: 4 })).toBe("Schritt 2 von 4");
        expect(de("common|unknown")).toBe("element:common|unknown");
    });

    it("interpolates %(name)s", () => {
        expect(interpolate("Hi %(a)s and %(b)s", { a: 1 })).toBe("Hi 1 and %(b)s");
    });
});
