import React from "react";
import type { Variant } from "../types";
import type { PickerController } from "./controller";

export function useController(c: PickerController): number {
    const [n, setN] = React.useState(0);
    React.useEffect(() => c.subscribe(() => setN((x) => x + 1)), [c]);
    return n;
}

/** Catalogue order of stages, unknown ones sorted after. */
export const STAGE_ORDER = [
    "pure",
    "usable",
    "past",
    "future",
    "exciting",
    "comic",
    "cyberpunk",
    "crossover",
    "level-1",
    "level-2",
    "level-3",
    "level-4",
    "level-5",
    "level-6",
    "level-7",
    "level-8",
];

export function stageRank(s: string): number {
    const i = STAGE_ORDER.indexOf(s);
    return i < 0 ? 100 : i;
}

function tok(v: Variant, names: string[], fallback: string): string {
    for (const n of names) {
        const val = v.tokens?.[n];
        if (val && !/var\(/.test(val)) return val;
    }
    return fallback;
}

export function swatch(v: Variant): { bg: string; side: string; text: string; muted: string; accent: string } {
    const dark = v.base === "dark";
    return {
        bg: tok(v, ["--cpd-color-bg-canvas-default", "--cpd-color-theme-bg"], dark ? "#101317" : "#ffffff"),
        side: tok(v, ["--cpd-color-bg-subtle-secondary", "--cpd-color-bg-subtle-primary"], dark ? "#1d1f24" : "#f0f2f5"),
        text: tok(v, ["--cpd-color-text-primary"], dark ? "#ebeef2" : "#1b1d22"),
        muted: tok(v, ["--cpd-color-text-secondary"], dark ? "#808994" : "#656d77"),
        accent: tok(v, ["--cpd-color-bg-accent-rest", "--cpd-color-text-action-accent", "--cpd-color-bg-action-primary-rest"], "#0dbd8b"),
    };
}

/** A tiny mock of Element in the variant's colours (from its tokens). */
export function Swatch({ v }: { v: Variant | null }): React.JSX.Element {
    if (!v) {
        return (
            <div className="tl-swatch tl-swatch-default" aria-hidden="true">
                <div className="tl-swatch-half tl-swatch-light" />
                <div className="tl-swatch-half tl-swatch-dark" />
            </div>
        );
    }
    const s = swatch(v);
    return (
        <div className="tl-swatch" aria-hidden="true" style={{ background: s.bg }}>
            <div className="tl-swatch-side" style={{ background: s.side }}>
                <i style={{ background: s.accent }} />
                <i style={{ background: s.muted }} />
                <i style={{ background: s.muted }} />
            </div>
            <div className="tl-swatch-main">
                <b style={{ background: s.text }} />
                <b style={{ background: s.muted, width: "70%" }} />
                <b style={{ background: s.text, width: "55%" }} />
                <span style={{ background: s.accent }} />
            </div>
            {v.mode === "daylight" && <em className="tl-swatch-sun">☀︎☾</em>}
        </div>
    );
}
