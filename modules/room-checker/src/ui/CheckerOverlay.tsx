import { useEffect, useId, useMemo, useRef, useState, type JSX, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

import { version } from "../../package.json";
import { P } from "../i18n";
import { lastVisit, type Snapshot } from "../history";
import { effectiveRules, fetchHierarchy, readPolicies, spaceRooms, type HierarchyRoom, type RoomEntry, type SdkClient, type SpaceInfo } from "../space";
import { PoliciesTab } from "./PoliciesTab";
import { RoomsTab, type Filter } from "./RoomsTab";

/** Translates one of this module's own strings. */
export type ModuleTranslate = (key: string, variables?: Record<string, string>) => string;

export type Tab = "rooms" | "policies";

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
    /** Open on this room's details (from the room header). */
    room?: string;
    /** Your daily snapshots per space; missing: no history. */
    history?: { get(spaceId: string): Snapshot[]; record(spaceId: string, snapshot: Snapshot): Promise<void> };
}

/** The snapshot is written once the checks have settled. */
const SNAPSHOT_DELAY_MS = 1500;

export function snapshotOf(entries: RoomEntry[], now = Date.now()): Snapshot {
    const joined = entries.filter((e) => e.room);
    return {
        at: now,
        joined: joined.length,
        passing: joined.filter((e) => e.report && !e.report.errors && !e.report.warnings && !e.report.unknown).length,
        errors: entries.filter((e) => e.report?.errors).length,
        warnings: entries.filter((e) => e.report && !e.report.errors && e.report.warnings).length,
        failing: entries.filter((e) => e.report && (e.report.errors || e.report.warnings)).map((e) => e.id),
    };
}

export function CheckerOverlay(props: CheckerOverlayProps): JSX.Element {
    const { client, spaces, t } = props;
    const titleId = useId();
    const [spaceId, setSpaceId] = useState(() => spaces.find((s) => s.id === props.space)?.id ?? spaces[0]?.id);
    const [tab, setTab] = useState<Tab>("rooms");
    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<string | undefined>(props.room);
    const [hierarchy, setHierarchy] = useState<{ space?: string; rooms: Map<string, HierarchyRoom> }>({ rooms: new Map() });
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => panelRef.current?.focus(), []);

    // Rooms you aren't in (and their sub-spaces) are known from the server's space hierarchy.
    useEffect(() => {
        if (!spaceId) return;
        let live = true;
        setHierarchy({ rooms: new Map() });
        void fetchHierarchy(client, spaceId).then((rooms) => live && setHierarchy({ space: spaceId, rooms }));
        return () => {
            live = false;
        };
    }, [client, spaceId]);

    const sp = useMemo(() => (spaceId ? readPolicies(client, spaceId) : undefined), [client, spaceId, props.revision]);
    // A sub-space without policies of its own uses those of the nearest space above it.
    const rules = useMemo(() => (spaceId ? effectiveRules(client, spaceId, spaces) : undefined), [client, spaceId, spaces, sp]);
    const entries = useMemo(
        () => (spaceId && rules ? spaceRooms(client, spaceId, rules, hierarchy.rooms) : []),
        [client, spaceId, rules, hierarchy, props.revision],
    );
    const history = useMemo(() => (spaceId ? (props.history?.get(spaceId) ?? []) : []), [props.history, spaceId, props.revision]);
    const previous = useMemo(() => lastVisit(history), [history]);

    // Today's snapshot: once the rooms you aren't in are known too, and again (with your fixes) when
    // you leave the space or close the checker. Not on every change: on a busy account room state
    // changes all the time, and there would never be a quiet moment to write it.
    const ready = Boolean(spaceId) && hierarchy.space === spaceId;
    // Per space: when the space changes, this render already has the next space's rooms.
    const latest = useRef(new Map<string, RoomEntry[]>());
    if (ready && spaceId) latest.current.set(spaceId, entries);
    useEffect(() => {
        if (!ready || !spaceId || !props.history) return;
        const store = props.history;
        const record = (): void => void store.record(spaceId, snapshotOf(latest.current.get(spaceId) ?? [])).catch(() => {});
        const timer = setTimeout(record, SNAPSHOT_DELAY_MS);
        return () => {
            clearTimeout(timer);
            record();
        };
    }, [ready, spaceId, props.history]);

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
    if (!spaceId || !sp || !rules) body = <div className="rc-empty">{t(`${P}no_spaces`)}</div>;
    else if (tab === "policies")
        body = (
            <PoliciesTab
                key={spaceId}
                client={client}
                spaceId={spaceId}
                space={sp}
                rules={rules}
                ownPolicies={[...new Set(entries.map((e) => e.policySpace))].filter((id) => id !== spaceId && id !== rules.source)}
                spaceName={(id) => spaces.find((s) => s.id === id)?.name ?? client.getRoom(id)?.name ?? id}
                roomName={(id) => entries.find((e) => e.id === id)?.name ?? client.getRoom(id)?.name ?? id}
                revision={props.revision}
                language={props.language}
                t={t}
            />
        );
    else
        body = (
            <RoomsTab
                {...props}
                spaceId={spaceId}
                spacePolicies={sp}
                entries={entries}
                policies={rules.policies}
                trend={history}
                previous={previous}
                filter={filter}
                setFilter={setFilter}
                query={query}
                setQuery={setQuery}
                selected={selected}
                setSelected={setSelected}
                spaceName={(id) => spaces.find((s) => s.id === id)?.name ?? client.getRoom(id)?.name ?? hierarchy.rooms.get(id)?.name ?? id}
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
