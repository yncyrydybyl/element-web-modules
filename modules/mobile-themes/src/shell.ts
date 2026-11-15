/**
 * Single-pane shell (MOB-09, MOB-10, MOB-11, MOB-12, MOB-26, MOB-27).
 *
 * On phone-sized screens (html[data-mt-compact]) exactly one pane is visible at a time:
 *
 *   html[data-mt-view="list"]   space panel + room list, full width
 *   html[data-mt-view="room"]   the room (or any page Element shows in the main area), full width
 *   html[data-mt-view="panel"]  the right panel (threads, room info, members, …), full screen
 *
 * The view is *derived* from Element's own state, never faked: "panel" = the right panel is open (Element's
 * RightPanelStore decides that), "room" = Element shows a room/page, "list" = the home page is shown or the user went
 * back. Nothing in Element's layout state is changed: the resizable room list stays "collapsed" (Element's own phone
 * default), the CSS lays the panes out on top of each other and only toggles visibility, so the timeline keeps its
 * size and scroll position when switching.
 *
 * Navigation goes through Element: rooms are opened by Element itself (room list taps dispatch view_room, which we
 * observe), the panel is closed with RightPanelStore. Back = our button in the room header (module API
 * extras.addRoomHeaderButtonCallback, so it is a React-owned node in Element's header) or the browser/OS back
 * gesture: entering the room or the panel pushes a same-URL history entry, so iOS edge-swipe / Android back pop it
 * and we go one pane back instead of leaving the room via Element's hash history.
 *
 * Internals used (feature-detected, all optional): window.mxDispatcher (register), window.mxSdkContext.rightPanelStore
 * (isOpen/hide). Without them the view still follows the DOM (MutationObserver) and hashchange.
 */
import type { Api } from "@element-hq/element-web-module-api";
import * as React from "react";

const P = "[mobile-themes]";
type View = "list" | "room" | "panel";

interface Dispatcher {
    register(cb: (payload: { action?: string; [k: string]: unknown }) => void): string;
    unregister(id: string): void;
}
interface RightPanelStoreLike {
    isOpen?: boolean;
    hide?(roomId: string | null): void;
    roomPhaseHistory?: unknown;
}
const w = window as unknown as { mxDispatcher?: Dispatcher; mxSdkContext?: { rightPanelStore?: RightPanelStoreLike; roomViewStore?: { getRoomId?(): string | null } } };

const BACK_SVG =
    '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor"><path d="M15.7 4.3a1 1 0 0 1 0 1.4L9.4 12l6.3 6.3a1 1 0 1 1-1.4 1.4l-7-7a1 1 0 0 1 0-1.4l7-7a1 1 0 0 1 1.4 0Z"/></svg>';
const MORE_SVG =
    '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';

const html = (): HTMLElement => document.documentElement;
export const isCompact = (): boolean => html().hasAttribute("data-mt-compact");

export class Shell {
    private view: View | null = null;
    private listRequested = false;
    private dispatcherId: string | null = null;
    private mo: MutationObserver | null = null;
    private raf = 0;
    private lastHashRoom = "";
    private ignorePop = 0;
    private disposers: Array<() => void> = [];
    private leftPanelObserver: MutationObserver | null = null;

    public constructor(private readonly api: Api, private readonly opts: { history: boolean }) {}

    public start(): void {
        this.addHeaderButtons();
        this.tryRegister();
        const onHash = (): void => this.onHashChange();
        const onPop = (e: PopStateEvent): void => this.onPopState(e);
        const onClick = (e: MouseEvent): void => this.onDocClick(e);
        window.addEventListener("hashchange", onHash);
        window.addEventListener("popstate", onPop);
        document.addEventListener("click", onClick, true);
        this.disposers.push(() => window.removeEventListener("hashchange", onHash));
        this.disposers.push(() => window.removeEventListener("popstate", onPop));
        this.disposers.push(() => document.removeEventListener("click", onClick, true));
        this.mo = new MutationObserver(() => this.schedule());
        this.mo.observe(document.body, { childList: true, subtree: true });
        this.lastHashRoom = this.hashRoom();
        this.schedule();
        // debugging / tests: window.mtMobile.shell.state()
        (window as unknown as { mtMobile?: object }).mtMobile = { ...((window as unknown as { mtMobile?: object }).mtMobile ?? {}), shell: this };
    }

    public state(): { view: View | null; listRequested: boolean; hashRoom: string; log: string[] } {
        return { view: this.view, listRequested: this.listRequested, hashRoom: this.hashRoom(), log: this.log.slice(-20) };
    }
    private log: string[] = [];
    /** time of the last Element navigation action: its hash update fires popstate too, which is not a "back" */
    private lastNavAction = -1e9;
    private csRoom = "";
    private closePanelUntil = 0;
    private trace(m: string): void {
        this.log.push(`${Math.round(performance.now())} ${m}`);
        if (this.log.length > 50) this.log.shift();
    }

    /** window.mxDispatcher may appear after module load; retried on every update until it works. */
    private tryRegister(): void {
        if (this.dispatcherId) return;
        try {
            if (typeof w.mxDispatcher?.register === "function") this.dispatcherId = w.mxDispatcher.register((p) => this.onAction(p));
        } catch (e) {
            console.warn(P, "dispatcher register failed", e);
            this.dispatcherId = "failed";
        }
    }

    public stop(): void {
        this.mo?.disconnect();
        this.leftPanelObserver?.disconnect();
        if (this.dispatcherId && this.dispatcherId !== "failed") w.mxDispatcher?.unregister(this.dispatcherId);
        for (const d of this.disposers) d();
        this.setView(null);
    }

    /** Called by the module when detection changes (rotate, resize). */
    public refresh(): void {
        this.schedule();
    }

    // ------------------------------------------------------------------ state

    private schedule(): void {
        if (this.raf) return;
        this.raf = requestAnimationFrame(() => {
            this.raf = 0;
            try {
                this.update();
            } catch (e) {
                console.error(P, "shell update failed", e);
            }
        });
    }

    private group(): HTMLElement | null {
        return document.querySelector<HTMLElement>(".mx_MatrixChat > [data-group]");
    }

    private hashRoom(): string {
        const m = /^#\/(room|user|group|space)\/([^/?]+)/.exec(window.location.hash);
        return m ? m[2] : "";
    }

    private rightPanelOpen(group: HTMLElement): boolean {
        return !!group.querySelector(".mx_RightPanel");
    }

    private computeView(group: HTMLElement): View {
        const home = !!group.querySelector(".mx_HomePage") || /^#?\/?(home)?$/.test(window.location.hash.replace(/^#/, ""));
        if (home || this.listRequested) return "list";
        if (this.rightPanelOpen(group)) {
            if (performance.now() < this.closePanelUntil) {
                this.closePanelUntil = 0;
                this.closeRightPanel();
                return "room";
            }
            return "panel";
        }
        return "room";
    }

    private update(): void {
        this.tryRegister();
        const group = isCompact() ? this.group() : null;
        if (!group) {
            this.setView(null);
            return;
        }
        this.setView(this.computeView(group));
        this.syncHeaderMore();
    }

    private setView(v: View | null): void {
        const prev = this.view;
        if (v === prev) {
            if (v === "list") this.uninertList();
            return;
        }
        this.view = v;
        this.trace(`view ${prev} -> ${v}`);
        const el = html();
        if (v) el.setAttribute("data-mt-view", v);
        else el.removeAttribute("data-mt-view");
        if (v !== "room") el.removeAttribute("data-mt-header-more");

        if (v === "list") {
            this.uninertList();
            // the composer may still hold focus (and the soft keyboard) under the now hidden room
            const a = document.activeElement as HTMLElement | null;
            if (a && a.closest(".mx_RoomView")) a.blur();
        } else {
            this.restoreInert();
        }
        // History entries so the OS/browser back gesture goes one pane back (see header comment).
        if (this.opts.history && prev && v) {
            const depth = (s: View): number => (s === "list" ? 0 : s === "room" ? 1 : 2);
            if (depth(v) > depth(prev) && !(history.state && (history.state as { mt?: string }).mt === v)) {
                try {
                    history.pushState({ ...(history.state ?? {}), mt: v }, "");
                } catch {
                    /* ignore */
                }
            }
        }
        document.dispatchEvent(new CustomEvent("mt-view", { detail: { view: v, prev } }));
    }

    /** Element marks the collapsed room list `inert`; while we show it as the list pane it must be usable. */
    private uninertList(): void {
        const lp = document.getElementById("left-panel");
        if (!lp) return;
        if (lp.hasAttribute("inert")) {
            lp.removeAttribute("inert");
            lp.setAttribute("data-mt-uninert", "");
        }
        if (!this.leftPanelObserver) {
            this.leftPanelObserver = new MutationObserver(() => {
                if (this.view === "list" && lp.hasAttribute("inert")) {
                    lp.removeAttribute("inert");
                    lp.setAttribute("data-mt-uninert", "");
                }
            });
            this.leftPanelObserver.observe(lp, { attributes: true, attributeFilter: ["inert"] });
        }
    }

    private restoreInert(): void {
        this.leftPanelObserver?.disconnect();
        this.leftPanelObserver = null;
        const lp = document.getElementById("left-panel");
        if (lp?.hasAttribute("data-mt-uninert")) {
            lp.removeAttribute("data-mt-uninert");
            // only put it back if Element's panel really is collapsed (0 px)
            if (lp.getBoundingClientRect().width < 1 || this.view) lp.setAttribute("inert", "");
        }
    }

    // ------------------------------------------------------------------ inputs

    private onAction(p: { action?: string; [k: string]: unknown }): void {
        if (!isCompact()) return;
        if (typeof p.action === "string" && /^view_/.test(p.action)) this.lastNavAction = performance.now();
        if (p.action === "view_room" || p.action === "view_home_page") this.trace(`action ${p.action}${p.context_switch ? " cs" : ""}`);
        switch (p.action) {
            case "view_room":
                // A space switch re-dispatches view_room for the space's last room (context_switch): that is not the
                // user asking for the room, so the list stays.
                if (p.context_switch) {
                    this.listRequested = true;
                    this.csRoom = typeof p.room_id === "string" ? p.room_id : "";
                    this.schedule();
                    break;
                }
                // Opening a room from the list shows the conversation, like native apps, even if Element remembered an
                // open right panel for that room. Not for links to an event (a thread permalink opens its panel).
                if (this.view === "list" && !p.event_id) this.closePanelUntil = performance.now() + 1200;
                this.listRequested = false;
                this.csRoom = "";
                this.schedule();
                break;
            case "view_home_page":
            case "view_welcome_page":
                this.listRequested = false;
                this.schedule();
                break;
            default:
                break;
        }
    }

    private onHashChange(): void {
        const r = this.hashRoom();
        // the hash update of a space switch (context_switch, see onAction) is not a request to show the room
        const fromSpaceSwitch = !!this.csRoom && decodeURIComponent(r) === this.csRoom;
        this.csRoom = "";
        if (r && r !== this.lastHashRoom && !fromSpaceSwitch) this.listRequested = false;
        this.lastHashRoom = r;
        this.schedule();
    }

    /** Tapping the room that is already selected dispatches nothing new for some list implementations: catch it. */
    private onDocClick(e: MouseEvent): void {
        if (this.view !== "list") return;
        const t = e.target as Element | null;
        if (!t?.closest) return;
        const item = t.closest('#left-panel [role="option"], #left-panel [class*="_roomListItem_"], #left-panel .mx_RoomTile');
        if (!item || t.closest('button[aria-haspopup], [aria-haspopup="menu"]')) return;
        // let Element handle the click first (view_room), then make sure we show the room
        setTimeout(() => {
            if (this.view === "list" && this.hashRoom()) {
                this.listRequested = false;
                this.schedule();
            }
        }, 60);
    }

    private onPopState(e: PopStateEvent): void {
        if (this.ignorePop > 0) {
            this.ignorePop--;
            return;
        }
        if (!this.view) return;
        const st = (e.state ?? {}) as { mt?: View };
        const own = performance.now() - this.lastNavAction < 600;
        this.trace(`popstate ${JSON.stringify(e.state)}${own ? " (element nav, ignored)" : ""}`);
        if (own) return;
        const target: View = st.mt === "panel" ? "panel" : st.mt === "room" ? "room" : "list";
        if (this.view === "panel" && target !== "panel") this.closeRightPanel();
        if (target === "list" && this.view !== "list" && this.hashRoom() === this.lastHashRoom) {
            this.listRequested = true;
        }
        this.schedule();
    }

    // ------------------------------------------------------------------ actions

    public back(): void {
        if (this.view === "panel") {
            if (this.opts.history && (history.state as { mt?: string } | null)?.mt === "panel") history.back();
            else this.closeRightPanel();
            return;
        }
        if (this.view === "room") {
            if (this.opts.history && (history.state as { mt?: string } | null)?.mt === "room") {
                history.back(); // → onPopState → list
            } else {
                this.listRequested = true;
                this.schedule();
            }
        }
    }

    private closeRightPanel(): void {
        try {
            const rps = w.mxSdkContext?.rightPanelStore;
            if (rps && typeof rps.hide === "function") {
                const rid = w.mxSdkContext?.roomViewStore?.getRoomId?.() ?? null;
                rps.hide(rid);
                return;
            }
        } catch (e) {
            console.warn(P, "rightPanelStore.hide failed", e);
        }
        // fallback: Element's own close button of the card
        const close = document.querySelector<HTMLElement>(".mx_RightPanel .mx_BaseCard_header button:last-of-type");
        close?.click();
    }

    // ------------------------------------------------------------------ header buttons

    private addHeaderButtons(): void {
        const extras = (this.api as unknown as { extras?: { addRoomHeaderButtonCallback?: (cb: (roomId: string) => React.JSX.Element | undefined) => void } }).extras;
        if (typeof extras?.addRoomHeaderButtonCallback !== "function") {
            console.warn(P, "room header buttons not supported: back is only the browser back gesture");
            return;
        }
        const tBack = this.label("back");
        const tMore = this.label("more");
        extras.addRoomHeaderButtonCallback(() =>
            React.createElement(
                React.Fragment,
                null,
                React.createElement("button", {
                    type: "button",
                    className: "mt-ui mt-back",
                    "aria-label": tBack,
                    title: tBack,
                    onClick: (e: React.MouseEvent) => {
                        e.stopPropagation();
                        this.back();
                    },
                    dangerouslySetInnerHTML: { __html: BACK_SVG },
                }),
                React.createElement("button", {
                    type: "button",
                    className: "mt-ui mt-more",
                    "aria-label": tMore,
                    title: tMore,
                    "aria-expanded": "false",
                    onClick: (e: React.MouseEvent) => {
                        e.stopPropagation();
                        const el = html();
                        if (el.hasAttribute("data-mt-header-more")) el.removeAttribute("data-mt-header-more");
                        else el.setAttribute("data-mt-header-more", "");
                        this.syncHeaderMore();
                    },
                    dangerouslySetInnerHTML: { __html: MORE_SVG },
                }),
            ),
        );
    }

    private syncHeaderMore(): void {
        const open = html().hasAttribute("data-mt-header-more");
        document.querySelectorAll(".mx_RoomHeader .mt-more").forEach((b) => b.setAttribute("aria-expanded", String(open)));
    }

    private label(k: "back" | "more"): string {
        const de = (navigator.language || "").toLowerCase().startsWith("de");
        if (k === "back") return de ? "Zurück zur Raumliste" : "Back to room list";
        return de ? "Weitere Raum-Aktionen" : "More room actions";
    }
}
