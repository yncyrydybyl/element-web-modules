/**
 * Reads and clears Element's message composer, so "Send later" picks up what the user already
 * typed and doesn't leave it behind. The module API can only insert text, so this goes through
 * the DOM: the composer is a contenteditable that listens to input events, which execCommand fires.
 */

// The plain composer, or the rich text editor when `feature_wysiwyg_composer` is on.
const EDITOR = [".mx_BasicMessageComposer_input", ".mx_WysiwygComposer_Editor_content"];
const SELECTORS = {
    room: EDITOR.map((e) => `.mx_RoomView_body .mx_MessageComposer ${e}`).join(", "),
    thread: EDITOR.map((e) => `.mx_ThreadView .mx_MessageComposer ${e}`).join(", "),
};

function composerElement(view: "room" | "thread"): HTMLElement | null {
    return document.querySelector<HTMLElement>(SELECTORS[view]);
}

export function readComposer(view: "room" | "thread"): string {
    return composerElement(view)?.innerText.replace(/ /g, " ").trim() ?? "";
}

export async function clearComposer(view: "room" | "thread"): Promise<void> {
    const el = composerElement(view);
    if (!el || !el.innerText.trim()) return;
    el.focus();
    // Select the editor's own contents, then give the rich text editor a moment: it picks the
    // selection up from the (asynchronous) selectionchange event and would otherwise delete only
    // one character.
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = document.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    await new Promise((r) => setTimeout(r, 50));
    document.execCommand("delete");
}
