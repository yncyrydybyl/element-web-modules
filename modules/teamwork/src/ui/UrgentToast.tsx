import type { JSX } from "react";

import { P, type ModuleTranslate } from "../i18n";
import { REMIND_EVERY_MS, REMIND_FOR_MS, type Reminder } from "../priority";

export interface UrgentToastsProps {
    t: ModuleTranslate;
    reminders: Reminder[];
    open(r: Reminder): void;
    dismiss(r: Reminder): void;
    turnOff(): void;
}

/** In-app reminders for unread urgent messages, stacked at the bottom right. */
export function UrgentToasts({ t, reminders, open, dismiss, turnOff }: UrgentToastsProps): JSX.Element {
    const total = REMIND_FOR_MS / REMIND_EVERY_MS;
    return (
        <div className="tw-toasts" aria-live="assertive">
            {reminders.map((r) => (
                <div key={`${r.eventId}-${r.count}`} className="tw-toast" role="alert" data-testid="teamwork-urgent-toast">
                    <div className="tw-toast-title">🚨 {t(`${P}reminder_title`, { sender: r.sender })}</div>
                    <div className="tw-toast-text">{r.text}</div>
                    <div className="tw-toast-count">{t(`${P}reminder_count`, { n: Math.min(r.count, total) })}</div>
                    <div className="tw-toast-actions">
                        <button type="button" className="tw-action tw-action--small tw-action--primary" onClick={() => open(r)}>
                            {t(`${P}reminder_open`)}
                        </button>
                        <button type="button" className="tw-action tw-action--small" onClick={() => dismiss(r)}>
                            {t(`${P}reminder_later`)}
                        </button>
                        <button type="button" className="tw-link" onClick={turnOff}>
                            {t(`${P}reminder_off`)}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
