# Enlightenment — style guide (`enlightenment`, 8 variants)

> Phase A design document. The machine-readable version is `enlightenment.json`, and the manifest is
> `themes/enlightenment/themes.json`. Asset licences are listed in `themes/enlightenment/README.md`. Target: Element Web 1.12.33.

## 1. Concept

Enlightenment has always treated the window manager as an art object. E16 had pixmap borders, bevels, brushed metal and pagers.
E17/Edje had glossy gradients, the electric-blue `#3399FF` glow, the shelf and the Ibar. Current E is a flat, dense
graphite theme that still uses the same blue. This family turns Element into an E desktop:

- **Every major Element panel is an E window**: the room view, the left panel, the right panel and dialogs each get a title bar and a border.
- **The space panel is the shelf, pager or Ibar.** In E16 it is the pager with mini desktops. From E17 on it is a glossy shelf with magnifying icons.
- **The composer is the bottom shelf.**
- **Selection is light.** E17 and later show it as a glowing blue bar or halo. E16 shows it as a turquoise "sticky" tint.

The window chrome is drawn with CSS (pseudo-elements, gradients and small SVGs). Nothing is moved in React's DOM.

## 2. The stage axis

```
            past                   pure                         usable
  e16-brushed-metal ── e17-glow ── e-current ── e-daylight ── e-usable
   (1999 pixmaps)      (2012 gloss)  (today, flat)  (clock cycle)   (tuned for chat)
                              │
                              └── exciting mashups ("really nice dark, coloured"):
                                    e-aurora (cool, hype 8) · e-ember (warm, hype 8) · e-neon-steel (neon, hype 9)
```

| id | stage | mode | S | H | one line |
|---|---|---|---|---|---|
| e16-brushed-metal | past | dark | 6 | 6 | brushed aluminium frames, bronze gems, turquoise desktop |
| e17-glow | pure | dark | 7 | 7 | E17 0.17 dark theme: charcoal gloss, black wells, `#3399FF` glow |
| e-current | pure | dark | 8 | 5 | current E palette from `colorclasses.edc`: flat greys, thin blue lines |
| e-aurora | exciting | dark | 6 | 8 | E17 glass over a slow teal→cyan→violet→magenta aurora |
| e-ember | exciting | dark | 6 | 8 | charcoal + brushed copper + Tigert gems + ember `#FF9933` glow |
| e-neon-steel | exciting | dark | 5 | 9 | BlueSteel slate + Ganymede cobalt bevels + cyan/magenta neon |
| e-usable | usable | dark | 9 | 4 | E-current greys with real contrast, solid focus rings and calm motion |
| e-daylight | pure | daylight | 7 | 7 | dawn aurora (light) → steel day (light) → ember dusk (dark) → blue-glow night (dark) |

**Catalogue changes:** none. The ids, count, stages, modes and S/H values are unchanged. The display names were refined:
`E16 · BrushedMetal-Tigert`, `E17 · Dark Glow`, `Enlightenment · Current`, `Edje Aurora`, `Moksha Ember`,
`Ganymede Neon Steel`, `Enlightenment · Usable`, `Enlightenment · Aurora Cycle`. The ideas were corrected after source research
(see §9): e16 now uses Tigert's real *turquoise* accent, neon-steel uses the real BlueSteel/Ganymede colours, and ember no
longer claims to be based on Radiance.

## 3. Shared structure (all variants)

| Element region | E metaphor | Main selectors (1.12.33) |
|---|---|---|
| shell | desktop wallpaper visible in gaps between "windows" | `.mx_MatrixChat`, `.mx_MatrixChat_wrapper`, `.mx_LeftPanel_outerWrapper`, `.mx_RoomView_wrapper` |
| spaces | E16 pager / E17 shelf + Ibar | `.mx_SpacePanel`, `.mx_SpaceButton`, `.mx_SpaceItem`, `.mx_QuickSettingsButton` |
| roomlist | Everything launcher list / E16 menu | `.mx_RoomListPanel`, `.mx_RoomListItemView(_selected)`, `[class*="_roomListItem_"]`, `[role="option"][aria-selected]` |
| header | window title bar + decorative button trio (`::after`, `aria-hidden` by construction since pseudo-elements carry no content for AT) | `.mx_RoomHeader`, `.mx_RoomHeader_heading` |
| timeline | window body | `.mx_RoomView_body`, `.mx_RoomView_timeline`, `.mx_EventTile`, `[class*="_stateOwnEvent_"]`, `[class*="_stateHighlighted_"]` |
| composer | bottom shelf | `.mx_MessageComposer`, `.mx_BasicMessageComposer_input`, `.mx_WysiwygComposer_Editor` |
| rightpanel | second window | `.mx_RightPanel`, `.mx_BaseCard` |
| dialogs | floating E window, compositor zoom-in | `.mx_Dialog`, `.mx_Dialog_header`, `.mx_Dialog_background`, `[role="dialog"]` |
| menus | E menu (glass, glow row) | `.mx_ContextualMenu`, `.mx_IconizedContextMenu`, `[role="menu"]`, `[role="tooltip"]` |
| badges | Ibar pulse / gel orb | `[class*="_notificationBadge_"]`, `[class*="cpd-theme-"]` token re-declaration |

Implementation pattern:

1. Tokens (`themes.json` → `tokens`) cover about 80% of the UI.
2. `shared.css` holds family mixins as custom properties: `--e-bar`, `--e-well`, `--e-glow`, `--e-bevel-out`, `--e-bevel-in` and `--e-title-h`. Each variant only redefines their values.
3. Each `<variant>.css` adds the region decorations.
4. In e16, the light-metal chrome re-declares `--cpd-color-text-primary`/`-secondary`/`icon-*` on `.mx_LeftPanel`, `.mx_RoomHeader`, `.mx_MessageComposer`, `.mx_RightPanel` and `.mx_Dialog`. That turns the chrome black-on-metal while the timeline stays white-on-teal.

## 4. Typography

| variant | UI | display | mono | source of truth |
|---|---|---|---|---|
| e16-brushed-metal | Lucida (local) → **DejaVu Sans** 13px | Lucida/DejaVu Bold; **Silkscreen** micro-labels | DejaVu Sans Mono | `fonts.theme.cfg`: X11 `-*-lucida-{medium,bold}-r-normal-*-100-*` |
| e17-glow, e-current, e-usable | **DejaVu Sans** | DejaVu Sans Bold | DejaVu Sans Mono | EFL `fonts.edc`: `FN "Sans"`, which resolves to DejaVu Sans on most distros |
| e-aurora | **Titillium Web** 400/600 | Titillium Web 700 | DejaVu Sans Mono | mashup |
| e-ember | DejaVu Sans | **Saira Semi Condensed** 500/700, uppercase labels | DejaVu Sans Mono | mashup |
| e-neon-steel | **IBM Plex Sans** 400/600 | **Exo 2** 500/700 | **Share Tech Mono** | mashup |
| e-daylight | DejaVu Sans | Titillium Web 600/700 | DejaVu Sans Mono | mashup |

Rules:

- Font tokens are set with `!important` on `:root, [class*="cpd-theme-"]`, because FontWatcher writes them inline.
- Text glow (`text-shadow` blur) is only allowed at ≥14px bold, such as selected room names and title bars. It is never used on message bodies.
- Pixel and micro fonts (Silkscreen) are decorative only and never smaller than 10px.

## 5. Iconography

- Compound icons stay (inline `currentColor` SVG) and are recoloured per variant. On hover/active in the glow variants they get `filter: drop-shadow(0 0 3px <accent>)`, applied to the button and not to the timeline.
- Own SVGs:
  - `e16-btn-{menu,min,max,close}.svg` (Tigert bronze gems) for e16 and e-ember.
  - `e-glyph-{min,max,close}.svg` as `mask-image` glyphs for e17-glow, e-current, e-aurora, e-neon-steel and e-daylight.
  - `e-logo.svg` (mask, tinted) for auth, the space-panel home and the gallery.
  - `e17-logo-blue-glow.png` for e17-glow auth.
- The header button trio is purely decorative: a `::after` on `.mx_RoomHeader`, `pointer-events: none`. Real header buttons stay Element's.

## 6. Motion

| effect | variants | spec | reduced motion |
|---|---|---|---|
| E17 pulse (badge ring) | e17-glow, e-aurora, e-ember (amber), e-daylight night | `box-shadow` 0→14px, 1.4 s, **3 iterations** | off |
| compositor zoom-in | e17-glow, e-aurora, e-ember, e-current (fade only) | dialog scale .92→1 + opacity, 150 ms | off |
| window shade | e16 | dialog close scaleY 1→0 from the top, 120 ms | off |
| aurora drift | e-aurora (+ dawn phase) | `background-position` loop 30 s on shell/shelves only | static gradient |
| neon flicker | e-neon-steel | 2-frame opacity flicker on dialog open | off |
| Ibar magnify | e17-glow, e-aurora | space icon scale 1.25, neighbours 1.1 via `:has()`, 120 ms | no scale |
| phase cross-fade | e-daylight | 2 s `background-color`/`color` transitions (CONTRACT §6) | instant |

## 7. Accessibility stance

- **Focus**: every variant draws a **solid** 2px ring of ≥3:1 against its background. The glow is extra and never the only signal (dossier §3.6, WCAG 1.4.11). On e16's light metal the ring is 2px dotted black; on teal it is solid `#88DDDD`.
- **Contrast**: all palettes were checked with `tools/contrast.py`. Text on bg is ≥9:1, muted on bg is ≥5:1, and accent on bg is ≥4.5:1 in every variant and phase. The exceptions:
  - e-current's muted text is #B0B0B0 instead of E's #A8A8A8, because #A8A8A8 only reaches 4.36:1 on #404040 dialogs (edgecheck finding).
  - Dark 1px "outline" borders are intentionally low-contrast on dark grounds, as in E. Controls are then identified by fill and inner highlight, plus the focus ring.
  - e16 chrome uses black text on `#C8C8C6` metal (12.5:1). Teal `#1D5A5A` used as text on metal reaches 4.7:1.
- **Textures** under text stay at ≤6% opacity, or there is no texture at all (timeline is always solid apart from e16's 6% desktop grain).
- **Reduced motion** kills all animations and transitions (shared kill switch in `shared.css`).
- **`forced-colors: active`** drops gradients, textures and glows and keeps the borders.
- **Usable stage**: no pulses, no text glow, 36–40px hit targets, Element affordances (threads, E2EE shields, receipts) left prominent.

## 8. What cannot be themed → workaround

| limit | workaround |
|---|---|
| Element Call / Jitsi / widget iframes are light/dark only | frame them in the variant's window border. e-daylight follows `data-tl-base` (light dawn/day, dark dusk/night) |
| Compound icons cannot be swapped wholesale for E bitmaps | recolour + glow. Only the decorative title glyphs and the logo are ours |
| No real WM behaviour (shading, flip desktops, drag gadgets) | CSS imitations on dialogs/menus only. The enhancer adds just a clock gadget |
| Notification badges force `cpd-theme-light` | tokens on `[class*="cpd-theme-"]` + direct `[class*="_notificationBadge_"]` rules |
| Avatar pixels, emoji, effects canvas, maps, pre-module spinner | frames/rings only |
| Lucida is proprietary | `local()` first, DejaVu Sans bundled |
| Hashed CSS-module classes (tiles, room list, badges) | `[class*="_local_"]` substring selectors only, version shim per research §3.2 |
| Performance: glow on every tile is too expensive | glow restricted to selection, focus, header, composer and badges. Tiles stay flat |

## 9. Research notes and verified values

The dossier's hex values were estimates. They were checked against the primary sources (cloned on 2026-11-15) and the
pixel values were sampled with `tools/sample.py`:

- **E-current**, from EFL `data/elementary/themes/colorclasses.edc` (master):
  - Greys: `:bg #404040`, `:bg-alt #383838`, `:bg-dim #303030`, `:bg-dark #202020`, `:bg-dark-alt #1C1C1C`, `:bg-darkest #101010`.
  - Foregrounds: `:fg #A0A0A0`, `:fg-high #C8C8C8`, `:fg-higher #DCDCDC`.
  - Accents: `:selected #3399FF`, `:selected-alt #FF9933`, `:selected2 #99FF33`, `:selected3 #FF3399`, `:selected4 #FF3333`, `:selected5 #9933FF`, `:selected6 #33FF99`.
  - Syntax colours: keyword `#FF9999`, string `#33FF99`, comment `#339999`, number `#DCDC30`, class `#77AADD`, function `#9933FF`.
  - These are used verbatim for the code highlighting of the E variants.
  - The 2021 E screenshots on enlightenment.org (raster's desktop) confirm the flat `#202020` title bars, the `#404040`/`#303030` bodies and the thin blue scroll/tab bars.
- **E17**, from Enlightenment v0.17.6 `data/themes/img`:
  - `vgrad_med_dark` runs #303030→#111111, `vgrad_med` runs #606060→#313131, and `menu_sel_bg` is a black well #000→#3D3D3D.
  - `bg_radgrad` runs #545354→#1C1D1D.
  - All glow sprites (`glow_small`, `outline_glow`, `runner_glow_horiz`, `win_glow`) are **#3399FF**.
- **E16 Tigert**, from e16-themes `BrushedMetal-Tigert` pixmaps:
  - Title bars: active title #A7A7A6, inactive #767675, sticky turquoise #93B0AE.
  - Bronze gems: #927C64/#A99682.
  - Backgrounds: brushed metal averages #C8C8C6, turquoise desktop #3C5A5A, about/Edoc page #346F6E with link colour `#88dddd`.
  - Fonts are X11 Lucida.
  - Correction: the theme is not blue-tinted grey.
- **BlueSteel** is a dark slate (#2D3243/#41475A). **Ganymede** is indigo #2B2B6A with cobalt bevels #3263E5/#0B1B5A, plus green/rose border variants. The dossier's descriptions of both were wrong.
- **Moksha Radiance** (JeffHoogland/MokshaRadiance `rad_conf.edc`) is a light theme: #F2F1F0 / #DFDFDF / selected #737C99. The ember mashup is therefore built from E's own `#FF9933` and `:light-glow #FFDCA0` plus Tigert's bronze, not from Radiance.

Reference screenshots:

- E-current: https://www.enlightenment.org/_media/aa/shot-2021-12-13_17-49-55.png (and the sibling `17-47-19`, `17-52-28`).
- E17 and E16 artwork: inspected directly from the theme pixmaps. No stable public screenshot URL for E16 was found, because enlightenment.org's old `/ss/` gallery returns HTML.
- Radiance screenshot: linked from the MokshaRadiance README (`enlightenment.org/ss/e-55b1b8719f2c70.68178781.jpg`). It no longer resolves.

## 10. Enhancer plan (`enhance.ts`, one per family)

- **Shelf clock gadget** (mounted into `ctx.root`, positioned over the space panel's bottom edge, `aria-hidden`, `pointer-events: none`):
  - analog with glowing hands: e17-glow, e-aurora (gradient hands)
  - digital thin digits: e-current, e-neon-steel (Share Tech Mono)
  - flip: e-ember
  - E16 Epplet E-Clock in a metal bezel: e16
  - phase face: e-daylight
- The clock ticks once per second, pauses on `visibilitychange`, and is removed in `unmount()`.
- **e16 focus tracking**: a `focusin` listener sets `data-tl-e16-active` on the panel that contains focus (left panel, room view, right panel, dialog), so that panel's title bar renders "active" (#A7A7A6) and the others render inactive (#767675). It only adds attributes and never moves nodes.
- **e-daylight**: `onPhase()` switches the clock face. All colours come from CSS on `data-tl-phase`.
- **e-usable**: no enhancer.

## 11. Phase-B notes

- Build order: e-current (tokens only + bars) → e-usable → e17-glow (gloss + glow mixins) → aurora/ember/neon (reuse the mixins) → e16 (heaviest: split light/dark token scopes) → e-daylight (four token sets keyed on `data-tl-phase`).
- Check the new room list's hashed classes (`_roomListItem_`) and badge classes against `v1.12.33` before writing selectors.
- e16 risk: re-declaring text/icon tokens on the metal regions must also cover portals (menus/tooltips open from the left panel render in `body`). Menus are therefore styled metal globally, with black text.
- Clip-path chamfers (neon-steel) must not clip focus rings. Put the ring on an inner element or use `outline-offset: -2px`.

## 12. Per-variant specs

Palettes are hex values. `text`/`muted` refer to the timeline. For e16 the chrome text is `#000000` on `surface`/`sidebar` metal.
Full region phrases are listed below and repeated in `enlightenment.json`.
