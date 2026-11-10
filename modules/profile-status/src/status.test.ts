import { describe, expect, it } from "vitest";

import {
    AUTO_TEXT_KEY,
    AVAILABILITY_KEY,
    buildStatusContent,
    CALL_FIELD,
    clearAfterTs,
    EXPIRES_KEY,
    inputFromStatus,
    OOO_UNTIL_KEY,
    parseCall,
    parseProfile,
    parseStatus,
    present,
    STATUS_FIELD,
    StatusInputError,
    truncateBytes,
    type Labels,
} from "./status";

const labels: Labels = { availability: (a) => `label:${a}`, oooBack: (d) => `back:${d}` };
// Tuesday 10 Nov 2026, 14:30 local time
const NOW = new Date(2026, 10, 10, 14, 30);

describe("buildStatusContent", () => {
    it("writes MSC4426's emoji + text and keeps the extras in namespaced keys", () => {
        const c = buildStatusContent({ availability: "busy", text: " Working from Munich ", clearAfter: "today" }, labels, NOW);
        expect(c).toEqual({
            emoji: "🔴",
            text: "Working from Munich",
            [AVAILABILITY_KEY]: "busy",
            [EXPIRES_KEY]: new Date(2026, 10, 11).getTime(),
        });
    });

    it("fills the required text with the availability's label and marks it", () => {
        const c = buildStatusContent({ availability: "dnd", text: "", clearAfter: "never" }, labels, NOW);
        expect(c).toEqual({ emoji: "⛔", text: "label:dnd", [AVAILABILITY_KEY]: "dnd", [AUTO_TEXT_KEY]: true });
    });

    it("deletes the field for Available without a text, like Teams' default", () => {
        expect(buildStatusContent({ availability: "available", text: "  ", clearAfter: "1h" }, labels, NOW)).toBeNull();
        expect(buildStatusContent({ availability: "available", text: "Hi", clearAfter: "never" }, labels, NOW)).toMatchObject({ emoji: "🟢", text: "Hi" });
    });

    it("out of office: return date, expiry at the start of that day, default text", () => {
        const c = buildStatusContent({ availability: "ooo", text: "", clearAfter: "1h", oooUntil: "2026-11-16" }, labels, NOW);
        expect(c).toEqual({
            emoji: "🌴",
            text: "back:2026-11-16",
            [AVAILABILITY_KEY]: "ooo",
            [AUTO_TEXT_KEY]: true,
            [OOO_UNTIL_KEY]: "2026-11-16",
            [EXPIRES_KEY]: new Date(2026, 10, 16).getTime(),
        });
    });

    it("rejects a return date that isn't in the future and texts over 256 bytes", () => {
        expect(() => buildStatusContent({ availability: "ooo", text: "", clearAfter: "never", oooUntil: "2026-11-10" }, labels, NOW)).toThrow(StatusInputError);
        expect(() => buildStatusContent({ availability: "busy", text: "ü".repeat(129), clearAfter: "never" }, labels, NOW)).toThrow(StatusInputError);
        expect(() => buildStatusContent({ availability: "busy", text: "ü".repeat(128), clearAfter: "never" }, labels, NOW)).not.toThrow();
    });
});

describe("clearAfterTs", () => {
    it("computes the end of the hour, day and week", () => {
        expect(clearAfterTs("never", NOW)).toBeUndefined();
        expect(clearAfterTs("1h", NOW)).toBe(NOW.getTime() + 3600_000);
        expect(clearAfterTs("today", NOW)).toBe(new Date(2026, 10, 11).getTime());
        expect(clearAfterTs("week", NOW)).toBe(new Date(2026, 10, 16).getTime()); // next Monday
        expect(clearAfterTs("week", new Date(2026, 10, 15, 22))).toBe(new Date(2026, 10, 16).getTime()); // Sunday
        expect(clearAfterTs("week", new Date(2026, 10, 16, 8))).toBe(new Date(2026, 10, 23).getTime()); // Monday
    });
});

describe("parsing", () => {
    it("accepts statuses from other clients (no extras) and validates like Element", () => {
        expect(parseStatus({ emoji: "🌴", text: "On holiday" })).toEqual({ emoji: "🌴", text: "On holiday", autoText: false, availability: undefined, expiresTs: undefined, oooUntil: undefined });
        expect(parseStatus({ emoji: "", text: "x" })).toBeUndefined();
        expect(parseStatus({ emoji: "x" })).toBeUndefined();
        expect(parseStatus({ emoji: "🌴", text: "x", [AVAILABILITY_KEY]: "sleeping" })?.availability).toBeUndefined();
    });

    it("shows only the first grapheme of the emoji (MSC4426 impersonation note)", () => {
        expect(parseStatus({ emoji: "👩‍🚒Smith", text: "x" })?.emoji).toBe("👩‍🚒");
    });

    it("reads m.call in seconds (MSC4426) and milliseconds (Element)", () => {
        expect(parseCall({ call_joined_ts: 1770140640 })).toBe(1770140640000);
        expect(parseCall({ call_joined_ts: 1770140640123 })).toBe(1770140640123);
        expect(parseCall({ call_joined_ts: 0 })).toBeUndefined();
        expect(parseCall({})).toBeUndefined();
    });

    it("reads a whole profile, falling back to the stable names", () => {
        const info = parseProfile({
            "m.status": { emoji: "🏃", text: "Dentist" },
            [CALL_FIELD]: { call_joined_ts: 1770140640 },
            "de.datanauten.job_title": " Head of Support ",
            "de.datanauten.phone": "",
            "de.datanauten.department": 42,
        });
        expect(info.status?.text).toBe("Dentist");
        expect(info.callSince).toBe(1770140640000);
        expect(info.card).toEqual({ job_title: "Head of Support" });
        expect(parseProfile({ [STATUS_FIELD]: { emoji: "🔴", text: "a" }, "m.status": { emoji: "🟢", text: "b" } }).status?.text).toBe("a");
    });

    it("truncates by bytes without splitting characters", () => {
        expect(truncateBytes("aü", 2)).toBe("a");
        expect(truncateBytes("abc", 3)).toBe("abc");
    });
});

describe("present", () => {
    const busy = parseStatus({ emoji: "🔴", text: "Workshop", [AVAILABILITY_KEY]: "busy", [EXPIRES_KEY]: NOW.getTime() + 1000 })!;

    it("hides expired statuses", () => {
        expect(present({ card: {}, status: busy }, NOW.getTime())?.availability).toBe("busy");
        expect(present({ card: {}, status: busy }, NOW.getTime() + 1000)).toBeUndefined();
    });

    it("shows a call as In a call, keeping the typed text, unless DND or out of office", () => {
        expect(present({ card: {}, status: busy, callSince: 5 }, NOW.getTime())).toMatchObject({ availability: "in_call", text: "Workshop", callSince: 5 });
        const dnd = parseStatus({ emoji: "⛔", text: "x", [AVAILABILITY_KEY]: "dnd" })!;
        expect(present({ card: {}, status: dnd, callSince: 5 }, NOW.getTime())?.availability).toBe("dnd");
        expect(present({ card: {}, callSince: 5 }, NOW.getTime())?.availability).toBe("in_call");
    });

    it("doesn't repeat an automatic text as a message", () => {
        const auto = parseStatus({ emoji: "⛔", text: "Nicht stören", [AVAILABILITY_KEY]: "dnd", [AUTO_TEXT_KEY]: true })!;
        expect(present({ card: {}, status: auto }, 0)?.text).toBeUndefined();
        expect(inputFromStatus(auto)).toEqual({ availability: "dnd", text: "", clearAfter: "never", oooUntil: undefined });
    });
});
