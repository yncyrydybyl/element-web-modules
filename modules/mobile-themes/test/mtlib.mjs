// Shared helpers for the mobile-themes tests (shell.mjs, run.mjs): device profiles, module interception, logged-in
// launch from the harness session pool (exclusive slot, never a new login) and restoring the slot's device settings.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const H = await import(path.join(HERE, "../../tests/harness/lib.mjs"));
export const { chromium, acquireSlot, fixtures, waitForApp, dismissNags, sleep, log, parseArgs, ensureDir, ROOT, STATE, HIDE_TOASTS_CSS } = H;
const { devices } = H.req("playwright");
export const MODULE_DIST = path.join(HERE, "../dist");

const land = (d) => ({ ...d, viewport: { width: d.viewport.height, height: d.viewport.width } });
export const DEVICES = {
    iphone15: { ...devices["iPhone 15"], kb: 336, label: "iPhone 15 (portrait)" },
    "iphone15-land": { ...devices["iPhone 15 landscape"], kb: 200, label: "iPhone 15 (landscape)" },
    pixel8: { ...devices["Pixel 8"], kb: 320, label: "Pixel 8 (portrait)" },
    "pixel8-land": { ...land(devices["Pixel 8"]), kb: 190, label: "Pixel 8 (landscape)" },
    "tablet-land": { viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, isMobile: false, hasTouch: true, kb: 300, label: "Touch tablet 1180x820 (landscape)" },
    desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false, kb: 0, label: "Desktop 1440x900" },
};

export function chromeExe() {
    if (process.env.TL_BROWSER === "chromium") return undefined;
    const w = path.join(STATE, "bin", "chrome-flatpak.sh");
    return fs.existsSync(w) ? w : undefined;
}
export function ctxOptions(d) {
    const { defaultBrowserType, kb, label, ...o } = d;
    return { ...o, locale: "en-GB", timezoneId: "Europe/Berlin", colorScheme: "light" };
}

/** config.json + /element-modules/mobile-themes/* from mobile/dist (nothing deployed). */
export async function routeModule(ctx, { extraConfig = null } = {}) {
    if (!fs.existsSync(path.join(MODULE_DIST, "index.js"))) throw new Error("mobile/dist/index.js missing: run `npm run build` in mobile/ first");
    await ctx.route(/\/config(\.[^/]+)?\.json(\?.*)?$/, async (route) => {
        const res = await route.fetch();
        const c = await res.json();
        if (!(c.modules || []).some((m) => m.includes("/mobile-themes/"))) c.modules = [...(c.modules || []), "/element-modules/mobile-themes/index.js"];
        if (extraConfig) c["de.datanauten.mobile_themes"] = { ...(c["de.datanauten.mobile_themes"] || {}), ...extraConfig };
        await route.fulfill({ response: res, json: c });
    });
    await ctx.route(/\/element-modules\/mobile-themes\/([^?]+)/, async (route) => {
        const f = path.join(MODULE_DIST, path.basename(new URL(route.request().url()).pathname));
        if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: "nf" });
        await route.fulfill({ path: f, headers: { "content-type": f.endsWith(".js") ? "text/javascript" : "application/octet-stream", "cache-control": "no-store" } });
    });
}

export const HIDE_NAGS_CSS = HIDE_TOASTS_CSS + " #teams-welcome-root, #teams-welcome-root *, .twl-card { display: none !important; visibility: hidden !important; }";

/**
 * Logged-in persistent context on a session-pool slot. Returns { ctx, page, close() }; close() restores the slot's
 * mx_local_settings (Element rewrites RoomList.* device settings in narrow windows) and releases the slot.
 */
export async function launchLoggedIn({ device, base, user = "themes-mira", withModule = false, extraConfig = null, theme = null, hash = "/home", browserType = null }) {
    const lock = await acquireSlot(user, base);
    for (const f of ["SingletonLock", "SingletonCookie", "SingletonSocket"]) fs.rmSync(path.join(lock.profile, f), { force: true });
    const ctx = await chromium.launchPersistentContext(lock.profile, {
        executablePath: chromeExe(), headless: true, ...ctxOptions(device),
        args: ["--no-first-run", "--no-default-browser-check", "--disable-features=Translate,MediaRouter", "--password-store=basic", "--disable-background-timer-throttling"],
    });
    const errors = [];
    let origLocal;
    const close = async () => {
        try {
            const p = ctx.pages()[0];
            if (p && origLocal !== undefined) {
                await p.evaluate((v) => { if (v === null) localStorage.removeItem("mx_local_settings"); else localStorage.setItem("mx_local_settings", v); }, origLocal);
            }
        } catch (e) { log("restore failed", e.message); }
        await ctx.close().catch(() => {});
        lock.release();
    };
    try {
        if (withModule) await routeModule(ctx, { extraConfig });
        await ctx.addInitScript((css) => {
            try { sessionStorage.setItem("skip_mobile_redirect", "true"); } catch { /* */ }
            try { if (!sessionStorage.getItem("mt_audit_orig")) sessionStorage.setItem("mt_audit_orig", JSON.stringify({ v: localStorage.getItem("mx_local_settings") })); } catch { /* */ }
            const add = () => { if (document.head && !document.getElementById("mt-hide-toasts")) { const s = document.createElement("style"); s.id = "mt-hide-toasts"; s.textContent = css; document.head.appendChild(s); } };
            if (document.head) add(); else document.addEventListener("DOMContentLoaded", add);
        }, HIDE_NAGS_CSS);
        const page = ctx.pages()[0] || (await ctx.newPage());
        page.setDefaultTimeout(15000);
        page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 300)); });
        page.on("pageerror", (e) => errors.push("pageerror: " + String(e.message).slice(0, 300)));
        const u = new URL(base + "/");
        if (theme && theme !== "element-default") u.searchParams.set("tl_theme", theme);
        await page.goto(u.toString() + "#" + hash.replace(/^#/, ""), { waitUntil: "domcontentloaded" });
        await waitForApp(page, { timeout: 120000 });
        origLocal = await page.evaluate(() => { try { return JSON.parse(sessionStorage.getItem("mt_audit_orig")).v; } catch { return undefined; } });
        await dismissNags(page);
        return { ctx, page, errors, close, slot: lock.slot };
    } catch (e) {
        await close();
        throw e;
    }
}

export async function selectSpace(page, sid) {
    await page.evaluate((s) => window.mxSdkContext?.spaceStore?.setActiveSpace?.(s), sid).catch(() => {});
    await sleep(1200);
}
export async function gotoRoom(page, rid) {
    await page.evaluate((r) => window.mxDispatcher.dispatch({ action: "view_room", room_id: r, metricsTrigger: undefined }), rid);
    await page.waitForFunction((r) => location.hash.includes(r) && document.querySelector(".mx_RoomView .mx_EventTile"), rid, { timeout: 30000 }).catch(() => {});
    await sleep(1200);
}
export async function closeOverlays(page) {
    for (let i = 0; i < 4; i++) {
        const open = await page.locator(".mx_Dialog, .mx_ContextualMenu, [role=menu], .mx_EmojiPicker").count().catch(() => 0);
        if (!open) return;
        await page.keyboard.press("Escape").catch(() => {});
        await sleep(300);
    }
}
export async function center(loc) {
    const b = await loc.boundingBox();
    if (!b) throw new Error("no box");
    return { x: b.x + b.width / 2, y: b.y + Math.min(b.height / 2, 18) };
}
export async function cdpLongPress(page, x, y, ms = 700) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await sleep(ms);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach().catch(() => {});
}
export async function cdpSwipe(page, x0, y0, x1, y1, steps = 12) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0 }] });
    for (let i = 1; i <= steps; i++) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + ((x1 - x0) * i) / steps, y: y0 + ((y1 - y0) * i) / steps }] });
        await sleep(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach().catch(() => {});
}

// in-page measurement (same as audit.mjs, plus the module state)
export function measure() {
    const vw = innerWidth, vh = innerHeight;
    const r = (sel) => {
        const e = document.querySelector(sel);
        if (!e) return null;
        const b = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        if (cs.display === "none" || cs.visibility === "hidden") return { hidden: true };
        return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
    };
    const visible = (e) => {
        const b = e.getBoundingClientRect();
        if (b.width < 1 || b.height < 1) return false;
        const cs = getComputedStyle(e);
        if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) return false;
        if (e.closest("[inert],[aria-hidden=true]")) return false;
        return b.bottom > 0 && b.top < vh;
    };
    const targets = [...document.querySelectorAll('button, [role="button"], a[href], [role="menuitem"], [role="tab"], [role="option"], input, select, textarea, [role="treeitem"]')].filter(visible);
    const small = targets.filter((e) => { const b = e.getBoundingClientRect(); return Math.min(b.width, b.height) < 44; });
    const tiny = targets.filter((e) => { const b = e.getBoundingClientRect(); return Math.min(b.width, b.height) < 24; });
    const offRight = targets.filter((e) => { const b = e.getBoundingClientRect(); return b.right > vw + 1 || b.left < -1; });
    const label = (e) => (e.getAttribute("aria-label") || e.textContent || e.className || e.tagName).toString().trim().replace(/\s+/g, " ").slice(0, 40);
    const inputs = [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]), textarea, [contenteditable="true"]')].filter(visible)
        .map((e) => ({ what: e.getAttribute("aria-label") || e.getAttribute("placeholder") || e.className.toString().slice(0, 40), fontPx: parseFloat(getComputedStyle(e).fontSize) }));
    const dialogs = [...document.querySelectorAll(".mx_Dialog, .mx_ContextualMenu, [role=menu], [role=dialog], [data-radix-popper-content-wrapper]")].filter(visible).map((e) => {
        const b = e.getBoundingClientRect();
        return { cls: e.className.toString().split(" ")[0].slice(0, 40), x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), outside: b.left < -1 || b.top < -1 || b.right > vw + 1 || b.bottom > vh + 1 };
    });
    return {
        viewport: { w: vw, h: vh, vvW: visualViewport?.width, vvH: visualViewport?.height, dpr: devicePixelRatio },
        media: { coarse: matchMedia("(pointer: coarse)").matches, hoverNone: matchMedia("(hover: none)").matches, standalone: matchMedia("(display-mode: standalone)").matches },
        doc: { scrollW: document.documentElement.scrollWidth, scrollH: document.documentElement.scrollHeight, hOverflow: document.documentElement.scrollWidth > vw + 1 },
        regions: {
            spacePanel: r(".mx_SpacePanel"), leftPanel: r(".mx_LeftPanel_panel, .mx_LeftPanel"), roomList: r(".mx_RoomListPanel, .mx_LeftPanel"),
            separator: r(".mx_Separator"), roomView: r(".mx_RoomView"), roomHeader: r(".mx_RoomHeader"), timeline: r(".mx_RoomView_messagePanel"),
            composer: r(".mx_MessageComposer"), rightPanel: r(".mx_RightPanel"), dialog: r(".mx_Dialog"), actionBar: r(".mx_MessageActionBar"),
            homePage: r(".mx_HomePage"), userMenu: r(".mx_UserMenu"),
        },
        targets: { total: targets.length, under44: small.length, under24: tiny.length, offscreen: offRight.length, offscreenSample: offRight.slice(0, 6).map(label), tinySample: tiny.slice(0, 8).map(label) },
        inputs,
        dialogs,
        leftPanelInert: !!document.querySelector(".mx_LeftPanel_panel[inert]"),
        mt: { view: document.documentElement.getAttribute("data-mt-view"), mobile: document.documentElement.getAttribute("data-mt-mobile"), compact: document.documentElement.hasAttribute("data-mt-compact"), keyboard: document.documentElement.hasAttribute("data-mt-keyboard") },
        url: location.href.replace(/(#\/room\/)[^/?]+/, "$1…"),
    };
}

/**
 * Simulated on-screen keyboard (emulation can't open a real one):
 *  "visual"  iOS / Android default (resizes-visual): the layout viewport stays, window.visualViewport.height shrinks by
 *            d.kb (getter override + a vv "resize" event) and a hatched box is drawn where the keyboard would be
 *  "layout"  Android with interactive-widget=resizes-content: the layout viewport shrinks; screen.orientation is pinned
 *            (Playwright's setViewportSize would otherwise flip it to landscape, which a real keyboard doesn't)
 *  null      remove the simulation
 */
export async function kbSim(page, d, mode) {
    if (mode === "layout") {
        const o = d.viewport.width > d.viewport.height ? "landscape-primary" : "portrait-primary";
        await page.evaluate((t) => { try { Object.defineProperty(screen.orientation, "type", { get: () => t, configurable: true }); } catch { /* */ } }, o);
        await page.setViewportSize({ width: d.viewport.width, height: d.viewport.height - d.kb });
        return;
    }
    if (mode === "visual") {
        await page.evaluate(({ kb }) => {
            const vv = window.visualViewport;
            const h = innerHeight - kb;
            Object.defineProperty(vv, "height", { get: () => h, configurable: true });
            vv.dispatchEvent(new Event("resize"));
            const k = document.createElement("div");
            k.id = "mt-test-kb";
            k.style.cssText = `position:fixed;left:0;right:0;bottom:0;height:${kb}px;background:repeating-linear-gradient(45deg,#8889,#8889 10px,#6669 10px,#6669 20px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font:600 16px sans-serif;color:#fff;pointer-events:none`;
            k.textContent = "simulated keyboard (" + kb + "px)";
            document.body.appendChild(k);
        }, { kb: d.kb });
        return;
    }
    await page.evaluate(() => {
        document.getElementById("mt-test-kb")?.remove();
        try { delete window.visualViewport.height; } catch { /* */ }
        try { delete screen.orientation.type; } catch { /* */ }
        window.visualViewport?.dispatchEvent(new Event("resize"));
    }).catch(() => {});
    await page.setViewportSize(d.viewport);
}

/** Scroll the timeline until a tile with `text` is loaded and centred. */
export async function findTile(page, text) {
    for (let i = 0; i < 25; i++) {
        const t = page.locator(".mx_RoomView_messagePanel .mx_EventTile").filter({ hasText: text }).last();
        if (await t.count()) {
            await t.evaluate((el) => {
                const p = el.closest(".mx_RoomView_messagePanel");
                const pb = p.getBoundingClientRect(), b = el.getBoundingClientRect();
                p.scrollTop += b.top - pb.top - pb.height / 2 + b.height / 2;
            });
            await sleep(600);
            return t;
        }
        await page.evaluate(() => { const p = document.querySelector(".mx_RoomView_messagePanel"); if (p) p.scrollTop = 0; });
        await sleep(900);
    }
    throw new Error(`tile "${text}" not found`);
}
