import type { SdkClient, SdkRoom } from "../rooms";

export interface FakeRoom {
    id: string;
    name: string;
    space?: boolean;
    children?: Array<string | { id: string; order?: string; via?: string[] }>;
    membership?: string;
    alias?: string;
    members?: number;
    lastActive?: number;
    unread?: number;
    highlight?: number;
    avatar?: string;
    /** Avatar of the other person, for DMs. */
    memberAvatar?: string;
}

/** Just enough of matrix-js-sdk's MatrixClient for `buildGraph`. */
export function fakeClient(rooms: FakeRoom[], dms: Record<string, string[]> = {}): SdkClient {
    const sdkRooms: SdkRoom[] = rooms.map((r) => ({
        roomId: r.id,
        name: r.name,
        isSpaceRoom: () => Boolean(r.space),
        getMyMembership: () => r.membership ?? "join",
        getCanonicalAlias: () => r.alias ?? null,
        getAltAliases: () => [],
        getJoinedMemberCount: () => r.members ?? 2,
        getLastActiveTimestamp: () => r.lastActive ?? 0,
        getUnreadNotificationCount: (type) => (type === "highlight" ? (r.highlight ?? 0) : (r.unread ?? 0)),
        getMxcAvatarUrl: () => r.avatar ?? null,
        getAvatarFallbackMember: () => (r.memberAvatar ? { getMxcAvatarUrl: () => r.memberAvatar } : undefined),
        currentState: {
            getStateEvents: (type: string) =>
                type !== "m.space.child"
                    ? []
                    : (r.children ?? []).map((c) => {
                          const child = typeof c === "string" ? { id: c } : c;
                          return {
                              getStateKey: () => child.id,
                              getContent: () => ({ via: child.via ?? ["example.org"], order: child.order }),
                          };
                      }),
        },
    }));
    return {
        getVisibleRooms: () => sdkRooms,
        getAccountData: (type: string) => (type === "m.direct" ? { getContent: () => dms } : undefined),
        mxcUrlToHttp: (mxc, w, h, method, _direct, _redirects, auth) =>
            `https://hs.example/${auth ? "client/v1" : "media/v3"}/thumbnail/${mxc.slice(6)}?width=${w}&height=${h}&method=${method}`,
        getAccessToken: () => "token",
    };
}

/** A generated account: `spaces` top-level spaces with a sub-space each, `perSpace` rooms in every one. */
export function bigAccount(spaces: number, perSpace: number): FakeRoom[] {
    const rooms: FakeRoom[] = [];
    for (let s = 0; s < spaces; s++) {
        const roomIds = Array.from({ length: perSpace }, (_, i) => `!r${s}_${i}:x`);
        const sub = `!sub${s}:x`;
        rooms.push({ id: `!space${s}:x`, name: `Space ${s}`, space: true, children: [sub, ...roomIds.slice(0, perSpace / 2)] });
        rooms.push({ id: sub, name: `Team ${s}`, space: true, children: roomIds.slice(perSpace / 2) });
        roomIds.forEach((id, i) => rooms.push({ id, name: `Room ${s}-${i}`, lastActive: s * 1000 + i, unread: i % 7 === 0 ? 3 : 0 }));
    }
    return rooms;
}
