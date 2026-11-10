import { ROOM_ATTR, type Snapshot } from "./snapshot";

/** What Element is showing in `#matrixchat` right now, as far as the overlay cares. */
export type Phase = "booting" | "loading" | "ready" | "other";

export function phaseOf(doc: Document = document): Phase {
    const root = doc.getElementById("matrixchat");
    if (!root?.firstElementChild) return "booting";
    // A sync error is shown on the splash with a logout button: the user must see that.
    if (root.querySelector(".mx_LoginSplashView_syncError")) return "other";
    if (root.querySelector(".mx_MatrixChat_splash")) return "loading";
    if (root.querySelector(".mx_MatrixChat .mx_RoomListPanel")) return "ready";
    return "other";
}

/** Hash routes and query parameters of the logged-out and login-return flows: no snapshot there. */
export function startsLoggedIn(location: Location): boolean {
    if (/^#\/(login|register|welcome|forgot_password|start_sso|start_cas|soft_logout)\b/.test(location.hash)) return false;
    const query = new URLSearchParams(location.search);
    if (query.has("loginToken") || (query.has("code") && query.has("state"))) return false;
    return true;
}

export interface OverlayOptions {
    doc?: Document;
    /** Called once the real UI is up, with the room the user clicked in the snapshot, if any. */
    onHandover?: (roomId: string | null) => void;
    /** Removes the overlay after this long whatever happens. */
    timeoutMs?: number;
    /** How long to wait, once Element's room list is there, for its rows to render. */
    rowsGraceMs?: number;
    /**
     * While this returns true, a page other than the splash doesn't take the overlay away. After a
     * login Element keeps its login page up until the first sync is done; the overlay covers that.
     */
    hold?: () => boolean;
    /** Adds to the overlay once it's on the page (the progress card); returns its clean-up. */
    decorate?: (host: HTMLElement) => () => void;
}

const HOST_CLASS = "speed-start-snapshot";
const FADE_MS = 160;
const HOLD_CHECK_MS = 250;

/**
 * Draws a snapshot (or, without one, a plain background) on top of Element while it starts, and
 * takes it away as soon as Element shows its own room list, or anything else (a login page, an
 * error, a verification prompt).
 */
export class SnapshotOverlay {
    private host?: HTMLElement;
    private observer?: MutationObserver;
    private timers: number[] = [];
    private intervals: number[] = [];
    private pendingRoom: string | null = null;
    private readyAt?: number;
    private done = false;
    private undecorate?: () => void;
    private readonly doc: Document;

    public constructor(
        private readonly snapshot: Snapshot | null,
        private readonly opts: OverlayOptions = {},
    ) {
        this.doc = opts.doc ?? document;
    }

    public get shown(): boolean {
        return !!this.host?.isConnected;
    }

    public show(): void {
        const doc = this.doc;
        const host = doc.createElement("div");
        host.className = HOST_CLASS;
        host.setAttribute("data-testid", "speed-start-snapshot");
        if (this.snapshot) {
            const wrapper = doc.createElement("div");
            wrapper.className = "mx_MatrixChat_wrapper";
            wrapper.setAttribute("aria-hidden", "true");
            // The HTML was sanitised when it was captured, and Element's CSP (no 'unsafe-inline' in
            // script-src) keeps inline handlers from running even if storage were tampered with.
            wrapper.innerHTML = this.snapshot.html;
            host.appendChild(wrapper);
        }
        host.addEventListener("click", this.onClick, true);
        doc.body.appendChild(host);
        this.host = host;
        this.undecorate = this.opts.decorate?.(host);

        this.observer = new MutationObserver(() => this.check());
        const root = doc.getElementById("matrixchat");
        if (root) this.observer.observe(root, { childList: true, subtree: true });
        this.timers.push(window.setTimeout(() => this.remove(false), this.opts.timeoutMs ?? 60_000));
        // What `hold` waits for doesn't change the DOM, so look again now and then.
        if (this.opts.hold) this.intervals.push(window.setInterval(() => this.check(), HOLD_CHECK_MS));
        this.check();
    }

    /** Takes the overlay away; `fade` cross-fades into the real UI. */
    public remove(fade = true): void {
        if (this.done) return;
        this.done = true;
        this.observer?.disconnect();
        for (const t of this.timers) clearTimeout(t);
        for (const t of this.intervals) clearInterval(t);
        this.undecorate?.();
        const host = this.host;
        if (host) {
            host.removeEventListener("click", this.onClick, true);
            if (fade) {
                host.classList.add(`${HOST_CLASS}_out`);
                window.setTimeout(() => host.remove(), FADE_MS);
            } else {
                host.remove();
            }
        }
        this.opts.onHandover?.(this.pendingRoom);
    }

    private check(): void {
        if (this.done) return;
        switch (phaseOf(this.doc)) {
            case "booting":
            case "loading":
                return;
            case "other":
                if (this.opts.hold?.()) return;
                // Fades when it was holding: Element has just finished the sync it waited for.
                this.remove(!!this.opts.hold);
                return;
            case "ready": {
                const rows = this.doc.querySelector("#matrixchat .mx_RoomListItemView");
                const grace = this.opts.rowsGraceMs ?? 1500;
                if (this.readyAt === undefined) {
                    this.readyAt = Date.now();
                    // Re-check when the grace period ends, in case no further mutation comes.
                    if (!rows) this.timers.push(window.setTimeout(() => this.check(), grace));
                }
                if (rows || Date.now() - this.readyAt >= grace) {
                    // Two frames, so Element's first real frame is painted before we fade.
                    requestAnimationFrame(() => requestAnimationFrame(() => this.remove(true)));
                }
            }
        }
    }

    private readonly onClick = (e: MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        const row = (e.target as Element | null)?.closest?.(`[${ROOM_ATTR}]`);
        if (!row) return;
        this.host?.querySelector(`.${HOST_CLASS}_picked`)?.classList.remove(`${HOST_CLASS}_picked`);
        row.classList.add(`${HOST_CLASS}_picked`);
        this.pendingRoom = row.getAttribute(ROOM_ATTR);
    };
}

export const css = `
.${HOST_CLASS} {
    position: fixed;
    inset: 0;
    z-index: 3000;
    background: var(--cpd-color-bg-canvas-default, #fff);
    cursor: progress;
    opacity: 1;
    transition: opacity ${FADE_MS}ms ease-out;
}
.${HOST_CLASS} > .mx_MatrixChat_wrapper * { animation: none !important; }

/*
 * The snapshot is the backdrop for the progress card: greyed out, with scanlines, a tear band that
 * sweeps down and short glitches now and then ("a glitch in the Matrix"). Only transform, opacity
 * and clip-path change per frame, so the browser doesn't repaint the snapshot while Element starts.
 */
.${HOST_CLASS} > .mx_MatrixChat_wrapper {
    height: 100%;
    filter: grayscale(0.75) contrast(0.92);
    opacity: 0.55;
    animation: ${HOST_CLASS}-glitch 5.3s steps(1, end) infinite;
}
.${HOST_CLASS}::before,
.${HOST_CLASS}::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
}
/* Scanlines, drifting slowly. */
.${HOST_CLASS}::before {
    bottom: -6px;
    background: repeating-linear-gradient(to bottom, rgba(0, 0, 0, 0.07) 0 1px, transparent 1px 3px);
    animation: ${HOST_CLASS}-scan 0.9s linear infinite;
}
/* A greenish tear band that sweeps down, and flickers. */
.${HOST_CLASS}::after {
    bottom: auto;
    height: 14vh;
    background: linear-gradient(to bottom, transparent, rgba(13, 188, 121, 0.09) 45%, rgba(13, 188, 121, 0.16) 50%, rgba(13, 188, 121, 0.09) 55%, transparent);
    animation: ${HOST_CLASS}-tear 7.1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}
@keyframes ${HOST_CLASS}-glitch {
    0% { transform: none; clip-path: none; }
    86% { transform: translate(-6px, 0) skewX(-2deg); }
    /* Thin bands torn out of the picture. */
    87% { transform: translate(4px, 1px); clip-path: polygon(0 0, 100% 0, 100% 31%, 0 31%, 0 35%, 100% 35%, 100% 100%, 0 100%); }
    88% { transform: translate(-2px, -1px); clip-path: polygon(0 0, 100% 0, 100% 63%, 0 63%, 0 65.5%, 100% 65.5%, 100% 100%, 0 100%); }
    89% { transform: none; clip-path: none; }
    94% { transform: translate(3px, 0) scaleY(1.01); filter: grayscale(0.75) contrast(0.92) drop-shadow(3px 0 rgba(255, 0, 80, 0.35)) drop-shadow(-3px 0 rgba(0, 220, 255, 0.35)); }
    95% { transform: none; filter: grayscale(0.75) contrast(0.92); }
}
@keyframes ${HOST_CLASS}-scan { to { transform: translateY(3px); } }
@keyframes ${HOST_CLASS}-tear {
    0% { transform: translateY(-15vh); opacity: 0; }
    10% { opacity: 1; }
    48% { opacity: 1; }
    50% { opacity: 0.2; }
    52% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(100vh); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
    .${HOST_CLASS} > .mx_MatrixChat_wrapper, .${HOST_CLASS}::before { animation: none; }
    .${HOST_CLASS}::after { display: none; }
}
.${HOST_CLASS}_out { opacity: 0; pointer-events: none; }
.${HOST_CLASS}_picked { background: var(--cpd-color-bg-action-secondary-pressed, rgba(0, 0, 0, 0.08)) !important; }
`;
