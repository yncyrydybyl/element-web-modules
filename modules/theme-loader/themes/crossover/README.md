# crossover — mashups

Style guide: `docs/styleguides/crossover.md` / `crossover.json`. Phase A: manifest only.

No own assets yet. `assets/` is intentionally empty. Phase B reuses the parent families' files:

| Variant | Fonts / assets from | Licence |
|---|---|---|
| x-win311-lcars | win311: W95FA, VT323, scrollbar SVGs · lcars: Antonio, frame enhancer | OFL / MIT (98.css SVGs) |
| x-teams-sketch | sketch: Balsamiq Sans, Architects Daughter, mono · teams: layout helpers | OFL |
| x-kde-e16 | kde: Noto Sans, Hack · enlightenment: Silkscreen, brushed-metal recipe, bevel trio | OFL / MIT + Bitstream Vera |

Open point: cross-family asset references vs copying into `assets/` (the build flattens to `<family>--<file>`).
Until that is decided, `fonts` in `themes.json` stays empty.
LCARS (© CBS/Paramount), Teams and Windows (Microsoft) are used for internal purposes only.
