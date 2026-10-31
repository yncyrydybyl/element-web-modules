/**
 * Small colour maths for the canvas, which can't use CSS `color-mix()`: theme tokens arrive as
 * `#rrggbb` or `rgb()` strings and sigma takes `rgba()` strings back.
 */

export type Rgb = [number, number, number];

export function parseColour(colour: string): Rgb | undefined {
    const c = colour.trim();
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i.exec(c);
    if (hex) {
        const h = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join("") : hex[1];
        return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as Rgb;
    }
    const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(c);
    return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : undefined;
}

/** `amount` of `a` over `b`, like `color-mix(in srgb, a amount, b)`. */
export function mix(a: string | Rgb, b: string | Rgb, amount: number): string {
    const x = typeof a === "string" ? parseColour(a) : a;
    const y = typeof b === "string" ? parseColour(b) : b;
    if (!x || !y) return typeof a === "string" ? a : rgba(a, 1);
    return rgba(x.map((v, i) => v * amount + y[i] * (1 - amount)) as Rgb, 1);
}

export function withAlpha(colour: string | Rgb, alpha: number): string {
    const c = typeof colour === "string" ? parseColour(colour) : colour;
    return c ? rgba(c, alpha) : (colour as string);
}

function rgba([r, g, b]: Rgb, a: number): string {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}
