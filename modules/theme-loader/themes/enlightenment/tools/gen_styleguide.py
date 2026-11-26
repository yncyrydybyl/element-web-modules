"""Generates docs/styleguides/enlightenment.json and themes/enlightenment/themes.json.

Run: python3 -I gen_styleguide.py <palettes.json> <repo-root>
Palettes are kept in a separate file so they can be contrast-checked (tools/contrast.py).
"""
import json, sys, os

P = json.load(open(sys.argv[1]))
ROOT = sys.argv[2]

SOURCES = [
    {"title": "E16 themes repo (BrushedMetal-Tigert, BlueSteel, Ganymede, ShinyMetal) — pixmaps sampled for hex values; e16 licence (MIT-style)", "url": "https://git.enlightenment.org/e16/e16-themes"},
    {"title": "Enlightenment 0.17.6 default theme (data/themes/*.edc + img, BSD-2) — E17 gradients and #3399FF glow sampled", "url": "https://git.enlightenment.org/enlightenment/enlightenment/src/tag/v0.17.6/data/themes"},
    {"title": "EFL elementary theme colorclasses.edc (current E / E-current core palette, :selected #3399FF)", "url": "https://git.enlightenment.org/enlightenment/efl/src/branch/master/data/elementary/themes/colorclasses.edc"},
    {"title": "EFL elementary fonts.edc (FN = \"Sans\" → DejaVu Sans)", "url": "https://git.enlightenment.org/enlightenment/efl/src/branch/master/data/elementary/themes/fonts.edc"},
    {"title": "Enlightenment home page screenshots (E 0.25 era, raster, 2021-12-13)", "url": "https://www.enlightenment.org/"},
    {"title": "MokshaRadiance (Bodhi/Moksha theme, BSD-2) — rad_conf.edc colour macros", "url": "https://github.com/JeffHoogland/MokshaRadiance"},
    {"title": "Bodhi Linux Radiance theme page", "url": "https://www.bodhilinux.com/a/radiance-theme/"},
    {"title": "Enlightenment themes overview", "url": "https://www.enlightenment.org/themes/start"},
    {"title": "Terminology THEMES.md", "url": "https://git.enlightenment.org/enlightenment/terminology/src/branch/master/THEMES.md"},
    {"title": "DejaVu fonts (Bitstream Vera licence + public domain)", "url": "https://dejavu-fonts.github.io/"},
    {"title": "Fontsource (OFL webfont builds: Titillium Web, Saira Semi Condensed, Exo 2, IBM Plex Sans, Share Tech Mono, Silkscreen)", "url": "https://fontsource.org/"},
]

LIMITS = [
    "Element Call / Jitsi / widget iframes only receive light|dark; every E variant frames them in its window border but the content stays Element-dark (e-daylight: Element-light by day).",
    "Compound icons are inline currentColor SVGs: recoloured (and glowing via drop-shadow on hover/focus), not replaced by E17 bitmap icons; only the header window-button trio and the space-panel logo are our own SVGs.",
    "No real window manager behaviour: E16 window shading, E17 compositor zoom/flip effects and gadget dragging are imitated with CSS animations on dialogs/menus only; nothing is draggable.",
    "Notification badges re-declare cpd-theme-light; tokens are set on [class*=cpd-theme-] and badges get direct [class*=_notificationBadge_] rules.",
    "Avatar images, emoji, chat effects canvas, maps and the pre-module spinner cannot take the glow/metal treatment (frames only).",
    "Lucida (E16 X11 core font) is proprietary: referenced via local(), DejaVu Sans bundled as fallback.",
    "E-current is not pixel-faithful to raster's newest theme (it changes almost monthly); we follow the colorclasses.edc palette and the 0.25+ screenshots.",
    "Glow-heavy variants keep effects off timeline tiles (performance rule): glow lives on selection, focus, header, composer and badges only.",
]

FONTS = {
    "dejavu": [
        {"family": "DejaVu Sans", "file": "assets/dejavu-sans-400.woff2", "weight": "400", "style": "normal"},
        {"family": "DejaVu Sans", "file": "assets/dejavu-sans-400-italic.woff2", "weight": "400", "style": "italic"},
        {"family": "DejaVu Sans", "file": "assets/dejavu-sans-700.woff2", "weight": "700", "style": "normal"},
        {"family": "DejaVu Sans Mono", "file": "assets/dejavu-sans-mono-400.woff2", "weight": "400", "style": "normal"},
        {"family": "DejaVu Sans Mono", "file": "assets/dejavu-sans-mono-700.woff2", "weight": "700", "style": "normal"},
    ],
    "silkscreen": [{"family": "Silkscreen", "file": "assets/silkscreen-400.woff2", "weight": "400", "style": "normal"}],
    "titillium": [
        {"family": "Titillium Web", "file": "assets/titillium-web-400.woff2", "weight": "400", "style": "normal"},
        {"family": "Titillium Web", "file": "assets/titillium-web-600.woff2", "weight": "600", "style": "normal"},
        {"family": "Titillium Web", "file": "assets/titillium-web-700.woff2", "weight": "700", "style": "normal"},
    ],
    "saira": [
        {"family": "Saira Semi Condensed", "file": "assets/saira-semi-condensed-500.woff2", "weight": "500", "style": "normal"},
        {"family": "Saira Semi Condensed", "file": "assets/saira-semi-condensed-700.woff2", "weight": "700", "style": "normal"},
    ],
    "neon": [
        {"family": "Exo 2", "file": "assets/exo-2-500.woff2", "weight": "500", "style": "normal"},
        {"family": "Exo 2", "file": "assets/exo-2-700.woff2", "weight": "700", "style": "normal"},
        {"family": "IBM Plex Sans", "file": "assets/ibm-plex-sans-400.woff2", "weight": "400", "style": "normal"},
        {"family": "IBM Plex Sans", "file": "assets/ibm-plex-sans-600.woff2", "weight": "600", "style": "normal"},
        {"family": "Share Tech Mono", "file": "assets/share-tech-mono-400.woff2", "weight": "400", "style": "normal"},
    ],
}

V = []

# ---------------------------------------------------------------- e16
V.append({
    "id": "e16-brushed-metal", "name": "E16 · BrushedMetal-Tigert", "stage": "past", "mode": "dark", "base": "dark",
    "seriousness": 6, "hype": 6,
    "tagline": "1999's default E16 theme: brushed aluminium window frames on a deep turquoise desktop.",
    "description": "E16 BrushedMetal-Tigert (Tigert/Rasterman, the DR16 default): light brushed-aluminium frames, bevelled bronze gem buttons and turquoise desktop/Edoc backgrounds; chrome in black on metal, timeline in white on teal.",
    "palette": P["e16-brushed-metal"],
    "fonts": {"ui": "Lucida Grande / Lucida Sans (local) → DejaVu Sans, 13px; bold for titles", "display": "Lucida bold → DejaVu Sans Bold (title bars); Silkscreen for pager/iconbox micro-labels", "mono": "DejaVu Sans Mono"},
    "shape": {"radius": "0px (2px on gem buttons only)", "border": "bevel", "shadow": "none; 1px #FEFEFE inner top highlight + 1px #121212 outline (E16 border pixmaps)", "density": "compact"},
    "texture": "brushed-metal (self-made brushed-aluminium.png, Tigert light_brushed.png optional) + turquoise desktop (tigert-turquoise-bg.jpg / CSS gradient #1D5A5A→#346F6E)",
    "motion": "Almost none, like 1999: instant hover swaps (pressed = inverted bevel), window-shade roll-up animation (120 ms scaleY) on dialogs closing; disabled under reduced motion.",
    "signature": [
        "Every panel is an E16 window: 4px aluminium frame, 19–23px title bar with Tigert bronze gem buttons (menu left, min/max/close right)",
        "Turquoise desktop (#1D5A5A→#346F6E vertical gradient, like dark_vertical_gradient_brushed.png) behind the timeline with white text and #88DDDD links (Edoc help colours)",
        "Active title bar #A7A7A6 aluminium with black bold title, inactive/unfocused panels drop to #767675",
        "Sticky/selected rows in Tigert's turquoise sticky-title tint (#93B0AE, text #000)",
        "Space panel as E16 pager: tiny square 'desktops' with teal windows (#1D3F3F) in a metal frame, Silkscreen labels",
    ],
    "regions": {
        "shell": "teal desktop gradient fills the window; left/right panels and room view are framed as separate E16 windows with 4px metal borders and a 2px gap of desktop between them",
        "spaces": "E16 pager: metal column, each space a 36px bevelled square with teal 'desktop' inside and avatar as mini window; active = white 2px p_sel frame",
        "roomlist": "light brushed aluminium, black Lucida text, 1px etched separators (#8E9398 / #FEFEFE pair); selected row = turquoise sticky tint #93B0AE with black text; hover = lighter #D9DCDE",
        "header": "E16 title bar: #A7A7A6 metal gradient (#FEFEFE top line, #4B4C4A/#121212 bottom), bold black centred room name, decorative gem trio right + menu gem left (aria-hidden)",
        "timeline": "deep teal (#1F4746) panel with subtle desktop texture at 6%, white text, own messages #2C6563 inset wells, others #26504F; read marker = 1px #88DDDD",
        "names-avatars": "avatars square (radius 0) with 1px black outline + white inner bevel; usernames bright pastel decoratives (cyan/sand/lilac) tuned for teal",
        "composer": "metal bar like the E16 iconbox: aluminium with an inset (bevel-in) white-ish entry field #EDEEEE, black text; send = gem button",
        "rightpanel": "second E16 window: metal frame and title bar, inner content on light metal (#D9DCDE) with black text",
        "buttons": "raised bevel: #CFD3D6→#8E9398 gradient, 1px #2B2F33 outline, inset 1px #F1F3F4 / -1px #5A5F64; pressed inverts; primary gets teal face (#9BB9B7, Tigert dialog button1)",
        "inputs": "sunken bevel (#5A5F64 top-left, #F1F3F4 bottom-right), white field, black text, teal caret",
        "dialogs": "E16 dialog window: metal title bar with gem buttons, body light_brushed aluminium, teal-faced primary buttons; backdrop = teal at 60%",
        "menus": "E16 menu style: metal panel, 1px black outline, highlighted item = teal #346F6E with white text; tooltips = pale yellowish metal (#E7E3D2) with black text, square",
        "settings": "dialog chrome as above; tab list as metal toolbar with bevelled tab buttons; panels on #D9DCDE with black text",
        "auth": "teal desktop full-bleed with Tigert 'Brushed Metal' title image and a centred E16 window for the form",
        "scrollbars": "14px metal trough (sunken) with bevelled aluminium thumb carrying 3 etched grip lines; no arrows",
        "focus": "2px dotted #000 outline on metal, 2px solid #88DDDD outline on teal (both ≥3:1), offset 1px",
        "badges": "square bevel pills: count = black on #C8C8C6 with 1px outline; mention = white on #A0281E bevel",
        "code": "Eterm-style #0E2A2A panel, #CFE3E2 text, DejaVu Sans Mono, hljs keywords #88DDDD, strings #D9C08A, comments #7FA3A1",
        "iframes": "Element dark; framed by a 4px metal border + title bar strip",
        "icons": "icons black (#1A1A1A) on metal, #CFE3E2 on teal; no glow",
        "motion": "no transitions except shade roll-up on close and 80 ms bevel press",
    },
    "difficulty": "hard",
    "enhancer": "Optional: E16 'Epplet' clock (E-Clock style analog face in metal bezel) mounted in the space-panel footer; adds data-tl-e16-focus to the panel that holds keyboard focus so its title bar turns 'active' (#A7A7A6) while the others go inactive (#767675).",
    "css": ["shared.css", "e16-metal-tokens.css", "e16-brushed-metal.css"],
    "fontsets": ["dejavu", "silkscreen"], "enhance": True,
})

# ---------------------------------------------------------------- e17
V.append({
    "id": "e17-glow", "name": "E17 · Dark Glow", "stage": "pure", "mode": "dark", "base": "dark",
    "seriousness": 7, "hype": 7,
    "tagline": "Raster's 2012 E17 dark theme: glossy charcoal gradients and the electric-blue #3399FF glow.",
    "description": "E17 (0.17) default dark theme: vgrad_med_dark #303030→#111111 bars, glossy shine strips, black recessed selection wells and the #3399FF glow on focus, selection and sliders.",
    "palette": P["e17-glow"],
    "fonts": {"ui": "DejaVu Sans (E 'Sans'), 13px", "display": "DejaVu Sans Bold with soft dark text shadow", "mono": "DejaVu Sans Mono"},
    "shape": {"radius": "3px (bars), 4px (buttons), 50% gel orbs", "border": "glow", "shadow": "0 1px #000 outline + inset 0 1px rgba(255,255,255,.07); glow = 0 0 6px 1px rgba(51,153,255,.85), 0 0 18px 4px rgba(51,153,255,.35)", "density": "normal"},
    "texture": "glossy (vgrad gradients + 5px shine strip), radial desktop wallpaper #545354→#1C1D1D",
    "motion": "E17 pulse: unread/mention badges ring-pulse 3× (1.4 s), hover glow fades in 150 ms, dialogs zoom .92→1 + fade 150 ms; all off under reduced motion.",
    "signature": [
        "Every bar is the E17 vgrad: #303030→#111111 with a 1px white-7% top line and a thin white 'shine' highlight",
        "Selections are black recessed wells (menu_sel_bg #000→#3D3D3D) with a #3399FF glow bar on the left and glowing white text",
        "The space panel is the shelf/Ibar: glossy dark glass, icons magnify on hover, active space with blue glow dot",
        "Radial charcoal desktop (bg_radgrad) visible around floating panels",
        "Glowing blue focus halos everywhere instead of plain outlines (always paired with a 2px solid ring)",
    ],
    "regions": {
        "shell": "radial wallpaper #545354 centre → #1C1D1D edges; panels float with 4px gaps and 0 2px 8px black shadows",
        "spaces": "vertical E17 shelf: glossy #303030→#111111 glass, Ibar icons scale 1.25 on hover (neighbours 1.1 via :has), active space = blue glow dot + ring",
        "roomlist": "Everything-launcher list on #202020: 1px separators #0E0E0E + rgba(255,255,255,.04); selected = black well with left #3399FF glow bar and white text glow (≥14px bold only)",
        "header": "E17 window border title: vgrad_med_dark gradient, white bold title with 1px black shadow, glowing min/max/close glyphs right (decorative)",
        "timeline": "#262626 panel, tiles flat (no per-tile effects), unread marker = horizontal glow bar (horizontal_separated_bar_glow)",
        "names-avatars": "avatars round gel orbs with 1px black ring + white 25% top sheen; usernames bright decoratives (#66B8FF, #FF9933, #99FF33, #FF3399, #9933FF, #33FF99 = E selected1–6)",
        "composer": "shelf look: glossy dark gradient bar, recessed #161616 entry well with inner shadow, send button = blue gel orb",
        "rightpanel": "#2A2A2A raised panel with the same title-bar header, cards in recessed wells",
        "buttons": "vgrad_med #606060→#313131 glossy buttons, 1px black outline, white text; hover adds outer blue glow; primary = blue gel (#66B8FF→#0A4D99) with white text",
        "inputs": "recessed #161616 wells, inset 0 1px 3px #000, focus = blue glow + 2px #3399FF ring",
        "dialogs": "floating E17 window: title-bar gradient, #2E2E2E body, big soft shadow (win_shadow), zoom-in 150 ms",
        "menus": "dark glass #202020 at 96%, 1px black border, selected row = black well + glow bar + white text; tooltips = small dark glass with blue 1px top line",
        "settings": "E17 config dialog: icon list on the left (tab labels) with glow selection, panels in recessed frames",
        "auth": "radial wallpaper, centred E17 window with the glowing E logo (e17-logo-blue-glow.png) above the form",
        "scrollbars": "thin recessed runner #101010 with glossy grey knob; hover/drag = blue glow runner (runner_glow)",
        "focus": "2px solid #3399FF ring + outer 6px glow; never glow alone",
        "badges": "count = dark gel with white text; mention/highlight = blue gel #3399FF with dark text + pulse (3×)",
        "code": "recessed #161616 well, DejaVu Sans Mono, hljs mapped to E syntax colourclasses (keyword #FF9999, string #33FF99, comment #339999, number #DCDC30, class #77AADD, function #9933FF→#B57BFF)",
        "iframes": "Element dark inside an E17 border frame",
        "icons": "icons #C8C8C8; hover/active = #FFFFFF with drop-shadow(0 0 3px #3399FF)",
        "motion": "pulse, glow fade 150 ms, dialog zoom 150 ms; off under reduced motion",
    },
    "difficulty": "medium",
    "enhancer": "Analog clock gadget (conic face, glowing blue hands, 1 Hz tick) docked at the bottom of the space panel like an E17 shelf gadget; paused when the tab is hidden.",
    "css": ["shared.css", "e17-glow.css"],
    "fontsets": ["dejavu"], "enhance": True,
})

# ---------------------------------------------------------------- e-current
V.append({
    "id": "e-current", "name": "Enlightenment · Current", "stage": "pure", "mode": "dark", "base": "dark",
    "seriousness": 8, "hype": 5,
    "tagline": "Today's flat Enlightenment theme: #202020 title bars, #404040 bodies, thin #3399FF accent lines.",
    "description": "Current Enlightenment (0.25–0.27, EFL elementary theme): flat greys straight from colorclasses.edc (:bg #404040, :bg-dim #303030, :bg-dark #202020), thin #3399FF selection lines, orange #FF9933 as second accent.",
    "palette": P["e-current"],
    "fonts": {"ui": "DejaVu Sans (E 'Sans'), 13px", "display": "DejaVu Sans Bold 13px titles; shelf clock digits in DejaVu Sans with wide letter-spacing (E uses a thin face; not bundled)", "mono": "DejaVu Sans Mono"},
    "shape": {"radius": "0px (2px on small controls)", "border": "hairline", "shadow": "windows: 0 2px 12px rgba(0,0,0,.5); no gloss", "density": "compact"},
    "texture": "none (flat); optional faint diagonal desktop shapes (CSS gradients) as in the 0.25 default wallpaper",
    "motion": "Short 100 ms fades; selection underline slides; no glow pulses.",
    "signature": [
        "Title bars #202020 with centred white bold title and small chevron/close glyphs",
        "Selection shown as a 3px #3399FF line (under active tabs, beside selected rows, scrollbar thumb is a thin blue bar)",
        "Bottom shelf look for the composer: #202020 strip, icons grey, active item underlined blue",
        "Orange #FF9933 for warnings/highlights, red #FF3333-ish for errors, lime #33FF33 for success (E palette)",
        "Dense small DejaVu Sans text, everything square",
    ],
    "regions": {
        "shell": "#2A2D33-ish desktop with dark diagonal facets behind the panels (CSS), panels butt together with 1px #101010 lines",
        "spaces": "#1C1C1C shelf column, icons 32px, active space underlined (left bar) 3px #3399FF",
        "roomlist": "#383838 list, rows 30px, selected = #303030 with 3px #3399FF left bar and white text, hover #404040",
        "header": "#202020 title bar, bold #FFFFFF title centred, chevron down/up + close glyph trio right (decorative)",
        "timeline": "#303030 document area (like ecrire), text #DCDCDC, own messages #2C3846 tint, highlight row = #FF9933 left bar",
        "names-avatars": "square avatars radius 2px; usernames from E palette (#66B8FF, #FF9933, #99FF33, #FF66B3, #B57BFF, #33FF99)",
        "composer": "#202020 shelf strip, #303030 entry with 1px #101010 border, focus = 1px #3399FF border + 2px outline",
        "rightpanel": "#404040 panel, section headers #DCDCDC bold, separators #505050",
        "buttons": "#606060 flat buttons with #DCDCDC text, pressed #505050, primary = #3399FF fill with #101010 text",
        "inputs": "#303030 fields, 1px #101010, focus blue border",
        "dialogs": "#404040 window, #202020 title bar, shadow 0 2px 12px #000",
        "menus": "#303030 popup, selected row #3399FF at 25% with white text + left blue bar; tooltips #202020 with #C8C8C8 text",
        "settings": "flat #404040, tab labels as list with blue left bar on active",
        "auth": "desktop facets background, centred #404040 window with the E logo (e-logo.svg tinted #DCDCDC)",
        "scrollbars": "8px, track transparent, thumb #3399FF at 70% (thin blue bar like ecrire)",
        "focus": "2px solid #3399FF outline, offset 1px",
        "badges": "count = #606060 with white; mention = #3399FF with #101010 text; highlight = #FF9933 dot",
        "code": "#202020 block, DejaVu Sans Mono, hljs = E syntax colourclasses (keyword #FF9999, string #33FF99, comment #339999, number #DCDC30, class #77AADD, function #B57BFF)",
        "iframes": "Element dark, framed by #202020 title strip",
        "icons": "#A0A0A0, hover #FFFFFF, active #3399FF",
        "motion": "100 ms fades and underline slide; reduced motion = none",
    },
    "difficulty": "easy",
    "enhancer": "Digital shelf clock (thin '05:49 PM' digits like the E clock gadget) at the bottom of the space panel; shared with the e17-glow analog clock code.",
    "css": ["shared.css", "e-current.css"],
    "fontsets": ["dejavu"], "enhance": True,
})

# ---------------------------------------------------------------- e-aurora
V.append({
    "id": "e-aurora", "name": "Edje Aurora", "stage": "exciting", "mode": "dark", "base": "dark",
    "seriousness": 6, "hype": 8,
    "tagline": "E17 structure under a slow polar aurora: teal → cyan → violet → magenta glows on blue-black glass.",
    "description": "Mashup: E17 glossy structure with an aurora gradient (teal #2EE6C5 → cyan #33A1FF → violet #9B6BFF → magenta #FF5FC8) drifting behind glass shelves; cyan focus glow, magenta mentions.",
    "palette": P["e-aurora"],
    "fonts": {"ui": "Titillium Web 400/600, 14px", "display": "Titillium Web 700 (room names, dialog titles), letter-spacing .02em", "mono": "DejaVu Sans Mono"},
    "shape": {"radius": "6px panels, 999px pills, 50% avatars", "border": "glow", "shadow": "0 8px 24px rgba(0,0,0,.45) + inset 0 1px rgba(255,255,255,.06); glow = 0 0 14px rgba(51,161,255,.45)", "density": "normal"},
    "texture": "aurora gradient field (CSS, behind shelves only) + grain.png at 6%",
    "motion": "Aurora drifts in a 30 s ease-in-out loop (background-position only) behind space panel/header/composer; hover glows 180 ms; off under reduced motion (static gradient).",
    "signature": [
        "Aurora ribbon (teal→cyan→violet→magenta) visible through translucent glass header, space shelf and composer",
        "Selected room = 3px teal→violet gradient bar with soft outer glow",
        "Mentions glow magenta #FF5FC8, focus glows cyan #33A1FF",
        "50/50 split gloss (4% white) on header and composer, 1px inner highlight",
        "Ibar magnification on the space shelf",
    ],
    "regions": {
        "shell": "#121418 night base, aurora field painted on the shell behind panels (fixed, 30 s drift), grain overlay",
        "spaces": "translucent glass shelf (rgba(26,29,35,.72) + backdrop blur 10px) over the aurora; icons magnify; active = teal→violet ring",
        "roomlist": "#1A1D23 solid panel (readability), rows with 1px #0A0B0E separators; selected = gradient bar + #232832 fill; unread names #FFFFFF bold",
        "header": "glass over aurora with 50/50 gloss, Titillium 700 room name, aurora-tinted glyph trio",
        "timeline": "solid #121418 (no aurora under text), own messages #1C2638 with 1px cyan 20% border, mentions = magenta left glow bar",
        "names-avatars": "round avatars with thin aurora ring on hover; usernames along the ramp (#2EE6C5, #33A1FF, #9B6BFF, #FF5FC8, #FFD166, #7CF29A)",
        "composer": "glass shelf over the aurora, #0E1014 entry pill, send = cyan→violet gradient orb",
        "rightpanel": "#1A1D23 panel, cards #232832 radius 6px",
        "buttons": "primary = cyan→violet gradient pill with dark text #06121F, secondary = #232832 with 1px rgba(255,255,255,.08) and cyan hover glow",
        "inputs": "#0E1014 fields, radius 6px, focus = 2px #33A1FF + glow",
        "dialogs": "#1A1D23 glass card with aurora hairline across the top (2px gradient), zoom-in 160 ms",
        "menus": "glass #1A1D23 at 92% + blur, hover row gradient wash 12%; tooltips dark glass with teal 1px border",
        "settings": "solid panels, tab selection = gradient bar",
        "auth": "full aurora background (animated), glass login card centred, E logo tinted with gradient mask",
        "scrollbars": "6px, thumb gradient teal→violet at 60%",
        "focus": "2px solid #33A1FF + 0 0 0 4px rgba(51,161,255,.25) glow",
        "badges": "count = #DDE3EA on #232832; mention = #FF5FC8 with #121418 text + glow; highlight pulse 3×",
        "code": "#0E1014 block, hljs keyword #9B6BFF, string #2EE6C5, number #FFD166, comment #6B7585, function #33A1FF, tag #FF5FC8",
        "iframes": "Element dark in a glass frame with aurora hairline",
        "icons": "#8B95A5, hover #DDE3EA with cyan drop-shadow",
        "motion": "30 s aurora drift, 180 ms glows; reduced motion: static",
    },
    "difficulty": "medium",
    "enhancer": "Optional: shared clock gadget (analog, aurora-gradient hands); no extra DOM otherwise (aurora is CSS).",
    "css": ["shared.css", "e-aurora.css"],
    "fontsets": ["titillium", "dejavu"], "enhance": True,
})

# ---------------------------------------------------------------- e-ember
V.append({
    "id": "e-ember", "name": "Moksha Ember", "stage": "exciting", "mode": "dark", "base": "dark",
    "seriousness": 6, "hype": 8,
    "tagline": "Charcoal and copper: E16 brushed copper title bars, Tigert bronze gems and an ember-orange glow.",
    "description": "Mashup: warm charcoal (#16120F) Moksha-style E17 structure, E16 brushed-copper title bars with Tigert's bronze gem buttons, E's own second accent #FF9933 as ember glow, amber pulse on unread, crimson highlights.",
    "palette": P["e-ember"],
    "fonts": {"ui": "DejaVu Sans 13.5px", "display": "Saira Semi Condensed 700 (headers, dialog titles, room names), uppercase tracking .04em for section labels", "mono": "DejaVu Sans Mono"},
    "shape": {"radius": "3px", "border": "bevel", "shadow": "inset 0 1px rgba(255,220,160,.10), 0 0 0 1px #0A0806; glow = 0 0 10px rgba(255,122,26,.55)", "density": "normal"},
    "texture": "brushed copper (brush-overlay.png over #7A4B2E→#3B2416) on header and dialog title bars; brush at 3% on panels",
    "motion": "Amber ember pulse on unread badges (3×), hover glow warms in 200 ms; reduced motion: none.",
    "signature": [
        "Brushed-copper title bars (#7A4B2E→#3B2416) with Tigert bronze gem buttons",
        "Ember glow #FF7A1A/#FF9933 on focus and selection, amber #FFB547 unread pulse",
        "Crimson #E0344A/#F0506A for mentions and destructive actions",
        "Warm off-white text #EEE4D8 on charcoal, never pure grey",
        "Saira Semi Condensed uppercase labels like engraved plates",
    ],
    "regions": {
        "shell": "#16120F charcoal with a faint warm radial glow bottom-left (like embers), grain at 5%",
        "spaces": "#110E0C column with copper-bevel space buttons; active = ember ring glow",
        "roomlist": "#211B17, rows separated by #0A0806 + rgba(255,220,160,.04); selected = #2E2520 with 3px ember bar and ember text-glow on name (bold)",
        "header": "brushed copper bar, Saira 700 title #FFF1E0 with dark emboss, bronze gem trio right",
        "timeline": "#16120F, own #3A2416 warm wells, others #241D19; mentions = crimson left bar; read marker amber hairline",
        "names-avatars": "round avatars with 1px copper ring; usernames warm decoratives (#FFB547, #FF7A1A, #F0506A, #E8C39E, #B5D86A, #7FC8D9)",
        "composer": "#211B17 bar with copper top edge, entry #110E0C inset, send = copper gem",
        "rightpanel": "#211B17 with copper title strip",
        "buttons": "copper bevel (#9A6038→#5A3420) with #FFF1E0 text; primary = ember #FF9933 face with #1A0D04 text; destructive = crimson",
        "inputs": "#110E0C inset fields, focus = 2px #FF9933 + ember glow",
        "dialogs": "copper title bar + charcoal body #2E2520, zoom-in 150 ms",
        "menus": "#2E2520 panels, hover row ember wash 18% with left bar; tooltips #110E0C with amber top hairline",
        "settings": "Saira tab labels, active = ember bar",
        "auth": "charcoal with ember radial glow, copper-framed login window",
        "scrollbars": "8px copper-tinted thumb #5A3420, hover #9A6038",
        "focus": "2px solid #FF9933 + 0 0 8px rgba(255,122,26,.55)",
        "badges": "count = #EEE4D8 on #3A2E27; mention = #F0506A with #16120F text; unread dot amber pulse 3×",
        "code": "#110E0C, hljs keyword #FF9933, string #B5D86A, number #FFB547, comment #8A7A6E, function #F0A27A, tag #F0506A",
        "iframes": "Element dark in copper frame",
        "icons": "#A8978A, hover #FFB547 with ember drop-shadow",
        "motion": "ember pulse 3×, 200 ms glows; reduced motion off",
    },
    "difficulty": "medium",
    "enhancer": "Optional: shared clock gadget in 'flip' style (E17 flip clock) with ember digits.",
    "css": ["shared.css", "e-ember.css"],
    "fontsets": ["saira", "dejavu"], "enhance": True,
})

# ---------------------------------------------------------------- e-neon-steel
V.append({
    "id": "e-neon-steel", "name": "Ganymede Neon Steel", "stage": "exciting", "mode": "dark", "base": "dark",
    "seriousness": 5, "hype": 9,
    "tagline": "E16 BlueSteel slate and Ganymede cobalt bevels lit by cyan/magenta neon, Terminology scanlines in code.",
    "description": "Mashup: E16 BlueSteel slate (#2D3243/#41475A) and Ganymede cobalt bevels (#3263E5) as brushed steel, lit by neon cyan #33E0FF and E magenta #FF3399, lime #99FF33 presence, Terminology-style scanlines in code blocks.",
    "palette": P["e-neon-steel"],
    "fonts": {"ui": "IBM Plex Sans 400/600, 14px", "display": "Exo 2 700 (headers), Exo 2 500 (labels)", "mono": "Share Tech Mono (timestamps, code) → DejaVu Sans Mono"},
    "shape": {"radius": "0px with 6px chamfered corners on header/dialogs (clip-path)", "border": "bevel", "shadow": "1px #3263E5 bevel top-left / #0B1B5A bottom-right (Ganymede), neon glow 0 0 10px rgba(51,224,255,.5)", "density": "normal"},
    "texture": "blue-tinted brushed steel (brush-overlay.png on #2D3243) on header/dialog bars; scanlines (repeating-linear-gradient 2px) in code blocks only",
    "motion": "Neon flicker once on dialog open (2 frames), hover glows 120 ms; reduced motion: none.",
    "signature": [
        "Brushed BlueSteel bars with Ganymede cobalt 1px bevels",
        "Neon cyan focus/selection, magenta mentions, lime presence dots",
        "Chamfered (cut-corner) header and dialogs, decorative chrome window-button trio",
        "Terminology scanlines + Share Tech Mono in code and timestamps",
        "Space panel as an E16 pager with 2×2 mini-preview look",
    ],
    "regions": {
        "shell": "#0D111C deep slate with faint indigo vignette (Ganymede #2B2B6A at 30%)",
        "spaces": "steel pager column #161C2B, space tiles with cobalt bevel; active = cyan neon outline",
        "roomlist": "#161C2B, separators #05070C + rgba(140,153,186,.06); selected = #1A2547 with cyan left bar + cyan name glow (bold)",
        "header": "brushed steel #2D3243 bar with cobalt bevel, chamfered right corner, Exo 2 title, chrome trio",
        "timeline": "#0D111C, own #1A2547, others #161C2B, timestamps Share Tech Mono #8C99BA, mentions magenta bar",
        "names-avatars": "square avatars with 1px cobalt bevel; usernames neon set (#33E0FF, #FF3399, #99FF33, #FFB547, #B57BFF, #5EA0FF)",
        "composer": "steel bar, entry #0A0D16 with cobalt inset, send = cyan neon chevron",
        "rightpanel": "#161C2B with steel title strip",
        "buttons": "steel bevel (#41475A→#2D3243) with #D6E2F5 text; primary = cyan #33E0FF with #03141A text; destructive magenta",
        "inputs": "#0A0D16 inset, focus = 2px #33E0FF + neon glow",
        "dialogs": "chamfered steel window, cobalt bevel, neon flicker-in",
        "menus": "#161C2B, hover row cyan wash 14%, tooltips black with cyan border",
        "settings": "Exo 2 tab labels, cyan bar on active",
        "auth": "indigo/slate gradient with cobalt light streaks, chamfered steel card",
        "scrollbars": "6px cobalt thumb #3263E5, hover cyan",
        "focus": "2px solid #33E0FF + 0 0 10px rgba(51,224,255,.5)",
        "badges": "count = #D6E2F5 on #2D3243; mention = #FF3399 with #0D111C text; presence lime",
        "code": "#05070C block with 2px scanlines (rgba(51,224,255,.04)), Share Tech Mono #CFE3F5, hljs keyword #FF3399, string #99FF33, number #FFB547, comment #5C6A8A, function #33E0FF",
        "iframes": "Element dark in steel frame",
        "icons": "#8C99BA, hover #33E0FF with neon drop-shadow",
        "motion": "flicker-in on dialogs, 120 ms glows; reduced motion off",
    },
    "difficulty": "medium",
    "enhancer": "Optional: shared clock gadget (digital, Share Tech Mono, cyan).",
    "css": ["shared.css", "e-neon-steel.css"],
    "fontsets": ["neon", "dejavu"], "enhance": True,
})

# ---------------------------------------------------------------- e-usable
V.append({
    "id": "e-usable", "name": "Enlightenment · Usable", "stage": "usable", "mode": "dark", "base": "dark",
    "seriousness": 9, "hype": 4,
    "tagline": "The E look for eight-hour chat days: E-current greys, one blue glow, real contrast and calm motion.",
    "description": "E17/E-current look tuned for daily chat: brighter text (#EDEDED on #2C2C2C), visible 1px borders, solid 2px focus rings with only a subtle glow, no text glow, no gloss on content, bigger hit areas, Element affordances kept.",
    "palette": P["e-usable"],
    "fonts": {"ui": "DejaVu Sans 14px (Element font scaling honoured)", "display": "DejaVu Sans Bold", "mono": "DejaVu Sans Mono"},
    "shape": {"radius": "4px", "border": "hairline", "shadow": "subtle: 0 1px 2px rgba(0,0,0,.4); focus glow 0 0 0 4px rgba(77,166,255,.25)", "density": "normal"},
    "texture": "none (single soft gloss only on the header bar)",
    "motion": "100 ms colour fades only; no pulses (badges static); reduced motion = none.",
    "signature": [
        "E-current flat greys with the E17 glossy header as the one nostalgic touch",
        "Blue #4DA6FF selection bar + subtle glow, never glow-only",
        "Visible 1px #7A7A7A borders on inputs/cards (≥3:1)",
        "Element threads, E2EE shields and read receipts kept prominent",
        "Calm: no pulses, no text glow, no textures behind text",
    ],
    "regions": {
        "shell": "#1C1C1C base, panels separated by 1px #101010",
        "spaces": "#1C1C1C column, 40px hit targets, active = 3px #4DA6FF bar + soft glow",
        "roomlist": "#333333, rows 36px, selected = #404040 with 3px blue bar, unread bold white, hover #3A3A3A",
        "header": "E17 gloss bar (#3D3D3D→#262626), white title, no decorative glyphs",
        "timeline": "#2C2C2C, own #283445, readable 1.5 line-height, highlight = #FF9933 bar + 8% tint",
        "names-avatars": "round avatars, usernames lightened E palette (≥4.5:1 on #2C2C2C)",
        "composer": "#333333 bar, #262626 entry with 1px #7A7A7A border, focus 2px blue",
        "rightpanel": "#333333, cards #383838 with 1px border",
        "buttons": "#4A4A4A secondary with border, primary #4DA6FF with #0A0A0A text, 36px min height",
        "inputs": "#262626, 1px #7A7A7A, focus 2px #4DA6FF + soft glow",
        "dialogs": "#383838, #262626 gloss title strip, shadow, no zoom",
        "menus": "#333333, selected row #4DA6FF 22% + left bar, tooltips #1C1C1C with #EDEDED text",
        "settings": "as dialogs, wide click targets",
        "auth": "#1C1C1C with E logo, simple #383838 card",
        "scrollbars": "10px, thumb #6A6A6A, hover #4DA6FF",
        "focus": "2px solid #4DA6FF, offset 2px, plus 4px 25% glow",
        "badges": "count #EDEDED on #555555; mention #FF6B5E with #1C1C1C text; static",
        "code": "#1F1F1F, DejaVu Sans Mono, E syntax colours brightened for 4.5:1",
        "iframes": "Element dark, plain 1px frame",
        "icons": "#B4B4B4, hover #EDEDED, active #4DA6FF",
        "motion": "100 ms fades only",
    },
    "difficulty": "easy",
    "enhancer": None,
    "css": ["shared.css", "e-usable.css"],
    "fontsets": ["dejavu"], "enhance": False,
})

# ---------------------------------------------------------------- e-daylight
SCHEDULE = [
    {"from": "05:30", "phase": "dawn", "base": "light"},
    {"from": "09:00", "phase": "day", "base": "light"},
    {"from": "18:00", "phase": "dusk", "base": "dark"},
    {"from": "21:30", "phase": "night", "base": "dark"},
]
V.append({
    "id": "e-daylight", "name": "Enlightenment · Aurora Cycle", "stage": "pure", "mode": "daylight", "base": "light",
    "seriousness": 7, "hype": 7,
    "tagline": "One E desktop through the day: pastel aurora dawn, brushed-steel day, ember dusk, deep-blue glow night.",
    "description": "Daylight cycle by local clock: dawn (soft lilac/rose light, violet accent), day (light brushed steel, E-blue #1A5DB3), dusk (ember charcoal, #FF9933), night (deep blue-black with the E17 #3399FF glow). 2 s cross-fades unless reduced motion.",
    "palette": P["daylight-day"],
    "phases": {"dawn": P["daylight-dawn"], "day": P["daylight-day"], "dusk": P["daylight-dusk"], "night": P["daylight-night"]},
    "schedule": SCHEDULE,
    "fonts": {"ui": "DejaVu Sans 13.5px", "display": "Titillium Web 600/700 (titles; aurora echo)", "mono": "DejaVu Sans Mono"},
    "shape": {"radius": "4px", "border": "glow", "shadow": "day: 0 1px 2px rgba(20,30,40,.25) + steel bevel; night: E17 glow 0 0 8px rgba(51,153,255,.6)", "density": "normal"},
    "texture": "day: brushed steel (brush-overlay.png on #C6CCD3) on header/space panel; dawn: soft aurora wash (CSS); dusk: copper brush on header; night: none (glow only)",
    "motion": "2 s background/colour cross-fade between phases (CONTRACT §6); night adds E17 pulse on mentions; reduced motion = instant switch.",
    "signature": [
        "The same E window structure (title bar, shelf, pager) re-lit four times a day",
        "Dawn: pastel aurora band (lilac #CDBBD0 → rose → mint) across header and composer",
        "Day: light brushed steel bars, dark text, E-blue darkened for light contrast (#1A5DB3)",
        "Dusk: Moksha Ember copper title bars and #FF9933 glow",
        "Night: deep-blue E17 glow (#3399FF) on #0A0F1E",
    ],
    "regions": {
        "shell": "phase-tinted desktop: dawn #F4ECEE + aurora wash, day #E3E6EA steel, dusk #1C1512 ember radial, night #0A0F1E",
        "spaces": "shelf column in the rail colour of the phase; active = accent bar (+ glow at night)",
        "roomlist": "sidebar colour of the phase, selected = accent bar + surface fill",
        "header": "title bar: dawn aurora wash, day brushed steel, dusk brushed copper, night E17 gradient #152038→#0A0F1E",
        "timeline": "phase bg, own/other per palette; no textures behind text in any phase",
        "names-avatars": "decoratives re-mapped per phase (dark-on-light by day, bright-on-dark at night)",
        "composer": "shelf bar in sidebar colour with inset entry in surface colour",
        "rightpanel": "sidebar colour, cards in surface colour",
        "buttons": "primary = accent with onAccent text per phase; secondary bevel matching the phase (steel/copper/glass)",
        "inputs": "surface fields, 1px border, focus 2px accent (+ glow at dusk/night)",
        "dialogs": "phase title bar + surface body",
        "menus": "surface panels, accent-wash selection",
        "settings": "as dialogs",
        "auth": "phase desktop with E logo tinted accent",
        "scrollbars": "thin accent-tinted thumb",
        "focus": "2px solid accent (always ≥3:1 in each phase) + glow at dusk/night",
        "badges": "mention = critical colour of the phase; count = surface/text",
        "code": "day/dawn: light code well with darkened E syntax colours; dusk/night: dark well with E syntax colourclasses",
        "iframes": "light during dawn/day, dark during dusk/night (data-tl-base follows the phase)",
        "icons": "muted colour, hover text colour, active accent",
        "motion": "2 s phase cross-fade; pulse only at night",
    },
    "difficulty": "hard",
    "enhancer": "onPhase(): swaps the shelf clock gadget face (sun/steel/ember/moon) and announces nothing; CSS does the rest. Clock gadget shared with e17-glow.",
    "css": ["shared.css", "e-daylight-phases.css", "e-daylight.css"],
    "fontsets": ["dejavu", "titillium"], "enhance": True,
})

FAMILY = {
    "family": "enlightenment",
    "name": "Enlightenment",
    "concept": ("The Enlightenment desktop as a chat client: every Element panel becomes an E window with a title bar, "
                "the space panel becomes the shelf/pager and the composer the shelf below it. The pure stages reproduce "
                "verified palettes from the theme sources (E16 BrushedMetal-Tigert pixmaps, the E17 0.17 dark theme, and "
                "EFL's current colorclasses.edc with #3399FF), the past stage is 1999 brushed aluminium on turquoise, the "
                "exciting stages are three 'really nice dark, coloured' mashups (aurora, ember, neon steel), and the usable "
                "stage keeps the E look but tunes contrast, focus and motion for long chat sessions."),
    "sources": SOURCES,
    "limits": LIMITS,
}

sg = dict(FAMILY)
sg["variants"] = []
KEYS = ["id", "name", "stage", "mode", "seriousness", "hype", "tagline", "palette", "phases", "fonts", "shape",
        "texture", "motion", "signature", "regions", "difficulty", "enhancer"]
for v in V:
    e = {k: v.get(k) for k in KEYS}
    if v["mode"] == "daylight":
        e["schedule"] = v["schedule"]
    sg["variants"].append(e)

os.makedirs(f"{ROOT}/docs/styleguides", exist_ok=True)
with open(f"{ROOT}/docs/styleguides/enlightenment.json", "w") as f:
    json.dump(sg, f, indent=2, ensure_ascii=False)
    f.write("\n")

# ---------------------------------------------------------------- manifest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tokens as T

FONTSTACK = {
    "e16-brushed-metal": ('"Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", "DejaVu Sans", sans-serif', '"DejaVu Sans Mono", monospace'),
    "e17-glow": ('"DejaVu Sans", "Bitstream Vera Sans", sans-serif', '"DejaVu Sans Mono", monospace'),
    "e-current": ('"DejaVu Sans", "Bitstream Vera Sans", sans-serif', '"DejaVu Sans Mono", monospace'),
    "e-aurora": ('"Titillium Web", "DejaVu Sans", sans-serif', '"DejaVu Sans Mono", monospace'),
    "e-ember": ('"DejaVu Sans", sans-serif', '"DejaVu Sans Mono", monospace'),
    "e-neon-steel": ('"IBM Plex Sans", "DejaVu Sans", sans-serif', '"Share Tech Mono", "DejaVu Sans Mono", monospace'),
    "e-usable": ('"DejaVu Sans", sans-serif', '"DejaVu Sans Mono", monospace'),
    "e-daylight": ('"DejaVu Sans", sans-serif', '"DejaVu Sans Mono", monospace'),
}

manifest = {"family": "enlightenment", "name": "Enlightenment", "variants": []}
for v in V:
    fonts = [f for s in v["fontsets"] for f in FONTS[s]]
    sans, mono = FONTSTACK[v["id"]]
    deco = T.DECORATIVE["day" if v["mode"] == "daylight" else v["id"]]
    tok = T.build(v["palette"], v["base"] == "dark", deco, {"sans": sans, "mono": mono})
    if v["id"] == "e16-brushed-metal":
        # the palette's surface/sidebar describe the metal chrome; the base (timeline) tokens stay teal
        tok.update({
            "--cpd-color-bg-canvas-default-level-1": "#2C5F5E",
            "--cpd-color-bg-subtle-primary": "#2C5F5E",
            "--cpd-color-bg-subtle-secondary": "#26504F",
            "--cpd-color-bg-subtle-secondary-level-0": "#26504F",
            "--cpd-color-bg-action-secondary-rest": "#2C5F5E",
            "--cpd-color-bg-action-secondary-hovered": "#346F6E",
            "--cpd-color-bg-action-secondary-pressed": "#24504F",
            "--cpd-color-bg-action-tertiary-hovered": "#2A5958",
            "--cpd-color-bg-action-tertiary-pressed": "#24504F",
            "--cpd-color-bg-action-tertiary-selected": "#346F6E",
        })
    manifest["variants"].append({
        "id": v["id"], "name": v["name"], "stage": v["stage"], "mode": v["mode"], "base": v["base"],
        "seriousness": v["seriousness"], "hype": v["hype"],
        "description": v["description"],
        "css": v["css"],
        "fonts": fonts,
        "tokens": tok,
        "enhance": v["enhance"],
        "schedule": v.get("schedule"),
    })
    if v["mode"] == "daylight":
        out = ["/* GENERATED by tools/gen_styleguide.py from tools/palettes.json - do not edit. Phase token sets. */\n"]
        for ph, pal in v["phases"].items():
            dark = next(x["base"] for x in v["schedule"] if x["phase"] == ph) == "dark"
            sel = f'html[data-tl-theme="{v["id"]}"][data-tl-phase="{ph}"]'
            out.append(T.css_block(f'{sel},\n{sel} body,\n{sel} [class*="cpd-theme-"]', T.build(pal, dark, T.DECORATIVE[ph])))
        with open(f"{ROOT}/themes/enlightenment/e-daylight-phases.css", "w") as f:
            f.write("\n".join(out))

# e16: light brushed-metal chrome re-declares the tokens inside metal regions (timeline stays white-on-teal)
METAL = {"bg": "#D9DCDE", "surface": "#E4E6E7", "sidebar": "#C8C8C6", "rail": "#A7A7A6", "text": "#000000",
         "muted": "#33373B", "accent": "#1D5A5A", "onAccent": "#FFFFFF", "border": "#3B3F44", "own": "#C8D6D5",
         "other": "#E4E6E7", "critical": "#8B1A10", "success": "#1E5E10"}
METAL_DECO = ["#0E5A55", "#7A4E00", "#5B3A99", "#2F6A1E", "#9A2F22", "#2A4F9A"]
metal_regions = [".mx_SpacePanel", ".mx_LeftPanel", ".mx_RoomHeader", ".mx_MessageComposer", ".mx_RightPanel",
                 ".mx_Dialog", ".mx_ContextualMenu", "[role=\"menu\"]", "[data-radix-popper-content-wrapper]",
                 ".mx_AuthPage_modal", ".mx_RoomView_statusArea", ".mx_RoomPreviewBar", ".mx_Toast_toast"]
sel = ",\n".join(f'html[data-tl-theme="e16-brushed-metal"] {r}' for r in metal_regions)
mt = T.build(METAL, False, METAL_DECO)
mt["--cpd-color-bg-action-tertiary-hovered"] = "#E4E6E7"
mt["--cpd-color-bg-action-tertiary-selected"] = "#93B0AE"
mt["--cpd-color-border-focused"] = "#000000"
with open(f"{ROOT}/themes/enlightenment/e16-metal-tokens.css", "w") as f:
    f.write("/* GENERATED by tools/gen_styleguide.py - metal-region token set for e16-brushed-metal. */\n")
    f.write(T.css_block(sel, mt))

os.makedirs(f"{ROOT}/themes/enlightenment", exist_ok=True)
with open(f"{ROOT}/themes/enlightenment/themes.json", "w") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
    f.write("\n")
print("wrote", len(V), "variants")
