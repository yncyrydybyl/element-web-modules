# Room checker

An [Element Web](https://github.com/element-hq/element-web) module: press <kbd>Alt</kbd>+<kbd>R</kbd> to check a space's rooms against the space's room policies and fix what fails.

- **Policies live in the space.** One state event in the space holds them, so everyone in the space sees the same rules. Whoever may change the space's settings can change them in the Policies tab; for everyone else they're read-only. A space without policies uses the defaults.
- **They apply to every room in the space and its sub-spaces.** The sub-spaces themselves aren't checked.
- **The Rooms tab** shows how many rooms pass everything, have errors, only warnings, or can't be checked because you aren't in them. Bars show how many rooms fail each policy, and a table shows every room against every policy, worst rooms first. Click a number or a bar to see only those rooms, or search.
- **Click a room** for its checks, and fix what fails right there where you have the power to: rename it, write a topic, upload a picture, turn on encryption (it asks first, because that can't be undone), set the join rule or history to the first allowed value, turn off guest access, add an address, link it to its space. Everything else has a button to the room's settings.
- **Live:** when a room's state changes (a fix of yours or someone else's change), the checks run again.

## The ten policies

| Policy | Passes when | Default | Quick fix |
| --- | --- | --- | --- |
| Name | The room has a name of its own (`m.room.name`), matching an optional regular expression. | error | Rename |
| Topic | The topic has at least *n* characters (default 10). | warning | Write a topic |
| Picture | The room has an avatar. | warning | Upload a picture |
| Encryption | `m.room.encryption` is set. | error | Turn on encryption |
| Who can join | The join rule is one of the allowed ones (default: space members, invite only, space members or ask to join). | error | Set to the first allowed one; "space members" means members of the space the room is listed in |
| History | History visibility is one of the allowed ones (default: everything except "anyone"). | warning | Set to the first allowed one |
| No guests | Guest access isn't `can_join`. | error | Turn off guest access |
| Address | The room has a main address (`m.room.canonical_alias`). | off | Add an address on your server |
| Admins | At least *n* joined members with power 100 (default 2). In room version 12 and later the creators count, though they aren't in the power levels. | warning | — |
| Belongs to the space | The room names the space it's listed in as its parent (`m.space.parent`). | warning | Link it to the space |

Each policy can be turned off, and set to count as an error or a warning.

The policies are stored as the space's `de.datanauten.room_checker.policies` state event (state key `""`):

```json
{ "version": 1, "policies": { "topic": { "enabled": true, "severity": "warning", "minLength": 10 }, … } }
```

Missing or invalid values fall back to the defaults, so other clients can write it too.

## What it knows, and what it doesn't

The module reads Element's matrix-js-sdk client (`window.mxMatrixClientPeg`) because the module API has no room state. Without the client (logged out, a much changed Element) the shortcut does nothing.

- Only rooms you're in can be checked. The others are listed under "Not joined", named from the server's space hierarchy.
- Rooms in sub-spaces you aren't in aren't found.
- Whether you may fix something is matrix-js-sdk's `maySendStateEvent` for that event; the server has the last word, and a refusal is shown under the fix.
- Room settings opens through Element's dispatcher (`window.mxDispatcher`, action `open_room_settings`). Without it, the room opens.

## Configuration

```json
"modules": ["/modules/room-checker/index.js"],
"de.datanauten.room_checker": { "trigger_key": "Alt+R" }
```

`trigger_key` takes the same syntax as the keyboard-shortcuts module (`Mod` is ⌘ on macOS, Ctrl elsewhere). The last space you looked at is remembered per device in `localStorage`.

## Development

```sh
pnpm install
pnpm build          # lib/index.js
pnpm test
pnpm lint:types
e2e/stack.sh up     # Synapse + Element with a space of good and bad rooms, alice / alice-pass on http://127.0.0.1:5807
```

## License

AGPL-3.0-only
