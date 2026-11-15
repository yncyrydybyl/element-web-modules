/**
 * Puts a variant into the page: <html> attributes, the token sheet, @font-face rules, the theme CSS (inline
 * <style>, URLs made absolute) and the `tl-important` layer declaration. Removing a theme removes every node and
 * attribute again, so Element is back exactly as it was.
 */
import type { ResolvedFont, Variant } from "./types";
import { error, warn } from "./log";
import { lsGet, lsSet } from "./params";

const ATTRS = ["data-tl-theme", "data-tl-family", "data-tl-phase", "data-tl-base"] as const;
const IDS = { tokens: "tl-tokens", fonts: "tl-fonts", important: "tl-important" };
const CSS_CLASS = "tl-css";
const CSS_CACHE_KEY = "tl.cssCache";

export interface ApplierOptions {
    /** Absolute URL (with trailing slash) that registry-relative URLs resolve against. */
    assetBase: string;
    dev: boolean;
}

export function resolveUrl(rel: string, base: string): string {
    try {
        return new URL(rel, base).href;
    } catch {
        return rel;
    }
}

/** Makes every relative url(…) in a stylesheet absolute against the stylesheet's own URL. */
export function absolutiseUrls(css: string, fileUrl: string): string {
    return css.replace(/url\(\s*(['"]?)([^'")]*)\1\s*\)/g, (m, _q: string, ref: string) => {
        const r = ref.trim();
        if (!r || /^(data:|https?:|blob:|#|\/\/)/i.test(r)) return m;
        return `url("${resolveUrl(r, fileUrl)}")`;
    });
}

const TOKEN_NAME = /^--[A-Za-z0-9_-]+$/;
const BAD_VALUE = /[{};<>]/;
/** Font tokens are also set inline on <body> by Element's FontWatcher; only an unlayered !important beats that. */
const IMPORTANT_TOKENS = /^--(cpd-font-family-|emoji-font-family)/;

export function cssString(s: string): string {
    return `"${s.replace(/["\\\n]/g, (c) => (c === "\n" ? " " : `\\${c}`))}"`;
}

export function tokenSheet(variant: Variant): string {
    const id = cssString(variant.id);
    const decls: string[] = [];
    for (const [k, v] of Object.entries(variant.tokens ?? {})) {
        if (!TOKEN_NAME.test(k) || typeof v !== "string" || BAD_VALUE.test(v)) {
            warn(`ignoring invalid token ${k} in ${variant.id}`);
            continue;
        }
        decls.push(`  ${k}: ${v}${IMPORTANT_TOKENS.test(k) && !/!important/.test(v) ? " !important" : ""};`);
    }
    if (!decls.length) return "";
    const sel = `html[data-tl-theme=${id}]`;
    return `${sel},\n${sel} body,\n${sel} [class*="cpd-theme-"] {\n${decls.join("\n")}\n}\n`;
}

export function fontSheet(fonts: ResolvedFont[], base: string): string {
    return fonts
        .filter((f) => f && typeof f.family === "string" && (f.url || f.local?.length))
        .map((f) => {
            const src = [
                ...(f.local ?? []).map((l) => `local(${cssString(l)})`),
                ...(f.url ? [`url(${cssString(resolveUrl(f.url, base))})${fontFormat(f.url)}`] : []),
            ].join(", ");
            return [
                "@font-face {",
                `  font-family: ${cssString(f.family)};`,
                `  src: ${src};`,
                `  font-weight: ${f.weight ?? "400"};`,
                `  font-style: ${f.style ?? "normal"};`,
                `  font-display: ${f.display ?? "swap"};`,
                f.unicodeRange ? `  unicode-range: ${f.unicodeRange};` : "",
                "}",
            ]
                .filter(Boolean)
                .join("\n");
        })
        .join("\n");
}

function fontFormat(url: string): string {
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
    const f = { woff2: "woff2", woff: "woff", ttf: "truetype", otf: "opentype" }[ext ?? ""];
    return f ? ` format("${f}")` : "";
}

interface CssCache {
    key: string;
    css: { url: string; text: string }[];
}

export class Applier {
    public current: Variant | null = null;
    public phase: string | null = null;
    private generation = 0;
    private readonly memo = new Map<string, string>();
    private originalThemeColor?: string | null;
    private fadeTimer?: number;

    public constructor(private readonly opts: ApplierOptions) {}

    public get base(): string {
        return this.opts.assetBase;
    }

    /** The Element base the current theme/phase wants, or null for Element default. */
    public desiredBase(): "light" | "dark" | null {
        if (!this.current) return null;
        const phaseBase = this.current.schedule?.find((p) => p.phase === this.phase)?.base;
        return phaseBase ?? this.current.base ?? null;
    }

    /**
     * Applies a variant. Attributes, tokens and fonts are synchronous; CSS is synchronous when cached, otherwise the
     * returned promise resolves once it is in the page.
     */
    public apply(variant: Variant | null, phase: string | null): Promise<void> {
        const gen = ++this.generation;
        try {
            if (!variant) {
                this.clear();
                return Promise.resolve();
            }
            const html = document.documentElement;
            this.current = variant;
            this.phase = variant.mode === "daylight" ? phase : null;
            html.setAttribute("data-tl-theme", variant.id);
            html.setAttribute("data-tl-family", variant.family);
            if (this.phase) html.setAttribute("data-tl-phase", this.phase);
            else html.removeAttribute("data-tl-phase");
            html.setAttribute("data-tl-base", this.desiredBase() ?? variant.base);

            this.ensureImportantLayer();
            this.setStyle(IDS.tokens, tokenSheet(variant));
            this.setStyle(IDS.fonts, fontSheet(variant.fonts ?? [], this.opts.assetBase));

            const urls = variant.css.map((u) => resolveUrl(u, this.opts.assetBase));
            const key = `${variant.id}|${urls.join("|")}`;
            const cached = this.readCache(key, urls);
            if (cached) {
                this.setCss(cached);
                this.updateThemeColor();
                return Promise.resolve();
            }
            // Keep the previous theme's CSS until the new one is there? No: it is scoped to the old id and inert.
            this.setCss([]);
            return Promise.all(urls.map((u) => this.fetchCss(u)))
                .then((texts) => {
                    if (gen !== this.generation) return;
                    const css = urls.map((url, i) => ({ url, text: texts[i] }));
                    this.setCss(css);
                    this.writeCache(key, css);
                    this.updateThemeColor();
                })
                .catch((e) => error(`loading CSS for ${variant.id} failed`, e));
        } catch (e) {
            error(`applying ${variant?.id ?? "Element default"} failed`, e);
            return Promise.resolve();
        }
    }

    /** Switches the daylight phase of the current variant (fades unless reduced motion). */
    public setPhase(phase: string | null, fade: boolean): void {
        if (!this.current || this.current.mode !== "daylight" || phase === this.phase) return;
        const html = document.documentElement;
        if (fade) {
            html.setAttribute("data-tl-phase-fading", "");
            window.clearTimeout(this.fadeTimer);
            this.fadeTimer = window.setTimeout(() => html.removeAttribute("data-tl-phase-fading"), 2300);
        }
        this.phase = phase;
        if (phase) html.setAttribute("data-tl-phase", phase);
        else html.removeAttribute("data-tl-phase");
        html.setAttribute("data-tl-base", this.desiredBase() ?? this.current.base);
        window.setTimeout(() => this.updateThemeColor(), 50);
    }

    public clear(): void {
        const html = document.documentElement;
        for (const a of ATTRS) html.removeAttribute(a);
        html.removeAttribute("data-tl-phase-fading");
        for (const id of Object.values(IDS)) document.getElementById(id)?.remove();
        document.querySelectorAll(`style.${CSS_CLASS}`).forEach((n) => n.remove());
        this.current = null;
        this.phase = null;
        this.restoreThemeColor();
    }

    private ensureImportantLayer(): void {
        // Declaring the layer name before Element's stylesheets makes it the *earliest* layer, and for !important
        // declarations the earliest layer wins: theme CSS can write `@layer tl-important { … !important }` to beat
        // Element's layered !important rules (e.g. body font).
        let el = document.getElementById(IDS.important);
        if (!el) {
            el = document.createElement("style");
            el.id = IDS.important;
            el.textContent = "@layer tl-important;";
        }
        if (document.head.firstChild !== el) document.head.prepend(el);
    }

    private setStyle(id: string, text: string): void {
        let el = document.getElementById(id) as HTMLStyleElement | null;
        if (!text) {
            el?.remove();
            return;
        }
        if (!el) {
            el = document.createElement("style");
            el.id = id;
            document.head.appendChild(el);
        }
        if (el.textContent !== text) el.textContent = text;
    }

    private setCss(css: { url: string; text: string }[]): void {
        const existing = Array.from(document.querySelectorAll<HTMLStyleElement>(`style.${CSS_CLASS}`));
        css.forEach(({ url, text }, i) => {
            let el = existing[i];
            if (!el) {
                el = document.createElement("style");
                el.className = CSS_CLASS;
                document.head.appendChild(el);
            }
            el.dataset.tlFile = url;
            const abs = absolutiseUrls(text, url);
            if (el.textContent !== abs) el.textContent = abs;
        });
        existing.slice(css.length).forEach((n) => n.remove());
        // Keep the token sheet before the theme CSS so CSS can refine tokens.
        const tokens = document.getElementById(IDS.tokens);
        const fonts = document.getElementById(IDS.fonts);
        const first = document.querySelector(`style.${CSS_CLASS}`);
        if (first && tokens && tokens.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_PRECEDING) {
            first.before(tokens);
        }
        if (first && fonts && fonts.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_PRECEDING) {
            first.before(fonts);
        }
    }

    private async fetchCss(url: string): Promise<string> {
        if (!this.opts.dev && this.memo.has(url)) return this.memo.get(url)!;
        const res = await fetch(url, { cache: this.opts.dev ? "no-store" : "default", credentials: "same-origin" });
        if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
        const text = await res.text();
        if (!this.opts.dev) this.memo.set(url, text);
        return text;
    }

    private readCache(key: string, urls: string[]): { url: string; text: string }[] | null {
        if (this.opts.dev) return null;
        if (urls.every((u) => this.memo.has(u))) return urls.map((url) => ({ url, text: this.memo.get(url)! }));
        try {
            const raw = lsGet(CSS_CACHE_KEY);
            if (!raw) return null;
            const c = JSON.parse(raw) as CssCache;
            return c.key === key && Array.isArray(c.css) ? c.css : null;
        } catch {
            return null;
        }
    }

    private writeCache(key: string, css: { url: string; text: string }[]): void {
        if (this.opts.dev) return;
        const value = JSON.stringify({ key, css } satisfies CssCache);
        // Stay well below the ~5 MB localStorage quota; big themes just load from the network.
        lsSet(CSS_CACHE_KEY, value.length < 1_500_000 ? value : null);
    }

    private updateThemeColor(): void {
        try {
            const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
            if (!meta || !this.current) return;
            if (this.originalThemeColor === undefined) this.originalThemeColor = meta.getAttribute("content");
            const bg = getComputedStyle(document.body).backgroundColor;
            if (bg) meta.setAttribute("content", bg);
        } catch {
            /* cosmetic */
        }
    }

    private restoreThemeColor(): void {
        if (this.originalThemeColor === undefined) return;
        const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
        if (meta) {
            if (this.originalThemeColor === null) meta.removeAttribute("content");
            else meta.setAttribute("content", this.originalThemeColor);
        }
        this.originalThemeColor = undefined;
    }
}
