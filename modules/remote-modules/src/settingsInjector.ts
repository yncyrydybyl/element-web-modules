/**
 * Adds a "Modules" tab of its own to Element's user settings dialog, after Help & About.
 *
 * The module API has no settings extension point, so this watches the DOM for the dialog's tab
 * list (labels with `aria-controls="mx_tabpanel_USER_…"`, stable since Element 1.11; production
 * builds strip the `data-testid`s) and appends a
 * label and a panel next to Element's own. Nothing React renders is changed: while the tab is
 * open, data attributes on the tabbed view and the dialog title let CSS hide Element's panel and
 * show "Modules" in the title. Clicking any of Element's labels closes the tab again. React
 * leaves nodes it doesn't own alone; when the dialog closes, they go with it.
 */

export const TAB_ID = "DATANAUTEN_MODULES_TAB";
const LABEL_CLASS = "drm-tab-label";
const PANEL_CLASS = "drm-tab-panel";
const OPEN_ATTR = "data-drm-modules";

// Compound's "extensions" icon, as Element's own tab icons are Compound icons.
const ICON = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17.25 11.6721C16.9959 11.6721 16.7749 11.5782 16.5871 11.3904L12.6096 7.41292C12.4218 7.22509 12.3279 7.00412 12.3279 6.75001C12.3279 6.49589 12.4218 6.27492 12.6096 6.08709L16.5871 2.10962C16.7749 1.92179 16.9959 1.82788 17.25 1.82788C17.5041 1.82788 17.7251 1.92179 17.9129 2.10962L21.8904 6.08709C22.0782 6.27492 22.1721 6.49589 22.1721 6.75001C22.1721 7.00412 22.0782 7.22509 21.8904 7.41292L17.9129 11.3904C17.7251 11.5782 17.5041 11.6721 17.25 11.6721ZM19.7249 6.75001L17.25 4.27513L14.7751 6.75001L17.25 9.22488L19.7249 6.75001Z"/><path d="M4 11C3.71667 11 3.47917 10.9042 3.2875 10.7125C3.09583 10.5208 3 10.2833 3 10V4.00001C3 3.71667 3.09583 3.47917 3.2875 3.28751C3.47917 3.09584 3.71667 3.00001 4 3.00001H10C10.2833 3.00001 10.5208 3.09584 10.7125 3.28751C10.9042 3.47917 11 3.71667 11 4.00001V10C11 10.2833 10.9042 10.5208 10.7125 10.7125C10.5208 10.9042 10.2833 11 10 11H4ZM9 9.00001V5.00001H5V9.00001H9Z"/><path d="M14 21C13.7167 21 13.4792 20.9042 13.2875 20.7125C13.0958 20.5208 13 20.2833 13 20V14C13 13.7167 13.0958 13.4792 13.2875 13.2875C13.4792 13.0958 13.7167 13 14 13H20C20.2833 13 20.5208 13.0958 20.7125 13.2875C20.9042 13.4792 21 13.7167 21 14V20C21 20.2833 20.9042 20.5208 20.7125 20.7125C20.5208 20.9042 20.2833 21 20 21H14ZM19 19V15H15V19H19Z"/><path d="M4 21C3.71667 21 3.47917 20.9042 3.2875 20.7125C3.09583 20.5208 3 20.2833 3 20V14C3 13.7167 3.09583 13.4792 3.2875 13.2875C3.47917 13.0958 3.71667 13 4 13H10C10.2833 13 10.5208 13.0958 10.7125 13.2875C10.9042 13.4792 11 13.7167 11 14V20C11 20.2833 10.9042 20.5208 10.7125 20.7125C10.5208 20.9042 10.2833 21 10 21H4ZM9 19V15H5V19H9Z"/></svg>`;

export class SettingsInjector {
    private observer?: MutationObserver;
    private mounted?: { view: HTMLElement; label: HTMLElement; panel: HTMLElement; unmount(): void };

    /** `label`: the tab's name, in the user's language. */
    public constructor(
        private readonly mount: (container: HTMLElement) => () => void,
        private readonly label: () => string,
    ) {}

    public start(): void {
        this.observer = new MutationObserver(() => this.check());
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.check();
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

    private check(): void {
        if (this.mounted && !this.mounted.view.isConnected) {
            this.mounted.unmount();
            this.mounted = undefined;
        }
        if (this.mounted) {
            // Element re-appends its labels when it re-renders the list (e.g. on a window resize); stay last.
            const { label } = this.mounted;
            if (label.nextElementSibling) label.parentElement?.appendChild(label);
            return;
        }
        const tabs = document.querySelector('[aria-controls^="mx_tabpanel_USER_"]')?.closest<HTMLElement>(".mx_TabbedView_tabLabels");
        const view = tabs?.closest<HTMLElement>(".mx_TabbedView");
        // Already there: from this injector, or from the module loaded twice (e.g. listed twice in config.json).
        if (!tabs || !view || tabs.querySelector(`.${LABEL_CLASS}`)) return;

        const id = `mx_tabpanel_${TAB_ID}`;
        const label = document.createElement("li");
        label.className = `mx_TabbedView_tabLabel ${LABEL_CLASS}`;
        label.setAttribute("role", "tab");
        label.setAttribute("tabindex", "-1");
        label.setAttribute("aria-selected", "false");
        label.setAttribute("aria-controls", id);
        label.dataset.testid = `settings-tab-${TAB_ID}`;
        label.innerHTML = ICON;
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
        // Element's own labels switch Element's tab; leave ours whenever one is clicked.
        tabs.addEventListener("click", (ev) => {
            if (!label.contains(ev.target as Node)) this.setOpen(false);
        });
        tabs.appendChild(label);

        const panel = document.createElement("div");
        panel.className = `mx_TabbedView_tabPanel ${PANEL_CLASS}`;
        panel.id = id;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", text.id);
        panel.innerHTML = `<div class="mx_AutoHideScrollbar mx_TabbedView_tabPanelContent"><div class="mx_SettingsTab"><div class="mx_SettingsTab_sections"></div></div></div>`;
        view.appendChild(panel);

        this.mounted = { view, label, panel, unmount: this.mount(panel.querySelector(".mx_SettingsTab_sections")!) };
    }

    private setOpen(open: boolean): void {
        const m = this.mounted;
        if (!m) return;
        m.view.toggleAttribute(OPEN_ATTR, open);
        m.label.classList.toggle("mx_TabbedView_tabLabel_active", open);
        m.label.setAttribute("aria-selected", String(open));
        const title = m.view.closest(".mx_UserSettingsDialog")?.querySelector<HTMLElement>(".mx_UserSettingsDialog_title");
        if (title) {
            if (open) {
                // Element's own "Settings:", so the title stays in the user's language.
                title.dataset.drmPrefix = title.querySelector(".mx_UserSettingsDialog_title_strong")?.textContent ?? "";
                title.dataset.drmTab = this.label();
            } else {
                delete title.dataset.drmPrefix;
                delete title.dataset.drmTab;
            }
        }
        if (open) {
            m.label.focus();
            m.panel.querySelector<HTMLElement>(".mx_TabbedView_tabPanelContent")?.scrollTo?.(0, 0);
        }
    }
}
