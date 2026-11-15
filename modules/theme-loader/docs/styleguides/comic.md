# Style guide: `comic`, the Comic Sans Party

> Family of 6 variants · data: [`comic.json`](comic.json) · manifest: `themes/comic/themes.json` ·
> assets and licences: `themes/comic/README.md` · dossier: `research/04-styles-artistic.md` §1

## 1. Concept

This family is the universe of **Office 97, GeoCities 1998 and the photocopied school-fete poster**: Comic Sans MS,
WordArt, tiled clouds/marble/star backgrounds, grey Win95 bevels, `<marquee>`, `<blink>`, rainbow `<hr>`s,
under-construction workers, hit counters, 88×31 buttons and "Sign my guestbook!". It is a joke family, but a
graded one. Each level adds one more layer of period crime:

| Level | Variant | One-line idea | Readable? |
|---|---|---|---|
| 1 | **casual-friday** | Element + Comic Sans. Nothing else is loud. | yes, AA |
| 2 | **geocities** | your 1998 homepage, with a guestbook | yes, AA |
| 3 | **wordart** | Office 97 desktop, Word page, WordArt, paperclip | yes, AA |
| 4 | **poster** | evil party poster: clash, shadows, blink, stickers | body text AA, chrome loud |
| 5 | **unreadable** | everything at once, moving, rainbow on rainbow | **no, by design** |
| ✱ | **after-midnight** | the same party in the blacklight room (dark) | yes, AA |

The user asked for "really evil" at the top levels. Levels 4 and 5 are therefore allowed to be hostile in look,
but never in function: you can always type, send, find the settings and leave. Level 5 shows a warning first and
keeps a PANIC button.

## 2. The stage axis

- **Pure → usable → exciting.** The family has no "pure" variant, because nobody ever shipped Comic Sans as a chat
  client. Level 1 is the usable point: the joke is the typeface and nothing else. Levels 2 to 5 climb the
  excitement and hype axis while seriousness falls from 5 to 0. after-midnight sits off-axis at "exciting/dark".
- **Past.** The whole family lives in 1994–1999 (Comic Sans 1994, WordArt 2.0 in Office 95/97, GeoCities
  neighbourhoods until 1999, `<blink>` in Netscape). No "future" variant.
- **Seriousness / hype.** casual-friday 5/4 · geocities 3/7 · wordart 2/8 · poster 1/9 · unreadable 0/10 ·
  after-midnight 2/9.

## 3. Typography

| Role | Stack (first match wins) | Bundled? |
|---|---|---|
| UI / body | `"Comic Sans MS", "Comic Relief", "Comic Neue", "Chalkboard SE", cursive` | Comic Relief 400/700 (OFL, metric-compatible) |
| Code | `"Comic Mono", "Comic Sans MS", monospace` | Comic Mono 400/700 (MIT) |
| WordArt poster | `Impact, "Anton", "Arial Black", sans-serif` | Anton (OFL) |
| WordArt gold serif, GeoCities timestamps | `"Times New Roman", "Tinos", serif` | Tinos 400 / 400i / 700i |
| Party display | `"Luckiest Guy"`, `"Chewy"` | Apache 2.0 |
| Hit counter / LED | `"VT323", monospace` | OFL |

- Comic Sans MS is proprietary (Monotype). It is only used when installed locally (Windows, macOS) and never
  shipped. Comic Relief has the same advance widths, so layout and screenshots line up across platforms.
- Fonts are set with `--cpd-font-family-sans: … !important` (FontWatcher writes it inline) on `html`, `body` and
  `[class*="cpd-theme-"]`. Code also needs a selector override (`pre, code, .mx_EventTile_pre_container`).
- Scale: Element's sizes everywhere. Comic Sans runs a little wide, so level 1–3 keep `--cpd-font-size-root`. Level 4
  raises headings (room name 1.6–2.2em). Level 5 adds `letter-spacing` jitter on headings only.
- Comic Sans is fine for dyslexic readers. Everything that hurts readability comes from colour and motion.

### WordArt kit (shared.css, `--ewt-wordart-N`)

The six styles are recreated from the classic 30-style gallery. They are keyed to `.mx_Username_color1..6`, so every
sender gets a stable style. The room name uses `data-ewt-wordart` from the enhancer, with style 1 when no enhancer
runs.

| # | Name | Recipe |
|---|---|---|
| 1 | rainbow | `linear-gradient(90deg,#F00,#FF7F00,#FF0,#0F0,#00F,#4B0082,#8B00FF)` clipped to text, `-webkit-text-stroke:1px #000`, `filter:drop-shadow(3px 3px 0 #808080)` |
| 2 | gold | Times italic 900, `linear-gradient(180deg,#FFF7AA,#FFD700 45%,#B8860B 55%,#FFEB80)`, stroke `#7A4E00`, shadow `#000` |
| 3 | chrome | `linear-gradient(180deg,#FFF,#9FA6B2 45%,#2B2F36 50%,#E7EBF0 70%,#6D7480)`, stroke `#222` |
| 4 | blue 3D | `color:#3A7BFF`, 6-step `text-shadow` extrusion `#2A2A6A`, `skewX(-8deg)` |
| 5 | purple outline | transparent fill, `-webkit-text-stroke:1.5px #9900FF`, `text-shadow:3px 3px 0 #FF00FF` |
| 6 | horizon | `linear-gradient(180deg,#00C0FF,#FFFFFF 50%,#00A000 51%,#006000)`, stroke `#003300` |

Transparent-text WordArt gets a `@media (forced-colors: active)` guard that restores `color: CanvasText`. Sender
names stay real text, so screen readers are unaffected. A WordArt name is always at least 700 weight and 1.05em,
otherwise the gradient turns to mush.

## 4. Colour

| Variant | bg | surface | sidebar | rail | text | muted | accent / on | own | other |
|---|---|---|---|---|---|---|---|---|---|
| casual-friday | #FFFFFF | #F7F7FA | #F2F4F8 | #E9EDF3 | #1B1D22 | #5E6570 | #007A61 / #FFF | #E3F6EF | #F2F4F8 |
| geocities | #FFFFFF | #FFFFCC | #E8DDE8 + marble | #000080 | #000000 | #555555 | #0000EE / #FFF (visited #551A8B) | #FFFFCC | #FFFFFF |
| wordart | #FFFFFF (page) | #C0C0C0 | #C0C0C0 | #008080 | #000000 | #555555 | #000080 / #FFF | #FFFFE1 | #FFFFFF |
| poster | #FFFFFF + confetti | #00FFFF | #FF00FF | #9900FF | #000000 | #7A00CC | #FF0066 / #FFFF00 | #FFFF00 | #00FFFF |
| unreadable | #00FFFF + psych tile | #FF00FF | #FFFF00 | #FF6600 | #FF00FF | #FFFF00 | #00FF00 / #FF00FF | #FFFF00 | #00FF00 |
| after-midnight | #07001A + stars | #140033 | #0B0024 | #000000 | #F2EEFF | #B8A8E8 | #FF3CF0 / #000 | #2A0050 | #12002E |

Measured contrast (text/bg, muted/bg): casual 16.9/5.9 · geocities 21/7.5 · wordart 21/7.5 · poster 21/7.8 ·
after-midnight 18/9.6 · unreadable 2.5/1.2 (deliberate). The poster's yellow-on-hot-pink buttons reach 3.6:1, so they
are only used for large bold labels (Luckiest Guy, ≥ 18.66px bold, WCAG "large text" 3:1).

Shared period colours: Win95 face #C0C0C0, highlight #FFFFFF, light #DFDFDF, shadow #808080, dark #0A0A0A,
title bar #000080 → #1084D0, tooltip #FFFFE1, desktop #008080. Web-safe sender colours for geocities: #800000 #008000
#000080 #800080 #008080 #FF0000. Party set: #FF00FF #00FFFF #FFFF00 #FF6600 #33CC33 #9900FF #FF0066. Neon set:
#FF3CF0 #39FFF5 #FFF34D #7DFF5A #FF9F1C #A78BFA.

## 5. Per-variant design

### 5.1 `comic-casual-friday` (level 1, light, S5 H4)

This is Element as you know it, but somebody changed the font on Friday afternoon. Tokens stay Element light except
for a slightly warmer own-bubble (#E3F6EF). Corners go to 12px. The only decorations are a 3px static rainbow on the
date-separator `<hr>`, mentions as a yellow sticky note (#FFF6A8, -0.5deg, a single 300 ms wiggle) and speech-balloon
tails in the bubble layout. No enhancer. This is the variant people will actually keep on.

### 5.2 `comic-geocities` (level 2, light, S3 H7)

*"Welcome to my homepage!"* The app background is the tiled clouds image. The timeline sits on a white "page" table
with a 2px outset border. The room list is lilac marble with bevelled web-ring rows (`<< prev | Room | next >>`
pseudo-elements on hover/selected). The header shows the room name as a blue-purple gradient, the topic as a
marquee and a green-on-black VT323 hit counter ("You are visitor no. 004711", a fake per-room number from the
enhancer). Links are underlined #0000EE, visited #551A8B. Date separators use the animated rainbow `<hr>` GIF.
Timestamps are Times italic #555. Empty rooms get the under-construction sign. Unread rooms get a NEW! starburst.
The composer says "Sign my guestbook!" and the send button reads "Submit Query". The bottom of the space rail shows
the 88×31 buttons. Office-97 bevels are used for buttons/inputs only. The full Win95 look is level 3.

### 5.3 `comic-wordart` (level 3, light, S2 H8)

*It's 1997 and you have Office 97 Professional.* The background is the teal desktop. Every panel is a grey Win95 window
with a navy-to-blue title bar and decorative `_ □ ✕`. The space rail becomes a Start-menu strip with a rotated "Element
97" band. The room list is an Explorer list well. The header title bar carries the room name in **WordArt** (one of
6 styles by room hash: rainbow, gold, chrome, 3D…). The timeline is a **Word 97 document page**: a white sheet with a
drop shadow on #808080 and a ruler strip on top. Own messages sit on tooltip yellow. Sender names cycle the 6 WordArt
styles. Dialogs use Win95 window chrome with gold-WordArt titles, and settings become property sheets with raised
tabs and etched group boxes. **Klammi**, a self-drawn googly-eyed paperclip (not Clippit), appears once per session:
*"It looks like you're writing a message. Would you like help?"*

### 5.4 `comic-poster` (level 4, light, S1 H9), "really evil" part 1

*PARTY!!! FREE ENTRY!!!* The palette clashes on purpose: magenta, cyan, yellow, orange and purple, every panel has a
3px black outline and a 6px hard black drop shadow, and the gaps show purple with confetti. The header is a yellow band
with a huge Anton WordArt room name (yellow→red gradient, black stroke, 6px extrusion) and a ★ marquee topic.
**Each message is a sticker** in the sender's colour, tilted ±1deg (alternating with `:nth-child`), with the sender
name in that sender's WordArt style. The room list shows cut-out stickers with blinking (1 Hz) NEW! starbursts.
The composer has a 6px animated rainbow border, the flames GIF underneath and a "SEND!!!" starburst. Dialogs are
yellow stickers with hazard-stripe headers, rotated -1deg. Buttons use Luckiest Guy, #FF0066 with yellow, and
squash the shadow on press. The cursor is the rainbow arrow. Message *text* stays black on light stickers (≥ 16:1),
so the poster is loud but legible.

### 5.5 `comic-unreadable` (level 5, light, S0 H10), "really evil" part 2

Everything from level 4, then more:
magenta text on cyan stickers on the **animated psychedelic checkerboard**, a 7-colour 3D extrusion on Comic Sans,
**the whole app slowly hue-rotating** (20 s cycle, smooth), message tiles rocking ±2deg, avatars spinning, every room
name a marquee, blinking timestamps, a sparkle trail behind the rainbow cursor, under-construction signs in every empty
state and a hit counter that never stops counting. The description and stage say outright that readability is not a
goal. Safety rails, all non-negotiable:

- a one-time **WARNING** overlay before the theme activates: *"This theme moves and changes colour constantly.
  [I ACCEPT] [Take me back to safety]"*;
- a permanent **PANIC** button that switches to casual-friday;
- **no flashing**: no luminance flips above 3/s, blink at ≤ 1 Hz on small elements only, no full-screen strobe
  (WCAG 2.3.1);
- `prefers-reduced-motion: reduce` stops **all** movement, including GIFs, which are swapped for static PNGs. The colours
  stay ugly;
- keyboard focus stays visible (4px #000 + 4px #FFF, never animated), settings rows never move, and the composer stays
  operable.

### 5.6 `comic-after-midnight` (exciting, dark, S2 H9)

*The party moved to the blacklight room.* The background is #07001A with two drifting starfield layers (deep-star tile
at 120 s / 200 s). Panels are translucent over it, with 90% opaque bands behind text so contrast holds. The room name is
**neon WordArt**: Comic Sans bold, magenta core, cyan glow, flickering once on room change. Own messages glow cyan,
mentions glow yellow, and sender names use the neon set. A perspective neon grid floor sits at the bottom of the room
list. Buttons are glowing outlines that fill on hover. Element dark is the base for iframes, and hljs uses neon
colours. Reduced motion freezes the stars and the flicker.

## 6. Region map

The matrix below is generated from `comic.json`. The rules that hold across variants:

- **shell / spaces / roomlist** carry the textures (sky, marble, confetti, stars). The **timeline** gets either a
  solid band behind text (levels 1–4, after-midnight) or chaos (level 5).
- **header** is the WordArt stage in every variant from level 2 up.
- **composer** is the "form" (guestbook, Win95 window, poster sticker, neon field).
- **dialogs / menus / settings** follow the variant's window metaphor: Element (1), web table (2), Win95 (3),
  sticker (4–5), neon (✱).
- **iframes**: light, except after-midnight (dark). Only the frame is themed.

| region | casual-friday (1) | geocities (2) | wordart (3) | poster (4) | unreadable (5) | after-midnight (✱) |
|---|---|---|---|---|---|---|
| `shell` | Element light palette, Comic font tokens only | tile-clouds.png on the app background, 8px gutters show the sky around the panels | teal #008080 desktop; panels as Win95 windows separated by 4px of desktop | #9900FF background with confetti tile; panels separated by 10px with hard black shadows | animated psych checker tile + twinkle stars, slow hue-rotate on the whole app | #07001A with 2-layer starfield parallax |
| `spaces` | Element look, rounded 12px space icons | navy #000080 frame with yellow #FFFF00 hover, 88x31 buttons stacked at the bottom (when expanded) | grey #C0C0C0 'Start menu' strip with vertical navy gradient band and rotated 'Element 97' label | purple #9900FF rail, space icons as rotating-on-hover stickers with black outline | orange #FF6600 rail, icons spin slowly, rainbow ridge border | #000000 rail, space icons with magenta glow ring when selected |
| `roomlist` | Element look in Comic Sans, selected row #E3F6EF | tile-marble.png background, rows as bevelled web-ring buttons, selected row #FFFFCC with 2px inset border | grey window with title bar 'Rooms', rows like an Explorer list (white well, 2px inset), selected #000080/#FFFFFF | magenta marble, rows as cut-out stickers alternating cyan/yellow/orange, selected = red #FF0066 + yellow text, marquee section headers | yellow on yellow marble; every room name is a marquee; rows alternate rotation ±2deg | #0B0024 at 85% opacity over stars, neon grid floor in perspective at the bottom, selected row magenta glow |
| `header` | room name in Comic Sans bold 1.15em | white bar with gradient Comic room name, marquee topic, green-on-black VT323 hit counter | Win95 title bar gradient with WordArt room name (rainbow, 3D, skewed) and _ □ ✕ decorative buttons | yellow #FFFF00 band, WordArt room name (Anton, gradient #FFF200→#FF0000, 2px black stroke, 6px extrusion), marquee topic | wave-baseline WordArt room name (overlay), marquee topic, hit counter counting up forever | neon WordArt room name (magenta core, cyan glow), topic #B8A8E8 |
| `timeline` | unchanged structure; date separators get a 3px rainbow hr; mention = yellow sticky note | white page table with 2px outset border inside the sky; Times-italic timestamps; animated rainbow hr date separators | white Word 97 document page with shadow on #808080, ruler on top, bubbles as tooltip-yellow callouts | confetti tile; each message a sticker in its sender's colour, ±1deg tilt, 3px outline, hard shadow; rainbow wave date separators | magenta/cyan stickers wobbling on the psych tile; date separators are the flames GIF | translucent #07001A bands (90%) behind text over stars, neon tube date separators |
| `names-avatars` | Element decorative colours, names in Comic Sans bold | sender names in the 16-colour web-safe palette (#800000, #008000, #000080, #800080, #008080, #FF0000), avatars square with 2px outset bevel | sender names cycle 6 WordArt mini styles (rainbow, gold, chrome, blue 3D, purple outline, green horizon) via mx_Username_colorN; avatars square with bevel | 6 WordArt name styles (rainbow, gold, chrome, 3D blue, purple outline, green horizon); avatars in starburst or circle frames with 3px black border | sender names as rainbow 3D WordArt; avatars rotate 360° every 6 s | neon decorative colours (#FF3CF0, #39FFF5, #FFF34D, #7DFF5A, #FF9F1C, #A78BFA), avatars with glow ring |
| `composer` | rounded 12px field, Comic Sans | inset Win95 text field on #FFFFCC, placeholder 'Sign my guestbook!', send button 'Submit Query' | Win95 window 'Untitled - Message' with inset white field and bevelled 'Send' button | white field inside a 6px animated rainbow border, flames GIF underneath, 'SEND!!!' button as red starburst | rainbow ridge border animating, flames below, placeholder 'TYPE HERE!!!!!', send button 'CLICK ME!!!' blinking | #140033 field with magenta glow border, cyan on focus |
| `rightpanel` | Element look, Comic font | white page table on marble, headings in Comic bold #800080 with a rainbow hr | grey Win95 window with title bar, group boxes (etched 2px border) for sections | cyan #00FFFF panel with Luckiest Guy headings and hazard-stripe separators | magenta panel with yellow text and hazard stripes, headings in Chewy rotating | #140033 at 90% over stars, headings in neon cyan |
| `buttons` | Compound buttons, Comic font, radius 12px | grey #C0C0C0 Win95 bevel buttons, links-as-buttons blue underlined | Win95 bevel, pressed state inverted, primary = bold black outline (default button) | Luckiest Guy uppercase, #FF0066 with yellow text, 3px black border, 4px hard shadow, press = shadow 0 | #00FF00 with magenta text, rainbow ridge border, jiggle on hover | glowing magenta outline, filled #FF3CF0 with black text on hover/primary |
| `inputs` | Compound inputs, Comic font | 2px inset grey bevel, white field | white field, 2px inset bevel | white with 3px black border, focus = yellow glow | yellow field, red ridge border | #12002E, 1px #5B2BBF, cyan glow on focus |
| `dialogs` | Element dialogs, title in Comic Sans bold | white table with 3px outset border, title bar #000080 with yellow Comic title, hr under the title | Win95 window chrome (title bar gradient, ✕ button), heading as gold WordArt | yellow sticker with hazard-stripe header, Anton title, 10px hard shadow, slight -1deg rotation | hazard-stripe frame, rotated -2deg, WordArt titles, starfield inside | #140033 with 1px magenta border and glow, neon WordArt title |
| `menus` | Element menus; tooltips in Comic Sans | grey #C0C0C0 bevel menus, hover #000080/#FFFFFF; tooltips #FFFFE1 1px black | grey bevel menus, hover #000080/#FFFFFF; tooltips #FFFFE1 1px #000000 | cyan menus, black outline, hover #FF00FF; tooltips as yellow speech balloons | rainbow gradient menus, item hover inverts | #140033, hover #2A0050, tooltips black with cyan glow |
| `settings` | Element settings, Comic font | white page table, tab list as underlined link list with a bullet GIF-like ★ | Win95 property-sheet: tabs as raised tabs, panels in group boxes | tabs as coloured stickers, panels white on confetti | same chaos, but rows do not move (settings must stay operable) | dark panels, neon tab highlight |
| `auth` | Element login card, 'Welcome back, buddy!' heading feel via font only | clouds background, login card as homepage table: 'Welcome to my homepage!' rainbow hr, under-construction sign | teal desktop, login as a Win95 dialog 'Welcome to Element 97' with a WordArt logo | full poster: confetti, WordArt 'ELEMENT PARTY!!!' heading, login card as admission ticket | full chaos with the WARNING notice shown before login | starfield, neon 'ELEMENT AFTER MIDNIGHT' WordArt, login card glowing |
| `scrollbars` | Element default | Win95 grey scrollbar colours (#C0C0C0 thumb, #DFDFDF track) | Win95 grey scrollbar colours, square | thick 14px, magenta thumb on yellow track | 20px rainbow gradient thumb | thin magenta thumb on transparent |
| `focus` | Element focus ring, 2px #007A61 | 2px dotted #000000 outline (Win95 focus) plus 2px #0000EE outer | 1px dotted #000000 inset focus rectangle plus 2px #000080 outline for visibility | 4px solid #000 outline + 4px #FFFF00 offset ring (visible on every colour) | kept: 4px solid #000000 + 4px #FFFFFF ring, never animated (only usable affordance left) | 2px #FFF34D outline + 6px yellow glow |
| `badges` | Element badges, Comic Sans digits | red #FF0000 count badges with yellow text; unread rooms get the NEW! starburst | navy #000080 count badge with white text, mention badge #FF0000 | red starbursts with yellow digits, blinking 1 Hz on unread; mention badge bigger | blinking red starbursts everywhere | magenta badge with black text, mention badge yellow #FFF34D |
| `code` | Comic Mono, Element hljs colours | Comic Mono on #FFFFCC with 1px dashed #808080 border | Comic Mono, white well with inset bevel, hljs remapped to VGA colours | Comic Mono, black block with #00FF00 text, hard shadow | Comic Mono green on magenta, rotated 1deg | Comic Mono, #000000 block, neon hljs (magenta keywords, cyan strings, yellow numbers) |
| `iframes` | Element light | Element light inside a 2px outset table frame | Element light inside a Win95 window frame | Element light inside a sticker frame with hard shadow | Element light inside a hazard-stripe frame | Element dark inside a neon frame |
| `icons` | Compound icons unchanged | Compound icons in #000080 | Compound icons in black, 1px white emboss via drop-shadow on hover | Compound icons black, 1.15x scale | rainbow-filled via filter, slowly spinning on hover | Compound icons #B8A8E8, accent icons magenta glow |
| `motion` | Element default; honours reduced motion | marquee, rainbow hr, blink 1 Hz (steps), GIFs; all static under reduced motion (GIFs swapped for first-frame PNG via CSS) | WordArt shimmer on room change, Klammi slide-in; no loops; reduced motion: none | marquee, blink (≤1 Hz), rainbow border loop (6 s), starburst rotation (8 s), flames GIF; all off under reduced motion | maximal but ≤3 flashes/s, no full-screen luminance flips; reduced motion: all off | starfield drift, room-name flicker once; reduced motion: none |

## 7. Iconography and assets

- Compound icons stay (inline SVG, `currentColor`) and are recoloured per variant: navy (2), black (3–4), rainbow
  via filter (5), lilac/magenta glow (✱). No icon replacement in phase B.
- Period assets are **self-made CC0 re-creations** (see `themes/comic/README.md`): clouds, marble, stars,
  confetti, psych tile, hazard stripes, neon grid, rainbow `<hr>` GIF, wave rule, flames GIF, under-construction GIF,
  NEW! starburst (SVG + GIF), spinning email, smiley, sparkle, rainbow cursor, four 88×31 buttons and Klammi the
  paperclip. Real GeoCities GIFs (GifCities, Eppink's collection, Cameron's World) were used as visual reference only.
- Emoji stay Twemoji.

## 8. Motion

| Effect | Variants | Period | Reduced motion |
|---|---|---|---|
| marquee (topic, section headers, room names) | 2 (topic), 4, 5 | 12–18 s linear | static, ellipsis |
| blink (`steps(1)`) | 2 (NEW!), 4 (badges), 5 (badges, timestamps) | 1 s | off |
| rainbow border / hr | 2, 4, 5 | 6 s | static gradient |
| tile tilt / wobble | 4 (static tilt), 5 (rock ±2deg, 4 s) | – | static tilt kept in 4, none in 5 |
| hue-rotate whole app | 5 | 20 s | off |
| avatar spin | 5 | 6 s | off |
| starfield drift | 5, ✱ | 120/200 s | static |
| WordArt shimmer / neon flicker on room change | 3, ✱ | once, ≤ 1.2 s | off |
| GIF animations | 2–5 | native | swapped for static PNG / first frame |
| sparkle cursor trail | 5, ✱ (optional) | pointer-driven | off |

The kill switch: `@media (prefers-reduced-motion: reduce)` disables `animation` and `transition` inside the family
scope and swaps every `url(<name>.gif)` background for the first-frame `<name>-static.png` that `tools/make_assets.py`
exports for every GIF.

## 9. Accessibility stance

- Levels 1–4 and after-midnight meet **WCAG AA for text**: measured contrast in §4. Text never sits directly on a
  busy texture, always on a solid or ≥ 90% opaque band.
- Focus is visible everywhere: Win95 dotted rectangle plus a solid outer ring in 2/3, 4px black and yellow in 4/5,
  yellow glow in ✱.
- Motion respects `prefers-reduced-motion` in all variants. No flashing above 3/s anywhere.
- `forced-colors: active`: decorations off (`background-image: none`, `text-shadow: none`, `filter: none`), and
  transparent WordArt text restored to `CanvasText`.
- **comic-unreadable** is the documented exception for contrast (stage level-5, description says so) but keeps
  focus, operability, the warning and PANIC.

## 10. What cannot be themed, and the workarounds

| Limitation | Workaround |
|---|---|
| Comic Sans MS cannot be shipped | `local()` via the stack plus the metric-compatible Comic Relief |
| WordArt arcs/waves on real text would mean mutating React-owned DOM | CSS-only WordArt on the real text; arch/wave as a decorative `aria-hidden` overlay copy from the enhancer (real heading made transparent, not removed) |
| Call/widget iframes are light/dark only | theme the frame (`.mx_AppTile`, `.mx_CallView`): Win95 window, sticker, neon |
| Canvas chat effects, favicon, notification avatars | left alone |
| Composer placeholder is inline `--placeholder` | `--placeholder: "…" !important` (English only) |
| Badges forced into `cpd-theme-light` | tokens also on `[class*="cpd-theme-"]`, direct styling of `[class*="_notificationBadge_"]` |
| Hashed shared-component classes (event tile states, separators, room list) | `[class*="_local_"]` substring selectors checked against v1.12.33 |
| GIF animation ignores CSS `animation: none` | swap to static PNG under reduced motion |
| Whole-app `filter` animation is costly | level 5 only. Measure in phase B and fall back to a `mix-blend-mode: hue` overlay if it janks |
| Theme switching from inside a theme (PANIC) | needs a loader API, `ctx.api.switchTheme(id)` (requested) |

## 11. Enhancer plan (`themes/comic/enhance.ts`, one file with per-variant feature flags)

| Feature | cf | geo | wa | poster | unread | ✱ |
|---|---|---|---|---|---|---|
| hit counter (fake per-room number in localStorage, `data-ewt-count` on our overlay) | | ✓ | | ✓ | ✓ (counts up forever) | |
| room WordArt style by room-id hash (`data-ewt-wordart` on `<html>`) | | | ✓ | ✓ | ✓ | |
| WordArt arch/wave overlay copy of the room name (aria-hidden) | | | ✓ arch | | ✓ wave | |
| Klammi paperclip helper (once per session, dismissable, never over the composer) | | | ✓ | ✓ | ✓ (often) | |
| sparkle cursor trail (rAF-throttled, ≤ 20 sprites in `ctx.root`) | | | | | ✓ | optional |
| WARNING overlay + PANIC button | | | | | ✓ | |
| click-to-start WebAudio jingle (self-composed square-wave tune, never autoplays) | | | | | ✓ | |
| neon flicker / WordArt shimmer trigger on room change (adds a class to `<html>` for 1.2 s) | | | ✓ | | | ✓ |

Every feature checks `matchMedia("(prefers-reduced-motion: reduce)")` and degrades. `unmount()` removes all
overlays, listeners and attributes.

## 12. Sources

Fonts: Comic Relief (OFL, github.com/loudifier/Comic-Relief, google/fonts v1.200), Comic Neue (OFL), Comic Mono
(MIT, github.com/dtinth/comic-mono-font), Chewy and Luckiest Guy (Apache 2.0, Astigmatic), Anton (OFL), Tinos
(Fontsource, OFL), VT323 (OFL). Licence texts are in `themes/comic/LICENSES/`.

References (visual only, nothing copied): 98.css (MIT, bevel values), css-wordart (MIT, gradient recipes),
makewordart.com and the addbalance.com classic 30-style WordArt gallery, Cameron's World, GifCities (Internet
Archive), Jason Eppink's *Under Construction* (322 GeoCities GIFs), Restorativland GeoCities gallery, One Terabyte of
Kilobyte Age, and WCAG 2.3.1 (three flashes). Full URLs are in `comic.json` → `sources`.

Verified vs. dossier: Win95 bevel colours (98.css), WordArt gradient stops (dossier §1.3, css-wordart), Comic Relief
metric compatibility and licence (google/fonts upstream_info), Comic Mono MIT (repo LICENSE), Chewy/Luckiest Guy
Apache 2.0 (google/fonts METADATA). The dossier listed Comic Neue for level 1. This guide uses Comic Sans MS → Comic
Relief instead, so all levels share metrics, and keeps Comic Neue bundled as an option. The dossier's "Office 97"
level is folded into `comic-wordart` (level 3), because the catalogue puts GeoCities at level 2.
