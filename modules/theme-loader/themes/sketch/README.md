# sketch — hand-drawn family (10 variants)

Style guide: `docs/styleguides/sketch.md` (+ `sketch.json`). Manifest: `themes.json`.
`tools/build-json.py <repo-root>` regenerates `themes.json` and `docs/styleguides/sketch.json` from one data table.
`tools/gen-rough-assets.js <outdir>` regenerates the rough.js SVGs. It needs `npm i roughjs@4.6.6` somewhere on the
module path, and the outputs are deterministic because the seeds are fixed.

Phase-B files still to create: `shared.css`, `sketch-<variant>.css` (10), `sketch-daylight.css`, `enhance.ts`.

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
