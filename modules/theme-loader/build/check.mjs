// Validates every themes/<family> (manifest, files, CSS scoping) without building.
//   node build/check.mjs [family …]
import { formatProblems, loadAll } from "./lib.mjs";

const only = process.argv.slice(2);
const { families, problems } = loadAll();
const shown = only.length ? problems.filter((p) => only.includes(p.family)) : problems;
const errors = shown.filter((p) => p.level === "error").length;
if (shown.length) console.log(formatProblems(shown));
console.log(`${families.length} families, ${families.reduce((n, f) => n + f.manifest.variants.length, 0)} variants, ${errors} error(s), ${shown.length - errors} warning(s)`);
process.exit(errors ? 1 : 0);
