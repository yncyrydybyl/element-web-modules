// The shipped theme families must pass the same validation as the production build (build/lib.mjs).
import { describe, expect, it } from "vitest";

// @ts-expect-error plain JS build helper without types
import { formatProblems, loadAll } from "../build/lib.mjs";

describe("theme families", () => {
    it("validate without errors", () => {
        const loaded = loadAll() as { families: { family: string }[]; problems: { level: string }[] };
        const errors = loaded.problems.filter((p) => p.level === "error");
        expect(formatProblems(errors)).toBe("");
        expect(loaded.families.length).toBeGreaterThan(5);
    });
});
