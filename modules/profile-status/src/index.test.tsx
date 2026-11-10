import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Api } from "@element-hq/element-web-module-api";

import { translations } from "./i18n";
import ProfileStatusModule from "./index";
import { SetStatusDialog, type SetStatusDialogProps } from "./ui/SetStatusDialog";
import { CardDialog } from "./ui/CardDialog";
import type { SdkClient } from "./client";

// Element renders with React from window.React; tests use the real react-dom.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const en = (key: string, vars?: Record<string, string | number>): string => {
    let s = (translations as Record<string, { en: string }>)[key]?.en ?? key;
    for (const [k, v] of Object.entries(vars ?? {})) s = s.replace(`%(${k})s`, String(v));
    return s;
};

function makeApi(opts: { config?: Record<string, unknown>; elementStatus?: boolean } = {}) {
    const headerCallbacks: ((roomId: string) => unknown)[] = [];
    const openDialog = vi.fn();
    let accountData: unknown = {};
    const api = {
        i18n: { register: vi.fn(), translate: en },
        config: { get: () => opts.config ?? {} },
        extras: { addRoomHeaderButtonCallback: (cb: (roomId: string) => unknown) => headerCallbacks.push(cb) },
        client: {
            accountData: {
                get: () => ({ get value() { return accountData; }, watch: vi.fn(), unwatch: vi.fn() }),
                set: vi.fn(async (_t: string, v: unknown) => void (accountData = v)),
            },
        },
        settings: { getValue: (name: string) => (name === "feature_user_status" ? !!opts.elementStatus : undefined) },
        openDialog,
        createRoot: (el: Element) => createRoot(el),
    };
    return { api: api as unknown as Api, openDialog, headerCallbacks };
}

const profiles: Record<string, Record<string, unknown>> = {
    "@me:x": {},
    "@alice:x": {
        "org.matrix.msc4426.status": { emoji: "🔴", text: "Workshop", "de.datanauten.availability": "busy" },
        "de.datanauten.job_title": "Product Manager",
        "de.datanauten.phone": "+49 89 1",
    },
};

function installClient(): SdkClient {
    const client = {
        getUserId: () => "@me:x",
        isInitialSyncComplete: () => true,
        getRoom: () => null,
        getRooms: () => [],
        sendEvent: vi.fn(),
        doesServerSupportExtendedProfiles: async () => true,
        getExtendedProfile: vi.fn(async (u: string) => profiles[u] ?? {}),
        setExtendedProfileProperty: vi.fn(async () => {}),
        deleteExtendedProfileProperty: vi.fn(async () => {}),
        on: vi.fn(),
        off: vi.fn(),
    };
    (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg = { get: () => client };
    return client as unknown as SdkClient;
}

describe("ProfileStatusModule in a page", () => {
    let module: InstanceType<typeof ProfileStatusModule> | undefined;
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });
    afterEach(() => {
        module?.dispose();
        module = undefined;
        document.body.innerHTML = "";
        delete (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg;
        vi.useRealTimers();
    });

    async function boot(opts?: Parameters<typeof makeApi>[0]) {
        const client = installClient();
        const m = makeApi(opts);
        module = new ProfileStatusModule(m.api);
        await module.load();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(2100);
        });
        return { ...m, client };
    }

    it("adds Set status and Edit profile card to the user menu, styled like its items", async () => {
        const { openDialog } = await boot();
        document.body.insertAdjacentHTML(
            "beforeend",
            `<div role="menu"><span data-testid="userId">@me:x</span><section><button role="menuitem" class="_item_x"><svg></svg><span class="_label_x">All settings</span></button></section></div>`,
        );
        await act(async () => {
            await vi.advanceTimersByTimeAsync(50);
        });
        const item = await screen.findByTestId("profile-status-menu-status");
        expect(item.className).toContain("_item_x");
        expect(item.textContent).toContain("Set status");
        expect(screen.getByTestId("profile-status-menu-card").querySelector("svg path")).not.toBeNull();
        fireEvent.click(item);
        expect(openDialog).toHaveBeenCalledWith({ title: "Set your status" }, SetStatusDialog, expect.objectContaining({ supported: true }));
        fireEvent.click(screen.getByTestId("profile-status-menu-card"));
        await waitFor(() => expect(openDialog).toHaveBeenLastCalledWith({ title: "Profile card" }, CardDialog, expect.anything()));
    });

    it("decorates member tiles, timeline senders and the user info panel", async () => {
        await boot();
        document.body.insertAdjacentHTML(
            "beforeend",
            `<div class="mx_MemberTileView"><div class="mx_MemberTileView_avatar"><span title="@alice:x">A</span></div>
               <div class="mx_MemberTileView_name"><div class="mx_DisambiguatedProfile"><span>Alice</span></div></div></div>
             <div class="mx_UserInfo_profile"><h1>Alice</h1><span class="mx_UserInfo_profile_mxid">@alice:x</span></div>`,
        );
        await act(async () => {
            await vi.advanceTimersByTimeAsync(100);
        });
        await waitFor(() => expect(document.querySelector(".mx_MemberTileView .ps-inline .ps-dot--busy")).not.toBeNull());
        expect(document.querySelector(".mx_MemberTileView .ps-inline")?.getAttribute("title")).toBe("Busy · Workshop");
        const info = document.querySelector(".mx_UserInfo_profile .ps-userinfo") as HTMLElement;
        await waitFor(() => expect(info.textContent).toContain("Product Manager"));
        expect(info.textContent).toContain("Busy");
        expect(info.querySelector('a[href="tel:+49891"]')).not.toBeNull();
    });

    it("leaves the status to Element when its own MSC4426 feature is on, but still shows the card", async () => {
        await boot({ elementStatus: true });
        document.body.insertAdjacentHTML("beforeend", `<div class="mx_UserInfo_profile"><span class="mx_UserInfo_profile_mxid">@alice:x</span></div>`);
        await act(async () => {
            await vi.advanceTimersByTimeAsync(100);
        });
        const info = document.querySelector(".ps-userinfo") as HTMLElement;
        await waitFor(() => expect(info.textContent).toContain("Product Manager"));
        expect(info.textContent).not.toContain("Busy");
    });

    it("clears one's own status when its clear-after time is reached", async () => {
        const expires = Date.now() + 5000;
        profiles["@me:x"] = { "org.matrix.msc4426.status": { emoji: "🔴", text: "Busy", "de.datanauten.availability": "busy", "de.datanauten.expires_ts": expires } };
        try {
            const { client } = await boot();
            await act(async () => {
                await vi.advanceTimersByTimeAsync(1000);
            });
            expect(client.deleteExtendedProfileProperty).not.toHaveBeenCalled();
            await act(async () => {
                await vi.advanceTimersByTimeAsync(5000);
            });
            expect(client.deleteExtendedProfileProperty).toHaveBeenCalledWith("org.matrix.msc4426.status");
        } finally {
            profiles["@me:x"] = {};
        }
    });

    it("can turn the timeline and member list badges off by config", async () => {
        await boot({ config: { "de.datanauten.profile_status": { member_list: false } } });
        document.body.insertAdjacentHTML(
            "beforeend",
            `<div class="mx_MemberTileView"><div class="mx_MemberTileView_avatar"><span title="@alice:x">A</span></div><div class="mx_MemberTileView_name"><div class="mx_DisambiguatedProfile"><span>Alice</span></div></div></div>`,
        );
        await act(async () => {
            await vi.advanceTimersByTimeAsync(500);
        });
        expect(document.querySelector(".ps-inline")).toBeNull();
    });
});

describe("SetStatusDialog", () => {
    function renderDialog(over: Partial<SetStatusDialogProps> = {}) {
        const submit = vi.fn(async () => {});
        const onSubmit = vi.fn();
        render(
            <SetStatusDialog
                t={en}
                initial={{ availability: "available", text: "", clearAfter: "never", autoReply: false, autoReplyText: "", callStatus: true }}
                canAutoReply
                canCallStatus
                supported
                defaultReply={() => "default"}
                submit={submit}
                clear={vi.fn(async () => {})}
                onSubmit={onSubmit}
                onCancel={vi.fn()}
                {...over}
            />,
        );
        return { submit, onSubmit };
    }

    it("submits availability, text and clear-after", async () => {
        const { submit, onSubmit } = renderDialog();
        fireEvent.click(screen.getByTestId("profile-status-avail-busy"));
        fireEvent.change(screen.getByTestId("profile-status-text"), { target: { value: " In a workshop " } });
        fireEvent.click(screen.getByTestId("profile-status-clear-1h"));
        fireEvent.click(screen.getByTestId("profile-status-save"));
        await waitFor(() => expect(onSubmit).toHaveBeenCalled());
        expect(submit).toHaveBeenCalledWith(expect.objectContaining({ availability: "busy", text: "In a workshop", clearAfter: "1h", oooUntil: undefined }));
    });

    it("shows return date and the auto-reply option only for out of office", async () => {
        const { submit } = renderDialog();
        expect(screen.queryByTestId("profile-status-ooo-until")).toBeNull();
        fireEvent.click(screen.getByTestId("profile-status-avail-ooo"));
        expect(screen.queryByTestId("profile-status-clear-1h")).toBeNull();
        fireEvent.change(screen.getByTestId("profile-status-ooo-until"), { target: { value: "2099-01-05" } });
        fireEvent.click(screen.getByTestId("profile-status-auto-reply"));
        fireEvent.click(screen.getByTestId("profile-status-save"));
        await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ availability: "ooo", oooUntil: "2099-01-05", autoReply: true })));
    });

    it("blocks texts over 256 bytes and explains a missing server feature", () => {
        renderDialog();
        fireEvent.change(screen.getByTestId("profile-status-text"), { target: { value: "x".repeat(257) } });
        expect((screen.getByTestId("profile-status-save") as HTMLButtonElement).disabled).toBe(true);
    });

    it("explains when the homeserver has no profile fields", () => {
        renderDialog({ supported: false });
        expect(screen.getByText(/doesn't support profile fields/)).toBeTruthy();
    });
});

describe("CardDialog", () => {
    it("only lets the user change editable fields", async () => {
        const submit = vi.fn(async () => {});
        render(
            <CardDialog t={en} initial={{ job_title: "CTO", phone: "1" }} editable={["phone"]} submit={submit} onSubmit={vi.fn()} onCancel={vi.fn()} />,
        );
        expect((screen.getByTestId("profile-status-card-job_title") as HTMLInputElement).disabled).toBe(true);
        expect(screen.getAllByText(/Managed by your organisation/)).toHaveLength(2);
        fireEvent.change(screen.getByTestId("profile-status-card-phone"), { target: { value: " +49 1 " } });
        fireEvent.click(screen.getByTestId("profile-status-card-save"));
        await waitFor(() => expect(submit).toHaveBeenCalledWith({ phone: "+49 1" }));
    });
});
