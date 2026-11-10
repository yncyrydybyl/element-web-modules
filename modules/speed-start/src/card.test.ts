import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildFacts, CARD_CLASS, FACT_MS, ProgressCard, relative } from "./card";
import type { Translate } from "./i18n";
import type { Stats } from "./stats";

// Echoes the key's last part and the variables, so the tests can see what was picked.
const t: Translate = (key, vars) => `${key.replace("datanauten_speed_start_", "")}${vars ? " " + JSON.stringify(vars) : ""}`;
const stats: Stats = { format: 1, userId: "@me:a.org", savedAt: 0, server: "a.org", rooms: 8, spaces: 2, dms: 3, encrypted: 5, unread: 1, people: 40, servers: 6 };
const now = (): number => 3 * 3_600_000;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const card = (o: Partial<ConstructorParameters<typeof ProgressCard>[0]> = {}): ProgressCard =>
    new ProgressCard({ t, language: "en", stats, avatars: [], clickable: true, random: () => 0, now, ...o });
const q = (c: ProgressCard, name: string): HTMLElement => c.el.querySelector<HTMLElement>(`.${CARD_CLASS}_${name}`)!;

describe("ProgressCard", () => {
    it("says what each step is doing and ticks the steps off", () => {
        const c = card();
        c.update({ stage: "keys", rooms: 0, server: "a.org" });
        expect(q(c, "title").textContent).toBe("keys_title_1 {\"server\":\"a.org\"}");
        expect([...c.el.querySelectorAll("li")].map((li) => li.className)).toEqual([
            `${CARD_CLASS}_done`,
            `${CARD_CLASS}_done`,
            `${CARD_CLASS}_now`,
            "",
        ]);
        expect(q(c, "scene").dataset.stage).toBe("keys");
    });

    it("counts the rooms against last time's total and fills the shelf with them", () => {
        const c = card();
        expect(q(c, "shelf").children).toHaveLength(10);
        c.update({ stage: "rooms", rooms: 5 });
        expect(q(c, "count").textContent).toBe('rooms_count {"done":"5","total":"10"}');
        expect(q(c, "shelf").querySelectorAll(`.${CARD_CLASS}_in`)).toHaveLength(5);
        c.update({ stage: "ready", rooms: 10 });
        expect(q(c, "shelf").querySelectorAll(`.${CARD_CLASS}_in`)).toHaveLength(10);
        expect(q(c, "fill").style.transform).toBe("scaleX(1.000)");
    });

    it("counts without a total when there are no stats", () => {
        const c = card({ stats: null });
        c.update({ stage: "download", rooms: 1, server: "a.org" });
        expect(q(c, "count").textContent).toBe('rooms_count_open_one {"done":"1"}');
        expect(q(c, "server").textContent).toBe("a.org");
    });

    it("rotates the facts, starting with one about the account", () => {
        const c = card();
        const first = q(c, "fact").textContent!;
        expect(first).toMatch(/^fact_(rooms|people|servers|encrypted|dms|unread|last_seen|home)/);
        c.start();
        vi.advanceTimersByTime(FACT_MS);
        expect(q(c, "fact").textContent).not.toBe(first);
        c.dispose();
    });

    it("sends a dot down the line for a request and cleans it up", () => {
        const c = card();
        c.pulse();
        expect(q(c, "pulses").children).toHaveLength(1);
        vi.advanceTimersByTime(1_500);
        expect(q(c, "pulses").children).toHaveLength(0);
    });
});

describe("buildFacts", () => {
    it("uses the account's numbers and leaves out what doesn't apply", () => {
        const { own, general } = buildFacts({ t, language: "en", stats: { ...stats, spaces: 0, unread: 0 }, avatars: [], clickable: false, now });
        expect(own).toContain('fact_rooms_other {"rooms":"8"}');
        expect(own).toContain('fact_last_seen {"ago":"3 hours ago"}');
        expect(own.some((f) => f.startsWith("fact_unread"))).toBe(false);
        expect(general).not.toContain("fact_click");
    });
});

describe("relative", () => {
    it("says nothing for under a minute", () => {
        expect(relative(30_000, "en")).toBe("");
        expect(relative(2 * 86_400_000, "de")).toBe("vorgestern");
    });
});
