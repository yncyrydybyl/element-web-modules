/**
 * Finds the files shared in the user's rooms and keeps them in memory for this session.
 *
 * - Unencrypted rooms: the server filters. `/messages` with `contains_url: true` returns only
 *   events with an attachment, so each page is all files.
 * - Encrypted rooms: the server can't see inside `m.room.encrypted`, so every message event in the
 *   window is fetched and decrypted locally (matrix-js-sdk's event mapper + the client's crypto),
 *   then checked. This costs bandwidth and CPU proportional to the room's traffic, so it's bounded.
 * - Both: the events Element already has in memory (live timeline, loaded threads) are used first,
 *   for free; live events and redactions keep the list current while the session runs.
 *
 * Bounds per room: the last `maxAgeDays` days and at most `maxEventsPerRoom` fetched events
 * (files in unencrypted rooms, all messages in encrypted ones). "Search older" moves both bounds by
 * one more window for the rooms in view. Scans are lazy (only when the Files view is open and only
 * for the rooms in view), run a few rooms at a time, resume from their pagination token and stop when
 * the view closes.
 *
 * Nothing is persisted. The index of an encrypted room holds the attachments' decryption keys, so it
 * must not go to localStorage (plain text on disk, readable by any script on the origin and outliving
 * logout). Rescanning after a reload is the price.
 */

import { isEncryptedRoom, isJoined, isSpace, type RawEvent, type SdkClient, type SdkEvent } from "./client";
import { fileFromEvent, type EventLike, type FileItem } from "./files";

export interface ScanOptions {
    maxAgeDays: number;
    maxEventsPerRoom: number;
    concurrency: number;
}

export const DEFAULT_SCAN: ScanOptions = { maxAgeDays: 90, maxEventsPerRoom: 500, concurrency: 3 };

const DAY = 24 * 60 * 60 * 1000;
const PAGE_PLAIN = 100;
const PAGE_ENCRYPTED = 100;

type StopReason = "start" | "age" | "budget" | "error";

interface RoomState {
    items: Map<string, FileItem>;
    harvested: boolean;
    /** Pagination token for the next older page; null once the start of the room is reached. */
    token?: string | null;
    limitTs: number;
    budget: number;
    fetched: number;
    done: boolean;
    reason?: StopReason;
    undecryptable: number;
    encrypted: boolean;
}

export interface ScanProgress {
    running: boolean;
    rooms: number;
    roomsDone: number;
    /** Rooms whose scan stopped at the age or event bound and have more history. */
    roomsWithMore: number;
    undecryptable: number;
    errors: number;
    /** Oldest date covered for all rooms in view (the age bound). */
    sinceTs: number;
}

interface MessagesResponse {
    chunk: RawEvent[];
    end?: string;
}

export class FileIndex {
    private client?: SdkClient;
    private readonly rooms = new Map<string, RoomState>();
    private readonly listeners = new Set<() => void>();
    private run?: AbortController;
    private running = false;
    private notifyTimer?: ReturnType<typeof setTimeout>;
    private cached?: FileItem[];

    public constructor(
        private readonly getClient: () => SdkClient | undefined,
        private readonly opts: ScanOptions = DEFAULT_SCAN,
        private readonly now: () => number = Date.now,
    ) {}

    /** All known files in rooms the user is still in. */
    public list(): FileItem[] {
        if (this.cached) return this.cached;
        const client = this.ensureClient();
        const out: FileItem[] = [];
        for (const [roomId, s] of this.rooms) {
            const room = client?.getRoom(roomId);
            if (!room || !isJoined(room)) continue;
            out.push(...s.items.values());
        }
        this.cached = out;
        return out;
    }

    public subscribe(cb: () => void): () => void {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    public isRunning(): boolean {
        return this.running;
    }

    public progress(roomIds: readonly string[]): ScanProgress {
        let roomsDone = 0;
        let roomsWithMore = 0;
        let undecryptable = 0;
        let errors = 0;
        let sinceTs = this.now() - this.opts.maxAgeDays * DAY;
        for (const id of roomIds) {
            const s = this.rooms.get(id);
            if (!s) continue;
            if (s.done) roomsDone++;
            if (s.done && (s.reason === "age" || s.reason === "budget")) roomsWithMore++;
            if (s.reason === "error") errors++;
            undecryptable += s.undecryptable;
            sinceTs = Math.max(Math.min(sinceTs, s.limitTs), 0);
        }
        return { running: this.running, rooms: roomIds.length, roomsDone, roomsWithMore, undecryptable, errors, sinceTs };
    }

    /** The rooms a scan covers: joined rooms that aren't spaces, most recently active first. */
    public scannableRooms(only?: ReadonlySet<string>): string[] {
        const client = this.ensureClient();
        if (!client) return [];
        return client
            .getRooms()
            .filter((r) => isJoined(r) && !isSpace(r) && (!only || only.has(r.roomId)))
            .sort((a, b) => (b.getLastActiveTimestamp?.() ?? 0) - (a.getLastActiveTimestamp?.() ?? 0))
            .map((r) => r.roomId);
    }

    /** Scans (or continues scanning) these rooms; cancels a scan that's still running for others. */
    public scan(roomIds: readonly string[]): Promise<void> {
        this.cancel();
        const client = this.ensureClient();
        if (!client) return Promise.resolve();
        this.attachLive(client);
        const ctl = new AbortController();
        this.run = ctl;
        const queue = roomIds.filter((id) => !this.state(id).done);
        // Loaded events first, for every room: instant results while the network catches up.
        for (const id of roomIds) this.harvest(client, id);
        this.changed();
        if (queue.length === 0) return Promise.resolve();
        this.running = true;
        const worker = async (): Promise<void> => {
            while (!ctl.signal.aborted) {
                const id = queue.shift();
                if (!id) return;
                await this.scanRoom(client, id, ctl.signal);
            }
        };
        const workers = Array.from({ length: Math.max(1, this.opts.concurrency) }, worker);
        return Promise.all(workers).then(() => {
            if (this.run === ctl) {
                this.running = false;
                this.run = undefined;
                this.changed();
            }
        });
    }

    /** Stops the running scan. What was found stays; the next scan resumes where this one stopped. */
    public cancel(): void {
        if (!this.run) return;
        this.run.abort();
        this.run = undefined;
        this.running = false;
        this.changed();
    }

    /** Extends the age and event bounds by one window for these rooms and scans them. */
    public searchOlder(roomIds: readonly string[]): Promise<void> {
        for (const id of roomIds) {
            const s = this.state(id);
            if (!s.done || s.reason === "start") continue;
            s.limitTs -= this.opts.maxAgeDays * DAY;
            s.budget += this.opts.maxEventsPerRoom;
            s.done = false;
            s.reason = undefined;
        }
        return this.scan(roomIds);
    }

    /** Adds a file from an event Element has (live or loaded); ignores anything else. */
    public addEvent(ev: SdkEvent): void {
        if (ev.isBeingDecrypted() || ev.isDecryptionFailure()) return;
        const item = fileFromEvent(fromSdkEvent(ev));
        if (!item) return;
        const s = this.state(item.roomId);
        if (s.items.has(item.eventId)) return;
        s.items.set(item.eventId, item);
        this.changed();
    }

    public removeEvent(roomId: string, eventId: string): void {
        if (this.rooms.get(roomId)?.items.delete(eventId)) this.changed();
    }

    /** Removes the live listeners. Element never unloads modules; this exists for tests. */
    public dispose(): void {
        this.cancel();
        this.detachLive();
    }

    private async scanRoom(client: SdkClient, roomId: string, signal: AbortSignal): Promise<void> {
        const s = this.state(roomId);
        const room = client.getRoom(roomId);
        if (!room || !client.http) {
            s.done = true;
            s.reason = "error";
            return;
        }
        s.encrypted = isEncryptedRoom(room);
        const mapper = client.getEventMapper?.({ preventReEmit: true, decrypt: true });
        if (s.encrypted && (!mapper || !client.decryptEventIfNeeded)) {
            s.done = true;
            s.reason = "error";
            return;
        }
        // The server can only filter on what it can read.
        const filter = s.encrypted
            ? { types: ["m.room.encrypted", "m.room.message"], lazy_load_members: true }
            : { types: ["m.room.message"], contains_url: true, lazy_load_members: true };
        const path = `/rooms/${encodeURIComponent(roomId)}/messages`;
        try {
            while (!s.done && !signal.aborted) {
                const limit = Math.min(s.encrypted ? PAGE_ENCRYPTED : PAGE_PLAIN, s.budget - s.fetched);
                if (limit <= 0) {
                    this.stop(s, "budget");
                    break;
                }
                const res = await client.http.authedRequest<MessagesResponse>(
                    "GET",
                    path,
                    { dir: "b", limit, filter: JSON.stringify(filter), ...(s.token ? { from: s.token } : {}) },
                    undefined,
                    { abortSignal: signal },
                );
                if (signal.aborted) return;
                const chunk = Array.isArray(res.chunk) ? res.chunk : [];
                let tooOld = false;
                const inWindow: RawEvent[] = [];
                for (const raw of chunk) {
                    if (raw.origin_server_ts < s.limitTs) {
                        tooOld = true;
                        break;
                    }
                    inWindow.push({ ...raw, room_id: roomId });
                }
                await this.ingest(client, s, roomId, inWindow, mapper);
                if (signal.aborted) return;
                s.fetched += chunk.length;
                // Only advance once the page is processed, so a cancelled page is fetched again. A page
                // that crossed the age bound is kept too: "Search older" fetches it again.
                if (tooOld) {
                    this.stop(s, "age");
                    this.changed();
                    break;
                }
                s.token = res.end && chunk.length > 0 ? res.end : null;
                if (s.token === null) this.stop(s, "start");
                else if (s.fetched >= s.budget) this.stop(s, "budget");
                this.changed();
            }
        } catch (e) {
            if (signal.aborted) return;
            console.warn("[files-hub] Scanning a room failed", roomId, e);
            this.stop(s, "error");
            this.changed();
        }
    }

    private async ingest(
        client: SdkClient,
        s: RoomState,
        roomId: string,
        events: RawEvent[],
        mapper?: (raw: RawEvent) => SdkEvent,
    ): Promise<void> {
        const add = (item: FileItem | null): void => {
            if (item && !s.items.has(item.eventId)) {
                s.items.set(item.eventId, item);
                this.cached = undefined;
            }
        };
        const encrypted = events.filter((e) => e.type === "m.room.encrypted");
        for (const raw of events) if (raw.type !== "m.room.encrypted") add(fileFromEvent(fromRaw(raw, roomId)));
        if (encrypted.length === 0 || !mapper) return;
        await Promise.all(
            encrypted.map(async (raw) => {
                const ev = mapper(raw);
                try {
                    await client.decryptEventIfNeeded?.(ev);
                } catch {
                    // Reported below as a decryption failure.
                }
                if (ev.isDecryptionFailure()) {
                    s.undecryptable++;
                    return;
                }
                add(fileFromEvent(fromSdkEvent(ev, roomId)));
            }),
        );
    }

    private harvest(client: SdkClient, roomId: string): void {
        const s = this.state(roomId);
        if (s.harvested) return;
        s.harvested = true;
        const room = client.getRoom(roomId);
        if (!room) return;
        const events: SdkEvent[] = [...(room.getLiveTimeline?.().getEvents() ?? [])];
        for (const t of room.getThreads?.() ?? []) events.push(...(t.events ?? []));
        for (const ev of events) {
            if (ev.isBeingDecrypted() || ev.isDecryptionFailure()) continue;
            const item = fileFromEvent(fromSdkEvent(ev, roomId));
            if (item && !s.items.has(item.eventId)) s.items.set(item.eventId, item);
        }
        this.cached = undefined;
    }

    private stop(s: RoomState, reason: StopReason): void {
        s.done = true;
        s.reason = reason;
    }

    private state(roomId: string): RoomState {
        let s = this.rooms.get(roomId);
        if (!s) {
            s = {
                items: new Map(),
                harvested: false,
                limitTs: this.now() - this.opts.maxAgeDays * DAY,
                budget: this.opts.maxEventsPerRoom,
                fetched: 0,
                done: false,
                undecryptable: 0,
                encrypted: false,
            };
            this.rooms.set(roomId, s);
        }
        return s;
    }

    /** Starts over when someone else logs in. */
    private ensureClient(): SdkClient | undefined {
        const client = this.getClient();
        if (client !== this.client) {
            this.cancel();
            this.detachLive();
            this.rooms.clear();
            this.cached = undefined;
            this.client = client;
        }
        return client;
    }

    private live?: { client: SdkClient; timeline: (...a: never[]) => void; decrypted: (...a: never[]) => void; redaction: (...a: never[]) => void };

    private attachLive(client: SdkClient): void {
        if (this.live?.client === client) return;
        this.detachLive();
        const timeline = (ev: SdkEvent, _room: unknown, toStart?: boolean): void => {
            if (!toStart) this.addEvent(ev);
        };
        const decrypted = (ev: SdkEvent): void => {
            if (this.rooms.has(ev.getRoomId() ?? "")) this.addEvent(ev);
        };
        const redaction = (ev: SdkEvent): void => {
            const target = ev.getAssociatedId?.() ?? (ev.getContent().redacts as string | undefined);
            const roomId = ev.getRoomId();
            if (target && roomId) this.removeEvent(roomId, target);
        };
        client.on("Room.timeline", timeline as (...a: never[]) => void);
        client.on("Event.decrypted", decrypted as (...a: never[]) => void);
        client.on("Room.redaction", redaction as (...a: never[]) => void);
        this.live = {
            client,
            timeline: timeline as (...a: never[]) => void,
            decrypted: decrypted as (...a: never[]) => void,
            redaction: redaction as (...a: never[]) => void,
        };
    }

    private detachLive(): void {
        if (!this.live) return;
        this.live.client.off("Room.timeline", this.live.timeline);
        this.live.client.off("Event.decrypted", this.live.decrypted);
        this.live.client.off("Room.redaction", this.live.redaction);
        this.live = undefined;
    }

    /** Coalesces change notifications: a scan can add hundreds of items a second. */
    private changed(): void {
        this.cached = undefined;
        if (this.notifyTimer) return;
        this.notifyTimer = setTimeout(() => {
            this.notifyTimer = undefined;
            this.listeners.forEach((l) => l());
        }, 50);
    }
}

export function fromSdkEvent(ev: SdkEvent, roomId?: string): EventLike {
    return {
        eventId: ev.getId() ?? "",
        roomId: ev.getRoomId() ?? roomId ?? "",
        type: ev.getType(),
        sender: ev.getSender() ?? "",
        ts: ev.getTs(),
        content: ev.getContent(),
        redacted: ev.isRedacted(),
        threadId: ev.threadRootId,
    };
}

export function fromRaw(raw: RawEvent, roomId: string): EventLike {
    return {
        eventId: raw.event_id,
        roomId: raw.room_id ?? roomId,
        type: raw.type,
        sender: raw.sender,
        ts: raw.origin_server_ts,
        content: raw.content ?? {},
        redacted: !!raw.unsigned?.redacted_because,
    };
}
