import { afterEach, describe, expect, it } from "vitest";

import { currentPhase, FORCE_PHASE_KEY, minutesOf, msToNextBoundary, phaseAt } from "./scheduler";
import type { Variant } from "./types";

const schedule = [
    { from: "21:00", phase: "night" },
    { from: "07:00", phase: "day" },
    { from: "18:30", phase: "evening" },
];
const at = (h: number, m = 0, s = 0): Date => new Date(2026, 10, 25, h, m, s);

describe("scheduler", () => {
    afterEach(() => localStorage.clear());

    it("parses HH:MM", () => {
        expect(minutesOf("07:30")).toBe(450);
        expect(minutesOf(" 7:05 ")).toBe(425);
        expect(minutesOf("7h")).toBeNaN();
    });

    it("picks the phase by local time, in any manifest order", () => {
        expect(phaseAt(schedule, at(7))).toBe("day");
        expect(phaseAt(schedule, at(18, 29))).toBe("day");
        expect(phaseAt(schedule, at(18, 30))).toBe("evening");
        expect(phaseAt(schedule, at(23))).toBe("night");
        // before the first boundary of the day, the last phase still applies
        expect(phaseAt(schedule, at(3))).toBe("night");
        expect(phaseAt([], at(3))).toBeNull();
    });

    it("times the next boundary, wrapping past midnight", () => {
        expect(msToNextBoundary(schedule, at(6, 59, 0))).toBe(60_500);
        expect(msToNextBoundary(schedule, at(22))).toBe(9 * 3600_000 + 500);
        expect(msToNextBoundary([], at(1))).toBe(3_600_000);
    });

    it("honours a forced phase only if the variant has it", () => {
        const v = { id: "x", mode: "daylight", schedule } as unknown as Variant;
        localStorage.setItem(FORCE_PHASE_KEY, "evening");
        expect(currentPhase(v, at(9))).toBe("evening");
        localStorage.setItem(FORCE_PHASE_KEY, "dusk");
        expect(currentPhase(v, at(9))).toBe("day");
        expect(currentPhase({ ...v, mode: "dark" } as Variant, at(9))).toBeNull();
    });
});
