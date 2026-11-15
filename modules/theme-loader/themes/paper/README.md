# paper — Low-UI white & black paper

Style guide: `docs/styleguides/paper.md` / `paper.json`.

## Files

- `shared.css` — everything: Compound token map (driven by `--p-*` palette variables), the L1 calm rules for all
  variants, the L3 quiet and L5 invisible stage rules (grouped by `html[data-tl-theme=…]` lists), `.tl-ui` exemption,
  `(hover: none)` / `prefers-contrast: more` / reduced-motion / forced-colours fallbacks, daylight cross-fade.
- `<variant>.css` — palette only (`--p-paper`, `--p-ink`, `--p-muted`, `--p-accent`, `--p-line`, `--p-wash`, …);
  `paper-daylight.css` holds the four phase palettes.
- `enhance.ts` — quiet + invisible only: marks the newest four timeline tiles (`data-tl-recent`, iA focus mode) and,
  for invisible, the 8px left-edge reveal strip + **Alt+Shift+P** (`html[data-tl-reveal]`, Esc closes). Alt+Shift+P is
  unbound in Element 1.12.33 (`KeyboardShortcuts.ts`); Ctrl+Shift+S was dropped because Firefox uses it for screenshots.

## Implemented per variant

| Variant | Status | Notes |
|---|---|---|
| paper-white | done | one sheet `#FBFBF8`, iA Writer Quattro 17/1.6 in a 68ch column, text-only room list (bold + digits for unread, `@` for mentions), small-caps senders, grayscale avatars, ink-outline pills, 3-ink hljs, bare-paper login |
| paper-black | done | same on `#0E0E0E` / `#E8E6E1`, accent `#6CB6FF`, mention wash `#3A3320` |
| paper-white-quiet | done | no lines; space rail + room list recede to muted ink (avatars at 50 %) until hover/focus (by colour, not opacity, so text keeps ≥4.5:1); header = room name only; composer actions appear on hover/keyboard focus/typing; older tiles recede to muted ink (≥4.5:1, changed from the guide's 35 % opacity so contrast floors hold) |
| paper-black-quiet | done | as above, dark |
| paper-white-invisible | done (deliberately breaks 1.4.11) | navigation off-canvas (edge strip, Alt+Shift+P, keyboard focus), chrome at ~1.07:1, icons at 8 %, badges hidden, muted small-caps header, timeline scrollbar hidden; focus ring (2px ink) always drawn; `.tl-ui` palette button and Themes dialog stay visible |
| paper-black-invisible | done (same) | dark |
| paper-daylight | done | dawn 06:00 `#F7F1E3` · day 10:00 `#FFFFFF` · dusk 17:00 `#F1E7D0` (accent `#8A4B12`) · night 21:00 = paper-black; 2 s cross-fade on `data-tl-phase-fading` |

## Edge-case results (harness, 2026-11-15)

| Check | Result |
|---|---|
| edgecheck paper-white / paper-black / quiet ×2 | pass (remaining axe items are Element's own: nested-interactive space buttons, scrollable code blocks, aria-prohibited-attr in threads) |
| edgecheck invisible ×2 | report-only (contrast items = deliberately faded chrome) |
| focus stops without visible focus | 0 in all variants |
| modals, context menus, settings, Themes tab | readable in every variant; invisible keeps the dialog containing `.tl-ui` bordered |
| login | Element's photo background and blur removed; footer links at muted ink (4.5:1+) |
| mobile (390px) | timeline + composer wrap correctly (fixed a flex `margin:auto` overflow); invisible puts navigation back into the layout on `(hover: none)` |
| threads, code blocks, polls, E2EE shields, long names, RTL | fine; shields keep their success/critical colour |
| unread badges | room list: bold + muted digits / `@`; space panel: Element badge forced transparent with ink digits |
| user menu (invisible) | off-canvas by design → the harness click times out (shot 13 missing); reachable with Tab or Alt+Shift+P |

## Assets and licences

| File | Source | Licence |
|---|---|---|
| `assets/ia-writer-quattro-Regular.woff2`, `-Italic`, `-Bold`, `-BoldItalic` | https://github.com/iaolo/iA-Fonts (`iA Writer Quattro/Webfonts`, iAWriterQuattroS-*) | SIL OFL 1.1 — © 2018 Information Architects Inc., RFN "iA Writer"; based on IBM Plex © 2017 IBM Corp., RFN "Plex". See `assets/LICENSE-iA-Writer-Quattro.md` |
| `assets/ia-writer-mono-Regular.woff2`, `-Italic`, `-Bold`, `-BoldItalic` | same repo (`iA Writer Mono/Webfonts`, iAWriterMonoS-*) | same, see `assets/LICENSE-iA-Writer-Mono.md` |

**Credit:** typefaces **iA Writer Quattro** and **iA Writer Mono** by [iA (Information Architects)](https://ia.net/),
used unmodified under OFL 1.1. iA asks that users credit iA Writer and do not clone iA's products. These themes are
called "Paper", are not presented as iA Writer, and do not modify or rename the fonts.

## Known gaps

- iA fonts cover Latin only; Cyrillic, Greek and CJK fall back to IBM Plex Sans (if installed) and `system-ui`.
- Element Call / widget iframes stay Element light/dark; only their frame is restyled.
- Avatar.ts favicon/notification avatars keep Element's colours.
- Invisible stage: resting control boundaries fail WCAG 1.4.11 and discoverability is poor — by design.
