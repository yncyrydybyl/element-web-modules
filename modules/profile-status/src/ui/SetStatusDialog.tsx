import { useEffect, useRef, useState, type FormEvent, type JSX } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";

import { P, type ModuleTranslate } from "../i18n";
import {
    AVAILABILITIES,
    byteLength,
    CLEAR_AFTER,
    formatDateInput,
    MAX_TEXT_BYTES,
    SUGGESTED_TEXT_CHARS,
    type ClearAfter,
    type StatusInput,
} from "../status";

export interface SetStatusResult extends StatusInput {
    autoReply: boolean;
    autoReplyText: string;
    callStatus: boolean;
}

export interface SetStatusDialogProps {
    t: ModuleTranslate;
    initial: SetStatusResult;
    /** The admin allows out-of-office auto-replies. */
    canAutoReply: boolean;
    /** Automatic "In a call" is possible in this Element. */
    canCallStatus: boolean;
    /** False when the homeserver has no profile fields: the dialog then only explains that. */
    supported: boolean;
    defaultReply(until?: string): string;
    /** Saves; throws to keep the dialog open with the error. */
    submit(result: SetStatusResult): Promise<void>;
    clear(): Promise<void>;
}

export function SetStatusDialog(props: SetStatusDialogProps & DialogProps<SetStatusResult>): JSX.Element {
    const { t, initial, onSubmit, onCancel } = props;
    const [availability, setAvailability] = useState(initial.availability);
    const [text, setText] = useState(initial.text);
    const [clearAfter, setClearAfter] = useState<ClearAfter>(initial.clearAfter);
    const [oooUntil, setOooUntil] = useState(initial.oooUntil ?? "");
    const [autoReply, setAutoReply] = useState(initial.autoReply);
    const [autoReplyText, setAutoReplyText] = useState(initial.autoReplyText);
    const [callStatus, setCallStatus] = useState(initial.callStatus);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const textRef = useRef<HTMLInputElement>(null);
    useEffect(() => textRef.current?.focus(), []);

    const ooo = availability === "ooo";
    const tooLong = byteLength(text.trim()) > MAX_TEXT_BYTES;
    const tomorrow = formatDateInput(Date.now() + 24 * 60 * 60 * 1000);

    const run = async (action: () => Promise<void>, result?: SetStatusResult): Promise<void> => {
        setBusy(true);
        setError(null);
        try {
            await action();
            if (result) onSubmit(result);
            else onCancel();
        } catch (e) {
            setError(t(`${P}failed`, { error: e instanceof Error ? e.message : String(e) }));
            setBusy(false);
        }
    };

    const onFormSubmit = (ev: FormEvent): void => {
        ev.preventDefault();
        if (tooLong) return;
        if (ooo && oooUntil && oooUntil < tomorrow) {
            setError(t(`${P}past_date`));
            return;
        }
        const result: SetStatusResult = {
            availability,
            text: text.trim(),
            clearAfter,
            oooUntil: ooo && oooUntil ? oooUntil : undefined,
            autoReply,
            autoReplyText: autoReplyText.trim(),
            callStatus,
        };
        void run(() => props.submit(result), result);
    };

    if (!props.supported) {
        return (
            <div className="ps-dialog" data-testid="profile-status-dialog">
                <p className="ps-error">{t(`${P}no_support`)}</p>
                <div className="ps-buttons">
                    <button type="button" className="ps-button ps-button--primary" onClick={onCancel}>
                        {t(`${P}close`)}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form className="ps-dialog" onSubmit={onFormSubmit} data-testid="profile-status-dialog">
            <fieldset className="ps-fieldset">
                <legend className="ps-label">{t(`${P}availability`)}</legend>
                <div className="ps-availabilities" role="radiogroup" aria-label={t(`${P}availability`)}>
                    {AVAILABILITIES.map((a) => (
                        <button
                            key={a}
                            type="button"
                            role="radio"
                            aria-checked={availability === a}
                            className="ps-availability"
                            data-testid={`profile-status-avail-${a}`}
                            onClick={() => setAvailability(a)}
                        >
                            <span className={`ps-dot ps-dot--${a}`} aria-hidden="true" />
                            {t(`${P}avail_${a}`)}
                        </button>
                    ))}
                </div>
            </fieldset>

            <label className="ps-label" htmlFor="ps-text">
                {t(`${P}message`)}
            </label>
            <input
                id="ps-text"
                ref={textRef}
                className="ps-input"
                data-testid="profile-status-text"
                value={text}
                size={SUGGESTED_TEXT_CHARS}
                placeholder={t(`${P}message_placeholder`)}
                aria-invalid={tooLong}
                onChange={(e) => setText(e.target.value)}
            />
            {tooLong && <p className="ps-error">{t(`${P}too_long`)}</p>}

            {ooo ? (
                <>
                    <label className="ps-label" htmlFor="ps-ooo-until">
                        {t(`${P}ooo_until`)}
                    </label>
                    <input
                        id="ps-ooo-until"
                        type="date"
                        className="ps-input"
                        data-testid="profile-status-ooo-until"
                        min={tomorrow}
                        value={oooUntil}
                        onChange={(e) => setOooUntil(e.target.value)}
                    />
                    {props.canAutoReply && (
                        <>
                            <label className="ps-check">
                                <input
                                    type="checkbox"
                                    data-testid="profile-status-auto-reply"
                                    checked={autoReply}
                                    onChange={(e) => setAutoReply(e.target.checked)}
                                />
                                <span>
                                    {t(`${P}auto_reply`)}
                                    <small className="ps-hint">{t(`${P}auto_reply_hint`)}</small>
                                </span>
                            </label>
                            {autoReply && (
                                <textarea
                                    className="ps-input ps-textarea"
                                    aria-label={t(`${P}auto_reply_text`)}
                                    data-testid="profile-status-auto-reply-text"
                                    value={autoReplyText}
                                    placeholder={props.defaultReply(oooUntil || undefined)}
                                    onChange={(e) => setAutoReplyText(e.target.value)}
                                />
                            )}
                        </>
                    )}
                </>
            ) : (
                <fieldset className="ps-fieldset">
                    <legend className="ps-label">{t(`${P}clear_after`)}</legend>
                    <div className="ps-segmented" role="radiogroup" aria-label={t(`${P}clear_after`)}>
                        {CLEAR_AFTER.map((c) => (
                            <button
                                key={c}
                                type="button"
                                role="radio"
                                aria-checked={clearAfter === c}
                                className="ps-segment"
                                data-testid={`profile-status-clear-${c}`}
                                onClick={() => setClearAfter(c)}
                            >
                                {t(`${P}clear_${c}`)}
                            </button>
                        ))}
                    </div>
                </fieldset>
            )}

            {props.canCallStatus && (
                <label className="ps-check">
                    <input type="checkbox" checked={callStatus} onChange={(e) => setCallStatus(e.target.checked)} />
                    <span>{t(`${P}call_status`)}</span>
                </label>
            )}

            <p className="ps-hint">{t(`${P}public_hint`)}</p>
            {error && <p className="ps-error">{error}</p>}

            <div className="ps-buttons">
                <button
                    type="button"
                    className="ps-button ps-button--link"
                    data-testid="profile-status-clear"
                    disabled={busy}
                    onClick={() => void run(props.clear)}
                >
                    {t(`${P}clear`)}
                </button>
                <span className="ps-spacer" />
                <button type="button" className="ps-button" disabled={busy} onClick={onCancel}>
                    {t(`${P}cancel`)}
                </button>
                <button type="submit" className="ps-button ps-button--primary" data-testid="profile-status-save" disabled={busy || tooLong}>
                    {t(`${P}save`)}
                </button>
            </div>
        </form>
    );
}
