// Production build: validate all families, flatten CSS + assets into dist/ (<family>--<file>), write
// dist/themes.json and bundle loader + all enhancers into dist/index.js.
//   node build/build.mjs [--show-demo] [--out <dir>] [--families a,b]   (--families: build only those, for testing)
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildLoader } from "./bundle.mjs";
import { aggregate, flatName, formatProblems, listAssets, LOADER_DIR, loadAll, parseAssetRef, rewriteCssUrls, sha, THEMES_DIR } from "./lib.mjs";

const args = process.argv.slice(2);
const showHidden = args.includes("--show-demo");
const outIdx = args.indexOf("--out");
const OUT = outIdx >= 0 ? args[outIdx + 1] : join(LOADER_DIR, "dist");

const famIdx = args.indexOf("--families");
const onlyFamilies = famIdx >= 0 ? args[famIdx + 1].split(",") : null;
const loaded = loadAll();
if (onlyFamilies) {
    loaded.families = loaded.families.filter((f) => onlyFamilies.includes(f.family));
    loaded.problems = loaded.problems.filter((p) => onlyFamilies.includes(p.family));
}
const errors = loaded.problems.filter((p) => p.level === "error");
const warnings = loaded.problems.filter((p) => p.level === "warning");
if (warnings.length) console.warn(`theme warnings:\n${formatProblems(warnings)}\n`);
if (errors.length) {
    console.error(`theme build FAILED, ${errors.length} error(s):\n${formatProblems(errors)}`);
    process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const written = new Map(); // flat name -> source, to catch collisions
const emit = (name, src, data) => {
    if (written.has(name) && written.get(name) !== src) {
        console.error(`theme build FAILED: ${src} and ${written.get(name)} both flatten to ${name}`);
        process.exit(1);
    }
    written.set(name, src);
    if (data === undefined) copyFileSync(src, join(OUT, name));
    else writeFileSync(join(OUT, name), data);
};

// 1. assets (all of them: enhancers may use files the CSS doesn't reference)
const assetUrls = {};
for (const { family } of loaded.families) {
    for (const p of listAssets(family)) {
        const src = join(THEMES_DIR, family, p);
        const name = flatName(family, p);
        emit(name, src);
        assetUrls[`${family}/${p}`] = `${name}?v=${sha(readFileSync(src))}`;
    }
}

// 2. CSS, URLs rewritten to the flat, versioned names (relative: CSS sits next to them)
const cssUrls = {};
for (const { family, manifest } of loaded.families) {
    for (const f of new Set(manifest.variants.flatMap((v) => v.css ?? []))) {
        const src = join(THEMES_DIR, family, f);
        const css = rewriteCssUrls(readFileSync(src, "utf8"), (ref) => {
            const [path] = ref.split(/[?#]/);
            const r = parseAssetRef(family, path);
            return assetUrls[`${r.family}/${r.path}`] ?? null;
        });
        const name = flatName(family, f);
        emit(name, src, css);
        cssUrls[`${family}/${f}`] = `${name}?v=${sha(css)}`;
    }
}

// 3. registry + loader bundle
const registry = aggregate(loaded, { mode: "prod", showHidden, cssUrls, assetUrls });
writeFileSync(join(OUT, "themes.json"), JSON.stringify(registry, null, 2));
const enhancerFamilies = loaded.families.filter((f) => f.hasEnhancer && f.manifest.variants.some((v) => v.enhance)).map((f) => f.family);
try {
    await buildLoader({ registry, enhancerFamilies, outfile: join(OUT, "index.js"), minify: true });
} catch (e) {
    console.error("theme build FAILED: bundling the loader/enhancers failed\n", e.message);
    process.exit(1);
}

// 4. file list for the deploy (MDAD needs every file listed; flat directory)
const files = ["index.js", "index.js.map", "themes.json", ...[...written.keys()].sort()];
writeFileSync(join(OUT, "files.txt"), files.join("\n") + "\n");
const kb = (n) => `${(n / 1024).toFixed(1)} kB`;
console.log(
    `built ${OUT}\n  ${registry.variants.length} variants in ${registry.families.length} families` +
        ` (${registry.variants.filter((v) => v.hidden).length} hidden), ${enhancerFamilies.length} enhancer(s)\n` +
        `  index.js ${kb(readFileSync(join(OUT, "index.js")).length)}, ${files.length} files (see files.txt)`,
);
