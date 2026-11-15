#!/usr/bin/env node
// Functional test matrix: per-theme P0 (+ P1) cases from docs/TESTCASES.md, one logged-in pool session per theme.
//   node tests/harness/functional.mjs --themes all|sample|<id,id> [--base-url URL] [--run NAME] [--tier p0|p1]
//        [--send] [--send-extra] [--modules] [--parallel N] [--mobile-module] [--no-auth]
// --modules   : production module coexistence (MOD-01/02/05, HDR-06) in an extra session with the teams-welcome guide shown
// --tier p0   : P0 cases only (+ a few P1 that are free once the view is open)
// --tier p1   : also the P1 UI cases (thread, room info, members, emoji, spotlight, layouts, motion, E2EE …)
// --send      : MSG-01/CMP-02 — sends one short message to "Theme Lab · Sandbox" (the only room we write to)
// --send-extra: MSG-02..10 (markdown, reply, edit, redact, react, thread, poll, file, image) in the Sandbox
// Output: tests/reports/matrix/<run>.json, screenshots recordings/tests/<case>/<run>/<theme>[--x].png
// Writes: read receipts + the Sandbox messages above. Device settings (layout, RoomList) restored on close.
// Never clicks a theme card or Enter in the switcher (no account-data writes); THM-03 verifies that.
import path from 'node:path';
import { ROOT, parseArgs, resolveBase, fixtures, selectSpace, gotoRoom, setDeviceSetting, sleep, log, scrollInPanel, resetRootScroll } from './lib.mjs';
import { openSession, loadApp, Recorder, runCase, installProbe, allThemes, themeMeta, reportOnly, CATALOGUE, getThemeAccountData } from './matrixlib.mjs';

const a = parseArgs(process.argv.slice(2), { themes: 'sample', tier: 'p0', parallel: 3 });
const base = await resolveBase(a.baseUrl);
const R = fixtures().rooms;
const tier = String(a.tier);
const P1 = tier === 'p1';
const themes = a.themes === 'all' ? ['element-default', ...allThemes().map((t) => t.id)]
  : a.themes === 'sample' ? CATALOGUE.sample : String(a.themes).split(',');
const run = a.run || `functional-${new URL(base).hostname.split('.')[0]}-${tier}`;
const rec = new Recorder({ run, base, extra: { tier, send: !!a.send, sendExtra: !!a.sendExtra, mobileModule: !!a.mobileModule, themes: themes.length } });
const THEME_ANIM = /^(e|ewt|kde|lc|od|sk|tm|w311|xk|xl|xt|pp|paper|cm|comic)-/;

async function testTheme(theme) {
  const meta = themeMeta(theme);
  const ro = reportOnly(meta);
  const s = await openSession({ base, mobileModule: !!a.mobileModule });
  const page = s.page;
  const C = (id, fn, o = {}) => runCase(rec, s, id, theme, fn, o);
  const vis = (sel) => page.locator(sel).filter({ visible: true });
  const closeAll = async () => { for (let i = 0; i < 4; i++) { if (!(await page.locator('.mx_Dialog, .mx_ContextualMenu, [role="menu"]').count())) break; await page.keyboard.press('Escape'); await sleep(300); } };
  const settle = () => page.evaluate(() => Promise.race([new Promise((r) => setTimeout(r, 2500)),
    Promise.all(document.getAnimations().filter((x) => { const t = x.effect?.getTiming?.(); return t && t.iterations !== Infinity && x.playState === 'running'; }).map((x) => x.finished.catch(() => {})))])).catch(() => {});
  const contrast = async (sel, max = 8) => { await settle(); return cntr(sel, max); };
  const cntr = (sel, max = 8) => page.evaluate(([sel, max]) => window.__tlm.contrastStats([...document.querySelectorAll(sel)].filter(window.__tlm.visible).slice(0, max)), [sel, max]);
  const judge = (st, min = 3, label = 'contrast') => {
    if (!st.n) return { status: 'fail', detail: `${label}: no visible text` };
    const ok = st.median >= min;
    return { status: ok ? 'pass' : (st.image ? 'report' : 'fail'), detail: `${label} median ${st.median} min ${st.min} (n=${st.n}${st.image ? `, ${st.image} on bg image` : ''})`, data: st };
  };
  const tile = (text) => page.locator('.mx_EventTile').filter({ hasText: text }).last();
  async function scrollTo(text) {
    for (let i = 0; i < 25; i++) {
      const t = tile(text);
      if (await t.count()) { await scrollInPanel(t, 'center'); await sleep(600); await scrollInPanel(t, 'center'); await sleep(300); return t; }
      await page.evaluate(() => { const p = document.querySelector('.mx_RoomView_messagePanel'); if (p) p.scrollTop = 0; });
      await sleep(900);
    }
    throw new Error(`event "${text}" not found`);
  }
  const scrollBottom = async () => {
    await page.evaluate(() => { const p = document.querySelector('.mx_RoomView_messagePanel'); if (p) p.scrollTop = p.scrollHeight; });
    const j = page.locator('.mx_JumpToBottomButton_scrollDown'); if (await j.count()) await j.first().click().catch(() => {});
    await sleep(800);
  };
  const closeRightPanel = async () => { await page.evaluate(() => { try { window.mxSdkContext?.rightPanelStore?.hide?.(null); } catch { /* */ } }); await sleep(300); };
  const home = async () => { await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_home_page' })); await selectSpace(page, R.space); await sleep(900); };

  try {
    // ---------------------------------------------------------------- boot
    let booted = false;
    await C('SHELL-01', async () => {
      await loadApp(s, base, theme);
      booted = true;
      const pe = s.errors.filter((e) => e.startsWith('pageerror'));
      return pe.length ? { status: 'fail', detail: pe[0] } : { status: 'pass' };
    });
    if (!booted) return;
    await installProbe(page);
    await setDeviceSetting(page, 'layout', 'group');
    await C('THM-01', async () => {
      const st = await page.evaluate(() => ({ t: document.documentElement.dataset.tlTheme || null, f: document.documentElement.dataset.tlFamily || null, b: document.documentElement.dataset.tlBase || null }));
      const want = theme === 'element-default' ? null : theme;
      const tlErr = s.errors.filter((e) => /\[theme-loader\]/.test(e));
      if (st.t !== want) return { status: 'fail', detail: `data-tl-theme=${st.t}, want ${want}` };
      if (want && (!st.f || !st.b)) return { status: 'fail', detail: `family/base missing ${JSON.stringify(st)}` };
      if (tlErr.length) return { status: 'fail', detail: tlErr[0] };
      return { status: 'pass', detail: JSON.stringify(st) };
    });

    // ---------------------------------------------------------------- room list
    await home();
    await C('RL-01', async () => {
      const n = await vis('.mx_RoomListItemView').count();
      if (n < 5) return { status: 'fail', detail: `${n} visible room list items` };
      const r = judge(await contrast('.mx_RoomListItemView', 10), 3, `${n} rooms; name contrast`);
      if (ro && r.status === 'fail') r.status = 'report';
      return r;
    }, { shootAlways: true, shotName: 'home' });
    await C('BDG-01', async () => {
      const st = await page.evaluate(() => {
        const b = [...document.querySelectorAll('.mx_RoomListPanel [class*="_unread-counter_"], .mx_RoomListPanel [class*="_notificationDecoration_"] > *')].filter(window.__tlm.visible);
        return { n: b.length, c: window.__tlm.contrastStats(b) };
      });
      if (!st.n) return { status: 'fail', detail: 'no visible unread badges (seed.py unread?)' };
      return { status: 'pass', detail: `${st.n} badges, count contrast median ${st.c.median}` };
    }, { ro });
    await C('SHELL-04', async () => {
      const r = await page.evaluate(() => {
        const out = {};
        for (const [k, sel] of [['roomItem', '.mx_RoomListItemView'], ['userMenu', '.mx_UserMenu, [aria-label="User menu"]'], ['space', '.mx_SpaceButton']]) {
          const el = [...document.querySelectorAll(sel)].find(window.__tlm.visible); out[k] = el ? window.__tlm.hittable(el) : { ok: false, why: 'not visible' };
        }
        return out;
      });
      const bad = Object.entries(r).filter(([, v]) => !v.ok);
      return bad.length ? { status: 'fail', detail: bad.map(([k, v]) => `${k}: ${v.why}`).join('; ') } : { status: 'pass' };
    }, { ro });
    await C('RL-02', async () => {
      const item = vis('.mx_RoomListItemView').filter({ hasText: 'Sandbox' }).first();
      if (!(await item.count())) return { status: 'fail', detail: 'Sandbox not in room list' };
      await item.click({ timeout: 8000 });
      await page.waitForFunction((rid) => location.hash.includes(rid) && document.querySelector('.mx_RoomView'), R.sandbox, { timeout: 15000 });
      await sleep(1200);
      const name = await page.locator('.mx_RoomHeader_heading').first().innerText().catch(() => '');
      return /sandbox/i.test(name) ? { status: 'pass', detail: `header "${name}"` } : { status: 'fail', detail: `header shows "${name}"` };
    }, { ro });
    if (!(await page.evaluate((rid) => location.hash.includes(rid), R.sandbox))) await gotoRoom(page, R.sandbox);

    // ---------------------------------------------------------------- header + composer (Sandbox)
    await C('HDR-01', async () => {
      const r = await page.evaluate(() => { const h = document.querySelector('.mx_RoomHeader_heading'); if (!h) return null; return { w: Math.round(h.getBoundingClientRect().width), c: window.__tlm.contrastOf(window.__tlm.textEls(h, 1)[0] || h) }; });
      if (!r) return { status: 'fail', detail: 'no heading' };
      if (r.w < 40) return { status: 'fail', detail: `heading width ${r.w}px` };
      if (r.c && r.c.ratio < 3 && !r.c.image) return { status: 'fail', detail: `heading contrast ${r.c.ratio}` };
      return { status: 'pass', detail: `width ${r.w}, contrast ${r.c?.ratio}` };
    }, { ro });
    await C('HDR-02', async () => {
      const r = await page.evaluate(() => [...document.querySelectorAll('.mx_RoomHeader button, .mx_RoomHeader [role=button]')]
        .filter((b) => b.getBoundingClientRect().width > 4 && !b.classList.contains('mx_RoomHeader_infoWrapper'))
        .map((b) => ({ l: b.getAttribute('aria-label') || b.className.toString().slice(0, 30), h: window.__tlm.hittable(b) })));
      const bad = r.filter((x) => !x.h.ok);
      return bad.length ? { status: 'fail', detail: bad.map((x) => `${x.l}: ${x.h.why}`).join('; ') } : { status: 'pass', detail: `${r.length} buttons hittable` };
    }, { ro });
    await C('ICO-01', async () => {
      const st = await page.evaluate(() => {
        const vals = [];
        for (const b of document.querySelectorAll('.mx_RoomHeader [class*="_icon-button_"], .mx_MessageComposer [class*="_icon-button_"], .mx_MessageComposer .mx_AccessibleButton')) {
          if (!window.__tlm.visible(b)) continue; const svg = b.querySelector('svg'); if (!svg) continue;
          const c = window.__tlm.contrastOf(svg); if (c) vals.push(c.ratio);
        }
        vals.sort((x, y) => x - y); return { n: vals.length, min: vals[0], median: vals[Math.floor(vals.length / 2)] };
      });
      if (!st.n) return { status: 'report', detail: 'no svg icons found (theme draws icons differently; verify visually)' };
      if (st.median === 1) return { status: 'report', detail: 'svg icons transparent (icon drawn via CSS mask/background; verify visually)' };
      return { status: st.median >= 2 ? 'pass' : 'fail', detail: `icon contrast median ${st.median} min ${st.min} (n=${st.n})` };
    }, { ro });
    await C('THM-06', async () => {
      const b = page.locator('.tl-header-button').first();
      if (!(await b.count())) return { status: 'fail', detail: 'no .tl-header-button' };
      const h = await b.evaluate((el) => window.__tlm.hittable(el));
      if (!h.ok) return { status: 'fail', detail: 'header button ' + h.why };
      await b.click();
      await page.locator('.tl-switcher').first().waitFor({ state: 'visible', timeout: 5000 });
      await page.keyboard.press('Escape'); await sleep(500);
      return { status: 'pass' };
    });
    await closeAll();
    const composer = page.locator('.mx_BasicMessageComposer_input').first();
    await C('CMP-01', async () => {
      if (!(await composer.isVisible())) return { status: 'fail', detail: 'composer not visible' };
      const h = await composer.evaluate((el) => window.__tlm.hittable(el));
      if (!h.ok) return { status: 'fail', detail: 'composer ' + h.why };
      await composer.click(); await page.keyboard.type('Probe text 123', { delay: 10 });
      const r = await page.evaluate(() => {
        const ed = document.querySelector('.mx_BasicMessageComposer_input');
        const focused = ed.contains(document.activeElement) || ed === document.activeElement;
        const t = window.__tlm.textEls(ed, 1)[0];
        return { focused, text: ed.textContent, c: t ? window.__tlm.contrastOf(t) : null };
      });
      await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace');
      if (!r.focused) return { status: 'fail', detail: 'composer not focused after click' };
      if (!/Probe text 123/.test(r.text)) return { status: 'fail', detail: `typed text missing: "${r.text}"` };
      if (!r.c) return { status: 'fail', detail: 'typed text not visible' };
      const ok = r.c.ratio >= 3 || r.c.image;
      return { status: ok ? 'pass' : (ro ? 'report' : 'fail'), detail: `typed text contrast ${r.c.ratio} (${r.c.fg} on ${r.c.bg})` };
    });
    await C('CMP-03', async () => {
      const c = await page.evaluate(() => {
        const ed = document.querySelector('.mx_BasicMessageComposer_input'); const ph = getComputedStyle(ed.firstElementChild || ed, '::before');
        return { content: ph.content, color: ph.color };
      });
      return c.content && c.content !== 'none' ? { status: 'pass', detail: `placeholder ${c.content.slice(0, 40)}` } : { status: 'report', detail: 'no ::before placeholder found' };
    });
    let sentText = null;
    if (a.send) {
      await C('MSG-01', async () => {
        sentText = `matrix-test · ${theme} · ${new Date().toISOString().slice(11, 19)}`;
        await composer.click(); await page.keyboard.type(sentText, { delay: 5 }); await page.keyboard.press('Enter');
        const t = page.locator('.mx_EventTile').filter({ hasText: sentText }).last();
        await t.waitFor({ timeout: 15000 });
        await page.waitForFunction((txt) => { const tiles = [...document.querySelectorAll('.mx_EventTile')].filter((e) => e.textContent.includes(txt)); const e = tiles.at(-1); return e && !e.matches('.mx_EventTile_sending, .mx_EventTile_notSent, [class*="_stateSending_"], [class*="_stateNotSent_"]'); }, sentText, { timeout: 15000 });
        const c = await t.evaluate((el) => window.__tlm.contrastStats([el.querySelector('.mx_EventTile_body')].filter(Boolean)));
        return { status: 'pass', detail: `sent and echoed; body contrast ${c.median}` };
      }, { shootAlways: true });
      const m = rec.results.at(-1);
      rec.add('CMP-02', theme, m.status, 'via MSG-01: ' + m.detail);
    }

    // ---------------------------------------------------------------- timeline (Showcase)
    await gotoRoom(page, R.showcase); await closeRightPanel(); await scrollBottom();
    await C('TL-01', async () => {
      const st = await page.evaluate(() => {
        const panel = document.querySelector('.mx_RoomView_messagePanel'); const pr = panel.getBoundingClientRect();
        const bodies = [...document.querySelectorAll('.mx_RoomView_messagePanel .mx_EventTile_body')].filter((b) => { const r = b.getBoundingClientRect(); return window.__tlm.visible(b) && r.bottom > pr.top && r.top < pr.bottom; });
        return { n: bodies.length, c: window.__tlm.contrastStats(bodies.slice(-8)) };
      });
      if (st.n < 3) return { status: 'fail', detail: `${st.n} visible message bodies` };
      const r = judge(st.c, 3, `${st.n} bodies; text contrast`);
      if (ro && r.status === 'fail') r.status = 'report';
      return r;
    }, { shootAlways: true });
    await C('SHELL-02', async () => {
      const o = await page.evaluate(() => ({ d: document.documentElement.scrollWidth, b: document.body.scrollWidth, v: document.documentElement.clientWidth }));
      return o.d > o.v + 1 || o.b > o.v + 1 ? { status: 'fail', detail: JSON.stringify(o) } : { status: 'pass' };
    });
    await C('TL-22', async () => {
      const t = page.locator('.mx_RoomView_messagePanel .mx_EventTile').filter({ has: page.locator('.mx_EventTile_body') }).last();
      await t.hover(); await sleep(400);
      const bar = t.locator('.mx_MessageActionBar');
      if (!(await bar.isVisible())) return { status: 'fail', detail: 'action bar not visible on hover' };
      const h = await bar.evaluate((el) => window.__tlm.hittable(el.querySelector('[role=button], button') || el));
      return h.ok ? { status: 'pass' } : { status: 'fail', detail: 'action bar ' + h.why };
    }, { ro });
    await C('TL-23', async () => {
      const t = page.locator('.mx_RoomView_messagePanel .mx_EventTile').filter({ has: page.locator('.mx_EventTile_body') }).last();
      await t.hover(); await sleep(300);
      await t.locator('.mx_MessageActionBar [aria-label="Options"]').click({ timeout: 5000 });
      await page.locator('.mx_ContextualMenu, [role="menu"]').first().waitFor({ timeout: 5000 }); await sleep(600);
      const r = judge(await contrast('.mx_ContextualMenu [role=menuitem], [role=menu] [role=menuitem]', 8), 3, 'menu item contrast');
      await page.keyboard.press('Escape');
      return r;
    }, { ro });
    await closeAll();
    if (P1) {
      await C('TL-10', async () => {
        const t = await scrollTo('New gallery screenshots are up');
        const st = await t.evaluate((el) => { const b = [...el.querySelectorAll('[class*="_reactionsRowButton_"]:not([class*="Content"]):not([class*="Count"])')].filter(window.__tlm.visible); return { n: b.length, c: window.__tlm.contrastStats(b) }; });
        if (st.n < 3) return { status: 'fail', detail: `${st.n} reaction pills` };
        return { ...judge(st.c, 3, `${st.n} pills; count contrast`) };
      }, { ro });
      await C('TL-11', async () => {
        const root = await scrollTo('which theme should be the default');
        const sum = root.locator('.mx_ThreadSummary, [class*="ThreadSummary"]').first();
        if (!(await sum.isVisible())) return { status: 'fail', detail: 'thread summary not visible' };
        await sum.click();
        await page.locator('.mx_ThreadView .mx_EventTile').first().waitFor({ timeout: 10000 });
        return { status: 'pass' };
      }, { ro });
      await C('RP-01', async () => {
        if (!(await page.locator('.mx_ThreadView').count())) return { status: 'fail', detail: 'thread view not open (TL-11)' };
        await sleep(1000);
        const st = await page.evaluate(() => ({ n: [...document.querySelectorAll('.mx_ThreadView .mx_EventTile_body')].filter(window.__tlm.visible).length,
          comp: !!(document.querySelector('.mx_ThreadView .mx_BasicMessageComposer_input') && window.__tlm.visible(document.querySelector('.mx_ThreadView .mx_BasicMessageComposer_input'))),
          c: window.__tlm.contrastStats([...document.querySelectorAll('.mx_ThreadView .mx_EventTile_body')].filter(window.__tlm.visible).slice(-6)) }));
        if (st.n < 3 || !st.comp) return { status: 'fail', detail: `thread bodies ${st.n}, composer ${st.comp}` };
        const r = judge(st.c, 3, `thread ${st.n} bodies`); if (ro && r.status === 'fail') r.status = 'report'; return r;
      }, { shootAlways: true });
      await closeRightPanel();
      await C('RP-02', async () => {
        const btn = page.locator('.mx_RoomHeader [class*="_icon-button_"][aria-label="Room info"]').first();
        await btn.click({ timeout: 5000 });
        await page.locator('.mx_RightPanel').waitFor({ state: 'visible', timeout: 8000 }); await sleep(800);
        return judge(await contrast('.mx_RightPanel [role=menuitem], .mx_RightPanel h1, .mx_RightPanel h2, .mx_RightPanel button', 10), 3, 'room info contrast');
      }, { ro, shootAlways: true });
      await C('RP-03', async () => {
        if (!(await page.locator('.mx_RightPanel').isVisible().catch(() => false))) await page.locator('.mx_RoomHeader [class*="_icon-button_"][aria-label="Room info"]').first().click();
        const people = page.locator('.mx_RightPanel').getByRole('menuitem', { name: /People/ }).or(page.locator('.mx_RightPanel button', { hasText: /^People/ }));
        await people.first().click({ timeout: 5000 });
        await page.locator('.mx_MemberListView, .mx_MemberList').first().waitFor({ timeout: 8000 }); await sleep(800);
        const n = await page.locator('.mx_RightPanel [class*="MemberTile"], .mx_RightPanel .mx_EntityTile, .mx_RightPanel [role=option]').filter({ visible: true }).count();
        if (n < 3) return { status: 'fail', detail: `${n} members visible` };
        return judge(await contrast('.mx_MemberListView [role=option], .mx_MemberListView [class*="MemberTile"]', 6), 3, `${n} members`);
      }, { ro });
      await closeRightPanel();
      await C('CMP-05', async () => {
        await scrollBottom();
        await page.locator('.mx_MessageComposer [aria-label="Emoji"]').first().click({ timeout: 5000 });
        const pk = page.locator('.mx_ContextualMenu').filter({ has: page.locator('input') }).first();
        await pk.waitFor({ timeout: 5000 });
        await page.keyboard.type('thumbs'); await sleep(600);
        const n = await pk.locator('[role=gridcell], [role=option], li button, [class*="item"]').filter({ visible: true }).count();
        const inVp = await pk.evaluate((el) => window.__tlm.inViewport(el, 2));
        if (!inVp || !n) await page.screenshot({ path: rec.shotPath('CMP-05', theme, 'open') }).catch(() => {});
        await page.keyboard.press('Escape');
        return n && inVp ? { status: 'pass', detail: `${n} results` } : { status: 'fail', detail: `results ${n}, inViewport ${inVp}` };
      }, { ro });
      await closeAll();
      await C('NAV-01', async () => {
        await page.evaluate(() => document.activeElement?.blur?.());
        await page.keyboard.press('Control+k');
        await page.locator('.mx_SpotlightDialog').waitFor({ timeout: 5000 });
        const c = await contrast('.mx_SpotlightDialog input, .mx_SpotlightDialog [role=option]', 6);
        await page.keyboard.type('Code Rev', { delay: 20 }); await sleep(1200);
        await page.keyboard.press('Enter');
        await page.waitForFunction((rid) => location.hash.includes(rid), R.code, { timeout: 8000 });
        return { status: 'pass', detail: `spotlight contrast median ${c.median}` };
      }, { ro });
      rec.add('INP-05', theme, rec.results.at(-1).status, 'via NAV-01');
      await closeAll();
      await C('E2E-01', async () => {
        await gotoRoom(page, R.design); await scrollBottom();
        const st = await page.evaluate(() => ({ utd: document.querySelectorAll('.mx_DecryptionFailureBody, [class*="_stateEncryptionFailure_"]').length,
          n: [...document.querySelectorAll('.mx_RoomView_messagePanel .mx_EventTile_body')].filter(window.__tlm.visible).length }));
        if (st.utd) return { status: 'fail', detail: `${st.utd} decryption failures` };
        return st.n >= 3 ? { status: 'pass', detail: `${st.n} decrypted bodies` } : { status: 'fail', detail: `${st.n} bodies` };
      }, { ro });
      await C('SCR-02', async () => {
        await gotoRoom(page, R.showcase);
        await page.evaluate(async () => { const p = document.querySelector('.mx_RoomView_messagePanel'); for (let i = 0; i < 6; i++) { p.scrollTop = i % 2 ? p.scrollHeight : 0; await new Promise((r) => setTimeout(r, 250)); } });
        const sc = await page.evaluate(() => [document.scrollingElement, document.body, document.getElementById('matrixchat'), ...document.querySelectorAll('.mx_MatrixChat, .mx_RoomView, .mx_MainSplit')].filter(Boolean).map((r) => r.scrollTop + r.scrollLeft).reduce((x, y) => x + y, 0));
        await scrollBottom();
        return sc ? { status: 'fail', detail: `app root scrolled by ${sc}px` } : { status: 'pass' };
      });
      for (const [id, layout] of [['TL-03', 'bubble'], ['TL-04', 'irc']]) {
        await C(id, async () => {
          await setDeviceSetting(page, 'layout', layout); await sleep(900); await scrollBottom();
          const st = await page.evaluate(() => { const b = [...document.querySelectorAll('.mx_RoomView_messagePanel .mx_EventTile_body')].filter(window.__tlm.visible); return { n: b.length, c: window.__tlm.contrastStats(b.slice(-8)) }; });
          if (st.n < 3) return { status: 'fail', detail: `${st.n} bodies` };
          const r = judge(st.c, 3, `${layout}: ${st.n} bodies`); if (ro && r.status === 'fail') r.status = 'report'; return r;
        }, { shootAlways: true });
      }
      await setDeviceSetting(page, 'layout', 'group'); await sleep(500);
      await C('MOT-01', async () => {
        await page.emulateMedia({ reducedMotion: 'reduce' }); await sleep(1200);
        const r = await page.evaluate((reSrc) => {
          const re = new RegExp(reSrc); const out = [];
          for (const an of document.getAnimations()) {
            if (an.playState !== 'running') continue;
            const name = an.animationName || an.transitionProperty || '';
            const tgt = an.effect?.target;
            const inOverlay = tgt && tgt.closest?.('#tl-overlay-root');
            const dur = an.effect?.getTiming?.().duration;
            if ((re.test(an.animationName || '') || (inOverlay && !an.transitionProperty)) && (dur === Infinity || dur > 10 || an.effect?.getTiming?.().iterations > 1)) out.push(name || '(overlay WAAPI)');
          }
          return [...new Set(out)];
        }, THEME_ANIM.source);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        return r.length ? { status: 'fail', detail: `running under reduced motion: ${r.join(', ')}` } : { status: 'pass' };
      }, { ro });
      await C('A11Y-04', async () => {
        await page.emulateMedia({ forcedColors: 'active' }); await sleep(800);
        const st = await page.evaluate(() => window.__tlm.contrastStats([...document.querySelectorAll('.mx_RoomView_messagePanel .mx_EventTile_body')].filter(window.__tlm.visible).slice(-6)));
        const r = judge(st, 4.5, 'forced-colors body contrast');
        await page.screenshot({ path: rec.shotPath('A11Y-04', theme, ''), animations: 'disabled' }).catch(() => {});
        await page.emulateMedia({ forcedColors: 'none' });
        if (ro && r.status === 'fail') r.status = 'report';
        return r;
      });
    }

    // ---------------------------------------------------------------- dialog
    await closeAll();
    await C('DLG-01', async () => {
      await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_create_room' }));
      const d = page.locator('.mx_Dialog').first();
      await d.waitFor({ state: 'visible', timeout: 8000 }); await sleep(600);
      await settle();
      const st = await d.evaluate((el) => ({ inVp: window.__tlm.inViewport(el, 2), title: window.__tlm.contrastStats([el.querySelector('.mx_Dialog_title, h1, h2')].filter(Boolean)), body: window.__tlm.contrastStats([el]) }));
      await page.keyboard.press('Escape'); await sleep(600);
      const gone = !(await page.locator('.mx_Dialog').filter({ visible: true }).count());
      if (!gone) return { status: 'fail', detail: 'dialog did not close on Esc' };
      if (!st.inVp) return { status: 'fail', detail: 'dialog not inside viewport' };
      const r = judge(st.title.n ? st.title : st.body, 3, 'dialog title contrast'); if (ro && r.status === 'fail') r.status = 'report'; return r;
    }, { shotName: '', shootAlways: false });
    if (P1) {
      await C('DLG-02', async () => {
        await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_create_room' }));
        await page.locator('.mx_Dialog').first().waitFor({ state: 'visible' }); await sleep(400);
        const x = page.locator('.mx_Dialog .mx_Dialog_cancelButton').first();
        if (!(await x.isVisible())) return { status: 'fail', detail: 'no visible close button' };
        const c = await x.evaluate((el) => { const cs = getComputedStyle(el); return { h: window.__tlm.hittable(el), mask: cs.maskImage || cs.webkitMaskImage, bg: cs.backgroundColor }; });
        await x.click(); await sleep(500);
        const gone = !(await page.locator('.mx_Dialog').filter({ visible: true }).count());
        return gone && c.h.ok ? { status: 'pass' } : { status: 'fail', detail: `hittable ${c.h.why || 'ok'}, closed ${gone}` };
      }, { ro });
      await C('INP-01', async () => {
        await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_create_room' }));
        await page.locator('.mx_Dialog input').first().waitFor({ state: 'visible' });
        await page.locator('.mx_Dialog input').first().fill('Probe room name'); await settle();
        const st = await page.evaluate(() => { const i = document.querySelector('.mx_Dialog input'); const cs = getComputedStyle(i); const box = i.closest('.mx_Field') || i;
          const bcs = getComputedStyle(box); return { c: window.__tlm.contrastOf(i), border: bcs.borderTopWidth + ' ' + bcs.borderTopStyle, label: window.__tlm.contrastStats([...document.querySelectorAll('.mx_Dialog label')].slice(0, 3)) }; });
        await page.keyboard.press('Escape'); await sleep(400);
        const ok = st.c && (st.c.ratio >= 3 || st.c.image);
        return { status: ok ? 'pass' : 'fail', detail: `input text contrast ${st.c?.ratio}, border ${st.border}, label median ${st.label.median}` };
      }, { ro });
      await C('BTN-01', async () => {
        await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_create_room' }));
        await page.locator('.mx_Dialog').first().waitFor({ state: 'visible' }); await sleep(400);
        const st = await page.evaluate(() => { const b = document.querySelector('.mx_Dialog .mx_Dialog_primary, .mx_Dialog button[class*="_button_"][data-kind="primary"]'); return b ? window.__tlm.contrastOf(window.__tlm.textEls(b, 1)[0] || b) : null; });
        await page.keyboard.press('Escape'); await sleep(400);
        if (!st) return { status: 'fail', detail: 'no primary button' };
        return { status: st.ratio >= 3 || st.image ? 'pass' : 'fail', detail: `primary label contrast ${st.ratio} (${st.fg} on ${st.bg})` };
      }, { ro });
    }
    await closeAll();

    // ---------------------------------------------------------------- user menu → settings → Themes tab
    await C('MENU-01', async () => {
      await page.locator('.mx_UserMenu, [aria-label="User menu"]').filter({ visible: true }).first().click({ timeout: 6000 });
      await page.locator('[role="menu"], .mx_ContextualMenu').first().waitFor({ timeout: 5000 });
      await sleep(600);
      const item = page.locator('[role="menu"] [role="menuitem"], .mx_ContextualMenu [role="menuitem"]').filter({ hasText: /All settings/ }).first();
      if (!(await item.isVisible())) return { status: 'fail', detail: '"All settings" not visible' };
      const c = await item.evaluate((el) => window.__tlm.contrastStats([el]));
      await item.click();
      await page.locator('.mx_UserSettingsDialog').waitFor({ timeout: 8000 });
      return { status: 'pass', detail: `All settings contrast ${c.median}` };
    }, { ro: false });
    if (!(await page.locator('.mx_UserSettingsDialog').count())) {
      await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_user_settings', initialTabId: 'USER_APPEARANCE_TAB' }));
      await page.locator('.mx_UserSettingsDialog').waitFor({ timeout: 8000 }).catch(() => {});
    }
    await C('SET-01', async () => {
      await settle(); await sleep(300);
      const st = await page.evaluate(() => { const t = [...document.querySelectorAll('.mx_UserSettingsDialog .mx_TabbedView_tabLabel')].filter(window.__tlm.visible); return { n: t.length, c: window.__tlm.contrastStats(t) }; });
      if (st.n < 8) return { status: 'fail', detail: `${st.n} tab labels` };
      const r = judge(st.c, 3, `${st.n} tabs`); if (ro && r.status === 'fail') r.status = 'report'; return r;
    });
    await C('THM-04', async () => {
      const tab = page.locator('.mx_UserSettingsDialog .mx_TabbedView_tabLabel, .mx_UserSettingsDialog [role="tab"]').filter({ hasText: /^\s*Themes\s*$/ }).first();
      if (!(await tab.isVisible())) return { status: 'fail', detail: 'Themes tab label not visible' };
      await tab.click(); await sleep(1200);
      const st = await page.evaluate(() => {
        const p = document.querySelector('.tl-picker'); if (!p || !window.__tlm.visible(p)) return { picker: false };
        const def = document.querySelector('.tl-card-default'); def?.scrollIntoView({ block: 'center' });
        const names = [...document.querySelectorAll('.tl-card-name')].filter(window.__tlm.visible);
        return { picker: true, cards: document.querySelectorAll('.tl-card').length, def: def ? window.__tlm.hittable(def) : { ok: false, why: 'missing' },
          defC: def ? window.__tlm.contrastStats([def.querySelector('.tl-card-name')]) : null, names: window.__tlm.contrastStats(names.slice(0, 12)) };
      });
      if (!st.picker) return { status: 'fail', detail: '.tl-picker not visible' };
      if (st.cards < 70) return { status: 'fail', detail: `${st.cards} cards` };
      if (!st.def.ok) return { status: 'fail', detail: 'Element default card ' + st.def.why };
      const bad = st.defC.min < 3 || st.names.median < 3;
      return { status: bad ? 'fail' : 'pass', detail: `${st.cards} cards; default card contrast ${st.defC.min}; names median ${st.names.median} min ${st.names.min}` };
    }, { shootAlways: true });
    await closeAll();

    // ---------------------------------------------------------------- quick switcher (the way back)
    const ad0 = await getThemeAccountData(page).catch(() => 'n/a');
    await C('THM-02', async () => {
      await page.evaluate(() => document.activeElement?.blur?.());
      await page.keyboard.press('Alt+Shift+KeyT');
      const sw = page.locator('.tl-switcher').first();
      await sw.waitFor({ state: 'visible', timeout: 5000 }); await sleep(500);
      const st = await page.evaluate(() => {
        const dlg = document.querySelector('.tl-switcher').closest('.mx_Dialog') || document.querySelector('.tl-switcher');
        const items = [...document.querySelectorAll('.tl-quick-name')].filter(window.__tlm.visible);
        return { n: document.querySelectorAll('.tl-quick-item').length, inVp: window.__tlm.inViewport(dlg, 2), c: window.__tlm.contrastStats(items.slice(0, 10)),
          input: window.__tlm.contrastOf(document.querySelector('.tl-quick-input')) };
      });
      if (st.n < 70) return { status: 'fail', detail: `${st.n} items` };
      if (!st.inVp) return { status: 'fail', detail: 'switcher not inside viewport' };
      const bad = st.c.min < 3;
      return { status: bad ? 'fail' : 'pass', detail: `${st.n} items; name contrast median ${st.c.median} min ${st.c.min}` };
    }, { shootAlways: true });
    await C('THM-03', async () => {
      if (!(await page.locator('.tl-switcher').count())) { await page.keyboard.press('Alt+Shift+KeyT'); await page.locator('.tl-switcher').first().waitFor({ timeout: 5000 }); }
      const t0 = await page.evaluate(() => document.documentElement.dataset.tlTheme || null);
      await page.keyboard.press('ArrowDown'); await sleep(900);
      const t1 = await page.evaluate(() => document.documentElement.dataset.tlTheme || null);
      await page.keyboard.press('ArrowDown'); await sleep(900);
      const t2 = await page.evaluate(() => document.documentElement.dataset.tlTheme || null);
      await page.keyboard.press('Escape'); await sleep(1200);
      const t3 = await page.evaluate(() => document.documentElement.dataset.tlTheme || null);
      const open = await page.locator('.tl-switcher').count();
      const ad1 = await getThemeAccountData(page).catch(() => 'n/a');
      if (open) return { status: 'fail', detail: 'switcher still open after Esc' };
      if (t1 === t0 && t2 === t0) return { status: 'fail', detail: `↓ did not preview (stayed ${t0})` };
      if (t3 !== t0) return { status: 'fail', detail: `Esc left ${t3}, original ${t0}` };
      if (JSON.stringify(ad1) !== JSON.stringify(ad0)) return { status: 'fail', detail: 'account data changed by preview' };
      return { status: 'pass', detail: `${t0} → ${t1} → ${t2} → Esc → ${t3}` };
    });
    await closeAll();
  } finally {
    await s.close();
  }

  // ---------------------------------------------------------------- logged-out login page
  if (!a.noAuth) {
    const an = await openSession({ base, user: null, mobileModule: !!a.mobileModule });
    try {
      await runCase(rec, an, 'AUTH-01', theme, async () => {
        await an.page.goto(new URL(base).origin + '/' + (theme !== 'element-default' ? `?tl_theme=${theme}` : '') + '#/login', { waitUntil: 'domcontentloaded' });
        await an.page.locator('.mx_AuthPage, .mx_Login').first().waitFor({ timeout: 60000 }); await sleep(2500);
        await installProbe(an.page);
        const st = await an.page.evaluate(() => {
          const btns = [...document.querySelectorAll('.mx_AuthPage button, .mx_AuthPage [role=button], .mx_AuthPage input[type=submit]')].filter(window.__tlm.visible);
          const main = btns.find((b) => /Continue|Sign in/i.test(b.textContent || b.value || ''));
          const inputs = [...document.querySelectorAll('.mx_AuthPage input:not([type=hidden])')].filter(window.__tlm.visible);
          return { theme: document.documentElement.dataset.tlTheme || null, main: main ? { h: window.__tlm.hittable(main), inVp: window.__tlm.inViewport(main), c: window.__tlm.contrastOf(window.__tlm.textEls(main, 1)[0] || main) } : null,
            inputs: inputs.length, text: window.__tlm.contrastStats([document.querySelector('.mx_AuthPage')]) };
        });
        if (theme !== 'element-default' && st.theme !== theme) return { status: 'fail', detail: `login page theme ${st.theme}` };
        if (!st.main) return { status: 'fail', detail: 'no Continue/Sign in button visible' };
        if (!st.main.h.ok || !st.main.inVp) return { status: 'fail', detail: `sign-in button ${st.main.h.why || 'outside viewport'}` };
        const ok = st.main.c.ratio >= 3 || st.main.c.image;
        return { status: ok ? 'pass' : (ro ? 'report' : 'fail'), detail: `button label contrast ${st.main.c.ratio}; page text median ${st.text.median}` };
      }, { shootAlways: true });
    } finally { await an.close(); }
  }
}

// ---------------------------------------------------------------- extra messaging cases (Sandbox only)
async function sendExtra(theme) {
  const s = await openSession({ base });
  const page = s.page;
  const C = (id, fn, o = {}) => runCase(rec, s, id, theme, fn, o);
  const tag = `${theme} ${Date.now().toString(36)}`;
  const tileOf = (txt) => page.locator('.mx_RoomView_messagePanel .mx_EventTile').filter({ hasText: txt }).last();
  const composer = () => page.locator('.mx_RoomView_body .mx_BasicMessageComposer_input').first();
  const send = async (txt) => { await composer().click(); await page.keyboard.type(txt, { delay: 5 }); await page.keyboard.press('Enter'); await tileOf(txt.replace(/[*_`]/g, '')).waitFor({ timeout: 15000 }).catch(() => {}); await sleep(800); };
  try {
    await loadApp(s, base, theme, { hash: `/room/${R.sandbox}` });
    await installProbe(page);
    await gotoRoom(page, R.sandbox);
    await C('MSG-02', async () => {
      await composer().click(); await page.keyboard.type(`md **bold** _it_ \`code\` ${tag}`, { delay: 5 }); await page.keyboard.press('Enter');
      const t = tileOf(`md bold`); await t.waitFor({ timeout: 15000 }); await sleep(800);
      const st = await t.evaluate((el) => ({ b: !!el.querySelector('.mx_EventTile_body strong'), i: !!el.querySelector('.mx_EventTile_body em'), c: !!el.querySelector('.mx_EventTile_body code') }));
      return st.b && st.i && st.c ? { status: 'pass' } : { status: 'fail', detail: JSON.stringify(st) };
    });
    const base1 = `reply-target ${tag}`;
    await send(base1);
    await C('MSG-03', async () => {
      const t = tileOf(base1); await t.hover(); await sleep(300);
      await t.locator('.mx_MessageActionBar [aria-label="Reply"]').click();
      await page.locator('.mx_ReplyPreview').waitFor({ timeout: 5000 });
      const txt = `the reply ${tag}`; await composer().click(); await page.keyboard.type(txt); await page.keyboard.press('Enter');
      const r = tileOf(txt); await r.waitFor({ timeout: 15000 }); await sleep(800);
      return (await r.locator('.mx_ReplyChain, .mx_ReplyTile').count()) ? { status: 'pass' } : { status: 'fail', detail: 'no reply chain on the reply' };
    });
    await C('MSG-04', async () => {
      const txt = `to-edit ${tag}`; await send(txt);
      await composer().click(); await page.keyboard.press('ArrowUp'); await sleep(600);
      const ed = page.locator('.mx_EditMessageComposer .mx_BasicMessageComposer_input').first();
      await ed.waitFor({ timeout: 5000 });
      await page.keyboard.press('End'); await page.keyboard.type(' EDITED'); await page.keyboard.press('Enter');
      const t = tileOf(`to-edit ${tag} EDITED`);
      const ok = await page.locator('.mx_RoomView_messagePanel .mx_EventTile').filter({ hasText: `to-edit ${tag} EDITED` }).filter({ hasText: '(edited)' }).first().waitFor({ timeout: 15000 }).then(() => true, () => false);
      return ok ? { status: 'pass' } : { status: 'fail', detail: 'edit not shown with (edited) within 15 s' };
    });
    await C('MSG-06', async () => {
      const t = tileOf(base1); await t.hover(); await sleep(300);
      await t.locator('.mx_MessageActionBar [aria-label="React"]').click();
      await page.locator('.mx_ContextualMenu input').first().waitFor({ timeout: 5000 });
      await page.keyboard.type('thumbs up'); await sleep(600);
      await page.keyboard.press('Enter');
      await sleep(2000);
      const r = t.locator('[class*="_reactionsRowButton_"]');
      return (await r.count()) ? { status: 'pass', detail: await r.first().innerText() } : { status: 'fail', detail: 'no reaction pill' };
    });
    await C('MSG-07', async () => {
      const t = tileOf(base1); await t.hover(); await sleep(300);
      await t.locator('.mx_MessageActionBar [aria-label="Reply in thread"]').click();
      const tc = page.locator('.mx_ThreadView .mx_BasicMessageComposer_input').first(); await tc.waitFor({ timeout: 8000 });
      await tc.click(); const txt = `thread reply ${tag}`; await page.keyboard.type(txt); await page.keyboard.press('Enter');
      await page.locator('.mx_ThreadView .mx_EventTile').filter({ hasText: txt }).waitFor({ timeout: 15000 });
      await page.evaluate(() => window.mxSdkContext?.rightPanelStore?.hide?.(null)); await sleep(1500);
      return (await tileOf(base1).locator('.mx_ThreadSummary, [class*="ThreadSummary"]').count()) ? { status: 'pass' } : { status: 'fail', detail: 'no thread summary on root' };
    });
    await C('MSG-05', async () => {
      const txt = `to-delete ${tag}`; await send(txt);
      const t = tileOf(txt); await t.hover(); await sleep(300);
      await t.locator('.mx_MessageActionBar [aria-label="Options"]').click();
      await page.locator('[role=menu] [role=menuitem]').filter({ hasText: /^Remove$/ }).click();
      await page.locator('.mx_Dialog').getByRole('button', { name: /^Remove$/ }).click();
      await sleep(2500);
      return (await tileOf(txt).count()) ? { status: 'fail', detail: 'tile still shows text' } : { status: 'pass' };
    });
    for (const [id, file] of [['MSG-09', 'tests/fixtures/assets/release-notes.pdf'], ['MSG-10', 'tests/fixtures/assets/palette.png']]) {
      await C(id, async () => {
        const fs = await import('node:fs');
        let f = path.join(ROOT, file);
        if (!fs.existsSync(f)) { const cand = fs.readdirSync(path.join(ROOT, 'tests/fixtures/assets')).find((x) => (id === 'MSG-09' ? /\.pdf$/ : /\.png$/).test(x)); f = cand && path.join(ROOT, 'tests/fixtures/assets', cand); }
        if (!f) return { status: 'skip', detail: 'no asset' };
        const bodySel = id === 'MSG-09' ? '.mx_MFileBody, [class*="MFileBody"]' : '.mx_MImageBody, [class*="MImageBody"]';
        const before = await page.locator('.mx_RoomView_messagePanel').locator(bodySel).count();
        await page.locator('.mx_RoomView_body input[type=file]').first().setInputFiles({ name: path.basename(f), mimeType: f.endsWith('.pdf') ? 'application/pdf' : 'image/png', buffer: fs.readFileSync(f) });  // buffer: the Chrome flatpak can't read paths outside .state/
        const up = page.locator('.mx_Dialog').getByRole('button', { name: /^Upload$/ });
        await up.waitFor({ timeout: 8000 }); await up.click();
        const sel = id === 'MSG-09' ? '.mx_MFileBody' : '.mx_MImageBody';
        const failed = page.locator('.mx_Dialog').filter({ hasText: /Upload Failed/ });
        const res = await Promise.race([failed.waitFor({ timeout: 30000 }).then(() => 'failed', () => null), page.waitForFunction(([sel, n]) => document.querySelector('.mx_RoomView_messagePanel').querySelectorAll(sel).length > n, [bodySel, before], { timeout: 30000 }).then(() => 'ok', () => 'timeout')]);
        if (res === 'failed') { await page.screenshot({ path: rec.shotPath(id, theme, 'failed') }).catch(() => {}); await page.keyboard.press('Escape'); return { status: 'fail', detail: '"Upload Failed" dialog; console: ' + (s.errors.filter((e) => /upload|media|4\d\d|5\d\d/i.test(e)).slice(-2).join(' / ') || 'no error logged') }; }
        if (res !== 'ok') return { status: 'fail', detail: 'no file/image tile after 30 s' };
        if (false) await page.waitForFunction(([sel, n]) => document.querySelectorAll('.mx_RoomView_messagePanel .mx_EventTile').length > n && [...document.querySelectorAll('.mx_RoomView_messagePanel ' + sel)].length, [sel, before], { timeout: 30000 });
        return { status: 'pass', detail: path.basename(f) };
      }, { shootAlways: true });
    }
  } finally { await s.close(); }
}

// ---------------------------------------------------------------- production module coexistence (guide NOT hidden)
async function prodModules(theme) {
  const ro = reportOnly(themeMeta(theme));
  const s = await openSession({ base, hideGuide: false, mobileModule: !!a.mobileModule });
  const page = s.page;
  const C = (id, fn, o = {}) => runCase(rec, s, id, theme, fn, o);
  try {
    await loadApp(s, base, theme, { hash: `/room/${R.showcase}` });
    await installProbe(page); await sleep(2500);
    await C('MOD-01', async () => {
      const cfg = await page.evaluate(async () => (await (await fetch('/config.json', { cache: 'no-store' })).json()).modules || []);
      const pe = s.errors.filter((e) => e.startsWith('pageerror'));
      const modErr = s.errors.filter((e) => /\[(theme-loader|mobile-themes|remote-modules|speed-start|marcade|keyboard-shortcuts|space-room-map|people-map|multi-tab|room-checker|teamwork|activity|tag-mentions|profile-status|files-hub|teams-welcome|user-account-widgets)\]/i.test(e));
      if (pe.length || modErr.length) return { status: 'fail', detail: `${cfg.length} modules; ${[...pe, ...modErr][0]}` };
      return { status: 'pass', detail: `${cfg.length} modules in config, no module errors` };
    });
    await C('MOD-02', async () => {
      const st = await page.evaluate(() => {
        const g = [...document.querySelectorAll('.twl-guide-panel, #teams-welcome-root .twl-card, #teams-welcome-root [role=dialog], #teams-welcome-root')].find(window.__tlm.visible);
        if (!g) return null;
        const close = [...g.querySelectorAll('button, [role=button]')].find((b) => /close|dismiss|schließen|×/i.test((b.getAttribute('aria-label') || '') + b.textContent));
        return { c: window.__tlm.contrastStats([g]), close: close ? window.__tlm.hittable(close) : { ok: false, why: 'no close button' }, w: g.getBoundingClientRect().width | 0 };
      });
      if (!st) return { status: 'pass', detail: 'guide not shown for this session' };
      if (!st.close.ok) return { status: 'fail', detail: 'guide close ' + st.close.why };
      const ok = st.c.median >= 3 || st.c.image;
      return { status: ok ? 'pass' : (ro ? 'report' : 'fail'), detail: `guide ${st.w}px, text median ${st.c.median}, close hittable` };
    }, { shootAlways: true });
    await C('HDR-06', async () => {
      const r = await page.evaluate(() => [...document.querySelectorAll('.mx_RoomHeader button, .mx_RoomHeader [role=button]')]
        .filter((b) => b.getBoundingClientRect().width > 4 && !b.classList.contains('mx_RoomHeader_infoWrapper'))
        .map((b) => ({ l: b.getAttribute('aria-label') || b.className.toString().slice(0, 30), h: window.__tlm.hittable(b) })));
      const bad = r.filter((x) => !x.h.ok);
      return bad.length ? { status: 'fail', detail: `${bad.length}/${r.length}: ` + bad.map((x) => `${x.l}: ${x.h.why}`).join('; ') } : { status: 'pass', detail: `${r.length} header buttons hittable (guide docked)` };
    }, { ro, shootAlways: true });
    await C('MOD-05', async () => {
      await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_user_settings', initialTabId: 'USER_APPEARANCE_TAB' }));
      await page.locator('.mx_UserSettingsDialog').waitFor({ timeout: 8000 });
      const tabs = page.locator('.mx_UserSettingsDialog .mx_TabbedView_tabLabel');
      const names = (await tabs.allInnerTexts()).map((t) => t.trim());
      const themes = tabs.filter({ hasText: /^\s*Themes\s*$/ }); const mods = tabs.filter({ hasText: /^\s*Modules\s*$/ });
      if ((await themes.count()) !== 1 || (await mods.count()) !== 1) return { status: 'fail', detail: `tabs: ${names.join(', ')}` };
      await mods.click(); await sleep(1000);
      const modTxt = (await page.locator('.mx_UserSettingsDialog .mx_TabbedView_tabPanel').filter({ visible: true }).allInnerTexts()).join('\n');
      await themes.click(); await sleep(1000);
      const picker = await page.locator('.tl-picker').isVisible();
      await mods.click(); await sleep(600); await themes.click(); await sleep(800);
      const picker2 = await page.locator('.tl-picker').isVisible();
      await page.keyboard.press('Escape');
      const loaded = /theme-loader/i.test(modTxt);
      return picker && picker2 && loaded ? { status: 'pass', detail: 'Themes + Modules tabs, theme-loader listed' } : { status: 'fail', detail: `picker ${picker}/${picker2}, theme-loader in Modules ${loaded}` };
    });
  } finally { await s.close(); }
}

// ---------------------------------------------------------------- run with N workers
const queue = [...themes];
const t0 = Date.now();
async function worker(n) {
  while (queue.length) {
    const t = queue.shift();
    log(`[w${n}] ${t} (${themes.length - queue.length}/${themes.length})`);
    if (!a.modulesOnly) try { await testTheme(t); } catch (e) { rec.add('SHELL-01', t, 'fail', 'harness: ' + String(e.message).split('\n')[0]); }
    if (a.modules) { try { await prodModules(t); } catch (e) { log('prodModules failed', t, e.message); } }
    if (a.sendExtra) { try { await sendExtra(t); } catch (e) { log('sendExtra failed', t, e.message); } }
    rec.write(run + '.json');
  }
}
await Promise.all(Array.from({ length: Math.min(+a.parallel, themes.length) }, (_, i) => worker(i + 1)));
const out = rec.write(run + '.json');
const c = rec.results.reduce((m, r) => (m[r.status] = (m[r.status] || 0) + 1, m), {});
log(`done in ${Math.round((Date.now() - t0) / 60000)} min → ${path.relative(ROOT, out)}`, JSON.stringify(c));
