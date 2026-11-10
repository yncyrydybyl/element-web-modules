import { useEffect, useState, type JSX } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";

import { P, type ModuleTranslate } from "../i18n";
import type { LoadedMessage, SavedRef } from "../saved";

export interface SavedDialogProps {
    t: ModuleTranslate;
    refs: SavedRef[];
    formatTime(ts: number): string;
    load(ref: SavedRef): Promise<LoadedMessage>;
    open(ref: SavedRef): void;
    remove(ref: SavedRef): Promise<void>;
}

export function SavedDialog({ t, refs, formatTime, load, open, remove, onSubmit, onCancel }: SavedDialogProps & DialogProps<void>): JSX.Element {
    const [items, setItems] = useState<(LoadedMessage | { ref: SavedRef; loading: true })[]>(() => refs.map((ref) => ({ ref, loading: true })));
    useEffect(() => {
        let live = true;
        refs.forEach((ref, i) =>
            load(ref).then((m) => live && setItems((cur) => cur.map((c, j) => (j === i ? m : c)))),
        );
        return () => {
            live = false;
        };
    }, [refs, load]);

    return (
        <div className="tw-dialog tw-list-dialog" data-testid="teamwork-saved">
            {items.length === 0 && <p className="tw-empty">🔖 {t(`${P}saved_empty`)}</p>}
            <ul className="tw-list">
                {items.map((m) => (
                    <li key={m.ref.event_id} className="tw-item">
                        {"loading" in m ? (
                            <div className="tw-hint">{t(`${P}loading`)}</div>
                        ) : (
                            <>
                                <div className="tw-item-meta">
                                    <span className="tw-item-sender">{m.sender}</span>
                                    <span className="tw-item-room">{m.roomName}</span>
                                    {m.ts && <span className="tw-item-when">{formatTime(m.ts)}</span>}
                                </div>
                                <div className={`tw-item-text ${m.missing ? "tw-item-text--muted" : ""}`}>
                                    {m.missing ? t(`${P}${m.missing}`) : m.text}
                                </div>
                            </>
                        )}
                        <div className="tw-item-actions">
                            <button
                                type="button"
                                className="tw-action tw-action--small"
                                onClick={() => {
                                    open(m.ref);
                                    onSubmit();
                                }}
                            >
                                {t(`${P}open`)}
                            </button>
                            <button
                                type="button"
                                className="tw-action tw-action--small"
                                onClick={() => {
                                    setItems((cur) => cur.filter((c) => c.ref.event_id !== m.ref.event_id));
                                    void remove(m.ref);
                                }}
                            >
                                {t(`${P}unsave`)}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            <p className="tw-footnote">🔒 {t(`${P}saved_privacy`)}</p>
            <div className="tw-actions">
                <button type="button" className="tw-action tw-action--primary" onClick={onCancel}>
                    OK
                </button>
            </div>
        </div>
    );
}
