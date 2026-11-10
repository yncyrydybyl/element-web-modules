import { useEffect, useState, type JSX } from "react";

import { P, type ModuleTranslate } from "../i18n";
import type { ProfileStore } from "../profileStore";
import { CARD_FIELDS, parseDate, present, type ProfileCard, type ProfileInfo, type Presentation } from "../status";

/** How often mounted views re-check (expiry, and re-fetch when the cached profile is old enough). */
const TICK_MS = 30 * 1000;

/** The cached profile of a user; fetches it and keeps it fresh while the component is mounted. */
export function useProfile(store: ProfileStore, userId: string | undefined, maxAge?: number): ProfileInfo | undefined {
    const [, setTick] = useState(0);
    useEffect(() => {
        if (!userId) return;
        store.request(userId, maxAge);
        const unsubscribe = store.subscribe((id) => id === userId && setTick((n) => n + 1));
        const timer = setInterval(() => {
            store.request(userId, maxAge);
            setTick((n) => n + 1);
        }, TICK_MS);
        return () => {
            unsubscribe();
            clearInterval(timer);
        };
    }, [store, userId, maxAge]);
    return userId ? store.get(userId) : undefined;
}

export function formatTime(ts: number, now = Date.now()): string {
    const d = new Date(ts);
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === new Date(now).toDateString()) return time;
    return `${d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} ${time}`;
}

export function formatDay(date: string): string {
    return new Date(parseDate(date)).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

/** "until 15:30", or for the "today" and "this week" choices (which end at midnight) "until end of today/Sun, 15 Nov". */
export function untilText(ts: number, t: ModuleTranslate, now = Date.now()): string {
    const d = new Date(ts);
    if (d.getHours() !== 0 || d.getMinutes() !== 0) return t(`${P}until`, { time: formatTime(ts, now) });
    const lastDay = new Date(ts - 1);
    if (lastDay.toDateString() === new Date(now).toDateString()) return t(`${P}until_today`);
    return t(`${P}until_end_of`, { day: lastDay.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) });
}

/** The availability's name, or the text for statuses set without one (other clients). */
export function headline(p: Presentation, t: ModuleTranslate): string {
    if (p.availability) return t(`${P}avail_${p.availability}`);
    return p.text ?? "";
}

/** The small print: until when, back on, in a call since. */
export function detail(p: Presentation, t: ModuleTranslate): string | undefined {
    if (p.availability === "in_call" && p.callSince) return t(`${P}in_call_since`, { time: formatTime(p.callSince) });
    if (p.oooUntil) return t(`${P}back_on`, { date: formatDay(p.oooUntil) });
    if (p.expiresTs) return untilText(p.expiresTs, t);
    return undefined;
}

/** One line for tooltips and screen readers: "Busy · Working from Munich · until 17:00". */
export function describe(p: Presentation, t: ModuleTranslate): string {
    const parts = [headline(p, t)];
    if (p.availability && p.text) parts.push(p.text);
    const d = detail(p, t);
    if (d) parts.push(d);
    return parts.filter(Boolean).join(" · ");
}

/** A coloured dot for known availabilities (like Teams), else the status emoji (MSC4426). */
export function Badge({ p, t, className }: { p: Presentation; t: ModuleTranslate; className?: string }): JSX.Element {
    const label = describe(p, t);
    if (p.availability) {
        return (
            <span
                className={`ps-dot ps-dot--${p.availability}${className ? ` ${className}` : ""}`}
                role="img"
                aria-label={label}
                title={label}
                data-testid="profile-status-badge"
            />
        );
    }
    return (
        <span className={`ps-emoji${className ? ` ${className}` : ""}`} role="img" aria-label={label} title={label} data-testid="profile-status-badge">
            {p.emoji}
        </span>
    );
}

/** The full status: dot, availability, text, and when it ends. */
export function StatusLine({ p, t, compact }: { p: Presentation; t: ModuleTranslate; compact?: boolean }): JSX.Element {
    const d = detail(p, t);
    return (
        <span className={`ps-status${compact ? " ps-status--compact" : ""}`} data-testid="profile-status-line" title={describe(p, t)}>
            <Badge p={p} t={t} />
            <span className="ps-status-text">
                <span className="ps-status-main">
                    <span className="ps-status-headline">{headline(p, t)}</span>
                    {p.availability && p.text && <span className="ps-status-message">{p.text}</span>}
                </span>
                {d && !compact && <span className="ps-status-detail">{d}</span>}
            </span>
        </span>
    );
}

export function CardView({ card, t }: { card: ProfileCard; t: ModuleTranslate }): JSX.Element | null {
    const fields = CARD_FIELDS.filter((f) => card[f]);
    if (!fields.length) return null;
    return (
        <dl className="ps-card" data-testid="profile-status-card">
            {fields.map((f) => (
                <div key={f} className="ps-card-row">
                    <dt>{t(`${P}${f}`)}</dt>
                    <dd>{f === "phone" ? <a href={`tel:${card.phone!.replace(/[^\d+]/g, "")}`}>{card.phone}</a> : card[f]}</dd>
                </div>
            ))}
        </dl>
    );
}

export function presentNow(info: ProfileInfo | undefined): Presentation | undefined {
    return present(info, Date.now());
}
