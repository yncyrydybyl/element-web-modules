import React from "react";
import { localise } from "../params";
import type { PickerController } from "./controller";
import { Swatch, useController } from "./common";

/** Module API DialogProps: onSubmit(model) / onCancel() (2.x); older hosts passed onFinished. */
interface Props {
    c: PickerController;
    onSubmit?(model: null): void;
    onCancel?(): void;
    onFinished?(ok: boolean, model: null): void;
}

/** Type-ahead theme list for api.openDialog: arrows preview live, Enter applies, Esc/close reverts. */
export function QuickSwitcher({ c, onSubmit, onFinished }: Props): React.JSX.Element {
    useController(c);
    const lang = c.lang();
    const original = React.useRef(c.applied());
    const committed = React.useRef(false);
    const [query, setQuery] = React.useState("");
    const items = React.useMemo(() => {
        const q = query.trim().toLowerCase();
        const vs = c
            .registry()
            .variants.filter((v) => c.showHidden() || !v.hidden)
            .filter((v) => !q || `${v.id} ${localise(v.name, lang)} ${localise(v.familyName, lang)} ${v.stage} ${v.mode}`.toLowerCase().includes(q));
        const def = !q || c.t("tl_default").toLowerCase().includes(q) || "element default".includes(q);
        return [...(def ? [null] : []), ...vs];
    }, [c, query, lang]);
    const [index, setIndex] = React.useState(() => Math.max(0, items.findIndex((v) => (v?.id ?? null) === original.current)));
    const listRef = React.useRef<HTMLUListElement>(null);

    React.useEffect(
        () => () => {
            // Closed without Enter/click: undo the preview.
            if (!committed.current && c.applied() !== original.current) c.preview(original.current);
        },
        [c],
    );

    React.useEffect(() => {
        listRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)?.scrollIntoView?.({ block: "nearest" });
    }, [index]);

    const move = (d: number): void => {
        if (!items.length) return;
        const next = (index + d + items.length) % items.length;
        setIndex(next);
        c.preview(items[next]?.id ?? null);
    };
    const commit = (i: number): void => {
        const v = items[i];
        if (v === undefined) return;
        committed.current = true;
        c.select(v?.id ?? null);
        try {
            if (typeof onSubmit === "function") onSubmit(null);
            else onFinished?.(true, null);
        } catch {
            /* dialog already closed */
        }
    };

    return (
        <div className="tl-ui tl-switcher tl-quick" onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
            else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
            else if (e.key === "Enter") { e.preventDefault(); commit(index); }
        }}>
            <input
                className="tl-search tl-quick-input"
                autoFocus
                type="search"
                placeholder={c.t("tl_search")}
                aria-label={c.t("tl_search")}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIndex(0);
                }}
                aria-controls="tl-quick-list"
                aria-activedescendant={`tl-quick-${index}`}
            />
            <ul className="tl-quick-list" id="tl-quick-list" role="listbox" ref={listRef}>
                {items.map((v, i) => (
                    <li
                        key={v?.id ?? "__default"}
                        id={`tl-quick-${i}`}
                        data-index={i}
                        data-tl-variant={v?.id ?? ""}
                        role="option"
                        aria-selected={i === index}
                        className={`tl-quick-item${i === index ? " tl-quick-item-sel" : ""}${(v?.id ?? null) === c.chosen() ? " tl-quick-item-chosen" : ""}`}
                        onMouseEnter={() => setIndex(i)}
                        onClick={() => commit(i)}
                    >
                        <Swatch v={v} />
                        <span className="tl-quick-name">{v ? localise(v.name, lang) || v.id : c.t("tl_default")}</span>
                        <span className="tl-quick-fam">{v ? `${localise(v.familyName, lang)} · ${v.stage} · ${v.mode}` : ""}</span>
                    </li>
                ))}
            </ul>
            <p className="tl-muted tl-quick-hint">{c.t("tl_quick_hint")}</p>
        </div>
    );
}
