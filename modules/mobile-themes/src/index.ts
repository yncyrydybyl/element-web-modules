/**
 * mobile-themes: Element Web module (skeleton).
 *
 * Today it only (1) marks the document with html[data-mt-mobile] when the viewport is narrow or the primary pointer is
 * coarse, and keeps that up to date, and (2) injects one stylesheet whose rules are all scoped to that attribute.
 * The actual mobile fixes are tracked in docs/MOBILE-ISSUES.md and land here step by step.
 *
 * Like the theme loader: load() never rejects and never throws into Element; everything is logged with
 * "[mobile-themes]". Note: Element's mobile-UA redirect to /mobile_guide/ runs in vector/index.ts *before* modules
 * are loaded, so this module cannot prevent it (see MOB-01).
 */
import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";
import CSS from "./mobile.css";

import { applyState, clearState, computeState, type DetectOptions, type Force, watch } from "./detect";

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
            injectStyle(CSS);
            this.dispose = watch(opts, (s) => {
                try {
                    applyState(s);
                } catch (e) {
                    console.error(P, "update failed", e);
                }
            });
            console.info(P, `loaded: mobile=${initial.mobile} (${initial.reasons.join(",") || "desktop"}), max_width=${maxWidth}`);
        } catch (e) {
            // never break Element
            console.error(P, "load failed", e);
        }
    }
}

export default MobileThemes satisfies ModuleFactory;
