# KDE Plasma / Qt theme family (`kde`)

There are 7 variants: `kde-breeze-light`, `kde-breeze-dark`, `kde-breeze-daylight`, `kde-oxygen`, `kde-ocean`, `kde-usable` and `kde-glass`.
The design intent is in `docs/styleguides/kde.md`, and the gallery data is in `docs/styleguides/kde.json`.

**Phase B layout:** `shared.css` holds every Breeze rule, written against `--kde-*` custom properties. Each variant file mostly sets those properties and adds its own signature rules. `kde-breeze-daylight.css` is self-contained, with its phases keyed on `data-tl-phase`. `enhance.ts` provides the decorative titlebar and the Plasma clock for every variant except `kde-usable`.

The asset directory is flat, because the build flattens assets to `kde--<file>`. Files are grouped by prefix: `breeze-*`, `ocean-*` and `oxygen-*`.

## Assets and licences

| Files | Source | Licence | Notes |
|---|---|---|---|
| `noto-sans-var.woff2`, `noto-sans-italic-var.woff2` | Noto Sans variable `[wght]` 400–700 (Fedora `google-noto-vf`, upstream notofonts/latin-greek-cyrillic) | SIL OFL 1.1 (`LICENSE-OFL-noto-sans.txt`) | Subset to Latin, Latin Ext, Greek, Cyrillic, Vietnamese, punctuation, arrows, box drawing and symbols, then converted to woff2 with fonttools |
| `inter-var.woff2`, `inter-italic-var.woff2` | Inter `[opsz,wght]` (google/fonts `ofl/inter`) | SIL OFL 1.1 (`LICENSE-OFL-inter.txt`) | Same subset. Used by kde-ocean, which follows the Ocean spec's font. |
| `oxygen-light/regular/bold.woff2`, `oxygen-mono.woff2` | Oxygen and Oxygen Mono (google/fonts `ofl/oxygen`, `ofl/oxygenmono`) | SIL OFL 1.1 (`LICENSE-OFL-oxygen.txt`) | Converted to woff2 |
| `hack-regular/bold/italic/bolditalic.woff2` | Hack v3.003 webfonts (source-foundry/Hack release) | MIT + Bitstream Vera licence (`LICENSE-hack.md`) | Shipped unmodified. Hack is Plasma's default fixed-width font. |
| `breeze-*.svg` (77) | KDE breeze-icons tag **v6.32.0**, `icons/{actions,status,places,emotes,devices,apps}/22` | LGPL-3.0-or-later (`LICENSE-breeze-icons.txt` = upstream `COPYING-ICONS`; LGPL text in upstream `COPYING.LIB`) | Monochrome 22 px icons. Symlinks were resolved to real files. Names follow freedesktop/Breeze. `breeze-kde-logo-32.svg` is `places/32/start-here-kde.svg`. |
| `oxygen-*.png` (34) | KDE oxygen-icons master, `48x48/*` | LGPL-3.0 (oxygen-icons `COPYING`) | Colourful KDE 4 icons, drawn at 22–28 px. `oxygen-start-here-kde.png` is the KDE 4 logo (`animations/process-idle-kde.png`). |
| `ocean-*.svg` (34) | KDE VDG Ocean design system, `invent.kde.org/abetts/ocean-design`, `Icon Pack/Ocean/*/24` (master, 2026-10-17) | **No explicit licence file in the repo.** The icon theme is a fork of Breeze: its `index.theme` is inherited from breeze-icons, and KDE's licensing policy requires LGPL for artwork. We treat it as LGPL-3.0-or-later. | **Risk:** confirm with the VDG (Andy Betts) before any public release. If the licence turns out to be unclear, swap these for `breeze-*` (same names). |
| `wallpaper-hanabi-light.webp`, `wallpaper-hanabi-dark.webp` | Breeze wallpaper "Hanabi" by Krystian Zajdel (`plasma/breeze` `wallpapers/Next`, 5120×2880 PNG) | CC-BY-SA-4.0 (attribution: Krystian Zajdel, KDE) | Resized to 2560×1440 webp (q82) |

Values only, with no files shipped:

- the Breeze, Oxygen and Ocean colour schemes and the Breeze kstyle metrics (GPL code, read as reference)
- the Ocean window-decoration colours: the Aurorae SVGs are GPL-2.0+ and are redrawn in CSS instead of shipped

Reference screenshots (not shipped, design reference only) are in `docs/styleguides/refs/kde/`: NeoChat (KDE), Ocean blog images and Ocean component spec PNGs.

## Icon names available

**Breeze:**
application-menu, audio-input-microphone, call-start, call-stop, camera-video, camera-web, checkmark, chronometer,
configure, dialog-cancel, dialog-information, dialog-messages, dialog-ok-apply, document-edit, document-send,
document-share, draw-text, edit-clear, edit-clear-history, edit-copy, edit-delete, edit-find, face-smile, favorite,
format-list-ordered, format-list-unordered, format-text-blockquote/bold/code/italic/strikethrough/underline, go-down,
go-home, go-next, go-previous, go-up, group, help-about, im-matrix, im-user, insert-link, kde-logo-32, kde-symbolic,
list-add, lock, mail-attachment, mail-mark-important, mail-reply-sender, media-playback-pause/start,
microphone-sensitivity-high, non-starred-symbolic, notifications, notifications-disabled, object-unlocked,
org.kde.neochat, overflow-menu, plasma-symbolic, security-high/medium/low, smiley, starred-symbolic, system-log-out,
view-filter, view-hidden, view-left-close, view-list-details, view-refresh, view-right-close, view-sort,
view-split-left-right, view-visible, window-close, window-pin, window-restore.

**Ocean:**
document-send, mail-attachment, smiley, edit-find, configure, dialog-messages, im-user, call-start, camera-video,
notifications, go-home, list-add, overflow-menu, application-menu, window-close, mail-reply-sender, document-edit,
edit-delete, go-down, go-next, checkmark, insert-link, edit-copy, format-text-bold, format-text-code, view-filter,
security-high, security-low, help-about, kde-symbolic, user-group-new, audio-input-microphone, window-pin,
sidebar-collapse-left.

**Oxygen:**
mail-send, mail-attachment, face-smile, edit-find, configure, system-users, call-start, go-home, list-add,
window-close, edit-delete, document-edit, mail-reply-sender, help-about, start-here-kde, camera-web,
preferences-desktop-notification, user-identity, view-conversation-balloon, dialog-information, security-high/low/medium,
im-user, edit-copy, dialog-ok, dialog-cancel, emblem-favorite, object-locked, audio-input-microphone, insert-link,
view-list-details, go-down, go-next.

## Known gaps and notes for phase B

- The manifest `fonts[].weight` uses ranges (`"400 700"`, `"100 900"`) for variable fonts. The loader must emit them verbatim into `font-weight` in `@font-face`.
- The KSyntaxHighlighting Breeze colours in the style guide are from memory. Verify them against `breeze-light.theme` and `breeze-dark.theme`.
- Icon swaps keyed on `aria-label` only work in English. Other locales fall back to recoloured Compound icons.
- The titlebar overlay must be hidden under `@media (display-mode: standalone)` and on short viewports.
