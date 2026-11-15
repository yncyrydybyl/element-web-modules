# Edge check: Comic Sans · Unreadable

- id: `comic-unreadable` · stage: `level-5` · **report-only** (unreadable by design)
- base: http://localhost:5400 · 2026-11-15T03:56:12.764Z
- loader: html[data-tl-theme] = `comic-unreadable`
- result: **pass** — axe serious/critical nodes 26 (contrast 15), views with overflow 0, missing/zero-size essentials 0, clipped texts 0, focus stops without visible focus 0, console errors 4

## home

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 5 | `.mx_HomePage_default_wrapper > h1` |
| nested-interactive | serious | 2 | `.mx_SpaceButton_active` |


## timeline

axe: no violations


## bubble

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 1 | `.mx_SpaceButton_active` |
| scrollable-region-focusable | serious | 2 | `#\31 6 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


## irc

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 1 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 1 | `#\31 6 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


## thread

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 3 | `._repliesAmount_60abi_66` |
| nested-interactive | serious | 1 | `.mx_SpaceButton_active` |
| scrollable-region-focusable | serious | 3 | `#\31 9 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


## settings

axe: no violations


## modal

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 3 | `#mx_Field_2` |


## login

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 4 | `h2` |


## Console errors

- `Warning! Not using an encryption key for rust crypto store.`
- `'map_style_url' missing from homeserver .well-known area, and missing from from config.json.`
- `Failed to render map Error: MapStyleUrlNotConfigured
    at a (http://localhost:5400/bundles/15abcc1153d692ae1ae9/6312.js:2:1619320)
    at http://localhost:5400/bundles/15abcc1153d692ae1ae9/5195.js:1`
- `Error encountered in useMap Error: MapStyleUrlNotConfigured
    at a (http://localhost:5400/bundles/15abcc1153d692ae1ae9/6312.js:2:1619320)
    at http://localhost:5400/bundles/15abcc1153d692ae1ae9/51`
