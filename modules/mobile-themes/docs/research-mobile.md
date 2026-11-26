# 05 – Element Web on mobile: what it does, why, and how others do it

Research date: 2026-11-15. Source: Element Web **v1.12.33** (`git archive v1.12.33` of
`/var/home/t/projects/element/element-web`, the monorepo also used for `01-theme-system.md`). All `file:line`
references are against the tag v1.12.33, paths relative to the repo root (`apps/web/…`, `packages/shared-components/…`).
Upstream data (issue numbers, states, 👍) pulled with `gh` on 2026-11-15. Empirical results: Playwright device
emulation against https://element.datanauten.de (1.12.33, all production modules), `mobile/test/audit.mjs`,
screenshots in `recordings/mobile/`. The issue list derived from this is [`../docs/MOBILE-ISSUES.md`](../docs/MOBILE-ISSUES.md).

---

## 0. TL;DR

| Question | Answer |
|---|---|
| Does Element try to work on phones? | **No.** iOS/Android UAs are redirected to a static `/mobile_guide/` page ("The desktop site does **not** work on mobile, please download the app") *before* config and modules load. Mobile web is officially "Community Supported" (issues accepted, regressions don't block releases). |
| Why? | Bandwidth and product focus on the native apps (Element X). Maintainers have said so since 2019 (#9814); ara4n's PR #29211 (2025) made the guide say outright that it doesn't work. Responsive bits land only as narrow-*desktop*/accessibility fixes. |
| What is responsive today? | Almost nothing: 9 width/height media queries in the whole app (auth pages, settings tab labels, one EventTile margin), a JS auto-collapse of the room list at ≤ 768 px, and a ≤ 500 px "narrow" mode of the composer (buttons into a "More options" menu). Zero `(hover)`/`(pointer)` queries, zero `env(safe-area-*)`, zero `visualViewport`, zero `dvh`, zero `touch-action`. |
| What breaks first on a phone? | The redirect; then the three-pane desktop layout (room list collapses to 0 at ≤ 768 px, and once dragged open it hides the room, because there is no single-pane navigation); hover-only message actions; fixed-width dialogs/settings (580 px tab min-width, 500 px auth card); keyboard vs. a `height:100%; overflow:hidden` app shell; notifications (`new Notification()` is illegal on Android, no Web Push anywhere). |
| Can a module fix it? | Layout, hit targets, dialogs, auth page, safe areas: **yes, CSS (+ a small DOM enhancer)**. Single-pane navigation: **yes with an enhancer** driving the resizable panel / right panel through internals. Long-press menus, swipe, keyboard-aware shell: **enhancer, fragile**. Redirect, PWA start URL, Web Push, `new Notification`, crypto/IndexedDB limits: **server/core/browser**, not a module. |
| Who does it better? | Hydrogen (single-pane CSS grid at ≤ 800 px, iOS `visualViewport` workaround, IDB quirk detection), Cinny (route-driven single pane at ≤ 750 px), FluffyChat (Flutter, mobile-first column mode). |

---

## 1. What Element Web does on mobile today (code)

### 1.1 The mobile-UA redirect and the mobile guide

- `apps/web/src/vector/index.ts:146-157`: after rageshake but **before `loadConfig()` (`:161`) and long before
  `loadPlugins()` (`:176`)**:
  - `preventRedirect = !!parsedUrl.params.threepid || parsedUrl.location.length > 0` (deep links and 3PID
    verification are exempt, #7378).
  - `isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)`, `isAndroid = /Android/.test(...)`; if either and
    `sessionStorage.skip_mobile_redirect !== "true"` → `window.location.href = "mobile_guide/"`.
  - Consequences: **no config switch disables it** (`mobile_guide_toast` does not; upstream #21616 open since 2022,
    PR #34508 to make it configurable closed 2026-07 "needs a product decision"). **A module can't prevent it** — it
    runs before modules are even fetched. The skip flag is per *tab session* (sessionStorage since PR #34350,
    2026-07): every new tab, every cold start of iOS Safari after eviction, and **every launch of an installed PWA**
    (fresh session, `start_url: "index.html"` has no fragment, `apps/web/res/manifest.json`) lands on the guide again.
  - iPadOS reports a desktop UA → not redirected (and gets the full desktop UI with touch).
- `apps/web/src/vector/mobile_guide/index.ts:17-20`: the guide's "desktop site" link sets the skip flag and goes
  to `../`. `:55` picks the app variant from config `mobile_guide_app_variant` (prod: `"element"` = Element X).
  The guide's `index.html:34-35` text: "The desktop site does **not** work on mobile, please download the app."
- `apps/web/src/toasts/MobileGuideToast.ts:25-50` + `MatrixChat.tsx:1444-1447`: an extra toast after login, shown
  only if `SdkConfig.get("mobile_guide_toast")` is truthy. `docs/config.md:140` says the default is `true`, but
  `SdkConfig.ts` has **no default** for it → off unless configured (doc/code mismatch; prod config doesn't set it).
- `config.json` on element.datanauten.de: `mobile_guide_app_variant: "element"`, no `mobile_guide_toast`, no
  `mobile_builds` (so the default Element *classic* store links from `SdkConfig.ts:67-71` are used in `ErrorView`).

### 1.2 Viewport, PWA, browser support

- `apps/web/src/vector/index.html:15` `<meta name="viewport" content="width=device-width, initial-scale=1">` (from
  PR #13818, 2020). No `viewport-fit=cover` (so `env(safe-area-inset-*)` stays 0 in landscape on notched iPhones),
  no `interactive-widget`, pinch-zoom allowed. `:6-10,16,18` apple-touch-icons, manifest, `apple-mobile-web-app-title`,
  `theme-color` (set to the body background on theme change, `theme.ts`).
- `apps/web/res/manifest.json`: `display: standalone`, `start_url: "index.html"`. Safari/Firefox PWA support was
  removed on purpose (PR #24630, 2023: "Safari only supports it on iOS which is not a supported OS").
- Browser support (`README.md` "Supported Environments", v1.12.33): Supported = last 2 Chrome/Firefox/Edge **on desktop
  OSes** + "last 2 versions of Safari"; **Community Supported** = "Mobile web for current stable version of Chrome,
  Firefox, and Safari on Android, iOS, and iPadOS"; and "For accessing Element on an Android or iOS device, we currently
  recommend the native apps". No minimum iOS version is stated. The feature gate is Modernizr
  (`apps/web/.modernizr.json`, `vector/index.ts:44-101`): nothing mobile-specific.

### 1.3 Layout: a fixed three-pane desktop shell

- **Root:** `_common.pcss:86-90` `html { height: 100%; overflow: hidden }`; `_MatrixChat.pcss:27-49` full-height flex
  row. Nothing scrolls at document level; every pane scrolls itself.
- **Left: space panel + room list.** `LoggedInView.tsx:695-716`: `react-resizable-panels` group
  (`GroupView` → `SpacePanel`, `LeftResizablePanelView minSize="200px" maxSize="370px" defaultSize="370px"`,
  `SeparatorView`, room view `Panel`). The space panel is always there (68 px).
  - Auto-collapse: `viewmodels/structures/auto-collapse/behaviours/CollapseOnWindowResizeBehaviour.ts:17`
    `AUTO_COLLAPSE_WIDTH = 768`; `:75-77` start collapsed when `UIStore.windowWidth <= 768`. Collapsed = size **0**
    and `inert` (`packages/shared-components/src/resize/panel/LeftResizablePanelView.tsx:60-63`), not an icon rail
    (the comment in `_LeftPanel.pcss:60-61` says "The room list is not designed to be collapsed to just icons").
  - The only way back is the separator: `SeparatorView.tsx:51-101` renders a 12 px "bar" with a drag icon when
    collapsed (`SeparatorView.module.css:50`), resized by pointer drag or double-click; its label is a tooltip.
  - There is **no route-driven single-pane mode**: selecting a room never collapses the list, opening the list never
    hides the room. With the list open on a 393 px phone the room view gets the remaining ~0–125 px (§3).
  - Upstream: #33265 "Room list collapses when window gets small (and gets stuck that way)" (open, 2026-04), #30844
    "Can no longer shrink the room list" (80 reactions), #33288 collapse/expand handle (open).
- **Right panel** (threads, room info, members, user info): `MainSplit.tsx:107-109` `defaultSize` from storage or 320,
  `minWidth={320}`, `maxWidth="50%"`. On a 393 px screen 320 px + 68 px space panel leaves ≈ 5 px for the timeline.
- **Room header:** compound `Measured`-driven button reduction (PR #33477); `_RoomHeader.pcss:120` the video-call
  option menu has `min-width: 240px`.
- **Composer:** `RoomView.tsx:2126-2127` + `views/elements/Measured.ts:39` (`breakpoint = 500`): ≤ 500 px room-view
  width = `narrow` → `MessageComposer.tsx:545` moves secondary buttons into a "More options" menu. This is the only
  real narrow-mode in the app. Send button only when the composer isn't empty (`MessageComposer.tsx:688`), so Enter on
  the soft keyboard is the main send path.
- **Media queries** (complete list of width/height queries, v1.12.33): `_UserProfileSettings.pcss:63` (768),
  `_EventTile.pcss:491` (480, removes one right margin), `_SettingsDialog.pcss:47` and `_TabbedView.pcss:124` (1024,
  icon-only tab labels), `_AuthHeader.pcss:16`, `_AuthHeaderLogo.pcss:18`, `_AuthPage.pcss:24,28`, `_AuthBody.pcss:283`
  (480/768 auth tweaks). The shared-components CSS modules have none (only colour-scheme / reduced-motion).
- **Fixed widths that overflow a phone:**
  - Settings dialogs `_SettingsDialog.pcss:13-16` `width: 90vw; height: 80vh`, and `:24` **`.mx_SettingsTab
    { min-width: 580px; padding-right: 100px }`** → every settings tab is wider than the screen.
  - Auth: `_AuthBody.pcss:11` `width: 500px` (fixed only for `.mx_AuthBody` at ≤ 480, `:283-288`), the welcome screen
    (`.mx_Welcome`/`.mx_DefaultWelcome`) is not covered: `_DefaultWelcome.pcss:33` buttons `width: 380px` inside a
    500 px modal → the login card is cut off on the right on every phone (measured: modal 500 px in a 393 px viewport).
  - `_SetupEncryptionBody.pcss:10` `width: 600px`; `_RoomUpgradeWarningDialog.pcss:10` `max-width: 38vw`;
    `_SpaceRoomView.pcss:41` `height: calc(100vh - 360px)`.
  - `.mx_Dialog` padding `_common.pcss:328` `32px 40px` (80 px of a 393 px screen).
  - `vh` everywhere instead of `dvh`/`svh` (`_SettingsDialog.pcss:16`, `_ForwardDialog.pcss:16`,
    `_AuthPage.pcss:14` `height: 100vh`, `EmojiPicker.module.css:11-12` `min(450px, 80vh)`, …): on mobile `100vh` is
    the *large* viewport (toolbars hidden), so bottoms are cut off while browser chrome is visible.

### 1.4 Hover-only affordances

- **Message action bar** (react, reply, thread, options): rendered only when
  `getShouldShowMessageActionBar()` (`viewmodels/room/timeline/event-tile/EventTileDerivedState.ts:199-207`) =
  `hover || showActionBarFromFocus || actionBarFocused`. `hover` comes from `onMouseEnter/Leave` on the tile
  (`packages/shared-components/src/room/timeline/event-tile/EventTileView/EventTileView.tsx:30-31,135-136`) and is
  re-validated against the real `:hover` state on `mousemove` (`EventTile.tsx:453-457,681-705`). It is **not in the DOM
  at all** otherwise, so CSS alone can't reveal it. On touch, browsers emit compatibility mouse events on tap, so a tap
  *may* set hover (behaviour differs: iOS sticky hover, Android usually yes; in our Chromium emulation it did **not**,
  see §3).
- Add-reaction button, hover backgrounds, timestamps: `EventTileView.module.css:74-75` (`.root:hover {
  --event-tile-add-reaction-visibility: visible }`), `:307-309`, timestamps shown on hover/focus
  (`EventTileDerivedState.ts:211+`).
- **Context menu**: `EventTile.tsx:767-800` opens on `contextmenu` at `clientX/clientY`, skipping images and links.
  Android Chrome fires `contextmenu` on long-press → works (but also selects text). **iOS Safari never fires
  `contextmenu` on long-press** → no message menu except via the (hover-only) action bar.
  Upstream #13526 "Consider supporting touchscreens a bit better" (open), #12202 "Need to tap on a room twice to view
  it (iPad)" (open; t3chguy: "Riot doesn't try to be touch compatible in many ways").
- Tooltips: compound `Tooltip` = hover/focus; the collapsed separator's only label is a tooltip.
- 108 `:hover` rules in apps/web + shared-components CSS, **0** `@media (hover: …)` / `(pointer: …)` /
  `(any-pointer: …)`.

### 1.5 Touch handling

- The only touch-aware code: the new room list's drag-and-drop sensor (`packages/shared-components/src/room-list/
  VirtualizedRoomListView/VirtualizedRoomListView.tsx:625-636`: 250 ms delay for touch, PR #34381 after #34372 "New
  room list doesn't work with touch screens"). Open follow-up #34402: dragging a room on touch opens its context menu.
- No `touchstart`/`touchend` handlers, no long-press, no swipe (swipe-to-reply #33401 closed), no `touch-action`
  anywhere, no `-webkit-touch-callout`.
- Resizers (left separator, right panel `MainSplit` re-resizable handles, widget/PiP drag) use pointer events; the
  right-panel handle is a few px wide.

### 1.6 Keyboard, viewport and composer

- No `visualViewport`, no `interactive-widget`, no `dvh`, no `VirtualKeyboard` API anywhere.
- iOS Safari and Android Chrome ≥ 108 (default `interactive-widget=resizes-visual`) **don't shrink the layout viewport**
  when the keyboard opens; they pan the visual viewport. With `html { overflow: hidden; height: 100% }` the result is the
  whole app shifted up: room header off-screen, composer just above the keyboard, timeline partly covered;
  `position: fixed` menus/autocomplete measured against `innerHeight` (`UIStore.ts:38-40`, `ContextMenu.tsx:311-339`)
  land under the keyboard. Hydrogen needed a dedicated workaround for exactly this (§2.4).
- iOS zooms the page when focusing an input whose computed font-size < 16 px. Element's composer uses
  `--cpd-font-body-md-regular` (16 px) → OK; the WYSIWYG code block `_Editor.pcss:77` is 15 px; settings `Field`s and
  search inputs vary (measured in §3).
- Composer is a custom `contenteditable` model (`BasicMessageComposer.tsx`, IME handling `:297-304`). Android IMEs
  (Gboard) emit composition events for every word; contenteditable editors are a known source of "backwards typing"/
  lost-character bugs (Cinny #1885) — **not verified on a real device**.

### 1.7 Files, notifications, service worker

- Upload: shared-components `UploadButton` → hidden `<input type="file">` (no `capture`), so the native picker offers
  camera/photos. Drag-and-drop upload (`RoomView` drop zone) is desktop-only by nature. Paste works.
- Notifications: `BasePlatform.ts:216` **`new window.Notification(title, …)`**. Android Chrome throws
  `TypeError: Illegal constructor` (page notifications must use `ServiceWorkerRegistration.showNotification`); iOS has
  `Notification` only inside home-screen web apps (16.4+), where the guide redirect (§1.1) blocks the app anyway.
  `WebPlatform.ts:118-120` `supportsNotifications = Boolean(window.Notification)` → Android offers the toggle, then
  every notification fails.
- Service worker `apps/web/src/serviceworker/index.ts:21-36`: install/activate/fetch only (authenticated media). **No
  `push` handler, no Web Push pusher** → nothing arrives when the tab is in the background or killed, which on mobile is
  almost always. Mobile browsers also freeze background tabs (sync stops).
- Storage: `utils/StorageManager.ts:77` asks `navigator.storage.persist()`; crypto store and sync accumulator live in
  IndexedDB (`MatrixClientPeg.ts:321-322` `initRustCrypto`). WebKit deletes script-writable storage after 7 days without
  user interaction (https://webkit.org/blog/10218/), Safari 17 quota/eviction policy (https://webkit.org/blog/14403/)
  → device logged out / keys lost if the user doesn't open it for a week (upstream #32198 "Missing Session Data", 17 👍;
  #18423 "localStorage / IndexDB write failures are fatal", cites Mobile Safari private mode).
- Crypto: matrix-sdk-crypto-wasm (~8 MB WASM, matrix-sdk-crypto-wasm#365) + IndexedDB. iOS jetsams memory-heavy WASM
  pages (WebKit bugs 256703, 255103); **no Element-specific iOS OOM report found** — risk, not proven.

---

## 2. Upstream: history and stated position

### 2.1 Issues and labels

- One label: **`A-Mobile`** (8 open / 16 closed, applied sparsely; title search "mobile" = 116 issues/PRs). No
  `A-Mobile-Web`/`A-Responsive`.
- Canonical: **#9814 "Want to use mobile browser"** (open since 2019-05, 24 👍, the most upvoted):
  https://github.com/element-hq/element-web/issues/9814. Duplicates closed into it: #22324 "Responsive web design"
  (2022), #29504 (2025), #32606 "make this work for mobile as a PWA" (2026-02, closed same day).
- **#1633 "Adapt better to narrow screens"** (open since 2016, 22 👍; ara4n: "totally agreed we need a narrower mode"):
  https://github.com/element-hq/element-web/issues/1633. **#14962 "Mobile web support is now unusable"** (ara4n 2020,
  closed 2023 in favour of #9814). #82 "Responsive design" (2015). #16199 "Layout broken on Mobile Safari" (2021).
- Narrow/touch: #16691 close chat view like on mobile (open, 12 👍), #8042 room list hard on small screens, #19734
  timeline poor with little horizontal space (open), #21393 autocomplete crushed (open), #18806/#19361 voice message in
  narrow mode (open), #16200 widgets overflow on narrow viewports (open), #12203 unable to expand left sidebar on
  mobile, #24848 increase touch area (open), #22915 settings close target too small (open), #12202, #13526, #34372 →
  PR #34381, #34402.
- PWA: #11646 (2019, shim SW added in PR #11774), #16485 links don't open in PWA (open), #24313 launch handler (open),
  PR #24630 removed Safari/Firefox PWA (2023), PR #28172 prefer native apps (closed).
- Redirect: #21616 "/mobile_guide cannot be disabled" (open, workaround nginx `location ~ /mobile_guide/?(.*)$ { return
  301 /#/welcome; }`), #25610 guide ignores `mobile_builds` (open), #19870 allow redirect to Hydrogen (open), #12209 iPad.
  PRs #30172 (new guide → Element X, 2025), #34350 (sessionStorage flag, 2026-07), #34508 (configurable, closed),
  #32771 (configurable links, closed: "would prefer for it to direct to Element clients").

### 2.2 Stated position (quotes)

- jryans 2019 (#9814/#9329): "we would need to very consciously choose to support mobile web and invest in making it
  work… the team doesn't currently have enough bandwidth."
- ara4n 2020-01 (#9814): "originally… we were aiming for Riot/Web to be basically usable on Mobile Web. However, we
  simply ran out of bandwidth… PRs that improve the behaviour on mobile web (without increasing maintenance burden or
  development complexity on desktop) would be massively appreciated."
- nadonomy 2022 (#14962): rendering deep links on phones "means committing to a responsive web reading experience,
  which I'm not sure we can do right now."
- **PR #29211 "Spell out that Element Web does *not* work on mobile"** (ara4n, merged 2025-04-28): "it may work in
  future. but right now it simply doesn't, and we should say so." langleyd in the same PR: responsive designs are "a
  stretch goal" of the new room list work.
- t3chguy 2026-01 (#30844): "We are looking at improving small screen support for accessibility reasons… but even so,
  see the support policy."
- Half-Shot 2026-03 (PR #32771): "We are not looking to make changes to the mobile guide page at this time, and would
  prefer for it to direct to Element clients."
- Reasons beyond bandwidth (#11646): native/Electron give OS keychains, Seshat search (no WASM threads), push.

### 2.3 Past responsive work

PR #12142 → **#13818 "Add media queries and mobile viewport"** (2020, daleharvey): the viewport meta and the 480 px auth
queries; the companion react-sdk PR (EventTile/RoomHeader queries) was closed. PR #12377 added an "Experimental" tier
for mobile web (later "Community Supported"). Recent narrow-desktop fixes: PR #33477 (room header reduces buttons),
#31130 (emoji picker height), #31425 (autocomplete relative to RoomView), #31899, timeline bottom-pinning on resize
#35277/#35374/#35727 (may help keyboard resizes; inference).

### 2.4 How other clients do it

| Client | Mobile approach | Notable code |
|---|---|---|
| **Hydrogen** (element-hq/hydrogen-web) | Goal "work well on desktop as well as mobile browsers"; no React; IndexedDB + olm. **CSS grid single pane** at `@media screen and (max-width: 800px)`: shows left *or* middle *or* right, a `.close-middle` back button. | `src/platform/web/ui/css/layout.css`; `Platform.js` `adaptUIOnVisualViewportResize()` sets `--ios-viewport-height/-top` from `visualViewport` ("mobile Safari shifts the layout viewport up without resizing it when the keyboard shows", WebKit 141832; PR #279); `user-scalable=no` viewport; `idb/quirks.ts` `detectWebkitEarlyCloseTxnBug`; PR #260 iOS uploads. Still open: #1216 iOS keyboard inconsistencies, #1114 PWA keyboard, #1088 iOS notifications. |
| **Cinny** | `useScreenSize.ts` `MOBILE_BREAKPOINT = 750`, `TABLET_BREAKPOINT = 1124` (ResizeObserver on body); `MobileFriendly.tsx` renders nav *or* page by route (PR #1633, 2024); back button PR #1861. | `maximum-scale=1.0` (prevents input zoom), manifest + `sw.ts`. Gestures/long-press/swipe PR #2366 and web push PR #2356 declined ("revisit once we move over to new SDK"). Open: #2527 white area near iOS keyboard, #1885 backwards typing. |
| **FluffyChat** (Flutter web) | Mobile-first: `themes.dart` `columnWidth = 380`, column mode only above 2×380+80, otherwise single-column stack navigation. Same UI on phone and web; Vodozemac on web. | iOS-Safari specifics not verified. |
| **Commet** | Flutter, web secondary (#862 web instance broken). | — |
| **Sable** (Cinny fork) | Inherits Cinny; #909 multi-line message expands under keyboard. | — |
| Element forks | Spaccamient (Element-derived, mobile-first, 2023, dormant), BBMI Chat (2026, 0★). SchildiChat web: no responsive work found. No maintained "Element mobile CSS" userstyle exists. | — |

What Hydrogen/Cinny/FluffyChat do that Element doesn't: (1) **one pane at a time on phones, driven by navigation
state**, with a back affordance; (2) explicit keyboard handling via `visualViewport` (Hydrogen); (3) touch-first actions
(tap opens a message menu / long-press), not hover; (4) inputs ≥ 16 px or `maximum-scale=1`; (5) a lean boot (no 8 MB
crypto WASM in Hydrogen). Element's module API has no layout/viewport API (`packages/module-api` api.md); the closest
levers are `builtins.renderRoomView(roomId, {hideHeader, hideComposer, hideRightPanel, …})` and
`navigation.registerLocationRenderer()` (a module-owned full page) — enough in principle for a module-owned mobile
shell that embeds Element's room view.

---

## 3. Empirical: Element 1.12.33 under device emulation

Setup: Playwright 1.62 with Chrome (flatpak) + device descriptors (UA, viewport, DPR, `isMobile`, `hasTouch`) for
iPhone 15 (393×659 @3, portrait; 734×343 landscape) and Pixel 8 (412×839 @2.625; 839×412 landscape). Logged-in part:
`themes-mira` session-pool slot, Theme Lab fixtures. Toasts and the datanauten teams-welcome onboarding card hidden
by CSS (except `iphone15/09-teams-welcome-card.png`). **Limits:** this is Chromium with an iOS UA, not WebKit — iOS
keyboard panning, sticky hover, `contextmenu` absence and IndexedDB eviction can't be reproduced; the keyboard is
simulated (a shrunk viewport = Android `resizes-content` best case, and an overlay = iOS/Android default).

### 3.1 Results per device

| | iPhone 15 portrait 393×659 | iPhone 15 landscape 734×343 | Pixel 8 portrait 412×839 | Pixel 8 landscape 839×412 |
|---|---|---|---|---|
| Plain `/` | → `/mobile_guide/` (`00-mobile-guide-redirect.png`) | → guide | → guide | → guide |
| Login/welcome card | 500 px card cut off on the right (`01-login.png`) | fits | cut off | fits |
| Deep link `/#/room/…` | not redirected (`03-…`) | same | same | same |
| After load (logged in) | room list collapsed to 0; space panel 69 px + room view 311 px (`10-home-start.png`) | collapsed; room view 652 px | collapsed; 330 px | **expanded** (839 > 768): 69 + 333 + 436 px |
| Room list dragged open (touch on 12 px separator) | list 309 px, **room view 14 px** (`11-…`) | 306 / 358 | 311 / **31** | 370 / 399 |
| Tap a room in the open list | room view stays 14 px: the room is selected but invisible (`12b-…`) | 358 | 31 | 399 |
| Drag separator back | works (`12c-…`) | works | works | works |
| Thread / room info | right panel 320 px covers the timeline completely (`22-…`, `23-…`) | 320 px next to a ~330 px timeline | covers | side by side |
| Tap on a message | action bar appeared (Chromium sends compatibility mouse events) (`14-…`) | yes | yes | yes |
| Long-press (CDP touch, 900 ms) | no menu, no selection (`16-…`) | no | no | no |
| Synthetic `contextmenu` | full menu at the left edge (`17-…`) | menu partly outside viewport | menu | menu |
| Keyboard, layout shrinks (best case) | header + composer + ~2 messages (`19-…`) | **143 px left: header + composer only, no timeline** | ok | header + composer + 1 message |
| Keyboard over unchanged layout (iOS/Android default) | composer and bottom of timeline hidden (`20-…`) | composer hidden | hidden | hidden |
| Input font-size | **15 px** on every input (composer, search, settings, dialogs) → iOS zooms on focus | 15 | 15 | 15 |
| Room settings / user settings | dialog wider than screen, content cut off; tab labels are icons with tooltip-only names (`25-…`, `26-…`) | fits (tabs+content cramped) | cut off | fits |
| Create room dialog | Create button and fields cut off (`28-…`) | cut off | cut off | cut off |
| User menu | **bottom sheet** (compound `Menu` adapts on touch) (`29-…`) — the one thing that already feels native | | | |
| Spotlight (Ctrl+K) | opens, keyboard-hint tooltip "Use ↑↓ to scroll"; no visible search entry while the list is collapsed (`30-…`) | | | |
| Touch targets in a timeline view | 39 visible, **29 < 44 px, 10 < 24 px** | 44 / 34 / 5 | 41 / 31 / 11 | 39 / 28 / 5 |
| Tooltip on tap of an icon button | none (`24-…`) | none | none | none |

Other observations:

- **Room header**: on a 393 px phone the room *name* is not visible at all (avatar + icon buttons only). On
  element.datanauten.de most of these buttons come from the deployed datanauten modules
  (`extras.addRoomHeaderButtonCallback`: apps grid, room checker, bookmarks, activity, tags, files, table, theme
  palette, …); stock Element would show ~4 (call, threads, info, facepile). Even at 734 px landscape the name is cut.
- **Sticky hover**: after a tap, the action bar (and once a reaction tooltip) stays on the last touched tile until
  another tile is touched (`pixel8/10-home-start.png`, `iphone15-land/14-tap-message.png`).
- **Timeline crush**: in the 311 px room view, code blocks are clipped, and the "End-to-end encryption isn't
  enabled" notice wraps one word per line (`iphone15/24-tap-tooltip.png`).
- **teams-welcome onboarding card** (datanauten module) covers the whole phone screen
  (`iphone15/09-teams-welcome-card.png`); it is fixed-positioned `min(460px, 100vw - 32px)` wide, so it is the module's
  responsive layout, but on a phone it is modal in practice.
- The module skeleton loads on production 1.12.33 next to the 16 deployed modules with no errors (`[mobile-themes]
  loaded: mobile=true (narrow,coarse)`), checked with request interception (nothing deployed).
- Console noise on every device: `Warning! Not using an encryption key for rust crypto store.` (the web build stores the
  crypto store unencrypted at rest; relevant for shared/lost phones), map style missing (location tiles).
- Not reproduced/verified: iOS keyboard panning, iOS long-press (no `contextmenu` in WebKit), Android Gboard input,
  IndexedDB eviction, memory pressure, background tab freezing, Element Call on a phone (the header call button was not
  reachable in portrait: no call frame opened, `31-call-lobby.png`).

### 3.2 Reproduce

```sh
export NODE_PATH=~/projects/matrix-search-widget/node_modules
node mobile/test/audit.mjs --device all          # → recordings/mobile/<device>/*.png + metrics.json/anon.json
```

---

## 4. Conclusion

Element Web's problem on phones is not one bug but a design stance: a desktop three-pane shell whose only small-screen
behaviour is "collapse the room list to nothing below 768 px", interaction that assumes a mouse (hover to reveal,
right-click for menus, tooltips as labels), desktop-sized dialogs, no keyboard/viewport awareness, and a platform layer
(notifications, push, storage) built for an always-open desktop tab — wrapped in a redirect that keeps phones out
before any of it (or any module) runs. Upstream has explicitly chosen not to invest (native apps first), and accepts
only narrow-desktop fixes that don't burden desktop. The layout and interaction layers are reachable from a module
(unlayered CSS beats everything; DOM enhancers can add touch handlers and drive panels); the entry (redirect, PWA) needs
a server-side change; push/notifications/storage need Element core or are browser limits. See
`docs/MOBILE-ISSUES.md` for the itemised list and fix order.
