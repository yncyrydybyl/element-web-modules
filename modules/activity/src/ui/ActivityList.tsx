import { useEffect, useState, type JSX } from "react";

import type { ActivityItem, ActivityKind } from "../activity";
import { P, type ModuleTranslate } from "../i18n";

export interface ActivityListProps {
    t: ModuleTranslate;
    list(): ActivityItem[];
    subscribe(cb: () => void): () => void;
    refresh(): Promise<void>;
    markAllRead(): Promise<void>;
    roomName(roomId: string): string;
    formatTime(ts: number): string;
    open(item: ActivityItem): void;
    /** "page" fills Element's main area; "dialog" sits in a dialog with an OK button. */
    variant: "page" | "dialog";
    onClose?(): void;
}

type Filter = "all" | "unread" | ActivityKind;
const FILTERS: Filter[] = ["all", "unread", "mention", "reply", "reaction", "thread"];
const KIND_ICON: Record<ActivityKind, string> = { mention: "@", reply: "↩", reaction: "☺", thread: "🧵" };

/** Teams-style activity feed: who did what that concerns me, newest first. */
export function ActivityList({ t, list, subscribe, refresh, markAllRead, roomName, formatTime, open, variant, onClose }: ActivityListProps): JSX.Element {
    const [items, setItems] = useState(list);
    const [filter, setFilter] = useState<Filter>("all");
    const [loading, setLoading] = useState(true);
    useEffect(() => subscribe(() => setItems(list())), [subscribe, list]);
    useEffect(() => {
        let live = true;
        void refresh().finally(() => live && setLoading(false));
        return () => {
            live = false;
        };
    }, [refresh]);

    const shown = items.filter((i) => filter === "all" || (filter === "unread" ? !i.read : i.kind === filter));
    const unread = items.filter((i) => !i.read).length;

    return (
        <div className={`act-feed act-feed--${variant}`} data-testid="activity-feed">
            {variant === "page" && (
                <header className="act-head">
                    <h2>{t(`${P}title`)}</h2>
                    {!!unread && <span className="act-unread">{t(`${P}unread`, { n: unread })}</span>}
                </header>
            )}
            <div className="act-bar">
                <div className="act-chips" role="radiogroup" aria-label={t(`${P}filter`)}>
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            type="button"
                            role="radio"
                            aria-checked={filter === f}
                            className="act-chip"
                            onClick={() => setFilter(f)}
                        >
                            {t(`${P}filter_${f}`)}
                        </button>
                    ))}
                </div>
                <button type="button" className="act-link" disabled={!unread} onClick={() => void markAllRead()}>
                    {t(`${P}mark_all`)}
                </button>
            </div>
            {shown.length === 0 && <p className="act-empty">{loading ? t(`${P}loading`) : t(`${P}empty`)}</p>}
            <ul className="act-list">
                {shown.map((i) => (
                    <li key={i.eventId}>
                        <button
                            type="button"
                            className={`act-item ${i.read ? "" : "act-item--unread"}`}
                            data-kind={i.kind}
                            onClick={() => {
                                open(i);
                                onClose?.();
                            }}
                        >
                            <span className={`act-icon act-icon--${i.kind}`} aria-hidden="true">
                                {i.kind === "reaction" ? i.text : KIND_ICON[i.kind]}
                            </span>
                            <span className="act-body">
                                <span className="act-line">
                                    <strong>{i.sender}</strong> {t(`${P}${i.kind}`)}
                                    <span className="act-room">{roomName(i.roomId)}</span>
                                </span>
                                {i.kind === "reaction" ? (
                                    i.about && <span className="act-text act-text--quote">{i.about}</span>
                                ) : (
                                    <>
                                        {i.about && <span className="act-text act-text--quote">{i.about}</span>}
                                        <span className="act-text">{i.text}</span>
                                    </>
                                )}
                            </span>
                            <span className="act-when">{formatTime(i.ts)}</span>
                            {!i.read && <span className="act-dot" aria-label={t(`${P}unread_item`)} />}
                        </button>
                    </li>
                ))}
            </ul>
            <p className="act-footnote">🔒 {t(`${P}privacy`)}</p>
            {variant === "dialog" && (
                <div className="act-actions">
                    <button type="button" className="act-action act-action--primary" onClick={onClose}>
                        OK
                    </button>
                </div>
            )}
        </div>
    );
}

/** The bell for the space panel and the room header, with the unread count. */
export function ActivityBell({ count, size = 20 }: { count: number; size?: number }): JSX.Element {
    return (
        <span className="act-bell" data-testid="activity-feed-bell">
            <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="currentColor">
                <path d="M12 2a6 6 0 0 1 6 6v3.6l1.8 3.6A1 1 0 0 1 18.9 17H5.1a1 1 0 0 1-.9-1.8L6 11.6V8a6 6 0 0 1 6-6Zm0 2a4 4 0 0 0-4 4v4.1L6.7 15h10.6L16 12.1V8a4 4 0 0 0-4-4Zm-2.5 14h5a2.5 2.5 0 0 1-5 0Z" />
            </svg>
            {count > 0 && <span className="act-count">{count > 99 ? "99+" : count}</span>}
        </span>
    );
}

/** A bell that follows the feed's unread count. */
export function LiveActivityBell({ count, subscribe, size }: { count(): number; subscribe(cb: () => void): () => void; size?: number }): JSX.Element {
    const [n, setN] = useState(count);
    useEffect(() => subscribe(() => setN(count())), [subscribe, count]);
    return <ActivityBell count={n} size={size} />;
}
