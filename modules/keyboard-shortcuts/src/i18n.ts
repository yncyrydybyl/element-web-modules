import type { Translations } from "@element-hq/element-web-module-api";

/** Strings this module adds on top of the ones it borrows from Element Web. */
export const translations = {
    "datanauten_keyboard_shortcuts_title": { en: "Keyboard shortcuts", de: "Tastenkombinationen" },
    "datanauten_keyboard_shortcuts_show_shortcuts": { en: "Show keyboard shortcuts", de: "Tastenkombinationen anzeigen" },
    "datanauten_keyboard_shortcuts_open_keyboard_settings": { en: "Open keyboard settings", de: "Tastatur-Einstellungen öffnen" },
    "datanauten_keyboard_shortcuts_category_custom": { en: "More", de: "Weitere" },
    "datanauten_keyboard_shortcuts_filter_placeholder": { en: "Search shortcuts", de: "Tastenkombinationen suchen" },
    "datanauten_keyboard_shortcuts_close": { en: "Close", de: "Schließen" },
    "datanauten_keyboard_shortcuts_customise": { en: "Customise", de: "Anpassen" },
    "datanauten_keyboard_shortcuts_done": { en: "Done", de: "Fertig" },
    "datanauten_keyboard_shortcuts_edit": { en: "Set a custom shortcut for “%(action)s”", de: "Eigene Tastenkombination für „%(action)s“ festlegen" },
    "datanauten_keyboard_shortcuts_reset": { en: "Remove custom shortcut for “%(action)s”", de: "Eigene Tastenkombination für „%(action)s“ entfernen" },
    "datanauten_keyboard_shortcuts_reset_all": { en: "Remove all custom shortcuts", de: "Alle eigenen Tastenkombinationen entfernen" },
    "datanauten_keyboard_shortcuts_recording": { en: "Press the new shortcut… (Esc to cancel)", de: "Neue Tastenkombination drücken … (Esc bricht ab)" },
    "datanauten_keyboard_shortcuts_needs_modifier": { en: "Use at least one of Ctrl, Alt or ⌘ so it doesn't clash with typing.", de: "Bitte mindestens Strg, Alt oder ⌘ verwenden, damit es nicht mit dem Tippen kollidiert." },
    "datanauten_keyboard_shortcuts_conflict": { en: "Already used for “%(action)s”.", de: "Bereits belegt für „%(action)s“." },
    "datanauten_keyboard_shortcuts_custom_badge": { en: "custom", de: "eigene" },
    "datanauten_keyboard_shortcuts_or": { en: "or", de: "oder" },
    "datanauten_keyboard_shortcuts_no_results": { en: "No shortcuts match “%(query)s”.", de: "Keine Tastenkombination passt zu „%(query)s“." },
    "datanauten_keyboard_shortcuts_footer_toggle": { en: "Press %(key)s to open or close this overview", de: "%(key)s öffnet und schließt diese Übersicht" },
    "datanauten_keyboard_shortcuts_footer_customise": { en: "Custom shortcuts work in addition to the defaults and sync across your devices.", de: "Eigene Tastenkombinationen gelten zusätzlich zu den Standards und werden zwischen deinen Geräten synchronisiert." },
} satisfies Translations;
