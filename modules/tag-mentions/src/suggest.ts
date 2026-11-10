/**
 * Offers tags while typing "@" in Element's composer. Element's own autocomplete (users, rooms,
 * commands) is internal and can't be extended by a module, so this watches the composer's DOM
 * and shows its own list above it. Picking a tag replaces the typed "@onc" with "@oncall " through
 * an input event, which Element's composer model picks up like typing. Keyboard: arrows, Tab or
 * Enter, Escape, but only while Element's own autocomplete isn't open, so the two never fight.
 */

import { matchTags, type ResolvedTag } from "./tags";

/** Element's plain composer and its rich text editor (`feature_wysiwyg_composer`). */
export const COMPOSER_SELECTOR = ".mx_BasicMessageComposer_input, .mx_WysiwygComposer_Editor_content";
const ELEMENT_AUTOCOMPLETE = ".mx_Autocomplete";

/** "@" plus what was typed right before the caret, or undefined when the caret isn't in such a word. */
export function queryBeforeCaret(textBeforeCaret: string): string | undefined {
    const m = /(?:^|[\s(])@([A-Za-z0-9_-]{0,32})$/.exec(textBeforeCaret.replace(/ /g, " "));
    return m ? m[1] : undefined;
}

export interface SuggestState {
    tags: ResolvedTag[];
    selected: number;
    /** Where to draw the list: above this rectangle. */
    anchor: { left: number; bottom: number; width: number };
}

export interface SuggestOptions {
    tagsForComposer(composer: HTMLElement): ResolvedTag[];
    render(state: SuggestState | null, pick: (tag: ResolvedTag) => void): void;
}

export class ComposerSuggest {
    private state: SuggestState | null = null;
    private target?: { node: Text; start: number; end: number; composer: HTMLElement };

    public constructor(private readonly opts: SuggestOptions) {}

    public start(): void {
        document.addEventListener("input", this.update, true);
        document.addEventListener("selectionchange", this.update);
        window.addEventListener("keydown", this.onKeyDown, true);
        document.addEventListener("focusout", this.onBlur, true);
    }

    public stop(): void {
        document.removeEventListener("input", this.update, true);
        document.removeEventListener("selectionchange", this.update);
        window.removeEventListener("keydown", this.onKeyDown, true);
        document.removeEventListener("focusout", this.onBlur, true);
        this.hide();
    }

    public get visible(): boolean {
        return !!this.state;
    }

    private update = (): void => {
        const sel = document.getSelection();
        const node = sel?.anchorNode;
        const composer = node?.parentElement?.closest<HTMLElement>(COMPOSER_SELECTOR);
        if (!sel || !sel.isCollapsed || !node || node.nodeType !== Node.TEXT_NODE || !composer) return this.hide();
        const text = node as Text;
        const query = queryBeforeCaret(text.data.slice(0, sel.anchorOffset));
        if (query === undefined) return this.hide();
        const tags = matchTags(this.opts.tagsForComposer(composer), query);
        if (!tags.length) return this.hide();
        this.target = { node: text, start: sel.anchorOffset - query.length - 1, end: sel.anchorOffset, composer };
        const box = (composer.closest(".mx_MessageComposer") ?? composer).getBoundingClientRect();
        const elementList = document.querySelector(ELEMENT_AUTOCOMPLETE)?.getBoundingClientRect();
        const top = elementList && elementList.height > 0 ? Math.min(elementList.top, box.top) : box.top;
        const prev = this.state?.tags.map((t) => t.name).join() === tags.map((t) => t.name).join() ? this.state.selected : 0;
        this.state = {
            tags,
            selected: Math.min(prev, tags.length - 1),
            anchor: { left: box.left, bottom: window.innerHeight - top + 4, width: box.width },
        };
        this.render();
    };

    private onKeyDown = (ev: KeyboardEvent): void => {
        if (!this.state || ev.isComposing) return;
        const elementOpen = (document.querySelector(ELEMENT_AUTOCOMPLETE)?.childElementCount ?? 0) > 0;
        if (elementOpen && ev.key !== "Escape") return;
        const n = this.state.tags.length;
        if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
            this.state = { ...this.state, selected: (this.state.selected + (ev.key === "ArrowDown" ? 1 : n - 1)) % n };
            this.render();
        } else if ((ev.key === "Tab" || ev.key === "Enter") && !ev.shiftKey && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
            this.pick(this.state.tags[this.state.selected]);
        } else if (ev.key === "Escape") {
            this.hide();
        } else return;
        ev.preventDefault();
        ev.stopPropagation();
    };

    private onBlur = (ev: FocusEvent): void => {
        // Clicking the list keeps the focus (mousedown is prevented there), so a blur means leaving.
        if ((ev.target as Element | null)?.closest?.(COMPOSER_SELECTOR)) setTimeout(() => this.update(), 0);
    };

    public pick = (tag: ResolvedTag): void => {
        const t = this.target;
        this.hide();
        if (!t || !t.node.isConnected) return;
        t.composer.focus();
        const range = document.createRange();
        range.setStart(t.node, Math.max(0, t.start));
        range.setEnd(t.node, Math.min(t.end, t.node.length));
        const sel = document.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.execCommand("insertText", false, `@${tag.name} `);
    };

    private hide(): void {
        if (!this.state) return;
        this.state = null;
        this.target = undefined;
        this.render();
    }

    private render(): void {
        this.opts.render(this.state, this.pick);
    }
}
