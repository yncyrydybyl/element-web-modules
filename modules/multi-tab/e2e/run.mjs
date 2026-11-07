#!/usr/bin/env node
// Multi-tab e2e runner. See e2e/README.md.
//
//   node e2e/run.mjs --stock                    harness self-test against stock Element (no module)
//   node e2e/run.mjs T1 T2 T3 T4                scenarios against Element with the module (default target: local stack)
//   node e2e/run.mjs all                        T1..T18 except the long T8 (add --long)
//   node e2e/run.mjs --tabs 10 --duration 120   chaos mode
//   options: --target local|bpc|bpc-live  --headed  --keep-going  --browser chromium|firefox|webkit
//            --t8-minutes N  --takeover-limit S (T17/T17b, default 50)
import fs from "node:fs";
import path from "node:path";
import { Harness, loadEnv, sleep, isSync, isForbidden, syncOverlaps, syncForks, UnsupportedError } from "./harness.mjs";

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const target = opt("target", "local");
const env = await loadEnv(target);
const headless = !flag("headed");
const browser = opt("browser", "chromium");
const RUN_ID = Date.now().toString(36);
const outRoot = path.join(path.dirname(new URL(import.meta.url).pathname), ".run", `results-${new Date().toISOString().replace(/[:.]/g, "-")}`);
fs.mkdirSync(outRoot, { recursive: true });

const plainRooms = env.rooms.filter((r) => !r.encrypted).map((r) => r.name);
const encRooms = env.rooms.filter((r) => r.encrypted).map((r) => r.name);
const pick = (list, k) => list[k % list.length];

// ------------------------------------------------------------------ result bookkeeping
class Result {
    constructor(id, title) {
        Object.assign(this, { id, title, checks: [], timings: {}, notes: [], ok: true, skipped: null });
    }
    check(name, ok, detail) {
        this.checks.push({ name, ok: !!ok, detail });
        if (!ok) this.ok = false;
        console.log(`   ${ok ? "PASS" : "FAIL"} ${name}${detail !== undefined ? `  ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`);
        return !!ok;
    }
    note(s) {
        this.notes.push(s);
        console.log(`   note: ${s}`);
    }
    time(k, ms) {
        this.timings[k] = ms;
    }
}

async function withHarness(r, opts, fn) {
    const h = new Harness({ env, headless, browser, outDir: path.join(outRoot, r.id), log: (m) => console.log(`   ${m}`), ...opts });
    try {
        await h.start({ peer: opts.peer ?? true, ctxConfigPatch: opts.ctxConfigPatch, ctxRoutes: opts.ctxRoutes, oauth: opts.oauth });
        await fn(h);
    } catch (e) {
        if (e instanceof UnsupportedError) {
            r.skipped = e.message;
            return;
        }
        r.check("scenario ran without exception", false, String(e?.stack ?? e).split("\n").slice(0, 4).join(" | "));
        for (const t of h.tabs) if (t.alive) await h.shot(t.i, `fail-${t.label}`);
    } finally {
        r.time("bootMs", Object.fromEntries(h.tabs.map((t) => [t.label, t.incarnations.map((i) => i.bootMs ?? null)])));
        r.roles = Object.fromEntries(h.tabs.map((t) => [t.label, t.incarnations.map((i) => i.role)]));
        r.console = h.console.filter((c) => /multi-tab/i.test(c.text) || c.type === "error").map((c) => `${c.tab}@${c.ts - h.t0}ms ${c.type}: ${c.text}`).slice(-200);
        r.stats = {};
        for (const i of h.openTabs()) r.stats[h.tabs[i].label] = (await h.mt(i))?.stats ?? null;
        await h.stop();
    }
}

/** Run fn on an existing live context ({h, a, b, from}) or in a fresh harness. */
const maybeHarness = (r, c, fn) =>
    c
        ? fn(c.h).catch((e) => r.check("scenario ran without exception", false, String(e?.stack ?? e).split("\n").slice(0, 3).join(" | ")))
        : withHarness(r, {}, fn);

/** Server-side invariants from the proxy log + per-tab request attribution, from `from` on. */
function invariants(r, h, from, { allowForks = true } = {}) {
    // Without a proxy (live deployment) the same check runs on what the tabs sent (with response end times).
    const log = h.env.proxy ? h.proxyLog({ from }) : h.tabRequests({ from }).filter((q) => q.end && q.origin === new URL(h.env.homeserver).origin);
    const overlaps = syncOverlaps(log);
    r.check(
        `I1 ${h.env.proxy ? "proxy" : "tabs"}: never two overlapping /sync requests for the session`,
        overlaps.length === 0,
        overlaps.length ? overlaps.slice(0, 3).map(([a, b]) => ({ a: [a.ts, a.end, a.since], b: [b.ts, b.end, b.since] })) : `${log.filter(isSync).length} /sync seen`,
    );
    const forks = syncForks(log);
    if (forks.length) (allowForks ? r.note.bind(r) : (m) => r.check("no since-forks", false, m))(`since tokens reused by >1 successful /sync: ${JSON.stringify(forks.slice(0, 3))}`);
    const mirrorSync = h.tabRequests({ from }).filter((q) => h.roleOf(q) === "mirror" && isSync(q));
    r.check("I1 tabs: no /sync left a mirror tab", mirrorSync.length === 0, mirrorSync.slice(0, 3));
    const mirrorForbidden = h.tabRequests({ from }).filter((q) => h.roleOf(q) === "mirror" && isForbidden(q));
    r.check("I2 tabs: no /keys, /sendToDevice, /room_keys, /dehydrated_device from a mirror", mirrorForbidden.length === 0, mirrorForbidden.slice(0, 5));
    const unknownRole = h.tabRequests({ from }).filter((q) => (isSync(q) || isForbidden(q)) && !["engine", "mirror"].includes(h.roleOf(q)));
    if (unknownRole.length) r.note(`${unknownRole.length} sync/crypto requests from tab incarnations with role ${[...new Set(unknownRole.map((q) => h.roleOf(q)))]}`);
    return { log, overlaps, forks };
}

async function expectRoles(r, h, want) {
    // want: {tabIndex: role}
    const deadline = Date.now() + 15_000;
    let got;
    while (Date.now() < deadline) {
        got = {};
        for (const i of Object.keys(want)) got[i] = await h.role(Number(i));
        if (Object.entries(want).every(([i, v]) => got[i] === v)) break;
        await sleep(250);
    }
    return r.check(`roles ${JSON.stringify(want)}`, Object.entries(want).every(([i, v]) => got[i] === v), got);
}

async function waitFor(fn, timeout = 20_000, every = 250) {
    const deadline = Date.now() + timeout;
    let v;
    while (Date.now() < deadline) {
        v = await fn().catch(() => undefined);
        if (v) return v;
        await sleep(every);
    }
    return v;
}

/** Wait for a message in every open tab; on failure record each tab's state (sync state, role, stats). */
async function everyTabGets(r, h, room, text, name) {
    const res = await Promise.all(
        h.openTabs().map(async (i) => {
            try {
                return [h.tabs[i].label, (await h.waitForMessage(i, room, text, { timeout: 40_000 })).ms];
            } catch {
                const st = await h.page(i).evaluate(() => {
                    const c = window.mxMatrixClientPeg?.get?.();
                    return { sync: c?.getSyncState?.(), token: c?.store?.getSyncToken?.() };
                }).catch((e) => ({ err: String(e).slice(0, 80) }));
                return [h.tabs[i].label, { missing: true, ...st, mt: await h.mt(i), screen: await h.screen(i).catch(() => "?") }];
            }
        }),
    );
    const o = Object.fromEntries(res);
    return r.check(name, res.every(([, v]) => typeof v === "number"), o);
}

const engineCount = async (h) => Object.values(await h.roles()).filter((x) => x === "engine").length;

// ------------------------------------------------------------------ stock self-test (no module)
async function STOCK(r) {
    const stockOpts = env.elementStock ? { element: env.elementStock } : { ctxConfigPatch: (j) => ({ ...j, modules: [] }) };
    await withHarness(r, stockOpts, async (h) => {
        const from = h.mark();
        const a = await h.openTab();
        r.check("injected session restores to the room list", (await h.screen(a)) === "roomlist");
        r.check("no module present (window.__multiTab undefined)", (await h.mt(a)) === null);
        const b = await h.openTab({ wait: false });
        const s = await waitFor(async () => ((await h.screen(b)) === "locked" ? "locked" : null), 30_000);
        r.check('second stock tab shows "Element is open in another window"', s === "locked", await h.screen(b));
        await h.shot(b, "stock-locked");
        const t1 = `stock-plain-${RUN_ID}`;
        await h.peerSend(pick(plainRooms, 1), t1);
        r.time("plainDeliveryMs", (await h.waitForMessage(a, pick(plainRooms, 1), t1)).ms);
        const t2 = `stock-enc-${RUN_ID}`;
        await h.peerSend(pick(encRooms, 0), t2);
        const w = await h.waitForMessage(a, pick(encRooms, 0), t2);
        r.check("peer's encrypted message decrypts in the tab", w.ev.encrypted, w.ev);
        r.time("encDeliveryMs", w.ms);
        const t3 = `stock-ui-${RUN_ID}`;
        await h.sendMessage(a, pick(encRooms, 0), t3);
        r.check("message sent from the tab UI decrypts at the peer", await h.peerSees(pick(encRooms, 0), t3));
        const dom = await h.readTimeline(a, pick(encRooms, 0));
        r.check("DOM timeline shows the plaintext", dom.some((d) => d.text === t2 && !d.utd), dom.slice(-3));
        const log = h.proxyLog({ from });
        r.check("proxy log records the session's /sync chain", log.filter(isSync).length > 2, `${log.length} requests, ${log.filter(isSync).length} /sync`);
        r.check("proxy log has a nextBatch for successful /sync", log.some((e) => isSync(e) && e.nextBatch));
        r.check("proxy: one /sync stream (stock, one tab)", syncOverlaps(log).length === 0);
        r.check("tab request recording sees the tab's /sync", h.tabRequests({ tab: a }).some(isSync));
    });
}

// ------------------------------------------------------------------ scenarios T1..T16
async function T1(r, h0) {
    const run = async (h) => {
        const from = h.mark();
        const a = await h.openTab({ label: "A" });
        const b = await h.openTab({ label: "B" });
        r.check("B shows the room list, not the lock screen", (await h.screen(b)) === "roomlist", await h.screen(b));
        await expectRoles(r, h, { [a]: "engine", [b]: "mirror" });
        await sleep(8000); // let a few long-polls happen
        invariants(r, h, from);
        r.check("B: no /sync request from B at all", h.tabRequests({ from, tab: b }).filter(isSync).length === 0);
        return { a, b, from };
    };
    if (h0) return run(h0);
    await withHarness(r, { peer: false }, run);
}

async function T2(r, c) {
    await maybeHarness(r, c, async (h) => {
        const { a, b, from } = c ?? (await T1(r, h));
        const room = pick(plainRooms, 2);
        const text = `t2-${RUN_ID}`;
        await h.peerSend(room, text);
        const [wa, wb] = await Promise.all([h.waitForMessage(a, room, text), h.waitForMessage(b, room, text)]);
        r.time("deliveryA", wa.ms);
        r.time("deliveryB", wb.ms);
        r.check("message appears in A and B within one long-poll", wa.ms < 35_000 && wb.ms < 35_000, { a: wa.ms, b: wb.ms });
        invariants(r, h, from);
    });
}

async function T3(r, c) {
    await maybeHarness(r, c, async (h) => {
        const { a, b, from } = c ?? (await T1(r, h));
        const room = pick(encRooms, 1);
        const text = `t3-${RUN_ID}`;
        await h.peerSend(room, text);
        const [wa, wb] = await Promise.all([h.waitForMessage(a, room, text), h.waitForMessage(b, room, text)]);
        r.check("A and B render the encrypted message as plaintext", wa.ev.encrypted && wb.ev.encrypted, { a: wa.ms, b: wb.ms });
        r.time("decryptA", wa.ms);
        r.time("decryptB", wb.ms);
        const dom = await h.readTimeline(b, room);
        r.check("B's DOM shows the plaintext", dom.some((d) => d.text === text && !d.utd), dom.slice(-2));
        r.check("B: zero /keys/* requests", h.tabRequests({ from, tab: b }).filter((q) => /\/keys\//.test(q.path)).length === 0);
        invariants(r, h, from);
    });
}

async function T4(r, c) {
    await maybeHarness(r, c, async (h) => {
        const { a, b, from } = c ?? (await T1(r, h));
        const room = pick(encRooms, 2);
        const text = `t4-${RUN_ID}`;
        const t = Date.now();
        await h.sendMessage(b, room, text);
        r.time("sendFromB", Date.now() - t);
        const wa = await h.waitForMessage(a, room, text);
        r.check("A shows B's message decrypted", wa.ev.encrypted, wa.ev);
        r.check("peer decrypts B's message", await h.peerSees(room, text));
        const sends = h.tabRequests({ from }).filter((q) => q.method === "PUT" && /\/send\/m\.room\.encrypted\//.test(q.path));
        r.check("PUT /send/m.room.encrypted came from B", sends.some((q) => q.tab === b) && !sends.some((q) => q.tab === a), sends.map((q) => q.tab));
        const claims = h.tabRequests({ from }).filter((q) => /\/keys\/claim|\/sendToDevice\//.test(q.path));
        r.check("any /keys/claim and /sendToDevice came from A", claims.every((q) => q.tab === a), claims.map((q) => [q.tab, q.path]));
        invariants(r, h, from);
    });
}

/** T5/T7 core: get rid of the engine, check promotion and re-attachment. how = close|kill|crash|freeze-kill */
async function promotionCase(r, how) {
    await withHarness(r, {}, async (h) => {
        const { a, b, from } = await T1(r, h);
        const t = Date.now();
        if (how === "close") await h.closeTab(a);
        else if (how === "crash") await h.crashTab(a);
        else if (how === "freeze-kill") {
            await h.freezeTab(a);
            await sleep(1000);
            await h.killTab(a);
        } else await h.killTab(a);
        const promoted = await waitFor(async () => (await h.role(b)) === "engine", 20_000, 200);
        r.time("promotionMs", Date.now() - t);
        r.check("B becomes the engine within 10 s", promoted && Date.now() - t < 10_000 + 1000, `${Date.now() - t} ms`);
        await h.waitForRoomList(b, { timeout: 60_000 }).catch(() => {});
        r.check("B reloaded exactly once", h.tabs[b].incarnations.length === 2, h.tabs[b].incarnations.map((i) => i.role));
        const syncFromB = await waitFor(async () => h.proxyLog({ from: t }).some(isSync) && h.tabRequests({ from: t, tab: b }).some(isSync), 20_000);
        r.check("a /sync from B reaches the server after promotion", syncFromB);
        const c = await h.openTab({ label: "C" });
        await expectRoles(r, h, { [b]: "engine", [c]: "mirror" });
        const room = pick(plainRooms, 4);
        const text = `${r.id}-${RUN_ID}`;
        await h.peerSend(room, text);
        const [wb, wc] = await Promise.all([h.waitForMessage(b, room, text), h.waitForMessage(c, room, text)]);
        r.check("B and C get new messages after the handover", true, { b: wb.ms, c: wc.ms });
        const enc = pick(encRooms, 3);
        const t2 = `${r.id}-enc-${RUN_ID}`;
        await h.peerSend(enc, t2);
        await Promise.all([h.waitForMessage(b, enc, t2), h.waitForMessage(c, enc, t2)]);
        r.check("encrypted messages decrypt in B (new engine) and C after the handover", true);
        invariants(r, h, from);
    });
}
const T5 = (r) => promotionCase(r, "close");
const T7 = (r) => (browser === "chromium" ? promotionCase(r, "freeze-kill") : void (r.skipped = `needs CDP (Page.setWebLifecycleState), not available in ${browser}`));

/** T5b: 4 tabs, kill the engine, exactly one promotion, no reload ping-pong. */
async function T5b(r) {
    await withHarness(r, {}, async (h) => {
        const from = h.mark();
        const tabs = [];
        for (const l of ["A", "B", "C", "D"]) tabs.push(await h.openTab({ label: l }));
        await expectRoles(r, h, { [tabs[0]]: "engine", [tabs[1]]: "mirror", [tabs[2]]: "mirror", [tabs[3]]: "mirror" });
        const before = Object.fromEntries(tabs.map((i) => [i, h.tabs[i].incarnations.length]));
        const t = Date.now();
        await h.crashTab(tabs[0]);
        await waitFor(async () => (await engineCount(h)) === 1, 20_000);
        r.time("promotionMs", Date.now() - t);
        await sleep(30_000); // watch for ping-pong
        const reloads = Object.fromEntries(tabs.slice(1).map((i) => [h.tabs[i].label, h.tabs[i].incarnations.length - before[i]]));
        const roles = await h.roles();
        r.check("exactly one engine among the remaining tabs", Object.values(roles).filter((x) => x === "engine").length === 1, roles);
        r.check("exactly one tab reloaded to promote", Object.values(reloads).filter((n) => n >= 1).length >= 1 && Object.values(reloads).reduce((s, n) => s + n, 0) <= 3, reloads);
        r.check("no reload ping-pong (no tab reloaded more than once)", Object.values(reloads).every((n) => n <= 1), reloads);
        const engines = h.tabs.flatMap((tb) => tb.incarnations.filter((i) => i.start >= t && i.role === "engine").map(() => tb.label));
        r.check("exactly one promotion (one new engine incarnation)", engines.length === 1, engines);
        const room = pick(plainRooms, 5);
        const text = `t5b-${RUN_ID}`;
        await h.peerSend(room, text);
        await everyTabGets(r, h, room, text, "all remaining tabs receive a new plain message");
        const enc = pick(encRooms, 5);
        await h.peerSend(enc, `${text}-enc`);
        await everyTabGets(r, h, enc, `${text}-enc`, "all remaining tabs decrypt a new encrypted message");
        invariants(r, h, from);
    });
}

async function T6(r) {
    await withHarness(r, { peer: false }, async (h) => {
        const { a, b } = await T1(r, h);
        const room = pick(plainRooms, 6);
        await h.openRoom(b, room);
        const draft = `draft-${RUN_ID}`;
        const composer = h.page(b).locator(".mx_SendMessageComposer [contenteditable='true'], .mx_BasicMessageComposer_input").first();
        await composer.click();
        await composer.pressSequentially(draft, { delay: 20 });
        await sleep(2500); // Element stores drafts (mx_cider_state_*) debounced
        await h.closeTab(a);
        await waitFor(async () => h.tabs[b].incarnations.length === 2 && (await h.role(b)) === "engine", 30_000);
        await h.waitForRoomList(b, { timeout: 60_000 });
        await h.openRoom(b, room);
        const text = await waitFor(async () => {
            const t = await composer.innerText();
            return t.includes(draft) ? t : null;
        }, 15_000);
        r.check("draft restored in B's composer after promotion reload", !!text, text);
    });
}

async function T8(r) {
    const minutes = Number(opt("t8-minutes", 6.5));
    await withHarness(r, {}, async (h) => {
        const from = h.mark();
        const a = await h.openTab({ label: "A" });
        const b = await h.openTab({ label: "B", initScript: IDB_WRITE_SPY });
        await expectRoles(r, h, { [a]: "engine", [b]: "mirror" });
        const end = Date.now() + minutes * 60_000;
        let n = 0;
        while (Date.now() < end) {
            const room = pick(plainRooms, n);
            await h.peerSend(room, `t8-${RUN_ID}-${n}`);
            await h.waitForMessage(b, room, `t8-${RUN_ID}-${n}`);
            n++;
            await sleep(20_000);
        }
        r.check("B still receives messages after the engine's store-save interval", true, `${n} messages`);
        r.check("B never reloaded (no resync)", h.tabs[b].incarnations.length === 1, h.tabs[b].incarnations.length);
        const spy = await h.page(b).evaluate(() => window.__e2eIdbSpy);
        r.check("I4: B never wrote the sync store (worker commands + IDB puts)", spy && spy.syncWrites === 0, spy);
        invariants(r, h, from);
    });
}

// Counts sync-store writes in a tab: commands posted to js-sdk's IndexedDB worker, and direct IDB puts in the window.
const IDB_WRITE_SPY = `(() => {
  const spy = (window.__e2eIdbSpy = { syncWrites: 0, commands: {}, puts: {} });
  const WRITE = new Set(["syncToDatabase", "clearDatabase", "setOutOfBandMembers", "clearOutOfBandMembers", "storeClientOptions", "saveToDeviceBatches", "removeToDeviceBatch"]);
  const pm = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function (msg, ...rest) {
    const c = msg && msg.command;
    if (c) { spy.commands[c] = (spy.commands[c] || 0) + 1; if (WRITE.has(c)) spy.syncWrites++; }
    return pm.call(this, msg, ...rest);
  };
  for (const m of ["put", "add", "delete", "clear"]) {
    const orig = IDBObjectStore.prototype[m];
    IDBObjectStore.prototype[m] = function (...a) {
      const db = this.transaction && this.transaction.db && this.transaction.db.name;
      if (db && /riot-web-sync|matrix-js-sdk:/.test(db) && !/crypto/.test(db)) { spy.syncWrites++; spy.puts[db + ":" + m] = (spy.puts[db + ":" + m] || 0) + 1; }
      return orig.apply(this, a);
    };
  }
})();`;

async function T9(r) {
    await withHarness(r, { peer: false }, async (h) => {
        const a = await h.openTab({ label: "A" });
        await expectRoles(r, h, { [a]: "engine" });
        // A different Element build in B: the module fingerprints `${module version}/${platform.getAppVersion()}`,
        // so B's platform reports another Element version (patched on the PlatformPeg before any module loads).
        const b = await h.openTab({ label: "B", wait: false, initScript: OTHER_BUILD });
        const s = await waitFor(async () => ((await h.screen(b)) === "locked" ? "locked" : null), 30_000);
        r.check("B (different build) gets Element's normal lock screen", s === "locked", { screen: await h.screen(b), role: await h.role(b) });
        r.check("A is still the engine and alive", (await h.role(a)) === "engine" && (await h.screen(a)) === "roomlist");
        r.check("B's module did not become a mirror", (await h.role(b)) !== "mirror", await h.mt(b));
    });
}

const OTHER_BUILD = `(() => {
  let peg;
  Object.defineProperty(window, "mxPlatformPeg", { configurable: true, get: () => peg, set(v) {
    peg = v;
    const get = v.get.bind(v);
    v.get = () => { const p = get(); if (p && !p.__e2eBuild) { p.__e2eBuild = true; p.getAppVersion = async () => "9.9.9-e2e-other-build"; } return p; };
  } });
})();`;

async function T10(r) {
    await withHarness(r, { peer: false }, async (h) => {
        const a = await h.openTab({ label: "A" });
        await expectRoles(r, h, { [a]: "engine" });
        const b = await h.openTab({ label: "B-nomodule", noModule: true, wait: false });
        const s = await waitFor(async () => ((await h.screen(b)) === "locked" ? "locked" : null), 30_000);
        r.check("same-origin tab without the module shows Element's own lock screen (I7)", s === "locked", await h.screen(b));
        const keys = await h.page(a).evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("react_sdk_session_lock")));
        r.check("session-lock keys exist (written by the engine's stock Element)", keys.length > 0, keys);
        r.check("A keeps running", (await h.screen(a)) === "roomlist");
    });
}

async function T11(r) {
    r.skipped = "needs a refreshable OAuth (MAS) session; injected compat tokens are not refreshed by Element. Run on BPC with an OAuth login.";
}

async function T12(r) {
    await withHarness(r, { peer: false }, async (h) => {
        const { b } = await T1(r, h);
        const from = h.mark();
        await h.page(b).evaluate(() => window.mxDispatcher?.dispatch({ action: "view_user_settings", initialTabId: "USER_ENCRYPTION_TAB" }));
        await sleep(1500);
        // Try to start a verification / reset from the tab: buttons differ by version, so click whatever is there.
        // v1.12.33's Encryption tab: "Export keys" calls exportRoomKeys, which a mirror cannot do.
        for (const n of ["Export keys", "Verify this device", "Set up recovery"]) {
            const btn = h.page(b).getByRole("button", { name: n });
            if (await btn.count()) {
                await btn.first().click({ timeout: 3000 }).catch(() => {});
                break;
            }
        }
        // The export dialog asks for a passphrase first; the crypto call happens on "Export".
        const pass = h.page(b).getByLabel("Enter passphrase");
        if (await pass.waitFor({ timeout: 5000 }).then(() => true, () => false)) {
            await pass.fill("e2e-passphrase-123");
            await h.page(b).getByLabel("Confirm passphrase").fill("e2e-passphrase-123");
            await h.page(b).getByRole("button", { name: "Export", exact: true }).click({ timeout: 3000 }).catch(() => {});
        }
        const toast = await waitFor(async () => /main (Element )?tab|Do this in your main/i.test(await h.page(b).evaluate(() => document.body.innerText)), 10_000);
        await h.shot(b, "t12");
        r.check('B shows "Do this in your main tab"', !!toast);
        const keys = h.tabRequests({ from, tab: b }).filter((q) => /\/keys\//.test(q.path));
        r.check("no /keys/* from B", keys.length === 0, keys.slice(0, 3));
    });
}

async function T13(r) {
    await withHarness(r, { peer: false }, async (h) => {
        const { a, b } = await T1(r, h);
        await h.page(b).evaluate(() => window.mxDispatcher?.dispatch({ action: "logout" }));
        const t = Date.now();
        // Exactly one tab shows Element's login, every other tab shows multi-tab's "signed out" notice; none is locked.
        const settled = await waitFor(async () => {
            const sc = { [a]: await h.screen(a).catch(() => "?"), [b]: await h.screen(b).catch(() => "?") };
            const v = Object.values(sc);
            return v.filter((x) => x === "login").length === 1 && v.filter((x) => x === "waiting").length === v.length - 1 ? sc : null;
        }, 45_000);
        const screens = { A: await h.screen(a).catch(() => "?"), B: await h.screen(b).catch(() => "?") };
        await h.shot(a, "t13-A-loggedout");
        await h.shot(b, "t13-B-loggedout");
        r.time("settleMs", Date.now() - t);
        r.check("after logout: exactly one tab shows the login, the other the signed-out notice", !!settled, screens);
        r.check("no tab shows Element's lock screen", !Object.values(screens).includes("locked"), screens);
        r.note(`roles after logout: A=${await h.role(a)} B=${await h.role(b)}`);
        await sleep(6000);
        const stray = h.proxyLog({ from: t + 5000 });
        r.check("no requests with the dead token 5 s after logout", stray.length === 0, stray.slice(0, 3).map((e) => [e.method, e.path, e.status]));
        if (!settled) return;
        if (target === "bpc" || target === "bpc-live") {
            // MAS (OIDC) has no Element password form; the logout half above is the part that runs there.
            r.note("re-login half: SKIP (MAS login)");
            return;
        }

        // Sign in again in the login tab: it must become the engine in place, the waiting tab must reload by itself and mirror it.
        const loginTab = Number(Object.entries(settled).find(([, v]) => v === "login")[0]);
        const waitingTab = loginTab === a ? b : a;
        const incLogin = h.tabs[loginTab].incarnations.length;
        const incWaiting = h.tabs[waitingTab].incarnations.length;
        const t2 = Date.now();
        await h.uiPasswordLogin(loginTab, env.users.main);
        await h.waitForRoomList(loginTab, { since: t2 });
        r.time("reloginMs", Date.now() - t2);
        const roleLogin = await waitFor(async () => ((await h.role(loginTab)) === "engine" ? "engine" : null), 30_000);
        r.check("login tab becomes the engine", roleLogin === "engine", await h.mt(loginTab));
        r.check("login tab did not reload", h.tabs[loginTab].incarnations.length === incLogin, h.tabs[loginTab].incarnations.length - incLogin);
        const mirrored = await waitFor(async () => h.tabs[waitingTab].incarnations.length > incWaiting && (await h.role(waitingTab)) === "mirror" && (await h.screen(waitingTab)) === "roomlist", 90_000, 500);
        r.time("waitingToMirrorMs", Date.now() - t2);
        await h.shot(waitingTab, "t13-waiting-after-relogin");
        await h.shot(loginTab, "t13-login-after-relogin");
        r.check("waiting tab reloads by itself and becomes a mirror with the room list", !!mirrored, {
            reloads: h.tabs[waitingTab].incarnations.length - incWaiting,
            role: await h.role(waitingTab),
            screen: await h.screen(waitingTab).catch(() => "?"),
        });
        // the new session belongs to the new login: log it out at the end of the run
        const tok = await h.page(loginTab).evaluate(() => window.mxMatrixClientPeg.get().getAccessToken());
        if (tok) (h.sessions ??= []).push({ accessToken: tok });
        const room = pick(plainRooms, 7);
        const text = `t13-relogin-${RUN_ID}`;
        const sentId = await h.page(loginTab).evaluate(async ({ rid, text }) => (await window.mxMatrixClientPeg.get().sendTextMessage(rid, text)).event_id, { rid: h.roomId(room), text });
        if (mirrored) r.check("the new mirror sees a message sent from the new engine", !!(await h.waitForMessage(waitingTab, room, text, { eventId: sentId }).catch(() => null)));
    });
}

async function T14(r) {
    // Stock warm boot baseline first (separate context on the stock origin).
    let stock = [];
    await withHarness(new Result("T14-baseline", ""), { peer: false, element: env.elementStock ?? env.element }, async (h) => {
        const a = await h.openTab();
        for (let k = 0; k < 3; k++) {
            const t = Date.now();
            await h.reloadTab(a);
            stock.push(Date.now() - t);
        }
    });
    await withHarness(r, { peer: false }, async (h) => {
        const { b, from } = await T1(r, h);
        const boots = [];
        for (let k = 0; k < 10; k++) {
            const t = Date.now();
            await h.reloadTab(b);
            boots.push(Date.now() - t);
            await expectRoles(r, h, { [b]: "mirror" });
        }
        const med = (xs) => [...xs].sort((x, y) => x - y)[Math.floor(xs.length / 2)];
        r.time("stockWarmBootMs", stock);
        r.time("mirrorBootMs", boots);
        r.check("mirror boot median < 1.5 x stock warm boot median", med(boots) < 1.5 * med(stock), { mirror: med(boots), stock: med(stock) });
        r.check("no resync reloads (11 incarnations for 10 reloads)", h.tabs[b].incarnations.length === 11, h.tabs[b].incarnations.length);
        invariants(r, h, from);
    });
}

async function T15(r) {
    const ss = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../speed-start/lib/index.js");
    if (!fs.existsSync(ss)) return void (r.skipped = `speed-start build missing at ${ss}`);
    const ctxConfigPatch = (j) => ({ ...j, modules: ["/modules/speed-start/index.js", ...(j.modules ?? [])] });
    const ctxRoutes = [[/\/modules\/speed-start\/index\.js(\?|$)/, (route) => route.fulfill({ path: ss, contentType: "text/javascript" })]];
    await withHarness(r, { peer: false, ctxConfigPatch, ctxRoutes }, async (h) => {
        const a = await h.openTab({ label: "A" });
        await h.reloadTab(a); // so a snapshot exists
        const b = await h.openTab({ label: "B", wait: false, initScript: OVERLAY_SPY });
        await h.waitForRoomList(b);
        const spy = await h.page(b).evaluate(() => window.__e2eOverlay);
        r.check("speed-start overlay appeared in B (mirror)", spy?.seen, spy);
        const gone = await waitFor(async () => !(await h.page(b).locator(".speed-start-snapshot").count()), 10_000);
        r.check("overlay handed over (gone within 10 s of Element's room list)", !!gone);
        await expectRoles(r, h, { [a]: "engine", [b]: "mirror" });
        r.note(`speed-start snapshot writes: B=${spy?.writes}`);
    });
}
const OVERLAY_SPY = `(() => {
  const s = (window.__e2eOverlay = { seen: false, writes: 0 });
  new MutationObserver(() => { if (document.querySelector(".speed-start-snapshot")) s.seen = true; }).observe(document, { subtree: true, childList: true });
  const set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { if (k === "de.datanauten.speed_start.snapshot") s.writes++; return set.call(this, k, v); };
})();`;

/** T16: the room key arrives after the message; B goes from UTD to plaintext without reloading. */
async function T16(r, c) {
    await maybeHarness(r, c, async (h) => {
        const { a, b, from } = c ?? (await T1(r, h));
        const room = pick(encRooms, 4);
        const rid = h.roomId(room);
        await h.openRoom(b, room);
        // Force a fresh Megolm session at the peer, and capture its room-key to-device messages.
        await h.peerPage.evaluate((rid) => window.mxMatrixClientPeg.get().getCrypto().forceDiscardSession(rid), rid);
        h.holdRoomKeys();
        const text = `t16-${RUN_ID}`;
        const eventId = await h.peerSend(room, text);
        r.check("peer's room key was held back", h.heldToDevice.length > 0, `${h.heldToDevice.length} to-device requests held`);
        const utdB = await waitFor(
            () => h.page(b).evaluate(({ rid, eventId }) => window.mxMatrixClientPeg.get().getRoom(rid)?.findEventById(eventId)?.isDecryptionFailure(), { rid, eventId }),
            30_000,
        );
        const utdA = await h.page(a).evaluate(({ rid, eventId }) => window.mxMatrixClientPeg.get().getRoom(rid)?.findEventById(eventId)?.isDecryptionFailure(), { rid, eventId });
        r.check("message is a UTD in A and B while the key is missing", utdB && utdA, { a: utdA, b: utdB });
        const incB = h.tabs[b].incarnations.length;
        const t = Date.now();
        r.note(`released ${await h.releaseRoomKeys()} to-device requests`);
        const [wa, wb] = await Promise.all([h.waitForMessage(a, room, text, { eventId, timeout: 60_000 }), h.waitForMessage(b, room, text, { eventId, timeout: 60_000 })]);
        r.time("lateKeyA", wa.ms);
        r.time("lateKeyB", wb.ms);
        r.check("A and B show the plaintext after the key arrives", true, { a: wa.ms, b: wb.ms, sinceRelease: Date.now() - t });
        r.check("B did not reload", h.tabs[b].incarnations.length === incB);
        const dom = await h.readTimeline(b, room);
        r.check("B's DOM shows the plaintext", dom.some((d) => d.text === text && !d.utd), dom.slice(-2));
        invariants(r, h, from);
    });
}

// ------------------------------------------------------------------ T17/T17b: frozen (not closed) engine
// The module's watchdog pings the engine every 15 s (5 s timeout, retry after 5 s); 3 misses -> takeover (~40 s worst
// case). A new tab's probe gives up after 45 s and takes over when the engine is of the same build.
const TAKEOVER_LIMIT_MS = Number(opt("takeover-limit", 50)) * 1000;
/** How long the old engine hangs in T17/T17b: past the limit, so the takeover can't wait for it to wake. */
const HANG_MS = TAKEOVER_LIMIT_MS + 20_000;
const needsCdp = (r) => (browser === "chromium" ? false : ((r.skipped = `needs CDP (Page.setWebLifecycleState), not available in ${browser}`), true));

/** Plain + encrypted message from the peer must reach every tab in `tabs` (explicit list: never wait in a frozen tab). */
async function deliverTo(r, h, tabs, tag) {
    for (const [room, kind] of [[pick(plainRooms, 8), "plain"], [pick(encRooms, 6), "encrypted"]]) {
        const text = `${tag}-${kind}-${RUN_ID}`;
        await h.peerSend(room, text);
        const got = await Promise.all(tabs.map((i) => h.waitForMessage(i, room, text, { timeout: 40_000 }).then((w) => w.ms, () => null)));
        r.check(`${kind} message reaches ${tabs.map((i) => h.tabs[i].label).join(", ")}`, got.every((x) => x !== null), Object.fromEntries(tabs.map((i, k) => [h.tabs[i].label, got[k]])));
    }
}

/** Wait until the hung old engine wakes, give it 15 s to notice it was replaced, then close it. It must not /sync any more. */
async function retireFrozen(r, h, a) {
    if (!h.tabs[a].alive) return;
    try {
        await h.unfreezeTab(a);
    } catch (e) {
        r.note(`wake-up failed: ${String(e.message).slice(0, 120)}`);
    }
    const t = Date.now();
    await sleep(15_000);
    const mtA = await h.mt(a);
    r.note(`old engine A 15 s after waking: ${JSON.stringify(mtA && { role: mtA.role, reason: mtA.reason })}, incarnations ${h.tabs[a].incarnations.length}`);
    const syncs = h.tabRequests({ from: t, tab: a }).filter(isSync);
    const late = syncs.filter((q) => q.ts >= t + 5000);
    if (syncs.length > late.length) r.note(`${syncs.length - late.length} /sync from A within the first 5 s after waking`);
    r.check("woken A sends no /sync 5-15 s after waking", late.length === 0, late.slice(0, 3).map((q) => ({ atMs: q.ts - t, inc: q.inc, since: q.since })));
    r.check("woken A is no longer an engine", mtA?.role !== "engine", mtA);
    await h.closeTab(a, "retired");
}

/** T17: A engine, B and C mirrors; A hangs (busy main thread) longer than the takeover may take. One of B/C must take over, the other mirror it. */
async function T17(r) {
    await withHarness(r, {}, async (h) => {
        const from = h.mark();
        const a = await h.openTab({ label: "A" });
        const b = await h.openTab({ label: "B" });
        const c = await h.openTab({ label: "C" });
        if (!(await expectRoles(r, h, { [a]: "engine", [b]: "mirror", [c]: "mirror" }))) throw new Error("roles not engine/mirror/mirror");
        const idA = (await h.mt(a))?.tabId;
        const incs = { [b]: h.tabs[b].incarnations.length, [c]: h.tabs[c].incarnations.length };
        await h.hangTab(a, HANG_MS);
        const t = Date.now();
        try {
            const winner = await waitFor(async () => {
                for (const i of [b, c]) if ((await h.role(i)) === "engine") return String(i);
                return null;
            }, TAKEOVER_LIMIT_MS + 30_000, 250);
            const ms = Date.now() - t;
            r.time("takeoverMs", winner ? ms : null);
            r.check(`a mirror takes over from the hung engine within ${TAKEOVER_LIMIT_MS / 1000} s`, !!winner && ms < TAKEOVER_LIMIT_MS, winner ? `${h.tabs[winner].label} after ${ms} ms` : "no engine among B/C");
            if (!winner) return;
            const w = Number(winner);
            const o = w === b ? c : b;
            await h.waitForRoomList(w, { timeout: 60_000 }).catch(() => {});
            r.check("new engine shows the room list", (await h.screen(w)) === "roomlist", await h.screen(w));
            const idW = (await h.mt(w))?.tabId;
            r.check("new engine is not the frozen tab's id", !!idW && idW !== idA, { idA, idW });
            // The other tab: a mirror with the room list whose tab list names the new engine (when tabs() exists).
            let last;
            const attached = await waitFor(async () => {
                const list = await h.mtTabs(o);
                last = { role: await h.role(o), screen: await h.screen(o), engineInList: list ? (list.find((x) => x.role === "engine")?.tabId ?? null) : "n/a" };
                return last.role === "mirror" && last.screen === "roomlist" && (!list || last.engineInList === idW);
            }, 60_000, 500);
            r.check(`${h.tabs[o].label} is a mirror of the new engine with the room list`, !!attached, { ...last, idW });
            r.time("attachMs", attached ? Date.now() - t : null);
            r.note(`reloads since the hang: B=${h.tabs[b].incarnations.length - incs[b]} C=${h.tabs[c].incarnations.length - incs[c]}`);
            await deliverTo(r, h, [w, o], "t17");
        } finally {
            await retireFrozen(r, h, a);
        }
        invariants(r, h, from);
    });
}

/** T17b: A engine alone, hung; a new tab D opens right away. D must take over instead of going "off". */
async function T17b(r) {
    // Firefox holds a new tab's navigation to a page under Element's service worker until the hung tab is free
    // (measured: 19 s for the rest of a 20 s hang; another origin loads at once), so D can't even load.
    if (browser === "firefox") return void (r.skipped = "Firefox doesn't load a new Element tab while another Element tab hangs");
    await withHarness(r, {}, async (h) => {
        const from = h.mark();
        const a = await h.openTab({ label: "A" });
        if (!(await expectRoles(r, h, { [a]: "engine" }))) throw new Error("A is not the engine");
        await h.hangTab(a, HANG_MS);
        const t = Date.now();
        try {
            const d = await h.openTab({ label: "D", wait: false });
            const seen = new Set();
            let last;
            const outcome = await waitFor(async () => {
                last = await h.mt(d);
                if (last?.role) seen.add(last.role);
                return last?.role === "engine" || last?.role === "off" ? last.role : null;
            }, TAKEOVER_LIMIT_MS + 30_000, 250);
            const ms = Date.now() - t;
            r.time("takeoverMs", outcome === "engine" ? ms : null);
            r.check(`new tab D takes over from the hung engine within ${TAKEOVER_LIMIT_MS / 1000} s`, outcome === "engine" && ms < TAKEOVER_LIMIT_MS, { outcome: outcome ?? "timeout", ms, last });
            r.check('D never reported role "off"', !seen.has("off"), [...seen]);
            if (outcome !== "engine") return;
            await h.waitForRoomList(d, { timeout: 60_000 }).catch(() => {});
            r.check("D shows the room list", (await h.screen(d)) === "roomlist", await h.screen(d));
            await deliverTo(r, h, [d], "t17b");
        } finally {
            await retireFrozen(r, h, a);
        }
        invariants(r, h, from);
    });
}

// ------------------------------------------------------------------ T18: open tabs in Preferences
const PREFS_PANEL = "#mx_tabpanel_USER_PREFERENCES_TAB";
const TABS_SECTION = `${PREFS_PANEL} #de-datanauten-multi-tab-tabs`;

async function openPreferences(h, i) {
    const page = h.page(i);
    await page.evaluate(() => window.mxDispatcher?.dispatch({ action: "view_user_settings", initialTabId: "USER_PREFERENCES_TAB" }));
    if (await page.locator(PREFS_PANEL).waitFor({ timeout: 5000 }).then(() => true, () => false)) return "dispatch";
    // UI path: user menu -> All settings -> Preferences
    await page.locator(".mx_UserMenu").first().click({ timeout: 10_000 });
    await page.getByRole("menuitem", { name: "All settings" }).click({ timeout: 10_000 });
    await page.getByRole("tab", { name: "Preferences" }).click({ timeout: 10_000 });
    await page.locator(PREFS_PANEL).waitFor({ timeout: 10_000 });
    return "ui";
}

const domTabRows = (h, i) =>
    h.page(i).evaluate(
        (sel) => [...document.querySelectorAll(`${sel} li[data-tab-id]`)].map((li) => ({ tabId: li.getAttribute("data-tab-id"), role: li.getAttribute("data-role"), isThis: li.getAttribute("data-this") === "true" })),
        TABS_SECTION,
    );
const normRows = (xs) => JSON.stringify((xs ?? []).map((x) => ({ tabId: x.tabId, role: x.role, isThis: !!x.isThis })).sort((p, q) => (p.tabId < q.tabId ? -1 : 1)));

async function T18(r) {
    await withHarness(r, { peer: false }, async (h) => {
        const from = h.mark();
        const a = await h.openTab({ label: "A" });
        const b = await h.openTab({ label: "B" });
        const c = await h.openTab({ label: "C" });
        if (!(await expectRoles(r, h, { [a]: "engine", [b]: "mirror", [c]: "mirror" }))) throw new Error("roles not engine/mirror/mirror");
        const ids = { A: (await h.mt(a))?.tabId, B: (await h.mt(b))?.tabId, C: (await h.mt(c))?.tabId };
        r.note(`opened Preferences in B via ${await openPreferences(h, b)}; tab ids ${JSON.stringify(ids)}`);
        const section = h.page(b).locator(TABS_SECTION);
        r.check("Preferences contains the open-tabs section", await section.waitFor({ timeout: 10_000 }).then(() => true, () => false));
        let rows = await waitFor(async () => {
            const x = await domTabRows(h, b);
            return x.length === 3 ? x : null;
        }, 15_000);
        rows ??= await domTabRows(h, b).catch(() => []);
        r.check("3 rows", rows.length === 3, rows);
        const engines = rows.filter((x) => x.role === "engine");
        r.check("exactly one engine row, and it is A", engines.length === 1 && engines[0].tabId === ids.A, { engines, A: ids.A });
        r.check("the other rows are mirrors", rows.filter((x) => x.role === "mirror").length === 2, rows.map((x) => x.role));
        r.check("rows are exactly A, B and C", normRows(rows.map((x) => ({ tabId: x.tabId }))) === normRows(Object.values(ids).map((tabId) => ({ tabId }))), { rows: rows.map((x) => x.tabId), ids });
        const mine = rows.filter((x) => x.isThis);
        r.check('only B\'s row has data-this="true"', mine.length === 1 && mine[0].tabId === ids.B, mine);
        const api = await h.mtTabs(b);
        r.check("__multiTab.tabs() returns the same list", normRows(api) === normRows(rows), { api, rows });
        await section.screenshot({ path: path.join(h.outDir, "t18-tabs.png") }).catch((e) => r.note(`screenshot failed: ${e.message.slice(0, 100)}`));

        await h.closeTab(c);
        const t = Date.now();
        const after = await waitFor(async () => {
            const x = await domTabRows(h, b);
            return x.length === 2 ? x : null;
        }, 10_000, 200);
        r.time("listUpdateMs", after ? Date.now() - t : null);
        r.check("after closing C the list shows 2 rows within 10 s", !!after && !after.some((x) => x.tabId === ids.C), after ?? (await domTabRows(h, b).catch(() => null)));
        if (after) r.check("__multiTab.tabs() matches after the close", normRows(await h.mtTabs(b)) === normRows(after), await h.mtTabs(b));
        await section.screenshot({ path: path.join(h.outDir, "t18-tabs-after-close.png") }).catch(() => {});
        invariants(r, h, from);
    });
}

// ------------------------------------------------------------------ chaos mode
async function CHAOS(r, nTabs, durationS) {
    await withHarness(r, {}, async (h) => {
        const from = h.mark();
        const rnd = (n) => Math.floor(Math.random() * n);
        for (let k = 0; k < nTabs; k++) await h.openTab({ label: `t${k}` });
        r.time("initialBootMs", h.tabs.map((t) => t.incarnations[0].bootMs));
        const sent = []; // {room, text, eventId, ts}
        let stopSending = false;
        const sender = (async () => {
            let n = 0;
            while (!stopSending) {
                const enc = n % 2 === 0;
                const room = enc ? pick(encRooms, rnd(encRooms.length)) : pick(plainRooms, rnd(plainRooms.length));
                const text = `chaos-${RUN_ID}-${n}-${enc ? "e" : "p"}`;
                try {
                    sent.push({ room, text, eventId: await h.peerSend(room, text), ts: Date.now() });
                } catch (e) {
                    r.note(`peer send failed: ${e.message.slice(0, 120)}`);
                }
                n++;
                await sleep(1500 + rnd(1500));
            }
        })();
        const actions = [];
        const end = Date.now() + durationS * 1000;
        while (Date.now() < end) {
            const open = h.openTabs();
            const roles = await h.roles();
            const engine = open.find((i) => roles[i] === "engine");
            const act = open.length < Math.max(2, nTabs - 3) ? "open" : ["close", "crash", "kill-engine", "open", "reload"][rnd(5)];
            const victim = act === "kill-engine" && engine !== undefined ? engine : open[rnd(open.length)];
            actions.push({ t: Date.now() - from, act, tab: h.tabs[victim]?.label, wasEngine: victim === engine });
            try {
                if (act === "open" && open.length < nTabs + 2) await h.openTab({ label: `t${h.tabs.length}`, wait: false });
                else if (act === "close") await h.closeTab(victim);
                else if (act === "crash" || act === "kill-engine") await h.crashTab(victim);
                else if (act === "reload") await h.page(victim).reload({ waitUntil: "domcontentloaded" });
            } catch (e) {
                r.note(`action ${act} failed: ${e.message.slice(0, 120)}`);
            }
            await sleep(3000 + rnd(5000));
        }
        stopSending = true;
        await sender;
        r.note(`actions: ${actions.map((x) => `${x.act}:${x.tab}${x.wasEngine ? "*" : ""}`).join(" ")}`);
        // Settle: every open tab must reach the room list and a role; exactly one engine.
        const stuck = [];
        for (const i of h.openTabs())
            await h.waitForRoomList(i, { timeout: 90_000 }).catch(async () =>
                stuck.push({
                    tab: h.tabs[i].label,
                    screen: await h.screen(i).catch(() => "?"),
                    mt: await h.mt(i),
                    sync: await h.page(i).evaluate(() => window.mxMatrixClientPeg?.get?.()?.getSyncState?.() ?? "no client").catch(() => "?"),
                    incarnations: h.tabs[i].incarnations.map((x) => x.role),
                    console: h.console.filter((c) => c.tab === i && /multi-tab/.test(c.text)).map((c) => `${c.ts - from}ms ${c.text}`).slice(-6),
                }),
            );
        r.check("no tab stuck (all open tabs reach the room list)", stuck.length === 0, stuck);
        const roles = await h.roles();
        r.check("exactly one engine at the end", Object.values(roles).filter((x) => x === "engine").length === 1, roles);
        r.check("all other tabs are mirrors", Object.values(roles).filter((x) => x === "mirror").length === h.openTabs().length - 1, roles);
        // Every message, in every tab, decrypted (scroll back if a gap pushed it out of the live timeline).
        const missing = {};
        for (const i of h.openTabs()) {
            const res = await h.page(i).evaluate(
                async ({ sent }) => {
                    const c = window.mxMatrixClientPeg?.get?.();
                    if (!c) return [{ text: "*", why: "no client" }];
                    const bad = [];
                    for (const s of sent) {
                        const room = c.getRoom(s.rid);
                        let ev = room?.findEventById(s.eventId);
                        for (let k = 0; !ev && room && k < 5; k++) {
                            await c.scrollback(room, 30);
                            ev = room.findEventById(s.eventId);
                        }
                        const deadline = Date.now() + 20000;
                        while (ev && (ev.isBeingDecrypted() || ev.isDecryptionFailure()) && Date.now() < deadline) await new Promise((r) => setTimeout(r, 250));
                        if (!ev) bad.push({ text: s.text, why: "missing" });
                        else if (ev.isDecryptionFailure()) bad.push({ text: s.text, why: "utd" });
                        else if (ev.getContent()?.body !== s.text) bad.push({ text: s.text, why: "body" });
                    }
                    return bad;
                },
                { sent: sent.map((s) => ({ ...s, rid: h.roomId(s.room) })) },
            );
            if (res.length) missing[h.tabs[i].label] = res;
        }
        r.check(`every tab shows all ${sent.length} messages decrypted`, Object.keys(missing).length === 0, Object.fromEntries(Object.entries(missing).map(([k, v]) => [k, v.slice(0, 5)])));
        const incs = h.tabs.flatMap((t) => t.incarnations.map((i) => ({ tab: t.label, role: i.role, bootMs: i.bootMs })));
        r.time("bootMsByRole", {
            engine: incs.filter((i) => i.role === "engine" && i.bootMs).map((i) => i.bootMs),
            mirror: incs.filter((i) => i.role === "mirror" && i.bootMs).map((i) => i.bootMs),
        });
        invariants(r, h, from);
    });
}

// ------------------------------------------------------------------ live: real chat.blackpony.club + MAS OAuth (T11)
async function LIVE() {
    const { cleanup } = await import("./bpc.mjs");
    const libFile = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../lib/index.js");
    const hash = (await import("node:crypto")).createHash("sha256").update(fs.readFileSync(libFile)).digest("hex").slice(0, 10);
    const modUrl = `/modules/multi-tab/index.js?v=${hash}`;
    const ctxConfigPatch = (j) => ({ ...j, modules: [...(j.modules ?? []), modUrl] });
    // --api-shim (experiment, not the shipped build): Element Pro on chat.blackpony.club runs module API 1.17, and
    // the module declares ^2.0.0, so Element refuses to start. The shim widens the declared range in the served bytes.
    let libBody = fs.readFileSync(libFile, "utf8");
    if (flag("api-shim")) libBody = libBody.replace(/moduleApiVersion = "\^2\.0\.0"/, 'moduleApiVersion = "^1.0.0 || ^2.0.0"');
    const ctxRoutes = [[/\/modules\/multi-tab\/index\.js(\?|$)/, (route) => route.fulfill({ body: libBody, contentType: "text/javascript" })]];
    const extraWait = Number(opt("ttl-margin", 90));
    const r = new Result("T11", TITLES.T11 + " (live chat.blackpony.club, MAS OAuth)");
    console.log(`\n== T11 live on ${env.element}: module ${modUrl}${flag("api-shim") ? " (API-range shim)" : ""}, user ${env.users.main.userId}`);
    if (flag("api-shim")) r.note("module served with moduleApiVersion widened to ^1.0.0 || ^2.0.0 (experiment)");
    const t0 = Date.now();
    try {
        await withHarness(r, { peer: true, oauth: true, ctxConfigPatch, ctxRoutes }, async (h) => {
            const a = await h.openTab({ label: "A", oauth: env.users.main });
            r.elementVersion = await h.page(a).evaluate(() => window.mxPlatformPeg?.get()?.getAppVersion?.()).catch(() => "?");
            r.note(`Element on ${env.element}: ${r.elementVersion}`);
            const mtA = await h.mt(a);
            r.note(`A right after the OAuth login: ${JSON.stringify(mtA)}`);
            r.check("A is the engine right after the OAuth login (no reload needed)", mtA?.role === "engine", mtA);
            if (mtA?.role !== "engine") {
                await h.reloadTab(a);
                r.note(`A after one reload: ${JSON.stringify(await h.mt(a))}`);
            }
            const b = await h.openTab({ label: "B" });
            const c = await h.openTab({ label: "C" });
            const mts = { A: await h.mt(a), B: await h.mt(b), C: await h.mt(c) };
            if (Object.values(mts).some((m) => !m || m.role === "off")) r.note(`module off somewhere: ${JSON.stringify(mts)}`);
            if (!(await expectRoles(r, h, { [a]: "engine", [b]: "mirror", [c]: "mirror" }))) throw new Error("roles not engine/mirror/mirror; stopping");
            const from = h.mark();
            const ctx = { h, a, b, from };

            // T1-T4, T16 on the same live session (one OAuth login = one device).
            const sub = async (id, fn) => {
                const rs = new Result(`${id}-live`, TITLES[id]);
                console.log(`\n== ${rs.id}: ${rs.title}`);
                const t = Date.now();
                await fn(rs);
                rs.durationMs = Date.now() - t;
                console.log(`== ${rs.id} ${rs.ok ? "PASS" : "FAIL"}`);
                results.push(rs);
            };
            await sub("T1", async (rs) => {
                rs.check("B and C show the room list", (await h.screen(b)) === "roomlist" && (await h.screen(c)) === "roomlist");
                await sleep(5000);
                rs.check("no /sync from B or C", h.tabRequests({ from: t0 }).filter((q) => q.tab !== a && isSync(q)).length === 0);
                invariants(rs, h, t0);
            });
            if (!flag("skip-subs")) for (const [id, fn] of [["T2", T2], ["T3", T3], ["T4", T4], ["T16", T16]]) await sub(id, (rs) => fn(rs, ctx));

            // ---- T11: wait past the access-token lifetime while the peer keeps talking
            console.log(`\n== T11 (continued)`);
            const login = h.tokenGrants.find((g) => g.grant === "authorization_code");
            const ttl = Number(opt("ttl", login?.expiresIn ?? 300));
            r.time("accessTokenExpiresInS", login?.expiresIn ?? null);
            r.check("token response of the OAuth login carried expires_in", !!login?.expiresIn, login && { expiresIn: login.expiresIn, status: login.status });
            const until = (login?.ts ?? t0) + ttl * 1000 + extraWait * 1000;
            r.note(`waiting until ${Math.round((until - Date.now()) / 1000)} s from now (TTL ${ttl} s + ${extraWait} s)`);
            let n = 0;
            const lag = [];
            while (Date.now() < until) {
                const enc = n % 2 === 1;
                const room = enc ? pick(encRooms, n) : pick(plainRooms, n);
                const text = `t11-${RUN_ID}-${n}`;
                await h.peerSend(room, text);
                const ok = await everyTabGets(r, h, room, text, `during wait #${n} (${enc ? "enc" : "plain"}, t+${Math.round((Date.now() - (login?.ts ?? t0)) / 1000)} s): all tabs get it`);
                if (!ok) break;
                n++;
                await sleep(Math.min(30_000, Math.max(0, until - Date.now())));
            }
            const refreshes = h.tokenGrants.filter((g) => g.grant === "refresh_token");
            r.time("refreshes", refreshes.map((g) => ({ tab: h.tabs[g.tab].label, role: h.roleOf(g), atS: Math.round((g.ts - (login?.ts ?? t0)) / 1000), status: g.status, expiresIn: g.expiresIn })));
            r.check("exactly one refresh_token grant after one TTL", refreshes.length === 1, r.timings.refreshes);
            r.check("every refresh came from the engine tab", refreshes.length > 0 && refreshes.every((g) => h.roleOf(g) === "engine"), r.timings.refreshes);
            r.check("refresh succeeded (200)", refreshes.every((g) => g.status === 200), refreshes.map((g) => g.status));
            const mirrorMas = h.tabRequests({ from: t0 }).filter((q) => q.origin === new URL(env.issuer).origin && h.roleOf(q) === "mirror");
            r.check("mirrors made no MAS requests at all", mirrorMas.length === 0, mirrorMas.slice(0, 3).map((q) => [h.tabs[q.tab].label, q.method, q.path]));
            const unauth = h.tabRequests({ from: t0 }).filter((q) => q.status === 401);
            r.note(`401 responses by tab: ${JSON.stringify(Object.fromEntries(h.tabs.map((t) => [t.label, unauth.filter((q) => q.tab === t.i).length])))}`);

            // after expiry: receive/decrypt/send from the mirrors
            const pt = `t11-after-${RUN_ID}`;
            await h.peerSend(pick(plainRooms, 0), pt);
            await everyTabGets(r, h, pick(plainRooms, 0), pt, "after expiry: plain message in all tabs");
            const et = `t11-after-enc-${RUN_ID}`;
            await h.peerSend(pick(encRooms, 0), et);
            await everyTabGets(r, h, pick(encRooms, 0), et, "after expiry: encrypted message decrypted in all tabs");
            const bt = `t11-from-B-${RUN_ID}`;
            await h.sendMessage(b, pick(encRooms, 1), bt);
            r.check("after expiry: B sends encrypted, peer decrypts", await h.peerSees(pick(encRooms, 1), bt));
            const ct = `t11-from-C-${RUN_ID}`;
            await h.sendMessage(c, pick(plainRooms, 1), ct);
            r.check("after expiry: C sends plain, peer sees", await h.peerSees(pick(plainRooms, 1), ct));
            const screens = {};
            for (const i of h.openTabs()) screens[h.tabs[i].label] = await h.screen(i);
            r.check("no tab logged out", Object.values(screens).every((x) => x === "roomlist"), screens);
            r.check("no /logout request", !h.tabRequests({ from: t0 }).some((q) => /\/logout/.test(q.path)));
            invariants(r, h, t0);

            // cold restart: close every tab, open two new ones; they must start logged in with the stored (rotated) tokens
            for (const i of h.openTabs()) await h.closeTab(i);
            await sleep(2000);
            const d = await h.openTab({ label: "D" });
            const e = await h.openTab({ label: "E" });
            await expectRoles(r, h, { [d]: "engine", [e]: "mirror" });
            const coldText = `t11-cold-${RUN_ID}`;
            await h.peerSend(pick(encRooms, 2), coldText);
            await everyTabGets(r, h, pick(encRooms, 2), coldText, "after closing all tabs: new tabs start logged in and decrypt");
            const late = h.tokenGrants.filter((g) => g.ts > refreshes.at(-1)?.ts && g.grant === "refresh_token");
            if (late.length) r.check("refreshes after the cold restart succeed", late.every((g) => g.status === 200), late.map((g) => g.status));
        });
    } finally {
        r.durationMs = Date.now() - t0;
        results.push(r);
        fs.writeFileSync(path.join(outRoot, "results.json"), JSON.stringify(results, null, 2));
        if (!flag("keep-accounts")) await cleanup({ id: env.setId, live: true }).catch((e) => console.log(`cleanup failed: ${e.message}`));
    }
}

// ------------------------------------------------------------------ main
const SCENARIOS = { T1, T2, T3, T4, T5, T5b, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16, T17, T17b, T18 };
const TITLES = {
    STOCK: "harness self-test on stock Element",
    T1: "second tab mirrors without the lock screen",
    T2: "unencrypted message reaches engine and mirror",
    T3: "encrypted message decrypts in both tabs",
    T4: "send encrypted from the mirror",
    T5: "close engine: promotion + re-attach",
    T5b: "4 tabs, crash engine: exactly one promotion, no ping-pong",
    T6: "draft survives promotion reload",
    T7: "frozen then closed engine",
    T8: "mirror open past the store-save interval (long)",
    T9: "different build is rejected",
    T10: "same-origin tab without module sees lock screen (I7)",
    T11: "token refresh only in engine",
    T12: "verification in mirror shows toast",
    T13: "logout from mirror",
    T14: "mirror reload loop boot time",
    T15: "speed-start + multi-tab",
    T16: "late room key: UTD -> plaintext without reload",
    T17: "hung engine, not closed: takeover time",
    T17b: "hung engine + new tab: the new tab takes over",
    T18: "open tabs in Preferences",
};

const results = [];
async function runOne(id, fn) {
    const r = new Result(id, TITLES[id] ?? id);
    console.log(`\n== ${id}: ${r.title}`);
    const t = Date.now();
    await fn(r);
    r.durationMs = Date.now() - t;
    console.log(`== ${id} ${r.skipped ? `SKIP (${r.skipped})` : r.ok ? "PASS" : "FAIL"} in ${(r.durationMs / 1000).toFixed(1)} s`);
    results.push(r);
    fs.writeFileSync(path.join(outRoot, "results.json"), JSON.stringify(results, null, 2));
    return r;
}

if (target === "bpc-live") await LIVE();
if (flag("stock")) await runOne("STOCK", STOCK);
if (flag("tabs")) await runOne("CHAOS", (r) => CHAOS(r, Number(opt("tabs", 10)), Number(opt("duration", 120))));
let ids = argv.filter((a) => /^T\d+b?$/.test(a));
if (argv.includes("all")) ids = Object.keys(SCENARIOS).filter((k) => k !== "T8" || flag("long"));
for (const id of ids) {
    const r = await runOne(id, SCENARIOS[id]);
    if (!r.ok && !flag("keep-going") && !argv.includes("all")) break;
}
console.log(`\nbrowser: ${browser}\nresults: ${outRoot}/results.json`);
for (const r of results) console.log(`  ${r.id.padEnd(6)} ${r.skipped ? "SKIP" : r.ok ? "PASS" : "FAIL"}  ${r.title}  ${JSON.stringify(r.timings)}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
