// Live e2e against a real ESS Pro deployment (tested with Element Web 1.12.29 "element-web-pro",
// MAS login), where the module is already deployed. Read-only towards the deployment; it only creates a room,
// a DM and the store widget with two test accounts you provide (fresh MAS users, see below).
//
//   MCM_ELEMENT=https://chat.example.com MCM_SERVER_NAME=example.com MCM_CREDS=/path/creds.env node e2e/live-ess.mjs [--headed]
//   MCM_LOCAL_DIST=1 … serves this checkout's dist/index.js in place of the deployed /marcade-module/index.js
//     creds.env (0600): USER_A=… PASS_A=… USER_B=… PASS_B=…   (localparts; A creates the room → PL100, B → PL0)
//   screenshots → docs/screenshots/ess-*.png, console + results → e2e/out/ess-*.{log,json}
//
// Fresh users, e.g.:  oc -n <ns> exec <mas pod> -- mas-cli manage register-user -y -p <pw> -d "MTest A" mtest-a-<rnd>
//
// Scenarios:
//  1. load: module loads once (duplicate entry → "already loaded, skipping duplicate"), Pro modules' console output
//  2. A creates a room, invites B, B joins (PL 100 / 0)
//  3. (c) B clicks Apps before the store exists → moderator dialog with /addwidget, nothing written
//  4. (b) A clicks Apps → state event like /addwidget, store in the right panel, iframe renders, no consent prompt
//  5. second click closes, Enter toggles
//  6. (a) B opens the existing store, no consent / "Continue" prompt
//  7. coexistence: header buttons, approver conflicts, DM shows the button (show_in_dms default)
//  8. light + dark header screenshots
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.resolve(HERE, "../docs/screenshots");
const OUT = path.join(HERE, "out");
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const ELEMENT = process.env.MCM_ELEMENT;
const SERVER = process.env.MCM_SERVER_NAME;
if (!ELEMENT || !SERVER) throw new Error("Set MCM_ELEMENT (Element Web URL) and MCM_SERVER_NAME (Matrix server name)");
const HEADED = process.argv.includes("--headed");
const STORE_PREFIX = "https://marcade.store/apps/de.minagawa.marcade-store/";
const LOG_TAG = "[marcade-element-module]";

const creds = Object.fromEntries(
  fs
    .readFileSync(process.env.MCM_CREDS ?? "", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const A = { user: creds.USER_A, pass: creds.PASS_A };
const B = { user: creds.USER_B, pass: creds.PASS_B };
if (!A.user || !A.pass || !B.user || !B.pass) throw new Error("MCM_CREDS needs USER_A, PASS_A, USER_B, PASS_B");
const mxid = (u) => `@${u}:${SERVER}`;

const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok: !!ok, extra: String(extra ?? "") });
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? ` — ${extra}` : ""}`);
};
const note = (name, extra) => {
  results.push({ name, ok: null, extra: String(extra ?? "") });
  console.log(`· ${name} — ${extra}`);
};

// ---------------------------------------------------------------- Element UI
/** Loads Element; reloads on the occasional "Your Element is misconfigured / Unexpected error" first-load race. */
async function gotoElement(page, hash) {
  for (let i = 0; i < 6; i++) {
    await page.goto(`${ELEMENT}/${hash}`, { waitUntil: "domcontentloaded" });
    const ok = page.locator(".mx_RoomHeader, .mx_RoomList, .mx_LeftPanel, .mx_AuthPage, .mx_Login_submit, .mx_Welcome").first();
    const bad = page.getByText(/Your Element is misconfigured|Unexpected error preparing the app/i).first();
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      if (await bad.isVisible().catch(() => false)) break;
      if (await ok.isVisible().catch(() => false)) return;
      await page.waitForTimeout(500);
    }
    console.log(`  (Element not ready, reload ${i + 1})`);
    await page.waitForTimeout(2500);
  }
  throw new Error("Element did not load");
}

/** Auto-dismiss Element's non-blocking nags for fresh accounts. */
async function installHandlers(page) {
  const toastBtn = page
    .locator(".mx_Toast_toast")
    .getByRole("button", { name: /^(dismiss|later|not now|skip|close|no thanks|ignore)$/i })
    .first();
  await page.addLocatorHandler(toastBtn, async () => {
    await toastBtn.click({ timeout: 2000 }).catch(() => {});
  }, { noWaitAfter: true });
  const verifyDlg = page
    .locator(".mx_Dialog")
    .filter({ hasText: /verify|recovery|notifications|confirm your digital identity/i })
    .getByRole("button", { name: /^(skip|later|not now|close|dismiss|cancel|i'll verify later|verify later|skip anyway)$/i })
    .first();
  await page.addLocatorHandler(verifyDlg, async () => {
    await verifyDlg.click({ timeout: 2000 }).catch(() => {});
  }, { noWaitAfter: true });
  // feature-announcement popovers ("Introducing Sections" in the room list)
  const announce = page.getByRole("dialog").filter({ hasText: /^Introducing / }).getByRole("button", { name: /^(Ok|Got it)$/i }).first();
  await page.addLocatorHandler(announce, async () => {
    await announce.click({ timeout: 2000 }).catch(() => {});
  }, { noWaitAfter: true });
}

async function login(page, u) {
  await gotoElement(page, "#/login");
  await page.getByRole("button", { name: /^Continue$/ }).click({ timeout: 30_000 });
  // MAS
  await page.waitForURL(/account\./, { timeout: 30_000 });
  await page.getByLabel(/username/i).fill(u.user);
  await page.getByLabel(/^password/i).fill(u.pass);
  await page.getByRole("button", { name: /^Continue$/ }).click();
  // consent "Continue to Element Pro?" (first login of a fresh user), possibly other MAS pages
  const deadline = Date.now() + 90_000;
  while (!page.url().startsWith(ELEMENT)) {
    if (Date.now() > deadline) throw new Error(`${u.user}: MAS flow stuck at ${page.url()}`);
    const cont = page.getByRole("button", { name: /^Continue$/ }).first();
    if (await cont.isVisible().catch(() => false)) await cont.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
  // back in Element: wait for the room list; on the misconfigured race reload
  const main = page.locator(".mx_RoomList, .mx_LeftPanel").first();
  const until = Date.now() + 120_000;
  let reloads = 0;
  while (!(await main.isVisible().catch(() => false))) {
    if (Date.now() > until) throw new Error(`${u.user}: Element did not come up after login`);
    if (await page.getByText(/Your Element is misconfigured|Unexpected error preparing the app/i).first().isVisible().catch(() => false)) {
      await page.waitForTimeout(2500);
      if (reloads++ < 5) await page.reload({ waitUntil: "domcontentloaded" });
    }
    // second login of the same account: "Confirm your digital identity" → close it (×) like a user who verifies
    // later, never "Can't confirm?" (that resets the identity)
    const x = page.locator(".mx_CompleteSecurity_skip");
    if (await x.isVisible().catch(() => false)) await x.click().catch(() => {});
    // fresh account: skip the identity / key setup screens like a user who does it later
    const skip = page.locator(".mx_AuthPage, .mx_Dialog").getByRole("button", { name: /^(skip|skip anyway|i'll verify later|verify later|later|not now)$/i }).first();
    if (await skip.isVisible().catch(() => false)) await skip.click().catch(() => {});
    await page.waitForTimeout(700);
  }
  await page.waitForFunction(() => !!window.mxMatrixClientPeg?.get?.()?.getUserId?.(), null, { timeout: 60_000 });
  await page.waitForTimeout(2000);
}

async function openRoom(page, roomId) {
  await page.goto(`${ELEMENT}/#/room/${roomId}`, { waitUntil: "domcontentloaded" });
  await page.locator(".mx_RoomHeader").waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1500);
}
const appsButton = (page) => page.locator(".mx_RoomHeader").getByTestId("marcade-apps-button");
const storeIframe = (page) => page.locator(`iframe[src^="${STORE_PREFIX}"]`).filter({ visible: true });
const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(SHOTS, `ess-${name}.png`), ...opts });

// Matrix calls through the logged-in client of a page (no extra tokens/devices)
const cl = (page, fn, arg) => page.evaluate(fn, arg);
const roomState = (page, roomId) => cl(page, (r) => window.mxMatrixClientPeg.get().roomState(r), roomId);
const widgetsOf = async (page, roomId) => (await roomState(page, roomId)).filter((e) => e.type === "im.vector.modular.widgets" && e.content?.url);
const waitInRoom = (page, roomId, membership = "join") =>
  page.waitForFunction(([r, m]) => window.mxMatrixClientPeg.get().getRoom(r)?.getMyMembership() === m, [roomId, membership], { timeout: 30_000 });

// ---------------------------------------------------------------- run
const browser = await chromium.launch({ headless: !HEADED });
const mkCtx = () => browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-US", colorScheme: "light" });
const [ctxA, ctxB] = [await mkCtx(), await mkCtx()];
const a = await ctxA.newPage();
const b = await ctxB.newPage();
const logs = { a: [], b: [] };
for (const [k, p] of [["a", a], ["b", b]]) {
  p.on("console", (m) => logs[k].push(`${m.type()}: ${m.text()}${m.type() === "error" && m.location()?.url ? ` @ ${m.location().url}` : ""}`));
  p.on("pageerror", (e) => logs[k].push(`pageerror: ${e.message}`));
  p.on("response", (r) => {
    if (r.status() >= 400) logs[k].push(`http ${r.status()}: ${r.url()}`);
  });
}
for (const p of [a, b]) await installHandlers(p);
// MCM_LOCAL_DIST=1: serve this checkout's dist/index.js instead of the deployed module (test a fix before deploying)
if (process.env.MCM_LOCAL_DIST)
  for (const ctx of [ctxA, ctxB])
    await ctx.route(/\/marcade-module\/index\.js(\?.*)?$/, (r) =>
      r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(path.resolve(HERE, "../dist/index.js")) }),
    );
let failed = false;
let ROOM, DM;

try {
  // 1. load
  await login(a, A);
  await login(b, B);
  const all = [...logs.a, ...logs.b];
  const loadedA = logs.a.filter((l) => l.includes(`${LOG_TAG} loaded`)).length;
  const dupA = logs.a.filter((l) => l.includes("already loaded, skipping duplicate")).length;
  check("1 module loaded once per page load", loadedA >= 1 && dupA >= 1 && dupA === loadedA, `loaded ${loadedA}×, duplicate-skips ${dupA}×`);
  const ours = all.filter((l) => l.includes(LOG_TAG) && /^(error|warning|pageerror)/.test(l) && !l.includes("skipping duplicate"));
  check("1 no module errors/warnings from marcade (besides the duplicate skip)", ours.length === 0, ours.slice(0, 3).join(" | "));
  const proRe = /content.?scanner|fileshare|multiroom|postmessage|restricted.?guests|module/i;
  const pro = [...new Set(all.filter((l) => proRe.test(l) && !l.includes(LOG_TAG)))];
  note("1 module-related console lines", pro.join(" | ") || "none");
  const proErr = pro.filter((l) => /^(error|pageerror)/.test(l));
  check("1 no module errors from the Pro modules", proErr.length === 0, proErr.slice(0, 3).join(" | "));

  // 2. room
  const name = `Marcade ESS test ${new Date().toISOString().slice(0, 16)}`;
  ROOM = await cl(a, ([n, inv]) => window.mxMatrixClientPeg.get().createRoom({ name: n, preset: "private_chat", invite: [inv] }).then((r) => r.room_id), [name, mxid(B.user)]);
  await waitInRoom(b, ROOM, "invite");
  await cl(b, (r) => window.mxMatrixClientPeg.get().joinRoom(r), ROOM);
  await waitInRoom(b, ROOM);
  const pl = (await roomState(a, ROOM)).find((e) => e.type === "m.room.power_levels")?.content ?? {};
  const plA = pl.users?.[mxid(A.user)] ?? pl.users_default ?? 0;
  const plB = pl.users?.[mxid(B.user)] ?? pl.users_default ?? 0;
  const plWidget = pl.events?.["im.vector.modular.widgets"] ?? pl.state_default ?? 50;
  check("2 room created, B joined, A PL100 / B PL0", plA === 100 && plB === 0, `${ROOM}; A=${plA} B=${plB}, widgets need ${plWidget}`);

  // 3. (c) B
  await openRoom(b, ROOM);
  const btnB = appsButton(b);
  await btnB.waitFor({ timeout: 20_000 });
  const box = await btnB.boundingBox();
  check("3 Apps button in B's header (32px, label, tooltip)", box?.width === 32 && box?.height === 32 && (await btnB.getAttribute("aria-label")) === "Apps", `${box?.width}×${box?.height}, title "${await btnB.getAttribute("title")}"`);
  check("3 (c) looks disabled for B", (await btnB.getAttribute("aria-disabled")) === "true");
  await btnB.click({ force: true });
  const line = b.getByTestId("marcade-addwidget-line");
  await line.waitFor({ timeout: 10_000 });
  const text = (await line.textContent()) ?? "";
  check("3 (c) moderator dialog with the /addwidget line", text.startsWith(`/addwidget ${STORE_PREFIX}`) && (await b.locator(".mx_Dialog").getByText(/moderators/i).count()) > 0, text.slice(0, 90));
  await shot(b, "c-moderator-dialog");
  await b.locator(".mx_Dialog").getByRole("button", { name: /^Close$/ }).first().click();
  await b.waitForTimeout(1000);
  check("3 (c) nothing written", (await widgetsOf(b, ROOM)).length === 0);

  // 4. (b) A
  await openRoom(a, ROOM);
  const btnA = appsButton(a);
  await btnA.waitFor({ timeout: 20_000 });
  check("4 (b) enabled for A", (await btnA.getAttribute("aria-disabled")) === null);
  await btnA.click();
  await storeIframe(a).waitFor({ timeout: 30_000 });
  const ws = await widgetsOf(a, ROOM);
  const c = ws[0]?.content ?? {};
  check(
    "4 (b) one im.vector.modular.widgets state event like /addwidget",
    ws.length === 1 && c.type === "m.custom" && c.name === "Marcade Store" && c.creatorUserId === mxid(A.user) && c.id === ws[0].state_key && /^marcade_store_\d+$/.test(c.id) && JSON.stringify(c.data) === "{}" && c.url.startsWith(`${STORE_PREFIX}0.1.1/#/?theme=$org.matrix.msc2873.client_theme`) && c.url.includes("roomId=$matrix_room_id"),
    `state_key ${ws[0]?.state_key} content ${JSON.stringify(c)}`,
  );
  check("4 (b) no io.element.widgets.layout written", !(await roomState(a, ROOM)).some((e) => e.type === "io.element.widgets.layout"));
  await a.waitForTimeout(5000);
  check("4 (b) store open in the right panel", (await a.locator(".mx_RightPanel iframe, .mx_WidgetCard").count()) > 0 && (await storeIframe(a).isVisible()), (await storeIframe(a).getAttribute("src"))?.slice(0, 90));
  check("4 (b) no capability consent prompt", (await a.locator(".mx_WidgetCapabilitiesPromptDialog").count()) === 0);
  check("4 (b) no 'Continue' preload prompt", (await a.locator(".mx_AppPermission").count()) === 0);
  check("4 aria-pressed while open", (await btnA.getAttribute("aria-pressed")) === "true");
  const frame = a.frameLocator(`iframe[src^="${STORE_PREFIX}"]`);
  const storeText = await frame.locator("body").innerText({ timeout: 20_000 }).catch(() => "");
  check("4 store UI rendered in the iframe", storeText.trim().length > 0, storeText.replace(/\s+/g, " ").slice(0, 120));
  await a.waitForTimeout(1500);
  await shot(a, "b-added-right-panel");
  // the store may brand its own event afterwards (name/icon) — note what is in the room now
  note("4 widget event after the store connected", JSON.stringify((await widgetsOf(a, ROOM)).map((e) => e.content.name)));

  // 5. toggle + keyboard
  await btnA.click();
  await a.waitForTimeout(1500);
  check("5 second click closes the panel", (await storeIframe(a).count()) === 0 && (await btnA.getAttribute("aria-pressed")) === "false");
  // reopening after a close: the room's right panel card is still the widget card at this point
  await btnA.click();
  await storeIframe(a).waitFor({ timeout: 15_000 }).catch(() => {});
  check("5 third click reopens the store", await storeIframe(a).isVisible().catch(() => false));
  await btnA.focus();
  await a.keyboard.press("Enter");
  await a.waitForTimeout(1500);
  check("5 Enter on the focused button closes", (await storeIframe(a).count()) === 0);
  await btnA.focus();
  await a.keyboard.press("Enter");
  await storeIframe(a).waitFor({ timeout: 15_000 }).catch(() => {});
  check("5 Enter on the focused button opens", await storeIframe(a).isVisible().catch(() => false));
  await btnA.focus();
  await a.keyboard.press("Enter");
  await a.waitForTimeout(1500);
  check("5 still exactly one store widget", (await widgetsOf(a, ROOM)).length === 1);

  // 6. (a) B
  await b.waitForTimeout(1500);
  check("6 (a) B's button enabled once the store exists", (await btnB.getAttribute("aria-disabled")) === null);
  await btnB.click();
  await storeIframe(b).waitFor({ timeout: 20_000 });
  await b.waitForTimeout(4000);
  check("6 (a) store open in B's right panel", await storeIframe(b).isVisible());
  check("6 (a) no 'Continue' preload prompt", (await b.locator(".mx_AppPermission").count()) === 0);
  check("6 (a) no capability consent prompt", (await b.locator(".mx_WidgetCapabilitiesPromptDialog").count()) === 0);
  const storeTextB = await b.frameLocator(`iframe[src^="${STORE_PREFIX}"]`).locator("body").innerText({ timeout: 20_000 }).catch(() => "");
  check("6 (a) store UI rendered for B", storeTextB.trim().length > 0, storeTextB.replace(/\s+/g, " ").slice(0, 120));
  check("6 still one widget", (await widgetsOf(b, ROOM)).length === 1);
  await shot(b, "a-open-existing");
  await btnB.click();

  // 7. coexistence
  const headerButtons = await a.locator(".mx_RoomHeader button, .mx_RoomHeader [role=button]").evaluateAll((els) =>
    els.map((e) => e.getAttribute("aria-label") || e.getAttribute("data-testid") || e.textContent?.trim() || e.className).filter(Boolean),
  );
  note("7 room header buttons (A)", headerButtons.join(", "));
  const approverWarn = [...logs.a, ...logs.b].filter((l) => /approver/i.test(l));
  check("7 no approver conflict warning (ours or others)", approverWarn.length === 0, approverWarn.slice(0, 3).join(" | ") || "none");
  await shot(a, "header-buttons", { clip: { x: 440, y: 0, width: 1000, height: 64 } });

  // DM: A ↔ B, marked in A's m.direct (like Element's own "Start chat")
  DM = await cl(a, (inv) => window.mxMatrixClientPeg.get().createRoom({ preset: "trusted_private_chat", is_direct: true, invite: [inv] }).then((r) => r.room_id), mxid(B.user));
  await cl(a, ([r, inv]) => {
    const c = window.mxMatrixClientPeg.get();
    const md = { ...(c.getAccountData("m.direct")?.getContent() ?? {}) };
    md[inv] = [...(md[inv] ?? []), r];
    return c.setAccountData("m.direct", md);
  }, [DM, mxid(B.user)]);
  await a.waitForTimeout(2000);
  await openRoom(a, DM);
  const isDm = await cl(a, (r) => Object.values(window.mxMatrixClientPeg.get().getAccountData("m.direct")?.getContent() ?? {}).flat().includes(r), DM);
  check("7 DM: Apps button shown (show_in_dms default true)", isDm && (await appsButton(a).count()) === 1, `in m.direct: ${isDm}`);
  await shot(a, "dm-header", { clip: { x: 440, y: 0, width: 1000, height: 64 } });

  // 8. light / dark
  await openRoom(a, ROOM);
  await appsButton(a).waitFor();
  const themeOf = () => a.evaluate(() => document.documentElement.className + " | " + [...document.querySelectorAll("link[rel=stylesheet]:not([disabled])")].map((l) => l.href.split("/").pop()).join(","));
  await a.mouse.move(0, 0);
  await a.getByRole("button", { name: /^Ok$/ }).first().click({ timeout: 2000 }).catch(() => {});
  await shot(a, "header-light", { clip: { x: 440, y: 0, width: 1000, height: 64 } });
  note("8 light theme", await themeOf());
  await cl(a, () => window.mxSettingsStore?.setValue("use_system_theme", null, "device", false));
  await cl(a, () => window.mxSettingsStore?.setValue("theme", null, "device", "dark"));
  await a.waitForTimeout(2500);
  const darkBg = await a.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await shot(a, "header-dark", { clip: { x: 440, y: 0, width: 1000, height: 64 } });
  const btnBg = await appsButton(a).evaluate((e) => getComputedStyle(e).color);
  check("8 dark theme applied", /rgb\((1\d|2\d|[0-9]),/.test(darkBg), `body ${darkBg}, button color ${btnBg}`);
  await shot(a, "dark-room");
  await cl(a, () => window.mxSettingsStore?.setValue("theme", null, "device", "light"));
} catch (e) {
  failed = true;
  console.error(e);
  await a.screenshot({ path: path.join(OUT, "ess-failure-a.png") }).catch(() => {});
  await b.screenshot({ path: path.join(OUT, "ess-failure-b.png") }).catch(() => {});
} finally {
  // leave the test rooms (both users)
  for (const p of [a, b])
    for (const r of [ROOM, DM].filter(Boolean)) await cl(p, (id) => window.mxMatrixClientPeg.get().leave(id), r).catch(() => {});
  fs.writeFileSync(path.join(OUT, "ess-console.log"), `--- A\n${logs.a.join("\n")}\n--- B\n${logs.b.join("\n")}\n`);
  fs.writeFileSync(path.join(OUT, "ess-results.json"), JSON.stringify({ room: ROOM, dm: DM, results }, null, 2));
  await browser.close();
}
const bad = results.filter((r) => r.ok === false);
const n = results.filter((r) => r.ok !== null).length;
console.log(`\n${n - bad.length}/${n} checks passed${failed ? " (aborted)" : ""}`);
process.exit(bad.length || failed ? 1 : 0);
