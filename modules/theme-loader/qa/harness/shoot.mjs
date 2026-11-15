#!/usr/bin/env node
// Standard screenshot set for one theme.
//   node tests/harness/shoot.mjs --theme <id> [--phase <p>] [--base-url URL] [--user themes-mira]
//        [--width 1440 --height 900] [--mobile] [--only 02,05] [--out DIR]
// Output: recordings/screens/<id>[--<phase>]/<NN-region>.png (+ manifest.json). --mobile: 390x844 into .../mobile/.
// Safe to run concurrently: each run works on its own copy of the user's master profile; layout changes are
// device-level settings inside that copy only (restored anyway), nothing is written to account data.
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, launch, parseArgs, resolveBase, fixtures, themeUrl, waitForApp, dismissNags, closeOverlays, gotoRoom,
  setDeviceSetting, themeStatus, selectSpace, ensureDir, log, sleep,
} from './lib.mjs';

const a = parseArgs(process.argv.slice(2), { user: 'themes-mira', width: 1440, height: 900 });
if (!a.theme) { console.error('usage: shoot.mjs --theme <id> [--phase p] [--base-url URL] [--mobile]'); process.exit(2); }
const base = await resolveBase(a.baseUrl);
const mobile = !!a.mobile;
const viewport = mobile ? { width: 390, height: 844 } : { width: +a.width, height: +a.height };
const outDir = ensureDir(a.out || path.join(ROOT, 'recordings/screens', a.theme + (a.phase ? `--${a.phase}` : ''), mobile ? 'mobile' : ''));
const only = a.only ? String(a.only).split(',') : null;
const F = fixtures();
const R = F.rooms;
const manifest = { theme: a.theme, phase: a.phase || null, base, user: a.user, viewport, started: new Date().toISOString(), shots: [], warnings: [] };

export const REGIONS = [
  '01-home-roomlist', '02-timeline-modern', '03-timeline-content', '04-timeline-bubble', '05-timeline-irc',
  '06-thread-panel', '07-room-info', '08-member-list', '09-composer-autocomplete', '10-emoji-picker',
  '11-message-menu', '12-tooltip-reactions', '13-user-menu', '14-settings-appearance', '15-settings-themes',
  '16-modal-create-room', '17-room-settings', '18-e2ee-dm', '19-e2ee-user-verified', '20-long-names-rtl',
  '21-login', '22-mobile-roomlist', '23-mobile-timeline',
];

const { page, consoleErrors, cleanup } = await launch({ user: a.user, base, viewport });
async function snap(name, fn, { fullPage = false } = {}) {
  if (only && !only.some((o) => name.startsWith(o))) return;
  const t0 = Date.now();
  try {
    await page.mouse.move(viewport.width - 5, viewport.height - 5).catch(() => {});
    await fn();
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await sleep(500);
    await page.screenshot({ path: path.join(outDir, name + '.png'), fullPage, animations: 'disabled', caret: 'hide' });
    manifest.shots.push({ name, ok: true, ms: Date.now() - t0 });
    log('✓', name);
  } catch (e) {
    manifest.shots.push({ name, ok: false, error: String(e.message || e).split('\n')[0] });
    log('✗', name, String(e.message || e).split('\n')[0]);
    await page.screenshot({ path: path.join(outDir, name + '.png') }).catch(() => {});
  }
  await closeOverlays(page);
}

const tile = (text) => page.locator('.mx_EventTile').filter({ hasText: text }).last();
async function scrollTo(text, block = 'center') {
  for (let i = 0; i < 25; i++) {
    const t = tile(text);
    if (await t.count()) { await t.evaluate((el, b) => el.scrollIntoView({ block: b }), block); await sleep(700); return t; }
    await page.evaluate(() => { const p = document.querySelector('.mx_RoomView_messagePanel'); if (p) p.scrollTop = 0; });
    await sleep(900);
  }
  throw new Error(`event "${text}" not found in timeline`);
}
async function scrollBottom() {
  await page.evaluate(() => { const p = document.querySelector('.mx_RoomView_messagePanel'); if (p) p.scrollTop = p.scrollHeight; });
  const jump = page.locator('.mx_JumpToBottomButton_scrollDown, [aria-label="Scroll to most recent messages"]');
  if (await jump.count()) await jump.first().click().catch(() => {});
  await sleep(900);
}
async function rightPanel(phaseBtnLabel) {
  const b = page.locator(`.mx_RoomHeader [aria-label="${phaseBtnLabel}"], .mx_RoomHeader button[aria-label*="${phaseBtnLabel}"]`).first();
  await b.click();
  await page.locator('.mx_RightPanel').waitFor({ state: 'visible' });
  await sleep(900);
}
async function closeRightPanel() {
  await page.evaluate(() => { try { window.mxSdkContext?.rightPanelStore?.hide?.(null); } catch { /* ignore */ } }).catch(() => {});
  await sleep(300);
}

try {
  await page.goto(themeUrl(base, { theme: a.theme, phase: a.phase, hash: '/home' }), { waitUntil: 'domcontentloaded' });
  await waitForApp(page);
  await dismissNags(page);
  const ts = await themeStatus(page, a.theme);
  manifest.themeStatus = ts;
  if (a.theme !== 'element-default' && ts.tlTheme !== a.theme) {
    manifest.warnings.push(`html[data-tl-theme] is ${ts.tlTheme}, expected ${a.theme} (loader missing or unknown id?)`);
    log('WARNING', manifest.warnings.at(-1));
  }
  const origLayout = await page.evaluate(() => window.mxSettingsStore.getValueAt('device', 'layout', null, true, true));
  await setDeviceSetting(page, 'layout', 'group');

  await snap('01-home-roomlist', async () => {
    await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_home_page' }));
    await selectSpace(page, R.space);   // space home + Theme Lab room list (unread badges live here)
    await page.locator('.mx_RoomListPanel, .mx_LeftPanel').first().waitFor();
    await page.mouse.move(1000, 880);
    await sleep(800);
  });
  await gotoRoom(page, R.showcase);
  await closeRightPanel();
  await snap('02-timeline-modern', scrollBottom);
  await snap('03-timeline-content', () => scrollTo('Markdown check', 'start'));
  await snap('04-timeline-bubble', async () => { await setDeviceSetting(page, 'layout', 'bubble'); await sleep(800); await scrollTo('On it — the elbow', 'center'); });
  await snap('05-timeline-irc', async () => { await setDeviceSetting(page, 'layout', 'irc'); await sleep(800); await scrollTo('On it — the elbow', 'center'); });
  await setDeviceSetting(page, 'layout', 'group');
  await snap('06-thread-panel', async () => {
    const root = await scrollTo('which theme should be the default', 'center');
    await root.locator('.mx_ThreadSummary, [class*="ThreadSummary"]').first().click();
    await page.locator('.mx_ThreadView .mx_EventTile').first().waitFor();
    await sleep(1200);
  });
  await closeRightPanel();
  await snap('07-room-info', () => rightPanel('Room info'));
  await snap('08-member-list', async () => {
    const people = page.locator('.mx_RightPanel').getByRole('menuitem', { name: /People/ }).or(page.locator('.mx_RightPanel button', { hasText: /^People/ }));
    if (!(await page.locator('.mx_RightPanel').isVisible().catch(() => false))) await rightPanel('Room info');
    await people.first().click();
    await page.locator('.mx_MemberListView, .mx_MemberList').first().waitFor();
    await sleep(800);
  });
  await closeRightPanel();
  await scrollBottom();
  await snap('09-composer-autocomplete', async () => {
    const ed = page.locator('.mx_BasicMessageComposer_input').first();
    await ed.click();
    await ed.pressSequentially('Thanks @Jo', { delay: 40 });
    await page.locator('.mx_Autocomplete').first().waitFor({ timeout: 8000 });
    await sleep(600);
  });
  // clear composer (drafts would otherwise linger in this copy only, but keep the following shots clean)
  await page.locator('.mx_BasicMessageComposer_input').first().click().catch(() => {});
  await page.keyboard.press('Escape'); await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace');
  await snap('10-emoji-picker', async () => {
    await page.locator('.mx_MessageComposer [aria-label="Emoji"], .mx_MessageComposer_emoji').first().click();
    await page.locator('.mx_ContextualMenu, .mx_EmojiPicker').first().waitFor();
    await sleep(600);
  });
  await snap('11-message-menu', async () => {
    const t = await scrollTo('New gallery screenshots are up', 'center');
    await t.hover(); await sleep(300);
    await t.locator('.mx_MessageActionBar [aria-label="Options"]').click();
    await page.locator('.mx_ContextualMenu, [role="menu"]').first().waitFor();
    await sleep(500);
  });
  await snap('12-tooltip-reactions', async () => {
    const t = await scrollTo('New gallery screenshots are up', 'center');
    await t.locator('.mx_ReactionsRowButton, [class*="ReactionsRowButton"], [aria-label*="reacted with"]').first().hover();
    await page.locator('[role="tooltip"], .mx_Tooltip').first().waitFor({ timeout: 6000 });
    await sleep(400);
  });
  await snap('13-user-menu', async () => {
    await page.locator('.mx_UserMenu, [aria-label="User menu"]').first().click();
    await page.locator('[role="menu"], .mx_ContextualMenu').first().waitFor();
    await sleep(400);
  });
  await snap('14-settings-appearance', async () => {
    await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_user_settings', initialTabId: 'USER_APPEARANCE_TAB' }));
    await page.locator('.mx_UserSettingsDialog').waitFor(); await sleep(1000);
  });
  await snap('15-settings-themes', async () => {
    if (!(await page.locator('.mx_UserSettingsDialog').count())) {
      await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_user_settings', initialTabId: 'USER_APPEARANCE_TAB' }));
      await page.locator('.mx_UserSettingsDialog').waitFor();
    }
    await page.locator('.mx_TabbedView_tabLabel, [role="tab"]').filter({ hasText: /^\s*Themes\s*$/ }).first().click();
    await sleep(1500);
  });
  await snap('16-modal-create-room', async () => {
    await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_create_room' }));
    await page.locator('.mx_CreateRoomDialog, .mx_Dialog').first().waitFor(); await sleep(600);
  });
  await snap('17-room-settings', async () => {
    await page.evaluate((rid) => window.mxDispatcher.dispatch({ action: 'open_room_settings', room_id: rid }), R.showcase);
    await page.locator('.mx_RoomSettingsDialog').waitFor(); await sleep(800);
  });
  if (R['dm-jonas']) {
    await gotoRoom(page, R['dm-jonas']);
    await closeRightPanel();
    await snap('18-e2ee-dm', async () => {
      await scrollBottom();
      const shield = page.locator('.mx_RoomHeader [class*="E2EIcon"], .mx_RoomHeader [data-testid*="shield"], .mx_RoomHeader svg[class*="verified"]').first();
      if (await shield.count()) { await shield.hover(); await sleep(700); }
    });
    await snap('19-e2ee-user-verified', async () => {
      await page.evaluate((uid) => window.mxDispatcher.dispatch({ action: 'view_user', member: window.mxMatrixClientPeg.get().getUser(uid) }), '@themes-jonas:datanauten.de');
      await page.locator('.mx_UserInfo').waitFor(); await sleep(1200);
    });
    await closeRightPanel();
  }
  if (R.long) {
    await snap('20-long-names-rtl', async () => {
      await setDeviceSetting(page, 'layout', 'irc');
      await gotoRoom(page, R.long); await scrollBottom();
    });
    await setDeviceSetting(page, 'layout', 'group');
  }
  // restore layout (only this copy's localStorage, but keep the contract)
  await page.evaluate((v) => window.mxSettingsStore.setValue('layout', null, 'device', v ?? null), origLayout).catch(() => {});

  if (!only || only.some((o) => '22-mobile-roomlist'.startsWith(o) || '23-mobile-timeline'.startsWith(o))) {
    if (!mobile) await page.setViewportSize({ width: 390, height: 844 });
    await sleep(800);
    await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_home_page' }));
    await selectSpace(page, R.space);
    await snap('22-mobile-roomlist', () => sleep(800));
    await gotoRoom(page, R.showcase);
    await snap('23-mobile-timeline', scrollBottom);
    if (!mobile) await page.setViewportSize(viewport);
  }
} finally {
  manifest.consoleErrors = [...new Set(consoleErrors)].slice(0, 50);
  await cleanup();
}

// logged-out context for the auth region
if (!only || only.some((o) => '21-login'.startsWith(o))) {
  const anon = await launch({ user: null, base, viewport });
  try {
    await anon.page.goto(themeUrl(base, { theme: a.theme, phase: a.phase, hash: '/login' }), { waitUntil: 'domcontentloaded' });
    await anon.page.locator('.mx_AuthPage, .mx_Welcome, .mx_Login').first().waitFor({ timeout: 60000 });
    await sleep(2500);
    await anon.page.screenshot({ path: path.join(outDir, '21-login.png'), animations: 'disabled' });
    manifest.shots.push({ name: '21-login', ok: true }); log('✓ 21-login');
  } catch (e) {
    manifest.shots.push({ name: '21-login', ok: false, error: String(e.message).split('\n')[0] });
  } finally { await anon.cleanup(); }
}
manifest.finished = new Date().toISOString();
manifest.shots.sort((x, y) => x.name.localeCompare(y.name));
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
const bad = manifest.shots.filter((s) => !s.ok);
log(`${manifest.shots.length - bad.length}/${manifest.shots.length} shots ok → ${path.relative(ROOT, outDir)}`);
process.exit(bad.length ? 1 : 0);
