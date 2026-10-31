# Space & room map module for Element Web

Press <kbd>Ctrl</kbd>+<kbd>I</kbd> (<kbd>⌘</kbd>+<kbd>I</kbd> on macOS) to get a zoomable 2D map of your spaces and rooms. Spaces are circles that contain their rooms and sub-spaces. Your spaces are listed on the left: point at one (or move to it with the arrow keys) and the map flies there. Type to find a room, <kbd>Enter</kbd> to open it. It's an alternative to Element's <kbd>Ctrl</kbd>+<kbd>K</kbd> search that shows where everything is.

| Key / action | Does |
| --- | --- |
| <kbd>Ctrl</kbd>+<kbd>I</kbd> | Open / close. In the composer, with text selected, Ctrl+I still makes the text italic |
| Point at a space in the list, or <kbd>↑</kbd> <kbd>↓</kbd> | The map flies to that space and outlines it. **All spaces** at the top zooms back out to everything. Below it, each space with its sub-spaces indented, how many rooms it has (through its sub-spaces) and their unread messages, then the rooms outside any space and your DMs |
| <kbd>Enter</kbd> or click in the list | Open the space's home (or the room, for a search result) |
| Type | Search room and space names and aliases; the list shows the results, matches light up on the map and the camera flies to the selected one |
| Hover a room or space on the map | Tooltip with its name, type, member or room count, where it sits, unread messages and mentions, and what a click does |
| <kbd>Esc</kbd> | Clear the search, then close |
| Click a room | Open it |
| Click a space circle | Zoom into it; click it again to open the space's home |
| Click the background | Zoom out to everything |

Rooms show their avatar (for a DM without one, the other person's), otherwise their colour. Unread rooms have a green ring and glow, mentions a red one, the room you're in has a dark ring, and the room or space selected in the list is outlined blue. Space circles are tinted with their space's avatar colour. Names fade in as you zoom, and the camera flies (zooms out, pans, zooms in) to what you pick. Glows, tints, the dot grid and the vignette are off in high-contrast themes, animations with reduced motion. The **Legend** in the corner of the map explains the rings and colours; it can be folded away.

## How it's built

- **[sigma.js](https://www.sigmajs.org/) 3** renders the map with WebGL: zoom, pan, hover, label placement and hit testing. Hovering doesn't redraw nodes on top (sigma's default), which would cover a space's rooms; the tooltip shows what's under the pointer instead.
- Each room is drawn in three layers: a soft glow (a small custom WebGL program, `src/ui/programs.ts`), the avatar ([`@sigma/node-image`](https://www.npmjs.com/package/@sigma/node-image)) and the status ring with a gap ([`@sigma/node-border`](https://www.npmjs.com/package/@sigma/node-border)). Labels are drawn by the module and fade in with size, so they don't pop in and out while zooming.
- Camera flights follow van Wijk & Nuij's smooth zoom path (as in `d3.interpolateZoom`), `src/ui/camera.ts`.
- **[graphology](https://graphology.github.io/)** holds the graph, laid out with **[d3-hierarchy](https://d3js.org/d3-hierarchy)** circle packing.
- **[match-sorter](https://github.com/kentcdodds/match-sorter)** ranks search results (prefix > word start > substring > acronym > fuzzy), with ties going to the rooms you use most.
- The space hierarchy comes from Element's own matrix-js-sdk client (`window.mxMatrixClientPeg`): `m.space.child` events, `m.direct` for DMs, unread counts. The module API only exposes a flat room list without spaces. If the client isn't reachable, the module falls back to that flat list.
- Avatar thumbnails (96 px) are fetched by the module with the access token, from the authenticated media endpoints (Matrix 1.11) or else the legacy ones, and shown as `blob:` URLs. An `<img>` or WebGL texture can't send the token itself. They load in the background, the list's first, and are kept until the page reloads.
- "Most used" counts how often you open each room (from the URL), with a 14-day half-life, in localStorage on this device, plus recent activity and unread messages.

Opening the map with ~3,100 rooms in 120 spaces takes about 110 ms to the first frame (Chromium, laptop).

## Requirements

- Element Web or Element Desktop with module API **≥ 2.0.0** (Element Web v1.12.x).
- WebGL. Without it, the search list still works but the map stays empty.
- The build is one ES module file (~318 kB, 77 kB gzipped; most of it is sigma and graphology) that reuses Element's React.

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
- **Search ranking uses counts from one device**: how often you open each room is kept in localStorage, to avoid an account-data write on every room switch.

## Development

```sh
pnpm test          # vitest + jsdom: space graph, circle packing, search, space list, avatars, legend, keyboard flows
pnpm lint:types
pnpm build
```

jsdom has no WebGL, so the tests cover everything except sigma's drawing. To see the map, load the build into an Element as described in the keyboard-shortcuts README's development section.

## License

AGPL-3.0-only. See [LICENSE](LICENSE).
