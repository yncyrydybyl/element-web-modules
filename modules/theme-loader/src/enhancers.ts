/**
 * Runs a family's enhance.ts for variants with `enhance: true` (CONTRACT §5). Production: all enhancers are bundled
 * into index.js. Dev: each family's enhancer is bundled on demand by the dev server and imported fresh on every page
 * load, so one family's syntax error can't break the others.
 */
import type { Api } from "@element-hq/element-web-module-api";
import bundled from "tl:enhancers";
import type { Enhancer, Variant } from "./types";
import { error, log } from "./log";
import { resolveUrl } from "./applier";

const ROOT_ID = "tl-overlay-root";

function unwrap(m: unknown): Enhancer | undefined {
    const e = (m && typeof m === "object" && "default" in m ? (m as { default: unknown }).default : m) as Enhancer | undefined;
    return e && typeof e.mount === "function" ? e : undefined;
}

export class EnhancerRunner {
    private active?: { variantId: string; enhancer: Enhancer };
    private generation = 0;

    public constructor(
        private readonly api: Api,
        private readonly opts: {
            dev: boolean;
            devBase?: string;
            asset: (family: string, path: string) => string;
            switchTheme: (id: string | null) => void;
            previousTheme: () => string | null;
        },
    ) {}

    public async set(variant: Variant | null, phase: string | null): Promise<void> {
        const gen = ++this.generation;
        if (this.active && this.active.variantId === variant?.id) return;
        this.unmount();
        if (!variant || !variant.enhance) return;
        const enhancer = await this.load(variant.family);
        if (!enhancer || gen !== this.generation) return;
        const root = this.root();
        const reducedMotion = (() => {
            try {
                return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            } catch {
                return false;
            }
        })();
        try {
            this.active = { variantId: variant.id, enhancer };
            await enhancer.mount({
                variant,
                root,
                api: this.api,
                phase,
                reducedMotion,
                asset: (path: string) => this.opts.asset(variant.family, path),
                log: (...a: unknown[]) => log(`[${variant.family}]`, ...a),
                // Deferred: an enhancer may call this from inside mount()/a click handler that unmount() tears down.
                switchTheme: (id: string | null) => void Promise.resolve().then(() => this.opts.switchTheme(id)),
                previousTheme: () => this.opts.previousTheme(),
            });
        } catch (e) {
            error(`enhancer ${variant.family} mount failed`, e);
        }
    }

    public phase(phase: string | null): void {
        const e = this.active?.enhancer;
        if (!e?.onPhase || phase === null) return;
        try {
            e.onPhase(phase);
        } catch (err) {
            error("enhancer onPhase failed", err);
        }
    }

    public unmount(): void {
        const a = this.active;
        this.active = undefined;
        if (a) {
            try {
                a.enhancer.unmount();
            } catch (e) {
                error("enhancer unmount failed", e);
            }
        }
        const root = document.getElementById(ROOT_ID);
        if (root) {
            root.replaceChildren();
            root.remove();
        }
    }

    private root(): HTMLElement {
        let root = document.getElementById(ROOT_ID);
        if (!root) {
            root = document.createElement("div");
            root.id = ROOT_ID;
            root.setAttribute("data-tl-overlay", "");
            root.setAttribute("aria-hidden", "false");
            document.body.appendChild(root);
        }
        return root;
    }

    private async load(family: string): Promise<Enhancer | undefined> {
        try {
            if (!this.opts.dev) {
                const e = unwrap(bundled[family]);
                if (!e) error(`no enhancer bundled for family ${family}`);
                return e;
            }
            const url = resolveUrl(`enhance/${encodeURIComponent(family)}.js?t=${Date.now()}`, this.opts.devBase!);
            const m = await import(/* @vite-ignore */ url);
            const e = unwrap(m);
            if (!e) error(`${url} has no default export with mount()`);
            return e;
        } catch (e) {
            error(`loading enhancer for ${family} failed`, e);
            return undefined;
        }
    }
}
