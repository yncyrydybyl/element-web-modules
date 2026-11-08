import css from "./tabs.css?inline";
import type { TabInfo } from "../tabs";

/**
 * "Open tabs" in Settings → Preferences: every tab of this session, which one is the main tab, and how each is
 * doing. Updated every few seconds while it is on screen.
 *
 * The module API has no settings extension point, so this watches the DOM for Element's Preferences tab panel
 * (`#mx_tabpanel_USER_PREFERENCES_TAB`) and adds a subsection after the first one, built like Element's own.
 * React leaves nodes it doesn't own alone; when the dialog closes, the section goes with it.
 */

export const SECTION_ID = "de-datanauten-multi-tab-tabs";
const STYLE_ID = "de-datanauten-multi-tab-style";
const PANEL_SELECTOR = "#mx_tabpanel_USER_PREFERENCES_TAB";
const REFRESH_MS = 2_000;

export class TabsSection {
    private observer?: MutationObserver;
    private section: HTMLElement | null = null;
    private timer?: ReturnType<typeof setTimeout>;

    public constructor(private readonly list: () => Promise<TabInfo[]>) {}

    public start(): void {
        this.observer = new MutationObserver(() => this.check());
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.check();
    }

    private check(): void {
        if (this.section?.isConnected) return;
        this.section = null;
        clearTimeout(this.timer);
        const panel = document.querySelector(PANEL_SELECTOR);
        if (!panel || document.getElementById(SECTION_ID)) return;
        const first = panel.querySelector(".mx_SettingsSubsection");
        const target = panel.querySelector(".mx_SettingsSection") ?? panel.querySelector(".mx_SettingsTab_sections");
        if (!first && !target) return;
        injectStyle();
        const section = buildSection();
        if (first) first.after(section);
        else target!.appendChild(section);
        this.section = section;
        void this.refresh();
    }

    private async refresh(): Promise<void> {
        const section = this.section;
        if (!section?.isConnected) return;
        let tabs: TabInfo[] | null = null;
        try {
            tabs = await this.list();
        } catch (e) {
            console.warn("[multi-tab] Couldn't list the open tabs", e);
        }
        if (!section.isConnected) return;
        render(section, tabs);
        this.timer = setTimeout(() => void this.refresh(), REFRESH_MS);
    }
}

function buildSection(): HTMLElement {
    const section = element("div", "mx_SettingsSubsection");
    section.id = SECTION_ID;
    section.setAttribute("role", "group");
    section.setAttribute("aria-labelledby", `${SECTION_ID}-heading`);
    const heading = element("div", "mx_SettingsSubsectionHeading");
    const h3 = element("h3", "mx_Heading_h4 mx_SettingsSubsectionHeading_heading", "Open tabs");
    h3.id = `${SECTION_ID}-heading`;
    heading.appendChild(h3);
    const description = element("div", "mx_SettingsSubsection_description");
    description.appendChild(
        element(
            "div",
            "mx_SettingsSubsection_text",
            "Element is open in these tabs. The main tab talks to the server and holds your encryption keys; the others get everything through it.",
        ),
    );
    const content = element("div", "mx_SettingsSubsection_content");
    const list = element("ul", "mt-tabs-list");
    list.setAttribute("aria-live", "polite");
    content.appendChild(list);
    section.append(heading, description, content);
    return section;
}

function render(section: HTMLElement, tabs: TabInfo[] | null): void {
    const content = section.querySelector(".mx_SettingsSubsection_content")!;
    const list = content.querySelector("ul")!;
    content.querySelector(".mt-tabs-note")?.remove();
    if (!tabs) {
        list.replaceChildren();
        content.appendChild(element("div", "mt-tabs-note", "The list isn't available right now."));
        return;
    }
    const now = Date.now();
    list.replaceChildren(...tabs.map((t) => row(t, now)));
    if (!tabs.some((t) => t.role === "engine")) {
        content.appendChild(element("div", "mt-tabs-note", "The main tab doesn't answer. Another tab takes over shortly."));
    }
}

function row(t: TabInfo, now: number): HTMLElement {
    const li = element("li", "mt-tab");
    li.dataset.tabId = t.tabId;
    li.dataset.role = t.role;
    if (t.isThis) li.dataset.this = "true";

    const head = element("div", "mt-tab-head");
    if (t.colour >= 0) {
        const dot = element("span", "mt-dot");
        dot.setAttribute("data-mt-colour", String(t.colour));
        dot.setAttribute("aria-hidden", "true");
        head.appendChild(dot);
    }
    head.appendChild(element("span", "mt-tab-title", t.place ?? roomOf(t.title)));
    if (t.role === "engine") head.appendChild(element("span", "mt-badge mt-badge-main", "Main tab"));
    if (t.isThis) head.appendChild(element("span", "mt-badge", "This tab"));
    if (t.syncState === "ERROR" || t.syncState === "STOPPED") {
        head.appendChild(element("span", "mt-badge mt-badge-warn", t.syncState === "ERROR" ? "Connection problem" : "Stopped"));
    }
    li.appendChild(head);

    const facts = [
        t.visible ? (t.focused ? "In front" : "Visible") : "In the background",
        `open ${ago(now - t.openedAt)}`,
        t.lastSyncAt ? `last update ${ago(now - t.lastSyncAt)} ago` : "no update yet",
        ...(t.isThis ? [] : [`answers in ${t.replyMs} ms`]),
        ...t.details,
    ];
    li.appendChild(element("div", "mt-tab-facts", facts.join(" · ")));
    return li;
}

/** Element's title is "Element | <room>" (with unread counts in between): show the room, or "Element". */
function roomOf(title: string): string {
    const parts = title.split(" | ").map((p) => p.trim());
    const room = parts.length > 1 ? parts.at(-1) : undefined;
    return room && !/^\[?\d+\]?$/.test(room) ? room : title || "Element";
}

function ago(ms: number): string {
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return `${s} s`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    return `${h} h ${m % 60} min`;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}
