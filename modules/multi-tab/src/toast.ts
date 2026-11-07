const ID = "de-datanauten-multi-tab-toast";
/** The full-window notice of a tab that waits (signed out, or the main tab confirms the identity). */
export const NOTICE_ID = "de-datanauten-multi-tab-signed-out";
const NOTICE_STYLE_ID = "de-datanauten-multi-tab-notice-style";
/**
 * Element's theme may not be loaded yet behind the notice (a waiting tab never starts Element), so Compound's
 * colours come with fallbacks that follow the system's light or dark mode.
 */
const NOTICE_CSS = `
#${NOTICE_ID} {
    --mt-fg: #1b1d22;
    --mt-bg: #fff;
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    text-align: center;
    font: 16px/1.5 Inter, system-ui, sans-serif;
    color: var(--cpd-color-text-primary, var(--mt-fg));
    background: var(--cpd-color-bg-canvas-default, var(--mt-bg));
}
@media (prefers-color-scheme: dark) {
    #${NOTICE_ID} {
        --mt-fg: #ebeef2;
        --mt-bg: #101317;
    }
}`;
const SHOW_MS = 6_000;
/** The same message isn't shown again within this time, so background calls can't flood the screen. */
const QUIET_MS = 30_000;

let lastShown = 0;
let lastText = "";

/** A small notice at the bottom of the window, in Element's colours. Needs no React. */
export function showToast(text: string): void {
    const now = Date.now();
    if (text === lastText && now - lastShown < QUIET_MS) return;
    lastShown = now;
    lastText = text;
    if (typeof document === "undefined" || !document.body) return;

    document.getElementById(ID)?.remove();
    const node = document.createElement("div");
    node.id = ID;
    node.setAttribute("role", "status");
    node.textContent = text;
    Object.assign(node.style, {
        position: "fixed",
        left: "50%",
        bottom: "24px",
        transform: "translateX(-50%)",
        zIndex: "10000",
        maxWidth: "min(480px, calc(100vw - 32px))",
        padding: "12px 16px",
        borderRadius: "8px",
        font: "var(--cpd-font-body-md-regular, 14px sans-serif)",
        color: "var(--cpd-color-text-on-solid-primary, #fff)",
        background: "var(--cpd-color-bg-action-primary-rest, #1b1d22)",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)",
    } satisfies Partial<CSSStyleDeclaration>);
    document.body.appendChild(node);
    setTimeout(() => node.remove(), SHOW_MS);
}

/** A full-window notice over Element (which keeps loading, or stays blocked, underneath). */
export function showNotice(text: string): void {
    const show = (): void => {
        const old = document.getElementById(NOTICE_ID);
        if (old) {
            old.textContent = text;
            return;
        }
        if (!document.getElementById(NOTICE_STYLE_ID)) {
            const style = document.createElement("style");
            style.id = NOTICE_STYLE_ID;
            style.textContent = NOTICE_CSS;
            document.head.appendChild(style);
        }
        const node = document.createElement("div");
        node.id = NOTICE_ID;
        node.setAttribute("role", "status");
        node.textContent = text;
        document.body.appendChild(node);
    };
    if (document.body) show();
    else document.addEventListener("DOMContentLoaded", show, { once: true });
}

export function hideNotice(): void {
    document.getElementById(NOTICE_ID)?.remove();
}
