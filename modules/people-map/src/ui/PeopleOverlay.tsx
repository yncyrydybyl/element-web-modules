import { useEffect, useId, useMemo, useRef, useState, type JSX, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { matchSorter } from "match-sorter";

import { version } from "../../package.json";
import type { AvatarCache } from "../avatars";
import { P } from "../i18n";
import type { PeopleLayout, PeopleNode } from "../layout";
import type { PeopleData, Person } from "../people";
import type { RoomGraph } from "../rooms";
import type { SavedCamera } from "./camera";
import { PeopleMap, initialOf, type FocusTarget } from "./PeopleMap";

/** Translates one of this module's own strings. */
export type ModuleTranslate = (key: string, variables?: Record<string, string>) => string;

export type SortOrder = "closeness" | "recent" | "rooms" | "name";
export const SORT_ORDERS: SortOrder[] = ["closeness", "recent", "rooms", "name"];
export type Filter = "all" | "dm" | "server" | "bridged";
export const FILTERS: Filter[] = ["all", "dm", "server", "bridged"];

export interface PeopleOverlayProps {
    data: PeopleData;
    layout: PeopleLayout;
    graph: RoomGraph;
    myServer: string;
    language: string;
    sort: SortOrder;
    legendOpen: boolean;
    camera?: SavedCamera;
    animate: boolean;
    avatars?: Pick<AvatarCache, "get" | "request">;
    avatarVersion?: number;
    triggerLabel: string;
    t: ModuleTranslate;
    onSortChange(sort: SortOrder): void;
    onLegendToggle(open: boolean): void;
    onCameraChange?(camera: SavedCamera): void;
    onOpenRoom(roomId: string): void;
    onOpenProfile(userId: string): void;
    onClose(): void;
}

/** Rows beyond this are left out of the list; the search finds them. */
export const LIST_LIMIT = 200;

export function PeopleOverlay(props: PeopleOverlayProps): JSX.Element {
    const { data, t } = props;
    const titleId = useId();
    const listId = useId();
    const searchRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [sort, setSort] = useState<SortOrder>(props.sort);
    const [active, setActive] = useState(0);
    const [pointed, setPointed] = useState<string | undefined>();
    const [selected, setSelected] = useState<string | undefined>();
    const [focus, setFocus] = useState<FocusTarget | null>(null);
    const [legendOpen, setLegendOpen] = useState(props.legendOpen);
    const nonce = useRef(0);
    const people = useMemo(() => [...data.people.values()], [data]);

    useEffect(() => searchRef.current?.focus(), []);

    // Avatars load closest first.
    useEffect(() => {
        props.avatars?.request([...people].sort((a, b) => b.closeness - a.closeness).map((p) => p.avatar));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [people]);

    const filtered = useMemo(() => {
        const keep = (p: Person): boolean =>
            filter === "all" || (filter === "dm" && Boolean(p.dm)) || (filter === "server" && p.server === props.myServer) || (filter === "bridged" && p.kind === "bridged");
        const pool = people.filter(keep);
        const q = query.trim();
        if (q) return matchSorter(pool, q, { keys: ["name", (p) => p.id.slice(1)], baseSort: (a, b) => b.item.closeness - a.item.closeness });
        return pool.sort(comparator(sort));
    }, [people, filter, query, sort, props.myServer]);

    const matches = useMemo(() => (query.trim() || filter !== "all" ? new Set(filtered.map((p) => p.id)) : null), [filtered, query, filter]);
    const rows = filtered.slice(0, LIST_LIMIT);
    const person = selected ? data.people.get(selected) : undefined;

    const choose = (id: string | undefined): void => {
        setSelected(id);
        setFocus({ personId: id, overview: !id, nonce: ++nonce.current });
    };

    const onKeyDown = (ev: ReactKeyboardEvent): void => {
        if (ev.key === "Escape") {
            ev.preventDefault();
            if (person) choose(undefined);
            else props.onClose();
            return;
        }
        if (person) return;
        if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
            ev.preventDefault();
            const next = Math.max(0, Math.min(rows.length - 1, active + (ev.key === "ArrowDown" ? 1 : -1)));
            setActive(next);
            setPointed(rows[next]?.id);
            document.getElementById(`${listId}-${next}`)?.scrollIntoView?.({ block: "nearest" });
        } else if (ev.key === "Enter" && rows[active]) {
            ev.preventDefault();
            choose(rows[active].id);
        }
    };

    const tooltip = (node: PeopleNode): JSX.Element => {
        const p = node.personId ? data.people.get(node.personId) : undefined;
        if (!p) return <div className="pm-tip-title">{t(`${P}you`)}</div>;
        return (
            <>
                <div className="pm-tip-title">{p.name}</div>
                <div className="pm-tip-meta">{p.id}</div>
                <div className="pm-tip-meta">{summary(p, props, t)}</div>
                <div className="pm-tip-action">{t(`${P}tip_action`)}</div>
            </>
        );
    };

    return (
        <div className="pm-backdrop" onMouseDown={(ev) => ev.target === ev.currentTarget && props.onClose()}>
            <div className="pm-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKeyDown}>
                <header className="pm-header">
                    <h2 id={titleId} className="pm-title">
                        {t(`${P}title`)}
                    </h2>
                    <span className="pm-count">{plural(t, "count", data.people.size)}</span>
                    <input
                        ref={searchRef}
                        className="pm-search"
                        type="search"
                        placeholder={t(`${P}search`)}
                        aria-label={t(`${P}search`)}
                        aria-controls={listId}
                        value={query}
                        onChange={(ev) => {
                            setQuery(ev.target.value);
                            setActive(0);
                            setPointed(undefined);
                            if (person) setSelected(undefined);
                        }}
                    />
                    <button type="button" className="pm-close" aria-label={t(`${P}close`)} onClick={props.onClose}>
                        ×
                    </button>
                </header>

                <div className="pm-body">
                    <PeopleMap
                        layout={props.layout}
                        matches={matches}
                        selected={selected}
                        pointed={person ? undefined : pointed}
                        focus={focus}
                        label={t(`${P}canvas_label`)}
                        onActivate={(id) => (id ? choose(id) : choose(undefined))}
                        avatarUrl={props.avatars?.get.bind(props.avatars)}
                        avatarVersion={props.avatarVersion}
                        tooltip={tooltip}
                        camera={props.camera}
                        animate={props.animate}
                        onCameraChange={props.onCameraChange}
                    >
                        <Legend
                            open={legendOpen}
                            t={t}
                            onToggle={() => {
                                setLegendOpen(!legendOpen);
                                props.onLegendToggle(!legendOpen);
                            }}
                        />
                    </PeopleMap>

                    <div className="pm-side">
                        {person ? (
                            <PersonCard person={person} {...props} onBack={() => choose(undefined)} />
                        ) : (
                            <>
                                <div className="pm-controls">
                                    <div className="pm-chips" role="group" aria-label={t(`${P}filter`)}>
                                        {FILTERS.map((f) => (
                                            <button
                                                key={f}
                                                type="button"
                                                className="pm-chip"
                                                aria-pressed={filter === f}
                                                onMouseDown={(ev) => ev.preventDefault()}
                                                onClick={() => {
                                                    setFilter(f);
                                                    setActive(0);
                                                }}
                                            >
                                                {t(`${P}filter_${f}`)}
                                            </button>
                                        ))}
                                    </div>
                                    <label className="pm-sort">
                                        <span>{t(`${P}sort`)}</span>
                                        <select
                                            value={sort}
                                            onChange={(ev) => {
                                                const next = ev.target.value as SortOrder;
                                                setSort(next);
                                                props.onSortChange(next);
                                            }}
                                        >
                                            {SORT_ORDERS.map((s) => (
                                                <option key={s} value={s}>
                                                    {t(`${P}sort_${s}`)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                {rows.length === 0 ? (
                                    <div className="pm-empty">{query.trim() ? t(`${P}no_results`, { query }) : t(`${P}empty`)}</div>
                                ) : (
                                    <ul id={listId} role="listbox" className="pm-list" aria-label={t(`${P}title`)} onMouseLeave={() => setPointed(undefined)}>
                                        {rows.map((p, i) => (
                                            <li
                                                key={p.id}
                                                id={`${listId}-${i}`}
                                                role="option"
                                                aria-selected={i === active}
                                                className="pm-item"
                                                onMouseEnter={() => setPointed(p.id)}
                                                onMouseDown={(ev) => ev.preventDefault()}
                                                onClick={() => {
                                                    setActive(i);
                                                    choose(p.id);
                                                }}
                                            >
                                                <Avatar person={p} url={props.avatars?.get(p.avatar)} />
                                                <span className="pm-item-text">
                                                    <span className="pm-item-name">{p.name}</span>
                                                    <span className="pm-item-meta">{summary(p, props, t)}</span>
                                                </span>
                                                {p.presence === "online" && <span className="pm-online" title={t(`${P}presence_online`)} />}
                                            </li>
                                        ))}
                                        {filtered.length > rows.length && <li className="pm-more">+{filtered.length - rows.length}</li>}
                                    </ul>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <footer className="pm-footer">
                    <span>{t(`${P}hint`)}</span>
                    <span className="pm-version">v{version}</span>
                </footer>
            </div>
        </div>
    );
}

function PersonCard(props: PeopleOverlayProps & { person: Person; onBack(): void }): JSX.Element {
    const { person: p, t, graph } = props;
    const group = props.data.groups.find((g) => g.key === p.group);
    const facts: string[] = [
        plural(t, "rooms", p.rooms.filter((id) => id !== p.dm).length),
        p.spaces.length ? plural(t, "spaces", p.spaces.length) : "",
        p.dm ? t(`${P}dm`) : "",
        p.admin ? plural(t, "admin", p.admin) : "",
        p.moderator ? plural(t, "moderator", p.moderator) : "",
        p.interactions ? plural(t, "interactions", p.interactions) : "",
        p.messages ? plural(t, "messages", p.messages) : "",
        p.lastContact ? t(`${P}last_contact`, { when: relative(p.lastContact, props.language) }) : "",
    ].filter(Boolean);
    const rooms = p.rooms.filter((id) => id !== p.dm);
    return (
        <div className="pm-card" data-testid="people-map-card">
            <button type="button" className="pm-back" onClick={props.onBack}>
                ‹ {t(`${P}back`)}
            </button>
            <div className="pm-card-head">
                <Avatar person={p} url={props.avatars?.get(p.avatar)} large />
                <div className="pm-card-names">
                    <div className="pm-card-name">{p.name}</div>
                    <div className="pm-card-id">{p.id}</div>
                    <div className="pm-card-tags">
                        {p.presence && <span className={`pm-tag pm-tag--${p.presence}`}>{t(`${P}presence_${p.presence}`)}</span>}
                        {p.kind === "bridged" && p.network && <span className="pm-tag">{t(`${P}bridged_from`, { network: p.network })}</span>}
                        {p.kind === "bot" && <span className="pm-tag">{t(`${P}bot`)}</span>}
                    </div>
                </div>
            </div>
            <div className="pm-card-actions">
                {p.dm && (
                    <button type="button" className="pm-button pm-button--primary" onClick={() => props.onOpenRoom(p.dm!)}>
                        {t(`${P}open_dm`)}
                    </button>
                )}
                <button type="button" className="pm-button" onClick={() => props.onOpenProfile(p.id)}>
                    {t(`${P}open_profile`)}
                </button>
            </div>
            {group && <div className="pm-card-context">{t(`${P}known_from`, { place: group.label })}</div>}
            <div className="pm-closeness">
                <span>{t(`${P}closeness`)}</span>
                <span className="pm-meter" aria-hidden="true">
                    <span style={{ width: `${Math.round(p.closeness * 100)}%` }} />
                </span>
                <span className="pm-closeness-text">{t(`${P}closeness_value`, { percent: `${Math.round(p.closeness * 100)} %` })}</span>
            </div>
            <ul className="pm-facts">
                {facts.map((f) => (
                    <li key={f}>{f}</li>
                ))}
            </ul>
            {rooms.length > 0 && (
                <>
                    <div className="pm-section-title">{t(`${P}shared_rooms`)}</div>
                    <ul className="pm-rooms">
                        {rooms.map((id) => (
                            <li key={id}>
                                <button type="button" className="pm-room" onClick={() => props.onOpenRoom(id)}>
                                    <span className="pm-room-name">{graph.rooms.get(id)?.name ?? id}</span>
                                    <span className="pm-room-meta">{graph.rooms.get(id)?.members}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}

function Avatar(props: { person: Person; url?: string; large?: boolean }): JSX.Element {
    const [failed, setFailed] = useState(false);
    return (
        <span className={`pm-avatar pm-avatar--c${colourIndex(props.person.id) + 1}${props.large ? " pm-avatar--large" : ""}`} aria-hidden="true">
            {props.url && !failed ? <img src={props.url} alt="" onError={() => setFailed(true)} /> : initialOf(props.person.name)}
        </span>
    );
}

function Legend(props: { open: boolean; onToggle(): void; t: ModuleTranslate }): JSX.Element {
    const { t } = props;
    const id = useId();
    const items = ["middle", "sector", "size", "online", "dm"];
    return (
        <div className="pm-legend" data-open={props.open}>
            <button type="button" className="pm-legend-toggle" aria-expanded={props.open} aria-controls={id} onClick={props.onToggle}>
                {t(`${P}legend`)}
            </button>
            {props.open && (
                <ul id={id} className="pm-legend-list">
                    {items.map((i) => (
                        <li key={i}>
                            <span className={`pm-swatch pm-swatch--${i}`} aria-hidden="true" />
                            {t(`${P}legend_${i}`)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/** "12 shared rooms · DM · 3 days ago" */
function summary(p: Person, props: Pick<PeopleOverlayProps, "data" | "language">, t: ModuleTranslate): string {
    const group = props.data.groups.find((g) => g.key === p.group)?.label;
    return [plural(t, "rooms", p.rooms.filter((id) => id !== p.dm).length), p.dm ? t(`${P}dm`) : "", group ?? "", p.lastContact ? relative(p.lastContact, props.language) : ""]
        .filter(Boolean)
        .join(" · ");
}

function comparator(sort: SortOrder): (a: Person, b: Person) => number {
    const byName = (a: Person, b: Person): number => a.name.localeCompare(b.name);
    switch (sort) {
        case "recent":
            return (a, b) => b.lastContact - a.lastContact || b.closeness - a.closeness;
        case "rooms":
            return (a, b) => b.rooms.length - a.rooms.length || b.closeness - a.closeness;
        case "name":
            return byName;
        default:
            return (a, b) => b.closeness - a.closeness || byName(a, b);
    }
}

function plural(t: ModuleTranslate, key: string, count: number): string {
    return t(`${P}${key}_${count === 1 ? "one" : "other"}`, { count: String(count) });
}

/** "3 days ago", in the user's language. */
export function relative(ts: number, language: string, now = Date.now()): string {
    const s = (ts - now) / 1000;
    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ["year", 31_536_000],
        ["month", 2_592_000],
        ["week", 604_800],
        ["day", 86_400],
        ["hour", 3600],
        ["minute", 60],
    ];
    let rtf: Intl.RelativeTimeFormat;
    try {
        rtf = new Intl.RelativeTimeFormat(language, { numeric: "auto" });
    } catch {
        rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    }
    for (const [unit, secs] of units) if (Math.abs(s) >= secs) return rtf.format(Math.round(s / secs), unit);
    return rtf.format(0, "minute");
}

/** Same colour pick as Element's avatars (Compound's useIdColorHash). */
export function colourIndex(id: string): number {
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    return sum % 6;
}

