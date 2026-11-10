import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SdkClient, SdkEvent } from "./client";
import { DECRYPTED_EVENT, RECENT_MS, UtdWatcher } from "./utd";

function event(id: string, failing: { v: boolean }, reason = "HISTORICAL_MESSAGE_BACKUP_UNCONFIGURED", ts = Date.now(), roomId = "!r"): SdkEvent {
    return {
        getId: () => id,
        getRoomId: () => roomId,
        getType: () => "m.room.message",
        getTs: () => ts,
        isDecryptionFailure: () => failing.v,
        decryptionFailureReason: reason,
    };
}

function fakeClient(loaded: SdkEvent[] = []): SdkClient & { emit(ev: SdkEvent): void } {
    const listeners = new Map<string, (ev: SdkEvent) => void>();
    return {
        getUserId: () => "@u:x",
        getRoom: () => null,
        getRooms: () => [{ roomId: "!r", name: "R", getLiveTimeline: () => ({ getEvents: () => loaded }) }],
        on: (name: string, l: (ev: SdkEvent) => void) => listeners.set(name, l),
        off: (name: string) => listeners.delete(name),
        emit: (ev: SdkEvent) => listeners.get(DECRYPTED_EVENT)?.(ev),
    } as unknown as SdkClient & { emit(ev: SdkEvent): void };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("UtdWatcher", () => {
    it("fires once for a failure that is still there after the grace period", () => {
        const onFailure = vi.fn();
        const w = new UtdWatcher(onFailure, 1000);
        const c = fakeClient();
        w.attach(c);
        c.emit(event("$1", { v: true }));
        c.emit(event("$2", { v: true }));
        vi.advanceTimersByTime(999);
        expect(onFailure).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(onFailure).toHaveBeenCalledTimes(1);
        c.emit(event("$3", { v: true }));
        vi.advanceTimersByTime(5000);
        expect(onFailure).toHaveBeenCalledTimes(1);
        w.rearm();
        c.emit(event("$4", { v: true }));
        vi.advanceTimersByTime(1000);
        expect(onFailure).toHaveBeenCalledTimes(2);
    });

    it("ignores failures that resolve during the grace period", () => {
        const onFailure = vi.fn();
        const w = new UtdWatcher(onFailure, 1000);
        const c = fakeClient();
        w.attach(c);
        const failing = { v: true };
        const ev = event("$1", failing);
        c.emit(ev);
        failing.v = false;
        c.emit(ev); // the retry succeeded
        vi.advanceTimersByTime(2000);
        expect(onFailure).not.toHaveBeenCalled();
    });

    it("ignores failures a recovery key can't fix", () => {
        const onFailure = vi.fn();
        const w = new UtdWatcher(onFailure, 10);
        const c = fakeClient();
        w.attach(c);
        c.emit(event("$1", { v: true }, "HISTORICAL_MESSAGE_USER_NOT_JOINED"));
        c.emit(event("$2", { v: true }, "UNSIGNED_SENDER_DEVICE"));
        vi.advanceTimersByTime(100);
        expect(onFailure).not.toHaveBeenCalled();
    });

    it("catches failures decrypted before it attached", () => {
        const onFailure = vi.fn();
        const w = new UtdWatcher(onFailure, 10);
        w.attach(fakeClient([event("$old", { v: true })]));
        vi.advanceTimersByTime(10);
        expect(onFailure).toHaveBeenCalledTimes(1);
    });

    it("stops listening when detached", () => {
        const onFailure = vi.fn();
        const w = new UtdWatcher(onFailure, 10);
        const c = fakeClient();
        w.attach(c);
        c.emit(event("$1", { v: true }));
        w.detach();
        vi.advanceTimersByTime(100);
        c.emit(event("$2", { v: true }));
        vi.advanceTimersByTime(100);
        expect(onFailure).not.toHaveBeenCalled();
    });

    it("leaves old messages alone, so one that never got its key doesn't come back on every start", () => {
        const onFailure = vi.fn();
        const w = new UtdWatcher(onFailure, 10);
        const old = event("$old", { v: true }, undefined, Date.now() - RECENT_MS - 1);
        const c = fakeClient([old]);
        w.attach(c);
        c.emit(old);
        vi.advanceTimersByTime(100);
        expect(onFailure).not.toHaveBeenCalled();
    });

    it("waits until the message's room is open", () => {
        const onFailure = vi.fn();
        let open = "!other";
        const w = new UtdWatcher(onFailure, 10, (ev) => ev.getRoomId() === open);
        const c = fakeClient();
        w.attach(c);
        const ev = event("$1", { v: true });
        c.emit(ev);
        vi.advanceTimersByTime(100);
        expect(onFailure).not.toHaveBeenCalled();
        open = "!r";
        w.recheck();
        expect(onFailure).toHaveBeenCalledWith(ev);
    });

    it("forgets a waiting failure once its key arrives", () => {
        const onFailure = vi.fn();
        let open = "!other";
        const w = new UtdWatcher(onFailure, 10, (ev) => ev.getRoomId() === open);
        const c = fakeClient();
        w.attach(c);
        const failing = { v: true };
        c.emit(event("$1", failing));
        vi.advanceTimersByTime(100);
        failing.v = false;
        open = "!r";
        w.recheck();
        expect(onFailure).not.toHaveBeenCalled();
    });
});
