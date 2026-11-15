# 04 — Artistic Style Dossiers for Element Web

Status: research, 2026-11-15. Scope: five artistic directions (+ two cross-cutting overlays) to be delivered as
CSS + webfonts (+ optional SVG filters and small injected DOM) on top of Element Web.

Conventions used below:

- **Selectors** refer to current Element Web DOM classes (verify against the running build, they drift):
  `.mx_MatrixChat`, `.mx_SpacePanel`, `.mx_LeftPanel`, `.mx_RoomList` / `.mx_RoomListItemView` (new room list) /
  `.mx_RoomTile` (legacy), `.mx_RoomView`, `.mx_RoomHeader`, `.mx_RoomView_timeline`, `.mx_EventTile`,
  `.mx_EventTile_line`, `.mx_EventTile[data-layout="bubble"]`, `.mx_DisambiguatedProfile`, `.mx_BaseAvatar`,
  `.mx_MessageComposer`, `.mx_BasicMessageComposer_input`, `.mx_Dialog`, `.mx_Dialog_background`,
  `.mx_AccessibleButton`, `.mx_ContextualMenu`, `.mx_Tooltip` / Radix tooltips, `.mx_UserMenu`.
- **Tokens**: Element Web uses Compound design tokens (`--cpd-color-bg-canvas-default`,
  `--cpd-color-text-primary`, `--cpd-color-text-secondary`, `--cpd-color-bg-subtle-secondary`,
  `--cpd-color-border-interactive-primary`, `--cpd-color-text-action-accent`, `--cpd-font-family-sans`,
  `--cpd-font-family-mono`, …). Every recipe below should first remap tokens, then add decoration with
  selectors. That keeps 80% of the UI (menus, settings, dialogs) coherent for free.
- **Font licenses**: OFL = SIL Open Font License 1.1 (self-hosting/webfont use OK, can't sell the font alone,
  Reserved Font Name rules apply if you modify/subset-and-rename). Apache = Apache 2.0.
- Google Fonts CSS2 API: `https://fonts.googleapis.com/css2?family=Name:wght@400;700&display=swap`.
  For a privacy-respecting Matrix client prefer **self-hosting** via Fontsource
  (`https://cdn.jsdelivr.net/npm/@fontsource/<slug>@<ver>/index.css` or npm) or bundling the woff2 in the theme.

---

## 0. Shared building blocks (reused by several styles)

```css
/* 0.1 reduced-motion kill switch — mandatory in every theme */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}

/* 0.2 forced-colors / Windows High Contrast: drop decoration, keep structure */
@media (forced-colors: active) {
  * { background-image: none !important; text-shadow: none !important; filter: none !important; }
}

/* 0.3 universal visible focus ring, themable */
:root { --theme-focus: #1a73e8; --theme-focus-width: 3px; }
:focus-visible { outline: var(--theme-focus-width) solid var(--theme-focus) !important; outline-offset: 2px; }

/* 0.4 "decoration level" switch: one theme file, several intensities */
:root[data-ewt-level="1"] { --deco: 0; }   /* tasteful */
:root[data-ewt-level="4"] { --deco: 1; }   /* maximal */
/* loader sets data-ewt-level on <html>; CSS uses it in selectors, e.g.
   :root[data-ewt-level="4"] .mx_EventTile { transform: rotate(-.4deg); } */
```

Inline-SVG filter host (injected once into `<body>` by the loader; referenced from CSS with `filter: url(#id)`):

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
  <defs>
    <filter id="ewt-wobble"><feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="1"/>
      <feDisplacementMap in="SourceGraphic" scale="4"/></filter>
  </defs>
</svg>
```

Note: `filter: url(#…)` on large scrolling containers (whole timeline) is expensive in Chromium/Electron; apply
to borders/pseudo-elements/headers, not to `.mx_RoomView_timeline` itself, and never to text you need to read.

---

## 1. Comic Sans Party / Evil 90s Poster WordArt / GeoCities

### 1.1 Concept
The "Microsoft Office 97 + GeoCities 1998 + school-fete poster" universe: Comic Sans, rainbow WordArt
headings, tiled starfield/marble backgrounds, beveled grey buttons, marquees, blink, `<hr>` rainbows,
"Under Construction" workers, visitor counters, clip-art. Graded from "ironic but you could work in it" to
"actively hostile".

### 1.2 Fonts

| Font | Role | Source / URL | License |
|---|---|---|---|
| **Comic Sans MS** (Microsoft/Monotype, Vincent Connare 1994) | the real thing | Only as a *local* font: `font-family: "Comic Sans MS", …` — installed on Windows/macOS, not on most Linux. | Proprietary. Webfont embedding needs a Monotype web license (pageview metered, per domain). **Do not self-host the .ttf.** Use `local()` only. |
| **Comic Neue** (Craig Rozynski) | clean, "grown-up" Comic Sans | `https://fonts.googleapis.com/css2?family=Comic+Neue:ital,wght@0,300;0,400;0,700;1,400&display=swap` · https://comicneue.com · https://github.com/crozynski/comicneue | OFL |
| **Comic Relief** (Jeff Davis / loudifier) | *metric-compatible* Comic Sans clone (drop-in, same widths) | `https://fonts.googleapis.com/css2?family=Comic+Relief:wght@400;700&display=swap` · https://github.com/loudifier/Comic-Relief · Fontsource `@fontsource/comic-relief` | OFL, RFN "Comic Relief" |
| **Comic Mono** (dtinth) | monospace for code blocks | https://dtinth.github.io/comic-mono-font/ · npm `comic-mono` | MIT (derived from Comic Shanns, MIT) |
| **Comic Shanns Mono** | alt mono | https://github.com/jesusmgg/comic-shanns-mono | MIT |
| **Chewy**, **Luckiest Guy**, **Bowlby One SC** | WordArt headline display faces | Google Fonts (`family=Chewy`, `family=Luckiest+Guy`, `family=Bowlby+One+SC`) | OFL (Chewy/Luckiest Guy: Apache 2.0 historically; Google lists OFL/Apache — check METADATA) |
| **Times New Roman / Impact / Arial Black** | the other 90s system faces | `local()` only | Proprietary (core fonts) |
| **Pixelify Sans**, **VT323**, **Press Start 2P** | hit counter / LED / pixel bits | Google Fonts | OFL |

Recommended stack (uses real Comic Sans where installed, falls back to the metric clone so layout is stable):

```css
@font-face { font-family: "EWT Comic"; src: local("Comic Sans MS"), local("ComicSansMS"),
  url("fonts/ComicRelief-Regular.woff2") format("woff2"); font-weight: 400; font-display: swap; }
@font-face { font-family: "EWT Comic"; src: local("Comic Sans MS Bold"), local("ComicSansMS-Bold"),
  url("fonts/ComicRelief-Bold.woff2") format("woff2"); font-weight: 700; font-display: swap; }
:root { --cpd-font-family-sans: "EWT Comic", "Comic Neue", "Chalkboard SE", cursive;
        --cpd-font-family-mono: "Comic Mono", "Comic Shanns Mono", monospace; }
```

### 1.3 Palettes

- **Ironic Office 97** (level 1–2): `#C0C0C0` face, `#FFFFFF` highlight, `#808080` shadow, `#000080` title bar,
  `#0000EE` link, `#551A8B` visited, `#FFFFE1` tooltip yellow, `#008080` desktop teal.
- **GeoCities night** (level 3): bg `#000000` w/ starfield, text `#FFFF00`, links `#00FFFF`, visited `#FF00FF`,
  accent `#FF0000`, `#00FF00`.
- **Party poster** (level 3–4): `#FF00FF` magenta, `#00FFFF` cyan, `#FFFF00` yellow, `#FF6600` orange,
  `#33CC33` green, `#9900FF` purple, `#FF0066` hot pink.
- **WordArt rainbow stops**: `#FF0000 #FF7F00 #FFFF00 #00FF00 #0000FF #4B0082 #8B00FF`.
- **WordArt "gold"**: `#FFF7AA → #FFD700 → #B8860B → #FFEB80` (+ outline `#7A4E00`).
- **WordArt "chrome"**: `#FFFFFF → #9FA6B2 → #2B2F36 → #E7EBF0 → #6D7480`.

### 1.4 Technique recipes

**WordArt rainbow arc-less (gradient fill + outline + drop shadow):**
```css
.ewt-wordart-rainbow {
  font: 700 2.2em/1 "Impact", "Luckiest Guy", "EWT Comic", sans-serif;
  background: linear-gradient(90deg,#f00,#ff7f00,#ff0,#0f0,#00f,#4b0082,#8b00ff);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  -webkit-text-stroke: 1.5px #000;
  filter: drop-shadow(4px 4px 0 #808080);           /* text-shadow is invisible with transparent text */
}
```

**WordArt 3D extrusion (classic "blue-to-purple with grey depth"):**
```css
.ewt-wordart-3d {
  color: #3a7bff; font-weight: 900;
  text-shadow: 1px 1px 0 #2a2a6a, 2px 2px 0 #2a2a6a, 3px 3px 0 #2a2a6a, 4px 4px 0 #2a2a6a,
               5px 5px 0 #2a2a6a, 6px 6px 0 #2a2a6a, 7px 7px 6px rgba(0,0,0,.5);
  transform: perspective(300px) rotateX(18deg) skewX(-8deg);
}
```

**WordArt "gold italic serif" (the gallery's row-3 style):**
```css
.ewt-wordart-gold {
  font: italic 900 2em "Times New Roman", serif;
  background: linear-gradient(180deg,#fff7aa 0%,#ffd700 45%,#b8860b 55%,#ffeb80 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  -webkit-text-stroke: 1px #7a4e00; filter: drop-shadow(3px 3px 0 #000);
}
```

**WordArt wave / arch** — CSS can't bend a text baseline; options: (a) split text into spans and
`transform: translateY(calc(sin(var(--i) * 30deg) * 8px))` (CSS trig is baseline-available 2023+);
(b) inject an SVG `<textPath>` for the room name in the header (loader-side); (c) `@keyframes` bounce per letter
(rotating `animation-delay`). For room names, (a) via a tiny injected `splitText()` is acceptable.

**Beveled Win95 button:**
```css
.mx_AccessibleButton_kind_primary, .mx_Dialog button {
  background: #c0c0c0; color: #000; border-radius: 0; border: 0;
  box-shadow: inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf;
}
.mx_AccessibleButton_kind_primary:active { box-shadow: inset 1px 1px #0a0a0a, inset -1px -1px #fff,
  inset 2px 2px #808080, inset -2px -2px #dfdfdf; }
```
(Reuse: **98.css** by Jordan Scales, MIT, `https://unpkg.com/98.css@0.1.21/dist/98.css` — great for dialogs.)

**Rainbow `<hr>` / separators:**
```css
.mx_RoomView_MessageList hr, .mx_TimelineSeparator, .mx_DateSeparator hr {
  height: 6px; border: 0;
  background: linear-gradient(90deg,#f00,#ff7f00,#ff0,#0f0,#00f,#4b0082,#8b00ff);
}
```

**Blink & marquee without the dead elements:**
```css
@keyframes ewt-blink { 50% { visibility: hidden; } }
.ewt-blink { animation: ewt-blink 1s steps(1) infinite; }

@keyframes ewt-marquee { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
.mx_RoomHeader_topic { overflow: hidden; white-space: nowrap; }
.mx_RoomHeader_topic > * { display: inline-block; animation: ewt-marquee 12s linear infinite; }
```

**Tiled backgrounds** (no external GIF needed — CSS-only starfield):
```css
.mx_RoomView_body {
  background-color: #000;
  background-image:
    radial-gradient(1px 1px at 10px 20px,#fff 50%,transparent 51%),
    radial-gradient(1px 1px at 60px 80px,#ff0 50%,transparent 51%),
    radial-gradient(2px 2px at 130px 40px,#0ff 50%,transparent 51%),
    radial-gradient(1px 1px at 170px 150px,#fff 50%,transparent 51%);
  background-size: 200px 200px;
}
```
Other tiles: "marble" (use a seamless PNG/SVG feTurbulence tile as data-URI), "clouds" (Windows 95 sky),
"blue sky + fluffy clouds", "parchment". The **Cameron's World** collage and **gifcities.org** (Internet
Archive's GeoCities GIF search) are the canonical sources for the real GIFs — note copyright is murky; ship only
self-made or CC0 re-creations in the repo, offer "fetch from gifcities" as user opt-in.

**Under-construction / hit counter (injected DOM or pure CSS ::after):**
```css
.mx_RoomHeader::after {
  content: "VISITORS: 000" attr(data-ewt-count);   /* loader sets a fake/real counter */
  font: 14px "VT323", monospace; color: #0f0; background: #000; padding: 0 6px;
  border: 2px inset #808080; margin-left: auto;
}
.mx_RoomView_emptyState::before { content: url("img/under-construction.gif"); } /* CC0 recreation */
```

**Cursor & sparkles:** `cursor: url("img/rainbow-cursor.png") 0 0, auto;` and an opt-in JS cursor trail
(the classic is `cursor-effects` by tholman, MIT: https://github.com/tholman/cursor-effects, CDN
`https://unpkg.com/cursor-effects@1.0.17/dist/browser.js`).

**Clip-art**: OpenMoji (CC BY-SA 4.0), Twemoji (CC BY 4.0) are safe; "real" Microsoft clip-art isn't. For the
Clippy gag: **clippy.js** (MIT, smore-inc; https://github.com/clippyjs/clippy.js) — sprites are MS-derived,
treat as risky; prefer a self-drawn paperclip.

### 1.5 Graded variants

| Level | Name | What it does |
|---|---|---|
| 1 | **Casual Friday** | Comic Neue everywhere, Element's own palette, slightly rounded, one rainbow date separator. Fully readable. |
| 2 | **Office 97** | Comic Sans/Relief, grey bevels (98.css), navy title-bar gradient on `.mx_RoomHeader` (`linear-gradient(90deg,#000080,#1084d0)`), yellow tooltips. |
| 3 | **GeoCities Homepage** | Black starfield timeline, yellow text, cyan links, rainbow HRs, marquee topic, hit counter, WordArt room name, under-construction empty state, Times-New-Roman for timestamps. |
| 4 | **Party Poster** | Each sender gets a WordArt style (rotate through 6 gallery styles by `data-ewt-sender-hash`), tiled marble left panel, blinking unread badges, animated rainbow composer border, tilted message tiles (±1°). |
| 5 | **Maximal / Unreadable** | Everything at 4 + rotating hue animation on the whole app (`filter: hue-rotate` keyframes), Comic Sans 3D extrusion on body text, cursor trail, wave-baseline letters, low-contrast `#FF00FF` on `#00FFFF`. Joke only — ship behind an "I accept" toggle and auto-respect `prefers-reduced-motion`. |

### 1.6 Chat mapping

- **Room list**: grey bevel tiles (level 2); level 3+ each tile a "web ring" button `[ << Prev | Room | Next >> ]`; unread badge = little red "NEW!" GIF-style starburst (`clip-path: polygon(...)` 16-point star, `#FF0000`/`#FFFF00` text).
- **Header**: WordArt room name, scrolling topic marquee, visitor counter.
- **Timeline**: per-sender text colour from the GeoCities 16 colour web-safe palette; `<hr>` rainbow day separators; links underlined blue/purple.
- **Message bubbles** (bubble layout): yellow sticky-note "speech balloons" with Comic font, or Win95 tooltip boxes (`#FFFFE1`, 1px black border).
- **Composer**: inset Win95 text field; send button = beveled "Submit Query" (the classic default form label, `content: "Submit Query"`).
- **Dialogs**: Win95 window chrome (98.css `.window`, `.title-bar`), "×" close button bevel.

### 1.7 Accessibility risks
Animations (blink/marquee/hue-rotate) → vestibular & seizure risk: WCAG 2.3.1 (≤3 flashes/sec — `steps(1)` blink at 1 s is fine; hue-rotate fast loops are not). Starfield backgrounds lower contrast; keep a solid band behind text (`background: rgba(0,0,0,.85)` on `.mx_EventTile_line`). Comic Sans itself is actually fine (often preferred by dyslexic readers). Transparent-text gradients break in forced-colors — guard with 0.2. Marquee content must also be readable statically (reduced-motion).

### 1.8 References
- WordArt recreated as CSS3 text effects — https://www.designpieces.com/2017/03/wordart-css3-text-effects/
- css-wordart (MIT, SCSS, rainbow/blues/superhero/radial/tilt/purple/horizon/italic-outline/slate themes) — https://github.com/yershalom/css-wordart · npm `css-wordart`; React wrapper `react-wordart`
- Make WordArt (generator) — https://www.makewordart.com/
- 98.css (MIT) — https://jdan.github.io/98.css/ · https://github.com/jdan/98.css
- Cameron's World (GeoCities collage) — https://www.cameronsworld.net/
- GifCities (Internet Archive) — https://gifcities.org/
- One Terabyte of Kilobyte Age — https://blog.geocities.institute/
- Comic Neue — https://comicneue.com/ ; Comic Relief — https://github.com/loudifier/Comic-Relief
- Comic Mono — https://dtinth.github.io/comic-mono-font/
- Rainbow text techniques — https://dev.to/itsopensource/rainbow-text-with-css-1fmi

---

## 2. Hand-drawn / Sketch (spectrum: scribble → designed sketch UI)

### 2.1 Fonts

| Font | Character | URL | License |
|---|---|---|---|
| **Excalifont** (Excalidraw, 2024 successor of Virgil) | the Excalidraw hand | https://plus.excalidraw.com/excalifont · woff2 shipped in `@excalidraw/excalidraw` package assets (`dist/prod/fonts/Excalifont/`) | OFL-1.1 (Arch packages it as OFL-1.1-no-RFN; the page also mentions MIT for a download — verify LICENSE in repo before bundling) |
| **Virgil** (Excalidraw legacy) | rougher, Excalidraw classic | https://github.com/excalidraw/virgil | OFL-1.1 |
| **Balsamiq Sans** | wireframe neat-hand | `https://fonts.googleapis.com/css2?family=Balsamiq+Sans:ital,wght@0,400;0,700;1,400&display=swap` | OFL |
| **Architects Daughter** | architect caps-ish, very legible | `family=Architects+Daughter` | OFL |
| **Patrick Hand** / **Patrick Hand SC** | very legible, UI-grade | `family=Patrick+Hand` | OFL |
| **Kalam** (300/400/700) | Indian-designed, multiweight, great body | `family=Kalam:wght@300;400;700` | OFL |
| **Caveat** (variable 400–700) | casual marker, compact | `family=Caveat:wght@400..700` | OFL |
| **Gochi Hand** | kid-ish marker | `family=Gochi+Hand` | OFL |
| **Gaegu** (300/400/700, Korean+Latin) | soft pencil | `family=Gaegu:wght@300;400;700` | OFL |
| **Shadows Into Light** / **Two** | thin felt pen | `family=Shadows+Into+Light` | OFL |
| **Indie Flower**, **Handlee**, **Coming Soon** | notebook | Google Fonts | OFL / Apache (Coming Soon) |
| **Permanent Marker** | thick Sharpie headlines | `family=Permanent+Marker` | Apache 2.0 |
| **Rock Salt** | messy marker (hard to read) | `family=Rock+Salt` | Apache 2.0 |
| **Reenie Beanie** | scrawl (unreadable end) | `family=Reenie+Beanie` | OFL |
| **Nanum Pen Script**, **Zeyada**, **La Belle Aurore** | illegible cursive end | Google Fonts | OFL |
| **Cabin Sketch** / **Fredericka the Great** | sketched display caps | Google Fonts | OFL |
| **xkcd Script** | Randall-style caps | https://github.com/ipython/xkcd-font | CC BY-NC 3.0 (non-commercial!) |

### 2.2 Palettes
- **Notebook paper**: paper `#FDFBF4`, rule blue `#A7C7E7`, margin red `#E8817F`, graphite ink `#2B2B2B`, pencil grey `#6B6B6B`, highlighter `#FFF176`.
- **Excalidraw**: canvas `#FFFFFF`, stroke `#1E1E1E`, palette `#E03131 #2F9E44 #1971C2 #F08C00`, fills `#FFC9C9 #B2F2BB #A5D8FF #FFEC99`, selection `#6965DB`; dark canvas `#121212`, stroke `#E3E3E8`.
- **Blueprint**: `#0D3B66` / `#1E4F8A` bg, grid `rgba(255,255,255,.12)`, line `#E8F1FF`, accent `#FFD166`.
- **Whiteboard**: `#F7F7F5` board, marker black `#1B1B1B`, blue `#1F5BD6`, red `#D62828`, green `#1A936F`, ghost-erased `rgba(0,0,0,.06)`.
- **Napkin / kraft**: `#E9DCC3` / kraft `#C8A97E`, ballpoint blue `#22408C`, coffee ring `rgba(111,78,55,.18)`.
- **Chalkboard (dark)**: `#2E3B32` slate, chalk `#F2F2EA`, chalk yellow `#F7E37A`, chalk pink `#F4A6B8`.

### 2.3 Technique recipes

**Irregular "hand-drawn" border radius** (the PaperCSS trick):
```css
.ewt-sketch-box {
  border: 2px solid #2b2b2b;
  border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px;
}
/* variants to rotate between so not every box is identical */
.ewt-sketch-box:nth-child(3n+1) { border-radius: 15px 255px 15px 225px / 225px 15px 255px 15px; }
.ewt-sketch-box:nth-child(3n+2) { border-radius: 225px 25px 255px 15px / 25px 255px 15px 225px; }
```

**SVG wobble filter (turbulence + displacement)** — apply to borders/pseudo-elements, not text:
```html
<filter id="ewt-rough" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G"/>
</filter>
```
```css
.mx_EventTile_bubbleContainer::before, .mx_RoomTile::before {
  content: ""; position: absolute; inset: 0; border: 2px solid currentColor;
  border-radius: 8px; filter: url(#ewt-rough); pointer-events: none;
}
```

**"Boiling" lines (animated wobble, the Ed Edd n Eddy look)** — swap seeds in steps:
```html
<filter id="ewt-boil-0"><feTurbulence baseFrequency=".04" numOctaves="2" seed="1"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>
<filter id="ewt-boil-1"><feTurbulence baseFrequency=".04" numOctaves="2" seed="2"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>
<filter id="ewt-boil-2"><feTurbulence baseFrequency=".04" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter>
```
```css
@keyframes ewt-boil { 0%{filter:url(#ewt-boil-0)} 33%{filter:url(#ewt-boil-1)} 66%{filter:url(#ewt-boil-2)} }
.ewt-boil { animation: ewt-boil .4s steps(1) infinite; }   /* only on hover/focus or headers */
```

**Double-stroke "drawn twice" outline** (cheap, no filter):
```css
.ewt-double { position: relative; border: 2px solid #222; border-radius: 12px 4px 10px 6px; }
.ewt-double::after { content:""; position:absolute; inset:-3px -1px -2px -4px; border:1.5px solid #222;
  border-radius: 6px 14px 5px 12px; transform: rotate(-.6deg); opacity:.7; pointer-events:none; }
```

**Hatching fill** (rough.js "hachure" look in pure CSS):
```css
.ewt-hatch { background: repeating-linear-gradient(-45deg, transparent 0 6px, rgba(30,30,30,.35) 6px 7px); }
.ewt-crosshatch { background:
  repeating-linear-gradient(45deg, transparent 0 7px, rgba(0,0,0,.25) 7px 8px),
  repeating-linear-gradient(-45deg, transparent 0 7px, rgba(0,0,0,.25) 7px 8px); }
/* Excalidraw-like hachure for selected room: */
.mx_RoomTile_selected { background: repeating-linear-gradient(-41deg, transparent 0 5px, #a5d8ff 5px 7px); }
```

**Notebook ruled paper & margin line:**
```css
.mx_RoomView_body {
  background-color: #fdfbf4;
  background-image:
    linear-gradient(90deg, transparent 63px, #e8817f 63px 65px, transparent 65px),
    repeating-linear-gradient(transparent 0 27px, #a7c7e7 27px 28px);
  background-attachment: local;           /* lines scroll with messages */
}
:root { --ewt-line: 28px; } .mx_EventTile_line { line-height: var(--ewt-line); }  /* snap text to rules */
```

**Graph paper / blueprint grid:**
```css
.ewt-blueprint { background-color:#1e4f8a; background-image:
  linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px),
  linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px);
  background-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px; }
```

**Pencil / paper grain texture** (inline SVG noise as data-URI, multiplies over paper):
```css
.mx_MatrixChat::after { content:""; position:fixed; inset:0; pointer-events:none; z-index:9999; opacity:.18;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
```

**Highlighter on mentions / selection:**
```css
.mx_EventTile_highlight .mx_EventTile_line, ::selection {
  background: linear-gradient(100deg, transparent 2%, #fff176cc 4% 94%, transparent 97%);
  background-size: 100% 70%; background-position: 0 60%; background-repeat: no-repeat; }
```

**Scribble underline (SVG data-URI) for links/active tab:**
```css
a, .mx_RoomTile_selected .mx_RoomTile_title {
  text-decoration: none;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 8' preserveAspectRatio='none'%3E%3Cpath d='M0 5 Q 25 1 50 5 T 100 4' stroke='%23e03131' stroke-width='2' fill='none'/%3E%3C/svg%3E") bottom/100% 6px no-repeat;
  padding-bottom: 4px; }
```

**Tape on dialogs / sticky notes:**
```css
.mx_Dialog { transform: rotate(-.5deg); box-shadow: 4px 6px 0 rgba(0,0,0,.15); }
.mx_Dialog::before { content:""; position:absolute; top:-12px; left:50%; width:110px; height:28px;
  translate:-50% 0; rotate:-3deg; background: rgba(255,255,200,.6); border-left:2px dashed rgba(0,0,0,.08);
  border-right:2px dashed rgba(0,0,0,.08); }
```

**Avatars as pencil circles:** `.mx_BaseAvatar { border-radius: 50% 45% 55% 48% / 52% 50% 48% 50%; outline: 2px solid #222; filter: grayscale(1) contrast(1.2); }`

**Real rough rendering (optional JS):** rough.js can draw `<canvas>`/SVG boxes behind elements
(`rough.svg(svg).rectangle(x,y,w,h,{roughness:1.5, fillStyle:'hachure'})`) — use a ResizeObserver on
`.mx_EventTile_bubbleContainer`, cache per size. Costly in a long timeline; restrict to header/composer/dialogs.

### 2.4 Graded levels (8)

| # | Name | Fonts | Recipe | Readability |
|---|---|---|---|---|
| 1 | **Designed sketch (Balsamiq)** | Balsamiq Sans body, Architects Daughter headings | Clean white, 2px #222 borders with irregular radius on cards only, no filters, hatch on selected room. | Full |
| 2 | **Excalidraw** | Excalifont headings / Nunito-like or Kalam body | Excalidraw palette, double-stroke outlines, hachure fills on badges, `#6965DB` selection, light & dark variants. | Full |
| 3 | **Notebook** | Patrick Hand / Kalam | Ruled paper timeline w/ red margin; room list = index-tab dividers; highlighter mentions; tape on dialogs. | Full |
| 4 | **Whiteboard** | Permanent Marker headings, Caveat body | Marker strokes (`ewt-rough` on borders), colour-coded senders (marker colours), ghost "erased" texture. | High |
| 5 | **Blueprint / Chalkboard (dark)** | Architects Daughter / Gaegu | Blue grid or slate bg, chalk white `ewt-rough` lines, chalk-dust noise overlay with `mix-blend-mode: screen`. | High (watch contrast of chalk-yellow) |
| 6 | **Napkin** | Gochi Hand / Shadows Into Light | Kraft/napkin texture, ballpoint blue, coffee-ring radial gradients randomly placed, everything rotated ±0.7°. | Medium |
| 7 | **Boiling cartoon** | Rock Salt headings, Gochi Hand body | Animated boil on all borders, wobble on avatars, cross-hatch shadows, jittery hover (`@keyframes` translate 1px). | Medium-low |
| 8 | **Scribble (unreadable)** | Reenie Beanie / Zeyada / La Belle Aurore | `ewt-rough` scale 6 applied to text containers, heavy crosshatch, letters rotated per-span, pencil-smudge blur, graphite-on-graphite. Joke tier. | Low |

### 2.5 Chat mapping
- **Room list**: index cards or notebook tabs; unread badge = hand-drawn circle around count (`border-radius` trick + `ewt-rough`); selected room = highlighter swipe.
- **Header**: room name in marker font with scribble underline; topic as pencil margin note.
- **Timeline**: ruled lines aligned to `line-height`; sender names as margin annotations (left gutter, rotated −2°); day separators as hand-drawn arrows `→ Tuesday`.
- **Bubbles**: speech balloons with irregular radius and a hand-drawn tail (`clip-path` triangle + rough filter); own messages in blue ink, others graphite.
- **Composer**: a sticky note at the bottom, "Write here…" placeholder in Caveat; send = circled arrow.
- **Dialogs**: taped paper sheet, slight rotation, drop shadow offset (no blur) for "cut-out paper".
- **Code blocks**: graph-paper background with Comic Mono or `Kalam` fallback (keep mono for alignment: use **Victor Mono**/JetBrains Mono, not handwriting).

### 2.6 Accessibility risks
Handwriting fonts have lower x-height & legibility: bump font-size 10–15% (Caveat needs ~1.2×). Keep body text in levels 1–4 legible fonts (Patrick Hand, Kalam, Balsamiq). Never displace text with filters. Boiling animation → reduced-motion guard. Ruled backgrounds create visual noise for dyslexic users; offer "plain paper" toggle. Ensure ink colors ≥ 4.5:1 on paper (`#2B2B2B` on `#FDFBF4` ≈ 13:1; chalk `#F7E37A` on `#2E3B32` ≈ 8:1 OK).

### 2.7 Libraries to reuse

| Lib | What | License | CDN |
|---|---|---|---|
| **PaperCSS** (rhyneav) | full sketch CSS framework, origin of the radius trick | ISC | `https://unpkg.com/papercss@1.9.2/dist/paper.min.css` · https://www.getpapercss.com/ |
| **doodle.css** (chr15m) | hand-drawn theme via `class="doodle"`, uses Short Stack font + SVG border-image | MIT | npm `doodle.css`; `https://cdn.jsdelivr.net/npm/doodle.css/doodle.css` (pin version) · https://chr15m.github.io/DoodleCSS/ |
| **rough.js** (pshihn) | sketchy canvas/SVG primitives | MIT | `https://unpkg.com/roughjs@4.6.6/bundled/rough.js` · https://roughjs.com/ |
| **wired-elements** (rough-stuff) | web components in rough style | MIT | `https://unpkg.com/wired-elements@3.0.0-rc.6/lib/wired-elements-bundle.js` · https://wiredjs.com/ |
| **rough-notation** (pshihn) | animated hand-drawn underline/box/circle/highlight annotations | MIT | `https://unpkg.com/rough-notation@0.5.1/lib/rough-notation.iife.js` — great for mentions/pins |
| **Excalidraw** | reference palette/fonts | MIT (code), OFL (fonts) | https://github.com/excalidraw/excalidraw |
| **Notebook paper / sketchy CodePens** | recipes | varies | see refs |

### 2.8 References
- PaperCSS — https://www.getpapercss.com/ · https://github.com/papercss/papercss
- DoodleCSS — https://github.com/chr15m/doodlecss
- rough.js — https://roughjs.com/ ; wired-elements — https://wiredjs.com/ ; rough-notation — https://roughnotation.com/
- Excalifont announcement — https://plus.excalidraw.com/excalifont ; Virgil — https://github.com/excalidraw/virgil
- Balsamiq Sans — https://balsamiq.com/givingback/opensource/font/
- Codrops "SVG filter effects: creating texture with feTurbulence" (feTurbulence + feDisplacementMap) — https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence/
- Codrops "Animated hand-drawn / boiling line" examples — https://tympanus.net/codrops/2019/03/12/svg-filter-effects-outline-text-with-femorphology/ (filter family)
- Hand-drawn border radius explainer (9elements "Fancy border radius") — https://9elements.github.io/fancy-border-radius/
- Hand-drawn style with CSS (Smashing / dev.to, "Sketchy UI with CSS") — https://dev.to/search?q=hand%20drawn%20css

---

## 3. Enlightenment Desktop (E16 / E17 / E-current) and dark-colour mashups

### 3.1 History & signature looks

**E16 (DR16, ~1999–2003; still maintained)** — pixmap-based theming, extreme individuality:
- **BrushedMetal-Tigert** (Tuomas "tigert" Kuosmanen, 1998/99, the 0.15/0.16 default): horizontally brushed grey metal title bars and borders, small chunky bevelled buttons (close/max/iconify) with dark recessed wells, black pixel font titles, iconbox/pager in matching metal, slightly blue-tinted greys. Palette approx `#B4B8BC #8E9398 #6A6F74 #D9DCDE #3B3F44`, title text `#000`/`#FFF` with 1px emboss.
- **ShinyMetal**: polished chrome gradient bars (bright specular band near top), glassy round buttons, higher contrast; `#E8ECF0 → #9AA3AD → #4E5762`.
- **BlueSteel**: steel with blue cast `#5D7A99 #8FA7C0 #2E3E52`; **Ganymede**: moody green/blue-grey sci-fi.
- Everything bundled today in `e16-themes` (BlueSteel, BrushedMetal-Tigert, Ganymede, ShinyMetal).
- Signature moves: bevel + 1px dark outline + inner highlight; noise/brush texture; tiny 7–9px pixel fonts; window shading (roll-up); translucent iconboxes; "Epplets" (dockapps); per-desktop gradient backgrounds; alpha "transparent" menus.

**E17 (0.17, released 2012 after a decade of development)** — Edje (EET/EDC compiled) vector+bitmap themes:
- Default (Raster's "dark" theme, refined through E18–E22 and still the base of **E-current**: Enlightenment 0.26/0.27): charcoal surfaces `#1B1B1B–#2D2D2D–#3A3A3A`, glossy top-light gradient on bars, crisp 1px dark border and 1px inner light line, and the signature **electric-blue glow** on focus, selection, sliders, clock hands: `#3399FF` core with soft halo (`#0077FF` → transparent). Text `#D8D8D8`, disabled `#6C6C6C`.
- The **shelf** (bottom gadget bar) with glossy dark glass, **Ibar** icon launcher with "pulse" on launch, **pager** with tiny window previews, the **analog clock** gadget with glowing hands, **Everything launcher** (blue highlight list), **compositor effects**: zoom-in fades, the "bounce + glow" on focus, desktop "flip" transitions.
- Pre-default "**Black & White**" theme (old E17 default) — high-contrast grey/black/white with accent controlled via the "Focus Change" color class.
- Later E (0.25+): flatter dark, still the blue glow but thinner; window borders with subtle shadow, "**Dark**" default; Terminology terminal theme with blue glow cursor & scanline-like backgrounds.

**Bodhi Linux / Moksha** (E17 fork, Jeff Hoogland / Bodhi team): themes as `bodhi-theme-moksha-*` packages:
- **Arc Dark** (thewaiter, default since Bodhi 4.1): flat Arc palette `#383C4A #404552 #2F343F`, accent `#5294E2`, text `#D3DAE3`.
- **Radiance**: graphite with soft gloss, `#3C3C3C #5A5A5A`, warm amber accent `#F0A030`-ish.
- **Arc Green** (accent `#7CB342`-ish), **RedPassion** (dark + crimson `#C0172B`), **Crema** (cream/brown light), **Vice Versa**, **MokshaSeven** (Win7-ish), **Moksha-Green-Pro**, **Bodhi-Zen** green.
- Signature: E17 structure, but with each theme a single strong accent hue on dark graphite.

### 3.2 Fonts
- E17 default used **Sans** → in practice DejaVu Sans / Bitstream Vera Sans; titles bold. Modern Enlightenment uses system Sans (DejaVu/Noto).
  - **DejaVu Sans** (Bitstream Vera license + public domain changes; free) — self-host from https://dejavu-fonts.github.io/ or Fontsource `@fontsource/dejavu-sans`? (not on Google Fonts; use `https://cdn.jsdelivr.net/npm/dejavu-fonts-ttf@2.37.3/ttf/DejaVuSans.ttf` → convert to woff2).
  - Drop-in modern alternatives with Vera DNA: **Inter** (OFL, `family=Inter:wght@400..700`) or **Noto Sans** (OFL).
- E16 pixel feel: **Silkscreen** (OFL, `family=Silkscreen`) for tiny caps labels; **Pixelify Sans** (OFL); **Tiny5** (OFL). Terminus-like mono: **Share Tech Mono** (OFL) or **Fira Mono** (OFL); Terminus itself is OFL (http://terminus-font.sourceforge.net/).
- Edje-era "techy" headings: **Exo 2** (OFL), **Saira** (OFL), **Titillium Web** (OFL, `family=Titillium+Web:wght@400;600;700`) — Titillium is a good match for the E17 vibe.

### 3.3 Technique recipes

**Brushed metal (E16 Tigert)** — pure CSS:
```css
.ewt-brushed {
  background-color: #b4b8bc;
  background-image:
    repeating-linear-gradient(0deg, rgba(255,255,255,0) 0 1px, rgba(255,255,255,.08) 1px 2px),
    repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 3px, rgba(0,0,0,.05) 3px 4px),
    linear-gradient(180deg, #d9dcde 0%, #b4b8bc 48%, #9ea3a8 52%, #c6c9cc 100%);
  box-shadow: inset 0 1px #fff, inset 0 -1px #6a6f74, 0 0 0 1px #3b3f44;
}
/* more realistic: SVG feTurbulence with baseFrequency="0.001 0.9" (horizontal streaks) as a data-URI tile */
```

**ShinyMetal chrome bar:**
```css
.ewt-chrome { background: linear-gradient(180deg,#fdfdfd 0%,#e8ecf0 18%,#b9c1ca 50%,#9aa3ad 51%,#cfd5db 100%);
  border: 1px solid #4e5762; box-shadow: inset 0 1px 0 rgba(255,255,255,.9); color:#111;
  text-shadow: 0 1px 0 rgba(255,255,255,.7); }
```

**E16 bevelled window button:**
```css
.ewt-e16-btn { width: 14px; height: 14px; background: linear-gradient(#cfd3d6,#8e9398);
  border: 1px solid #2b2f33; box-shadow: inset 1px 1px #f1f3f4, inset -1px -1px #5a5f64; }
.ewt-e16-btn:active { background: linear-gradient(#8e9398,#cfd3d6); box-shadow: inset 1px 1px #5a5f64; }
```

**E17 glossy dark bar (Edje style) + blue glow focus:**
```css
:root { --e-bg:#202020; --e-bg2:#2d2d2d; --e-bg3:#3a3a3a; --e-line:#0e0e0e; --e-hi:rgba(255,255,255,.07);
        --e-text:#d8d8d8; --e-dim:#8a8a8a; --e-glow:#3399ff; --e-glow2:#66b8ff; }
.ewt-e17-bar {
  background: linear-gradient(180deg, #3d3d3d 0%, #2a2a2a 50%, #222 51%, #262626 100%);
  border: 1px solid var(--e-line); box-shadow: inset 0 1px var(--e-hi); color: var(--e-text);
}
.ewt-e17-glow, .mx_RoomTile_selected, :focus-visible {
  outline: none;
  box-shadow: 0 0 0 1px #0b3a66, 0 0 6px 1px rgba(51,153,255,.85), 0 0 18px 4px rgba(51,153,255,.35),
              inset 0 0 8px rgba(51,153,255,.35);
  color: #fff; text-shadow: 0 0 6px rgba(102,184,255,.9);
}
```

**E17 "pulse" (Ibar launch / new message):**
```css
@keyframes e-pulse { 0%{box-shadow:0 0 0 0 rgba(51,153,255,.8)} 100%{box-shadow:0 0 0 14px rgba(51,153,255,0)} }
.mx_NotificationBadge_highlighted { animation: e-pulse 1.4s ease-out 3; }   /* 3 iterations, not infinite */
```

**Shelf (bottom dock) look for the composer:**
```css
.mx_MessageComposer { background: linear-gradient(180deg, rgba(60,60,60,.92), rgba(20,20,20,.96));
  border-top: 1px solid #000; box-shadow: inset 0 1px rgba(255,255,255,.08), 0 -6px 18px rgba(0,0,0,.5);
  backdrop-filter: blur(8px); }
```

**Glossy "gel" orb (avatar/button):**
```css
.ewt-gel { border-radius: 50%; background: radial-gradient(circle at 50% 30%, rgba(255,255,255,.7) 0 18%, transparent 19%),
  radial-gradient(circle at 50% 120%, #66b8ff, #0a4d99 70%); box-shadow: 0 0 10px rgba(51,153,255,.6); }
```

**Analog clock gadget** (optional injected DOM in the space panel): conic-gradient face + rotated hands via CSS vars driven by a 1 Hz JS tick; hands with `filter: drop-shadow(0 0 3px #3399ff)`.

### 3.4 Three "really nice dark, colored" mashup directions

**A. "Edje Aurora"** — E17 structure, aurora glows.
- Base `#121418` / panels `#1A1D23` / raised `#232832` / line `#0A0B0E`; text `#DDE3EA`, secondary `#8B95A5`.
- Glow ramp: teal `#2EE6C5` → cyan `#33A1FF` → violet `#9B6BFF` → magenta `#FF5FC8`. Used as an animated (slow, 30 s) background gradient behind the glass shelf only; focus glow = cyan; mentions = magenta glow; selected room = teal→violet gradient left bar with outer glow.
- Fonts: Titillium Web (UI), Inter (body), JetBrains Mono (code, OFL).
- Signature: glossy 50/50 split gradients on header & composer at 4% white, 1px inner highlight; Ibar-style hover magnification on avatar stack in space panel (`transform: scale(1.25)` + neighbours 1.1 via `:has()`).

**B. "Moksha Ember"** — Radiance/RedPassion graphite with warm metal.
- Base `#16120F`, panels `#211B17`, raised `#2E2520`, brushed overlay at 3% opacity; text `#EEE4D8`, secondary `#A8978A`.
- Accents: ember `#FF7A1A`, amber `#FFB547`, crimson `#E0344A`, glow `rgba(255,122,26,.55)`.
- E16 brushed-metal texture (tinted copper `#7A4B2E → #3B2416`) on room header and dialog title bars; E17 gloss everywhere else.
- Fonts: Saira / Saira Semi Condensed (OFL) headings, Noto Sans body.
- Signature: copper bevel buttons, amber pulse on unread, crimson glow for highlights.

**C. "Ganymede Neon Steel"** — E16 BlueSteel/Ganymede meets modern E dark + Terminology.
- Base `#0B1016`, panels `#111A24`, steel raised `#1C2A38` with BlueSteel brushed texture (blue-tinted), line `#05080C`; text `#CFE3F5`, secondary `#7894AE`.
- Accents: E-blue `#3399FF`, acid lime `#B6FF3B` (online/presence), coral `#FF6B5A` (errors/mentions).
- Fonts: Exo 2 headings, IBM Plex Sans body (OFL), Share Tech Mono timestamps.
- Signature: Terminology-style faint scanlines in code blocks, chrome bevelled tiny "window buttons" decorating dialogs (non-functional `::before` trio), steel pager-like space panel with mini previews (room avatars in a 2×2 grid look).

### 3.5 Chat mapping (all E variants)
- **Space panel** → E17 **pager/Ibar**: vertical glossy shelf, icons magnify on hover, active space with blue glow ring and a small glowing dot.
- **Room list** → Everything-launcher list: dark rows, 1px separators (`#0e0e0e` + `rgba(255,255,255,.04)`), selected = blue glow bar + text glow.
- **Header** → window title bar (E16 metal or E17 gloss), decorative min/max/close trio on the right of the header (purely visual, `aria-hidden`).
- **Timeline** → dark panel; unread line = glowing blue hairline.
- **Bubbles** → glossy dark capsules with 1px highlight; own messages tinted accent (8–12% alpha).
- **Composer** → the shelf.
- **Dialogs** → E window with border theme + compositor "zoom" open animation (`@keyframes` scale .92→1 + opacity, 150 ms).
- **Menus/tooltips** → E17 menu: dark glass, blue highlight row with glow.

### 3.6 Accessibility risks
Glow-only focus/selection can fail non-text contrast (WCAG 1.4.11): always pair glow with a solid 2px border/outline of ≥3:1. Text glow (`text-shadow`) blurs small text — restrict to ≥14px bold. Brushed metal backgrounds under text: keep texture ≤6% opacity. Gloss gradients in light E16 themes can produce mid-grey zones where black text drops below 4.5:1 — test at the gradient's darkest stop. Pixel fonts below 11px: only decorative labels.

### 3.7 References
- Enlightenment themes page — https://www.enlightenment.org/themes/start
- E16 themes repo (BlueSteel, BrushedMetal-Tigert, Ganymede, ShinyMetal) — https://git.enlightenment.org/e16/e16-themes
- E16 page — https://www.enlightenment.org/e16
- Fedora e16-themes package — https://packages.fedoraproject.org/pkgs/e16-themes/e16-themes
- E17gtk-revolved (GTK theme matching E default: dark grey + blue, skeuomorphic) — https://git.disroot.org/eudaimon/E17gtk-revolved — good palette reference
- rElighted / E17-default recolours (KDE Store/opendesktop) — https://store.kde.org/p/1123864
- Bodhi Moksha themes — https://www.bodhilinux.com/softwaregroup/themes/ ; Arc Dark — https://www.bodhilinux.com/a/arc-dark-theme/ ; Radiance — https://www.bodhilinux.com/a/radiance-theme/ ; RedPassion — https://www.bodhilinux.com/a/redpassion/
- Terminology THEMES.md — https://git.enlightenment.org/enlightenment/terminology/src/branch/master/THEMES.md
- "e17: Create Your Own Custom Themes" (PCLinuxOS mag, color classes) — https://pclosmag.com/html/Issues/201104/page07.html
- Action item: grab real screenshots/EDC color classes from `enlightenment/data/themes/default.edc` (git.enlightenment.org) to sample exact hex values; values above are visually estimated.

---

## 4. Low-UI / Paper (white paper & black paper)

### 4.1 Concept
UI recedes until only text remains. Influences: **iA Writer** (focus mode, one typeface, blue cursor),
**reMarkable / e-ink** (no colour, no shadows, no motion, thick 1px rules, dithering instead of gradients),
**Swiss typography** (grid, flush-left, ragged right, strong type hierarchy by size/weight only), **Dieter Rams**
("as little design as possible"), **Calm Technology** (Weiser & Brown; Amber Case: "technology should require
the smallest possible amount of attention"), **brutalist-minimal sites** (motherfuckingwebsite, bettermotherfuckingwebsite, Gwern, Butterick's Practical Typography).

### 4.2 Fonts

| Font | Notes | URL | License |
|---|---|---|---|
| **iA Writer Quattro / Duo / Mono** (iA, 2018; modified IBM Plex Mono) | the iA look; Quattro is proportional-ish 4-width; variable versions exist | https://github.com/iaolo/iA-Fonts · Fontsource `@fontsource/ia-writer-quattro`, `@fontsource/ia-writer-duo`, `@fontsource/ia-writer-mono` | OFL 1.1 (iA asks: credit iA Writer; don't use to clone iA's products) |
| **IBM Plex Sans / Serif / Mono** | neutral, technical, great hinting | `family=IBM+Plex+Sans:ital,wght@0,300..700;1,400` etc. · https://github.com/IBM/plex | OFL |
| **Literata** (TypeTogether for Google Play Books) | e-reader serif, made for screens | `family=Literata:ital,opsz,wght@0,7..72,300..800;1,7..72,400` | OFL |
| **Newsreader** (Production Type) | optical-size text serif, refined | `family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,400` | OFL |
| **Source Serif 4** | Adobe, opsz | `family=Source+Serif+4:opsz,wght@8..60,300..700` | OFL |
| **Inter** / **Inter Tight** | Swiss neo-grotesk alt (Element already uses Inter) | `family=Inter:opsz,wght@14..32,300..700` | OFL |
| **Atkinson Hyperlegible Next** | accessibility-first, very calm | `family=Atkinson+Hyperlegible+Next:wght@200..800` | OFL |
| **Space Grotesk** / **Geist** | brutal-minimal headings | Google Fonts / https://vercel.com/font | OFL |
| **Libre Franklin**, **Public Sans** | Swiss-ish, US gov neutral | Google Fonts | OFL |

Suggested pairings: (1) **iA Duo** everything (pure iA); (2) **Literata** body + **IBM Plex Mono** meta (e-reader); (3) **Newsreader** body + **Inter** UI (editorial); (4) **Atkinson Hyperlegible Next** single family (accessible calm).

### 4.3 Palettes

**White paper**
- Paper `#FBFBF8` (warm) or `#FFFFFF`; ink `#1A1A1A`; secondary `#6B6B6B` (5.3:1 on paper — the floor for metadata); hairline `#E6E4DF`; hover wash `#F2F1EC`; accent (single!) iA blue cursor `#1AA3FF` → use `#0B6BCB` for text links (≥4.5:1); mention marker `#FFF3B0`.
- e-ink variant: `#F2F1ED` paper, ink `#111`, only greys `#DADAD5 #9A9A95` (16-level grey feel), no accent at all.

**Black paper**
- Paper `#0E0E0E` (or `#111214` slightly cool; avoid pure `#000` for halation); ink `#E8E6E1` (not pure white); secondary `#9A9893` (6.6:1); hairline `#242424`; hover `#181818`; accent `#6CB6FF`; mention `#3A3320` bg.
- "Ink on carbon" variant: `#141311` / ink `#D9D4C7` (warm off-white, sepia-ish), accent `#E0B36A`.

### 4.4 Technique recipes

**Token remap (the whole theme is mostly this):**
```css
:root {
  --cpd-color-bg-canvas-default: #fbfbf8;
  --cpd-color-bg-subtle-secondary: #fbfbf8;  /* kill panel tinting: same as canvas */
  --cpd-color-bg-subtle-primary: #f2f1ec;
  --cpd-color-text-primary: #1a1a1a;
  --cpd-color-text-secondary: #6b6b6b;
  --cpd-color-border-interactive-secondary: #e6e4df;
  --cpd-color-text-action-accent: #0b6bcb;
  --cpd-font-family-sans: "iA Writer Quattro V", "iA Writer Quattro S", "IBM Plex Sans", system-ui, sans-serif;
  --cpd-font-family-mono: "iA Writer Mono V", "IBM Plex Mono", ui-monospace, monospace;
}
```

**Remove chrome:**
```css
.mx_LeftPanel, .mx_SpacePanel, .mx_RoomHeader, .mx_MessageComposer { background: transparent !important;
  box-shadow: none !important; border-color: transparent !important; }
.mx_BaseAvatar { filter: grayscale(1); opacity: .85; }                /* or hide: display:none in level 4 */
.mx_EventTile:not(.mx_EventTile_continuation) { margin-top: 1.25em; }  /* whitespace instead of lines */
.mx_EventTile_line { max-width: 68ch; font-size: 17px; line-height: 1.6; }
.mx_RoomList_iconExplore, .mx_LeftPanel_exploreButton { opacity: .0; }
.mx_LeftPanel:hover .mx_LeftPanel_exploreButton,
.mx_LeftPanel:focus-within .mx_LeftPanel_exploreButton { opacity: 1; }  /* reveal on intent */
```

**iA-style focus mode** (dim everything except the composer & latest messages):
```css
.mx_RoomView_MessageList .mx_EventTile { opacity: .35; transition: opacity .2s; }
.mx_RoomView_MessageList .mx_EventTile:nth-last-child(-n+4),
.mx_RoomView_MessageList .mx_EventTile:hover,
.mx_RoomView_MessageList .mx_EventTile:focus-within { opacity: 1; }
.mx_BasicMessageComposer_input { caret-color: #1aa3ff; caret-shape: block; }  /* caret-shape: Chromium 2025+ */
```

**Hover-reveal UI (calm tech: periphery until needed):**
```css
.mx_MessageActionBar, .mx_EventTile .mx_MessageTimestamp { opacity: 0; transition: opacity .15s; }
.mx_EventTile:hover .mx_MessageActionBar, .mx_EventTile:focus-within .mx_MessageActionBar,
.mx_EventTile:hover .mx_MessageTimestamp, .mx_EventTile:focus-within .mx_MessageTimestamp { opacity: 1; }
@media (hover: none) { .mx_MessageActionBar, .mx_MessageTimestamp { opacity: 1; } } /* touch: always */
```

**E-ink mode**: `* { transition: none !important; animation: none !important; box-shadow: none !important; border-radius: 0 !important; }`, 1px solid `#111` rules only, dithered greys via `background: repeating-conic-gradient(#111 0 25%, transparent 0 50%) 0 0/2px 2px` (50% dither) for selected state. Images `filter: grayscale(1) contrast(1.1)`.

**Swiss grid**: left panel as a narrow column of room names only (no avatars), set in 13px uppercase tracking .06em for section labels; room name in header 28px/700 flush-left; numeric unread counts in tabular figures (`font-variant-numeric: tabular-nums`) instead of pills.

**Unread indicator without colour**: bold weight + `•` glyph; mentions: `@` glyph + underline. (Don't rely on colour alone, WCAG 1.4.1.)

### 4.5 Gradient: "subtle but usable" → "almost invisible"

| Level | Name | Behaviour |
|---|---|---|
| 1 | **Calm** | Paper palette, one font family, no panel tints, avatars grayscale, all controls visible, accent blue for links/focus. Contrast ≥ 7:1 body, ≥ 4.5:1 meta. |
| 2 | **Writer** | Avatars hidden in timeline (names only, small caps), timestamps & action bar on hover/focus, hairlines removed (spacing only), composer borderless with just a caret. |
| 3 | **Focus** | iA focus dimming of older messages, left panel collapsed to text column that fades to 40% until hover/focus, header reduced to room name only. |
| 4 | **Page** | Left & space panel hidden off-canvas (reveal on `Ctrl+K` / hover left edge strip 8px), only a single 68ch column; no icons, actions accessible via keyboard & context menu. |
| 5 | **Almost invisible** | Everything at 4 + metadata at the contrast floor (`#767676` on white = 4.54:1 — never lower), no separators, unread state only by weight, composer has no visible boundary until focused. Aesthetically a blank sheet with text. |

Rules that apply at **every** level (contrast floors):
- Body text ≥ 7:1 (AAA) target, never < 4.5:1; meta/secondary never < 4.5:1 (`#767676` on `#FFF`, `#949494` on `#111`); non-text UI boundaries (inputs, focus ring, toggles) ≥ 3:1 *when shown*.
- Focus is **never** hidden: `:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }` — on paper themes use ink colour; it's minimal yet always visible.
- Hover-only reveals must also reveal on `:focus-within` and be always-visible on `(hover: none)`.
- Respect `prefers-contrast: more` → drop to level 1 automatically:
  ```css
  @media (prefers-contrast: more) { :root { --cpd-color-text-secondary: #3d3d3d; }
    .mx_MessageActionBar, .mx_MessageTimestamp { opacity: 1 !important; } }
  ```
- Hit targets stay ≥ 24×24 px (WCAG 2.5.8) even when icons are invisible.

### 4.6 Chat mapping
- **Room list**: plain text list, 15px, no icons; selected = ink weight 600 + 2px left rule; unread = `•` glyph; sections as small caps labels.
- **Header**: room name only, large; topic hidden behind `title`/hover.
- **Timeline**: book-like column, sender name in small caps above a group, continuation messages just paragraphs; day separators as centered small caps date with generous space, no line.
- **Bubbles**: disabled — force IRC/modern layout; if bubble layout is on, render as indented paragraphs (own messages flush-right in italic? optional).
- **Composer**: borderless, blinking iA-blue caret, placeholder at 4.5:1 grey; send button hidden (Enter) but present & focusable.
- **Dialogs**: white sheet, 1px ink border, no shadow, no rounded corners (e-ink) or 2px radius (calm).

### 4.7 References
- iA Writer Fonts — https://ia.net/topics/a-typographic-christmas · https://github.com/iaolo/iA-Fonts
- iA "Web Design is 95% Typography" — https://ia.net/topics/the-web-is-all-about-typography-period
- reMarkable design/UX (paper tablet) — https://remarkable.com/ ; e-ink UI notes — https://www.eink.com/
- Calm Technology (Amber Case principles) — https://calmtech.com/
- Dieter Rams, ten principles — https://www.vitsoe.com/us/about/good-design
- Butterick's Practical Typography — https://practicaltypography.com/
- bettermotherfuckingwebsite — http://bettermotherfuckingwebsite.com/ ; Brutalist Websites — https://brutalistwebsites.com/
- Literata — https://github.com/googlefonts/literata ; Newsreader — https://github.com/productiontype/Newsreader ; IBM Plex — https://github.com/IBM/plex
- WCAG 2.2 contrast (1.4.3, 1.4.11), focus (2.4.7, 2.4.11/13), target size (2.5.8) — https://www.w3.org/TR/WCAG22/

---

## 5. Cross-cutting overlays: Cyberpunk & Comic Book

These are "variant directions" composable onto any base (e.g. *Sketch × Comic*, *Enlightenment × Cyberpunk*,
*Paper × Cyberpunk (mono-green terminal on black paper)*). Implement each as a separate CSS layer
(`@layer base, overlay;`) so they stack.

### 5.1 Cyberpunk / neon

**Fonts**
| Font | Use | URL | License |
|---|---|---|---|
| **Orbitron** (400–900) | headers, room names | `family=Orbitron:wght@400..900` | OFL |
| **Rajdhani** (300–700) | UI body (condensed, CP2077-like) | `family=Rajdhani:wght@400;500;600;700` | OFL |
| **Share Tech Mono** | timestamps, code, HUD labels | `family=Share+Tech+Mono` | OFL |
| **Chakra Petch** | alt body, Thai-designed techno | `family=Chakra+Petch:wght@400;600` | OFL |
| **Oxanium**, **Audiowide**, **Michroma** | alt display | Google Fonts | OFL |
| **Blender Pro** (real CP2077 UI font) | — | commercial (Fontsmith/Monotype) — don't ship | proprietary |
| **VT323**, **Major Mono Display** | terminal | Google Fonts | OFL |

**Palettes**
- **CP2077**: bg `#0A0A0F`, panel `#12131A`, yellow `#FCEE0A`, cyan `#00F0FF`, red `#FF003C`, magenta `#FF2A6D`, text `#E0E0E0`, dim `#5A6270`.
- **Synthwave neon**: `#0D0221` bg, `#261447`, pink `#FF3864`, magenta `#F222FF`, cyan `#2DE2E6`, sun `#FF6C11`, purple `#8C1EFF`.
- **Netrunner green**: `#020A04` bg, `#00FF9C` phosphor, `#0BFF6A`, dim `#0F5132`, amber alert `#FFB000`.

**Recipes**
```css
/* chamfered corners via clip-path (signature CP2077 shape) */
.ewt-chamfer { --c: 12px; clip-path: polygon(var(--c) 0, 100% 0, 100% calc(100% - var(--c)),
  calc(100% - var(--c)) 100%, 0 100%, 0 var(--c)); }
/* border that survives clip-path: draw it with a second layer */
.ewt-chamfer-border { --c:12px; background: #00f0ff; padding: 1px; clip-path: inherit; }
.ewt-chamfer-border > * { background: #12131a; clip-path: polygon(var(--c) 0,100% 0,100% calc(100% - var(--c)),
  calc(100% - var(--c)) 100%,0 100%,0 var(--c)); }

/* neon text & box glow */
.ewt-neon { color: #fff; text-shadow: 0 0 2px #fff, 0 0 6px #00f0ff, 0 0 14px #00f0ff, 0 0 28px #0077ff; }
.ewt-neon-box { border: 1px solid #00f0ff; box-shadow: 0 0 6px #00f0ff, inset 0 0 6px rgba(0,240,255,.4); }

/* scanlines overlay (whole app, pointer-events none) */
.mx_MatrixChat::before { content:""; position:fixed; inset:0; pointer-events:none; z-index:9998;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 1px, transparent 1px 3px); mix-blend-mode: multiply; }
/* CRT vignette + subtle flicker */
.mx_MatrixChat::after { content:""; position:fixed; inset:0; pointer-events:none; z-index:9997;
  background: radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,.55) 100%); }

/* glitch text (data-text duplicated by attr) — use on room name only */
.ewt-glitch { position: relative; }
.ewt-glitch::before, .ewt-glitch::after { content: attr(data-text); position:absolute; inset:0; overflow:hidden; }
.ewt-glitch::before { left: 2px; text-shadow: -2px 0 #ff003c; animation: glitch-a 2.5s infinite steps(2) alternate; }
.ewt-glitch::after  { left:-2px; text-shadow: -2px 0 #00f0ff; animation: glitch-b 3s infinite steps(2) alternate; }
@keyframes glitch-a { 0%{clip-path:inset(10% 0 80% 0)} 25%{clip-path:inset(40% 0 40% 0)}
  50%{clip-path:inset(70% 0 10% 0)} 75%{clip-path:inset(20% 0 60% 0)} 100%{clip-path:inset(85% 0 5% 0)} }
@keyframes glitch-b { 0%{clip-path:inset(60% 0 20% 0)} 50%{clip-path:inset(5% 0 85% 0)} 100%{clip-path:inset(30% 0 50% 0)} }

/* CP2077 yellow "hazard" header strip + angled tab */
.mx_RoomHeader { background: #fcee0a; color: #0a0a0f; font-family: Orbitron, sans-serif; text-transform: uppercase;
  letter-spacing: .08em; clip-path: polygon(0 0, 100% 0, 100% 70%, calc(100% - 18px) 100%, 0 100%); }
.ewt-hazard { background: repeating-linear-gradient(-45deg, #fcee0a 0 10px, #0a0a0f 10px 20px); height: 4px; }

/* HUD corner brackets on dialogs (no clip needed) */
.mx_Dialog { background:
  linear-gradient(#00f0ff,#00f0ff) top left/14px 2px, linear-gradient(#00f0ff,#00f0ff) top left/2px 14px,
  linear-gradient(#00f0ff,#00f0ff) bottom right/14px 2px, linear-gradient(#00f0ff,#00f0ff) bottom right/2px 14px,
  #12131a; background-repeat: no-repeat; }
```
Signature moves: chamfers, yellow-on-black, glitch on hover, scanlines, monospace metadata `[12:04:33]`, uppercase
tracking, thin cyan hairlines with corner ticks, "data rain"/hex noise in empty states, typing-cursor `▌` blink in composer.

Libraries: **Augmented UI** (MIT, cyberpunk clip-path borders via data attributes —
`https://unpkg.com/augmented-ui@2.0.0/augmented-ui.min.css`, https://augmented-ui.com/) — perfect fit: add
`data-augmented-ui="tl-clip br-clip border"` via injected attributes or replicate with its CSS custom properties;
**cyberpunk-css** (alddesign, MIT, https://github.com/alddesign/cyberpunk-css); **arwes** (sci-fi UI framework,
MIT, React, https://arwes.dev — reference for HUD frames, not drop-in); **cybercore-css** (https://github.com/sebyx07/cybercore-css, check license); Kevin Powell / Jhey Tompkins glitch CodePens.

References: https://augmented-ui.com/ · https://arwes.dev/ · https://css-tricks.com/glitch-effect-text-images-svg/ ·
https://codepen.io/jh3y (CP2077 buttons by Jhey: "Cyberpunk 2077 Buttons") · https://github.com/alddesign/cyberpunk-css ·
https://www.cyberpunk.net (official art direction reference) · https://tympanus.net/codrops/2017/12/21/css-glitch-effect/

### 5.2 Comic book

**Fonts**
| Font | Use | URL | License |
|---|---|---|---|
| **Bangers** | POW titles, room names | `family=Bangers` | OFL |
| **Comic Neue** | body (lettering-ish) | see §1 | OFL |
| **Bubblegum Sans**, **Chewy** | rounded speech | Google Fonts | OFL |
| **Luckiest Guy** | headings | Google Fonts | Apache 2.0 |
| **Kalam** / **Patrick Hand** | hand-lettered body | Google Fonts | OFL |
| **Komika** / **Anime Ace** (Blambot) | real lettering | Blambot free-for-indie licences, not OFL — check | restricted |
| **Bungee Shade**, **Rubik Mono One** | sound effects | Google Fonts | OFL |

**Palettes**
- **Golden-age CMYK**: paper `#FFF8E1` (aged `#F4E9C9`), ink `#111111`, red `#E2231A`, blue `#0072BC`, yellow `#FFD200`, process cyan `#00AEEF`, magenta `#EC008C`, skin halftone `#F7C6A3`.
- **Pop-art (Lichtenstein)**: `#FFFFFF`, `#000`, `#E70012`, `#0055A4`, `#FFE600`, Ben-Day pink `#F39AC6`.
- **Noir comic (dark)**: `#0F0F10`, ink panels `#1A1A1C`, paper-white `#F2EEE3`, blood `#C1121F`, yellow SFX `#FFC300`.

**Recipes**
```css
/* halftone dots (Ben-Day) */
.ewt-halftone { background-color: #ffd200;
  background-image: radial-gradient(#e2231a 22%, transparent 23%); background-size: 10px 10px; }
/* gradient halftone fading (dots shrink across the panel) */
.ewt-halftone-fade { background: radial-gradient(circle, #111 0 30%, transparent 31%) 0 0/8px 8px;
  -webkit-mask: linear-gradient(135deg, #000, transparent 75%); mask: linear-gradient(135deg, #000, transparent 75%); }
/* "real" halftone filter for avatars (contrast threshold trick) */
.ewt-halftone-img { position: relative; filter: grayscale(1) contrast(1.3); }
.ewt-halftone-img::after { content:""; position:absolute; inset:0; mix-blend-mode: screen;
  background: radial-gradient(circle, transparent 35%, #fff 36%) 0 0/5px 5px; }

/* thick ink panel + offset shadow */
.ewt-panel { background:#fff; border: 3px solid #111; box-shadow: 6px 6px 0 #111; border-radius: 2px; }

/* speech bubble with tail (timeline bubbles) */
.ewt-bubble { position: relative; background:#fff; border:3px solid #111; border-radius: 22px / 18px;
  padding: .6em 1em; font-family: "Comic Neue", cursive; }
.ewt-bubble::after { content:""; position:absolute; left: 22px; bottom: -18px; width: 22px; height: 18px;
  background: #fff; border-left: 3px solid #111; border-bottom: 3px solid #111;   /* tail */
  clip-path: polygon(0 0, 100% 0, 0 100%); transform: skewX(-20deg); }
/* thought bubble: little circles instead of tail */
.ewt-thought::after { content:""; position:absolute; left:18px; bottom:-22px; width:14px; height:14px; border-radius:50%;
  background:#fff; border:3px solid #111; box-shadow: -12px 12px 0 -4px #fff, -12px 12px 0 -1px #111; }

/* POW starburst (mentions / reactions / notifications) */
.ewt-pow { font: 2em Bangers, Impact, sans-serif; color: #ffd200; -webkit-text-stroke: 2px #111;
  text-shadow: 3px 3px 0 #e2231a; padding: .6em 1em; background: #e2231a;
  clip-path: polygon(50% 0%,61% 18%,80% 6%,78% 28%,100% 26%,86% 44%,100% 60%,79% 64%,86% 86%,64% 77%,
    55% 100%,44% 80%,24% 94%,26% 70%,2% 72%,15% 52%,0% 34%,22% 32%,14% 10%,38% 20%);
  transform: rotate(-8deg); }
@keyframes ewt-pop { 0%{transform:scale(0) rotate(-30deg)} 70%{transform:scale(1.2) rotate(-6deg)} 100%{transform:scale(1) rotate(-8deg)} }

/* action lines (speed lines) behind header */
.ewt-speedlines { background: repeating-conic-gradient(from 0deg at 50% 120%, #111 0 1deg, transparent 1deg 6deg); opacity:.12; }

/* caption box (narration) for date separators */
.mx_DateSeparator h2 { background:#ffd200; border:3px solid #111; box-shadow:3px 3px 0 #111;
  font: 1rem Bangers, sans-serif; letter-spacing:.06em; text-transform: uppercase; padding: 2px 10px; }
```
Signature moves: 3px black ink outlines everywhere, flat offset shadows (no blur), halftone in panels/avatars,
gutters (white space between "panels" = messages groups), POW bursts for mentions/reactions, caption boxes for
dates/system events, slanted panels (`clip-path` trapezoids) in the room list, "Meanwhile…" for room switches.

Libraries/refs: **comic.css**-style CodePens; **Halftone in CSS** (Ana Tudor's halftone/CSS-Tricks article
"Halftone Effect with CSS" https://css-tricks.com/making-static-noise-from-a-weird-css-gradient-bug/ and
https://codepen.io/thebabydino), **Comic Book CSS** by Mattias Ottosson? (search CodePen "comic book layout css grid" — e.g. https://codepen.io/hnatiukbohdan/pen/LYZPYEb style), Smashing Magazine "Creating a comic layout with CSS grid" (https://css-tricks.com/how-to-make-a-comic-book-layout-with-css-grid/ — verify), Bangers — https://fonts.google.com/specimen/Bangers, Blambot lettering guide (reference for balloon conventions) https://blambot.com/pages/comic-book-grammar-tradition.

### 5.3 Overlay accessibility risks
- **Cyberpunk**: glitch & flicker → reduced-motion & WCAG 2.3.1; neon glow lowers glyph sharpness — keep body text unglowed; yellow `#FCEE0A` backgrounds need dark text (≈17:1 with `#0A0A0F`, fine) but cyan-on-magenta combos fail; scanline overlay reduces effective contrast ~10% — budget for it; `clip-path` chamfers clip focus outlines → put focus ring on an inner element or use `filter: drop-shadow()` which respects clip on parent wrapper.
- **Comic**: halftone behind text is a legibility killer — only behind panels/avatars, solid white inside balloons; Bangers is all-caps display — never body; POW bursts must not obscure content and need `aria-hidden` (decorative) with the real info (mention) still in text.

### 5.4 Overlay mapping (chat)

| Surface | Cyberpunk | Comic |
|---|---|---|
| Space panel | vertical HUD strip, chamfered icons, cyan ticks | stacked mini-panels with ink borders |
| Room list | chamfered rows, yellow selected tab w/ black text, unread = `[03]` mono | slanted panels, unread = small POW burst |
| Header | yellow hazard bar or glitch room name, mono topic `> topic_` | splash title in Bangers with speed lines |
| Timeline | mono timestamps `[hh:mm:ss]`, cyan sender, red mentions with glow | gutters between groups, caption boxes for days/system events |
| Bubbles | chamfered dark cards w/ 1px neon border | speech balloons; own = right tail; emotes `/me` = thought bubble; shouting (ALLCAPS/!) = jagged burst balloon |
| Composer | terminal prompt `>` with blinking block caret | blank balloon "type your line…" |
| Dialogs | HUD frame w/ corner brackets, augmented-ui | big panel with thick ink + offset shadow, title caption box |
| Reactions | small chamfered pills | mini POW stickers |

---

## 6. Combination matrix & implementation notes

| Base ↓ / Overlay → | none | Cyberpunk | Comic |
|---|---|---|---|
| Comic Sans / WordArt | Office97 → GeoCities | "Y2K hacker homepage" (green-on-black Matrix rain + WordArt) | natural fit — Sunday funnies party |
| Sketch | Balsamiq → scribble | "Napkin schematic of a cyberdeck" (blueprint + neon) | hand-inked comic (pencil + halftone) |
| Enlightenment | E16 metal / E17 glow / mashups A–C | E-glow → neon (Aurora + chamfers) | E16 metal "robot comic" |
| Paper | white/black paper L1–5 | black paper + phosphor mono (netrunner calm) | white paper + ink-line minimal comic (Hergé ligne claire) |

Implementation notes:
1. Deliver each theme as `theme.css` (token remap + selectors) + `fonts/` (woff2, subset latin+latin-ext, license
   files copied next to them) + optional `filters.svg` (injected) + optional `inject.js` (DOM sugar: split letters,
   counters, `data-text` for glitch, `data-ewt-level`).
2. Element's `custom_themes` config (`setting_defaults.custom_themes[]`) only accepts colours + fonts; the full
   artistic looks require CSS injection (loader / browser extension / Electron `--custom-css` / webcrack build).
3. Use `@layer ewt.tokens, ewt.base, ewt.overlay, ewt.a11y;` and put the a11y guards last so they always win.
4. Self-host all fonts (Matrix users are privacy-sensitive; Google Fonts CDN leaks IPs, and German courts (LG München 2022) ruled remote Google Fonts a GDPR violation).
5. Per-sender variety (WordArt style, marker colour, comic balloon variant) can use Element's existing
   `.mx_Username_color1…8` / `--cpd-color-*` username classes — no JS hashing needed.

### Sources consulted (web, 2026-11)
- [Excalifont](https://plus.excalidraw.com/excalifont), [Virgil repo](https://github.com/excalidraw/virgil), [OFL FAQ](https://openfontlicense.org/ofl-faq/)
- [Comic Relief GitHub](https://github.com/loudifier/Comic-Relief), [Font Squirrel license](https://www.fontsquirrel.com/license/comic-relief), [Fontsource Comic Relief](https://fontsource.org/fonts/comic-relief/about)
- [Monotype webfont license](https://foundrysupport.monotype.com/hc/en-us/articles/10839926029588-Webfont-License), [Monotype licensing guide](https://www.monotypefonts.com/a/content/resources/font-licensing-guide)
- [iA-Fonts](https://github.com/iaolo/iA-Fonts), [iA "A typographic christmas"](https://ia.net/topics/a-typographic-christmas), [Fontsource iA Writer Quattro](https://fontsource.org/fonts/ia-writer-quattro/about)
- [DoodleCSS](https://github.com/chr15m/doodlecss)
- [css-wordart](https://github.com/yershalom/css-wordart), [designpieces WordArt CSS3](https://www.designpieces.com/2017/03/wordart-css3-text-effects/)
- [Enlightenment themes](https://enlightenment.org/themes/start), [E17gtk-revolved](https://git.disroot.org/eudaimon/E17gtk-revolved), [E16 themes repo](https://git.enlightenment.org/e16/e16-themes/src/branch/master/BlueSteel/data), [Fedora e16-themes](https://packages.fedoraproject.org/pkgs/e16-themes/e16-themes), [BrushedMetal history (gnome-list 1999)](https://lists.gnome.org/archives/gnome-list/1999-June/msg00513.html)
- [Bodhi Moksha themes](https://www.bodhilinux.com/softwaregroup/themes/), [Arc Dark](https://www.bodhilinux.com/a/arc-dark-theme/), [Radiance](https://www.bodhilinux.com/a/radiance-theme/)

Caveats: E16/E17 hex values are visual estimates (sample from `default.edc` / theme pixmaps before final);
library versions in CDN URLs are the last known stable at writing time — pin and verify; a few CodePen/article
URLs in §2.8 and §5.2 are pointers to search terms / author pages rather than verified exact pens.
