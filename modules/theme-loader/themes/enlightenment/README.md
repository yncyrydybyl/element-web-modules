# Enlightenment family (`enlightenment`)

There are 8 variants: `e16-brushed-metal`, `e17-glow`, `e-current`, `e-aurora`, `e-ember`, `e-neon-steel`, `e-usable` and `e-daylight`.
Design intent is in `docs/styleguides/enlightenment.md`, and the gallery data is in `docs/styleguides/enlightenment.json`.

Status (phase B): all 8 variants are implemented. All 4 daylight phases and every variant pass the standard 23-shot set and `edgecheck`; see "Phase B results" below.

## Regenerating

- `tools/palettes.json` is the single source for all palettes, including the four daylight phases.
- `python3 -I tools/contrast.py tools/palettes.json` checks the WCAG ratios.
- `python3 -I tools/gen_styleguide.py tools/palettes.json <repo-root>` rewrites the styleguide JSON, `themes.json` (with the full Compound token set built by `tools/tokens.py`), `e-daylight-phases.css` (one token set per phase) and `e16-metal-tokens.css` (the black-on-metal token set for e16's chrome). Don't hand-edit those three files.
- The style guide markdown is the hand-written `tools/styleguide-head.md` plus per-variant sections generated from the JSON.
- `python3 -I tools/textures.py assets` regenerates the self-made textures. It needs Pillow.
- `python3 -I tools/sample.py <png…>` samples pixel colours. It was used to verify the hex values from the E16/E17 pixmaps.

## Assets and licences

The assets directory is flat, because the build flattens it to `enlightenment--<file>`. The full licence texts are in `licenses/`.

| File(s) | Origin | Licence |
|---|---|---|
| `dejavu-sans-{400,400-italic,700}.woff2`, `dejavu-sans-mono-{400,700}.woff2` | DejaVu 2.37 TTF (npm `dejavu-fonts-ttf`), subset to Latin/Greek/Cyrillic-basic + symbols and converted to WOFF2 with fontTools | Bitstream Vera licence + public domain (`licenses/DejaVu-LICENSE.txt`). Redistribution is allowed; the names "Bitstream"/"Vera" are not used |
| `titillium-web-{400,600,700}.woff2` | Fontsource, latin subset | SIL OFL 1.1 (`licenses/OFL-TitilliumWeb.txt`) |
| `saira-semi-condensed-{500,700}.woff2` | Fontsource, latin | SIL OFL 1.1 |
| `exo-2-{500,700}.woff2` | Fontsource, latin | SIL OFL 1.1 |
| `ibm-plex-sans-{400,600}.woff2` | Fontsource, latin | SIL OFL 1.1 |
| `share-tech-mono-400.woff2` | Fontsource, latin | SIL OFL 1.1 |
| `silkscreen-400.woff2` | Fontsource, latin | SIL OFL 1.1 |
| `brushed-aluminium.png` (256×128, tileable) | self-made, procedural (`tools/textures.py`) | CC0 |
| `brush-overlay.png` (256×128, alpha streaks to lay over any base colour: steel, copper, graphite) | self-made | CC0 |
| `grain.png` (128×128 alpha film grain) | self-made | CC0 |
| `e16-btn-{close,max,min,menu}.svg` | self-made, drawn after the Tigert bronze gem buttons (colours sampled from `t1.png`/`t3.png`) | CC0 |
| `e-glyph-{close,max,min}.svg` | self-made, E-current style title-bar glyphs (white, for `mask-image`) | CC0 |
| `tigert-light-brushed.png`, `tigert-turquoise-bg.jpg`, `tigert-title.png` | e16-themes `BrushedMetal-Tigert/data/{backgrounds/images/light_brushed.png, backgrounds/images/turqouise_bg.jpg, ABOUT/title.png}` (artwork by Tuomas "tigert" Kuosmanen, maintained by Carsten Haitzler) | e16 licence, MIT-style with an acknowledgment clause (`licenses/e16-themes-BrushedMetal-Tigert-COPYING.txt`). Keep the credit line in the gallery |
| `e17-logo-blue-glow.png` | Enlightenment 0.17.6 `data/themes/img/logo_blue_small_glow.png` | BSD-2 (`licenses/enlightenment-0.17-COPYING-BSD2.txt`) |
| `e-logo.svg` | EFL `data/elementary/themes/img/svg/enlightenment.svg` (Inkscape metadata stripped, white fill → use as mask) | LGPL-2.1 (elementary data, `licenses/efl-elementary-COPYING-LGPL.txt`). The E logo is a project mark; real branding is OK for this internal project |

Lucida, the E16 X11 core font, is proprietary. The CSS references it only via `local("Lucida Grande")`, `local("Lucida Sans")` and `local("Lucida Sans Unicode")`, and falls back to the bundled DejaVu Sans.

## Verified palette facts (phase A research)

- **E-current**: the values come from EFL `colorclasses.edc` (master, 2026-11-15). They are `:bg` #404040, `:bg-dim` #303030, `:bg-alt` #383838, `:bg-dark` #202020, `:bg-dark-alt` #1C1C1C, `:bg-darkest` #101010, `:bg-medium` #484848, `:bg-higher` #606060, `:fg` #A0A0A0, `:fg-high` #C8C8C8, `:fg-higher` #DCDCDC, `:selected` #3399FF, `:selected-alt` #FF9933, `:selected2` #99FF33, `:selected3` #FF3399, `:selected4` #FF3333, `:selected5` #9933FF, `:selected6` #33FF99, `:success` #33FF33 and `:light-glow` #FFDCA0. The syntax classes are keyword #FF9999, comment #339999, number #DCDC30, class #77AADD and match #FFBB33. The UI font is `"Sans"` (`fonts.edc`).
- **E17 (0.17.6 dark theme)**: `vgrad_med_dark.png` runs #303030→#111111, `vgrad_med.png` runs #606060→#313131, `menu_sel_bg.png` runs #000→#3D3D3D (a black recessed well), and the wallpaper `bg_radgrad.png` runs #545354→#1C1D1D. All glow sprites are exactly #3399FF. This confirms the dossier's `#3399FF`. The dossier's "text #D8D8D8" is an estimate, because E17 used white text with shadow.
- **E16 BrushedMetal-Tigert**: the active title is #A7A7A6 (gradient #FEFEFE/#E0E3DA top, #4B4C4A/#121212 bottom) and the inactive title is #767675. The sticky title is turquoise (#93B0AE active, #557372 inactive). The gem buttons are bronze (#927C64, #A99682, highlight #F6EEE3, ring #282623). The desktop is turquoise (#3C5A5A mean, gradient #1D5A5A→#818180), the Edoc/about page uses #346F6E with link colour `#88dddd`, and the brushed metal averages #C8C8C6. The fonts are X11 Lucida medium/bold 10 pt. **Correction to the dossier:** Tigert is neutral or slightly warm grey plus turquoise. It is not "blue-tinted greys".
- **BlueSteel** is a dark slate (#2D3243, #3A4050, #41475A). It is not the light #5D7A99 steel the dossier gives. **Ganymede** is indigo/cobalt (backgrounds #2B2B6A, bevels #3263E5/#0B1B5A, plus green #32AA87 and rose #DDA887 variants, with bronze knobs #A8957A). It is not "moody green/blue-grey".
- **Moksha Radiance** is a *light* theme (BGWIN #F2F1F0, RADIANCE_COLOR #DFDFDF, SELECTED #737C99, FG #4C4C4C). The dossier's "graphite + amber #F0A030" is wrong. The e-ember mashup is therefore anchored on E's own second accent (#FF9933), `:light-glow` #FFDCA0 and Tigert's bronze gems instead.

## Phase B results

### Files

| file | role |
|---|---|
| `shared.css` | Family structure, driven by about 90 `--e-*` variables: windows, title bars, shelf, room list, wells, buttons, focus, dialogs (Element's glass frame becomes the E window border, full-bleed title bar), menus, tooltips, scrollbars, badges, code/hljs, auth, clock gadget styles, reduced-motion and forced-colors floors, and Element's literal colours mapped to tokens |
| `<variant>.css` | Variable values plus the variant's signature rules |
| `e16-metal-tokens.css`, `e-daylight-phases.css` | Generated token sets, see above |
| `enhance.ts` | Shelf clock gadget docked over the space panel's bottom edge (analog with glowing hands, digital, flip, E16 "epplet" bezel). It ticks once a second and pauses while the tab is hidden. For e16 it also sets `data-e-active` on the panel holding focus, so the other panels' title bars render inactive (#767675). It only adds attributes and an overlay, and removes both in `unmount()` |

### Per variant

| variant | status | notes |
|---|---|---|
| e16-brushed-metal | done | Every panel is a framed E16 window (1px #FEFEFE + 4px #A7A7A6 + 1px #121212) on the Tigert turquoise desktop. Chrome is black Lucida/DejaVu on brushed aluminium (tokens re-declared per region); the timeline is white on teal. The left panel has a "ROOMS" title bar (Silkscreen) with gem buttons; header and dialogs get gem trios. The space panel is a pager of teal desktops. Scrollbars are bevelled with grip lines; the auth page shows the Tigert "Brushed Metal" title art |
| e17-glow | done | Radial charcoal wallpaper with floating windows (5px gaps). Glossy vgrad title bars, black recessed selection wells with a #3399FF glow bar, Ibar magnify, gel primary buttons, analog glow clock, pulse on mention badges (3×) |
| e-current | done | colorclasses.edc greys, #202020 title bars with glyph trio, a thin blue selection bar and thin blue scrollbar, digital shelf clock, 0.25-style faceted wallpaper. Muted text is raised to #B0B0B0 for contrast |
| e-aurora | done | An aurora sky (teal→cyan→violet→magenta) drifts for 30 s through the glass header, space shelf and composer (fixed attachment, so it reads as one sky). Under text the timeline stays solid. Gradient pills, an aurora hairline on the header and dialogs, and magenta mentions |
| e-ember | done | Charcoal with ember radial glow; brushed-copper title bars with Tigert bronze gems; Saira engraved labels; ember-orange focus and selection; amber badge pulse; flip clock |
| e-neon-steel | done | BlueSteel slate, Ganymede cobalt bevels, a chamfered header and dialogs, cyan neon focus and selection, magenta mentions, Share Tech Mono timestamps, scanlines in code, square avatars |
| e-usable | done | E-current look with brighter text, visible 1px borders, a 2px focus ring plus soft glow, 36px buttons, 1.5 line height, no pulses or text glow, and no enhancer |
| e-daylight | done | dawn (pastel aurora, violet), day (light brushed steel, E-blue #1A5DB3), dusk (copper/ember), night (E17 deep-blue glow). Phase token sets are generated; transitions run under `data-tl-phase-fading`; the clock face follows the phase |

### Edge-case results (23-shot set + edgecheck, 1440×900 and 390×844)

| check | result |
|---|---|
| edgecheck (axe, focus walk, overflow, clipping) | **pass** for all 8 variants and all 4 daylight phases. The remaining axe "serious" nodes are Element's own (`nested-interactive` in the space panel, `scrollable-region-focusable` code blocks) plus 4 console errors from the server config (`map_style_url` missing), not from the theme |
| contrast fixes from edgecheck | e-current muted #A8A8A8→#B0B0B0, e16 muted →#C4E0DE, dawn username colours darkened, home-page buttons set to `--e-pri-*`, `text-badge-*` tokens added, and Element's literal `#91a1c0` / `.mx_Dialog` colours mapped to tokens |
| modals / settings / context menus / tooltips | styled as E windows and menus (title bar, gems or glyphs, square or 3–8px radius per variant) |
| login | the welcome photo is replaced by the variant's desktop (needs `!important`, because Element sets it inline); the modal is an E window |
| threads / right panel | OK. e16 needed an explicit `color` on metal regions, because the inherited `color` was resolved at `<body>` (white) |
| code blocks / hljs | E syntax colourclasses (keyword #FF9999, string #33FF99, …) or per-variant sets; per-span inline-code backgrounds removed inside `pre` |
| polls, E2EE shields, unread badges, long names, RTL, mobile | checked in shots 03/18/19/20/22/23; nothing clipped or unreadable |

### Known gaps

- Element Call, Jitsi and widget iframes stay Element light/dark; only their frame is themed.
- Compound icons are recoloured and glow, but they are not E bitmap icons.
- The room-list section headers ("People"/"Rooms") use hashed classes with no stable hook, so they only get the token colours.
- The e16 window title bars over the left panel and header are decorative. Window shading (roll-up) is not implemented: there is no stable close hook for dialogs.
- e-aurora animates `background-position` on three bars (fixed attachment); `prefers-reduced-motion` stops it.
- Shot 03 shows the page scrolled by about 40px in every family. That is a harness `scrollIntoView` artefact, not the theme.

### Recordings

- Screens: `recordings/screens/<id>/` (23 shots + `hero.png`). Daylight phases are in `e-daylight--{dawn,day,dusk,night}/`, and `recordings/screens/e-daylight/hero.png` is the dusk timeline.
- Walkthroughs: `recordings/walkthroughs/<id>.webm` for all 7 non-daylight variants plus `e-daylight--dusk.webm`.
- Reports: `tests/reports/<id>.md`, all passing.
