#!/usr/bin/env node
// Daylight time-lapse: the Showcase timeline of one daylight variant while the phase cycles dawn → day → dusk → night.
//   node tests/harness/timelapse.mjs --theme <daylight-id> [--seg 5] [--base-url URL] [--user themes-mira]
// Output: recordings/timelapse/<id>.webm (+ .json with the name for grid.sh; GRID_SRC=recordings/timelapse).
// Four fixed slots at representative clock times (07:00, 12:30, 19:30, 23:30); each slot shows the phase the
// variant's schedule has at that time (LCARS: day, day, evening, night), so all clips line up slot by slot.
// The phase is switched live via localStorage["tl.forcePhase"] + a synthetic storage event (the loader's own
// scheduler path); the key is removed again at the end (the profile is a shared session slot).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  ROOT, launch, parseArgs, resolveBase, fixtures, themeUrl, waitForApp, dismissNags, gotoRoom, setDeviceSetting,
  themeStatus, variantMeta, ensureDir, log, sleep, ffprobeDuration, resetRootScroll,
} from './lib.mjs';

const a = parseArgs(process.argv.slice(2), { user: 'themes-mira', seg: 5 });
if (!a.theme) { console.error('usage: timelapse.mjs --theme <daylight-id> [--seg 5]'); process.exit(2); }
const meta = variantMeta(a.theme);
if (!meta?.schedule?.length) { console.error(`${a.theme} has no daylight schedule`); process.exit(2); }
const base = await resolveBase(a.baseUrl);
const viewport = { width: 1440, height: 900 };
const SEG = +a.seg;
const SLOTS = [['07:00', 'dawn'], ['12:30', 'day'], ['19:30', 'dusk'], ['23:30', 'night']];
const mins = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const phaseAt = (t) => { const s = [...meta.schedule].sort((x, y) => mins(x.from) - mins(y.from)); let cur = s.at(-1); for (const p of s) if (mins(p.from) <= mins(t)) cur = p; return cur.phase; };
const plan = SLOTS.map(([t, slot]) => ({ time: t, slot, phase: phaseAt(t) }));
const DURATION = SEG * plan.length;
const outDir = ensureDir(path.join(ROOT, 'recordings/timelapse'));
const outFile = path.join(outDir, `${a.theme}.webm`);
const nm = meta.name; const themeName = (typeof nm === 'object' && nm ? (nm.en || Object.values(nm)[0]) : nm) || a.theme;
const R = fixtures().rooms;

const { page, runDir, cleanup } = await launch({ user: a.user, base, viewport, video: true });
const setPhase = (p) => page.evaluate((ph) => {
  if (ph) localStorage.setItem('tl.forcePhase', ph); else localStorage.removeItem('tl.forcePhase');
  window.dispatchEvent(new StorageEvent('storage', { key: 'tl.forcePhase', newValue: ph }));
}, p);
const badge = (txt) => page.evaluate((t) => {
  let b = document.getElementById('tl-tl-badge');
  if (!b) {
    b = document.createElement('div'); b.id = 'tl-tl-badge';
    b.style.cssText = 'position:fixed;right:18px;bottom:96px;z-index:2147483647;pointer-events:none;padding:10px 20px;border-radius:999px;'
      + 'background:rgba(10,12,16,.82);color:#fff;font:700 30px/1 system-ui,sans-serif;letter-spacing:.02em;box-shadow:0 4px 18px rgba(0,0,0,.35)';
    document.documentElement.appendChild(b);
  }
  b.textContent = t;
}, txt);
const ICON = { dawn: '🌅', day: '☀️', dusk: '🌇', night: '🌙' };
let ok = true;
try {
  await page.goto(themeUrl(base, { theme: a.theme, hash: '/home' }), { waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  await dismissNags(page);
  await setDeviceSetting(page, 'layout', 'group');
  await gotoRoom(page, R.showcase);
  await page.evaluate(() => { try { window.mxSdkContext?.rightPanelStore?.hide?.(null); } catch { /* */ } });
  await page.evaluate(() => { const p = document.querySelector('.mx_RoomView_messagePanel'); if (p) p.scrollTop = p.scrollHeight; });
  await resetRootScroll(page);
  await page.mouse.move(viewport.width - 5, viewport.height - 5);
  // pre-warm: visit every phase once so its CSS/assets are cached and the live switches below are instant
  for (const st of plan) { await setPhase(st.phase); await sleep(1200); }
  await setPhase(plan[0].phase); await badge(`${ICON[plan[0].slot]} ${plan[0].time} · ${plan[0].phase}`);
  await sleep(2500);
  const ts = await themeStatus(page, a.theme);
  if (ts.tlTheme !== a.theme) log(`WARNING: data-tl-theme=${ts.tlTheme}, expected ${a.theme}`);
  await page.evaluate(() => { const m = document.createElement('div'); m.id = 'tl-sync'; m.style.cssText = 'position:fixed;inset:0;background:#ff00ff;z-index:2147483647'; document.documentElement.appendChild(m); });
  await sleep(400);
  await page.evaluate(() => document.getElementById('tl-sync')?.remove());
  await sleep(300);
  const t0 = Date.now();
  for (let i = 0; i < plan.length; i++) {
    const wait = t0 + i * SEG * 1000 - Date.now(); if (wait > 0) await sleep(wait);
    else if (wait < -300) log(`  (late by ${(-wait / 1000).toFixed(1)}s)`);
    const ts0 = Date.now();
    await setPhase(plan[i].phase); await badge(`${ICON[plan[i].slot]} ${plan[i].time} · ${plan[i].phase}`);
    const got = await page.evaluate(() => document.documentElement.dataset.tlPhase);
    if (got !== plan[i].phase) { log(`WARNING: phase ${got}, expected ${plan[i].phase}`); ok = false; }
    log(`${(i * SEG).toString().padStart(3)}s ${plan[i].time} → ${plan[i].phase} (${Date.now() - ts0} ms)`);
  }
  await sleep(Math.max(0, t0 + DURATION * 1000 - Date.now()) + 300);
} finally {
  await setPhase(null).catch(() => {});      // never leave a forced phase in the shared slot profile
}
const raw = await page.video().path();
await cleanup({ keep: true });
let offset = 0;
const out = execFileSync('ffmpeg', ['-hide_banner', '-i', raw, '-vf', 'scale=64:40,signalstats,metadata=print:file=-', '-an', '-f', 'null', '-'],
  { maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
let t = null, inMarker = false, lastU = 0;
for (const line of out.split('\n')) {
  const m = /pts_time:([\d.]+)/.exec(line); if (m) t = +m[1];
  const v = /lavfi\.signalstats\.VAVG=([\d.]+)/.exec(line); const u = /lavfi\.signalstats\.UAVG=([\d.]+)/.exec(line); if (u) lastU = +u[1];
  if (v && t !== null) { if (+v[1] > 200 && lastU > 180) inMarker = true; else if (inMarker) { offset = t + 0.3; break; } }
}
if (!offset) log('WARNING: sync marker not found');
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', offset.toFixed(3), '-i', raw, '-t', String(DURATION),
  '-vf', `fps=25,scale=${viewport.width}:${viewport.height}`, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '32', '-deadline', 'realtime',
  '-cpu-used', '8', '-row-mt', '1', '-an', outFile]);
fs.rmSync(runDir, { recursive: true, force: true });
fs.writeFileSync(outFile.replace(/\.webm$/, '.json'), JSON.stringify({ theme: a.theme, name: themeName, base, seg: SEG, plan, trimmedAt: offset, created: new Date().toISOString() }, null, 2));
log(`→ ${path.relative(ROOT, outFile)} (${ffprobeDuration(outFile).toFixed(1)} s)`);
process.exit(ok ? 0 : 1);
