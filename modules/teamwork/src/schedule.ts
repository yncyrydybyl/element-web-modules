import type { DelayedEvent, SdkClient, SdkOutgoingEvent, SdkRoom } from "./client";

/**
 * "Send later", built on MSC4140 delayed events: the client encrypts the event now and hands it to
 * the homeserver with a delay; the server sends it when the time comes, whether or not any of the
 * sender's devices is online. The scheduled message lives on the server, so every device sees it
 * and can send it right away or cancel it.
 *
 * matrix-js-sdk's `_unstable_sendDelayedEvent` skips encryption (`encryptAndSendEvent` returns early
 * for delayed sends, as of the js-sdk in Element 1.12.33), which would put the message on the server
 * in plain text. In encrypted rooms this module therefore encrypts the event itself through the
 * client's crypto backend and schedules the ciphertext; if that isn't possible it refuses to
 * schedule rather than leak.
 */

export const MSC4140 = "org.matrix.msc4140";

/**
 * In an encrypted room the server only holds ciphertext, so the list of scheduled messages can't
 * show their text. The device that scheduled a message keeps a plaintext preview locally (never
 * in account data, which is not end-to-end encrypted).
 */
const PREVIEW_KEY = "de.datanauten.teamwork.previews";

interface Preview {
    text: string;
    priority?: string;
}

export interface ScheduledMessage {
    delayId: string;
    roomId: string;
    sendAt: number;
    /** Plaintext, or undefined if it's encrypted and this device didn't schedule it. */
    preview?: string;
    priority?: string;
}

export async function supportsScheduling(client: SdkClient | undefined): Promise<boolean> {
    if (!client?._unstable_sendDelayedEvent || !client._unstable_getDelayedEvents) return false;
    try {
        return await client.doesServerSupportUnstableFeature(MSC4140);
    } catch {
        return false;
    }
}

export async function scheduleMessage(
    client: SdkClient,
    roomId: string,
    content: Record<string, unknown>,
    sendAt: number,
    threadId: string | null = null,
    now = Date.now(),
): Promise<string> {
    const delay = Math.max(1000, Math.round(sendAt - now));
    if (threadId) {
        const reply = (content["m.relates_to"] as { "m.in_reply_to"?: unknown } | undefined)?.["m.in_reply_to"];
        content = {
            ...content,
            "m.relates_to": { rel_type: "m.thread", event_id: threadId, is_falling_back: !reply, "m.in_reply_to": reply ?? { event_id: threadId } },
        };
    }
    const encrypted = await client.getCrypto?.()?.isEncryptionEnabledInRoom(roomId);
    if (encrypted === undefined) throw new ScheduleError("no_crypto");
    let delayId: string;
    if (encrypted) {
        const wire = await encrypt(client, roomId, content);
        const path = `/rooms/${encodeURIComponent(roomId)}/send/${encodeURIComponent(wire.type)}/${encodeURIComponent(txnId(client))}`;
        ({ delay_id: delayId } = await client.http!.authedRequest<{ delay_id: string }>("PUT", path, { [`${MSC4140}.delay`]: delay }, wire.content));
    } else {
        ({ delay_id: delayId } = await client._unstable_sendDelayedEvent!(roomId, { delay }, null, "m.room.message", content));
    }
    savePreview(delayId, { text: String(content.body ?? ""), priority: content["de.datanauten.priority"] as string | undefined });
    return delayId;
}

export class ScheduleError extends Error {}

/**
 * Encrypts message content for the room the way sending would (Megolm, keys shared with the room's
 * current devices). matrix-js-sdk's MatrixEvent class isn't exported to modules, so a new event is
 * built with the constructor of one the room already has.
 */
async function encrypt(client: SdkClient, roomId: string, content: Record<string, unknown>): Promise<{ type: string; content: Record<string, unknown> }> {
    const room = client.getRoom(roomId);
    const create = room?.currentState?.getStateEvents("m.room.create", "");
    const EventClass = create?.constructor as (new (raw: object) => SdkOutgoingEvent) | undefined;
    if (!room || !EventClass || !client.cryptoBackend || !client.http) throw new ScheduleError("no_crypto");
    const event = new EventClass({
        type: "m.room.message",
        content,
        room_id: roomId,
        sender: client.getUserId(),
        event_id: `~${roomId}:${txnId(client)}`,
        origin_server_ts: Date.now(),
    });
    await client.cryptoBackend.encryptEvent(event, room as SdkRoom);
    if (!event.isEncrypted() || event.getWireType() !== "m.room.encrypted") throw new ScheduleError("no_crypto");
    return { type: event.getWireType(), content: event.getWireContent() };
}

function txnId(client: SdkClient): string {
    return client.makeTxnId?.() ?? `tw${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

export async function listScheduled(client: SdkClient): Promise<ScheduledMessage[]> {
    const res = await client._unstable_getDelayedEvents!("scheduled");
    // The MSC renamed the list; servers answer with one or the other.
    const events: DelayedEvent[] = res.delayed_events ?? res.scheduled ?? [];
    const previews = loadPreviews();
    const live = new Set<string>();
    const out = events
        .filter((e) => e.type === "m.room.message" || e.type === "m.room.encrypted")
        .map((e) => {
            live.add(e.delay_id);
            const plain = e.type === "m.room.message" ? e.content : undefined;
            return {
                delayId: e.delay_id,
                roomId: e.room_id,
                sendAt: e.running_since + e.delay,
                preview: typeof plain?.body === "string" ? plain.body : previews[e.delay_id]?.text,
                priority: typeof plain?.["de.datanauten.priority"] === "string" ? (plain["de.datanauten.priority"] as string) : previews[e.delay_id]?.priority,
            };
        })
        .sort((a, b) => a.sendAt - b.sendAt);
    prunePreviews(live);
    return out;
}

export async function cancelScheduled(client: SdkClient, delayId: string): Promise<void> {
    if (client._unstable_cancelScheduledDelayedEvent) await client._unstable_cancelScheduledDelayedEvent(delayId);
    else await client._unstable_updateDelayedEvent!(delayId, "cancel");
}

export async function sendScheduledNow(client: SdkClient, delayId: string): Promise<void> {
    if (client._unstable_sendScheduledDelayedEvent) await client._unstable_sendScheduledDelayedEvent(delayId);
    else await client._unstable_updateDelayedEvent!(delayId, "send");
}

/** Suggested send times, like the presets of mail clients: later today, tomorrow and next Monday morning. */
export function presets(now = new Date()): { key: string; at: Date }[] {
    const at = (days: number, hour: number): Date => {
        const d = new Date(now);
        d.setDate(d.getDate() + days);
        d.setHours(hour, 0, 0, 0);
        return d;
    };
    const out: { key: string; at: Date }[] = [];
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    inOneHour.setSeconds(0, 0);
    out.push({ key: "in_one_hour", at: inOneHour });
    out.push({ key: "tomorrow_morning", at: at(1, 9) });
    const toMonday = ((8 - now.getDay()) % 7) || 7;
    out.push({ key: "monday_morning", at: at(toMonday, 9) });
    return out;
}

function loadPreviews(): Record<string, Preview> {
    try {
        const raw = JSON.parse(localStorage.getItem(PREVIEW_KEY) ?? "{}");
        return raw && typeof raw === "object" ? raw : {};
    } catch {
        return {};
    }
}

function savePreview(delayId: string, preview: Preview): void {
    try {
        localStorage.setItem(PREVIEW_KEY, JSON.stringify({ ...loadPreviews(), [delayId]: preview }));
    } catch {
        // Only a nicety: the list then says "encrypted message".
    }
}

function prunePreviews(live: Set<string>): void {
    const previews = loadPreviews();
    const kept = Object.fromEntries(Object.entries(previews).filter(([id]) => live.has(id)));
    if (Object.keys(kept).length === Object.keys(previews).length) return;
    try {
        localStorage.setItem(PREVIEW_KEY, JSON.stringify(kept));
    } catch {
        // ignore
    }
}
