/**
 * What the module remembers per user, in account data, so it follows them to every device:
 * `de.datanauten.teamswelcome` = { dismissed?: boolean, dismissed_at?: number, utd_hint_off?: boolean }.
 */

export const ACCOUNT_DATA_TYPE = "de.datanauten.teamswelcome";

export interface WelcomeState {
    /** The user closed the guide; it no longer opens by itself. */
    dismissed?: boolean;
    dismissed_at?: number;
    /** The user turned the "Unable to decrypt" hint off. */
    utd_hint_off?: boolean;
}

export function parseState(value: unknown): WelcomeState {
    if (!value || typeof value !== "object") return {};
    const v = value as Record<string, unknown>;
    return {
        dismissed: v.dismissed === true ? true : undefined,
        dismissed_at: typeof v.dismissed_at === "number" ? v.dismissed_at : undefined,
        utd_hint_off: v.utd_hint_off === true ? true : undefined,
    };
}

export function shouldAutoOpen(state: WelcomeState, autoOpen: boolean): boolean {
    return autoOpen && !state.dismissed;
}

/** Merges a change into the stored content, keeping fields this version doesn't know. */
export function mergeState(current: unknown, patch: WelcomeState): Record<string, unknown> {
    const base = current && typeof current === "object" ? (current as Record<string, unknown>) : {};
    return { ...base, ...patch };
}
