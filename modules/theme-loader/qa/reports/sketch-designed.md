# Edge check: Sketch · Designed

- id: `sketch-designed` · stage: `level-1`
- base: http://localhost:5400 · 2026-11-15T04:02:27.257Z
- loader: html[data-tl-theme] = `sketch-designed`
- result: **pass** — axe serious/critical nodes 33 (contrast 18), views with overflow 0, missing/zero-size essentials 0, clipped texts 0, focus stops without visible focus 0, console errors 4

## home

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `.mx_SpaceButton_active` |


## timeline

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 3 | `._stateLastInSection_t6spj_1005._root_t6spj_9.mx_EventTile:nth-child(1` |
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |


## bubble

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 3 | `._stateLastInSection_t6spj_1005._root_t6spj_9.mx_EventTile:nth-child(1` |
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 2 | `#\31 6 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


## irc

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 5 | `._stateNoBubble_t6spj_1024._stateLastInSection_t6spj_1005._root_t6spj_` |
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |


## thread

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 7 | `._stateHasReply_t6spj_287._stateLastInSection_t6spj_1005._root_t6spj_9` |
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 3 | `#\31 9 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


## settings

axe: no violations


## modal

axe: no violations


## login

axe: no violations


## Console errors

- `Warning! Not using an encryption key for rust crypto store.`
- `'map_style_url' missing from homeserver .well-known area, and missing from from config.json.`
- `Failed to render map Error: MapStyleUrlNotConfigured
    at a (http://localhost:5400/bundles/15abcc1153d692ae1ae9/6312.js:2:1619320)
    at http://localhost:5400/bundles/15abcc1153d692ae1ae9/5195.js:1`
- `Error encountered in useMap Error: MapStyleUrlNotConfigured
    at a (http://localhost:5400/bundles/15abcc1153d692ae1ae9/6312.js:2:1619320)
    at http://localhost:5400/bundles/15abcc1153d692ae1ae9/51`
