# Speed start for Element Web

Element shows a spinner on every start until it has rebuilt all your rooms from its cache, which takes seconds on a big account. This module draws your last room list right away instead: your spaces, your rooms in their order with their avatars and unread badges, and the header of the room you were in. When Element's own room list is ready, the snapshot fades into it.

Click a room in the snapshot and Element opens that room as soon as it's ready.

| | |
| --- | --- |
| When it shows | On a start while logged in, from the moment modules load until Element shows its room list. Never on the login, registration or welcome pages. |
| When it leaves | As soon as Element shows its room list, or anything else (a login page, a verification prompt, an error, a sync error on the splash). After 60 s at the latest. |
| What is stored | Room and space names, their order, avatars (≈1 kB each), unread badges, the current room's name. One entry in `localStorage` (`de.datanauten.speed_start.snapshot`), typically 50–150 kB. |
| What is never stored | Messages, message previews in the room list, drafts, pinned messages, room topics, tooltips and accessibility labels. |
| When it's refreshed | 5 s after Element is ready, then every minute while the tab is visible, and when you leave or hide the tab. |

## How it works

The module API has no hook before Element renders, but modules load after Element has loaded its theme and before it renders anything. So the module's `load()` reads the stored snapshot and puts it on the page in a fixed layer over `#matrixchat`. The snapshot is a sanitised copy of Element's own HTML, so Element's already loaded CSS draws it exactly like the real thing, in the current theme.

While Element runs, the module copies `.mx_MatrixChat`, keeps the space bar, the room list, the room header and an empty composer, and removes everything else: the timeline, the room list's message previews and hover menus, pinned messages, topics, widgets, every `id`, `title`, `aria-*` and `tabindex`. Avatars are redrawn into small WebP data URLs, because Element's avatar URLs don't survive a reload. Each room row gets its room ID (matched by name against `api.stores.roomListStore`), so a click can be replayed with `api.navigation.openRoom`.

A snapshot is only drawn if it belongs to the user who is logged in now (a snapshot of another user is deleted), was taken with the same Element build (Element's CSS class names are hashed per build), is at most 14 days old and was taken in a window of similar width. Element's logout clears `localStorage`, which removes the snapshot too.

## What it does not speed up

The module only runs once Element's JavaScript, config, language and theme have loaded, so the white screen before that remains: about 0.9 s on a warm cache, 3 s or more cold. Removing that needs a skeleton inlined into Element's `index.html` (a deployment change, not a module). The real start-up work (crypto, the sync cache) is unchanged too: the snapshot makes the wait look like Element, it doesn't make Element ready sooner.

## Limitations

- **Relies on Element's DOM:** `#matrixchat`, `.mx_MatrixChat`, `.mx_RoomListPanel`, `.mx_RoomListItemView` with `[data-testid=room-name]`, `.mx_MatrixChat_splash`, `.mx_RoomView`. Checked against Element Web v1.12.33. If Element changes them, no snapshot is taken or shown; Element itself keeps working.
- **Rooms with the same name:** a click opens the one higher up in the room list.

## Requirements

Element Web or Desktop with module API ≥ 2.0.0. One file, ~10 kB (4 kB gzipped). Load it before other modules if you can: Element loads modules one after another, and the snapshot can only appear once the modules listed before it have loaded.

## Development

```sh
pnpm install
pnpm test          # vitest + jsdom: sanitising, when to draw, hand-over, clicks
pnpm build         # → lib/index.js
e2e/stack.sh up    # throwaway Synapse + Element v1.12.33 with the module, 40 rooms; log in as alice / alice-pass
e2e/stack.sh down
```

## License

AGPL-3.0-only. See [LICENSE](LICENSE).
