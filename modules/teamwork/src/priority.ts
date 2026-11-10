import type { SdkClient, SdkEvent } from "./client";

/**
 * Important and urgent messages. The sender only marks the message (a field in its content, plus a
 * prefix in the plain-text body so every other client shows it too). What happens on arrival is
 * up to the recipient:
 *   - a push rule in the recipient's own account makes urgent messages notify loudly on every
 *     device, including phones and clients without this module;
 *   - in Element Web, this module reminds them every 2 minutes for 20 minutes until they read it.
 */

export const PRIORITY_KEY = "de.datanauten.priority";
export type Priority = "important" | "urgent";

export const URGENT_RULE_ID = "de.datanauten.teamwork.urgent";
/** The recipient's own settings for this module, synced to their devices. */
export const SETTINGS_TYPE = "de.datanauten.teamwork.settings";

export const REMIND_EVERY_MS = 2 * 60 * 1000;
export const REMIND_FOR_MS = 20 * 60 * 1000;

export function priorityOf(content: Record<string, unknown> | undefined): Priority | undefined {
    const p = content?.[PRIORITY_KEY];
    return p === "important" || p === "urgent" ? p : undefined;
}

/** Adds the priority to message content, with a fallback other clients will show. */
export function withPriority(
    content: { body: string; formatted_body?: string } & Record<string, unknown>,
    priority: Priority | undefined,
    label: (p: Priority) => string,
): Record<string, unknown> {
    if (!priority) return content;
    const prefix = priority === "urgent" ? "🚨" : "❗";
    const out: Record<string, unknown> = { ...content, [PRIORITY_KEY]: priority, body: `${prefix} ${label(priority)}: ${content.body}` };
    if (content.formatted_body) out.formatted_body = `<p><strong>${prefix} ${escapeHtml(label(priority))}</strong></p>${content.formatted_body}`;
    return out;
}

/**
 * Who an urgent message mentions by default. Mentions go through the standard
 * `.m.rule.is_user_mention` push rule, so they reach people in every client, also in rooms set to
 * "mentions only", without the custom urgent rule. Like Teams (group chats up to 20 people), small
 * rooms mention everyone; in bigger rooms the sender picks.
 */
export const URGENT_MENTION_ALL_MAX = 20;

export function defaultUrgentRecipients(members: { userId: string }[]): string[] {
    return members.length <= URGENT_MENTION_ALL_MAX ? members.map((m) => m.userId) : [];
}

/** Mentions the recipients of an urgent message (`m.mentions`), keeping any already there. */
export function withUrgentMentions(content: Record<string, unknown>, userIds: string[]): Record<string, unknown> {
    if (!userIds.length) return content;
    const prev = (content["m.mentions"] as { user_ids?: string[] } | undefined)?.user_ids ?? [];
    return { ...content, "m.mentions": { user_ids: [...new Set([...prev, ...userIds])] } };
}

/** The plain-text fallback prefix, for showing the body without it where the badge is drawn. */
export function stripFallback(body: string): string {
    return body.replace(/^(🚨|❗) [^:]{1,40}: /u, "");
}

/**
 * The push rule that makes urgent messages loud: notify with sound and highlight. It is an override
 * rule, so it wins over the room's own notification setting, like Teams' urgent messages. In
 * encrypted rooms clients evaluate it after decrypting (Element Web, Element X's push extension).
 */
export const URGENT_RULE = {
    conditions: [{ kind: "event_match", key: `content.${PRIORITY_KEY.replace(/\./g, "\\.")}`, pattern: "urgent" }],
    actions: ["notify", { set_tweak: "sound", value: "default" }, { set_tweak: "highlight" }],
};

/** Adds the urgent push rule to the user's account unless it's there (or they deleted it on purpose). */
export async function ensureUrgentRule(client: SdkClient, alreadyOffered: boolean): Promise<boolean> {
    if (!client.getPushRules || !client.addPushRule || alreadyOffered) return false;
    const rules = await client.getPushRules();
    if (rules.global?.override?.some((r) => r.rule_id === URGENT_RULE_ID)) return false;
    await client.addPushRule("global", "override", URGENT_RULE_ID, URGENT_RULE);
    return true;
}

export interface Reminder {
    roomId: string;
    eventId: string;
    sender: string;
    text: string;
    arrived: number;
    count: number;
}

export interface ReminderHost {
    client(): SdkClient | undefined;
    enabled(): boolean;
    /** Show (or update) the in-app reminder; called again for each reminder. */
    show(reminder: Reminder): void;
    hide(eventId: string): void;
}

/**
 * Watches incoming messages and reminds the user of urgent ones they haven't read, every
 * REMIND_EVERY_MS for REMIND_FOR_MS. "Read" is the user's own read receipt, so reading the message
 * on their phone ends the reminders here too.
 */
export class UrgentReminders {
    private readonly pending = new Map<string, Reminder>();
    private timer?: ReturnType<typeof setInterval>;
    private attached?: SdkClient;

    public constructor(
        private readonly host: ReminderHost,
        private readonly now: () => number = Date.now,
    ) {}

    public attach(client: SdkClient): void {
        if (this.attached === client) return;
        this.detach();
        this.attached = client;
        client.on("Room.timeline", this.onTimeline);
        client.on("Event.decrypted", this.onDecrypted);
        client.on("Room.receipt", this.onReceipt);
        this.timer = setInterval(this.tick, 15 * 1000);
    }

    public detach(): void {
        this.attached?.off("Room.timeline", this.onTimeline);
        this.attached?.off("Event.decrypted", this.onDecrypted);
        this.attached?.off("Room.receipt", this.onReceipt);
        this.attached = undefined;
        if (this.timer) clearInterval(this.timer);
        this.pending.clear();
    }

    public get size(): number {
        return this.pending.size;
    }

    public dismiss(eventId: string): void {
        this.pending.delete(eventId);
        this.host.hide(eventId);
    }

    /** Considers one event; public for tests. */
    public consider(ev: SdkEvent): void {
        const client = this.host.client();
        const me = client?.getUserId();
        const eventId = ev.getId();
        const roomId = ev.getRoomId();
        if (!client || !me || !eventId || !roomId || this.pending.has(eventId)) return;
        if (ev.getType() !== "m.room.message" || ev.getSender() === me || ev.isRedacted()) return;
        if (priorityOf(ev.getContent()) !== "urgent" || !this.host.enabled()) return;
        if (this.now() - ev.getTs() > REMIND_FOR_MS) return;
        if (client.getRoom(roomId)?.hasUserReadEvent(me, eventId)) return;
        const body = String(ev.getContent().body ?? "");
        const reminder: Reminder = {
            roomId,
            eventId,
            sender: ev.sender?.name ?? ev.getSender() ?? "",
            text: stripFallback(body),
            arrived: ev.getTs(),
            count: 1,
        };
        this.pending.set(eventId, reminder);
        this.host.show(reminder);
    }

    /** Ends reminders for read or expired messages and repeats the due ones; public for tests. */
    public tick = (): void => {
        const client = this.host.client();
        const me = client?.getUserId();
        for (const r of [...this.pending.values()]) {
            const read = me && client?.getRoom(r.roomId)?.hasUserReadEvent(me, r.eventId);
            const age = this.now() - r.arrived;
            if (read || age > REMIND_FOR_MS || !this.host.enabled()) {
                this.dismiss(r.eventId);
                continue;
            }
            const due = Math.floor(age / REMIND_EVERY_MS) + 1;
            if (due > r.count) {
                r.count = due;
                this.host.show(r);
            }
        }
    };

    private onTimeline = (ev: SdkEvent, _room: unknown, toStartOfTimeline?: boolean): void => {
        if (!toStartOfTimeline) this.consider(ev);
    };

    private onDecrypted = (ev: SdkEvent): void => this.consider(ev);

    private onReceipt = (): void => this.tick();
}

function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
