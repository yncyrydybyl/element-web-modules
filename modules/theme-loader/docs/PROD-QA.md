# Production QA — element.datanauten.de

Date: 2026-11-15 · Element 1.12.33 · prod loader `theme-loader/index.js?v=ec55ecc9e88a` · user `themes-mira`
(harness session slots 1–3 on prod; slots 2 and 3 were created for this run).

Production loads 15 other datanauten modules next to the theme-loader (remote-modules, speed-start, marcade,
keyboard-shortcuts, space-room-map, people-map, multi-tab, room-checker, teamwork, activity, tag-mentions,
profile-status, files-hub, teams-welcome, user-account-widgets) and 24 config `custom_themes`. The theme agents had
only tested on the dev server without them. This document records what was checked on prod, what broke, and
what was fixed.

**Status:** fixes were first checked against prod with the local build routed in, then **deployed**
(`theme-loader/index.js?v=758ed22c3dac`, sha1 314787e069f8 = `loader/dist`) and **re-verified on prod without any
routing** (all numbers below are post-deploy). One post-deploy regression was found and fixed in the repo
(lcars-picard header icons, see below) — **needs a second redeploy**.

## What was run

| run | per variant | output |
|---|---|---|
| `qa/harness/shoot.mjs --base-url https://element.datanauten.de --only 01,02,03,06,07,13,14,15,16,21` | main views, thread, room info, user menu, Appearance + Themes tabs, create-room modal, login | `recordings/prod-qa/<id>/shoot/` |
| `edgecheck` (copy of `qa/harness/edgecheck.mjs` that writes to `qa/reports/prod/`) | axe, focus, overflow, essentials, console | `qa/reports/prod/<id>.md/.json` |
| `.state/qa-scripts/prodqa.mjs` (module views) | speed-start snapshot, teams-welcome guide (+ step 2), room header with module buttons, Activity, Files, Saved messages, Tags, My apps, room checker, user menu + Set status (profile-status), keyboard shortcuts (`?`), space map (Ctrl+I), people map (Alt+P), composer `+` menu (teamwork), message action bar, Settings → Modules (+ scrolled), Themes, Preferences (multi-tab, maps) | `recordings/prod-qa/<id>/p*.png` + `manifest.json` |
| `.state/qa-scripts/verify.mjs` | the cross-cutting checks below | `recordings/prod-qa/_verify/` |
| same module views with the local build routed in | after-fix check (all 65, then deeper on representative variants) | `.state/qa-local-all/`, `.state/qa-local/` (git-ignored) |

The dev-server screenshots in `recordings/screens/` and `qa/reports/*.md` were not touched.

## Post-deploy re-verification (v=758ed22c3dac)

| check | result |
|---|---|
| module views (`prodqa`, 20 views) × 65 | all ran; loader applied in all 65; no `[theme-loader]` console errors. Only failures: paper-*-invisible Activity/Files/user menu via the hidden space bar (by design). Visual review of all 65 (contact sheets, header strip grid, overlay grid): win311 guide/overlays/strip, LCARS frames + compact header, Teams header (no Chat-tab overlap), E/crossover headers, kde-glass opaque overlays, sketch outlines, paper sheets, comic assistant — all as intended. |
| shoot × 65 | all shots ok except `07-room-info` in 28 themes (harness, see limitations; was 54 before) and `13-user-menu` in the 2 invisible variants (by design). **Login: 65/65 ok.** |
| edgecheck × 65 | 65 pass (7 report-only by design); lcars-usable needed one rerun (harness crash). |
| LCARS header palette button | **pass** — clickable in lcars-tng, lcars-picard, lcars-red-alert (also e-ember, x-kde-e16, teams-2026-dark, win311-default, sketch-unreadable). |
| Alt+Shift+T | **pass** in the same 8 themes (opens, ↓ previews, Esc reverts). |
| persistence / tabs / 24 custom themes / daylight / console | all **pass** again (account data restored to `{theme:null}`). |
| kde-breeze-daylight dusk→night | **pass** — forced phase change dusk→night, screenshots at 0.3/1/1.8/3 s: room names and code blocks readable throughout (`recordings/prod-qa/_verify/kde-daylight-fade-*.png`). |
| sketch-daylight night code | **pass** — full-chalk code, readable gutter (`_verify/sketch-daylight-night-code.png`). |
| paper-*-invisible affordance | **pass** — hairline + "›" tab visible on the left edge in both variants; hover/click reveals the navigation. |
| comic-poster room list | **pass** — all rooms (down to Showcase) fit at 1440×900. |
| **lcars-picard (regression)** | the compact header made the icons of its *outlined* pills dark-on-black (module button icons were already invisible before). Fixed in `themes/lcars/shared.css` (text-coloured icons for picard); verified with the local build; **needs redeploy #2**. |

Pre-deploy results are kept in `.state/prod-qa-predeploy/` and `.state/reports-prod-predeploy/` (git-ignored).

## Cross-cutting checks (task 3, first pass before the deploy)

| check | result |
|---|---|
| Theme choice persists across reload via account data | **pass** — picked Breeze Light in the Themes tab → account data `de.datanauten.theme_loader` = `{theme:"kde-breeze-light"}`; cleared the `tl.theme` localStorage cache, reloaded → applied from account data. Original value (`{theme:null}`) restored afterwards. |
| Alt+Shift+T with marcade header buttons present | **pass** in all tested themes (win311-default, lcars-tng, teams-2026-dark, sketch-unreadable): switcher opens, ↓ previews, Esc reverts, no write. Header palette button: **fixed** — in LCARS it was covered by the overflowing header pills (Video call intercepted the click); works after the fix. |
| Themes tab coexists with remote-modules' Modules tab | **pass** — one "Themes" and one "Modules" tab, Themes gallery 66 cards, Modules lists theme-loader as "Loaded", switching tabs back and forth keeps both working. |
| 24 config custom themes with loader = Element default | **pass** — `?tl_theme=none`, Element theme set to each `custom-<name>` (device level, restored): no `data-tl-theme`, 20 distinct text/background colour sets across the 24, screenshots of Dracula / Gruvbox Light / Nord dark look right. |
| Daylight variants switch with `?tl_phase` | **pass** — all 7 daylight variants: `data-tl-phase` = requested phase for day and night; base light→dark and canvas colour change (lcars-daylight is dark in both phases by design). |
| No console errors from `[theme-loader]` | **pass** — none in any run (65 module runs, 65 edgechecks, verify). Remaining prod console errors are Element/Synapse baseline (rust crypto store warning, `map_style_url` missing, 404s). |

## Module-compat findings and fixes

Most module UI uses Compound tokens, so colours follow the themes automatically (dark themes, KDE, Enlightenment,
Teams, Comic looked native without changes). The problems were geometry, overlays and a crowded room header.
All fixes are generic rules keyed on the modules' stable class prefixes, placed in each family's `shared.css` and
built from the family's own variables (no loader or module changes):

- module "windows": `.twl-guide-panel` (teams-welcome), `.speed-start-card`, `.ks-panel`, `.srm-panel`, `.pm-panel`, `.rc-panel` (+ their `*-backdrop`)
- module buttons/chips: `.twl-button`, `.drm-button`, `.ks-button`, `.rc-button`, `.pm-button`, `.fh-button`, `.act-chip`, `.fh-chip`, `.pm-chip`, `.rc-chip`, `.srm-tab`, `.rc-tab`
- header buttons: `.mcm-apps`, `.rc-badge`, `.tw-header-button`, `.act-header-button`, `.tm-header-button`, `.fh-header-button`, `.uaw-header-button`; space items `.act-space-item`, `.fh-space-item`

| family | finding on prod | fix |
|---|---|---|
| win311 (7) | teams-welcome guide, speed-start card and the full-screen overlays were modern rounded white cards outside the Win 3.1 look; module chips/buttons pills. **win311-leather**: chips, buttons and the guide had no visible edges (black on black), Activity/Home strip icons invisible. **Bug:** the minimized-group strip showed only 3 icons — Element caps the space tree at 250px, so the module items Activity/Files were cut off and Files sat under the avatar (unclickable). | Guide = Win 3.1 window (sizing border, active title bar, square close box), overlays framed the same way, module buttons/chips = bevel push buttons (selected = highlight colours), strip icons use `--w-btntext`, tree `max-width: none` (all of Home, Theme Lab, Activity, Files, Create a space visible). |
| lcars (7) | Guide/overlays plain cards. **Bug:** room header with ~8 module buttons overflowed: Element's labelled pills (VISUAL, COMM, THREADS, INFO) were drawn over neighbours, last buttons cut off, theme palette button unclickable. | Guide/overlays = LCARS dialog mini-frame + Antonio headings; header is a size container: < 1050px → icon pills (like the existing compact mode), < 560px → tighter pills. |
| teams (10) | **Bug:** the decorative "Chat" tab (`infoWrapper::after`, `flex:none`) was painted over the room-checker badge and Saved button once the room name shrank. | Header container: < 820px drop the Chat tab and face pile, tighten; Fluent radius/shadow for guide/overlays, Teams button radius. |
| enlightenment (8) | **Bug:** the drawn min/max/close glyphs (header `::after`) covered the last header buttons. | Glyphs dropped when the room view is narrow (`html.twl-docked` or ≤ 1100px), header tightened via container query. |
| crossover (3) | x-kde-e16: E16 gems over the last header buttons; x-teams-sketch: sketched tab strip crowded the header. | Same narrow-header rule (gems / tab strip hidden). x-win311-lcars fine. |
| kde (7) | **kde-glass:** room checker, shortcuts, maps and the guide were translucent (canvas token is `rgb(… / .62)`) — the timeline bled through the text. Others fine. | Glass sheets (0.9 opacity + blur 40px, like Glass dialogs); Breeze radii/dialog shadow for all KDE variants. |
| sketch (10) | Guide/overlays were the only clean rounded cards with soft shadows; last header button clipped in narrow room view. | Same rough.js drawn outline as dialogs; header tightened. |
| paper (7) | Guide/overlays glossy shadowed cards on flat paper; last header button clipped. | Flat paper sheets with hairline edge; header tightened. |
| comic (6) | comic-wordart/poster/unreadable: the paper-clip assistant (overlay root) sat on top of the docked guide. | Assistant moves left by the guide width while `html.twl-docked`. |

Other fixes requested by the coordinator (from the recordings agent), included in this redeploy:

- **kde-breeze-daylight**: dusk→night fade made room names vanish / code blocks flash light for ~2 s (only some containers transitioned colours). Colour crossfade removed; the Night Color layer still eases in.
- **sketch-daylight (night) / sketch-chalkboard**: plain code and line numbers faint → full chalk / 70 % chalk.
- **paper-white/black-invisible**: navigation (room list, user menu → settings) only reachable via an invisible 8px edge strip. Now a hairline on the left edge plus a small paper "›" tab mid-left; hover or click reveals the navigation (enhancer gained a click handler); Tab / Alt+Shift+P as before.
- **comic-poster**: room list taller than 900px → tighter sticker stacking (comic-unreadable keeps the pile on purpose).

## Matrix (65 variants)

Legend: *module compat* = `fixed` (a fix in this round changes this variant on prod), `pass` (fine as is),
`known` (see limitations). *main views* = shoot set except `07-room-info` (harness issue, see below).
¹ user menu hidden by design (L5 invisible). ² space bar hidden by design: Activity/Files not reachable from the
space bar (header buttons work).

| variant | family | stage | loader applied | main views | login | edgecheck | module views | module compat | [theme-loader] errors | note |
|---|---|---|---|---|---|---|---|---|---|---|
| comic-casual-friday | comic | level-1 | pass | pass | pass | pass | pass | pass | none |  |
| comic-geocities | comic | level-2 | pass | pass | pass | pass | pass | pass | none |  |
| comic-wordart | comic | level-3 | pass | pass | pass | pass | pass | fixed ✓ | none | paper-clip assistant sat on top of the docked guide |
| comic-poster | comic | level-4 | pass | pass | pass | pass | pass | fixed ✓ | none | paper-clip assistant sat on top of the docked guide |
| comic-unreadable | comic | level-5 | pass | pass | pass | report-only | pass | fixed ✓ | none | paper-clip assistant over the guide (report-only variant) |
| comic-after-midnight | comic | exciting | pass | pass | pass | pass | pass | pass | none |  |
| x-win311-lcars | crossover | crossover | pass | pass | pass | pass | pass | pass | none |  |
| x-teams-sketch | crossover | crossover | pass | pass | pass | pass | pass | fixed ✓ | none | sketched tab strip crowded the header |
| x-kde-e16 | crossover | crossover | pass | pass | pass | pass | pass | fixed ✓ | none | E16 gems covered last header buttons |
| e16-brushed-metal | enlightenment | past | pass | pass | pass | pass | pass | fixed ✓ | none | drawn min/max/close glyphs covered last header buttons |
| e17-glow | enlightenment | pure | pass | pass | pass | pass | pass | fixed ✓ | none | drawn min/max/close glyphs covered last header buttons |
| e-current | enlightenment | pure | pass | pass | pass | pass | pass | fixed ✓ | none | drawn min/max/close glyphs covered last header buttons |
| e-aurora | enlightenment | exciting | pass | pass | pass | pass | pass | fixed ✓ | none | drawn min/max/close glyphs covered last header buttons |
| e-ember | enlightenment | exciting | pass | pass | pass | pass | pass | fixed ✓ | none | drawn min/max/close glyphs covered last header buttons |
| e-neon-steel | enlightenment | exciting | pass | pass | pass | pass | pass | fixed ✓ | none | drawn min/max/close glyphs covered last header buttons |
| e-usable | enlightenment | usable | pass | pass | pass | pass | pass | fixed ✓ | none | drawn min/max/close glyphs covered last header buttons |
| e-daylight | enlightenment | pure | pass | pass | pass | pass | pass | fixed ✓ | none | drawn min/max/close glyphs covered last header buttons |
| kde-breeze-light | kde | pure | pass | pass | pass | pass | pass | pass | none | Breeze geometry for guide/overlays (polish) |
| kde-breeze-dark | kde | pure | pass | pass | pass | pass | pass | pass | none | Breeze geometry for guide/overlays (polish) |
| kde-breeze-daylight | kde | pure | pass | pass | pass | pass | pass | pass | none | Breeze geometry for guide/overlays (polish) |
| kde-oxygen | kde | past | pass | pass | pass | pass | pass | pass | none | Breeze geometry for guide/overlays (polish) |
| kde-ocean | kde | future | pass | pass | pass | pass | pass | pass | none | Breeze geometry for guide/overlays (polish) |
| kde-usable | kde | usable | pass | pass | pass | pass | pass | pass | none | Breeze geometry for guide/overlays (polish) |
| kde-glass | kde | exciting | pass | pass | pass | pass | pass | fixed ✓ | none | overlays (room checker, shortcuts, maps, guide) were translucent: text behind bled through |
| lcars-tng | lcars | pure | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays as LCARS mini-frames; header pills overflowed (labels over neighbours, header button unclickable) |
| lcars-voyager | lcars | past | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays as LCARS mini-frames; header pills overflowed (labels over neighbours, header button unclickable) |
| lcars-picard | lcars | future | pass | pass | pass | pass | pass | fixed (2nd deploy) | none | guide/overlays as LCARS mini-frames; header pills overflowed (labels over neighbours, header button unclickable); post-deploy regression: header icons invisible on its outlined pills → fixed, needs redeploy |
| lcars-usable | lcars | usable | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays as LCARS mini-frames; header pills overflowed (labels over neighbours, header button unclickable) |
| lcars-red-alert | lcars | exciting | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays as LCARS mini-frames; header pills overflowed (labels over neighbours, header button unclickable) |
| lcars-lower-decks | lcars | comic | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays as LCARS mini-frames; header pills overflowed (labels over neighbours, header button unclickable) |
| lcars-daylight | lcars | pure | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays as LCARS mini-frames; header pills overflowed (labels over neighbours, header button unclickable) |
| paper-white | paper | level-1 | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays flat paper sheets (were glossy shadowed cards) |
| paper-white-quiet | paper | level-3 | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays flat paper sheets (were glossy shadowed cards) |
| paper-white-invisible | paper | level-5 | pass | known¹ | pass | report-only | known² | known | none | space bar/user menu hidden by design: Activity/Files only via room header |
| paper-black | paper | level-1 | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays flat paper sheets (were glossy shadowed cards) |
| paper-black-quiet | paper | level-3 | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays flat paper sheets (were glossy shadowed cards) |
| paper-black-invisible | paper | level-5 | pass | known¹ | pass | report-only | known² | known | none | space bar/user menu hidden by design: Activity/Files only via room header |
| paper-daylight | paper | level-1 | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays flat paper sheets (were glossy shadowed cards) |
| sketch-designed | sketch | level-1 | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays get the drawn outline (were clean rounded cards) |
| sketch-wireframe | sketch | level-2 | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays get the drawn outline (were clean rounded cards) |
| sketch-notebook | sketch | level-3 | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays get the drawn outline (were clean rounded cards) |
| sketch-whiteboard | sketch | level-4 | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays get the drawn outline (were clean rounded cards) |
| sketch-chalkboard | sketch | level-4 | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays get the drawn outline (were clean rounded cards) |
| sketch-blueprint | sketch | level-5 | pass | pass | pass | report-only | pass | fixed ✓ | none | guide/overlays get the drawn outline (were clean rounded cards) |
| sketch-napkin | sketch | level-6 | pass | pass | pass | report-only | pass | fixed ✓ | none | guide/overlays get the drawn outline (were clean rounded cards) |
| sketch-scribble | sketch | level-7 | pass | pass | pass | report-only | pass | fixed ✓ | none | guide/overlays get the drawn outline (were clean rounded cards) |
| sketch-unreadable | sketch | level-8 | pass | pass | pass | report-only | pass | fixed ✓ | none | guide/overlays get the drawn outline (were clean rounded cards) |
| sketch-daylight | sketch | level-3 | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays get the drawn outline (were clean rounded cards) |
| teams-2026-light | teams | pure | pass | pass | pass | pass | pass | fixed ✓ | none | decorative "Chat" tab drawn over module header buttons; Fluent radius/shadow for guide/overlays |
| teams-2026-dark | teams | pure | pass | pass | pass | pass | pass | fixed ✓ | none | decorative "Chat" tab drawn over module header buttons; Fluent radius/shadow for guide/overlays |
| teams-2026-daylight | teams | pure | pass | pass | pass | pass | pass | fixed ✓ | none | decorative "Chat" tab drawn over module header buttons; Fluent radius/shadow for guide/overlays |
| teams-2024 | teams | past | pass | pass | pass | pass | pass | fixed ✓ | none | decorative "Chat" tab drawn over module header buttons; Fluent radius/shadow for guide/overlays |
| teams-classic-2020 | teams | past | pass | pass | pass | pass | pass | fixed ✓ | none | decorative "Chat" tab drawn over module header buttons; Fluent radius/shadow for guide/overlays |
| teams-2028 | teams | future | pass | pass | pass | pass | pass | fixed ✓ | none | decorative "Chat" tab drawn over module header buttons; Fluent radius/shadow for guide/overlays |
| teams-usable-light | teams | usable | pass | pass | pass | pass | pass | fixed ✓ | none | decorative "Chat" tab drawn over module header buttons; Fluent radius/shadow for guide/overlays |
| teams-usable-dark | teams | usable | pass | pass | pass | pass | pass | fixed ✓ | none | decorative "Chat" tab drawn over module header buttons; Fluent radius/shadow for guide/overlays |
| teams-comic | teams | comic | pass | pass | pass | pass | pass | fixed ✓ | none | decorative "Chat" tab drawn over module header buttons; Fluent radius/shadow for guide/overlays |
| teams-cyberpunk | teams | cyberpunk | pass | pass | pass | pass | pass | fixed ✓ | none | decorative "Chat" tab drawn over module header buttons; Fluent radius/shadow for guide/overlays |
| win311-default | win311 | pure | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays as Win 3.1 windows, bevel buttons; strip showed only 3 icons (Files hidden under avatar) |
| win311-usable | win311 | usable | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays as Win 3.1 windows (usable keeps its own strip layout) |
| win311-hotdog | win311 | exciting | pass | pass | pass | pass | pass | fixed ✓ | none | strip icons low contrast; see win311 |
| win311-leather | win311 | pure | pass | pass | pass | pass | pass | fixed ✓ | none | module chips/buttons/guide had no visible edges (black on black); strip icons invisible |
| win311-daylight | win311 | pure | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays as Win 3.1 windows, bevel buttons; strip showed only 3 icons (Files hidden under avatar) |
| win311-2030 | win311 | future | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays as Win 3.1 windows, bevel buttons; strip showed only 3 icons (Files hidden under avatar) |
| win311-cyberpunk | win311 | cyberpunk | pass | pass | pass | pass | pass | fixed ✓ | none | guide/overlays as Win 3.1 windows, bevel buttons; strip showed only 3 icons (Files hidden under avatar) |


## Remaining limitations

- **Crowded room header (all themes, incl. Element default):** with 8 module buttons and the teams-welcome guide
  docked (room view ≈ 450–520px at 1440px), Element truncates the room name to nothing. The fixes above only keep
  the themes' own decorations from making it worse (overlap / unclickable buttons). Closing the guide restores the
  room name. Not fixable in the themes.
- **Harness on prod:** `shoot.mjs` step `07-room-info` fails on prod in most themes because the first
  `[aria-label="Room info"]` is the room-name button, which has zero width in the crowded header (see above). Login
  shots occasionally time out under load (re-shot separately, all 65 pass). `prodqa` with the routed local build
  sometimes needs a retry (cold cache).
- **teams-welcome guide is shown on every load for themes-mira** (not dismissed, to avoid account-data writes), so
  every prod screenshot has it docked on the right.
- **marcade Apps** was not clicked (it would add the store widget to the fixture rooms); the button itself is
  themed and visible. **user-account-widgets / profile-status / tag-mentions** dialogs were only opened, never saved.
- **paper-*-invisible / sketch-unreadable / comic-unreadable / sketch-blueprint/napkin/scribble** are report-only by
  design; module UI there inherits the deliberate low contrast (the loader's own `.tl-ui` stays readable).
- **Pre-existing, not module-related** (same on dev): axe baseline on every theme (Element's `nested-interactive`
  space buttons, `scrollable-region-focusable` code blocks); a few contrast nodes in kde-glass (pill text),
  lcars-picard (code comments), paper-daylight (home subtitle), sketch-whiteboard (thread timestamp); in
  win311-leather the "Element default" card description in the Themes tab is grey on grey.
- **kde-breeze-daylight** phase change is now an instant colour switch (plus the eased Night Color layer) instead of
  a 2 s crossfade.

## How to reproduce / re-verify after deploy

```sh
export NODE_PATH=~/projects/matrix-search-widget/node_modules
node .state/qa-scripts/prodqa.mjs --theme <id>                 # module views → recordings/prod-qa/<id>/
node .state/qa-scripts/verify.mjs                              # persistence, switcher, tabs, custom themes, daylight
node .state/qa-scripts/edgecheck-prod.mjs --theme <id> --base-url https://element.datanauten.de
node qa/harness/shoot.mjs --theme <id> --base-url https://element.datanauten.de --out recordings/prod-qa/<id>/shoot --only 01,02,03,06,07,13,14,15,16,21
TL_LOCAL_DIST=$PWD/.state/qa-dist node .state/qa-scripts/prodqa.mjs --theme <id> --out .state/qa-local/<id>   # pre-deploy: local build on prod
```
(`.state/qa-scripts/batch-*.sh` run these for all 65 with 3 session slots.)
