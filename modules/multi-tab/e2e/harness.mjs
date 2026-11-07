// Multi-tab Playwright harness: ONE BrowserContext (shared localStorage, IndexedDB, BroadcastChannel, Web Locks)
// with N pages = N Element tabs of the main user, plus a separate context running stock Element as the peer user
// (real Rust crypto, so it can send encrypted messages). See e2e/README.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "playwright";

const BROWSERS = { chromium, firefox, webkit };

export class UnsupportedError extends Error {}

export const E2E = path.dirname(fileURLToPath(import.meta.url));
export const RUN = path.join(E2E, ".run");
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FORBIDDEN_RE = /\/_matrix\/client\/[^/]+\/(keys\/|sendToDevice\/|room_keys\/|dehydrated_device)|\/org\.matrix\.msc3814\.v1\/dehydrated_device/;
const SYNC_RE = /\/_matrix\/client\/[^/]+\/sync$/;

/**
 * Init script for every page of the main user's context: records when the first room tile appears, as
 * performance.now() (relative to the navigation start of this document), in window.__mtBoot, and reports it through
 * the __mtBootReport binding so incarnations the harness never waited for still get a boot time. Live
 * HTMLCollections keep the per-mutation check cheap.
 */
const BOOT_PROBE = `(() => {
  if (window.top !== window || window.__mtBootProbe) return;
  window.__mtBootProbe = true;
  window.__mtBoot = null;
  // Live collections, created once <body> exists: created earlier they can miss matches (seen in quirks mode).
  let a, b;
  const mo = new MutationObserver(() => {
    if (window.__mtBoot != null || !document.body) return;
    a ??= document.getElementsByClassName("mx_RoomListItemView");
    b ??= document.getElementsByClassName("mx_RoomTile");
    if (!a.length && !b.length) return;
    window.__mtBoot = performance.now();
    mo.disconnect();
    try { Promise.resolve(window.__mtBootReport && window.__mtBootReport({ ms: window.__mtBoot, timeOrigin: performance.timeOrigin })).catch(() => {}); } catch {}
  });
  mo.observe(document, { childList: true, subtree: true });
})();`;

/** Test environment: local stack (e2e/.run/stack.json) or BPC (bpc.mjs state; fresh in-memory passwords). */
export async function loadEnv(target = "local") {
    if (target === "bpc") return (await import("./bpc.mjs")).bpcEnv();
    if (target === "bpc-live") return (await import("./bpc.mjs")).bpcLiveEnv();
    const file = path.join(RUN, "stack.json");
    if (!fs.existsSync(file)) throw new Error(`${file} missing: run e2e/stack.sh up first`);
    return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** POST /login with a password; returns {accessToken, deviceId, userId}. Done against the homeserver directly. */
export async function passwordLogin(homeserver, localpart, password, deviceName) {
    for (let attempt = 0; ; attempt++) {
        const r = await fetch(`${homeserver}/_matrix/client/v3/login`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                type: "m.login.password",
                identifier: { type: "m.id.user", user: localpart },
                password,
                initial_device_display_name: deviceName,
            }),
        });
        const j = await r.json();
        if (r.status === 429 && attempt < 8) {
            await sleep(Math.min(j.retry_after_ms ?? 2000, 30000) + 250);
            continue;
        }
        if (!r.ok) throw new Error(`login ${localpart}: ${r.status} ${j.errcode}`);
        return { accessToken: j.access_token, deviceId: j.device_id, userId: j.user_id };
    }
}

export async function logoutToken(homeserver, accessToken) {
    await fetch(`${homeserver}/_matrix/client/v3/logout`, {
        method: "POST",
        headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
        body: "{}",
    }).catch(() => {});
}

/**
 * Pre-seed Element's localStorage so it restores an already logged-in session (Lifecycle.restoreSessionFromStorage):
 * mx_hs_url, mx_user_id, mx_device_id, mx_is_guest and the access token at the legacy key mx_access_token, which
 * getStoredToken() reads when IndexedDB has none and then migrates into IndexedDB itself. No pickle key: the token is a
 * plain string, processStoredToken() returns it as is. Must run on the Element origin before Element boots.
 */
export async function injectSession(page, origin, s) {
    await page.goto(`${origin}/config.json`, { waitUntil: "domcontentloaded" });
    await page.evaluate((s) => {
        localStorage.setItem("mx_hs_url", s.hsUrl);
        localStorage.setItem("mx_user_id", s.userId);
        localStorage.setItem("mx_device_id", s.deviceId);
        localStorage.setItem("mx_is_guest", "false");
        localStorage.setItem("mx_access_token", s.accessToken);
        // Skip first-run nags that would otherwise sit on top of the UI.
        localStorage.setItem("mx_seen_feature_spotlight_toast", "true");
        localStorage.setItem("mx_seen_feature_thread_experimental", "1");
    }, s);
}

function readJsonl(file) {
    if (!fs.existsSync(file)) return [];
    return fs
        .readFileSync(file, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((l) => {
            try {
                return JSON.parse(l);
            } catch {
                return null;
            }
        })
        .filter(Boolean);
}

export class Harness {
    /**
     * @param {object} o
     * @param {object} o.env       stack.json / bpc-env.json contents
     * @param {boolean} [o.headless]
     * @param {string} [o.element] Element origin for the main user's tabs (default env.element: with module)
     * @param {string} [o.outDir]
     * @param {(msg:string)=>void} [o.log]
     */
    constructor({ env, headless = true, element, outDir, log, browser = "chromium" }) {
        if (!BROWSERS[browser]) throw new Error(`unknown browser ${browser}`);
        this.browserName = browser;
        this.isChromium = browser === "chromium";
        this.env = env;
        this.headless = headless;
        this.element = element ?? env.element;
        this.outDir = outDir ?? path.join(RUN, `out-${new Date().toISOString().replace(/[:.]/g, "-")}`);
        fs.mkdirSync(this.outDir, { recursive: true });
        this.log = log ?? ((m) => console.log(m));
        this.tabs = []; // {i, page, label, alive, incarnations:[{n, role, tabId, bootMs, start}], requests:[]}
        this.requests = []; // every request leaving any main-user tab: {tab, inc, ts, method, path, since}
        this.console = []; // {tab, ts, type, text}
        this.t0 = Date.now();
        this.roomIds = Object.fromEntries((env.rooms ?? []).map((r) => [r.name, r.roomId]));
        // Requests to these origins are recorded per tab (the proxy locally; homeserver + MAS on the live deployment).
        this.recordOrigins = (env.recordOrigins ?? [env.proxy]).filter(Boolean).map((o) => o.replace(/\/$/, ""));
        this.tokenGrants = []; // {tab, inc, ts, grant, status, expiresIn}
        this.pending = new Map();
    }

    // ---------------------------------------------------------------- setup
    async start({ peer = true, ctxConfigPatch, ctxRoutes, oauth = false } = {}) {
        this.browser = await BROWSERS[this.browserName].launch({
            headless: this.headless,
            args: this.isChromium ? ["--disable-features=CalculateNativeWinOcclusion,IntensiveWakeUpThrottling", "--disable-renderer-backgrounding", "--disable-background-timer-throttling"] : [],
        });
        // CDP (Target.closeTarget, Page.crash, lifecycle freeze) only exists in Chromium.
        this.cdp = this.isChromium ? await this.browser.newBrowserCDPSession() : null;
        const u = this.env.users.main;
        this.ctx = await this.browser.newContext({ viewport: { width: 1200, height: 800 }, serviceWorkers: "allow" });
        if (ctxConfigPatch) await routeConfig(this.ctx, { configPatch: ctxConfigPatch });
        await this.ctx.exposeBinding("__mtBootReport", (src, d) => this.onBootReport(src.page, d));
        await this.ctx.addInitScript(BOOT_PROBE);
        for (const [pattern, handler] of ctxRoutes ?? []) await this.ctx.route(pattern, handler);
        if (!oauth) {
            // Password/compat login + localStorage injection. With oauth, the first tab logs in through MAS instead.
            this.session = await this.makeSession(u, "multi-tab e2e");
            this.tokenSuffix = this.session.accessToken.slice(-6);
            const first = await this.ctx.newPage();
            await injectSession(first, this.element, { ...this.session, hsUrl: this.env.hsUrlForInjection ?? this.env.proxy });
            await first.close();
        }
        if (peer) await this.startPeer();
        this.poller = setInterval(() => this.pollRoles().catch(() => {}), 500);
        return this;
    }

    async makeSession(u, deviceName) {
        if (u.accessToken && u.deviceId && u.reuse) return { userId: u.userId, accessToken: u.accessToken, deviceId: u.deviceId };
        const s = await passwordLogin(this.env.homeserver, u.localpart, u.password, deviceName);
        (this.sessions ??= []).push(s);
        return s;
    }

    async startPeer() {
        const p = this.env.users.peer;
        this.peerSession = await this.makeSession(p, "multi-tab e2e peer");
        this.peerTokenSuffix = this.peerSession.accessToken.slice(-6);
        // The peer is the counterpart, not the browser under test: it always runs in Chromium (its key-holding route
        // for T16 relies on request interception that WebKit does not apply to these cross-origin PUTs).
        this.peerBrowser = this.isChromium ? this.browser : await chromium.launch({ headless: this.headless });
        this.peerCtx = await this.peerBrowser.newContext({ viewport: { width: 1000, height: 700 } });
        this.heldToDevice = null; // when an array, the peer's encrypted to-device sends are captured instead of sent
        await this.peerCtx.route(/\/sendToDevice\/m\.room\.encrypted\//, async (route) => {
            if (!this.heldToDevice) return route.continue();
            const req = route.request();
            this.heldToDevice.push({ url: req.url(), method: req.method(), body: req.postData(), auth: req.headers()["authorization"] });
            await route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: "{}" });
        });
        const origin = this.env.elementStock ?? this.element;
        if (!this.env.elementStock) await routeConfig(this.peerCtx, { noModule: true }); // peer runs stock Element
        const page = await this.peerCtx.newPage();
        await injectSession(page, origin, { ...this.peerSession, hsUrl: this.env.hsUrlForInjection ?? this.env.proxy });
        this.peerPage = page;
        page.on("console", (m) => {
            if (m.type() === "error") this.console.push({ tab: "peer", ts: Date.now(), type: m.type(), text: m.text().slice(0, 500) });
        });
        await installPopupHandlers(page);
        await gotoElement(page, origin, this.log, "peer");
        await page.waitForFunction(() => window.mxMatrixClientPeg?.get()?.isInitialSyncComplete?.() && window.mxMatrixClientPeg.get().getCrypto(), null, {
            timeout: 300_000,
        });
        this.log(`[peer] ready as ${this.peerSession.userId}`);
    }

    /**
     * The page saw its first room tile (BOOT_PROBE). Fills bootMs of the matching incarnation if waitForRoomList has
     * not measured it, e.g. a promotion reload in chaos mode. timeOrigin and Date.now() share the machine's clock.
     */
    onBootReport(page, d) {
        const tab = this.tabs.find((t) => t.page === page);
        if (!tab || typeof d?.ms !== "number") return;
        const inc = tab.incarnations.findLast((x) => x.start <= d.timeOrigin + 3000);
        if (!inc) return;
        inc.pageBootMs = Math.round(d.ms);
        if (inc.bootMs == null) {
            inc.bootMs = inc.pageBootMs;
            inc.bootSource = "page";
        }
    }

    /** Fill in the role of every tab's current incarnation as soon as the module has decided it. */
    async pollRoles() {
        for (const t of this.tabs) {
            if (!t.alive) continue;
            const inc = t.incarnations.at(-1);
            if (!inc || (inc.role && inc.role !== "pending")) continue;
            const mt = await this.mt(t.i);
            if (mt?.role && mt.role !== "pending") {
                inc.role = mt.role;
                inc.tabId = mt.tabId;
            }
        }
    }

    async stop() {
        clearInterval(this.poller);
        try {
            fs.writeFileSync(path.join(this.outDir, "requests.json"), JSON.stringify(this.requests, null, 1));
            fs.writeFileSync(path.join(this.outDir, "console.json"), JSON.stringify(this.console, null, 1));
            fs.writeFileSync(path.join(this.outDir, "proxy.jsonl"), this.proxyLog({ all: true }).map((e) => JSON.stringify(e)).join("\n"));
        } catch {}
        if (this.peerBrowser && this.peerBrowser !== this.browser) await this.peerBrowser.close().catch(() => {});
        await this.browser?.close().catch(() => {});
        // Log out the devices this run created so the account doesn't pile up devices.
        for (const s of this.sessions ?? []) await logoutToken(this.env.homeserver, s.accessToken);
    }

    // ---------------------------------------------------------------- tabs
    /**
     * Open a new tab of the main user. opts.noModule serves this tab a config.json without `modules`
     * (same origin, so it shares storage and locks: the I7 case). opts.configPatch(json) for other tweaks,
     * opts.routes = [[pattern, handler]] for per-tab request rewriting (e.g. T9 build hash).
     */
    async openTab(opts = {}) {
        const page = await this.ctx.newPage();
        const i = this.tabs.length;
        const tab = { i, page, label: opts.label ?? `tab${i}`, alive: true, incarnations: [], opts };
        this.tabs.push(tab);
        if (opts.noModule || opts.configPatch) await routeConfig(page, opts);
        if (opts.initScript) await page.addInitScript(opts.initScript);
        for (const [pattern, handler] of opts.routes ?? []) await page.route(pattern, handler);
        this.attach(tab);
        await installPopupHandlers(page);
        const start = Date.now();
        if (opts.oauth) await this.oauthLogin(tab, opts.oauth);
        else await gotoElement(page, this.element, this.log, tab.label);
        if (opts.wait !== false) await this.waitForRoomList(i, { since: start, timeout: opts.oauth ? 180_000 : undefined });
        return i;
    }

    /** Real MAS OAuth login in this tab: #/login -> Continue -> MAS username/password -> Continue -> consent. */
    async oauthLogin(tab, user) {
        const { page } = tab;
        const mas = new URL(this.env.issuer).host;
        await page.goto(`${this.element}/#/login`, { waitUntil: "domcontentloaded" });
        await page.getByRole("button", { name: "Continue" }).first().click({ timeout: 60_000 });
        await page.waitForURL((u) => u.host === mas, { timeout: 60_000 });
        await page.getByLabel("Username").fill(user.localpart, { timeout: 30_000 });
        await page.getByLabel("Password", { exact: true }).fill(user.password);
        await page.getByRole("button", { name: "Continue" }).first().click();
        // Consent screen (first login of this client), then back to Element.
        const elementHost = new URL(this.element).host;
        const deadline = Date.now() + 60_000;
        while (Date.now() < deadline && new URL(page.url()).host !== elementHost) {
            const cont = page.getByRole("button", { name: "Continue" });
            if (await cont.count().catch(() => 0)) await cont.first().click({ timeout: 3000 }).catch(() => {});
            await sleep(1000);
        }
        if (new URL(page.url()).host !== elementHost) {
            await page.screenshot({ path: path.join(this.outDir, `oauth-stuck-${tab.label}.png`) }).catch(() => {});
            throw new Error(`[${tab.label}] OAuth login did not return to Element (at ${new URL(page.url()).host})`);
        }
        this.log(`[${tab.label}] OAuth login returned to Element`);
    }

    /** Password login through Element's own login form (local stack). The page does not reload. */
    async uiPasswordLogin(i, user) {
        const page = this.page(i);
        const username = page.getByLabel("Username", { exact: false }).first();
        // The welcome page comes first: "Sign in" (a link styled as a button) opens the form.
        if (!(await username.isVisible().catch(() => false))) {
            const welcome = page.getByRole("link", { name: "Sign in" }).or(page.getByRole("button", { name: "Sign in" }));
            await welcome.first().click({ timeout: 30_000 });
        }
        await username.fill(user.localpart, { timeout: 30_000 });
        await page.getByLabel("Password", { exact: true }).fill(user.password);
        await page.getByRole("button", { name: "Sign in" }).click();
        // A fresh login of an account with cross-signing shows "Confirm your digital identity". v1.12.33 offers no
        // "verify later" there: "Can't confirm?" leads to "You need to reset your digital identity". On the throwaway
        // local stack the harness resets it: Continue -> account password (UIA) -> "Device verified" -> Done.
        const deadline = Date.now() + 120_000;
        const clickIf = async (name) => {
            const b = page.getByRole("button", { name, exact: true });
            if (await b.first().isVisible().catch(() => false)) {
                await b.first().click({ timeout: 2000 }).catch(() => {});
                return true;
            }
            return false;
        };
        while (Date.now() < deadline) {
            if (await page.locator(".mx_RoomListItemView, .mx_RoomTile").count().catch(() => 0)) return;
            const pw = page.locator(".mx_Dialog input[type=password]").first();
            if (await pw.isVisible().catch(() => false)) {
                await pw.fill(user.password).catch(() => {});
                await page.locator(".mx_Dialog").getByRole("button", { name: "Continue" }).first().click({ timeout: 3000 }).catch(() => page.keyboard.press("Enter"));
                await sleep(1500);
                continue;
            }
            const body = await page.evaluate(() => document.body.innerText).catch(() => "");
            if (/Device verified/i.test(body) && (await clickIf("Done"))) continue;
            if (/reset your digital identity/i.test(body) && (await clickIf("Continue"))) {
                await sleep(1000);
                continue;
            }
            if (/Confirm your (digital )?identity|Verify this device|Are you sure/i.test(body))
                for (const n of ["Skip verification for now", "I'll verify later", "Can't confirm?"]) if (await clickIf(n)) break;
            await sleep(500);
        }
    }

    attach(tab) {
        const { page } = tab;
        page.on("request", (req) => {
            // Each main-frame document load is a new incarnation of the tab (first boot, promotion, resync, retry).
            if (req.isNavigationRequest() && req.frame() === page.mainFrame())
                tab.incarnations.push({ n: tab.incarnations.length, start: Date.now(), role: null });
            const url = req.url();
            if (!this.recordOrigins.some((o) => url.startsWith(o))) return;
            const u = new URL(url);
            const inc = tab.incarnations.length - 1;
            const entry = {
                tab: tab.i,
                inc,
                role: tab.incarnations[inc]?.role ?? null,
                ts: Date.now(),
                origin: u.origin,
                method: req.method(),
                path: u.pathname,
                since: u.searchParams.get("since"),
            };
            if (req.method() === "POST" && /\/oauth2\/token$/.test(u.pathname)) {
                entry.grant = new URLSearchParams(req.postData() ?? "").get("grant_type");
                this.tokenGrants.push(entry);
                this.log(`[${tab.label}] MAS token request grant_type=${entry.grant}`);
            }
            this.pending.set(req, entry);
            this.requests.push(entry);
        });
        page.on("requestfinished", async (req) => {
            const e = this.pending.get(req);
            if (!e) return;
            this.pending.delete(req);
            e.end = Date.now();
            const resp = await req.response().catch(() => null);
            e.status = resp?.status() ?? 0;
            if (e.grant && resp) e.expiresIn = (await resp.json().catch(() => ({}))).expires_in;
        });
        page.on("requestfailed", (req) => {
            const e = this.pending.get(req);
            if (!e) return;
            this.pending.delete(req);
            e.end = Date.now();
            e.status = 0;
            e.aborted = true;
        });
        page.on("console", (m) => {
            const t = m.text();
            if (m.type() === "error" || m.type() === "warning" || /multi-?tab/i.test(t))
                this.console.push({ tab: tab.i, ts: Date.now(), type: m.type(), text: t.slice(0, 800) });
        });
        page.on("crash", () => this.log(`[${tab.label}] renderer crashed`));
        page.on("close", () => (tab.alive = false));
    }

    page(i) {
        const t = this.tabs[i];
        if (!t || !t.alive) throw new Error(`tab ${i} is not open`);
        return t.page;
    }
    openTabs() {
        return this.tabs.filter((t) => t.alive).map((t) => t.i);
    }

    async closeTab(i, why) {
        const t = this.tabs[i];
        await t.page.close({ runBeforeUnload: false });
        t.alive = false;
        this.log(`[${t.label}] closed${why ? ` (${why})` : ""}`);
    }

    /** Close the tab abruptly through CDP Target.closeTarget (no pagehide guarantee, like killing the tab). */
    async killTab(i) {
        const t = this.tabs[i];
        if (!this.isChromium) return this.closeTab(i, "killTab without CDP");
        const s = await t.page.context().newCDPSession(t.page);
        const { targetInfo } = await s.send("Target.getTargetInfo");
        await this.cdp.send("Target.closeTarget", { targetId: targetInfo.targetId });
        t.alive = false;
        this.log(`[${t.label}] killed (Target.closeTarget)`);
    }

    /** Crash the renderer (CDP Page.crash); the page object is then closed. */
    async crashTab(i) {
        const t = this.tabs[i];
        if (!this.isChromium) return this.closeTab(i, "crashTab without CDP");
        const s = await t.page.context().newCDPSession(t.page);
        s.send("Page.crash").catch(() => {}); // never resolves: the renderer is gone
        await sleep(500);
        // A crashed page can't run unload handlers; close it from the browser side, bounded.
        await Promise.race([t.page.close({ runBeforeUnload: false }).catch(() => {}), sleep(3000)]);
        t.alive = false;
        this.log(`[${t.label}] crashed (Page.crash)`);
    }

    /** Freeze the tab (CDP). Never evaluate in a frozen tab: page.evaluate would hang until it is unfrozen. */
    async freezeTab(i) {
        if (!this.isChromium) throw new UnsupportedError(`freezeTab needs CDP (not available in ${this.browserName})`);
        const t = this.tabs[i];
        t.cdpLifecycle ??= await t.page.context().newCDPSession(t.page);
        await t.cdpLifecycle.send("Page.setWebLifecycleState", { state: "frozen" });
        t.frozen = true;
        this.log(`[${t.label}] frozen`);
    }

    /**
     * Hang the tab: a busy loop blocks its main thread for `ms` (no timers, no messages, no fetch handling), then it
     * wakes up by itself. Works in every browser, unlike the CDP freeze, which Chromium ignores for visible pages.
     * Never evaluate in a hung tab; `unfreezeTab` waits until it is awake.
     */
    async hangTab(i, ms) {
        const t = this.tabs[i];
        await t.page.evaluate((d) => {
            setTimeout(() => {
                const end = Date.now() + d;
                while (Date.now() < end) {
                    // hung
                }
            }, 0);
        }, ms);
        t.frozen = true;
        t.hungUntil = Date.now() + ms;
        this.log(`[${t.label}] hung for ${Math.round(ms / 1000)} s`);
    }

    async unfreezeTab(i) {
        const t = this.tabs[i];
        if (!t.frozen) return;
        if (t.hungUntil) {
            await new Promise((r) => setTimeout(r, Math.max(0, t.hungUntil - Date.now()) + 200));
            t.hungUntil = undefined;
            t.frozen = false;
            this.log(`[${t.label}] awake`);
            return;
        }
        t.cdpLifecycle ??= await t.page.context().newCDPSession(t.page);
        await t.cdpLifecycle.send("Page.setWebLifecycleState", { state: "active" });
        t.frozen = false;
        this.log(`[${t.label}] unfrozen`);
    }

    async reloadTab(i) {
        const t = this.tabs[i];
        const start = Date.now();
        await gotoElement(t.page, this.element, this.log, t.label, { reload: true });
        await this.waitForRoomList(i, { since: start });
    }

    // ---------------------------------------------------------------- state
    /** window.__multiTab of tab i (null if absent, or after 5 s: a frozen tab never answers). */
    async mt(i) {
        try {
            if (this.tabs[i]?.frozen) return null;
            return await withTimeout(this.page(i).evaluate(() => {
                const m = window.__multiTab;
                if (!m) return null;
                let stats = null;
                try {
                    stats = typeof m.stats === "function" ? m.stats() : (m.stats ?? null);
                } catch {}
                return JSON.parse(JSON.stringify({ role: m.role, tabId: m.tabId, version: m.version, reason: m.reason, stats }));
            }), 5000);
        } catch {
            return null;
        }
    }
    async role(i) {
        return (await this.mt(i))?.role ?? null;
    }
    /** window.__multiTab.tabs() of tab i: [{tabId, role, isThis, ...}], or null. */
    async mtTabs(i) {
        try {
            if (this.tabs[i]?.frozen) return null;
            return await withTimeout(this.page(i).evaluate(async () => (typeof window.__multiTab?.tabs === "function" ? JSON.parse(JSON.stringify(await window.__multiTab.tabs())) : null)), 5000);
        } catch {
            return null;
        }
    }
    async roles() {
        const out = {};
        for (const i of this.openTabs()) out[i] = this.tabs[i].frozen ? "frozen" : await this.role(i);
        return out;
    }

    /** What the tab shows: "roomlist", "locked" (Element's already-open screen), "waiting" (multi-tab's signed-out notice), "login", "error", "loading". */
    async screen(i) {
        return this.page(i).evaluate(() => {
            const body = document.body?.innerText ?? "";
            if (/is open in another window/.test(body)) return "locked";
            if (/misconfigured|Unexpected error preparing|Unable to restore session/i.test(body)) return "error";
            // multi-tab's own notice in tabs that wait for a sign-in in another tab
            if (document.getElementById("de-datanauten-multi-tab-signed-out")) return "waiting";
            if (document.querySelector(".mx_RoomListPanel, .mx_RoomList, .mx_LeftPanel_roomListContainer")) return "roomlist";
            if (document.querySelector(".mx_AuthPage, .mx_Login")) return "login";
            return "loading";
        });
    }

    /** Wait until the tab shows the room list with at least one room and the client is syncing; records boot time. */
    async waitForRoomList(i, { timeout = Number(process.env.MT_BOOT_TIMEOUT_MS ?? 240_000), since } = {}) {
        const t = this.tabs[i];
        const page = this.page(i);
        const deadline = Date.now() + timeout;
        let last;
        let loginSince = null;
        while (Date.now() < deadline) {
            last = await this.screen(i).catch(() => "loading");
            if (last === "locked" || last === "error") break;
            // The auth page also hosts "Setting up keys" right after an OAuth login: only a lasting login screen counts.
            if (last === "login") {
                loginSince ??= Date.now();
                if (Date.now() - loginSince > 20_000) break;
            } else loginSince = null;
            const ok = await page
                .evaluate(() => {
                    const c = window.mxMatrixClientPeg?.get?.();
                    const rooms = document.querySelectorAll(".mx_RoomListItemView, .mx_RoomTile").length;
                    return !!c && rooms > 0 && ["PREPARED", "SYNCING", "CATCHUP"].includes(c.getSyncState?.());
                })
                .catch(() => false);
            if (ok) {
                const inc = t.incarnations.at(-1);
                // Prefer the in-page time (BOOT_PROBE: first room tile, relative to this document's navigation start).
                // The harness's own clock only measures when this loop noticed, which can be much later (chaos mode
                // checks tabs opened with wait:false only at the end). Not used when the wait started well after the
                // navigation (e.g. a login in an already loaded page), or when the document is older than the incarnation.
                inc.harnessBootMs = Date.now() - (since ?? inc.start);
                const pb = await page.evaluate(() => ({ boot: window.__mtBoot, origin: performance.timeOrigin })).catch(() => null);
                const usePage = typeof pb?.boot === "number" && pb.origin >= inc.start - 3000 && !(since && since > inc.start + 1000);
                inc.bootMs = usePage ? Math.round(pb.boot) : inc.harnessBootMs;
                inc.bootSource = usePage ? "page" : "harness";
                const mt = await this.mt(i);
                inc.role = mt?.role ?? "none";
                inc.tabId = mt?.tabId;
                this.log(`[${t.label}] room list after ${inc.bootMs} ms (${inc.bootSource}), role=${inc.role}`);
                return inc.bootMs;
            }
            await sleep(150);
        }
        await this.shot(i, `no-roomlist-${t.label}`);
        throw new Error(`[${t.label}] no room list (screen=${last})`);
    }

    async shot(i, name) {
        try {
            await this.page(i).screenshot({ path: path.join(this.outDir, `${name}.png`) });
        } catch {}
    }

    // ---------------------------------------------------------------- rooms & messages
    roomId(roomName) {
        const id = this.roomIds[roomName];
        if (!id) throw new Error(`unknown room ${roomName}`);
        return id;
    }

    async openRoom(i, roomName) {
        const page = this.page(i);
        const rid = this.roomId(roomName);
        await page.evaluate((rid) => (location.hash = `#/room/${rid}`), rid);
        await page.locator(".mx_RoomView_body, .mx_RoomView").first().waitFor({ timeout: 30_000 });
    }

    /** Send through the tab's UI composer. */
    async sendMessage(i, roomName, text) {
        await this.openRoom(i, roomName);
        const page = this.page(i);
        const composer = page.locator(".mx_SendMessageComposer [contenteditable='true'], .mx_BasicMessageComposer_input").first();
        await composer.click({ timeout: 30_000 });
        await composer.fill(text);
        await page.keyboard.press("Enter");
        // wait until it is no longer "sending"
        await page.waitForFunction(
            ({ rid, text }) => {
                const room = window.mxMatrixClientPeg.get().getRoom(rid);
                return room?.getLiveTimeline().getEvents().some((e) => e.getContent()?.body === text && e.getId()?.startsWith("$"));
            },
            { rid: this.roomId(roomName), text },
            { timeout: 30_000 },
        );
    }

    /** DOM view of the open room's timeline: [{text, utd}] (opens the room first). */
    async readTimeline(i, roomName) {
        await this.openRoom(i, roomName);
        await sleep(300);
        return this.page(i).evaluate(() =>
            [...document.querySelectorAll(".mx_RoomView_body .mx_EventTile")].map((t) => ({
                text: (t.querySelector(".mx_EventTile_body")?.innerText ?? "").trim(),
                utd: !!t.querySelector(".mx_DecryptionFailureBody, .mx_EventTile_e2eIcon_decryption_failure"),
            })),
        );
    }

    /** Model view of a room (works without opening it): [{id, sender, body, encrypted, utd, pending}] */
    async roomEvents(i, roomName) {
        return this.page(i).evaluate((rid) => {
            const c = window.mxMatrixClientPeg?.get?.();
            const room = c?.getRoom(rid);
            if (!room) return null;
            return room
                .getLiveTimeline()
                .getEvents()
                .filter((e) => e.getType() === "m.room.message" || e.getWireType() === "m.room.encrypted")
                .map((e) => ({
                    id: e.getId(),
                    sender: e.getSender(),
                    body: e.getContent()?.body ?? null,
                    encrypted: e.isEncrypted(),
                    utd: e.isDecryptionFailure(),
                    pending: e.isBeingDecrypted?.() ?? false,
                }));
        }, this.roomId(roomName));
    }

    /** Wait until tab i has `text` in the room; returns {ms, ev}. decrypted:true also requires it not to be a UTD. */
    async waitForMessage(i, roomName, text, { timeout = 45_000, eventId } = {}) {
        const start = Date.now();
        const page = this.page(i);
        const rid = this.roomId(roomName);
        const h = await page.waitForFunction(
            ({ rid, text, eventId }) => {
                const room = window.mxMatrixClientPeg?.get?.()?.getRoom(rid);
                const ev = room
                    ?.getLiveTimeline()
                    .getEvents()
                    .find((e) => (eventId ? e.getId() === eventId : e.getContent()?.body === text));
                if (!ev || ev.isDecryptionFailure() || ev.getContent()?.body !== text) return false;
                return { id: ev.getId(), encrypted: ev.isEncrypted() };
            },
            { rid, text, eventId },
            { timeout, polling: 200 },
        );
        return { ms: Date.now() - start, ev: await h.jsonValue() };
    }

    /** Peer sends a text message with its real (stock Element) client; encrypted rooms are encrypted by Rust crypto. */
    async peerSend(roomName, text) {
        const rid = this.roomId(roomName);
        return this.peerPage.evaluate(
            async ({ rid, text }) => (await window.mxMatrixClientPeg.get().sendTextMessage(rid, text)).event_id,
            { rid, text },
        );
    }

    /** Peer: read whether it sees `text` (sent by someone else) decrypted. */
    async peerSees(roomName, text, timeout = 30_000) {
        const rid = this.roomId(roomName);
        await this.peerPage.waitForFunction(
            ({ rid, text }) =>
                window.mxMatrixClientPeg
                    .get()
                    .getRoom(rid)
                    ?.getLiveTimeline()
                    .getEvents()
                    .some((e) => e.getContent()?.body === text && !e.isDecryptionFailure()),
            { rid, text },
            { timeout, polling: 250 },
        );
        return true;
    }

    /** T16: hold the peer's room-key to-device messages (they are captured, the client is told they were sent). */
    holdRoomKeys() {
        this.heldToDevice = [];
    }
    /** Release held to-device messages by replaying them to the homeserver with fresh txn ids. */
    async releaseRoomKeys() {
        const held = this.heldToDevice ?? [];
        this.heldToDevice = null;
        for (const h of held) {
            const url = h.url.replace(/\/[^/]+$/, `/release-${Date.now()}-${Math.random().toString(36).slice(2)}`);
            const r = await fetch(url, { method: "PUT", headers: { authorization: h.auth, "content-type": "application/json" }, body: h.body });
            if (!r.ok) throw new Error(`replay to-device failed ${r.status}`);
        }
        return held.length;
    }

    // ---------------------------------------------------------------- evidence
    proxyLog({ all = false, from = this.t0 } = {}) {
        if (!this.env.proxy) return [];
        const file = this.env.proxyLog ?? path.join(RUN, `proxy-${new URL(this.env.proxy).port}.jsonl`);
        return readJsonl(file).filter((e) => e.ts >= from && (all || e.tokenSuffix === this.tokenSuffix));
    }
    /** Requests that left tab pages since `from`, optionally only for one tab / one role. */
    tabRequests({ from = this.t0, tab, role } = {}) {
        return this.requests.filter((r) => r.ts >= from && (tab === undefined || r.tab === tab) && (role === undefined || this.roleOf(r) === role));
    }
    roleOf(r) {
        return this.tabs[r.tab]?.incarnations[r.inc]?.role ?? r.role;
    }
    mark() {
        return Date.now();
    }
}

function withTimeout(p, ms) {
    let timer;
    return Promise.race([p, new Promise((_, rej) => (timer = setTimeout(() => rej(new Error(`timeout ${ms} ms`)), ms)))]).finally(() => clearTimeout(timer));
}

/** Rewrite Element's config.json for a page or a whole context (noModule: drop `modules`; configPatch(json)). */
export async function routeConfig(target, { noModule, configPatch }) {
    await target.route(/\/config(\.[^/]*)?\.json(\?|$)/, async (route) => {
        const resp = await route.fetch();
        if (resp.status() !== 200) return route.fulfill({ response: resp });
        let json = await resp.json();
        if (noModule) json.modules = [];
        if (configPatch) json = configPatch(json) ?? json;
        await route.fulfill({ response: resp, json });
    });
}

// ---------------------------------------------------------------- pure checks on evidence
export const isSync = (e) => e.method === "GET" && SYNC_RE.test(e.path);
export const isForbidden = (e) => FORBIDDEN_RE.test(e.path);

/** Overlapping /sync intervals in a proxy log (same token). Returns the overlapping pairs. */
export function syncOverlaps(entries, toleranceMs = 30) {
    const syncs = entries.filter(isSync).sort((a, b) => a.ts - b.ts);
    const out = [];
    for (let i = 0; i < syncs.length; i++)
        for (let j = i + 1; j < syncs.length && syncs[j].ts < syncs[i].end - toleranceMs; j++) out.push([syncs[i], syncs[j]]);
    return out;
}

/** since tokens used by more than one non-aborted /sync, i.e. a fork into two chains. */
export function syncForks(entries) {
    const by = new Map();
    for (const e of entries.filter((e) => isSync(e) && !e.aborted && e.status === 200)) {
        const k = e.since ?? "<initial>";
        by.set(k, [...(by.get(k) ?? []), e]);
    }
    return [...by.entries()].filter(([, v]) => v.length > 1).map(([since, v]) => ({ since, count: v.length, nextBatches: v.map((e) => e.nextBatch) }));
}

// ---------------------------------------------------------------- Element page helpers
/** Auto-dismiss Element's popups when they would block an action (same approach as the BPC alfons_beth testcase). */
export async function installPopupHandlers(page) {
    const click = (names) => async () => {
        for (const n of names) {
            const b = page.getByRole("button", { name: n, exact: true });
            if (await b.count().catch(() => 0)) {
                await b.first().click({ timeout: 2000 }).catch(() => {});
                return;
            }
        }
    };
    // Scoped to toasts/dialogs/headings and .first(): plain text matches also hit timeline bodies
    // (e.g. UTDs say "You need to verify this device for access to historical messages").
    const toast = (text) => page.locator(".mx_Toast_toast").filter({ hasText: text }).first();
    const dialog = (text) => page.locator(".mx_Dialog, .mx_AuthPage").filter({ hasText: text }).first();
    await page.addLocatorHandler(page.getByRole("heading", { name: /Confirm your (digital )?identity/ }).first(), async () => {
        await click(["I'll verify later", "Skip verification for now", "Close"])();
        await click(["I'll verify later"])();
    }, { noWaitAfter: true });
    await page.addLocatorHandler(toast("Enable desktop notifications"), click(["Dismiss", "Not now"]), { noWaitAfter: true });
    await page.addLocatorHandler(toast("Help improve Element"), click(["No", "Not now", "Dismiss"]), { noWaitAfter: true });
    await page.addLocatorHandler(toast("Set up recovery"), click(["Dismiss", "Not now"]), { noWaitAfter: true });
    await page.addLocatorHandler(toast("Turn on key storage"), click(["Dismiss", "Not now"]), { noWaitAfter: true });
    await page.addLocatorHandler(toast("Verify this device"), click(["Later", "I'll verify later", "Dismiss"]), { noWaitAfter: true });
    await page.addLocatorHandler(dialog("Are you sure"), click(["I'll verify later"]), { noWaitAfter: true });
}

/** Load Element; retry its sporadic "misconfigured / Unexpected error preparing the app" first load. Never waits for networkidle. */
export async function gotoElement(page, origin, log, tag, { reload = false, attempts = 5 } = {}) {
    for (let a = 0; a < attempts; a++) {
        if (a === 0 && !reload) await page.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        else await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
        const deadline = Date.now() + 20_000;
        let bad = false;
        while (Date.now() < deadline) {
            const body = await page.evaluate(() => document.body?.innerText ?? "").catch(() => "");
            if (/misconfigured|Unexpected error preparing the app/i.test(body)) {
                bad = true;
                break;
            }
            if (body.length > 20 || (await page.evaluate(() => !!window.mxMatrixClientPeg?.get?.()).catch(() => false))) return;
            await sleep(150);
        }
        if (!bad) return;
        log?.(`[${tag}] Element load error, retry ${a + 1}`);
        await sleep(1500);
    }
    throw new Error(`[${tag}] Element did not load`);
}
