// esbuild setup shared by the production build and the dev server (same approach as loader/build/bundle.mjs).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

export const MODULE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(MODULE_DIR, "package.json"), "utf8"));
export const BANNER = `/*! ${pkg.name} ${pkg.version} */`;

/** The module API package is types only; "react" (if ever imported) is Element's window.React. */
const hostGlobals = {
    name: "host-globals",
    setup(b) {
        b.onResolve({ filter: /^react(\/jsx-runtime)?$/ }, (a) => ({ path: a.path, namespace: "react-global" }));
        b.onLoad({ filter: /.*/, namespace: "react-global" }, () => ({ contents: "module.exports = window.React;", loader: "js" }));
        b.onResolve({ filter: /^@element-hq\/element-web-module-api$/ }, () => ({ path: "module-api", namespace: "module-api-stub" }));
        b.onLoad({ filter: /.*/, namespace: "module-api-stub" }, () => ({ contents: "export {};", loader: "js" }));
    },
};

export async function buildModule({ outfile = "index.js", write = true, minify = false } = {}) {
    return esbuild.build({
        entryPoints: [join(MODULE_DIR, "src/index.ts")],
        outfile,
        write,
        bundle: true,
        format: "esm",
        target: "es2022",
        minify,
        sourcemap: write ? true : "inline",
        banner: { js: BANNER },
        loader: { ".css": "text" },
        define: { "process.env.NODE_ENV": '"production"' },
        logLevel: "silent",
        nodePaths: [join(MODULE_DIR, "node_modules")],
        plugins: [hostGlobals],
        metafile: true,
    });
}
