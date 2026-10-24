import type { Container } from "@element-hq/element-web-module-api";
import type { IWidget } from "matrix-widget-api";
import type { ModuleConfig } from "./config";
import { canSendState, rightPanelShowsWidget, type ClientLike } from "./host";
import { WIDGET_EVENT_TYPE, addWidgetCommand, buildWidgetContent, findStoreWidget, newWidgetId, planClick } from "./store";

/** What the click handler needs from Element; real objects in index.tsx, fakes in the tests. */
export interface Deps {
  cfg: ModuleConfig;
  widgets: {
    getWidgetsInRoom(roomId: string): IWidget[];
    isAppInContainer(app: IWidget, c: Container, roomId: string): boolean;
    moveAppToContainer(app: IWidget, c: Container, roomId: string): void;
  };
  client: () => ClientLike | undefined;
  rightPanel: () =>
    | {
        setCard(card: { phase: string; state?: Record<string, unknown> }, allowClose?: boolean, roomId?: string): void;
        isOpenForRoom?(roomId: string): boolean;
        currentCardForRoom?(roomId: string): { phase?: string | null; state?: { widgetId?: string } } | undefined;
        hide?(roomId: string | null): void;
      }
    | undefined;
  insertIntoComposer?: (text: string) => void;
  askModerator: (command: string) => void;
  notify: (key: "adding" | "add_failed" | "add_timeout" | "composer_hint", vars?: Record<string, string>) => void;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  waitMs?: number;
}

export type ClickResult =
  | "opened_right"
  | "opened_top"
  | "already_visible"
  | "closed"
  | "added_opened_right"
  | "added_opened_top"
  | "add_timeout"
  | "add_failed"
  | "asked_moderator"
  | "composer"
  | "nothing";

const safeWidgets = (d: Deps, roomId: string): IWidget[] => {
  try {
    return d.widgets.getWidgetsInRoom(roomId) ?? [];
  } catch {
    return [];
  }
};

/**
 * Shows the store widget for this user.
 *  - `open_in: "right"`: unpin it if needed (`moveAppToContainer(w, "right")` — the right panel's WidgetCard pops
 *    itself for widgets that are not in the "right" container) and open its card in the right panel. A second
 *    click while that card is showing closes the panel (like Element's own header toggles).
 *    Without the right panel store (future Element), fall back to pinning it to the top.
 *  - `open_in: "top"` or fallback: pin it above the timeline (module API only).
 *  - already pinned at the top or maximised: it is on screen, leave the user's layout alone.
 */
export function openWidget(d: Deps, widget: IWidget, roomId: string, toggle = true): "opened_right" | "opened_top" | "already_visible" | "closed" {
  const w = d.widgets;
  if (w.isAppInContainer(widget, "center", roomId) || w.isAppInContainer(widget, "top", roomId)) return "already_visible";
  const rp = d.cfg.openIn === "right" ? d.rightPanel() : undefined;
  if (rp) {
    try {
      if (toggle && rp.hide && rightPanelShowsWidget(rp, roomId, widget.id)) {
        rp.hide(roomId);
        return "closed";
      }
      w.moveAppToContainer(widget, "right", roomId);
      rp.setCard({ phase: "Widget", state: { widgetId: widget.id } }, true, roomId);
      return "opened_right";
    } catch (e) {
      console.warn("[marcade-element-module] right panel failed, pinning instead", e);
    }
  }
  w.moveAppToContainer(widget, "top", roomId);
  return "opened_top";
}

/** The Apps button's click: open (a), add + open (b), ask a moderator (c) or prefill the composer (d). */
export async function handleClick(d: Deps, roomId: string): Promise<ClickResult> {
  const client = d.client();
  const plan = planClick(safeWidgets(d, roomId), canSendState(client, roomId, WIDGET_EVENT_TYPE), d.cfg);
  switch (plan.kind) {
    case "open":
      return openWidget(d, plan.widget, roomId);
    case "ask_moderator":
      d.askModerator(addWidgetCommand(d.cfg));
      return "asked_moderator";
    case "composer":
      if (!d.insertIntoComposer) return "nothing";
      d.insertIntoComposer(addWidgetCommand(d.cfg));
      d.notify("composer_hint");
      return "composer";
    case "add":
      return addAndOpen(d, client!, roomId);
  }
}

async function addAndOpen(d: Deps, client: ClientLike, roomId: string): Promise<ClickResult> {
  const now = d.now ?? Date.now;
  const sleep = d.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const id = newWidgetId(now(), new Set(safeWidgets(d, roomId).map((w) => w.id)));
  const content = buildWidgetContent({ url: d.cfg.widgetUrl, userId: client.getUserId() ?? "", id });
  d.notify("adding");
  try {
    await client.sendStateEvent(roomId, WIDGET_EVENT_TYPE, content, id);
  } catch (e) {
    d.notify("add_failed", { error: (e as Error)?.message ?? String(e) });
    return "add_failed";
  }
  // Element's WidgetStore picks the widget up from the state echo of the next sync.
  const deadline = now() + (d.waitMs ?? 15_000);
  for (;;) {
    const list = safeWidgets(d, roomId);
    const widget = list.find((w) => w.id === id) ?? findStoreWidget(list, d.cfg);
    if (widget) {
      const r = openWidget(d, widget, roomId, false);
      return r === "opened_top" ? "added_opened_top" : "added_opened_right";
    }
    if (now() >= deadline) break;
    await sleep(250);
  }
  d.notify("add_timeout");
  return "add_timeout";
}
