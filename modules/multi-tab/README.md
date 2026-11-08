# Multi-tab for Element Web

Element Web runs in only one tab per browser: open a second one and it says "Element is open in another window", and continuing there closes the first. This module lets you keep as many Element tabs open as you like. Every tab is a full Element (rooms, threads, encrypted messages, sending, uploads), and they all stay up to date.

| | |
| --- | --- |
| Who does the work | The first tab is the **main tab**: it syncs with the server and holds the encryption keys, as Element always does. Every other tab gets its updates and its decryption from the main tab. The server sees one session, exactly as with one tab. |
| When the main tab closes | Another tab takes over within about a second (it reloads once). The remaining tabs reload once too, to follow it. Drafts are kept. |
| What only the main tab can do | Verify this or another device, set up or reset recovery, key backup and cross-signing, import or export room keys, encrypted to-device messages from widgets. Other tabs show "This needs your main Element tab" instead. |
| Notifications | Only the main tab shows pop-ups and plays sounds, so you aren't notified once per tab. |
| Which tab is which | While more than one tab is open, your avatar (top left) has a coloured ring: each tab its own colour, kept when the tab reloads. Settings → Preferences → **Open tabs** lists every tab with its colour: which one is the main tab, which room it shows, whether it's in front, when it last got an update and how quickly it answers. |
| Signed out | One tab shows the login. The others say "You're signed out. Sign in in your other Element tab" and follow by themselves once you have. If Element asks you to confirm your identity after signing in, the other tabs wait until you've done so. |
| What is stored | Almost nothing. Tabs talk over `BroadcastChannel`s. In `localStorage`, a short promotion note (`de.datanauten.multi_tab.claim`) lives at most 30 s while a tab takes over, and `de.datanauten.multi_tab.engine_build` names the main tab's version. Element's logout clears both. |

## How it works

Element allows one tab because two would both sync the same device: the server deletes a device's to-device messages (which carry the room keys) once any sync has seen them, so two syncing tabs steal each other's keys, and two tabs writing the same encryption store corrupt it. So the module keeps exactly one tab doing both, and makes the others work without either:

```
main tab (stock Element)                          other tabs (Element + patches)
  syncs with the server, Rust crypto, writes        no sync, no crypto store, write nothing to IndexedDB
  the cache; holds the Web Lock                     sync answered from the main tab's recent responses
  keeps its recent /sync responses ──"sync"──▶      decrypt/encrypt ──▶ main tab's crypto
  announces new room keys ──"roomKeys"──▶           retry what they couldn't decrypt yet
                         all over BroadcastChannel; every other request goes to the server directly
```

- **Choosing the main tab:** a Web Lock. The browser releases it when the tab closes or crashes; the next tab in line gets it, notes this in `localStorage` (so the others don't all try), reloads, and comes back as the main tab. A main tab that hangs (frozen) is replaced within about 40 s, and stops for good when it wakes up.
- **A new tab** starts from the cache the main tab has just saved, then asks the main tab for every sync response after that. A response is handed out only once the main tab has processed it, so its room keys are already there when a tab asks to decrypt.
- **Encryption:** other tabs have a stand-in for js-sdk's crypto that forwards to the main tab. Decryption is batched; sending in an encrypted room costs one extra round trip to the main tab. Room keys and recovery secrets never leave the main tab.
- **Tokens:** only the main tab refreshes the access token; other tabs ask it for the current one. Signing out in any tab signs out through the main tab, with the current tokens.
- **Messages between tabs:** one channel for everyone and one inbox per tab, so an answer for one tab isn't copied into all of them. The channel names contain the session, so tabs of another account or version don't see the traffic.

The details, the reasoning and the rejected alternatives (service worker, SharedWorker, extension) are in [HANDOVER.md](HANDOVER.md).

## Limitations

- **Relies on Element internals**, not the module API: `window.mxMatrixClientPeg`, `window.mxPlatformPeg`, `window.mxSettingsStore`, `window.mxDispatcher`, and private matrix-js-sdk fields (`cryptoBackend`, `http.tokenManager`, `toDeviceMessageQueue`, IndexedDBStore methods). Checked against Element Web v1.12.33 (matrix-js-sdk 45.0.0) and Element Pro v1.12.29. On start the module checks what it needs; if something is missing it stays off and Element behaves as without it (one `[multi-tab] Off: …` line in the console).
- **Off** in Element Desktop (one window anyway), with sliding sync, and in low-bandwidth mode.
- **A tab with a different Element or module version** (e.g. one that wasn't reloaded after an update) doesn't join; it shows Element's own "open in another window" screen.
- **When the main tab changes,** the other tabs reload once.
- **Same-origin code is trusted**, as in Element without the module: any script on Element's origin (another module, say) can already use the session and its keys, and it can also ask the main tab to decrypt or encrypt. Keys and recovery secrets never leave the main tab.
- **A hung main tab in Firefox** (a script that doesn't return) also holds up new Element tabs: Firefox doesn't load them until it is free again or you stop the script. Tabs that were already open take over as usual.
- **Unsent messages:** Element keeps them in `localStorage` per room, shared by all tabs; if two tabs have unsent messages in the same room at the same time, one tab's list can overwrite the other's.

## Requirements

Element Web with module API 1.x or 2.x, in a browser with Web Locks and `BroadcastChannel` (Chrome 69+, Firefox 96+, Safari 15.4+). One file, ~66 kB (20 kB gzipped).

## Development

```sh
pnpm install
pnpm test          # vitest: election and promotion, channel, URL routing, sync buffer, crypto stand-in
pnpm lint:types    # also fails if matrix-js-sdk grows a crypto method the module hasn't classified
pnpm build         # → lib/index.js
e2e/stack.sh up    # throwaway Synapse + Element v1.12.33 with the module, logging proxy; see e2e/README.md
node e2e/run.mjs all            # scenarios T1–T16 (multi-tab, encryption, promotion, logout, …)
node e2e/run.mjs --tabs 10 --duration 180   # chaos: random open/close/crash/reload of 10 tabs
e2e/stack.sh down
```

## License

AGPL-3.0-only. See [LICENSE](LICENSE).
