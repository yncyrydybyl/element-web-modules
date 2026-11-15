# Theme authoring contract

Every theme family, the theme loader and the test/record tooling depend on this contract.
Change it only together with the loader (`loader/`) and announce changes in `docs/LOG.md`.

Target: **Element Web 1.12.33** (production element.datanauten.de, module API 2.3.0, compound tokens 11.2.0).
Background: `research/01-theme-system.md` (§2 tokens, §3 selectors, §5 limits, §7 architecture).

## 1. Repository layout

```
themes/<family>/
  themes.json          manifest of all variants in this family (schema below)
  shared.css           rules used by several variants of the family (optional)
  <variant-id>.css     one file per variant (may be tiny if mostly tokens)
  enhance.ts           optional DOM/React enhancer for the family (see §5)
  assets/              fonts (.woff2), images (.svg/.png/.webp), sounds
  README.md            family notes: sources, licences, known gaps
docs/styleguides/<family>.md   the style guide (design intent, per-variant mapping)
```

## 2. Manifest `themes/<family>/themes.json`

```jsonc
{
  "family": "teams",
  "name": "Microsoft Teams",
  "variants": [
    {
      "id": "teams-2026-light",          // globally unique, kebab-case, prefix = family
      "name": "Teams 2026 · Light",
      "stage": "pure",                    // pure | past | future | usable | exciting | comic | cyberpunk | level-N | crossover
      "mode": "light",                    // light | dark | daylight
      "base": "light",                    // Element base for iframes/hljs (light|dark); daylight: base of the day phase
      "seriousness": 9, "hype": 3,        // 0–10, used for the gallery axes
      "description": "Current Teams (Fluent 2, #654CF5 brand ramp)…",
      "css": ["shared.css", "teams-2026-light.css"],
      "fonts": [{ "family": "Selawik", "file": "assets/selawik.woff2", "weight": "400", "style": "normal" }],
      "tokens": { "--cpd-color-bg-canvas-default": "#ffffff" },   // optional, merged before css
      "enhance": true,                    // run enhance.ts for this variant
      "schedule": null                    // only for mode=daylight, see §6
    }
  ]
}
```

## 3. CSS rules

- **Scope everything.** Every selector starts with `html[data-tl-theme="<variant-id>"]` or
  `html[data-tl-family="<family>"]`. The loader sets both attributes and removes them on switch, so nothing leaks.
- **Unlayered CSS** beats every Element rule (Element is fully inside `@layer`). No `!important` needed, except for
  font tokens (`--cpd-font-family-sans/mono` are also set inline by Element's FontWatcher).
- **Tokens first.** Set the Compound tokens (`--cpd-color-*`, `--cpd-font-*`, radii) on
  `html[data-tl-theme="x"], html[data-tl-theme="x"] body, html[data-tl-theme="x"] [class*="cpd-theme-"]` so the
  forced-light islands (badges etc.) follow. See research §2.3 for the 40 tokens that matter.
- **Hashed classes** (event tiles, new room list, badges, user menu since 1.12.28): substring selectors on the local name
  only, e.g. `[class*="_stateOwnEvent_"]`. Never use the hash.
- **Never** move React-owned DOM nodes. Restructure with CSS (grid/order/`:has()`), add sibling overlays via enhancer.
- **Accessibility floors** for every variant whose stage is not explicitly "unreadable"/"invisible" by design:
  visible keyboard focus; honour `prefers-reduced-motion: reduce` (disable animation/boiling/blink/marquee).
  Variants that deliberately break readability must say so in `description` and stage (`level-8`, `invisible`).
- **Performance:** no SVG filters or animation on every timeline tile in usable variants; heavy effects behind the
  variant, never in `shared.css`.
- **Assets** referenced as `url("assets/<file>")`. The build flattens them to `<family>--<file>` next to the module
  (the prod deploy only supports one flat directory) and rewrites the URLs. Fonts must be self-hosted (CSP font-src
  `'self' data:`). No external CSS/fonts. External images are allowed by CSP but avoid them.
- **Fonts:** only files with a licence allowing redistribution go in `assets/`. Proprietary brand fonts (Segoe UI,
  Comic Sans MS, MS Sans Serif) are referenced via `local()` first with a free fallback bundled.
  Real logos/brand icons are allowed (internal project, user decision).

## 4. Required coverage (the "region map")

Each style guide and each variant states the treatment of these regions; the test suite screenshots all of them:

`shell` (app background/frame) · `spaces` (space panel) · `roomlist` · `header` (room header) · `timeline`
(event tiles, own/other, bubbles/IRC/modern layouts) · `names-avatars` · `composer` · `rightpanel` (threads, members,
room info) · `buttons` · `inputs` · `dialogs` (modals) · `menus` (context menus, tooltips) · `settings` ·
`auth` (login/welcome) · `scrollbars` · `focus` · `badges` · `code` (code blocks, hljs) · `iframes` (calls/widgets,
light/dark only) · `icons` · `motion`.

## 5. Enhancers (`enhance.ts`)

```ts
import type { EnhancerContext } from "../../loader/src/types";
export default {
  mount(ctx: EnhancerContext): void {},   // ctx.variant, ctx.root (our overlay div), ctx.api, ctx.phase
  unmount(): void {},
  onPhase?(phase: string): void {},       // daylight phase changes
};
```

Enhancers add overlays (title bars, LCARS frames, marquees, sound) into `ctx.root`, may add attributes/classes to
existing nodes via a MutationObserver, and must fully clean up in `unmount()`. They never throw into Element.

## 6. Daylight variants (local clock)

`mode: "daylight"` variants carry a schedule of phases keyed by local time. The loader sets
`html[data-tl-phase="<name>"]` and switches at boundaries (also on `visibilitychange`):

```json
"schedule": [
  { "from": "06:00", "phase": "dawn",  "base": "light" },
  { "from": "09:00", "phase": "day",   "base": "light" },
  { "from": "18:00", "phase": "dusk",  "base": "light" },
  { "from": "21:00", "phase": "night", "base": "dark" }
]
```

CSS targets `html[data-tl-theme="x"][data-tl-phase="night"]`. Transitions between phases fade
(`transition: background-color 2s, color 2s`) unless reduced motion. For testing, `?tl_phase=night` or
`localStorage["tl.forcePhase"]` forces a phase.

## 7. Loader runtime facts (for theme authors)

- Attributes on `<html>`: `data-tl-theme`, `data-tl-family`, `data-tl-phase` (daylight only), `data-tl-base`.
- Theme choice: account data `de.datanauten.theme_loader` `{theme, v}` + localStorage cache; URL `?tl_theme=<id>`
  overrides for testing/recording (not persisted).
- Picker: User Settings → "Themes" tab with gallery, plus a quick switcher button.
- "Element default" (no loader theme) is always available.
