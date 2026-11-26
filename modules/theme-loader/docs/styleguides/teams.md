# Style guide — Microsoft Teams (`teams`, 10 variants)

Data twin: `docs/styleguides/teams.json` (palettes, per-variant region map). Manifest: `themes/teams/themes.json`.
Assets and licences: `themes/teams/README.md`. Phase A, 2026-11-15.

## 1. Concept

Element dressed as Microsoft Teams. The core is a faithful translation of **Teams as it actually ships in
November 2026** (light, dark, daylight). Around it:

- **past**: classic Teams 2020 and "new Teams" 2.0 (2024)
- **future**: a speculative 2028 Copilot-glass Teams
- **usable**: Teams look that keeps Element's affordances
- **hype**: a comic strip and a Night City cyberpunk take

```
seriousness 10 ┤ usable-L/D · 2026-L/D · 2024        ← pure / usable
             8 ┤ classic-2020   2026-daylight
             7 ┤                       2028           ← future
             3 ┤                          comic   cyberpunk   ← exciting
               └──────────────────────────────────────── hype →
                 2        3      4        7       8      10
time axis:  classic-2020 (2020) → 2024 → 2026 (now) → 2028
```

## 2. Key research finding: the 2026 brand colour (catalogue/dossier correction)

The dossier guessed that late-2026 Teams uses `brandTeamsV21` 80 = **#654CF5**. What I checked:

| Evidence | Result |
|---|---|
| `@fluentui/tokens` 1.0.0-alpha.24 and nightly 2026-11-13 (`lib/global/brandColors.js`) | `brandTeamsV21` exists, ramp exactly as in the dossier (10 `#29274f` … 80 `#654cf5` … 160 `#e8e8ff`). Themes `teamsLightV21Theme`/`teamsDarkV21Theme` = `createLightTheme(brandTeamsV21)`, so they share neutrals with the classic Fluent 2 Teams theme |
| Origin | fluentui PR #34900 "Add new brand ramp version" ("v3 variant of Teams Light and Dark themes"), merged **2025-07-29** |
| Accent colours MC1115312 (same period) | **Cancelled 2025-10-27** ("We are not releasing this feature at this time") |
| Pixel sampling of Microsoft's own product screenshots: Tech Community "What's New" May 2026 (Build) and June 2026 (InfoComm), 50 images | Buttons, tab underlines, toggles and selected states are **#5B5FC7** (brandTeams 80) everywhere. Dark UI shows #7F85F5 (brandTeams 100). No #654CF5 anywhere in the shipped chrome |
| 2025 Teams logo (Commons SVG) | Gradient stops #6459FE, #5F50E2, #3C2CB8, #8C75FF … i.e. the V21 violet family |

**Decision:**

- **teams-2026-\*** use the verified **#5B5FC7 brandTeams ramp** and the new 2025 gradient logo. 2026 is told apart from 2024 by features, not by colour: chat sections, purple activity indicators, 8 px bubbles, Copilot chips, logo.
- The staged-but-unshipped **V21 ramp (#654CF5)** moves to **teams-2028**. That is exactly what "the future" looks like from here: a colour that already sits in Microsoft's token package and logo but not yet in the UI.

The catalogue line "new brand ramp" for teams-2026-light is reworded accordingly. Ids and count are unchanged.

Other 2026 facts used: purple activity indicators in the chat list (Aug–Sep 2026), automatic Muted and Meetings chat sections, the chat-centred Copilot (MC1458472, Oct 2026), and the centered meeting toolbar with a red Leave button (July–Aug 2026). The title bar `#EBEBEB` and Leave red ≈ `#D13438` are sampled from the June 2026 meeting screenshot.

Dark neutrals (`#141414`, `#1f1f1f`, `#242424`, `#292929`) come from Fluent `teamsDarkColor`. Which neutral sits on which region (rail vs list vs canvas) is **[M]**: verify against a live Teams dark screenshot in phase B.

## 3. Shared Teams language (all non-hype variants)

- **Type:** `"Segoe UI Variable Text", "Segoe UI", Selawik, system-ui, sans-serif`.
  - Segoe comes only via `local()`. Selawik (OFL, metric-compatible) is bundled at 300/350/400/600/700.
  - Body 14/20. Names and titles Semibold 600. Chat title 20/28, room name 18, captions 12/16.
  - Headers in 2026/2028 use `"Segoe UI Variable Display"` where it exists locally.
  - Mono: Cascadia Mono (bundled, subset Latin/Greek/Cyrillic/box drawing), then Consolas.
- **Grid:** 4 px. Radii: 4 for controls, 8 for cards/bubbles/dialogs (2024: 4 everywhere; classic: 3; 2028: 12/16/pill).
- **Elevation:** Fluent `0 0 2px ambient, 0 Npx 2Npx key`. Light ambient/key .12/.14, dark .24/.28. shadow4 cards, shadow8 hover bars, shadow16 menus, shadow64 dialogs.
- **Motion:** 100/150/200/250 ms, `cubic-bezier(.33,0,.67,1)`. No idle animation. `prefers-reduced-motion` turns everything off.
- **Icons:** Fluent UI System Icons (MIT), 20 px regular in rail/header/composer and **filled + brand when active**. Painted with `mask-image` + `background-color: currentColor` on Element's buttons. 346 files are in `assets/fluent-*` (20 and 24, regular and filled).
- **Rail item anatomy:** 68 px wide, 20 px icon over a 10 px label. The label is `content: attr(aria-label)` on `.mx_SpaceButton` (spaces have aria-labels). Selected = 3 px rounded brand pill on the left edge plus filled brand icon.
- **Fluent input signature:** 1 px stroke, darker 1 px bottom, **2 px brand bottom on focus** (composer, inputs, search).
- **Focus:** Fluent double ring. Light: 2 px `#000` outside + 1 px `#fff` inside. Dark: inverted. Never removed.

## 4. Variants

| id | stage | brand | canvas / list / rail | own / other | notes |
|---|---|---|---|---|---|
| teams-2026-light | pure | #5B5FC7 | #fff / #f5f5f5 / #ebebeb | #e8ebfa / #f5f5f5 | 2025 logo, chat sections, purple activity dot, Copilot chip, radius 8 |
| teams-2026-dark | pure | #4F52B2 fill, #7F85F5 text | #242424 / #1f1f1f / #141414 | #2f2f4a / #292929 | links brand100, focus inverted |
| teams-2026-daylight | pure | #5B5FC7 | dawn #fcfcff/#f3f3f9/#e9e9f3 · day = light · dusk #fffbf5/#f8f1e7/#efe6da · night = dark | per phase | schedule 06/09/18/21, 2 s fade |
| teams-2024 | past | #5B5FC7 | #fff / #f5f5f5 / #ebebeb + 2 % lavender Mica wash | #e8ebfa / #f5f5f5 | 2019 logo, radius 4, shadow2, flat list, no Copilot |
| teams-classic-2020 | past | #6264A7 | #f3f2f1 / #f3f2f1 / #33344a, top bar #464775 | #e5e5f1 / #fff cards | dense, radius 3, red unread pills |
| teams-2028 | future | **#654CF5 (V21)** | glass panes (white 45–72 %) on aurora #a1d3ff→#bd96ff→#e3acfd | #e8e8ff / white 85 % | radius 16, Copilot pane, AI chips |
| teams-usable-light | usable | #5B5FC7 | as 2026 light | as 2026 | muted #424242, strokes #d1d1d1, 40 px targets |
| teams-usable-dark | usable | #5B5FC7 fill, #9299F7 links | as 2026 dark | #2f2f4a / #2e2e2e | muted #d6d6d6, strokes #666 |
| teams-comic | comic | #5B5FC7 + #FFE14D + #E8222E | #fff8e7 halftone / #fdefc3 / purple masthead | #d9dbff / #fff | Comic Sans→Comic Neue, Bangers, ink 3 px, hard shadows |
| teams-cyberpunk | cyberpunk | #A66BFF + #00F0FF + #FF2E97 + #FCEE0A | #0b0614 / #0f0a1c / #07040d | #241447 / #140c24 | Orbitron, Share Tech Mono, chamfers, scanlines |

### 4.1 teams-2026-light (pure)

Teams on a Windows 11 desktop, November 2026.

- **Title bar** (enhancer, 48 px, `#EBEBEB`): back/forward chevrons, a centered "Search" pill that opens Element's search dialog, `···`, and the 2025 gradient logo.
- **Rail:** Home becomes "Chat" with the chat icon. Spaces keep their avatars, rounded-square 32 px with labels below.
- **Chat list:**
  - Heading "Chat" Semibold 20, with a filter icon and a compose icon. The compose icon is Element's "Start chat" button re-iconed.
  - Element's primary filters become Fluent pill chips ("Unread", "People", …). Element 1.12.33 has no sections, so filters stand in for Teams' Quick views.
  - Selected row: white, radius 4. Rooms with unread activity get the **2026 purple left dot**.
- **Header:**
  - Avatar plus name Semibold 18.
  - The thread/info/pins/files buttons turn into a tab strip, and the open right-panel card gets the active 2 px underline.
  - The Copilot chip is the sparkle icon with a gradient stroke and opens the room summary.
  - Video call is a split button.
- **Timeline:**
  - Bubbles radius 8, others `#F5F5F5`, own `#E8EBFA`. In bubble layout own messages go right.
  - Name and time sit above the first bubble of a group.
  - Element's action bar becomes the floating Teams reaction bar (white, radius 4, shadow8, emoji first).
  - Reactions are pills with a 1 px stroke, own reaction brand-tinted.
- **Composer:** white rounded box on the canvas with a 2 px brand bottom border when focused. Icons right; send is the brand paper plane.

### 4.2 teams-2026-dark (pure)

Fluent `teamsDarkColor`. Rail `#141414`, list `#1F1F1F`, canvas `#242424`, cards `#292929`. Brand fills use brand70 `#4F52B2` and text accents brand100 `#7F85F5`. Own bubbles are brand20 `#2F2F4A`. hljs is VS Code Dark+.

### 4.3 teams-2026-daylight (pure)

The 2026 light rules apply until 21:00, then 2026 dark.

- **Dawn** (06–09): neutrals get a 1–2 % lavender cast.
- **Dusk** (18–21): a "night light" shift of the neutrals only (`#FFFBF5` canvas, `#F8F1E7` list, `#EFE6DA` rail, warmer text `#2A2522`). Brand and status colours are untouched.
- **Night** (21–06): 2026 dark.
- The title-bar logo carries a tiny sun or moon glyph via `onPhase()`.
- The CSS reuses `teams-2026-light.css` and `teams-2026-dark.css`, scoped by `data-tl-phase`.

### 4.4 teams-2024 (past)

"New Teams" at launch.

- Same Fluent 2 neutrals as 2026, but **radius 4 everywhere**, bubbles with shadow2, and a flat chat list with no sections or activity dots.
- Rail labels are always visible. Title bar and rail have a static 2 % lavender wash (the Mica impression, no blur).
- 2019 logo (`#5059C9`/`#7B83EB` tile). No Copilot, no gradients.

### 4.5 teams-classic-2020 (past)

Lockdown-era Teams.

- **Top bar:** full width, `#464775`, with a white centered search box (enhancer).
- **Rail:** `#33344A` with white icons and labels, `#6264A7` pill.
- **Canvas:** `#F3F2F1` with **white message cards** (radius 3, `0 1px 2px rgba(0,0,0,.1)`). Own cards `#E5E5F1`.
- **Density:** compact, 13–14 px.
- **Inputs:** filled `#F3F2F1` (Northstar style) with a purple 2 px bottom.
- Unread counts in red `#C4314B`.

### 4.6 teams-2028 (future)

Takes Fluent's "light, layered" direction to its conclusion.

- **Layout:** the shell becomes an aurora wallpaper (the 2025 logo gradient stops), and rail, list, conversation and right panel float as separate glass panes (gap 12, radius 16, `backdrop-filter: blur(30px) saturate(1.4)`, shadow28, 1 px inner white highlight).
- **Brand:** V21 `#654CF5` (onAccent white 5.4:1).
- **Copilot:** the right panel turns into the "Copilot" pane, with a gradient header strip in the Copilot gradient (blue `#2870EA` → teal `#1BC5A9` → violet `#8A3FFC` → pink `#E24AA4`; values [M], decorative only).
- **Composer:** a floating pill. The enhancer adds AI suggestion chips with an iridescent border above it.
- **Performance:** blur goes only on the four panes, dialogs and menus, never on timeline tiles.

### 4.7 teams-usable-light / teams-usable-dark (usable)

Teams surfaces and colours, Element behaviour:

- Element's layout choice (group/IRC/bubble) is respected.
- Threads summaries, read receipts, E2EE padlocks and identity warnings stay visible.
- Per-user colour is kept as a 3 px avatar ring for disambiguation.
- Icon buttons are 40 × 40, and the action bar also shows on keyboard focus.
- Mentions show an "@" glyph, not colour alone.

Contrast:

- Light: muted `#424242` (10:1 on white), strokes `#D1D1D1`, critical `#B10E1C`.
- Dark: muted `#D6D6D6`, links `#9299F7`, strokes `#666666`.
- No enhancer, so nothing can break.

### 4.8 teams-comic (comic)

The Monday stand-up as a comic page.

- **Page:** yellow `#FFE14D` gutters. Every region is a panel with a 3 px `#111` ink border and a hard `4px 4px 0` shadow.
- **Canvas:** cream `#FFF8E7` with an 8 px halftone dot grid (8 % ink, a single background on the canvas, not per tile).
- **Messages:** speech bubbles with CSS tails pointing at the avatar, and a wobbly border-radius (`255px 15px 225px 15px / 15px 225px 15px 255px`).
- **Lettering:** Bangers for room names, sender captions and dialog titles. Comic Sans MS (local) or Comic Neue for body text.
- **Masthead:** the Teams purple rail.
- **Badges:** red starbursts. A new mention fires a "PING!" burst (enhancer).
- **Auth:** a "TEAMS COMICS #1" cover.
- **Motion:** bubble pop-in on new events only. Everything is off under reduced motion.

### 4.9 teams-cyberpunk (cyberpunk)

Teams wired into Night City.

- **Background:** `#0B0614` with a faint 40 px violet grid. One fixed scanline overlay (6 %, `pointer-events: none`).
- **Shapes:** chamfered panels (`clip-path` 10 px cuts) with 1 px neon borders. Own cards `#241447` with a violet edge, others `#140C24` with a cyan hairline.
- **Colour:** neon `#A66BFF` violet with dark text on fills. `#00F0FF` cyan for focus and unread, `#FF2E97` pink for counts, `#FCEE0A` yellow for mentions and warnings.
- **Type:** Orbitron uppercase (letter-spacing .12em) for headers. Share Tech Mono for timestamps, metadata and code. Body stays Selawik for readability.
- **Composer:** terminal style with a `>` glyph and a block caret.
- **Motion:** glitch (RGB split) only on the room title, on hover. Logo flicker on mount. All motion is behind reduced motion.

## 5. Region map

The per-variant phrase for all 21 regions is in `teams.json → variants[].regions`. The baseline (2026 light) is below. The other variants override only where noted in §4 and in the JSON.

| region | Element anchor | 2026 treatment |
|---|---|---|
| shell | `#matrixchat`, `.mx_MatrixChat` + enhancer title bar | 48 px `#EBEBEB` title strip, white content |
| spaces | `.mx_SpacePanel`, `.mx_SpaceButton`, `.mx_QuickSettingsButton` | 68 px app bar, icon + `attr(aria-label)` label, 3 px left pill, filled brand icon |
| roomlist | `.mx_RoomListPanel`, `.mx_RoomListItemView(_selected)`, `[class*="_roomListItem_"]`, filters `[class*="RoomListPrimaryFilters"]` | Chat list, pill filters, white selected row, purple activity dot |
| header | `.mx_RoomHeader`, `_heading`, header buttons | 64 px, Semibold 18, buttons → tab strip with 2 px underline, Copilot chip |
| timeline | `.mx_EventTile`, `[class*="_stateOwnEvent_"]`, `[class*="_stateContinuation_"]`, `.mx_EventTile_line`, `.mx_MessageActionBar`, `.mx_ReactionsRow` | bubbles r8, own `#E8EBFA` right (bubble layout), floating reaction bar |
| names-avatars | `.mx_DisambiguatedProfile_displayName`, `.mx_Username_colorN`, `[class*="_avatar_"]` | names in text colour Semibold, circular avatars, decorative bg only |
| composer | `.mx_MessageComposer`, `.mx_BasicMessageComposer_input`, `_sendMessage` | rounded box, 2 px brand bottom on focus, brand send |
| rightpanel | `.mx_RightPanel`, `.mx_BaseCard`, `.mx_MemberListView`, `.mx_ThreadPanel` | Fluent side pane, 1 px left stroke |
| buttons | `.mx_AccessibleButton_kind_*`, Compound `[class*="_button_"]` | brand fill r4 Semibold 32 px; outline secondary; subtle |
| inputs | `.mx_Field`, Compound inputs | Fluent input, 2 px brand bottom on focus |
| dialogs | `.mx_Dialog`, `.mx_CompoundDialog`, `[role="dialog"]` | r8, shadow64, Semibold 20 title |
| menus | `.mx_ContextualMenu`, `[role="menu"]`, `[role="tooltip"]` | r8 shadow16 flyouts, dark tooltips |
| settings | `.mx_UserSettingsDialog`, `.mx_TabbedView_tabLabel(_active)` | left nav with brand pill, content ≤ 640 px |
| auth | `.mx_AuthPage`, `.mx_AuthPage_modal` | white card on soft lavender gradient, logo |
| scrollbars | `*::-webkit-scrollbar`, `scrollbar-color` | 6 px overlay thumb |
| focus | `:focus-visible` | Fluent double ring |
| badges | `[class*="_notificationBadge_"]`, `[class*="cpd-theme-"]` islands | brand count, red mention, purple activity dot |
| code | `pre, code, .mx_EventTile_pre_container, .hljs-*` | Cascadia Mono 13, `#F5F5F5` block, VS Code Light+ |
| iframes | `.mx_AppTile`, `.mx_CallView` (frame only) | base light/dark only, frame r8 |
| icons | header, composer, rail buttons | Fluent regular 20 via mask, filled + brand when active |
| motion | global | Fluent 100–250 ms, reduced motion = none |

## 6. Signature moves (the "instantly Teams" checklist)

1. A 3 px brand pill on the left edge plus a filled brand icon for the selected rail item, with labels under the icons.
2. Own messages tinted brand160 (`#E8EBFA`), others on grey. Names are never rainbow.
3. A 2 px brand underline on the focused composer and input and on the active header tab.
4. The floating reaction bar (white card, shadow8) on hover.
5. Semibold Segoe-style names and titles, purple primary buttons with radius 4. In 2026, also the purple activity dot and the Copilot sparkle chip.

## 7. Iconography

- Fluent UI System Icons, MIT, `@fluentui/svg-icons` 1.1.346. 346 SVGs live in `themes/teams/assets/fluent-<name>_<20|24>_<regular|filled>.svg`.
- They are mapped onto ~30 high-visibility Element buttons:
  - rail: home → `chat`, quick settings → `settings`
  - header: `video`, `call`, `chat_multiple` (threads), `info`, `pin`, `people`
  - composer: `emoji`, `attach`, `add_circle`, `send`, `text_edit_style`, `mic`
  - action bar: `emoji_add`, `arrow_reply`, `chat_multiple`, `more_horizontal`, `edit`
  - room list: `compose`, `filter`, `more_horizontal`
- Technique: hide the inline `svg` and paint `::before { mask: url(assets/fluent-…svg); background: currentColor }`. Hooks are `aria-label`/`mx_` classes. aria-labels are locale-dependent, so the guide targets en and de and falls back to Element's icon.
- Everything else keeps Compound icons, recoloured by `--cpd-color-icon-*`.
- Logos: 2025 gradient logo (2026, 2028, comic, cyberpunk with a neon filter) and 2019 logo (2024, classic).

## 8. Accessibility stance

- No variant is unreadable by design. Every palette passes WCAG AA:
  - text/bg ≥ 13.9:1
  - muted/bg ≥ 5.7:1
  - onAccent/accent ≥ 5.4:1
- The usable variants raise muted to ≥ 10:1.
- Focus is always visible (Fluent double ring; comic yellow plus ink; cyberpunk cyan).
- `prefers-reduced-motion`: no pop-ins, glitch, flicker, caret blink or phase fades.
- High contrast (`cpd-theme-*-hc` / `prefers-contrast: more`): all teams variants raise strokes to the text colour and drop glass and halftone.
- Comic and cyberpunk keep Selawik or Comic Neue at ≥ 14 px for body text. Display fonts are only for headings and badges.

## 9. What cannot be themed, and the workaround

See `teams.json → limits`. The main ones:

| Limit | Workaround |
|---|---|
| Call/widget iframes are only light/dark | Frame-only styling |
| No real app bar | Spaces dressed as app-bar items |
| No header tabs | Buttons restyled as tabs |
| Icon swap | Needs aria-label hooks |
| Fluent Emoji is impossible | `--emoji-font-family: "Segoe UI Emoji"` via local where available, else Twemoji |
| Presence only where Element renders it | — |
| Own-right alignment | Bubble layout only |

## 10. Enhancer (`themes/teams/enhance.ts`)

Phase B moved almost everything the plan gave to the enhancer into CSS. That is more robust and it can't break React:

| feature | how it is done now |
|---|---|
| Title bar | CSS: `.mx_MatrixChat` padding-top plus `::before` (logo) and `::after` (title). The room-list search pill and the user menu are lifted into the title bar with `position: fixed`; this needed `.mx_LeftPanel { contain: none }` |
| Sun/moon glyph | CSS: `--tm-title-text` per `data-tl-phase` |
| Copilot chip | CSS `::after` on `.mx_RoomHeader` (decorative, hidden while the right panel is open) |
| PING! bursts | CSS `::after` on highlighted tiles (comic) |
| Scanlines / grid | CSS `body::after`, one fixed overlay (cyberpunk), off under reduced motion |
| Aurora wallpaper | CSS background (2028) |
| **AI suggestion chips** | **enhancer, teams-2028 only:** overlay in `ctx.root` that follows the composer; a click inserts a canned prompt via `execCommand('insertText')` and nothing is sent; hidden while dialogs or menus are open and below 769 px |

## 11. Phase B notes

- Verify the dark neutral allocation and the 2026 chat-list section look against a live Teams 2026 screenshot or the Fluent 2 Teams UI Kit.
- Check the `aria-label` values of SpacePanel/header buttons on v1.12.33 (`git show v1.12.33:…`) before relying on them for icon masks and rail labels.
- The 2028 palette uses 8-digit hex (alpha) for glass surfaces. The manifest tokens use opaque fallbacks.
- `teams-2026-daylight.css` should only add the dawn/dusk neutrals and import the light/dark variant rules under `[data-tl-phase]`.

## 12. Implementation notes (phase B)

- **Shared structure:** `shared.css` holds the whole Teams structure, driven by `--tm-*` variables. Each variant file only sets variables and adds overrides.
- **Shared CSS between variants:**
  - teams-2026-daylight loads the light and dark files; their selectors include `teams-2026-daylight` with or without `[data-tl-phase="night"]`.
  - teams-usable-dark loads `teams-2026-dark.css` and `teams-usable-light.css`; the usable rules are scoped with `:is([data-tl-theme="teams-usable-light"], [data-tl-theme="teams-usable-dark"])`.
- **Bubbles:** messages in the group layout become Teams bubbles: the `.mx_EventTile_line` gets a margin instead of a padding gutter and `width: fit-content`.
- **Own messages:** right-aligned without avatar/name in all non-usable variants. The usable variants keep Element's layout and coloured names.
- **Pitfall 1, the effects canvas:** it is window-sized; with the 48 px title bar it overflowed the room view, and `scrollIntoView()` shifted the whole app. Fixed with `max-height: 100%` plus `overflow: clip` on the shell. `clip`, not `hidden`, because overflow:hidden boxes can still be scrolled programmatically.
- **Pitfall 2, `position: fixed`:** `backdrop-filter` and `clip-path` on an ancestor break `position: fixed` children and clip the message action bar and autocomplete. So:
  - 2028 blurs only the conversation and right panes.
  - cyberpunk paints its chamfers on bubbles and composer with gradients instead of clip-path.

## 13. Sources

All URLs are in `teams.json → sources`. Primary:

- `@fluentui/tokens` (MIT), checked 1.0.0-alpha.24 + nightly 2026-11-13
- fluentui PR #34900
- Northstar 0.47 colours
- Microsoft Tech Community "What's New in Teams" May/June 2026 (screenshots, pixel-sampled)
- support.microsoft.com "What's new in Teams" (Aug–Sep 2026)
- MC1115312 (cancelled accent colours), MC1458472 (Copilot)
- microsoft.design "Designing the new era of Teams"

Licences of shipped files are in `themes/teams/README.md`.
