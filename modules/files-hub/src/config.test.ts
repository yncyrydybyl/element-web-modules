import { describe, expect, it } from "vitest";

import { parseConfig } from "./config";

describe("parseConfig", () => {
    it("has defaults", () => {
        expect(parseConfig(undefined)).toEqual({ maxAgeDays: 90, maxEventsPerRoom: 500, concurrency: 3, preview_max_mb: 25, cloud_link_cards: true });
    });

    it("reads overrides", () => {
        expect(parseConfig({ max_age_days: 30, max_events_per_room: 200, concurrency: 1, preview_max_mb: 5, cloud_link_cards: false })).toEqual({
            maxAgeDays: 30, maxEventsPerRoom: 200, concurrency: 1, preview_max_mb: 5, cloud_link_cards: false,
        });
    });

    it("rejects nonsense", () => {
        expect(() => parseConfig("x")).toThrow();
        expect(() => parseConfig({ max_age_days: -1 })).toThrow(/max_age_days/);
        expect(() => parseConfig({ concurrency: "3" })).toThrow(/concurrency/);
        expect(() => parseConfig({ cloud_link_cards: "yes" })).toThrow(/cloud_link_cards/);
    });
});
