# multi-tab — handover

Element Web module that lets a user keep several Element tabs open on one
device without them fighting over the sync loop and the crypto store.

Status: **implemented (0.1.0), in testing.** See the review outcome right
below: it overrides the sections further down where they disagree.

## Review outcome (2026-11-07)

An engineering review, an independent Codex review and a re-check against
matrix-js-sdk **45.0.0** (what Element v1.12.33 ships; the 28.2.0 below came
from a stale `node_modules`) changed the design as follows. The code in `src/`
follows this list.

- **Election** (`election.ts`): the lock request is never awaited (it only
  settles on release). Promotion writes a short-lived claim to localStorage and
  a mark to sessionStorage, reloads, and takes the lock back with
  `{steal: true}`; any other tab granted the lock while a claim is fresh steps
  back. This prevents the reload ping-pong of every queued mirror. A mirror
  whose engine holds the lock but stops answering pings for ~45 s steals it;
  the engine sees `AbortError`, stops its client and reloads (fencing).
- **No promotion save.** The promoted tab boots from the last engine snapshot.
  Mirrors on the old chain get `resync` and reload (I3).
- **Pull-only relay.** Mirrors ask `sync {since}`; the engine answers from its
  buffer or parks the request. A response is served only after the engine's
  client has processed it (`ClientEvent.Sync` with `nextSyncToken`), so its room
  keys are already in the crypto store. The buffer keeps everything from the
  older of the last two saves. Initial syncs are never buffered.
- **Late keys**: the engine announces `roomKeys` from
  `RustCrypto.onRoomKeysUpdated`; `MirrorCrypto` keeps failed events per Megolm
  session and retries them.
- **CryptoBackend** (`cryptoTable.ts`): every member of js-sdk 45's
  `CryptoBackend` is classified forward / local / secret / unsupported, and a
  type-level test fails on new or removed members. Secrets
  (`getSessionBackupPrivateKey`, exports) never leave the engine; the mirror's
  device listener is switched off instead, so it shows no backup nags.
  `setDeviceIsolationMode` and `isDehydrationSupported` are local, because
  Element calls them right after crypto init. Class results
  (`UserVerificationStatus`, `DeviceVerificationStatus`, `Device`) are rebuilt
  in the mirror (`codec.ts`).
- **Token**: never null the refresh token (a 401 would then log out and wipe the
  shared storage). The mirror overrides `client.http.tokenManager.doTokenRefresh`
  to fetch the engine's token. The engine re-persists its tokens after a mirror
  boots, because every booting tab writes back what it read.
- **Store guard**: `save`, `setSyncData`, `deleteAllData`, to-device batches are
  no-ops; `storeClientOptions`, out-of-band members and user profiles update
  memory only; `backend.clearDatabase` is a no-op (an error in any IndexedDBStore
  method would otherwise delete the shared database). The mirror's
  `ToDeviceMessageQueue` is stopped.
- **Notifications**: the mirror reports its session's local notification setting
  as silenced (account data `m.local_notification_settings.<device>`), which stops
  both pop-ups and sounds; platform no-ops alone don't stop sounds.
- **Session identity**: messages carry a fingerprint of user, device,
  homeserver and build (not the OIDC issuer or client: one device id belongs to
  one session anyway). The channel names contain it too. The module only runs with a
  complete stored session, never with sliding sync or low-bandwidth mode.
- **Scope cut**: no "most recently focused engine" (Q4), no SharedWorker-ready
  transport, no remote `focus` message.

Found in e2e runs and in a second independent review, and fixed:

- **Joining**: a new mirror sends `hello` before it patches anything and only
  mirrors an engine that answers on its fingerprint. Otherwise it stays off,
  and Element shows its own lock screen; this happens for a different build,
  for example. It waits up to 45 s for an engine of the same build (the engine
  writes its build to localStorage), because a busy engine on a big account is
  slow to answer. It runs the election again if nobody holds the lock.
- **Crash recovery**: a new engine broadcasts `engineUp`. Mirrors attached to a
  different engine reload at once instead of waiting for js-sdk's 80 s sync
  timeout.
- **Promotion claim**: on `pagehide` the claim is dropped, or shortened to 5 s if
  the tab is reloading for its promotion. A fresh tab doesn't take a lock that
  is free only because a promoted tab is reloading. At promotion, the dead
  engine's Element session-lock owner falls back to whatever owner is stored,
  so the promoted tab never shows "open in another window".
- **Signed out**: one tab holds a `login` lock and the engine lock, so after the
  login it is the engine without a reload. Other tabs show "You're signed out.
  Sign in in your other Element tab" and reload once a session exists. After a
  logout, every tab reloads; the tab that logged out waits until Element has
  deleted its stores, and doesn't reload at all if a logout redirect is
  under way.
- **Idle long-polls**: Synapse returns `next_batch == since` when nothing
  happened. Such a response wakes the waiting mirrors but isn't stored, so the
  next request parks instead of spinning.
- **Buffer**: keeps the last three saves plus tokens handed out by `flush` in the
  last 60 s. There is a hard size limit independent of saves, and at most 200
  parked requests. `flush` reuses a save from the last 3 s, so many mirrors
  booting at once don't each force one.
- **Token**: the mirror's `doTokenRefresh` never returns `"logout"`. It returns
  `"failure"` when the engine has no token or only the same one, so there are no
  retry loops. The engine answers `NOT_READY` before its client exists.
- **Fencing**: once the lock is stolen, the engine rejects every fetch
  (including token refreshes to the issuer), stops answering as `"engine"`, and
  makes `store.save` a no-op. `ping` reports the sync state, and an engine whose
  client is `STOPPED` counts as dead for the takeover watchdog.
- **Engine decrypts**: an event the engine has already decrypted is answered
  from its own timeline. Otherwise one mapped `MatrixEvent` per event id is
  reused, so RustCrypto's pending-key list doesn't grow with every mirror retry.
  Events whose decrypt RPC failed are retried once the engine answers again.
- **Settings**: `globalBlacklistUnverifiedDevices` and `setDeviceIsolationMode`
  set in a mirror are forwarded to the engine.
- The mirror re-guards `clearDatabase` after `startup()`, which may swap the
  worker backend for a local one.
- **Module API range**: `^1.0.0 || ^2.0.0`. The module only implements `load()`,
  and Element Pro v1.12.29 ships module API 1.17.
- **Logout, then a new login** (found by the browser-matrix T13): a mirror's
  queued promotion could win the lock while every tab reloaded for the logout,
  so the tab holding the lock was not the tab showing the login. After the login,
  the lock holder came back as the engine and took Element's session lock from
  the tab the user had signed in on. Now a logout suppresses promotions, the
  signed-out tabs drop their promote mark, and the login tab queues for the lock
  (`holdForLogin`, never `ifAvailable`) and clears any claim. It waits for that
  lock (up to 20 s) before Element starts: if the engine is the tab that signed
  out, it stays alive while Element deletes its stores and still holds Element's
  session lock, which it releases only on `pagehide`.

Third review (security, performance, code style; 2026-11-07), fixed:

- **Sign-out from a mirror** went out with the mirror's tokens, whose refresh
  token the engine had rotated long ago: only the access token was revoked. The
  mirror now asks the engine (`logout`), which signs out with the current tokens;
  the mirror keeps its refresh token (unused) for the fallback.
- **Forged `cryptoEvent`**: a mirror re-emitted any event name on its client, so
  any same-origin script could make it emit `Session.logged_out`. Only names in
  `CRYPTO_EVENTS` pass now.
- **Watchdog**: a ping waited 15 s and the next one came 15 s later, so a frozen
  engine was replaced only after 75–90 s. Now 5 s timeout, 5 s retry after a
  miss: at most about 40 s. A new tab whose probe never hears from an engine of
  the same build takes over instead of going off.
- **One channel per inbox**: `<base>`, `<base>/engine`, `<base>/tab/<id>`. With
  one shared channel every reply (sync bodies, decrypted events) was copied into
  every tab: n² copies for n tabs.
- **Engine work**: failed decryptions are remembered per "crypto generation"
  (bumped by new room keys and trust events), so booting mirrors don't make the
  engine decrypt known-undecryptable history again; a mirror's `flush` reuses the
  last snapshot when at most 50 responses would have to be replayed; the initial
  sync isn't copied and parsed by the tee; shields are batched (`cryptoBatch`) and
  dropped only for the senders whose trust changed; "room not encrypted" is
  cached for 30 s and "encrypted" is read from room state.
- **Hardening**: claims are capped at 30 s whatever they say; sync replies carry
  the access token only when it changed (`tokenSeq`).
- **Not changed, inherent**: same-origin code can use the engine as an oracle
  (decrypt, encrypt, `shareRoomHistoryWithUser`). In stock Element it can do the
  same with the client and the crypto store, and js-sdk shares room history
  *before* the invite is sent, so the engine can't check membership.
- **New**: Settings → Preferences → "Open tabs" (`tabs.ts`, `ui/tabsSection.ts`),
  fed by a `status` message every tab answers; `window.__multiTab.tabs()`.
- **Identity confirmation after a fresh login**: Element sets
  `force_verification_on_at_login`, and every tab that restores the session
  shows "Confirm your digital identity" until cross-signing is ready. A mirror
  doing that gets stuck, because the confirmation happens in the engine. So the
  mirror's handshake waits behind a notice until the engine's
  `isCrossSigningReady()` is true.

This document was the handover for whoever implements it. Everything below was checked against source; the file
and line references are listed in [§12](#12-source-references) so they can be
re-verified when versions move.

Versions the research was done against:

| Component | Version |
|---|---|
| element-web | `v1.12.32-249-gf0bdf08fa3` (the e2e stack uses v1.12.33 — re-check line numbers there) |
| matrix-js-sdk | 28.2.0 |
| `@element-hq/element-web-module-api` | 2.3.0 |
| matrix-rust-sdk | `main` checkout at `~/projects/element/matrix-rust-sdk` |
| Chromium | `main` checkout at `~/projects/browser-src/chromium` |
| Synapse | `develop`, `synapse/handlers/sync.py` |

---

## 1. Problem

Element Web allows exactly one running instance per browser profile.
`utils/SessionLock.ts` keeps a heartbeat in `localStorage`; a second tab shows
"Element is open in another window" and, if the user continues, kills the
first (`MatrixChat.tsx:326`, `:504`).

The lock exists for two real reasons, both of which still apply:

1. **One `/sync` stream per device.** Synapse deletes a device's to-device
   messages up to the `since` token of every `/sync` request
   (`synapse/handlers/sync.py:633-640`,
   `delete_messages_for_device(..., since_stream_id)`). Two independent
   syncers for the same device steal each other's room keys. Not fixable
   client-side.
2. **One writer for the Rust crypto store.** The IndexedDB crypto store does
   have a cross-process lease lock
   (`matrix-sdk-indexeddb/src/crypto_store/mod.rs:1690`, comment: "hasn't
   been tested yet", since 2023) and `CryptoStoreWrapper::create_cross_process_lock`
   (`matrix-sdk-crypto/src/store/crypto_store_wrapper.rs:395`), but
   `matrix-sdk-crypto-wasm` does not expose it, so js-sdk cannot use it. And
   it would only solve (2), never (1).

Conclusion: **the server must only ever see one syncer and one OlmMachine
per device.** The design makes that an invariant rather than a hope.

### Rejected alternatives (don't re-litigate without new facts)

- **Service worker as engine.** Chromium kills an idle SW after 30 s
  (`content/browser/service_worker/service_worker_version.h:971`,
  `kTimeoutTimerDelay`) and caps any event at 5 min (`:820`,
  `kRequestTimeout`). No sync loop survives that.
- **SharedWorker as engine.** Lifetime is fine (stable everywhere incl.
  Android Chrome: `runtime_enabled_features.json5:5875`,
  `shared_worker.cc:67`), but Element's UI needs the `MatrixClient` object
  *in the page*, synchronously, in thousands of places. Moving the client
  out of the page is an upstream rewrite (months), not a module.
- **Browser extension.** Offscreen documents have unbounded lifetime
  (`extensions/browser/api/offscreen/lifetime_enforcer_factories.cc:22`, only
  `AUDIO_PLAYBACK` is limited, `audio_lifetime_enforcer.cc:18`), so an
  extension *could* keep an engine alive with no tab open. But the engine
  would live on `chrome-extension://`, a different origin: no shared
  IndexedDB, tabs would need tens of MB of state over a channel. Same
  page-side patches, plus per-user install and store review. Only worth it
  if "sync with all tabs closed" becomes a requirement; then it's a thin
  companion that hosts the *same* engine role, see §4.3.

---

## 2. Design in one picture

```
Tab 1 — ENGINE (stock Element, untouched)         Tabs 2..n — MIRROR (stock Element + patches)
  real /sync, real Rust crypto, writes IDB           real UI, real js-sdk, real Room objects
  holds navigator.locks "element-engine"             crypto backend = RPC stub → engine
  ring buffer of raw /sync responses                 /sync answered from engine's buffer
  answers decrypt/encrypt/token RPCs                 every other HTTP request: direct to server
                 ▲          │                              never writes IDB, never notifies
                 └──── BroadcastChannel("de.datanauten.multi_tab") ────┘
```

Roles are decided per tab at module `load()`, before Element's own session
lock runs. A mirror behaves like a full Element for the user; it just
borrows the engine's sync stream and crypto.

---

## 3. Invariants (test every one of them, see §10)

- **I1** Only the engine tab ever calls `GET /sync` on the server.
- **I2** Only the engine tab ever calls `/keys/*`, `/sendToDevice`,
  `/room_keys/*`, `/oauth2/token`-style refresh endpoints.
- **I3** The engine never forwards a `since` token it does not own (i.e.
  that is not in its buffer chain) to the server. Mirrors that ask for an
  unknown token are told to reload.
- **I4** A mirror never writes the shared sync store (`matrix-js-sdk:riot-web-sync`)
  except once, on promotion (§6).
- **I5** A mirror never opens the Rust crypto store.
- **I6** Exactly one tab holds the Web Lock `element-engine` at any time;
  the holder is the engine.
- **I7** A mirror never writes Element's session-lock keys
  (`react_sdk_session_lock_*`), so a tab *without* the module still sees the
  normal "already open" screen.

---

## 4. Components

### 4.1 Election (`src/election.ts`)

```ts
const held = await navigator.locks.request("element-engine", { ifAvailable: true }, lock => !!lock && hold(lock));
```

- Winner: engine. `hold()` returns a promise that never resolves, so the
  lock is kept for the tab's lifetime and released by the browser on close
  or crash. That's the advantage over Element's `localStorage` heartbeat.
- Loser: mirror. It immediately queues
  `navigator.locks.request("element-engine", () => promote())` so it gets
  promoted when the engine goes away.
- `navigator.locks` is available in all targets (Chrome 69, Firefox 96,
  Safari 15.4). If missing, the module does nothing and Element behaves as
  today.

The decision must be made synchronously enough to beat `MatrixChat`'s
`getSessionLock` call. Modules load in `loadPlugins`, which `vector/index.ts:176`
awaits before `loadApp` (`:233`), so an `await` in `load()` is fine (keep it
short; speed-start deliberately awaits nothing, this module has to await the
lock request, which is sub-millisecond).

### 4.2 Transport (`src/channel.ts`)

`BroadcastChannel` on the Element origin. Envelope:

```ts
{ v: 1, from: tabId, to?: tabId | "engine" | "*", id?: number, type: string, ... }
```

Request/response via `id`. Sync responses are addressed `"*"` so every mirror
gets one copy without each asking. `MessagePort` cannot be transferred over
`BroadcastChannel`; if payload cloning per mirror turns out too expensive on
large accounts (§10.4), the upgrade path is a SharedWorker router that holds
one port per tab. Design the message types so this swap is transport-only.

Messages (engine ⇄ mirror):

| type | dir | payload | notes |
|---|---|---|---|
| `hello` | m→e | `{userId, build}` | mirror announces; engine answers `welcome` or `reject` (different user/build) |
| `flush` | m→e | — | engine runs `client.store.save(true)` and replies `{token}` |
| `sync` | m→e | `{since}` | engine replies with the raw response for that `since`, or parks until it arrives; `{resync:true}` if unknown (I3) |
| `sync` | e→* | `{since, next_batch, body}` | pushed to all mirrors on every engine response |
| `decrypt` | m→e | `{roomId, event}` | reply: `EventDecryptionResult` (plain data) |
| `encrypt` | m→e | `{roomId, type, content}` | reply: `{type:"m.room.encrypted", content, senderKey, claimedEd25519Key}` |
| `cryptoCall` | m→e | `{method, args}` | generic `CryptoApi` forwarding for status queries; allow-listed |
| `token` | m→e | — | reply: `{accessToken}` after the engine has refreshed if needed |
| `goodbye` | e→* | — | engine is unloading (`pagehide`) |
| `focus` | m→e | `{roomId}` | optional: "open this in the engine tab" for features a mirror can't do |

### 4.3 Engine role (`src/engine.ts`)

Runs in the lock holder. Element itself is untouched.

- Wraps `window.fetch`. On a `GET …/sync` response (clone the `Response`,
  parse once) it appends `{since, next_batch, body}` to a ring buffer and
  broadcasts it. The buffer keeps everything from the **last store save
  token** onward; js-sdk saves at most every 5 min
  (`store/indexeddb.ts:42`, `WRITE_DELAY_MS`), so the buffer is bounded by
  ~5 min of traffic. Force a save when the buffer exceeds a size threshold
  (e.g. 20 MB) so it stays bounded on busy accounts.
- Tracks the saved token: wrap `client.store.save` (via
  `mxMatrixClientPeg.get()` once the client exists) to record
  `getSavedSyncToken()` after each real save.
- Serves `sync` requests: match `since` against the buffer; if not present
  and `since` equals the latest `next_batch`, park the request and answer on
  the next real response (this is what keeps a mirror's long-poll timing
  natural); otherwise `resync`.
- Serves `decrypt`: `const ev = new MatrixEvent(raw); await client.getCrypto()!.decryptEvent?` —
  use `client["cryptoBackend"].decryptEvent(ev)` (the `CryptoBackend`
  interface, `common-crypto/CryptoBackend.ts:75`), return the
  `EventDecryptionResult` (`:197`). For events already in the engine's
  timeline, prefer `room.findEventById(id)` and read `getClearContent()` to
  avoid double work.
- Serves `encrypt`: build a `MatrixEvent` from `{roomId, type, content}`,
  call `cryptoBackend.encryptEvent(ev, room)` (`:67`); it handles Megolm
  session rotation and key sharing to devices; return the encrypted
  `ev.event`. The mirror then sends the ciphertext itself.
- Serves `token`: `client.getAccessToken()`. The engine is the only tab that
  refreshes (I2).
- `pagehide`: broadcast `goodbye`, `client.store.save(true)` best effort.

Strip `to_device`, `device_lists`, `device_one_time_keys_count`,
`device_unused_fallback_key_types` from broadcast bodies. Mirrors can't use
them and they shouldn't be copied around.

### 4.4 Mirror role (`src/mirror.ts`)

Order matters; each step names the hook.

1. **Session lock.** `window.mxPlatformPeg.get()` is set before modules load
   (`vector/index.ts:160` vs `:176`). Replace on the instance:
   `getSessionLock = async () => true`, `checkSessionLockFree = () => true`
   (`BasePlatform.ts:524`, `:532`). Never touch the `react_sdk_session_lock_*`
   keys (I7).
2. **Handshake.** `hello` → `welcome`; then `flush` → `{token}`. If no engine
   answers within ~1.5 s (engine tab frozen/discarded), release the mirror
   role: `location.reload()` will re-elect.
3. **Client patches.** Wrap `window.mxMatrixClientPeg.set(client)`
   (`MatrixClientPeg.ts:161`, called from `Lifecycle.ts:917` right after
   `createClientWithCreds`, before `assign` at `:1127`). On the instance:
   - `client.initRustCrypto = async () => { client.cryptoBackend = new MirrorCrypto(channel); }`.
     `assign` awaits it at `MatrixClientPeg.ts:321`, before `startClient`
     wires `cryptoCallbacks: this.cryptoBackend` (`client.ts:1573`). I5 holds
     because the Rust store is never opened. Note `assign` skips crypto
     entirely when the `lowBandwidth` setting is on (`:265`); that's fine.
   - `client.store.save = async () => {}` (I4). Keep `getSavedSync` working:
     that's how the mirror boots from the engine's snapshot without network.
   - `client.http.opts.refreshToken = undefined` so js-sdk never tries to
     refresh on its own; token handling is in step 5.
4. **fetch wrapper** (`http-api/fetch.ts:57-61` reads `global.fetch` at call
   time, so patching `window.fetch` in `load()` is enough):

   | request | handling |
   |---|---|
   | `GET …/_matrix/client/*/sync` | `sync` RPC → synthesize `Response` from the body. `resync` → `location.reload()` |
   | `/keys/*`, `/sendToDevice/*`, `/room_keys/*`, `/dehydrated_device*` | reject with a synthetic 403 and log; must never happen (I2) |
   | `POST /user/*/filter` | pass through (the server will return the same id; the mirror's filter param on `/sync` is ignored anyway) |
   | everything else | pass through to the server, with `Authorization` rewritten from the engine-supplied token |

   Media goes through Element's own service worker as usual; nothing to do.
5. **Token.** On the first request and on any `401 M_UNKNOWN_TOKEN`
   (`fetch.ts:158`), ask the engine (`token`), update the header, retry once.
   With MAS refresh-token rotation, a mirror that refreshed on its own would
   invalidate the session for everyone. Spike S1 in §9 covers where js-sdk
   28.x does its own refresh so it can be disabled cleanly.
6. **Notifications.** `platform.displayNotification`, `loudNotification`
   → no-ops (`BasePlatform.ts:214`, `:256`; used from `Notifier.ts:273`,
   `:318`). The engine is the only tab that notifies. Badge/title counts
   keep working because they're computed from the mirror's own room state.
7. **Promotion.** See §6.

### 4.5 `MirrorCrypto` (`src/mirrorCrypto.ts`)

Implements `CryptoBackend` (`common-crypto/CryptoBackend.ts:46-169`). This is
what `client.getCrypto()` returns in a mirror, so every Element call site
that checks `getCrypto()` sees "crypto present".

| method | implementation |
|---|---|
| `decryptEvent(ev)` | `decrypt` RPC; return result verbatim. js-sdk then treats the event as normally decrypted: shields, edits, threads all work |
| `encryptEvent(ev, room)` | `encrypt` RPC; `ev.makeEncrypted("m.room.encrypted", content, senderKey, claimedEd25519Key)` (`models/event.ts:707`) |
| `getEventEncryptionInfo(ev)` | `cryptoCall` RPC, cached per event id |
| `preprocessToDeviceMessages` | return `[]` |
| `processKeyCounts`, `processDeviceLists`, `onSyncCompleted`, `stop`, `prepareToEncrypt` | no-ops |
| `getUserVerificationStatus`, `getDeviceVerificationStatus`, `getUserDeviceInfo`, `isCrossSigningReady`, `isSecretStorageReady`, `getKeyBackupInfo`, `getActiveSessionBackupVersion`, `getOwnDeviceKeys`, `getCrossSigningStatus`, `globalBlacklistUnverifiedDevices` (getter) | `cryptoCall` RPC with adapters: `UserVerificationStatus` / `DeviceVerificationStatus` are plain constructors over booleans, rebuild them client-side |
| `requestOwnUserVerification`, `requestDeviceVerification`, `bootstrapCrossSigning`, `bootstrapSecretStorage`, `resetKeyBackup`, `checkKeyBackupAndEnable`, `importRoomKeys*`, `exportRoomKeys*`, `startDehydration`, `setDeviceVerified`, `crossSignDevice` | throw `MirrorUnsupportedError`; the module catches it at the UI boundary and shows a toast "Do this in your main Element tab" with a button that sends `focus` |
| anything else | throw `MirrorUnsupportedError` and log the method name; collect these during testing and promote them to one of the rows above |

Use a `Proxy` as the catch-all so an unlisted method fails loudly, not
silently.

---

## 5. Boot sequences

**Engine tab** (cold or warm): identical to stock Element. The module only
adds the fetch tee and the RPC server. With speed-start installed first,
nothing changes for it.

**Mirror tab**, cold open while an engine runs:

```
load()        election → mirror; patch platform lock; hello/flush → token T
Lifecycle     createClientWithCreds → Peg.set (patched: stub crypto, no save)
Peg.assign    store.startup() loads the engine's snapshot at T from shared IDB
              initRustCrypto (stub) → instant
startClient   /sync?since=T → engine buffer → responses replay until caught up,
              then long-poll parked on the engine's next response
UI            identical to stock; decryption on demand via RPC
```

Expected time to a usable UI: the same as a warm stock start minus the Rust
crypto init (which is the slowest single step today).

---

## 6. Failure modes and promotion

| event | behaviour |
|---|---|
| Engine tab closes/crashes | Web Lock released → next queued mirror runs `promote()`: `client.store.save(true)` once (its token is the newest in existence, I4 exception), then `location.reload()`. It returns as the engine in a few seconds; IDB is local so the start is warm. Other mirrors receive `goodbye`, park, then `hello`/`flush` the new engine. Any mirror whose token the new engine doesn't know gets `resync` and reloads (I3). |
| Engine tab discarded by the browser (memory pressure) | The lock is released on discard; same as above. A mirror whose `sync` RPC goes unanswered for > 35 s (one long-poll) reloads itself. |
| Engine tab frozen (background throttling) | Timers are throttled but `BroadcastChannel` delivery and `fetch` continue; long-polls still return. If a `flush`/`token` RPC times out, the mirror shows the normal Element "connectivity" banner by failing the request; no reload. |
| Mirror closes | nothing to do. |
| Mirror and engine are different users (two accounts in two tabs, same origin) | `hello` carries `userId`; engine answers `reject`; the mirror falls back to stock behaviour, i.e. Element's "already open" screen. Same for a different Element build hash. |
| Logout in the engine | `localStorage.clear()` and the engine's `pagehide`/reload. Mirrors get `goodbye`; on reload they find no session and show login. Logout in a mirror: pass `/logout` through (it's the device's token, logout is global), then let Element do its normal thing; the engine sees `M_UNKNOWN_TOKEN` and logs out too. |
| Two tabs race for the lock on a fresh profile | Web Locks are strictly serialised; one wins. |
| Module missing in one tab (different deployment, cached old build) | That tab sees Element's own lock screen (I7). Safe. |

---

## 7. What a mirror can't do (document this for users)

Device verification, cross-signing bootstrap, key backup setup/restore,
secret storage, dehydrated devices, room key import/export, "sign out all
other devices" (works, but the prompt for key backup won't). Each shows the
"Do this in your main tab" toast. Everything else, including reading and
sending in encrypted rooms, threads, reactions, uploads, calls (Element Call
runs its own client inside its iframe) and widgets, is expected to behave
normally. Encrypted-room sends are at most one RPC round trip slower.

---

## 8. Hook inventory and version pinning

Every hook is on a `window.mx*` global or a TS-private js-sdk field. They are
stable in practice but not API. Pin the module to Element versions exactly as
speed-start pins its DOM, and gate everything behind a preflight at
`load()` that checks each hook exists and has the expected arity. If the
preflight fails, log once and return: Element behaves as today.

| hook | where | used for |
|---|---|---|
| `window.mxPlatformPeg.get()` | `PlatformPeg.ts:53` | session lock, notifications |
| `window.mxMatrixClientPeg.set/get` | `MatrixClientPeg.ts:161`, `:150`, `:369` | reach the client at creation |
| `client.initRustCrypto`, `client.cryptoBackend` | `client.ts:2304` | stub crypto |
| `client.store.save`, `getSavedSyncToken` | `store/indexeddb.ts:183`, `:225` | I4, buffer bookkeeping |
| `client.http.opts` | `http-api/fetch.ts:49` | token handling |
| `window.fetch` | `http-api/fetch.ts:61` | relay and routing |
| `MatrixEvent.makeEncrypted` | `models/event.ts:707` | public API, fine |
| `navigator.locks`, `BroadcastChannel` | web platform | election, transport |

The module API 2.3 `ClientApi` (`creationManagement`, `accountData`,
`getRoom`) offers no client-creation hook beyond X.509 options, which is why
the globals are used. If a later module API adds `waitForClientStarted` or a
creation hook, migrate.

---

## 9. Implementation plan

Scaffold from `modules/speed-start` (same `vite.config.ts`, `vitest`,
`tsconfig`, `e2e/stack.sh`). Package name
`@datanauten/element-web-module-multi-tab`.

| # | milestone | contents | est. |
|---|---|---|---|
| M0 | Spikes | **S1** find where js-sdk 28.x performs the 401 refresh (it's not in `src/http-api/fetch.ts`; look in the compiled `lib/` and `client.ts` around `refreshToken`/`oauthClientId`) and the cleanest way to disable it per client. **S2** confirm `Response` cloning cost of a 3,500-room sync body and `BroadcastChannel` clone cost per mirror. **S3** confirm `IndexedDBStore` tolerates a second reader while the engine's worker writes (it should: snapshots are whole-object `put`s). | 1–2 d |
| M1 | Election + transport + preflight | `election.ts`, `channel.ts`, `preflight.ts`, role decision in `load()`, session-lock override. Two tabs both show the UI, both still sync independently (unsafe, test stack only). | 1 d |
| M2 | Sync relay | engine fetch tee + ring buffer + saved-token tracking; mirror `/sync` interception; `flush`; `resync`. Unencrypted rooms fully work. I1, I3, I4 enforced. | 2 d |
| M3 | Crypto RPC | `MirrorCrypto` decrypt/encrypt/info; engine handlers; `Proxy` catch-all; toast for unsupported. Encrypted rooms read and send. I2, I5. | 3 d |
| M4 | Token + notifications + promotion | `token` RPC, 401 retry, notification no-ops, `promote()`, `goodbye`, reload rules. | 2 d |
| M5 | Hardening | every row of §6 reproduced in Playwright; large-account measurements; Firefox and Safari pass. | 3–5 d |
| M6 | Docs + deploy | README like speed-start's, deploy via `datanauten_element_modules` in MDAD `vars.yml`, after speed-start in load order. | 0.5 d |

Total: roughly two to three weeks for one person who already knows Element's
boot path.

---

## 10. Testing

### 10.1 Unit (vitest, jsdom)

- `election.ts`: fake `navigator.locks`; first caller wins; second queues;
  promotion callback fires on release; absence of `navigator.locks` → no-op.
- `channel.ts`: request/response correlation, timeouts, `to` filtering,
  envelope version mismatch ignored.
- Engine buffer: append, lookup by `since`, parked requests resolve on next
  append, eviction at saved token, size-based forced save, `resync` for
  unknown tokens (I3).
- Mirror fetch router: table in §4.4 as a parametrised test; synthetic 403 for
  the forbidden paths (I2); `Authorization` rewrite; one retry on 401.
- `MirrorCrypto`: each row of §4.5; unlisted method throws and logs.
- Sync body stripping: `to_device` etc. absent after broadcast.
- Preflight: each missing hook → disabled module, one log line.

### 10.2 Integration (Playwright against `e2e/stack.sh`)

Reuse speed-start's stack (Synapse v1.162.0, users alice/bob, 40 rooms with
"Secret preview text N"). Add encrypted rooms: create 10 rooms with
`m.room.encryption` set, have bob (a second, verified device via the
Synapse admin API or a second Playwright context) post messages so that the
engine must actually decrypt. Multiple Playwright `page`s in **one**
`BrowserContext` share `localStorage`, IndexedDB and `BroadcastChannel`,
which is exactly the multi-tab case.

Every test records server-side evidence through the Synapse request log or
a logging reverse proxy in front of Synapse (a 20-line Node script that
logs method+path+`since`+`Authorization` suffix is enough). The invariants
are asserted on that log, not on the client.

| id | scenario | assertion |
|---|---|---|
| T1 | open tab A (engine), then tab B | B shows the room list without the "already open" dialog; exactly one `/sync` stream in the server log (I1) |
| T2 | T1, then post a message in an unencrypted room from bob | appears in A and B within one long-poll; B's `/sync` requests never reach the server |
| T3 | T1, encrypted room, bob posts | A and B both render plaintext; B's log has zero `/keys/*` requests (I2, I5) |
| T4 | send from B in an encrypted room | A, B and bob's client show it decrypted; the `PUT /send` came from B with ciphertext; `/keys/claim` (if any) came from A |
| T5 | close A | B becomes engine within 10 s (watch for its reload and a `/sync` from B); a third tab C re-attaches; server log shows at most one `/sync` stream at any moment, and never two overlapping `since` chains (I1, I6) |
| T6 | close A while B has a message in the composer | after B's reload the draft is restored (Element's `mx_cider_state_*`) |
| T7 | discard A via CDP `Page.setWebLifecycleState({state:"frozen"})` then `Target.closeTarget` | same as T5 |
| T8 | B open for 6+ minutes (past `WRITE_DELAY_MS`) while A syncs | no `resync` happened; B's token still inside A's buffer; IDB sync store written only by A (instrument `IDBObjectStore.prototype.put` in B and assert zero calls for the sync DB — I4) |
| T9 | log in as a different user in B (fresh `localStorage` key set) | B gets `reject` and shows Element's normal lock screen |
| T10 | tab without the module (load Element from a second port with no module config) alongside A | shows Element's own "already open" screen (I7) |
| T11 | token refresh: run the stack with MAS or shorten the access-token lifetime; wait for expiry with A and B open | exactly one refresh request in the log, from A; B keeps working after one 401 (I2) |
| T12 | open verification settings in B | toast "Do this in your main tab"; no `/keys/*` request from B |
| T13 | logout from B | both tabs end on the login screen; no stray requests with the dead token after 5 s |
| T14 | reload B ten times in a loop | each boot takes `< 1.5 ×` a stock warm boot; no `resync` |
| T15 | speed-start + multi-tab together | overlay appears in B too, handover works, snapshot captured by both roles without duplicate writes |

### 10.3 Browser matrix (manual, once per release)

Chrome, Firefox, Safari (macOS), Chrome Android (tabs there are backgrounded
aggressively: verify T5/T7 behaviour), Element Desktop (the module should
detect `ElectronPlatform` and do nothing: Desktop already has one process).

### 10.4 Performance (on the real 3,500-room account, staging first)

- Measure `/sync` body sizes over an hour; compute buffer memory at the 5 min
  save cadence; set the forced-save threshold from that.
- Time `structuredClone` of the largest body × number of mirrors; if > 50 ms
  on the engine's main thread, move to the SharedWorker router (§4.2).
- Mirror cold open: compare with a stock warm open; expect equal or faster.
- Decrypt RPC latency on a 500-message scroll-back in an encrypted room; batch
  `decrypt` requests (array of events per message) if the per-event round
  trip shows.

### 10.5 Security checks

- Mirror never has Olm/Megolm key material in memory: grep heap snapshot for
  the pickle key prefix and `curve25519` session blobs after an hour of use.
- Broadcast bodies contain no `to_device` (T3 plus a unit test).
- `BroadcastChannel` is same-origin by definition; still, every message
  carries `userId`, and the engine ignores messages for another user.
- The synthetic 403 path logs enough to notice if Element ever starts
  hitting a forbidden endpoint through a new code path after an upgrade.

---

## 11. Open questions

- **Q1** Does Element's own service worker (authenticated media,
  `serviceworker/index.ts`) read the access token from IDB on its own? If a
  mirror's token lags after a refresh, media could 401 briefly in the mirror.
  Check `serviceworker/index.ts:65-99` during S1.
- **Q2** `IndexedDBStore` degrades to `MemoryStore` on any error
  (`MatrixClientPeg.ts:250`). A mirror that lands on `MemoryStore` has no
  snapshot and would need an initial sync *from the engine*. Decide: reload
  once, then give up and fall back to stock behaviour.
- **Q3** Presence: both tabs set presence via the engine's `/sync`
  `set_presence`. A mirror's idle state should probably not change presence;
  decide whether to pass `/presence` PUTs through.
- **Q4** Should the engine be the *most recently focused* tab instead of the
  first one? It would keep notifications on the visible tab. Costs a
  promotion (reload) on every focus change, so probably no; revisit after M5.

---

## 12. Source references

Element Web `apps/web/src` (tree `v1.12.32-249-gf0bdf08fa3`):

- `vector/index.ts:160` `preparePlatform()` before `:176` `loadPlugins()` and `:233` `loadApp()`
- `utils/SessionLock.ts:33-45` lock keys; `components/structures/MatrixChat.tsx:326`, `:504`
- `BasePlatform.ts:192` `supportsNotifications`, `:214` `displayNotification`, `:256` `loudNotification`, `:524` `checkSessionLockFree`, `:532` `getSessionLock`
- `MatrixClientPeg.ts:150` `get`, `:161` `set`, `:239` `assign`, `:244-260` store startup with memory fallback, `:264-267` crypto unless `lowBandwidth`, `:321` `initRustCrypto`, `:369` `window.mxMatrixClientPeg`
- `Lifecycle.ts:917` `MatrixClientPeg.set(createClientWithCreds(...))`, `:1124` `start`, `:1127` `assign`
- `utils/createMatrixClient.ts:120-131` client opts incl. `refreshToken`, `onTokenRefresh`, `oauthClientId`; `:180-184` `IndexedDBStore` with worker
- `utils/tokens/tokens.ts:24-36` token storage keys
- `Notifier.ts:230`, `:273`, `:318`
- `PlatformPeg.ts:53` `window.mxPlatformPeg`; `dispatcher/dispatcher.ts:184`; `settings/SettingsStore.ts:904`

matrix-js-sdk 28.2.0 (`node_modules/matrix-js-sdk/src`):

- `http-api/fetch.ts:57-61` `fetchFn ?? global.fetch` at call time; `:145` `Authorization`; `:158` `M_UNKNOWN_TOKEN`
- `client.ts:1573` `cryptoCallbacks: this.cryptoBackend`; `:2304` `this.cryptoBackend = rustCrypto`; `:4586` `encryptAndSendEvent`; `:4693` throw without backend
- `common-crypto/CryptoBackend.ts:46-169` interface; `:197` `EventDecryptionResult`
- `models/event.ts:707` `makeEncrypted`
- `store/indexeddb.ts:42` `WRITE_DELAY_MS`, `:170` `getSavedSync`, `:183` `getSavedSyncToken`, `:225` `save(force)`
- `sync.ts:733-739` saved sync on start; `:1011` `qps.since`

Module API 2.3.0: `lib/element-web-module-api.d.ts:225` `ClientApi`, `:248` `ClientCreationManagementApi`

Synapse `develop`: `synapse/handlers/sync.py:633-640`

matrix-rust-sdk `main`: `crates/matrix-sdk-indexeddb/src/crypto_store/mod.rs:1690-1745`; `crates/matrix-sdk-crypto/src/store/crypto_store_wrapper.rs:395-402`

Chromium `main`: `content/browser/service_worker/service_worker_version.h:820`, `:971`; `third_party/blink/renderer/platform/runtime_enabled_features.json5:5875`, `:5883`; `third_party/blink/renderer/core/workers/shared_worker.cc:67`; `extensions/browser/api/offscreen/lifetime_enforcer_factories.cc:22`; `extensions/browser/api/offscreen/audio_lifetime_enforcer.cc:18`
