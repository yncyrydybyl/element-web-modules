#!/usr/bin/env node
// Ad-hoc driver: logged-in Element (session pool) under device emulation, optionally with the module injected, then
// runs a script module `export default async ({ page, ctx, R, h, out }) => {}`. For exploration and one-off checks.
//
//   node mobile/test/run.mjs --script path/to/x.mjs [--device iphone15] [--base-url https://element.datanauten.de]
//        [--with-module] [--theme lcars-tng] [--out dir]
import path from "node:path";
import * as h from "./mtlib.mjs";

const a = h.parseArgs(process.argv.slice(2), { device: "iphone15", baseUrl: "https://element.datanauten.de" });
const d = h.DEVICES[a.device];
if (!d) throw new Error("unknown device " + a.device);
const script = (await import(path.resolve(a.script))).default;
const out = h.ensureDir(path.resolve(a.out || path.join(h.ROOT, ".state/run/mt-adhoc")));
const s = await h.launchLoggedIn({ device: d, base: a.baseUrl.replace(/\/$/, ""), withModule: !!a.withModule, theme: a.theme || null });
try {
    const R = h.fixtures().rooms;
    await script({ page: s.page, ctx: s.ctx, R, h, out, args: a, device: d });
} catch (e) {
    console.error("script failed", e);
    process.exitCode = 1;
} finally {
    if (s.errors.length) console.log("console errors:", [...new Set(s.errors)].slice(0, 15));
    await s.close();
}
