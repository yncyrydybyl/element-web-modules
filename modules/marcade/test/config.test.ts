import { describe, expect, it } from "vitest";
import { DEFAULT_STORE_URL, STORE_URL_TEMPLATE, normalizePrefix, parseConfig, prefixFromStoreUrl, urlHasPrefix } from "../src/config";

const PREFIX = "https://marcade.store/apps/de.minagawa.marcade-store/";

describe("parseConfig", () => {
  it("works with no config at all", () => {
    for (const raw of [undefined, null, 3, "x", [], {}]) {
      const c = parseConfig(raw);
      expect(c.storeUrl).toBe(DEFAULT_STORE_URL);
      expect(c.widgetUrl).toBe(DEFAULT_STORE_URL + STORE_URL_TEMPLATE);
      expect(c.storePrefix).toBe(PREFIX);
      expect(c.approvePrefixes).toEqual([PREFIX]);
      expect([c.approveIdentity, c.hideIntegrations, c.showInDms, c.openIn]).toEqual([false, false, true, "right"]);
    }
  });
  it("takes the documented keys", () => {
    const c = parseConfig({
      store_url: "https://marcade.store/apps/de.minagawa.marcade-store/0.2.0/",
      approve_prefixes: ["https://marcade.store/apps/", "https://widgets.example.org"],
      hide_integrations: true,
      show_in_dms: false,
      approve_identity: true,
      open_in: "top",
    });
    expect(c.widgetUrl).toBe("https://marcade.store/apps/de.minagawa.marcade-store/0.2.0/" + STORE_URL_TEMPLATE);
    expect(c.storePrefix).toBe(PREFIX);
    expect(c.approvePrefixes).toEqual(["https://marcade.store/apps/", "https://widgets.example.org/"]);
    expect([c.approveIdentity, c.hideIntegrations, c.showInDms, c.openIn]).toEqual([true, true, false, "top"]);
  });
  it("rejects non-http store URLs and junk prefixes", () => {
    expect(parseConfig({ store_url: "javascript:alert(1)" }).storeUrl).toBe(DEFAULT_STORE_URL);
    expect(parseConfig({ approve_prefixes: ["ftp://x/", 5, "", "https://u:p@marcade.store/"] }).approvePrefixes).toEqual([]);
    expect(parseConfig({ open_in: "center" }).openIn).toBe("right");
    expect(parseConfig({ hide_integrations: "yes" }).hideIntegrations).toBe(false);
  });
  it("adds a trailing slash to a folder store URL, keeps an own fragment", () => {
    expect(parseConfig({ store_url: "https://s.example/store/1.0.0" }).storeUrl).toBe("https://s.example/store/1.0.0/");
    const c = parseConfig({ store_url: "https://s.example/store/1.0.0/index.html#/?layout=full" });
    expect(c.widgetUrl).toBe("https://s.example/store/1.0.0/index.html#/?layout=full");
    expect(c.storePrefix).toBe("https://s.example/store/");
  });
  it("never uses a store_prefix that would not find the widget it adds", () => {
    const c = parseConfig({ store_url: "https://a.example/store/0.1.0/", store_prefix: "https://b.example/" });
    expect(c.storePrefix).toBe("https://a.example/store/");
  });
});

describe("prefixes", () => {
  it("normalizes", () => {
    expect(normalizePrefix("https://marcade.store")).toBe("https://marcade.store/");
    expect(normalizePrefix("https://marcade.store/apps/x?y#z")).toBe("https://marcade.store/apps/x/");
    expect(normalizePrefix("data:text/html,hi")).toBeUndefined();
  });
  it("derives the store prefix from a versioned store URL", () => {
    expect(prefixFromStoreUrl(DEFAULT_STORE_URL)).toBe(PREFIX);
    expect(prefixFromStoreUrl("https://marcade.store/apps/de.minagawa.marcade-store/latest/")).toBe(PREFIX);
    expect(prefixFromStoreUrl("https://marcade.store/apps/de.minagawa.marcade-store/v1.2.3-rc.1/")).toBe(PREFIX);
    expect(prefixFromStoreUrl("https://s.example/store/")).toBe("https://s.example/store/");
  });
  it("matches by parsed origin + path only", () => {
    const ok = [
      `${PREFIX}0.1.1/`,
      `${PREFIX}0.1.1/#/?roomId=$matrix_room_id&userId=$matrix_user_id`,
      `${PREFIX}0.1.0/index.html?widgetId=x`,
      "https://marcade.store/apps/de.minagawa.marcade-store",
    ];
    const bad = [
      "https://marcade.store/apps/de.minagawa.marcade-store-evil/0.1.1/",
      "https://marcade.store.evil.example/apps/de.minagawa.marcade-store/",
      "https://marcade.store@evil.example/apps/de.minagawa.marcade-store/",
      `${PREFIX}../other-app/`,
      "http://marcade.store/apps/de.minagawa.marcade-store/0.1.1/",
      `https://evil.example/?u=${PREFIX}`,
      "javascript:alert(1)//https://marcade.store/apps/de.minagawa.marcade-store/",
      "not a url",
      undefined,
    ];
    for (const u of ok) expect(urlHasPrefix(u, PREFIX), u).toBe(true);
    for (const u of bad) expect(urlHasPrefix(u, PREFIX), String(u)).toBe(false);
  });
});
