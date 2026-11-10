import type { Translations } from "@element-hq/element-web-module-api";

// Flat keys: Element treats "|" in a translation key as a path separator.
export const P = "datanauten_speed_start_";

export type Translate = (key: string, variables?: Record<string, string | number>) => string;

/** `_1`, `_2` … are variants of the same line; the card picks one at random on each start. */
export const translations = {
    [`${P}session_title_1`]: { en: "Signing you back in", de: "Du wirst wieder angemeldet" },
    [`${P}session_title_2`]: { en: "Finding your account", de: "Dein Konto wird gesucht" },
    [`${P}session_text_1`]: {
        en: "This browser remembers your login, so you don't have to type your password.",
        de: "Dieser Browser kennt deine Anmeldung, du musst dein Passwort nicht eingeben.",
    },
    [`${P}session_text_2`]: { en: "Opening the login saved on this device.", de: "Die auf diesem Gerät gespeicherte Anmeldung wird geöffnet." },

    [`${P}storage_title_1`]: { en: "Opening your conversations on this device", de: "Deine Unterhaltungen auf diesem Gerät werden geöffnet" },
    [`${P}storage_title_2`]: { en: "Reading what this device remembers", de: "Was dieses Gerät gespeichert hat, wird gelesen" },
    [`${P}storage_text_1`]: {
        en: "Element keeps a copy here, so it doesn't have to download everything again.",
        de: "Element hat hier eine Kopie, damit es nicht alles neu herunterladen muss.",
    },
    [`${P}storage_text_2`]: { en: "Nothing is sent anywhere yet: this all happens on your device.", de: "Noch wird nichts gesendet: Das passiert alles auf deinem Gerät." },

    [`${P}keys_title_1`]: { en: "Unlocking your encrypted messages", de: "Deine verschlüsselten Nachrichten werden entsperrt" },
    [`${P}keys_title_2`]: { en: "Getting your keys ready", de: "Deine Schlüssel werden vorbereitet" },
    [`${P}keys_text_1`]: {
        en: "Your keys stay on this device. Only you and the people you write to can read your messages.",
        de: "Deine Schlüssel bleiben auf diesem Gerät. Nur du und deine Gesprächspartner können deine Nachrichten lesen.",
    },
    [`${P}keys_text_2`]: { en: "Not even your server can open them.", de: "Nicht einmal dein Server kann sie öffnen." },

    [`${P}rooms_title_1`]: { en: "Setting up your rooms", de: "Deine Räume werden eingerichtet" },
    [`${P}rooms_title_2`]: { en: "Putting your rooms back in place", de: "Deine Räume werden wieder aufgestellt" },
    [`${P}rooms_text_1`]: { en: "Names, pictures, members and the latest messages.", de: "Namen, Bilder, Mitglieder und die neuesten Nachrichten." },
    [`${P}rooms_text_2`]: { en: "Almost there.", de: "Fast geschafft." },
    [`${P}rooms_count`]: { en: "%(done)s of %(total)s rooms", de: "%(done)s von %(total)s Räumen" },
    [`${P}rooms_count_open_one`]: { en: "%(done)s room", de: "%(done)s Raum" },
    [`${P}rooms_count_open_other`]: { en: "%(done)s rooms", de: "%(done)s Räume" },

    [`${P}download_title_1`]: { en: "Fetching your conversations from %(server)s", de: "Deine Unterhaltungen werden von %(server)s geholt" },
    [`${P}download_title_2`]: { en: "Asking %(server)s for your rooms", de: "%(server)s wird nach deinen Räumen gefragt" },
    [`${P}download_text_1`]: {
        en: "The first start on a device takes longest. Next time Element remembers, and it's much quicker.",
        de: "Der erste Start auf einem Gerät dauert am längsten. Beim nächsten Mal weiß Element es schon, dann geht es viel schneller.",
    },
    [`${P}download_text_2`]: {
        en: "Your server collects everything that happened in your rooms and sends it in one go.",
        de: "Dein Server sammelt alles, was in deinen Räumen passiert ist, und schickt es in einem Rutsch.",
    },
    [`${P}waiting_title_1`]: { en: "Waiting for %(server)s", de: "Warten auf %(server)s" },
    [`${P}waiting_text_1`]: {
        en: "Your connection or the server is slow to answer. Element keeps trying.",
        de: "Deine Verbindung oder der Server antwortet langsam. Element versucht es weiter.",
    },
    [`${P}ready_title_1`]: { en: "All set", de: "Alles bereit" },
    [`${P}ready_text_1`]: { en: "Here you go.", de: "Bitte sehr." },

    [`${P}step_session`]: { en: "Sign-in", de: "Anmeldung" },
    [`${P}step_storage`]: { en: "This device", de: "Dieses Gerät" },
    [`${P}step_keys`]: { en: "Keys", de: "Schlüssel" },
    [`${P}step_rooms`]: { en: "Rooms", de: "Räume" },
    [`${P}your_device`]: { en: "This device", de: "Dieses Gerät" },
    [`${P}your_server`]: { en: "Your server", de: "Dein Server" },

    [`${P}fact_rooms_one`]: { en: "You're in %(rooms)s room.", de: "Du bist in %(rooms)s Raum." },
    [`${P}fact_rooms_other`]: { en: "You're in %(rooms)s rooms.", de: "Du bist in %(rooms)s Räumen." },
    [`${P}fact_rooms_spaces`]: { en: "You're in %(rooms)s rooms across %(spaces)s spaces.", de: "Du bist in %(rooms)s Räumen in %(spaces)s Spaces." },
    [`${P}fact_people`]: { en: "You share rooms with %(people)s people.", de: "Du teilst Räume mit %(people)s Personen." },
    [`${P}fact_servers`]: {
        en: "Your rooms reach %(servers)s servers. Matrix connects them, the way email connects mail providers.",
        de: "Deine Räume reichen über %(servers)s Server. Matrix verbindet sie, so wie E-Mail verschiedene Anbieter verbindet.",
    },
    [`${P}fact_encrypted`]: {
        en: "%(encrypted)s of your rooms are end-to-end encrypted.",
        de: "%(encrypted)s deiner Räume sind Ende-zu-Ende-verschlüsselt.",
    },
    [`${P}fact_dms`]: { en: "You have %(dms)s direct chats.", de: "Du hast %(dms)s Direktnachrichten." },
    [`${P}fact_unread_one`]: { en: "One room had something new when you left.", de: "In einem Raum gab es Neues, als du gegangen bist." },
    [`${P}fact_unread_other`]: { en: "%(unread)s rooms had something new when you left.", de: "In %(unread)s Räumen gab es Neues, als du gegangen bist." },
    [`${P}fact_last_seen`]: { en: "You were last here %(ago)s.", de: "Du warst zuletzt %(ago)s hier." },
    [`${P}fact_home`]: {
        en: "Your account lives on %(server)s. You can talk to people on any other Matrix server.",
        de: "Dein Konto liegt auf %(server)s. Du kannst mit Leuten auf jedem anderen Matrix-Server schreiben.",
    },
    [`${P}fact_open`]: {
        en: "Matrix is open: anyone can run a server, and they all talk to each other.",
        de: "Matrix ist offen: Jeder kann einen Server betreiben, und alle sprechen miteinander.",
    },
    [`${P}fact_copy`]: {
        en: "Element keeps a copy of your rooms on this device, so it starts quicker next time.",
        de: "Element speichert eine Kopie deiner Räume auf diesem Gerät, damit der nächste Start schneller geht.",
    },
    [`${P}fact_decrypt`]: {
        en: "Encrypted messages are unlocked on your device, never on the server.",
        de: "Verschlüsselte Nachrichten werden auf deinem Gerät entsperrt, nie auf dem Server.",
    },
    [`${P}fact_shield`]: {
        en: "A green shield next to a device means it's been verified: it's really that person.",
        de: "Ein grünes Schild neben einem Gerät heißt: Es wurde verifiziert, es ist wirklich diese Person.",
    },
    [`${P}fact_ctrl_k`]: { en: "Tip: Ctrl+K takes you to any room by name.", de: "Tipp: Mit Strg+K kommst du per Name in jeden Raum." },
    [`${P}fact_click`]: {
        en: "Tip: click a room now, and Element opens it as soon as it's ready.",
        de: "Tipp: Klick schon jetzt auf einen Raum, Element öffnet ihn, sobald es bereit ist.",
    },
} satisfies Translations;
