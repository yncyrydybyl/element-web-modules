import { afterEach, describe, expect, it, vi } from "vitest";

import { addMenuEntry, findUserMenu, MENU_MARKER, UserMenuInjector } from "./userMenu";

/** The user menu as Element v1.12.33 renders it (Compound/Radix), trimmed. */
function renderMenu(open = true): void {
    document.body.innerHTML = `
        <div class="mx_UserMenu"><button id="radix-1" aria-haspopup="menu" aria-expanded="${open}">A</button></div>
        ${
            open
                ? `<div role="menu" aria-labelledby="radix-1"><section>
            <button role="menuitem" class="_item"><svg class="_icon"></svg><span class="_label">Security &amp; Privacy</span></button>
            <button role="menuitem" class="_item"><svg class="_icon"></svg><span class="_label">All settings</span></button>
        </section></div>`
                : ""
        }`;
}

afterEach(() => {
    document.body.innerHTML = "";
});

describe("user menu entry", () => {
    it("finds the open user menu through its trigger", () => {
        renderMenu(false);
        expect(findUserMenu()).toBeNull();
        renderMenu(true);
        expect(findUserMenu()?.getAttribute("role")).toBe("menu");
    });

    it("adds one copy of Element's last item with our label and icon", () => {
        renderMenu();
        const onSelect = vi.fn();
        const menu = findUserMenu()!;
        const entry = addMenuEntry(menu, { label: () => "Coming from Teams?", onSelect })!;
        expect(addMenuEntry(menu, { label: () => "x", onSelect })).toBe(entry);
        const items = menu.querySelectorAll("[role=menuitem]");
        expect(items).toHaveLength(3);
        expect(items[2]).toBe(entry);
        expect(entry.hasAttribute(MENU_MARKER)).toBe(true);
        expect(entry.textContent).toBe("Coming from Teams?");
        expect(entry.querySelector("svg")?.getAttribute("class")).toBe("_icon twl-menu-icon");
    });

    it("closes the menu (Escape) and opens the guide on click", () => {
        renderMenu();
        const onSelect = vi.fn();
        const menu = findUserMenu()!;
        const keys: string[] = [];
        menu.addEventListener("keydown", (e) => keys.push(e.key));
        addMenuEntry(menu, { label: () => "Guide", onSelect })!.click();
        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(keys).toEqual(["Escape"]);
    });

    it("injects when the menu opens", async () => {
        const injector = new UserMenuInjector({ label: () => "Guide", onSelect: vi.fn() });
        renderMenu(false);
        injector.start();
        renderMenu(true);
        await new Promise((r) => setTimeout(r, 0));
        expect(document.querySelector(`[${MENU_MARKER}]`)).not.toBeNull();
        injector.stop();
    });
});
