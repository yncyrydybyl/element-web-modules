/*
 * openDesk family enhancer (docs/styleguides/opendesk.md §6):
 *  - an openDesk suite top bar (app grid + wordmark → portal), like the portal / Nextcloud / OX header;
 *  - the app grid opens an "Applications" popover with the openDesk app tiles, links from config.
 *
 * On a real openDesk deployment Element already carries openDesk's own banner module
 * (io.element.element-web-modules.banner: a <nav> next to #matrixchat). Then nothing is added
 * (topbar "auto") and the CSS restyles that banner instead.
 *
 * Config (config.json, all optional):
 *   "de.datanauten.theme_loader": { "opendesk": {
 *       "topbar": "auto" | "always" | "never",       // default "auto"
 *       "portal_url": "https://portal.example.org/",
 *       "apps": [ { "id": "files", "name": "Dateien", "url": "https://files.example.org/" }, … ]
 *   } }
 * Without "apps", openDesk's default host names are derived when Element runs on chat.<domain>
 * (portal., files., webmail., projects., wiki., meet., notes.); elsewhere the grid button is hidden.
 */
import type { EnhancerContext } from "../../loader/src/types";

interface AppLink {
    id?: string;
    name: string;
    url: string;
    icon?: string;
}
interface OdConfig {
    topbar?: "auto" | "always" | "never";
    portal_url?: string;
    apps?: AppLink[];
}

const ICONS: Record<string, string> = {
    files: "assets/od-app-files.svg",
    mail: "assets/od-app-mail.svg",
    calendar: "assets/od-app-calendar.svg",
    contacts: "assets/od-app-contacts.svg",
    tasks: "assets/od-app-tasks.svg",
    projects: "assets/od-app-projects.svg",
    knowledge: "assets/od-app-knowledge.svg",
    videoconference: "assets/od-app-videoconference.svg",
    chat: "assets/od-app-chat.svg",
    notes: "assets/od-app-notes.svg",
    whiteboard: "assets/od-app-whiteboard.svg",
};
const NAMES: Record<string, [string, string]> = {
    files: ["Files", "Dateien"],
    mail: ["Email", "E-Mail"],
    calendar: ["Calendar", "Kalender"],
    contacts: ["Contacts", "Kontakte"],
    tasks: ["Tasks", "Aufgaben"],
    projects: ["Projects", "Projekte"],
    knowledge: ["Knowledge", "Wissen"],
    videoconference: ["Videoconference", "Videokonferenz"],
    chat: ["Chat", "Chat"],
    notes: ["Notes", "Notizen"],
};
const GRID_SVG =
    '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="4" cy="4" r="1.8"/><circle cx="10" cy="4" r="1.8"/><circle cx="16" cy="4" r="1.8"/>' +
    '<circle cx="4" cy="10" r="1.8"/><circle cx="10" cy="10" r="1.8"/><circle cx="16" cy="10" r="1.8"/>' +
    '<circle cx="4" cy="16" r="1.8"/><circle cx="10" cy="16" r="1.8"/><circle cx="16" cy="16" r="1.8"/></svg>';

const CLOCK = new Set(["opendesk-hyperdesk", "opendesk-2028"]);

let cleanups: Array<() => void> = [];

const german = (): boolean => /^de\b/i.test(document.documentElement.lang || navigator.language || "");
const label = (id: string): string => (NAMES[id] ? NAMES[id][german() ? 1 : 0] : id);

function configValue(ctx: EnhancerContext, key: string): unknown {
    try {
        const cfg = (ctx.api as unknown as { config?: { get?: (k: string) => unknown } }).config;
        return cfg?.get ? cfg.get.call(cfg, key) : undefined;
    } catch {
        return undefined;
    }
}

function readConfig(ctx: EnhancerContext): OdConfig {
    const all = configValue(ctx, "de.datanauten.theme_loader") as { opendesk?: OdConfig } | null | undefined;
    return (all && typeof all === "object" && all.opendesk) || {};
}

/** openDesk's default host names (helmfile/environments/default/global.yaml.gotmpl) when we run on chat.<domain>. */
function derived(): { portal?: string; apps: AppLink[] } {
    const m = /^chat\.(.+)$/.exec(window.location.hostname);
    if (!m) return { apps: [] };
    const d = m[1];
    const u = (h: string, p = ""): string => `https://${h}.${d}/${p}`;
    return {
        portal: u("portal"),
        apps: [
            { id: "files", name: label("files"), url: u("files") },
            { id: "mail", name: label("mail"), url: u("webmail", "appsuite/#app=io.ox/mail") },
            { id: "calendar", name: label("calendar"), url: u("webmail", "appsuite/#app=io.ox/calendar") },
            { id: "contacts", name: label("contacts"), url: u("webmail", "appsuite/#app=io.ox/contacts") },
            { id: "tasks", name: label("tasks"), url: u("webmail", "appsuite/#app=io.ox/tasks") },
            { id: "projects", name: label("projects"), url: u("projects") },
            { id: "knowledge", name: label("knowledge"), url: u("wiki") },
            { id: "videoconference", name: label("videoconference"), url: u("meet") },
            { id: "chat", name: label("chat"), url: `${window.location.origin}/` },
            { id: "notes", name: label("notes"), url: u("notes") },
        ],
    };
}

const nativeBanner = (): Element | null => document.querySelector("body > div:not(#matrixchat) > nav a > img")?.closest("nav") ?? null;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent?: HTMLElement): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
}

function safeUrl(url: string | undefined): string | null {
    if (!url) return null;
    try {
        const u = new URL(url, window.location.href);
        return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
    } catch {
        return null;
    }
}

function mountTopbar(ctx: EnhancerContext, cfg: OdConfig): void {
    const d = derived();
    const apps = (Array.isArray(cfg.apps) && cfg.apps.length ? cfg.apps : d.apps).filter((a) => a && a.name && safeUrl(a.url));
    const portal = safeUrl(cfg.portal_url) ?? safeUrl(d.portal);

    const bar = el("div", "od-topbar", ctx.root);
    bar.setAttribute("role", "banner");
    let pop: HTMLElement | null = null;
    let grid: HTMLButtonElement | null = null;

    if (apps.length) {
        grid = el("button", "od-topbar__grid", bar);
        grid.type = "button";
        grid.innerHTML = GRID_SVG;
        grid.setAttribute("aria-label", german() ? "Anwendungen" : "Applications");
        grid.setAttribute("aria-haspopup", "true");
        grid.setAttribute("aria-expanded", "false");
        grid.setAttribute("aria-controls", "od-apps");

        pop = el("div", "od-apps", ctx.root);
        pop.id = "od-apps";
        pop.hidden = true;
        const title = el("p", "od-apps__title", pop);
        title.textContent = german() ? "Anwendungen" : "Applications";
        const list = el("ul", "od-apps__list", pop);
        const here = window.location.origin;
        for (const a of apps) {
            const li = el("li", "", list);
            const link = el("a", "od-apps__item", li);
            link.href = safeUrl(a.url)!;
            if (new URL(link.href).origin === here) link.setAttribute("aria-current", "page");
            else {
                link.target = "_blank";
                link.rel = "noopener";
            }
            const icon = el("span", "od-apps__icon", link);
            const iconPath = a.icon && /^@?[\w-]*\/?assets\/[\w.-]+$/.test(a.icon) ? a.icon : a.id && ICONS[a.id];
            if (iconPath) icon.style.backgroundImage = `url("${ctx.asset(iconPath)}")`;
            else if (a.icon && safeUrl(a.icon)) icon.style.backgroundImage = `url("${safeUrl(a.icon)}")`;
            const name = el("span", "od-apps__name", link);
            name.textContent = a.name;
        }
        const close = (focusBack = false): void => {
            if (!pop || pop.hidden) return;
            pop.hidden = true;
            grid!.setAttribute("aria-expanded", "false");
            if (focusBack) grid!.focus();
        };
        grid.addEventListener("click", () => {
            const open = pop!.hidden;
            pop!.hidden = !open;
            grid!.setAttribute("aria-expanded", String(open));
            if (open) pop!.querySelector<HTMLElement>("a")?.focus();
        });
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === "Escape" && pop && !pop.hidden) {
                e.stopPropagation();
                close(true);
            }
        };
        const onDown = (e: MouseEvent): void => {
            const t = e.target as Node;
            if (pop && !pop.hidden && !pop.contains(t) && !grid!.contains(t)) close();
        };
        document.addEventListener("keydown", onKey, true);
        document.addEventListener("mousedown", onDown, true);
        cleanups.push(() => {
            document.removeEventListener("keydown", onKey, true);
            document.removeEventListener("mousedown", onDown, true);
        });
    }

    const brand = el(portal ? "a" : "span", "od-topbar__brand", bar) as HTMLAnchorElement | HTMLSpanElement;
    if (portal && brand instanceof HTMLAnchorElement) {
        brand.href = portal;
        brand.setAttribute("aria-label", german() ? "Portal anzeigen" : "Show portal");
    } else brand.setAttribute("aria-label", "openDesk");
    el("span", "od-topbar__wordmark", brand);
    const app = el("span", "od-topbar__app", bar);
    app.textContent = "Chat";
    el("span", "od-topbar__spacer", bar);

    if (CLOCK.has(ctx.variant.id)) {
        const clock = el("span", "od-topbar__clock", bar);
        clock.setAttribute("aria-hidden", "true");
        const tick = (): void => {
            const now = new Date();
            clock.textContent = now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) + "  ·  " +
                now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
        };
        tick();
        const iv = window.setInterval(tick, 15000);
        cleanups.push(() => window.clearInterval(iv));
    }

    document.documentElement.setAttribute("data-od-topbar", "");
    cleanups.push(() => {
        bar.remove();
        pop?.remove();
        document.documentElement.removeAttribute("data-od-topbar");
    });
}

export default {
    mount(ctx: EnhancerContext): void {
        this.unmount();
        try {
            const cfg = readConfig(ctx);
            const mode = cfg.topbar ?? "auto";
            if (mode === "never") return;
            const standalone = window.matchMedia?.("(display-mode: standalone)").matches;
            if (mode === "auto" && standalone) return;
            // openDesk's banner module is configured (it renders a moment after us): leave the bar to it.
            const bannerConfigured = !!configValue(ctx, "io.element.element-web-modules.banner");
            if (mode === "always" || (!bannerConfigured && !nativeBanner())) mountTopbar(ctx, cfg);
            if (mode === "auto") {
                // openDesk's banner module renders after us: drop our bar as soon as it shows up.
                // (polling for 20 s is cheaper than a subtree observer on <body> during Element's startup)
                let n = 0;
                const iv = window.setInterval(() => {
                    if (++n > 40) window.clearInterval(iv);
                    if (nativeBanner() && document.documentElement.hasAttribute("data-od-topbar")) {
                        window.clearInterval(iv);
                        ctx.log("openDesk banner present, using it instead of the theme top bar");
                        this.unmount();
                    }
                }, 500);
                cleanups.push(() => window.clearInterval(iv));
            }
        } catch (e) {
            ctx.log("opendesk enhancer failed", e);
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
