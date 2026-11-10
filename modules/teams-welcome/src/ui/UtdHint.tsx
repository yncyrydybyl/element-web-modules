import { nextSecureAction, type SecureAction, type SecureStatus } from "../client";
import { P, type ModuleTranslate } from "../i18n";
import { usePoll } from "./Guide";
import { CloseIcon, LockIcon } from "./icons";

export interface UtdHintProps {
    t: ModuleTranslate;
    /** Read again every `pollMs`: the state often changes right after login (e.g. verification). */
    loadStatus(): Promise<SecureStatus>;
    pollMs?: number;
    canAct: boolean;
    act(action: SecureAction): void;
    learnMore(): void;
    dismiss(): void;
    never(): void;
}

const BUTTON: Record<SecureAction, string> = {
    verify: `${P}btn_verify`,
    key_storage: `${P}btn_key_storage`,
    fix_recovery: `${P}btn_fix_recovery`,
    set_up_recovery: `${P}btn_set_up_recovery`,
};

/** A small card that explains an "Unable to decrypt" message and offers the matching fix. */
export function UtdHint({ t, loadStatus, pollMs = 2000, canAct, act, learnMore, dismiss, never }: UtdHintProps): React.JSX.Element {
    const [status] = usePoll(loadStatus, pollMs);
    const action = status ? nextSecureAction(status) : null;
    const body = action === "verify" || action === "fix_recovery" ? "utd_unverified" : action ? "utd_no_recovery" : "utd_ok";
    return (
        <aside className="twl-utd" role="status" aria-label={t(`${P}utd_title`)} data-teams-welcome-utd="">
            <header className="twl-utd-header">
                <LockIcon />
                <strong>{t(`${P}utd_title`)}</strong>
                <button type="button" className="twl-icon-button" aria-label={t(`${P}close`)} onClick={dismiss}>
                    <CloseIcon />
                </button>
            </header>
            <p>{t(`${P}${body}`)}</p>
            <div className="twl-actions">
                {action && canAct && (
                    <button type="button" className="twl-button twl-primary twl-small" onClick={() => act(action)}>
                        {t(BUTTON[action])}
                    </button>
                )}
                <button type="button" className="twl-button twl-secondary twl-small" onClick={learnMore}>
                    {t(`${P}utd_learn`)}
                </button>
                <button type="button" className="twl-link" onClick={never}>
                    {t(`${P}utd_never`)}
                </button>
            </div>
        </aside>
    );
}
