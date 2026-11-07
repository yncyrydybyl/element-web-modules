import { useSyncExternalStore, type JSX } from "react";
import type { Root } from "react-dom/client";
import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { AvatarCache } from "./avatars";
import { ENGLISH_NAMES, type GroupNames } from "./districts";
import { P, translations } from "./i18n";
import { buildLayout, type PeopleLayout } from "./layout";
import { buildPeople, serverOf, type PeopleClient, type PeopleData, type PeopleLabels } from "./people";
import { buildGraph, getSdkClient, type RoomGraph } from "./rooms";
import { SettingsStore } from "./settings";
import { SettingsInjector } from "./settingsInjector";
import { comboLabel, matchesCombo, parseCombo, type Combo } from "./trigger";
import { prefersReducedMotion, type SavedCamera } from "./ui/camera";
import { PeopleOverlay, SORT_ORDERS, type ModuleTranslate, type SortOrder } from "./ui/PeopleOverlay";
import css from "./ui/people.css?inline";
import { SettingsSection } from "./ui/SettingsSection";

export const CONFIG_KEY = "de.datanauten.people_map";
const STYLE_ID = "de-datanauten-people-map-style";
const LEGEND_STORAGE_KEY = "de.datanauten.people_map.legend";
const SORT_STORAGE_KEY = "de.datanauten.people_map.sort";

export interface PeopleMapConfig {
    /** Combo that opens and closes the map. */
    trigger_key: string;
}

export function parseConfig(value: unknown): PeopleMapConfig {
    const raw = (value ?? {}) as Partial<Record<keyof PeopleMapConfig, unknown>>;
    if (typeof raw !== "object") throw new Error("expected an object");
    // Alt+P: Ctrl+Shift+P is Firefox's private window, which a page can't take over.
    const config: PeopleMapConfig = { trigger_key: "Alt+P" };
    if (raw.trigger_key !== undefined) {
        if (typeof raw.trigger_key !== "string") throw new Error("trigger_key must be a string");
        config.trigger_key = raw.trigger_key;
    }
    parseCombo(config.trigger_key);
    return config;
}

declare module "@element-hq/element-web-module-api" {
    export interface Config {
        [CONFIG_KEY]?: Partial<PeopleMapConfig>;
    }
}

interface Built {
    graph: RoomGraph;
    data: PeopleData;
    layout: PeopleLayout;
}

export class PeopleMapModule implements Module {
    public static readonly moduleApiVersion = "^2.0.0";

    private config!: PeopleMapConfig;
    private trigger!: Combo;
    private settings!: SettingsStore;
    private settingsInjector?: SettingsInjector;
    private unsubscribeSettings?: () => void;
    private container?: HTMLElement;
    private root?: Root;
    private built?: Built;
    /** For this page only: after a reload people may have moved. */
    private camera?: SavedCamera;
    private restoreFocus?: HTMLElement | null;
    /** Kept between openings, so avatars only load once per client. */
    private avatars?: { client: PeopleClient; cache: AvatarCache };

    public constructor(private readonly api: Api) {}

    public async load(): Promise<void> {
        try {
            this.config = parseConfig(this.api.config.get(CONFIG_KEY));
        } catch (e) {
            console.error(`[people-map] Invalid "${CONFIG_KEY}" config`, e);
            throw new Error(`Errors in module configuration for the people map module`);
        }
        this.trigger = parseCombo(this.config.trigger_key);
        this.api.i18n.register(translations);
        injectStyle();
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
        this.close();
        window.removeEventListener("keydown", this.onKeyDown, { capture: true });
        this.unsubscribeSettings?.();
        this.settings?.stop();
        this.settingsInjector?.stop();
        this.avatars?.cache.dispose();
        this.avatars = undefined;
    }

    public isOpen(): boolean {
        return Boolean(this.root);
    }

    public open(): void {
        if (this.root) return;
        const client = getSdkClient() as PeopleClient | undefined;
        // Without Element's client there's nobody to show: the module API has no member lists.
        if (!client?.getUserId?.()) {
            console.warn("[people-map] Element's Matrix client isn't available");
            return;
        }
        const started = performance.now();
        if (this.avatars?.client !== client) {
            // A new client means a new login; the old one's avatars may not be this user's to see.
            this.avatars?.cache.dispose();
            this.avatars = { client, cache: new AvatarCache(client, () => this.settings.get().cacheAvatars) };
            this.camera = undefined;
        }
        this.built = this.build(client);
        this.restoreFocus = document.activeElement as HTMLElement | null;
        this.container = document.createElement("div");
        this.container.className = "de-datanauten-people-map";
        document.body.appendChild(this.container);
        // Keys typed in the map must not reach Element's document-level shortcut handlers.
        this.container.addEventListener("keydown", (ev) => ev.stopPropagation());
        this.root = this.api.createRoot(this.container);
        this.render();
        requestAnimationFrame(() =>
            requestAnimationFrame(() =>
                console.debug(`[people-map] Opened in ${Math.round(performance.now() - started)} ms (${this.built?.data.people.size} people, ${this.built?.graph.rooms.size} rooms)`),
            ),
        );
    }

    public close(): void {
        if (!this.root) return;
        this.root.unmount();
        this.container?.remove();
        this.root = undefined;
        this.container = undefined;
        this.built = undefined;
        this.restoreFocus?.focus?.();
        this.restoreFocus = undefined;
    }

    private build(client: PeopleClient): Built {
        const graph = buildGraph(client);
        const s = this.settings.get();
        const data = buildPeople(client, graph, { largeRooms: s.largeRooms, bots: s.bots, names: this.groupNames(), labels: this.labels() });
        const me = client.getUser?.(data.me);
        const layout = buildLayout(data, me?.displayName || this.t(`${P}you`), me?.avatarUrl || undefined);
        if (layout.graph.getNodeAttribute("me", "avatar")) this.avatars?.cache.request([layout.graph.getNodeAttribute("me", "avatar")]);
        return { graph, data, layout };
    }

    private render(): void {
        if (!this.root || !this.built) return;
        this.root.render(<this.App built={this.built} />);
    }

    private onSettingsChange = (): void => {
        const s = this.settings.get();
        if (!s.cacheAvatars) void AvatarCache.clearPersisted();
        if (!this.root) return;
        // Who is on the map depends on the settings: build it again.
        const client = this.avatars?.client;
        if (!client) return;
        this.camera = undefined;
        this.root.unmount();
        this.root = this.api.createRoot(this.container!);
        this.built = this.build(client);
        this.render();
    };

    private onKeyDown = (ev: KeyboardEvent): void => {
        if (ev.isComposing || ev.defaultPrevented || !matchesCombo(ev, this.trigger)) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        if (this.root) this.close();
        else this.open();
    };

    private openRoom(roomId: string): void {
        this.close();
        this.api.navigation.openRoom(roomId);
    }

    private openProfile(userId: string): void {
        this.close();
        void this.api.navigation.toMatrixToLink(`https://matrix.to/#/${encodeURIComponent(userId)}`);
    }

    private mountSettings(container: HTMLElement): () => void {
        const root = this.api.createRoot(container);
        root.render(<SettingsSection store={this.settings} t={this.t} triggerLabel={comboLabel(this.trigger)} />);
        return () => root.unmount();
    }

    private t: ModuleTranslate = (key, variables) => this.api.i18n.translate(key, variables);

    private groupNames(): GroupNames {
        const t = (key: string): string => this.t(`${P}group_${key}`);
        return {
            ...ENGLISH_NAMES,
            older: t("older"),
            smallGroups: t("small"),
            loose: t("loose"),
            otherSpaces: t("spaces"),
            junk: t("junk"),
            nameless: t("nameless"),
            solo: t("solo"),
        };
    }

    private labels(): PeopleLabels {
        return { dms: this.t(`${P}label_dms`), dmsOlder: this.t(`${P}label_dms_older`), other: this.t(`${P}label_other`) };
    }

    private App = ({ built }: { built: Built }): JSX.Element => {
        const avatars = this.avatars?.cache;
        const avatarVersion = useSyncExternalStore(
            (cb) => avatars?.subscribe(cb) ?? (() => {}),
            () => avatars?.getVersion() ?? 0,
        );
        const settings = useSyncExternalStore(this.settings.subscribe, this.settings.get);
        return (
            <PeopleOverlay
                data={built.data}
                layout={built.layout}
                graph={built.graph}
                myServer={serverOf(built.data.me)}
                language={this.api.i18n.language}
                sort={SORT_ORDERS.find((s) => s === readStored(SORT_STORAGE_KEY)) ?? "closeness"}
                legendOpen={readStored(LEGEND_STORAGE_KEY) === "open"}
                camera={this.camera}
                animate={settings.animations && !prefersReducedMotion()}
                avatars={avatars}
                avatarVersion={avatarVersion}
                triggerLabel={comboLabel(this.trigger)}
                t={this.t}
                onSortChange={(sort: SortOrder) => writeStored(SORT_STORAGE_KEY, sort)}
                onLegendToggle={(open) => writeStored(LEGEND_STORAGE_KEY, open ? "open" : "closed")}
                onCameraChange={(camera) => (this.camera = camera)}
                onOpenRoom={(id) => this.openRoom(id)}
                onOpenProfile={(id) => this.openProfile(id)}
                onClose={() => this.close()}
            />
        );
    };
}

/** Per-device UI choices (the legend, the sort order). */
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

export default PeopleMapModule satisfies ModuleFactory;
