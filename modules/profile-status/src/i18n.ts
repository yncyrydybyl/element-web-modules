import type { Translations } from "@element-hq/element-web-module-api";

// Flat keys: Element treats "|" in a translation key as a path separator.
export const P = "datanauten_profilestatus_";

export type ModuleTranslate = (key: string, variables?: Record<string, string | number>) => string;

export const translations = {
    // User menu
    [`${P}menu_set_status`]: { en: "Set status", de: "Status festlegen" },
    [`${P}menu_edit_card`]: { en: "Edit profile card", de: "Profilkarte bearbeiten" },

    // Availability (wording follows Microsoft Teams in each language)
    [`${P}avail_available`]: { en: "Available", de: "Verfügbar" },
    [`${P}avail_busy`]: { en: "Busy", de: "Beschäftigt" },
    [`${P}avail_dnd`]: { en: "Do not disturb", de: "Nicht stören" },
    [`${P}avail_brb`]: { en: "Be right back", de: "Bin gleich zurück" },
    [`${P}avail_away`]: { en: "Away", de: "Abwesend" },
    [`${P}avail_ooo`]: { en: "Out of office", de: "Nicht im Büro" },
    [`${P}avail_in_call`]: { en: "In a call", de: "In einem Anruf" },

    // Set status dialog
    [`${P}dialog_title`]: { en: "Set your status", de: "Status festlegen" },
    [`${P}availability`]: { en: "Availability", de: "Verfügbarkeit" },
    [`${P}message`]: { en: "Status message", de: "Statusnachricht" },
    [`${P}message_placeholder`]: { en: "e.g. Working from Munich", de: "z. B. Heute aus München" },
    [`${P}public_hint`]: {
        en: "Your status is public: anyone who can look up your profile can see it, in any Matrix app.",
        de: "Dein Status ist öffentlich: Jeder, der dein Profil abrufen kann, sieht ihn, in jeder Matrix-App.",
    },
    [`${P}too_long`]: { en: "That's too long.", de: "Das ist zu lang." },
    [`${P}clear_after`]: { en: "Clear status after", de: "Status löschen nach" },
    [`${P}clear_never`]: { en: "Never", de: "Nie" },
    [`${P}clear_1h`]: { en: "1 hour", de: "1 Stunde" },
    [`${P}clear_today`]: { en: "Today", de: "Heute" },
    [`${P}clear_week`]: { en: "This week", de: "Diese Woche" },
    [`${P}ooo_until`]: { en: "Back on (optional)", de: "Zurück am (optional)" },
    [`${P}ooo_back`]: { en: "Out of office, back on %(date)s", de: "Nicht im Büro, zurück am %(date)s" },
    [`${P}back_on`]: { en: "Back on %(date)s", de: "Zurück am %(date)s" },
    [`${P}past_date`]: { en: "Pick a day in the future.", de: "Wähle einen Tag in der Zukunft." },
    [`${P}auto_reply`]: {
        en: "Reply automatically to direct messages, once per chat and day",
        de: "Direktnachrichten automatisch beantworten, einmal pro Chat und Tag",
    },
    [`${P}auto_reply_hint`]: {
        en: "Only works while Element is open on one of your devices.",
        de: "Funktioniert nur, solange Element auf einem deiner Geräte offen ist.",
    },
    [`${P}auto_reply_text`]: { en: "Automatic reply", de: "Automatische Antwort" },
    [`${P}auto_reply_default`]: {
        en: "I'm out of office and will reply when I'm back. (Automatic reply)",
        de: "Ich bin nicht im Büro und antworte, wenn ich zurück bin. (Automatische Antwort)",
    },
    [`${P}auto_reply_default_until`]: {
        en: "I'm out of office and back on %(date)s. I'll reply then. (Automatic reply)",
        de: "Ich bin nicht im Büro und ab %(date)s zurück. Dann antworte ich. (Automatische Antwort)",
    },
    [`${P}call_status`]: {
        en: "Show “In a call” while I'm in a call",
        de: "„In einem Anruf“ anzeigen, während ich telefoniere",
    },
    [`${P}save`]: { en: "Save", de: "Speichern" },
    [`${P}cancel`]: { en: "Cancel", de: "Abbrechen" },
    [`${P}clear`]: { en: "Clear status", de: "Status löschen" },
    [`${P}close`]: { en: "Close", de: "Schließen" },
    [`${P}failed`]: { en: "Couldn't save: %(error)s", de: "Speichern fehlgeschlagen: %(error)s" },
    [`${P}no_support`]: {
        en: "Your homeserver doesn't support profile fields (MSC4133), so a status can't be saved.",
        de: "Dein Homeserver unterstützt keine Profilfelder (MSC4133), daher kann kein Status gespeichert werden.",
    },

    // Showing a status
    [`${P}until`]: { en: "until %(time)s", de: "bis %(time)s" },
    [`${P}until_today`]: { en: "until end of today", de: "bis heute Abend" },
    [`${P}until_end_of`]: { en: "until end of %(day)s", de: "bis einschließlich %(day)s" },
    [`${P}in_call_since`]: { en: "since %(time)s", de: "seit %(time)s" },
    [`${P}status_and_card`]: { en: "Status and profile card", de: "Status und Profilkarte" },
    [`${P}no_status`]: { en: "No status", de: "Kein Status" },

    // Profile card
    [`${P}card_title`]: { en: "Profile card", de: "Profilkarte" },
    [`${P}job_title`]: { en: "Job title", de: "Position" },
    [`${P}department`]: { en: "Department", de: "Abteilung" },
    [`${P}phone`]: { en: "Phone", de: "Telefon" },
    [`${P}card_hint`]: {
        en: "Public like your display name: anyone who can look up your profile can see these fields.",
        de: "Öffentlich wie dein Anzeigename: Jeder, der dein Profil abrufen kann, sieht diese Felder.",
    },
    [`${P}card_locked`]: { en: "Managed by your organisation", de: "Von deiner Organisation verwaltet" },
    [`${P}edit`]: { en: "Edit", de: "Bearbeiten" },
} satisfies Translations;
