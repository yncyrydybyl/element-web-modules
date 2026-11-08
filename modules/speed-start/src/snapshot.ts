/**
 * Captures a sanitised copy of Element's logged-in layout (space bar, room list, room header,
 * empty composer) as HTML, and stores it per user so the next start can draw it at once.
 *
 * What may end up in storage is decided by an allowlist of regions plus a scrub of everything
 * that can carry message content: the timeline, previews, drafts, tooltips and labels are never
 * copied. Room names, space names, avatars and unread badges are kept; they are room state that
 * Element's own sync cache already keeps unencrypted in IndexedDB.
 */

export const STORAGE_KEY = "de.datanauten.speed_start.snapshot";
/** Bump when the stored shape changes; older snapshots are then ignored. */
export const FORMAT = 1;
/** Snapshots bigger than this (in UTF-16 code units, i.e. localStorage's measure) are not stored. */
export const MAX_SIZE = 600_000;
/** A snapshot this old is not drawn: the room list has probably moved on too far to be helpful. */
export const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export interface Snapshot {
    format: number;
    userId: string;
    /** Element's build hash: its CSS class names are hashed per build, so a snapshot only fits its own build. */
    build: string;
    savedAt: number;
    width: number;
    html: string;
}

/** The room a row stands for, written on the copied row so a click on the snapshot can be replayed. */
export const ROOM_ATTR = "data-speed-start-room";

/** Elements removed wherever they are: media, frames, anything that can hold message text. */
const DROP = [
    "canvas",
    "video",
    "audio",
    "iframe",
    "input",
    "textarea",
    "script",
    "noscript",
    "template",
    ".mx_AuxPanel",
    ".mx_RoomView_statusArea",
    ".mx_RightPanel",
    ".mx_AppsDrawer",
    ".mx_PinnedMessageBanner",
    ".mx_RoomCallBanner",
    ".mx_ThreadsActivityCentre_container",
    "[data-radix-popper-content-wrapper]",
].join(",");

/** Attributes removed everywhere: labels and tooltips repeat text (e.g. a message preview's `title`). */
const DROP_ATTRS = new Set([
    "id",
    "title",
    "href",
    "src",
    "srcset",
    "tabindex",
    "placeholder",
    "contenteditable",
    "autofocus",
    "draggable",
    "for",
    "name",
    "value",
]);

export function currentBuild(doc: Document = document): string {
    const src = doc.querySelector<HTMLScriptElement>('script[src*="bundles/"]')?.getAttribute("src") ?? "";
    return /bundles\/([^/]+)\//.exec(src)?.[1] ?? "";
}

export interface CaptureInput {
    doc: Document;
    userId: string;
    /** Rooms as Element's room list store has them, to put room IDs on the copied rows. */
    rooms: { id: string; name: string }[];
    /** Data URLs for avatar images, keyed by the live `src`. Images without one are dropped. */
    avatars: ReadonlyMap<string, string>;
    now?: number;
}

/** Returns null when Element isn't showing its logged-in layout (or a page this module doesn't know). */
export function capture({ doc, userId, rooms, avatars, now = Date.now() }: CaptureInput): Snapshot | null {
    const live = doc.querySelector("#matrixchat .mx_MatrixChat");
    if (!live?.querySelector(".mx_RoomListPanel")) return null;

    const copy = live.cloneNode(true) as HTMLElement;
    const roomIds = roomIdsByName(rooms);

    // Room list rows: keep the name and badges, drop the message preview and the hover menu.
    for (const row of copy.querySelectorAll<HTMLElement>(".mx_RoomListItemView")) {
        const name = row.querySelector<HTMLElement>('[data-testid="room-name"]');
        if (!name) {
            row.remove();
            continue;
        }
        let sibling = name.nextElementSibling;
        while (sibling) {
            const next = sibling.nextElementSibling;
            sibling.remove();
            sibling = next;
        }
        // The hover menu sits next to the name's wrapper; the badge is the wrapper's last sibling.
        const wrapper = name.parentElement;
        let after = wrapper?.nextElementSibling;
        while (after && after.nextElementSibling) {
            const next = after.nextElementSibling;
            after.remove();
            after = next;
        }
        const id = roomIds.get(name.getAttribute("title") ?? name.textContent ?? "");
        if (id) row.setAttribute(ROOM_ATTR, id);
    }

    // The main area: a room keeps its header and an empty composer, anything else is left blank.
    const main = copy.querySelector<HTMLElement>(".mx_RoomView_wrapper");
    if (main) {
        const room = main.querySelector<HTMLElement>(".mx_RoomView");
        if (room) {
            for (const timeline of room.querySelectorAll(".mx_RoomView_timeline")) timeline.replaceChildren();
            for (const input of room.querySelectorAll(".mx_MessageComposer [contenteditable], .mx_BasicMessageComposer_input")) {
                input.replaceChildren();
            }
            for (const topic of room.querySelectorAll(".mx_RoomHeader_topic")) topic.remove();
        } else {
            main.replaceChildren();
        }
    }

    for (const el of copy.querySelectorAll(DROP)) el.remove();
    scrubTree(copy, avatars);

    const html = copy.outerHTML;
    if (html.length > MAX_SIZE) return null;
    return { format: FORMAT, userId, build: currentBuild(doc), savedAt: now, width: doc.defaultView?.innerWidth ?? 0, html };
}

function roomIdsByName(rooms: { id: string; name: string }[]): Map<string, string> {
    const ids = new Map<string, string>();
    // First one wins: rooms come in list order, so a name shared by two rooms maps to the upper one.
    for (const room of rooms) if (!ids.has(room.name)) ids.set(room.name, room.id);
    return ids;
}

function scrubTree(root: HTMLElement, avatars: ReadonlyMap<string, string>): void {
    for (const el of [root, ...root.querySelectorAll<HTMLElement>("*")]) {
        if (el instanceof HTMLImageElement) {
            const data = avatars.get(el.currentSrc || el.getAttribute("src") || "");
            if (!data) {
                el.remove();
                continue;
            }
            el.setAttribute("src", data);
            el.removeAttribute("srcset");
            el.setAttribute("alt", "");
            scrubAttributes(el, ["src"]);
            continue;
        }
        scrubAttributes(el);
    }
}

function scrubAttributes(el: Element, keep: string[] = []): void {
    for (const { name } of [...el.attributes]) {
        if (keep.includes(name)) continue;
        if (DROP_ATTRS.has(name) || name.startsWith("aria-") || name.startsWith("on")) {
            el.removeAttribute(name);
        } else if (name === "style" && /url\(/i.test(el.getAttribute("style") ?? "")) {
            // Background images point at blob: or media URLs, which are dead on the next start.
            el.setAttribute("style", (el.getAttribute("style") ?? "").replace(/[\w-]+\s*:[^;]*url\([^)]*\)[^;]*;?/gi, ""));
        }
    }
}

export function save(snapshot: Snapshot, storage: Storage = localStorage): void {
    try {
        storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
        // Quota or a disabled storage: the next start just won't have a snapshot.
        console.warn("[speed-start] Couldn't store the snapshot", e);
    }
}

export function clear(storage: Storage = localStorage): void {
    try {
        storage.removeItem(STORAGE_KEY);
    } catch {
        // Nothing to do.
    }
}

/**
 * The stored snapshot, if it may be drawn now: same user still logged in, same Element build,
 * recent enough. A snapshot of another user is deleted on the spot.
 */
export function load(storage: Storage = localStorage, doc: Document = document, now = Date.now()): Snapshot | null {
    let snapshot: Snapshot;
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return null;
        snapshot = JSON.parse(raw) as Snapshot;
    } catch {
        return null;
    }
    const userId = storage.getItem("mx_user_id");
    if (storage.getItem("mx_has_access_token") !== "true" || !userId) return null;
    if (snapshot.userId !== userId) {
        clear(storage);
        return null;
    }
    if (snapshot.format !== FORMAT || typeof snapshot.html !== "string") return null;
    if (snapshot.build !== currentBuild(doc)) return null;
    if (now - snapshot.savedAt > MAX_AGE_MS) return null;
    return snapshot;
}
