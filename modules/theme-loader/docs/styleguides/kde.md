# KDE Plasma / Qt — style guide (`kde`, 7 variants)

Status: Phase A, 2026-11-15. Target Element Web 1.12.33. Machine-readable twin: `kde.json`.
Assets: `themes/kde/assets/` (licences in `themes/kde/README.md`). Reference screenshots: `docs/styleguides/refs/kde/`.

## 1. Concept

Element should look like it is **a native KDE application running on Plasma**. The model is **NeoChat**,
KDE's own Matrix client (Kirigami + qqc2-desktop-style, rendered with Breeze). See `refs/kde/neochat-application.png`
and `neochat-spaces.png`. It shows almost everything we need:

- a unified header band (titlebar and toolbar share one colour) with circular chevron window buttons
- a narrow space column next to a Kirigami sidebar room list with "Favourite ———— ⌃" section headers
- a light-grey **Window** canvas behind white **View** message cards with a 5 px radius
- pale-blue (accent at 30 %) selection
- Breeze push buttons with a 1 px outline and a hairline shadow
- a white composer strip at the bottom with flat tool-button icons

"Really nice KDE-like Qt style" is the brief, so polish beats novelty. Every control (button, line edit, check box,
toggle, combo, tab, scrollbar, menu, tooltip) gets an exact Breeze treatment. The values come from
`kstyle/breezehelper.cpp` and `breezemetrics.h`, not from eyeballing.

### Stage axis

```
           past ◄──────────────── pure ────────────────► future
   kde-oxygen (KDE 4, 2008–14)   kde-breeze-light/dark/daylight   kde-ocean (Ocean design system, 2026+)
                                         │
                       usable ◄──────────┴──────────► exciting
                     kde-usable                      kde-glass
      (Breeze, tuned for 8 h chat days)   (KWin blur, Plasma wallpaper, accent-from-wallpaper glow)
```

| id | stage | mode | S | H | one-liner |
|---|---|---|---|---|---|
| kde-breeze-light | pure | light | 9 | 3 | Plasma 6 Breeze Light, NeoChat layout, Breeze titlebar |
| kde-breeze-dark | pure | dark | 9 | 3 | the same in Breeze Dark |
| kde-breeze-daylight | pure | daylight | 9 | 4 | Breeze Light by day, Breeze Classic at dusk, Breeze Dark at night, plus a KWin **Night Color** warm overlay |
| kde-oxygen | past | light | 7 | 5 | KDE 4 Oxygen: radial window gradient, glossy buttons, blue glow, dark glass panel, Oxygen font and icons |
| kde-ocean | future | light | 8 | 6 | KDE VDG "Ocean" tokens: Inter, #2058C3 tonal ramp, filled CTAs, 6/8/16 px radii, pill selection, traffic-light titlebar |
| kde-usable | usable | light | 10 | 2 | Breeze Light without the titlebar: compact, zebra rows, AA text, thick focus rings |
| kde-glass | exciting | dark | 5 | 8 | translucent Breeze Dark over the Plasma "Hanabi" wallpaper, floating panel, violet accent glow |

No catalogue changes. The ids, count and stages are unchanged. Two refinements:

- the daylight variant names its phases after real Breeze schemes and adds Night Color
- kde-ocean is light-only for now. OceanDark values are recorded in §4.5 for a possible later dark variant.

## 2. Verified source values

Every value in this section was read from the upstream files during this session.

### 2.1 Breeze colour schemes

Sources: `plasma/breeze` `colors/BreezeLight.colors`, `BreezeDark.colors`, `BreezeClassic.colors`.

| Role | Breeze Light | Breeze Dark | Breeze Classic |
|---|---|---|---|
| Window bg / alt | `#eff0f1` / `#e3e5e7` | `#202326` / `#292c30` | `#eff0f1` / `#bdc3c7` |
| View bg / alt | `#ffffff` / `#f7f7f7` | `#141618` / `#1d1f22` | `#fcfcfc` / `#eff0f1` |
| Button bg | `#fcfcfc` | `#292c30` | `#eff0f1` |
| Header bg (active / inactive) | `#dee0e2` / `#eff0f1` | `#292c30` / `#202326` | (none; titlebar `#475057`) |
| Text / inactive text | `#232629` / `#707d8a` | `#fcfcfc` / `#a1a9b1` | `#232627` / `#7f8c8d` |
| Selection bg / text | `#3daee9` / `#ffffff` | `#3daee9` / `#fcfcfc` | `#3daee9` / `#fcfcfc` |
| Focus / hover decoration | `#3daee9` / `#3daee9` | `#3daee9` / `#3daee9` | `#3daee9` / `#93cee9` |
| Link / visited | `#2980b9` / `#9b59b6` | `#1d99f3` / `#9b59b6` | `#2980b9` |
| Complementary bg / text | `#2a2e32` / `#fcfcfc` | `#202326` / `#fcfcfc` | `#31363b` / `#eff0f1` |
| Tooltip bg / text | `#f7f7f7` / `#232629` | `#292c30` / `#fcfcfc` | `#232627` / `#fcfcfc` |
| WM active titlebar / text | `#e3e5e7` / `#232629` | `#272c31` / `#fcfcfc` | `#475057` / `#fcfcfc` |
| Negative / Neutral / Positive | `#da4453` / `#f67400` / `#27ae60` | same | same |

### 2.2 Breeze QStyle rules

Source: `kstyle/breezehelper.cpp`, `breezemetrics.h`. In the formulas below, `bias` is the KColorScheme frame contrast, 0.2 by default.

- Frame outline = `mix(Window, WindowText, bias)`:
  - Light `#c6c8c9`, Dark `#4c4e51`
  - Button outline Light `#d1d1d2`, Dark `#535659`
  - Separators use the same colour.
- **Push button:**
  - fill = Button bg
  - pen = button outline, 1 px
  - radius = `Frame_FrameRadius` **5 px**
  - shadow = black at **12.5 %** with 1 px y-offset (`shadowColor` opacity 0.125)
- Hover, keyboard focus or press: the pen becomes **highlight** `#3daee9`. Press also fills with `mix(Button, highlight, 0.3)` = Light `#c3e5f6`, Dark `#2f5367`.
- **Default button** (active window):
  - fill `mix(Button, highlight, 0.2)` = Light `#d6ecf8`, Dark `#2d4655`
  - pen `mix(highlight, outline, 0.5)` = Light `#87c0de`
- **Flat (tool) button:** no frame at rest. Hover/press fills highlight at alpha **0.3**. Checked fills text at alpha 0.125 with an outline.
- **Check box:**
  - radius 4 px, box filled with Button bg, outline = separator colour
  - checked: pen = highlight, inner fill = highlight at **α 0.3**, check mark drawn in highlight
  - this is not a white tick on a solid fill
  - hover: an extra highlight ring
- **Radio button:** the same scheme with a ring and a dot.
- **Scrollbar:**
  - slider width **8 px**
  - handle = WindowText at α 0.5
  - hover and focus turn it to highlight
  - Plasma 6 shows no groove until hover
- **Item-view selection** (Dolphin, Kirigami sidebars): fill highlight at α 0.3 (on white `#c5e7f8`) plus a 1 px highlight outline, radius 5 px. Hover uses about α 0.15 with no outline.
- **Metrics:**
  - menu item margins 4 px, text left margin 8 px
  - line edit frame 6 px
  - button min width 80 px, margins 6 px
  - layout margins 10 px top-level, 6 px child
  - tool-button inline indicator 12 px

### 2.3 Oxygen (KDE 4)

Source: `plasma/oxygen` `color-schemes/Oxygen.colors`.

| Role | Value |
|---|---|
| Window bg | `#d6d2d0` (alt `#dad9d8`) |
| View bg | `#ffffff` (alt `#f8f7f6`) |
| Button bg | `#dfdcd9` |
| Text | `#221f1e`, view text `#1f1c1b`, inactive `#898887` |
| Selection | `#43ace8` (alt `#3e8acc`), white text |
| Focus | `#3aa7dd` |
| Hover (the "Oxygen glow") | `#6ed6ff` |
| Tooltip / Complementary | `#181513` with `#e7fdff` text |
| ForegroundActive | `#924c9d` |
| Link / visited | `#0057ae` / `#644a9b` |
| Negative / neutral / positive | `#bf0303` / `#b08000` / `#006e28` |
| WM active | `#30aee8` / white |
| WM inactive | `#e0dfde` / `#4b4743` |

### 2.4 Ocean (KDE VDG design system)

Sources:
- `invent.kde.org/abetts/ocean-design`, master of 2026-10-17: `Color Scheme/Ocean.colors`, `OceanDark.colors`, `OceanREADME.md`, `Basic Component Spec/*.md`, `Window Decoration/Ocean/*`
- the related posts on Planet KDE

Status as of 2026-11: Union shipped as a tech preview in Plasma 6.7 and still forwards to Breeze. Ocean is in its
"build phase" (Akademy 2026 talk). The icons are a preview. This is a *speculative but source-faithful* future.

- **Tonal ramps** (Material-3-like, `pd.ref.color.*`):

| Ramp | Steps |
|---|---|
| accent | 98 `#faf8ff` · 95 `#eef0ff` · 92 `#e2e7ff` · **90 `#dae2ff`** · 80 `#b1c5ff` · 70 `#88a9ff` · 60 `#5e8cfa` · **50 `#4172de`** · **40 `#2058c3`** · 30 `#0040a0` · 20 `#002c72` · 10 `#001847` |
| neutral | 98 `#fbf8fd` · 96 `#f5f3f7` · 95 `#f2f0f4` · 94 `#efedf1` · 92 `#e9e7ec` · 90 `#e4e2e6` · 80 `#c7c6ca` · 70 `#acaaaf` · 50 `#77777a` · 40 `#5e5e62` · 30 `#46464a` · 20 `#303034` · 10 `#1b1b1f` |
| neutralVariant | 90 `#e1e2ec` · 80 `#c5c6d0` · 50 `#757780` · 30 `#44464f` |
| error | 95 `#ffedea` · 90 `#ffdad6` · 70 `#ff897d` · 50 `#da3c34` · 40 `#b7211e` · 30 `#93000a` |
| success | 95 `#c1dc8e` · 50 `#5b8211` · 40 `#4c6d0e` · 30 `#3e580c` |
| warning | 95 `#fcca8c` · 50 `#a56921` · 30 `#704816` |

- **Ocean.colors:**
  - Window `#fbfcfe`, View `#ffffff`, Button `#ffffff`, text `#1a1a1e` / `#1b1b1f`
  - **Selection `#dae2ff` with `#001847` text**, focus decoration `#2058c3`
  - Tooltip `#232627`
  - `TitlebarIsAccentColored=true`, WM active `#fbfcfe`
- **OceanDark.colors:**
  - Window `#303034`, View `#131316`, Button `#303034`, text `#e4e2e6`
  - Selection `#0040a0` with `#dae2ff` text, focus `#b1c5ff`, tooltip `#2f2f34`
- **Typography:** **Inter**. Default Text SM 14/20. Scale: XS 12/18, MD 16/24, LG 18/28, XL 20/30, Display XS 24/32 … 2XL 72/90 (−2 % tracking). Buttons use weight 600, labels 500.
- **Spacing:** 8 px base, with 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 steps.
- **Radii:** `xs` 2 · `sm` 4 · **`ms` 6** (buttons, inputs, tooltips, dropdown fields) · 8 (menus/cards) · `lg` half-height (toggles) · **`xl` 16** (badges) · `full` (avatars, round buttons).
- **Button** (sm 36 / md 40 / lg 44):
  - primary: `#4172de` fill and border, `#faf8ff` text; hover `#0040a0`; disabled `#b1c5ff`
  - secondary: `#eef0ff` / `#0040a0`, hover `#dae2ff`
  - gray: `#fff` + `#f2f0f4` border + `#46464a` text
  - destructive: `#da3c34`
  - shadow `0 1px 2px rgb(0 0 0/.047), 0 2px 6px rgb(0 0 0/.094)`
  - focus ring `0 0 0 2px #e9ebf8`
  - no pressed state is defined
- **Input:**
  - 44 px tall, padding 10/14, radius 6
  - border `#757780`, fill white
  - focus: border `#88a9ff` plus a 2 px `#e9ebf8` spread
  - error: border `#ff897d`, ring `#fee4e2`
- **Badge:** pill radius 16, 22/24/28 px tall. Colour pairs: gray `#e4e2e6`/`#46464a`, primary `#eef0ff`/`#0040a0`, error `#ffedea`/`#93000a`.
- **Toggle:** 36×20 or 44×24, 2 px track padding. On `#4172de`, off `#e4e2e6`, hover-on `#b1c5ff`.
- **Tooltip:** radius 6, padding 8/12, shadow-lg. Light variant `#fff` with `#46464a`/`#77777a` text; dark variant `#1b1b1f` with white text.
- **Avatar:** initials `#2058c3` on `#eef0ff`. Selected ring 4 px `#dae2ff`. Online dot `#5b8211` with a white stroke.
- **Shadows** (`box-shadow1..4`): y 0.5–1 / blur 0.5–2 at 10 %; y 2–6 / blur 4–16 at 4–24 %; y 4–40 / blur 8–40 at 6–24 %. **Blurs:** 8 / 16 / 24 / 40 px. Light blur tint white; dark blur tint `#344054`.
- **Window decoration "Ocean"** (Aurorae, GPL-2+):
  - buttons on the **left** (close, minimise, maximise), title centred
  - 18 px **gradient circles**: close `#fe554a` on `#fff8f7`, minimise `#7eb317`/`#628b12` on `#f5faee`, maximise `#cf7d03` on `#fff8f4`
  - soft glow on hover
- **Icons:**
  - 24 px base, 2 px strokes (16 px uses 1 px), 1 px corner radius
  - monochrome below 32 px
  - app icons have soft gradients and come in three shapes: round, squircle, unbounded

## 3. Family-wide decisions

### 3.1 Layout (all variants except where noted)

The NeoChat arrangement is built in CSS on Element's existing shells:

```
┌─────────────────────────── titlebar 30 px (enhancer, decorative) ───────────────────────────┐
│ [app icon]                    Room name — Element                          ⌄  ⌃  ✕          │
├──────┬───────────────────────┬──────────────────────────────────────────────────────────────┤
│space │ Rooms        [search] │ Room name                         [call][video][threads][≡] │ ← Header band 48 px, one colour
│column├───────────────────────┼──────────────────────────────────────────────────────────────┤
│ 52px │ Favourite ─────── ⌃   │                Window canvas #eff0f1                         │
│ icons│ ▢ Room   preview  9   │   (●) Name                                    14:26          │
│      │ ▣ selected (α .3)     │       ┌──────────── white card r5 ───────────────┐           │
│ ──── │ Normal ────────── ⌃   │       │ message text…                            │           │
│  +   │                       │       └──────────────────────────────────────────┘           │
├──────┴───────────────────────┼──────────────────────────────────────────────────────────────┤
│ (●) User name   @id   [⚙]    │ Send a message…                          📎  ☺  ➤            │ ← composer strip, View bg
└──────────────────────────────┴──────────────────────────────────────────────────────────────┘
```

- **Titlebar** (Breeze, Oxygen, Ocean, glass): the enhancer adds a 30 px overlay. CSS shifts `#matrixchat` by `--kde-titlebar-h`.
  - The title is `document.title`.
  - The buttons are `aria-hidden`. Only **maximise** does anything: it toggles `requestFullscreen()`.
  - kde-usable has no titlebar, so the space goes back to the chat.
- **Header band:** `.mx_RoomHeader`, the room-list header (`RoomListHeaderView`) and the top of `.mx_SpacePanel` share one height, 48 px, and the `Header` colour. Together with the titlebar this gives Plasma 6's "unified titlebar + toolbar" with no separator line. There is a 1 px separator only below the band.
- **Space column:** a 52 px icon column. It is styled like NeoChat's space drawer, which is also a vertical Plasma panel:
  - the Home button wears the KDE logo (`breeze-kde-symbolic.svg`)
  - the selected space is a pale-blue tile (α 0.3) with a 3 px accent line on the outer edge, like the Plasma task manager's active-task indicator
- **User card:** the bottom-left NeoChat user card is where `.mx_UserMenu` and Quick Settings already sit.
- **Timeline:** Window-colour canvas with View-colour cards, both in group and bubble layout. IRC layout stays flat on View with Breeze alternate-row striping (`#f7f7f7`), the Qt item-view look.

### 3.2 Token strategy

Set `--cpd-*` on `html[data-tl-theme=…], … body, … [class*="cpd-theme-"]` (CONTRACT §3):

| Element token | Breeze role |
|---|---|
| `bg-canvas-default` | Window (the timeline canvas) |
| `bg-canvas-default-level-1` | View (cards, dialogs body, inputs) |
| `bg-subtle-secondary` | Window (room list) |
| `bg-subtle-primary` | Header |
| `bg-action-primary-*` | Ocean: the accent fill. Breeze: dark text, as in Breeze's own rare solid buttons. |
| `bg-accent-*` | highlight `#3daee9` |
| `bg-action-tertiary-selected` | highlight at 30 % |
| `text-primary` / `-secondary` | Text / Inactive text |
| `text-link-external` | ForegroundLink |
| `border-interactive-*` | frame outline |
| `border-focused` | DecorationFocus |
| `bg-decorative-1..6`, `text-decorative-1..6` | Breeze HIG palette (§3.4) |

Element's `green-*` accent ramp is remapped to the variant's accent ramp.

### 3.3 Typography

| Variant | UI | Messages | Mono | Notes |
|---|---|---|---|---|
| Breeze ×3, usable, glass | **Noto Sans** var 400–700 (bundled) | Noto Sans | **Hack** (bundled) | Plasma default is 10 pt ≈ 13.33 px. Chrome 13 px, body 14 px (usable 14.5 px), small 11 px. Headings are Kirigami Heading: L1 = 1.35× and bold, others 600. No letter-spacing. |
| Oxygen | **Oxygen** 300/400/700 (bundled) | Oxygen | **Oxygen Mono** (bundled) | KDE 4 default was DejaVu Sans 9 pt on many distros, but the Oxygen font is the brand. Body 13 px. |
| Ocean | **Inter** var (opsz, wght; bundled) | Inter 14/20 | Hack | Labels 500, buttons 600, Display XS 24/32 for room titles in settings and dialogs |

`--cpd-font-family-sans/mono` need `!important` (FontWatcher). Use `font-optical-sizing: auto` for Inter.

### 3.4 Avatars and usernames

- **Shape:** round. Kirigami avatars are circles.
- **Default (initials) avatars** follow NeoChat/Kirigami: coloured initials and a 1 px ring in the same hue, on a 15 % tint of that hue (see `refs/kde/neochat-spaces.png`). This replaces Element's solid discs.
- **Hues** from the Breeze/KDE HIG palette: Plasma Blue `#3daee9`, Icon Blue `#1d99f3`, Noble Fir `#27ae60`, Beware Orange `#f67400`, Icon Red `#da4453`, Purple `#9b59b6`.
- **Username colours:** darker versions of the same hues so they stay AA on Window: `#1b6aa5` `#126fb4` `#1d7a45` `#a8500a` `#b0303e` `#7a3e96`. Breeze Dark uses the hues at full strength. NeoChat shows names bold.
- **Ocean:** the initials pair is `#2058c3` on `#eef0ff` for every user, with no rainbow, as in the Ocean avatar spec. Usernames keep a restrained six-hue set taken from the Ocean secondary palette (`*30` steps).

### 3.5 Iconography

- **Breeze icons** (LGPL-3.0-or-later, tag v6.32.0, 22 px monochrome):
  - shipped as `assets/breeze-*.svg`, 77 files
  - applied with `mask-image` plus `background: currentColor` on `::before` of buttons identified by `aria-label` / `mx_` class
  - the original Compound `<svg>` is hidden with `visibility:hidden` and keeps its size
- Coverage targets:
  - composer: send, attach, emoji, voice, formatting
  - header: call, video, threads, room info, notifications, search
  - room list: compose, filter, sort, overflow
  - space panel: home = KDE logo, add space
  - message action bar: react, reply, edit, thread, overflow, pin, copy, delete
  - shields: `security-high/medium/low`
  - menus: 16 px rendering of the same SVGs
- Icons are recoloured through `currentColor`. Breeze rule: icons use Text colour, never the accent, except active toggles.
- Anything not covered keeps the Compound icon in Text colour. Compound and Breeze glyph weights are similar enough.
- **Oxygen:** the colourful 48 px Oxygen PNGs (`assets/oxygen-*.png`, LGPL-3.0) are drawn as `background-image` at 22 px (no mask), because Oxygen icons are full colour. The KDE 4 logo is `oxygen-start-here-kde.png`.
- **Ocean:** the 24 px, 2 px-stroke Ocean icons (`assets/ocean-*.svg`), 34 files, masked like Breeze.

### 3.6 Motion

| Variant | Motion |
|---|---|
| Breeze | Hover fades 150 ms ease-out on outline colour (Breeze `AnimationHover`). Popups fade and scale 0.96→1 in 150 ms (KWin Fade / Scale). Menus slide in 4 px (KWin "Sliding popups"). Room switch has no animation. |
| Oxygen | Slower and softer (KDE 4 era): glow fade 250 ms. Dialogs fade in 200 ms. Optional menu fade. |
| Ocean | 200 ms "emphasized" `cubic-bezier(.2,0,0,1)`. Selection pill morphs (background-position). Toggles slide 150 ms. |
| glass | Dialogs open with a "Magic Lamp"-lite (scale from 0.9 plus translateY 12 px and opacity, 220 ms). Accent glow breathes on focus (one pulse). Blur is static. |
| all | `prefers-reduced-motion: reduce` turns off every transition and animation, including the Night Color crossfade. |

### 3.7 Accessibility stance

- Pure Breeze draws keyboard focus as a **1 px** `#3daee9` pen, which is only 2.2:1 on Window. That fails WCAG 1.4.11. Every variant therefore uses `:focus-visible` with a **2 px** accent outline at 1 px offset. It still reads as Breeze, just thicker. kde-usable uses 3 px `#1e6fa5` plus a 2 px white gap.
- **Muted text:**
  - Breeze inactive text `#707d8a` is 4.21:1 on white and 3.69:1 on Window. Pure variants keep it for timestamps only (large or decorative) and use `#5c6670` (5.85:1) for previews.
  - kde-usable uses `#5c6670` everywhere.
- **Accent as text:**
  - `#3daee9` on white is 2.49:1, so it is never used for text in light variants
  - link text uses `#2980b9` (4.3:1; usable `#1e6fa5`, 5.42:1)
  - accent fills always carry dark text (Breeze default-button style) or `#1e5774`
- **Ocean:** body `#1b1b1f`, secondary `#5e5e62` (6.45:1), primary button white on `#4172de` (4.48:1, hence 600 weight 14 px). The spec's focus ring `#e9ebf8` is invisible on white, so we add a 2 px `#2058c3` outline (6.47:1).
- **Oxygen:** the focus glow `#6ed6ff` is too faint, so it is paired with a 1 px `#3aa7dd` outline plus the glow. The `#3aa7dd` outline alone is 1.8:1 on `#d6d2d0`; the combination with the glow and a 2 px offset passes as a visual indicator.
- **Glass:** text always sits on panels of at least 72 % opacity, plus blur, so contrast is computed against the panel colour, not the wallpaper.
- **Daylight:** the Night Color overlay is capped at 10 % multiply, so it never drops a pair below AA.
- Reduced motion is honoured everywhere. `prefers-contrast: more` maps to kde-usable rules (thicker outlines, no translucency) where cheap.

## 4. Per-variant specs

Short region phrases for every variant are in `kde.json`. This section covers what the phrases cannot.

### 4.1 kde-breeze-light — "Breeze Light" (pure)

- **Palette:**
  - Window `#eff0f1` canvas and room list
  - View `#ffffff` cards, composer and inputs
  - Header `#dee0e2`
  - space column `#e3e5e7`
  - text `#232629`, accent `#3daee9`, link `#2980b9`
  - own message card `#e2f3fc` (highlight at 15 % over View)
  - mention card `#fef1e6` with a 3 px `#f67400` left bar (Kirigami InlineMessage "neutral")
- **Shape:** radius 5 (check box 4, avatar circle, scrollbar pill). 1 px outlines `#c6c8c9`. Shadow `0 1px 1px rgb(0 0 0/.125)` on buttons and cards. Dialogs and menus: `0 4px 14px rgb(0 0 0/.25)` plus 1 px outline.
- **Titlebar:**
  - 30 px, `#dee0e2`, title centred, Noto Sans 13 px
  - chevron buttons ⌄ ⌃ ✕ (16 px glyphs in 20 px circles) appear on hover
  - close hover: red `#da4453` circle with a white ✕
  - app icon: Element logo or `breeze-im-matrix.svg` at left, with a pin icon (`breeze-window-pin.svg`) as in NeoChat
- **Room list:**
  - 52 px rows: 32 px avatar, bold name for unread, preview `#5c6670`
  - unread count as plain right-aligned text, as in NeoChat; mentions in a `#da4453` pill
  - sections styled "Favourite ———— ⌃": 600 weight label, hairline rule, chevron
- **Header actions:** flat tool buttons (22 px Breeze icons, 34 px hit box) that show a frame on hover, per §2.2.
- **Dialogs:**
  - Window bg, radius 5
  - title in a Header-colour band
  - KDE button order: Help on the left; OK/Apply/Cancel on the right; default = accent-tinted
- **Settings:** a Kirigami/System Settings page. The left tab list is a sidebar with α 0.3 selection plus outline and icons; content on Window; group boxes are hairline frames.

### 4.2 kde-breeze-dark (pure)

- **Palette:**
  - Window `#202326`, View `#141618`, Header `#292c30`, space column `#1b1e20`
  - text `#fcfcfc`, inactive `#a1a9b1`, accent `#3daee9`, link `#1d99f3`
  - own card `#1c3442`
  - mention card `#362414` with a `#f67400` bar
  - outline `#4c4e51`
- **Shadows:** stronger, `0 1px 2px rgb(0 0 0/.35)`.
- Selection α 0.3 on Window gives `#294d60`.
- Everything else matches 4.1. Code blocks use View alt `#1d1f22`.

### 4.3 kde-breeze-daylight (pure, daylight)

Phases (local clock, CONTRACT §6):

| from | phase | scheme | base | overlay |
|---|---|---|---|---|
| 05:30 | dawn | Breeze Light | light | Night Color fading out: 6 % warm multiply `#ffb366` |
| 08:00 | day | Breeze Light | light | none |
| 17:30 | dusk | **Breeze Classic**: View `#fcfcfc`, dark titlebar `#475057`, Complementary space column `#31363b`, DecorationHover `#93cee9` | light | Night Color 4500 K: 8 % multiply |
| 21:30 | night | Breeze Dark | dark | Night Color 3500 K: 10 % multiply |

- **Night Color** is a single fixed `::after` overlay on `html` with `mix-blend-mode: multiply` and `pointer-events: none`. It costs nothing per tile. It is a very KDE touch: KWin's built-in blue-light filter.
- Phase changes crossfade background colours over 2 s, or instantly with reduced motion.

### 4.4 kde-oxygen (past)

- **Window canvas:** `radial-gradient(ellipse 60% 220px at 50% 0, #e9e7e5, transparent)` over `linear-gradient(#dcd9d7, #d6d2d0 300px)`. This is Oxygen's hallmark lit top-centre.
- **Space column:** the **dark glass Plasma panel** of KDE 4 ("Air"/"Oxygen" Plasma theme):
  - `rgb(24 21 19/.86)` with a top gloss `linear-gradient(rgb(255 255 255/.12), transparent 50%)`
  - icons are colourful Oxygen PNGs
  - the selected space glows `#6ed6ff`
  - the Home button is the KDE 4 logo
- **Buttons:**
  - `linear-gradient(#f3f1f0, #d8d4d1)`, radius 4
  - inner highlight `inset 0 1px rgb(255 255 255/.8)`, drop shadow `0 1px 2px rgb(0 0 0/.25)`
  - hover adds the glow `0 0 0 1px #6ed6ff, 0 0 6px 1px #6ed6ff`
  - pressed is sunken
- **Line edits:** "holes", i.e. an inset shadow `inset 0 1px 2px rgb(0 0 0/.25)` on a white fill, radius 4. Focus glow `#3aa7dd`.
- **Selection:** a glossy blue `linear-gradient(#5bbaf0, #3e9fe0)` with white text, radius 3, plus a 1 px darker border `#2e86c8`.
- **Room list:** View `#ffffff`, rows 26 px (KDE 4 lists were dense), alternate rows `#f8f7f6`.
- **Timeline:** View white, flat group layout, no cards. Oxygen apps had no bubbles. Separators are etched lines (1 px dark plus 1 px light).
- **Titlebar:** Oxygen deco, window-coloured gradient continuous with the window, title centred and bold. Buttons are round grey "jelly" circles (help ?, minimise, maximise, close). Close hover gives a reddish glow.
- **Tooltips:** dark `#181513`, text `#e7fdff`, radius 6, soft 0.9 opacity.
- **Scrollbars:** 12 px, rounded handle with gradient `#dfdcd9`→`#c9c4c1`, groove inset.

### 4.5 kde-ocean (future)

Built strictly from §2.4 tokens.

- **Palette:**
  - surface `#fbfcfe` (Window), View `#ffffff`
  - room list on **surface-container-low** `#f5f3f7` as a floating card: 8 px inset, radius 8, shadow sm
  - space column on surface-container `#efedf1`
  - text `#1b1b1f`, secondary `#5e5e62`
  - accent/primary `#2058c3`, primary button `#4172de`
  - own bubble **primary-container `#dae2ff`** with on-container text `#001847`
  - other bubble `#efedf1`
  - critical `#b7211e`, success `#4c6d0e`
- **Selection:** a **pill** with Ocean Selection colour `#dae2ff` and `#001847` text, radius full in the space column and 8 in the room list.
- **Shape:** inputs and buttons 6, menus and cards 8, badges 16, avatars and round icon buttons full. Two-layer button shadow (§2.4).
- **Titlebar:**
  - Ocean Aurorae: Window `#fbfcfe`, buttons **left**
  - 18 px gradient circles, 8 px spacing: close red, minimise green, maximise orange
  - glyph shows on hover, title centred, 12 px Inter 500
  - drawn in CSS from the verified colours; the GPL deco SVGs are not shipped
- **Composer:**
  - a 44 px Ocean input, radius 6, border `#757780`
  - focus: `#88a9ff` border, 2 px `#e9ebf8` spread, plus a 2 px `#2058c3` outline for accessibility
  - send is a **filled round primary button** (`#4172de`, white Ocean `document-send`)
- **Badges:** pills. Unread `#eef0ff`/`#0040a0`, mention `#ffedea`/`#93000a`, 12 px Inter 500.
- **Toggles:** Ocean spec (44×24, on `#4172de`, off `#e4e2e6`), via Compound `[role=switch]`.
- **Gradients:** a whisper of Ocean's soft app-icon gradients on the Home button tile (`#5e8cfa`→`#2058c3`, radius 8, white KDE logo) and on empty-state illustrations.
- **Dark later:** OceanDark values (Window `#303034`, View `#131316`, Selection `#0040a0`/`#dae2ff`, focus `#b1c5ff`) are recorded for a possible `kde-ocean-dark`. That variant is not in the catalogue.

### 4.6 kde-usable (usable)

Breeze Light, minus the decoration and plus ergonomics:

- **No titlebar.** The header band is 44 px.
- **Typography:** body 14.5 px with line-height 1.45. Compact group layout (continuation tiles with 2 px gap).
- **Rows:** Qt **zebra rows** (`#f7f7f7`) in the timeline and room list. Room rows 44 px with 28 px avatars.
- **Contrast:** text `#232629`; secondary `#5c6670`; link and focus `#1e6fa5`. Accent fills stay Plasma blue, with dark text.
- **Focus:** 3 px `#1e6fa5` plus a 2 px white gap. Focused room-list rows also get a left bar.
- **Mentions:** strong highlighting, a 4 px `#f67400` bar plus a `#fef1e6` row.
- **Unread:** a 2 px accent line in the room list. Unread counts become pills in `#1e5774` with white text (contrast 8.6).
- Hit targets are at least 32 px, though Breeze stays visually compact. Scrollbars are a permanent 10 px with a visible groove.
- No translucency, no motion except 100 ms hover fades.

### 4.7 kde-glass (exciting)

- **Shell:** the Plasma wallpaper **"Hanabi"** (Breeze `wallpapers/Next`, dark image, CC-BY-SA-4.0) is fixed and covers the whole app. Every surface is translucent Breeze Dark with **KWin Blur**:
  - room list `rgb(32 35 38/.72)` + `backdrop-filter: blur(24px) saturate(1.4)`
  - header `rgb(41 44 48/.70)`
  - timeline `rgb(20 22 24/.62)`
  - Ocean blur levels: 16 for panels, 40 for dialogs
- **Space column:** a **floating Plasma panel**: 8 px gap from the edges, radius 12, `rgb(32 35 38/.6)`, 1 px `rgb(255 255 255/.08)` inner highlight, large shadow.
- **Accent from wallpaper** (the Plasma 6 feature): violet `#7f6df2` for fills and selection, `#9d8cff` for text and icons (5.7:1 on Window). Mentions use the wallpaper's ember orange `#ff9a3c`.
- **Glow:**
  - selected and focused elements: `0 0 0 1px #9d8cff, 0 0 14px rgb(127 109 242/.55)`
  - the send button and unread badges carry the glow
  - **not** on timeline tiles (performance rule)
- Titlebar translucent with blur, Breeze chevrons in white.
- Dialogs: glass sheet (blur 40) over a dim scrim `rgb(0 0 0/.45)`, Magic-Lamp-lite entry.
- **Performance:** at most about 6 blurred layers. If `@supports not (backdrop-filter: blur(1px))`, fall back to opaque Breeze Dark at 0.94.

## 5. Region map

`kde.json` has a phrase per region and variant. In the table below, B = Breeze Light/Dark/Daylight (shared), O = Oxygen, Oc = Ocean, U = usable, G = glass.

| Region | B | O | Oc | U | G |
|---|---|---|---|---|---|
| shell | Window canvas, Breeze titlebar, unified header band | radial-gradient window, Oxygen titlebar | `#fbfcfe` surface, floating card panels, traffic-light titlebar | Window, no titlebar | Hanabi wallpaper, blurred translucent panes |
| spaces | 52 px column `#e3e5e7`, KDE logo home, α.3 tile plus edge line | dark glass KDE 4 panel, glow selection, colourful icons | `#efedf1` rail, pill selection, gradient home tile | as B, 48 px | floating rounded Plasma panel |
| roomlist | Kirigami sidebar, sections with rule and chevron, α.3 selection plus outline | dense white list, zebra, glossy blue selection | floating card, pill `#dae2ff` selection, Ocean badges | zebra, 44 px rows, focus bar | glass list, violet glow selection |
| header | Header band, flat tool buttons | window-gradient toolbar, Oxygen icons | 56 px, Inter 600 18 px title, round icon buttons | 44 px band | translucent band |
| timeline | white cards r5 on Window; IRC zebra | flat white, etched separators | Ocean bubbles: own `#dae2ff`, other `#efedf1`, r8 | compact cards plus zebra, strong mentions | dark translucent canvas, cards 50 % |
| names-avatars | ring initials avatars, bold HIG-hue names | round avatars with glossy ring | `#eef0ff`/`#2058c3` initials, 4 px selected ring | as B, AA hues | as B Dark plus glow ring on own |
| composer | View strip, Breeze line edit, tool buttons | sunken hole, glossy send button | 44 px Ocean input, filled round send | as B, 3 px focus | glass strip, glowing send |
| rightpanel | Window page, Kirigami headings, hairline groups | Window gradient, group boxes | floating card r8 | as B | glass card |
| buttons | Breeze push: outline, hairline shadow, accent pen on hover | glossy gradient plus glow | Ocean hierarchy (primary / secondary / gray / link) | Breeze plus 3 px focus | translucent plus glow |
| inputs | View fill, 1 px outline, accent border on focus | inset hole | Ocean input | thicker border `#9aa0a6` | dark glass field |
| dialogs | Window sheet r5, Header title band, KDE button order | Oxygen dialog with shadow | Ocean surface r8, shadow-lg | as B, no fade | blur-40 glass sheet |
| menus | View r5, `0 4px 14px` shadow, α.3 item highlight | glossy selection, rounded | r8, `#f2f0f4` hover, Ocean dropdown | larger rows | glass menu |
| settings | System-Settings-like sidebar plus pages | KDE 4 System Settings (icons grid feel) | Ocean nav pills | as B | glass |
| auth | Plasma SDDM/lock-screen look: Breeze wallpaper, centred avatar card | KDM Oxygen login | Ocean card over soft gradient | plain Breeze | Hanabi lock screen |
| scrollbars | 8 px pill α.5, accent on hover | 12 px gradient handle, groove | 6 px `#c7c6ca` pill | permanent 10 px with groove | thin white α.35 |
| focus | 2 px accent outline | outline plus Oxygen glow | 2 px `#2058c3` plus `#e9ebf8` halo | 3 px `#1e6fa5` plus gap | violet glow ring |
| badges | count text, red mention pill | Oxygen gradient pill | Ocean pills | dark-blue pills | glowing violet pills |
| code | Hack 13 px, View alt bg, Breeze hljs | Oxygen Mono, Kate-KDE4 colours | Hack, `#f5f3f7` r6 | Hack 14 px | Hack on `#141618/.8` |
| iframes | light/dark base frame r5 | light base | light base | light | dark base, glass frame |
| icons | Breeze 22 px mono | Oxygen colour PNG | Ocean 24 px 2 px stroke | Breeze | Breeze white |
| motion | 150 ms fades, KWin scale popups | 250 ms glow | 200 ms emphasized | 100 ms | Magic-Lamp-lite, glow |

Syntax highlighting uses Kate/KSyntaxHighlighting's "Breeze Light" and "Breeze Dark" themes:

| Token | Light | Dark |
|---|---|---|
| keyword | `#1f1c1b` bold | `#cfcfc2` bold |
| control flow | `#1f1c1b` | `#fdbc4b` |
| function | `#644a9b` | `#8e44ad` |
| string | `#bf0303` | `#f44f4f` |
| number | `#b08000` | `#f67400` |
| comment | `#898887` | `#7a7c7d` |
| type | `#0057ae` | `#2980b9` |
| preprocessor | `#006e28` | `#27ae60` |
| background | View alt | View alt |

These values are [M], from KSyntaxHighlighting `themes/breeze-*.theme`. Verify them in phase B.

## 6. Signature moves

1. **The unified header band with circular chevron window buttons**, including the red-circle close on hover.
2. **Window canvas plus View cards**: light-grey timeline with white 5 px message cards, as in NeoChat.
3. **Plasma-blue α 0.3 selection with a 1 px outline** everywhere: rooms, menus, spaces, settings tabs.
4. **Breeze push buttons**: 1 px outline, hairline shadow, outline turns `#3daee9` on hover. **Breeze check boxes**: a tinted fill with a blue tick.
5. **"Favourite ———— ⌃" Kirigami section headers**, ring-initials avatars and plain unread counts.

Per-variant extras:

| Variant | Extras |
|---|---|
| Daylight | Night Color warm overlay; Breeze Classic's dark titlebar at dusk |
| Oxygen | radial-lit window, glossy jelly buttons, blue glow, dark glass panel, KDE 4 logo |
| Ocean | left-hand traffic-light circles, pill selection, filled CTA, `#2058c3` tonal ramp, Inter |
| Glass | Hanabi wallpaper through KWin blur; floating panel; accent-from-wallpaper glow |

## 7. What cannot be themed, and workarounds

| Limit | Workaround |
|---|---|
| Element Call and widgets are iframes (light/dark only) | `base` = light for B-light, O, Oc, U and dark for B-dark, G. Frame `.mx_AppTile` / `.mx_CallView` as a Breeze group box (r5, outline). |
| A real window titlebar is impossible in a browser tab | The decorative enhancer titlebar has only fullscreen behind maximise. It is hidden when `display-mode: standalone` (Element Desktop / PWA already has an OS titlebar) or the viewport is under 600 px tall. |
| Compound icons are inline SVG | Per-button `::before` mask with Breeze, Ocean or Oxygen assets, keyed on `aria-label` (English locale only). Other locales fall back to recoloured Compound icons. Phase B: also key on stable `mx_` classes where they exist. |
| Element's `body { font … !important }` and FontWatcher inline font vars | Set `--cpd-font-family-sans` with `!important` on html and body. |
| Default avatars as data-URLs (notifications, favicon) | Not possible. Accepted. |
| Native `<select>` and date pickers | `accent-color` and `color-scheme` only. |
| Hashed shared-component classes (room list items, tiles, badges) | `[class*="_roomListItem_"]` etc., with the version shim from research §3.2. |
| Plasma's per-user accent colour | Fixed `#3daee9`. Glass simulates "accent from wallpaper" with a fixed violet. |
| `backdrop-filter` cost (glass) | Only on large panes. Opaque fallback under `@supports`. Never on tiles. |
| The real KDE Kirigami "page row" sliding columns | Approximated: narrow widths keep Element's own responsive behaviour. No custom column paging (React owns the DOM). |

## 8. Enhancer plan (`themes/kde/enhance.ts`, phase B)

One family enhancer. Per variant, `ctx.variant.id` selects the deco style.

1. **Titlebar overlay** (all variants except usable). Appended to `ctx.root`, fixed top, height `--kde-titlebar-h`.
   - **Styles:** `breeze` (chevrons right), `oxygen` (jelly circles right, title bold), `ocean` (traffic lights left), `glass` (breeze plus blur).
   - **Content:** the title mirrors `document.title` through a MutationObserver on `<title>`, then becomes "Room — Element".
   - **Behaviour:** buttons are aria-hidden. Maximise calls `document.documentElement.requestFullscreen()` and toggles. Minimise and close are inert, with `cursor: default`.
   - **Dark-titlebar case:** the enhancer sets `html[data-kde-titlebar]` so CSS can offset `#matrixchat` and push the space panel down. The daylight dusk phase changes the titlebar colour (Breeze Classic dark).
2. **Plasma digital clock** (breeze ×3, oxygen, glass) at the bottom of the space column, above the user/quick-settings buttons.
   - Plasma style: 2 lines `14:26` / `Sat 15`, Noto Sans 12 px.
   - Updates every 30 s. Hidden if the space panel is collapsed below 48 px.
   - Stays in the CSS layer as a pure overlay in `ctx.root`, positioned using `getBoundingClientRect` of `.mx_SpacePanel` on resize.
3. **Initials-avatar ring tint:** a CSS-only `color-mix()` from `--cpd-color-text-decorative-N`, so no enhancer is needed.

`unmount()` removes the overlay, clock, observers, intervals and attributes. Everything is wrapped in try/catch (CONTRACT §5).

## 9. Notes for phase B

- Start with kde-breeze-light completely, including all controls. The other Breeze variants are mostly token swaps plus the dusk deco.
- Write `shared.css` around custom properties: `--kde-window`, `--kde-view`, `--kde-header`, `--kde-rail`, `--kde-text`, `--kde-muted`, `--kde-accent`, `--kde-outline`, `--kde-link`, `--kde-radius`, `--kde-shadow-btn`, `--kde-sel-bg`, `--kde-sel-line`. Variant files mostly set those, so Breeze Light, Dark and Classic stay one rule set.
- Verify the Breeze hljs colours in KSyntaxHighlighting `breeze-light.theme` and `breeze-dark.theme`.
- Screenshot comparison targets: `refs/kde/neochat-application.png` (layout, colours), Ocean component PNGs (`refs/kde/oceandesign-*.png`).

## 10. Sources

Visual and value sources:

| Source | URL | Licence or use |
|---|---|---|
| Breeze colour schemes and kstyle | https://invent.kde.org/plasma/breeze (`colors/*.colors`, `kstyle/breezehelper.cpp`, `kstyle/breezemetrics.h`) | GPL-2.0+ code; values used as reference |
| Breeze wallpaper "Hanabi" | https://invent.kde.org/plasma/breeze/-/tree/master/wallpapers/Next | CC-BY-SA-4.0, shipped (resized to webp) |
| Breeze icons v6.32.0 | https://github.com/KDE/breeze-icons | LGPL-3.0-or-later, shipped |
| Oxygen colours | https://invent.kde.org/plasma/oxygen | reference |
| Oxygen icons | https://github.com/KDE/oxygen-icons | LGPL-3.0, shipped (48 px PNG) |
| Ocean design system | https://invent.kde.org/abetts/ocean-design | colour scheme, component specs and README read; icons shipped, licence see README; window decoration GPL-2+ (not shipped, colours only) |
| Ocean May 2026 update | https://planet.kde.org/andres-betts-2026-05-22-ocean-design-for-plasma-may-updates/ | reference |
| "What even is Ocean" | https://planet.kde.org/andres-betts-2026-05-31-what-even-is-ocean/ | reference |
| Union summer 2026 | https://planet.kde.org/arjen-hiemstra-2026-08-05-union-summer-2026-update/ | reference |
| Akademy 2026 talk, "Ocean Design: Build Phase!" | https://conf.kde.org/event/11/contributions/310/ | reference |
| KDE goal "Next Generation Styling" | https://invent.kde.org/teams/goals/goal-setting/2026/-/work_items/3 | reference |
| NeoChat screenshots | https://apps.kde.org/neochat/ (cdn.kde.org/screenshots/neochat/*) | reference only, saved in refs/ |
| KDE HIG | https://develop.kde.org/hig/ | reference |

Fonts:

| Font | Source | Licence |
|---|---|---|
| Noto Sans | Fedora `google-noto-vf`, from notofonts/latin-greek-cyrillic | OFL-1.1, subset |
| Inter | https://github.com/google/fonts/tree/main/ofl/inter | OFL-1.1, subset |
| Oxygen and Oxygen Mono | https://github.com/google/fonts/tree/main/ofl/oxygen | OFL-1.1 |
| Hack v3.003 | https://github.com/source-foundry/Hack | MIT + Bitstream Vera |
