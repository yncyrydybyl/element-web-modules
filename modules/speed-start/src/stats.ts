/**
 * A few counts about the account, taken while Element runs, so the next start can tell the user
 * what it is rebuilding ("143 rooms across 5 spaces"). Only numbers and the server name are kept.
 * They're stored apart from the snapshot, because they stay useful when the snapshot doesn't fit
 * (another Element build, a much wider window).
 */

export const STATS_KEY = "de.datanauten.speed_start.stats";
const STATS_FORMAT = 1;
/** Counting members stops after this many, so a huge account doesn't stall the tab. */
const MAX_MEMBERS = 50_000;

export interface Stats {
    format: number;
    userId: string;
    savedAt: number;
    /** The user's server name. */
    server: string;
    /** Joined rooms, spaces not counted. */
    rooms: number;
    spaces: number;
    /** Rooms marked as direct chats. */
    dms: number;
    encrypted: number;
    /** Rooms with unread notifications. */
    unread: number;
    /** Other people in the user's rooms, as far as the client has loaded them. */
    people: number;
    /** Distinct servers of those people, the user's own included. */
    servers: number;
}

interface StatsRoom {
    roomId: string;
    getMyMembership?(): string;
    isSpaceRoom?(): boolean;
    hasEncryptionStateEvent?(): boolean;
    getUnreadNotificationCount?(): number;
    getJoinedMembers?(): { userId: string }[];
}

export interface StatsClient {
    getDomain(): string | null;
    getRooms(): StatsRoom[];
    getAccountData?(type: string): { getContent(): Record<string, unknown> } | undefined;
}

export function collectStats(client: StatsClient, userId: string, now = Date.now()): Stats | null {
    const server = client.getDomain();
    if (!server) return null;
    const joined = client.getRooms().filter((r) => (r.getMyMembership?.() ?? "join") === "join");
    const direct = new Set<string>();
    const content = client.getAccountData?.("m.direct")?.getContent() ?? {};
    for (const ids of Object.values(content)) if (Array.isArray(ids)) for (const id of ids) direct.add(String(id));

    const people = new Set<string>();
    const servers = new Set<string>([server]);
    let seen = 0;
    let rooms = 0;
    let spaces = 0;
    let dms = 0;
    let encrypted = 0;
    let unread = 0;
    for (const room of joined) {
        if (room.isSpaceRoom?.()) {
            spaces++;
            continue;
        }
        rooms++;
        if (direct.has(room.roomId)) dms++;
        if (room.hasEncryptionStateEvent?.()) encrypted++;
        if ((room.getUnreadNotificationCount?.() ?? 0) > 0) unread++;
        if (seen >= MAX_MEMBERS) continue;
        for (const m of room.getJoinedMembers?.() ?? []) {
            seen++;
            if (m.userId === userId) continue;
            people.add(m.userId);
            const domain = m.userId.slice(m.userId.indexOf(":") + 1);
            if (domain) servers.add(domain);
        }
    }
    return { format: STATS_FORMAT, userId, savedAt: now, server, rooms, spaces, dms, encrypted, unread, people: people.size, servers: servers.size };
}

export function saveStats(stats: Stats, storage: Storage = localStorage): void {
    try {
        storage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
        // Nothing to do: the next start shows the card without numbers.
    }
}

/** The stored stats, if they belong to the user who is logged in now. */
export function loadStats(storage: Storage = localStorage): Stats | null {
    try {
        const raw = storage.getItem(STATS_KEY);
        if (!raw) return null;
        const stats = JSON.parse(raw) as Stats;
        const userId = storage.getItem("mx_user_id");
        if (stats.format !== STATS_FORMAT || !userId) return null;
        if (stats.userId !== userId) {
            storage.removeItem(STATS_KEY);
            return null;
        }
        return stats;
    } catch {
        return null;
    }
}
