// Dev server for the mobile-themes module (default port 5410). Same approach as ../theme-loader/dev/server.mjs, but standalone
// so the shared theme-loader dev server (:5400) stays untouched.
//
//   /                                         stock Element Web 1.12.36, read-only from ../theme-loader/.element/ (the release
//                                             tarball the loader dev server downloaded; run `pnpm dev` in ../theme-loader/
//                                             once if it is missing)
//   /config.json                              ../theme-loader/dev/config.json (read-only) with modules = [mobile-themes]
//                                             (+ the theme loader proxied from :5400 when MT_WITH_LOADER=1)
//   /element-modules/mobile-themes/index.js   bundled from src/ on every request (MT_DEV_MODE=prod: lib/ instead)
//   /mt-dev/status                            health JSON
//
// Mobile UAs are redirected to /mobile_guide/ by Element before any module loads; for testing in device emulation,
// either open a deep link (http://127.0.0.1:5410/#/login) or set sessionStorage.skip_mobile_redirect="true".
import { createServer, request as httpRequest } from "node:http";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { buildModule, MODULE_DIR } from "../build/bundle.mjs";

const PORT = Number(process.env.MT_DEV_PORT ?? 5410);
const HOST = process.env.MT_DEV_HOST ?? "127.0.0.1";
const PROD = process.env.MT_DEV_MODE === "prod";
const WITH_LOADER = process.env.MT_WITH_LOADER === "1";
const LOADER_PORT = Number(process.env.TL_DEV_PORT ?? 5400);
const ELEMENT_VERSION = "1.12.36";
const LOADER_DIR = join(MODULE_DIR, "..", "theme-loader");
const ELEMENT_DIR = join(LOADER_DIR, ".element", `element-v${ELEMENT_VERSION}`);
const DIST = join(MODULE_DIR, "lib");
const MOD = "/element-modules/mobile-themes/";

const TYPES = {
    ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
    ".jpg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2",
    ".woff": "font/woff", ".ttf": "font/ttf", ".wasm": "application/wasm", ".map": "application/json", ".txt": "text/plain; charset=utf-8",
    ".mp3": "audio/mpeg", ".ogg": "audio/ogg",
};
const NO_STORE = { "cache-control": "no-store, max-age=0" };
const log = (...a) => console.log(new Date().toISOString(), ...a);
const send = (res, status, body, headers = {}) => { res.writeHead(status, { ...NO_STORE, ...headers }); res.end(body); };
function sendFile(res, p, headers = {}) {
    res.writeHead(200, { "content-type": TYPES[extname(p).toLowerCase()] ?? "application/octet-stream", ...headers });
    createReadStream(p).on("error", () => res.end()).pipe(res);
}
function within(root, rel) {
    const p = resolve(root, normalize(decodeURIComponent(rel)).replace(/^([/\\])+/, ""));
    return p === root || p.startsWith(root + sep) ? p : null;
}

function config() {
    const c = JSON.parse(readFileSync(join(LOADER_DIR, "dev", "config.json"), "utf8"));
    c.modules = [...(WITH_LOADER ? ["/element-modules/theme-loader/index.js"] : []), `${MOD}index.js`];
    if (WITH_LOADER) c["de.datanauten.theme_loader"] = { ...(c["de.datanauten.theme_loader"] ?? {}), dev_base: "/tl-dev/" };
    c["de.datanauten.mobile_themes"] = { ...(c["de.datanauten.mobile_themes"] ?? {}) };
    return JSON.stringify(c, null, 2);
}

async function moduleJs() {
    try {
        const r = await buildModule({ write: false });
        return r.outputFiles.find((f) => f.path.endsWith(".js")).text;
    } catch (e) {
        log("module build failed", e.message);
        return `console.error(${JSON.stringify(`[mobile-themes] dev build failed:\n${e.message}`)});
export default class { static moduleApiVersion = "^1.14.0 || ^2.0.0"; constructor() {} async load() {} }`;
    }
}

function proxyToLoader(req, res) {
    const p = httpRequest({ host: "127.0.0.1", port: LOADER_PORT, path: req.url, method: req.method, headers: req.headers }, (r) => {
        res.writeHead(r.statusCode ?? 502, r.headers);
        r.pipe(res);
    });
    p.on("error", () => send(res, 502, "theme-loader dev server (:5400) not reachable"));
    req.pipe(p);
}

async function handle(req, res) {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    if (path === "/config.json" || /^\/config\.[^/]+\.json$/.test(path)) return send(res, 200, config(), { "content-type": TYPES[".json"] });
    if (path === "/mt-dev/status") {
        return send(res, 200, JSON.stringify({ ok: true, service: PROD ? "mobile-themes-prod-preview" : "mobile-themes-dev", pid: process.pid, element: ELEMENT_VERSION, withLoader: WITH_LOADER }), { "content-type": TYPES[".json"] });
    }
    if (path.startsWith(MOD)) {
        if (PROD) {
            const p = within(DIST, path.slice(MOD.length));
            if (!p || !existsSync(p) || !statSync(p).isFile()) return send(res, 404, "not found");
            return sendFile(res, p, { "cache-control": "no-cache" });
        }
        if (path === `${MOD}index.js`) return send(res, 200, await moduleJs(), { "content-type": TYPES[".js"] });
        return send(res, 404, "not found");
    }
    if (WITH_LOADER && (path.startsWith("/element-modules/theme-loader/") || path.startsWith("/tl-dev/"))) return proxyToLoader(req, res);

    let p = within(ELEMENT_DIR, path === "/" ? "index.html" : path);
    if (!p || !existsSync(p) || statSync(p).isDirectory()) p = p && existsSync(join(p, "index.html")) ? join(p, "index.html") : null;
    if (!p) return send(res, 404, "not found");
    return sendFile(res, p, /\.(html|json)$/.test(p) ? NO_STORE : { "cache-control": "public, max-age=3600" });
}

if (!existsSync(join(ELEMENT_DIR, "index.html"))) {
    console.error(`Element ${ELEMENT_VERSION} not found in ${ELEMENT_DIR}; run "npm run dev" in loader/ once (it downloads the release).`);
    process.exit(2);
}
const server = createServer((req, res) => handle(req, res).catch((e) => { log("request failed", req.url, e); try { send(res, 500, "internal error"); } catch { /* sent */ } }));
server.keepAliveTimeout = 5000;
server.on("error", (e) => { console.error("server error", e.message); process.exit(e.code === "EADDRINUSE" ? 3 : 1); });
server.listen(PORT, HOST, () => log(`mobile-themes dev server on http://${HOST}:${PORT}/ (${PROD ? "lib/" : "live src/"}${WITH_LOADER ? ", + theme-loader from :" + LOADER_PORT : ""})`));
for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => server.close(() => process.exit(0)));
