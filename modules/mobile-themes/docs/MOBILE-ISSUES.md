# Element Web on mobile: issue list

Target: Element Web **1.12.33** as deployed on element.datanauten.de. **Status after the mobile-themes module: §8** (and a status line per issue). Background and full code walk-through:
[`../research/05-mobile.md`](../research/05-mobile.md). Screenshots: `recordings/mobile/<device>/NN-*.png`
(devices `iphone15` 393×659, `iphone15-land` 734×343, `pixel8` 412×839, `pixel8-land` 839×412; Playwright
Chromium device emulation, see research §3 for limits) plus `metrics.json` per device. Code references are
`file:line` at tag v1.12.33 (`apps/web/…`, `packages/shared-components/…`). Upstream = github.com/element-hq/element-web.

**Fixability classes**

| Class | Meaning |
|---|---|
| **CSS** | CSS-only, in `mobile/src/mobile.css` scoped to `html[data-mt-mobile]` |
| **ENH** | CSS + enhancer DOM/JS in the module (event listeners, MutationObserver, attribute toggles, calling Element internals such as `mxDispatcher`/`mxSdkContext` with feature detection). Marked *fragile* when it depends on internals likely to change |
| **API** | needs something the module API (2.3/2.4) doesn't offer |
| **CORE** | needs an Element core change (or, where noted, a server/deploy-side workaround outside the module) |
| **BROWSER** | a browser/platform limit; can be mitigated at most |

Severity: **blocker** (phone users can't do the basic thing), **major** (works but badly / a core flow is hard),
**minor** (cosmetic, edge, or rare).

---

## 1. Entry and platform

### MOB-01 · Mobile UAs are redirected to `/mobile_guide/` before anything loads
- **Area:** platform · **Severity:** blocker · **Fixability:** CORE (server-side workaround possible; module: impossible)
- **Status (mobile-themes 0.1.0):** **proposal** — server-side replacement guide page + MDAD mount, `mobile/README.md` → "Mobile guide redirect"; verified locally with interception, not deployed.
- **Evidence:** `*/00-mobile-guide-redirect.png` (all 4 devices; navigations `/` → `/mobile_guide/`).
  `apps/web/src/vector/index.ts:146-157` (UA sniff, runs before `loadConfig()` `:161` and `loadPlugins()` `:176`).
  Guide text "The desktop site does **not** work on mobile" (`vector/mobile_guide/index.html:34-35`, PR #29211).
  Upstream #21616 "/mobile_guide cannot be disabled" (open), PR #34508 (configurable, closed "needs a product decision").
- **Root cause:** hard-coded UA check; only skipped by a deep link fragment, a 3PID link, or
  `sessionStorage.skip_mobile_redirect`. No config key; modules are fetched later.
- **Approach:** on the server (MDAD nginx / Element container): serve a custom `/mobile_guide/index.html` that sets
  `sessionStorage.skip_mobile_redirect = "true"` and `location.replace("../#/home")`, or a 302 `/mobile_guide/` →
  `/#/home` (upstream's suggested workaround). Optionally keep a link to Element X. The module can then show its own,
  dismissible "get the app" hint. Nothing in the module can do this.

### MOB-02 · Installed PWA and every new tab land on the guide again
- **Area:** PWA · **Severity:** major · **Fixability:** CORE (server-side workaround possible)
- **Status (mobile-themes 0.1.0):** **proposal** — same page remembers the opt-in in localStorage (new tabs, cold starts, PWA launches forward without showing it); optional manifest `start_url: "./#/home"` mount.
- **Evidence:** the skip flag is per tab session (`mobile_guide/index.ts:17-20`, sessionStorage since PR #34350);
  `apps/web/res/manifest.json` `start_url: "index.html"` (no fragment → redirect applies on every launch).
  Upstream #16485 (links don't open in PWA), PR #24630 (Safari/Firefox PWA support removed).
- **Root cause:** redirect design (MOB-01) + manifest.
- **Approach:** fixed together with MOB-01 (server serves a patched guide), or serve a manifest with
  `start_url: "/#/home"` (deep link → no redirect). Add `apple-mobile-web-app-capable`/status-bar meta if standalone
  mode on iOS is wanted (an enhancer can add meta tags, but iOS reads them at "Add to Home Screen" time, i.e. after the
  redirect — so server-side).

### MOB-03 · `mobile_guide_toast` documented default `true` is not implemented
- **Area:** platform · **Severity:** minor · **Fixability:** CORE
- **Status (mobile-themes 0.1.0):** **open** — doc/code mismatch upstream, nothing to do in the module.
- **Evidence:** `docs/config.md:140` vs. no default in `apps/web/src/SdkConfig.ts`; `MatrixChat.tsx:1444-1447`.
- **Root cause:** doc/code mismatch. Harmless for us (no extra nag), but the documented knob doesn't control the redirect.
- **Approach:** none needed; report upstream if desired.

### MOB-04 · Notifications fail on Android Chrome (`new Notification()` is illegal)
- **Area:** platform · **Severity:** major · **Fixability:** ENH (JS shim, fragile) — proper fix CORE
- **Status (mobile-themes 0.1.0):** **partial** — `src/notify.ts`: on Android, `window.Notification` is a Proxy that falls back to `ServiceWorkerRegistration.showNotification()` only when the constructor throws; clicks can't open the room (Element's sw.js has no `notificationclick`). Untested on a device.
- **Evidence:** `apps/web/src/BasePlatform.ts:216` `new window.Notification(title, …)`; `WebPlatform.ts:118-120`
  `supportsNotifications = Boolean(window.Notification)` (true on Android → the toggle is offered, then every
  notification throws `TypeError: Illegal constructor`). iOS has `Notification` only in home-screen web apps (16.4+),
  which MOB-01/02 block.
- **Root cause:** page-context `Notification` constructor instead of `ServiceWorkerRegistration.showNotification()`.
- **Approach:** module installs a `window.Notification` subclass/proxy on coarse-pointer Android that forwards to
  `navigator.serviceWorker.ready.then(r => r.showNotification(...))` and maps `onclick` via the SW `notificationclick`
  → but Element's `sw.js` has no `notificationclick` handler, so clicks can only focus the tab by default. Worth a spike;
  the real fix is upstream.

### MOB-05 · No Web Push: nothing arrives while the tab is backgrounded or closed
- **Area:** platform · **Severity:** blocker (for a messenger) · **Fixability:** CORE (+ push gateway) / BROWSER on iOS
- **Status (mobile-themes 0.1.0):** **open** — core + push gateway; the proposed guide page tells users notifications only arrive while Element is open.
- **Evidence:** `apps/web/src/serviceworker/index.ts:21-36` (install/activate/fetch only, no `push` handler); no Web
  Push pusher registration anywhere in apps/web. Web Push on iOS only for home-screen apps (webkit.org/blog/13878).
- **Root cause:** Element Web assumes an open desktop tab; mobile browsers freeze/kill background tabs (MOB-08).
- **Approach:** not a module job: needs an SW `push` handler + Web Push subscription + an HTTP pusher to a gateway that
  speaks Web Push (Sygnal `webpush` app) — i.e. an Element core change or a fork of `sw.js`. A module can't register a
  second SW for the same scope. Document as a known limit; point users to Element X for notifications.

### MOB-06 · Storage eviction on iOS logs users out / loses keys
- **Area:** crypto/platform · **Severity:** major · **Fixability:** BROWSER (mitigate: ENH)
- **Status (mobile-themes 0.1.0):** **open** — browser limit.
- **Evidence:** WebKit deletes script-writable storage after 7 days without interaction (webkit.org/blog/10218),
  quota/eviction policy (webkit.org/blog/14403); `utils/StorageManager.ts:77` `persist()` (heuristic on Safari);
  upstream #32198 "Missing Session Data" (open, 17 👍), #18423 "IndexedDB write failures are fatal" (cites Mobile Safari
  private mode), #12207, #27445.
- **Root cause:** IndexedDB/localStorage are the only session + crypto store on the web.
- **Approach:** can't prevent. Mitigate: home-screen install has its own counter (needs MOB-02); a module hint on
  coarse/iOS to set up key backup/recovery key (Element already nags); show `navigator.storage.persisted()` state.

### MOB-07 · Crypto WASM and bundle size / memory on phones
- **Area:** perf/crypto · **Severity:** major · **Fixability:** CORE / BROWSER
- **Status (mobile-themes 0.1.0):** **open** — core/browser limit.
- **Evidence:** matrix-sdk-crypto-wasm#365 (~8 MB WASM, open), upstream #35564 (Safari re-fetches WASM, hangs on a
  failed fetch). iOS jetsams memory-heavy WASM pages (WebKit 256703, 255103). No Element-specific iOS OOM report found
  (risk, unverified). Console on every device: "Not using an encryption key for rust crypto store".
- **Root cause:** full desktop client + Rust crypto in one bundle; no lite mode.
- **Approach:** nothing in the module (can't change what Element loads before modules). Server: make sure WASM/JS are
  served with long cache headers + compression. Accept as limit.

### MOB-08 · Background tabs are frozen: sync stops, catch-up on resume
- **Area:** platform/perf · **Severity:** major · **Fixability:** BROWSER
- **Status (mobile-themes 0.1.0):** **open** — browser limit.
- **Evidence:** platform behaviour of iOS Safari/Android Chrome (page lifecycle freeze); no code in Element to
  resume faster (it relies on the next `/sync` long-poll after `visibilitychange`).
- **Approach:** none in the module beyond showing a "reconnecting" hint quickly; Element handles reconnect itself.

---

## 2. Layout

### MOB-09 · Room list collapses to nothing below 768 px; the only way back is a 12 px drag bar
- **Area:** layout/touch · **Severity:** blocker · **Fixability:** ENH (fragile)
- **Status (mobile-themes 0.1.0):** **fixed** — list pane = space panel + room list full width (`html[data-mt-view="list"]`), Element's collapsed/`inert` panel made usable without touching its resizer state; search is visible again.
- **Evidence:** `iphone15/10-home-start.png`, `pixel8/10-home-start.png` (list 0 px, `inert`).
  `viewmodels/structures/auto-collapse/behaviours/CollapseOnWindowResizeBehaviour.ts:17,75-77` (`AUTO_COLLAPSE_WIDTH =
  768`); `LoggedInView.tsx:701-707` (`minSize 200px`, `maxSize 370px`); `shared-components/src/resize/panel/
  LeftResizablePanelView.tsx:60-63` (`inert`, `collapsible`); `resize/separator/SeparatorView.tsx:61-101` (12 px bar,
  label only as tooltip). Upstream #33265 (open), #33288 (open), #12203.
- **Root cause:** collapse = size 0, not an icon rail; no button to reopen; the user must discover and drag a
  12 px handle (touch-drag does work, `11-roomlist-drag-open.png`).
- **Approach:** module adds a visible "Rooms" button (e.g. in the space panel via `extras.setSpacePanelItem` or a
  floating button) that opens the list in a **full-screen overlay mode** (see MOB-10). Opening/closing: simulate the
  separator's keyboard interaction (`focus()` + `End`/`Home`, react-resizable-panels supports it) or a pointer drag, or
  drive the collapse via CSS only (override the panel's flex-basis in "list mode" with `!important`, leaving
  react-resizable-panels' state alone). Prefer the pure-CSS overlay: `html[data-mt-view="list"] .mx_LeftPanel_panel {
  position: fixed; inset: 0 0 0 68px; flex-basis: auto !important; }` + remove `inert` while shown (enhancer).

### MOB-10 · No single-pane navigation: open list hides the room, choosing a room doesn't close the list
- **Area:** layout · **Severity:** blocker · **Fixability:** ENH
- **Status (mobile-themes 0.1.0):** **fixed** — `src/shell.ts`: list → room → panel derived from Element state (dispatcher `view_room`/`view_home_page`, hash, right panel in DOM); back button in the header (module API header callback) and browser/OS back gesture via same-URL history entries; space switches keep the list.
- **Evidence:** `iphone15/11-roomlist-drag-open.png` (room view **14 px**), `12b-roomlist-tap-room.png` (after
  tapping "Sandbox" the room view is still 14 px), `pixel8/12b-…` (31 px). No route-driven layout anywhere in
  `LoggedInView.tsx:695-716`. Upstream #16691 "close chat view like on Android/iOS" (open), #9814, #1633.
- **Root cause:** desktop three-pane shell; panes are sized, never swapped.
- **Approach:** the core of the module: a view state `html[data-mt-view="list|room|panel"]` maintained by an enhancer
  from Element's navigation (listen to `mxDispatcher` `view_room`/`view_home_page`, `hashchange`, right-panel store
  phase), and CSS that shows exactly one pane full-width per state, plus a back button in the room header (injected
  node, or `extras.addRoomHeaderButtonCallback` for a "back to rooms" button). Hydrogen/Cinny do exactly this (research
  §2.4). Alternative long-term: a module-owned shell using `navigation.registerLocationRenderer` +
  `builtins.renderRoomView` (API exists in 2.3, alpha).

### MOB-11 · Right panel (threads, room info, members) is 320 px minimum
- **Area:** layout · **Severity:** major · **Fixability:** CSS (+ENH for the back state)
- **Status (mobile-themes 0.1.0):** **fixed** — right panel covers the room pane in panel view; Element's own back/close in the card header (44 px), back gesture closes it.
- **Evidence:** `iphone15/22-thread-panel.png`, `23-room-info.png` (right panel 320 px covers the timeline);
  `iphone15-land/22-…` (320 px next to a cramped timeline). `MainSplit.tsx:107-109` (`minWidth={320}`, `maxWidth="50%"`).
- **Root cause:** fixed min width for a side panel.
- **Approach:** in mobile mode make `.mx_RightPanel` a full-screen layer (`position: fixed; inset: 0; width: auto
  !important`) above the room, with its own close/back (the thread view already has `<` and `×`). Part of the MOB-10
  view state (`data-mt-view="panel"`).

### MOB-12 · Space panel is a permanent 68 px column
- **Area:** layout · **Severity:** major · **Fixability:** CSS (+ENH)
- **Status (mobile-themes 0.1.0):** **fixed** — space panel only in the list pane (room/panel panes cover it); expanding it still works.
- **Evidence:** every logged-in screenshot (69 px = 18 % of a 393 px screen). `LoggedInView.tsx:701` (always in the group).
- **Approach:** show it only in list mode (`data-mt-view="list"`), hide it in room/panel mode; or turn it into a bottom
  tab bar in list mode (CSS grid on `.mx_SpacePanel`).

### MOB-13 · Room header: the room name disappears behind icon buttons
- **Area:** layout · **Severity:** major · **Fixability:** CSS (+ deployment)
- **Status (mobile-themes 0.1.0):** **fixed** — phone header: back, avatar, name (flex), call/threads/info; module buttons behind "⋯" (second row); facepile hidden in portrait.
- **Evidence:** `iphone15/13-timeline.png`, `pixel8/14-tap-message.png` (no room name at 393/412 px),
  `iphone15-land/10-home-start.png` (cut at 734 px). Most buttons come from the deployed datanauten modules
  (`extras.addRoomHeaderButtonCallback`); stock Element has ~4. PR #33477 reduces Element's own buttons only.
- **Root cause:** header buttons don't collapse into an overflow menu; module buttons are not part of Element's reduction.
- **Approach:** in mobile mode hide all but call/threads/info (`.mx_RoomHeader` button selectors by aria-label), give
  the name `flex: 1 1 auto; min-width: 6em`. Move module buttons into the room info panel or a "⋯" menu (enhancer), and
  ask module owners to respect `html[data-mt-mobile]`.

### MOB-14 · Timeline content is crushed at ~300 px
- **Area:** layout · **Severity:** major · **Fixability:** CSS
- **Status (mobile-themes 0.1.0):** **partial** — full width once single-pane; `pre`/tables scroll, notices full width, long words wrap. Avatar gutter/read receipts unchanged.
- **Evidence:** `iphone15/10-home-start.png`, `13-timeline.png` (code blocks clipped), `24-tap-tooltip.png` (E2E
  notice one word per line). Upstream #19734, #21393, #16200 (all open). Only `_EventTile.pcss:491` adapts.
- **Root cause:** avatar column + timestamps + read receipts + action-bar gutters sized for desktop.
- **Approach:** mobile CSS: smaller avatar gutter, timestamps inline/hidden until tap, read receipts collapsed,
  `pre` horizontally scrollable, generic notices `min-width: 0`/full width. Shared-components classes via
  `[class*="_line_"]` etc. Benefits are immediate once MOB-10 gives the room the full width.

### MOB-15 · Settings dialogs are wider than the phone (580 px tab min-width)
- **Area:** layout · **Severity:** major · **Fixability:** CSS
- **Status (mobile-themes 0.1.0):** **fixed** — full-screen settings, tab list as a labelled horizontal scroller, 580 px min-width removed, two-column rows wrap, compound glass padding removed.
- **Evidence:** `iphone15/25-room-settings.png`, `26-user-settings.png`, `pixel8/25-…`, `26-…` (dialog outside the
  viewport, content cut on the right). `_SettingsDialog.pcss:13-16` (`width: 90vw; height: 80vh`), `:24`
  (`.mx_SettingsTab { min-width: 580px; padding-right: 100px }`), `_TabbedView.pcss:124` (≤ 1024 px: icon-only tabs).
  Upstream #22915 (close target too small, open).
- **Root cause:** desktop dialog geometry; tab labels hidden at ≤ 1024 px and only named by tooltip.
- **Approach:** mobile CSS: dialog full-screen (`inset: 0; width: 100%; height: 100dvh; border-radius: 0`), tab list
  as a horizontal scroller or a first-level list (labels visible), `.mx_SettingsTab { min-width: 0; padding-right:
  16px }`.

### MOB-16 · Generic dialogs overflow (create room, invite, …)
- **Area:** layout · **Severity:** major · **Fixability:** CSS
- **Status (mobile-themes 0.1.0):** **fixed** — dialogs ≤ viewport (padding 16 px, fixed widths capped, glass frame 4 px), close button 44 px hit area.
- **Evidence:** `*/28-modal-create-room.png` (Create button and fields cut off on all 4 devices).
  `_common.pcss:328` (`.mx_Dialog` padding 32 px 40 px), fixed widths e.g. `_SetupEncryptionBody.pcss:10` (600 px),
  `_RoomUpgradeWarningDialog.pcss:10`.
- **Approach:** mobile CSS: `.mx_Dialog { max-width: 100vw; padding: 16px; box-sizing: border-box }`, fixed-width
  children `max-width: 100%`, dialogs as bottom sheets or full screen; compound dialogs already partly fluid
  (`_CompoundDialog.pcss:78`).

### MOB-17 · Login/welcome card cut off on phones
- **Area:** layout · **Severity:** major (first screen) · **Fixability:** CSS
- **Status (mobile-themes 0.1.0):** **fixed** — welcome/login card and buttons fit (377 px card on a 393 px iPhone, also in WebKit).
- **Evidence:** `iphone15/01-login.png`, `pixel8/01-login.png`, `03-deeplink-no-redirect.png` (measured: modal 500 px
  in a 393 px viewport; buttons 380 px). `_AuthBody.pcss:11` (500 px; only `.mx_AuthBody` fixed at ≤ 480 px,
  `:283-288`), `_DefaultWelcome.pcss:33` (`width: 380px`).
- **Root cause:** the 480 px media query (PR #13818) doesn't cover the welcome screen / modal content.
- **Approach:** mobile CSS: `.mx_AuthPage_modal, .mx_AuthPage_modalContent, .mx_Welcome { width: 100%; max-width:
  100vw }`, `.mx_DefaultWelcome_buttons a { width: auto }`. Note: MAS/OIDC pages are separate (server-side).

### MOB-18 · `vh` instead of dynamic viewport units
- **Area:** viewport · **Severity:** minor · **Fixability:** CSS
- **Status (mobile-themes 0.1.0):** **fixed** — app box and dialogs sized from the visual viewport (`--mt-vv-h`, fallback `100dvh`), auth page too.
- **Evidence:** `_AuthPage.pcss:14` (`height: 100vh`), `_SettingsDialog.pcss:16`, `_ForwardDialog.pcss:16`,
  `EmojiPicker.module.css:11-12`, `_SpaceRoomView.pcss:41`, … (17 rules).
- **Root cause:** on mobile `vh` = large viewport (toolbars hidden), so bottoms are cut while toolbars are visible.
- **Approach:** override the key ones with `dvh`/`svh` in mobile mode.

### MOB-19 · No safe-area handling (notch, home indicator)
- **Area:** viewport · **Severity:** minor · **Fixability:** ENH (meta) + CSS
- **Status (mobile-themes 0.1.0):** **partial** — `viewport-fit=cover` + `env(safe-area-inset-*)` padding on the shell, dialogs, composer; needs a notched iPhone to verify.
- **Evidence:** `vector/index.html:15` (no `viewport-fit=cover`), 0 uses of `env(safe-area-inset-*)`.
- **Root cause:** without `viewport-fit=cover` iOS letterboxes landscape (wasted space, but nothing hidden); with it,
  the composer would sit under the home indicator.
- **Approach:** only when going standalone/edge-to-edge: enhancer sets `viewport-fit=cover`, CSS pads composer/header/
  space panel with `env(safe-area-inset-*)`. Low priority in browser tabs.

### MOB-20 · Spotlight/search and emoji picker sized for desktop
- **Area:** layout · **Severity:** minor · **Fixability:** CSS
- **Status (mobile-themes 0.1.0):** **fixed** — spotlight full width at the top, emoji picker capped, keyboard hints hidden on touch.
- **Evidence:** `iphone15/30-spotlight-search.png` (236 px wide dialog, keyboard hint tooltip), `21-emoji-picker.png`
  (fits, but 32 px cells). `EmojiPicker.module.css:11-12`.
- **Approach:** full-width spotlight; hide keyboard hints in coarse mode; slightly larger emoji cells.

---

## 3. Touch

### MOB-21 · Message actions are hover-only (and sticky after a tap)
- **Area:** touch · **Severity:** major · **Fixability:** ENH
- **Status (mobile-themes 0.1.0):** **fixed** — hover action bar hidden on coarse pointers (no sticky bar); actions via long-press menu; add-reaction button always visible next to reactions.
- **Evidence:** `iphone15/14-tap-message.png` (tap → action bar appears via compatibility mouse events in Chromium),
  `pixel8/10-home-start.png` (action bar stuck on the last touched tile). `viewmodels/room/timeline/event-tile/
  EventTileDerivedState.ts:199-207` (`hover || showActionBarFromFocus || actionBarFocused`), `EventTileView.tsx:135-136`
  (`onMouseEnter/Leave`), `EventTile.tsx:453-457,681-705` (hover re-validated on `mousemove`, which never comes on
  touch). Upstream #12202, #13526 (open).
- **Root cause:** the action bar is rendered only while hovered/focused; on touch "hover" is an emulation side effect
  (iOS sticky hover, Android usually), never cleared without another touch; the bar floats above the tile with 28 px
  icons.
- **Approach:** enhancer: on tap of a tile in coarse mode, focus the tile (`showActionBarFromFocus` path is keyboard-
  driven; focusing `.mx_EventTile` with `tabindex` may trigger it) or dispatch `mouseenter`/`mouseleave` explicitly to
  toggle; tap outside → `mouseleave`. CSS: larger action-bar buttons, bar pinned inside the tile. Better UX: a
  long-press / tap opening the full context menu as a bottom sheet (MOB-22).

### MOB-22 · No long-press menu on iOS; on Android it fights text selection
- **Area:** touch · **Severity:** major · **Fixability:** ENH
- **Status (mobile-themes 0.1.0):** **fixed** — long-press 500 ms → Element's message menu (synthetic `contextmenu`), shown as a bottom sheet; Android's duplicate native contextmenu swallowed; text selection not disabled. iOS long-press needs a real device.
- **Evidence:** `*/16-longpress-message.png` (CDP long-press: no menu), `*/17-contextmenu-event.png` (a `contextmenu`
  event does open the full menu). `EventTile.tsx:767-800` (menu only from `contextmenu`, skipped on images/links).
  WebKit never fires `contextmenu` on long-press; Android Chrome fires it and also starts text selection.
  Upstream #13526, #34402 (room list drag opens context menu).
- **Root cause:** desktop right-click model.
- **Approach:** enhancer: `touchstart`/`touchend` timer (~450 ms, cancel on move > 10 px) on `.mx_EventTile` that
  dispatches a synthetic `contextmenu` at the tile (verified to work: `17-contextmenu-event.png`), with
  `-webkit-touch-callout: none; user-select: none` on tiles in coarse mode (keep selection in "View source"/copy
  action). Make the menu a bottom sheet with CSS (`.mx_ContextualMenu` full width at the bottom).

### MOB-23 · Touch targets far below 44 px
- **Area:** touch/a11y · **Severity:** major · **Fixability:** CSS
- **Status (mobile-themes 0.1.0):** **partial** — header, card header, composer, dialog close, room list, space panel ≥ 44 px (layered `!important` so themes can't shrink them); timeline-internal targets (reactions 32 px, links) unchanged.
- **Evidence:** `metrics.json` → `13-timeline` targets: iPhone 39 visible / **29 < 44 px / 10 < 24 px**, Pixel 41 /
  31 / 11. Upstream #24848, #22915 (open).
- **Approach:** mobile CSS: min 44×44 hit areas for header buttons, composer buttons, room list items, dialog close,
  reactions (padding or `::after` hit-slop, not visual size).

### MOB-24 · Tooltips are the only labels for many controls
- **Area:** touch/a11y · **Severity:** minor · **Fixability:** CSS (+ENH)
- **Status (mobile-themes 0.1.0):** **fixed** — settings tab labels visible; focus tooltips that stick on touch hidden.
- **Evidence:** `*/24-tap-tooltip.png` (no tooltip on tap, `tooltipVisible: 0`), `26-user-settings.png` (icon-only
  settings tabs, a focus tooltip stuck on "Account"), separator label tooltip-only (`SeparatorView.tsx:61`).
- **Approach:** show text labels in mobile mode where Element hides them (settings tabs, MOB-15); long-press = label
  (enhancer) is optional.

### MOB-25 · Hover styles stick after tap
- **Area:** touch · **Severity:** minor · **Fixability:** CSS
- **Status (mobile-themes 0.1.0):** **fixed** — tile/room-list/header hover backgrounds neutralised on coarse pointers.
- **Evidence:** 108 `:hover` rules, 0 `@media (hover: hover)` guards; sticky highlight seen in `pixel8/10-home-start.png`.
- **Approach:** in `html[data-mt-mobile~="coarse"]` neutralise the most visible hover backgrounds (event tile, room
  list item) by resetting the tokens they use (`--event-tile-*-hover-background`, `EventTileView.module.css:39-57`).

### MOB-26 · No swipe gestures (back, reply), no pull-to-refresh semantics
- **Area:** touch · **Severity:** minor · **Fixability:** ENH
- **Status (mobile-themes 0.1.0):** **partial** — back gesture = browser/OS back (iOS edge swipe, Android back) via history entries; no custom swipe or swipe-to-reply.
- **Evidence:** no touch handlers in apps/web/shared-components except the room list sensor
  (`VirtualizedRoomListView.tsx:625-636`); upstream #33401 (swipe to reply, closed).
- **Approach:** after MOB-10: edge-swipe → back to list (enhancer, `touch-action: pan-y` on the room). Swipe-to-reply
  via dispatcher `reply_to_event`-style internals is possible but fragile; later.

### MOB-27 · Resize handles and drag affordances need a precise pointer
- **Area:** touch · **Severity:** minor (subsumed by MOB-09/11) · **Fixability:** CSS
- **Status (mobile-themes 0.1.0):** **fixed** — separator and right-panel resize handle hidden in single-pane mode.
- **Evidence:** `SeparatorView.module.css:50` (12 px bar), MainSplit right-panel handle (a few px); widget/PiP drag.
- **Approach:** hide resize handles in mobile mode once panes are full-screen (MOB-10/11).

---

## 4. Keyboard and input

### MOB-28 · On-screen keyboard: no visual-viewport handling
- **Area:** keyboard/viewport · **Severity:** blocker on iOS, major on Android · **Fixability:** ENH (fragile)
- **Status (mobile-themes 0.1.0):** **partial** — visual-viewport sizing (Hydrogen approach), bottom-anchored timeline, `interactive-widget=resizes-content` on Android, less chrome while typing; verified in emulation (both keyboard models) and WebKit, needs real iOS/Android.
- **Evidence:** `*/20-keyboard-overlay.png` (keyboard over an unchanged layout: composer and last messages hidden
  until the browser pans), `iphone15-land/19-keyboard-resize.png` (even in the best case only 143 px remain: header +
  composer, **no timeline**). `_common.pcss:86-90` (`html { height: 100%; overflow: hidden }`), 0 uses of
  `visualViewport`/`dvh`/`interactive-widget`; menus/autocomplete positioned with `innerHeight`
  (`UIStore.ts:38-40`, `ContextMenu.tsx:311-339`). Hydrogen needed `adaptUIOnVisualViewportResize()` for this
  (WebKit bug 141832); Cinny #2527, Sable #909 show it's hard.
- **Root cause:** iOS Safari and Android Chrome ≥ 108 (default `resizes-visual`) shrink only the visual viewport; the
  app shell is sized to the layout viewport and can't scroll, so the browser pans the whole app (header off-screen).
- **Approach:** enhancer: track `visualViewport` (`resize`/`scroll`), set `--mt-vvh`/`--mt-vvtop` on `<html>`, CSS sizes
  `#matrixchat` to `height: var(--mt-vvh)` and translates by `--mt-vvtop` (Hydrogen's approach), only while an input
  is focused. On Android additionally set `<meta name="viewport" … interactive-widget=resizes-content>` (enhancer can
  edit the meta at runtime; Chrome honours it). In landscape phones: hide the room header while typing.

### MOB-29 · iOS zooms into every input (computed font-size 15 px)
- **Area:** keyboard/a11y · **Severity:** major · **Fixability:** CSS
- **Status (mobile-themes 0.1.0):** **fixed** — all inputs/textareas/contenteditable `max(16px, 1em)` (no pinch-zoom restriction).
- **Evidence:** `metrics.json` inputs on all devices: composer, search, settings fields, dialog fields all **15 px**
  (< 16 px → Safari zooms on focus and stays zoomed). E.g. `_Editor.pcss:77` (`$font-15px`), `_common.pcss:326`.
- **Approach:** mobile CSS: `font-size: max(16px, 1em)` on `input, textarea, [contenteditable]` in coarse mode. Don't
  use `maximum-scale=1` (kills pinch zoom = a11y regression).

### MOB-30 · Enter always sends; no newline on a soft keyboard
- **Area:** keyboard · **Severity:** minor · **Fixability:** ENH (or user setting)
- **Status (mobile-themes 0.1.0):** **open** — not done (would change a device setting via internals).
- **Evidence:** `SendMessageComposer.tsx:206+` (Enter = send unless `MessageComposerInput.ctrlEnterToSend`); there is
  no Shift on most soft keyboards. Send button appears when not empty (`MessageComposer.tsx:688`), so Enter isn't
  needed to send.
- **Approach:** in coarse mode set the device-level setting `ctrlEnterToSend` (via `mxSettingsStore`, internal) so
  Enter inserts a newline and the send button sends — like native apps. Fragile but simple.

### MOB-31 · Composer on Android IMEs (contenteditable) — unverified risk
- **Area:** keyboard · **Severity:** minor (unverified) · **Fixability:** CORE
- **Status (mobile-themes 0.1.0):** **open** — needs a real Android device.
- **Evidence:** custom contenteditable model `BasicMessageComposer.tsx` (IME handling `:297-304`); similar editors
  have Gboard "backwards typing"/lost-character bugs (Cinny #1885). Not reproducible in emulation.
- **Approach:** test on a real Android device before promising anything; if broken, only Element core can fix it
  (or the WYSIWYG labs composer may behave differently).

### MOB-32 · Keyboard-only entry points and hints
- **Area:** a11y/touch · **Severity:** minor · **Fixability:** CSS+ENH
- **Status (mobile-themes 0.1.0):** **fixed** — search visible in the list pane; shortcut badges/hints hidden on touch.
- **Evidence:** `iphone15/30-spotlight-search.png` ("Ctrl K" badge, "Use ↑↓ to scroll" hint); with the room list
  collapsed (MOB-09) there is no visible search entry at all, only Ctrl+K. The datanauten keyboard-shortcuts module
  adds more desktop affordances.
- **Approach:** hide shortcut badges/hints in coarse mode; a search button in list mode (comes with MOB-09/10).

---

## 5. Other

### MOB-33 · iPadOS gets the full desktop UI with a desktop UA
- **Area:** platform/touch · **Severity:** minor · **Fixability:** CSS+ENH (already detected)
- **Status (mobile-themes 0.1.0):** **partial** — tablets (coarse, wide, tall) get the touch fixes but keep the multi-pane layout; not tested on an iPad.
- **Evidence:** `vector/index.ts:149` (iPadOS UA = "Macintosh" → not redirected); upstream #12202, #12209.
- **Approach:** the module's `coarse` detection already marks it (`data-mt-mobile="coarse"` at ≥ 768 px); apply the
  touch fixes (MOB-21..25, 29) but keep the multi-pane layout.

### MOB-34 · teams-welcome onboarding card is modal on phones (deployment)
- **Area:** layout (other module) · **Severity:** minor · **Fixability:** CSS (in teams-welcome or here)
- **Status (mobile-themes 0.1.0):** **partial** — CSS makes the card full-screen on phones (selector from the research) and cancels the docked panel's ~490 px right margin on phones; tablets still lose that space (§8.1); teams-welcome itself should own this.
- **Evidence:** `iphone15/09-teams-welcome-card.png` (covers the whole screen; `#teams-welcome-root .twl-panel-frame`,
  `width: min(460px, 100vw - 32px)`).
- **Approach:** teams-welcome should become a full-screen step view with a clear close on narrow screens, or not
  auto-open on phones. Raise with that module's owner.

### MOB-35 · Calls/widgets on a phone — not verified
- **Area:** platform · **Severity:** minor (unknown) · **Fixability:** unknown
- **Status (mobile-themes 0.1.0):** **open** — not re-tested (call button is now reachable in the phone header).
- **Evidence:** `iphone15/31-call-lobby.png` (call button not reachable in the crowded portrait header; no call frame
  opened). Element Call runs in an iframe (`element_call.use_exclusively`); widgets overflow narrow viewports
  (upstream #16200, open).
- **Approach:** re-test once MOB-10/13 give the room full width and a reachable call button; Element Call itself is
  mobile-capable (it's the same web app the native apps embed).

### MOB-36 · Crypto store unencrypted at rest on the web
- **Area:** crypto · **Severity:** minor · **Fixability:** CORE
- **Status (mobile-themes 0.1.0):** **open** — core.
- **Evidence:** console on every device: "Warning! Not using an encryption key for rust crypto store." Phones get
  lost more often than desktops.
- **Approach:** informational; not module territory.

What works acceptably (no issue filed): the user menu renders as a native-feeling **bottom sheet**
(`29-user-menu.png`); the emoji picker fits; file upload uses the native picker (`viewmodels/room/
RoomUploadViewModel.tsx:328-336`, `<input type="file" multiple>`, so camera/photos are offered by the OS); deep links
bypass the redirect; the thread view has its own back/close buttons; dragging the separator with a finger works.

---

## 6. Summary

| ID | Title | Area | Severity | Fixability | Status |
|---|---|---|---|---|---|
| MOB-01 | Mobile-UA redirect before anything loads | platform | blocker | CORE (server workaround) | proposal |
| MOB-02 | PWA / new tabs land on the guide again | PWA | major | CORE (server workaround) | proposal |
| MOB-03 | `mobile_guide_toast` default not implemented | platform | minor | CORE | open |
| MOB-04 | `new Notification()` illegal on Android | platform | major | ENH (shim) / CORE | partial |
| MOB-05 | No Web Push | platform | blocker | CORE / BROWSER (iOS) | open |
| MOB-06 | iOS storage eviction | crypto/platform | major | BROWSER | open |
| MOB-07 | Crypto WASM + bundle size/memory | perf/crypto | major | CORE / BROWSER | open |
| MOB-08 | Background tabs frozen | platform/perf | major | BROWSER | open |
| MOB-09 | Room list collapses to 0, 12 px drag bar | layout/touch | blocker | ENH | fixed |
| MOB-10 | No single-pane navigation | layout | blocker | ENH | fixed |
| MOB-11 | Right panel 320 px min | layout | major | CSS (+ENH) | fixed |
| MOB-12 | Permanent 68 px space panel | layout | major | CSS (+ENH) | fixed |
| MOB-13 | Room name hidden by header buttons | layout | major | CSS | fixed |
| MOB-14 | Timeline content crushed | layout | major | CSS | partial |
| MOB-15 | Settings dialogs wider than phone | layout | major | CSS | fixed |
| MOB-16 | Generic dialogs overflow | layout | major | CSS | fixed |
| MOB-17 | Login card cut off | layout | major | CSS | fixed |
| MOB-18 | `vh` instead of `dvh` | viewport | minor | CSS | fixed |
| MOB-19 | No safe-area handling | viewport | minor | ENH + CSS | partial |
| MOB-20 | Spotlight/emoji picker desktop-sized | layout | minor | CSS | fixed |
| MOB-21 | Hover-only, sticky message actions | touch | major | ENH | fixed |
| MOB-22 | No long-press menu (iOS), selection conflict (Android) | touch | major | ENH | fixed |
| MOB-23 | Touch targets < 44 px | touch/a11y | major | CSS | partial |
| MOB-24 | Tooltips as only labels | touch/a11y | minor | CSS (+ENH) | fixed |
| MOB-25 | Sticky hover styles | touch | minor | CSS | fixed |
| MOB-26 | No swipe gestures | touch | minor | ENH | partial |
| MOB-27 | Precise-pointer resize handles | touch | minor | CSS | fixed |
| MOB-28 | Keyboard: no visual-viewport handling | keyboard/viewport | blocker | ENH | partial |
| MOB-29 | iOS input zoom (15 px inputs) | keyboard/a11y | major | CSS | fixed |
| MOB-30 | Enter always sends | keyboard | minor | ENH | open |
| MOB-31 | Android IME composer risk (unverified) | keyboard | minor | CORE | open |
| MOB-32 | Keyboard-only entry points/hints | a11y/touch | minor | CSS+ENH | fixed |
| MOB-33 | iPadOS desktop UI with touch | platform/touch | minor | CSS+ENH | partial |
| MOB-34 | teams-welcome card modal on phones | layout | minor | CSS (other module) | partial |
| MOB-35 | Calls/widgets not verified | platform | minor | unknown | open |
| MOB-36 | Crypto store unencrypted at rest | crypto | minor | CORE | open |

**Counts** (36 issues; primary fixability class per issue):

| Fixability | Count | IDs |
|---|---|---|
| CSS | 15 | 11, 12, 13, 14, 15, 16, 17, 18, 20, 23, 24, 25, 27, 29, 34 |
| ENH (CSS + enhancer) | 11 | 04, 09, 10, 19, 21, 22, 26, 28, 30, 32, 33 |
| API (missing module API) | 0 | — (the shell work can be done with ENH; `registerLocationRenderer`/`renderRoomView` exist) |
| CORE (incl. server-side workarounds) | 7 | 01, 02, 03, 05, 07, 31, 36 |
| BROWSER | 2 | 06, 08 (05 is also a browser limit on iOS) |
| unknown | 1 | 35 |

| Severity | Count | IDs |
|---|---|---|
| blocker | 5 | 01, 05, 09, 10, 28 |
| major | 16 | 02, 04, 06, 07, 08, 11, 12, 13, 14, 15, 16, 17, 21, 22, 23, 29 |
| minor | 15 | 03, 18, 19, 20, 24, 25, 26, 27, 30, 31, 32, 33, 34, 35, 36 |

Blockers by class: 2 reachable from the module (MOB-09, 10: ENH), 1 reachable but fragile (MOB-28: ENH, needs
real-device work), 2 not reachable (MOB-01: server/core, MOB-05: core + push gateway).

---

## 7. Recommended fix order for the module

0. **Unblock entry (outside the module, prerequisite):** server-side `/mobile_guide/` replacement (MOB-01) and a
   manifest `start_url` with a fragment (MOB-02). Without it, phone users only reach the app via the guide's small
   "desktop site" link, once per tab.
1. **Single-pane shell (MOB-10, 09, 11, 12, 27):** `data-mt-view="list|room|panel"` from navigation events, CSS that
   shows one pane full-screen, a back button, a visible "Rooms" entry. This turns the layout from unusable into
   usable; everything else builds on it.
2. **Cheap CSS wins (MOB-17, 15, 16, 29, 23, 13, 14):** login card, full-screen settings/dialogs, 16 px inputs,
   44 px hit areas, header reduction, timeline gutters. Mostly declarative, low risk.
3. **Keyboard (MOB-28, 30):** visual-viewport sizing of `#matrixchat` while typing, `interactive-widget` on Android,
   Enter = newline in coarse mode. Needs real-device testing (iPhone + Android) — emulation can't validate it.
4. **Touch interactions (MOB-22, 21, 25, 24):** long-press → context menu as bottom sheet, tap-to-toggle action bar,
   neutralised hover styles, visible labels.
5. **Polish (MOB-18, 20, 32, 19, 26, 33, 34):** dvh, spotlight, hints, safe areas, swipe back, iPad tuning, teams-welcome.
6. **Spikes / document as limits:** Android notification shim (MOB-04); Web Push, eviction, background sync, WASM size
   (MOB-05..08) stay documented limits → recommend Element X for notifications.

Each step should come with an `audit.mjs --with-module` before/after run on all four device profiles and at least one
real iPhone + Android check for steps 3–4.

---

## 8. Status after mobile-themes 0.1.0 (2026-11-15)

Module: [`../mobile/`](../mobile/README.md) (not deployed). Status per issue is in each entry and in the §6 table:
**17 fixed · 8 partial · 2 proposal · 9 open** (the open ones are core/browser limits, plus MOB-30/31/35).

| Status | IDs |
|---|---|
| fixed | 09, 10, 11, 12, 13, 15, 16, 17, 18, 20, 21, 22, 24, 25, 27, 29, 32 |
| partial | 04 (shim, untested on device), 14, 19, 23, 26, 28 (needs real devices), 33, 34 |
| proposal | 01, 02 (server-side guide page, `mobile/README.md`) |
| open | 03, 05, 06, 07, 08, 30, 31, 35, 36 |

**How it was tested** (nothing deployed; module injected by request interception):

- `mobile/test/shell.mjs`: the same phone flow without/with the module on production (session pool, `themes-mira`),
  iPhone 15 and Pixel 8, portrait and landscape → `recordings/mobile/after/<device>/{without,with}/NN-*.png`,
  `compare.png` (side by side), `result.json` (per step: ok, module state, touch targets, input font sizes). With the
  module every step passes on all four devices; without it the long-press menu and (portrait) room info fail, the
  room list is a 12 px bar, settings/dialogs overflow.
- Themes (both modules, prod loader + injected module): `recordings/mobile/after/iphone15--{teams-2026-light,
  win311-default,lcars-tng,paper-white}/`, `pixel8-land--lcars-tng/`; loader dev server (:5400):
  `recordings/mobile/after/devserver/iphone15--teams-2026-light/`.
- Desktop 1440×900 regression (`mobile/test/desktop.mjs`): layout fingerprint (≈ 25 regions × geometry + computed
  styles, html attributes, viewport meta) **identical** with and without the module for Element default,
  teams-2026-light, win311-default, lcars-tng, paper-white; pixel diff 0 for the room/room-info/create-room views of
  default, teams, win311 and paper; the remaining pixel differences are content between the two loads (an avatar image
  that finished loading in one run, room-list order changed by new messages under lcars), not layout
  (`recordings/mobile/after/desktop*/`, `desktop.json`).
- WebKit 26.5 (Playwright's WebKit in the local `mcr.microsoft.com/playwright:v1.65.0-noble` image; the Fedora host
  lacks its libraries), iPhone 15 portrait/landscape, logged out on the dev server: card fits, 16 px inputs,
  `viewport-fit=cover`, keyboard state from `visualViewport`, app height follows it
  (`recordings/mobile/after/webkit/`). Logged-in WebKit is not possible without a new login (pool = Chrome profiles).
- Keyboard: emulated two ways (visual viewport shrinks = iOS/Android default; layout viewport shrinks = Android
  `resizes-content`). Real keyboards not covered.
- Test-matrix harness (`tests/harness/viewports.mjs --mode devices --mobile-module`, prod, runs
  `vp-devices-prod-mm-recheck*` in `tests/reports/matrix/`). Its findings against earlier builds and what changed:
  1. zoom-out to a 600–800 px layout viewport after a rotation / when the right panel opened → **fixed**:
     `minimum-scale=1` in the viewport meta in mobile mode (pinch zoom-in still possible). Element without the module
     zooms out the same way after a rotation in emulation (its header overflows to 656 px).
  2. app ~420 px tall after the keyboard closed → not reproducible any more (was the zoomed state of 1); keyboard
     detection is now keyed by window width (a keyboard never changes it, a rotation always does).
  3. settings dialog 12 px wider than the viewport → **fixed** (compound glass frame padding removed on phones);
     MOB-05 24/24 pass.
  4. header/composer targets 32×32 / 38×44, win311 back 22×18, lcars 26×30 → **fixed**: 44 px boxes in the
     `mt-important` layer (beats themes' unlayered `!important`), avatar 36 px in a 44 px box; MOB-08 24/24 pass.
  5. win311: menu bar + title bar covered the room header and back button → **fixed**: panes are positioned inside
     the group (follow the theme's offsets), header geometry outranks theme CSS, win311's invisible avatar hotspot is
     put back in the flow (it lay on top of the back button); MOB-02 passes for win311 on se/iphone15/plus/landscape.
  6. lcars-tng "room opened, no composer" (flaky, timeline still loading) → not reproduced in 3 later runs on
     iPhone 15; lcars at 320×568 still fails MOB-02 (list item not tappable under the LCARS frame) → theme tweak (§8.1).
  Remaining harness failures with the module are not module defects: **MOB-04** (panel full width in every run) fails
  only on its close/back selector — Element's card close button is named via `aria-labelledby`, not `aria-label`
  (it is 44×44 and hittable); **MOB-03** composer is above the keyboard in every run, the "0 bodies" is because the
  last Sandbox events are an image/file tile (no `.mx_EventTile_body` in view); **VP-09 tablet** is the docked
  teams-welcome panel taking 492 px of a 1180 px tablet (same without the module); **MOB-06** lcars at 320 px and
  win311 in landscape: the theme's frame covers the dialog close button. Opening a room from the list now always
  shows the conversation even if Element remembered an open right panel for it (that state made MOB-02 fail).

### 8.1 Themes on phones (what themes could tweak; `themes/` was not changed)

| Theme | Phone result | Suggested theme-side tweak |
|---|---|---|
| Element default | good | — |
| teams-2026-light | good; its header "Copilot" decoration takes ~80 px, room name truncates early | hide the decoration under `html[data-mt-compact]` |
| paper-white | good | — |
| win311-default | usable: the room header (back, call, threads, info) sits below the theme's app title bar + menu bar; thread/room-info card header stays a thin title bar with small buttons; in landscape its title bar covers the dialog close button; Settings → tab clicks were flaky in the test | under `html[data-mt-compact]`: drop the menu bar, keep only one title bar, give card-header buttons 44 px, keep dialog close buttons uncovered |
| lcars-tng | portrait ≥ 360 px usable (header pills fit, long-press menu, panel, settings); **landscape phone is the worst offender**: the LCARS header/frame blocks take the whole 390–412 px height, the room list has no visible rows and nothing can be tapped. One flaky "composer not in viewport" right after opening a room (timeline still loading) | under `html[data-mt-compact][data-mt-orientation="landscape"]`: collapse the top frame/elbow and the header pills to one 44 px row; at 320 px wide the frame also blocks room-list taps and the dialog close button |
| teams-welcome (deployment module) | when docked it reserves ~490 px on the right of `#matrixchat`; the module cancels that on phones (`html[data-mt-compact].twl-docked`), tablets keep it (a 1180 px tablet is left with a ~250 px room) | teams-welcome should not dock below ~1280 px |

### 8.2 Needs real devices

iOS keyboard pan/timing with the visual-viewport sizing (MOB-28) · iOS long-press → menu (WebKit has no
`contextmenu`; our timer fires, but Playwright's WebKit can't synthesize `Touch`) · Android long-press next to the
native text selection · `interactive-widget=resizes-content` on Chrome Android · safe areas on a notched iPhone in
landscape (MOB-19) · Android notification shim with a granted permission (MOB-04) · Gboard input (MOB-31) · the
mobile-guide page in iOS standalone (home-screen) mode · performance on a mid-range phone.
