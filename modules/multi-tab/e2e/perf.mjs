// Performance probe on the local stack: one engine + N mirrors, peer traffic, then the engine's cost figures.
//   node e2e/perf.mjs [--tabs 6] [--messages 30]
import { Harness, loadEnv, sleep } from "./harness.mjs";

const arg = (name, def) => {
    const i = process.argv.indexOf(`--${name}`);
    return i > 0 ? Number(process.argv[i + 1]) : def;
};
const TABS = arg("tabs", 6);
const MESSAGES = arg("messages", 30);

const env = await loadEnv("local");
const h = new Harness({ env, log: (m) => console.log(m) });
await h.start();
try {
    const a = await h.openTab();
    await h.waitForRoomList(a);
    // Let the engine settle and save once after its initial sync.
    await sleep(3000);
    const mirrors = [];
    for (let i = 1; i < TABS; i++) {
        const t = await h.openTab();
        await h.waitForRoomList(t);
        mirrors.push(t);
    }

    const plain = env.rooms.find((r) => !r.encrypted)?.name ?? "Room 1";
    const enc = env.rooms.find((r) => r.encrypted)?.name ?? "Enc 1";
    const lat = [];
    for (let n = 0; n < MESSAGES; n++) {
        const room = n % 2 ? enc : plain;
        const text = `perf ${Date.now()} ${n}`;
        const t0 = Date.now();
        await h.peerSend(room, text);
        await Promise.all([a, ...mirrors].map((i) => h.waitForMessage(i, room, text)));
        lat.push({ room: n % 2 ? "enc" : "plain", ms: Date.now() - t0 });
    }

    const stats = await h.page(a).evaluate(() => window.__multiTab.stats());
    const mirrorStats = await Promise.all(mirrors.map((i) => h.page(i).evaluate(() => window.__multiTab.stats())));
    const heap = await Promise.all(
        [a, ...mirrors].map((i) =>
            h.page(i).evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : null)),
        ),
    );
    const syncs = h.proxyLog().filter((e) => e.method === "GET" && /\/sync$/.test(e.path) && e.status === 200);
    const bytes = syncs.map((e) => e.bytes ?? 0).sort((x, y) => x - y);
    const pct = (arr, p) => arr[Math.min(arr.length - 1, Math.floor((p / 100) * arr.length))];
    const by = (k) => lat.filter((l) => l.room === k).map((l) => l.ms).sort((x, y) => x - y);

    console.log(
        JSON.stringify(
            {
                tabs: TABS,
                rooms: env.rooms.length,
                deliveryAllTabsMs: { plain: { p50: pct(by("plain"), 50), p95: pct(by("plain"), 95) }, enc: { p50: pct(by("enc"), 50), p95: pct(by("enc"), 95) } },
                engine: stats,
                syncResponses: { count: syncs.length, bytesP50: pct(bytes, 50), bytesMax: bytes.at(-1) },
                mirrorCrypto: mirrorStats.map((s) => ({ ok: s.crypto?.decrypted, failed: s.crypto?.failed, retried: s.crypto?.retried })),
                heapMB: heap,
            },
            null,
            2,
        ),
    );
} finally {
    await h.stop();
}
