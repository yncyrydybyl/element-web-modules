# Edge check: Enlightenment · Current

- id: `e-current` · stage: `pure`
- base: http://localhost:5400 · 2026-11-15T15:08:39.780Z
- loader: html[data-tl-theme] = `e-current`
- result: **pass** — axe serious/critical nodes 20 (contrast 0), views with overflow 0, missing/zero-size essentials 0, clipped texts 0, focus stops without visible focus 1, console errors 4

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
| scrollable-region-focusable | serious | 2 | `#\31 5 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


## irc

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |


## thread

| axe rule | impact | nodes | example |
|---|---|---|---|
| aria-prohibited-attr | serious | 4 | `span[title="@themes-mira:datanauten.de"][data-color="3"][aria-label="P` |
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 4 | `#\33 9 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


## settings

axe: no violations

- no visible focus on 1/11 Tab stops: `div[aria-label="Send an unencrypted message…"]`

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
