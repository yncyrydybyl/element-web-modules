import { useCallback, useEffect, useState, type JSX } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";

import { P, type ModuleTranslate } from "../i18n";
import { stripFallback } from "../priority";
import type { ScheduledMessage } from "../schedule";

export interface ScheduledDialogProps {
    t: ModuleTranslate;
    /** The room the dialog was opened from; its messages come first. */
    roomId?: string;
    roomName(roomId: string): string;
    formatTime(ts: number): string;
    list(): Promise<ScheduledMessage[]>;
    sendNow(delayId: string): Promise<void>;
    cancel(delayId: string): Promise<void>;
}

export function ScheduledDialog({ t, roomId, roomName, formatTime, list, sendNow, cancel, onCancel }: ScheduledDialogProps & DialogProps<void>): JSX.Element {
    const [items, setItems] = useState<ScheduledMessage[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const refresh = useCallback(() => {
        list()
            .then((all) => setItems([...all.filter((i) => i.roomId === roomId), ...all.filter((i) => i.roomId !== roomId)]))
            .catch((e) => setError(String(e?.message ?? e)));
    }, [list, roomId]);
    useEffect(refresh, [refresh]);

    const act = (fn: (id: string) => Promise<void>, id: string) => (): void => {
        setItems((cur) => cur?.filter((i) => i.delayId !== id) ?? null);
        fn(id).catch((e) => setError(String(e?.message ?? e))).finally(refresh);
    };

    return (
        <div className="tw-dialog tw-list-dialog" data-testid="teamwork-scheduled">
            {items === null && !error && <p className="tw-hint">{t(`${P}loading`)}</p>}
            {items?.length === 0 && <p className="tw-empty">{t(`${P}scheduled_empty`)}</p>}
            <ul className="tw-list">
                {items?.map((i) => (
                    <li key={i.delayId} className="tw-item">
                        <div className="tw-item-meta">
                            <span className="tw-item-room">{roomName(i.roomId)}</span>
                            <span className="tw-item-when">⏰ {t(`${P}scheduled_at`, { when: formatTime(i.sendAt) })}</span>
                            {i.priority && <span className={`tw-badge tw-badge--${i.priority}`}>{t(`${P}${i.priority}`)}</span>}
                        </div>
                        <div className={`tw-item-text ${i.preview === undefined ? "tw-item-text--muted" : ""}`}>
                            {i.preview === undefined ? t(`${P}encrypted_preview`) : stripFallback(i.preview)}
                        </div>
                        <div className="tw-item-actions">
                            <button type="button" className="tw-action tw-action--small" onClick={act(sendNow, i.delayId)}>
                                {t(`${P}send_now`)}
                            </button>
                            <button type="button" className="tw-action tw-action--small tw-action--danger" onClick={act(cancel, i.delayId)}>
                                {t(`${P}unschedule`)}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            {error && (
                <div className="tw-error" role="alert">
                    {error}
                </div>
            )}
            <p className="tw-footnote">🖥️📱 {t(`${P}all_devices`)}</p>
            <div className="tw-actions">
                <button type="button" className="tw-action tw-action--primary" onClick={onCancel}>
                    OK
                </button>
            </div>
        </div>
    );
}
