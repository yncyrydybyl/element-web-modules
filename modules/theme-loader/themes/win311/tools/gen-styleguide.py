import json

ROOT = "/var/home/t/projects/element-web-themes"

SOURCES = [
    {"title": "Windows 3.1 retail CONTROL.INI [color schemes] (22 schemes, BGR hex) — copy in joncampbell123/win31igdrv",
     "url": "https://github.com/joncampbell123/win31igdrv/blob/master/WINDOWS/CONTROL.B~K"},
    {"title": "Microsoft KB 102976 'REG: User Preferences Entries' (NT 3.1 Colors defaults + same scheme table)",
     "url": "https://ftp.zx.net.nz/pub/Patches/ftp.microsoft.com/MISC/KB/en-us/102/976.HTM"},
    {"title": "Microsoft KB 71317 'Restoring Color Schemes in the Control Panel' (CONTROL.SR_ holds the schemes)",
     "url": "https://techshelps.github.io/MSDN/KB/Source/win3x/q71317.htm"},
    {"title": "PCjs Machines — Microsoft Windows 3.10 running in the browser (pixel-sampled for Windows Default, 2026-11-15)",
     "url": "https://www.pcjs.org/software/pcx86/sys/windows/3.10/"},
    {"title": "libwinui — Windows 3.x design language notes (VGA.DRV OBM_* bevel grammar, fonts, metrics), MIT",
     "url": "https://github.com/libwinui/libwinui/blob/main/docs/background/themes/win3x.md"},
    {"title": "W95FA font (FontsArena), SIL OFL 1.1 — @fontsource/win95fa 5.3.0",
     "url": "https://www.npmjs.com/package/@fontsource/win95fa"},
    {"title": "Pixel Operator font (Jayvee Enaguas), CC0 1.0", "url": "https://github.com/bauripalash/ttf-pixeloperator-fork"},
    {"title": "The Ultimate Oldschool PC Font Pack v2.2 (VileR), CC BY-SA 4.0 — PxPlus IBM VGA 8x16",
     "url": "https://int10h.org/oldschool-pc-fonts/"},
    {"title": "Pixelify Sans, SIL OFL 1.1 — @fontsource/pixelify-sans 5.3.0", "url": "https://github.com/eifetx/Pixelify-Sans"},
    {"title": "98.css (MIT) — reference for scrollbar/checkbox recipes only", "url": "https://github.com/jdan/98.css"},
    {"title": "jasmaa/win3.css (MIT) — reference", "url": "https://github.com/jasmaa/win3.css"},
    {"title": "PC Gamer: the story of Hot Dog Stand", "url": "https://www.pcgamer.com/software/windows/windows-3-1-included-a-red-and-yellow-hot-dog-stand-color-scheme-so-garish-it-was-long-assumed-to-be-a-joke-so-i-tracked-down-the-original-designer-to-get-the-true-story/"},
]

LIMITS = [
    "Element Call / Jitsi / widget iframes only know light|dark: they render in modern Element styling inside a Win 3.x MDI frame (we style .mx_AppTile/.mx_CallView chrome only).",
    "The new room list is virtualised (react-virtuoso, measured row heights): a true wrapping Program Manager icon grid would break scrolling, so rooms are a single column of 32px program items; spaces (not virtualised) get the real minimized-group-icon strip.",
    "No real window management: MDI windows are CSS frames around fixed Element regions; min/max buttons and the control-menu box are decorative unless the enhancer wires them (maximise = collapse left panel / right panel; control menu = room context menu).",
    "Bitmap fonts: the real System and MS Sans Serif are .FON bitmaps browsers cannot use even if installed; local() is tried but W95FA / Pixel Operator carry the look. Pixel fonts are only crisp at 16px multiples and with integer devicePixelRatio; at 125%/150% zoom they blur.",
    "User font-size slider (FontWatcher) scales :root; the pure variants pin chrome to 16px and only let the timeline scale, usable follows the slider in 16px steps where possible.",
    "Emoji stay Twemoji colour glyphs (no 1992 equivalent); avatars can be posterised with a CSS filter approximation only (true 16-colour dither needs an SVG filter, too expensive per tile in usable variants).",
    "Compound/Radix tooltips and some menus are portals with hashed classes; restyled via [role=tooltip]/[role=menu] only.",
    "Hard-coded dark surfaces (image viewer #21262c, non-urgent toasts) are overridden per selector; the image lightbox stays a dark modal by design.",
]

def pal(bg, surface, sidebar, rail, text, muted, accent, onAccent, border, own, other, critical, success):
    return dict(bg=bg, surface=surface, sidebar=sidebar, rail=rail, text=text, muted=muted, accent=accent,
                onAccent=onAccent, border=border, own=own, other=other, critical=critical, success=success)

# --- the four scheme palettes used by several variants ---------------------------------------------------------
P_DEFAULT = pal("#FFFFFF", "#FFFFFF", "#FFFFFF", "#C0C0C0", "#000000", "#808080", "#000080", "#FFFFFF",
                "#000000", "#FFFFFF", "#FFFFFF", "#800000", "#008000")
P_OCEAN = pal("#008040", "#FFFFFF", "#FFFFFF", "#008080", "#000000", "#000000", "#004080", "#FFFFFF",
              "#000000", "#FFFFFF", "#FFFFFF", "#800000", "#008000")
P_PLASMA = pal("#0000FF", "#000000", "#000000", "#000000", "#FFFFFF", "#C0C0C0", "#000080", "#FFFFFF",
               "#C0C0C0", "#000000", "#000000", "#FF0000", "#00FF00")
P_LEATHER = pal("#C0C0C0", "#000000", "#000000", "#000000", "#FFFFFF", "#C0C0C0", "#400080", "#FFFFFF",
                "#808080", "#000000", "#000000", "#FF0000", "#00FF00")

FONTS_PURE = {"ui": "MS Sans Serif (local) → W95FA 16px", "display": "System bold (local) → Pixel Operator Bold 16px",
              "mono": "Fixedsys (local) → PxPlus IBM VGA 8x16 16px"}

REG_DEFAULT = {
    "shell": "Element = one Program Manager application window: 4px #C0C0C0 sizing border between 1px black lines with corner notches, navy title 'Element – [#room]' centred bold, menu bar 'File Options Window Help' (white, underlined mnemonics); inside a white AppWorkspace; outside the Desktop #C0C0C0",
    "spaces": "moved to a horizontal strip at the bottom of the AppWorkspace: each space = minimized program-group icon (32px avatar in a group-window frame) with label below, selected label inverted navy; Home = 'Main' group",
    "roomlist": "MDI child window 'Rooms' (title bar with short-bar control box, ▼▲): white client, one column of program items — 32px icon (avatar, or icon-room/icon-dm.svg) + label; selected item: label only inverted #000080/#FFFFFF; filters become a File-Manager-like drive bar of small push buttons",
    "header": "the room's MDI child title bar: navy (active) / white with black text (inactive), centred bold room name, control-menu box left, ▼▲ right, no ✕; header buttons become a menu bar 'Room Edit View Call Help' row of flat text items",
    "timeline": "white client area, IRC/WinChat look: '<b>Alice</b>  message', timestamps '[12:03]' in GrayText; no bubbles (bubble layout = white boxes with 1px black border, square); mention = row inverted navy; own messages: sender name navy; date separators = 1px black rule with label",
    "names-avatars": "names in bold black (pure) — decorative-N colours remapped to the 16-colour VGA set (#800000 #008000 #808000 #000080 #800080 #008080); avatars square 32px, 1px black frame, image-rendering pixelated",
    "composer": "single-line white edit field with 1px black border + default push button 'Send' (2px heavy rounded ring); emoji/attach = small push buttons with 16px bitmaps",
    "rightpanel": "third MDI child window ('Members', 'Room Info', 'Threads') with its own title bar; member rows like room items with 16px icons; cards = group boxes (1px frame, label breaking the top line)",
    "buttons": "Win 3.1 push button: #C0C0C0 face, 1px black ring with 1px corner cut, 1px white top/left + 2px #808080 bottom/right; pressed = 1px grey top/left, label +1,+1; primary = default button (heavy 2px ring); destructive = same with #800000 label; no hover",
    "inputs": "flat white field, 1px black border (no sunken well), black caret; check boxes with X, round option buttons, combo arrow button abutting the field",
    "dialogs": "modal: 1px black line + 4px inner border in ActiveTitle navy, navy title bar with control box only, white client; buttons stacked at the right edge (OK, Cancel, Help), 75×23",
    "menus": "white dropdown, 1px black border, no shadow, System-bold items, highlighted item inverted navy, separators 1px black; tooltips = white box 1px black (Win 3.1 had none — 'status-bar hint' look)",
    "settings": "User Settings = Control Panel window: tabs become a left column of 32px Control Panel icons with labels (selected label inverted), panel = white dialog client with group boxes",
    "auth": "Desktop #C0C0C0 with a centred modal 'Welcome to Element' / 'Connect to Server' dialog in the Win 3.1 Setup style; server picker = combo box",
    "scrollbars": "17px: 1px black outline, flat #C0C0C0 shaft, raised 17×17 arrow buttons with stemmed black arrows, fixed-size square thumb (::-webkit-scrollbar + scrollbar-color fallback)",
    "focus": "dotted 1px black rectangle around the label (outline: 1px dotted #000; offset 1px), always visible on :focus-visible",
    "badges": "unread count as '(3)' text after the room name in bold; mention count inverted navy box; dot = 6×6 black square",
    "code": "Fixedsys look: PxPlus IBM VGA 8x16, white background, 1px black border; hljs mapped to VGA colours (keywords #000080, strings #800000, comments #808080, numbers #008080)",
    "iframes": "base light; framed as an MDI child 'Video Call' with title bar; content unchanged",
    "icons": "Compound icons recoloured black, 16px, shape-rendering crisp; key icons swapped via mask to pixel bitmaps (room, DM, space group, hourglass spinner)",
    "motion": "none: no transitions (repaint like 1992); spinner = hourglass bitmap; window open = optional 4-frame XOR outline 'zoom' (enhancer, off under reduced motion)",
}

def regions(base, **over):
    r = dict(base); r.update(over); return r

SIG_DEFAULT = [
    "Flat navy title bars with centred bold System-font title, short/long-bar control-menu box left and ▼ ▲ triangle buttons right — no ✕ anywhere",
    "Thick #C0C0C0 sizing border between 1px black lines with resize notches; everything else 1px black and square",
    "Spaces as minimized program-group icons along the bottom of a white AppWorkspace; rooms as 32px program items",
    "Push buttons with the 1px-white / 2px-grey asymmetric bevel and a cut corner pixel; dotted focus rectangle around the label",
    "Aliased pixel MS Sans Serif lookalike, underlined mnemonics in menu bars, selection inverted navy",
]

variants = []

variants.append(dict(
    id="win311-default", name="Windows 3.11 · Windows Default", stage="pure", mode="light", seriousness=8, hype=4,
    tagline="Program Manager, 1993: navy title bars, white MDI windows, ▼▲ and no close button.",
    palette=P_DEFAULT, phases=None, fonts=FONTS_PURE,
    shape={"radius": "0 (push buttons: 1px corner cut)", "border": "bevel", "shadow": "none", "density": "compact"},
    texture="none (Desktop #C0C0C0 flat; optional 'Boxes' 8×8 pattern)",
    motion="none — instant repaint; hourglass spinner",
    signature=SIG_DEFAULT, regions=REG_DEFAULT, difficulty="hard",
    enhancer="adds the application frame (title bar 'Element – [#room]', menu bar), MDI title bars over room list / room / right panel, wires ▼ (collapse panel) ▲ (maximise room) and control-menu box (opens room context menu; double-click = leave dialog), sets the window title text from the room name",
))

variants.append(dict(
    id="win311-usable", name="Windows 3.11 · Usable", stage="usable", mode="light", seriousness=8, hype=3,
    tagline="The same Program Manager — but you can actually chat in it all day.",
    palette=pal("#FFFFFF", "#FFFFFF", "#FFFFFF", "#C0C0C0", "#000000", "#595959", "#000080", "#FFFFFF",
                "#000000", "#C0C0C0", "#FFFFFF", "#800000", "#008000"),
    phases=None,
    fonts={"ui": "W95FA 16px (follows Element font size in 16px steps; falls back to system-ui above 24px)",
           "display": "Pixel Operator Bold 16px", "mono": "PxPlus IBM VGA 8x16 16px"},
    shape={"radius": "0 (push buttons: 1px corner cut)", "border": "bevel", "shadow": "none", "density": "normal"},
    texture="none",
    motion="minimal: 100ms colour transitions on hover only; none under reduced motion",
    signature=["Win 3.1 chrome (navy titles, ▼▲, bevel buttons) kept intact",
               "Comfortable 36px room rows with 24px avatars, hover = dithered grey (the era's 50% pattern)",
               "CTL3D-style sunken edit fields (3.11-era Office look) for clearer input affordance",
               "Proportional scroll thumb and 15px scrollbars; all Element affordances (threads, E2EE shields, receipts) visible",
               "Own messages on a #C0C0C0 'button face' panel, others on white; muted text #595959 for AA contrast"],
    regions=regions(REG_DEFAULT,
        shell="Program Manager frame kept, but thinner (2px border) and without the outer desktop margin; menu bar row optional (hidden by default)",
        spaces="standard vertical space panel kept (better for many spaces), styled as a #C0C0C0 toolbar of 32px group icons with tooltips",
        roomlist="MDI 'Rooms' window, 36px rows: 24px avatar + name + preview line, unread '(3)' and Compound badges; hover = 50% dither, selected = navy inverted full row",
        header="navy MDI title bar for the room name + a #C0C0C0 toolbar row with the normal header buttons as raised push buttons with icons",
        timeline="Element group/IRC/bubble layouts respected; bubbles = square white/grey boxes with 1px black border; own = #C0C0C0 panel; timestamps always visible",
        composer="CTL3D sunken edit field (2px grey/white inset), formatting bar as push buttons, 'Send' default button",
        inputs="CTL3D sunken (1px #808080 + 1px black top/left, 1px white bottom/right); clear focus",
        scrollbars="15px, raised arrows, proportional thumb, dithered shaft",
        focus="2px dotted black outline + 1px navy outline-offset (visible on any background)",
        motion="hover transitions 100ms, everything else instant; reduced motion disables all"),
    difficulty="medium",
    enhancer="optional: MDI title bars (no window management), room name in the title; can be disabled to stay pure-CSS",
))

variants.append(dict(
    id="win311-hotdog", name="Windows 3.11 · Hot Dog Stand", stage="exciting", mode="light", seriousness=2, hype=9,
    tagline="Red windows, yellow desktop, black title bars. Microsoft shipped this. On purpose.",
    palette=pal("#FFFF00", "#FF0000", "#FF0000", "#FFFF00", "#FFFFFF", "#FFFF00", "#000000", "#FFFFFF",
                "#000000", "#FF0000", "#FF0000", "#FFFF00", "#00FF00"),
    phases=None, fonts=FONTS_PURE,
    shape={"radius": "0", "border": "bevel", "shadow": "none", "density": "compact"},
    texture="yellow Desktop/AppWorkspace, optional red/yellow 50% dither on hover",
    motion="none in chrome; optional 'mustard squirt' wobble on new mentions (off under reduced motion)",
    signature=["Exact Hot Dog Stand values from CONTROL.INI: Desktop/AppWorkspace #FFFF00, Window #FF0000 with white text, ActiveTitle #000000, borders #FF0000",
               "Menus stay white with black text (the scheme's one mercy) and selection is black/white",
               "Buttons and scrollbars stay silver #C0C0C0 — the scheme leaves them alone",
               "Inactive title bars red with white text, so every MDI window screams",
               "Group icons repainted ketchup/mustard"],
    regions=regions(REG_DEFAULT,
        shell="Program Manager frame with #FF0000 sizing border, #000000 title bar, yellow #FFFF00 AppWorkspace and Desktop",
        roomlist="'Rooms' window: red client, white labels, selected label inverted black/white",
        timeline="red client, white text; mentions = yellow row with black text; timestamps yellow",
        names_avatars=None,
        badges="'(3)' in yellow bold; mention box black with white text",
        code="black code block with yellow text (PxPlus) — the only calm place"),
    difficulty="medium",
    enhancer="same as win311-default (shared MDI enhancer)",
))
variants[-1]["regions"].pop("names_avatars")
variants[-1]["regions"]["names-avatars"] = "names white bold (decorative colours collapse to white/yellow/black — the scheme has no room for more); avatars framed 1px black"

variants.append(dict(
    id="win311-leather", name="Windows 3.11 · Black Leather Jacket", stage="pure", mode="dark", seriousness=7, hype=5,
    tagline="The 1992 goth scheme: black desktop, purple title bars, grey menus — with the windows turned dark too.",
    palette=P_LEATHER, phases=None, fonts=FONTS_PURE,
    shape={"radius": "0", "border": "bevel", "shadow": "none", "density": "compact"},
    texture="Scrollbar shaft = dithered #E0E0E0 (the scheme's real 0x10E0E0E0 value)",
    motion="none",
    signature=["Black Leather Jacket chrome verbatim: Desktop #000000, AppWorkspace #C0C0C0, Menu #C0C0C0, ActiveTitle #400080, InactiveTitle #808080, borders #808080, Hilight #000000",
               "Deliberate deviation for a usable dark mode: Window #000000 / WindowText #FFFFFF (the original keeps white windows; documented)",
               "Silver push buttons and grey menus floating on black — high-contrast 1-bit feel",
               "Purple title bars with centred white System-bold titles, ▼▲, no ✕",
               "Selection inverted to white-on-black inside grey menus"],
    regions=regions(REG_DEFAULT,
        shell="Program Manager frame on a black Desktop, #808080 sizing borders, #400080 title, #C0C0C0 AppWorkspace",
        spaces="minimized group icons on the grey AppWorkspace strip, labels black, selected label inverted black/white",
        roomlist="'Rooms' MDI window with black client, white labels; selected = label inverted white/black",
        header="#400080 active title bar, #808080 inactive with black text; menu bar #C0C0C0",
        timeline="black client, white text, timestamps #C0C0C0; mention row inverted white/black; own sender name #C0C0C0",
        **{"names-avatars": "decorative colours: bright VGA set (#FF0000 #00FF00 #FFFF00 #00FFFF #FF00FF #C0C0C0) on black"},
        composer="black edit field with 1px #C0C0C0 border, white text; 'Send' silver default button",
        inputs="black field, 1px #C0C0C0 border, white text",
        dialogs="modal frame with #400080 inner border, black client, silver buttons",
        menus="#C0C0C0 menus (scheme Menu colour), black text, selected item black with white text",
        code="black block, 1px #808080 border, hljs on bright VGA colours",
        iframes="base dark",
        scrollbars="dithered #E0E0E0 shaft, silver arrows/thumb, black outline"),
    difficulty="medium",
    enhancer="same MDI enhancer",
))

variants.append(dict(
    id="win311-daylight", name="Windows 3.11 · Control Panel Clock", stage="pure", mode="daylight", seriousness=7, hype=5,
    tagline="Someone keeps changing the colour scheme: Ocean at dawn, Windows Default by day, Plasma Power Saver at dusk, Black Leather Jacket at night.",
    palette=P_DEFAULT,
    phases={"dawn": P_OCEAN, "day": P_DEFAULT, "dusk": P_PLASMA, "night": P_LEATHER},
    schedule=[{"from": "06:00", "phase": "dawn", "base": "light"},
              {"from": "09:00", "phase": "day", "base": "light"},
              {"from": "18:00", "phase": "dusk", "base": "dark"},
              {"from": "21:00", "phase": "night", "base": "dark"}],
    fonts=FONTS_PURE,
    shape={"radius": "0", "border": "bevel", "shadow": "none", "density": "compact"},
    texture="none; Plasma phase uses the scheme's blue #0000FF scrollbar shaft and magenta menus",
    motion="phase switch is instant (as if Control Panel ▸ Color ▸ OK was pressed); reduced motion irrelevant",
    signature=["Four shipped schemes from CONTROL.INI, switched by local time",
               "Dawn = Ocean (teal desktop #008080, green workspace #008040, title #004080)",
               "Dusk = Plasma Power Saver (black windows, blue workspace, magenta menus) — title text forced white instead of the scheme's black for legibility (documented deviation)",
               "Night = win311-leather palette (dark windows)",
               "Optional enhancer shows a tiny Clock.exe icon in the bottom strip with the next scheme change"],
    regions=regions(REG_DEFAULT,
        shell="Program Manager frame; Desktop/AppWorkspace/ActiveTitle/borders follow the active scheme",
        timeline="client colours follow Window/WindowText of the phase (white/black dawn+day, black/white dusk+night)",
        iframes="base light for dawn/day, dark for dusk/night"),
    difficulty="medium",
    enhancer="MDI enhancer + optional Clock icon showing current scheme and next switch time",
))

variants.append(dict(
    id="win311-2030", name="Windows 3.11 · 2030 Edition", stage="future", mode="light", seriousness=6, hype=7,
    tagline="Windows 3.11 if it had never died: the same bevels and ▼▲, now high-DPI, frosted and gently animated.",
    palette=pal("#ECEEF6", "#FFFFFF", "#F4F5FA", "#14146E", "#0A0A1E", "#55576E", "#2B2BE6", "#FFFFFF",
                "#0A0A1E", "#E3E6FF", "#FFFFFF", "#D4002A", "#00875A"),
    phases=None,
    fonts={"ui": "Pixelify Sans 400 15/16px (high-DPI pixel grotesk) → W95FA",
           "display": "Pixelify Sans 700 — centred title bars", "mono": "PxPlus IBM VGA 8x16"},
    shape={"radius": "0 (still square — the cut-corner button stays)", "border": "bevel",
           "shadow": "0 12px 32px rgba(20,20,110,.18) under MDI windows; bevels at 2× (2px white / 4px shadow) on HiDPI",
           "density": "airy"},
    texture="Desktop: deep navy #14146E with a soft teal radial glow and the 8×8 'Boxes' pattern at 4% opacity; MDI title bars frosted (backdrop-filter blur 16px over a #2B2BE6 → #14146E gradient)",
    motion="windows 'restore' with a 160ms scale+fade; title bar shimmer on new messages; all off under reduced motion",
    signature=["Translucent frosted navy title bars, still centred, still ▼▲ with no ✕",
               "Bevel grammar kept but crisp at 2× device pixels; cut-corner push buttons",
               "Program-group icons redrawn as 48px glossy-pixel tiles; spaces strip floats like a dock at the bottom",
               "Electric-navy #2B2BE6 accent with soft shadows under every MDI window",
               "Pixelify Sans: pixel DNA but smooth at every size"],
    regions=regions(REG_DEFAULT,
        shell="floating Program Manager window with 16px margin over the navy glowing Desktop, 2px bevel border, large soft shadow",
        spaces="dock-like strip of 48px group tiles at the bottom with hover lift (2px) and labels",
        roomlist="frosted MDI 'Rooms' window, 40px rows with 28px square avatars, selected = accent pill-less full row #2B2BE6",
        header="frosted gradient title bar with room name + avatar, toolbar of square bevel icon buttons",
        timeline="white client, group layout with name/time on one line; bubbles = square cards, own #E3E6FF",
        dialogs="modal floats with 24px backdrop blur, navy frosted title, bevel buttons",
        menus="white menus with 1px #0A0A1E border and 8px soft shadow, hover inverted accent",
        motion="160ms window/restore animations, title shimmer; none under reduced motion",
        focus="2px solid #2B2BE6 + 1px dotted black inside"),
    difficulty="hard",
    enhancer="MDI enhancer + desktop glow layer + shimmer on unread",
))

variants.append(dict(
    id="win311-cyberpunk", name="Windows 3.11 · VGA Night City", stage="cyberpunk", mode="dark", seriousness=3, hype=9,
    tagline="16 colours, a CRT and a DOS prompt: Program Manager hacked into neon.",
    palette=pal("#000000", "#000000", "#000080", "#000000", "#C0C0C0", "#808080", "#FF00FF", "#000000",
                "#00FFFF", "#000080", "#000000", "#FF0000", "#00FF00"),
    phases=None,
    fonts={"ui": "PxPlus IBM VGA 8x16 16px", "display": "PxPlus IBM VGA 8x16 (title bars, upper-case)",
           "mono": "PxPlus IBM VGA 8x16"},
    shape={"radius": "0", "border": "glow", "shadow": "0 0 6px currentColor on title bars and focused items only",
           "density": "compact"},
    texture="CRT scanlines (2px, 20% black) + slight vignette as one fixed overlay; no per-tile filters",
    motion="block cursor blink 530ms (Win 3.1 CursorBlinkRate), title glitch every ~20s; all off under reduced motion",
    signature=["Only the 16 VGA colours: magenta title bars, cyan 1px frames, Norton-Commander-blue room list",
               "DOS prompt composer: 'C:\\ELEMENT\\#ROOM>' prefix with a blinking block caret",
               "▼▲ buttons and control box kept, drawn as cyan outline glyphs",
               "CRT scanline + vignette overlay on the shell",
               "Box-drawing characters (╔═╗) as frame decorations in headers and dialogs"],
    regions=regions(REG_DEFAULT,
        shell="black desktop with scanline overlay; Program Manager frame as double cyan box-drawing border, magenta title bar",
        spaces="bottom strip of neon group icons (icon-group-neon.svg), labels cyan, selected inverted magenta",
        roomlist="#000080 blue panel (Norton Commander), cyan text, selected row cyan bar with black text",
        header="magenta title bar, black upper-case text, ▼▲ in cyan outline",
        timeline="black, light grey text, names in bright VGA colours, timestamps #808080 '[12:03]'; mention row magenta",
        **{"names-avatars": "bright VGA set (#FF00FF #00FFFF #00FF00 #FFFF00 #FF0000 #FFFFFF); avatars posterised + cyan 1px frame"},
        composer="DOS prompt line: black, '#00FF00' prompt prefix, block caret; Send = '[ENTER]' text button",
        buttons="black with 1px cyan border, cyan text; hover/active inverted cyan/black; primary magenta",
        inputs="black, 1px cyan border, green text",
        dialogs="#000080 dialog with double cyan box border, magenta title (Norton Commander dialogs)",
        menus="#000080 menus, cyan text, selection cyan bar",
        scrollbars="black shaft with ░ pattern in #000080, cyan arrows, magenta thumb",
        focus="inverted cyan/black + 1px dotted #FFFF00",
        badges="magenta block with black digits",
        code="black block, green text PxPlus, hljs bright VGA",
        iframes="base dark",
        motion="530ms block caret blink, occasional title glitch; disabled under reduced motion"),
    difficulty="hard",
    enhancer="MDI enhancer + scanline overlay + DOS prompt prefix element before the composer + glitch timer",
))

guide = {
    "family": "win311",
    "name": "Windows 3.11",
    "concept": ("Element as Windows for Workgroups 3.11: one Program Manager application window with MDI child windows for the room list, "
                "the room and the right panel, spaces as minimized program-group icons, and the verified 1992 colour schemes. "
                "The pure stages (Windows Default, Black Leather Jacket, the clock-driven scheme switcher) reproduce the shipped CONTROL.INI "
                "values and the VGA bevel grammar; 'usable' keeps the look but restores modern density and affordances; Hot Dog Stand, "
                "the 2030 edition and VGA Night City push towards hype."),
    "sources": SOURCES,
    "limits": LIMITS,
    "variants": variants,
}
with open(f"{ROOT}/docs/styleguides/win311.json", "w") as f:
    json.dump(guide, f, indent=2, ensure_ascii=False)
    f.write("\n")

# ---------------- manifest -----------------------------------------------------------------------------------
FONT_FILES = {
    "pure": [
        {"family": "W95FA", "file": "assets/w95fa.woff2", "weight": "400", "style": "normal"},
        {"family": "Pixel Operator", "file": "assets/pixel-operator.woff2", "weight": "400", "style": "normal"},
        {"family": "Pixel Operator", "file": "assets/pixel-operator-bold.woff2", "weight": "700", "style": "normal"},
        {"family": "PxPlus IBM VGA 8x16", "file": "assets/pxplus-ibm-vga-8x16.woff2", "weight": "400", "style": "normal"},
    ],
}
F2030 = [{"family": "Pixelify Sans", "file": "assets/pixelify-sans-400.woff2", "weight": "400", "style": "normal"},
         {"family": "Pixelify Sans", "file": "assets/pixelify-sans-700.woff2", "weight": "700", "style": "normal"}] + FONT_FILES["pure"]
FCYBER = [FONT_FILES["pure"][3], FONT_FILES["pure"][2]]

def tokens(p, light=True):
    return {
        "--cpd-color-bg-canvas-default": p["surface"],
        "--cpd-color-bg-subtle-secondary": p["sidebar"],
        "--cpd-color-bg-subtle-primary": p["rail"],
        "--cpd-color-bg-action-primary-rest": p["accent"],
        "--cpd-color-bg-accent-rest": p["accent"],
        "--cpd-color-bg-critical-primary": p["critical"],
        "--cpd-color-text-primary": p["text"],
        "--cpd-color-text-secondary": p["muted"],
        "--cpd-color-text-action-accent": p["accent"] if light else p["text"],
        "--cpd-color-text-on-solid-primary": p["onAccent"],
        "--cpd-color-text-critical-primary": p["critical"],
        "--cpd-color-text-success-primary": p["success"],
        "--cpd-color-icon-primary": p["text"],
        "--cpd-color-icon-secondary": p["muted"],
        "--cpd-color-border-interactive-primary": p["border"],
        "--cpd-color-border-focused": p["text"],
    }

def v(id, name, stage, mode, base, s, h, desc, css, fonts, tok, schedule=None):
    return {"id": id, "name": name, "stage": stage, "mode": mode, "base": base, "seriousness": s, "hype": h,
            "description": desc, "css": css, "fonts": fonts, "tokens": tok, "enhance": True, "schedule": schedule}

gv = {x["id"]: x for x in variants}
manifest = {"family": "win311", "name": "Windows 3.11", "variants": [
    v("win311-default", gv["win311-default"]["name"], "pure", "light", "light", 8, 4,
      "Windows for Workgroups 3.11 with the out-of-box 'Windows Default' scheme (verified in PCjs): Program Manager frame, MDI windows, navy title bars, ▼▲ and no close button, spaces as program-group icons.",
      ["shared.css", "win311-default.css"], FONT_FILES["pure"], tokens(gv["win311-default"]["palette"])),
    v("win311-usable", gv["win311-usable"]["name"], "usable", "light", "light", 8, 3,
      "Windows 3.11 look tuned for all-day chat: comfortable rows, CTL3D inputs, proportional scrollbars, AA contrast, all Element affordances.",
      ["shared.css", "win311-usable.css"], FONT_FILES["pure"], tokens(gv["win311-usable"]["palette"])),
    v("win311-hotdog", gv["win311-hotdog"]["name"], "exciting", "light", "light", 2, 9,
      "The exact Hot Dog Stand scheme: yellow desktop, red windows with white text, black title bars. Unapologetic; white-on-red text is only 4:1.",
      ["shared.css", "win311-hotdog.css"], FONT_FILES["pure"], tokens(gv["win311-hotdog"]["palette"])),
    v("win311-leather", gv["win311-leather"]["name"], "pure", "dark", "dark", 7, 5,
      "Black Leather Jacket chrome (black desktop, #400080 titles, grey menus) with dark windows as the family's dark mode.",
      ["shared.css", "win311-leather.css"], FONT_FILES["pure"], tokens(gv["win311-leather"]["palette"], light=False)),
    v("win311-daylight", gv["win311-daylight"]["name"], "pure", "daylight", "light", 7, 5,
      "Shipped colour schemes by local time: Ocean (06–09), Windows Default (09–18), Plasma Power Saver (18–21), Black Leather Jacket (21–06).",
      ["shared.css", "win311-daylight.css"], FONT_FILES["pure"], tokens(gv["win311-daylight"]["palette"]),
      schedule=gv["win311-daylight"]["schedule"]),
    v("win311-2030", gv["win311-2030"]["name"], "future", "light", "light", 6, 7,
      "Windows 3.11 that never died: same bevels and ▼▲, high-DPI pixel type, frosted navy title bars, a dock of program groups.",
      ["shared.css", "win311-2030.css"], F2030, tokens(gv["win311-2030"]["palette"])),
    v("win311-cyberpunk", gv["win311-cyberpunk"]["name"], "cyberpunk", "dark", "dark", 3, 9,
      "16-colour VGA neon: magenta titles, cyan frames, Norton-blue room list, CRT scanlines and a DOS-prompt composer.",
      ["shared.css", "win311-cyberpunk.css"], FCYBER, tokens(gv["win311-cyberpunk"]["palette"], light=False)),
]}
# daylight: schedule lives in manifest; json guide keeps phases + schedule
with open(f"{ROOT}/themes/win311/themes.json", "w") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
    f.write("\n")
print("ok")
