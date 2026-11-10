# Activity for Element Web

The Teams **Activity** feed for Element: one list of everything that concerns you across all rooms, newest first: **mentions**, **replies to your messages**, **reactions to your messages** and **replies in threads you're part of**. Encrypted rooms included, without the server ever reading them.

| | |
| --- | --- |
| **Where** | A bell in the space panel (left rail, below your spaces) opens the feed as a page, like Teams' Activity. The same bell in every room header opens it as a dialog. Both show the unread count. |
| **What** | Filters: All, Unread, Mentions, Replies, Reactions, Threads. Replies and reactions quote your message. Clicking an entry opens the room at that message (thread replies open their thread). *Mark all as read*. |
| **How far back** | 14 days, at most 200 entries. |
| **Read state** | Your read receipts, nothing of its own. Reading a message on your phone, in FluffyChat or anywhere else clears it here; reading it here (opening it or *Mark all as read*) sends a normal receipt that your other devices see. |

## Where the entries come from

Two sources, merged by event ID; where both have an event, the local one wins.

1. **The rooms loaded on this device**: the main timeline and the loaded threads of every joined room. These events are already decrypted, so this is what sees reactions, replies and mentions in encrypted rooms as they happen.
2. **The homeserver's notification list** (`GET /_matrix/client/v3/notifications`, paged, until 14 days or 200 entries), which reaches further back than what's loaded. In encrypted rooms the server can't read anything and lists *every* message, so each entry is decrypted locally and classified like the rest; whatever doesn't concern you, or can't be decrypted, is dropped.

Plus two gap fillers:

- **Older messages that replies point at.** Whether a reply is to *you* depends on who wrote the replied-to message. When that message isn't loaded, it's fetched once (`GET /rooms/{id}/event/{id}`; the sender is readable even in encrypted rooms) and cached. At most 4 requests at a time.
- **Reactions to older messages.** matrix-js-sdk drops reactions to messages it doesn't have loaded; they never reach a timeline (`Room.eventShouldLiveIn`). The module therefore listens to the client's `event` emitter from the moment the client exists and keeps up to 500 reactions (encrypted ones until they're decrypted).

What counts, in this order (a reply to you also mentions you, so it's listed once, as a reply):

| Kind | Rule |
| --- | --- |
| Reaction | `m.reaction` with `m.annotation` on one of your messages |
| Reply | `m.in_reply_to` points at one of your messages (a thread's fallback reply, `is_falling_back`, doesn't count) |
| Thread | `m.thread` reply in a thread you started or wrote in |
| Mention | `m.mentions.user_ids` contains you, or `m.mentions.room` |

Your own events, edits, redacted and undecryptable events are left out.

## Compared with Teams

- **Encrypted, and still complete.** The feed is put together on your device; the server doesn't need to read your messages to build it, and nothing about it is stored on the server.
- **One read state everywhere.** Teams keeps an Activity read state of its own. Here it's your read receipts, so the feed agrees with every other Matrix client and device you use.
- **Federated rooms too.** Mentions from people on other homeservers show up like any other.

## With other clients

Nothing is sent and nothing is stored in your account, so other people's clients are unaffected.

- **FluffyChat and other clients** don't show the feed. Their read receipts do count: reading a message in FluffyChat (public or private receipts) marks it read here. Not tested end to end against FluffyChat for this module; it's the same receipt path the teamwork module's urgent reminders were verified with.
- **Mentions** use `m.mentions`, which current clients (Element, Element X, FluffyChat) set. Messages from clients that only put your name in the body aren't listed as mentions.

## Requirements

- Element Web or Desktop with module API ≥ 2.0.0 (`openDialog`, room header buttons).
- For the space panel entry and the full page: `extras.setSpacePanelItem` and `navigation.registerLocationRenderer` (alpha in module API 2.3.0, present in Element Web v1.12.33). Without them the feed is only in the room header.
- One file, ~24 kB (8 kB gzipped).

## Limitations

- **Relies on Element internals:** `window.mxMatrixClientPeg` for timelines, decryption, read receipts and the client's `event` emitter, and the room's `m.room.create` event's class to build events from raw JSON. Checked against Element Web v1.12.33 (November 2026).
- **Reactions to older messages** are only seen if they sync while Element is running, or were part of the sync it loaded at startup. A reaction from last week to a message from last month, received while Element was closed, is missed: the server doesn't list reactions as notifications and there's no way to find them without scanning history.
- **Replies to a message nobody has loaded** cost one request each (cached). Mentions don't.
- **Thread replies** count only for threads whose root or one of your replies is loaded on this device.
- **"Mark all as read"** sends one read receipt per room at the newest entry (or the room's newest event). Receipts are per room, so earlier messages in those rooms are marked read too, as opening the room would.
- **Recomputes on every timeline change** (debounced to 400 ms) by walking the loaded events of all joined rooms. Fine for normal accounts; not measured on accounts with thousands of rooms.

## Development

```sh
pnpm install
pnpm test          # vitest + jsdom: classification, server list paging and decryption, merge, older targets, reactions buffer, mark all read
pnpm build         # → lib/index.js
e2e/stack.sh up    # throwaway Synapse (act.test, :18480) + Element v1.12.33 (:5811); alice, bob, carol / <name>-pass
e2e/stack.sh down
```
