import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { Watchable, type Api } from "@element-hq/element-web-module-api";

import ModuleDefault, { isSafeMode, localise, parseConfig, RemoteModulesModule, skipDisabledServerModules } from "./index";
import { fetchSource, runModule, type SdkClient } from "./loader";
import { versionFromSource } from "./version";
import { isValidSource } from "./store";
import { nameFromSource } from "./ui/RemoteModulesSection";

const ME = "@yan:datanauten.de";

const CONFIG_MODULES = [
    "/element-modules/speed-start/index.js?v=111",
    "/element-modules/remote-modules/index.js?v=abc",
    "/element-modules/space-room-map/index.js?v=def",
];
const OWN_URL = `${window.location.origin}/element-modules/remote-modules/index.js?v=abc`;

function mockApi(options: { config?: unknown; accountData?: unknown; modules?: string[] }) {
    // Element's live config array, which the module may shorten.
    const configModules = options.modules ?? [...CONFIG_MODULES];
    const strings: Record<string, string> = {};
    const accountData = new Watchable<unknown>(options.accountData);
    const setAccountData = vi.fn(async (_type: string, content: unknown) => {
        accountData.value = content;
    });
    const api = {
        config: {
            get: (key?: string) => (key === "de.datanauten.remote_modules" ? options.config : key === "modules" ? configModules : undefined),
        },
        i18n: {
            language: "en",
            register: (t: Record<string, Record<string, string>>) => {
                for (const [k, v] of Object.entries(t)) strings[k] = v.en;
            },
            translate: (k: string, vars?: Record<string, string>) => (strings[k] ?? k).replace(/%\((\w+)\)s/g, (_, n) => vars?.[n] ?? ""),
        },
        profile: new Watchable({ userId: ME }),
        client: { accountData: { get: () => accountData, set: setAccountData, delete: vi.fn() } },
        createRoot: (el: Element) => createRoot(el),
    };
    return { api: api as unknown as Api, setAccountData, configModules };
}

function fakeClient(userId = ME): SdkClient & { uploadContent: ReturnType<typeof vi.fn> } {
    return {
        getUserId: () => userId,
        getAccessToken: () => "secret-token",
        mxcUrlToHttp: (mxc: string) => `https://matrix.example/_matrix/client/v1/media/download/${mxc.slice(6)}`,
        uploadContent: vi.fn(async () => ({ content_uri: "mxc://example/uploaded" })),
    };
}

/** Stands in for `import(blobUrl)`: each import returns a fresh module class with a load spy. */
function fakeImporter() {
    const loads: string[] = [];
    const importer = vi.fn(async () => ({
        default: class {
            public static moduleApiVersion = "^2.0.0";
            public async load(): Promise<void> {
                loads.push("loaded");
            }
        },
    }));
    return { importer, loads };
}

/** Element's user settings dialog, as a production build of TabbedView renders it (no data-testid), on its Preferences tab. */
function settingsDialog(): HTMLElement {
    const dialog = document.createElement("div");
    dialog.className = "mx_UserSettingsDialog";
    dialog.innerHTML = `
        <h1 class="mx_Dialog_title mx_UserSettingsDialog_title"><span class="mx_UserSettingsDialog_title_strong">Settings:</span> Preferences</h1>
        <div class="mx_TabbedView mx_TabbedView_tabsOnLeft">
            <ul class="mx_TabbedView_tabLabels" role="tablist">
                <li class="mx_TabbedView_tabLabel mx_TabbedView_tabLabel_active" role="tab" aria-controls="mx_tabpanel_USER_PREFERENCES_TAB">Preferences</li>
                <li class="mx_TabbedView_tabLabel" role="tab" aria-controls="mx_tabpanel_USER_HELP_TAB">Help &amp; About</li>
            </ul>
            <div class="mx_TabbedView_tabPanel" id="mx_tabpanel_USER_PREFERENCES_TAB">Element's own panel</div>
        </div>`;
    document.body.appendChild(dialog);
    return dialog;
}

const modules: RemoteModulesModule[] = [];
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn(async () => new Response("export default class {}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    URL.createObjectURL = vi.fn(() => "blob:fake");
    URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
    for (const m of modules.splice(0)) act(() => m.dispose());
    document.body.innerHTML = "";
    delete (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg;
    vi.unstubAllGlobals();
});

async function start(options: { config?: unknown; accountData?: unknown; client?: SdkClient; modules?: string[] }) {
    const { api, setAccountData, configModules } = mockApi(options);
    (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg = { get: () => options.client ?? fakeClient() };
    const { importer, loads } = fakeImporter();
    const module = new RemoteModulesModule(api, importer, OWN_URL);
    modules.push(module);
    await module.load();
    await act(async () => {
        await module.ready;
    });
    return { module, importer, loads, setAccountData, configModules };
}

const list = (...entries: Array<{ id: string; source: string; enabled?: boolean }>) => ({
    version: 1,
    modules: entries.map((e) => ({ name: e.id, enabled: true, ...e })),
});

describe("RemoteModulesModule", () => {
    it("is a valid module for Element's loader", () => {
        expect(ModuleDefault.moduleApiVersion).toBe("^2.0.0");
        expect(typeof ModuleDefault.prototype.load).toBe("function");
    });

    it("loads the enabled modules of an allowed user, mxc with the access token", async () => {
        const { importer, loads } = await start({
            config: { allowed_users: [ME] },
            accountData: list({ id: "a", source: "mxc://example/abc" }, { id: "b", source: "https://dev.example/x.js", enabled: false }),
        });
        expect(importer).toHaveBeenCalledTimes(1);
        expect(loads).toEqual(["loaded"]);
        expect(fetchMock).toHaveBeenCalledWith("https://matrix.example/_matrix/client/v1/media/download/example/abc", {
            headers: { Authorization: "Bearer secret-token" },
            cache: "no-store",
        });
    });

    it("only lets other users, or everyone without config, turn the server's modules off", async () => {
        const accountData = list({ id: "a", source: "mxc://example/abc" });
        const other = await start({ config: { allowed_users: [ME] }, accountData, client: fakeClient("@eve:example.org") });
        expect(other.importer).not.toHaveBeenCalled();
        settingsDialog();
        await screen.findByTestId("remote-modules-server");
        expect(screen.queryByTestId("remote-modules-dynamic")).toBeNull();
        expect(screen.getByRole("button", { name: "Turn off space-room-map" })).toBeTruthy();
        act(() => modules.splice(0).forEach((m) => m.dispose()));
        document.body.innerHTML = "";

        const none = await start({ accountData });
        expect(none.importer).not.toHaveBeenCalled();
        settingsDialog();
        await screen.findByTestId("remote-modules-server");
        expect(screen.queryByTestId("remote-modules-dynamic")).toBeNull();
        // Only the server's own modules, for their versions: nothing of the user's.
        const fetched = fetchMock.mock.calls.map(([url]) => new URL(String(url)).pathname);
        expect(fetched.every((path) => CONFIG_MODULES.some((src) => src.startsWith(path)))).toBe(true);
    });

    it("shows the version from each module's build", async () => {
        fetchMock.mockImplementation(async (url: string) => {
            const body = url.includes("space-room-map")
                ? "/*! @datanauten/element-web-module-space-room-map 0.4.1 */\nexport default class {}"
                : url.includes("dev.example")
                  ? "/*! my-module 1.2.0-beta.1 */\nexport default class {}"
                  : "export default class {}";
            return new Response(body, { status: 200 });
        });
        await start({ config: { allowed_users: [ME] }, accountData: list({ id: "mine", source: "https://dev.example/x.js" }) });
        settingsDialog();
        const server = within(await screen.findByTestId("remote-modules-server"));
        expect(await server.findByLabelText("Version 0.4.1")).toBeTruthy();
        expect(server.queryAllByText(/^\d+\.\d+\.\d+/)).toHaveLength(1);
        expect(fetchMock).toHaveBeenCalledWith(`${window.location.origin}/element-modules/space-room-map/index.js?v=def`, { cache: "force-cache" });
        const dynamic = within(screen.getByTestId("remote-modules-dynamic"));
        expect(dynamic.getByLabelText("Version 1.2.0-beta.1")).toBeTruthy();
    });

    it("turns server modules off for the next start, which then skips them", async () => {
        const first = await start({});
        settingsDialog();
        const server = within(await screen.findByTestId("remote-modules-server"));
        // Loaded before this module, or this module: can't be turned off.
        expect(server.queryByRole("button", { name: "Turn off speed-start" })).toBeNull();
        expect(server.queryByRole("button", { name: "Turn off remote-modules" })).toBeNull();
        expect(server.getAllByText("Always on")).toHaveLength(2);

        await userEvent.click(server.getByRole("button", { name: "Turn off space-room-map" }));
        expect(server.getByText("Still active until Element reloads")).toBeTruthy();
        expect(server.getByText(/Changes take effect when Element reloads/)).toBeTruthy();
        expect(first.setAccountData).toHaveBeenLastCalledWith(
            "de.datanauten.remote_modules",
            expect.objectContaining({ disabled_server: ["/element-modules/space-room-map/index.js"] }),
        );
        act(() => modules.splice(0).forEach((m) => m.dispose()));
        document.body.innerHTML = "";

        // Next start (a new build: new ?v=), before login: the module drops it from Element's list.
        const next = await start({ modules: CONFIG_MODULES.map((src) => src.replace("v=def", "v=new")) });
        expect(next.configModules).toEqual(CONFIG_MODULES.slice(0, 2));
        settingsDialog();
        const again = within(await screen.findByTestId("remote-modules-server"));
        expect(again.getByText("Turned off")).toBeTruthy();
        expect(again.queryByText(/Changes take effect/)).toBeNull();
        await userEvent.click(again.getByRole("button", { name: "Turn on space-room-map" }));
        expect(again.getByText("Loads when Element reloads")).toBeTruthy();
        expect(again.getByText(/Changes take effect/)).toBeTruthy();
    });

    it("shows what the config says about each server module, in the user's language", async () => {
        await start({
            config: {
                about: {
                    "space-room-map": {
                        description: { en: "A map of your spaces.", de: "Eine Karte deiner Spaces." },
                        usage: { de: ["Strg+I: Karte öffnen"], en: ["Ctrl+I: open the map", "Esc: close it"] },
                        link: "https://example.org/space-room-map#readme",
                    },
                    "speed-start": { description: "Your room list at once.", link: "javascript:alert(1)" },
                },
            },
        });
        settingsDialog();
        const server = within(await screen.findByTestId("remote-modules-server"));
        expect(server.getByText("A map of your spaces.")).toBeTruthy();
        expect(server.getByText("Your room list at once.")).toBeTruthy();
        expect(server.getAllByText("How to use")).toHaveLength(1);
        await userEvent.click(server.getByText("How to use"));
        expect(server.getByText("Esc: close it")).toBeTruthy();
        expect(server.getByRole("link", { name: "Read more" }).getAttribute("href")).toBe("https://example.org/space-room-map#readme");
    });

    it("ignores another user's turned-off modules", async () => {
        localStorage.setItem(
            "de.datanauten.remote_modules.list",
            JSON.stringify({ version: 1, modules: [], disabled_server: ["/element-modules/space-room-map/index.js"], user: "@eve:example.org" }),
        );
        localStorage.setItem("mx_user_id", ME);
        const { configModules } = await start({});
        expect(configModules).toEqual(CONFIG_MODULES);
    });

    it("adds a Modules tab to the settings; lists the server's modules; add by URL, unload, load, remove", async () => {
        const { setAccountData, loads } = await start({ config: { allowed_users: [ME] } });
        const dialog = settingsDialog();
        const view = dialog.querySelector(".mx_TabbedView")!;
        const title = dialog.querySelector<HTMLElement>(".mx_UserSettingsDialog_title")!;
        await screen.findByTestId("remote-modules-section");

        // Its own tab, last in the list; closed until clicked.
        const label = screen.getByRole("tab", { name: "Modules" });
        expect(label.parentElement!.lastElementChild).toBe(label);
        // Element re-appending its own labels (a re-render) doesn't push it up the list.
        const tablist = label.parentElement!;
        await act(async () => {
            tablist.appendChild(tablist.firstElementChild!);
        });
        expect(tablist.lastElementChild).toBe(label);
        expect(view.hasAttribute("data-drm-modules")).toBe(false);
        await userEvent.click(label);
        expect(view.hasAttribute("data-drm-modules")).toBe(true);
        expect(label.getAttribute("aria-selected")).toBe("true");
        expect(title.dataset).toMatchObject({ drmPrefix: "Settings:", drmTab: "Modules" });
        // Any of Element's tabs closes it again, even the one Element still has selected.
        await userEvent.click(screen.getByRole("tab", { name: "Preferences" }));
        expect(view.hasAttribute("data-drm-modules")).toBe(false);
        expect(title.dataset.drmTab).toBeUndefined();
        await userEvent.click(label);

        const server = within(screen.getByTestId("remote-modules-server"));
        expect(server.getByText("remote-modules")).toBeTruthy();
        expect(server.getByText("space-room-map")).toBeTruthy();
        expect(server.getByText("/element-modules/space-room-map/index.js?v=def")).toBeTruthy();
        expect(server.getByRole("button", { name: "Turn off space-room-map" })).toBeTruthy();

        const dynamic = within(screen.getByTestId("remote-modules-dynamic"));
        expect(dynamic.getByText("No modules yet.")).toBeTruthy();

        await userEvent.type(dynamic.getByLabelText("Module URL or mxc:// URI"), "http://localhost:5173/my-module/lib/index.js");
        await userEvent.click(dynamic.getByRole("button", { name: "Add" }));
        await waitFor(() => expect(dynamic.getByText(/^Loaded \(/)).toBeTruthy());
        expect(dynamic.getByText("my-module")).toBeTruthy();
        expect(loads).toEqual(["loaded"]);
        expect(setAccountData).toHaveBeenLastCalledWith("de.datanauten.remote_modules", expect.objectContaining({ version: 1 }));

        await userEvent.click(dynamic.getByRole("button", { name: "Unload my-module" }));
        expect(dynamic.getByText("Still active until Element reloads")).toBeTruthy();
        expect(dynamic.getByText(/stay active until then/)).toBeTruthy();

        // Loading it again while it still runs just switches it back on, without a second copy.
        await userEvent.click(dynamic.getByRole("button", { name: "Load my-module" }));
        await waitFor(() => expect(dynamic.getByText(/^Loaded \(/)).toBeTruthy());
        expect(loads).toEqual(["loaded"]);
        expect(dynamic.queryByText(/stay active until then/)).toBeNull();

        await userEvent.click(dynamic.getByRole("button", { name: "Remove my-module" }));
        expect(dynamic.getByText("No modules yet.")).toBeTruthy();
        expect(dynamic.getByText(/stay active until then/)).toBeTruthy();
    });

    it("uploads a file to the media repo and loads it", async () => {
        const client = fakeClient();
        await start({ config: { allowed_users: [ME] }, client });
        settingsDialog();
        const section = await screen.findByTestId("remote-modules-dynamic");
        const file = new File(["export default class {}"], "my-module.js", { type: "text/javascript" });
        await userEvent.upload(within(section).getByTestId("remote-modules-file"), file);
        await waitFor(() => expect(within(section).getByText(/^Loaded \(/)).toBeTruthy());
        expect(client.uploadContent).toHaveBeenCalledWith(file, { name: "my-module.js", type: "text/javascript", includeFilename: true });
        expect(within(section).getByText("mxc://example/uploaded")).toBeTruthy();
        expect(within(section).getByText("my-module")).toBeTruthy();
    });

    it("shows load errors and rejects bad sources", async () => {
        fetchMock.mockResolvedValue(new Response("nope", { status: 404, statusText: "Not Found" }));
        await start({ config: { allowed_users: [ME] }, accountData: list({ id: "a", source: "https://dev.example/x.js" }) });
        settingsDialog();
        const section = await screen.findByTestId("remote-modules-dynamic");
        expect(within(section).getByText("Failed: 404 Not Found fetching https://dev.example/x.js")).toBeTruthy();
        expect(within(section).getByRole("button", { name: "Retry" })).toBeTruthy();

        await userEvent.type(within(section).getByLabelText("Module URL or mxc:// URI"), "http://evil.example/x.js");
        await userEvent.click(within(section).getByRole("button", { name: "Add" }));
        expect(within(section).getByRole("alert").textContent).toMatch(/http:\/\/localhost/);
    });
});

describe("loader", () => {
    it("rejects files that aren't Element modules", async () => {
        const api = {} as Api;
        await expect(runModule("x", api, async () => ({ default: 42 }))).rejects.toThrow(/Not an Element module/);
        await expect(runModule("x", api, async () => Promise.reject(new TypeError("Failed to fetch dynamically imported module: blob:x")))).rejects.toThrow(
            /Content Security Policy/,
        );
    });

    it("fetches https sources without credentials", async () => {
        await fetchSource("https://dev.example/x.js", undefined);
        expect(fetchMock).toHaveBeenCalledWith("https://dev.example/x.js", { headers: {}, cache: "no-store" });
        await expect(fetchSource("mxc://a/b", undefined)).rejects.toThrow("Not logged in");
    });
});

describe("versionFromSource", () => {
    it.each([
        ["/*! @datanauten/element-web-module-speed-start 0.2.0 */\nvar e", "0.2.0"],
        ["/*! marcade-element-module v1.10.3 */", "1.10.3"],
        ["/**\n * Some module\n * @version 2.0.0-rc.1\n */", "2.0.0-rc.1"],
        ["// 1.2.3\nvar e", undefined],
        ["var e = '/*! x 1.2.3 */'", undefined],
        ["/*! no version here */", undefined],
    ])("%j → %s", (code, version) => {
        expect(versionFromSource(code)).toBe(version);
    });
});

describe("helpers", () => {
    it("localises config texts", () => {
        const isString = (v: unknown): v is string => typeof v === "string";
        expect(localise("plain", "de", isString)).toBe("plain");
        expect(localise({ en: "Hi", de: "Hallo" }, "de-AT", isString)).toBe("Hallo");
        expect(localise({ en: "Hi", de: "Hallo" }, "fr", isString)).toBe("Hi");
        expect(localise({ fr: "Salut" }, "de", isString)).toBe("Salut");
        expect(localise(42 as never, "de", isString)).toBeUndefined();
    });

    it("skips only turned-off modules listed after its own", () => {
        const list = ["/a/index.js?v=1", "/own/index.js?v=2", "/b/index.js?v=3", "/c/index.js"];
        const skipped = skipDisabledServerModules(list, `${window.location.origin}/own/index.js?v=9`, ["/a/index.js", "/c/index.js"]);
        expect(list).toEqual(["/a/index.js?v=1", "/own/index.js?v=2", "/b/index.js?v=3"]);
        expect([...skipped]).toEqual(["/c/index.js"]);
        // Not in the list (loaded some other way): nothing is safe to drop.
        expect(skipDisabledServerModules(list, "https://other.example/x.js", ["/b/index.js"]).size).toBe(0);
    });

    it("config, safe mode, sources and names", () => {
        expect(parseConfig(undefined)).toEqual({ allowed_users: [], about: {} });
        expect(() => parseConfig({ about: [] })).toThrow();
        expect(() => parseConfig({ allowed_users: ["yan"] })).toThrow();
        expect(isSafeMode({ search: "?remote_modules=off", hash: "" })).toBe(true);
        expect(isSafeMode({ search: "", hash: "#/home?remote_modules=off" })).toBe(true);
        expect(isSafeMode({ search: "", hash: "#/home" })).toBe(false);
        expect(isValidSource("mxc://datanauten.de/AbC")).toBe(true);
        expect(isValidSource("http://localhost:5173/index.js")).toBe(true);
        expect(isValidSource("http://example.org/index.js")).toBe(false);
        expect(isValidSource("javascript:alert(1)")).toBe(false);
        expect(nameFromSource("http://localhost:5173/space-room-map/lib/index.js")).toBe("space-room-map");
        expect(nameFromSource("https://x.example/mods/foo.js")).toBe("foo.js");
        expect(nameFromSource("/element-modules/space-room-map/index.js?v=abc")).toBe("space-room-map");
    });
});
