import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { SecureStatus } from "../client";
import { parseConfig } from "../config";
import { interpolate, translations } from "../i18n";
import { Guide, type GuideServices, type SpaceState } from "./Guide";

const table = translations as Record<string, { en: string }>;
const t = (key: string, vars?: Record<string, string | number>): string => interpolate(table[key]?.en ?? key, vars);

const config = parseConfig({
    organisation: "Contoso",
    help_url: "https://help.example",
    spaces: [{ alias: "#a:x", name: "Alpha" }, "#b:x"],
});

function services(over: Partial<GuideServices> = {}): GuideServices {
    return {
        secureStatus: async () => ({ keyStorage: true, recovery: false, verified: true }),
        runSecure: vi.fn(),
        canOpenSettings: () => true,
        openSettings: vi.fn(),
        profile: async () => ({ userId: "@u:x", displayName: "Uma", hasName: true, hasAvatar: false }),
        notificationsOn: () => false,
        spaces: async () => [],
        joinSpace: vi.fn(async () => undefined),
        openSpace: vi.fn(),
        isLoaded: () => false,
        ...over,
    };
}

describe("Guide", () => {
    it("starts with the recovery key and launches Element's setup", async () => {
        const s = services();
        render(<Guide t={t} config={config} services={s} variant="panel" onClose={vi.fn()} pollMs={20} />);
        expect(screen.getByRole("heading", { name: "Welcome to Contoso on Element" })).toBeTruthy();
        await screen.findByRole("button", { name: /Set up recovery key/ });
        const checks = await waitFor(() => {
            const els = document.querySelectorAll("[data-ok]");
            expect(els).toHaveLength(3);
            return [...els].map((e) => e.getAttribute("data-ok"));
        });
        expect(checks).toEqual(["ok", "todo", "ok"]);
        await userEvent.click(screen.getByRole("button", { name: /Set up recovery key/ }));
        expect(s.runSecure).toHaveBeenCalledWith("set_up_recovery");
        expect(screen.getByRole("link", { name: "Questions? Contact your IT team" }).getAttribute("href")).toBe("https://help.example");
    });

    it("turns green when the crypto state changes (polled)", async () => {
        let status: SecureStatus = { keyStorage: true, recovery: false, verified: true };
        render(<Guide t={t} config={config} services={services({ secureStatus: async () => status })} variant="panel" pollMs={20} />);
        await screen.findByRole("button", { name: /Set up recovery key/ });
        expect(screen.queryByRole("status")).toBeNull();
        status = { keyStorage: true, recovery: true, verified: true };
        expect((await screen.findByRole("status")).textContent).toContain("All set");
        expect(screen.queryByRole("button", { name: /Set up recovery key/ })).toBeNull();
        // The step tab shows a tick.
        expect(document.querySelector('[data-step="secure"]')?.classList.contains("twl-done")).toBe(true);
    });

    it("shows sibling modules' answers only when they're loaded", async () => {
        render(
            <Guide t={t} config={config} services={services({ isLoaded: (id) => id === "teamwork" })} variant="panel" initialStep="habits" pollMs={1000} />,
        );
        const schedule = document.querySelector('[data-entry="schedule"]') as HTMLElement;
        expect(schedule.dataset.module).toBe("teamwork");
        expect(within(schedule).getByText("Add-on")).toBeTruthy();
        expect(schedule.textContent).toContain("Send later");
        expect((document.querySelector('[data-entry="files"]') as HTMLElement).dataset.module).toBeUndefined();
        // Without the keyboard-shortcuts module the card links to Element's own list.
        expect(screen.getByRole("button", { name: "All shortcuts" })).toBeTruthy();
    });

    it("points to the keyboard-shortcuts module instead of duplicating it", () => {
        render(<Guide t={t} config={config} services={services({ isLoaded: (id) => id === "keyboard-shortcuts" })} variant="page" initialStep="habits" />);
        expect(document.querySelector('[data-sibling="keyboard-shortcuts"]')?.textContent).toContain("Press ?");
        expect(screen.queryByRole("button", { name: "All shortcuts" })).toBeNull();
    });

    it("joins all configured spaces", async () => {
        const joined = new Set<string>();
        const s = services({
            spaces: async (): Promise<SpaceState[]> =>
                config.spaces.map((x) => ({ alias: x.alias, name: x.name ?? x.alias, membership: joined.has(x.alias) ? "join" : "none" })),
            joinSpace: vi.fn(async (alias: string) => void joined.add(alias)),
        });
        render(<Guide t={t} config={config} services={s} variant="panel" initialStep="spaces" pollMs={20} />);
        await userEvent.click(await screen.findByRole("button", { name: "Join all" }));
        await screen.findByText(/You're in/);
        expect(s.joinSpace).toHaveBeenCalledTimes(2);
        await userEvent.click(screen.getAllByRole("button", { name: "Open" })[0]);
        expect(s.openSpace).toHaveBeenCalledWith(expect.objectContaining({ alias: "#a:x" }));
    });

    it("shows why a join failed", async () => {
        const s = services({
            spaces: async () => config.spaces.map((x) => ({ alias: x.alias, name: x.name ?? x.alias, membership: "none" as const })),
            joinSpace: vi.fn(() => Promise.reject(new Error("not allowed"))),
        });
        render(<Guide t={t} config={config} services={s} variant="panel" initialStep="spaces" pollMs={1000} />);
        const join = screen.getAllByRole("button", { name: "Join" })[0];
        await userEvent.click(join);
        expect((await screen.findByRole("alert")).textContent).toBe("Couldn't join: not allowed");
    });

    it("walks through the steps and closes with Done", async () => {
        const onClose = vi.fn();
        render(<Guide t={t} config={config} services={services()} variant="panel" onClose={onClose} pollMs={1000} />);
        for (const body of ["habits", "profile", "spaces"]) {
            await userEvent.click(screen.getByRole("button", { name: "Next" }));
            expect(document.querySelector(`[data-step-body="${body}"]`)).not.toBeNull();
        }
        expect(screen.getByText("Step 4 of 4")).toBeTruthy();
        await userEvent.click(screen.getByRole("button", { name: "Done" }));
        expect(onClose).toHaveBeenCalled();
        await act(async () => undefined);
    });

    it("opens Element's settings from the profile step", async () => {
        const s = services();
        render(<Guide t={t} config={config} services={s} variant="panel" initialStep="profile" pollMs={1000} />);
        expect(await screen.findByText("Display name: Uma")).toBeTruthy();
        await userEvent.click(screen.getByRole("button", { name: "Edit profile" }));
        await userEvent.click(screen.getByRole("button", { name: "Notification settings" }));
        expect(s.openSettings).toHaveBeenNthCalledWith(1, "USER_ACCOUNT_TAB");
        expect(s.openSettings).toHaveBeenNthCalledWith(2, "USER_NOTIFICATIONS_TAB");
    });
});
