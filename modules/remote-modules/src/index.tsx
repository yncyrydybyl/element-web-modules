import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";

import { P, translations } from "./i18n";
import { fetchSource, getSdkClient, runModule, type Importer, type ModuleStatus } from "./loader";
import { SettingsInjector } from "./settingsInjector";
import { readLocalDisabledServer, RemoteModuleStore, serverModuleKey } from "./store";
import { nameFromSource, RemoteModulesSection, type ModuleTranslate, type SectionController, type ServerModule } from "./ui/RemoteModulesSection";
import css from "./ui/section.css?inline";

export const CONFIG_KEY = "de.datanauten.remote_modules";
const STYLE_ID = "de-datanauten-remote-modules-style";

/** A text in one language, or by language code (`en`, `de`, …). */
export type Localised<T> = T | Record<string, T>;

/** What the tab says about one of the server's modules. */
export interface ModuleAboutConfig {
    /** One or two sentences: what it does. */
    description?: Localised<string>;
    /** How to use it, one line each (e.g. "Ctrl+I: open the map"). */
    usage?: Localised<string[]>;
    /** Where to read more, e.g. its README. */
    link?: string;
}

export interface RemoteModulesConfig {
    /** Matrix IDs that may add and run remote modules. Everyone else can only turn the server's modules off. */
    allowed_users: string[];
    /** By module name: the directory of its `index.js` (`space-room-map` for `/element-modules/space-room-map/index.js`). */
    about: Record<string, ModuleAboutConfig>;
}

declare module "@element-hq/element-web-module-api" {
    export interface Config {
        [CONFIG_KEY]?: Partial<RemoteModulesConfig>;
    }
}

export function parseConfig(value: unknown): RemoteModulesConfig {
    const raw = (value ?? {}) as { allowed_users?: unknown; about?: unknown };
    if (typeof raw !== "object") throw new Error("expected an object");
    const users = raw.allowed_users ?? [];
    if (!Array.isArray(users) || !users.every((u) => typeof u === "string" && /^@[^:]+:.+$/.test(u))) {
        throw new Error("allowed_users must be a list of Matrix IDs like @alice:example.org");
    }
    const about = raw.about ?? {};
    if (typeof about !== "object" || Array.isArray(about)) throw new Error("about must be an object, by module name");
    return { allowed_users: users, about: about as Record<string, ModuleAboutConfig> };
}

/** Picks the user's language from a {@link Localised} value: `de-AT`, then `de`, then `en`, then any. */
export function localise<T>(value: Localised<T> | undefined, language: string, isValue: (v: unknown) => v is T): T | undefined {
    if (value === undefined || isValue(value)) return value;
    if (typeof value !== "object" || value === null) return undefined;
    const byLang = value as Record<string, unknown>;
    const found = [language, language.split("-")[0], "en", ...Object.keys(byLang)].map((l) => byLang[l]).find(isValue);
    return found;
}

const isString = (v: unknown): v is string => typeof v === "string";
const isStrings = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

/** `?remote_modules=off` (before or after the #) starts Element without remote modules. */
export function isSafeMode(location: Pick<Location, "search" | "hash"> = window.location): boolean {
    const query = [location.search, location.hash.split("?")[1] ?? ""].join("&");
    return new URLSearchParams(query.replace(/^\?/, "")).get("remote_modules") === "off";
}

/**
 * Takes the user's turned-off modules out of Element's own `modules` list, so Element never imports them.
 *
 * Element imports the config's modules one after another and constructs each before importing the
 * next (`loadPlugins` in vector/init.tsx), iterating the very array this gets from the config. So
 * entries after this module's own can still be dropped; the ones before it are already running.
 * Returns the keys of the dropped entries.
 */
export function skipDisabledServerModules(modules: string[] | undefined, ownUrl: string, disabled: readonly string[]): Set<string> {
    const skipped = new Set<string>();
    if (!modules || !disabled.length) return skipped;
    const own = modules.findIndex((src) => serverModuleKey(src) === serverModuleKey(ownUrl));
    if (own < 0) return skipped;
    for (let i = modules.length - 1; i > own; i--) {
        const key = serverModuleKey(modules[i]);
        if (!disabled.includes(key)) continue;
        modules.splice(i, 1);
        skipped.add(key);
    }
    return skipped;
}

export class RemoteModulesModule implements Module {
    // 2.0.0 is the first release with `client.accountData` and `createRoot` as used here.
    public static readonly moduleApiVersion = "^2.0.0";

    private config!: RemoteModulesConfig;
    private store?: RemoteModuleStore;
    private injector?: SettingsInjector;
    private readonly statuses = new Map<string, ModuleStatus>();
    /** Modules running in this page; they stay until Element reloads. */
    private readonly active = new Set<string>();
    private readonly listeners = new Set<() => void>();
    private version = 0;
    private unsubscribeStore?: () => void;
    private readonly safeMode = isSafeMode();
    /** config.json's modules as the server lists them, before turned-off ones were dropped. */
    private readonly serverModules: readonly string[];
    /** Index of this module in {@link serverModules}: it and the ones before it can't be turned off. */
    private readonly ownIndex: number;
    /** Server modules not loaded in this page. */
    private readonly skipped: ReadonlySet<string>;
    private allowed = false;

    public constructor(
        private readonly api: Api,
        private readonly importer?: Importer,
        ownUrl: string = import.meta.url,
    ) {
        const modules = api.config.get("modules");
        this.serverModules = [...(modules ?? [])];
        this.ownIndex = this.serverModules.findIndex((src) => serverModuleKey(src) === serverModuleKey(ownUrl));
        // Before load(): Element imports the next module as soon as this constructor returns.
        this.skipped = skipDisabledServerModules(modules, ownUrl, readLocalDisabledServer());
    }

    public async load(): Promise<void> {
        try {
            this.config = parseConfig(this.api.config.get(CONFIG_KEY));
        } catch (e) {
            console.error(`[remote-modules] Invalid "${CONFIG_KEY}" config`, e);
            throw new Error(`Errors in module configuration for the remote modules module`);
        }
        this.api.i18n.register(translations);
        injectStyle();
        // Don't hold up Element's startup: modules load once the user is logged in.
        void this.start();
    }

    /** Resolves when the user is known and their enabled modules have been started. */
    public ready?: Promise<void>;

    /** Removes listeners. Element never unloads modules; this exists for tests. */
    public dispose(): void {
        this.unsubscribeStore?.();
        this.store?.stop();
        this.injector?.stop();
    }

    private start(): Promise<void> {
        this.ready = (async () => {
            this.store = new RemoteModuleStore(this.api);
            await this.store.start();
            const userId = getSdkClient()?.getUserId() ?? this.api.profile?.value?.userId;
            this.allowed = !!userId && this.config.allowed_users.includes(userId);
            this.injector = new SettingsInjector((container) => this.mountSection(container), () => this.t(`${P}title`));
            this.injector.start();
            if (!this.allowed) return;
            this.unsubscribeStore = this.store.subscribe(() => void this.sync());
            await this.sync();
        })().catch((e) => console.error("[remote-modules] Startup failed", e));
        return this.ready;
    }

    /** Brings running modules in line with the list: loads newly enabled ones, flags the rest. */
    private async sync(): Promise<void> {
        const store = this.store!;
        const pending: Array<Promise<void>> = [];
        for (const m of store.getAll()) {
            const status = this.statuses.get(m.id);
            const apiVersion = status && "apiVersion" in status ? status.apiVersion : undefined;
            if (!m.enabled) {
                this.setStatus(m.id, this.active.has(m.id) ? { state: "reload", apiVersion } : { state: "disabled" });
            } else if (this.active.has(m.id)) {
                if (status?.state === "reload") this.setStatus(m.id, { state: "loaded", apiVersion });
            } else if (!this.safeMode && status?.state !== "loading" && status?.state !== "failed") {
                pending.push(this.loadOne(m.id));
            }
        }
        await Promise.all(pending);
    }

    private async loadOne(id: string): Promise<void> {
        const entry = this.store!.getAll().find((m) => m.id === id);
        if (!entry) return;
        this.setStatus(id, { state: "loading" });
        try {
            const code = await fetchSource(entry.source, getSdkClient());
            const { apiVersion } = await runModule(code, this.api, this.importer);
            this.active.add(id);
            this.setStatus(id, { state: "loaded", apiVersion });
            console.info(`[remote-modules] Loaded ${entry.name} from ${entry.source}`);
        } catch (e) {
            const error = e instanceof Error ? e.message : String(e);
            console.error(`[remote-modules] ${entry.name} (${entry.source}) failed`, e);
            this.setStatus(id, { state: "failed", error });
        }
    }

    private setStatus(id: string, status: ModuleStatus): void {
        this.statuses.set(id, status);
        this.version++;
        for (const l of this.listeners) l();
    }

    private getServerModules(): ServerModule[] {
        const disabled = this.store!.getDisabledServer();
        return this.serverModules.map((src, i) => {
            const key = serverModuleKey(src);
            const about = this.config.about[nameFromSource(src)];
            const language = this.api.i18n.language;
            return {
                src,
                key,
                description: localise(about?.description, language, isString),
                usage: localise(about?.usage, language, isStrings) ?? [],
                link: about?.link && /^https:\/\//.test(about.link) ? about.link : undefined,
                enabled: !disabled.includes(key), running: !this.skipped.has(key), locked: i <= this.ownIndex || this.ownIndex < 0 };
        });
    }

    private controller: SectionController = {
        subscribe: (listener) => {
            this.listeners.add(listener);
            const unsubscribe = this.store!.subscribe(() => {
                this.version++;
                listener();
            });
            return () => {
                this.listeners.delete(listener);
                unsubscribe();
            };
        },
        getModules: () => this.store!.getAll(),
        isActive: (id) => this.active.has(id),
        getStatus: (id) => this.statuses.get(id),
        getVersion: () => this.version,
        getServerModules: () => this.getServerModules(),
        canLoadDynamic: () => this.allowed,
        needsReload: () => [...this.active].some((id) => !this.store!.getAll().some((m) => m.id === id && m.enabled)),
        safeMode: this.safeMode,
        add: async (source, name) => {
            await this.store!.add(source, name);
        },
        upload: async (file) => {
            const client = getSdkClient();
            if (!client) throw new Error("Not logged in");
            const { content_uri } = await client.uploadContent(file, { name: file.name, type: "text/javascript", includeFilename: true });
            await this.store!.add(content_uri, file.name.replace(/\.m?js$/, ""));
        },
        setEnabled: (id, enabled) => this.store!.update(id, { enabled }),
        setServerEnabled: (key, enabled) => this.store!.setServerEnabled(key, enabled),
        remove: async (id) => {
            await this.store!.remove(id);
            this.statuses.delete(id);
            this.version++;
            for (const l of this.listeners) l();
        },
        reload: async (id) => {
            if (this.active.has(id)) this.controller.reloadElement();
            else await this.loadOne(id);
        },
        reloadElement: () => window.location.reload(),
    };

    private t: ModuleTranslate = (key, variables) => this.api.i18n.translate(key, variables);

    private mountSection(container: HTMLElement): () => void {
        const root = this.api.createRoot(container);
        root.render(<RemoteModulesSection controller={this.controller} t={this.t} />);
        return () => root.unmount();
    }
}

function injectStyle(): void {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
}

export default RemoteModulesModule satisfies ModuleFactory;
