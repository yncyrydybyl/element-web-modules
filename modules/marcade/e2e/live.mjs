// Live e2e: real Element Web 1.12.30 with the module, against a throwaway Synapse (e2e/stack.sh up).
//   node e2e/live.mjs [--headed]        screenshots → e2e/out/*.png
//
// Checks:
//  1. the module loads and the Apps button sits in the room header (32px, aria-label, tooltip)
//  2. (c) bob (power level 0) in a room without the store: button looks disabled, click → dialog with /addwidget line
//  3. (b) alice (room admin): click → im.vector.modular.widgets state event like /addwidget, store opens in the
//     right panel, no capability prompt (widgetLifecycle approval)
//  4. second click closes the right panel again
//  5. (a) bob, store now in the room: click → right panel with the store, no "Continue" preload prompt
//  6. (d) without window.mxMatrixClientPeg: click → "/addwidget <url>" lands in the composer
//  7. keyboard: the button is reachable and Enter activates it
//  8. hide_integrations (second Element): Extensions card without "add", the Apps button still adds nothing twice
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "out");
fs.mkdirSync(OUT, { recursive: true });
const HS = process.env.MCM_HS ?? "http://127.0.0.1:18448";
let ELEMENT = process.env.MCM_ELEMENT ?? "http://127.0.0.1:5791";
const ELEMENT_HIDE = process.env.MCM_ELEMENT_HIDE ?? "http://127.0.0.1:5792";
const SERVER = "marcade.test";
const HEADED = process.argv.includes("--headed");
const mxid = (u) => `@${u}:${SERVER}`;
const STORE_PREFIX = "https://marcade.store/apps/de.minagawa.marcade-store/";

const results = [];
const check = (name, ok, extra = "") => {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? ` — ${extra}` : ""}`);
};

// ---------------------------------------------------------------- Matrix API
const tokens = {};
async function token(u) {
  if (tokens[u]) return tokens[u];
  const r = await fetch(`${HS}/_matrix/client/v3/login`, {
    method: "POST",
    body: JSON.stringify({ type: "m.login.password", identifier: { type: "m.id.user", user: u }, password: `${u}-pass`, initial_device_display_name: "e2e api" }),
  }).then((r) => r.json());
  if (!r.access_token) throw new Error(`login ${u}: ${JSON.stringify(r)}`);
  return (tokens[u] = r.access_token);
}
async function mx(u, method, p, body) {
  const res = await fetch(`${HS}/_matrix/client/v3${p}`, {
    method,
    headers: { Authorization: `Bearer ${await token(u)}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${u} ${method} ${p}: ${res.status} ${JSON.stringify(data)}`);
  return data;
}
const tag = new Date().toISOString().slice(11, 19).replaceAll(":", "");
async function room(name) {
  const { room_id } = await mx("alice", "POST", "/createRoom", { name: `${name} ${tag}`, preset: "private_chat", invite: [mxid("bob")] });
  await mx("bob", "POST", `/join/${encodeURIComponent(room_id)}`, {});
  return room_id;
}
const widgetsOf = async (roomId) =>
  (await mx("alice", "GET", `/rooms/${encodeURIComponent(roomId)}/state`)).filter((e) => e.type === "im.vector.modular.widgets" && e.content?.url);

// ---------------------------------------------------------------- Element UI
async function login(page, u) {
  await page.goto(`${ELEMENT}/#/login`);
  await page.locator("#mx_LoginForm_username").fill(u, { timeout: 60_000 });
  await page.locator("#mx_LoginForm_password").fill(`${u}-pass`);
  await page.locator("#mx_LoginForm_password").press("Enter");
  // a second login of the same account asks to confirm the identity (cross-signing was set up by the first):
  // skip it like a user who verifies later — never "Bestätigung nicht möglich?" (that resets the identity)
  const main = page.locator(".mx_RoomList, .mx_LeftPanel").first();
  const identity = page.locator(".mx_AuthPage, .mx_Dialog").filter({ hasText: /digitale Identität|confirm your digital identity/i }).first();
  const skip = /^(überspringen|skip|trotzdem überspringen|skip anyway|ich verifiziere später|verify later|später verifizieren)$/i;
  const deadline = Date.now() + 90_000;
  while (!(await main.isVisible().catch(() => false))) {
    if (Date.now() > deadline) throw new Error(`${u}: login stuck`);
    if (await identity.isVisible().catch(() => false)) {
      await page.locator(".mx_CompleteSecurity_skip").click().catch(() => {});
      for (const b of await page.locator(".mx_AuthPage, .mx_Dialog").getByRole("button", { name: skip }).all()) await b.click().catch(() => {});
    }
    await page.waitForTimeout(700);
  }
  await page.waitForTimeout(2000);
  await dismiss(page);
}
/** Closes the "set up recovery / verify / notifications" toasts and dialogs Element shows to fresh accounts. */
async function dismiss(page) {
  for (let i = 0; i < 4; i++) {
    let clicked = false;
    for (const b of await page
      .locator(".mx_Toast_toast, .mx_Dialog")
      .getByRole("button", { name: /^(dismiss|later|not now|skip|close|ok|got it|cancel|schließen|später)$/i })
      .all())
      if (await b.isVisible().catch(() => false)) clicked = !!(await b.click().then(() => true, () => false)) || clicked;
    if (!clicked) break;
    await page.waitForTimeout(500);
  }
}
async function openRoom(page, roomId) {
  await page.goto(`${ELEMENT}/#/room/${roomId}`);
  await page.locator(".mx_RoomHeader").waitFor({ timeout: 30_000 });
  await page.waitForTimeout(1000);
  await dismiss(page);
}
const appsButton = (page) => page.getByTestId("marcade-apps-button");
// (Element may render widget iframes in a PersistedElement container outside .mx_RightPanel)
const storeIframe = (page) => page.locator(`iframe[src^="${STORE_PREFIX}"]`).filter({ visible: true });
const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });

// ---------------------------------------------------------------- run
const ROOM_A = await room("Apps-Test");
const ROOM_B = await room("Composer-Test");
console.log(`rooms ${ROOM_A}, ${ROOM_B}`);

const browser = await chromium.launch({ headless: !HEADED });
const mkCtx = () => browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "de-DE", permissions: ["clipboard-read", "clipboard-write"] });
const [ctxA, ctxB] = [await mkCtx(), await mkCtx()];
const a = await ctxA.newPage();
const b = await ctxB.newPage();
const logs = { a: [], b: [] };
a.on("console", (m) => logs.a.push(`${m.type()}: ${m.text()}`));
b.on("console", (m) => logs.b.push(`${m.type()}: ${m.text()}`));
let failed = false;

try {
  await login(b, "bob");
  await openRoom(b, ROOM_A);
  // 1. loaded + rendered
  check("module loaded", logs.b.some((l) => l.includes("[marcade-element-module] loaded")));
  const btn = appsButton(b);
  await btn.waitFor({ timeout: 15_000 });
  const box = await btn.boundingBox();
  check("Apps button in the room header, 32px", (await b.locator(".mx_RoomHeader [data-testid=marcade-apps-button]").count()) === 1 && box?.width === 32 && box?.height === 32, `${box?.width}×${box?.height}`);
  check("aria-label / tooltip", (await btn.getAttribute("aria-label")) === "Apps" && /Marcade Store öffnen/.test((await btn.getAttribute("title")) ?? ""), `${await btn.getAttribute("aria-label")} / ${await btn.getAttribute("title")}`);

  // 2. (c) bob may not add apps
  check("(c) disabled look for a member without permission", (await btn.getAttribute("aria-disabled")) === "true");
  // aria-disabled only *looks* disabled: the button stays focusable and clickable (Playwright counts it as
  // disabled, hence force)
  await btn.click({ force: true });
  const line = b.getByTestId("marcade-addwidget-line");
  await line.waitFor({ timeout: 10_000 });
  const text = await line.textContent();
  check("(c) dialog with the /addwidget line", text?.startsWith(`/addwidget ${STORE_PREFIX}0.1.1/#/?`) && (await b.locator(".mx_Dialog").getByText(/Moderatoren/).count()) > 0, text);
  await shot(b, "c-moderator-dialog");
  await b.locator(".mx_Dialog").getByRole("button", { name: /Schließen|Close/ }).click();
  check("(c) nothing was added", (await widgetsOf(ROOM_A)).length === 0);

  // 3. (b) alice adds it
  await login(a, "alice");
  await openRoom(a, ROOM_A);
  const abtn = appsButton(a);
  await abtn.waitFor({ timeout: 15_000 });
  check("(b) enabled for the room admin", (await abtn.getAttribute("aria-disabled")) === null);
  await abtn.click();
  await storeIframe(a).waitFor({ timeout: 30_000 });
  const ws = await widgetsOf(ROOM_A);
  const c = ws[0]?.content ?? {};
  check(
    "(b) state event like /addwidget",
    ws.length === 1 && c.type === "m.custom" && c.name === "Marcade Store" && c.creatorUserId === mxid("alice") && c.id === ws[0].state_key && /^marcade_store_\d+$/.test(c.id) && c.url.startsWith(`${STORE_PREFIX}0.1.1/#/?theme=$org.matrix.msc2873.client_theme`),
    JSON.stringify(c),
  );
  check("(b) no io.element.widgets.layout written", !(await mx("alice", "GET", `/rooms/${encodeURIComponent(ROOM_A)}/state`)).some((e) => e.type === "io.element.widgets.layout"));
  await a.waitForTimeout(4000);
  check("(b) store opened in the right panel", await storeIframe(a).isVisible(), await storeIframe(a).getAttribute("src").then((s) => s?.slice(0, 80)));
  check("(b) no capability prompt (auto-approved)", (await a.locator(".mx_WidgetCapabilitiesPromptDialog").count()) === 0);
  check("button shows pressed while open", (await abtn.getAttribute("aria-pressed")) === "true");
  // the store connects over the Widget API: it shows its "Apps in this room" content once capabilities are granted
  const frame = a.frameLocator(`iframe[src^="${STORE_PREFIX}"]`);
  const storeText = await frame.locator("body").innerText({ timeout: 20_000 }).catch(() => "");
  check("store widget rendered", storeText.trim().length > 0, storeText.replace(/\s+/g, " ").slice(0, 100));
  await shot(a, "b-added-right-panel");

  // 4. toggle closes
  await abtn.click();
  await a.waitForTimeout(1000);
  check("second click closes the right panel", (await storeIframe(a).count()) === 0 && (await abtn.getAttribute("aria-pressed")) === "false");

  // 5. (a) bob opens the existing store
  await b.waitForTimeout(1500);
  check("(a) bob's button enabled once the store is in the room", (await btn.getAttribute("aria-disabled")) === null);
  await btn.click();
  await storeIframe(b).waitFor({ timeout: 20_000 });
  await b.waitForTimeout(3000);
  check("(a) right panel shows the store for bob", await storeIframe(b).isVisible());
  check("(a) no 'Continue' preload prompt", (await b.locator(".mx_AppPermission").count()) === 0);
  check("(a) no capability prompt", (await b.locator(".mx_WidgetCapabilitiesPromptDialog").count()) === 0);
  check("(c→a) still one widget", (await widgetsOf(ROOM_A)).length === 1);
  await shot(b, "a-open-existing");

  // 7. keyboard
  await btn.focus();
  await b.keyboard.press("Enter");
  await b.waitForTimeout(1000);
  check("keyboard: Enter toggles", (await storeIframe(b).count()) === 0);

  // 6. (d) composer fallback without client access
  await openRoom(a, ROOM_B);
  await a.evaluate(() => {
    delete window.mxMatrixClientPeg;
  });
  await appsButton(a).click();
  await a.waitForTimeout(1000);
  const composer = await a.locator(".mx_BasicMessageComposer_input").first().innerText();
  check("(d) /addwidget line in the composer", composer.trim().startsWith(`/addwidget ${STORE_PREFIX}0.1.1/`), composer.trim().slice(0, 70));
  check("(d) nothing sent", (await widgetsOf(ROOM_B)).length === 0);
  await shot(a, "d-composer-fallback");

  // 8. hide_integrations: compare the Extensions card in both Elements
  const addExtensions = async (page) => {
    await page.locator(".mx_RoomHeader").getByRole("button", { name: /^(Chat-Info|Room info)$/ }).last().click();
    await page.locator(".mx_RightPanel").getByRole("menuitem", { name: /^(Erweiterungen|Extensions)$/ }).click();
    await page.locator(".mx_ExtensionsCard").waitFor({ timeout: 10_000 });
    return page.locator(".mx_ExtensionsCard").getByRole("button", { name: /hinzufügen|^Add/ }).count();
  };
  await openRoom(a, ROOM_A);
  const withAdd = await addExtensions(a);
  await shot(a, "extensions-default");
  ELEMENT = ELEMENT_HIDE;
  const h = await (await mkCtx()).newPage();
  h.on("console", (m) => logs.a.push(`${m.type()}: ${m.text()}`));
  await login(h, "alice");
  await openRoom(h, ROOM_A);
  const withoutAdd = await addExtensions(h);
  check("hide_integrations hides the Extensions card's add button", withAdd > 0 && withoutAdd === 0, `default ${withAdd}, hidden ${withoutAdd}`);
  await shot(h, "extensions-hide-integrations");
  check("hide_integrations: Apps button still there", (await appsButton(h).count()) === 1);

  const errs = [...logs.a, ...logs.b].filter((l) => l.startsWith("error") && /marcade/i.test(l));
  check("no module errors in the console", errs.length === 0, errs.slice(0, 3).join(" | "));
} catch (e) {
  failed = true;
  console.error(e);
  await shot(a, "failure-alice").catch(() => {});
  await shot(b, "failure-bob").catch(() => {});
} finally {
  fs.writeFileSync(path.join(OUT, "console.log"), `--- alice\n${logs.a.join("\n")}\n--- bob\n${logs.b.join("\n")}\n`);
  await browser.close();
}
const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length}/${results.length} checks passed${failed ? " (aborted)" : ""}`);
process.exit(bad.length || failed ? 1 : 0);
