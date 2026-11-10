import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { FileItem } from "../files";
import { FileIndex } from "../scanner";
import { fakeClient, fileRaw } from "../tests/fakeClient";
import { FilesView, type FilesViewProps } from "./FilesView";

const NOW = Date.now();
const t = (key: string, vars?: Record<string, string | number>): string =>
    key.replace("datanauten_fileshub_", "") + (vars ? ` ${Object.values(vars).join(" ")}` : "");

function setup(over: Partial<FilesViewProps> = {}) {
    const client = fakeClient([
        {
            roomId: "!sales",
            name: "Sales",
            members: { "@alice:x": "Alice", "@bob:x": "Bob" },
            pages: [
                [
                    fileRaw("!sales", "Q3 Plan.pptx", NOW - 1000),
                    fileRaw("!sales", "photo.png", NOW - 2000, { sender: "@bob:x" }, { msgtype: "m.image", info: { mimetype: "image/png", size: 1234 } }),
                ],
            ],
        },
        { roomId: "!ops", name: "Ops", members: { "@carol:x": "Carol" }, pages: [[fileRaw("!ops", "budget.xlsx", NOW - 3000, { sender: "@carol:x" })]] },
    ]);
    const index = new FileIndex(() => client, { maxAgeDays: 90, maxEventsPerRoom: 100, concurrency: 2 });
    const props: FilesViewProps = {
        t,
        index,
        variant: "dialog",
        spaces: () => [],
        roomsInSpace: () => new Set(),
        rooms: () => client.getRooms().map((r) => ({ roomId: r.roomId, name: r.name })),
        roomName: (id) => client.getRoom(id)?.name ?? id,
        senderName: (roomId, userId) => client.getRoom(roomId)?.getMember(userId)?.name ?? userId,
        formatDate: (ts) => new Date(ts).toISOString().slice(0, 10),
        previewMaxMb: 25,
        ready: () => true,
        open: vi.fn(),
        download: vi.fn(async () => {}),
        loadBytes: vi.fn(async () => new ArrayBuffer(4)),
        onClose: vi.fn(),
        ...over,
    };
    return { client, index, props };
}

const names = () => screen.queryAllByTestId("fileshub-row").map((r) => r.querySelector(".fh-name")?.getAttribute("title"));

describe("FilesView", () => {
    it("lists files from all rooms and filters by type, person, room and name", async () => {
        const { props } = setup();
        render(<FilesView {...props} />);
        await act(() => new Promise((r) => setTimeout(r, 120)));
        expect(names()).toEqual(["Q3 Plan.pptx", "photo.png", "budget.xlsx"]);

        const user = userEvent.setup();
        await user.click(screen.getByTestId("fileshub-type-image"));
        expect(names()).toEqual(["photo.png"]);
        await user.click(screen.getByTestId("fileshub-type-all"));

        await user.selectOptions(screen.getByTestId("fileshub-person"), "@carol:x");
        expect(names()).toEqual(["budget.xlsx"]);
        await user.selectOptions(screen.getByTestId("fileshub-person"), "");

        await user.selectOptions(screen.getByTestId("fileshub-room"), "!sales");
        await act(() => new Promise((r) => setTimeout(r, 80)));
        expect(names()).toEqual(["Q3 Plan.pptx", "photo.png"]);

        await user.type(screen.getByTestId("fileshub-search"), "plan");
        expect(names()).toEqual(["Q3 Plan.pptx"]);
    });

    it("opened from a room header, scans only that room", async () => {
        const { props, client } = setup({ initialRoomId: "!ops" });
        render(<FilesView {...props} />);
        await act(() => new Promise((r) => setTimeout(r, 120)));
        expect(names()).toEqual(["budget.xlsx"]);
        expect(new Set(client.requests.map((r) => r.roomId))).toEqual(new Set(["!ops"]));
    });

    it("previews an image and jumps to the message", async () => {
        const created: Blob[] = [];
        URL.createObjectURL = vi.fn((b: Blob) => (created.push(b), "blob:test"));
        URL.revokeObjectURL = vi.fn();
        const { props } = setup();
        render(<FilesView {...props} />);
        await act(() => new Promise((r) => setTimeout(r, 120)));
        const user = userEvent.setup();
        await user.click(screen.getByTitle("photo.png"));
        expect(await screen.findByTestId("fileshub-preview-image")).toHaveProperty("src", "blob:test");
        expect(created[0].type).toBe("image/png");

        await user.click(screen.getByTestId("fileshub-open"));
        expect(props.open).toHaveBeenCalledWith(expect.objectContaining({ name: "photo.png", roomId: "!sales" }));
        expect(props.onClose).toHaveBeenCalled();
    });

    it("shows an Office hint instead of a preview and downloads", async () => {
        const { props } = setup();
        render(<FilesView {...props} />);
        await act(() => new Promise((r) => setTimeout(r, 120)));
        const user = userEvent.setup();
        await user.click(screen.getByTitle("budget.xlsx"));
        expect(screen.getByTestId("fileshub-preview").textContent).toContain("office_hint Excel");
        expect(props.loadBytes).not.toHaveBeenCalled();
        await user.click(screen.getByTestId("fileshub-download"));
        expect(props.download).toHaveBeenCalledWith(expect.objectContaining<Partial<FileItem>>({ name: "budget.xlsx" }));
    });

    it("stops scanning when closed", async () => {
        const { props, index } = setup();
        const view = render(<FilesView {...props} />);
        const cancel = vi.spyOn(index, "cancel");
        view.unmount();
        expect(cancel).toHaveBeenCalled();
    });
});
