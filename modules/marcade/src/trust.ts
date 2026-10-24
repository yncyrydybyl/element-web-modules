import type { Api, WidgetDescriptor } from "@element-hq/element-web-module-api";
import { urlHasAnyPrefix, type ModuleConfig } from "./config";
import { STORE_CAPABILITIES } from "./store";

const LOG = "[marcade-element-module]";

/** Is this widget one the admin approved (template URL under an approve prefix)? Nothing else ever is. */
export const isApprovedWidget = (w: Pick<WidgetDescriptor, "templateUrl">, cfg: Pick<ModuleConfig, "approvePrefixes">) =>
  urlHasAnyPrefix(w.templateUrl, cfg.approvePrefixes);

/** The requested capabilities to auto-approve: only the store's own list, only for approved widgets. */
export function approveCapabilities(
  w: Pick<WidgetDescriptor, "templateUrl">,
  requested: ReadonlySet<string>,
  cfg: Pick<ModuleConfig, "approvePrefixes">,
): Set<string> | undefined {
  if (!isApprovedWidget(w, cfg)) return undefined;
  const ok = new Set([...requested].filter((c) => STORE_CAPABILITIES.includes(c)));
  return ok.size ? ok : undefined;
}

/**
 * Module API `widgetLifecycle`: auto-approve preload ("Continue"), the store's capabilities and (if configured)
 * OpenID for widgets under `approve_prefixes`. Returning `undefined` keeps Element's normal consent.
 */
export function registerTrust(api: Api, cfg: ModuleConfig): void {
  const lc = (api as Partial<Api>).widgetLifecycle;
  if (!lc || !cfg.approvePrefixes.length) return;
  // Element allows ONE approver of each kind per app and throws on a second (WidgetLifecycleApi
  // ensureApproverUnset). If another module owns it, keep Element's consent for that kind.
  const tryReg = (kind: string, fn: () => void) => {
    try {
      fn();
    } catch (e) {
      console.warn(`${LOG} ${kind} approver not registered:`, (e as Error).message);
    }
  };
  tryReg("preload", () => lc.registerPreloadApprover((w) => isApprovedWidget(w, cfg) || undefined));
  if (cfg.approveIdentity) tryReg("identity", () => lc.registerIdentityApprover((w) => isApprovedWidget(w, cfg) || undefined));
  tryReg("capabilities", () => lc.registerCapabilitiesApprover((w, requested) => approveCapabilities(w, requested, cfg)));
}
