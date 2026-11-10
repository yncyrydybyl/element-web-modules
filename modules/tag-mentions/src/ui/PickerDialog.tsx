import { useState, type FormEvent, type JSX } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";

import { P, type ModuleTranslate } from "../i18n";
import type { ResolvedTag } from "../tags";
import { TagRow, usable } from "./TagRow";

export interface PickerDialogProps {
    t: ModuleTranslate;
    tags: ResolvedTag[];
    name(userId: string): string;
    max: number;
    /**
     * "insert": picking a tag puts "@name " into the composer, and sending expands it.
     * "send": the composer can't be hooked, so the dialog takes the message and sends it itself.
     */
    mode: "insert" | "send";
    initialText?: string;
    insert(tag: ResolvedTag): void;
    send(tag: ResolvedTag, text: string): Promise<void>;
    openManage(): void;
}

export function PickerDialog({ t, tags, name, max, mode, initialText, insert, send, openManage, onSubmit, onCancel }: PickerDialogProps & DialogProps<string>): JSX.Element {
    const [selected, setSelected] = useState<string | null>(null);
    const [text, setText] = useState(initialText ?? "");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const custom = tags.filter((tg) => tg.kind === "tag");

    const choose = (tag: ResolvedTag): void => {
        if (mode === "insert") {
            insert(tag);
            onSubmit(tag.name);
        } else setSelected(tag.name);
    };

    const onFormSubmit = async (ev: FormEvent): Promise<void> => {
        ev.preventDefault();
        const tag = tags.find((tg) => tg.name === selected);
        if (!tag) return;
        setBusy(true);
        try {
            await send(tag, text);
            onSubmit(tag.name);
        } catch (e) {
            setError(t(`${P}failed`, { error: e instanceof Error ? e.message : String(e) }));
            setBusy(false);
        }
    };

    return (
        <form className="tm-dialog" data-testid="tag-mentions-picker" onSubmit={(ev) => void onFormSubmit(ev)}>
            <p className="tm-hint">{t(mode === "insert" ? `${P}picker_hint` : `${P}picker_direct_hint`)}</p>
            <ul className="tm-list" role="listbox" aria-label={t(`${P}picker_title`)}>
                {tags.map((tag) => (
                    <li key={tag.name}>
                        <button
                            type="button"
                            role="option"
                            aria-selected={selected === tag.name}
                            className="tm-option"
                            disabled={!usable(tag, max)}
                            onClick={() => choose(tag)}
                        >
                            <TagRow t={t} tag={tag} name={name} max={max} />
                        </button>
                    </li>
                ))}
            </ul>
            {!custom.length && <p className="tm-empty">{t(`${P}no_tags`)}</p>}
            {mode === "send" && (
                <textarea
                    className="tm-input tm-textarea"
                    rows={3}
                    aria-label={t(`${P}message`)}
                    placeholder={t(`${P}message`)}
                    value={text}
                    onChange={(ev) => setText(ev.target.value)}
                />
            )}
            {error && (
                <div className="tm-error" role="alert">
                    {error}
                </div>
            )}
            <div className="tm-actions">
                <button type="button" className="tm-link" onClick={openManage}>
                    {t(`${P}manage`)}
                </button>
                <span className="tm-spacer" />
                <button type="button" className="tm-action" onClick={onCancel}>
                    {t(`${P}cancel`)}
                </button>
                {mode === "send" && (
                    <button type="submit" className="tm-action tm-action--primary" disabled={busy || !selected}>
                        {t(`${P}send`)}
                    </button>
                )}
            </div>
        </form>
    );
}
