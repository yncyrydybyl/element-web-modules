# sketch — hand-drawn family (10 variants)

Style guide: `docs/styleguides/sketch.md` (+ `sketch.json`). Manifest: `themes.json`.
`tools/build-json.py <repo-root>` regenerates `themes.json` and `docs/styleguides/sketch.json` from one data table.
`tools/gen-rough-assets.js <outdir>` regenerates the rough.js SVGs. It needs `npm i roughjs@4.6.6` somewhere on the
module path, and the outputs are deterministic because the seeds are fixed.

## Implementation (phase B)

Files: `shared.css` (primitives every variant consumes via `--sk-*` variables), one CSS per variant,
`enhance.ts`. `sketch-notebook.css` and `sketch-chalkboard.css` use the prefix
`html[data-tl-family="sketch"]:is([data-tl-theme="…"], [data-tl-theme="sketch-daylight"][data-tl-phase…])`, so the
daylight variant reuses them for its day and night phases. `sketch-daylight.css` only adds dawn, dusk and the fade.

Shared mechanics:
* **Drawn outlines** are `::after` overlays with `mask: url(frame-*.svg)`, using pre-rendered rough.js SVGs with
  non-scaling strokes. They sit on dialogs, composer, menus, toasts, code blocks and buttons (pill mask), and on bubbles
  in bubble layout (per-variant files, nth-child seeds). Avatar circles sit on the avatar *slot*, because the avatar
  clips its children.
* **Element tile variables** are defined on the tile root, so variants set `--sk-et-*` and `shared.css` maps them to
  `--event-tile-*` on `.mx_EventTile`, with Element's defaults as fallback.
* **Composer focus**: the drawn frame turns accent (`:focus-within`), plus a 2 px dashed 60 % outline on the input.
* **Send button**: Element colours it with `--cpd-color-icon-accent-tertiary`. Here it follows `--sk-accent`.
* **Enhancer**: injects the SVG filter defs (`sk-rough-*`, `sk-boil-*`, `sk-chalk`). Shows a hint annotation with a
  hand-drawn arrow above the composer (designed, notebook, daylight), only when the timeline is not scrollable and
  ≥130 px are free. Writes `data-sk-w`/`data-sk-sheet` for blueprint. Adds `html.sk-flip` (page flip) on room change
  for notebook and daylight-day. Adds `html.sk-boil` for scribble and unreadable, only when the tab is visible and
  motion isn't reduced.
* **Escape hatch** (unreadable): `.tl-ui`, `.tl-switcher`, `.tl-header-button` and `.mx_Dialog:has(.tl-ui)` are
  reset to Excalifont/Assistant: straight, unfiltered, dark on white.

### Status per variant

| variant | status | notes |
|---|---|---|
| sketch-designed | done | Excalidraw islands, Assistant chrome + Excalifont content, hachure + selection box with handles on the selected room, d-grade outlines on bubbles/code/composer, clean dialogs/menus |
| sketch-wireframe | done | Balsamiq Sans, greyscale media, X-avatars, panel strokes, light-blue selection with blue drawn frame, hatched code, yellow note tooltips/toasts |
| sketch-notebook | done | ruled paper with double red margin (`background-attachment: local`), spiral binding, index-tab room list, Caveat names, sticky-note composer, taped dialogs, graph-paper code |
| sketch-whiteboard | done | aluminium frame, ghost smudges, marker tray, sticky-note menus/tooltips/threads, magnet dialogs, own bubbles in blue marker |
| sketch-chalkboard | done | wooden frame, chalk dust overlay (screen), Cabin Sketch chalk headings (`sk-chalk` filter on headings only), chalk tray, slate dialogs, chalk hljs palette |
| sketch-blueprint | done | grid paper, title-block header (TITLE / SCALE / SHEET n OF m), panel-width dimension line, numbered parts list, crop-mark dialogs, cyanotype images, zero radius |
| sketch-napkin | done | quilted napkin + fibre, coffee rings as a multiply overlay, rotated tiles/panels, x-grade outlines, ink bleed |
| sketch-scribble | done | crooked layout, boiling outlines/icons (8 fps, only ~10 chrome elements), L-shaped cross-hatch shadows, Shantell Sans INFM/BNCE |
| sketch-unreadable | done (unreadable by design) | three illegible scripts per tile, displacement filter on text, crayon outlines, stick-figure avatars, boil; theme picker stays readable |
| sketch-daylight | done | dawn (peach sun streak), day (= notebook), dusk (desk-lamp vignette), night (= chalkboard, tokens re-set incl. font) |

### Mask-outline performance (long timeline)

Measured on the dev server in a pooled harness session (`tests/harness/lib.mjs` launch, no new devices). Showcase in
bubble layout, cloned to ~600 tiles (every tile has a masked `::after` outline), scrolled 45 px per frame for
200 frames. 6 interleaved on/off rounds, medians. The machine was loaded by other agents' browsers, so the absolute
numbers are noisy.

| variant | outlines on | outlines off | verdict |
|---|---|---|---|
| sketch-designed | 26.8 ms avg / 53 ms p95 | 20.2 ms avg / 33 ms p95 | masks cost about 6–7 ms per frame at 600 tiles. Acceptable: Element virtualises the real timeline to far fewer tiles |
| sketch-scribble | 66 ms / 135 ms | 87 ms / 157 ms | noise dominates: crooked transforms and the boil cost more than the masks |

Conclusion: masks are cheaper than SVG filters and are kept on bubbles. The level-1–4 variants put no filters on
tiles. If a weaker device stutters, the first thing to drop is the bubble-tile `::after` (one rule per variant).

## Fonts in `assets/` (all redistributable; licence texts in `licenses/`)

| file | family | licence | source | processing |
|---|---|---|---|---|
| excalifont-400.woff2 | Excalifont | OFL-1.1, no RFN; licence embedded in name table ID 13 (copied to `licenses/excalifont.OFL.txt`) | https://excalidraw.nyc3.cdn.digitaloceanspaces.com/fonts/Excalifont-Regular.woff2 (linked from https://plus.excalidraw.com/excalifont) | **unmodified** official file |
| assistant-var.woff2 | Assistant (wght 200–800) | OFL-1.1 (RFN "Source" applies only to Source Sans names) | google/fonts ofl/assistant | Latin subset |
| balsamiq-sans-{400,700,400-italic}.woff2 | Balsamiq Sans | OFL-1.1 | google/fonts ofl/balsamiqsans | Latin subset, unhinted |
| patrick-hand-400.woff2 | Patrick Hand | OFL-1.1 | google/fonts ofl/patrickhand | Latin subset, unhinted |
| caveat-var.woff2 | Caveat (wght 400–700) | OFL-1.1 | google/fonts ofl/caveat | Latin subset |
| kalam-{300,400,700}.woff2 | Kalam | OFL-1.1 | google/fonts ofl/kalam | Latin subset |
| architects-daughter-400.woff2 | Architects Daughter | OFL-1.1 | google/fonts ofl/architectsdaughter | Latin subset |
| gaegu-{400,700}.woff2 | Gaegu | OFL-1.1 | google/fonts ofl/gaegu | Latin subset (Hangul dropped) |
| cabin-sketch-{400,700}.woff2 | Cabin Sketch | OFL-1.1, **RFN "Cabin", "Cabin Sketch"** | google/fonts ofl/cabinsketch | TTF→WOFF2 re-encode only, **not subset** (stays the Original Version) |
| gochi-hand-400.woff2 | Gochi Hand | OFL-1.1, **RFN "Gochi", "Gochi Hand"** | google/fonts ofl/gochihand | TTF→WOFF2 re-encode only, **not subset** |
| shadows-into-light-two-400.woff2 | Shadows Into Light Two | OFL-1.1 | google/fonts ofl/shadowsintolighttwo | Latin subset |
| shantell-sans-var.woff2 | Shantell Sans (wght/INFM/BNCE/SPAC) | OFL-1.1 | google/fonts ofl/shantellsans (upstream arrowtype/shantell-sans 1.011) | Latin subset, axes kept |
| reenie-beanie-400.woff2 | Reenie Beanie | OFL-1.1 | google/fonts ofl/reeniebeanie | Latin subset |
| zeyada-400.woff2 | Zeyada | OFL-1.1 | google/fonts ofl/zeyada | Latin subset |
| la-belle-aurore-400.woff2 | La Belle Aurore | OFL-1.1 | google/fonts ofl/labelleaurore | Latin subset |
| permanent-marker-400.woff2 | Permanent Marker | Apache-2.0 | google/fonts apache/permanentmarker | Latin subset |
| rock-salt-400.woff2 | Rock Salt | Apache-2.0 | google/fonts apache/rocksalt | Latin subset |
| comic-shanns-mono-400.woff2 | Comic Shanns Mono | MIT | https://github.com/jesusmgg/comic-shanns-mono v1.3.0 | Latin subset |

Subset range: U+0000-024F, 0259, 02B0-036F, 1E00-1EFF, 2000-206F, 20A0-20CF, 2100-215F, 2190-23FF, 25A0-27BF, FB01-FB02.
For CJK, Greek and Cyrillic, Excalifont (unsubset) covers Greek and Cyrillic, and system fonts are the fallback otherwise.
The OFL fonts that were subset keep their original names. None of them declares a Reserved Font Name. RFN fonts were
not modified.

Considered and **not bundled**: Virgil (superseded by Excalifont), xkcd Script (CC BY-NC 3.0: non-commercial),
Neucha (not needed), Xiaolai (Excalidraw CJK, too large), Doodle Icons by Khushmeen (CC0, but download is gumroad-only;
optional in phase B).

## Images in `assets/` (our own work, repo licence)

Generated with rough.js 4.6.6 (MIT, used as a build tool only, so nothing is shipped) by `tools/gen-rough-assets.js`:
* `frame-{d,s,x}{1,2,3}.svg`: rectangle outlines, grade d = designed (roughness 0.6, 1 pass), s = sketch (1.2, 2 passes),
  x = scribble (2.6). `preserveAspectRatio="none"` plus `vector-effect="non-scaling-stroke"`, so the stroke stays 2 px when
  stretched. Use them as `mask` on a `::before` with `background: currentColor` (any colour).
* `pill-s{1,2}.svg` (buttons), `circle-{1,2,3}.svg` (badges, avatars, focus), `underline-{1,2,3}.svg`.
* `hachure.svg`, `hachure-dense.svg`, `crosshatch.svg`: 40×40 tiles.
* `arrow-right.svg` (hints, day separators), `send-circled.svg`, `check.svg`, `scribble-out.svg`, `coffee-ring.svg`.

Hand-written SVG textures (feTurbulence in an image context): `paper-grain.svg`, `grain-dark.svg`, `napkin-fibre.svg`,
`chalk-dust.svg`, `whiteboard-ghost.svg`. `wobble-filters.svg` is the reference copy of the filter `<defs>` that
`enhance.ts` injects, because `filter:url(file#id)` is unreliable cross-browser.

## Reference screenshots (not shipped)

`docs/styleguides/refs/sketch/`: excalidraw-app.png, bootswatch-sketchy.png, papercss.png, doodlecss.png, wiredjs.png,
roughnotation.png, balsamiq-product.jpg. Captured 2026-11-15 for internal reference only. They are third-party
pages, so do not redistribute them.

## Known gaps / notes for phase B

* Generic hashed classes `_root_` and `_line_` (EventTileView.module.css) must be anchored under `mx_` ancestors.
* Mask frames on many tiles: measure FPS, and fall back to the irregular `border-radius` for group-layout tiles.
* The wireframe palette is an approximation (Balsamiq publishes no hex values).
* The unreadable escape hatch depends on the loader exposing a stable class or attribute on the theme picker. Coordinate with the loader.

## Edge-case results (phase B, 2026-11-15)

`tests/reports/sketch-<id>.md`: every variant **passes** edgecheck (no overflow, no missing essentials, no page
errors). The 4 console errors are Element's own (`map_style_url` missing, rust crypto store warning), the same for every theme.

| check | result |
|---|---|
| contrast (usable variants) | Fixed after the first run: decorative username colours (designed, notebook, napkin, scribble darkened to ≥4.5:1), chalkboard badge text, whiteboard sticky-note names, blueprint/napkin grey ramps, home-page CTA text. Left: Element's own `nested-interactive` / `scrollable-region-focusable` axe findings (not theme-related). sketch-unreadable fails contrast by design (report-only). |
| focus | Visible on every stop. The composer gets a dashed accent outline plus an accent frame (the first run flagged the composer as invisible: fixed). |
| modals, menus, tooltips | Themed per variant (taped page, sticky notes, slate, drawing sheet, napkin, crayon). Checked in 11/12/16/17. |
| settings + Themes tab | Readable in all variants. In sketch-unreadable the `.tl-ui` dialog is reset (escape hatch, see 15-settings-themes). |
| login | The box is themed. The full-page background image comes from Element config and stays. |
| mobile 390 px | Fine. Whiteboard/chalkboard frames shrink to 4–5 px below 600 px. |
| threads, code, polls, E2EE shields, unread badges | Fine. Code keeps Comic Shanns Mono and gets per-variant blocks (graph paper, slate, grid, hatch). Badges follow the accent with on-solid text. |
| very long names / RTL | Truncation intact (20-long-names-rtl). Mixed RTL bodies render in the handwriting fonts (system fallback for Hebrew/Arabic glyphs). |
| reduced motion | Boil, jitter, page flip, dust fade and wobble are all off under `prefers-reduced-motion: reduce` (shared kill switch, plus the enhancer never sets `sk-boil`). |
| daylight | All 4 phases shot (`recordings/screens/sketch-daylight--<phase>/`). Night re-sets the chalk tokens including the font token. |

Known gaps:
* Element's light/dark iframes (calls, widgets) are not themed (only the frame around them).
* Sender names in group layout are not physically moved into the notebook margin (layout risk). They are styled as
  Caveat margin notes in place.
* Harness note: `03-timeline-content` scrolls with `block: 'start'`, which can scroll Element's overflow-hidden app
  root by ~70 px when the target tile is near the bottom. This is a harness artefact and happens in every theme.
* Scribble/unreadable tiles overlap by design. The hovered or focused tile is raised (`z-index`), so reactions and
  thread summaries stay clickable.
