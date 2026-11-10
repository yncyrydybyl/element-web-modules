import type { SdkClient, SdkEvent } from "./client";

/**
 * Notices "Unable to decrypt" messages cheaply: matrix-js-sdk emits `Event.decrypted` on the client
 * for every decryption attempt. Events decrypted before the watcher attached (during the first
 * sync) are caught by one pass over the rooms' already loaded live timelines. A failure only counts if
 * the event is still undecryptable after a grace period (keys often arrive a moment later, e.g. right
 * after login), only for reasons the user can do something about, and only for recent messages: an
 * old one that never got its key would otherwise bring the hint back on every start.
 *
 * It's offered only while the user has that message's room open (`isVisible`), so the hint is about
 * a message they can see; `recheck()` offers it again after they switch rooms.
 */

export const DECRYPTED_EVENT = "Event.decrypted";

/** Messages older than this (before the watcher attached) are left alone. */
export const RECENT_MS = 15 * 60_000;

/** Failures that verifying this device or a recovery key can't fix. */
const IGNORED_REASONS = new Set([
    "HISTORICAL_MESSAGE_USER_NOT_JOINED",
    "SENDER_IDENTITY_PREVIOUSLY_VERIFIED",
    "UNSIGNED_SENDER_DEVICE",
    "UNKNOWN_SENDER_DEVICE",
]);

export function isActionableFailure(ev: SdkEvent): boolean {
    if (!ev.isDecryptionFailure()) return false;
    return !IGNORED_REASONS.has(ev.decryptionFailureReason ?? "");
}

export class UtdWatcher {
    private client?: SdkClient;
    private readonly pending = new Map<string, ReturnType<typeof setTimeout>>();
    /** Past the grace period and still failing, waiting for their room to be open. */
    private readonly failed = new Map<string, SdkEvent>();
    private fired = false;
    private since = 0;

    public constructor(
        private readonly onFailure: (ev: SdkEvent) => void,
        private readonly graceMs = 8000,
        private readonly isVisible: (ev: SdkEvent) => boolean = () => true,
        private readonly now: () => number = Date.now,
    ) {}

    public attach(client: SdkClient): void {
        if (this.client === client) return;
        this.detach();
        this.client = client;
        this.since = this.now() - RECENT_MS;
        client.on(DECRYPTED_EVENT, this.onDecrypted);
        for (const room of client.getRooms?.() ?? []) {
            for (const ev of room.getLiveTimeline?.().getEvents() ?? []) if (ev.isDecryptionFailure()) this.onDecrypted(ev);
        }
    }

    public detach(): void {
        this.client?.off(DECRYPTED_EVENT, this.onDecrypted);
        this.client = undefined;
        this.pending.forEach((t) => clearTimeout(t));
        this.pending.clear();
        this.failed.clear();
    }

    /** Fires once per page load; call `rearm()` to allow another hint. */
    public rearm(): void {
        this.fired = false;
    }

    /** The open room changed: offer a failure from the new one, if there is one. */
    public recheck(): void {
        if (this.fired) return;
        for (const [id, ev] of this.failed) {
            if (!isActionableFailure(ev)) {
                this.failed.delete(id);
            } else if (this.isVisible(ev)) {
                this.failed.delete(id);
                this.fired = true;
                this.onFailure(ev);
                return;
            }
        }
    }

    private onDecrypted = (ev: SdkEvent): void => {
        const id = ev.getId();
        if (!id || this.fired) return;
        if (!isActionableFailure(ev) || ev.getTs() < this.since) {
            const t = this.pending.get(id);
            if (t) clearTimeout(t);
            this.pending.delete(id);
            this.failed.delete(id);
            return;
        }
        if (this.pending.has(id) || this.failed.has(id)) return;
        this.pending.set(
            id,
            setTimeout(() => {
                this.pending.delete(id);
                if (!isActionableFailure(ev)) return;
                this.failed.set(id, ev);
                this.recheck();
            }, this.graceMs),
        );
    };
}
