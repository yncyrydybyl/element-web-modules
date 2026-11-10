import { useEffect, useState, type JSX } from "react";

import { P, type ModuleTranslate } from "../i18n";

export interface HeaderButtonsProps {
    t: ModuleTranslate;
    roomId: string;
    /** Scheduled messages in this room, or undefined if the server can't schedule. */
    scheduledCount(roomId: string): number | undefined;
    subscribe(cb: () => void): () => void;
    openSaved(): void;
    openScheduled(roomId: string): void;
}

/** Room header icons, styled like Compound's IconButton in the header. */
export function HeaderButtons({ t, roomId, scheduledCount, subscribe, openSaved, openScheduled }: HeaderButtonsProps): JSX.Element {
    const [, setTick] = useState(0);
    useEffect(() => subscribe(() => setTick((n) => n + 1)), [subscribe]);
    const count = scheduledCount(roomId);
    return (
        <>
            {!!count && (
                <button
                    type="button"
                    className="tw-header-button"
                    data-testid="teamwork-scheduled-button"
                    aria-label={t(`${P}scheduled_button`)}
                    title={t(`${P}scheduled_button`)}
                    onClick={() => openScheduled(roomId)}
                >
                    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
                        <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 3v4.6l3.2 3.2-1.4 1.4L11 12.4V7h2Z" />
                    </svg>
                    <span className="tw-count">{count}</span>
                </button>
            )}
            <button
                type="button"
                className="tw-header-button"
                data-testid="teamwork-saved-button"
                aria-label={t(`${P}saved_button`)}
                title={t(`${P}saved_button`)}
                onClick={openSaved}
            >
                {BOOKMARK_OUTLINE}
            </button>
        </>
    );
}

export const BOOKMARK_OUTLINE = (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
        <path d="M6 3h12a1 1 0 0 1 1 1v17.2a.5.5 0 0 1-.8.4L12 17l-6.2 4.6a.5.5 0 0 1-.8-.4V4a1 1 0 0 1 1-1Zm1 2v13.2l5-3.7 5 3.7V5H7Z" />
    </svg>
);
