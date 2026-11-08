/**
 * The room policies: what a space expects of its rooms, and the checks against a room's state.
 *
 * A space keeps its policies in one state event (`POLICY_TYPE`, state key ""), so everyone in the
 * space sees the same rules and whoever may send that event can change them. A space without the
 * event uses the defaults.
 */

export const POLICY_TYPE = "de.datanauten.room_checker.policies";

export const POLICY_IDS = [
    "name",
    "topic",
    "avatar",
    "encryption",
    "join_rule",
    "history_visibility",
    "guest_access",
    "address",
    "admins",
    "space_parent",
] as const;
export type PolicyId = (typeof POLICY_IDS)[number];

export type Severity = "error" | "warning";

export interface PolicyConfig {
    enabled: boolean;
    severity: Severity;
    /** name: a regular expression the name must match ("" for any name). */
    pattern?: string;
    /** topic: the shortest topic that counts. */
    minLength?: number;
    /** join_rule, history_visibility: the values that pass. */
    allowed?: string[];
    /** admins: how many joined admins a room needs at least. */
    min?: number;
}

export type PolicySet = Record<PolicyId, PolicyConfig>;

/** The values a policy with `allowed` lets the admin choose from, in the order they're offered. */
export const ALLOWED_OPTIONS: Partial<Record<PolicyId, string[]>> = {
    join_rule: ["restricted", "invite", "knock", "knock_restricted", "public"],
    history_visibility: ["joined", "invited", "shared", "world_readable"],
};

export const DEFAULT_POLICIES: PolicySet = {
    name: { enabled: true, severity: "error", pattern: "" },
    topic: { enabled: true, severity: "warning", minLength: 10 },
    avatar: { enabled: true, severity: "warning" },
    encryption: { enabled: true, severity: "error" },
    join_rule: { enabled: true, severity: "error", allowed: ["restricted", "invite", "knock_restricted"] },
    history_visibility: { enabled: true, severity: "warning", allowed: ["joined", "invited", "shared"] },
    guest_access: { enabled: true, severity: "error" },
    address: { enabled: false, severity: "warning" },
    admins: { enabled: true, severity: "warning", min: 2 },
    space_parent: { enabled: true, severity: "warning" },
};

/** The policies from a space's state event: unknown fields dropped, missing ones from the defaults. */
export function sanitisePolicies(value: unknown): PolicySet {
    const raw = (value && typeof value === "object" ? (value as { policies?: unknown }).policies : undefined) ?? {};
    const out = {} as PolicySet;
    for (const id of POLICY_IDS) {
        const def = DEFAULT_POLICIES[id];
        const r = (raw as Record<string, unknown>)[id];
        const c = (r && typeof r === "object" ? r : {}) as Partial<Record<keyof PolicyConfig, unknown>>;
        const p: PolicyConfig = {
            enabled: typeof c.enabled === "boolean" ? c.enabled : def.enabled,
            severity: c.severity === "error" || c.severity === "warning" ? c.severity : def.severity,
        };
        if (def.pattern !== undefined) p.pattern = typeof c.pattern === "string" && validPattern(c.pattern) ? c.pattern : def.pattern;
        if (def.minLength !== undefined) p.minLength = wholeNumber(c.minLength, 0, 1000) ?? def.minLength;
        if (def.min !== undefined) p.min = wholeNumber(c.min, 0, 100) ?? def.min;
        if (def.allowed !== undefined) {
            const options = ALLOWED_OPTIONS[id] ?? [];
            const allowed = Array.isArray(c.allowed) ? options.filter((o) => (c.allowed as unknown[]).includes(o)) : undefined;
            p.allowed = allowed?.length ? allowed : def.allowed;
        }
        out[id] = p;
    }
    return out;
}

/** A failure a space's admins accepted for one room, e.g. a lobby that is public on purpose. */
export interface Exception {
    reason: string;
    by: string;
    at: number;
}

/** Room ID → policy → exception. */
export type Exceptions = Record<string, Partial<Record<PolicyId, Exception>>>;

/** The exceptions from a space's state event; malformed ones are dropped. */
export function sanitiseExceptions(value: unknown): Exceptions {
    const raw = value && typeof value === "object" ? (value as { exceptions?: unknown }).exceptions : undefined;
    const out: Exceptions = {};
    if (!raw || typeof raw !== "object") return out;
    for (const [roomId, byPolicy] of Object.entries(raw as Record<string, unknown>)) {
        if (!roomId.startsWith("!") || !byPolicy || typeof byPolicy !== "object") continue;
        for (const id of POLICY_IDS) {
            const e = (byPolicy as Record<string, unknown>)[id] as Partial<Record<keyof Exception, unknown>> | undefined;
            if (!e || typeof e !== "object" || typeof e.reason !== "string" || typeof e.by !== "string" || typeof e.at !== "number") continue;
            (out[roomId] ??= {})[id] = { reason: e.reason, by: e.by, at: e.at };
        }
    }
    return out;
}

/** The state event's content: the policies and the exceptions. */
export function policyContent(policies: PolicySet, exceptions: Exceptions): { version: 1; policies: PolicySet; exceptions: Exceptions } {
    return { version: 1, policies, exceptions };
}

/** The exceptions with one added (or, without `exception`, removed). */
export function withException(exceptions: Exceptions, roomId: string, id: PolicyId, exception?: Exception): Exceptions {
    const room = { ...exceptions[roomId] };
    if (exception) room[id] = exception;
    else delete room[id];
    const out = { ...exceptions, [roomId]: room };
    if (!Object.keys(room).length) delete out[roomId];
    return out;
}

export function validPattern(pattern: string): boolean {
    try {
        new RegExp(pattern, "u");
        return true;
    } catch {
        return false;
    }
}

function wholeNumber(v: unknown, min: number, max: number): number | undefined {
    return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : undefined;
}

/** A room's current state, as far as the checks need it. */
export interface CheckedRoom {
    id: string;
    /** The content of a state event, or undefined when there is none. */
    state(type: string, stateKey?: string): Record<string, unknown> | undefined;
    /** The space the room was found in, for space_parent and restricted joins. */
    parentSpace: string;
    /** Room version 12 and later: the creators, who have unlimited power and aren't in the power levels. */
    creators?: string[];
    /** Rooms you aren't in are checked from the server's summary: some policies can't be decided from it. */
    unknown?(id: PolicyId, config: PolicyConfig): boolean;
}

/** What failed, as a translation key (`check_<key>`) and its variables. */
export interface Detail {
    key: string;
    vars?: Record<string, string>;
}

/** excepted: failed, but the space's admins accepted it for this room. unknown: can't be checked. */
export type Status = "pass" | "fail" | "excepted" | "unknown";

export interface CheckResult {
    status: Status;
    detail?: Detail;
    exception?: Exception;
}

const PASS: CheckResult = { status: "pass" };

const PL_ADMIN = 100;

/** Runs one policy against a room. */
export function check(id: PolicyId, room: CheckedRoom, config: PolicyConfig): CheckResult {
    const fail = (key: string, vars?: Record<string, string>): CheckResult => ({ status: "fail", detail: { key, vars } });
    switch (id) {
        case "name": {
            const name = String(room.state("m.room.name")?.name ?? "").trim();
            if (!name) return fail("name_missing");
            if (config.pattern && !new RegExp(config.pattern, "u").test(name)) return fail("name_pattern", { pattern: config.pattern });
            return PASS;
        }
        case "topic": {
            const topic = topicOf(room.state("m.room.topic"));
            if (!topic) return fail("topic_missing");
            const min = config.minLength ?? 0;
            if (Array.from(topic).length < min) return fail("topic_short", { min: String(min) });
            return PASS;
        }
        case "avatar":
            return room.state("m.room.avatar")?.url ? PASS : fail("avatar_missing");
        case "encryption":
            return room.state("m.room.encryption")?.algorithm ? PASS : fail("encryption_off");
        case "join_rule": {
            const rule = String(room.state("m.room.join_rules")?.join_rule ?? "invite");
            return config.allowed?.includes(rule) ? PASS : fail("join_rule", { value: rule });
        }
        case "history_visibility": {
            const v = String(room.state("m.room.history_visibility")?.history_visibility ?? "shared");
            return config.allowed?.includes(v) ? PASS : fail("history_visibility", { value: v });
        }
        case "guest_access":
            return room.state("m.room.guest_access")?.guest_access === "can_join" ? fail("guest_access") : PASS;
        case "address":
            return room.state("m.room.canonical_alias")?.alias ? PASS : fail("address_missing");
        case "admins": {
            const admins = joinedAdmins(room).length;
            const min = config.min ?? 1;
            return admins >= min ? PASS : fail("admins", { count: String(admins), min: String(min) });
        }
        case "space_parent": {
            // A parent event without `via` counts as removed (spec, m.space.parent).
            const via = room.state("m.space.parent", room.parentSpace)?.via;
            return Array.isArray(via) && via.length ? PASS : fail("space_parent");
        }
    }
}

/** The plain-text topic of an `m.room.topic` event (the old string, or the newer `m.topic` blocks). */
export function topicOf(content: Record<string, unknown> | undefined): string {
    if (!content) return "";
    if (typeof content.topic === "string" && content.topic.trim()) return content.topic.trim();
    const blocks = (content["m.topic"] as { "m.text"?: Array<{ body?: unknown; mimetype?: unknown }> } | undefined)?.["m.text"];
    const plain = blocks?.find((b) => !b.mimetype || b.mimetype === "text/plain") ?? blocks?.[0];
    return typeof plain?.body === "string" ? plain.body.trim() : "";
}

/** Users with admin power (100), creators included, who are joined. */
export function joinedAdmins(room: CheckedRoom): string[] {
    const users = (room.state("m.room.power_levels")?.users ?? {}) as Record<string, unknown>;
    const admins = new Set(room.creators ?? []);
    for (const [id, level] of Object.entries(users)) if (typeof level === "number" && level >= PL_ADMIN) admins.add(id);
    return [...admins].filter((id) => room.state("m.room.member", id)?.membership === "join");
}

/** Room version 12 made the creators all-powerful (MSC4289); later numeric versions keep that. */
export function creatorsOf(version: unknown, sender: string | undefined, additional: unknown): string[] {
    if (!/^\d+$/.test(String(version ?? "1")) || Number(version) < 12 || !sender) return [];
    return [sender, ...(Array.isArray(additional) ? additional.filter((u): u is string => typeof u === "string") : [])];
}

export interface RoomReport {
    results: Map<PolicyId, CheckResult>;
    errors: number;
    warnings: number;
    /** Policies that couldn't be checked (rooms you aren't in). */
    unknown: number;
}

/** All enabled policies against one room; failures the space accepted for it count as passed. */
export function checkRoom(room: CheckedRoom, policies: PolicySet, exceptions: Exceptions = {}): RoomReport {
    const results = new Map<PolicyId, CheckResult>();
    const report: RoomReport = { results, errors: 0, warnings: 0, unknown: 0 };
    for (const id of POLICY_IDS) {
        const config = policies[id];
        if (!config.enabled) continue;
        let r = room.unknown?.(id, config) ? { status: "unknown" as const } : check(id, room, config);
        const exception = exceptions[room.id]?.[id];
        if (r.status === "fail" && exception) r = { ...r, status: "excepted", exception };
        results.set(id, r);
        if (r.status === "unknown") report.unknown++;
        else if (r.status === "fail") report[config.severity === "error" ? "errors" : "warnings"]++;
    }
    return report;
}
