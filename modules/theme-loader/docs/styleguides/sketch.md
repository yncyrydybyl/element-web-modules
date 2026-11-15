# Sketch family — style guide (`sketch`, 10 variants)

Status: Phase A, 2026-11-15. Machine-readable version: `docs/styleguides/sketch.json`. Manifest: `themes/sketch/themes.json`.
Assets and licences: `themes/sketch/README.md`. Reference screenshots: `docs/styleguides/refs/sketch/`.

## 1. Concept

Element, drawn by hand. Every variant answers one question: *who held the pen, and on what surface?* The family is a
**single ladder of roughness** (level-1 → level-8). At the bottom sits a design-system-grade sketch UI that a product
team could ship (Excalidraw's own discipline: clean chrome, hand-drawn *content*). Each rung adds surface texture,
wobble, rotation and less legible handwriting, until level 8, where the UI looks like a toddler made it with crayons and is
unreadable on purpose. Two side branches use dark surfaces (blueprint, chalkboard), and one variant follows the clock
(notebook by day, desk lamp at dusk, chalkboard at night).

The core design rule is **"the line is hand-drawn, not the layout"** for levels 1–4: grids, spacing, hit areas and
reading order stay Element's. From level 5 up, the layout itself starts to tilt, then to crumple.

### 1.1 Stage axis

| level | id | surface | pen | readability | seriousness / hype | motion |
|---|---|---|---|---|---|---|
| 1 | sketch-designed | white canvas, Excalidraw "islands" | fineliner, 1 pass | full (AA everywhere) | 8 / 4 | static. Hand-drawn hint arrows fade in |
| 2 | sketch-wireframe | white plus Balsamiq grey | felt-tip, 2 passes | full | 7 / 3 | none |
| 3 | sketch-notebook | ruled college paper | blue ballpoint, pencil | full (ruled lines can be switched off) | 6 / 5 | page-turn on room switch |
| 3 | sketch-daylight | notebook → desk lamp → chalkboard | pen by day, chalk at night | full | 6 / 5 | 2 s phase fade |
| 4 | sketch-whiteboard | enamel board in an aluminium frame | dry-erase markers | high | 5 / 6 | marker "squeak" draw-in on hover |
| 4 | sketch-chalkboard | green slate in a wooden frame | chalk | high (chalk texture on headings only) | 5 / 6 | chalk dust settles |
| 5 | sketch-blueprint | cyanotype blue, 20/100 px grid | technical pen, stencil caps | high | 6 / 6 | none (precise) |
| 6 | sketch-napkin | quilted paper napkin, coffee rings | cheap ballpoint, bleeding | medium | 4 / 7 | slow wobble on hover |
| 7 | sketch-scribble | scrap paper | graphite + crayon, boiling | medium-low | 2 / 8 | **boiling lines** (Squigglevision, 8 fps) |
| 8 | sketch-unreadable | construction paper | fat crayons, toddler hand | **unreadable by design** | 0 / 9 | boiling plus jitter |

Axis mapping (catalogue fields): `stage = level-N`. Seriousness falls and hype rises with N. **Past/future:** blueprint and
chalkboard look "past" (analogue office, school). Designed and wireframe are "present-day product design". There is no
"future" rung: the family is about analogue tools.

## 2. Research summary (what the references teach)

* **Excalidraw** (MIT code, OFL font): the polished app is *not* sketchy everywhere. Its chrome is a clean sans
  (Assistant/Nunito) on floating white "islands" with soft shadows. Only the canvas content and the onboarding hints are hand-drawn:
  grey Excalifont text plus curved hand-drawn arrows pointing at controls (screenshot `refs/sketch/excalidraw-app.png`). That
  split is what makes it "well-designed sketch UI", and level 1 copies it. Verified values from source
  (`packages/common/src/colors.ts`, `packages/excalidraw/css/theme.scss`, master 2026-11): stroke black `#1e1e1e`,
  primary/selection `#6965db` (darker `#5b57d1`, light `#e3e2fe`), surface-high `#f1f0ff`, greys `#f5f5f5…#121212`,
  stroke picks `#e03131 #2f9e44 #1971c2 #f08c00`, background picks `#ffc9c9 #b2f2bb #a5d8ff #ffec99`, sticky note `#ffdf6b`,
  danger `#db6965`. Dark: canvas `#121212`, island `#232329`, on-surface `#e3e3e8`, primary `#a8a5ff`.
* **Excalifont** is under OFL-1.1, checked at the source: the official download
  (`excalidraw.nyc3.cdn.digitaloceanspaces.com/fonts/Excalifont-Regular.woff2`) carries the full OFL text in name-table ID 13,
  and **no Reserved Font Name** is declared. The copyright line says "All rights reserved", which is the standard OFL preamble.
  The excalifont page now says "Download available under OFL-1.1 license (included in the font file)". The "MIT" note that the
  dossier quoted is gone. The repo itself ships only unicode-range subsets (`packages/excalidraw/fonts/Excalifont/*.woff2`, made with
  cn-font-split) and no separate LICENSE file, so the name table is the authoritative licence. We bundle the official, unmodified
  file. Designer: Ján Filípek / DizajnDesign, based on Virgil by Your Own Font Foundry. Coverage: Latin, Greek, Cyrillic.
* **tldraw** (blog "Engineering imperfection with draw shapes"): it seeds randomness with a *stable* id, so a shape keeps
  the same wobble across re-renders, draws each path in two passes with seed + pass, and rounds corners by angle. Lesson for
  us: the **wobble must be deterministic**. Pre-rendered SVGs and fixed per-nth-child variants, never `Math.random()` per
  render. tldraw's "draw" font is **Shantell Sans** (Arrow Type × Shantell Martin, OFL). Its *Informality* (`INFM`) and
  *Bounce* (`BNCE`) axes let one font slide from neat to irregular, which is ideal for level 7.
* **Balsamiq**: the default font is Balsamiq Sans (OFL). Project styles are *Sketch* ("pen and paper"), *Draft* (markers) and
  *Presentation* (straight lines). Balsamiq publishes **no official hex palette**: link and selection colours can be set per
  project. Our wireframe palette is therefore an informed approximation from screenshots (`refs/sketch/balsamiq-product.jpg`),
  marked as such in the JSON. Wireframe idioms: X-crossed image placeholders, squiggle "text" lines, hatched placeholders,
  greyscale everything except link blue.
* **Bootswatch Sketchy** (MIT): fonts Neucha (body, weight 700) and Cabin Sketch (headings). Radii `255px 25px 225px 25px /
  25px 225px 25px 255px` (base), `55px 225px 15px 25px / 25px 25px 35px 355px` (lg). Primary `#333`. **PaperCSS** (ISC):
  primary `#41403e`, secondary `#0b74d5`, success `#86a361`, warning `#ddcd45`, danger `#a7342d`, fonts Neucha and Patrick Hand SC.
  **DoodleCSS** (MIT): paper `#FDF7F1`, ink `#3c3c3c`, borders via `border-image: url(button.svg) 10 stretch`.
  These are the three canonical "irregular radius / border-image" CSS recipes. We use both techniques.
* **rough.js / wired-elements / rough-notation** (MIT, pshihn): the runtime cost is high in a long, virtualised timeline. We
  therefore **pre-render** rough.js output offline (`themes/sketch/tools/gen-rough-assets.js` → `assets/*.svg`): frames in 3
  roughness grades × 3 seeds, pills, circles, underlines, hachure and cross-hatch tiles, arrows, scribble-out, check and coffee
  ring. At runtime it is plain CSS masks, with zero JS. rough-notation-style live annotations are reserved for a few one-off
  enhancer moments (mentions, pinned).
* **Squigglevision / boiling lines** (CSS-Tricks, Chris Coyier after David Khourshid's "Alex the CSS Husky". Origin: Tom Snyder
  Productions' 5-frame loops). Step through 3–5 `feTurbulence + feDisplacementMap` filters with `steps(1)` keyframes. URL
  filters swap and do not interpolate, which is exactly the boil. Camillo Visini's variant (JS changes `baseFrequency` every
  100 ms, scale 20) is too strong and too costly for chat. We use CSS, scale ≤ 4, on chrome only, never on body text below level 8.
* **Notebook / blueprint recipes**: ruled paper from repeating gradients, with `line-height` equal to the rule pitch so text
  sits on the lines (CSS-Tricks, psd-dude). Realistic college ruling is about 7.1 mm with a margin at about 32 mm. Blueprint
  (Jekyll Blueprint theme, "Tech Blueprint" kit): nested grid gradients (minor 20 px, major 100 px), hairlines, zero radius,
  corner crop marks, dimension lines with arrowheads, stencil or monospace caps, and an orange-red or yellow redline.
* **Hand-drawn icon sets**: *Doodle Icons* by Khushmeen (400+, **CC0**, gumroad only, no repo) is the only clean-licence
  option found. Commercial sets (Streamline Freehand, Roundicons, Creative Market) are excluded. See §7 for the icon plan.

## 3. Shared system (all variants)

### 3.1 Tokens first
Each variant sets ~45 Compound tokens on `html[data-tl-theme=x], … body, … [class*="cpd-theme-"]` (CONTRACT §3): canvas,
subtle-primary/secondary, action/accent ramps, critical/success, text primary/secondary/link, icon ramp, border
interactive, separator, decorative 1–6 (avatar and username colours = **pen colours** of the variant), `--cpd-font-family-sans`
(with `!important`), and `--cpd-font-family-mono` plus a `pre, code` selector. Radii: `--cpd-avatar-radius` stays round
(drawn circle overlay) except in wireframe and blueprint.

### 3.2 Sketch primitives (in `shared.css`, all scoped to `html[data-tl-family="sketch"]`, opt-in per variant via custom properties)

| primitive | technique | used for |
|---|---|---|
| `--sk-frame` | `::before` overlay, `mask: url(frame-<grade><seed>.svg) 0 0/100% 100%`, `background: var(--sk-ink)`. Non-scaling stroke, so 2 px at any size. Seed chosen by `:nth-child(3n+k)` | dialogs, cards, composer, buttons, inputs, menus, room tiles (selected/hover only) |
| `--sk-radius` | irregular `border-radius` à la PaperCSS/Sketchy (3 rotating values) | cheap fallback in low-cost places and in forced-colors mode |
| double stroke | second `::after` border inset −2 px with `rotate(-.4deg)` | level 2–4 buttons |
| hachure | `background: url(hachure.svg)` tinted via `mask` + colour, or `repeating-linear-gradient(-41deg …)` | selected room, badges, progress, placeholders |
| drawn circle | `circle-{1,2,3}.svg` mask on `::after` | avatars, unread counts, radio buttons, reactions (own) |
| scribble underline | `underline-{1,2,3}.svg` as `background` at bottom | links, active tab, room name in header |
| highlighter | 100°-skewed gradient band at 60–70 % height | mentions, search hits, `::selection` |
| tape | translucent `::before` with dashed short edges, rotated ±3° | dialogs, toasts, pinned banner (levels 3, 6, 7) |
| paper grain | `paper-grain.svg` / `grain-dark.svg` tile on `.mx_MatrixChat::after`, `pointer-events:none`, multiply/screen | levels 3–8 |
| hint arrow | `arrow-right.svg` plus Excalifont grey annotation | empty states, day separators, "new messages" |
| wobble / boil filters | inline SVG `<defs>` injected by the enhancer (`assets/wobble-filters.svg` is the reference copy) | level 4+ headers. Level 7–8 borders |

Performance rule: masks and backgrounds on pseudo-elements only. **No `filter:url()` on the timeline container or on
tiles in levels 1–6.** The boil runs only on ≤ 10 chrome elements at a time.

### 3.3 Typography (all bundled, self-hosted woff2, Latin/Latin-Ext subset unless noted)

| variant | UI / body | display (room name, headings, dialog titles) | mono | size scale |
|---|---|---|---|---|
| designed | **Assistant** (chrome: menus, settings, tooltips, timestamps) + **Excalifont** (messages, names, room list, header) | Excalifont | Comic Shanns Mono | Excalifont 1.06× |
| wireframe | **Balsamiq Sans** 400/700/italic | Balsamiq Sans 700 | Comic Shanns Mono | 1.0× |
| notebook | **Patrick Hand** | **Caveat** 600 (margin notes, timestamps) | Comic Shanns Mono | 1.12× |
| whiteboard | **Kalam** 300/400/700 | **Permanent Marker** | Comic Shanns Mono | 1.08× |
| blueprint | **Architects Daughter** | Architects Daughter, uppercase, +0.12em tracking | Comic Shanns Mono | 1.05× |
| chalkboard | **Gaegu** 400/700 | **Cabin Sketch** 700 | Comic Shanns Mono | 1.18× (low x-height) |
| napkin | **Gochi Hand** | **Shadows Into Light Two** | Comic Shanns Mono | 1.12× |
| scribble | **Shantell Sans** var (`INFM 100`, `BNCE 60`, wght 450) | **Rock Salt** | Comic Shanns Mono | 1.05× |
| unreadable | **Reenie Beanie** / **Zeyada** / **La Belle Aurore** cycling per tile | Rock Salt | Zeyada | 1.3× (useless anyway) |
| daylight | notebook fonts in dawn/day/dusk, chalkboard fonts at night | Caveat → Cabin Sketch | Comic Shanns Mono | per phase |

Code stays monospace (alignment matters). Comic Shanns Mono is hand-drawn-ish but a true mono.

### 3.4 Iconography
Compound icons are inline `<svg fill=currentColor>` (251 of them). Plan per level:
* L1–L2: recolour only (`--cpd-color-icon-*` = ink). L2 thickens strokes with `stroke: currentColor; stroke-width: .6px; paint-order: stroke`.
* L3–L6: same, plus a tiny static displacement (`filter:url(#sk-rough-1)`, scale 2.5) **on icon `<svg>` in header, space panel
  and composer only** (≈ 30 nodes, cheap).
* L7–L8: boil filter on icons (animated, reduced-motion → static).
* A handful of high-visibility icons are **swapped** for our own rough.js drawings via `mask` on the button and the svg hidden:
  send (`send-circled.svg`), checkmarks in read receipts and "verified" (`check.svg`). Doodle Icons (CC0) are optional for
  phase B if more swaps are wanted. They would need downloading from gumroad by hand, so nothing is bundled yet.

### 3.5 Motion
Base: none in L1–L2 except the designed variant's hint fade (200 ms). L3 page-flip (`rotateY` 4° plus shadow) on room switch, done
via the enhancer toggling a class on `.mx_RoomView` for 300 ms. L4 hover "draw-in" (stroke-dashoffset on the frame mask is
not possible, so a `clip-path: inset()` sweep on the `::before` frame, 250 ms). L6 hover wobble (±0.6°, 400 ms). L7–L8 boil
(`steps(1)` 3 frames over 0.375 s, i.e. 8 fps, the cartoon cadence). **All of it sits behind `@media (prefers-reduced-motion:
no-preference)`**, and the boil is also paused while `document.hidden`.

### 3.6 Accessibility stance
* L1–L5 + chalkboard + daylight: body text ≥ 4.5:1 (computed: designed 16.7, wireframe 17.4, notebook 11.6, whiteboard 16.1,
  blueprint 9.4, chalkboard 10.4, desk lamp 11.3). Muted text ≥ 4.5:1. Handwriting fonts are scaled up (see table).
  Font size, IRC/bubble layouts and Element's font-size slider keep working.
* Focus: never removed. Designed = Excalidraw selection box (2 px `#6965db` outline plus 4 corner handle squares via
  `background` gradients on an `::after`). Others = drawn circle or underline plus a solid 3 px outline in accent (the real
  `outline` always stays, decoration only adds to it).
* Ruled lines and grain can be dyslexia noise: the notebook ruling is drawn behind text at ≤ 35 % alpha and is removed under
  `prefers-contrast: more`. The textures go under `forced-colors: active` (dossier §0.2).
* Napkin (L6) and scribble (L7) trade readability for fun. They are tagged medium / medium-low in their descriptions.
* **Unreadable (L8)** breaks readability on purpose (`level-8`, description says so). **Escape hatch:** the theme
  picker (settings "Themes" tab and quick switcher, identified by loader classes) and the `.mx_UserSettingsDialog`
  close button are rendered in plain Excalifont at normal size, with no filters. That way the user can always switch back.
  Reduced motion is still honoured in L8.

## 4. Per-variant design specs

Palette keys follow SCHEMA (bg, surface, sidebar, rail, text, muted, accent, onAccent, border, own, other, critical, success).

### 4.1 sketch-designed — "Excalidraw polish" (level-1, light)
*Tagline:* a whiteboard app's discipline applied to chat.
Palette: bg `#ffffff`, surface `#ffffff`, sidebar `#f8f9fa`, rail `#f1f0ff`, text `#1e1e1e`, muted `#5c5c5c`, accent `#6965db`
(text uses `#5b57d1`, 5.6:1), onAccent `#ffffff`, border `#1e1e1e`, own `#e3e2fe`, other `#f8f9fa`, critical `#e03131`,
success `#2f9e44` (icons/fills; success *text* uses `#2b7a3b`, 5.3:1). Decorative 1–6 = Excalidraw stroke picks `#e03131 #2f9e44 #1971c2 #f08c00 #9c36b5 #0c8599` on fills
`#ffc9c9 #b2f2bb #a5d8ff #ffec99 #eebefa #99e9f2`.
Signature moves:
1. Floating **islands**: space panel, room-list header and composer become white rounded (8 px) islands with Excalidraw's
   `--shadow-island` and a 1 px `#e9ecef` hairline. The chrome stays clean (Assistant).
2. **Content is drawn**: message bodies, names and the room list in Excalifont. Bubbles and cards get the `frame-d*` rough outline (1 pass,
   roughness 0.6). Own messages are filled `#e3e2fe` with hachure at 15 % alpha.
3. **Selection box** focus and selected-room treatment: violet 1 px box plus 4 handle squares, exactly Excalidraw's transform handles.
4. **Hint annotations**: empty room, empty room list and "new messages" lines get grey Excalifont notes with a curved
   `arrow-right.svg` pointing at the composer or the list (Excalidraw welcome-screen idiom).
5. **Colour-picker avatars**: default avatars are drawn circles in the 6 stroke picks on their light fills.
Regions: see JSON / table §5.

### 4.2 sketch-wireframe — "PM's Balsamiq mockup" (level-2, light)
Palette (approximation, Balsamiq publishes no hex): bg `#fbfbfb`, surface `#ffffff`, sidebar `#efefef`, rail `#e2e2e2`, text
`#1a1a1a`, muted `#666666`, accent `#0a64d6` (link/selection blue), onAccent `#ffffff`, border `#2b2b2b`, own `#f2f2f2`, other
`#ffffff`, critical `#d0021b`, success `#2f7a25`.
Signature: (1) everything greyscale except link blue, and images and avatars `filter: grayscale(1) contrast(1.1)`. (2) **X-box
placeholders**: media and URL-preview images get a crossed-box overlay while loading, and on hover in blur-media mode. Avatars with no image
= circle with an X. (3) 2 px double-stroke (2-pass rough) frames on every control. Buttons are Balsamiq pills `pill-s*.svg`.
(4) Hatched grey placeholders for skeletons and loading states (`hachure.svg` at 25 %). (5) Sticky-note yellow (`#fff3a0`)
"annotation" callouts for toasts and tooltips, as in Balsamiq's note control. Layout is untouched (mockups are faithful).

### 4.3 sketch-notebook — "college-ruled, blue ballpoint" (level-3, light)
Palette: bg `#fdfbf4`, surface `#fffdf7`, sidebar `#f4efe2`, rail `#e9e1cc`, text `#22336b` (ballpoint navy), muted `#62605a`
(pencil), accent `#2a4cad`, onAccent `#ffffff`, border `#22336b`, own `#eef3ff`, other `#fdfbf4`, critical `#c62828` (red pen),
success `#2e7d32`. Rules `#a7c7e7`, margin `#e8817f`, highlighter `#fff176`.
Signature: (1) timeline on **ruled paper**: 28 px rule pitch, `line-height: 28px` on tile bodies, red double margin line at 64 px.
Sender names and timestamps live **in the margin** as Caveat annotations, rotated −2°. (2) **Spiral binding** down the left edge
of the room view (radial-gradient holes plus a coil drawn with a repeating SVG). (3) Room list as **index tabs**: each room a paper
tab with a coloured edge stripe (decorative colour). The selected tab sticks out 6 px. (4) **Highlighter** on mentions, search hits
and `::selection`. (5) Dialogs as **torn-out pages** with tape at the top (zig-zag `clip-path` on the left edge).

### 4.4 sketch-whiteboard — "office whiteboard" (level-4, light)
Palette: bg `#f7f7f5`, surface `#ffffff`, sidebar `#eef0f2`, rail `#c9ced6` (aluminium frame), text `#1b1b1b`, muted `#5f6368`,
accent `#1f5bd6` (blue marker), onAccent `#ffffff`, border `#1b1b1b`, own `#e8f0ff`, other `#ffffff`, critical `#d62828`,
success `#127a5c`. Marker set for decorative 1–6: `#1b1b1b #1f5bd6 #d62828 #127a5c #7b2cbf #e07a00`.
Signature: (1) **aluminium frame** around the app (10 px brushed-grey gradient border on `.mx_MatrixChat`) with a **marker
tray** under the composer holding 4 CSS-drawn markers. (2) **Ghost-erased** smudges (`whiteboard-ghost.svg`) and a subtle enamel
sheen gradient. (3) Senders colour-coded by marker. Message frames in the matching marker colour, `frame-s*` rough grade.
(4) **Sticky notes** (`#fff176`, `#ffb3c7`, `#a5e3ff`) for context menus, tooltips and the thread panel, slightly rotated with a peel
shadow. (5) Room name in Permanent Marker with a scribble underline. Magnets (red discs) pin the dialogs.

### 4.5 sketch-chalkboard — "school slate" (level-4, dark)
Palette: bg `#2e3b32`, surface `#34443a`, sidebar `#27332b`, rail `#6b4f32` (wood frame), text `#f2f2ea`, muted `#b9c2b5`, accent
`#f7e37a` (yellow chalk), onAccent `#2e3b32`, border `#e8e8de`, own `#3a4c41`, other `#34443a`, critical `#f4a6b8` (pink chalk),
success `#b8e6a1`. Chalk set: white, yellow, pink, blue `#a9d6f5`, green `#b8e6a1`, orange `#f9c38b`.
Signature: (1) **wooden frame** around the board with a **chalk tray** composer (wood ledge, chalk sticks and a felt eraser drawn in CSS).
(2) **Chalk-dust** overlay (`chalk-dust.svg`, screen blend, 35 %) plus eraser-swipe arcs behind the room list. (3) Headings and
room names in Cabin Sketch with the `sk-chalk` grain mask filter (**headings only**, never body). (4) Lines drawn as dotted
semi-opaque chalk strokes (`frame-s*` mask with a noise sub-mask). (5) Unread badge = number circled in yellow chalk.
Base for iframes: dark.

### 4.6 sketch-blueprint — "cyanotype engineering drawing" (level-5, dark)
Palette: bg `#123f73`, surface `#164a85`, sidebar `#0f3561`, rail `#0b2b50`, text `#eaf2ff`, muted `#a9c1e0`, accent `#ffd166`
(yellow redline), onAccent `#0b2b50`, border `#e8f1ff`, own `#1a5596`, other `#164a85`, critical `#ff8a7a`, success `#7be0b0`.
Grid: minor 20 px `rgba(255,255,255,.08)`, major 100 px `rgba(255,255,255,.18)`.
Signature: (1) **Grid paper** everywhere (`background-attachment: local` in the timeline). (2) **Title block**: the room header
becomes an engineering title block (cells: ROOM / TOPIC / MEMBERS / SHEET n of m / SCALE 1:1). Cells are drawn with CSS grid
borders. The text is the real header content plus enhancer-added static labels. (3) **Dimension lines**: panel separators show
`⟵ 320 ⟶`-style measurements (enhancer writes the live width into a `data-` attribute that a `::after` shows) and corner crop
marks on dialogs. (4) Zero radius, 1.5 px hairlines, dashed "hidden lines" for disabled controls. Uppercase tracked stencil
lettering for labels. (5) Avatars as **section circles** with a centre cross. Images get a cyanotype treatment
(`grayscale(1) sepia(1) hue-rotate(170deg) saturate(2.5)` at 85 %).
This variant is the most "precise" rung: the hand shows in the lettering, not in wobble. It is level 5 because of the full
re-skin (title block, dimensions), not because readability drops.

### 4.7 sketch-napkin — "back of a napkin" (level-6, light)
Palette: bg `#f3ece0`, surface `#f8f3ea`, sidebar `#ebe2d1`, rail `#c8a97e` (kraft sleeve), text `#22408c` (ballpoint),
muted `#5d6380`, accent `#22408c`, onAccent `#ffffff`, border `#22408c`, own `#e9e4f2`, other `#f8f3ea`, critical `#b3261e`,
success `#33682f`. Coffee `rgba(111,78,55,.22)`.
Signature: (1) **embossed quilted napkin** texture (`napkin-fibre.svg`) with a dotted embossed border pattern around each panel.
(2) **Coffee rings** (`coffee-ring.svg`) at 2–3 fixed positions on shell and dialogs. (3) Everything rotated ±0.4–0.8°
(per `nth-child`), with frames in the rough `x` grade. (4) **Ink bleed**: `text-shadow: 0 0 .4px currentColor` and slightly
uneven letter-spacing. (5) Layout drifts: the room list is offset 4 px, the header skews −0.5°, the composer is a smaller napkin "torn"
off (irregular `clip-path`). Readability: medium (Gochi Hand at 1.12×).

### 4.8 sketch-scribble — "boiling scribble" (level-7, light)
Palette: bg `#fffdf8`, surface `#ffffff`, sidebar `#f5f1e8`, rail `#ebe5d6`, text `#2b2b2b` (graphite), muted `#6b6b6b`, accent
`#b83d0b` (orange crayon), onAccent `#ffffff`, border `#2b2b2b`, own `#fff1e0`, other `#ffffff`, critical `#c92a2a`,
success `#237032`. Crayon set: `#c92a2a #1864ab #2b8a3e #e67700 #862e9c #0b7285`.
Signature: (1) **Boiling lines**: frames, icons and headers cycle `sk-boil-0..2` at 8 fps (Squigglevision). (2) **Crooked
layout**: panels rotated −1°/+0.8°, room tiles alternate ±1.2°, the composer is skewed. Hit areas are unchanged (transforms are
visual only). (3) **Cross-hatch shadows** (`crosshatch.svg`) under cards and dialogs instead of box-shadow. (4) Shantell Sans
with Informality 100 and Bounce 60: letters hop, with no filter needed. Rock Salt headings. (5) Hover **jitter**
(`translate 1px` steps) and scribble-out (`scribble-out.svg`) over redacted messages.

### 4.9 sketch-unreadable — "toddler with crayons" (level-8, light, unreadable by design)
Palette: bg `#f4e9d8` (construction paper), surface `#fff6e6`, sidebar `#ffd8a8`, rail `#a5d8ff`, text `#7a7a7a` (grey wax on
paper, 3.6:1 on purpose), muted `#a3a3a3`, accent `#f03e3e`, onAccent `#fff6e6`, border `#f03e3e`, own `#d3f9d8`, other `#fff3bf`,
critical `#f03e3e`, success `#37b24d`.
Signature: (1) three illegible scripts cycling per tile (Reenie Beanie / Zeyada / La Belle Aurore) at mixed sizes. (2) Per-tile
rotation up to ±4°, letter-spacing chaos, words drift off the line (`sk-rough-3` filter **on text**, allowed here only).
(3) Fat crayon outlines (6 px, `frame-x*`) in random-looking crayon colours, colouring "outside the lines" (fills offset
from the borders by 6 px). (4) Stick-figure avatars: the image hidden, and a CSS/SVG stick figure in a crayon colour. (5) A boiling,
jittering everything (reduced motion → static chaos). **Escape hatch** keeps the theme picker readable (see §3.6).

### 4.10 sketch-daylight — "desk by the window" (level-3, daylight)
Schedule (local clock): `06:00 dawn` (base light), `09:00 day` (light), `18:00 dusk` (light), `21:00 night` (dark).
* **dawn**: notebook with a cool morning tint. bg `#fbf3ec`, text `#2b2f4a`, accent `#3b5bdb`, low sun streak gradient from the right.
* **day**: exactly sketch-notebook.
* **dusk / desk lamp**: warm paper `#f6e7c8`, text `#3a2a17`, accent `#9c4a1a`, a radial **lamp-light vignette** from the top left
  (`radial-gradient(circle at 15% 0, #fff6dd 0, transparent 60%)` plus dark corners via a fixed `::after` with
  `mix-blend-mode: multiply`). Pencil-graphite ink.
* **night**: exactly sketch-chalkboard.
Transition: 2 s colour fade (CONTRACT §6). Fonts swap at the dusk → night boundary (Patrick Hand → Gaegu), which is acceptable at a
phase change.

## 5. Region map (CONTRACT §4)

D = designed, W = wireframe, N = notebook (= daylight day/dawn/dusk), WB = whiteboard, C = chalkboard (= daylight night),
B = blueprint, K = napkin, S = scribble, U = unreadable.

| region | D | W | N | WB | C | B | K | S | U |
|---|---|---|---|---|---|---|---|---|---|
| shell | white canvas, islands float with island shadow | flat #fbfbfb, 1 px grey frame | paper plus grain, spiral binding left of room view | aluminium frame, enamel sheen, ghost smudges | wooden frame, slate, chalk dust | grid paper, crop marks at corners | quilted napkin, coffee rings, kraft sleeve rail | scrap paper, everything tilted | construction paper, crayon scrawl background |
| spaces | island toolbar (vertical), selected = violet selection box | grey column, square wireframe buttons | notebook ring tabs | magnets on frame rail | chalk-drawn circles on wood rail | title-block column of numbered sheets | kraft strip, doodled circles | boiling circles | crayon blobs |
| roomlist | Excalifont rows, selected = hachure `#a5d8ff` plus handles | wireframe list rows with ruled separators, selected = blue fill | index tabs with colour stripes | marker list, selected = circled in blue | chalk list, selected = yellow underline | tabular parts list with row numbers | ballpoint list, selected scribbled around | wobbly list, alternating tilt | scattered words |
| header | island bar, room name Excalifont with underline-1 | wireframe title bar with X-box avatar | page heading in Caveat plus date margin | Permanent Marker title plus scribble underline | Cabin Sketch chalk title | **engineering title block** | wobbly heading with arrow | Rock Salt, boiling | huge crayon scrawl |
| timeline | frame-d bubbles/cards. IRC/group keep layout, rough card on hover | squiggle-free real text, 2-pass frames on bubbles | ruled lines, names/timestamps in margin | colour-coded marker frames | chalk text, dotted chalk frames | grid, hairline frames, callout leader lines for replies | tilted tiles, ink bleed | crooked tiles, boiling borders | rotated, overlapping, unreadable |
| names-avatars | drawn circles in stroke picks | X-circles, greyscale images | ballpoint-circled, pen colours | marker circles | chalk circles | section circles with cross, cyanotype images | doodle circles | boiling circles | stick figures |
| composer | island with frame-d border, circled send arrow, hint "write something…" | wireframe text field plus pill button | sticky note on the page | marker tray ledge | chalk tray ledge plus eraser | dimensioned input box "⟵ message ⟶" | torn napkin scrap | scribbled box, boiling | crayon box |
| rightpanel | island sheet | wireframe panel | loose sheet clipped with paperclip | post-it column | small slate | detail drawing "DETAIL A" | second napkin | tilted sheet | paper chaos |
| buttons | primary = violet fill, rough outline. Secondary = rough outline | Balsamiq pills, 2 strokes | ballpoint-outlined boxes, hover highlighter | marker pills | chalk boxes | stencil rectangles | wobbly ovals | boiling pills | crayon blobs |
| inputs | rough outline, violet focus box | wireframe field with squiggle placeholder | underline-only (write on the line) | marker underline | chalk underline | dimension-boxed | ballpoint underline | wobbly box | crayon |
| dialogs | island card, frame-d, soft shadow | wireframe window with X close | torn page plus tape | magnet-pinned sheet | slate plus wood border | drawing sheet with crop marks plus title block | napkin plus coffee ring | crooked, crosshatch shadow | crumpled |
| menus | clean Assistant menus, rough outline | wireframe dropdown | index card | sticky notes | small slate cards | parts-list table | napkin corner | wobbly card | crayon |
| settings | readable: Assistant, tabs underlined with underline-2 | wireframe tabs | notebook tabs | sticky tabs | chalk tabs | sheet index | napkin | crooked tabs | **escape hatch for theme tab** |
| auth | Excalidraw welcome-screen look: logo plus hint arrows | wireframe login mock | notebook cover (cardboard) | whiteboard with "LOG IN →" | slate "Sign in" | cover sheet title block | napkin | scribble | crayon (inputs readable) |
| scrollbars | thin violet rough thumb | grey wireframe thumb | pencil-line thumb | marker thumb | chalk thumb | hairline with ticks | ballpoint | wobbly | crayon |
| focus | Excalidraw selection box (outline plus handles) | blue 3 px plus double stroke | ballpoint circle plus outline | blue marker plus outline | yellow chalk plus outline | yellow redline plus outline | ballpoint plus outline | orange plus outline | red crayon plus outline (kept) |
| badges | count in drawn circle, red fill `#ffc9c9`, stroke `#e03131` | grey hachure pill | red-pen circle | red marker dot | yellow chalk circle | revision triangle "△3" | ballpoint scribble | boiling circle | crayon blob |
| code | Comic Shanns Mono on `#f8f9fa` island | mono on hatched grey | mono on graph-paper square grid | mono on white | mono on darker slate | mono on grid, hairline frame | mono on napkin | mono, tilted | Zeyada mono-ish |
| iframes | light frame island | light | light | light | dark, chalk frame | dark, sheet frame | light | light | light |
| icons | recolour `#1e1e1e` | recolour plus stroke thicken | ink plus static rough (chrome only) | marker plus static rough | chalk plus rough | white hairline | ballpoint plus rough | boil | boil plus jitter |
| motion | hint fade only | none | page flip on room switch | draw-in sweep | dust settle | none | slow wobble on hover | boil 8 fps | boil plus jitter |

## 6. What cannot be themed, and the workarounds

| limit | workaround |
|---|---|
| iframes (Element Call, widgets, Jitsi) stay Element light/dark | `base` light/dark per variant. Frame `.mx_AppTile` / `.mx_CallView` in the variant's frame style |
| Compound icons are inline React SVGs, per-icon swap is costly | recolour plus filter. Swap only send and check via masks (by `aria-label`) |
| user images, video, blurhash pixels | CSS filters (greyscale, cyanotype) plus drawn frames. Never the pixels themselves |
| chat effects canvas (confetti, snow) | left as is (colourful confetti fits sketch) |
| text on rules: Element's paragraph margins break the 28 px rhythm | set `margin-block: 0` and pad lists/quotes to multiples of 28 px. Rich content (images, code) breaks the ruling: draw a "taped photo" frame |
| hashed CSS-module classes (`_root_`, `_line_`, `_stateOwnEvent_`, `_roomListItem_`, `_notificationBadge_`) | substring selectors, plus compound with an `mx_` ancestor because `_root_` and `_line_` are generic |
| Notification badges force `cpd-theme-light` | tokens also on `[class*="cpd-theme-"]`, plus direct `[class*="_notificationBadge_"]` styling |
| forced-light `.mx_ErrorView` / spinner before modules load | accepted |
| per-element random wobble | deterministic `nth-child` seeds (tldraw lesson). No JS randomness |
| SVG `filter:url(#id)` needs in-document defs | enhancer injects `<svg><defs>` once (copy in `assets/wobble-filters.svg`). CSS falls back to "no filter" if missing |

## 7. Enhancer plan (`themes/sketch/enhance.ts`)

Shared enhancer, behaviour switched by `ctx.variant.id`:
1. **Inject SVG filter defs** (rough-1, rough-3, boil-0..2, chalk, smudge) into `ctx.root`. Remove them on unmount.
2. **Hint annotations** (designed, notebook): absolutely positioned Excalifont/Caveat notes plus arrows in `ctx.root`, anchored
   to the empty-state or composer rect via ResizeObserver. Hidden when the timeline has > 3 events.
3. **Blueprint title block and dimensions**: a MutationObserver writes `data-sk-w` (rounded panel widths) on `.mx_LeftPanel` /
   `.mx_RightPanel` and `data-sk-sheet` (room index) on `.mx_RoomHeader`. CSS renders them.
4. **Page flip** (notebook/daylight): toggles `html.sk-flip` for 300 ms on room change (via `api` room-view events, or a URL
   hash observer).
5. **Boil throttle** (scribble/unreadable): pauses the animation class when `document.hidden` or on reduced motion. Caps the
   boiling elements at 10 (adds `data-sk-boil` to the header, composer, dialog and space-panel buttons only).
6. **Escape hatch** (unreadable): marks the loader's theme picker container with `data-sk-safe` (CSS resets fonts and filters there).
7. Optional: rough-notation-style circled mention on the *latest* highlighted event only (one SVG, drawn once).
No React nodes are moved. Everything is attributes and overlays (CONTRACT §5).

## 8. Assets and licences (summary, details in `themes/sketch/README.md`)

Fonts (all self-hosted woff2): Excalifont (OFL-1.1, official file unmodified, licence in the font), Assistant (OFL), Balsamiq Sans (OFL),
Patrick Hand (OFL), Caveat (OFL), Kalam (OFL), Architects Daughter (OFL), Gaegu (OFL), Cabin Sketch (OFL, **RFN** → converted
to woff2 *without subsetting*), Gochi Hand (OFL, **RFN** → same), Shadows Into Light Two (OFL), Shantell Sans (OFL), Reenie
Beanie (OFL), Zeyada (OFL), La Belle Aurore (OFL), Permanent Marker (Apache-2.0), Rock Salt (Apache-2.0), Comic Shanns Mono
(MIT). Not bundled: Virgil (superseded by Excalifont), xkcd Script (CC BY-NC), Neucha (not needed).
SVGs: generated by us with rough.js (MIT) → our own work, same licence as the repo.

## 9. Sources

| source | used for | licence |
|---|---|---|
| Excalidraw repo, `packages/common/src/colors.ts`, `packages/excalidraw/css/theme.scss`, `packages/excalidraw/fonts/` — https://github.com/excalidraw/excalidraw | verified palette, dark values, font subsets | MIT |
| Excalifont page — https://plus.excalidraw.com/excalifont · download https://excalidraw.nyc3.cdn.digitaloceanspaces.com/fonts/Excalifont-Regular.woff2 | font, licence statement | OFL-1.1 |
| Virgil — https://github.com/excalidraw/virgil | history | OFL-1.1 |
| AUR ttf-excalifont — https://aur.archlinux.org/packages/ttf-excalifont | licence cross-check (OFL-1.1-no-RFN) | – |
| tldraw "Engineering imperfection with draw shapes" — https://tldraw.dev/blog/engineering-imperfection-with-draw-shapes | deterministic wobble, 2 passes | – |
| tldraw draw style / font docs — https://tldraw.dev/sdk-features/styles · https://tldraw.dev/sdk-features/draw-shape | draw font, freehand | – |
| Shantell Sans — https://github.com/arrowtype/shantell-sans · https://shantellsans.com/process | INFM/BNCE axes | OFL-1.1 |
| Balsamiq Sans — https://balsamiq.com/givingback/opensource/font/ · https://balsamiq.com/learn/balsamiq-sans/ | wireframe font | OFL-1.1 |
| Balsamiq skins/project styles — https://balsamiq.com/wireframes/desktop/docs/skins/ · https://docs.balsamiq.com/desktop/skins | Sketch/Draft/Presentation styles | – |
| Balsamiq product page (screenshot) — https://balsamiq.com/product/ | wireframe idioms | reference only |
| Bootswatch Sketchy — https://bootswatch.com/sketchy/ · `_variables.scss`, `_bootswatch.scss` in thomaspark/bootswatch | radius values, fonts | MIT |
| PaperCSS — https://www.getpapercss.com/ · https://github.com/papercss/papercss | radius trick, palette | ISC |
| DoodleCSS — https://github.com/chr15m/doodlecss · https://chr15m.github.io/DoodleCSS/ | border-image technique, paper colours | MIT |
| rough.js — https://roughjs.com/ · https://github.com/rough-stuff/rough | offline asset generation | MIT |
| wired-elements — https://wiredjs.com/ | component look reference | MIT |
| rough-notation — https://roughnotation.com/ | annotation idiom | MIT |
| CSS-Tricks "Squigglevision" — https://css-tricks.com/?p=311126 | boil technique | – |
| Camillo Visini, "Simulating hand-drawn motion with SVG filters" — https://camillovisini.com/coding/simulating-hand-drawn-motion-with-svg-filters | boil parameters | – |
| Codrops, feTurbulence texture — https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence/ | grain, displacement | – |
| Sara Soueidan, textured text techniques — https://sarasoueidan.com/blog/textured-text-techniques/ | chalk headings | – |
| Anthony Hobday, hand-drawn borders — https://anthonyhobday.com/sideprojects/visualtechniques/techniques/borders/hand-drawn-borders.html | border approach | – |
| CSS-Tricks notebook paper — https://css-tricks.com/?p=16338 · psd-dude lined paper https://www.psd-dude.com/tutorials/css-lined-paper-background.aspx | ruled-paper recipe | – |
| Ruled paper (college ruling 7.1 mm / 32 mm margin) — https://en.wikipedia.org/wiki/Ruled_paper | proportions | CC BY-SA |
| Jekyll Blueprint theme grid tutorial — https://csswitch.github.io/jekyll-blueprint-theme/2024/01/22/css-grid-backgrounds/ | blueprint grid, corner marks | – |
| chrislemke Blueprint Technical reference — https://chrislemke.github.io/website_designs/examples/Blueprint_Technical.html | dimension lines, crop marks | – |
| MockFlow sketchy UI kit — https://mockflow.com/uikits/wireframe/sketchy-handdrawn-ui | wireframe idioms | reference |
| daisyUI "hand-drawn UI" trend — https://trends.daisyui.com/trend/hand-drawn-ui/ | trend overview | – |
| Speckyboy hand-drawn snippets — https://speckyboy.com/css-javascript-snippets-hand-drawn-elements/ | technique roundup | – |
| Doodle Icons (Khushmeen) — https://khushmeen.com/icons.html | optional icon swaps | CC0 |
| 9elements fancy border radius — https://9elements.github.io/fancy-border-radius/ | irregular radius tool | – |
| Google Fonts repo — https://github.com/google/fonts (ofl/…, apache/…) | font binaries plus licences | OFL / Apache-2.0 |
| Comic Shanns Mono — https://github.com/jesusmgg/comic-shanns-mono | mono font | MIT |

## 10. Phase-B notes / open risks
* `_root_` / `_line_` hashed classes are generic. Always anchor them under `.mx_RoomView_body` or similar.
* Ruled-line rhythm vs. variable content heights: accept drift on media tiles and re-sync with `background-attachment: local`
  per tile, not per timeline.
* Mask-image frames on > 100 visible tiles: measure. Fall back to the irregular `border-radius` (no mask) for group-layout tiles
  if FPS drops.
* Excalifont's Latin coverage is fine. CJK falls back to system fonts (Xiaolai is not bundled).
* The wireframe palette is an approximation (no official Balsamiq hex). Tune it against screenshots.
* Notebook "daylight" font swap at night may cause a reflow jump. Acceptable at the 21:00 boundary.
