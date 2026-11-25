// Production build -> dist/ (one flat directory, like loader/dist; the MDAD deploy only supports flat module dirs).
//   dist/index.js (+ .map)   the module
//   dist/files.txt           every file, for the deploy's `files:` list
import { mkdirSync, readdirSync, rmSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildModule, MODULE_DIR } from "./bundle.mjs";

const DIST = join(MODULE_DIR, "dist");
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
const r = await buildModule({ outfile: join(DIST, "index.js"), minify: true });
if (r.errors.length) {
    console.error(r.errors);
    process.exit(1);
}
const files = readdirSync(DIST).filter((f) => f !== "files.txt").sort();
writeFileSync(join(DIST, "files.txt"), files.join("\n") + "\n");
for (const f of files) console.log(`dist/${f}  ${(statSync(join(DIST, f)).size / 1024).toFixed(1)} kB`);
