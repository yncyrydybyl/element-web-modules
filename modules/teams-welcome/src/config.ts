/**
 * Admin configuration, read from Element's config.json under `de.datanauten.teamswelcome`.
 * Everything is optional; invalid values are ignored with a console warning instead of breaking
 * Element (a rejected `load()` would show Element's error screen).
 */

export const CONFIG_KEY = "de.datanauten.teamswelcome";

export const STEP_IDS = ["secure", "habits", "profile", "spaces"] as const;
export type StepId = (typeof STEP_IDS)[number];

export const LANGUAGES = ["en", "de"] as const;
export type Language = (typeof LANGUAGES)[number];

export interface SpaceEntry {
    /** `#alias:server` (or a room ID). */
    alias: string;
    /** Shown before the user has joined (the space's own name is shown afterwards). */
    name?: string;
    description?: string;
}

export interface WelcomeConfig {
    organisation?: string;
    helpUrl?: string;
    helpLabel?: string;
    spaces: SpaceEntry[];
    /** The steps to show, in this order. */
    steps: StepId[];
    /** Forces the guide's language; otherwise it follows Element's. */
    language?: Language;
    /** Open the guide by itself after the first login (default true). */
    autoOpen: boolean;
    /** Explain "Unable to decrypt" when it happens (default true). */
    utdHint: boolean;
    /** Joining a space also joins its suggested rooms (default true). */
    joinSuggestedRooms: boolean;
}

export function parseConfig(raw: unknown, warn: (msg: string) => void = () => {}): WelcomeConfig {
    const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const str = (key: string): string | undefined => {
        const v = r[key];
        if (v === undefined || v === null || v === "") return undefined;
        if (typeof v === "string") return v.trim() || undefined;
        warn(`${key} must be a string`);
        return undefined;
    };
    const bool = (key: string, dflt: boolean): boolean => {
        const v = r[key];
        if (v === undefined) return dflt;
        if (typeof v === "boolean") return v;
        warn(`${key} must be true or false`);
        return dflt;
    };

    const spaces: SpaceEntry[] = [];
    if (r.spaces !== undefined) {
        if (!Array.isArray(r.spaces)) warn("spaces must be a list");
        else
            for (const s of r.spaces) {
                const entry = typeof s === "string" ? { alias: s } : s && typeof s === "object" ? (s as Record<string, unknown>) : null;
                const alias = typeof entry?.alias === "string" ? entry.alias.trim() : "";
                if (!/^[#!][^:]+:.+$/.test(alias)) {
                    warn(`ignoring space ${JSON.stringify(s)}: expected "#alias:server"`);
                    continue;
                }
                if (spaces.some((x) => x.alias === alias)) continue;
                spaces.push({
                    alias,
                    name: typeof entry?.name === "string" && entry.name ? entry.name : undefined,
                    description: typeof entry?.description === "string" && entry.description ? entry.description : undefined,
                });
            }
    }

    let steps: StepId[] = [...STEP_IDS];
    if (r.steps !== undefined) {
        if (!Array.isArray(r.steps)) warn("steps must be a list");
        else {
            const unknown = r.steps.filter((s) => !STEP_IDS.includes(s as StepId));
            if (unknown.length) warn(`ignoring unknown steps ${unknown.join(", ")} (known: ${STEP_IDS.join(", ")})`);
            steps = r.steps.filter((s, i, a): s is StepId => STEP_IDS.includes(s as StepId) && a.indexOf(s) === i);
        }
    }
    // Nothing to join: the step would be empty.
    if (!spaces.length) steps = steps.filter((s) => s !== "spaces");

    let helpUrl = str("help_url");
    if (helpUrl && !/^(https?:|mailto:|tel:)/i.test(helpUrl)) {
        warn("help_url must start with https:, http:, mailto: or tel:");
        helpUrl = undefined;
    }

    let language = str("language") as Language | undefined;
    if (language && !LANGUAGES.includes(language)) {
        warn(`language must be one of ${LANGUAGES.join(", ")}`);
        language = undefined;
    }

    return {
        organisation: str("organisation"),
        helpUrl,
        helpLabel: str("help_label"),
        spaces,
        steps,
        language,
        autoOpen: bool("auto_open", true),
        utdHint: bool("utd_hint", true),
        joinSuggestedRooms: bool("join_suggested_rooms", true),
    };
}
