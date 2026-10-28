import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ModuleDefault, { KeyboardShortcutsModule } from "./index";
import { mockApi } from "./tests/mockApi";

const modules: KeyboardShortcutsModule[] = [];

async function loadModule(options: Parameters<typeof mockApi>[0] = {}) {
    const mock = mockApi(options);
    const module = new KeyboardShortcutsModule(mock.api);
    await module.load();
    modules.push(module);
    return { module, ...mock };
}

afterEach(() => {
    for (const m of modules.splice(0)) act(() => m.dispose());
    vi.restoreAllMocks();
});

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
    act(() => {
        target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }));
    });
}

describe("KeyboardShortcutsModule", () => {
    it("is a valid module for Element's loader", () => {
        // Same shape check as ModuleLoader's isModule() in element-web-module-api.
        expect(typeof ModuleDefault).toBe("function");
        expect(ModuleDefault.moduleApiVersion).toBe("^2.0.0");
        expect(typeof ModuleDefault.prototype.load).toBe("function");
    });

    it("opens the overview on ? and closes it on Esc", async () => {
        await loadModule();
        press("?", { shiftKey: true });
        const dialog = screen.getByRole("dialog", { name: "Keyboard shortcuts" });
        // Labels come from Element's translations when present …
        expect(within(dialog).getByText("Toggle Bold (from Element)")).toBeTruthy();
        // … and fall back to English otherwise.
        expect(within(dialog).getByText("Jump to room search")).toBeTruthy();
        expect(within(dialog).getByRole("region", { name: "Composer" })).toBeTruthy();

        await userEvent.keyboard("{Escape}");
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("does not open while typing in an input", async () => {
        await loadModule();
        const input = document.createElement("input");
        document.body.appendChild(input);
        press("?", { shiftKey: true }, input);
        expect(screen.queryByRole("dialog")).toBeNull();
        input.remove();
    });

    it("honours hidden categories, labs and extra shortcuts from config", async () => {
        await loadModule({
            config: {
                hidden_categories: ["accessibility"],
                extra_shortcuts: [{ label: { en: "Open Marcade store", de: "Store" }, keys: "Mod+Shift+M" }],
            },
        });
        press("?");
        const dialog = screen.getByRole("dialog");
        expect(within(dialog).queryByRole("region", { name: "Accessibility" })).toBeNull();
        expect(within(dialog).queryByRole("region", { name: "Labs" })).toBeNull();
        const more = within(dialog).getByRole("region", { name: "More" });
        expect(within(more).getByText("Open Marcade store")).toBeTruthy();
    });

    it("filters by search text", async () => {
        await loadModule();
        press("?");
        await userEvent.type(screen.getByRole("searchbox"), "italic");
        const dialog = screen.getByRole("dialog");
        expect(within(dialog).getByText("Toggle Italics")).toBeTruthy();
        expect(within(dialog).queryByText("Jump to room search")).toBeNull();
    });

    it("records a custom shortcut, saves it to account data and replays the default", async () => {
        const { setAccountData, module } = await loadModule({ loggedIn: true });
        press("?");
        await userEvent.click(screen.getByRole("button", { name: "Customise" }));
        await userEvent.click(screen.getByRole("button", { name: "Set a custom shortcut for “Jump to room search”" }));
        await userEvent.keyboard("{Control>}{Alt>}j{/Alt}{/Control}");

        expect(setAccountData).toHaveBeenCalledWith("de.datanauten.keyboard_shortcuts", {
            version: 1,
            overrides: { "KeyBinding.filterRooms": "Mod+Alt+J" },
        });
        expect(screen.getByTitle("custom")).toBeTruthy();
        act(() => module.close());

        // Pressing the custom combo now produces Element's default (Ctrl+K) instead.
        const seen: KeyboardEvent[] = [];
        const listener = (e: KeyboardEvent) => seen.push(e);
        document.addEventListener("keydown", listener);
        press("j", { ctrlKey: true, altKey: true });
        document.removeEventListener("keydown", listener);
        expect(seen).toHaveLength(1);
        expect(seen[0]).toMatchObject({ key: "k", ctrlKey: true, altKey: false });
    });

    it("refuses combos without a modifier and combos already in use", async () => {
        await loadModule();
        press("?");
        await userEvent.click(screen.getByRole("button", { name: "Customise" }));
        await userEvent.click(screen.getByRole("button", { name: "Set a custom shortcut for “Toggle Bold (from Element)”" }));
        await userEvent.keyboard("x");
        expect(screen.getByRole("alert").textContent).toMatch(/at least one of Ctrl/);
        await userEvent.keyboard("{Control>}k{/Control}");
        expect(screen.getByRole("alert").textContent).toBe("Already used for “Jump to room search”.");
    });

    it("picks up custom shortcuts changed on another device", async () => {
        const { accountData } = await loadModule({ loggedIn: true });
        act(() => {
            accountData.value = { version: 1, overrides: { "KeyBinding.toggleRightPanel": "Mod+Alt+r" } };
        });
        const seen: KeyboardEvent[] = [];
        const listener = (e: KeyboardEvent) => seen.push(e);
        document.addEventListener("keydown", listener);
        press("r", { ctrlKey: true, altKey: true });
        document.removeEventListener("keydown", listener);
        expect(seen[0]).toMatchObject({ key: ".", ctrlKey: true });
    });

    it("fails loudly on invalid config", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        const { api } = mockApi({ config: { trigger_key: "Nope+X" } });
        await expect(new KeyboardShortcutsModule(api).load()).rejects.toThrow(/module configuration/);
    });
});
