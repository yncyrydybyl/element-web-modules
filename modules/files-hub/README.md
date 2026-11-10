# Files hub for Element Web

A Microsoft Teams-style **Files** view for Element: every file shared in your rooms in one list, across rooms and spaces, with filters, search, previews and a jump to the message. In Teams every channel has a Files tab and there's a global "Files" app. Element has a file list per room (Room info → Files), but nothing across rooms, no filters and no preview of documents.

| | Where | How |
| --- | --- | --- |
| **All files** | **Files** in the space panel (left edge) opens a full page. | Name, type, size, who shared it, room and date, newest first. Sort by name, date or size. |
| **This room's files** | Folder icon in the room header. | Same view in a dialog, with the room already selected (like a channel's Files tab). Pick *All rooms* to widen it. |
| **Filters** | Above the list. | Type (documents, images, videos, other), space (includes subspaces), room, person, and search by file name. |
| **Preview** | Click a file. | Images and videos inline, PDFs in the browser's PDF viewer, all from bytes decrypted in the browser. Word, Excel and PowerPoint files get an icon and a hint to download them. |
| **Go to message / Download** | Preview panel, or the download icon on each row. | Opens the room at the message (Element's permalink). Downloads decrypt locally and save under the original name. |
| **SharePoint / OneDrive links** | Under messages that contain such a link. | A card with the kind of file (from the link's `/:w:/`, `/:x:/`… letter or the file extension), the file name if the URL has one, and the tenant. Nothing is fetched from Microsoft. Element's own message is kept above the card, so editing still works. |

## Where the list comes from

Nothing is stored on the server and nothing is added to rooms: the module reads the `m.file`, `m.image`, `m.video` and `m.audio` messages that are already there.

- **Unencrypted rooms: the server filters.** `/messages` with a filter of `types: ["m.room.message"], contains_url: true` returns only events with an attachment, so each page of 100 is all files.
- **Encrypted rooms: the client decrypts.** The server can't see inside `m.room.encrypted`, so `contains_url` doesn't work there. The module fetches the room's message events (`types: ["m.room.encrypted", "m.room.message"]`), decrypts them with Element's own crypto (matrix-js-sdk's event mapper and `decryptEventIfNeeded`), and keeps the attachments. The cost grows with the room's traffic, not with its number of files.
- **First what Element already has.** Events in the rooms' loaded timelines and threads are used before any request, so recent files show up at once. New files and redactions arrive live while the session runs.

### Bounds, so hundreds of rooms stay cheap

- **Lazy.** Nothing happens until the Files view is opened, and then only the rooms in view are scanned: one room from the header, a space's rooms, or all rooms from the page. Most recently active rooms go first.
- **Bounded.** Per room: the last 90 days and at most 500 fetched events (files in unencrypted rooms, all messages in encrypted ones). *Search older messages* moves both bounds by one more window for the rooms in view and continues from where each room stopped.
- **Incremental and cancellable.** Three rooms at a time. Each room keeps its pagination token, so closing the view (or *Stop*) cancels the requests in flight, and reopening it continues instead of starting over.
- **Cached in memory for the session, never on disk.** The index of an encrypted room holds each attachment's decryption key (`content.file.key`). In `localStorage` that would be plain text on disk, readable by any script on Element's origin and still there after logout, and it would weaken what end-to-end encryption protects. So after a reload the rooms are scanned again (from Element's cache first, then the network). For a user with 300 encrypted rooms that means up to 300 × 5 requests of 100 events the first time the global page is opened in a session; the room-header dialog costs one room.

The status line says how far the scan got, how many rooms have older history that wasn't searched, and how many encrypted messages couldn't be decrypted on this device (missing keys); files in those can't be listed.

## Previews and encryption

Files from encrypted rooms are downloaded only when you preview or download them, then decrypted in the browser the way Element's `DecryptFile.ts` does it (matrix-encrypt-attachment: SHA-256 of the ciphertext checked first, then AES-CTR with the key from the event). Element doesn't expose that function to modules, so it's reimplemented here on WebCrypto, in about 30 lines. Downloads use authenticated media (`/_matrix/client/v1/media/download`) with the session's access token, and fall back to the legacy endpoint on servers that don't have it.

- **Images and videos** are shown from a Blob typed with Element's MIME allow-list (`utils/blobs.ts`). SVG, HTML and anything else not on the list never becomes a renderable Blob.
- **PDFs** are not on Element's list, because a Blob URL has Element's origin. Here a PDF is only shown if the decrypted bytes start like a PDF (`%PDF-`), and then as a Blob typed `application/pdf` in an iframe, which hands it to the browser's built-in PDF viewer (PDFium, pdf.js). Those viewers don't give the document's scripts access to the embedding page. Where the browser has no PDF viewer (`navigator.pdfViewerEnabled === false`), you get a download hint instead of a blank frame.
- **Office files** get an icon and a hint. *Open in Collabora / OnlyOffice / Nextcloud* is **not implemented**, deliberately: those editors open a document by fetching it from a URL (WOPI or the Document Server API), so the browser would have to upload the decrypted file to that server, or hand the server a URL plus the user's Matrix access token. The first sends plaintext of an end-to-end encrypted file to a third party, the second leaks the account. Even for unencrypted rooms, authenticated media needs the token. Doing it properly needs a server-side component that the admin trusts with the plaintext (for example an editor integrated with the homeserver's media repository and its own short-lived tokens) and a clear warning per room. Until then, download and open locally. A purely local text preview of `.docx`/`.xlsx` (they're ZIP files with XML) would be possible without any server and is future work.

## Configuration

Optional, in Element's `config.json`:

```json
"de.datanauten.files_hub": {
    "max_age_days": 90,
    "max_events_per_room": 500,
    "concurrency": 3,
    "preview_max_mb": 25,
    "cloud_link_cards": true
}
```

| Key | Default | Meaning |
| --- | --- | --- |
| `max_age_days` | 90 | Age bound per scan window. |
| `max_events_per_room` | 500 | Fetched events per room and window (files in unencrypted rooms, all messages in encrypted ones). |
| `concurrency` | 3 | Rooms scanned at the same time. |
| `preview_max_mb` | 25 | Bigger files ask before they're downloaded for a preview. |
| `cloud_link_cards` | true | Cards for SharePoint / OneDrive links. |

An invalid value stops Element with a configuration error, like Element's own modules do.

## With other clients

Files hub writes nothing: no events, no state, no account data. Other clients aren't affected, and files sent from any client (Element X, Element mobile, FluffyChat, bridges) appear in the list as long as they're standard `m.file` / `m.image` / `m.video` / `m.audio` messages with `url` or `file`. That follows from the spec; other clients weren't tested for this module.

SharePoint / OneDrive links stay plain links in every other client. Only Element Web with this module draws the cards.

## Requirements

- Element Web or Desktop with module API ≥ 2.0.0 (room header button, dialog, message renderer). The **Files** page in the space panel needs the alpha `extras.setSpacePanelItem` and `navigation.registerLocationRenderer` (module API 2.3.0, Element Web v1.12.33). Without them, the room header button is the only entry.
- A homeserver with `/messages` filtering (any current one). Authenticated media (Matrix 1.11) is used when available.
- One file, ~55 kB (16 kB gzipped).

## Limitations

- **Relies on Element internals:** `window.mxMatrixClientPeg` for the client (room list, `/messages`, the event mapper and decryption, the access token) and Element's dialog CSS class (`mx_Dialog_fixedWidth`, widened for this dialog only). Checked against Element Web v1.12.33 (November 2026). Without the client the view stays empty; Element itself keeps working.
- **Not a full history.** By default only the last 90 days and 500 events per room are searched; older files need *Search older messages*.
- **Encrypted rooms cost more** than unencrypted ones (every message is fetched and decrypted, not just files), and files in messages this device has no keys for can't be listed. Key backup helps.
- **Rescans after every reload.** That's the price for not putting decryption keys in `localStorage`.
- **Files in threads** are listed and marked "in a thread" in the preview; *Go to message* uses Element's normal permalink, so what Element shows for a thread event is up to Element (not part of the e2e check).
- **No inline preview for Office files**, see above. Audio files are listed under *Other* without a player.
- **Large lists:** at most 400 rows are drawn at once; filters narrow it down.
- **Cloud link cards** are only labels: whether the link works, and what the file is called when the URL doesn't say, is unknown without asking Microsoft. If another module also registers a renderer for the same message (e.g. teamwork's priority messages with a SharePoint link), only the first registered one is used.

## Development

```sh
pnpm install
pnpm test          # vitest + jsdom: parsing, filters, scanner (pagination, bounds, cancel, live), decryption, UI
pnpm build         # → lib/index.js
e2e/stack.sh up    # throwaway Synapse (files.test, :18483) + Element v1.12.33 (:5814); alice, bob, carol / <name>-pass
e2e/stack.sh down
```
