/**
 * Puts a section into Element's Settings → Preferences tab, right after Element's own "Spaces"
 * subsection (or at the end of the tab when that can't be found).
 *
 * The module API has no settings extension point, so this watches the DOM for the tab panel
 * (`#mx_tabpanel_USER_PREFERENCES_TAB`, stable since Element 1.11) and adds a container next to
 * Element's own subsections. React leaves nodes it doesn't own alone, so the section survives
 * Element's re-renders; when the dialog closes, the container goes with it.
 */

export const PREFERENCES_TAB_SELECTOR = "#mx_tabpanel_USER_PREFERENCES_TAB";
const CONTAINER_CLASS = "pm-settings-container";

export class SettingsInjector {
    private observer?: MutationObserver;
    private mounted?: { container: HTMLElement; unmount(): void };

    /** `spacesHeading`: Element's own "Spaces" heading, in the user's language. */
    public constructor(
        private readonly mount: (container: HTMLElement) => () => void,
        private readonly spacesHeading: () => string,
    ) {}

    public start(): void {
        this.observer = new MutationObserver(() => this.check());
        this.observer.observe(document.body, { childList: true, subtree: true });
        this.check();
    }

    public stop(): void {
        this.observer?.disconnect();
        this.mounted?.unmount();
        this.mounted?.container.remove();
        this.mounted = undefined;
    }

    private check(): void {
        if (this.mounted && !this.mounted.container.isConnected) {
            this.mounted.unmount();
            this.mounted = undefined;
        }
        if (this.mounted) return;
        const panel = document.querySelector(PREFERENCES_TAB_SELECTOR);
        // Already there: from this injector, or from the module loaded twice (e.g. listed twice in config.json).
        if (!panel || panel.querySelector(`.${CONTAINER_CLASS}`)) return;
        const heading = this.spacesHeading();
        const spaces = [...panel.querySelectorAll(".mx_SettingsSubsection")].find(
            (s) => s.querySelector(".mx_SettingsSubsectionHeading_heading")?.textContent?.trim() === heading,
        );
        const target = panel.querySelector(".mx_SettingsSection") ?? panel.querySelector(".mx_SettingsTab_sections");
        if (!spaces && !target) return;
        const container = document.createElement("div");
        container.className = CONTAINER_CLASS;
        if (spaces) spaces.after(container);
        else target!.appendChild(container);
        this.mounted = { container, unmount: this.mount(container) };
    }
}
