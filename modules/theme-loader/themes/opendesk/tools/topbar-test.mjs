// Dev tool (not shipped): check the enhancer's app switcher with an "apps" config injected into the dev
// server's config.json (Playwright route; nothing is written). Uses the harness session pool.
//   node themes/opendesk/tools/topbar-test.mjs [--theme opendesk-light] [--shot out.png]
import { launch, resolveBase, themeUrl, waitForApp, parseArgs, sleep } from '../../../tests/harness/lib.mjs';
const a = parseArgs(process.argv.slice(2), { theme: 'opendesk-light', shot: 'recordings/screens/opendesk-light/x-app-switcher.png' });
const base = await resolveBase(a.baseUrl);
const { page, consoleErrors, cleanup } = await launch({ user: 'themes-mira', base });
try {
  await page.route(/\/config(\.[^/]+)?\.json/, async (route) => {
    const res = await route.fetch();
    const c = await res.json();
    const D = 'od.example.org';
    c['de.datanauten.theme_loader'] = { ...(c['de.datanauten.theme_loader'] || {}), opendesk: {
      portal_url: `https://portal.${D}/`,
      apps: [['files', 'Files', 'files'], ['mail', 'Email', 'webmail'], ['calendar', 'Calendar', 'webmail'], ['contacts', 'Contacts', 'webmail'],
        ['tasks', 'Tasks', 'webmail'], ['projects', 'Projects', 'projects'], ['knowledge', 'Knowledge', 'wiki'], ['videoconference', 'Videoconference', 'meet'],
        ['chat', 'Chat', null], ['notes', 'Notes', 'notes']].map(([id, name, h]) => ({ id, name, url: h ? `https://${h}.${D}/` : base + '/' })),
    } };
    await route.fulfill({ response: res, json: c });
  });
  await page.goto(themeUrl(base, { theme: a.theme }));
  await waitForApp(page);
  await sleep(1500);
  const btn = page.locator('#tl-overlay-root .od-topbar__grid');
  console.log('grid button:', await btn.count());
  await btn.click();
  await sleep(500);
  console.log('popover visible:', await page.locator('#od-apps').isVisible(), 'items:', await page.locator('#od-apps a').count(),
    'focused:', await page.evaluate(() => document.activeElement?.textContent));
  await page.screenshot({ path: a.shot });
  await page.keyboard.press('Escape');
  await sleep(300);
  console.log('after Esc hidden:', await page.locator('#od-apps').isHidden(), 'expanded:', await btn.getAttribute('aria-expanded'));
  console.log('[theme-loader] errors:', consoleErrors.filter((e) => /theme-loader/.test(e)));
} finally { await cleanup(); }
