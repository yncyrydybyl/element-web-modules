import { useEffect, useId, useMemo, useRef, useState, type JSX, type KeyboardEvent as ReactKeyboardEvent } from "react";

import type { AvatarCache } from "../avatars";
import { buildDistricts, DISTRICTS, type DistrictId, type GroupNames } from "../districts";
import { P } from "../i18n";
import { breadcrumb, type RoomGraph, type RoomInfo } from "../rooms";
import { search } from "../search";
import { buildTubeLayout } from "../tube";
import { buildAllGraph, districtNodeKey, groupNodeKey, roomScore, type ScoreOptions, type TipNode } from "../views";
import { colourIndex, SigmaMap, type FocusTarget } from "./SigmaMap";
import { TubeMap } from "./TubeMap";

/** Translates one of this module's own strings. */
export type ModuleTranslate = (key: string, variables?: Record<string, string>) => string;

/** The two maps: spaces as circles, or as the lines of a tube map. */
export type MapView = "circles" | "tube";
export const MAP_VIEWS: MapView[] = ["circles", "tube"];

export interface MapOverlayProps {
    graph: RoomGraph;
    current?: string;
    legendOpen: boolean;
    view: MapView;
    avatars?: Pick<AvatarCache, "get" | "colour" | "request">;
    /** Changes when more avatars have loaded. */
    avatarVersion?: number;
    usage(roomId: string): number;
    triggerLabel: string;
    t: ModuleTranslate;
    onLegendToggle(open: boolean): void;
    onViewChange(view: MapView): void;
    onOpen(roomId: string): void;
    onClose(): void;
}

/**
 * A line in the list on the left: "Everything", a district, a group (a space, or a group like
 * "WhatsApp" or "Small groups"), a sub-space, or a search result.
 */
interface Row {
    key: string;
    /** The room or space; missing for "Everything", districts and groups that aren't a space. */
    room?: RoomInfo;
    /** Its node on the circle map. */
    nodeKey?: string;
    /** Its line on the tube map. */
    line?: string;
    district?: DistrictId;
    /** The whole map. */
    overview?: boolean;
    name: string;
    depth: number;
    meta?: string;
    unread: number;
    highlight: number;
}

const RESULT_LIMIT = 8;
/** Hovering down the list doesn't send the camera to every space on the way. */
const FLY_DEBOUNCE_MS = 140;

export function MapOverlay(props: MapOverlayProps): JSX.Element {
    const { graph, current, t } = props;
    const titleId = useId();
    const listId = useId();
    const searchRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);
    // The map follows the list once the user moves through it, not on opening.
    const [follow, setFollow] = useState(false);
    const [focus, setFocus] = useState<FocusTarget | null>(null);
    const [legendOpen, setLegendOpen] = useState(props.legendOpen);
    const [view, setView] = useState(props.view);

    useEffect(() => searchRef.current?.focus(), []);

    const districtNames = useMemo(
        () => Object.fromEntries(DISTRICTS.map((d) => [d, t(`${P}district_${d}`)])) as Record<DistrictId, string>,
        [t],
    );
    const districts = useMemo(() => {
        const names: GroupNames = {
            older: t(`${P}group_older`, { network: "%(network)s" }),
            smallGroups: t(`${P}group_small`),
            loose: t(`${P}group_loose`),
            otherSpaces: t(`${P}group_spaces`),
            junk: t(`${P}group_junk`),
            nameless: t(`${P}group_nameless`),
            solo: t(`${P}group_solo`),
        };
        return buildDistricts(graph, names);
    }, [graph, t]);
    const mapGraph = useMemo(() => buildAllGraph(graph, districts, districtNames), [graph, districts, districtNames]);
    // Packed to roughly the shape of the map's area: the window minus the list and the header.
    const tubeLayout = useMemo(
        () =>
            view === "tube"
                ? buildTubeLayout(graph, districts, districtNames, Math.max(0.5, (window.innerWidth - 400) / Math.max(1, window.innerHeight - 160)))
                : null,
        [graph, districts, districtNames, view],
    );

    const scoreOpts = useMemo<ScoreOptions>(() => ({ usage: props.usage, now: Date.now() }), [props.usage]);
    const rank = useMemo(() => (r: RoomInfo) => roomScore(r, scoreOpts), [scoreOpts]);
    const matches = useMemo(() => {
        if (!query.trim()) return null;
        return new Set(search(graph, query, { limit: Infinity, rank: () => 0 }).map((r) => r.id));
    }, [graph, query]);

    const spaceRows = useMemo<Row[]>(() => {
        const roomsOf = (ids: string[]): RoomInfo[] => ids.map((id) => graph.rooms.get(id)!).filter((r) => r.kind !== "space");
        const counts = (rooms: RoomInfo[]): Pick<Row, "meta" | "unread" | "highlight"> => ({
            meta: plural(t, "space_rooms", rooms.length),
            unread: rooms.reduce((n, r) => n + r.unread, 0),
            highlight: rooms.reduce((n, r) => n + r.highlight, 0),
        });
        const rows: Row[] = [{ key: "all", overview: true, name: t(`${P}all_spaces`), depth: 0, ...counts(roomsOf([...graph.rooms.keys()])) }];
        for (const district of DISTRICTS) {
            const groups = districts.groups.filter((g) => g.district === district);
            if (!groups.length) continue;
            rows.push({
                key: `district:${district}`,
                district,
                nodeKey: districtNodeKey(district),
                name: districtNames[district],
                depth: 0,
                ...counts(roomsOf(groups.flatMap((g) => g.rooms))),
            });
            for (const g of groups) {
                const space = g.spaceId ? graph.rooms.get(g.spaceId) : undefined;
                const key = groupNodeKey(g);
                rows.push({ key: `group:${g.key}`, room: space, nodeKey: key, line: g.spaceId ?? g.key, name: g.label, depth: 1, ...counts(roomsOf(g.rooms)) });
                // A space's sub-spaces that hold rooms of this group, as on the map.
                const walk = (id: string, path: string, depth: number, seen: Set<string>): void => {
                    for (const c of graph.rooms.get(id)!.children) {
                        const sub = graph.rooms.get(c)!;
                        if (sub.kind !== "space" || seen.has(c)) continue;
                        const own = roomsOf(g.rooms).filter((r) => isBelow(graph, r.id, c));
                        if (!own.length) continue;
                        seen.add(c);
                        rows.push({ key: `group:${g.key}:${c}`, room: sub, nodeKey: `${path}/${c}`, line: c, name: sub.name, depth, ...counts(own) });
                        walk(c, `${path}/${c}`, depth + 1, seen);
                    }
                };
                if (space) walk(space.id, key, 2, new Set([space.id]));
            }
        }
        return rows;
    }, [graph, districts, districtNames, t]);
    const rows = useMemo<Row[]>(() => {
        if (!query.trim()) return spaceRows;
        return search(graph, query, { exclude: current, limit: RESULT_LIMIT, rank }).map((room) => ({
            key: room.id,
            room,
            name: room.name,
            depth: 0,
            meta: breadcrumb(graph, room.id).join(" › ") || undefined,
            unread: room.unread,
            highlight: room.highlight,
        }));
    }, [query, spaceRows, graph, current, rank]);
    const selected: Row | undefined = rows[Math.min(active, rows.length - 1)];

    // The list's avatars first, then the map's.
    useEffect(() => {
        const mapAvatars: Array<string | undefined> = [];
        mapGraph.forEachNode((_, a) => void mapAvatars.push(a.avatar));
        props.avatars?.request([...rows.map((r) => r.room?.avatar), ...mapAvatars]);
    }, [rows, mapGraph, props.avatars]);

    // The map flies to what's selected in the list; while hovering or typing, once it settles.
    useEffect(() => {
        if (!selected || !follow) return;
        const timer = setTimeout(() => setFocus(focusOf(selected)), FLY_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [selected?.key, follow]); // eslint-disable-line react-hooks/exhaustive-deps

    const activate = (row: Row): void => {
        if (row.room) props.onOpen(row.room.id);
        else setFocus(focusOf(row));
    };

    const toggleLegend = (): void => {
        setLegendOpen(!legendOpen);
        props.onLegendToggle(!legendOpen);
    };

    const switchView = (next: MapView): void => {
        if (next === view) return;
        setView(next);
        props.onViewChange(next);
    };

    const tooltip = (node: TipNode): JSX.Element => {
        const room = node.roomId ? graph.rooms.get(node.roomId) : undefined;
        const path = room ? breadcrumb(graph, room.id) : [];
        let kind: string;
        if (!room) kind = t(`${P}tip_group`);
        else if (room.invite) kind = t(`${P}tip_invite`);
        else if (room.kind === "space") kind = plural(t, "tip_space", room.children.length);
        else if (room.kind === "dm") kind = t(`${P}tip_dm`);
        else kind = plural(t, "tip_room", room.members);
        let action: string | undefined;
        if (node.container) action = room ? t(`${P}tip_action_space`) : t(`${P}tip_action_zoom`);
        else if (room) action = t(`${P}tip_action_open`);
        return (
            <>
                <div className="srm-tooltip-name">{node.label}</div>
                <div className="srm-tooltip-meta">{kind}</div>
                {path.length > 0 && <div className="srm-tooltip-meta">{path.join(" › ")}</div>}
                {node.also && node.also.length > 0 && <div className="srm-tooltip-meta">{t(`${P}tip_also`, { spaces: node.also.join(", ") })}</div>}
                {(node.highlight > 0 || node.unread > 0 || node.roomId === current) && (
                    <div className="srm-tooltip-status">
                        {node.highlight > 0 && <span className="srm-dot srm-dot--highlight">{plural(t, "tip_mentions", node.highlight)}</span>}
                        {node.unread > 0 && <span className="srm-dot srm-dot--unread">{plural(t, "tip_unread", node.unread)}</span>}
                        {node.roomId === current && <span className="srm-dot srm-dot--current">{t(`${P}tip_current`)}</span>}
                    </div>
                )}
                {action && <div className="srm-tooltip-action">{action}</div>}
            </>
        );
    };

    const onKeyDown = (ev: ReactKeyboardEvent): void => {
        if (ev.key === "Escape") {
            ev.preventDefault();
            if (query) {
                setQuery("");
                setActive(0);
            } else props.onClose();
        } else if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
            ev.preventDefault();
            if (!rows.length) return;
            const delta = ev.key === "ArrowDown" ? 1 : -1;
            setFollow(true);
            setActive((a) => (Math.min(a, rows.length - 1) + delta + rows.length) % rows.length);
        } else if (ev.key === "Enter" && selected) {
            ev.preventDefault();
            activate(selected);
        }
    };

    return (
        <div
            className="srm-backdrop"
            onMouseDown={(ev) => {
                if (ev.target === ev.currentTarget) props.onClose();
            }}
        >
            <div className="srm-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKeyDown}>
                <header className="srm-header">
                    <h2 id={titleId} className="srm-title">
                        {t(`${P}title`)}
                    </h2>
                    <div className="srm-tabs" role="tablist" aria-label={t(`${P}view`)}>
                        {MAP_VIEWS.map((v) => (
                            <button
                                key={v}
                                type="button"
                                role="tab"
                                className="srm-tab"
                                aria-selected={v === view}
                                onMouseDown={(ev) => ev.preventDefault()}
                                onClick={() => switchView(v)}
                            >
                                {t(`${P}view_${v}`)}
                            </button>
                        ))}
                    </div>
                    <input
                        ref={searchRef}
                        className="srm-search"
                        type="search"
                        role="combobox"
                        aria-expanded={rows.length > 0}
                        aria-controls={listId}
                        aria-activedescendant={selected ? `${listId}-${selected.key}` : undefined}
                        aria-autocomplete="list"
                        placeholder={t(`${P}search`)}
                        aria-label={t(`${P}search`)}
                        value={query}
                        onChange={(ev) => {
                            setQuery(ev.target.value);
                            setActive(0);
                            setFollow(Boolean(ev.target.value.trim()));
                        }}
                    />
                    <button type="button" className="srm-close" aria-label={t(`${P}close`)} onClick={props.onClose}>
                        ×
                    </button>
                </header>

                <div className="srm-body">
                    {tubeLayout ? (
                        <TubeMap
                            layout={tubeLayout}
                            matches={matches}
                            selected={follow ? selected?.room?.id : undefined}
                            selectedLine={follow ? selected?.line : undefined}
                            current={current}
                            focus={focus}
                            label={t(`${P}tube_label`)}
                            onActivate={(id) => props.onOpen(id)}
                            tooltip={tooltip}
                        >
                            <Legend open={legendOpen} onToggle={toggleLegend} t={t} view="tube" />
                        </TubeMap>
                    ) : (
                        <SigmaMap
                            graph={mapGraph}
                            matches={matches}
                            selected={follow ? selected?.room?.id : undefined}
                            current={current}
                            focus={focus}
                            label={t(`${P}canvas_label`)}
                            onActivate={(id) => props.onOpen(id)}
                            avatarUrl={props.avatars?.get.bind(props.avatars)}
                            avatarColour={props.avatars?.colour.bind(props.avatars)}
                            avatarVersion={props.avatarVersion}
                            tooltip={tooltip}
                        >
                            <Legend open={legendOpen} onToggle={toggleLegend} t={t} view="circles" />
                        </SigmaMap>
                    )}

                    <div className="srm-results">
                        <div className="srm-results-title">{query.trim() ? t(`${P}results`) : t(`${P}spaces`)}</div>
                        {rows.length === 0 ? (
                            <div className="srm-empty">{query.trim() ? t(`${P}no_results`, { query }) : t(`${P}empty`)}</div>
                        ) : (
                            <ul
                                id={listId}
                                role="listbox"
                                className="srm-list"
                                aria-label={query.trim() ? t(`${P}results`) : t(`${P}spaces`)}
                            >
                                {rows.map((row, i) => (
                                    <li
                                        key={row.key}
                                        id={`${listId}-${row.key}`}
                                        role="option"
                                        aria-selected={row === selected}
                                        className={`srm-item${row.highlight || row.unread ? " srm-item--unread" : ""}${row.district ? " srm-item--district" : ""}`}
                                        style={row.depth ? { paddingInlineStart: 8 + row.depth * 16 } : undefined}
                                        onMouseMove={() => {
                                            if (i !== active) setActive(i);
                                            if (!follow) setFollow(true);
                                        }}
                                        onMouseDown={(ev) => ev.preventDefault()}
                                        onClick={() => activate(row)}
                                    >
                                        <Avatar row={row} url={props.avatars?.get(row.room?.avatar)} />
                                        <span className="srm-item-text">
                                            <span className="srm-item-name">{row.name}</span>
                                            {row.meta && <span className="srm-item-path">{row.meta}</span>}
                                        </span>
                                        {(row.highlight > 0 || row.unread > 0) && (
                                            <span className={`srm-badge${row.highlight ? " srm-badge--highlight" : ""}`}>
                                                {formatCount(row.highlight || row.unread)}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <footer className="srm-footer">
                    <span>{t(`${P}hint`)}</span>
                    <kbd className="srm-kbd">{props.triggerLabel}</kbd>
                </footer>
            </div>
        </div>
    );
}

function focusOf(row: Row): FocusTarget {
    return { roomId: row.room?.id, nodeKey: row.nodeKey, line: row.line, district: row.district, overview: row.overview, nonce: Date.now() };
}

/** Whether a room is anywhere below a space. */
function isBelow(graph: RoomGraph, roomId: string, spaceId: string): boolean {
    const seen = new Set<string>();
    const stack = [...(graph.rooms.get(roomId)?.parents ?? [])];
    while (stack.length) {
        const p = stack.pop()!;
        if (p === spaceId) return true;
        if (seen.has(p)) continue;
        seen.add(p);
        stack.push(...(graph.rooms.get(p)?.parents ?? []));
    }
    return false;
}

function Avatar({ row, url }: { row: Row; url?: string }): JSX.Element {
    const [failed, setFailed] = useState(false);
    if (row.overview) {
        // Four circles, like the map zoomed out.
        return (
            <span className="srm-avatar srm-avatar--group" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                    <circle cx="5" cy="5" r="3" />
                    <circle cx="11" cy="5" r="3" />
                    <circle cx="5" cy="11" r="3" />
                    <circle cx="11" cy="11" r="3" />
                </svg>
            </span>
        );
    }
    const kind = row.room?.kind ?? "group";
    const colour = row.room ? ` srm-avatar--c${colourIndex(row.room.id) + 1}` : "";
    return (
        <span className={`srm-avatar srm-avatar--${kind}${colour}`} aria-hidden="true">
            {url && !failed ? <img src={url} alt="" onError={() => setFailed(true)} /> : initialOf(row.name)}
        </span>
    );
}

/** What the marks on the map mean. */
function Legend(props: { open: boolean; onToggle(): void; t: ModuleTranslate; view: MapView }): JSX.Element {
    const { open, t } = props;
    const id = useId();
    const items: Array<[string, string]> =
        props.view === "tube"
            ? [
                  ["srm-swatch--line", t(`${P}legend_line`)],
                  ["srm-swatch--station", t(`${P}legend_station`)],
                  ["srm-swatch--interchange", t(`${P}legend_interchange`)],
                  ["srm-swatch--unread-count", t(`${P}legend_unread`)],
                  ["srm-swatch--mention", t(`${P}legend_highlight`)],
                  ["srm-swatch--current", t(`${P}legend_current`)],
                  ["srm-swatch--dim", t(`${P}legend_dim`)],
              ]
            : [
                  ["srm-swatch--unread", t(`${P}legend_unread`)],
                  ["srm-swatch--mention", t(`${P}legend_highlight`)],
                  ["srm-swatch--current", t(`${P}legend_current`)],
                  ["srm-swatch--selected", t(`${P}legend_selected`)],
                  ["srm-swatch--space", t(`${P}legend_space_circle`)],
                  ["srm-swatch--colour", t(`${P}legend_colour`)],
                  ["srm-swatch--dim", t(`${P}legend_dim`)],
              ];
    return (
        <div className="srm-legend">
            <button type="button" className="srm-legend-toggle" aria-expanded={open} aria-controls={id} onClick={props.onToggle}>
                {t(`${P}legend`)} {open ? "▾" : "▸"}
            </button>
            {open && (
                <ul id={id} className="srm-legend-list">
                    {items.map(([swatch, text]) => (
                        <li key={swatch}>
                            <span className={`srm-swatch ${swatch}`} aria-hidden="true" />
                            {text}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/** `<key>_one` or `<key>_other`; the module API's translations have no plural forms. */
function plural(t: ModuleTranslate, key: string, count: number): string {
    return t(`${P}${key}_${count === 1 ? "one" : "other"}`, { count: String(count) });
}

function initialOf(name: string): string {
    return Array.from(name.replace(/^[#@!+]/, "").trim())[0]?.toUpperCase() ?? "?";
}

function formatCount(n: number): string {
    return n > 99 ? "99+" : String(n);
}
