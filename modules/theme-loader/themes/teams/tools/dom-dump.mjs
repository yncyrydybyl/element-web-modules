#!/usr/bin/env node
// Dev helper (teams family): dump a compact class/aria tree of Element regions for selector work.
//   node themes/teams/tools/dom-dump.mjs [--theme id] [--room design] [--sel ".mx_RoomHeader"] [--depth 8] [--shot out.png] [--eval "js"]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const lib = await import(path.join(here, '../../../tests/harness/lib.mjs'));
const { launch, parseArgs, resolveBase, fixtures, themeUrl, waitForApp, dismissNags, gotoRoom, selectSpace, sleep } = lib;

const a = parseArgs(process.argv.slice(2), { user: 'themes-mira', room: 'design', depth: '7', width: '1440', height: '900' });
const base = await resolveBase(a.baseUrl);
const F = fixtures();
const { page, cleanup } = await launch({ user: a.user, base, viewport: { width: +a.width, height: +a.height } });
try {
  await page.goto(themeUrl(base, { theme: a.theme, phase: a.phase }));
  await waitForApp(page);
  await dismissNags(page);
  await selectSpace(page, F.rooms.space);
  if (a.room !== 'none') await gotoRoom(page, F.rooms[a.room] || a.room);
  if (a.layout) await page.evaluate((l) => window.mxSettingsStore.setValue('layout', null, 'device', l), a.layout);
  if (a.click) { await page.locator(a.click).first().click(); await sleep(1200); }
  if (a.eval) console.log(await page.evaluate(a.eval));
  if (a.sel) {
    const out = await page.evaluate(([sel, depth]) => {
      const lines = [];
      const walk = (el, d) => {
        if (d > depth || lines.length > 900) return;
        const cls = typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '');
        const attrs = ['aria-label', 'role', 'data-testid', 'data-layout', 'data-self', 'data-color', 'aria-selected', 'data-state']
          .map((k) => el.getAttribute(k) != null ? `${k}=${JSON.stringify(el.getAttribute(k).slice(0, 40))}` : '').filter(Boolean).join(' ');
        const r = el.getBoundingClientRect();
        const txt = el.children.length === 0 ? (el.textContent || '').trim().slice(0, 30) : '';
        lines.push(`${'  '.repeat(d)}${el.tagName.toLowerCase()}${cls ? '.' + cls.trim().split(/\s+/).join('.') : ''} ${attrs} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}]${txt ? ' "' + txt + '"' : ''}`);
        if (el.tagName === 'svg') return;
        for (const c of el.children) walk(c, d + 1);
      };
      document.querySelectorAll(sel).forEach((el) => walk(el, 0));
      return lines.join('\n');
    }, [a.sel, +a.depth]);
    console.log(out);
  }
  if (a.shot) { await sleep(600); await page.screenshot({ path: a.shot }); }
} finally { await cleanup(); }
