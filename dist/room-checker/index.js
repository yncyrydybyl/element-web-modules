// \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), t = "datanauten_room_checker_", n = Object.fromEntries(Object.entries({
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
}).map(([e, n]) => [`${t}${e}`, n])), r = "de.datanauten.room_checker.policies", i = [
	"name",
	"topic",
	"avatar",
	"encryption",
	"join_rule",
	"history_visibility",
	"guest_access",
	"address",
	"admins",
	"space_parent"
], a = {
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
}, o = {
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
	}
};
function s(e) {
	let t = (e && typeof e == "object" ? e.policies : void 0) ?? {}, n = {};
	for (let e of i) {
		let r = o[e], i = t[e], s = i && typeof i == "object" ? i : {}, c = {
			enabled: typeof s.enabled == "boolean" ? s.enabled : r.enabled,
			severity: s.severity === "error" || s.severity === "warning" ? s.severity : r.severity
		};
		if (r.pattern !== void 0 && (c.pattern = typeof s.pattern == "string" && d(s.pattern) ? s.pattern : r.pattern), r.minLength !== void 0 && (c.minLength = f(s.minLength, 0, 1e3) ?? r.minLength), r.min !== void 0 && (c.min = f(s.min, 0, 100) ?? r.min), r.allowed !== void 0) {
			let t = a[e] ?? [], n = Array.isArray(s.allowed) ? t.filter((e) => s.allowed.includes(e)) : void 0;
			c.allowed = n?.length ? n : r.allowed;
		}
		n[e] = c;
	}
	return n;
}
function c(e) {
	let t = e && typeof e == "object" ? e.exceptions : void 0, n = {};
	if (!t || typeof t != "object") return n;
	for (let [e, r] of Object.entries(t)) if (e.startsWith("!") && r && typeof r == "object") for (let t of i) {
		let i = r[t];
		i && typeof i == "object" && typeof i.reason == "string" && typeof i.by == "string" && typeof i.at == "number" && ((n[e] ??= {})[t] = {
			reason: i.reason,
			by: i.by,
			at: i.at
		});
	}
	return n;
}
function l(e, t) {
	return {
		version: 1,
		policies: e,
		exceptions: t
	};
}
function u(e, t, n, r) {
	let i = { ...e[t] };
	r ? i[n] = r : delete i[n];
	let a = {
		...e,
		[t]: i
	};
	return Object.keys(i).length || delete a[t], a;
}
function d(e) {
	try {
		return new RegExp(e, "u"), !0;
	} catch {
		return !1;
	}
}
function f(e, t, n) {
	return typeof e == "number" && Number.isInteger(e) && e >= t && e <= n ? e : void 0;
}
var p = { status: "pass" }, m = 100;
function h(e, t, n) {
	let r = (e, t) => ({
		status: "fail",
		detail: {
			key: e,
			vars: t
		}
	});
	switch (e) {
		case "name": {
			let e = String(t.state("m.room.name")?.name ?? "").trim();
			return e ? n.pattern && !new RegExp(n.pattern, "u").test(e) ? r("name_pattern", { pattern: n.pattern }) : p : r("name_missing");
		}
		case "topic": {
			let e = g(t.state("m.room.topic"));
			if (!e) return r("topic_missing");
			let i = n.minLength ?? 0;
			return Array.from(e).length < i ? r("topic_short", { min: String(i) }) : p;
		}
		case "avatar": return t.state("m.room.avatar")?.url ? p : r("avatar_missing");
		case "encryption": return t.state("m.room.encryption")?.algorithm ? p : r("encryption_off");
		case "join_rule": {
			let e = String(t.state("m.room.join_rules")?.join_rule ?? "invite");
			return n.allowed?.includes(e) ? p : r("join_rule", { value: e });
		}
		case "history_visibility": {
			let e = String(t.state("m.room.history_visibility")?.history_visibility ?? "shared");
			return n.allowed?.includes(e) ? p : r("history_visibility", { value: e });
		}
		case "guest_access": return t.state("m.room.guest_access")?.guest_access === "can_join" ? r("guest_access") : p;
		case "address": return t.state("m.room.canonical_alias")?.alias ? p : r("address_missing");
		case "admins": {
			let e = _(t).length, i = n.min ?? 1;
			return e >= i ? p : r("admins", {
				count: String(e),
				min: String(i)
			});
		}
		case "space_parent": {
			let e = t.state("m.space.parent", t.parentSpace)?.via;
			return Array.isArray(e) && e.length ? p : r("space_parent");
		}
	}
}
function g(e) {
	if (!e) return "";
	if (typeof e.topic == "string" && e.topic.trim()) return e.topic.trim();
	let t = e["m.topic"]?.["m.text"], n = t?.find((e) => !e.mimetype || e.mimetype === "text/plain") ?? t?.[0];
	return typeof n?.body == "string" ? n.body.trim() : "";
}
function _(e) {
	let t = e.state("m.room.power_levels")?.users ?? {}, n = new Set(e.creators ?? []);
	for (let [e, r] of Object.entries(t)) typeof r == "number" && r >= m && n.add(e);
	return [...n].filter((t) => e.state("m.room.member", t)?.membership === "join");
}
function v(e, t, n) {
	return !/^\d+$/.test(String(e ?? "1")) || Number(e) < 12 || !t ? [] : [t, ...Array.isArray(n) ? n.filter((e) => typeof e == "string") : []];
}
function y(e, t, n = {}) {
	let r = /* @__PURE__ */ new Map(), a = {
		results: r,
		errors: 0,
		warnings: 0,
		unknown: 0
	};
	for (let o of i) {
		let i = t[o];
		if (!i.enabled) continue;
		let s = e.unknown?.(o, i) ? { status: "unknown" } : h(o, e, i), c = n[e.id]?.[o];
		s.status === "fail" && c && (s = {
			...s,
			status: "excepted",
			exception: c
		}), r.set(o, s), s.status === "unknown" ? a.unknown++ : s.status === "fail" && a[i.severity === "error" ? "errors" : "warnings"]++;
	}
	return a;
}
// src/space.ts
function b() {
	let e = window.mxMatrixClientPeg;
	try {
		return e?.get?.() ?? void 0;
	} catch {
		return;
	}
}
function x(e) {
	let t = e.getVisibleRooms().filter((e) => e.isSpaceRoom() && e.getMyMembership() === "join"), n = new Set(t.map((e) => e.roomId)), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Set();
	for (let e of t) {
		let t = e.currentState.getStateEvents("m.space.child").filter((e) => Array.isArray(e.getContent().via) && e.getContent().via.length).map((e) => e.getStateKey()).filter((t) => n.has(t) && t !== e.roomId);
		r.set(e.roomId, t), t.forEach((e) => i.add(e));
	}
	let a = (t) => e.getRoom(t)?.name || t, o = (e, t) => a(e).localeCompare(a(t)), s = [], c = /* @__PURE__ */ new Set(), l = (e, t) => {
		if (!c.has(e)) {
			c.add(e), s.push({
				id: e,
				name: a(e),
				depth: t
			});
			for (let n of [...r.get(e) ?? []].sort(o)) l(n, t + 1);
		}
	};
	for (let e of [...n].filter((e) => !i.has(e)).sort(o)) l(e, 0);
	for (let e of [...n].sort(o)) l(e, 0);
	return s;
}
function S(e, t) {
	let n = e.getRoom(t), i = n?.currentState.getStateEvents(r, ""), a = i?.getContent(), o = !!(a && Object.keys(a).length), l = e.getUserId() ?? "";
	return {
		policies: s(o ? a : void 0),
		exceptions: c(a),
		saved: o,
		by: o ? i?.getSender?.() : void 0,
		at: o ? i?.getTs?.() : void 0,
		canEdit: !!n?.currentState.maySendStateEvent(r, l)
	};
}
function C(e, t, n) {
	let i = S(e, t);
	return e.sendStateEvent(t, r, l(n, i.exceptions), "");
}
function w(e, t, n, i, a) {
	let o = S(e, t), s = a === void 0 ? void 0 : {
		reason: a,
		by: e.getUserId() ?? "",
		at: Date.now()
	};
	return e.sendStateEvent(t, r, l(o.policies, u(o.exceptions, n, i, s)), "");
}
function ee(e, t, n, r = {}, i = /* @__PURE__ */ new Map()) {
	let a = [], o = /* @__PURE__ */ new Set([t]), s = [t];
	for (; s.length;) {
		let t = s.shift();
		for (let c of T(e, t, i)) {
			if (o.has(c)) continue;
			o.add(c);
			let l = e.getRoom(c), u = l && l.getMyMembership() === "join" ? l : void 0, d = i.get(c);
			if (u ? u.isSpaceRoom() : d?.room_type === "m.space") {
				s.push(c);
				continue;
			}
			let f = {
				id: c,
				name: u?.name || d?.name || d?.canonical_alias || c,
				parentSpace: t,
				room: u
			}, p = u ? E(u, t) : d ? ae(d, t) : void 0;
			p && (f.report = y(p, n, r)), a.push(f);
		}
	}
	return a;
}
function T(e, t, n) {
	let r = e.getRoom(t);
	return (r && r.getMyMembership() === "join" ? r.currentState.getStateEvents("m.space.child").map((e) => ({
		state_key: e.getStateKey(),
		content: e.getContent()
	})) : n.get(t)?.children_state ?? []).filter((e) => e.state_key && Array.isArray(e.content?.via) && e.content.via.length).map((e) => e.state_key);
}
var te = 20;
async function ne(e, t) {
	let n = /* @__PURE__ */ new Map(), r;
	try {
		for (let i = 0; i < te && e.getRoomHierarchy; i++) {
			let i = await e.getRoomHierarchy(t, 100, void 0, !1, r);
			for (let e of i.rooms ?? []) n.set(e.room_id, e);
			if (r = i.next_batch, !r) break;
		}
	} catch {}
	return n;
}
var re = /* @__PURE__ */ new Set(["admins", "space_parent"]), ie = [
	"joined",
	"invited",
	"shared"
];
function ae(e, t) {
	let n = e.encryption ?? e["im.nheko.summary.encryption"], r = n !== void 0 || e.room_version !== void 0, i = {
		"m.room.name": e.name ? { name: e.name } : void 0,
		"m.room.topic": e.topic ? { topic: e.topic } : void 0,
		"m.room.avatar": e.avatar_url ? { url: e.avatar_url } : void 0,
		"m.room.canonical_alias": e.canonical_alias ? { alias: e.canonical_alias } : void 0,
		"m.room.join_rules": e.join_rule ? { join_rule: e.join_rule } : void 0,
		"m.room.encryption": n ? { algorithm: n } : void 0,
		"m.room.guest_access": { guest_access: e.guest_can_join ? "can_join" : "forbidden" },
		"m.room.history_visibility": { history_visibility: e.world_readable ? "world_readable" : "shared" }
	};
	return {
		id: e.room_id,
		parentSpace: t,
		state: (e, t = "") => t ? void 0 : i[e],
		unknown: (t, n) => re.has(t) || t === "encryption" && !r || t === "join_rule" && !e.join_rule || t === "history_visibility" && !e.world_readable && !ie.every((e) => n.allowed?.includes(e))
	};
}
function E(e, t) {
	let n = e.currentState.getStateEvents("m.room.create", ""), r = n?.getContent() ?? {};
	return {
		id: e.roomId,
		parentSpace: t,
		creators: v(r.room_version, n?.getSender?.(), r.additional_creators),
		state: (t, n = "") => {
			let r = e.currentState.getStateEvents(t, n)?.getContent();
			return r && Object.keys(r).length ? r : void 0;
		}
	};
}
function D(e) {
	return g(e.currentState.getStateEvents("m.room.topic", "")?.getContent());
}
var O = {
	name: "m.room.name",
	topic: "m.room.topic",
	avatar: "m.room.avatar",
	encryption: "m.room.encryption",
	join_rule: "m.room.join_rules",
	history_visibility: "m.room.history_visibility",
	guest_access: "m.room.guest_access",
	address: "m.room.canonical_alias",
	space_parent: "m.space.parent"
}, k = {
	name: "text",
	topic: "text",
	avatar: "file",
	address: "text"
};
function A(e, t, n) {
	let r = O[n], i = e.getUserId();
	return !!(r && i && t.room?.currentState.maySendStateEvent(r, i));
}
function j(e, t) {
	return e === "join_rule" || e === "history_visibility" ? t.allowed?.[0] : void 0;
}
function M(e) {
	return e.slice(e.indexOf(":") + 1);
}
async function N(e, t, n, r, i) {
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
			let e = j(n, r), i = { join_rule: e };
			(e === "restricted" || e === "knock_restricted") && (i.allow = [{
				type: "m.room_membership",
				room_id: t.parentSpace
			}]), await s("m.room.join_rules", i);
			return;
		}
		case "history_visibility":
			await s("m.room.history_visibility", { history_visibility: j(n, r) });
			return;
		case "guest_access":
			await s("m.room.guest_access", { guest_access: "forbidden" });
			return;
		case "address": {
			let n = e.getDomain?.() ?? M(e.getUserId() ?? ""), r = `#${o.replace(/^#/, "").replace(/:.*$/, "")}:${n}`;
			await e.createAlias(r, a), await s("m.room.canonical_alias", {
				...t.room?.currentState.getStateEvents("m.room.canonical_alias", "")?.getContent() ?? {},
				alias: r
			});
			return;
		}
		case "space_parent":
			await s("m.space.parent", {
				via: [M(t.parentSpace)],
				canonical: !0
			}, t.parentSpace);
			return;
		case "admins": throw Error("can't be fixed here");
	}
}
function P(e) {
	return e.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9._=-]+/g, "-").replace(/^-+|-+$/g, "");
}
// src/trigger.ts
var F = typeof navigator < "u" && navigator.platform.toUpperCase().includes("MAC");
function I(e, t = F) {
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
function oe(e, t) {
	let n = e.key.length === 1 ? e.key.toLowerCase() : e.key, r = /^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : void 0;
	return (n === t.key || !/^[a-z]$/.test(n) && r === t.key) && e.ctrlKey === t.ctrl && e.metaKey === t.meta && e.altKey === t.alt && e.shiftKey === t.shift;
}
function se(e, t = F) {
	let n = [
		e.ctrl && (t ? "⌃" : "Ctrl"),
		e.alt && (t ? "⌥" : "Alt"),
		e.shift && (t ? "⇧" : "Shift"),
		e.meta && (t ? "⌘" : "Meta")
	], r = e.key.length === 1 ? e.key.toUpperCase() : e.key;
	return [...n.filter(Boolean), r].join(t ? "" : "+");
}
// src/ui/checker.css?inline
var ce = ".de-datanauten-room-checker{--rc-error:var(--cpd-color-icon-critical-primary,#d51928);--rc-error-bg:var(--cpd-color-bg-critical-subtle,#fff0f0);--rc-warning:var(--cpd-color-orange-900,#bc4500);--rc-warning-bg:var(--cpd-color-orange-300,#ffefe4);--rc-pass:var(--cpd-color-icon-success-primary,#007a62);--rc-pass-bg:var(--cpd-color-bg-success-subtle,#e0f8d9);--rc-line:var(--cpd-color-border-interactive-secondary,#e1e6ec);--rc-muted:var(--cpd-color-text-secondary,#656d77);--rc-subtle:var(--cpd-color-bg-subtle-secondary,#f0f2f5);--rc-focus:var(--cpd-color-border-focused,#0467dd)}.rc-backdrop{z-index:5000;font-family:var(--cpd-font-family-sans,Inter, system-ui, sans-serif);background:#0000008c;justify-content:center;align-items:center;padding:3vh 3vw;animation:.1s ease-out rc-fade;display:flex;position:fixed;inset:0}@keyframes rc-fade{0%{opacity:0}}.rc-panel{background:var(--cpd-color-bg-canvas-default,#fff);width:100%;max-width:1440px;height:100%;color:var(--cpd-color-text-primary,#1b1d22);border-radius:16px;outline:none;flex-direction:column;display:flex;overflow:hidden;box-shadow:0 24px 64px #00000059}.rc-panel :focus-visible{outline:2px solid var(--rc-focus);outline-offset:1px}.rc-header{border-bottom:1px solid var(--rc-line);flex-wrap:wrap;align-items:center;gap:12px 20px;padding:12px 16px;display:flex}.rc-title{margin:0;font-size:18px;font-weight:600;line-height:24px}.rc-space{color:var(--rc-muted);align-items:center;gap:8px;font-size:13px;display:flex}.rc-panel select,.rc-panel input:not([type=checkbox]),.rc-panel textarea{box-sizing:border-box;border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;border-radius:6px;padding:5px 8px;font-size:14px}.rc-space select{max-width:280px;font-weight:600}.rc-tabs{flex:1;gap:4px;display:flex}.rc-tab{color:var(--rc-muted);font:inherit;cursor:pointer;background:0 0;border:none;border-radius:999px;padding:6px 14px;font-size:14px;font-weight:600}.rc-tab:hover{background:var(--rc-subtle)}.rc-tab[aria-selected=true]{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff)}.rc-close{width:36px;height:36px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:none;border-radius:50%;font-size:24px;line-height:1}.rc-close:hover{background:var(--rc-subtle);color:inherit}.rc-body{flex-direction:column;flex:1;min-height:0;display:flex}.rc-footer{border-top:1px solid var(--rc-line);color:var(--rc-muted);align-items:center;gap:12px;padding:8px 16px;font-size:12px;display:flex}.rc-footer>span{flex:1}.rc-footer>.rc-version{opacity:.7;font-variant-numeric:tabular-nums;flex:none}.rc-empty{color:var(--rc-muted);text-align:center;padding:48px 16px}.rc-rooms{flex:1;min-height:0;display:flex}.rc-main{flex-direction:column;flex:1;min-width:0;display:flex;overflow-y:auto}.rc-summary{border-bottom:1px solid var(--rc-line);grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px 32px;padding:16px;display:grid}.rc-stats{flex-wrap:wrap;align-content:start;gap:8px;display:flex}.rc-stat{border:1px solid var(--rc-line);min-width:96px;color:inherit;font:inherit;text-align:left;background:0 0;border-radius:12px;flex-direction:column;padding:10px 14px;display:flex}button.rc-stat{cursor:pointer}button.rc-stat:hover{background:var(--rc-subtle)}.rc-stat[aria-pressed=true]{border-color:var(--rc-focus);box-shadow:inset 0 0 0 1px var(--rc-focus)}.rc-stat-value{font-variant-numeric:tabular-nums;font-size:24px;font-weight:700;line-height:30px}.rc-stat-label{color:var(--rc-muted);font-size:12px}.rc-stat--error .rc-stat-value{color:var(--rc-error)}.rc-stat--warning .rc-stat-value{color:var(--rc-warning)}.rc-stat--pass .rc-stat-value{color:var(--rc-pass)}.rc-stat--unchecked .rc-stat-value{color:var(--rc-muted)}.rc-compliance{grid-column:1;align-items:center;gap:10px;font-size:13px;display:flex}.rc-meter,.rc-bar-track{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);border-radius:4px;height:8px;display:block;overflow:hidden}.rc-meter{flex:none;width:160px}.rc-meter>span,.rc-bar-track>span{border-radius:4px;height:100%;display:block}.rc-meter>span{background:var(--rc-pass)}.rc-section-title{color:var(--rc-muted);letter-spacing:.04em;text-transform:uppercase;grid-area:1/2;font-size:12px;font-weight:600}.rc-bars{flex-direction:column;grid-area:1/2/span 3;gap:2px;margin-top:22px;display:flex}.rc-bar{color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:none;border-radius:6px;grid-template-columns:150px 1fr 32px;align-items:center;gap:10px;padding:3px 6px;font-size:13px;display:grid}.rc-bar:hover:not(:disabled){background:var(--rc-subtle)}.rc-bar:disabled{cursor:default;opacity:.55}.rc-bar[aria-pressed=true]{background:var(--cpd-color-bg-action-secondary-hovered,#f0f2f5);box-shadow:inset 3px 0 0 var(--rc-focus)}.rc-bar--error .rc-bar-track>span{background:var(--rc-error)}.rc-bar--warning .rc-bar-track>span{background:var(--rc-warning)}.rc-bar-count{text-align:right;font-variant-numeric:tabular-nums}.rc-toolbar{flex-wrap:wrap;align-items:center;gap:8px 12px;padding:12px 16px 8px;display:flex}.rc-panel .rc-search{width:240px;height:32px}.rc-chips{flex-wrap:wrap;gap:6px;display:flex}.rc-chip{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);color:inherit;font:inherit;cursor:pointer;background:0 0;border-radius:999px;padding:4px 12px;font-size:13px}.rc-chip[aria-pressed=true]{border-color:var(--cpd-color-bg-action-primary-rest,#1b1d22);background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff)}.rc-table-wrap{padding:0 16px 16px;overflow-x:auto}.rc-table{border-collapse:separate;border-spacing:0;width:100%;font-size:14px}.rc-table thead th{z-index:1;border-bottom:1px solid var(--rc-line);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--rc-muted);vertical-align:bottom;padding:8px 4px;font-size:12px;font-weight:600;position:sticky;top:0}.rc-col-room{text-align:left;min-width:200px}.rc-col-policy{text-align:center;width:72px}.rc-col-policy>span{line-height:14px;display:block}.rc-row{cursor:pointer}.rc-row>*{border-bottom:1px solid var(--rc-line);padding:6px 4px}.rc-row:hover>*{background:var(--rc-subtle)}.rc-row[aria-selected=true]>*{background:var(--cpd-color-bg-action-secondary-hovered,#f0f2f5)}.rc-row[aria-selected=true]>:first-child{box-shadow:inset 3px 0 0 var(--rc-focus)}.rc-row>th{padding-left:8px;font-weight:400}.rc-room-name,.rc-room-meta{white-space:nowrap;text-overflow:ellipsis;max-width:360px;display:block;overflow:hidden}.rc-room-name{font-weight:600}.rc-room-meta{color:var(--rc-muted);font-size:12px}.rc-cell{text-align:center}.rc-status{border-radius:50%;flex:none;justify-content:center;align-items:center;width:22px;height:22px;font-size:13px;font-weight:700;line-height:1;display:inline-flex}.rc-status--pass{background:var(--rc-pass-bg);color:var(--rc-pass)}.rc-status--error{background:var(--rc-error);color:var(--cpd-color-text-on-solid-primary,#fff)}.rc-status--warning{background:var(--rc-warning-bg);color:var(--rc-warning);box-shadow:inset 0 0 0 1.5px var(--rc-warning)}.rc-detail{border-left:1px solid var(--rc-line);flex-direction:column;flex:none;gap:6px;width:380px;padding:12px 16px 16px;display:flex;overflow-y:auto}.rc-back{color:var(--rc-muted);font:inherit;cursor:pointer;background:0 0;border:none;align-self:flex-start;padding:2px 4px;font-size:13px;font-weight:600}.rc-detail-name{overflow-wrap:anywhere;font-size:18px;font-weight:600}.rc-detail-id{color:var(--rc-muted);overflow-wrap:anywhere;font-size:12px}.rc-actions,.rc-fix-buttons{flex-wrap:wrap;gap:8px;margin:6px 0;display:flex}.rc-button{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;border-radius:999px;padding:5px 14px;font-size:13px;font-weight:600}.rc-button:disabled{cursor:default;opacity:.5}.rc-button--primary{border-color:var(--cpd-color-bg-action-primary-rest,#1b1d22);background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff)}.rc-checks{flex-direction:column;margin:4px 0 0;padding:0;list-style:none;display:flex}.rc-check{border-top:1px solid var(--rc-line);gap:10px;padding:10px 0;display:flex}.rc-check-body{flex:1;min-width:0}.rc-check-name{align-items:center;gap:8px;font-size:14px;font-weight:600;display:flex}.rc-check-detail{color:var(--rc-muted);font-size:13px}.rc-tag{border-radius:999px;padding:0 7px;font-size:11px;font-weight:600}.rc-tag--error{background:var(--rc-error-bg);color:var(--rc-error)}.rc-tag--warning{background:var(--rc-warning-bg);color:var(--rc-warning)}.rc-fix{margin-top:6px}.rc-fix-form{flex-direction:column;gap:6px;margin-top:6px;display:flex}.rc-fix-form input,.rc-fix-form textarea{width:100%}.rc-note{color:var(--rc-muted);margin:4px 0 0;font-size:12px}.rc-note--error{color:var(--rc-error)}.rc-note--ok{color:var(--rc-pass)}.rc-policies{flex-direction:column;flex:1;min-height:0;display:flex}.rc-policies-intro{padding:12px 16px 0;font-size:14px}.rc-policies-intro p{margin:0 0 6px}.rc-policies-scroll{flex:1;min-height:0;overflow-y:auto}.rc-policy-list{grid-template-columns:repeat(auto-fill,minmax(320px,1fr));align-content:start;gap:12px;margin:0;padding:12px 16px 16px;list-style:none;display:grid}.rc-policy{border:1px solid var(--rc-line);border-radius:12px;flex-direction:column;gap:8px;padding:12px 14px;display:flex}.rc-policy[data-enabled=false]{background:var(--rc-subtle)}.rc-policy[data-enabled=false] .rc-policy-desc{opacity:.7}.rc-switch{cursor:pointer;align-items:center;gap:10px;display:flex}.rc-switch input{width:18px;height:18px;accent-color:var(--cpd-color-bg-action-primary-rest,#1b1d22);margin:0}.rc-policy-name{font-size:15px;font-weight:600}.rc-policy-desc{color:var(--rc-muted);margin:0;font-size:13px}.rc-field{border:none;flex-direction:column;gap:4px;margin:0;padding:0;font-size:13px;display:flex}.rc-field>span:first-child,.rc-field>legend{color:var(--rc-muted);font-size:12px}.rc-field--inline{flex-direction:row;justify-content:space-between;align-items:center}.rc-panel .rc-field--inline input{width:72px}.rc-field input[aria-invalid=true]{border-color:var(--rc-error)}.rc-options{flex-wrap:wrap;gap:4px 14px;display:flex}.rc-option{align-items:center;gap:6px;display:flex}.rc-hint{color:var(--rc-muted);font-size:11px}.rc-savebar{border-top:1px solid var(--rc-line);justify-content:flex-end;align-items:center;gap:10px;padding:10px 16px;display:flex}@media (width<=900px){.rc-summary{grid-template-columns:1fr}.rc-section-title,.rc-bars{grid-area:auto/1;margin-top:0}.rc-detail{width:300px}}@media (width<=640px){.rc-backdrop{padding:0}.rc-panel{border-radius:0}.rc-rooms--detail .rc-main{display:none}.rc-detail{border-left:none;flex:1;width:auto}}@media (prefers-reduced-motion:reduce){.rc-backdrop{animation:none}}.rc-status--excepted{color:var(--rc-muted);box-shadow:inset 0 0 0 1.5px var(--rc-muted);opacity:.8}.rc-status--unknown{color:var(--rc-muted);font-weight:600}.rc-status--none{color:var(--rc-muted)}.rc-tag--excepted{background:var(--rc-subtle);color:var(--rc-muted)}.rc-excepted-count{color:var(--rc-muted)}.rc-link{color:var(--cpd-color-text-link-external,#0467dd);font:inherit;cursor:pointer;background:0 0;border:none;align-self:flex-start;margin-top:4px;padding:0;font-size:12px;font-weight:600}.rc-link:disabled{cursor:default;opacity:.5}.rc-exception{flex-direction:column;margin-top:4px;display:flex}.rc-exception-reason{font-size:13px;font-style:italic}.rc-bulk{background:var(--rc-subtle);border-radius:12px;flex-wrap:wrap;align-items:center;gap:6px 12px;margin:0 16px 8px;padding:10px 14px;font-size:13px;display:flex}.rc-bulk .rc-note,.rc-bulk .rc-fix-buttons{margin:0}.rc-bulk-list{flex-basis:100%;max-height:160px;margin:0;padding-left:20px;overflow-y:auto}.rc-exceptions{flex-direction:column;gap:8px;padding:0 16px 16px;display:flex}.rc-exception-list{flex-direction:column;margin:0;padding:0;list-style:none;display:flex}.rc-exception-list>li{border-top:1px solid var(--rc-line);flex-wrap:wrap;align-items:baseline;gap:4px 12px;padding:8px 0;font-size:13px;display:flex}.rc-exception-list .rc-note,.rc-exception-list .rc-link{margin:0}", le = "0.2.0", ue = /* @__PURE__ */ e(((e) => {
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
})), L = (/* @__PURE__ */ e(((e, t) => {
	t.exports = ue();
})))();
function de(e) {
	let { space: n, t: r } = e, [a, o] = window.React.useState(n.policies), [s, c] = window.React.useState("idle"), l = JSON.stringify(a) !== JSON.stringify(n.policies), u = a.name.pattern !== void 0 && !d(a.name.pattern), f = !n.canEdit;
	window.React.useEffect(() => {
		l || o(n.policies);
	}, [n]);
	let p = (e, t) => {
		o((n) => ({
			...n,
			[e]: {
				...n[e],
				...t
			}
		})), c("idle");
	}, m = async () => {
		c("saving");
		try {
			await C(e.client, e.spaceId, a), c("saved");
		} catch (e) {
			c({ error: e instanceof Error ? e.message : String(e) });
		}
	};
	return /* @__PURE__ */ (0, L.jsxs)("div", {
		className: "rc-policies",
		children: [
			/* @__PURE__ */ (0, L.jsxs)("div", {
				className: "rc-policies-intro",
				children: [/* @__PURE__ */ (0, L.jsxs)("p", { children: [
					n.saved && n.at ? r(`${t}policies_saved`, {
						user: n.by ?? "?",
						when: J(n.at, e.language)
					}) : r(`${t}policies_defaults`),
					" ",
					r(`${t}policies_scope`)
				] }), f && /* @__PURE__ */ (0, L.jsx)("p", {
					className: "rc-note",
					children: r("datanauten_room_checker_policies_readonly")
				})]
			}),
			/* @__PURE__ */ (0, L.jsxs)("div", {
				className: "rc-policies-scroll",
				children: [/* @__PURE__ */ (0, L.jsx)("ul", {
					className: "rc-policy-list",
					children: i.map((e) => /* @__PURE__ */ (0, L.jsx)(fe, {
						id: e,
						config: a[e],
						readOnly: f,
						t: r,
						onChange: (t) => p(e, t)
					}, e))
				}), /* @__PURE__ */ (0, L.jsx)(z, { ...e })]
			}),
			!f && /* @__PURE__ */ (0, L.jsxs)("div", {
				className: "rc-savebar",
				children: [
					typeof s == "object" && /* @__PURE__ */ (0, L.jsx)("span", {
						className: "rc-note rc-note--error",
						children: r("datanauten_room_checker_fix_failed", { error: s.error })
					}),
					s === "saved" && !l && /* @__PURE__ */ (0, L.jsx)("span", {
						className: "rc-note rc-note--ok",
						children: r("datanauten_room_checker_saved")
					}),
					/* @__PURE__ */ (0, L.jsx)("button", {
						type: "button",
						className: "rc-button",
						disabled: !l || s === "saving",
						onClick: () => o(n.policies),
						children: r("datanauten_room_checker_discard")
					}),
					/* @__PURE__ */ (0, L.jsx)("button", {
						type: "button",
						className: "rc-button rc-button--primary",
						disabled: !l && n.saved || u || s === "saving",
						onClick: () => void m(),
						children: r(s === "saving" ? "datanauten_room_checker_saving" : "datanauten_room_checker_save_policies")
					})
				]
			})
		]
	});
}
function fe(e) {
	let { id: n, config: r, readOnly: i, t: o } = e, s = a[n], c = r.pattern === void 0 || d(r.pattern);
	return /* @__PURE__ */ (0, L.jsxs)("li", {
		className: "rc-policy",
		"data-enabled": r.enabled,
		children: [
			/* @__PURE__ */ (0, L.jsxs)("label", {
				className: "rc-switch",
				children: [/* @__PURE__ */ (0, L.jsx)("input", {
					type: "checkbox",
					role: "switch",
					checked: r.enabled,
					disabled: i,
					onChange: (t) => e.onChange({ enabled: t.target.checked })
				}), /* @__PURE__ */ (0, L.jsx)("span", {
					className: "rc-policy-name",
					children: o(`${t}policy_${n}`)
				})]
			}),
			/* @__PURE__ */ (0, L.jsx)("p", {
				className: "rc-policy-desc",
				children: o(`${t}policy_${n}_desc`)
			}),
			/* @__PURE__ */ (0, L.jsxs)("label", {
				className: "rc-field rc-field--inline",
				children: [/* @__PURE__ */ (0, L.jsx)("span", { children: o(`${t}severity`) }), /* @__PURE__ */ (0, L.jsxs)("select", {
					value: r.severity,
					disabled: i || !r.enabled,
					"aria-label": `${o(`${t}policy_${n}`)}: ${o(`${t}severity`)}`,
					onChange: (t) => e.onChange({ severity: t.target.value }),
					children: [/* @__PURE__ */ (0, L.jsx)("option", {
						value: "error",
						children: o(`${t}severity_error`)
					}), /* @__PURE__ */ (0, L.jsx)("option", {
						value: "warning",
						children: o(`${t}severity_warning`)
					})]
				})]
			}),
			r.pattern !== void 0 && /* @__PURE__ */ (0, L.jsxs)("label", {
				className: "rc-field",
				children: [
					/* @__PURE__ */ (0, L.jsx)("span", { children: o("datanauten_room_checker_param_pattern") }),
					/* @__PURE__ */ (0, L.jsx)("input", {
						value: r.pattern,
						disabled: i || !r.enabled,
						placeholder: "^[A-Z].*",
						"aria-invalid": !c,
						spellCheck: !1,
						onChange: (t) => e.onChange({ pattern: t.target.value })
					}),
					!c && /* @__PURE__ */ (0, L.jsx)("span", {
						className: "rc-note rc-note--error",
						children: o("datanauten_room_checker_param_pattern_invalid")
					})
				]
			}),
			r.minLength !== void 0 && /* @__PURE__ */ (0, L.jsx)(R, {
				label: o("datanauten_room_checker_param_min_length"),
				value: r.minLength,
				max: 1e3,
				disabled: i || !r.enabled,
				onChange: (t) => e.onChange({ minLength: t })
			}),
			r.min !== void 0 && /* @__PURE__ */ (0, L.jsx)(R, {
				label: o("datanauten_room_checker_param_min"),
				value: r.min,
				max: 100,
				disabled: i || !r.enabled,
				onChange: (t) => e.onChange({ min: t })
			}),
			s && r.allowed && /* @__PURE__ */ (0, L.jsxs)("fieldset", {
				className: "rc-field",
				disabled: i || !r.enabled,
				children: [
					/* @__PURE__ */ (0, L.jsx)("legend", { children: o("datanauten_room_checker_param_allowed") }),
					/* @__PURE__ */ (0, L.jsx)("div", {
						className: "rc-options",
						children: s.map((t) => /* @__PURE__ */ (0, L.jsxs)("label", {
							className: "rc-option",
							children: [/* @__PURE__ */ (0, L.jsx)("input", {
								type: "checkbox",
								checked: r.allowed.includes(t),
								disabled: r.allowed.length === 1 && r.allowed[0] === t,
								onChange: (n) => e.onChange({ allowed: n.target.checked ? s.filter((e) => e === t || r.allowed.includes(e)) : r.allowed.filter((e) => e !== t) })
							}), o(`datanauten_room_checker_value_${t}`)]
						}, t))
					}),
					/* @__PURE__ */ (0, L.jsx)("span", {
						className: "rc-hint",
						children: o("datanauten_room_checker_param_allowed_fix")
					})
				]
			})
		]
	});
}
function R(e) {
	return /* @__PURE__ */ (0, L.jsxs)("label", {
		className: "rc-field rc-field--inline",
		children: [/* @__PURE__ */ (0, L.jsx)("span", { children: e.label }), /* @__PURE__ */ (0, L.jsx)("input", {
			type: "number",
			min: 0,
			max: e.max,
			step: 1,
			value: e.value,
			disabled: e.disabled,
			onChange: (t) => {
				let n = Math.round(Number(t.target.value));
				Number.isFinite(n) && e.onChange(Math.max(0, Math.min(e.max, n)));
			}
		})]
	});
}
function z(e) {
	let { space: n, t: r } = e, [a, o] = window.React.useState(), s = Object.entries(n.exceptions).flatMap(([e, t]) => i.filter((e) => t[e]).map((n) => ({
		roomId: e,
		id: n,
		ex: t[n]
	})));
	return /* @__PURE__ */ (0, L.jsxs)("section", {
		className: "rc-exceptions",
		"aria-label": r(`${t}exceptions_title`),
		children: [
			/* @__PURE__ */ (0, L.jsx)("div", {
				className: "rc-section-title",
				children: r(`${t}exceptions_title`)
			}),
			s.length === 0 ? /* @__PURE__ */ (0, L.jsx)("p", {
				className: "rc-note",
				children: r(`${t}exceptions_none`)
			}) : /* @__PURE__ */ (0, L.jsx)("ul", {
				className: "rc-exception-list",
				children: s.map(({ roomId: i, id: a, ex: s }) => /* @__PURE__ */ (0, L.jsxs)("li", { children: [
					/* @__PURE__ */ (0, L.jsxs)("span", {
						className: "rc-exception-what",
						children: [
							/* @__PURE__ */ (0, L.jsx)("strong", { children: e.roomName(i) }),
							" · ",
							r(`${t}policy_${a}`)
						]
					}),
					/* @__PURE__ */ (0, L.jsxs)("span", {
						className: "rc-exception-reason",
						children: [
							"“",
							s.reason,
							"”"
						]
					}),
					/* @__PURE__ */ (0, L.jsx)("span", {
						className: "rc-note",
						children: r(`${t}excepted_by`, {
							user: s.by,
							when: J(s.at, e.language)
						})
					}),
					n.canEdit && /* @__PURE__ */ (0, L.jsx)("button", {
						type: "button",
						className: "rc-link",
						onClick: () => void w(e.client, e.spaceId, i, a).catch((e) => o(e instanceof Error ? e.message : String(e))),
						children: r("datanauten_room_checker_remove")
					})
				] }, `${i}|${a}`))
			}),
			a && /* @__PURE__ */ (0, L.jsx)("p", {
				className: "rc-note rc-note--error",
				children: r("datanauten_room_checker_fix_failed", { error: a })
			})
		]
	});
}
// src/ui/RoomsTab.tsx
var B = (e, t) => e.report?.results.get(t), V = (e, t) => B(e, t)?.status === "fail", H = (e) => !(!e.report || e.report.errors || e.report.warnings || e.report.unknown);
function pe(e) {
	let { entries: n, policies: r, filter: a, t: o } = e, s = i.filter((e) => r[e].enabled), c = n.filter((e) => e.room), l = n.filter(H).length, u = n.filter((e) => e.report?.errors).length, d = n.filter((e) => e.report && !e.report.errors && e.report.warnings).length, f = n.length - c.length, p = n.reduce((e, t) => e + [...t.report?.results.values() ?? []].filter((e) => e.status === "excepted").length, 0), m = c.length ? Math.round(c.filter(H).length / c.length * 100) : 0, h = e.query.trim().toLowerCase(), g = n.filter((e) => h && !e.name.toLowerCase().includes(h) && !e.id.toLowerCase().includes(h) ? !1 : a === "failing" ? !!(e.report && (e.report.errors || e.report.warnings)) : a === "errors" ? !!e.report?.errors : a === "warnings" ? !!(e.report && !e.report.errors && e.report.warnings) : a === "unchecked" ? !e.room : a === "all" || V(e, a)).sort((e, t) => U(t) - U(e) || Number(!!t.room) - Number(!!e.room) || e.name.localeCompare(t.name)), _ = e.selected ? n.find((t) => t.id === e.selected) : void 0, v = i.includes(a) ? a : void 0, y = (t, n, r, i) => /* @__PURE__ */ (0, L.jsxs)("button", {
		type: "button",
		className: `rc-stat rc-stat--${i}`,
		"aria-pressed": a === t,
		onClick: () => e.setFilter(a === t ? "all" : t),
		children: [/* @__PURE__ */ (0, L.jsx)("span", {
			className: "rc-stat-value",
			children: n
		}), /* @__PURE__ */ (0, L.jsx)("span", {
			className: "rc-stat-label",
			children: r
		})]
	});
	return /* @__PURE__ */ (0, L.jsxs)("div", {
		className: `rc-rooms${_ ? " rc-rooms--detail" : ""}`,
		children: [/* @__PURE__ */ (0, L.jsxs)("div", {
			className: "rc-main",
			children: [
				/* @__PURE__ */ (0, L.jsxs)("section", {
					className: "rc-summary",
					"aria-label": o(`${t}tab_rooms`),
					children: [
						/* @__PURE__ */ (0, L.jsxs)("div", {
							className: "rc-stats",
							children: [
								y("all", n.length, o(`${t}stat_rooms`), "all"),
								y("errors", u, o(`${t}stat_errors`), "error"),
								y("warnings", d, o(`${t}stat_warnings`), "warning"),
								/* @__PURE__ */ (0, L.jsxs)("div", {
									className: "rc-stat rc-stat--pass",
									children: [/* @__PURE__ */ (0, L.jsx)("span", {
										className: "rc-stat-value",
										children: l
									}), /* @__PURE__ */ (0, L.jsx)("span", {
										className: "rc-stat-label",
										children: o(`${t}stat_pass`)
									})]
								}),
								f > 0 && y("unchecked", f, o("datanauten_room_checker_stat_unchecked"), "unchecked")
							]
						}),
						c.length > 0 && /* @__PURE__ */ (0, L.jsxs)("div", {
							className: "rc-compliance",
							children: [/* @__PURE__ */ (0, L.jsx)("span", {
								className: "rc-meter",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, L.jsx)("span", { style: { width: `${m}%` } })
							}), /* @__PURE__ */ (0, L.jsxs)("span", { children: [o("datanauten_room_checker_compliance", { percent: `${m} %` }), p > 0 && /* @__PURE__ */ (0, L.jsxs)("span", {
								className: "rc-excepted-count",
								children: [" · ", q(o, "exceptions_count", p)]
							})] })]
						}),
						/* @__PURE__ */ (0, L.jsx)("div", {
							className: "rc-section-title",
							children: o(`${t}by_policy`)
						}),
						/* @__PURE__ */ (0, L.jsx)("div", {
							className: "rc-bars",
							children: s.map((i) => {
								let s = n.filter((e) => V(e, i)).length, c = n.filter((e) => B(e, i) && B(e, i).status !== "unknown").length;
								return /* @__PURE__ */ (0, L.jsxs)("button", {
									type: "button",
									className: `rc-bar rc-bar--${r[i].severity}`,
									"aria-pressed": a === i,
									disabled: !s,
									onClick: () => e.setFilter(a === i ? "all" : i),
									children: [
										/* @__PURE__ */ (0, L.jsx)("span", {
											className: "rc-bar-label",
											children: o(`${t}policy_${i}`)
										}),
										/* @__PURE__ */ (0, L.jsx)("span", {
											className: "rc-bar-track",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, L.jsx)("span", { style: { width: c ? `${s / c * 100}%` : 0 } })
										}),
										/* @__PURE__ */ (0, L.jsx)("span", {
											className: "rc-bar-count",
											children: s
										})
									]
								}, i);
							})
						})
					]
				}),
				/* @__PURE__ */ (0, L.jsxs)("div", {
					className: "rc-toolbar",
					children: [/* @__PURE__ */ (0, L.jsx)("input", {
						className: "rc-search",
						type: "search",
						placeholder: o(`${t}search`),
						"aria-label": o(`${t}search`),
						value: e.query,
						onChange: (t) => e.setQuery(t.target.value)
					}), /* @__PURE__ */ (0, L.jsxs)("div", {
						className: "rc-chips",
						role: "group",
						children: [[
							"all",
							"failing",
							"unchecked"
						].map((n) => /* @__PURE__ */ (0, L.jsx)("button", {
							type: "button",
							className: "rc-chip",
							"aria-pressed": a === n,
							onClick: () => e.setFilter(n),
							children: o(`${t}filter_${n}`)
						}, n)), v && /* @__PURE__ */ (0, L.jsxs)("button", {
							type: "button",
							className: "rc-chip",
							"aria-pressed": !0,
							onClick: () => e.setFilter("all"),
							children: [o("datanauten_room_checker_filter_policy", { policy: o(`datanauten_room_checker_policy_${v}`) }), " ×"]
						})]
					})]
				}),
				v && /* @__PURE__ */ (0, L.jsx)(ve, {
					...e,
					id: v,
					failing: n.filter((e) => V(e, v))
				}, v),
				n.length === 0 ? /* @__PURE__ */ (0, L.jsx)("div", {
					className: "rc-empty",
					children: o(`${t}no_rooms`)
				}) : g.length === 0 ? /* @__PURE__ */ (0, L.jsx)("div", {
					className: "rc-empty",
					children: o(`${t}no_match`)
				}) : /* @__PURE__ */ (0, L.jsx)("div", {
					className: "rc-table-wrap",
					children: /* @__PURE__ */ (0, L.jsxs)("table", {
						className: "rc-table",
						children: [/* @__PURE__ */ (0, L.jsx)("thead", { children: /* @__PURE__ */ (0, L.jsxs)("tr", { children: [/* @__PURE__ */ (0, L.jsx)("th", {
							scope: "col",
							className: "rc-col-room",
							children: o(`${t}col_room`)
						}), s.map((e) => /* @__PURE__ */ (0, L.jsx)("th", {
							scope: "col",
							className: "rc-col-policy",
							title: o(`${t}policy_${e}_desc`),
							children: /* @__PURE__ */ (0, L.jsx)("span", { children: o(`${t}policy_${e}`) })
						}, e))] }) }), /* @__PURE__ */ (0, L.jsx)("tbody", { children: g.map((t) => /* @__PURE__ */ (0, L.jsxs)("tr", {
							className: "rc-row",
							"aria-selected": t.id === e.selected,
							tabIndex: 0,
							onClick: () => e.setSelected(t.id),
							onKeyDown: (n) => {
								(n.key === "Enter" || n.key === " ") && (n.preventDefault(), e.setSelected(t.id));
							},
							children: [/* @__PURE__ */ (0, L.jsxs)("th", {
								scope: "row",
								className: "rc-col-room",
								children: [/* @__PURE__ */ (0, L.jsx)("span", {
									className: "rc-room-name",
									children: t.name
								}), /* @__PURE__ */ (0, L.jsx)("span", {
									className: "rc-room-meta",
									children: me(t, o)
								})]
							}), s.map((e) => /* @__PURE__ */ (0, L.jsx)("td", {
								className: "rc-cell",
								children: /* @__PURE__ */ (0, L.jsx)(W, {
									result: B(t, e),
									severity: r[e].severity,
									t: o
								})
							}, e))]
						}, t.id)) })]
					})
				})
			]
		}), _ && /* @__PURE__ */ (0, L.jsx)(he, {
			...e,
			entry: _,
			onBack: () => e.setSelected(void 0)
		})]
	});
}
function U(e) {
	return e.report ? e.report.errors * 100 + e.report.warnings : -1;
}
function me(e, n) {
	let r = e.room ? [] : [n(`${t}not_joined`)];
	return e.report?.errors && r.push(q(n, "room_errors", e.report.errors)), e.report?.warnings && r.push(q(n, "room_warnings", e.report.warnings)), e.room && r.length === 0 && r.push(n(`${t}room_ok`)), r.join(" · ");
}
function W(e) {
	let { result: n, t: r } = e;
	if (!n) return /* @__PURE__ */ (0, L.jsx)("span", {
		className: "rc-status rc-status--none",
		"aria-label": "–",
		children: "–"
	});
	let i = n.status === "fail" ? e.severity : n.status, a = n.status === "pass" ? r(`${t}passes`) : n.status === "unknown" ? r(`${t}status_unknown`) : n.status === "excepted" ? r(`${t}status_excepted`, { reason: n.exception.reason }) : G(n.detail, r), o = {
		pass: "✓",
		excepted: "✓",
		unknown: "?",
		error: "✕",
		warning: "!"
	}[i];
	return /* @__PURE__ */ (0, L.jsx)("span", {
		className: `rc-status rc-status--${i}`,
		title: a,
		"aria-label": a,
		children: o
	});
}
function G(e, n) {
	if (!e) return "";
	let r = { ...e.vars };
	return r.value &&= n(`${t}value_${r.value}`), n(`${t}check_${e.key}`, r);
}
function he(e) {
	let { entry: n, policies: r, t: a } = e, o = i.filter((e) => r[e].enabled), s = {
		fail: 0,
		excepted: 1,
		unknown: 2,
		pass: 3
	}, c = o.filter((e) => B(n, e)).sort((e, t) => s[B(n, e).status] - s[B(n, t).status]), l = n.parentSpace !== e.spaceId && n.parentSpace;
	return /* @__PURE__ */ (0, L.jsxs)("aside", {
		className: "rc-detail",
		"data-testid": "room-checker-detail",
		"aria-label": n.name,
		children: [
			/* @__PURE__ */ (0, L.jsxs)("button", {
				type: "button",
				className: "rc-back",
				onClick: e.onBack,
				children: ["‹ ", a(`${t}back`)]
			}),
			/* @__PURE__ */ (0, L.jsx)("div", {
				className: "rc-detail-name",
				children: n.name
			}),
			/* @__PURE__ */ (0, L.jsx)("div", {
				className: "rc-detail-id",
				children: n.id
			}),
			l && /* @__PURE__ */ (0, L.jsx)("div", {
				className: "rc-detail-id",
				children: a("datanauten_room_checker_in_subspace", { space: e.spaceName(l) })
			}),
			/* @__PURE__ */ (0, L.jsxs)("div", {
				className: "rc-actions",
				children: [/* @__PURE__ */ (0, L.jsx)("button", {
					type: "button",
					className: "rc-button",
					onClick: () => e.onOpenRoom(n.id),
					children: n.room ? a(`${t}open_room`) : a(`${t}view_room`)
				}), n.room && /* @__PURE__ */ (0, L.jsx)("button", {
					type: "button",
					className: "rc-button",
					onClick: () => e.onRoomSettings(n.id),
					children: a("datanauten_room_checker_room_settings")
				})]
			}),
			!n.room && /* @__PURE__ */ (0, L.jsx)("p", {
				className: "rc-note",
				children: n.report ? a("datanauten_room_checker_not_joined_partial") : a("datanauten_room_checker_not_joined_detail")
			}),
			n.report && /* @__PURE__ */ (0, L.jsx)("ul", {
				className: "rc-checks",
				children: c.map((t) => {
					let i = B(n, t), o = r[t].severity;
					return /* @__PURE__ */ (0, L.jsxs)("li", {
						className: "rc-check",
						children: [/* @__PURE__ */ (0, L.jsx)(W, {
							result: i,
							severity: o,
							t: a
						}), /* @__PURE__ */ (0, L.jsxs)("div", {
							className: "rc-check-body",
							children: [
								/* @__PURE__ */ (0, L.jsxs)("div", {
									className: "rc-check-name",
									children: [
										a(`datanauten_room_checker_policy_${t}`),
										i.status === "fail" && /* @__PURE__ */ (0, L.jsx)("span", {
											className: `rc-tag rc-tag--${o}`,
											children: a(`datanauten_room_checker_severity_${o}`)
										}),
										i.status === "excepted" && /* @__PURE__ */ (0, L.jsx)("span", {
											className: "rc-tag rc-tag--excepted",
											children: a("datanauten_room_checker_excepted")
										})
									]
								}),
								/* @__PURE__ */ (0, L.jsx)("div", {
									className: "rc-check-detail",
									children: i.status === "pass" ? a("datanauten_room_checker_passes") : i.status === "unknown" ? a("datanauten_room_checker_status_unknown") : G(i.detail, a)
								}),
								i.status === "fail" && /* @__PURE__ */ (0, L.jsx)(_e, {
									...e,
									id: t
								}),
								(i.status === "fail" || i.status === "excepted") && /* @__PURE__ */ (0, L.jsx)(ge, {
									...e,
									id: t,
									result: i
								})
							]
						})]
					}, t);
				})
			})
		]
	});
}
function ge(e) {
	let { client: n, entry: r, id: i, result: a, t: o } = e, [s, c] = window.React.useState(), [l, u] = window.React.useState(!1), [d, f] = window.React.useState();
	window.React.useEffect(() => {
		c(void 0), f(void 0);
	}, [
		r.id,
		i,
		a.status
	]);
	let p = async (t) => {
		u(!0), f(void 0);
		try {
			await w(n, e.spaceId, r.id, i, t);
		} catch (e) {
			f(e instanceof Error ? e.message : String(e));
		} finally {
			u(!1);
		}
	}, m = d && /* @__PURE__ */ (0, L.jsx)("div", {
		className: "rc-note rc-note--error",
		children: o("datanauten_room_checker_fix_failed", { error: d })
	});
	if (a.status === "excepted") {
		let n = a.exception;
		return /* @__PURE__ */ (0, L.jsxs)("div", {
			className: "rc-exception",
			children: [
				/* @__PURE__ */ (0, L.jsxs)("div", {
					className: "rc-exception-reason",
					children: [
						"“",
						n.reason,
						"”"
					]
				}),
				/* @__PURE__ */ (0, L.jsx)("div", {
					className: "rc-note",
					children: o(`${t}excepted_by`, {
						user: n.by,
						when: J(n.at, e.language)
					})
				}),
				e.spacePolicies.canEdit && /* @__PURE__ */ (0, L.jsx)("button", {
					type: "button",
					className: "rc-link",
					disabled: l,
					onClick: () => void p(void 0),
					children: o("datanauten_room_checker_take_back")
				}),
				m
			]
		});
	}
	return e.spacePolicies.canEdit ? s === void 0 ? /* @__PURE__ */ (0, L.jsx)("button", {
		type: "button",
		className: "rc-link",
		onClick: () => c(""),
		children: o(`${t}accept`)
	}) : /* @__PURE__ */ (0, L.jsxs)("form", {
		className: "rc-fix-form",
		onSubmit: (e) => {
			e.preventDefault(), s.trim() && p(s.trim());
		},
		children: [
			/* @__PURE__ */ (0, L.jsx)("input", {
				"aria-label": o(`${t}accept_reason`),
				placeholder: o(`${t}accept_reason`),
				value: s,
				autoFocus: !0,
				onChange: (e) => c(e.target.value)
			}),
			/* @__PURE__ */ (0, L.jsxs)("div", {
				className: "rc-fix-buttons",
				children: [/* @__PURE__ */ (0, L.jsx)("button", {
					type: "submit",
					className: "rc-button rc-button--primary",
					disabled: !s.trim() || l,
					children: o(`${t}accept_save`)
				}), /* @__PURE__ */ (0, L.jsx)("button", {
					type: "button",
					className: "rc-button",
					onClick: () => c(void 0),
					children: o(`${t}cancel`)
				})]
			}),
			m
		]
	}) : null;
}
function _e(e) {
	let { client: n, entry: r, id: i, policies: a, t: o } = e, [s, c] = window.React.useState({ step: "idle" }), l = window.React.useRef(null), u = a[i];
	if (window.React.useEffect(() => c({ step: "idle" }), [r.id, i]), !O[i]) return /* @__PURE__ */ (0, L.jsx)("div", {
		className: "rc-note",
		children: o(`${t}no_fix`)
	});
	if (!r.room) return /* @__PURE__ */ (0, L.jsx)("div", {
		className: "rc-note",
		children: o(`${t}join_to_fix`)
	});
	if (!A(n, r, i)) return /* @__PURE__ */ (0, L.jsx)("div", {
		className: "rc-note",
		children: o(`${t}no_power`)
	});
	let d = async (e) => {
		c({ step: "busy" });
		try {
			await N(n, r, i, u, e), c({ step: "done" });
		} catch (e) {
			c({
				step: "failed",
				error: e instanceof Error ? e.message : String(e)
			});
		}
	}, f = K(i, e.policies, o), p = k[i];
	return s.step === "busy" ? /* @__PURE__ */ (0, L.jsx)("div", {
		className: "rc-note",
		children: "…"
	}) : s.step === "done" ? /* @__PURE__ */ (0, L.jsx)("div", {
		className: "rc-note rc-note--ok",
		children: o(`${t}fix_done`)
	}) : s.step === "edit" ? /* @__PURE__ */ (0, L.jsxs)("form", {
		className: "rc-fix-form",
		onSubmit: (e) => {
			e.preventDefault(), s.value.trim() && d(s.value);
		},
		children: [i === "topic" ? /* @__PURE__ */ (0, L.jsx)("textarea", {
			"aria-label": f,
			value: s.value,
			autoFocus: !0,
			rows: 3,
			onChange: (e) => c({
				step: "edit",
				value: e.target.value
			})
		}) : /* @__PURE__ */ (0, L.jsx)("input", {
			"aria-label": f,
			value: s.value,
			autoFocus: !0,
			onChange: (e) => c({
				step: "edit",
				value: e.target.value
			})
		}), /* @__PURE__ */ (0, L.jsxs)("div", {
			className: "rc-fix-buttons",
			children: [/* @__PURE__ */ (0, L.jsx)("button", {
				type: "submit",
				className: "rc-button rc-button--primary",
				disabled: !s.value.trim(),
				children: o(`${t}save`)
			}), /* @__PURE__ */ (0, L.jsx)("button", {
				type: "button",
				className: "rc-button",
				onClick: () => c({ step: "idle" }),
				children: o(`${t}cancel`)
			})]
		})]
	}) : s.step === "confirm" ? /* @__PURE__ */ (0, L.jsxs)("div", {
		className: "rc-fix-form",
		children: [/* @__PURE__ */ (0, L.jsx)("div", {
			className: "rc-note",
			children: o(`${t}fix_encryption_confirm`)
		}), /* @__PURE__ */ (0, L.jsxs)("div", {
			className: "rc-fix-buttons",
			children: [/* @__PURE__ */ (0, L.jsx)("button", {
				type: "button",
				className: "rc-button rc-button--primary",
				onClick: () => void d(),
				children: f
			}), /* @__PURE__ */ (0, L.jsx)("button", {
				type: "button",
				className: "rc-button",
				onClick: () => c({ step: "idle" }),
				children: o(`${t}cancel`)
			})]
		})]
	}) : /* @__PURE__ */ (0, L.jsxs)("div", {
		className: "rc-fix",
		children: [
			/* @__PURE__ */ (0, L.jsx)("button", {
				type: "button",
				className: "rc-button rc-button--primary",
				onClick: () => {
					if (p === "file") return l.current?.click();
					if (p === "text") {
						let e = r.room, t = i === "name" ? e?.name ?? "" : i === "topic" ? e ? D(e) : "" : P(r.name);
						return c({
							step: "edit",
							value: t
						});
					}
					if (i === "encryption") return c({ step: "confirm" });
					d();
				},
				children: f
			}),
			p === "file" && /* @__PURE__ */ (0, L.jsx)("input", {
				ref: l,
				type: "file",
				accept: "image/*",
				hidden: !0,
				"data-testid": "room-checker-avatar-input",
				onChange: (e) => {
					let t = e.target.files?.[0];
					t && d(t);
				}
			}),
			s.step === "failed" && /* @__PURE__ */ (0, L.jsx)("div", {
				className: "rc-note rc-note--error",
				children: o("datanauten_room_checker_fix_failed", { error: s.error })
			})
		]
	});
}
function K(e, n, r) {
	let i = j(e, n[e]);
	return r(`${t}fix_${e}`, i ? { value: r(`${t}value_${i}`) } : void 0);
}
function ve(e) {
	let { client: n, id: r, failing: i, policies: a, t: o } = e, [s, c] = window.React.useState({ step: "idle" }), [l, u] = window.React.useState([]);
	if (!i.length && s.step === "idle") return null;
	let d = !!k[r] || !O[r], f = d ? [] : i.filter((e) => e.room && A(n, e, r)), p = i.length - f.length, m = d ? "" : K(r, a, o), h = async () => {
		let e = f;
		u(e);
		let t = [];
		for (let i = 0; i < e.length; i++) {
			c({
				step: "running",
				done: i
			});
			try {
				await N(n, e[i], r, a[r]);
			} catch (n) {
				t.push({
					name: e[i].name,
					error: n instanceof Error ? n.message : String(n)
				});
			}
		}
		c({
			step: "finished",
			ok: e.length - t.length,
			failed: t
		});
	}, g;
	return g = s.step === "running" ? /* @__PURE__ */ (0, L.jsx)("span", { children: o(`${t}bulk_running`, {
		done: String(s.done + 1),
		count: String(l.length)
	}) }) : s.step === "finished" ? /* @__PURE__ */ (0, L.jsxs)(L.Fragment, { children: [
		/* @__PURE__ */ (0, L.jsx)("span", {
			className: s.failed.length ? "" : "rc-note--ok",
			children: o(`${t}bulk_done`, {
				ok: String(s.ok),
				count: String(l.length)
			})
		}),
		s.failed.length > 0 && /* @__PURE__ */ (0, L.jsx)("ul", {
			className: "rc-bulk-list rc-note--error",
			children: s.failed.map((e) => /* @__PURE__ */ (0, L.jsx)("li", { children: o("datanauten_room_checker_bulk_failed_room", {
				room: e.name,
				error: e.error
			}) }, e.name))
		}),
		/* @__PURE__ */ (0, L.jsx)("button", {
			type: "button",
			className: "rc-link",
			onClick: () => c({ step: "idle" }),
			children: o(`${t}close`)
		})
	] }) : s.step === "confirm" ? /* @__PURE__ */ (0, L.jsxs)(L.Fragment, { children: [
		/* @__PURE__ */ (0, L.jsx)("span", { children: o(r === "encryption" ? `${t}fix_encryption_confirm` : `${t}bulk_confirm`) }),
		/* @__PURE__ */ (0, L.jsx)("ul", {
			className: "rc-bulk-list",
			children: f.map((e) => /* @__PURE__ */ (0, L.jsx)("li", { children: e.name }, e.id))
		}),
		/* @__PURE__ */ (0, L.jsxs)("div", {
			className: "rc-fix-buttons",
			children: [/* @__PURE__ */ (0, L.jsx)("button", {
				type: "button",
				className: "rc-button rc-button--primary",
				onClick: () => void h(),
				children: q(o, "bulk_go", f.length)
			}), /* @__PURE__ */ (0, L.jsx)("button", {
				type: "button",
				className: "rc-button",
				onClick: () => c({ step: "idle" }),
				children: o(`${t}cancel`)
			})]
		})
	] }) : /* @__PURE__ */ (0, L.jsxs)(L.Fragment, { children: [/* @__PURE__ */ (0, L.jsx)("span", { children: q(o, "bulk_failing", i.length) }), d ? /* @__PURE__ */ (0, L.jsx)("span", {
		className: "rc-note",
		children: o(`${t}bulk_per_room`)
	}) : /* @__PURE__ */ (0, L.jsxs)(L.Fragment, { children: [f.length > 0 && /* @__PURE__ */ (0, L.jsx)("button", {
		type: "button",
		className: "rc-button rc-button--primary",
		onClick: () => c({ step: "confirm" }),
		children: o("datanauten_room_checker_bulk_fix", {
			action: m,
			count: String(f.length)
		})
	}), p > 0 && /* @__PURE__ */ (0, L.jsx)("span", {
		className: "rc-note",
		children: q(o, "bulk_skipped", p)
	})] })] }), /* @__PURE__ */ (0, L.jsx)("div", {
		className: "rc-bulk",
		"data-testid": "room-checker-bulk",
		"aria-live": "polite",
		children: g
	});
}
// src/ui/CheckerOverlay.tsx
function ye(e) {
	let { client: n, spaces: r, t: i } = e, a = window.React.useId(), [o, s] = window.React.useState(() => r.find((t) => t.id === e.space)?.id ?? r[0]?.id), [c, l] = window.React.useState("rooms"), [u, d] = window.React.useState("all"), [f, p] = window.React.useState(""), [m, h] = window.React.useState(), [g, _] = window.React.useState(/* @__PURE__ */ new Map()), v = window.React.useRef(null);
	window.React.useEffect(() => v.current?.focus(), []), window.React.useEffect(() => {
		if (!o) return;
		let e = !0;
		return _(/* @__PURE__ */ new Map()), ne(n, o).then((t) => e && _(t)), () => {
			e = !1;
		};
	}, [n, o]);
	let y = window.React.useMemo(() => o ? S(n, o) : void 0, [
		n,
		o,
		e.revision
	]), b = window.React.useMemo(() => o && y ? ee(n, o, y.policies, y.exceptions, g) : [], [
		n,
		o,
		y,
		g,
		e.revision
	]), x = (t) => {
		s(t), h(void 0), d("all"), e.onSpaceChange(t);
	}, C = (t) => {
		t.key === "Escape" && (t.preventDefault(), m ? h(void 0) : e.onClose());
	}, w;
	return w = !o || !y ? /* @__PURE__ */ (0, L.jsx)("div", {
		className: "rc-empty",
		children: i(`${t}no_spaces`)
	}) : c === "policies" ? /* @__PURE__ */ (0, L.jsx)(de, {
		client: n,
		spaceId: o,
		space: y,
		roomName: (e) => b.find((t) => t.id === e)?.name ?? n.getRoom(e)?.name ?? e,
		revision: e.revision,
		language: e.language,
		t: i
	}, o) : /* @__PURE__ */ (0, L.jsx)(pe, {
		...e,
		spaceId: o,
		spacePolicies: y,
		entries: b,
		policies: y.policies,
		filter: u,
		setFilter: d,
		query: f,
		setQuery: p,
		selected: m,
		setSelected: h,
		spaceName: (e) => r.find((t) => t.id === e)?.name ?? n.getRoom(e)?.name ?? g.get(e)?.name ?? e
	}), /* @__PURE__ */ (0, L.jsx)("div", {
		className: "rc-backdrop",
		onMouseDown: (t) => t.target === t.currentTarget && e.onClose(),
		children: /* @__PURE__ */ (0, L.jsxs)("div", {
			ref: v,
			tabIndex: -1,
			className: "rc-panel",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": a,
			onKeyDown: C,
			children: [
				/* @__PURE__ */ (0, L.jsxs)("header", {
					className: "rc-header",
					children: [
						/* @__PURE__ */ (0, L.jsx)("h2", {
							id: a,
							className: "rc-title",
							children: i(`${t}title`)
						}),
						r.length > 0 && /* @__PURE__ */ (0, L.jsxs)("label", {
							className: "rc-space",
							children: [/* @__PURE__ */ (0, L.jsx)("span", { children: i("datanauten_room_checker_space") }), /* @__PURE__ */ (0, L.jsx)("select", {
								value: o,
								onChange: (e) => x(e.target.value),
								children: r.map((e) => /* @__PURE__ */ (0, L.jsxs)("option", {
									value: e.id,
									children: ["\xA0\xA0".repeat(e.depth), e.name]
								}, e.id))
							})]
						}),
						/* @__PURE__ */ (0, L.jsx)("div", {
							className: "rc-tabs",
							role: "tablist",
							children: ["rooms", "policies"].map((e) => /* @__PURE__ */ (0, L.jsx)("button", {
								type: "button",
								role: "tab",
								className: "rc-tab",
								"aria-selected": c === e,
								onClick: () => l(e),
								children: i(`${t}tab_${e}`)
							}, e))
						}),
						/* @__PURE__ */ (0, L.jsx)("button", {
							type: "button",
							className: "rc-close",
							"aria-label": i(`${t}close`),
							onClick: e.onClose,
							children: "×"
						})
					]
				}),
				/* @__PURE__ */ (0, L.jsx)("div", {
					className: "rc-body",
					children: w
				}),
				/* @__PURE__ */ (0, L.jsxs)("footer", {
					className: "rc-footer",
					children: [/* @__PURE__ */ (0, L.jsx)("span", { children: i(`${t}hint`, { key: e.triggerLabel }) }), /* @__PURE__ */ (0, L.jsxs)("span", {
						className: "rc-version",
						children: ["v", le]
					})]
				})
			]
		})
	});
}
function q(e, n, r) {
	return e(`${t}${n}_${r === 1 ? "one" : "other"}`, { count: String(r) });
}
function J(e, t, n = Date.now()) {
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
var Y = "de.datanauten.room_checker", X = "de-datanauten-room-checker-style", Z = "de.datanauten.room_checker.space", be = 300;
function Q(e) {
	let t = e ?? {};
	if (typeof t != "object") throw Error("expected an object");
	let n = { trigger_key: "Alt+R" };
	if (t.trigger_key !== void 0) {
		if (typeof t.trigger_key != "string") throw Error("trigger_key must be a string");
		n.trigger_key = t.trigger_key;
	}
	return I(n.trigger_key), n;
}
var $ = class {
	api;
	static moduleApiVersion = "^2.0.0";
	trigger;
	container;
	root;
	client;
	revision = 0;
	recheckTimer;
	restoreFocus;
	constructor(e) {
		this.api = e;
	}
	async load() {
		let e;
		try {
			e = Q(this.api.config.get(Y));
		} catch (e) {
			throw console.error(`[room-checker] Invalid "${Y}" config`, e), Error("Errors in module configuration for the room checker module");
		}
		this.trigger = I(e.trigger_key), this.api.i18n.register(n), Ce(), window.addEventListener("keydown", this.onKeyDown, { capture: !0 });
	}
	dispose() {
		this.close(), window.removeEventListener("keydown", this.onKeyDown, { capture: !0 });
	}
	isOpen() {
		return !!this.root;
	}
	open() {
		if (this.root) return;
		let e = b();
		e?.getUserId?.() ? (this.client = e, e.on?.("RoomState.events", this.onStateEvent), this.restoreFocus = document.activeElement, this.container = document.createElement("div"), this.container.className = "de-datanauten-room-checker", document.body.appendChild(this.container), this.container.addEventListener("keydown", (e) => e.stopPropagation()), this.root = this.api.createRoot(this.container), this.render()) : console.warn("[room-checker] Element's Matrix client isn't available");
	}
	close() {
		this.root && (clearTimeout(this.recheckTimer), this.client?.removeListener?.("RoomState.events", this.onStateEvent), this.root.unmount(), this.container?.remove(), this.root = void 0, this.container = void 0, this.client = void 0, this.restoreFocus?.focus?.(), this.restoreFocus = void 0);
	}
	render() {
		let e = this.client;
		this.root && e && this.root.render(/* @__PURE__ */ (0, L.jsx)(ye, {
			client: e,
			spaces: x(e),
			space: xe(Z),
			revision: this.revision,
			language: this.api.i18n.language,
			triggerLabel: se(this.trigger),
			t: this.t,
			onSpaceChange: (e) => Se(Z, e),
			onOpenRoom: (e) => this.openRoom(e),
			onRoomSettings: (e) => this.openRoomSettings(e),
			onClose: () => this.close()
		}));
	}
	onStateEvent = () => {
		clearTimeout(this.recheckTimer), this.recheckTimer = setTimeout(() => {
			this.revision++, this.render();
		}, be);
	};
	onKeyDown = (e) => {
		e.isComposing || e.defaultPrevented || !oe(e, this.trigger) || (e.preventDefault(), e.stopImmediatePropagation(), this.root ? this.close() : this.open());
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
function xe(e) {
	try {
		return localStorage.getItem(e) ?? void 0;
	} catch {
		return;
	}
}
function Se(e, t) {
	try {
		localStorage.setItem(e, t);
	} catch {}
}
function Ce() {
	if (document.getElementById(X)) return;
	let e = document.createElement("style");
	e.id = X, e.textContent = ce, document.head.appendChild(e);
}
export { Y as CONFIG_KEY, $ as RoomCheckerModule, $ as default, Q as parseConfig };

//# sourceMappingURL=index.js.map