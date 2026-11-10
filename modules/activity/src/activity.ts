import type { SdkClient, SdkEvent, SdkRoom } from "./client";

/**
 * One feed of what concerns me across all rooms, like Teams' Activity: mentions, replies to my
 * messages, reactions to my messages and replies in threads I'm part of.
 *
 * Two sources, merged by event ID:
 * - The client's loaded timelines (main timeline and loaded threads of every joined room). These
 *   events are already decrypted, so this is the only source that sees reactions, replies and
 *   mentions in encrypted rooms as they happen.
 * - The homeserver's notification list (GET /notifications), which reaches further back than what's
 *   loaded. In encrypted rooms the server can't read content and lists every message, so each entry
 *   is decrypted locally and classified the same way; entries that can't be decrypted are dropped.
 * Where both have an event, the local one wins. "Read" is always the user's read receipt when the
 * room is known (so reading on another device or in FluffyChat counts), otherwise the server's flag.
 */

export type ActivityKind = "mention" | "reply" | "reaction" | "thread";

export interface ActivityItem {
    eventId: string;
    roomId: string;
    kind: ActivityKind;
    sender: string;
    ts: number;
    /** The message, or the reaction key for reactions. */
    text: string;
    /** For replies and reactions: my message they refer to. */
    about?: string;
    read: boolean;
}

export const MAX_ITEMS = 200;
export const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const SERVER_PAGE = 50;

interface Relation {
    rel_type?: string;
    event_id?: string;
    key?: string;
    /** Set on thread messages whose m.in_reply_to only exists for clients without threads. */
    is_falling_back?: boolean;
    "m.in_reply_to"?: { event_id?: string };
}

/** m.relates_to stays unencrypted on encrypted events, so look in the wire content too. */
function relationOf(ev: SdkEvent): Relation {
    const clear = ev.getContent()["m.relates_to"];
    const wire = ev.getWireContent?.()["m.relates_to"];
    return { ...(isObject(wire) ? wire : {}), ...(isObject(clear) ? clear : {}) } as Relation;
}

/** The message this one really replies to; a thread's fallback reply to the root doesn't count. */
function replyTarget(rel: Relation): string | undefined {
    if (rel.rel_type === "m.thread" && rel.is_falling_back) return undefined;
    return rel["m.in_reply_to"]?.event_id;
}

function isObject(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === "object";
}

/**
 * The body without the legacy reply quote ("> <@a:b> …" lines) and the "🚨 Urgent: " / "❗ Important: "
 * prefix the teamwork module puts in its fallback.
 */
export function plainText(body: unknown): string {
    const lines = String(body ?? "").split("\n");
    let i = 0;
    if (lines[0]?.startsWith("> ")) {
        while (i < lines.length && lines[i].startsWith(">")) i++;
        if (lines[i] === "") i++;
    }
    return lines.slice(i).join("\n").replace(/^(🚨|❗) [^:]{1,40}: /u, "").trim();
}

export interface ClassifyContext {
    me: string;
    /** The event, if loaded, so its sender can be checked. */
    find(eventId: string): SdkEvent | undefined;
    /** Thread roots I started or replied in. */
    myThreads: Set<string>;
}

/** Why this event concerns me, or undefined. Order matters: a reply to me usually also mentions me. */
export function classify(ev: SdkEvent, ctx: ClassifyContext): ActivityKind | undefined {
    if (ev.getSender() === ctx.me || ev.isRedacted() || ev.isDecryptionFailure()) return undefined;
    const type = ev.getType();
    const rel = relationOf(ev);
    if (rel.rel_type === "m.replace") return undefined; // edits show up as the original message
    const mine = (id: string | undefined): boolean => !!id && ctx.find(id)?.getSender() === ctx.me;
    if (type === "m.reaction") return rel.rel_type === "m.annotation" && mine(rel.event_id) ? "reaction" : undefined;
    if (type !== "m.room.message") return undefined;
    if (mine(replyTarget(rel))) return "reply";
    if (rel.rel_type === "m.thread" && rel.event_id && ctx.myThreads.has(rel.event_id)) return "thread";
    const mentions = ev.getContent()["m.mentions"];
    if (isObject(mentions)) {
        const ids = mentions.user_ids;
        if ((Array.isArray(ids) && ids.includes(ctx.me)) || mentions.room === true) return "mention";
    }
    return undefined;
}

/** Turns a classified event into an item; `read` and names come from the room when it's there. */
export function toItem(ev: SdkEvent, kind: ActivityKind, room: SdkRoom | null, ctx: ClassifyContext, serverRead?: boolean): ActivityItem {
    const sender = ev.getSender() ?? "";
    const rel = relationOf(ev);
    const target = kind === "reaction" ? rel.event_id : kind === "reply" ? replyTarget(rel) : undefined;
    const about = target ? plainText(ctx.find(target)?.getContent().body) : undefined;
    const eventId = ev.getId()!;
    return {
        eventId,
        roomId: ev.getRoomId() ?? room?.roomId ?? "",
        kind,
        sender: room?.getMember(sender)?.name ?? ev.sender?.name ?? sender,
        ts: ev.getTs(),
        text: kind === "reaction" ? String(rel.key ?? "") : plainText(ev.getContent().body),
        about: about || undefined,
        read: room ? isRead(room, ctx.me, eventId, ev.getTs()) : !!serverRead,
    };
}

/**
 * Whether my read receipt covers the event. js-sdk only knows for loaded events, so for older ones
 * (from the server list) compare with the newest loaded event I've read: anything before it is read.
 * (`getEventReadUpTo` doesn't see threaded receipts, so it isn't used.)
 */
export function isRead(room: SdkRoom, me: string, eventId: string, ts: number): boolean {
    if (room.hasUserReadEvent(me, eventId)) return true;
    if (room.findEventById(eventId)) return false;
    const events = room.getLiveTimeline?.().getEvents() ?? [];
    for (let i = events.length - 1; i >= 0; i--) {
        const id = events[i].getId();
        if (id && room.hasUserReadEvent(me, id)) return events[i].getTs() >= ts;
    }
    return false;
}

/** Events of a room that are loaded right now: the live timeline plus every loaded thread. */
export function loadedEvents(room: SdkRoom): SdkEvent[] {
    const events = [...(room.getLiveTimeline?.().getEvents() ?? [])];
    for (const thread of room.getThreads?.() ?? []) {
        if (thread.rootEvent) events.push(thread.rootEvent);
        events.push(...(thread.events ?? []));
    }
    return events;
}

/**
 * Messages that replies and reactions point at but that aren't loaded (older than the timeline).
 * Fetched once each, in the background, only to learn whether they're mine: the sender is
 * unencrypted, the body is decrypted when possible.
 */
export class TargetCache {
    private readonly events = new Map<string, SdkEvent | null>();
    private inFlight = 0;

    public constructor(
        private readonly client: SdkClient,
        private readonly onLoaded: () => void,
        private readonly maxInFlight = 4,
    ) {}

    public get(roomId: string, eventId: string): SdkEvent | undefined {
        const hit = this.events.get(eventId);
        if (hit !== undefined) return hit ?? undefined;
        if (this.inFlight >= this.maxInFlight || !this.client.http) return undefined;
        this.events.set(eventId, null);
        this.inFlight++;
        void this.load(roomId, eventId).finally(() => this.inFlight--);
        return undefined;
    }

    private async load(roomId: string, eventId: string): Promise<void> {
        try {
            const raw = await this.client.http!.authedRequest<RawEvent>("GET", `/rooms/${encodeURIComponent(roomId)}/event/${encodeURIComponent(eventId)}`);
            const ev = await buildEvent(this.client, roomId, raw);
            if (!ev) return;
            this.events.set(eventId, ev);
            this.onLoaded();
        } catch {
            // Not visible to us; stays null.
        }
    }
}

interface RawEvent {
    event_id: string;
    type: string;
    sender: string;
    origin_server_ts: number;
    content: Record<string, unknown>;
}

/** A js-sdk event from raw JSON (same class as the room's own events), decrypted if needed. */
async function buildEvent(client: SdkClient, roomId: string, raw: RawEvent): Promise<SdkEvent | undefined> {
    const room = client.getRoom(roomId);
    const Event = room?.currentState?.getStateEvents("m.room.create", "")?.constructor as (new (raw: unknown) => SdkEvent) | undefined;
    if (!Event) return undefined;
    const ev = new Event({ ...raw, room_id: roomId });
    if (ev.getType() === "m.room.encrypted" || ev.isEncrypted?.()) {
        try {
            await client.decryptEventIfNeeded?.(ev);
        } catch {
            // Classified without content; isDecryptionFailure() is then true.
        }
    }
    return ev;
}

function contextFor(room: SdkRoom, events: SdkEvent[], me: string, targets?: TargetCache): ClassifyContext {
    const byId = new Map<string, SdkEvent>();
    const myThreads = new Set<string>();
    for (const ev of events) {
        const id = ev.getId();
        if (id) byId.set(id, ev);
        if (ev.getSender() !== me) continue;
        const rel = relationOf(ev);
        if (rel.rel_type === "m.thread" && rel.event_id) myThreads.add(rel.event_id);
    }
    for (const thread of room.getThreads?.() ?? []) if (thread.rootEvent?.getSender() === me) myThreads.add(thread.id);
    return { me, myThreads, find: (id) => byId.get(id) ?? room.findEventById(id) ?? targets?.get(room.roomId, id) };
}

/** Everything in the loaded timelines, newest first. */
export function collectLocal(client: SdkClient, now = Date.now(), targets?: TargetCache, extra: SdkEvent[] = []): ActivityItem[] {
    const me = client.getUserId();
    if (!me) return [];
    const items: ActivityItem[] = [];
    for (const room of client.getRooms()) {
        if (room.getMyMembership && room.getMyMembership() !== "join") continue;
        const events = [...loadedEvents(room), ...extra.filter((e) => e.getRoomId() === room.roomId)];
        const ctx = contextFor(room, events, me, targets);
        const seen = new Set<string>();
        for (const ev of events) {
            const id = ev.getId();
            if (!id || seen.has(id) || now - ev.getTs() > MAX_AGE_MS) continue;
            seen.add(id);
            const kind = classify(ev, ctx);
            if (kind) items.push(toItem(ev, kind, room, ctx));
        }
    }
    return sortAndCap(items);
}

interface ServerNotification {
    room_id: string;
    read: boolean;
    ts: number;
    event: RawEvent;
}

/**
 * Pages through the server's notification list (newest first) until MAX_ITEMS entries or
 * MAX_AGE_MS. Encrypted entries are decrypted locally with an event built from the same class as
 * the room's own events.
 */
export async function collectServer(client: SdkClient, now = Date.now(), targets?: TargetCache): Promise<ActivityItem[]> {
    const me = client.getUserId();
    if (!me || !client.http) return [];
    const items: ActivityItem[] = [];
    let from: string | undefined;
    let fetched = 0;
    while (fetched < MAX_ITEMS) {
        const query: Record<string, string | number> = { limit: SERVER_PAGE };
        if (from) query.from = from;
        const res = await client.http.authedRequest<{ notifications: ServerNotification[]; next_token?: string }>("GET", "/notifications", query);
        const page = res.notifications ?? [];
        fetched += page.length;
        let tooOld = false;
        for (const n of page) {
            if (now - n.ts > MAX_AGE_MS) {
                tooOld = true;
                break;
            }
            const item = await serverItem(client, me, n, targets);
            if (item) items.push(item);
        }
        if (tooOld || !res.next_token || page.length === 0) break;
        from = res.next_token;
    }
    return items;
}

async function serverItem(client: SdkClient, me: string, n: ServerNotification, targets?: TargetCache): Promise<ActivityItem | undefined> {
    const room = client.getRoom(n.room_id);
    if (!room) return undefined;
    const ev = room.findEventById(n.event.event_id) ?? (await buildEvent(client, n.room_id, n.event));
    if (!ev) return undefined;
    const ctx = contextFor(room, loadedEvents(room), me, targets);
    const kind = classify(ev, ctx);
    return kind ? toItem(ev, kind, room, ctx, n.read) : undefined;
}

/** Local entries replace server ones with the same event ID. */
export function merge(local: ActivityItem[], server: ActivityItem[]): ActivityItem[] {
    const byId = new Map<string, ActivityItem>();
    for (const i of server) byId.set(i.eventId, i);
    for (const i of local) byId.set(i.eventId, i);
    return sortAndCap([...byId.values()]);
}

function sortAndCap(items: ActivityItem[]): ActivityItem[] {
    return items.sort((a, b) => b.ts - a.ts).slice(0, MAX_ITEMS);
}

/**
 * Keeps the feed up to date: recomputes from the loaded timelines on every timeline, decryption and
 * receipt change (debounced), and asks the server again when refreshed explicitly.
 */
/**
 * Reactions to messages that aren't loaded never reach a timeline: js-sdk drops relations whose
 * parent it doesn't know (`Room.eventShouldLiveIn`). They still pass the client's "event" emitter,
 * so they're kept here as they sync (encrypted ones are kept until decrypted). Bounded.
 */
export class ReactionBuffer {
    private readonly events = new Map<string, SdkEvent>();
    private client?: SdkClient;

    public constructor(
        private readonly onAdded: () => void = () => {},
        private readonly max = 500,
    ) {}

    public watch(client: SdkClient): void {
        if (this.client === client) return;
        this.client?.off("event", this.onEvent);
        this.events.clear();
        this.client = client;
        client.on("event", this.onEvent);
    }

    public stop(): void {
        this.client?.off("event", this.onEvent);
        this.client = undefined;
    }

    /** The reactions seen so far; encrypted events that turned out not to be reactions are dropped. */
    public list(): SdkEvent[] {
        for (const [id, ev] of this.events) {
            if (ev.getType() !== "m.reaction" && !ev.isBeingDecrypted() && ev.getType() !== "m.room.encrypted") this.events.delete(id);
        }
        return [...this.events.values()];
    }

    public onEvent = (ev: SdkEvent): void => {
        const type = ev.getType();
        const id = ev.getId();
        if (!id || (type !== "m.reaction" && type !== "m.room.encrypted")) return;
        this.events.set(id, ev);
        if (this.events.size > this.max) this.events.delete(this.events.keys().next().value!);
        this.onAdded();
    };
}

export class ActivityFeed {
    public readonly reactions = new ReactionBuffer(() => this.schedule());
    private client?: SdkClient;
    private targets?: TargetCache;
    private server: ActivityItem[] = [];
    private items: ActivityItem[] = [];
    private timer?: ReturnType<typeof setTimeout>;
    private readonly listeners = new Set<() => void>();

    public constructor(private readonly debounceMs = 400) {}

    public attach(client: SdkClient): void {
        if (this.client === client) return;
        this.detach();
        this.client = client;
        this.reactions.watch(client);
        this.targets = new TargetCache(client, this.schedule);
        for (const e of EVENTS) client.on(e, this.schedule);
        this.recompute();
        void this.refresh();
    }

    public detach(): void {
        for (const e of EVENTS) this.client?.off(e, this.schedule);
        this.reactions.stop();
        this.client = undefined;
        if (this.timer) clearTimeout(this.timer);
    }

    public list(): ActivityItem[] {
        return this.items;
    }

    public unreadCount(): number {
        return this.items.filter((i) => !i.read).length;
    }

    public subscribe(cb: () => void): () => void {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
    }

    /** Fetches the server's notification list again and merges it in. */
    public async refresh(): Promise<void> {
        const client = this.client;
        if (!client) return;
        try {
            this.server = await collectServer(client, Date.now(), this.targets);
        } catch (e) {
            console.warn("[activity] Loading notifications failed", e);
        }
        this.recompute();
    }

    /**
     * Marks everything read by sending a read receipt for the newest unread item in each room.
     * Receipts are per room, so this also marks earlier messages in those rooms as read, the same
     * as opening the room would.
     */
    public async markAllRead(): Promise<void> {
        const client = this.client;
        if (!client?.sendReadReceipt) return;
        const newest = new Map<string, ActivityItem>();
        for (const i of this.items) if (!i.read && !newest.has(i.roomId)) newest.set(i.roomId, i);
        await Promise.all(
            [...newest.values()].map(async (i) => {
                // An item only the server list has isn't loaded; the room's newest event covers it too.
                const room = client.getRoom(i.roomId);
                const ev = room?.findEventById(i.eventId) ?? room?.getLiveTimeline?.().getEvents().at(-1);
                if (ev) await client.sendReadReceipt!(ev).catch(() => undefined);
            }),
        );
        this.recompute();
    }

    public recompute = (): void => {
        if (!this.client) return;
        const me = this.client.getUserId();
        const server = this.server.map((i) => {
            const room = this.client!.getRoom(i.roomId);
            return room && me ? { ...i, read: isRead(room, me, i.eventId, i.ts) } : i;
        });
        this.items = merge(collectLocal(this.client, Date.now(), this.targets, this.reactions.list()), server);
        this.listeners.forEach((l) => l());
    };

    private schedule = (): void => {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(this.recompute, this.debounceMs);
    };
}

const EVENTS = ["Room.timeline", "Event.decrypted", "Room.receipt", "Thread.update", "Thread.new", "Room.redaction"];
