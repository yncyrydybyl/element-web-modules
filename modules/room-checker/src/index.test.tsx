import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ModuleDefault, { parseConfig, RoomCheckerModule } from "./index";
import { POLICY_TYPE } from "./policies";
import { fakeClient, goodState, type FakeRoom } from "./tests/fakeClient";
import { mockApi } from "./tests/mockApi";
import { version } from "../package.json";

const modules: RoomCheckerModule[] = [];

function rooms(): FakeRoom[] {
    const bad = goodState("!eng:x", "Random");
    delete bad["m.room.topic"];
    delete bad["m.room.encryption"];
    delete bad["m.room.avatar"];
    const deep = goodState("!eng:x", "Deep");
    return [
        { id: "!eng:x", name: "Engineering", space: true, children: ["!good:x", "!bad:x", "!sub:x", "!left:x"] },
        { id: "!sub:x", name: "Backend", space: true, children: ["!deep:x"] },
        { id: "!good:x", state: goodState("!eng:x", "General") },
        { id: "!bad:x", state: bad },
        // Points at the top space instead of its own sub-space.
        { id: "!deep:x", state: deep },
        { id: "!left:x", name: "Archive", left: true },
    ];
}

async function setup(list: FakeRoom[] = rooms()) {
    const fake = fakeClient(list);
    (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg = { get: () => fake.client };
    const mock = mockApi();
    const module = new RoomCheckerModule(mock.api);
    await module.load();
    modules.push(module);
    act(() => module.open());
    // The hierarchy (names of rooms you aren't in) arrives async.
    await screen.findByText("Archive");
    return { module, ...fake, ...mock };
}

const tableRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);
const row = (name: string) => tableRows().find((r) => r.querySelector(".rc-room-name")!.textContent === name)!;
const rowNames = () => tableRows().map((r) => r.querySelector(".rc-room-name")!.textContent);

function press(key: string, init: KeyboardEventInit = {}) {
    const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
    act(() => void document.body.dispatchEvent(ev));
    return ev;
}

afterEach(() => {
    for (const m of modules.splice(0)) act(() => m.dispose());
    delete (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg;
    vi.restoreAllMocks();
});

describe("RoomCheckerModule", () => {
    it("is a valid module for Element's loader", () => {
        expect(typeof ModuleDefault).toBe("function");
        expect(ModuleDefault.moduleApiVersion).toBe("^2.0.0");
        expect(parseConfig(undefined)).toEqual({ trigger_key: "Alt+R" });
        expect(() => parseConfig({ trigger_key: 3 })).toThrow();
    });

    it("opens with Alt+R and checks the space's rooms, worst first", async () => {
        const { module } = await setup();
        act(() => module.close());
        const ev = press("r", { altKey: true, code: "KeyR" });
        expect(ev.defaultPrevented).toBe(true);
        await screen.findByText("Archive");
        expect(screen.getByRole("dialog", { name: "Room checker" })).toBeTruthy();
        // Archive (not joined) is checked from the server's summary: no topic, no picture.
        expect(rowNames()).toEqual(["Random", "Archive", "Deep", "General"]);
        expect(tableRows()[0].textContent).toContain("1 error · 2 warnings");
        expect(tableRows()[1].textContent).toContain("Not joined · 2 warnings");
        expect(screen.getByText("33 % of the rooms you're in pass every policy")).toBeTruthy();
        expect(screen.getByText(`v${version}`)).toBeTruthy();
        press("r", { altKey: true, code: "KeyR" });
        expect(module.isOpen()).toBe(false);
    });

    it("filters by status and by policy", async () => {
        const user = userEvent.setup();
        await setup();
        await user.click(screen.getByRole("button", { name: /With errors/ }));
        expect(rowNames()).toEqual(["Random"]);
        await user.click(screen.getByRole("button", { name: "Not joined" }));
        expect(rowNames()).toEqual(["Archive"]);
        await user.click(screen.getByRole("button", { name: /Belongs to the space/ }));
        expect(rowNames()).toEqual(["Deep"]);
        await user.type(screen.getByRole("searchbox"), "zzz");
        expect(screen.getByText("No room matches.")).toBeTruthy();
    });

    it("shows a room's checks and fixes them", async () => {
        const user = userEvent.setup();
        const { sendStateEvent, client } = await setup();
        await user.click(tableRows()[0]);
        const detail = screen.getByTestId("room-checker-detail");
        expect(within(detail).getByText("Not encrypted")).toBeTruthy();

        await user.click(within(detail).getByRole("button", { name: "Write a topic" }));
        await user.type(within(detail).getByRole("textbox", { name: "Write a topic" }), "Anything goes, within reason");
        await user.click(within(detail).getByRole("button", { name: "Save" }));
        expect(sendStateEvent).toHaveBeenCalledWith("!bad:x", "m.room.topic", expect.objectContaining({ topic: "Anything goes, within reason" }), "");

        // Encryption can't be undone: it asks first.
        await user.click(within(detail).getByRole("button", { name: "Turn on encryption" }));
        await user.click(within(detail).getByRole("button", { name: "Turn on encryption" }));
        expect(sendStateEvent).toHaveBeenCalledWith("!bad:x", "m.room.encryption", { algorithm: "m.megolm.v1.aes-sha2" }, "");

        const file = new File(["x"], "a.png", { type: "image/png" });
        await user.upload(within(detail).getByTestId("room-checker-avatar-input"), file);
        expect(client.uploadContent).toHaveBeenCalledWith(file);
        await waitFor(() => expect(sendStateEvent).toHaveBeenCalledWith("!bad:x", "m.room.avatar", { url: "mxc://x/new" }, ""));

        // Checked again once the state comes back.
        await waitFor(() => expect(tableRows().find((r) => r.textContent?.includes("Random"))!.textContent).toContain("Passes every policy"));
    });

    it("links a room to the sub-space it's listed in", async () => {
        const user = userEvent.setup();
        const { sendStateEvent } = await setup();
        await user.click(row("Deep"));
        const detail = screen.getByTestId("room-checker-detail");
        expect(within(detail).getByText("In Backend")).toBeTruthy();
        await user.click(within(detail).getByRole("button", { name: "Link it to the space" }));
        expect(sendStateEvent).toHaveBeenCalledWith("!deep:x", "m.space.parent", { via: ["x"], canonical: true }, "!sub:x");
    });

    it("says so when you can't change a room", async () => {
        const user = userEvent.setup();
        const list = rooms();
        list.find((r) => r.id === "!bad:x")!.denied = ["m.room.topic"];
        await setup(list);
        await user.click(tableRows()[0]);
        const topic = within(screen.getByTestId("room-checker-detail")).getByText("No topic").closest("li")!;
        expect(within(topic).getByText("You can't change this in this room.")).toBeTruthy();
    });

    it("edits the space's policies and checks against them", async () => {
        const user = userEvent.setup();
        const { sendStateEvent } = await setup();
        await user.click(screen.getByRole("tab", { name: "Policies" }));
        expect(screen.getByText(/This space has no policies yet/)).toBeTruthy();
        await user.click(screen.getByRole("switch", { name: "Picture" }));
        await user.click(screen.getByRole("switch", { name: "Address" }));
        await user.click(screen.getByRole("button", { name: "Save to the space" }));
        expect(sendStateEvent).toHaveBeenCalledWith(
            "!eng:x",
            POLICY_TYPE,
            expect.objectContaining({ version: 1, policies: expect.objectContaining({ avatar: expect.objectContaining({ enabled: false }) }) }),
            "",
        );
        await waitFor(() => expect(screen.getByText(/Last changed by @me:x/)).toBeTruthy());
        await user.click(screen.getByRole("tab", { name: "Rooms" }));
        const headers = within(screen.getByRole("table")).getAllByRole("columnheader").map((h) => h.textContent);
        expect(headers).toContain("Address");
        expect(headers).not.toContain("Picture");
    });

    it("shows the policies read-only to people who can't change the space", async () => {
        const user = userEvent.setup();
        const list = rooms();
        list[0].denied = [POLICY_TYPE];
        await setup(list);
        await user.click(screen.getByRole("tab", { name: "Policies" }));
        expect(screen.getByText(/Only people who may change/)).toBeTruthy();
        expect((screen.getByRole("switch", { name: "Picture" }) as HTMLInputElement).disabled).toBe(true);
        expect(screen.queryByRole("button", { name: "Save to the space" })).toBeNull();
    });

    it("checks rooms you aren't in from the server's summary, sub-spaces included", async () => {
        const user = userEvent.setup();
        const list = rooms();
        list.find((r) => r.id === "!left:x")!.summary = {
            topic: "Old stuff, kept for reference",
            avatar_url: "mxc://x/p",
            join_rule: "public",
            world_readable: true,
            room_version: "12",
        };
        list.push({ id: "!other:x", name: "Others", space: true, left: true, children: ["!far:x"] }, { id: "!far:x", name: "Far away", left: true });
        list[0].children!.push("!other:x");
        await setup(list);
        await screen.findByText("Far away");
        await user.click(row("Archive"));
        const detail = screen.getByTestId("room-checker-detail");
        expect(within(detail).getByText(/these checks use what the server tells everyone/)).toBeTruthy();
        // Unencrypted (the server sends summary fields, and no encryption), public, readable by anyone.
        expect(within(detail).getByText("Not encrypted")).toBeTruthy();
        expect(within(detail).getByText("Join rule is “Anyone”")).toBeTruthy();
        expect(within(detail).getAllByText("Can't be checked without being in the room")).toHaveLength(2);
        expect(within(detail).getAllByText("Join the room to fix this.").length).toBeGreaterThan(0);
        await user.click(row("Far away"));
        expect(within(screen.getByTestId("room-checker-detail")).getByText("In Others")).toBeTruthy();
    });

    it("accepts a failure for one room, and takes it back", async () => {
        const user = userEvent.setup();
        const { sendStateEvent } = await setup();
        await user.click(row("Random"));
        const topic = () => within(screen.getByTestId("room-checker-detail")).getByText("Topic").closest("li")!;
        await user.click(within(topic()).getByRole("button", { name: "Accept for this room …" }));
        await user.type(within(topic()).getByRole("textbox", { name: "Why is this fine here?" }), "Random is random");
        await user.click(within(topic()).getByRole("button", { name: "Accept" }));
        expect(sendStateEvent).toHaveBeenLastCalledWith(
            "!eng:x",
            POLICY_TYPE,
            expect.objectContaining({ exceptions: { "!bad:x": { topic: expect.objectContaining({ reason: "Random is random", by: "@me:x" }) } } }),
            "",
        );
        await waitFor(() => expect(within(topic()).getByText("“Random is random”")).toBeTruthy());
        expect(row("Random").textContent).toContain("1 error · 1 warning");
        expect(screen.getByText(/1 accepted exception/)).toBeTruthy();

        // Saving the policies keeps the exception.
        await user.click(screen.getByRole("tab", { name: "Policies" }));
        expect(screen.getByText("“Random is random”")).toBeTruthy();
        await user.click(screen.getByRole("switch", { name: "Address" }));
        await user.click(screen.getByRole("button", { name: "Save to the space" }));
        expect(sendStateEvent).toHaveBeenLastCalledWith("!eng:x", POLICY_TYPE, expect.objectContaining({ exceptions: { "!bad:x": expect.anything() } }), "");

        await user.click(screen.getByRole("tab", { name: "Rooms" }));
        await user.click(row("Random"));
        await user.click(within(topic()).getByRole("button", { name: "Take back" }));
        await waitFor(() => expect(row("Random").textContent).toContain("1 error · 3 warnings"));
    });

    it("fixes one policy in every room it can", async () => {
        const user = userEvent.setup();
        const list = rooms();
        const extra = goodState("!eng:x", "Extra");
        delete extra["m.room.encryption"];
        list.push({ id: "!extra:x", state: extra }, { id: "!locked:x", state: { ...extra, "m.room.name": { name: "Locked" } }, denied: ["m.room.encryption"] });
        list[0].children!.push("!extra:x", "!locked:x");
        const { sendStateEvent } = await setup(list);
        await user.click(screen.getByRole("button", { name: /^Encryption/ }));
        const bulk = screen.getByTestId("room-checker-bulk");
        expect(within(bulk).getByText("3 rooms fail this policy.")).toBeTruthy();
        expect(within(bulk).getByText(/^1 can't be fixed from here/)).toBeTruthy();
        await user.click(within(bulk).getByRole("button", { name: "Turn on encryption in 2 rooms" }));
        // Encryption can't be undone: the list of rooms, and the warning.
        expect(within(bulk).getByText(/can't be turned off again/)).toBeTruthy();
        expect(within(bulk).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Random", "Extra"]);
        await user.click(within(bulk).getByRole("button", { name: "Change 2 rooms" }));
        await waitFor(() => expect(within(bulk).getByText("Changed 2 of 2 rooms.")).toBeTruthy());
        expect(sendStateEvent).toHaveBeenCalledWith("!bad:x", "m.room.encryption", { algorithm: "m.megolm.v1.aes-sha2" }, "");
        expect(sendStateEvent).toHaveBeenCalledWith("!extra:x", "m.room.encryption", { algorithm: "m.megolm.v1.aes-sha2" }, "");
        expect(sendStateEvent).not.toHaveBeenCalledWith("!locked:x", expect.anything(), expect.anything(), expect.anything());

        // Fixes that need input per room aren't offered in bulk.
        await user.click(screen.getByRole("button", { name: /^Picture/ }));
        expect(within(screen.getByTestId("room-checker-bulk")).getByText("This one is fixed room by room: click a room.")).toBeTruthy();
    });

    it("does nothing without Element's client", async () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        const module = new RoomCheckerModule(mockApi().api);
        await module.load();
        modules.push(module);
        act(() => module.open());
        expect(module.isOpen()).toBe(false);
    });
});
