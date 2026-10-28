import { vi } from "vitest";
import { createRoot } from "react-dom/client";
import { Watchable, type Api } from "@element-hq/element-web-module-api";

/** A minimal stand-in for Element Web's ModuleApi with just what this module touches. */
export function mockApi(options: { config?: unknown; loggedIn?: boolean; accountData?: unknown; settings?: Record<string, unknown> } = {}) {
    const strings: Record<string, string> = { "keyboard|composer_toggle_bold": "Toggle Bold (from Element)" };
    const accountData = new Watchable<unknown>(options.accountData);
    const setAccountData = vi.fn(async (_type: string, content: unknown) => {
        accountData.value = content;
    });
    const api = {
        config: {
            get: (key?: string) => (key ? (key === "de.datanauten.keyboard_shortcuts" ? options.config : undefined) : {}),
        },
        i18n: {
            language: "en",
            register: (translations: Record<string, Record<string, string>>) => {
                for (const [key, langs] of Object.entries(translations)) strings[key] = langs.en;
            },
            translate: (key: string, vars?: Record<string, string>) =>
                (strings[key] ?? key).replace(/%\((\w+)\)s/g, (_, name) => vars?.[name] ?? ""),
        },
        settings: { getValue: (name: string) => options.settings?.[name] },
        client: {
            accountData: {
                get: () => {
                    if (!options.loggedIn) throw new Error("not logged in");
                    return accountData;
                },
                set: setAccountData,
                delete: vi.fn(),
            },
        },
        createRoot: (el: Element) => createRoot(el),
    };
    return { api: api as unknown as Api, setAccountData, accountData };
}
