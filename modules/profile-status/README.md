# Profile status for Element Web

What Microsoft Teams users look at before they write to someone: an **availability** (Available, Busy, Do not disturb, Be right back, Away, Out of office, and an automatic **In a call**), a **status message** ("Working from Munich", "Back Monday") and a **profile card** with job title, department and phone. Element only has online presence. This module adds the rest, stored in Matrix **profile fields** ([MSC4133](https://github.com/matrix-org/matrix-spec-proposals/pull/4133), in the spec since v1.16) using the field names of [MSC4426](https://github.com/matrix-org/matrix-spec-proposals/pull/4426) "User Status Profile Fields", so Element's own implementation and other MSC4426 clients read the same data.

| | Where | Built on |
| --- | --- | --- |
| **Set status** | User menu (your avatar, top left) → the status entry. Availability, a message, *Clear status after* (never, 1 hour, today, this week). | MSC4426's `m.status` field (unstable `org.matrix.msc4426.status`): `{ emoji, text }`. The availability picks the emoji (🟢 🔴 ⛔ ⏳ 🟡 🌴), so every MSC4426 client gets the gist. The availability and the expiry are extra keys in the same object (below). |
| **Out of office** | Same dialog → *Out of office*, optional return date. The status clears itself on that day. Optional auto-reply (off by default, see below). | The same field, with the return date as `de.datanauten.ooo_until`. Without a message, the text becomes "Out of office, back on Mon, 16 Nov". |
| **In a call** | Automatic while you are connected to an Element Call / group call / video room in this Element. Your status stays as it was and is shown again when you hang up. | MSC4426's `m.call` field (unstable `org.matrix.msc4426.call`): `{ call_joined_ts }`, a separate field, so nothing has to be restored. Can be turned off in the dialog. |
| **Profile card** | User menu → *Edit profile card*. Job title, department, phone. The admin can prefill the fields and lock them (below). | Three string fields: `de.datanauten.job_title`, `de.datanauten.department`, `de.datanauten.phone`. No MSC defines such fields (checked November 2026; [MSC4208](https://github.com/matrix-org/matrix-spec-proposals/pull/4208)'s free-form `u.*` fields carry their label in the key, which can't be translated or prefilled reliably), hence the `de.datanauten.*` namespace. |
| **Seeing it** | DM header (a chip with the other person's status; click for status and card), user info panel (status, until when, card, `tel:` link), member list and sender names in the timeline (a coloured dot, the full status as tooltip), your own avatar in the user menu. | Profiles are fetched when a person is shown and refreshed every 30 s (DM header, user info) or 2 min (lists). |

## Field names

```jsonc
// PUT /_matrix/client/v3/profile/@alice:example.org/org.matrix.msc4426.status
{ "org.matrix.msc4426.status": {
    "emoji": "🔴",                                // MSC4426, required
    "text": "Working from Munich",                // MSC4426, required, max. 256 bytes
    "de.datanauten.availability": "busy",         // available | busy | dnd | brb | away | ooo
    "de.datanauten.expires_ts": 1794351600000,    // "clear after" / out-of-office end, epoch ms
    "de.datanauten.ooo_until": "2026-11-16",      // out of office: the day you're back
    "de.datanauten.auto_text": true               // text is just the availability's label
} }
// While in a call (MSC4426 says seconds; Element writes milliseconds; both are read)
{ "org.matrix.msc4426.call": { "call_joined_ts": 1794291647 } }
// Profile card
{ "de.datanauten.job_title": "Product Manager" }  // also de.datanauten.department, de.datanauten.phone
```

The extras live inside the status object rather than in fields of their own: a client that only knows MSC4426 replaces the whole object when it sets a status, so the availability and expiry go with it and can never contradict the status shown. When MSC4426 becomes stable the module will also read `m.status` / `m.call` (it already falls back to them when reading). MSC4426 requires a text, so "Busy" without a message stores the label in the setter's language (`auto_text`), and viewers with the module show their own translation. "Available" without a message deletes the field, like Teams' default.

## The Matrix way, compared with Teams

- **A call doesn't overwrite your status.** Teams switches you to "In a call" and back. Here the call is its own field: "In a call" is shown on top while it lasts (except over *Do not disturb* and *Out of office*, as in Teams), and your message stays visible next to it.
- **Statuses expire on the server's data, not on one device.** Any of your Elements with the module clears an expired status; viewers with the module hide it even before that.
- **The admin can fill the card.** Profile fields can be written with an admin token, so an HR or identity-provider sync keeps job titles current.
- **Interoperable.** Any client can read the fields with `GET /profile/{userId}`; MSC4426 clients show emoji and text.

## With other clients

Profile fields are not encrypted and not tied to rooms: **any client (and anyone with an account, often even without) that looks up your profile can read them.** What they show:

| Client | Status you set with the module | Profile card |
| --- | --- | --- |
| **Element Web/Desktop 1.12.33 with its own MSC4426 code active** (labs flag `feature_user_status`, default **on** once the homeserver advertises `org.matrix.msc4429`; in Synapse that's `include_profile_updates_in_sync: true`) | Emoji + text in the user menu, user info, member list, timeline and DM list (`🔴 Working from Munich`), and its own "📞 On a call" from `m.call`. It ignores availability and expiry: an expired status stays visible there until one of your Elements with the module deletes it. Element writes `m.call` itself in that mode; the module then leaves calls, the timeline and member list badges and the status line in user info to Element and adds the rest (availability, clear-after, out of office, card, auto-reply, DM header). Verified in the e2e stack (`PS_MSC4429=1`). | Not shown. |
| **Element without that** (the common case: Synapse doesn't advertise MSC4429 by default) | Nothing; only Element users with this module see statuses. | Not shown. |
| **Other MSC4426 clients** (e.g. Voyage, per the MSC) | Emoji + text. | Not shown. |
| **FluffyChat and clients without MSC4426** | Nothing (not tested; the Matrix Dart SDK has no MSC4426 support we know of). The data is there for anyone who implements it. | Not shown. |
| **Every client** | The out-of-office **auto-reply** is an ordinary `m.notice` message ("I'm out of office and back on Mon, 16 Nov. I'll reply then. (Automatic reply)"), end-to-end encrypted in encrypted DMs. | — |

## Out-of-office auto-reply: off by default, and why

The option exists because a status is easy to miss (on phones, in clients without MSC4426), while a reply in the chat is not. It's off by default, and you may want to keep it off:

- **It runs in your browser.** The reply is sent by an Element with this module that is open somewhere, which is exactly what's usually not the case when you're out of office. A reliable auto-reply belongs on the server (a bot or appservice); the homeserver has no built-in one.
- **Once per DM per day**, only for DMs (`m.direct`), only for messages that arrive while you're away (not the backlog when a device comes online), never to `m.notice` messages (bots), your own messages or other auto-replies (`de.datanauten.auto_reply` marker). The last reply per DM is recorded in your account data (`de.datanauten.profile_status`) before sending, so a second device doesn't reply again; two devices replying in the same second could still both send.
- **It tells anyone who writes to you that you're away.** The status says so too, but the reply also reaches people who wouldn't look.
- The admin can remove the option with `"auto_reply": false`.

## Configuration

Optional, in Element's `config.json`:

```json
"de.datanauten.profile_status": {
    "editable_fields": ["phone"],
    "auto_reply": true,
    "timeline": true,
    "member_list": true
}
```

- `editable_fields`: which card fields users may change in the dialog (default: all three). The others show "Managed by your organisation". **This is only the UI:** Synapse has no per-field write protection for custom fields, so a user can still change them over the API.
- `auto_reply`: offer the out-of-office auto-reply (default `true`; each user still has to turn it on).
- `timeline`, `member_list`: the dots next to names (default `true`).

### Prefilling the profile card (admin)

A server admin's access token can write other users' profile fields (Synapse ≥ 1.135), e.g. from an HR export, LDAP or Entra ID sync job:

```sh
curl -X PUT "https://matrix.example.org/_matrix/client/v3/profile/%40alice%3Aexample.org/de.datanauten.job_title" \
  -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"de.datanauten.job_title": "Product Manager"}'
```

Synapse's OIDC/SAML mapping providers only set display name, avatar and e-mail (v1.162), and as far as we know MAS doesn't map claims to custom profile fields either, so such a sync job is the way. `e2e/stack.sh` prefills Carol's card this way.

## Requirements

- Element Web or Desktop with module API ≥ 2.0.0 (dialogs, room header buttons, account data). Checked against v1.12.33.
- A homeserver with extended profiles: spec v1.16 / MSC4133 (`uk.tcpip.msc4133.stable`), i.e. Synapse ≥ 1.135, no configuration needed. Without it the dialog says so and nothing else is shown.
- One file, ~53 kB (15 kB gzipped).

## Limitations

- **Privacy: statuses and card fields are public.** Profile fields are not encrypted and not limited to rooms. Anyone who can look up your profile sees them: everyone on your homeserver, and on federated servers anyone who knows your user ID, unless the admin sets `require_auth_for_profile_requests` and `limit_profile_requests_to_users_who_share_rooms` in Synapse. The dialogs say so. Don't put anything there you wouldn't put in your display name; a phone number in particular.
- **Not live.** Without MSC4429 (profile updates in `/sync`, which only Element's own code can request) the module polls: changes show up within 30 s in the DM header and user info, within 2 minutes in lists. Synapse rate-limits profile lookups (`rc_profile`, 1/s with a burst of 500 by default); the module queues its lookups and honours `429`.
- **Expiry needs a client.** "Clear after" and the out-of-office end are acted on by your Elements with the module (on start and by timer). Until one of them runs, other clients still show the old status; viewers with the module hide it.
- **"In a call" only for calls in this Element** (Element Call, group calls, video rooms; not legacy 1:1 calls or calls on your phone). If the tab is closed during a call, the next start of this Element clears `m.call`; an `m.call` older than 12 hours is cleared too.
- **Relies on Element internals:** `window.mxMatrixClientPeg` (profile fields, DMs, timeline events), Element's CallStore through the private `callStore` of `window.mxCallStatusListener` (calls), and Element's DOM for the user menu (`[role=menu]` with `[data-testid=userId]`), the user info panel (`.mx_UserInfo_profile`, `.mx_UserInfo_profile_mxid`), member tiles (`.mx_MemberTileView`, avatar `title`) and timeline senders (`.mx_EventTile[data-event-id] .mx_DisambiguatedProfile`). Checked against Element Web v1.12.33 (November 2026). If one of them changes, that spot stays empty or the feature turns off; Element itself keeps working. The DM header chip uses the public `addRoomHeaderButtonCallback`.
- **A status set elsewhere has no availability.** A status from another client (`🌴 On holiday`) is shown with its emoji; editing it in the module's dialog starts from *Available* with that text.
- **Moderation** (MSC4426): statuses are not shown in membership events, and a timeline dot disappears when the person left the room. A status in the user info panel stays visible to anyone who opens the profile.

## Development

```sh
pnpm install
pnpm test          # vitest + jsdom: data model, expiry, store/429, call watcher, auto-reply, DOM decoration, dialogs
pnpm build         # → lib/index.js
e2e/stack.sh up    # throwaway Synapse + Element v1.12.33 on 18482 / 5813; alice, bob, carol / <name>-pass, admin / admin-pass
PS_MSC4429=1 e2e/stack.sh up   # same, with Element's own MSC4426 code active (interop)
e2e/stack.sh down
```
