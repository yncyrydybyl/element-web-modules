import type { Translations } from "@element-hq/element-web-module-api";

// Flat keys: Element treats "|" in a translation key as a path separator.
export const P = "datanauten_remote_modules_";

export const translations = {
    [`${P}title`]: { en: "Modules", de: "Module" },
    [`${P}server_title`]: { en: "Provided by the server", de: "Vom Server bereitgestellt" },
    [`${P}server_description`]: {
        en: "Listed in this Element's config.json and loaded at startup. You can turn them off for your account; that takes effect when Element reloads, on each of your devices.",
        de: "In der config.json dieses Elements eingetragen und beim Start geladen. Du kannst sie für dein Konto ausschalten; das wirkt ab dem nächsten Neuladen, auf jedem deiner Geräte.",
    },
    [`${P}how_to_use`]: { en: "How to use", de: "Bedienung" },
    [`${P}version_label`]: { en: "Version %(version)s", de: "Version %(version)s" },
    [`${P}read_more`]: { en: "Read more", de: "Mehr dazu" },
    [`${P}turn_off`]: { en: "Turn off", de: "Ausschalten" },
    [`${P}turn_off_label`]: { en: "Turn off %(name)s", de: "%(name)s ausschalten" },
    [`${P}turn_on`]: { en: "Turn on", de: "Einschalten" },
    [`${P}turn_on_label`]: { en: "Turn on %(name)s", de: "%(name)s einschalten" },
    [`${P}locked`]: { en: "Always on", de: "Immer an" },
    [`${P}locked_hint`]: {
        en: "Starts before this settings tab's own module (or is it), so it can't be turned off here.",
        de: "Startet vor dem Modul dieses Tabs (oder ist es selbst) und lässt sich deshalb hier nicht ausschalten.",
    },
    [`${P}status_off`]: { en: "Turned off", de: "Ausgeschaltet" },
    [`${P}status_next_reload`]: { en: "Loads when Element reloads", de: "Lädt beim nächsten Neuladen" },
    [`${P}server_empty`]: { en: "None.", de: "Keine." },
    [`${P}dynamic_title`]: { en: "Loaded dynamically", de: "Dynamisch geladen" },
    [`${P}warning`]: {
        en: "Modules run inside Element with full access to your account, messages and keys. Only add code you wrote or trust.",
        de: "Module laufen in Element mit vollem Zugriff auf dein Konto, deine Nachrichten und Schlüssel. Füge nur Code hinzu, den du selbst geschrieben hast oder dem du vertraust.",
    },
    [`${P}safe_mode`]: {
        en: "Safe mode (remote_modules=off in the URL): no remote modules were loaded.",
        de: "Abgesicherter Modus (remote_modules=off in der URL): Es wurden keine eigenen Module geladen.",
    },
    [`${P}empty`]: { en: "No modules yet.", de: "Noch keine Module." },
    [`${P}source_label`]: { en: "Module URL or mxc:// URI", de: "Modul-URL oder mxc://-URI" },
    [`${P}add`]: { en: "Add", de: "Hinzufügen" },
    [`${P}upload`]: { en: "Upload .js…", de: ".js hochladen …" },
    [`${P}invalid_source`]: {
        en: "Use an mxc:// URI, an https:// URL or an http://localhost URL.",
        de: "Bitte eine mxc://-URI, eine https://-URL oder eine http://localhost-URL angeben.",
    },
    [`${P}load`]: { en: "Load", de: "Laden" },
    [`${P}load_label`]: { en: "Load %(name)s", de: "%(name)s laden" },
    [`${P}unload`]: { en: "Unload", de: "Entladen" },
    [`${P}unload_label`]: { en: "Unload %(name)s", de: "%(name)s entladen" },
    [`${P}unload_hint`]: {
        en: "A running module can't be stopped: it stays active until Element reloads, and isn't loaded after that.",
        de: "Ein laufendes Modul lässt sich nicht anhalten: Es bleibt bis zum Neuladen aktiv und wird danach nicht mehr geladen.",
    },
    [`${P}remove`]: { en: "Remove", de: "Entfernen" },
    [`${P}remove_label`]: { en: "Remove %(name)s", de: "%(name)s entfernen" },
    [`${P}retry`]: { en: "Retry", de: "Erneut versuchen" },
    [`${P}reload_element`]: { en: "Reload Element", de: "Element neu laden" },
    [`${P}reload_hint`]: {
        en: "A loaded module can't be swapped while Element runs; reloading Element fetches the latest build.",
        de: "Ein geladenes Modul lässt sich im laufenden Element nicht austauschen; Neuladen holt den neuesten Build.",
    },
    [`${P}needs_reload`]: {
        en: "Changes take effect when Element reloads: turned-off or removed modules stay active until then.",
        de: "Änderungen wirken ab dem nächsten Neuladen: Ausgeschaltete oder entfernte Module bleiben bis dahin aktiv.",
    },
    [`${P}status_pending`]: { en: "Waiting", de: "Wartet" },
    [`${P}status_loading`]: { en: "Loading…", de: "Lädt …" },
    [`${P}status_loaded`]: { en: "Loaded", de: "Geladen" },
    [`${P}status_loaded_version`]: { en: "Loaded (module API %(version)s)", de: "Geladen (Modul-API %(version)s)" },
    [`${P}status_failed`]: { en: "Failed: %(error)s", de: "Fehler: %(error)s" },
    [`${P}status_disabled`]: { en: "Not loaded", de: "Nicht geladen" },
    [`${P}status_reload`]: { en: "Still active until Element reloads", de: "Aktiv bis zum Neuladen" },
    [`${P}hint`]: {
        en: "A module is one ES module file (e.g. lib/index.js of a vite library build) whose default export is the module class. Uploads go to your homeserver's media repository. A localhost dev server must send CORS headers. Add ?remote_modules=off to Element's URL to start without remote modules.",
        de: "Ein Modul ist eine einzelne ES-Modul-Datei (z. B. lib/index.js eines vite-Library-Builds), deren Default-Export die Modulklasse ist. Uploads landen im Medien-Repository deines Homeservers. Ein localhost-Dev-Server muss CORS-Header senden. Mit ?remote_modules=off in der Element-URL startet Element ohne eigene Module.",
    },
} satisfies Translations;
