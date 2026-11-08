import type { Api, Watchable } from "@element-hq/element-web-module-api";

/** Account data event type holding the user's remote module list, so it follows them to every device. */
export const ACCOUNT_DATA_TYPE = "de.datanauten.remote_modules";
const LOCAL_STORAGE_KEY = "de.datanauten.remote_modules.list";
const ATTACH_RETRY_MS = 1000;

export interface RemoteModuleEntry {
    id: string;
    /** mxc://, https:// or http://localhost URL of a single-file ES module build. */
    source: string;
    name: string;
    enabled: boolean;
}

interface StoredContent {
    version: 1;
    modules: RemoteModuleEntry[];
    /** config.json modules the user turned off, by {@link serverModuleKey}. */
    disabled_server?: string[];
}

interface LocalCopy extends StoredContent {
    /** Whose list this is: Element keeps the logged-in user in `mx_user_id`. */
    user?: string;
}

/** A config.json module URL without its query (`?v=<hash>` changes with every build). */
export function serverModuleKey(src: string): string {
    try {
        const url = new URL(src, window.location.href);
        return url.origin === window.location.origin ? url.pathname : `${url.origin}${url.pathname}`;
    } catch {
        return src.split(/[?#]/)[0];
    }
}

/** The server modules this browser's user turned off, as last seen (readable before login). */
export function readLocalDisabledServer(): string[] {
    return readLocalCopy().disabled_server;
}

function readLocalCopy(): { modules: RemoteModuleEntry[]; disabled_server: string[] } {
    try {
        const local = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? "null") as LocalCopy | null;
        // Someone else's list, from before a logout: ignore it.
        if (local?.user && local.user !== localStorage.getItem("mx_user_id")) return parse(null);
        return parse(local);
    } catch {
        return parse(null);
    }
}

export function isValidSource(source: string): boolean {
    if (/^mxc:\/\/[^/]+\/[^/]+$/.test(source)) return true;
    try {
        const url = new URL(source);
        // Plain http only for local dev servers; browsers block it from an https page otherwise.
        return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
    } catch {
        return false;
    }
}

function parse(value: unknown): { modules: RemoteModuleEntry[]; disabled_server: string[] } {
    const { modules, disabled_server: disabled } = (value ?? {}) as Partial<StoredContent>;
    return {
        modules: Array.isArray(modules)
            ? modules
                  .filter((m): m is RemoteModuleEntry => typeof m?.id === "string" && typeof m.source === "string" && isValidSource(m.source))
                  .map((m) => ({ id: m.id, source: m.source, name: typeof m.name === "string" && m.name ? m.name : m.source, enabled: m.enabled !== false }))
            : [],
        disabled_server: Array.isArray(disabled) ? disabled.filter((k): k is string => typeof k === "string") : [],
    };
}

/**
 * The user's remote modules. Same pattern as the other modules' stores: a localStorage copy
 * for an immediate value at startup, account data once a client exists (which then wins).
 */
export class RemoteModuleStore {
    private modules: RemoteModuleEntry[];
    private disabledServer: string[];
    private readonly listeners = new Set<() => void>();
    private watchable?: Watchable<unknown>;
    private retryTimer?: ReturnType<typeof setInterval>;

    public constructor(private readonly api: Pick<Api, "client">) {
        ({ modules: this.modules, disabled_server: this.disabledServer } = readLocalCopy());
    }

    /** Resolves once account data is attached (i.e. the user is logged in). */
    public start(): Promise<void> {
        return new Promise((resolve) => {
            if (this.tryAttach()) return resolve();
            this.retryTimer = setInterval(() => {
                if (!this.tryAttach()) return;
                clearInterval(this.retryTimer);
                resolve();
            }, ATTACH_RETRY_MS);
        });
    }

    public stop(): void {
        clearInterval(this.retryTimer);
        this.watchable?.unwatch(this.onRemote);
    }

    public getAll(): readonly RemoteModuleEntry[] {
        return this.modules;
    }

    public getDisabledServer(): readonly string[] {
        return this.disabledServer;
    }

    public subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    public async add(source: string, name: string): Promise<RemoteModuleEntry> {
        const entry: RemoteModuleEntry = { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, source, name, enabled: true };
        await this.replace([...this.modules, entry]);
        return entry;
    }

    public async update(id: string, changes: Partial<Pick<RemoteModuleEntry, "enabled" | "name">>): Promise<void> {
        await this.replace(this.modules.map((m) => (m.id === id ? { ...m, ...changes } : m)));
    }

    public async remove(id: string): Promise<void> {
        await this.replace(this.modules.filter((m) => m.id !== id));
    }

    /** `key`: see {@link serverModuleKey}. */
    public async setServerEnabled(key: string, enabled: boolean): Promise<void> {
        const rest = this.disabledServer.filter((k) => k !== key);
        await this.replace(this.modules, enabled ? rest : [...rest, key]);
    }

    private async replace(next: RemoteModuleEntry[], disabledServer = this.disabledServer): Promise<void> {
        this.apply(next, disabledServer);
        if (!this.watchable) return;
        const content: StoredContent = { version: 1, modules: next, disabled_server: disabledServer };
        await this.api.client.accountData.set(ACCOUNT_DATA_TYPE, content);
    }

    private apply(next: RemoteModuleEntry[], disabledServer: string[]): void {
        this.modules = next;
        this.disabledServer = disabledServer;
        try {
            const local: LocalCopy = { version: 1, modules: next, disabled_server: disabledServer, user: localStorage.getItem("mx_user_id") ?? undefined };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
        } catch {
            // Storage may be unavailable (private mode); the in-memory value still works.
        }
        for (const listener of this.listeners) listener();
    }

    private onRemote = (value: unknown): void => {
        const { modules, disabled_server } = parse(value);
        this.apply(modules, disabled_server);
    };

    private tryAttach(): boolean {
        if (this.watchable) return true;
        try {
            // Throws until the user is logged in (MatrixClientPeg.safeGet()).
            this.watchable = this.api.client.accountData.get(ACCOUNT_DATA_TYPE);
        } catch {
            return false;
        }
        this.watchable.watch(this.onRemote);
        if (this.watchable.value !== undefined) this.onRemote(this.watchable.value);
        return true;
    }
}
