import type { Translations } from "@element-hq/element-web-module-api";

// Flat keys: Element treats "|" in a translation key as a path separator.
export const P = "datanauten_user_account_widgets_";

const strings = {
    button: { en: "My apps", de: "Meine Apps" },
    button_open: { en: "Open my apps", de: "Meine Apps öffnen" },
    button_close: { en: "Close my apps", de: "Meine Apps schließen" },
    panel_label: { en: "My apps", de: "Meine Apps" },
    select_label: { en: "App", de: "App" },
    manage: { en: "Manage my apps", de: "Meine Apps verwalten" },
    close: { en: "Close", de: "Schließen" },
    empty: {
        en: "You have no apps yet. Your apps are only yours: they open in every room, and the room doesn't get them.",
        de: "Du hast noch keine Apps. Deine Apps gehören nur dir: Sie öffnen sich in jedem Raum, ohne dass der Raum sie bekommt.",
    },
    add_app: { en: "Add an app", de: "App hinzufügen" },
    same_origin: {
        en: "%(url)s is served from Element's own address and could read your session. It is not opened.",
        de: "%(url)s liegt auf Elements eigener Adresse und könnte deine Sitzung lesen. Sie wird nicht geöffnet.",
    },

    manage_title: { en: "My apps", de: "Meine Apps" },
    manage_intro: {
        en: "Apps here are stored in your account, not in a room. Open them from the header of any room; they act in the room you open them in.",
        de: "Diese Apps liegen in deinem Konto, nicht in einem Raum. Du öffnest sie in der Kopfzeile jedes Raums; sie arbeiten in dem Raum, in dem du sie öffnest.",
    },
    manage_none: { en: "No apps yet.", de: "Noch keine Apps." },
    open: { en: "Open", de: "Öffnen" },
    remove: { en: "Remove", de: "Entfernen" },
    remove_label: { en: "Remove %(name)s", de: "%(name)s entfernen" },
    suggested: { en: "Suggested", de: "Vorschläge" },
    add: { en: "Add", de: "Hinzufügen" },
    add_title: { en: "Add by URL", de: "Per URL hinzufügen" },
    name: { en: "Name", de: "Name" },
    url: { en: "Widget URL", de: "Widget-URL" },
    url_placeholder: { en: "https://…", de: "https://…" },
    url_invalid: { en: "Enter an http(s) URL.", de: "Gib eine http(s)-URL ein." },
    url_same_origin: {
        en: "Widgets can't be served from Element's own address.",
        de: "Widgets dürfen nicht auf Elements eigener Adresse liegen.",
    },
    failed: { en: "That didn't work: %(error)s", de: "Das hat nicht geklappt: %(error)s" },
    done: { en: "Done", de: "Fertig" },

    consent_title: { en: "Allow “%(name)s”?", de: "„%(name)s“ erlauben?" },
    consent_intro: {
        en: "This app is yours, not the room's. In this room it asks to:",
        de: "Diese App gehört dir, nicht dem Raum. In diesem Raum möchte sie:",
    },
    consent_broad: { en: "reaches beyond this room", de: "reicht über diesen Raum hinaus" },
    consent_remember: { en: "Remember for every room", de: "Für alle Räume merken" },
    allow: { en: "Allow", de: "Erlauben" },
    deny: { en: "Deny", de: "Ablehnen" },

    send_message: { en: "Send messages (%(msgtype)s) as you", de: "Nachrichten (%(msgtype)s) in deinem Namen senden" },
    receive_message: { en: "See messages (%(msgtype)s)", de: "Nachrichten (%(msgtype)s) sehen" },
    send_event: { en: "Send %(type)s events as you", de: "%(type)s-Ereignisse in deinem Namen senden" },
    receive_event: { en: "See %(type)s events", de: "%(type)s-Ereignisse sehen" },
    send_state: { en: "Change room state %(type)s (%(state_key)s)", de: "Raumzustand %(type)s (%(state_key)s) ändern" },
    receive_state: { en: "See room state %(type)s (%(state_key)s)", de: "Raumzustand %(type)s (%(state_key)s) sehen" },
    timeline_any: { en: "Read every room you're in", de: "Alle deine Räume lesen" },
    timeline_room: { en: "Read room %(room)s", de: "Raum %(room)s lesen" },
    send_to_device: { en: "Send %(type)s directly to devices", de: "%(type)s direkt an Geräte senden" },
    receive_to_device: { en: "Receive %(type)s sent directly to your devices", de: "%(type)s empfangen, das direkt an deine Geräte geht" },
    read_relations: { en: "Read replies, threads and reactions", de: "Antworten, Threads und Reaktionen lesen" },
    user_directory: { en: "Search the user directory", de: "Das Nutzerverzeichnis durchsuchen" },
    upload_file: { en: "Upload files", de: "Dateien hochladen" },
    download_file: { en: "Download files shared in the room", de: "Im Raum geteilte Dateien herunterladen" },
    unknown: { en: "%(cap)s", de: "%(cap)s" },
};

export const translations = Object.fromEntries(Object.entries(strings).map(([k, v]) => [P + k, v])) satisfies Translations;

/** Translates one of this module's own strings (key without the prefix). */
export type ModuleTranslate = (key: keyof typeof strings, vars?: Record<string, string>) => string;
