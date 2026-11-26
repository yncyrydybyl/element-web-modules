# Contract / loader change log

## 2026-11-15 — theme-loader 0.1.0 (loader agent)

CONTRACT.md additions (all marked "ADDED:", nothing removed or changed):
- §3 cross-family assets `@<family>/assets/<file>`; `@layer tl-important { … !important }` blocks; `npm run check`
  validation (scoping rule enforced, `@import`/other layers rejected); font `local`/`display`/`unicodeRange`.
- §5 `ctx.switchTheme(id|null)`, `ctx.previousTheme()`, `ctx.asset(path)`, `ctx.reducedMotion`, `ctx.log`; overlay
  root details.
- §7 `.tl-ui` (+ `tl-picker`, `tl-switcher`) must stay readable in every theme; Alt+Shift+T; `data-tl-phase-fading`;
  `?tl_theme=none`.
Dev server: `cd loader && npm run dev` → http://127.0.0.1:5400/ (see loader/README.md).
