# mobile-themes

Element Web runtime module (module API `^1.14.0 || ^2.0.0`, built and tested against Element **1.12.33** / API 2.3.0)
that is meant to make Element Web usable on phones. **Status: skeleton.** It loads, marks the document and injects
one scoped stylesheet; the actual fixes are planned in [`../docs/MOBILE-ISSUES.md`](../docs/MOBILE-ISSUES.md)
(issue list, fixability, fix order) and [`../research/05-mobile.md`](../research/05-mobile.md) (background).

Why `mobile/` at the repo root (not `modules/mobile-themes/`): it mirrors `loader/` (same layout, same build/dev
approach, same flat `dist/`), so nothing in the existing tree, docs or deploy notes has to move. If a third module
appears, both can move under `modules/` together.

## What it does today

- `html[data-mt-mobile="narrow coarse"]` while the viewport is ≤ `max_width` (default 768 px, the width at which
  Element auto-collapses its room list) **or** the primary pointer is coarse. The value lists the reasons
  (`narrow`, `coarse`, `forced`), so `html[data-mt-mobile~="coarse"]` targets touch only. Absent = desktop.
- `html[data-mt-pointer="coarse|fine"]`, `html[data-mt-orientation="portrait|landscape"]`.
- All three follow `matchMedia` changes live (rotate, resize, attach a mouse).
- `<style id="mt-mobile-style">` from `src/mobile.css`: every selector starts with `html[data-mt-mobile]`, so it is a
  no-op on desktop. Unlayered, so it beats Element's `@layer` CSS (see `research/01-theme-system.md` §0).
- Coexists with the theme loader (different attribute prefix `data-mt-*` vs `data-tl-*`, different style ids).
  Theme CSS can react to it: `html[data-tl-theme="x"][data-mt-mobile] …` is allowed by the theme contract.

`load()` never rejects; problems are logged with `[mobile-themes]`.

**It cannot stop the mobile redirect.** Element sends iOS/Android user agents to `/mobile_guide/` in
`vector/index.ts` *before* `config.json` and modules are loaded (MOB-01). Until that is handled on the server
(nginx) or in Element core, users reach the app only through the guide's "desktop site" link (per tab) or a deep link.

## Config (`config.json`, all optional)

```jsonc
"de.datanauten.mobile_themes": {
  "enabled": true,      // false: no attributes, no stylesheet
  "max_width": 768,     // "narrow" breakpoint in CSS px
  "force": null         // "on" | "off": override detection
}
```

URL override for one page load: `?mt_mobile=1` / `?mt_mobile=0`.

## Build

```sh
cd ~/projects/element-web-themes/mobile
pnpm install            # once
npm run build           # → dist/index.js (+ .map), dist/files.txt (flat, like loader/dist)
npm run lint:types      # tsc
```

## Dev server (port 5410, separate from the shared theme-loader server on 5400)

```sh
npm run dev                                   # foreground; http://127.0.0.1:5410/ — module bundled from src/ per request
MT_WITH_LOADER=1 npm run dev                  # also load the theme loader, proxied from the :5400 dev server
MT_DEV_MODE=prod MT_DEV_PORT=5411 npm run dev # serve dist/ exactly as it would be deployed
```

It serves the same Element 1.12.33 release the loader downloaded (`loader/.element/`, read-only) with
`loader/dev/config.json` (read-only) and `modules: [mobile-themes]`. There are no harness sessions for :5410, so use
it logged out (the module loads before the login screen) or test logged-in against production with interception
(below). In device emulation, open `http://127.0.0.1:5410/#/welcome` or set
`sessionStorage.skip_mobile_redirect = "true"`, otherwise Element redirects to the mobile guide.

## Tests

```sh
export NODE_PATH=~/projects/matrix-search-widget/node_modules
npm run dev &                 # or the prod preview with --base-url http://127.0.0.1:5411
node test/smoke.mjs           # desktop / narrow desktop / iPhone 15 / Pixel 8 landscape / ?mt_mobile=1:
                              # attribute, stylesheet once, no [mobile-themes] errors, Element renders
node test/audit.mjs [--device iphone15|iphone15-land|pixel8|pixel8-land|all] [--anon-only|--no-anon] [--with-module]
```

`test/audit.mjs` is the empirical part of the research: Playwright device emulation (UA, viewport, DPR, touch)
against https://element.datanauten.de. The anonymous part (mobile-guide redirect, login, deep link) uses a throw-away
context; the logged-in part takes an exclusive slot from the harness session pool (`tests/README.md`), never logs in,
never sends messages/reactions or joins calls, hides toasts and the teams-welcome onboarding card with CSS (no
account-data writes) and restores the slot's device settings (`mx_local_settings`) that Element changes when the
window is narrow. Output: `recordings/mobile/<device>/NN-name.png` + `metrics.json` / `anon.json`.
`--with-module` intercepts `config.json` and serves `dist/` as `/element-modules/mobile-themes/` (nothing deployed),
writing to `recordings/mobile/<device>--module/` for before/after comparisons.

## Deploy

Not deployed (by design at this stage). When it is: same procedure as the loader (`loader/README.md` → Deploy), module
directory `element-modules/mobile-themes`, files from `dist/files.txt`. Load it after the theme loader.

## Layout

```
src/index.ts      module class: config, detection, style injection, live updates
src/detect.ts     matchMedia-based detection → html[data-mt-*]
src/mobile.css    the scoped stylesheet (bundled as text)
build/bundle.mjs  esbuild setup (window.React shim, module-api type stub) shared by build and dev
build/build.mjs   production build → dist/
dev/server.mjs    dev server (:5410)
test/smoke.mjs    load test against the dev server
test/audit.mjs    mobile audit against production (session pool)
```
