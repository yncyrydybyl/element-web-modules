import type { EnhancerContext, Enhancer } from "../../src/types";

/*
 * sketch family enhancer (docs/styleguides/sketch.md §7)
 *  1. injects the SVG filter <defs> used by CSS (wobble / boil / chalk)
 *  2. hint annotations (designed, notebook, daylight) in empty rooms
 *  3. blueprint: live panel widths + sheet number as data attributes for CSS dimension lines / title block
 *  4. notebook/daylight: page-flip class on room change
 *  5. scribble/unreadable: boil only while the tab is visible (reduced motion: never)
 * Never moves React nodes; everything is attributes + overlays; full cleanup in unmount().
 */

const FILTERS = `
<filter id="sk-rough-1" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2.5" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="sk-rough-3" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="5"/><feDisplacementMap in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="sk-boil-0" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="turbulence" baseFrequency=".02" numOctaves="2" seed="1"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
<filter id="sk-boil-1" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="turbulence" baseFrequency=".03" numOctaves="2" seed="2"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
<filter id="sk-boil-2" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="turbulence" baseFrequency=".025" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
<filter id="sk-chalk" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="4" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>
`;

const HINT_VARIANTS = new Set(["sketch-designed", "sketch-notebook", "sketch-daylight"]);

let ctxRef: EnhancerContext | null = null;
let defs: SVGSVGElement | null = null;
let hintLayer: HTMLElement | null = null;
let observer: MutationObserver | null = null;
let resizeObs: ResizeObserver | null = null;
let raf = 0;
let lastRoom = "";
let flipTimer = 0;
const cleanups: Array<() => void> = [];

function safe(fn: () => void): void {
    try {
        fn();
    } catch (e) {
        ctxRef?.log("sketch enhancer error", e);
    }
}

function injectDefs(ctx: EnhancerContext): void {
    const ns = "http://www.w3.org/2000/svg";
    defs = document.createElementNS(ns, "svg") as SVGSVGElement;
    defs.setAttribute("width", "0");
    defs.setAttribute("height", "0");
    defs.setAttribute("aria-hidden", "true");
    defs.setAttribute("focusable", "false");
    defs.style.position = "absolute";
    defs.innerHTML = `<defs>${FILTERS}</defs>`;
    defs.id = "sk-filter-defs";
    ctx.root.appendChild(defs);
}

/* ---------------------------------------------------------------- hints */
function updateHints(ctx: EnhancerContext): void {
    if (!hintLayer) return;
    const composer = document.querySelector(".mx_MessageComposer_wrapper") as HTMLElement | null;
    // only in genuinely empty space: the last visible timeline element must end well above the composer
    let free = 0;
    const panel = document.querySelector(".mx_RoomView_messagePanel") as HTMLElement | null;
    const scrollable = !!panel && panel.scrollHeight > panel.clientHeight + 8;
    if (composer && !scrollable) {
        const r0 = composer.getBoundingClientRect();
        const items = document.querySelectorAll(
            ".mx_RoomView_MessageList > li, .mx_RoomView_MessageList > div, .mx_RoomView_MessageList .mx_EventTile",
        );
        let bottom = 0;
        items.forEach((e) => {
            const b = (e as HTMLElement).getBoundingClientRect();
            if (b.height > 0 && b.top < r0.top) bottom = Math.max(bottom, Math.min(b.bottom, r0.top));
        });
        free = r0.top - bottom;
    }
    const show = !!composer && free > 130 && !document.querySelector(".mx_Dialog");
    hintLayer.style.display = show ? "block" : "none";
    if (!show || !composer) return;
    const r = composer.getBoundingClientRect();
    const note = hintLayer.firstElementChild as HTMLElement;
    note.style.left = `${Math.round(r.left + 24)}px`;
    note.style.top = `${Math.round(r.top - 92)}px`;
    void ctx;
}

function mountHints(ctx: EnhancerContext): void {
    hintLayer = document.createElement("div");
    hintLayer.className = "sk-hints";
    hintLayer.setAttribute("aria-hidden", "true");
    const note = document.createElement("div");
    note.className = "sk-hint";
    Object.assign(note.style, { position: "absolute", display: "flex", alignItems: "flex-end", gap: "6px" });
    const text = document.createElement("span");
    text.textContent = "Write something & press Enter!";
    Object.assign(text.style, { fontSize: "19px", lineHeight: "1.2", transform: "rotate(-2deg)", display: "inline-block" });
    const arrow = document.createElement("img");
    arrow.src = ctx.asset("assets/arrow-right.svg");
    arrow.alt = "";
    Object.assign(arrow.style, { width: "90px", height: "40px", transform: "rotate(62deg) translate(30px, -12px)", opacity: "0.45" });
    note.append(text, arrow);
    hintLayer.appendChild(note);
    ctx.root.appendChild(hintLayer);
}

/* ---------------------------------------------------------------- blueprint */
function updateBlueprint(): void {
    const lp = document.querySelector(".mx_LeftPanel") as HTMLElement | null;
    if (lp) lp.dataset.skW = String(Math.round(lp.getBoundingClientRect().width));
    const rp = document.querySelector(".mx_RightPanel") as HTMLElement | null;
    if (rp) rp.dataset.skW = String(Math.round(rp.getBoundingClientRect().width));
    const rv = document.querySelector(".mx_RoomView_body") as HTMLElement | null;
    if (rv) rv.dataset.skW = String(Math.round(rv.getBoundingClientRect().width));
    const header = document.querySelector(".mx_RoomHeader") as HTMLElement | null;
    if (header) {
        const items = [...document.querySelectorAll(".mx_RoomListItemView")];
        const sel = items.findIndex((e) => e.getAttribute("aria-selected") === "true" || e.className.includes("selected"));
        header.dataset.skSheet = `SHEET ${sel >= 0 ? sel + 1 : 1} OF ${Math.max(items.length, 1)}`;
    }
}

/* ---------------------------------------------------------------- page flip */
function checkRoomChange(ctx: EnhancerContext): void {
    const room = location.hash;
    if (room === lastRoom) return;
    const first = lastRoom === "";
    lastRoom = room;
    if (first || ctx.reducedMotion) return;
    const html = document.documentElement;
    html.classList.add("sk-flip");
    window.clearTimeout(flipTimer);
    flipTimer = window.setTimeout(() => html.classList.remove("sk-flip"), 380);
}

function schedule(ctx: EnhancerContext): void {
    if (raf) return;
    raf = requestAnimationFrame(() => {
        raf = 0;
        safe(() => {
            const id = ctx.variant.id;
            if (hintLayer) updateHints(ctx);
            if (id === "sketch-blueprint") updateBlueprint();
            if (id === "sketch-notebook" || (id === "sketch-daylight" && ctx.phase !== "night")) checkRoomChange(ctx);
        });
    });
}

function boilState(ctx: EnhancerContext): void {
    const html = document.documentElement;
    const boil = !ctx.reducedMotion && !document.hidden;
    html.classList.toggle("sk-boil", boil);
}

const enhancer: Enhancer = {
    mount(ctx: EnhancerContext): void {
        safe(() => {
            this.unmount();
            ctxRef = ctx;
            const id = ctx.variant.id;
            injectDefs(ctx);
            if (HINT_VARIANTS.has(id) && !(id === "sketch-daylight" && ctx.phase === "night")) mountHints(ctx);
            lastRoom = "";
            observer = new MutationObserver(() => schedule(ctx));
            observer.observe(document.body, { childList: true, subtree: true });
            const onResize = (): void => schedule(ctx);
            window.addEventListener("resize", onResize);
            window.addEventListener("hashchange", onResize);
            cleanups.push(() => window.removeEventListener("resize", onResize));
            cleanups.push(() => window.removeEventListener("hashchange", onResize));
            if (id === "sketch-blueprint" && "ResizeObserver" in window) {
                resizeObs = new ResizeObserver(() => schedule(ctx));
                const mc = document.querySelector(".mx_MatrixChat");
                if (mc) resizeObs.observe(mc);
            }
            if (id === "sketch-scribble" || id === "sketch-unreadable") {
                const vis = (): void => boilState(ctx);
                document.addEventListener("visibilitychange", vis);
                cleanups.push(() => document.removeEventListener("visibilitychange", vis));
                boilState(ctx);
            }
            schedule(ctx);
        });
    },
    onPhase(phase: string): void {
        safe(() => {
            const ctx = ctxRef;
            if (!ctx) return;
            ctx.phase = phase;
            if (ctx.variant.id === "sketch-daylight") {
                if (phase === "night") {
                    hintLayer?.remove();
                    hintLayer = null;
                } else if (!hintLayer) mountHints(ctx);
                schedule(ctx);
            }
        });
    },
    unmount(): void {
        try {
            observer?.disconnect();
            resizeObs?.disconnect();
            observer = null;
            resizeObs = null;
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
            window.clearTimeout(flipTimer);
            cleanups.splice(0).forEach((f) => f());
            defs?.remove();
            defs = null;
            hintLayer?.remove();
            hintLayer = null;
            const html = document.documentElement;
            html.classList.remove("sk-flip", "sk-boil");
            document.querySelectorAll("[data-sk-w]").forEach((e) => delete (e as HTMLElement).dataset.skW);
            document.querySelectorAll("[data-sk-sheet]").forEach((e) => delete (e as HTMLElement).dataset.skSheet);
            ctxRef = null;
        } catch {
            /* never throw into Element */
        }
    },
};

export default enhancer;
