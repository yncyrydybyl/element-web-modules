import type { Api } from "@element-hq/element-web-module-api";
import { afterEach, expect, it } from "vitest";

import { MultiTabModule } from "./index";

afterEach(() => {
    delete (window as { __multiTab?: unknown }).__multiTab;
});

it("runs only the first instance in a page (Element Pro lists each module twice)", async () => {
    const first = new MultiTabModule({} as Api);
    const second = new MultiTabModule({} as Api);
    await Promise.all([first.load(), second.load()]);
    expect((window as { __multiTab?: unknown }).__multiTab).toBe(first.status);
    // jsdom has no Element: the first instance looked and turned itself off; the second never looked.
    expect(first.status.role).toBe("off");
    expect(second.status.role).toBe("pending");
});
