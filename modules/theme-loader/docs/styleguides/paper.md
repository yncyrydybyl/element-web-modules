# Paper — low-UI white & black paper

Data: `paper.json` · Manifest: `themes/paper/themes.json` · Dossier: `research/04-styles-artistic.md` §4

## Concept

The UI recedes until only text remains. Influences: iA Writer (one typeface, focus mode, blue caret), e-ink readers
(no colour, no shadow, no motion), Swiss typography (hierarchy by size and weight only), Dieter Rams ("as little design
as possible") and Calm Technology (stay in the periphery until needed).

Nothing in this family is decorative. Each variant takes one more thing away. The family is about **taking away
without breaking**: text stays ≥4.5:1 at every stage, and the focus ring is drawn at every stage.

## Stage axis: visibility gradient

| Level | Variants | What is visible at rest | Reveal mechanism |
|---|---|---|---|
| 1 Calm | `paper-white`, `paper-black`, `paper-daylight` | everything; hairlines; grayscale avatars; muted icons | — |
| 3 Quiet | `paper-white-quiet`, `paper-black-quiet` | text; no lines; periphery recedes to muted ink; older tiles recede to muted ink (≥4.5:1) | hover, `:focus-within`, `(hover: none)` = always |
| 5 Invisible | `paper-white-invisible`, `paper-black-invisible` | text and the focus ring only; chrome boundaries ~1.07:1 | 8px left-edge strip, Ctrl+K, keyboard focus |

Seriousness 10 throughout, hype 0 (daylight 1 for the clock trick).

**Intentionally out (the dossier's levels 2 and 4):** "Writer" (avatars hidden, hover timestamps) and "Page" (off-canvas
navigation) are not separate variants. Level 3 includes all of level 2, and level 5 includes all of level 4. The catalogue count of 7 stays.

## Palettes (contrast checked, WCAG 2.x formula)

| Variant | paper | ink | muted | accent | hairline | notes |
|---|---|---|---|---|---|---|
| paper-white | `#FBFBF8` | `#1A1A1A` 16.8:1 | `#6B6B6B` 5.1:1 | `#0B6BCB` 5.1:1 | `#E6E4DF` | caret `#1AA3FF` (caret only, 2.6:1, decorative), mention wash `#FFF3B0` |
| paper-white-quiet | `#FCFCFA` | `#1A1A1A` | `#6B6B6B` 5.2:1 | `#0B6BCB` | `#EDEDEA` (unused at rest) | |
| paper-white-invisible | `#FFFFFF` | `#222222` 15.9:1 | `#767676` 4.54:1 (floor) | `#505050` 8.1:1 + underline | `#F7F7F7` 1.07:1 | focus ring = ink |
| paper-black | `#0E0E0E` | `#E8E6E1` 15.5:1 | `#9A9893` 6.7:1 | `#6CB6FF` 9.0:1 | `#242424` | mention wash `#3A3320` (ink 10:1 on it) |
| paper-black-quiet | `#0C0C0C` | `#E8E6E1` | `#9A9893` | `#6CB6FF` | `#1A1A1A` | |
| paper-black-invisible | `#0A0A0A` | `#D6D4CF` 13.4:1 | `#7E7E7E` 4.9:1 | `#BDBDBD` + underline | `#121212` 1.06:1 | focus ring = ink |
| daylight · dawn 06:00 | `#F7F1E3` | `#2A2620` 13.4:1 | `#6A6256` 5.3:1 | `#0A5FB4` 5.6:1 | `#E8DFCC` | warm paper |
| daylight · day 10:00 | `#FFFFFF` | `#1A1A1A` | `#6B6B6B` | `#0B6BCB` 5.3:1 | `#E8E8E4` | |
| daylight · dusk 17:00 | `#F1E7D0` | `#3B2F22` 10.6:1 | `#6E5E49` 5.1:1 | `#8A4B12` 5.5:1 | `#E2D5B9` | sepia |
| daylight · night 21:00 | = paper-black | | | | | base dark |

Critical/success: light `#B3261E` (6.3:1) / `#2E7D32` (5.0:1); dark `#FF7B72` (7.7:1) / `#5FD08A` (10:1).
Muted on the hover wash also stays ≥4.5:1: `#6B6B6B` on `#F4F3EE` is 4.8:1, and `#9A9893` on `#151515` is 6.3:1.
All decorative username and avatar tokens (`--cpd-color-text-decorative-1…6`, `bg-decorative-*`) are mapped to ink, muted
and the paper wash. **There are no rainbow names.**

## Region map

The per-variant phrases are in `paper.json`. Summary:

| Region | L1 Calm | L3 Quiet | L5 Invisible |
|---|---|---|---|
| shell | one sheet, 1 hairline left/timeline | no lines, whitespace | blank sheet |
| spaces | grayscale avatars, ink bar for selected | muted ink until hover/focus | off-canvas, edge strip |
| roomlist | text only, 600 + 2px rule selected, • unread | recedes to muted ink | off-canvas (Ctrl+K, focus, strip) |
| header | name 22px + topic | name only | muted small-caps name |
| timeline | 68ch, 17/1.6, small-caps senders | + focus dimming, hover timestamps/action bar | + no avatars, metadata at floor |
| names-avatars | grayscale 24px round | avatars hidden in timeline | hidden |
| composer | top hairline, blue caret | caret only until focus | caret only, controls hidden-but-focusable |
| rightpanel | hairline left | whitespace | unbounded column |
| buttons/inputs | outline/hairline | text-only / bottom line on hover | boundaries on focus only |
| dialogs/menus | 1px border, 2px radius, no shadow | border 12% | border 3% + dim backdrop |
| settings/auth | text tabs / bare column | same, no lines | same |
| scrollbars | thin 6px | on hover | none in timeline |
| focus | 2px accent, offset 3 | 2px ink | 2px ink, **always** |
| badges | tabular digits, `@`+underline | weight only | weight/glyph only |
| code | iA Mono on wash, 3-ink hljs | left rule | weight only |
| iframes | light/dark Element, frame stripped | same | same |
| icons | muted | hidden in rows until hover | opacity 0, ≥24px targets kept |
| motion | 150ms fades | 200ms reveals | none |

## Signature moves

1. Same paper under sidebar, header and timeline. Panels are never tinted.
2. One typeface: iA Writer Quattro for UI and body, iA Writer Mono for code. 17px/1.6 in a 68ch column.
3. The iA-blue block caret (`caret-color:#1AA3FF; caret-shape:block`).
4. State without colour: bold + `•` for unread, `@` + underline for mentions, tabular-nums counts.
5. iA focus mode in the quiet stage: only the newest four messages stay at full ink.

## Typography

- **iA Writer Quattro S** (Regular, Italic, Bold, BoldItalic) and **iA Writer Mono S** are bundled as woff2 from iA's
  own repository. They are OFL 1.1, based on IBM Plex. iA asks for credit and asks that their products are not cloned.
  We credit iA in `themes/paper/README.md` and in the gallery description, and the variants are named "Paper", not "iA Writer".
- Fallback stack: `"iA Writer Quattro S", "IBM Plex Sans", system-ui, sans-serif`. This covers scripts that iA lacks, such as Cyrillic and CJK.
- Scale: body 17px (timeline) / 15px (UI); header 22px/600; small caps (`font-variant-caps: all-small-caps; letter-spacing:.04em`)
  for sender names, section labels and date separators. Weight is the only emphasis axis (400/700; 600 is synthesised, so avoid it).
- `--cpd-font-family-sans/mono` must be set with `!important` (FontWatcher sets them inline).

## Iconography

Compound icons stay but are recoloured to `muted` (icon tokens → `text-secondary`). In quiet and invisible they are hidden
at rest with `opacity:0` on the svg, never `display:none` on the button. This keeps hit targets ≥24px (WCAG 2.5.8) and keeps aria-labels intact.

## Motion

Only opacity, 150–200ms. Invisible has none. Daylight phase changes use a 2s background/colour cross-fade.
`prefers-reduced-motion: reduce` removes all of it.

## Accessibility stance

- Text ≥4.5:1 everywhere (body ≥13:1). Metadata never goes below the floor (`#767676` on white, `#7E7E7E` on `#0A0A0A`).
- Focus is never hidden: 2px solid outline with 3px offset. Accent colour in L1 and ink in L3/L5. Focus also reveals all hover-hidden chrome (`:focus-within`).
- Every hover reveal also reveals on `:focus-within`, and is always visible on `(hover: none)` (touch).
- `prefers-contrast: more` makes quiet and invisible fall back to the level-1 rules.
- **What breaks in the invisible stage (deliberate, stated in the manifest description):**
  - WCAG 1.4.11: resting boundaries of inputs, buttons, dialogs and the composer are ~1.07:1.
  - Discoverability: navigation is off-canvas, and send, attach and emoji are invisible until focused or hovered. New users won't find them.
  - Unread and mention state is carried only by weight and glyphs. This is subtle for low-vision users, but not colour-only (1.4.1 OK).
  - Images and avatars in the member list are faded. Identity cues are weaker, which is a real problem in rooms with similar names.
  - Mouse-only users without a hover-capable pointer get the always-visible fallback, so the invisible look degrades to quiet on touch.

## What cannot be themed and workarounds

- Element Call and widget iframes stay light/dark → we only strip `.mx_AppTile` frame chrome.
- Badges force `cpd-theme-light` → set tokens on `[class*="cpd-theme-"]` and style `[class*="_notificationBadge_"]` as plain digits.
- Hashed classes (highlight `[class*="_highlight_"]`, unread `[class*="_unread_"]`, `_bold_`) → substring selectors plus the loader's version shim.
- Date separators are `.mx_TimelineSeparator` / DateSeparator. Restyle the text only; the lines become transparent.
- Avatar.ts favicon and notification avatars keep their colours. Not fixable.
- The off-canvas left panel uses `transform` on `.mx_LeftPanel_outerWrapper`, and the `.mx_Separator[data-separator]` resize handle is hidden. React nodes are never moved.

## Enhancer plans (`enhance.ts`, optional)

- `data-tl-recent` on the last four `.mx_EventTile` (MutationObserver on the timeline list). This is more robust than `:nth-last-child`,
  which counts read markers and separators. Used by the quiet and invisible variants.
- Invisible only: an `aria-hidden` 8px left-edge strip in `ctx.root`. Hovering it sets `html[data-tl-reveal]`. Alt+Shift+P toggles the
  reveal for keyboard users (Ctrl+K already opens room search). Alt+Shift+P is not bound in Element 1.12.33
  (`KeyboardShortcuts.ts`); the originally planned Ctrl+Shift+S is also free in Element but is Firefox's screenshot shortcut.
- No enhancer for the L1 variants or daylight. Those are CSS only.

## Assets and licences

| File | Source | Licence |
|---|---|---|
| `assets/ia-writer-quattro-{Regular,Italic,Bold,BoldItalic}.woff2` | github.com/iaolo/iA-Fonts (Webfonts) | OFL 1.1, RFN "iA Writer" / "Plex" — credit iA |
| `assets/ia-writer-mono-{Regular,Italic,Bold,BoldItalic}.woff2` | same | same |
| `assets/LICENSE-iA-Writer-{Quattro,Mono}.md` | upstream licence text | — |

## Sources

See `paper.json` → `sources`. These include iA-Fonts, iA typography essays, Calm Tech, Rams, reMarkable, Butterick, and WCAG 2.2.
The font files and licence were verified against iA's GitHub repository (2026-11-15). Fontsource only ships a latin subset, so the
upstream static woff2s are used instead, with the full glyph set.
