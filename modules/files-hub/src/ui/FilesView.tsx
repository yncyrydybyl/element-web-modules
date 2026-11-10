import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type JSX } from "react";

import { filterFiles, formatSize, type Category, type FileItem, type SortKey } from "../files";
import { P, type ModuleTranslate } from "../i18n";
import type { FileIndex } from "../scanner";
import type { SpaceInfo } from "../spaces";
import { DownloadIcon, FileTypeIcon, LockIcon } from "./icons";
import { Preview } from "./Preview";

export interface FilesViewProps {
    t: ModuleTranslate;
    index: FileIndex;
    variant: "dialog" | "page";
    /** Opened from a room header: start with that room selected (Teams' channel Files tab). */
    initialRoomId?: string;
    spaces(): SpaceInfo[];
    roomsInSpace(spaceId: string): Set<string>;
    rooms(): { roomId: string; name: string }[];
    roomName(roomId: string): string;
    senderName(roomId: string, userId: string): string;
    formatDate(ts: number): string;
    previewMaxMb: number;
    /** Logged in and the first sync is done (the room list is complete). */
    ready(): boolean;
    open(item: FileItem): void;
    download(item: FileItem): Promise<void>;
    loadBytes(item: FileItem, signal: AbortSignal): Promise<ArrayBuffer>;
    onClose?(): void;
}

const CATEGORIES: (Category | "all")[] = ["all", "document", "image", "video", "other"];
/** Rows rendered at once; filters narrow it down. */
const MAX_ROWS = 400;

export function FilesView(props: FilesViewProps): JSX.Element {
    const { t, index, variant } = props;
    const version = useSyncExternalStore(
        useCallback((cb: () => void) => index.subscribe(cb), [index]),
        () => index.list(),
    );
    const [category, setCategory] = useState<Category | "all">("all");
    const [spaceId, setSpaceId] = useState("");
    const [roomId, setRoomId] = useState(props.initialRoomId ?? "");
    const [sender, setSender] = useState("");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState<SortKey>("date");
    const [selected, setSelected] = useState<FileItem | null>(null);
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { spaces: listSpaces, roomsInSpace, rooms: listRooms, senderName, ready: isReady } = props;
    // After a reload on #/files-hub the page renders before the first sync: wait for the room list.
    const [ready, setReady] = useState(isReady);
    useEffect(() => {
        if (ready) return;
        const timer = setInterval(() => isReady() && setReady(true), 1000);
        return () => clearInterval(timer);
    }, [ready, isReady]);
    const spaces = useMemo(() => (ready ? listSpaces() : []), [listSpaces, ready]);
    const spaceKey = useMemo(() => (spaceId ? [...roomsInSpace(spaceId)].sort().join("\n") : ""), [roomsInSpace, spaceId]);
    const spaceRooms = useMemo(() => (spaceId ? new Set(spaceKey.split("\n").filter(Boolean)) : undefined), [spaceId, spaceKey]);
    const roomOptions = useMemo(
        () => listRooms().filter((r) => !spaceRooms || spaceRooms.has(r.roomId) || r.roomId === roomId).sort((a, b) => a.name.localeCompare(b.name)),
        [listRooms, spaceRooms, roomId, ready],
    );
    const scope = useMemo<ReadonlySet<string> | undefined>(() => (roomId ? new Set([roomId]) : spaceRooms), [roomId, spaceRooms]);
    const scopeKey = ready ? index.scannableRooms(scope).join("\n") : "";
    const scopeRooms = useMemo(() => scopeKey.split("\n").filter(Boolean), [scopeKey]);

    // Lazy and cancellable: only the rooms in view are scanned, and only while the view is open.
    useEffect(() => {
        void index.scan(scopeRooms);
    }, [index, scopeRooms]);
    useEffect(() => () => index.cancel(), [index]);

    const inScope = useMemo(() => filterFiles(version, { roomIds: scope, category }), [version, scope, category]);
    const senders = useMemo(() => {
        const names = new Map<string, string>();
        for (const i of inScope) if (!names.has(i.sender)) names.set(i.sender, senderName(i.roomId, i.sender));
        return [...names].sort((a, b) => a[1].localeCompare(b[1]));
    }, [inScope, senderName]);
    const shown = useMemo(() => filterFiles(inScope, { sender: sender || undefined, query }, sort), [inScope, sender, query, sort]);
    const progress = index.progress(scopeRooms);

    useEffect(() => {
        if (selected && !shown.some((i) => i.eventId === selected.eventId)) setSelected(null);
    }, [shown, selected]);

    const doDownload = async (item: FileItem): Promise<void> => {
        setBusy(item.eventId);
        setError(null);
        try {
            await props.download(item);
        } catch (e) {
            setError(t(`${P}download_failed`, { error: (e as Error)?.message ?? String(e) }));
        } finally {
            setBusy(null);
        }
    };
    const goTo = (item: FileItem): void => {
        props.open(item);
        props.onClose?.();
    };

    const header = (key: SortKey, label: string): JSX.Element => (
        <button type="button" className="fh-sort" aria-pressed={sort === key} title={t(`${P}sort_by`, { column: label })} onClick={() => setSort(key)}>
            {label}
            {sort === key && <span aria-hidden="true"> ▾</span>}
        </button>
    );

    return (
        <div className={`fh-view fh-view--${variant}`} data-testid="fileshub-view">
            {variant === "page" && <h2 className="fh-page-title">{t(`${P}title`)}</h2>}
            <div className="fh-toolbar">
                <input
                    type="search"
                    className="fh-input fh-search"
                    placeholder={t(`${P}search`)}
                    aria-label={t(`${P}search`)}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    data-testid="fileshub-search"
                />
                <div className="fh-chips" role="radiogroup" aria-label={t(`${P}filter_type`)}>
                    {CATEGORIES.map((c) => (
                        <button
                            key={c}
                            type="button"
                            role="radio"
                            aria-checked={category === c}
                            className="fh-chip"
                            onClick={() => setCategory(c)}
                            data-testid={`fileshub-type-${c}`}
                        >
                            {t(`${P}type_${c}`)}
                        </button>
                    ))}
                </div>
            </div>
            <div className="fh-toolbar">
                {spaces.length > 0 && (
                    <select
                        className="fh-input fh-select"
                        aria-label={t(`${P}filter_space`)}
                        value={spaceId}
                        onChange={(e) => {
                            setSpaceId(e.target.value);
                            setRoomId("");
                        }}
                        data-testid="fileshub-space"
                    >
                        <option value="">{t(`${P}all_spaces`)}</option>
                        {spaces.map((s) => (
                            <option key={s.roomId} value={s.roomId}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                )}
                <select className="fh-input fh-select" aria-label={t(`${P}filter_room`)} value={roomId} onChange={(e) => setRoomId(e.target.value)} data-testid="fileshub-room">
                    <option value="">{t(`${P}all_rooms`)}</option>
                    {roomOptions.map((r) => (
                        <option key={r.roomId} value={r.roomId}>
                            {r.name}
                        </option>
                    ))}
                </select>
                <select className="fh-input fh-select" aria-label={t(`${P}filter_person`)} value={sender} onChange={(e) => setSender(e.target.value)} data-testid="fileshub-person">
                    <option value="">{t(`${P}anyone`)}</option>
                    {senders.map(([id, name]) => (
                        <option key={id} value={id}>
                            {name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="fh-status" role="status" data-testid="fileshub-status">
                {progress.running ? (
                    <>
                        <span className="fh-spinner" aria-hidden="true" />
                        <span>{t(`${P}scanning`, { done: progress.roomsDone, total: progress.rooms })}</span>
                        <button type="button" className="fh-link" onClick={() => index.cancel()}>
                            {t(`${P}stop`)}
                        </button>
                    </>
                ) : progress.roomsDone < progress.rooms ? (
                    <span>{t(`${P}stopped`, { done: progress.roomsDone, total: progress.rooms })}</span>
                ) : (
                    <>
                        <span>
                            {t(`${P}count`, { count: shown.length })} · {t(`${P}since`, { date: props.formatDate(progress.sinceTs) })}
                        </span>
                        {progress.roomsWithMore > 0 && (
                            <>
                                <span>{t(`${P}more_history`, { count: progress.roomsWithMore })}</span>
                                <button type="button" className="fh-link" onClick={() => void index.searchOlder(scopeRooms)} data-testid="fileshub-older">
                                    {t(`${P}search_older`)}
                                </button>
                            </>
                        )}
                    </>
                )}
                {progress.errors > 0 && !progress.running && <span className="fh-warn">{t(`${P}errors`, { count: progress.errors })}</span>}
                {progress.undecryptable > 0 && <span className="fh-warn">{t(`${P}undecryptable`, { count: progress.undecryptable })}</span>}
                {error && <span className="fh-warn">{error}</span>}
            </div>

            <div className={`fh-body ${selected ? "fh-body--split" : ""}`}>
                <div className="fh-table-wrap">
                    {shown.length === 0 ? (
                        <p className="fh-empty">{version.length === 0 && !progress.running ? t(`${P}empty`) : progress.running ? "" : t(`${P}empty_filtered`)}</p>
                    ) : (
                        <table className="fh-table" data-testid="fileshub-table">
                            <thead>
                                <tr>
                                    <th className="fh-col-name">{header("name", t(`${P}col_name`))}</th>
                                    <th>{t(`${P}col_shared_by`)}</th>
                                    {!roomId && <th>{t(`${P}col_room`)}</th>}
                                    <th>{header("date", t(`${P}col_date`))}</th>
                                    <th className="fh-col-size">{header("size", t(`${P}col_size`))}</th>
                                    <th aria-label={t(`${P}download`)} />
                                </tr>
                            </thead>
                            <tbody>
                                {shown.slice(0, MAX_ROWS).map((i) => (
                                    <tr
                                        key={i.eventId}
                                        className={selected?.eventId === i.eventId ? "fh-row fh-row--selected" : "fh-row"}
                                        onClick={() => setSelected(i)}
                                        data-testid="fileshub-row"
                                    >
                                        <td className="fh-col-name">
                                            <button
                                                type="button"
                                                className="fh-name"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelected(i);
                                                }}
                                                title={i.name}
                                            >
                                                <FileTypeIcon office={i.office} category={i.category} />
                                                <span className="fh-name-text">{i.name}</span>
                                                {i.file && <LockIcon title={t(`${P}encrypted`)} />}
                                            </button>
                                        </td>
                                        <td className="fh-cell-muted">{props.senderName(i.roomId, i.sender)}</td>
                                        {!roomId && <td className="fh-cell-muted fh-cell-room">{props.roomName(i.roomId)}</td>}
                                        <td className="fh-cell-muted fh-nowrap">{props.formatDate(i.ts)}</td>
                                        <td className="fh-cell-muted fh-nowrap fh-col-size">{formatSize(i.size)}</td>
                                        <td>
                                            <button
                                                type="button"
                                                className="fh-icon-button"
                                                aria-label={`${t(`${P}download`)}: ${i.name}`}
                                                title={t(`${P}download`)}
                                                disabled={busy === i.eventId}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void doDownload(i);
                                                }}
                                            >
                                                <DownloadIcon />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {selected && (
                    <aside className="fh-preview" aria-label={t(`${P}preview`)}>
                        <div className="fh-preview-actions">
                            <button type="button" className="fh-button fh-button--primary" onClick={() => goTo(selected)} data-testid="fileshub-open">
                                {t(`${P}open`)}
                            </button>
                            <button type="button" className="fh-button" disabled={busy === selected.eventId} onClick={() => void doDownload(selected)} data-testid="fileshub-download">
                                {t(`${P}download`)}
                            </button>
                            <button type="button" className="fh-icon-button fh-close" aria-label={t(`${P}close_preview`)} title={t(`${P}close_preview`)} onClick={() => setSelected(null)}>
                                ×
                            </button>
                        </div>
                        <div className="fh-hint">
                            {props.senderName(selected.roomId, selected.sender)} · {props.roomName(selected.roomId)}
                            {selected.threadId ? ` · ${t(`${P}in_thread`)}` : ""} · {props.formatDate(selected.ts)}
                        </div>
                        <Preview t={t} item={selected} maxMb={props.previewMaxMb} loadBytes={props.loadBytes} />
                    </aside>
                )}
            </div>
            <p className="fh-footnote">🔒 {t(`${P}privacy`)}</p>
        </div>
    );
}
