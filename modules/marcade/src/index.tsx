import React from "react";
import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";
import { CONFIG_KEY, parseConfig, type ModuleConfig } from "./config";
import { canSendState, getClient, isDmRoom, rightPanelShowsWidget, rightPanelStore } from "./host";
import { handleClick, type Deps } from "./actions";
import { WIDGET_EVENT_TYPE, findStoreWidget } from "./store";
import { registerTrust } from "./trust";
import { initI18n, t } from "./i18n";
import { injectStyles, toast } from "./styles";
import { AppsButton } from "./components/AppsButton";
import { ModeratorDialog } from "./components/ModeratorDialog";

const LOG = "[marcade-element-module]";

/** Runs `fn`, logs and swallows any error: nothing in this module may break Element. */
function guard<T>(what: string, fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch (e) {
    console.warn(`${LOG} ${what} failed:`, e);
    return fallback;
  }
}

class MarcadeModule implements Module {
  // The features used are feature-checked at runtime; 1.14 is the first module API with all of them
  // (header buttons, widget API, lifecycle and shouldShowComponent arrived in 1.12, the composer API in 1.14).
  // 2.0 only removed the legacy module API, which this module never used.
  public static readonly moduleApiVersion = "^1.14.0 || ^2.0.0";
  private cfg!: ModuleConfig;

  public constructor(private readonly api: Api) {}

  public async load(): Promise<void> {
    // Listed twice (config.json "modules" + the image's /modules auto-registration) → load once.
    const g = globalThis as unknown as { __marcadeElementModule?: boolean };
    if (g.__marcadeElementModule) return console.warn(`${LOG} already loaded, skipping duplicate`);
    g.__marcadeElementModule = true;

    this.cfg = parseConfig(guard("config", () => (this.api.config.get() as unknown as Record<string, unknown>)[CONFIG_KEY], undefined));
    initI18n(this.api);
    guard("styles", () => injectStyles(), undefined);
    guard("trust", () => registerTrust(this.api, this.cfg), undefined);

    if (this.cfg.hideIntegrations) {
      guard(
        "registerShouldShowComponent",
        () =>
          this.api.customisations.registerShouldShowComponent((c) =>
            // UIComponent.AddIntegrations (a const enum, so the string itself)
            (c as string) === "UIComponent.addIntegrations" ? false : undefined,
          ),
        undefined,
      );
    }

    const extras = (this.api as Partial<Api>).extras;
    const widgetApi = (this.api as Partial<Api>).widget;
    if (typeof extras?.addRoomHeaderButtonCallback !== "function" || typeof widgetApi?.getWidgetsInRoom !== "function") {
      console.warn(`${LOG} this Element has no room header button or widget API; the Apps button is not shown`);
      return;
    }
    guard("addRoomHeaderButtonCallback", () => extras.addRoomHeaderButtonCallback((roomId) => this.renderButton(roomId)), undefined);
    console.info(`${LOG} loaded`, {
      store: this.cfg.widgetUrl,
      prefix: this.cfg.storePrefix,
      approve: this.cfg.approvePrefixes,
      client: !!getClient(),
      rightPanel: !!rightPanelStore(),
    });
  }

  private readonly deps = (): Deps => ({
    cfg: this.cfg,
    widgets: this.api.widget,
    client: () => getClient(),
    rightPanel: () => rightPanelStore(),
    insertIntoComposer:
      typeof this.api.composer?.insertPlaintextIntoComposer === "function"
        ? (text) => this.api.composer.insertPlaintextIntoComposer(text, { view: "room" })
        : undefined,
    askModerator: (command) => this.api.openDialog({ title: t("moderator_title") }, ModeratorDialog, { command }),
    notify: (key, vars) => toast(t(key, vars), key === "adding" ? 3000 : 8000),
  });

  private isDm(roomId: string): boolean {
    const fromClient = guard("m.direct", () => getClient()?.getAccountData?.("m.direct")?.getContent(), undefined);
    if (fromClient) return isDmRoom(roomId, fromClient);
    return guard("m.direct (module api)", () => isDmRoom(roomId, this.api.client?.accountData?.get("m.direct").value), false);
  }

  private storeWidget(roomId: string) {
    return guard("getWidgetsInRoom", () => findStoreWidget(this.api.widget.getWidgetsInRoom(roomId) ?? [], this.cfg), undefined);
  }

  private readonly getMode = (roomId: string): "can" | "moderator" => {
    if (this.storeWidget(roomId)) return "can";
    return canSendState(getClient(), roomId, WIDGET_EVENT_TYPE) === false ? "moderator" : "can";
  };

  private readonly isOpen = (roomId: string): boolean => {
    const w = this.storeWidget(roomId);
    const rp = rightPanelStore();
    return !!w && !!rp && rightPanelShowsWidget(rp, roomId, w.id);
  };

  /** Re-render on room state (power levels, widgets) and right panel changes. */
  private readonly subscribe = (roomId: string, cb: () => void): (() => void) => {
    const offs: (() => void)[] = [];
    const client = getClient();
    if (client?.on && client.off) {
      const onState = (ev: unknown) => {
        const e = ev as { getRoomId?: () => string };
        if (!e?.getRoomId || e.getRoomId() === roomId) cb();
      };
      guard("subscribe RoomState.events", () => client.on!("RoomState.events", onState), undefined);
      offs.push(() => guard("unsubscribe", () => client.off!("RoomState.events", onState), undefined));
    }
    const rp = rightPanelStore() as unknown as { on?: (e: string, f: () => void) => void; off?: (e: string, f: () => void) => void } | undefined;
    if (rp?.on && rp.off) {
      guard("subscribe right panel", () => rp.on!("update", cb), undefined);
      offs.push(() => guard("unsubscribe", () => rp.off!("update", cb), undefined));
    }
    return () => offs.forEach((f) => f());
  };

  private readonly onActivate = (roomId: string): Promise<unknown> =>
    handleClick(this.deps(), roomId).catch((e) => {
      console.error(`${LOG} click failed`, e);
      toast(t("add_failed", { error: (e as Error)?.message ?? String(e) }), 8000);
    });

  private renderButton(roomId: string): React.JSX.Element | undefined {
    return guard(
      "render header button",
      () => {
        if (!this.cfg.showInDms && this.isDm(roomId)) return undefined;
        return (
          <AppsButton
            key="marcade-apps"
            roomId={roomId}
            getMode={this.getMode}
            isOpen={this.isOpen}
            subscribe={this.subscribe}
            onActivate={this.onActivate}
          />
        );
      },
      undefined,
    );
  }
}

export default MarcadeModule satisfies ModuleFactory;
