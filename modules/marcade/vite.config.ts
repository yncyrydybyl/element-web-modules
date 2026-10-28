import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// One ES module that Element loads with `import()` (config.json "modules"). React is not bundled:
// Element puts its own React on window.React (module API contract), src/react.ts re-exports it.
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
  },
  test: { environment: "node", include: ["test/**/*.test.ts"] },
});
