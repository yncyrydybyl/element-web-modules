// Production build -> lib/ (one flat directory, like theme-loader/lib; the MDAD deploy only supports flat module dirs).
//   lib/index.js (+ .map)   the module
//   lib/files.txt           every file, for the deploy's `files:` list
import { mkdirSync, readdirSync, rmSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildModule, MODULE_DIR } from "./bundle.mjs";

const DIST = join(MODULE_DIR, "lib");
// Empty the directory instead of replacing it: e2e/stack.sh bind-mounts it into the Element container.
mkdirSync(DIST, { recursive: true });
for (const f of readdirSync(DIST)) rmSync(join(DIST, f), { recursive: true, force: true });
const r = await buildModule({ outfile: join(DIST, "index.js"), minify: true });
if (r.errors.length) {
    console.error(r.errors);
    process.exit(1);
}
const files = readdirSync(DIST).filter((f) => f !== "files.txt").sort();
writeFileSync(join(DIST, "files.txt"), files.join("\n") + "\n");
for (const f of files) console.log(`lib/${f}  ${(statSync(join(DIST, f)).size / 1024).toFixed(1)} kB`);
