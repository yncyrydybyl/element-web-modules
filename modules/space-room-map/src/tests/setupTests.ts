import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
    cleanup();
    localStorage.clear();
});

// sigma reads WebGL constants when it's imported; jsdom has no WebGL. The map itself then fails
// to start (and says so), which leaves the result list to test.
globalThis.WebGLRenderingContext ??= { UNSIGNED_BYTE: 5121, FLOAT: 5126, POINTS: 0, TRIANGLES: 4, LINES: 1 } as unknown as typeof WebGLRenderingContext;
globalThis.WebGL2RenderingContext ??= globalThis.WebGLRenderingContext as unknown as typeof WebGL2RenderingContext;

// @sigma/node-image creates two programs when it's imported, each asking a fresh WebGL context for
// its texture size. The build drops those (the package has no side effects); unbundled tests don't.
vi.mock("@sigma/node-image", () => ({
    createNodeImageProgram: () => {
        throw new Error("no WebGL");
    },
}));
