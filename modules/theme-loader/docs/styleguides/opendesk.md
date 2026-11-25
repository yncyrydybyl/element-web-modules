# openDesk — style guide (`opendesk`, 7 variants)

Status: 2026-11-15. Target Element Web 1.12.33 (dev) and **1.12.29 / module API 1.17** (openDesk CE v1.19.3, live at
chat.od.blackpony.club). Machine-readable twin: `opendesk.json`. Assets: `themes/opendesk/assets/` (licences in
`themes/opendesk/README.md`). Reference screenshots of the live suite: `research/opendesk/`.

## 1. Concept

openDesk is the sovereign office suite of ZenDiS (Zentrum für Digitale Souveränität der Öffentlichen Verwaltung) for
the German public sector: Nubus portal + Keycloak, Nextcloud, OX App Suite, Element/Synapse, Jitsi, OpenProject, XWiki,
CryptPad, Collabora, Notes. Every app wears the same thin skin: a **white 64px suite bar** with an app-grid button and
the **openDesk wordmark** (link to the portal), a **#f5f5f5** canvas, **navy #203257** text, **violet #571EFA**
primary actions, **Open Sans**, 4px buttons and 8px tiles, and the **duotone violet app icons** (#571EFA + #341291)
of the portal. Nextcloud adds the filled-violet selected navigation item; Keycloak the white 12px login card over a
blurred isometric field of app tiles.

openDesk's own Element only recolours Element (two `custom_themes`, "openDesk" and "openDesk Dark") and adds a banner
module. The family goes further and makes Element look like a first-party suite app.

### Stage axis

```
              past ◄──────────────────── pure ─────────────────────► future
   opendesk-classic (2023 SWP)   opendesk-light / -dark / -daylight   opendesk-2028
                                            │
                           usable ◄─────────┴─────────► exciting
                   opendesk-usable (BITV)          opendesk-hyperdesk (neon night)
```

| id | stage | mode | S | H | one-liner |
|---|---|---|---|---|---|
| opendesk-light | pure | light | 9 | 3 | the shipped look: suite bar, portal grey, navy text, violet pill selection |
| opendesk-dark | pure | dark | 9 | 3 | openDesk Dark on the navy neutral ramp, lavender accent text |
| opendesk-daylight | pure | daylight | 9 | 4 | dawn lavender → day portal → dusk navy "Feierabend" bar → night openDesk Dark |
| opendesk-usable | usable | light | 10 | 2 | "Barrierefrei": BITV 2.0 / WCAG 2.2 AA+, 3px high-contrast focus, 15px text |
| opendesk-classic | past | light | 8 | 4 | Souveräner Arbeitsplatz 2023: violet #5e27dd banner, 2023 wordmark, secondary chips |
| opendesk-2028 | future | light | 7 | 7 | opendesk.eu language in-product: Space Grotesk, floating panels, gradients |
| opendesk-hyperdesk | exciting | dark | 4 | 9 | neon night: login tile field as wallpaper, violet glow, mint #00ffcd signal |

## 2. Verified source values

### 2.1 openDesk theme (deployment v1.19.3, `helmfile/environments/default/theme.yaml.gotmpl`)

| key | value | used by upstream for |
|---|---|---|
| primary | `#571EFA` | Element, OX, XWiki, Jitsi |
| primary15 / 35 / 65 | `#e7dffa` / `#c7b3f3` / `#9673e9` | OX, NeoBoard; primary65 = openDesk Dark accent text |
| black / white | `#000000` / `#ffffff` | Element text (openDesk theme sets text-primary and -secondary to black) |
| secondaryGreyLight | `#f5f5f5` | OX, XWiki, Jitsi (portal canvas) |
| secondaryBlue / BlueHighcontrast | `#52c1ff` / `#0c3ff3` | "not in use yet" |
| secondaryRed / Yellow / Green / Grey | `#ff529e` / `#ffc700` / `#00ffcd` / `#adb3bc` | "not in use yet" |
| texts | productName "openDesk", slogan "Souverän gedacht. Flexibel gemacht." | |

Element (`helmfile/apps/element/values-element.yaml.gotmpl`): `default_theme: custom-openDesk`; custom theme
"openDesk" = bg-action-primary `#571EFA`, text-action-accent / icon-accent-tertiary `#571EFA`, text-primary and
-secondary `#000000`; "openDesk Dark" = primary `#571EFA`, accent `#9673e9`. Banner module
`io.element.element-web-modules.banner` (menu type `univention`, ICS) with the header wordmark.

### 2.2 opendesk.eu design tokens (`/assets/css/output.css`)

Primary ramp 50…1000: `#f7f5ff #ece7fe #dcd2fe #c8b9fd #aa98fb #8e75fa #7051fa #571efa #4519c2 #341291 #210c5c`.
Secondary (navy) ramp: `#f9fafb #eeeff2 #d3d7de #b6bcc8 #99a1b2 #7c879c #637089 #4d5b79 #364768 #203257 #121f3c`.
Neutral: `#f9fafb #f0f1f3 #d9dbdf #b7bbc2 #8f959f #3e4859 #283242 #131f30 #0a121e`. Accent `#00e6cc`/`#71efe1`.
Fonts: headings **Space Grotesk**, body **Open Sans**; radii `.25rem` / `.5rem`.

### 2.3 Live suite (od.blackpony.club, measured)

- Portal: body Open Sans 14px, text `rgb(32 50 87)` = `#203257`; primary button `#571EFA`, radius 4px; header 64px
  white with `#d9dbdf` bottom line; app tiles 88px white, 8px radius, hairline shadow, duotone icons.
- Keycloak login: lavender-grey field of blurred isometric app tiles, white card r≈12px, inputs tinted `#e6dcfd`,
  full-width violet "Sign In".
- Nextcloud: same suite bar; navigation grey with **filled #571EFA selected item, white text, r8**.
- Element (openDesk): banner `<nav>` 60px above `#matrixchat` (styled-components, hashed classes), app-grid button
  69px on `#f0f2f5`, wordmark image, Inter font.

### 2.4 2023 (deployment v0.3.0, Sep 2023 → v0.5.66, Dec 2023)

`theme.yaml`: primary **`#5e27dd`**, primary65 `#9673e9`, primary35 `#c7b3f3`, primary15 `#e7dffa`, the same secondary
palette; `logoHeaderSvgWhite` — a white wordmark for a **violet header**. Element 1.11 with the Nordeck
`net.nordeck.element_web.module.opendesk` banner (ICS navigation.json) and `custom_css_variables`
(`--cpd-color-text-action-accent: primary`). Realm "souvap".

## 3. Shared rules (all variants)

- Tokens: every Compound colour is mapped from `--od-*` custom properties (`shared.css`); variants only set those.
- **Suite bar** (enhancer, §6) or — on openDesk — openDesk's own banner restyled: `--od-bar`, `--od-bar-text`,
  `--od-wordmark` (the banner's logo `<img>` gets `content: var(--od-wordmark)`), hover tint on the grid button.
- Space column: Home = openDesk chat app tile; active space = primary-100 tile + 3px violet edge.
- Room list: 8px rounded rows; **selected = filled `--od-sel-bg` pill with white text** (Element's own left marker
  hidden, classic re-enables it); filters = portal outline buttons; uppercase section labels.
- Timeline: white; own messages primary-50; mentions `#fff7d6` with a secondaryYellow inset bar; pill date
  separators; violet read marker; outline reaction chips.
- Composer: 8px outlined row, violet focus ring; filled violet 4px send button.
- Buttons: primary filled violet 4px, secondary outline with violet text, destructive red.
- Dialogs: Keycloak card (white, 12px, navy shadow, 45% navy backdrop); menus 8px popovers; navy tooltips.
- Auth: Keycloak background (`od-login-background.webp`), openDesk logo instead of Element's.
- Focus: 2px `--od-focus` outline (usable: 3px `#0c3ff3` + white gap); field inputs get an inset outline.
- Module compatibility: datanauten module panels/buttons (`.twl-guide-panel`, `.speed-start-card`, … see PROD-QA)
  get openDesk radii/shadows.
- Reduced motion: all transitions/animations off.

## 4. Variants

### 4.1 opendesk-light (pure)
Defaults of `shared.css`. Palette: canvas `#f5f5f5`, surface `#fff`, text `#203257`, muted `#4d5b79`, subtle
`#5d6a85`, primary `#571EFA` (hover `#4519c2`, pressed `#341291`), tint `#ece7fe`/`#dcd2fe`/`#f7f5ff`, border
`#d3d7de`/`#99a1b2`, separator `#e1e4e8`.

### 4.2 opendesk-dark (pure)
Canvas `#0f1a2a`, surface `#131f30`, rail/bar `#0a121e`, separator `#283242`, text `#f0f1f3`, muted `#b7bbc2`,
primary `#6a45fb` (filled; selection keeps `#571EFA`), accent text `#aa98fb` (openDesk Dark's `#9673e9` is only
4.6:1 on `#131f30`; primary-400 is used for AA headroom), inverted wordmark, darkened login field.

### 4.3 opendesk-daylight (pure, local clock)
Schedule: 06:00 dawn (light) · 09:00 day (light) · 17:30 dusk (light) · 21:00 night (dark). Dawn: primary-50 canvas
and bar, `#ece7fe` own messages. Day: Light. Dusk: navy `#203257` suite bar **and** space column (white wordmark,
`#eeeff2` rail text), secondary-100 canvas. Night: openDesk Dark (`opendesk-dark.css` is loaded for this variant and
also matches `[data-tl-phase="night"]`). 2s fade on the large surfaces only, during `data-tl-phase-fading`.

### 4.4 opendesk-usable (usable) — "Barrierefrei"
For long days and BITV 2.0: text `#131f30` (16:1), muted `#3e4859`, primary `#4519c2` (9.6:1 with white), control
outlines `#637089` (5:1), focus 3px `#0c3ff3` + 2px white gap, links underlined, body 15px / line-height 1.6,
40px header/composer targets, unread rooms with a 4px bar and white row (never colour alone), wide permanent
scrollbars, no transitions, `prefers-contrast: more` darkens muted text and borders further. 48px suite bar.

### 4.5 opendesk-classic (past) — Souveräner Arbeitsplatz 2023
Violet `#5e27dd` 56px banner with the white 2023 wordmark (`od-classic-wordmark-white.svg`, from v0.3.0),
black text, rail `#ebedf1`, 2px/4px corners, selection = primary15 `#e7dffa` row with Element's left marker in
violet, sky `#52c1ff` filter chips, mint `#00ffcd` code-block edge, `#c8005a` highlight pills (secondaryRed
darkened for white text), sky edge on own messages, violet-gradient login.

### 4.6 opendesk-2028 (future)
opendesk.eu marketing language in-product: radial lavender/sky/mint canvas, frosted 64px bar with date/time,
room list and room view as **floating 18px cards**, Space Grotesk headings, 10/14/18/22px radii, pill chips,
**violet → blue gradient** (`#571efa → #4a52f0 → #2f7fe0`) on primary buttons, selected room, unread pills, the send
button and the composer's focus hairline; mint `#00e6cc` mention bar. Opaque fallback without `backdrop-filter`.

### 4.7 opendesk-hyperdesk (exciting)
`#0c0820` night; the Keycloak app-tile field as wallpaper (luminosity blend) under violet and mint glows; translucent
panels (dialogs/menus opaque `#150d34`); a 56px neon grid in the room view (one background, no per-tile effects);
mint `#00ffcd` for links, focus, unread pills and the "CHAT" label; selected room = violet→pink gradient with glow;
uppercase Space Grotesk headings/filters; a 9s drifting gradient line under the suite bar (static under reduced
motion). Contrast: text `#f3f0ff` on ≥ `#150d34`, muted `#c3b9f2`.

## 5. Accessibility notes

All variants pass the harness edge check (axe contrast 0 nodes after fixes). Deviations from the pure brand values
for AA: subtle text `#5d6a85` instead of lighter greys, function colour `#0b5a8e`, dark accent text `#aa98fb`, red
`#b42020`/`#d63b3b` for text/fills, classic highlight `#c8005a` instead of `#ff529e`.

## 6. Enhancer (`enhance.ts`)

- Renders the suite bar into the overlay root and sets `html[data-od-topbar]` (Element is moved down by
  `--od-bar-h`). Content: app-grid button (only if apps are known) → "Applications"/"Anwendungen" popover with
  the openDesk app tiles (3 columns, 48px icons, current app marked), openDesk wordmark → portal, "Chat" label,
  date/time on 2028 and Hyperdesk. Esc and outside click close the popover; focus moves into it.
- Config: `de.datanauten.theme_loader.opendesk = { topbar: "auto"|"always"|"never", portal_url, apps: [{id,name,url,icon}] }`.
  Without `apps` and on `chat.<domain>`, openDesk's default host names are derived (portal., files., webmail.
  (+ OX calendar/contacts/tasks), projects., wiki., meet., notes.). Otherwise no grid button.
- `topbar: "auto"` (default): when openDesk's banner module is configured (`io.element.element-web-modules.banner`
  in config.json) or its `<nav>` is present, nothing is rendered — the CSS restyles the banner instead. Not shown
  in an installed PWA (`display-mode: standalone`).
- Everything is removed in `unmount()`; errors are logged with `[theme-loader] [opendesk]`.
