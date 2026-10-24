// Matches Element's Compound IconButton in the room header (32px, round, icon-secondary → icon-primary on hover),
// using Compound CSS variables with neutral fallbacks.
const CSS = `
.mcm-apps{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;flex:none;
  width:32px;height:32px;padding:4px;border:0;border-radius:50%;background:transparent;cursor:pointer;
  color:var(--cpd-color-icon-secondary,#656d77)}
.mcm-apps svg{width:24px;height:24px;display:block}
.mcm-apps:hover{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);color:var(--cpd-color-icon-primary,#1b1d22)}
.mcm-apps:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}
.mcm-apps[aria-pressed="true"]{color:var(--cpd-color-icon-accent-primary,var(--cpd-color-icon-primary,#1b1d22));
  background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}
.mcm-apps[aria-disabled="true"]{color:var(--cpd-color-icon-disabled,#c0c6cd)}
.mcm-apps[aria-disabled="true"]:hover{background:transparent;color:var(--cpd-color-icon-secondary,#656d77)}
.mcm-apps[aria-busy="true"]{cursor:progress;opacity:.6}
.mcm-dialog p{margin:0 0 12px}
.mcm-dialog__cmd{display:block;margin:0 0 16px;padding:8px 12px;border-radius:8px;white-space:pre-wrap;word-break:break-all;
  background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);color:var(--cpd-color-text-primary,#1b1d22);
  font:var(--cpd-font-body-sm-regular,400 13px/20px ui-monospace,monospace);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;user-select:all}
.mcm-dialog__buttons{display:flex;gap:8px;justify-content:flex-end}
.mcm-button{border:1px solid var(--cpd-color-border-interactive-secondary,#c0c6cd);border-radius:999px;padding:6px 16px;background:none;
  color:var(--cpd-color-text-primary,#1b1d22);font:var(--cpd-font-body-md-semibold,600 14px/20px system-ui);cursor:pointer}
.mcm-button--primary{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);border-color:transparent}
.mcm-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:5000;max-width:min(560px,calc(100vw - 32px));
  padding:10px 16px;border-radius:8px;background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);
  font:var(--cpd-font-body-md-regular,400 14px/20px system-ui);box-shadow:0 4px 24px rgba(0,0,0,.25)}
`;

export function injectStyles(doc: Document = document): void {
  if (doc.getElementById("mcm-styles")) return;
  const s = doc.createElement("style");
  s.id = "mcm-styles";
  s.textContent = CSS;
  doc.head.appendChild(s);
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
/** Small status line at the bottom (the module API has no toast API). Announced via role=status. */
export function toast(text: string, ms = 5000, doc: Document = document): void {
  let el = doc.getElementById("mcm-toast");
  if (!el) {
    el = doc.createElement("div");
    el.id = "mcm-toast";
    el.className = "mcm-toast";
    el.setAttribute("role", "status");
    doc.body.appendChild(el);
  }
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el && (el.hidden = true), ms);
}
