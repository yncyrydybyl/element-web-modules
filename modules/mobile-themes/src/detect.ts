/**
 * Decides whether the current window should get the mobile treatment and keeps <html> attributes in sync.
 *
 *   html[data-mt-mobile="narrow coarse"]  present when the viewport is narrow OR the primary pointer is coarse;
 *                                         the value lists the reasons (space separated, use ~= in selectors)
 *   html[data-mt-pointer="coarse|fine"]   primary pointer
 *   html[data-mt-orientation="portrait|landscape"]
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
    pointer: "coarse" | "fine";
    orientation: "portrait" | "landscape";
}

const root = (): HTMLElement => document.documentElement;

export function computeState(opts: DetectOptions): DetectState {
    const narrow = window.matchMedia(`(max-width: ${opts.maxWidth}px)`).matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
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
        pointer: coarse ? "coarse" : "fine",
        orientation: window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape",
    };
}

export function applyState(s: DetectState): void {
    const el = root();
    if (s.mobile) el.setAttribute("data-mt-mobile", s.reasons.join(" "));
    else el.removeAttribute("data-mt-mobile");
    el.setAttribute("data-mt-pointer", s.pointer);
    el.setAttribute("data-mt-orientation", s.orientation);
}

export function clearState(): void {
    const el = root();
    for (const a of ["data-mt-mobile", "data-mt-pointer", "data-mt-orientation"]) el.removeAttribute(a);
}

/** Re-evaluates on every relevant media change. Returns a disposer. */
export function watch(opts: DetectOptions, onChange: (s: DetectState) => void): () => void {
    const queries = [`(max-width: ${opts.maxWidth}px)`, "(pointer: coarse)", "(orientation: portrait)"].map((q) => window.matchMedia(q));
    const handler = (): void => onChange(computeState(opts));
    for (const q of queries) q.addEventListener("change", handler);
    return () => {
        for (const q of queries) q.removeEventListener("change", handler);
    };
}
