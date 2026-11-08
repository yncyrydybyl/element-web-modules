import { useEffect, useRef, useState, type FormEvent, type JSX } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";

import { P } from "../i18n";
import { DuplicateReactionError, MAX_LENGTH, normaliseReaction } from "../reactions";

/** Translates one of this module's own strings. */
export type ModuleTranslate = (key: string, variables?: Record<string, string>) => string;

export interface TextReactionDialogProps {
    recent: string[];
    t: ModuleTranslate;
    /** Sends the reaction; throws to keep the dialog open with the error. */
    send(key: string): Promise<void>;
}

export function TextReactionDialog({ recent, t, send, onSubmit, onCancel }: TextReactionDialogProps & DialogProps<string>): JSX.Element {
    const [text, setText] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => inputRef.current?.focus(), []);

    const react = async (raw: string): Promise<void> => {
        const key = normaliseReaction(raw);
        if (!key) return;
        if ([...key].length > MAX_LENGTH) {
            setError(t(`${P}too_long`, { max: String(MAX_LENGTH) }));
            return;
        }
        setBusy(true);
        setError(null);
        try {
            await send(key);
            onSubmit(key);
        } catch (e) {
            setError(
                e instanceof DuplicateReactionError
                    ? t(`${P}duplicate`, { key })
                    : t(`${P}failed`, { error: e instanceof Error ? e.message : String(e) }),
            );
            setBusy(false);
        }
    };

    const onFormSubmit = (ev: FormEvent): void => {
        ev.preventDefault();
        void react(text);
    };

    return (
        <form className="dtr-dialog" onSubmit={onFormSubmit}>
            <input
                ref={inputRef}
                className="dtr-input"
                type="text"
                value={text}
                maxLength={MAX_LENGTH * 2}
                disabled={busy}
                aria-label={t(`${P}input_label`)}
                placeholder={t(`${P}placeholder`)}
                onChange={(ev) => {
                    setText(ev.target.value);
                    setError(null);
                }}
            />
            {recent.length > 0 && (
                <div className="dtr-recent" role="group" aria-label={t(`${P}recent`)}>
                    {recent.map((r) => (
                        <button key={r} type="button" className="dtr-chip" disabled={busy} onClick={() => void react(r)}>
                            {r}
                        </button>
                    ))}
                </div>
            )}
            {error && (
                <div className="dtr-error" role="alert">
                    {error}
                </div>
            )}
            <div className="dtr-actions">
                <button type="button" className="dtr-action" onClick={onCancel}>
                    {t(`${P}cancel`)}
                </button>
                <button type="submit" className="dtr-action dtr-action--primary" disabled={busy || !normaliseReaction(text)}>
                    {t(`${P}send`)}
                </button>
            </div>
        </form>
    );
}
