# teams — Microsoft Teams theme family

10 variants, see `themes.json` and `docs/styleguides/teams.md`. Status: **all 10 implemented** (phase B, 2026-11-15).

Files:
- `shared.css`: the Teams structure (title bar, app bar, chat list, header with the "Chat" tab, bubbles, composer, controls), all driven by `--tm-*` variables
- `<variant>.css`: variables and overrides per variant
- `enhance.ts`: teams-2028 Copilot chips only
- `tools/gen_teams.py`: generates `themes.json` and `docs/styleguides/teams.json`; edit it, don't hand-edit those two files
- `tools/dom-dump.mjs`: DOM/selector inspector; uses the harness session pool and never logs in itself
- `tools/sheet.py`: contact sheets for screenshot review

## What is implemented per variant

| variant | status | notes |
|---|---|---|
| teams-2026-light | done | 2025 logo, title bar with centred search, app bar with labels and brand pill, sections, purple activity dot, bubbles (own right, `#E8EBFA`), Fluent icons in header/composer, Copilot chip |
| teams-2026-dark | done | Fluent teamsDark neutrals, brand70 fills, brand100 accents |
| teams-2026-daylight | done | dawn (lavender), day, dusk (amber neutrals), night (= 2026 dark); title glyph per phase; 2 s fade |
| teams-2024 | done | 2019 logo, 4 px radii, white bubbles with shadow2 on a `#F5F5F5` timeline, Mica-like wash, no Copilot |
| teams-classic-2020 | done | `#464775` title bar, `#33344A` rail, `#6264A7`, white cards on `#F3F2F1`, red counters, "Chat Files +" tabs |
| teams-2028 | done | V21 `#654CF5`, aurora wallpaper, floating glass panes, pill controls, Copilot pane strip, AI chips (enhancer) |
| teams-usable-light | done | Teams look but Element layouts kept (own messages not moved), coloured names, 15 px body, 40 px targets, real composer focus ring, "@" on mentions |
| teams-usable-dark | done | same on the 2026 dark base, links `#9299F7` |
| teams-comic | done | yellow gutters, ink panels, halftone, speech bubbles with tails, Bangers, starburst badges, CSS "PING!" on mentions, SEND! burst, comic cover login |
| teams-cyberpunk | done | Orbitron/Share Tech Mono HUD, neon violet/cyan/pink, gradient chamfers, hex avatars, scanlines, glitch on the room title, terminal composer, neon-horizon login |

## Edge-case results (edgecheck.mjs, shoot.mjs; 1440×900 + 390×844)

| check | result |
|---|---|
| edgecheck (all 10 + daylight dusk/night) | **pass**: contrast 0, overflow 0, clipped 0, missing essentials 0, focus 0–1 (see below) |
| remaining axe findings | Element's own `nested-interactive` (space buttons) and `scrollable-region-focusable` (code blocks), the same with every theme |
| composer focus (pure variants) | shown as Fluent's 2 px brand underline on the composer box; edgecheck doesn't see this as a focus ring on the contenteditable. Usable variants also draw a real outline |
| modals, context menus, settings, login, threads, polls, code blocks, E2EE DM / verified user, unread badges, long names, RTL | screenshotted for every variant (`recordings/screens/<id>/`) and reviewed |
| mobile 390 px | the title bar is dropped below 769 px; bubbles get a narrower gutter |
| console errors | 4, all Element/environment (map style URL, rust crypto store), none from the theme |
| walkthroughs | `recordings/walkthroughs/teams-*.webm` (all 10 + daylight day/night) |
| hero | `recordings/screens/<id>/hero.png` (daylight: also hero-dusk/hero-night) |

## Known gaps

- The title-bar search pill and user menu depend on overriding `.mx_LeftPanel { contain: content }` (now `contain: none` + `overflow: clip`).
- Icon swaps (Fluent) depend on English `aria-label`s (`Video call`, `Threads`, `Room info`, `Emoji`, `Attachment`, `More options`). Other locales fall back to Compound icons.
- The "Chat" header tab and the Copilot chip are decorative (CSS pseudo-elements), not real tabs or buttons.
- 2028: real blur only on the conversation and right panes, because `backdrop-filter` on the rail or list would trap the title-bar elements.
- The comic bubble pop-in animates every tile once on render (exciting stage only; off with reduced motion).
- Presence dots: only on the own avatar (decorative) and where Element renders presence.
- Message timestamps in group layout sit in the gutter left of the bubble (Element's hover behaviour), not inside the bubble as in Teams.

## Assets and licences

Everything in `assets/` may be redistributed. The full licence texts are in `licenses/`. That folder is not deployed, but keep it next to the sources.

| file(s) | what | source | licence |
|---|---|---|---|
| `selawik-{light,semilight,regular,semibold,bold}.woff2` | Selawik 1.01 (300/350/400/600/700), the metric-compatible Segoe UI fallback | github.com/microsoft/Selawik release 1.01 | OFL-1.1 (`licenses/OFL-Selawik.txt`) |
| `cascadia-mono-{regular,semibold,bold}.woff2` | Cascadia Mono 2407.24, subset to Latin/Greek/Cyrillic/punctuation/arrows/math/box drawing | github.com/microsoft/cascadia-code | OFL-1.1 (`licenses/OFL-CascadiaCode.txt`) |
| `comic-neue-{regular,bold}.woff2` | Comic Neue (comic variant body; Comic Sans MS via `local()` first) | google/fonts `ofl/comicneue`, converted TTF→WOFF2 | OFL-1.1 |
| `bangers-regular.woff2` | Bangers (comic display) | google/fonts `ofl/bangers` | OFL-1.1 |
| `orbitron-vf.woff2` | Orbitron variable 400–900 (cyberpunk display) | google/fonts `ofl/orbitron` | OFL-1.1 |
| `share-tech-mono-regular.woff2` | Share Tech Mono (cyberpunk HUD/mono) | google/fonts `ofl/sharetechmono` | OFL-1.1 |
| `fluent-<name>_<20\|24>_<regular\|filled>.svg` (346 files) | Fluent UI System Icons | npm `@fluentui/svg-icons@1.1.346` | MIT (`licenses/MIT-FluentUISystemIcons.txt`) |
| `teams-logo-2025.svg` | Teams logo 2025–present (gradient) | Wikimedia Commons "Microsoft Office Teams (2025–present).svg" | PD-textlogo on Commons; **Microsoft trademark**. Internal use per project decision |
| `copilot-sparkle.svg` | Fluent `sparkle_20_filled` path with a Copilot-like gradient fill (derived from Fluent UI System Icons) | own derivative | MIT |
| `teams-logo-2019.svg` | Teams logo 2019–2025 | Wikimedia Commons "Microsoft Office Teams (2019–2025).svg" | same as above |

## Fonts we do not ship

These are proprietary and referenced only via `local()`:

- Segoe UI, Segoe UI Variable Text/Display, Segoe UI Emoji
- Consolas
- Comic Sans MS

UI stack: `"Segoe UI Variable Text", "TL Segoe", …`. "TL Segoe" is an @font-face family that tries `local("Segoe UI …")` per weight first and falls back to the bundled Selawik. Windows users get real Segoe; everyone else gets Selawik. The same pattern covers "TL Cascadia" (Cascadia Mono) and "TL Comic" (Comic Sans MS, then Comic Neue).

## Known gaps

See `docs/styleguides/teams.md` §9:

- iframes are light/dark only
- the "app bar" is really the space list
- the header tabs are restyled buttons
- icon swaps depend on aria-labels
- no Fluent Emoji

## Notes on brand colour

The late-2026 Teams UI still ships brandTeams `#5B5FC7`, verified by pixel-sampling Microsoft's own May and June 2026 product screenshots. The newer V21 ramp `#654CF5` (in `@fluentui/tokens` since July 2025) appears only in the 2025 logo, so it is used for `teams-2028`. Details are in the style guide, §2.
