import { DEFAULT_SCAN, type ScanOptions } from "./scanner";

export const CONFIG_KEY = "de.datanauten.files_hub";

export interface FilesHubConfig extends ScanOptions {
    /** Largest file (MB) previewed without asking; bigger ones offer a download only. */
    preview_max_mb: number;
    /** Label SharePoint / OneDrive links in messages. */
    cloud_link_cards: boolean;
}

declare module "@element-hq/element-web-module-api" {
    export interface Config {
        [CONFIG_KEY]?: Partial<{
            max_age_days: number;
            max_events_per_room: number;
            concurrency: number;
            preview_max_mb: number;
            cloud_link_cards: boolean;
        }>;
    }
}

export function parseConfig(value: unknown): FilesHubConfig {
    const config: FilesHubConfig = { ...DEFAULT_SCAN, preview_max_mb: 25, cloud_link_cards: true };
    if (value === undefined || value === null) return config;
    if (typeof value !== "object") throw new Error("expected an object");
    const raw = value as Record<string, unknown>;
    const num = (key: string, min: number, max: number): number | undefined => {
        const v = raw[key];
        if (v === undefined) return undefined;
        if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) throw new Error(`${key} must be a number from ${min} to ${max}`);
        return v;
    };
    config.maxAgeDays = num("max_age_days", 1, 3650) ?? config.maxAgeDays;
    config.maxEventsPerRoom = Math.round(num("max_events_per_room", 10, 100000) ?? config.maxEventsPerRoom);
    config.concurrency = Math.round(num("concurrency", 1, 10) ?? config.concurrency);
    config.preview_max_mb = num("preview_max_mb", 0, 1024) ?? config.preview_max_mb;
    if (raw.cloud_link_cards !== undefined) {
        if (typeof raw.cloud_link_cards !== "boolean") throw new Error("cloud_link_cards must be true or false");
        config.cloud_link_cards = raw.cloud_link_cards;
    }
    return config;
}
