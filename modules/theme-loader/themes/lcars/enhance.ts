/*
 * LCARS family enhancer (CONTRACT §5). Adds everything CSS cannot:
 *  - deterministic LCARS codes ("03-1174") on room pills, space blocks and the room header (data-lc-code),
 *  - a stardate readout in the header bar,
 *  - a small data-cascade / readout block in the header band (decorative, aria-hidden),
 *  - an AUDIO toggle pill and synthesized WebAudio chirps (OFF by default, opt-in, nothing shipped),
 *  - daylight: night phase disables audio + cascade.
 * Never throws into Element; unmount() removes every attribute, node, observer and timer.
 */
import type { EnhancerContext, Enhancer } from "../../loader/src/types";

interface Cfg {
    year: number; // in-universe year for the stardate
    cascade: "digits" | "readout" | "keypad" | null;
    chirp: "tng" | "klaxon" | "boop" | "soft";
    jokes?: string[];
    minimal?: boolean; // only the shell guard (lcars-usable)
}

const CFG: Record<string, Cfg> = {
    "lcars-tng": { year: 2369, cascade: "digits", chirp: "tng" },
    "lcars-voyager": { year: 2375, cascade: "readout", chirp: "tng" },
    "lcars-picard": { year: 2401, cascade: "keypad", chirp: "soft" },
    "lcars-red-alert": { year: 2369, cascade: "digits", chirp: "klaxon" },
    "lcars-lower-decks": {
        year: 2380,
        cascade: "digits",
        chirp: "boop",
        jokes: ["DO NOT TOUCH", "PROBABLY FINE", "ENSIGN USE ONLY", "REPLICATOR: SNACKS", "WARP CORE · DON'T", "SPOT", "NOPE"],
    },
    "lcars-daylight": { year: 2369, cascade: "digits", chirp: "tng" },
    "lcars-usable": { year: 2369, cascade: null, chirp: "soft", minimal: true },
};

const AUDIO_KEY = "tl.lcars.audio";
const SHIFT: Record<string, string> = { day: "ALPHA SHIFT", evening: "BETA SHIFT · REDUCED LIGHTING", night: "GAMMA SHIFT · NIGHT CONDITION" };
const ATTR = "data-lc-code";

let ctx: EnhancerContext | null = null;
let cfg: Cfg = CFG["lcars-tng"];
let phase: string | null = null;
let observer: MutationObserver | null = null;
let timers: number[] = [];
let raf = 0;
let overlay: HTMLElement | null = null;
let cascadeEl: HTMLElement | null = null;
let audioBtn: HTMLButtonElement | null = null;
let audioCtx: AudioContext | null = null;
let onPointer: ((e: PointerEvent) => void) | null = null;
// scrollIntoView() inside the timeline can scroll the document root (overflow on the viewport can't be
// "clip"), which pushes the whole LCARS frame off screen. Keep the root pinned.
const onRootScroll = (): void => {
    const se = document.scrollingElement;
    if (se && se.scrollTop !== 0) se.scrollTop = 0;
};
const stamped = new Set<Element>();
let lastHighlights = new Set<string>();

function safe<T>(fn: () => T): T | undefined {
    try {
        return fn();
    } catch (e) {
        ctx?.log("lcars enhancer error", e);
        return undefined;
    }
}

function hash(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function code(seed: string): string {
    const h = hash(seed);
    if (cfg.jokes && h % 5 === 0) return cfg.jokes[h % cfg.jokes.length];
    const a = String((h % 97) + 1).padStart(2, "0");
    const b = String(Math.floor(h / 97) % 10000).padStart(4, "0");
    return `${a}-${b}`;
}

function stardate(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1).getTime();
    const end = new Date(now.getFullYear() + 1, 0, 1).getTime();
    const frac = (now.getTime() - start) / (end - start);
    const sd = (cfg.year - 2323) * 1000 + frac * 1000;
    return sd.toFixed(1);
}

function setAttr(el: Element, value: string): void {
    if (el.getAttribute(ATTR) !== value) el.setAttribute(ATTR, value);
    stamped.add(el);
}

function roomIdFromHash(): string {
    const m = /#\/room\/([^/?]+)/.exec(location.hash);
    return m ? decodeURIComponent(m[1]) : location.hash;
}

function stamp(): void {
    raf = 0;
    safe(() => {
        document.querySelectorAll(".mx_RoomListItemView").forEach((el) => {
            const label = el.getAttribute("aria-label") || "";
            // "Open room <name>[ with N unread]" – strip the unread suffix so the code is stable
            const name = label.replace(/^Open room /, "").replace(/ with \d+ unread.*$/, "");
            setAttr(el, code("room:" + name));
        });
        document.querySelectorAll(".mx_SpacePanel .mx_SpaceButton").forEach((el) => {
            const short = String(hash("space:" + (el.getAttribute("aria-label") || "")) % 1000).padStart(3, "0");
            setAttr(el, short);
        });
        const header = document.querySelector(".mx_RoomHeader");
        const shift = phase ? ` · ${SHIFT[phase] ?? phase.toUpperCase()}` : "";
        if (header) setAttr(header, `${code("hdr:" + roomIdFromHash())} · STARDATE ${stardate()}${shift}`);
        positionCascade();
        if (cfg.chirp === "klaxon") checkHighlights();
    });
}

function schedule(): void {
    if (!raf) raf = requestAnimationFrame(stamp);
}

/* ---------- cascade / readout block in the header band ---------- */
function digits(n: number): string {
    let s = "";
    for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
    return s;
}

function buildCascade(): void {
    if (!overlay || !cfg.cascade) return;
    cascadeEl = document.createElement("div");
    cascadeEl.className = "lc-cascade";
    cascadeEl.setAttribute("aria-hidden", "true");
    overlay.appendChild(cascadeEl);
    fillCascade();
}

function fillCascade(): void {
    if (!cascadeEl) return;
    const rows: string[] = [];
    if (cfg.cascade === "readout") {
        const labels = ["DECRYPTION KEY", "SCAN PATTERN", "SIGNAL DECAY"];
        labels.forEach((l, i) => rows.push(`<span class="lc-r lc-r${i}"><b>${l}</b><i></i>${digits(2)} ${digits(6)} ${digits(2)}</span>`));
    } else if (cfg.cascade === "keypad") {
        rows.push(`<span class="lc-r lc-r0">${digits(2)}-${digits(4)} &nbsp; ${digits(3)}</span>`);
        rows.push(`<span class="lc-r lc-r1">LCARS ${digits(5)} &nbsp; <em>■</em> ${digits(2)}</span>`);
        rows.push(`<span class="lc-r lc-r2">${digits(1)}${digits(1)} ${digits(4)} ${digits(2)}</span>`);
    } else {
        for (let i = 0; i < 3; i++) {
            const cells = [digits(2), digits(3), digits(3), digits(2), digits(2), digits(4)];
            rows.push(`<span class="lc-r lc-r${i}">${cells.map((c, j) => `<em class="c${(i + j) % 4}">${c}</em>`).join(" ")}</span>`);
        }
    }
    cascadeEl.innerHTML = rows.join("");
}

function positionCascade(): void {
    if (!cascadeEl) return;
    const header = document.querySelector(".mx_RoomHeader") as HTMLElement | null;
    const narrow = window.innerWidth < 900;
    const night = phase === "night";
    if (!header || narrow || night) {
        cascadeEl.style.display = "none";
        return;
    }
    const hr = header.getBoundingClientRect();
    const avatar = header.querySelector(":scope > [class*='_avatar_']") as HTMLElement | null;
    const heading = header.querySelector(".mx_RoomHeader_heading") as HTMLElement | null;
    const left = (avatar ? avatar.getBoundingClientRect().right : hr.left) + 14;
    // measure the real text width of the right-aligned heading
    let textLeft = hr.right;
    if (heading) {
        const range = document.createRange();
        range.selectNodeContents(heading);
        const r = range.getBoundingClientRect();
        if (r.width) textLeft = r.left;
    }
    const width = cfg.cascade === "readout" ? 280 : 210;
    if (textLeft - left < width + 24) {
        cascadeEl.style.display = "none";
        return;
    }
    Object.assign(cascadeEl.style, { display: "block", left: `${left}px`, top: `${hr.top + 4}px`, width: `${width}px` });
}

/* ---------- audio (opt-in, synthesized) ---------- */
function audioOn(): boolean {
    try {
        return localStorage.getItem(AUDIO_KEY) === "1" && phase !== "night";
    } catch {
        return false;
    }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, freqEnd?: number): void {
    if (!audioCtx) return;
    const t = audioCtx.currentTime + start;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.linearRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
}

function chirp(kind: Cfg["chirp"] = cfg.chirp): void {
    if (!audioOn()) return;
    safe(() => {
        audioCtx ??= new AudioContext();
        if (audioCtx.state === "suspended") void audioCtx.resume();
        if (kind === "tng") {
            tone(1400, 0, 0.045, "sine", 0.08);
            tone(1800, 0.05, 0.045, "sine", 0.08);
        } else if (kind === "soft") {
            tone(2200, 0, 0.03, "sine", 0.04);
        } else if (kind === "boop") {
            tone(520, 0, 0.09, "triangle", 0.12, 380);
        } else {
            tone(1200, 0, 0.05, "square", 0.04);
        }
    });
}

function klaxon(): void {
    if (!audioOn()) return;
    safe(() => {
        audioCtx ??= new AudioContext();
        tone(600, 0, 0.45, "sawtooth", 0.05, 900);
        tone(600, 0.5, 0.45, "sawtooth", 0.05, 900);
    });
}

function checkHighlights(): void {
    const now = new Set<string>();
    document.querySelectorAll('.mx_EventTile[class*="_stateHighlighted_"]').forEach((t) => {
        const id = t.getAttribute("data-event-id");
        if (id) now.add(id);
    });
    const fresh = [...now].some((id) => !lastHighlights.has(id));
    if (fresh && lastHighlights.size) klaxon();
    lastHighlights = now;
}

function renderAudioBtn(): void {
    if (!audioBtn) return;
    const on = audioOn();
    audioBtn.textContent = on ? "AUDIO 01" : "AUDIO 00";
    audioBtn.setAttribute("aria-pressed", on ? "true" : "false");
    audioBtn.style.display = phase === "night" || window.innerWidth < 800 ? "none" : "";
}

function buildAudioBtn(): void {
    if (!overlay) return;
    audioBtn = document.createElement("button");
    audioBtn.type = "button";
    audioBtn.className = "lc-audio";
    audioBtn.title = "LCARS interface sounds (synthesized)";
    audioBtn.setAttribute("aria-label", "Toggle LCARS interface sounds");
    audioBtn.addEventListener("click", () => {
        safe(() => {
            const next = !audioOn();
            try {
                localStorage.setItem(AUDIO_KEY, next ? "1" : "0");
            } catch {
                /* storage blocked: stays off */
            }
            renderAudioBtn();
            if (next) chirp();
        });
    });
    overlay.appendChild(audioBtn);
    renderAudioBtn();
}

const STYLE = `
.lc-overlay { position: absolute; inset: 0; pointer-events: none; font-family: "Antonio", "Arial Narrow", sans-serif; }
.lc-cascade { position: fixed; display: none; font-size: 12px; line-height: 14px; letter-spacing: .08em; color: var(--lc-c4, #9999cc); white-space: nowrap; overflow: hidden; }
.lc-cascade .lc-r { display: block; }
.lc-cascade em { font-style: normal; }
.lc-cascade .c0 { color: var(--lc-c1); } .lc-cascade .c1 { color: var(--lc-c2); } .lc-cascade .c2 { color: var(--lc-c4); } .lc-cascade .c3 { color: var(--lc-c6); }
.lc-cascade b { display: inline-block; width: 110px; font-weight: 400; color: var(--lc-c7); }
.lc-cascade .lc-r1 b { color: var(--lc-c2); } .lc-cascade .lc-r2 b { color: var(--lc-c3); }
.lc-cascade i { display: inline-block; width: 22px; height: 10px; margin: 0 8px; border-radius: 999px; background: var(--lc-c7); vertical-align: middle; }
.lc-cascade .lc-r1 i { background: var(--lc-c2); } .lc-cascade .lc-r2 i { background: var(--lc-c4); }
html[data-tl-theme="lcars-picard"] .lc-cascade { color: var(--lc-muted); }
html[data-tl-theme="lcars-picard"] .lc-cascade em { color: var(--lc-c5); }
.lc-audio { position: fixed; left: 10px; top: calc(var(--lc-band, 74px) + var(--lc-gap, 6px) + 8px); pointer-events: auto; height: 18px; padding: 0 8px; border: 0; border-radius: 999px;
  background: #000; color: var(--lc-muted, #9999cc); font: 500 12px/18px "Antonio", "Arial Narrow", sans-serif; letter-spacing: .08em; cursor: pointer; }
.lc-audio[aria-pressed="true"] { color: var(--lc-accent, #ff9900); }
.lc-audio:focus-visible { outline: 3px solid var(--lc-accent, #ff9900); outline-offset: 2px; }
.mx_RoomListItemView[${ATTR}]::before { content: attr(${ATTR}); align-self: flex-end; padding: 0 0 5px; white-space: nowrap;
  font: 500 12px/1 "Antonio", "Arial Narrow", sans-serif; letter-spacing: .06em; color: var(--lc-on, #000); opacity: .72; }
html[data-tl-theme="lcars-usable"] .mx_RoomListItemView[${ATTR}]::before { content: none; }
html[data-tl-theme="lcars-picard"] .mx_RoomListItemView[${ATTR}]::before { color: var(--lc-muted); }
html[data-tl-theme="lcars-picard"] .mx_RoomListItemView_selected[${ATTR}]::before { color: #000; }
@media (max-width: 800px) { .mx_RoomListItemView[${ATTR}]::before { content: none; } .lc-audio { display: none !important; } }
`;

const enhancer: Enhancer = {
    mount(c: EnhancerContext): void {
        safe(() => {
            this.unmount();
            ctx = c;
            cfg = CFG[c.variant.id] ?? CFG["lcars-tng"];
            phase = c.phase;
            window.addEventListener("scroll", onRootScroll, { passive: true });
            onRootScroll();
            if (cfg.minimal) return;
            overlay = document.createElement("div");
            overlay.className = "lc-overlay";
            const style = document.createElement("style");
            style.textContent = STYLE;
            overlay.appendChild(style);
            c.root.appendChild(overlay);

            buildCascade();
            buildAudioBtn();

            observer = new MutationObserver(schedule);
            observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-label", "class"] });
            window.addEventListener("hashchange", schedule);
            window.addEventListener("resize", schedule);
            schedule();

            // stardate ticks every minute; cascade steps every 400 ms (not with reduced motion)
            timers.push(window.setInterval(schedule, 60000));
            if (cascadeEl && !c.reducedMotion) {
                timers.push(
                    window.setInterval(() => {
                        if (!document.hidden && phase !== "night") safe(fillCascade);
                    }, 400),
                );
            }

            onPointer = (e: PointerEvent): void => {
                const t = e.target as Element | null;
                if (t && t.closest && t.closest("button, [role='button'], [role='option'], .mx_AccessibleButton") && !t.closest(".lc-audio")) chirp();
            };
            document.addEventListener("pointerdown", onPointer, true);
        });
    },
    onPhase(p: string): void {
        safe(() => {
            phase = p;
            renderAudioBtn();
            schedule();
            positionCascade();
        });
    },
    unmount(): void {
        safe(() => {
            window.removeEventListener("scroll", onRootScroll);
            observer?.disconnect();
            observer = null;
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
            timers.forEach((t) => clearInterval(t));
            timers = [];
            window.removeEventListener("hashchange", schedule);
            window.removeEventListener("resize", schedule);
            if (onPointer) document.removeEventListener("pointerdown", onPointer, true);
            onPointer = null;
            stamped.forEach((el) => el.removeAttribute(ATTR));
            stamped.clear();
            document.querySelectorAll(`[${ATTR}]`).forEach((el) => el.removeAttribute(ATTR));
            overlay?.remove();
            overlay = cascadeEl = audioBtn = null;
            if (audioCtx) void audioCtx.close().catch(() => undefined);
            audioCtx = null;
            lastHighlights = new Set();
            ctx = null;
        });
    },
};

export default enhancer;
