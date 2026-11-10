import type { Translations } from "@element-hq/element-web-module-api";

import type { Language } from "./config";

// Flat keys: Element treats "|" in a translation key as a path separator.
export const P = "datanauten_teamswelcome_";

export type ModuleTranslate = (key: string, variables?: Record<string, string | number>) => string;

type Entry = { en: string; de: string };

export const translations = {
    // Frame
    [`${P}title`]: { en: "Coming from Teams?", de: "Du kommst von Teams?" },
    [`${P}title_org`]: { en: "Welcome to %(org)s on Element", de: "Willkommen bei %(org)s in Element" },
    [`${P}intro`]: {
        en: "Four short steps and Element will feel familiar. Close this any time: it's in your user menu (your avatar, top left) when you want it back.",
        de: "Vier kurze Schritte, und Element fühlt sich vertraut an. Du kannst das jederzeit schließen: Im Benutzermenü (dein Avatar oben links) findest du es wieder.",
    },
    [`${P}menu_item`]: { en: "Coming from Teams?", de: "Umstieg von Teams" },
    [`${P}close`]: { en: "Close", de: "Schließen" },
    [`${P}back`]: { en: "Back", de: "Zurück" },
    [`${P}next`]: { en: "Next", de: "Weiter" },
    [`${P}finish`]: { en: "Done", de: "Fertig" },
    [`${P}step_of`]: { en: "Step %(n)s of %(total)s", de: "Schritt %(n)s von %(total)s" },
    [`${P}help`]: { en: "Questions? %(label)s", de: "Fragen? %(label)s" },
    [`${P}help_default`]: { en: "Contact your IT team", de: "Wende dich an deine IT" },
    [`${P}done_badge`]: { en: "Done", de: "Erledigt" },

    // Step titles
    [`${P}step_secure`]: { en: "Secure your messages", de: "Nachrichten absichern" },
    [`${P}step_habits`]: { en: "Where things are", de: "Wo was ist" },
    [`${P}step_profile`]: { en: "Profile and notifications", de: "Profil und Benachrichtigungen" },
    [`${P}step_spaces`]: { en: "Join your team's spaces", de: "Den Spaces deines Teams beitreten" },

    // Step 1: secure
    [`${P}secure_why`]: {
        en: "Your messages in Element are end-to-end encrypted: only the people in a chat can read them, not even the server. The keys that unlock them live on your devices.",
        de: "Deine Nachrichten in Element sind Ende-zu-Ende-verschlüsselt: Nur die Leute im Chat können sie lesen, nicht einmal der Server. Die Schlüssel dazu liegen auf deinen Geräten.",
    },
    [`${P}secure_key`]: {
        en: "Your recovery key is the spare key for all of them. When you sign in on a new laptop or phone, or lose this one, it gets your message history back. Without it, old messages stay locked.",
        de: "Dein Wiederherstellungsschlüssel ist der Ersatzschlüssel für alle. Wenn du dich auf einem neuen Laptop oder Handy anmeldest oder dieses verlierst, holt er deinen Nachrichtenverlauf zurück. Ohne ihn bleiben alte Nachrichten verschlossen.",
    },
    [`${P}secure_store`]: {
        en: "Keep it like a password: in your password manager, or printed and locked away. Never send it to anyone. IT will never ask you for it.",
        de: "Bewahre ihn wie ein Passwort auf: im Passwortmanager oder ausgedruckt und weggeschlossen. Schick ihn niemandem. Die IT wird dich nie danach fragen.",
    },
    [`${P}secure_toast_note`]: {
        en: "Element may also remind you at the top left: “Back up your chats” → “Create recovery key”. That's the same thing; once you're done here, the reminder goes away.",
        de: "Element erinnert dich vielleicht auch oben links mit „Deine Chats sichern“. Das ist dasselbe; wenn du hier fertig bist, verschwindet die Erinnerung.",
    },
    [`${P}check_key_storage`]: { en: "Key storage is on", de: "Schlüsselspeicher ist an" },
    [`${P}check_key_storage_hint`]: {
        en: "Your message keys are backed up, encrypted, on your server.",
        de: "Deine Nachrichtenschlüssel werden verschlüsselt auf deinem Server gesichert.",
    },
    [`${P}check_recovery`]: { en: "Recovery key is set up", de: "Wiederherstellungsschlüssel ist eingerichtet" },
    [`${P}check_recovery_hint`]: { en: "Only you have it.", de: "Nur du hast ihn." },
    [`${P}check_verified`]: { en: "This device is verified", de: "Dieses Gerät ist verifiziert" },
    [`${P}check_verified_hint`]: { en: "Your other devices and contacts trust it.", de: "Deine anderen Geräte und Kontakte vertrauen ihm." },
    [`${P}secure_done`]: {
        en: "All set: your messages are protected, and you can get them back on any new device.",
        de: "Alles erledigt: Deine Nachrichten sind geschützt, und du bekommst sie auf jedem neuen Gerät zurück.",
    },
    [`${P}btn_set_up_recovery`]: { en: "Set up recovery key", de: "Wiederherstellungsschlüssel einrichten" },
    [`${P}btn_verify`]: { en: "Verify this device", de: "Dieses Gerät verifizieren" },
    [`${P}btn_key_storage`]: { en: "Turn on key storage", de: "Schlüsselspeicher einschalten" },
    [`${P}btn_fix_recovery`]: { en: "Enter recovery key", de: "Wiederherstellungsschlüssel eingeben" },
    [`${P}btn_encryption_settings`]: { en: "Encryption settings", de: "Verschlüsselungseinstellungen" },
    [`${P}secure_unknown`]: {
        en: "Element couldn't report the encryption state here. Check Settings → Encryption.",
        de: "Element konnte den Verschlüsselungsstatus hier nicht melden. Sieh unter Einstellungen → Verschlüsselung nach.",
    },
    [`${P}glossary_title`]: { en: "Words you'll see", de: "Begriffe, die dir begegnen" },
    [`${P}glossary_verify_term`]: { en: "“Verify this device”", de: "„Dieses Gerät verifizieren“" },
    [`${P}glossary_verify`]: {
        en: "After signing in somewhere new, Element asks you to confirm it's you, with another signed-in device or your recovery key. Like approving a sign-in, but it also hands over your message keys.",
        de: "Nach einer Anmeldung auf einem neuen Gerät bittet Element dich zu bestätigen, dass du es bist: mit einem anderen angemeldeten Gerät oder deinem Wiederherstellungsschlüssel. Wie eine Anmeldebestätigung, nur dass dabei auch deine Nachrichtenschlüssel übergeben werden.",
    },
    [`${P}glossary_utd_term`]: { en: "“Unable to decrypt message”", de: "„Entschlüsselung der Nachricht nicht möglich“" },
    [`${P}glossary_utd`]: {
        en: "A message whose key this device doesn't have (yet). It often fixes itself within seconds; if not, verifying this device or entering your recovery key brings the keys.",
        de: "Eine Nachricht, deren Schlüssel dieses Gerät (noch) nicht hat. Oft löst sich das in Sekunden; sonst holt das Verifizieren des Geräts oder dein Wiederherstellungsschlüssel die Schlüssel.",
    },

    // Step 2: habits
    [`${P}habits_intro`]: { en: "Most Teams habits have a home in Element:", de: "Die meisten Teams-Gewohnheiten haben in Element ein Zuhause:" },
    [`${P}col_teams`]: { en: "In Teams you…", de: "In Teams …" },
    [`${P}col_element`]: { en: "In Element you…", de: "In Element …" },
    [`${P}addon`]: { en: "Add-on", de: "Zusatz" },
    [`${P}addon_hint`]: { en: "Added to Element by your organisation", de: "Von deiner Organisation zu Element hinzugefügt" },

    [`${P}cs_team_teams`]: { en: "are a member of a team", de: "bist Mitglied in einem Team" },
    [`${P}cs_team_element`]: {
        en: "are a member of a space. Spaces are the icons in the bar on the far left.",
        de: "bist Mitglied in einem Space. Spaces sind die Symbole in der Leiste ganz links.",
    },
    [`${P}cs_channel_teams`]: { en: "post in a channel", de: "schreibst in einem Kanal" },
    [`${P}cs_channel_element`]: {
        en: "post in a room. A space's rooms are listed when you select the space.",
        de: "schreibst in einem Raum. Die Räume eines Space siehst du, wenn du den Space auswählst.",
    },
    [`${P}cs_chat_teams`]: { en: "start a chat", de: "startest einen Chat" },
    [`${P}cs_chat_element`]: {
        en: "start a direct message: + at the top of the room list → Start chat. A group chat is a room without a space.",
        de: "startest eine Direktnachricht: + oben in der Raumliste → Chat beginnen. Ein Gruppenchat ist ein Raum ohne Space.",
    },
    [`${P}cs_activity_teams`]: { en: "check Activity", de: "schaust in die Aktivität" },
    [`${P}cs_activity_element`]: {
        en: "see bold rooms for new messages and a red badge for mentions. The room list filters Unreads and Mentions show just those.",
        de: "siehst neue Nachrichten an fett geschriebenen Räumen und Erwähnungen an einem roten Zähler. Die Filter „Ungelesen“ und „Erwähnungen“ der Raumliste zeigen nur diese.",
    },
    [`${P}cs_activity_activity`]: {
        en: "open Activity (the bell in the bar on the far left): mentions, replies and reactions from all rooms in one list.",
        de: "öffnest „Aktivität“ (die Glocke in der Leiste ganz links): Erwähnungen, Antworten und Reaktionen aus allen Räumen in einer Liste.",
    },
    [`${P}cs_activity_teamwork`]: {
        en: "open Activity (the bell) in the bar on the far left: mentions and replies from all rooms in one list.",
        de: "öffnest „Aktivität“ (die Glocke) in der Leiste ganz links: Erwähnungen und Antworten aus allen Räumen in einer Liste.",
    },
    [`${P}cs_files_teams`]: { en: "open the Files tab", de: "öffnest den Dateien-Tab" },
    [`${P}cs_files_element`]: {
        en: "open the room info (i in the room header) → Files: everything shared in that room.",
        de: "öffnest die Rauminfo (i im Raumkopf) → Dateien: alles, was im Raum geteilt wurde.",
    },
    [`${P}cs_files_files-hub`]: {
        en: "open Files in the bar on the far left: files from all your rooms in one list, with filters and previews. The folder icon in a room header shows that room's files.",
        de: "öffnest „Dateien“ in der Leiste ganz links: Dateien aus all deinen Räumen in einer Liste, mit Filtern und Vorschau. Das Ordner-Symbol im Raumkopf zeigt die Dateien dieses Raums.",
    },
    [`${P}cs_meet_teams`]: { en: "join a meeting or call", de: "nimmst an einem Meeting oder Anruf teil" },
    [`${P}cs_meet_element`]: {
        en: "press the video button in the room header. Everyone in the room can join the call.",
        de: "drückst den Video-Knopf im Raumkopf. Alle im Raum können dem Anruf beitreten.",
    },
    [`${P}cs_mention_teams`]: { en: "@mention people or a tag", de: "erwähnst Personen oder ein Tag mit @" },
    [`${P}cs_mention_element`]: {
        en: "type @ and a name. @room notifies everyone in the room.",
        de: "tippst @ und einen Namen. @room benachrichtigt alle im Raum.",
    },
    [`${P}cs_mention_tag-mentions`]: {
        en: "type @ and a name, or @ and a tag (e.g. @oncall) to notify a whole group.",
        de: "tippst @ und einen Namen, oder @ und ein Tag (z. B. @oncall), um eine ganze Gruppe zu benachrichtigen.",
    },
    [`${P}cs_status_teams`]: { en: "set your status (Busy, Away…)", de: "setzt deinen Status (Beschäftigt, Abwesend …)" },
    [`${P}cs_status_element`]: {
        en: "show as online while you use Element, if your server has presence turned on.",
        de: "wirst als online angezeigt, solange du Element nutzt, wenn dein Server Präsenz eingeschaltet hat.",
    },
    [`${P}cs_status_profile-status`]: {
        en: "set your status and a status message from your profile; colleagues see it next to your name.",
        de: "setzt Status und Statusnachricht in deinem Profil; Kolleg:innen sehen sie neben deinem Namen.",
    },
    [`${P}cs_saved_teams`]: { en: "save a message", de: "speicherst eine Nachricht" },
    [`${P}cs_saved_element`]: {
        en: "pin it in the room (message options → Pin) so everyone finds it at the top.",
        de: "fixierst sie im Raum (Nachrichtenoptionen → Fixieren), damit alle sie oben finden.",
    },
    [`${P}cs_saved_teamwork`]: {
        en: "save it with the bookmark in its options; your saved list is behind the bookmark in the room header.",
        de: "speicherst sie mit dem Lesezeichen in ihren Optionen; deine Liste liegt hinter dem Lesezeichen im Raumkopf.",
    },
    [`${P}cs_schedule_teams`]: { en: "schedule a message", de: "planst eine Nachricht" },
    [`${P}cs_schedule_element`]: {
        en: "can't schedule out of the box. Write it as a draft: Element keeps unsent text per room.",
        de: "kannst ohne Zusatz nichts planen. Schreib einen Entwurf: Element behält ungesendeten Text pro Raum.",
    },
    [`${P}cs_schedule_teamwork`]: { en: "use + next to the message box → Send later.", de: "nutzt + neben dem Eingabefeld → Später senden." },
    [`${P}cs_urgent_teams`]: { en: "mark a message as important or urgent", de: "markierst eine Nachricht als wichtig oder dringend" },
    [`${P}cs_urgent_element`]: {
        en: "@mention the people who need to see it: mentions notify even in muted rooms.",
        de: "erwähnst die Leute, die sie sehen müssen, mit @: Erwähnungen kommen auch in stummgeschalteten Räumen an.",
    },
    [`${P}cs_urgent_teamwork`]: { en: "use + next to the message box → Important or urgent.", de: "nutzt + neben dem Eingabefeld → Wichtig oder dringend." },
    [`${P}cs_praise_teams`]: { en: "send Praise", de: "sendest ein Lob" },
    [`${P}cs_praise_element`]: { en: "react with an emoji or say thanks with an @mention.", de: "reagierst mit einem Emoji oder bedankst dich mit einer @-Erwähnung." },
    [`${P}cs_praise_teamwork`]: { en: "use + next to the message box → Praise.", de: "nutzt + neben dem Eingabefeld → Lob." },
    [`${P}cs_reply_teams`]: { en: "reply to a message", de: "antwortest auf eine Nachricht" },
    [`${P}cs_reply_element`]: {
        en: "hover it → Reply, or Reply in thread. The threads icon in the room header lists all threads.",
        de: "fährst darüber → Antworten oder Im Thread antworten. Das Thread-Symbol im Raumkopf listet alle Threads.",
    },
    [`${P}cs_pin_teams`]: { en: "pin or mute a chat", de: "heftest einen Chat an oder schaltest ihn stumm" },
    [`${P}cs_pin_element`]: {
        en: "open the room's options (… in the room list) → Favourite, or → Notifications → Mute.",
        de: "öffnest die Raumoptionen (… in der Raumliste) → Favorit, oder → Benachrichtigungen → Stumm.",
    },
    [`${P}cs_search_teams`]: { en: "search", de: "suchst" },
    [`${P}cs_search_element`]: {
        en: "press Ctrl+K for rooms and people; search messages from the room info.",
        de: "drückst Strg+K für Räume und Personen; Nachrichten suchst du über die Rauminfo.",
    },

    // Keyboard shortcuts card
    [`${P}keys_title`]: { en: "Keyboard shortcuts", de: "Tastenkürzel" },
    [`${P}keys_intro`]: { en: "Your Teams fingers, translated:", de: "Deine Teams-Finger, übersetzt:" },
    [`${P}keys_col_action`]: { en: "Action", de: "Aktion" },
    [`${P}keys_all`]: { en: "All shortcuts", de: "Alle Tastenkürzel" },
    [`${P}keys_overlay`]: {
        en: "Press ? anywhere (outside a text field) to see every shortcut.",
        de: "Drück irgendwo ? (außerhalb eines Textfelds), um alle Tastenkürzel zu sehen.",
    },
    [`${P}key_search`]: { en: "Search rooms and people", de: "Räume und Personen suchen" },
    [`${P}key_shortcuts`]: { en: "Show keyboard shortcuts", de: "Tastenkürzel anzeigen" },
    [`${P}key_switch`]: { en: "Switch sections / spaces", de: "Bereiche / Spaces wechseln" },
    [`${P}key_updown`]: { en: "Previous / next chat", de: "Vorheriger / nächster Chat" },
    [`${P}key_unread`]: { en: "Next unread chat", de: "Nächster ungelesener Chat" },
    [`${P}key_attach`]: { en: "Attach a file", de: "Datei anhängen" },
    [`${P}key_newline`]: { en: "New line in a message", de: "Neue Zeile in der Nachricht" },
    [`${P}key_edit`]: { en: "Edit your last message", de: "Letzte Nachricht bearbeiten" },
    [`${P}key_mute`]: { en: "Mute / unmute in a call", de: "Im Anruf stumm / laut schalten" },
    [`${P}key_camera`]: { en: "Camera on / off in a call", de: "Im Anruf Kamera an / aus" },
    [`${P}key_none`]: { en: "none", de: "keins" },

    // Step 3: profile and notifications
    [`${P}profile_intro`]: {
        en: "Teams showed your company photo and name. In Element you set them yourself, so colleagues recognise you.",
        de: "Teams zeigte dein Firmenfoto und deinen Namen. In Element legst du sie selbst fest, damit Kolleg:innen dich erkennen.",
    },
    [`${P}check_avatar`]: { en: "Profile picture", de: "Profilbild" },
    [`${P}check_name`]: { en: "Display name: %(name)s", de: "Anzeigename: %(name)s" },
    [`${P}check_no_name`]: { en: "Display name", de: "Anzeigename" },
    [`${P}btn_edit_profile`]: { en: "Edit profile", de: "Profil bearbeiten" },
    [`${P}notif_intro`]: {
        en: "Out of the box, Element notifies you for direct messages and mentions. Change it for a single room in its options → Notifications.",
        de: "Standardmäßig benachrichtigt Element dich bei Direktnachrichten und Erwähnungen. Für einen einzelnen Raum änderst du das in seinen Optionen → Benachrichtigungen.",
    },
    [`${P}check_notifications`]: { en: "Desktop notifications are on", de: "Desktop-Benachrichtigungen sind an" },
    [`${P}btn_notifications`]: { en: "Notification settings", de: "Benachrichtigungseinstellungen" },

    // Step 4: spaces
    [`${P}spaces_intro`]: {
        en: "In Teams you were added to teams. In Element you join spaces yourself; these are the ones for you:",
        de: "In Teams wurdest du zu Teams hinzugefügt. In Element trittst du Spaces selbst bei; diese sind für dich gedacht:",
    },
    [`${P}spaces_intro_org`]: {
        en: "In Teams you were added to teams. In Element you join spaces yourself; %(org)s set up these for you:",
        de: "In Teams wurdest du zu Teams hinzugefügt. In Element trittst du Spaces selbst bei; %(org)s hat diese für dich eingerichtet:",
    },
    [`${P}btn_join`]: { en: "Join", de: "Beitreten" },
    [`${P}btn_join_all`]: { en: "Join all", de: "Allen beitreten" },
    [`${P}btn_open`]: { en: "Open", de: "Öffnen" },
    [`${P}joining`]: { en: "Joining…", de: "Trete bei …" },
    [`${P}joined`]: { en: "Joined", de: "Beigetreten" },
    [`${P}join_failed`]: { en: "Couldn't join: %(error)s", de: "Beitritt fehlgeschlagen: %(error)s" },
    [`${P}spaces_done`]: {
        en: "You're in. Your spaces are in the bar on the far left; their rooms appear when you select one.",
        de: "Du bist drin. Deine Spaces sind in der Leiste ganz links; ihre Räume erscheinen, wenn du einen auswählst.",
    },

    // "Unable to decrypt" hint
    [`${P}utd_title`]: { en: "A message couldn't be decrypted", de: "Eine Nachricht konnte nicht entschlüsselt werden" },
    [`${P}utd_unverified`]: {
        en: "This device doesn't have the keys for some messages yet. Verify it with another device you're signed in on, or with your recovery key, and they unlock.",
        de: "Dieses Gerät hat die Schlüssel für einige Nachrichten noch nicht. Verifiziere es mit einem anderen angemeldeten Gerät oder deinem Wiederherstellungsschlüssel, dann werden sie lesbar.",
    },
    [`${P}utd_no_recovery`]: {
        en: "This device doesn't have the key for this message. Set up a recovery key now, so your next device gets your history.",
        de: "Dieses Gerät hat den Schlüssel für diese Nachricht nicht. Richte jetzt einen Wiederherstellungsschlüssel ein, damit dein nächstes Gerät deinen Verlauf bekommt.",
    },
    [`${P}utd_ok`]: {
        en: "Your device is set up correctly; the sender's device hasn't shared the key for this message with it. That often sorts itself out once their device is online again. If not, ask them to send it again.",
        de: "Dein Gerät ist richtig eingerichtet; das Gerät des Absenders hat den Schlüssel für diese Nachricht nicht mit ihm geteilt. Das löst sich oft, sobald sein Gerät wieder online ist. Sonst bitte ihn, sie noch einmal zu schicken.",
    },
    [`${P}utd_from`]: { en: "From %(sender)s in %(room)s", de: "Von %(sender)s in %(room)s" },
    [`${P}utd_show`]: { en: "Show message", de: "Nachricht zeigen" },
    [`${P}utd_learn`]: { en: "What does this mean?", de: "Was heißt das?" },
    [`${P}utd_dismiss`]: { en: "Got it", de: "Verstanden" },
    [`${P}utd_never`]: { en: "Don't show again", de: "Nicht mehr anzeigen" },
} satisfies Record<string, Entry>;

/** Fills in `%(name)s` placeholders, as Element's `_t` does. */
export function interpolate(text: string, variables?: Record<string, string | number>): string {
    if (!variables) return text;
    return text.replace(/%\((\w+)\)s/g, (m, name: string) => (name in variables ? String(variables[name]) : m));
}

/**
 * The module's translate function: Element's own (the user's language) unless the admin forced a
 * language in the config, in which case the module's table is used directly.
 */
export function makeTranslate(elementTranslate: ModuleTranslate, language?: Language): ModuleTranslate {
    if (!language) return elementTranslate;
    const table = translations as Record<string, Entry>;
    return (key, variables) => {
        const entry = table[key];
        if (!entry) return elementTranslate(key, variables);
        return interpolate(entry[language] ?? entry.en, variables);
    };
}

export type { Translations };
