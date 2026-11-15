/**
 * On-screen keyboard and viewport (MOB-28, MOB-18, MOB-19), Hydrogen's approach (adaptUIOnVisualViewportResize).
 *
 * iOS Safari and Android Chrome (default interactive-widget=resizes-visual) don't shrink the layout viewport when the
 * keyboard opens; they shrink and pan the *visual* viewport, and Element's `height: 100%; overflow: hidden` shell gets
 * pushed up (header off-screen, composer/menus under the keyboard). While mobile mode is on we publish the visual
 * viewport on <html> and the CSS sizes the app (#matrixchat) and dialogs to it:
 *
 *   --mt-vv-h    visualViewport.height (px)        --mt-vv-top  visualViewport.offsetTop (px)
 *   html[data-mt-keyboard]  an editable element is focused and the visible height dropped by > 120 px
 *
 * Pinch-zoom also shrinks the visual viewport: then (scale ≠ 1) the variables are removed so the app keeps its size.
 * The timeline keeps its bottom anchor across the resize (scrollTop compensation like Hydrogen).
 *
 * The viewport meta gets `minimum-scale=1` (no zoom-out to fit overflow), `viewport-fit=cover` (env(safe-area-inset-*) become real; the CSS pads with them) and, on
 * Android, `interactive-widget=resizes-content` (Chrome ≥ 108 then shrinks the layout viewport itself, the best case).
 * The original content is restored when mobile mode ends. Pinch-zoom is never disabled (no maximum-scale).
 */
const isMobile = (): boolean => document.documentElement.hasAttribute("data-mt-mobile");
const KEYBOARD_PX = 120;

function editableFocused(): boolean {
    const a = document.activeElement as HTMLElement | null;
    if (!a) return false;
    if (a.isContentEditable) return true;
    if (a instanceof HTMLTextAreaElement) return true;
    if (a instanceof HTMLInputElement) return !/^(checkbox|radio|button|submit|reset|file|range|color|image|hidden)$/i.test(a.type);
    return false;
}

export function startKeyboard(): () => void {
    const vv = window.visualViewport;
    const root = document.documentElement;
    // largest layout height seen per window width: a keyboard never changes the width, a rotation always does (with
    // resizes-content on Android, innerHeight itself shrinks with the keyboard)
    const maxH: Record<string, number> = {};
    let raf = 0;

    const apply = (): void => {
        raf = 0;
        if (!isMobile()) {
            root.style.removeProperty("--mt-vv-h");
            root.style.removeProperty("--mt-vv-top");
            root.removeAttribute("data-mt-keyboard");
            return;
        }
        const orient = String(Math.round(innerWidth));
        maxH[orient] = Math.max(maxH[orient] ?? 0, innerHeight);
        const scale = vv?.scale ?? 1;
        const zoomed = Math.abs(scale - 1) > 0.01;
        const panel = document.querySelector<HTMLElement>(".mx_RoomView_messagePanel");
        const atBottom = !!panel && panel.scrollHeight - panel.scrollTop - panel.clientHeight < 4;
        if (vv && !zoomed) {
            root.style.setProperty("--mt-vv-h", `${Math.round(vv.height)}px`);
            root.style.setProperty("--mt-vv-top", `${Math.round(vv.offsetTop)}px`);
        } else {
            root.style.removeProperty("--mt-vv-h");
            root.style.removeProperty("--mt-vv-top");
        }
        const visible = vv && !zoomed ? vv.height : innerHeight;
        const kb = editableFocused() && maxH[orient] - visible > KEYBOARD_PX;
        if (kb) root.setAttribute("data-mt-keyboard", "");
        else root.removeAttribute("data-mt-keyboard");
        if (atBottom && panel) {
            requestAnimationFrame(() => {
                panel.scrollTop = panel.scrollHeight;
            });
        }
        // iOS scrolls the (overflow: hidden) document to reveal the input; our app box follows offsetTop instead
        if (!zoomed && (document.scrollingElement?.scrollTop ?? 0) !== 0 && vv && vv.offsetTop === 0) {
            document.scrollingElement!.scrollTop = 0;
        }
    };
    const schedule = (): void => {
        if (!raf) raf = requestAnimationFrame(apply);
    };
    vv?.addEventListener("resize", schedule);
    vv?.addEventListener("scroll", schedule);
    window.addEventListener("resize", schedule);
    document.addEventListener("focusin", schedule, true);
    document.addEventListener("focusout", () => setTimeout(schedule, 50), true);
    schedule();
    return () => {
        vv?.removeEventListener("resize", schedule);
        vv?.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        document.removeEventListener("focusin", schedule, true);
        root.style.removeProperty("--mt-vv-h");
        root.style.removeProperty("--mt-vv-top");
        root.removeAttribute("data-mt-keyboard");
    };
}

let originalViewport: string | null = null;
/** viewport-fit=cover (+ interactive-widget=resizes-content on Android) while mobile mode is on; restored otherwise. */
export function syncViewportMeta(mobile: boolean): void {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) return;
    if (originalViewport === null) originalViewport = meta.getAttribute("content") ?? "width=device-width, initial-scale=1";
    if (!mobile) {
        if (meta.getAttribute("content") !== originalViewport) meta.setAttribute("content", originalViewport);
        return;
    }
    const parts = originalViewport
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && !/^(viewport-fit|interactive-widget|minimum-scale)\s*=/.test(s));
    // minimum-scale=1: the browser never zooms *out* to fit something momentarily wider than the screen (seen after
    // rotation and when a panel opens: the page stayed at ~0.6 scale with a 600-800 px layout viewport). Zooming in
    // (pinch) stays possible; no maximum-scale / user-scalable=no.
    parts.push("minimum-scale=1", "viewport-fit=cover");
    if (/Android/.test(navigator.userAgent)) parts.push("interactive-widget=resizes-content");
    const v = parts.join(", ");
    if (meta.getAttribute("content") !== v) meta.setAttribute("content", v);
}
