import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// One ES module that Element loads with `import()` (config.json "modules"). React is not bundled:
// Element puts its own React on window.React (module API contract), src/react.ts re-exports it.
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { name: string; version: string };

export default defineConfig({
  resolve: {
    alias: { react: fileURLToPath(new URL("./src/react.ts", import.meta.url)) },
  },
  esbuild: { jsx: "transform", jsxFactory: "React.createElement", jsxFragment: "React.Fragment" },
  oxc: { jsx: { runtime: "classic", pragma: "React.createElement", pragmaFrag: "React.Fragment" } },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    target: "es2022",
    sourcemap: true,
    lib: { entry: "src/index.tsx", formats: ["es"], fileName: () => "index.js" },
    // The version on the first line, so the remote-modules settings tab can show it.
    rolldownOptions: { output: { banner: `/*! ${pkg.name} ${pkg.version} */` } },
  },
  test: { environment: "node", include: ["test/**/*.test.ts"] },
});
