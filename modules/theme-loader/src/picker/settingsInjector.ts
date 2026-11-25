/**
 * Adds a "Themes" tab to Element's user settings dialog (pattern from remote-modules' settingsInjector.ts).
 *
 * The module API has no settings extension point, so this watches the DOM for the dialog's tab list (labels with
 * `aria-controls="mx_tabpanel_USER_…"`) and appends a label and a panel next to Element's own. Nothing React renders
 * is changed: while our tab is open, a data attribute on the tabbed view lets CSS hide Element's panel. Clicking any
 * other label closes our tab. Coexists with remote-modules' "Modules" tab (both stay after Element's labels).
 */
import { warn } from "../log";

export const TAB_ID = "DATANAUTEN_THEMES_TAB";
const LABEL_CLASS = "tl-tab-label";
const PANEL_CLASS = "tl-tab-panel";
const OPEN_ATTR = "data-tl-themes-tab";
const WAS_ACTIVE_ATTR = "data-tl-was-active";

// A palette icon (24px, currentColor) in the style of Compound's icons.
const PALETTE_ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10a2.5 2.5 0 0 0 2.5-2.5c0-.61-.23-1.2-.64-1.67a.53.53 0 0 1-.13-.33c0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9Zm4 13h-1.77a2.5 2.5 0 0 0-1.87 4.16c.09.1.14.21.14.34a.5.5 0 0 1-.5.5c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.14 8 7c0 2.21-1.79 4-4 4Z"/><circle cx="6.5" cy="11.5" r="1.5"/><circle cx="9.5" cy="7.5" r="1.5"/><circle cx="14.5" cy="7.5" r="1.5"/><circle cx="17.5" cy="11.5" r="1.5"/></svg>`;

export class SettingsInjector {
    private observer?: MutationObserver;
    private mounted?: { view: HTMLElement; label: HTMLElement; panel: HTMLElement; unmount(): void };

    public constructor(
        private readonly mount: (container: HTMLElement) => () => void,
        private readonly label: () => string,
    ) {}

    public start(): void {
        try {
            this.observer = new MutationObserver(() => this.check());
            this.observer.observe(document.body, { childList: true, subtree: true });
            this.check();
        } catch (e) {
            warn("settings tab injector failed to start", e);
        }
    }

    public stop(): void {
        this.observer?.disconnect();
        if (this.mounted) {
            this.setOpen(false);
            this.mounted.unmount();
            this.mounted.label.remove();
            this.mounted.panel.remove();
        }
        this.mounted = undefined;
    }

    /** Opens the settings dialog's Themes tab if the dialog is open. */
    public open(): boolean {
        this.check();
        if (!this.mounted) return false;
        this.setOpen(true);
        return true;
    }

    private check(): void {
        try {
            if (this.mounted && !this.mounted.view.isConnected) {
                this.mounted.unmount();
                this.mounted = undefined;
            }
            if (this.mounted) {
                // Element re-appends its labels when it re-renders the list; stay after Element's own labels
                // (but don't fight other modules' injected labels, e.g. remote-modules' "Modules").
                const { label } = this.mounted;
                let n = label.nextElementSibling;
                while (n) {
                    if (n.matches(".mx_TabbedView_tabLabel") && !/-tab-label\b/.test(n.className)) {
                        label.parentElement?.appendChild(label);
                        break;
                    }
                    n = n.nextElementSibling;
                }
                return;
            }
            const tabs = document
                .querySelector('[aria-controls^="mx_tabpanel_USER_"]')
                ?.closest<HTMLElement>(".mx_TabbedView_tabLabels");
            const view = tabs?.closest<HTMLElement>(".mx_TabbedView");
            if (!tabs || !view || tabs.querySelector(`.${LABEL_CLASS}`)) return;

            const id = `mx_tabpanel_${TAB_ID}`;
            const label = document.createElement("li");
            label.className = `mx_TabbedView_tabLabel tl-ui ${LABEL_CLASS}`;
            label.setAttribute("role", "tab");
            label.setAttribute("tabindex", "-1");
            label.setAttribute("aria-selected", "false");
            label.setAttribute("aria-controls", id);
            label.dataset.testid = `settings-tab-${TAB_ID}`;
            label.innerHTML = PALETTE_ICON;
            const text = document.createElement("span");
            text.className = "mx_TabbedView_tabLabel_text";
            text.id = `${id}_label`;
            text.textContent = this.label();
            label.appendChild(text);
            label.setAttribute("aria-labelledby", text.id);
            label.addEventListener("click", () => this.setOpen(true));
            label.addEventListener("keydown", (ev) => {
                if (ev.key !== "Enter" && ev.key !== " ") return;
                ev.preventDefault();
                this.setOpen(true);
            });
            tabs.addEventListener("click", (ev) => {
                if (!label.contains(ev.target as Node)) this.setOpen(false);
            });
            tabs.appendChild(label);

            const panel = document.createElement("div");
            panel.className = `mx_TabbedView_tabPanel tl-ui ${PANEL_CLASS}`;
            panel.id = id;
            panel.setAttribute("role", "tabpanel");
            panel.setAttribute("aria-labelledby", text.id);
            panel.innerHTML = `<div class="mx_AutoHideScrollbar mx_TabbedView_tabPanelContent"><div class="mx_SettingsTab"><div class="mx_SettingsTab_sections tl-tab-sections"></div></div></div>`;
            view.appendChild(panel);

            this.mounted = { view, label, panel, unmount: this.mount(panel.querySelector<HTMLElement>(".tl-tab-sections")!) };
        } catch (e) {
            warn("settings tab injection failed", e);
        }
    }

    private setOpen(open: boolean): void {
        const m = this.mounted;
        if (!m) return;
        const wasOpen = m.view.hasAttribute(OPEN_ATTR);
        if (open && !wasOpen) {
            // Element's own active tab stops looking (and announcing itself as) selected while ours is shown. CSS
            // can't do this reliably: themes style the active tab with their own !important rules.
            for (const l of m.view.querySelectorAll<HTMLElement>(`.mx_TabbedView_tabLabel_active:not(.${LABEL_CLASS})`)) {
                l.classList.remove("mx_TabbedView_tabLabel_active");
                l.setAttribute("aria-selected", "false");
                l.setAttribute(WAS_ACTIVE_ATTR, "");
            }
        } else if (!open && wasOpen) {
            // After React handled the click: if the user picked another tab React has marked it; if they picked
            // the tab that was active before, React re-renders nothing, so we give its state back.
            window.setTimeout(() => {
                const others = m.view.querySelector(`.mx_TabbedView_tabLabel_active:not(.${LABEL_CLASS}):not([${WAS_ACTIVE_ATTR}])`);
                for (const l of m.view.querySelectorAll<HTMLElement>(`[${WAS_ACTIVE_ATTR}]`)) {
                    l.removeAttribute(WAS_ACTIVE_ATTR);
                    if (others || m.view.hasAttribute(OPEN_ATTR)) continue;
                    l.classList.add("mx_TabbedView_tabLabel_active");
                    l.setAttribute("aria-selected", "true");
                }
            }, 0);
        }
        m.view.toggleAttribute(OPEN_ATTR, open);
        m.label.classList.toggle("mx_TabbedView_tabLabel_active", open);
        m.label.setAttribute("aria-selected", String(open));
        const title = m.view.closest(".mx_UserSettingsDialog")?.querySelector<HTMLElement>(".mx_UserSettingsDialog_title");
        if (title) {
            if (open) {
                title.dataset.tlPrefix = title.querySelector(".mx_UserSettingsDialog_title_strong")?.textContent ?? "";
                title.dataset.tlTab = this.label();
            } else {
                delete title.dataset.tlPrefix;
                delete title.dataset.tlTab;
            }
        }
        if (open) {
            m.label.focus();
            m.panel.querySelector<HTMLElement>(".mx_TabbedView_tabPanelContent")?.scrollTo?.(0, 0);
        }
    }
}
