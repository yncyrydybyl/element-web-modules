# Teams suite for Element Web

Six modules that make people coming from Microsoft Teams feel at home in Element Web and Element Desktop. Each one is a standalone module in [`modules/`](../modules) with its own README, tests and release; this page is how they fit together and how to roll them out.

| In Teams you… | Module | What it builds on |
| --- | --- | --- |
| schedule messages, mark them important or urgent, save messages, send praise | [teamwork](../modules/teamwork) | MSC4140 delayed events (stored encrypted), push rules, `m.mentions`, account data |
| check the Activity feed | [activity](../modules/activity) | Your loaded timelines plus the server's `/notifications`, decrypted locally |
| write `@team`, `@channel`, `@oncall` | [tag-mentions](../modules/tag-mentions) | Tags in room or space state, expanded into individual `m.mentions` |
| set a status, availability and out of office; look at someone's job title | [profile-status](../modules/profile-status) | MSC4426 status profile fields, MSC4133 extended profiles |
| open the Files tab | [files-hub](../modules/files-hub) | `/messages` with `contains_url`, local decryption of attachments |
| …don't know where anything is yet | [teams-welcome](../modules/teams-welcome) | Element's own recovery setup, account data, the organisation's spaces |

Everything they send is ordinary Matrix: other clients (Element X, FluffyChat …) show urgent messages, praise and tag mentions as readable text and notify mentioned people normally. Each module's README has a "With other clients" section.

## Rolling it out

### 1. Homeserver (Synapse)

```yaml
# teamwork "Send later": MSC4140 delayed events, up to 30 days ahead.
max_event_delay_duration: 30d
# profile-status: advertises MSC4429, so Element's own MSC4426 status display works too.
include_profile_updates_in_sync: true
# Profile fields (status, job title, phone) are public by default. Limit who can read them:
require_auth_for_profile_requests: true
limit_profile_requests_to_users_who_share_rooms: true
```

Without `max_event_delay_duration`, *Send later* says the server doesn't support it; everything else works.

### 2. Element Web

Mount each module's `index.js` at `/modules/<name>/` (ESS Community adds them to `config.json` by itself, see the [root README](../README.md#ess-community)), or list them under `"modules"`. Then add, all optional:

```json
{
  "features": { "feature_wysiwyg_composer": true },
  "de.datanauten.teamswelcome": {
    "organisation": "Contoso",
    "help_url": "https://intranet.contoso.example/it-help",
    "help_label": "Contoso IT service desk",
    "spaces": ["#contoso:example.org", "#engineering:example.org"]
  },
  "de.datanauten.tag_mentions": { "max_mentions": 50 },
  "de.datanauten.profile_status": { "editable_fields": ["phone"], "auto_reply": true },
  "de.datanauten.files_hub": { "max_age_days": 90, "cloud_link_cards": true }
}
```

`feature_wysiwyg_composer` turns on Element's rich text editor for everyone; Teams users expect formatting buttons. teamwork and tag-mentions, the two modules that read the composer, work with both composers (checked in the suite stack).

### 3. Around the modules

The modules cover chat habits. For the rest, see the "Making Teams users feel at home in Element" write-up:

- **Sign-in and keys:** single sign-on via Matrix Authentication Service; teams-welcome walks people through the recovery key.
- **Spaces per department**, synced from the directory with ESS Pro's Advanced Identity & Access Management.
- **Meetings:** Element Call in every room, Nordeck matrix-meetings for scheduling and breakout sessions. There is no Outlook integration.
- **Files:** a Collabora or OnlyOffice widget for co-editing. files-hub deliberately doesn't send decrypted files to an editor.
- **Search:** heavy users on Element Desktop, which can search encrypted rooms.

## How the modules work together

They share two small conventions on `window.deDatanautenTeamsSuite`, so each still works alone:

- **One message, several modules.** Element draws a message with the first module renderer that matches, so an urgent message with a tag and a SharePoint link would only get one module's extras. teamwork, tag-mentions and files-hub register through a shared chain (`src/suiteRender.ts`, the same file in each): teamwork draws the urgent or praise body, tag-mentions and files-hub add their line and cards around it. Editing stays possible unless a module draws the body.
- **Tags in teamwork's dialog.** tag-mentions registers `expand(roomId, content)`; teamwork calls it before sending or scheduling, so `@oncall` works in urgent and scheduled messages too. Urgent messages also mention their recipients, so they reach people in "mentions only" rooms in any client.
- **teams-welcome** detects which siblings are loaded and points its cheat sheet at them.

## Trying it

```sh
suite/e2e/stack.sh up     # Synapse 18485 + Element 5816 with all six modules, rich text editor on
suite/e2e/stack.sh down
```

Checked on 2026-11-10 against Element Web v1.12.33 and Synapse v1.162.0, all six loaded together: no errors in the console, all entry points present (space panel: Activity, Files; room header: Activity, Files, Tags, Saved; composer **+**: Mention a tag, Send later, Important or urgent, Praise; user menu: Set status, Edit profile card, Coming from Teams?). An urgent message sent from teamwork's dialog with `@oncall` and a SharePoint link arrived encrypted with the urgent badge, the tag line and the file card, mentioned only the tag's member, and showed up in the recipient's Activity feed.

## Limitations

- All six modules use some Element internals (the client object, DOM spots, the composer) where the module API has nothing. They are pinned to Element Web v1.12.33 and switch the affected part off when something is missing; check each README's Limitations before upgrading Element.
- The room header gets up to five extra buttons. On narrow windows Element hides the room name first.
- English and German only.
