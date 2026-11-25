// Dev tool (not shipped): evaluate JS / screenshot a URL in the themetest openDesk session.
//   node themes/opendesk/tools/od-probe.mjs --url URL [--js 'expr'] [--shot out.png] [--wait 6000]
import fs from 'node:fs';
import { launch, parseArgs } from '../../../qa/harness/lib.mjs';
const a = parseArgs(process.argv.slice(2), { url: 'https://chat.od.blackpony.club/', wait: '6000' });
const { page, cleanup, consoleErrors } = await launch({ user: 'themetest', base: 'https://chat.od.blackpony.club' });
try {
  await page.goto(a.url);
  await page.waitForTimeout(+a.wait);
  if (a.click) { await page.click(a.click).catch((e) => console.log('click failed', e.message)); await page.waitForTimeout(2500); }
  if (a.js) console.log(JSON.stringify(await page.evaluate(a.js), null, 1));
  if (a.shot) await page.screenshot({ path: a.shot });
  if (a.errors) console.log('console errors:', consoleErrors);
} finally { await cleanup(); }
