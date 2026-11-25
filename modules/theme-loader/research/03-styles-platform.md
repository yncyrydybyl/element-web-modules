# 03 — Platform / UI-system styles: research dossier

Status: research, 2026-11-15. Scope: Microsoft Teams (several eras), Windows 3.11, KDE Plasma 6 / Breeze (plus Oxygen and "Ocean"), LCARS.
Internal project, so real branding is fine. **Licensing still matters for code and fonts we ship in the theme bundle.** Each section says what can be redistributed and what is reference-only.

How sure each value is:
- **[V]** verified in this session from a primary or authoritative source: the package source, the upstream repo file, or the Microsoft KB.
- **[C]** community source, believed accurate.
- **[M]** from memory or inferred. Check against screenshots or an emulator before relying on it.

---

## 0. Cross-cutting: how these map onto Element Web

Element Web gives us three levels of control:

1. **`custom_themes` in `config.json`.** This only sets about 15 colors: `accent-color`, `primary-color`, `warning-color`, `sidebar-color`, `roomlist-background-color`, `roomlist-text-color`, `roomlist-text-secondary-color`, `roomlist-highlights-color`, `roomlist-separator-color`, `timeline-background-color`, `timeline-text-color`, `timeline-text-secondary-color`, `timeline-highlights-color`, `username-colors[]` and `avatar-background-colors[]`, plus `fonts.faces` and `fonts.general`. That is enough for Breeze and the Teams colors. It is not enough for Win 3.11 bevels or LCARS elbows.
2. **Compound design-token overrides** (`--cpd-color-*`, `--cpd-font-*`, `--cpd-space-*`) set on `:root`/`.cpd-theme-*`. These recolor most new components in one go.
3. **Injected CSS** through our loader, targeting `mx_*` classes. That gives full structural restyling. The anchors we will use most:
   - spaces bar: `.mx_SpacePanel`
   - room list: `.mx_LeftPanel`, `.mx_RoomListPanel` / `.mx_RoomList`, `.mx_RoomTile` / room list item
   - header: `.mx_RoomHeader`
   - timeline: `.mx_RoomView_body`, `.mx_EventTile`, `.mx_EventTile_line`
   - composer: `.mx_MessageComposer`, `.mx_BasicMessageComposer`
   - right panel: `.mx_RightPanel`
   - dialogs: `.mx_Dialog`, `.mx_Dialog_title`, `.mx_Dialog_buttons`
   - context menus: `.mx_ContextualMenu`
   - buttons: `.mx_AccessibleButton_kind_primary`
   - user menu: `.mx_UserMenu`

The table below gives each style's anatomy. Rows: SpacePanel, room list, header, timeline, composer, dialogs.

| Element region | Teams | Win 3.11 | Breeze | LCARS |
|---|---|---|---|---|
| SpacePanel (far left) | App bar (Activity / Chat / Teams / Calendar / Calls / Apps) | Program Manager group icons, or minimized-window icons | Plasma panel / Kirigami sidebar | Left vertical frame of colored "buttons" with numbers |
| Room list | Chat list (avatar, name, preview, time) | MDI child window "Group" containing a list box | Kirigami sidebar list, highlight with accent | Stack of pill buttons, alternating colors |
| Room header | Chat header with name + tabs (Chat / Shared / +) and call buttons | Title bar (navy) + menu bar (File Edit View…) | Header area (`Colors:Header`) with tool buttons | Top elbow + horizontal bar with room name in caps, right aligned |
| Timeline | Message cards: others white-ish, own messages brand-tinted | White list-box / Notepad-like area, monospace option | View color `#fff` / `#141618`, alternating rows | Black field, colored text blocks, data-cascade decoration |
| Composer | Rounded box with formatting toolbar, send arrow | Sunken edit field + "Send" push button, 3D bevel | Frame radius 5 px, focus ring accent | Bottom elbow + input as a black slot inside a bar |
| Dialogs | Fluent Dialog, radius 8, shadow64 | Modal dialog with control-menu box, OK/Cancel push buttons | Breeze dialog, radius 5, soft shadow | Full-screen overlay panel with "ACKNOWLEDGE" pill buttons |

---

## 1. Microsoft Teams

### 1.1 Era overview

| Era | Visual system | Brand anchor | Font | Signature |
|---|---|---|---|---|
| (c) Classic, 2017–2021 (look ~2019–2022) | Fluent UI **Northstar** ("Stardust") Teams theme | **#6264A7** | Segoe UI | Purple top bar `#464775`, dark left rail, grey canvas `#F3F2F1` |
| (b) "New Teams" 2.0, 2023–2024 | **Fluent 2** (`@fluentui/react-components` v9), `teamsLightTheme` | **#5B5FC7** (brandTeams 80) | Segoe UI / Segoe UI Variable (Win11) | White canvas, Mica background, purple only for actions, light app bar |
| (a) Late 2026 (current) | Fluent 2 + **`teamsLightV21Theme` / `teamsDarkV21Theme`** brand ramp (new in `@fluentui/tokens`), user-selectable **accent colors** (MC1115312, 2025), meeting UI redesign (July–Aug 2026) | **#654CF5** (brandTeamsV21 80), more violet and saturated | Segoe UI Variable, `system-ui` stack | Accent-color personalisation, centered meeting toolbar, Copilot entry points everywhere |

The V21 brand ramp ships in `@fluentui/tokens@1.0.0-alpha.24` as `brandTeamsV21` and the themes `teamsLightV21Theme` / `teamsDarkV21Theme` [V]. It matches the newer Microsoft 365 look: more vibrant, with gradient icons from the October 2025 icon refresh. Before calling it final, compare against a live Teams screenshot from November 2026 [M].

### 1.2 Palettes

**Fluent 2 `brandTeams` (2023–24)** [V] (source: `@fluentui/tokens/lib/global/brandColors.js`):

```
10 #2b2b40  20 #2f2f4a  30 #333357  40 #383966  50 #3d3e78  60 #444791
70 #4f52b2  80 #5b5fc7  90 #7579eb 100 #7f85f5 110 #9299f7 120 #aab1fa
130 #b6bcfa 140 #c5cbfa 150 #dce0fa 160 #e8ebfa
```

**Fluent 2 `brandTeamsV21` (current / late 2026)** [V]:

```
10 #29274f  20 #2f2a5e  30 #352e70  40 #3b3185  50 #44359e  60 #4d3aba
70 #5a40db  80 #654cf5  90 #7769fa 100 #887dff 110 #9791ff 120 #aba8ff
130 #bab8ff 140 #c8c7ff 150 #dcdbff 160 #e8e8ff
```

**Classic Teams (Northstar ≤0.47) brand** [V] (source: `@fluentui/react-northstar@0.47.0/dist/es/themes/teams/colors.js`):

```
50 #F4F4FC 100 #E5E5F1 200 #E2E2F6 300 #BDBDE6 400 #A6A7DC 450 #9EA2FF
500 #8B8CC7 600 #6264A7 (brand) 700 #585A96 800 #464775 900 #33344A 1000 #373644
```

Northstar 0.71 (2021+) moved the brand to the Fluent 2 ramp (`600 #5b5fc7`). So **#6264A7 means classic Teams and #5B5FC7 means 2021 onwards**.

**Classic neutrals (Northstar grey)** [V]:
`0 #FFFFFF · 25 #FCFCFB · 50 #FAF9F8 · 100 #F3F2F1 · 150 #EDEBE9 · 200 #E1DFDD · 250 #C8C6C4 · 300 #B3B0AD · 400 #8A8886 · 450 #605E5C · 500 #484644 · 550 #3B3A39 · 600 #323131 · 650 #2D2C2C · 700 #292828 · 750 #252423`. Classic dark theme canvas ≈ `#201F1F` / `#2D2C2C` [M].

**Fluent 2 neutral alias tokens (Teams light / Teams dark)** [V] (from `alias/lightColor.js` and `alias/teamsDarkColor.js`; the `grey[n]` scale is about n% lightness):

| Token | Teams light | Teams dark |
|---|---|---|
| colorNeutralBackground1 (canvas, cards) | `#ffffff` | `#292929` (grey16) |
| colorNeutralBackground2 | `#fafafa` | `#242424` |
| colorNeutralBackground3 (app chrome) | `#f5f5f5` | `#1f1f1f` |
| colorNeutralBackground4 | `#f0f0f0` | `#141414` |
| colorNeutralBackground5 | `#ebebeb` | `#0a0a0a` |
| colorNeutralBackground6 | `#e6e6e6` | `#333333` |
| colorNeutralBackground1Hover / SubtleHover | `#f5f5f5` | `#3d3d3d` / `#383838` |
| colorNeutralForeground1 | `#242424` | `#ffffff` |
| colorNeutralForeground2 | `#424242` | `#d6d6d6` |
| colorNeutralForeground3 | `#616161` | `#adadad` |
| colorNeutralForeground4 | `#707070` | `#999999` |
| colorNeutralStroke1 / 2 | `#d1d1d1` / `#e0e0e0` | `#666666` / `#525252` |
| colorBrandBackground | brand80 | brand70 |
| colorBrandBackground2 (own-message tint) | brand160 | brand20 |
| colorBrandForeground1 / Link | brand80 / brand70 | brand100 / brand100 |
| shadow ambient / key | `rgba(0,0,0,.12)` / `rgba(0,0,0,.14)` | `.24` / `.28` |

Status colors: Teams presence uses Available `#6BB700` (Fluent 2: `#13A10E`), Busy `#C4314B` (Fluent 2: `#D13438`), Away `#FFAA44` (Fluent 2: `#F8D22A`/`#FFAA44`), and Offline grey ring [M].

### 1.3 Type, radius, elevation (Fluent 2 globals) [V]

- **Font stack (Teams theme):** `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`. Windows 11 resolves this to **Segoe UI Variable**. Web theme: `fontFamilyBase: 'Segoe UI', 'Segoe UI Web (West European)', …`.
- **Font licensing:** Segoe UI and Segoe UI Variable are proprietary Microsoft fonts and may not be redistributed. Options:
  - (1) Rely on local fonts. They are present on Windows, which is where Teams users are anyway.
  - (2) Use the Microsoft Fabric CDN `https://static2.sharepointonline.com/files/fabric/assets/fonts/segoeui-westeuropean/segoeui-regular.woff2` (plus `-semibold`, `-bold`, `-semilight`). This is acceptable internally but grey-area for public shipping.
  - (3) Use **Selawik**, Microsoft's open-source, metric-compatible Segoe fallback under **OFL-1.1**: https://github.com/microsoft/Selawik (branch `master`).
- **Type ramp:**

  | Size token | px / line-height |
  |---|---|
  | base100 | 10/14 |
  | base200 (caption) | 12/16 |
  | base300 (body) | 14/20 |
  | base400 | 16/22 |
  | base500 | 20/28 |
  | base600 | 24/32 |
  | hero700 | 28/36 |
  | hero800 | 32/40 |
  | hero900 | 40/52 |
  | hero1000 | 68/92 |

  Weights: 400 / 500 / 600 / 700. Teams uses **Semibold 600** for names and titles, and body is 14/20.
- **Radii:** Small 2, **Medium 4** (buttons, inputs), Large 6, **XLarge 8** (cards, dialogs, message bubbles), 2XL 12, 3XL 16, 4XL 24, 5XL 32, 6XL 40, Circular.
  - Classic Teams used about 3–4 px on bubbles [M].
  - 2026 Teams leans to 8–12 px on bubbles and composer [M].
- **Shadows** (`createShadowTokens`). Each is `0 0 Apx ambient, 0 Bpx Cpx key`:
  - shadow2 `0 0 2px, 0 1px 2px`
  - shadow4 `0 0 2px, 0 2px 4px`
  - shadow8 `0 0 2px, 0 4px 8px`
  - shadow16 `0 0 2px, 0 8px 16px`
  - shadow28 `0 0 8px, 0 14px 28px`
  - shadow64 `0 0 8px, 0 32px 64px`

  Use shadow4 for message cards, shadow16 for flyouts and menus, and shadow64 for dialogs.
- **Spacing:** 4 px grid (`XS 4, S 8, M 12, L 16, XL 20, XXL 24`). Durations ultraFast 50 / faster 100 / fast 150 / normal 200 / gentle 250 / slow 300 ms. Curve `easyEase cubic-bezier(0.33,0,0.67,1)`.

### 1.4 Icons and logo

- **Fluent UI System Icons**, MIT: https://github.com/microsoft/fluentui-system-icons. npm `@fluentui/svg-icons@1.1.346` [V]. CDN example (verified 200): `https://cdn.jsdelivr.net/npm/@fluentui/svg-icons@1.1.346/icons/chat_24_regular.svg`. Naming is `{name}_{16|20|24|28|32|48}_{regular|filled}`.
  - Teams pattern: **regular** icons in the rail, **filled + brand color** when selected.
  - Useful names: `chat`, `people_team`, `calendar_ltr`, `call`, `alert` (Activity), `apps`, `send`, `emoji`, `attach`, `text_format`, `more_horizontal`, `video`, `mic`, `share_screen_start`, `call_end`, `hand_raise`, `sparkle` (Copilot-ish), `copilot` (if present in the current icon set).
- **Teams logo:** the official product icon is in Microsoft's brand asset pages and the Microsoft 365 icon set. The 2025 redesign has a gradient "T" tile. Wikimedia has `File:Microsoft_Office_Teams_(2025–present).svg` (or similar; search Commons). Trademark: OK for internal use.

### 1.5 Layout anatomy (new Teams 2.x)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Title bar 48px: ← → | [  Search (Ctrl+E)  ] … | ··· | avatar w/ presence│  bg: NeutralBackground3 (Mica on Win11)
├──┬───────────────────┬──────────────────────────────────────────────────┤
│A │ Chat ▾  filter ✎  │ [Avatar] Name  ▸ Chat | Shared | Recap | +  │📹📞│  header 56–64px, tabs w/ 2–3px brand underline
│p │───────────────────│──────────────────────────────────────────────────│
│p │ ▸ Pinned          │            ┌─────────────────────┐               │
│  │ (A) Name     10:42│ (A) Name 10:42                                   │  others: white card, radius 8, shadow2/4
│b │     preview…      │    └ message card ┘                              │
│a │ (B) Group    Tue  │                     ┌──────── own message ──────┐│  own: brand160 (#E8EBFA) right-aligned
│r │                   │                     └───────────────────────────┘│
│68│ 320px list        │ ┌───────────────────────────────────────────────┐│
│px│                   │ │ Type a message            😊 📎 ＋   ➤ (brand)││  composer radius 4–8, bottom brand underline on focus
└──┴───────────────────┴─┴───────────────────────────────────────────────┴┘
```

- **App bar:** 68 px (classic) or about 64–68 px (new). Each item is a 20 px icon over an 10 px label. The selected item has a 3 px **vertical brand pill on the left edge** and a filled brand icon. Classic Teams had the rail bg `#33344A` and top bar `#464775` [M]. The 2021+ light theme uses a light rail (`#EBEBEB`/`#F0F0F0`).
- **Chat list:** 32 px avatars with presence badges (10 px, bottom-right, white ring). Name is Semibold 14 and preview is 12 Foreground3. The selected row is white on the grey list (light) and has radius 4.
- **Timeline:** messages group by sender. Avatar shows only on the first message of a group. Timestamp is on hover. **Reactions** are pill chips under the bubble. Hovering shows a floating "reaction bar" (👍❤️😆😮😢 + ···) over the top-right of the bubble, with shadow8 and radius 4.
- **Channels:** the 2023+ post-and-reply layout runs top-down, with each post as a card and replies indented under it.
- **Composer:** collapsed single line. Expanding it shows a formatting toolbar (Format A✎ icon). On focus there is a **2 px brand bottom border**, the Fluent input signature.
- **Meeting UI (July 2026 redesign):**
  - **centered** control bar: mic / camera / share grouped; reactions, captions, recording in "More"
  - red **Leave** button pinned far right
  - share opens a preview panel instead of sharing instantly
  - tiles have radius 8 with an active speaker brand ring

### 1.6 Signature moves (Teams)

1. **Purple left-edge pill indicator** plus a filled icon on the selected app-bar item.
2. **Own messages tinted brand160 (`#E8EBFA`)**, aligned right. Others' messages are white cards on a grey canvas.
3. **Hover reaction bar** floating over the message corner.
4. **2 px brand underline** on the focused input and on the selected header tab (Chat | Shared | +).
5. **Presence dots** on every avatar, plus the purple `#5B5FC7` primary button with radius 4 and Semibold text.

### 1.7 Variants

- **Classic Teams (2019):**
  - brand `#6264A7`
  - full-width top bar `#464775` with a centered search box
  - left app bar dark (`#33344A` light theme / `#1F1F1F` dark theme)
  - chat list `#F3F2F1`
  - canvas `#F5F5F5` / white
  - radius 3 px
  - no Mica
  - "Teams" tile grid view
- **New Teams 2024:** brandTeams ramp, white canvas, light rail, Mica, radius 4/8.
- **Late 2026:**
  - brandTeamsV21 ramp (`#654CF5`)
  - user accent override (the accent-color picker gives purple/blue/green/pink/…; map it to Element's `accent-color`)
  - larger avatars and reactions (personal Teams refresh)
  - Copilot button in the chat header and composer
- **Copilot-era look:**
  - **sparkle iconography** with a gradient stroke. Copilot gradient: blue `#2870EA` → teal `#1BC5A9` → purple `#8A3FFC` → pink `#E24AA4` [M]
  - "AI-generated" label chips
  - **Recap** tab
  - summary cards with a subtle iridescent border (`border-image: linear-gradient(...)`)
  - suggestion chips above the composer
  - Fluent 2's `colorBrandBackground` stays for CTAs, while AI surfaces get the gradient
- **"Teams 2028" (speculative):**
  - pushes Fluent's "Fluid / light" direction further: translucent layered surfaces (Mica Alt / Acrylic, `backdrop-filter: blur(30px) saturate(1.4)`)
  - radius 12–16
  - accent derived from the user's wallpaper
  - a conversational agent pane as a first-class column (Element: right panel styled as a "Copilot" pane)
  - variable-font optical sizes (Segoe UI Variable Display for headers)
  - denser AI summary cards replacing unread lists
  - softer, larger shadows (shadow28)

### 1.8 References (Teams)

- Microsoft Design, "Designing the new era of Teams": https://microsoft.design/articles/designing-the-new-era-of-teams/
- Screenshots (from that article) [V]:
  - https://microsoft.design/wp-content/uploads/2024/06/Designing-the-new-era-of-Teams-00001.png (chat + contact list)
  - https://microsoft.design/wp-content/uploads/2024/06/Designing-the-new-era-of-Teams-00002.png (channels post/reply)
  - https://microsoft.design/wp-content/uploads/2024/06/Designing-the-new-era-of-Teams-00005.png (collage: compose, team list, calendar)
  - https://microsoft.design/wp-content/uploads/2024/06/Designing-the-new-era-of-Teams-00009.png (purple header and toggle)
  - https://microsoft.design/wp-content/uploads/2024/06/Designing-the-new-era-of-Teams-00010.png (presenter view)
  - https://microsoft.design/wp-content/uploads/2023/03/Screenshot-2024-10-10-093433.png (old/new peel-back)
- Fluent 2 design site: https://fluent2.microsoft.design/ (color, type, elevation, shapes pages). Fluent 2 Figma "Microsoft Teams UI Kit" in Figma Community (search "Microsoft Teams UI Kit Fluent 2", published by Microsoft).
- Token source: https://github.com/microsoft/fluentui/tree/master/packages/tokens (MIT).
- Accent colors: https://mc.merill.net/message/MC1115312, https://office365itpros.com/2025/07/18/teams-accent-colors/
- 2026 meeting redesign: https://www.neowin.net/news/microsoft-teams-is-getting-a-major-redesign-here-is-a-first-look/, https://windowsreport.com/microsoft-teams-is-getting-a-major-meetings-redesign-with-a-cleaner-interface/
- Classic Northstar theme: https://unpkg.com/@fluentui/react-northstar@0.47.0/dist/es/themes/teams/colors.js

### 1.9 Code to reuse

- `@fluentui/tokens` (MIT). Copy the token values into CSS variables. Runtime is not needed.
- `@fluentui/web-components` v3 (MIT) can emit tokens as CSS vars (`setTheme(teamsLightTheme)`). This is overkill: a static `:root{}` block is enough.
- `@fluentui/svg-icons` (MIT) for icons, swapped in through CSS `mask-image` on Element's icon classes.

---

## 2. Windows 3.11 (Windows for Workgroups 3.11)

### 2.1 System colors — exact scheme values [V]

Source: Microsoft KB 102976, "REG: User Preferences Entries" (NT 3.1 shipped the same scheme set as Windows 3.1's `CONTROL.INI [color schemes]`): https://ftp.zx.net.nz/pub/Patches/ftp.microsoft.com/MISC/KB/en-us/102/976.HTM

The raw values are **BGR hex (0x00BBGGRR)** in this element order: Desktop, AppWorkspace, Window, WindowText, Menu, MenuText, ActiveTitle, InactiveTitle, TitleText, ActiveBorder, InactiveBorder, WindowFrame, Scrollbar, ButtonFace, ButtonShadow, ButtonText, GrayText, Hilight, HilightText, InactiveTitleText, ButtonHilight. The tables below are converted to RGB. The conversion was cross-checked against an independent Hotdog Stand per-element list, which matches 21/21.

NT 3.1 registry defaults [V] are:

| ActiveTitle | InactiveTitle | Window / Menu / AppWorkspace | ButtonFace | Hilight |
|---|---|---|---|---|
| 0 0 128 | 192 192 192 | white | 192 192 192 | 0 0 128 |

The Win 3.1 **"Windows Default"** column below is [M]: it has a **white** inactive title bar and a grey desktop. Verify it in the PCjs Windows 3.1 emulator (https://www.pcjs.org/software/pcx86/sys/windows/3.10/).

| Element | Windows Default [M] | Arizona | Black Leather Jacket | Bordeaux | Cinnamon | Designer | Emerald City |
|---|---|---|---|---|---|---|---|
| Desktop | #C0C0C0 | #004080 | #000000 | #800040 | #804040 | #3F7C7C | #004040 |
| AppWorkspace | #FFFFFF | #FFFFFF | #C0C0C0 | #C0C0C0 | #C0C0C0 | #C0C0C0 | #C0C0C0 |
| Window | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF |
| WindowText | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 |
| Menu | #FFFFFF | #FFFFFF | #C0C0C0 | #FFFFFF | #FFFFFF | #FFFFFF | #C0C0C0 |
| MenuText | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 |
| ActiveTitle | #000080 | #408080 | #400080 | #800080 | #800000 | #008080 | #008040 |
| InactiveTitle | #FFFFFF | #C0C0C0 | #808080 | #C0C0C0 | #C0C0C0 | #C0C0C0 | #408080 |
| TitleText | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF |
| ActiveBorder | #C0C0C0 | #FF8040 | #808080 | #8000FF | #800000 | #C0C0C0 | #008040 |
| InactiveBorder | #C0C0C0 | #C0C0C0 | #808080 | #C0C0C0 | #C0C0C0 | #C0C0C0 | #408080 |
| WindowFrame | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 |
| Scrollbar | #C0C0C0 | #C0C0C0 | #E0E0E0 (dithered) | #C0C0C0 | #C0C0C0 | #C0C0C0 | #C0C0C0 |
| ButtonFace | #C0C0C0 | #C0C0C0 | #C0C0C0 | #C0C0C0 | #C0C0C0 | #C0C0C0 | #C0C0C0 |
| ButtonShadow | #808080 | #808080 | #808080 | #808080 | #808080 | #808080 | #808080 |
| ButtonText | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 |
| GrayText | #808080 | #808080 | #808080 | #808080 | #808080 | #C0C0C0 | #808080 |
| Hilight | #000080 | #008080 | #000000 | #800080 | #800000 | #008080 | #008000 |
| HilightText | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #000000 | #FFFFFF |
| InactiveTitleText | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 |
| ButtonHilight | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF |

| Element | Fluorescent | **Hotdog Stand** | Ocean | Plasma Power Saver | The Blues | Valentine | Mahogany |
|---|---|---|---|---|---|---|---|
| Desktop | #000000 | #FFFF00 | #008080 | #000000 | #004080 | #FF80C0 | #404040 |
| AppWorkspace | #FFFFFF | #FFFF00 | #008040 | #0000FF | #C0C0C0 | #FFFFFF | #C0C0C0 |
| Window | #FFFFFF | #FF0000 | #FFFFFF | #000000 | #FFFFFF | #FFFFFF | #FFFFFF |
| WindowText | #000000 | #FFFFFF | #000000 | #FFFFFF | #000000 | #000000 | #000000 |
| Menu | #00FF00 | #FFFFFF | #FFFFFF | #FF00FF | #FFFFFF | #FFFFFF | #FFFFFF |
| MenuText | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 |
| ActiveTitle | #FF00FF | #000000 | #004080 | #000080 | #000080 | #FF0080 | #400000 |
| InactiveTitle | #C0C0C0 | #FF0000 | #C0C0C0 | #C0C0C0 | #C0C0C0 | #800040 | #C0C0C0 |
| TitleText | #000000 | #FFFFFF | #FFFFFF | #000000 | #FFFFFF | #FFFFFF | #FFFFFF |
| ActiveBorder | #80FF00 | #FF0000 | #C0C0C0 | #800000 | #C0C0C0 | #FF80C0 | #C0C0C0 |
| InactiveBorder | #C0C0C0 | #FF0000 | #C0C0C0 | #FFFFFF | #C0C0C0 | #FF80C0 | #C0C0C0 |
| WindowFrame | #000000 | #000000 | #000000 | #C0C0C0 | #000000 | #000000 | #000000 |
| Scrollbar | #C0C0C0 | #C0C0C0 | #C0C0C0 | #0000FF | #C0C0C0 | #C0C0C0 | #C0C0C0 |
| ButtonFace | #C0C0C0 | #C0C0C0 | #C0C0C0 | #C0C0C0 | #C0C0C0 | #C0C0C0 | #C0C0C0 |
| ButtonShadow | #808080 | #808080 | #808080 | #808080 | #808080 | #808080 | #808080 |
| ButtonText | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 | #000000 |
| GrayText | #808080 | #808080 | #000000 | #C0C0C0 | #C0C0C0 | #808080 | #C0C0C0 |
| Hilight | #000000 | #000000 | #008080 | #FFFFFF | #000080 | #FF00FF | #800000 |
| HilightText | #FFFFFF | #FFFFFF | #000000 | #000000 | #FFFFFF | #000000 | #FFFFFF |
| InactiveTitleText | #000000 | #FFFFFF | #000000 | #000000 | #000000 | #FFFFFF | #000000 |
| ButtonHilight | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF | #FFFFFF |

The KB also lists these schemes with raw values; convert them the same way: LCD Default / LCD Reversed Dark / LCD Reversed Light, Monochrome, Pastel, Patchwork, Rugby, Tweed, Wingtips.

The **16-color VGA palette** is the only allowed set:

```
#000000 #800000 #008000 #808000 #000080 #800080 #008080 #C0C0C0
#808080 #FF0000 #00FF00 #FFFF00 #0000FF #FF00FF #00FFFF #FFFFFF
```

Non-palette colors such as Designer's `#3F7C7C` and Arizona's `#FF8040` were **dithered**. We can fake the dither with a 2×2 `repeating-conic-gradient` checkerboard for authenticity.

### 2.2 Fonts

| Use | Font | Source / CDN | License |
|---|---|---|---|
| UI, dialogs (MS Sans Serif 8pt bitmap look) | **"Pixelated MS Sans Serif"** (bundled with 98.css) | `https://unpkg.com/98.css@0.1.21/dist/ms_sans_serif.woff2`, `…/ms_sans_serif_bold.woff2` [V 200] | Ships in the MIT 98.css repo. These are derivative recreations of Microsoft's bitmap font, so treat them as internal-OK. |
| UI alternative | **W95FA** (FontsArena 2019, MS Sans Serif recreation) | `https://cdn.jsdelivr.net/npm/@fontsource/win95fa@5.3.0/index.css` [V 200] | **OFL-1.1**. Safest to redistribute. |
| Title bars, Program Manager group captions ("System" font, bold proportional 10pt) | Use Pixelated MS Sans Serif **bold**. Wieslaw Soltes' Win31 ships `ms_sans_serif(_bold).woff2` with license txt files: https://github.com/wieslawsoltes/Win31/tree/main/dist/assets/fonts | — | See that repo's licence txt files. |
| Terminal / code | "Fixedsys Excelsior" (public domain recreation), or **VT323** (`@fontsource/vt323@5.3.0`, OFL) | — | Fixedsys Excelsior: PD. VT323: OFL. |

Rendering rules:
- `font-size: 11px` (MS Sans Serif 8pt at 96 dpi) for UI and 13px for bold titles.
- `-webkit-font-smoothing: none; font-smooth: never;` plus `image-rendering: pixelated` on icons.
- No anti-aliasing: these bitmap-style webfonts only look right at their native sizes (11/12 px, or 16 px for W95FA). Multiples of those also work.

### 2.3 Bevel / border construction

Win 3.x is **not** Win 95. The differences:
- **Window frame:** a thick (about 4 px) sizing border in **ActiveBorder** color, outlined by a 1 px **WindowFrame** (black) line inside and out, with notches marking the resize corners (lines cut at 22 px from each corner).
- **Title bar:** flat **ActiveTitle** color (navy). No gradient, which was a Win 98 feature. The title text is **centered**, white and bold.
- **Control-menu box (left):** a grey square button with a raised bevel showing a horizontal **"long bar"** glyph (a short white bar with a black shadow; a "spacebar" icon). In MDI children the glyph is a shorter bar.
- **Minimize / maximize (right):** two grey raised buttons with **black solid triangles**: ▼ (minimize) and ▲ (maximize). When maximized, restore is ▲ over ▼. **There is no close [X] button** — closing is via the control menu or a double-click on the control box. This is the #1 tell for "Win 3.x vs 95".
- **Push button:**
  - 1 px black outline with **rounded-off corners** (the corner pixel is removed)
  - inside, a 2 px highlight top-left (white) and a 2 px shadow bottom-right (`#808080`)
  - the default button has a 2 px black outline (thicker)
  - pressed state: shadow top-left 1 px, content shifted 1 px down-right
  - focus: a dotted rectangle around the label
- **Edit field:** white, 1 px black outline. Win 3.1 has no sunken 3D; the 3D sunken fields arrived with CTL3D.DLL apps. Use a flat black 1 px border for purity, or the CTL3D look for "3.11 with Office 4.x".
- **Scrollbar:**
  - 1 px black outline
  - track is a flat Scrollbar color (`#C0C0C0`) — in 3.1 it was often a dithered grey/white checkerboard [M]
  - arrow buttons are raised grey squares with black solid triangles
  - the thumb ("elevator") is a raised grey square, **fixed size** rather than proportional
  - width 17 px
- **Menu bar:** white (Menu), black text. Underlined mnemonic letters. Selection is inverted (Hilight navy with white text). Dropdowns: white with a 1 px black border, **no shadow**.
- **Dialogs:**
  - grey has not yet arrived: dialogs are typically **white** in 3.1
  - grey dialogs came with CTL3D in 3.11-era apps
  - modal frame: double line (thick border, no resize notches)
  - the title bar holds only the control-menu box

CSS recipes:

```css
:root{ --w-face:#C0C0C0; --w-shadow:#808080; --w-hi:#FFFFFF; --w-frame:#000; --w-title:#000080; --w-title-text:#fff; --w-inactive:#fff; --w-desktop:#C0C0C0; }
/* Win3.x push button: 1px black rounded-corner outline + 2px bevel */
.w31-btn{ background:var(--w-face); border:1px solid var(--w-frame); border-radius:2px; /* knocks out corner pixel */
  box-shadow: inset 1px 1px var(--w-hi), inset 2px 2px var(--w-hi), inset -1px -1px var(--w-shadow), inset -2px -2px var(--w-shadow);
  padding:3px 12px; font:11px "Pixelated MS Sans Serif", "W95FA", sans-serif; }
.w31-btn:active{ box-shadow: inset 1px 1px var(--w-shadow); padding:4px 11px 2px 13px; }
.w31-btn.default{ outline:1px solid var(--w-frame); }
.w31-btn:focus-visible span{ outline:1px dotted #000; outline-offset:1px; }
/* Window: sizing border */
.w31-window{ background:var(--w-face); border:1px solid #000; box-shadow: 0 0 0 4px var(--w-face), 0 0 0 5px #000; }
.w31-titlebar{ height:18px; background:var(--w-title); color:var(--w-title-text); font-weight:700; text-align:center; display:grid; grid-template-columns:18px 1fr 18px 18px; border-bottom:1px solid #000; }
.w31-window:not(.active) .w31-titlebar{ background:var(--w-inactive); color:#000; }
```

### 2.4 Anatomy (Program Manager)

- **Program Manager:** a main window titled "Program Manager", with the menu `File Options Window Help`. Inside the AppWorkspace (white) sit **MDI group windows** ("Main", "Accessories", "Games", "StartUp").
- **Group windows:** contain 32×32 icons in a grid, each with a label below. The selected label is highlighted in navy.
- **Minimized groups:** 32×32 "group" icons (a small window showing a 3×3 grid of tiny icons) along the bottom of the workspace.
- **Minimized apps** become desktop icons with labels.

### 2.5 Existing CSS / code

| Project | What | License | URL / CDN |
|---|---|---|---|
| **98.css** (jdan) | Win98 widgets; fonts, scrollbar SVG data-URIs, title bar | MIT [V] | `https://unpkg.com/98.css@0.1.21/dist/98.css` [V 200]; demo https://jdan.github.io/98.css/ |
| **jasmaa/win3.css** | Win3-style elements (small, unmaintained since 2022) | MIT [V] | https://github.com/jasmaa/win3.css, demo https://jasonmaa.com/win3.css/ |
| **wieslawsoltes/Win31** | Full Win 3.1 shell in JS; `dist/packages/shell/theme.css` shows window frame and buttons, plus Program Manager | "Other" (check LICENSE) | https://github.com/wieslawsoltes/Win31, live https://wieslawsoltes.github.io/Win31/ |
| tossnet/Blazor-WinOld | Blazor components incl. Windows 3.11 style; useful CSS for frames | MIT | https://github.com/tossnet/Blazor-WinOld |
| paulwratt/HOTDOG | X11 WM with Hot Dog Stand look | GPL-3.0 | https://github.com/paulwratt/HOTDOG |
| xp.css (botoxparty) | Superset of 98.css | MIT (0.2.6) | Reference only |

Recommendation:
- Take 98.css's scrollbar and checkbox **SVG data-URIs** and its font, then restyle them to the 3.1 look: black outline, no gradient title bar, ▲▼ buttons.
- Do not use 98.css wholesale. It is Win98, with a gradient title bar and an X button.

### 2.6 Signature moves (Win 3.11)

1. **Centered bold title on a flat navy bar** with a **control-menu "bar" box** at the left and **▼ ▲ triangle buttons** at the right. **No ✕.**
2. **Thick grey sizing border with black outlines and corner notches.**
3. **Pixel MS Sans Serif with no anti-aliasing**, with underlined mnemonics in menus.
4. **Push buttons with a black 1 px rounded-corner outline** and a 2 px bevel. Focus is a dotted rectangle.
5. **Program Manager icon grid** (32 px icons, label highlight in navy), plus optional **Hot Dog Stand** mode (yellow / red / black).

### 2.7 Chat client mapping

- **SpacePanel:** a Program Manager window with each Space as a **group icon**. Spaces can also be minimized-group icons on the desktop strip.
- **Room list:** an MDI group window "Rooms". Each room is a list-box row with a 16 px icon. The selected row is inverted in navy. Unread count appears as "(3)" after the name, the 1992 way.
- **Header:** the room's MDI title bar (navy, centered, `#room:server – Element`), with a **menu bar** below: `Room  Edit  View  Call  Help`. The header buttons become menu items or toolbar push buttons.
- **Timeline:** a white client area. Sender in bold followed by the message: `<Alice> hello`, IRC/WinChat style. Timestamps in square brackets. Optional Fixedsys mode.
- **Composer:** a single-line edit field plus a **"Send"** default push button (thick outline). The emoji button is a push button with a bitmap.
- **Dialogs:** modal, with a control-menu box. Buttons are OK / Cancel / Help on the right or bottom, 75×23 px.
- **Scrollbars:** a custom `::-webkit-scrollbar` with 98.css-style SVGs recolored. The thumb is a fixed square.
- **Avatars:** posterize to the 16-color palette with an SVG filter (`feComponentTransfer` discrete), shown at 32×32 with `image-rendering: pixelated`.
- **Desktop background** (behind the app frame): the Desktop color, with optional "Bricks"/"Argyle" bitmap tiles in the style of `.BMP` wallpapers.

### 2.8 References (Win 3.x)

- KB 102976 (scheme values): https://ftp.zx.net.nz/pub/Patches/ftp.microsoft.com/MISC/KB/en-us/102/976.HTM
- PCjs Windows 3.10 emulator (screenshot-perfect reference): https://www.pcjs.org/software/pcx86/sys/windows/3.10/
- Wikipedia: https://en.wikipedia.org/wiki/Windows_3.1 (Program Manager screenshot in the infobox). Also https://en.wikipedia.org/wiki/Windows_for_Workgroups
- Hot Dog Stand story (designer Virginia Howlett): https://www.pcgamer.com/software/windows/windows-3-1-included-a-red-and-yellow-hot-dog-stand-color-scheme-so-garish-it-was-long-assumed-to-be-a-joke-so-i-tracked-down-the-original-designer-to-get-the-true-story/ ; https://blog.codinghorror.com/a-tribute-to-the-windows-31-hot-dog-stand-color-scheme/
- Old New Thing (Nov 2025): https://devblogs.microsoft.com/oldnewthing/20251125-00/?p=111813
- Live Win 3.1 recreation: https://wieslawsoltes.github.io/Win31/
- Scheme name screenshots ("Windows 3.1 color schemes in order"): https://lntelinside.tumblr.com/post/63406086760/windows-31-color-schemes-in-order-arizona
- desktopcolors.com Win 3.1 palette: https://desktopcolors.com/os/windows-3-1/004080/

---

## 3. KDE Plasma 6 / Breeze (plus Oxygen past and Ocean future)

### 3.1 Breeze color schemes — exact values [V]

Source: https://invent.kde.org/plasma/breeze/-/raw/master/colors/BreezeLight.colors and `BreezeDark.colors` (converted from `r,g,b`).

**Breeze Light**

| Group | BackgroundNormal | BackgroundAlternate | ForegroundNormal | ForegroundInactive | Notes |
|---|---|---|---|---|---|
| Window | `#eff0f1` | `#e3e5e7` | `#232629` | `#707d8a` | App chrome |
| View | `#ffffff` | `#f7f7f7` | `#232629` | `#707d8a` | Lists, text areas (timeline) |
| Button | `#fcfcfc` | `#a3d4fa` | `#232629` | `#707d8a` | |
| Header | `#dee0e2` | `#eff0f1` | `#232629` | | Header (inactive window): `#eff0f1` |
| Selection | `#3daee9` | `#a3d4fa` | `#ffffff` | | |
| Tooltip | `#f7f7f7` | `#eff0f1` | `#232629` | | |
| Complementary | `#2a2e32` | `#1b1e20` | `#fcfcfc` | `#a1a9b1` | Dark panel areas |
| WM (titlebar) | active `#e3e5e7` / fg `#232629` | inactive `#eff0f1` / fg `#707d8a` | | | |

**Breeze Dark**

| Group | BackgroundNormal | BackgroundAlternate | ForegroundNormal | ForegroundInactive |
|---|---|---|---|---|
| Window | `#202326` | `#292c30` | `#fcfcfc` | `#a1a9b1` |
| View | `#141618` | `#1d1f22` | `#fcfcfc` | `#a1a9b1` |
| Button | `#292c30` | `#1e5774` | `#fcfcfc` | `#a1a9b1` |
| Header | `#292c30` (inactive `#202326`) | `#202326` | `#fcfcfc` | |
| Selection | `#3daee9` | `#1e5774` | `#fcfcfc` | |
| Tooltip | `#292c30` | `#202326` | `#fcfcfc` | |
| Complementary | `#202326` | `#1e5774` | `#fcfcfc` | |
| WM | active `#272c31` | inactive `#202428` | `#fcfcfc` / `#a1a9b1` | |

Shared role colors:

| Role | Light | Dark |
|---|---|---|
| **DecorationFocus / DecorationHover / ForegroundActive** | `#3daee9` ("Plasma blue") | `#3daee9` |
| ForegroundLink | `#2980b9` | `#1d99f3` |
| Visited | `#9b59b6` | `#9b59b6` |
| Negative | `#da4453` | `#da4453` |
| Neutral | `#f67400` | `#f67400` |
| Positive | `#27ae60` | `#27ae60` |

On selection backgrounds the link color is `#fdbc4b`.

**Breeze Classic** (Plasma 5 look) [V]:
- Window `#eff0f1`, View `#fcfcfc`, text `#232627`
- active titlebar `#475057` with text `#fcfcfc`
- Complementary `#31363b`
- tooltip dark `#232627`
- DecorationHover `#93cee9`

**Accent color:** Plasma 6 lets the user pick an accent, or derive it from the wallpaper. `#3daee9` is the default. Map it to Element's `accent-color`.

### 3.2 Fonts

| Use | Font | CDN | License |
|---|---|---|---|
| UI (Plasma default 10pt, about 13.33 px) | **Noto Sans** | `https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap` [V 200]; `@fontsource/noto-sans@5.3.0` | OFL-1.1 |
| Mono | **Hack** (Plasma default fixed font) | https://github.com/source-foundry/Hack | MIT + Bitstream Vera |
| Alternative (some distros, KDE web) | Inter (`@fontsource-variable/inter@5.3.0`) | | OFL-1.1 |
| Oxygen past | **Oxygen** font | `https://fonts.googleapis.com/css2?family=Oxygen:wght@300;400;700&display=swap` [V 200] | OFL |

Plasma sizing: default "General" font is Noto Sans 10pt; window title is 10pt; small font is 8pt. In CSS, use 13px body and 11px small. Weight 600 is rare in Breeze; it is mostly regular, with bold for headings in Kirigami (Heading level 1 = 1.35× and so on).

### 3.3 Breeze widget style [V]/[M]

From `kstyle/breezemetrics.h` (master) [V]:
- `Frame_FrameRadius = 5`. This is **5 px in Plasma 6**; it was 3 in Plasma 5. CheckBox radius 4. `Frame_FrameWidth = 2`.
- Buttons: `Button_MinWidth = 80`, margins 6, item spacing 4. Pen width ≈ 1 px for frames and shadows. Hover blend 0.3.

Visual rules [M, cross-check with a Plasma 6 VM]:
- **Button:**
  - fill `Button.BackgroundNormal`
  - 1 px outline = text color mixed with bg at about 20% (`color-mix(in srgb, #232629 20%, #fcfcfc)` ≈ `#cbcccd`)
  - very subtle vertical gradient in Plasma 5, flat in Plasma 6
  - hover: outline becomes accent `#3daee9`
  - pressed/checked: fill accent mixed at about 30%, plus an accent outline
- **Default button:** accent outline, or a light accent fill.
- **Focus:** 1 px accent outline plus a 3 px translucent accent "glow" ring outside (`box-shadow: 0 0 0 1px #3daee9, 0 0 0 3px rgb(61 174 233 / .3)`). Text fields show a 1 px accent border on focus.
- **Line edit:** View background (`#fff`), 1 px outline, radius 5.
- **Frames / group boxes:** subtle 1 px separator lines (fg at about 15%). No heavy borders.
- **Tabs:** flat, with a **3 px accent line on the selected tab** (bottom for document-mode tabs).
- **Checkbox / radio:**
  - check is accent-filled with a white glyph (Plasma 6)
  - radio is a ring with an accent dot
  - sliders have an accent groove portion and a round handle with an outline
- **Scrollbar:** thin (about 8 px) groove-less. The handle is a pill in fg at 30–50% and widens to about 14 px on hover. The arrows are hidden.
- **Menus:** radius 5, background View, shadow `0 4px 14px rgba(0,0,0,.25)`. The selected item is accent at about 25% with an accent outline.
- **Window decoration (Breeze):**
  - titlebar = WM active color, title centered
  - buttons are **circle icons**: minimize ⌄ / maximize ⌃ (chevrons) / close ✕
  - close hover fills a red circle `#da4453` with a white ✕
  - Plasma 6 window corner radius about 5 px
  - large soft shadow (`0 10px 30px rgba(0,0,0,.35)`)
  - **no titlebar/toolbar separator line** ("unified" header)

### 3.4 Plasma panel and Kirigami patterns

- **Plasma 6 default panel:**
  - **floating** bottom panel (gap about 8 px, radius about 8 px when floating)
  - height 44 px
  - background Plasma theme (Breeze), translucent with blur
  - Kickoff launcher left, icons-only task manager (Kickoff = KDE logo), system tray and digital clock right
  - becomes flush when a window touches it
- **Kirigami:**
  - `Kirigami.Units.gridUnit = 18`, `smallSpacing = 4`, `largeSpacing = 8`
  - `GlobalDrawer` (left sidebar) and `ContextDrawer`
  - **PageRow / column view**: multi-column pages sliding left to right, like Element's room list → timeline → thread
  - `Kirigami.Heading`
  - `InlineMessage` banners: colored left border plus tinted background (positive / neutral / negative)
  - `Kirigami.AbstractCard`
  - `NavigationTabBar` on mobile
  - `SearchField` with a rounded clear button
- **NeoChat** (KDE's own Matrix client, Kirigami) is the best direct reference for a "Breeze Element": https://apps.kde.org/neochat/. Source: https://invent.kde.org/network/neochat (GPL).

### 3.5 Icons

- **Breeze icons:** LGPL-3.0-or-later (`COPYING-ICONS`) [V]. Repo: https://invent.kde.org/frameworks/breeze-icons, mirror https://github.com/KDE/breeze-icons.
  - CDN (verified 200): `https://cdn.jsdelivr.net/gh/KDE/breeze-icons@master/icons/actions/22/mail-send.svg`
  - Directories: `actions/{16,22,24,32}`, `places`, `status`, `emblems`, `apps/48`
  - Monochrome icons use the CSS class `ColorScheme-Text` with an embedded `<style>`. They inherit `currentColor` if we inline them, or we can mask them.
  - Pin a tag rather than `master` for stability.
- **Oxygen icons:** LGPL-3.0. https://invent.kde.org/frameworks/oxygen-icons, mirror https://github.com/KDE/oxygen-icons.

### 3.6 Signature moves (Breeze)

1. **`#3daee9` Plasma blue** for focus, selection and hover outlines, with a soft glow ring on focus.
2. **Header / Window / View three-tone layering**: `#dee0e2` header, `#eff0f1` window, `#fff` view (dark: `#292c30` / `#202326` / `#141618`).
3. **Hover = outline turns accent**; fills stay neutral. Radius 5 everywhere.
4. **Circular chevron window buttons** and a red-circle close on hover. The header is unified with the toolbar.
5. **Noto Sans 10pt**, flat, low-contrast 1 px separators, plus **Kirigami column paging** and InlineMessage banners.

### 3.7 Chat client mapping (Breeze)

- **SpacePanel:** styled like a vertical Plasma panel or Kirigami GlobalDrawer, in the Complementary colors (`#2a2e32`) or Window colors. The selected item gets an accent background at 20% plus a left accent bar.
- **Room list:** `Colors:Window`, with rows following the NeoChat pattern (32 px avatar, name, unread pill in accent). The selected row has an accent fill at about 25% and an accent outline (radius 5).
- **Header:** `Colors:Header` `#dee0e2`. Tool buttons are flat (icon-only) and gain an outline on hover. There is no bottom border; separate with a subtle 1 px line.
- **Timeline:** `Colors:View` `#fff`. Messages are flat with no bubbles, NeoChat "compact" style, or optional rounded bubbles (radius 5) in `View.BackgroundAlternate`. Link color `#2980b9`.
- **Composer:** Breeze line edit. Focus gives an accent border plus glow. The send button is a tool button with the `document-send` / `mail-send` icon.
- **Dialogs:** Breeze dialog — window background, radius 5, button box at the bottom right (`OK` default with accent outline). Use KDE-order buttons: Help left, OK/Apply/Cancel right.
- **Notifications / toasts:** Plasma notification popup style: Complementary-ish background, app icon, timeout progress ring.

### 3.8 Past variant — Oxygen (KDE 4) [V] colors

Source: https://invent.kde.org/plasma/oxygen/-/raw/master/color-schemes/Oxygen.colors

- **Window:** `#d6d2d0`, alt `#dad9d8`. Text `#221f1e`.
- **View:** `#ffffff`, alt `#f8f7f6`. Text `#1f1c1b`.
- **Button:** `#dfdcd9`.
- **Selection:** `#43ace8` (alt `#3e8acc`) with white text.
- **Focus:** `#3aa7dd`. Hover `#6ed6ff`, the famous **Oxygen glow**.
- **Tooltip / Complementary:** `#181513` with text `#e7fdff`.
- **ForegroundActive:** `#924c9d`. Link `#0057ae`, visited `#644a9b`, negative `#bf0303`, neutral `#b08000`, positive `#006e28`.
- **WM titlebar:** active `#30aee8` / white, inactive `#e0dfde` / `#4b4743`.

Oxygen signature moves:
- **radial-gradient window background**: lighter top-center, about `radial-gradient(ellipse at 50% 0, #e9e7e5, #d6d2d0 60%)` over a vertical gradient
- **glossy, embossed buttons** (`linear-gradient(#f3f1f0,#d8d4d1)`) with an inner highlight and a soft dark shadow
- **blue glow focus/hover halos** (`box-shadow: 0 0 4px 1px #6ed6ff`)
- sunken holes for line edits
- **dark glass Plasma panel** (Air/Oxygen Plasma theme: black at about 80% with a gloss)
- Oxygen font
- high-detail Oxygen icons

### 3.9 Future variant — "Ocean" on Union (KDE 2026+)

- KDE's next-gen styling: the **Union** CSS-based style engine (technical preview targeted for Plasma 6.7) plus the **Ocean** design system by the VDG (Andy Betts). It is designed in **Penpot** (moved off Figma in October 2025). Ocean has new colors and gradients, plus **app icons with soft gradients and rounded shapes**, in three variants: round / squircle / unbounded.
- Sources:
  - https://planet.kde.org/andres-betts-2026-05-22-ocean-design-for-plasma-may-updates/
  - https://planet.kde.org/arjen-hiemstra-2026-08-05-union-summer-2026-update/
  - https://www.linuxtoday.com/blog/kdes-new-css-based-style-engine-union-is-coming-to-kde-plasma-6-7/
  - https://invent.kde.org/abetts/ocean-design
  - https://invent.kde.org/teams/vdg/issues/-/wikis/Ocean-Design---Overview-and-Details
- Images:
  - https://anditosan.wordpress.com/wp-content/uploads/2026/05/colors.jpg (Ocean palette)
  - https://anditosan.wordpress.com/wp-content/uploads/2026/05/apps-32-1.png
  - https://anditosan.wordpress.com/wp-content/uploads/2026/05/places.png
- **Pull exact Ocean color tokens from `invent.kde.org/abetts/ocean-design`** when implementing. They were not captured as hex in this pass.
- Theme direction for "Plasma Future":
  - larger radii (8–12)
  - filled accent buttons (more Material/libadwaita-like, as community critics note)
  - softer gradients on icons
  - Breeze blue kept but with a broader tonal ramp
  - pill-shaped selection
  - floating panels and card-based sidebars

### 3.10 References (KDE)

- Breeze repo: https://invent.kde.org/plasma/breeze (colors/, kstyle/breezemetrics.h)
- Plasma 6.0 announcement with screenshots: https://kde.org/announcements/megarelease/6/
- KDE HIG: https://develop.kde.org/hig/ (colors, spacing/units, components). Kirigami docs: https://develop.kde.org/docs/getting-started/kirigami/
- NeoChat screenshots: https://apps.kde.org/neochat/
- Oxygen: https://invent.kde.org/plasma/oxygen ; screenshots at https://en.wikipedia.org/wiki/KDE_Software_Compilation_4
- Penpot / Figma: KDE's "Plasma Design System" Figma is legacy; Ocean is in Penpot. Links are in the VDG wiki above.

---

## 4. LCARS (Star Trek: TNG / DS9 / VOY / Picard / Lower Decks)

### 4.1 Palettes

**Named LCARS colors** [V] (from the `trekcolors` R package and `joernweissenborn/lcars` CSS, which share the naming). In the TNG-era (2357) column, "x" marks membership of the core palette `lcars_2357()`.

| Name | Hex | 2357 core | | Name | Hex |
|---|---|---|---|---|---|
| pale-canary | `#FFFF99` | x | | blue-bell | `#9999CC` |
| tanoi | `#FFCC99` | x | | melrose | `#9999FF` |
| golden-tanoi | `#FFCC66` | x | | hopbush | `#CC6699` |
| neon-carrot | `#FF9933` | x | | chestnut-rose | `#CC6666` |
| eggplant | `#664466` | x | | orange-peel | `#FF9966` |
| lilac | `#CC99CC` | x | | atomic-tangerine | `#FF9900` |
| anakiwa | `#99CCFF` | x | | danub | `#6688CC` |
| mariner | `#3366CC` | x | | indigo | `#4455BB` |
| bahama-blue | `#006699` | x | | lavender-purple | `#9977AA` |
| periwinkle | `#CCDDFF` | | | cosmic | `#774466` |
| dodger-pale | `#5599FF` | | | red-damask | `#DD6644` |
| dodger-soft | `#3366FF` | | | medium-carmine | `#AA5533` |
| near-blue | `#0011EE` | | | bourbon | `#BB6622` |
| navy-blue | `#000088` | | | sandy-brown | `#EE9955` |
| husk | `#BBAA55` | | | rust | `#BB4411` |
| tamarillo | `#882211` | | | | |

**thelcars.com "Classic" (TNG/DS9/VOY) v27** [V] (from `https://www.thelcars.com/assets/classic-2703.css`, used as reference only, see the license below):
- `african-violet #baa4e5`, `almond #d29b7f`, `almond-creme #fcc19f`, `barley #edb378`
- `bluey #8899ff`, `brown #895129`, `butterscotch #ea9c72`
- `dirty-mauve #7a506d`, `dusty-mauve #9d698a`, `lilac #8a72a7`
- `mars #ff2200`, `orange #eb943a`, `red #cf4f4f`, `subdued-sienna #c47d69`, `true-mauve #c082a9`

Default frame: left-frame top `bluey`, left frame `almond`, top corner `bluey`, bottom corner `red`, text `african-violet` on **black**.

**Era sets** (curated; [C]/[M], pick 5–7 per theme):

| Era | Feel | Suggested set |
|---|---|---|
| **TNG / DS9 / VOY (2360s–70s)** | warm oranges, peaches, lilacs | `#FF9900` atomic-tangerine, `#FFCC99` tanoi, `#CC99CC` lilac, `#9999CC` blue-bell, `#CC6666` chestnut-rose, `#FFCC66` golden-tanoi, `#9999FF` melrose, `#FF9966` orange-peel; text `#FF9900` / `#FFCC99` |
| **Nemesis / late VOY (2379)** | cooler: blues, ochre accents | `#5599FF`, `#3366CC`, `#99CCFF`, `#CCDDFF`, `#FFCC66`, `#DD6644` |
| **Picard S1–2 (2399–2401)** | dark, desaturated blues and white text, thin lines, more "glass" | `#2766FF`-ish blues, `#6EA9DB`, `#B2C7E8`, amber `#F2A33A`, alert red `#E8443A` [M]. Thinner bars, lots of black, fine data text |
| **Picard S3 Enterprise-D restored / Lower Decks (2380s)** | TNG warmth, slightly more saturated/flat | thelcars "Classic" set above; Lower Decks leans `#FF9C00`, `#CC99FF`, `#9999FF`, `#FFCC66`, `#CC6666` [M] |
| **Red alert** | | `#CC4444`/`#FF2200` "mars" pulsing on black, with bars flashing |

### 4.2 Fonts

| Font | Notes | URL | License |
|---|---|---|---|
| **Antonio** (Vernon Adams) | De facto free LCARS font: condensed sans, close to Swiss 911 Ultra Compressed. Variable 100–700. | Google Fonts `https://fonts.googleapis.com/css2?family=Antonio:wght@100..700&display=swap` [V 200]; npm `@fontsource/antonio@5.3.0` → `https://cdn.jsdelivr.net/npm/@fontsource/antonio@5.3.0/index.css` [V 200] | **OFL-1.1** |
| Swiss 911 Ultra Compressed (Bitstream) | Canonical on-screen TNG font (Okuda) | MyFonts (commercial) | Commercial; don't ship |
| Helvetica Ultra Compressed | Alternative canonical | Commercial | |
| "Okuda" / "LCARS" fan fonts | Several freeware fan fonts | dafont etc. | Unclear; avoid |
| League Gothic / Oswald | Fallbacks | Google Fonts | OFL |

Usage rules:
- **ALL CAPS**, `letter-spacing: .02–.05em`
- **right-aligned** labels inside buttons (text in the bottom-right corner of the button)
- numbers in labels like `03-117`, `47 ALPHA`
- black text on colored blocks; colored text on black

### 4.3 Construction: elbows, sweeps, pills, bars

The core LCARS pieces:
- **Elbow ("sweep"):** a thick vertical bar that turns 90° into a horizontal bar. The **outer corner has a large radius**, and the **inner corner a small concave radius** cut out of the black background.
- **Pill buttons:** fully rounded ends (`border-radius: 999px`), or **half-pills**: one rounded end, butting into a bar.
- **Bars:** horizontal segments separated by **black gaps (4–6 px)**, each in a different color. A small "endcap" pill finishes each run.
- **Blocks:** stacked rectangles in the left frame, separated by black gaps, labeled with numbers.

CSS elbow technique (the thelcars approach): the outer radius sits on the colored frame, and the inner concave radius is a **black element whose own corner is rounded**, laid over the frame.

```css
:root{ --lcars-bg:#000; --frame-w:180px; --bar-h:28px; --gap:6px; --outer-r:80px; --inner-r:40px;
  --c1:#FF9900; --c2:#CC99CC; --c3:#9999CC; --c4:#CC6666; --c5:#FFCC99; --text:#FF9900; }
.lcars{ background:var(--lcars-bg); color:var(--text); font-family:Antonio, "Arial Narrow", sans-serif; text-transform:uppercase; }
/* Top-left elbow: vertical frame turns right into the top bar */
.elbow-tl{ position:relative; width:var(--frame-w); height:120px; background:var(--c1);
  border-top-left-radius:var(--outer-r); }
.elbow-tl::after{ /* black cut-out with concave inner corner */
  content:""; position:absolute; right:0; bottom:0; width:calc(100% - 120px); /* 120px = vertical arm width */
  height:calc(100% - var(--bar-h)); background:var(--lcars-bg); border-top-left-radius:var(--inner-r); }
/* Pure-CSS alternative: radial-gradient mask for inner corner */
.elbow-inner{ -webkit-mask: radial-gradient(circle var(--inner-r) at 100% 100%, transparent 98%, #000 100%); }
.lcars-btn{ background:var(--c2); color:#000; border:0; border-radius:999px; height:48px; min-width:140px;
  display:flex; align-items:flex-end; justify-content:flex-end; padding:0 20px 6px; font-size:20px; letter-spacing:.03em; }
.lcars-btn.half-left{ border-radius:999px 0 0 999px; }
.bar{ display:flex; gap:var(--gap); height:var(--bar-h); } .bar>*{ flex:var(--w,1); background:var(--c,var(--c3)); }
.bar>.endcap{ flex:0 0 var(--bar-h); border-radius:0 999px 999px 0; }
.block-stack{ display:flex; flex-direction:column; gap:var(--gap); } .block-stack>*{ background:var(--c); color:#000; text-align:right; padding:4px 10px; min-height:60px; display:flex; align-items:flex-end; justify-content:flex-end; }
```

Alternatively, build elbows from inline SVG paths (crisp at any size):
`M0,R A R,R 0 0 1 R,0 H W V B H r A r,r 0 0 0 a,B+r V H H 0 Z`.

Animation:
- data cascade: columns of numbers scrolling and colors cycling (`@keyframes` changing `color` stepwise)
- button press: brightness 1.15 plus a beep
- red-alert pulse: `animation: alert 1s steps(2) infinite`

### 4.4 Existing projects

| Project | Notes | License | URL |
|---|---|---|---|
| **thelcars.com** (Jim Robertus) | Best-looking templates: Classic (TNG/DS9/VOY) v27, Nov 2026. Antonio font, elbows, bars, data cascade, beeps | **Custom EULA: non-commercial, NO redistribution, NO hotlinking, attribution required** [V]. **Reference only**; do not copy CSS into our shipped theme. | https://www.thelcars.com/ , license https://www.thelcars.com/license/ |
| **joernweissenborn/lcars** | CSS framework: named colors (`.lcars-<name>-bg`), elbows, buttons, audio (`lcars/audio/*.ogg`: alert, red_alert, tactinput_acknowledge…) | **MIT** (audio provenance likely the show, so treat it as copyrighted) | https://github.com/joernweissenborn/lcars , demo https://joernweissenborn.github.io/lcars/ |
| **louh/lcars** | Responsive LCARS layout (HTML/CSS/JS) | **GPL-3.0** (copyleft: reference unless we're GPL-compatible) | https://github.com/louh/lcars , https://lcars.computer/ |
| tmthrgd/LCARS | Small HTML+CSS interface | **Unlicense** (public domain, free to copy) | https://github.com/tmthrgd/LCARS , https://tmthrgd.github.io/LCARS/ |
| TEParsons/LCARS | CSS | **CC0-1.0** | https://github.com/TEParsons/LCARS |
| mttaggart/lcars-css | LCARS-like styling | MIT | https://github.com/mttaggart/lcars-css |
| MichalSvatos/pi-hole-lcars-next-gen | Real app re-skin (good analog for re-skinning Element) | MIT | https://github.com/MichalSvatos/pi-hole-lcars-next-gen |
| lcarsde | LCARS desktop environment (Linux) | MIT | https://lcarsde.github.io |
| retronified/lcars-obsidian | Obsidian app re-skin (also a good analog) | MIT | https://github.com/retronified/lcars-obsidian |

**Sound:** UI beeps are optional and opt-in.
- Sources: joernweissenborn's audio (MIT repo, but the sounds derive from the show) or thelcars `beep1-5.mp3` (EULA forbids redistribution).
- For anything beyond internal use, synthesize our own with WebAudio: a short sine/square chirp at 1200–1800 Hz, 40–80 ms, quick decay. TNG panel "chirps" are two-tone.
- Hook them to button `pointerdown` and to new-message events.

### 4.5 Signature moves (LCARS)

1. **Elbow sweeps**: a big outer radius plus a concave inner radius framing the content on a pure **black** background.
2. **Pill and half-pill buttons** in pastel orange, lilac and periwinkle, with **black, uppercase, right/bottom-aligned Antonio** labels.
3. **Segmented colored bars** separated by black gaps, ending in round endcaps.
4. **Arbitrary numeric labels** ("47-1138", "LCARS 40274") and a **data cascade** of tiny scrolling digits.
5. **No icons, no borders, no shadows, no gradients**: only flat color blocks, plus a **red-alert** pulsing mode.

### 4.6 Chat client mapping (LCARS)

- **Overall frame:** the whole app sits inside one big LCARS frame.
  - **left frame** = SpacePanel + room list
  - **top elbow + bar** = room header
  - **bottom elbow + bar** = composer
  - content = timeline on black
- **SpacePanel:** a vertical block stack, one colored block per Space, labeled with a short uppercase name plus a number. The active space is brighter or gets the `#FF9900` accent. Home is "01-HOME".
- **Room list:** a stack of **pill buttons** (alternating `--c2/--c3/--c5`) with black right-aligned uppercase labels. The unread count is a small black-on-color numeral block at the left end. The selected room is a full pill in `#FF9900`, or a blinking endcap.
- **Header:** room name in big Antonio **right-aligned in the top bar**, e.g. `#GENERAL — DECK 7`. Call and video buttons become half-pills at the end of the bar. Topic text in small caps under it, in the text color.
- **Timeline:**
  - black background
  - sender names in **color-coded uppercase**: username colors → the LCARS palette, overriding Element `username-colors` with 8 palette colors
  - message body in `#FFCC99` or white-ish
  - timestamps as stardate-style numerals on the right
  - read receipts as tiny colored squares
  - no bubbles: messages are text blocks with a thin colored bar on the left
- **Composer:** the bottom elbow's horizontal bar holds a **black input "slot"** with orange text and a caret. The send button is a half-pill labeled "TRANSMIT". Attach is "DATA", emoji "SYMBOLS".
- **Dialogs:** a full-overlay LCARS mini-frame (elbows at top-left and bottom-left) titled in caps. Buttons are pills: `ACKNOWLEDGE` / `CANCEL`. Destructive actions get the red `#CC4444` pill.
- **Avatars:** circles are out of place. Use square (or rounded-rect) tiles with a 2 px palette border, or replace them with initials blocks.
- **Notifications:** a "red alert" style banner for mentions (pulsing red bar).

### 4.7 References (LCARS)

- Memory Alpha LCARS article (canon background, Michael Okuda): https://memory-alpha.fandom.com/wiki/Library_Computer_Access_and_Retrieval_System
- Wikipedia LCARS: https://en.wikipedia.org/wiki/LCARS
- thelcars.com Classic template (live reference): https://www.thelcars.com/
- lcars.computer (louh): https://lcars.computer/
- joernweissenborn demo: https://joernweissenborn.github.io/lcars/
- trekcolors palettes: https://leonawicz.github.io/trekcolors/reference/lcars_colors.html
- Antonio specimen: https://fonts.google.com/specimen/Antonio
- lcarsde screenshots: https://lcarsde.github.io
- Copyright note: LCARS is © CBS Studios / Paramount. The look and the trademark are not ours. That is fine for internal use; for public shipping, avoid the "LCARS" name and show assets.

---

## 5. Implementation notes / priorities

1. **Breeze** is the easiest. Most of it fits in `custom_themes` plus Compound vars. Use the exact `.colors` values above, and generate both Light and Dark.
2. **Teams** comes next. Tokens can be copied 1:1 from `@fluentui/tokens`. Three variants share one CSS skeleton; only the ramps and radius differ:
   - `teams-classic` (#6264A7, radius 3, dark rail, purple top bar)
   - `teams-2024` (brandTeams, radius 4/8)
   - `teams-2026` (brandTeamsV21, accent picker, radius 8–12, Copilot gradient)
3. **Win 3.11** needs heavy injected CSS (frames, title bars, no-✕ buttons, scrollbars, bitmap fonts). Ship a **scheme switcher** with the 14 converted schemes (Hot Dog Stand as an easter egg). Use W95FA (OFL) for safe redistribution and Pixelated MS Sans Serif internally.
4. **LCARS** needs the most structural CSS: the grid frame around Element's main split. Build our own elbows (the code above is original). Use only MIT, Unlicense or CC0 sources (joernweissenborn, tmthrgd, TEParsons) for any copied code. **Do not copy thelcars.com CSS** (its EULA forbids redistribution).
5. **Fonts summary:**

   | Font | License / note |
   |---|---|
   | Antonio | OFL |
   | Noto Sans | OFL |
   | Oxygen | OFL |
   | Inter | OFL |
   | W95FA | OFL |
   | VT323 | OFL |
   | Selawik | OFL |
   | Hack | MIT |
   | Segoe UI / Variable | Proprietary: local-only, or Fabric CDN internally |
   | Pixelated MS Sans Serif | Internal |
   | Swiss 911 | Commercial: no |

6. **Icons summary:**

   | Icon set | License |
   |---|---|
   | Fluent System Icons | MIT, npm `@fluentui/svg-icons` |
   | Breeze icons | LGPL-3.0+ (fine for unmodified redistribution; keep the license file) |
   | Oxygen icons | LGPL |
   | LCARS | No icons by design |
   | Win 3.1 | Draw 32×32 pixel icons ourselves, or use the SVG icon paths in wieslawsoltes/Win31 (check its license) |
