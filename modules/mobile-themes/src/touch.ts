/**
 * Touch interactions (MOB-21, MOB-22, MOB-25), active only while html[data-mt-mobile] is set and the event is a
 * real touch.
 *
 * Long-press on a message (≈ 500 ms, finger still) opens Element's own message context menu by dispatching a
 * synthetic `contextmenu` at the press point: that is the path Element already supports for right-click
 * (EventTile onContextMenu), so the menu, its actions and its state are Element's. WebKit never fires `contextmenu` on
 * long-press; Android Chrome does (later, and also starts a text selection), so a native contextmenu arriving right
 * after ours is swallowed to avoid a double open. The click that follows the lift is suppressed (it would otherwise
 * hit the menu's background and close it).
 *
 * Text selection is left alone: no `user-select: none` on messages. Android/iOS may still select the word under
 * the finger; that selection stays usable after closing the menu, and Element's menu offers "Copy" for a selection.
 * Links, images, buttons, inputs and the composer are excluded (their own long-press behaviour wins).
 *
 * The hover action bar is hidden on coarse pointers by CSS (sticky hover); the long-press menu replaces it.
 */
const P = "[mobile-themes]";
const LONG_PRESS_MS = 500;
const MOVE_TOLERANCE = 10;

const isMobile = (): boolean => document.documentElement.hasAttribute("data-mt-mobile");

const EXCLUDE =
    'a[href], img, video, audio, button, [role="button"], input, textarea, select, [contenteditable="true"], .mx_MessageComposer, .mx_ReactionsRow, .mx_MImageBody, .mx_MVideoBody, .mx_MFileBody, .mx_EventTile_avatar, .mx_DisambiguatedProfile, .mx_ThreadSummary, [class*="_threadSummary_"], .mx_MLocationBody, .mx_MPollBody, .mx_ContextualMenu';
const TILE = ".mx_EventTile, [class*='_eventTile_']";

export function startTouch(): () => void {
    let timer = 0;
    let start: { x: number; y: number; target: Element } | null = null;
    let fired = false;
    let firedAt = 0;

    const cancel = (): void => {
        if (timer) clearTimeout(timer);
        timer = 0;
        start = null;
    };

    const onStart = (e: TouchEvent): void => {
        if (!isMobile() || e.touches.length !== 1) return cancel();
        fired = false;
        const t = e.target as Element | null;
        if (!t?.closest) return cancel();
        const tile = t.closest(TILE);
        if (!tile || t.closest(EXCLUDE)) return cancel();
        const touch = e.touches[0];
        start = { x: touch.clientX, y: touch.clientY, target: t };
        if (timer) clearTimeout(timer);
        timer = window.setTimeout(() => {
            timer = 0;
            if (!start) return;
            const s = start;
            try {
                const ev = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, composed: true, clientX: s.x, clientY: s.y, screenX: s.x, screenY: s.y, button: 2, buttons: 0, view: window });
                (ev as MouseEvent & { mtSynthetic?: boolean }).mtSynthetic = true;
                fired = true;
                firedAt = Date.now();
                s.target.dispatchEvent(ev);
                navigator.vibrate?.(10);
            } catch (err) {
                console.warn(P, "long-press menu failed", err);
            }
        }, LONG_PRESS_MS);
    };

    const onMove = (e: TouchEvent): void => {
        if (!start) return;
        const touch = e.touches[0];
        if (!touch || Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > MOVE_TOLERANCE) cancel();
    };

    const onEnd = (e: TouchEvent): void => {
        if (fired) {
            // no compatibility mouse events / click after a long-press that opened the menu
            if (e.cancelable) e.preventDefault();
        }
        cancel();
    };

    // Android Chrome fires its own contextmenu ~100 ms after ours: swallow it (and a click right after the lift).
    const onNativeContext = (e: MouseEvent): void => {
        if ((e as MouseEvent & { mtSynthetic?: boolean }).mtSynthetic) return;
        if (fired && Date.now() - firedAt < 1500 && e.isTrusted) {
            e.preventDefault();
            e.stopPropagation();
        }
    };
    const onClick = (e: MouseEvent): void => {
        if (fired && Date.now() - firedAt < 800 && !(e.target as Element | null)?.closest?.(".mx_ContextualMenu")) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const opts: AddEventListenerOptions = { capture: true, passive: true };
    document.addEventListener("touchstart", onStart, opts);
    document.addEventListener("touchmove", onMove, opts);
    document.addEventListener("touchend", onEnd, { capture: true, passive: false });
    document.addEventListener("touchcancel", cancel, opts);
    document.addEventListener("contextmenu", onNativeContext, true);
    document.addEventListener("click", onClick, true);
    // a scroll of the timeline is not a long-press
    document.addEventListener("scroll", cancel, { capture: true, passive: true });
    return () => {
        document.removeEventListener("touchstart", onStart, opts);
        document.removeEventListener("touchmove", onMove, opts);
        document.removeEventListener("touchend", onEnd, { capture: true } as EventListenerOptions);
        document.removeEventListener("touchcancel", cancel, opts);
        document.removeEventListener("contextmenu", onNativeContext, true);
        document.removeEventListener("click", onClick, true);
        document.removeEventListener("scroll", cancel, { capture: true } as EventListenerOptions);
    };
}
