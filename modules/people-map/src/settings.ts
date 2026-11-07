import type { Api, Watchable } from "@element-hq/element-web-module-api";

/** Account data with the user's people map settings, so they follow them to every device. */
export const SETTINGS_TYPE = "de.datanauten.people_map.settings";
const LOCAL_STORAGE_KEY = "de.datanauten.people_map.settings";
const ATTACH_RETRY_MS = 1000;

export interface MapSettings {
    /** Zooms on opening and on choosing a person. Off anyway when the system asks for less motion. */
    animations: boolean;
    /** People you only share large rooms with (and never talked to) are shown too. */
    largeRooms: boolean;
    /** Bots and integrations are shown too. */
    bots: boolean;
    /** Avatars stay in the browser's cache between sessions. */
    cacheAvatars: boolean;
}

export const DEFAULT_SETTINGS: MapSettings = { animations: true, largeRooms: false, bots: false, cacheAvatars: true };

export function sanitiseSettings(value: unknown): MapSettings {
    const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
    const bool = (key: keyof MapSettings): boolean => (typeof raw[key] === "boolean" ? (raw[key] as boolean) : DEFAULT_SETTINGS[key]);
    return { animations: bool("animations"), largeRooms: bool("largeRooms"), bots: bool("bots"), cacheAvatars: bool("cacheAvatars") };
}

/**
 * The settings: a localStorage copy for a value right at startup, account data once the user is
 * logged in (which then wins).
 */
export class SettingsStore {
    private value: MapSettings;
    private readonly listeners = new Set<() => void>();
    private watchable?: Watchable<unknown>;
    private retryTimer?: ReturnType<typeof setInterval>;

    public constructor(private readonly api: Pick<Api, "client">) {
        this.value = sanitiseSettings(readLocal());
    }

    public start(): void {
        if (this.tryAttach()) return;
        this.retryTimer = setInterval(() => {
            if (this.tryAttach()) clearInterval(this.retryTimer);
        }, ATTACH_RETRY_MS);
    }

    public stop(): void {
        clearInterval(this.retryTimer);
        this.watchable?.unwatch(this.onChange);
        this.watchable = undefined;
    }

    public get = (): MapSettings => this.value;

    public subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    };

    public async set(patch: Partial<MapSettings>): Promise<void> {
        this.update({ ...this.value, ...patch });
        if (this.watchable) await this.api.client.accountData.set(SETTINGS_TYPE, { version: 1, ...this.value });
    }

    private tryAttach(): boolean {
        try {
            this.watchable = this.api.client.accountData.get(SETTINGS_TYPE);
        } catch {
            // Not logged in yet.
            return false;
        }
        this.watchable.watch(this.onChange);
        // Nothing stored yet: keep what this device had.
        if (this.watchable.value) this.onChange(this.watchable.value);
        return true;
    }

    private onChange = (value: unknown): void => {
        if (value) this.update(sanitiseSettings(value));
    };

    private update(next: MapSettings): void {
        if (JSON.stringify(next) === JSON.stringify(this.value)) return;
        this.value = next;
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
        } catch {
            // The account data copy is enough.
        }
        for (const l of this.listeners) l();
    }
}

function readLocal(): unknown {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? "null");
    } catch {
        return null;
    }
}
