/**
 * Adds "Coming from Teams?" to Element's user menu (the avatar at the top left). The module API has
 * no hook for that menu, so this copies one of Element's own menu items when the menu opens.
 * Checked against Element Web v1.12.33: the trigger is a button in `.mx_UserMenu`, the menu a
 * `[role=menu]` labelled by that button, the items `button[role=menuitem]` with an svg and a label
 * span. If that changes, the entry just doesn't appear.
 */

export const MENU_MARKER = "data-teams-welcome-menu";

const ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20m0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16m3 4a1 1 0 1 1 0 2h-2v6a1 1 0 1 1-2 0v-6H9a1 1 0 1 1 0-2z"/></svg>';

export interface UserMenuOptions {
    label(): string;
    onSelect(): void;
}

/** The open user menu, if any: the `[role=menu]` whose label is the trigger inside `.mx_UserMenu`. */
export function findUserMenu(doc: Document = document): HTMLElement | null {
    const trigger = doc.querySelector<HTMLElement>(".mx_UserMenu [aria-haspopup=menu][aria-expanded=true]");
    if (!trigger?.id) return null;
    const menu = [...doc.querySelectorAll<HTMLElement>("[role=menu][aria-labelledby]")].find(
        (m) => m.getAttribute("aria-labelledby") === trigger.id,
    );
    if (menu) return menu;
    const controls = trigger.getAttribute("aria-controls");
    return controls ? doc.getElementById(controls) : null;
}

/** Adds the entry to an open menu once. Returns the entry, or null if the menu has no items to copy. */
export function addMenuEntry(menu: HTMLElement, opts: UserMenuOptions): HTMLElement | null {
    const existing = menu.querySelector<HTMLElement>(`[${MENU_MARKER}]`);
    if (existing) return existing;
    const items = menu.querySelectorAll<HTMLElement>("[role=menuitem]");
    const template = items[items.length - 1];
    if (!template) return null;

    const entry = template.cloneNode(true) as HTMLElement;
    entry.setAttribute(MENU_MARKER, "");
    entry.removeAttribute("id");
    entry.removeAttribute("data-highlighted");
    const label = entry.querySelector("span") ?? entry;
    label.textContent = opts.label();
    const icon = entry.querySelector("svg");
    if (icon) {
        const holder = document.createElement("span");
        holder.innerHTML = ICON;
        const svg = holder.firstElementChild as SVGElement;
        svg.setAttribute("class", `${icon.getAttribute("class") ?? ""} twl-menu-icon`.trim());
        icon.replaceWith(svg);
    }
    // The ">" navigation hint of the copied item, if it has one, stays: the entry opens a panel too.
    entry.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Radix closes the menu on Escape.
        menu.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        opts.onSelect();
    });
    entry.addEventListener("pointerenter", () => entry.setAttribute("data-highlighted", ""));
    entry.addEventListener("pointerleave", () => entry.removeAttribute("data-highlighted"));
    template.after(entry);
    return entry;
}

export class UserMenuInjector {
    private observer?: MutationObserver;
    private scheduled = false;

    public constructor(private readonly opts: UserMenuOptions) {}

    public start(): void {
        if (this.observer || typeof MutationObserver === "undefined") return;
        this.observer = new MutationObserver(() => this.schedule());
        this.observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-expanded"] });
    }

    public stop(): void {
        this.observer?.disconnect();
        this.observer = undefined;
    }

    private schedule(): void {
        if (this.scheduled) return;
        this.scheduled = true;
        queueMicrotask(() => {
            this.scheduled = false;
            const menu = findUserMenu();
            if (menu) addMenuEntry(menu, this.opts);
        });
    }
}
