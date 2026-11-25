import type { Enhancer, EnhancerContext } from "../../src/types";

/*
 * Enlightenment family enhancer.
 * - Shelf clock gadget docked at the bottom of the space panel (analog / digital / flip / E16 epplet style).
 * - e16-brushed-metal: marks the "window" (panel) holding keyboard focus with data-e-active so its title bar is
 *   drawn active and the others inactive.
 * Overlay only (ctx.root); the only DOM change to Element is attributes, removed again in unmount().
 */

type ClockKind = "analog" | "digital" | "flip" | "epplet" | "none";

const CLOCK: Record<string, ClockKind> = {
    "e16-brushed-metal": "epplet",
    "e17-glow": "analog",
    "e-current": "digital",
    "e-aurora": "analog",
    "e-ember": "flip",
    "e-neon-steel": "digital",
    "e-usable": "none",
    "e-daylight": "analog",
};

const SVG_NS = "http://www.w3.org/2000/svg";
const WINDOWS = ".mx_Dialog, .mx_RightPanel, .mx_RoomView, .mx_LeftPanel, .mx_SpacePanel";

let clockEl: HTMLElement | null = null;
let hands: { h: SVGElement; m: SVGElement; s: SVGElement | null } | null = null;
let digits: HTMLElement | null = null;
let timer: number | null = null;
let kind: ClockKind = "none";
let focusHandler: ((e: FocusEvent) => void) | null = null;
let visHandler: (() => void) | null = null;
let reduced = false;

function el<K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string>): SVGElementTagNameMap[K] {
    const n = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
}

function buildAnalog(root: HTMLElement): void {
    const svg = el("svg", { viewBox: "0 0 48 48", width: "44", height: "44", "aria-hidden": "true" });
    svg.append(el("circle", { cx: "24", cy: "24", r: "22", class: "e-clock-face" }));
    for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        const r1 = i % 3 === 0 ? 15.5 : 17.5;
        svg.append(
            el("line", {
                x1: String(24 + Math.sin(a) * r1),
                y1: String(24 - Math.cos(a) * r1),
                x2: String(24 + Math.sin(a) * 19.5),
                y2: String(24 - Math.cos(a) * 19.5),
                class: "e-clock-tick",
            }),
        );
    }
    const h = el("line", { x1: "24", y1: "24", x2: "24", y2: "13", class: "e-clock-hand e-clock-h" });
    const m = el("line", { x1: "24", y1: "24", x2: "24", y2: "7", class: "e-clock-hand e-clock-m" });
    const s = reduced ? null : el("line", { x1: "24", y1: "27", x2: "24", y2: "6", class: "e-clock-hand e-clock-s" });
    svg.append(h, m);
    if (s) svg.append(s);
    svg.append(el("circle", { cx: "24", cy: "24", r: "1.8", class: "e-clock-pin" }));
    root.append(svg);
    hands = { h, m, s };
}

function buildDigital(root: HTMLElement): void {
    digits = document.createElement("div");
    digits.className = "e-clock-digits";
    root.append(digits);
}

function position(): void {
    if (!clockEl) return;
    const panel = document.querySelector<HTMLElement>(".mx_SpacePanel");
    if (!panel || panel.offsetParent === null) {
        clockEl.style.display = "none";
        return;
    }
    const pr = panel.getBoundingClientRect();
    const anchor =
        panel.querySelector<HTMLElement>(".mx_ThreadsActivityCentre_container") ||
        panel.querySelector<HTMLElement>(".mx_QuickSettingsButton");
    const bottom = anchor ? anchor.getBoundingClientRect().top : pr.bottom - 8;
    const h = clockEl.offsetHeight || 48;
    clockEl.style.display = "";
    clockEl.style.left = `${Math.round(pr.left)}px`;
    clockEl.style.width = `${Math.round(pr.width)}px`;
    clockEl.style.top = `${Math.round(bottom - h - 6)}px`;
}

function tick(): void {
    const d = new Date();
    if (hands) {
        const s = d.getSeconds();
        const m = d.getMinutes() + s / 60;
        const h = (d.getHours() % 12) + m / 60;
        hands.h.setAttribute("transform", `rotate(${h * 30} 24 24)`);
        hands.m.setAttribute("transform", `rotate(${m * 6} 24 24)`);
        hands.s?.setAttribute("transform", `rotate(${s * 6} 24 24)`);
    }
    if (digits) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        if (digits.dataset.t === `${hh}:${mm}`) {
            position();
            return;
        }
        digits.dataset.t = `${hh}:${mm}`;
        if (kind === "flip") {
            digits.innerHTML = "";
            for (const ch of `${hh}:${mm}`) {
                const c = document.createElement("span");
                c.className = ch === ":" ? "e-flip-colon" : "e-flip-card";
                c.textContent = ch;
                digits.append(c);
            }
        } else {
            digits.textContent = `${hh}:${mm}`;
        }
    }
    position();
}

function startTimer(): void {
    stopTimer();
    tick();
    timer = window.setInterval(tick, 1000);
}

function stopTimer(): void {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
}

function mountClock(ctx: EnhancerContext): void {
    kind = CLOCK[ctx.variant.id] ?? "none";
    if (kind === "none") return;
    clockEl = document.createElement("div");
    clockEl.className = `e-clock e-clock--${kind}`;
    clockEl.setAttribute("aria-hidden", "true");
    clockEl.style.position = "absolute";
    if (kind === "analog" || kind === "epplet") buildAnalog(clockEl);
    else buildDigital(clockEl);
    ctx.root.append(clockEl);
    document.documentElement.setAttribute("data-e-clock", kind);
    visHandler = () => (document.hidden ? stopTimer() : startTimer());
    document.addEventListener("visibilitychange", visHandler);
    startTimer();
}

function mountFocusTracking(): void {
    focusHandler = (e: FocusEvent) => {
        const t = e.target as Element | null;
        const win = t?.closest?.(WINDOWS);
        if (!win) return;
        document.querySelectorAll("[data-e-active]").forEach((n) => n !== win && n.removeAttribute("data-e-active"));
        win.setAttribute("data-e-active", "");
    };
    document.addEventListener("focusin", focusHandler, true);
    document.addEventListener("pointerdown", focusHandler as unknown as EventListener, true);
}

const enhancer: Enhancer = {
    mount(ctx: EnhancerContext): void {
        try {
            reduced = ctx.reducedMotion;
            mountClock(ctx);
            if (ctx.variant.id === "e16-brushed-metal") mountFocusTracking();
        } catch (e) {
            ctx.log("enlightenment enhancer failed", e);
        }
    },
    onPhase(phase: string): void {
        if (clockEl) clockEl.setAttribute("data-phase", phase);
    },
    unmount(): void {
        stopTimer();
        if (visHandler) document.removeEventListener("visibilitychange", visHandler);
        if (focusHandler) {
            document.removeEventListener("focusin", focusHandler, true);
            document.removeEventListener("pointerdown", focusHandler as unknown as EventListener, true);
        }
        document.querySelectorAll("[data-e-active]").forEach((n) => n.removeAttribute("data-e-active"));
        document.documentElement.removeAttribute("data-e-clock");
        clockEl?.remove();
        clockEl = null;
        hands = null;
        digits = null;
        visHandler = null;
        focusHandler = null;
        kind = "none";
    },
};

export default enhancer;
