export const CONFIG_KEY = "de.datanauten.user_account_widgets";

/** A widget the admin offers in the "My apps" dialog, so users don't have to paste a URL. */
export interface SuggestedWidget {
    name: string;
    url: string;
}

export interface UserAccountWidgetsConfig {
    /** Offered in the dialog with one click. */
    suggested: SuggestedWidget[];
    /** Widgets whose URL starts with one of these get every capability they ask for without a prompt. */
    approvePrefixes: string[];
}

interface RawConfig {
    suggested?: unknown;
    approve_prefixes?: unknown;
}

declare module "@element-hq/element-web-module-api" {
    export interface Config {
        [CONFIG_KEY]?: RawConfig;
    }
}

export function parseConfig(raw: unknown): UserAccountWidgetsConfig {
    const cfg = (raw && typeof raw === "object" ? raw : {}) as RawConfig;
    const suggested = Array.isArray(cfg.suggested)
        ? cfg.suggested.filter(
              (s): s is SuggestedWidget =>
                  !!s && typeof s.name === "string" && typeof s.url === "string" && isHttpUrl(s.url),
          )
        : [];
    const approvePrefixes = Array.isArray(cfg.approve_prefixes)
        ? cfg.approve_prefixes.filter((p): p is string => typeof p === "string" && isHttpUrl(p))
        : [];
    return { suggested, approvePrefixes };
}

export function isHttpUrl(url: string): boolean {
    try {
        const { protocol } = new URL(url);
        return protocol === "https:" || protocol === "http:";
    } catch {
        return false;
    }
}
