import type { Translations } from "@element-hq/element-web-module-api";

// Flat keys: Element treats "|" in a translation key as a path separator.
export const P = "datanauten_activity_";

export type ModuleTranslate = (key: string, variables?: Record<string, string | number>) => string;

export const translations = {
    [`${P}title`]: { en: "Activity", de: "Aktivität" },
    [`${P}unread`]: { en: "%(n)s unread", de: "%(n)s ungelesen" },
    [`${P}unread_item`]: { en: "Unread", de: "Ungelesen" },
    [`${P}filter`]: { en: "Show", de: "Anzeigen" },
    [`${P}filter_all`]: { en: "All", de: "Alle" },
    [`${P}filter_unread`]: { en: "Unread", de: "Ungelesen" },
    [`${P}filter_mention`]: { en: "Mentions", de: "Erwähnungen" },
    [`${P}filter_reply`]: { en: "Replies", de: "Antworten" },
    [`${P}filter_reaction`]: { en: "Reactions", de: "Reaktionen" },
    [`${P}filter_thread`]: { en: "Threads", de: "Threads" },
    [`${P}mark_all`]: { en: "Mark all as read", de: "Alle als gelesen markieren" },
    [`${P}mention`]: { en: "mentioned you", de: "hat dich erwähnt" },
    [`${P}reply`]: { en: "replied to you", de: "hat dir geantwortet" },
    [`${P}reaction`]: { en: "reacted to your message", de: "hat auf deine Nachricht reagiert" },
    [`${P}thread`]: { en: "replied in a thread", de: "hat in einem Thread geantwortet" },
    [`${P}loading`]: { en: "Loading …", de: "Lädt …" },
    [`${P}empty`]: {
        en: "Nothing in the last 14 days. Mentions, replies, reactions and thread replies show up here.",
        de: "In den letzten 14 Tagen nichts. Erwähnungen, Antworten, Reaktionen und Thread-Antworten erscheinen hier.",
    },
    [`${P}privacy`]: {
        en: "Put together on this device from your rooms; encrypted messages are decrypted locally. Read state is your read receipts, so it matches your other devices.",
        de: "Auf diesem Gerät aus deinen Räumen zusammengestellt; verschlüsselte Nachrichten werden lokal entschlüsselt. Gelesen heißt: deine Lesebestätigung, also wie auf deinen anderen Geräten.",
    },
} satisfies Translations;
