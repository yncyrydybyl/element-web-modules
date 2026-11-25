// Live check of a deployed mobile-themes + replacement /mobile_guide/ (no interception, logged out):
// phone UA → Element redirects to /mobile_guide/ → our page → "Continue in the browser" → Element login in mobile
// mode; a new tab skips the guide (remembered choice); ?mobile_web=0 shows it again. Desktop gets no mobile mode.
//
//   NODE_PATH=~/projects/matrix-search-widget/node_modules node mobile/e2e/live-guide.mjs \
//       [--base-url https://element.datanauten.de] [--out recordings/mobile/live]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const H = await import(path.join(path.dirname(fileURLToPath(import.meta.url)), "../../theme-loader/qa/harness/lib.mjs"));
const { chromium, devices } = H.req("playwright");

const args = Object.fromEntries(process.argv.slice(2).join(" ").split("--").filter(Boolean).map((s) => s.trim().split(/\s+/)));
const base = (args["base-url"] || "https://element.datanauten.de").replace(/\/$/, "");
const out = path.join(args.out || "recordings/mobile/live", new URL(base).hostname);
fs.mkdirSync(out, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`); };

const browser = await chromium.launch();
for (const [label, dev] of [["iphone15", devices["iPhone 15"]], ["pixel8", devices["Pixel 7"]]]) {
    const ctx = await browser.newContext({ ...dev });
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/mobile_guide/, { timeout: 30000 }).catch(() => {});
    const onGuide = /mobile_guide/.test(page.url()) && (await page.locator("text=Continue in the browser").count()) > 0;
    check(`${label}: redirected to our guide`, onGuide, page.url());
    await page.screenshot({ path: path.join(out, `${label}-1-guide.png`) });
    if (onGuide) {
        const store = await page.locator("#store").getAttribute("href");
        check(`${label}: store link matches platform`, label === "iphone15" ? /apple\.com/.test(store) : /play\.google/.test(store), store);
        await page.click("text=Continue in the browser");
        await page.waitForURL(/#\/(home|login|welcome)/, { timeout: 30000 }).catch(() => {});
        await page.waitForSelector(".mx_AuthPage, .mx_MatrixChat, .mx_Welcome", { timeout: 60000 }).catch(() => {});
        await page.waitForTimeout(3000);
        const mt = await page.evaluate(() => document.documentElement.getAttribute("data-mt-mobile"));
        check(`${label}: Element loads after Continue`, !/mobile_guide/.test(page.url()) && (await page.locator(".mx_AuthPage, .mx_MatrixChat, .mx_Welcome").count()) > 0, page.url());
        check(`${label}: mobile-themes active`, !!mt, `data-mt-mobile=${mt}`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        check(`${label}: no sideways scroll`, overflow <= 1, `${overflow}px`);
        await page.screenshot({ path: path.join(out, `${label}-2-app.png`) });

        const tab = await ctx.newPage();
        await tab.goto(`${base}/`, { waitUntil: "domcontentloaded" });
        await tab.waitForTimeout(4000);
        await tab.waitForSelector(".mx_AuthPage, .mx_MatrixChat, .mx_Welcome", { timeout: 60000 }).catch(() => {});
        check(`${label}: new tab skips the guide`, !/mobile_guide/.test(tab.url()), tab.url());
        await tab.goto(`${base}/mobile_guide/?mobile_web=0`, { waitUntil: "domcontentloaded" });
        await tab.waitForTimeout(1500);
        check(`${label}: ?mobile_web=0 shows the guide again`, (await tab.locator("text=Continue in the browser").count()) > 0, tab.url());
    }
    await ctx.close();
}
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const dp = await desk.newPage();
await dp.goto(`${base}/`, { waitUntil: "domcontentloaded" });
await dp.waitForSelector(".mx_AuthPage, .mx_MatrixChat, .mx_Welcome", { timeout: 60000 }).catch(() => {});
await dp.waitForTimeout(3000);
if (new URL(dp.url()).host !== new URL(base).host) {
    // e.g. openDesk: Element forwards logged-out desktop visitors straight to the SSO login
    console.log(`SKIP desktop: left Element for ${new URL(dp.url()).host}`);
} else {
    const loaded = await dp.evaluate(() => performance.getEntriesByType("resource").some((r) => /mobile-themes\/index\.js/.test(r.name)));
    check("desktop: module loaded", loaded);
    check("desktop: no mobile mode", !(await dp.evaluate(() => document.documentElement.hasAttribute("data-mt-mobile"))));
}
await dp.screenshot({ path: path.join(out, "desktop.png") });
await browser.close();
fs.writeFileSync(path.join(out, "result.json"), JSON.stringify({ base, at: new Date().toISOString(), results }, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} pass → ${out}`);
process.exit(failed ? 1 : 0);
