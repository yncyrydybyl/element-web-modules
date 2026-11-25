#!/usr/bin/env node
// Smoke test: the module loads in Element 1.12.33 (dev server, logged out) without errors, sets html[data-mt-mobile]
// on phones / coarse pointers and not on desktop, and injects its stylesheet exactly once.
//
//   npm run dev &   (or MT_DEV_MODE=prod for dist/)
//   NODE_PATH=~/projects/matrix-search-widget/node_modules node test/smoke.mjs [--base-url http://127.0.0.1:5410]
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(path.join(process.env.NODE_PATH?.split(":")[0] || ".", "x.js"));
const { chromium, devices } = require("playwright");
const argi = process.argv.indexOf("--base-url");
const BASE = (argi > 0 ? process.argv[argi + 1] : "http://127.0.0.1:5410").replace(/\/$/, "");

const cases = [
    { name: "desktop 1440x900", opts: { viewport: { width: 1440, height: 900 } }, expect: null },
    { name: "desktop narrow 700x900", opts: { viewport: { width: 700, height: 900 } }, expect: "narrow" },
    { name: "iPhone 15", opts: devices["iPhone 15"], expect: "narrow coarse" },
    { name: "Pixel 8 landscape", opts: { ...devices["Pixel 8"], viewport: { width: 839, height: 412 } }, expect: "coarse" },
    { name: "desktop forced ?mt_mobile=1", opts: { viewport: { width: 1440, height: 900 } }, expect: "forced", query: "?mt_mobile=1" },
];

const browser = await chromium.launch({ headless: true });
let failed = 0;
for (const c of cases) {
    const { defaultBrowserType, ...o } = c.opts;
    const ctx = await browser.newContext(o);
    // Element would send mobile UAs to /mobile_guide/ before modules load; do what its "desktop site" link does.
    await ctx.addInitScript(() => sessionStorage.setItem("skip_mobile_redirect", "true"));
    const page = await ctx.newPage();
    const errors = [];
    const infos = [];
    page.on("console", (m) => {
        const t = m.text();
        if (t.includes("[mobile-themes]")) (m.type() === "error" ? errors : infos).push(t);
    });
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    await page.goto(BASE + "/" + (c.query || ""), { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".mx_AuthPage, .mx_Welcome, .mx_MatrixChat", { timeout: 60000 }).catch(() => errors.push("Element did not render"));
    await page.waitForTimeout(800);
    const st = await page.evaluate(() => ({
        attr: document.documentElement.getAttribute("data-mt-mobile"),
        pointer: document.documentElement.getAttribute("data-mt-pointer"),
        styles: document.querySelectorAll("style#mt-mobile-style").length,
        active: getComputedStyle(document.documentElement).getPropertyValue("--mt-active").trim(),
        elementError: !!document.querySelector(".mx_ErrorView, .mx_GenericErrorPage"),
    }));
    const okAttr = c.expect === null ? st.attr === null : (st.attr || "").split(" ").some((r) => c.expect.split(" ").includes(r)) && (c.expect === "forced" || st.attr === c.expect);
    const ok = okAttr && st.styles === 1 && !errors.length && !st.elementError && infos.some((i) => i.includes("loaded")) && (st.attr === null ? st.active === "" : st.active === "1");
    if (!ok) failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${c.name.padEnd(28)} data-mt-mobile=${JSON.stringify(st.attr)} pointer=${st.pointer} styles=${st.styles} --mt-active=${JSON.stringify(st.active)}${errors.length ? " errors=" + JSON.stringify(errors) : ""}`);
    await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
