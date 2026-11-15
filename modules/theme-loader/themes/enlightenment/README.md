# Enlightenment family (`enlightenment`)

There are 8 variants: `e16-brushed-metal`, `e17-glow`, `e-current`, `e-aurora`, `e-ember`, `e-neon-steel`, `e-usable` and `e-daylight`.
Design intent is in `docs/styleguides/enlightenment.md`, and the gallery data is in `docs/styleguides/enlightenment.json`.

Phase A status: the manifest, assets and style guide are done. The CSS and `enhance.ts` follow in phase B, which writes the `css` files listed in `themes.json`.

## Regenerating

- `tools/palettes.json` is the single source for all palettes, including the four daylight phases.
- `python3 -I tools/contrast.py tools/palettes.json` checks the WCAG ratios.
- `python3 -I tools/gen_styleguide.py tools/palettes.json <repo-root>` rewrites the styleguide JSON and `themes.json`.
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
