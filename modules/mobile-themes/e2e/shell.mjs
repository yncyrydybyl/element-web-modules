#!/usr/bin/env node
// Before/after check of the mobile-themes fixes: runs the same phone flow without and with the module (injected by
// request interception, nothing deployed) and writes
//   recordings/mobile/after/<device>/without/NN-name.png   Element as it is
//   recordings/mobile/after/<device>/with/NN-name.png      with the module
//   recordings/mobile/after/<device>/compare.png           side-by-side sheet (needs python3 + PIL; skipped otherwise)
//   recordings/mobile/after/<device>/result.json           per step: ok/error, measure() metrics, module state
//
//   NODE_PATH=~/projects/matrix-search-widget/node_modules node mobile/e2e/shell.mjs \
//       [--device iphone15,pixel8,iphone15-land,pixel8-land|all] [--base-url https://element.datanauten.de]
//       [--theme <tl_theme id>] [--only with|without] [--out recordings/mobile/after]
//
// Session pool rules as in audit.mjs: exclusive slot, no login, no messages/reactions; mx_local_settings restored.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as h from "./mtlib.mjs";

const a = h.parseArgs(process.argv.slice(2), { device: "iphone15,pixel8,iphone15-land,pixel8-land", baseUrl: "https://element.datanauten.de" });
const BASE = a.baseUrl.replace(/\/$/, "");
const which = a.device === "all" ? ["iphone15", "iphone15-land", "pixel8", "pixel8-land"] : String(a.device).split(",");
const OUTROOT = path.resolve(h.ROOT, a.out || "recordings/mobile/after");
const variants = a.only ? [a.only] : ["without", "with"];

async function flow(page, d, dir, withModule) {
    const R = h.fixtures().rooms;
    const results = [];
    const step = async (name, fn, { onlyWith = false } = {}) => {
        if (onlyWith && !withModule) return;
        const rec = { name, ok: true };
        try {
            await fn();
            await h.sleep(700);
        } catch (e) {
            rec.ok = false;
            rec.error = String(e.message || e).split("\n")[0].slice(0, 240);
        }
        try { rec.metrics = await page.evaluate(h.measure); } catch { /* */ }
        await page.screenshot({ path: path.join(dir, name + ".png"), animations: "disabled", caret: "hide", scale: "css" }).catch(() => {});
        results.push(rec);
        h.log(withModule ? "[with]" : "[without]", rec.ok ? "✓" : "✗", name, rec.error || "", rec.metrics?.mt?.view ? `view=${rec.metrics.mt.view}` : "");
    };
    const tapText = async (scope, text) => {
        const l = page.locator(scope).getByText(text, { exact: true }).first();
        await l.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
        await h.sleep(300);
        const c = await h.center(l);
        await page.touchscreen.tap(c.x, c.y);
    };
    const tap = async (sel) => {
        const l = page.locator(sel).first();
        const c = await h.center(l);
        await page.touchscreen.tap(c.x, c.y);
    };

    await page.evaluate(() => window.mxDispatcher.dispatch({ action: "view_home_page" }));
    await h.sleep(800);
    await h.selectSpace(page, R.space);
    await step("01-start-list", async () => {});
    await step("02-tap-room", async () => {
        if (!withModule) {
            // without the module the list is collapsed to 0 px: open it the way a user can (drag the 12 px bar)
            const sep = page.locator(".mx_Separator").first();
            if (await sep.count()) {
                const c = await h.center(sep);
                await h.cdpSwipe(page, c.x, c.y, Math.min(d.viewport.width - 20, c.x + 300), c.y);
                await h.sleep(800);
            }
        }
        await tapText("#left-panel", "Showcase");
        await page.waitForFunction(() => document.querySelector(".mx_RoomView .mx_EventTile"), null, { timeout: 20000 });
        await h.sleep(1200);
    });
    await step("03-header-more", async () => {
        await tap(".mx_RoomHeader .mt-more");
    }, { onlyWith: true });
    if (withModule) await tap(".mx_RoomHeader .mt-more").catch(() => {});
    await step("04-back-to-list", async () => {
        await tap(".mx_RoomHeader .mt-back");
    }, { onlyWith: true });
    await step("05-reopen-room", async () => {
        await tapText("#left-panel", "Showcase");
        await h.sleep(1200);
    }, { onlyWith: true });
    if (!withModule) {
        // put the list away again so the room is usable (same as audit.mjs)
        await page.locator(".mx_Separator").first().focus().catch(() => {});
        for (let i = 0; i < 3; i++) await page.keyboard.press("Home").catch(() => {});
        await h.sleep(800);
    }
    await page.evaluate(() => { const p = document.querySelector(".mx_RoomView_messagePanel"); if (p) p.scrollTop = p.scrollHeight; });
    await h.sleep(600);
    await step("06-long-press", async () => {
        const t = page.locator(".mx_RoomView_messagePanel .mx_EventTile").filter({ hasText: "That's the full set" }).last();
        const c = await h.center(t.locator(".mx_EventTile_line, [class*='_line_']").first());
        await h.cdpLongPress(page, c.x, c.y, 800);
        await h.sleep(500);
        if (!(await page.locator(".mx_ContextualMenu").count())) throw new Error("no menu after long-press");
    });
    await h.closeOverlays(page);
    await page.evaluate(() => getSelection()?.removeAllRanges());
    await step("07-tap-message", async () => {
        const t = page.locator(".mx_RoomView_messagePanel .mx_EventTile").filter({ hasText: "That's the full set" }).last();
        const c = await h.center(t.locator(".mx_EventTile_line, [class*='_line_']").first());
        await page.touchscreen.tap(c.x, c.y);
    });
    await step("08-keyboard-visual", async () => {
        await tap(".mx_BasicMessageComposer_input, .mx_WysiwygComposer_Editor_content");
        await h.kbSim(page, d, "visual");
        await h.sleep(900);
    });
    await h.kbSim(page, d, null);
    await step("08b-keyboard-layout", async () => {
        await tap(".mx_BasicMessageComposer_input, .mx_WysiwygComposer_Editor_content");
        await h.kbSim(page, d, "layout");
        await h.sleep(900);
    });
    await h.kbSim(page, d, null);
    await page.evaluate(() => document.activeElement?.blur?.());
    await h.sleep(600);
    await step("09-thread-panel", async () => {
        await h.findTile(page, "which theme should be the default");
        await h.sleep(500);
        await tap(".mx_RoomView_messagePanel .mx_ThreadSummary, .mx_RoomView_messagePanel [class*='ThreadSummary']");
        await page.locator(".mx_ThreadView .mx_EventTile").first().waitFor({ timeout: 15000 });
        await h.sleep(800);
    });
    await step("10-back-gesture-from-panel", async () => {
        await page.goBack();
        await h.sleep(900);
    }, { onlyWith: true });
    await page.evaluate(() => window.mxSdkContext?.rightPanelStore?.hide?.(null)).catch(() => {});
    await h.sleep(500);
    await step("11-room-info", async () => {
        await tap(".mx_RoomHeader [class*='_icon-button_'][aria-label='Room info']");
        await page.locator(".mx_RightPanel").waitFor({ timeout: 8000 });
    });
    await page.evaluate(() => window.mxSdkContext?.rightPanelStore?.hide?.(null)).catch(() => {});
    await h.sleep(500);
    await step("12-room-settings", async () => {
        await page.evaluate((rid) => window.mxDispatcher.dispatch({ action: "open_room_settings", room_id: rid }), R.showcase);
        await page.locator(".mx_RoomSettingsDialog").waitFor();
    });
    await h.closeOverlays(page);
    await step("13-user-settings", async () => {
        await page.evaluate(() => window.mxDispatcher.dispatch({ action: "view_user_settings" }));
        await page.locator(".mx_UserSettingsDialog").waitFor();
    });
    await step("14-user-settings-appearance", async () => {
        await page.locator(".mx_UserSettingsDialog [role=tab]").filter({ hasText: /Appearance/ }).first().click();
    });
    await h.closeOverlays(page);
    await step("15-create-room", async () => {
        await page.evaluate(() => window.mxDispatcher.dispatch({ action: "view_create_room" }));
        await page.locator(".mx_CreateRoomDialog, .mx_Dialog").first().waitFor();
    });
    await h.closeOverlays(page);
    await step("16-emoji-picker", async () => {
        let e = page.locator(".mx_MessageComposer [aria-label='Emoji']").first();
        if (!(await e.count()) || !(await e.isVisible())) {
            await tap(".mx_MessageComposer [aria-label='More options']");
            await h.sleep(500);
            e = page.locator("[role=menuitem][aria-label='Emoji'], .mx_MessageComposer [aria-label='Emoji']").first();
        }
        const c = await h.center(e);
        await page.touchscreen.tap(c.x, c.y);
        await page.locator(".mx_EmojiPicker, [class*='mojiPicker'], .mx_ContextualMenu input").first().waitFor({ timeout: 6000 });
    });
    await h.closeOverlays(page);
    await step("17-spotlight", async () => {
        await page.keyboard.press("Control+k");
        await page.locator(".mx_SpotlightDialog").waitFor({ timeout: 5000 });
    });
    await h.closeOverlays(page);
    if (withModule) {
        await tap(".mx_RoomHeader .mt-back").catch(() => {});
        await h.sleep(600);
    }
    await step("18-user-menu", async () => {
        await tap(".mx_UserMenu button, .mx_UserMenu [role=button], .mx_UserMenu");
        await page.locator("[role=menu], .mx_ContextualMenu").first().waitFor({ timeout: 5000 });
    });
    await h.closeOverlays(page);
    return results;
}

async function anonLogin(d, dir, withModule) {
    const browser = await h.chromium.launch({ headless: true });
    try {
        const ctx = await browser.newContext(h.ctxOptions(d));
        if (withModule) await h.routeModule(ctx);
        await ctx.addInitScript(() => { try { sessionStorage.setItem("skip_mobile_redirect", "true"); } catch { /* */ } });
        const page = await ctx.newPage();
        await page.goto(BASE + "/#/welcome", { waitUntil: "domcontentloaded" });
        await page.waitForSelector(".mx_AuthPage, .mx_Welcome", { timeout: 60000 });
        await h.sleep(2000);
        const m = await page.evaluate(h.measure);
        await page.screenshot({ path: path.join(dir, "00-login.png"), scale: "css" });
        return { name: "00-login", ok: true, metrics: m };
    } catch (e) {
        return { name: "00-login", ok: false, error: String(e.message).slice(0, 200) };
    } finally {
        await browser.close();
    }
}

for (const name of which) {
    const d = h.DEVICES[name];
    if (!d) throw new Error("unknown device " + name);
    const devOut = h.ensureDir(path.join(OUTROOT, a.theme ? `${name}--${a.theme}` : name));
    const prevFile = path.join(devOut, "result.json");
    const prev = fs.existsSync(prevFile) ? JSON.parse(fs.readFileSync(prevFile, "utf8")) : {};
    const result = { ...prev, device: name, label: d.label, base: BASE, theme: a.theme || null, generated: new Date().toISOString() };
    for (const v of variants) {
        const withModule = v === "with";
        const dir = h.ensureDir(path.join(devOut, v));
        const res = [await anonLogin(d, dir, withModule)];
        const s = await h.launchLoggedIn({ device: d, base: BASE, withModule, theme: a.theme || null });
        try {
            res.push(...(await flow(s.page, d, dir, withModule)));
        } catch (e) {
            h.log("flow failed", e.stack);
        } finally {
            result[v] = { steps: res, consoleErrors: [...new Set(s.errors)].filter((x) => !/map_style|MapStyle|rust crypto store|status of 404/.test(x)).slice(0, 20) };
            await s.close();
        }
    }
    fs.writeFileSync(path.join(devOut, "result.json"), JSON.stringify(result, null, 2));
    try {
        execFileSync("python3", [path.join(h.HERE, "compare.py"), devOut], { stdio: "inherit" });
    } catch { h.log("compare sheet skipped"); }
}
h.log("done →", path.relative(h.ROOT, OUTROOT));
