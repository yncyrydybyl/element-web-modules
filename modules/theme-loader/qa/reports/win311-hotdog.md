# Edge check: Windows 3.11 · Hot Dog Stand

- id: `win311-hotdog` · stage: `exciting`
- base: http://localhost:5400 · 2026-11-15T04:21:17.642Z
- loader: html[data-tl-theme] = `win311-hotdog`
- result: **pass** — axe serious/critical nodes 33 (contrast 13), views with overflow 0, missing/zero-size essentials 0, clipped texts 6, focus stops without visible focus 0, console errors 4

## home

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `.mx_SpaceButton_active` |


## timeline

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |

- clipped (vertical): `button._avatar_va14e_8.mx_BaseAvatar[aria-label="Open room settings"]` “S”

## bubble

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 2 | `#\31 6 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |

- clipped (vertical): `button._avatar_va14e_8.mx_BaseAvatar[aria-label="Open room settings"]` “S”

## irc

| axe rule | impact | nodes | example |
|---|---|---|---|
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |

- clipped (vertical): `button._avatar_va14e_8.mx_BaseAvatar[aria-label="Open room settings"]` “S”

## thread

| axe rule | impact | nodes | example |
|---|---|---|---|
| aria-prohibited-attr | serious | 4 | `span[title="@themes-mira:datanauten.de"][data-color="3"][aria-label="P` |
| nested-interactive | serious | 2 | `div[aria-label="Home"]` |
| scrollable-region-focusable | serious | 4 | `#\34 2 > ._slotBody_t6spj_104[data-testid="event-tile-slot-body"] > .m` |

- clipped (vertical): `button._avatar_va14e_8.mx_BaseAvatar[aria-label="Open room settings"]` “S”

## settings

axe: no violations

- clipped (vertical): `button._avatar_va14e_8.mx_BaseAvatar[aria-label="Open room settings"]` “S”

## modal

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 9 | `#mx_Field_2` |

- clipped (vertical): `button._avatar_va14e_8.mx_BaseAvatar[aria-label="Open room settings"]` “S”

## login

| axe rule | impact | nodes | example |
|---|---|---|---|
| color-contrast | serious | 4 | `a[href$="blog"]` |


## Console errors

- `Warning! Not using an encryption key for rust crypto store.`
- `'map_style_url' missing from homeserver .well-known area, and missing from from config.json.`
- `Failed to render map Error: MapStyleUrlNotConfigured
    at a (http://localhost:5400/bundles/15abcc1153d692ae1ae9/6312.js:2:1619320)
    at http://localhost:5400/bundles/15abcc1153d692ae1ae9/5195.js:1`
- `Error encountered in useMap Error: MapStyleUrlNotConfigured
    at a (http://localhost:5400/bundles/15abcc1153d692ae1ae9/6312.js:2:1619320)
    at http://localhost:5400/bundles/15abcc1153d692ae1ae9/51`
