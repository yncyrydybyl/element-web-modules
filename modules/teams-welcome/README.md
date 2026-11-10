# Teams welcome for Element Web

A first-run **"Coming from Teams?"** guide. People moving from Microsoft Teams rarely miss a feature in week one; they trip over things Teams never showed them: a recovery key, "Verify this device", "Unable to decrypt message", and not knowing where their Teams habits live. The guide opens by itself after the first login, next to Element rather than over it, and walks through four steps. Each step checks the real state live and ticks itself off.

| Step | What the user sees | Built on |
| --- | --- | --- |
| **1. Secure your messages** | The recovery key in plain words (spare key for your message history, keep it like a password, IT never asks for it), three live checks: *key storage is on*, *recovery key is set up*, *this device is verified*, and one button for whatever is missing. A green "All set" when all three are done. A short glossary for "Verify this device" and "Unable to decrypt message". | matrix-js-sdk's crypto API (`getActiveSessionBackupVersion`, `getSecretStorageStatus`, `getDeviceVerificationStatus`). The button opens **Element's own** flow in Settings → Encryption (recovery key setup, key storage, verification); the module doesn't touch keys itself. |
| **2. Where things are** | "In Teams you… / In Element you…": team → space, channel → room, chat → direct message, Activity, Files, meetings, @mentions, status, saved messages, schedule send, urgent, praise, replies, pin/mute, search. Rows that a sibling module of this suite answers better show that module's answer with an *Add-on* label, **only if it's loaded**. Below it, a keyboard card: Teams' shortcuts next to Element's (Ctrl+E → Ctrl+K, Ctrl+Shift+M → Ctrl+D …, ⌘/⌥ on macOS). | Static cheat sheet; sibling detection (below). The card doesn't duplicate the [keyboard-shortcuts](../keyboard-shortcuts) module: if it's loaded, the card says "press ?" for the full overlay; otherwise it links to Element's Keyboard settings. |
| **3. Profile and notifications** | Checks for a profile picture, a display name (not just the user ID) and desktop notifications, with buttons to Element's Account and Notifications settings. | `getProfileInfo`, Element's `notificationsEnabled` setting and the browser's notification permission. |
| **4. Join your team's spaces** | The spaces the admin configured, each with *Join* / *Open*, and *Join all*. Joining a space also joins its suggested rooms, like being added to a team puts you in its General channel. | `joinRoom`, `getRoomHierarchy` (suggested rooms only). |

The guide is remembered in the user's account data (`de.datanauten.teamswelcome`, `{ "dismissed": true, "dismissed_at": … }`): once closed, it doesn't open by itself again, on any device. It's always one click away in the **user menu** (avatar at the top left → *Coming from Teams?*) and as a page at **`#/teams-welcome`**, which the organisation can link from its help pages.

**"Unable to decrypt" hint.** If a message stays undecryptable for 8 seconds for a reason the user can fix, a small card at the bottom right explains it and offers the next step: *Verify this device*, *Set up recovery key*, or just the explanation when everything is already set up. *What does this mean?* opens step 1. It shows at most once per page load, never while the guide is open, and *Don't show again* stores `utd_hint_off: true` in the same account data. It costs nothing while idle: it listens to js-sdk's `Event.decrypted` and looks once at the timelines already loaded at login. Failures nobody can fix on this device (sent before you joined, or from an unverified sender) are ignored.

**Next to Element's own first-run UI.** A fresh account also gets Element's "Back up your chats → Create recovery key" and "Enable desktop notifications" toasts at the top left. The guide sits at the right, explains that the backup toast is the same thing as step 1, and the toast goes away by itself once the recovery key is set up. Element's dialogs (the recovery key setup, settings) open on top of the guide; the guide's checks update while they're open.

## Configuration

In Element's `config.json`, under `de.datanauten.teamswelcome`. Every key is optional; invalid values are ignored with a console warning.

```json
"de.datanauten.teamswelcome": {
    "organisation": "Contoso",
    "help_url": "https://intranet.contoso.example/it-help",
    "help_label": "Contoso IT service desk",
    "spaces": [
        { "alias": "#contoso:example.org", "name": "Contoso", "description": "Everyone at Contoso" },
        "#engineering:example.org"
    ],
    "steps": ["secure", "habits", "profile", "spaces"],
    "language": "de",
    "auto_open": true,
    "utd_hint": true,
    "join_suggested_rooms": true
}
```

| Key | Default | Meaning |
| --- | --- | --- |
| `organisation` | — | Shown in the title ("Welcome to Contoso on Element") and the spaces step. |
| `help_url`, `help_label` | — | Link in the guide's footer ("Questions? Contoso IT service desk"). `https:`, `http:`, `mailto:` or `tel:`. Without a label: "Contact your IT team". |
| `spaces` | `[]` | Spaces to offer in step 4: `"#alias:server"` (or a room ID), or `{ "alias", "name", "description" }`. The name is shown until the user has joined; then the space's own name. Without spaces, step 4 is left out. The spaces must be joinable by the user (public, or restricted to a room they're in). |
| `steps` | all four | Which steps to show, in this order: `secure`, `habits`, `profile`, `spaces`. |
| `language` | Element's | `en` or `de` forces the guide's language; otherwise it follows the language set in Element. |
| `auto_open` | `true` | Open the guide by itself after the first login (until dismissed). With `false` it's only in the user menu and at `#/teams-welcome`. |
| `utd_hint` | `true` | The "Unable to decrypt" hint. |
| `join_suggested_rooms` | `true` | Joining a space also joins its suggested rooms. |

## Sibling modules: how they find each other

This module is part of a suite that makes heavy Teams users feel at home (activity, tag-mentions, profile-status, files-hub, teamwork, teams-welcome). The convention is one rule with two ways to satisfy it. A module counts as **loaded** if either

1. it registered itself during `load()`:

   ```js
   (window.deDatanautenTeamsSuite ??= {})["files-hub"] = { version: "0.1.0" };
   ```

2. or its stylesheet is in the page: an element with the ID **`de-datanauten-<id>-style`**. The modules in this repo already inject their CSS that way (`de-datanauten-teamwork-style`, `de-datanauten-keyboard-shortcuts-style`), so existing modules are found without changes (activity, files-hub, profile-status, tag-mentions and teamwork all do).

IDs are the module directory names. Element runs all `load()`s in parallel, so ask lazily (when rendering), never during `load()`. This module registers itself as `teams-welcome`.

| Cheat sheet row | Changes when this module is loaded |
| --- | --- |
| Activity | `activity`, else `teamwork` |
| Files | `files-hub` |
| @mentions | `tag-mentions` |
| Status | `profile-status` |
| Saved, schedule send, urgent, praise | `teamwork` |
| Keyboard card | `keyboard-shortcuts` ("press ?" instead of a link to Element's list) |

## With other clients: Element X, FluffyChat

The guide exists only in Element Web/Desktop with this module. Element X and FluffyChat ignore the `de.datanauten.teamswelcome` account data, so it neither shows there nor breaks anything. A user who dismissed the guide in Element Web on one computer won't see it again in Element Web elsewhere, but other clients have their own onboarding (Element X asks for recovery setup itself). Everything the guide sets up is standard Matrix and works in every client: the recovery key and key storage (secret storage and server-side key backup), the verified device, the joined spaces and rooms, the profile picture and display name.

## Requirements

- Element Web or Desktop with module API ≥ 2.0.0. Tested against Element Web v1.12.33 (module API 2.3.0), November 2026.
- One file, ~65 kB (18 kB gzipped), most of it the English and German texts.

## Limitations

- **Relies on Element internals**, because module API 2.3.0 has no way to read the crypto state, join rooms or open settings: `window.mxMatrixClientPeg` (the js-sdk client), `window.mxDispatcher` (`view_user_settings` with `initialTabId` and, for the recovery key setup, `props.initialEncryptionState: "set_recovery_key"`), and the user menu's DOM (`.mx_UserMenu`'s trigger, its `[role=menu]`, `button[role=menuitem]`) for the menu entry. Checked against Element Web v1.12.33. If the dispatcher goes away, the buttons are hidden and the checks still show; if the menu changes, the entry is missing and `#/teams-welcome` still works.
- **The start after login is polled** (every 2 s, gated on `isInitialSyncComplete`), because `waitForClientStarted` only exists from module API 2.4; the module uses it when it's there.
- **Notifications are checked, not switched on**: the button opens Element's Notifications settings (or the user accepts Element's own toast). Desktop notifications are a per-device setting, so the tick can be missing on a second computer.
- **The checks follow Element's ideal**: key storage on, recovery key set, device verified. An organisation that deliberately turns key storage off will never see the green tick.
- **The cheat sheet's add-on texts are written against the siblings' READMEs** (November 2026); when a sibling's UI changes, its row here needs the same change.
- **German and English only**; other Element languages get the English text.
- The page at `#/teams-welcome` replaces Element's room list while it's shown (that's how Element renders module pages).

## Development

```sh
pnpm install
pnpm test          # vitest + jsdom: config, checks, sibling detection, user menu, "Unable to decrypt", the guide
pnpm build         # → lib/index.js
e2e/stack.sh up    # throwaway Synapse + Element v1.12.33 with an example config and the spaces #contoso and
                   # #engineering on welcome.test; alice, bob, carol / <name>-pass
e2e/stack.sh down
```

A fresh account is the realistic test, because the guide opens until it's dismissed: register one with `podman exec twl-e2e-synapse register_new_matrix_user -c /data/homeserver.yaml -u <name> -p <password> --no-admin http://localhost:8008`.
