#!/usr/bin/env node
// KDE family dev tool: open Element (logged in, copied profile) with a theme and either dump a DOM outline of
// key regions or take ad-hoc screenshots. Not part of the theme bundle.
//   node themes/kde/tools/probe.mjs --theme kde-breeze-light --room showcase --dump out.txt --shot out.png
//   [--eval "js"] [--phase night] [--width 1440 --height 900] [--click "<css selector>"]
import fs from 'node:fs';
import { launch, resolveBase, themeUrl, waitForApp, dismissNags, selectSpace, gotoRoom, fixtures, parseArgs, stabilise, sleep, closeOverlays } from '../../../qa/harness/lib.mjs';

const a = parseArgs(process.argv.slice(2), { width: 1440, height: 900 });
const base = await resolveBase(a.baseUrl);
const F = fixtures();
const { page, consoleErrors, cleanup } = await launch({ user: a.user || 'themes-mira', base, viewport: { width: +a.width, height: +a.height } });
try {
  await page.goto(themeUrl(base, { theme: a.theme, phase: a.phase }));
  await waitForApp(page);
  await stabilise(page);
  await dismissNags(page);
  await selectSpace(page, F.rooms.space);
  if (a.room) await gotoRoom(page, F.rooms[a.room] || a.room);
  if (a.layout) { await page.evaluate((l) => window.mxSettingsStore.setValue('layout', null, 'device', l), a.layout); await sleep(1200); }
  await dismissNags(page);
  for (const sel of [].concat(a.click || [])) { if (typeof sel === 'string') { await page.locator(sel).first().click(); await sleep(900); } }
  if (a.press) { await page.keyboard.press(a.press); await sleep(600); }
  if (a.eval) { const r = await page.evaluate(a.eval); console.log(typeof r === 'string' ? r : JSON.stringify(r, null, 1)); }
  if (a.dump) {
    const out = await page.evaluate((rootSel) => {
      const lines = [];
      const walk = (el, d) => {
        if (d > 22) return;
        const cls = typeof el.className === 'string' ? el.className : (el.className?.baseVal || '');
        const attrs = ['role', 'aria-label', 'data-testid', 'data-layout', 'data-self', 'data-color', 'data-type', 'aria-selected']
          .map((n) => el.getAttribute(n) ? `${n}="${el.getAttribute(n).slice(0, 40)}"` : '').filter(Boolean).join(' ');
        const txt = el.children.length === 0 ? (el.textContent || '').trim().slice(0, 30) : '';
        const cs = getComputedStyle(el);
        lines.push(`${'  '.repeat(d)}<${el.tagName.toLowerCase()} ${cls ? '.' + cls.split(/\s+/).join('.') : ''} ${attrs}> ${txt} [${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)} bg=${cs.backgroundColor}]`);
        if (el.tagName === 'svg') return;
        for (const c of el.children) walk(c, d + 1);
      };
      walk(document.querySelector(rootSel) || document.body, 0);
      return lines.join('\n');
    }, a.root || '#matrixchat');
    fs.writeFileSync(a.dump, out);
    console.log('dumped', out.split('\n').length, 'lines');
  }
  if (a.shot) { await sleep(600); await page.screenshot({ path: a.shot }); console.log('shot', a.shot); }
  if (consoleErrors.length) console.log('console errors:', consoleErrors.filter((e) => /theme-loader|kde/i.test(e)).slice(0, 10));
} finally {
  await cleanup();
}
