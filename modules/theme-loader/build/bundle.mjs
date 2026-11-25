// esbuild setup shared by the production build and the dev server.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as esbuild from "esbuild";
import { LOADER_DIR, THEMES_DIR } from "./lib.mjs";

const pkg = JSON.parse(readFileSync(join(LOADER_DIR, "package.json"), "utf8"));
export const BANNER = `/*! ${pkg.name} ${pkg.version} */`;

/** "react" -> the host's window.React (Element's own instance). */
const reactGlobal = {
    name: "react-global",
    setup(b) {
        b.onResolve({ filter: /^react(\/jsx-runtime)?$/ }, (a) => ({ path: a.path, namespace: "react-global" }));
        b.onLoad({ filter: /.*/, namespace: "react-global" }, () => ({
            contents: "module.exports = window.React;",
            loader: "js",
        }));
        // Type-only package; anything imported at runtime from it must not be bundled.
        b.onResolve({ filter: /^@element-hq\/element-web-module-api$/ }, () => ({ path: "module-api", namespace: "module-api-stub" }));
        b.onLoad({ filter: /.*/, namespace: "module-api-stub" }, () => ({ contents: "export {};", loader: "js" }));
    },
};

function virtuals({ registry, enhancerFamilies }) {
    return {
        name: "tl-virtual",
        setup(b) {
            b.onResolve({ filter: /^tl:(registry|enhancers)$/ }, (a) => ({ path: a.path, namespace: "tl-virtual" }));
            b.onLoad({ filter: /.*/, namespace: "tl-virtual" }, (a) => {
                if (a.path === "tl:registry") return { contents: `export default ${JSON.stringify(registry ?? null)};`, loader: "js" };
                const imports = enhancerFamilies.map((f, i) => `import * as e${i} from ${JSON.stringify(join(THEMES_DIR, f, "enhance.ts"))};`);
                const map = enhancerFamilies.map((f, i) => `${JSON.stringify(f)}: e${i}`);
                return { contents: `${imports.join("\n")}\nexport default { ${map.join(", ")} };`, loader: "js", resolveDir: LOADER_DIR };
            });
        },
    };
}

export const common = {
    bundle: true,
    format: "esm",
    target: "es2022",
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "silent",
    nodePaths: [join(LOADER_DIR, "node_modules")],
};

/** Builds the loader. `registry`: baked-in registry (null in dev); `enhancerFamilies`: families to bundle. */
export async function buildLoader({ registry = null, enhancerFamilies = [], outfile, minify = false, write = true }) {
    return esbuild.build({
        ...common,
        entryPoints: [join(LOADER_DIR, "src/index.tsx")],
        outfile,
        write,
        minify,
        sourcemap: write ? true : "inline",
        banner: { js: BANNER },
        plugins: [reactGlobal, virtuals({ registry, enhancerFamilies })],
        metafile: true,
    });
}

/** Dev: one family's enhancer as a standalone ES module. */
export async function buildEnhancer(family) {
    const r = await esbuild.build({
        ...common,
        entryPoints: [join(THEMES_DIR, family, "enhance.ts")],
        write: false,
        sourcemap: "inline",
        outfile: `${family}.js`,
        plugins: [reactGlobal],
    });
    return r.outputFiles[0].text;
}
