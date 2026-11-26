#!/usr/bin/env node
// Create / refresh the master Element session of a test user for one origin (base URL).
//   node qa/harness/session.mjs themes-mira [--base-url URL] [--bootstrap] [--verify] [--sync] [--headed]
// First run logs in ONCE with m.login.password (non-expiring compat token, device "Theme Lab · Element (<host>)"),
// injects it via window.mxLoginWithAccessToken and keeps the browser profile in .state/profiles/<user>@<host>/.
//   --bootstrap  set up cross-signing + recovery in Element (account without cross-signing; mira). Recovery key -> .state/<user>.recovery
//   --verify     new origin for an account that already has recovery: "Confirm your identity" -> recovery key
//   --sync       just open the master profile, let it sync/download keys for a while, close (after seeding E2EE history)
// Nothing secret is printed.
import fs from 'node:fs';
import path from 'node:path';
import { STATE, HS, launch, parseArgs, resolveBase, originKey, masterProfile, slotSuffix, waitForApp, dismissNags, log, sleep } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const user = args._[0] || 'themes-mira';
const base = await resolveBase(args.baseUrl);
const host = originKey(base);
const slot = +(args.slot || 1);
const credPath = path.join(STATE, `element-${user}@${host}${slotSuffix(slot)}.json`);
const recPath = path.join(STATE, `${user}.recovery`);
const KEY_RE = /\b(?:[A-Za-z0-9]{4}\s){11}[A-Za-z0-9]{4}\b/;

function writeSecret(p, s) { fs.writeFileSync(p, s, { mode: 0o600 }); fs.chmodSync(p, 0o600); }

async function compatToken() {
  if (fs.existsSync(credPath)) {
    const c = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    const r = await fetch(`${HS}/_matrix/client/v3/account/whoami`, { headers: { Authorization: `Bearer ${c.access_token}` } });
    if (r.ok) return c;
    log('stored Element token invalid, logging in again');
  }
  const line = fs.readFileSync(path.join(STATE, 'users.txt'), 'utf8').split('\n').find((l) => l.split(/\s+/)[0] === user);
  if (!line) throw new Error(`${user} not in .state/users.txt`);
  const password = line.slice(line.indexOf(' ') + 1).trim();
  for (let i = 0; i < 10; i++) {
    const r = await fetch(`${HS}/_matrix/client/v3/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'm.login.password', identifier: { type: 'm.id.user', user }, password,
        initial_device_display_name: `Theme Lab · Element (${host}${slotSuffix(slot)})` }),
    });
    const j = await r.json();
    if (r.status === 429) { await sleep((j.retry_after_ms || 5000) + 500); continue; }
    if (!r.ok) throw new Error(`login failed: ${r.status} ${j.errcode}`);
    const c = { user_id: j.user_id, device_id: j.device_id, access_token: j.access_token, base };
    writeSecret(credPath, JSON.stringify(c, null, 1));
    log(`new Element device ${j.device_id} for ${user} on ${host}`);
    return c;
  }
  throw new Error('login rate limited');
}

const cred = await compatToken();
const { page, cleanup } = await launch({ user, base, slot, create: true, headless: !args.headed });
let sn = 0;
const shot = (n) => page.screenshot({ path: path.join(STATE, 'run', `session-${user}-${String(sn++).padStart(2, '0')}-${n}.png`) }).catch(() => {});
try {
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.mxMatrixClientPeg && (window.mxMatrixClientPeg.get?.() || document.querySelector('.mx_AuthPage, .mx_Welcome, .mx_Login')), null, { timeout: 60000, polling: 500 });
  const loggedIn = await page.evaluate(() => !!window.mxMatrixClientPeg.get?.());
  if (!loggedIn) {
    log('injecting session');
    await page.evaluate(([hs, tok]) => window.mxLoginWithAccessToken(hs, tok), [HS, cred.access_token]);
  } else {
    const dev = await page.evaluate(() => window.mxMatrixClientPeg.get().getDeviceId());
    if (dev !== cred.device_id) log(`WARNING: profile holds device ${dev}, cred file says ${cred.device_id}`);
  }
  await page.waitForFunction(() => window.mxMatrixClientPeg.get?.()?.isInitialSyncComplete?.(), null, { timeout: 120000, polling: 500 });
  await sleep(6000);
  await shot('after-login');

  const btn = async (re) => {   // prefer a match inside the top-most modal, else anywhere on the page
    const inDlg = page.locator('.mx_Dialog').filter({ visible: true }).last().locator('button, [role=button]').filter({ hasText: re, visible: true });
    if (await inDlg.count()) return inDlg;
    return page.locator('button, [role=button]').filter({ hasText: re, visible: true });
  };

  if (args.verify) {
    let saved = fs.readFileSync(recPath, 'utf8').trim();
    await page.locator('.mx_Toast_toast, [class*="_toast_"]').filter({ hasText: /Verify this device|Confirm your identity/ }).first().waitFor({ timeout: 30000 }).catch(() => {});
    const vt = page.locator('.mx_Toast_toast, [class*="_toast_"]').filter({ hasText: /Verify this device|Confirm your identity/ }).getByRole('button', { name: /^(Continue|Verify)$/ });
    if (await vt.count()) { await vt.first().click(); await sleep(2500); }
    else { await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_user_settings', initialTabId: 'USER_ENCRYPTION_TAB' })); await sleep(2500);
      const v = page.getByRole('button', { name: /^Verify this device$/ }); if (await v.count()) { await v.first().click(); await sleep(2500); } }
    for (let i = 0; i < 12; i++) {
      const input = page.locator('.mx_Dialog input[type="password"]:visible, .mx_Dialog input[type="text"]:visible, .mx_Dialog textarea:visible, .mx_CompleteSecurity input[type="password"]:visible');
      if (await input.count()) { await input.first().fill(saved); await sleep(800); }
      let clicked = null;
      for (const re of [/^\s*Use recovery key\s*$/, /^\s*Verify with Recovery Key\s*$/i, /^\s*Continue\s*$/, /^\s*Done\s*$/]) {
        const b = await btn(re);
        if (await b.count() && await b.first().isEnabled()) { await b.first().click(); clicked = String(re); break; }
      }
      log('verify step', i, clicked);
      if (!clicked) {
        const t = page.getByRole('button', { name: /^(Continue|Verify)$/ }).filter({ visible: true });
        if (await t.count()) { await t.first().click(); continue; }
        break;
      }
      await sleep(2500);
    }
    await shot('verify-final');
  }

  // --reset-identity: the account already has a cross-signing identity whose private keys we don't hold (e.g. an
  // unrelated login auto-created one). Element: Verify this device -> Can't confirm? -> reset, approved in MAS.
  if (args.resetIdentity) {
    const password = (() => { const l = fs.readFileSync(path.join(STATE, 'users.txt'), 'utf8').split('\n').find((x) => x.split(/\s+/)[0] === user); return l.slice(l.indexOf(' ') + 1).trim(); })();
    const toast = page.locator('.mx_Toast_toast, [class*="_toast_"]').getByRole('button', { name: /^Continue$/ });
    if (await toast.count()) await toast.first().click();
    else await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_user_settings', initialTabId: 'USER_ENCRYPTION_TAB' }));
    await sleep(2500);
    const v = page.getByRole('button', { name: /^Verify this device$/ }).filter({ visible: true });
    if (await v.count()) { await v.first().click(); await sleep(2500); }
    await page.getByRole('button', { name: "Can't confirm?" }).filter({ visible: true }).first().click(); await sleep(2000);
    await shot('reset-0');
    await (await btn(/^\s*(Continue|Reset)\s*$/)).last().click(); await sleep(3000);
    await shot('reset-1');
    const popupP = page.context().waitForEvent('page', { timeout: 15000 }).catch(() => null);
    const cta = await btn(/Continue to account/);
    if (await cta.count()) {
      await cta.first().click();
      const mas = await popupP;
      if (!mas) throw new Error('MAS page did not open');
      await mas.waitForLoadState('domcontentloaded'); await sleep(2500);
      for (let i = 0; i < 8 && !mas.isClosed(); i++) try {
        await mas.screenshot({ path: path.join(STATE, 'run', `session-${user}-mas-${i}.png`) }).catch(() => {});
        const u = mas.locator('input[name="username"]:visible'); const pw = mas.locator('input[type="password"]:visible');
        if (await u.count()) await u.fill(user);
        if (await pw.count()) { await pw.first().fill(password); }
        const b = mas.locator('button:visible').filter({ hasText: /^(Continue|Sign in|Finish reset|Reset|Allow|Confirm|Yes)/i });
        const texts = await mas.locator('button:visible').allInnerTexts();
        log('MAS step', i, JSON.stringify(texts.slice(0, 6)));
        if (/reset.*(complete|allowed|approved)|you can now|return to/i.test(await mas.locator('body').innerText())) break;
        if (!(await b.count())) break;
        await b.first().click(); await mas.waitForLoadState('domcontentloaded').catch(() => {}); await sleep(3000);
      } catch (e) { log('MAS page closed:', String(e.message).split('\n')[0]); break; }
      await mas.close().catch(() => {});
      await (await btn(/^\s*Retry\s*$/)).first().click().catch(() => {}); await sleep(5000);
      await shot('reset-2');
    }
    args.bootstrap = true;     // the new identity needs recovery set up
  }

  if (args.bootstrap) {
    let saved = fs.existsSync(recPath) ? fs.readFileSync(recPath, 'utf8').trim() : null;
    // Recovery: toast "Set up recovery" -> Continue, otherwise Settings -> Encryption
    let t = page.locator('.mx_Toast_toast, [class*="_toast_"]').getByRole('button', { name: /^(Continue|Set up recovery)$/ });
    if (await t.count()) await t.first().click();
    else await page.evaluate(() => window.mxDispatcher.dispatch({ action: 'view_user_settings', initialTabId: 'USER_ENCRYPTION_TAB' }));
    await sleep(2500);
    for (let i = 0; i < 25; i++) {
      const body = await page.locator('body').innerText();
      const m = body.match(KEY_RE);
      if (m && !saved) { saved = m[0].replace(/\s+/g, ' ').trim(); writeSecret(recPath, saved + '\n'); log('recovery key saved to .state'); }
      if (!m) await shot(`bootstrap-${i}`);
      const input = page.locator('input[type="password"]:visible, input[type="text"]:visible, textarea:visible');
      if (saved && !m && /recovery key/i.test(body) && await input.count()) { await input.first().fill(saved); await sleep(800); }
      let clicked = null;
      for (const re of [/^\s*Set up recovery\s*$/, /^\s*Create recovery key\s*$/, /^\s*Continue\s*$/, /^\s*Finish set up\s*$/, /^\s*Done\s*$/, /^\s*Next\s*$/]) {
        const b = await btn(re);
        if (await b.count() && await b.last().isEnabled()) { await b.last().click(); clicked = String(re); break; }
      }
      log('bootstrap step', i, clicked);
      if (!clicked) {
        if (/Change recovery key|Recovery is set up|key storage/i.test(body) && saved) break;
        if (i > 3) break;
      }
      await sleep(2500);
    }
    await page.keyboard.press('Escape');
    if (!saved) log('WARNING: no recovery key captured — see .state/run/session-*.png');
    await shot('bootstrap-final');
  }

  // off-camera housekeeping: dismiss toasts once in the master so every copy starts clean
  await dismissNags(page);
  if (args.sync) { log('syncing 25 s for room keys …'); await sleep(25000); }
  const status = await page.evaluate(async () => {
    const c = window.mxMatrixClientPeg.get();
    const crypto = c.getCrypto();
    const own = crypto ? await crypto.getDeviceVerificationStatus(c.getUserId(), c.getDeviceId()) : null;
    return { device: c.getDeviceId(), crossSigned: own ? own.crossSigningVerified : null,
      backup: crypto ? !!(await crypto.getActiveSessionBackupVersion()) : null, rooms: c.getRooms().length };
  });
  log('status', JSON.stringify(status));
  const ready = path.join(masterProfile(user, base, slot), 'tl-ready.json');
  if (status.crossSigned) fs.writeFileSync(ready, JSON.stringify({ ...status, at: new Date().toISOString() }));
  else { fs.rmSync(ready, { force: true }); log('slot NOT marked ready (device not cross-signed) — harness runs will skip it'); }
  await shot('final');
} finally {
  await cleanup();
  fs.rmSync(path.join(masterProfile(user, base, slot), 'SingletonLock'), { force: true });
}
