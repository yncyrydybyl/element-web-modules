import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Api } from "@element-hq/element-web-module-api";

import FilesHubModule, { PAGE_PATH } from "./index";

function fakeApi(config?: unknown) {
    const headers: ((roomId: string) => React.JSX.Element | undefined)[] = [];
    const renderers: { filter: (ev: { type: string; content: Record<string, unknown> }) => boolean; render: (p: unknown, o?: () => React.JSX.Element) => React.JSX.Element; hints?: unknown }[] = [];
    const pages = new Map<string, () => React.JSX.Element>();
    const spaceItems = new Map<string, { label: string; onSelected(): void }>();
    const api = {
        config: { get: vi.fn(() => config) },
        i18n: { register: vi.fn(), translate: (k: string) => k },
        extras: {
            addRoomHeaderButtonCallback: (cb: (typeof headers)[number]) => headers.push(cb),
            setSpacePanelItem: (k: string, p: { label: string; onSelected(): void }) => spaceItems.set(k, p),
        },
        navigation: { registerLocationRenderer: (path: string, r: () => React.JSX.Element) => pages.set(path, r) },
        customComponents: {
            registerMessageRenderer: (filter: (typeof renderers)[number]["filter"], render: (typeof renderers)[number]["render"], hints?: unknown) =>
                renderers.push({ filter, render, hints }),
        },
        openDialog: vi.fn(),
    };
    return { api: api as unknown as Api, raw: api, headers, renderers, pages, spaceItems };
}

describe("FilesHubModule", () => {
    it("registers the header button, the Files page and the cloud link cards", async () => {
        const f = fakeApi();
        await new FilesHubModule(f.api).load();
        expect(f.headers).toHaveLength(1);
        expect(f.pages.has(PAGE_PATH)).toBe(true);
        f.spaceItems.get("de.datanauten.files_hub")!.onSelected();
        expect(window.location.hash).toBe(`#/${PAGE_PATH}`);

        const msg = { type: "m.room.message", content: { msgtype: "m.text", body: "Plan: https://contoso.sharepoint.com/:x:/s/Fin/Eab" } };
        expect(f.renderers[0].filter(msg)).toBe(true);
        expect(f.renderers[0].filter({ type: "m.room.message", content: { body: "https://example.com" } })).toBe(false);
        // Editing stays allowed, because Element's own rendering is kept.
        expect(f.renderers[0].hints).toBeUndefined();
        render(f.renderers[0].render({ mxEvent: msg }, () => <p>original body</p>));
        expect(screen.getByText("original body")).toBeTruthy();
        expect(screen.getByTestId("fileshub-cloud-cards").textContent).toContain("contoso");
    });

    it("can turn the cards off and rejects a bad config", async () => {
        const f = fakeApi({ cloud_link_cards: false });
        await new FilesHubModule(f.api).load();
        expect(f.renderers).toHaveLength(0);
        await expect(new FilesHubModule(fakeApi({ max_age_days: "a lot" }).api).load()).rejects.toThrow(/configuration/);
    });

    it("works without the alpha page APIs", async () => {
        const f = fakeApi();
        delete (f.raw.extras as Partial<typeof f.raw.extras>).setSpacePanelItem;
        await new FilesHubModule(f.api).load();
        expect(f.pages.size).toBe(0);
        expect(f.headers).toHaveLength(1);
    });
});
