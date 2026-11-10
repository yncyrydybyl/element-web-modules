import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { AvatarCache } from "./avatars";
import { cardCss, ProgressCard } from "./card";
import { translations, type Translate } from "./i18n";
import { css, phaseOf, SnapshotOverlay, startsLoggedIn } from "./overlay";
import { StartProbe, watchRequests } from "./progress";
import { capture, load, save, type Snapshot } from "./snapshot";
import { collectStats, loadStats, saveStats, type StatsClient } from "./stats";

const STYLE_ID = "de-datanauten-speed-start-style";
/** How often the snapshot is refreshed while Element is open and visible. */
const REFRESH_MS = 60_000;
/** How often to check whether a snapshot is due; also the delay of the first one after login. */
const TICK_MS = 5_000;
/** A snapshot from a window this much narrower or wider than the current one is not drawn. */
const MAX_WIDTH_CHANGE = 0.4;
/** How often the card asks Element how far it got. */
const PROBE_MS = 200;
/** Without a snapshot the card only covers Element's splash, so it may stay as long as a first sync takes. */
const SPLASH_TIMEOUT_MS = 10 * 60_000;
const MAX_AVATARS = 12;

export class SpeedStartModule implements Module {
    // 2.0.0 has `stores.roomListStore` and `navigation.openRoom`.
    public static readonly moduleApiVersion = "^2.0.0";

    public overlay?: SnapshotOverlay;
    private readonly avatars = new AvatarCache();
    private timers: number[] = [];
    private lastCapture = 0;
    private loginWatch?: MutationObserver;

    public constructor(private readonly api: Api) {}

    /** Awaits nothing on purpose: Element waits for every module's `load()` before it renders. */
    public async load(): Promise<void> {
        this.api.i18n.register(translations);
        if (startsLoggedIn(window.location) && hasSession()) {
            const stored = load();
            this.showOverlay(stored && fitsWindow(stored) ? stored : null, false);
        } else {
            this.watchForLogin();
        }
        void this.startCapturing().catch((e) => console.warn("[speed-start] Capturing failed", e));
    }

    /** Removes the overlay, timers and listeners. Element never unloads modules; this exists for tests. */
    public dispose(): void {
        this.overlay?.remove(false);
        this.loginWatch?.disconnect();
        for (const t of this.timers) clearInterval(t);
        document.removeEventListener("visibilitychange", this.onVisibility);
        window.removeEventListener("pagehide", this.onPageHide);
    }

    /** @param fresh - right after a login: there is no cache yet, everything comes from the server. */
    private showOverlay(snapshot: Snapshot | null, fresh: boolean): void {
        injectStyle();
        const sync = new StartProbe(true);
        this.overlay = new SnapshotOverlay(snapshot, {
            timeoutMs: snapshot ? undefined : SPLASH_TIMEOUT_MS,
            hold: fresh ? () => hasSession() && sync.read().stage !== "ready" : undefined,
            onHandover: (roomId) => {
                if (roomId) this.api.navigation.openRoom(roomId);
            },
            decorate: (host) => this.decorate(host, !!snapshot, fresh),
        });
        this.overlay.show();
    }

    /** Puts the progress card on the overlay and keeps it up to date until the overlay goes. */
    private decorate(host: HTMLElement, clickable: boolean, fresh: boolean): () => void {
        const t: Translate = (key, variables) => this.api.i18n.translate(key as never, variables);
        const avatars = [...host.querySelectorAll(".mx_RoomListPanel .mx_BaseAvatar")].slice(0, MAX_AVATARS);
        const card = new ProgressCard({ t, language: this.api.i18n.language, stats: fresh ? null : loadStats(), avatars, clickable });
        host.appendChild(card.el);
        const place = (): void => placeCard(card.el, host);
        place();
        const probe = new StartProbe(fresh);
        const tick = (): void => card.update(probe.read());
        tick();
        card.start();
        const timer = window.setInterval(tick, PROBE_MS);
        const stopRequests = watchRequests((url) => url.includes("/_matrix/"), () => card.pulse());
        window.addEventListener("resize", place);
        return () => {
            clearInterval(timer);
            card.dispose();
            stopRequests();
            window.removeEventListener("resize", place);
        };
    }

    /**
     * Started logged out: once a login succeeds, Element keeps showing "Signing in…" (or its splash,
     * after a single sign-on) until the first sync is done, the longest wait of all. The card covers
     * that. Stops at the first room list.
     */
    private watchForLogin(): void {
        const root = document.getElementById("matrixchat");
        // A session that's already there (the soft-logout page) isn't a login happening now.
        if (!root || typeof MutationObserver === "undefined" || hasSession()) return;
        this.loginWatch = new MutationObserver(() => {
            const phase = phaseOf();
            if (phase === "ready") {
                this.loginWatch?.disconnect();
            } else if (hasSession() && !this.overlay?.shown) {
                this.loginWatch?.disconnect();
                this.showOverlay(null, true);
            }
        });
        this.loginWatch.observe(root, { childList: true, subtree: true });
    }

    private async startCapturing(): Promise<void> {
        // Resolves at once when nobody is logged in yet; the tick below covers a later login,
        // since a capture only succeeds while Element shows its room list.
        await this.api.stores.roomListStore.waitForReady();
        document.addEventListener("visibilitychange", this.onVisibility);
        window.addEventListener("pagehide", this.onPageHide);
        this.timers.push(window.setInterval(this.tick, TICK_MS));
    }

    /** Captures soon after Element is ready (or a user logs in), then every {@link REFRESH_MS}. */
    private readonly tick = (): void => {
        if (document.visibilityState !== "visible" || Date.now() - this.lastCapture < REFRESH_MS) return;
        // Copies new avatars (the slow part) when the browser is idle, then captures.
        const run = (): void => {
            this.avatars.refresh();
            this.captureNow();
            this.captureStats();
        };
        if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 5_000 });
        else run();
    };

    private readonly onVisibility = (): void => {
        if (document.visibilityState === "hidden") this.onPageHide();
    };

    private readonly onPageHide = (): void => {
        this.captureNow();
        // "You were last here …" counts from when the tab was last left, not last counted.
        const stats = loadStats();
        if (stats) saveStats({ ...stats, savedAt: Date.now() });
    };

    /** Counts rooms, spaces, people and servers for the next start's card. */
    public captureStats(): void {
        const userId = localStorage.getItem("mx_user_id");
        let client: StatsClient | null | undefined;
        try {
            client = window.mxMatrixClientPeg?.get?.() as StatsClient | null | undefined;
        } catch {
            return;
        }
        if (!userId || !client || typeof client.getRooms !== "function") return;
        try {
            const stats = collectStats(client, userId);
            if (stats) saveStats(stats);
        } catch (e) {
            console.warn("[speed-start] Couldn't count the rooms", e);
        }
    }

    /** Captures with the avatars copied so far; cheap enough for `pagehide`. */
    public readonly captureNow = (): void => {
        const userId = localStorage.getItem("mx_user_id");
        if (!userId) return;
        let rooms: { id: string; name: string }[];
        try {
            rooms = this.api.stores.roomListStore.getRooms().value.map((room) => ({ id: room.id, name: room.name.value }));
        } catch {
            return; // The room list store isn't there (yet): nobody is logged in.
        }
        const snapshot = capture({ doc: document, userId, rooms, avatars: this.avatars.map });
        if (!snapshot) return;
        save(snapshot);
        this.lastCapture = Date.now();
    };
}

function fitsWindow(snapshot: Snapshot): boolean {
    if (!snapshot.width) return true;
    return Math.abs(window.innerWidth - snapshot.width) / snapshot.width <= MAX_WIDTH_CHANGE;
}

function hasSession(storage: Storage = localStorage): boolean {
    try {
        return storage.getItem("mx_has_access_token") === "true" && !!storage.getItem("mx_user_id");
    } catch {
        return false;
    }
}

/** In the middle of where the timeline would be, or of the window when that's too narrow. */
function placeCard(card: HTMLElement, host: HTMLElement): void {
    const main = host.querySelector(".mx_RoomView_wrapper")?.getBoundingClientRect();
    const area = main && main.width >= 420 && main.height >= 300 ? main : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    const w = card.offsetWidth || 380;
    const h = card.offsetHeight || 300;
    card.style.left = `${Math.max(16, Math.round(area.left + (area.width - w) / 2))}px`;
    card.style.top = `${Math.max(16, Math.round(area.top + (area.height - h) / 2))}px`;
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css + cardCss;
    document.head.appendChild(style);
}

export default SpeedStartModule satisfies ModuleFactory;
