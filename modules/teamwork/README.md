# Teamwork for Element Web

Four chat features that Microsoft Teams users rely on, built the Matrix way: **send later**, **important / urgent** delivery, **saved messages** and **praise**. Each one uses a Matrix building block (delayed events, push rules, account data, plain messages with a fallback), so it works across devices, federates, and keeps end-to-end encryption intact.

| | Where | Built on |
| --- | --- | --- |
| **Send later** | Composer **+** → *Send later*. Presets (in an hour, tomorrow 9:00, Monday 9:00) or any time. A clock with a counter appears in the room header while messages are scheduled: *Send now* or *Delete*. | [MSC4140](https://github.com/matrix-org/matrix-spec-proposals/pull/4140) delayed events. The homeserver holds the already encrypted event and sends it on time, even if all your devices are off. The list is on the server, so every device shows it. |
| **Important / urgent** | Composer **+** → *Important or urgent*. Combines with *Send later* (Teams drops the urgent flag when you schedule). Urgent messages mention the people ticked under *Notify*: everyone in rooms with up to 20 other members, chosen by the sender in bigger rooms. | A field in the content (`de.datanauten.priority`) plus a prefix in the plain-text body, so other clients show it too. Urgent messages also carry `m.mentions` for their recipients, so the standard mention push rule notifies them in every client, also in rooms set to "mentions only", without any custom rule. Recipients who use Element with this module get an override **push rule** in their own account that makes urgent messages notify with sound and a highlight on all their devices, including phones (see FluffyChat below for what other clients do with it). In Element Web, this module also reminds them every 2 minutes for 20 minutes until they read the message (on any device), and they can turn that off. |
| **Saved messages** | Bookmark in each message's action bar; list from the bookmark in the room header. | Account data (`de.datanauten.teamwork.saved`) that holds only room and event IDs. The messages stay encrypted in their rooms and are decrypted locally when the list is shown. |
| **Praise** | Composer **+** → *Praise*. Pick people, a badge and a note. | A normal `m.text` message with a readable fallback (`🤝 Team player — for Bob`), a mention (`m.mentions`), and the badge in `de.datanauten.praise`. Element Web with this module draws it as a card. |

## The Matrix way, compared with Teams

- **Scheduling isn't capped at 7 days.** The homeserver admin sets the limit (`max_event_delay_duration` in Synapse).
- **Urgent works everywhere.** Teams only allows urgent messages in 1:1 and group chats of up to 20 people; here it works in any room.
- **The recipient decides how loud.** The push rule and the reminders are in the recipient's account and can be turned off there, rather than imposed by the sender's client.
- **Nothing leaks.** Scheduled messages are stored as ciphertext, saved messages as IDs, and praise is end-to-end encrypted like any other message.
- **Interoperable.** Every feature degrades to readable text in clients without the module.

## With other clients: FluffyChat

Tested against FluffyChat Web 2.11.5 (Matrix Dart SDK 14.2.0) in November 2026, with the source read alongside.

| Feature | A FluffyChat user receiving it | A FluffyChat user sending it |
| --- | --- | --- |
| Send later | A normal message that decrypts, also when the server sends it while the sender is offline. **Exception:** a FluffyChat device created *after* the message was scheduled can't decrypt it ("Message not decryptable"). | No UI for it. Messages someone scheduled in Element still go out; FluffyChat just can't list or cancel them. |
| Important / urgent | Plain text with the prefix: `❗ Important: …`, `🚨 Urgent: …`. No badge, no reminders. **Urgent messages mention their recipients**, so a FluffyChat user who was ticked under *Notify* gets a mention notification even with the room on "mentions only" (verified: highlight + sound from the server's `/notifications`, and nothing for a member who was unticked). FluffyChat's mute still silences it. The extra urgent push rule is only there if the person has used Element with this module at least once, because it's created in the recipient's own account; without it and without a mention, an urgent message is an ordinary message. With it, the server marks them highlight + sound and they get through FluffyChat's "mentions only" (a `room` rule, which comes after override rules). FluffyChat's "Mute" is an override rule too, and Synapse puts the newest override rule first: a room muted after the rule was installed stays muted. FluffyChat ignores the `sound` and `highlight` tweaks (it only reads `notify`), so on a FluffyChat phone an urgent message looks like any other notification. FluffyChat lists the rule in Settings → Notifications as **"Urgent"** ("Unknown push rule …"), where it can be switched off or deleted; the module won't add it again. | No UI for it. |
| Reading stops the reminders | Yes. FluffyChat's read receipts (public by default; private ones too) end the reminders in the person's Element within seconds. | — |
| Saved messages | Not shown (FluffyChat ignores the account data); nothing breaks. | No UI for it. |
| Praise | The HTML fallback: `🤝 Team player — for [Fiona]` with a user pill and the note as a quote, plus a mention notification (`m.mentions`, which the Dart SDK evaluates). No card. | No UI for it. |

## Encryption of scheduled messages

matrix-js-sdk's `_unstable_sendDelayedEvent` **does not encrypt**: `encryptAndSendEvent` returns early for delayed sends (js-sdk as shipped in Element Web v1.12.33). In an encrypted room that would put the message on the server in plain text. This module therefore encrypts the event itself through the client's crypto backend (`client.cryptoBackend.encryptEvent`, internal) and schedules the `m.room.encrypted` event over HTTP. If that's not possible, it refuses to schedule and says why. The e2e check in development confirms that the server only holds `m.megolm.v1.aes-sha2` ciphertext and that the recipient decrypts the message.

The Megolm keys are shared with the room's devices **at scheduling time**. Someone who joins the room (or a new device) between scheduling and sending can't decrypt the message, unless they get the keys from key backup or a key share.

In encrypted rooms, the server's list of scheduled messages only contains ciphertext. The device that scheduled a message keeps a plain-text preview in `localStorage`, never in account data; other devices show "Encrypted, scheduled on another device".

## Requirements

- Element Web or Desktop with module API ≥ 2.0.0 (composer upload options, message renderers, room header buttons).
- For *Send later*: a homeserver with MSC4140. In Synapse, set `max_event_delay_duration` (e.g. `30d`). Without it the option says the server doesn't support it; the other features still work.
- One file, ~55 kB (15 kB gzipped).

## Limitations

- **Relies on Element internals:** `window.mxMatrixClientPeg`, the client's crypto backend for scheduled messages in encrypted rooms, the action bar DOM (`[role=toolbar].mx_MessageActionBar`, the Options button's label) for the bookmark, and the composer's DOM (plain composer or rich text editor) for picking up and clearing the text you already typed. Checked against Element Web v1.12.33 (November 2026). If one of them changes, that feature turns off or (for the composer) the dialog starts empty; Element itself keeps working.
- **Priority and praise messages can't be edited**, because the module renders them itself. For the same reason, links and user pills in an urgent or important message show as plain text in Element (other modules of the [Teams suite](../../suite) still add their cards and lines below it).
- **Reminders need Element Web with this module** on the recipient's side, and so does installing the push rule. Once installed, the rule is evaluated by the server and by every client, but how loud a notification is depends on the client (FluffyChat ignores the tweaks).
- **Messages from the dialog are plain text**, without the rich-text formatting the composer offers.

## Development

```sh
pnpm install
pnpm test          # vitest + jsdom: scheduling (encrypted, fail-closed, threads), reminders, saved, praise
pnpm build         # → lib/index.js
e2e/stack.sh up    # throwaway Synapse (delayed events on) + Element v1.12.33; alice, bob, carol / <name>-pass
e2e/stack.sh down
```
