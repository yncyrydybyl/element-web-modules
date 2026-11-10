import { act } from "@testing-library/react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REGISTRY_GLOBAL } from "./suite";
import TeamsWelcomeModule, { mountPoint } from "./index";

class FakeWatchable {
    private listeners = new Set<(v: unknown) => void>();
    public constructor(public value: unknown) {}
    public watch(l: (v: unknown) => void): void {
        this.listeners.add(l);
    }
    public unwatch(l: (v: unknown) => void): void {
        this.listeners.delete(l);
    }
    public set(v: unknown): void {
        this.value = v;
        this.listeners.forEach((l) => l(v));
    }
}

function setup(accountData: unknown, config: unknown = { organisation: "Contoso", spaces: ["#a:x"] }) {
    const watchable = new FakeWatchable(accountData);
    const set = vi.fn(async (_type: string, content: unknown) => watchable.set(content));
    const api = {
        config: { get: (key: string) => (key === "de.datanauten.teamswelcome" ? config : undefined) },
        i18n: { register: vi.fn(), translate: (key: string) => key },
        client: { accountData: { get: vi.fn(() => watchable), set } },
        navigation: { registerLocationRenderer: vi.fn(), openRoom: vi.fn() },
        settings: { getValue: () => false },
        createRoot: (el: Element) => createRoot(el),
    };
    const sdk = {
        getUserId: () => "@u:x",
        getDeviceId: () => "D",
        isInitialSyncComplete: () => true,
        getRoom: () => null,
        getRooms: () => [],
        getCrypto: () => undefined,
        getProfileInfo: async () => ({}),
        getRoomIdForAlias: async () => ({ room_id: "!a" }),
        on: vi.fn(),
        off: vi.fn(),
    };
    (window as unknown as { mxMatrixClientPeg: unknown }).mxMatrixClientPeg = { get: () => sdk };
    const module = new TeamsWelcomeModule(api as never);
    return { module, api, set, watchable };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
    vi.useRealTimers();
    delete (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg;
    delete (window as unknown as Record<string, unknown>)[REGISTRY_GLOBAL];
    document.body.innerHTML = "";
    document.head.innerHTML = "";
});

const guide = (): Element | null => document.querySelector("[data-teams-welcome-guide]");

describe("TeamsWelcomeModule", () => {
    it("registers translations, the page, its stylesheet and itself in the suite registry", async () => {
        const { module, api } = setup(undefined);
        await module.load();
        expect(api.i18n.register).toHaveBeenCalled();
        expect(api.navigation.registerLocationRenderer).toHaveBeenCalledWith("teams-welcome", expect.any(Function));
        expect(document.getElementById("de-datanauten-teams-welcome-style")).not.toBeNull();
        expect((window as unknown as Record<string, Record<string, unknown>>)[REGISTRY_GLOBAL]["teams-welcome"]).toBeDefined();
        module.dispose();
    });

    it("opens by itself after the first sync, and remembers the close", async () => {
        const { module, set } = setup(undefined);
        await module.load();
        await act(async () => void vi.advanceTimersByTime(2000 + 1500));
        expect(guide()).not.toBeNull();
        await act(async () => (document.querySelector("[aria-label=datanauten_teamswelcome_close]") as HTMLElement).click());
        expect(guide()).toBeNull();
        expect(set).toHaveBeenCalledWith("de.datanauten.teamswelcome", expect.objectContaining({ dismissed: true }));
        module.dispose();
    });

    it("stays closed once dismissed, but opens on request", async () => {
        const { module } = setup({ dismissed: true });
        await module.load();
        await act(async () => void vi.advanceTimersByTime(5000));
        expect(guide()).toBeNull();
        await act(async () => module.openPanel("habits"));
        expect(document.querySelector('[data-step-body="habits"]')).not.toBeNull();
        module.dispose();
    });

    it("doesn't open by itself when the admin turned that off", async () => {
        const { module } = setup(undefined, { auto_open: false });
        await module.load();
        await act(async () => void vi.advanceTimersByTime(5000));
        expect(guide()).toBeNull();
        module.dispose();
    });
});

describe("mountPoint", () => {
    it("goes before Element's dialog containers so dialogs cover the panel", () => {
        const dialogs = document.createElement("div");
        dialogs.id = "mx_Dialog_StaticContainer";
        document.body.appendChild(dialogs);
        const el = mountPoint("x");
        expect(el.nextElementSibling).toBe(dialogs);
        document.body.removeChild(dialogs);
        expect(mountPoint("y").parentElement).toBe(document.body);
    });
});
