import { describe, expect, it } from "vitest";
import type { IWidget } from "matrix-widget-api";
import { parseConfig } from "../src/config";
import { STORE_CAPABILITIES, addWidgetCommand, buildWidgetContent, findStoreWidget, newWidgetId, planClick } from "../src/store";

const cfg = parseConfig(undefined);
const w = (id: string, url: string): IWidget => ({ id, url, type: "m.custom", creatorUserId: "@a:x" });
const store = w("s", "https://marcade.store/apps/de.minagawa.marcade-store/0.1.0/");
const other = w("o", "https://marcade.store/apps/de.minagawa.pdf-viewer/0.1.0/");

describe("state event content", () => {
  it("is what /addwidget writes, plus id and creatorUserId", () => {
    expect(buildWidgetContent({ url: cfg.widgetUrl, userId: "@alice:opendesk.test", id: "marcade_store_1" })).toEqual({
      type: "m.custom",
      url: "https://marcade.store/apps/de.minagawa.marcade-store/0.1.1/#/?theme=$org.matrix.msc2873.client_theme&lang=$org.matrix.msc2873.client_language&client=$org.matrix.msc2873.client_id&roomId=$matrix_room_id&userId=$matrix_user_id",
      name: "Marcade Store",
      data: {},
      id: "marcade_store_1",
      creatorUserId: "@alice:opendesk.test",
    });
  });
  it("widget ids are unique", () => {
    expect(newWidgetId(42)).toBe("marcade_store_42");
    expect(newWidgetId(42, new Set(["marcade_store_42", "marcade_store_42_2"]))).toBe("marcade_store_42_3");
  });
  it("addwidget line", () => {
    expect(addWidgetCommand(cfg)).toBe(`/addwidget ${cfg.widgetUrl}`);
    expect(addWidgetCommand(cfg)).not.toMatch(/\s.*\s/);
  });
  it("capabilities are exactly the store's list", () => {
    expect(STORE_CAPABILITIES).toHaveLength(6);
    expect(STORE_CAPABILITIES).toContain("org.matrix.msc4039.upload_file");
  });
});

describe("planClick", () => {
  it("finds the store among other widgets, any version", () => {
    expect(findStoreWidget([other, store], cfg)).toBe(store);
    expect(findStoreWidget([other], cfg)).toBeUndefined();
  });
  it("(a) opens an existing store whatever the permissions", () => {
    for (const can of [true, false, undefined]) expect(planClick([other, store], can, cfg)).toEqual({ kind: "open", widget: store });
  });
  it("(b) adds when allowed, (c) asks a moderator when not, (d) composer without client", () => {
    expect(planClick([other], true, cfg).kind).toBe("add");
    expect(planClick([], false, cfg).kind).toBe("ask_moderator");
    expect(planClick([], undefined, cfg).kind).toBe("composer");
  });
});
