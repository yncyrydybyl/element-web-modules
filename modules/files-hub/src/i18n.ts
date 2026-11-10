import type { Translations } from "@element-hq/element-web-module-api";

// Flat keys: Element treats "|" in a translation key as a path separator.
export const P = "datanauten_fileshub_";

export type ModuleTranslate = (key: string, variables?: Record<string, string | number>) => string;

export const translations = {
    [`${P}title`]: { en: "Files", de: "Dateien" },
    [`${P}button`]: { en: "Files in this room", de: "Dateien in diesem Raum" },
    [`${P}search`]: { en: "Search by file name", de: "Nach Dateinamen suchen" },

    // Filters
    [`${P}type_all`]: { en: "All", de: "Alle" },
    [`${P}type_document`]: { en: "Documents", de: "Dokumente" },
    [`${P}type_image`]: { en: "Images", de: "Bilder" },
    [`${P}type_video`]: { en: "Videos", de: "Videos" },
    [`${P}type_other`]: { en: "Other", de: "Sonstige" },
    [`${P}filter_type`]: { en: "File type", de: "Dateityp" },
    [`${P}filter_space`]: { en: "Space", de: "Space" },
    [`${P}filter_room`]: { en: "Room", de: "Raum" },
    [`${P}filter_person`]: { en: "Shared by", de: "Geteilt von" },
    [`${P}all_spaces`]: { en: "All spaces", de: "Alle Spaces" },
    [`${P}all_rooms`]: { en: "All rooms", de: "Alle Räume" },
    [`${P}anyone`]: { en: "Anyone", de: "Alle" },

    // Columns
    [`${P}col_name`]: { en: "Name", de: "Name" },
    [`${P}col_shared_by`]: { en: "Shared by", de: "Geteilt von" },
    [`${P}col_room`]: { en: "Room", de: "Raum" },
    [`${P}col_date`]: { en: "Date", de: "Datum" },
    [`${P}col_size`]: { en: "Size", de: "Größe" },
    [`${P}sort_by`]: { en: "Sort by %(column)s", de: "Nach %(column)s sortieren" },
    [`${P}encrypted`]: { en: "End-to-end encrypted", de: "Ende-zu-Ende-verschlüsselt" },
    [`${P}in_thread`]: { en: "in a thread", de: "in einem Thread" },

    // Actions
    [`${P}open`]: { en: "Go to message", de: "Zur Nachricht" },
    [`${P}download`]: { en: "Download", de: "Herunterladen" },
    [`${P}preview`]: { en: "Preview", de: "Vorschau" },
    [`${P}close_preview`]: { en: "Close preview", de: "Vorschau schließen" },
    [`${P}stop`]: { en: "Stop", de: "Stopp" },
    [`${P}search_older`]: { en: "Search older messages", de: "Ältere Nachrichten durchsuchen" },
    [`${P}rescan`]: { en: "Try again", de: "Erneut versuchen" },

    // Status
    [`${P}scanning`]: { en: "Looking for files: %(done)s of %(total)s rooms…", de: "Suche Dateien: %(done)s von %(total)s Räumen…" },
    [`${P}stopped`]: {
        en: "Stopped after %(done)s of %(total)s rooms. Open the view again to continue.",
        de: "Nach %(done)s von %(total)s Räumen angehalten. Öffne die Ansicht erneut, um weiterzumachen.",
    },
    [`${P}since`]: { en: "Files shared since %(date)s.", de: "Seit %(date)s geteilte Dateien." },
    [`${P}more_history`]: {
        en: "%(count)s rooms have older messages that weren't searched.",
        de: "In %(count)s Räumen gibt es ältere Nachrichten, die nicht durchsucht wurden.",
    },
    [`${P}undecryptable`]: {
        en: "%(count)s encrypted messages couldn't be decrypted on this device (missing keys), so files in them can't be listed.",
        de: "%(count)s verschlüsselte Nachrichten konnten auf diesem Gerät nicht entschlüsselt werden (fehlende Schlüssel); Dateien darin fehlen in der Liste.",
    },
    [`${P}errors`]: { en: "%(count)s rooms couldn't be searched.", de: "%(count)s Räume konnten nicht durchsucht werden." },
    [`${P}count`]: { en: "%(count)s files", de: "%(count)s Dateien" },
    [`${P}empty`]: { en: "No files found.", de: "Keine Dateien gefunden." },
    [`${P}empty_filtered`]: { en: "No files match these filters.", de: "Keine Dateien passen zu diesen Filtern." },
    [`${P}privacy`]: {
        en: "Collected on this device from your rooms. Encrypted files are downloaded and decrypted locally only when you preview or download them; nothing is stored after you close Element.",
        de: "Auf diesem Gerät aus deinen Räumen zusammengestellt. Verschlüsselte Dateien werden erst beim Anzeigen oder Herunterladen geladen und lokal entschlüsselt; nach dem Schließen von Element bleibt nichts gespeichert.",
    },

    // Preview
    [`${P}loading_preview`]: { en: "Loading preview…", de: "Vorschau wird geladen…" },
    [`${P}preview_failed`]: { en: "Couldn't load the file: %(error)s", de: "Die Datei konnte nicht geladen werden: %(error)s" },
    [`${P}too_large`]: {
        en: "This file is larger than %(max)s MB. Download it to open it.",
        de: "Diese Datei ist größer als %(max)s MB. Lade sie herunter, um sie zu öffnen.",
    },
    [`${P}load_anyway`]: { en: "Show preview anyway", de: "Vorschau trotzdem anzeigen" },
    [`${P}no_preview`]: { en: "No preview for this file type. Download it to open it.", de: "Für diesen Dateityp gibt es keine Vorschau. Lade die Datei herunter, um sie zu öffnen." },
    [`${P}office_hint`]: {
        en: "%(app)s file. Download it to open it in %(app)s or another office app.",
        de: "%(app)s-Datei. Lade sie herunter, um sie in %(app)s oder einer anderen Office-App zu öffnen.",
    },
    [`${P}no_pdf_viewer`]: {
        en: "This browser can't show PDFs inline. Download the file to open it.",
        de: "Dieser Browser kann PDFs nicht direkt anzeigen. Lade die Datei herunter, um sie zu öffnen.",
    },
    [`${P}not_pdf`]: { en: "This file isn't a valid PDF.", de: "Diese Datei ist kein gültiges PDF." },
    [`${P}download_failed`]: { en: "Download failed: %(error)s", de: "Download fehlgeschlagen: %(error)s" },

    // Cloud links
    [`${P}cloud_sharepoint`]: { en: "SharePoint", de: "SharePoint" },
    [`${P}cloud_onedrive`]: { en: "OneDrive", de: "OneDrive" },
    [`${P}cloud_kind_word`]: { en: "Word document", de: "Word-Dokument" },
    [`${P}cloud_kind_excel`]: { en: "Excel workbook", de: "Excel-Arbeitsmappe" },
    [`${P}cloud_kind_powerpoint`]: { en: "PowerPoint presentation", de: "PowerPoint-Präsentation" },
    [`${P}cloud_kind_pdf`]: { en: "PDF", de: "PDF" },
    [`${P}cloud_kind_onenote`]: { en: "OneNote notebook", de: "OneNote-Notizbuch" },
    [`${P}cloud_kind_folder`]: { en: "Folder", de: "Ordner" },
    [`${P}cloud_kind_image`]: { en: "Image", de: "Bild" },
    [`${P}cloud_kind_video`]: { en: "Video", de: "Video" },
    [`${P}cloud_kind_file`]: { en: "File", de: "Datei" },
    [`${P}cloud_hint`]: {
        en: "Stored in Microsoft 365, not in this room. Opening it may ask you to sign in to Microsoft.",
        de: "Liegt in Microsoft 365, nicht in diesem Raum. Beim Öffnen musst du dich eventuell bei Microsoft anmelden.",
    },
} satisfies Translations;
