/*! @datanauten/element-web-module-room-checker 0.3.1 */
// \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), t = "de.datanauten.room_checker.history", n = 1e3;
function r(e) {
	let t = e && typeof e == "object" ? e.spaces : void 0, n = {};
	if (!t || typeof t != "object") return n;
	for (let [e, r] of Object.entries(t)) Array.isArray(r) && (n[e] = r.filter((e) => e && typeof e == "object" && typeof e.at == "number" && typeof e.joined == "number" && typeof e.passing == "number" && Array.isArray(e.failing)));
	return n;
}
var i = (e, t) => new Date(e).toDateString() === new Date(t).toDateString(), a = class {
	api;
	written = {};
	constructor(e) {
		this.api = e;
	}
	get(e) {
		return this.read()[e] ?? [];
	}
	async record(e, r) {
		let a = this.read(), s = [...a[e] ?? []], c = s[s.length - 1], l = {
			...r,
			failing: r.failing.slice(0, n)
		};
		if (c && i(c.at, l.at)) {
			if (o(c, l)) return;
			s[s.length - 1] = l;
		} else s.push(l);
		a[e] = s.slice(-90), this.written[e] = a[e], await this.api.client.accountData.set(t, {
			version: 1,
			spaces: a
		});
	}
	read() {
		let e = {};
		try {
			e = r(this.api.client.accountData.get(t).value);
		} catch {}
		for (let [t, n] of Object.entries(this.written)) {
			let r = e[t];
			(!r || (r[r.length - 1]?.at ?? 0) <= (n[n.length - 1]?.at ?? 0)) && (e[t] = n);
		}
		return e;
	}
};
function o(e, t) {
	return e.joined === t.joined && e.passing === t.passing && e.errors === t.errors && e.warnings === t.warnings && e.failing.join() === t.failing.join();
}
function s(e, t = Date.now()) {
	for (let n = e.length - 1; n >= 0; n--) if (!i(e[n].at, t)) return e[n];
}
// src/i18n.ts
var c = "datanauten_room_checker_", l = Object.fromEntries(Object.entries({
	title: {
		en: "Room checker",
		de: "Raumprüfung"
	},
	space: {
		en: "Space",
		de: "Space"
	},
	close: {
		en: "Close",
		de: "Schließen"
	},
	no_client: {
		en: "Log in to check rooms.",
		de: "Melde dich an, um Räume zu prüfen."
	},
	no_spaces: {
		en: "You're not in any space. Policies live in a space and apply to its rooms.",
		de: "Du bist in keinem Space. Richtlinien gehören zu einem Space und gelten für seine Räume."
	},
	tab_rooms: {
		en: "Rooms",
		de: "Räume"
	},
	tab_policies: {
		en: "Policies",
		de: "Richtlinien"
	},
	search: {
		en: "Search rooms",
		de: "Räume suchen"
	},
	hint: {
		en: "%(key)s or Esc closes · click a room for details and fixes",
		de: "%(key)s oder Esc schließt · Raum anklicken für Details und Korrekturen"
	},
	rooms_one: {
		en: "%(count)s room",
		de: "%(count)s Raum"
	},
	rooms_other: {
		en: "%(count)s rooms",
		de: "%(count)s Räume"
	},
	stat_rooms: {
		en: "Rooms",
		de: "Räume"
	},
	stat_pass: {
		en: "Pass everything",
		de: "Alles erfüllt"
	},
	stat_errors: {
		en: "With errors",
		de: "Mit Fehlern"
	},
	stat_warnings: {
		en: "Only warnings",
		de: "Nur Warnungen"
	},
	stat_unchecked: {
		en: "Not joined",
		de: "Nicht beigetreten"
	},
	compliance: {
		en: "%(percent)s of the rooms you're in pass every policy",
		de: "%(percent)s der Räume, in denen du bist, erfüllen alle Richtlinien"
	},
	by_policy: {
		en: "Failing per policy",
		de: "Verstöße je Richtlinie"
	},
	filter_all: {
		en: "All",
		de: "Alle"
	},
	filter_failing: {
		en: "Failing",
		de: "Mit Verstößen"
	},
	filter_unchecked: {
		en: "Not joined",
		de: "Nicht beigetreten"
	},
	filter_policy: {
		en: "Failing: %(policy)s",
		de: "Verstoß: %(policy)s"
	},
	clear_filter: {
		en: "Show all",
		de: "Alle zeigen"
	},
	no_rooms: {
		en: "This space has no rooms.",
		de: "Dieser Space hat keine Räume."
	},
	no_match: {
		en: "No room matches.",
		de: "Kein Raum passt."
	},
	col_room: {
		en: "Room",
		de: "Raum"
	},
	not_joined: {
		en: "Not joined",
		de: "Nicht beigetreten"
	},
	room_ok: {
		en: "Passes every policy",
		de: "Erfüllt alle Richtlinien"
	},
	room_errors_one: {
		en: "%(count)s error",
		de: "%(count)s Fehler"
	},
	room_errors_other: {
		en: "%(count)s errors",
		de: "%(count)s Fehler"
	},
	room_warnings_one: {
		en: "%(count)s warning",
		de: "%(count)s Warnung"
	},
	room_warnings_other: {
		en: "%(count)s warnings",
		de: "%(count)s Warnungen"
	},
	back: {
		en: "All rooms",
		de: "Alle Räume"
	},
	open_room: {
		en: "Open room",
		de: "Raum öffnen"
	},
	room_settings: {
		en: "Room settings",
		de: "Raumeinstellungen"
	},
	not_joined_detail: {
		en: "You're not in this room, and the server didn't describe it, so it can't be checked.",
		de: "Du bist nicht in diesem Raum, und der Server hat ihn nicht beschrieben, daher lässt er sich nicht prüfen."
	},
	not_joined_partial: {
		en: "You're not in this room: these checks use what the server tells everyone about it. Join it to check the rest and to fix things.",
		de: "Du bist nicht in diesem Raum: diese Prüfungen nutzen, was der Server allen über ihn sagt. Tritt bei, um den Rest zu prüfen und Dinge zu beheben."
	},
	view_room: {
		en: "View room",
		de: "Raum ansehen"
	},
	join_to_fix: {
		en: "Join the room to fix this.",
		de: "Tritt dem Raum bei, um das zu beheben."
	},
	status_unknown: {
		en: "Can't be checked without being in the room",
		de: "Ohne im Raum zu sein nicht prüfbar"
	},
	status_excepted: {
		en: "Accepted for this room: %(reason)s",
		de: "Für diesen Raum akzeptiert: %(reason)s"
	},
	excepted: {
		en: "Accepted",
		de: "Akzeptiert"
	},
	excepted_by: {
		en: "Accepted by %(user)s, %(when)s",
		de: "Akzeptiert von %(user)s, %(when)s"
	},
	accept: {
		en: "Accept for this room …",
		de: "Für diesen Raum akzeptieren …"
	},
	accept_reason: {
		en: "Why is this fine here?",
		de: "Warum ist das hier in Ordnung?"
	},
	accept_save: {
		en: "Accept",
		de: "Akzeptieren"
	},
	take_back: {
		en: "Take back",
		de: "Zurücknehmen"
	},
	exceptions_count_one: {
		en: "%(count)s accepted exception",
		de: "%(count)s akzeptierte Ausnahme"
	},
	exceptions_count_other: {
		en: "%(count)s accepted exceptions",
		de: "%(count)s akzeptierte Ausnahmen"
	},
	exceptions_title: {
		en: "Accepted exceptions",
		de: "Akzeptierte Ausnahmen"
	},
	exceptions_none: {
		en: "None. A failure can be accepted for one room in that room's details.",
		de: "Keine. Ein Verstoß lässt sich in den Details eines Raums für diesen Raum akzeptieren."
	},
	remove: {
		en: "Remove",
		de: "Entfernen"
	},
	bulk_failing_one: {
		en: "%(count)s room fails this policy.",
		de: "%(count)s Raum verstößt gegen diese Richtlinie."
	},
	bulk_failing_other: {
		en: "%(count)s rooms fail this policy.",
		de: "%(count)s Räume verstoßen gegen diese Richtlinie."
	},
	bulk_fix: {
		en: "%(action)s in %(count)s rooms",
		de: "%(action)s in %(count)s Räumen"
	},
	bulk_skipped_one: {
		en: "%(count)s can't be fixed from here (you may not change it, or aren't in it).",
		de: "%(count)s lässt sich hier nicht beheben (du darfst ihn nicht ändern oder bist nicht drin)."
	},
	bulk_skipped_other: {
		en: "%(count)s can't be fixed from here (you may not change them, or aren't in them).",
		de: "%(count)s lassen sich hier nicht beheben (du darfst sie nicht ändern oder bist nicht drin)."
	},
	bulk_per_room: {
		en: "This one is fixed room by room: click a room.",
		de: "Das wird Raum für Raum behoben: Raum anklicken."
	},
	bulk_confirm: {
		en: "This changes these rooms:",
		de: "Das ändert diese Räume:"
	},
	bulk_go_one: {
		en: "Change %(count)s room",
		de: "%(count)s Raum ändern"
	},
	bulk_go_other: {
		en: "Change %(count)s rooms",
		de: "%(count)s Räume ändern"
	},
	bulk_running: {
		en: "Changing room %(done)s of %(count)s …",
		de: "Ändere Raum %(done)s von %(count)s …"
	},
	bulk_done: {
		en: "Changed %(ok)s of %(count)s rooms.",
		de: "%(ok)s von %(count)s Räumen geändert."
	},
	bulk_failed_room: {
		en: "%(room)s: %(error)s",
		de: "%(room)s: %(error)s"
	},
	in_subspace: {
		en: "In %(space)s",
		de: "In %(space)s"
	},
	passes: {
		en: "Passes",
		de: "Erfüllt"
	},
	severity_error: {
		en: "Error",
		de: "Fehler"
	},
	severity_warning: {
		en: "Warning",
		de: "Warnung"
	},
	no_power: {
		en: "You can't change this in this room.",
		de: "Du kannst das in diesem Raum nicht ändern."
	},
	no_fix: {
		en: "Fix this in the room's settings.",
		de: "Das lässt sich in den Raumeinstellungen beheben."
	},
	fix_failed: {
		en: "That didn't work: %(error)s",
		de: "Das hat nicht geklappt: %(error)s"
	},
	fix_done: {
		en: "Done, checking again …",
		de: "Erledigt, wird neu geprüft …"
	},
	save: {
		en: "Save",
		de: "Speichern"
	},
	cancel: {
		en: "Cancel",
		de: "Abbrechen"
	},
	fix_name: {
		en: "Rename",
		de: "Umbenennen"
	},
	fix_topic: {
		en: "Write a topic",
		de: "Thema schreiben"
	},
	fix_avatar: {
		en: "Upload a picture",
		de: "Bild hochladen"
	},
	fix_encryption: {
		en: "Turn on encryption",
		de: "Verschlüsselung einschalten"
	},
	fix_encryption_confirm: {
		en: "Encryption can't be turned off again. Turn it on?",
		de: "Verschlüsselung lässt sich nicht wieder ausschalten. Einschalten?"
	},
	fix_join_rule: {
		en: "Set to “%(value)s”",
		de: "Auf „%(value)s“ setzen"
	},
	fix_history_visibility: {
		en: "Set to “%(value)s”",
		de: "Auf „%(value)s“ setzen"
	},
	fix_guest_access: {
		en: "Turn off guest access",
		de: "Gastzugang ausschalten"
	},
	fix_address: {
		en: "Add an address",
		de: "Adresse hinzufügen"
	},
	fix_invite_power: {
		en: "Only power %(level)s+ may invite",
		de: "Einladen erst ab Stufe %(level)s"
	},
	fix_required_member: {
		en: "Invite %(user)s",
		de: "%(user)s einladen"
	},
	fix_space_parent: {
		en: "Link it to the space",
		de: "Mit dem Space verknüpfen"
	},
	policy_name: {
		en: "Name",
		de: "Name"
	},
	policy_name_desc: {
		en: "The room has a name of its own, optionally following a naming pattern.",
		de: "Der Raum hat einen eigenen Namen, wahlweise nach einem Namensmuster."
	},
	policy_topic: {
		en: "Topic",
		de: "Thema"
	},
	policy_topic_desc: {
		en: "The room has a topic that says what it's for.",
		de: "Der Raum hat ein Thema, das sagt, wofür er da ist."
	},
	policy_avatar: {
		en: "Picture",
		de: "Bild"
	},
	policy_avatar_desc: {
		en: "The room has a picture.",
		de: "Der Raum hat ein Bild."
	},
	policy_encryption: {
		en: "Encryption",
		de: "Verschlüsselung"
	},
	policy_encryption_desc: {
		en: "Messages are end-to-end encrypted.",
		de: "Nachrichten sind Ende-zu-Ende-verschlüsselt."
	},
	policy_join_rule: {
		en: "Who can join",
		de: "Wer beitreten kann"
	},
	policy_join_rule_desc: {
		en: "Only the allowed join rules.",
		de: "Nur die erlaubten Beitrittsregeln."
	},
	policy_history_visibility: {
		en: "History",
		de: "Verlauf"
	},
	policy_history_visibility_desc: {
		en: "Who can read the history: only the allowed settings.",
		de: "Wer den Verlauf lesen kann: nur die erlaubten Einstellungen."
	},
	policy_guest_access: {
		en: "No guests",
		de: "Keine Gäste"
	},
	policy_guest_access_desc: {
		en: "Guest accounts can't join.",
		de: "Gastkonten können nicht beitreten."
	},
	policy_address: {
		en: "Address",
		de: "Adresse"
	},
	policy_address_desc: {
		en: "The room has a main address (#name:server).",
		de: "Der Raum hat eine Hauptadresse (#name:server)."
	},
	policy_admins: {
		en: "Admins",
		de: "Admins"
	},
	policy_admins_desc: {
		en: "Enough joined admins, so the room isn't stuck when one leaves.",
		de: "Genug Admins im Raum, damit er nicht festhängt, wenn einer geht."
	},
	policy_space_parent: {
		en: "Belongs to the space",
		de: "Gehört zum Space"
	},
	policy_space_parent_desc: {
		en: "The room names the space as its parent, so it shows the space and space members can find it.",
		de: "Der Raum nennt den Space als übergeordneten Space, damit er ihn anzeigt und Space-Mitglieder ihn finden."
	},
	policy_room_version: {
		en: "Room version",
		de: "Raumversion"
	},
	policy_room_version_desc: {
		en: "The room runs on a recent room version (older ones lack fixes, e.g. for state resolution).",
		de: "Der Raum läuft auf einer aktuellen Raumversion (ältere haben z. B. Fehler bei der Zustandsauflösung)."
	},
	policy_inactive: {
		en: "Active",
		de: "Aktiv"
	},
	policy_inactive_desc: {
		en: "There's been a message within the last N days, so dead rooms show up.",
		de: "Es gab eine Nachricht in den letzten N Tagen, damit tote Räume auffallen."
	},
	policy_invite_power: {
		en: "Who can invite",
		de: "Wer einladen darf"
	},
	policy_invite_power_desc: {
		en: "Only people with at least this power level may invite others.",
		de: "Nur wer mindestens diese Berechtigungsstufe hat, darf andere einladen."
	},
	policy_required_member: {
		en: "Required member",
		de: "Pflichtmitglied"
	},
	policy_required_member_desc: {
		en: "Someone who must be in every room, such as a moderation bot.",
		de: "Jemand, der in jedem Raum sein muss, etwa ein Moderations-Bot."
	},
	check_name_missing: {
		en: "No name set",
		de: "Kein Name gesetzt"
	},
	check_name_pattern: {
		en: "Name doesn't match %(pattern)s",
		de: "Name passt nicht zu %(pattern)s"
	},
	check_topic_missing: {
		en: "No topic",
		de: "Kein Thema"
	},
	check_topic_short: {
		en: "Topic shorter than %(min)s characters",
		de: "Thema kürzer als %(min)s Zeichen"
	},
	check_avatar_missing: {
		en: "No picture",
		de: "Kein Bild"
	},
	check_encryption_off: {
		en: "Not encrypted",
		de: "Nicht verschlüsselt"
	},
	check_join_rule: {
		en: "Join rule is “%(value)s”",
		de: "Beitrittsregel ist „%(value)s“"
	},
	check_history_visibility: {
		en: "History visible to “%(value)s”",
		de: "Verlauf sichtbar für „%(value)s“"
	},
	check_guest_access: {
		en: "Guests can join",
		de: "Gäste können beitreten"
	},
	check_address_missing: {
		en: "No main address",
		de: "Keine Hauptadresse"
	},
	check_admins: {
		en: "Admins in the room: %(count)s, needed: %(min)s",
		de: "Admins im Raum: %(count)s, nötig: %(min)s"
	},
	check_room_version: {
		en: "Room version %(version)s, at least %(min)s wanted",
		de: "Raumversion %(version)s, mindestens %(min)s gewünscht"
	},
	check_inactive: {
		en: "No message for %(days)s days",
		de: "Seit %(days)s Tagen keine Nachricht"
	},
	check_invite_power: {
		en: "Power level %(level)s may invite, %(min)s wanted",
		de: "Stufe %(level)s darf einladen, %(min)s gewünscht"
	},
	check_required_member: {
		en: "%(user)s isn't in the room",
		de: "%(user)s ist nicht im Raum"
	},
	check_required_member_invited: {
		en: "%(user)s is invited, but hasn't joined yet",
		de: "%(user)s ist eingeladen, aber noch nicht beigetreten"
	},
	check_space_parent: {
		en: "Doesn't name the space as its parent",
		de: "Nennt den Space nicht als übergeordneten Space"
	},
	value_restricted: {
		en: "Space members",
		de: "Space-Mitglieder"
	},
	value_invite: {
		en: "Invite only",
		de: "Nur mit Einladung"
	},
	value_knock: {
		en: "Ask to join",
		de: "Beitritt anfragen"
	},
	value_knock_restricted: {
		en: "Space members or ask to join",
		de: "Space-Mitglieder oder Anfrage"
	},
	value_public: {
		en: "Anyone",
		de: "Alle"
	},
	value_joined: {
		en: "Members, since they joined",
		de: "Mitglieder, ab Beitritt"
	},
	value_invited: {
		en: "Members, since they were invited",
		de: "Mitglieder, ab Einladung"
	},
	value_shared: {
		en: "Members, all of it",
		de: "Mitglieder, vollständig"
	},
	value_world_readable: {
		en: "Anyone",
		de: "Alle"
	},
	policies_defaults: {
		en: "This space has no policies yet, so the defaults apply. Saving puts them in the space for everyone.",
		de: "Dieser Space hat noch keine Richtlinien, daher gelten die Standards. Speichern legt sie für alle im Space ab."
	},
	policies_saved: {
		en: "Last changed by %(user)s, %(when)s.",
		de: "Zuletzt geändert von %(user)s, %(when)s."
	},
	policies_readonly: {
		en: "Only people who may change this space's settings can change its policies.",
		de: "Nur wer die Einstellungen dieses Spaces ändern darf, kann seine Richtlinien ändern."
	},
	policies_scope: {
		en: "They apply to every room in the space and its sub-spaces.",
		de: "Sie gelten für jeden Raum im Space und in seinen Unter-Spaces."
	},
	enabled: {
		en: "On",
		de: "An"
	},
	severity: {
		en: "Severity",
		de: "Schwere"
	},
	param_pattern: {
		en: "Name pattern (regular expression, empty: any name)",
		de: "Namensmuster (regulärer Ausdruck, leer: jeder Name)"
	},
	param_pattern_invalid: {
		en: "Not a valid regular expression",
		de: "Kein gültiger regulärer Ausdruck"
	},
	param_min_length: {
		en: "At least this many characters",
		de: "Mindestens so viele Zeichen"
	},
	param_min: {
		en: "At least this many admins",
		de: "Mindestens so viele Admins"
	},
	param_allowed: {
		en: "Allowed",
		de: "Erlaubt"
	},
	param_allowed_fix: {
		en: "The quick fix sets the first allowed one.",
		de: "Die schnelle Korrektur setzt die erste erlaubte."
	},
	param_min_version: {
		en: "At least this room version",
		de: "Mindestens diese Raumversion"
	},
	param_days: {
		en: "Days without a message",
		de: "Tage ohne Nachricht"
	},
	param_level: {
		en: "Lowest power level that may invite",
		de: "Niedrigste Stufe, die einladen darf"
	},
	param_user: {
		en: "Matrix ID (empty: nobody)",
		de: "Matrix-ID (leer: niemand)"
	},
	param_user_invalid: {
		en: "Not a Matrix ID like @name:server",
		de: "Keine Matrix-ID wie @name:server"
	},
	policies_inherited: {
		en: "This space has no policies of its own, so its rooms use those of %(space)s. Saving gives it its own.",
		de: "Dieser Space hat keine eigenen Richtlinien, daher gelten für seine Räume die von %(space)s. Speichern gibt ihm eigene."
	},
	policies_own_below: {
		en: "These sub-spaces have policies of their own, which apply to their rooms instead: %(spaces)s",
		de: "Diese Unter-Spaces haben eigene Richtlinien, die stattdessen für ihre Räume gelten: %(spaces)s"
	},
	rules_from: {
		en: "Checked against the policies of %(space)s",
		de: "Geprüft nach den Richtlinien von %(space)s"
	},
	filter_new: {
		en: "New failures (%(count)s)",
		de: "Neue Verstöße (%(count)s)"
	},
	since: {
		en: "Failing now, but not on your last visit (%(when)s)",
		de: "Jetzt mit Verstößen, beim letzten Besuch (%(when)s) noch nicht"
	},
	trend: {
		en: "Pass rate %(from)s → %(to)s since %(since)s",
		de: "Erfüllt %(from)s → %(to)s seit %(since)s"
	},
	report_csv: {
		en: "Download CSV",
		de: "CSV herunterladen"
	},
	report_markdown: {
		en: "Copy as Markdown",
		de: "Als Markdown kopieren"
	},
	report_copied: {
		en: "Copied",
		de: "Kopiert"
	},
	report_copy_failed: {
		en: "Couldn't copy",
		de: "Kopieren ging nicht"
	},
	report_title: {
		en: "Room check: %(space)s, %(date)s",
		de: "Raumprüfung: %(space)s, %(date)s"
	},
	report_all_pass: {
		en: "Every room passes.",
		de: "Alle Räume erfüllen die Richtlinien."
	},
	badge: {
		en: "%(count)s room policy failures (%(space)s): open the room checker",
		de: "%(count)s Verstöße gegen Raumrichtlinien (%(space)s): Raumprüfung öffnen"
	},
	save_policies: {
		en: "Save to the space",
		de: "Im Space speichern"
	},
	discard: {
		en: "Discard changes",
		de: "Änderungen verwerfen"
	},
	saving: {
		en: "Saving …",
		de: "Wird gespeichert …"
	},
	saved: {
		en: "Saved",
		de: "Gespeichert"
	}
}).map(([e, t]) => [`${c}${e}`, t])), u = "de.datanauten.room_checker.policies", d = [
	"name",
	"topic",
	"avatar",
	"encryption",
	"join_rule",
	"history_visibility",
	"guest_access",
	"address",
	"admins",
	"space_parent",
	"room_version",
	"inactive",
	"invite_power",
	"required_member"
], f = {
	join_rule: [
		"restricted",
		"invite",
		"knock",
		"knock_restricted",
		"public"
	],
	history_visibility: [
		"joined",
		"invited",
		"shared",
		"world_readable"
	]
}, p = {
	name: {
		enabled: !0,
		severity: "error",
		pattern: ""
	},
	topic: {
		enabled: !0,
		severity: "warning",
		minLength: 10
	},
	avatar: {
		enabled: !0,
		severity: "warning"
	},
	encryption: {
		enabled: !0,
		severity: "error"
	},
	join_rule: {
		enabled: !0,
		severity: "error",
		allowed: [
			"restricted",
			"invite",
			"knock_restricted"
		]
	},
	history_visibility: {
		enabled: !0,
		severity: "warning",
		allowed: [
			"joined",
			"invited",
			"shared"
		]
	},
	guest_access: {
		enabled: !0,
		severity: "error"
	},
	address: {
		enabled: !1,
		severity: "warning"
	},
	admins: {
		enabled: !0,
		severity: "warning",
		min: 2
	},
	space_parent: {
		enabled: !0,
		severity: "warning"
	},
	room_version: {
		enabled: !1,
		severity: "warning",
		minVersion: 10
	},
	inactive: {
		enabled: !1,
		severity: "warning",
		days: 180
	},
	invite_power: {
		enabled: !1,
		severity: "warning",
		level: 50
	},
	required_member: {
		enabled: !1,
		severity: "error",
		user: ""
	}
};
function m(e) {
	let t = (e && typeof e == "object" ? e.policies : void 0) ?? {}, n = {};
	for (let e of d) {
		let r = p[e], i = t[e], a = i && typeof i == "object" ? i : {}, o = {
			enabled: typeof a.enabled == "boolean" ? a.enabled : r.enabled,
			severity: a.severity === "error" || a.severity === "warning" ? a.severity : r.severity
		};
		if (r.pattern !== void 0 && (o.pattern = typeof a.pattern == "string" && y(a.pattern) ? a.pattern : r.pattern), r.minLength !== void 0 && (o.minLength = b(a.minLength, 0, 1e3) ?? r.minLength), r.min !== void 0 && (o.min = b(a.min, 0, 100) ?? r.min), r.minVersion !== void 0 && (o.minVersion = b(a.minVersion, 1, 1e3) ?? r.minVersion), r.days !== void 0 && (o.days = b(a.days, 1, 3650) ?? r.days), r.level !== void 0 && (o.level = b(a.level, 0, 100) ?? r.level), r.user !== void 0 && (o.user = typeof a.user == "string" && (a.user === "" || v(a.user)) ? a.user : r.user), r.allowed !== void 0) {
			let t = f[e] ?? [], n = Array.isArray(a.allowed) ? t.filter((e) => a.allowed.includes(e)) : void 0;
			o.allowed = n?.length ? n : r.allowed;
		}
		n[e] = o;
	}
	return n;
}
function h(e) {
	let t = e && typeof e == "object" ? e.exceptions : void 0, n = {};
	if (!t || typeof t != "object") return n;
	for (let [e, r] of Object.entries(t)) if (e.startsWith("!") && r && typeof r == "object") for (let t of d) {
		let i = r[t];
		i && typeof i == "object" && typeof i.reason == "string" && typeof i.by == "string" && typeof i.at == "number" && ((n[e] ??= {})[t] = {
			reason: i.reason,
			by: i.by,
			at: i.at
		});
	}
	return n;
}
function g(e, t) {
	return {
		version: 1,
		policies: e,
		exceptions: t
	};
}
function _(e, t, n, r) {
	let i = { ...e[t] };
	r ? i[n] = r : delete i[n];
	let a = {
		...e,
		[t]: i
	};
	return Object.keys(i).length || delete a[t], a;
}
function v(e) {
	return /^@[^:\s]+:[^\s]+$/.test(e);
}
function y(e) {
	try {
		return new RegExp(e, "u"), !0;
	} catch {
		return !1;
	}
}
function b(e, t, n) {
	return typeof e == "number" && Number.isInteger(e) && e >= t && e <= n ? e : void 0;
}
var x = { status: "pass" }, S = 100;
function C(e, t, n, r = Date.now()) {
	let i = (e, t) => ({
		status: "fail",
		detail: {
			key: e,
			vars: t
		}
	});
	switch (e) {
		case "name": {
			let e = String(t.state("m.room.name")?.name ?? "").trim();
			return e ? n.pattern && !new RegExp(n.pattern, "u").test(e) ? i("name_pattern", { pattern: n.pattern }) : x : i("name_missing");
		}
		case "topic": {
			let e = w(t.state("m.room.topic"));
			if (!e) return i("topic_missing");
			let r = n.minLength ?? 0;
			return Array.from(e).length < r ? i("topic_short", { min: String(r) }) : x;
		}
		case "avatar": return t.state("m.room.avatar")?.url ? x : i("avatar_missing");
		case "encryption": return t.state("m.room.encryption")?.algorithm ? x : i("encryption_off");
		case "join_rule": {
			let e = String(t.state("m.room.join_rules")?.join_rule ?? "invite");
			return n.allowed?.includes(e) ? x : i("join_rule", { value: e });
		}
		case "history_visibility": {
			let e = String(t.state("m.room.history_visibility")?.history_visibility ?? "shared");
			return n.allowed?.includes(e) ? x : i("history_visibility", { value: e });
		}
		case "guest_access": return t.state("m.room.guest_access")?.guest_access === "can_join" ? i("guest_access") : x;
		case "address": return t.state("m.room.canonical_alias")?.alias ? x : i("address_missing");
		case "admins": {
			let e = T(t).length, r = n.min ?? 1;
			return e >= r ? x : i("admins", {
				count: String(e),
				min: String(r)
			});
		}
		case "space_parent": {
			let e = t.state("m.space.parent", t.parentSpace)?.via;
			return Array.isArray(e) && e.length ? x : i("space_parent");
		}
		case "room_version": {
			let e = String(t.state("m.room.create")?.room_version ?? "1"), r = n.minVersion ?? 1;
			return /^\d+$/.test(e) ? Number(e) >= r ? x : i("room_version", {
				version: e,
				min: String(r)
			}) : { status: "unknown" };
		}
		case "inactive": {
			if (t.lastActive === void 0) return { status: "unknown" };
			let e = Math.floor((r - t.lastActive) / 864e5);
			return e <= (n.days ?? 180) ? x : i("inactive", { days: String(e) });
		}
		case "invite_power": {
			let e = Number(t.state("m.room.power_levels")?.invite ?? 0);
			return e >= (n.level ?? 0) ? x : i("invite_power", {
				level: String(e),
				min: String(n.level ?? 0)
			});
		}
		case "required_member": {
			if (!n.user) return x;
			let e = t.state("m.room.member", n.user)?.membership;
			return e === "join" ? x : i(e === "invite" ? "required_member_invited" : "required_member", { user: n.user });
		}
	}
}
function w(e) {
	if (!e) return "";
	if (typeof e.topic == "string" && e.topic.trim()) return e.topic.trim();
	let t = e["m.topic"]?.["m.text"], n = t?.find((e) => !e.mimetype || e.mimetype === "text/plain") ?? t?.[0];
	return typeof n?.body == "string" ? n.body.trim() : "";
}
function T(e) {
	let t = e.state("m.room.power_levels")?.users ?? {}, n = new Set(e.creators ?? []);
	for (let [e, r] of Object.entries(t)) typeof r == "number" && r >= S && n.add(e);
	return [...n].filter((t) => e.state("m.room.member", t)?.membership === "join");
}
function E(e, t, n) {
	return !/^\d+$/.test(String(e ?? "1")) || Number(e) < 12 || !t ? [] : [t, ...Array.isArray(n) ? n.filter((e) => typeof e == "string") : []];
}
function D(e, t, n = {}) {
	let r = /* @__PURE__ */ new Map(), i = {
		results: r,
		errors: 0,
		warnings: 0,
		unknown: 0
	};
	for (let a of d) {
		let o = t[a];
		if (!o.enabled) continue;
		let s = e.unknown?.(a, o) ? { status: "unknown" } : C(a, e, o), c = n[e.id]?.[a];
		s.status === "fail" && c && (s = {
			...s,
			status: "excepted",
			exception: c
		}), r.set(a, s), s.status === "unknown" ? i.unknown++ : s.status === "fail" && i[o.severity === "error" ? "errors" : "warnings"]++;
	}
	return i;
}
// src/space.ts
function O() {
	let e = window.mxMatrixClientPeg;
	try {
		return e?.get?.() ?? void 0;
	} catch {
		return;
	}
}
function k(e) {
	let t = e.getVisibleRooms().filter((e) => e.isSpaceRoom() && e.getMyMembership() === "join"), n = new Set(t.map((e) => e.roomId)), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
	for (let e of t) {
		let t = e.currentState.getStateEvents("m.space.child").filter((e) => Array.isArray(e.getContent().via) && e.getContent().via.length).map((e) => e.getStateKey()).filter((t) => n.has(t) && t !== e.roomId);
		r.set(e.roomId, t), t.forEach((e) => i.add(e));
	}
	let a = (t) => e.getRoom(t)?.name || t, o = (e, t) => a(e).localeCompare(a(t)), s = [], c = /* @__PURE__ */ new Set(), l = (e, t, n) => {
		if (!c.has(e)) {
			c.add(e), s.push({
				id: e,
				name: a(e),
				depth: t,
				parent: n
			});
			for (let n of [...r.get(e) ?? []].sort(o)) l(n, t + 1, e);
		}
	};
	for (let e of [...n].filter((e) => !i.has(e)).sort(o)) l(e, 0);
	for (let e of [...n].sort(o)) l(e, 0);
	return s;
}
function A(e, t) {
	let n = e.getRoom(t), r = n?.currentState.getStateEvents(u, ""), i = r?.getContent(), a = !!(i && Object.keys(i).length), o = e.getUserId() ?? "";
	return {
		policies: m(a ? i : void 0),
		exceptions: h(i),
		saved: a,
		by: a ? r?.getSender?.() : void 0,
		at: a ? r?.getTs?.() : void 0,
		canEdit: !!n?.currentState.maySendStateEvent(u, o)
	};
}
function ee(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	for (let i = t; i && !r.has(i); i = n.find((e) => e.id === i)?.parent) {
		r.add(i);
		let t = A(e, i);
		if (t.saved) return {
			source: i,
			policies: t.policies,
			exceptions: t.exceptions
		};
	}
	let i = A(e, t);
	return {
		source: t,
		policies: i.policies,
		exceptions: i.exceptions
	};
}
function te(e, t, n) {
	let r = A(e, t);
	return e.sendStateEvent(t, u, g(n, r.exceptions), "");
}
function j(e, t, n, r, i) {
	let a = A(e, t), o = i === void 0 ? void 0 : {
		reason: i,
		by: e.getUserId() ?? "",
		at: Date.now()
	};
	return e.sendStateEvent(t, u, g(a.policies, _(a.exceptions, n, r, o)), "");
}
function ne(e, t, n, r = /* @__PURE__ */ new Map()) {
	let i = [], a = /* @__PURE__ */ new Set([t]), o = [{
		sid: t,
		rules: n
	}];
	for (; o.length;) {
		let { sid: t, rules: n } = o.shift();
		for (let s of re(e, t, r)) {
			if (a.has(s)) continue;
			a.add(s);
			let c = e.getRoom(s), l = c && c.getMyMembership() === "join" ? c : void 0, u = r.get(s);
			if (l ? l.isSpaceRoom() : u?.room_type === "m.space") {
				let t = l ? A(e, s) : void 0;
				o.push({
					sid: s,
					rules: t?.saved ? {
						source: s,
						policies: t.policies,
						exceptions: t.exceptions
					} : n
				});
				continue;
			}
			let d = {
				id: s,
				name: l?.name || u?.name || u?.canonical_alias || s,
				parentSpace: t,
				policySpace: n.source,
				policies: n.policies,
				room: l
			}, f = l ? le(l, t) : u ? ce(u, t) : void 0;
			f && (d.report = D(f, n.policies, n.exceptions)), i.push(d);
		}
	}
	return i;
}
function re(e, t, n) {
	let r = e.getRoom(t);
	return (r && r.getMyMembership() === "join" ? r.currentState.getStateEvents("m.space.child").map((e) => ({
		state_key: e.getStateKey(),
		content: e.getContent()
	})) : n.get(t)?.children_state ?? []).filter((e) => e.state_key && Array.isArray(e.content?.via) && e.content.via.length).map((e) => e.state_key);
}
var ie = 20;
async function ae(e, t) {
	let n = /* @__PURE__ */ new Map(), r;
	try {
		for (let i = 0; i < ie && e.getRoomHierarchy; i++) {
			let i = await e.getRoomHierarchy(t, 100, void 0, !1, r);
			for (let e of i.rooms ?? []) n.set(e.room_id, e);
			if (r = i.next_batch, !r) break;
		}
	} catch {}
	return n;
}
var oe = /* @__PURE__ */ new Set([
	"admins",
	"space_parent",
	"inactive",
	"invite_power",
	"required_member"
]), se = [
	"joined",
	"invited",
	"shared"
];
function ce(e, t) {
	let n = e.encryption ?? e["im.nheko.summary.encryption"], r = n !== void 0 || e.room_version !== void 0, i = {
		"m.room.name": e.name ? { name: e.name } : void 0,
		"m.room.topic": e.topic ? { topic: e.topic } : void 0,
		"m.room.avatar": e.avatar_url ? { url: e.avatar_url } : void 0,
		"m.room.canonical_alias": e.canonical_alias ? { alias: e.canonical_alias } : void 0,
		"m.room.join_rules": e.join_rule ? { join_rule: e.join_rule } : void 0,
		"m.room.encryption": n ? { algorithm: n } : void 0,
		"m.room.guest_access": { guest_access: e.guest_can_join ? "can_join" : "forbidden" },
		"m.room.create": e.room_version ? { room_version: e.room_version } : void 0,
		"m.room.history_visibility": { history_visibility: e.world_readable ? "world_readable" : "shared" }
	};
	return {
		id: e.room_id,
		parentSpace: t,
		state: (e, t = "") => t ? void 0 : i[e],
		unknown: (t, n) => oe.has(t) || t === "encryption" && !r || t === "join_rule" && !e.join_rule || t === "room_version" && !e.room_version || t === "history_visibility" && !e.world_readable && !se.every((e) => n.allowed?.includes(e))
	};
}
function le(e, t) {
	let n = e.currentState.getStateEvents("m.room.create", ""), r = n?.getContent() ?? {};
	return {
		id: e.roomId,
		parentSpace: t,
		creators: E(r.room_version, n?.getSender?.(), r.additional_creators),
		lastActive: e.getLastActiveTimestamp?.(),
		state: (t, n = "") => {
			let r = e.currentState.getStateEvents(t, n)?.getContent();
			return r && Object.keys(r).length ? r : void 0;
		}
	};
}
function ue(e) {
	return w(e.currentState.getStateEvents("m.room.topic", "")?.getContent());
}
var M = {
	name: "m.room.name",
	topic: "m.room.topic",
	avatar: "m.room.avatar",
	encryption: "m.room.encryption",
	join_rule: "m.room.join_rules",
	history_visibility: "m.room.history_visibility",
	guest_access: "m.room.guest_access",
	address: "m.room.canonical_alias",
	space_parent: "m.space.parent",
	invite_power: "m.room.power_levels",
	required_member: "m.room.member"
}, N = {
	name: "text",
	topic: "text",
	avatar: "file",
	address: "text"
};
function P(e, t, n) {
	let r = M[n], i = e.getUserId();
	return !r || !i || !t.room ? !1 : n === "required_member" ? !!e.invite && de(t.room, i) >= Number(F(t.room).invite ?? 0) : t.room.currentState.maySendStateEvent(r, i);
}
function F(e) {
	return e.currentState.getStateEvents("m.room.power_levels", "")?.getContent() ?? {};
}
function de(e, t) {
	let n = e.currentState.getStateEvents("m.room.create", ""), r = n?.getContent() ?? {};
	if (E(r.room_version, n?.getSender?.(), r.additional_creators).includes(t)) return Infinity;
	let i = F(e), a = i.users ?? {};
	return Number(a[t] ?? i.users_default ?? 0);
}
function I(e, t) {
	return e === "join_rule" || e === "history_visibility" ? t.allowed?.[0] : void 0;
}
function L(e) {
	return e.slice(e.indexOf(":") + 1);
}
async function R(e, t, n, r, i) {
	let a = t.id, o = typeof i == "string" ? i.trim() : "", s = (t, n, r = "") => e.sendStateEvent(a, t, n, r);
	switch (n) {
		case "name":
			await s("m.room.name", { name: o });
			return;
		case "topic":
			e.setRoomTopic ? await e.setRoomTopic(a, o) : await s("m.room.topic", {
				topic: o,
				"m.topic": { "m.text": [{
					body: o,
					mimetype: "text/plain"
				}] }
			});
			return;
		case "avatar": {
			if (!(i instanceof File)) throw Error("no picture");
			let { content_uri: t } = await e.uploadContent(i);
			await s("m.room.avatar", { url: t });
			return;
		}
		case "encryption":
			await s("m.room.encryption", { algorithm: "m.megolm.v1.aes-sha2" });
			return;
		case "join_rule": {
			let e = I(n, r), i = { join_rule: e };
			(e === "restricted" || e === "knock_restricted") && (i.allow = [{
				type: "m.room_membership",
				room_id: t.parentSpace
			}]), await s("m.room.join_rules", i);
			return;
		}
		case "history_visibility":
			await s("m.room.history_visibility", { history_visibility: I(n, r) });
			return;
		case "guest_access":
			await s("m.room.guest_access", { guest_access: "forbidden" });
			return;
		case "address": {
			let n = e.getDomain?.() ?? L(e.getUserId() ?? ""), r = `#${o.replace(/^#/, "").replace(/:.*$/, "")}:${n}`;
			await e.createAlias(r, a), await s("m.room.canonical_alias", {
				...t.room?.currentState.getStateEvents("m.room.canonical_alias", "")?.getContent() ?? {},
				alias: r
			});
			return;
		}
		case "space_parent":
			await s("m.space.parent", {
				via: [L(t.parentSpace)],
				canonical: !0
			}, t.parentSpace);
			return;
		case "invite_power":
			await s("m.room.power_levels", {
				...t.room ? F(t.room) : {},
				invite: r.level ?? 50
			});
			return;
		case "required_member":
			if (!r.user || !e.invite) throw Error("nobody to invite");
			await e.invite(a, r.user);
			return;
		case "admins":
		case "room_version":
		case "inactive": throw Error("can't be fixed here");
	}
}
function fe(e) {
	return e.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9._=-]+/g, "-").replace(/^-+|-+$/g, "");
}
// src/trigger.ts
var z = typeof navigator < "u" && navigator.platform.toUpperCase().includes("MAC");
function B(e, t = z) {
	let n = e.split("+").map((e) => e.trim()), r = n.pop();
	if (!r) throw Error(`Invalid key combo "${e}"`);
	let i = {
		key: r.length === 1 ? r.toLowerCase() : r,
		ctrl: !1,
		meta: !1,
		alt: !1,
		shift: !1
	};
	for (let r of n.map((e) => e.toLowerCase())) if (r === "mod") i[t ? "meta" : "ctrl"] = !0;
	else if (r === "ctrl" || r === "control") i.ctrl = !0;
	else if (r === "meta" || r === "cmd" || r === "command") i.meta = !0;
	else if (r === "alt" || r === "option") i.alt = !0;
	else if (r === "shift") i.shift = !0;
	else throw Error(`Unknown modifier "${r}" in "${e}"`);
	return i;
}
function pe(e, t) {
	let n = e.key.length === 1 ? e.key.toLowerCase() : e.key, r = /^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : void 0;
	return (n === t.key || !/^[a-z]$/.test(n) && r === t.key) && e.ctrlKey === t.ctrl && e.metaKey === t.meta && e.altKey === t.alt && e.shiftKey === t.shift;
}
function me(e, t = z) {
	let n = [
		e.ctrl && (t ? "⌃" : "Ctrl"),
		e.alt && (t ? "⌥" : "Alt"),
		e.shift && (t ? "⇧" : "Shift"),
		e.meta && (t ? "⌘" : "Meta")
	], r = e.key.length === 1 ? e.key.toUpperCase() : e.key;
	return [...n.filter(Boolean), r].join(t ? "" : "+");
}
// src/ui/checker.css?inline
var he = ".de-datanauten-room-checker{--rc-error:var(--cpd-color-icon-critical-primary,#d51928);--rc-error-bg:var(--cpd-color-bg-critical-subtle,#fff0f0);--rc-warning:var(--cpd-color-orange-900,#bc4500);--rc-warning-bg:var(--cpd-color-orange-300,#ffefe4);--rc-pass:var(--cpd-color-icon-success-primary,#007a62);--rc-pass-bg:var(--cpd-color-bg-success-subtle,#e0f8d9);--rc-line:var(--cpd-color-border-interactive-secondary,#e1e6ec);--rc-muted:var(--cpd-color-text-secondary,#656d77);--rc-subtle:var(--cpd-color-bg-subtle-secondary,#f0f2f5);--rc-focus:var(--cpd-color-border-focused,#0467dd)}.rc-backdrop{z-index:5000;font-family:var(--cpd-font-family-sans,Inter, system-ui, sans-serif);background:#0000008c;justify-content:center;align-items:center;padding:3vh 3vw;animation:.1s ease-out rc-fade;display:flex;position:fixed;inset:0}@keyframes rc-fade{0%{opacity:0}}.rc-panel{background:var(--cpd-color-bg-canvas-default,#fff);width:100%;max-width:1440px;height:100%;color:var(--cpd-color-text-primary,#1b1d22);border-radius:16px;outline:none;flex-direction:column;display:flex;overflow:hidden;box-shadow:0 24px 64px #00000059}.rc-panel :focus-visible{outline:2px solid var(--rc-focus);outline-offset:1px}.rc-header{border-bottom:1px solid var(--rc-line);flex-wrap:wrap;align-items:center;gap:12px 20px;padding:12px 16px;display:flex}.rc-title{margin:0;font-size:18px;font-weight:600;line-height:24px}.rc-space{color:var(--rc-muted);align-items:center;gap:8px;font-size:13px;display:flex}.rc-panel select,.rc-panel input:not([type=checkbox]),.rc-panel textarea{box-sizing:border-box;border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;border-radius:6px;padding:5px 8px;font-size:14px}.rc-space select{max-width:280px;font-weight:600}.rc-tabs{flex:1;gap:4px;display:flex}.rc-tab{color:var(--rc-muted);font:inherit;cursor:pointer;background:0 0;border:none;border-radius:999px;padding:6px 14px;font-size:14px;font-weight:600}.rc-tab:hover{background:var(--rc-subtle)}.rc-tab[aria-selected=true]{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff)}.rc-close{width:36px;height:36px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:none;border-radius:50%;font-size:24px;line-height:1}.rc-close:hover{background:var(--rc-subtle);color:inherit}.rc-body{flex-direction:column;flex:1;min-height:0;display:flex}.rc-footer{border-top:1px solid var(--rc-line);color:var(--rc-muted);align-items:center;gap:12px;padding:8px 16px;font-size:12px;display:flex}.rc-footer>span{flex:1}.rc-footer>.rc-version{opacity:.7;font-variant-numeric:tabular-nums;flex:none}.rc-empty{color:var(--rc-muted);text-align:center;padding:48px 16px}.rc-rooms{flex:1;min-height:0;display:flex}.rc-main{flex-direction:column;flex:1;min-width:0;display:flex;overflow-y:auto}.rc-summary{border-bottom:1px solid var(--rc-line);grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px 32px;padding:16px;display:grid}.rc-stats{flex-wrap:wrap;align-content:start;gap:8px;display:flex}.rc-stat{border:1px solid var(--rc-line);min-width:96px;color:inherit;font:inherit;text-align:left;background:0 0;border-radius:12px;flex-direction:column;padding:10px 14px;display:flex}button.rc-stat{cursor:pointer}button.rc-stat:hover{background:var(--rc-subtle)}.rc-stat[aria-pressed=true]{border-color:var(--rc-focus);box-shadow:inset 0 0 0 1px var(--rc-focus)}.rc-stat-value{font-variant-numeric:tabular-nums;font-size:24px;font-weight:700;line-height:30px}.rc-stat-label{color:var(--rc-muted);font-size:12px}.rc-stat--error .rc-stat-value{color:var(--rc-error)}.rc-stat--warning .rc-stat-value{color:var(--rc-warning)}.rc-stat--pass .rc-stat-value{color:var(--rc-pass)}.rc-stat--unchecked .rc-stat-value{color:var(--rc-muted)}.rc-compliance{grid-column:1;align-items:center;gap:10px;font-size:13px;display:flex}.rc-meter,.rc-bar-track{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);border-radius:4px;height:8px;display:block;overflow:hidden}.rc-meter{flex:none;width:160px}.rc-meter>span,.rc-bar-track>span{border-radius:4px;height:100%;display:block}.rc-meter>span{background:var(--rc-pass)}.rc-section-title{color:var(--rc-muted);letter-spacing:.04em;text-transform:uppercase;grid-area:1/2;font-size:12px;font-weight:600}.rc-bars{flex-direction:column;grid-area:1/2/span 3;gap:2px;margin-top:22px;display:flex}.rc-bar{color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:none;border-radius:6px;grid-template-columns:150px 1fr 32px;align-items:center;gap:10px;padding:3px 6px;font-size:13px;display:grid}.rc-bar:hover:not(:disabled){background:var(--rc-subtle)}.rc-bar:disabled{cursor:default;opacity:.55}.rc-bar[aria-pressed=true]{background:var(--cpd-color-bg-action-secondary-hovered,#f0f2f5);box-shadow:inset 3px 0 0 var(--rc-focus)}.rc-bar--error .rc-bar-track>span{background:var(--rc-error)}.rc-bar--warning .rc-bar-track>span{background:var(--rc-warning)}.rc-bar-count{text-align:right;font-variant-numeric:tabular-nums}.rc-toolbar{flex-wrap:wrap;align-items:center;gap:8px 12px;padding:12px 16px 8px;display:flex}.rc-panel .rc-search{width:240px;height:32px}.rc-chips{flex-wrap:wrap;gap:6px;display:flex}.rc-chip{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);color:inherit;font:inherit;cursor:pointer;background:0 0;border-radius:999px;padding:4px 12px;font-size:13px}.rc-chip[aria-pressed=true]{border-color:var(--cpd-color-bg-action-primary-rest,#1b1d22);background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff)}.rc-table-wrap{padding:0 16px 16px;overflow-x:auto}.rc-table{border-collapse:separate;border-spacing:0;width:100%;font-size:14px}.rc-table thead th{z-index:1;border-bottom:1px solid var(--rc-line);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--rc-muted);vertical-align:bottom;padding:8px 4px;font-size:12px;font-weight:600;position:sticky;top:0}.rc-col-room{text-align:left;min-width:200px}.rc-col-policy{text-align:center;width:72px}.rc-col-policy>span{line-height:14px;display:block}.rc-row{cursor:pointer}.rc-row>*{border-bottom:1px solid var(--rc-line);padding:6px 4px}.rc-row:hover>*{background:var(--rc-subtle)}.rc-row[aria-selected=true]>*{background:var(--cpd-color-bg-action-secondary-hovered,#f0f2f5)}.rc-row[aria-selected=true]>:first-child{box-shadow:inset 3px 0 0 var(--rc-focus)}.rc-row>th{padding-left:8px;font-weight:400}.rc-room-name,.rc-room-meta{white-space:nowrap;text-overflow:ellipsis;max-width:360px;display:block;overflow:hidden}.rc-room-name{font-weight:600}.rc-room-meta{color:var(--rc-muted);font-size:12px}.rc-cell{text-align:center}.rc-status{border-radius:50%;flex:none;justify-content:center;align-items:center;width:22px;height:22px;font-size:13px;font-weight:700;line-height:1;display:inline-flex}.rc-status--pass{background:var(--rc-pass-bg);color:var(--rc-pass)}.rc-status--error{background:var(--rc-error);color:var(--cpd-color-text-on-solid-primary,#fff)}.rc-status--warning{background:var(--rc-warning-bg);color:var(--rc-warning);box-shadow:inset 0 0 0 1.5px var(--rc-warning)}.rc-detail{border-left:1px solid var(--rc-line);flex-direction:column;flex:none;gap:6px;width:380px;padding:12px 16px 16px;display:flex;overflow-y:auto}.rc-back{color:var(--rc-muted);font:inherit;cursor:pointer;background:0 0;border:none;align-self:flex-start;padding:2px 4px;font-size:13px;font-weight:600}.rc-detail-name{overflow-wrap:anywhere;font-size:18px;font-weight:600}.rc-detail-id{color:var(--rc-muted);overflow-wrap:anywhere;font-size:12px}.rc-actions,.rc-fix-buttons{flex-wrap:wrap;gap:8px;margin:6px 0;display:flex}.rc-button{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;border-radius:999px;padding:5px 14px;font-size:13px;font-weight:600}.rc-button:disabled{cursor:default;opacity:.5}.rc-button--primary{border-color:var(--cpd-color-bg-action-primary-rest,#1b1d22);background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff)}.rc-checks{flex-direction:column;margin:4px 0 0;padding:0;list-style:none;display:flex}.rc-check{border-top:1px solid var(--rc-line);gap:10px;padding:10px 0;display:flex}.rc-check-body{flex:1;min-width:0}.rc-check-name{align-items:center;gap:8px;font-size:14px;font-weight:600;display:flex}.rc-check-detail{color:var(--rc-muted);font-size:13px}.rc-tag{border-radius:999px;padding:0 7px;font-size:11px;font-weight:600}.rc-tag--error{background:var(--rc-error-bg);color:var(--rc-error)}.rc-tag--warning{background:var(--rc-warning-bg);color:var(--rc-warning)}.rc-fix{margin-top:6px}.rc-fix-form{flex-direction:column;gap:6px;margin-top:6px;display:flex}.rc-fix-form input,.rc-fix-form textarea{width:100%}.rc-note{color:var(--rc-muted);margin:4px 0 0;font-size:12px}.rc-note--error{color:var(--rc-error)}.rc-note--ok{color:var(--rc-pass)}.rc-policies{flex-direction:column;flex:1;min-height:0;display:flex}.rc-policies-intro{padding:12px 16px 0;font-size:14px}.rc-policies-intro p{margin:0 0 6px}.rc-policies-scroll{flex:1;min-height:0;overflow-y:auto}.rc-policy-list{grid-template-columns:repeat(auto-fill,minmax(320px,1fr));align-content:start;gap:12px;margin:0;padding:12px 16px 16px;list-style:none;display:grid}.rc-policy{border:1px solid var(--rc-line);border-radius:12px;flex-direction:column;gap:8px;padding:12px 14px;display:flex}.rc-policy[data-enabled=false]{background:var(--rc-subtle)}.rc-policy[data-enabled=false] .rc-policy-desc{opacity:.7}.rc-switch{cursor:pointer;align-items:center;gap:10px;display:flex}.rc-switch input{width:18px;height:18px;accent-color:var(--cpd-color-bg-action-primary-rest,#1b1d22);margin:0}.rc-policy-name{font-size:15px;font-weight:600}.rc-policy-desc{color:var(--rc-muted);margin:0;font-size:13px}.rc-field{border:none;flex-direction:column;gap:4px;margin:0;padding:0;font-size:13px;display:flex}.rc-field>span:first-child,.rc-field>legend{color:var(--rc-muted);font-size:12px}.rc-field--inline{flex-direction:row;justify-content:space-between;align-items:center}.rc-panel .rc-field--inline input{width:72px}.rc-field input[aria-invalid=true]{border-color:var(--rc-error)}.rc-options{flex-wrap:wrap;gap:4px 14px;display:flex}.rc-option{align-items:center;gap:6px;display:flex}.rc-hint{color:var(--rc-muted);font-size:11px}.rc-savebar{border-top:1px solid var(--rc-line);justify-content:flex-end;align-items:center;gap:10px;padding:10px 16px;display:flex}@media (width<=900px){.rc-summary{grid-template-columns:1fr}.rc-section-title,.rc-bars{grid-area:auto/1;margin-top:0}.rc-detail{width:300px}}@media (width<=640px){.rc-backdrop{padding:0}.rc-panel{border-radius:0}.rc-rooms--detail .rc-main{display:none}.rc-detail{border-left:none;flex:1;width:auto}}@media (prefers-reduced-motion:reduce){.rc-backdrop{animation:none}}.rc-status--excepted{color:var(--rc-muted);box-shadow:inset 0 0 0 1.5px var(--rc-muted);opacity:.8}.rc-status--unknown{color:var(--rc-muted);font-weight:600}.rc-status--none{color:var(--rc-muted)}.rc-tag--excepted{background:var(--rc-subtle);color:var(--rc-muted)}.rc-excepted-count{color:var(--rc-muted)}.rc-link{color:var(--cpd-color-text-link-external,#0467dd);font:inherit;cursor:pointer;background:0 0;border:none;align-self:flex-start;margin-top:4px;padding:0;font-size:12px;font-weight:600}.rc-link:disabled{cursor:default;opacity:.5}.rc-exception{flex-direction:column;margin-top:4px;display:flex}.rc-exception-reason{font-size:13px;font-style:italic}.rc-bulk{background:var(--rc-subtle);border-radius:12px;flex-wrap:wrap;align-items:center;gap:6px 12px;margin:0 16px 8px;padding:10px 14px;font-size:13px;display:flex}.rc-bulk .rc-note,.rc-bulk .rc-fix-buttons{margin:0}.rc-bulk-list{flex-basis:100%;max-height:160px;margin:0;padding-left:20px;overflow-y:auto}.rc-exceptions{flex-direction:column;gap:8px;padding:0 16px 16px;display:flex}.rc-exception-list{flex-direction:column;margin:0;padding:0;list-style:none;display:flex}.rc-exception-list>li{border-top:1px solid var(--rc-line);flex-wrap:wrap;align-items:baseline;gap:4px 12px;padding:8px 0;font-size:13px;display:flex}.rc-exception-list .rc-note,.rc-exception-list .rc-link{margin:0}.rc-chip:disabled{cursor:default;opacity:.5}.rc-trend{color:var(--rc-muted);grid-column:1;align-items:center;gap:10px;font-size:12px;display:flex}.rc-trend svg{color:var(--rc-pass);flex:none}.rc-report{gap:6px;margin-left:auto;display:flex}.rc-badge{height:32px;font:inherit;cursor:pointer;background:0 0;border:none;border-radius:16px;align-items:center;gap:3px;padding:0 8px;font-size:13px;font-weight:600;display:inline-flex}.rc-badge--error{color:var(--cpd-color-icon-critical-primary,#d51928)}.rc-badge--warning{color:var(--cpd-color-orange-900,#bc4500)}.rc-badge:hover{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}.rc-badge:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}", ge = "0.3.1", _e = /* @__PURE__ */ e(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
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
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), V = (/* @__PURE__ */ e(((e, t) => {
	t.exports = _e();
})))();
function ve(e) {
	let { space: t, t: n } = e, r = !t.saved && e.rules.source !== e.spaceId, i = r ? e.rules.policies : t.policies, [a, o] = window.React.useState(i), [s, l] = window.React.useState("idle"), u = JSON.stringify(a) !== JSON.stringify(i), f = a.name.pattern !== void 0 && !y(a.name.pattern) || !!a.required_member.user && !v(a.required_member.user), p = !t.canEdit;
	window.React.useEffect(() => {
		u || o(i);
	}, [t, e.rules]);
	let m = (e, t) => {
		o((n) => ({
			...n,
			[e]: {
				...n[e],
				...t
			}
		})), l("idle");
	}, h = async () => {
		l("saving");
		try {
			await te(e.client, e.spaceId, a), l("saved");
		} catch (e) {
			l({ error: e instanceof Error ? e.message : String(e) });
		}
	};
	return /* @__PURE__ */ (0, V.jsxs)("div", {
		className: "rc-policies",
		children: [
			/* @__PURE__ */ (0, V.jsxs)("div", {
				className: "rc-policies-intro",
				children: [
					/* @__PURE__ */ (0, V.jsxs)("p", { children: [
						t.saved && t.at ? n(`${c}policies_saved`, {
							user: t.by ?? "?",
							when: Z(t.at, e.language)
						}) : r ? n(`${c}policies_inherited`, { space: e.spaceName(e.rules.source) }) : n(`${c}policies_defaults`),
						" ",
						n(`${c}policies_scope`)
					] }),
					e.ownPolicies.length > 0 && /* @__PURE__ */ (0, V.jsx)("p", {
						className: "rc-note",
						children: n("datanauten_room_checker_policies_own_below", { spaces: e.ownPolicies.map(e.spaceName).join(", ") })
					}),
					p && /* @__PURE__ */ (0, V.jsx)("p", {
						className: "rc-note",
						children: n("datanauten_room_checker_policies_readonly")
					})
				]
			}),
			/* @__PURE__ */ (0, V.jsxs)("div", {
				className: "rc-policies-scroll",
				children: [/* @__PURE__ */ (0, V.jsx)("ul", {
					className: "rc-policy-list",
					children: d.map((e) => /* @__PURE__ */ (0, V.jsx)(ye, {
						id: e,
						config: a[e],
						readOnly: p,
						t: n,
						onChange: (t) => m(e, t)
					}, e))
				}), /* @__PURE__ */ (0, V.jsx)(be, { ...e })]
			}),
			!p && /* @__PURE__ */ (0, V.jsxs)("div", {
				className: "rc-savebar",
				children: [
					typeof s == "object" && /* @__PURE__ */ (0, V.jsx)("span", {
						className: "rc-note rc-note--error",
						children: n("datanauten_room_checker_fix_failed", { error: s.error })
					}),
					s === "saved" && !u && /* @__PURE__ */ (0, V.jsx)("span", {
						className: "rc-note rc-note--ok",
						children: n("datanauten_room_checker_saved")
					}),
					/* @__PURE__ */ (0, V.jsx)("button", {
						type: "button",
						className: "rc-button",
						disabled: !u || s === "saving",
						onClick: () => o(i),
						children: n("datanauten_room_checker_discard")
					}),
					/* @__PURE__ */ (0, V.jsx)("button", {
						type: "button",
						className: "rc-button rc-button--primary",
						disabled: !u && t.saved || f || s === "saving",
						onClick: () => void h(),
						children: n(s === "saving" ? "datanauten_room_checker_saving" : "datanauten_room_checker_save_policies")
					})
				]
			})
		]
	});
}
function ye(e) {
	let { id: t, config: n, readOnly: r, t: i } = e, a = f[t], o = n.pattern === void 0 || y(n.pattern);
	return /* @__PURE__ */ (0, V.jsxs)("li", {
		className: "rc-policy",
		"data-enabled": n.enabled,
		children: [
			/* @__PURE__ */ (0, V.jsxs)("label", {
				className: "rc-switch",
				children: [/* @__PURE__ */ (0, V.jsx)("input", {
					type: "checkbox",
					role: "switch",
					checked: n.enabled,
					disabled: r,
					onChange: (t) => e.onChange({ enabled: t.target.checked })
				}), /* @__PURE__ */ (0, V.jsx)("span", {
					className: "rc-policy-name",
					children: i(`${c}policy_${t}`)
				})]
			}),
			/* @__PURE__ */ (0, V.jsx)("p", {
				className: "rc-policy-desc",
				children: i(`${c}policy_${t}_desc`)
			}),
			/* @__PURE__ */ (0, V.jsxs)("label", {
				className: "rc-field rc-field--inline",
				children: [/* @__PURE__ */ (0, V.jsx)("span", { children: i(`${c}severity`) }), /* @__PURE__ */ (0, V.jsxs)("select", {
					value: n.severity,
					disabled: r || !n.enabled,
					"aria-label": `${i(`${c}policy_${t}`)}: ${i(`${c}severity`)}`,
					onChange: (t) => e.onChange({ severity: t.target.value }),
					children: [/* @__PURE__ */ (0, V.jsx)("option", {
						value: "error",
						children: i(`${c}severity_error`)
					}), /* @__PURE__ */ (0, V.jsx)("option", {
						value: "warning",
						children: i(`${c}severity_warning`)
					})]
				})]
			}),
			n.pattern !== void 0 && /* @__PURE__ */ (0, V.jsxs)("label", {
				className: "rc-field",
				children: [
					/* @__PURE__ */ (0, V.jsx)("span", { children: i("datanauten_room_checker_param_pattern") }),
					/* @__PURE__ */ (0, V.jsx)("input", {
						value: n.pattern,
						disabled: r || !n.enabled,
						placeholder: "^[A-Z].*",
						"aria-invalid": !o,
						spellCheck: !1,
						onChange: (t) => e.onChange({ pattern: t.target.value })
					}),
					!o && /* @__PURE__ */ (0, V.jsx)("span", {
						className: "rc-note rc-note--error",
						children: i("datanauten_room_checker_param_pattern_invalid")
					})
				]
			}),
			n.minLength !== void 0 && /* @__PURE__ */ (0, V.jsx)(H, {
				label: i("datanauten_room_checker_param_min_length"),
				value: n.minLength,
				max: 1e3,
				disabled: r || !n.enabled,
				onChange: (t) => e.onChange({ minLength: t })
			}),
			n.min !== void 0 && /* @__PURE__ */ (0, V.jsx)(H, {
				label: i("datanauten_room_checker_param_min"),
				value: n.min,
				max: 100,
				disabled: r || !n.enabled,
				onChange: (t) => e.onChange({ min: t })
			}),
			n.minVersion !== void 0 && /* @__PURE__ */ (0, V.jsx)(H, {
				label: i("datanauten_room_checker_param_min_version"),
				value: n.minVersion,
				min: 1,
				max: 1e3,
				disabled: r || !n.enabled,
				onChange: (t) => e.onChange({ minVersion: t })
			}),
			n.days !== void 0 && /* @__PURE__ */ (0, V.jsx)(H, {
				label: i("datanauten_room_checker_param_days"),
				value: n.days,
				min: 1,
				max: 3650,
				disabled: r || !n.enabled,
				onChange: (t) => e.onChange({ days: t })
			}),
			n.level !== void 0 && /* @__PURE__ */ (0, V.jsx)(H, {
				label: i("datanauten_room_checker_param_level"),
				value: n.level,
				max: 100,
				disabled: r || !n.enabled,
				onChange: (t) => e.onChange({ level: t })
			}),
			n.user !== void 0 && /* @__PURE__ */ (0, V.jsxs)("label", {
				className: "rc-field",
				children: [
					/* @__PURE__ */ (0, V.jsx)("span", { children: i("datanauten_room_checker_param_user") }),
					/* @__PURE__ */ (0, V.jsx)("input", {
						value: n.user,
						disabled: r || !n.enabled,
						placeholder: "@moderation-bot:example.org",
						"aria-invalid": !!n.user && !v(n.user),
						spellCheck: !1,
						onChange: (t) => e.onChange({ user: t.target.value.trim() })
					}),
					!!n.user && !v(n.user) && /* @__PURE__ */ (0, V.jsx)("span", {
						className: "rc-note rc-note--error",
						children: i("datanauten_room_checker_param_user_invalid")
					})
				]
			}),
			a && n.allowed && /* @__PURE__ */ (0, V.jsxs)("fieldset", {
				className: "rc-field",
				disabled: r || !n.enabled,
				children: [
					/* @__PURE__ */ (0, V.jsx)("legend", { children: i("datanauten_room_checker_param_allowed") }),
					/* @__PURE__ */ (0, V.jsx)("div", {
						className: "rc-options",
						children: a.map((t) => /* @__PURE__ */ (0, V.jsxs)("label", {
							className: "rc-option",
							children: [/* @__PURE__ */ (0, V.jsx)("input", {
								type: "checkbox",
								checked: n.allowed.includes(t),
								disabled: n.allowed.length === 1 && n.allowed[0] === t,
								onChange: (r) => e.onChange({ allowed: r.target.checked ? a.filter((e) => e === t || n.allowed.includes(e)) : n.allowed.filter((e) => e !== t) })
							}), i(`datanauten_room_checker_value_${t}`)]
						}, t))
					}),
					/* @__PURE__ */ (0, V.jsx)("span", {
						className: "rc-hint",
						children: i("datanauten_room_checker_param_allowed_fix")
					})
				]
			})
		]
	});
}
function H(e) {
	return /* @__PURE__ */ (0, V.jsxs)("label", {
		className: "rc-field rc-field--inline",
		children: [/* @__PURE__ */ (0, V.jsx)("span", { children: e.label }), /* @__PURE__ */ (0, V.jsx)("input", {
			type: "number",
			min: e.min ?? 0,
			max: e.max,
			step: 1,
			value: e.value,
			disabled: e.disabled,
			onChange: (t) => {
				let n = Math.round(Number(t.target.value));
				Number.isFinite(n) && e.onChange(Math.max(e.min ?? 0, Math.min(e.max, n)));
			}
		})]
	});
}
function be(e) {
	let { space: t, t: n } = e, [r, i] = window.React.useState(), a = Object.entries(t.exceptions).flatMap(([e, t]) => d.filter((e) => t[e]).map((n) => ({
		roomId: e,
		id: n,
		ex: t[n]
	})));
	return /* @__PURE__ */ (0, V.jsxs)("section", {
		className: "rc-exceptions",
		"aria-label": n(`${c}exceptions_title`),
		children: [
			/* @__PURE__ */ (0, V.jsx)("div", {
				className: "rc-section-title",
				children: n(`${c}exceptions_title`)
			}),
			a.length === 0 ? /* @__PURE__ */ (0, V.jsx)("p", {
				className: "rc-note",
				children: n(`${c}exceptions_none`)
			}) : /* @__PURE__ */ (0, V.jsx)("ul", {
				className: "rc-exception-list",
				children: a.map(({ roomId: r, id: a, ex: o }) => /* @__PURE__ */ (0, V.jsxs)("li", { children: [
					/* @__PURE__ */ (0, V.jsxs)("span", {
						className: "rc-exception-what",
						children: [
							/* @__PURE__ */ (0, V.jsx)("strong", { children: e.roomName(r) }),
							" · ",
							n(`${c}policy_${a}`)
						]
					}),
					/* @__PURE__ */ (0, V.jsxs)("span", {
						className: "rc-exception-reason",
						children: [
							"“",
							o.reason,
							"”"
						]
					}),
					/* @__PURE__ */ (0, V.jsx)("span", {
						className: "rc-note",
						children: n(`${c}excepted_by`, {
							user: o.by,
							when: Z(o.at, e.language)
						})
					}),
					t.canEdit && /* @__PURE__ */ (0, V.jsx)("button", {
						type: "button",
						className: "rc-link",
						onClick: () => void j(e.client, e.spaceId, r, a).catch((e) => i(e instanceof Error ? e.message : String(e))),
						children: n("datanauten_room_checker_remove")
					})
				] }, `${r}|${a}`))
			}),
			r && /* @__PURE__ */ (0, V.jsx)("p", {
				className: "rc-note rc-note--error",
				children: n("datanauten_room_checker_fix_failed", { error: r })
			})
		]
	});
}
// src/ui/RoomsTab.tsx
var U = (e, t) => e.report?.results.get(t), W = (e, t) => U(e, t)?.status === "fail", G = (e) => !(!e.report || e.report.errors || e.report.warnings || e.report.unknown);
function xe(e) {
	let { entries: t, policies: n, filter: r, t: i } = e, a = d.filter((e) => n[e].enabled || t.some((t) => t.policies[e].enabled)), o = new Set(e.previous?.failing ?? []), s = (t) => !!(e.previous && t.report && (t.report.errors || t.report.warnings) && !o.has(t.id)), l = t.filter(s).length, u = t.filter((e) => e.room), f = t.filter(G).length, p = t.filter((e) => e.report?.errors).length, m = t.filter((e) => e.report && !e.report.errors && e.report.warnings).length, h = t.length - u.length, g = t.reduce((e, t) => e + [...t.report?.results.values() ?? []].filter((e) => e.status === "excepted").length, 0), _ = u.length ? Math.round(u.filter(G).length / u.length * 100) : 0, v = e.query.trim().toLowerCase(), y = t.filter((e) => v && !e.name.toLowerCase().includes(v) && !e.id.toLowerCase().includes(v) ? !1 : r === "failing" ? !!(e.report && (e.report.errors || e.report.warnings)) : r === "errors" ? !!e.report?.errors : r === "warnings" ? !!(e.report && !e.report.errors && e.report.warnings) : r === "unchecked" ? !e.room : r === "new" ? s(e) : r === "all" || W(e, r)).sort((e, t) => K(t) - K(e) || Number(!!t.room) - Number(!!e.room) || e.name.localeCompare(t.name)), b = e.selected ? t.find((t) => t.id === e.selected) : void 0, x = d.includes(r) ? r : void 0, S = (t, n, i, a) => /* @__PURE__ */ (0, V.jsxs)("button", {
		type: "button",
		className: `rc-stat rc-stat--${a}`,
		"aria-pressed": r === t,
		onClick: () => e.setFilter(r === t ? "all" : t),
		children: [/* @__PURE__ */ (0, V.jsx)("span", {
			className: "rc-stat-value",
			children: n
		}), /* @__PURE__ */ (0, V.jsx)("span", {
			className: "rc-stat-label",
			children: i
		})]
	});
	return /* @__PURE__ */ (0, V.jsxs)("div", {
		className: `rc-rooms${b ? " rc-rooms--detail" : ""}`,
		children: [/* @__PURE__ */ (0, V.jsxs)("div", {
			className: "rc-main",
			children: [
				/* @__PURE__ */ (0, V.jsxs)("section", {
					className: "rc-summary",
					"aria-label": i(`${c}tab_rooms`),
					children: [
						/* @__PURE__ */ (0, V.jsxs)("div", {
							className: "rc-stats",
							children: [
								S("all", t.length, i(`${c}stat_rooms`), "all"),
								S("errors", p, i(`${c}stat_errors`), "error"),
								S("warnings", m, i(`${c}stat_warnings`), "warning"),
								/* @__PURE__ */ (0, V.jsxs)("div", {
									className: "rc-stat rc-stat--pass",
									children: [/* @__PURE__ */ (0, V.jsx)("span", {
										className: "rc-stat-value",
										children: f
									}), /* @__PURE__ */ (0, V.jsx)("span", {
										className: "rc-stat-label",
										children: i(`${c}stat_pass`)
									})]
								}),
								h > 0 && S("unchecked", h, i("datanauten_room_checker_stat_unchecked"), "unchecked")
							]
						}),
						u.length > 0 && /* @__PURE__ */ (0, V.jsxs)("div", {
							className: "rc-compliance",
							children: [/* @__PURE__ */ (0, V.jsx)("span", {
								className: "rc-meter",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, V.jsx)("span", { style: { width: `${_}%` } })
							}), /* @__PURE__ */ (0, V.jsxs)("span", { children: [i("datanauten_room_checker_compliance", { percent: `${_} %` }), g > 0 && /* @__PURE__ */ (0, V.jsxs)("span", {
								className: "rc-excepted-count",
								children: [" · ", X(i, "exceptions_count", g)]
							})] })]
						}),
						e.trend.length > 1 && /* @__PURE__ */ (0, V.jsx)(De, {
							trend: e.trend,
							language: e.language,
							t: i
						}),
						/* @__PURE__ */ (0, V.jsx)("div", {
							className: "rc-section-title",
							children: i(`${c}by_policy`)
						}),
						/* @__PURE__ */ (0, V.jsx)("div", {
							className: "rc-bars",
							children: a.map((a) => {
								let o = t.filter((e) => W(e, a)).length, s = t.filter((e) => U(e, a) && U(e, a).status !== "unknown").length;
								return /* @__PURE__ */ (0, V.jsxs)("button", {
									type: "button",
									className: `rc-bar rc-bar--${n[a].severity}`,
									"aria-pressed": r === a,
									disabled: !o,
									onClick: () => e.setFilter(r === a ? "all" : a),
									children: [
										/* @__PURE__ */ (0, V.jsx)("span", {
											className: "rc-bar-label",
											children: i(`${c}policy_${a}`)
										}),
										/* @__PURE__ */ (0, V.jsx)("span", {
											className: "rc-bar-track",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, V.jsx)("span", { style: { width: s ? `${o / s * 100}%` : 0 } })
										}),
										/* @__PURE__ */ (0, V.jsx)("span", {
											className: "rc-bar-count",
											children: o
										})
									]
								}, a);
							})
						})
					]
				}),
				/* @__PURE__ */ (0, V.jsxs)("div", {
					className: "rc-toolbar",
					children: [
						/* @__PURE__ */ (0, V.jsx)("input", {
							className: "rc-search",
							type: "search",
							placeholder: i(`${c}search`),
							"aria-label": i(`${c}search`),
							value: e.query,
							onChange: (t) => e.setQuery(t.target.value)
						}),
						/* @__PURE__ */ (0, V.jsxs)("div", {
							className: "rc-chips",
							role: "group",
							children: [
								[
									"all",
									"failing",
									"unchecked"
								].map((t) => /* @__PURE__ */ (0, V.jsx)("button", {
									type: "button",
									className: "rc-chip",
									"aria-pressed": r === t,
									onClick: () => e.setFilter(t),
									children: i(`${c}filter_${t}`)
								}, t)),
								e.previous && /* @__PURE__ */ (0, V.jsx)("button", {
									type: "button",
									className: "rc-chip",
									"aria-pressed": r === "new",
									disabled: !l,
									title: i("datanauten_room_checker_since", { when: Z(e.previous.at, e.language) }),
									onClick: () => e.setFilter(r === "new" ? "all" : "new"),
									children: i("datanauten_room_checker_filter_new", { count: String(l) })
								}),
								x && /* @__PURE__ */ (0, V.jsxs)("button", {
									type: "button",
									className: "rc-chip",
									"aria-pressed": !0,
									onClick: () => e.setFilter("all"),
									children: [i("datanauten_room_checker_filter_policy", { policy: i(`datanauten_room_checker_policy_${x}`) }), " ×"]
								})
							]
						}),
						/* @__PURE__ */ (0, V.jsx)(je, {
							...e,
							enabled: a
						})
					]
				}),
				x && /* @__PURE__ */ (0, V.jsx)(Ee, {
					...e,
					id: x,
					failing: t.filter((e) => W(e, x))
				}, x),
				t.length === 0 ? /* @__PURE__ */ (0, V.jsx)("div", {
					className: "rc-empty",
					children: i(`${c}no_rooms`)
				}) : y.length === 0 ? /* @__PURE__ */ (0, V.jsx)("div", {
					className: "rc-empty",
					children: i(`${c}no_match`)
				}) : /* @__PURE__ */ (0, V.jsx)("div", {
					className: "rc-table-wrap",
					children: /* @__PURE__ */ (0, V.jsxs)("table", {
						className: "rc-table",
						children: [/* @__PURE__ */ (0, V.jsx)("thead", { children: /* @__PURE__ */ (0, V.jsxs)("tr", { children: [/* @__PURE__ */ (0, V.jsx)("th", {
							scope: "col",
							className: "rc-col-room",
							children: i(`${c}col_room`)
						}), a.map((e) => /* @__PURE__ */ (0, V.jsx)("th", {
							scope: "col",
							className: "rc-col-policy",
							title: i(`${c}policy_${e}_desc`),
							children: /* @__PURE__ */ (0, V.jsx)("span", { children: i(`${c}policy_${e}`) })
						}, e))] }) }), /* @__PURE__ */ (0, V.jsx)("tbody", { children: y.map((t) => /* @__PURE__ */ (0, V.jsxs)("tr", {
							className: "rc-row",
							"aria-selected": t.id === e.selected,
							tabIndex: 0,
							onClick: () => e.setSelected(t.id),
							onKeyDown: (n) => {
								(n.key === "Enter" || n.key === " ") && (n.preventDefault(), e.setSelected(t.id));
							},
							children: [/* @__PURE__ */ (0, V.jsxs)("th", {
								scope: "row",
								className: "rc-col-room",
								children: [/* @__PURE__ */ (0, V.jsx)("span", {
									className: "rc-room-name",
									children: t.name
								}), /* @__PURE__ */ (0, V.jsx)("span", {
									className: "rc-room-meta",
									children: Se(t, i)
								})]
							}), a.map((e) => /* @__PURE__ */ (0, V.jsx)("td", {
								className: "rc-cell",
								children: /* @__PURE__ */ (0, V.jsx)(q, {
									result: U(t, e),
									severity: t.policies[e].severity,
									t: i
								})
							}, e))]
						}, t.id)) })]
					})
				})
			]
		}), b && /* @__PURE__ */ (0, V.jsx)(Ce, {
			...e,
			entry: b,
			onBack: () => e.setSelected(void 0)
		})]
	});
}
function K(e) {
	return e.report ? e.report.errors * 100 + e.report.warnings : -1;
}
function Se(e, t) {
	let n = e.room ? [] : [t(`${c}not_joined`)];
	return e.report?.errors && n.push(X(t, "room_errors", e.report.errors)), e.report?.warnings && n.push(X(t, "room_warnings", e.report.warnings)), e.room && n.length === 0 && n.push(t(`${c}room_ok`)), n.join(" · ");
}
function q(e) {
	let { result: t, t: n } = e;
	if (!t) return /* @__PURE__ */ (0, V.jsx)("span", {
		className: "rc-status rc-status--none",
		"aria-label": "–",
		children: "–"
	});
	let r = t.status === "fail" ? e.severity : t.status, i = t.status === "pass" ? n(`${c}passes`) : t.status === "unknown" ? n(`${c}status_unknown`) : t.status === "excepted" ? n(`${c}status_excepted`, { reason: t.exception.reason }) : J(t.detail, n), a = {
		pass: "✓",
		excepted: "✓",
		unknown: "?",
		error: "✕",
		warning: "!"
	}[r];
	return /* @__PURE__ */ (0, V.jsx)("span", {
		className: `rc-status rc-status--${r}`,
		title: i,
		"aria-label": i,
		children: a
	});
}
function J(e, t) {
	if (!e) return "";
	let n = { ...e.vars };
	return n.value &&= t(`${c}value_${n.value}`), t(`${c}check_${e.key}`, n);
}
function Ce(e) {
	let { entry: t, t: n } = e, r = t.policies, i = d.filter((e) => r[e].enabled), a = {
		fail: 0,
		excepted: 1,
		unknown: 2,
		pass: 3
	}, o = i.filter((e) => U(t, e)).sort((e, n) => a[U(t, e).status] - a[U(t, n).status]), s = t.parentSpace !== e.spaceId && t.parentSpace;
	return /* @__PURE__ */ (0, V.jsxs)("aside", {
		className: "rc-detail",
		"data-testid": "room-checker-detail",
		"aria-label": t.name,
		children: [
			/* @__PURE__ */ (0, V.jsxs)("button", {
				type: "button",
				className: "rc-back",
				onClick: e.onBack,
				children: ["‹ ", n(`${c}back`)]
			}),
			/* @__PURE__ */ (0, V.jsx)("div", {
				className: "rc-detail-name",
				children: t.name
			}),
			/* @__PURE__ */ (0, V.jsx)("div", {
				className: "rc-detail-id",
				children: t.id
			}),
			s && /* @__PURE__ */ (0, V.jsx)("div", {
				className: "rc-detail-id",
				children: n("datanauten_room_checker_in_subspace", { space: e.spaceName(s) })
			}),
			t.policySpace !== e.spaceId && /* @__PURE__ */ (0, V.jsx)("div", {
				className: "rc-detail-id",
				children: n("datanauten_room_checker_rules_from", { space: e.spaceName(t.policySpace) })
			}),
			/* @__PURE__ */ (0, V.jsxs)("div", {
				className: "rc-actions",
				children: [/* @__PURE__ */ (0, V.jsx)("button", {
					type: "button",
					className: "rc-button",
					onClick: () => e.onOpenRoom(t.id),
					children: t.room ? n(`${c}open_room`) : n(`${c}view_room`)
				}), t.room && /* @__PURE__ */ (0, V.jsx)("button", {
					type: "button",
					className: "rc-button",
					onClick: () => e.onRoomSettings(t.id),
					children: n("datanauten_room_checker_room_settings")
				})]
			}),
			!t.room && /* @__PURE__ */ (0, V.jsx)("p", {
				className: "rc-note",
				children: t.report ? n("datanauten_room_checker_not_joined_partial") : n("datanauten_room_checker_not_joined_detail")
			}),
			t.report && /* @__PURE__ */ (0, V.jsx)("ul", {
				className: "rc-checks",
				children: o.map((i) => {
					let a = U(t, i), o = r[i].severity;
					return /* @__PURE__ */ (0, V.jsxs)("li", {
						className: "rc-check",
						children: [/* @__PURE__ */ (0, V.jsx)(q, {
							result: a,
							severity: o,
							t: n
						}), /* @__PURE__ */ (0, V.jsxs)("div", {
							className: "rc-check-body",
							children: [
								/* @__PURE__ */ (0, V.jsxs)("div", {
									className: "rc-check-name",
									children: [
										n(`datanauten_room_checker_policy_${i}`),
										a.status === "fail" && /* @__PURE__ */ (0, V.jsx)("span", {
											className: `rc-tag rc-tag--${o}`,
											children: n(`datanauten_room_checker_severity_${o}`)
										}),
										a.status === "excepted" && /* @__PURE__ */ (0, V.jsx)("span", {
											className: "rc-tag rc-tag--excepted",
											children: n("datanauten_room_checker_excepted")
										})
									]
								}),
								/* @__PURE__ */ (0, V.jsx)("div", {
									className: "rc-check-detail",
									children: a.status === "pass" ? n("datanauten_room_checker_passes") : a.status === "unknown" ? n("datanauten_room_checker_status_unknown") : J(a.detail, n)
								}),
								a.status === "fail" && /* @__PURE__ */ (0, V.jsx)(Te, {
									...e,
									id: i
								}),
								(a.status === "fail" || a.status === "excepted") && /* @__PURE__ */ (0, V.jsx)(we, {
									...e,
									id: i,
									result: a
								})
							]
						})]
					}, i);
				})
			})
		]
	});
}
function we(e) {
	let { client: t, entry: n, id: r, result: i, t: a } = e, o = n.policySpace === e.spaceId ? e.spacePolicies.canEdit : A(t, n.policySpace).canEdit, [s, l] = window.React.useState(), [u, d] = window.React.useState(!1), [f, p] = window.React.useState();
	window.React.useEffect(() => {
		l(void 0), p(void 0);
	}, [
		n.id,
		r,
		i.status
	]);
	let m = async (e) => {
		d(!0), p(void 0);
		try {
			await j(t, n.policySpace, n.id, r, e);
		} catch (e) {
			p(e instanceof Error ? e.message : String(e));
		} finally {
			d(!1);
		}
	}, h = f && /* @__PURE__ */ (0, V.jsx)("div", {
		className: "rc-note rc-note--error",
		children: a("datanauten_room_checker_fix_failed", { error: f })
	});
	if (i.status === "excepted") {
		let t = i.exception;
		return /* @__PURE__ */ (0, V.jsxs)("div", {
			className: "rc-exception",
			children: [
				/* @__PURE__ */ (0, V.jsxs)("div", {
					className: "rc-exception-reason",
					children: [
						"“",
						t.reason,
						"”"
					]
				}),
				/* @__PURE__ */ (0, V.jsx)("div", {
					className: "rc-note",
					children: a(`${c}excepted_by`, {
						user: t.by,
						when: Z(t.at, e.language)
					})
				}),
				o && /* @__PURE__ */ (0, V.jsx)("button", {
					type: "button",
					className: "rc-link",
					disabled: u,
					onClick: () => void m(void 0),
					children: a("datanauten_room_checker_take_back")
				}),
				h
			]
		});
	}
	return o ? s === void 0 ? /* @__PURE__ */ (0, V.jsx)("button", {
		type: "button",
		className: "rc-link",
		onClick: () => l(""),
		children: a(`${c}accept`)
	}) : /* @__PURE__ */ (0, V.jsxs)("form", {
		className: "rc-fix-form",
		onSubmit: (e) => {
			e.preventDefault(), s.trim() && m(s.trim());
		},
		children: [
			/* @__PURE__ */ (0, V.jsx)("input", {
				"aria-label": a(`${c}accept_reason`),
				placeholder: a(`${c}accept_reason`),
				value: s,
				autoFocus: !0,
				onChange: (e) => l(e.target.value)
			}),
			/* @__PURE__ */ (0, V.jsxs)("div", {
				className: "rc-fix-buttons",
				children: [/* @__PURE__ */ (0, V.jsx)("button", {
					type: "submit",
					className: "rc-button rc-button--primary",
					disabled: !s.trim() || u,
					children: a(`${c}accept_save`)
				}), /* @__PURE__ */ (0, V.jsx)("button", {
					type: "button",
					className: "rc-button",
					onClick: () => l(void 0),
					children: a(`${c}cancel`)
				})]
			}),
			h
		]
	}) : null;
}
function Te(e) {
	let { client: t, entry: n, id: r, t: i } = e, [a, o] = window.React.useState({ step: "idle" }), s = window.React.useRef(null), l = n.policies[r];
	if (window.React.useEffect(() => o({ step: "idle" }), [n.id, r]), !M[r]) return /* @__PURE__ */ (0, V.jsx)("div", {
		className: "rc-note",
		children: i(`${c}no_fix`)
	});
	if (!n.room) return /* @__PURE__ */ (0, V.jsx)("div", {
		className: "rc-note",
		children: i(`${c}join_to_fix`)
	});
	if (!P(t, n, r)) return /* @__PURE__ */ (0, V.jsx)("div", {
		className: "rc-note",
		children: i(`${c}no_power`)
	});
	let u = async (e) => {
		o({ step: "busy" });
		try {
			await R(t, n, r, l, e), o({ step: "done" });
		} catch (e) {
			o({
				step: "failed",
				error: e instanceof Error ? e.message : String(e)
			});
		}
	}, d = Y(r, n.policies, i), f = N[r];
	return a.step === "busy" ? /* @__PURE__ */ (0, V.jsx)("div", {
		className: "rc-note",
		children: "…"
	}) : a.step === "done" ? /* @__PURE__ */ (0, V.jsx)("div", {
		className: "rc-note rc-note--ok",
		children: i(`${c}fix_done`)
	}) : a.step === "edit" ? /* @__PURE__ */ (0, V.jsxs)("form", {
		className: "rc-fix-form",
		onSubmit: (e) => {
			e.preventDefault(), a.value.trim() && u(a.value);
		},
		children: [r === "topic" ? /* @__PURE__ */ (0, V.jsx)("textarea", {
			"aria-label": d,
			value: a.value,
			autoFocus: !0,
			rows: 3,
			onChange: (e) => o({
				step: "edit",
				value: e.target.value
			})
		}) : /* @__PURE__ */ (0, V.jsx)("input", {
			"aria-label": d,
			value: a.value,
			autoFocus: !0,
			onChange: (e) => o({
				step: "edit",
				value: e.target.value
			})
		}), /* @__PURE__ */ (0, V.jsxs)("div", {
			className: "rc-fix-buttons",
			children: [/* @__PURE__ */ (0, V.jsx)("button", {
				type: "submit",
				className: "rc-button rc-button--primary",
				disabled: !a.value.trim(),
				children: i(`${c}save`)
			}), /* @__PURE__ */ (0, V.jsx)("button", {
				type: "button",
				className: "rc-button",
				onClick: () => o({ step: "idle" }),
				children: i(`${c}cancel`)
			})]
		})]
	}) : a.step === "confirm" ? /* @__PURE__ */ (0, V.jsxs)("div", {
		className: "rc-fix-form",
		children: [/* @__PURE__ */ (0, V.jsx)("div", {
			className: "rc-note",
			children: i(`${c}fix_encryption_confirm`)
		}), /* @__PURE__ */ (0, V.jsxs)("div", {
			className: "rc-fix-buttons",
			children: [/* @__PURE__ */ (0, V.jsx)("button", {
				type: "button",
				className: "rc-button rc-button--primary",
				onClick: () => void u(),
				children: d
			}), /* @__PURE__ */ (0, V.jsx)("button", {
				type: "button",
				className: "rc-button",
				onClick: () => o({ step: "idle" }),
				children: i(`${c}cancel`)
			})]
		})]
	}) : /* @__PURE__ */ (0, V.jsxs)("div", {
		className: "rc-fix",
		children: [
			/* @__PURE__ */ (0, V.jsx)("button", {
				type: "button",
				className: "rc-button rc-button--primary",
				onClick: () => {
					if (f === "file") return s.current?.click();
					if (f === "text") {
						let e = n.room, t = r === "name" ? e?.name ?? "" : r === "topic" ? e ? ue(e) : "" : fe(n.name);
						return o({
							step: "edit",
							value: t
						});
					}
					if (r === "encryption") return o({ step: "confirm" });
					u();
				},
				children: d
			}),
			f === "file" && /* @__PURE__ */ (0, V.jsx)("input", {
				ref: s,
				type: "file",
				accept: "image/*",
				hidden: !0,
				"data-testid": "room-checker-avatar-input",
				onChange: (e) => {
					let t = e.target.files?.[0];
					t && u(t);
				}
			}),
			a.step === "failed" && /* @__PURE__ */ (0, V.jsx)("div", {
				className: "rc-note rc-note--error",
				children: i("datanauten_room_checker_fix_failed", { error: a.error })
			})
		]
	});
}
function Y(e, t, n) {
	let r = t[e], i = I(e, r);
	return n(`${c}fix_${e}`, {
		value: i ? n(`${c}value_${i}`) : "",
		level: String(r.level ?? ""),
		user: r.user ?? ""
	});
}
function Ee(e) {
	let { client: t, id: n, failing: r, policies: i, t: a } = e, [o, s] = window.React.useState({ step: "idle" }), [l, u] = window.React.useState([]);
	if (!r.length && o.step === "idle") return null;
	let d = !!N[n] || !M[n], f = d ? [] : r.filter((e) => e.room && P(t, e, n)), p = r.length - f.length, m = d ? "" : Y(n, i, a), h = async () => {
		let e = f;
		u(e);
		let r = [];
		for (let i = 0; i < e.length; i++) {
			s({
				step: "running",
				done: i
			});
			try {
				await R(t, e[i], n, e[i].policies[n]);
			} catch (t) {
				r.push({
					name: e[i].name,
					error: t instanceof Error ? t.message : String(t)
				});
			}
		}
		s({
			step: "finished",
			ok: e.length - r.length,
			failed: r
		});
	}, g;
	return g = o.step === "running" ? /* @__PURE__ */ (0, V.jsx)("span", { children: a(`${c}bulk_running`, {
		done: String(o.done + 1),
		count: String(l.length)
	}) }) : o.step === "finished" ? /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [
		/* @__PURE__ */ (0, V.jsx)("span", {
			className: o.failed.length ? "" : "rc-note--ok",
			children: a(`${c}bulk_done`, {
				ok: String(o.ok),
				count: String(l.length)
			})
		}),
		o.failed.length > 0 && /* @__PURE__ */ (0, V.jsx)("ul", {
			className: "rc-bulk-list rc-note--error",
			children: o.failed.map((e) => /* @__PURE__ */ (0, V.jsx)("li", { children: a("datanauten_room_checker_bulk_failed_room", {
				room: e.name,
				error: e.error
			}) }, e.name))
		}),
		/* @__PURE__ */ (0, V.jsx)("button", {
			type: "button",
			className: "rc-link",
			onClick: () => s({ step: "idle" }),
			children: a(`${c}close`)
		})
	] }) : o.step === "confirm" ? /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [
		/* @__PURE__ */ (0, V.jsx)("span", { children: a(n === "encryption" ? `${c}fix_encryption_confirm` : `${c}bulk_confirm`) }),
		/* @__PURE__ */ (0, V.jsx)("ul", {
			className: "rc-bulk-list",
			children: f.map((e) => /* @__PURE__ */ (0, V.jsx)("li", { children: e.name }, e.id))
		}),
		/* @__PURE__ */ (0, V.jsxs)("div", {
			className: "rc-fix-buttons",
			children: [/* @__PURE__ */ (0, V.jsx)("button", {
				type: "button",
				className: "rc-button rc-button--primary",
				onClick: () => void h(),
				children: X(a, "bulk_go", f.length)
			}), /* @__PURE__ */ (0, V.jsx)("button", {
				type: "button",
				className: "rc-button",
				onClick: () => s({ step: "idle" }),
				children: a(`${c}cancel`)
			})]
		})
	] }) : /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [/* @__PURE__ */ (0, V.jsx)("span", { children: X(a, "bulk_failing", r.length) }), d ? /* @__PURE__ */ (0, V.jsx)("span", {
		className: "rc-note",
		children: a(`${c}bulk_per_room`)
	}) : /* @__PURE__ */ (0, V.jsxs)(V.Fragment, { children: [f.length > 0 && /* @__PURE__ */ (0, V.jsx)("button", {
		type: "button",
		className: "rc-button rc-button--primary",
		onClick: () => s({ step: "confirm" }),
		children: a("datanauten_room_checker_bulk_fix", {
			action: m,
			count: String(f.length)
		})
	}), p > 0 && /* @__PURE__ */ (0, V.jsx)("span", {
		className: "rc-note",
		children: X(a, "bulk_skipped", p)
	})] })] }), /* @__PURE__ */ (0, V.jsx)("div", {
		className: "rc-bulk",
		"data-testid": "room-checker-bulk",
		"aria-live": "polite",
		children: g
	});
}
function De(e) {
	let { trend: t, t: n } = e, r = (e) => e.joined ? e.passing / e.joined : 0, i = t.map((e, n) => `${(n / (t.length - 1) * 160).toFixed(1)},${(26 - r(e) * 24).toFixed(1)}`).join(" "), a = Math.round(r(t[0]) * 100), o = Math.round(r(t[t.length - 1]) * 100), s = n(`${c}trend`, {
		from: `${a} %`,
		to: `${o} %`,
		since: Z(t[0].at, e.language)
	});
	return /* @__PURE__ */ (0, V.jsxs)("div", {
		className: "rc-trend",
		title: s,
		children: [/* @__PURE__ */ (0, V.jsx)("svg", {
			viewBox: "0 0 160 28",
			width: 160,
			height: 28,
			"aria-hidden": "true",
			children: /* @__PURE__ */ (0, V.jsx)("polyline", {
				points: i,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				strokeLinejoin: "round"
			})
		}), /* @__PURE__ */ (0, V.jsx)("span", { children: s })]
	});
}
var Oe = {
	pass: "pass",
	fail: "fail",
	excepted: "accepted",
	unknown: "unknown"
};
function ke(e, t, n) {
	let r = (e) => /[",\n]/.test(String(e)) ? `"${String(e).replace(/"/g, "\"\"")}"` : String(e);
	return [[
		n(`${c}col_room`),
		"room_id",
		"joined",
		"errors",
		"warnings",
		...t.map((e) => n(`${c}policy_${e}`))
	], ...e.map((e) => [
		e.name,
		e.id,
		e.room ? "yes" : "no",
		e.report?.errors ?? "",
		e.report?.warnings ?? "",
		...t.map((t) => Oe[e.report?.results.get(t)?.status ?? ""] ?? "")
	])].map((e) => e.map(r).join(",")).join("\n") + "\n";
}
function Ae(e, t, n, r = /* @__PURE__ */ new Date()) {
	let i = t.filter((e) => e.report && (e.report.errors || e.report.warnings)), a = [
		`## ${n(`${c}report_title`, {
			space: e,
			date: r.toISOString().slice(0, 10)
		})}`,
		"",
		`${n(`${c}stat_rooms`)}: ${t.length} · ${n(`${c}stat_errors`)}: ${t.filter((e) => e.report?.errors).length} · ${n(`${c}stat_warnings`)}: ${t.filter((e) => e.report && !e.report.errors && e.report.warnings).length} · ${n(`${c}stat_unchecked`)}: ${t.filter((e) => !e.room).length}`,
		""
	];
	i.length || a.push(n(`${c}report_all_pass`));
	for (let e of i) {
		let t = d.filter((t) => e.report.results.get(t)?.status === "fail").map((t) => `${n(`${c}policy_${t}`)} (${n(`${c}severity_${e.policies[t].severity}`)})`);
		a.push(`- **${e.name.replace(/[*_`[\]]/g, "\\$&")}**: ${t.join(", ")}`);
	}
	return a.join("\n") + "\n";
}
function je(e) {
	let { t } = e, [n, r] = window.React.useState(), i = () => {
		let n = new Blob([ke(e.entries, e.enabled, t)], { type: "text/csv;charset=utf-8" }), r = URL.createObjectURL(n), i = document.createElement("a");
		i.href = r, i.download = `room-check-${e.spaceName(e.spaceId).replace(/[^\p{L}\p{N}_-]+/gu, "-")}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`, document.body.appendChild(i), i.click(), i.remove(), setTimeout(() => URL.revokeObjectURL(r), 1e3);
	}, a = async () => {
		try {
			await navigator.clipboard.writeText(Ae(e.spaceName(e.spaceId), e.entries, t)), r("ok");
		} catch {
			r("failed");
		}
		setTimeout(() => r(void 0), 2500);
	};
	return /* @__PURE__ */ (0, V.jsxs)("div", {
		className: "rc-report",
		children: [/* @__PURE__ */ (0, V.jsx)("button", {
			type: "button",
			className: "rc-button",
			onClick: i,
			children: t(`${c}report_csv`)
		}), /* @__PURE__ */ (0, V.jsx)("button", {
			type: "button",
			className: "rc-button",
			onClick: () => void a(),
			children: t(n === "ok" ? `${c}report_copied` : n === "failed" ? `${c}report_copy_failed` : `${c}report_markdown`)
		})]
	});
}
// src/ui/CheckerOverlay.tsx
var Me = 1500;
function Ne(e, t = Date.now()) {
	let n = e.filter((e) => e.room);
	return {
		at: t,
		joined: n.length,
		passing: n.filter((e) => e.report && !e.report.errors && !e.report.warnings && !e.report.unknown).length,
		errors: e.filter((e) => e.report?.errors).length,
		warnings: e.filter((e) => e.report && !e.report.errors && e.report.warnings).length,
		failing: e.filter((e) => e.report && (e.report.errors || e.report.warnings)).map((e) => e.id)
	};
}
function Pe(e) {
	let { client: t, spaces: n, t: r } = e, i = window.React.useId(), [a, o] = window.React.useState(() => n.find((t) => t.id === e.space)?.id ?? n[0]?.id), [l, u] = window.React.useState("rooms"), [d, f] = window.React.useState("all"), [p, m] = window.React.useState(""), [h, g] = window.React.useState(e.room), [_, v] = window.React.useState({ rooms: /* @__PURE__ */ new Map() }), y = window.React.useRef(null);
	window.React.useEffect(() => y.current?.focus(), []), window.React.useEffect(() => {
		if (!a) return;
		let e = !0;
		return v({ rooms: /* @__PURE__ */ new Map() }), ae(t, a).then((t) => e && v({
			space: a,
			rooms: t
		})), () => {
			e = !1;
		};
	}, [t, a]);
	let b = window.React.useMemo(() => a ? A(t, a) : void 0, [
		t,
		a,
		e.revision
	]), x = window.React.useMemo(() => a ? ee(t, a, n) : void 0, [
		t,
		a,
		n,
		b
	]), S = window.React.useMemo(() => a && x ? ne(t, a, x, _.rooms) : [], [
		t,
		a,
		x,
		_,
		e.revision
	]), C = window.React.useMemo(() => a ? e.history?.get(a) ?? [] : [], [
		e.history,
		a,
		e.revision
	]), w = window.React.useMemo(() => s(C), [C]), T = !!a && _.space === a, E = window.React.useRef(/* @__PURE__ */ new Map());
	T && a && E.current.set(a, S), window.React.useEffect(() => {
		if (!T || !a || !e.history) return;
		let t = e.history, n = () => void t.record(a, Ne(E.current.get(a) ?? [])).catch(() => {}), r = setTimeout(n, Me);
		return () => {
			clearTimeout(r), n();
		};
	}, [
		T,
		a,
		e.history
	]);
	let D = (t) => {
		o(t), g(void 0), f("all"), e.onSpaceChange(t);
	}, O = (t) => {
		t.key === "Escape" && (t.preventDefault(), h ? g(void 0) : e.onClose());
	}, k;
	return k = !a || !b || !x ? /* @__PURE__ */ (0, V.jsx)("div", {
		className: "rc-empty",
		children: r(`${c}no_spaces`)
	}) : l === "policies" ? /* @__PURE__ */ (0, V.jsx)(ve, {
		client: t,
		spaceId: a,
		space: b,
		rules: x,
		ownPolicies: [...new Set(S.map((e) => e.policySpace))].filter((e) => e !== a && e !== x.source),
		spaceName: (e) => n.find((t) => t.id === e)?.name ?? t.getRoom(e)?.name ?? e,
		roomName: (e) => S.find((t) => t.id === e)?.name ?? t.getRoom(e)?.name ?? e,
		revision: e.revision,
		language: e.language,
		t: r
	}, a) : /* @__PURE__ */ (0, V.jsx)(xe, {
		...e,
		spaceId: a,
		spacePolicies: b,
		entries: S,
		policies: x.policies,
		trend: C,
		previous: w,
		filter: d,
		setFilter: f,
		query: p,
		setQuery: m,
		selected: h,
		setSelected: g,
		spaceName: (e) => n.find((t) => t.id === e)?.name ?? t.getRoom(e)?.name ?? _.rooms.get(e)?.name ?? e
	}), /* @__PURE__ */ (0, V.jsx)("div", {
		className: "rc-backdrop",
		onMouseDown: (t) => t.target === t.currentTarget && e.onClose(),
		children: /* @__PURE__ */ (0, V.jsxs)("div", {
			ref: y,
			tabIndex: -1,
			className: "rc-panel",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": i,
			onKeyDown: O,
			children: [
				/* @__PURE__ */ (0, V.jsxs)("header", {
					className: "rc-header",
					children: [
						/* @__PURE__ */ (0, V.jsx)("h2", {
							id: i,
							className: "rc-title",
							children: r(`${c}title`)
						}),
						n.length > 0 && /* @__PURE__ */ (0, V.jsxs)("label", {
							className: "rc-space",
							children: [/* @__PURE__ */ (0, V.jsx)("span", { children: r("datanauten_room_checker_space") }), /* @__PURE__ */ (0, V.jsx)("select", {
								value: a,
								onChange: (e) => D(e.target.value),
								children: n.map((e) => /* @__PURE__ */ (0, V.jsxs)("option", {
									value: e.id,
									children: ["\xA0\xA0".repeat(e.depth), e.name]
								}, e.id))
							})]
						}),
						/* @__PURE__ */ (0, V.jsx)("div", {
							className: "rc-tabs",
							role: "tablist",
							children: ["rooms", "policies"].map((e) => /* @__PURE__ */ (0, V.jsx)("button", {
								type: "button",
								role: "tab",
								className: "rc-tab",
								"aria-selected": l === e,
								onClick: () => u(e),
								children: r(`${c}tab_${e}`)
							}, e))
						}),
						/* @__PURE__ */ (0, V.jsx)("button", {
							type: "button",
							className: "rc-close",
							"aria-label": r(`${c}close`),
							onClick: e.onClose,
							children: "×"
						})
					]
				}),
				/* @__PURE__ */ (0, V.jsx)("div", {
					className: "rc-body",
					children: k
				}),
				/* @__PURE__ */ (0, V.jsxs)("footer", {
					className: "rc-footer",
					children: [/* @__PURE__ */ (0, V.jsx)("span", { children: r(`${c}hint`, { key: e.triggerLabel }) }), /* @__PURE__ */ (0, V.jsxs)("span", {
						className: "rc-version",
						children: ["v", ge]
					})]
				})
			]
		})
	});
}
function X(e, t, n) {
	return e(`${c}${t}_${n === 1 ? "one" : "other"}`, { count: String(n) });
}
function Z(e, t, n = Date.now()) {
	let r = (e - n) / 1e3, i = [
		["year", 31536e3],
		["month", 2592e3],
		["week", 604800],
		["day", 86400],
		["hour", 3600],
		["minute", 60]
	], a;
	try {
		a = new Intl.RelativeTimeFormat(t, { numeric: "auto" });
	} catch {
		a = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
	}
	for (let [e, t] of i) if (Math.abs(r) >= t) return a.format(Math.round(r / t), e);
	return a.format(0, "minute");
}
// src/index.tsx
var Q = "de.datanauten.room_checker", Fe = "de-datanauten-room-checker-style", $ = "__deDatanautenRoomChecker", Ie = "de.datanauten.room_checker.space", Le = 300;
function Re(e) {
	let t = e ?? {};
	if (typeof t != "object") throw Error("expected an object");
	let n = { trigger_key: "Alt+R" };
	if (t.trigger_key !== void 0) {
		if (typeof t.trigger_key != "string") throw Error("trigger_key must be a string");
		n.trigger_key = t.trigger_key;
	}
	return B(n.trigger_key), n;
}
var ze = class {
	api;
	static moduleApiVersion = "^2.0.0";
	trigger;
	container;
	root;
	client;
	revision = 0;
	recheckTimer;
	restoreFocus;
	history;
	target;
	constructor(e) {
		this.api = e;
	}
	async load() {
		let e;
		try {
			e = Re(this.api.config.get(Q));
		} catch (e) {
			throw console.error(`[room-checker] Invalid "${Q}" config`, e), Error("Errors in module configuration for the room checker module");
		}
		this.trigger = B(e.trigger_key);
		let t = window;
		t[$] ? console.warn("[room-checker] Loaded twice; the second copy does nothing") : (t[$] = this, this.api.i18n.register(l), He(), this.history = new a(this.api), window.addEventListener("keydown", this.onKeyDown, { capture: !0 }), this.api.extras?.addRoomHeaderButtonCallback?.((e) => this.headerBadge(e)));
	}
	dispose() {
		this.close(), window.removeEventListener("keydown", this.onKeyDown, { capture: !0 });
		let e = window;
		e[$] === this && delete e[$];
	}
	isOpen() {
		return !!this.root;
	}
	open(e) {
		if (this.root) return;
		this.target = e;
		let t = O();
		t?.getUserId?.() ? (this.client = t, t.on?.("RoomState.events", this.onStateEvent), this.restoreFocus = document.activeElement, this.container = document.createElement("div"), this.container.className = "de-datanauten-room-checker", document.body.appendChild(this.container), this.container.addEventListener("keydown", (e) => e.stopPropagation()), this.root = this.api.createRoot(this.container), this.render()) : console.warn("[room-checker] Element's Matrix client isn't available");
	}
	close() {
		this.root && (clearTimeout(this.recheckTimer), this.client?.removeListener?.("RoomState.events", this.onStateEvent), this.root.unmount(), this.container?.remove(), this.root = void 0, this.container = void 0, this.client = void 0, this.target = void 0, this.restoreFocus?.focus?.(), this.restoreFocus = void 0);
	}
	render() {
		let e = this.client;
		this.root && e && this.root.render(/* @__PURE__ */ (0, V.jsx)(Pe, {
			client: e,
			spaces: k(e),
			space: this.target?.space ?? Be(Ie),
			room: this.target?.room,
			history: this.history,
			revision: this.revision,
			language: this.api.i18n.language,
			triggerLabel: me(this.trigger),
			t: this.t,
			onSpaceChange: (e) => Ve(Ie, e),
			onOpenRoom: (e) => this.openRoom(e),
			onRoomSettings: (e) => this.openRoomSettings(e),
			onClose: () => this.close()
		}));
	}
	onStateEvent = () => {
		clearTimeout(this.recheckTimer), this.recheckTimer = setTimeout(() => {
			this.revision++, this.render();
		}, Le);
	};
	headerBadge(e) {
		try {
			let t = O(), n = t?.getUserId?.(), r = t?.getRoom(e);
			if (!t || !n || !r || r.getMyMembership() !== "join" || r.isSpaceRoom()) return;
			let i = k(t);
			for (let n of i) {
				let a = t.getRoom(n.id)?.currentState.getStateEvents("m.space.child", e)?.getContent().via;
				if (!Array.isArray(a) || !a.length) continue;
				let o = ee(t, n.id, i);
				if (!A(t, o.source).canEdit) continue;
				let s = D(le(r, n.id), o.policies, o.exceptions), l = s.errors + s.warnings;
				if (!l) continue;
				let u = this.t(`${c}badge`, {
					count: String(l),
					space: n.name
				});
				return /* @__PURE__ */ (0, V.jsxs)("button", {
					type: "button",
					className: `rc-badge rc-badge--${s.errors ? "error" : "warning"}`,
					"aria-label": u,
					title: u,
					onClick: () => this.open({
						space: n.id,
						room: e
					}),
					children: [/* @__PURE__ */ (0, V.jsx)("svg", {
						viewBox: "0 0 16 16",
						width: "16",
						height: "16",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, V.jsx)("path", {
							d: "M8 1.5 2.5 3.5v4c0 3.3 2.3 6 5.5 7 3.2-1 5.5-3.7 5.5-7v-4z",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.5",
							strokeLinejoin: "round"
						})
					}), /* @__PURE__ */ (0, V.jsx)("span", { children: l })]
				});
			}
		} catch (e) {
			console.warn("[room-checker] Room header badge failed", e);
		}
	}
	onKeyDown = (e) => {
		e.isComposing || e.defaultPrevented || !pe(e, this.trigger) || (e.preventDefault(), e.stopImmediatePropagation(), this.root ? this.close() : this.open());
	};
	openRoom(e) {
		this.close(), this.api.navigation.openRoom(e);
	}
	openRoomSettings(e) {
		this.close(), this.api.navigation.openRoom(e);
		let t = window.mxDispatcher;
		setTimeout(() => t?.dispatch({
			action: "open_room_settings",
			room_id: e
		}), 0);
	}
	t = (e, t) => this.api.i18n.translate(e, t);
};
function Be(e) {
	try {
		return localStorage.getItem(e) ?? void 0;
	} catch {
		return;
	}
}
function Ve(e, t) {
	try {
		localStorage.setItem(e, t);
	} catch {}
}
function He() {
	if (document.getElementById(Fe)) return;
	let e = document.createElement("style");
	e.id = Fe, e.textContent = he, document.head.appendChild(e);
}
export { Q as CONFIG_KEY, ze as RoomCheckerModule, ze as default, Re as parseConfig };

//# sourceMappingURL=index.js.map