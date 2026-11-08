import { act, render, screen } from "@testing-library/react";
import { Watchable, type Api } from "@element-hq/element-web-module-api";
import { ClientWidgetApi } from "matrix-widget-api";
import type { JSX } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { APPROVALS_TYPE } from "./capabilities";
import { UserAccountWidgetsModule } from "./index";
import { fakeClient, fakeRoom } from "./tests/fakes";
import { USER_WIDGETS_TYPE } from "./widgets";

const FILES = "org.matrix.msc2762.receive.event:m.room.message#m.file";
const DOWNLOAD = "org.matrix.msc4039.download_file";
const PDF = { content: { type: "m.custom", url: "https://pdf.example/", name: "PDF viewer" } };
const PEOPLE = { content: { type: "m.custom", url: "https://people.example/", name: "Participants" } };

interface Harness {
    module: UserAccountWidgetsModule;
    accountData: Map<string, Watchable<unknown>>;
    dialogs: { component: string; props: Record<string, unknown>; resolve(r: { ok: boolean; model: unknown }): void }[];
    header(roomId: string): JSX.Element | undefined;
}

async function setup(config: Record<string, unknown> = {}, widgets: Record<string, unknown> = {}): Promise<Harness> {
    const accountData = new Map<string, Watchable<unknown>>();
    const data = (type: string) => {
        if (!accountData.has(type)) accountData.set(type, new Watchable<unknown>(undefined));
        return accountData.get(type)!;
    };
    data(USER_WIDGETS_TYPE).value = widgets;
    const dialogs: Harness["dialogs"] = [];
    let header: (roomId: string) => JSX.Element | undefined = () => undefined;
    const api = {
        i18n: { register: vi.fn(), translate: (key: string, vars?: Record<string, string>) => `${key}${vars ? JSON.stringify(vars) : ""}` },
        config: { get: () => config },
        extras: { addRoomHeaderButtonCallback: (cb: typeof header) => (header = cb) },
        client: {
            accountData: {
                get: data,
                set: vi.fn(async (type: string, content: unknown) => {
                    data(type).value = content;
                }),
            },
        },
        openDialog: (_opts: unknown, component: { name: string }, props: Record<string, unknown>) => {
            let resolve!: Harness["dialogs"][number]["resolve"];
            const finished = new Promise<{ ok: boolean; model: unknown }>((r) => (resolve = r));
            dialogs.push({ component: component.name, props, resolve });
            return { finished, close: vi.fn() };
        },
    } as unknown as Api;
    const module = new UserAccountWidgetsModule(api);
    await module.load();
    return { module, accountData, dialogs, header: (roomId) => header(roomId) };
}

let client: ReturnType<typeof fakeClient>;

beforeEach(() => {
    client = fakeClient([fakeRoom("!a:x"), fakeRoom("!b:x")]);
    (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg = { get: () => client };
    window.location.hash = "#/room/!a:x";
    vi.spyOn(ClientWidgetApi.prototype, "feedEvent").mockResolvedValue();
});

let harness: Harness | undefined;
afterEach(() => {
    harness?.module.dispose();
    harness = undefined;
    vi.restoreAllMocks();
    delete (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg;
    window.location.hash = "";
});

const frame = () => document.querySelector<HTMLIFrameElement>(".uaw-panel iframe");
const panel = () => document.querySelector<HTMLElement>(".uaw-panel")!;
const button = () => screen.getByTestId("user-account-widgets-button");

describe("header button and panel", () => {
    it("shows nothing before login", async () => {
        harness = await setup();
        delete (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg;
        expect(harness.header("!a:x")).toBeUndefined();
    });

    it("opens the dialog when there are no apps yet", async () => {
        harness = await setup();
        render(harness.header("!a:x")!);
        act(() => button().click());
        expect(harness.dialogs.map((d) => d.component)).toEqual(["ManageDialog"]);
        expect(panel().hidden).toBe(true);
    });

    it("opens the user's widget for the viewed room and restarts it when the room changes", async () => {
        harness = await setup({}, { pdf: PDF, people: PEOPLE });
        render(harness.header("!a:x")!);
        expect(button().getAttribute("aria-pressed")).toBe("false");

        act(() => button().click());
        expect(button().getAttribute("aria-pressed")).toBe("true");
        expect(panel().hidden).toBe(false);
        // Sorted by name: "Participants" before "PDF viewer".
        const first = frame()!;
        expect(first.src).toMatch(/^https:\/\/people\.example\/\?widgetId=people/);

        await act(async () => {
            window.location.hash = "#/room/!b:x";
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        });
        expect(first.isConnected).toBe(false);
        expect(frame()).not.toBe(first);

        // Nothing to show outside a room.
        await act(async () => {
            window.location.hash = "#/home";
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        });
        expect(panel().hidden).toBe(true);
        expect(frame()).toBeNull();

        await act(async () => {
            window.location.hash = "#/room/!a:x";
            window.dispatchEvent(new HashChangeEvent("hashchange"));
        });
        const select = document.querySelector<HTMLSelectElement>(".uaw-select")!;
        act(() => {
            select.value = "pdf";
            select.dispatchEvent(new Event("change"));
        });
        expect(frame()!.src).toMatch(/^https:\/\/pdf\.example\//);

        act(() => button().click());
        expect(panel().hidden).toBe(true);
        expect(frame()).toBeNull();
    });

    it("follows widgets added or removed on another device", async () => {
        harness = await setup({}, { pdf: PDF });
        render(harness.header("!a:x")!);
        act(() => button().click());
        expect(frame()).not.toBeNull();
        act(() => {
            harness!.accountData.get(USER_WIDGETS_TYPE)!.value = {};
        });
        expect(frame()).toBeNull();
        expect(panel().textContent).toContain("empty");
    });

    it("won't open a widget served from Element's origin", async () => {
        harness = await setup({}, { evil: { content: { url: `${window.location.origin}/x.html`, name: "Evil" } } });
        render(harness.header("!a:x")!);
        act(() => button().click());
        expect(frame()).toBeNull();
        expect(panel().textContent).toContain("same_origin");
    });
});

describe("consent", () => {
    type Approve = (widget: { id: string; url: string; name: string }, req: Set<string>) => Promise<Set<string>>;
    const approve = (h: Harness) => (h.module as unknown as { approve: Approve }).approve;
    const widget = { id: "pdf", url: "https://pdf.example/", name: "PDF viewer" };
    // Consent is only ever asked by a widget the panel started, so the module has started too.
    const started = async (config: Record<string, unknown> = {}) => {
        const h = await setup(config);
        h.header("!a:x");
        return h;
    };

    it("asks, grants what was ticked, drops what isn't offered and remembers it", async () => {
        harness = await started();
        const result = approve(harness)(widget, new Set(["io.element.requires_client", FILES, DOWNLOAD, "m.always_on_screen"]));
        await vi.waitFor(() => expect(harness!.dialogs).toHaveLength(1));
        expect(harness.dialogs[0].props.capabilities).toEqual([FILES, DOWNLOAD]);
        harness.dialogs[0].resolve({ ok: true, model: { approved: [FILES], remember: true } });
        expect([...(await result)].sort()).toEqual(["io.element.requires_client", FILES].sort());
        expect(harness.accountData.get(APPROVALS_TYPE)!.value).toEqual({
            approvals: { pdf: { url: widget.url, capabilities: [FILES] } },
        });

        // Next time (any room, any device) only the new capability is asked for.
        const again = approve(harness)(widget, new Set([FILES, DOWNLOAD]));
        await vi.waitFor(() => expect(harness!.dialogs).toHaveLength(2));
        expect(harness.dialogs[1].props.capabilities).toEqual([DOWNLOAD]);
        harness.dialogs[1].resolve({ ok: false, model: null });
        expect([...(await again)]).toEqual([FILES]);
    });

    it("doesn't ask for widgets under an approved prefix", async () => {
        harness = await started({ approve_prefixes: ["https://pdf.example/"] });
        expect([...(await approve(harness)(widget, new Set([FILES, DOWNLOAD])))]).toEqual([FILES, DOWNLOAD]);
        expect(harness.dialogs).toHaveLength(0);
    });

    it("shows one consent dialog at a time", async () => {
        harness = await started();
        const a = approve(harness)(widget, new Set([FILES]));
        const b = approve(harness)({ ...widget, id: "other", url: "https://other.example/" }, new Set([FILES]));
        await vi.waitFor(() => expect(harness!.dialogs).toHaveLength(1));
        harness.dialogs[0].resolve({ ok: true, model: { approved: [FILES], remember: false } });
        await a;
        await vi.waitFor(() => expect(harness!.dialogs).toHaveLength(2));
        harness.dialogs[1].resolve({ ok: false, model: null });
        expect([...(await b)]).toEqual([]);
        // Not remembered.
        expect(harness.accountData.get(APPROVALS_TYPE)?.value).toBeUndefined();
    });
});

describe("managing apps", () => {
    it("adds to and removes from m.widgets, keeping the sticker picker", async () => {
        const sticker = { content: { type: "m.stickerpicker", url: "https://stickers.example/" } };
        harness = await setup({}, { stickers: sticker });
        render(harness.header("!a:x")!);
        const add = (harness.module as unknown as { add(n: string, u: string): Promise<string> }).add;
        const remove = (harness.module as unknown as { remove(id: string): Promise<void> }).remove;

        const id = await add("PDF", "https://pdf.example/");
        const widgets = harness.accountData.get(USER_WIDGETS_TYPE)!.value as Record<string, unknown>;
        expect(Object.keys(widgets).sort()).toEqual([id, "stickers"].sort());

        harness.accountData.get(APPROVALS_TYPE)!.value = { approvals: { [id]: { url: "https://pdf.example/", capabilities: [FILES] } } };
        await remove(id);
        expect(harness.accountData.get(USER_WIDGETS_TYPE)!.value).toEqual({ stickers: sticker });
        expect(harness.accountData.get(APPROVALS_TYPE)!.value).toEqual({ approvals: {} });
    });
});
