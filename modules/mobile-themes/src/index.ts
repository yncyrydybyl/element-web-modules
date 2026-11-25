/**
 * mobile-themes: Element Web module that makes Element Web usable on phones.
 *
 *  - detect.ts    html[data-mt-mobile|compact|pointer|orientation] (live)
 *  - mobile.css   the scoped stylesheet (every rule starts with html[data-mt-…]; desktop is untouched)
 *  - shell.ts     single-pane shell: html[data-mt-view="list|room|panel"], back button, history/back gesture
 *  - touch.ts     long-press → Element's message context menu
 *  - keyboard.ts  visual-viewport sizing while the on-screen keyboard is up, viewport meta (safe areas)
 *  - notify.ts    Android `new Notification()` → service worker fallback
 * Issue ids (MOB-xx) refer to docs/MOBILE-ISSUES.md.
 *
 * Like the theme loader: load() never rejects and never throws into Element; everything is logged with
 * "[mobile-themes]". Note: Element's mobile-UA redirect to /mobile_guide/ runs in vector/index.ts *before* modules
 * are loaded, so this module cannot prevent it (see MOB-01).
 */
import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";
import CSS from "./mobile.css";

import { applyState, clearState, computeState, type DetectOptions, type DetectState, type Force, watch } from "./detect";
import { startKeyboard, syncViewportMeta } from "./keyboard";
import { installNotificationShim } from "./notify";
import { Shell } from "./shell";
import { startTouch } from "./touch";

export const CONFIG_KEY = "de.datanauten.mobile_themes";
const STYLE_ID = "mt-mobile-style";
const P = "[mobile-themes]";

export interface MobileThemesConfig {
    /** false disables the module entirely (no attributes, no stylesheet). Default true. */
    enabled?: boolean;
    /** Narrow breakpoint in CSS px (default 768, the width at which Element auto-collapses its room list). */
    max_width?: number;
    /** Force the mobile treatment on/off regardless of detection (default: detect). */
    force?: "on" | "off" | null;
    /** Single-pane shell on phone-sized screens (default true). */
    shell?: boolean;
    /** Push same-URL history entries so the browser/OS back gesture goes one pane back (default true). */
    history?: boolean;
    /** Long-press on a message opens Element's message menu (default true). */
    long_press?: boolean;
    /** Visual-viewport keyboard handling + viewport-fit=cover (default true). */
    keyboard?: boolean;
    /** Android Notification constructor shim (default true). */
    notification_shim?: boolean;
}

declare module "@element-hq/element-web-module-api" {
    export interface Config {
        [CONFIG_KEY]?: MobileThemesConfig;
    }
}

function urlForce(): Force {
    try {
        const v = new URLSearchParams(window.location.search).get("mt_mobile");
        if (v === "1" || v === "on") return "on";
        if (v === "0" || v === "off") return "off";
    } catch {
        /* ignore */
    }
    return null;
}

function readConfig(api: Api): MobileThemesConfig {
    try {
        const c = api.config.get(CONFIG_KEY as never) as unknown;
        return c && typeof c === "object" ? (c as MobileThemesConfig) : {};
    } catch {
        return {};
    }
}

/**
 * `@layer mt-important;` declared before Element's stylesheets: for !important declarations the earliest layer wins,
 * so `@layer mt-important { … !important }` in mobile.css beats Element's layered !important (same trick as the theme
 * loader's tl-important; both just have to precede Element's CSS, their mutual order doesn't matter).
 */
function ensureImportantLayer(): void {
    if (document.getElementById("mt-important")) return;
    const el = document.createElement("style");
    el.id = "mt-important";
    el.textContent = "@layer mt-important;";
    const firstSheet = document.head.querySelector('link[rel="stylesheet"], style:not(#tl-important)');
    if (firstSheet) document.head.insertBefore(el, firstSheet);
    else document.head.prepend(el);
}

export function injectStyle(css: string): HTMLStyleElement {
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        document.head.appendChild(el);
    }
    if (el.textContent !== css) el.textContent = css;
    return el;
}

class MobileThemes implements Module {
    public static readonly moduleApiVersion = "^1.14.0 || ^2.0.0";
    private dispose: (() => void) | null = null;

    public constructor(private readonly api: Api) {}

    public async load(): Promise<void> {
        try {
            const cfg = readConfig(this.api);
            if (cfg.enabled === false) {
                clearState();
                console.info(P, "disabled by config");
                return;
            }
            const maxWidth = Number.isFinite(cfg.max_width) && (cfg.max_width as number) > 0 ? (cfg.max_width as number) : 768;
            const force: Force = urlForce() ?? (cfg.force === "on" || cfg.force === "off" ? cfg.force : null);
            const opts: DetectOptions = { maxWidth, force };

            const initial = computeState(opts);
            applyState(initial);
            ensureImportantLayer();
            injectStyle(CSS);
            const disposers: Array<() => void> = [];
            const on = (k: keyof MobileThemesConfig): boolean => cfg[k] !== false;
            const guard = (name: string, fn: () => void): void => {
                try {
                    fn();
                } catch (e) {
                    console.error(P, `${name} failed`, e);
                }
            };
            let shell: Shell | null = null;
            if (on("shell")) {
                guard("shell", () => {
                    shell = new Shell(this.api, { history: on("history") });
                    shell.start();
                    disposers.push(() => shell?.stop());
                });
            }
            if (on("long_press")) guard("touch", () => disposers.push(startTouch()));
            if (on("keyboard")) {
                guard("keyboard", () => {
                    disposers.push(startKeyboard());
                    syncViewportMeta(initial.mobile);
                });
            }
            if (on("notification_shim")) guard("notification shim", () => installNotificationShim());
            const onState = (s: DetectState): void => {
                try {
                    applyState(s);
                    if (on("keyboard")) syncViewportMeta(s.mobile);
                    (shell as Shell | null)?.refresh();
                } catch (e) {
                    console.error(P, "update failed", e);
                }
            };
            const unwatch = watch(opts, onState);
            this.dispose = () => {
                unwatch();
                for (const d of disposers) d();
            };
            console.info(P, `loaded: mobile=${initial.mobile} (${initial.reasons.join(",") || "desktop"}), max_width=${maxWidth}`);
        } catch (e) {
            // never break Element
            console.error(P, "load failed", e);
        }
    }
}

export default MobileThemes satisfies ModuleFactory;
