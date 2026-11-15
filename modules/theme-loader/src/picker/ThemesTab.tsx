import React from "react";
import type { Variant } from "../types";
import { localise } from "../params";
import type { PickerController } from "./controller";
import { stageRank, Swatch, useController } from "./common";

const MODES = ["light", "dark", "daylight"] as const;

export function ThemesTab({ c }: { c: PickerController }): React.JSX.Element {
    useController(c);
    const [stage, setStage] = React.useState<string | null>(null);
    const [mode, setMode] = React.useState<string | null>(null);
    const [query, setQuery] = React.useState("");
    const reg = c.registry();
    const lang = c.lang();
    const chosen = c.chosen();
    const applied = c.applied();
    const visible = reg.variants.filter((v) => c.showHidden() || !v.hidden);
    const stages = Array.from(new Set(visible.map((v) => v.stage))).sort((a, b) => stageRank(a) - stageRank(b) || a.localeCompare(b));
    const q = query.trim().toLowerCase();
    const shown = visible.filter(
        (v) =>
            (!stage || v.stage === stage) &&
            (!mode || v.mode === mode) &&
            (!q || `${v.id} ${localise(v.name, lang)} ${localise(v.description, lang)} ${localise(v.familyName, lang)}`.toLowerCase().includes(q)),
    );
    const families = reg.families.filter((f) => shown.some((v) => v.family === f.family));
    const active = c.variant(applied);

    return (
        <div className="mx_SettingsSection tl-ui tl-picker tl-tab">
            <div className="mx_SettingsSection_inner">
                <h2 className="mx_Heading_h4 tl-heading">{c.t("tl_title")}</h2>
                <p className="tl-muted">{c.t("tl_intro")}</p>
                {c.urlOverride() && <p className="tl-notice">{c.t("tl_url_override")}</p>}
                {!!reg.problems?.length && (
                    <details className="tl-problems" open>
                        <summary>
                            {c.t("tl_dev_problems")} ({reg.problems.length})
                        </summary>
                        <ul>
                            {reg.problems.map((p, i) => (
                                <li key={i} className={`tl-problem-${p.level}`}>
                                    <code>{p.family}</code> {p.message}
                                </li>
                            ))}
                        </ul>
                    </details>
                )}

                <button
                    type="button"
                    className={`tl-card tl-card-default${applied === null ? " tl-card-active" : ""}`}
                    aria-pressed={chosen === null}
                    onClick={() => c.select(null)}
                    data-tl-variant=""
                >
                    <Swatch v={null} />
                    <span className="tl-card-text">
                        <span className="tl-card-name">{c.t("tl_default")}</span>
                        <span className="tl-card-desc">{c.t("tl_default_desc")}</span>
                    </span>
                    {applied === null && <span className="tl-badge tl-badge-active">{c.t("tl_active")}</span>}
                </button>

                {active?.mode === "daylight" && <PhaseControl c={c} v={active} />}

                <div className="tl-filters" role="group">
                    <input
                        type="search"
                        className="tl-search"
                        placeholder={c.t("tl_search")}
                        aria-label={c.t("tl_search")}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className="tl-chips" role="group" aria-label={c.t("tl_filter_mode")}>
                        <span className="tl-chips-label">{c.t("tl_filter_mode")}</span>
                        <Chip on={mode === null} onClick={() => setMode(null)} label={c.t("tl_all")} />
                        {MODES.map((m) => (
                            <Chip key={m} on={mode === m} onClick={() => setMode(mode === m ? null : m)} label={c.t(`tl_mode_${m}`)} />
                        ))}
                    </div>
                    <div className="tl-chips" role="group" aria-label={c.t("tl_filter_stage")}>
                        <span className="tl-chips-label">{c.t("tl_filter_stage")}</span>
                        <Chip on={stage === null} onClick={() => setStage(null)} label={c.t("tl_all")} />
                        {stages.map((s) => (
                            <Chip key={s} on={stage === s} onClick={() => setStage(stage === s ? null : s)} label={s} />
                        ))}
                    </div>
                </div>

                {!families.length && <p className="tl-muted">{c.t("tl_none_match")}</p>}
                {families.map((f) => (
                    <section key={f.family} className="tl-family" data-tl-family-section={f.family}>
                        <h3 className="tl-family-name">
                            {localise(f.name, lang)}
                            {f.hidden && <span className="tl-badge">{c.t("tl_hidden")}</span>}
                        </h3>
                        <div className="tl-grid">
                            {shown
                                .filter((v) => v.family === f.family)
                                .map((v) => (
                                    <Card key={v.id} c={c} v={v} active={applied === v.id} chosen={chosen === v.id} />
                                ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}

function Chip({ on, onClick, label }: { on: boolean; onClick(): void; label: string }): React.JSX.Element {
    return (
        <button type="button" className={`tl-chip${on ? " tl-chip-on" : ""}`} aria-pressed={on} onClick={onClick}>
            {label}
        </button>
    );
}

function Card({ c, v, active, chosen }: { c: PickerController; v: Variant; active: boolean; chosen: boolean }): React.JSX.Element {
    const lang = c.lang();
    const desc = localise(v.description, lang);
    return (
        <button
            type="button"
            className={`tl-card${active ? " tl-card-active" : ""}`}
            aria-pressed={chosen}
            onClick={() => c.select(v.id)}
            title={desc}
            data-tl-variant={v.id}
        >
            <Swatch v={v} />
            <span className="tl-card-text">
                <span className="tl-card-name">{localise(v.name, lang) || v.id}</span>
                <span className="tl-card-meta">
                    <span className="tl-badge">{v.stage}</span>
                    <span className="tl-badge">{c.t(`tl_mode_${v.mode}` as never) || v.mode}</span>
                    {v.hidden && <span className="tl-badge">{c.t("tl_hidden")}</span>}
                    {typeof v.seriousness === "number" && (
                        <span className="tl-axis" title={c.t("tl_seriousness")}>
                            S{v.seriousness}
                        </span>
                    )}
                    {typeof v.hype === "number" && (
                        <span className="tl-axis" title={c.t("tl_hype")}>
                            H{v.hype}
                        </span>
                    )}
                </span>
                {desc && <span className="tl-card-desc">{desc}</span>}
            </span>
            {active && <span className="tl-badge tl-badge-active">{c.t("tl_active")}</span>}
        </button>
    );
}

function PhaseControl({ c, v }: { c: PickerController; v: Variant }): React.JSX.Element {
    const forced = c.forcedPhase();
    return (
        <div className="tl-phase">
            <label>
                {c.t("tl_phase")}{" "}
                <select value={forced ?? ""} onChange={(e) => c.setForcedPhase(e.target.value || null)} data-tl-phase-select="">
                    <option value="">{c.t("tl_phase_auto")}</option>
                    {(v.schedule ?? []).map((p) => (
                        <option key={p.phase} value={p.phase}>
                            {p.phase} ({p.from})
                        </option>
                    ))}
                </select>
            </label>
            <span className="tl-muted">
                {c.t("tl_phase_now")}: <strong>{c.phase() ?? "–"}</strong>
            </span>
        </div>
    );
}
