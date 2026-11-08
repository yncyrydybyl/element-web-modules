import { isHttpUrl } from "./config";

/**
 * Account data with the user's personal widgets ("user widgets"), the same event Element uses for
 * the sticker picker. Each entry is shaped like a widget state event:
 * `{ [widgetId]: { type: "m.widget", state_key, sender, id, content: { type, url, name, data } } }`.
 */
export const USER_WIDGETS_TYPE = "m.widgets";

/** Element shows these as the sticker picker; they are not ours to list or open. */
const STICKERPICKER_TYPE = "m.stickerpicker";

/** The widget type written for widgets added here. */
export const CUSTOM_TYPE = "m.custom";

export interface UserWidget {
    id: string;
    name: string;
    url: string;
    type: string;
    creatorUserId: string;
    data: Record<string, unknown>;
}

interface RawEntry {
    content?: { type?: unknown; url?: unknown; name?: unknown; data?: unknown; creatorUserId?: unknown };
    sender?: unknown;
}

/** The user's widgets from `m.widgets` content, without sticker pickers or broken entries, sorted by name. */
export function parseUserWidgets(content: unknown): UserWidget[] {
    if (!content || typeof content !== "object") return [];
    const out: UserWidget[] = [];
    for (const [id, raw] of Object.entries(content as Record<string, RawEntry>)) {
        const c = raw?.content;
        if (!c || typeof c.url !== "string" || !isHttpUrl(c.url)) continue;
        const type = typeof c.type === "string" ? c.type : CUSTOM_TYPE;
        if (type === STICKERPICKER_TYPE) continue;
        out.push({
            id,
            name: typeof c.name === "string" && c.name.trim() ? c.name : new URL(c.url).hostname,
            url: c.url,
            type,
            creatorUserId: typeof c.creatorUserId === "string" ? c.creatorUserId : String(raw.sender ?? ""),
            data: c.data && typeof c.data === "object" ? (c.data as Record<string, unknown>) : {},
        });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** `m.widgets` content with a widget added. Other entries (sticker pickers included) are kept untouched. */
export function withWidget(content: unknown, userId: string, name: string, url: string, id = newWidgetId()): Record<string, unknown> {
    const next = { ...asRecord(content) };
    next[id] = {
        type: "m.widget",
        state_key: id,
        sender: userId,
        id,
        content: { id, type: CUSTOM_TYPE, url, name, data: {}, creatorUserId: userId },
    };
    return next;
}

export function withoutWidget(content: unknown, id: string): Record<string, unknown> {
    const next = { ...asRecord(content) };
    delete next[id];
    return next;
}

export function newWidgetId(): string {
    const rand = crypto.getRandomValues(new Uint8Array(8));
    return `de.datanauten.uaw_${Array.from(rand, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

function asRecord(content: unknown): Record<string, unknown> {
    return content && typeof content === "object" ? (content as Record<string, unknown>) : {};
}
