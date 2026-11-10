import { useEffect, useRef, useState, type FormEvent, type JSX } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";

import { P, type ModuleTranslate } from "../i18n";
import { defaultUrgentRecipients, type Priority } from "../priority";
import { presets } from "../schedule";

export interface ComposeResult {
    text: string;
    priority?: Priority;
    /** Epoch ms, or undefined to send now. */
    sendAt?: number;
    /** User IDs an urgent message mentions. */
    notify?: string[];
}

export interface ComposeDialogProps {
    t: ModuleTranslate;
    initialText: string;
    initialPriority?: Priority;
    /** Open with a send time already picked (the "Send later" entry). */
    startScheduled: boolean;
    canSchedule: boolean;
    /** The room's other members, whom an urgent message can mention. */
    members: { userId: string; name: string }[];
    formatTime(ts: number): string;
    /** Sends or schedules; throws to keep the dialog open with the error. */
    submit(result: ComposeResult): Promise<void>;
}

type When = "now" | "custom" | string;

export function ComposeDialog(props: ComposeDialogProps & DialogProps<ComposeResult>): JSX.Element {
    const { t, canSchedule, members, formatTime, onSubmit, onCancel } = props;
    const [text, setText] = useState(props.initialText);
    const [priority, setPriority] = useState<Priority | undefined>(props.initialPriority);
    const [notify, setNotify] = useState<string[]>(() => defaultUrgentRecipients(members));
    const toggleNotify = (userId: string): void =>
        setNotify((cur) => (cur.includes(userId) ? cur.filter((r) => r !== userId) : [...cur, userId]));
    const choices = presets();
    const [when, setWhen] = useState<When>(props.startScheduled && canSchedule ? choices[1].key : "now");
    const [custom, setCustom] = useState(() => toLocalInput(choices[1].at));
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const textRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        const el = textRef.current;
        el?.focus();
        el?.setSelectionRange(el.value.length, el.value.length);
    }, []);

    const sendAt = (): number | undefined => {
        if (when === "now") return undefined;
        if (when === "custom") return new Date(custom).getTime();
        return choices.find((c) => c.key === when)?.at.getTime();
    };

    const onFormSubmit = async (ev: FormEvent): Promise<void> => {
        ev.preventDefault();
        if (!text.trim()) return;
        const at = sendAt();
        if (at !== undefined && (!Number.isFinite(at) || at <= Date.now())) {
            setError(t(`${P}in_past`));
            return;
        }
        const result = { text: text.trim(), priority, sendAt: at, notify: priority === "urgent" ? notify : undefined };
        setBusy(true);
        setError(null);
        try {
            await props.submit(result);
            onSubmit(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setBusy(false);
        }
    };

    const priorities: (Priority | undefined)[] = [undefined, "important", "urgent"];
    return (
        <form className="tw-dialog" onSubmit={(ev) => void onFormSubmit(ev)} data-testid="teamwork-compose">
            <label className="tw-label" htmlFor="tw-text">
                {t(`${P}message`)}
            </label>
            <textarea
                id="tw-text"
                ref={textRef}
                className="tw-input tw-textarea"
                value={text}
                rows={3}
                disabled={busy}
                onChange={(ev) => setText(ev.target.value)}
                onKeyDown={(ev) => {
                    if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) void onFormSubmit(ev);
                }}
            />

            <fieldset className="tw-fieldset">
                <legend className="tw-label">{t(`${P}delivery`)}</legend>
                <div className="tw-segmented" role="radiogroup">
                    {priorities.map((p) => (
                        <button
                            key={p ?? "standard"}
                            type="button"
                            role="radio"
                            aria-checked={priority === p}
                            className={`tw-segment ${p ? `tw-segment--${p}` : ""}`}
                            onClick={() => setPriority(p)}
                        >
                            {p === "urgent" ? "🚨 " : p === "important" ? "❗ " : ""}
                            {t(`${P}${p ?? "standard"}`)}
                        </button>
                    ))}
                </div>
                {priority === "urgent" && <p className="tw-hint">{t(`${P}urgent_hint`)}</p>}
            </fieldset>

            {priority === "urgent" && members.length > 0 && (
                <fieldset className="tw-fieldset">
                    <legend className="tw-label">{t(`${P}urgent_notify`)}</legend>
                    <div className="tw-chips">
                        {members.map((m) => (
                            <button
                                key={m.userId}
                                type="button"
                                role="checkbox"
                                aria-checked={notify.includes(m.userId)}
                                className="tw-chip"
                                onClick={() => toggleNotify(m.userId)}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                    <p className="tw-hint">{t(`${P}urgent_notify_hint`)}</p>
                </fieldset>
            )}

            <fieldset className="tw-fieldset">
                <legend className="tw-label">{t(`${P}when`)}</legend>
                {canSchedule ? (
                    <>
                        <div className="tw-chips" role="radiogroup">
                            {[{ key: "now" }, ...choices, { key: "custom" }].map((c) => (
                                <button
                                    key={c.key}
                                    type="button"
                                    role="radio"
                                    aria-checked={when === c.key}
                                    className="tw-chip"
                                    title={"at" in c ? formatTime(c.at.getTime()) : undefined}
                                    onClick={() => setWhen(c.key)}
                                >
                                    {t(`${P}${c.key === "custom" ? "custom_time" : c.key}`)}
                                </button>
                            ))}
                        </div>
                        {when === "custom" && (
                            <input
                                className="tw-input"
                                type="datetime-local"
                                aria-label={t(`${P}custom_time`)}
                                value={custom}
                                onChange={(ev) => setCustom(ev.target.value)}
                            />
                        )}
                        {when !== "now" && (
                            <p className="tw-hint">
                                <strong>{formatTime(sendAt() ?? 0)}</strong> · {t(`${P}server_holds`)}
                            </p>
                        )}
                    </>
                ) : (
                    <p className="tw-hint">{t(`${P}no_scheduling`)}</p>
                )}
            </fieldset>

            {error && (
                <div className="tw-error" role="alert">
                    {t(`${P}failed`, { error })}
                </div>
            )}
            <div className="tw-actions">
                <button type="button" className="tw-action" onClick={onCancel}>
                    {t(`${P}cancel`)}
                </button>
                <button type="submit" className="tw-action tw-action--primary" disabled={busy || !text.trim()}>
                    {t(`${P}${when === "now" ? "send" : "schedule"}`)}
                </button>
            </div>
        </form>
    );
}

/** `datetime-local` wants local time without zone: 2026-11-11T09:00. */
export function toLocalInput(d: Date): string {
    const pad = (n: number): string => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
