# Tests: fixtures, screenshots, walkthroughs, edge checks

Everything here runs against **real test accounts on the production homeserver `matrix.datanauten.de`**
(`themes-mira` = the recording user, plus `themes-jonas`, `themes-lena`, `themes-theo`). The Element under test is the
loader dev server (`loader/`, default `http://localhost:5400`; `127.0.0.1:5400` is rewritten to `localhost:5400`
because they are different browser origins). If :5400 doesn't answer, the harness falls back to
`https://element.datanauten.de` (no loader, no session there yet → create one with `session.mjs --verify`).

Secrets live only in `.state/` (git-ignored, mode 600): `users.txt` (passwords), `tokens.json` (seeder devices),
`element-*.json` (harness Element devices), `themes-mira.recovery` (recovery key), `xsign-*.json` (cross-signing
seeds of jonas/lena/theo), `nio/` (E2EE stores of the seeder devices). Never print them.

## Quick reference (theme agents)

```sh
export NODE_PATH=~/projects/matrix-search-widget/node_modules      # Playwright 1.62.1
(cd tests/harness && npm install)                                   # once: axe-core

node tests/harness/shoot.mjs      --theme teams-2026-light          # → recordings/screens/<id>/NN-region.png + manifest.json
node tests/harness/shoot.mjs      --theme teams-2026-daylight --phase night   # → recordings/screens/<id>--night/
node tests/harness/shoot.mjs      --theme lcars-tng --only 02,04,05 # subset by prefix
node tests/harness/shoot.mjs      --theme lcars-tng --mobile        # whole set at 390x844 → recordings/screens/<id>/mobile/
node tests/harness/walkthrough.mjs --theme lcars-tng                # → recordings/walkthroughs/<id>.webm (45 s, 1440x900) + .json
node tests/harness/edgecheck.mjs  --theme lcars-tng                 # → tests/reports/<id>.md + .json (exit 1 = FAIL)
tests/harness/grid.sh recordings/grids/lcars.mp4 lcars-tng lcars-voyager lcars-picard lcars-usable   # 2–9 tiles
node tests/harness/shoot.mjs      --theme lcars-tng --hero          # → recordings/screens/<id>/hero.png + thumb.webp
node tests/harness/timelapse.mjs  --theme e-daylight                # → recordings/timelapse/<id>.webm (phases cycle live)
node tests/harness/film.mjs       --clip loader                     # extra takes for the showcase film (loader|rtl|code|modal)
tests/harness/grids.sh                                              # all grids in recordings/grids/
python3 tests/harness/contact.py                                    # recordings/contact/*.png
```

Every run hides Element toasts (CSS from first paint, write-free; `TL_SHOW_TOASTS=1` to see them) and scrolls only
inside the timeline/thread panels (never the app root). `walkthrough.mjs` also writes `<id>.mp4` (H.264, ≤ ~3 MB) and
records per-step lateness in `<id>.json`; `--name` overrides the output basename (daylight: `--phase day --name <id>`).
The sync marker is a full-frame magenta flash detected by chroma, so themes with magenta UI don't confuse trimming.

Common flags: `--base-url URL` (default `http://localhost:5400`), `--user themes-mira`, `--phase <p>` (adds
`tl_phase=`), `--width/--height` (shoot only). `element-default` as theme id = no `tl_theme` param.
`TL_HEADED=1` shows the browser; `TL_BROWSER=chromium` uses Playwright's Chromium instead of the Chrome flatpak;
`TL_KEEP_RUN=1` keeps the run dir.

Each run checks that `html[data-tl-theme]` equals the requested id and warns otherwise (loader not serving the
theme / typo). `?tl_theme=` is never persisted, so runs never change anyone's theme choice.

## Concurrency model (read this before running in parallel)

- **Session slots.** `themes-mira` has 8 Element sessions (= 8 Matrix devices, all cross-signed and holding the
  key-backup secret) on `localhost:5400`: `.state/profiles/themes-mira@localhost_5400[#2|#3|#4]/`, marked usable by
  `tl-ready.json`. A run takes an **exclusive lock** on a free slot (`<profile>.lock/`, atomic mkdir with pid; stale
  locks of dead processes are broken automatically) and uses that profile directly. So no two browsers ever share a
  device's crypto store, and nothing ever creates a new device. With more than 8 parallel runs the extra ones wait
  ("all 8 session slot(s) busy, waiting …", timeout `TL_SLOT_TIMEOUT` ms, default 30 min). Slots are released on exit,
  Ctrl-C and SIGTERM; a `kill -9`'d run leaves a stale lock that the next run breaks.
- If a run was killed, Element's own cross-tab lock may show "Element is open in another window"; the harness clicks
  Continue (safe, because it holds the slot lock).
- **More slots** (if agents keep waiting): `node tests/harness/session.mjs themes-mira --slot 9 --verify` (one new
  device, verified with the recovery key, then marked ready). Do this once, not per run.
- **No shared mutable state between runs:** each run has its own dir `.state/run/<user>-XXXX/` (videos, logged-out
  profile for the login shot), removed afterwards. Output paths are per theme (`recordings/screens/<id>/`,
  `recordings/walkthroughs/<id>.webm`, `tests/reports/<id>.*`); two runs of the *same* theme overwrite each other.
- **No account-data writes:** layouts are switched with device-level settings (`mxSettingsStore … 'device'`) and
  restored at the end; the Themes tab is only opened, never clicked; the Appearance tab is only looked at.
- **Writes the harness does make:** read receipts in the rooms it opens (Showcase, Code Review is not opened,
  Sandbox, DM Jonas); `walkthrough.mjs` sends one message + one 👍 reaction to **Theme Lab · Sandbox** (unencrypted).
- Chrome flatpak needs `--filesystem=.state` (it has a private /tmp); the wrapper is generated in `.state/bin/`.

## Fixtures (`tests/fixtures/seed.py`)

Idempotent: rooms/uploads/events have stable keys recorded in `.state/fixtures.json`; re-running only sends what's
missing. Rate limits on the production server are strict (room creation/joins can wait 5 min per 429); the seeder
just waits.

```sh
python3 tests/fixtures/seed.py all       # everything, in order (safe to re-run)
python3 tests/fixtures/seed.py status    # rooms, event counts, mira's unread counts
python3 tests/fixtures/seed.py unread    # re-create unread/highlight state for mira (after it got cleared)
python3 tests/fixtures/seed.py history [room-key …]   # (re)send missing timeline events
```

Steps of `all`: `login` (one "Theme Lab seeder" device per user, token in `.state/tokens.json`) → `base`
(display names + avatars, space, rooms, DMs, leave non-fixture rooms such as `#welcome`) → `session.mjs themes-mira
--bootstrap` (Element: cross-signing + recovery, key in `.state/themes-mira.recovery`) → `xsign` (cross-signing for
jonas/lena/theo created in Python, every seeder device signed, mira signs the others' master keys = "verified
users") → `history` (E2EE rooms are sent through matrix-nio from the seeder devices; the script re-execs under
`TL_NIO_PYTHON`, default the matrix-commander Homebrew venv) → `unread` → `session.mjs --sync`.
Media are pre-generated in `tests/fixtures/assets/` by `make-assets.sh` (ImageMagick + ffmpeg).

Space **Theme Lab** (all rooms carry the `de.datanauten.theme_lab` creation flag + `de.datanauten.theme_lab.fixture`
state event; topics end in "[Theme Lab test fixture]"):

| key | room | E2EE | content |
|---|---|---|---|
| showcase | Showcase | no | the busy room: plain/long text, markdown (bold/italic/strike, lists, quote, headings, table, hr), code blocks (python, ts, css, rust, plain) + inline code, links with URL previews, user pills, @room, replies, a 14-reply thread, 13 different reactions + multi-user 👍, edit, redaction, 2 polls (open + ended), 3 images (landscape, palette, tall), PDF + JSON files, voice message, location, sticker, spoiler, emoji-only, emote, notice, mixed RTL, read receipts |
| design | Design Crit | yes | crit chat, encrypted image, reply, reactions, **unread + mention of Mira** |
| code | Code Review | yes | diff/json/bash code, thread with 5 replies, edit |
| release | Release Train 🚂 | yes | announcements, **unread @room** |
| coffee | Coffee ☕ | yes | open poll, emoji, **unread (no highlight)** |
| rtl | العربية · עברית · RTL | no | Arabic + Hebrew paragraphs, RTL list and quote |
| long | An Exceedingly Long Room Name … IRC Columns | no | rename/topic/leave/join state events, very long per-room display names |
| sandbox | Theme Lab · Sandbox | no | target of walkthrough messages |
| dm-jonas / dm-lena / dm-theo | DMs (Jonas Brandt, Lena Sørensen, Theo Nakamura-Whitfield) | yes | short chats; Lena + Theo unread |

The harness opens Showcase, Sandbox and the Jonas DM, so unread state lives in the other rooms. If badges are gone,
run `seed.py unread`.

## Screenshot set (`shoot.mjs`)

`01-home-roomlist` · `02-timeline-modern` · `03-timeline-content` (markdown/code) · `04-timeline-bubble` ·
`05-timeline-irc` · `06-thread-panel` · `07-room-info` · `08-member-list` · `09-composer-autocomplete` ·
`10-emoji-picker` · `11-message-menu` · `12-tooltip-reactions` · `13-user-menu` · `14-settings-appearance` ·
`15-settings-themes` · `16-modal-create-room` · `17-room-settings` · `18-e2ee-dm` · `19-e2ee-user-verified` ·
`20-long-names-rtl` (IRC layout in the long-name room) · `21-login` (separate logged-out browser) ·
`22-mobile-roomlist` · `23-mobile-timeline` (390x844). `manifest.json` lists failures, warnings and console errors;
exit code 1 if any shot failed (a screenshot is still written for failed steps).

## Walkthrough (`walkthrough.mjs`)

Fixed schedule from journey start (t=0 is the first frame; Element's load time is cut using a magenta sync frame
detected in the raw video): 0 s Theme Lab space home · 1.5 hover rooms · 4 open Showcase · 7 scroll up · 12.5 back to
thread root · 14.5 open thread · 21 open Sandbox · 24 type "Hello from <theme name> 👋" · 28 send · 30 react 👍 (emoji
picker search) · 35 user menu → All settings → Themes · 39 scroll gallery · 42.5 close · 45 end. Under heavy machine
load a step can start late (logged as "late by …"); re-record such clips if they must align exactly.
A fake cursor + click ripples are injected (headless renders none).
Steps that run late are logged; the `.json` next to the clip records each step's status.

## Edge checks (`edgecheck.mjs`)

Views: home, timeline (modern), bubble, irc, thread, settings (Themes tab), modal (create room), login.
Per view: axe-core WCAG 2 A/AA (incl. color-contrast), Tab-walk focus visibility (12 stops), horizontal overflow,
essential elements present and non-zero/visible (composer, room header, event bodies, room list items, user menu …),
clipped text without ellipsis, console errors. FAIL = missing/zero-size essentials, horizontal overflow or page
errors (axe/contrast/focus are reported, not failing). Variants with stage `level-5`+ / `invisible` / `unreadable`
are **report-only** (never fail). `--views timeline,irc` limits the run.

## Known gaps

- Only `themes-mira` has harness sessions. Other users need `session.mjs <user>` (+ `seed.py xsign` to sign the new
  device); they have no key backup, so older E2EE history won't decrypt for them.
- Voice message has a waveform but the audio is a synthetic tone; location tiles need a map style in the Element
  config to render a map (otherwise a fallback tile).
- No backdated history (all events are "today"), no calls/widgets, no live location, no LaTeX, no decryption-failure
  tile on purpose.
- URL previews depend on Synapse fetching element.io / spec.matrix.org at render time.
