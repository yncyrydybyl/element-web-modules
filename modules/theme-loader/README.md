# theme-loader

Element Web runtime module (module API `^1.14.0 || ^2.0.0`, built and tested against Element **1.12.33** and **1.12.36** / API 2.3.0)
that applies the theme families in `themes/` as described in [`docs/CONTRACT.md`](docs/CONTRACT.md).

## For theme authors: the dev server

One shared dev server serves a stock Element Web 1.12.36 that loads the loader, and the loader reads every theme
file live from `themes/`. You don't need to build anything: edit, then reload the browser.

```sh
cd modules/theme-loader
pnpm dev          # starts it in the background on :5400; if it's already running it does nothing
pnpm dev:status   # {"ok":true,…,"errors":N}   (N = validation errors over all families)
pnpm dev:stop     # only if you really need to (it is shared by all theme agents)
pnpm check -- <family>   # validate one family on the command line (manifest, files, CSS scoping)
```

- App: **http://127.0.0.1:5400/** (homeserver https://matrix.datanauten.de, log in with a test user from
  `.state/users.txt` via "Continue" → MAS → "Continue").
- Force a theme for one page load: `http://127.0.0.1:5400/?tl_theme=<variant-id>` (not saved; `?tl_theme=none` =
  Element default). Force a daylight phase: `&tl_phase=night` or `localStorage["tl.forcePhase"]="night"`.
- Picker: User settings → **Themes** (all families incl. hidden ones in dev, validation problems listed at the top).
  Quick switcher: palette button in the room header or **Alt+Shift+T** (↑↓ preview, Enter apply, Esc revert).
- Live endpoints: `/tl-dev/themes.json` (aggregated registry + `problems`), `/tl-dev/themes/<family>/<file>`,
  `/tl-dev/enhance/<family>.js` (your enhance.ts, bundled on request), `/tl-dev/status`.
- Nothing is cached: CSS, assets, manifests and enhancers are re-read on every reload. A broken manifest/CSS/enhancer
  in one family only affects that family (it shows up in `problems` / the browser console with `[theme-loader]`).
- Changes to `src/` are also picked up on reload (the loader is re-bundled when its sources change). Changes to
  `dev/server.mjs` need `pnpm dev:stop && pnpm dev`.

Logs: `.dev/server.log`. The server runs under a small supervisor loop that restarts it if it dies.
Element itself is downloaded once (release tarball) into `.element/` (git-ignored).

## Architecture

```
src/index.tsx        module class: load() applies the cached / ?tl_theme choice synchronously (awaits its CSS up
                     to css_timeout_ms, default 1.5 s) before Element's first render; then starts everything else
src/applier.ts       <html data-tl-theme/-family/-phase/-base>, <style id=tl-tokens> (tokens on html, body and
                     [class*="cpd-theme-"]; font tokens !important), <style id=tl-fonts> (@font-face),
                     <style class=tl-css> per CSS file (inline, url() made absolute), <style id=tl-important>
                     ("@layer tl-important;" as first child of <head>), meta theme-color; Element default removes all
src/scheduler.ts     daylight phases by local clock: timer to the next boundary + visibilitychange + 60 s safety tick;
                     ?tl_phase= / localStorage["tl.forcePhase"]
src/store.ts         account data de.datanauten.theme_loader {theme, v:1} (watched, synced across devices) +
                     localStorage "tl.theme" cache; attaches once a user is logged in
src/baseSync.ts      keeps Element's light/dark base in line with the theme/phase via mxDispatcher
                     recheck_theme{forceTheme} (transient, nothing written to the user's settings); Element default
                     = recheck_theme without force → Element recomputes from its settings. Feature-detected.
src/enhancers.ts     runs themes/<family>/enhance.ts (prod: bundled into index.js; dev: imported per family from
                     the dev server), overlay root #tl-overlay-root, mount/unmount/onPhase, never throws
src/picker/*         "Themes" settings tab (DOM injection like remote-modules' settingsInjector), gallery grouped by
                     family with stage/mode filters + search + phase override, quick switcher dialog, styles
build/lib.mjs        discovery, manifest + CSS validation (postcss), registry aggregation (dev/prod)
build/build.mjs      production build → lib/
dev/server.mjs       dev server (see above); TL_DEV_MODE=prod serves lib/ instead (prod preview)
e2e/run.cjs          Playwright end-to-end check against the dev server
```

Robustness: `load()` never rejects; every DOM/API call that can fail is wrapped and logged with `[theme-loader]`;
internals (`mxDispatcher`, `mxMatrixClientPeg` in tests) are feature-detected. Precedence of the applied theme:
`?tl_theme` > saved choice (account data, cached locally) > config `default_theme` > Element default.

Config (`config.json`, all optional):

```jsonc
"de.datanauten.theme_loader": {
  "default_theme": null,       // variant id for users who never chose one
  "show_hidden": false,        // list hidden variants (families starting with "_", e.g. _demo) in the picker
  "css_timeout_ms": 1500,      // max wait in load() for the theme CSS before Element renders
  "dev_base": "/tl-dev/"       // dev server only: read the registry/themes live from there
}
```

Hidden variants can always be applied with `?tl_theme=<id>` (or listed with `?tl_hidden=1`).

## Production build

```sh
pnpm install            # once
pnpm build           # validates every family, fails on any error; output in lib/
pnpm build:demo      # same, but the _demo family is listed in the picker
node build/build.mjs --families _demo,teams   # build a subset (for testing while other families are unfinished)
pnpm lint:types      # tsc over the loader and all themes/*/enhance.ts
```

`lib/` is one flat directory:

- `index.js` (+ `.map`): loader + registry + all enhancers (~45 kB + enhancers). The registry (metadata and tokens of
  all variants) is baked in, so the active theme can be applied without an extra request.
- `<family>--<file>.css`, `<family>--<asset>` (assets below `assets/` flattened, `/` → `--`): loaded lazily, only for
  the active variant. URLs carry `?v=<content hash>` because only `index.js` gets cache-busted by the deploy.
- `themes.json`: the aggregated registry (for tooling; the loader doesn't need it).
- `files.txt`: every file, for the deploy's `files:` list.

The applied variant's CSS is also cached in `localStorage["tl.cssCache"]`, so the next start applies it with no
network request.

Prod preview of a build (no live themes, exactly the lib/ files):
`TL_DEV_MODE=prod TL_DEV_PORT=5401 node dev/server.mjs` → http://127.0.0.1:5401/

## Deploy (element.datanauten.de) — to be done by the maintainer

Not deployed by the build. Steps (see `research/02-infra.md` §1.3; mind the dirty working tree caveat there):

```sh
cd modules/theme-loader && pnpm build
R=~/projects/dtn10/datanauten.de
D=$R/inventory/host_vars/matrix.datanauten.de/files/element-modules/theme-loader
rm -rf "$D" && mkdir -p "$D" && cp lib/* "$D/" && rm "$D/files.txt"
# vars.yml → datanauten_element_modules, ideally right after speed-start so it loads early:
#   - name: theme-loader
#     files: [<every line of lib/files.txt>]
#     config:
#       de.datanauten.theme_loader: { default_theme: null }
cd $R && . venv/bin/activate
ansible-playbook -i inventory/hosts matrix-docker-ansible-deploy/setup.yml --tags=setup-aux,setup-client-element
ssh matrix.datanauten.de sudo systemctl restart matrix-client-element
```

CSP on element.datanauten.de needs no change (inline `<style>`, same-origin fonts/CSS, same-origin module).

## Tests

```sh
pnpm dev
NODE_PATH=~/projects/matrix-search-widget/node_modules node e2e/run.cjs [--user themes-mira] [--headed]
```

Logs in through MAS with a test user (password never printed), then: Themes tab (Element default, both _demo variants,
mode filter), font/enhancer/inline CSS, account data saved, restore from account data with the local cache cleared,
all four daylight phases via `?tl_phase` (attribute, Element base class, enhancer `onPhase`), `tl.forcePhase`,
`?tl_theme` not persisted, quick switcher (preview + Esc revert, type + Enter), room-header button, and finally
"Element default" restoring Element exactly (no attributes, no theme nodes, same base class and computed styles,
account data `theme: null`). Fails on any `[theme-loader]` console error or page error. Screenshots and
`e2e-results.json` go to `recordings/loader/`. The browser profile lives in `.dev/pw-profile` (log in once).

## Known limitations

- First paint (Element's spinner) happens before modules load, so it uses Element's theme; the cached theme is applied
  in `load()` before Element's first real render.
- Element's light/dark base is synced through an internal dispatcher action (transient). Element's own Appearance tab
  still shows the user's Element theme; widgets/Element Call only know light/dark.
- Space panel items are not used for the quick switcher: in API 2.3.0 selecting one switches the active space.
- Login from `http://127.0.0.1:5400` uses MAS compat SSO; Element logs one harmless "Dynamic registration failed"
  error first (MAS rejects the http/localhost OIDC client).
- `?tl_theme` affects one page load; navigating inside Element keeps it until reload.

## Test stack

```sh
e2e/stack.sh up     # Synapse on :18487, Element Web v1.12.36 on :5818 with lib/ mounted (alice / alice-pass, bob / bob-pass)
e2e/stack.sh down
```

`TL_ELEMENT=v1.12.33 e2e/stack.sh up` tries another Element version. `pnpm build` empties `lib/` in place, so a
running stack picks up a rebuild on reload.
