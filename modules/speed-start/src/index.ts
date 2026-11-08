import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { AvatarCache } from "./avatars";
import { css, SnapshotOverlay, startsLoggedIn } from "./overlay";
import { capture, load, save, type Snapshot } from "./snapshot";

const STYLE_ID = "de-datanauten-speed-start-style";
/** How often the snapshot is refreshed while Element is open and visible. */
const REFRESH_MS = 60_000;
/** How often to check whether a snapshot is due; also the delay of the first one after login. */
const TICK_MS = 5_000;
/** A snapshot from a window this much narrower or wider than the current one is not drawn. */
const MAX_WIDTH_CHANGE = 0.4;

export class SpeedStartModule implements Module {
    // 2.0.0 has `stores.roomListStore` and `navigation.openRoom`.
    public static readonly moduleApiVersion = "^2.0.0";

    public overlay?: SnapshotOverlay;
    private readonly avatars = new AvatarCache();
    private timers: number[] = [];
    private lastCapture = 0;

    public constructor(private readonly api: Api) {}

    /** Awaits nothing on purpose: Element waits for every module's `load()` before it renders. */
    public async load(): Promise<void> {
        const snapshot = startsLoggedIn(window.location) ? load() : null;
        if (snapshot && fitsWindow(snapshot)) {
            injectStyle();
            this.overlay = new SnapshotOverlay(snapshot, {
                onHandover: (roomId) => {
                    if (roomId) this.api.navigation.openRoom(roomId);
                },
            });
            this.overlay.show();
        }
        void this.startCapturing().catch((e) => console.warn("[speed-start] Capturing failed", e));
    }

    /** Removes the overlay, timers and listeners. Element never unloads modules; this exists for tests. */
    public dispose(): void {
        this.overlay?.remove(false);
        for (const t of this.timers) clearInterval(t);
        document.removeEventListener("visibilitychange", this.onVisibility);
        window.removeEventListener("pagehide", this.captureNow);
    }

    private async startCapturing(): Promise<void> {
        // Resolves at once when nobody is logged in yet; the tick below covers a later login,
        // since a capture only succeeds while Element shows its room list.
        await this.api.stores.roomListStore.waitForReady();
        document.addEventListener("visibilitychange", this.onVisibility);
        window.addEventListener("pagehide", this.captureNow);
        this.timers.push(window.setInterval(this.tick, TICK_MS));
    }

    /** Captures soon after Element is ready (or a user logs in), then every {@link REFRESH_MS}. */
    private readonly tick = (): void => {
        if (document.visibilityState !== "visible" || Date.now() - this.lastCapture < REFRESH_MS) return;
        // Copies new avatars (the slow part) when the browser is idle, then captures.
        const run = (): void => {
            this.avatars.refresh();
            this.captureNow();
        };
        if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 5_000 });
        else run();
    };

    private readonly onVisibility = (): void => {
        if (document.visibilityState === "hidden") this.captureNow();
    };

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

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}

export default SpeedStartModule satisfies ModuleFactory;
