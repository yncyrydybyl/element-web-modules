import { useState, type FormEvent, type JSX } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";

import { P, type ModuleTranslate } from "../i18n";
import { CARD_FIELDS, MAX_CARD_FIELD_CHARS, type CardField, type ProfileCard } from "../status";

export interface CardDialogProps {
    t: ModuleTranslate;
    initial: ProfileCard;
    /** Fields the user may change; the others are shown read-only ("managed by your organisation"). */
    editable: CardField[];
    submit(card: ProfileCard): Promise<void>;
}

export function CardDialog(props: CardDialogProps & DialogProps<ProfileCard>): JSX.Element {
    const { t, initial, editable, onSubmit, onCancel } = props;
    const [values, setValues] = useState<ProfileCard>(initial);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const onFormSubmit = async (ev: FormEvent): Promise<void> => {
        ev.preventDefault();
        const card: ProfileCard = {};
        for (const f of editable) card[f] = (values[f] ?? "").trim();
        setBusy(true);
        setError(null);
        try {
            await props.submit(card);
            onSubmit(card);
        } catch (e) {
            setError(t(`${P}failed`, { error: e instanceof Error ? e.message : String(e) }));
            setBusy(false);
        }
    };

    return (
        <form className="ps-dialog" onSubmit={(ev) => void onFormSubmit(ev)} data-testid="profile-status-card-dialog">
            {CARD_FIELDS.map((f) => {
                const locked = !editable.includes(f);
                return (
                    <div key={f} className="ps-field">
                        <label className="ps-label" htmlFor={`ps-card-${f}`}>
                            {t(`${P}${f}`)}
                            {locked && <span className="ps-locked"> · {t(`${P}card_locked`)}</span>}
                        </label>
                        <input
                            id={`ps-card-${f}`}
                            className="ps-input"
                            data-testid={`profile-status-card-${f}`}
                            type={f === "phone" ? "tel" : "text"}
                            maxLength={MAX_CARD_FIELD_CHARS}
                            value={values[f] ?? ""}
                            readOnly={locked}
                            disabled={locked}
                            onChange={(e) => setValues({ ...values, [f]: e.target.value })}
                        />
                    </div>
                );
            })}
            <p className="ps-hint">{t(`${P}card_hint`)}</p>
            {error && <p className="ps-error">{error}</p>}
            <div className="ps-buttons">
                <span className="ps-spacer" />
                <button type="button" className="ps-button" disabled={busy} onClick={onCancel}>
                    {t(`${P}cancel`)}
                </button>
                <button
                    type="submit"
                    className="ps-button ps-button--primary"
                    data-testid="profile-status-card-save"
                    disabled={busy || !editable.length}
                >
                    {t(`${P}save`)}
                </button>
            </div>
        </form>
    );
}
