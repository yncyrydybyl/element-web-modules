/**
 * theme-loader: Element Web module that applies element-web-themes variants (docs/CONTRACT.md).
 *
 * load() applies the cached/URL theme synchronously (and awaits its CSS briefly) so Element's first render is
 * already themed; account data sync, the scheduler, base sync, the settings tab and the quick switcher start after.
 * Nothing here ever rejects load() or throws into Element: failures are logged with "[theme-loader]".
 */
import React from "react";
import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";
import embeddedRegistry from "tl:registry";

import { Applier, resolveUrl } from "./applier";
import { BaseSync } from "./baseSync";
import { EnhancerRunner } from "./enhancers";
import { I18n } from "./i18n";
import { error, log, safe, warn } from "./log";
import { getParam, lsGet, lsSet } from "./params";
import { currentPhase, FORCE_PHASE_KEY, Scheduler } from "./scheduler";
import { ThemeStore } from "./store";
import type { Registry, Variant } from "./types";
import type { PickerController } from "./picker/controller";
import { SettingsInjector } from "./picker/settingsInjector";
import { ThemesTab } from "./picker/ThemesTab";
import { QuickSwitcher } from "./picker/QuickSwitcher";
import { LOADER_CSS } from "./picker/styles";

export const CONFIG_KEY = "de.datanauten.theme_loader";
const STYLE_ID = "tl-loader-style";

export interface LoaderConfig {
    /** Dev mode: URL (absolute or root-relative, trailing slash) of the dev server's live theme endpoint. */
    dev_base?: string;
    /** Theme for users who never chose one (default: Element default). */
    default_theme?: string | null;
    /** List hidden variants (e.g. the _demo family) in the picker. */
    show_hidden?: boolean;
    /** Max ms load() waits for a theme's CSS before letting Element render (default 1500). */
    css_timeout_ms?: number;
}

declare module "@element-hq/element-web-module-api" {
    export interface Config {
        [CONFIG_KEY]?: LoaderConfig;
    }
}

const EMPTY: Registry = { version: 1, families: [], variants: [] };

function isRegistry(r: unknown): r is Registry {
    return !!r && typeof r === "object" && Array.isArray((r as Registry).variants) && Array.isArray((r as Registry).families);
}

function moduleBase(): string {
    try {
        return new URL(".", import.meta.url).href;
    } catch {
        return `${window.location.origin}/element-modules/theme-loader/`;
    }
}

function timeout(ms: number): Promise<void> {
    return new Promise((r) => window.setTimeout(r, ms));
}

export class ThemeLoaderModule implements Module {
    public static readonly moduleApiVersion = "^1.14.0 || ^2.0.0";

    private cfg: LoaderConfig = {};
    private registry: Registry = EMPTY;
    private byId = new Map<string, Variant>();
    private dev = false;
    private devBase?: string;
    private assetBase = moduleBase();
    private applier!: Applier;
    private store!: ThemeStore;
    private scheduler!: Scheduler;
    private baseSync!: BaseSync;
    private enhancers!: EnhancerRunner;
    private injector?: SettingsInjector;
    private readonly i18n: I18n;
    private readonly listeners = new Set<() => void>();
    /** Saved choice (null: Element default). */
    private choice: string | null = null;
    private readonly urlTheme: string | null = getParam("tl_theme");
    private dialogOpen = false;
    /** The last applied theme before the current one (for enhancers' "take me back"). */
    private previous: string | null = lsGet("tl.previous");
    private started = false;

    public constructor(private readonly api: Api) {
        this.i18n = new I18n(api);
    }

    public async load(): Promise<void> {
        try {
            await this.init();
        } catch (e) {
            error("startup failed; Element continues without themes", e);
        }
    }

    private async init(): Promise<void> {
        this.i18n.register();
        this.cfg = safe("reading config", () => (this.api.config.get(CONFIG_KEY as never) ?? {}) as LoaderConfig) ?? {};
        if (typeof this.cfg !== "object" || this.cfg === null) this.cfg = {};
        this.dev = typeof this.cfg.dev_base === "string" && this.cfg.dev_base.length > 0;
        if (this.dev) this.devBase = resolveUrl(this.cfg.dev_base!.replace(/\/?$/, "/"), window.location.href);

        injectStyle();
        await this.loadRegistry();

        const assetBase = this.dev ? this.devBase! : this.assetBase;
        this.applier = new Applier({ assetBase, dev: this.dev });
        this.store = new ThemeStore(this.api);
        this.enhancers = new EnhancerRunner(this.api, {
            dev: this.dev,
            devBase: this.devBase,
            asset: (family, path) => this.asset(family, path),
            switchTheme: (id) => this.select(id),
            previousTheme: () => this.previous,
        });
        this.baseSync = new BaseSync(() => this.applier.desiredBase());
        this.scheduler = new Scheduler(
            () => this.applier.current,
            (phase) => this.onPhase(phase),
        );

        const cached = this.store.cached();
        this.choice = cached === undefined ? (this.cfg.default_theme ?? null) : cached;
        if (this.urlTheme && !this.byId.has(this.urlTheme) && this.urlTheme !== "none") {
            warn(`?tl_theme=${this.urlTheme}: unknown theme id`);
        }

        // Apply before Element's first render; wait for the CSS at most css_timeout_ms.
        const pending = this.applyEffective();
        this.started = true;
        await Promise.race([pending, timeout(this.cfg.css_timeout_ms ?? 1500)]);

        this.scheduler.start();
        this.baseSync.start();
        this.store.onRemote((theme) => {
            this.choice = theme;
            if (!this.urlTheme) void this.applyEffective();
            this.emit();
        });
        this.store.attach();
        this.startUi();
        log(
            `ready (${this.dev ? "dev" : "prod"}, ${this.registry.variants.length} variants, theme: ${this.applier.current?.id ?? "Element default"})`,
        );
    }

    private async loadRegistry(): Promise<void> {
        let reg: unknown = embeddedRegistry;
        if (this.dev) {
            try {
                const ctrl = new AbortController();
                const t = window.setTimeout(() => ctrl.abort(), 4000);
                const res = await fetch(resolveUrl("themes.json", this.devBase!), { cache: "no-store", signal: ctrl.signal });
                window.clearTimeout(t);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                reg = await res.json();
            } catch (e) {
                error("loading the dev registry failed", e);
                reg = null;
            }
        }
        if (!isRegistry(reg)) {
            if (reg !== null) error("registry is malformed");
            reg = EMPTY;
        }
        this.registry = reg as Registry;
        this.byId = new Map(this.registry.variants.filter((v) => v && typeof v.id === "string").map((v) => [v.id, v]));
        const problems = this.registry.problems ?? [];
        if (problems.length) {
            // Dev only: one collapsed warning, so work-in-progress families don't flood everyone's console.
            const active = this.urlTheme ?? this.store?.cached() ?? null;
            const fam = active ? this.byId.get(active)?.family : undefined;
            warn(`${problems.length} theme validation problem(s) (dev server); details in the Themes tab or /tl-dev/themes.json`);
            try {
                console.groupCollapsed("[theme-loader] validation problems");
                for (const p of problems) console.info(`${p.level} [${p.family}] ${p.message}`);
                console.groupEnd();
            } catch {
                /* ignore */
            }
            for (const p of problems.filter((x) => x.family === fam)) warn(`active family ${p.family}: ${p.message}`);
        }
    }

    private asset(family: string, path: string): string {
        let p = path.replace(/^\.?\//, "");
        let fam = family;
        const cross = /^@([^/]+)\/(.*)$/.exec(p);
        if (cross) [, fam, p] = cross;
        if (this.dev) return resolveUrl(`themes/${encodeURIComponent(fam)}/${p}`, this.devBase!);
        const mapped = this.registry.families.find((f) => f.family === fam)?.assets?.[p];
        return resolveUrl(mapped ?? `${fam}--${p.replace(/^assets\//, "").replace(/\//g, "--")}`, this.assetBase);
    }

    /** The id that should be applied now: URL override, else the saved choice. */
    private effectiveId(): string | null {
        if (this.urlTheme) return this.urlTheme === "none" ? null : this.urlTheme;
        return this.choice;
    }

    private applyEffective(): Promise<void> {
        return this.applyId(this.effectiveId());
    }

    private applyId(id: string | null): Promise<void> {
        try {
            const v = id ? (this.byId.get(id) ?? null) : null;
            if (id && !v) warn(`theme "${id}" is not in the registry; using Element default`);
            const phase = currentPhase(v);
            const before = this.applier.current?.id ?? null;
            if (this.started && before !== (v?.id ?? null)) {
                this.previous = before;
                lsSet("tl.previous", before);
            }
            const p = this.applier.apply(v, phase);
            this.scheduler?.reschedule();
            this.baseSync?.schedule();
            void this.enhancers.set(v, phase);
            this.emit();
            return p;
        } catch (e) {
            error("apply failed", e);
            return Promise.resolve();
        }
    }

    /** Apply and save, like a picker choice. */
    private select(id: string | null): void {
        if (id !== null && !this.byId.has(id)) {
            warn(`switchTheme: unknown theme "${id}"`);
            return;
        }
        this.choice = id;
        void this.store.save(id);
        void this.applyId(id);
    }

    private onPhase(phase: string | null): void {
        if (!this.applier.current || phase === this.applier.phase) return;
        this.applier.setPhase(phase, true);
        this.baseSync.schedule();
        this.enhancers.phase(phase);
        this.emit();
    }

    private emit(): void {
        for (const l of this.listeners) {
            try {
                l();
            } catch (e) {
                error("listener failed", e);
            }
        }
    }

    private controller(): PickerController {
        return {
            registry: () => this.registry,
            chosen: () => this.choice,
            applied: () => this.applier.current?.id ?? null,
            urlOverride: () => this.urlTheme,
            select: (id) => this.select(id),
            preview: (id) => void this.applyId(id),
            variant: (id) => (id ? (this.byId.get(id) ?? null) : null),
            phase: () => this.applier.phase,
            forcedPhase: () => lsGet(FORCE_PHASE_KEY),
            setForcedPhase: (p) => {
                lsSet(FORCE_PHASE_KEY, p);
                this.scheduler.tick();
                this.emit();
            },
            subscribe: (fn) => {
                this.listeners.add(fn);
                return () => this.listeners.delete(fn);
            },
            t: (k) => this.i18n.t(k),
            lang: () => this.i18n.lang,
            showHidden: () => this.dev || !!this.cfg.show_hidden || getParam("tl_hidden") === "1",
        };
    }

    private startUi(): void {
        const c = this.controller();
        safe("settings tab", () => {
            this.injector = new SettingsInjector(
                (container) => {
                    const root = this.api.createRoot(container);
                    root.render(<ThemesTab c={c} />);
                    return () => root.unmount();
                },
                () => this.i18n.t("tl_tab"),
            );
            this.injector.start();
        });
        window.addEventListener(
            "keydown",
            (e) => {
                if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyT") {
                    e.preventDefault();
                    e.stopPropagation();
                    this.openQuickSwitcher();
                }
            },
            true,
        );
    }

    public openQuickSwitcher(): void {
        if (this.dialogOpen) return;
        try {
            if (typeof this.api.openDialog !== "function") return;
            this.dialogOpen = true;
            const c = this.controller();
            const handle = this.api.openDialog<null, { c: PickerController }>(
                { title: this.i18n.t("tl_quick_title") },
                QuickSwitcher as never,
                { c },
            );
            void handle.finished.finally(() => (this.dialogOpen = false));
        } catch (e) {
            this.dialogOpen = false;
            error("opening the quick switcher failed", e);
        }
    }
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = LOADER_CSS;
    document.head.appendChild(el);
}

export default ThemeLoaderModule satisfies ModuleFactory;
