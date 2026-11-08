# Element Web modules

Runtime modules for [Element Web](https://github.com/element-hq/element-web) and Element Desktop. They use the [module API](https://github.com/element-hq/element-web/tree/develop/packages/module-api) (2.x), so they load into a stock Element without a custom build.

| Module | What it does | License |
| --- | --- | --- |
| [keyboard-shortcuts](modules/keyboard-shortcuts) | Press <kbd>?</kbd> for a Gmail-style overview of all of Element's keyboard shortcuts, and add your own (synced via account data). | AGPL-3.0-only |
| [space-room-map](modules/space-room-map) | Press <kbd>Ctrl</kbd>+<kbd>I</kbd> for a zoomable 2D map of your spaces and rooms, with your spaces listed beside it: point at one and the map flies there. | AGPL-3.0-only |
| [people-map](modules/people-map) | Press <kbd>Alt</kbd>+<kbd>P</kbd> for a map of the people you share rooms with: grouped by where you know them from, the closest ones nearest you, with a card per person. | AGPL-3.0-only |
| [room-checker](modules/room-checker) | Press <kbd>Alt</kbd>+<kbd>R</kbd> to check a space's rooms against policies kept in the space (name, topic, picture, encryption, who can join …), with quick fixes. | AGPL-3.0-only |
| [remote-modules](modules/remote-modules) | Allowlisted users load their own modules (uploaded to the media repo or from a dev server URL) from Settings → Help & About, without a deploy. Needs `blob:` in Element's `script-src`. | AGPL-3.0-only |
| [multi-tab](modules/multi-tab) | Keep several Element tabs open at once: the first one syncs and holds the encryption keys, the others mirror it and take over when it closes. | AGPL-3.0-only |
| [user-account-widgets](modules/user-account-widgets) | Your own widgets (a PDF viewer, a participant panel …) in every room, from a **My apps** button in the room header. They live in your account, not in the room: nothing is published, and they act in whichever room you open them in. | AGPL-3.0-only |
| [marcade](modules/marcade) | An **Apps** button in every room header that opens (or adds) the [Marcade Store](https://marcade.store) widget. | Apache-2.0 |

Each module is a standalone package with its own README, build, tests and license. There is no shared workspace: `cd modules/<name>` and use that module's package manager (pnpm for keyboard-shortcuts and space-room-map, npm for marcade).

## Using a module

1. Build it (`pnpm build` / `npm run build`), or download `index.js` from the module's [release](https://github.com/yncyrydybyl/element-web-modules/releases). Each build is a single ES module file.
2. Serve that file from your Element Web's origin, e.g. at `/element-modules/<name>/index.js`.
3. List its URL in Element's `config.json` under `"modules"`, with a cache-buster such as `?v=<hash>`.

### ESS Community

No config change is needed: put the built file into a ConfigMap and mount it at `/modules/<name>/`. The Element Web image then adds it to `config.json` by itself when the pod starts.

```sh
kubectl create configmap element-module-keyboard-shortcuts -n ess --from-file=modules/keyboard-shortcuts/lib/index.js
```

```yaml
# ~/ess-config-values/element-modules.yaml, pass it to your helm upgrade command with -f
elementWeb:
  extraVolumes:
    - name: keyboard-shortcuts
      configMap:
        name: element-module-keyboard-shortcuts
  extraVolumeMounts:
    - name: keyboard-shortcuts
      mountPath: /modules/keyboard-shortcuts
      readOnly: true
```

Or skip the ConfigMap and let an init container download the module from its [GitHub release](https://github.com/yncyrydybyl/element-web-modules/releases) when the pod starts: see [Straight from a GitHub release](modules/keyboard-shortcuts/docs/deployment.md#straight-from-a-github-release). Listing a GitHub or CDN URL directly in `modules` does not work, because Element Web's Content Security Policy only allows scripts from its own origin.

### More

[modules/keyboard-shortcuts/docs/deployment.md](modules/keyboard-shortcuts/docs/deployment.md) covers matrix-docker-ansible-deploy and ESS Community in detail and applies to any module. [modules/keyboard-shortcuts/docs/element-web-modules.md](modules/keyboard-shortcuts/docs/element-web-modules.md) collects notes on how Element Web modules work and where the upstream docs are.

## History

The modules started as separate repositories. Their histories were imported into `modules/<name>/` unchanged.
