# 01 – Element Web theme system: deep technical analysis

Research date: 2026-11-15. Read-only. Source: `/var/home/t/projects/element/element-web` (monorepo, `main` @ `f0bdf08fa3`,
2026-11-06). Line numbers refer to `main` unless a tag is given. Live checks against `https://element.datanauten.de`
(anonymous `curl` of `/`, `/version`, `config.json`, `bundle.css`, `theme-light.css`, `element-web-app.js`).

---

## 0. TL;DR

| Question | Answer |
|---|---|
| What runs in production? | `element.datanauten.de/version` → **1.12.33** (upstream image; the 1.12.27 fork was dropped on 2026-10-24, see `02-infra.md`). Module API **2.3.0**, compound-design-tokens **11.2.0**. Main = 1.12.34-rc, module API 2.4.0, tokens 11.3.0. **Target 1.12.33 first; treat 1.12.27 as legacy.** |
| How are themes switched? | `<link data-mx-theme=… disabled>` per built-in theme in `index.html`; `setTheme()` (`apps/web/src/theme.ts:327`) enables one, sets `body.cpd-theme-{light,dark}[-hc]`, and for `custom-*` themes injects CSS vars on `body.style` + two `<style title=…>` elements. |
| Custom themes (config) | `setting_defaults.custom_themes[]`: `{name, is_dark, colors{}, fonts{faces,general,monospace}, compound{"--cpd-…": value}}`. `compound` is the only key that reaches the modern UI reliably. Live config already ships 24 of them (Catppuccin, Nord…). |
| Strongest lever for a module | **CSS cascade layers.** All Element CSS lives in `@layer compound-tokens, compound-web, shared-components, app-web`. A module's **unlayered** `<style>` beats every Element rule regardless of specificity (except layered `!important`, 147 of them). |
| Selectors | `mx_*` classes are stable in `apps/web`. Since **1.12.28** the event tile, room list, timeline bits, user menu, badges … are **shared-components CSS modules** with hashed names `._stateBubbleContainer_t6spj_375` → select with `[class*="_stateBubbleContainer_"]`. `data-testid` is **stripped in production** for `apps/web` (`webpack.config.ts:315`). |
| Module API | No theme API, no settings-tab API, no menu API, `settings` is read-only. Has: `load()` before render, `rootNode`/`createRoot`, `openDialog`, `client.accountData.get/set` (after login), `i18n`, `extras.addRoomHeaderButtonCallback`, `extras.setSpacePanelItem`, `customComponents.registerMessageRenderer/registerLoginComponent/…`, `builtins.renderRoomView` (!). |
| CSP | `style-src 'self' 'unsafe-inline'` (inline `<style>` fine, same-origin `<link>` fine), `font-src 'self' data:` (self-host or data: URIs; **no Google Fonts**), `img-src *`. |
| Recommendation | One loader module: token layer (`--cpd-*` overrides on `:root, [class*="cpd-theme-"]`), unlayered full-CSS layer, optional "first-layer `!important`" sheet, self-hosted fonts, a `data-tl-theme` attribute on `<html>` for CSS scoping, per-account choice in account data `de.datanauten.theme_loader`, local cache for FOUC, a picker injected as its own User-Settings tab (pattern from `remote-modules`), clock scheduler for daylight variants, and a selector-compat shim per Element version. |

---

## 1. Theme machinery

### 1.1 Built-in themes and how they are bundled

`apps/web/webpack.config.ts:55-63` builds one CSS entry per theme:

```ts
const cssThemes = {
    "theme-legacy-light": "./res/themes/legacy-light/css/legacy-light.pcss",
    "theme-legacy-dark": "./res/themes/legacy-dark/css/legacy-dark.pcss",
    "theme-light": "./res/themes/light/css/light.pcss",
    "theme-light-high-contrast": "./res/themes/light-high-contrast/css/light-high-contrast.pcss",
    "theme-dark": "./res/themes/dark/css/dark.pcss",
    "theme-light-custom": "./res/themes/light-custom/css/light-custom.pcss",
    "theme-dark-custom": "./res/themes/dark-custom/css/dark-custom.pcss",
};
```

`apps/web/src/vector/index.html:35-41` emits each as a disabled link (live site shows exactly these 7):

```html
<link rel="stylesheet" disabled="disabled" data-mx-theme="Light" title="Light" href="bundles/<hash>/theme-light.css">
```

The user-visible list (`theme.ts:95-116`, `enumerateThemes`) is only `light`, `light-high-contrast`, `dark` plus
`custom-<name>` for every entry of the `custom_themes` setting. `legacy-*` are only used as the *base* of custom themes.
High contrast exists only for light (`HIGH_CONTRAST_THEMES = { light: "light-high-contrast" }`, `theme.ts:32-34`).

Each theme file is a thin wrapper that pins the **cascade-layer order** and imports into `app-web`
(`res/themes/light/css/light.pcss:1-9`, identical in 1.12.27):

```css
@layer compound-tokens, compound-web, shared-components, app-web;
@import "../../../../res/css/_font-sizes.pcss" layer(app-web);
@import "_fonts.pcss" layer(app-web);
@import "_light.pcss" layer(app-web);
@import "_mods.pcss" layer(app-web);
@import "../../../../res/css/_components.pcss" layer(app-web);
@import url("highlight.js/styles/atom-one-light.min.css") layer(app-web);
@import url("github-markdown-css/github-markdown-light.css") layer(app-web);
```

The always-on `bundle.css` (`res/css/_index.pcss:21-26`) carries the tokens and Compound components:

```css
@layer normalize, compound-legacy, compound-tokens, compound-web, shared-components, app-web;
@import url("maplibre-gl/dist/maplibre-gl.css") layer(app-web);
@import url("@vector-im/compound-design-tokens/assets/web/css/compound-design-tokens.css") layer(compound-tokens);
@import url("@vector-im/compound-web/dist/style.css") layer(compound-web);
@import url("@element-hq/web-shared-components/dist/element-web-shared-components.css"); /* self-layers into shared-components */
```

Live `bundle.css` confirms the order `compound-tokens, compound-web, shared-components, app-web, element-call`, plus
Compound's own nested `@layer cpd-semantic, custom, cpd-base` inside `compound-tokens`.

> **Consequence:** every Element rule is layered. Unlayered author CSS wins over all of them for normal declarations.
> This is the single most important fact for a theme loader.

### 1.2 `setTheme()` step by step (`apps/web/src/theme.ts:327-444`, unchanged since 1.12.27)

1. No arg → `new ThemeWatcher().getEffectiveTheme()`.
2. `clearCustomTheme()` (`:135-152`): removes **every inline `--*` property on `document.body`** except
   `--cpd-font-family-sans` / `--emoji-font-family` (FontWatcher's), and removes `style[title='custom-theme-font-faces']`
   and `style[title='custom-theme-compound']`. → *A module must never store its vars on `body.style`; they get wiped on
   every theme change.* Own `<style>` elements are left alone.
3. `custom-<name>` → stylesheet `dark-custom` or `light-custom` (by `is_dark`), then `setCustomThemeVars()`.
4. Enables the matching `<link data-mx-theme>`, waits for load (polls 10×200 ms), disables the others.
5. Sets the Compound class on body (`:371-379`):

```ts
document.body.classList.remove("cpd-theme-light", "cpd-theme-dark", "cpd-theme-light-hc", "cpd-theme-dark-hc");
let compoundThemeClassName = `cpd-theme-` + (stylesheetName.includes("light") ? "light" : "dark");
if (isHighContrastTheme(theme) || window.matchMedia("(prefers-contrast: more)").matches) compoundThemeClassName += "-hc";
document.body.classList.add(compoundThemeClassName);
```

6. Copies computed `body` background into `<meta name="theme-color">` (`:392-396`) — our theme's background will
   propagate to the mobile browser chrome automatically if we style `body`.

There is **no `data-theme` attribute**; the only theme markers in the DOM are the `cpd-theme-*` class on `<body>` and which
`<link data-mx-theme>` is not disabled.

Who calls it: `vector/init.tsx:121` (`loadTheme`, before modules load), `MatrixChat.tsx:489-492` (ThemeWatcher `change`
→ `setTheme`), `MatrixChat.tsx:1659-1660` (again after account data, so account-level `custom_themes` apply).

### 1.3 ThemeWatcher & "match system theme" (`apps/web/src/settings/watchers/ThemeWatcher.ts`)

- Watches settings `theme`, `use_system_theme`, media queries `prefers-color-scheme: dark|light`, `prefers-contrast: more`,
  and dispatcher action `recheck_theme` (`Action.RecheckTheme`, payload `forceTheme`) (`:50-77`).
- `getEffectiveTheme()` (`:87-126`): explicit DEVICE-level `use_system_theme` → system; else explicit DEVICE-level
  `theme`; else defaults (`use_system_theme` default **true**, `Settings.tsx:984-988`). System mapping only yields
  `dark`, `light`, `light-high-contrast` (`:139-153`) — **never a custom theme**. So with "match system" on (the default!)
  a custom theme picked in the UI is ignored until the user unticks it.
- `isUserOnDarkTheme()` for custom themes reads `is_dark`.

### 1.4 Settings and levels (`apps/web/src/settings/Settings.tsx`)

| Setting | Levels | Default | Line |
|---|---|---|---|
| `theme` | DEVICE > ACCOUNT > CONFIG | `"light"` (+`ThemeController` resets unknown names to `light`) | 973-977 |
| `custom_themes` | DEVICE > ACCOUNT > CONFIG | `[]`, not exported to rageshakes | 978-983 |
| `use_system_theme` | DEVICE only | `true` | 984-988 |
| `useBundledEmojiFont` | DEVICE | `true` | 989-994 |
| `useSystemFont` / `systemFont` | DEVICE | `false` / `""` | 995-1010 |
| `layout` | DEVICE > ACCOUNT > CONFIG | `Layout.Group` (`irc` / `group` / `bubble`) | 1333-1336 |
| `useCompactLayout` | account | false (only with group layout) | 821-825 |
| `fontSizeDelta` | device | 0 (FontWatcher sets `:root{font-size}`) | – |

`LEVELS_ACCOUNT_SETTINGS = [DEVICE, ACCOUNT, CONFIG]` (`:86`). The Appearance panel writes `theme` at **DEVICE** level
(`ThemeChoicePanel.tsx:104`) → the built-in theme choice is per device, not per account. Account level lives in account
data `im.vector.web.settings` (`AccountSettingsHandler.ts:28`), device level in `localStorage["mx_local_settings"]`.

**Value precedence is replace, not merge:** if anything writes an account-level `custom_themes`, the 24 config-level themes
disappear from the picker.

Feature flags: none gate theming. Related labs flags on main/1.12.33: `feature_new_timeline` (new `NewTimelinePanel`,
different DOM), `feature_element_call_react` (Element Call rendered in-page instead of iframe), `feature_pdf_viewer`.
1.12.27 had none of these three.

### 1.5 `custom_themes` – exact schema and what each key does

Type (`theme.ts:48-66`):

```ts
export type CustomTheme = {
    name: string;              // id becomes "custom-" + name
    is_dark?: boolean;         // picks dark-custom vs light-custom base, cpd-theme-dark vs -light, widget theme
    source_url?: string;       // set by /devtools → Custom themes (re-download)
    colors?: { [key: string]: string };   // arrays allowed (username-colors, avatar-background-colors)
    fonts?: { faces: IFontFaces[]; general: string; monospace: string };
    compound?: { [token: string]: string };
};
```

How keys are applied (`setCustomThemeVars`, `:252-304`):

- `colors.X: "#hex"` → `body.style.setProperty("--X", hex)` plus `--X-0pct`, `--X-15pct`, `--X-50pct` (alpha variants,
  hex only). Arrays → `--X_0 … --X_n` (no pct).
- `fonts.faces` → `@font-face` rules in `<style title="custom-theme-font-faces">` (allowed props: `font-display`,
  `font-family`, `font-stretch`, `font-style`, `font-weight`, `font-variant`, `font-feature-settings`,
  `font-variation-settings`, `src` [`{url|local, format}`], `unicode-range`).
- `fonts.general` → `--font-family`, `fonts.monospace` → `--font-family-monospace`.
- `compound` → `<style title="custom-theme-compound">` with
  `@layer compound-tokens { :root, [class*="cpd-theme-"] { --cpd-…: value; } }` (`:205-220`). Keys must match
  `/^--cpd-[a-z0-9-]+$/` — **any** name passes, including made-up ones like `--cpd-tl-theme-id` (useful as a marker, §7).

Which `colors` keys are honoured: only those the base stylesheet reads, i.e. `res/themes/light-custom/css/_custom.pcss`
(applied on top of `legacy-light` / `legacy-dark`):

| `colors` key | maps to legacy `$vars` (examples) |
|---|---|
| `accent-color` (+ `-100…-1400` scale) | `$accent`, `$accent-NNN` |
| `primary-color` | `$accent-alt` |
| `warning-color` | `$button-danger-disabled-bg-color` |
| `alert`, `links`, `primary-content`, `secondary-content`, `tertiary-content`, `quaternary-content`, `quinary-content`, `system`, `system-transparent`, `background`, `panels`, `panels-actions` | same-named `$vars` |
| `sidebar-color` | `$spacePanel-bg-color`, `$tooltip-timeline-bg-color`, `$dialog-backdrop-color` (50pct) |
| `roomlist-background-color` | `$header-panel-bg-color`, `$roomlist-bg-color`, `$secondary-accent-color`, `$panel-gradient` … |
| `roomlist-highlights-color` | `$panel-actions` |
| `roomlist-separator-color` | `$primary-hairline-color`, `$input-darker-bg-color` |
| `timeline-background-color` | `$background`, `$menu-bg-color`, `$roomheader-bg-color`, `$message-action-bar-bg-color` |
| `timeline-text-color` / `timeline-text-secondary-color` | `$primary-content`, `$roomtopic-color` / `$light-fg-color`, `$settings-subsection-fg-color` |
| `timeline-highlights-color` | `$event-selected-color`, `$event-highlight-bg-color` |
| `eventbubble-self-bg`, `eventbubble-others-bg`, `eventbubble-bg-hover` | bubble layout |
| `reaction-row-button-selected-bg-color`, `menu-selected-color`, `other-user-pill-bg-color`, `icon-button-color`, `strong-input-border-color`, `focus-bg-color`, `room-highlight-color`, `togglesw-off-color`, `secondary-hairline-color` | same |
| `username-colors[]` | `--username-colors_N` (legacy) |
| `avatar-background-colors[]` | `--avatar-background-colors_N` — read by `Avatar.ts:116-119`, **but buggy**: `cssValue \|\| isDarkTheme() ? DARK : LIGHT` parses as `(cssValue \|\| isDarkTheme()) ? …`, so the custom value is never used. |

Limits of `colors`: they only feed `$legacy` variables. All UI that moved to Compound tokens or shared-components CSS
modules (room list, event tiles on ≥1.12.28, badges, menus, tooltips, buttons) ignores them; only `compound` reaches it.
Custom themes are built on `legacy-*` which defaults to **Nunito** (`legacy-light/_legacy-light.pcss:13-15`) unless
`fonts.general` is set. Fonts can only come from `'self'` or `data:` (CSP).

Live example (already deployed, Nord dark):
`{"name":"Nord dark theme","is_dark":true,"colors":{…13 keys…},"compound":{"--cpd-color-bg-canvas-default":"#434c5e","--cpd-color-text-primary":"#eceff4",…}}`.

**Verdict:** `custom_themes` is good for ~30 % of what we want (palette + one font). It cannot add arbitrary CSS, layout,
images, icons, per-theme behaviour, or clock switching. Use it at most as a *registration channel* (so our themes show in
Appearance), not as the rendering mechanism.

---

## 2. Design tokens

### 2.1 Where tokens come from and how they cascade

- `@vector-im/compound-design-tokens` (1.12.27: 10.2.1, 1.12.33: 11.2.0, main: 11.3.0), file
  `assets/web/css/compound-design-tokens.css`. Base palettes are declared on `.cpd-theme-light.cpd-theme-light`
  (doubled for specificity) and media-query variants on `:root`; semantic tokens on `:root, [class*="cpd-theme-"]`.
- Element pins `--cpd-font-family-sans` to its own `$font-family` (`_common.pcss:66-77`,
  `[class^="cpd-theme"][class^="cpd-theme"] { --cpd-font-family-sans: $font-family; }`) and forces
  `body { font: var(--cpd-font-body-md-regular) !important; }` (`_common.pcss:95-110`).
- `FontWatcher` writes `--cpd-font-family-sans` and `--emoji-font-family` **inline on `<body>`** when "use system font" /
  bundled emoji is on (`FontWatcher.ts:96-135`), and `:root { font-size }` for font scaling.
- **Elements that re-declare a theme class** (and therefore re-declare all base tokens on themselves):
  `NotificationBadgeView.tsx:107` adds `cpd-theme-light` to every non-dot badge;
  `ErrorView.tsx:31` (`mx_ErrorView cpd-theme-light`); `ThemeChoicePanel.tsx:127-128` previews; `HtmlExport.tsx:167`.
  → token overrides must target `:root, [class*="cpd-theme-"]`, not just `body`.

Composite gotcha: `--cpd-font-body-md-regular: var(--cpd-font-weight-regular) var(--cpd-font-size-body-md)/… var(--cpd-font-family-sans)`
is resolved where it is *declared* (on every `[class*="cpd-theme-"]`). Overriding `--cpd-font-family-sans` on a
descendant like `.mx_RoomView` does nothing for composites; override it on the same selector as the tokens.

Tokens added in 11.x that **do not exist in 1.12.27** (10.2.x): `bg-accent-subtle`, `bg-subtle-tertiary`,
`bg-success-rest|hovered|pressed`, `border-interactive-pressed`, `border-success-primary`, `icon-warning-primary`,
`text-action-success`, `text-warning-primary`. Always set them anyway (harmless when unused).

There are **no radius tokens** in Compound. Element hard-codes radii (`border-radius: 8px` ×90, `4px` ×39, `50%` ×24 …).
Compound components expose a few component vars: `--cpd-avatar-radius` (set per avatar: `[data-type=round]` 50 %,
`[data-type=square]` 25 %), `--cpd-avatar-size`, `--cpd-avatar-bg/color`, `--cpd-icon-button-size`,
`--cpd-separator-*`, `--cpd-menu-*`, `--cpd-progress-bar-*`, `--cpd-switch-*`.

### 2.2 Usage frequency (what actually drives the UI)

Counts across `apps/web/res/css` + `packages/shared-components/src` (`.pcss`, `.module.css`), direct `var(--cpd-…)`:
`text-secondary` 89, `text-primary` 57, `bg-subtle-secondary` 50, `bg-canvas-default` 47, `icon-tertiary` 31,
`border-interactive-secondary` 28, `gray-400` 25, `bg-subtle-primary` 25, `icon-primary` 22, `icon-secondary` 21,
`text-critical-primary` 20, `bg-action-primary-rest` 20, `text-on-solid-primary` 19, `text-action-accent` 16 …

Legacy `$vars` in `res/css` (compiled at build time, but in light/dark they are *aliases of cpd tokens*):
`$secondary-content` 144 (→`--cpd-color-text-secondary`), `$primary-content` 116 (→`text-primary`), `$accent` 66
(→`text-action-accent`), `$background` 57 (→`bg-canvas-default`), `$quinary-content` 45 (→`gray-400`),
`$tertiary-content` 42 (→`gray-800`), `$alert` 41 (→`text-critical-primary`), `$system` 18 (→`bg-subtle-primary`).
So in the `light`/`dark` stylesheets, overriding cpd tokens also recolours most legacy rules. Only 74 literal colours
remain in `res/css` (list in §5).

Spacing: `--cpd-space-2x` 266, `-1x` 166, `-4x` 160, `-3x` 126 — all derive from `--cpd-space-scale: 4px`, but only
`-1x` is defined as `var(--cpd-space-scale)`; the rest are literal px. Typography: `--cpd-font-weight-semibold` 101,
`--cpd-font-body-md-regular` 53, `--cpd-font-body-sm-regular` 30.

### 2.3 The ~40 most impactful tokens for a theme

| # | Token | Drives |
|---|---|---|
| 1 | `--cpd-color-theme-bg` | base of canvas/on-solid; many semantic tokens alias it |
| 2 | `--cpd-color-bg-canvas-default` | timeline, dialogs, menus, body background, `$background` |
| 3 | `--cpd-color-bg-canvas-default-level-1` | raised canvas (light/dark differ) |
| 4 | `--cpd-color-bg-subtle-secondary` | left panel / room list background, hover rows, `$panels`, selected event |
| 5 | `--cpd-color-bg-subtle-primary` | space panel, header panels, inline code bg, `$system` |
| 6 | `--cpd-color-bg-subtle-tertiary` (11.x) | very subtle fills |
| 7 | `--cpd-color-bg-action-primary-rest` / `-hovered` / `-pressed` / `-disabled` | primary buttons, toggles, pills (`$pill-bg-color`), inverted bg |
| 8 | `--cpd-color-bg-action-secondary-rest` / `-hovered` / `-pressed` | secondary buttons, header hover |
| 9 | `--cpd-color-bg-action-tertiary-hovered` / `-selected` | menu items, list rows (room list selected) |
| 10 | `--cpd-color-bg-accent-rest` / `-hovered` / `-pressed` / `-selected` | accent buttons, send button, unread highlight |
| 11 | `--cpd-color-bg-critical-primary` / `-subtle` | destructive buttons, mention badge, errors |
| 12 | `--cpd-color-bg-success-subtle` | verified banners |
| 13 | `--cpd-color-bg-info-subtle` | info banners |
| 14 | `--cpd-color-bg-decorative-1…6` | **default avatars** (background), username pills |
| 15 | `--cpd-color-bg-badge-default/-accent/-info/-critical` | Compound badges |
| 16 | `--cpd-color-text-primary` | body text, room names, message bodies |
| 17 | `--cpd-color-text-secondary` | timestamps, previews, captions, read-receipts text, `$secondary-content` |
| 18 | `--cpd-color-text-disabled` | disabled labels |
| 19 | `--cpd-color-text-action-accent` | links-as-actions, `$accent`, accent text |
| 20 | `--cpd-color-text-action-primary` | button text |
| 21 | `--cpd-color-text-link-external` | links in messages, `$links` |
| 22 | `--cpd-color-text-on-solid-primary` | text on solid buttons / badges |
| 23 | `--cpd-color-text-critical-primary` / `-success-primary` / `-info-primary` / `-warning-primary` | status text, E2EE warnings |
| 24 | `--cpd-color-text-decorative-1…6` | **usernames** (`mx_Username_colorN`), avatar initials |
| 25 | `--cpd-color-icon-primary` / `-secondary` / `-tertiary` / `-quaternary` | all inline-SVG icons via `currentColor` |
| 26 | `--cpd-color-icon-accent-primary` / `-accent-tertiary` | accent icons, unread dots, E2EE shield (verified) |
| 27 | `--cpd-color-icon-critical-primary` / `-success-primary` / `-info-primary` | shields, warnings, badges |
| 28 | `--cpd-color-icon-on-solid-primary` | icons on solid buttons, location marker |
| 29 | `--cpd-color-border-interactive-primary` / `-secondary` / `-hovered` | inputs, composer, cards, dividers |
| 30 | `--cpd-color-border-focused` | focus rings |
| 31 | `--cpd-color-border-critical-*`, `-success-subtle`, `-accent-*`, `-disabled` | validation |
| 32 | `--cpd-color-separator-primary` / `-secondary` | menu/list separators |
| 33 | `--cpd-color-gray-400`, `gray-800`, `gray-300`, `gray-200` | used *directly* (base palette): hairlines, `$quinary-content`, `$tertiary-content` |
| 34 | `--cpd-color-alpha-gray-*` | hovers, `$panel-actions`, overlays |
| 35 | `--cpd-color-green-*` (100–1400) | `$accent-NNN` scale used by legacy accent fills — re-map to theme accent |
| 36 | `--cpd-color-gradient-*` | onboarding/empty states/info cards |
| 37 | `--cpd-font-family-sans` | all UI text (override on `:root,[class*="cpd-theme-"]` **and** `!important` to beat FontWatcher's inline value) |
| 38 | `--cpd-font-family-mono` + selector override for `pre, code` (Element compiles `$monospace-font-family` as a literal in light/dark) | code |
| 39 | `--cpd-font-size-root` / `:root{font-size}` (FontWatcher), `--cpd-font-size-body-*`, `--cpd-font-weight-*`, `--cpd-font-letter-spacing-*` | type scale |
| 40 | `--emoji-font-family` | emoji font (Twemoji or system) |
| 41 | `--cpd-space-scale` & `--cpd-space-Nx` | density (only partially effective, most are literal) |
| 42 | `--cpd-avatar-radius` (selector on avatar) | round vs square avatars |

Element-local custom properties worth knowing (`_common.pcss:15-45`): `--MBody-border-radius`, `--EventTileBubble_margin-block`,
`--MessageTimestamp-width`, `--transition-short`/`--transition-standard`, `--dialog-zIndex-*`, `--container-gap-width`;
`--roomtile-default-badge-bg-color` (NotificationBadgeView).

---

## 3. Selector stability

### 3.1 Three naming regimes

1. **`mx_*` BEM-ish classes** in `apps/web` (360 `.pcss` files). Stable for years, the de-facto theming API
   (datanauten modules rely on e.g. `.mx_TabbedView_tabLabels`, `aria-controls^="mx_tabpanel_USER_"`).
2. **CSS modules in `packages/shared-components`** (101 `.module.css` on main, 92 already at 1.12.27) and
   **compound-web** (`dist/style.css`). Built by Vite → class names `_<local>_<hash5>_<line>`:
   live: `._stateBubbleContainer_t6spj_375`, `._roomListItem_vaz9j_8`, `._avatar_va14e_8`, `._button_1nw83_8`.
   Hash changes per release, local name changes only on refactor. Use substring selectors:
   `[class*="_stateOwnEvent_"]`. Many shared components *also* carry a legacy `mx_` class
   (24 kept: `mx_EventTile`, `mx_EventTile_line`, `mx_RoomListItemView`, `mx_MessageTimestamp`, `mx_ReplyTile`,
   `mx_DisambiguatedProfile_displayName`, `mx_Username_colorN`, `mx_MessageActionBar`, `mx_EmojiPicker`,
   `mx_TimelineView_list`, `mx_TimelineView_tile` …).
3. **`data-testid`**: ~200 distinct in source, but `apps/web/webpack.config.ts:315` runs
   `babel-plugin-jsx-remove-data-test-id` for minified builds → **gone in production** (verified: live
   `element-web-app.js` contains one, dynamically built). Shared-components are pre-built by Vite without that plugin,
   so their testids (`event-tile`, `event-tile-slot-avatar`, …) *probably* survive — unverified, don't depend on it.
   Prefer ARIA/role/Radix attributes: `[role="tooltip"]`, `[role="menu"]`, `[role="dialog"]`,
   `[data-radix-popper-content-wrapper]`, `[data-state="open"]`, `[aria-controls^="mx_tabpanel_USER_"]`.

### 3.2 The 1.12.27 → 1.12.28+ break (event tiles)

Commit `4dacb8b4ca` "Move EventTile to shared components" (2026-08-31, first in **v1.12.28**). In 1.12.27 a tile had:

```
.mx_EventTile[data-layout="bubble"][data-self="true"].mx_EventTile_bubbleContainer.mx_EventTile_continuation
.mx_EventTile_highlight .mx_EventTile_selected .mx_EventTile_lastInSection .mx_EventTile_info .mx_EventTile_emote
.mx_EventTile_bad .mx_EventTile_noSender .mx_EventTile_mediaLine .mx_EventTile_sticker  (EventTileDerivedState.ts:449-494)
```

On 1.12.33/main only `mx_EventTile` + `mx_EventTile_line` remain; states are CSS-module classes
(`EventTileView.tsx:98-128`): `_root_ _stateOwnEvent_ _stateInfo_ _stateBubbleContainer_ _stateLeftAlignedBubble_
_stateAlignedBetweenBubbles_ _stateNoBubble_ _stateNoSender_ _stateEncryptionFailure_ _stateEmote_ _stateHasReply_
_stateHighlighted_ _stateSelected_ _stateEditing_ _stateContinuation_ _stateLastInSection_ _stateContextual_
_stateActionBarFocused_ _densityCompact_ _layoutGroup_ _layoutBubble_ _layoutIrc_ _shapeThread_ _shapeThreadsList_
_shapeCard_ _shapeSearch_ _shapeFile_ _shapeNotification_`; slots `_slotAvatar_ _slotSender_ _slotBody_ _slotTimestamp_
_slotPadlock_ _slotReplyChain_ _slotActionBar_ _slotFooter_ _slotThreadInfo_ _slotReceipt_`; tiles keep
`data-event-id`, `data-scroll-tokens`. `data-layout` moved to containers: `RoomView.tsx:2766`
(`.mx_RoomView_body[data-layout="bubble"]`-style wrapper) and `GenericEventListSummary.tsx:69,119`; IRC still adds
`.mx_IRCLayout` on `.mx_RoomView_messagePanel` (`RoomView.tsx:2120-2124`).

Shim (write rules once, expand per version):

```css
/* own message, both regimes */
.mx_EventTile[data-self="true"],                 /* ≤1.12.27 */
.mx_EventTile[class*="_stateOwnEvent_"] { … }    /* ≥1.12.28 */
/* bubble layout */
.mx_EventTile[data-layout="bubble"], [data-layout="bubble"] .mx_EventTile { … }
/* continuation */
.mx_EventTile_continuation, .mx_EventTile[class*="_stateContinuation_"] { … }
/* highlighted (mention) */
.mx_EventTile_highlight, .mx_EventTile[class*="_stateHighlighted_"] { … }
```

### 3.3 Region inventory (main/1.12.33; ✔ stable `mx_`, ◐ partly hashed, ✖ hashed/Radix only)

| Region | Selectors | Status |
|---|---|---|
| App shell | `#matrixchat` (= `api.rootNode`), `.mx_MatrixChat_wrapper`, `.mx_MatrixChat`, `.mx_MatrixChat_useCompactLayout`, `.mx_LeftPanel_outerWrapper`, `.mx_LeftPanel_wrapper`, `.mx_LeftPanel_panel`, `.mx_Separator[data-separator]`, `.mx_RoomView_wrapper` (`LoggedInView.tsx:665-737`) | ✔ |
| Space panel | `.mx_SpacePanel`, `.mx_SpaceButton`, `.mx_SpaceItem`, `.mx_SpaceTreeLevel`, `.mx_SpacePanel_toggleCollapse`, `.mx_QuickSettingsButton`, module items via `extras.setSpacePanelItem` | ✔ |
| Room list (new, default in both) | `.mx_LeftPanel_roomListContainer`, `.mx_RoomListPanel`, `.mx_RoomListItemView` (+`_selected`), header/filters/search are CSS modules (`_roomListItem_`, `RoomListHeaderView`, `RoomListPrimaryFilters`), `[role="treegrid"]`, `[role="listbox"]`, `[role="option"][aria-selected]` | ◐ |
| Room header | `.mx_RoomHeader`, `.mx_RoomHeader_heading`, `_info`, `_infoWrapper`, `_icon`, module buttons via `addRoomHeaderButtonCallback` | ✔ |
| Room/timeline | `.mx_RoomView`, `.mx_RoomView_body[data-layout]`, `.mx_MainSplit`, `.mx_RoomView_messagePanel(.mx_IRCLayout)`, `.mx_RoomView_timeline`, `.mx_RoomView_statusArea`, `.mx_TimelineView_list` (new timeline) | ✔ |
| Event tiles | `.mx_EventTile`, `.mx_EventTile_line`, `.mx_EventTile_body`, `.mx_EventTile_content`, `.mx_MessageTimestamp`, `.mx_DisambiguatedProfile`, `.mx_ReplyTile`, `.mx_MessageActionBar`, `.mx_ReactionsRow`, `.mx_ReadReceiptGroup`, states hashed | ◐ (1.12.27 ✔) |
| Composer (CIDER) | `.mx_MessageComposer`, `_row`, `_actions`, `_sendMessage`, `.mx_SendMessageComposer`, `.mx_BasicMessageComposer_input[contenteditable]`, `.mx_Autocomplete` | ✔ |
| Composer (WYSIWYG, labs) | `.mx_WysiwygComposer_Editor`, `_Editor_content`, `.mx_FormattingButtons_Button` | ✔ |
| Right panel | `.mx_RightPanel`, `.mx_BaseCard`, `.mx_RoomSummaryCard`, `.mx_MemberListView`, `.mx_UserInfo`, `.mx_ThreadPanel`, `.mx_ThreadView` | ✔ |
| User menu | `.mx_UserMenu` wrapper + `UserMenu.module.css` (hashed) + Compound `Menu` (Radix, `[role="menu"]`) | ◐ |
| Settings dialogs | `.mx_UserSettingsDialog`, `.mx_RoomSettingsDialog`, `.mx_SpaceSettingsDialog`, `.mx_TabbedView`, `.mx_TabbedView_tabLabel(_active)`, `.mx_TabbedView_tabPanel`, `.mx_SettingsTab`, `.mx_ThemeChoicePanel_*`, tab ids `mx_tabpanel_USER_APPEARANCE_TAB` etc. | ✔ |
| Modals | `#mx_Dialog_Container`, `#mx_Dialog_StaticContainer`, `.mx_Dialog_wrapper`, `.mx_Dialog_border` (Glass), `.mx_Dialog`, `.mx_Dialog_background`, `.mx_Dialog_header/_title`, `.mx_CompoundDialog`; Compound `Dialog` (Radix) for some newer flows | ✔/✖ |
| Context menus | `#mx_ContextualMenu_Container`, `.mx_ContextualMenu`, `.mx_IconizedContextMenu`; newer menus are Compound/Radix `[role="menu"]` portals | ◐ |
| Tooltips | Compound/Radix: `[role="tooltip"]`, `[data-radix-popper-content-wrapper]`, `._tooltip_…` | ✖ |
| Toasts | `.mx_ToastContainer`, `.mx_Toast_toast`, `.mx_Toast_title`, `.mx_Toast_body`, `GenericToast.module.css`, `.mx_NonUrgentToastContainer` | ◐ |
| Calls | `.mx_CallView`, `.mx_LegacyCallView`, `#mx_PersistedElement_container`, `[data-testid=element-call]` (stripped), Element Call **iframe** | ✔ shell / ✖ content |
| Widgets | `.mx_AppsDrawer`, `.mx_AppTile`, `.mx_AppTileMenuBar`, `.mx_AppTileBody`, iframe | ✔ shell / ✖ content |
| Login/registration | `.mx_AuthPage`, `.mx_AuthPage_modal(Content)`, `.mx_AuthHeader`, `.mx_AuthBody`, `.mx_AuthFooter`, `.mx_Login_*`, `.mx_ServerPicker`; plus `customComponents.registerLoginComponent` | ✔ |
| Welcome / home | `.mx_Welcome` (embedded `welcome.html`, `embedded_pages.welcome_url`), `.mx_HomePage`, `.mx_HomePage_default_buttons` | ✔ |
| Error / splash | `.mx_ErrorView.cpd-theme-light` (forced light), `.mx_CompatibilityPage`, `.mx_SplashPage`, spinner | ✔ |

---

## 4. Module API

### 4.1 Versions

| Element | runtime module API (`@element-hq/element-web-module-api`) | legacy build-time API | tokens |
|---|---|---|---|
| 1.12.27 | 1.17.0 | `@matrix-org/react-sdk-module-api` 2.4 via `build_config.yaml` (`init.tsx:150-155`) | 10.2.1 |
| 1.12.28 | 1.17.0 (EventTile moved) | same | 10.2.1 |
| 1.12.30 | 2.2.0 | removed in main by `6d644ffe78` (2026-09-11) | 10.2.1 |
| **1.12.33 (live)** | **2.3.0** | – | 11.2.0 |
| main | 2.4.0 (+`client.waitForClientStarted`, `documentPreviews`, `extras.setCreditsAttribution`, `x509`, room `isEncrypted`) | – | 11.3.0 |

"Module API ~2.x" on the fork means the runtime API was ≥2.0 there; stock 1.12.27 reports 1.17. Declare
`moduleApiVersion = "^1.14.0 || ^2.0.0"` (as `marcade` does) and feature-detect every call.

### 4.2 Loading and lifecycle

- `config.json` → `"modules": ["/element-modules/theme-loader/index.js?v=<hash>"]`.
- `vector/index.ts:160-178`: `loadConfig` → `loadLanguage` + **`loadTheme`** → **`loadPlugins`** → … → `loadApp`.
  So the built-in theme is applied **before** our module runs; first paint (spinner) uses Element's theme.
- `loadPlugins` (`init.tsx:163-179`): sets `window.React`, `import(src)` each URL sequentially, `ModuleLoader.load`
  checks shape + semver, then `start()` runs all `load()` in parallel and **awaits** them before rendering. A rejected
  `load()` = Element error screen.
- Module object: default-exported class with `static moduleApiVersion` and `async load()`; constructor gets `api`.
- Runtime only (no rebuild). Must be same-origin (`script-src 'self'`; live adds `blob:` for remote-modules).

### 4.3 What a module can do (2.3/2.4; 1.17 has the same core minus newer additions)

| Need | API | Notes |
|---|---|---|
| Inject CSS | none — plain DOM: `document.head.append(styleEl)` | allowed by `style-src 'unsafe-inline'`; `<link href="/element-modules/…/x.css">` also fine (same origin). `blob:`/`data:` stylesheet URLs are **not** allowed. |
| Fonts | `@font-face { src: url("/element-modules/theme-loader/xyz.woff2") }` or `data:` | `font-src 'self' data:`. MDAD deploy: one flat directory per module (no subdirs, see `02-infra.md`). |
| Images/backgrounds | any URL | `img-src *`. |
| Render React anywhere | `api.createRoot(el)`, `api.rootNode` (`#matrixchat`) | own overlays, decorative chrome (LCARS frame, taskbar). |
| Replace message rendering | `customComponents.registerMessageRenderer(filter, (props, Original) => …, hints)` | first match wins; datanauten suite uses a shared `_renderChain` on `window.deDatanautenTeamsSuite`. Can wrap every message (e.g. sketchy borders) — but heavy. |
| Replace login screen | `customComponents.registerLoginComponent((props, Original) => …)` | full custom login per theme possible. |
| Room preview bar, composer preview | `registerRoomPreviewBar`, `registerComposerPreview` | |
| Room header buttons | `extras.addRoomHeaderButtonCallback(roomId => <JSX/>)` | quick theme switcher button. |
| Space panel item | `extras.setSpacePanelItem(key, {icon,label,onSelected})` | another entry point for the picker. |
| Render a room elsewhere | `builtins.renderRoomView(roomId, {hideHeader, hideComposer, hideRightPanel, …})`, `renderRoomAvatar`, `renderNotificationDecoration` | enables *radically different layouts* (e.g. a Teams-like custom shell rendering Element's room view inside). |
| Dialog | `api.openDialog({title}, Component, props)` | Element `BaseDialog` chrome — fine for a picker. |
| Custom route | `navigation.registerLocationRenderer("theme-gallery", () => <Gallery/>)` | `#/theme-gallery` page. |
| Hide UI | `customisations.registerShouldShowComponent(c => …)` | limited `UIComponent` list. |
| Settings | `settings.getValue(name)` | **read-only**, no watch. |
| Per-account storage | `client.accountData.get(type)` → `Watchable`, `.set(type, content)` | throws until logged in (`MatrixClientPeg.safeGet()`); 2.4 adds `waitForClientStarted()`. |
| i18n | `i18n.register({key:{en,de}})`, `i18n.translate`, `i18n.language` | flat keys only (no `|`). |
| Config | `config.get("de.datanauten.theme_loader")` | validate at runtime. |

**Not available:** theme registration, settings-tab registration, user-menu entries, setting writes/watches, DOM
"slots" for arbitrary regions, global wrapper component (the legacy `WrapperLifecycle` died with the legacy API).
Workarounds used by existing datanauten modules: `MutationObserver` DOM injection (`remote-modules/src/settingsInjector.ts`
adds a full "Modules" tab to User Settings by appending `li.mx_TabbedView_tabLabel` + panel; `people-map`,
`profile-status` do similar), and the window globals `mxSettingsStore`, `mxDispatcher`, `mxMatrixClientPeg`,
`mxSdkContext` (`SettingsStore.ts:893`, `dispatcher.ts`, …) — internal, gate and degrade.

---

## 5. What cannot be themed easily

| Surface | How it's drawn | Rating | Approach |
|---|---|---|---|
| Compound icons (251 files) | inline `<svg fill="currentColor">` React components (svgr), no per-icon class | recolour **easy**, replace **with effort** | `color`/tokens; per-icon swap needs `:has(path[d^="M12 …"])` hacks or hiding svg + `::before` mask on the parent button (by aria-label/class). Global `filter` possible. |
| Legacy icons | 6 `mask-image` rules + `background-image: url(/res/img/…svg)` | with effort | override the URL in our CSS. |
| Emoji | font `Twemoji` (COLR, `--emoji-font-family`) or system | easy–effort | ship another emoji font (self-hosted) and set `--emoji-font-family` / `font-family`; SAS emoji are text. Custom reaction images (`feature_render_reaction_images`) are images. |
| Default avatars | Compound `Avatar` `[data-color=1..6]` → `--cpd-color-bg/text-decorative-N`; shape via `--cpd-avatar-radius` | easy | tokens + `[class*="_avatar_"][data-type] { --cpd-avatar-radius: 0 }`. `Avatar.ts` data-URL avatars (notifications/favicon) use hard-coded palettes (buggy custom override) — **not possible**. |
| User avatars / images / video | `<img>`/`<video>`, blurhash on `<canvas>` | with effort | CSS `filter` (grayscale, sepia, `url(#svgfilter)` for sketch/dither), borders/frames. Pixel content itself: not possible. |
| Element Call | `<iframe>` (theme param `light`/`dark` only, `Call.ts:911-912`), or in-page React component with `feature_element_call_react` (layer `element-call`) | not possible (iframe) / with effort (labs component) | frame/chrome around it only; `is_dark` picks EC light/dark. |
| Jitsi / widgets | `<iframe>`; theme via `$org.matrix.msc2873.client_theme` = `light`/`dark` (`WidgetMessaging.ts:106-123`) | not possible | style the `.mx_AppTile` frame. |
| Chat effects | `<canvas>` with hard-coded colours (`effects/*`, e.g. snowfall `#eaeaea`) | not possible | hide or filter `EffectsOverlay`. |
| Maps (location) | maplibre canvas, tiles from `map_style_url`/well-known | with effort | `filter` on `.maplibregl-canvas`; real restyling needs a different style URL (server config, not per theme). |
| PDFs (`feature_pdf_viewer`, main) | pdf.js-style rendering in `DocumentViewerView` | with effort (filter only) | |
| Code highlighting | highlight.js `.hljs-*` (atom-one-light/dark imported in theme CSS) | easy | override `.hljs-*`; monospace font by selector (`pre, code, .mx_EventTile_pre_container`). |
| Markdown in some views | `github-markdown-css` `.markdown-body` | easy | |
| Hard-coded colours in CSS | 74 literals, e.g. `_NonUrgentToastContainer.pcss:24` `#17191c`, `_LegacyCallView.pcss:30`, `_ImageView.pcss:116` `#21262c`, `_DevtoolsDialog.pcss:70/100/117`, `_MessageEditHistoryDialog.pcss:40-47`, `_Login.pcss:45`, `_LoginSplashView.pcss:18`, `_SpacePanel.pcss:306-326`, many `box-shadow rgb(0,0,0,…)` | easy | override per selector (unlayered wins). |
| Hard-coded colours in TS | `Avatar.ts:23-27`, effects; inline `style` with `--avatar-*` vars in pills (`editor/parts.ts:310-316`) | not possible / with effort | |
| Layered `!important` (147) | e.g. `body { font: … !important }` (`_common.pcss:97`), `_QuickSettingsButton.pcss`, `_AutocompleteInput.pcss` | with effort | override the *variable* they use, or the "first-layer important" trick (§7.3). |
| Portals | Modals, context menus, tooltips, toasts portal into `body` children | easy | they inherit body tokens; style by container id / role. |
| CSS-module hashed classes | shared-components, compound-web | with effort | `[class*="_local_"]` substring selectors, version shim. |
| Shadow DOM | none found (`attachShadow` 0 hits) | n/a | |
| Notification badges | `NotificationBadgeView` forces `cpd-theme-light` class on non-dot badges | with effort | override tokens on `[class*="cpd-theme-"]` (not only `body`), or style `[class*="_notificationBadge_"]` directly. |
| Favicon / tab badge | `favicon.ts` canvas | not possible (could be replaced by our own favicon swap) | |
| Spinner / splash before modules | built-in theme | with effort | cache-and-apply early in `load()`; anything before `load()` can't be changed. |
| `meta theme-color` | copied from `body` bg on `setTheme` | easy | re-set it ourselves after applying. |

---

## 6. Edge-case surfaces (test inventory)

**Layouts & display settings**
- Layout: `group` (default, `.mx_GroupLayout`-less; `_layoutGroup_`), `irc` (`.mx_IRCLayout`, `ircDisplayNameWidth`), `bubble` (`[data-layout=bubble]`, own vs others alignment, `eventbubble-*`).
- `useCompactLayout` (`.mx_MatrixChat_useCompactLayout`, `_densityCompact_`), font scaling (`fontSizeDelta` → `:root{font-size}`), "use system font" (inline `--cpd-font-family-sans` on body), bundled emoji on/off, high contrast (`light-high-contrast` + `cpd-theme-*-hc` also triggered by OS `prefers-contrast: more`), reduced motion (`prefers-reduced-motion` → `--transition-*: 0`, `ReducedMotionController`), dark/light OS switch with "match system" on/off.
- `feature_new_timeline` (labs; `NewTimelinePanel`, `.mx_TimelineView_list/_tile`), `feature_wysiwyg_composer`, `feature_element_call_react`.
- RTL: Element has no `dir=rtl` support (0 `[dir=rtl]` rules); test RTL *message content* (`dir="auto"` bodies), long Arabic/Hebrew names.
- Mobile/narrow width: `mobile_guide` redirect on phones; test ≤ 768 px (collapsed left panel, `narrow` RoomView measurement), right panel overlay.

**Timeline content (each in group/IRC/bubble, own/other, continuation, highlighted, selected, threaded)**
- Text, emote (`m.emote`), notice, formatted HTML (lists, tables, headings), quotes (`blockquote`), inline code, code blocks (`.mx_EventTile_pre_container`, line numbers, collapse, copy button, `hljs`), LaTeX (`feature_latex_maths`), spoilers (`.mx_EventTile_spoiler`), big emoji (`.mx_EventTile_bigEmoji`), links + URL previews (`UrlPreviewGroupView`), mentions/pills (`.mx_Pill`, user/room/@room), search highlights (`.mx_EventTile_searchHighlight`).
- Images (incl. GIF label, blurhash placeholder, hidden media placeholder), stickers, video, audio, voice messages (`.mx_MVoiceMessageBody`, waveform, `AudioPlayerView`), files (`.mx_MFileBody`), location static/live (`.mx_MLocationBody`, `.mx_MBeaconBody`, maplibre), polls (`.mx_MPollBody`, open/ended/undisclosed), call tiles (legacy + Element Call ongoing/ended), jitsi widget events.
- Replies (`.mx_ReplyChain`, `.mx_ReplyTile`), edits ("(edited)", edit history dialog with diff colours), redactions (`RedactedBodyView`), decryption failures (`.mx_DecryptionFailureBody`, `_stateEncryptionFailure_`), unknown events, hidden events, state events (`.mx_TextualEvent`, membership summaries `.mx_GenericEventListSummary`), room creation (`.mx_CreateEvent`, `.mx_NewRoomIntro`), encryption event (`.mx_EncryptionEvent`), room upgrades/tombstones, pinned messages banner (`.mx_PinnedMessageBanner`), date separators (`DateSeparatorView` + jump-to-date picker), read marker (`ReadMarker`), typing indicator (`.mx_WhoIsTypingTile`), jump-to-bottom / unread bar.
- Reactions (`.mx_ReactionsRow`, selected/own, custom image reactions), read receipts (`.mx_ReadReceiptGroup`, overflow, tooltip), sending/failed states (`.mx_EventTile_sending`, resend bar `.mx_RoomStatusBar`), thread summary (`ThreadSummary`), threads panel/list (`.mx_ThreadPanel`, `_shapeThreadsList_`), notifications panel.
- E2EE shields/padlocks (`.mx_E2EIcon`, `E2ePadlock`), user identity warnings (`.mx_UserIdentityWarning`), verification dialogs/panels (`VerificationPanel`, SAS emoji grid `SasEmoji.module.css`, QR), key-backup/recovery flows (`EncryptionCard`), device verification toasts.
- Long names/topics/room names (truncation in room list, header, IRC column), many unread rooms, unread badges (dot, count, highlight/mention, knock), room list sections & drag-overlays, empty states, skeletons.

**Chrome & dialogs**
- User settings: every tab (Account, Sessions, Appearance incl. theme previews + custom-theme add, Notifications, Preferences, Keyboard, Sidebar, Voice, Security, Encryption, Labs, Help); room settings, space settings, devtools (`.mx_DevtoolsDialog` with hard-coded greys), invite/create room/space dialogs, share dialog, forward dialog (renders event preview with layout), image lightbox (`.mx_ImageView`, fixed dark bg), context menus (room options, message options, space menu), tooltips, toasts (analytics, verification, update, non-urgent), quick settings, user menu, onboarding/"teams-welcome", space home (`SpaceRoomView`, hierarchy), home page, room preview bar (join/knock/invite/banned), error views (`mx_ErrorView`, misconfigured, incompatible browser), login/registration/forgot-password/SSO/OIDC flows, welcome page, logout/soft-logout, call view & PiP, widgets (apps drawer, maximised, PiP), file drop target, upload bar.
- Our own surfaces: other datanauten modules' UI (15 modules live; they use `--cpd-color-*`, so they inherit token themes, but not our full-CSS restyling).

---

## 7. Recommendation: theme-loader architecture

### 7.1 Overview

```
theme-loader (one runtime module, same-origin, ^1.14 || ^2)
├─ registry: themes[] = { id, name{en,de}, base:"light"|"dark", tokens{}, css?, fonts[], layout?, schedule?, daylight? }
│    (themes ship as separate files: /element-modules/theme-loader/<id>.css, <id>.woff2 – flat dir; JSON manifest)
├─ applier
│    ├─ <style id="tl-tokens">      unlayered: :root, [class*="cpd-theme-"] { --cpd-…: … }  (+ `!important` for font vars)
│    ├─ <link/style id="tl-css">    unlayered full theme CSS (scoped under html[data-tl-theme="<id>"])
│    ├─ <style id="tl-important">   PREPENDED to <head>: @layer tl-important { … !important }   (beats layered !important)
│    ├─ <style id="tl-fonts">       @font-face (self-hosted / data:)
│    └─ html[data-tl-theme][data-tl-variant="day|dusk|night"][data-tl-ew="1.12.27|1.12.33|main"]
├─ base sync: keep Element's light/dark base consistent with theme.base (is_dark matters for hljs, widgets, EC)
├─ scheduler: local clock / sunrise-sunset → variant switch (setTimeout to next boundary + visibilitychange)
├─ store: accountData "de.datanauten.theme_loader" {theme, variantMode, overrides} + localStorage cache
├─ picker UI: own User-Settings tab (MutationObserver injector), room-header/space-panel quick button, #/themes route
├─ layout plugins (optional, per theme): React overlays via api.createRoot, DOM re-parenting is forbidden,
│    CSS grid re-arrangement of .mx_MatrixChat children, message renderer wrappers only where needed
└─ compat shim: selector macros for EventTile states / room list per Element version, feature detection
```

### 7.2 (a) Colour themes via tokens

Generate one rule from the theme's token map; target the same selectors Compound uses so badges / forced-light islands
are covered too:

```css
/* tl-tokens (unlayered => beats @layer compound-tokens and app-web) */
html[data-tl-theme="teams"] :is(:root, body, [class*="cpd-theme-"]),
html[data-tl-theme="teams"] {
  --cpd-color-theme-bg: #f5f5f5;
  --cpd-color-bg-canvas-default: #ffffff;
  --cpd-color-bg-subtle-secondary: #ebebeb;   /* room list */
  --cpd-color-bg-subtle-primary: #e0e0e0;     /* space panel */
  --cpd-color-text-primary: #242424;
  --cpd-color-text-secondary: #616161;
  --cpd-color-text-action-accent: #5b5fc7;
  --cpd-color-bg-accent-rest: #5b5fc7;
  --cpd-color-bg-action-primary-rest: #5b5fc7;
  --cpd-color-icon-accent-primary: #5b5fc7;
  --cpd-color-border-interactive-secondary: #d1d1d1;
  --cpd-color-green-900: #5b5fc7;             /* legacy $accent-900 scale */
  --cpd-font-family-sans: "Segoe UI Web", "Segoe UI", system-ui, sans-serif !important; /* beats FontWatcher inline */
  --cpd-font-family-mono: "Cascadia Code", monospace;
}
```

Provide a generator that derives the full semantic set (≈120 tokens) from ~12 seed colours (bg, surface, text, accent,
critical, success, info, warning, 6 decorative) so 65 themes stay small. Always also set the base palette `gray-100…1400`
and `green-*` because Element uses them directly.

### 7.3 (b) Full CSS + webfonts

- Unlayered CSS beats every Element rule → write normal specificity selectors, no `!important` needed.
- For the 147 layered `!important` declarations (body font, quick settings, autocomplete …): prefer overriding the custom
  property they read; otherwise inject a sheet **as the first child of `<head>`** declaring `@layer tl-important` before
  Element's layers. For `!important`, the *earliest* layer wins, so `@layer tl-important { body { font-family: … !important } }`
  outranks `app-web`'s `!important`. (Normal declarations in that layer are the weakest — keep only `!important` there.)
  Verify in Chrome/Firefox/Safari during the spike.
- Scope everything under `html[data-tl-theme="<id>"]` so unloading = removing the attribute (no reload).
- Fonts: self-host `.woff2` next to the module (flat dir) or inline as `data:` for small display fonts; Comic
  Neue/WordArt-ish/Win 3.11 bitmap fonts — check licences. Use `font-display: swap`.
- Code: `pre, code, .mx_EventTile_pre_container code, .hljs { font-family: … }` (literal `$monospace-font-family` in
  light/dark).

### 7.4 (c) Layout restructuring

Order of preference (least to most fragile):
1. **Pure CSS** on stable shells: `.mx_MatrixChat` is a flex row of `.mx_LeftPanel_outerWrapper`, separator, room view;
   `display:grid` + `order`, hide/move panels, re-skin header as a title bar, composer as a taskbar, etc. Use `:has()`
   for state (`.mx_MatrixChat:has(.mx_RightPanel)`).
2. **Decorative React overlays** (`api.createRoot` into our own `div` appended to `body` or `#matrixchat`) — LCARS frames,
   E16 window borders, Win 3.11 menu bar, paper texture; `pointer-events:none` where purely decorative.
3. **Module extension points**: header buttons, space-panel items, login component, message renderer wrappers
   (only for themes that must change message markup, e.g. hand-drawn bubbles via SVG filter is CSS-only; WordArt
   headers can be CSS).
4. **`builtins.renderRoomView`** inside a custom shell route (`registerLocationRenderer`) for "different app" themes
   (e.g. a Teams clone) — powerful but a separate navigation model; treat as experimental.
Never move React-owned DOM nodes (React will crash on reconciliation); only add sibling nodes or use CSS.

### 7.5 (d) Daylight variants by local clock

- Theme defines `variants: {day, dusk, night}` (token deltas + optional CSS) and `schedule: "fixed" | "sun"`;
  `fixed` uses hours (07:00/18:00/21:00), `sun` uses a small sunrise/sunset calculation from a configured
  latitude/longitude (config default, user override; no geolocation prompt by default).
- Scheduler sets `html[data-tl-variant]`, recomputes on `setTimeout(nextBoundary)`, `visibilitychange`, and
  `matchMedia("(prefers-color-scheme: dark)")` changes (optional "follow OS" mode).
- When the variant flips light↔dark, also flip Element's base so hljs/github-markdown/widgets/Element Call follow
  (see 7.7).

### 7.6 (e) Per-account choice

- Store `{ "theme": "lcars", "variantMode": "auto", "v": 1 }` in account data `de.datanauten.theme_loader`
  (`api.client.accountData.set`), watch it (`.get(type).watch(fn)`) so changes sync across devices.
- Account data is unavailable before login: in `load()`, apply the cached choice from
  `localStorage["de.datanauten.theme_loader"]` immediately (FOUC reduction), then attach to account data when the client
  is ready (`waitForClientStarted()` on 2.4, else poll `MatrixClientPeg`/retry), reconcile, update the cache.
- Login page: either a config default theme or the last cached one; `registerLoginComponent` can render a themed login.
- Do **not** write account-level `custom_themes` (would hide the 24 config themes). If we want our themes visible in
  Appearance, add them to `setting_defaults.custom_themes` in config at deploy time with a `compound` marker token
  `--cpd-tl-theme-id: "<id>"`; the loader detects selection by watching `<style title="custom-theme-compound">` and
  reading the marker via `getComputedStyle(document.body)`. Note "match system theme" (default on) hides custom picks.
- Picker UI: an own "Themes" tab in User Settings (copy the proven `remote-modules/src/settingsInjector.ts` pattern:
  `[aria-controls^="mx_tabpanel_USER_"]` → `.mx_TabbedView_tabLabels`), with live previews rendered by our React; plus a
  room-header palette button and `#/themes` gallery route; i18n en/de via `api.i18n.register` (flat keys).

### 7.7 Keeping Element's base in sync

Element's own `light`/`dark` choice still determines: highlight.js and markdown CSS, `cpd-theme-*` palettes for
anything we didn't override, widget/Element Call `theme` param, `isUserOnDarkTheme()`. Options:
- Recommended: overwrite *all* tokens ourselves (makes base irrelevant for Compound) and ship our own `.hljs` colours;
  accept that widgets get Element's light/dark.
- Optional (internal API, gated): `window.mxSettingsStore?.setValue("theme", null, "device", base)` and
  `setValue("use_system_theme", null, "device", false)`; fallback `window.mxDispatcher?.dispatch({action:"recheck_theme", forceTheme: base})`
  (transient). Feature-detect, never throw.

### 7.8 Skeleton

```ts
import type { Api, Module, ModuleFactory } from "@element-hq/element-web-module-api";

const KEY = "de.datanauten.theme_loader";

class ThemeLoader implements Module {
    public static readonly moduleApiVersion = "^1.14.0 || ^2.0.0";
    public constructor(private readonly api: Api) {}

    public async load(): Promise<void> {
        const cfg = this.api.config.get(KEY as never) as LoaderConfig | undefined;
        const registry = await loadManifest(cfg?.manifest ?? "/element-modules/theme-loader/themes.json");
        const applier = new Applier(registry, detectElementVersion());   // sets html[data-tl-ew]
        applier.apply(readCache() ?? cfg?.default_theme ?? null);         // before first app render
        new Scheduler(applier).start();
        new SettingsTabInjector(/* mounts picker via this.api.createRoot */).start();
        void this.attachAccountData(applier);                             // after login; never reject load()
    }
}
export default ThemeLoader satisfies ModuleFactory;
```

`detectElementVersion()`: fetch `/version` once (cached), or feature-detect (`document.querySelector('.mx_EventTile[data-layout]')`
vs `[class*="_stateOwnEvent_"]`); the compat shim then enables `html[data-tl-ew="legacy-tiles"]` rule blocks.

### 7.9 Risks and mitigations

| Risk | Mitigation |
|---|---|
| Hashed class local names change on refactors (EventTile, room list moved fast: 20 commits on EventTileView since 1.12.27) | substring selectors on local names only; per-release Playwright screenshot suite over the §6 inventory; keep theme CSS in one shared "selector map" (variables in a preprocessor) so a rename is fixed once. |
| `mx_` classes deleted when components migrate to shared-components (e.g. `mx_EventTile_*` states) | same; watch `git log -- packages/shared-components apps/web/res/css` per release. |
| FOUC: Element theme paints first (spinner, error screens) | apply cached theme synchronously at the top of `load()`; make background tokens match early; accept spinner flash. |
| `clearCustomTheme()` wipes body inline vars | never use `body.style`; own `<style>` only. |
| FontWatcher inline `--cpd-font-family-sans` | `!important` on our font tokens (unlayered important > inline normal). |
| Layered `!important` | variable overrides; first-layer `tl-important` sheet. |
| `cpd-theme-light` islands (badges, error view, theme previews) | token selector includes `[class*="cpd-theme-"]`; but exclude `.mx_ThemeChoicePanel_themeSelector` previews if we want them to show Element's real themes. |
| Interplay with 24 config custom themes and "match system" | loader theme overrides whatever Element theme is active; offer "none" (= Element's own) in the picker; document that custom Element themes and loader themes don't stack. |
| Other datanauten modules render their own UI | they use `--cpd-color-*` → follow tokens; full-CSS themes may need small per-module rules (`[class^="drm-"]`, `.de-datanauten-*`). |
| Performance of heavy CSS (filters, `:has()`, SVG filters on every tile) | keep expensive effects off the scrolling timeline or behind `prefers-reduced-motion`/a "lite" toggle; measure with the benchmark skill. |
| Accessibility (near-invisible "paper" UI, Comic Sans, LCARS contrast) | keep focus rings (`--cpd-color-border-focused`), honour `prefers-contrast: more` (auto-fallback to an accessible variant), test with axe. |
| Licences of fonts/brand look-alikes (Teams, Windows) | own lookalike assets, no logos/trademarks; check font licences (Segoe UI is not redistributable). |
| CSP changes in future images | assets same-origin only; no `blob:`/`data:` stylesheets. |

### 7.10 Staying compatible with 1.12.27 and main

- Declare `^1.14.0 || ^2.0.0`; use only `config`, `i18n`, `createRoot`, `rootNode`, `openDialog`, `extras.*`,
  `client.accountData`, `customComponents.*` (all present in 1.17); feature-detect `waitForClientStarted`.
- Tokens: set 10.x and 11.x names; never rely on an 11-only token for essential contrast.
- Selectors: dual rules (`data-self`/`mx_EventTile_*` for ≤1.12.27, `_state*_` for ≥1.12.28), or switch blocks via
  `html[data-tl-ew]`. The live target (1.12.33) is the new regime; 1.12.27 support can be a lower-priority shim.
- Labs DOM (`feature_new_timeline`, WYSIWYG, in-page Element Call): test with flags on in the e2e stack; not default.
- Pin a test matrix: `ghcr.io/element-hq/element-web:v1.12.33` (live), `v1.12.27` (legacy), `develop` nightly
  (early warning), driven by Playwright screenshot diffs over §6.
