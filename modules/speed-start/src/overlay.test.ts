import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { phaseOf, SnapshotOverlay, startsLoggedIn } from "./overlay";
import { FORMAT, ROOM_ATTR, type Snapshot } from "./snapshot";

const snapshot: Snapshot = {
    format: FORMAT,
    userId: "@alice:x",
    build: "b",
    savedAt: 0,
    width: 1280,
    html: `<div class="mx_MatrixChat"><button class="mx_RoomListItemView" ${ROOM_ATTR}="!ops"><span>Ops</span></button></div>`,
};

const root = (): HTMLElement => document.getElementById("matrixchat")!;
const flush = async (): Promise<void> => {
    await Promise.resolve();
    vi.advanceTimersByTime(50);
};

beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(0), 16));
    document.body.innerHTML = `<div id="matrixchat"></div>`;
});
afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe("phaseOf", () => {
    it.each([
        ["", "booting"],
        [`<div class="mx_MatrixChat_splash"></div>`, "loading"],
        [`<div class="mx_MatrixChat_splash"><div class="mx_LoginSplashView_syncError">x</div></div>`, "other"],
        [`<div class="mx_MatrixChat"><nav class="mx_RoomListPanel"></nav></div>`, "ready"],
        [`<div class="mx_AuthPage"></div>`, "other"],
    ])("%s → %s", (html, phase) => {
        root().innerHTML = html;
        expect(phaseOf()).toBe(phase);
    });
});

describe("startsLoggedIn", () => {
    const at = (url: string): Location => new URL(url) as unknown as Location;
    it.each([
        ["https://e/#/room/!a", true],
        ["https://e/", true],
        ["https://e/#/login", false],
        ["https://e/#/welcome", false],
        ["https://e/?loginToken=x#/", false],
        ["https://e/?code=x&state=y#/", false],
    ])("%s → %s", (url, expected) => {
        expect(startsLoggedIn(at(url))).toBe(expected);
    });
});

describe("SnapshotOverlay", () => {
    it("draws the snapshot over Element while it boots and loads", async () => {
        const overlay = new SnapshotOverlay(snapshot);
        overlay.show();
        expect(document.querySelector('[data-testid="speed-start-snapshot"]')?.textContent).toBe("Ops");
        root().innerHTML = `<div class="mx_MatrixChat_splash"></div>`;
        await flush();
        expect(overlay.shown).toBe(true);
    });

    it("fades out once Element's room list has rows, and reports a clicked room", async () => {
        const onHandover = vi.fn();
        const overlay = new SnapshotOverlay(snapshot, { onHandover });
        overlay.show();
        document.querySelector<HTMLElement>(`[${ROOM_ATTR}] span`)!.click();
        root().innerHTML = `<div class="mx_MatrixChat"><nav class="mx_RoomListPanel"><button class="mx_RoomListItemView"></button></nav></div>`;
        await flush();
        expect(onHandover).toHaveBeenCalledWith("!ops");
        vi.advanceTimersByTime(500);
        expect(overlay.shown).toBe(false);
    });

    it("waits a grace period for rows, then goes anyway", async () => {
        const overlay = new SnapshotOverlay(snapshot, { rowsGraceMs: 1000 });
        overlay.show();
        root().innerHTML = `<div class="mx_MatrixChat"><nav class="mx_RoomListPanel"></nav></div>`;
        await flush();
        expect(overlay.shown).toBe(true);
        vi.advanceTimersByTime(1500);
        expect(overlay.shown).toBe(false);
    });

    it("goes at once for anything else Element shows", async () => {
        const onHandover = vi.fn();
        const overlay = new SnapshotOverlay(snapshot, { onHandover });
        overlay.show();
        root().innerHTML = `<div class="mx_CompleteSecurity"></div>`;
        await flush();
        expect(overlay.shown).toBe(false);
        expect(onHandover).toHaveBeenCalledWith(null);
    });

    it("gives up after the timeout", () => {
        const overlay = new SnapshotOverlay(snapshot, { timeoutMs: 5000 });
        overlay.show();
        vi.advanceTimersByTime(5001);
        expect(overlay.shown).toBe(false);
    });
});

describe("SnapshotOverlay without a snapshot", () => {
    it("covers the splash, decorates the overlay and cleans up when Element is ready", async () => {
        const cleanup = vi.fn();
        const decorate = vi.fn((host: HTMLElement) => {
            host.appendChild(document.createElement("aside"));
            return cleanup;
        });
        root().innerHTML = `<div class="mx_MatrixChat_splash"></div>`;
        const overlay = new SnapshotOverlay(null, { decorate });
        overlay.show();
        const host = document.querySelector(".speed-start-snapshot")!;
        expect(host.querySelector(".mx_MatrixChat_wrapper")).toBeNull();
        expect(host.querySelector("aside")).not.toBeNull();
        root().innerHTML = `<div class="mx_MatrixChat"><nav class="mx_RoomListPanel"><div class="mx_RoomListItemView"></div></nav></div>`;
        await flush();
        vi.advanceTimersByTime(400);
        expect(cleanup).toHaveBeenCalledOnce();
        expect(overlay.shown).toBe(false);
    });
});
