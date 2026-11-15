# teams — Microsoft Teams theme family

10 variants, see `themes.json` and `docs/styleguides/teams.md`. Phase A: the manifest and assets are in place. The CSS files listed in `themes.json` (`shared.css`, `<variant>.css`) and `enhance.ts` follow in phase B.

## Assets and licences

Everything in `assets/` may be redistributed. The full licence texts are in `licenses/`. That folder is not deployed, but keep it next to the sources.

| file(s) | what | source | licence |
|---|---|---|---|
| `selawik-{light,semilight,regular,semibold,bold}.woff2` | Selawik 1.01 (300/350/400/600/700), the metric-compatible Segoe UI fallback | github.com/microsoft/Selawik release 1.01 | OFL-1.1 (`licenses/OFL-Selawik.txt`) |
| `cascadia-mono-{regular,semibold,bold}.woff2` | Cascadia Mono 2407.24, subset to Latin/Greek/Cyrillic/punctuation/arrows/math/box drawing | github.com/microsoft/cascadia-code | OFL-1.1 (`licenses/OFL-CascadiaCode.txt`) |
| `comic-neue-{regular,bold}.woff2` | Comic Neue (comic variant body; Comic Sans MS via `local()` first) | google/fonts `ofl/comicneue`, converted TTF→WOFF2 | OFL-1.1 |
| `bangers-regular.woff2` | Bangers (comic display) | google/fonts `ofl/bangers` | OFL-1.1 |
| `orbitron-vf.woff2` | Orbitron variable 400–900 (cyberpunk display) | google/fonts `ofl/orbitron` | OFL-1.1 |
| `share-tech-mono-regular.woff2` | Share Tech Mono (cyberpunk HUD/mono) | google/fonts `ofl/sharetechmono` | OFL-1.1 |
| `fluent-<name>_<20\|24>_<regular\|filled>.svg` (346 files) | Fluent UI System Icons | npm `@fluentui/svg-icons@1.1.346` | MIT (`licenses/MIT-FluentUISystemIcons.txt`) |
| `teams-logo-2025.svg` | Teams logo 2025–present (gradient) | Wikimedia Commons "Microsoft Office Teams (2025–present).svg" | PD-textlogo on Commons; **Microsoft trademark**. Internal use per project decision |
| `teams-logo-2019.svg` | Teams logo 2019–2025 | Wikimedia Commons "Microsoft Office Teams (2019–2025).svg" | same as above |

## Fonts we do not ship

These are proprietary and referenced only via `local()`:

- Segoe UI, Segoe UI Variable Text/Display, Segoe UI Emoji
- Consolas
- Comic Sans MS

The UI stack is `"Segoe UI Variable Text", "Segoe UI", Selawik, system-ui, sans-serif`. Windows users get real Segoe; everyone else gets Selawik.

## Known gaps

See `docs/styleguides/teams.md` §9:

- iframes are light/dark only
- the "app bar" is really the space list
- the header tabs are restyled buttons
- icon swaps depend on aria-labels
- no Fluent Emoji

## Notes on brand colour

The late-2026 Teams UI still ships brandTeams `#5B5FC7`, verified by pixel-sampling Microsoft's own May and June 2026 product screenshots. The newer V21 ramp `#654CF5` (in `@fluentui/tokens` since July 2025) appears only in the 2025 logo, so it is used for `teams-2028`. Details are in the style guide, §2.
