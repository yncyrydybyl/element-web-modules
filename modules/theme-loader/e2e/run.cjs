// End-to-end check of the theme loader against the dev server (http://127.0.0.1:5400) and matrix.datanauten.de.
//
//   NODE_PATH=~/projects/matrix-search-widget/node_modules node e2e/run.cjs [--user themes-mira] [--headed]
//
// Logs in through MAS (compat SSO) with a test user from .state/users.txt (never printed), switches the _demo
// themes via the Themes tab, the quick switcher and ?tl_theme, forces daylight phases, checks account-data
// persistence across reloads, checks that "Element default" restores Element exactly, and fails on any
// [theme-loader] console error or page error. Screenshots go to recordings/loader/.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BASE = process.env.TL_DEV_URL ?? "http://127.0.0.1:5400/";
const OUT = path.join(ROOT, "recordings/loader");
// Fresh profile per run (a reused, half-verified session lands on Element's "Confirm your identity" page);
// the device is logged out at the end so test runs don't pile up sessions on the account.
const PROFILE = path.join(ROOT, `.dev/pw-profile-${process.pid}`);
const args = process.argv.slice(2);
const userArg = args.includes("--user") ? args[args.indexOf("--user") + 1] : null;
const users = fs
    .readFileSync(path.join(ROOT, ".state/users.txt"), "utf8")
    .trim()
    .split("\n")
    .map((l) => l.trim().split(/\s+/));
const [USER, PASSWORD] = users.find(([u]) => !userArg || u === userArg) ?? users[0];

fs.mkdirSync(OUT, { recursive: true });
const results = [];
function check(name, ok, detail = "") {
    results.push({ name, ok: !!ok, detail });
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${String(detail).slice(0, 300)})` : ""}`);
}

const consoleErrors = [];
const loaderErrors = [];
const pageErrors = [];

async function shot(page, name) {
    await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}

async function state(page) {
    return page.evaluate(() => {
        const h = document.documentElement;
        const attrs = {};
        for (const a of h.getAttributeNames()) if (a.startsWith("data-tl")) attrs[a] = h.getAttribute(a);
        const cs = (sel, props) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const s = getComputedStyle(el);
            return props.map((p) => s.getPropertyValue(p)).join(" | ");
        };
        return {
            attrs,
            bodyClass: [...document.body.classList].filter((c) => c.startsWith("cpd-theme")).join(" "),
            tlNodes: [...document.querySelectorAll("style[id^='tl-'], style.tl-css, #tl-overlay-root")].map((n) => n.id || n.className),
            styles: {
                body: cs("body", ["background-color", "color", "font-family"]),
                leftPanel: cs(".mx_LeftPanel_outerWrapper", ["background-color", "background-image"]),
                roomList: cs(".mx_RoomListPanel", ["background-color"]),
                spacePanel: cs(".mx_SpacePanel", ["background-color"]),
                header: cs(".mx_RoomHeader", ["border-bottom", "background-color"]),
                tokens: (() => {
                    const s = getComputedStyle(document.body);
                    return ["--cpd-color-bg-canvas-default", "--cpd-color-text-primary", "--cpd-font-family-sans"].map((t) => s.getPropertyValue(t).trim()).join(" | ");
                })(),
            },
            badge: document.querySelector("[data-tl-demo-badge]")?.textContent ?? null,
            fontReady: document.fonts.check('12px "TL Demo Fira Code"'),
        };
    });
}

async function accountData(page) {
    return page.evaluate(() => {
        const cli = window.mxMatrixClientPeg?.get?.();
        return cli?.getAccountData("de.datanauten.theme_loader")?.getContent() ?? null;
    });
}

/** Element's "open in another window" session lock (left over from an earlier run): take the session. */
async function takeSessionLock(page) {
    if (!(await page.getByText("open in another window").count())) return;
    await page.getByRole("button", { name: "Continue" }).first().click().catch(() => {});
}

async function waitForApp(page) {
    for (let i = 0; i < 60; i++) {
        if (await page.locator(".mx_MatrixChat, .mx_AuthPage").count()) return;
        await takeSessionLock(page);
        await page.waitForTimeout(1000);
    }
    throw new Error("Element did not start");
}

async function login(page) {
    await page.goto(BASE);
    await waitForApp(page);
    // Logged in already (the "Confirm your digital identity" step is also an AuthPage, but inside MatrixChat).
    if (await page.locator(".mx_MatrixChat").count()) return;
    await page.goto(`${BASE}#/login`);
    await page.getByRole("button", { name: "Continue" }).click({ timeout: 30000 });
    await page.waitForURL(/matrix\.datanauten\.de\/auth\//, { timeout: 30000 });
    if (await page.locator('input[name="username"]').count()) {
        await page.locator('input[name="username"]').fill(USER);
        await page.locator('input[name="password"]').fill(PASSWORD);
        await page.locator('button[type="submit"]').first().click();
    }
    await page.getByRole("button", { name: "Continue" }).first().click({ timeout: 30000 });
    await page.waitForURL((u) => u.href.startsWith(BASE), { timeout: 60000 });
    for (let i = 0; i < 90 && !(await page.locator(".mx_MatrixChat").count()); i++) {
        // Account with cross-signing: Element asks to verify this new device; skip it (closes with X).
        // Cross-signing set up (e.g. by the test tooling, key in .state/<user>.recovery): verify with the recovery key.
        const recFile = path.join(ROOT, `.state/${USER}.recovery`);
        if ((await page.locator(".mx_CompleteSecurityBody").count()) && fs.existsSync(recFile)) {
            const useKey = page.getByRole("button", { name: "Use recovery key" });
            if (await useKey.count()) {
                await useKey.click();
                const input = page.locator(".mx_CompleteSecurityBody input, .mx_Dialog input").first();
                await input.waitFor({ timeout: 10000 });
                await input.fill(fs.readFileSync(recFile, "utf8").trim().split(/\s*\n/)[0]);
                await page.getByRole("button", { name: /^(Continue|Verify)/ }).first().click().catch(() => {});
                await page.waitForTimeout(4000);
                const done = page.getByRole("button", { name: /^(Done|Continue)$/ });
                if (await done.count()) await done.first().click().catch(() => {});
            }
        }
        const skip = page.locator(".mx_CompleteSecurity_skip, .mx_AuthPage .mx_Dialog_cancelButton");
        if (await skip.count()) await skip.first().click().catch(() => {});
        const confirm = page.getByRole("button", { name: /^(Skip verification|I'll verify later|Skip|Yes, skip)/ });
        if (await confirm.count()) await confirm.first().click().catch(() => {});
        await page.waitForTimeout(1000);
    }
    await page.waitForSelector(".mx_MatrixChat", { timeout: 10000 });
}

async function dismissNoise(page) {
    for (let i = 0; i < 4; i++) {
        const btn = page.locator(
            [".mx_Toast_toast button:has-text('Dismiss')", ".mx_Toast_toast button:has-text('Later')", ".mx_Toast_toast button:has-text('Not now')", ".mx_Toast_toast button:has-text('Close')"].join(", "),
        );
        if (await btn.count()) await btn.first().click().catch(() => {});
        // Crypto onboarding dialogs on a fresh device
        const skip = page.locator(".mx_Dialog button:has-text('Yes, dismiss'), .mx_Dialog button:has-text('Skip'), .mx_Dialog button:has-text('Cancel'), .mx_Dialog button:has-text('Later'), .mx_Dialog button:has-text('Not now')");
        if (await skip.count()) await skip.first().click().catch(() => {});
        // "Confirm your digital identity" and similar crypto nags: close them (never our own dialogs).
        const close = page.locator(".mx_Dialog:not(:has(.tl-ui)) .mx_Dialog_cancelButton");
        if (await close.count()) await close.first().click().catch(() => {});
        await page.waitForTimeout(400);
    }
}

async function openThemesTab(page) {
    await dismissNoise(page);
    await page.evaluate(() => window.mxDispatcher.dispatch({ action: "view_user_settings" }));
    await page.waitForSelector(".mx_UserSettingsDialog .tl-tab-label", { timeout: 15000 });
    await page.click(".mx_UserSettingsDialog .tl-tab-label");
    await page.waitForSelector(".tl-tab", { state: "visible" });
}

async function closeDialog(page) {
    await page.keyboard.press("Escape");
    await page.waitForSelector(".mx_UserSettingsDialog", { state: "detached", timeout: 5000 }).catch(() => {});
}

async function reload(page, query = "") {
    await page.goto(`${BASE}${query}`);
    await waitForApp(page);
    await page.waitForSelector(".mx_MatrixChat", { timeout: 90000 });
    await page.waitForTimeout(2500);
}

(async () => {
    const launch = { headless: !args.includes("--headed"), viewport: { width: 1400, height: 860 } };
    if (process.env.TL_CHROME) launch.executablePath = process.env.TL_CHROME;
    const ctx = await chromium.launchPersistentContext(PROFILE, launch);
    const page = ctx.pages()[0] ?? (await ctx.newPage());
    page.on("console", (m) => {
        const t = m.text();
        if (m.type() === "error") {
            consoleErrors.push(t.slice(0, 300));
            if (t.includes("[theme-loader]")) loaderErrors.push(t.slice(0, 300));
        } else if (m.type() === "warning" && t.includes("[theme-loader]")) {
            console.log("  loader warning:", t.slice(0, 200));
        }
    });
    page.on("pageerror", (e) => pageErrors.push(e.message));

    try {
        await login(page);
        check("logged in via MAS", await page.locator(".mx_MatrixChat").count());
        await page.waitForTimeout(3000);
        await dismissNoise(page);

        // ---- start from Element default ------------------------------------------------------------------
        await page.goto(`${BASE}#/home`);
        await page.waitForTimeout(1500);
        await openThemesTab(page);
        await page.click('.tl-card[data-tl-variant=""]');
        await page.waitForTimeout(1500);
        await closeDialog(page);
        await page.waitForTimeout(1500);
        const baseline = await state(page);
        check("Element default: no loader attributes", Object.keys(baseline.attrs).length === 0, JSON.stringify(baseline.attrs));
        await shot(page, "01-element-default");

        // ---- Themes tab --------------------------------------------------------------------------------------
        await openThemesTab(page);
        await shot(page, "02-themes-tab");
        const familySections = await page.locator("[data-tl-family-section]").count();
        check("gallery groups by family", familySections >= 1, `${familySections} families`);

        await page.click('.tl-card[data-tl-variant="demo-mint-light"]');
        await page.waitForTimeout(1200);
        let s = await state(page);
        check("mint applied via tab", s.attrs["data-tl-theme"] === "demo-mint-light" && s.attrs["data-tl-family"] === "_demo", JSON.stringify(s.attrs));
        check("mint tokens active", s.styles.tokens.startsWith("#f7fdf9"), s.styles.tokens);
        check("mint has no phase attribute", !("data-tl-phase" in s.attrs));
        await shot(page, "03-tab-mint");

        // filter by mode
        await page.click('.tl-chips >> text="Daylight"');
        const visibleCards = await page.locator('[data-tl-family-section="_demo"] .tl-card').count();
        const nonDaylight = await page.evaluate(() => [...document.querySelectorAll(".tl-grid .tl-card")].length);
        check("mode filter (daylight) shows only night-owl of _demo", visibleCards === 1, `${visibleCards} demo cards, ${nonDaylight} total`);
        await page.click('.tl-chips >> text="Daylight"');

        await page.click('.tl-card[data-tl-variant="demo-night-owl"]');
        await page.waitForTimeout(2500);
        s = await state(page);
        check("night-owl applied via tab", s.attrs["data-tl-theme"] === "demo-night-owl", JSON.stringify(s.attrs));
        check("night-owl has a phase", !!s.attrs["data-tl-phase"], s.attrs["data-tl-phase"]);
        check("night-owl font loaded", s.fontReady && /TL Demo Fira Code/.test(s.styles.body), s.styles.body);
        check("night-owl enhancer mounted", !!s.badge, s.badge);
        check("theme CSS inline", s.tlNodes.filter((n) => n === "tl-css").length === 2, s.tlNodes.join(","));
        await shot(page, "04-tab-night-owl");
        await closeDialog(page);
        await page.waitForTimeout(1000);
        await shot(page, "05-night-owl-main");

        // ---- persistence ---------------------------------------------------------------------------------------
        let ad = await accountData(page);
        check("account data saved", ad?.theme === "demo-night-owl", JSON.stringify(ad));
        await page.evaluate(() => {
            localStorage.removeItem("tl.theme");
            localStorage.removeItem("tl.cssCache");
        });
        await reload(page);
        await page.waitForFunction(() => document.documentElement.getAttribute("data-tl-theme") === "demo-night-owl", null, { timeout: 30000 }).catch(() => {});
        s = await state(page);
        check("theme restored from account data after reload (local cache cleared)", s.attrs["data-tl-theme"] === "demo-night-owl", JSON.stringify(s.attrs));
        await reload(page);
        s = await state(page);
        check("theme applied from cache on next reload", s.attrs["data-tl-theme"] === "demo-night-owl");

        // ---- daylight phases --------------------------------------------------------------------------------
        for (const phase of ["dawn", "day", "dusk", "night"]) {
            await reload(page, `?tl_phase=${phase}`);
            await page.waitForTimeout(1000);
            s = await state(page);
            const wantBase = phase === "day" ? "light" : "dark";
            check(`?tl_phase=${phase}`, s.attrs["data-tl-phase"] === phase && s.attrs["data-tl-base"] === wantBase, JSON.stringify(s.attrs));
            check(`  Element base follows (${wantBase})`, s.bodyClass.startsWith(`cpd-theme-${wantBase}`), s.bodyClass);
            check(`  enhancer onPhase (${phase})`, s.badge?.includes(phase), s.badge);
            await shot(page, `06-phase-${phase}`);
        }
        await page.evaluate(() => localStorage.setItem("tl.forcePhase", "day"));
        await reload(page);
        s = await state(page);
        check('localStorage["tl.forcePhase"]=day', s.attrs["data-tl-phase"] === "day", JSON.stringify(s.attrs));
        await page.evaluate(() => localStorage.removeItem("tl.forcePhase"));

        // ---- ?tl_theme override (not persisted) -----------------------------------------------------------------
        await reload(page, "?tl_theme=demo-mint-light");
        s = await state(page);
        check("?tl_theme=demo-mint-light applied", s.attrs["data-tl-theme"] === "demo-mint-light");
        ad = await accountData(page);
        check("?tl_theme not persisted", ad?.theme === "demo-night-owl", JSON.stringify(ad));
        await shot(page, "07-url-override-mint");
        await reload(page);
        s = await state(page);
        check("without ?tl_theme the saved theme is back", s.attrs["data-tl-theme"] === "demo-night-owl");

        // ---- quick switcher (keyboard + room header button) -------------------------------------------------
        await page.keyboard.press("Alt+Shift+KeyT");
        await page.waitForSelector(".tl-quick", { timeout: 5000 });
        await shot(page, "08-quick-switcher");
        await page.keyboard.press("ArrowDown");
        await page.waitForTimeout(800);
        const previewed = (await state(page)).attrs["data-tl-theme"] ?? null;
        await page.keyboard.press("Escape");
        await page.waitForTimeout(800);
        s = await state(page);
        check("quick switcher: arrow previews, Esc reverts", previewed !== "demo-night-owl" && s.attrs["data-tl-theme"] === "demo-night-owl", `previewed ${previewed}`);
        await page.keyboard.press("Alt+Shift+KeyT");
        await page.waitForSelector(".tl-quick");
        await page.keyboard.type("mint");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(1500);
        s = await state(page);
        ad = await accountData(page);
        check("quick switcher: Enter applies + saves", s.attrs["data-tl-theme"] === "demo-mint-light" && ad?.theme === "demo-mint-light", JSON.stringify(ad));

        await page.waitForSelector(".mx_RoomListItemView", { timeout: 20000 }).catch(() => {});
        const room = page.locator(".mx_RoomListItemView").first();
        if (await room.count()) {
            await room.click();
            await page.waitForSelector(".mx_RoomHeader", { timeout: 15000 }).catch(() => {});
            const btn = page.locator(".mx_RoomHeader [data-tl-quick-switch]");
            check("room header button present", (await btn.count()) === 1);
            if (await btn.count()) {
                await btn.click();
                await page.waitForSelector(".tl-quick", { timeout: 5000 });
                await shot(page, "09-room-header-quick-switcher");
                await page.keyboard.press("Escape");
            }
        } else console.log("  (no room to test the header button)");

        // ---- back to Element default: exact restore -------------------------------------------------------
        await openThemesTab(page);
        await page.click('.tl-card[data-tl-variant=""]');
        await page.waitForTimeout(1500);
        await closeDialog(page);
        await page.goto(`${BASE}#/home`); // same view as the baseline
        await page.waitForSelector(".mx_MatrixChat");
        await page.waitForTimeout(3000);
        const after = await state(page);
        check("restore: no loader attributes", Object.keys(after.attrs).length === 0, JSON.stringify(after.attrs));
        check("restore: only the loader's own UI style remains", after.tlNodes.join(",") === "tl-loader-style", after.tlNodes.join(","));
        check("restore: Element base class identical", after.bodyClass === baseline.bodyClass, `${baseline.bodyClass} -> ${after.bodyClass}`);
        const diffs = Object.keys(baseline.styles).filter((k) => baseline.styles[k] !== after.styles[k]);
        check("restore: computed styles identical", diffs.length === 0, diffs.map((k) => `${k}: ${baseline.styles[k]} -> ${after.styles[k]}`).join("; "));
        ad = await accountData(page);
        check("restore: account data says Element default", ad && ad.theme === null, JSON.stringify(ad));
        await shot(page, "10-element-default-restored");
    } catch (e) {
        check("test run", false, e.message.split("\n")[0]);
        await shot(page, "zz-failure").catch(() => {});
    }

    check("no [theme-loader] console errors", loaderErrors.length === 0, loaderErrors.join(" || "));
    check("no page errors", pageErrors.length === 0, pageErrors.join(" || "));
    if (consoleErrors.length) {
        console.log(`\nother console errors (Element/network, ${consoleErrors.length}):`);
        for (const e of [...new Set(consoleErrors)].slice(0, 15)) console.log("  -", e.split("\n")[0].slice(0, 200));
    }
    await page.evaluate(() => window.mxMatrixClientPeg?.get?.()?.logout(true)).catch(() => {});
    await ctx.close();
    fs.rmSync(PROFILE, { recursive: true, force: true });
    const failed = results.filter((r) => !r.ok);
    fs.writeFileSync(path.join(OUT, "e2e-results.json"), JSON.stringify({ when: new Date().toISOString(), user: USER, results, otherConsoleErrors: [...new Set(consoleErrors)] }, null, 2));
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
    process.exit(failed.length ? 1 : 0);
})();
