import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import externalGlobals from "rollup-plugin-external-globals";
import { defineConfig, esmExternalRequirePlugin } from "vite";

/**
 * Mirrors `@element-hq/element-web-module-api/vite.base.ts` (inlined because Node refuses to
 * strip types from .ts files inside node_modules): React is not bundled but taken from the
 * host's `window.React`, so the module renders with Element Web's own React instance.
 */
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { name: string; version: string };

export default defineConfig({
    build: {
        outDir: "lib",
        target: "esnext",
        sourcemap: true,
        minify: true,
        lib: {
            entry: fileURLToPath(new URL("./src/index.tsx", import.meta.url)),
            name: "element-web-module-files-hub",
            fileName: "index",
            formats: ["es"],
        },
        rolldownOptions: {
            plugins: [esmExternalRequirePlugin({ external: ["react"] })],
            // The version on the first line, so the remote-modules settings tab can show it.
            output: { globals: { react: "window.React" }, banner: `/*! ${pkg.name} ${pkg.version} */` },
        },
    },
    plugins: [react(), externalGlobals({ react: "window.React" })],
    define: {
        // Element Web ships a production React build; the JSX runtime must match it.
        "process.env.NODE_ENV": "'production'",
        "process": { env: { NODE_ENV: "production" } },
    },
});
