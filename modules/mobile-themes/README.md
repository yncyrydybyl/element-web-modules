# mobile-themes

Element Web runtime module (module API `^1.14.0 || ^2.0.0`, built and tested against Element **1.12.33** and **1.12.36** / API 2.3.0)
that makes Element Web usable on phones: a single-pane shell (room list → room → panel) with a back button and
back-gesture support, phone-sized dialogs and settings, 16 px inputs, 44 px touch targets, long-press message menus,
keyboard-aware layout, safe areas. Issue list and status: [`docs/MOBILE-ISSUES.md`](docs/MOBILE-ISSUES.md);
background: [`docs/research-mobile.md`](docs/research-mobile.md). **Not deployed.**

**Desktop is untouched.** Every rule and every behaviour is gated by `html[data-mt-mobile]` (most by
`html[data-mt-compact]`), which is absent on a desktop window; `e2e/desktop.mjs` checks this at 1440×900.

## What it does

| Part | File | Issues |
|---|---|---|
| Detection: `html[data-mt-mobile="narrow coarse"]` (≤ `max_width` **or** coarse pointer), `html[data-mt-compact]` (phone-sized: narrow, or coarse **and** ≤ 500 px high = landscape phone), `data-mt-pointer`, `data-mt-orientation` (screen orientation on touch, so an Android keyboard doesn't flip it). Live on rotate/resize. | `src/detect.ts` | MOB-33 |
| Single-pane shell: `html[data-mt-view="list\|room\|panel"]`, derived from Element's own state (home page / room / RightPanelStore open). Panes are stacked and only visibility changes, so the timeline keeps size and scroll. Back button in the room header (module API `addRoomHeaderButtonCallback`); "⋯" shows the module header buttons in a second row; same-URL history entries so iOS edge-swipe / Android back go one pane back. Space switches keep the list; opening a room from the list shows the conversation even if Element remembered an open right panel for it. | `src/shell.ts`, CSS | MOB-09, 10, 11, 12, 13, 26, 27 |
| Long-press (500 ms, finger still) on a message → Element's own message context menu (synthetic `contextmenu`, the path Element supports for right-click), shown as a bottom sheet; Android's native contextmenu right after it is swallowed; text selection is not disabled. Hover action bar hidden on coarse pointers. | `src/touch.ts`, CSS | MOB-21, 22, 25 |
| Keyboard: `--mt-vv-h`/`--mt-vv-top` from `visualViewport` (Hydrogen's approach) size `#matrixchat` and dialogs, timeline stays bottom-anchored; `html[data-mt-keyboard]` hides status bar/pinned banner, compacts the header (portrait) or hides it (landscape). Pinch-zoom is detected (scale ≠ 1) and left alone. Viewport meta gets `minimum-scale=1` (no zoom-*out* to fit momentary overflow, e.g. after rotation; pinch zoom-in stays), `viewport-fit=cover` (+ `interactive-widget=resizes-content` on Android), restored when mobile mode ends. | `src/keyboard.ts`, CSS | MOB-28, 18, 19 |
| CSS: full-screen settings with a horizontal, labelled tab scroller; dialogs ≤ viewport (create room, invite, …); login/welcome card; inputs `max(16px, 1em)`; 44 px targets (header, card header, dialog close, composer, space panel, room list); context menus clamped/bottom sheet; spotlight/emoji picker sized; keyboard hints hidden on touch; focus tooltips that stick on touch hidden; timeline: `pre`/tables scroll, notices full width; a docked teams-welcome panel no longer squeezes the app on phones. Target sizes live in the `mt-important` layer so theme `!important` rules can't shrink them. | `src/mobile.css` | MOB-14, 15, 16, 17, 20, 23, 24, 29, 32, 34 |
| Android `new Notification()` → service-worker fallback (Proxy: only on the constructor's TypeError). | `src/notify.ts` | MOB-04 |

`load()` never rejects; every part is guarded and logged with `[mobile-themes]`. Element internals used, all
feature-detected and optional: `window.mxDispatcher.register` (to see `view_room`/`view_home_page`),
`window.mxSdkContext.rightPanelStore.hide` / `roomViewStore.getRoomId` (back from the panel). Without them the view
still follows the DOM. Debug: `window.mtMobile.shell.state()`.

**It cannot stop the mobile redirect** (MOB-01): Element sends iOS/Android user agents to `/mobile_guide/` in
`vector/index.ts` before config and modules load. See the server-side proposal below.

### With the theme loader

Load it after the theme loader. Different attribute prefixes (`data-mt-*` / `data-tl-*`), style ids and important
layers (`mt-important`, `tl-important`). Shell rules use `html[data-mt-compact][data-mt-view…]` so their specificity is
above theme selectors (some themes use `!important` on header/pane geometry). Themes may react to mobile mode with
`html[data-tl-theme="x"][data-mt-compact] …` (allowed by the contract). Tested with Element default, teams-2026-light,
win311-default, lcars-tng and paper-white; theme tweaks worth doing are listed in `docs/MOBILE-ISSUES.md` §8.

## Config (`config.json`, all optional)

```jsonc
"de.datanauten.mobile_themes": {
  "enabled": true,           // false: no attributes, no stylesheet, nothing
  "max_width": 768,          // "narrow" breakpoint in CSS px
  "force": null,             // "on" | "off": override detection
  "shell": true,             // single-pane shell
  "history": true,           // back gesture/button goes one pane back (same-URL history entries)
  "long_press": true,        // long-press → message menu
  "keyboard": true,          // visual-viewport sizing + viewport-fit/interactive-widget
  "notification_shim": true  // Android Notification fallback
}
```

URL override for one page load: `?mt_mobile=1` / `?mt_mobile=0`.

## Mobile guide redirect (MOB-01, MOB-02) — deployed 2026-11-15 on element.datanauten.de and chat.od.blackpony.club

**Problem.** `vector/index.ts` sends every iOS/Android browser to `/mobile_guide/` unless the URL has a fragment
(deep link) or `sessionStorage.skip_mobile_redirect === "true"`. The flag is per tab, so every new tab, every cold
start and every launch of an installed PWA (`start_url: "index.html"`) lands on the guide again. No config key, and
modules load too late.

**Proposal: replace the guide page with our own static page** (`server/mobile_guide/index.html`, self-contained, no
external resources, independent of Element's hashed bundles):

- If the person opted in on this device before (`localStorage.mt_mobile_web = "1"`) it immediately sets Element's own
  `skip_mobile_redirect` flag and `location.replace("../#/home")` (a deep link, which Element never redirects). One
  extra hop, no visible page; works for new tabs, cold starts and PWA launches.
- Otherwise it shows a small choice: **Get the Element X app** (App Store / Play by UA), **Continue in the browser**
  (remembered), **Just this time** (per tab, Element's current behaviour), plus a note that browser notifications only
  arrive while Element is open (MOB-05).
- Shareable opt-in link: `https://element.datanauten.de/mobile_guide/?mobile_web=1`; `?mobile_web=0` forgets the
  choice. `MODE = "always"` in the page forwards everyone (config-driven variant: render the file from a Jinja
  template with that value from an inventory var).
- Element's code and its redirect stay unchanged; reverting = removing one mount.

Verified locally with request interception against the dev server (`recordings/mobile/after/guide-proposal/`):
first visit → guide → "Continue" → app; a new tab → forwarded without showing the page; `?mobile_web=0` → page shown
again; fresh device with `?mobile_web=1` → app.

**Exact MDAD snippet** (`~/projects/dtn10/datanauten.de/inventory/host_vars/matrix.datanauten.de/vars.yml`; same
pattern the deploy already uses for the CSP template). The Element image serves `/app` as the web root, and its nginx
`templates/` are rendered at http level (no `location` blocks possible there), which is why a file mount is used
instead of an nginx rule:

```yaml
# 1. copy the page: files/element-mobile-guide/index.html  (= server/mobile_guide/index.html)
aux_file_definitions_custom: |-
  {%- set files = [{
        'dest': matrix_client_element_data_path ~ '/nginx/csp-blob.conf.template',
        'src': inventory_dir ~ '/host_vars/matrix.datanauten.de/files/element-nginx/csp-blob.conf.template',
        'mode': '0644'}, {
        'dest': matrix_client_element_data_path ~ '/mobile_guide/index.html',
        'src': inventory_dir ~ '/host_vars/matrix.datanauten.de/files/element-mobile-guide/index.html',
        'mode': '0644'}] -%}
  … (module files loop unchanged) …

# 2. its directory (add to the existing dirs list)
#    {'dest': matrix_client_element_data_path ~ '/mobile_guide'}

# 3. mount it over the stock guide
matrix_client_element_container_extra_arguments:
  - "--mount type=bind,src={{ matrix_client_element_data_path }}/modules,dst=/app/element-modules,ro"
  - "--mount type=bind,src={{ matrix_client_element_data_path }}/nginx/csp-blob.conf.template,dst=/etc/nginx/templates/csp-blob.conf.template,ro"
  - "--mount type=bind,src={{ matrix_client_element_data_path }}/mobile_guide/index.html,dst=/app/mobile_guide/index.html,ro"
```

Then `ansible-playbook -i inventory/hosts matrix-docker-ansible-deploy/setup.yml --tags=setup-aux,setup-client-element`.
The page has no CSP `<meta>` (like the stock guide) and is HTML, so the http-level `sub_filter` of the CSP template
doesn't touch it (it only rewrites `script-src 'self'`, which the page doesn't contain).

Optional (MOB-02, saves the hop and the flash on PWA launch): mount a copy of `/app/manifest.json` with
`"start_url": "./#/home"` the same way. iOS home-screen apps have their own storage, so the first launch there shows
the choice once.

Alternatives considered: a 302 for `/mobile_guide/` (upstream's #21616 workaround) needs a `location` in the server
block, i.e. overriding the image's whole `default.conf.template` (breaks silently on image updates) or a Traefik
middleware (redirect for everyone, no opt-out, no app hint); an nginx cookie/query rule has the same placement
problem. Upstream configurability (PR #34508) was closed "needs a product decision".

## Build

```sh
cd modules/mobile-themes
pnpm install            # once
pnpm build           # → lib/index.js (+ .map), lib/files.txt (flat, like theme-loader/lib)
pnpm lint:types      # tsc
```

## Dev server (port 5410, separate from the shared theme-loader server on 5400)

```sh
pnpm dev                                   # http://127.0.0.1:5410/ — module bundled from src/ per request
MT_WITH_LOADER=1 pnpm dev                  # also load the theme loader, proxied from the :5400 dev server
MT_DEV_MODE=prod MT_DEV_PORT=5411 pnpm dev # serve lib/ exactly as it would be deployed
```

Stock Element 1.12.36 from `../theme-loader/.element/` with `../theme-loader/dev/config.json` (both read-only). No harness sessions
for :5410 — use it logged out, or test logged-in with interception (below). In device emulation open
`http://127.0.0.1:5410/#/welcome` or set `sessionStorage.skip_mobile_redirect = "true"`.

## Tests

```sh
export NODE_PATH=~/projects/matrix-search-widget/node_modules
pnpm build
node e2e/smoke.mjs                              # dev server: attributes, stylesheet once, no errors (5 cases)
node e2e/shell.mjs [--device iphone15,…|all] [--theme <id>] [--only with|without] [--base-url URL]
                                                 # before/after phone flow → recordings/mobile/after/<device>[--theme]/
node e2e/desktop.mjs [--theme <id>]             # 1440×900: layout fingerprint + pixel diff with vs. without
node e2e/audit.mjs [--device …] [--with-module] # the research audit (recordings/mobile/<device>[--module]/)
node e2e/run.mjs --script x.mjs --with-module   # ad-hoc: logged-in page + your script
# WebKit (iPhone, logged out; host lacks WebKit's libs → local Playwright image):
podman run --rm --network host --security-opt label=disable \
  -v ~/projects/matrix-search-widget/node_modules:/pw/node_modules:ro -v ~/.cache/ms-playwright:/ms-playwright:ro \
  -e PLAYWRIGHT_BROWSERS_PATH=/ms-playwright -v $PWD/..:/proj mcr.microsoft.com/playwright:v1.65.0-noble \
  node /proj/modules/mobile-themes/e2e/webkit.mjs
```

All logged-in tests use the harness session pool (`tests/README.md`: exclusive slot, never a login, no messages or
reactions, `mx_local_settings` restored), against production with the module injected by request interception
(`config.json` + `/element-modules/mobile-themes/*` from `lib/`), or against the loader dev server
(`--base-url http://localhost:5400`, both modules). `shell.mjs` simulates the keyboard two ways: `visual` (iOS /
Android default: `visualViewport.height` shrinks, layout stays) and `layout` (Android `resizes-content`).

## Deploy

Not deployed. When it is: same procedure as the loader (`../theme-loader/README.md` → Deploy), module directory
`element-modules/mobile-themes`, files from `lib/files.txt`, listed **after** the theme loader. Combine with the
mobile-guide proposal above, otherwise phone users only reach the app through the guide's "desktop site" link.

## Needs real devices

Emulation (Chromium device mode, WebKit desktop build) can't show: the iOS keyboard pan and its timing (MOB-28), iOS
long-press (WebKit fires no `contextmenu`; our timer should, but WebKit GTK has no `Touch` constructor to drive it),
Android's native long-press selection next to our menu, `interactive-widget` on Chrome Android, safe areas on a
notched iPhone in landscape, the Android notification shim (needs a granted permission + sw.js), Gboard input
(MOB-31), and performance on a mid-range phone.

## Layout

```
src/index.ts      module class: config, wiring, important layer, style injection
src/detect.ts     detection → html[data-mt-mobile|compact|pointer|orientation]
src/shell.ts      single-pane shell, header buttons, history/back
src/touch.ts      long-press → context menu
src/keyboard.ts   visual viewport, keyboard state, viewport meta
src/notify.ts     Android Notification shim
src/mobile.css    the scoped stylesheet (bundled as text)
server/mobile_guide/index.html   proposal: replacement mobile guide page (not deployed)
build/            esbuild setup + production build
dev/server.mjs    dev server (:5410)
e2e/              smoke, shell (before/after), desktop (regression), webkit, audit (research), run (ad-hoc), mtlib
```

### Live check

`node e2e/live-guide.mjs --base-url https://element.datanauten.de` (and `https://chat.od.blackpony.club`): logged out,
no interception. iPhone/Pixel → our guide → "Continue in the browser" → Element in mobile mode, new tab skips the
guide, `?mobile_web=0` shows it again; desktop gets no mobile mode. Screenshots + result.json in `recordings/mobile/live/<host>/`.

On openDesk the files are served by the theme-loader nginx (Ingress paths `/modules/mobile-themes`, `/mobile_guide`);
see the openDesk repo's runbook §11. On datanauten: `mobile-themes` entry in `datanauten_element_modules` plus the
mobile_guide mount (vars.yml).

## Test stack

```sh
e2e/stack.sh up     # Synapse on :18488, Element Web v1.12.36 on :5819 with lib/ mounted (alice / alice-pass, bob / bob-pass)
e2e/stack.sh down
```

`MT_ELEMENT=v1.12.33 e2e/stack.sh up` tries another Element version. `pnpm build` empties `lib/` in place, so a
running stack picks up a rebuild on reload.
In mobile-themes the stack also mounts ../theme-loader/lib when it has been built.
