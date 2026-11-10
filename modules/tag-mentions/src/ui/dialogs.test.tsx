import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { TagDefinition, ResolvedTag } from "../tags";
import { ManageDialog, type ManageDialogProps } from "./ManageDialog";
import { PickerDialog } from "./PickerDialog";

const t = (key: string, vars?: Record<string, string | number>): string =>
    key.replace("datanauten_tagmentions_", "") + (vars ? ` ${JSON.stringify(vars)}` : "");
const NAMES: Record<string, string> = { "@bob:t": "Bob", "@carol:t": "Carol", "@dave:t": "Dave" };
const name = (u: string): string => NAMES[u] ?? u;

const def = (n: string, userIds: string[], sourceId = "!room:t"): TagDefinition => ({
    name: n,
    label: "",
    userIds,
    sourceId,
    sourceName: sourceId === "!room:t" ? "Ops" : "Engineering",
    fromSpace: sourceId !== "!room:t",
});

function manage(overrides: Partial<ManageDialogProps> = {}): ManageDialogProps & { onSubmit: () => void; onCancel: () => void } {
    return {
        t,
        scopes: [
            { id: "!room:t", name: "Ops", isSpace: false, canEdit: true, level: 50 },
            { id: "!space:t", name: "Engineering", isSpace: true, canEdit: false, level: 100 },
        ],
        tagsIn: (id) => (id === "!room:t" ? [def("oncall", ["@bob:t"])] : [def("design", ["@carol:t"], "!space:t")]),
        inherited: () => [def("design", ["@carol:t"], "!space:t")],
        members: async () => Object.entries(NAMES).map(([userId, n]) => ({ userId, name: n })),
        name,
        save: vi.fn(async () => {}),
        remove: vi.fn(async () => {}),
        subscribe: () => () => {},
        max: 3,
        onSubmit: vi.fn(),
        onCancel: vi.fn(),
        ...overrides,
    };
}

describe("ManageDialog", () => {
    it("lists room tags and the space tags that apply", () => {
        render(<ManageDialog {...manage()} />);
        expect(screen.getByText("@oncall")).toBeTruthy();
        expect(screen.getByText("inherited")).toBeTruthy();
        expect(screen.getByText("@design")).toBeTruthy();
    });

    it("creates a tag with picked members and shows it right away", async () => {
        const props = manage();
        render(<ManageDialog {...props} />);
        await userEvent.click(screen.getByRole("button", { name: "new_tag" }));
        await userEvent.type(screen.getByPlaceholderText("oncall"), "@Design");
        await userEvent.click(await screen.findByRole("checkbox", { name: "Carol" }));
        await userEvent.click(screen.getByRole("checkbox", { name: "Dave" }));
        await userEvent.type(screen.getByLabelText(/add_user_id/), "@erin:other{Enter}");
        await userEvent.click(screen.getByRole("button", { name: "save" }));
        expect(props.save).toHaveBeenCalledWith("!room:t", "design", "", ["@carol:t", "@dave:t", "@erin:other"]);
        await waitFor(() => expect(screen.getByTestId("tag-mentions-manage")).toBeTruthy());
        // The room's own @design now hides the space's.
        expect(screen.queryByText("inherited")).toBeNull();
    });

    it("validates name, members and the limit", async () => {
        const props = manage();
        render(<ManageDialog {...props} />);
        await userEvent.click(screen.getByRole("button", { name: "new_tag" }));
        const save = screen.getByRole("button", { name: "save" });
        await userEvent.type(screen.getByPlaceholderText("oncall"), "channel");
        await userEvent.click(save);
        expect(screen.getByRole("alert").textContent).toContain("err_name_reserved");
        await userEvent.clear(screen.getByPlaceholderText("oncall"));
        await userEvent.type(screen.getByPlaceholderText("oncall"), "oncall");
        await userEvent.click(save);
        expect(screen.getByRole("alert").textContent).toContain("err_name_taken");
        await userEvent.clear(screen.getByPlaceholderText("oncall"));
        await userEvent.type(screen.getByPlaceholderText("oncall"), "ops");
        await userEvent.click(save);
        expect(screen.getByRole("alert").textContent).toContain("err_no_members");
        for (const n of ["Bob", "Carol", "Dave"]) await userEvent.click(await screen.findByRole("checkbox", { name: n }));
        await userEvent.type(screen.getByLabelText(/add_user_id/), "nope{Enter}");
        expect(screen.getByRole("alert").textContent).toContain("err_user_id");
        await userEvent.clear(screen.getByLabelText(/add_user_id/));
        await userEvent.type(screen.getByLabelText(/add_user_id/), "@x:t{Enter}");
        await userEvent.click(save);
        expect(screen.getByRole("alert").textContent).toContain("err_too_many");
        expect(props.save).not.toHaveBeenCalled();
    });

    it("deletes after a second click", async () => {
        const props = manage();
        render(<ManageDialog {...props} />);
        await userEvent.click(screen.getByRole("button", { name: "delete" }));
        expect(props.remove).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole("button", { name: "delete_confirm" }));
        expect(props.remove).toHaveBeenCalledWith("!room:t", "oncall");
        await waitFor(() => expect(screen.queryByText("@oncall")).toBeNull());
    });

    it("is read-only in a scope the user can't edit", async () => {
        render(<ManageDialog {...manage()} />);
        await userEvent.click(screen.getByRole("radio", { name: /scope_space/ }));
        expect(screen.getByText(/no_permission/).textContent).toContain("100");
        expect(screen.queryByRole("button", { name: "new_tag" })).toBeNull();
        expect(screen.queryByRole("button", { name: "edit" })).toBeNull();
    });
});

describe("PickerDialog", () => {
    const tags: ResolvedTag[] = [
        { name: "channel", label: "", kind: "channel", members: [], absent: [], allowed: false },
        { name: "oncall", label: "On call", kind: "tag", members: ["@bob:t"], absent: ["@dave:t"], allowed: true },
        { name: "big", label: "", kind: "tag", members: ["@a:t", "@b:t", "@c:t"], absent: [], allowed: true },
    ];

    it("inserts the tag into the composer", async () => {
        const insert = vi.fn();
        const onSubmit = vi.fn();
        render(
            <PickerDialog t={t} tags={tags} name={name} max={2} mode="insert" insert={insert} send={vi.fn()} openManage={vi.fn()} onSubmit={onSubmit} onCancel={vi.fn()} />,
        );
        expect(screen.getByText(/absent/).textContent).toContain("Dave");
        expect((screen.getByRole("option", { name: /@channel/ }) as HTMLButtonElement).disabled).toBe(true);
        expect((screen.getByRole("option", { name: /@big/ }) as HTMLButtonElement).disabled).toBe(true);
        await userEvent.click(screen.getByRole("option", { name: /@oncall/ }));
        expect(insert).toHaveBeenCalledWith(tags[1]);
        expect(onSubmit).toHaveBeenCalledWith("oncall");
    });

    it("sends the message itself without the composer hook", async () => {
        const send = vi.fn(async () => {});
        render(
            <PickerDialog t={t} tags={tags} name={name} max={5} mode="send" initialText="hi" insert={vi.fn()} send={send} openManage={vi.fn()} onSubmit={vi.fn()} onCancel={vi.fn()} />,
        );
        await userEvent.click(screen.getByRole("option", { name: /@oncall/ }));
        await userEvent.type(screen.getByLabelText("message"), " there");
        await userEvent.click(screen.getByRole("button", { name: "send" }));
        expect(send).toHaveBeenCalledWith(tags[1], "hi there");
    });
});
