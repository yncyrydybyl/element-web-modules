# openDesk theme family (`opendesk`)

7 variants: `opendesk-light`, `opendesk-dark`, `opendesk-daylight`, `opendesk-usable`, `opendesk-classic`,
`opendesk-2028`, `opendesk-hyperdesk`. Design intent: `docs/styleguides/opendesk.md`; gallery data:
`docs/styleguides/opendesk.json`.

Layout: `shared.css` holds every rule, written against `--od-*` custom properties (defaults = openDesk Light).
Variant files set the properties and add signature rules. `opendesk-dark.css` also serves the night phase of
`opendesk-daylight` (that variant loads it). `enhance.ts` adds the suite top bar / app switcher unless openDesk's own
banner module is configured (then the CSS restyles the banner).

Tested on the dev server (Element 1.12.33) with the harness, and live on openDesk CE v1.19.3
(chat.od.blackpony.club, Element 1.12.29, module API 1.17) with `tools/od-shoot.mjs`.

## Dev tools (not shipped)

- `tools/od-session.mjs` — log the openDesk test user (`.state/opendesk-themetest.txt`, mode 600) into a harness-style
  profile `.state/profiles/themetest@chat.od.blackpony.club/`; `--portal` also screenshots portal/files/webmail.
- `tools/od-shoot.mjs --themes a,b,… [--phase p]` — screenshots on the real openDesk Element → `recordings/opendesk-prod/`.
- `tools/od-probe.mjs` — evaluate JS / screenshot a URL in that session.
- `tools/topbar-test.mjs` — checks the app switcher on the dev server with an injected `apps` config.

## Assets and licences

| file(s) | source | licence |
|---|---|---|
| `open-sans-*.woff2` | Open Sans variable (Google Fonts) via `@fontsource-variable/open-sans` 5.2.5, latin + latin-ext + latin italic | SIL OFL 1.1 (`LICENSE-OFL-open-sans.txt`) |
| `space-grotesk-*.woff2` | Space Grotesk variable via `@fontsource-variable/space-grotesk` 5.2.5 | SIL OFL 1.1 (`LICENSE-OFL-space-grotesk.txt`) |
| `od-wordmark.svg`, `od-wordmark-inverted.svg`, `od-logo.svg`, `od-app-*.svg`, `od-login-background.webp` (from `background.jpg`, resized) | openDesk deployment repo v1.19.3 `helmfile/files/theme/` | repo Apache-2.0; "openDesk" name and logo are ZenDiS marks (real branding allowed for this internal project) |
| `od-classic-wordmark-white.svg` | openDesk deployment v0.3.0 `theme.yaml` `logoHeaderSvgWhite` (2023) | as above |

## Known gaps

- On openDesk the bar's app menu is openDesk's banner module (its content comes from the Intercom Service); on
  od.blackpony.club it showed "Failed to load data from Univention" for the test user in headless Chrome — a
  pre-existing ICS/third-party-cookie issue, not caused by the theme (same with Element default).
- Calls/widgets (iframes) only follow light/dark.
- In some harness runs Mira's avatar image did not load (broken-image icon in the space column) while it loaded in
  others with the same CSS — a media fetch race in the run, not a styling problem.
