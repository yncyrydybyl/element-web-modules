# Element Web modules: how they work

These are notes from investigating the Element Web source (monorepo `element-hq/element-web`, develop as of 2026-09-25) and the published `@element-hq/element-web-module-api` 2.0–2.3. They apply to any module, not just this one.

## Where the upstream documentation is

There is no dedicated guide upstream. The useful material is spread over these places, roughly in order of usefulness:

| Where                                                                                                                                                         | What you get                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`packages/module-api/README.md`](https://github.com/element-hq/element-web/blob/develop/packages/module-api/README.md)                                        | The module contract (default-exported class, `moduleApiVersion`, `load()`) and how to type your config keys. Short.                                                                                                                                                                             |
| [`packages/module-api/element-web-module-api.api.md`](https://github.com/element-hq/element-web/blob/develop/packages/module-api/element-web-module-api.api.md) | The generated API report: every interface the host exposes, with `@public` / `@alpha` stability tags. **This is the real reference.** The TSDoc comments in `packages/module-api/src/api/*.ts` (and in `lib/*.d.ts` of the npm package) explain each method.                                    |
| [`modules/`](https://github.com/element-hq/element-web/tree/develop/modules) in the monorepo                                                                  | Element's own modules: `banner`, `widget-toggles`, `widget-lifecycle`, `restricted-guests`. These are the best examples of build setup, config validation, translations and tests. `modules/README.md` itself is one line.                                                                      |
| [`docs/config.md` § Modules](https://github.com/element-hq/element-web/blob/develop/docs/config.md#modules)                                                   | The `"modules"` key in `config.json`.                                                                                                                                                                                                                                                           |
| `apps/web/src/modules/*.ts(x)`                                                                                                                                | The host side: how each API is implemented (e.g. `Dialog.tsx` wraps `BaseDialog`, `AccountDataApi.ts` needs a logged-in client). Read these when the API docs leave a question open.                                                                                                            |
| `apps/web/src/vector/init.tsx` (`loadModules`)                                                                                                                | How and when modules are loaded.                                                                                                                                                                                                                                                                |
| `apps/web/docker/docker-entrypoint.d/18-load-element-modules.sh`                                                                                              | The Docker image's `/modules` auto-loader (see its pitfall below).                                                                                                                                                                                                                              |

Don't confuse this with the **legacy module system**: `build_config.yaml`, `@matrix-org/react-sdk-module-api` and the `element-hq/element-modules` repo. Those modules were compiled into a custom Element build. The new system loads modules at runtime and needs no rebuild.

## Lifecycle

1. Element starts. `init.tsx` sets `window.React` (part of the contract: modules don't bundle React).
2. For each URL in `config.json` → `"modules"`, Element runs `import(url)`. The URL is used as-is (`webpackIgnore`), so absolute URLs, same-origin paths and query strings all work.
3. `ModuleLoader.load()` checks that the default export looks like a module (a class with a static `moduleApiVersion` string and a `load` method), then that the host's API version satisfies the module's semver range. Otherwise it throws `ModuleIncompatibleError`.
4. Every module is constructed with the `Api` object, then all `load()` methods run in parallel **before the app renders and before login**. If any `load()` rejects, Element shows an error screen, so throw only for real misconfiguration.

```ts
import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";

class MyModule implements Module {
    public static readonly moduleApiVersion = "^2.0.0";
    public constructor(private readonly api: Api) {}
    public async load(): Promise<void> {
        /* register things here */
    }
}
export default MyModule satisfies ModuleFactory;
```

## The API surface (2.x)

| `api.…`                           | Stability | Notes                                                                                                                                                                                                                                                                 |
| --------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config.get(key?)`                | public    | Reads `config.json`. Extend the `Config` interface by declaration merging, and still validate at runtime (the official modules use `zod/mini`). Use a reverse-DNS key.                                                                                              |
| `i18n.translate / register`       | public    | `translate` goes through Element's own `_t`, so **you can reuse Element's existing keys** (e.g. `keyboard|composer_toggle_bold`). Keys you `register` must be **flat** (no `|`): `|` is Element's path separator, so `"a|b"` is looked up as `a → b` and never found. |
| `rootNode`, `createRoot(el)`      | public    | Render your own React tree anywhere without bundling ReactDOM.                                                                                                                                                                                                        |
| `openDialog(opts, Component, props)` | public | Element's `BaseDialog` with your component as body. Fixed Element dialog chrome.                                                                                                                                                                                      |
| `navigation`                      | public    | Navigate to rooms or permalinks, register custom links.                                                                                                                                                                                                               |
| `customComponents`                | alpha     | Replace or extend message rendering and other render points.                                                                                                                                                                                                          |
| `extras`                          | alpha     | Add room header buttons and space panel items.                                                                                                                                                                                                                        |
| `client.accountData`              | —         | `get(type)` returns a `Watchable`. **Throws until a user is logged in** (`MatrixClientPeg.safeGet()`), so retry or attach lazily.                                                                                                                                     |
| `settings.getValue(name)`         | alpha     | Read any Element setting (e.g. `developerMode`, `MessageComposerInput.ctrlEnterToSend`). Read-only.                                                                                                                                                                   |
| `widget`, `widgetLifecycle`       | alpha     | Read widgets in a room, auto-approve capabilities, etc.                                                                                                                                                                                                               |
| `customisations`, `composer`, `stores`, `builtins`, `storageHelper`, `urlPreviews`, `auth`, `profile` | mostly alpha | See the API report. |

**There is no API for keyboard shortcuts.** Element's shortcut table (`apps/web/src/accessibility/KeyboardShortcuts.ts`) and `KeyBindingsManager` are internal. See [architecture.md](architecture.md) for how this module works around that.

## Building a module

Element's own modules build with Vite in library mode:

- **Externalise React** to `window.React`. `@element-hq/element-web-module-api/vite.base.ts` does exactly that (and sets `process.env.NODE_ENV` to production so the JSX runtime matches Element's production React). Outside the monorepo, Node refuses to load that `.ts` file from `node_modules`, so copy its ~20 lines into your `vite.config.ts` (as this repo does).
- Output **one ES module** (`formats: ["es"]`). Element `import()`s it directly.
- Do **not** bundle a second copy of a library whose React contexts Element also uses (e.g. `@vector-im/compound-web`'s Tooltip). Contexts don't cross copies. `widget-toggles` wraps its buttons in its own `TooltipProvider` for this reason.
- CSS: Vite library mode emits a separate `.css` file that nothing loads. Import CSS with `?inline` and inject a `<style>` yourself, or use CSS-in-JS. Use Compound CSS variables (`--cpd-color-…`). Element sets them on `<body>` together with the `cpd-theme-*` class, so anything rendered in the page inherits the current theme. Check that a token exists before using it (e.g. `--cpd-color-bg-accent-subtle` doesn't exist).

## Deploying with the official Docker image

- The image serves `/app` as the nginx root, so `-v ./my-module:/app/element-modules/my-module:ro` makes it available at `/element-modules/my-module/index.js`.
- **The `/modules` auto-loader is a trap with host-specific configs.** `18-load-element-modules.sh` scans `/modules/*/` (entry from `package.json` `main`, else `index.js`) and appends each to `modules` in **`config.json` only**. Element first fetches `config.<hostname>.json` and uses it if it's non-empty (`apps/web/src/vector/getconfig.ts`). matrix-docker-ansible-deploy mounts the same file under both names, so modules added only to `config.json` are never loaded. List modules explicitly instead.
- **Cache-bust the module URL** (`index.js?v=<hash>`). The image's nginx sends no cache headers for these files. `config.json` itself is fetched with a cache-buster, so changing the URL in the config is enough to make clients load a new build.
- After changing the config, the container must restart, because the entrypoint copies the config at startup.

## Testing

- Unit and integration tests: `vitest` with `jsdom`. Mock the few `Api` members you use. Element's own modules use vitest's browser mode instead, which is heavier but more faithful. On Node ≥ 25, run vitest with `--no-experimental-webstorage`, otherwise Node's own `localStorage` global hides jsdom's.
- In a real Element: run the official image (pin the version you deploy) with your build mounted, and drive it with Playwright. Most module UI can be tried on the login page, because modules load before login.
