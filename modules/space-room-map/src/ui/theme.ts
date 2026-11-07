import type { DistrictId } from "../districts";

/**
 * Colours for the canvas, read from Element's Compound design tokens. A canvas can't use CSS
 * variables, so they are resolved once when the map opens; the fallbacks are Compound's light theme.
 */

export interface Theme {
    font: string;
    bg: string;
    text: string;
    border: string;
    /** Nodes and edges that don't match the search. */
    dim: string;
    accent: string;
    hover: string;
    spaceFill: string;
    groupFill: string;
    labelBg: string;
    unread: string;
    highlight: string;
    decorative: Array<{ bg: string; fg: string }>;
    /** Element's high-contrast themes, or the OS asking for more contrast: no glows or tints. */
    highContrast: boolean;
}

export function readTheme(el: Element = document.body): Theme {
    const style = getComputedStyle(el);
    const v = (name: string, fallback: string): string => style.getPropertyValue(name).trim() || fallback;
    const decorativeFallbacks: Array<[string, string]> = [
        ["#e0f8d9", "#005f00"],
        ["#e3f5f8", "#00566e"],
        ["#faeefb", "#82008f"],
        ["#f1efff", "#5d26cd"],
        ["#ffecf0", "#9f0850"],
        ["#ffefe4", "#9b2200"],
    ];
    return {
        font: v("--cpd-font-family-sans", "Inter, system-ui, sans-serif"),
        bg: v("--cpd-color-bg-canvas-default", "#ffffff"),
        text: v("--cpd-color-text-primary", "#1b1d22"),
        border: v("--cpd-color-border-interactive-secondary", "#cdd3da"),
        dim: v("--cpd-color-border-disabled", "#e1e6ec"),
        accent: v("--cpd-color-border-focused", "#0467dd"),
        hover: v("--cpd-color-icon-secondary", "#656d77"),
        spaceFill: v("--cpd-color-bg-subtle-secondary", "#f0f2f5"),
        groupFill: v("--cpd-color-bg-subtle-primary", "#e1e6ec"),
        labelBg: v("--cpd-color-bg-canvas-default", "#ffffff"),
        unread: v("--cpd-color-icon-success-primary", "#007a62"),
        highlight: v("--cpd-color-icon-critical-primary", "#d51928"),
        decorative: decorativeFallbacks.map(([bg, fg], i) => ({
            bg: v(`--cpd-color-bg-decorative-${i + 1}`, bg),
            fg: v(`--cpd-color-text-decorative-${i + 1}`, fg),
        })),
        highContrast:
            /(^|\s)cpd-theme-[a-z]+-hc(\s|$)/.test(`${document.documentElement.className} ${document.body.className}`) ||
            (typeof matchMedia === "function" && matchMedia("(prefers-contrast: more)").matches),
    };
}

/**
 * One colour per district, from Compound's decorative palette. Green and red are left out: on
 * the map they mean unread messages and mentions. Unsorted and the archive stay grey.
 */
const DISTRICT_DECORATIVE: Partial<Record<DistrictId, number>> = { communities: 3, events: 5, people: 2, bridges: 1 };

export function districtColour(theme: Theme, district: DistrictId): { bg: string; fg: string } {
    const i = DISTRICT_DECORATIVE[district];
    if (i !== undefined) return theme.decorative[i];
    return district === "archive" ? { bg: theme.dim, fg: theme.border } : { bg: theme.groupFill, fg: theme.hover };
}
