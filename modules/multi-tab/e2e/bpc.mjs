#!/usr/bin/env node
// Provisioning and local Element for the Black Pony Club ESS test server (Synapse + MAS, https://matrix.blackpony.club).
// Follows ~/projects/blackponyclub/services/bpc-ess/agents/AGENTS.md: agent id "multitab" (BPC_AGENT_ID), only our own
// accounts/rooms (all prefixed), MAS admin-api backend for accounts, compat login (m.login.password) for tokens.
//
//   source ~/projects/blackponyclub/services/bpc-ess/agents/.state/mas-admin.env
//   node e2e/bpc.mjs seed --rooms 40 --spaces 2 --encrypted 10 [--new]   create/resume a seed set (fresh accounts with --new)
//   node e2e/bpc.mjs up | down                                          proxy :18462 -> BPC, Element v1.12.33 :5797 with the module
//   node e2e/bpc.mjs status
//   node e2e/bpc.mjs cleanup [--all]                                     deactivate the current (or every recorded) seed set
//
// No secrets are written to disk: passwords live only in memory. When a run needs to log in, a fresh random password is
// set through the MAS admin API (see bpcEnv()). State (user ids, room ids, progress) is in e2e/.run/bpc-state.json.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const E2E = path.dirname(fileURLToPath(import.meta.url));
const MODULE = path.dirname(E2E);
const RUN = path.join(E2E, ".run");
const STATE = path.join(RUN, "bpc-state.json");
const AGENT = process.env.BPC_AGENT_ID ?? "multitab";
const SERVER_NAME = process.env.BPC_SERVER_NAME ?? "blackpony.club";
const HS = process.env.BPC_HOMESERVER ?? "https://matrix.blackpony.club";
const MAS = process.env.BPC_MAS_ISSUER ?? "https://account.blackpony.club";
const PX_PORT = Number(process.env.MT_BPC_PROXY_PORT ?? 18462);
const EL_PORT = Number(process.env.MT_BPC_EL_PORT ?? 5797);
const EL_IMG = `ghcr.io/element-hq/element-web:${process.env.MT_ELEMENT ?? "v1.12.33"}`;
const EL_NAME = "mt-e2e-element-bpc";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

// ------------------------------------------------------------------ state
// Live-deployment sets live in their own file: a long `seed` run keeps bpc-state.json in memory and rewrites it.
const LIVE_STATE = path.join(RUN, "bpc-live-state.json");
function loadState(file = STATE) {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : { agentId: AGENT, sets: [] };
}
function saveState(s, file = STATE) {
    fs.mkdirSync(RUN, { recursive: true });
    fs.writeFileSync(file + ".tmp", JSON.stringify(s, null, 1));
    fs.renameSync(file + ".tmp", file);
}
const currentSet = (s) => s.sets.find((x) => x.id === s.current);

// ------------------------------------------------------------------ MAS admin API (client_credentials)
let adminToken;
let adminTokenUntil = 0;
async function admin(method, p, body, retry = true) {
    if (!adminToken || Date.now() > adminTokenUntil) {
        const id = process.env.BPC_MAS_ADMIN_CLIENT_ID, secret = process.env.BPC_MAS_ADMIN_CLIENT_SECRET;
        if (!id || !secret) throw new Error("BPC_MAS_ADMIN_CLIENT_ID/_SECRET not set: source ~/projects/blackponyclub/services/bpc-ess/agents/.state/mas-admin.env");
        const r = await fetch(`${MAS}/oauth2/token`, {
            method: "POST",
            headers: { authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "content-type": "application/x-www-form-urlencoded" },
            body: "grant_type=client_credentials&scope=urn:mas:admin",
        });
        if (!r.ok) throw new Error(`MAS admin token: HTTP ${r.status}`);
        const j = await r.json();
        adminToken = j.access_token;
        // MAS admin tokens expire (300 s on BPC): renew a minute early.
        adminTokenUntil = Date.now() + Math.max(30, (j.expires_in ?? 300) - 60) * 1000;
    }
    const r = await fetch(`${MAS}/api/admin/v1${p}`, {
        method,
        headers: { authorization: `Bearer ${adminToken}`, accept: "application/json", ...(body ? { "content-type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await r.text();
    if (r.status === 401 && retry) {
        adminToken = null;
        return admin(method, p, body, false);
    }
    if (!r.ok) {
        const e = new Error(`MAS ${method} ${p}: HTTP ${r.status} ${text.slice(0, 200)}`);
        e.status = r.status;
        throw e;
    }
    return text ? JSON.parse(text) : {};
}
const masUserId = async (localpart) => (await admin("GET", `/users/by-username/${encodeURIComponent(localpart)}`)).data.id;

async function ensureUser(localpart) {
    try {
        await admin("POST", "/users", { username: localpart });
    } catch (e) {
        if (e.status !== 409) throw e;
    }
}
/** Set a fresh random password (kept in memory only) and return it. */
async function freshPassword(localpart) {
    const pw = `Mt-${crypto.randomBytes(18).toString("base64url")}!9`;
    await admin("POST", `/users/${await masUserId(localpart)}/set-password`, { password: pw, skip_password_check: true });
    return pw;
}

// ------------------------------------------------------------------ client-server API with 429 back-off
async function cs(token, method, p, body, { tries = 30 } = {}) {
    for (let attempt = 0; ; attempt++) {
        const r = await fetch(`${HS}/_matrix/client/v3${p}`, {
            method,
            headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
            body: body === undefined ? (method === "GET" ? undefined : "{}") : JSON.stringify(body),
        });
        const text = await r.text();
        const j = text ? JSON.parse(text) : {};
        if (r.status === 429 && attempt < tries) {
            const wait = Math.min(j.retry_after_ms ?? 2000 * (attempt + 1), 120_000) + 200;
            stats.backoffs++;
            stats.backoffMs += wait;
            process.stdout.write(`  429 on ${method} ${p.split("?")[0].replace(/![^/]+/, "!…")}, waiting ${wait} ms\n`);
            await sleep(wait);
            continue;
        }
        if ((r.status >= 500 || r.status === 0) && attempt < 5) {
            await sleep(2000 * (attempt + 1));
            continue;
        }
        if (!r.ok) {
            const e = new Error(`${method} ${p}: ${r.status} ${j.errcode ?? ""} ${j.error ?? ""}`);
            e.status = r.status;
            e.errcode = j.errcode;
            throw e;
        }
        return j;
    }
}
const stats = { backoffs: 0, backoffMs: 0 };

async function compatLogin(localpart, password, device) {
    for (let attempt = 0; ; attempt++) {
        const r = await fetch(`${HS}/_matrix/client/v3/login`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ type: "m.login.password", identifier: { type: "m.id.user", user: localpart }, password, initial_device_display_name: device }),
        });
        const j = await r.json();
        if (r.status === 429 && attempt < 10) {
            await sleep((j.retry_after_ms ?? 3000) + 200);
            continue;
        }
        if (!r.ok) throw new Error(`login ${localpart}: ${r.status} ${j.errcode}`);
        return { accessToken: j.access_token, deviceId: j.device_id, userId: j.user_id };
    }
}
const logout = (tok) => fetch(`${HS}/_matrix/client/v3/logout`, { method: "POST", headers: { authorization: `Bearer ${tok}` }, body: "{}" }).catch(() => {});

// ------------------------------------------------------------------ seed
async function seed({ rooms, spaces, encrypted, msgs, fresh }) {
    const s = loadState();
    let set = currentSet(s);
    if (!set || fresh || set.done) {
        const suffix = crypto.randomBytes(3).toString("hex");
        set = {
            id: suffix,
            created: new Date().toISOString(),
            target: { rooms, spaces, encrypted, msgs },
            main: { localpart: `${AGENT}-main-${suffix}`, userId: `@${AGENT}-main-${suffix}:${SERVER_NAME}` },
            peer: { localpart: `${AGENT}-peer-${suffix}`, userId: `@${AGENT}-peer-${suffix}:${SERVER_NAME}` },
            spaces: [],
            rooms: [],
        };
        s.sets.push(set);
        s.current = set.id;
        saveState(s);
        log(`new seed set ${suffix}: ${set.main.userId}, ${set.peer.userId}`);
    } else {
        // Allow growing an existing set (e.g. 40 -> 1000 rooms).
        set.target = { rooms: Math.max(rooms, set.target.rooms), spaces: Math.max(spaces, set.target.spaces), encrypted: Math.max(encrypted, set.target.encrypted), msgs };
        log(`resuming seed set ${set.id} (${set.rooms.length}/${set.target.rooms} rooms)`);
    }
    const t0 = Date.now();
    for (const u of [set.main, set.peer]) await ensureUser(u.localpart);
    const main = await compatLogin(set.main.localpart, await freshPassword(set.main.localpart), "multitab seed");
    const peer = await compatLogin(set.peer.localpart, await freshPassword(set.peer.localpart), "multitab seed");
    try {
        if (!set.profiles) {
            await cs(main.accessToken, "PUT", `/profile/${encodeURIComponent(main.userId)}/displayname`, { displayname: `MT Main ${set.id}` });
            await cs(peer.accessToken, "PUT", `/profile/${encodeURIComponent(peer.userId)}/displayname`, { displayname: `MT Peer ${set.id}` });
            set.profiles = true;
            saveState(s);
        }
        // Spaces (created by the peer, main joins).
        while (set.spaces.length < set.target.spaces) {
            const name = `[${AGENT}] Space ${set.spaces.length + 1}`;
            const { room_id } = await cs(peer.accessToken, "POST", "/createRoom", { name, preset: "private_chat", creation_content: { type: "m.space" }, invite: [main.userId], power_level_content_override: { events_default: 100 } });
            set.spaces.push({ name, roomId: room_id, joined: false });
            saveState(s);
        }
        for (const sp of set.spaces.filter((x) => !x.joined)) {
            await joinOrAccept(main.accessToken, sp.roomId);
            sp.joined = true;
            saveState(s);
        }
        // Rooms: encrypted ones are spread evenly over the list.
        let lastLog = Date.now();
        for (let i = set.rooms.length; i < set.target.rooms; i++) {
            const { rooms: N, encrypted: K } = set.target;
            const enc = Math.floor(((i + 1) * K) / N) > Math.floor((i * K) / N) && set.rooms.filter((r) => r.encrypted).length < K;
            const name = `[${AGENT}] ${enc ? "Enc" : "Room"} ${i + 1}`;
            const space = set.spaces.length ? set.spaces[i % set.spaces.length] : null;
            const { room_id } = await cs(peer.accessToken, "POST", "/createRoom", {
                name,
                preset: "private_chat",
                invite: [main.userId],
                initial_state: enc ? [{ type: "m.room.encryption", state_key: "", content: { algorithm: "m.megolm.v1.aes-sha2" } }] : [],
            });
            set.rooms.push({ name, roomId: room_id, encrypted: enc, space: space?.roomId ?? null, joined: false, child: false, msgs: 0 });
            saveState(s);
            if (Date.now() - lastLog > 15_000) {
                lastLog = Date.now();
                log(`  created ${set.rooms.length}/${set.target.rooms} rooms (${Math.round((Date.now() - t0) / 1000)} s, ${stats.backoffs} back-offs)`);
            }
        }
        let n = 0;
        for (const r of set.rooms) {
            if (!r.joined) {
                await joinOrAccept(main.accessToken, r.roomId);
                r.joined = true;
            }
            if (r.space && !r.child) {
                await cs(peer.accessToken, "PUT", `/rooms/${encodeURIComponent(r.space)}/state/m.space.child/${encodeURIComponent(r.roomId)}`, { via: [SERVER_NAME] });
                r.child = true;
            }
            // Plain messages only in unencrypted rooms: encrypted ones need a crypto client, and a fresh test device
            // could not decrypt history anyway. Tests send encrypted messages live through the peer's Element.
            while (!r.encrypted && r.msgs < set.target.msgs) {
                await cs(peer.accessToken, "PUT", `/rooms/${encodeURIComponent(r.roomId)}/send/m.room.message/seed-${r.msgs}`, { msgtype: "m.text", body: `Seed message ${r.msgs + 1} in ${r.name}` });
                r.msgs++;
            }
            if (++n % 10 === 0) {
                saveState(s);
                if (Date.now() - lastLog > 15_000) {
                    lastLog = Date.now();
                    log(`  filled ${n}/${set.rooms.length} rooms (${Math.round((Date.now() - t0) / 1000)} s, ${stats.backoffs} back-offs)`);
                }
            }
        }
        set.done = set.rooms.length >= set.target.rooms;
        saveState(s);
        log(`seed set ${set.id}: ${set.rooms.length} rooms (${set.rooms.filter((r) => r.encrypted).length} encrypted) in ${set.spaces.length} spaces, ${Math.round((Date.now() - t0) / 1000)} s, ${stats.backoffs} 429 back-offs (${Math.round(stats.backoffMs / 1000)} s waited)`);
        set.done = false; // keep it current & growable; "--new" starts a new set
        saveState(s);
    } finally {
        await logout(main.accessToken);
        await logout(peer.accessToken);
    }
}

async function joinOrAccept(token, roomId) {
    try {
        await cs(token, "POST", `/join/${encodeURIComponent(roomId)}`, {});
    } catch (e) {
        if (e.status === 403 && /already in the room/i.test(e.message)) return;
        throw e;
    }
}

// ------------------------------------------------------------------ cleanup
export async function cleanup({ all, id, live = false } = {}) {
    const file = live ? LIVE_STATE : STATE;
    const s = loadState(file);
    const sets = id ? s.sets.filter((x) => x.id === id && !x.cleaned) : all ? s.sets.filter((x) => !x.cleaned) : [currentSet(s)].filter(Boolean);
    for (const set of sets) {
        let allOk = true;
        for (const u of [set.main, set.peer]) {
            if (!u.localpart.startsWith(`${AGENT}-`)) throw new Error(`refusing to touch ${u.localpart}: not ours`);
            let how = "deactivated";
            try {
                const id = await masUserId(u.localpart);
                try {
                    await admin("POST", `/users/${id}/deactivate`, {});
                } catch {
                    await admin("POST", `/users/${id}/lock`, {});
                    how = "locked";
                }
            } catch (e) {
                how = `failed: ${e.message.slice(0, 100)}`;
                allOk = false;
            }
            log(`${u.userId}: ${how}`);
        }
        if (!allOk) continue; // keep it listed so `cleanup` can be retried
        set.cleaned = new Date().toISOString();
        if (s.current === set.id) delete s.current;
    }
    saveState(s, file);
}

// ------------------------------------------------------------------ env for the runner (in-memory passwords)
/** Environment object for harness.mjs (target "bpc"). Sets fresh passwords via the admin API, nothing is persisted. */
export async function bpcEnv() {
    const s = loadState();
    const set = currentSet(s);
    if (!set) throw new Error("no BPC seed set: node e2e/bpc.mjs seed --rooms 40 --spaces 2 --encrypted 10");
    const users = {};
    for (const [k, u] of Object.entries({ main: set.main, peer: set.peer })) users[k] = { ...u, password: await freshPassword(u.localpart) };
    return {
        server: "bpc",
        serverName: SERVER_NAME,
        homeserver: HS,
        proxy: `http://127.0.0.1:${PX_PORT}`,
        element: `http://127.0.0.1:${EL_PORT}`,
        elementStock: null, // the peer gets the same origin with `modules` removed from config.json
        users,
        spaceId: set.spaces[0]?.roomId,
        rooms: set.rooms.filter((r) => r.joined).map((r) => ({ name: r.name, roomId: r.roomId, encrypted: r.encrypted })),
    };
}

// ------------------------------------------------------------------ live deployment (chat.blackpony.club, real MAS OAuth)
/**
 * Fresh main + peer accounts and a few rooms (plain + encrypted, both joined) for a run against the real
 * https://chat.blackpony.club. Passwords stay in memory. The set is recorded (kind "live") so `cleanup` can
 * deactivate it; the run itself calls cleanup({ id }) when it ends.
 */
export async function bpcLiveEnv({ plain = 2, encrypted = 3 } = {}) {
    const s = loadState(LIVE_STATE);
    const suffix = crypto.randomBytes(3).toString("hex");
    const set = {
        id: `live-${suffix}`,
        kind: "live",
        created: new Date().toISOString(),
        target: { rooms: plain + encrypted, spaces: 0, encrypted, msgs: 1 },
        main: { localpart: `${AGENT}-lmain-${suffix}`, userId: `@${AGENT}-lmain-${suffix}:${SERVER_NAME}` },
        peer: { localpart: `${AGENT}-lpeer-${suffix}`, userId: `@${AGENT}-lpeer-${suffix}:${SERVER_NAME}` },
        spaces: [],
        rooms: [],
    };
    s.sets.push(set);
    saveState(s, LIVE_STATE);
    const users = {};
    for (const [k, u] of Object.entries({ main: set.main, peer: set.peer })) {
        await ensureUser(u.localpart);
        users[k] = { ...u, password: await freshPassword(u.localpart) };
    }
    // Rooms are created by the peer; main joins with a short-lived compat session that is logged out again, so the
    // only device main has afterwards is the one Element creates through the OAuth login.
    const peer = await compatLogin(set.peer.localpart, users.peer.password, "multitab live seed");
    const main = await compatLogin(set.main.localpart, users.main.password, "multitab live seed");
    try {
        await cs(main.accessToken, "PUT", `/profile/${encodeURIComponent(main.userId)}/displayname`, { displayname: `MT Live ${suffix}` });
        await cs(peer.accessToken, "PUT", `/profile/${encodeURIComponent(peer.userId)}/displayname`, { displayname: `MT Live Peer ${suffix}` });
        for (let i = 0; i < plain + encrypted; i++) {
            const enc = i >= plain;
            const name = `[${AGENT}] Live ${enc ? "Enc" : "Room"} ${i + 1} ${suffix}`;
            const { room_id } = await cs(peer.accessToken, "POST", "/createRoom", {
                name,
                preset: "private_chat",
                invite: [main.userId],
                initial_state: enc ? [{ type: "m.room.encryption", state_key: "", content: { algorithm: "m.megolm.v1.aes-sha2" } }] : [],
            });
            await joinOrAccept(main.accessToken, room_id);
            if (!enc) await cs(peer.accessToken, "PUT", `/rooms/${encodeURIComponent(room_id)}/send/m.room.message/seed`, { msgtype: "m.text", body: `Seed message in ${name}` });
            set.rooms.push({ name, roomId: room_id, encrypted: enc, joined: true, msgs: enc ? 0 : 1 });
            saveState(s, LIVE_STATE);
        }
    } finally {
        await logout(main.accessToken);
        await logout(peer.accessToken);
    }
    return {
        server: "bpc-live",
        setId: set.id,
        serverName: SERVER_NAME,
        homeserver: HS,
        issuer: MAS,
        proxy: null,
        recordOrigins: [HS, MAS],
        element: process.env.MT_LIVE_ELEMENT ?? "https://chat.blackpony.club",
        elementStock: process.env.MT_LIVE_ELEMENT ?? "https://chat.blackpony.club",
        hsUrlForInjection: HS,
        users,
        rooms: set.rooms.map((r) => ({ name: r.name, roomId: r.roomId, encrypted: r.encrypted })),
    };
}

// ------------------------------------------------------------------ local Element + proxy for BPC
function up() {
    fs.mkdirSync(RUN, { recursive: true });
    const pidFile = path.join(RUN, "proxy-bpc.pid");
    let running = false;
    try {
        process.kill(Number(fs.readFileSync(pidFile, "utf8")), 0);
        running = true;
    } catch {}
    if (!running) {
        const out = fs.openSync(path.join(RUN, "proxy-bpc.out"), "a");
        const p = spawn(process.execPath, [path.join(E2E, "proxy.mjs"), "--target", HS, "--port", String(PX_PORT), "--log", path.join(RUN, `proxy-${PX_PORT}.jsonl`)], { detached: true, stdio: ["ignore", out, out] });
        p.unref();
        fs.writeFileSync(pidFile, String(p.pid));
    }
    const hasLib = fs.existsSync(path.join(MODULE, "lib/index.js"));
    const cfg = {
        default_server_config: { "m.homeserver": { base_url: `http://127.0.0.1:${PX_PORT}`, server_name: SERVER_NAME } },
        disable_guests: true,
        default_theme: "light",
        bug_report_endpoint_url: "",
        setting_defaults: { "UIFeature.feedback": false, "Spaces.allRoomsInHome": true },
        modules: [], // the image adds every directory mounted under /modules itself
    };
    fs.writeFileSync(path.join(RUN, "element-bpc-config.json"), JSON.stringify(cfg, null, 1));
    try {
        execFileSync("podman", ["rm", "-f", EL_NAME], { stdio: "ignore" });
    } catch {}
    const args = ["run", "-d", "--name", EL_NAME, "-p", `127.0.0.1:${EL_PORT}:${EL_PORT}`, "-e", `ELEMENT_WEB_PORT=${EL_PORT}`, "-v", `${path.join(RUN, "element-bpc-config.json")}:/app/config.json:ro,z`];
    if (hasLib && !process.env.MT_STOCK) args.push("-v", `${path.join(MODULE, "lib")}:/modules/multi-tab:ro,z`);
    execFileSync("podman", [...args, EL_IMG], { stdio: "ignore" });
    log(`proxy http://127.0.0.1:${PX_PORT} -> ${HS}  Element http://127.0.0.1:${EL_PORT} (module: ${hasLib && !process.env.MT_STOCK ? "multi-tab" : "none"})`);
}
function down() {
    try {
        process.kill(Number(fs.readFileSync(path.join(RUN, "proxy-bpc.pid"), "utf8")));
    } catch {}
    try {
        fs.rmSync(path.join(RUN, "proxy-bpc.pid"));
    } catch {}
    try {
        execFileSync("podman", ["rm", "-f", EL_NAME], { stdio: "ignore" });
    } catch {}
}

function status() {
    const s = loadState();
    for (const set of s.sets)
        log(
            `${set.id === s.current ? "*" : " "} ${set.id} ${set.created} ${set.main.userId} rooms ${set.rooms.length}/${set.target.rooms} enc ${set.rooms.filter((r) => r.encrypted).length} spaces ${set.spaces.length} joined ${set.rooms.filter((r) => r.joined).length}${set.cleaned ? ` cleaned ${set.cleaned}` : ""}`,
        );
}

// ------------------------------------------------------------------ CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const argv = process.argv.slice(2);
    const opt = (n, d) => (argv.includes(`--${n}`) ? Number(argv[argv.indexOf(`--${n}`) + 1]) : d);
    const cmd = argv[0];
    try {
        if (cmd === "seed") await seed({ rooms: opt("rooms", 40), spaces: opt("spaces", 2), encrypted: opt("encrypted", 10), msgs: opt("msgs", 3), fresh: argv.includes("--new") });
        else if (cmd === "cleanup") await cleanup({ all: argv.includes("--all"), live: argv.includes("--live") });
        else if (cmd === "up") up();
        else if (cmd === "down") down();
        else if (cmd === "status") status();
        else {
            console.error("usage: bpc.mjs seed [--rooms N --spaces M --encrypted K --msgs 3 --new] | up | down | status | cleanup [--all] [--live]");
            process.exit(2);
        }
    } catch (e) {
        console.error(String(e.message ?? e));
        process.exit(1);
    }
}
