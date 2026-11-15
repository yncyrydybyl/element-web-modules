# LCARS style guide (`lcars`, 7 variants)

Machine-readable spec: `lcars.json`. Manifest: `themes/lcars/themes.json`. Assets and licences: `themes/lcars/README.md`.

## 1. Concept

Element becomes a Starfleet LCARS console, after Michael Okuda's "Okudagrams":

- The **room list is the left frame** of the console.
- A **top-left elbow** sweeps the frame into the **header bar**.
- A **bottom-left elbow** sweeps it into the **composer bar**.
- The **timeline sits in a pure black content well**.

The look rests on a few rules: flat colour, no icons, no borders, no shadows and no gradients. Labels are uppercase condensed caps,
right- and bottom-aligned inside colour blocks. Every block carries arbitrary numeric codes.

### Stage axis

```
canon era ─────────────────────────────────────────────────────────►
  TNG 2369 (pure)      Voyager 2375 (past*)      Picard 2401 (future)

seriousness ◄──────────────────────────────────────────────────────►
  usable (9/5)   tng/voyager/picard/daylight (7/7-8)   lower-decks (3/9)   red-alert (3/10)
```

- **pure**: `lcars-tng` is the canonical 2369 palette and the full frame. `lcars-daylight` is TNG driven by the ship's duty shifts.
- **past**: `lcars-voyager`. *Voyager is later than TNG in-universe and on TV. We kept the catalogue id and stage and read
  "past" as "the late-90s broadcast look": cooler silver-blue frames, gold accents and readout tables.
- **future**: `lcars-picard`. The 2399–2401 Starfleet look: thin slate frames, outlined buttons, cyan glass and orange-red indicators.
- **usable**: `lcars-usable`. A slim frame around a normal Element, with readable Inter content, kept icons and no animation.
- **exciting**: `lcars-red-alert`. The pulsing red frame with klaxon energy.
- **comic**: `lcars-lower-decks`. Cerritos oranges on navy glass, ink outlines, cel shadows and deadpan labels.

## 2. Research and verification (what changed vs the dossier)

| Item | Dossier (memory) | Verified | Source |
|---|---|---|---|
| TNG/DS9 series palettes | named colours | confirmed exactly: 2357 / 2369 / 2375 / 2379 sets | trekcolors `data-raw/data.R` (MIT) |
| **Picard** | `#2766FF`-ish blues, `#6EA9DB`, `#B2C7E8`, amber `#F2A33A`, red `#E8443A` | **slate greys are the frame**, not blue: primary-gray `#6D748C`, light-gray `#9EA5BA`, dark-gray `#2F3749`, medium-dark-gray `#52596E`, ghost-gray `#D2D5DF`, starlight `#F3F4F7`. Blue is for **data/selection**: `#37A6D1`, bright `#41C4F7`, medium-dark `#2A7193`, dark `#1C3C55`. Warm accents are **orange-red, not amber**: `#E7442A`, `#FF6753`, `#FF977B`. Buttons are outlined rectangles, and the frames are thin. | thelcars.com colour reference + Picard demo screenshot; the Titan-A screen in the still is cyan on dark glass |
| **Lower Decks** | `#FF9C00`, `#CC99FF`, `#9999FF`, `#FFCC66`, `#CC6666` (lilac/periwinkle) | **almost all oranges**: orange `#FF7700`, daybreak `#FF9911`, harvestgold `#FFAA44`, honey `#FFCC99`, butter `#FFEECC`, october-sunset `#FF4400`, pumpkin-pie `#CC5500`. The PADD set is blue: `#5588EE`, `#66CCFF`, `#99CCFF`, `#344470`, `#455580`, `#88EEFF`, sunset-red `#FF3500`. On-screen consoles in the show sit on **dark navy glass**, not black. | thelcars.com colour reference + Lower Decks demo with show still |
| Voyager | (n/a) | silver `#828CAD`, pewter `#74788B`, command-gold `#FFBB33`, frost `#99CCFF`, science-blue `#2288FF`, andorian-blue `#55A7FF`, flat-dark-earth `#CC9966`, pumpkin-seed `#FFE1CA`, salmon `#E98181`, red-alert `#FF3300`, green-apple `#94B300` | thelcars.com |
| Antonio | OFL, variable 100–700 | confirmed. The google/fonts `Antonio[wght].ttf` is bundled as woff2 (36 KB, Latin/Latin Ext/Cyrillic/Greek) | google/fonts `ofl/antonio` |

Hex values are facts. We took them from thelcars' *colour page* and cross-checked them against its show stills. We copied no
template code (see §11). Reference screenshots of thelcars Picard, Lower Decks and Voyager are at
`research/refs/lcars/thelcars-picard.png`, `thelcars-lower-decks.png` and `thelcars-voyager.png`. They are for internal reference only and are not shipped.

## 3. Shared construction (`shared.css`)

All values are CSS custom properties per variant, so every variant file is mostly tokens.

```
--lc-frame-w      left frame width (room list)        tng 240px · usable 16px arm + normal list · picard 14px arm
--lc-bar-h        header/composer bar thickness        tng 28px · picard 8px (+2px hairline) · lower-decks 34px
--lc-gap          black gap between segments           6px (lower-decks 8px)
--lc-outer-r      elbow outer radius                   64px (picard 48, usable 40, lower-decks 72)
--lc-inner-r      elbow inner concave radius           24px (picard 32, usable 16, lower-decks 28)
--lc-c1 … --lc-c8 frame colour cycle
--lc-label        label colour on blocks (usually #000)
--lc-ink          outline colour (lower-decks only)
```

- **Elbow.** Outer radius on the coloured piece. The inner concave corner is a black pseudo-element with its own rounded
  corner laid over it, or a `radial-gradient` mask.
  - Top-left: `.mx_LeftPanel_outerWrapper::before` (vertical arm cap) + `.mx_RoomHeader::before` (horizontal arm with the inner curve).
  - Bottom-left: `.mx_LeftPanel_outerWrapper::after` + `.mx_MessageComposer::before`.
  - Right panel open (`.mx_MatrixChat:has(.mx_RightPanel)`): mirrored elbows on `.mx_RightPanel`.
- **Bars.** `.mx_RoomHeader` gets a `background` made of hard-stop `linear-gradient` segments with 6px black gaps (flat colour,
  no blending) and a round endcap pseudo-element.
- **Pills.** `border-radius: 999px`. Half-pills: `999px 0 0 999px`. Labels are uppercase Antonio, `letter-spacing: .04em`,
  aligned bottom-right (`align-items: flex-end; justify-content: flex-end; padding: 0 14px 4px`).
- **Colour cycling in the virtualized room list.** `[data-item-index$="0"] .mx_RoomListItemView { --lc-pill: var(--lc-c1) }`
  … `$="9"`. Rows keep a constant height (virtuoso measures).
- **Numeric codes.** Room list items get `::after` with `counter()` or an enhancer-provided `data-tl-code`. Space buttons get a CSS
  counter (`01`, `02` …). The header gets the room code plus a stardate.
- **Token layer.** Variant tokens set the `--cpd-color-*` palette on `html[data-tl-theme=x]`, `body` and `[class*="cpd-theme-"]`:
  - `bg-canvas-default` = bg; `bg-subtle-secondary` = bg (room list black, the pills carry colour); `text-primary` = text;
    `text-secondary` = muted.
  - `bg-action-primary-*` and `bg-accent-*` = accent; `text-on-solid-primary` = onAccent; `bg-critical-primary` = critical.
  - `text-decorative-1..6` and `bg-decorative-1..6` = six frame colours; `border-focused` = accent; `--cpd-avatar-radius: 0`.
  - Fonts: `--cpd-font-family-sans: "Antonio", "Arial Narrow", sans-serif !important` (pure variants) or Inter (usable).

## 4. Per-variant spec

### 4.1 `lcars-tng`: LCARS · TNG (pure, dark, S7/H7)

- **Palette.** The 2369 series on pure black:
  - Frame cycle: `#FF9900` atomic-tangerine, `#FFCC99` tanoi, `#CC99CC` lilac, `#9999CC` blue-bell, `#CC6666` chestnut-rose,
    `#FFCC66` golden-tanoi, `#9999FF` melrose, `#FF9966` orange-peel.
  - Text `#FFCC99` (14.3:1), muted `#9999CC` (7.8:1), accent `#FF9900`, labels `#000`.
  - Critical `#CC6666`. Success `#99CC99` is our choice; LCARS has almost no green.
- **Layout.** A 240px frame (space block stack + room pills) with a 28px header bar and a 28px composer bar. The room name is
  right-aligned in 36px Antonio 500 caps above the header bar.
- **Type.** Antonio throughout. Message bodies use Antonio 400 at 17px with line-height 1.35, mixed case kept. Names, labels
  and buttons are in caps.
- **Enhancer.** Room codes, stardate clock, data cascade block (top area of the frame) and optional chirps.

### 4.2 `lcars-voyager`: LCARS · Voyager (past*, dark, S7/H7)

- **Palette.** Frame `#828CAD` silver, with `#74788B` pewter for secondary blocks.
  - Accent/top block `#FFBB33` command-gold. Bar segments add `#2288FF`, `#99CCFF`, `#FFE1CA`, `#CC9966` and `#E98181`.
  - Text `#FFE1CA`, muted `#99CCFF`, critical `#FF3300`, success `#94B300`.
- **Layout.** As TNG, plus a **readout table** in the header area (`DECRYPTION KEY · SCAN PATTERN · SIGNAL DECAY` with dot
  pills and numbers) and a large stardate `LCARS · 5xxxx` top right.
- **Texture.** An optional 2px phosphor `text-shadow` on frame labels only.

### 4.3 `lcars-picard`: LCARS · Picard (future, dark, S7/H8)

- **Palette.**
  - Frame: slate `#6D748C`, `#9EA5BA` and `#52596E` arms, with `#2F3749` for dark blocks.
  - Content: text `#D2D5DF`, muted `#9EA5BA`, accent cyan `#37A6D1` (own `#41C4F7`).
  - Alerts: orange-red `#E7442A` / `#FF977B`. Glass panels: `rgba(28,60,85,.35)`.
- **Shape.**
  - Thin frames: 14px arms and a double header bar (2px + 8px).
  - A 1px hairline rounded rectangle (r 24px) around the content well.
  - **Outlined rectangles** (1px, r 2px) instead of filled pills; the selection is solid cyan.
- **Type.** Antonio 300/400 with wide tracking (.06em). Bodies use Antonio 400 at 17px in `#D2D5DF`.
- **Motion.** The only variant with easing: 200ms fades and a slow header scan hairline (static under reduced motion).

### 4.4 `lcars-usable`: LCARS · Usable (usable, dark, S9/H5)

- **Palette.** TNG-derived but tuned for long reading.
  - Text `#F2EDE4` (18:1), muted `#B4B4D6` (10.4:1). Frame `#FF9966` / `#CC99CC` / `#9999CC`.
  - Accent `#FF9900`, critical `#FF6666`. Surface `#0A0A0F` for cards and menus.
- **Layout.**
  - A slim frame: 16px arms, 40/16 elbows, 14px bars.
  - Element's room list rows stay as they are (avatar, name, preview) with a coloured half-pill left cap.
  - Group, bubble and IRC layouts all work. Icons are kept and recoloured.
- **Type.** Inter 15px for content, inputs and previews. Antonio caps only for chrome: the room name in the header, frame
  labels, buttons and sender names.
- **Motion.** None (hover brightness only). No enhancer.

### 4.5 `lcars-red-alert`: LCARS · Red Alert (exciting, dark, S3/H10)

- **Palette.** Frame `#CC4444` / `#882211` / `#FFAA99`, accent `#FF2200` mars, text `#FFD6CC`, muted `#CC8877`, surface `#120000`.
- **Motion.**
  - Frame, header segments and unread pills pulse `#CC4444` ↔ `#550000` at `1s steps(2)`. That is one flash per second,
    well under the WCAG limit of 3 per second.
  - Labels flip to `#FFD6CC` in the dark step.
  - The header has a large `RED ALERT` block flanked by alternating segments.
  - Mentions get a pulsing red left bar.
  - Under `prefers-reduced-motion` everything is static red.
- **Enhancer.** Header overlay and an optional synthesized two-tone klaxon on mention (off by default).

### 4.6 `lcars-lower-decks`: LCARS · Lower Decks (comic, dark, S3/H9)

- **Palette.**
  - Navy glass bg `#0E1326`, panels `#1A2140`.
  - Frame cycle: `#FF7700`, `#FF9911`, `#FFAA44`, `#FFCC99`, `#FFEECC`, `#FF4400`, `#CC5500`.
  - Secondary readouts in PADD blues: `#5588EE`, `#66CCFF`.
  - Text `#FFEECC`, muted `#E8B07A`, ink `#05070F`.
- **Shape.**
  - Fatter elbows (72/28) and 34px bars.
  - Every LCARS piece gets a **3px ink outline** and a **flat 3px cel offset** (`box-shadow: 3px 3px 0 #05070F`; no blur).
- **Funny.**
  - Deadpan labels mixed into the codes: `DO NOT TOUCH`, `PROBABLY FINE`, `47 · ENSIGN USE ONLY`, `REPLICATOR: SNACKS`,
    `WARP CORE · DON'T`.
  - Own messages sit in honey-tinted outlined cards.
- **Motion.** A press squash (scale .96, 120ms) and a one-shot wiggle on the selected endcap. Nothing loops.

### 4.7 `lcars-daylight`: LCARS · Ship's Clock (pure, daylight, S7/H7)

The Element base is `dark` in every phase.

| Phase | From | Shift label | Palette |
|---|---|---|---|
| `day` | 07:00 | ALPHA SHIFT | = `lcars-tng` |
| `evening` | 18:00 | BETA SHIFT · REDUCED LIGHTING | frame `#D9862B` / `#A982A9` / `#8282AA`, text `#E6BB8F`, muted `#8282AA` (~80 % luminance, lower saturation) |
| `night` | 22:00 | GAMMA SHIFT · NIGHT CONDITION | monochrome dim amber: frame `#A0641A` / `#8A5A2A`, accent `#B36B00`, text `#C9893F` (7.1:1), muted `#8A6A43` |

- Phase changes fade over 2s.
- The cascade and blinking run only in the day phase.
- Chirps are forced off at night even when enabled.

## 5. Region map

T = TNG, V = Voyager, P = Picard, U = usable, R = red alert, L = Lower Decks, D = daylight. D is the same as T except where noted.

| Region | T / V / R / D (full frame) | P (thin future) | U (usable) | L (comic) |
|---|---|---|---|---|
| shell | black canvas; left frame → elbows → header and composer bars | thin slate elbows + hairline content frame | slim 16px frame, normal Element layout | navy canvas, orange frame with ink outline |
| spaces | numbered colour block stack (`01 HOME`), active = accent | outlined numbered rects, active cyan + red square | colour rounded squares, icons/avatars kept | fat outlined blocks, joke labels |
| roomlist | half-pills cycling by `data-item-index`, black caps labels right-aligned, selected = accent + blinking endcap, unread = numeral block | outlined rects, selected solid cyan, unread red square | Element rows kept + coloured left cap, selected `#1A1A24` | fat full pills + cel shadow, selected butter |
| header | segmented top bar, room name big caps right-aligned, half-pill text buttons, code + stardate (V: readout table; R: RED ALERT block; D: shift label) | double thin bar with red indicator slot, light caps name in cyan | 14px bar above a normal header row, Antonio name, icons | fat bar, outlined |
| timeline | black well, no bubbles, coloured left bar per sender run, caps names, numeral timestamps | black + glass on hover/selected, hairline separators | Inter 15px, all layouts, own = thin left bar | navy well, own in honey outlined cards |
| names-avatars | decorative 1–6 = frame colours; square avatars with 2px palette frame | cyan/ghost/orange-red names; square avatars 1px outline | palette names; square-rounded (4px) avatars | ink-outlined square avatars |
| composer | black slot in bottom bar; TRANSMIT / DATA / SYMBOLS pills | hairline slot, outlined TRANSMIT | bordered slot, SEND pill, icons | fat outlined slot + pills |
| rightpanel | mirrored right frame with elbows; caps card bars | thin mirrored frame | slim mirrored bar | mirrored fat frame |
| buttons | accent pills, black caps label bottom-right; destructive red pill | outlined rects; cyan primary | pills, Antonio caps labels | outlined pills + squash |
| inputs | black slot, colour underline bar + left cap | hairline outline | bordered black field | outlined slot |
| dialogs | overlay mini frame with elbow title, ACKNOWLEDGE / CANCEL | thin frame, outlined buttons | standard dialog + top bar | outlined frame + cel shadow |
| menus | pill stacks with left colour bar; tooltips black + accent bar | outlined list, cyan hover | Element menus recoloured | outlined pills |
| settings | tabs as numbered block stack | outlined tab rects | tabs as pills | fat blocks |
| auth | standalone frame, "LIBRARY COMPUTER ACCESS AND RETRIEVAL SYSTEM" | same, thin | same, slim | same + joke subtitle |
| scrollbars | thin frame-colour pill thumb, black track | 2px slate | 8px muted thumb | outlined pill thumb |
| focus | 3px accent outline, 2px black offset | 2px cyan outline | 3px accent outline | 3px butter outline + ink |
| badges | black numerals on accent block; mentions red | red squares / outlined counts | pill badges, high contrast | outlined pills |
| code | data panel: black, 6px colour left bar, Inconsolata, hljs palette | glass panel, cyan/ghost hljs | standard dark code, palette hljs | navy panel, outlined |
| iframes | Element dark, framed by labelled bar | same | same | same |
| icons | key buttons swapped for caps text; rest recoloured | swapped/recoloured, ghost grey | kept, recoloured | swapped, black on orange |
| motion | steps() colour changes, endcap blink, cascade (R: 1s pulse; D: day only) | 200ms fades, scan line | none | squash/wiggle |

## 6. Signature moves (family)

1. Elbow sweeps that connect the room list frame to the header and composer bars.
2. Pill and half-pill buttons with black, uppercase, right/bottom-aligned Antonio labels.
3. Segmented colour bars with black gaps and round endcaps.
4. Arbitrary numeric codes everywhere (`03-117`, `47 ALPHA`, `LCARS 40274`) and a stardate.
5. Flat colour only: no icons, no shadows, no gradients. Lower Decks is the deliberate exception, with ink and cel shadows.

## 7. Typography

- **Antonio** (OFL, bundled variable woff2, 100–700) for all LCARS chrome. Labels use `text-transform: uppercase` and
  `letter-spacing: .03–.06em`. Picard uses the lightest weights (300) and Lower Decks the heaviest (600–700).
- **Content.** Pure variants keep Antonio for message bodies at 17px+ in mixed case. Usable uses Inter 15px (Element-bundled).
- **Code.** Inconsolata (Element-bundled) in every variant.
- **Numbers.** `font-variant-numeric: tabular-nums` for codes and timestamps.
- Swiss 911 Ultra Compressed is canon but commercial, so it is not shipped and no `local()` is attempted.

## 8. Iconography

Canon LCARS has no icons. The frame variants replace icons with text on stable `mx_` classes:

- Send → `TRANSMIT`; attach (`.mx_MessageComposer_button` upload) → `DATA`; emoji → `SYMBOLS`.
- Header room info → `INFO`; voice and video call → `COMM` / `VISUAL`; threads → `THREADS`.

The `svg` is hidden and the label comes from `::after`. The accessible name is unchanged: aria-label stays and the pseudo
content is decorative. Buttons that can only be identified by a localised aria-label keep their recoloured icon (black on
coloured pills, palette colour on black). Usable keeps all icons.

## 9. Motion and sound

- `steps()` timing only (Picard is the exception). Effects:
  - The selected room endcap blinks (`1s steps(2)`).
  - The data cascade changes digit colours stepwise and swaps text every 400ms. It lives in one overlay block, never per tile.
  - Pressing a button flashes `filter: brightness(1.2)` for 100ms.
- `@media (prefers-reduced-motion: reduce)` turns off blink, cascade, pulse, scan and squash. Red alert becomes static red.
- **Beeps (off by default).** The enhancer synthesizes them with WebAudio:
  - TNG panel chirp: two sine tones of 1400 Hz and 1800 Hz, 45ms each, fast decay.
  - Red alert klaxon: a sweep from 600 to 900 Hz, played only on mentions.
  - Lower Decks: a lower "boop".
  - They are toggled with a frame pill `AUDIO 00/01`, stored in `localStorage["tl.lcars.audio"]`, and the AudioContext is
    created only after a user gesture. Night phase forces them off. No show audio is shipped.

## 10. Accessibility stance

- Every variant passes AA for body text against its background (lowest is daylight night at 7.1:1). Black labels on frame
  colours are ≥ 4.3:1; the lowest are Picard and red alert frames at 4.5:1, and the night frame at 4.3:1, used for large caps
  only.
- Focus is always visible as a 3px accent outline with a black offset. We never set `outline: none` without a replacement.
- Uppercase is applied with `text-transform` on chrome only, so screen readers and copy are unaffected and message content keeps its case.
- The red alert pulse runs at 1 Hz, under the WCAG 2.3.1 flash limit, and is static under reduced motion.
- Decorative overlays (cascade, codes, elbows) are `aria-hidden` and `pointer-events: none`.
- `lcars-usable` is the recommended daily driver: it keeps Element's full information density and icons.

## 11. What cannot be themed, and the workarounds

| Limit | Workaround |
|---|---|
| Calls/widgets are iframes (light/dark only) | `base: dark`; frame the `.mx_AppTile` / `.mx_CallView` with an LCARS bar and caps label |
| The header and left panel are separate subtrees, so one elbow piece is impossible | two touching pieces (frame cap + header inner curve); enhancer overlay + ResizeObserver if misaligned during resize |
| Virtualized room list (`:nth-child` is unstable) | `[data-item-index$="N"]` on the virtuoso wrapper / `aria-posinset` on the item button |
| Hashed CSS-module classes (room list item, event tile states, badges) | `[class*="_roomListItem_"]`, `[class*="_stateOwnEvent_"]`, etc.; `mx_` names where available |
| Localised aria-labels | icon→text swaps only on stable classes; others keep recoloured icons |
| Avatars/images/emoji are full colour | square crop + palette frame; no filters (performance) |
| `NotificationBadgeView` forces `cpd-theme-light` | tokens also set on `[class*="cpd-theme-"]` |
| Element splash before the module loads | unavoidable (Element dark splash) |
| Canon font is commercial | Antonio (OFL) |

## 12. Enhancer plan (`themes/lcars/enhance.ts`, one file, per-variant config)

1. **Codes.** A MutationObserver stamps `data-tl-code="03-117"` on room list items and the header. The code is derived from a
   hash of the room id (or of the name when no id is reachable), so it is deterministic and stable across reloads. Lower Decks
   mixes in the joke pool.
2. **Stardate clock** in the header bar. A TNG-style formula: base 4xxxx for TNG/daylight, 5xxxx for Voyager, 78xxx for Picard.
   It updates every minute.
3. **Data cascade** block in the frame top area (TNG, Voyager, red alert, daylight day phase only). It is one absolutely
   positioned overlay in `ctx.root`, aria-hidden, and pauses when the tab is hidden or reduced motion is on.
4. **Elbow fixer** (fallback). It measures `.mx_LeftPanel_outerWrapper` and the header with ResizeObserver and positions the
   overlay elbow pieces.
5. **Red alert header** overlay and alarm segments.
6. **Audio.** The synthesized chirp/klaxon/boop described in §9, opt-in, with the `AUDIO` toggle pill.
7. **Daylight.** `onPhase()` updates the shift label and disables audio and cascade outside the day phase.
8. **Clean-up.** `unmount()` disconnects the observers, removes `data-tl-code` attributes, closes the AudioContext and clears
   the timers. Every callback is wrapped in try/catch.

## 13. Sources and licences

| Source | Use | Licence |
|---|---|---|
| trekcolors `data-raw/data.R` (leonawicz) | TNG/DS9 series palettes 2357/2369/2375/2379, Nemesis, red-alert sets | MIT |
| thelcars.com colours page + Picard/Lower Decks/Voyager demos | verification of Picard/LD/VOY palettes and layout feel; screenshots for internal reference | custom EULA: **reference only**, no code copied |
| louh/lcars | not used (GPL-3.0) | GPL-3.0 |
| joernweissenborn/lcars | structure ideas only; audio not used | MIT (audio derives from the show) |
| Antonio (Vernon Adams, google/fonts) | bundled font | OFL-1.1 |
| Wikipedia LCARS; Dave Blass interview (Titan-A screens are transparent OLED with motion, so Picard uses fades, not steps) | background | n/a |
| Memory Alpha LCARS article | blocked (HTTP 402) during research; dossier link kept | CC-BY-SA |

LCARS and Star Trek are © CBS Studios / Paramount. The design is by Michael Okuda. This family is for internal use only.
