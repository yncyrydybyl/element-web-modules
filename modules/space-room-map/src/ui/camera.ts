/**
 * Camera flights that zoom out, pan and zoom back in (van Wijk & Nuij, "Smooth and efficient
 * zooming and panning", as in d3.interpolateZoom), instead of sigma's straight interpolation,
 * which slides far targets past at full zoom. Instant when the user prefers reduced motion.
 */

import type { CameraState } from "sigma/types";

interface Camera {
    getState(): CameraState;
    setState(state: Partial<CameraState>): void;
}

export interface Flight {
    cancel(): void;
}

const RHO = Math.SQRT2;
const MIN_MS = 250;
const MAX_MS = 900;

/** sigma's camera: x and y in the framed graph's [0, 1] space; ratio 1 shows the whole frame. */
export function flyTo(camera: Camera, target: { x: number; y: number; ratio: number }, reducedMotion = prefersReducedMotion()): Flight {
    const from = camera.getState();
    if (reducedMotion) {
        camera.setState(target);
        return { cancel: () => undefined };
    }
    const path = zoomPath([from.x, from.y, from.ratio], [target.x, target.y, target.ratio]);
    const duration = Math.min(MAX_MS, Math.max(MIN_MS, path.duration));
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const [x, y, ratio] = path.at(easeInOutCubic(t));
        camera.setState({ x, y, ratio });
        if (t < 1) frame = requestAnimationFrame(step);
    });
    return { cancel: () => cancelAnimationFrame(frame) };
}

export function prefersReducedMotion(): boolean {
    return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** View [centre x, centre y, width] → interpolator along the optimal path, with a duration in ms. */
export function zoomPath(
    [ux0, uy0, w0]: [number, number, number],
    [ux1, uy1, w1]: [number, number, number],
): { at(t: number): [number, number, number]; duration: number } {
    const dx = ux1 - ux0;
    const dy = uy1 - uy0;
    const d2 = dx * dx + dy * dy;
    // Nearly the same centre: zoom only.
    if (d2 < 1e-12) {
        const S = Math.log(w1 / w0) / RHO;
        return { at: (t) => [ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(RHO * t * S)], duration: Math.abs(S) * 1000 * 0.8 };
    }
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + RHO ** 4 * d2) / (2 * w0 * RHO ** 2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - RHO ** 4 * d2) / (2 * w1 * RHO ** 2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    const S = (r1 - r0) / RHO;
    return {
        at: (t) => {
            const s = t * S;
            const coshr0 = Math.cosh(r0);
            const u = (w0 / (RHO * RHO * d1)) * (coshr0 * Math.tanh(RHO * s + r0) - Math.sinh(r0));
            return [ux0 + u * dx, uy0 + u * dy, (w0 * coshr0) / Math.cosh(RHO * s + r0)];
        },
        duration: S * 1000 * 0.8,
    };
}
