// Dev tool (not shipped): screenshot themes on a real openDesk Element (default chat.od.blackpony.club) as the
// dedicated test user `themetest` (session from od-session.mjs; credentials only in .state/).
// Creates one unencrypted fixture room "Theme Lab · openDesk" for themetest on first run (idempotent).
//   node themes/opendesk/tools/od-shoot.mjs --themes element-default,opendesk-light,… [--phase night] [--out recordings/opendesk-prod]
import fs from 'node:fs';
import path from 'node:path';
import { launch, parseArgs, sleep, log } from '../../../tests/harness/lib.mjs';

const a = parseArgs(process.argv.slice(2), { 'base-url': 'https://chat.od.blackpony.club', out: 'recordings/opendesk-prod' });
const base = a.baseUrl || a['base-url'];
const themes = String(a.themes || 'element-default').split(',');
const ROOM = 'Theme Lab · openDesk';
const results = [];

async function ensureRoom(page) {
  return page.evaluate(async (name) => {
    const cli = window.mxMatrixClientPeg.get();
    let room = cli.getRooms().find((r) => r.name === name && r.getMyMembership() === 'join');
    if (room) return room.roomId;
    const { room_id } = await cli.createRoom({ name, topic: 'Theme loader test room [Theme Lab test fixture]', preset: 'private_chat', visibility: 'private' });
    const send = (body, extra = {}) => cli.sendMessage(room_id, { msgtype: 'm.text', body, ...extra });
    await send('Willkommen im openDesk-Chat! This room exists to screenshot the theme loader.');
    await send('**Markdown**: *italic*, `inline code`, [a link](https://www.opendesk.eu/)', {
      format: 'org.matrix.custom.html',
      formatted_body: '<strong>Markdown</strong>: <em>italic</em>, <code>inline code</code>, <a href="https://www.opendesk.eu/">a link</a>',
    });
    await send('```python\ndef souveraen(x):\n    return f"openDesk {x}"\n```', {
      format: 'org.matrix.custom.html',
      formatted_body: '<pre><code class="language-python">def souveraen(x):\n    return f"openDesk {x}"\n</code></pre>',
    });
    await send('> Souverän gedacht. Flexibel gemacht.\n\nThe openDesk slogan as a quote.', {
      format: 'org.matrix.custom.html',
      formatted_body: '<blockquote><p>Souverän gedacht. Flexibel gemacht.</p></blockquote><p>The openDesk slogan as a quote.</p>',
    });
    const last = await send('A message to react to 👍');
    await cli.sendEvent(room_id, 'm.reaction', { 'm.relates_to': { rel_type: 'm.annotation', event_id: last.event_id, key: '👍' } });
    return room_id;
  }, ROOM);
}

for (const theme of themes) {
  const id = theme + (a.phase ? `--${a.phase}` : '');
  const dir = path.join(a.out, id);
  fs.mkdirSync(dir, { recursive: true });
  const r = { theme: id, shots: [], applied: null, tlErrors: [], errors: [] };
  const { page, cleanup, consoleErrors } = await launch({ user: 'themetest', base });
  const tlLogs = [];
  page.on('console', (m) => { if (/theme-loader/.test(m.text())) tlLogs.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
  const shot = async (name) => { await sleep(700); const f = path.join(dir, `${name}.png`); await page.screenshot({ path: f }); r.shots.push(f); };
  try {
    const u = new URL(base + '/');
    u.searchParams.set('tl_theme', theme === 'element-default' ? 'none' : theme);
    if (a.phase) u.searchParams.set('tl_phase', a.phase);
    await page.goto(u.toString());
    await page.waitForFunction(() => window.mxMatrixClientPeg?.get?.()?.isInitialSyncComplete?.(), null, { timeout: 90000 });
    await sleep(2500);
    r.applied = await page.evaluate(() => document.documentElement.getAttribute('data-tl-theme'));
    r.banner = await page.evaluate(() => !!document.querySelector('body > div:not(#matrixchat) > nav a > img'));
    r.ourTopbar = await page.evaluate(() => document.documentElement.hasAttribute('data-od-topbar'));
    await shot('01-home');
    const roomId = await ensureRoom(page);
    await page.evaluate((rid) => { window.location.hash = `#/room/${rid}`; }, roomId);
    await page.waitForSelector('.mx_RoomView_MessageList .mx_EventTile', { timeout: 30000 });
    await sleep(1500);
    await shot('02-room');
    // hover a message for the action bar
    await page.locator('.mx_EventTile').last().hover().catch(() => {});
    await shot('03-room-hover');
    // openDesk banner menu (native module)
    const menuBtn = page.locator('body > div:not(#matrixchat) > nav > button').first();
    if (await menuBtn.count()) { await menuBtn.click().catch(() => {}); await shot('04-banner-menu'); await page.keyboard.press('Escape'); await sleep(400); }
    // user menu → all settings → Themes tab
    await page.locator('.mx_UserMenu button, [aria-label="User menu"]').first().click().catch(() => {});
    await shot('05-user-menu');
    await page.getByRole('menuitem', { name: /All settings|Alle Einstellungen/ }).click().catch(() => {});
    await sleep(800);
    await page.locator('.tl-tab-label, [data-testid="settings-tab-Themes"]').first().click().catch(() => {});
    await shot('06-settings-themes');
    await page.keyboard.press('Escape');
    await sleep(500);
    // room info (right panel)
    await page.locator('.mx_RoomHeader [aria-label="Room info"]').last().click().catch(() => {});
    await shot('07-room-info');
    r.tlErrors = tlLogs.filter((l) => l.startsWith('error') || l.startsWith('warning'));
    r.tlLogs = tlLogs;
    r.errors = consoleErrors.slice(0, 20);
    log(`${id}: applied=${r.applied} banner=${r.banner} ourTopbar=${r.ourTopbar} tl-errors=${r.tlErrors.length}`);
  } catch (e) {
    r.failed = String(e.message || e).slice(0, 300);
    await shot('99-failure').catch(() => {});
    log(`${id}: FAILED ${r.failed}`);
  } finally {
    results.push(r);
    await cleanup();
  }
}
fs.mkdirSync(a.out, { recursive: true });
const mf = path.join(a.out, `results${a.phase ? '-' + a.phase : ''}-${Date.now()}.json`);
fs.writeFileSync(mf, JSON.stringify(results, null, 1));
console.log('wrote', mf);
