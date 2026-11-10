import { useCallback, useEffect, useRef, useState } from "react";

import { isSecure, nextSecureAction, type Membership, type SecureAction, type SecureStatus, type SettingsTab } from "../client";
import type { StepId, WelcomeConfig } from "../config";
import { formatKeys, resolveCheatSheet, SHORTCUTS } from "../habits";
import { P, type ModuleTranslate } from "../i18n";
import type { SiblingId } from "../suite";
import { CheckIcon, CloseIcon, LockIcon } from "./icons";

export interface ProfileState {
    userId: string;
    displayName?: string;
    hasName: boolean;
    hasAvatar: boolean;
}

export interface SpaceState {
    alias: string;
    name: string;
    description?: string;
    roomId?: string;
    membership: Membership;
}

/** Everything the guide reads or does; the module wires it to Element, tests to fakes. */
export interface GuideServices {
    secureStatus(): Promise<SecureStatus>;
    runSecure(action: SecureAction | null): void;
    canOpenSettings(): boolean;
    openSettings(tab: SettingsTab): void;
    profile(): Promise<ProfileState | undefined>;
    notificationsOn(): boolean;
    spaces(): Promise<SpaceState[]>;
    joinSpace(alias: string): Promise<void>;
    openSpace(space: SpaceState): void;
    isLoaded(id: SiblingId): boolean;
}

export interface GuideProps {
    t: ModuleTranslate;
    config: WelcomeConfig;
    services: GuideServices;
    variant: "panel" | "page";
    initialStep?: StepId;
    onClose?(): void;
    /** How often the live checks refresh, in ms. */
    pollMs?: number;
}

/** Runs `load` now and every `ms` while mounted (and after `bump()`), keeping the last result. */
export function usePoll<T>(load: () => Promise<T>, ms: number): [T | undefined, () => void] {
    const [value, setValue] = useState<T>();
    const [tick, setTick] = useState(0);
    const loadRef = useRef(load);
    loadRef.current = load;
    useEffect(() => {
        let alive = true;
        const run = (): void =>
            void loadRef.current().then(
                (v) => alive && setValue(v),
                () => undefined,
            );
        run();
        const timer = setInterval(run, ms);
        return () => {
            alive = false;
            clearInterval(timer);
        };
    }, [ms, tick]);
    return [value, useCallback(() => setTick((n) => n + 1), [])];
}

export function Guide({ t, config, services, variant, initialStep, onClose, pollMs = 2000 }: GuideProps): React.JSX.Element {
    const steps = config.steps;
    const [index, setIndex] = useState(() => Math.max(0, initialStep ? steps.indexOf(initialStep) : 0));
    const [visited, setVisited] = useState<Set<StepId>>(() => new Set(steps.length ? [steps[Math.max(0, index)]] : []));
    const [secure] = usePoll(services.secureStatus, pollMs);
    const [profile] = usePoll(services.profile, pollMs);
    const [notifications] = usePoll(async () => services.notificationsOn(), pollMs);
    const [spaces, refreshSpaces] = usePoll(services.spaces, pollMs);

    const step = steps[index] as StepId | undefined;
    const go = (i: number): void => {
        setIndex(i);
        setVisited((v) => new Set(v).add(steps[i]));
    };

    const done: Record<StepId, boolean> = {
        secure: !!secure && isSecure(secure),
        habits: visited.has("habits"),
        profile: !!profile?.hasAvatar && !!profile?.hasName && !!notifications,
        spaces: !!spaces?.length && spaces.every((s) => s.membership === "join"),
    };

    const title = config.organisation ? t(`${P}title_org`, { org: config.organisation }) : t(`${P}title`);
    return (
        <section className={`twl-guide twl-guide-${variant}`} aria-label={title} data-teams-welcome-guide="">
            <header className="twl-header">
                <div className="twl-header-text">
                    <h2 className="twl-title">{title}</h2>
                    {variant === "panel" && config.organisation && <p className="twl-subtitle">{t(`${P}title`)}</p>}
                </div>
                {onClose && (
                    <button type="button" className="twl-icon-button" aria-label={t(`${P}close`)} title={t(`${P}close`)} onClick={onClose}>
                        <CloseIcon />
                    </button>
                )}
            </header>
            {index === 0 && <p className="twl-intro">{t(`${P}intro`)}</p>}
            <nav className="twl-steps" aria-label={t(`${P}step_of`, { n: index + 1, total: steps.length })}>
                {steps.map((s, i) => (
                    <button
                        key={s}
                        type="button"
                        className={`twl-step-tab${i === index ? " twl-active" : ""}${done[s] ? " twl-done" : ""}`}
                        aria-current={i === index ? "step" : undefined}
                        onClick={() => go(i)}
                        data-step={s}
                    >
                        <span className="twl-step-num">{done[s] ? <CheckIcon aria-label={t(`${P}done_badge`)} /> : i + 1}</span>
                        <span className="twl-step-label">{t(`${P}step_${s}`)}</span>
                    </button>
                ))}
            </nav>
            <div className="twl-body">
                {step === "secure" && <SecureStep t={t} status={secure} services={services} />}
                {step === "habits" && <HabitsStep t={t} services={services} />}
                {step === "profile" && <ProfileStep t={t} profile={profile} notifications={!!notifications} services={services} />}
                {step === "spaces" && <SpacesStep t={t} config={config} spaces={spaces} services={services} refresh={refreshSpaces} />}
            </div>
            <footer className="twl-footer">
                <div className="twl-footer-help">
                    {config.helpUrl && (
                        <a href={config.helpUrl} target="_blank" rel="noreferrer noopener">
                            {t(`${P}help`, { label: config.helpLabel ?? t(`${P}help_default`) })}
                        </a>
                    )}
                </div>
                <span className="twl-step-count">{t(`${P}step_of`, { n: index + 1, total: steps.length })}</span>
                {index > 0 && (
                    <button type="button" className="twl-button twl-secondary" onClick={() => go(index - 1)}>
                        {t(`${P}back`)}
                    </button>
                )}
                {index < steps.length - 1 ? (
                    <button type="button" className="twl-button twl-primary" onClick={() => go(index + 1)}>
                        {t(`${P}next`)}
                    </button>
                ) : (
                    onClose && (
                        <button type="button" className="twl-button twl-primary" onClick={onClose}>
                            {t(`${P}finish`)}
                        </button>
                    )
                )}
            </footer>
        </section>
    );
}

function Check({ ok, label, hint }: { ok: boolean | undefined; label: string; hint?: string }): React.JSX.Element {
    const state = ok === undefined ? "unknown" : ok ? "ok" : "todo";
    return (
        <li className={`twl-check twl-check-${state}`} data-ok={state}>
            <span className="twl-check-mark">{ok ? <CheckIcon /> : null}</span>
            <span>
                <span className="twl-check-label">{label}</span>
                {hint && <span className="twl-check-hint">{hint}</span>}
            </span>
        </li>
    );
}

const SECURE_BUTTON: Record<SecureAction, string> = {
    verify: `${P}btn_verify`,
    key_storage: `${P}btn_key_storage`,
    fix_recovery: `${P}btn_fix_recovery`,
    set_up_recovery: `${P}btn_set_up_recovery`,
};

function SecureStep({ t, status, services }: { t: ModuleTranslate; status?: SecureStatus; services: GuideServices }): React.JSX.Element {
    const secure = !!status && isSecure(status);
    const unknown = !!status && status.keyStorage === undefined && status.recovery === undefined && status.verified === undefined;
    const action = status ? nextSecureAction(status) : null;
    return (
        <div className="twl-step" data-step-body="secure">
            <p>{t(`${P}secure_why`)}</p>
            <p>
                <strong>{t(`${P}secure_key`)}</strong>
            </p>
            <p>{t(`${P}secure_store`)}</p>
            <ul className="twl-checks" aria-live="polite">
                <Check ok={status?.keyStorage} label={t(`${P}check_key_storage`)} hint={t(`${P}check_key_storage_hint`)} />
                <Check ok={status?.recovery} label={t(`${P}check_recovery`)} hint={t(`${P}check_recovery_hint`)} />
                <Check ok={status?.verified} label={t(`${P}check_verified`)} hint={t(`${P}check_verified_hint`)} />
            </ul>
            {secure && (
                <p className="twl-success" role="status">
                    <CheckIcon /> {t(`${P}secure_done`)}
                </p>
            )}
            {unknown && <p className="twl-note">{t(`${P}secure_unknown`)}</p>}
            {services.canOpenSettings() && (
                <div className="twl-actions">
                    {action ? (
                        <button type="button" className="twl-button twl-primary" onClick={() => services.runSecure(action)}>
                            <LockIcon /> {t(SECURE_BUTTON[action])}
                        </button>
                    ) : (
                        status && (
                            <button type="button" className="twl-button twl-secondary" onClick={() => services.runSecure(null)}>
                                {t(`${P}btn_encryption_settings`)}
                            </button>
                        )
                    )}
                </div>
            )}
            {!secure && <p className="twl-note">{t(`${P}secure_toast_note`)}</p>}
            <details className="twl-glossary">
                <summary>{t(`${P}glossary_title`)}</summary>
                <dl>
                    <dt>{t(`${P}glossary_verify_term`)}</dt>
                    <dd>{t(`${P}glossary_verify`)}</dd>
                    <dt>{t(`${P}glossary_utd_term`)}</dt>
                    <dd>{t(`${P}glossary_utd`)}</dd>
                </dl>
            </details>
        </div>
    );
}

function HabitsStep({ t, services }: { t: ModuleTranslate; services: GuideServices }): React.JSX.Element {
    const entries = resolveCheatSheet(services.isLoaded);
    const overlay = services.isLoaded("keyboard-shortcuts");
    return (
        <div className="twl-step" data-step-body="habits">
            <p>{t(`${P}habits_intro`)}</p>
            <table className="twl-table twl-cheatsheet">
                <thead>
                    <tr>
                        <th scope="col">{t(`${P}col_teams`)}</th>
                        <th scope="col">{t(`${P}col_element`)}</th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((e) => (
                        <tr key={e.id} data-entry={e.id} data-module={e.module}>
                            <th scope="row">{t(e.teamsKey)}</th>
                            <td>
                                {t(e.elementKey)}
                                {e.module && (
                                    <span className="twl-addon" title={t(`${P}addon_hint`)}>
                                        {t(`${P}addon`)}
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="twl-card" data-card="shortcuts">
                <h3>{t(`${P}keys_title`)}</h3>
                <p>{t(`${P}keys_intro`)}</p>
                <table className="twl-table twl-keys">
                    <thead>
                        <tr>
                            <th scope="col">{t(`${P}keys_col_action`)}</th>
                            <th scope="col">Teams</th>
                            <th scope="col">Element</th>
                        </tr>
                    </thead>
                    <tbody>
                        {SHORTCUTS.map((s) => (
                            <tr key={s.labelKey}>
                                <th scope="row">{t(s.labelKey)}</th>
                                <td>{s.teams ? <kbd>{formatKeys(s.teams)}</kbd> : <span className="twl-muted">{t(`${P}key_none`)}</span>}</td>
                                <td>{s.element ? <kbd>{formatKeys(s.element)}</kbd> : <span className="twl-muted">{t(`${P}key_none`)}</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {overlay ? (
                    <p className="twl-note" data-sibling="keyboard-shortcuts">
                        {t(`${P}keys_overlay`)}
                    </p>
                ) : (
                    services.canOpenSettings() && (
                        <div className="twl-actions">
                            <button type="button" className="twl-button twl-secondary" onClick={() => services.openSettings("USER_KEYBOARD_TAB")}>
                                {t(`${P}keys_all`)}
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

function ProfileStep({
    t,
    profile,
    notifications,
    services,
}: {
    t: ModuleTranslate;
    profile?: ProfileState;
    notifications: boolean;
    services: GuideServices;
}): React.JSX.Element {
    const settings = services.canOpenSettings();
    return (
        <div className="twl-step" data-step-body="profile">
            <p>{t(`${P}profile_intro`)}</p>
            <ul className="twl-checks">
                <Check ok={profile?.hasAvatar} label={t(`${P}check_avatar`)} />
                <Check
                    ok={profile?.hasName}
                    label={profile?.hasName && profile.displayName ? t(`${P}check_name`, { name: profile.displayName }) : t(`${P}check_no_name`)}
                />
            </ul>
            {settings && (
                <div className="twl-actions">
                    <button type="button" className="twl-button twl-secondary" onClick={() => services.openSettings("USER_ACCOUNT_TAB")}>
                        {t(`${P}btn_edit_profile`)}
                    </button>
                </div>
            )}
            <p>{t(`${P}notif_intro`)}</p>
            <ul className="twl-checks">
                <Check ok={notifications} label={t(`${P}check_notifications`)} />
            </ul>
            {settings && (
                <div className="twl-actions">
                    <button type="button" className="twl-button twl-secondary" onClick={() => services.openSettings("USER_NOTIFICATIONS_TAB")}>
                        {t(`${P}btn_notifications`)}
                    </button>
                </div>
            )}
        </div>
    );
}

function SpacesStep({
    t,
    config,
    spaces,
    services,
    refresh,
}: {
    t: ModuleTranslate;
    config: WelcomeConfig;
    spaces?: SpaceState[];
    services: GuideServices;
    refresh(): void;
}): React.JSX.Element {
    const [joining, setJoining] = useState<Set<string>>(new Set());
    const [errors, setErrors] = useState<Record<string, string>>({});
    const list: SpaceState[] = spaces ?? config.spaces.map((s) => ({ alias: s.alias, name: s.name ?? s.alias, description: s.description, membership: "none" }));
    const open = list.filter((s) => s.membership !== "join");

    const join = async (aliases: string[]): Promise<void> => {
        setJoining((j) => new Set([...j, ...aliases]));
        for (const alias of aliases) {
            try {
                await services.joinSpace(alias);
                setErrors(({ [alias]: _, ...rest }) => rest);
            } catch (e) {
                setErrors((x) => ({ ...x, [alias]: e instanceof Error ? e.message : String(e) }));
            }
            setJoining((j) => {
                const n = new Set(j);
                n.delete(alias);
                return n;
            });
            refresh();
        }
    };

    return (
        <div className="twl-step" data-step-body="spaces">
            <p>{config.organisation ? t(`${P}spaces_intro_org`, { org: config.organisation }) : t(`${P}spaces_intro`)}</p>
            <ul className="twl-spaces">
                {list.map((s) => (
                    <li key={s.alias} className="twl-space" data-alias={s.alias} data-membership={s.membership}>
                        <span className="twl-space-avatar" aria-hidden="true">
                            {(s.name.replace(/^[#!]/, "")[0] ?? "?").toUpperCase()}
                        </span>
                        <span className="twl-space-text">
                            <span className="twl-space-name">{s.name}</span>
                            {s.description && <span className="twl-space-desc">{s.description}</span>}
                            {errors[s.alias] && (
                                <span className="twl-error" role="alert">
                                    {t(`${P}join_failed`, { error: errors[s.alias] })}
                                </span>
                            )}
                        </span>
                        {s.membership === "join" ? (
                            <span className="twl-space-joined">
                                <span className="twl-joined">
                                    <CheckIcon /> {t(`${P}joined`)}
                                </span>
                                <button type="button" className="twl-button twl-secondary twl-small" onClick={() => services.openSpace(s)}>
                                    {t(`${P}btn_open`)}
                                </button>
                            </span>
                        ) : (
                            <button
                                type="button"
                                className="twl-button twl-secondary twl-small"
                                disabled={joining.has(s.alias)}
                                onClick={() => void join([s.alias])}
                            >
                                {joining.has(s.alias) ? t(`${P}joining`) : t(`${P}btn_join`)}
                            </button>
                        )}
                    </li>
                ))}
            </ul>
            {open.length > 1 && (
                <div className="twl-actions">
                    <button
                        type="button"
                        className="twl-button twl-primary"
                        disabled={open.every((s) => joining.has(s.alias))}
                        onClick={() => void join(open.filter((s) => !joining.has(s.alias)).map((s) => s.alias))}
                    >
                        {t(`${P}btn_join_all`)}
                    </button>
                </div>
            )}
            {spaces && open.length === 0 && (
                <p className="twl-success" role="status">
                    <CheckIcon /> {t(`${P}spaces_done`)}
                </p>
            )}
        </div>
    );
}
