import { beforeEach, describe, expect, it } from "vitest";

import { collectStats, loadStats, saveStats, STATS_KEY, type StatsClient } from "./stats";

const room = (id: string, o: { space?: boolean; enc?: boolean; unread?: number; members?: string[]; membership?: string } = {}) => ({
    roomId: id,
    getMyMembership: () => o.membership ?? "join",
    isSpaceRoom: () => !!o.space,
    hasEncryptionStateEvent: () => !!o.enc,
    getUnreadNotificationCount: () => o.unread ?? 0,
    getJoinedMembers: () => (o.members ?? ["@me:a.org"]).map((userId) => ({ userId })),
});

const client: StatsClient = {
    getDomain: () => "a.org",
    getRooms: () => [
        room("!s", { space: true }),
        room("!1", { enc: true, members: ["@me:a.org", "@bob:b.org", "@carol:c.org"] }),
        room("!2", { enc: true, unread: 2, members: ["@me:a.org", "@bob:b.org"] }),
        room("!3", { members: ["@me:a.org", "@dan:a.org"] }),
        room("!left", { membership: "leave", members: ["@eve:e.org"] }),
    ],
    getAccountData: () => ({ getContent: () => ({ "@bob:b.org": ["!2"] }) }),
};

beforeEach(() => localStorage.clear());

describe("collectStats", () => {
    it("counts joined rooms, spaces, direct chats, encryption, unread, people and servers", () => {
        expect(collectStats(client, "@me:a.org", 5)).toEqual({
            format: 1,
            userId: "@me:a.org",
            savedAt: 5,
            server: "a.org",
            rooms: 3,
            spaces: 1,
            dms: 1,
            encrypted: 2,
            unread: 1,
            people: 3,
            servers: 3,
        });
    });
});

describe("loadStats", () => {
    it("returns the stats of the user who's logged in, and drops another user's", () => {
        saveStats(collectStats(client, "@me:a.org")!);
        localStorage.setItem("mx_user_id", "@me:a.org");
        expect(loadStats()?.rooms).toBe(3);
        localStorage.setItem("mx_user_id", "@other:a.org");
        expect(loadStats()).toBeNull();
        expect(localStorage.getItem(STATS_KEY)).toBeNull();
    });
});
