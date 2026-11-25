/**
 * Daylight phases by local clock (CONTRACT §6). `?tl_phase=<name>` (not persisted) or
 * `localStorage["tl.forcePhase"]` force a phase.
 */
import type { SchedulePhase, Variant } from "./types";
import { getParam, lsGet } from "./params";

export const FORCE_PHASE_KEY = "tl.forcePhase";

export function minutesOf(hhmm: string): number {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
    if (!m) return NaN;
    return Number(m[1]) * 60 + Number(m[2]);
}

function sorted(schedule: SchedulePhase[]): SchedulePhase[] {
    return schedule.filter((p) => p && typeof p.phase === "string" && !isNaN(minutesOf(p.from))).sort((a, b) => minutesOf(a.from) - minutesOf(b.from));
}

/** The phase active at `now` (local time); before the first boundary, the last phase of the day still applies. */
export function phaseAt(schedule: SchedulePhase[], now: Date): string | null {
    const s = sorted(schedule);
    if (!s.length) return null;
    const mins = now.getHours() * 60 + now.getMinutes();
    let current = s[s.length - 1];
    for (const p of s) if (minutesOf(p.from) <= mins) current = p;
    return current.phase;
}

/** Milliseconds until the next boundary (at least 1 s). */
export function msToNextBoundary(schedule: SchedulePhase[], now: Date): number {
    const s = sorted(schedule);
    if (!s.length) return 3_600_000;
    const secs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const bounds = s.map((p) => minutesOf(p.from) * 60);
    const next = bounds.find((b) => b > secs) ?? bounds[0] + 86400;
    return Math.max(1000, (next - secs) * 1000 - now.getMilliseconds() + 500);
}

export function forcedPhase(): string | null {
    return getParam("tl_phase") || lsGet(FORCE_PHASE_KEY) || null;
}

/** Phase for a variant right now: forced phase (if the variant has it) or the clock. */
export function currentPhase(variant: Variant | null, now = new Date()): string | null {
    if (!variant || variant.mode !== "daylight" || !Array.isArray(variant.schedule) || !variant.schedule.length) return null;
    const forced = forcedPhase();
    if (forced && variant.schedule.some((p) => p.phase === forced)) return forced;
    return phaseAt(variant.schedule, now);
}

export class Scheduler {
    private timer?: number;
    private interval?: number;

    public constructor(
        private readonly getVariant: () => Variant | null,
        private readonly onPhase: (phase: string | null) => void,
    ) {}

    public start(): void {
        document.addEventListener("visibilitychange", this.tick);
        window.addEventListener("storage", this.onStorage);
        // Safety net for suspended laptops and clock changes.
        this.interval = window.setInterval(this.tick, 60_000);
        this.reschedule();
    }

    public stop(): void {
        document.removeEventListener("visibilitychange", this.tick);
        window.removeEventListener("storage", this.onStorage);
        window.clearInterval(this.interval);
        window.clearTimeout(this.timer);
    }

    /** Call after the variant changed. */
    public reschedule(): void {
        window.clearTimeout(this.timer);
        const v = this.getVariant();
        if (!v || v.mode !== "daylight" || !v.schedule?.length) return;
        this.timer = window.setTimeout(this.tick, msToNextBoundary(v.schedule, new Date()));
    }

    public tick = (): void => {
        if (document.visibilityState === "hidden") return;
        this.onPhase(currentPhase(this.getVariant()));
        this.reschedule();
    };

    private onStorage = (e: StorageEvent): void => {
        if (e.key === FORCE_PHASE_KEY) this.tick();
    };
}
