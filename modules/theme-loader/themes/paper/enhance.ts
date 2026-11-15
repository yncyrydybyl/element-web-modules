import type { Enhancer, EnhancerContext } from "../../loader/src/types";

/*
 * paper enhancer (quiet + invisible stages only; L1 variants have "enhance": false).
 *  - marks the newest four timeline tiles with data-tl-recent (iA focus mode; CSS dims the rest)
 *  - invisible only: 8px left-edge strip that reveals the off-canvas navigation
 *    (html[data-tl-reveal]); Alt+Shift+P toggles it from the keyboard (not bound by Element 1.12.33).
 */

const RECENT = 4;
let observer: MutationObserver | null = null;
let strip: HTMLElement | null = null;
let raf = 0;
const cleanups: Array<() => void> = [];

function markRecent(): void {
    raf = 0;
    try {
        const list = document.querySelector(".mx_RoomView_MessageList");
        if (!list) return;
        const tiles = Array.from(list.querySelectorAll<HTMLElement>(":scope > li.mx_EventTile"));
        const recent = new Set(tiles.slice(-RECENT));
        for (const t of tiles) {
            const want = recent.has(t);
            if (want !== t.hasAttribute("data-tl-recent")) t.toggleAttribute("data-tl-recent", want);
        }
    } catch {
        /* never throw into Element */
    }
}

function schedule(): void {
    if (!raf) raf = requestAnimationFrame(markRecent);
}

function setReveal(on: boolean): void {
    document.documentElement.toggleAttribute("data-tl-reveal", on);
}

const enhancer: Enhancer = {
    mount(ctx: EnhancerContext): void {
        this.unmount();
        const id = ctx.variant.id;
        const quietOrInvisible = /-(quiet|invisible)$/.test(id);
        if (!quietOrInvisible) return;

        observer = new MutationObserver(schedule);
        observer.observe(document.body, { childList: true, subtree: true });
        schedule();

        if (!id.endsWith("-invisible")) return;

        strip = document.createElement("div");
        strip.setAttribute("aria-hidden", "true");
        strip.className = "tl-paper-strip";
        Object.assign(strip.style, {
            position: "absolute",
            insetBlock: "0",
            insetInlineStart: "0",
            width: "8px",
            pointerEvents: "auto",
            background: "transparent",
        });
        ctx.root.appendChild(strip);
        const onEnter = (): void => setReveal(true);
        strip.addEventListener("mouseenter", onEnter);
        strip.addEventListener("click", onEnter);   // touch / click on the visible "›" tab

        // hide again once the pointer leaves the revealed navigation (space rail 68px + room list 320px)
        const onMove = (e: MouseEvent): void => {
            if (!document.documentElement.hasAttribute("data-tl-reveal")) return;
            if (e.clientX > 68 + 320 + 24 && !document.querySelector("#left-panel:focus-within, .mx_SpacePanel:focus-within")) {
                setReveal(false);
            }
        };
        document.addEventListener("mousemove", onMove, { passive: true });

        const onKey = (e: KeyboardEvent): void => {
            if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyP") {
                e.preventDefault();
                const on = !document.documentElement.hasAttribute("data-tl-reveal");
                setReveal(on);
                if (on) {
                    const target = document.querySelector<HTMLElement>(
                        '#left-panel [aria-selected="true"], #left-panel [role="option"]',
                    );
                    target?.focus();
                }
            } else if (e.key === "Escape" && document.documentElement.hasAttribute("data-tl-reveal")) {
                setReveal(false);
            }
        };
        document.addEventListener("keydown", onKey, true);

        cleanups.push(() => {
            strip?.removeEventListener("mouseenter", onEnter);
            strip?.removeEventListener("click", onEnter);
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("keydown", onKey, true);
        });
    },

    unmount(): void {
        observer?.disconnect();
        observer = null;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        while (cleanups.length) {
            try {
                cleanups.pop()!();
            } catch {
                /* ignore */
            }
        }
        strip?.remove();
        strip = null;
        setReveal(false);
        document.querySelectorAll("[data-tl-recent]").forEach((el) => el.removeAttribute("data-tl-recent"));
    },
};

export default enhancer;
