# Edge check: Comic Sans · Evil Party Poster

- id: `comic-poster` · stage: `level-4`
- base: http://localhost:5400 · 2026-11-15T14:58:26.809Z
- loader: html[data-tl-theme] = `comic-poster`
- result: **pass** — axe serious/critical nodes 15 (contrast 4), views with overflow 0, missing/zero-size essentials 0, clipped texts 0, focus stops without visible focus 0, console errors 4

## home

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 1 | `div[data-rbd-drag-handle-context-id="0"]` |


## timeline

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |


## bubble

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 1 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 2 | `#\31 6 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


## irc

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 1 | `.mx_SpaceButton_active` |


## thread

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 4 | `._body_1bd6h_63[data-testid="reply-tile-body"] > .mx_MTextBody._text_1` |
| nested-interactive | serious | 1 | `div[aria-label="Home"]` |
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
