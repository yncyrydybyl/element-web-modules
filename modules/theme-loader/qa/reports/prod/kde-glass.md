# Edge check: Breeze · Glass

- id: `kde-glass` · stage: `exciting`
- base: https://element.datanauten.de · 2026-11-15T07:23:13.766Z
- loader: html[data-tl-theme] = `kde-glass`
- result: **pass** — axe serious/critical nodes 24 (contrast 2), views with overflow 0, missing/zero-size essentials 0, clipped texts 0, focus stops without visible focus 0, console errors 4

## home

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `.mx_SpaceButton_active` |


## timeline

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 2 | `#\32 0 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


## bubble

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 1 | `.mx_Pill_text` |
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 2 | `#\32 0 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


## irc

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 1 | `.mx_Pill_text` |
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 2 | `#\32 0 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


## thread

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 6 | `#\32 3 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


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
    at a (https://element.datanauten.de/bundles/6f6746b5cdf6799c54d9/6312.js:2:1619319)
    at https://element.datanauten.de/bundles/6f6746b5cdf679`
- `Error encountered in useMap Error: MapStyleUrlNotConfigured
    at a (https://element.datanauten.de/bundles/6f6746b5cdf6799c54d9/6312.js:2:1619319)
    at https://element.datanauten.de/bundles/6f6746b`
