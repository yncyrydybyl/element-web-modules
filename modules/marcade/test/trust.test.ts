import { describe, expect, it, vi } from "vitest";
import type { Api } from "@element-hq/element-web-module-api";
import { parseConfig } from "../src/config";
import { STORE_CAPABILITIES } from "../src/store";
import { approveCapabilities, isApprovedWidget, registerTrust } from "../src/trust";

const cfg = parseConfig(undefined);
const desc = (templateUrl: string) => ({ id: "w", templateUrl, creatorUserId: "@a:x", type: "m.custom", origin: new URL(templateUrl).origin });
const STORE = "https://marcade.store/apps/de.minagawa.marcade-store/0.1.1/#/?roomId=$matrix_room_id";
const EVIL = "https://marcade.store/apps/de.minagawa.marcade-store-evil/0.1.1/";

describe("approvals", () => {
  it("only for widgets under the prefixes", () => {
    expect(isApprovedWidget(desc(STORE), cfg)).toBe(true);
    expect(isApprovedWidget(desc(EVIL), cfg)).toBe(false);
    expect(isApprovedWidget(desc("https://marcade.store/apps/de.minagawa.pdf-viewer/0.1.0/"), cfg)).toBe(false);
  });
  it("capabilities: the store's list only, never extras", () => {
    const req = new Set([...STORE_CAPABILITIES, "org.matrix.msc2762.timeline:*", "org.matrix.msc2762.send.event:m.room.message"]);
    expect(approveCapabilities(desc(STORE), req, cfg)).toEqual(new Set(STORE_CAPABILITIES));
    expect(approveCapabilities(desc(EVIL), req, cfg)).toBeUndefined();
    expect(approveCapabilities(desc(STORE), new Set(["org.matrix.msc2762.timeline:*"]), cfg)).toBeUndefined();
  });
  it("registers preload + capabilities, identity only when configured, survives a taken slot", () => {
    const mk = () => ({
      registerPreloadApprover: vi.fn(),
      registerIdentityApprover: vi.fn(),
      registerCapabilitiesApprover: vi.fn(() => {
        throw new Error("already registered");
      }),
    });
    const lc = mk();
    registerTrust({ widgetLifecycle: lc } as unknown as Api, cfg);
    expect(lc.registerPreloadApprover).toHaveBeenCalledOnce();
    expect(lc.registerIdentityApprover).not.toHaveBeenCalled();
    const preload = lc.registerPreloadApprover.mock.calls[0][0] as (w: unknown) => unknown;
    expect(preload(desc(STORE))).toBe(true);
    expect(preload(desc(EVIL))).toBeUndefined();

    const lc2 = mk();
    registerTrust({ widgetLifecycle: lc2 } as unknown as Api, parseConfig({ approve_identity: true }));
    const identity = lc2.registerIdentityApprover.mock.calls[0][0] as (w: unknown) => unknown;
    expect(identity(desc(STORE))).toBe(true);
    expect(identity(desc(EVIL))).toBeUndefined();

    const lc3 = mk();
    registerTrust({ widgetLifecycle: lc3 } as unknown as Api, parseConfig({ approve_prefixes: [] }));
    expect(lc3.registerPreloadApprover).not.toHaveBeenCalled();
    expect(() => registerTrust({} as Api, cfg)).not.toThrow();
  });
});
