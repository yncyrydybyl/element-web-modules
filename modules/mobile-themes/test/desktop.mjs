#!/usr/bin/env node
// Desktop regression: Element at 1440x900 (fine pointer) must be identical with and without the module.
// Same session slot, same flow twice (without, then with the module injected); compares
//   - a layout fingerprint (bounding boxes + key computed styles of ~40 regions, html attributes, viewport meta)
//   - screenshots pixel by pixel (python3/PIL; dynamic content such as typing/presence may differ by a few px)
// Output: recordings/mobile/after/desktop/{without,with}/*.png, diff-*.png, desktop.json. Exit 1 on a layout diff.
//
//   NODE_PATH=~/projects/matrix-search-widget/node_modules node mobile/test/desktop.mjs [--base-url …] [--theme id]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as h from "./mtlib.mjs";

const a = h.parseArgs(process.argv.slice(2), { baseUrl: "https://element.datanauten.de" });
const BASE = a.baseUrl.replace(/\/$/, "");
const OUT = h.ensureDir(path.resolve(h.ROOT, a.out || `recordings/mobile/after/desktop${a.theme ? "--" + a.theme : ""}`));
const d = h.DEVICES.desktop;

function fingerprint() {
    const sels = [".mx_MatrixChat", "[data-group]", ".mx_SpacePanel", "#left-panel", ".mx_Separator", "[data-group] > [data-panel]:last-child", ".mx_RoomView", ".mx_RoomHeader",
        ".mx_RoomHeader_infoWrapper", ".mx_RoomHeader > button", ".mx_RoomView_messagePanel", ".mx_MessageComposer", ".mx_BasicMessageComposer_input", ".mx_RightPanel_ResizeWrapper",
        ".mx_RightPanel", ".mx_EventTile", ".mx_EventTile_line", ".mx_RoomListPanel", "[class*='_roomListItem_']", ".mx_Dialog", ".mx_TabbedView_tabLabels", ".mx_TabbedView_tabLabel",
        ".mx_SettingsTab", ".mx_UserMenu", "#matrixchat"];
    const props = ["display", "position", "visibility", "flex", "font-size", "padding", "margin", "overflow", "z-index", "opacity", "order"];
    const out = {};
    for (const s of sels) {
        const els = [...document.querySelectorAll(s)].slice(0, 4);
        // timeline tiles: the scroll offset differs between two loads (back-pagination), so not their y
        const noY = /EventTile/.test(s);
        out[s] = els.map((e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return [Math.round(b.x), noY ? "-" : Math.round(b.y), Math.round(b.width), Math.round(b.height), ...props.map((p) => cs.getPropertyValue(p))].join("|"); });
    }
    const html = document.documentElement;
    out.attrs = [...html.attributes].map((x) => x.name).filter((n) => n.startsWith("data-mt-") && !["data-mt-pointer", "data-mt-orientation"].includes(n)).sort();
    out.viewport = document.querySelector('meta[name="viewport"]')?.getAttribute("content");
    out.mtUiVisible = [...document.querySelectorAll(".mt-ui")].filter((e) => e.getBoundingClientRect().width > 0).length;
    out.leftPanelInert = document.getElementById("left-panel")?.hasAttribute("inert") ?? null;
    return out;
}

async function run(withModule) {
    const dir = h.ensureDir(path.join(OUT, withModule ? "with" : "without"));
    const s = await h.launchLoggedIn({ device: d, base: BASE, withModule, theme: a.theme || null });
    const R = h.fixtures().rooms;
    const fp = {};
    const page = s.page;
    const shot = async (n) => {
        await page.mouse.move(1430, 890);
        await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 10000 }).catch(() => {});
        await h.sleep(2000);
        fp[n] = await page.evaluate(fingerprint);
        await page.screenshot({ path: path.join(dir, n + ".png"), animations: "disabled", caret: "hide" });
    };
    try {
        await page.addStyleTag({ content: ".mx_TypingIndicator, .mx_ReadReceiptGroup, .mx_RoomView_statusArea { visibility: hidden !important }" });
        await h.selectSpace(page, R.space);
        await h.gotoRoom(page, R.showcase);
        await page.evaluate(() => window.mxSdkContext?.rightPanelStore?.hide?.(null));
        await page.evaluate(() => { const p = document.querySelector(".mx_RoomView_messagePanel"); if (p) p.scrollTop = p.scrollHeight; });
        await shot("01-room");
        await page.evaluate(() => window.mxSdkContext.rightPanelStore.setCard({ phase: "RoomSummary" }));
        await h.sleep(800);
        await shot("02-room-info");
        await page.evaluate(() => window.mxSdkContext?.rightPanelStore?.hide?.(null));
        await page.evaluate(() => window.mxDispatcher.dispatch({ action: "view_user_settings" }));
        await page.locator(".mx_UserSettingsDialog").waitFor();
        await shot("03-user-settings");
        await h.closeOverlays(page);
        await page.evaluate(() => window.mxDispatcher.dispatch({ action: "view_create_room" }));
        await h.sleep(600);
        await shot("04-create-room");
        await h.closeOverlays(page);
    } finally {
        await s.close();
    }
    return fp;
}

const without = await run(false);
const withM = await run(true);
const diffs = [];
for (const step of Object.keys(without)) {
    for (const k of Object.keys(without[step])) {
        const x = JSON.stringify(without[step][k]), y = JSON.stringify(withM[step]?.[k]);
        if (x !== y) diffs.push({ step, key: k, without: without[step][k], with: withM[step]?.[k] });
    }
}
let pixel = null;
try {
    pixel = JSON.parse(execFileSync("python3", ["-c", `
import json,os,sys
from PIL import Image, ImageChops
d=sys.argv[1]; out={}
for n in sorted(os.listdir(os.path.join(d,'without'))):
    a=Image.open(os.path.join(d,'without',n)).convert('RGB'); b=Image.open(os.path.join(d,'with',n)).convert('RGB')
    df=ImageChops.difference(a,b); bbox=df.getbbox()
    cnt=df.convert('L').point(lambda v: 1 if v else 0).histogram()[1] if bbox else 0
    out[n]={'diffPixels':cnt,'bbox':bbox}
    if bbox: df.point(lambda v: 255 if v else 0).save(os.path.join(d,'diff-'+n))
print(json.dumps(out))`, OUT], { encoding: "utf8" }));
} catch (e) { h.log("pixel compare skipped", e.message); }
const result = { base: BASE, theme: a.theme || null, generated: new Date().toISOString(), layoutDiffs: diffs, pixel };
fs.writeFileSync(path.join(OUT, "desktop.json"), JSON.stringify(result, null, 2));
h.log(diffs.length ? `LAYOUT DIFFS: ${diffs.length}` : "layout fingerprint identical", JSON.stringify(pixel));
for (const x of diffs.slice(0, 10)) h.log(" ", x.step, x.key, JSON.stringify(x.without).slice(0, 160), "→", JSON.stringify(x.with).slice(0, 160));
process.exit(diffs.length ? 1 : 0);
