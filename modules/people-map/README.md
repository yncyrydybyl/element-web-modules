# People map

An [Element Web](https://github.com/element-hq/element-web) module: press <kbd>Alt</kbd>+<kbd>P</kbd> for a map of the people you share rooms with.

- **You are in the middle.** The closer someone sits, the more you have in common: a DM counts most, a small room more than a big one, and replies and mentions between you count on top. Contact that's long ago counts less.
- **One sector per context**: the space, event, bridge network or "Direct messages" where you share the most with someone, so you see where you know people from. Sectors take the district colours of the [space-room-map](../space-room-map) module.
- **Bigger circles** for closer people, a **green ring** for people online now, a **dark ring** for people you have a DM with.
- **The list beside the map**: search, filter (everyone, with a DM, your server, bridged) and sort (closest, recent contact, shared rooms, name). Pointing at someone marks them on the map.
- **A card per person** (click them, or Enter in the list): their names, presence, where you know them from, closeness, shared rooms and spaces, their role there, replies and mentions between you, messages seen, last contact. It has buttons to open your DM or their profile, and a link to every shared room.

Everything is worked out in the browser from what Element has already loaded; nothing is sent anywhere.

## What it knows, and what it doesn't

The module reads Element's matrix-js-sdk client (`window.mxMatrixClientPeg`) because the module API has no member lists or timelines. Without the client (logged out, a much changed Element) the shortcut does nothing.

- **Members:** Element loads member lists lazily, so in big rooms only some members are known, mostly those who wrote recently.
- **Messages, replies and mentions** only count in what the client has loaded of each room's timeline (usually the last screenful or so), and in encrypted rooms only what it could decrypt.
- **People you only share rooms of more than 150 members with**, and never talked to, are left out unless you turn them on. Bots (`…bot`, hookshot, mjolnir, draupnir …) are left out too, unless you turn them on.
- **Bridged people** are recognised by puppet user IDs like `@whatsapp_…` or `@telegram_…`.
- **Presence** only shows when the homeserver has it switched on.

## Settings

Settings → Preferences gets a "People map" section (after "Spaces"). The settings are stored in account data (`de.datanauten.people_map.settings`), so they follow you to every device.

| Setting | Default | |
| --- | --- | --- |
| People from large rooms | off | Also show people you only share rooms of more than 150 members with. |
| Bots | off | Also show bots and integrations. |
| Animations | on | Zoom to a person when you choose them, and out from you on opening. Always off with `prefers-reduced-motion`. |
| Keep avatars between sessions | on | Profile pictures stay in Cache Storage (`de.datanauten.people_map.avatars`). Turning it off deletes them. |

The legend's state and the sort order are kept per device in `localStorage`.

## Configuration

```json
"modules": ["/modules/people-map/index.js"],
"de.datanauten.people_map": { "trigger_key": "Alt+P" }
```

`trigger_key` takes the same syntax as the keyboard-shortcuts module (`Mod` is ⌘ on macOS, Ctrl elsewhere). The default is <kbd>Alt</kbd>+<kbd>P</kbd> because <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> is Firefox's private window, which a page can't take over.

## Development

```sh
pnpm install
pnpm build          # lib/index.js
pnpm test
pnpm lint:types
e2e/stack.sh up     # Synapse + Element with seeded people, alice / alice-pass on http://127.0.0.1:5806
```

Opening logs `[people-map] Opened in N ms (P people, R rooms)` at debug level.

The rendering (sigma.js WebGL programs, camera flights, avatar loading, the settings store and injector) and the districts come from the space-room-map module; the modules are standalone, so they're copies.

## Limitations

- Element has no extension point for its user info panel, so the map can't be opened from there yet.
- Element's space bar API (`extras.setSpacePanelItem`) makes a button a "space" that filters the room list, so the map doesn't put a button there.
- The settings section depends on Element's Preferences markup (`#mx_tabpanel_USER_PREFERENCES_TAB`); when that changes, the section is missing, nothing else breaks.

## License

AGPL-3.0-only
