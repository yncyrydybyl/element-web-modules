import { useSyncExternalStore, type JSX } from "react";
import type { Root } from "react-dom/client";
import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { AvatarCache } from "./avatars";
import { translations } from "./i18n";
import { buildFlatGraph, buildGraph, currentRoomId, getSdkClient, updateCounts, type RoomGraph, type SdkClient } from "./rooms";
import { SettingsStore } from "./settings";
import { SettingsInjector } from "./settingsInjector";
import { comboLabel, matchesCombo, parseCombo, type Combo } from "./trigger";
import { prefersReducedMotion, type SavedCamera } from "./ui/camera";
import { MAP_VIEWS, MapOverlay, type MapView, type ModuleTranslate } from "./ui/MapOverlay";
import css from "./ui/map.css?inline";
import { SettingsSection } from "./ui/SettingsSection";
import { UsageTracker } from "./usage";

export const CONFIG_KEY = "de.datanauten.space_room_map";
const STYLE_ID = "de-datanauten-space-room-map-style";
const LEGEND_STORAGE_KEY = "de.datanauten.space_room_map.legend";
const VIEW_STORAGE_KEY = "de.datanauten.space_room_map.view";
/** Live updates: at most this often, however busy the account. */
const LIVE_MS = 400;

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
    // 2.0.0 is the first release with `navigation.openRoom`, `createRoot` and `client.accountData` as used here.
    public static readonly moduleApiVersion = "^2.0.0";

    private config!: SpaceRoomMapConfig;
    private trigger!: Combo;
    private usage!: UsageTracker;
    private settings!: SettingsStore;
    private settingsInjector?: SettingsInjector;
    private unsubscribeSettings?: () => void;
    private container?: HTMLElement;
    private root?: Root;
    /** The map as built when it was last opened; kept, hidden, between openings with "Keep the map ready". */
    private built?: { graph: RoomGraph; signature: string };
    private visible = false;
    private openNonce = 0;
    private countsVersion = 0;
    private stopLive?: () => void;
    /**
     * Where each map's camera was, so after opening a room the map comes back the same. Kept for
     * this page only: after a reload rooms may have moved.
     */
    private readonly cameras: Partial<Record<MapView, SavedCamera>> = {};
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
        this.settings = new SettingsStore(this.api);
        this.settings.start();
        this.unsubscribeSettings = this.settings.subscribe(this.onSettingsChange);
        this.settingsInjector = new SettingsInjector(
            (container) => this.mountSettings(container),
            () => this.api.i18n.translate("common|spaces"),
        );
        this.settingsInjector.start();
        window.addEventListener("keydown", this.onKeyDown, { capture: true });
    }

    /** Removes all listeners. Element never unloads modules; this exists for tests and hot reload. */
    public dispose(): void {
        this.teardown();
        window.removeEventListener("keydown", this.onKeyDown, { capture: true });
        this.usage?.stop();
        this.unsubscribeSettings?.();
        this.settings?.stop();
        this.settingsInjector?.stop();
        this.avatars?.cache.dispose();
        this.avatars = undefined;
    }

    public isOpen(): boolean {
        return this.visible;
    }

    public open(): void {
        if (this.visible) return;
        const started = performance.now();
        const client = getSdkClient();
        const graph = client ? buildGraph(client) : buildFlatGraph(this.api);
        if (client && this.avatars?.client !== client) {
            // A new client means a new login; the old one's avatars may not be this user's to see.
            this.teardown();
            this.avatars?.cache.dispose();
            this.avatars = { client, cache: new AvatarCache(client, () => this.settings.get().cacheAvatars) };
        }
        this.restoreFocus = document.activeElement as HTMLElement | null;
        const signature = graphSignature(graph);
        // Same rooms in the same places: show the kept map with today's counts.
        const reuse = Boolean(this.root && this.built?.signature === signature);
        if (reuse) {
            if (copyCounts(this.built!.graph, graph)) this.countsVersion++;
            this.openNonce++;
        } else {
            this.teardown();
            this.built = { graph, signature };
            this.container = document.createElement("div");
            this.container.className = "de-datanauten-space-room-map";
            document.body.appendChild(this.container);
            // Keys typed in the map must not reach Element's document-level shortcut handlers.
            this.container.addEventListener("keydown", (ev) => ev.stopPropagation());
            this.root = this.api.createRoot(this.container);
        }
        this.container!.hidden = false;
        this.visible = true;
        this.render();
        this.startLive(client);
        // Once the browser has painted it: how long Ctrl+I took, to compare reused and rebuilt maps.
        requestAnimationFrame(() =>
            requestAnimationFrame(() =>
                console.debug(`[space-room-map] Opened in ${Math.round(performance.now() - started)} ms (${reuse ? "kept" : "built"}, ${graph.rooms.size} rooms)`),
            ),
        );
    }

    public close(): void {
        if (!this.visible) return;
        this.visible = false;
        this.stopLive?.();
        this.stopLive = undefined;
        if (this.settings.get().keepReady && this.root) {
            this.container!.hidden = true;
            this.render();
        } else {
            this.teardown();
        }
        this.restoreFocus?.focus?.();
        this.restoreFocus = undefined;
    }

    /** Throws the map away, kept or not. */
    private teardown(): void {
        this.stopLive?.();
        this.stopLive = undefined;
        this.root?.unmount();
        this.container?.remove();
        this.root = undefined;
        this.container = undefined;
        this.built = undefined;
        this.visible = false;
    }

    private render(): void {
        if (!this.root || !this.built) return;
        this.root.render(<this.App graph={this.built.graph} visible={this.visible} openNonce={this.openNonce} countsVersion={this.countsVersion} />);
    }

    /** While the map is open: new unread counts after every sync, at most every LIVE_MS. */
    private startLive(client: SdkClient | undefined): void {
        this.stopLive?.();
        this.stopLive = undefined;
        if (!client?.on || !this.settings.get().live) return;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const update = (): void => {
            timer = undefined;
            if (!this.visible || !this.built) return;
            if (updateCounts(this.built.graph, client)) {
                this.countsVersion++;
                this.render();
            }
        };
        const onSync = (): void => void (timer ??= setTimeout(update, LIVE_MS));
        client.on("sync", onSync);
        this.stopLive = () => {
            clearTimeout(timer);
            client.removeListener?.("sync", onSync);
        };
    }

    private onSettingsChange = (): void => {
        const s = this.settings.get();
        if (!s.cacheAvatars) void AvatarCache.clearPersisted();
        if (!this.visible) {
            // A map kept hidden goes when it's no longer wanted.
            if (!s.keepReady) this.teardown();
            return;
        }
        if (s.live && !this.stopLive) this.startLive(getSdkClient());
        else if (!s.live) {
            this.stopLive?.();
            this.stopLive = undefined;
        }
        this.render();
    };

    private onKeyDown = (ev: KeyboardEvent): void => {
        if (ev.isComposing || ev.defaultPrevented || !matchesCombo(ev, this.trigger)) return;
        // Ctrl+I is also "italic" in Element's composer: keep that working on selected text.
        if (!this.visible && isEditable(ev.target) && hasSelectedText()) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        if (this.visible) this.close();
        else this.open();
    };

    private openRoom(roomId: string): void {
        this.close();
        this.api.navigation.openRoom(roomId);
    }

    private mountSettings(container: HTMLElement): () => void {
        const root = this.api.createRoot(container);
        root.render(<SettingsSection store={this.settings} t={this.t} triggerLabel={comboLabel(this.trigger)} />);
        return () => root.unmount();
    }

    private t: ModuleTranslate = (key, variables) => this.api.i18n.translate(key, variables);

    private usageScore = (roomId: string): number => this.usage.score(roomId);

    private App = ({ graph, visible, openNonce, countsVersion }: { graph: RoomGraph; visible: boolean; openNonce: number; countsVersion: number }): JSX.Element => {
        const avatars = this.avatars?.cache;
        const avatarVersion = useSyncExternalStore(
            (cb) => avatars?.subscribe(cb) ?? (() => {}),
            () => avatars?.getVersion() ?? 0,
        );
        const settings = useSyncExternalStore(this.settings.subscribe, this.settings.get);
        return (
            <MapOverlay
                graph={graph}
                current={currentRoomId(graph)}
                legendOpen={readStored(LEGEND_STORAGE_KEY) !== "closed"}
                view={MAP_VIEWS.find((v) => v === readStored(VIEW_STORAGE_KEY)) ?? "circles"}
                avatars={avatars}
                avatarVersion={avatarVersion}
                usage={this.usageScore}
                triggerLabel={comboLabel(this.trigger)}
                t={this.t}
                colours={settings.colours}
                animate={settings.animations && !prefersReducedMotion()}
                live={settings.live}
                visible={visible}
                openNonce={openNonce}
                countsVersion={countsVersion}
                onLegendToggle={(open) => writeStored(LEGEND_STORAGE_KEY, open ? "open" : "closed")}
                onViewChange={(view) => writeStored(VIEW_STORAGE_KEY, view)}
                cameras={this.cameras}
                onCameraChange={(view, camera) => (this.cameras[view] = camera)}
                onOpen={(id) => this.openRoom(id)}
                onClose={() => this.close()}
            />
        );
    };
}

/**
 * What the map's layout depends on: rooms, their names, kinds, avatars and places in spaces, and
 * the theme the canvas colours were read from. Unread counts aren't in it; they update in place.
 */
export function graphSignature(graph: RoomGraph): string {
    // Element puts its theme class on <body>; Compound's on <html>.
    const parts: string[] = [document.documentElement.className, document.body.className, String(typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches)];
    for (const r of graph.rooms.values()) {
        // Member counts only change a room's size a little: in steps, so a join doesn't rebuild the map.
        parts.push(`${r.id}\t${r.kind}\t${r.name}\t${r.avatar ?? ""}\t${r.invite}\t${Math.round(Math.log10(1 + r.members) * 4)}\t${r.children.join(",")}`);
    }
    return parts.join("\n");
}

/** Takes unread counts from `next` into `kept`. Whether any changed. */
export function copyCounts(kept: RoomGraph, next: RoomGraph): boolean {
    let changed = false;
    for (const [id, r] of kept.rooms) {
        const n = next.rooms.get(id);
        if (!n || (n.unread === r.unread && n.highlight === r.highlight && n.lastActive === r.lastActive)) continue;
        r.unread = n.unread;
        r.highlight = n.highlight;
        r.lastActive = n.lastActive;
        changed = true;
    }
    return changed;
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

/** Per-device UI choices (the legend, the view). */
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
