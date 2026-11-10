# Tag mentions for Element Web

Teams-style group mentions, built the Matrix way: type **@oncall** or **@designers** and everyone in the tag gets a mention. There is no group mention in the Matrix spec (and no MSC for one as of November 2026), so a tag **expands into ordinary user mentions** when you send: the members' user IDs go into `m.mentions.user_ids`, and the default push rule `.m.rule.is_user_mention` notifies them in every client: Element Web, Element X, FluffyChat, phones. No custom push rule, nothing the recipient has to install.

| | Where | Built on |
| --- | --- | --- |
| **Define tags** | Tag icon in the room header → *Tags*. Create, edit and delete tags for the room or for any of its spaces. People without permission see the tags read-only. | Room state: one `de.datanauten.tag` state event per tag, state key = tag name, content `{ "label": "…", "user_ids": [ … ] }`. A deleted tag is an empty content. The room's power levels decide who may change tags, and tags federate like any other state. |
| **Mention a tag** | Type `@` in the composer: matching tags appear above it (arrows, Tab/Enter, or click). Or composer **+** → *Mention a tag*. | When the message is sent, `@oncall` becomes `@oncall (Alice, Bob)` in the text, with user pills in the HTML, and every member is added to `m.mentions.user_ids`. The tags used are recorded in `de.datanauten.tags`. |
| **@channel** | Like Teams' @channel. | Becomes Matrix's own `@room` (`m.mentions.room`). Needs the room's *notify everyone* power level (`notifications.room`, default 50), like @room. |
| **@team** | In rooms that belong to a space. | Everyone from the parent space who is in this room, as individual user mentions. Because it reaches the whole room, it needs the same power level as @room. |
| **In the timeline** | Below a tag message: *Mentioned via tag* with a chip per tag (who it mentioned on hover). | A message renderer that wraps Element's own rendering, keyed on `de.datanauten.tags`. Editing works as usual. |

## How tags apply

- A tag defined in a **space** applies in all of the space's rooms (the room's `m.space.parent` events and spaces that list it as `m.space.child`, among the spaces you're joined to). A tag of the same name in the **room** wins.
- Only members **joined to the room** are mentioned: the others can't receive the message anyway. The picker says who is left out ("Not in this room, so not notified: Dave"). The sender is never mentioned.
- Names are lower case, 1–32 characters out of `a–z 0–9 - _`. `room`, `channel`, `team`, `here`, `everyone` and `all` are reserved.
- **Limit:** one message mentions at most 50 people through tags (`max_mentions`, see below). A tag over the limit is sent as typed, without mentions, and the sender gets a notice; the editor won't save a tag with more members. The same notice appears when you use @channel or @team without the power level, or when nobody from a tag is in the room.
- **Who may change tags:** whoever may send `de.datanauten.tag` state events, which is `state_default` (usually 50, moderators) unless the room's power levels list the type. To let everyone in a room manage tags, set `"events": { "de.datanauten.tag": 0 }` in its power levels.

### Why typing `@` works

Element's own autocomplete (users, rooms, commands) is internal and modules can't add providers to it. So the module watches the composer's DOM: when the word before the caret starts with `@` and matches a tag, it shows its own list above the composer. Picking a tag replaces the typed `@onc` with `@oncall ` through an input event, which Element's composer model takes like typing. It only takes the keyboard (arrows, Tab, Enter, Escape) while Element's own autocomplete isn't open, so the two never fight. If you type a full tag name and press Enter while the list is open, Enter completes the tag; press Space first or Enter again to send.

The expansion itself happens in `MatrixClient.sendMessage`, which Element's composers (plain and rich text) call before the local echo is built and before encryption. So the expanded text is what's shown, encrypted and sent, and messages typed with or without the list are treated alike. The composer **+** entry exists as the discoverable route; if the send hook can't be installed (a future Element changes the internals), the **+** dialog sends the message itself with the tag expanded, and the `@` list is switched off.

No keyboard shortcut: `@` already is one, and Element's shortcut table isn't open to modules.

## The sent message

```json
{
  "msgtype": "m.text",
  "body": "@oncall (Bob, Carol) the build is red",
  "format": "org.matrix.custom.html",
  "formatted_body": "<strong>@oncall</strong> (<a href=\"https://matrix.to/#/@bob:example.org\">Bob</a>, <a href=\"https://matrix.to/#/@carol:example.org\">Carol</a>) the build is red",
  "m.mentions": { "user_ids": ["@bob:example.org", "@carol:example.org"] },
  "de.datanauten.tags": [{ "name": "oncall", "user_ids": ["@bob:example.org", "@carol:example.org"] }]
}
```

The text names the first 10 members and counts the rest (`… +5`); `m.mentions` always has all of them. Mentions Element already added (pills you typed, the sender of a message you reply to) are kept. `@oncall` inside code (`` `@oncall` ``, code blocks, links) is left alone, and so are user IDs (`@bob:server`) and e-mail addresses. Edits aren't expanded again.

## With other clients

Nothing here needs the module on the receiving side. FluffyChat 2.11.5 (Matrix Dart SDK 14.2.0) from reading its source, Element X from the spec its SDK (ruma) implements; the module itself was run against Element Web only:

| | A user of another client receiving it | A user of another client sending it |
| --- | --- | --- |
| Tag mention | The text with user pills: **@oncall** (Bob, Carol). Members get a **mention notification**: `m.mentions.user_ids` matches `.m.rule.is_user_mention`, which the Dart SDK and the Rust SDK evaluate (`event_property_contains`), also in encrypted rooms where the client evaluates after decrypting. It gets through "mentions only" room settings. No footer chip. | No `@` list and no expansion: typing `@oncall` sends plain text that mentions nobody. Use a client with this module, or mention people individually. |
| @channel | `@room` with `m.mentions.room`: the standard room mention. | Use `@room`, which every client has. |
| Tag definitions | Hidden. FluffyChat hides unknown state events by default ("Hide unknown events"); Element without the module hides them too. They're room state, so they show in Element's *Developer tools → Explore room state*. | Can't be edited, except as raw state (e.g. Element's developer tools or `/devtools`). |

## Encryption

Tags are room state, which Matrix doesn't encrypt: the server sees tag names, labels and member lists (it already knows the room's members). The **messages stay end-to-end encrypted**: the expansion runs before encryption, so the names and `m.mentions` travel inside the ciphertext.

In encrypted rooms the server can't see `m.mentions`. It notifies all members for the encrypted event (`.m.rule.encrypted`, without highlight), and each recipient's client decrypts and decides locally that it's a mention. Element (Web, X), FluffyChat and other clients built on the major SDKs do that, including for push notifications on phones. That's the same for every mention in Matrix, not specific to tags.

## Configuration

Optional, in Element's `config.json`:

```json
"de.datanauten.tag_mentions": { "max_mentions": 50 }
```

## Requirements

- Element Web or Desktop with module API ≥ 2.0.0 (composer upload options, message renderers, room header buttons). Checked against Element Web v1.12.33 (module API 2.3.0).
- One file, ~47 kB (13 kB gzipped).

## Limitations

- **Relies on Element internals:** `window.mxMatrixClientPeg` (room state, members, sending state events), patching `MatrixClient.sendMessage` for the expansion, and the composer's DOM (`.mx_BasicMessageComposer_input`, or `.mx_WysiwygComposer_Editor_content` with the rich text editor on, and `.mx_Autocomplete`) for the `@` list. Checked against Element Web v1.12.33 (November 2026). If one of them goes away, the matching part turns off: without the send hook, the **+** dialog sends by itself.
- **Only Element Web with this module expands tags.** Others receive the expanded mentions fine but can't send them.
- **Membership is a snapshot.** The expansion uses who is in the tag and the room at the time of sending; the message doesn't change if the tag changes later. A tag's member list isn't tied to anything (no sync with an HR system or Teams' tag API).
- **No rename:** delete and create the tag again.
- **@team only reaches people who are in the room.** In Teams, team members can read every channel; in Matrix, space members who haven't joined a room can't receive its messages. So @team in a room is "the space's people here", and it needs the @room power level.
- **Spaces you haven't joined don't count.** Tags of a parent space only apply for senders who are joined to that space (the client doesn't have its state otherwise).
- **Threads** use the same send path and composer, so expansion and the `@` list work there too, but that wasn't part of the end-to-end check.
- **Typing a full tag name and pressing Enter** completes the tag instead of sending, like an autocomplete does. Type a space first.

## Development

```sh
pnpm install
pnpm test          # vitest + jsdom: expansion (HTML, code, limits, @channel), tag resolution, send hook, @ list, dialogs
pnpm build         # → lib/index.js
e2e/stack.sh up    # throwaway Synapse (tags.test, :18481) + Element v1.12.33 (:5812); alice, bob, carol / <name>-pass
e2e/stack.sh down
```
