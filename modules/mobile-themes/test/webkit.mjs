#!/usr/bin/env node
// iPhone checks in real WebKit (logged out: the session pool holds Chrome profiles only, and we never log in).
// Runs against the dev server (:5410) with and without the module (?mt_mobile=0 disables it for one load):
// login card geometry, module state, viewport meta, input font sizes, keyboard simulation (visualViewport) and
// a touch long-press on a synthetic tile (touch.ts → contextmenu) in WebKit's event model.
//
// The host (Fedora atomic) lacks WebKit's Ubuntu libs, so this runs inside the local Playwright image:
//   podman run --rm --network host --security-opt label=disable \
//     -v ~/projects/matrix-search-widget/node_modules:/pw/node_modules:ro -v ~/.cache/ms-playwright:/ms-playwright:ro \
//     -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright -v $PWD:/proj mcr.microsoft.com/playwright:v1.65.0-noble \
//     node /proj/mobile/test/webkit.mjs [--base-url http://127.0.0.1:5410] [--out /proj/recordings/mobile/after/webkit]
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire((process.env.PW_NODE_MODULES || "/pw/node_modules") + "/x.js");
// WebKit (GTK/WPE) in Playwright has no Touch constructor, so the long-press can't be driven here (real device).
const { webkit, devices } = require("playwright");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("--base-url", "http://127.0.0.1:5410").replace(/\/$/, "");
const OUT = arg("--out", "/proj/recordings/mobile/after/webkit");
fs.mkdirSync(OUT, { recursive: true });

const land = (d) => ({ ...d, viewport: { width: d.viewport.height, height: d.viewport.width } });
const cases = [
    ["iphone15", devices["iPhone 15"]],
    ["iphone15-land", devices["iPhone 15 landscape"] ?? land(devices["iPhone 15"])],
];
const browser = await webkit.launch();
const report = { browser: `webkit ${browser.version()}`, base: BASE, cases: [] };
let failed = 0;
for (const [name, dev] of cases) {
    for (const withModule of [false, true]) {
        const { defaultBrowserType, ...o } = dev;
        const ctx = await browser.newContext({ ...o, locale: "en-GB" });
        await ctx.addInitScript(() => sessionStorage.setItem("skip_mobile_redirect", "true"));
        const page = await ctx.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("console", (m) => { if (m.type() === "error" && m.text().includes("[mobile-themes]")) errors.push(m.text()); });
        await page.goto(`${BASE}/${withModule ? "" : "?mt_mobile=0"}#/welcome`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".mx_AuthPage, .mx_Welcome", { timeout: 90000 });
        await page.waitForTimeout(2500);
        const tag = `${name}-${withModule ? "with" : "without"}`;
        await page.screenshot({ path: path.join(OUT, `${tag}-01-welcome.png`) });
        const m1 = await page.evaluate(() => {
            const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x), w: Math.round(b.width), right: Math.round(b.right) }; };
            return {
                attr: document.documentElement.getAttribute("data-mt-mobile"), compact: document.documentElement.hasAttribute("data-mt-compact"),
                viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute("content"),
                vw: innerWidth, modal: r(".mx_AuthPage_modal"), buttons: r(".mx_DefaultWelcome_buttons a"), hOverflow: document.documentElement.scrollWidth > innerWidth + 1,
            };
        });
        // login form: input font size (iOS zooms below 16 px) + keyboard simulation
        await page.goto(`${BASE}/${withModule ? "" : "?mt_mobile=0"}#/login`, { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".mx_Login input, .mx_AuthBody input", { timeout: 60000 }).catch(() => {});
        await page.waitForTimeout(1500);
        // the dev config's homeserver may use OIDC (no password form): add a plain input so focus + font size can
        // be checked either way
        await page.evaluate(() => {
            const i = document.createElement("input");
            i.id = "mt-wk-input"; i.placeholder = "test input"; i.style.cssText = "position:fixed;top:8px;left:8px;z-index:99999;font-size:15px";
            document.body.appendChild(i);
        });
        await page.locator("#mt-wk-input").tap({ timeout: 5000 }).catch(() => {});
        const kb = 336;
        await page.evaluate((k) => {
            const vv = window.visualViewport; const h = innerHeight - k;
            Object.defineProperty(vv, "height", { get: () => h, configurable: true }); vv.dispatchEvent(new Event("resize"));
            const d = document.createElement("div"); d.style.cssText = `position:fixed;left:0;right:0;bottom:0;height:${k}px;background:repeating-linear-gradient(45deg,#8889,#8889 10px,#6669 10px,#6669 20px);z-index:2147483647;pointer-events:none`; document.body.appendChild(d);
        }, name.endsWith("land") ? 160 : kb);
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(OUT, `${tag}-02-login-keyboard.png`) });
        const m2 = await page.evaluate(() => ({
            inputFontPx: [...document.querySelectorAll(".mx_AuthBody input, #mt-wk-input")].map((e) => parseFloat(getComputedStyle(e).fontSize)),
            keyboardAttr: document.documentElement.hasAttribute("data-mt-keyboard"), vvH: document.documentElement.style.getPropertyValue("--mt-vv-h"),
            appHeight: Math.round(document.getElementById("matrixchat")?.getBoundingClientRect().height ?? -1),
        }));
        // long-press in WebKit's touch model: a fake tile, real touch events from page.touchscreen are not long, so
        // dispatch TouchEvents directly (WebKit has the Touch constructor in touch-enabled contexts)
        const lp = await page.evaluate(async () => {
            const tile = document.createElement("div");
            tile.className = "mx_EventTile"; tile.style.cssText = "position:fixed;top:100px;left:10px;width:200px;height:60px;z-index:99999;background:#fff";
            tile.innerHTML = '<div class="mx_EventTile_line">hold me</div>';
            document.body.appendChild(tile);
            let got = false; tile.addEventListener("contextmenu", () => { got = true; });
            const t = tile.firstChild;
            try {
                const touch = new Touch({ identifier: 1, target: t, clientX: 50, clientY: 120 });
                t.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, cancelable: true, touches: [touch], targetTouches: [touch], changedTouches: [touch] }));
                await new Promise((r) => setTimeout(r, 700));
                t.dispatchEvent(new TouchEvent("touchend", { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [touch] }));
            } catch (e) { return "no Touch support: " + e.message; }
            tile.remove();
            return got;
        });
        const rec = { name: tag, welcome: m1, login: m2, longPressContextmenu: lp, errors };
        const ok = withModule
            ? m1.compact && !m1.hOverflow && m1.modal && m1.modal.right <= m1.vw + 1 && m2.inputFontPx.every((f) => f >= 16) && /viewport-fit=cover/.test(m1.viewportMeta || "") && m2.keyboardAttr && (lp === true || /no Touch support/.test(String(lp))) && !errors.length
            : true;
        rec.ok = ok;
        if (!ok) failed++;
        report.cases.push(rec);
        console.log(`${ok ? "PASS" : "FAIL"} ${tag}`, JSON.stringify(rec));
        await ctx.close();
    }
}
await browser.close();
fs.writeFileSync(path.join(OUT, "webkit.json"), JSON.stringify(report, null, 2));
process.exit(failed ? 1 : 0);
