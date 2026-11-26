# KDE Plasma / Qt theme family (`kde`)

There are 7 variants: `kde-breeze-light`, `kde-breeze-dark`, `kde-breeze-daylight`, `kde-oxygen`, `kde-ocean`, `kde-usable` and `kde-glass`.
The design intent is in `docs/styleguides/kde.md`, and the gallery data is in `docs/styleguides/kde.json`.

**Phase B layout:** `shared.css` holds every Breeze rule, written against `--kde-*` custom properties. Each variant file mostly sets those properties and adds its own signature rules. `kde-breeze-daylight.css` is self-contained, with its phases keyed on `data-tl-phase`. `enhance.ts` provides the decorative titlebar and the Plasma clock for every variant except `kde-usable`.

The asset directory is flat, because the build flattens assets to `kde--<file>`. Files are grouped by prefix: `breeze-*`, `ocean-*` and `oxygen-*`.

## Implementation status (phase B)

| Variant | Status | What is implemented |
|---|---|---|
| kde-breeze-light | done | NeoChat layout: header band shared by the space column, room-list search row and room header (48 px, `#dee0e2`); Breeze titlebar overlay (chevrons, title from `document.title`, maximise toggles fullscreen); 56 px space column with KDE-logo Home button, 30 % accent tile and edge indicator; Plasma clock; Kirigami room list ("People ——— ⌄" section rules, accent selection with outline); white 5 px message cards on the Window canvas (own messages tinted, mentions with orange left bar); Breeze push buttons, check boxes, radios, switches, line edits, menus, tooltips, dialogs, settings sidebar, scrollbars; Breeze icons on composer, header, space panel and action bar; Breeze-style code highlighting; Hanabi login backdrop. |
| kde-breeze-dark | done | The same rules on Breeze Dark values. |
| kde-breeze-daylight | done | Light at dawn and day, Breeze Classic at dusk (dark `#475057` header band and titlebar, `#31363b` panel), Breeze Dark at night. KWin Night Color warm overlay: one fixed multiply layer at 6, 8 and 10 %. 2 s crossfade between phases. Every phase was screenshotted. |
| kde-oxygen | done | Radial-lit `#d6d2d0` window; sunken white view panes for the room list and timeline; glossy jelly buttons with the `#6ed6ff` glow on hover; dark glass Plasma panel with the KDE 4 logo; colourful Oxygen icons (PNG); glossy blue selection; etched separators instead of cards; sunken "hole" line edits; jelly-circle titlebar with help/min/max/close; Oxygen font and Oxygen Mono. |
| kde-ocean | done | Ocean tokens: Inter, `#fbfcfe` surface, room list and right panel as floating cards, `#dae2ff` pill selection, Ocean bubbles, Ocean input (44 px, r6, focus ring), filled round send button, Ocean pill badges and chips, nav pills in settings, left-hand traffic-light titlebar, 24 px Ocean icons, gradient Home tile. Filled buttons use `#2058c3` instead of the spec's `#4172de`, because `#4172de` with `#faf8ff` text is only 4.25:1. |
| kde-usable | done | No titlebar, 44 px band, 14.5 px body, Qt zebra rows in the timeline and room list, unread rows marked with an accent bar, dark-blue unread pills, 3 px `#1e6fa5` focus ring with a white gap, filled default buttons, permanent 10 px scrollbars with a groove, darker outlines under `prefers-contrast: more`. |
| kde-glass | done | Hanabi dark wallpaper behind everything; backdrop blur only on the big panes (floating rounded space panel, room list, room view, dialogs, menus); translucent cards without per-tile blur; violet accent-from-wallpaper glow on selection, unread badges, the send button and focus; ember-orange mentions; dialogs open with a "Magic Lamp"-like animation (turned off under reduced motion); opaque fallback when `backdrop-filter` is not supported. |

### Edge-check results (`qa/reports/kde-*.md`, latest run)

| Variant | Result | Contrast nodes | Invisible focus stops | Overflow | Missing essentials |
|---|---|---|---|---|---|
| kde-breeze-light | pass | 0 | 0 | 0 | 0 |
| kde-breeze-dark | pass | 0 | 0 | 0 | 0 |
| kde-breeze-daylight | pass | 0 | 0 | 0 | 0 |
| kde-oxygen | pass | 4, then fixed (home tiles, timestamp) | 0 | 0 | 0 |
| kde-ocean | pass | 0 | 0 | 0 | 0 |
| kde-usable | pass | 0 | 0 | 0 | 0 |
| kde-glass | pass | 2, then fixed (orange @room pill text) | 0 | 0 | 0 |

The remaining serious axe findings come from Element itself and are the same in every theme: `nested-interactive` (space buttons), `scrollable-region-focusable` (code blocks) and `aria-prohibited-attr` (avatars). Console errors are Element's (no map style configured, rust crypto store warning).

Checked in the screenshots: modals, context menus, settings, login, mobile width (390 px), threads, code blocks, polls, E2EE DM, unread badges, very long names (IRC) and RTL. Accessibility deviations from the pure looks: link `#1d6fa5` instead of `#2980b9`, timestamps `#5f6b77` instead of `#707d8a`, 2 px focus outline instead of Breeze's 1 px, and filled reds darkened (`#b0303e`).

Dev tools (not shipped): `tools/probe.mjs` (uses the harness session pool, no login) and `tools/cssgrep.py` (searches Element's CSS).

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
