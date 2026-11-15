# Crossovers — mashups of other families

Data: `crossover.json` · Manifest: `themes/crossover/themes.json`
Written from the dossiers only (`research/03-styles-platform.md` §1–4, `research/04-styles-artistic.md` §2–3).
Implementation (phase B) reuses the parent families' assets and enhancer pieces.

## Concept

Each crossover takes the **grammar** of one system (layout, widget anatomy, interaction tells) and renders it in
the **material** of another (palette, texture, type). The joke has to survive daily use. Text contrast stays ≥4.5:1,
focus is visible, and reduced motion is honoured. The stage is always `crossover`. The other axes are spread out:

| id | grammar | material | mode | S | H |
|---|---|---|---|---|---|
| x-win311-lcars | Windows 3.11 (MDI windows, title bars, ▼▲, bevel buttons, Program Manager) | LCARS (black field, elbows, pastel blocks, Antonio caps) | dark | 3 | 9 |
| x-teams-sketch | Teams 2026 (app bar, chat list, tabbed header, cards) | Balsamiq wireframe (2px hand strokes, hatching, Balsamiq Sans) | light | 5 | 6 |
| x-kde-e16 | Breeze Dark widgets (radius 5, Plasma blue focus glow) | E16 BrushedMetal-Tigert frames (brushed grey, bevel buttons) | dark | 5 | 7 |

## x-win311-lcars — "Starfleet runs Windows 3.11"

**Palette** (on `#000000`): text tanoi `#FFCC99` 14.4:1 · muted blue-bell `#9999CC` 7.8:1 · accent/active title atomic tangerine
`#FF9900` (black text on it 9.8:1) · lilac `#CC99CC` pills · critical chestnut-rose `#CC6666` 5.7:1. `#CC4444` is avoided
because it is only 4.48:1. Success is `#99CC99`, which is not canon: LCARS has no green. Own messages sit on a faint `#1A1208` wash.

**Construction:**
- One LCARS frame around the app. The left arm is the space panel (a block stack used as Program Manager group icons). The top elbow holds the header and the bottom elbow holds the composer.
- Inside the frame, every pane is a Win 3.1 MDI window. Each has a flat title bar (active `#FF9900`, inactive `#9999CC`) with a centered bold black caption, the control-menu "bar" box on the left and ▼▲ on the right. **There is no ✕.**
- A menu bar sits under the room header: `ROOM EDIT VIEW CALL HELP` with underlined mnemonics.
- Push buttons are pills with the Win 3.1 1px black outline (corner pixel knocked out) and a 2px bevel. Pressed buttons shift 1px. The default button gets a 2px outline.
- Scrollbars follow Win 3.1 rules: 17px wide, fixed square thumb, triangle arrows, dithered track.
- Focus is the Win 3.1 dotted rectangle plus a 2px solid `#FFCC99` outline, so it passes 3:1.
- Timeline: IRC style `<ALICE> hello`, `[stardate]` timestamps, and per-user LCARS colours on names. Avatars are square, posterised, with a 2px palette border.

**Type:**
- W95FA 16px for UI and body. It is OFL and comes from win311.
- Antonio caps for frame labels and the header (OFL, from lcars).
- VT323 for code.

**Motion:** Win 3.1 wireframe zoom rectangle when a dialog opens, brightness on press, and an opt-in synthesised chirp. None of it runs under reduced motion.

## x-teams-sketch — "Teams, as the PM drew it"

**Palette:**
- Canvas `#F2F2F2`, panels `#FFFFFF`/`#FDFDFB`, strokes `#222222` (15.6:1), muted `#5E5E5E` (6.4:1).
- Teams `brandTeamsV21` 80 `#654CF5` (5.4:1 both ways with white) is the only colour, used like a marker.
- Own cards `#E8E8FF` (≈brand160), critical `#D62828`, success `#147A5C`. `#1A936F` is avoided because it is only 3.9:1.

**Construction:**
- The Teams 2026 anatomy from teams §1.5: 68px app bar with icon + label, chat list, header tabs `Chat | Shared | +`, others as white cards on grey, own cards right-aligned and tinted.
- Every box is a 2px irregular-radius stroke (the PaperCSS trick, three rotating radii).
- Selected rows and image placeholders are hatched.
- Purple carries the selection: app-bar pill, scribbled underline under the active tab, primary buttons, unread circles.
- Sticky-note annotations ("v2: presence dots?") appear only in empty states. They are `aria-hidden`.

**Type:** Balsamiq Sans for UI. Architects Daughter for notes. Monospace from the sketch family. All OFL.

**Motion:** a one-shot 1px hover wobble. There are no boiling SVG filters, because this has to be usable and fast on long timelines.

## x-kde-e16 — "Breeze in brushed metal"

**Palette:** Breeze Dark.
- Surfaces: View `#141618`, Window `#202326`, alternate `#1D1F22`. Text `#FCFCFC` (17.7:1), inactive `#A1A9B1` (7.6:1).
- Accent `#3DAEE9` (7.3:1). Own messages on selection-alternate `#1E5774` (white 7.7:1).
- Negative `#DA4453` is too dark for text, so text uses `#ED6A76` (6.0:1) and badge fills use `#BF3343` (white 5.6:1).
- Metal: `#D9DCDE → #B4B8BC → #9EA3A8` gradient with streaks, `#8E9398` rail, outline `#3B3F44`. Black text on it is ≥6.8:1 at the darkest stop.

**Construction:**
- E16 metal goes only on frames: the app border, header title bar, dialog title bars, the composer "shelf" and the space panel as an E16 iconbox with recessed wells.
- Content and widgets are Breeze Dark: radius 5, hover turns outlines blue, the default button gets an accent outline, KDE button order applies, NeoChat-style room rows.
- A decorative 14px bevelled E16 button trio sits on the header and dialogs.
- Focus is the Breeze 1px blue outline plus a 3px glow. On metal, where blue is only 1.24:1, an extra 2px `#141618` inner ring is added.

**Type:**
- Noto Sans 13px (kde).
- Silkscreen caps on metal captions (enlightenment).
- Hack for code (kde, MIT/Bitstream Vera licence).

**Motion:** Breeze 150ms hover, and an E16 window-shade roll-up when a dialog closes. Both are off under reduced motion.

## Region maps

The full per-region phrases are in `crossover.json`. All 21 CONTRACT §4 regions are covered for each variant.

## Signature moves

Five per variant, listed in `crossover.json` → `signature`.

## Accessibility stance

All three are "usable" crossovers. Text is ≥4.5:1, focus is ≥3:1 non-text contrast, icon-less LCARS buttons keep their aria-labels, and
decorative overlays (frame, title-bar trios, sticky notes) are `aria-hidden` with `pointer-events:none`. Reduced motion is honoured.

## What cannot be themed / workarounds

- Iframes stay light/dark. We frame them with the mashup chrome (MDI window, sketched window, metal title bar).
- Hashed classes need substring selectors. The Teams card layout and LCARS frame use CSS grid on stable `mx_` wrappers only.
- **Asset reuse:** the build flattens assets to `<family>--<file>`. A crossover must either reference the parent family's flattened
  file (needs loader/build support for cross-family URLs) or copy the woff2 into `themes/crossover/assets/` in phase B.
  This needs a decision with the loader owner. Until then the manifest's `fonts` is empty.

## Enhancer plans

- x-win311-lcars: compose the lcars frame overlay (elbows, block stack, numbers, stardate) with the win311 title-bar decorations
  (control-menu box, ▼▲, menu bar). Add opt-in WebAudio chirps.
- x-teams-sketch: reuse the teams layout helpers (app-bar labels, header tabs) if teams ships them. Add sticky notes to empty states.
- x-kde-e16: add the E16 bevel trio to the header and dialog title bars, reusing the enlightenment enhancer pieces.

## Sources and licences

The parent dossiers are the source of truth. See `crossover.json` → `sources`. Fonts will come from the parent families:
W95FA (OFL), Antonio (OFL), VT323 (OFL), Balsamiq Sans (OFL), Architects Daughter (OFL), Noto Sans (OFL), Silkscreen (OFL),
Hack (MIT + Bitstream Vera). LCARS is © CBS/Paramount, and Teams/Windows are Microsoft trademarks. Use is internal only.
