import { useEffect, useId, useMemo, useRef, useState, type JSX, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

import { version } from "../../package.json";
import { P } from "../i18n";
import { fetchHierarchy, readPolicies, spaceRooms, type HierarchyRoom, type SdkClient, type SpaceInfo } from "../space";
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
}

export function CheckerOverlay(props: CheckerOverlayProps): JSX.Element {
    const { client, spaces, t } = props;
    const titleId = useId();
    const [spaceId, setSpaceId] = useState(() => spaces.find((s) => s.id === props.space)?.id ?? spaces[0]?.id);
    const [tab, setTab] = useState<Tab>("rooms");
    const [filter, setFilter] = useState<Filter>("all");
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<string | undefined>();
    const [hierarchy, setHierarchy] = useState<Map<string, HierarchyRoom>>(new Map());
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => panelRef.current?.focus(), []);

    // Rooms you aren't in (and their sub-spaces) are known from the server's space hierarchy.
    useEffect(() => {
        if (!spaceId) return;
        let live = true;
        setHierarchy(new Map());
        void fetchHierarchy(client, spaceId).then((h) => live && setHierarchy(h));
        return () => {
            live = false;
        };
    }, [client, spaceId]);

    const sp = useMemo(() => (spaceId ? readPolicies(client, spaceId) : undefined), [client, spaceId, props.revision]);
    const entries = useMemo(
        () => (spaceId && sp ? spaceRooms(client, spaceId, sp.policies, sp.exceptions, hierarchy) : []),
        [client, spaceId, sp, hierarchy, props.revision],
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
        body = (
            <PoliciesTab
                key={spaceId}
                client={client}
                spaceId={spaceId}
                space={sp}
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
                policies={sp.policies}
                filter={filter}
                setFilter={setFilter}
                query={query}
                setQuery={setQuery}
                selected={selected}
                setSelected={setSelected}
                spaceName={(id) => spaces.find((s) => s.id === id)?.name ?? client.getRoom(id)?.name ?? hierarchy.get(id)?.name ?? id}
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
