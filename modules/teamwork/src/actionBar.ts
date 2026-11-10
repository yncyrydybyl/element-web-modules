/**
 * Adds a "Save message" bookmark to every message action bar (the toolbar that appears when
 * hovering a message), like modules/text-reactions does for its button.
 *
 * The module API has no hook for the action bar, so this watches the DOM. Element renders it as
 * `[role=toolbar].mx_MessageActionBar` inside the event tile, whose root carries `data-event-id`.
 * The button goes right before Element's own Options ("…") button, so it's there for every message
 * that has a toolbar at all.
 */

export const BUTTON_CLASS = "tw-save-button";
const TOOLBAR_SELECTOR = "[role=toolbar].mx_MessageActionBar";

export interface ActionBarOptions {
    /** Element's own label of the Options button, in the user's language. */
    optionsLabel(): string;
    label(saved: boolean): string;
    isSaved(eventId: string): boolean;
    onClick(eventId: string): void;
}

export class ActionBarInjector {
    private observer?: MutationObserver;

    public constructor(private readonly options: ActionBarOptions) {}

    public start(root: Node = document.body): void {
        this.observer = new MutationObserver((records) => {
            for (const record of records) {
                for (const node of record.addedNodes) if (node instanceof Element) this.scan(node);
            }
        });
        this.observer.observe(root, { childList: true, subtree: true });
        if (root instanceof Element || root instanceof Document) this.scan(root);
    }

    public stop(): void {
        this.observer?.disconnect();
        document.querySelectorAll(`.${BUTTON_CLASS}`).forEach((b) => b.remove());
    }

    /** Redraws the buttons' state after the saved list changed (on any device). */
    public refresh(): void {
        document.querySelectorAll<HTMLButtonElement>(`.${BUTTON_CLASS}`).forEach((b) => this.paint(b));
    }

    private scan(node: Element | Document): void {
        const toolbars = node instanceof Element && node.matches(TOOLBAR_SELECTOR) ? [node] : [];
        toolbars.push(...node.querySelectorAll(TOOLBAR_SELECTOR));
        if (node instanceof Element && !toolbars.length) {
            const toolbar = node.closest(TOOLBAR_SELECTOR);
            if (toolbar) toolbars.push(toolbar);
        }
        for (const toolbar of toolbars) this.decorate(toolbar);
    }

    private decorate(toolbar: Element): void {
        if (toolbar.querySelector(`.${BUTTON_CLASS}`)) return;
        const eventId = toolbar.closest("[data-event-id]")?.getAttribute("data-event-id");
        const anchor = [...toolbar.querySelectorAll<HTMLElement>("button, [role=button]")].find(
            (b) => b.getAttribute("aria-label") === this.options.optionsLabel(),
        );
        // Local echoes ("~!room:txn") can't be saved yet.
        if (!eventId?.startsWith("$") || !anchor) return;

        const button = document.createElement("button");
        // Copy Element's classes so the button looks like its neighbours.
        button.className = `${anchor.className} ${BUTTON_CLASS}`;
        for (const attr of ["data-kind", "data-presentation", "data-size"]) {
            const value = anchor.getAttribute(attr);
            if (value) button.setAttribute(attr, value);
        }
        button.type = "button";
        // Element's toolbar uses a roving tabindex that only knows its own buttons.
        button.tabIndex = -1;
        button.dataset.eventId = eventId;
        button.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            this.options.onClick(eventId);
        });
        this.paint(button);
        anchor.before(button);
    }

    private paint(button: HTMLButtonElement): void {
        const saved = this.options.isSaved(button.dataset.eventId ?? "");
        const label = this.options.label(saved);
        button.setAttribute("aria-label", label);
        button.setAttribute("aria-pressed", String(saved));
        button.title = label;
        button.innerHTML = saved ? ICON_FILLED : ICON_OUTLINE;
    }
}

const ICON_OUTLINE =
    '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M6 3h12a1 1 0 0 1 1 1v17.2a.5.5 0 0 1-.8.4L12 17l-6.2 4.6a.5.5 0 0 1-.8-.4V4a1 1 0 0 1 1-1Zm1 2v13.2l5-3.7 5 3.7V5H7Z"/></svg>';
const ICON_FILLED =
    '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M6 3h12a1 1 0 0 1 1 1v17.2a.5.5 0 0 1-.8.4L12 17l-6.2 4.6a.5.5 0 0 1-.8-.4V4a1 1 0 0 1 1-1Z"/></svg>';
