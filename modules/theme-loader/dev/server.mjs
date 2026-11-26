// Dev server for concurrent theme work (port 5400).
//
//   /                                   Element Web 1.12.36 (release tarball in .element/, CSP as shipped)
//   /config.json, /config.<host>.json   generated from dev/config.json (homeserver matrix.datanauten.de)
//   /element-modules/theme-loader/index.js   the loader, bundled from loader/src on request (dev build: no baked
//                                       registry, no baked enhancers)
//   /tl-dev/themes.json                 aggregated registry, read live from themes/*/themes.json + validation problems
//   /tl-dev/themes/<family>/<file>      raw theme files (CSS, assets), live, never cached
//   /tl-dev/enhance/<family>.js         one family's enhance.ts, bundled on request (errors stay in that family)
//   /tl-dev/status                      health + validation summary (JSON)
//
// Every theme request reads the disk again: theme agents just reload the page. Nothing is written into themes/.
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync, createReadStream, readdirSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { aggregate, fileMtime, LOADER_DIR, loadAll, THEMES_DIR } from "../build/lib.mjs";
import { buildEnhancer, buildLoader } from "../build/bundle.mjs";

const PORT = Number(process.env.TL_DEV_PORT ?? 5400);
const HOST = process.env.TL_DEV_HOST ?? "127.0.0.1";
const ELEMENT_VERSION = "1.12.36";
const ELEMENT_DIR = join(LOADER_DIR, ".element", `element-v${ELEMENT_VERSION}`);
const DEV_BASE = "/tl-dev/";
const startedAt = new Date().toISOString();
// TL_DEV_MODE=prod (e.g. TL_DEV_PORT=5401): serve the production build in lib/ as the module instead,
// exactly as it would be deployed (flat directory, baked registry, no live themes). For checking a build.
const PROD = process.env.TL_DEV_MODE === "prod";
const DIST = join(LOADER_DIR, "lib");

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
    ".otf": "font/otf",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".wav": "audio/wav",
    ".wasm": "application/wasm",
    ".txt": "text/plain; charset=utf-8",
    ".map": "application/json",
};
const NO_STORE = { "cache-control": "no-store, max-age=0" };

function log(...a) {
    console.log(new Date().toISOString(), ...a);
}

function send(res, status, body, headers = {}) {
    res.writeHead(status, { ...NO_STORE, ...headers });
    res.end(body);
}

function sendFile(res, path, headers = {}) {
    const type = TYPES[extname(path).toLowerCase()] ?? "application/octet-stream";
    res.writeHead(200, { "content-type": type, ...headers });
    createReadStream(path).on("error", () => res.end()).pipe(res);
}

/** Path below root, or null if it escapes. */
function within(root, rel) {
    const p = resolve(root, normalize(decodeURIComponent(rel)).replace(/^([/\\])+/, ""));
    return p === root || p.startsWith(root + sep) ? p : null;
}

// ---- config.json ---------------------------------------------------------------------------------------
function config() {
    const c = JSON.parse(readFileSync(join(LOADER_DIR, "dev", "config.json"), "utf8"));
    c.modules = ["/element-modules/theme-loader/index.js"];
    if (!PROD) c["de.datanauten.theme_loader"] = { ...(c["de.datanauten.theme_loader"] ?? {}), dev_base: DEV_BASE };
    return JSON.stringify(c, null, 2);
}

// ---- loader bundle (cached by source mtimes) ---------------------------------------------------------------
let loaderCache = { stamp: "", code: "" };
function srcStamp() {
    const files = [];
    const walk = (d) => {
        for (const e of readdirSync(d, { withFileTypes: true })) {
            const p = join(d, e.name);
            if (e.isDirectory()) walk(p);
            else files.push(`${p}:${fileMtime(p)}`);
        }
    };
    walk(join(LOADER_DIR, "src"));
    return files.join("|");
}
let loaderBuilding = null;
async function loaderJs() {
    const stamp = srcStamp();
    if (stamp === loaderCache.stamp) return loaderCache.code;
    if (loaderBuilding) return loaderBuilding;
    loaderBuilding = (async () => {
        try {
            const r = await buildLoader({ registry: null, enhancerFamilies: [], outfile: "index.js", write: false });
            const code = r.outputFiles.find((f) => f.path.endsWith(".js")).text;
            loaderCache = { stamp, code };
            log("loader rebuilt");
            return code;
        } catch (e) {
            log("loader build failed", e.message);
            // Keep Element usable: a stub module that only logs.
            return `console.error(${JSON.stringify(`[theme-loader] dev build of the loader failed:\n${e.message}`)});
export default class { static moduleApiVersion = "^1.14.0 || ^2.0.0"; constructor() {} async load() {} }`;
        } finally {
            loaderBuilding = null;
        }
    })();
    return loaderBuilding;
}

// ---- live registry -----------------------------------------------------------------------------------------
function registryJson() {
    const loaded = loadAll();
    const reg = aggregate(loaded, { mode: "dev", showHidden: false });
    return { ...reg, dev: true, problems: loaded.problems };
}

/** Dev: "@other/assets/x" in CSS -> absolute dev URL of the other family's asset. */
function devCss(text) {
    return text.replace(/url\(\s*(['"]?)@([^/'")]+)\/([^'")]*)\1\s*\)/g, (_m, _q, fam, path) => `url("${DEV_BASE}themes/${fam}/${path}")`);
}

// ---- request handling ----------------------------------------------------------------------------------------
async function handle(req, res) {
    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname;

    if (path === "/config.json" || /^\/config\.[^/]+\.json$/.test(path)) {
        return send(res, 200, config(), { "content-type": TYPES[".json"] });
    }
    if (PROD && path.startsWith("/element-modules/theme-loader/")) {
        const p = within(DIST, path.slice("/element-modules/theme-loader/".length));
        if (!p || !existsSync(p) || !statSync(p).isFile()) return send(res, 404, "not found");
        return sendFile(res, p, { "cache-control": "no-cache" });
    }
    if (path === "/element-modules/theme-loader/index.js") {
        return send(res, 200, await loaderJs(), { "content-type": TYPES[".js"] });
    }
    if (path === `${DEV_BASE}status`) {
        const reg = registryJson();
        const errors = reg.problems.filter((p) => p.level === "error").length;
        return send(
            res,
            200,
            JSON.stringify({ ok: true, service: PROD ? "theme-loader-prod-preview" : "theme-loader-dev", pid: process.pid, startedAt, element: ELEMENT_VERSION, families: reg.families.length, variants: reg.variants.length, errors, warnings: reg.problems.length - errors }),
            { "content-type": TYPES[".json"] },
        );
    }
    if (path === `${DEV_BASE}themes.json`) {
        return send(res, 200, JSON.stringify(registryJson(), null, 1), { "content-type": TYPES[".json"] });
    }
    if (path.startsWith(`${DEV_BASE}enhance/`)) {
        const family = decodeURIComponent(path.slice(`${DEV_BASE}enhance/`.length).replace(/\.js$/, ""));
        if (!/^_?[a-z0-9-]+$/.test(family) || !existsSync(join(THEMES_DIR, family, "enhance.ts"))) return send(res, 404, "no enhancer");
        try {
            return send(res, 200, await buildEnhancer(family), { "content-type": TYPES[".js"] });
        } catch (e) {
            log(`enhancer ${family} build failed`);
            const msg = `[theme-loader] enhance.ts of ${family} does not compile:\n${e.message}`;
            return send(res, 200, `console.error(${JSON.stringify(msg)});\nexport default undefined;`, { "content-type": TYPES[".js"] });
        }
    }
    if (path.startsWith(`${DEV_BASE}themes/`)) {
        const p = within(THEMES_DIR, path.slice(`${DEV_BASE}themes/`.length));
        if (!p || !existsSync(p) || !statSync(p).isFile()) return send(res, 404, "not found");
        if (p.endsWith(".css")) return send(res, 200, devCss(readFileSync(p, "utf8")), { "content-type": TYPES[".css"] });
        return sendFile(res, p, NO_STORE);
    }

    // Element static files
    let p = within(ELEMENT_DIR, path === "/" ? "index.html" : path);
    if (!p || !existsSync(p) || statSync(p).isDirectory()) {
        p = p && existsSync(join(p, "index.html")) ? join(p, "index.html") : null;
    }
    if (!p) return send(res, 404, "not found");
    const cache = /\.(html|json)$/.test(p) ? NO_STORE : { "cache-control": "public, max-age=3600" };
    return sendFile(res, p, cache);
}

if (!existsSync(join(ELEMENT_DIR, "index.html"))) {
    console.error(`Element ${ELEMENT_VERSION} not found in ${ELEMENT_DIR}; run "npm run dev" (dev/start.sh downloads it).`);
    process.exit(2);
}

process.on("uncaughtException", (e) => log("uncaught", e));
process.on("unhandledRejection", (e) => log("unhandled rejection", e));

const server = createServer((req, res) => {
    handle(req, res).catch((e) => {
        log("request failed", req.url, e);
        try {
            send(res, 500, "internal error");
        } catch {
            /* already sent */
        }
    });
});
server.keepAliveTimeout = 5000;
server.on("error", (e) => {
    console.error("server error", e.message);
    process.exit(e.code === "EADDRINUSE" ? 3 : 1);
});
server.listen(PORT, HOST, () => log(`theme-loader dev server on http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}/ (themes: ${THEMES_DIR})`));
for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => server.close(() => process.exit(0)));
