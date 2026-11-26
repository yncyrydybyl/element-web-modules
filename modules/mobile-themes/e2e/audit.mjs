#!/usr/bin/env node
// Mobile audit: runs Element Web under Playwright device emulation and records what breaks.
//
//   NODE_PATH=~/projects/matrix-search-widget/node_modules node mobile/e2e/audit.mjs \
//       [--device iphone15|iphone15-land|pixel8|pixel8-land|all] [--base-url https://element.datanauten.de]
//       [--anon-only] [--no-anon] [--with-module] [--out recordings/mobile]
//
// Output: recordings/mobile/<device>/NN-name.png + metrics.json (per device), recordings/mobile/summary.json.
// Logged-in part uses the session pool of tests/harness (exclusive slot lock, never a new login). The anonymous part
// (mobile-guide redirect, login) uses a fresh throw-away context.
// --with-module: intercepts config.json and serves mobile-themes/lib/ as /element-modules/mobile-themes/ (no deploy).
//
// Writes it makes on the server: read receipts in Showcase/Sandbox (like the harness). It never sends messages,
// never reacts, never joins calls. Device-level settings that Element changes because of the narrow window
// (RoomList.isPanelCollapsed / panelSize) are restored in the slot profile before the browser closes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const H = await import(path.join(HERE, "../../theme-loader/qa/harness/lib.mjs"));
const { chromium, acquireSlot, fixtures, waitForApp, dismissNags, sleep, log, parseArgs, ensureDir, ROOT, STATE, HIDE_TOASTS_CSS } = H;
const { devices } = H.req("playwright");

const a = parseArgs(process.argv.slice(2), { device: "all", baseUrl: "https://element.datanauten.de", user: "themes-mira" });
const BASE = a.baseUrl.replace(/\/$/, "");
const OUT = ensureDir(path.resolve(ROOT, a.out || "recordings/mobile"));
const MODULE_DIST = path.join(HERE, "../lib");

const land = (d) => ({ ...d, viewport: { width: d.viewport.height, height: d.viewport.width } });
const DEVICES = {
    iphone15: { ...devices["iPhone 15"], kb: 336, label: "iPhone 15 (portrait)" },
    "iphone15-land": { ...devices["iPhone 15 landscape"], kb: 200, label: "iPhone 15 (landscape)" },
    pixel8: { ...devices["Pixel 8"], kb: 320, label: "Pixel 8 (portrait)" },
    "pixel8-land": { ...land(devices["Pixel 8"]), kb: 190, label: "Pixel 8 (landscape)" },
};
const which = a.device === "all" ? Object.keys(DEVICES) : String(a.device).split(",");

function chromeExe() {
    if (process.env.TL_BROWSER === "chromium") return undefined;
    const w = path.join(STATE, "bin", "chrome-flatpak.sh");
    return fs.existsSync(w) ? w : undefined;
}
function ctxOptions(d) {
    const { defaultBrowserType, kb, label, ...o } = d;
    return { ...o, locale: "en-GB", timezoneId: "Europe/Berlin", colorScheme: "light" };
}

// ----------------------------------------------------------------------------------------- in-page measurement
function measure() {
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
        url: location.href.replace(/(#\/room\/)[^/?]+/, "$1…"),
    };
}

// ----------------------------------------------------------------------------------------- module interception
async function routeModule(ctx) {
    if (!fs.existsSync(path.join(MODULE_DIST, "index.js"))) throw new Error("lib/index.js missing: run `pnpm build` in modules/mobile-themes first");
    await ctx.route(/\/config(\.[^/]+)?\.json(\?.*)?$/, async (route) => {
        const res = await route.fetch();
        const c = await res.json();
        c.modules = [...(c.modules || []), "/element-modules/mobile-themes/index.js"];
        await route.fulfill({ response: res, json: c });
    });
    await ctx.route(/\/element-modules\/mobile-themes\/([^?]+)/, async (route) => {
        const f = path.join(MODULE_DIST, path.basename(new URL(route.request().url()).pathname));
        if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: "nf" });
        await route.fulfill({ path: f, headers: { "content-type": f.endsWith(".js") ? "text/javascript" : f.endsWith(".css") ? "text/css" : "application/octet-stream" } });
    });
}

// ----------------------------------------------------------------------------------------- shooting helpers
function shooter(page, dir, results) {
    return async function snap(name, fn, note = "") {
        const t0 = Date.now();
        const rec = { name, note, ok: true };
        try {
            await fn();
            await page.evaluate(() => document.fonts.ready).catch(() => {});
            await sleep(500);
        } catch (e) {
            rec.ok = false;
            rec.error = String(e.message || e).split("\n")[0].slice(0, 300);
        }
        try { rec.metrics = await page.evaluate(measure); } catch (e) { rec.metricsError = String(e.message).slice(0, 200); }
        await page.screenshot({ path: path.join(dir, name + ".png"), scale: "css", animations: "disabled", caret: "hide" }).catch((e) => { rec.shotError = String(e.message).slice(0, 200); });
        rec.ms = Date.now() - t0;
        results.push(rec);
        log(rec.ok ? "✓" : "✗", name, rec.error || "");
        return rec;
    };
}

async function closeOverlays(page) {
    for (let i = 0; i < 4; i++) {
        const open = await page.locator(".mx_Dialog, .mx_ContextualMenu, [role=menu], .mx_EmojiPicker").count().catch(() => 0);
        if (!open) return;
        await page.keyboard.press("Escape").catch(() => {});
        await sleep(300);
    }
}
async function hideRightPanel(page) {
    await page.evaluate(() => { try { window.mxSdkContext?.rightPanelStore?.hide?.(null); } catch { /* */ } }).catch(() => {});
    await sleep(300);
}
async function gotoRoom(page, rid) {
    await page.evaluate((r) => window.mxDispatcher.dispatch({ action: "view_room", room_id: r, metricsTrigger: undefined }), rid);
    await page.waitForFunction((r) => location.hash.includes(r) && document.querySelector(".mx_RoomView .mx_EventTile"), rid, { timeout: 30000 }).catch(() => {});
    await sleep(1200);
}
async function scrollBottom(page) {
    await page.evaluate(() => { const p = document.querySelector(".mx_RoomView_messagePanel"); if (p) p.scrollTop = p.scrollHeight; });
    await sleep(700);
}
async function findTile(page, text) {
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
async function longPress(page, x, y, ms = 900) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await sleep(ms);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach().catch(() => {});
}
async function touchDrag(page, x0, y0, x1, y1, steps = 12) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x0, y: y0 }] });
    for (let i = 1; i <= steps; i++) {
        await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x0 + ((x1 - x0) * i) / steps, y: y0 + ((y1 - y0) * i) / steps }] });
        await sleep(25);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach().catch(() => {});
}
async function center(loc) {
    const b = await loc.boundingBox();
    if (!b) throw new Error("no box");
    return { x: b.x + b.width / 2, y: b.y + Math.min(b.height / 2, 18) };
}

// ----------------------------------------------------------------------------------------- anonymous part
async function anon(name, d, summary) {
    const dir = ensureDir(path.join(OUT, name));
    const results = [];
    const browser = await chromium.launch({ headless: true }); // bundled Chromium: throw-away profile
    try {
        // 1. plain visit -> mobile guide redirect
        {
            const ctx = await browser.newContext(ctxOptions(d));
            if (a.withModule) await routeModule(ctx);
            const page = await ctx.newPage();
            const snap = shooter(page, dir, results);
            const nav = [];
            page.on("framenavigated", (f) => { if (f === page.mainFrame()) nav.push(f.url()); });
            await snap("00-mobile-guide-redirect", async () => {
                await page.goto(BASE + "/", { waitUntil: "load" });
                await page.waitForURL(/mobile_guide/, { timeout: 20000 });
                await page.waitForLoadState("networkidle").catch(() => {});
            });
            results.at(-1).navigations = nav.slice();
            const modulesRequested = [];
            page.on("request", (r) => { if (r.url().includes("/element-modules/")) modulesRequested.push(r.url().split("?")[0]); });
            // 2. the "desktop site" link -> sets sessionStorage skip flag -> login page
            await snap("01-login", async () => {
                await page.locator("#back_to_element_button").click();
                await page.waitForSelector(".mx_AuthPage, .mx_Welcome, .mx_AuthBody, .mx_Login", { timeout: 60000 });
                await sleep(1500);
            }, "after tapping 'desktop site' on the mobile guide (sessionStorage skip_mobile_redirect=true)");
            results.at(-1).modulesRequestedBeforeLogin = [...new Set(modulesRequested)].length;
            await ctx.close();
        }
        // 3. new tab = new sessionStorage -> redirected again; deep link is not redirected
        {
            const ctx = await browser.newContext(ctxOptions(d));
            const page = await ctx.newPage();
            const snap = shooter(page, dir, results);
            await snap("03-deeplink-no-redirect", async () => {
                await page.goto(BASE + "/#/room/#welcome:datanauten.de", { waitUntil: "load" });
                await sleep(6000);
            }, "a URL with a fragment location skips the redirect (vector/index.ts preventRedirect)");
            results.at(-1).finalUrl = page.url().replace(/#.*/, "#…");
            await ctx.close();
        }
    } finally {
        await browser.close();
    }
    summary[name] = { ...(summary[name] || {}), anon: results };
    fs.writeFileSync(path.join(dir, "anon.json"), JSON.stringify(results, null, 2));
}

// ----------------------------------------------------------------------------------------- logged-in part
async function loggedIn(name, d, summary) {
    const dir = ensureDir(path.join(OUT, name));
    const R = fixtures().rooms;
    const lock = await acquireSlot(a.user, BASE);
    log(`${name}: using ${a.user} session slot ${lock.slot}`);
    for (const f of ["SingletonLock", "SingletonCookie", "SingletonSocket"]) fs.rmSync(path.join(lock.profile, f), { force: true });
    const ctx = await chromium.launchPersistentContext(lock.profile, {
        executablePath: chromeExe(), headless: true, ...ctxOptions(d),
        args: ["--no-first-run", "--no-default-browser-check", "--disable-features=Translate,MediaRouter", "--password-store=basic", "--disable-background-timer-throttling"],
    });
    const results = [];
    const consoleErrors = [];
    let origLocal = null;
    try {
        if (a.withModule) await routeModule(ctx);
        // Skip Element's mobile redirect for this tab (same thing the mobile guide's "desktop site" link does) and hide
        // toasts like the harness does. Snapshot device settings before Element can touch them.
        await ctx.addInitScript((css) => {
            try { sessionStorage.setItem("skip_mobile_redirect", "true"); } catch { /* */ }
            try { if (!sessionStorage.getItem("mt_audit_orig")) sessionStorage.setItem("mt_audit_orig", JSON.stringify({ v: localStorage.getItem("mx_local_settings") })); } catch { /* */ }
            const add = () => { if (document.head && !document.getElementById("mt-hide-toasts")) { const s = document.createElement("style"); s.id = "mt-hide-toasts"; s.textContent = css; document.head.appendChild(s); } };
            if (document.head) add(); else document.addEventListener("DOMContentLoaded", add);
        }, HIDE_TOASTS_CSS + " #teams-welcome-root, #teams-welcome-root *, .twl-card { display: none !important; visibility: hidden !important; }" /* datanauten teams-welcome onboarding card (dismissing it would write account data) */);
        const page = ctx.pages()[0] || (await ctx.newPage());
        page.setDefaultTimeout(15000);
        page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300)); });
        page.on("pageerror", (e) => consoleErrors.push("pageerror: " + String(e.message).slice(0, 300)));
        const snap = shooter(page, dir, results);

        await page.goto(BASE + "/#/home", { waitUntil: "domcontentloaded" });
        await waitForApp(page, { timeout: 120000 });
        origLocal = await page.evaluate(() => { try { return JSON.parse(sessionStorage.getItem("mt_audit_orig")).v; } catch { return undefined; } });
        await dismissNags(page);
        await page.evaluate((sid) => window.mxSdkContext?.spaceStore?.setActiveSpace?.(sid), R.space).catch(() => {});
        await sleep(1500);

        await snap("10-home-start", async () => {}, "what a phone user sees right after load (room list auto-collapsed below 768px?)");
        // try to reach the room list the way a touch user could: drag the collapsed separator to the right
        await snap("11-roomlist-drag-open", async () => {
            const sep = page.locator(".mx_Separator").first();
            if (!(await sep.count())) throw new Error("no separator");
            const c = await center(sep);
            const vw = page.viewportSize().width;
            await touchDrag(page, c.x, c.y, Math.min(vw - 20, c.x + 300), c.y);
            await sleep(1200);
        }, "touch-drag on the 12px collapsed separator bar");
        await snap("12-roomlist-forced-open", async () => {
            // what the room list itself looks like once open (forced through the panel API if dragging failed)
            const open = await page.evaluate(() => !document.querySelector(".mx_LeftPanel_panel[inert]"));
            if (!open) {
                const sep = page.locator(".mx_Separator").first();
                await sep.dblclick().catch(() => {});
                await sleep(1200);
            }
        }, "double-click on separator if still collapsed");
        results.at(-1).leftPanelOpen = await page.evaluate(() => !document.querySelector(".mx_LeftPanel_panel[inert]"));

        await snap("12b-roomlist-tap-room", async () => {
            const item = page.locator(".mx_LeftPanel_panel").getByText("Showcase", { exact: true }).first();
            const c = await center(item);
            await page.touchscreen.tap(c.x, c.y);
            await sleep(2000);
        }, "tap a room in the open room list: does the room become visible (single-pane navigation)?");
        results.at(-1).roomViewWidthAfterTap = await page.evaluate(() => Math.round(document.querySelector(".mx_RoomView")?.getBoundingClientRect().width ?? -1));

        await snap("12c-roomlist-drag-close", async () => {
            const sep = page.locator(".mx_Separator").first();
            const c = await center(sep);
            await touchDrag(page, c.x, c.y, 2, c.y);
            await sleep(1500);
        }, "touch-drag the separator back to the left edge to get the room back");
        results.at(-1).leftPanelOpen = await page.evaluate(() => !document.querySelector(".mx_LeftPanel_panel[inert]"));
        if (results.at(-1).leftPanelOpen) {
            // fall back to collapsing through the separator's keyboard handling so the rest of the audit can run
            await page.locator(".mx_Separator").first().focus().catch(() => {});
            for (let i = 0; i < 3; i++) await page.keyboard.press("Home").catch(() => {});
            await sleep(1000);
        }

        await gotoRoom(page, R.showcase);
        await hideRightPanel(page);
        await scrollBottom(page);
        await snap("13-timeline", async () => { await scrollBottom(page); });

        await snap("14-tap-message", async () => {
            const t = await findTile(page, "New gallery screenshots are up");
            const c = await center(t.locator(".mx_EventTile_line, [class*='_line_']").first());
            await page.touchscreen.tap(c.x, c.y);
            await sleep(800);
        }, "single tap on a message: does the hover action bar appear?");
        results.at(-1).actionBarAfterTap = await page.locator(".mx_MessageActionBar").count();

        await snap("15-tap-options-menu", async () => {
            const opt = page.locator(".mx_MessageActionBar [aria-label='Options']").first();
            if (!(await opt.count())) throw new Error("no action bar after tap -> Options unreachable");
            const c = await center(opt);
            await page.touchscreen.tap(c.x, c.y);
            await page.locator(".mx_ContextualMenu, [role=menu]").first().waitFor({ timeout: 5000 });
            await sleep(500);
        }, "tap 'Options' in the action bar");
        await closeOverlays(page);

        await snap("16-longpress-message", async () => {
            const t = await findTile(page, "Markdown check");
            const c = await center(t.locator(".mx_EventTile_line, [class*='_line_']").first());
            await longPress(page, c.x, c.y);
            await sleep(800);
        }, "long-press (touchStart, 900ms, touchEnd) on a message: native contextmenu → Element menu?");
        results.at(-1).menuAfterLongPress = await page.locator(".mx_ContextualMenu, [role=menu]").count();
        results.at(-1).selectionAfterLongPress = await page.evaluate(() => String(getSelection()).slice(0, 60));
        await closeOverlays(page);
        await page.evaluate(() => getSelection()?.removeAllRanges());

        await snap("17-contextmenu-event", async () => {
            const t = await findTile(page, "Markdown check");
            const c = await center(t.locator(".mx_EventTile_line, [class*='_line_']").first());
            await t.locator(".mx_EventTile_line, [class*='_line_']").first().dispatchEvent("contextmenu", { clientX: c.x, clientY: c.y, bubbles: true, cancelable: true });
            await page.locator(".mx_ContextualMenu, [role=menu]").first().waitFor({ timeout: 5000 });
            await sleep(500);
        }, "synthetic contextmenu at the press point (what Android Chrome fires on long-press)");
        await closeOverlays(page);

        await scrollBottom(page);
        const vp = page.viewportSize();
        await snap("18-composer-focus", async () => {
            const ed = page.locator(".mx_BasicMessageComposer_input, .mx_WysiwygComposer_Editor_content").first();
            const c = await center(ed);
            await page.touchscreen.tap(c.x, c.y);
            await sleep(500);
        }, "composer focused (no keyboard simulated)");
        results.at(-1).composerFocused = await page.evaluate(() => !!document.activeElement?.closest(".mx_MessageComposer"));
        await snap("19-keyboard-resize", async () => {
            await page.setViewportSize({ width: vp.width, height: vp.height - d.kb });
            await sleep(1200);
        }, `layout viewport shrunk by ${d.kb}px (best case: Android with interactive-widget=resizes-content)`);
        await page.setViewportSize(vp);
        await sleep(600);
        await snap("20-keyboard-overlay", async () => {
            // iOS Safari / default Android: the layout viewport does NOT shrink; the keyboard covers the bottom and the
            // browser pans the visual viewport. We draw the keyboard area to show what is covered.
            await page.evaluate((kb) => {
                const k = document.createElement("div");
                k.id = "mt-audit-kb";
                k.style.cssText = `position:fixed;left:0;right:0;bottom:0;height:${kb}px;background:repeating-linear-gradient(45deg,#8889,#8889 10px,#6669 10px,#6669 20px);z-index:2147483647;display:flex;align-items:center;justify-content:center;font:600 18px sans-serif;color:#fff`;
                k.textContent = "on-screen keyboard (" + kb + "px)";
                document.body.appendChild(k);
            }, d.kb);
            await sleep(300);
        }, "keyboard drawn over an unchanged layout viewport (iOS / Android default resizes-visual)");
        await page.evaluate(() => document.getElementById("mt-audit-kb")?.remove());
        await page.evaluate(() => document.activeElement?.blur?.());

        await snap("21-emoji-picker", async () => {
            const b = page.locator(".mx_MessageComposer [aria-label='Emoji'], .mx_MessageComposer_emoji").first();
            if (!(await b.count()) || !(await b.isVisible())) {
                const more = page.locator(".mx_MessageComposer [aria-label='More options']").first();
                const c0 = await center(more);
                await page.touchscreen.tap(c0.x, c0.y);
                await sleep(600);
            }
            const e = page.locator(".mx_MessageComposer [aria-label='Emoji'], [role=menuitem][aria-label='Emoji'], .mx_MessageComposer_emoji").first();
            const c = await center(e);
            await page.touchscreen.tap(c.x, c.y);
            await page.locator(".mx_EmojiPicker, [class*='EmojiPicker']").first().waitFor({ timeout: 6000 });
            await sleep(600);
        });
        await closeOverlays(page);

        await snap("22-thread-panel", async () => {
            const root = await findTile(page, "which theme should be the default");
            const s = root.locator(".mx_ThreadSummary, [class*='ThreadSummary']").first();
            const c = await center(s);
            await page.touchscreen.tap(c.x, c.y);
            await page.locator(".mx_ThreadView .mx_EventTile").first().waitFor({ timeout: 15000 });
            await sleep(1200);
        }, "thread opened from the thread summary (right panel min-width 320px)");
        await hideRightPanel(page);

        await snap("23-room-info", async () => {
            const b = page.locator(".mx_RoomHeader [aria-label='Room info'], .mx_RoomHeader button[aria-label*='Room info']").first();
            const c = await center(b);
            await page.touchscreen.tap(c.x, c.y);
            await page.locator(".mx_RightPanel").waitFor({ timeout: 8000 });
            await sleep(900);
        });
        await hideRightPanel(page);

        await snap("24-tap-tooltip", async () => {
            // tap a header button that only has a tooltip label (no action that writes): the E2E/room avatar facepile
            const b = page.locator(".mx_RoomHeader [aria-label='Threads'], .mx_RoomHeader button").last();
            const c = await center(b);
            await page.touchscreen.tap(c.x, c.y);
            await sleep(900);
        }, "tap on a header icon button: does a tooltip label ever appear on touch?");
        results.at(-1).tooltipVisible = await page.locator("[role=tooltip]").count();
        await hideRightPanel(page);

        await snap("25-room-settings", async () => {
            await page.evaluate((rid) => window.mxDispatcher.dispatch({ action: "open_room_settings", room_id: rid }), R.showcase);
            await page.locator(".mx_RoomSettingsDialog").waitFor();
            await sleep(900);
        });
        await closeOverlays(page);
        await snap("26-user-settings", async () => {
            await page.evaluate(() => window.mxDispatcher.dispatch({ action: "view_user_settings" }));
            await page.locator(".mx_UserSettingsDialog").waitFor();
            await sleep(1000);
        });
        await snap("27-user-settings-sessions", async () => {
            await page.locator(".mx_UserSettingsDialog .mx_TabbedView_tabLabel, .mx_UserSettingsDialog [role=tab]").filter({ hasText: /Sessions/ }).first().click();
            await sleep(1500);
        });
        await closeOverlays(page);
        await snap("28-modal-create-room", async () => {
            await page.evaluate(() => window.mxDispatcher.dispatch({ action: "view_create_room" }));
            await page.locator(".mx_CreateRoomDialog, .mx_Dialog").first().waitFor();
            await sleep(700);
        });
        await closeOverlays(page);
        await snap("29-user-menu", async () => {
            const b = page.locator(".mx_UserMenu, [aria-label='User menu']").first();
            const c = await center(b);
            await page.touchscreen.tap(c.x, c.y);
            await page.locator("[role=menu], .mx_ContextualMenu").first().waitFor({ timeout: 5000 });
            await sleep(500);
        }, "user menu (lives in the room list header / space panel)");
        await closeOverlays(page);
        await snap("30-spotlight-search", async () => {
            await page.keyboard.press("Control+k");
            await page.locator(".mx_SpotlightDialog").waitFor({ timeout: 5000 });
            await sleep(600);
        }, "search dialog (opened with Ctrl+K: there is no visible search button while the room list is collapsed)");
        await closeOverlays(page);

        if (R.sandbox && !name.endsWith("-land")) {
            await gotoRoom(page, R.sandbox);
            await hideRightPanel(page);
            await snap("31-call-lobby", async () => {
                const b = page.locator(".mx_RoomHeader [aria-label*='call' i]").first();
                if (!(await b.count())) throw new Error("no call button in header");
                const c = await center(b);
                await page.touchscreen.tap(c.x, c.y);
                await sleep(6000);
            }, "video call button in Sandbox → Element Call lobby (not joined)");
            results.at(-1).callFrames = await page.locator("iframe").count();
            // leave the lobby without joining
            await page.evaluate((rid) => window.mxDispatcher.dispatch({ action: "view_room", room_id: rid, view_call: false, metricsTrigger: undefined }), R.sandbox).catch(() => {});
            await sleep(800);
        }
    } finally {
        try {
            const page = ctx.pages()[0];
            if (page && origLocal !== null && origLocal !== undefined) {
                await page.evaluate((v) => { if (v === null) localStorage.removeItem("mx_local_settings"); else localStorage.setItem("mx_local_settings", v); }, origLocal);
                log("restored device settings (mx_local_settings) of the slot");
            }
        } catch (e) { log("restore failed", e.message); }
        await ctx.close().catch(() => {});
        lock.release();
    }
    summary[name] = { ...(summary[name] || {}), label: d.label, device: { viewport: d.viewport, dpr: d.deviceScaleFactor, ua: d.userAgent }, loggedIn: results, consoleErrors: [...new Set(consoleErrors)].slice(0, 40) };
    fs.writeFileSync(path.join(dir, "metrics.json"), JSON.stringify(summary[name], null, 2));
}

// ----------------------------------------------------------------------------------------- main
const summaryFile = path.join(OUT, "summary.json");
const summary = fs.existsSync(summaryFile) ? JSON.parse(fs.readFileSync(summaryFile, "utf8")) : {};
for (const name of which) {
    const d = DEVICES[name];
    if (!d) { console.error("unknown device", name); process.exit(2); }
    const key = a.withModule ? name + "--module" : name;
    log(`=== ${key}: ${d.label} ${d.viewport.width}x${d.viewport.height} @${d.deviceScaleFactor}`);
    if (!a.noAnon) await anon(key, d, summary).catch((e) => log("anon part failed", e.message));
    if (!a.anonOnly) await loggedIn(key, d, summary).catch((e) => log("logged-in part failed", e.stack));
    summary.generated = new Date().toISOString();
    summary.base = BASE;
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
}
log("done →", path.relative(ROOT, OUT));
