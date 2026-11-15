# Edge check: Sketch · Unreadable

- id: `sketch-unreadable` · stage: `level-8` · **report-only** (unreadable by design)
- base: https://element.datanauten.de · 2026-11-15T07:49:15.678Z
- loader: html[data-tl-theme] = `sketch-unreadable`
- result: **pass** — axe serious/critical nodes 110 (contrast 88), views with overflow 0, missing/zero-size essentials 0, clipped texts 3, focus stops without visible focus 0, console errors 4

## home

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 12 | `._chat-filter_5qdp0_8[role="option"][aria-hidden="false"]:nth-child(1)` |
| nested-interactive | serious | 2 | `.mx_SpaceButton_active` |


## timeline

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 17 | `._chat-filter_5qdp0_8[role="option"][aria-hidden="false"]:nth-child(1)` |
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 2 | `#\33 4 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |

- clipped (vertical): `div.mx_EventTile_body.mx_MLocationBody` “Unable to load map: This account provider has not ”

## bubble

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 17 | `._chat-filter_5qdp0_8[role="option"][aria-hidden="false"]:nth-child(1)` |
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 2 | `#\33 4 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |

- clipped (vertical): `div.mx_EventTile_body.mx_MLocationBody` “Unable to load map: This account provider has not ”

## irc

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 18 | `._chat-filter_5qdp0_8[role="option"][aria-hidden="false"]:nth-child(1)` |
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 2 | `#\33 4 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |

- clipped (vertical): `div.mx_EventTile_body.mx_MLocationBody` “Unable to load map: This account provider has not ”

## thread

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 20 | `._chat-filter_5qdp0_8[role="option"][aria-hidden="false"]:nth-child(1)` |
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 6 | `#\33 7 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |


## settings

axe: no violations


## modal

axe: no violations


## login

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 4 | `h2` |


## Console errors

- `Warning! Not using an encryption key for rust crypto store.`
- `'map_style_url' missing from homeserver .well-known area, and missing from from config.json.`
- `Failed to render map Error: MapStyleUrlNotConfigured
    at a (https://element.datanauten.de/bundles/6f6746b5cdf6799c54d9/6312.js:2:1619319)
    at https://element.datanauten.de/bundles/6f6746b5cdf679`
- `Error encountered in useMap Error: MapStyleUrlNotConfigured
    at a (https://element.datanauten.de/bundles/6f6746b5cdf6799c54d9/6312.js:2:1619319)
    at https://element.datanauten.de/bundles/6f6746b`
