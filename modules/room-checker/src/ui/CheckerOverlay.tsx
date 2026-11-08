import { useEffect, useId, useMemo, useRef, useState, type JSX, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

import { version } from "../../package.json";
import { P } from "../i18n";
import { POLICY_IDS, type PolicyId, type PolicySet } from "../policies";
import {
    aliasFromName,
    applyFix,
    canFix,
    FIX_EVENT,
    FIX_INPUT,
    fixValue,
    hierarchyNames,
    readPolicies,
    spaceRooms,
    topicOfRoom,
    type RoomEntry,
    type SdkClient,
    type SpaceInfo,
} from "../space";
import { PoliciesTab } from "./PoliciesTab";

/** Translates one of this module's own strings. */
export type ModuleTranslate = (key: string, variables?: Record<string, string>) => string;

export type Tab = "rooms" | "policies";
type Filter = "all" | "failing" | "errors" | "warnings" | "unchecked" | PolicyId;

export interface CheckerOverlayProps {
    client: SdkClient;
    spaces: SpaceInfo[];
    space?: string;
    /** Bumped when room state changes, to check again. */
    revision: number;
    language: string;
    triggerLabel: string;
    t: ModuleTranslate;
    onSpaceChange(spaceId: string): void;
    onOpenRoom(roomId: string): void;
    onRoomSettings(roomId: string): void;
    onClose(): void;
}

export function CheckerOverlay(props: CheckerOverlayProps): JSX.Element {
    const { client, spaces, t } = props;
    const titleId = useId();
    const [spaceId, setSpaceId] = useState(() => spaces.find((s) => s.id === props.space)?.id ?? spaces[0]?.id);
    const [tab, setTab] = useState<Tab>("rooms");
    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<string | undefined>();
    const [names, setNames] = useState<Map<string, string>>(new Map());
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => panelRef.current?.focus(), []);

    // Names of the rooms you aren't in come from the server.
    useEffect(() => {
        if (!spaceId) return;
        let live = true;
        setNames(new Map());
        void hierarchyNames(client, spaceId).then((n) => live && setNames(n));
        return () => {
            live = false;
        };
    }, [client, spaceId]);

    const sp = useMemo(() => (spaceId ? readPolicies(client, spaceId) : undefined), [client, spaceId, props.revision]);
    const entries = useMemo(
        () => (spaceId && sp ? spaceRooms(client, spaceId, sp.policies, names) : []),
        [client, spaceId, sp, names, props.revision],
    );

    const chooseSpace = (id: string): void => {
        setSpaceId(id);
        setSelected(undefined);
        setFilter("all");
        props.onSpaceChange(id);
    };

    const onKeyDown = (ev: ReactKeyboardEvent): void => {
        if (ev.key !== "Escape") return;
        ev.preventDefault();
        if (selected) setSelected(undefined);
        else props.onClose();
    };

    let body: ReactNode;
    if (!spaceId || !sp) body = <div className="rc-empty">{t(`${P}no_spaces`)}</div>;
    else if (tab === "policies")
        body = <PoliciesTab key={spaceId} client={client} spaceId={spaceId} space={sp} revision={props.revision} language={props.language} t={t} />;
    else
        body = (
            <RoomsTab
                {...props}
                spaceId={spaceId}
                entries={entries}
                policies={sp.policies}
                filter={filter}
                setFilter={setFilter}
                query={query}
                setQuery={setQuery}
                selected={selected}
                setSelected={setSelected}
                spaceName={(id) => spaces.find((s) => s.id === id)?.name ?? client.getRoom(id)?.name ?? id}
            />
        );

    return (
        <div className="rc-backdrop" onMouseDown={(ev) => ev.target === ev.currentTarget && props.onClose()}>
            <div ref={panelRef} tabIndex={-1} className="rc-panel" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKeyDown}>
                <header className="rc-header">
                    <h2 id={titleId} className="rc-title">
                        {t(`${P}title`)}
                    </h2>
                    {spaces.length > 0 && (
                        <label className="rc-space">
                            <span>{t(`${P}space`)}</span>
                            <select value={spaceId} onChange={(ev) => chooseSpace(ev.target.value)}>
                                {spaces.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {"\u00a0\u00a0".repeat(s.depth)}
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    <div className="rc-tabs" role="tablist">
                        {(["rooms", "policies"] as Tab[]).map((x) => (
                            <button key={x} type="button" role="tab" className="rc-tab" aria-selected={tab === x} onClick={() => setTab(x)}>
                                {t(`${P}tab_${x}`)}
                            </button>
                        ))}
                    </div>
                    <button type="button" className="rc-close" aria-label={t(`${P}close`)} onClick={props.onClose}>
                        ×
                    </button>
                </header>
                <div className="rc-body">{body}</div>
                <footer className="rc-footer">
                    <span>{t(`${P}hint`, { key: props.triggerLabel })}</span>
                    <span className="rc-version">v{version}</span>
                </footer>
            </div>
        </div>
    );
}

interface RoomsTabProps extends CheckerOverlayProps {
    spaceId: string;
    entries: RoomEntry[];
    policies: PolicySet;
    filter: Filter;
    setFilter(f: Filter): void;
    query: string;
    setQuery(q: string): void;
    selected?: string;
    setSelected(id: string | undefined): void;
    spaceName(id: string): string;
}

function RoomsTab(props: RoomsTabProps): JSX.Element {
    const { entries, policies, filter, t } = props;
    const enabled = POLICY_IDS.filter((id) => policies[id].enabled);
    const checked = entries.filter((e) => e.report);
    const passing = checked.filter((e) => !e.report!.errors && !e.report!.warnings).length;
    const withErrors = checked.filter((e) => e.report!.errors).length;
    const onlyWarnings = checked.filter((e) => !e.report!.errors && e.report!.warnings).length;
    const failures = (id: PolicyId): number => checked.filter((e) => e.report!.results.get(id)?.pass === false).length;

    const q = props.query.trim().toLowerCase();
    const shown = entries
        .filter((e) => {
            if (q && !e.name.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false;
            if (filter === "failing") return Boolean(e.report && (e.report.errors || e.report.warnings));
            if (filter === "errors") return Boolean(e.report?.errors);
            if (filter === "warnings") return Boolean(e.report && !e.report.errors && e.report.warnings);
            if (filter === "unchecked") return !e.report;
            if (filter !== "all") return e.report?.results.get(filter)?.pass === false;
            return true;
        })
        // Worst first; rooms you aren't in last.
        .sort((a, b) => rank(b) - rank(a) || a.name.localeCompare(b.name));
    const entry = props.selected ? entries.find((e) => e.id === props.selected) : undefined;
    const percent = checked.length ? Math.round((passing / checked.length) * 100) : 0;

    const stat = (f: Filter, value: number, label: string, tone: string): JSX.Element => (
        <button type="button" className={`rc-stat rc-stat--${tone}`} aria-pressed={filter === f} onClick={() => props.setFilter(filter === f ? "all" : f)}>
            <span className="rc-stat-value">{value}</span>
            <span className="rc-stat-label">{label}</span>
        </button>
    );

    return (
        <div className={`rc-rooms${entry ? " rc-rooms--detail" : ""}`}>
            <div className="rc-main">
                <section className="rc-summary" aria-label={t(`${P}tab_rooms`)}>
                    <div className="rc-stats">
                        {stat("all", entries.length, t(`${P}stat_rooms`), "all")}
                        {stat("errors", withErrors, t(`${P}stat_errors`), "error")}
                        {stat("warnings", onlyWarnings, t(`${P}stat_warnings`), "warning")}
                        <div className="rc-stat rc-stat--pass">
                            <span className="rc-stat-value">{passing}</span>
                            <span className="rc-stat-label">{t(`${P}stat_pass`)}</span>
                        </div>
                        {entries.length > checked.length && stat("unchecked", entries.length - checked.length, t(`${P}stat_unchecked`), "unchecked")}
                    </div>
                    {checked.length > 0 && (
                        <div className="rc-compliance">
                            <span className="rc-meter" aria-hidden="true">
                                <span style={{ width: `${percent}%` }} />
                            </span>
                            <span>{t(`${P}compliance`, { percent: `${percent} %` })}</span>
                        </div>
                    )}
                    <div className="rc-section-title">{t(`${P}by_policy`)}</div>
                    <div className="rc-bars">
                        {enabled.map((id) => {
                            const n = failures(id);
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    className={`rc-bar rc-bar--${policies[id].severity}`}
                                    aria-pressed={filter === id}
                                    disabled={!n}
                                    onClick={() => props.setFilter(filter === id ? "all" : id)}
                                >
                                    <span className="rc-bar-label">{t(`${P}policy_${id}`)}</span>
                                    <span className="rc-bar-track" aria-hidden="true">
                                        <span style={{ width: checked.length ? `${(n / checked.length) * 100}%` : 0 }} />
                                    </span>
                                    <span className="rc-bar-count">{n}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <div className="rc-toolbar">
                    <input
                        className="rc-search"
                        type="search"
                        placeholder={t(`${P}search`)}
                        aria-label={t(`${P}search`)}
                        value={props.query}
                        onChange={(ev) => props.setQuery(ev.target.value)}
                    />
                    <div className="rc-chips" role="group">
                        {(["all", "failing", "unchecked"] as Filter[]).map((f) => (
                            <button key={f} type="button" className="rc-chip" aria-pressed={filter === f} onClick={() => props.setFilter(f)}>
                                {t(`${P}filter_${f}`)}
                            </button>
                        ))}
                        {(POLICY_IDS as readonly string[]).includes(filter) && (
                            <button type="button" className="rc-chip" aria-pressed={true} onClick={() => props.setFilter("all")}>
                                {t(`${P}filter_policy`, { policy: t(`${P}policy_${filter}`) })} ×
                            </button>
                        )}
                    </div>
                </div>

                {entries.length === 0 ? (
                    <div className="rc-empty">{t(`${P}no_rooms`)}</div>
                ) : shown.length === 0 ? (
                    <div className="rc-empty">{t(`${P}no_match`)}</div>
                ) : (
                    <div className="rc-table-wrap">
                        <table className="rc-table">
                            <thead>
                                <tr>
                                    <th scope="col" className="rc-col-room">
                                        {t(`${P}col_room`)}
                                    </th>
                                    {enabled.map((id) => (
                                        <th key={id} scope="col" className="rc-col-policy" title={t(`${P}policy_${id}_desc`)}>
                                            <span>{t(`${P}policy_${id}`)}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map((e) => (
                                    <tr
                                        key={e.id}
                                        className="rc-row"
                                        aria-selected={e.id === props.selected}
                                        tabIndex={0}
                                        onClick={() => props.setSelected(e.id)}
                                        onKeyDown={(ev) => {
                                            if (ev.key === "Enter" || ev.key === " ") {
                                                ev.preventDefault();
                                                props.setSelected(e.id);
                                            }
                                        }}
                                    >
                                        <th scope="row" className="rc-col-room">
                                            <span className="rc-room-name">{e.name}</span>
                                            <span className="rc-room-meta">{roomSummary(e, t)}</span>
                                        </th>
                                        {enabled.map((id) => (
                                            <td key={id} className="rc-cell">
                                                <Status entry={e} id={id} severity={policies[id].severity} t={t} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {entry && <RoomDetail {...props} entry={entry} onBack={() => props.setSelected(undefined)} />}
        </div>
    );
}

function rank(e: RoomEntry): number {
    if (!e.report) return -1;
    return e.report.errors * 100 + e.report.warnings;
}

function roomSummary(e: RoomEntry, t: ModuleTranslate): string {
    if (!e.report) return t(`${P}not_joined`);
    const parts = [e.report.errors ? plural(t, "room_errors", e.report.errors) : "", e.report.warnings ? plural(t, "room_warnings", e.report.warnings) : ""].filter(Boolean);
    return parts.length ? parts.join(" · ") : t(`${P}room_ok`);
}

function Status(props: { entry: RoomEntry; id: PolicyId; severity: "error" | "warning"; t: ModuleTranslate }): JSX.Element {
    const r = props.entry.report?.results.get(props.id);
    if (!r) return <span className="rc-status rc-status--unknown" aria-label="–">–</span>;
    const label = r.pass ? props.t(`${P}passes`) : detailText(r.detail, props.t);
    const kind = r.pass ? "pass" : props.severity;
    return (
        <span className={`rc-status rc-status--${kind}`} title={label} aria-label={label}>
            {r.pass ? "✓" : kind === "error" ? "✕" : "!"}
        </span>
    );
}

function detailText(detail: { key: string; vars?: Record<string, string> } | undefined, t: ModuleTranslate): string {
    if (!detail) return "";
    const vars = { ...detail.vars };
    // Join rules and history settings read as words, not protocol values.
    if (vars.value) vars.value = t(`${P}value_${vars.value}`);
    return t(`${P}check_${detail.key}`, vars);
}

function RoomDetail(props: RoomsTabProps & { entry: RoomEntry; onBack(): void }): JSX.Element {
    const { entry: e, policies, t } = props;
    const enabled = POLICY_IDS.filter((id) => policies[id].enabled);
    const failing = enabled.filter((id) => e.report?.results.get(id)?.pass === false);
    const passing = enabled.filter((id) => e.report?.results.get(id)?.pass);
    const sub = e.parentSpace !== props.spaceId && e.parentSpace;
    return (
        <aside className="rc-detail" data-testid="room-checker-detail" aria-label={e.name}>
            <button type="button" className="rc-back" onClick={props.onBack}>
                ‹ {t(`${P}back`)}
            </button>
            <div className="rc-detail-name">{e.name}</div>
            <div className="rc-detail-id">{e.id}</div>
            {sub && <div className="rc-detail-id">{t(`${P}in_subspace`, { space: props.spaceName(sub) })}</div>}
            <div className="rc-actions">
                <button type="button" className="rc-button" onClick={() => props.onOpenRoom(e.id)}>
                    {t(`${P}open_room`)}
                </button>
                {e.room && (
                    <button type="button" className="rc-button" onClick={() => props.onRoomSettings(e.id)}>
                        {t(`${P}room_settings`)}
                    </button>
                )}
            </div>
            {!e.report ? (
                <p className="rc-note">{t(`${P}not_joined_detail`)}</p>
            ) : (
                <ul className="rc-checks">
                    {[...failing, ...passing].map((id) => {
                        const r = e.report!.results.get(id)!;
                        return (
                            <li key={id} className="rc-check">
                                <Status entry={e} id={id} severity={policies[id].severity} t={t} />
                                <div className="rc-check-body">
                                    <div className="rc-check-name">
                                        {t(`${P}policy_${id}`)}
                                        {!r.pass && <span className={`rc-tag rc-tag--${policies[id].severity}`}>{t(`${P}severity_${policies[id].severity}`)}</span>}
                                    </div>
                                    <div className="rc-check-detail">{r.pass ? t(`${P}passes`) : detailText(r.detail, t)}</div>
                                    {!r.pass && <Fix {...props} id={id} />}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </aside>
    );
}

type FixState = { step: "idle" } | { step: "edit"; value: string } | { step: "confirm" } | { step: "busy" } | { step: "done" } | { step: "failed"; error: string };

function Fix(props: RoomsTabProps & { entry: RoomEntry; id: PolicyId }): JSX.Element | null {
    const { client, entry, id, policies, t } = props;
    const [state, setState] = useState<FixState>({ step: "idle" });
    const fileRef = useRef<HTMLInputElement>(null);
    const config = policies[id];
    // A new check result (after the fix came back from the server) starts over.
    useEffect(() => setState({ step: "idle" }), [entry.id, id]);

    if (!FIX_EVENT[id]) return <div className="rc-note">{t(`${P}no_fix`)}</div>;
    if (!canFix(client, entry, id)) return <div className="rc-note">{t(`${P}no_power`)}</div>;

    const run = async (input?: string | File): Promise<void> => {
        setState({ step: "busy" });
        try {
            await applyFix(client, entry, id, config, input);
            setState({ step: "done" });
        } catch (e) {
            setState({ step: "failed", error: e instanceof Error ? e.message : String(e) });
        }
    };
    const value = fixValue(id, config);
    const label = t(`${P}fix_${id}`, value ? { value: t(`${P}value_${value}`) } : undefined);
    const input = FIX_INPUT[id];

    if (state.step === "busy") return <div className="rc-note">…</div>;
    if (state.step === "done") return <div className="rc-note rc-note--ok">{t(`${P}fix_done`)}</div>;
    if (state.step === "edit")
        return (
            <form
                className="rc-fix-form"
                onSubmit={(ev) => {
                    ev.preventDefault();
                    if (state.value.trim()) void run(state.value);
                }}
            >
                {id === "topic" ? (
                    <textarea aria-label={label} value={state.value} autoFocus rows={3} onChange={(ev) => setState({ step: "edit", value: ev.target.value })} />
                ) : (
                    <input aria-label={label} value={state.value} autoFocus onChange={(ev) => setState({ step: "edit", value: ev.target.value })} />
                )}
                <div className="rc-fix-buttons">
                    <button type="submit" className="rc-button rc-button--primary" disabled={!state.value.trim()}>
                        {t(`${P}save`)}
                    </button>
                    <button type="button" className="rc-button" onClick={() => setState({ step: "idle" })}>
                        {t(`${P}cancel`)}
                    </button>
                </div>
            </form>
        );
    if (state.step === "confirm")
        return (
            <div className="rc-fix-form">
                <div className="rc-note">{t(`${P}fix_encryption_confirm`)}</div>
                <div className="rc-fix-buttons">
                    <button type="button" className="rc-button rc-button--primary" onClick={() => void run()}>
                        {label}
                    </button>
                    <button type="button" className="rc-button" onClick={() => setState({ step: "idle" })}>
                        {t(`${P}cancel`)}
                    </button>
                </div>
            </div>
        );

    const start = (): void => {
        if (input === "file") return fileRef.current?.click();
        if (input === "text") {
            const room = entry.room;
            const initial = id === "name" ? (room?.name ?? "") : id === "topic" ? (room ? topicOfRoom(room) : "") : aliasFromName(entry.name);
            return setState({ step: "edit", value: initial });
        }
        if (id === "encryption") return setState({ step: "confirm" });
        void run();
    };
    return (
        <div className="rc-fix">
            <button type="button" className="rc-button rc-button--primary" onClick={start}>
                {label}
            </button>
            {input === "file" && (
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    data-testid="room-checker-avatar-input"
                    onChange={(ev) => {
                        const file = ev.target.files?.[0];
                        if (file) void run(file);
                    }}
                />
            )}
            {state.step === "failed" && <div className="rc-note rc-note--error">{t(`${P}fix_failed`, { error: state.error })}</div>}
        </div>
    );
}

export function plural(t: ModuleTranslate, key: string, count: number): string {
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
