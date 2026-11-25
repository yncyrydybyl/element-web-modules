#!/usr/bin/env node
// Extra footage for the showcase film (recordings/showcase/): short scripted takes the 45 s walkthroughs don't cover.
//   node qa/harness/film.mjs --clip <name> [--theme <id>] [--base-url URL]
// Clips: loader (Themes tab + Alt+Shift+T quick switcher previews, Esc reverts — nothing is selected or saved),
//        rtl (the RTL room), code (code blocks in Showcase), modal (create-room dialog + emoji picker + settings).
// Output: recordings/showcase/work/clips/<name>.mp4 (1440x900, 30 fps, trimmed at a magenta sync frame).
// Writes nothing to account data: the quick switcher is only previewed, the Themes tab only filtered.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  ROOT, launch, parseArgs, resolveBase, fixtures, themeUrl, waitForApp, dismissNags, closeOverlays, gotoRoom,
  setDeviceSetting, selectSpace, ensureDir, log, sleep, scrollInPanel, resetRootScroll, CURSOR, ffprobeDuration,
} from './lib.mjs';

const a = parseArgs(process.argv.slice(2), { user: 'themes-mira' });
const DEFAULT_THEME = { loader: 'teams-2026-light', rtl: 'lcars-tng', code: 'sketch-notebook', modal: 'win311-default' };
const clip = a.clip; const theme = a.theme || DEFAULT_THEME[clip];
if (!clip || !theme) { console.error('usage: film.mjs --clip loader|rtl|code|modal [--theme id]'); process.exit(2); }
const base = await resolveBase(a.baseUrl);
const viewport = { width: 1440, height: 900 };
const R = fixtures().rooms;
const outDir = ensureDir(path.join(ROOT, 'recordings/showcase/work/clips'));
const outFile = path.join(outDir, `${a.name || clip}.mp4`);

const { ctx, page, runDir, cleanup } = await launch({ user: a.user, base, viewport, video: true });
await ctx.addInitScript(CURSOR);
async function moveTo(target, { steps = 20 } = {}) {
  const loc = typeof target === 'string' ? page.locator(target).first() : target;
  const b = await loc.boundingBox();
  if (!b) throw new Error('no box for ' + target);
  await page.mouse.move(b.x + Math.min(b.width / 2, 120), b.y + b.height / 2, { steps });
  return loc;
}
async function click(target) { const l = await moveTo(target); await sleep(150); await page.mouse.down(); await page.mouse.up(); return l; }
const tile = (text) => page.locator('.mx_EventTile').filter({ hasText: text }).last();
const marks = [];
let t0 = 0;
const mark = (label) => { marks.push({ t: +((Date.now() - t0) / 1000).toFixed(2), label }); log(`${marks.at(-1).t.toFixed(1).padStart(5)}s ${label}`); };

const JOURNEYS = {
  async loader() {
    mark('room view');
    await sleep(1200);
    await click('.mx_UserMenu, [aria-label="User menu"]'); await sleep(700);
    await click(page.getByRole('menuitem', { name: /All settings/ }));
    await page.locator('.mx_UserSettingsDialog').waitFor(); await sleep(500);
    await click(page.locator('.mx_TabbedView_tabLabel, [role="tab"]').filter({ hasText: /^\s*Themes\s*$/ }).first());
    mark('themes tab'); await sleep(1800);
    const panel = page.locator('.mx_UserSettingsDialog .tl-family, .mx_UserSettingsDialog .tl-filters').first();
    await moveTo(panel);
    for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 260); await sleep(260); }
    await sleep(600);
    for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, -260); await sleep(120); }
    await sleep(500);
    const search = page.locator('.tl-filters .tl-search').first();
    await click(search); mark('search lcars');
    await page.keyboard.type('lcars', { delay: 90 }); await sleep(2200);
    await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace'); await sleep(300);
    await page.keyboard.type('daylight', { delay: 80 }); mark('search daylight'); await sleep(2200);
    await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace'); await sleep(400);
    await page.keyboard.press('Escape'); await sleep(400); await closeOverlays(page);
    mark('settings closed'); await sleep(800);
    await page.mouse.move(900, 500, { steps: 12 });
    await page.keyboard.press('Alt+Shift+KeyT'); await page.locator('.tl-quick').first().waitFor(); mark('quick switcher');
    await sleep(1000);
    await page.keyboard.type('pure', { delay: 90 }); await sleep(900);
    for (let i = 0; i < 9; i++) { await page.keyboard.press('ArrowDown'); mark(`preview ${i + 1}`); await sleep(1700); }
    await page.keyboard.press('Escape'); mark('esc reverts'); await sleep(2200);
  },
  async rtl() {
    await gotoRoom(page, R.rtl);
    await page.evaluate(() => { const p = document.querySelector('.mx_RoomView_messagePanel'); if (p) p.scrollTop = p.scrollHeight; });
    await resetRootScroll(page); await sleep(800);
    mark('rtl room'); await sleep(1500);
    await moveTo('.mx_RoomView_messagePanel');
    for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -180); await sleep(300); }
    await sleep(1500);
    for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 180); await sleep(200); }
    await sleep(1500);
  },
  async code() {
    await gotoRoom(page, R.showcase);
    await page.evaluate(() => { const p = document.querySelector('.mx_RoomView_messagePanel'); if (p) p.scrollTop = p.scrollHeight; });
    await sleep(800);
    mark('showcase bottom'); await sleep(1500);
    for (const txt of ['Python helper for the manifests', 'And the loader side', 'Win 3.11 bevels', 'Markdown check']) {
      const t = tile(txt);
      if (await t.count()) { await scrollInPanel(t, 'center', { smooth: true }); mark(txt); await sleep(2600); }
    }
  },
  async modal() {
    await gotoRoom(page, R.showcase);
    await page.evaluate(() => { const p = document.querySelector('.mx_RoomView_messagePanel'); if (p) p.scrollTop = p.scrollHeight; });
    await sleep(800); mark('showcase');
    await sleep(800);
    await click('.mx_MessageComposer [aria-label="Emoji"], .mx_MessageComposer_emoji');
    await page.locator('.mx_ContextualMenu, .mx_EmojiPicker').first().waitFor(); mark('emoji picker'); await sleep(2400);
    await page.keyboard.press('Escape'); await sleep(500);
    await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_create_room' }));
    await page.locator('.mx_CreateRoomDialog').first().waitFor(); mark('create room'); await sleep(600);
    await click('.mx_CreateRoomDialog input[type="text"], .mx_CreateRoomDialog input');
    await page.keyboard.type('Theme party 🎉', { delay: 70 }); await sleep(1800);
    await page.keyboard.press('Escape'); await sleep(500); await closeOverlays(page);
    await page.evaluate((rid) => window.mxDispatcher.dispatch({ action: 'open_room_settings', room_id: rid }), R.showcase);
    await page.locator('.mx_RoomSettingsDialog').waitFor(); mark('room settings'); await sleep(2600);
    await page.keyboard.press('Escape'); await sleep(800);
  },
};
if (!JOURNEYS[clip]) { console.error('unknown clip ' + clip); process.exit(2); }

try {
  await page.goto(themeUrl(base, { theme, phase: a.phase, hash: '/home' }), { waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  await dismissNags(page);
  await setDeviceSetting(page, 'layout', 'group');
  await selectSpace(page, R.space);
  await gotoRoom(page, R.showcase);
  await page.evaluate(() => { try { window.mxSdkContext?.rightPanelStore?.hide?.(null); } catch { /* */ } });
  await page.evaluate(() => { const p = document.querySelector('.mx_RoomView_messagePanel'); if (p) p.scrollTop = p.scrollHeight; });
  if (clip === 'code') {   // back-paginate first so the code tiles exist when the take starts
    for (let i = 0; i < 25 && !(await tile('Python helper for the manifests').count()); i++) {
      await page.evaluate(() => { const p = document.querySelector('.mx_RoomView_messagePanel'); if (p) p.scrollTop = 0; });
      await sleep(900);
    }
    await page.evaluate(() => { const p = document.querySelector('.mx_RoomView_messagePanel'); if (p) p.scrollTop = p.scrollHeight; });
    await sleep(1200);
  }
  await page.mouse.move(1000, 520);
  await resetRootScroll(page);
  await sleep(1500);
  await page.evaluate(() => { const m = document.createElement('div'); m.id = 'tl-sync'; m.style.cssText = 'position:fixed;inset:0;background:#ff00ff;z-index:2147483647'; document.documentElement.appendChild(m); });
  await sleep(400);
  await page.evaluate(() => document.getElementById('tl-sync')?.remove());
  await sleep(300);
  t0 = Date.now();
  await JOURNEYS[clip]();
  mark('end');
} catch (e) {
  log('✗', String(e.message).split('\n')[0]);
  await page.keyboard.press('Escape').catch(() => {});
}
const DUR = (Date.now() - t0) / 1000;
const raw = await page.video().path();
await cleanup({ keep: true });
let offset = 0;
const out = execFileSync('ffmpeg', ['-hide_banner', '-i', raw, '-vf', 'scale=64:40,signalstats,metadata=print:file=-', '-an', '-f', 'null', '-'],
  { maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
let t = null, inM = false, lastU = 0;
for (const line of out.split('\n')) {
  const m = /pts_time:([\d.]+)/.exec(line); if (m) t = +m[1];
  const v = /lavfi\.signalstats\.VAVG=([\d.]+)/.exec(line); const u = /lavfi\.signalstats\.UAVG=([\d.]+)/.exec(line); if (u) lastU = +u[1];
  if (v && t !== null) { if (+v[1] > 200 && lastU > 180) inM = true; else if (inM) { offset = t + 0.3; break; } }
}
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', offset.toFixed(3), '-i', raw, '-t', DUR.toFixed(2),
  '-vf', 'fps=30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-an', outFile]);
fs.rmSync(runDir, { recursive: true, force: true });
fs.writeFileSync(outFile.replace(/\.mp4$/, '.json'), JSON.stringify({ clip, theme, marks }, null, 2));
log(`→ ${path.relative(ROOT, outFile)} (${ffprobeDuration(outFile).toFixed(1)} s)`);
