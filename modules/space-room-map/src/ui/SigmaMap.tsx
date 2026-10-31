/**
 * Renders the map with sigma.js (WebGL): pan, zoom, hover, hit testing and label placement come
 * from sigma. This component maps the module's state (search matches, selection, unread counts,
 * avatars) onto sigma's node reducer and wires up clicks, camera flights and the tooltip.
 */

import { useEffect, useLayoutEffect, useRef, useState, type JSX, type ReactNode } from "react";
import Sigma from "sigma";
import type { NodeLabelDrawingFunction } from "sigma/rendering";
import type { Settings } from "sigma/settings";

import type { MapGraph, NodeAttrs } from "../views";
import { flyTo, type Flight } from "./camera";
import { mix, withAlpha } from "./colour";
import { buildPrograms } from "./programs";
import { readTheme, type Theme } from "./theme";

/** Where the camera should go: a room or space by id, a node by key (the "Other rooms" circle), or everything. */
export interface FocusTarget {
    roomId?: string;
    nodeKey?: string;
    overview?: boolean;
    nonce: number;
}

export interface SigmaMapProps {
    /** Read once: the map is built when it opens. */
    graph: MapGraph;
    /** Room ids matching the search; null when there is no query. */
    matches: Set<string> | null;
    selected?: string;
    current?: string;
    focus: FocusTarget | null;
    label: string;
    onActivate(roomId: string): void;
    /** `blob:` URL of a loaded avatar. */
    avatarUrl?(mxc: string | undefined): string | undefined;
    /** Average colour of a loaded avatar. */
    avatarColour?(mxc: string | undefined): string | undefined;
    /** Changes when more avatars have loaded. */
    avatarVersion?: number;
    /** Content of the tooltip shown while the pointer is over a node. */
    tooltip?(node: NodeAttrs): ReactNode;
    /** Drawn over the map (the legend). */
    children?: ReactNode;
}

/** Gap between the pointer and the tooltip. */
const TIP_OFFSET = 14;
/** Moving from one node to the next doesn't blink the tooltip off and on. */
const TIP_HIDE_MS = 120;
/** On opening, how long the map may stay hidden while the first avatars become textures. */
const REVEAL_WAIT_MS = 250;
/** Dot grid spacing on screen, kept within [GRID, 2 × GRID) at any zoom. */
const GRID = 24;
/** The camera showing the whole map. */
const OVERVIEW = { x: 0.5, y: 0.5, ratio: 1 };

export function SigmaMap(props: SigmaMapProps): JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null);
    const propsRef = useRef(props);
    propsRef.current = props;
    const sigmaRef = useRef<Sigma<NodeAttrs> | null>(null);
    const flightRef = useRef<Flight | null>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const lastTip = useRef<ReactNode>(null);
    const pointer = useRef({ x: 0, y: 0 });
    const [hovered, setHovered] = useState<NodeAttrs | null>(null);
    const [ready, setReady] = useState(false);

    const fly = (target: { x: number; y: number; ratio: number }): void => {
        const sigma = sigmaRef.current;
        if (!sigma) return;
        flightRef.current?.cancel();
        flightRef.current = flyTo(sigma.getCamera(), target);
    };

    useEffect(() => {
        const container = containerRef.current!;
        const theme = readTheme();
        let sigma: Sigma<NodeAttrs> | undefined;
        let programs: ReturnType<typeof buildPrograms>;
        try {
            const { drawLabel, drawHover } = labelDrawers(theme);
            programs = buildPrograms(drawLabel, drawHover);
            sigma = new Sigma(props.graph, container, {
                ...settings(theme, propsRef),
                ...programs.settings,
            } as Partial<Settings<NodeAttrs>>);
        } catch (e) {
            // No WebGL (or a test environment): the list still works.
            console.warn("[space-room-map] Can't render the map", e);
            setReady(true);
            return;
        }
        sigmaRef.current = sigma;
        fitCircles(sigma);

        // Show the map once the first avatars are textures, so they don't pop in a moment later.
        let revealTimer: ReturnType<typeof setTimeout> | undefined;
        const reveal = (): void => {
            clearTimeout(revealTimer);
            programs.textures?.off("newTexture", onTexture);
            setReady(true);
        };
        const onTexture = (): void => void requestAnimationFrame(reveal);
        const hasAvatars = sigma.getGraph().someNode((_, a) => Boolean(propsRef.current.avatarUrl?.(a.avatar)));
        if (hasAvatars && programs.textures) {
            programs.textures.on("newTexture", onTexture);
            revealTimer = setTimeout(reveal, REVEAL_WAIT_MS);
        } else {
            reveal();
        }

        // The dot grid moves and scales with the camera, like a surface the map lies on.
        sigma.on("afterRender", () => {
            const origin = sigma.framedGraphToViewport({ x: 0, y: 0 });
            let size = GRID / sigma.getCamera().ratio;
            while (size >= GRID * 2) size /= 2;
            while (size < GRID) size *= 2;
            container.style.setProperty("--srm-grid-size", `${size}px`);
            container.style.setProperty("--srm-grid-x", `${origin.x % size}px`);
            container.style.setProperty("--srm-grid-y", `${origin.y % size}px`);
        });

        let hideTimer: ReturnType<typeof setTimeout> | undefined;
        sigma.on("enterNode", ({ node, event }) => {
            clearTimeout(hideTimer);
            container.style.cursor = "pointer";
            setHovered(sigma.getGraph().getNodeAttributes(node));
            placeTip(event.x, event.y);
        });
        sigma.on("leaveNode", () => {
            container.style.cursor = "";
            hideTimer = setTimeout(() => setHovered(null), TIP_HIDE_MS);
        });
        // The tooltip follows the pointer, so it stays near it even on a space circle that fills the view.
        const onPointerMove = (ev: MouseEvent): void => {
            const rect = container.getBoundingClientRect();
            placeTip(ev.clientX - rect.left, ev.clientY - rect.top);
        };
        const onPointerLeave = (): void => setHovered(null);
        // The user takes over the camera.
        const stopFlight = (): void => flightRef.current?.cancel();
        container.addEventListener("mousemove", onPointerMove);
        container.addEventListener("mouseleave", onPointerLeave);
        container.addEventListener("wheel", stopFlight, { passive: true });
        container.addEventListener("mousedown", stopFlight);
        container.addEventListener("touchstart", stopFlight, { passive: true });

        sigma.on("clickNode", ({ node }) => {
            const a = sigma.getGraph().getNodeAttributes(node);
            if (a.container) {
                // A space circle zooms in first; once it fills the view, a click opens its home.
                const target = focusState(sigma, node);
                if (sigma.getCamera().ratio > target.ratio * 1.3 || !a.roomId) {
                    fly(target);
                    return;
                }
            }
            if (a.roomId) propsRef.current.onActivate(a.roomId);
        });
        sigma.on("doubleClickNode", (e) => e.preventSigmaDefault());
        sigma.on("clickStage", () => fly(OVERVIEW));

        return () => {
            clearTimeout(revealTimer);
            clearTimeout(hideTimer);
            programs.textures?.off("newTexture", onTexture);
            flightRef.current?.cancel();
            container.removeEventListener("mousemove", onPointerMove);
            container.removeEventListener("mouseleave", onPointerLeave);
            container.removeEventListener("wheel", stopFlight);
            container.removeEventListener("mousedown", stopFlight);
            container.removeEventListener("touchstart", stopFlight);
            sigma.kill();
            sigmaRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Search, selection, current room and avatars only change how nodes look.
    useEffect(() => {
        sigmaRef.current?.refresh({ skipIndexation: true });
    }, [props.matches, props.selected, props.current, props.avatarVersion]);

    useEffect(() => {
        const sigma = sigmaRef.current;
        const focus = props.focus;
        if (!sigma || !focus) return;
        if (focus.overview) return fly(OVERVIEW);
        let node = focus.nodeKey && sigma.getGraph().hasNode(focus.nodeKey) ? focus.nodeKey : undefined;
        if (!node && focus.roomId) {
            sigma.getGraph().forEachNode((key, a) => {
                if (!node && a.roomId === focus.roomId) node = key;
            });
        }
        if (node) fly(focusState(sigma, node));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.focus]);

    // The tooltip's size is only known once its content has rendered.
    useLayoutEffect(() => placeTip(pointer.current.x, pointer.current.y), [hovered]); // eslint-disable-line react-hooks/exhaustive-deps

    const placeTip = (x: number, y: number): void => {
        pointer.current = { x, y };
        const tip = tipRef.current;
        const box = containerRef.current;
        if (!tip || !box) return;
        // Below right of the pointer; flipped to the other side near the right and bottom edges.
        const left = x + TIP_OFFSET + tip.offsetWidth > box.clientWidth ? x - TIP_OFFSET - tip.offsetWidth : x + TIP_OFFSET;
        const top = y + TIP_OFFSET + tip.offsetHeight > box.clientHeight ? y - TIP_OFFSET - tip.offsetHeight : y + TIP_OFFSET;
        tip.style.transform = `translate(${Math.max(4, left)}px, ${Math.max(4, top)}px)`;
    };
    const tip = hovered && props.tooltip?.(hovered);
    // Kept while fading out.
    if (tip) lastTip.current = tip;

    return (
        <div className="srm-stage">
            <div ref={containerRef} className={`srm-map${ready ? " srm-map--ready" : ""}`} role="img" aria-label={props.label} />
            {/* Pointer-only: keyboard users get the same details in the list. */}
            <div ref={tipRef} className="srm-tooltip" data-visible={Boolean(tip)} aria-hidden="true">
                {tip || lastTip.current}
            </div>
            {props.children}
        </div>
    );
}

/** Camera state that shows a node: a space fills the view; a room shows with its space around it. */
function focusState(sigma: Sigma<NodeAttrs>, node: string): { x: number; y: number; ratio: number } {
    const graph = sigma.getGraph();
    const display = sigma.getNodeDisplayData(node)!;
    const a = graph.getNodeAttributes(node);
    // Graph units → camera ratio, relative to the whole map's extent.
    const { x, y } = sigma.getCustomBBox() ?? sigma.getBBox();
    const extent = Math.max(x[1] - x[0], y[1] - y[0]);
    const ratioFor = (radius: number, fill: number): number => Math.max(0.0005, ((2 * radius) / extent) * fill);
    if (a.container) return { x: display.x, y: display.y, ratio: ratioFor(a.size, 1.15) };
    const parentKey = node.slice(0, node.lastIndexOf("/"));
    if (parentKey && graph.hasNode(parentKey)) {
        const parent = graph.getNodeAttributes(parentKey);
        const ratio = ratioFor(parent.size, 1.15);
        // A room that would be tiny inside its whole space gets a closer look.
        if (ratio <= ratioFor(a.size, 10)) {
            const p = sigma.getNodeDisplayData(parentKey)!;
            return { x: p.x, y: p.y, ratio };
        }
    }
    return { x: display.x, y: display.y, ratio: ratioFor(a.size, 8) };
}

/**
 * Frames the whole packing. sigma fits the camera to node centres only, so with few spaces the
 * outer circles would reach past the edges.
 */
function fitCircles(sigma: Sigma<NodeAttrs>): void {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    sigma.getGraph().forEachNode((_, a) => {
        x0 = Math.min(x0, a.x - a.size);
        x1 = Math.max(x1, a.x + a.size);
        y0 = Math.min(y0, a.y - a.size);
        y1 = Math.max(y1, a.y + a.size);
    });
    if (x0 < x1) sigma.setCustomBBox({ x: [x0, x1], y: [y0, y1] });
}

function settings(theme: Theme, propsRef: { current: SigmaMapProps }): Partial<Settings<NodeAttrs>> {
    return {
        allowInvalidContainer: true,
        renderEdgeLabels: false,
        zIndex: true,
        stagePadding: 40,
        labelFont: theme.font,
        labelSize: 13,
        labelWeight: "500",
        labelColor: { color: theme.text },
        // Labels decide themselves whether they're big enough (see labelDrawers).
        labelRenderedSizeThreshold: 0,
        // Sizes are in graph units and scale exactly with zoom, as circle packing needs.
        itemSizesReference: "positions",
        zoomToSizeRatioFunction: (ratio) => ratio,
        minCameraRatio: 0.0005,
        maxCameraRatio: 3,
        nodeReducer: (_, a) => {
            const { matches, selected, current, avatarUrl, avatarColour } = propsRef.current;
            const lit = !matches || (a.roomId !== undefined && matches.has(a.roomId));
            // Every name is drawn, fading in with size: no labels popping in and out while zooming.
            const out: Record<string, unknown> = { ...a, forceLabel: true };

            if (a.container) {
                // Tinted with the space's avatar (or its own colour), lighter at every other depth.
                const tint = a.kind === "group" ? theme.hover : (avatarColour?.(a.avatar) ?? theme.decorative[colourIndex(a.roomId ?? a.label)].fg);
                const strength = theme.highContrast ? 0 : a.depth % 2 ? 0.07 : 0.13;
                Object.assign(out, {
                    type: "container",
                    color: mix(tint, a.depth % 2 ? theme.spaceFill : theme.groupFill, strength),
                    borderColor: theme.highContrast ? theme.border : mix(tint, theme.bg, 0.35),
                    borderSize: 1,
                });
                if (a.roomId && a.roomId === selected) Object.assign(out, { borderColor: theme.accent, borderSize: 3 });
                return out;
            }

            out.type = "room";
            out.color = lit ? theme.decorative[colourIndex(a.roomId ?? a.label)].bg : theme.dim;
            // Faded nodes are plain discs; a photo would stand out more than the search matches.
            if (lit) out.image = avatarUrl?.(a.avatar);
            else out.label = "";

            let ring: string | undefined;
            let glow: string | undefined;
            if (a.highlight) (ring = theme.highlight), (glow = theme.highlight);
            else if (a.unread) (ring = theme.unread), (glow = theme.unread);
            if (a.roomId && a.roomId === current) ring = theme.text;
            if (ring && lit) Object.assign(out, { borderColor: ring, borderSize: 3 });
            if (a.roomId && a.roomId === selected) {
                Object.assign(out, { borderColor: theme.accent, borderSize: 4, zIndex: 1000 });
                glow = theme.accent;
            }
            // A thin gap between the ring and the avatar keeps both readable.
            if (out.borderSize) Object.assign(out, { gapSize: 1.5, gapColor: theme.bg });
            if (glow && lit && !theme.highContrast) Object.assign(out, { haloColor: withAlpha(glow, 0.5), haloSpread: 1.3 });
            return out;
        },
    };
}

/** Names fade in as their circle grows, instead of popping. */
function labelDrawers(theme: Theme): Record<"drawLabel" | "drawHover", NodeLabelDrawingFunction<NodeAttrs>> {
    const fade = (v: number, from: number, to: number): number => Math.min(1, Math.max(0, (v - from) / (to - from)));
    const drawLabel: NodeLabelDrawingFunction<NodeAttrs> = (ctx, data, s) => {
        if (!data.label) return;
        const attrs = data as Partial<NodeAttrs> & typeof data & { image?: string };
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (attrs.container) {
            // Space names sit above their circle, outlined in the background colour.
            ctx.globalAlpha = fade(data.size, 22, 40);
            if (ctx.globalAlpha > 0) {
                ctx.font = `600 ${s.labelSize}px ${s.labelFont}`;
                const y = data.y - data.size - 9;
                ctx.lineJoin = "round";
                ctx.lineWidth = 3.5;
                ctx.strokeStyle = theme.bg;
                ctx.strokeText(data.label, data.x, y);
                ctx.fillStyle = theme.text;
                ctx.fillText(data.label, data.x, y);
            }
        } else if (attrs.image) {
            // Rooms with an avatar: the name in a pill under the circle, so the picture stays visible.
            ctx.globalAlpha = fade(data.size, 12, 22);
            if (ctx.globalAlpha > 0) {
                const fontSize = Math.min(14, Math.max(10, data.size / 3));
                ctx.font = `600 ${fontSize}px ${s.labelFont}`;
                const text = truncate(ctx, data.label, Math.max(data.size * 2.4, 80));
                const width = ctx.measureText(text).width;
                const h = fontSize + 6;
                const top = data.y + data.size + 3;
                ctx.fillStyle = theme.labelBg;
                ctx.beginPath();
                ctx.roundRect(data.x - width / 2 - 6, top, width + 12, h, h / 2);
                ctx.fill();
                ctx.fillStyle = theme.text;
                ctx.fillText(text, data.x, top + h / 2);
            }
        } else {
            // The name inside the circle, like the initials in Element's avatars.
            ctx.globalAlpha = fade(data.size, 16, 28);
            if (ctx.globalAlpha > 0) {
                ctx.font = `600 ${Math.min(14, Math.max(10, data.size / 3))}px ${s.labelFont}`;
                ctx.fillStyle = attrs.roomId ? theme.decorative[colourIndex(attrs.roomId)].fg : theme.text;
                ctx.fillText(truncate(ctx, data.label, data.size * 1.8), data.x, data.y);
            }
        }
        ctx.restore();
    };
    // Nothing extra on hover: the tooltip has the details.
    return { drawLabel, drawHover: drawLabel };
}

function truncate(ctx: CanvasRenderingContext2D, text: string, max: number): string {
    if (ctx.measureText(text).width <= max) return text;
    const chars = Array.from(text);
    while (chars.length && ctx.measureText(chars.join("") + "…").width > max) chars.pop();
    return chars.length ? chars.join("").trimEnd() + "…" : "";
}

/** Same colour pick as Element's avatars (Compound's useIdColorHash). */
export function colourIndex(id: string): number {
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    return sum % 6;
}
