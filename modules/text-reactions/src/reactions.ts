import type { Api, Watchable } from "@element-hq/element-web-module-api";

/** Account data with the user's recently used text reactions, so they follow them to every device. */
export const ACCOUNT_DATA_TYPE = "de.datanauten.text_reactions";
const MAX_RECENT = 12;
/** The spec sets no limit; long keys are hard to read under a message and clutter it. */
export const MAX_LENGTH = 64;

/** The parts of matrix-js-sdk's MatrixClient used here. */
export interface SdkClient {
    getUserId(): string | null;
    getRoom(roomId: string): SdkRoom | null;
    getRooms(): SdkRoom[];
    sendEvent(roomId: string, eventType: string, content: Record<string, unknown>): Promise<{ event_id: string }>;
    cancelPendingEvent?(event: SdkEvent): void;
}

export interface SdkEvent {
    getType(): string;
    getRelation(): { event_id?: string; key?: string } | null;
    isRedacted(): boolean;
}

export interface SdkRoom {
    roomId: string;
    findEventById(eventId: string): unknown;
    getCanonicalAlias(): string | null;
    getPendingEvents?(): SdkEvent[];
    relations?: {
        getChildEventsForEvent(
            eventId: string,
            relationType: string,
            eventType: string,
        ): { getAnnotationsBySender(): Record<string, Set<SdkEvent>> | null } | undefined;
    };
}

export function getSdkClient(): SdkClient | undefined {
    const peg = (window as { mxMatrixClientPeg?: { get?(): SdkClient | null } }).mxMatrixClientPeg;
    try {
        return peg?.get?.() ?? undefined;
    } catch {
        return undefined;
    }
}

/** The room an event belongs to: the open room first, then any room that has it loaded. */
export function findRoomOfEvent(client: SdkClient, eventId: string, hash = window.location.hash): string | undefined {
    const match = /^#\/room\/([^/?]+)/.exec(hash);
    if (match) {
        const idOrAlias = decodeURIComponent(match[1]);
        const room = idOrAlias.startsWith("!") ? client.getRoom(idOrAlias) : client.getRooms().find((r) => r.getCanonicalAlias() === idOrAlias);
        if (room?.findEventById(eventId)) return room.roomId;
    }
    return client.getRooms().find((r) => r.findEventById(eventId))?.roomId;
}

export function normaliseReaction(text: string): string {
    // One line, no surrounding space; reactions are compared by exact key.
    return text.replace(/\s+/g, " ").trim();
}

/** Whether the user already reacted to the event with this key (as far as Element has loaded). */
export function hasReacted(client: SdkClient, roomId: string, eventId: string, key: string): boolean {
    const userId = client.getUserId();
    const annotations = client.getRoom(roomId)?.relations?.getChildEventsForEvent(eventId, "m.annotation", "m.reaction");
    const mine = userId ? annotations?.getAnnotationsBySender()?.[userId] : undefined;
    return [...(mine ?? [])].some((ev) => !ev.isRedacted() && ev.getRelation()?.key === key);
}

export async function sendReaction(client: SdkClient, roomId: string, eventId: string, key: string): Promise<void> {
    // Synapse would refuse a duplicate, and Element would then show its "not sent" banner.
    if (hasReacted(client, roomId, eventId, key)) throw new DuplicateReactionError();
    try {
        await client.sendEvent(roomId, "m.reaction", {
            "m.relates_to": { rel_type: "m.annotation", event_id: eventId, key },
        });
    } catch (e) {
        discardFailedEcho(client, roomId, eventId, key);
        if ((e as { errcode?: string }).errcode === "M_DUPLICATE_ANNOTATION") throw new DuplicateReactionError();
        throw e;
    }
}

/**
 * A failed send stays in the room as a local echo, and Element shows its "Some of your messages
 * have not been sent" banner for it. The dialog already shows the error, so drop the echo.
 */
function discardFailedEcho(client: SdkClient, roomId: string, eventId: string, key: string): void {
    const pending = client.getRoom(roomId)?.getPendingEvents?.() ?? [];
    for (const ev of pending) {
        const rel = ev.getRelation();
        if (ev.getType() === "m.reaction" && rel?.event_id === eventId && rel.key === key) client.cancelPendingEvent?.(ev);
    }
}

export class DuplicateReactionError extends Error {
    public constructor() {
        super("duplicate");
    }
}

/** Recently used text reactions, newest first. */
export class RecentReactions {
    private watchable?: Watchable<unknown>;

    public constructor(private readonly api: Pick<Api, "client">) {}

    public get(): string[] {
        const recent = (this.attach()?.value as { recent?: unknown } | undefined)?.recent;
        return Array.isArray(recent) ? recent.filter((r): r is string => typeof r === "string").slice(0, MAX_RECENT) : [];
    }

    public async use(key: string): Promise<void> {
        const next = [key, ...this.get().filter((r) => r !== key)].slice(0, MAX_RECENT);
        await this.api.client.accountData.set(ACCOUNT_DATA_TYPE, { version: 1, recent: next });
    }

    private attach(): Watchable<unknown> | undefined {
        if (this.watchable) return this.watchable;
        try {
            this.watchable = this.api.client.accountData.get(ACCOUNT_DATA_TYPE);
            // Watching keeps the value current when another device changes it.
            this.watchable.watch(noop);
        } catch {
            // Not logged in yet.
        }
        return this.watchable;
    }
}

function noop(): void {}
