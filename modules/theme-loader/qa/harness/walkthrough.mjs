#!/usr/bin/env node
// The same 45 s user journey for every theme, recorded to recordings/walkthroughs/<id>[--<phase>].webm (1440x900).
//   node tests/harness/walkthrough.mjs --theme <id> [--phase p] [--base-url URL] [--user themes-mira] [--duration 45]
//        [--name <out-basename>]   (e.g. --phase day --name teams-2026-daylight: clock-independent main clip)
// Element toasts are hidden (lib.mjs launch), the root never scrolls (scrollInPanel), so clips stay comparable.
// Timing is deterministic: every step starts at a fixed offset from the journey start, and the recording is trimmed
// so that t=0 is the first frame of the journey (Element's loading time is cut off). Clips therefore align
// frame-by-frame in grid.sh. The only writes: one message + one reaction in "Theme Lab · Sandbox".
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  ROOT, launch, parseArgs, resolveBase, fixtures, themeUrl, waitForApp, dismissNags, closeOverlays, gotoRoom,
  setDeviceSetting, selectSpace, themeStatus, variantMeta, ensureDir, log, sleep, ffprobeDuration, scrollInPanel, resetRootScroll, CURSOR,
} from './lib.mjs';

const a = parseArgs(process.argv.slice(2), { user: 'themes-mira', duration: 45 });
if (!a.theme) { console.error('usage: walkthrough.mjs --theme <id> [--phase p] [--base-url URL]'); process.exit(2); }
const base = await resolveBase(a.baseUrl);
const viewport = { width: 1440, height: 900 };
const DURATION = +a.duration;
const outDir = ensureDir(path.join(ROOT, 'recordings/walkthroughs'));
const outFile = path.join(outDir, `${a.name || `${a.theme}${a.phase ? `--${a.phase}` : ''}`}.webm`);
const R = fixtures().rooms;
const meta = variantMeta(a.theme);
const nm = meta?.name;
const themeName = (typeof nm === 'object' && nm ? (nm.en || Object.values(nm)[0]) : nm) || a.theme;

const { ctx, page, runDir, cleanup } = await launch({ user: a.user, base, viewport, video: true });
const tPage = Date.now();
await ctx.addInitScript(CURSOR);
let mouse = { x: 720, y: 450 };
async function moveTo(target, { steps = 18 } = {}) {
  const loc = typeof target === 'string' ? page.locator(target).first() : target;
  let b = await loc.boundingBox({ timeout: 8000 });
  if (b && (b.x < 0 || b.y < 0)) {
    // off-canvas chrome (e.g. paper-*-invisible slides the room list in on hover at the left edge): reveal it first
    await page.mouse.move(3, viewport.height / 2, { steps: steps / 2 | 0 }); await sleep(700);
    b = await loc.boundingBox({ timeout: 8000 });
  }
  if (!b) throw new Error('no box for ' + target);
  // wide targets that start at the left edge (timeline spanning the window when the room list is hidden): aim at
  // their middle, not 120 px in, or the pointer lands on the hover zone of the hidden room list
  const x = b.x + (b.x < 200 && b.width > 900 ? b.width / 2 : Math.min(b.width / 2, 120)), y = b.y + b.height / 2;
  await page.mouse.move(x, y, { steps }); mouse = { x, y };
  return loc;
}
async function click(target) { const l = await moveTo(target); await sleep(150); await page.mouse.down(); await page.mouse.up(); return l; }
// Room list items: aim at the room *name* text. The middle of the row can be covered by hover buttons (notification
// options / "…"), which some themes place over the centre (LCARS right-aligns the name).
const roomItem = (name) => page.locator('.mx_RoomListItemView, [role="option"]').filter({ hasText: name }).first();
async function roomPoint(name) {
  return roomItem(name).evaluate((el, nm) => {
    // tall room lists (comic-poster/-unreadable) put the last rooms below the fold: scroll the list, not the page
    const r0 = el.getBoundingClientRect();
    if (r0.bottom > innerHeight || r0.top < 0) {
      const sc = el.closest('[data-testid="room-list"], .mx_RoomListPanel [class*="list"], .mx_AutoHideScrollbar') || el.parentElement;
      let p = el.parentElement; while (p && p.scrollHeight <= p.clientHeight + 2) p = p.parentElement;
      (p || sc).scrollTop += r0.bottom > innerHeight ? r0.bottom - innerHeight + 40 : r0.top - 40;
    }
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) {
      if (!n.textContent.includes(nm)) continue;
      const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect();
      if (b.width) return { x: b.x + Math.min(b.width / 2, 50), y: b.y + b.height / 2 };
    }
    const b = el.getBoundingClientRect(); return { x: b.x + b.width / 3, y: b.y + b.height / 2 };
  }, name);
}
async function hoverRoom(name, steps = 10) {
  let p = await roomPoint(name);
  if (p.x < 0) { await page.mouse.move(3, viewport.height / 2, { steps }); await sleep(700); p = await roomPoint(name); }   // off-canvas room list
  await page.mouse.move(p.x, p.y, { steps }); mouse = p;
}
// Real mouse click (cursor + ripple on camera); if the room didn't open within 1.5 s (a theme overlay swallowed the
// click, or the machine is slow), fall back to Element's dispatcher so the rest of the journey stays on schedule.
async function clickRoom(name, roomId) {
  await hoverRoom(name, 18); await sleep(150); await page.mouse.down(); await page.mouse.up();
  const ok = await page.waitForFunction((rid) => location.hash.includes(rid), roomId, { timeout: 1500 }).then(() => true, () => false);
  if (!ok) { log(`  (click on "${name}" did not open it, dispatching view_room)`); await gotoRoom(page, roomId, { wait: false }); }
}

let t0 = 0;
const steps = [];
async function at(sec, label, fn) {
  const wait = t0 + sec * 1000 - Date.now();
  if (wait > 0) await sleep(wait);
  else if (wait < -400) log(`  (late by ${(-wait / 1000).toFixed(1)}s at ${label})`);
  const s = Date.now();
  const late = wait < 0 ? +(-wait / 1000).toFixed(2) : 0;   // recorded so misaligned clips can be found and re-shot
  try { await fn(); steps.push({ sec, label, ok: true, late }); }
  catch (e) { steps.push({ sec, label, ok: false, late, error: String(e.message).split('\n')[0] }); log('✗', label, String(e.message).split('\n')[0]); }
  log(`${sec.toString().padStart(4)}s ${label} (${Date.now() - s} ms)`);
}
const tile = (text) => page.locator('.mx_EventTile').filter({ hasText: text }).last();

try {
  await page.goto(themeUrl(base, { theme: a.theme, phase: a.phase, hash: '/home' }), { waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  await dismissNags(page);
  await setDeviceSetting(page, 'layout', 'group');
  // pre-warm the rooms we visit so timing doesn't depend on network
  for (const rid of [R.showcase, R.sandbox]) await gotoRoom(page, rid);
  await selectSpace(page, R.space);
  await gotoRoom(page, R.space, { wait: false });     // space home: "Theme Lab" overview, no room open
  await page.waitForTimeout(1500);
  await page.evaluate(() => { try { window.mxSdkContext?.rightPanelStore?.hide?.(null); } catch { /* */ } });
  await page.mouse.move(720, 450);
  await dismissNags(page);
  await resetRootScroll(page);
  await sleep(1500);
  const ts = await themeStatus(page, a.theme);
  if (a.theme !== 'element-default' && ts.tlTheme !== a.theme) log(`WARNING: data-tl-theme=${ts.tlTheme}, expected ${a.theme}`);

  // sync marker: a magenta frame we can find in the raw video (wall clock and video time differ)
  await page.evaluate(() => { const m = document.createElement('div'); m.id = 'tl-sync'; m.style.cssText = 'position:fixed;inset:0;background:#ff00ff;z-index:2147483647'; document.documentElement.appendChild(m); });
  await sleep(400);
  await page.evaluate(() => document.getElementById('tl-sync')?.remove());
  await sleep(300);
  t0 = Date.now();
  let offset = (t0 - tPage) / 1000;
  await at(0, 'home / room list', async () => { await moveTo('.mx_RoomListPanel, .mx_LeftPanel'); });
  await at(1.5, 'hover rooms', async () => {
    for (const name of ['Design Crit', 'Code Review', 'Release Train']) {
      await hoverRoom(name); await sleep(250);
    }
  });
  await at(4, 'open Showcase', async () => {
    await clickRoom('Showcase', R.showcase);
    await page.locator('.mx_RoomView .mx_EventTile').first().waitFor();
  });
  await at(7, 'scroll timeline up', async () => {
    await moveTo('.mx_RoomView_messagePanel');
    for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, -260); await sleep(280); }
  });
  await at(12.5, 'scroll down to thread root', async () => {
    const t = tile('which theme should be the default');
    if (await t.count()) await scrollInPanel(t, 'center', { smooth: true });
    else for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 300); await sleep(200); }
    await sleep(900);
  });
  await at(14.5, 'open thread', async () => {
    const summary = tile('which theme should be the default').locator('.mx_ThreadSummary, [class*="ThreadSummary"]').first();
    await click(summary);
    if (!(await page.locator('.mx_ThreadView').first().waitFor({ timeout: 1500 }).then(() => true, () => false))) {
      log('  (thread summary click swallowed, clicking programmatically)');
      await summary.evaluate((el) => el.click());
    }
    await page.locator('.mx_ThreadView .mx_EventTile').first().waitFor();
    await sleep(600);
    await moveTo('.mx_ThreadView'); await page.mouse.wheel(0, 400);
  });
  await at(21, 'close thread, open Sandbox', async () => {
    await page.evaluate(() => { try { window.mxSdkContext?.rightPanelStore?.hide?.(null); } catch { /* */ } });
    await clickRoom('Sandbox', R.sandbox);
    await page.locator('.mx_BasicMessageComposer_input').first().waitFor();
  });
  await at(24, 'type message', async () => {
    const ed = await click('.mx_BasicMessageComposer_input');
    await page.keyboard.type(`Hello from ${themeName} 👋`, { delay: 55 });
  });
  await at(28, 'send', async () => {
    await page.keyboard.press('Enter');
    await sleep(1200);
  });
  await at(30, 'react to own message', async () => {
    const t = page.locator('.mx_EventTile').filter({ hasText: `Hello from ${themeName}` }).last();
    await moveTo(t); await sleep(300);
    const rb = t.locator('.mx_MessageActionBar [aria-label="React"]');
    // the action bar overlaps the tile above; moving onto it can steal hover, so click it programmatically
    await t.hover(); await sleep(250); await rb.evaluate((el) => el.click());
    await page.locator('.mx_ContextualMenu').first().waitFor();
    await sleep(500);
    // the picker's search field has focus: filter and take the first hit
    await page.keyboard.type('thumbs up', { delay: 40 }); await sleep(500);
    await page.keyboard.press('Enter');
    await sleep(600);
  });
  await at(35, 'open settings → Themes', async () => {
    await closeOverlays(page);
    await click('.mx_UserMenu, [aria-label="User menu"]');
    await sleep(700);
    await click(page.getByRole('menuitem', { name: /All settings/ }));
    await page.locator('.mx_UserSettingsDialog').waitFor();
    await sleep(600);
    await click(page.locator('.mx_TabbedView_tabLabel, [role="tab"]').filter({ hasText: /^\s*Themes\s*$/ }).first());
  });
  await at(39, 'browse gallery', async () => {
    await moveTo('.mx_UserSettingsDialog .mx_TabbedView_tabPanel, .mx_UserSettingsDialog');
    for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 220); await sleep(250); }
  });
  await at(42.5, 'close settings', async () => { await page.keyboard.press('Escape'); await sleep(300); await closeOverlays(page); });
  await at(DURATION, 'end', async () => {});

  const raw = await page.video().path();
  await cleanup({ keep: true });
  // find the end of the magenta marker in the raw video; journey starts 0.3 s after it
  try {
    const out = execFileSync('ffmpeg', ['-hide_banner', '-i', raw, '-vf', 'scale=64:40,signalstats,metadata=print:file=-', '-an', '-f', 'null', '-'], { maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    let t = null, last = null, inMarker = false, lastU = 0;
    for (const line of out.split('\n')) {
      const m = /pts_time:([\d.]+)/.exec(line); if (m) t = +m[1];
      const v = /lavfi\.signalstats\.VAVG=([\d.]+)/.exec(line); const u = /lavfi\.signalstats\.UAVG=([\d.]+)/.exec(line); if (u) lastU = +u[1];
      if (v && t !== null) { const mag = +v[1] > 200 && lastU > 180; if (mag) inMarker = true; else if (inMarker) { last = t; break; } }
    }
    if (last !== null) { offset = last + 0.3; log(`sync marker found, trimming at ${offset.toFixed(2)} s`); }
    else log('WARNING: sync marker not found, using wall-clock offset');
  } catch (e) { log('marker detection failed:', String(e.message).split('\n')[0]); }
  // trim: t=0 → journey start; fixed duration; VP9 webm
  const tmp = outFile + `.${process.pid}.tmp.webm`;
  // encodes run at nice 19 with few threads: parallel recordings must not lose frames/timing to our own ffmpeg
  execFileSync('nice', ['-n', '19', 'ffmpeg', '-loglevel', 'error', '-y', '-ss', offset.toFixed(3), '-i', raw, '-t', String(DURATION), '-threads', '4',
    '-vf', `fps=25,scale=${viewport.width}:${viewport.height}`, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-deadline', 'realtime',
    '-cpu-used', '8', '-row-mt', '1', '-an', tmp]);
  fs.renameSync(tmp, outFile);
  // compact H.264 mp4 next to it (the committed deliverable), encoded from the raw capture, not from the webm.
  // CRF 30; if a clip still ends up above ~3 MB (busy animated themes), step the CRF up.
  if (process.env.TL_MP4 !== '0') {
    const mp4 = outFile.replace(/\.webm$/, '.mp4');
    for (const crf of [30, 33, 36, 39]) {
      execFileSync('nice', ['-n', '19', 'ffmpeg', '-loglevel', 'error', '-y', '-ss', offset.toFixed(3), '-i', raw, '-t', String(DURATION), '-threads', '4',
        '-vf', `fps=25,scale=${viewport.width}:${viewport.height}`, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf),
        '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4 + '.tmp.mp4']);
      fs.renameSync(mp4 + '.tmp.mp4', mp4);
      const mb = fs.statSync(mp4).size / 1e6;
      log(`mp4 crf ${crf}: ${mb.toFixed(2)} MB`);
      if (mb <= 3.0) break;
    }
  }
  fs.rmSync(runDir, { recursive: true, force: true });
  fs.writeFileSync(outFile.replace(/\.webm$/, '.json'), JSON.stringify({ theme: a.theme, name: themeName, phase: a.phase || null, base,
    duration: DURATION, trimmedAt: offset, steps, created: new Date().toISOString() }, null, 2));
  log(`→ ${path.relative(ROOT, outFile)} (${ffprobeDuration(outFile).toFixed(1)} s)`);
  process.exit(steps.some((s) => !s.ok) ? 1 : 0);
} catch (e) {
  await cleanup();
  throw e;
}
