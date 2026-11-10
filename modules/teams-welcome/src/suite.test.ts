import { afterEach, describe, expect, it } from "vitest";

import { isSiblingLoaded, registerInSuite, REGISTRY_GLOBAL } from "./suite";

afterEach(() => {
    delete (window as unknown as Record<string, unknown>)[REGISTRY_GLOBAL];
    document.head.innerHTML = "";
});

describe("sibling detection", () => {
    it("finds modules in the shared registry", () => {
        expect(isSiblingLoaded("files-hub")).toBe(false);
        registerInSuite("files-hub", "0.1.0");
        expect(isSiblingLoaded("files-hub")).toBe(true);
        expect((window as unknown as Record<string, Record<string, unknown>>)[REGISTRY_GLOBAL]["files-hub"]).toEqual({ version: "0.1.0" });
    });

    it("keeps other modules' registrations", () => {
        (window as unknown as Record<string, unknown>)[REGISTRY_GLOBAL] = { activity: { version: "1.0.0" } };
        registerInSuite("teams-welcome", "0.1.0");
        expect(isSiblingLoaded("activity")).toBe(true);
        expect(isSiblingLoaded("teams-welcome")).toBe(true);
    });

    it("falls back to the module's style element (teamwork, keyboard-shortcuts)", () => {
        const style = document.createElement("style");
        style.id = "de-datanauten-teamwork-style";
        document.head.appendChild(style);
        expect(isSiblingLoaded("teamwork")).toBe(true);
        expect(isSiblingLoaded("keyboard-shortcuts")).toBe(false);
    });
});
