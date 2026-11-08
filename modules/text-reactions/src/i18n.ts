import type { Translations } from "@element-hq/element-web-module-api";

// Flat keys: Element treats "|" in a translation key as a path separator.
export const P = "datanauten_text_reactions_";

export const translations = {
    [`${P}button`]: { en: "React with text", de: "Mit Text reagieren" },
    [`${P}title`]: { en: "React with text", de: "Mit Text reagieren" },
    [`${P}input_label`]: { en: "Reaction", de: "Reaktion" },
    [`${P}placeholder`]: { en: "e.g. +1, same, 🍕 tonight?", de: "z. B. +1, dito, 🍕 heute?" },
    [`${P}send`]: { en: "React", de: "Reagieren" },
    [`${P}cancel`]: { en: "Cancel", de: "Abbrechen" },
    [`${P}recent`]: { en: "Recently used", de: "Zuletzt verwendet" },
    [`${P}too_long`]: { en: "At most %(max)s characters.", de: "Höchstens %(max)s Zeichen." },
    [`${P}duplicate`]: { en: "You already reacted with “%(key)s”.", de: "Du hast schon mit „%(key)s“ reagiert." },
    [`${P}failed`]: { en: "Couldn't send the reaction: %(error)s", de: "Reaktion konnte nicht gesendet werden: %(error)s" },
    [`${P}no_room`]: { en: "Couldn't find the message's room.", de: "Der Raum der Nachricht wurde nicht gefunden." },
} satisfies Translations;
