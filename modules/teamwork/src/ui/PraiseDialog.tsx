import { useState, type FormEvent, type JSX } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";

import { P, type ModuleTranslate } from "../i18n";
import { BADGES, type BadgeId, type Praise } from "../praise";
import { PraiseCard } from "./PraiseCard";

export interface PraiseDialogProps {
    t: ModuleTranslate;
    /** The room's other members. */
    members: { userId: string; name: string }[];
    submit(praise: Praise): Promise<void>;
}

export function PraiseDialog({ t, members, submit, onSubmit, onCancel }: PraiseDialogProps & DialogProps<Praise>): JSX.Element {
    const [recipients, setRecipients] = useState<string[]>(members.length === 1 ? [members[0].userId] : []);
    const [badge, setBadge] = useState<BadgeId>("thank_you");
    const [note, setNote] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const names = Object.fromEntries(members.map((m) => [m.userId, m.name]));

    const toggle = (userId: string): void =>
        setRecipients((cur) => (cur.includes(userId) ? cur.filter((r) => r !== userId) : [...cur, userId]));

    const onFormSubmit = async (ev: FormEvent): Promise<void> => {
        ev.preventDefault();
        if (!recipients.length) {
            setError(t(`${P}praise_pick`));
            return;
        }
        const praise = { badge, recipients, note: note.trim() };
        setBusy(true);
        try {
            await submit(praise);
            onSubmit(praise);
        } catch (e) {
            setError(t(`${P}failed`, { error: e instanceof Error ? e.message : String(e) }));
            setBusy(false);
        }
    };

    return (
        <form className="tw-dialog" onSubmit={(ev) => void onFormSubmit(ev)} data-testid="teamwork-praise">
            <fieldset className="tw-fieldset">
                <legend className="tw-label">{t(`${P}praise_who`)}</legend>
                <div className="tw-chips">
                    {members.map((m) => (
                        <button
                            key={m.userId}
                            type="button"
                            role="checkbox"
                            aria-checked={recipients.includes(m.userId)}
                            className="tw-chip"
                            onClick={() => toggle(m.userId)}
                        >
                            {m.name}
                        </button>
                    ))}
                </div>
            </fieldset>
            <fieldset className="tw-fieldset">
                <legend className="tw-label">{t(`${P}praise_badge`)}</legend>
                <div className="tw-badges" role="radiogroup">
                    {BADGES.map((b) => (
                        <button
                            key={b.id}
                            type="button"
                            role="radio"
                            aria-checked={badge === b.id}
                            className={`tw-badge-pick tw-praise--${b.id}`}
                            onClick={() => setBadge(b.id)}
                        >
                            <span className="tw-badge-emoji">{b.emoji}</span>
                            <span>{t(`${P}badge_${b.id}`)}</span>
                        </button>
                    ))}
                </div>
            </fieldset>
            <textarea
                className="tw-input tw-textarea"
                rows={2}
                placeholder={t(`${P}praise_note`)}
                aria-label={t(`${P}praise_note`)}
                value={note}
                onChange={(ev) => setNote(ev.target.value)}
            />
            <PraiseCard t={t} praise={{ badge, recipients, note }} names={names} />
            {error && (
                <div className="tw-error" role="alert">
                    {error}
                </div>
            )}
            <div className="tw-actions">
                <button type="button" className="tw-action" onClick={onCancel}>
                    {t(`${P}cancel`)}
                </button>
                <button type="submit" className="tw-action tw-action--primary" disabled={busy}>
                    {t(`${P}praise_send`)}
                </button>
            </div>
        </form>
    );
}
