import { afterEach, describe, expect, it, vi } from "vitest";

import { applyState, clearState, computeState } from "./detect";

/** Fakes matchMedia for a viewport: `w`×`h` CSS px with a fine or coarse primary pointer. */
function viewport(w: number, h: number, coarse: boolean): void {
    vi.stubGlobal("matchMedia", (q: string) => {
        let matches = false;
        let m: RegExpExecArray | null;
        if ((m = /max-width: (\d+)px/.exec(q))) matches = w <= Number(m[1]);
        else if ((m = /max-height: (\d+)px/.exec(q))) matches = h <= Number(m[1]);
        else if (q.includes("pointer: coarse")) matches = coarse;
        else if (q.includes("orientation: portrait")) matches = h >= w;
        return { matches, media: q, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList;
    });
    vi.stubGlobal("innerWidth", w);
    vi.stubGlobal("screen", { width: Math.min(w, h), height: Math.max(w, h) });
}

describe("detect", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        clearState();
    });

    it("treats a desktop window as desktop", () => {
        viewport(1440, 900, false);
        expect(computeState({ maxWidth: 768, force: null })).toMatchObject({ mobile: false, compact: false, pointer: "fine" });
    });

    it("treats a narrow window or a phone as compact", () => {
        viewport(390, 844, true);
        expect(computeState({ maxWidth: 768, force: null })).toMatchObject({ mobile: true, compact: true, reasons: ["narrow", "coarse"], orientation: "portrait" });
        viewport(844, 390, true);
        expect(computeState({ maxWidth: 768, force: null })).toMatchObject({ mobile: true, compact: true, orientation: "landscape" });
    });

    it("keeps a tablet multi-pane", () => {
        viewport(1024, 1366, true);
        expect(computeState({ maxWidth: 768, force: null })).toMatchObject({ mobile: true, compact: false });
    });

    it("follows force on/off", () => {
        viewport(1440, 900, false);
        expect(computeState({ maxWidth: 768, force: "on" })).toMatchObject({ mobile: true, compact: true });
        viewport(390, 844, true);
        expect(computeState({ maxWidth: 768, force: "off" }).mobile).toBe(false);
    });

    it("writes and clears the html attributes", () => {
        viewport(390, 844, true);
        applyState(computeState({ maxWidth: 768, force: null }));
        const html = document.documentElement;
        expect(html.getAttribute("data-mt-mobile")).toBe("narrow coarse");
        expect(html.hasAttribute("data-mt-compact")).toBe(true);
        clearState();
        expect(html.hasAttribute("data-mt-mobile")).toBe(false);
    });
});
