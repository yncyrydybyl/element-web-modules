/**
 * Adds a button to every message action bar (the toolbar that appears when hovering a message).
 *
 * The module API has no hook for the action bar, so this watches the DOM. Element renders it as
 * `[role=toolbar].mx_MessageActionBar` inside the event tile, whose root carries `data-event-id`
 * (shared-components ActionBarView / EventTileView). The button goes right before Element's own
 * React button, and only where that button exists, i.e. where the user may react at all.
 */

export const BUTTON_CLASS = "dtr-button";
const TOOLBAR_SELECTOR = "[role=toolbar].mx_MessageActionBar";

export interface ActionBarOptions {
    /** Element's own label of the React button, in the user's language ("React"). */
    reactLabel(): string;
    /** Label and tooltip of the new button. */
    label(): string;
    onClick(eventId: string, anchor: HTMLElement): void;
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

    private scan(node: Element | Document): void {
        const toolbars = node instanceof Element && node.matches(TOOLBAR_SELECTOR) ? [node] : [];
        toolbars.push(...node.querySelectorAll(TOOLBAR_SELECTOR));
        // Buttons can also appear in an existing toolbar (e.g. once a message is sent).
        if (node instanceof Element && !toolbars.length) {
            const toolbar = node.closest(TOOLBAR_SELECTOR);
            if (toolbar) toolbars.push(toolbar);
        }
        for (const toolbar of toolbars) this.decorate(toolbar);
    }

    private decorate(toolbar: Element): void {
        if (toolbar.querySelector(`.${BUTTON_CLASS}`)) return;
        const eventId = toolbar.closest("[data-event-id]")?.getAttribute("data-event-id");
        const react = [...toolbar.querySelectorAll<HTMLElement>("button, [role=button]")].find(
            (b) => b.getAttribute("aria-label") === this.options.reactLabel(),
        );
        if (!eventId || !react) return;

        const button = document.createElement("button");
        // Copy Element's classes so the button looks like its neighbours.
        button.className = `${react.className} ${BUTTON_CLASS}`;
        for (const attr of ["data-kind", "data-presentation", "data-size"]) {
            const value = react.getAttribute(attr);
            if (value) button.setAttribute(attr, value);
        }
        button.type = "button";
        // Element's toolbar uses a roving tabindex that only knows its own buttons.
        button.tabIndex = -1;
        button.setAttribute("aria-label", this.options.label());
        button.title = this.options.label();
        button.innerHTML = ICON;
        button.addEventListener("click", (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            this.options.onClick(eventId, button);
        });
        react.before(button);
    }
}

/** "Aa" text icon, 20px like Element's toolbar icons; follows the button's colour. */
const ICON =
    '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M8.1 5h1.8l5 13h-2.2l-1.2-3.3H6.5L5.3 18H3.1zm-1 7.8h4.2L9.2 7.1z"/>' +
    '<path d="M19.1 10.1q1.5 0 2.3.8t.8 2.3V18h-1.8v-1q-.4.6-1.1.9t-1.6.3q-1.3 0-2.1-.7t-.8-1.8.8-1.8 2.3-.7h2.3v-.2q0-.8-.5-1.2t-1.4-.4q-.6 0-1.2.2t-1 .5l-.7-1.4q.6-.4 1.4-.6t1.6-.2m-.3 6.7q.6 0 1.1-.3t.7-.9v-.9h-2q-1.4 0-1.4.9 0 .5.4.8t1.2.4"/>' +
    "</svg>";
