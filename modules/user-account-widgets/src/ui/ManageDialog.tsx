import { useEffect, useState, type FormEvent, type JSX } from "react";
import type { DialogProps } from "@element-hq/element-web-module-api";

import { isHttpUrl, type SuggestedWidget } from "../config";
import { isSameOriginAsElement } from "../host";
import type { ModuleTranslate } from "../i18n";
import type { UserWidget } from "../widgets";

export interface ManageDialogProps {
    t: ModuleTranslate;
    widgets(): UserWidget[];
    subscribe(cb: () => void): () => void;
    suggested: SuggestedWidget[];
    add(name: string, url: string): Promise<string>;
    remove(id: string): Promise<void>;
    /** Opens the widget in the panel. */
    open(id: string): void;
}

export function ManageDialog({
    t,
    widgets,
    subscribe,
    suggested,
    add,
    remove,
    open,
    onSubmit,
}: ManageDialogProps & DialogProps<void>): JSX.Element {
    const [list, setList] = useState(widgets);
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => subscribe(() => setList(widgets())), [subscribe, widgets]);

    const run = async (task: () => Promise<unknown>): Promise<void> => {
        setBusy(true);
        setError(null);
        try {
            await task();
        } catch (e) {
            setError(t("failed", { error: e instanceof Error ? e.message : String(e) }));
        } finally {
            setBusy(false);
        }
    };

    const addAndOpen = (n: string, u: string): Promise<void> =>
        run(async () => {
            const id = await add(n.trim() || new URL(u).hostname, u.trim());
            open(id);
            onSubmit();
        });

    const onAdd = (ev: FormEvent): void => {
        ev.preventDefault();
        if (!isHttpUrl(url.trim())) return setError(t("url_invalid"));
        if (isSameOriginAsElement(url.trim())) return setError(t("url_same_origin"));
        void addAndOpen(name, url);
    };

    const installed = new Set(list.map((w) => w.url));
    const offers = suggested.filter((s) => !installed.has(s.url));

    return (
        <div className="uaw-dialog">
            <p className="uaw-dialog__intro">{t("manage_intro")}</p>
            {list.length === 0 ? (
                <p className="uaw-dialog__none">{t("manage_none")}</p>
            ) : (
                <ul className="uaw-list">
                    {list.map((w) => (
                        <li key={w.id} className="uaw-list__item">
                            <span className="uaw-list__text">
                                <span className="uaw-list__name">{w.name}</span>
                                <span className="uaw-list__url">{w.url}</span>
                            </span>
                            <button
                                type="button"
                                className="uaw-button"
                                disabled={busy}
                                onClick={() => {
                                    open(w.id);
                                    onSubmit();
                                }}
                            >
                                {t("open")}
                            </button>
                            <button
                                type="button"
                                className="uaw-button uaw-button--danger"
                                disabled={busy}
                                aria-label={t("remove_label", { name: w.name })}
                                onClick={() => void run(() => remove(w.id))}
                            >
                                {t("remove")}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            {offers.length > 0 && (
                <>
                    <h3 className="uaw-dialog__heading">{t("suggested")}</h3>
                    <ul className="uaw-list">
                        {offers.map((s) => (
                            <li key={s.url} className="uaw-list__item">
                                <span className="uaw-list__text">
                                    <span className="uaw-list__name">{s.name}</span>
                                    <span className="uaw-list__url">{s.url}</span>
                                </span>
                                <button
                                    type="button"
                                    className="uaw-button uaw-button--primary"
                                    disabled={busy}
                                    onClick={() => void addAndOpen(s.name, s.url)}
                                >
                                    {t("add")}
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
            <form className="uaw-form" onSubmit={onAdd}>
                <h3 className="uaw-dialog__heading">{t("add_title")}</h3>
                <label className="uaw-field">
                    <span>{t("name")}</span>
                    <input type="text" value={name} disabled={busy} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="uaw-field">
                    <span>{t("url")}</span>
                    <input
                        type="url"
                        value={url}
                        required
                        disabled={busy}
                        placeholder={t("url_placeholder")}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                </label>
                {error && (
                    <p className="uaw-error" role="alert">
                        {error}
                    </p>
                )}
                <div className="uaw-dialog__buttons">
                    <button type="button" className="uaw-button" onClick={() => onSubmit()}>
                        {t("done")}
                    </button>
                    <button type="submit" className="uaw-button uaw-button--primary" disabled={busy || !url.trim()}>
                        {t("add")}
                    </button>
                </div>
            </form>
        </div>
    );
}
