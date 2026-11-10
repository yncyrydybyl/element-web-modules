import type { SdkClient, SdkEvent } from "./client";

/**
 * Notices "Unable to decrypt" messages cheaply: matrix-js-sdk emits `Event.decrypted` on the client
 * for every decryption attempt. Events decrypted before the watcher attached (during the first
 * sync) are caught by one pass over the rooms' already loaded live timelines. A failure only counts if the event is
 * still undecryptable after a grace period (keys often arrive a moment later, e.g. right after
 * login), and only for reasons the user can do something about.
 */

export const DECRYPTED_EVENT = "Event.decrypted";

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
    private fired = false;

    public constructor(
        private readonly onFailure: (ev: SdkEvent) => void,
        private readonly graceMs = 8000,
    ) {}

    public attach(client: SdkClient): void {
        if (this.client === client) return;
        this.detach();
        this.client = client;
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
    }

    /** Fires once per page load; call `rearm()` to allow another hint. */
    public rearm(): void {
        this.fired = false;
    }

    private onDecrypted = (ev: SdkEvent): void => {
        const id = ev.getId();
        if (!id || this.fired) return;
        if (!isActionableFailure(ev)) {
            const t = this.pending.get(id);
            if (t) clearTimeout(t);
            this.pending.delete(id);
            return;
        }
        if (this.pending.has(id)) return;
        this.pending.set(
            id,
            setTimeout(() => {
                this.pending.delete(id);
                if (this.fired || !isActionableFailure(ev)) return;
                this.fired = true;
                this.onFailure(ev);
            }, this.graceMs),
        );
    };
}
