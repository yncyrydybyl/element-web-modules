import { useEffect, useState, type JSX } from "react";

import type { ModuleTranslate } from "../i18n";

export interface MyAppsButtonProps {
    t: ModuleTranslate;
    isOpen(): boolean;
    subscribe(cb: () => void): () => void;
    onClick(): void;
}

/** Header icon button, styled like Compound's IconButton in the room header. */
export function MyAppsButton({ t, isOpen, subscribe, onClick }: MyAppsButtonProps): JSX.Element {
    const [, setTick] = useState(0);
    useEffect(() => subscribe(() => setTick((n) => n + 1)), [subscribe]);
    const open = isOpen();
    const tooltip = open ? t("button_close") : t("button_open");
    return (
        <button
            type="button"
            className="uaw-header-button"
            data-testid="user-account-widgets-button"
            aria-label={t("button")}
            aria-description={tooltip}
            title={tooltip}
            aria-pressed={open}
            onClick={onClick}
        >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
                <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm2 0v14h7V5H6Zm9 0v14h3V5h-3Z" />
                <path d="M7.5 8h4v1.5h-4zM7.5 11h4v1.5h-4zM7.5 14h2.5v1.5H7.5z" />
            </svg>
        </button>
    );
}
