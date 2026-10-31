import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ModuleDefault, { parseConfig, SpaceRoomMapModule } from "./index";
import { fakeClient } from "./tests/fakeClient";
import { mockApi } from "./tests/mockApi";
import { matchesCombo, parseCombo } from "./trigger";

const modules: SpaceRoomMapModule[] = [];

async function loadModule(options: Parameters<typeof mockApi>[0] = {}) {
    const mock = mockApi(options);
    const module = new SpaceRoomMapModule(mock.api);
    await module.load();
    modules.push(module);
    return { module, ...mock };
}

/** The rows of the list on the left (the space selector has options too). */
const items = (name = "Spaces") => within(screen.getByRole("listbox", { name })).getAllByRole("option");
const names = (options: HTMLElement[]) => options.map((o) => o.querySelector(".srm-item-name")!.textContent);

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
    const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
    act(() => {
        target.dispatchEvent(ev);
    });
    return ev;
}

beforeEach(() => {
    (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg = {
        get: () =>
            fakeClient([
                { id: "!eng:x", name: "Engineering", space: true, children: ["!web:x", "!ops:x", "!design:x"], avatar: "mxc://x/eng" },
                { id: "!design:x", name: "Design", space: true, children: ["!ui:x"] },
                { id: "!web:x", name: "Web", lastActive: 100 },
                { id: "!ops:x", name: "Ops", lastActive: 50, unread: 4 },
                { id: "!ui:x", name: "UI", lastActive: 40, highlight: 1, unread: 1 },
                { id: "!random:x", name: "Random", lastActive: 10 },
            ]),
    };
});

afterEach(() => {
    for (const m of modules.splice(0)) act(() => m.dispose());
    delete (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("SpaceRoomMapModule", () => {
    it("is a valid module for Element's loader", () => {
        expect(typeof ModuleDefault).toBe("function");
        expect(ModuleDefault.moduleApiVersion).toBe("^2.0.0");
    });

    it("opens on Ctrl+I with the spaces on the left, and opens a space with Enter", async () => {
        const { openRoom } = await loadModule();
        const ev = press("i", { ctrlKey: true, code: "KeyI" });
        expect(ev.defaultPrevented).toBe(true);
        expect(screen.getByRole("dialog", { name: "Map" })).toBeTruthy();
        const rows = items();
        expect(names(rows)).toEqual(["All spaces", "Engineering", "Design", "Other rooms"]);
        // Rooms and unread messages add up through sub-spaces; a mention shows in red.
        expect(rows[0].textContent).toContain("4 rooms");
        expect(rows[1].textContent).toContain("3 rooms");
        expect(rows[1].querySelector(".srm-badge--highlight")!.textContent).toBe("1");
        expect(rows[3].textContent).toContain("1 room");

        await userEvent.keyboard("{ArrowDown}{ArrowDown}");
        expect(rows[2].getAttribute("aria-selected")).toBe("true");
        await userEvent.keyboard("{Enter}");
        expect(openRoom).toHaveBeenCalledWith("!design:x");
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("selects the space under the pointer", async () => {
        await loadModule();
        press("i", { ctrlKey: true });
        const design = items()[2];
        await userEvent.hover(design);
        expect(design.getAttribute("aria-selected")).toBe("true");
        // "All spaces" and the groups have no room to open: clicking them keeps the map open.
        await userEvent.click(items()[0]);
        await userEvent.click(items()[3]);
        expect(screen.getByRole("dialog")).toBeTruthy();
    });

    it("searches rooms and spaces, moves with arrows and closes with Esc", async () => {
        const { openRoom } = await loadModule();
        press("i", { ctrlKey: true });
        await userEvent.keyboard("o");
        expect(names(items("Results"))).toEqual(["Ops", "Random"]);
        expect(items("Results")[0].textContent).toContain("Engineering");
        await userEvent.keyboard("{ArrowDown}{Enter}");
        expect(openRoom).toHaveBeenCalledWith("!random:x");

        press("i", { ctrlKey: true });
        await userEvent.keyboard("zz{Escape}");
        expect(names(items())).toContain("Engineering");
        await userEvent.keyboard("{Escape}");
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("shows space avatars in the list and a legend that can be folded away", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { headers: { "Content-Type": "image/png" } })));
        URL.createObjectURL = () => "blob:eng";
        URL.revokeObjectURL = () => undefined;
        await loadModule();
        press("i", { ctrlKey: true });
        await vi.waitFor(() => expect(items()[1].querySelector("img")!.getAttribute("src")).toBe("blob:eng"));
        const legend = screen.getByRole("button", { name: /Legend/ });
        expect(screen.getByText("Mentions you")).toBeTruthy();
        await userEvent.click(legend);
        expect(screen.queryByText("Mentions you")).toBeNull();
        press("i", { ctrlKey: true });
        press("i", { ctrlKey: true });
        expect(screen.getByRole("button", { name: /Legend/ }).getAttribute("aria-expanded")).toBe("false");
    });

    it("leaves Ctrl+I to the composer when text is selected", async () => {
        await loadModule();
        const input = document.createElement("textarea");
        input.value = "hello";
        document.body.appendChild(input);
        input.focus();
        input.setSelectionRange(0, 5);
        const ev = press("i", { ctrlKey: true }, input);
        expect(ev.defaultPrevented).toBe(false);
        expect(screen.queryByRole("dialog")).toBeNull();
        input.setSelectionRange(5, 5);
        press("i", { ctrlKey: true }, input);
        expect(screen.getByRole("dialog")).toBeTruthy();
        input.remove();
    });
});

describe("config and trigger", () => {
    it("defaults and validation", () => {
        expect(parseConfig(undefined)).toEqual({ trigger_key: "Mod+I" });
        // Left over from versions with several views.
        expect(parseConfig({ default_view: "frequent" })).toEqual({ trigger_key: "Mod+I" });
        expect(() => parseConfig({ trigger_key: "Hyper+I" })).toThrow();
    });

    it("matches Mod per platform and by key code on other layouts", () => {
        const ev = (init: KeyboardEventInit) => new KeyboardEvent("keydown", init);
        expect(matchesCombo(ev({ key: "i", ctrlKey: true }), parseCombo("Mod+I", false))).toBe(true);
        expect(matchesCombo(ev({ key: "i", metaKey: true }), parseCombo("Mod+I", true))).toBe(true);
        expect(matchesCombo(ev({ key: "i", ctrlKey: true, shiftKey: true }), parseCombo("Mod+I", false))).toBe(false);
        // Cyrillic layout: the key labelled "I" produces "ш".
        expect(matchesCombo(ev({ key: "ш", code: "KeyI", ctrlKey: true }), parseCombo("Mod+I", false))).toBe(true);
    });
});
