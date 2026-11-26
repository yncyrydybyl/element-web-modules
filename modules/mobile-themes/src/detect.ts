/**
 * Decides whether the current window should get the mobile treatment and keeps <html> attributes in sync.
 *
 *   html[data-mt-mobile="narrow coarse"]  present when the viewport is narrow OR the primary pointer is coarse;
 *                                         the value lists the reasons (space separated, use ~= in selectors)
 *   html[data-mt-pointer="coarse|fine"]   primary pointer
 *   html[data-mt-orientation="portrait|landscape"]
 *   html[data-mt-compact]                 phone-sized: narrow, or coarse pointer AND short (≤ 500 px high = landscape
 *                                         phone). Drives the single-pane shell and full-screen dialogs; a tablet
 *                                         (coarse, wide, tall) keeps Element's multi-pane layout (MOB-33).
 *
 * Absent attributes = desktop behaviour, so every rule in mobile.css is a no-op on desktop.
 */
export type Force = "on" | "off" | null;

export interface DetectOptions {
    /** Viewport width (CSS px) at or below which we count as "narrow". Element auto-collapses its room list at 768. */
    maxWidth: number;
    /** "on"/"off" overrides detection (config `force` or `?mt_mobile=1|0`). */
    force: Force;
}

export interface DetectState {
    mobile: boolean;
    reasons: string[];
    /** phone-sized (see header) */
    compact: boolean;
    pointer: "coarse" | "fine";
    orientation: "portrait" | "landscape";
}

/** Height (CSS px) at or below which a coarse-pointer device counts as a phone in landscape. */
const SHORT_PX = 500;

/**
 * On touch devices the *screen* orientation: `(orientation)` media queries compare the layout viewport, which flips
 * to "landscape" when an Android keyboard (interactive-widget=resizes-content) shrinks the viewport.
 */
export function screenOrientation(coarse = window.matchMedia("(pointer: coarse)").matches): "portrait" | "landscape" {
    if (coarse) {
        // wider than the screen's short side = landscape; a keyboard only ever shrinks the height
        const short = Math.min(screen.width || 0, screen.height || 0);
        if (short > 0) return window.innerWidth > short + 1 ? "landscape" : "portrait";
        const t = screen.orientation?.type;
        if (t) return t.startsWith("portrait") ? "portrait" : "landscape";
    }
    return window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape";
}

const root = (): HTMLElement => document.documentElement;

export function computeState(opts: DetectOptions): DetectState {
    const narrow = window.matchMedia(`(max-width: ${opts.maxWidth}px)`).matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const short = window.matchMedia(`(max-height: ${SHORT_PX}px)`).matches;
    const reasons: string[] = [];
    if (narrow) reasons.push("narrow");
    if (coarse) reasons.push("coarse");
    let mobile = reasons.length > 0;
    if (opts.force === "on") {
        mobile = true;
        reasons.push("forced");
    } else if (opts.force === "off") {
        mobile = false;
    }
    return {
        mobile,
        reasons,
        compact: mobile && (narrow || (coarse && short) || opts.force === "on"),
        pointer: coarse ? "coarse" : "fine",
        orientation: screenOrientation(coarse),
    };
}

export function applyState(s: DetectState): void {
    const el = root();
    if (s.mobile) el.setAttribute("data-mt-mobile", s.reasons.join(" "));
    else el.removeAttribute("data-mt-mobile");
    if (s.compact) el.setAttribute("data-mt-compact", "");
    else el.removeAttribute("data-mt-compact");
    el.setAttribute("data-mt-pointer", s.pointer);
    el.setAttribute("data-mt-orientation", s.orientation);
}

export function clearState(): void {
    const el = root();
    for (const a of ["data-mt-compact", "data-mt-mobile", "data-mt-pointer", "data-mt-orientation"]) el.removeAttribute(a);
}

/** Re-evaluates on every relevant media change. Returns a disposer. */
export function watch(opts: DetectOptions, onChange: (s: DetectState) => void): () => void {
    const queries = [`(max-width: ${opts.maxWidth}px)`, "(pointer: coarse)", "(orientation: portrait)", `(max-height: ${SHORT_PX}px)`].map((q) => window.matchMedia(q));
    const handler = (): void => onChange(computeState(opts));
    for (const q of queries) q.addEventListener("change", handler);
    screen.orientation?.addEventListener?.("change", handler);
    window.addEventListener("resize", handler);
    return () => {
        window.removeEventListener("resize", handler);
        screen.orientation?.removeEventListener?.("change", handler);
        for (const q of queries) q.removeEventListener("change", handler);
    };
}
