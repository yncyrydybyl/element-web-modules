# Architecture

```
src/
├── index.tsx        Module class: config, wiring, mounting the overlay, building the view
├── config.ts        zod schema for the "de.datanauten.keyboard_shortcuts" config key
├── catalog.ts       Element's shortcut table (mirrored, see "Keeping the catalog current")
├── keys.ts          KeyCombo: matching, recording, parsing "Mod+Shift+K", key-cap labels
├── keyboard.ts      Global keydown listener: "?" trigger + replaying custom shortcuts
├── store.ts         User's custom shortcuts: localStorage + account data sync
├── i18n.ts          This module's own strings (en, de)
├── platform.ts      IS_MAC / IS_ELECTRON, detected the same way as Element
└── ui/
    ├── Overlay.tsx  The Gmail-style overlay (search, sections, customise mode, recorder)
    └── overlay.css  Styles, using Compound design tokens
```

## Showing the overlay

- `KeyboardController` adds **one** `keydown` listener on `window` in the **capture** phase. That runs before every Element handler, which sit on `document` or React's root, in the bubble phase.
- The trigger fires only when focus is not in an editable element (input, textarea, `contenteditable` such as the composer, `role=textbox`) and no Element dialog is open. That way `?` still types a question mark in messages.
- A bare-character trigger like `?` is compared by the produced character, ignoring Shift, because the modifiers needed for `?` depend on the keyboard layout (Shift+/ on US, Shift+ß on German).
- The overlay is a separate React root (`api.createRoot`) in a `<div>` appended to `<body>`. It is not an Element dialog: `api.openDialog` would force Element's narrow dialog chrome, and the Gmail-style multi-column layout needs the full viewport. Because the theme classes live on `<body>`, the overlay inherits light/dark/high-contrast colours.
- While the overlay is open, keydowns inside it are stopped at its container, so typing in the search box or recording a combo can't trigger Element shortcuts behind it. The panel is `role="dialog" aria-modal="true"`, traps Tab, closes on Esc, on the trigger key and on a backdrop click, and returns focus to where it was.

## What is shown

`buildView()` runs on every render:

1. `buildCatalog(ctx)` filters the mirrored table by platform. Desktop-only shortcuts appear only in Element Desktop (`window.electron`). *Open user settings* (⌘,) appears only on macOS desktop. Some defaults depend on the platform (*Go home*: Ctrl+Alt+H vs. Ctrl+Shift+H on macOS) or on the *Ctrl+Enter to send* setting.
2. Labels: `api.i18n.translate(elementKey)`. If Element returns the key itself (e.g. an older version doesn't have it yet), the English fallback from the catalog is used.
3. Admin config: `hidden_categories`, `hidden_shortcuts`, `extra_shortcuts`. Labs is hidden unless `show_labs_settings` or the `developerMode` setting is on, like Element's own Settings tab.
4. Custom shortcuts from the store are attached to their rows.

## Custom shortcuts (aliases)

Element has no API for rebinding keys, and its `KeyBindingsManager` (which does support extra binding providers) isn't reachable from a module. So the module translates keys before Element sees them:

```
user presses Ctrl+Alt+J
 └─ window capture listener: matches alias "filterRooms: Mod+Alt+J"
     ├─ preventDefault + stopImmediatePropagation   (Element never sees Ctrl+Alt+J)
     └─ target.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))
         └─ Element's handlers see Ctrl+K and open room search
```

- The synthetic event is dispatched on the original target (e.g. the composer), so context-sensitive handlers, such as the composer's formatting shortcuts, behave correctly. Synthetic events are tracked in a `WeakSet` so the listener never re-processes its own output.
- This works because Element decides everything in `keydown` handlers and never checks `isTrusted`. It was verified in Element v1.12.32: the alias delivered exactly one `Ctrl+K` with `isTrusted=false`. Browser *default actions* don't run for synthetic events, which doesn't matter here because every remappable action is implemented by Element itself.
- Only *remappable* actions can be aliased: global actions whose default has a modifier. Arrows, Enter, Esc, Tab, Page Up/Down, undo/redo, send and Ctrl+digit are excluded, because their meaning depends on focus or they're handled natively. The recorder rejects combos without Ctrl/Alt/⌘ (they would break typing) and combos already used by another shortcut or the trigger.
- Defaults stay active. Swallowing a default would also need a per-context understanding of what else that key does (Ctrl+E is both *code block* in the composer and *toggle camera* in a call), which only Element has.

## Storage and sync

- Account data event `de.datanauten.keyboard_shortcuts`: `{ "version": 1, "overrides": { "<KeyBindingAction>": "Mod+Alt+J" } }`. Combos are stored with the portable `Mod` modifier, so a shortcut recorded on Linux means ⌘ on a Mac.
- `api.client.accountData.get()` throws until a client exists, and modules load before login. So the store starts from `localStorage`, retries attaching every 3 s, then watches the account data. Changes made on another device arrive live. Overrides made before login are uploaded on first attach. Invalid entries are dropped individually.

## Keeping the catalog current

`src/catalog.ts` mirrors, from Element Web (`apps/web/src/accessibility/`):

- `KEYBOARD_SHORTCUTS` and `CATEGORIES` in `KeyboardShortcuts.ts`,
- `getUIOnlyShortcuts()` in `KeyboardShortcutUtils.ts`,
- `DESKTOP_SHORTCUTS` / `MAC_ONLY_SHORTCUTS` → the `when` conditions.

When upgrading Element, diff those files against the version the catalog was taken from (develop @ 2026-09-25), then update `catalog.ts`. The ids are Element's `KeyBindingAction` string values. They are also the storage keys for custom shortcuts, so **never rename an id that Element didn't rename**. To check that all ids still exist in a given Element checkout:

```sh
grep -o '"KeyBinding\.[A-Za-z]*"' <element-web>/apps/web/src/accessibility/KeyboardShortcuts.ts | sort -u > /tmp/real
grep -o 'id: "KeyBinding\.[A-Za-z]*"' src/catalog.ts | sed 's/id: //' | sort -u | comm -23 - /tmp/real   # must print nothing
```

## Compatibility

- `moduleApiVersion = "^2.0.0"`. `client.accountData`, `settings` and `createRoot` all exist since 2.0.0 (checked in the published 2.0.0, 2.1.0 and 2.2.0 typings). Element Web v1.12.32 ships 2.2.0.
- `api.settings` is accessed defensively (`?.`), so a host without it simply shows the default *Send message* keys.
