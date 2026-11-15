# paper — Low-UI white & black paper

Style guide: `docs/styleguides/paper.md` / `paper.json`. Phase A: manifest and assets only (no CSS yet).

## Assets and licences

| File | Source | Licence |
|---|---|---|
| `assets/ia-writer-quattro-Regular.woff2`, `-Italic`, `-Bold`, `-BoldItalic` | https://github.com/iaolo/iA-Fonts (`iA Writer Quattro/Webfonts`, iAWriterQuattroS-*) | SIL OFL 1.1 — © 2018 Information Architects Inc., RFN "iA Writer"; based on IBM Plex © 2017 IBM Corp., RFN "Plex". See `assets/LICENSE-iA-Writer-Quattro.md` |
| `assets/ia-writer-mono-Regular.woff2`, `-Italic`, `-Bold`, `-BoldItalic` | same repo (`iA Writer Mono/Webfonts`, iAWriterMonoS-*) | same, see `assets/LICENSE-iA-Writer-Mono.md` |

**Credit:** typefaces **iA Writer Quattro** and **iA Writer Mono** by [iA (Information Architects)](https://ia.net/),
used unmodified under OFL 1.1. iA asks that users credit iA Writer and do not clone iA's products. These themes are
called "Paper", are not presented as iA Writer, and do not modify or rename the fonts (no subsetting, so the RFN clause does not apply).

The loader's build flattens the files to `paper--<file>` (CONTRACT §3).

## Known gaps

- iA fonts cover Latin only. Cyrillic, Greek and CJK fall back to IBM Plex Sans (if installed) and then `system-ui`.
- The invisible variants (`*-invisible`) deliberately fail WCAG 1.4.11 for resting control boundaries (see the style guide).
