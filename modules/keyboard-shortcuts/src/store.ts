import type { Api, Watchable } from "@element-hq/element-web-module-api";

import { parseCombo, stringifyCombo, type KeyCombo } from "./keys";

/** Account data event type holding the user's custom shortcuts, so they roam across devices. */
export const ACCOUNT_DATA_TYPE = "de.datanauten.keyboard_shortcuts";
const LOCAL_STORAGE_KEY = "de.datanauten.keyboard_shortcuts.overrides";
const ATTACH_RETRY_MS = 3000;

/** Action id → combo string ("Mod+Shift+B"). */
export type Overrides = Record<string, string>;

interface StoredContent {
    version: 1;
    overrides: Overrides;
}

function sanitise(value: unknown): Overrides {
    const overrides = (value as Partial<StoredContent> | undefined)?.overrides;
    if (!overrides || typeof overrides !== "object") return {};
    const result: Overrides = {};
    for (const [id, combo] of Object.entries(overrides)) {
        if (typeof combo !== "string") continue;
        try {
            parseCombo(combo);
            result[id] = combo;
        } catch {
            // Drop entries we can't understand rather than failing the whole set.
        }
    }
    return result;
}

/**
 * The user's custom shortcuts.
 *
 * localStorage gives an immediate value at startup (before login); once a Matrix client exists the
 * store attaches to account data, which wins and keeps other devices in sync.
 */
export class OverrideStore {
    private overrides: Overrides = {};
    private readonly listeners = new Set<() => void>();
    private watchable?: Watchable<unknown>;
    private retryTimer?: ReturnType<typeof setInterval>;

    public constructor(private readonly api: Pick<Api, "client">) {
        this.overrides = this.readLocal();
    }

    public start(): void {
        if (this.tryAttach()) return;
        this.retryTimer = setInterval(() => {
            if (this.tryAttach()) clearInterval(this.retryTimer);
        }, ATTACH_RETRY_MS);
    }

    public stop(): void {
        clearInterval(this.retryTimer);
        this.watchable?.unwatch(this.onRemote);
    }

    public getAll(): Readonly<Overrides> {
        return this.overrides;
    }

    public getCombo(id: string): KeyCombo | undefined {
        const value = this.overrides[id];
        return value ? parseCombo(value) : undefined;
    }

    public async set(id: string, combo: KeyCombo | null): Promise<void> {
        const next = { ...this.overrides };
        if (combo) next[id] = stringifyCombo(combo);
        else delete next[id];
        await this.replace(next);
    }

    public async clear(): Promise<void> {
        await this.replace({});
    }

    public subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private async replace(next: Overrides): Promise<void> {
        this.apply(next);
        if (!this.watchable) return; // Not logged in yet: localStorage only, pushed on attach.
        const content: StoredContent = { version: 1, overrides: next };
        await this.api.client.accountData.set(ACCOUNT_DATA_TYPE, content);
    }

    private apply(next: Overrides): void {
        this.overrides = next;
        this.writeLocal(next);
        for (const listener of this.listeners) listener();
    }

    private onRemote = (value: unknown): void => {
        this.apply(sanitise(value));
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
        if (this.watchable.value !== undefined) {
            this.apply(sanitise(this.watchable.value));
        } else if (Object.keys(this.overrides).length > 0) {
            // First login on a device that already had local overrides: upload them.
            void this.replace(this.overrides).catch((e) => console.warn("[keyboard-shortcuts] sync failed", e));
        }
        return true;
    }

    private readLocal(): Overrides {
        try {
            return sanitise(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? "null"));
        } catch {
            return {};
        }
    }

    private writeLocal(overrides: Overrides): void {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ version: 1, overrides }));
        } catch {
            // Storage may be unavailable (private mode); the in-memory value still works.
        }
    }
}
