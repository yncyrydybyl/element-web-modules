import { useEffect, useState, type JSX } from "react";

import { P } from "../i18n";
import { ALLOWED_OPTIONS, POLICY_IDS, validPattern, validUserId, type PolicyConfig, type PolicyId, type PolicySet } from "../policies";
import { saveException, savePolicies, type Rules, type SdkClient, type SpacePolicies } from "../space";
import { relative, type ModuleTranslate } from "./CheckerOverlay";

export interface PoliciesTabProps {
    client: SdkClient;
    spaceId: string;
    space: SpacePolicies;
    /** What the space's rooms are checked against: its own policies, or a parent space's. */
    rules: Rules;
    /** Sub-spaces below it with policies of their own. */
    ownPolicies: string[];
    spaceName(spaceId: string): string;
    roomName(roomId: string): string;
    revision: number;
    language: string;
    t: ModuleTranslate;
}

type SaveState = "idle" | "saving" | "saved" | { error: string };

/** The space's policies, editable by whoever may change the space's settings. */
export function PoliciesTab(props: PoliciesTabProps): JSX.Element {
    const { space, t } = props;
    // Without policies of its own, a sub-space starts from those it inherits.
    const inherited = !space.saved && props.rules.source !== props.spaceId;
    const base = inherited ? props.rules.policies : space.policies;
    const [draft, setDraft] = useState<PolicySet>(base);
    const [save, setSave] = useState<SaveState>("idle");
    const dirty = JSON.stringify(draft) !== JSON.stringify(base);
    const invalid = (draft.name.pattern !== undefined && !validPattern(draft.name.pattern)) || (Boolean(draft.required_member.user) && !validUserId(draft.required_member.user!));
    const readOnly = !space.canEdit;

    // Someone else changed them (or our save came back): show theirs unless we're editing.
    useEffect(() => {
        if (!dirty) setDraft(base);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [space, props.rules]);

    const change = (id: PolicyId, patch: Partial<PolicyConfig>): void => {
        setDraft((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
        setSave("idle");
    };

    const onSave = async (): Promise<void> => {
        setSave("saving");
        try {
            await savePolicies(props.client, props.spaceId, draft);
            setSave("saved");
        } catch (e) {
            setSave({ error: e instanceof Error ? e.message : String(e) });
        }
    };

    return (
        <div className="rc-policies">
            <div className="rc-policies-intro">
                <p>
                    {space.saved && space.at
                        ? t(`${P}policies_saved`, { user: space.by ?? "?", when: relative(space.at, props.language) })
                        : inherited
                          ? t(`${P}policies_inherited`, { space: props.spaceName(props.rules.source) })
                          : t(`${P}policies_defaults`)}{" "}
                    {t(`${P}policies_scope`)}
                </p>
                {props.ownPolicies.length > 0 && (
                    <p className="rc-note">{t(`${P}policies_own_below`, { spaces: props.ownPolicies.map(props.spaceName).join(", ") })}</p>
                )}
                {readOnly && <p className="rc-note">{t(`${P}policies_readonly`)}</p>}
            </div>
            <div className="rc-policies-scroll">
                <ul className="rc-policy-list">
                    {POLICY_IDS.map((id) => (
                        <PolicyRow key={id} id={id} config={draft[id]} readOnly={readOnly} t={t} onChange={(patch) => change(id, patch)} />
                    ))}
                </ul>
                <ExceptionList {...props} />
            </div>
            {!readOnly && (
                <div className="rc-savebar">
                    {typeof save === "object" && <span className="rc-note rc-note--error">{t(`${P}fix_failed`, { error: save.error })}</span>}
                    {save === "saved" && !dirty && <span className="rc-note rc-note--ok">{t(`${P}saved`)}</span>}
                    <button type="button" className="rc-button" disabled={!dirty || save === "saving"} onClick={() => setDraft(base)}>
                        {t(`${P}discard`)}
                    </button>
                    <button
                        type="button"
                        className="rc-button rc-button--primary"
                        disabled={(!dirty && space.saved) || invalid || save === "saving"}
                        onClick={() => void onSave()}
                    >
                        {save === "saving" ? t(`${P}saving`) : t(`${P}save_policies`)}
                    </button>
                </div>
            )}
        </div>
    );
}

function PolicyRow(props: { id: PolicyId; config: PolicyConfig; readOnly: boolean; t: ModuleTranslate; onChange(patch: Partial<PolicyConfig>): void }): JSX.Element {
    const { id, config: c, readOnly, t } = props;
    const options = ALLOWED_OPTIONS[id];
    const patternOk = c.pattern === undefined || validPattern(c.pattern);
    return (
        <li className="rc-policy" data-enabled={c.enabled}>
            <label className="rc-switch">
                <input type="checkbox" role="switch" checked={c.enabled} disabled={readOnly} onChange={(ev) => props.onChange({ enabled: ev.target.checked })} />
                <span className="rc-policy-name">{t(`${P}policy_${id}`)}</span>
            </label>
            <p className="rc-policy-desc">{t(`${P}policy_${id}_desc`)}</p>
            <label className="rc-field rc-field--inline">
                <span>{t(`${P}severity`)}</span>
                <select
                    value={c.severity}
                    disabled={readOnly || !c.enabled}
                    aria-label={`${t(`${P}policy_${id}`)}: ${t(`${P}severity`)}`}
                    onChange={(ev) => props.onChange({ severity: ev.target.value as PolicyConfig["severity"] })}
                >
                    <option value="error">{t(`${P}severity_error`)}</option>
                    <option value="warning">{t(`${P}severity_warning`)}</option>
                </select>
            </label>
            {c.pattern !== undefined && (
                <label className="rc-field">
                    <span>{t(`${P}param_pattern`)}</span>
                    <input
                        value={c.pattern}
                        disabled={readOnly || !c.enabled}
                        placeholder="^[A-Z].*"
                        aria-invalid={!patternOk}
                        spellCheck={false}
                        onChange={(ev) => props.onChange({ pattern: ev.target.value })}
                    />
                    {!patternOk && <span className="rc-note rc-note--error">{t(`${P}param_pattern_invalid`)}</span>}
                </label>
            )}
            {c.minLength !== undefined && (
                <NumberField label={t(`${P}param_min_length`)} value={c.minLength} max={1000} disabled={readOnly || !c.enabled} onChange={(minLength) => props.onChange({ minLength })} />
            )}
            {c.min !== undefined && <NumberField label={t(`${P}param_min`)} value={c.min} max={100} disabled={readOnly || !c.enabled} onChange={(min) => props.onChange({ min })} />}
            {c.minVersion !== undefined && (
                <NumberField label={t(`${P}param_min_version`)} value={c.minVersion} min={1} max={1000} disabled={readOnly || !c.enabled} onChange={(minVersion) => props.onChange({ minVersion })} />
            )}
            {c.days !== undefined && (
                <NumberField label={t(`${P}param_days`)} value={c.days} min={1} max={3650} disabled={readOnly || !c.enabled} onChange={(days) => props.onChange({ days })} />
            )}
            {c.level !== undefined && (
                <NumberField label={t(`${P}param_level`)} value={c.level} max={100} disabled={readOnly || !c.enabled} onChange={(level) => props.onChange({ level })} />
            )}
            {c.user !== undefined && (
                <label className="rc-field">
                    <span>{t(`${P}param_user`)}</span>
                    <input
                        value={c.user}
                        disabled={readOnly || !c.enabled}
                        placeholder="@moderation-bot:example.org"
                        aria-invalid={Boolean(c.user) && !validUserId(c.user)}
                        spellCheck={false}
                        onChange={(ev) => props.onChange({ user: ev.target.value.trim() })}
                    />
                    {Boolean(c.user) && !validUserId(c.user) && <span className="rc-note rc-note--error">{t(`${P}param_user_invalid`)}</span>}
                </label>
            )}
            {options && c.allowed && (
                <fieldset className="rc-field" disabled={readOnly || !c.enabled}>
                    <legend>{t(`${P}param_allowed`)}</legend>
                    <div className="rc-options">
                        {options.map((o) => (
                            <label key={o} className="rc-option">
                                <input
                                    type="checkbox"
                                    checked={c.allowed!.includes(o)}
                                    // At least one stays allowed: the quick fix needs something to set.
                                    disabled={c.allowed!.length === 1 && c.allowed![0] === o}
                                    onChange={(ev) =>
                                        props.onChange({ allowed: ev.target.checked ? options.filter((x) => x === o || c.allowed!.includes(x)) : c.allowed!.filter((x) => x !== o) })
                                    }
                                />
                                {t(`${P}value_${o}`)}
                            </label>
                        ))}
                    </div>
                    <span className="rc-hint">{t(`${P}param_allowed_fix`)}</span>
                </fieldset>
            )}
        </li>
    );
}

function NumberField(props: { label: string; value: number; min?: number; max: number; disabled: boolean; onChange(v: number): void }): JSX.Element {
    return (
        <label className="rc-field rc-field--inline">
            <span>{props.label}</span>
            <input
                type="number"
                min={props.min ?? 0}
                max={props.max}
                step={1}
                value={props.value}
                disabled={props.disabled}
                onChange={(ev) => {
                    const v = Math.round(Number(ev.target.value));
                    if (Number.isFinite(v)) props.onChange(Math.max(props.min ?? 0, Math.min(props.max, v)));
                }}
            />
        </label>
    );
}

/** Every accepted failure in the space, for a review now and then. */
function ExceptionList(props: PoliciesTabProps): JSX.Element {
    const { space, t } = props;
    const [error, setError] = useState<string | undefined>();
    const rows = Object.entries(space.exceptions).flatMap(([roomId, byPolicy]) =>
        POLICY_IDS.filter((id) => byPolicy[id]).map((id) => ({ roomId, id, ex: byPolicy[id]! })),
    );
    return (
        <section className="rc-exceptions" aria-label={t(`${P}exceptions_title`)}>
            <div className="rc-section-title">{t(`${P}exceptions_title`)}</div>
            {rows.length === 0 ? (
                <p className="rc-note">{t(`${P}exceptions_none`)}</p>
            ) : (
                <ul className="rc-exception-list">
                    {rows.map(({ roomId, id, ex }) => (
                        <li key={`${roomId}|${id}`}>
                            <span className="rc-exception-what">
                                <strong>{props.roomName(roomId)}</strong> · {t(`${P}policy_${id}`)}
                            </span>
                            <span className="rc-exception-reason">“{ex.reason}”</span>
                            <span className="rc-note">{t(`${P}excepted_by`, { user: ex.by, when: relative(ex.at, props.language) })}</span>
                            {space.canEdit && (
                                <button
                                    type="button"
                                    className="rc-link"
                                    onClick={() =>
                                        void saveException(props.client, props.spaceId, roomId, id).catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
                                    }
                                >
                                    {t(`${P}remove`)}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {error && <p className="rc-note rc-note--error">{t(`${P}fix_failed`, { error })}</p>}
        </section>
    );
}
