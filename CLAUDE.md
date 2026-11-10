# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout

Runtime modules for Element Web / Element Desktop, built against the module API 2.x (`@element-hq/element-web-module-api`). They load into a stock Element without a custom build. Each `modules/<name>/` is a **standalone package** with its own lockfile, build, tests, README and LICENSE. There is no root workspace and no root `package.json`: always `cd modules/<name>` first. Most modules started as separate repos whose histories were imported unchanged.

- pnpm: keyboard-shortcuts, space-room-map, people-map, room-checker, remote-modules, speed-start, text-reactions, multi-tab, user-account-widgets, teamwork, activity, tag-mentions, profile-status, files-hub, teams-welcome. Their `pnpm-workspace.yaml` sets `minimumReleaseAge: 1440`, so a dependency published less than a day ago won't install. This is deliberate.
- npm: marcade (builds to `dist/`, tests in `test/`, Apache-2.0). All other modules build to `lib/`, keep tests next to the source as `src/*.test.ts`, and are AGPL-3.0-only.
- `modules/multi-tab/` (several tabs share one session: one engine tab syncs and holds the crypto, mirrors go through it) relies on Element internals more than any other module. Read its `HANDOVER.md` (design, invariants I1–I7, review outcomes) before changing it. It declares module API `^1.0.0 || ^2.0.0`, because Element Pro ships API 1.x and the module only uses `load()`.

## Commands (inside a module)

```sh
pnpm install
pnpm build              # vite library build -> lib/index.js (+ .map)
pnpm dev                # build --watch
pnpm test               # vitest run (jsdom)
pnpm vitest run src/snapshot.test.ts          # one file
pnpm vitest run -t "name of the test"         # one test by name
pnpm lint:types         # tsc --noEmit  (marcade: npm run check)
e2e/stack.sh up | down  # throwaway Synapse + Element Web in podman (modules that have e2e/)
```

Each `e2e/stack.sh` uses its own ports and server name so stacks can run side by side (text-reactions 18458/5793, speed-start 18459/5794, people-map 18476/5806, room-checker 18477/5807, multi-tab 18460/18461/5795/5796, user-account-widgets 18478/5808, teamwork 18479/5809, activity 18480/5811, tag-mentions 18481/5812, profile-status 18482/5813, files-hub 18483/5814, teams-welcome 18484/5815, the whole Teams suite 18485/5816, marcade 18448/5791+5792). Each pins Synapse v1.162.0 and an Element Web image version, mounts the module's build output into the Element container, and keeps state in `e2e/.run/` (git-ignored). Copy the script and pick new ports for a new module. Drive the stack with Playwright. Most module UI can be tried on the login page, because modules load before login.

## The Teams suite

teamwork, activity, tag-mentions, profile-status, files-hub and teams-welcome form a suite for people moving from Microsoft Teams (`suite/README.md`: overview, homeserver settings, example `config.json`). They stay standalone packages, but share two conventions on `window.deDatanautenTeamsSuite`:
- `_renderChain`: Element uses only the first matching message renderer, so suite modules register through `src/suiteRender.ts` (copied verbatim into teamwork, tag-mentions and files-hub; keep the copies identical and bump `CHAIN_VERSION` on changes). Replacing renderers draw the body, wrappers add around it.
- `"<module>"`: a module may register an object there (tag-mentions exposes `expand(roomId, content)`, used by teamwork's dialog). teams-welcome detects siblings by that entry or by their `de-datanauten-<module>-style` element.
`suite/e2e/stack.sh up` starts one Element with all six modules and the rich text editor on (18485/5816); check interplay there, not only in each module's own stack.

## How a module is built and loaded

- `src/index.ts` default-exports a class with a static `moduleApiVersion` semver range and an async `load()`. Element `import()`s every URL from `config.json` → `modules`, then runs all `load()`s in parallel **before rendering and before login**. Element waits for every `load()`, so keep them short. A rejected `load()` shows Element's error screen, so throw only for real misconfiguration.
- `vite.config.ts` is copied between modules on purpose. It inlines the module API's `vite.base.ts`, because Node won't strip types from `.ts` files in `node_modules`. React is external and comes from `window.React`, `NODE_ENV` is forced to production, and the output is a single ES module. Don't bundle a second copy of a library whose React contexts Element also uses.
- CSS is imported with `?inline` and injected as a `<style>` element (library mode emits a CSS file that nothing would load). Use Compound `--cpd-color-…` variables for theming.
- `vitest.config.ts` passes `--no-experimental-webstorage`. Otherwise Node 25+'s own `localStorage` global hides jsdom's.
- Modules must be served from Element's own origin, because Element's CSP is `script-src 'self'`. CDN URLs don't work.
- When the public `Api` lacks something, modules reach for Element internals (`window.mxMatrixClientPeg`, `window.mxPlatformPeg`, DOM). Such hooks are pinned to tested Element versions and gated so the module degrades to a no-op if they are missing.

`modules/keyboard-shortcuts/docs/element-web-modules.md` covers the API surface and its pitfalls (e.g. `client.accountData` throws until a user is logged in; registered i18n keys must not contain `|`). `docs/deployment.md` there covers matrix-docker-ansible-deploy and ESS. Local source checkouts for reading Element internals: `~/projects/element/element-web` (matrix-js-sdk under its `node_modules`).

## Releases

`gh workflow run release.yml -f module=<name>` tests and builds the module, then tags `<module>-v<version>` using the version from that module's `package.json`. The tag points to a commit with the build under `dist/<module>/`, and the GitHub release gets `index.js`, `index.js.map` and `SHA256SUMS`. The workflow fails if the tag already exists, so bump `package.json` first. A new module must be added to the workflow's `options` list.

Commit messages follow `<module> <version>: <what changed, user-facing>`, e.g. `space-room-map 0.4.1: hover intent in the list`. Update the root README's module table when adding a module.
