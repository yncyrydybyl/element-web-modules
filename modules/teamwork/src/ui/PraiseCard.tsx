import type { JSX } from "react";

import { P, type ModuleTranslate } from "../i18n";
import { badge, type Praise } from "../praise";

export interface PraiseCardProps {
    t: ModuleTranslate;
    praise: Praise;
    names: Record<string, string>;
}

/** The card drawn for a praise message, and its preview in the dialog. */
export function PraiseCard({ t, praise, names }: PraiseCardProps): JSX.Element {
    const b = badge(praise.badge)!;
    const who = praise.recipients.map((r) => names[r] ?? r).join(", ");
    return (
        <div className={`tw-praise tw-praise--${b.id}`} data-testid="teamwork-praise-card">
            <div className="tw-praise-medal" aria-hidden="true">
                {b.emoji}
            </div>
            <div className="tw-praise-body">
                <div className="tw-praise-title">{t(`${P}badge_${b.id}`)}</div>
                <div className="tw-praise-who">
                    {t(`${P}praise_for`)} <strong>{who || "…"}</strong>
                </div>
                {praise.note && <div className="tw-praise-note">“{praise.note}”</div>}
            </div>
        </div>
    );
}
