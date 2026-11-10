import type { Translations } from "@element-hq/element-web-module-api";

// Flat keys: Element treats "|" in a translation key as a path separator.
export const P = "datanauten_tagmentions_";

export type ModuleTranslate = (key: string, variables?: Record<string, string | number>) => string;

export const translations = {
    [`${P}menu_insert`]: { en: "Mention a tag", de: "Tag erwähnen" },
    [`${P}header_button`]: { en: "Tags", de: "Tags" },

    // Picker
    [`${P}picker_title`]: { en: "Mention a tag", de: "Tag erwähnen" },
    [`${P}picker_hint`]: {
        en: "Adds the tag to your message. When you send it, everyone in the tag gets a mention, in any Matrix app.",
        de: "Fügt den Tag in deine Nachricht ein. Beim Senden bekommt jede Person im Tag eine Erwähnung, in jeder Matrix-App.",
    },
    [`${P}picker_direct_hint`]: {
        en: "Everyone in the tag gets a mention, in any Matrix app.",
        de: "Jede Person im Tag bekommt eine Erwähnung, in jeder Matrix-App.",
    },
    [`${P}message`]: { en: "Message", de: "Nachricht" },
    [`${P}send`]: { en: "Send", de: "Senden" },
    [`${P}insert`]: { en: "Insert", de: "Einfügen" },
    [`${P}notifies`]: { en: "Notifies %(count)s", de: "Benachrichtigt %(count)s" },
    [`${P}absent`]: {
        en: "Not in this room, so not notified: %(names)s",
        de: "Nicht in diesem Raum, daher nicht benachrichtigt: %(names)s",
    },
    [`${P}channel_desc`]: { en: "Everyone in this room (@room)", de: "Alle in diesem Raum (@room)" },
    [`${P}team_desc`]: { en: "Everyone from %(space)s in this room", de: "Alle aus %(space)s in diesem Raum" },
    [`${P}from_space`]: { en: "from %(name)s", de: "aus %(name)s" },
    [`${P}not_allowed`]: {
        en: "You don't have permission to notify the whole room.",
        de: "Du darfst nicht den ganzen Raum benachrichtigen.",
    },
    [`${P}over_max`]: {
        en: "More than %(max)s people, so it won't be expanded.",
        de: "Mehr als %(max)s Personen, daher wird er nicht aufgelöst.",
    },
    [`${P}no_tags`]: { en: "No tags in this room yet.", de: "In diesem Raum gibt es noch keine Tags." },
    [`${P}manage`]: { en: "Manage tags", de: "Tags verwalten" },

    // Manage dialog
    [`${P}manage_title`]: { en: "Tags", de: "Tags" },
    [`${P}manage_intro`]: {
        en: "Type @name in a message to mention everyone in a tag. Tags in a space apply in all of its rooms; a room tag with the same name wins.",
        de: "Tippe @name in eine Nachricht, um alle in einem Tag zu erwähnen. Tags eines Space gelten in allen seinen Räumen; ein gleichnamiger Raum-Tag hat Vorrang.",
    },
    [`${P}scope_room`]: { en: "This room", de: "Dieser Raum" },
    [`${P}scope_space`]: { en: "Space: %(name)s", de: "Space: %(name)s" },
    [`${P}inherited`]: { en: "From spaces", de: "Aus Spaces" },
    [`${P}members_count`]: { en: "%(count)s members", de: "%(count)s Mitglieder" },
    [`${P}new_tag`]: { en: "New tag", de: "Neuer Tag" },
    [`${P}edit`]: { en: "Edit", de: "Bearbeiten" },
    [`${P}delete`]: { en: "Delete", de: "Löschen" },
    [`${P}delete_confirm`]: { en: "Really delete", de: "Wirklich löschen" },
    [`${P}save`]: { en: "Save", de: "Speichern" },
    [`${P}cancel`]: { en: "Cancel", de: "Abbrechen" },
    [`${P}close`]: { en: "Close", de: "Schließen" },
    [`${P}name`]: { en: "Name", de: "Name" },
    [`${P}label`]: { en: "Description", de: "Beschreibung" },
    [`${P}label_placeholder`]: { en: "e.g. Whoever is on call this week", de: "z. B. Wer diese Woche Bereitschaft hat" },
    [`${P}members`]: { en: "Members", de: "Mitglieder" },
    [`${P}search_members`]: { en: "Filter people", de: "Personen filtern" },
    [`${P}add_user_id`]: { en: "Add by Matrix ID (@name:server)", de: "Per Matrix-ID hinzufügen (@name:server)" },
    [`${P}add`]: { en: "Add", de: "Hinzufügen" },
    [`${P}no_permission`]: {
        en: "You can't change tags here. That needs the power level to send \"de.datanauten.tag\" state events (%(level)s).",
        de: "Du kannst die Tags hier nicht ändern. Dafür braucht es das Power-Level für \"de.datanauten.tag\"-State-Events (%(level)s).",
    },
    [`${P}err_name_invalid`]: {
        en: "Use up to 32 lower-case letters, digits, - or _, starting with a letter or digit.",
        de: "Bis zu 32 Kleinbuchstaben, Ziffern, - oder _, beginnend mit Buchstabe oder Ziffer.",
    },
    [`${P}err_name_reserved`]: { en: "@%(name)s is built in.", de: "@%(name)s ist eingebaut." },
    [`${P}err_name_taken`]: { en: "There already is a tag @%(name)s here.", de: "Hier gibt es schon einen Tag @%(name)s." },
    [`${P}err_no_members`]: { en: "Pick at least one member.", de: "Wähle mindestens ein Mitglied." },
    [`${P}err_too_many`]: { en: "A tag can have at most %(max)s members.", de: "Ein Tag kann höchstens %(max)s Mitglieder haben." },
    [`${P}err_user_id`]: { en: "That's not a Matrix ID (@name:server).", de: "Das ist keine Matrix-ID (@name:server)." },
    [`${P}failed`]: { en: "Failed: %(error)s", de: "Fehlgeschlagen: %(error)s" },

    // After sending, when a tag couldn't be expanded
    [`${P}skipped_title`]: { en: "Not everyone was mentioned", de: "Nicht alle wurden erwähnt" },
    [`${P}skip_too_many`]: {
        en: "@%(name)s has more than %(max)s members in this room, so it was sent as plain text.",
        de: "@%(name)s hat in diesem Raum mehr als %(max)s Mitglieder und wurde daher als reiner Text gesendet.",
    },
    [`${P}skip_not_allowed`]: {
        en: "You don't have permission to notify the whole room, so @%(name)s was sent as plain text.",
        de: "Du darfst nicht den ganzen Raum benachrichtigen, daher wurde @%(name)s als reiner Text gesendet.",
    },
    [`${P}skip_empty`]: {
        en: "Nobody from @%(name)s is in this room, so it was sent as plain text.",
        de: "Niemand aus @%(name)s ist in diesem Raum, daher wurde es als reiner Text gesendet.",
    },
    [`${P}ok`]: { en: "OK", de: "OK" },

    // Timeline
    [`${P}footer`]: { en: "Mentioned via tag", de: "Per Tag erwähnt" },
    [`${P}footer_room`]: { en: "whole room", de: "ganzer Raum" },
} satisfies Translations;
