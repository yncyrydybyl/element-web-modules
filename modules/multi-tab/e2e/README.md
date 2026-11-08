# multi-tab e2e

Playwright (chromium) harness for the multi-tab module. One `BrowserContext` holds N pages: N Element tabs of the
same user that share localStorage, IndexedDB, Web Locks and `BroadcastChannel`, which is the multi-tab case. The
peer user runs stock Element (real Rust crypto) in a second context and sends plain and encrypted messages through
its own `MatrixClient`. All client traffic goes through a logging proxy, and the invariants are checked against
that log.

## Files

| file | what |
|---|---|
| `proxy.mjs` | reverse proxy without dependencies: `--target URL --port N [--log file]`. Passes everything through, including CORS, streaming and long-polls. Writes one JSON line per request: `{ts, end, method, path, since, timeout, tokenSuffix, status, durMs, bytes, aborted?, nextBatch?}` |
| `stack.sh` | local stack: Synapse 18460 (`mt.test`, alice/bob, space "MT Team" with 30 plain rooms "Room N" and 10 megolm rooms "Enc N"), proxy 18461, Element v1.12.33 with the module on 5795, stock Element on 5796. Both Elements use the proxy as `base_url`. Room ids go to `.run/stack.json` |
| `bpc.mjs` | provisioning on the BPC ESS test server, plus a local Element on 5797 behind proxy 18462 |
| `harness.mjs` | `Harness`: session injection, tabs, roles, rooms and messages, peer, evidence (proxy log, per-tab requests) and checks |
| `run.mjs` | scenarios T1–T18, chaos mode, stock self-test |

## Run (local)

```sh
cd modules/multi-tab
pnpm install && pnpm build          # playwright is a devDependency; once: npx playwright install chromium
e2e/stack.sh up                     # idempotent; run it again after lib/ first appears (the container must remount it)
node e2e/run.mjs --stock            # harness self-test on stock Element (no module)
node e2e/run.mjs T1 T2 T3 T4        # selected scenarios (stops at the first failure unless --keep-going)
node e2e/run.mjs all                # T1..T18 without the 6.5 min T8 (add --long)
node e2e/run.mjs --tabs 10 --duration 120   # chaos
e2e/stack.sh down
```

Options: `--headed`, `--keep-going`, `--target bpc`, `--t8-minutes N`, `--deployed` (bpc-live: test the module chat.blackpony.club serves instead of `lib/`), `--takeover-limit S` (T17/T17b, default 50),
`--browser chromium|firefox|webkit`. Results, screenshots, per-tab requests, console output and the proxy excerpt for
each run go to `e2e/.run/results-<time>/`.

## Boot time (`bootMs`)

`bootMs` is measured in the page. An init script on the main user's context watches the DOM with a
`MutationObserver` and stores `performance.now()` in `window.__mtBoot` when the first room tile
(`.mx_RoomListItemView` / `.mx_RoomTile`) appears. That is milliseconds since the navigation start of that document,
so it is the same whether the harness waited for the tab or looked at it much later (chaos mode opens tabs with
`wait: false` and only checks them in the settle loop). The script also reports the value to the harness, which fills
`bootMs` for incarnations nobody waited for, e.g. promotion reloads during chaos.

The harness's own clock (from the navigation request until `waitForRoomList` notices the room list and a syncing
client) is the fallback. It is used when the page has no value, and when the wait started more than 1 s after the
navigation (e.g. T13's re-login in an already loaded page). Each incarnation keeps both: `bootMs` (field name
unchanged in `results.json`), plus `harnessBootMs`, `pageBootMs` and `bootSource: "page" | "harness"` in the harness.

Rebuilding `lib/index.js` needs no restart, because Element loads it on every page load. The Element image adds
every directory mounted under `/modules` to `config.json` itself, so the config lists no modules (listing it there
as well loads the module twice).

## Browser matrix (HANDOVER §10.3)

`--browser firefox` or `--browser webkit` runs the same scenarios in Playwright's bundled Firefox or WebKit
(install once with `npx playwright install firefox webkit`). The tabs and the peer use the chosen browser.
CDP exists only in Chromium, so on the other browsers:

- `crashTab` and `killTab` become `page.close({ runBeforeUnload: false })`. The Web Lock is still released, so the
  promotion path is exercised, but not an actual renderer crash.
- T7 (CDP freeze) is reported as SKIP.

```sh
node e2e/run.mjs --browser firefox T1 T2 T3 T4 T5 T13 T16 --keep-going
node e2e/run.mjs --browser webkit  T1 T2 T3 T4 T5 T13 T16 --keep-going
```

## Session injection (no login UI, works with MAS)

Each run logs in with `m.login.password` directly at the homeserver, which gives a fresh device. On MAS servers
this is MAS's compat login. Before Element boots, the harness writes the session into the Element origin's
localStorage: `mx_hs_url` (the proxy), `mx_user_id`, `mx_device_id`, `mx_is_guest=false` and `mx_access_token`.
`Lifecycle.getStoredToken()` reads `mx_access_token` from localStorage when IndexedDB has no token and migrates it
there itself. Without a pickle key, the plain string is used as is. The session counts as not fresh, so Element
shows a "Verify this device" toast instead of the blocking "Confirm your identity" screen. The popup handlers
dismiss that toast. The devices are logged out when the run ends. This was verified on stock v1.12.33.

## Scenarios (HANDOVER §10.2)

Every module scenario ends with `invariants()`, which checks:

- the proxy never sees two overlapping `/sync` requests for the session's token (I1)
- no `/sync` request leaves a tab while it is a mirror (I1)
- no `/keys/*`, `/sendToDevice`, `/room_keys/*` or `/dehydrated_device` request leaves a mirror (I2)

Requests are attributed to a tab by `page.on('request')`. Each document load of a tab is an "incarnation" with its
own role. A `since` token reused by two successful `/sync` requests is reported as a note, not a failure.

| id | asserts |
|---|---|
| STOCK | injection restores the session, the second stock tab shows "Element is open in another window", the peer's encrypted message decrypts, a UI send decrypts at the peer, the proxy log has the `/sync` chain with `nextBatch` |
| T1 | B shows the room list (no lock screen), roles engine/mirror, B sends no `/sync` |
| T2 | the peer's plain message reaches A and B (latency recorded) |
| T3 | encrypted message: plaintext in A and B (model and DOM), no `/keys/*` from B |
| T4 | B sends encrypted from the UI; A and the peer decrypt it; `PUT /send/m.room.encrypted` comes from B; `/keys/claim` and `/sendToDevice` come only from A |
| T5 | close A: B becomes the engine within 10 s, reloads exactly once, sends `/sync`; a new tab C attaches as a mirror; plain and encrypted messages reach B and C |
| T5b | 4 tabs, crash the engine (`Page.crash`): exactly one engine, exactly one promotion, no tab reloads twice within 30 s, every remaining tab gets a new plain and encrypted message |
| T6 | a draft typed in B survives B's promotion reload |
| T7 | like T5, with A "frozen" (`Page.setWebLifecycleState frozen`) and then closed through `Target.closeTarget`. Chromium ignores the freeze for a visible page (headless pages are all visible: A keeps syncing), so this tests the close; T17 tests a tab that really stops |
| T8 (`--long`) | B stays open past the 5 min store-save interval: no reload/resync, and B writes nothing to the sync store (spy on worker commands and `IDBObjectStore` writes) |
| T9 | B runs a different Element build: its platform's `getAppVersion()` is patched, so the module's fingerprint differs. B must not become a mirror and shows Element's lock screen |
| T10 | same-origin tab whose `config.json` has no modules shows Element's own lock screen (I7) |
| T11 | locally skipped (needs a refreshable MAS session). Real test: `--target bpc-live`, see below |
| T12 | opens the encryption settings in B and starts verification: a "Do this in your main tab" toast appears, no `/keys/*` from B |
| T13 | logout in B: one tab shows the login, the other multi-tab's signed-out notice, none the lock screen, and the proxy sees no request with the dead token after 5 s. Then the login tab signs in again through Element's password form: it becomes the engine without reloading, the waiting tab reloads into a mirror. On `--target bpc`/`bpc-live` the re-login half is skipped with the note "SKIP (MAS login)", because MAS (OIDC) has no Element password form. The logout half's checks still run |
| T14 | 10 reloads of mirror B: median boot under 1.5 × the stock warm-boot median, no extra reloads |
| T15 | speed-start (served from `../speed-start/lib`) plus multi-tab: the overlay appears in mirror B and hands over |
| T16 | the peer's room key is held back (its `sendToDevice/m.room.encrypted` is captured and answered with 200): A and B show a UTD. After the key is replayed, both show the plaintext and B does not reload |
| T17 | A engine, B and C mirrors; A hangs: a busy loop blocks its main thread for the limit + 20 s (`hangTab`), so it answers nothing and doesn't sync, then wakes by itself. One of B/C reports role `engine` within `--takeover-limit` (50 s; watchdog: ping every 15 s, 5 s timeout, retry after 5 s, 3 misses), shows the room list, and the other is a mirror with the room list whose `__multiTab.tabs()` names the new engine. Plain and encrypted messages reach both. Once A wakes: 5–15 s after that A sends no `/sync` and is not an engine, then it is closed; the invariants (no overlapping `/sync` in the proxy log) cover the whole run. Records `takeoverMs`, `attachMs`. All browsers |
| T17b | A engine alone, hung as in T17; a new tab D opens right away. D becomes the engine within the limit (the probe gives up after 45 s and takes over from a same-build engine), never reports role `off`, shows the room list and gets new messages. A is retired as in T17. Records `takeoverMs`. Chromium and WebKit: Firefox doesn't load D at all while A hangs (Element's service worker holds the navigation until A is free) |
| T18 | A engine, B and C mirrors. B opens Settings → Preferences (dispatch `view_user_settings` / `USER_PREFERENCES_TAB`, UI fallback). The section `#de-datanauten-multi-tab-tabs` in `#mx_tabpanel_USER_PREFERENCES_TAB` lists 3 `li[data-tab-id]`, exactly one `data-role="engine"` (A's `tabId`), `data-this="true"` only on B, and `__multiTab.tabs()` returns the same `{tabId, role, isThis}` list. After C closes, the list shows 2 rows within 10 s (`listUpdateMs`). Screenshots: `T18/t18-tabs.png`, `T18/t18-tabs-after-close.png`. Rings: A, B and C each get a `data-mt-ring` on the avatar in `.mx_UserMenu`, all different, each matching that tab's `data-mt-colour` dot in the list; A and B keep theirs after C closes; with A alone its ring goes. Screenshot `T18/t18-ring-B.png` |
| T19 | As T5, with `config.json` listing the module twice (Element Pro's server repeats every configured module, and Element creates one instance per entry). Every page load logs "Already loaded in this page" once, roles, promotion and decryption are as in T5. All browsers |
| chaos | `--tabs N --duration S`: random close, crash, engine kill, open and reload while the peer sends alternating encrypted and plain messages. At the end every tab reaches the room list, there is exactly one engine and the rest are mirrors, every tab has every message decrypted (scrolling back if needed), and the invariants hold. Boot times by role are recorded |

## Black Pony Club (ESS: Synapse + MAS)

Read `~/projects/blackponyclub/services/bpc-ess/agents/AGENTS.md`. The agent id is `multitab`, and all accounts and
rooms carry it as a prefix.

```sh
source ~/projects/blackponyclub/services/bpc-ess/agents/.state/mas-admin.env   # admin-api backend, never print it
node e2e/bpc.mjs seed --rooms 40 --spaces 2 --encrypted 10 --new   # fresh accounts multitab-{main,peer}-<hex>
node e2e/bpc.mjs seed --rooms 1000 --spaces 10 --encrypted 50      # grows/resumes the current set (429 back-off)
node e2e/bpc.mjs status
node e2e/bpc.mjs up                                                # proxy :18462 -> matrix.blackpony.club, Element :5797
node e2e/run.mjs --target bpc T1 T2 T3 T4
node e2e/bpc.mjs down; node e2e/bpc.mjs cleanup [--all]            # deactivate our accounts
```

No passwords or tokens are written to disk. Every `seed` and every `--target bpc` run sets a new random password
through the MAS admin API and keeps it in memory, so a sourced `mas-admin.env` is needed for runs too. Encrypted
rooms get no seed messages, because a fresh device could not decrypt history anyway. Tests send encrypted messages
live from the peer's Element.

## Live deployment: T11 with a real MAS OAuth login (`--target bpc-live`)

MAS rejects dynamic client registration for `http://127.0.0.1` redirect URIs. So T11 runs against the real
https://chat.blackpony.club, and the module is injected into the Playwright context:

- `config*.json` is routed to add `/modules/multi-tab/index.js?v=<hash>`.
- That same-origin URL is fulfilled from `lib/index.js`, so the CSP allows it.

```sh
source ~/projects/blackponyclub/services/bpc-ess/agents/.state/mas-admin.env
node e2e/run.mjs --target bpc-live                # options: --skip-subs --ttl S --ttl-margin S --keep-accounts
node e2e/bpc.mjs cleanup --live --all             # only if a run died before its own cleanup
```

Each run does the following:

1. Creates fresh accounts `multitab-l{main,peer}-<hex>` and five rooms (two plain, three encrypted). Live sets are
   tracked in `.run/bpc-live-state.json`, separately from the long-running seed state.
2. Logs in through MAS in tab A (`#/login` → Continue → username and password → Continue → consent), then opens
   B and C.
3. Runs T1–T4 and T16 on that session.
4. Waits until MAS's `expires_in` (300 s) plus `--ttl-margin` (90 s) has passed since the login, while the peer
   posts every 30 s.
5. Asserts from per-tab request recording (homeserver and MAS origins):
   - exactly one `grant_type=refresh_token` POST to `/oauth2/token`, from the engine, with status 200
   - no MAS request from a mirror
   - receive, decrypt and send still work in the mirrors
   - no logout
6. Closes every tab and opens two new ones, which must start logged in and decrypt.
7. Deactivates both accounts.

Element Pro on chat.blackpony.club is v1.12.29 with module API engine 1.17.0. The module declares
`^1.0.0 || ^2.0.0`, so it loads there without help.

`--api-shim` is optional and not needed for BPC. It is for deployments whose module API engine is older than the
module's declared range. It widens `moduleApiVersion` to `^1.0.0 || ^2.0.0` in the bytes served to the browser,
so it is an experiment, not the shipped build.
