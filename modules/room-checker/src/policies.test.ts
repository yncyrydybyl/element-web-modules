import { describe, expect, it } from "vitest";

import { check, checkRoom, creatorsOf, DEFAULT_POLICIES, POLICY_IDS, sanitisePolicies, topicOf, type CheckedRoom } from "./policies";
import { goodState, ME } from "./tests/fakeClient";

const SPACE = "!space:x";

function room(state: Record<string, Record<string, unknown>>): CheckedRoom {
    return { id: "!r:x", parentSpace: SPACE, state: (type, key = "") => state[key ? `${type}|${key}` : type] };
}

function without(...types: string[]) {
    const s = goodState(SPACE, "Team");
    for (const t of types) delete s[t];
    return s;
}

describe("policies", () => {
    it("has ten, and a well-kept room passes every default", () => {
        expect(POLICY_IDS).toHaveLength(10);
        const report = checkRoom(room(goodState(SPACE, "Team")), { ...DEFAULT_POLICIES, address: { ...DEFAULT_POLICIES.address, enabled: false } });
        expect([...report.results.values()].every((r) => r.pass)).toBe(true);
        expect(report.errors + report.warnings).toBe(0);
    });

    it("finds what's missing, counted by severity", () => {
        const r = room(without("m.room.name", "m.room.topic", "m.room.avatar", "m.room.encryption", `m.space.parent|${SPACE}`));
        const report = checkRoom(r, DEFAULT_POLICIES);
        expect(report.results.get("name")).toEqual({ pass: false, detail: { key: "name_missing", vars: undefined } });
        // name, encryption are errors; topic, avatar, space_parent warnings.
        expect(report.errors).toBe(2);
        expect(report.warnings).toBe(3);
        expect(report.results.has("address")).toBe(false);
    });

    it("checks the parameters", () => {
        const s = goodState(SPACE, "team chat");
        s["m.room.topic"] = { topic: "short" };
        s["m.room.join_rules"] = { join_rule: "public" };
        s["m.room.history_visibility"] = { history_visibility: "world_readable" };
        s["m.room.guest_access"] = { guest_access: "can_join" };
        s["m.room.power_levels"] = { users: { [ME]: 100, "@gone:x": 100 } };
        const r = room(s);
        expect(check("name", r, { enabled: true, severity: "error", pattern: "^[A-Z]" }).detail?.key).toBe("name_pattern");
        expect(check("topic", r, DEFAULT_POLICIES.topic).detail).toEqual({ key: "topic_short", vars: { min: "10" } });
        expect(check("join_rule", r, DEFAULT_POLICIES.join_rule).detail?.vars).toEqual({ value: "public" });
        expect(check("history_visibility", r, DEFAULT_POLICIES.history_visibility).pass).toBe(false);
        expect(check("guest_access", r, DEFAULT_POLICIES.guest_access).pass).toBe(false);
        // The admin who left doesn't count.
        expect(check("admins", r, DEFAULT_POLICIES.admins).detail?.vars).toEqual({ count: "1", min: "2" });
        expect(check("address", r, DEFAULT_POLICIES.address).pass).toBe(false);
        // Room version 12: the creator is an admin without being in the power levels.
        expect(check("admins", { ...r, creators: ["@c:x"] }, DEFAULT_POLICIES.admins).pass).toBe(false);
        s["m.room.member|@c:x"] = { membership: "join" };
        expect(check("admins", { ...r, creators: ["@c:x"] }, DEFAULT_POLICIES.admins).pass).toBe(true);
        expect(creatorsOf("12", "@c:x", ["@d:x", 3])).toEqual(["@c:x", "@d:x"]);
        expect(creatorsOf("11", "@c:x", [])).toEqual([]);
        expect(creatorsOf("org.example.custom", "@c:x", [])).toEqual([]);
        expect(check("address", room({ ...s, "m.room.canonical_alias": { alias: "#t:x" } }), DEFAULT_POLICIES.address).pass).toBe(true);
    });

    it("reads both topic formats", () => {
        expect(topicOf({ topic: " Hi " })).toBe("Hi");
        expect(topicOf({ "m.topic": { "m.text": [{ body: "<b>x</b>", mimetype: "text/html" }, { body: "plain" }] } })).toBe("plain");
        expect(topicOf(undefined)).toBe("");
    });

    it("sanitises what a space stores", () => {
        expect(sanitisePolicies(undefined)).toEqual(DEFAULT_POLICIES);
        const p = sanitisePolicies({
            policies: {
                name: { enabled: false, pattern: "([" },
                topic: { minLength: -3, severity: "error" },
                join_rule: { allowed: ["public", "nonsense", "invite"] },
                history_visibility: { allowed: [] },
                admins: { min: 3 },
            },
        });
        expect(p.name).toEqual({ enabled: false, severity: "error", pattern: "" });
        expect(p.topic).toEqual({ enabled: true, severity: "error", minLength: 10 });
        // In the offered order, unknown values dropped.
        expect(p.join_rule.allowed).toEqual(["invite", "public"]);
        expect(p.history_visibility.allowed).toEqual(DEFAULT_POLICIES.history_visibility.allowed);
        expect(p.admins.min).toBe(3);
    });
});
