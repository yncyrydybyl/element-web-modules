/**
 * comic family enhancer (CONTRACT §5). Per-variant features:
 *   geocities:      hit counter + topic marquee (attributes for CSS)
 *   wordart:        room WordArt style by room hash, shimmer on room change, Klammi helper
 *   poster:         room WordArt style, topic marquee, Klammi (party lines)
 *   unreadable:     all of the above + WARNING overlay, PANIC button, sparkle cursor trail, endless hit counter,
 *                   click-to-start jingle, automatic hue-rotation fallback when the frame rate drops
 *   after-midnight: neon flicker on room change, sparkle trail (fine pointers, motion allowed)
 * Everything degrades with ctx.reducedMotion and is removed in unmount(). Never throws into Element.
 */
import type { Enhancer, EnhancerContext } from "../../src/types";

type Feature = "counter" | "topic" | "wordart" | "roomchange" | "klammi" | "warning" | "panic" | "sparkles" | "jingle" | "hueguard";

const FEATURES: Record<string, Feature[]> = {
    "comic-geocities": ["counter", "topic"],
    "comic-wordart": ["wordart", "roomchange", "klammi"],
    "comic-poster": ["wordart", "topic", "klammi"],
    "comic-unreadable": ["wordart", "topic", "counter", "klammi", "warning", "panic", "sparkles", "jingle", "hueguard"],
    "comic-after-midnight": ["roomchange", "sparkles"],
};

const KLAMMI_LINES: Record<string, string[]> = {
    "comic-wordart": [
        "It looks like you're writing a message. Would you like help?",
        "It looks like you're chatting. Would you like to insert some WordArt?",
    ],
    "comic-poster": ["It looks like you're having FUN!!! Would you like MORE exclamation marks?!!"],
    "comic-unreadable": [
        "It looks like you can't read this. Would you like help?",
        "It looks like you are trying to escape. The PANIC button is at the bottom!",
    ],
};

interface State {
    ctx: EnhancerContext;
    features: Set<Feature>;
    cleanups: (() => void)[];
    roomId: string | null;
    count: number;
}
let st: State | null = null;

function safe(fn: () => void): void {
    try {
        fn();
    } catch (e) {
        st?.ctx.log("comic enhancer error", e);
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

function currentRoomId(): string | null {
    const m = /#\/room\/([^/?]+)/.exec(window.location.hash);
    return m ? decodeURIComponent(m[1]) : null;
}

function roomTopic(roomId: string): string | null {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const peg = (window as any).mxMatrixClientPeg;
        const client = peg?.get?.() ?? peg?.safeGet?.();
        const room = client?.getRoom?.(roomId);
        const ev = room?.currentState?.getStateEvents?.("m.room.topic", "");
        const content = ev?.getContent?.();
        const t = typeof content?.topic === "string" ? content.topic : null;
        return t ? t.replace(/\s+/g, " ").slice(0, 160) : null;
    } catch {
        return null;
    }
}

function lsGet(k: string): string | null {
    try {
        return window.localStorage.getItem(k);
    } catch {
        return null;
    }
}
function lsSet(k: string, v: string): void {
    try {
        window.localStorage.setItem(k, v);
    } catch {
        /* private mode */
    }
}
function ssGet(k: string): string | null {
    try {
        return window.sessionStorage.getItem(k);
    } catch {
        return null;
    }
}
function ssSet(k: string, v: string): void {
    try {
        window.sessionStorage.setItem(k, v);
    } catch {
        /* ignore */
    }
}

function padCount(n: number): string {
    return String(n).padStart(6, "0");
}

/* ------------------------------------------------------------------ attributes on Element nodes */
function applyRoomAttributes(): void {
    if (!st) return;
    const { features } = st;
    const header = document.querySelector<HTMLElement>(".mx_RoomHeader");
    const body = document.querySelector<HTMLElement>(".mx_RoomView_body");
    if (features.has("counter") && header && st.roomId) {
        const v = padCount(st.count);
        if (header.getAttribute("data-ewt-count") !== v) header.setAttribute("data-ewt-count", v);
    }
    if (features.has("topic") && body && st.roomId) {
        const t = roomTopic(st.roomId);
        if (t) {
            if (body.getAttribute("data-ewt-topic") !== t) body.setAttribute("data-ewt-topic", t);
        } else if (body.hasAttribute("data-ewt-topic")) body.removeAttribute("data-ewt-topic");
    }
}

function onRoomChange(): void {
    if (!st) return;
    const id = currentRoomId();
    if (id === st.roomId) return;
    st.roomId = id;
    const html = document.documentElement;
    if (st.features.has("wordart")) {
        if (id) html.setAttribute("data-ewt-wordart", String((hash(id) % 6) + 1));
        else html.removeAttribute("data-ewt-wordart");
    }
    if (st.features.has("counter") && id) {
        const key = "ewt.comic.count." + id;
        const prev = Number(lsGet(key)) || 4000 + (hash(id) % 900);
        st.count = prev + 1;
        lsSet(key, String(st.count));
    }
    if (st.features.has("roomchange") && id && !st.ctx.reducedMotion) {
        html.classList.remove("ewt-roomchange");
        void html.offsetWidth;
        html.classList.add("ewt-roomchange");
        const t = window.setTimeout(() => html.classList.remove("ewt-roomchange"), 1300);
        st.cleanups.push(() => window.clearTimeout(t));
    }
    applyRoomAttributes();
}

/* ------------------------------------------------------------------ Klammi */
function showKlammi(): void {
    if (!st || st.ctx.root.querySelector(".ewt-klammi")) return;
    const lines = KLAMMI_LINES[st.ctx.variant.id] ?? KLAMMI_LINES["comic-wordart"];
    const wrap = document.createElement("div");
    wrap.className = "ewt-klammi";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", "Klammi the paperclip");
    const balloon = document.createElement("div");
    balloon.className = "ewt-klammi-balloon";
    const p = document.createElement("p");
    p.textContent = lines[Math.floor(Math.random() * lines.length)];
    const yes = document.createElement("button");
    yes.type = "button";
    yes.textContent = "Yes, please";
    const no = document.createElement("button");
    no.type = "button";
    no.textContent = "Don't show again";
    balloon.append(p, yes, no);
    const img = document.createElement("img");
    img.src = st.ctx.asset("assets/klammi.svg");
    img.alt = "";
    wrap.append(balloon, img);
    const close = (): void => wrap.remove();
    yes.addEventListener("click", () => {
        p.textContent = "Great! Just type your message and press Enter. You're doing amazing.";
        yes.remove();
        no.textContent = "Close";
        const t = window.setTimeout(close, 6000);
        st?.cleanups.push(() => window.clearTimeout(t));
    });
    no.addEventListener("click", () => {
        lsSet("ewt.comic.klammi.off." + (st?.ctx.variant.id ?? ""), "1");
        close();
    });
    st.ctx.root.appendChild(wrap);
    const t = window.setTimeout(close, 20000);
    st.cleanups.push(() => window.clearTimeout(t));
}

function setupKlammi(): void {
    if (!st) return;
    const id = st.ctx.variant.id;
    if (lsGet("ewt.comic.klammi.off." + id)) return;
    const onFocus = (e: FocusEvent): void => {
        const t = e.target as HTMLElement | null;
        if (!t?.closest?.(".mx_BasicMessageComposer_input, .mx_WysiwygComposer_Editor_content")) return;
        if (ssGet("ewt.comic.klammi." + id) && id !== "comic-unreadable") return;
        ssSet("ewt.comic.klammi." + id, "1");
        showKlammi();
    };
    document.addEventListener("focusin", onFocus);
    st.cleanups.push(() => document.removeEventListener("focusin", onFocus));
    if (id === "comic-unreadable") {
        const iv = window.setInterval(() => showKlammi(), 45000);
        st.cleanups.push(() => window.clearInterval(iv));
    }
}

/* ------------------------------------------------------------------ unreadable: warning + panic */
function safeTarget(): string {
    const prev = st?.ctx.previousTheme() ?? null;
    if (!prev || prev === "comic-unreadable") return "comic-casual-friday";
    return prev;
}

function showWarning(): void {
    if (!st || lsGet("ewt.comic.unreadable.accepted")) return;
    // automated screenshot/test runs (fresh profiles) skip it unless ?ewt_warning=1 asks for it
    if (navigator.webdriver && !/[?&]ewt_warning=1/.test(window.location.search)) return;
    const ctx = st.ctx;
    const ov = document.createElement("div");
    ov.className = "ewt-warning";
    ov.setAttribute("role", "alertdialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-labelledby", "ewt-warning-title");
    const box = document.createElement("div");
    box.className = "ewt-warning-box";
    const h = document.createElement("h2");
    h.id = "ewt-warning-title";
    h.textContent = "WARNING!!!";
    const p1 = document.createElement("p");
    p1.textContent =
        "This theme moves, wobbles and changes colour all the time. Readability is not a goal. " +
        "If you are sensitive to motion, choose “Take me back”.";
    const p2 = document.createElement("p");
    p2.textContent = ctx.reducedMotion
        ? "Your system asks for reduced motion, so the movement is switched off. The colours stay."
        : "There is a PANIC button at the bottom of the screen at all times.";
    const accept = document.createElement("button");
    accept.type = "button";
    accept.className = "ewt-accept";
    accept.textContent = "I ACCEPT";
    const back = document.createElement("button");
    back.type = "button";
    back.textContent = "Take me back to safety";
    box.append(h, p1, p2, accept, back);
    ov.append(box);
    accept.addEventListener("click", () => {
        lsSet("ewt.comic.unreadable.accepted", "1");
        ov.remove();
    });
    back.addEventListener("click", () => ctx.switchTheme(safeTarget()));
    const onKey = (e: KeyboardEvent): void => {
        if (e.key === "Escape" && ov.isConnected) ctx.switchTheme(safeTarget());
    };
    document.addEventListener("keydown", onKey, true);
    st.cleanups.push(() => document.removeEventListener("keydown", onKey, true));
    ctx.root.appendChild(ov);
    window.setTimeout(() => accept.focus(), 50);
}

function addPanic(): void {
    if (!st) return;
    const ctx = st.ctx;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ewt-panic";
    b.textContent = "PANIC! (back to normal)";
    b.title = "Switch to Comic Sans · Casual Friday";
    b.addEventListener("click", () => ctx.switchTheme("comic-casual-friday"));
    ctx.root.appendChild(b);
}

/* ------------------------------------------------------------------ sparkles */
function setupSparkles(): void {
    if (!st || st.ctx.reducedMotion) return;
    if (!window.matchMedia?.("(pointer: fine)").matches) return;
    const root = st.ctx.root;
    const rate = st.ctx.variant.id === "comic-unreadable" ? 35 : 70;
    let last = 0;
    let live = 0;
    const onMove = (e: PointerEvent): void => {
        const now = performance.now();
        if (now - last < rate || live > 18) return;
        last = now;
        const s = document.createElement("div");
        s.className = "ewt-sparkle";
        s.style.left = e.clientX + (Math.random() * 10 - 5) + "px";
        s.style.top = e.clientY + (Math.random() * 10 - 5) + "px";
        live++;
        const done = (): void => {
            live--;
            s.remove();
        };
        s.addEventListener("animationend", done, { once: true });
        window.setTimeout(() => s.isConnected && done(), 1500);
        root.appendChild(s);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    st.cleanups.push(() => window.removeEventListener("pointermove", onMove));
}

/* ------------------------------------------------------------------ jingle (self-composed, click to start) */
function addJingle(): void {
    if (!st) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ewt-panic ewt-jingle";
    b.style.left = "calc(50% + 150px)";
    b.style.background = "#000080";
    b.textContent = "♫ MIDI";
    b.title = "Play a tiny jingle";
    let actx: AudioContext | null = null;
    b.addEventListener("click", () => {
        safe(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const AC = window.AudioContext || (window as any).webkitAudioContext;
            if (!AC) return;
            actx?.close();
            actx = new AC();
            const notes = [523, 659, 784, 659, 523, 587, 698, 880, 784, 659, 523, 392, 523];
            const t0 = actx.currentTime + 0.05;
            notes.forEach((f, i) => {
                const o = actx!.createOscillator();
                const g = actx!.createGain();
                o.type = "square";
                o.frequency.value = f;
                g.gain.setValueAtTime(0.06, t0 + i * 0.16);
                g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.16 + 0.15);
                o.connect(g).connect(actx!.destination);
                o.start(t0 + i * 0.16);
                o.stop(t0 + i * 0.16 + 0.16);
            });
        });
    });
    st.cleanups.push(() => {
        void actx?.close();
        actx = null;
    });
    st.ctx.root.appendChild(b);
}

/* ------------------------------------------------------------------ hue-rotation guard (measures fps) */
function setupHueGuard(): void {
    if (!st || st.ctx.reducedMotion) return;
    const html = document.documentElement;
    let frames = 0;
    let start = 0;
    let raf = 0;
    const tick = (t: number): void => {
        if (!start) start = t;
        frames++;
        if (t - start < 4000) {
            raf = requestAnimationFrame(tick);
            return;
        }
        const fps = (frames * 1000) / (t - start);
        st?.ctx.log(`comic-unreadable: ${fps.toFixed(1)} fps with whole-app hue-rotate`);
        html.setAttribute("data-ewt-fps", fps.toFixed(0));
        if (fps < 30) {
            html.classList.add("ewt-no-hue");
            st?.ctx.log("comic-unreadable: fps < 30, hue rotation switched off");
        }
    };
    const delay = window.setTimeout(() => (raf = requestAnimationFrame(tick)), 3000);
    st.cleanups.push(() => {
        window.clearTimeout(delay);
        cancelAnimationFrame(raf);
        html.classList.remove("ewt-no-hue");
        html.removeAttribute("data-ewt-fps");
    });
}

/* ------------------------------------------------------------------ lifecycle */
function teardown(): void {
    if (!st) return;
    for (const c of st.cleanups.splice(0).reverse()) safe(c);
    const html = document.documentElement;
    html.removeAttribute("data-ewt-wordart");
    html.classList.remove("ewt-roomchange", "ewt-no-hue");
    document.querySelectorAll("[data-ewt-count]").forEach((n) => n.removeAttribute("data-ewt-count"));
    document.querySelectorAll("[data-ewt-topic]").forEach((n) => n.removeAttribute("data-ewt-topic"));
    st.ctx.root.querySelectorAll(".ewt-klammi, .ewt-warning, .ewt-panic, .ewt-sparkle").forEach((n) => n.remove());
    st = null;
}

const enhancer: Enhancer = {
    mount(ctx: EnhancerContext): void {
        safe(() => teardown());
        try {
            const features = new Set<Feature>(FEATURES[ctx.variant.id] ?? []);
            st = { ctx, features, cleanups: [], roomId: null, count: 0 };
            if (features.size === 0) return;

            if (features.has("counter") || features.has("topic") || features.has("wordart") || features.has("roomchange")) {
                const onHash = (): void => safe(onRoomChange);
                window.addEventListener("hashchange", onHash);
                st.cleanups.push(() => window.removeEventListener("hashchange", onHash));
                let pending = 0;
                const mo = new MutationObserver(() => {
                    if (pending) return;
                    pending = requestAnimationFrame(() => {
                        pending = 0;
                        safe(onRoomChange);
                        safe(applyRoomAttributes);
                    });
                });
                mo.observe(document.getElementById("matrixchat") ?? document.body, { childList: true, subtree: true });
                st.cleanups.push(() => {
                    mo.disconnect();
                    cancelAnimationFrame(pending);
                });
                safe(onRoomChange);
            }
            if (features.has("counter") && ctx.variant.id === "comic-unreadable" && !ctx.reducedMotion) {
                const iv = window.setInterval(() => {
                    if (!st) return;
                    st.count += 1 + Math.floor(Math.random() * 7);
                    safe(applyRoomAttributes);
                }, 900);
                st.cleanups.push(() => window.clearInterval(iv));
            }
            if (features.has("klammi")) safe(setupKlammi);
            if (features.has("panic")) safe(addPanic);
            if (features.has("jingle")) safe(addJingle);
            if (features.has("sparkles")) safe(setupSparkles);
            if (features.has("hueguard")) safe(setupHueGuard);
            if (features.has("warning")) safe(showWarning);
        } catch (e) {
            ctx.log("comic enhancer mount failed", e);
        }
    },
    unmount(): void {
        safe(() => teardown());
    },
};

export default enhancer;
