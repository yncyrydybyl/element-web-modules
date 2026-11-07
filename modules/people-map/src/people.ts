/**
 * The people you share rooms with, read from Element's matrix-js-sdk client, and how close you are.
 *
 * Everything comes from what the client already has: the member lists it has loaded and the
 * messages in its live timelines. Element loads members lazily, so in big rooms only some members
 * are known (mostly those who wrote recently); that's also who matters most here.
 *
 * Closeness adds up what you have in common: a DM counts most, a small room more than a big one,
 * and replies and mentions between the two of you count on top. Contact that's long ago counts less.
 * Each person gets one "context", the place you know them from: the district group (a space, an
 * event, a bridge network …) where you share the most with them.
 */

import { buildDistricts, networkOf, type DistrictId, type GroupNames } from "./districts";
import type { RoomGraph, SdkClient, SdkRoom } from "./rooms";

/** The parts of matrix-js-sdk's `RoomMember` used here. */
export interface SdkMember {
    userId: string;
    /** Display name, disambiguated ("Alice (@alice:x)") when two members share it. */
    name: string;
    rawDisplayName?: string;
    powerLevel?: number;
    getMxcAvatarUrl(): string | undefined;
}

/** The parts of matrix-js-sdk's `MatrixEvent` used here. */
export interface SdkTimelineEvent {
    getId(): string | undefined;
    getSender(): string | undefined;
    getTs(): number;
    getType(): string;
    getContent(): Record<string, unknown>;
}

export interface PeopleRoom extends SdkRoom {
    getJoinedMembers?(): SdkMember[];
    getLiveTimeline?(): { getEvents(): SdkTimelineEvent[] };
    findEventById?(eventId: string): SdkTimelineEvent | undefined;
}

export interface SdkUser {
    displayName?: string;
    avatarUrl?: string;
    presence?: string;
    currentlyActive?: boolean;
}

export interface PeopleClient extends SdkClient {
    getUserId?(): string | null;
    getUser?(userId: string): SdkUser | null;
    getIgnoredUsers?(): string[];
}

export type PersonKind = "person" | "bridged" | "bot";
export type Presence = "online" | "unavailable" | "offline";

export interface Person {
    id: string;
    name: string;
    avatar?: string;
    server: string;
    kind: PersonKind;
    /** The network a bridged person writes from. */
    network?: string;
    /** Shared rooms and DMs (not spaces), closest first. */
    rooms: string[];
    /** The DM with them, if there is one. */
    dm?: string;
    /** Shared spaces they're a member of. */
    spaces: string[];
    /** Their messages in what the client has loaded of your shared rooms. */
    messages: number;
    /** Replies and mentions between the two of you, either way, in what's loaded. */
    interactions: number;
    /** When you last had contact: their last message, or the last activity in your DM. 0: unknown. */
    lastContact: number;
    /** Admin (100) or moderator (50) in this many shared rooms. */
    admin: number;
    moderator: number;
    score: number;
    /** 1 for the closest person, towards 0 for the most distant: their rank among everyone. */
    closeness: number;
    /** Key of the context group (see `PeopleGroup`). */
    group: string;
    presence?: Presence;
}

export interface PeopleGroup {
    key: string;
    district: DistrictId;
    label: string;
    /** People, closest first. */
    people: string[];
}

export interface PeopleOptions {
    /** People you only know from rooms bigger than LARGE_ROOM are left out, unless this is on. */
    largeRooms: boolean;
    bots: boolean;
    names?: GroupNames;
    labels?: PeopleLabels;
    now?: number;
}

/** Names of the contexts that aren't a space or a network. */
export interface PeopleLabels {
    dms: string;
    dmsOlder: string;
    other: string;
}

export const ENGLISH_LABELS: PeopleLabels = { dms: "Direct messages", dmsOlder: "Direct messages (older)", other: "Other places" };

export interface PeopleData {
    me: string;
    people: Map<string, Person>;
    groups: PeopleGroup[];
}

/** Rooms bigger than this are "large": being in one together hardly means you know each other. */
export const LARGE_ROOM = 150;
/** How much a DM counts, against 1 for a room of two. */
const DM_WEIGHT = 4;
const INTERACTION_WEIGHT = 0.5;
const MESSAGE_WEIGHT = 0.02;
/** Contact this long ago counts half. */
const HALF_LIFE_MS = 120 * 86_400_000;
/** At most this many contexts get a sector of their own; the rest share one. */
export const MAX_GROUPS = 14;
export const OTHER_GROUP = "other";

const BOT = /(^|[_.-])bot$|^bot[_.-]|^_?[a-z]*bot$|^(hookshot|mjolnir|draupnir|maubot|github|gitlab|jira|rss|feeds|webhook|notifications?|alertmanager|grafana)([_.-]|$)/i;
const BRIDGE_PUPPET = /^_?(whatsapp|telegram|signal|discord|slack|irc|instagram|messenger|facebook|meta|gmessages|imessage|linkedin|twitter|googlechat|gchat|bsky|bluesky)[_=]/i;

export function localpart(userId: string): string {
    return userId.slice(1).split(":")[0] ?? userId;
}

export function serverOf(userId: string): string {
    return userId.split(":").slice(1).join(":");
}

export function kindOf(userId: string): { kind: PersonKind; network?: string } {
    const local = localpart(userId);
    const puppet = BRIDGE_PUPPET.exec(local)?.[1];
    if (puppet) return { kind: "bridged", network: networkOf(puppet) ?? capitalise(puppet) };
    if (BOT.test(local)) return { kind: "bot" };
    return { kind: "person" };
}

interface Draft {
    person: Person;
    names: Map<string, number>;
    /** Room weight per district group. */
    byGroup: Map<string, number>;
    /** Shared rooms with their weight, for sorting. */
    roomWeights: Map<string, number>;
    smallRoom: boolean;
}

export function buildPeople(client: PeopleClient, graph: RoomGraph, options: PeopleOptions): PeopleData {
    const me = client.getUserId?.() ?? "";
    const now = options.now ?? Date.now();
    const ignored = new Set(client.getIgnoredUsers?.() ?? []);
    const districts = buildDistricts(graph, options.names, now);
    const groupInfo = new Map(districts.groups.map((g) => [g.key, g]));
    const drafts = new Map<string, Draft>();
    const sdkRooms = new Map(client.getVisibleRooms().map((r) => [r.roomId, r as PeopleRoom]));

    const draft = (m: SdkMember): Draft => {
        let d = drafts.get(m.userId);
        if (!d) {
            const { kind, network } = kindOf(m.userId);
            d = {
                person: {
                    id: m.userId,
                    name: m.userId,
                    server: serverOf(m.userId),
                    kind,
                    network,
                    rooms: [],
                    spaces: [],
                    messages: 0,
                    interactions: 0,
                    lastContact: 0,
                    admin: 0,
                    moderator: 0,
                    score: 0,
                    closeness: 0,
                    group: OTHER_GROUP,
                },
                names: new Map(),
                byGroup: new Map(),
                roomWeights: new Map(),
                smallRoom: false,
            };
            drafts.set(m.userId, d);
        }
        return d;
    };

    for (const room of graph.rooms.values()) {
        if (room.invite) continue;
        const sdk = sdkRooms.get(room.id);
        const members = sdk?.getJoinedMembers?.() ?? [];
        if (!members.length) continue;
        const large = room.members > LARGE_ROOM;
        const weight = room.kind === "dm" ? DM_WEIGHT : 1 / Math.sqrt(Math.max(1, room.members - 1));
        const home = districts.home.get(room.id);
        for (const m of members) {
            if (m.userId === me || ignored.has(m.userId)) continue;
            const d = draft(m);
            const p = d.person;
            const name = (m.rawDisplayName ?? m.name)?.trim();
            if (name && name !== m.userId) d.names.set(name, (d.names.get(name) ?? 0) + 1);
            if (!p.avatar) p.avatar = m.getMxcAvatarUrl() || undefined;
            if (room.kind === "space") {
                p.spaces.push(room.id);
                continue;
            }
            p.rooms.push(room.id);
            d.roomWeights.set(room.id, weight);
            if (room.kind === "dm") {
                p.dm ??= room.id;
                p.lastContact = Math.max(p.lastContact, room.lastActive);
            }
            if (!large) d.smallRoom = true;
            // Whoever starts a DM is its admin; that says nothing about them.
            if (room.kind !== "dm" && (m.powerLevel ?? 0) >= 100) p.admin++;
            else if (room.kind !== "dm" && (m.powerLevel ?? 0) >= 50) p.moderator++;
            if (home) d.byGroup.set(home, (d.byGroup.get(home) ?? 0) + weight);
        }
        if (room.kind === "space" || !sdk) continue;

        // Messages, and replies and mentions between you, in what's loaded of the room.
        for (const ev of sdk.getLiveTimeline?.().getEvents() ?? []) {
            if (ev.getType() !== "m.room.message" && ev.getType() !== "m.sticker") continue;
            const sender = ev.getSender();
            if (!sender) continue;
            const content = ev.getContent();
            const mentioned = mentionsOf(content);
            const replyTo = replyTarget(content);
            const replyToSender = replyTo ? sdk.findEventById?.(replyTo)?.getSender() : undefined;
            if (sender === me) {
                for (const id of new Set([...mentioned, ...(replyToSender && replyToSender !== me ? [replyToSender] : [])])) {
                    const d = drafts.get(id);
                    if (!d) continue;
                    d.person.interactions++;
                    d.person.lastContact = Math.max(d.person.lastContact, ev.getTs());
                }
                continue;
            }
            const d = drafts.get(sender);
            if (!d) continue;
            d.person.messages++;
            d.person.lastContact = Math.max(d.person.lastContact, ev.getTs());
            if (mentioned.includes(me) || replyToSender === me) d.person.interactions++;
        }
    }

    const people = new Map<string, Person>();
    for (const d of drafts.values()) {
        const p = d.person;
        if (!p.rooms.length) continue;
        if (p.kind === "bot" && !options.bots) continue;
        // Only met in large rooms, and never in touch: a stranger, not one of your people.
        if (!options.largeRooms && !d.smallRoom && !p.dm && !p.interactions) continue;
        p.name = mostCommon(d.names) ?? localpart(p.id);
        p.rooms.sort((a, b) => d.roomWeights.get(b)! - d.roomWeights.get(a)! || graph.rooms.get(b)!.lastActive - graph.rooms.get(a)!.lastActive);
        const shared = [...d.roomWeights.values()].reduce((s, w) => s + w, 0);
        const recency = p.lastContact > 0 ? Math.pow(0.5, Math.max(0, now - p.lastContact) / HALF_LIFE_MS) : 0.3;
        p.score = (shared + p.interactions * INTERACTION_WEIGHT + Math.min(p.messages, 200) * MESSAGE_WEIGHT) * (0.4 + 0.6 * recency);
        p.group = contextOf(d, groupInfo, p);
        const presence = client.getUser?.(p.id)?.presence;
        if (presence === "online" || presence === "unavailable" || presence === "offline") p.presence = presence;
        people.set(p.id, p);
    }

    // Closeness is the rank: scores pile up near zero, ranks spread evenly.
    const ranked = [...people.values()].sort(byScore);
    ranked.forEach((p, i) => (p.closeness = ranked.length > 1 ? 1 - i / (ranked.length - 1) : 1));

    return { me, people, groups: buildGroups(ranked, groupInfo, options.labels ?? ENGLISH_LABELS) };
}

/** Where you know someone from: the group you share most with them in, other than DMs and group chats. */
function contextOf(d: Draft, groupInfo: Map<string, { district: DistrictId }>, p: Person): string {
    if (p.kind === "bridged" && p.network) return `bridges/${p.network}`;
    let best: string | undefined;
    let bestWeight = 0;
    let fallback: string | undefined;
    let fallbackWeight = 0;
    for (const [key, w] of d.byGroup) {
        const district = groupInfo.get(key)?.district;
        if (district === "people" || district === "archive") {
            if (w > fallbackWeight) (fallback = key), (fallbackWeight = w);
        } else if (w > bestWeight) {
            (best = key), (bestWeight = w);
        }
    }
    return best ?? fallback ?? OTHER_GROUP;
}

function buildGroups(ranked: Person[], groupInfo: Map<string, { district: DistrictId; label: string }>, labels: PeopleLabels): PeopleGroup[] {
    const byKey = new Map<string, PeopleGroup>();
    for (const p of ranked) {
        let g = byKey.get(p.group);
        if (!g) {
            const info = groupInfo.get(p.group);
            const network = p.group.startsWith("bridges/") ? p.group.slice("bridges/".length) : undefined;
            g = {
                key: p.group,
                district: info?.district ?? (network ? "bridges" : "unsorted"),
                label: p.group === "people/Matrix" ? labels.dms : p.group === "people/Matrix-older" ? labels.dmsOlder : (info?.label ?? network ?? labels.other),
                people: [],
            };
            byKey.set(p.group, g);
        }
        g.people.push(p.id);
    }
    const groups = [...byKey.values()].sort((a, b) => b.people.length - a.people.length || a.label.localeCompare(b.label));
    if (groups.length <= MAX_GROUPS) return groups;
    // The smallest contexts share one sector.
    const other: PeopleGroup = { key: OTHER_GROUP, district: "unsorted", label: labels.other, people: [] };
    const kept = groups.filter((g, i) => i < MAX_GROUPS - 1 && g.key !== OTHER_GROUP);
    const keptKeys = new Set(kept.map((g) => g.key));
    for (const p of ranked) {
        if (keptKeys.has(p.group)) continue;
        p.group = OTHER_GROUP;
        other.people.push(p.id);
    }
    return [...kept, other];
}

function byScore(a: Person, b: Person): number {
    return b.score - a.score || a.name.localeCompare(b.name);
}

function mentionsOf(content: Record<string, unknown>): string[] {
    const ids = (content["m.mentions"] as { user_ids?: unknown } | undefined)?.user_ids;
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

function replyTarget(content: Record<string, unknown>): string | undefined {
    const rel = content["m.relates_to"] as { "m.in_reply_to"?: { event_id?: unknown } } | undefined;
    const id = rel?.["m.in_reply_to"]?.event_id;
    return typeof id === "string" ? id : undefined;
}

function mostCommon(counts: Map<string, number>): string | undefined {
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
}

function capitalise(w: string): string {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}
