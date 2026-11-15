# LCARS family (`lcars`)

Seven Star Trek LCARS variants. The design intent is in `docs/styleguides/lcars.md` and `docs/styleguides/lcars.json`.

## Assets and licences

| File | What | Source | Licence |
|---|---|---|---|
| `assets/antonio-variable.woff2` | Antonio, variable `wght` 100–700, all glyphs (Latin, Latin Ext, Cyrillic, Greek). Converted from `Antonio[wght].ttf` with fontTools; DSIG table dropped. | https://github.com/google/fonts/tree/main/ofl/antonio | SIL OFL-1.1 (`assets/OFL-Antonio.txt`) |

Everything else is CSS drawn by us (elbows, pills and bars are CSS shapes, with no images). Body and code fonts use what Element
already bundles: Inter for `lcars-usable` content and Inconsolata for code.

**Sound.** We ship no audio files. The optional chirps, klaxon and "boop" are synthesized at runtime with WebAudio in
`enhance.ts`. They are off by default.

## What we did NOT copy

- **thelcars.com** templates (custom EULA: no redistribution, non-commercial). We used them only as a visual and colour
  reference. Hex colour values are facts, so we reuse a few, but our CSS, class names and structure are written from scratch.
- **louh/lcars** (GPL-3.0): not looked at for code and not used.
- Show audio (e.g. from joernweissenborn/lcars): not shipped.
- Swiss 911 Ultra Compressed (the canon font, commercial): not shipped.

LCARS and Star Trek are trademarks of CBS Studios / Paramount, and LCARS was designed by Michael Okuda. This family is for internal use only.

## Phase B notes

- The room list is virtualized: cycle colours with `[data-item-index$="0"]…[$="9"]` on the virtuoso item wrapper, or with
  `aria-posinset` on the `button.mx_RoomListItemView`. Never use `:nth-child`.
- The top-left elbow spans `.mx_LeftPanel_outerWrapper` and `.mx_RoomHeader`. Build it with pseudo-elements first and
  fall back to an enhancer overlay that uses ResizeObserver.
- Red alert: the low phase of the pulse (`#550000`) needs light labels. Swap the label colour in the same keyframe step.
- Daylight night phase: black labels on `#A0641A` give 4.3:1. Do not go darker.
