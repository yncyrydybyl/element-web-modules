import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MatrixEvent } from "@element-hq/element-web-module-api";

import { compose, registerSuiteRenderer, type SuiteRenderer } from "./suiteRender";

const ev = (content: Record<string, unknown>): MatrixEvent => ({ type: "m.room.message", content }) as unknown as MatrixEvent;
const props = (content: Record<string, unknown>) => ({ mxEvent: ev(content) });

describe("suite renderer chain", () => {
    beforeEach(() => {
        delete (window as unknown as { deDatanautenTeamsSuite?: unknown }).deDatanautenTeamsSuite;
    });

    it("nests wrappers around the replacing entry, or around Element's own rendering", () => {
        const entries: SuiteRenderer[] = [
            { id: "a/wrap", filter: () => true, render: (_p, inner) => `[a ${inner() as string}]` },
            { id: "b/body", filter: () => true, render: () => "body", replaces: true },
            { id: "c/wrap", filter: () => true, render: (_p, inner) => `(c ${inner() as string})` },
        ];
        expect(compose(entries, props({}), () => "original")).toBe("(c [a body])");
        expect(compose([entries[0]], props({}), () => "original")).toBe("[a original]");
    });

    it("registers with Element once, and only blocks editing when a module draws the body", () => {
        const registerMessageRenderer = vi.fn();
        const api = { registerMessageRenderer };
        registerSuiteRenderer(api, { id: "x/tag", filter: (e) => !!e.content.tag, render: (_p, inner) => inner() });
        registerSuiteRenderer(api, { id: "y/urgent", filter: (e) => !!e.content.urgent, render: () => "u", replaces: true });
        expect(registerMessageRenderer).toHaveBeenCalledTimes(2);
        const [[editable], [locked, , hints]] = registerMessageRenderer.mock.calls;
        expect(hints).toEqual({ allowEditingEvent: false });
        expect([editable(ev({ tag: 1 })), locked(ev({ tag: 1 }))]).toEqual([true, false]);
        expect([editable(ev({ tag: 1, urgent: 1 })), locked(ev({ tag: 1, urgent: 1 }))]).toEqual([false, true]);
        expect([editable(ev({})), locked(ev({}))]).toEqual([false, false]);
    });
});
