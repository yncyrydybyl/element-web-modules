# Edge check: Windows 3.11 · Windows Default

- id: `win311-default` · stage: `pure`
- base: https://element.datanauten.de · 2026-11-15T10:26:03.050Z
- loader: html[data-tl-theme] = `win311-default`
- result: **pass** — axe serious/critical nodes 22 (contrast 1), views with overflow 0, missing/zero-size essentials 0, clipped texts 6, focus stops without visible focus 1, console errors 4

## home

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `.mx_SpaceButton_active` |


## timeline

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 2 | `#\32 0 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |

- clipped (vertical): `button._avatar_va14e_8.mx_BaseAvatar[aria-label="Open room settings"]` “S”

## bubble

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 2 | `#\32 0 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |

- clipped (vertical): `button._avatar_va14e_8.mx_BaseAvatar[aria-label="Open room settings"]` “S”

## irc

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 2 | `#\32 0 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |

- clipped (vertical): `button._avatar_va14e_8.mx_BaseAvatar[aria-label="Open room settings"]` “S”

## thread

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 5 | `#\32 3 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |

- clipped (vertical): `button._avatar_va14e_8.mx_BaseAvatar[aria-label="Open room settings"]` “S”

## settings

axe: no violations

- clipped (vertical): `button._avatar_va14e_8.mx_BaseAvatar[aria-label="Open room settings"]` “S”
- no visible focus on 1/12 Tab stops: `div[aria-label="Send an unencrypted message…"]`

## modal

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 1 | `#radix-_r_uj_` |

- clipped (vertical): `button._avatar_va14e_8.mx_BaseAvatar[aria-label="Open room settings"]` “S”

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
