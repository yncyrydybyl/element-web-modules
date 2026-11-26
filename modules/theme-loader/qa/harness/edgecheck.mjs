#!/usr/bin/env node
// Automated edge checks for one theme → qa/reports/<id>[--<phase>].json + .md
//   node qa/harness/edgecheck.mjs --theme <id> [--phase p] [--base-url URL] [--user themes-mira] [--views timeline,irc]
// Checks per view: axe-core (WCAG 2 A/AA incl. color-contrast), keyboard focus visibility (Tab walk), console errors,
// horizontal overflow, essential elements with zero size / invisible, clipped text without ellipsis.
// Variants whose stage is level-5+ / invisible / unreadable (by design) are "report-only": findings never fail.
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, launch, parseArgs, resolveBase, fixtures, themeUrl, waitForApp, dismissNags, closeOverlays, gotoRoom,
  setDeviceSetting, selectSpace, themeStatus, variantMeta, ensureDir, log, sleep, findModuleFile,
} from './lib.mjs';

const a = parseArgs(process.argv.slice(2), { user: 'themes-mira' });
if (!a.theme) { console.error('usage: edgecheck.mjs --theme <id> [--phase p] [--base-url URL]'); process.exit(2); }
const base = await resolveBase(a.baseUrl);
const R = fixtures().rooms;
const meta = variantMeta(a.theme);
const stage = meta?.stage || '';
const lvl = /^level-(\d+)/.exec(stage);
const reportOnly = (lvl && +lvl[1] >= 5) || /invisible|unreadable/.test(stage) || /invisible|unreadable/.test(a.theme)
  || /unreadable by design|readability not a goal/i.test(meta?.description || '');
const axeSrc = fs.readFileSync(findModuleFile('axe-core', 'axe.min.js'), 'utf8');

const ESSENTIAL = {
  timeline: ['.mx_BasicMessageComposer_input', '.mx_RoomHeader', '.mx_EventTile_body', '.mx_RoomListItemView, [role="option"]', '.mx_UserMenu, [aria-label="User menu"]'],
  bubble: ['.mx_BasicMessageComposer_input', '.mx_EventTile_body'],
  irc: ['.mx_BasicMessageComposer_input', '.mx_EventTile_body', '.mx_DisambiguatedProfile'],
  home: ['.mx_RoomListItemView, [role="option"]', '.mx_SpacePanel'],
  thread: ['.mx_ThreadView .mx_EventTile_body', '.mx_ThreadView .mx_BasicMessageComposer_input'],
  settings: ['.mx_UserSettingsDialog .mx_TabbedView_tabLabel'],
  modal: ['.mx_Dialog input', '.mx_Dialog button'],
};
const allViews = ['home', 'timeline', 'bubble', 'irc', 'thread', 'settings', 'modal', 'login'];
const views = a.views ? String(a.views).split(',') : allViews;

const report = { theme: a.theme, phase: a.phase || null, name: (typeof meta?.name === 'object' && meta?.name ? (meta.name.en || Object.values(meta.name)[0]) : meta?.name) || null, stage, reportOnly, base,
  started: new Date().toISOString(), views: {}, consoleErrors: [], summary: {} };

const { page, consoleErrors, cleanup } = await launch({ user: a.user, base });

async function checks(view, { scope = '#matrixchat, #mx_Dialog_Container' } = {}) {
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await sleep(600);
  const out = {};
  // --- axe
  try {
    await page.evaluate(axeSrc);
    out.axe = await page.evaluate(async (sc) => {
      const ctx = { include: sc.split(',').map((s) => s.trim()).filter((s) => document.querySelector(s)) };
      const r = await window.axe.run(ctx.include.length ? ctx : document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }, resultTypes: ['violations'],
      });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, count: v.nodes.length,
        samples: v.nodes.slice(0, 4).map((n) => ({ target: n.target.join(' '), summary: (n.failureSummary || '').split('\n').slice(0, 2).join(' ').slice(0, 220) })) }));
    }, scope);
  } catch (e) { out.axe = [{ id: 'axe-error', impact: 'n/a', help: String(e.message).slice(0, 200), count: 1, samples: [] }]; }
  // --- overflow, zero-size essentials, clipped text
  Object.assign(out, await page.evaluate((essential) => {
    const vw = document.documentElement.clientWidth;
    const desc = (el) => {
      const c = typeof el.className === 'string' ? el.className.split(/\s+/).filter((x) => x && !/^_.*_[a-z0-9]{5,}$/i.test(x)).slice(0, 2).join('.') : '';
      return el.tagName.toLowerCase() + (c ? '.' + c : '') + (el.getAttribute('aria-label') ? `[aria-label="${el.getAttribute('aria-label').slice(0, 30)}"]` : '');
    };
    const overflow = { page: document.documentElement.scrollWidth > vw + 1 || document.body.scrollWidth > vw + 1, offenders: [] };
    for (const el of document.querySelectorAll('#matrixchat *, .mx_Dialog *')) {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > vw + 2 && getComputedStyle(el).position !== 'fixed') {
        // ignore children of horizontally scrollable containers
        let p = el.parentElement, scrollable = false;
        while (p && p !== document.body) { const ox = getComputedStyle(p).overflowX; if ((ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') && p.getBoundingClientRect().right <= vw + 2) { scrollable = true; break; } p = p.parentElement; }
        if (!scrollable) overflow.offenders.push({ el: desc(el), right: Math.round(r.right) });
      }
      if (overflow.offenders.length >= 8) break;
    }
    const missing = [];
    for (const sel of essential) {
      const els = [...document.querySelectorAll(sel)];
      if (!els.length) { missing.push({ selector: sel, problem: 'not in DOM' }); continue; }
      const vis = els.find((el) => {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        return r.width >= 2 && r.height >= 2 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05;
      });
      if (!vis) { const r = els[0].getBoundingClientRect(); missing.push({ selector: sel, problem: `zero-size/invisible (${Math.round(r.width)}x${Math.round(r.height)})` }); }
    }
    const clipped = [];
    const textSel = '.mx_EventTile_body, .mx_DisambiguatedProfile, .mx_RoomHeader_heading, .mx_RoomListItemView *, .mx_TabbedView_tabLabel, .mx_AccessibleButton, button, .mx_Dialog_title, .mx_ThreadSummary *';
    for (const el of document.querySelectorAll(textSel)) {
      if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const hClip = el.scrollWidth > el.clientWidth + 2 && /hidden|clip/.test(cs.overflowX) && cs.textOverflow !== 'ellipsis';
      const vClip = el.scrollHeight > el.clientHeight + 3 && /hidden|clip/.test(cs.overflowY) && !(parseInt(cs.webkitLineClamp) > 0);
      if (hClip || vClip) clipped.push({ el: desc(el), text: el.textContent.trim().slice(0, 50), how: hClip ? 'horizontal' : 'vertical' });
      if (clipped.length >= 12) break;
    }
    return { overflow, missing, clipped };
  }, ESSENTIAL[view] || []));
  // --- keyboard focus visibility: Tab through 12 stops, compare focus styles
  out.focus = await focusWalk();
  report.views[view] = out;
  const ax = out.axe.reduce((n, v) => n + v.count, 0);
  log(`${view}: axe ${out.axe.length} rules/${ax} nodes, overflow ${out.overflow.page ? 'PAGE' : out.overflow.offenders.length}, missing ${out.missing.length}, clipped ${out.clipped.length}, focus invisible ${out.focus.invisible.length}/${out.focus.stops}`);
}

async function focusWalk() {
  const res = { stops: 0, invisible: [] };
  await page.mouse.click(5, 5).catch(() => {});
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    await sleep(120);
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
      const shadow = cs.boxShadow && cs.boxShadow !== 'none';
      const name = el.tagName.toLowerCase() + (el.getAttribute('aria-label') ? `[aria-label="${el.getAttribute('aria-label').slice(0, 30)}"]` : '') + (el.textContent ? ` "${el.textContent.trim().slice(0, 25)}"` : '');
      // compare with blurred styles
      const snap = { bg: cs.backgroundColor, border: cs.borderColor, color: cs.color };
      return { name, outline, shadow, snap, focusVisible: el.matches(':focus-visible') };
    });
    if (!info) continue;
    res.stops++;
    if (!info.outline && !info.shadow) {
      // last resort: did background/border change vs. the same element without focus?
      const changed = await page.evaluate((s) => {
        const el = document.activeElement; el.blur(); const cs = getComputedStyle(el);
        const diff = cs.backgroundColor !== s.bg || cs.borderColor !== s.border || cs.color !== s.color;
        el.focus({ focusVisible: true }); return diff;
      }, info.snap);
      if (!changed) res.invisible.push(info.name);
    }
  }
  return res;
}

try {
  await page.goto(themeUrl(base, { theme: a.theme, phase: a.phase, hash: '/home' }), { waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  await dismissNags(page);
  report.themeStatus = await themeStatus(page, a.theme);
  await setDeviceSetting(page, 'layout', 'group');
  await selectSpace(page, R.space);
  if (views.includes('home')) { await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_home_page' })); await checks('home'); }
  if (views.includes('timeline')) { await gotoRoom(page, R.showcase); await checks('timeline'); }
  if (views.includes('bubble')) { await gotoRoom(page, R.showcase); await setDeviceSetting(page, 'layout', 'bubble'); await sleep(800); await checks('bubble'); }
  if (views.includes('irc')) { await gotoRoom(page, R.showcase); await setDeviceSetting(page, 'layout', 'irc'); await sleep(800); await checks('irc'); }
  await setDeviceSetting(page, 'layout', 'group');
  if (views.includes('thread')) {
    await gotoRoom(page, R.showcase);
    try {
      for (let i = 0; i < 20 && !(await page.locator('.mx_EventTile').filter({ hasText: 'which theme should be the default' }).count()); i++) {
        await page.evaluate(() => { const p = document.querySelector('.mx_RoomView_messagePanel'); if (p) p.scrollTop = 0; }); await sleep(800);
      }
      await page.locator('.mx_EventTile').filter({ hasText: 'which theme should be the default' }).last().locator('.mx_ThreadSummary, [class*="ThreadSummary"]').first().click();
      await page.locator('.mx_ThreadView .mx_EventTile').first().waitFor();
      await checks('thread');
    } catch (e) { report.views.thread = { error: String(e.message).split('\n')[0] }; }
    await page.evaluate(() => { try { window.mxSdkContext?.rightPanelStore?.hide?.(null); } catch { /* */ } });
  }
  if (views.includes('settings')) {
    await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_user_settings', initialTabId: 'USER_APPEARANCE_TAB' }));
    await page.locator('.mx_UserSettingsDialog').waitFor();
    await page.locator('.mx_TabbedView_tabLabel, [role="tab"]').filter({ hasText: /^\s*Themes\s*$/ }).first().click().catch(() => {});
    await checks('settings', { scope: '#mx_Dialog_Container' });
    await closeOverlays(page);
  }
  if (views.includes('modal')) {
    await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_create_room' }));
    await page.locator('.mx_Dialog').first().waitFor();
    await checks('modal', { scope: '#mx_Dialog_Container' });
    await closeOverlays(page);
  }
} finally {
  report.consoleErrors = [...new Set(consoleErrors)].filter((e) => !/Failed to load resource.*(404|401)|M_NOT_FOUND|net::ERR_ABORTED/.test(e)).slice(0, 40);
  await cleanup();
}
if (views.includes('login')) {
  const anon = await launch({ user: null, base });
  try {
    await anon.page.goto(themeUrl(base, { theme: a.theme, phase: a.phase, hash: '/login' }), { waitUntil: 'domcontentloaded' });
    await anon.page.locator('.mx_AuthPage, .mx_Welcome, .mx_Login').first().waitFor({ timeout: 60000 });
    await sleep(1500);
    await anon.page.evaluate(axeSrc);
    const v = await anon.page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, resultTypes: ['violations'] }))
      .violations.map((x) => ({ id: x.id, impact: x.impact, help: x.help, count: x.nodes.length, samples: x.nodes.slice(0, 3).map((n) => ({ target: n.target.join(' '), summary: (n.failureSummary || '').slice(0, 200) })) })));
    report.views.login = { axe: v, overflow: { page: false, offenders: [] }, missing: [], clipped: [], focus: { stops: 0, invisible: [] } };
    log(`login: axe ${v.length} rules`);
  } catch (e) { report.views.login = { error: String(e.message).split('\n')[0] }; }
  finally { await anon.cleanup(); }
}

// ---- summary + markdown
const S = { axeSerious: 0, contrastNodes: 0, overflowViews: 0, missing: 0, clipped: 0, focusInvisible: 0 };
for (const v of Object.values(report.views)) {
  if (v.error) continue;
  for (const x of v.axe || []) { if (['serious', 'critical'].includes(x.impact)) S.axeSerious += x.count; if (x.id === 'color-contrast') S.contrastNodes += x.count; }
  if (v.overflow?.page || v.overflow?.offenders?.length) S.overflowViews++;
  S.missing += v.missing?.length || 0; S.clipped += v.clipped?.length || 0; S.focusInvisible += v.focus?.invisible?.length || 0;
}
S.consoleErrors = report.consoleErrors.length;
S.fail = !reportOnly && (S.missing > 0 || S.overflowViews > 0 || report.consoleErrors.some((e) => /pageerror/.test(e)));
report.summary = S;
report.finished = new Date().toISOString();
const dir = ensureDir(path.join(ROOT, 'qa/reports'));
const stem = path.join(dir, a.theme + (a.phase ? `--${a.phase}` : ''));
fs.writeFileSync(stem + '.json', JSON.stringify(report, null, 2));

const md = [];
md.push(`# Edge check: ${report.name || a.theme}${a.phase ? ` (phase ${a.phase})` : ''}`, '');
md.push(`- id: \`${a.theme}\` · stage: \`${stage || 'unknown'}\`${reportOnly ? ' · **report-only** (unreadable by design)' : ''}`);
md.push(`- base: ${base} · ${report.finished}`);
md.push(`- loader: html[data-tl-theme] = \`${report.themeStatus?.tlTheme}\`${report.themeStatus?.tlTheme !== a.theme ? ' ⚠ not applied' : ''}`);
md.push(`- result: **${S.fail ? 'FAIL' : 'pass'}** — axe serious/critical nodes ${S.axeSerious} (contrast ${S.contrastNodes}), views with overflow ${S.overflowViews}, missing/zero-size essentials ${S.missing}, clipped texts ${S.clipped}, focus stops without visible focus ${S.focusInvisible}, console errors ${S.consoleErrors}`, '');
for (const [name, v] of Object.entries(report.views)) {
  md.push(`## ${name}`, '');
  if (v.error) { md.push(`Could not check: ${v.error}`, ''); continue; }
  if (v.axe?.length) {
    md.push('| axe rule | impact | nodes | example |', '|---|---|---|---|');
    for (const x of v.axe) md.push(`| ${x.id} | ${x.impact} | ${x.count} | \`${(x.samples[0]?.target || '').replace(/\|/g, '\\|').slice(0, 70)}\` |`);
    md.push('');
  } else md.push('axe: no violations', '');
  if (v.overflow?.page || v.overflow?.offenders?.length) md.push(`- horizontal overflow${v.overflow.page ? ' (page scrolls)' : ''}: ${v.overflow.offenders.map((o) => `\`${o.el}\`→${o.right}px`).join(', ')}`);
  for (const m of v.missing || []) md.push(`- essential element \`${m.selector}\`: ${m.problem}`);
  for (const c of v.clipped || []) md.push(`- clipped (${c.how}): \`${c.el}\` “${c.text}”`);
  if (v.focus?.invisible?.length) md.push(`- no visible focus on ${v.focus.invisible.length}/${v.focus.stops} Tab stops: ${v.focus.invisible.slice(0, 5).map((x) => `\`${x}\``).join(', ')}`);
  md.push('');
}
if (report.consoleErrors.length) { md.push('## Console errors', '', ...report.consoleErrors.slice(0, 15).map((e) => '- `' + e.replace(/`/g, "'").slice(0, 200) + '`'), ''); }
fs.writeFileSync(stem + '.md', md.join('\n'));
log(`report → ${path.relative(ROOT, stem)}.md (${S.fail ? 'FAIL' : 'pass'}${reportOnly ? ', report-only' : ''})`);
process.exit(S.fail ? 1 : 0);
