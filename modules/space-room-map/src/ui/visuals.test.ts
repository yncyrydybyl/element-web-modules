import { describe, expect, it } from "vitest";

import { zoomPath } from "./camera";
import { mix, parseColour, withAlpha } from "./colour";

describe("colour", () => {
    it("parses theme tokens and mixes them", () => {
        expect(parseColour("#fff")).toEqual([255, 255, 255]);
        expect(parseColour("#0467ddcc")).toEqual([4, 103, 221]);
        expect(parseColour("rgb(1, 2, 3)")).toEqual([1, 2, 3]);
        expect(parseColour("rgba(1 2 3 / 50%)")).toEqual([1, 2, 3]);
        expect(parseColour("var(--x)")).toBeUndefined();
        expect(mix("#000000", "#ffffff", 0.25)).toBe("rgba(191, 191, 191, 1)");
        expect(withAlpha("#ff0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)");
        // Unparseable input passes through rather than breaking the map.
        expect(mix("var(--x)", "#fff", 0.5)).toBe("var(--x)");
    });
});

describe("zoomPath", () => {
    it("starts and ends at the given views and zooms out on the way between far points", () => {
        const path = zoomPath([0.1, 0.1, 0.2], [0.9, 0.8, 0.2]);
        expect(path.at(0).map((v) => +v.toFixed(6))).toEqual([0.1, 0.1, 0.2]);
        expect(path.at(1).map((v) => +v.toFixed(6))).toEqual([0.9, 0.8, 0.2]);
        expect(path.at(0.5)[2]).toBeGreaterThan(0.2);
        expect(path.duration).toBeGreaterThan(0);
    });

    it("only zooms when the centre stays put", () => {
        const path = zoomPath([0.5, 0.5, 1], [0.5, 0.5, 0.1]);
        expect(path.at(1)[2]).toBeCloseTo(0.1);
        expect(path.at(0.5)[0]).toBe(0.5);
    });
});
