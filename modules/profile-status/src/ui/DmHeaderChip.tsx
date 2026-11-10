import type { JSX } from "react";

import { P, type ModuleTranslate } from "../i18n";
import { FOCUS_MAX_AGE, type ProfileStore } from "../profileStore";
import { describe, presentNow, StatusLine, useProfile } from "./common";

export interface DmHeaderChipProps {
    t: ModuleTranslate;
    store: ProfileStore;
    /** The other person in this DM, or undefined for rooms that aren't DMs. */
    userId: string | undefined;
    open(userId: string): void;
}

/** The DM partner's status in the room header, where Teams shows it above a chat. */
export function DmHeaderChip({ t, store, userId, open }: DmHeaderChipProps): JSX.Element | null {
    const info = useProfile(store, userId, FOCUS_MAX_AGE);
    const p = presentNow(info);
    if (!userId || !p) return null;
    return (
        <button
            type="button"
            className={`ps-header-chip${p.availability === "ooo" ? " ps-header-chip--ooo" : ""}`}
            data-testid="profile-status-header-chip"
            aria-label={`${t(`${P}status_and_card`)}: ${describe(p, t)}`}
            onClick={() => open(userId)}
        >
            <StatusLine p={p} t={t} compact={p.availability !== "ooo"} />
        </button>
    );
}
