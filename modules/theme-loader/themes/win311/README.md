# win311 — Windows 3.11 theme family

Style guide: `docs/styleguides/win311.md` (human) and `docs/styleguides/win311.json` (data).
Reference captures: `docs/styleguides/refs/win311/`.
Screenshots: `recordings/screens/win311-*` (hero.png per variant).
Walkthroughs: `recordings/walkthroughs/win311-*.webm`.
Edge reports: `tests/reports/win311-*.md`.

## Files

| Path | What |
|---|---|
| `themes.json` | Manifest, 7 variants. **Hand-maintained.** The phase-A generator was removed so it can't clobber edits. |
| `shared.css` | All chrome, driven by the 21 Control-Panel colour slots `--w-*` plus a few extras (`--w-sel`, `--w-link`, `--w-own-name`, `--w-mention-*`, `--w-code-*`, `--w-dec-1..6`, `--w-strip-text`, `--w-desktop-text`, `--w-group-icon`). It maps them to Compound tokens on html, body and `[class*=cpd-theme-]`. |
| `win311-<variant>.css` | Fills in the slots for a scheme, plus that variant's extras (2030, cyberpunk). |
| `enhance.ts` | Shared by all variants. See below. |
| `tools/make-assets.py` | Regenerates every SVG in `assets/`. |
| `tools/make-bold.py` | Builds `w95fa-overstrike-bold.woff2` from W95FA. |

## What is implemented

### Layout (all variants)

Element becomes one Program Manager application window:
- Desktop margin around the window.
- Flat title bar `Element – [<room>]`.
- Control-menu box on the left; ▼ ▲ on the right; no ✕.
- Menu bar: File / Options / Window / Help.
- White AppWorkspace.

There are three MDI child windows: the room list, the room timeline and the right panel. Each has its own sizing band and title bar:
- The room-list header, room header and card header become the title bars.
- The active window is the one with focus. It gets the active title colour; the others get the inactive colours.
- The room avatar is the invisible click target over the control-menu box. It opens room settings.
- The room header buttons are small caption-style push buttons.

Spaces become minimized program-group icons along the bottom of the workspace, labelled from `aria-label`. Exception: usable keeps the vertical panel, styled as a grey toolbar.

### Controls

- Push buttons use the VGA.DRV bevel: 1px black frame, 1px white, 2px grey, corner pixel cut. The default button has a heavy ring.
- Edit fields are flat, with a 1px black border. Usable uses CTL3D sunken fields.
- Check boxes and toggles become the Win 3.1 X check box. Option buttons are our pixel radio.
- Scrollbars are 17px with pixel arrow buttons.
- Menus have no shadow and highlight inverted.
- Tooltips are plain boxes.
- Modal dialogs: title-colour inner border plus title bar.
- Settings looks like a Control Panel list, with the selected label inverted.
- The login card looks like "Element Setup".
- Unread counts show as `(3)`. A mention shows as an inverted box.
- Code is PxPlus IBM VGA, with hljs mapped to VGA colours.
- The spinner is an hourglass.
- No transitions.

### Enhancer (`enhance.ts`)

- Keeps the title in sync: `--w-app-title`, and `--w-dos-prompt` (8.3 name) for cyberpunk.
- Interactive menu bar:

| Menu | Items |
|---|---|
| File | New Room, Properties, Settings, Exit Windows → back to the previous theme |
| Options | Change Theme → quick switcher |
| Window | Threads, Room Info, focus Rooms or composer |
| Help | Contents, Keyboard, About Element… |

- Application control-menu box:
  - Single click opens the system menu: Close = back to the previous theme; Switch To… = theme switcher.
  - Double-click within 452 ms (the WIN.INI `DoubleClickSpeed`) closes, i.e. switches back to the previous theme.
- Help ▸ About opens a Win 3.1 About dialog: "Memory: 640 KB Free".
- Resets stray viewport scrolling: `scrollIntoView` in the timeline could otherwise move the desktop.
- Everything lives in `#tl-overlay-root` and is removed in `unmount()`.

## Per variant

| Variant | Status | Notes |
|---|---|---|
| `win311-default` | done | Windows Default (PCjs-verified). W95FA at its native 12.5px, so pixels are crisp. |
| `win311-usable` | done | 16px type, dither hover, full-row selection, CTL3D fields, own messages on `#C0C0C0`, 2px focus ring, vertical space toolbar, always-visible timestamps. |
| `win311-hotdog` | done | Exact CONTROL.INI values. The edit field is red, as in the scheme. Code is black/yellow. Mention badges wobble ("mustard"). Menus stay white with readable destructive items. |
| `win311-leather` | done | Black Leather Jacket chrome, dithered `#E0E0E0` scrollbar. Dark windows are a documented deviation. |
| `win311-daylight` | done | Ocean / Windows Default / Plasma Power Saver (title text forced white) / Black Leather Jacket. The scheme switch is instant: the loader fade is disabled for this variant. |
| `win311-2030` | done (lighter than spec) | Pixelify Sans, glowing navy desktop, 16px floating frame, soft shadows, gradient active titles, blurred dialog backdrop, frosted dock with hover lift, 160 ms dialog/menu restore animation. Not done: the title shimmer on unread. |
| `win311-cyberpunk` | done | 16 VGA colours, Norton-blue room list, magenta titles, `3px double` cyan box frames, DOS-prompt composer (`C:\ELEMENT\SHOWCASE>`, block caret), CRT scanline and vignette overlay (`pointer-events: none`), title glitch every 20 s, no bold (VGA text mode had none). |

## Fonts

| File | Family (CSS) | Licence |
|---|---|---|
| `w95fa.woff2` | `W95FA` 400. Also tried via `local("MS Sans Serif")`. Native pixel size 12.5px (80 units = 1px). | SIL OFL 1.1, FontsArena (`@fontsource/win95fa@5.3.0`). Licence text: `licenses/OFL-W95FA.txt` |
| `w95fa-overstrike-bold.woff2` | `W95FA` 700. Internal name "W95FA Overstrike Bold". | OFL 1.1, our derivative. W95FA declares no Reserved Font Name; the derivative is renamed anyway. Made by `tools/make-bold.py`: every glyph is OR-ed with itself shifted one font pixel, advance +1px, which is the GDI emboldening the System font look comes from. |
| `pxplus-ibm-vga-8x16.woff2` | `PxPlus IBM VGA 8x16`. Crisp at 16px. | CC BY-SA 4.0. **Attribution:** "The Ultimate Oldschool PC Font Pack" by VileR, https://int10h.org/oldschool-pc-fonts/. Converted WOFF → WOFF2 unchanged. |
| `pixelify-sans-400/700.woff2` | `Pixelify Sans` (2030) | SIL OFL 1.1 (`@fontsource/pixelify-sans@5.3.0`) |

- Proprietary fonts (MS Sans Serif, System, Fixedsys) are never bundled.
- Pixel Operator was dropped in phase B. The overstrike W95FA bold matches the System font better.

## Images

Every SVG is original pixel art made for this project (CC0), generated by `tools/make-assets.py`:
- caption buttons, scroll arrows and thumb, control boxes
- check and option glyphs
- group icons (default, hotdog, neon), room and DM icons
- hourglass
- dithers, desktop patterns, scanline

## Edge cases and checks

`edgecheck.mjs` passes for every variant. Reports are in `tests/reports/`.

| Check | Result |
|---|---|
| Contrast | Pure and usable: 0 failures after fixes. Hotdog's white-on-red is intentional (4.0:1) and stated in the description. |
| Focus | No focus stop without a visible focus indicator, in every variant: dotted rectangle, or 2px plus a ring in usable. |
| Remaining axe items | `nested-interactive`, `scrollable-region-focusable` and `aria-prohibited-attr` come from Element's own DOM, the same as without a theme. |
| Modals, menus, settings, login | Themed. Screenshots 11–17 and 21. |
| Threads, room info, members | Third MDI window. Screenshots 06–08. |
| Code blocks, polls, E2EE shields, unread badges | Themed. Screenshots 03, 05 and 18–19. |
| Long names and RTL | Truncate inside the title bars and room items; IRC column truncates. Screenshot 20. |
| Mobile (390px) | The left panel collapses as in Element. The single room window keeps its frame, and the spaces strip shrinks. Screenshots 22–23. |
| `.tl-ui` | The theme picker and quick switcher stay readable. In cyberpunk the CRT overlay is `pointer-events: none`. |

## Known gaps

- MDI ▼▲ buttons are decorative. The right-panel close button sits next to them.
- The room list is a single column of program items, not a wrapping icon grid, because it is virtualised.
- Nested spaces are hidden in the bottom strip; they can be reached through the space's home.
- 2030: the title shimmer on unread isn't done, and the dock tiles stay small.
- Element's "New login" toast shows in every screenshot; it is themed.
- Pure variants use 12.5px text: authentic and crisp, but small. Use usable, or browser zoom at 200%.
