/** Granted without asking: they give the widget nothing about the user or the room. */
export const AUTO_GRANTED = new Set(["m.capability.screenshot", "io.element.requires_client"]);

/** Exact capabilities the driver implements. */
const EXACT = new Set([
    "org.matrix.msc3869.read_relations",
    "org.matrix.msc3973.user_directory_search",
    "org.matrix.msc4039.upload_file",
    "org.matrix.msc4039.download_file",
]);

/** Prefixed capabilities the driver implements (followed by an event type or a room id). */
const PREFIXES = [
    "org.matrix.msc2762.send.event:",
    "org.matrix.msc2762.receive.event:",
    "org.matrix.msc2762.send.state_event:",
    "org.matrix.msc2762.receive.state_event:",
    "org.matrix.msc2762.timeline:",
    "org.matrix.msc3819.send.to_device:",
    "org.matrix.msc3819.receive.to_device:",
];

/**
 * A room's widget list and layout. A user widget isn't in the room, so it has nothing to read or
 * rename there, and writing these would put a widget into the room: the one thing this module is
 * meant to avoid. (Store widgets ask for their own entry to set their name and icon.)
 */
const ROOM_WIDGET_STATE = /^org\.matrix\.msc2762\.(send|receive)\.state_event:(im\.vector\.modular\.widgets|m\.widget|io\.element\.widgets\.layout)(#|$)/;

export interface CapabilityRequest {
    /** Granted silently. */
    auto: string[];
    /** Need the user's consent. */
    ask: string[];
    /** Not offered here (room widget state, sticker sending, always-on-screen, OpenID, delayed events, calls …); denied silently. */
    unsupported: string[];
}

export function classify(requested: Iterable<string>): CapabilityRequest {
    const req: CapabilityRequest = { auto: [], ask: [], unsupported: [] };
    for (const cap of new Set(requested)) {
        if (AUTO_GRANTED.has(cap)) req.auto.push(cap);
        else if (ROOM_WIDGET_STATE.test(cap)) req.unsupported.push(cap);
        else if (EXACT.has(cap) || PREFIXES.some((p) => cap.startsWith(p) && cap.length > p.length)) req.ask.push(cap);
        else req.unsupported.push(cap);
    }
    return req;
}

/** Whether a capability reaches beyond the room the widget is opened in. Shown with a warning. */
export function isBroad(cap: string): boolean {
    return (
        cap.startsWith("org.matrix.msc2762.timeline:") ||
        cap.startsWith("org.matrix.msc3819.") ||
        cap === "org.matrix.msc3973.user_directory_search"
    );
}

export interface CapabilityText {
    key: string;
    vars: Record<string, string>;
}

/** A translation key plus variables describing one capability, for the consent dialog. */
export function describe(cap: string): CapabilityText {
    const m = /^org\.matrix\.msc2762\.(send|receive)\.(event|state_event):([^#]+)(?:#(.*))?$/.exec(cap);
    if (m) {
        const [, dir, kind, type, sub] = m;
        if (kind === "event") {
            if (type === "m.room.message") {
                return { key: `${dir}_message`, vars: { msgtype: sub ? sub : "*" } };
            }
            return { key: `${dir}_event`, vars: { type } };
        }
        return { key: `${dir}_state`, vars: { type, state_key: sub ?? "*" } };
    }
    const timeline = /^org\.matrix\.msc2762\.timeline:(.+)$/.exec(cap);
    if (timeline) return timeline[1] === "*" ? { key: "timeline_any", vars: {} } : { key: "timeline_room", vars: { room: timeline[1] } };
    const toDevice = /^org\.matrix\.msc3819\.(send|receive)\.to_device:(.+)$/.exec(cap);
    if (toDevice) return { key: `${toDevice[1]}_to_device`, vars: { type: toDevice[2] } };
    switch (cap) {
        case "org.matrix.msc3869.read_relations":
            return { key: "read_relations", vars: {} };
        case "org.matrix.msc3973.user_directory_search":
            return { key: "user_directory", vars: {} };
        case "org.matrix.msc4039.upload_file":
            return { key: "upload_file", vars: {} };
        case "org.matrix.msc4039.download_file":
            return { key: "download_file", vars: {} };
    }
    return { key: "unknown", vars: { cap } };
}

/**
 * Remembered consent, in the account data `de.datanauten.user_account_widgets`, so it follows the
 * user to every device: `{ approvals: { [widgetId]: { url, capabilities: string[] } } }`.
 * An approval is tied to the URL it was given for: change the URL and the widget asks again.
 */
export const APPROVALS_TYPE = "de.datanauten.user_account_widgets";

export interface Approval {
    url: string;
    capabilities: string[];
}

export function parseApprovals(content: unknown): Record<string, Approval> {
    const approvals = (content as { approvals?: unknown } | undefined)?.approvals;
    if (!approvals || typeof approvals !== "object") return {};
    const out: Record<string, Approval> = {};
    for (const [id, a] of Object.entries(approvals as Record<string, Partial<Approval>>)) {
        if (typeof a?.url !== "string" || !Array.isArray(a.capabilities)) continue;
        out[id] = { url: a.url, capabilities: a.capabilities.filter((c): c is string => typeof c === "string") };
    }
    return out;
}

/** The capabilities still needing consent after remembered approvals and configured prefixes. */
export function pending(ask: string[], url: string, approval: Approval | undefined, approvePrefixes: string[]): string[] {
    if (approvePrefixes.some((p) => url.startsWith(p))) return [];
    const known = approval?.url === url ? new Set(approval.capabilities) : new Set<string>();
    return ask.filter((c) => !known.has(c));
}

export function withApproval(content: unknown, widgetId: string, url: string, capabilities: string[]): Record<string, unknown> {
    const approvals = parseApprovals(content);
    const previous = approvals[widgetId]?.url === url ? approvals[widgetId].capabilities : [];
    approvals[widgetId] = { url, capabilities: [...new Set([...previous, ...capabilities])].sort() };
    return { ...(content as object), approvals };
}

export function withoutApproval(content: unknown, widgetId: string): Record<string, unknown> {
    const approvals = parseApprovals(content);
    delete approvals[widgetId];
    return { ...(content as object), approvals };
}
