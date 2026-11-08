# Text reactions for Element Web

React to a message with any text, not just an emoji: "+1", "same", "count me in 🍕". It's one of SchildiChat's features, as an Element module.

Hover a message and click **Aa** in its action bar (the toolbar with React, Reply, Options). Type the reaction and press <kbd>Enter</kbd>, or click one of your recently used ones. The reaction appears under the message like any other, in every Matrix client.

| | |
| --- | --- |
| What gets sent | A standard `m.reaction` with the text as its key (`m.annotation`). Element and other clients already show text reactions. |
| Length | Up to 64 characters, on one line. |
| Recently used | The last 12, in account data (`de.datanauten.text_reactions`), so they follow you to every device. |
| Twice the same | Shows "You already reacted with …" and sends nothing. |
| Permissions | The button only appears where Element shows its own React button, i.e. where you may react. |

## How it works

The module API has no hook for the message action bar, so the module watches the page for Element's toolbar (`[role=toolbar].mx_MessageActionBar` inside an event tile with `data-event-id`). It adds its button right before Element's React button, found by Element's own translated label, so it works in every language. The button copies the React button's classes, so it looks like its neighbours in every theme. The dialog uses the module API's `openDialog`. Reactions are sent through Element's Matrix client (`window.mxMatrixClientPeg`).

If sending fails, the module removes Element's failed local copy of the reaction, so Element doesn't show its "Some of your messages have not been sent" banner on top of the dialog's error.

## Limitations

- **Mouse only.** Element's toolbar uses a roving tabindex that only knows its own buttons, so the arrow keys skip **Aa**.
- **Relies on Element's DOM:** the toolbar's role and class, `data-event-id`, and the React button's label. Checked against Element Web v1.12.32 and develop (September 2026). If Element changes them, the button disappears; Element itself keeps working.
- **No toggle.** Clicking an existing text reaction under a message removes or adds it as usual (that's Element's own button). The dialog only adds.

## Requirements

Element Web or Desktop with module API ≥ 2.0.0. One file, ~10 kB (4 kB gzipped).

## Development

```sh
pnpm install
pnpm test          # vitest + jsdom: button placement, dialog, sending, duplicates, failed echoes
pnpm build         # → lib/index.js
e2e/stack.sh up    # throwaway Synapse + Element v1.12.32 with the module; log in as alice / alice-pass
e2e/stack.sh down
```

## License

AGPL-3.0-only. See [LICENSE](LICENSE).
