import { describe, expect, it } from "vitest";

import { buildPeople, kindOf, LARGE_ROOM, MAX_GROUPS, OTHER_GROUP, type PeopleOptions } from "./people";
import { buildGraph } from "./rooms";
import { fakeClient, ME, type FakeOptions, type FakeRoom } from "./tests/fakeClient";

const DAY = 86_400_000;
const NOW = 1_000 * DAY;

function people(rooms: FakeRoom[], options: Partial<PeopleOptions> = {}, client: FakeOptions = {}) {
    const c = fakeClient(rooms, client);
    return buildPeople(c, buildGraph(c), { largeRooms: false, bots: false, now: NOW, ...options });
}

const account: FakeRoom[] = [
    { id: "!eng:x", name: "Engineering", space: true, children: ["!web:x", "!ops:x"], people: ["@alice:x", "@bob:x"] },
    { id: "!web:x", name: "Web", people: [{ id: "@alice:x", name: "Alice", power: 100 }, "@bob:x", "@carol:y"] },
    { id: "!ops:x", name: "Ops", people: [{ id: "@alice:x", name: "Alice A." }, "@bob:x"] },
    { id: "!dm:x", name: "Alice", people: [{ id: "@alice:x", name: "Alice" }], lastActive: NOW - DAY },
    { id: "!huge:x", name: "Matrix HQ", members: 5000, people: ["@stranger:z", "@bob:x", "@talker:z"], events: [{ sender: "@talker:z", replyTo: "$mine", ts: NOW }, { sender: ME, id: "$mine" }] },
];

describe("buildPeople", () => {
    it("finds everyone you share rooms with, closest first, and leaves you out", () => {
        const data = people(account, {}, { dms: { "@alice:x": ["!dm:x"] } });
        expect(data.me).toBe(ME);
        expect([...data.people.keys()].sort()).toEqual(["@alice:x", "@bob:x", "@carol:y", "@talker:z"]);
        const alice = data.people.get("@alice:x")!;
        expect(alice).toMatchObject({ name: "Alice", dm: "!dm:x", admin: 1, spaces: ["!eng:x"], lastContact: NOW - DAY, closeness: 1 });
        // Closest rooms first: the DM, then the room of three, then the room of four.
        expect(alice.rooms).toEqual(["!dm:x", "!ops:x", "!web:x"]);
        expect(data.people.get("@bob:x")!.closeness).toBeGreaterThan(data.people.get("@carol:y")!.closeness);
    });

    it("leaves out strangers from large rooms unless asked, but keeps people you talked to there", () => {
        expect(people(account).people.has("@stranger:z")).toBe(false);
        const talker = people(account).people.get("@talker:z")!;
        expect(talker.interactions).toBe(1);
        expect(talker.messages).toBe(1);
        expect(people(account, { largeRooms: true }).people.has("@stranger:z")).toBe(true);
        expect(LARGE_ROOM).toBeLessThan(5000);
    });

    it("counts replies and mentions both ways", () => {
        const data = people([
            {
                id: "!r:x",
                name: "Room",
                people: ["@a:x", "@b:x"],
                events: [
                    { sender: "@a:x", id: "$a", ts: 5 },
                    { sender: ME, replyTo: "$a", ts: 10 },
                    { sender: ME, mentions: ["@b:x"], ts: 20 },
                    { sender: "@b:x", mentions: [ME], ts: 30 },
                    { sender: "@b:x", type: "m.reaction", ts: 40 },
                ],
            },
        ]);
        expect(data.people.get("@a:x")).toMatchObject({ interactions: 1, messages: 1, lastContact: 10 });
        expect(data.people.get("@b:x")).toMatchObject({ interactions: 2, messages: 1, lastContact: 30 });
    });

    it("files people under where you know them from, not under DMs", () => {
        const data = people(account, {}, { dms: { "@alice:x": ["!dm:x"] } });
        const eng = data.groups.find((g) => g.key === "communities/!eng:x")!;
        expect(eng.label).toBe("Engineering");
        expect(eng.people).toEqual(["@alice:x", "@bob:x", "@carol:y"]);
        // Someone only in your DMs is filed there.
        const dmOnly = people([{ id: "!dm2:x", name: "Dora", people: ["@dora:x"] }], {}, { dms: { "@dora:x": ["!dm2:x"] } });
        expect(dmOnly.groups.map((g) => g.label)).toEqual(["Direct messages"]);
    });

    it("tells bots and bridged people apart, and hides bots unless asked", () => {
        expect(kindOf("@whatsapp_4915112345:x")).toEqual({ kind: "bridged", network: "WhatsApp" });
        expect(kindOf("@telegram_123:x")).toEqual({ kind: "bridged", network: "Telegram" });
        expect(kindOf("@whatsappbot:x").kind).toBe("bot");
        expect(kindOf("@hookshot:x").kind).toBe("bot");
        expect(kindOf("@robert:x").kind).toBe("person");
        const rooms: FakeRoom[] = [{ id: "!r:x", name: "Room", people: ["@whatsapp_49:x", "@githubbot:x"] }];
        const data = people(rooms);
        expect([...data.people.keys()]).toEqual(["@whatsapp_49:x"]);
        expect(data.people.get("@whatsapp_49:x")!.group).toBe("bridges/WhatsApp");
        expect(people(rooms, { bots: true }).people.has("@githubbot:x")).toBe(true);
    });

    it("leaves out ignored users and reads presence", () => {
        const data = people(account, {}, { ignored: ["@bob:x"], presence: { "@carol:y": "online" } });
        expect(data.people.has("@bob:x")).toBe(false);
        expect(data.people.get("@carol:y")!.presence).toBe("online");
    });

    it("puts the smallest contexts together when there are too many", () => {
        const rooms: FakeRoom[] = [];
        for (let i = 0; i < MAX_GROUPS + 5; i++) {
            rooms.push({ id: `!s${i}:x`, name: `Space ${i}`, space: true, children: [`!r${i}:x`] });
            rooms.push({ id: `!r${i}:x`, name: `Room ${i}`, people: Array.from({ length: i + 1 }, (_, j) => `@p${i}_${j}:x`) });
        }
        const data = people(rooms);
        expect(data.groups).toHaveLength(MAX_GROUPS);
        const other = data.groups.at(-1)!;
        expect(other.key).toBe(OTHER_GROUP);
        expect(other.people.length).toBe(1 + 2 + 3 + 4 + 5 + 6);
        expect(data.people.get("@p0_0:x")!.group).toBe(OTHER_GROUP);
    });
});
