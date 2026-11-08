import { ClientWidgetApi } from "matrix-widget-api";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UserWidgetDriver } from "./driver";
import { embedUrl, isSameOriginAsElement, WidgetHost } from "./host";
import { fakeClient, fakeEvent, fakeRoom } from "./tests/fakes";
import type { UserWidget } from "./widgets";

const ROOM = "!room:x";
const widget: UserWidget = {
    id: "w1",
    name: "PDF",
    url: "https://pdf.example/#/?room=$matrix_room_id&user=$matrix_user_id&theme=$org.matrix.msc2873.client_theme",
    type: "m.custom",
    creatorUserId: "@alice:x",
    data: {},
};

const file = (id: string, room = ROOM) =>
    fakeEvent({ event_id: id, room_id: room, type: "m.room.message", content: { msgtype: "m.file", body: `${id}.pdf` } });
const text = (id: string) => fakeEvent({ event_id: id, room_id: ROOM, type: "m.room.message", content: { msgtype: "m.text", body: "hi" } });
const member = (userId: string) =>
    fakeEvent({ event_id: `$m-${userId}`, room_id: ROOM, type: "m.room.member", state_key: userId, content: { membership: "join" } });

afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
});

describe("embedUrl", () => {
    it("fills the template for the room it is opened in and adds widgetId and parentUrl", () => {
        const client = fakeClient([fakeRoom(ROOM)]);
        const url = new URL(embedUrl(widget, ROOM, client, client.getRoom(ROOM)));
        expect(url.searchParams.get("widgetId")).toBe("w1");
        expect(url.searchParams.get("parentUrl")).toBe(window.location.href.split("#")[0]);
        expect(decodeURIComponent(url.hash)).toBe("#/?room=!room:x&user=@alice:x&theme=light");
    });

    it("refuses widgets on Element's own origin", () => {
        expect(isSameOriginAsElement(`${window.location.origin}/evil.html`)).toBe(true);
        expect(isSameOriginAsElement("https://pdf.example/")).toBe(false);
        expect(isSameOriginAsElement("not a url")).toBe(true);
    });
});

describe("UserWidgetDriver", () => {
    const room = fakeRoom(ROOM, [file("$1"), text("$2"), file("$3")], [member("@alice:x"), member("@bob:x")]);

    it("reads the timeline newest first, filtered by type and msgtype", async () => {
        const driver = new UserWidgetDriver(fakeClient([room]), ROOM, async (c) => c);
        const events = await driver.readRoomTimeline(ROOM, "m.room.message", "m.file", undefined, 10, undefined);
        expect(events.map((e) => e.event_id)).toEqual(["$3", "$1"]);
        expect(await driver.readRoomTimeline(ROOM, "m.room.message", undefined, undefined, 1, undefined)).toHaveLength(1);
        expect(await driver.readRoomTimeline(ROOM, "m.room.message", undefined, undefined, 10, "$2")).toHaveLength(1);
        expect(await driver.readRoomTimeline("!other:x", "m.room.message", undefined, undefined, 10, undefined)).toEqual([]);
    });

    it("reads room state, all keys or one", async () => {
        const driver = new UserWidgetDriver(fakeClient([room]), ROOM, async (c) => c);
        expect((await driver.readRoomState(ROOM, "m.room.member", undefined)).map((e) => e.state_key)).toEqual(["@alice:x", "@bob:x"]);
        expect((await driver.readRoomState(ROOM, "m.room.member", "@bob:x")).map((e) => e.state_key)).toEqual(["@bob:x"]);
        expect(await driver.readRoomState(ROOM, "m.room.member", "@carol:x")).toEqual([]);
    });

    it("sends into the room it was opened in unless told otherwise", async () => {
        const client = fakeClient([room]);
        const driver = new UserWidgetDriver(client, ROOM, async (c) => c);
        expect(await driver.sendEvent("m.room.message", { body: "x" })).toEqual({ roomId: ROOM, eventId: "$sent" });
        expect(client.sendEvent).toHaveBeenCalledWith(ROOM, "m.room.message", { body: "x" });
        await driver.sendEvent("org.example.thing", { a: 1 }, "", "!other:x");
        expect(client.sendStateEvent).toHaveBeenCalledWith("!other:x", "org.example.thing", { a: 1 }, "");
        await driver.sendEvent("m.room.redaction", { redacts: "$1" });
        expect(client.redactEvent).toHaveBeenCalledWith(ROOM, "$1");
    });

    it("downloads media with the access token", async () => {
        const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("pdf-bytes"));
        const driver = new UserWidgetDriver(fakeClient([room]), ROOM, async (c) => c);
        const { file: blob } = await driver.downloadFile("mxc://hs.example/abc");
        expect((blob as Blob).size).toBe("pdf-bytes".length);
        expect(fetchMock).toHaveBeenCalledWith("https://hs.example/_matrix/client/v1/media/download/hs.example/abc", {
            headers: { Authorization: "Bearer tok" },
        });
        await expect(driver.downloadFile("https://elsewhere/")).rejects.toThrow("Not a media URI");
    });

    it("blocks OpenID", () => {
        const update = vi.fn();
        new UserWidgetDriver(fakeClient(), ROOM, async (c) => c).askOpenID({ update } as never);
        expect(update).toHaveBeenCalledWith({ state: "blocked" });
    });
});

describe("WidgetHost", () => {
    it("feeds only live events of its room, after decryption, and detaches on stop", () => {
        const feed = vi.spyOn(ClientWidgetApi.prototype, "feedEvent").mockResolvedValue();
        const feedState = vi.spyOn(ClientWidgetApi.prototype, "feedStateUpdate").mockResolvedValue();
        const room = fakeRoom(ROOM);
        const client = fakeClient([room, fakeRoom("!other:x")]);
        const host = new WidgetHost(widget, ROOM, document.body, client, async (_w, c) => c);

        expect(host.iframe.isConnected).toBe(true);
        expect(host.iframe.getAttribute("sandbox")).toContain("allow-scripts");
        expect(host.iframe.src).toContain("widgetId=w1");

        const live = { liveEvent: true };
        client.emit("Room.timeline", file("$live"), room, false, false, live);
        client.emit("Room.timeline", file("$old"), room, true, false, live); // backfill
        client.emit("Room.timeline", file("$hist"), room, false, false, { liveEvent: false });
        client.emit("Room.timeline", file("$else", "!other:x"), fakeRoom("!other:x"), false, false, live);
        const encrypted = file("$enc");
        encrypted.decrypting = true;
        client.emit("Room.timeline", encrypted, room, false, false, live);
        expect(feed.mock.calls.map(([e]) => e.event_id)).toEqual(["$live"]);
        encrypted.decrypting = false;
        client.emit("Event.decrypted", encrypted);
        client.emit("Event.decrypted", file("$unrelated"));
        expect(feed.mock.calls.map(([e]) => e.event_id)).toEqual(["$live", "$enc"]);

        client.emit("RoomState.events", member("@bob:x"));
        client.emit("RoomState.events", fakeEvent({ event_id: "$s", room_id: "!other:x", type: "m.room.name", state_key: "", content: {} }));
        expect(feedState).toHaveBeenCalledTimes(1);

        host.stop();
        expect(host.iframe.isConnected).toBe(false);
        expect([...client.listeners.values()].every((s) => s.size === 0)).toBe(true);
    });
});
