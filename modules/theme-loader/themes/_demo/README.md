# _demo — loader pipeline proof

Not a real theme. Two variants that exercise every loader feature end to end:

- `demo-mint-light`: tokens only (no CSS file).
- `demo-night-owl`: daylight schedule (dawn/day/dusk/night, base switches to light by day), self-hosted
  Fira Code (SIL OFL 1.1, copied from Element's own bundle), CSS with an asset URL and a `@layer tl-important`
  block, and an enhancer that shows the phase in an overlay badge.

Families whose name starts with `_` are hidden in the picker of production builds (`npm run build`); they are
still selectable with `?tl_theme=<id>`. `npm run build:demo` lists them.
