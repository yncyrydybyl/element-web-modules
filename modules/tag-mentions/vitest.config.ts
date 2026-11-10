import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        // Node 25+ ships its own (file-backed) localStorage global, which hides jsdom's.
        execArgv: ["--no-experimental-webstorage"],
        setupFiles: ["src/tests/setupTests.ts"],
    },
});
