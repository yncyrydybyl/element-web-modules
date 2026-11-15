#!/usr/bin/env node
// Viewport matrix + device emulation (docs/TESTCASES.md VP-*, MOB-*, MOD-06/07, A11Y-03).
//   node tests/harness/viewports.mjs --mode matrix  --themes sample|<ids> [--mobile-module] [--base-url URL] [--run NAME] [--parallel N]
//   node tests/harness/viewports.mjs --mode login   --themes sample|<ids> [--mobile-module] ...
//   node tests/harness/viewports.mjs --mode devices --themes sample|<ids> [--mobile-module] [--devices iphone15,pixel8,…] ...
// matrix : one logged-in session per theme, live-resized through widths × heights (tests/catalogue.json):
//          VP-01/02/03/04/05/09/10 at every size, VP-06/07 at heights 568 + 900, VP-12 at heights ≤ 568, VP-16 at the end.
// login  : logged-out, VP-15 at every width × (568, 900).
// devices: fresh context per device (DPR, touch, mobile UA): MOB-01..10, MOD-06/07, VP-13/14, A11Y-03.
// Output: tests/reports/matrix/<run>.json, screenshots recordings/tests/<case>/<run>/<theme>--<WxH>.png
// Writes nothing to the account; mx_local_settings (Element's RoomList collapse at narrow widths) restored on close.
import path from 'node:path';
import { ROOT, parseArgs, resolveBase, fixtures, selectSpace, gotoRoom, sleep, log, waitForApp } from './lib.mjs';
import { openSession, loadApp, Recorder, runCase, installProbe, CATALOGUE, themeMeta, reportOnly } from './matrixlib.mjs';

const a = parseArgs(process.argv.slice(2), { mode: 'matrix', themes: 'sample', parallel: 3 });
const base = await resolveBase(a.baseUrl);
const R = fixtures().rooms;
const themes = a.themes === 'sample' ? CATALOGUE.sample : String(a.themes).split(',');
const mm = !!a.mobileModule;
const host = new URL(base).hostname.split('.')[0];
const run = a.run || `vp-${a.mode}-${host}${mm ? '-mm' : ''}`;
const rec = new Recorder({ run, base, extra: { mode: a.mode, mobileModule: mm, themes: themes.length } });
const W = a.widths ? String(a.widths).split(',').map(Number) : CATALOGUE.widths;
const H = a.heights ? String(a.heights).split(',').map(Number) : CATALOGUE.heights;

// ------------------------------------------------------------------ in-page metrics for one size
async function metrics(page) {
  return page.evaluate(() => {
    const T = window.__tlm, vw = innerWidth, vh = innerHeight;
    const q = (s) => [...document.querySelectorAll(s)];
    const comp = q('.mx_RoomView_body .mx_BasicMessageComposer_input').find(T.visible);
    const compBox = comp;
    const cr = compBox?.getBoundingClientRect();
    const cbtns = comp ? [...(comp.closest('.mx_MessageComposer') || document).querySelectorAll('button, [role=button]')].filter((b) => b.getBoundingClientRect().width > 4 && getComputedStyle(b).visibility !== 'hidden') : [];
    const btnOff = cbtns.filter((b) => { const r = b.getBoundingClientRect(); return r.right > vw + 1 || r.bottom > vh + 1 || r.left < -1; }).map((b) => b.getAttribute('aria-label') || 'button');
    const panel = document.querySelector('.mx_RoomView_messagePanel'); const pr = panel?.getBoundingClientRect();
    const bodies = pr ? q('.mx_RoomView_messagePanel .mx_EventTile_body').filter((b) => { const r = b.getBoundingClientRect(); return T.visible(b) && r.bottom > Math.max(0, pr.top) && r.top < Math.min(vh, pr.bottom) && r.right > 0 && r.left < vw && r.width >= 40; }) : [];
    const items = q('.mx_RoomListItemView').filter((e) => T.visible(e) && e.getBoundingClientRect().width >= 120 && T.inViewport(e, 2));
    const back = q('.mt-back').find(T.visible);
    const head = document.querySelector('.mx_RoomHeader_heading'); const hr = head?.getBoundingClientRect();
    const overflow = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth;
    const covered = [];
    for (const [k, el] of [['composer', comp], ['heading', head], ['tl-button', q('.tl-header-button').find(T.visible)]]) {
      if (!el) continue; const h = T.hittable(el); if (!h.ok && h.why !== 'offscreen') covered.push(`${k}: ${h.why}`);
    }
    return {
      composer: comp ? { inVp: T.inViewport(compBox, 1), btnOff, l: Math.round(cr.left), r: Math.round(cr.right), h: Math.round(cr.height), top: Math.round(cr.top), bottom: Math.round(cr.bottom), hit: T.hittable(comp) } : null,
      bodies: bodies.length, items: items.length, back: !!back, backHit: back ? T.hittable(back).ok : false,
      heading: head ? Math.round(Math.max(0, Math.min(hr.right, vw) - Math.max(hr.left, 0))) : 0,
      overflow, covered, mt: document.documentElement.getAttribute('data-mt-mobile'), view: document.documentElement.getAttribute('data-mt-view'),
    };
  });
}

async function ensureRoom(page, rid) {
  const ok = await page.evaluate((rid) => location.hash.includes(rid) && !!document.querySelector('.mx_RoomView'), rid);
  if (!ok) await gotoRoom(page, rid);
}
const scrollBottom = (page) => page.evaluate(() => { const p = document.querySelector('.mx_RoomView_messagePanel'); if (p) p.scrollTop = p.scrollHeight; });
async function closeAll(page) { for (let i = 0; i < 4; i++) { if (!(await page.locator('.mx_Dialog').count())) break; await page.keyboard.press('Escape'); await sleep(300); } }

// ------------------------------------------------------------------ matrix mode
async function matrixTheme(theme) {
  const ro = reportOnly(themeMeta(theme));
  const s = await openSession({ base, mobileModule: mm });
  const page = s.page;
  try {
    await loadApp(s, base, theme, { hash: `/room/${R.showcase}` });
    await installProbe(page);
    await selectSpace(page, R.space);
    await ensureRoom(page, R.showcase);
    // Element collapses the room list below ~768px and keeps it collapsed (device setting) when the window grows again,
    // so each height row starts from the slot's original settings (restore + reload) and goes wide → narrow.
    const Wd = [...W].sort((x, y) => y - x);
    for (const h of H) for (const w of Wd) {
      const vp = `${w}x${h}`;
      if (w === Wd[0]) {
        await page.setViewportSize({ width: w, height: h });
        await s.restoreLocal();
        await page.reload({ waitUntil: 'domcontentloaded' });
        await waitForApp(page, { timeout: 120000 });
        await installProbe(page); await selectSpace(page, R.space); await ensureRoom(page, R.showcase);
      }
      await page.setViewportSize({ width: w, height: h });
      await sleep(700);
      await ensureRoom(page, R.showcase);
      await scrollBottom(page); await sleep(250);
      const m = await metrics(page);
      const shot = rec.shotPath('VP-01', theme, vp);
      await page.screenshot({ path: shot, animations: 'disabled', caret: 'hide' }).catch(() => {});
      const add = (id, ok, detail, opt = {}) => rec.add(id, theme, ok ? 'pass' : (opt.ro ? 'report' : 'fail'), detail, { viewport: vp, shot: ok ? null : shot });
      const c = m.composer;
      add('VP-01', c && c.inVp && c.h >= 14 && c.hit.ok, c ? `composer input x ${c.l}-${c.r} y ${c.top}-${c.bottom} h${c.h}${c.hit.ok ? '' : ' ' + c.hit.why}` : 'no visible composer');
      add('VP-02', m.bodies >= 1, `${m.bodies} message bodies visible`, { ro });
      add('VP-03', m.items >= 3 || (m.back && m.backHit), `room list items ${m.items}, back control ${m.back}${m.mt ? `, mt=${m.mt} view=${m.view}` : ''}`);
      add('VP-04', m.overflow <= 1, `horizontal overflow ${m.overflow}px`);
      add('VP-05', m.heading >= 40, `room name ${m.heading}px wide`);
      const cut = [...m.covered, ...(c?.btnOff?.length ? [`composer buttons cut off at the edge: ${c.btnOff.join(',')}`] : [])];
      add('VP-10', !cut.length, cut.join('; ') || 'composer/heading/theme button not covered or cut', { ro });
      if (h <= 568) add('VP-12', c && c.inVp && m.bodies >= 1, `short height: composer ${c ? c.inVp : 'none'}, ${m.bodies} bodies`);
      // VP-09 theme switcher fits
      await runCase(rec, s, 'VP-09', theme, async () => {
        await page.evaluate(() => document.activeElement?.blur?.());
        await page.keyboard.press('Alt+Shift+KeyT');
        await page.locator('.tl-switcher').first().waitFor({ state: 'visible', timeout: 4000 });
        await sleep(300);
        const st = await page.evaluate(() => { const sw = document.querySelector('.tl-switcher'); const d = sw.closest('.mx_Dialog') || sw; const lr = document.querySelector('.tl-quick-list')?.getBoundingClientRect(); const it = [...document.querySelectorAll('.tl-quick-item')].find((e) => { const r = e.getBoundingClientRect(); const cy = r.top + r.height / 2; return window.__tlm.visible(e) && lr && cy > lr.top && cy < lr.bottom; });
          return { inVp: window.__tlm.inViewport(d, 2), item: it ? window.__tlm.hittable(it) : { ok: false, why: 'no visible item' }, dw: Math.round(d.getBoundingClientRect().width) }; });
        if (!(st.inVp && st.item.ok)) await page.screenshot({ path: rec.shotPath('VP-09', theme, vp + '-open') }).catch(() => {});
        await page.keyboard.press('Escape'); await sleep(300);
        return st.inVp && st.item.ok ? { status: 'pass', detail: `dialog ${st.dw}px` } : { status: 'fail', detail: `inViewport ${st.inVp}, item ${st.item.why || 'ok'}, width ${st.dw}` };
      }, { viewport: vp, shotName: vp });
      await closeAll(page);
      if (h === 568 || h === 900) {
        await runCase(rec, s, 'VP-06', theme, async () => {
          await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_create_room' }));
          const d = page.locator('.mx_Dialog').first(); await d.waitFor({ state: 'visible', timeout: 6000 }); await sleep(500);
          const st = await d.evaluate((el) => { const r = el.getBoundingClientRect(); const x = el.querySelector('.mx_Dialog_cancelButton'); const p = el.querySelector('.mx_Dialog_primary, button[data-kind="primary"]');
            const scrolls = el.scrollHeight > el.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(el).overflowY);
            return { r: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], inVp: window.__tlm.inViewport(el, 2), scrolls,
              close: x ? window.__tlm.hittable(x).ok : false, primaryVisible: p ? window.__tlm.inViewport(p, 2) : false }; });
          const ok = (st.inVp || st.scrolls) && st.close;
          if (!ok) await page.screenshot({ path: rec.shotPath('VP-06', theme, vp + '-open') }).catch(() => {});
          await page.keyboard.press('Escape'); await sleep(300);
          return { status: ok ? 'pass' : 'fail', detail: `dialog ${st.r.join(',')} inVp ${st.inVp} scrolls ${st.scrolls} close ${st.close} primary ${st.primaryVisible}` };
        }, { viewport: vp, shotName: vp });
        await closeAll(page);
        await runCase(rec, s, 'VP-07', theme, async () => {
          await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_user_settings', initialTabId: 'USER_APPEARANCE_TAB' }));
          const d = page.locator('.mx_UserSettingsDialog').first(); await d.waitFor({ state: 'visible', timeout: 6000 }); await sleep(600);
          const st = await page.evaluate(() => { const d = document.querySelector('.mx_UserSettingsDialog').closest('.mx_Dialog') || document.querySelector('.mx_UserSettingsDialog');
            const panel = document.querySelector('.mx_UserSettingsDialog .mx_TabbedView_tabPanel'); const pr = panel?.getBoundingClientRect();
            return { inVp: window.__tlm.inViewport(d, 2), r: d.getBoundingClientRect().right | 0, panelW: pr ? Math.round(Math.min(pr.right, innerWidth) - Math.max(pr.left, 0)) : 0 }; });
          const ok = st.inVp && st.panelW >= 200;
          if (!ok) await page.screenshot({ path: rec.shotPath('VP-07', theme, vp + '-open') }).catch(() => {});
          await page.keyboard.press('Escape'); await sleep(300);
          return { status: ok ? 'pass' : 'fail', detail: `settings inViewport ${st.inVp} (right ${st.r}), visible tab panel ${st.panelW}px` };
        }, { viewport: vp, shotName: vp });
        await closeAll(page);
      }
    }
    // VP-16: back to desktop size, the layout must recover
    await page.setViewportSize({ width: 1440, height: 900 }); await sleep(1200);
    await runCase(rec, s, 'VP-16', theme, async () => {
      await ensureRoom(page, R.showcase);
      const m = await metrics(page);
      return m.items >= 3 && m.composer?.inVp ? { status: 'pass' } : { status: 'fail', detail: `after resize back to 1440x900: room list items ${m.items}, composer ${!!m.composer?.inVp}` };
    }, { viewport: '1440x900', shotName: 'after' });
  } finally { await s.close(); }
}

// ------------------------------------------------------------------ login mode
async function loginTheme(theme) {
  const s = await openSession({ base, user: null, mobileModule: mm, device: { width: 1440, height: 900 } });
  const page = s.page;
  try {
    await page.goto(new URL(base).origin + '/' + (theme !== 'element-default' ? `?tl_theme=${theme}` : '') + '#/login', { waitUntil: 'domcontentloaded' });
    await page.locator('.mx_AuthPage, .mx_Login').first().waitFor({ timeout: 60000 }); await sleep(2000);
    await installProbe(page);
    for (const h of [568, 900]) for (const w of W) {
      const vp = `${w}x${h}`;
      await page.setViewportSize({ width: w, height: h }); await sleep(500);
      await runCase(rec, s, 'VP-15', theme, async () => {
        const st = await page.evaluate(() => {
          const b = [...document.querySelectorAll('.mx_AuthPage button, .mx_AuthPage [role=button]')].filter(window.__tlm.visible).find((x) => /Continue|Sign in/i.test(x.textContent));
          const box = document.querySelector('.mx_AuthBody, .mx_AuthPage_modalContent, .mx_AuthPage_modal');
          const over = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth;
          return { btn: b ? { inVp: window.__tlm.inViewport(b, 1), hit: window.__tlm.hittable(b) } : null, box: box ? box.getBoundingClientRect().width | 0 : 0, over };
        });
        if (!st.btn) return { status: 'fail', detail: 'no Continue/Sign in button' };
        if (!st.btn.inVp || !st.btn.hit.ok) {
          // reachable by scrolling the auth page?
          const reach = await page.evaluate(() => { const b = [...document.querySelectorAll('.mx_AuthPage button')].find((x) => /Continue|Sign in/i.test(x.textContent)); b.scrollIntoView({ block: 'center' }); return window.__tlm.inViewport(b, 1) && window.__tlm.hittable(b).ok; });
          if (reach) return { status: 'pass', detail: `button reachable after scrolling; overflow ${st.over}px` };
          return { status: 'fail', detail: `button inViewport ${st.btn.inVp} ${st.btn.hit.why || ''}; box ${st.box}px; overflow ${st.over}px` };
        }
        return st.over > 1 ? { status: 'fail', detail: `horizontal overflow ${st.over}px (box ${st.box}px)` } : { status: 'pass', detail: `box ${st.box}px` };
      }, { viewport: vp, shotName: vp, shootAlways: w <= 414 || w >= 2560 });
    }
  } finally { await s.close(); }
}

// ------------------------------------------------------------------ devices mode
const DEVICES = {
  'se': { width: 320, height: 568, dpr: 2, touch: true, mobileUA: 'ios' },
  'small-android': { width: 360, height: 800, dpr: 3, touch: true, mobileUA: 'android' },
  'iphone15': { width: 390, height: 844, dpr: 3, touch: true, mobileUA: 'ios' },
  'plus': { width: 414, height: 896, dpr: 3, touch: true, mobileUA: 'ios' },
  'iphone15-land': { width: 844, height: 390, dpr: 3, touch: true, mobileUA: 'ios' },
  'tablet-port': { width: 820, height: 1180, dpr: 2, touch: true },
  'tablet-land': { width: 1180, height: 820, dpr: 2, touch: true },
  'desktop-hidpi': { width: 1440, height: 900, dpr: 2 },
  'zoom200': { width: 720, height: 450, dpr: 2 },
};
const devList = a.devices ? String(a.devices).split(',') : Object.keys(DEVICES);

async function deviceTheme(theme, devName) {
  const d = DEVICES[devName];
  const vp = `${d.width}x${d.height}@${d.dpr}${d.touch ? 't' : ''} ${devName}`;
  const ro = reportOnly(themeMeta(theme));
  const phone = d.width <= 768 || (d.touch && d.mobileUA);
  const s = await openSession({ base, mobileModule: mm, device: d });
  const page = s.page;
  const C = (id, fn, o = {}) => runCase(rec, s, id, theme, fn, { viewport: vp, shotName: devName, ...o });
  const tap = async (loc) => (d.touch ? loc.tap({ timeout: 6000 }) : loc.click({ timeout: 6000 }));
  try {
    await loadApp(s, base, theme, { hash: '/home' });
    await installProbe(page);
    await page.evaluate(() => { try { window.mxSdkContext?.rightPanelStore?.hide?.(null); } catch { /* */ } window.mxDispatcher.dispatch({ action: 'view_home_page' }); });
    await selectSpace(page, R.space); await sleep(1200);
    // phone with mobile-themes: the room is a separate pane; get there the way a user does (list → tap room)
    const toRoom = async () => {
      const v = await page.evaluate(() => document.documentElement.getAttribute('data-mt-view'));
      const inRoom = await page.evaluate((rid) => location.hash.includes(rid), R.sandbox);
      if (!v) { await ensureRoom(page, R.sandbox); return; }
      if (v === 'room' && inRoom) return;
      await page.evaluate(() => { try { window.mxSdkContext?.rightPanelStore?.hide?.(null); } catch { /* */ } window.mxDispatcher.dispatch({ action: 'view_home_page' }); });
      await sleep(900);
      const it = page.locator('.mx_RoomListItemView').filter({ hasText: 'Sandbox' }).filter({ visible: true }).first();
      if (await it.count()) await tap(it); else await ensureRoom(page, R.sandbox);
      await page.waitForFunction((rid) => location.hash.includes(rid), R.sandbox, { timeout: 10000 }).catch(() => {});
      await sleep(1000);
    };
    const attrs = await page.evaluate(() => ({ mobile: document.documentElement.getAttribute('data-mt-mobile'), pointer: document.documentElement.getAttribute('data-mt-pointer'),
      orient: document.documentElement.getAttribute('data-mt-orientation'), compact: document.documentElement.hasAttribute('data-mt-compact'), tl: document.documentElement.dataset.tlTheme || null,
      styles: document.querySelectorAll('#mt-mobile-style').length }));
    const mtErr = s.errors.filter((e) => /\[mobile-themes\]/.test(e));
    if (mm) {
      if (phone) await C('MOB-01', async () => (attrs.mobile && attrs.pointer && attrs.orient ? { status: 'pass', detail: JSON.stringify(attrs) } : { status: 'fail', detail: JSON.stringify(attrs) }));
      await C('MOD-06', async () => {
        const tlOk = theme === 'element-default' ? !attrs.tl : attrs.tl === theme;
        if (!tlOk) return { status: 'fail', detail: `data-tl-theme ${attrs.tl}` };
        if (attrs.styles !== 1) return { status: 'fail', detail: `${attrs.styles} #mt-mobile-style elements` };
        if (mtErr.length) return { status: 'fail', detail: mtErr[0] };
        return { status: 'pass', detail: `tl=${attrs.tl} mt=${attrs.mobile}` };
      });
      if (devName === 'desktop-hidpi') await C('MOD-07', async () => (attrs.mobile ? { status: 'fail', detail: `data-mt-mobile="${attrs.mobile}" on desktop` } : { status: 'pass' }));
    }
    // ---- MOB-02 single-pane: list → room → back (meaningful on phones; recorded with/without module)
    if (phone) {
      await C('MOB-02', async () => {
        const item = page.locator('.mx_RoomListItemView').filter({ hasText: 'Sandbox' }).filter({ visible: true }).first();
        if (!(await item.count())) {
          return { status: 'fail', detail: `room list not visible on the home view (mt=${attrs.mobile}, view=${await page.evaluate(() => document.documentElement.getAttribute('data-mt-view'))})` };
        }
        await tap(item);
        await page.waitForFunction((rid) => location.hash.includes(rid), R.sandbox, { timeout: 10000 });
        await sleep(1200);
        await installProbe(page);
        const m = await metrics(page);
        if (!m.composer?.inVp) return { status: 'fail', detail: 'room opened but composer not in viewport' };
        const listStillShown = m.items >= 3;
        const roomW = await page.evaluate(() => Math.round(document.querySelector('.mx_RoomView')?.getBoundingClientRect().width || 0));
        if (roomW < d.width * 0.9) return { status: 'fail', detail: `room view only ${roomW}px of ${d.width}px (list still shown: ${listStillShown})` };
        const back = page.locator('.mt-back').filter({ visible: true }).first();
        if (!(await back.count())) return { status: 'fail', detail: 'no visible back control in the room' };
        await tap(back); await sleep(1200);
        const after = await page.evaluate(() => [...document.querySelectorAll('.mx_RoomListItemView')].filter((e) => window.__tlm.visible(e) && window.__tlm.inViewport(e, 2)).length);
        return after >= 3 ? { status: 'pass', detail: `room ${roomW}px, back → ${after} rooms` } : { status: 'fail', detail: `after back only ${after} rooms visible` };
      }, { shootAlways: true });
    }
    // ---- room-level checks
    await toRoom(); await sleep(500); await installProbe(page);
    if (phone) {
      await C('MOB-08', async () => {
        const st = await page.evaluate(() => {
          const els = [...document.querySelectorAll('.mx_RoomHeader button, .mx_MessageComposer button, .mx_MessageComposer [role=button], .mt-back')].filter(window.__tlm.visible);
          const small = els.map((e) => { const r = e.getBoundingClientRect(); return { l: e.getAttribute('aria-label') || e.className.toString().slice(0, 20), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((x) => x.w < 44 || x.h < 44);
          return { n: els.length, small };
        });
        return st.small.length ? { status: 'fail', detail: `${st.small.length}/${st.n} targets < 44px: ${st.small.slice(0, 5).map((x) => `${x.l} ${x.w}x${x.h}`).join(', ')}` } : { status: 'pass', detail: `${st.n} targets ≥ 44px` };
      });
      await C('MOB-10', async () => {
        const st = await page.evaluate(() => { const ed = document.querySelector('.mx_RoomView_body .mx_BasicMessageComposer_input'); return ed ? parseFloat(getComputedStyle(ed).fontSize) : null; });
        return st >= 16 ? { status: 'pass', detail: `composer ${st}px` } : { status: 'fail', detail: `composer font-size ${st}px (< 16 → iOS zooms)` };
      });
      // ---- MOB-03 keyboard up: focus composer, shrink the layout viewport by the keyboard height
      await C('MOB-03', async () => {
        const comp = page.locator('.mx_RoomView_body .mx_BasicMessageComposer_input').first();
        await tap(comp); await page.keyboard.type('draft while keyboard up', { delay: 5 });
        const kb = d.width > d.height ? 200 : 340;
        await page.setViewportSize({ width: d.width, height: d.height - kb }); await sleep(900);
        const m = await metrics(page);
        await page.setViewportSize({ width: d.width, height: d.height }); await sleep(600);
        const ok = m.composer?.inVp && m.bodies >= 1;
        return { status: ok ? 'pass' : 'fail', detail: `${d.width}x${d.height - kb}: composer ${m.composer ? `${m.composer.top}-${m.composer.bottom}` : 'none'} inVp ${!!m.composer?.inVp}, ${m.bodies} bodies` };
      }, { shootAlways: true });
      // ---- VP-13 rotation keeps room + draft
      await C('VP-13', async () => {
        await page.setViewportSize({ width: d.height, height: d.width }); await sleep(1000);
        const st = await page.evaluate((rid) => ({ room: location.hash.includes(rid), draft: document.querySelector('.mx_RoomView_body .mx_BasicMessageComposer_input')?.textContent || '' }), R.sandbox);
        await page.setViewportSize({ width: d.width, height: d.height }); await sleep(800);
        return st.room && /draft while keyboard up/.test(st.draft) ? { status: 'pass' } : { status: 'fail', detail: JSON.stringify(st) };
      }, { shootAlways: true, shotName: devName + '-rotated' });
      await page.locator('.mx_RoomView_body .mx_BasicMessageComposer_input').first().click().catch(() => {});
      await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace');
      // ---- MOB-04 right panel on phones
      await toRoom();
      await C('MOB-04', async () => {
        await page.evaluate(() => window.mxSdkContext?.rightPanelStore?.setCard?.({ phase: 'RoomSummary' }, true));
        await sleep(300);
        if (!(await page.locator('.mx_RightPanel').filter({ visible: true }).count())) {
          const btn = page.locator('.mx_RoomHeader [class*="_icon-button_"][aria-label="Room info"]').filter({ visible: true }).first();
          if (await btn.count()) await tap(btn);
          else { const more = page.locator('.mt-more').filter({ visible: true }).first(); if (await more.count()) { await tap(more); await sleep(500); await tap(page.locator('[role=menuitem]').filter({ hasText: /Room info/ }).first()); } }
        }
        await page.locator('.mx_RightPanel').filter({ visible: true }).first().waitFor({ timeout: 6000 }); await sleep(800);
        const st = await page.evaluate(() => { const p = document.querySelector('.mx_RightPanel'); const r = p.getBoundingClientRect(); const back = [...document.querySelectorAll('.mt-back, .mx_RightPanel [aria-label="Close"], .mx_RightPanel [aria-label="Back"], .mx_RightPanel [aria-label*="lose" i], .mx_RightPanel [aria-label*="back" i]')].find(window.__tlm.visible);
          return { iw: innerWidth, w: Math.round(Math.min(r.right, innerWidth) - Math.max(r.left, 0)), inVp: window.__tlm.inViewport(p, 2), back: back ? window.__tlm.hittable(back).ok : false }; });
        const ok = st.w >= d.width * 0.9 && st.back;
        if (!ok) await page.screenshot({ path: rec.shotPath('MOB-04', theme, devName + '-open') }).catch(() => {});
        await page.evaluate(() => window.mxSdkContext?.rightPanelStore?.hide?.(null)); await sleep(500);
        return { status: ok ? 'pass' : 'fail', detail: `panel ${st.w}/${d.width}px (layout innerWidth ${st.iw}), close/back ${st.back}` };
      }, { shootAlways: true });
      await C('MOB-06', async () => {
        await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_create_room' }));
        const dl = page.locator('.mx_Dialog').first(); await dl.waitFor({ state: 'visible', timeout: 6000 }); await sleep(500);
        const st = await dl.evaluate((el) => ({ inVp: window.__tlm.inViewport(el, 2), w: el.getBoundingClientRect().width | 0, close: !!el.querySelector('.mx_Dialog_cancelButton') && window.__tlm.hittable(el.querySelector('.mx_Dialog_cancelButton')).ok }));
        await page.keyboard.press('Escape'); await sleep(300);
        return st.inVp && st.close ? { status: 'pass', detail: `${st.w}px` } : { status: 'fail', detail: JSON.stringify(st) };
      });
      await C('MOB-05', async () => {
        await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_user_settings', initialTabId: 'USER_APPEARANCE_TAB' }));
        await page.locator('.mx_UserSettingsDialog').first().waitFor({ state: 'visible', timeout: 6000 }); await sleep(600);
        const st = await page.evaluate(() => { const d = document.querySelector('.mx_UserSettingsDialog').closest('.mx_Dialog') || document.querySelector('.mx_UserSettingsDialog'); const p = document.querySelector('.mx_UserSettingsDialog .mx_TabbedView_tabPanel')?.getBoundingClientRect();
          return { inVp: window.__tlm.inViewport(d, 2), panelW: p ? Math.round(Math.min(p.right, innerWidth) - Math.max(p.left, 0)) : 0 }; });
        await page.keyboard.press('Escape'); await sleep(300);
        return st.inVp && st.panelW >= Math.min(280, d.width * 0.7) ? { status: 'pass', detail: `panel ${st.panelW}px` } : { status: 'fail', detail: `inViewport ${st.inVp}, tab panel ${st.panelW}px` };
      }, { shootAlways: true });
    }
    await closeAll(page);
    // ---- VP-14 DPR rendering evidence (always shot; judged by a human) + A11Y-03 for zoom200
    if (d.dpr >= 2) await C('VP-14', async () => ({ status: 'pass', detail: 'screenshot for visual review' }), { shootAlways: true });
    if (devName === 'zoom200') {
      await C('A11Y-03', async () => {
        const m = await metrics(page);
        const ok = m.composer?.inVp && m.overflow <= 1 && (m.items >= 3 || m.back);
        return { status: ok ? 'pass' : 'fail', detail: `composer ${!!m.composer?.inVp}, overflow ${m.overflow}, room list ${m.items}, back ${m.back}` };
      }, { shootAlways: true });
    }
    // ---- VP-09 on the device too
    await C('VP-09', async () => {
      if (d.touch) {
        const b = page.locator('.tl-header-button, .mt-more').filter({ visible: true }).first();
        if (await page.locator('.tl-header-button').filter({ visible: true }).count()) await tap(page.locator('.tl-header-button').filter({ visible: true }).first());
        else await page.keyboard.press('Alt+Shift+KeyT');
        void b;
      } else await page.keyboard.press('Alt+Shift+KeyT');
      await page.locator('.tl-switcher').first().waitFor({ state: 'visible', timeout: 5000 }); await sleep(300);
      const st = await page.evaluate(() => { const sw = document.querySelector('.tl-switcher'); const dl = sw.closest('.mx_Dialog') || sw; const lr = document.querySelector('.tl-quick-list')?.getBoundingClientRect(); const it = [...document.querySelectorAll('.tl-quick-item')].find((e) => { const r = e.getBoundingClientRect(); const cy = r.top + r.height / 2; return window.__tlm.visible(e) && lr && cy > lr.top && cy < lr.bottom; }); return { inVp: window.__tlm.inViewport(dl, 2), item: it ? window.__tlm.hittable(it).ok : false }; });
      await page.keyboard.press('Escape'); await sleep(300);
      return st.inVp && st.item ? { status: 'pass' } : { status: 'fail', detail: JSON.stringify(st) };
    });
    void ro;
  } finally { await s.close(); }
}

// ------------------------------------------------------------------ queue
const jobs = a.mode === 'devices' ? themes.flatMap((t) => devList.map((d) => [t, d])) : themes.map((t) => [t]);
const total = jobs.length; const t0 = Date.now();
async function worker(n) {
  while (jobs.length) {
    const [t, d] = jobs.shift();
    log(`[w${n}] ${t}${d ? ' ' + d : ''} (${total - jobs.length}/${total})`);
    try {
      if (a.mode === 'matrix') await matrixTheme(t);
      else if (a.mode === 'login') await loginTheme(t);
      else await deviceTheme(t, d);
    } catch (e) { log('job failed', t, d || '', String(e.message).split('\n')[0]); rec.add(a.mode === 'login' ? 'VP-15' : a.mode === 'devices' ? 'MOD-06' : 'VP-01', t, 'fail', 'harness: ' + String(e.message).split('\n')[0], { viewport: d || null }); }
    rec.write(run + '.json');
  }
}
await Promise.all(Array.from({ length: Math.min(+a.parallel, total) }, (_, i) => worker(i + 1)));
const out = rec.write(run + '.json');
const c = rec.results.reduce((m, r) => (m[r.status] = (m[r.status] || 0) + 1, m), {});
log(`done in ${Math.round((Date.now() - t0) / 60000)} min → ${path.relative(ROOT, out)}`, JSON.stringify(c));
