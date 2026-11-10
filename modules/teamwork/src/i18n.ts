import type { Translations } from "@element-hq/element-web-module-api";

// Flat keys: Element treats "|" in a translation key as a path separator.
export const P = "datanauten_teamwork_";

export type ModuleTranslate = (key: string, variables?: Record<string, string | number>) => string;

export const translations = {
    // Composer "+" menu
    [`${P}menu_schedule`]: { en: "Send later", de: "Später senden" },
    [`${P}menu_priority`]: { en: "Important or urgent", de: "Wichtig oder dringend" },
    [`${P}menu_praise`]: { en: "Praise", de: "Lob" },

    // Compose dialog
    [`${P}compose_title`]: { en: "Message options", de: "Nachrichtenoptionen" },
    [`${P}message`]: { en: "Message", de: "Nachricht" },
    [`${P}delivery`]: { en: "Delivery", de: "Zustellung" },
    [`${P}standard`]: { en: "Standard", de: "Normal" },
    [`${P}important`]: { en: "Important", de: "Wichtig" },
    [`${P}urgent`]: { en: "Urgent", de: "Dringend" },
    [`${P}urgent_hint`]: {
        en: "Recipients get a loud notification and a reminder every 2 minutes for 20 minutes until they read it, if they want to.",
        de: "Empfänger bekommen eine laute Benachrichtigung und, wenn sie wollen, 20 Minuten lang alle 2 Minuten eine Erinnerung, bis sie sie lesen.",
    },
    [`${P}urgent_notify`]: { en: "Notify", de: "Benachrichtigen" },
    [`${P}urgent_notify_hint`]: {
        en: "They are mentioned, so every client notifies them, even in rooms set to mentions only.",
        de: "Sie werden erwähnt, damit jede App sie benachrichtigt, auch in Räumen mit „Nur Erwähnungen“.",
    },
    [`${P}when`]: { en: "When", de: "Wann" },
    [`${P}now`]: { en: "Now", de: "Jetzt" },
    [`${P}in_one_hour`]: { en: "In an hour", de: "In einer Stunde" },
    [`${P}tomorrow_morning`]: { en: "Tomorrow 9:00", de: "Morgen 9:00" },
    [`${P}monday_morning`]: { en: "Monday 9:00", de: "Montag 9:00" },
    [`${P}custom_time`]: { en: "Pick a time", de: "Zeit wählen" },
    [`${P}server_holds`]: {
        en: "Your homeserver sends it, end-to-end encrypted, even if all your devices are off.",
        de: "Dein Homeserver sendet sie Ende-zu-Ende-verschlüsselt, auch wenn alle deine Geräte aus sind.",
    },
    [`${P}no_scheduling`]: {
        en: "Your homeserver doesn't support scheduled messages (MSC4140).",
        de: "Dein Homeserver unterstützt keine geplanten Nachrichten (MSC4140).",
    },
    [`${P}no_crypto`]: {
        en: "This room is encrypted and the message couldn't be encrypted for scheduling, so it wasn't scheduled.",
        de: "Dieser Raum ist verschlüsselt, und die Nachricht konnte zum Planen nicht verschlüsselt werden. Sie wurde nicht geplant.",
    },
    [`${P}too_far`]: { en: "Your homeserver allows at most %(max)s ahead.", de: "Dein Homeserver erlaubt höchstens %(max)s im Voraus." },
    [`${P}in_past`]: { en: "Pick a time in the future.", de: "Wähle eine Zeit in der Zukunft." },
    [`${P}send`]: { en: "Send", de: "Senden" },
    [`${P}schedule`]: { en: "Schedule", de: "Planen" },
    [`${P}cancel`]: { en: "Cancel", de: "Abbrechen" },
    [`${P}failed`]: { en: "Couldn't send: %(error)s", de: "Senden fehlgeschlagen: %(error)s" },

    // Scheduled list
    [`${P}scheduled_button`]: { en: "Scheduled messages", de: "Geplante Nachrichten" },
    [`${P}scheduled_title`]: { en: "Scheduled messages", de: "Geplante Nachrichten" },
    [`${P}scheduled_empty`]: { en: "Nothing scheduled.", de: "Nichts geplant." },
    [`${P}scheduled_at`]: { en: "Sends %(when)s", de: "Wird %(when)s gesendet" },
    [`${P}encrypted_preview`]: { en: "🔒 Encrypted, scheduled on another device", de: "🔒 Verschlüsselt, auf einem anderen Gerät geplant" },
    [`${P}send_now`]: { en: "Send now", de: "Jetzt senden" },
    [`${P}unschedule`]: { en: "Delete", de: "Löschen" },
    [`${P}all_devices`]: {
        en: "Held by your homeserver: you see the same list on every device.",
        de: "Liegt auf deinem Homeserver: Du siehst dieselbe Liste auf jedem Gerät.",
    },

    // Saved
    [`${P}save`]: { en: "Save message", de: "Nachricht merken" },
    [`${P}unsave`]: { en: "Remove from saved", de: "Aus Gemerkten entfernen" },
    [`${P}saved_button`]: { en: "Saved messages", de: "Gemerkte Nachrichten" },
    [`${P}saved_title`]: { en: "Saved messages", de: "Gemerkte Nachrichten" },
    [`${P}saved_empty`]: {
        en: "Save a message with the bookmark in its toolbar. Your list follows you to every device.",
        de: "Merke dir eine Nachricht mit dem Lesezeichen in ihrer Werkzeugleiste. Die Liste ist auf allen deinen Geräten da.",
    },
    [`${P}saved_privacy`]: {
        en: "Only references are stored in your account; the messages stay encrypted in their rooms.",
        de: "In deinem Konto liegen nur Verweise; die Nachrichten bleiben verschlüsselt in ihren Räumen.",
    },
    [`${P}redacted`]: { en: "Message deleted", de: "Nachricht gelöscht" },
    [`${P}unavailable`]: { en: "Message not available", de: "Nachricht nicht verfügbar" },
    [`${P}open`]: { en: "Open", de: "Öffnen" },
    [`${P}loading`]: { en: "Loading …", de: "Lädt …" },

    // Praise
    [`${P}praise_title`]: { en: "Praise someone", de: "Jemanden loben" },
    [`${P}praise_who`]: { en: "Who", de: "Wen" },
    [`${P}praise_badge`]: { en: "Badge", de: "Abzeichen" },
    [`${P}praise_note`]: { en: "Add a note (optional)", de: "Notiz (optional)" },
    [`${P}praise_for`]: { en: "for", de: "für" },
    [`${P}praise_send`]: { en: "Send praise", de: "Lob senden" },
    [`${P}praise_pick`]: { en: "Pick at least one person.", de: "Wähle mindestens eine Person." },
    [`${P}badge_thank_you`]: { en: "Thank you", de: "Danke" },
    [`${P}badge_team_player`]: { en: "Team player", de: "Teamplayer" },
    [`${P}badge_above_and_beyond`]: { en: "Above and beyond", de: "Über sich hinaus" },
    [`${P}badge_problem_solver`]: { en: "Problem solver", de: "Problemlöser" },
    [`${P}badge_creative`]: { en: "Creative", de: "Kreativ" },
    [`${P}badge_mentor`]: { en: "Mentor", de: "Mentor" },
    [`${P}badge_calm`]: { en: "Calm under pressure", de: "Ruhe in Person" },
    [`${P}badge_leader`]: { en: "Leader", de: "Vorbild" },

    // Urgent reminders
    [`${P}reminder_title`]: { en: "Urgent message from %(sender)s", de: "Dringende Nachricht von %(sender)s" },
    [`${P}reminder_count`]: { en: "Reminder %(n)s of 10", de: "Erinnerung %(n)s von 10" },
    [`${P}reminder_open`]: { en: "Read now", de: "Jetzt lesen" },
    [`${P}reminder_later`]: { en: "Dismiss", de: "Ausblenden" },
    [`${P}reminder_off`]: { en: "Stop urgent reminders", de: "Keine Erinnerungen mehr" },
} satisfies Translations;
