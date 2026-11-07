# Space & room map module for Element Web

Press <kbd>Ctrl</kbd>+<kbd>I</kbd> (<kbd>⌘</kbd>+<kbd>I</kbd> on macOS) to get a zoomable 2D map of your spaces and rooms. Spaces are circles that contain their rooms and sub-spaces; or, in the **Tube map** tab, lines with their rooms as stations. Your spaces are listed on the left: point at one (or move to it with the arrow keys) and the map flies there. Type to find a room, <kbd>Enter</kbd> to open it. It's an alternative to Element's <kbd>Ctrl</kbd>+<kbd>K</kbd> search that shows where everything is.

| Key / action | Does |
| --- | --- |
| <kbd>Ctrl</kbd>+<kbd>I</kbd> | Open / close. In the composer, with text selected, Ctrl+I still makes the text italic |
| **Circles** / **Tube map** tabs | Switch between the two maps; the choice is remembered on this device, and each map reopens where you left it (until Element reloads) |
| Point at a space in the list, or <kbd>↑</kbd> <kbd>↓</kbd> | The map flies to that space and outlines it. **All spaces** at the top zooms back out to everything. Below it, each space with its sub-spaces indented, how many rooms it has (through its sub-spaces) and their unread messages, then the rooms outside any space and your DMs |
| <kbd>Enter</kbd> or click in the list | Open the space's home (or the room, for a search result) |
| Type | Search room and space names and aliases; the list shows the results, matches light up on the map and the camera flies to the selected one |
| Hover a room or space on the map | Tooltip with its name, type, member or room count, where it sits, unread messages and mentions, and what a click does |
| <kbd>Esc</kbd> | Clear the search, then close |
| Click a room | Open it |
| Click a space circle | Zoom into it; click it again to open the space's home |
| Click the background | Zoom out to everything |

Rooms show their avatar (for a DM without one, the other person's), otherwise their district's colour (or, with **Colours: By room**, their own colour as in Element). Unread rooms have a green ring, glow and count badge; rooms that mention you a red one, and they pulse, visible at any zoom. While anything is unread, read rooms are paled so the rest stands out. Space circles carry the unread count of everything inside them. The list on the left shows unread spaces in bold with their count. The room you're in has a dark ring, and the room or space selected in the list is outlined blue. Space circles are tinted with their district's colour (by room: their space's avatar colour); district colours avoid green and red, which mean unread messages and mentions. Names fade in as you zoom, and the camera flies (zooms out, pans, zooms in) to what you pick. Glows, tints, the dot grid and the vignette are off in high-contrast themes, animations with reduced motion. The **Legend** in the corner of the map explains the rings and colours; it can be folded away.

On opening, the map starts on the room you're in and zooms out to everything; choosing a room zooms into it while the map fades away. Closing only hides the map, so it opens again at once, back where you left it, with today's unread counts. While it's open, counts update live and a room with a new message lights up with a ring that grows and fades.

### Settings

**Settings → Preferences → Space map**, right after Element's own "Spaces" settings. Saved in account data (`de.datanauten.space_room_map.settings`), so they follow you to every device.

| Setting | Default | Does |
| --- | --- | --- |
| Colours | By district | **By district**: one colour per district. **By room**: each room's own colour, as in Element's avatars |
| Animations | On | Zoom out from your room on opening, into a room when you choose it. Always off when the system asks for reduced motion |
| Live updates | On | Unread counts update while the map is open; rooms with new messages light up |
| Keep the map ready | On | Closing only hides the map (instant reopening). Off: it's built again on every opening, using no memory in between |
| Keep avatars between sessions | On | Avatar thumbnails are kept in the browser's Cache Storage, so a reload doesn't fetch them again. Turning it off deletes them |

### Districts

Every room has one home, in one of six districts that always sit in the same place, so you learn where things are: **Communities** (your spaces, each a group) in the middle, **Events** (spaces and rooms about a conference, camp, congress …, even inside a bigger space), **People** (DMs, rooms of two, and small private group chats, by network: Matrix, WhatsApp, Telegram, Signal …; Matrix chats quiet for half a year apart), **Bridges** (bridged group chats, by network), **Unsorted** (rooms outside any space: next to a space they're named after, else grouped by a shared name prefix or server) and **Archive** (deleted, test and nameless rooms, and rooms only you are in, faded). Spaces whose rooms all live elsewhere (a bridge's space, say) are under Unsorted › Other spaces. The list on the left follows the same structure: district, group, sub-spaces. The grouping is in `src/districts.ts`.

### Tube map

Every space is a line, its rooms are the stations. A sub-space is an interchange on its parent's line, where its own line branches off. Each top-level space with its branches is a block, named at its top left; long lines wind back and forth within the block (longer ones in longer rows, so a 600-room space comes out square rather than as a tower), and the blocks are packed into columns to fill the screen, big ones spanning several. Spaces without any rooms get no line of their own: a sub-space stays an interchange on its parent's line, top-level ones are stations on a grey "Spaces without rooms" line. A room that's in several spaces is an interchange: linked to its other stations where they're close, and pointing at it lights up all its stations, with the other lines in the tooltip. Rooms outside any space and DMs are grey dotted lines. Pointing at a space in the list flies to its line and pales the others; clicking a line, its name or a sub-space interchange does the same, and a second click opens the space. Zoomed far out, lines keep their width on screen and station names are hidden (unread ones stay longer); rooms that mention you keep a pulsing beacon with their count at any zoom.

## How it's built

- **[sigma.js](https://www.sigmajs.org/) 3** renders the map with WebGL: zoom, pan, hover, label placement and hit testing. Hovering doesn't redraw nodes on top (sigma's default), which would cover a space's rooms; the tooltip shows what's under the pointer instead.
- Each room is drawn in three layers: a soft glow (a small custom WebGL program, `src/ui/programs.ts`), the avatar ([`@sigma/node-image`](https://www.npmjs.com/package/@sigma/node-image)) and the status ring with a gap ([`@sigma/node-border`](https://www.npmjs.com/package/@sigma/node-border)). Labels are drawn by the module and fade in with size, so they don't pop in and out while zooming.
- The tube map is SVG (`src/ui/TubeMap.tsx`), laid out by `src/tube.ts`: a line's sub-spaces come first, so their branches drop down on the left past the line's later rows, and the branch that leaves furthest right is placed nearest, so no drop crosses a line of its tree. Panning and zooming set one transform directly, without re-rendering React; block names and mention beacons sit in a layer of fixed screen size above it.
- Camera flights follow van Wijk & Nuij's smooth zoom path (as in `d3.interpolateZoom`), `src/ui/camera.ts`.
- **[graphology](https://graphology.github.io/)** holds the graph, laid out with **[d3-hierarchy](https://d3js.org/d3-hierarchy)** circle packing.
- **[match-sorter](https://github.com/kentcdodds/match-sorter)** ranks search results (prefix > word start > substring > acronym > fuzzy), with ties going to the rooms you use most.
- The space hierarchy comes from Element's own matrix-js-sdk client (`window.mxMatrixClientPeg`): `m.space.child` events, `m.direct` for DMs, unread counts. The module API only exposes a flat room list without spaces. If the client isn't reachable, the module falls back to that flat list.
- Avatar thumbnails (96 px) are fetched by the module with the access token, from the authenticated media endpoints (Matrix 1.11) or else the legacy ones, and shown as `blob:` URLs. An `<img>` or WebGL texture can't send the token itself. They load in the background, the list's first, and (with "Keep avatars between sessions") are stored in Cache Storage (`de.datanauten.space_room_map.avatars`) for the next session.
- The kept map is rebuilt only when the rooms, their names, avatars, places in spaces or Element's theme changed (`graphSignature` in `src/index.tsx`); otherwise only unread counts are copied in, and sigma redraws. Live updates read just the counts (`updateCounts`) after Element's `sync` events, at most every 400 ms.
- Each opening logs how long it took to the console (debug level): `[space-room-map] Opened in 18 ms (kept, 3100 rooms)`.
- The settings section is put into Element's Preferences tab by watching the DOM (`src/settingsInjector.ts`): the module API has no settings extension point.
- "Most used" counts how often you open each room (from the URL), with a 14-day half-life, in localStorage on this device, plus recent activity and unread messages.

Opening the map with ~3,100 rooms in 120 spaces takes about 110 ms to the first frame (Chromium, laptop).

## Requirements

- Element Web or Element Desktop with module API **≥ 2.0.0** (Element Web v1.12.x).
- WebGL. Without it, the search list still works but the map stays empty.
- The build is one ES module file (~382 kB, 95 kB gzipped; most of it is sigma and graphology) that reuses Element's React.

## Installation

Same as the other modules in this repository; see the [root README](../../README.md#using-a-module) and [keyboard-shortcuts/docs/deployment.md](../keyboard-shortcuts/docs/deployment.md).

```sh
pnpm install
pnpm build          # → lib/index.js
```

## Configuration

Optional, under `de.datanauten.space_room_map` in `config.json`:

```json
{
    "de.datanauten.space_room_map": {
        "trigger_key": "Mod+I"
    }
}
```

| Option | Default | Meaning |
| --- | --- | --- |
| `trigger_key` | `"Mod+I"` | Combo that opens the map. `Mod` is ⌘ on macOS and Ctrl elsewhere; also `Ctrl`, `Meta`/`Cmd`, `Alt`/`Option`, `Shift`. Letters match by physical key too, so it works on non-Latin layouts. |

## Limitations

- **Ctrl+I is Element's italic shortcut.** The module takes it, except when text is selected in a text field. Pick another `trigger_key` if your users rely on Ctrl+I for italics without a selection.
- **Reads Element internals.** `window.mxMatrixClientPeg` isn't part of the module API. It has been stable for years, but a future Element could drop it; the module then shows a flat room list.
- **Avatars are thumbnails.** Zoomed far into the All view, a big circle shows a 96 px picture, slightly soft.
- **Only joined and invited rooms.** Rooms of a space you haven't joined aren't shown.
- **The settings section depends on Element's markup** (`#mx_tabpanel_USER_PREFERENCES_TAB`, its subsection classes). If Element changes them, the section goes to the end of the tab or doesn't show; the map keeps working with the last saved settings.
- **Kept avatars aren't evicted**, and Element's logout doesn't clear them. They're about 5 kB each; 3,000 rooms take ~15 MB of browser storage, until the setting is turned off.
- **Search ranking uses counts from one device**: how often you open each room is kept in localStorage, to avoid an account-data write on every room switch.

## Development

```sh
pnpm test          # vitest + jsdom: space graph, circle packing, tube layout, search, space list, avatars, legend, tabs, keyboard flows
pnpm lint:types
pnpm build
```

jsdom has no WebGL, so the tests cover everything except sigma's drawing. To see the map, load the build into an Element as described in the keyboard-shortcuts README's development section.

## License

AGPL-3.0-only. See [LICENSE](LICENSE).
