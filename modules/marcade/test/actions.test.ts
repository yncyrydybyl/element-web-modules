import { describe, expect, it, vi } from "vitest";
import type { IWidget } from "matrix-widget-api";
import { parseConfig } from "../src/config";
import { handleClick, type Deps } from "../src/actions";
import { canSendState, getClient, isDmRoom, rightPanelStore, type ClientLike } from "../src/host";

const ROOM = "!r:opendesk.test";
const STORE_URL = "https://marcade.store/apps/de.minagawa.marcade-store/0.1.0/";

/** Fake Element: a room widget list, a layout map, a right panel and a client with power levels. */
function fake(opts: { widgets?: IWidget[]; may?: boolean; membership?: string; client?: boolean; rightPanel?: boolean; echo?: boolean; sendFails?: boolean; openIn?: "right" | "top" } = {}) {
  const widgets: IWidget[] = [...(opts.widgets ?? [])];
  const layout = new Map<string, string>();
  const panel = { open: false, card: undefined as undefined | { phase: string; state?: { widgetId?: string } } };
  const sent: { roomId: string; type: string; content: Record<string, unknown>; key: string }[] = [];
  const client: ClientLike = {
    getUserId: () => "@alice:opendesk.test",
    getRoom: (id) =>
      id === ROOM
        ? { getMyMembership: () => opts.membership ?? "join", currentState: { maySendStateEvent: (type, user) => !!opts.may && type === "im.vector.modular.widgets" && user === "@alice:opendesk.test" } }
        : null,
    sendStateEvent: async (roomId, type, content, key) => {
      if (opts.sendFails) throw new Error("M_FORBIDDEN");
      sent.push({ roomId, type, content: content as Record<string, unknown>, key });
      if (opts.echo !== false) setTimeout(() => widgets.push(content as unknown as IWidget), 5);
    },
  };
  let t = 1_700_000_000_000;
  const notes: string[] = [];
  const d: Deps = {
    cfg: parseConfig(opts.openIn ? { open_in: opts.openIn } : undefined),
    widgets: {
      getWidgetsInRoom: () => [...widgets],
      isAppInContainer: (w, c) => (layout.get(w.id) ?? "right") === c,
      moveAppToContainer: (w, c) => void layout.set(w.id, c),
    },
    client: () => (opts.client === false ? undefined : client),
    rightPanel: () =>
      opts.rightPanel === false
        ? undefined
        : {
            // like Element's RightPanelStore.setCard: same phase with a state → only the state is updated, the
            // panel is not shown; a different phase → card replaced and panel shown
            setCard: (card) => {
              const same = panel.card?.phase === card.phase && !!card.state;
              panel.card = card;
              if (!same) panel.open = true;
            },
            show: () => void (panel.open = true),
            isOpenForRoom: () => panel.open,
            currentCardForRoom: () => panel.card,
            hide: () => void (panel.open = false),
          },
    insertIntoComposer: vi.fn(),
    askModerator: vi.fn(),
    notify: (k) => void notes.push(k),
    now: () => t,
    sleep: async (ms) => {
      t += ms;
      await new Promise((r) => setTimeout(r, 1));
    },
    waitMs: 2000,
  };
  return { d, widgets, layout, panel, sent, notes };
}

const store: IWidget = { id: "s1", url: STORE_URL, type: "m.custom", creatorUserId: "@bob:x" };

describe("(a) store already in the room", () => {
  it("opens it in the right panel, second click closes", async () => {
    const f = fake({ widgets: [store], may: false });
    expect(await handleClick(f.d, ROOM)).toBe("opened_right");
    expect(f.panel).toMatchObject({ open: true, card: { phase: "Widget", state: { widgetId: "s1" } } });
    expect(f.layout.get("s1")).toBe("right");
    expect(await handleClick(f.d, ROOM)).toBe("closed");
    expect(f.panel.open).toBe(false);
    // third click reopens (the room's card is still the widget card, setCard alone would not show the panel)
    expect(await handleClick(f.d, ROOM)).toBe("opened_right");
    expect(f.panel.open).toBe(true);
  });
  it("leaves a pinned or maximised store alone", async () => {
    const f = fake({ widgets: [store] });
    f.layout.set("s1", "top");
    expect(await handleClick(f.d, ROOM)).toBe("already_visible");
    expect(f.panel.open).toBe(false);
  });
  it("pins it to the top without the right panel store, or when configured", async () => {
    for (const o of [{ rightPanel: false }, { openIn: "top" as const }]) {
      const f = fake({ widgets: [store], ...o });
      expect(await handleClick(f.d, ROOM)).toBe("opened_top");
      expect(f.layout.get("s1")).toBe("top");
    }
  });
});

describe("(b) adding", () => {
  it("sends the widget state event, waits for the echo, opens it", async () => {
    const f = fake({ may: true });
    expect(await handleClick(f.d, ROOM)).toBe("added_opened_right");
    expect(f.sent).toHaveLength(1);
    const [s] = f.sent;
    expect(s.type).toBe("im.vector.modular.widgets");
    expect(s.key).toBe("marcade_store_1700000000000");
    expect(s.content).toMatchObject({ type: "m.custom", id: s.key, creatorUserId: "@alice:opendesk.test", name: "Marcade Store", data: {} });
    expect(f.panel.card?.state?.widgetId).toBe(s.key);
    expect(f.notes).toEqual(["adding"]);
  });
  it("reports a failed send and a missing echo", async () => {
    const f1 = fake({ may: true, sendFails: true });
    expect(await handleClick(f1.d, ROOM)).toBe("add_failed");
    expect(f1.notes).toContain("add_failed");
    const f2 = fake({ may: true, echo: false });
    expect(await handleClick(f2.d, ROOM)).toBe("add_timeout");
    expect(f2.notes).toContain("add_timeout");
  });
});

describe("(c) no permission", () => {
  it("asks a moderator with the /addwidget line, sends nothing", async () => {
    for (const o of [{ may: false }, { may: true, membership: "invite" }]) {
      const f = fake(o);
      expect(await handleClick(f.d, ROOM)).toBe("asked_moderator");
      expect(f.d.askModerator).toHaveBeenCalledWith(`/addwidget ${f.d.cfg.widgetUrl}`);
      expect(f.sent).toHaveLength(0);
    }
  });
});

describe("(d) no client access", () => {
  it("puts /addwidget into the composer", async () => {
    const f = fake({ client: false });
    expect(await handleClick(f.d, ROOM)).toBe("composer");
    expect(f.d.insertIntoComposer).toHaveBeenCalledWith(`/addwidget ${f.d.cfg.widgetUrl}`);
    expect(f.notes).toEqual(["composer_hint"]);
  });
  it("shows the line in a dialog without a composer API, or when hide_integrations disabled /addwidget", async () => {
    const f = fake({ client: false });
    f.d.insertIntoComposer = undefined;
    expect(await handleClick(f.d, ROOM)).toBe("showed_command");
    expect(f.d.askModerator).toHaveBeenCalledWith(`/addwidget ${f.d.cfg.widgetUrl}`, "manual");
    const g = fake({ client: false });
    g.d.cfg = parseConfig({ hide_integrations: true });
    expect(await handleClick(g.d, ROOM)).toBe("showed_command");
    expect(g.d.insertIntoComposer).not.toHaveBeenCalled();
  });
});

describe("host helpers", () => {
  it("getClient / rightPanelStore are feature-checked", () => {
    expect(getClient({})).toBeUndefined();
    expect(getClient({ mxMatrixClientPeg: { get: () => null } })).toBeUndefined();
    expect(getClient({ mxMatrixClientPeg: { get: () => { throw new Error("x"); } } } as never)).toBeUndefined();
    expect(rightPanelStore({ mxSdkContext: {} })).toBeUndefined();
  });
  it("canSendState: undefined without client or room", () => {
    expect(canSendState(undefined, ROOM, "t")).toBeUndefined();
    const c = { getUserId: () => "@a:x", getRoom: () => null, sendStateEvent: async () => ({}) };
    expect(canSendState(c, ROOM, "t")).toBeUndefined();
  });
  it("isDmRoom reads m.direct", () => {
    expect(isDmRoom(ROOM, { "@b:x": ["!o:x", ROOM] })).toBe(true);
    expect(isDmRoom(ROOM, { "@b:x": ["!o:x"] })).toBe(false);
    expect(isDmRoom(ROOM, null)).toBe(false);
  });
});
