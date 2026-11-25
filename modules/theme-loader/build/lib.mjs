// Shared by build.mjs, check.mjs and dev/server.mjs: discover theme families, validate manifests and CSS,
// aggregate the registry (dev: live paths; prod: flattened, versioned files).
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

export const LOADER_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const REPO_DIR = resolve(LOADER_DIR, "..");
export const THEMES_DIR = join(REPO_DIR, "themes");

const MODES = new Set(["light", "dark", "daylight"]);
const BASES = new Set(["light", "dark"]);
const STAGE_RE = /^(pure|past|future|usable|exciting|comic|cyberpunk|crossover|invisible|unreadable|level-\d+)$/;
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FAMILY_RE = /^_?[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
/** Statements whose children are not style rules. */
const NON_RULE_AT = new Set(["keyframes", "-webkit-keyframes", "font-face", "property", "counter-style", "page", "font-feature-values"]);

/** Strips // and /* *\/ comments outside strings (manifests may be JSONC like the contract example). */
export function stripJsonComments(text) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            let j = i + 1;
            while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
            out += text.slice(i, j + 1);
            i = j;
        } else if (c === "/" && text[i + 1] === "/") {
            while (i < text.length && text[i] !== "\n") i++;
            out += "\n";
        } else if (c === "/" && text[i + 1] === "*") {
            i += 2;
            while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
            i++;
        } else out += c;
    }
    return out.replace(/,(\s*[}\]])/g, "$1");
}

export function listFamilies() {
    if (!existsSync(THEMES_DIR)) return [];
    return readdirSync(THEMES_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(join(THEMES_DIR, d.name, "themes.json")))
        .map((d) => d.name)
        .sort((a, b) => (a.startsWith("_") - b.startsWith("_")) || a.localeCompare(b));
}

export const sha = (buf) => createHash("sha256").update(buf).digest("hex").slice(0, 10);

/** Safe path inside a family dir (no .., no absolute). */
function inside(family, rel) {
    if (typeof rel !== "string" || !rel || rel.startsWith("/") || rel.includes("\\")) return null;
    const abs = resolve(THEMES_DIR, family, rel);
    return abs.startsWith(resolve(THEMES_DIR, family) + sep) ? abs : null;
}

/**
 * Resolves an asset reference as written in CSS/manifests to {family, path}:
 *   "assets/x.woff2"            -> own family
 *   "@win311/assets/x.woff2"    -> another family's assets (contract §3, ADDED)
 */
export function parseAssetRef(family, ref) {
    const m = /^@([^/]+)\/(.+)$/.exec(ref);
    if (m) return { family: m[1], path: m[2], cross: true };
    return { family, path: ref.replace(/^\.\//, ""), cross: false };
}

/** Flattened production name: "<family>--<path below assets/, / -> -->". */
export function flatName(family, path) {
    return `${family}--${path.replace(/^assets\//, "").replace(/\//g, "--")}`;
}

export function listAssets(family) {
    const root = join(THEMES_DIR, family, "assets");
    const out = [];
    const walk = (d) => {
        if (!existsSync(d)) return;
        for (const e of readdirSync(d, { withFileTypes: true })) {
            if (e.name.startsWith(".")) continue;
            const p = join(d, e.name);
            if (e.isDirectory()) walk(p);
            else out.push(relative(join(THEMES_DIR, family), p).split(sep).join("/"));
        }
    };
    walk(root);
    return out;
}

const URL_RE = /url\(\s*(['"]?)([^'")]*)\1\s*\)/g;

/** All url() references in a CSS text that point into theme assets (relative or @family). */
export function cssAssetRefs(css) {
    const refs = [];
    for (const m of css.matchAll(URL_RE)) {
        const r = m[2].trim();
        if (!r || /^(data:|https?:|blob:|#|\/\/|\/)/i.test(r)) continue;
        refs.push(r);
    }
    return refs;
}

/** Replaces url() asset references using fn(ref) -> newUrl | null (null: keep). */
export function rewriteCssUrls(css, fn) {
    return css.replace(URL_RE, (m, _q, ref) => {
        const r = ref.trim();
        if (!r || /^(data:|https?:|blob:|#|\/\/|\/)/i.test(r)) return m;
        const n = fn(r);
        return n ? `url("${n}")` : m;
    });
}

function scopeOf(selector) {
    const m = /^html\[\s*data-tl-(theme|family)\s*=\s*(["']?)([^"'\]\s]+)\2\s*(?:[is]\s*)?\]/.exec(selector);
    return m ? { kind: m[1], value: m[3] } : null;
}

/** Checks the scoping rule (CONTRACT §3) and other CSS constraints. Returns problems. */
export function checkCss(family, file, css, variantIds) {
    const problems = [];
    const where = `${file}`;
    let root;
    try {
        root = postcss.parse(css, { from: file });
    } catch (e) {
        return [{ level: "error", message: `${where}: CSS syntax error: ${e.reason ?? e.message} (line ${e.line ?? "?"})` }];
    }
    const allowed = (sel) => {
        const s = scopeOf(sel);
        if (!s) return false;
        return s.kind === "family" ? s.value === family : variantIds.has(s.value);
    };
    const visit = (container) => {
        container.each((node) => {
            if (node.type === "atrule") {
                const name = node.name.toLowerCase();
                if (name === "import") {
                    problems.push({ level: "error", message: `${where}:${node.source?.start?.line}: @import is not allowed (CSP/flat deploy); list files in "css" instead` });
                } else if (name === "layer") {
                    if (node.params.trim() !== "tl-important") {
                        problems.push({ level: "error", message: `${where}:${node.source?.start?.line}: @layer ${node.params} — theme CSS must be unlayered (only "@layer tl-important { … }" is allowed)` });
                    } else if (node.nodes) visit(node);
                } else if (NON_RULE_AT.has(name)) {
                    // no selectors inside
                } else if (node.nodes) visit(node); // @media, @supports, @container, @scope …
            } else if (node.type === "rule") {
                let selectors;
                try {
                    selectors = [];
                    selectorParser((s) => s.each((sel) => selectors.push(String(sel).trim()))).processSync(node.selector);
                } catch {
                    selectors = node.selector.split(",").map((s) => s.trim());
                }
                for (const sel of selectors) {
                    if (!allowed(sel)) {
                        problems.push({
                            level: "error",
                            message: `${where}:${node.source?.start?.line}: selector "${sel.slice(0, 120)}" must start with html[data-tl-theme="<one of ${[...variantIds].join(", ")}>"] or html[data-tl-family="${family}"]`,
                        });
                    }
                }
                // nested rules inside a scoped rule are scoped by construction
            }
        });
    };
    visit(root);
    return problems;
}

function readJson(path) {
    return JSON.parse(stripJsonComments(readFileSync(path, "utf8")));
}

/**
 * Reads and validates every family. Returns { families: [{family, manifest, problems}], problems: [...] }.
 * Problems: { family, level: "error"|"warning", message }.
 */
export function loadAll() {
    const families = [];
    const problems = [];
    const seen = new Map();
    for (const family of listFamilies()) {
        const add = (level, message) => problems.push({ family, level, message });
        let manifest;
        try {
            manifest = readJson(join(THEMES_DIR, family, "themes.json"));
        } catch (e) {
            add("error", `themes.json: ${e.message}`);
            continue;
        }
        if (!FAMILY_RE.test(family)) add("warning", `family directory name "${family}" should be kebab-case`);
        if (manifest.family !== family) add("error", `themes.json "family" is "${manifest.family}", expected "${family}" (the directory name)`);
        if (!Array.isArray(manifest.variants)) {
            add("error", `themes.json: "variants" must be an array`);
            continue;
        }
        const ids = new Set(manifest.variants.map((v) => v && v.id).filter((id) => typeof id === "string"));
        const ok = [];
        manifest.variants.forEach((v, i) => {
            const at = `variant ${v?.id ?? `#${i}`}`;
            if (!v || typeof v !== "object") return add("error", `${at}: not an object`);
            if (typeof v.id !== "string" || !ID_RE.test(v.id)) return add("error", `${at}: "id" must be kebab-case`);
            if (seen.has(v.id)) return add("error", `${at}: id already used by family ${seen.get(v.id)}`);
            seen.set(v.id, family);
            if (!v.name || (typeof v.name !== "string" && typeof v.name !== "object")) add("error", `${at}: "name" missing`);
            if (!MODES.has(v.mode)) add("error", `${at}: "mode" must be light|dark|daylight`);
            if (!BASES.has(v.base)) add("error", `${at}: "base" must be light|dark`);
            if (typeof v.stage !== "string" || !STAGE_RE.test(v.stage)) add("warning", `${at}: unknown stage "${v.stage}"`);
            for (const k of ["seriousness", "hype"]) {
                if (v[k] !== undefined && !(typeof v[k] === "number" && v[k] >= 0 && v[k] <= 10)) add("warning", `${at}: "${k}" should be 0–10`);
            }
            if (v.css !== undefined && !Array.isArray(v.css)) add("error", `${at}: "css" must be an array`);
            for (const f of v.css ?? []) {
                const abs = inside(family, f);
                if (!abs || !existsSync(abs)) add("error", `${at}: css file "${f}" not found`);
                else if (!/\.css$/.test(f)) add("error", `${at}: css file "${f}" must end in .css`);
            }
            for (const font of v.fonts ?? []) {
                if (!font || typeof font.family !== "string") {
                    add("error", `${at}: every font needs a "family"`);
                    continue;
                }
                if (font.file !== undefined) {
                    const r = parseAssetRef(family, font.file);
                    const abs = inside(r.family, r.path);
                    if (!abs || !existsSync(abs)) add("error", `${at}: font file "${font.file}" not found`);
                } else if (!font.local?.length) add("error", `${at}: font "${font.family}" needs "file" or "local"`);
            }
            if (v.tokens !== undefined) {
                if (typeof v.tokens !== "object" || Array.isArray(v.tokens)) add("error", `${at}: "tokens" must be an object`);
                else
                    for (const [k, val] of Object.entries(v.tokens)) {
                        if (!/^--[A-Za-z0-9_-]+$/.test(k) || typeof val !== "string" || /[{};<>]/.test(val)) add("error", `${at}: invalid token ${k}`);
                    }
            }
            if (v.enhance && !existsSync(join(THEMES_DIR, family, "enhance.ts"))) add("error", `${at}: "enhance": true but enhance.ts is missing`);
            if (v.mode === "daylight") {
                if (!Array.isArray(v.schedule) || !v.schedule.length) add("error", `${at}: daylight variants need a "schedule"`);
                else
                    for (const p of v.schedule) {
                        if (!p || !TIME_RE.test(p.from ?? "") || typeof p.phase !== "string" || !/^[a-z0-9-]+$/.test(p.phase)) {
                            add("error", `${at}: invalid schedule entry ${JSON.stringify(p)}`);
                        } else if (p.base !== undefined && !BASES.has(p.base)) add("error", `${at}: schedule base must be light|dark`);
                    }
            } else if (v.schedule) add("warning", `${at}: "schedule" is ignored unless mode is daylight`);
            ok.push(v);
        });
        // CSS checks, once per file.
        const files = new Set(ok.flatMap((v) => (Array.isArray(v.css) ? v.css : [])));
        for (const f of files) {
            const abs = inside(family, f);
            if (!abs || !existsSync(abs)) continue;
            const css = readFileSync(abs, "utf8");
            for (const p of checkCss(family, f, css, ids)) add(p.level, p.message);
            for (const ref of cssAssetRefs(css)) {
                const r = parseAssetRef(family, ref.split(/[?#]/)[0]);
                if (r.path.includes("..")) {
                    add("error", `${f}: url("${ref}") must not use ".." (use assets/… or @family/assets/…)`);
                    continue;
                }
                if (!r.path.startsWith("assets/")) {
                    add("error", `${f}: url("${ref}") must point into assets/ (or @family/assets/)`);
                    continue;
                }
                const a = inside(r.family, r.path);
                if (!a || !existsSync(a)) add("error", `${f}: url("${ref}") not found`);
            }
        }
        families.push({ family, manifest: { ...manifest, variants: ok }, hasEnhancer: existsSync(join(THEMES_DIR, family, "enhance.ts")) });
    }
    return { families, problems };
}

/**
 * Aggregated registry.
 *   mode "dev":  css/font URLs relative to the dev base ("themes/<family>/<file>").
 *   mode "prod": flattened names with ?v=<hash>; `prodFiles` (flat name -> versioned url) must be given.
 */
export function aggregate(loaded, { mode, showHidden = false, cssUrls = {}, assetUrls = {} }) {
    const families = [];
    const variants = [];
    for (const { family, manifest, hasEnhancer } of loaded.families) {
        const hidden = family.startsWith("_") || manifest.hidden === true;
        const assetsMap = {};
        if (mode === "prod") for (const p of listAssets(family)) assetsMap[p] = assetUrls[`${family}/${p}`];
        families.push({
            family,
            name: manifest.name ?? family,
            hidden: hidden && !showHidden,
            enhance: hasEnhancer,
            ...(mode === "prod" ? { assets: assetsMap } : {}),
        });
        for (const v of manifest.variants) {
            const fontUrl = (file) => {
                const r = parseAssetRef(family, file);
                return mode === "dev" ? `themes/${r.family}/${r.path}` : assetUrls[`${r.family}/${r.path}`];
            };
            variants.push({
                ...v,
                family,
                familyName: manifest.name ?? family,
                hidden: (hidden || v.hidden === true) && !showHidden,
                enhance: v.enhance === true,
                schedule: v.mode === "daylight" ? v.schedule : null,
                tokens: v.tokens ?? {},
                css: (v.css ?? []).map((f) => (mode === "dev" ? `themes/${family}/${f}` : cssUrls[`${family}/${f}`])),
                fonts: (v.fonts ?? []).map(({ file, ...rest }) => (file ? { ...rest, url: fontUrl(file) } : rest)),
            });
        }
    }
    return { version: 1, built: new Date().toISOString(), families, variants };
}

export function fileMtime(p) {
    try {
        return statSync(p).mtimeMs;
    } catch {
        return 0;
    }
}

export function formatProblems(problems) {
    return problems.map((p) => `  ${p.level === "error" ? "ERROR" : "warn "} [${p.family}] ${p.message}`).join("\n");
}
