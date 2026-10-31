import { useSyncExternalStore, type JSX } from "react";
import type { Root } from "react-dom/client";
import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { AvatarCache } from "./avatars";
import { translations } from "./i18n";
import { buildFlatGraph, buildGraph, currentRoomId, getSdkClient, type RoomGraph, type SdkClient } from "./rooms";
import { comboLabel, matchesCombo, parseCombo, type Combo } from "./trigger";
import { MapOverlay, type ModuleTranslate } from "./ui/MapOverlay";
import css from "./ui/map.css?inline";
import { UsageTracker } from "./usage";

export const CONFIG_KEY = "de.datanauten.space_room_map";
const STYLE_ID = "de-datanauten-space-room-map-style";
const LEGEND_STORAGE_KEY = "de.datanauten.space_room_map.legend";

export interface SpaceRoomMapConfig {
    /** Combo that opens and closes the map. */
    trigger_key: string;
}

export function parseConfig(value: unknown): SpaceRoomMapConfig {
    const raw = (value ?? {}) as Partial<Record<keyof SpaceRoomMapConfig, unknown>>;
    if (typeof raw !== "object") throw new Error("expected an object");
    // `default_view` from versions with several views is ignored.
    const config: SpaceRoomMapConfig = { trigger_key: "Mod+I" };
    if (raw.trigger_key !== undefined) {
        if (typeof raw.trigger_key !== "string") throw new Error("trigger_key must be a string");
        config.trigger_key = raw.trigger_key;
    }
    parseCombo(config.trigger_key);
    return config;
}

declare module "@element-hq/element-web-module-api" {
    export interface Config {
        [CONFIG_KEY]?: Partial<SpaceRoomMapConfig>;
    }
}

export class SpaceRoomMapModule implements Module {
    // 2.0.0 is the first release with `navigation.openRoom` and `createRoot` as used here.
    public static readonly moduleApiVersion = "^2.0.0";

    private config!: SpaceRoomMapConfig;
    private trigger!: Combo;
    private usage!: UsageTracker;
    private container?: HTMLElement;
    private root?: Root;
    private restoreFocus?: HTMLElement | null;
    /** Kept between openings, so avatars only load once per client. */
    private avatars?: { client: SdkClient; cache: AvatarCache };

    public constructor(private readonly api: Api) {}

    public async load(): Promise<void> {
        try {
            this.config = parseConfig(this.api.config.get(CONFIG_KEY));
        } catch (e) {
            console.error(`[space-room-map] Invalid "${CONFIG_KEY}" config`, e);
            throw new Error(`Errors in module configuration for the space room map module`);
        }
        this.trigger = parseCombo(this.config.trigger_key);
        this.api.i18n.register(translations);
        injectStyle();

        this.usage = new UsageTracker((hash) => resolveHash(hash));
        this.usage.start();
        window.addEventListener("keydown", this.onKeyDown, { capture: true });
    }

    /** Removes all listeners. Element never unloads modules; this exists for tests and hot reload. */
    public dispose(): void {
        this.close();
        window.removeEventListener("keydown", this.onKeyDown, { capture: true });
        this.usage?.stop();
        this.avatars?.cache.dispose();
        this.avatars = undefined;
    }

    public open(): void {
        if (this.root) return;
        const client = getSdkClient();
        const graph = client ? buildGraph(client) : buildFlatGraph(this.api);
        if (client && this.avatars?.client !== client) {
            // A new client means a new login; the old one's avatars may not be this user's to see.
            this.avatars?.cache.dispose();
            this.avatars = { client, cache: new AvatarCache(client) };
        }
        this.restoreFocus = document.activeElement as HTMLElement | null;
        this.container = document.createElement("div");
        this.container.className = "de-datanauten-space-room-map";
        document.body.appendChild(this.container);
        // Keys typed in the map must not reach Element's document-level shortcut handlers.
        this.container.addEventListener("keydown", (ev) => ev.stopPropagation());
        this.root = this.api.createRoot(this.container);
        this.root.render(<this.App graph={graph} />);
    }

    public close(): void {
        this.root?.unmount();
        this.container?.remove();
        this.root = undefined;
        this.container = undefined;
        this.restoreFocus?.focus?.();
        this.restoreFocus = undefined;
    }

    private onKeyDown = (ev: KeyboardEvent): void => {
        if (ev.isComposing || ev.defaultPrevented || !matchesCombo(ev, this.trigger)) return;
        // Ctrl+I is also "italic" in Element's composer: keep that working on selected text.
        if (!this.root && isEditable(ev.target) && hasSelectedText()) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        if (this.root) this.close();
        else this.open();
    };

    private openRoom(roomId: string): void {
        this.close();
        this.api.navigation.openRoom(roomId);
    }

    private t: ModuleTranslate = (key, variables) => this.api.i18n.translate(key, variables);

    private usageScore = (roomId: string): number => this.usage.score(roomId);

    private App = ({ graph }: { graph: RoomGraph }): JSX.Element => {
        const avatars = this.avatars?.cache;
        const avatarVersion = useSyncExternalStore(
            (cb) => avatars?.subscribe(cb) ?? (() => {}),
            () => avatars?.getVersion() ?? 0,
        );
        return (
            <MapOverlay
                graph={graph}
                current={currentRoomId(graph)}
                legendOpen={readStored(LEGEND_STORAGE_KEY) !== "closed"}
                avatars={avatars}
                avatarVersion={avatarVersion}
                usage={this.usageScore}
                triggerLabel={comboLabel(this.trigger)}
                t={this.t}
                onLegendToggle={(open) => writeStored(LEGEND_STORAGE_KEY, open ? "open" : "closed")}
                onOpen={(id) => this.openRoom(id)}
                onClose={() => this.close()}
            />
        );
    };
}

/** Room id for a `#/room/...` hash, resolving aliases through the SDK client. */
function resolveHash(hash: string): string | undefined {
    const match = /^#\/room\/([^/?]+)/.exec(hash);
    if (!match) return undefined;
    const idOrAlias = decodeURIComponent(match[1]);
    if (idOrAlias.startsWith("!")) return idOrAlias;
    const room = getSdkClient()
        ?.getVisibleRooms()
        .find((r) => r.getCanonicalAlias() === idOrAlias || r.getAltAliases?.().includes(idOrAlias));
    return room?.roomId;
}

function isEditable(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return target.isContentEditable || target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement;
}

function hasSelectedText(): boolean {
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
        return active.selectionStart !== active.selectionEnd;
    }
    const selection = document.getSelection();
    return Boolean(selection && !selection.isCollapsed);
}

/** Per-device UI choices (the legend). */
function readStored(key: string): string | undefined {
    try {
        return localStorage.getItem(key) ?? undefined;
    } catch {
        return undefined;
    }
}

function writeStored(key: string, value: string): void {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Not remembering it is fine.
    }
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}

export default SpaceRoomMapModule satisfies ModuleFactory;
