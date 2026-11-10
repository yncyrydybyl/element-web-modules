# Remote modules for Element Web

Load your own Element Web modules without a deploy, and turn off the server's. Every user gets a **Modules** tab of its own in Element's settings, after Help & About. It lists every module this Element runs, in two parts:

- **Provided by the server:** the `modules` from `config.json`, each with a short overview and "How to use" when the admin wrote one (`about`, below). Any user can turn them off (and on again) for their account; that takes effect when Element reloads, on each of their devices.
- **Loaded dynamically**, for allowlisted users only: their own. Here they add a module build, either uploaded to the homeserver's media repository or as a URL (e.g. their local dev server), and Element runs it like a module listed in `config.json`.

Loading modules is meant for developing and trying them out. Every module added here runs with full access to the user's account, so only allowlisted users get that part.

| In the tab | Does |
| --- | --- |
| **Upload .js…** | Uploads a single-file module build to the media repo (`mxc://…`) and loads it |
| URL + **Add** | `mxc://…`, `https://…`, or `http://localhost…` / `127.0.0.1` for a dev server (it must send CORS headers) |
| **Turn off** / **Turn on** (server) | Leaves a `config.json` module out from the next start on. This module itself and the ones listed before it show "Always on" |
| **Load** / **Unload** | Loads a module right away / stops it from loading. A running module can't be stopped, so Unload takes effect after a reload (until then, Load switches it back on without a second copy) |
| **Retry** / **Reload Element** | Retries a failed module / reloads Element to pick up a new build at the same URL |
| **Remove** | Removes it from the list |

Both lists are stored in the user's account data (`de.datanauten.remote_modules`), so they follow them to every device. Each module shows its status: loaded (with its module API version), loading, failed (with the error), not loaded.

**Safe mode:** open Element with `?remote_modules=off` (e.g. `https://element.example/?remote_modules=off` or `…/#/home?remote_modules=off`) to start without any remote modules, for example when one breaks Element.

## How it works

1. Element loads this module from `config.json` as usual. It returns immediately, so Element's startup isn't delayed.
2. Once the user is logged in and is on `allowed_users`, it reads their list and fetches each enabled module as text: `mxc://` through the authenticated media API with the user's access token, URLs with a plain `fetch`.
3. The text becomes a `blob:` URL that is `import()`ed. The default export is constructed with Element's module API object and its `load()` is awaited, as Element's own ModuleLoader does.
4. Turned-off server modules: Element imports the `config.json` modules one after another, constructing each before it imports the next, and iterates the very array its config holds. So this module's constructor removes the turned-off entries listed after it from that array, and Element never imports them. Before login it goes by a copy in localStorage (kept per user via Element's `mx_user_id`), which account data updates once the user is logged in. **List this module first in `config.json`**, so that all the others can be turned off.
5. The tab is added to the settings dialog by watching the DOM, because the module API has no settings extension point. Its label and panel sit next to Element's own; while it's open, CSS hides Element's panel and puts "Modules" in the dialog title. Element's React tree isn't touched, and clicking any of Element's tabs leaves it.

Remote modules start after login, not before Element renders like `config.json` modules. Modules that only register renderers, header buttons, keyboard handlers and the like work. A module that must be loaded before the first render (e.g. a custom login component) doesn't.

## Server requirement: blob: scripts

Element's Content Security Policy (a `<meta>` tag in `index.html`) only allows scripts from Element's own origin: `script-src 'self' 'wasm-unsafe-eval' …`. A module fetched from elsewhere has to run from a `blob:` URL, so the policy needs `blob:` in `script-src`. Without it, every module fails with "Element's Content Security Policy blocked it".

With the official `element-web` Docker image, one nginx template does it without touching Element's files. The image renders every `/etc/nginx/templates/*.template` into its nginx config at startup:

```nginx
# csp-blob.conf.template → mount at /etc/nginx/templates/csp-blob.conf.template
sub_filter_once on;
sub_filter "script-src 'self'" "script-src 'self' blob:";
```

This is a server-wide change: it relaxes the policy for every user, not just the allowlisted ones. It works with the read-only container that matrix-docker-ansible-deploy runs (tested with Element v1.12.32). For matrix-docker-ansible-deploy, ship the file with `aux_file_definitions_custom` and add a bind mount to `matrix_client_element_container_extra_arguments`. After changing container arguments, run `systemctl daemon-reload` before restarting `matrix-client-element`.

## Configuration

```json
{
    "modules": ["/element-modules/remote-modules/index.js?v=<hash>"],
    "de.datanauten.remote_modules": {
        "allowed_users": ["@alice:example.org"],
        "about": {
            "space-room-map": {
                "description": { "en": "A zoomable map of your spaces and rooms.", "de": "Eine zoombare Karte deiner Spaces und Räume." },
                "usage": { "en": ["Ctrl+I: open or close the map."], "de": ["Strg+I: Karte öffnen oder schließen."] },
                "link": "https://github.com/yncyrydybyl/element-web-modules/tree/main/modules/space-room-map#readme"
            }
        }
    }
}
```

| Option | Default | Meaning |
| --- | --- | --- |
| `allowed_users` | `[]` | Matrix IDs that may load their own modules. Everyone else only gets the server part of the tab. |
| `about` | `{}` | A short overview per server module, shown in its row: `description` (a sentence), `usage` (one line each, under "How to use") and `link` (https only, "Read more"). Keyed by the module's name, the directory of its `index.js`. Texts are a string or an object by language code; the user's language is picked, then English. |

## Developing a module against it

```sh
cd modules/space-room-map
pnpm dev                                  # vite build --watch → lib/index.js
npx http-server lib -p 5173 --cors -c-1   # serves it with CORS, no caching
```

Add `http://localhost:5173/index.js` in the tab. After a rebuild, click **Reload Element**. Only the developer's browser can reach their localhost, so other devices show the module as failed.

## Limitations

- **Relies on Element internals:** the settings dialog's markup (`aria-controls="mx_tabpanel_USER_…"`, `mx_TabbedView` classes), the order in which Element imports `config.json` modules,, and `window.mxMatrixClientPeg` for the user ID, access token and uploads. If a future Element changes them, the tab or the loading stops working, but Element itself keeps working.
- **No live unloading.** Unloading or removing a module takes effect after a reload. The same goes for turning off a server module.
- **The `blob:` change applies to all users** of that Element, even though only allowlisted users can add modules.

## Development

```sh
pnpm install
pnpm test          # vitest + jsdom: allowlist, loading (mxc with token, URLs), the settings tab, safe mode
pnpm lint:types
pnpm build         # → lib/index.js (~25 kB)
```

## License

AGPL-3.0-only. See [LICENSE](LICENSE).
