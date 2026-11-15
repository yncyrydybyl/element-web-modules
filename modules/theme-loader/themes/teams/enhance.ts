import type { EnhancerContext } from "../../loader/src/types";

/*
 * teams enhancer — only teams-2028 uses it (manifest "enhance": true there).
 * Adds decorative Copilot suggestion chips that float just above the composer. They live in
 * ctx.root (never inside React-owned DOM) and follow the composer's position. A click focuses the
 * composer and inserts a canned prompt; nothing is sent.
 */

const CHIPS: Array<{ label: string; text: string }> = [
    { label: "Summarize this chat", text: "Can someone summarize the decisions in this chat so far?" },
    { label: "What did I miss?", text: "Quick catch-up please — what did I miss since yesterday?" },
    { label: "Draft a friendly reply", text: "Thanks, that's really helpful! I'll pick this up today." },
];

let box: HTMLDivElement | null = null;
let timer: number | null = null;
let onResize: (() => void) | null = null;

function composerRect(): DOMRect | null {
    const composers = Array.from(
        document.querySelectorAll<HTMLElement>(".mx_RoomView_body > .mx_MessageComposer, .mx_RoomView_body .mx_MessageComposer"),
    );
    for (const c of composers) {
        if (c.closest(".mx_RightPanel, .mx_ThreadView")) continue;
        const r = c.getBoundingClientRect();
        if (r.width > 200 && r.height > 0) return r;
    }
    return null;
}

function place(): void {
    if (!box) return;
    try {
        const r = composerRect();
        const blocked = !!document.querySelector(".mx_Dialog, .mx_ContextualMenu, [role='menu']");
        if (!r || blocked || window.innerWidth < 769) {
            box.style.display = "none";
            return;
        }
        box.style.display = "flex";
        box.style.left = `${Math.round(r.left + 20)}px`;
        box.style.top = `${Math.round(r.top - 34)}px`;
        box.style.maxWidth = `${Math.round(r.width - 40)}px`;
    } catch {
        /* never throw into Element */
    }
}

function insert(text: string): void {
    try {
        const input = Array.from(document.querySelectorAll<HTMLElement>(".mx_BasicMessageComposer_input")).find(
            (el) => !el.closest(".mx_RightPanel"),
        );
        if (!input) return;
        input.focus();
        document.execCommand("insertText", false, text);
    } catch {
        /* ignore */
    }
}

export default {
    mount(ctx: EnhancerContext): void {
        this.unmount();
        if (ctx.variant.id !== "teams-2028") return;
        try {
            box = document.createElement("div");
            box.className = "tm-ai-chips";
            box.setAttribute("role", "toolbar");
            box.setAttribute("aria-label", "Copilot suggestions");
            Object.assign(box.style, {
                position: "fixed",
                display: "none",
                padding: "0",
                pointerEvents: "auto",
            } as Partial<CSSStyleDeclaration>);
            for (const chip of CHIPS) {
                const b = document.createElement("button");
                b.type = "button";
                b.className = "tm-ai-chip";
                b.textContent = chip.label;
                b.addEventListener("click", () => insert(chip.text));
                box.appendChild(b);
            }
            ctx.root.appendChild(box);
            onResize = (): void => place();
            window.addEventListener("resize", onResize);
            timer = window.setInterval(place, 400);
            place();
        } catch (e) {
            ctx.log("teams-2028 chips failed", e);
        }
    },
    unmount(): void {
        if (timer !== null) window.clearInterval(timer);
        timer = null;
        if (onResize) window.removeEventListener("resize", onResize);
        onResize = null;
        box?.remove();
        box = null;
    },
};
