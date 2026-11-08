/**
 * Renders the people map with sigma.js (WebGL): pan, zoom, hover and hit testing come from sigma.
 * The sectors, their names and the closeness rings are drawn on a canvas under sigma's, so they
 * move with the camera but cost nothing in WebGL.
 */

import { useEffect, useLayoutEffect, useRef, useState, type JSX, type ReactNode } from "react";
import Sigma from "sigma";
import type { NodeLabelDrawingFunction } from "sigma/rendering";
import type { Settings } from "sigma/settings";

import { nodeKey, STEP, type PeopleLayout, type PeopleNode } from "../layout";
import { flyTo, type Flight, type SavedCamera } from "./camera";
import { mix, premultiplied, withAlpha } from "./colour";
import { buildPrograms } from "./programs";
import { districtColour, readTheme, type Theme } from "./theme";
import { placeTooltip } from "./tooltip";

export interface FocusTarget {
    personId?: string;
    /** Everyone of a group (a room's members): the view that fits them all. */
    people?: string[];
    overview?: boolean;
    nonce: number;
}

export interface PeopleMapProps {
    /** Read once: the map is built when it opens. */
    layout: PeopleLayout;
    /** People matching the search and filters; null when everyone is shown. */
    matches: Set<string> | null;
    selected?: string;
    /** Pointed at in the list (a person, or everyone in a room): glowing on the map, without moving it. */
    glow?: ReadonlySet<string> | null;
    focus: FocusTarget | null;
    label: string;
    /** A person was clicked; undefined: you, in the middle. */
    onActivate(personId: string | undefined): void;
    avatarUrl?(mxc: string | undefined): string | undefined;
    avatarVersion?: number;
    tooltip?(node: PeopleNode): ReactNode;
    /** Where the camera starts; everyone when missing. Read once. */
    camera?: SavedCamera;
    animate: boolean;
    onCameraChange?(camera: SavedCamera): void;
    children?: ReactNode;
}

const TIP_HIDE_MS = 120;
const REVEAL_WAIT_MS = 250;
const OVERVIEW = { x: 0.5, y: 0.5, ratio: 1 };
const INTRO_PAUSE_MS = 120;
/** Room for the sector names outside the outermost people. */
const LABEL_MARGIN = 36;
/** Closeness rings drawn as guides: the closest tenth, quarter and half. */
const GUIDES = [0.9, 0.75, 0.5];

export function PeopleMap(props: PeopleMapProps): JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null);
    const underRef = useRef<HTMLCanvasElement>(null);
    const tipRef = useRef<HTMLDivElement>(null);
    const propsRef = useRef(props);
    propsRef.current = props;
    const sigmaRef = useRef<Sigma<PeopleNode> | null>(null);
    const flightRef = useRef<Flight | null>(null);
    const lastTip = useRef<ReactNode>(null);
    const pointer = useRef({ x: 0, y: 0 });
    const [hovered, setHovered] = useState<PeopleNode | null>(null);
    const [ready, setReady] = useState(false);

    const fly = (target: { x: number; y: number; ratio: number }): void => {
        const sigma = sigmaRef.current;
        if (!sigma) return;
        flightRef.current?.cancel();
        if (propsRef.current.animate) flightRef.current = flyTo(sigma.getCamera(), target);
        else sigma.getCamera().setState(target);
    };

    useEffect(() => {
        const container = containerRef.current!;
        const theme = readTheme();
        const { graph, sectors } = props.layout;
        let sigma: Sigma<PeopleNode>;
        let programs: ReturnType<typeof buildPrograms>;
        try {
            const draw = labelDrawer(theme);
            programs = buildPrograms(draw, draw);
            sigma = new Sigma(graph, container, { ...settings(theme, propsRef), ...programs.settings } as Partial<Settings<PeopleNode>>);
        } catch (e) {
            // No WebGL (or a test environment): the list still works.
            console.warn("[people-map] Can't render the map", e);
            setReady(true);
            return;
        }
        sigmaRef.current = sigma;
        const reach = props.layout.outer + STEP + LABEL_MARGIN;
        sigma.setCustomBBox({ x: [-reach, reach], y: [-reach, reach] });
        const intro = !props.camera && props.animate && graph.order > 1;
        if (props.camera) sigma.getCamera().setState(props.camera);
        // Starting on you, then out to everyone once the map shows.
        else if (intro) sigma.getCamera().setState({ x: 0.5, y: 0.5, ratio: (ME_SIZE_VIEW * 2) / (2 * reach) });
        sigma.getCamera().on("updated", ({ x, y, ratio }) => propsRef.current.onCameraChange?.({ x, y, ratio }));

        let revealTimer: ReturnType<typeof setTimeout> | undefined;
        const reveal = (): void => {
            clearTimeout(revealTimer);
            programs.textures?.off("newTexture", onTexture);
            setReady(true);
            if (intro) setTimeout(() => fly(OVERVIEW), INTRO_PAUSE_MS);
        };
        const onTexture = (): void => void requestAnimationFrame(reveal);
        if (programs.textures && graph.someNode((_, a) => Boolean(propsRef.current.avatarUrl?.(a.avatar)))) {
            programs.textures.on("newTexture", onTexture);
            revealTimer = setTimeout(reveal, REVEAL_WAIT_MS);
        } else {
            reveal();
        }

        // Sectors, their names and the guide rings, under the people.
        const drawUnder = (): void => {
            const canvas = underRef.current;
            const ctx = canvas?.getContext("2d");
            if (!canvas || !ctx) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            const dpr = window.devicePixelRatio || 1;
            if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);
            const at = (r: number, a: number): { x: number; y: number } => sigma.graphToViewport({ x: Math.cos(a) * r, y: Math.sin(a) * r });
            const arc = (r: number, a0: number, a1: number, reverse = false): void => {
                const n = Math.max(2, Math.ceil(((a1 - a0) * 48) / Math.PI));
                for (let i = 0; i <= n; i++) {
                    const p = at(r, reverse ? a1 - ((a1 - a0) * i) / n : a0 + ((a1 - a0) * i) / n);
                    if (i === 0 && !reverse) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                }
            };
            const { layout, matches } = propsRef.current;
            const highContrast = theme.highContrast;
            for (const s of sectors) {
                const colour = districtColour(theme, s.district);
                ctx.beginPath();
                arc(layout.inner - STEP / 2, s.a0, s.a1);
                arc(s.r1, s.a0, s.a1, true);
                ctx.closePath();
                ctx.fillStyle = highContrast ? "transparent" : withAlpha(colour.bg, matches ? 0.35 : 0.6);
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.strokeStyle = highContrast ? theme.border : mix(colour.fg, theme.bg, 0.25);
                ctx.stroke();
            }
            // Guide rings: how close the closest tenth, quarter and half of your people are.
            ctx.save();
            ctx.setLineDash([3, 5]);
            ctx.strokeStyle = theme.border;
            ctx.lineWidth = 1;
            const range = layout.outer - layout.inner;
            for (const c of GUIDES) {
                const r = layout.inner + (1 - c) * range;
                if (r >= layout.outer) continue;
                ctx.beginPath();
                arc(r, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
            // Sector names, just outside their sector, in its colour.
            ctx.font = `600 13px ${theme.font}`;
            for (const s of sectors) {
                const mid = (s.a0 + s.a1) / 2;
                const p = at(s.r1, mid);
                const o = at(s.r1 + 1, mid);
                const dx = o.x - p.x;
                const dy = o.y - p.y;
                const len = Math.hypot(dx, dy) || 1;
                const x = p.x + (dx / len) * 10;
                const y = p.y + (dy / len) * 10;
                ctx.textAlign = dx / len > 0.3 ? "left" : dx / len < -0.3 ? "right" : "center";
                ctx.textBaseline = dy / len > 0.3 ? "top" : dy / len < -0.3 ? "bottom" : "middle";
                const text = `${s.label} · ${s.count}`;
                ctx.lineJoin = "round";
                ctx.lineWidth = 3.5;
                ctx.strokeStyle = theme.bg;
                ctx.strokeText(text, x, y);
                ctx.fillStyle = highContrast ? theme.text : districtColour(theme, s.district).fg;
                ctx.fillText(text, x, y);
            }
        };
        sigma.on("afterRender", drawUnder);

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
        const onPointerMove = (ev: MouseEvent): void => {
            const rect = container.getBoundingClientRect();
            placeTip(ev.clientX - rect.left, ev.clientY - rect.top);
        };
        const onPointerLeave = (): void => setHovered(null);
        const stopFlight = (): void => flightRef.current?.cancel();
        container.addEventListener("mousemove", onPointerMove);
        container.addEventListener("mouseleave", onPointerLeave);
        container.addEventListener("wheel", stopFlight, { passive: true });
        container.addEventListener("mousedown", stopFlight);
        container.addEventListener("touchstart", stopFlight, { passive: true });

        sigma.on("clickNode", ({ node }) => propsRef.current.onActivate(sigma.getGraph().getNodeAttribute(node, "personId")));
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

    useEffect(() => {
        sigmaRef.current?.refresh({ skipIndexation: true });
    }, [props.matches, props.selected, props.glow, props.avatarVersion]);

    useEffect(() => {
        const sigma = sigmaRef.current;
        const focus = props.focus;
        if (!sigma || !focus) return;
        const ids = focus.people ?? (focus.personId ? [focus.personId] : []);
        const keys = ids.map(nodeKey).filter((k) => sigma.getGraph().hasNode(k));
        if (focus.overview || !keys.length) return fly(OVERVIEW);
        const graph = sigma.getGraph();
        const xs = keys.map((k) => graph.getNodeAttribute(k, "x"));
        const ys = keys.map((k) => graph.getNodeAttribute(k, "y"));
        const shown = keys.map((k) => sigma.getNodeDisplayData(k)!);
        const { x } = sigma.getCustomBBox() ?? sigma.getBBox();
        // Everyone in view, with a few rings of neighbours around them.
        const extent = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 1.25 + STEP * 16;
        fly({
            x: (Math.min(...shown.map((d) => d.x)) + Math.max(...shown.map((d) => d.x))) / 2,
            y: (Math.min(...shown.map((d) => d.y)) + Math.max(...shown.map((d) => d.y))) / 2,
            ratio: Math.min(1, extent / (x[1] - x[0])),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.focus]);

    useLayoutEffect(() => placeTip(pointer.current.x, pointer.current.y), [hovered]); // eslint-disable-line react-hooks/exhaustive-deps

    const placeTip = (x: number, y: number): void => {
        pointer.current = { x, y };
        placeTooltip(tipRef.current, containerRef.current, x, y);
    };
    const tip = hovered && props.tooltip?.(hovered);
    if (tip) lastTip.current = tip;

    return (
        <div className="pm-stage">
            <canvas ref={underRef} className="pm-under" aria-hidden="true" />
            <div ref={containerRef} className={`pm-map${ready ? " pm-map--ready" : ""}`} role="img" aria-label={props.label} />
            <div ref={tipRef} className="pm-tooltip" data-visible={Boolean(tip)} aria-hidden="true">
                {tip || lastTip.current}
            </div>
            {props.children}
        </div>
    );
}

/** Your node's radius, in graph units, for the zoomed-in start. */
const ME_SIZE_VIEW = 40;

function settings(theme: Theme, propsRef: { current: PeopleMapProps }): Partial<Settings<PeopleNode>> {
    const veil = premultiplied(theme.bg, 0.7);
    return {
        allowInvalidContainer: true,
        renderEdgeLabels: false,
        zIndex: true,
        stagePadding: 24,
        labelFont: theme.font,
        labelSize: 12,
        labelWeight: "600",
        labelColor: { color: theme.text },
        labelRenderedSizeThreshold: 0,
        itemSizesReference: "positions",
        zoomToSizeRatioFunction: (ratio) => ratio,
        minCameraRatio: 0.01,
        maxCameraRatio: 2,
        nodeReducer: (_, a) => {
            const { matches, selected, glow, avatarUrl } = propsRef.current;
            const glowing = a.personId !== undefined && Boolean(glow?.has(a.personId));
            // A room's people glow and the others step back; one person just glows.
            const matching = !matches || (a.personId !== undefined && matches.has(a.personId));
            const lit = glowing || a.me || (matching && !(glow && glow.size > 1));
            const out: Record<string, unknown> = { ...a, type: "person", forceLabel: true };
            out.color = lit ? districtColour(theme, a.district).bg : theme.dim;
            if (lit) out.image = avatarUrl?.(a.avatar);
            else Object.assign(out, { label: "", veilColor: veil, zIndex: -1 });

            let ring: string | undefined;
            let size = 0;
            if (a.me) (ring = theme.text), (size = 3);
            else if (a.presence === "online") (ring = theme.unread), (size = 3);
            else if (a.hasDm) (ring = mix(theme.text, theme.bg, 0.55)), (size = 1.5);
            if (lit && ring) Object.assign(out, { borderColor: ring, borderSize: size });
            if (glowing) {
                // Big enough to find on the whole map.
                Object.assign(out, { borderColor: theme.accent, borderSize: 3, zIndex: 1000, label: a.label, size: a.size * 1.3 });
                if (!theme.highContrast) Object.assign(out, { haloColor: withAlpha(theme.accent, 0.55), haloSpread: 3 });
                delete out.veilColor;
            } else if (a.personId !== undefined && a.personId === selected) {
                Object.assign(out, { borderColor: theme.accent, borderSize: 4, zIndex: 1000, label: a.label });
                if (!theme.highContrast) Object.assign(out, { haloColor: withAlpha(theme.accent, 0.5), haloSpread: 1.4 });
                delete out.veilColor;
            }
            if (out.borderSize) Object.assign(out, { gapSize: 1.5, gapColor: theme.bg });
            return out;
        },
    };
}

/** A person's name in a pill under their circle, fading in as it grows; an initial inside when there's no picture. */
function labelDrawer(theme: Theme): NodeLabelDrawingFunction<PeopleNode> {
    const fade = (v: number, from: number, to: number): number => Math.min(1, Math.max(0, (v - from) / (to - from)));
    return (ctx, data, s) => {
        if (!data.label) return;
        const attrs = data as Partial<PeopleNode> & typeof data & { image?: string };
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (!attrs.image) {
            ctx.globalAlpha = fade(data.size, 4, 7);
            if (ctx.globalAlpha > 0) {
                ctx.font = `600 ${Math.max(9, Math.min(28, data.size * 0.9))}px ${s.labelFont}`;
                ctx.fillStyle = attrs.district ? districtColour(theme, attrs.district).fg : theme.text;
                ctx.fillText(initialOf(data.label), data.x, data.y + 0.5);
            }
        }
        ctx.globalAlpha = attrs.me ? 1 : fade(data.size, 7, 11);
        if (ctx.globalAlpha > 0) {
            const fontSize = attrs.me ? 13 : Math.min(13, Math.max(10, data.size / 2.5));
            ctx.font = `600 ${fontSize}px ${s.labelFont}`;
            const text = truncate(ctx, data.label, Math.max(data.size * 3, 90));
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
        ctx.restore();
    };
}

export function initialOf(name: string): string {
    const letter = Array.from(name.replace(/^[@#!+]/, "").trim())[0] ?? "?";
    return letter.toUpperCase();
}

function truncate(ctx: CanvasRenderingContext2D, text: string, max: number): string {
    if (ctx.measureText(text).width <= max) return text;
    const chars = Array.from(text);
    while (chars.length && ctx.measureText(chars.join("") + "…").width > max) chars.pop();
    return chars.length ? chars.join("").trimEnd() + "…" : "";
}
