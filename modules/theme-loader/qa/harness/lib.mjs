// Shared helpers for the Theme Lab harness (shoot / walkthrough / edgecheck / session).
// Concurrency model: one *master* browser profile per (user, origin) in .state/profiles/, created once by
// session.mjs. Every run copies it into its own throw-away dir under .state/run/ and never writes back, so
// several agents can run at the same time and no new Matrix device is ever created by a normal run.
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));
export const STATE = path.join(ROOT, '.state');
export const HS = process.env.TL_HS || 'https://matrix.datanauten.de';
export const DEFAULT_BASE = process.env.TL_BASE_URL || 'http://localhost:5400';
export const FALLBACK_BASE = 'https://element.datanauten.de';

const nodePaths = [process.env.NODE_PATH, path.join(os.homedir(), 'projects/matrix-search-widget/node_modules')]
  .filter(Boolean).flatMap((p) => p.split(':'));
export function req(mod) {
  for (const p of nodePaths) {
    try { return createRequire(path.join(p, 'x.js'))(mod); } catch { /* next */ }
  }
  return createRequire(import.meta.url)(mod);
}
export const { chromium } = req('playwright');

/** Absolute path of a file inside a package (harness node_modules first, then NODE_PATH, then known checkouts). */
export function findModuleFile(mod, file) {
  const dirs = [path.join(ROOT, 'tests/harness/node_modules'), ...nodePaths, path.join(os.homedir(), 'projects/element-call/node_modules')];
  for (const d of dirs) { const f = path.join(d, mod, file); if (fs.existsSync(f)) return f; }
  throw new Error(`${mod}/${file} not found — run: (cd tests/harness && npm install)`);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

export function parseArgs(argv, defaults = {}) {
  const out = { ...defaults, _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const [k, v] = a.slice(2).split('=');
    const key = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (v !== undefined) out[key] = v;
    else if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) out[key] = argv[++i];
    else out[key] = true;
  }
  return out;
}

export function fixtures() {
  return JSON.parse(fs.readFileSync(path.join(STATE, 'fixtures.json'), 'utf8'));
}

/** Base URL resolution: explicit flag > env > :5400 if it answers > production Element. */
// 127.0.0.1 and localhost are different browser origins (separate storage = separate session): normalise.
const normBase = (u) => u.replace(/\/$/, '').replace(/^(https?:\/\/)127\.0\.0\.1(?=[:/]|$)/, '$1localhost');
export async function resolveBase(flag) {
  if (flag) return normBase(flag);
  try {
    const r = await fetch(DEFAULT_BASE + '/config.json', { signal: AbortSignal.timeout(1500) });
    if (r.ok) return DEFAULT_BASE;
  } catch { /* not up */ }
  log(`(${DEFAULT_BASE} not reachable, falling back to ${FALLBACK_BASE})`);
  return FALLBACK_BASE;
}

export const originKey = (base) => new URL(base).host.replace(/^127\.0\.0\.1(?=:|$)/, 'localhost').replace(/[^a-z0-9.-]/gi, '_');
// slot 1 = the original master; slots 2..n are extra Matrix devices of the same user (one browser per device at a time)
export const slotSuffix = (slot) => (!slot || +slot === 1 ? '' : `#${slot}`);
export const masterProfile = (user, base, slot = 1) => path.join(STATE, 'profiles', `${user}@${originKey(base)}${slotSuffix(slot)}`);

/** Existing session slots of a user on an origin (dirs with a Chrome profile). */
export function sessionSlots(user, base) {
  const out = [];
  for (let n = 1; n <= 16; n++) if (fs.existsSync(path.join(masterProfile(user, base, n), 'tl-ready.json'))) out.push(n);
  return out;
}

const pidAlive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
/** Atomic mkdir lock; stale locks (dead pid) are broken. Returns release(). */
export function tryLock(dir) {
  const lock = dir + '.lock';
  try { fs.mkdirSync(lock); }
  catch {
    let pid = 0;
    try { pid = +fs.readFileSync(path.join(lock, 'pid'), 'utf8'); } catch { /* being created */ }
    const age = Date.now() - (fs.statSync(lock, { throwIfNoEntry: false })?.mtimeMs || Date.now());
    if ((pid && !pidAlive(pid)) || (!pid && age > 30000)) { fs.rmSync(lock, { recursive: true, force: true }); return tryLock(dir); }
    return null;
  }
  fs.writeFileSync(path.join(lock, 'pid'), String(process.pid));
  let released = false;
  const release = () => { if (!released) { released = true; fs.rmSync(lock, { recursive: true, force: true }); } };
  process.on('exit', release);
  for (const sig of ['SIGINT', 'SIGTERM']) process.once(sig, () => { release(); process.exit(130); });
  return release;
}

/** Wait for a free session slot of `user` (exclusive: no two browsers ever share one device's crypto store). */
export async function acquireSlot(user, base, { slot = null, timeoutMs = +(process.env.TL_SLOT_TIMEOUT || 30 * 60000) } = {}) {
  const slots = slot ? [+slot] : sessionSlots(user, base);
  if (!slots.length) throw new Error(`No session for ${user} on ${base}. Create it once with:\n  node tests/harness/session.mjs ${user} --base-url ${base}`);
  const t0 = Date.now(); let said = false;
  for (;;) {
    for (const n of slots) {
      const rel = tryLock(masterProfile(user, base, n));
      if (rel) return { slot: n, release: rel, profile: masterProfile(user, base, n) };
    }
    if (!said) { log(`all ${slots.length} session slot(s) of ${user} busy, waiting …`); said = true; }
    if (Date.now() - t0 > timeoutMs) throw new Error('timed out waiting for a free session slot');
    await sleep(2000 + Math.random() * 2000);
  }
}

// ------------------------------------------------------------------ browser
let chromeWrapper = null;
function browserExecutable() {
  const want = process.env.TL_BROWSER || 'auto';
  if (want === 'chromium') return undefined;
  if (chromeWrapper) return chromeWrapper;
  const ok = spawnSync('flatpak', ['info', 'com.google.Chrome'], { stdio: 'ignore' }).status === 0;
  if (!ok) { if (want === 'flatpak') throw new Error('Chrome flatpak not installed'); return undefined; }
  // flatpak Chrome has a private /tmp: give it access to .state (profiles + run dirs live there)
  const dir = path.join(STATE, 'bin'); fs.mkdirSync(dir, { recursive: true });
  chromeWrapper = path.join(dir, 'chrome-flatpak.sh');
  const body = `#!/bin/bash\nexec flatpak run --branch=stable --arch=x86_64 --filesystem=${STATE} --command=/app/bin/chrome com.google.Chrome "$@"\n`;
  if (!fs.existsSync(chromeWrapper) || fs.readFileSync(chromeWrapper, 'utf8') !== body) {
    fs.writeFileSync(chromeWrapper + '.tmp' + process.pid, body, { mode: 0o755 });
    fs.renameSync(chromeWrapper + '.tmp' + process.pid, chromeWrapper);
  }
  return chromeWrapper;
}

const SKIP = new Set(['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'lockfile', 'LOCK', 'Crashpad', 'GrShaderCache',
  'GraphiteDawnCache', 'ShaderCache', 'component_crx_cache', 'extensions_crx_cache', 'Code Cache', 'GPUCache', 'DawnGraphiteCache', 'DawnWebGPUCache']);
function copyProfile(src, dst) {
  fs.cpSync(src, dst, {
    recursive: true, force: true, errorOnExist: false, verbatimSymlinks: true,
    filter: (s) => !SKIP.has(path.basename(s)),
  });
}

/**
 * Launch a browser context.
 *  user:   copy that user's master profile (null = fresh logged-out profile)
 *  master: operate on the master profile itself (session.mjs only)
 */
export async function launch({ user = null, base, slot = null, viewport = { width: 1440, height: 900 }, video = null, create = false,
  headless = process.env.TL_HEADED ? false : true, reducedMotion = 'no-preference', colorScheme = 'light' } = {}) {
  fs.mkdirSync(path.join(STATE, 'run'), { recursive: true, mode: 0o700 });
  const runDir = fs.mkdtempSync(path.join(STATE, 'run', `${user || 'anon'}-`));
  let profile = path.join(runDir, 'profile');
  let lock = null;
  if (user) {
    if (create) {   // session.mjs: create/refresh one specific slot
      profile = masterProfile(user, base, slot || 1);
      fs.mkdirSync(profile, { recursive: true, mode: 0o700 });
      const rel = tryLock(profile);
      if (!rel) throw new Error(`slot ${slot || 1} of ${user} is in use`);
      lock = { slot: slot || 1, release: rel };
    } else {
      lock = await acquireSlot(user, base, { slot });
      profile = lock.profile;
    }
    for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) fs.rmSync(path.join(profile, f), { force: true });
    log(`using ${user} session slot ${lock.slot}`);
  } else fs.mkdirSync(profile, { recursive: true });
  const ctx = await chromium.launchPersistentContext(profile, {
    executablePath: browserExecutable(), headless, viewport, deviceScaleFactor: 1,
    locale: 'en-GB', timezoneId: 'Europe/Berlin', colorScheme, reducedMotion,
    args: ['--no-first-run', '--no-default-browser-check', '--disable-features=Translate,MediaRouter', '--hide-scrollbars=false',
      '--password-store=basic', '--disable-background-timer-throttling'],
    ignoreDefaultArgs: ['--hide-scrollbars'],
    recordVideo: video ? { dir: path.join(runDir, 'video'), size: viewport } : undefined,
  });
  const page = ctx.pages()[0] || await ctx.newPage();
  page.setDefaultTimeout(20000);
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 400)); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + String(e.message || e).slice(0, 400)));
  const cleanup = async ({ keep = false } = {}) => {
    try { await ctx.close(); } catch { /* already closed */ }
    lock?.release();
    if (!keep && !process.env.TL_KEEP_RUN) fs.rmSync(runDir, { recursive: true, force: true });
  };
  return { ctx, page, runDir, consoleErrors, cleanup, slot: lock?.slot ?? null };
}

// ------------------------------------------------------------------ Element helpers
export function themeUrl(base, { theme, phase, hash = '' } = {}) {
  const u = new URL(base + '/');
  if (theme && theme !== 'element-default') u.searchParams.set('tl_theme', theme);
  if (phase) u.searchParams.set('tl_phase', phase);
  return u.toString() + (hash ? '#' + hash.replace(/^#/, '') : '');
}

/** Wait until Element is logged in, synced and showing the room list. */
export async function waitForApp(page, { timeout = 90000 } = {}) {
  // A crashed/killed earlier run leaves Element's cross-tab session lock behind -> "Element is open in another
  // window". We hold the exclusive slot lock, so taking over is safe.
  const t0 = Date.now();
  while (Date.now() - t0 < 20000) {
    if (await page.getByText(/Element is open in another window/).count().catch(() => 0)) {
      await page.getByRole('button', { name: 'Continue' }).first().click().catch(() => {});
      log('took over stale Element session lock');
      break;
    }
    if (await page.evaluate(() => !!window.mxMatrixClientPeg?.get?.()).catch(() => false)) break;
    await page.waitForTimeout(500);
  }
  await page.waitForFunction(() => {
    const peg = window.mxMatrixClientPeg?.get?.();
    return peg && peg.isInitialSyncComplete?.() && document.querySelector('.mx_LeftPanel, .mx_RoomListPanel');
  }, null, { timeout, polling: 500 });
  await page.waitForTimeout(800);
}

/** Close toasts/onboarding nags that would otherwise land in every screenshot (off camera). */
export async function dismissNags(page) {
  const NAG = /^(Dismiss|Not now|Later|No thanks|Close|Skip|Got it|OK|Ok|Ignore|Maybe later|Don't ask again)$/;
  for (let i = 0; i < 8; i++) {
    const btn = page.locator('.mx_Toast_toast, [class*="_toast_"], [data-radix-popper-content-wrapper], [role="dialog"]:not(.mx_Dialog)')
      .locator('button, [role="button"]').filter({ hasText: NAG, visible: true });
    if (!(await btn.count())) break;
    await btn.first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
}

/** Select a space in the space panel (Theme Lab by default) so the room list shows the fixtures. */
export async function selectSpace(page, spaceId) {
  await page.evaluate((sid) => window.mxSdkContext?.spaceStore?.setActiveSpace?.(sid), spaceId).catch(() => {});
  await page.waitForTimeout(700);
}

export async function closeOverlays(page) {
  for (let i = 0; i < 4; i++) {
    const open = await page.locator('.mx_Dialog, .mx_ContextualMenu, [role="menu"], [role="dialog"], .mx_EmojiPicker').count();
    if (!open) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }
}

export async function gotoRoom(page, roomId, { wait = true } = {}) {
  await page.evaluate((rid) => window.mxDispatcher.dispatch({ action: 'view_room', room_id: rid, metricsTrigger: undefined }), roomId);
  if (wait) {
    await page.waitForFunction((rid) => {
      const v = document.querySelector('.mx_RoomView');
      return v && location.hash.includes(rid) && document.querySelector('.mx_EventTile');
    }, roomId, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }
}

export async function setDeviceSetting(page, name, value) {
  // device level lives in this run's copied localStorage only; never touches account data
  await page.evaluate(([n, v]) => window.mxSettingsStore.setValue(n, null, 'device', v), [name, value]);
}
export async function getSetting(page, name) {
  return page.evaluate((n) => window.mxSettingsStore.getValue(n), name);
}

/** Make the page deterministic for screenshots: hide caret blink, freeze animated avatars, stop spinners mid-way. */
export async function stabilise(page) {
  await page.addStyleTag({ content: `
    *, *::before, *::after { caret-color: transparent !important; }
    .mx_RoomView_MessageList .mx_ReadReceiptGroup_container { transition: none !important; }
  ` }).catch(() => {});
}

export async function themeStatus(page, theme) {
  return page.evaluate((t) => ({
    tlTheme: document.documentElement.dataset.tlTheme || null,
    tlPhase: document.documentElement.dataset.tlPhase || null,
    wanted: t,
  }), theme);
}

export function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); return d; }

/** Load variant metadata (stage etc.) from themes/<family>/themes.json if present. */
export function variantMeta(id) {
  const tdir = path.join(ROOT, 'themes');
  if (!fs.existsSync(tdir)) return null;
  for (const fam of fs.readdirSync(tdir)) {
    const f = path.join(tdir, fam, 'themes.json');
    if (!fs.existsSync(f)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      const v = (j.variants || []).find((x) => x.id === id);
      if (v) return { family: j.family || fam, ...v };
    } catch { /* ignore broken manifest */ }
  }
  return null;
}

export function ffprobeDuration(file) {
  try { return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString()); }
  catch { return NaN; }
}
