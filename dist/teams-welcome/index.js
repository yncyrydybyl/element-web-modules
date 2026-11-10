/*! @datanauten/element-web-module-teams-welcome 0.2.0 */
// \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), t = "0.2.0";
// src/client.ts
function n() {
	let e = window.mxMatrixClientPeg;
	try {
		return e?.get?.() ?? void 0;
	} catch {
		return;
	}
}
function r(e, t) {
	let n = window.mxDispatcher;
	return n?.dispatch ? (n.dispatch({
		action: "view_user_settings",
		initialTabId: e,
		...t ? { props: { initialEncryptionState: t } } : {}
	}), !0) : !1;
}
function i() {
	return typeof window.mxDispatcher?.dispatch == "function";
}
async function a(e) {
	let t = e.getCrypto?.();
	if (!t) return {};
	let n = {}, r = e.getUserId(), i = e.getDeviceId?.();
	return await Promise.all([
		t.getActiveSessionBackupVersion?.().then((e) => void (n.keyStorage = e !== null), () => void 0),
		t.getSecretStorageStatus?.().then((e) => {
			n.recovery = e.ready, n.recoveryOutOfSync = !e.ready && e.defaultKeyId !== null;
		}, () => void 0),
		r && i ? t.getDeviceVerificationStatus?.(r, i).then((e) => void (n.verified = !!e?.crossSigningVerified), () => void 0) : void 0
	]), n;
}
function o(e) {
	return e.keyStorage === !0 && e.recovery === !0 && e.verified === !0;
}
function s(e) {
	return e.verified === !1 ? "verify" : e.keyStorage === !1 ? "key_storage" : e.recoveryOutOfSync ? "fix_recovery" : e.recovery === !1 ? "set_up_recovery" : null;
}
function c(e) {
	return r("USER_ENCRYPTION_TAB", e === "set_up_recovery" ? "set_recovery_key" : void 0);
}
function l(e, t) {
	return t ? e.getRoom(t)?.getMyMembership?.() ?? "none" : "none";
}
async function u(e, t, n) {
	if (!e.joinRoom) throw Error("joinRoom unavailable");
	let r = await e.joinRoom(t);
	if (n && e.getRoomHierarchy) try {
		let { rooms: t } = await e.getRoomHierarchy(r.roomId, 50, 1, !0);
		for (let n of t) n.room_id !== r.roomId && n.room_type !== "m.space" && l(e, n.room_id) !== "join" && await e.joinRoom(n.room_id).catch(() => void 0);
	} catch {}
	return r.roomId;
}
function d(e, t = window.location.hash) {
	let n = /^#\/room\/([^/?]+)/.exec(t);
	if (!n) return;
	let r;
	try {
		r = decodeURIComponent(n[1]);
	} catch {
		return;
	}
	return r.startsWith("!") ? r : e?.getRooms?.().find((e) => e.getCanonicalAlias?.() === r || e.getAltAliases?.().includes(r))?.roomId;
}
function f(e, t) {
	let n = t.getRoomId(), r = t.getId();
	if (!n || !r) return;
	let i = e?.getRoom(n), a = t.getSender?.() ?? "";
	return {
		roomId: n,
		eventId: r,
		room: i?.name || n,
		sender: i?.getMember?.(a)?.name || a,
		ts: t.getTs()
	};
}
function p(e) {
	window.location.hash = `#/room/${e.roomId}/${e.eventId}`;
}
// src/config.ts
var m = "de.datanauten.teamswelcome", h = [
	"secure",
	"habits",
	"profile",
	"spaces"
], g = ["en", "de"];
function _(e, t = () => {}) {
	let n = e && typeof e == "object" ? e : {}, r = (e) => {
		let r = n[e];
		if (r != null && r !== "") {
			if (typeof r == "string") return r.trim() || void 0;
			t(`${e} must be a string`);
		}
	}, i = (e, r) => {
		let i = n[e];
		return i === void 0 ? r : typeof i == "boolean" ? i : (t(`${e} must be true or false`), r);
	}, a = [];
	if (n.spaces !== void 0) {
		if (!Array.isArray(n.spaces)) t("spaces must be a list");
		else for (let e of n.spaces) {
			let n = typeof e == "string" ? { alias: e } : e && typeof e == "object" ? e : null, r = typeof n?.alias == "string" ? n.alias.trim() : "";
			/^[#!][^:]+:.+$/.test(r) ? a.some((e) => e.alias === r) || a.push({
				alias: r,
				name: typeof n?.name == "string" && n.name ? n.name : void 0,
				description: typeof n?.description == "string" && n.description ? n.description : void 0
			}) : t(`ignoring space ${JSON.stringify(e)}: expected "#alias:server"`);
		}
	}
	let o = [...h];
	if (n.steps !== void 0) {
		if (!Array.isArray(n.steps)) t("steps must be a list");
		else {
			let e = n.steps.filter((e) => !h.includes(e));
			e.length && t(`ignoring unknown steps ${e.join(", ")} (known: ${h.join(", ")})`), o = n.steps.filter((e, t, n) => h.includes(e) && n.indexOf(e) === t);
		}
	}
	a.length || (o = o.filter((e) => e !== "spaces"));
	let s = r("help_url");
	s && !/^(https?:|mailto:|tel:)/i.test(s) && (t("help_url must start with https:, http:, mailto: or tel:"), s = void 0);
	let c = r("language");
	return c && !g.includes(c) && (t(`language must be one of ${g.join(", ")}`), c = void 0), {
		organisation: r("organisation"),
		helpUrl: s,
		helpLabel: r("help_label"),
		spaces: a,
		steps: o,
		language: c,
		autoOpen: i("auto_open", !0),
		utdHint: i("utd_hint", !0),
		joinSuggestedRooms: i("join_suggested_rooms", !0)
	};
}
// src/i18n.ts
var v = "datanauten_teamswelcome_", y = {
	[`${v}title`]: {
		en: "Coming from Teams?",
		de: "Du kommst von Teams?"
	},
	[`${v}title_org`]: {
		en: "Welcome to %(org)s on Element",
		de: "Willkommen bei %(org)s in Element"
	},
	[`${v}intro`]: {
		en: "Four short steps and Element will feel familiar. Close this any time: it's in your user menu (your avatar, top left) when you want it back.",
		de: "Vier kurze Schritte, und Element fühlt sich vertraut an. Du kannst das jederzeit schließen: Im Benutzermenü (dein Avatar oben links) findest du es wieder."
	},
	[`${v}menu_item`]: {
		en: "Coming from Teams?",
		de: "Umstieg von Teams"
	},
	[`${v}close`]: {
		en: "Close",
		de: "Schließen"
	},
	[`${v}back`]: {
		en: "Back",
		de: "Zurück"
	},
	[`${v}next`]: {
		en: "Next",
		de: "Weiter"
	},
	[`${v}finish`]: {
		en: "Done",
		de: "Fertig"
	},
	[`${v}step_of`]: {
		en: "Step %(n)s of %(total)s",
		de: "Schritt %(n)s von %(total)s"
	},
	[`${v}help`]: {
		en: "Questions? %(label)s",
		de: "Fragen? %(label)s"
	},
	[`${v}help_default`]: {
		en: "Contact your IT team",
		de: "Wende dich an deine IT"
	},
	[`${v}done_badge`]: {
		en: "Done",
		de: "Erledigt"
	},
	[`${v}step_secure`]: {
		en: "Secure your messages",
		de: "Nachrichten absichern"
	},
	[`${v}step_habits`]: {
		en: "Where things are",
		de: "Wo was ist"
	},
	[`${v}step_profile`]: {
		en: "Profile and notifications",
		de: "Profil und Benachrichtigungen"
	},
	[`${v}step_spaces`]: {
		en: "Join your team's spaces",
		de: "Den Spaces deines Teams beitreten"
	},
	[`${v}secure_why`]: {
		en: "Your messages in Element are end-to-end encrypted: only the people in a chat can read them, not even the server. The keys that unlock them live on your devices.",
		de: "Deine Nachrichten in Element sind Ende-zu-Ende-verschlüsselt: Nur die Leute im Chat können sie lesen, nicht einmal der Server. Die Schlüssel dazu liegen auf deinen Geräten."
	},
	[`${v}secure_key`]: {
		en: "Your recovery key is the spare key for all of them. When you sign in on a new laptop or phone, or lose this one, it gets your message history back. Without it, old messages stay locked.",
		de: "Dein Wiederherstellungsschlüssel ist der Ersatzschlüssel für alle. Wenn du dich auf einem neuen Laptop oder Handy anmeldest oder dieses verlierst, holt er deinen Nachrichtenverlauf zurück. Ohne ihn bleiben alte Nachrichten verschlossen."
	},
	[`${v}secure_store`]: {
		en: "Keep it like a password: in your password manager, or printed and locked away. Never send it to anyone. IT will never ask you for it.",
		de: "Bewahre ihn wie ein Passwort auf: im Passwortmanager oder ausgedruckt und weggeschlossen. Schick ihn niemandem. Die IT wird dich nie danach fragen."
	},
	[`${v}secure_toast_note`]: {
		en: "Element may also remind you at the top left: “Back up your chats” → “Create recovery key”. That's the same thing; once you're done here, the reminder goes away.",
		de: "Element erinnert dich vielleicht auch oben links mit „Deine Chats sichern“. Das ist dasselbe; wenn du hier fertig bist, verschwindet die Erinnerung."
	},
	[`${v}check_key_storage`]: {
		en: "Key storage is on",
		de: "Schlüsselspeicher ist an"
	},
	[`${v}check_key_storage_hint`]: {
		en: "Your message keys are backed up, encrypted, on your server.",
		de: "Deine Nachrichtenschlüssel werden verschlüsselt auf deinem Server gesichert."
	},
	[`${v}check_recovery`]: {
		en: "Recovery key is set up",
		de: "Wiederherstellungsschlüssel ist eingerichtet"
	},
	[`${v}check_recovery_hint`]: {
		en: "Only you have it.",
		de: "Nur du hast ihn."
	},
	[`${v}check_verified`]: {
		en: "This device is verified",
		de: "Dieses Gerät ist verifiziert"
	},
	[`${v}check_verified_hint`]: {
		en: "Your other devices and contacts trust it.",
		de: "Deine anderen Geräte und Kontakte vertrauen ihm."
	},
	[`${v}secure_done`]: {
		en: "All set: your messages are protected, and you can get them back on any new device.",
		de: "Alles erledigt: Deine Nachrichten sind geschützt, und du bekommst sie auf jedem neuen Gerät zurück."
	},
	[`${v}btn_set_up_recovery`]: {
		en: "Set up recovery key",
		de: "Wiederherstellungsschlüssel einrichten"
	},
	[`${v}btn_verify`]: {
		en: "Verify this device",
		de: "Dieses Gerät verifizieren"
	},
	[`${v}btn_key_storage`]: {
		en: "Turn on key storage",
		de: "Schlüsselspeicher einschalten"
	},
	[`${v}btn_fix_recovery`]: {
		en: "Enter recovery key",
		de: "Wiederherstellungsschlüssel eingeben"
	},
	[`${v}btn_encryption_settings`]: {
		en: "Encryption settings",
		de: "Verschlüsselungseinstellungen"
	},
	[`${v}secure_unknown`]: {
		en: "Element couldn't report the encryption state here. Check Settings → Encryption.",
		de: "Element konnte den Verschlüsselungsstatus hier nicht melden. Sieh unter Einstellungen → Verschlüsselung nach."
	},
	[`${v}glossary_title`]: {
		en: "Words you'll see",
		de: "Begriffe, die dir begegnen"
	},
	[`${v}glossary_verify_term`]: {
		en: "“Verify this device”",
		de: "„Dieses Gerät verifizieren“"
	},
	[`${v}glossary_verify`]: {
		en: "After signing in somewhere new, Element asks you to confirm it's you, with another signed-in device or your recovery key. Like approving a sign-in, but it also hands over your message keys.",
		de: "Nach einer Anmeldung auf einem neuen Gerät bittet Element dich zu bestätigen, dass du es bist: mit einem anderen angemeldeten Gerät oder deinem Wiederherstellungsschlüssel. Wie eine Anmeldebestätigung, nur dass dabei auch deine Nachrichtenschlüssel übergeben werden."
	},
	[`${v}glossary_utd_term`]: {
		en: "“Unable to decrypt message”",
		de: "„Entschlüsselung der Nachricht nicht möglich“"
	},
	[`${v}glossary_utd`]: {
		en: "A message whose key this device doesn't have (yet). It often fixes itself within seconds; if not, verifying this device or entering your recovery key brings the keys.",
		de: "Eine Nachricht, deren Schlüssel dieses Gerät (noch) nicht hat. Oft löst sich das in Sekunden; sonst holt das Verifizieren des Geräts oder dein Wiederherstellungsschlüssel die Schlüssel."
	},
	[`${v}habits_intro`]: {
		en: "Most Teams habits have a home in Element:",
		de: "Die meisten Teams-Gewohnheiten haben in Element ein Zuhause:"
	},
	[`${v}col_teams`]: {
		en: "In Teams you…",
		de: "In Teams …"
	},
	[`${v}col_element`]: {
		en: "In Element you…",
		de: "In Element …"
	},
	[`${v}addon`]: {
		en: "Add-on",
		de: "Zusatz"
	},
	[`${v}addon_hint`]: {
		en: "Added to Element by your organisation",
		de: "Von deiner Organisation zu Element hinzugefügt"
	},
	[`${v}cs_team_teams`]: {
		en: "are a member of a team",
		de: "bist Mitglied in einem Team"
	},
	[`${v}cs_team_element`]: {
		en: "are a member of a space. Spaces are the icons in the bar on the far left.",
		de: "bist Mitglied in einem Space. Spaces sind die Symbole in der Leiste ganz links."
	},
	[`${v}cs_channel_teams`]: {
		en: "post in a channel",
		de: "schreibst in einem Kanal"
	},
	[`${v}cs_channel_element`]: {
		en: "post in a room. A space's rooms are listed when you select the space.",
		de: "schreibst in einem Raum. Die Räume eines Space siehst du, wenn du den Space auswählst."
	},
	[`${v}cs_chat_teams`]: {
		en: "start a chat",
		de: "startest einen Chat"
	},
	[`${v}cs_chat_element`]: {
		en: "start a direct message: + at the top of the room list → Start chat. A group chat is a room without a space.",
		de: "startest eine Direktnachricht: + oben in der Raumliste → Chat beginnen. Ein Gruppenchat ist ein Raum ohne Space."
	},
	[`${v}cs_activity_teams`]: {
		en: "check Activity",
		de: "schaust in die Aktivität"
	},
	[`${v}cs_activity_element`]: {
		en: "see bold rooms for new messages and a red badge for mentions. The room list filters Unreads and Mentions show just those.",
		de: "siehst neue Nachrichten an fett geschriebenen Räumen und Erwähnungen an einem roten Zähler. Die Filter „Ungelesen“ und „Erwähnungen“ der Raumliste zeigen nur diese."
	},
	[`${v}cs_activity_activity`]: {
		en: "open Activity (the bell in the bar on the far left): mentions, replies and reactions from all rooms in one list.",
		de: "öffnest „Aktivität“ (die Glocke in der Leiste ganz links): Erwähnungen, Antworten und Reaktionen aus allen Räumen in einer Liste."
	},
	[`${v}cs_activity_teamwork`]: {
		en: "open Activity (the bell) in the bar on the far left: mentions and replies from all rooms in one list.",
		de: "öffnest „Aktivität“ (die Glocke) in der Leiste ganz links: Erwähnungen und Antworten aus allen Räumen in einer Liste."
	},
	[`${v}cs_files_teams`]: {
		en: "open the Files tab",
		de: "öffnest den Dateien-Tab"
	},
	[`${v}cs_files_element`]: {
		en: "open the room info (i in the room header) → Files: everything shared in that room.",
		de: "öffnest die Rauminfo (i im Raumkopf) → Dateien: alles, was im Raum geteilt wurde."
	},
	[`${v}cs_files_files-hub`]: {
		en: "open Files in the bar on the far left: files from all your rooms in one list, with filters and previews. The folder icon in a room header shows that room's files.",
		de: "öffnest „Dateien“ in der Leiste ganz links: Dateien aus all deinen Räumen in einer Liste, mit Filtern und Vorschau. Das Ordner-Symbol im Raumkopf zeigt die Dateien dieses Raums."
	},
	[`${v}cs_meet_teams`]: {
		en: "join a meeting or call",
		de: "nimmst an einem Meeting oder Anruf teil"
	},
	[`${v}cs_meet_element`]: {
		en: "press the video button in the room header. Everyone in the room can join the call.",
		de: "drückst den Video-Knopf im Raumkopf. Alle im Raum können dem Anruf beitreten."
	},
	[`${v}cs_mention_teams`]: {
		en: "@mention people or a tag",
		de: "erwähnst Personen oder ein Tag mit @"
	},
	[`${v}cs_mention_element`]: {
		en: "type @ and a name. @room notifies everyone in the room.",
		de: "tippst @ und einen Namen. @room benachrichtigt alle im Raum."
	},
	[`${v}cs_mention_tag-mentions`]: {
		en: "type @ and a name, or @ and a tag (e.g. @oncall) to notify a whole group.",
		de: "tippst @ und einen Namen, oder @ und ein Tag (z. B. @oncall), um eine ganze Gruppe zu benachrichtigen."
	},
	[`${v}cs_status_teams`]: {
		en: "set your status (Busy, Away…)",
		de: "setzt deinen Status (Beschäftigt, Abwesend …)"
	},
	[`${v}cs_status_element`]: {
		en: "show as online while you use Element, if your server has presence turned on.",
		de: "wirst als online angezeigt, solange du Element nutzt, wenn dein Server Präsenz eingeschaltet hat."
	},
	[`${v}cs_status_profile-status`]: {
		en: "set your status and a status message from your profile; colleagues see it next to your name.",
		de: "setzt Status und Statusnachricht in deinem Profil; Kolleg:innen sehen sie neben deinem Namen."
	},
	[`${v}cs_saved_teams`]: {
		en: "save a message",
		de: "speicherst eine Nachricht"
	},
	[`${v}cs_saved_element`]: {
		en: "pin it in the room (message options → Pin) so everyone finds it at the top.",
		de: "fixierst sie im Raum (Nachrichtenoptionen → Fixieren), damit alle sie oben finden."
	},
	[`${v}cs_saved_teamwork`]: {
		en: "save it with the bookmark in its options; your saved list is behind the bookmark in the room header.",
		de: "speicherst sie mit dem Lesezeichen in ihren Optionen; deine Liste liegt hinter dem Lesezeichen im Raumkopf."
	},
	[`${v}cs_schedule_teams`]: {
		en: "schedule a message",
		de: "planst eine Nachricht"
	},
	[`${v}cs_schedule_element`]: {
		en: "can't schedule out of the box. Write it as a draft: Element keeps unsent text per room.",
		de: "kannst ohne Zusatz nichts planen. Schreib einen Entwurf: Element behält ungesendeten Text pro Raum."
	},
	[`${v}cs_schedule_teamwork`]: {
		en: "use + next to the message box → Send later.",
		de: "nutzt + neben dem Eingabefeld → Später senden."
	},
	[`${v}cs_urgent_teams`]: {
		en: "mark a message as important or urgent",
		de: "markierst eine Nachricht als wichtig oder dringend"
	},
	[`${v}cs_urgent_element`]: {
		en: "@mention the people who need to see it: mentions notify even in muted rooms.",
		de: "erwähnst die Leute, die sie sehen müssen, mit @: Erwähnungen kommen auch in stummgeschalteten Räumen an."
	},
	[`${v}cs_urgent_teamwork`]: {
		en: "use + next to the message box → Important or urgent.",
		de: "nutzt + neben dem Eingabefeld → Wichtig oder dringend."
	},
	[`${v}cs_praise_teams`]: {
		en: "send Praise",
		de: "sendest ein Lob"
	},
	[`${v}cs_praise_element`]: {
		en: "react with an emoji or say thanks with an @mention.",
		de: "reagierst mit einem Emoji oder bedankst dich mit einer @-Erwähnung."
	},
	[`${v}cs_praise_teamwork`]: {
		en: "use + next to the message box → Praise.",
		de: "nutzt + neben dem Eingabefeld → Lob."
	},
	[`${v}cs_reply_teams`]: {
		en: "reply to a message",
		de: "antwortest auf eine Nachricht"
	},
	[`${v}cs_reply_element`]: {
		en: "hover it → Reply, or Reply in thread. The threads icon in the room header lists all threads.",
		de: "fährst darüber → Antworten oder Im Thread antworten. Das Thread-Symbol im Raumkopf listet alle Threads."
	},
	[`${v}cs_pin_teams`]: {
		en: "pin or mute a chat",
		de: "heftest einen Chat an oder schaltest ihn stumm"
	},
	[`${v}cs_pin_element`]: {
		en: "open the room's options (… in the room list) → Favourite, or → Notifications → Mute.",
		de: "öffnest die Raumoptionen (… in der Raumliste) → Favorit, oder → Benachrichtigungen → Stumm."
	},
	[`${v}cs_search_teams`]: {
		en: "search",
		de: "suchst"
	},
	[`${v}cs_search_element`]: {
		en: "press Ctrl+K for rooms and people; search messages from the room info.",
		de: "drückst Strg+K für Räume und Personen; Nachrichten suchst du über die Rauminfo."
	},
	[`${v}keys_title`]: {
		en: "Keyboard shortcuts",
		de: "Tastenkürzel"
	},
	[`${v}keys_intro`]: {
		en: "Your Teams fingers, translated:",
		de: "Deine Teams-Finger, übersetzt:"
	},
	[`${v}keys_col_action`]: {
		en: "Action",
		de: "Aktion"
	},
	[`${v}keys_all`]: {
		en: "All shortcuts",
		de: "Alle Tastenkürzel"
	},
	[`${v}keys_overlay`]: {
		en: "Press ? anywhere (outside a text field) to see every shortcut.",
		de: "Drück irgendwo ? (außerhalb eines Textfelds), um alle Tastenkürzel zu sehen."
	},
	[`${v}key_search`]: {
		en: "Search rooms and people",
		de: "Räume und Personen suchen"
	},
	[`${v}key_shortcuts`]: {
		en: "Show keyboard shortcuts",
		de: "Tastenkürzel anzeigen"
	},
	[`${v}key_switch`]: {
		en: "Switch sections / spaces",
		de: "Bereiche / Spaces wechseln"
	},
	[`${v}key_updown`]: {
		en: "Previous / next chat",
		de: "Vorheriger / nächster Chat"
	},
	[`${v}key_unread`]: {
		en: "Next unread chat",
		de: "Nächster ungelesener Chat"
	},
	[`${v}key_attach`]: {
		en: "Attach a file",
		de: "Datei anhängen"
	},
	[`${v}key_newline`]: {
		en: "New line in a message",
		de: "Neue Zeile in der Nachricht"
	},
	[`${v}key_edit`]: {
		en: "Edit your last message",
		de: "Letzte Nachricht bearbeiten"
	},
	[`${v}key_mute`]: {
		en: "Mute / unmute in a call",
		de: "Im Anruf stumm / laut schalten"
	},
	[`${v}key_camera`]: {
		en: "Camera on / off in a call",
		de: "Im Anruf Kamera an / aus"
	},
	[`${v}key_none`]: {
		en: "none",
		de: "keins"
	},
	[`${v}profile_intro`]: {
		en: "Teams showed your company photo and name. In Element you set them yourself, so colleagues recognise you.",
		de: "Teams zeigte dein Firmenfoto und deinen Namen. In Element legst du sie selbst fest, damit Kolleg:innen dich erkennen."
	},
	[`${v}check_avatar`]: {
		en: "Profile picture",
		de: "Profilbild"
	},
	[`${v}check_name`]: {
		en: "Display name: %(name)s",
		de: "Anzeigename: %(name)s"
	},
	[`${v}check_no_name`]: {
		en: "Display name",
		de: "Anzeigename"
	},
	[`${v}btn_edit_profile`]: {
		en: "Edit profile",
		de: "Profil bearbeiten"
	},
	[`${v}notif_intro`]: {
		en: "Out of the box, Element notifies you for direct messages and mentions. Change it for a single room in its options → Notifications.",
		de: "Standardmäßig benachrichtigt Element dich bei Direktnachrichten und Erwähnungen. Für einen einzelnen Raum änderst du das in seinen Optionen → Benachrichtigungen."
	},
	[`${v}check_notifications`]: {
		en: "Desktop notifications are on",
		de: "Desktop-Benachrichtigungen sind an"
	},
	[`${v}btn_notifications`]: {
		en: "Notification settings",
		de: "Benachrichtigungseinstellungen"
	},
	[`${v}spaces_intro`]: {
		en: "In Teams you were added to teams. In Element you join spaces yourself; these are the ones for you:",
		de: "In Teams wurdest du zu Teams hinzugefügt. In Element trittst du Spaces selbst bei; diese sind für dich gedacht:"
	},
	[`${v}spaces_intro_org`]: {
		en: "In Teams you were added to teams. In Element you join spaces yourself; %(org)s set up these for you:",
		de: "In Teams wurdest du zu Teams hinzugefügt. In Element trittst du Spaces selbst bei; %(org)s hat diese für dich eingerichtet:"
	},
	[`${v}btn_join`]: {
		en: "Join",
		de: "Beitreten"
	},
	[`${v}btn_join_all`]: {
		en: "Join all",
		de: "Allen beitreten"
	},
	[`${v}btn_open`]: {
		en: "Open",
		de: "Öffnen"
	},
	[`${v}joining`]: {
		en: "Joining…",
		de: "Trete bei …"
	},
	[`${v}joined`]: {
		en: "Joined",
		de: "Beigetreten"
	},
	[`${v}join_failed`]: {
		en: "Couldn't join: %(error)s",
		de: "Beitritt fehlgeschlagen: %(error)s"
	},
	[`${v}spaces_done`]: {
		en: "You're in. Your spaces are in the bar on the far left; their rooms appear when you select one.",
		de: "Du bist drin. Deine Spaces sind in der Leiste ganz links; ihre Räume erscheinen, wenn du einen auswählst."
	},
	[`${v}utd_title`]: {
		en: "A message couldn't be decrypted",
		de: "Eine Nachricht konnte nicht entschlüsselt werden"
	},
	[`${v}utd_unverified`]: {
		en: "This device doesn't have the keys for some messages yet. Verify it with another device you're signed in on, or with your recovery key, and they unlock.",
		de: "Dieses Gerät hat die Schlüssel für einige Nachrichten noch nicht. Verifiziere es mit einem anderen angemeldeten Gerät oder deinem Wiederherstellungsschlüssel, dann werden sie lesbar."
	},
	[`${v}utd_no_recovery`]: {
		en: "This device doesn't have the key for this message. Set up a recovery key now, so your next device gets your history.",
		de: "Dieses Gerät hat den Schlüssel für diese Nachricht nicht. Richte jetzt einen Wiederherstellungsschlüssel ein, damit dein nächstes Gerät deinen Verlauf bekommt."
	},
	[`${v}utd_ok`]: {
		en: "Your device is set up correctly; the sender's device hasn't shared the key for this message with it. That often sorts itself out once their device is online again. If not, ask them to send it again.",
		de: "Dein Gerät ist richtig eingerichtet; das Gerät des Absenders hat den Schlüssel für diese Nachricht nicht mit ihm geteilt. Das löst sich oft, sobald sein Gerät wieder online ist. Sonst bitte ihn, sie noch einmal zu schicken."
	},
	[`${v}utd_from`]: {
		en: "From %(sender)s in %(room)s",
		de: "Von %(sender)s in %(room)s"
	},
	[`${v}utd_show`]: {
		en: "Show message",
		de: "Nachricht zeigen"
	},
	[`${v}utd_learn`]: {
		en: "What does this mean?",
		de: "Was heißt das?"
	},
	[`${v}utd_dismiss`]: {
		en: "Got it",
		de: "Verstanden"
	},
	[`${v}utd_never`]: {
		en: "Don't show again",
		de: "Nicht mehr anzeigen"
	}
};
function b(e, t) {
	return t ? e.replace(/%\((\w+)\)s/g, (e, n) => n in t ? String(t[n]) : e) : e;
}
function x(e, t) {
	if (!t) return e;
	let n = y;
	return (r, i) => {
		let a = n[r];
		return a ? b(a[t] ?? a.en, i) : e(r, i);
	};
}
// src/state.ts
var S = "de.datanauten.teamswelcome";
function ee(e) {
	if (!e || typeof e != "object") return {};
	let t = e;
	return {
		dismissed: t.dismissed === !0 || void 0,
		dismissed_at: typeof t.dismissed_at == "number" ? t.dismissed_at : void 0,
		utd_hint_off: t.utd_hint_off === !0 || void 0
	};
}
function C(e, t) {
	return t && !e.dismissed;
}
function te(e, t) {
	return {
		...e && typeof e == "object" ? e : {},
		...t
	};
}
// src/suite.ts
var w = "deDatanautenTeamsSuite";
function ne(e, t) {
	let n = window, r = n[w] ??= {};
	r[e] = { version: t };
}
function re(e) {
	let t = window[w];
	return t && typeof t == "object" && t[e] ? !0 : !!document.getElementById(`de-datanauten-${e}-style`);
}
// src/habits.ts
var T = [
	{ id: "team" },
	{ id: "channel" },
	{ id: "chat" },
	{
		id: "activity",
		via: ["activity", "teamwork"]
	},
	{
		id: "files",
		via: ["files-hub"]
	},
	{ id: "meet" },
	{
		id: "mention",
		via: ["tag-mentions"]
	},
	{
		id: "status",
		via: ["profile-status"]
	},
	{
		id: "saved",
		via: ["teamwork"]
	},
	{
		id: "schedule",
		via: ["teamwork"]
	},
	{
		id: "urgent",
		via: ["teamwork"]
	},
	{
		id: "praise",
		via: ["teamwork"]
	},
	{ id: "reply" },
	{ id: "pin" },
	{ id: "search" }
];
function E(e, t = T) {
	return t.map((t) => {
		let n = t.via?.find(e);
		return {
			id: t.id,
			teamsKey: `${v}cs_${t.id}_teams`,
			elementKey: `${v}cs_${t.id}_${n ?? "element"}`,
			module: n
		};
	});
}
var D = [
	{
		labelKey: `${v}key_search`,
		teams: "Mod+E",
		element: "Mod+K"
	},
	{
		labelKey: `${v}key_shortcuts`,
		teams: "Mod+.",
		element: "Mod+/"
	},
	{
		labelKey: `${v}key_switch`,
		teams: "Mod+1…6",
		element: "Mod+1…9"
	},
	{
		labelKey: `${v}key_updown`,
		teams: "Alt+↑ / Alt+↓",
		element: "Alt+↑ / Alt+↓"
	},
	{
		labelKey: `${v}key_unread`,
		teams: null,
		element: "Alt+Shift+↓"
	},
	{
		labelKey: `${v}key_attach`,
		teams: "Mod+O",
		element: "Mod+Shift+U"
	},
	{
		labelKey: `${v}key_newline`,
		teams: "Shift+Enter",
		element: "Shift+Enter"
	},
	{
		labelKey: `${v}key_edit`,
		teams: "↑",
		element: "↑"
	},
	{
		labelKey: `${v}key_mute`,
		teams: "Mod+Shift+M",
		element: "Mod+D"
	},
	{
		labelKey: `${v}key_camera`,
		teams: "Mod+Shift+O",
		element: "Mod+E"
	}
];
function ie(e = typeof navigator > "u" ? "" : navigator.platform) {
	return /Mac|iPhone|iPad/i.test(e);
}
function O(e, t = ie()) {
	let n = t ? {
		Mod: "⌘",
		Alt: "⌥",
		Shift: "⇧"
	} : {
		Mod: "Ctrl",
		Alt: "Alt",
		Shift: "Shift"
	};
	return e.replace(/\b(Mod|Alt|Shift)\b/g, (e) => n[e]);
}
// node_modules/.pnpm/react@19.3.1/node_modules/react/cjs/react-jsx-runtime.production.js
var ae = /* @__PURE__ */ e(((e) => {
	var t = Symbol.for("react.transitional.element");
	function n(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.jsx = n, e.jsxs = n;
})), k = (/* @__PURE__ */ e(((e, t) => {
	t.exports = ae();
})))();
function A(e) {
	return /* @__PURE__ */ (0, k.jsx)("svg", {
		width: "16",
		height: "16",
		viewBox: "0 0 24 24",
		fill: "currentColor",
		"aria-hidden": "true",
		...e,
		children: /* @__PURE__ */ (0, k.jsx)("path", { d: "M9.55 17.575q-.2 0-.375-.062a.9.9 0 0 1-.325-.213L4.55 13q-.275-.275-.262-.712.012-.438.287-.713a.95.95 0 0 1 .7-.275q.425 0 .7.275L9.55 15.15l8.475-8.475q.275-.275.713-.275.437 0 .712.275.275.275.275.713 0 .437-.275.712l-9.2 9.2q-.15.15-.325.213a1.1 1.1 0 0 1-.375.062" })
	});
}
function j(e) {
	return /* @__PURE__ */ (0, k.jsx)("svg", {
		width: "20",
		height: "20",
		viewBox: "0 0 24 24",
		fill: "currentColor",
		"aria-hidden": "true",
		...e,
		children: /* @__PURE__ */ (0, k.jsx)("path", { d: "M6.293 6.293a1 1 0 0 1 1.414 0L12 10.586l4.293-4.293a1 1 0 1 1 1.414 1.414L13.414 12l4.293 4.293a1 1 0 0 1-1.414 1.414L12 13.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L10.586 12 6.293 7.707a1 1 0 0 1 0-1.414" })
	});
}
function M(e) {
	return /* @__PURE__ */ (0, k.jsx)("svg", {
		width: "20",
		height: "20",
		viewBox: "0 0 24 24",
		fill: "currentColor",
		"aria-hidden": "true",
		...e,
		children: /* @__PURE__ */ (0, k.jsx)("path", { d: "M6 22q-.824 0-1.412-.587A1.93 1.93 0 0 1 4 20V10q0-.825.588-1.412A1.93 1.93 0 0 1 6 8h1V6q0-2.075 1.463-3.537Q9.926 1 12 1q2.075 0 3.537 1.463Q17 3.925 17 6v2h1q.824 0 1.413.588Q20 9.175 20 10v10q0 .824-.587 1.413A1.93 1.93 0 0 1 18 22zm0-2h12V10H6zM9 8h6V6q0-1.25-.875-2.125A2.9 2.9 0 0 0 12 3q-1.25 0-2.125.875A2.9 2.9 0 0 0 9 6z" })
	});
}
// src/ui/Guide.tsx
function N(e, t) {
	let [n, r] = window.React.useState(), [i, a] = window.React.useState(0), o = window.React.useRef(e);
	return o.current = e, window.React.useEffect(() => {
		let e = !0, n = () => void o.current().then((t) => e && r(t), () => void 0);
		n();
		let i = setInterval(n, t);
		return () => {
			e = !1, clearInterval(i);
		};
	}, [t, i]), [n, window.React.useCallback(() => a((e) => e + 1), [])];
}
function P({ t: e, config: t, services: n, variant: r, initialStep: i, onClose: a, pollMs: s = 2e3 }) {
	let c = t.steps, [l, u] = window.React.useState(() => Math.max(0, i ? c.indexOf(i) : 0)), [d, f] = window.React.useState(() => new Set(c.length ? [c[Math.max(0, l)]] : [])), [p] = N(n.secureStatus, s), [m] = N(n.profile, s), [h] = N(async () => n.notificationsOn(), s), [g, _] = N(n.spaces, s), y = c[l], b = (e) => {
		u(e), f((t) => new Set(t).add(c[e]));
	}, x = {
		secure: !!p && o(p),
		habits: d.has("habits"),
		profile: !!m?.hasAvatar && !!m?.hasName && !!h,
		spaces: !!g?.length && g.every((e) => e.membership === "join")
	}, S = t.organisation ? e(`${v}title_org`, { org: t.organisation }) : e(`${v}title`);
	return /* @__PURE__ */ (0, k.jsxs)("section", {
		className: `twl-guide twl-guide-${r}`,
		"aria-label": S,
		"data-teams-welcome-guide": "",
		children: [
			/* @__PURE__ */ (0, k.jsxs)("header", {
				className: "twl-header",
				children: [/* @__PURE__ */ (0, k.jsxs)("div", {
					className: "twl-header-text",
					children: [/* @__PURE__ */ (0, k.jsx)("h2", {
						className: "twl-title",
						children: S
					}), r === "panel" && t.organisation && /* @__PURE__ */ (0, k.jsx)("p", {
						className: "twl-subtitle",
						children: e("datanauten_teamswelcome_title")
					})]
				}), a && /* @__PURE__ */ (0, k.jsx)("button", {
					type: "button",
					className: "twl-icon-button",
					"aria-label": e("datanauten_teamswelcome_close"),
					title: e("datanauten_teamswelcome_close"),
					onClick: a,
					children: /* @__PURE__ */ (0, k.jsx)(j, {})
				})]
			}),
			l === 0 && /* @__PURE__ */ (0, k.jsx)("p", {
				className: "twl-intro",
				children: e("datanauten_teamswelcome_intro")
			}),
			/* @__PURE__ */ (0, k.jsx)("nav", {
				className: "twl-steps",
				"aria-label": e(`${v}step_of`, {
					n: l + 1,
					total: c.length
				}),
				children: c.map((t, n) => /* @__PURE__ */ (0, k.jsxs)("button", {
					type: "button",
					className: `twl-step-tab${n === l ? " twl-active" : ""}${x[t] ? " twl-done" : ""}`,
					"aria-current": n === l ? "step" : void 0,
					onClick: () => b(n),
					"data-step": t,
					children: [/* @__PURE__ */ (0, k.jsx)("span", {
						className: "twl-step-num",
						children: x[t] ? /* @__PURE__ */ (0, k.jsx)(A, { "aria-label": e(`${v}done_badge`) }) : n + 1
					}), /* @__PURE__ */ (0, k.jsx)("span", {
						className: "twl-step-label",
						children: e(`${v}step_${t}`)
					})]
				}, t))
			}),
			/* @__PURE__ */ (0, k.jsxs)("div", {
				className: "twl-body",
				children: [
					y === "secure" && /* @__PURE__ */ (0, k.jsx)(se, {
						t: e,
						status: p,
						services: n
					}),
					y === "habits" && /* @__PURE__ */ (0, k.jsx)(I, {
						t: e,
						services: n
					}),
					y === "profile" && /* @__PURE__ */ (0, k.jsx)(L, {
						t: e,
						profile: m,
						notifications: !!h,
						services: n
					}),
					y === "spaces" && /* @__PURE__ */ (0, k.jsx)(R, {
						t: e,
						config: t,
						spaces: g,
						services: n,
						refresh: _
					})
				]
			}),
			/* @__PURE__ */ (0, k.jsxs)("footer", {
				className: "twl-footer",
				children: [
					/* @__PURE__ */ (0, k.jsx)("div", {
						className: "twl-footer-help",
						children: t.helpUrl && /* @__PURE__ */ (0, k.jsx)("a", {
							href: t.helpUrl,
							target: "_blank",
							rel: "noreferrer noopener",
							children: e("datanauten_teamswelcome_help", { label: t.helpLabel ?? e("datanauten_teamswelcome_help_default") })
						})
					}),
					/* @__PURE__ */ (0, k.jsx)("span", {
						className: "twl-step-count",
						children: e(`${v}step_of`, {
							n: l + 1,
							total: c.length
						})
					}),
					l > 0 && /* @__PURE__ */ (0, k.jsx)("button", {
						type: "button",
						className: "twl-button twl-secondary",
						onClick: () => b(l - 1),
						children: e("datanauten_teamswelcome_back")
					}),
					l < c.length - 1 ? /* @__PURE__ */ (0, k.jsx)("button", {
						type: "button",
						className: "twl-button twl-primary",
						onClick: () => b(l + 1),
						children: e(`${v}next`)
					}) : a && /* @__PURE__ */ (0, k.jsx)("button", {
						type: "button",
						className: "twl-button twl-primary",
						onClick: a,
						children: e("datanauten_teamswelcome_finish")
					})
				]
			})
		]
	});
}
function F({ ok: e, label: t, hint: n }) {
	let r = e === void 0 ? "unknown" : e ? "ok" : "todo";
	return /* @__PURE__ */ (0, k.jsxs)("li", {
		className: `twl-check twl-check-${r}`,
		"data-ok": r,
		children: [/* @__PURE__ */ (0, k.jsx)("span", {
			className: "twl-check-mark",
			children: e ? /* @__PURE__ */ (0, k.jsx)(A, {}) : null
		}), /* @__PURE__ */ (0, k.jsxs)("span", { children: [/* @__PURE__ */ (0, k.jsx)("span", {
			className: "twl-check-label",
			children: t
		}), n && /* @__PURE__ */ (0, k.jsx)("span", {
			className: "twl-check-hint",
			children: n
		})] })]
	});
}
var oe = {
	verify: `${v}btn_verify`,
	key_storage: `${v}btn_key_storage`,
	fix_recovery: `${v}btn_fix_recovery`,
	set_up_recovery: `${v}btn_set_up_recovery`
};
function se({ t: e, status: t, services: n }) {
	let r = !!t && o(t), i = !!t && t.keyStorage === void 0 && t.recovery === void 0 && t.verified === void 0, a = t ? s(t) : null;
	return /* @__PURE__ */ (0, k.jsxs)("div", {
		className: "twl-step",
		"data-step-body": "secure",
		children: [
			/* @__PURE__ */ (0, k.jsx)("p", { children: e(`${v}secure_why`) }),
			/* @__PURE__ */ (0, k.jsx)("p", { children: /* @__PURE__ */ (0, k.jsx)("strong", { children: e(`${v}secure_key`) }) }),
			/* @__PURE__ */ (0, k.jsx)("p", { children: e(`${v}secure_store`) }),
			/* @__PURE__ */ (0, k.jsxs)("ul", {
				className: "twl-checks",
				"aria-live": "polite",
				children: [
					/* @__PURE__ */ (0, k.jsx)(F, {
						ok: t?.keyStorage,
						label: e(`${v}check_key_storage`),
						hint: e(`${v}check_key_storage_hint`)
					}),
					/* @__PURE__ */ (0, k.jsx)(F, {
						ok: t?.recovery,
						label: e(`${v}check_recovery`),
						hint: e(`${v}check_recovery_hint`)
					}),
					/* @__PURE__ */ (0, k.jsx)(F, {
						ok: t?.verified,
						label: e(`${v}check_verified`),
						hint: e(`${v}check_verified_hint`)
					})
				]
			}),
			r && /* @__PURE__ */ (0, k.jsxs)("p", {
				className: "twl-success",
				role: "status",
				children: [
					/* @__PURE__ */ (0, k.jsx)(A, {}),
					" ",
					e("datanauten_teamswelcome_secure_done")
				]
			}),
			i && /* @__PURE__ */ (0, k.jsx)("p", {
				className: "twl-note",
				children: e("datanauten_teamswelcome_secure_unknown")
			}),
			n.canOpenSettings() && /* @__PURE__ */ (0, k.jsx)("div", {
				className: "twl-actions",
				children: a ? /* @__PURE__ */ (0, k.jsxs)("button", {
					type: "button",
					className: "twl-button twl-primary",
					onClick: () => n.runSecure(a),
					children: [
						/* @__PURE__ */ (0, k.jsx)(M, {}),
						" ",
						e(oe[a])
					]
				}) : t && /* @__PURE__ */ (0, k.jsx)("button", {
					type: "button",
					className: "twl-button twl-secondary",
					onClick: () => n.runSecure(null),
					children: e("datanauten_teamswelcome_btn_encryption_settings")
				})
			}),
			!r && /* @__PURE__ */ (0, k.jsx)("p", {
				className: "twl-note",
				children: e("datanauten_teamswelcome_secure_toast_note")
			}),
			/* @__PURE__ */ (0, k.jsxs)("details", {
				className: "twl-glossary",
				children: [/* @__PURE__ */ (0, k.jsx)("summary", { children: e(`${v}glossary_title`) }), /* @__PURE__ */ (0, k.jsxs)("dl", { children: [
					/* @__PURE__ */ (0, k.jsx)("dt", { children: e(`${v}glossary_verify_term`) }),
					/* @__PURE__ */ (0, k.jsx)("dd", { children: e(`${v}glossary_verify`) }),
					/* @__PURE__ */ (0, k.jsx)("dt", { children: e(`${v}glossary_utd_term`) }),
					/* @__PURE__ */ (0, k.jsx)("dd", { children: e(`${v}glossary_utd`) })
				] })]
			})
		]
	});
}
function I({ t: e, services: t }) {
	let n = E(t.isLoaded), r = t.isLoaded("keyboard-shortcuts");
	return /* @__PURE__ */ (0, k.jsxs)("div", {
		className: "twl-step",
		"data-step-body": "habits",
		children: [
			/* @__PURE__ */ (0, k.jsx)("p", { children: e(`${v}habits_intro`) }),
			/* @__PURE__ */ (0, k.jsxs)("table", {
				className: "twl-table twl-cheatsheet",
				children: [/* @__PURE__ */ (0, k.jsx)("thead", { children: /* @__PURE__ */ (0, k.jsxs)("tr", { children: [/* @__PURE__ */ (0, k.jsx)("th", {
					scope: "col",
					children: e(`${v}col_teams`)
				}), /* @__PURE__ */ (0, k.jsx)("th", {
					scope: "col",
					children: e(`${v}col_element`)
				})] }) }), /* @__PURE__ */ (0, k.jsx)("tbody", { children: n.map((t) => /* @__PURE__ */ (0, k.jsxs)("tr", {
					"data-entry": t.id,
					"data-module": t.module,
					children: [/* @__PURE__ */ (0, k.jsx)("th", {
						scope: "row",
						children: e(t.teamsKey)
					}), /* @__PURE__ */ (0, k.jsxs)("td", { children: [e(t.elementKey), t.module && /* @__PURE__ */ (0, k.jsx)("span", {
						className: "twl-addon",
						title: e("datanauten_teamswelcome_addon_hint"),
						children: e("datanauten_teamswelcome_addon")
					})] })]
				}, t.id)) })]
			}),
			/* @__PURE__ */ (0, k.jsxs)("div", {
				className: "twl-card",
				"data-card": "shortcuts",
				children: [
					/* @__PURE__ */ (0, k.jsx)("h3", { children: e(`${v}keys_title`) }),
					/* @__PURE__ */ (0, k.jsx)("p", { children: e(`${v}keys_intro`) }),
					/* @__PURE__ */ (0, k.jsxs)("table", {
						className: "twl-table twl-keys",
						children: [/* @__PURE__ */ (0, k.jsx)("thead", { children: /* @__PURE__ */ (0, k.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, k.jsx)("th", {
								scope: "col",
								children: e(`${v}keys_col_action`)
							}),
							/* @__PURE__ */ (0, k.jsx)("th", {
								scope: "col",
								children: "Teams"
							}),
							/* @__PURE__ */ (0, k.jsx)("th", {
								scope: "col",
								children: "Element"
							})
						] }) }), /* @__PURE__ */ (0, k.jsx)("tbody", { children: D.map((t) => /* @__PURE__ */ (0, k.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, k.jsx)("th", {
								scope: "row",
								children: e(t.labelKey)
							}),
							/* @__PURE__ */ (0, k.jsx)("td", { children: t.teams ? /* @__PURE__ */ (0, k.jsx)("kbd", { children: O(t.teams) }) : /* @__PURE__ */ (0, k.jsx)("span", {
								className: "twl-muted",
								children: e(`${v}key_none`)
							}) }),
							/* @__PURE__ */ (0, k.jsx)("td", { children: t.element ? /* @__PURE__ */ (0, k.jsx)("kbd", { children: O(t.element) }) : /* @__PURE__ */ (0, k.jsx)("span", {
								className: "twl-muted",
								children: e(`${v}key_none`)
							}) })
						] }, t.labelKey)) })]
					}),
					r ? /* @__PURE__ */ (0, k.jsx)("p", {
						className: "twl-note",
						"data-sibling": "keyboard-shortcuts",
						children: e(`${v}keys_overlay`)
					}) : t.canOpenSettings() && /* @__PURE__ */ (0, k.jsx)("div", {
						className: "twl-actions",
						children: /* @__PURE__ */ (0, k.jsx)("button", {
							type: "button",
							className: "twl-button twl-secondary",
							onClick: () => t.openSettings("USER_KEYBOARD_TAB"),
							children: e("datanauten_teamswelcome_keys_all")
						})
					})
				]
			})
		]
	});
}
function L({ t: e, profile: t, notifications: n, services: r }) {
	let i = r.canOpenSettings();
	return /* @__PURE__ */ (0, k.jsxs)("div", {
		className: "twl-step",
		"data-step-body": "profile",
		children: [
			/* @__PURE__ */ (0, k.jsx)("p", { children: e(`${v}profile_intro`) }),
			/* @__PURE__ */ (0, k.jsxs)("ul", {
				className: "twl-checks",
				children: [/* @__PURE__ */ (0, k.jsx)(F, {
					ok: t?.hasAvatar,
					label: e(`${v}check_avatar`)
				}), /* @__PURE__ */ (0, k.jsx)(F, {
					ok: t?.hasName,
					label: t?.hasName && t.displayName ? e(`${v}check_name`, { name: t.displayName }) : e(`${v}check_no_name`)
				})]
			}),
			i && /* @__PURE__ */ (0, k.jsx)("div", {
				className: "twl-actions",
				children: /* @__PURE__ */ (0, k.jsx)("button", {
					type: "button",
					className: "twl-button twl-secondary",
					onClick: () => r.openSettings("USER_ACCOUNT_TAB"),
					children: e("datanauten_teamswelcome_btn_edit_profile")
				})
			}),
			/* @__PURE__ */ (0, k.jsx)("p", { children: e(`${v}notif_intro`) }),
			/* @__PURE__ */ (0, k.jsx)("ul", {
				className: "twl-checks",
				children: /* @__PURE__ */ (0, k.jsx)(F, {
					ok: n,
					label: e(`${v}check_notifications`)
				})
			}),
			i && /* @__PURE__ */ (0, k.jsx)("div", {
				className: "twl-actions",
				children: /* @__PURE__ */ (0, k.jsx)("button", {
					type: "button",
					className: "twl-button twl-secondary",
					onClick: () => r.openSettings("USER_NOTIFICATIONS_TAB"),
					children: e("datanauten_teamswelcome_btn_notifications")
				})
			})
		]
	});
}
function R({ t: e, config: t, spaces: n, services: r, refresh: i }) {
	let [a, o] = window.React.useState(/* @__PURE__ */ new Set()), [s, c] = window.React.useState({}), l = n ?? t.spaces.map((e) => ({
		alias: e.alias,
		name: e.name ?? e.alias,
		description: e.description,
		membership: "none"
	})), u = l.filter((e) => e.membership !== "join"), d = async (e) => {
		o((t) => /* @__PURE__ */ new Set([...t, ...e]));
		for (let t of e) {
			try {
				await r.joinSpace(t), c(({ [t]: e, ...n }) => n);
			} catch (e) {
				c((n) => ({
					...n,
					[t]: e instanceof Error ? e.message : String(e)
				}));
			}
			o((e) => {
				let n = new Set(e);
				return n.delete(t), n;
			}), i();
		}
	};
	return /* @__PURE__ */ (0, k.jsxs)("div", {
		className: "twl-step",
		"data-step-body": "spaces",
		children: [
			/* @__PURE__ */ (0, k.jsx)("p", { children: t.organisation ? e(`${v}spaces_intro_org`, { org: t.organisation }) : e(`${v}spaces_intro`) }),
			/* @__PURE__ */ (0, k.jsx)("ul", {
				className: "twl-spaces",
				children: l.map((t) => /* @__PURE__ */ (0, k.jsxs)("li", {
					className: "twl-space",
					"data-alias": t.alias,
					"data-membership": t.membership,
					children: [
						/* @__PURE__ */ (0, k.jsx)("span", {
							className: "twl-space-avatar",
							"aria-hidden": "true",
							children: (t.name.replace(/^[#!]/, "")[0] ?? "?").toUpperCase()
						}),
						/* @__PURE__ */ (0, k.jsxs)("span", {
							className: "twl-space-text",
							children: [
								/* @__PURE__ */ (0, k.jsx)("span", {
									className: "twl-space-name",
									children: t.name
								}),
								t.description && /* @__PURE__ */ (0, k.jsx)("span", {
									className: "twl-space-desc",
									children: t.description
								}),
								s[t.alias] && /* @__PURE__ */ (0, k.jsx)("span", {
									className: "twl-error",
									role: "alert",
									children: e("datanauten_teamswelcome_join_failed", { error: s[t.alias] })
								})
							]
						}),
						t.membership === "join" ? /* @__PURE__ */ (0, k.jsxs)("span", {
							className: "twl-space-joined",
							children: [/* @__PURE__ */ (0, k.jsxs)("span", {
								className: "twl-joined",
								children: [
									/* @__PURE__ */ (0, k.jsx)(A, {}),
									" ",
									e(`${v}joined`)
								]
							}), /* @__PURE__ */ (0, k.jsx)("button", {
								type: "button",
								className: "twl-button twl-secondary twl-small",
								onClick: () => r.openSpace(t),
								children: e(`${v}btn_open`)
							})]
						}) : /* @__PURE__ */ (0, k.jsx)("button", {
							type: "button",
							className: "twl-button twl-secondary twl-small",
							disabled: a.has(t.alias),
							onClick: () => void d([t.alias]),
							children: a.has(t.alias) ? e(`${v}joining`) : e(`${v}btn_join`)
						})
					]
				}, t.alias))
			}),
			u.length > 1 && /* @__PURE__ */ (0, k.jsx)("div", {
				className: "twl-actions",
				children: /* @__PURE__ */ (0, k.jsx)("button", {
					type: "button",
					className: "twl-button twl-primary",
					disabled: u.every((e) => a.has(e.alias)),
					onClick: () => void d(u.filter((e) => !a.has(e.alias)).map((e) => e.alias)),
					children: e("datanauten_teamswelcome_btn_join_all")
				})
			}),
			n && u.length === 0 && /* @__PURE__ */ (0, k.jsxs)("p", {
				className: "twl-success",
				role: "status",
				children: [
					/* @__PURE__ */ (0, k.jsx)(A, {}),
					" ",
					e("datanauten_teamswelcome_spaces_done")
				]
			})
		]
	});
}
// src/ui/styles.css?inline
var z = "#teams-welcome-root .twl-panel-frame{top:var(--cpd-space-4x);right:var(--cpd-space-4x);bottom:var(--cpd-space-4x);width:min(460px, calc(100vw - 2 * var(--cpd-space-4x)));display:flex;position:fixed}@media (width>=1100px){html.twl-docked #matrixchat{margin-right:calc(460px + 2 * var(--cpd-space-4x))}}@media (width<=600px){#teams-welcome-root .twl-panel-frame{top:auto;left:var(--cpd-space-2x);right:var(--cpd-space-2x);bottom:var(--cpd-space-2x);width:auto;max-height:85vh}}.twl-guide{min-height:0;color:var(--cpd-color-text-primary);font:var(--cpd-font-body-md-regular);background:var(--cpd-color-bg-canvas-default);box-sizing:border-box;flex-direction:column;display:flex}.twl-guide-panel{border:1px solid var(--cpd-color-border-interactive-secondary);border-radius:16px;flex:1;overflow:hidden;box-shadow:0 4px 24px #0000002e}.twl-guide-page{width:100%;max-width:760px;height:100%;margin:0 auto}.twl-page-scroll{height:100%;padding:var(--cpd-space-6x) var(--cpd-space-4x);box-sizing:border-box;overflow:auto}.twl-header{align-items:flex-start;gap:var(--cpd-space-2x);padding:var(--cpd-space-5x) var(--cpd-space-5x) var(--cpd-space-2x);display:flex}.twl-header-text{flex:1;min-width:0}.twl-title{font:var(--cpd-font-heading-sm-semibold);margin:0}.twl-subtitle{margin:var(--cpd-space-1x) 0 0;color:var(--cpd-color-text-secondary);font:var(--cpd-font-body-sm-regular)}.twl-intro{padding:0 var(--cpd-space-5x) var(--cpd-space-2x);color:var(--cpd-color-text-secondary);font:var(--cpd-font-body-sm-regular);margin:0}.twl-icon-button{width:32px;height:32px;color:var(--cpd-color-icon-secondary);cursor:pointer;background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.twl-icon-button:hover{background:var(--cpd-color-bg-action-tertiary-hovered);color:var(--cpd-color-text-primary)}.twl-steps{gap:var(--cpd-space-1x);padding:var(--cpd-space-2x) var(--cpd-space-4x);border-bottom:1px solid var(--cpd-color-border-interactive-secondary);display:flex;overflow-x:auto}.twl-step-tab{align-items:center;gap:var(--cpd-space-1x);min-width:72px;padding:var(--cpd-space-1-5x) var(--cpd-space-1x);color:var(--cpd-color-text-secondary);font:var(--cpd-font-body-xs-regular);text-align:center;cursor:pointer;background:0 0;border:none;border-radius:8px;flex-direction:column;flex:1 1 0;display:flex}.twl-step-tab:hover{background:var(--cpd-color-bg-subtle-secondary)}.twl-step-tab.twl-active{color:var(--cpd-color-text-primary);font-weight:600}.twl-step-num{border:1px solid var(--cpd-color-border-interactive-primary);width:24px;height:24px;font:var(--cpd-font-body-sm-semibold);box-sizing:border-box;border-radius:50%;justify-content:center;align-items:center;display:inline-flex}.twl-step-tab.twl-active .twl-step-num{background:var(--cpd-color-bg-action-primary-rest);border-color:var(--cpd-color-bg-action-primary-rest);color:var(--cpd-color-text-on-solid-primary)}.twl-step-tab.twl-done .twl-step-num{background:var(--cpd-color-bg-success-subtle);border-color:var(--cpd-color-border-success-subtle);color:var(--cpd-color-icon-success-primary)}.twl-body{min-height:0;padding:var(--cpd-space-4x) var(--cpd-space-5x);flex:1;overflow-y:auto}.twl-guide-page .twl-body{overflow:visible}.twl-step p{margin:0 0 var(--cpd-space-3x)}.twl-checks{margin:0 0 var(--cpd-space-3x);gap:var(--cpd-space-2x);flex-direction:column;padding:0;list-style:none;display:flex}.twl-check{align-items:flex-start;gap:var(--cpd-space-2x);display:flex}.twl-check-mark{border:2px solid var(--cpd-color-border-interactive-primary);box-sizing:border-box;border-radius:50%;flex:none;justify-content:center;align-items:center;width:22px;height:22px;display:inline-flex}.twl-check-ok .twl-check-mark{border-color:var(--cpd-color-icon-success-primary);background:var(--cpd-color-icon-success-primary);color:var(--cpd-color-text-on-solid-primary)}.twl-check-unknown .twl-check-mark{border-style:dashed}.twl-check-label{font:var(--cpd-font-body-md-medium);display:block}.twl-check-hint{color:var(--cpd-color-text-secondary);font:var(--cpd-font-body-sm-regular);display:block}.twl-success{align-items:flex-start;gap:var(--cpd-space-2x);padding:var(--cpd-space-3x);background:var(--cpd-color-bg-success-subtle);color:var(--cpd-color-text-success-primary);font:var(--cpd-font-body-md-medium);border-radius:8px;display:flex}.twl-success svg{flex:none;margin-top:2px}.twl-note{color:var(--cpd-color-text-secondary);font:var(--cpd-font-body-sm-regular)}.twl-actions{align-items:center;gap:var(--cpd-space-2x);margin:0 0 var(--cpd-space-4x);flex-wrap:wrap;display:flex}.twl-button{align-items:center;gap:var(--cpd-space-1-5x);padding:var(--cpd-space-2x) var(--cpd-space-4x);font:var(--cpd-font-body-md-semibold);cursor:pointer;border:1px solid #0000;border-radius:99px;display:inline-flex}.twl-button.twl-small{padding:var(--cpd-space-1x) var(--cpd-space-3x);font:var(--cpd-font-body-sm-semibold)}.twl-button:disabled{opacity:.6;cursor:default}.twl-primary{background:var(--cpd-color-bg-action-primary-rest);color:var(--cpd-color-text-on-solid-primary)}.twl-primary:hover:not(:disabled){background:var(--cpd-color-bg-action-primary-hovered)}.twl-secondary{background:var(--cpd-color-bg-action-secondary-rest);border-color:var(--cpd-color-border-interactive-secondary);color:var(--cpd-color-text-primary)}.twl-secondary:hover:not(:disabled){background:var(--cpd-color-bg-action-secondary-hovered);border-color:var(--cpd-color-border-interactive-primary)}.twl-link{color:var(--cpd-color-text-secondary);font:var(--cpd-font-body-sm-regular);cursor:pointer;background:0 0;border:none;padding:0;text-decoration:underline}.twl-glossary{margin-top:var(--cpd-space-2x);padding:var(--cpd-space-2x) var(--cpd-space-3x);background:var(--cpd-color-bg-subtle-secondary);border-radius:8px}.twl-glossary summary{cursor:pointer;font:var(--cpd-font-body-md-medium)}.twl-glossary dt{margin-top:var(--cpd-space-2x);font:var(--cpd-font-body-sm-semibold)}.twl-glossary dd{color:var(--cpd-color-text-secondary);font:var(--cpd-font-body-sm-regular);margin:0}.twl-table{border-collapse:collapse;width:100%;margin-bottom:var(--cpd-space-4x);font:var(--cpd-font-body-sm-regular)}.twl-table th,.twl-table td{padding:var(--cpd-space-2x) var(--cpd-space-1-5x);border-bottom:1px solid var(--cpd-color-border-interactive-secondary);text-align:left;vertical-align:top}.twl-table thead th{color:var(--cpd-color-text-secondary);font:var(--cpd-font-body-xs-regular);text-transform:uppercase;letter-spacing:.04em}.twl-table tbody th{font:var(--cpd-font-body-sm-semibold);width:38%}.twl-keys tbody th{width:auto;font:var(--cpd-font-body-sm-regular)}.twl-keys td{white-space:nowrap}.twl-addon{margin-left:var(--cpd-space-1-5x);padding:0 var(--cpd-space-1-5x);background:var(--cpd-color-bg-info-subtle);color:var(--cpd-color-text-info-primary);font:var(--cpd-font-body-xs-regular);vertical-align:1px;border-radius:99px;display:inline-block}.twl-card{padding:var(--cpd-space-3x) var(--cpd-space-4x) var(--cpd-space-1x);border:1px solid var(--cpd-color-border-interactive-secondary);border-radius:12px}.twl-card h3{margin:0 0 var(--cpd-space-1x);font:var(--cpd-font-body-lg-semibold)}.twl-guide kbd{padding:0 var(--cpd-space-1-5x);border:1px solid var(--cpd-color-border-interactive-secondary);background:var(--cpd-color-bg-subtle-secondary);font:var(--cpd-font-body-xs-regular);font-family:var(--cpd-font-family-mono);border-bottom-width:2px;border-radius:4px;display:inline-block}.twl-muted{color:var(--cpd-color-text-secondary)}.twl-spaces{margin:0 0 var(--cpd-space-4x);gap:var(--cpd-space-2x);flex-direction:column;padding:0;list-style:none;display:flex}.twl-space{align-items:center;gap:var(--cpd-space-3x);padding:var(--cpd-space-3x);border:1px solid var(--cpd-color-border-interactive-secondary);border-radius:12px;display:flex}.twl-space-avatar{background:var(--cpd-color-bg-decorative-1);width:36px;height:36px;color:var(--cpd-color-text-decorative-1);font:var(--cpd-font-body-lg-semibold);border-radius:8px;flex:none;justify-content:center;align-items:center;display:inline-flex}.twl-space-text{flex-direction:column;flex:1;min-width:0;display:flex}.twl-space-name{font:var(--cpd-font-body-md-semibold)}.twl-space-desc{color:var(--cpd-color-text-secondary);font:var(--cpd-font-body-sm-regular)}.twl-space-joined{align-items:center;gap:var(--cpd-space-2x);display:flex}.twl-joined{align-items:center;gap:var(--cpd-space-1x);color:var(--cpd-color-text-success-primary);font:var(--cpd-font-body-sm-semibold);display:inline-flex}.twl-error{color:var(--cpd-color-text-critical-primary);font:var(--cpd-font-body-sm-regular)}.twl-footer{align-items:center;gap:var(--cpd-space-2x);padding:var(--cpd-space-3x) var(--cpd-space-5x);border-top:1px solid var(--cpd-color-border-interactive-secondary);display:flex}.twl-footer-help{min-width:0;font:var(--cpd-font-body-sm-regular);flex:1}.twl-footer-help a{color:var(--cpd-color-text-action-accent)}.twl-step-count{color:var(--cpd-color-text-secondary);font:var(--cpd-font-body-xs-regular);white-space:nowrap}#teams-welcome-utd-root .twl-utd{right:var(--cpd-space-4x);bottom:var(--cpd-space-4x);width:min(360px, calc(100vw - 2 * var(--cpd-space-4x)));padding:var(--cpd-space-3x) var(--cpd-space-4x) var(--cpd-space-1x);box-sizing:border-box;border:1px solid var(--cpd-color-border-interactive-secondary);background:var(--cpd-color-bg-canvas-default);color:var(--cpd-color-text-primary);font:var(--cpd-font-body-sm-regular);border-radius:12px;position:fixed;box-shadow:0 4px 24px #0000002e}.twl-utd-header{align-items:center;gap:var(--cpd-space-2x);margin-bottom:var(--cpd-space-2x);font:var(--cpd-font-body-md-semibold);display:flex}.twl-utd-header strong{flex:1}.twl-utd p{margin:0 0 var(--cpd-space-3x)}.twl-utd-message{align-items:baseline;gap:var(--cpd-space-1x) var(--cpd-space-2x);margin:0 0 var(--cpd-space-2x);padding:var(--cpd-space-2x) var(--cpd-space-3x);border-radius:var(--cpd-space-2x);background:var(--cpd-color-bg-subtle-secondary);font:var(--cpd-font-body-sm-regular);flex-wrap:wrap;display:flex}.twl-utd-from{font:var(--cpd-font-body-sm-semibold);overflow-wrap:anywhere;min-width:0}.twl-utd-message time{color:var(--cpd-color-text-secondary)}.twl-utd-message .twl-link{margin-left:auto}[data-teams-welcome-menu] svg.twl-menu-icon{flex:none}", B = {
	verify: `${v}btn_verify`,
	key_storage: `${v}btn_key_storage`,
	fix_recovery: `${v}btn_fix_recovery`,
	set_up_recovery: `${v}btn_set_up_recovery`
};
function V({ t: e, loadStatus: t, pollMs: n = 2e3, canAct: r, message: i, language: a, show: o, act: c, learnMore: l, dismiss: u, never: d }) {
	let [f] = N(t, n), p = f ? s(f) : null, m = p === "verify" || p === "fix_recovery" ? "utd_unverified" : p ? "utd_no_recovery" : "utd_ok";
	return /* @__PURE__ */ (0, k.jsxs)("aside", {
		className: "twl-utd",
		role: "status",
		"aria-label": e(`${v}utd_title`),
		"data-teams-welcome-utd": "",
		children: [
			/* @__PURE__ */ (0, k.jsxs)("header", {
				className: "twl-utd-header",
				children: [
					/* @__PURE__ */ (0, k.jsx)(M, {}),
					/* @__PURE__ */ (0, k.jsx)("strong", { children: e(`${v}utd_title`) }),
					/* @__PURE__ */ (0, k.jsx)("button", {
						type: "button",
						className: "twl-icon-button",
						"aria-label": e(`${v}close`),
						onClick: u,
						children: /* @__PURE__ */ (0, k.jsx)(j, {})
					})
				]
			}),
			i && /* @__PURE__ */ (0, k.jsxs)("div", {
				className: "twl-utd-message",
				"data-testid": "teams-welcome-utd-message",
				children: [
					/* @__PURE__ */ (0, k.jsx)("span", {
						className: "twl-utd-from",
						children: e("datanauten_teamswelcome_utd_from", {
							sender: i.sender,
							room: i.room
						})
					}),
					/* @__PURE__ */ (0, k.jsx)("time", {
						dateTime: new Date(i.ts).toISOString(),
						children: H(i.ts, a)
					}),
					o && /* @__PURE__ */ (0, k.jsx)("button", {
						type: "button",
						className: "twl-link",
						onClick: o,
						children: e("datanauten_teamswelcome_utd_show")
					})
				]
			}),
			/* @__PURE__ */ (0, k.jsx)("p", { children: e(`${v}${m}`) }),
			/* @__PURE__ */ (0, k.jsxs)("div", {
				className: "twl-actions",
				children: [
					p && r && /* @__PURE__ */ (0, k.jsx)("button", {
						type: "button",
						className: "twl-button twl-primary twl-small",
						onClick: () => c(p),
						children: e(B[p])
					}),
					/* @__PURE__ */ (0, k.jsx)("button", {
						type: "button",
						className: "twl-button twl-secondary twl-small",
						onClick: l,
						children: e(`${v}utd_learn`)
					}),
					/* @__PURE__ */ (0, k.jsx)("button", {
						type: "button",
						className: "twl-link",
						onClick: d,
						children: e(`${v}utd_never`)
					})
				]
			})
		]
	});
}
function H(e, t, n = Date.now()) {
	let r = new Date(e), i = new Date(n).toDateString() === r.toDateString();
	try {
		return new Intl.DateTimeFormat(t, i ? { timeStyle: "short" } : {
			dateStyle: "medium",
			timeStyle: "short"
		}).format(r);
	} catch {
		return r.toLocaleString();
	}
}
// src/userMenu.ts
var U = "data-teams-welcome-menu", W = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" fill=\"currentColor\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20m0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16m3 4a1 1 0 1 1 0 2h-2v6a1 1 0 1 1-2 0v-6H9a1 1 0 1 1 0-2z\"/></svg>";
function G(e = document) {
	let t = e.querySelector(".mx_UserMenu [aria-haspopup=menu][aria-expanded=true]");
	if (!t?.id) return null;
	let n = [...e.querySelectorAll("[role=menu][aria-labelledby]")].find((e) => e.getAttribute("aria-labelledby") === t.id);
	if (n) return n;
	let r = t.getAttribute("aria-controls");
	return r ? e.getElementById(r) : null;
}
function ce(e, t) {
	let n = e.querySelector(`[${U}]`);
	if (n) return n;
	let r = e.querySelectorAll("[role=menuitem]"), i = r[r.length - 1];
	if (!i) return null;
	let a = i.cloneNode(!0);
	a.setAttribute(U, ""), a.removeAttribute("id"), a.removeAttribute("data-highlighted");
	let o = a.querySelector("span") ?? a;
	o.textContent = t.label();
	let s = a.querySelector("svg");
	if (s) {
		let e = document.createElement("span");
		e.innerHTML = W;
		let t = e.firstElementChild;
		t.setAttribute("class", `${s.getAttribute("class") ?? ""} twl-menu-icon`.trim()), s.replaceWith(t);
	}
	return a.addEventListener("click", (n) => {
		n.preventDefault(), n.stopPropagation(), e.dispatchEvent(new KeyboardEvent("keydown", {
			key: "Escape",
			bubbles: !0
		})), t.onSelect();
	}), a.addEventListener("pointerenter", () => a.setAttribute("data-highlighted", "")), a.addEventListener("pointerleave", () => a.removeAttribute("data-highlighted")), i.after(a), a;
}
var le = class {
	opts;
	observer;
	scheduled = !1;
	constructor(e) {
		this.opts = e;
	}
	start() {
		this.observer || typeof MutationObserver > "u" || (this.observer = new MutationObserver(() => this.schedule()), this.observer.observe(document.body, {
			childList: !0,
			subtree: !0,
			attributes: !0,
			attributeFilter: ["aria-expanded"]
		}));
	}
	stop() {
		this.observer?.disconnect(), this.observer = void 0;
	}
	schedule() {
		this.scheduled || (this.scheduled = !0, queueMicrotask(() => {
			this.scheduled = !1;
			let e = G();
			e && ce(e, this.opts);
		}));
	}
}, K = "Event.decrypted", ue = 9e5, de = /* @__PURE__ */ new Set([
	"HISTORICAL_MESSAGE_USER_NOT_JOINED",
	"SENDER_IDENTITY_PREVIOUSLY_VERIFIED",
	"UNSIGNED_SENDER_DEVICE",
	"UNKNOWN_SENDER_DEVICE"
]);
function q(e) {
	return e.isDecryptionFailure() ? !de.has(e.decryptionFailureReason ?? "") : !1;
}
var fe = class {
	onFailure;
	graceMs;
	isVisible;
	now;
	client;
	pending = /* @__PURE__ */ new Map();
	failed = /* @__PURE__ */ new Map();
	fired = !1;
	since = 0;
	constructor(e, t = 8e3, n = () => !0, r = Date.now) {
		this.onFailure = e, this.graceMs = t, this.isVisible = n, this.now = r;
	}
	attach(e) {
		if (this.client !== e) {
			this.detach(), this.client = e, this.since = this.now() - ue, e.on(K, this.onDecrypted);
			for (let t of e.getRooms?.() ?? []) for (let e of t.getLiveTimeline?.().getEvents() ?? []) e.isDecryptionFailure() && this.onDecrypted(e);
		}
	}
	detach() {
		this.client?.off(K, this.onDecrypted), this.client = void 0, this.pending.forEach((e) => clearTimeout(e)), this.pending.clear(), this.failed.clear();
	}
	rearm() {
		this.fired = !1;
	}
	recheck() {
		if (!this.fired) {
			for (let [e, t] of this.failed) if (!q(t)) this.failed.delete(e);
			else if (this.isVisible(t)) {
				this.failed.delete(e), this.fired = !0, this.onFailure(t);
				return;
			}
		}
	}
	onDecrypted = (e) => {
		let t = e.getId();
		if (t && !this.fired) {
			if (!q(e) || e.getTs() < this.since) {
				let e = this.pending.get(t);
				e && clearTimeout(e), this.pending.delete(t), this.failed.delete(t);
			} else this.pending.has(t) || this.failed.has(t) || this.pending.set(t, setTimeout(() => {
				this.pending.delete(t), q(e) && (this.failed.set(t, e), this.recheck());
			}, this.graceMs));
		}
	};
}, J = "twl-docked", Y = "[teams-welcome]", X = "de-datanauten-teams-welcome-style", Z = "teams-welcome", pe = 1500, me = 5e3, Q = class {
	api;
	static moduleApiVersion = "^2.0.0";
	config;
	t;
	started;
	startTimer;
	stateWatch;
	panelRoot;
	panelOpen = !1;
	utdRoot;
	menu;
	utd;
	roomIds = /* @__PURE__ */ new Map();
	profileCache;
	constructor(e) {
		this.api = e, this.menu = new le({
			label: () => this.t(`${v}menu_item`),
			onSelect: () => this.openPanel()
		}), this.utd = new fe((e) => this.showUtdHint(e), void 0, (e) => e.getRoomId() === d(n()));
	}
	async load() {
		let e = this.api.config.get(m);
		this.config = _(e, (e) => console.warn(`${Y} config ${m}: ${e}`)), this.api.i18n.register(y), this.t = x((e, t) => this.api.i18n.translate(e, t), this.config.language), ge(), ne("teams-welcome", t), this.menu.start(), window.addEventListener("hashchange", this.onHashChange), this.api.navigation?.registerLocationRenderer?.(Z, () => /* @__PURE__ */ (0, k.jsx)("div", {
			className: "twl-page-scroll",
			children: /* @__PURE__ */ (0, k.jsx)(P, {
				t: this.t,
				config: this.config,
				services: this.services,
				variant: "page"
			})
		})), this.api.client.waitForClientStarted?.().then(() => this.start()), this.startTimer = setInterval(() => this.start(), 2e3);
	}
	dispose() {
		this.menu.stop(), this.utd.detach(), window.removeEventListener("hashchange", this.onHashChange), this.startTimer && clearInterval(this.startTimer), this.stateWatch?.unwatch(this.onStateChange), this.panelRoot?.unmount?.(), this.utdRoot?.unmount?.();
	}
	start() {
		let e = n();
		if (!e) {
			this.started && this.stop();
			return;
		}
		if (this.started === e || e.isInitialSyncComplete && !e.isInitialSyncComplete()) return;
		try {
			this.stateWatch?.unwatch(this.onStateChange), this.stateWatch = this.api.client.accountData.get(S);
		} catch {
			return;
		}
		this.started = e, this.roomIds.clear(), this.profileCache = void 0, this.stateWatch.watch(this.onStateChange);
		let t = this.state();
		this.config.utdHint && !t.utd_hint_off && this.utd.attach(e), C(t, this.config.autoOpen) && this.config.steps.length && setTimeout(() => {
			this.started === e && C(this.state(), this.config.autoOpen) && this.openPanel();
		}, pe);
	}
	stop() {
		this.started = void 0, this.utd.detach(), this.closePanel(!1), this.hideUtdHint();
	}
	onHashChange = () => this.utd.recheck();
	onStateChange = () => {
		this.state().utd_hint_off && (this.utd.detach(), this.hideUtdHint());
	};
	state() {
		return ee(this.stateWatch?.value);
	}
	async saveState(e) {
		try {
			await this.api.client.accountData.set(S, te(this.stateWatch?.value, e));
		} catch (e) {
			console.warn(`${Y} Saving ${S} failed`, e);
		}
	}
	openPanel(e) {
		this.config.steps.length && n() && (this.hideUtdHint(), this.panelRoot ??= this.api.createRoot($("teams-welcome-root")), this.panelOpen = !0, document.documentElement.classList.add(J), this.panelRoot.render(/* @__PURE__ */ (0, k.jsx)("div", {
			className: "twl-panel-frame",
			children: /* @__PURE__ */ (0, k.jsx)(P, {
				t: this.t,
				config: this.config,
				services: this.services,
				variant: "panel",
				initialStep: e,
				onClose: () => this.closePanel(!0)
			}, Date.now())
		})));
	}
	closePanel(e) {
		this.panelOpen && (this.panelOpen = !1, document.documentElement.classList.remove(J), this.panelRoot?.render(null), e && !this.state().dismissed && this.saveState({
			dismissed: !0,
			dismissed_at: Date.now()
		}));
	}
	showUtdHint(e) {
		let t = n();
		if (!t || this.panelOpen || this.state().utd_hint_off) {
			this.utd.rearm();
			return;
		}
		let r = f(t, e);
		this.utdRoot ??= this.api.createRoot($("teams-welcome-utd-root")), this.utdRoot.render(/* @__PURE__ */ (0, k.jsx)(V, {
			t: this.t,
			message: r,
			language: this.api.i18n.language,
			show: r && (() => {
				this.hideUtdHint(), p(r);
			}),
			loadStatus: () => a(t),
			canAct: i(),
			act: (e) => {
				this.hideUtdHint(), c(e);
			},
			learnMore: () => {
				this.hideUtdHint(), this.openPanel(this.config.steps.includes("secure") ? "secure" : void 0);
			},
			dismiss: () => this.hideUtdHint(),
			never: () => {
				this.hideUtdHint(), this.saveState({ utd_hint_off: !0 });
			}
		}));
	}
	hideUtdHint() {
		this.utdRoot?.render(null);
	}
	services = {
		secureStatus: async () => {
			let e = n();
			return e ? a(e) : {};
		},
		runSecure: (e) => void c(e),
		canOpenSettings: i,
		openSettings: (e) => void r(e),
		profile: () => this.profile(),
		notificationsOn: () => {
			let e = this.api.settings, t;
			try {
				t = e?.getValue?.("notificationsEnabled");
			} catch {
				t = void 0;
			}
			let n = typeof Notification > "u" ? "denied" : Notification.permission;
			return !!t && n === "granted";
		},
		spaces: () => this.spaces(),
		joinSpace: async (e) => {
			let t = n();
			if (!t) throw Error("not logged in");
			let r = await u(t, e, this.config.joinSuggestedRooms);
			this.roomIds.set(e, r);
		},
		openSpace: (e) => {
			let t = this.api.navigation;
			t?.openRoom ? t.openRoom(e.roomId ?? e.alias) : window.location.hash = `#/room/${encodeURIComponent(e.roomId ?? e.alias)}`;
		},
		isLoaded: re
	};
	async profile() {
		let e = n(), t = e?.getUserId();
		if (!e || !t) return;
		let r = this.profileCache;
		if (r && r.userId === t && Date.now() - r.at < me) return r.value;
		let i = await e.getProfileInfo?.(t).catch(() => void 0) ?? {}, a = t.replace(/^@/, "").split(":")[0], o = {
			userId: t,
			displayName: i.displayname,
			hasName: !!i.displayname && i.displayname !== a && i.displayname !== t,
			hasAvatar: !!i.avatar_url
		};
		return this.profileCache = {
			at: Date.now(),
			userId: t,
			value: o
		}, o;
	}
	async spaces() {
		let e = n();
		return Promise.all(this.config.spaces.map(async (t) => {
			let n = t.alias.startsWith("!") ? t.alias : this.roomIds.get(t.alias);
			if (!n && e?.getRoomIdForAlias) try {
				n = (await e.getRoomIdForAlias(t.alias)).room_id, this.roomIds.set(t.alias, n);
			} catch {}
			let r = n ? e?.getRoom(n) : null, i = e ? l(e, n) : "none";
			return {
				alias: t.alias,
				roomId: n,
				name: i === "join" && r?.name || t.name || r?.name || t.alias,
				description: t.description,
				membership: i
			};
		}));
	}
}, he = "#mx_Dialog_StaticContainer, #mx_Dialog_Container, #mx_ContextualMenu_Container";
function $(e) {
	let t = document.createElement("div");
	t.id = e;
	let n = document.querySelector(he);
	return n?.parentElement === document.body ? document.body.insertBefore(t, n) : document.body.appendChild(t), t;
}
function ge() {
	if (document.getElementById(X)) return;
	let e = document.createElement("style");
	e.id = X, e.textContent = z, document.head.appendChild(e);
}
export { Z as PAGE_PATH, Q as TeamsWelcomeModule, Q as default, $ as mountPoint };

//# sourceMappingURL=index.js.map