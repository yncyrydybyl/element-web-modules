#!/usr/bin/env node
// The same 45 s user journey for every theme, recorded to recordings/walkthroughs/<id>[--<phase>].webm (1440x900).
//   node tests/harness/walkthrough.mjs --theme <id> [--phase p] [--base-url URL] [--user themes-mira] [--duration 45]
// Timing is deterministic: every step starts at a fixed offset from the journey start, and the recording is trimmed
// so that t=0 is the first frame of the journey (Element's loading time is cut off). Clips therefore align
// frame-by-frame in grid.sh. The only writes: one message + one reaction in "Theme Lab · Sandbox".
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  ROOT, launch, parseArgs, resolveBase, fixtures, themeUrl, waitForApp, dismissNags, closeOverlays, gotoRoom,
  setDeviceSetting, selectSpace, themeStatus, variantMeta, ensureDir, log, sleep, ffprobeDuration,
} from './lib.mjs';

const a = parseArgs(process.argv.slice(2), { user: 'themes-mira', duration: 45 });
if (!a.theme) { console.error('usage: walkthrough.mjs --theme <id> [--phase p] [--base-url URL]'); process.exit(2); }
const base = await resolveBase(a.baseUrl);
const viewport = { width: 1440, height: 900 };
const DURATION = +a.duration;
const outDir = ensureDir(path.join(ROOT, 'recordings/walkthroughs'));
const outFile = path.join(outDir, `${a.theme}${a.phase ? `--${a.phase}` : ''}.webm`);
const R = fixtures().rooms;
const meta = variantMeta(a.theme);
const nm = meta?.name;
const themeName = (typeof nm === 'object' && nm ? (nm.en || Object.values(nm)[0]) : nm) || a.theme;

// fake cursor (headless Chrome renders none) + click ripple, injected before Element loads
const CURSOR = () => {
  const install = () => {
    if (document.getElementById('tl-cursor')) return;
    const c = document.createElement('div');
    c.id = 'tl-cursor';
    c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483647;pointer-events:none;'
      + 'transform:translate(-100px,-100px);transition:none;';
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2 L3 18 L7.5 13.8 L10.6 20.5 L13.4 19.3 L10.4 12.7 L16.5 12.5 Z" '
      + 'fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
    addEventListener('mousemove', (e) => { c.style.transform = `translate(${e.clientX - 3}px,${e.clientY - 2}px)`; }, true);
    addEventListener('mousedown', (e) => {
      const r = document.createElement('div');
      r.style.cssText = `position:fixed;left:${e.clientX - 18}px;top:${e.clientY - 18}px;width:36px;height:36px;border-radius:50%;`
        + 'border:3px solid rgba(255,80,40,.85);z-index:2147483646;pointer-events:none;transition:transform .45s ease-out,opacity .45s;';
      document.documentElement.appendChild(r);
      requestAnimationFrame(() => { r.style.transform = 'scale(1.8)'; r.style.opacity = '0'; });
      setTimeout(() => r.remove(), 600);
    }, true);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', install); else install();
};

const { ctx, page, runDir, cleanup } = await launch({ user: a.user, base, viewport, video: true });
const tPage = Date.now();
await ctx.addInitScript(CURSOR);
let mouse = { x: 720, y: 450 };
async function moveTo(target, { steps = 18 } = {}) {
  const loc = typeof target === 'string' ? page.locator(target).first() : target;
  const b = await loc.boundingBox();
  if (!b) throw new Error('no box for ' + target);
  const x = b.x + Math.min(b.width / 2, 120), y = b.y + b.height / 2;
  await page.mouse.move(x, y, { steps }); mouse = { x, y };
  return loc;
}
async function click(target) { const l = await moveTo(target); await sleep(150); await page.mouse.down(); await page.mouse.up(); return l; }

let t0 = 0;
const steps = [];
async function at(sec, label, fn) {
  const wait = t0 + sec * 1000 - Date.now();
  if (wait > 0) await sleep(wait);
  else if (wait < -400) log(`  (late by ${(-wait / 1000).toFixed(1)}s at ${label})`);
  const s = Date.now();
  try { await fn(); steps.push({ sec, label, ok: true }); }
  catch (e) { steps.push({ sec, label, ok: false, error: String(e.message).split('\n')[0] }); log('✗', label, String(e.message).split('\n')[0]); }
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
      await moveTo(page.locator('.mx_RoomListItemView, [role="option"]').filter({ hasText: name }).first(), { steps: 10 }); await sleep(250);
    }
  });
  await at(4, 'open Showcase', async () => {
    await click(page.locator('.mx_RoomListItemView, [role="option"]').filter({ hasText: 'Showcase' }).first());
    await page.locator('.mx_RoomView .mx_EventTile').first().waitFor();
  });
  await at(7, 'scroll timeline up', async () => {
    await moveTo('.mx_RoomView_messagePanel');
    for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, -260); await sleep(280); }
  });
  await at(12.5, 'scroll down to thread root', async () => {
    const t = tile('which theme should be the default');
    if (await t.count()) await t.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    else for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 300); await sleep(200); }
    await sleep(900);
  });
  await at(14.5, 'open thread', async () => {
    await click(tile('which theme should be the default').locator('.mx_ThreadSummary, [class*="ThreadSummary"]').first());
    await page.locator('.mx_ThreadView .mx_EventTile').first().waitFor();
    await sleep(600);
    await moveTo('.mx_ThreadView'); await page.mouse.wheel(0, 400);
  });
  await at(21, 'close thread, open Sandbox', async () => {
    await page.evaluate(() => { try { window.mxSdkContext?.rightPanelStore?.hide?.(null); } catch { /* */ } });
    await click(page.locator('.mx_RoomListItemView, [role="option"]').filter({ hasText: 'Sandbox' }).first());
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
    const out = execFileSync('ffmpeg', ['-hide_banner', '-i', raw, '-vf', 'crop=16:16:300:700,signalstats,metadata=print:file=-', '-an', '-f', 'null', '-'], { maxBuffer: 64 << 20 }).toString();
    let t = null, last = null, inMarker = false;
    for (const line of out.split('\n')) {
      const m = /pts_time:([\d.]+)/.exec(line); if (m) t = +m[1];
      const v = /lavfi\.signalstats\.VAVG=([\d.]+)/.exec(line);
      if (v && t !== null) { const mag = +v[1] > 200; if (mag) inMarker = true; else if (inMarker) { last = t; break; } }
    }
    if (last !== null) { offset = last + 0.3; log(`sync marker found, trimming at ${offset.toFixed(2)} s`); }
    else log('WARNING: sync marker not found, using wall-clock offset');
  } catch (e) { log('marker detection failed:', String(e.message).split('\n')[0]); }
  // trim: t=0 → journey start; fixed duration; VP9 webm
  const tmp = outFile + `.${process.pid}.tmp.webm`;
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', offset.toFixed(3), '-i', raw, '-t', String(DURATION),
    '-vf', `fps=25,scale=${viewport.width}:${viewport.height}`, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-deadline', 'realtime',
    '-cpu-used', '8', '-row-mt', '1', '-an', tmp]);
  fs.renameSync(tmp, outFile);
  fs.rmSync(runDir, { recursive: true, force: true });
  fs.writeFileSync(outFile.replace(/\.webm$/, '.json'), JSON.stringify({ theme: a.theme, name: themeName, phase: a.phase || null, base,
    duration: DURATION, trimmedAt: offset, steps, created: new Date().toISOString() }, null, 2));
  log(`→ ${path.relative(ROOT, outFile)} (${ffprobeDuration(outFile).toFixed(1)} s)`);
  process.exit(steps.some((s) => !s.ok) ? 1 : 0);
} catch (e) {
  await cleanup();
  throw e;
}
