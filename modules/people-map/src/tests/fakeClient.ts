import type { PeopleClient, PeopleRoom, SdkTimelineEvent } from "../people";

export const ME = "@me:x";

export interface FakeMember {
    id: string;
    name?: string;
    avatar?: string;
    power?: number;
}

export interface FakeEvent {
    sender: string;
    ts?: number;
    id?: string;
    mentions?: string[];
    replyTo?: string;
    type?: string;
}

export interface FakeRoom {
    id: string;
    name: string;
    space?: boolean;
    children?: string[];
    membership?: string;
    alias?: string;
    /** Joined member count; the members below by default. */
    members?: number;
    lastActive?: number;
    /** Loaded members besides you (you're added). */
    people?: Array<string | FakeMember>;
    events?: FakeEvent[];
}

export interface FakeOptions {
    dms?: Record<string, string[]>;
    presence?: Record<string, string>;
    ignored?: string[];
    me?: { displayName?: string; avatarUrl?: string };
}

/** Just enough of matrix-js-sdk's MatrixClient for `buildGraph` and `buildPeople`. */
export function fakeClient(rooms: FakeRoom[], options: FakeOptions = {}): PeopleClient {
    const sdkRooms: PeopleRoom[] = rooms.map((r) => {
        const members = [ME, ...(r.people ?? [])].map((m) => (typeof m === "string" ? { id: m } : m));
        const events: SdkTimelineEvent[] = (r.events ?? []).map((e, i) => ({
            getId: () => e.id ?? `$${r.id}-${i}`,
            getSender: () => e.sender,
            getTs: () => e.ts ?? 0,
            getType: () => e.type ?? "m.room.message",
            getContent: () => ({
                body: "hi",
                ...(e.mentions ? { "m.mentions": { user_ids: e.mentions } } : {}),
                ...(e.replyTo ? { "m.relates_to": { "m.in_reply_to": { event_id: e.replyTo } } } : {}),
            }),
        }));
        return {
            roomId: r.id,
            name: r.name,
            isSpaceRoom: () => Boolean(r.space),
            getMyMembership: () => r.membership ?? "join",
            getCanonicalAlias: () => r.alias ?? null,
            getAltAliases: () => [],
            getJoinedMemberCount: () => r.members ?? members.length,
            getLastActiveTimestamp: () => r.lastActive ?? 0,
            getUnreadNotificationCount: () => 0,
            getMxcAvatarUrl: () => null,
            currentState: {
                getStateEvents: (type: string) =>
                    type !== "m.space.child" ? [] : (r.children ?? []).map((id) => ({ getStateKey: () => id, getContent: () => ({ via: ["x"] }) })),
            },
            getJoinedMembers: () =>
                members.map((m) => ({
                    userId: m.id,
                    name: m.name ?? m.id,
                    rawDisplayName: m.name ?? m.id,
                    powerLevel: m.power ?? 0,
                    getMxcAvatarUrl: () => m.avatar,
                })),
            getLiveTimeline: () => ({ getEvents: () => events }),
            findEventById: (id: string) => events.find((e) => e.getId() === id),
        };
    });
    return {
        getUserId: () => ME,
        getUser: (id: string) => (id === ME ? (options.me ?? null) : options.presence?.[id] ? { presence: options.presence[id] } : null),
        getIgnoredUsers: () => options.ignored ?? [],
        getVisibleRooms: () => sdkRooms,
        getAccountData: (type: string) => (type === "m.direct" ? { getContent: () => options.dms ?? {} } : undefined),
        mxcUrlToHttp: (mxc, w, h, method, _direct, _redirects, auth) =>
            `https://hs.example/${auth ? "client/v1" : "media/v3"}/thumbnail/${mxc.slice(6)}?width=${w}&height=${h}&method=${method}`,
        getAccessToken: () => "token",
    };
}
