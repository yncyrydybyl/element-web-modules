import { vi } from "vitest";
import { createRoot } from "react-dom/client";
import { Watchable, type Api } from "@element-hq/element-web-module-api";

/** A minimal stand-in for Element Web's ModuleApi with just what this module touches. */
export function mockApi(options: { config?: unknown; accountData?: Record<string, unknown> } = {}) {
    const strings: Record<string, string> = {};
    const openRoom = vi.fn();
    const toMatrixToLink = vi.fn(async () => undefined);
    const accountData = new Map<string, Watchable<unknown>>();
    const watchable = (type: string): Watchable<unknown> => {
        if (!accountData.has(type)) accountData.set(type, new Watchable(options.accountData?.[type]));
        return accountData.get(type)!;
    };
    const setAccountData = vi.fn(async (type: string, content: unknown) => {
        watchable(type).value = content;
    });
    const api = {
        config: { get: (key?: string) => (key === "de.datanauten.people_map" ? options.config : undefined) },
        i18n: {
            language: "en",
            register: (translations: Record<string, Record<string, string>>) => {
                for (const [key, langs] of Object.entries(translations)) strings[key] = langs.en;
            },
            translate: (key: string, vars?: Record<string, string>) =>
                (strings[key] ?? key).replace(/%\((\w+)\)s/g, (_, name) => vars?.[name] ?? ""),
        },
        navigation: { openRoom, toMatrixToLink },
        client: { accountData: { get: watchable, set: setAccountData } },
        stores: { roomListStore: { getRooms: () => new Watchable([]) } },
        createRoot: (el: Element) => createRoot(el),
    };
    return { api: api as unknown as Api, openRoom, toMatrixToLink, setAccountData, accountData: watchable };
}
