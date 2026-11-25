# crossover — mashups

Style guide: `docs/styleguides/crossover.md` / `crossover.json`.

All three variants are **CSS-only** (`"enhance": false`) and own no assets: every font and image comes from the
parent families through `@<family>/assets/<file>` references (CONTRACT §3). `assets/` is intentionally empty.
`shared.css` holds only the floors (shell scroll clamp, `.tl-ui` safety, reduced motion, forced colours).

## Implemented per variant

| Variant | Status | What it does |
|---|---|---|
| x-win311-lcars | done | LCARS top/bottom elbow bars and left arm (spaces = numbered Program Manager group blocks) around Win 3.1 MDI windows: blue-bell sizing bands (tangerine when active), flat title bars with control-menu box and ▼▲ (no ✕), `ROOM EDIT VIEW CALL HELP` menu bar, list-box room rows with "(3)" counts and inverted selection, `<NAME>` IRC senders + `[time]`, 17px dithered scrollbars, LCARS pill buttons with Win 3.1 outline + bevel, dotted+solid focus, Win 3.1 modal double frame, zoom-rectangle open animation, TRANSMIT send pill, "LCARS ACCESS 40274 — LOG ON" login |
| x-teams-sketch | done | Balsamiq wireframe of Teams 2026: sketched top bar with search box, 68px app bar with labels and purple marker pill, chat list with hatched selection and hand-drawn count circles, header with `Chat  Shared  +` tab strip, message cards with rough rotating radii (own = `#E8E8FF`), mention highlighter, graph-paper code blocks, rough frame SVGs on panels/dialogs, sticky notes on the room intro and login, one-shot hover wobble |
| x-kde-e16 | done | Breeze Dark content (View/Window/alt, radius 5, blue hover outlines, focus outline + 3px glow) inside E16 BrushedMetal-Tigert frames (real `tigert-light-brushed.png`): metal app border, iconbox space panel with recessed wells, metal room header with decorative gem-button trio, metal room-list header and card headers in Silkscreen, metal composer shelf with Breeze line edit, Breeze dialogs under a metal title strip with gems, turquoise E16 desktop behind login |

## Reused assets

| Variant | From | Files | Licence (see parent README) |
|---|---|---|---|
| x-win311-lcars | win311 | `w95fa.woff2`, `w95fa-overstrike-bold.woff2`, `pxplus-ibm-vga-8x16.woff2`, `ctl-mdi.svg`, `btn-min.svg`, `btn-max.svg`, `scroll-up.svg`, `scroll-down.svg` | OFL (W95FA), CC BY-SA 4.0 (PxPlus), self-made SVGs |
| | lcars | `antonio-variable.woff2` | OFL |
| x-teams-sketch | sketch | `balsamiq-sans-400/400-italic/700.woff2`, `architects-daughter-400.woff2`, `comic-shanns-mono-400.woff2`, `frame-s1/d1/d2/d3.svg`, `circle-1/2.svg`, `send-circled.svg` | OFL / MIT / self-made |
| x-kde-e16 | kde | `noto-sans-var.woff2`, `noto-sans-italic-var.woff2`, `hack-*.woff2` | OFL / MIT + Bitstream Vera |
| | enlightenment | `silkscreen-400.woff2`, `tigert-light-brushed.png` (tigert, e16 licence — keep the credit line), `e16-btn-min/max/close.svg` (CC0) | |

LCARS (© CBS/Paramount), Teams and Windows (Microsoft) are used for internal purposes only.

## Edge-case results

See `tests/reports/x-*.md`. Text contrast is ≥4.5:1 by palette design (LCARS tanoi 14.4:1, sketch ink 15.6:1,
Breeze 17.7:1); focus is drawn in every variant; reduced motion removes the zoom rectangle, window-shade and wobble.

## Known gaps

- If a parent family renames an asset, `npm run check` fails for crossover (by design: references are validated).
- x-win311-lcars: the TRANSMIT label only shows while typing (Element hides the send button otherwise); the
  menu bar is decorative (no real menus).
- x-teams-sketch: Chat/Shared/+ tabs are decorative.
- x-kde-e16: gem buttons are decorative (`pointer-events: none`).
- Iframes (calls/widgets) stay light/dark; only their frames are themed.
