# Edge check: Comic Sans · Casual Friday

- id: `comic-casual-friday` · stage: `level-1`
- base: http://localhost:5400 · 2026-11-15T04:56:11.999Z
- loader: html[data-tl-theme] = `comic-casual-friday`
- result: **pass** — axe serious/critical nodes 15 (contrast 0), views with overflow 0, missing/zero-size essentials 0, clipped texts 0, focus stops without visible focus 0, console errors 4

## home

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `.mx_SpaceButton_active` |


## timeline

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |


## bubble

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 2 | `#\31 6 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


## irc

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |


## thread

| axe rule | impact | nodes | example |
|---|---|---|---|
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
