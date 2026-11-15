/**
 * The user's theme choice: account data `de.datanauten.theme_loader` `{theme, v}` (synced across devices) with a
 * localStorage cache so load() can apply it before Element's first render, before login and before sync.
 */
import type { Api, Watchable } from "@element-hq/element-web-module-api";
import { error, warn } from "./log";
import { lsGet, lsSet } from "./params";

export const ACCOUNT_DATA_TYPE = "de.datanauten.theme_loader";
export const CACHE_KEY = "tl.theme";

export interface StoredChoice {
    /** Variant id, or null for Element default. */
    theme: string | null;
    v: 1;
}

function parse(value: unknown): StoredChoice | undefined {
    if (!value || typeof value !== "object") return undefined;
    const t = (value as { theme?: unknown }).theme;
    if (t === null || t === undefined || t === "") return { theme: null, v: 1 };
    return typeof t === "string" ? { theme: t, v: 1 } : undefined;
}

export class ThemeStore {
    private watchable?: Watchable<unknown>;
    private pollTimer?: number;
    private pendingWrite?: StoredChoice;
    private readonly listeners = new Set<(theme: string | null) => void>();

    public constructor(private readonly api: Api) {}

    /** The cached choice (undefined: never chosen on this device). */
    public cached(): string | null | undefined {
        try {
            const raw = lsGet(CACHE_KEY);
            if (raw === null) return undefined;
            return parse(JSON.parse(raw))?.theme;
        } catch {
            return undefined;
        }
    }

    public onRemote(fn: (theme: string | null) => void): void {
        this.listeners.add(fn);
    }

    /** Saves a choice locally and (once logged in) to account data. */
    public async save(theme: string | null): Promise<void> {
        const content: StoredChoice = { theme, v: 1 };
        this.writeCache(content);
        if (!this.watchable) {
            this.pendingWrite = content;
            return;
        }
        try {
            await this.api.client.accountData.set(ACCOUNT_DATA_TYPE, content);
        } catch (e) {
            error("saving account data failed", e);
        }
    }

    /** Polls until the client exists, then watches account data. Never throws. */
    public attach(): void {
        if (this.tryAttach()) return;
        this.pollTimer = window.setInterval(() => {
            if (this.tryAttach()) window.clearInterval(this.pollTimer);
        }, 1000);
    }

    public stop(): void {
        window.clearInterval(this.pollTimer);
        this.watchable?.unwatch(this.handleRemote);
    }

    private writeCache(c: StoredChoice): void {
        lsSet(CACHE_KEY, JSON.stringify({ ...c, user: lsGet("mx_user_id") ?? undefined }));
    }

    private tryAttach(): boolean {
        if (this.watchable) return true;
        try {
            // Throws until a user is logged in (MatrixClientPeg.safeGet()).
            this.watchable = this.api.client.accountData.get(ACCOUNT_DATA_TYPE);
        } catch {
            return false;
        }
        try {
            this.watchable.watch(this.handleRemote);
            if (this.pendingWrite) {
                const w = this.pendingWrite;
                this.pendingWrite = undefined;
                void this.save(w.theme);
            } else if (this.watchable.value !== undefined) {
                this.handleRemote(this.watchable.value);
            }
        } catch (e) {
            warn("watching account data failed", e);
        }
        return true;
    }

    private handleRemote = (value: unknown): void => {
        const c = parse(value);
        if (!c) return;
        if (this.cached() === c.theme) return;
        this.writeCache(c);
        for (const l of this.listeners) {
            try {
                l(c.theme);
            } catch (e) {
                error("account data listener failed", e);
            }
        }
    };
}
