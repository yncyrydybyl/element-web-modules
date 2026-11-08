import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { Watchable, type Api } from "@element-hq/element-web-module-api";

import ModuleDefault, { TextReactionsModule } from "./index";
import { findRoomOfEvent, normaliseReaction, type SdkClient, type SdkRoom } from "./reactions";
import { TextReactionDialog } from "./ui/TextReactionDialog";

const strings: Record<string, string> = { "action|react": "React" };

function mockApi(accountData?: unknown) {
    const watchable = new Watchable<unknown>(accountData);
    const opened: Array<{ props: Record<string, unknown> }> = [];
    const api = {
        i18n: {
            register: (t: Record<string, Record<string, string>>) => {
                for (const [k, v] of Object.entries(t)) strings[k] = v.en;
            },
            translate: (k: string, vars?: Record<string, string>) => (strings[k] ?? k).replace(/%\((\w+)\)s/g, (_, n) => vars?.[n] ?? ""),
        },
        client: {
            accountData: {
                get: () => watchable,
                set: vi.fn(async (_t: string, c: unknown) => {
                    watchable.value = c;
                }),
            },
        },
        openDialog: vi.fn((_opts: unknown, _component: unknown, props: Record<string, unknown>) => {
            opened.push({ props });
            return { finished: new Promise(() => {}), close: vi.fn() };
        }),
        createRoot: (el: Element) => createRoot(el),
    };
    return { api: api as unknown as Api, opened, accountData: watchable };
}

function fakeClient(sendEvent = vi.fn(async () => ({ event_id: "$r" }))): SdkClient & { sendEvent: typeof sendEvent } {
    const room: SdkRoom = { roomId: "!room:x", getCanonicalAlias: () => "#room:x", findEventById: (id: string) => (id === "$msg" ? {} : undefined) };
    return { getUserId: () => "@me:x", getRoom: (id) => (id === room.roomId ? room : null), getRooms: () => [room], sendEvent };
}

/** An event tile with Element's action bar, as rendered by Element 1.12.x. */
function tile(eventId = "$msg", withReact = true): HTMLElement {
    const el = document.createElement("li");
    el.setAttribute("data-event-id", eventId);
    el.innerHTML = `<div role="toolbar" class="mx_MessageActionBar" aria-label="Message Actions">
        <button aria-label="Reply" class="_button_x item" data-kind="tertiary"></button>
        ${withReact ? '<button aria-label="React" class="_button_x item" data-kind="tertiary"></button>' : ""}
        <button aria-label="Options" class="_button_x item" data-kind="tertiary"></button>
    </div>`;
    return el;
}

const modules: TextReactionsModule[] = [];
afterEach(() => {
    for (const m of modules.splice(0)) m.dispose();
    document.body.innerHTML = "";
    delete (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg;
});

async function load(accountData?: unknown) {
    const mock = mockApi(accountData);
    const module = new TextReactionsModule(mock.api);
    modules.push(module);
    await module.load();
    return { module, ...mock };
}

describe("action bar button", () => {
    beforeEach(() => {
        window.location.hash = "#/room/!room:x";
    });

    it("is a valid module", () => {
        expect(ModuleDefault.moduleApiVersion).toBe("^2.0.0");
    });

    it("goes right before Element's React button, styled like it, once", async () => {
        await load();
        const el = tile();
        document.body.appendChild(el);
        await waitFor(() => expect(el.querySelector(".dtr-button")).toBeTruthy());
        const labels = [...el.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"));
        expect(labels).toEqual(["Reply", "React with text", "React", "Options"]);
        const button = el.querySelector<HTMLButtonElement>(".dtr-button")!;
        expect(button.className).toContain("_button_x item");
        expect(button.getAttribute("data-kind")).toBe("tertiary");

        // Element re-renders the toolbar: still only one button.
        el.querySelector("[role=toolbar]")!.appendChild(document.createElement("span"));
        await act(async () => {});
        expect(el.querySelectorAll(".dtr-button")).toHaveLength(1);
    });

    it("stays away where the user can't react", async () => {
        await load();
        const el = tile("$msg", false);
        document.body.appendChild(el);
        await act(async () => {});
        expect(el.querySelector(".dtr-button")).toBeNull();
    });

    it("opens the dialog for that message with the recent reactions", async () => {
        const { opened } = await load({ version: 1, recent: ["+1", "same"] });
        document.body.appendChild(tile());
        await waitFor(() => expect(document.querySelector(".dtr-button")).toBeTruthy());
        await userEvent.click(document.querySelector<HTMLButtonElement>(".dtr-button")!);
        expect(opened).toHaveLength(1);
        expect(opened[0].props.recent).toEqual(["+1", "same"]);
    });

    it("sends an m.reaction with the text as key and remembers it", async () => {
        const client = fakeClient();
        (window as { mxMatrixClientPeg?: unknown }).mxMatrixClientPeg = { get: () => client };
        const { module, opened, accountData } = await load({ version: 1, recent: ["same"] });
        module.openDialog("$msg");
        await (opened[0].props.send as (k: string) => Promise<void>)("lol");
        expect(client.sendEvent).toHaveBeenCalledWith("!room:x", "m.reaction", {
            "m.relates_to": { rel_type: "m.annotation", event_id: "$msg", key: "lol" },
        });
        await waitFor(() => expect(accountData.value).toEqual({ version: 1, recent: ["lol", "same"] }));
    });
});

describe("dialog", () => {
    const t = (k: string, v?: Record<string, string>) => (strings[k] ?? k).replace(/%\((\w+)\)s/g, (_, n) => v?.[n] ?? "");

    it("sends the typed text with Enter", async () => {
        const send = vi.fn(async () => {});
        const onSubmit = vi.fn();
        render(<TextReactionDialog recent={[]} t={t} send={send} onSubmit={onSubmit} onCancel={vi.fn()} />);
        await userEvent.type(screen.getByLabelText("Reaction"), "  so   true {Enter}");
        expect(send).toHaveBeenCalledWith("so true");
        expect(onSubmit).toHaveBeenCalledWith("so true");
    });

    it("sends a recent reaction with one click", async () => {
        const send = vi.fn(async () => {});
        render(<TextReactionDialog recent={["+1"]} t={t} send={send} onSubmit={vi.fn()} onCancel={vi.fn()} />);
        await userEvent.click(screen.getByRole("button", { name: "+1" }));
        expect(send).toHaveBeenCalledWith("+1");
    });

    it("keeps the dialog open with an error", async () => {
        const { DuplicateReactionError } = await import("./reactions");
        const send = vi.fn(async () => {
            throw new DuplicateReactionError();
        });
        const onSubmit = vi.fn();
        render(<TextReactionDialog recent={[]} t={t} send={send} onSubmit={onSubmit} onCancel={vi.fn()} />);
        await userEvent.type(screen.getByLabelText("Reaction"), "same{Enter}");
        expect(screen.getByRole("alert").textContent).toBe("You already reacted with “same”.");
        expect(onSubmit).not.toHaveBeenCalled();

        await userEvent.clear(screen.getByLabelText("Reaction"));
        await userEvent.type(screen.getByLabelText("Reaction"), "x".repeat(65) + "{Enter}");
        expect(screen.getByRole("alert").textContent).toBe("At most 64 characters.");
    });
});

describe("sending", () => {
    const reaction = (key: string, redacted = false) => ({
        getType: () => "m.reaction",
        getRelation: () => ({ event_id: "$msg", key }),
        isRedacted: () => redacted,
    });

    it("doesn't send a reaction the user already made", async () => {
        const { sendReaction, DuplicateReactionError } = await import("./reactions");
        const client = fakeClient();
        const room = client.getRoom("!room:x")!;
        room.relations = {
            getChildEventsForEvent: () => ({ getAnnotationsBySender: () => ({ "@me:x": new Set([reaction("same"), reaction("old", true)]) }) }),
        };
        await expect(sendReaction(client, "!room:x", "$msg", "same")).rejects.toBeInstanceOf(DuplicateReactionError);
        expect(client.sendEvent).not.toHaveBeenCalled();
        // A redacted (removed) reaction can be made again.
        await sendReaction(client, "!room:x", "$msg", "old");
        expect(client.sendEvent).toHaveBeenCalledTimes(1);
    });

    it("drops the failed local echo, so Element shows no 'not sent' banner", async () => {
        const { sendReaction } = await import("./reactions");
        const client = fakeClient(vi.fn(async () => Promise.reject(Object.assign(new Error("boom"), { errcode: "M_UNKNOWN" }))));
        const echo = reaction("lol");
        const other = { ...reaction("x"), getType: () => "m.room.message" };
        client.getRoom("!room:x")!.getPendingEvents = () => [echo, other];
        client.cancelPendingEvent = vi.fn();
        await expect(sendReaction(client, "!room:x", "$msg", "lol")).rejects.toThrow("boom");
        expect(client.cancelPendingEvent).toHaveBeenCalledTimes(1);
        expect(client.cancelPendingEvent).toHaveBeenCalledWith(echo);
    });
});

describe("helpers", () => {
    it("normalises and finds the event's room", () => {
        expect(normaliseReaction(" a \n b ")).toBe("a b");
        const client = fakeClient();
        expect(findRoomOfEvent(client, "$msg", "#/room/#room:x")).toBe("!room:x");
        expect(findRoomOfEvent(client, "$msg", "#/home")).toBe("!room:x");
        expect(findRoomOfEvent(client, "$other", "#/room/!room:x")).toBeUndefined();
    });
});
