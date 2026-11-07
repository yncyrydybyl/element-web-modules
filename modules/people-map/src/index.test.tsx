import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ModuleDefault, { parseConfig, PeopleMapModule } from "./index";
import { SETTINGS_TYPE, type MapSettings } from "./settings";
import { fakeClient, type FakeRoom } from "./tests/fakeClient";
import { mockApi } from "./tests/mockApi";
import { version } from "../package.json";

const modules: PeopleMapModule[] = [];

async function loadModule(options: Parameters<typeof mockApi>[0] & { settings?: Partial<MapSettings> } = {}) {
    const mock = mockApi({ ...options, accountData: { [SETTINGS_TYPE]: { animations: false, ...options.settings }, ...options.accountData } });
    const module = new PeopleMapModule(mock.api);
    await module.load();
    modules.push(module);
    return { module, ...mock };
}

const ROOMS: FakeRoom[] = [
    { id: "!eng:x", name: "Engineering", space: true, children: ["!web:x", "!ops:x"] },
    { id: "!web:x", name: "Web", people: [{ id: "@alice:x", name: "Alice" }, { id: "@bob:x", name: "Bob" }, { id: "@carol:y", name: "Carol" }] },
    { id: "!ops:x", name: "Ops", people: [{ id: "@alice:x", name: "Alice" }, { id: "@bob:x", name: "Bob" }] },
    { id: "!dm:x", name: "Alice", people: [{ id: "@alice:x", name: "Alice" }], lastActive: Date.now() - 3_600_000 },
];

const rows = () => within(screen.getByRole("listbox")).getAllByRole("option");
const names = () => rows().map((o) => o.querySelector(".pm-item-name")!.textContent);

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body) {
    const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
    act(() => {
        target.dispatchEvent(ev);
    });
    return ev;
}

beforeEach(() => {
    (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg = {
        get: () => fakeClient(ROOMS, { dms: { "@alice:x": ["!dm:x"] }, presence: { "@bob:x": "online" } }),
    };
});

afterEach(() => {
    for (const m of modules.splice(0)) act(() => m.dispose());
    delete (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg;
    vi.restoreAllMocks();
});

describe("PeopleMapModule", () => {
    it("is a valid module for Element's loader", () => {
        expect(typeof ModuleDefault).toBe("function");
        expect(ModuleDefault.moduleApiVersion).toBe("^2.0.0");
        expect(parseConfig(undefined)).toEqual({ trigger_key: "Alt+P" });
        expect(() => parseConfig({ trigger_key: "Hyper+P" })).toThrow();
    });

    it("opens with Alt+P and lists your people, closest first", async () => {
        const { module } = await loadModule();
        const ev = press("p", { altKey: true, code: "KeyP" });
        expect(ev.defaultPrevented).toBe(true);
        expect(module.isOpen()).toBe(true);
        expect(screen.getByRole("dialog", { name: "People" })).toBeTruthy();
        expect(screen.getByText("3 people")).toBeTruthy();
        expect(names()).toEqual(["Alice", "Bob", "Carol"]);
        expect(rows()[0].textContent).toContain("Direct message");
        expect(rows()[1].querySelector(".pm-online")).toBeTruthy();
        expect(screen.getByText(`v${version}`)).toBeTruthy();
        press("p", { altKey: true, code: "KeyP" });
        expect(module.isOpen()).toBe(false);
    });

    it("searches, filters and sorts", async () => {
        const user = userEvent.setup();
        const { module } = await loadModule();
        act(() => module.open());
        await user.type(screen.getByRole("searchbox"), "car");
        expect(names()).toEqual(["Carol"]);
        await user.clear(screen.getByRole("searchbox"));
        await user.click(screen.getByRole("button", { name: "My server" }));
        expect(names()).toEqual(["Alice", "Bob"]);
        await user.click(screen.getByRole("button", { name: "With DM" }));
        expect(names()).toEqual(["Alice"]);
        await user.click(screen.getByRole("button", { name: "Everyone" }));
        await user.selectOptions(screen.getByRole("combobox", { name: "Sort" }), "name");
        expect(names()).toEqual(["Alice", "Bob", "Carol"]);
        await user.selectOptions(screen.getByRole("combobox", { name: "Sort" }), "recent");
        expect(names()[0]).toBe("Alice");
        expect(localStorage.getItem("de.datanauten.people_map.sort")).toBe("recent");
    });

    it("shows a person's card, opens your DM or their profile", async () => {
        const user = userEvent.setup();
        const { module, openRoom, toMatrixToLink } = await loadModule();
        act(() => module.open());
        await user.click(rows()[0]);
        const card = screen.getByTestId("people-map-card");
        expect(within(card).getByText("@alice:x")).toBeTruthy();
        expect(within(card).getByText("Known from Engineering")).toBeTruthy();
        expect(within(card).getByText("2 shared rooms")).toBeTruthy();
        expect(within(card).getByText("Web")).toBeTruthy();
        await user.click(within(card).getByRole("button", { name: "Message" }));
        expect(openRoom).toHaveBeenCalledWith("!dm:x");
        expect(module.isOpen()).toBe(false);

        act(() => module.open());
        await user.click(rows()[2]);
        expect(within(screen.getByTestId("people-map-card")).queryByRole("button", { name: "Message" })).toBeNull();
        await user.click(screen.getByRole("button", { name: "Profile" }));
        expect(toMatrixToLink).toHaveBeenCalledWith("https://matrix.to/#/%40carol%3Ay");
    });

    it("walks the list with the keyboard; Esc goes back, then closes", async () => {
        const user = userEvent.setup();
        const { module } = await loadModule();
        act(() => module.open());
        await user.keyboard("{ArrowDown}");
        expect(rows()[1].getAttribute("aria-selected")).toBe("true");
        await user.keyboard("{Enter}");
        expect(within(screen.getByTestId("people-map-card")).getByText("@bob:x")).toBeTruthy();
        await user.keyboard("{Escape}");
        expect(screen.queryByTestId("people-map-card")).toBeNull();
        await user.keyboard("{Escape}");
        expect(module.isOpen()).toBe(false);
    });

    it("does nothing without Element's client", async () => {
        delete (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg;
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const { module } = await loadModule();
        act(() => module.open());
        expect(module.isOpen()).toBe(false);
    });

    it("rebuilds when a setting changes who's on the map", async () => {
        (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg = {
            get: () => fakeClient([...ROOMS, { id: "!bots:x", name: "Bots", people: ["@githubbot:x"] }]),
        };
        const { module, setAccountData } = await loadModule();
        act(() => module.open());
        expect(names()).not.toContain("githubbot");
        await act(async () => {
            await setAccountData(SETTINGS_TYPE, { animations: false, bots: true });
        });
        expect(names()).toContain("githubbot");
    });

    it("adds its section to Settings → Preferences", async () => {
        const user = userEvent.setup();
        const { setAccountData } = await loadModule();
        const panel = document.createElement("div");
        panel.id = "mx_tabpanel_USER_PREFERENCES_TAB";
        panel.innerHTML = `<div class="mx_SettingsSection"><div class="mx_SettingsSubsection"><h3 class="mx_SettingsSubsectionHeading_heading">common|spaces</h3></div></div>`;
        await act(async () => {
            document.body.appendChild(panel);
            await Promise.resolve();
        });
        const section = await screen.findByTestId("people-map-settings");
        expect(within(section).getByText("People map")).toBeTruthy();
        await user.click(within(section).getByRole("switch", { name: /Bots/ }));
        expect(setAccountData).toHaveBeenCalledWith(SETTINGS_TYPE, expect.objectContaining({ bots: true }));
        panel.remove();
    });
});
