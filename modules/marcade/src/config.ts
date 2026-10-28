/** Config block in Element's config.json. */
export const CONFIG_KEY = "de.minagawa.marcade_element_module";

export const DEFAULT_STORE_URL = "https://marcade.store/apps/de.minagawa.marcade-store/0.1.1/";

/**
 * Template the store's own `/addwidget` line carries (marcade-store-widget src/lib/params.ts). It lives in the
 * URL fragment, so user and room ids never reach the store's access logs. Element substitutes the `$…` variables
 * when it renders the iframe; the store reads them as a fallback to the Widget API.
 */
export const STORE_URL_TEMPLATE =
  "#/?theme=$org.matrix.msc2873.client_theme&lang=$org.matrix.msc2873.client_language" +
  "&client=$org.matrix.msc2873.client_id&roomId=$matrix_room_id&userId=$matrix_user_id";

export type OpenIn = "right" | "top";

export interface ModuleConfig {
  /** The store build added to rooms (a version folder on marcade.store). */
  storeUrl: string;
  /** What lands in the state event: `storeUrl` plus the template fragment (unless storeUrl has its own fragment). */
  widgetUrl: string;
  /** A room widget whose URL starts with this is "the store" (any version). Always ends with "/". */
  storePrefix: string;
  /** Widget URL prefixes whose widgets get preload + store capabilities (+ identity if enabled) auto-approved. */
  approvePrefixes: string[];
  /** Auto-approve OpenID for those widgets. The store makes no network requests, so off by default. */
  approveIdentity: boolean;
  /** Hide UIComponent.AddIntegrations ("Add widgets, bridges & bots"). */
  hideIntegrations: boolean;
  /** Show the button in DMs too. */
  showInDms: boolean;
  /** Where the store opens: right panel (default) or pinned above the timeline. */
  openIn: OpenIn;
}

/**
 * Normalises a URL prefix: http(s) only, no credentials, query and fragment dropped, path ends with "/"
 * (so ".../marcade-store/" can never match ".../marcade-store-evil/"). Undefined when unusable.
 */
export function normalizePrefix(v: unknown): string | undefined {
  if (typeof v !== "string" || !v.trim()) return undefined;
  let u: URL;
  try {
    u = new URL(v.trim());
  } catch {
    return undefined;
  }
  if ((u.protocol !== "https:" && u.protocol !== "http:") || u.username || u.password) return undefined;
  const path = u.pathname.endsWith("/") ? u.pathname : `${u.pathname}/`;
  return u.origin + path;
}

/** "https://h/apps/x/0.1.1/" → "https://h/apps/x/" (drops a file name and a trailing version or `latest` folder). */
export function prefixFromStoreUrl(storeUrl: string): string {
  const u = new URL(storeUrl);
  // the folder of the URL ("…/0.1.1/index.html" → "…/0.1.1/"), then without a version folder
  const p = u.origin + u.pathname.replace(/[^/]*$/, "");
  return p.replace(/[^/]*\/$/, (seg) => (/^(v?\d+(\.\d+)*([-+][^/]*)?|latest)\/$/.test(seg) ? "" : seg));
}

/**
 * True when `url` (a widget URL, possibly with `$matrix_*` template variables) lies under `prefix`.
 * Compared on the parsed origin + path, so userinfo tricks (`https://marcade.store@evil/`), look-alike hosts
 * and `..` segments cannot sneak past a prefix.
 */
export function urlHasPrefix(url: unknown, prefix: string): boolean {
  if (typeof url !== "string") return false;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  return (u.origin + u.pathname).startsWith(prefix) || u.origin + u.pathname + "/" === prefix;
}

export const urlHasAnyPrefix = (url: unknown, prefixes: readonly string[]) => prefixes.some((p) => urlHasPrefix(url, p));

/** Validates the raw config.json block (never trust its shape). Unknown keys are ignored. */
export function parseConfig(raw: unknown): ModuleConfig {
  const r = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;
  const storeUrlPrefix = normalizePrefix(r.store_url);
  let storeUrl = DEFAULT_STORE_URL;
  if (storeUrlPrefix && typeof r.store_url === "string") {
    // keep the admin's URL as written (it may carry its own fragment); only add a "/" to a bare folder path
    const u = new URL(r.store_url.trim());
    if (!u.pathname.endsWith("/") && !/\.[a-z][a-z0-9]*$/i.test(u.pathname)) u.pathname += "/";
    storeUrl = u.toString();
  } else if (r.store_url !== undefined) {
    console.warn("[marcade-element-module] store_url is not an http(s) URL, using the default");
  }
  const widgetUrl = storeUrl.includes("#") ? storeUrl : storeUrl + STORE_URL_TEMPLATE;

  let storePrefix = normalizePrefix(r.store_prefix) ?? prefixFromStoreUrl(storeUrl);
  if (!urlHasPrefix(widgetUrl, storePrefix)) {
    // the store we add must be found again, or every click would add another one
    console.warn("[marcade-element-module] store_prefix does not cover store_url, using the store_url folder");
    storePrefix = prefixFromStoreUrl(storeUrl);
  }

  const approvePrefixes = Array.isArray(r.approve_prefixes)
    ? [...new Set(r.approve_prefixes.map(normalizePrefix).filter((p): p is string => !!p))]
    : [storePrefix];

  return {
    storeUrl,
    widgetUrl,
    storePrefix,
    approvePrefixes,
    approveIdentity: r.approve_identity === true,
    hideIntegrations: r.hide_integrations === true,
    showInDms: r.show_in_dms !== false,
    openIn: r.open_in === "top" ? "top" : "right",
  };
}
