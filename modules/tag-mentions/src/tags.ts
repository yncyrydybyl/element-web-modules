/**
 * Tags are room state: one `de.datanauten.tag` state event per tag, the state key is the tag's
 * name, the content lists the members. Room power levels decide who may define them, and they
 * federate like any other state. A tag in a space applies in all of the space's rooms; a tag in
 * the room itself wins over a space tag of the same name. A deleted tag is an empty content.
 */

import type { SdkClient, SdkRoom } from "./client";

export const TAG_EVENT = "de.datanauten.tag";

/** Tag names: what can follow "@" in a message. Lower case, so "@OnCall" and "@oncall" are one tag. */
export const NAME_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/;

/** Built-in names. "room" is Matrix's own @room; "channel" and "team" are the Teams names. */
export const BUILTIN = ["channel", "team"] as const;
export const RESERVED = new Set<string>(["room", "here", "everyone", "all", ...BUILTIN]);

export interface TagContent {
    label?: string;
    user_ids: string[];
}

export interface TagDefinition {
    name: string;
    label: string;
    userIds: string[];
    /** The room or space whose state holds the tag. */
    sourceId: string;
    sourceName: string;
    fromSpace: boolean;
}

/** A tag as it applies in one room: who of its members is there to be notified. */
export interface ResolvedTag {
    name: string;
    label: string;
    kind: "tag" | "team" | "channel";
    /** Members who are joined to the room, without the sender. */
    members: string[];
    /** Members who aren't joined to the room. They can't receive the message, so they aren't mentioned. */
    absent: string[];
    /** For `channel` and `team`: whether the sender has the power level to notify the whole room. */
    allowed: boolean;
    source?: { id: string; name: string; fromSpace: boolean };
}

export type NameProblem = "invalid" | "reserved";

export function validateName(name: string): NameProblem | null {
    if (!NAME_RE.test(name)) return "invalid";
    if (RESERVED.has(name)) return "reserved";
    return null;
}

const USER_ID_RE = /^@[^:\s]+:[^\s]+$/;

export function isUserId(s: string): boolean {
    return USER_ID_RE.test(s);
}

/** Reads a tag's state content. Undefined for deleted (empty) or malformed tags. */
export function parseTag(stateKey: string | undefined, content: Record<string, unknown> | undefined): TagContent | undefined {
    if (!stateKey || !NAME_RE.test(stateKey) || RESERVED.has(stateKey) || !content) return undefined;
    const ids = content.user_ids;
    if (!Array.isArray(ids)) return undefined;
    const userIds = [...new Set(ids.filter((u): u is string => typeof u === "string" && isUserId(u)))];
    if (!userIds.length) return undefined;
    return { label: typeof content.label === "string" ? content.label.slice(0, 200) : undefined, user_ids: userIds };
}

export function tagContent(label: string, userIds: string[]): TagContent {
    const trimmed = label.trim();
    return { ...(trimmed ? { label: trimmed } : {}), user_ids: [...new Set(userIds)] };
}

/** The tags defined directly in a room or space, sorted by name. */
export function tagsIn(room: SdkRoom): TagDefinition[] {
    const fromSpace = !!room.isSpaceRoom?.();
    const out: TagDefinition[] = [];
    for (const ev of room.currentState.getStateEvents(TAG_EVENT)) {
        const name = ev.getStateKey();
        const tag = parseTag(name, ev.getContent());
        if (!tag || !name) continue;
        out.push({ name, label: tag.label ?? "", userIds: tag.user_ids, sourceId: room.roomId, sourceName: room.name, fromSpace });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The spaces a room belongs to that this client knows (is joined to): the room's own
 * `m.space.parent` events first (the canonical one leading), then spaces that list it as a child.
 */
export function parentSpaces(client: SdkClient, room: SdkRoom): SdkRoom[] {
    const ids: string[] = [];
    const parents = room.currentState
        .getStateEvents("m.space.parent")
        .filter((ev) => Array.isArray(ev.getContent().via))
        .sort((a, b) => Number(!!b.getContent().canonical) - Number(!!a.getContent().canonical));
    for (const ev of parents) {
        const id = ev.getStateKey();
        if (id) ids.push(id);
    }
    for (const space of client.getRooms()) {
        if (!space.isSpaceRoom?.() || ids.includes(space.roomId)) continue;
        const child = space.currentState.getStateEvents("m.space.child", room.roomId);
        if (child && Array.isArray(child.getContent().via)) ids.push(space.roomId);
    }
    return ids
        .map((id) => client.getRoom(id))
        .filter((s): s is SdkRoom => !!s && s.roomId !== room.roomId && (s.getMyMembership?.() ?? "join") === "join");
}

/** Room tags, then space tags that the room doesn't override. */
export function definitionsFor(client: SdkClient, room: SdkRoom): TagDefinition[] {
    const byName = new Map<string, TagDefinition>();
    for (const t of tagsIn(room)) byName.set(t.name, t);
    for (const space of parentSpaces(client, room)) {
        for (const t of tagsIn(space)) if (!byName.has(t.name)) byName.set(t.name, { ...t, fromSpace: true });
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Every tag usable in a room, with `channel` and (in a space) `team` first. */
export function resolveTags(client: SdkClient, roomId: string): ResolvedTag[] {
    const room = client.getRoom(roomId);
    const me = client.getUserId();
    if (!room || !me) return [];
    const joined = new Set(room.getJoinedMembers().map((m) => m.userId));
    const mayNotifyRoom = room.currentState.mayTriggerNotifOfType("room", me);
    const out: ResolvedTag[] = [
        { name: "channel", label: "", kind: "channel", members: [], absent: [], allowed: mayNotifyRoom },
    ];
    const space = parentSpaces(client, room)[0];
    if (space) {
        const spaceMembers = space.getJoinedMembers().map((m) => m.userId);
        out.push({
            name: "team",
            label: space.name,
            kind: "team",
            members: spaceMembers.filter((u) => u !== me && joined.has(u)),
            absent: spaceMembers.filter((u) => u !== me && !joined.has(u)),
            allowed: mayNotifyRoom,
            source: { id: space.roomId, name: space.name, fromSpace: true },
        });
    }
    for (const t of definitionsFor(client, room)) {
        out.push({
            name: t.name,
            label: t.label,
            kind: "tag",
            members: t.userIds.filter((u) => u !== me && joined.has(u)),
            absent: t.userIds.filter((u) => u !== me && !joined.has(u)),
            allowed: true,
            source: { id: t.sourceId, name: t.sourceName, fromSpace: t.fromSpace },
        });
    }
    return out;
}

/** Tags whose name starts with what was typed after "@". */
export function matchTags(tags: ResolvedTag[], query: string): ResolvedTag[] {
    const q = query.toLowerCase();
    return tags.filter((t) => t.name.startsWith(q));
}
