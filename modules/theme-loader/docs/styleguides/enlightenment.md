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


### E16 · BrushedMetal-Tigert — `e16-brushed-metal`

*1999's default E16 theme: brushed aluminium window frames on a deep turquoise desktop.*

- **Stage/mode:** past · dark · S6 H6 · difficulty hard
- **Palette:** `bg` #1F4746 `surface` #C8C8C6 `sidebar` #C8C8C6 `rail` #A7A7A6 `text` #FFFFFF `muted` #C4E0DE `accent` #88DDDD `onAccent` #0E2A2A `border` #121212 `own` #2C6563 `other` #26504F `critical` #FF8A7A `success` #9BE36B
- **Fonts:** UI Lucida Grande / Lucida Sans (local) → DejaVu Sans, 13px; bold for titles; display Lucida bold → DejaVu Sans Bold (title bars); Silkscreen for pager/iconbox micro-labels; mono DejaVu Sans Mono
- **Shape:** radius 0px (2px on gem buttons only); border bevel; shadow none; 1px #FEFEFE inner top highlight + 1px #121212 outline (E16 border pixmaps); density compact
- **Texture:** brushed-metal (self-made brushed-aluminium.png, Tigert light_brushed.png optional) + turquoise desktop (tigert-turquoise-bg.jpg / CSS gradient #1D5A5A→#346F6E)
- **Motion:** Almost none, like 1999: instant hover swaps (pressed = inverted bevel), window-shade roll-up animation (120 ms scaleY) on dialogs closing; disabled under reduced motion.
- **Signature moves:**
  1. Every panel is an E16 window: 4px aluminium frame, 19–23px title bar with Tigert bronze gem buttons (menu left, min/max/close right)
  2. Turquoise desktop (#1D5A5A→#346F6E vertical gradient, like dark_vertical_gradient_brushed.png) behind the timeline with white text and #88DDDD links (Edoc help colours)
  3. Active title bar #A7A7A6 aluminium with black bold title, inactive/unfocused panels drop to #767675
  4. Sticky/selected rows in Tigert's turquoise sticky-title tint (#93B0AE, text #000)
  5. Space panel as E16 pager: tiny square 'desktops' with teal windows (#1D3F3F) in a metal frame, Silkscreen labels
- **Enhancer:** Optional: E16 'Epplet' clock (E-Clock style analog face in metal bezel) mounted in the space-panel footer; adds data-tl-e16-focus to the panel that holds keyboard focus so its title bar turns 'active' (#A7A7A6) while the others go inactive (#767675).

| region | treatment |
|---|---|
| shell | teal desktop gradient fills the window; left/right panels and room view are framed as separate E16 windows with 4px metal borders and a 2px gap of desktop between them |
| spaces | E16 pager: metal column, each space a 36px bevelled square with teal 'desktop' inside and avatar as mini window; active = white 2px p_sel frame |
| roomlist | light brushed aluminium, black Lucida text, 1px etched separators (#8E9398 / #FEFEFE pair); selected row = turquoise sticky tint #93B0AE with black text; hover = lighter #D9DCDE |
| header | E16 title bar: #A7A7A6 metal gradient (#FEFEFE top line, #4B4C4A/#121212 bottom), bold black centred room name, decorative gem trio right + menu gem left (aria-hidden) |
| timeline | deep teal (#1F4746) panel with subtle desktop texture at 6%, white text, own messages #2C6563 inset wells, others #26504F; read marker = 1px #88DDDD |
| names-avatars | avatars square (radius 0) with 1px black outline + white inner bevel; usernames bright pastel decoratives (cyan/sand/lilac) tuned for teal |
| composer | metal bar like the E16 iconbox: aluminium with an inset (bevel-in) white-ish entry field #EDEEEE, black text; send = gem button |
| rightpanel | second E16 window: metal frame and title bar, inner content on light metal (#D9DCDE) with black text |
| buttons | raised bevel: #CFD3D6→#8E9398 gradient, 1px #2B2F33 outline, inset 1px #F1F3F4 / -1px #5A5F64; pressed inverts; primary gets teal face (#9BB9B7, Tigert dialog button1) |
| inputs | sunken bevel (#5A5F64 top-left, #F1F3F4 bottom-right), white field, black text, teal caret |
| dialogs | E16 dialog window: metal title bar with gem buttons, body light_brushed aluminium, teal-faced primary buttons; backdrop = teal at 60% |
| menus | E16 menu style: metal panel, 1px black outline, highlighted item = teal #346F6E with white text; tooltips = pale yellowish metal (#E7E3D2) with black text, square |
| settings | dialog chrome as above; tab list as metal toolbar with bevelled tab buttons; panels on #D9DCDE with black text |
| auth | teal desktop full-bleed with Tigert 'Brushed Metal' title image and a centred E16 window for the form |
| scrollbars | 14px metal trough (sunken) with bevelled aluminium thumb carrying 3 etched grip lines; no arrows |
| focus | 2px dotted #000 outline on metal, 2px solid #88DDDD outline on teal (both ≥3:1), offset 1px |
| badges | square bevel pills: count = black on #C8C8C6 with 1px outline; mention = white on #A0281E bevel |
| code | Eterm-style #0E2A2A panel, #CFE3E2 text, DejaVu Sans Mono, hljs keywords #88DDDD, strings #D9C08A, comments #7FA3A1 |
| iframes | Element dark; framed by a 4px metal border + title bar strip |
| icons | icons black (#1A1A1A) on metal, #CFE3E2 on teal; no glow |
| motion | no transitions except shade roll-up on close and 80 ms bevel press |


### E17 · Dark Glow — `e17-glow`

*Raster's 2012 E17 dark theme: glossy charcoal gradients and the electric-blue #3399FF glow.*

- **Stage/mode:** pure · dark · S7 H7 · difficulty medium
- **Palette:** `bg` #262626 `surface` #333333 `sidebar` #202020 `rail` #161616 `text` #E6E6E6 `muted` #A0A0A0 `accent` #3399FF `onAccent` #06192C `border` #0E0E0E `own` #24303D `other` #2E2E2E `critical` #FF5A4F `success` #66DD55
- **Fonts:** UI DejaVu Sans (E 'Sans'), 13px; display DejaVu Sans Bold with soft dark text shadow; mono DejaVu Sans Mono
- **Shape:** radius 3px (bars), 4px (buttons), 50% gel orbs; border glow; shadow 0 1px #000 outline + inset 0 1px rgba(255,255,255,.07); glow = 0 0 6px 1px rgba(51,153,255,.85), 0 0 18px 4px rgba(51,153,255,.35); density normal
- **Texture:** glossy (vgrad gradients + 5px shine strip), radial desktop wallpaper #545354→#1C1D1D
- **Motion:** E17 pulse: unread/mention badges ring-pulse 3× (1.4 s), hover glow fades in 150 ms, dialogs zoom .92→1 + fade 150 ms; all off under reduced motion.
- **Signature moves:**
  1. Every bar is the E17 vgrad: #303030→#111111 with a 1px white-7% top line and a thin white 'shine' highlight
  2. Selections are black recessed wells (menu_sel_bg #000→#3D3D3D) with a #3399FF glow bar on the left and glowing white text
  3. The space panel is the shelf/Ibar: glossy dark glass, icons magnify on hover, active space with blue glow dot
  4. Radial charcoal desktop (bg_radgrad) visible around floating panels
  5. Glowing blue focus halos everywhere instead of plain outlines (always paired with a 2px solid ring)
- **Enhancer:** Analog clock gadget (conic face, glowing blue hands, 1 Hz tick) docked at the bottom of the space panel like an E17 shelf gadget; paused when the tab is hidden.

| region | treatment |
|---|---|
| shell | radial wallpaper #545354 centre → #1C1D1D edges; panels float with 4px gaps and 0 2px 8px black shadows |
| spaces | vertical E17 shelf: glossy #303030→#111111 glass, Ibar icons scale 1.25 on hover (neighbours 1.1 via :has), active space = blue glow dot + ring |
| roomlist | Everything-launcher list on #202020: 1px separators #0E0E0E + rgba(255,255,255,.04); selected = black well with left #3399FF glow bar and white text glow (≥14px bold only) |
| header | E17 window border title: vgrad_med_dark gradient, white bold title with 1px black shadow, glowing min/max/close glyphs right (decorative) |
| timeline | #262626 panel, tiles flat (no per-tile effects), unread marker = horizontal glow bar (horizontal_separated_bar_glow) |
| names-avatars | avatars round gel orbs with 1px black ring + white 25% top sheen; usernames bright decoratives (#66B8FF, #FF9933, #99FF33, #FF3399, #9933FF, #33FF99 = E selected1–6) |
| composer | shelf look: glossy dark gradient bar, recessed #161616 entry well with inner shadow, send button = blue gel orb |
| rightpanel | #2A2A2A raised panel with the same title-bar header, cards in recessed wells |
| buttons | vgrad_med #606060→#313131 glossy buttons, 1px black outline, white text; hover adds outer blue glow; primary = blue gel (#66B8FF→#0A4D99) with white text |
| inputs | recessed #161616 wells, inset 0 1px 3px #000, focus = blue glow + 2px #3399FF ring |
| dialogs | floating E17 window: title-bar gradient, #2E2E2E body, big soft shadow (win_shadow), zoom-in 150 ms |
| menus | dark glass #202020 at 96%, 1px black border, selected row = black well + glow bar + white text; tooltips = small dark glass with blue 1px top line |
| settings | E17 config dialog: icon list on the left (tab labels) with glow selection, panels in recessed frames |
| auth | radial wallpaper, centred E17 window with the glowing E logo (e17-logo-blue-glow.png) above the form |
| scrollbars | thin recessed runner #101010 with glossy grey knob; hover/drag = blue glow runner (runner_glow) |
| focus | 2px solid #3399FF ring + outer 6px glow; never glow alone |
| badges | count = dark gel with white text; mention/highlight = blue gel #3399FF with dark text + pulse (3×) |
| code | recessed #161616 well, DejaVu Sans Mono, hljs mapped to E syntax colourclasses (keyword #FF9999, string #33FF99, comment #339999, number #DCDC30, class #77AADD, function #9933FF→#B57BFF) |
| iframes | Element dark inside an E17 border frame |
| icons | icons #C8C8C8; hover/active = #FFFFFF with drop-shadow(0 0 3px #3399FF) |
| motion | pulse, glow fade 150 ms, dialog zoom 150 ms; off under reduced motion |


### Enlightenment · Current — `e-current`

*Today's flat Enlightenment theme: #202020 title bars, #404040 bodies, thin #3399FF accent lines.*

- **Stage/mode:** pure · dark · S8 H5 · difficulty easy
- **Palette:** `bg` #303030 `surface` #404040 `sidebar` #383838 `rail` #202020 `text` #DCDCDC `muted` #B0B0B0 `accent` #3399FF `onAccent` #101010 `border` #101010 `own` #2C3846 `other` #3A3A3A `critical` #FF6B6B `success` #33FF33
- **Fonts:** UI DejaVu Sans (E 'Sans'), 13px; display DejaVu Sans Bold 13px titles; shelf clock digits in DejaVu Sans with wide letter-spacing (E uses a thin face; not bundled); mono DejaVu Sans Mono
- **Shape:** radius 0px (2px on small controls); border hairline; shadow windows: 0 2px 12px rgba(0,0,0,.5); no gloss; density compact
- **Texture:** none (flat); optional faint diagonal desktop shapes (CSS gradients) as in the 0.25 default wallpaper
- **Motion:** Short 100 ms fades; selection underline slides; no glow pulses.
- **Signature moves:**
  1. Title bars #202020 with centred white bold title and small chevron/close glyphs
  2. Selection shown as a 3px #3399FF line (under active tabs, beside selected rows, scrollbar thumb is a thin blue bar)
  3. Bottom shelf look for the composer: #202020 strip, icons grey, active item underlined blue
  4. Orange #FF9933 for warnings/highlights, red #FF3333-ish for errors, lime #33FF33 for success (E palette)
  5. Dense small DejaVu Sans text, everything square
- **Enhancer:** Digital shelf clock (thin '05:49 PM' digits like the E clock gadget) at the bottom of the space panel; shared with the e17-glow analog clock code.

| region | treatment |
|---|---|
| shell | #2A2D33-ish desktop with dark diagonal facets behind the panels (CSS), panels butt together with 1px #101010 lines |
| spaces | #1C1C1C shelf column, icons 32px, active space underlined (left bar) 3px #3399FF |
| roomlist | #383838 list, rows 30px, selected = #303030 with 3px #3399FF left bar and white text, hover #404040 |
| header | #202020 title bar, bold #FFFFFF title centred, chevron down/up + close glyph trio right (decorative) |
| timeline | #303030 document area (like ecrire), text #DCDCDC, own messages #2C3846 tint, highlight row = #FF9933 left bar |
| names-avatars | square avatars radius 2px; usernames from E palette (#66B8FF, #FF9933, #99FF33, #FF66B3, #B57BFF, #33FF99) |
| composer | #202020 shelf strip, #303030 entry with 1px #101010 border, focus = 1px #3399FF border + 2px outline |
| rightpanel | #404040 panel, section headers #DCDCDC bold, separators #505050 |
| buttons | #606060 flat buttons with #DCDCDC text, pressed #505050, primary = #3399FF fill with #101010 text |
| inputs | #303030 fields, 1px #101010, focus blue border |
| dialogs | #404040 window, #202020 title bar, shadow 0 2px 12px #000 |
| menus | #303030 popup, selected row #3399FF at 25% with white text + left blue bar; tooltips #202020 with #C8C8C8 text |
| settings | flat #404040, tab labels as list with blue left bar on active |
| auth | desktop facets background, centred #404040 window with the E logo (e-logo.svg tinted #DCDCDC) |
| scrollbars | 8px, track transparent, thumb #3399FF at 70% (thin blue bar like ecrire) |
| focus | 2px solid #3399FF outline, offset 1px |
| badges | count = #606060 with white; mention = #3399FF with #101010 text; highlight = #FF9933 dot |
| code | #202020 block, DejaVu Sans Mono, hljs = E syntax colourclasses (keyword #FF9999, string #33FF99, comment #339999, number #DCDC30, class #77AADD, function #B57BFF) |
| iframes | Element dark, framed by #202020 title strip |
| icons | #A0A0A0, hover #FFFFFF, active #3399FF |
| motion | 100 ms fades and underline slide; reduced motion = none |


### Edje Aurora — `e-aurora`

*E17 structure under a slow polar aurora: teal → cyan → violet → magenta glows on blue-black glass.*

- **Stage/mode:** exciting · dark · S6 H8 · difficulty medium
- **Palette:** `bg` #121418 `surface` #232832 `sidebar` #1A1D23 `rail` #0E1014 `text` #DDE3EA `muted` #8B95A5 `accent` #33A1FF `onAccent` #06121F `border` #0A0B0E `own` #1C2638 `other` #1A1D23 `critical` #FF5FC8 `success` #2EE6C5
- **Fonts:** UI Titillium Web 400/600, 14px; display Titillium Web 700 (room names, dialog titles), letter-spacing .02em; mono DejaVu Sans Mono
- **Shape:** radius 6px panels, 999px pills, 50% avatars; border glow; shadow 0 8px 24px rgba(0,0,0,.45) + inset 0 1px rgba(255,255,255,.06); glow = 0 0 14px rgba(51,161,255,.45); density normal
- **Texture:** aurora gradient field (CSS, behind shelves only) + grain.png at 6%
- **Motion:** Aurora drifts in a 30 s ease-in-out loop (background-position only) behind space panel/header/composer; hover glows 180 ms; off under reduced motion (static gradient).
- **Signature moves:**
  1. Aurora ribbon (teal→cyan→violet→magenta) visible through translucent glass header, space shelf and composer
  2. Selected room = 3px teal→violet gradient bar with soft outer glow
  3. Mentions glow magenta #FF5FC8, focus glows cyan #33A1FF
  4. 50/50 split gloss (4% white) on header and composer, 1px inner highlight
  5. Ibar magnification on the space shelf
- **Enhancer:** Optional: shared clock gadget (analog, aurora-gradient hands); no extra DOM otherwise (aurora is CSS).

| region | treatment |
|---|---|
| shell | #121418 night base, aurora field painted on the shell behind panels (fixed, 30 s drift), grain overlay |
| spaces | translucent glass shelf (rgba(26,29,35,.72) + backdrop blur 10px) over the aurora; icons magnify; active = teal→violet ring |
| roomlist | #1A1D23 solid panel (readability), rows with 1px #0A0B0E separators; selected = gradient bar + #232832 fill; unread names #FFFFFF bold |
| header | glass over aurora with 50/50 gloss, Titillium 700 room name, aurora-tinted glyph trio |
| timeline | solid #121418 (no aurora under text), own messages #1C2638 with 1px cyan 20% border, mentions = magenta left glow bar |
| names-avatars | round avatars with thin aurora ring on hover; usernames along the ramp (#2EE6C5, #33A1FF, #9B6BFF, #FF5FC8, #FFD166, #7CF29A) |
| composer | glass shelf over the aurora, #0E1014 entry pill, send = cyan→violet gradient orb |
| rightpanel | #1A1D23 panel, cards #232832 radius 6px |
| buttons | primary = cyan→violet gradient pill with dark text #06121F, secondary = #232832 with 1px rgba(255,255,255,.08) and cyan hover glow |
| inputs | #0E1014 fields, radius 6px, focus = 2px #33A1FF + glow |
| dialogs | #1A1D23 glass card with aurora hairline across the top (2px gradient), zoom-in 160 ms |
| menus | glass #1A1D23 at 92% + blur, hover row gradient wash 12%; tooltips dark glass with teal 1px border |
| settings | solid panels, tab selection = gradient bar |
| auth | full aurora background (animated), glass login card centred, E logo tinted with gradient mask |
| scrollbars | 6px, thumb gradient teal→violet at 60% |
| focus | 2px solid #33A1FF + 0 0 0 4px rgba(51,161,255,.25) glow |
| badges | count = #DDE3EA on #232832; mention = #FF5FC8 with #121418 text + glow; highlight pulse 3× |
| code | #0E1014 block, hljs keyword #9B6BFF, string #2EE6C5, number #FFD166, comment #6B7585, function #33A1FF, tag #FF5FC8 |
| iframes | Element dark in a glass frame with aurora hairline |
| icons | #8B95A5, hover #DDE3EA with cyan drop-shadow |
| motion | 30 s aurora drift, 180 ms glows; reduced motion: static |


### Moksha Ember — `e-ember`

*Charcoal and copper: E16 brushed copper title bars, Tigert bronze gems and an ember-orange glow.*

- **Stage/mode:** exciting · dark · S6 H8 · difficulty medium
- **Palette:** `bg` #16120F `surface` #2E2520 `sidebar` #211B17 `rail` #110E0C `text` #EEE4D8 `muted` #A8978A `accent` #FF9933 `onAccent` #1A0D04 `border` #0A0806 `own` #3A2416 `other` #241D19 `critical` #F0506A `success` #B5D86A
- **Fonts:** UI DejaVu Sans 13.5px; display Saira Semi Condensed 700 (headers, dialog titles, room names), uppercase tracking .04em for section labels; mono DejaVu Sans Mono
- **Shape:** radius 3px; border bevel; shadow inset 0 1px rgba(255,220,160,.10), 0 0 0 1px #0A0806; glow = 0 0 10px rgba(255,122,26,.55); density normal
- **Texture:** brushed copper (brush-overlay.png over #7A4B2E→#3B2416) on header and dialog title bars; brush at 3% on panels
- **Motion:** Amber ember pulse on unread badges (3×), hover glow warms in 200 ms; reduced motion: none.
- **Signature moves:**
  1. Brushed-copper title bars (#7A4B2E→#3B2416) with Tigert bronze gem buttons
  2. Ember glow #FF7A1A/#FF9933 on focus and selection, amber #FFB547 unread pulse
  3. Crimson #E0344A/#F0506A for mentions and destructive actions
  4. Warm off-white text #EEE4D8 on charcoal, never pure grey
  5. Saira Semi Condensed uppercase labels like engraved plates
- **Enhancer:** Optional: shared clock gadget in 'flip' style (E17 flip clock) with ember digits.

| region | treatment |
|---|---|
| shell | #16120F charcoal with a faint warm radial glow bottom-left (like embers), grain at 5% |
| spaces | #110E0C column with copper-bevel space buttons; active = ember ring glow |
| roomlist | #211B17, rows separated by #0A0806 + rgba(255,220,160,.04); selected = #2E2520 with 3px ember bar and ember text-glow on name (bold) |
| header | brushed copper bar, Saira 700 title #FFF1E0 with dark emboss, bronze gem trio right |
| timeline | #16120F, own #3A2416 warm wells, others #241D19; mentions = crimson left bar; read marker amber hairline |
| names-avatars | round avatars with 1px copper ring; usernames warm decoratives (#FFB547, #FF7A1A, #F0506A, #E8C39E, #B5D86A, #7FC8D9) |
| composer | #211B17 bar with copper top edge, entry #110E0C inset, send = copper gem |
| rightpanel | #211B17 with copper title strip |
| buttons | copper bevel (#9A6038→#5A3420) with #FFF1E0 text; primary = ember #FF9933 face with #1A0D04 text; destructive = crimson |
| inputs | #110E0C inset fields, focus = 2px #FF9933 + ember glow |
| dialogs | copper title bar + charcoal body #2E2520, zoom-in 150 ms |
| menus | #2E2520 panels, hover row ember wash 18% with left bar; tooltips #110E0C with amber top hairline |
| settings | Saira tab labels, active = ember bar |
| auth | charcoal with ember radial glow, copper-framed login window |
| scrollbars | 8px copper-tinted thumb #5A3420, hover #9A6038 |
| focus | 2px solid #FF9933 + 0 0 8px rgba(255,122,26,.55) |
| badges | count = #EEE4D8 on #3A2E27; mention = #F0506A with #16120F text; unread dot amber pulse 3× |
| code | #110E0C, hljs keyword #FF9933, string #B5D86A, number #FFB547, comment #8A7A6E, function #F0A27A, tag #F0506A |
| iframes | Element dark in copper frame |
| icons | #A8978A, hover #FFB547 with ember drop-shadow |
| motion | ember pulse 3×, 200 ms glows; reduced motion off |


### Ganymede Neon Steel — `e-neon-steel`

*E16 BlueSteel slate and Ganymede cobalt bevels lit by cyan/magenta neon, Terminology scanlines in code.*

- **Stage/mode:** exciting · dark · S5 H9 · difficulty medium
- **Palette:** `bg` #0D111C `surface` #2D3243 `sidebar` #161C2B `rail` #0A0D16 `text` #D6E2F5 `muted` #8C99BA `accent` #33E0FF `onAccent` #03141A `border` #05070C `own` #1A2547 `other` #161C2B `critical` #FF3399 `success` #99FF33
- **Fonts:** UI IBM Plex Sans 400/600, 14px; display Exo 2 700 (headers), Exo 2 500 (labels); mono Share Tech Mono (timestamps, code) → DejaVu Sans Mono
- **Shape:** radius 0px with 6px chamfered corners on header/dialogs (clip-path); border bevel; shadow 1px #3263E5 bevel top-left / #0B1B5A bottom-right (Ganymede), neon glow 0 0 10px rgba(51,224,255,.5); density normal
- **Texture:** blue-tinted brushed steel (brush-overlay.png on #2D3243) on header/dialog bars; scanlines (repeating-linear-gradient 2px) in code blocks only
- **Motion:** Neon flicker once on dialog open (2 frames), hover glows 120 ms; reduced motion: none.
- **Signature moves:**
  1. Brushed BlueSteel bars with Ganymede cobalt 1px bevels
  2. Neon cyan focus/selection, magenta mentions, lime presence dots
  3. Chamfered (cut-corner) header and dialogs, decorative chrome window-button trio
  4. Terminology scanlines + Share Tech Mono in code and timestamps
  5. Space panel as an E16 pager with 2×2 mini-preview look
- **Enhancer:** Optional: shared clock gadget (digital, Share Tech Mono, cyan).

| region | treatment |
|---|---|
| shell | #0D111C deep slate with faint indigo vignette (Ganymede #2B2B6A at 30%) |
| spaces | steel pager column #161C2B, space tiles with cobalt bevel; active = cyan neon outline |
| roomlist | #161C2B, separators #05070C + rgba(140,153,186,.06); selected = #1A2547 with cyan left bar + cyan name glow (bold) |
| header | brushed steel #2D3243 bar with cobalt bevel, chamfered right corner, Exo 2 title, chrome trio |
| timeline | #0D111C, own #1A2547, others #161C2B, timestamps Share Tech Mono #8C99BA, mentions magenta bar |
| names-avatars | square avatars with 1px cobalt bevel; usernames neon set (#33E0FF, #FF3399, #99FF33, #FFB547, #B57BFF, #5EA0FF) |
| composer | steel bar, entry #0A0D16 with cobalt inset, send = cyan neon chevron |
| rightpanel | #161C2B with steel title strip |
| buttons | steel bevel (#41475A→#2D3243) with #D6E2F5 text; primary = cyan #33E0FF with #03141A text; destructive magenta |
| inputs | #0A0D16 inset, focus = 2px #33E0FF + neon glow |
| dialogs | chamfered steel window, cobalt bevel, neon flicker-in |
| menus | #161C2B, hover row cyan wash 14%, tooltips black with cyan border |
| settings | Exo 2 tab labels, cyan bar on active |
| auth | indigo/slate gradient with cobalt light streaks, chamfered steel card |
| scrollbars | 6px cobalt thumb #3263E5, hover cyan |
| focus | 2px solid #33E0FF + 0 0 10px rgba(51,224,255,.5) |
| badges | count = #D6E2F5 on #2D3243; mention = #FF3399 with #0D111C text; presence lime |
| code | #05070C block with 2px scanlines (rgba(51,224,255,.04)), Share Tech Mono #CFE3F5, hljs keyword #FF3399, string #99FF33, number #FFB547, comment #5C6A8A, function #33E0FF |
| iframes | Element dark in steel frame |
| icons | #8C99BA, hover #33E0FF with neon drop-shadow |
| motion | flicker-in on dialogs, 120 ms glows; reduced motion off |


### Enlightenment · Usable — `e-usable`

*The E look for eight-hour chat days: E-current greys, one blue glow, real contrast and calm motion.*

- **Stage/mode:** usable · dark · S9 H4 · difficulty easy
- **Palette:** `bg` #2C2C2C `surface` #383838 `sidebar` #333333 `rail` #1C1C1C `text` #EDEDED `muted` #B4B4B4 `accent` #4DA6FF `onAccent` #0A0A0A `border` #7A7A7A `own` #283445 `other` #353535 `critical` #FF6B5E `success` #5EE65E
- **Fonts:** UI DejaVu Sans 14px (Element font scaling honoured); display DejaVu Sans Bold; mono DejaVu Sans Mono
- **Shape:** radius 4px; border hairline; shadow subtle: 0 1px 2px rgba(0,0,0,.4); focus glow 0 0 0 4px rgba(77,166,255,.25); density normal
- **Texture:** none (single soft gloss only on the header bar)
- **Motion:** 100 ms colour fades only; no pulses (badges static); reduced motion = none.
- **Signature moves:**
  1. E-current flat greys with the E17 glossy header as the one nostalgic touch
  2. Blue #4DA6FF selection bar + subtle glow, never glow-only
  3. Visible 1px #7A7A7A borders on inputs/cards (≥3:1)
  4. Element threads, E2EE shields and read receipts kept prominent
  5. Calm: no pulses, no text glow, no textures behind text
- **Enhancer:** none

| region | treatment |
|---|---|
| shell | #1C1C1C base, panels separated by 1px #101010 |
| spaces | #1C1C1C column, 40px hit targets, active = 3px #4DA6FF bar + soft glow |
| roomlist | #333333, rows 36px, selected = #404040 with 3px blue bar, unread bold white, hover #3A3A3A |
| header | E17 gloss bar (#3D3D3D→#262626), white title, no decorative glyphs |
| timeline | #2C2C2C, own #283445, readable 1.5 line-height, highlight = #FF9933 bar + 8% tint |
| names-avatars | round avatars, usernames lightened E palette (≥4.5:1 on #2C2C2C) |
| composer | #333333 bar, #262626 entry with 1px #7A7A7A border, focus 2px blue |
| rightpanel | #333333, cards #383838 with 1px border |
| buttons | #4A4A4A secondary with border, primary #4DA6FF with #0A0A0A text, 36px min height |
| inputs | #262626, 1px #7A7A7A, focus 2px #4DA6FF + soft glow |
| dialogs | #383838, #262626 gloss title strip, shadow, no zoom |
| menus | #333333, selected row #4DA6FF 22% + left bar, tooltips #1C1C1C with #EDEDED text |
| settings | as dialogs, wide click targets |
| auth | #1C1C1C with E logo, simple #383838 card |
| scrollbars | 10px, thumb #6A6A6A, hover #4DA6FF |
| focus | 2px solid #4DA6FF, offset 2px, plus 4px 25% glow |
| badges | count #EDEDED on #555555; mention #FF6B5E with #1C1C1C text; static |
| code | #1F1F1F, DejaVu Sans Mono, E syntax colours brightened for 4.5:1 |
| iframes | Element dark, plain 1px frame |
| icons | #B4B4B4, hover #EDEDED, active #4DA6FF |
| motion | 100 ms fades only |


### Enlightenment · Aurora Cycle — `e-daylight`

*One E desktop through the day: pastel aurora dawn, brushed-steel day, ember dusk, deep-blue glow night.*

- **Stage/mode:** pure · daylight · S7 H7 · difficulty hard
- **Palette:** `bg` #E3E6EA `surface` #F4F5F7 `sidebar` #C6CCD3 `rail` #A9B1BB `text` #15191E `muted` #4A5360 `accent` #1A5DB3 `onAccent` #FFFFFF `border` #6B7480 `own` #D6E4F7 `other` #F4F5F7 `critical` #B42318 `success` #1A6E2E
  - *dawn*: `bg` #F4ECEE `surface` #FBF7F8 `sidebar` #E3D6E2 `rail` #CDBBD0 `text` #261E2B `muted` #5F5368 `accent` #7A3FD0 `onAccent` #FFFFFF `border` #8E7C93 `own` #EADFF5 `other` #FFFFFF `critical` #B3261E `success` #1B7A4C
  - *day*: `bg` #E3E6EA `surface` #F4F5F7 `sidebar` #C6CCD3 `rail` #A9B1BB `text` #15191E `muted` #4A5360 `accent` #1A5DB3 `onAccent` #FFFFFF `border` #6B7480 `own` #D6E4F7 `other` #F4F5F7 `critical` #B42318 `success` #1A6E2E
  - *dusk*: `bg` #1C1512 `surface` #2E2520 `sidebar` #251D19 `rail` #140F0D `text` #F0E6DA `muted` #B09E90 `accent` #FF9933 `onAccent` #1A0D04 `border` #0A0806 `own` #3A2617 `other` #2A211C `critical` #F0506A `success` #B5D86A
  - *night*: `bg` #0A0F1E `surface` #152038 `sidebar` #0F172B `rail` #070B16 `text` #DCE6F5 `muted` #8D9BB8 `accent` #3399FF `onAccent` #03101F `border` #03060D `own` #13264A `other` #111A30 `critical` #FF5A6E `success` #5EE6A0
- **Schedule:** 05:30 dawn (light), 09:00 day (light), 18:00 dusk (dark), 21:30 night (dark)
- **Fonts:** UI DejaVu Sans 13.5px; display Titillium Web 600/700 (titles; aurora echo); mono DejaVu Sans Mono
- **Shape:** radius 4px; border glow; shadow day: 0 1px 2px rgba(20,30,40,.25) + steel bevel; night: E17 glow 0 0 8px rgba(51,153,255,.6); density normal
- **Texture:** day: brushed steel (brush-overlay.png on #C6CCD3) on header/space panel; dawn: soft aurora wash (CSS); dusk: copper brush on header; night: none (glow only)
- **Motion:** 2 s background/colour cross-fade between phases (CONTRACT §6); night adds E17 pulse on mentions; reduced motion = instant switch.
- **Signature moves:**
  1. The same E window structure (title bar, shelf, pager) re-lit four times a day
  2. Dawn: pastel aurora band (lilac #CDBBD0 → rose → mint) across header and composer
  3. Day: light brushed steel bars, dark text, E-blue darkened for light contrast (#1A5DB3)
  4. Dusk: Moksha Ember copper title bars and #FF9933 glow
  5. Night: deep-blue E17 glow (#3399FF) on #0A0F1E
- **Enhancer:** onPhase(): swaps the shelf clock gadget face (sun/steel/ember/moon) and announces nothing; CSS does the rest. Clock gadget shared with e17-glow.

| region | treatment |
|---|---|
| shell | phase-tinted desktop: dawn #F4ECEE + aurora wash, day #E3E6EA steel, dusk #1C1512 ember radial, night #0A0F1E |
| spaces | shelf column in the rail colour of the phase; active = accent bar (+ glow at night) |
| roomlist | sidebar colour of the phase, selected = accent bar + surface fill |
| header | title bar: dawn aurora wash, day brushed steel, dusk brushed copper, night E17 gradient #152038→#0A0F1E |
| timeline | phase bg, own/other per palette; no textures behind text in any phase |
| names-avatars | decoratives re-mapped per phase (dark-on-light by day, bright-on-dark at night) |
| composer | shelf bar in sidebar colour with inset entry in surface colour |
| rightpanel | sidebar colour, cards in surface colour |
| buttons | primary = accent with onAccent text per phase; secondary bevel matching the phase (steel/copper/glass) |
| inputs | surface fields, 1px border, focus 2px accent (+ glow at dusk/night) |
| dialogs | phase title bar + surface body |
| menus | surface panels, accent-wash selection |
| settings | as dialogs |
| auth | phase desktop with E logo tinted accent |
| scrollbars | thin accent-tinted thumb |
| focus | 2px solid accent (always ≥3:1 in each phase) + glow at dusk/night |
| badges | mention = critical colour of the phase; count = surface/text |
| code | day/dawn: light code well with darkened E syntax colours; dusk/night: dark well with E syntax colourclasses |
| iframes | light during dawn/day, dark during dusk/night (data-tl-base follows the phase) |
| icons | muted colour, hover text colour, active accent |
| motion | 2 s phase cross-fade; pulse only at night |


## 13. Sources and licences

- [E16 themes repo (BrushedMetal-Tigert, BlueSteel, Ganymede, ShinyMetal) — pixmaps sampled for hex values; e16 licence (MIT-style)](https://git.enlightenment.org/e16/e16-themes)
- [Enlightenment 0.17.6 default theme (data/themes/*.edc + img, BSD-2) — E17 gradients and #3399FF glow sampled](https://git.enlightenment.org/enlightenment/enlightenment/src/tag/v0.17.6/data/themes)
- [EFL elementary theme colorclasses.edc (current E / E-current core palette, :selected #3399FF)](https://git.enlightenment.org/enlightenment/efl/src/branch/master/data/elementary/themes/colorclasses.edc)
- [EFL elementary fonts.edc (FN = "Sans" → DejaVu Sans)](https://git.enlightenment.org/enlightenment/efl/src/branch/master/data/elementary/themes/fonts.edc)
- [Enlightenment home page screenshots (E 0.25 era, raster, 2021-12-13)](https://www.enlightenment.org/)
- [MokshaRadiance (Bodhi/Moksha theme, BSD-2) — rad_conf.edc colour macros](https://github.com/JeffHoogland/MokshaRadiance)
- [Bodhi Linux Radiance theme page](https://www.bodhilinux.com/a/radiance-theme/)
- [Enlightenment themes overview](https://www.enlightenment.org/themes/start)
- [Terminology THEMES.md](https://git.enlightenment.org/enlightenment/terminology/src/branch/master/THEMES.md)
- [DejaVu fonts (Bitstream Vera licence + public domain)](https://dejavu-fonts.github.io/)
- [Fontsource (OFL webfont builds: Titillium Web, Saira Semi Condensed, Exo 2, IBM Plex Sans, Share Tech Mono, Silkscreen)](https://fontsource.org/)

Asset licences (DejaVu = Bitstream Vera licence + PD; Titillium Web, Saira Semi Condensed, Exo 2, IBM Plex Sans, Share Tech Mono, Silkscreen = SIL OFL 1.1; Tigert pixmaps = e16 MIT-style licence with acknowledgment; E17 logo = BSD-2; E logo SVG = LGPL-2.1; textures/button SVGs = self-made CC0) are tabled in `themes/enlightenment/README.md`, full texts in `themes/enlightenment/licenses/`.
