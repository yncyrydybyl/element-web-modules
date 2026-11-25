# LCARS family (`lcars`)

Seven Star Trek LCARS variants. The design intent is in `docs/styleguides/lcars.md` and `docs/styleguides/lcars.json`.

## Files

| File | What |
|---|---|
| `shared.css` | The whole frame. Every variant only sets `--lc-*` variables plus a few overrides. Uses native CSS nesting. |
| `lcars-<variant>.css` | Palette, metrics and variant-specific overrides. |
| `enhance.ts` | Deterministic codes, stardate/shift readout, data cascade, AUDIO toggle with synthesized chirps (off by default). |
| `assets/antonio-variable.woff2` | Antonio, variable 100–700 (OFL). Kept under a stable name because `x-win311-lcars` may reference `@lcars/assets/antonio-variable.woff2`. |

## How the frame is built (all CSS, no React nodes moved)

- **Space panel = vertical arm.**
  - `::before` is the band-A block, an elbow with an outer bottom-left radius. `::after` is the band-B block, an elbow with an
    outer top-left radius.
  - Spaces form a numbered block stack (CSS counter, plus a code from the enhancer). A `::after` filler on the tree keeps the arm
    continuous.
  - Threads and Quick settings are the bottom blocks. Quick settings is the bottom elbow.
- **Room list.**
  - The `.mx_RoomListPanel` background paints the band-A and band-B bars, the bottom bar and the three **concave fillets**
    (`radial-gradient` ri×ri boxes) that complete the elbows.
  - Room pills are colour-keyed on `[data-item-index$="N"]`, because the list is virtualized.
  - The selected room is the accent pill with a detached blinking endcap.
- **Room header.** It is `--lc-top` high, so it shares the top with the room list and the bars line up exactly. Its background
  holds the segmented bars with black gaps and round endcaps. The room name is right-aligned in Antonio caps. Buttons are pills
  with text labels (VISUAL / COMM / THREADS / INFO). They fall back to icons when the right panel is open, at ≤ 800 px, or when
  the locale doesn't match the English aria-labels.
- **Composer.** The bottom bar is painted in the background. The input is a black slot with a left cap. The action pills are
  SYMBOLS / DATA / MORE, and the send pill is TRANSMIT.
- **Right panel.** A mirrored arm: right border, band-A bar and a fillet.
- **Dialogs, auth, toasts, autocomplete.** Thick left and top borders with a large top-left radius, which gives a free elbow
  with an elliptical inner corner.
- **Shell.** It is `overflow: clip`. The enhancer also pins the document root's `scrollTop` to 0, because `scrollIntoView` in the timeline scrolled the root viewport (which cannot be clipped) and pushed the whole frame ~100 px off screen. That is also why `lcars-usable` runs a minimal enhancer.

## Implemented per variant

| Variant | Status | Notes |
|---|---|---|
| `lcars-tng` | done | 2369 palette, full frame, codes, stardate, digit cascade |
| `lcars-voyager` | done | silver-blue frame, gold accent, re-keyed pills and spaces, phosphor glow on headings, readout-table cascade (DECRYPTION KEY / SCAN PATTERN / SIGNAL DECAY) |
| `lcars-picard` | done | thin slate frame (8 px bars, 92 px arm), outlined rectangles, cyan selection with a red endcap marker, hairline content frame, scan line, keypad readout, 200 ms easing |
| `lcars-usable` | done | slim frame (76 px arm, 12 px bars), Inter content, Element rows with avatars and a coloured left cap, icons kept, no blink or cascade; its enhancer only does the scroll guard |
| `lcars-red-alert` | done | frame pulses at 1 Hz (frame colours dark and labels light in the second step), RED ALERT block, unread pills and mention bars pulse, optional klaxon; static with reduced motion |
| `lcars-lower-decks` | done | Cerritos oranges on navy glass (#0E1326), ink outlines and cel shadows on blocks and pills, fat round pills, joke codes ("WARP CORE · DON'T", "DO NOT TOUCH", "47 · GOSSIP", "SEND IT!"), press squash, endcap wiggle |
| `lcars-daylight` | done | phases day (07:00) / evening (18:00) / night (22:00). Evening is ~80 % luminance; night is monochrome dim amber with the cascade, blink and audio off. The shift label (ALPHA / BETA / GAMMA SHIFT) is in the header readout. |

## Edge-case results (harness, 1440×900 plus mobile 390×844)

All 7 variants pass `edgecheck.mjs`, and `shoot.mjs` gives 23/23 shots for every variant and every daylight phase.

| Check | Result |
|---|---|
| Overflow / missing essentials / clipped text | 0 in all variants |
| Contrast (axe) | 0 findings: TNG, Voyager, usable, Lower Decks, red alert. Picard: hljs and AUDIO-pill findings fixed (frame greys are no longer used as text). Daylight night: 3 small leftovers (down from 79; code and username colours moved to brighter ambers). Frame colours are never used as small text; all of it uses `--lc-text`/`--lc-muted`. Black labels on pills are ≥ 4.5:1 (night and red-alert pills got brighter tints). |
| Focus | Visible everywhere (3 px accent outline). The one remaining "invisible" stop is the composer contenteditable: focus shows on its container border instead of as an outline. |
| axe `nested-interactive` / `scrollable-region-focusable` | Element's own markup (space buttons, code blocks), not theme-related |
| Console errors | only Element's (rust crypto store warning, missing `map_style_url`) |
| Modals, menus, settings, login | styled as LCARS mini frames, numbered tab blocks, pill menus |
| Threads / right panel | mirrored arm; header and composer labels collapse to icons |
| Code blocks / hljs | data panels with a coloured left bar, palette hljs |
| Polls, reactions, thread summary | outlined pills and bars |
| E2EE shields, verified badge | recoloured (ok colour), badges in Antonio caps |
| Unread badges | black numeral blocks on pills; mentions/highlights in red |
| Very long names / RTL | room names ellipsize right-aligned; long header names truncate; RTL bodies render (`dir=auto`) |
| Mobile (≤ 800 px) | slimmer frame (52 px arm), labels become icons, codes and AUDIO pill hidden |

## Known gaps

- **Calls and widgets.** These are iframes and stay Element dark. Only the frame around them is themed.
- **Element splash.** The splash shown before the module loads is Element's own.
- **Header and composer text labels.** They are matched on English aria-labels. Other locales get icons on pills instead.
- **Lower Decks bars.** The gradient-painted bars get no ink outline, only the blocks and pills do. Drawing it would mean an SVG
  filter or doubling every gradient layer.
- **Mobile timeline.** At 390 px Element's message column is narrow. That is Element's layout, made a bit narrower by the 52 px arm.
- **Red alert.** The pulse animates custom properties on five frame containers, so there are 2 style recalcs per second. It is
  disabled with reduced motion.

## Assets and licences

| File | What | Source | Licence |
|---|---|---|---|
| `assets/antonio-variable.woff2` | Antonio, variable `wght` 100–700, all glyphs. Converted from `Antonio[wght].ttf` with fontTools; DSIG dropped. | https://github.com/google/fonts/tree/main/ofl/antonio | SIL OFL-1.1 (`assets/OFL-Antonio.txt`) |

Body and code fonts for `lcars-usable` and code blocks are Element's bundled Inter and Inconsolata. We ship no audio files: the
chirps, klaxon and "boop" are synthesized with WebAudio, are opt-in (`localStorage["tl.lcars.audio"]`), and are only created
after a user gesture.

**Not copied.** We used the thelcars.com templates (custom EULA, no redistribution) as a visual and colour reference only; hex
values are facts, and every rule here is our own. We did not use louh/lcars (GPL-3.0) or any show audio. LCARS and Star Trek are
CBS Studios / Paramount, the design is by Michael Okuda, and this family is internal use only.
