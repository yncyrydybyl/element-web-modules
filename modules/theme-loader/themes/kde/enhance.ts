/*
 * KDE family enhancer (docs/styleguides/kde.md §8):
 *  1. a decorative window titlebar (Breeze / Oxygen / Ocean / glass styles) mirroring document.title;
 *     only "maximise" does something (toggles fullscreen). Sets html[data-kde-titlebar] so CSS can make room.
 *  2. a Plasma digital clock at the bottom of the space column.
 * Everything is wrapped in try/catch and fully removed in unmount().
 */
import type { EnhancerContext } from "../../loader/src/types";

type Deco = "breeze" | "oxygen" | "ocean" | "glass" | null;

const DECO: Record<string, Deco> = {
    "kde-breeze-light": "breeze",
    "kde-breeze-dark": "breeze",
    "kde-breeze-daylight": "breeze",
    "kde-oxygen": "oxygen",
    "kde-ocean": "ocean",
    "kde-glass": "glass",
    "kde-usable": null,
};
const CLOCK = new Set(["kde-breeze-light", "kde-breeze-dark", "kde-breeze-daylight", "kde-oxygen", "kde-glass"]);

let cleanups: Array<() => void> = [];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
}

function titleText(): string {
    const t = (document.title || "Element").trim();
    // Element: "Element | Room" or "Room | Element" or "(3) Room | Element"
    const parts = t.split(" | ").map((s) => s.trim()).filter(Boolean);
    const app = parts.find((p) => /element/i.test(p)) || "Element";
    const room = parts.find((p) => p !== app);
    return room ? `${room} — ${app}` : app;
}

function mountTitlebar(ctx: EnhancerContext, deco: Exclude<Deco, null>): void {
    // A real OS titlebar already exists in Element Desktop / installed PWA, and short screens need the space.
    const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
    if (standalone || window.innerHeight < 600) return;

    const bar = el("div", `kde-titlebar kde-titlebar--${deco}`, ctx.root);
    bar.setAttribute("aria-hidden", "true");
    const app = el("div", "kde-titlebar__app", bar);
    el("i", "kde-titlebar__icon", app);
    if (deco !== "ocean") el("i", "kde-titlebar__pin", app);
    const title = el("div", "kde-titlebar__title", bar);
    const btns = el("div", "kde-titlebar__btns", bar);
    const order = deco === "ocean" ? ["close", "min", "max"] : deco === "oxygen" ? ["help", "min", "max", "close"] : ["min", "max", "close"];
    for (const k of order) {
        const b = el("button", `kde-titlebar__btn kde-titlebar__btn--${k}`, btns);
        b.type = "button";
        b.tabIndex = -1;
        if (k === "max") {
            b.title = "Fullscreen";
            b.addEventListener("click", () => {
                try {
                    if (document.fullscreenElement) void document.exitFullscreen();
                    else void document.documentElement.requestFullscreen();
                } catch {
                    /* not allowed */
                }
            });
        }
    }
    const update = (): void => {
        title.textContent = titleText();
    };
    update();
    const titleEl = document.querySelector("title");
    const mo = new MutationObserver(update);
    if (titleEl) mo.observe(titleEl, { childList: true, characterData: true, subtree: true });
    const headMo = new MutationObserver(() => {
        const t = document.querySelector("title");
        if (t) mo.observe(t, { childList: true, characterData: true, subtree: true });
        update();
    });
    headMo.observe(document.head, { childList: true });

    document.documentElement.setAttribute("data-kde-titlebar", deco);
    cleanups.push(() => {
        mo.disconnect();
        headMo.disconnect();
        bar.remove();
        document.documentElement.removeAttribute("data-kde-titlebar");
    });
}

function mountClock(ctx: EnhancerContext): void {
    const clock = el("div", "kde-clock", ctx.root);
    clock.setAttribute("aria-hidden", "true");
    const time = el("div", "kde-clock__time", clock);
    const date = el("div", "kde-clock__date", clock);
    const tick = (): void => {
        const now = new Date();
        time.textContent = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
        date.textContent = now.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
    };
    const place = (): void => {
        const panel = document.querySelector<HTMLElement>(".mx_SpacePanel");
        const anchor = document.querySelector<HTMLElement>(".mx_SpacePanel .mx_ThreadsActivityCentre_container")
            || document.querySelector<HTMLElement>(".mx_SpacePanel .mx_QuickSettingsButton");
        if (!panel || !anchor || panel.offsetWidth < 44) {
            clock.style.display = "none";
            return;
        }
        const p = panel.getBoundingClientRect();
        const a = anchor.getBoundingClientRect();
        clock.style.display = "";
        clock.style.left = `${p.left}px`;
        clock.style.width = `${p.width}px`;
        clock.style.top = `${a.top - 40}px`;
    };
    tick();
    place();
    const iv = window.setInterval(() => {
        tick();
        place();
    }, 15000);
    const onResize = (): void => place();
    window.addEventListener("resize", onResize);
    // space panel appears after login / layout changes
    const mo = new MutationObserver(() => place());
    const root = document.getElementById("matrixchat") || document.body;
    mo.observe(root, { childList: true, subtree: false });
    const late = window.setTimeout(place, 1500);
    const late2 = window.setTimeout(place, 5000);
    cleanups.push(() => {
        window.clearInterval(iv);
        window.clearTimeout(late);
        window.clearTimeout(late2);
        window.removeEventListener("resize", onResize);
        mo.disconnect();
        clock.remove();
    });
}

export default {
    mount(ctx: EnhancerContext): void {
        this.unmount();
        try {
            const id = ctx.variant.id;
            const deco = DECO[id] ?? null;
            if (deco) mountTitlebar(ctx, deco);
            if (CLOCK.has(id)) mountClock(ctx);
        } catch (e) {
            ctx.log("kde enhancer failed", e);
        }
    },
    unmount(): void {
        for (const c of cleanups.splice(0)) {
            try {
                c();
            } catch {
                /* ignore */
            }
        }
    },
    onPhase(): void {
        /* colours follow CSS ([data-tl-phase]) */
    },
};
