#!/usr/bin/env node
// End-to-end checks of the room checker in a real Element against the seeded test stack.
//
//   pnpm e2e                      build, fresh stack (e2e/stack.sh reset), then these checks
//   node e2e/run.mjs [--headed]   the checks alone, against a freshly reset stack
//
// Every check drives the UI as alice and then asks the homeserver whether the change really
// happened. On a failure the page is saved to e2e/.run/results/. Exit code 1 if anything failed.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const HS = `http://127.0.0.1:${process.env.RC_HS_PORT ?? 18477}`;
const EL = `http://127.0.0.1:${process.env.RC_EL_PORT ?? 5807}`;
const ME = "@alice:rc.test";
const POLICY_TYPE = "de.datanauten.room_checker.policies";
const HISTORY_TYPE = "de.datanauten.room_checker.history";
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), ".run", "results");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ------------------------------------------------------------------ homeserver
const token = (
    await (
        await fetch(`${HS}/_matrix/client/v3/login`, {
            method: "POST",
            body: JSON.stringify({ type: "m.login.password", identifier: { type: "m.id.user", user: "alice" }, password: "alice-pass" }),
        })
    ).json()
).access_token;
if (!token) throw new Error(`Can't log in to ${HS}: is the stack up (e2e/stack.sh reset)?`);
async function api(method, p, body) {
    const res = await fetch(`${HS}/_matrix/client/v3/${p}`, { method, headers: { Authorization: `Bearer ${token}` }, body: body && JSON.stringify(body) });
    return res.ok ? res.json() : undefined;
}
const state = (roomId, type, key = "") => api("GET", `rooms/${encodeURIComponent(roomId)}/state/${type}/${encodeURIComponent(key)}`);
/** Room IDs by name, of the rooms alice is in. */
const ids = {};
for (const id of (await api("GET", "joined_rooms")).joined_rooms) {
    const name = (await state(id, "m.room.name"))?.name;
    if (name) ids[name] = id;
}

// ------------------------------------------------------------------ bookkeeping
let failed = 0;
function check(name, ok, detail) {
    console.log(`   ${ok ? "PASS" : "FAIL"} ${name}${detail !== undefined ? `  ${JSON.stringify(detail)}` : ""}`);
    if (!ok) failed++;
    return ok;
}
async function scenario(title, fn) {
    console.log(`\n${title}`);
    try {
        await fn();
    } catch (e) {
        check(`${title}: no exception`, false, String(e?.message ?? e).split("\n")[0]);
        await page.screenshot({ path: path.join(OUT, `${title.replace(/\W+/g, "-")}.png`) }).catch(() => {});
    }
}
/** Saved for a look at the UI, failures or not. */
const shot = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
const until = async (fn, ms = 10_000) => {
    const end = Date.now() + ms;
    for (;;) {
        const v = await fn().catch(() => undefined);
        if (v || Date.now() > end) return v;
        await new Promise((r) => setTimeout(r, 250));
    }
};

// ------------------------------------------------------------------ browser
const browser = await chromium.launch({ headless: !process.argv.includes("--headed") });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));
page.on("console", (m) => m.type() === "error" && /room-checker|room_checker/i.test(m.text()) && pageErrors.push(m.text()));

const panel = () => page.locator(".rc-panel");
const detail = () => page.getByTestId("room-checker-detail");
const row = (name) => page.locator(".rc-row").filter({ has: page.locator(".rc-room-name", { hasText: new RegExp(`^${name}$`) }) });
async function openChecker(space = "Acme") {
    if (!(await panel().count())) await page.keyboard.press("Alt+r");
    await panel().waitFor();
    await page.locator(".rc-space select").selectOption({ label: space });
    await page.locator(".rc-row").first().waitFor();
    // The rooms alice isn't in come from the server a moment later.
    await until(async () => (await row("Board").count()) > 0);
}
async function closeChecker() {
    if (await panel().count()) await page.keyboard.press("Escape");
    if (await panel().count()) await page.keyboard.press("Escape");
}

await page.goto(`${EL}/#/login`);
await page.locator("#mx_LoginForm_username").fill("alice");
await page.locator("#mx_LoginForm_password").fill("alice-pass");
await page.keyboard.press("Enter");
await page.locator(".mx_LeftPanel").waitFor({ timeout: 60_000 });
await page.waitForTimeout(3000);
await page.keyboard.press("Escape");

// ------------------------------------------------------------------ scenarios
await scenario("E1 overview of the seeded space", async () => {
    await openChecker();
    const tiles = Object.fromEntries(
        await page.locator(".rc-stat").evaluateAll((els) => els.map((e) => [e.querySelector(".rc-stat-label").textContent, Number(e.querySelector(".rc-stat-value").textContent)])),
    );
    check("7 rooms, 1 not joined, 1 passes everything", tiles.Rooms === 7 && tiles["Not joined"] === 1 && tiles["Pass everything"] === 1, tiles);
    const names = await page.locator(".rc-room-name").allTextContents();
    check("General passes and is listed last of the rooms alice is in", names.indexOf("General") > names.indexOf("random"), names);
    check("the version is in the footer", /v\d+\.\d+\.\d+/.test(await page.locator(".rc-version").textContent()));
});

await scenario("E2 a room alice isn't in is checked from the server's summary", async () => {
    await row("Board").click();
    const text = await detail().textContent();
    check("it says so", text.includes("these checks use what the server tells everyone"));
    check("unencrypted and public", text.includes("Not encrypted") && text.includes("Join rule is “Anyone”"));
    check("admins and the space link can't be checked", (await detail().getByText("Can't be checked without being in the room").count()) === 2);
    check("no fixes, only 'join first'", (await detail().getByText("Join the room to fix this.").count()) > 0 && !(await detail().getByRole("button", { name: /^Set to/ }).count()));
    await detail().getByRole("button", { name: /All rooms/ }).click();
});

await scenario("E3 writing a topic", async () => {
    await row("random").click();
    await detail().getByRole("button", { name: "Write a topic" }).click();
    await detail().getByRole("textbox").fill("Off-topic chat for the whole team");
    await detail().getByRole("button", { name: "Save" }).click();
    check("the server has the topic", await until(async () => (await state(ids.random, "m.room.topic"))?.topic === "Off-topic chat for the whole team"));
    check("the room is checked again", await until(async () => !(await detail().getByText("No topic").count())));
    await detail().getByRole("button", { name: /All rooms/ }).click();
});

await scenario("E4 one fix for many rooms", async () => {
    await page.locator(".rc-bar", { hasText: "Who can join" }).click();
    const bulk = page.getByTestId("room-checker-bulk");
    const offer = await bulk.textContent();
    check("it offers the fix and says what it skips", /Set to “Space members” in \d+ rooms/.test(offer) && /can't be fixed from here/.test(offer), offer);
    await bulk.getByRole("button", { name: /^Set to/ }).click();
    check("it lists the rooms first", (await bulk.locator("li").count()) > 0);
    await bulk.getByRole("button", { name: /^Change \d+ room/ }).click();
    await bulk.getByText(/Changed \d+ of \d+ rooms/).waitFor();
    const done = await bulk.textContent();
    check("every room it tried was changed", /Changed (\d+) of \1 rooms/.test(done), done);
    const rule = await state(ids.random, "m.room.join_rules");
    check("random is restricted to Acme's members", rule?.join_rule === "restricted" && rule.allow?.[0]?.room_id === ids.Acme, rule);
    check("Project X (bob's) was left alone", (await state(ids["Project X"], "m.room.join_rules"))?.join_rule === "public");
    await bulk.getByRole("button", { name: "Close" }).click();
    await page.locator(".rc-chip", { hasText: /^All$/ }).click();
});

await scenario("E5 accepting a failure, and taking it back", async () => {
    await row("Visitors").click();
    const guests = detail().locator("li", { hasText: "No guests" });
    await guests.getByRole("button", { name: /Accept for this room/ }).click();
    await guests.getByRole("textbox").fill("Open house, on purpose");
    await guests.getByRole("button", { name: "Accept" }).click();
    const saved = await until(async () => (await state(ids.Acme, POLICY_TYPE))?.exceptions?.[ids.Visitors]?.guest_access);
    check("the exception is in the space's state", saved?.reason === "Open house, on purpose" && saved.by === ME, saved);
    check("it shows as accepted", await until(async () => (await guests.getByText("Accepted", { exact: true }).count()) > 0));
    await guests.getByRole("button", { name: "Take back" }).click();
    check("taken back on the server", await until(async () => !(await state(ids.Acme, POLICY_TYPE))?.exceptions?.[ids.Visitors]));
    await detail().getByRole("button", { name: /All rooms/ }).click();
});

await scenario("E6 policies for the space, and their own for a sub-space", async () => {
    await page.getByRole("tab", { name: "Policies" }).click();
    await page.getByRole("switch", { name: "Picture" }).click();
    const member = page.locator(".rc-policy", { hasText: "Required member" });
    await member.getByRole("switch").click();
    await member.locator("input:not([type=checkbox])").fill("@carol:rc.test");
    await page.getByRole("button", { name: "Save to the space" }).click();
    const content = await until(async () => {
        const c = await state(ids.Acme, POLICY_TYPE);
        return c?.policies?.avatar?.enabled === false && c;
    });
    check("saved in Acme", content?.policies?.required_member?.user === "@carol:rc.test" && content?.policies?.required_member?.enabled, content?.policies?.required_member);

    await page.locator(".rc-space select").selectOption({ label: "Teams" });
    check("Teams says it uses Acme's", await until(async () => (await page.getByText(/its rooms use those of Acme/).count()) > 0));
    await page.locator(".rc-policy", { hasText: "Belongs to the space" }).getByRole("switch").click();
    await page.getByRole("button", { name: "Save to the space" }).click();
    check("Teams has its own now", await until(async () => (await state(ids.Teams, POLICY_TYPE))?.policies?.space_parent?.enabled === false));

    await page.locator(".rc-space select").selectOption({ label: "Acme" });
    await page.getByRole("tab", { name: "Policies" }).click();
    check("Acme names Teams as having its own", await until(async () => (await page.getByText(/policies of their own.*Teams/).count()) > 0));
    await page.getByRole("tab", { name: "Rooms" }).click();
    await until(async () => (await row("Board").count()) > 0);
    await row("Team Berlin").click();
    check("Team Berlin is checked against Teams'", (await detail().getByText("Checked against the policies of Teams").count()) === 1);
    check("…which don't ask for the space link", !(await detail().locator("li", { hasText: "Belongs to the space" }).count()));
    await shot("rooms-with-detail");
    await detail().getByRole("button", { name: /All rooms/ }).click();
});

await scenario("E7 inviting a required member", async () => {
    // carol is in General already, not in random.
    await row("random").click();
    await detail().getByRole("button", { name: "Invite @carol:rc.test" }).click();
    check("carol is invited on the server", await until(async () => (await state(ids.random, "m.room.member", "@carol:rc.test"))?.membership === "invite"));
    check("the check says she hasn't joined yet", await until(async () => (await detail().getByText("@carol:rc.test is invited, but hasn't joined yet").count()) > 0));
});

await scenario("E8 a space alice can't change", async () => {
    await page.locator(".rc-space select").selectOption({ label: "Camp" });
    await page.getByRole("tab", { name: "Policies" }).click();
    await shot("policies-read-only");
    check("read-only", (await page.getByText(/Only people who may change/).count()) === 1 && (await page.getByRole("switch", { name: "Picture" }).isDisabled()));
    check("no save button", !(await page.getByRole("button", { name: "Save to the space" }).count()));
    await page.getByRole("tab", { name: "Rooms" }).click();
});

await scenario("E9 history in account data", async () => {
    const history = await until(async () => (await api("GET", `user/${encodeURIComponent(ME)}/account_data/${HISTORY_TYPE}`))?.spaces?.[ids.Acme]);
    const today = history?.[0];
    check("one snapshot of Acme, from today", history?.length === 1 && new Date(today.at).toDateString() === new Date().toDateString(), history?.length);
    // Acme: 6 rooms alice is in plus Board; Team Berlin and the others still fail something.
    check("of Acme's rooms, not another space's", today?.joined === 6 && today.failing.length >= 4, { joined: today?.joined, failing: today?.failing.length });
});

await scenario("E10 report", async () => {
    await openChecker();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download CSV" }).click()]);
    const csv = fs.readFileSync(await download.path(), "utf8").trim().split("\n");
    check("CSV: a header and a row per room", csv.length === 8 && csv[0].startsWith("Room,room_id,joined,errors,warnings"), csv[0]);
    check("named after the space and date", /^room-check-Acme-\d{4}-\d\d-\d\d\.csv$/.test(download.suggestedFilename()), download.suggestedFilename());
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.getByRole("button", { name: "Copy as Markdown" }).click();
    const md = await page.evaluate(() => navigator.clipboard.readText());
    check("Markdown report copied", md.startsWith("## Room check: Acme") && md.includes("- **"), md.split("\n")[0]);
    await closeChecker();
});

await scenario("E11 the badge in a failing room's header", async () => {
    await page.goto(`${EL}/#/room/${ids.Visitors}`);
    const badge = page.locator(".rc-badge");
    check("shown to alice (an admin of Acme)", await until(async () => (await badge.count()) === 1));
    await shot("room-header-badge");
    check("it says how many fail", /^\d+ room policy failures \(Acme\)/.test((await badge.getAttribute("aria-label")) ?? ""), await badge.getAttribute("aria-label"));
    await badge.click();
    await detail().waitFor();
    check("it opens the checker on that room", (await detail().locator(".rc-detail-name").textContent()) === "Visitors");
    await closeChecker();
    await page.goto(`${EL}/#/room/${ids["Camp orga"]}`);
    await page.waitForTimeout(1500);
    check("none in a room of a space alice can't change", !(await badge.count()));
});

await scenario("E12 no errors from the module", async () => {
    check("no page errors", pageErrors.length === 0, pageErrors.slice(0, 3));
});

await browser.close();
console.log(`\n${failed ? `${failed} check(s) FAILED (screenshots in ${OUT})` : "All checks passed"}`);
process.exit(failed ? 1 : 0);
