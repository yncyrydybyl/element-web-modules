// Dev tool (not shipped): create/refresh the openDesk test session used by od-shoot.mjs.
// Logs `themetest` (credentials in .state/opendesk-themetest.txt, never printed) into chat.<od> via Keycloak SSO,
// into the harness-style profile .state/profiles/themetest@<origin>/ and marks it ready.
//   NODE_PATH=~/projects/matrix-search-widget/node_modules node themes/opendesk/tools/od-session.mjs [--base-url https://chat.od.blackpony.club] [--portal]
import fs from 'node:fs';
import path from 'node:path';
import { launch, masterProfile, STATE, parseArgs, log } from '../../../tests/harness/lib.mjs';

const args = parseArgs(process.argv.slice(2), { 'base-url': 'https://chat.od.blackpony.club' });
const base = args['base-url'];
const cred = Object.fromEntries(fs.readFileSync(path.join(STATE, 'opendesk-themetest.txt'), 'utf8').trim().split('\n').map((l) => l.split(/=(.*)/s).slice(0, 2)));
const { ctx, page, cleanup } = await launch({ user: 'themetest', base, create: true });
try {
  await page.goto(base + '/#/login');
  // Element welcome → "Continue" (SSO) → MAS → Keycloak
  for (let i = 0; i < 60; i++) {
    const url = page.url();
    if (/\/realms\/.+\/(protocol|login-actions)/.test(url) && await page.locator('#username').count()) {
      await page.fill('#username', cred.username);
      await page.fill('#password', cred.password);
      await Promise.all([page.waitForLoadState('domcontentloaded'), page.locator('#kc-login, [type=submit]').first().click()]);
    } else if (url.startsWith(base) && await page.evaluate(() => !!window.mxMatrixClientPeg?.get?.()?.isInitialSyncComplete?.()).catch(() => false)) {
      break;
    } else {
      const btn = page.getByRole('button', { name: /^(Continue|Weiter|Fortfahren|Allow|Zulassen|Sign in|Anmelden|Continue with .*)$/i }).first();
      const link = page.getByRole('link', { name: /^(Continue|Weiter|Sign in|Anmelden|Continue with .*)$/i }).first();
      if (await btn.count()) await btn.click().catch(() => {});
      else if (await link.count()) await link.click().catch(() => {});
    }
    await page.waitForTimeout(1500);
  }
  await page.waitForFunction(() => window.mxMatrixClientPeg?.get?.()?.isInitialSyncComplete?.(), null, { timeout: 60000 });
  log('logged in as', await page.evaluate(() => window.mxMatrixClientPeg.get().getUserId()));
  if (args.portal) {
    const out = path.join(STATE, '..', 'research', 'opendesk');
    fs.mkdirSync(out, { recursive: true });
    for (const [name, url] of [['portal', 'https://portal.od.blackpony.club/'], ['files', 'https://files.od.blackpony.club/'], ['webmail', 'https://webmail.od.blackpony.club/']]) {
      const p = await ctx.newPage();
      await p.goto(url).catch(() => {});
      await p.waitForTimeout(9000);
      await p.screenshot({ path: path.join(out, `od-${name}.png`) });
      await p.close();
    }
  }
  fs.writeFileSync(path.join(masterProfile('themetest', base, 1), 'tl-ready.json'), JSON.stringify({ at: new Date().toISOString() }));
} catch (e) {
  await page.screenshot({ path: path.join(STATE, 'od-session-fail.png') }).catch(() => {});
  console.error('FAILED at', page.url(), e.message);
  process.exitCode = 1;
} finally { await cleanup(); }
