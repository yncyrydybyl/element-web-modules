/**
 * The data model: what is stored in which profile field, and how it is read back.
 *
 * - The status itself is MSC4426's `m.status` profile field (unstable `org.matrix.msc4426.status`):
 *   `{ emoji, text }`, both required. The Teams-style extras (availability, "clear after", out of
 *   office) are extra, namespaced keys inside the same object. Clients that only know MSC4426
 *   (Element's own implementation, others) show emoji + text and ignore the rest; when such a client
 *   replaces the status, the extras disappear with it, so they can never go stale.
 * - "In a call" is MSC4426's `m.call` (unstable `org.matrix.msc4426.call`): `{ call_joined_ts }`. It
 *   is a separate field, so joining and leaving a call never touches the status the user set.
 * - The profile card uses `de.datanauten.*` string fields, because no MSC defines job title,
 *   department or phone (November 2026).
 */

export const STATUS_FIELD = "org.matrix.msc4426.status";
export const CALL_FIELD = "org.matrix.msc4426.call";
/** The stable identifiers, read as a fallback once servers and clients switch. */
export const STABLE_STATUS_FIELD = "m.status";
export const STABLE_CALL_FIELD = "m.call";

export const JOB_TITLE_FIELD = "de.datanauten.job_title";
export const DEPARTMENT_FIELD = "de.datanauten.department";
export const PHONE_FIELD = "de.datanauten.phone";

/** Extra keys inside the status object. */
export const AVAILABILITY_KEY = "de.datanauten.availability";
export const EXPIRES_KEY = "de.datanauten.expires_ts";
export const OOO_UNTIL_KEY = "de.datanauten.ooo_until";
/** Set when `text` is only the availability's label (MSC4426 requires a text). */
export const AUTO_TEXT_KEY = "de.datanauten.auto_text";

/** MSC4426: `text` at most 256 bytes of UTF-8, `emoji` at most 32 bytes. */
export const MAX_TEXT_BYTES = 256;
export const MAX_EMOJI_BYTES = 32;
/** What MSC4426 says the UI should be designed for. */
export const SUGGESTED_TEXT_CHARS = 30;
/** Synapse's limit for a single custom profile field value is generous; this keeps a phone number sane. */
export const MAX_CARD_FIELD_CHARS = 100;

export const AVAILABILITIES = ["available", "busy", "dnd", "brb", "away", "ooo"] as const;
export type Availability = (typeof AVAILABILITIES)[number];
/** What is shown: an availability, or "in_call" derived from `m.call`. */
export type ShownAvailability = Availability | "in_call";

/** The emoji written to `m.status`, so clients without this module still get the gist. */
export const AVAILABILITY_EMOJI: Record<ShownAvailability, string> = {
    available: "🟢",
    busy: "🔴",
    dnd: "⛔",
    brb: "⏳",
    away: "🟡",
    ooo: "🌴",
    in_call: "📞",
};

export const CARD_FIELDS = ["job_title", "department", "phone"] as const;
export type CardField = (typeof CARD_FIELDS)[number];
export const CARD_FIELD_KEYS: Record<CardField, string> = {
    job_title: JOB_TITLE_FIELD,
    department: DEPARTMENT_FIELD,
    phone: PHONE_FIELD,
};

export interface StatusInfo {
    emoji: string;
    text: string;
    availability?: Availability;
    /** `text` is just the availability's label, so viewers may show their own translation instead. */
    autoText: boolean;
    /** Epoch ms after which the status no longer applies. */
    expiresTs?: number;
    /** Out of office: the day the user is back, `YYYY-MM-DD`. */
    oooUntil?: string;
}

export type ProfileCard = Partial<Record<CardField, string>>;

export interface ProfileInfo {
    status?: StatusInfo;
    /** Epoch ms when the user joined a call (from `m.call`), if they are in one. */
    callSince?: number;
    card: ProfileCard;
}

const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter() : undefined;

export function byteLength(s: string): number {
    return new TextEncoder().encode(s).length;
}

/** Cuts a string to at most `max` bytes of UTF-8 without splitting a character. */
export function truncateBytes(s: string, max: number): string {
    if (byteLength(s) <= max) return s;
    let out = "";
    for (const ch of s) {
        if (byteLength(out + ch) > max) break;
        out += ch;
    }
    return out;
}

/** The first grapheme, as MSC4426 recommends for display (stops "emoji" from spelling a surname). */
export function firstGrapheme(s: string): string {
    if (!segmenter) return [...s][0] ?? "";
    for (const { segment } of segmenter.segment(s)) return segment;
    return "";
}

function isDate(s: unknown): s is string {
    return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseDate(s));
}

/** `YYYY-MM-DD` → local midnight of that day, epoch ms. */
export function parseDate(s: string): number {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).getTime();
}

export function formatDateInput(ts: number): string {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Reads an `m.status` value. Like Element: both `emoji` and `text` must be non-empty strings. */
export function parseStatus(raw: unknown): StatusInfo | undefined {
    if (!raw || typeof raw !== "object") return undefined;
    const r = raw as Record<string, unknown>;
    if (typeof r.emoji !== "string" || !r.emoji || typeof r.text !== "string" || !r.text) return undefined;
    const availability = AVAILABILITIES.includes(r[AVAILABILITY_KEY] as Availability) ? (r[AVAILABILITY_KEY] as Availability) : undefined;
    const expires = r[EXPIRES_KEY];
    return {
        emoji: firstGrapheme(r.emoji),
        text: truncateBytes(r.text, MAX_TEXT_BYTES),
        availability,
        autoText: !!availability && r[AUTO_TEXT_KEY] === true,
        expiresTs: typeof expires === "number" && Number.isFinite(expires) && expires > 0 ? expires : undefined,
        oooUntil: availability === "ooo" && isDate(r[OOO_UNTIL_KEY]) ? (r[OOO_UNTIL_KEY] as string) : undefined,
    };
}

/**
 * Reads an `m.call` value. MSC4426 says Unix seconds; Element's implementation writes
 * milliseconds. Both are accepted (anything below 10^11 is taken as seconds).
 */
export function parseCall(raw: unknown): number | undefined {
    if (!raw || typeof raw !== "object") return undefined;
    const ts = (raw as Record<string, unknown>).call_joined_ts;
    if (typeof ts !== "number" || !Number.isFinite(ts) || ts <= 0) return undefined;
    return ts < 1e11 ? ts * 1000 : ts;
}

function cardValue(raw: unknown): string | undefined {
    if (typeof raw !== "string") return undefined;
    const v = raw.trim();
    return v ? v.slice(0, MAX_CARD_FIELD_CHARS) : undefined;
}

/** Reads the fields this module cares about from a whole profile (`GET /profile/{userId}`). */
export function parseProfile(profile: Record<string, unknown> | undefined): ProfileInfo {
    const p = profile ?? {};
    const card: ProfileCard = {};
    for (const f of CARD_FIELDS) {
        const v = cardValue(p[CARD_FIELD_KEYS[f]]);
        if (v) card[f] = v;
    }
    return {
        status: parseStatus(p[STATUS_FIELD]) ?? parseStatus(p[STABLE_STATUS_FIELD]),
        callSince: parseCall(p[CALL_FIELD]) ?? parseCall(p[STABLE_CALL_FIELD]),
        card,
    };
}

export function isExpired(status: StatusInfo, now: number): boolean {
    return status.expiresTs !== undefined && status.expiresTs <= now;
}

/** What to show for a person, after expiry and the call state are taken into account. */
export interface Presentation {
    availability?: ShownAvailability;
    emoji: string;
    /** The status text the user typed, if any (not the availability's label). */
    text?: string;
    oooUntil?: string;
    callSince?: number;
    expiresTs?: number;
}

export function present(info: ProfileInfo | undefined, now: number): Presentation | undefined {
    if (!info) return undefined;
    const status = info.status && !isExpired(info.status, now) ? info.status : undefined;
    const typed = status && !status.autoText ? status.text : undefined;
    // Like Teams: a call shows as "In a call", unless the user said "do not disturb" or is away.
    if (info.callSince && !(status && (status.availability === "dnd" || status.availability === "ooo"))) {
        return { availability: "in_call", emoji: AVAILABILITY_EMOJI.in_call, text: typed, callSince: info.callSince };
    }
    if (!status) return undefined;
    return {
        availability: status.availability,
        emoji: status.emoji,
        text: status.availability ? typed : status.text,
        oooUntil: status.oooUntil,
        expiresTs: status.expiresTs,
    };
}

export type ClearAfter = "never" | "1h" | "today" | "week";
export const CLEAR_AFTER: ClearAfter[] = ["never", "1h", "today", "week"];

/** When a "clear after" choice ends: in an hour, at midnight, or at the start of next Monday. */
export function clearAfterTs(choice: ClearAfter, now: Date): number | undefined {
    switch (choice) {
        case "never":
            return undefined;
        case "1h":
            return now.getTime() + 60 * 60 * 1000;
        case "today":
            return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
        case "week": {
            const days = (8 - now.getDay()) % 7 || 7;
            return new Date(now.getFullYear(), now.getMonth(), now.getDate() + days).getTime();
        }
    }
}

export interface StatusInput {
    availability: Availability;
    text: string;
    clearAfter: ClearAfter;
    /** Out of office only: the day the user is back, `YYYY-MM-DD`. */
    oooUntil?: string;
}

export interface Labels {
    availability(a: Availability): string;
    oooBack(date: string): string;
}

export class StatusInputError extends Error {}

/**
 * Builds the `m.status` content for what the user picked, or `null` when there is nothing to
 * publish ("Available" without a text): then the field is deleted, as in Teams.
 */
export function buildStatusContent(input: StatusInput, labels: Labels, now: Date): Record<string, unknown> | null {
    const typed = input.text.trim();
    if (byteLength(typed) > MAX_TEXT_BYTES) throw new StatusInputError("too_long");
    const ooo = input.availability === "ooo";
    if (ooo && input.oooUntil && (!isDate(input.oooUntil) || parseDate(input.oooUntil) <= now.getTime())) {
        throw new StatusInputError("past_date");
    }
    if (input.availability === "available" && !typed) return null;

    let text = typed;
    let autoText = false;
    if (!text) {
        autoText = true;
        text = ooo && input.oooUntil ? labels.oooBack(input.oooUntil) : labels.availability(input.availability);
    }
    const content: Record<string, unknown> = {
        emoji: AVAILABILITY_EMOJI[input.availability],
        text: truncateBytes(text, MAX_TEXT_BYTES),
        [AVAILABILITY_KEY]: input.availability,
    };
    if (autoText) content[AUTO_TEXT_KEY] = true;
    const expires = ooo ? (input.oooUntil ? parseDate(input.oooUntil) : undefined) : clearAfterTs(input.clearAfter, now);
    if (expires !== undefined) content[EXPIRES_KEY] = expires;
    if (ooo && input.oooUntil) content[OOO_UNTIL_KEY] = input.oooUntil;
    return content;
}

/** Turns a stored status back into dialog input (for editing the current status). */
export function inputFromStatus(status: StatusInfo | undefined): StatusInput {
    if (!status) return { availability: "available", text: "", clearAfter: "never" };
    return {
        availability: status.availability ?? "available",
        text: status.autoText ? "" : status.text,
        clearAfter: "never",
        oooUntil: status.oooUntil,
    };
}
