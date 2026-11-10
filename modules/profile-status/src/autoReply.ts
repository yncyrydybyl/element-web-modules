import { dmPartner, off, type SdkClient, type SdkEvent } from "./client";

/** Account data with the user's own settings for this module (private, unlike profile fields). */
export const SETTINGS_TYPE = "de.datanauten.profile_status";
/** Marks auto-replies, so a second module instance (or the other side's) never answers one. */
export const AUTO_REPLY_KEY = "de.datanauten.auto_reply";
/** Messages older than this when they arrive (backlog after being offline) get no reply. */
export const MAX_AGE_MS = 2 * 60 * 1000;

export interface Settings {
    /** Out-of-office auto-reply, off unless the user turns it on. */
    auto_reply?: boolean;
    auto_reply_text?: string;
    /** Room ID → local date (`YYYY-MM-DD`) of the last auto-reply there, so it's once per DM per day across devices. */
    replied?: Record<string, string>;
    /** Automatic "In a call"; on unless turned off. */
    call_status?: boolean;
}

interface Options {
    client(): SdkClient | undefined;
    settings(): Settings;
    saveSettings(patch: Settings): Promise<void>;
    /** Whether the user is out of office right now, and until when. */
    ooo(): { active: boolean; until?: string };
    /** The text to send (the user's own, or the default with the return date). */
    message(until?: string): string;
    /** The admin allows auto-replies (config). */
    allowed(): boolean;
    now?(): number;
}

export function localDay(ts: number): string {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Out-of-office auto-reply: answers the first message from a person in a DM, once per DM per day,
 * with an `m.notice` (the convention for automated messages, which bots don't answer). It runs in
 * the browser, so it only works while an Element with this module is open somewhere.
 */
export class AutoReplier {
    private client?: SdkClient;
    private readonly seen = new Set<string>();
    private readonly sentToday = new Map<string, string>();

    public constructor(private readonly opts: Options) {}

    public attach(client: SdkClient): void {
        if (this.client === client) return;
        this.detach();
        this.client = client;
        client.on("Room.timeline", this.onTimeline);
        client.on("Event.decrypted", this.onDecrypted);
    }

    public detach(): void {
        if (!this.client) return;
        off(this.client, "Room.timeline", this.onTimeline);
        off(this.client, "Event.decrypted", this.onDecrypted);
        this.client = undefined;
    }

    private onTimeline = (ev: SdkEvent, _room: unknown, toStart?: boolean, removed?: boolean, data?: { liveEvent?: boolean }): void => {
        if (toStart || removed || data?.liveEvent === false) return;
        if (ev.getType() === "m.room.encrypted") return; // handled once decrypted
        void this.handle(ev);
    };

    private onDecrypted = (ev: SdkEvent): void => {
        void this.handle(ev);
    };

    /** Replies if all conditions hold; resolves with whether it did. Public for tests. */
    public async handle(ev: SdkEvent): Promise<boolean> {
        const client = this.client ?? this.opts.client();
        if (!client || !this.opts.allowed()) return false;
        const settings = this.opts.settings();
        if (!settings.auto_reply) return false;
        const id = ev.getId();
        if (!id || this.seen.has(id)) return false;
        if (ev.getType() !== "m.room.message" || ev.isRedacted?.() || ev.isDecryptionFailure?.()) return false;
        const me = client.getUserId();
        const sender = ev.getSender();
        if (!sender || sender === me) return false;
        const content = ev.getContent();
        if (content.msgtype === "m.notice" || content[AUTO_REPLY_KEY]) return false;
        const now = this.opts.now?.() ?? Date.now();
        if (now - ev.getTs() > MAX_AGE_MS) return false;
        const ooo = this.opts.ooo();
        if (!ooo.active) return false;
        const roomId = ev.getRoomId();
        if (!roomId || dmPartner(client, roomId) !== sender) return false;
        this.seen.add(id);
        const today = localDay(now);
        if (settings.replied?.[roomId] === today || this.sentToday.get(roomId) === today) return false;
        this.sentToday.set(roomId, today);
        // Record first, then send: another device that sees the record won't reply too.
        const replied = Object.fromEntries(Object.entries(settings.replied ?? {}).filter(([, day]) => day === today));
        replied[roomId] = today;
        try {
            await this.opts.saveSettings({ replied });
            const body = this.opts.message(ooo.until);
            await client.sendEvent(roomId, "m.room.message", { msgtype: "m.notice", body, [AUTO_REPLY_KEY]: true });
            return true;
        } catch (e) {
            console.warn("[profile-status] Sending the out-of-office reply failed", e);
            return false;
        }
    }
}
