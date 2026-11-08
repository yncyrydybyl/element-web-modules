import type { Channel } from "./channel";
import { quietly } from "./util";

/**
 * What every tab of the session says about itself, for the "Open tabs" list in Settings → Preferences.
 *
 *   viewing tab ──"status" to "*"──▶ every tab ──▶ its TabStatus
 *               ──"status" to "engine" (longer wait: a busy engine may answer late)
 *   + its own status, without asking ──▶ one row per tab
 */

/** How long the viewing tab gathers answers from all tabs. */
const COLLECT_MS = 400;
/** How long it waits for the engine in particular. */
const ENGINE_STATUS_MS = 3_000;
/** Ring colours: Compound's six decorative colours, as Element uses for avatars. */
export const COLOURS = 6;
const COLOUR_KEY = "de.datanauten.multi_tab.colour";

export interface TabStatus {
    tabId: string;
    role: string;
    version: string;
    /** When this page loaded (epoch ms). */
    openedAt: number;
    /** `document.title` (Element puts the unread count in it). */
    title: string;
    /** The room or space the tab shows, "Home", or null if it can't tell. */
    place: string | null;
    visible: boolean;
    focused: boolean;
    /** js-sdk's sync state, e.g. "SYNCING". */
    syncState: string | null;
    /** When this tab last got a sync response: from the server (engine) or from the engine (mirror). */
    lastSyncAt: number | null;
    /** A few role-specific numbers, already in words: "4 responses buffered (1.2 MB)". */
    details: string[];
    /** This tab's ring colour (0 … COLOURS-1), -1 until it has one. */
    colour: number;
    /** When the tab took that colour: on a clash the tab that had it first keeps it. */
    colourSince: number;
}

export interface TabInfo extends TabStatus {
    isThis: boolean;
    /** How long the tab took to answer; 0 for the viewing tab itself. */
    replyMs: number;
}

/** Answers "status" from other tabs. */
export function serveStatus(channel: Channel, own: () => TabStatus): void {
    channel.handle("status", own);
}

/** Every open tab of this session, the engine first, then the others by age. */
export async function listTabs(channel: Channel, own: () => TabStatus): Promise<TabInfo[]> {
    const me = own();
    const t0 = performance.now();
    const elapsed = (): number => Math.round(performance.now() - t0);
    const fromAll = channel
        .collect<TabStatus>("status", null, COLLECT_MS)
        .then((replies) => replies.map((r): TabInfo => ({ ...r.payload, isThis: false, replyMs: r.receivedMs })));
    const fromEngine =
        me.role === "engine"
            ? Promise.resolve(null)
            : channel
                  .request<TabStatus>("engine", "status", null, ENGINE_STATUS_MS)
                  .then((s): TabInfo => ({ ...s, isThis: false, replyMs: elapsed() }))
                  .catch(() => null);
    const [all, engine] = await Promise.all([fromAll, fromEngine]);
    const byId = new Map<string, TabInfo>();
    for (const t of all) byId.set(t.tabId, t);
    if (engine && !byId.has(engine.tabId)) byId.set(engine.tabId, engine);
    byId.set(me.tabId, { ...me, isThis: true, replyMs: 0 });
    return [...byId.values()].sort((a, b) => rank(a) - rank(b) || a.openedAt - b.openedAt);
}

function rank(t: TabStatus): number {
    return t.role === "engine" ? 0 : 1;
}

/** The parts of a tab's status that don't depend on its role. */
export function baseStatus(
    tabId: string,
    role: string,
    version: string,
    openedAt: number,
    client: { getRoom(id: string): { name?: string } | null } | null,
): Omit<TabStatus, "syncState" | "lastSyncAt" | "details" | "colour" | "colourSince"> {
    return {
        tabId,
        role,
        version,
        openedAt,
        title: document.title,
        place: placeOf(location.hash, client),
        visible: document.visibilityState === "visible",
        focused: document.hasFocus(),
    };
}

/** What Element shows, from its URL: `#/room/<id or alias>`, `#/home`, `#/user/…`, … */
export function placeOf(hash: string, client: { getRoom(id: string): { name?: string } | null } | null): string | null {
    const [, view, target] = /^#\/([^/?]+)\/?([^?]*)/.exec(hash) ?? [];
    if (!view || view === "home") return "Home";
    if (view === "room" && target) {
        const id = decodeURIComponent(target.split("/")[0]);
        return client?.getRoom(id)?.name ?? (id.startsWith("#") ? id : null);
    }
    return null;
}

type ColourClaim = Pick<TabStatus, "tabId" | "openedAt" | "colour" | "colourSince">;

/**
 * The colour this tab should have, given the other tabs'. It keeps its colour unless an older claim has it (taken
 * earlier, or as early but by a tab open longer: a duplicated tab copies sessionStorage), else takes the first
 * free one. With more tabs than colours, colours repeat.
 */
export function pickColour(me: ColourClaim, others: ColourClaim[]): number {
    const older = (o: ColourClaim): boolean =>
        o.colour === me.colour &&
        (o.colourSince < me.colourSince ||
            (o.colourSince === me.colourSince && (o.openedAt < me.openedAt || (o.openedAt === me.openedAt && o.tabId < me.tabId))));
    const counts = Array.from({ length: COLOURS }, (_, c) => others.filter((o) => o.colour === c).length);
    const full = counts.every((n) => n > 0);
    if (me.colour >= 0 && (full || !others.some(older))) return me.colour;
    return counts.indexOf(Math.min(...counts));
}

/** This tab's colour, kept in sessionStorage so it survives the tab's reloads (promotion, Element updates). */
export class TabColour {
    public colour = -1;
    public since = 0;

    public constructor(
        private readonly session: Storage,
        private readonly now: () => number = Date.now,
    ) {
        const saved = quietly(() => JSON.parse(session.getItem(COLOUR_KEY) ?? "null") as { colour?: unknown; since?: unknown } | null, null);
        if (typeof saved?.colour === "number" && typeof saved.since === "number" && saved.colour >= 0 && saved.colour < COLOURS) {
            this.colour = saved.colour;
            this.since = saved.since;
        }
    }

    /** Settles this tab's colour against the other tabs' and returns it. */
    public settle(tabId: string, openedAt: number, others: ColourClaim[]): number {
        const colour = pickColour({ tabId, openedAt, colour: this.colour, colourSince: this.since }, others);
        if (colour !== this.colour) {
            this.colour = colour;
            this.since = this.now();
            quietly(() => this.session.setItem(COLOUR_KEY, JSON.stringify({ colour, since: this.since })), undefined);
        }
        return colour;
    }
}

export function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} kB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
