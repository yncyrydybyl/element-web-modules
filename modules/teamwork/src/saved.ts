import type { Api, Watchable } from "@element-hq/element-web-module-api";

import type { SdkClient, SdkEvent } from "./client";

/**
 * Saved messages live in the user's account data, so they follow them to every device. Only the
 * room and event IDs are stored: the message itself stays in the room and is decrypted locally when
 * the list is shown, so saving a message from an encrypted room leaks nothing to the server.
 */
export const SAVED_TYPE = "de.datanauten.teamwork.saved";
const MAX_SAVED = 500;

export interface SavedRef {
    room_id: string;
    event_id: string;
    saved_ts: number;
}

export function parseSaved(value: unknown): SavedRef[] {
    const items = (value as { items?: unknown } | undefined)?.items;
    if (!Array.isArray(items)) return [];
    return items.filter(
        (i): i is SavedRef =>
            !!i && typeof i.room_id === "string" && typeof i.event_id === "string" && typeof i.saved_ts === "number",
    );
}

export class SavedMessages {
    private watchable?: Watchable<unknown>;
    private readonly listeners = new Set<() => void>();

    public constructor(private readonly api: Pick<Api, "client">) {}

    /** False until someone is logged in (account data throws before that). */
    public attach(): boolean {
        if (this.watchable) return true;
        try {
            this.watchable = this.api.client.accountData.get(SAVED_TYPE);
            this.watchable.watch(() => this.listeners.forEach((l) => l()));
            return true;
        } catch {
            return false;
        }
    }

    public list(): SavedRef[] {
        this.attach();
        return parseSaved(this.watchable?.value);
    }

    public has(eventId: string): boolean {
        return this.list().some((i) => i.event_id === eventId);
    }

    public subscribe(cb: () => void): () => void {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    /** Saves or unsaves the message; returns whether it's saved now. */
    public async toggle(roomId: string, eventId: string, now = Date.now()): Promise<boolean> {
        const items = this.list();
        const saved = items.some((i) => i.event_id === eventId);
        const next = saved
            ? items.filter((i) => i.event_id !== eventId)
            : [{ room_id: roomId, event_id: eventId, saved_ts: now }, ...items].slice(0, MAX_SAVED);
        await this.api.client.accountData.set(SAVED_TYPE, { version: 1, items: next });
        return !saved;
    }
}

export interface LoadedMessage {
    ref: SavedRef;
    roomName: string;
    sender: string;
    text: string;
    ts?: number;
    /** The message is gone (redacted) or couldn't be loaded or decrypted. */
    missing?: "redacted" | "unavailable";
}

/** Loads a saved message from its room, through the timeline so it gets decrypted. */
export async function loadMessage(client: SdkClient, ref: SavedRef): Promise<LoadedMessage> {
    const room = client.getRoom(ref.room_id);
    const base = { ref, roomName: room?.name ?? ref.room_id, sender: "", text: "" };
    if (!room) return { ...base, missing: "unavailable" };
    let ev: SdkEvent | undefined = room.findEventById(ref.event_id);
    if (!ev) {
        try {
            const timeline = await client.getEventTimeline(room.getUnfilteredTimelineSet(), ref.event_id);
            ev = timeline?.getEvents().find((e) => e.getId() === ref.event_id);
        } catch {
            // Not visible to us any more.
        }
    }
    if (!ev) return { ...base, missing: "unavailable" };
    if (ev.isBeingDecrypted()) await client.decryptEventIfNeeded?.(ev);
    const sender = room.getMember(ev.getSender() ?? "")?.name ?? ev.getSender() ?? "";
    if (ev.isRedacted()) return { ...base, sender, ts: ev.getTs(), missing: "redacted" };
    if (ev.isDecryptionFailure()) return { ...base, sender, ts: ev.getTs(), missing: "unavailable" };
    const content = ev.getContent();
    const text = String(content.body ?? content.msgtype ?? "");
    return { ...base, sender, ts: ev.getTs(), text };
}
