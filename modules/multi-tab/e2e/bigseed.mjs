// Grows alice's account on the LOCAL stack (no rate limits there) into a big one, for performance runs:
//   node e2e/bigseed.mjs --rooms 2000 --spaces 20 --encrypted 200 [--concurrency 16]
// Rooms are named "Big N" (encrypted ones "Big N 🔒"), bob joins each and posts one message to the plain ones.
// Resumable: counts the "Big" rooms alice already has and only adds the rest.
import { loadEnv, passwordLogin } from "./harness.mjs";

const arg = (name, def) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 ? Number(process.argv[i + 1]) : def;
};
const ROOMS = arg("rooms", 2000);
const SPACES = arg("spaces", 20);
const ENCRYPTED = arg("encrypted", 200);
const CONCURRENCY = arg("concurrency", 16);

const env = loadEnv("local");
const HS = env.homeserver ?? env.hsDirect ?? "http://127.0.0.1:18460";
const alice = await passwordLogin(HS, "alice", "alice-pass", "bigseed");
const bob = await passwordLogin(HS, "bob", "bob-pass", "bigseed");

async function api(who, method, path, body) {
    for (;;) {
        const r = await fetch(`${HS}/_matrix/client/v3/${path}`, {
            method,
            headers: { Authorization: `Bearer ${who.accessToken}`, "content-type": "application/json" },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        if (r.status === 429) {
            await new Promise((res) => setTimeout(res, 1000));
            continue;
        }
        if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${await r.text()}`);
        return r.json();
    }
}

const joined = (await api(alice, "GET", "joined_rooms")).joined_rooms;
const names = await Promise.all(
    joined.map((id) =>
        api(alice, "GET", `rooms/${encodeURIComponent(id)}/state/m.room.name/`)
            .then((s) => s.name)
            .catch(() => ""),
    ),
);
const spaces = [];
for (let i = 0; i < joined.length; i++) if (/^Big Space \d+$/.test(names[i])) spaces.push(joined[i]);
let have = names.filter((n) => /^Big \d+/.test(n)).length;
console.log(`alice has ${joined.length} rooms, ${have} "Big" rooms, ${spaces.length} big spaces`);

while (spaces.length < SPACES) {
    const { room_id } = await api(alice, "POST", "createRoom", {
        name: `Big Space ${spaces.length + 1}`,
        creation_content: { type: "m.space" },
        preset: "private_chat",
        invite: [bob.userId],
    });
    spaces.push(room_id);
}

const t0 = Date.now();
let next = have;
async function worker() {
    for (;;) {
        const n = next++;
        if (n >= ROOMS) return;
        const encrypted = n < ENCRYPTED;
        const initial_state = encrypted
            ? [{ type: "m.room.encryption", state_key: "", content: { algorithm: "m.megolm.v1.aes-sha2" } }]
            : [];
        const { room_id } = await api(alice, "POST", "createRoom", {
            name: `Big ${n + 1}${encrypted ? " 🔒" : ""}`,
            preset: "private_chat",
            invite: [bob.userId],
            initial_state,
        });
        const space = spaces[n % spaces.length];
        await api(alice, "PUT", `rooms/${encodeURIComponent(space)}/state/m.space.child/${encodeURIComponent(room_id)}`, {
            via: ["mt.test"],
        });
        await api(bob, "POST", `join/${encodeURIComponent(room_id)}`, {});
        if (!encrypted) {
            await api(bob, "PUT", `rooms/${encodeURIComponent(room_id)}/send/m.room.message/seed${n}`, {
                msgtype: "m.text",
                body: `Big room ${n + 1} says hello`,
            });
        }
        if (++have % 100 === 0) console.log(`${have}/${ROOMS} rooms, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
for (const s of spaces) await api(bob, "POST", `join/${encodeURIComponent(s)}`, {}).catch(() => {});
console.log(`done: ${have} "Big" rooms in ${spaces.length} spaces, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
for (const who of [alice, bob]) await api(who, "POST", "logout", {}).catch(() => {});
