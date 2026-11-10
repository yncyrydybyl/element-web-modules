import { afterEach, describe, expect, it, vi } from "vitest";

import { ComposerSuggest, queryBeforeCaret, type SuggestState } from "./suggest";
import type { ResolvedTag } from "./tags";

const tag = (name: string): ResolvedTag => ({ name, label: "", kind: "tag", members: ["@b:t"], absent: [], allowed: true });

describe("queryBeforeCaret", () => {
    it("returns what follows an @ at a word start", () => {
        expect(queryBeforeCaret("@")).toBe("");
        expect(queryBeforeCaret("hey @onc")).toBe("onc");
        expect(queryBeforeCaret("hey @onc")).toBe("onc");
        expect(queryBeforeCaret("(@de")).toBe("de");
    });

    it("ignores e-mail addresses, user IDs and finished words", () => {
        expect(queryBeforeCaret("ops@onc")).toBeUndefined();
        expect(queryBeforeCaret("@bob:serv")).toBeUndefined();
        expect(queryBeforeCaret("@oncall ")).toBeUndefined();
    });
});

describe("ComposerSuggest", () => {
    let suggest: ComposerSuggest | undefined;
    afterEach(() => {
        suggest?.stop();
        document.body.innerHTML = "";
    });

    function setup(): { composer: HTMLElement; text: Text; states: (SuggestState | null)[]; pick: () => (t: ResolvedTag) => void } {
        document.body.innerHTML = '<div class="mx_MessageComposer"><div class="mx_BasicMessageComposer_input" contenteditable="true"></div></div>';
        const composer = document.querySelector<HTMLElement>(".mx_BasicMessageComposer_input")!;
        const text = document.createTextNode("ping @onc");
        composer.appendChild(text);
        const states: (SuggestState | null)[] = [];
        let picker: (t: ResolvedTag) => void = () => {};
        suggest = new ComposerSuggest({
            tagsForComposer: () => [tag("oncall"), tag("design"), tag("ops")],
            render: (s, pick) => {
                states.push(s);
                picker = pick;
            },
        });
        suggest.start();
        return { composer, text, states, pick: () => picker };
    }

    function caret(node: Text, offset: number): void {
        const range = document.createRange();
        range.setStart(node, offset);
        range.collapse(true);
        const sel = document.getSelection()!;
        sel.removeAllRanges();
        sel.addRange(range);
        document.dispatchEvent(new Event("input", { bubbles: true }));
    }

    it("shows matching tags while typing and hides when the word ends", () => {
        const { text, states } = setup();
        caret(text, 9);
        expect(states.at(-1)?.tags.map((t) => t.name)).toEqual(["oncall"]);
        text.data = "ping @o";
        caret(text, 7);
        expect(states.at(-1)?.tags.map((t) => t.name)).toEqual(["oncall", "ops"]);
        text.data = "ping @o x";
        caret(text, 9);
        expect(states.at(-1)).toBeNull();
    });

    it("moves the selection with the arrow keys and picks with Enter", () => {
        const { text, states } = setup();
        text.data = "ping @o";
        caret(text, 7);
        const exec = vi.fn();
        document.execCommand = exec;
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
        expect(states.at(-1)?.selected).toBe(1);
        const enter = new KeyboardEvent("keydown", { key: "Enter", cancelable: true });
        window.dispatchEvent(enter);
        expect(enter.defaultPrevented).toBe(true);
        expect(exec).toHaveBeenCalledWith("insertText", false, "@ops ");
        // The typed "@o" was selected so that the insert replaces it.
        expect(document.getSelection()!.toString()).toBe("@o");
        expect(states.at(-1)).toBeNull();
    });

    it("leaves the keys to Element while its own autocomplete is open", () => {
        const { text, composer } = setup();
        caret(text, 9);
        const list = document.createElement("div");
        list.className = "mx_Autocomplete";
        list.appendChild(document.createElement("div"));
        composer.parentElement!.appendChild(list);
        const enter = new KeyboardEvent("keydown", { key: "Enter", cancelable: true });
        window.dispatchEvent(enter);
        expect(enter.defaultPrevented).toBe(false);
    });

    it("ignores text outside the composer", () => {
        const { states } = setup();
        const other = document.createElement("textarea");
        document.body.appendChild(other);
        const t = document.createTextNode("@onc");
        document.body.appendChild(t);
        caret(t, 4);
        expect(states.filter(Boolean)).toEqual([]);
    });
});
