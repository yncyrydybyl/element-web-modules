import type { IWidget } from "matrix-widget-api";
import { urlHasPrefix, type ModuleConfig } from "./config";

/** Legacy room widget state type; Element reads and writes only this one (element-web#13111). */
export const WIDGET_EVENT_TYPE = "im.vector.modular.widgets";

/**
 * Capabilities the Marcade Store widget requests (catalog-entry/de.minagawa.marcade-store/metadata.yml and
 * REQUESTED_CAPABILITIES in its src/lib/host.svelte.ts). Only these are ever auto-approved.
 */
export const STORE_CAPABILITIES: readonly string[] = [
  "org.matrix.msc2762.receive.state_event:im.vector.modular.widgets",
  "org.matrix.msc2762.receive.state_event:m.widget",
  "org.matrix.msc2762.receive.state_event:io.element.widgets.layout",
  "org.matrix.msc2762.send.state_event:im.vector.modular.widgets",
  "org.matrix.msc2762.send.state_event:io.element.widgets.layout",
  "org.matrix.msc4039.upload_file",
];

export const STORE_WIDGET_NAME = "Marcade Store";

/** The first store widget in a room's widget list (URL under the store prefix). */
export function findStoreWidget<W extends Pick<IWidget, "url">>(widgets: readonly W[], cfg: Pick<ModuleConfig, "storePrefix">): W | undefined {
  return widgets.find((w) => urlHasPrefix(w.url, cfg.storePrefix));
}

/** State key / widget id of a new store widget; never one already in use. */
export function newWidgetId(now: number, taken: ReadonlySet<string> = new Set()): string {
  let id = `marcade_store_${now}`;
  for (let i = 2; taken.has(id); i++) id = `marcade_store_${now}_${i}`;
  return id;
}

export interface StoreWidgetContent {
  type: "m.custom";
  url: string;
  name: string;
  data: Record<string, unknown>;
  id: string;
  creatorUserId: string;
}

/**
 * Content of the `im.vector.modular.widgets` state event, as Element's `/addwidget` writes it
 * (SlashCommands.tsx → WidgetUtils.setRoomWidget: `type` = WidgetType.CUSTOM.legacy "m.custom", url, name, data {}),
 * plus `id` and `creatorUserId` from the widget event spec (Element's setUserWidget and the Widget API write
 * those too). The URL is used verbatim: Element appends nothing; the `$matrix_*` template is part of it.
 * No `io.element.widgets.layout` is written, because `/addwidget` writes none.
 */
export function buildWidgetContent(o: { url: string; userId: string; id: string; name?: string }): StoreWidgetContent {
  return { type: "m.custom", url: o.url, name: o.name ?? STORE_WIDGET_NAME, data: {}, id: o.id, creatorUserId: o.userId };
}

/** The `/addwidget` line a moderator can send (or the user, in the composer fallback). */
export const addWidgetCommand = (cfg: Pick<ModuleConfig, "widgetUrl">) => `/addwidget ${cfg.widgetUrl}`;

export type ClickPlan =
  | { kind: "open"; widget: IWidget }
  | { kind: "add" }
  | { kind: "ask_moderator" }
  | { kind: "composer" }
  | { kind: "show_command" };

/**
 * What a click on the Apps button does.
 *  - store widget in the room → open it (a)
 *  - no client access (future Element without `mxMatrixClientPeg`) → put `/addwidget …` into the composer (d),
 *    or show it in a dialog when hide_integrations switched Element's /addwidget off
 *  - may send widget state → add it, then open (b)
 *  - otherwise → explain that a moderator has to add it (c)
 * `canSend` is undefined when the client is not reachable.
 */
export function planClick(
  widgets: readonly IWidget[],
  canSend: boolean | undefined,
  cfg: Pick<ModuleConfig, "storePrefix" | "hideIntegrations">,
): ClickPlan {
  const widget = findStoreWidget(widgets, cfg);
  if (widget) return { kind: "open", widget };
  // hide_integrations also disables Element's /addwidget (SlashCommands: isEnabled checks AddIntegrations), so the
  // composer line would be an unknown command: show it in a dialog instead, for a client that has the command
  if (canSend === undefined) return cfg.hideIntegrations ? { kind: "show_command" } : { kind: "composer" };
  return canSend ? { kind: "add" } : { kind: "ask_moderator" };
}
