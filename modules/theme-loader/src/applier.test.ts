import { describe, expect, it } from "vitest";

import { absolutiseUrls, cssString, fontSheet, tokenSheet } from "./applier";
import type { Variant } from "./types";

describe("applier helpers", () => {
    it("makes relative url()s absolute and leaves the rest alone", () => {
        const css = `a{background:url(img/a.png)} b{background:url( "../b.svg" )} c{background:url(data:image/png;base64,xx)} d{mask:url(#m)}`;
        const out = absolutiseUrls(css, "https://e.test/m/theme-loader/teams--x.css");
        expect(out).toContain('url("https://e.test/m/theme-loader/img/a.png")');
        expect(out).toContain('url("https://e.test/m/b.svg")');
        expect(out).toContain("url(data:image/png;base64,xx)");
        expect(out).toContain("url(#m)");
    });

    it("quotes CSS strings safely", () => {
        expect(cssString('a"b\\c\nd')).toBe('"a\\"b\\\\c d"');
    });

    it("writes valid tokens, drops unsafe ones and forces font tokens", () => {
        const v = {
            id: "t-1",
            tokens: { "--cpd-color-bg": "#fff", "--bad name": "x", "--evil": "red;}body{display:none", "--cpd-font-family-sans": "Comic" },
        } as unknown as Variant;
        const sheet = tokenSheet(v);
        expect(sheet).toContain('html[data-tl-theme="t-1"]');
        expect(sheet).toContain("--cpd-color-bg: #fff;");
        expect(sheet).toContain("--cpd-font-family-sans: Comic !important;");
        expect(sheet).not.toContain("evil");
        expect(sheet).not.toContain("bad name");
        expect(tokenSheet({ id: "e", tokens: {} } as unknown as Variant)).toBe("");
    });

    it("builds @font-face rules with local() first and a format hint", () => {
        const css = fontSheet([{ family: "Selawik", url: "teams--selawik.woff2?v=1", local: ["Segoe UI"] }], "https://e.test/m/");
        expect(css).toContain('src: local("Segoe UI"), url("https://e.test/m/teams--selawik.woff2?v=1") format("woff2");');
        expect(fontSheet([{ family: "Nothing" }], "https://e.test/")).toBe("");
    });
});
