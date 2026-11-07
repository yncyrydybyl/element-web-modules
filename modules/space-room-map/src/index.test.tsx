import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ModuleDefault, { parseConfig, SpaceRoomMapModule } from "./index";
import { fakeClient, type FakeRoom } from "./tests/fakeClient";
import { SETTINGS_TYPE, type MapSettings } from "./settings";
import { mockApi } from "./tests/mockApi";
import { matchesCombo, parseCombo } from "./trigger";

const modules: SpaceRoomMapModule[] = [];

/** Animations are off unless a test asks for them: they delay opening a room. */
async function loadModule(options: Parameters<typeof mockApi>[0] & { settings?: Partial<MapSettings> } = {}) {
    const mock = mockApi({ ...options, accountData: { [SETTINGS_TYPE]: { animations: false, ...options.settings }, ...options.accountData } });
    const module = new SpaceRoomMapModule(mock.api);
    await module.load();
    modules.push(module);
    return { module, ...mock };
}

/** The rows of the list on the left (the space selector has options too). */
const items = (name = "Places") => within(screen.getByRole("listbox", { name })).getAllByRole("option");
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

    it("opens on Ctrl+I with districts, groups and spaces on the left, and opens a space with Enter", async () => {
        const { openRoom } = await loadModule();
        const ev = press("i", { ctrlKey: true, code: "KeyI" });
        expect(ev.defaultPrevented).toBe(true);
        expect(screen.getByRole("dialog", { name: "Map" })).toBeTruthy();
        const rows = items();
        // Random is a room of two outside any space, last active in 1970: an older chat.
        expect(names(rows)).toEqual(["Everything", "Communities", "Engineering", "Design", "People", "Matrix (older)"]);
        // Rooms and unread messages add up through sub-spaces; a mention shows in red.
        expect(rows[0].textContent).toContain("4 rooms");
        expect(rows[2].textContent).toContain("3 rooms");
        expect(rows[2].querySelector(".srm-badge--highlight")!.textContent).toBe("1");
        expect(rows[3].textContent).toContain("1 room");
        expect(rows[5].textContent).toContain("1 room");

        await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
        expect(rows[3].getAttribute("aria-selected")).toBe("true");
        await userEvent.keyboard("{Enter}");
        expect(openRoom).toHaveBeenCalledWith("!design:x");
        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("selects the space under the pointer", async () => {
        await loadModule();
        press("i", { ctrlKey: true });
        const design = items()[3];
        await userEvent.hover(design);
        // Chosen once the pointer rests on it.
        expect(design.getAttribute("aria-selected")).toBe("false");
        await vi.waitFor(() => expect(design.getAttribute("aria-selected")).toBe("true"));
        // "Everything", districts and groups that aren't a space only fly the map there.
        await userEvent.click(items()[0]);
        await userEvent.click(items()[1]);
        await userEvent.click(items()[5]);
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
        await vi.waitFor(() => expect(items()[2].querySelector("img")!.getAttribute("src")).toBe("blob:eng"));
        const legend = screen.getByRole("button", { name: /Legend/ });
        expect(screen.getByText("Mentions you (pulses)")).toBeTruthy();
        await userEvent.click(legend);
        expect(screen.queryByText("Mentions you (pulses)")).toBeNull();
        press("i", { ctrlKey: true });
        press("i", { ctrlKey: true });
        expect(screen.getByRole("button", { name: /Legend/ }).getAttribute("aria-expanded")).toBe("false");
    });

    it("switches to the tube map and remembers it", async () => {
        await loadModule();
        press("i", { ctrlKey: true });
        await userEvent.click(screen.getByRole("tab", { name: "Tube map" }));
        expect(screen.getByRole("img", { name: "Tube map of your spaces and rooms" })).toBeTruthy();
        expect(screen.getByText("Interchange: a sub-space, or a room in several spaces")).toBeTruthy();
        press("i", { ctrlKey: true });
        press("i", { ctrlKey: true });
        expect(screen.getByRole("tab", { name: "Tube map" }).getAttribute("aria-selected")).toBe("true");
        await userEvent.click(screen.getByRole("tab", { name: "Circles" }));
        expect(screen.getByRole("img", { name: "Map of your spaces and rooms" })).toBeTruthy();
    });

    it("comes back to where the map was after opening a room", async () => {
        await loadModule();
        press("i", { ctrlKey: true });
        await userEvent.click(screen.getByRole("tab", { name: "Tube map" }));
        const world = () => screen.getByRole("img", { name: "Tube map of your spaces and rooms" }).querySelector(":scope > g")!.getAttribute("transform");
        const first = world();
        const svg = screen.getByRole("img", { name: "Tube map of your spaces and rooms" });
        svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 600 }) as DOMRect;
        act(() => {
            svg.dispatchEvent(new WheelEvent("wheel", { deltaY: -300, clientX: 100, clientY: 100, cancelable: true }));
        });
        const zoomed = world();
        expect(zoomed).not.toBe(first);

        await userEvent.keyboard("Web{Enter}");
        expect(screen.queryByRole("dialog")).toBeNull();
        press("i", { ctrlKey: true });
        expect(world()).toBe(zoomed);
    });

    it("shows the module's version at the bottom", async () => {
        await loadModule();
        press("i", { ctrlKey: true });
        expect(screen.getByText(/^v\d+\.\d+\.\d+/)).toBeTruthy();
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

describe("hover intent", () => {
    it("doesn't choose rows the pointer only crosses on its way to the map", async () => {
        vi.useFakeTimers();
        try {
            await loadModule();
            press("i", { ctrlKey: true });
            const rows = items();
            const move = (el: Element) => act(() => void el.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 10, clientY: rows.indexOf(el as HTMLElement) * 40 })));
            // Down across three rows, then off the list.
            for (const row of rows.slice(2, 5)) {
                move(row);
                act(() => vi.advanceTimersByTime(80));
            }
            act(() => void screen.getByRole("listbox", { name: "Places" }).dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body })));
            act(() => vi.advanceTimersByTime(1000));
            expect(rows[0].getAttribute("aria-selected")).toBe("true");
            expect(rows.slice(1).some((r) => r.getAttribute("aria-selected") === "true")).toBe(false);

            // Resting on one chooses it.
            move(rows[3]);
            act(() => vi.advanceTimersByTime(250));
            expect(rows[3].getAttribute("aria-selected")).toBe("true");
        } finally {
            vi.useRealTimers();
        }
    });
});

describe("kept ready, live updates and animations", () => {
    const rooms = (): FakeRoom[] => [
        { id: "!eng:x", name: "Engineering", space: true, children: ["!web:x", "!ops:x"] },
        { id: "!web:x", name: "Web", lastActive: 100 },
        { id: "!ops:x", name: "Ops", lastActive: 50, unread: 4 },
        { id: "!random:x", name: "Random", lastActive: 10 },
    ];
    /** Element hands out the same client every time. */
    function stableClient(list = rooms()) {
        const client = fakeClient(list);
        (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg = { get: () => client };
        return { client, list };
    }
    const mapContainer = () => document.querySelector<HTMLElement>(".de-datanauten-space-room-map");

    it("keeps the map hidden between openings, and starts fresh each time", async () => {
        stableClient();
        await loadModule();
        press("i", { ctrlKey: true });
        const container = mapContainer()!;
        await userEvent.keyboard("we");
        press("i", { ctrlKey: true });
        expect(container.isConnected).toBe(true);
        expect(container.hidden).toBe(true);
        expect(screen.queryByRole("dialog")).toBeNull();

        press("i", { ctrlKey: true });
        expect(mapContainer()).toBe(container);
        expect(container.hidden).toBe(false);
        const search = screen.getByRole("combobox", { name: "Search rooms and spaces" }) as HTMLInputElement;
        expect(search.value).toBe("");
        expect(document.activeElement).toBe(search);
        expect(names(items())).toContain("Engineering");
    });

    it("builds the map again when rooms changed, and not at all when it's not kept", async () => {
        const { list } = stableClient();
        await loadModule();
        press("i", { ctrlKey: true });
        const first = mapContainer();
        press("i", { ctrlKey: true });
        list[1].avatar = "mxc://x/new";
        press("i", { ctrlKey: true });
        expect(mapContainer()).not.toBe(first);
        press("i", { ctrlKey: true });

        modules.splice(0).forEach((m) => act(() => m.dispose()));
        await loadModule({ settings: { keepReady: false } });
        press("i", { ctrlKey: true });
        press("i", { ctrlKey: true });
        expect(mapContainer()).toBeNull();
    });

    it("updates unread counts while open, and stops listening when closed", async () => {
        const { client, list } = stableClient();
        await loadModule();
        press("i", { ctrlKey: true });
        const random = () => items().find((o) => o.textContent?.includes("Matrix (older)"))!;
        expect(random().querySelector(".srm-badge")).toBeNull();
        list[3].unread = 3;
        act(() => client.emit("sync"));
        await vi.waitFor(() => expect(random().querySelector(".srm-badge")!.textContent).toBe("3"));
        press("i", { ctrlKey: true });
        expect(client.listenerCount("sync")).toBe(0);
    });

    it("leaves live updates off when they're turned off", async () => {
        const { client } = stableClient();
        await loadModule({ settings: { live: false } });
        press("i", { ctrlKey: true });
        expect(client.listenerCount("sync")).toBe(0);
    });

    it("zooms into a chosen room before opening it", async () => {
        stableClient();
        const { openRoom } = await loadModule({ settings: { animations: true } });
        press("i", { ctrlKey: true });
        await userEvent.keyboard("Web{Enter}");
        expect(openRoom).not.toHaveBeenCalled();
        expect(document.querySelector(".srm-backdrop--leaving")).toBeTruthy();
        await vi.waitFor(() => expect(openRoom).toHaveBeenCalledWith("!web:x"));
        expect(screen.queryByRole("dialog")).toBeNull();
        // Back again: no longer leaving.
        press("i", { ctrlKey: true });
        expect(document.querySelector(".srm-backdrop--leaving")).toBeNull();
    });

    it("colours the tube map's districts, or leaves them grey", async () => {
        stableClient();
        const { api } = await loadModule();
        press("i", { ctrlKey: true });
        await userEvent.click(screen.getByRole("tab", { name: "Tube map" }));
        const tube = screen.getByRole("img", { name: "Tube map of your spaces and rooms" });
        expect(tube.getAttribute("data-colours")).toBe("district");
        expect(tube.querySelector(".srm-tube-area--communities")).toBeTruthy();
        await act(() => api.client.accountData.set(SETTINGS_TYPE, { colours: "room" }));
        expect(tube.getAttribute("data-colours")).toBe("room");
    });
});

describe("settings in Preferences", () => {
    /** Element's Preferences tab, as far as the section needs it. */
    function preferencesTab(): HTMLElement {
        const panel = document.createElement("div");
        panel.id = "mx_tabpanel_USER_PREFERENCES_TAB";
        panel.innerHTML = `<div class="mx_SettingsTab_sections"><div class="mx_SettingsSection">
            <div class="mx_SettingsSubsection" id="lists"><div class="mx_SettingsSubsectionHeading"><h3 class="mx_SettingsSubsectionHeading_heading">Room list</h3></div></div>
            <form><div class="mx_SettingsSubsection" id="spaces"><div class="mx_SettingsSubsectionHeading"><h3 class="mx_SettingsSubsectionHeading_heading">common|spaces</h3></div></div></form>
            <div class="mx_SettingsSubsection" id="keyboard"><div class="mx_SettingsSubsectionHeading"><h3 class="mx_SettingsSubsectionHeading_heading">Keyboard</h3></div></div>
        </div></div>`;
        document.body.appendChild(panel);
        return panel;
    }

    it("adds a Space map section after Element's Spaces settings, and saves to account data", async () => {
        const { setAccountData } = await loadModule();
        const panel = preferencesTab();
        const section = await screen.findByTestId("space-room-map-settings");
        expect(panel.querySelector("#spaces")!.nextElementSibling).toBe(section.parentElement);
        expect(within(section).getByRole("heading", { name: "Space map" })).toBeTruthy();
        expect(section.textContent).toContain("Ctrl+I");

        await userEvent.click(within(section).getByRole("radio", { name: /By room/ }));
        expect(setAccountData).toHaveBeenLastCalledWith(SETTINGS_TYPE, expect.objectContaining({ colours: "room" }));
        const live = within(section).getByRole("switch", { name: /Live updates/ });
        expect((live as HTMLInputElement).checked).toBe(true);
        await userEvent.click(live);
        expect(setAccountData).toHaveBeenLastCalledWith(SETTINGS_TYPE, expect.objectContaining({ live: false }));
        expect((live as HTMLInputElement).checked).toBe(false);
        panel.remove();
    });

    it("takes settings changed on another device", async () => {
        const { api } = await loadModule();
        const panel = preferencesTab();
        const section = await screen.findByTestId("space-room-map-settings");
        await act(() => api.client.accountData.set(SETTINGS_TYPE, { keepReady: false }));
        expect((within(section).getByRole("switch", { name: /Keep the map ready/ }) as HTMLInputElement).checked).toBe(false);
        panel.remove();
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
