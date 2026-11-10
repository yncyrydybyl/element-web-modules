/**
 * The card on top of the snapshot (or Element's splash) that says, in plain words, what Element
 * is doing right now: each start-up step has its own little scene, the rooms fill up against
 * last time's count, every request to the server sends a dot down the line, and facts about the
 * account rotate underneath. Phrasing, facts, accent colour and the way rooms appear vary per start.
 */
import { P, type Translate } from "./i18n";
import { STEPS, type Probe, type Stage } from "./progress";
import type { Stats } from "./stats";

export const CARD_CLASS = "speed-start-card";
const C = CARD_CLASS;
/** How long a fact stays before the next one. */
export const FACT_MS = 4_500;
const MAX_CHIPS = 12;
const VARIANTS: Record<Stage, number> = { session: 2, storage: 2, keys: 2, rooms: 2, download: 2, waiting: 1, ready: 1 };

export interface CardOptions {
    t: Translate;
    language: string;
    stats: Stats | null;
    /** Room avatars (copies of Element's avatar elements) to show as the rooms come in. */
    avatars: Element[];
    /** Whether a click on a room can be replayed (a snapshot is drawn). */
    clickable: boolean;
    random?: () => number;
    now?: () => number;
}

export class ProgressCard {
    public readonly el: HTMLElement;
    private readonly title: HTMLElement;
    private readonly text: HTMLElement;
    private readonly count: HTMLElement;
    private readonly fill: HTMLElement;
    private readonly fact: HTMLElement;
    private readonly scene: HTMLElement;
    private readonly pulses: HTMLElement;
    private readonly shelf: HTMLElement;
    private readonly steps: Map<string, HTMLElement> = new Map();
    private readonly variant: Record<Stage, number>;
    private readonly facts: string[];
    private factIndex = 0;
    private factTimer?: number;
    private stage?: Stage;
    private shown = 0;
    private readonly random: () => number;

    public constructor(
        private readonly opts: CardOptions,
        doc: Document = document,
    ) {
        this.random = opts.random ?? Math.random;
        const pick = (n: number): number => 1 + Math.floor(this.random() * n);
        this.variant = Object.fromEntries(Object.entries(VARIANTS).map(([s, n]) => [s, pick(n)])) as Record<Stage, number>;

        const el = doc.createElement("div");
        el.className = C;
        el.setAttribute("role", "status");
        el.setAttribute("data-testid", "speed-start-card");
        // The accent comes from Compound's decorative palette, a different one on each start.
        el.style.setProperty("--ss-accent", `var(--cpd-color-text-decorative-${pick(6)}, var(--cpd-color-text-action-accent, #0b7a52))`);
        el.classList.add(`${C}_${this.random() < 0.5 ? "pop" : "fly"}`);
        el.innerHTML = `
            <div class="${C}_scene">
                <div class="${C}_node ${C}_device">${DEVICE_ICON}<span></span></div>
                <div class="${C}_track"><i></i><i></i><i></i><div class="${C}_lock">${LOCK_ICON}</div><div class="${C}_pulses"></div></div>
                <div class="${C}_node ${C}_server">${SERVER_ICON}<span></span></div>
            </div>
            <div class="${C}_shelf"></div>
            <div class="${C}_title"></div>
            <div class="${C}_text"></div>
            <div class="${C}_meter"><div class="${C}_fill"></div></div>
            <div class="${C}_row"><ol class="${C}_steps"></ol><span class="${C}_count"></span></div>
            <div class="${C}_fact"></div>`;
        const q = (name: string): HTMLElement => el.querySelector<HTMLElement>(`.${C}_${name}`)!;
        this.el = el;
        this.scene = q("scene");
        this.title = q("title");
        this.text = q("text");
        this.count = q("count");
        this.fill = q("fill");
        this.fact = q("fact");
        this.pulses = q("pulses");
        this.shelf = q("shelf");
        q("device").querySelector("span")!.textContent = opts.t(`${P}your_device`);
        q("server").querySelector("span")!.textContent = opts.stats?.server ?? opts.t(`${P}your_server`);
        const list = q("steps");
        for (const step of STEPS) {
            const li = doc.createElement("li");
            li.textContent = opts.t(`${P}step_${step}`);
            list.appendChild(li);
            this.steps.set(step, li);
        }
        this.buildShelf(doc);
        const { own, general } = buildFacts(opts);
        this.facts = interleave(shuffle(own, this.random), shuffle(general, this.random));
        this.showFact();
    }

    /** Starts rotating the facts. */
    public start(): void {
        if (this.factTimer === undefined && this.facts.length > 1) {
            this.factTimer = window.setInterval(() => this.showFact(), FACT_MS);
        }
    }

    public dispose(): void {
        if (this.factTimer !== undefined) clearInterval(this.factTimer);
        this.factTimer = undefined;
    }

    public update(probe: Probe): void {
        const { t } = this.opts;
        const server = probe.server ?? this.opts.stats?.server ?? "";
        if (probe.server) this.el.querySelector(`.${C}_server span`)!.textContent = probe.server;
        if (probe.stage !== this.stage) {
            this.stage = probe.stage;
            this.scene.setAttribute("data-stage", probe.stage);
            this.el.setAttribute("data-stage", probe.stage);
            const v = this.variant[probe.stage];
            this.title.textContent = t(`${P}${probe.stage}_title_${v}`, { server });
            this.text.textContent = t(`${P}${probe.stage}_text_${v}`, { server });
            const current = stepOf(probe.stage);
            STEPS.forEach((step, i) => {
                const li = this.steps.get(step)!;
                li.className = probe.stage === "ready" || i < current ? `${C}_done` : i === current ? `${C}_now` : "";
            });
        }

        const total = this.opts.stats?.rooms ? this.opts.stats.rooms + this.opts.stats.spaces : 0;
        const inRooms = probe.stage === "rooms" || probe.stage === "download";
        const done = total ? Math.min(probe.rooms, total) : probe.rooms;
        if (inRooms && probe.rooms > 0) {
            this.count.textContent = total
                ? t(`${P}rooms_count`, { done: this.num(done), total: this.num(total) })
                : t(`${P}rooms_count_open_${probe.rooms === 1 ? "one" : "other"}`, { done: this.num(probe.rooms) });
        } else {
            this.count.textContent = "";
        }

        // Each step is a quarter of the bar; the rooms step fills with the rooms, when we know how many to expect.
        const fraction = probe.stage === "ready" ? 1 : (stepOf(probe.stage) + (inRooms && total ? done / total : 0.35)) / STEPS.length;
        this.fill.style.transform = `scaleX(${fraction.toFixed(3)})`;

        // Rooms appear on the shelf as they come in (or all of them once Element is ready).
        const chips = this.shelf.children.length;
        const want = probe.stage === "ready" ? chips : inRooms ? (total ? Math.round((done / total) * chips) : Math.min(chips, probe.rooms)) : 0;
        for (let i = this.shown; i < want; i++) this.shelf.children[i].classList.add(`${C}_in`);
        this.shown = Math.max(this.shown, want);
    }

    /** A request to the server finished: a dot runs from the server to this device. */
    public pulse(): void {
        if (this.pulses.childElementCount > 6) return;
        const dot = this.el.ownerDocument.createElement("i");
        dot.addEventListener("animationend", () => dot.remove());
        this.pulses.appendChild(dot);
        // Without animations (reduced motion, tests) there is no animationend.
        window.setTimeout(() => dot.remove(), 1_500);
        this.el.querySelector(`.${C}_server`)!.classList.remove(`${C}_blink`);
        void (this.el as HTMLElement).offsetWidth;
        this.el.querySelector(`.${C}_server`)!.classList.add(`${C}_blink`);
    }

    private buildShelf(doc: Document): void {
        const total = this.opts.stats ? this.opts.stats.rooms + this.opts.stats.spaces : MAX_CHIPS;
        const n = Math.max(1, Math.min(MAX_CHIPS, total || MAX_CHIPS));
        for (let i = 0; i < n; i++) {
            const chip = doc.createElement("span");
            const avatar = this.opts.avatars[i];
            if (avatar) {
                const copy = avatar.cloneNode(true) as HTMLElement;
                copy.style.setProperty("--cpd-avatar-size", "26px");
                chip.appendChild(copy);
            } else {
                chip.style.background = `var(--cpd-color-text-decorative-${1 + (i % 6)}, #888)`;
            }
            chip.style.setProperty("--i", String(i));
            this.shelf.appendChild(chip);
        }
    }

    private showFact(): void {
        if (!this.facts.length) return;
        const text = this.facts[this.factIndex % this.facts.length];
        this.factIndex++;
        this.fact.classList.remove(`${C}_fresh`);
        void this.fact.offsetWidth;
        this.fact.textContent = text;
        this.fact.classList.add(`${C}_fresh`);
    }

    private num(n: number): string {
        try {
            return new Intl.NumberFormat(this.opts.language).format(n);
        } catch {
            return String(n);
        }
    }
}

function stepOf(stage: Stage): number {
    switch (stage) {
        case "session":
            return 0;
        case "storage":
            return 1;
        case "keys":
            return 2;
        default:
            return 3;
    }
}

/** Facts about this account from last time first, then general ones about Element and Matrix. */
export function buildFacts({ t, language, stats, clickable, now = Date.now }: CardOptions): { own: string[]; general: string[] } {
    const n = (v: number): string => {
        try {
            return new Intl.NumberFormat(language).format(v);
        } catch {
            return String(v);
        }
    };
    const facts: string[] = [];
    const general: string[] = [];
    if (stats) {
        const rooms = n(stats.rooms);
        if (stats.spaces > 0 && stats.rooms > 1) facts.push(t(`${P}fact_rooms_spaces`, { rooms, spaces: n(stats.spaces) }));
        else if (stats.rooms > 0) facts.push(t(`${P}fact_rooms_${stats.rooms === 1 ? "one" : "other"}`, { rooms }));
        if (stats.people > 1) facts.push(t(`${P}fact_people`, { people: n(stats.people) }));
        if (stats.servers > 1) facts.push(t(`${P}fact_servers`, { servers: n(stats.servers) }));
        if (stats.encrypted > 1) facts.push(t(`${P}fact_encrypted`, { encrypted: n(stats.encrypted) }));
        if (stats.dms > 1) facts.push(t(`${P}fact_dms`, { dms: n(stats.dms) }));
        if (stats.unread > 0) facts.push(t(`${P}fact_unread_${stats.unread === 1 ? "one" : "other"}`, { unread: n(stats.unread) }));
        const ago = relative(now() - stats.savedAt, language);
        if (ago) facts.push(t(`${P}fact_last_seen`, { ago }));
        facts.push(t(`${P}fact_home`, { server: stats.server }));
    }
    for (const key of ["open", "copy", "decrypt", "shield", "ctrl_k"]) general.push(t(`${P}fact_${key}`));
    if (clickable) general.push(t(`${P}fact_click`));
    return { own: facts, general };
}

/** "3 hours ago" in the user's language; nothing for under a minute. */
export function relative(ms: number, language: string): string {
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ["day", 86_400_000],
        ["hour", 3_600_000],
        ["minute", 60_000],
    ];
    for (const [unit, size] of units) {
        if (ms >= size) {
            try {
                return new Intl.RelativeTimeFormat(language, { numeric: "auto" }).format(-Math.floor(ms / size), unit);
            } catch {
                return "";
            }
        }
    }
    return "";
}

/** One about the account, one general, and so on: the account's own facts come first. */
function interleave(own: string[], general: string[]): string[] {
    const out: string[] = [];
    for (let i = 0; i < Math.max(own.length, general.length); i++) {
        if (i < own.length) out.push(own[i]);
        if (i < general.length) out.push(general[i]);
    }
    return out;
}

function shuffle(facts: string[], random: () => number): string[] {
    const a = [...facts];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const DEVICE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19.5h20"/><g class="${C}_bars"><path d="M8 9h8"/><path d="M8 12h5"/></g></svg>`;
const SERVER_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="7" rx="2"/><rect x="4" y="13" width="16" height="7" rx="2"/><path d="M8 7.5h.01M8 16.5h.01"/></svg>`;
const LOCK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="${C}_shackle" d="M8 11V8a4 4 0 0 1 8 0v3"/><rect x="5.5" y="11" width="13" height="9" rx="2"/></svg>`;

export const cardCss = `
.${C} {
    --ss-accent: var(--cpd-color-text-action-accent, #0b7a52);
    position: absolute;
    width: min(380px, calc(100vw - 32px));
    box-sizing: border-box;
    padding: 20px 22px 16px;
    border-radius: 16px;
    background: var(--cpd-color-bg-canvas-default, #fff);
    border: 1px solid var(--cpd-color-border-interactive-secondary, rgba(0, 0, 0, 0.1));
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06);
    color: var(--cpd-color-text-primary, #1b1d22);
    font: var(--cpd-font-body-md-regular, 15px/1.4 Inter, system-ui, sans-serif);
    cursor: default;
    animation: ${C}-enter 420ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}
.${C} svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }

.${C}_scene { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.${C}_node { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 72px; color: var(--cpd-color-icon-secondary, #656d77); transition: color 300ms; }
.${C}_node span { font-size: 11px; line-height: 1.2; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--cpd-color-text-secondary, #656d77); }
.${C}_track { position: relative; flex: 1; height: 26px; }
.${C}_track::before { content: ""; position: absolute; left: 0; right: 0; top: 12px; border-top: 2px dotted var(--cpd-color-border-interactive-primary, #c0c5cc); }
.${C}_track > i, .${C}_pulses > i { position: absolute; top: 9px; left: 0; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: var(--ss-accent); opacity: 0; }
.${C}_pulses > i { animation: ${C}-toDevice 900ms ease-in both; }
.${C}_lock { position: absolute; left: 50%; top: -1px; margin-left: -13px; color: var(--cpd-color-icon-tertiary, #9aa0a8); opacity: 0; transform: scale(0.6); transition: opacity 300ms, transform 300ms, color 300ms; background: var(--cpd-color-bg-canvas-default, #fff); border-radius: 50%; }
.${C}_shackle { transition: transform 400ms cubic-bezier(0.3, 1.6, 0.5, 1); transform-origin: 16px 11px; }
.${C}_bars path { opacity: 0.25; }

/* session: the device looks for its saved login */
.${C}_scene[data-stage="session"] .${C}_device { color: var(--ss-accent); animation: ${C}-breathe 1.4s ease-in-out infinite; }
/* storage: the device reads its copy, line by line */
.${C}_scene[data-stage="storage"] .${C}_device { color: var(--ss-accent); }
.${C}_scene[data-stage="storage"] .${C}_bars path { animation: ${C}-read 900ms ease-in-out infinite; }
.${C}_scene[data-stage="storage"] .${C}_bars path + path { animation-delay: 300ms; }
/* keys: a lock sits on the line and wiggles until it opens */
.${C}_scene[data-stage="keys"] .${C}_lock { opacity: 1; transform: scale(1); color: var(--ss-accent); animation: ${C}-wiggle 1.2s ease-in-out infinite; }
.${C}_scene[data-stage="rooms"] .${C}_lock,
.${C}_scene[data-stage="download"] .${C}_lock,
.${C}_scene[data-stage="ready"] .${C}_lock { opacity: 1; transform: scale(0.8); color: var(--cpd-color-icon-success-primary, #0b7a52); }
.${C}_scene[data-stage="rooms"] .${C}_shackle,
.${C}_scene[data-stage="download"] .${C}_shackle,
.${C}_scene[data-stage="ready"] .${C}_shackle { transform: translateY(-3px) rotate(-28deg); }
/* download: a steady stream from the server */
.${C}_scene[data-stage="download"] .${C}_server, .${C}_scene[data-stage="waiting"] .${C}_server { color: var(--ss-accent); }
.${C}_scene[data-stage="download"] .${C}_track > i { animation: ${C}-toDevice 1.2s linear infinite; }
.${C}_scene[data-stage="download"] .${C}_track > i:nth-child(2) { animation-delay: 400ms; }
.${C}_scene[data-stage="download"] .${C}_track > i:nth-child(3) { animation-delay: 800ms; }
/* waiting: the device keeps calling */
.${C}_scene[data-stage="waiting"] .${C}_track > i { animation: ${C}-toServer 1.6s ease-in-out infinite; background: var(--cpd-color-icon-secondary, #656d77); }
.${C}_server.${C}_blink { animation: ${C}-blink 500ms ease-out; }

.${C}_shelf { display: flex; flex-wrap: wrap; gap: 6px; min-height: 26px; margin-bottom: 12px; }
.${C}_shelf > span { width: 26px; height: 26px; border-radius: 50%; overflow: hidden; opacity: 0.15; transform: scale(0.7); transition: opacity 260ms, transform 360ms cubic-bezier(0.2, 1.4, 0.4, 1); transition-delay: calc(var(--i) * 25ms); }
.${C}_shelf > span > * { width: 26px; height: 26px; }
.${C}_shelf > span img { width: 100%; height: 100%; object-fit: cover; display: block; }
.${C}_fly .${C}_shelf > span { transform: translate(-40px, -30px) scale(0.3); }
.${C}_shelf > span.${C}_in { opacity: 1; transform: none; }

.${C}_title { font: var(--cpd-font-heading-sm-semibold, 600 18px/1.3 Inter, system-ui, sans-serif); margin-bottom: 4px; }
.${C}_text { color: var(--cpd-color-text-secondary, #656d77); font-size: 14px; min-height: 2.8em; }
.${C}_meter { height: 4px; border-radius: 2px; margin: 12px 0 8px; background: var(--cpd-color-bg-subtle-primary, #e1e6ec); overflow: hidden; }
.${C}_fill { height: 100%; background: var(--ss-accent); transform-origin: left; transform: scaleX(0.05); transition: transform 400ms ease-out; }
.${C}_row { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; color: var(--cpd-color-text-secondary, #656d77); }
.${C}_steps { display: flex; gap: 10px; margin: 0; padding: 0; list-style: none; }
.${C}_steps li { display: flex; align-items: center; gap: 4px; opacity: 0.55; transition: opacity 300ms; }
.${C}_steps li::before { content: ""; width: 7px; height: 7px; border-radius: 50%; border: 1.5px solid currentColor; box-sizing: border-box; }
.${C}_steps li.${C}_now { opacity: 1; color: var(--cpd-color-text-primary, #1b1d22); }
.${C}_steps li.${C}_now::before { border-color: var(--ss-accent); animation: ${C}-breathe 1.2s ease-in-out infinite; }
.${C}_steps li.${C}_done { opacity: 1; }
.${C}_steps li.${C}_done::before { background: var(--ss-accent); border-color: var(--ss-accent); }
.${C}_count { font-variant-numeric: tabular-nums; white-space: nowrap; }
.${C}_fact { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--cpd-color-border-disabled, #e8eaed); font-size: 13px; color: var(--cpd-color-text-secondary, #656d77); min-height: 2.8em; }
.${C}_fact.${C}_fresh { animation: ${C}-fact 500ms ease-out; }

@keyframes ${C}-enter { from { opacity: 0; transform: translateY(12px) scale(0.97); } }
@keyframes ${C}-breathe { 50% { transform: scale(1.12); opacity: 0.75; } }
@keyframes ${C}-read { 50% { opacity: 1; } }
@keyframes ${C}-wiggle { 0%, 60%, 100% { transform: rotate(0); } 70% { transform: rotate(-10deg); } 80% { transform: rotate(8deg); } 90% { transform: rotate(-4deg); } }
@keyframes ${C}-toDevice { 0% { left: 100%; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { left: 0; opacity: 0; } }
@keyframes ${C}-toServer { 0% { left: 0; opacity: 0; } 20% { opacity: 0.8; } 70% { opacity: 0.8; } 100% { left: 70%; opacity: 0; } }
@keyframes ${C}-blink { 30% { color: var(--ss-accent); transform: scale(1.08); } }
@keyframes ${C}-fact { from { opacity: 0; transform: translateY(4px); } }
@media (prefers-reduced-motion: reduce) {
    .${C}, .${C} * { animation: none !important; transition: none !important; }
    .${C}_pulses { display: none; }
}
`;
