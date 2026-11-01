/**
 * The tube map view, drawn as SVG: lines, stations and interchange links in one group that pans
 * and zooms, and above it, at a fixed size on screen, the line names and the beacons of rooms
 * that mention you. Panning sets the transform directly, without re-rendering React.
 */

import {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type JSX,
    type MouseEvent as ReactMouseEvent,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
} from "react";

import { COL, ROW, roundedPath, type TubeLayout, type TubeLine, type TubeStation } from "../tube";
import type { TipNode } from "../views";
import { flyTo, type Flight } from "./camera";
import type { FocusTarget } from "./SigmaMap";
import { placeTooltip } from "./tooltip";

export interface TubeMapProps {
    layout: TubeLayout;
    /** Room ids matching the search; null when there is no query. */
    matches: Set<string> | null;
    /** Room selected in the list. */
    selected?: string;
    /** Line of the space (or group) selected in the list: it and its branches stay bright. */
    selectedLine?: string;
    current?: string;
    focus: FocusTarget | null;
    label: string;
    onActivate(roomId: string): void;
    tooltip?(node: TipNode): ReactNode;
    /** Drawn over the map (the legend). */
    children?: ReactNode;
}

/** Visible part of the map: centre and width, in layout units. */
interface View {
    cx: number;
    cy: number;
    w: number;
}

/** Tube colours, picked to read on light and dark backgrounds. */
const LINE_COLOURS = ["#dc241f", "#0098d4", "#00782a", "#b36305", "#9b0056", "#ee7c0e", "#6950a1", "#00a4a7", "#1c5cd6", "#e21d8d"];
const GROUP_COLOUR = "var(--cpd-color-icon-tertiary, #8d97a5)";
const MAX_SCALE = 2.5;
/** Flying to a line or room stops here, where names are a comfortable size. */
const FOCUS_SCALE = 1.3;
/** Station names show from this scale on (see the data-zoom levels). */
const READABLE_SCALE = 0.85;
const NAME_CHARS = 22;
const PILL_H = 20;
const TIP_HIDE_MS = 120;
/** Below this, a press that moves is a click, not a drag. */
const DRAG_PX = 4;

export function lineColour(line: Pick<TubeLine, "colour">): string {
    return line.colour < 0 ? GROUP_COLOUR : LINE_COLOURS[line.colour % LINE_COLOURS.length];
}

export function TubeMap(props: TubeMapProps): JSX.Element {
    const { layout, matches, current, selected, selectedLine } = props;
    const boxRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const worldRef = useRef<SVGGElement>(null);
    const pillRefs = useRef(new Map<string, SVGGElement>());
    const beaconRefs = useRef(new Map<string, SVGGElement>());
    const tipRef = useRef<HTMLDivElement>(null);
    const lastTip = useRef<ReactNode>(null);
    const pointer = useRef({ x: 0, y: 0 });
    const view = useRef<View>({ cx: 0, cy: 0, w: 1 });
    const flight = useRef<Flight | null>(null);
    /** The line the camera last flew to: a second click on it opens the space. */
    const focusedLine = useRef<string | undefined>(undefined);
    const [hovered, setHovered] = useState<TipNode | null>(null);

    const lines = useMemo(() => new Map(layout.lines.map((l) => [l.id, l])), [layout]);
    const stations = useMemo(() => new Map(layout.stations.map((s) => [s.key, s])), [layout]);
    const byRoom = useMemo(() => {
        const out = new Map<string, TubeStation[]>();
        for (const s of layout.stations) out.set(s.roomId, [...(out.get(s.roomId) ?? []), s]);
        return out;
    }, [layout]);
    // Beacons for rooms; a sub-space with mentions inside has a red badge on its interchange instead.
    const mentions = useMemo(() => layout.stations.filter((s) => s.highlight > 0 && s.kind !== "space"), [layout]);
    const named = useMemo(() => layout.lines.filter((l) => l.anchor), [layout]);
    const anyUnread = useMemo(() => layout.stations.some((s) => s.unread > 0 || s.highlight > 0), [layout]);
    const font = useMemo(() => getComputedStyle(document.body).getPropertyValue("--cpd-font-family-sans").trim() || "Inter, system-ui, sans-serif", []);
    const pills = useMemo(() => {
        const out = new Map<string, { text: string; width: number; count: number }>();
        for (const l of named) {
            const text = truncate(l.label, 28);
            const count = l.highlight || l.unread;
            out.set(l.id, { text, count, width: textWidth(text, `600 12px ${font}`) + 20 + (count ? badgeWidth(count) + 4 : 0) });
        }
        return out;
    }, [named, font]);
    // Block names are placed in this order and skipped where they'd overlap: mentions first.
    const pillOrder = useMemo(() => [...named].sort((a, b) => Number(b.highlight > 0) - Number(a.highlight > 0)), [named]);
    const active = useMemo(() => (selectedLine && lines.has(selectedLine) ? withBranches(layout, selectedLine) : null), [layout, lines, selectedLine]);

    const apply = (): void => {
        const svg = svgRef.current;
        const world = worldRef.current;
        if (!svg || !world) return;
        const W = svg.clientWidth || 1;
        const H = svg.clientHeight || 1;
        const { cx, cy, w } = view.current;
        const k = W / w;
        const tx = W / 2 - cx * k;
        const ty = H / 2 - cy * k;
        world.setAttribute("transform", `translate(${tx} ${ty}) scale(${k})`);
        // Station names are unreadable when far out; CSS hides them, keeping the unread ones longer.
        svg.dataset.zoom = k < 0.45 ? "far" : k < 0.8 ? "mid" : "near";

        const taken: Array<[number, number, number, number]> = [];
        for (const line of pillOrder) {
            const el = pillRefs.current.get(line.id);
            const pill = pills.get(line.id);
            if (!el || !pill || !line.anchor) continue;
            // The block's top left corner; the name keeps its size on screen, so it stays readable far out.
            const x = line.anchor[0] * k + tx;
            const y = line.anchor[1] * k + ty + PILL_H / 2;
            const box: [number, number, number, number] = [x, y - PILL_H / 2 - 2, x + pill.width, y + PILL_H / 2 + 2];
            const visible =
                box[2] > 0 && box[0] < W && box[3] > 0 && box[1] < H && !taken.some((t) => t[0] < box[2] && box[0] < t[2] && t[1] < box[3] && box[1] < t[3]);
            el.style.display = visible ? "" : "none";
            if (!visible) continue;
            taken.push(box);
            el.setAttribute("transform", `translate(${x} ${y})`);
        }
        for (const s of mentions) {
            const el = beaconRefs.current.get(s.key);
            if (!el) continue;
            const x = s.x * k + tx;
            const y = s.y * k + ty;
            el.style.display = x < -30 || y < -30 || x > W + 30 || y > H + 30 ? "none" : "";
            el.setAttribute("transform", `translate(${x} ${y})`);
        }
    };

    const camera = {
        getState: () => ({ x: view.current.cx, y: view.current.cy, ratio: view.current.w, angle: 0 }),
        setState: (s: { x?: number; y?: number; ratio?: number }) => {
            view.current = { cx: s.x ?? view.current.cx, cy: s.y ?? view.current.cy, w: s.ratio ?? view.current.w };
            apply();
        },
    };
    const fly = (target: View): void => {
        flight.current?.cancel();
        flight.current = flyTo(camera, { x: target.cx, y: target.cy, ratio: target.w });
    };
    /** The view that shows a box, no closer than FOCUS_SCALE. */
    /** `readable`: no further out than where station names show; a box too big then shows its top left. */
    const fit = (x0: number, y0: number, x1: number, y1: number, readable = false): View => {
        const svg = svgRef.current;
        const W = svg?.clientWidth || 1;
        const H = svg?.clientHeight || 1;
        let w = Math.max((x1 - x0) * 1.08, (y1 - y0) * 1.08 * (W / H), W / FOCUS_SCALE);
        if (readable) w = Math.min(w, W / READABLE_SCALE);
        const visibleH = (w * H) / W;
        const cy = visibleH >= (y1 - y0) * 1.08 ? (y0 + y1) / 2 : y0 + visibleH / 2 - (y1 - y0) * 0.04;
        const cx = w >= (x1 - x0) * 1.08 ? (x0 + x1) / 2 : x0 + w / 2;
        return { cx, cy, w };
    };
    const overview = (): View => fit(layout.bounds.x0, layout.bounds.y0, layout.bounds.x1, layout.bounds.y1);
    const lineView = (id: string): View => {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const l of layout.lines) {
            if (!withBranches(layout, id).has(l.id)) continue;
            for (const [x, y] of l.points) {
                x0 = Math.min(x0, x);
                x1 = Math.max(x1, x);
                y0 = Math.min(y0, y);
                y1 = Math.max(y1, y);
            }
        }
        // Room for the names: slanted station names above and to the right, the line name on the left.
        return fit(x0 - COL, y0 - ROW * 1.2, x1 + ROW, y1 + COL, true);
    };

    // The first view shows everything; resizing keeps the centre and the scale.
    useLayoutEffect(() => {
        view.current = overview();
        apply();
        if (typeof ResizeObserver !== "function") return;
        const observer = new ResizeObserver(() => apply());
        observer.observe(svgRef.current!);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layout]);

    // Line names and beacons are new elements after a render; place them.
    useLayoutEffect(() => apply());

    useEffect(() => {
        const svg = svgRef.current!;
        const clamp = (w: number): number => {
            const W = svg.clientWidth || 1;
            const b = layout.bounds;
            return Math.min(Math.max(w, W / MAX_SCALE), Math.max(b.x1 - b.x0, b.y1 - b.y0) * 4);
        };
        const onWheel = (ev: WheelEvent): void => {
            ev.preventDefault();
            flight.current?.cancel();
            const rect = svg.getBoundingClientRect();
            const px = ev.clientX - rect.left - rect.width / 2;
            const py = ev.clientY - rect.top - rect.height / 2;
            const { cx, cy, w } = view.current;
            const k = rect.width / w;
            const delta = ev.deltaMode === 1 ? ev.deltaY * 33 : ev.deltaY;
            const w2 = clamp(w * Math.exp(delta * 0.0015));
            const k2 = rect.width / w2;
            // The point under the pointer stays there.
            view.current = { cx: cx + px / k - px / k2, cy: cy + py / k - py / k2, w: w2 };
            apply();
        };
        svg.addEventListener("wheel", onWheel, { passive: false });
        return () => svg.removeEventListener("wheel", onWheel);
    }, [layout]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => () => flight.current?.cancel(), []);

    const drag = useRef<{ x: number; y: number; cx: number; cy: number; moved: boolean } | null>(null);
    const onPointerDown = (ev: ReactPointerEvent): void => {
        if (ev.button !== 0) return;
        flight.current?.cancel();
        drag.current = { x: ev.clientX, y: ev.clientY, cx: view.current.cx, cy: view.current.cy, moved: false };
        const move = (e: PointerEvent): void => {
            const d = drag.current;
            const svg = svgRef.current;
            if (!d || !svg) return;
            if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < DRAG_PX) return;
            d.moved = true;
            svg.classList.add("srm-tube--dragging");
            const k = (svg.clientWidth || 1) / view.current.w;
            view.current = { ...view.current, cx: d.cx - (e.clientX - d.x) / k, cy: d.cy - (e.clientY - d.y) / k };
            apply();
        };
        const up = (): void => {
            svgRef.current?.classList.remove("srm-tube--dragging");
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
    };

    /** A space's line zooms in first; a second click opens the space. */
    const activateLine = (id: string): void => {
        const line = lines.get(id);
        if (line?.roomId && focusedLine.current === id) return props.onActivate(line.roomId);
        focusedLine.current = id;
        fly(lineView(id));
    };
    const onClick = (ev: ReactMouseEvent): void => {
        if (drag.current?.moved) return;
        const el = (ev.target as Element).closest("[data-key], [data-line]");
        const station = el?.getAttribute("data-key") ? stations.get(el.getAttribute("data-key")!) : undefined;
        const lineId = el?.getAttribute("data-line");
        if (station) {
            if (station.kind === "space" && lines.has(station.roomId)) activateLine(station.roomId);
            else props.onActivate(station.roomId);
        } else if (lineId) {
            activateLine(lineId);
        } else {
            focusedLine.current = undefined;
            fly(overview());
        }
    };

    useEffect(() => {
        const focus = props.focus;
        if (!focus) return;
        const lineId = focus.nodeKey ?? focus.roomId;
        if (focus.overview) {
            focusedLine.current = undefined;
            fly(overview());
        } else if (lineId && lines.has(lineId)) {
            focusedLine.current = lineId;
            fly(lineView(lineId));
        } else if (focus.roomId) {
            const s = layout.stations.find((st) => st.roomId === focus.roomId);
            const svg = svgRef.current;
            if (s && svg) fly({ cx: s.x + COL, cy: s.y - ROW * 0.25, w: (svg.clientWidth || 1) / FOCUS_SCALE });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.focus]);

    const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(hideTimer.current), []);
    /** The room under the pointer, whose stations elsewhere on the map light up. */
    const twinRoom = useRef<string | undefined>(undefined);
    const markTwins = (roomId: string | undefined): void => {
        if (roomId === twinRoom.current) return;
        const svg = svgRef.current;
        svg?.querySelectorAll(".is-twin").forEach((el) => el.classList.remove("is-twin"));
        twinRoom.current = roomId;
        if (svg && roomId && (byRoom.get(roomId)?.length ?? 0) > 1) {
            svg.querySelectorAll(`[data-room="${CSS.escape(roomId)}"]`).forEach((el) => el.classList.add("is-twin"));
        }
    };
    const onPointerOver = (ev: ReactPointerEvent): void => {
        const el = (ev.target as Element).closest("[data-key], [data-line]");
        const station = el?.getAttribute("data-key") ? stations.get(el.getAttribute("data-key")!) : undefined;
        const line = el?.getAttribute("data-line") ? lines.get(el.getAttribute("data-line")!) : undefined;
        let tip: TipNode | null = null;
        markTwins(station?.roomId);
        if (station) {
            const space = station.kind === "space" ? lines.get(station.roomId) : undefined;
            const others = (byRoom.get(station.roomId) ?? []).filter((s) => s !== station);
            tip = {
                label: station.label,
                roomId: station.roomId,
                container: Boolean(space),
                unread: space ? space.unread : station.unread,
                highlight: space ? space.highlight : station.highlight,
                also: others.map((s) => lines.get(s.lineId)!.label),
            };
        } else if (line) {
            tip = { label: line.label, roomId: line.roomId, container: true, unread: line.unread, highlight: line.highlight };
        }
        clearTimeout(hideTimer.current);
        if (tip) setHovered(tip);
        else hideTimer.current = setTimeout(() => setHovered(null), TIP_HIDE_MS);
    };
    const onPointerMove = (ev: ReactPointerEvent): void => {
        const rect = boxRef.current!.getBoundingClientRect();
        pointer.current = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
        placeTooltip(tipRef.current, boxRef.current, pointer.current.x, pointer.current.y);
    };
    useLayoutEffect(() => placeTooltip(tipRef.current, boxRef.current, pointer.current.x, pointer.current.y), [hovered]);
    const tip = hovered && props.tooltip?.(hovered);
    if (tip) lastTip.current = tip;

    const stationClass = (s: TubeStation): string => {
        const c = ["srm-station"];
        if (s.interchange) c.push("is-interchange");
        if (s.highlight && s.kind !== "space") c.push("is-mention");
        if (s.unread || s.highlight) c.push("is-unread");
        else if (anyUnread && !matches && s.roomId !== current) c.push("is-quiet");
        if (matches && !matches.has(s.roomId)) c.push("is-miss");
        if (active && !active.has(s.lineId)) c.push("is-off");
        if (s.roomId === current) c.push("is-current");
        if (s.roomId === selected) c.push("is-selected");
        if (s.invite) c.push("is-invite");
        return c.join(" ");
    };

    return (
        <div ref={boxRef} className="srm-stage">
            <svg
                ref={svgRef}
                className="srm-tube"
                role="img"
                aria-label={props.label}
                onPointerDown={onPointerDown}
                onPointerOver={onPointerOver}
                onPointerMove={onPointerMove}
                onPointerLeave={() => {
                    setHovered(null);
                    markTwins(undefined);
                }}
                onClick={onClick}
            >
                <g ref={worldRef}>
                    {layout.lines.map((l) => (
                        <g key={l.id} className={`srm-tube-line${active && !active.has(l.id) ? " is-off" : ""}`} data-line={l.id}>
                            <path className="srm-tube-casing" d={roundedPath(l.points)} />
                            <path className={`srm-tube-track${l.colour < 0 ? " srm-tube-track--group" : ""}`} d={roundedPath(l.points)} style={{ stroke: lineColour(l) }} />
                        </g>
                    ))}
                    {layout.links.map((link) => (
                        <g key={link.roomId} className={`srm-tube-link${matches && !matches.has(link.roomId) ? " is-miss" : ""}`}>
                            <path className="srm-tube-link-outer" d={roundedPath(link.points, 0)} />
                            <path className="srm-tube-link-inner" d={roundedPath(link.points, 0)} />
                        </g>
                    ))}
                    {layout.stations.map((s) => (
                        <g key={s.key} className={stationClass(s)} transform={`translate(${s.x} ${s.y})`} data-key={s.key} data-room={s.roomId}>
                            <circle className="srm-station-hit" r={13} />
                            {s.roomId === current && <circle className="srm-station-here" r={s.interchange ? 12 : 10} />}
                            {s.roomId === selected && <circle className="srm-station-selected" r={s.interchange ? 13 : 11} />}
                            <circle
                                className="srm-station-dot"
                                r={s.interchange ? 7.5 : 5.5}
                                style={s.interchange || s.highlight ? undefined : { stroke: lineColour(lines.get(s.lineId)!) }}
                            />
                            <text className="srm-station-name" transform="rotate(-45)" x={s.interchange ? 12 : 10} y={4}>
                                {truncate(s.label, NAME_CHARS)}
                            </text>
                            {s.kind === "space" && (s.highlight || s.unread) > 0 ? (
                                <Badge x={11} y={12} count={s.highlight || s.unread} kind={s.highlight ? "mention" : "unread"} />
                            ) : (
                                s.unread > 0 && !s.highlight && <Badge x={9} y={11} count={s.unread} kind="unread" />
                            )}
                        </g>
                    ))}
                </g>
                <g className="srm-tube-overlay">
                    {named.map((l) => {
                        const pill = pills.get(l.id)!;
                        return (
                            <g
                                key={l.id}
                                ref={(el) => void (el ? pillRefs.current.set(l.id, el) : pillRefs.current.delete(l.id))}
                                className={`srm-tube-pill${active && !active.has(l.id) ? " is-off" : ""}`}
                                data-line={l.id}
                            >
                                <rect x={0} y={-PILL_H / 2} width={pill.width} height={PILL_H} rx={PILL_H / 2} style={{ fill: lineColour(l) }} />
                                <text x={10} y={0.5}>
                                    {pill.text}
                                </text>
                                {pill.count > 0 && (
                                    <Badge x={pill.width - badgeWidth(pill.count) / 2 - 3} y={0} count={pill.count} kind={l.highlight ? "mention" : "unread"} />
                                )}
                            </g>
                        );
                    })}
                    {mentions.map((s) => (
                        <g
                            key={s.key}
                            ref={(el) => void (el ? beaconRefs.current.set(s.key, el) : beaconRefs.current.delete(s.key))}
                            className={`srm-beacon${matches && !matches.has(s.roomId) ? " is-miss" : ""}${active && !active.has(s.lineId) ? " is-off" : ""}`}
                            data-key={s.key}
                        >
                            <circle className="srm-beacon-pulse" r={7} />
                            <Badge x={11} y={12} count={s.highlight} kind="mention" />
                        </g>
                    ))}
                </g>
            </svg>
            <div ref={tipRef} className="srm-tooltip" data-visible={Boolean(tip)} aria-hidden="true">
                {tip || lastTip.current}
            </div>
            {props.children}
        </div>
    );
}

function Badge({ x, y, count, kind }: { x: number; y: number; count: number; kind: "unread" | "mention" }): JSX.Element {
    const w = badgeWidth(count);
    return (
        <g className={`srm-tube-badge srm-tube-badge--${kind}`} transform={`translate(${x} ${y})`}>
            <rect x={-w / 2} y={-8.5} width={w} height={17} rx={8.5} />
            <text y={0.5}>{count > 99 ? "99+" : count}</text>
        </g>
    );
}

function badgeWidth(count: number): number {
    return count > 99 ? 28 : count > 9 ? 22 : 17;
}

/** A line and all lines that branch off it, at any depth. */
function withBranches(layout: TubeLayout, id: string): Set<string> {
    const out = new Set([id]);
    for (const l of layout.lines) if (l.parent && out.has(l.parent)) out.add(l.id);
    return out;
}

function truncate(text: string, max: number): string {
    const chars = Array.from(text);
    return chars.length > max ? chars.slice(0, max - 1).join("").trimEnd() + "…" : text;
}

let measureCtx: CanvasRenderingContext2D | null | undefined;
function textWidth(text: string, font: string): number {
    if (measureCtx === undefined) {
        try {
            measureCtx = document.createElement("canvas").getContext("2d");
        } catch {
            measureCtx = null;
        }
    }
    if (!measureCtx) return text.length * 7;
    measureCtx.font = font;
    return measureCtx.measureText(text).width || text.length * 7;
}
