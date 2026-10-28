import { useEffect, useId, useMemo, useRef, useState, type JSX, type KeyboardEvent as ReactKeyboardEvent } from "react";

import { isEditableTarget, matchesTrigger } from "../keyboard";
import { comboFromEvent, comboToKeyCaps, combosEqual, hasModifier, type KeyCombo, type Translate } from "../keys";

export interface Entry {
    id: string;
    category: string;
    label: string;
    combo: KeyCombo;
    /** The user's own combo, used in addition to `combo`. */
    custom?: KeyCombo;
    remappable: boolean;
}

export interface Section {
    id: string;
    label: string;
}

/** Translates one of this module's own strings. */
export type ModuleTranslate = (key: string, variables?: Record<string, string>) => string;

export interface OverlayProps {
    sections: Section[];
    entries: Entry[];
    isMac: boolean;
    trigger: KeyCombo;
    allowCustomisation: boolean;
    t: ModuleTranslate;
    translateKey: Translate;
    onSetCustom(id: string, combo: KeyCombo | null): Promise<void>;
    onResetAll(): Promise<void>;
    onClose(): void;
}

// Flat keys: Element treats "|" in a translation key as a path separator.
const P = "datanauten_keyboard_shortcuts_";

export function Overlay(props: OverlayProps): JSX.Element {
    const { sections, entries, isMac, trigger, allowCustomisation, t, translateKey, onClose } = props;
    const titleId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [customising, setCustomising] = useState(false);
    const [recordingId, setRecordingId] = useState<string | null>(null);
    const [error, setError] = useState<{ id: string; message: string } | null>(null);

    useEffect(() => searchRef.current?.focus(), []);

    const caps = (combo: KeyCombo): string[] => comboToKeyCaps(combo, isMac, translateKey);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return entries;
        return entries.filter((e) => {
            const haystack = [e.label, ...caps(e.combo), ...(e.custom ? caps(e.custom) : [])].join(" ").toLowerCase();
            return haystack.includes(q);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entries, query, isMac]);

    const hasCustom = entries.some((e) => e.custom);

    const startRecording = (id: string): void => {
        setError(null);
        setRecordingId(id);
    };

    const onRecorderKeyDown = (ev: ReactKeyboardEvent, entry: Entry): void => {
        ev.preventDefault();
        ev.stopPropagation();
        if (ev.key === "Tab") return;
        if (ev.key === "Escape") {
            setRecordingId(null);
            setError(null);
            return;
        }
        const combo = comboFromEvent(ev.nativeEvent, isMac);
        if (!combo) return; // only modifiers held so far
        if (!hasModifier(combo)) {
            setError({ id: entry.id, message: t(P + "needs_modifier") });
            return;
        }
        const clash =
            (combosEqual(combo, trigger, isMac) && { label: t(P + "show_shortcuts") }) ||
            entries.find(
                (other) =>
                    other.id !== entry.id &&
                    (combosEqual(combo, other.combo, isMac) || (other.custom && combosEqual(combo, other.custom, isMac))),
            );
        if (clash) {
            setError({ id: entry.id, message: t(P + "conflict", { action: clash.label }) });
            return;
        }
        setRecordingId(null);
        setError(null);
        void props.onSetCustom(entry.id, combo);
    };

    const onPanelKeyDown = (ev: ReactKeyboardEvent): void => {
        if (ev.key === "Escape" || (matchesTrigger(ev.nativeEvent, trigger, isMac) && !isEditableTarget(ev.target))) {
            ev.preventDefault();
            onClose();
        } else if (ev.key === "Tab") {
            trapFocus(ev, panelRef.current);
        }
    };

    const footerKey = caps(trigger).join("+");

    return (
        <div className="ks-backdrop" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
            <div
                ref={panelRef}
                className="ks-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onKeyDown={onPanelKeyDown}
            >
                <header className="ks-header">
                    <h2 id={titleId} className="ks-title">
                        {t(P + "title")}
                    </h2>
                    <input
                        ref={searchRef}
                        className="ks-search"
                        type="search"
                        value={query}
                        placeholder={t(P + "filter_placeholder")}
                        aria-label={t(P + "filter_placeholder")}
                        onChange={(ev) => setQuery(ev.target.value)}
                    />
                    {allowCustomisation && (
                        <button
                            type="button"
                            className={"ks-button" + (customising ? " ks-button--primary" : "")}
                            aria-pressed={customising}
                            onClick={() => {
                                setCustomising(!customising);
                                setRecordingId(null);
                                setError(null);
                            }}
                        >
                            {customising ? t(P + "done") : t(P + "customise")}
                        </button>
                    )}
                    <button type="button" className="ks-close" aria-label={t(P + "close")} onClick={onClose}>
                        ×
                    </button>
                </header>

                <div className="ks-body">
                    {visible.length === 0 && <p className="ks-empty">{t(P + "no_results", { query })}</p>}
                    {sections.map((section) => {
                        const rows = visible.filter((e) => e.category === section.id);
                        if (rows.length === 0) return null;
                        return (
                            <section key={section.id} className="ks-section" aria-label={section.label}>
                                <h3 className="ks-section-title">{section.label}</h3>
                                <dl className="ks-list">
                                    {rows.map((entry) => (
                                        <div key={entry.id} className="ks-row">
                                            <dt className="ks-label">{entry.label}</dt>
                                            <dd className="ks-keys">
                                                {recordingId === entry.id ? (
                                                    <button
                                                        type="button"
                                                        className="ks-recorder"
                                                        autoFocus
                                                        onKeyDown={(ev) => onRecorderKeyDown(ev, entry)}
                                                        onBlur={() => setRecordingId(null)}
                                                    >
                                                        {t(P + "recording")}
                                                    </button>
                                                ) : (
                                                    <>
                                                        {entry.custom && (
                                                            <>
                                                                <Combo caps={caps(entry.custom)} custom title={t(P + "custom_badge")} />
                                                                <span className="ks-or">{t(P + "or")}</span>
                                                            </>
                                                        )}
                                                        <Combo caps={caps(entry.combo)} />
                                                    </>
                                                )}
                                                {customising && entry.remappable && recordingId !== entry.id && (
                                                    <span className="ks-actions">
                                                        <button
                                                            type="button"
                                                            className="ks-icon-button"
                                                            aria-label={t(P + "edit", { action: entry.label })}
                                                            title={t(P + "edit", { action: entry.label })}
                                                            onClick={() => startRecording(entry.id)}
                                                        >
                                                            ✎
                                                        </button>
                                                        {entry.custom && (
                                                            <button
                                                                type="button"
                                                                className="ks-icon-button"
                                                                aria-label={t(P + "reset", { action: entry.label })}
                                                                title={t(P + "reset", { action: entry.label })}
                                                                onClick={() => void props.onSetCustom(entry.id, null)}
                                                            >
                                                                ↺
                                                            </button>
                                                        )}
                                                    </span>
                                                )}
                                            </dd>
                                            {error?.id === entry.id && (
                                                <dd className="ks-error" role="alert">
                                                    {error.message}
                                                </dd>
                                            )}
                                        </div>
                                    ))}
                                </dl>
                            </section>
                        );
                    })}
                </div>

                <footer className="ks-footer">
                    <span>{t(P + "footer_toggle", { key: footerKey })}</span>
                    {customising && <span>{t(P + "footer_customise")}</span>}
                    {customising && hasCustom && (
                        <button type="button" className="ks-link" onClick={() => void props.onResetAll()}>
                            {t(P + "reset_all")}
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}

function Combo({ caps, custom, title }: { caps: string[]; custom?: boolean; title?: string }): JSX.Element {
    return (
        <span className={"ks-combo" + (custom ? " ks-combo--custom" : "")} title={title}>
            {caps.map((cap, i) => (
                <kbd key={i} className="ks-kbd">
                    {cap}
                </kbd>
            ))}
        </span>
    );
}

function trapFocus(ev: ReactKeyboardEvent, panel: HTMLElement | null): void {
    if (!panel) return;
    const focusables = panel.querySelectorAll<HTMLElement>("button, input, [tabindex]:not([tabindex='-1'])");
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
    }
}
