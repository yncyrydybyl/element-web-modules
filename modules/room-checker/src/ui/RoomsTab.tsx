import { useEffect, useRef, useState, type JSX } from "react";

import type { Snapshot } from "../history";
import { P } from "../i18n";
import { POLICY_IDS, type CheckResult, type Detail, type PolicyId, type PolicySet, type Severity } from "../policies";
import {
    aliasFromName,
    applyFix,
    canFix,
    FIX_EVENT,
    FIX_INPUT,
    fixValue,
    readPolicies,
    saveException,
    topicOfRoom,
    type RoomEntry,
    type SpacePolicies,
} from "../space";
import { plural, relative, type CheckerOverlayProps, type ModuleTranslate } from "./CheckerOverlay";

export type Filter = "all" | "failing" | "errors" | "warnings" | "unchecked" | "new" | PolicyId;

export interface RoomsTabProps extends CheckerOverlayProps {
    spaceId: string;
    spacePolicies: SpacePolicies;
    entries: RoomEntry[];
    policies: PolicySet;
    filter: Filter;
    setFilter(f: Filter): void;
    query: string;
    setQuery(q: string): void;
    selected?: string;
    setSelected(id: string | undefined): void;
    spaceName(id: string): string;
    /** Your daily snapshots of this space, oldest first. */
    trend: Snapshot[];
    /** The last one from before today. */
    previous?: Snapshot;
}

const result = (e: RoomEntry, id: PolicyId): CheckResult | undefined => e.report?.results.get(id);
const failsPolicy = (e: RoomEntry, id: PolicyId): boolean => result(e, id)?.status === "fail";
const passesAll = (e: RoomEntry): boolean => Boolean(e.report && !e.report.errors && !e.report.warnings && !e.report.unknown);

export function RoomsTab(props: RoomsTabProps): JSX.Element {
    const { entries, policies, filter, t } = props;
    // Sub-spaces with policies of their own may check more.
    const enabled = POLICY_IDS.filter((id) => policies[id].enabled || entries.some((e) => e.policies[id].enabled));
    const wasFailing = new Set(props.previous?.failing ?? []);
    const isNew = (e: RoomEntry): boolean => Boolean(props.previous && e.report && (e.report.errors || e.report.warnings) && !wasFailing.has(e.id));
    const newCount = entries.filter(isNew).length;
    const joined = entries.filter((e) => e.room);
    const passing = entries.filter(passesAll).length;
    const withErrors = entries.filter((e) => e.report?.errors).length;
    const onlyWarnings = entries.filter((e) => e.report && !e.report.errors && e.report.warnings).length;
    const notJoined = entries.length - joined.length;
    const excepted = entries.reduce((n, e) => n + [...(e.report?.results.values() ?? [])].filter((r) => r.status === "excepted").length, 0);
    // The pass rate counts the rooms you're in: the others can only be checked in part.
    const percent = joined.length ? Math.round((joined.filter(passesAll).length / joined.length) * 100) : 0;

    const q = props.query.trim().toLowerCase();
    const shown = entries
        .filter((e) => {
            if (q && !e.name.toLowerCase().includes(q) && !e.id.toLowerCase().includes(q)) return false;
            if (filter === "failing") return Boolean(e.report && (e.report.errors || e.report.warnings));
            if (filter === "errors") return Boolean(e.report?.errors);
            if (filter === "warnings") return Boolean(e.report && !e.report.errors && e.report.warnings);
            if (filter === "unchecked") return !e.room;
            if (filter === "new") return isNew(e);
            if (filter !== "all") return failsPolicy(e, filter);
            return true;
        })
        // Worst first; rooms you aren't in after those you are, at the same score.
        .sort((a, b) => rank(b) - rank(a) || Number(Boolean(b.room)) - Number(Boolean(a.room)) || a.name.localeCompare(b.name));
    const entry = props.selected ? entries.find((e) => e.id === props.selected) : undefined;
    const policyFilter = (POLICY_IDS as readonly string[]).includes(filter) ? (filter as PolicyId) : undefined;

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
                        {notJoined > 0 && stat("unchecked", notJoined, t(`${P}stat_unchecked`), "unchecked")}
                    </div>
                    {joined.length > 0 && (
                        <div className="rc-compliance">
                            <span className="rc-meter" aria-hidden="true">
                                <span style={{ width: `${percent}%` }} />
                            </span>
                            <span>
                                {t(`${P}compliance`, { percent: `${percent} %` })}
                                {excepted > 0 && <span className="rc-excepted-count"> · {plural(t, "exceptions_count", excepted)}</span>}
                            </span>
                        </div>
                    )}
                    {props.trend.length > 1 && <Trend trend={props.trend} language={props.language} t={t} />}
                    <div className="rc-section-title">{t(`${P}by_policy`)}</div>
                    <div className="rc-bars">
                        {enabled.map((id) => {
                            const n = entries.filter((e) => failsPolicy(e, id)).length;
                            const of = entries.filter((e) => result(e, id) && result(e, id)!.status !== "unknown").length;
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
                                        <span style={{ width: of ? `${(n / of) * 100}%` : 0 }} />
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
                        {props.previous && (
                            <button
                                type="button"
                                className="rc-chip"
                                aria-pressed={filter === "new"}
                                disabled={!newCount}
                                title={t(`${P}since`, { when: relative(props.previous.at, props.language) })}
                                onClick={() => props.setFilter(filter === "new" ? "all" : "new")}
                            >
                                {t(`${P}filter_new`, { count: String(newCount) })}
                            </button>
                        )}
                        {policyFilter && (
                            <button type="button" className="rc-chip" aria-pressed={true} onClick={() => props.setFilter("all")}>
                                {t(`${P}filter_policy`, { policy: t(`${P}policy_${policyFilter}`) })} ×
                            </button>
                        )}
                    </div>
                    <Report {...props} enabled={enabled} />
                </div>

                {policyFilter && <BulkFix key={policyFilter} {...props} id={policyFilter} failing={entries.filter((e) => failsPolicy(e, policyFilter))} />}

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
                                                <Status result={result(e, id)} severity={e.policies[id].severity} t={t} />
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
    const parts = e.room ? [] : [t(`${P}not_joined`)];
    if (e.report?.errors) parts.push(plural(t, "room_errors", e.report.errors));
    if (e.report?.warnings) parts.push(plural(t, "room_warnings", e.report.warnings));
    if (e.room && parts.length === 0) parts.push(t(`${P}room_ok`));
    return parts.join(" · ");
}

function Status(props: { result?: CheckResult; severity: Severity; t: ModuleTranslate }): JSX.Element {
    const { result: r, t } = props;
    if (!r) return <span className="rc-status rc-status--none" aria-label="–">–</span>;
    const kind = r.status === "fail" ? props.severity : r.status;
    const label =
        r.status === "pass"
            ? t(`${P}passes`)
            : r.status === "unknown"
              ? t(`${P}status_unknown`)
              : r.status === "excepted"
                ? t(`${P}status_excepted`, { reason: r.exception!.reason })
                : detailText(r.detail, t);
    const icon = { pass: "✓", excepted: "✓", unknown: "?", error: "✕", warning: "!" }[kind];
    return (
        <span className={`rc-status rc-status--${kind}`} title={label} aria-label={label}>
            {icon}
        </span>
    );
}

function detailText(detail: Detail | undefined, t: ModuleTranslate): string {
    if (!detail) return "";
    const vars = { ...detail.vars };
    // Join rules and history settings read as words, not protocol values.
    if (vars.value) vars.value = t(`${P}value_${vars.value}`);
    return t(`${P}check_${detail.key}`, vars);
}

function RoomDetail(props: RoomsTabProps & { entry: RoomEntry; onBack(): void }): JSX.Element {
    const { entry: e, t } = props;
    const policies = e.policies;
    const enabled = POLICY_IDS.filter((id) => policies[id].enabled);
    // Failures first, then accepted ones, what couldn't be checked, and what passes.
    const order = { fail: 0, excepted: 1, unknown: 2, pass: 3 };
    const ids = enabled.filter((id) => result(e, id)).sort((a, b) => order[result(e, a)!.status] - order[result(e, b)!.status]);
    const sub = e.parentSpace !== props.spaceId && e.parentSpace;
    return (
        <aside className="rc-detail" data-testid="room-checker-detail" aria-label={e.name}>
            <button type="button" className="rc-back" onClick={props.onBack}>
                ‹ {t(`${P}back`)}
            </button>
            <div className="rc-detail-name">{e.name}</div>
            <div className="rc-detail-id">{e.id}</div>
            {sub && <div className="rc-detail-id">{t(`${P}in_subspace`, { space: props.spaceName(sub) })}</div>}
            {e.policySpace !== props.spaceId && <div className="rc-detail-id">{t(`${P}rules_from`, { space: props.spaceName(e.policySpace) })}</div>}
            <div className="rc-actions">
                <button type="button" className="rc-button" onClick={() => props.onOpenRoom(e.id)}>
                    {e.room ? t(`${P}open_room`) : t(`${P}view_room`)}
                </button>
                {e.room && (
                    <button type="button" className="rc-button" onClick={() => props.onRoomSettings(e.id)}>
                        {t(`${P}room_settings`)}
                    </button>
                )}
            </div>
            {!e.room && <p className="rc-note">{e.report ? t(`${P}not_joined_partial`) : t(`${P}not_joined_detail`)}</p>}
            {e.report && (
                <ul className="rc-checks">
                    {ids.map((id) => {
                        const r = result(e, id)!;
                        const severity = policies[id].severity;
                        return (
                            <li key={id} className="rc-check">
                                <Status result={r} severity={severity} t={t} />
                                <div className="rc-check-body">
                                    <div className="rc-check-name">
                                        {t(`${P}policy_${id}`)}
                                        {r.status === "fail" && <span className={`rc-tag rc-tag--${severity}`}>{t(`${P}severity_${severity}`)}</span>}
                                        {r.status === "excepted" && <span className="rc-tag rc-tag--excepted">{t(`${P}excepted`)}</span>}
                                    </div>
                                    <div className="rc-check-detail">
                                        {r.status === "pass" ? t(`${P}passes`) : r.status === "unknown" ? t(`${P}status_unknown`) : detailText(r.detail, t)}
                                    </div>
                                    {r.status === "fail" && <Fix {...props} id={id} />}
                                    {(r.status === "fail" || r.status === "excepted") && <ExceptionControl {...props} id={id} result={r} />}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </aside>
    );
}

/** Accepting a failure for this room, with a reason, or taking that back. Only for whoever may change the policies. */
function ExceptionControl(props: RoomsTabProps & { entry: RoomEntry; id: PolicyId; result: CheckResult }): JSX.Element | null {
    const { client, entry, id, result: r, t } = props;
    // Exceptions live with the policies the room is checked against.
    const canEdit = entry.policySpace === props.spaceId ? props.spacePolicies.canEdit : readPolicies(client, entry.policySpace).canEdit;
    const [reason, setReason] = useState<string | undefined>();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | undefined>();
    useEffect(() => {
        setReason(undefined);
        setError(undefined);
    }, [entry.id, id, r.status]);

    const save = async (value?: string): Promise<void> => {
        setBusy(true);
        setError(undefined);
        try {
            await saveException(client, entry.policySpace, entry.id, id, value);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    };
    const failed = error && <div className="rc-note rc-note--error">{t(`${P}fix_failed`, { error })}</div>;

    if (r.status === "excepted") {
        const ex = r.exception!;
        return (
            <div className="rc-exception">
                <div className="rc-exception-reason">“{ex.reason}”</div>
                <div className="rc-note">{t(`${P}excepted_by`, { user: ex.by, when: relative(ex.at, props.language) })}</div>
                {canEdit && (
                    <button type="button" className="rc-link" disabled={busy} onClick={() => void save(undefined)}>
                        {t(`${P}take_back`)}
                    </button>
                )}
                {failed}
            </div>
        );
    }
    if (!canEdit) return null;
    if (reason === undefined)
        return (
            <button type="button" className="rc-link" onClick={() => setReason("")}>
                {t(`${P}accept`)}
            </button>
        );
    return (
        <form
            className="rc-fix-form"
            onSubmit={(ev) => {
                ev.preventDefault();
                if (reason.trim()) void save(reason.trim());
            }}
        >
            <input aria-label={t(`${P}accept_reason`)} placeholder={t(`${P}accept_reason`)} value={reason} autoFocus onChange={(ev) => setReason(ev.target.value)} />
            <div className="rc-fix-buttons">
                <button type="submit" className="rc-button rc-button--primary" disabled={!reason.trim() || busy}>
                    {t(`${P}accept_save`)}
                </button>
                <button type="button" className="rc-button" onClick={() => setReason(undefined)}>
                    {t(`${P}cancel`)}
                </button>
            </div>
            {failed}
        </form>
    );
}

type FixState = { step: "idle" } | { step: "edit"; value: string } | { step: "confirm" } | { step: "busy" } | { step: "done" } | { step: "failed"; error: string };

function Fix(props: RoomsTabProps & { entry: RoomEntry; id: PolicyId }): JSX.Element | null {
    const { client, entry, id, t } = props;
    const [state, setState] = useState<FixState>({ step: "idle" });
    const fileRef = useRef<HTMLInputElement>(null);
    const config = entry.policies[id];
    useEffect(() => setState({ step: "idle" }), [entry.id, id]);

    if (!FIX_EVENT[id]) return <div className="rc-note">{t(`${P}no_fix`)}</div>;
    if (!entry.room) return <div className="rc-note">{t(`${P}join_to_fix`)}</div>;
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
    const label = fixLabel(id, entry.policies, t);
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

function fixLabel(id: PolicyId, policies: PolicySet, t: ModuleTranslate): string {
    const c = policies[id];
    const value = fixValue(id, c);
    return t(`${P}fix_${id}`, { value: value ? t(`${P}value_${value}`) : "", level: String(c.level ?? ""), user: c.user ?? "" });
}

type BulkState =
    | { step: "idle" }
    | { step: "confirm" }
    | { step: "running"; done: number }
    | { step: "finished"; ok: number; failed: Array<{ name: string; error: string }> };

/**
 * One policy, fixed in every failing room you may change at once. Only fixes that need no input
 * per room (encryption, join rule, history, guests, the space link).
 */
function BulkFix(props: RoomsTabProps & { id: PolicyId; failing: RoomEntry[] }): JSX.Element | null {
    const { client, id, failing, policies, t } = props;
    const [state, setState] = useState<BulkState>({ step: "idle" });
    // Fixed while this runs, the rooms drop out of `failing`: keep the list we started with.
    const [targets, setTargets] = useState<RoomEntry[]>([]);
    if (!failing.length && state.step === "idle") return null;

    const perRoom = Boolean(FIX_INPUT[id]) || !FIX_EVENT[id];
    const fixable = perRoom ? [] : failing.filter((e) => e.room && canFix(client, e, id));
    const skipped = failing.length - fixable.length;
    const label = perRoom ? "" : fixLabel(id, policies, t);

    const run = async (): Promise<void> => {
        const rooms = fixable;
        setTargets(rooms);
        const failed: Array<{ name: string; error: string }> = [];
        for (let i = 0; i < rooms.length; i++) {
            setState({ step: "running", done: i });
            try {
                await applyFix(client, rooms[i], id, rooms[i].policies[id]);
            } catch (e) {
                failed.push({ name: rooms[i].name, error: e instanceof Error ? e.message : String(e) });
            }
        }
        setState({ step: "finished", ok: rooms.length - failed.length, failed });
    };

    let body: JSX.Element;
    if (state.step === "running") body = <span>{t(`${P}bulk_running`, { done: String(state.done + 1), count: String(targets.length) })}</span>;
    else if (state.step === "finished")
        body = (
            <>
                <span className={state.failed.length ? "" : "rc-note--ok"}>{t(`${P}bulk_done`, { ok: String(state.ok), count: String(targets.length) })}</span>
                {state.failed.length > 0 && (
                    <ul className="rc-bulk-list rc-note--error">
                        {state.failed.map((f) => (
                            <li key={f.name}>{t(`${P}bulk_failed_room`, { room: f.name, error: f.error })}</li>
                        ))}
                    </ul>
                )}
                <button type="button" className="rc-link" onClick={() => setState({ step: "idle" })}>
                    {t(`${P}close`)}
                </button>
            </>
        );
    else if (state.step === "confirm")
        body = (
            <>
                <span>{id === "encryption" ? t(`${P}fix_encryption_confirm`) : t(`${P}bulk_confirm`)}</span>
                <ul className="rc-bulk-list">
                    {fixable.map((e) => (
                        <li key={e.id}>{e.name}</li>
                    ))}
                </ul>
                <div className="rc-fix-buttons">
                    <button type="button" className="rc-button rc-button--primary" onClick={() => void run()}>
                        {plural(t, "bulk_go", fixable.length)}
                    </button>
                    <button type="button" className="rc-button" onClick={() => setState({ step: "idle" })}>
                        {t(`${P}cancel`)}
                    </button>
                </div>
            </>
        );
    else
        body = (
            <>
                <span>{plural(t, "bulk_failing", failing.length)}</span>
                {perRoom ? (
                    <span className="rc-note">{t(`${P}bulk_per_room`)}</span>
                ) : (
                    <>
                        {fixable.length > 0 && (
                            <button type="button" className="rc-button rc-button--primary" onClick={() => setState({ step: "confirm" })}>
                                {t(`${P}bulk_fix`, { action: label, count: String(fixable.length) })}
                            </button>
                        )}
                        {skipped > 0 && <span className="rc-note">{plural(t, "bulk_skipped", skipped)}</span>}
                    </>
                )}
            </>
        );
    return (
        <div className="rc-bulk" data-testid="room-checker-bulk" aria-live="polite">
            {body}
        </div>
    );
}

/** The pass rate (of the rooms you're in) over your daily snapshots. */
function Trend(props: { trend: Snapshot[]; language: string; t: ModuleTranslate }): JSX.Element {
    const { trend, t } = props;
    const rate = (s: Snapshot): number => (s.joined ? s.passing / s.joined : 0);
    const W = 160;
    const H = 28;
    const points = trend.map((s, i) => `${((i / (trend.length - 1)) * W).toFixed(1)},${(H - 2 - rate(s) * (H - 4)).toFixed(1)}`).join(" ");
    const first = Math.round(rate(trend[0]) * 100);
    const last = Math.round(rate(trend[trend.length - 1]) * 100);
    const label = t(`${P}trend`, { from: `${first} %`, to: `${last} %`, since: relative(trend[0].at, props.language) });
    return (
        <div className="rc-trend" title={label}>
            <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
                <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span>{label}</span>
        </div>
    );
}

const CELL: Record<string, string> = { pass: "pass", fail: "fail", excepted: "accepted", unknown: "unknown" };

/** The table as CSV: one row per room, one column per policy (pass, fail, accepted, unknown, or empty when off). */
export function reportCsv(entries: RoomEntry[], enabled: PolicyId[], t: ModuleTranslate): string {
    const quote = (v: string | number): string => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const head = [t(`${P}col_room`), "room_id", "joined", "errors", "warnings", ...enabled.map((id) => t(`${P}policy_${id}`))];
    const rows = entries.map((e) => [
        e.name,
        e.id,
        e.room ? "yes" : "no",
        e.report?.errors ?? "",
        e.report?.warnings ?? "",
        ...enabled.map((id) => CELL[e.report?.results.get(id)?.status ?? ""] ?? ""),
    ]);
    return [head, ...rows].map((r) => r.map(quote).join(",")).join("\n") + "\n";
}

/** A short Markdown report: the numbers, then every failing room with what fails. */
export function reportMarkdown(space: string, entries: RoomEntry[], t: ModuleTranslate, now = new Date()): string {
    const failing = entries.filter((e) => e.report && (e.report.errors || e.report.warnings));
    const lines = [
        `## ${t(`${P}report_title`, { space, date: now.toISOString().slice(0, 10) })}`,
        "",
        `${t(`${P}stat_rooms`)}: ${entries.length} · ${t(`${P}stat_errors`)}: ${entries.filter((e) => e.report?.errors).length} · ${t(`${P}stat_warnings`)}: ${
            entries.filter((e) => e.report && !e.report.errors && e.report.warnings).length
        } · ${t(`${P}stat_unchecked`)}: ${entries.filter((e) => !e.room).length}`,
        "",
    ];
    if (!failing.length) lines.push(t(`${P}report_all_pass`));
    for (const e of failing) {
        const fails = POLICY_IDS.filter((id) => e.report!.results.get(id)?.status === "fail").map(
            (id) => `${t(`${P}policy_${id}`)} (${t(`${P}severity_${e.policies[id].severity}`)})`,
        );
        lines.push(`- **${e.name.replace(/[*_`[\]]/g, "\\$&")}**: ${fails.join(", ")}`);
    }
    return lines.join("\n") + "\n";
}

function Report(props: RoomsTabProps & { enabled: PolicyId[] }): JSX.Element {
    const { t } = props;
    const [copied, setCopied] = useState<"ok" | "failed" | undefined>();
    const download = (): void => {
        const blob = new Blob([reportCsv(props.entries, props.enabled, t)], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `room-check-${props.spaceName(props.spaceId).replace(/[^\p{L}\p{N}_-]+/gu, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    const copy = async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(reportMarkdown(props.spaceName(props.spaceId), props.entries, t));
            setCopied("ok");
        } catch {
            setCopied("failed");
        }
        setTimeout(() => setCopied(undefined), 2500);
    };
    return (
        <div className="rc-report">
            <button type="button" className="rc-button" onClick={download}>
                {t(`${P}report_csv`)}
            </button>
            <button type="button" className="rc-button" onClick={() => void copy()}>
                {copied === "ok" ? t(`${P}report_copied`) : copied === "failed" ? t(`${P}report_copy_failed`) : t(`${P}report_markdown`)}
            </button>
        </div>
    );
}
