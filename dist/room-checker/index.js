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
		en: "You're not in this room, so its settings can't be checked.",
		de: "Du bist nicht in diesem Raum, daher lassen sich seine Einstellungen nicht prüfen."
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
		let r = o[e], i = t[e], s = i && typeof i == "object" ? i : {}, u = {
			enabled: typeof s.enabled == "boolean" ? s.enabled : r.enabled,
			severity: s.severity === "error" || s.severity === "warning" ? s.severity : r.severity
		};
		if (r.pattern !== void 0 && (u.pattern = typeof s.pattern == "string" && c(s.pattern) ? s.pattern : r.pattern), r.minLength !== void 0 && (u.minLength = l(s.minLength, 0, 1e3) ?? r.minLength), r.min !== void 0 && (u.min = l(s.min, 0, 100) ?? r.min), r.allowed !== void 0) {
			let t = a[e] ?? [], n = Array.isArray(s.allowed) ? t.filter((e) => s.allowed.includes(e)) : void 0;
			u.allowed = n?.length ? n : r.allowed;
		}
		n[e] = u;
	}
	return n;
}
function c(e) {
	try {
		return new RegExp(e, "u"), !0;
	} catch {
		return !1;
	}
}
function l(e, t, n) {
	return typeof e == "number" && Number.isInteger(e) && e >= t && e <= n ? e : void 0;
}
var u = 100;
function d(e, t, n) {
	let r = (e, t) => ({
		pass: !1,
		detail: {
			key: e,
			vars: t
		}
	});
	switch (e) {
		case "name": {
			let e = String(t.state("m.room.name")?.name ?? "").trim();
			return e ? n.pattern && !new RegExp(n.pattern, "u").test(e) ? r("name_pattern", { pattern: n.pattern }) : { pass: !0 } : r("name_missing");
		}
		case "topic": {
			let e = f(t.state("m.room.topic"));
			if (!e) return r("topic_missing");
			let i = n.minLength ?? 0;
			return Array.from(e).length < i ? r("topic_short", { min: String(i) }) : { pass: !0 };
		}
		case "avatar": return t.state("m.room.avatar")?.url ? { pass: !0 } : r("avatar_missing");
		case "encryption": return t.state("m.room.encryption")?.algorithm ? { pass: !0 } : r("encryption_off");
		case "join_rule": {
			let e = String(t.state("m.room.join_rules")?.join_rule ?? "invite");
			return n.allowed?.includes(e) ? { pass: !0 } : r("join_rule", { value: e });
		}
		case "history_visibility": {
			let e = String(t.state("m.room.history_visibility")?.history_visibility ?? "shared");
			return n.allowed?.includes(e) ? { pass: !0 } : r("history_visibility", { value: e });
		}
		case "guest_access": return t.state("m.room.guest_access")?.guest_access === "can_join" ? r("guest_access") : { pass: !0 };
		case "address": return t.state("m.room.canonical_alias")?.alias ? { pass: !0 } : r("address_missing");
		case "admins": {
			let e = p(t).length, i = n.min ?? 1;
			return e >= i ? { pass: !0 } : r("admins", {
				count: String(e),
				min: String(i)
			});
		}
		case "space_parent": {
			let e = t.state("m.space.parent", t.parentSpace)?.via;
			return Array.isArray(e) && e.length ? { pass: !0 } : r("space_parent");
		}
	}
}
function f(e) {
	if (!e) return "";
	if (typeof e.topic == "string" && e.topic.trim()) return e.topic.trim();
	let t = e["m.topic"]?.["m.text"], n = t?.find((e) => !e.mimetype || e.mimetype === "text/plain") ?? t?.[0];
	return typeof n?.body == "string" ? n.body.trim() : "";
}
function p(e) {
	let t = e.state("m.room.power_levels")?.users ?? {}, n = new Set(e.creators ?? []);
	for (let [e, r] of Object.entries(t)) typeof r == "number" && r >= u && n.add(e);
	return [...n].filter((t) => e.state("m.room.member", t)?.membership === "join");
}
function m(e, t, n) {
	return !/^\d+$/.test(String(e ?? "1")) || Number(e) < 12 || !t ? [] : [t, ...Array.isArray(n) ? n.filter((e) => typeof e == "string") : []];
}
function h(e, t) {
	let n = /* @__PURE__ */ new Map(), r = 0, a = 0;
	for (let o of i) {
		let i = t[o];
		if (!i.enabled) continue;
		let s = d(o, e, i);
		n.set(o, s), s.pass || (i.severity === "error" ? r++ : a++);
	}
	return {
		results: n,
		errors: r,
		warnings: a
	};
}
// src/space.ts
function g() {
	let e = window.mxMatrixClientPeg;
	try {
		return e?.get?.() ?? void 0;
	} catch {
		return;
	}
}
function _(e) {
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
function v(e, t) {
	let n = e.getRoom(t), i = n?.currentState.getStateEvents(r, ""), a = i?.getContent(), o = !!(a && Object.keys(a).length), c = e.getUserId() ?? "";
	return {
		policies: s(o ? a : void 0),
		saved: o,
		by: o ? i?.getSender?.() : void 0,
		at: o ? i?.getTs?.() : void 0,
		canEdit: !!n?.currentState.maySendStateEvent(r, c)
	};
}
function y(e, t, n) {
	return e.sendStateEvent(t, r, {
		version: 1,
		policies: n
	}, "");
}
function ee(e, t, n, r = /* @__PURE__ */ new Map()) {
	let i = [], a = /* @__PURE__ */ new Set([t]), o = [t];
	for (; o.length;) {
		let t = o.shift(), s = e.getRoom(t);
		if (s) for (let c of s.currentState.getStateEvents("m.space.child")) {
			let s = c.getStateKey(), l = c.getContent().via;
			if (!s || a.has(s) || !Array.isArray(l) || !l.length) continue;
			a.add(s);
			let u = e.getRoom(s), d = u && u.getMyMembership() === "join" ? u : void 0;
			if (d?.isSpaceRoom()) {
				o.push(s);
				continue;
			}
			if (!d && r.get(s) === "\0space") continue;
			let f = {
				id: s,
				name: d?.name || r.get(s) || s,
				parentSpace: t,
				room: d
			};
			d && (f.report = h(S(d, t), n)), i.push(f);
		}
	}
	return i;
}
var b = "\0space";
async function x(e, t) {
	let n = /* @__PURE__ */ new Map();
	try {
		let r = await e.getRoomHierarchy?.(t, 200);
		for (let e of r?.rooms ?? []) n.set(e.room_id, e.room_type === "m.space" ? b : e.name || e.canonical_alias || e.room_id);
	} catch {}
	return n;
}
function S(e, t) {
	let n = e.currentState.getStateEvents("m.room.create", ""), r = n?.getContent() ?? {};
	return {
		id: e.roomId,
		parentSpace: t,
		creators: m(r.room_version, n?.getSender?.(), r.additional_creators),
		state: (t, n = "") => {
			let r = e.currentState.getStateEvents(t, n)?.getContent();
			return r && Object.keys(r).length ? r : void 0;
		}
	};
}
function C(e) {
	return f(e.currentState.getStateEvents("m.room.topic", "")?.getContent());
}
var w = {
	name: "m.room.name",
	topic: "m.room.topic",
	avatar: "m.room.avatar",
	encryption: "m.room.encryption",
	join_rule: "m.room.join_rules",
	history_visibility: "m.room.history_visibility",
	guest_access: "m.room.guest_access",
	address: "m.room.canonical_alias",
	space_parent: "m.space.parent"
}, T = {
	name: "text",
	topic: "text",
	avatar: "file",
	address: "text"
};
function E(e, t, n) {
	let r = w[n], i = e.getUserId();
	return !!(r && i && t.room?.currentState.maySendStateEvent(r, i));
}
function D(e, t) {
	return e === "join_rule" || e === "history_visibility" ? t.allowed?.[0] : void 0;
}
function O(e) {
	return e.slice(e.indexOf(":") + 1);
}
async function k(e, t, n, r, i) {
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
			let e = D(n, r), i = { join_rule: e };
			(e === "restricted" || e === "knock_restricted") && (i.allow = [{
				type: "m.room_membership",
				room_id: t.parentSpace
			}]), await s("m.room.join_rules", i);
			return;
		}
		case "history_visibility":
			await s("m.room.history_visibility", { history_visibility: D(n, r) });
			return;
		case "guest_access":
			await s("m.room.guest_access", { guest_access: "forbidden" });
			return;
		case "address": {
			let n = e.getDomain?.() ?? O(e.getUserId() ?? ""), r = `#${o.replace(/^#/, "").replace(/:.*$/, "")}:${n}`;
			await e.createAlias(r, a), await s("m.room.canonical_alias", {
				...t.room?.currentState.getStateEvents("m.room.canonical_alias", "")?.getContent() ?? {},
				alias: r
			});
			return;
		}
		case "space_parent":
			await s("m.space.parent", {
				via: [O(t.parentSpace)],
				canonical: !0
			}, t.parentSpace);
			return;
		case "admins": throw Error("can't be fixed here");
	}
}
function A(e) {
	return e.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9._=-]+/g, "-").replace(/^-+|-+$/g, "");
}
// src/trigger.ts
var j = typeof navigator < "u" && navigator.platform.toUpperCase().includes("MAC");
function M(e, t = j) {
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
function N(e, t) {
	let n = e.key.length === 1 ? e.key.toLowerCase() : e.key, r = /^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : void 0;
	return (n === t.key || !/^[a-z]$/.test(n) && r === t.key) && e.ctrlKey === t.ctrl && e.metaKey === t.meta && e.altKey === t.alt && e.shiftKey === t.shift;
}
function P(e, t = j) {
	let n = [
		e.ctrl && (t ? "⌃" : "Ctrl"),
		e.alt && (t ? "⌥" : "Alt"),
		e.shift && (t ? "⇧" : "Shift"),
		e.meta && (t ? "⌘" : "Meta")
	], r = e.key.length === 1 ? e.key.toUpperCase() : e.key;
	return [...n.filter(Boolean), r].join(t ? "" : "+");
}
// src/ui/checker.css?inline
var F = ".de-datanauten-room-checker{--rc-error:var(--cpd-color-icon-critical-primary,#d51928);--rc-error-bg:var(--cpd-color-bg-critical-subtle,#fff0f0);--rc-warning:var(--cpd-color-orange-900,#bc4500);--rc-warning-bg:var(--cpd-color-orange-300,#ffefe4);--rc-pass:var(--cpd-color-icon-success-primary,#007a62);--rc-pass-bg:var(--cpd-color-bg-success-subtle,#e0f8d9);--rc-line:var(--cpd-color-border-interactive-secondary,#e1e6ec);--rc-muted:var(--cpd-color-text-secondary,#656d77);--rc-subtle:var(--cpd-color-bg-subtle-secondary,#f0f2f5);--rc-focus:var(--cpd-color-border-focused,#0467dd)}.rc-backdrop{z-index:5000;font-family:var(--cpd-font-family-sans,Inter, system-ui, sans-serif);background:#0000008c;justify-content:center;align-items:center;padding:3vh 3vw;animation:.1s ease-out rc-fade;display:flex;position:fixed;inset:0}@keyframes rc-fade{0%{opacity:0}}.rc-panel{background:var(--cpd-color-bg-canvas-default,#fff);width:100%;max-width:1440px;height:100%;color:var(--cpd-color-text-primary,#1b1d22);border-radius:16px;outline:none;flex-direction:column;display:flex;overflow:hidden;box-shadow:0 24px 64px #00000059}.rc-panel :focus-visible{outline:2px solid var(--rc-focus);outline-offset:1px}.rc-header{border-bottom:1px solid var(--rc-line);flex-wrap:wrap;align-items:center;gap:12px 20px;padding:12px 16px;display:flex}.rc-title{margin:0;font-size:18px;font-weight:600;line-height:24px}.rc-space{color:var(--rc-muted);align-items:center;gap:8px;font-size:13px;display:flex}.rc-panel select,.rc-panel input:not([type=checkbox]),.rc-panel textarea{box-sizing:border-box;border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;border-radius:6px;padding:5px 8px;font-size:14px}.rc-space select{max-width:280px;font-weight:600}.rc-tabs{flex:1;gap:4px;display:flex}.rc-tab{color:var(--rc-muted);font:inherit;cursor:pointer;background:0 0;border:none;border-radius:999px;padding:6px 14px;font-size:14px;font-weight:600}.rc-tab:hover{background:var(--rc-subtle)}.rc-tab[aria-selected=true]{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff)}.rc-close{width:36px;height:36px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:none;border-radius:50%;font-size:24px;line-height:1}.rc-close:hover{background:var(--rc-subtle);color:inherit}.rc-body{flex-direction:column;flex:1;min-height:0;display:flex}.rc-footer{border-top:1px solid var(--rc-line);color:var(--rc-muted);align-items:center;gap:12px;padding:8px 16px;font-size:12px;display:flex}.rc-footer>span{flex:1}.rc-footer>.rc-version{opacity:.7;font-variant-numeric:tabular-nums;flex:none}.rc-empty{color:var(--rc-muted);text-align:center;padding:48px 16px}.rc-rooms{flex:1;min-height:0;display:flex}.rc-main{flex-direction:column;flex:1;min-width:0;display:flex;overflow-y:auto}.rc-summary{border-bottom:1px solid var(--rc-line);grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px 32px;padding:16px;display:grid}.rc-stats{flex-wrap:wrap;align-content:start;gap:8px;display:flex}.rc-stat{border:1px solid var(--rc-line);min-width:96px;color:inherit;font:inherit;text-align:left;background:0 0;border-radius:12px;flex-direction:column;padding:10px 14px;display:flex}button.rc-stat{cursor:pointer}button.rc-stat:hover{background:var(--rc-subtle)}.rc-stat[aria-pressed=true]{border-color:var(--rc-focus);box-shadow:inset 0 0 0 1px var(--rc-focus)}.rc-stat-value{font-variant-numeric:tabular-nums;font-size:24px;font-weight:700;line-height:30px}.rc-stat-label{color:var(--rc-muted);font-size:12px}.rc-stat--error .rc-stat-value{color:var(--rc-error)}.rc-stat--warning .rc-stat-value{color:var(--rc-warning)}.rc-stat--pass .rc-stat-value{color:var(--rc-pass)}.rc-stat--unchecked .rc-stat-value{color:var(--rc-muted)}.rc-compliance{grid-column:1;align-items:center;gap:10px;font-size:13px;display:flex}.rc-meter,.rc-bar-track{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);border-radius:4px;height:8px;display:block;overflow:hidden}.rc-meter{flex:none;width:160px}.rc-meter>span,.rc-bar-track>span{border-radius:4px;height:100%;display:block}.rc-meter>span{background:var(--rc-pass)}.rc-section-title{color:var(--rc-muted);letter-spacing:.04em;text-transform:uppercase;grid-area:1/2;font-size:12px;font-weight:600}.rc-bars{flex-direction:column;grid-area:1/2/span 3;gap:2px;margin-top:22px;display:flex}.rc-bar{color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:none;border-radius:6px;grid-template-columns:150px 1fr 32px;align-items:center;gap:10px;padding:3px 6px;font-size:13px;display:grid}.rc-bar:hover:not(:disabled){background:var(--rc-subtle)}.rc-bar:disabled{cursor:default;opacity:.55}.rc-bar[aria-pressed=true]{background:var(--cpd-color-bg-action-secondary-hovered,#f0f2f5);box-shadow:inset 3px 0 0 var(--rc-focus)}.rc-bar--error .rc-bar-track>span{background:var(--rc-error)}.rc-bar--warning .rc-bar-track>span{background:var(--rc-warning)}.rc-bar-count{text-align:right;font-variant-numeric:tabular-nums}.rc-toolbar{flex-wrap:wrap;align-items:center;gap:8px 12px;padding:12px 16px 8px;display:flex}.rc-panel .rc-search{width:240px;height:32px}.rc-chips{flex-wrap:wrap;gap:6px;display:flex}.rc-chip{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);color:inherit;font:inherit;cursor:pointer;background:0 0;border-radius:999px;padding:4px 12px;font-size:13px}.rc-chip[aria-pressed=true]{border-color:var(--cpd-color-bg-action-primary-rest,#1b1d22);background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff)}.rc-table-wrap{padding:0 16px 16px;overflow-x:auto}.rc-table{border-collapse:separate;border-spacing:0;width:100%;font-size:14px}.rc-table thead th{z-index:1;border-bottom:1px solid var(--rc-line);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--rc-muted);vertical-align:bottom;padding:8px 4px;font-size:12px;font-weight:600;position:sticky;top:0}.rc-col-room{text-align:left;min-width:200px}.rc-col-policy{text-align:center;width:72px}.rc-col-policy>span{line-height:14px;display:block}.rc-row{cursor:pointer}.rc-row>*{border-bottom:1px solid var(--rc-line);padding:6px 4px}.rc-row:hover>*{background:var(--rc-subtle)}.rc-row[aria-selected=true]>*{background:var(--cpd-color-bg-action-secondary-hovered,#f0f2f5)}.rc-row[aria-selected=true]>:first-child{box-shadow:inset 3px 0 0 var(--rc-focus)}.rc-row>th{padding-left:8px;font-weight:400}.rc-room-name,.rc-room-meta{white-space:nowrap;text-overflow:ellipsis;max-width:360px;display:block;overflow:hidden}.rc-room-name{font-weight:600}.rc-room-meta{color:var(--rc-muted);font-size:12px}.rc-cell{text-align:center}.rc-status{border-radius:50%;flex:none;justify-content:center;align-items:center;width:22px;height:22px;font-size:13px;font-weight:700;line-height:1;display:inline-flex}.rc-status--pass{background:var(--rc-pass-bg);color:var(--rc-pass)}.rc-status--error{background:var(--rc-error);color:var(--cpd-color-text-on-solid-primary,#fff)}.rc-status--warning{background:var(--rc-warning-bg);color:var(--rc-warning);box-shadow:inset 0 0 0 1.5px var(--rc-warning)}.rc-status--unknown{color:var(--rc-muted)}.rc-detail{border-left:1px solid var(--rc-line);flex-direction:column;flex:none;gap:6px;width:380px;padding:12px 16px 16px;display:flex;overflow-y:auto}.rc-back{color:var(--rc-muted);font:inherit;cursor:pointer;background:0 0;border:none;align-self:flex-start;padding:2px 4px;font-size:13px;font-weight:600}.rc-detail-name{overflow-wrap:anywhere;font-size:18px;font-weight:600}.rc-detail-id{color:var(--rc-muted);overflow-wrap:anywhere;font-size:12px}.rc-actions,.rc-fix-buttons{flex-wrap:wrap;gap:8px;margin:6px 0;display:flex}.rc-button{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;border-radius:999px;padding:5px 14px;font-size:13px;font-weight:600}.rc-button:disabled{cursor:default;opacity:.5}.rc-button--primary{border-color:var(--cpd-color-bg-action-primary-rest,#1b1d22);background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff)}.rc-checks{flex-direction:column;margin:4px 0 0;padding:0;list-style:none;display:flex}.rc-check{border-top:1px solid var(--rc-line);gap:10px;padding:10px 0;display:flex}.rc-check-body{flex:1;min-width:0}.rc-check-name{align-items:center;gap:8px;font-size:14px;font-weight:600;display:flex}.rc-check-detail{color:var(--rc-muted);font-size:13px}.rc-tag{border-radius:999px;padding:0 7px;font-size:11px;font-weight:600}.rc-tag--error{background:var(--rc-error-bg);color:var(--rc-error)}.rc-tag--warning{background:var(--rc-warning-bg);color:var(--rc-warning)}.rc-fix{margin-top:6px}.rc-fix-form{flex-direction:column;gap:6px;margin-top:6px;display:flex}.rc-fix-form input,.rc-fix-form textarea{width:100%}.rc-note{color:var(--rc-muted);margin:4px 0 0;font-size:12px}.rc-note--error{color:var(--rc-error)}.rc-note--ok{color:var(--rc-pass)}.rc-policies{flex-direction:column;flex:1;min-height:0;display:flex}.rc-policies-intro{padding:12px 16px 0;font-size:14px}.rc-policies-intro p{margin:0 0 6px}.rc-policy-list{flex:1;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));align-content:start;gap:12px;margin:0;padding:12px 16px 16px;list-style:none;display:grid;overflow-y:auto}.rc-policy{border:1px solid var(--rc-line);border-radius:12px;flex-direction:column;gap:8px;padding:12px 14px;display:flex}.rc-policy[data-enabled=false]{background:var(--rc-subtle)}.rc-policy[data-enabled=false] .rc-policy-desc{opacity:.7}.rc-switch{cursor:pointer;align-items:center;gap:10px;display:flex}.rc-switch input{width:18px;height:18px;accent-color:var(--cpd-color-bg-action-primary-rest,#1b1d22);margin:0}.rc-policy-name{font-size:15px;font-weight:600}.rc-policy-desc{color:var(--rc-muted);margin:0;font-size:13px}.rc-field{border:none;flex-direction:column;gap:4px;margin:0;padding:0;font-size:13px;display:flex}.rc-field>span:first-child,.rc-field>legend{color:var(--rc-muted);font-size:12px}.rc-field--inline{flex-direction:row;justify-content:space-between;align-items:center}.rc-panel .rc-field--inline input{width:72px}.rc-field input[aria-invalid=true]{border-color:var(--rc-error)}.rc-options{flex-wrap:wrap;gap:4px 14px;display:flex}.rc-option{align-items:center;gap:6px;display:flex}.rc-hint{color:var(--rc-muted);font-size:11px}.rc-savebar{border-top:1px solid var(--rc-line);justify-content:flex-end;align-items:center;gap:10px;padding:10px 16px;display:flex}@media (width<=900px){.rc-summary{grid-template-columns:1fr}.rc-section-title,.rc-bars{grid-area:auto/1;margin-top:0}.rc-detail{width:300px}}@media (width<=640px){.rc-backdrop{padding:0}.rc-panel{border-radius:0}.rc-rooms--detail .rc-main{display:none}.rc-detail{border-left:none;flex:1;width:auto}}@media (prefers-reduced-motion:reduce){.rc-backdrop{animation:none}}", te = "0.1.0", ne = /* @__PURE__ */ e(((e) => {
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
})), I = (/* @__PURE__ */ e(((e, t) => {
	t.exports = ne();
})))();
function re(e) {
	let { space: n, t: r } = e, [a, o] = window.React.useState(n.policies), [s, l] = window.React.useState("idle"), u = JSON.stringify(a) !== JSON.stringify(n.policies), d = a.name.pattern !== void 0 && !c(a.name.pattern), f = !n.canEdit;
	window.React.useEffect(() => {
		u || o(n.policies);
	}, [n]);
	let p = (e, t) => {
		o((n) => ({
			...n,
			[e]: {
				...n[e],
				...t
			}
		})), l("idle");
	}, m = async () => {
		l("saving");
		try {
			await y(e.client, e.spaceId, a), l("saved");
		} catch (e) {
			l({ error: e instanceof Error ? e.message : String(e) });
		}
	};
	return /* @__PURE__ */ (0, I.jsxs)("div", {
		className: "rc-policies",
		children: [
			/* @__PURE__ */ (0, I.jsxs)("div", {
				className: "rc-policies-intro",
				children: [/* @__PURE__ */ (0, I.jsxs)("p", { children: [
					n.saved && n.at ? r(`${t}policies_saved`, {
						user: n.by ?? "?",
						when: J(n.at, e.language)
					}) : r(`${t}policies_defaults`),
					" ",
					r(`${t}policies_scope`)
				] }), f && /* @__PURE__ */ (0, I.jsx)("p", {
					className: "rc-note",
					children: r("datanauten_room_checker_policies_readonly")
				})]
			}),
			/* @__PURE__ */ (0, I.jsx)("ul", {
				className: "rc-policy-list",
				children: i.map((e) => /* @__PURE__ */ (0, I.jsx)(L, {
					id: e,
					config: a[e],
					readOnly: f,
					t: r,
					onChange: (t) => p(e, t)
				}, e))
			}),
			!f && /* @__PURE__ */ (0, I.jsxs)("div", {
				className: "rc-savebar",
				children: [
					typeof s == "object" && /* @__PURE__ */ (0, I.jsx)("span", {
						className: "rc-note rc-note--error",
						children: r("datanauten_room_checker_fix_failed", { error: s.error })
					}),
					s === "saved" && !u && /* @__PURE__ */ (0, I.jsx)("span", {
						className: "rc-note rc-note--ok",
						children: r("datanauten_room_checker_saved")
					}),
					/* @__PURE__ */ (0, I.jsx)("button", {
						type: "button",
						className: "rc-button",
						disabled: !u || s === "saving",
						onClick: () => o(n.policies),
						children: r("datanauten_room_checker_discard")
					}),
					/* @__PURE__ */ (0, I.jsx)("button", {
						type: "button",
						className: "rc-button rc-button--primary",
						disabled: !u && n.saved || d || s === "saving",
						onClick: () => void m(),
						children: r(s === "saving" ? "datanauten_room_checker_saving" : "datanauten_room_checker_save_policies")
					})
				]
			})
		]
	});
}
function L(e) {
	let { id: n, config: r, readOnly: i, t: o } = e, s = a[n], l = r.pattern === void 0 || c(r.pattern);
	return /* @__PURE__ */ (0, I.jsxs)("li", {
		className: "rc-policy",
		"data-enabled": r.enabled,
		children: [
			/* @__PURE__ */ (0, I.jsxs)("label", {
				className: "rc-switch",
				children: [/* @__PURE__ */ (0, I.jsx)("input", {
					type: "checkbox",
					role: "switch",
					checked: r.enabled,
					disabled: i,
					onChange: (t) => e.onChange({ enabled: t.target.checked })
				}), /* @__PURE__ */ (0, I.jsx)("span", {
					className: "rc-policy-name",
					children: o(`${t}policy_${n}`)
				})]
			}),
			/* @__PURE__ */ (0, I.jsx)("p", {
				className: "rc-policy-desc",
				children: o(`${t}policy_${n}_desc`)
			}),
			/* @__PURE__ */ (0, I.jsxs)("label", {
				className: "rc-field rc-field--inline",
				children: [/* @__PURE__ */ (0, I.jsx)("span", { children: o(`${t}severity`) }), /* @__PURE__ */ (0, I.jsxs)("select", {
					value: r.severity,
					disabled: i || !r.enabled,
					"aria-label": `${o(`${t}policy_${n}`)}: ${o(`${t}severity`)}`,
					onChange: (t) => e.onChange({ severity: t.target.value }),
					children: [/* @__PURE__ */ (0, I.jsx)("option", {
						value: "error",
						children: o(`${t}severity_error`)
					}), /* @__PURE__ */ (0, I.jsx)("option", {
						value: "warning",
						children: o(`${t}severity_warning`)
					})]
				})]
			}),
			r.pattern !== void 0 && /* @__PURE__ */ (0, I.jsxs)("label", {
				className: "rc-field",
				children: [
					/* @__PURE__ */ (0, I.jsx)("span", { children: o("datanauten_room_checker_param_pattern") }),
					/* @__PURE__ */ (0, I.jsx)("input", {
						value: r.pattern,
						disabled: i || !r.enabled,
						placeholder: "^[A-Z].*",
						"aria-invalid": !l,
						spellCheck: !1,
						onChange: (t) => e.onChange({ pattern: t.target.value })
					}),
					!l && /* @__PURE__ */ (0, I.jsx)("span", {
						className: "rc-note rc-note--error",
						children: o("datanauten_room_checker_param_pattern_invalid")
					})
				]
			}),
			r.minLength !== void 0 && /* @__PURE__ */ (0, I.jsx)(R, {
				label: o("datanauten_room_checker_param_min_length"),
				value: r.minLength,
				max: 1e3,
				disabled: i || !r.enabled,
				onChange: (t) => e.onChange({ minLength: t })
			}),
			r.min !== void 0 && /* @__PURE__ */ (0, I.jsx)(R, {
				label: o("datanauten_room_checker_param_min"),
				value: r.min,
				max: 100,
				disabled: i || !r.enabled,
				onChange: (t) => e.onChange({ min: t })
			}),
			s && r.allowed && /* @__PURE__ */ (0, I.jsxs)("fieldset", {
				className: "rc-field",
				disabled: i || !r.enabled,
				children: [
					/* @__PURE__ */ (0, I.jsx)("legend", { children: o("datanauten_room_checker_param_allowed") }),
					/* @__PURE__ */ (0, I.jsx)("div", {
						className: "rc-options",
						children: s.map((t) => /* @__PURE__ */ (0, I.jsxs)("label", {
							className: "rc-option",
							children: [/* @__PURE__ */ (0, I.jsx)("input", {
								type: "checkbox",
								checked: r.allowed.includes(t),
								disabled: r.allowed.length === 1 && r.allowed[0] === t,
								onChange: (n) => e.onChange({ allowed: n.target.checked ? s.filter((e) => e === t || r.allowed.includes(e)) : r.allowed.filter((e) => e !== t) })
							}), o(`datanauten_room_checker_value_${t}`)]
						}, t))
					}),
					/* @__PURE__ */ (0, I.jsx)("span", {
						className: "rc-hint",
						children: o("datanauten_room_checker_param_allowed_fix")
					})
				]
			})
		]
	});
}
function R(e) {
	return /* @__PURE__ */ (0, I.jsxs)("label", {
		className: "rc-field rc-field--inline",
		children: [/* @__PURE__ */ (0, I.jsx)("span", { children: e.label }), /* @__PURE__ */ (0, I.jsx)("input", {
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
// src/ui/CheckerOverlay.tsx
function z(e) {
	let { client: n, spaces: r, t: i } = e, a = window.React.useId(), [o, s] = window.React.useState(() => r.find((t) => t.id === e.space)?.id ?? r[0]?.id), [c, l] = window.React.useState("rooms"), [u, d] = window.React.useState("all"), [f, p] = window.React.useState(""), [m, h] = window.React.useState(), [g, _] = window.React.useState(/* @__PURE__ */ new Map()), y = window.React.useRef(null);
	window.React.useEffect(() => y.current?.focus(), []), window.React.useEffect(() => {
		if (!o) return;
		let e = !0;
		return _(/* @__PURE__ */ new Map()), x(n, o).then((t) => e && _(t)), () => {
			e = !1;
		};
	}, [n, o]);
	let b = window.React.useMemo(() => o ? v(n, o) : void 0, [
		n,
		o,
		e.revision
	]), S = window.React.useMemo(() => o && b ? ee(n, o, b.policies, g) : [], [
		n,
		o,
		b,
		g,
		e.revision
	]), C = (t) => {
		s(t), h(void 0), d("all"), e.onSpaceChange(t);
	}, w = (t) => {
		t.key === "Escape" && (t.preventDefault(), m ? h(void 0) : e.onClose());
	}, T;
	return T = !o || !b ? /* @__PURE__ */ (0, I.jsx)("div", {
		className: "rc-empty",
		children: i(`${t}no_spaces`)
	}) : c === "policies" ? /* @__PURE__ */ (0, I.jsx)(re, {
		client: n,
		spaceId: o,
		space: b,
		revision: e.revision,
		language: e.language,
		t: i
	}, o) : /* @__PURE__ */ (0, I.jsx)(B, {
		...e,
		spaceId: o,
		entries: S,
		policies: b.policies,
		filter: u,
		setFilter: d,
		query: f,
		setQuery: p,
		selected: m,
		setSelected: h,
		spaceName: (e) => r.find((t) => t.id === e)?.name ?? n.getRoom(e)?.name ?? e
	}), /* @__PURE__ */ (0, I.jsx)("div", {
		className: "rc-backdrop",
		onMouseDown: (t) => t.target === t.currentTarget && e.onClose(),
		children: /* @__PURE__ */ (0, I.jsxs)("div", {
			ref: y,
			tabIndex: -1,
			className: "rc-panel",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": a,
			onKeyDown: w,
			children: [
				/* @__PURE__ */ (0, I.jsxs)("header", {
					className: "rc-header",
					children: [
						/* @__PURE__ */ (0, I.jsx)("h2", {
							id: a,
							className: "rc-title",
							children: i(`${t}title`)
						}),
						r.length > 0 && /* @__PURE__ */ (0, I.jsxs)("label", {
							className: "rc-space",
							children: [/* @__PURE__ */ (0, I.jsx)("span", { children: i("datanauten_room_checker_space") }), /* @__PURE__ */ (0, I.jsx)("select", {
								value: o,
								onChange: (e) => C(e.target.value),
								children: r.map((e) => /* @__PURE__ */ (0, I.jsxs)("option", {
									value: e.id,
									children: ["\xA0\xA0".repeat(e.depth), e.name]
								}, e.id))
							})]
						}),
						/* @__PURE__ */ (0, I.jsx)("div", {
							className: "rc-tabs",
							role: "tablist",
							children: ["rooms", "policies"].map((e) => /* @__PURE__ */ (0, I.jsx)("button", {
								type: "button",
								role: "tab",
								className: "rc-tab",
								"aria-selected": c === e,
								onClick: () => l(e),
								children: i(`${t}tab_${e}`)
							}, e))
						}),
						/* @__PURE__ */ (0, I.jsx)("button", {
							type: "button",
							className: "rc-close",
							"aria-label": i(`${t}close`),
							onClick: e.onClose,
							children: "×"
						})
					]
				}),
				/* @__PURE__ */ (0, I.jsx)("div", {
					className: "rc-body",
					children: T
				}),
				/* @__PURE__ */ (0, I.jsxs)("footer", {
					className: "rc-footer",
					children: [/* @__PURE__ */ (0, I.jsx)("span", { children: i(`${t}hint`, { key: e.triggerLabel }) }), /* @__PURE__ */ (0, I.jsxs)("span", {
						className: "rc-version",
						children: ["v", te]
					})]
				})
			]
		})
	});
}
function B(e) {
	let { entries: n, policies: r, filter: a, t: o } = e, s = i.filter((e) => r[e].enabled), c = n.filter((e) => e.report), l = c.filter((e) => !e.report.errors && !e.report.warnings).length, u = c.filter((e) => e.report.errors).length, d = c.filter((e) => !e.report.errors && e.report.warnings).length, f = (e) => c.filter((t) => t.report.results.get(e)?.pass === !1).length, p = e.query.trim().toLowerCase(), m = n.filter((e) => p && !e.name.toLowerCase().includes(p) && !e.id.toLowerCase().includes(p) ? !1 : a === "failing" ? !!(e.report && (e.report.errors || e.report.warnings)) : a === "errors" ? !!e.report?.errors : a === "warnings" ? !!(e.report && !e.report.errors && e.report.warnings) : a === "unchecked" ? !e.report : a === "all" || e.report?.results.get(a)?.pass === !1).sort((e, t) => V(t) - V(e) || e.name.localeCompare(t.name)), h = e.selected ? n.find((t) => t.id === e.selected) : void 0, g = c.length ? Math.round(l / c.length * 100) : 0, _ = (t, n, r, i) => /* @__PURE__ */ (0, I.jsxs)("button", {
		type: "button",
		className: `rc-stat rc-stat--${i}`,
		"aria-pressed": a === t,
		onClick: () => e.setFilter(a === t ? "all" : t),
		children: [/* @__PURE__ */ (0, I.jsx)("span", {
			className: "rc-stat-value",
			children: n
		}), /* @__PURE__ */ (0, I.jsx)("span", {
			className: "rc-stat-label",
			children: r
		})]
	});
	return /* @__PURE__ */ (0, I.jsxs)("div", {
		className: `rc-rooms${h ? " rc-rooms--detail" : ""}`,
		children: [/* @__PURE__ */ (0, I.jsxs)("div", {
			className: "rc-main",
			children: [
				/* @__PURE__ */ (0, I.jsxs)("section", {
					className: "rc-summary",
					"aria-label": o(`${t}tab_rooms`),
					children: [
						/* @__PURE__ */ (0, I.jsxs)("div", {
							className: "rc-stats",
							children: [
								_("all", n.length, o(`${t}stat_rooms`), "all"),
								_("errors", u, o(`${t}stat_errors`), "error"),
								_("warnings", d, o(`${t}stat_warnings`), "warning"),
								/* @__PURE__ */ (0, I.jsxs)("div", {
									className: "rc-stat rc-stat--pass",
									children: [/* @__PURE__ */ (0, I.jsx)("span", {
										className: "rc-stat-value",
										children: l
									}), /* @__PURE__ */ (0, I.jsx)("span", {
										className: "rc-stat-label",
										children: o(`${t}stat_pass`)
									})]
								}),
								n.length > c.length && _("unchecked", n.length - c.length, o("datanauten_room_checker_stat_unchecked"), "unchecked")
							]
						}),
						c.length > 0 && /* @__PURE__ */ (0, I.jsxs)("div", {
							className: "rc-compliance",
							children: [/* @__PURE__ */ (0, I.jsx)("span", {
								className: "rc-meter",
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, I.jsx)("span", { style: { width: `${g}%` } })
							}), /* @__PURE__ */ (0, I.jsx)("span", { children: o("datanauten_room_checker_compliance", { percent: `${g} %` }) })]
						}),
						/* @__PURE__ */ (0, I.jsx)("div", {
							className: "rc-section-title",
							children: o(`${t}by_policy`)
						}),
						/* @__PURE__ */ (0, I.jsx)("div", {
							className: "rc-bars",
							children: s.map((n) => {
								let i = f(n);
								return /* @__PURE__ */ (0, I.jsxs)("button", {
									type: "button",
									className: `rc-bar rc-bar--${r[n].severity}`,
									"aria-pressed": a === n,
									disabled: !i,
									onClick: () => e.setFilter(a === n ? "all" : n),
									children: [
										/* @__PURE__ */ (0, I.jsx)("span", {
											className: "rc-bar-label",
											children: o(`${t}policy_${n}`)
										}),
										/* @__PURE__ */ (0, I.jsx)("span", {
											className: "rc-bar-track",
											"aria-hidden": "true",
											children: /* @__PURE__ */ (0, I.jsx)("span", { style: { width: c.length ? `${i / c.length * 100}%` : 0 } })
										}),
										/* @__PURE__ */ (0, I.jsx)("span", {
											className: "rc-bar-count",
											children: i
										})
									]
								}, n);
							})
						})
					]
				}),
				/* @__PURE__ */ (0, I.jsxs)("div", {
					className: "rc-toolbar",
					children: [/* @__PURE__ */ (0, I.jsx)("input", {
						className: "rc-search",
						type: "search",
						placeholder: o(`${t}search`),
						"aria-label": o(`${t}search`),
						value: e.query,
						onChange: (t) => e.setQuery(t.target.value)
					}), /* @__PURE__ */ (0, I.jsxs)("div", {
						className: "rc-chips",
						role: "group",
						children: [[
							"all",
							"failing",
							"unchecked"
						].map((n) => /* @__PURE__ */ (0, I.jsx)("button", {
							type: "button",
							className: "rc-chip",
							"aria-pressed": a === n,
							onClick: () => e.setFilter(n),
							children: o(`${t}filter_${n}`)
						}, n)), i.includes(a) && /* @__PURE__ */ (0, I.jsxs)("button", {
							type: "button",
							className: "rc-chip",
							"aria-pressed": !0,
							onClick: () => e.setFilter("all"),
							children: [o("datanauten_room_checker_filter_policy", { policy: o(`datanauten_room_checker_policy_${a}`) }), " ×"]
						})]
					})]
				}),
				n.length === 0 ? /* @__PURE__ */ (0, I.jsx)("div", {
					className: "rc-empty",
					children: o(`${t}no_rooms`)
				}) : m.length === 0 ? /* @__PURE__ */ (0, I.jsx)("div", {
					className: "rc-empty",
					children: o(`${t}no_match`)
				}) : /* @__PURE__ */ (0, I.jsx)("div", {
					className: "rc-table-wrap",
					children: /* @__PURE__ */ (0, I.jsxs)("table", {
						className: "rc-table",
						children: [/* @__PURE__ */ (0, I.jsx)("thead", { children: /* @__PURE__ */ (0, I.jsxs)("tr", { children: [/* @__PURE__ */ (0, I.jsx)("th", {
							scope: "col",
							className: "rc-col-room",
							children: o(`${t}col_room`)
						}), s.map((e) => /* @__PURE__ */ (0, I.jsx)("th", {
							scope: "col",
							className: "rc-col-policy",
							title: o(`${t}policy_${e}_desc`),
							children: /* @__PURE__ */ (0, I.jsx)("span", { children: o(`${t}policy_${e}`) })
						}, e))] }) }), /* @__PURE__ */ (0, I.jsx)("tbody", { children: m.map((t) => /* @__PURE__ */ (0, I.jsxs)("tr", {
							className: "rc-row",
							"aria-selected": t.id === e.selected,
							tabIndex: 0,
							onClick: () => e.setSelected(t.id),
							onKeyDown: (n) => {
								(n.key === "Enter" || n.key === " ") && (n.preventDefault(), e.setSelected(t.id));
							},
							children: [/* @__PURE__ */ (0, I.jsxs)("th", {
								scope: "row",
								className: "rc-col-room",
								children: [/* @__PURE__ */ (0, I.jsx)("span", {
									className: "rc-room-name",
									children: t.name
								}), /* @__PURE__ */ (0, I.jsx)("span", {
									className: "rc-room-meta",
									children: H(t, o)
								})]
							}), s.map((e) => /* @__PURE__ */ (0, I.jsx)("td", {
								className: "rc-cell",
								children: /* @__PURE__ */ (0, I.jsx)(U, {
									entry: t,
									id: e,
									severity: r[e].severity,
									t: o
								})
							}, e))]
						}, t.id)) })]
					})
				})
			]
		}), h && /* @__PURE__ */ (0, I.jsx)(G, {
			...e,
			entry: h,
			onBack: () => e.setSelected(void 0)
		})]
	});
}
function V(e) {
	return e.report ? e.report.errors * 100 + e.report.warnings : -1;
}
function H(e, n) {
	if (!e.report) return n(`${t}not_joined`);
	let r = [e.report.errors ? q(n, "room_errors", e.report.errors) : "", e.report.warnings ? q(n, "room_warnings", e.report.warnings) : ""].filter(Boolean);
	return r.length ? r.join(" · ") : n(`${t}room_ok`);
}
function U(e) {
	let n = e.entry.report?.results.get(e.id);
	if (!n) return /* @__PURE__ */ (0, I.jsx)("span", {
		className: "rc-status rc-status--unknown",
		"aria-label": "–",
		children: "–"
	});
	let r = n.pass ? e.t(`${t}passes`) : W(n.detail, e.t), i = n.pass ? "pass" : e.severity;
	return /* @__PURE__ */ (0, I.jsx)("span", {
		className: `rc-status rc-status--${i}`,
		title: r,
		"aria-label": r,
		children: n.pass ? "✓" : i === "error" ? "✕" : "!"
	});
}
function W(e, n) {
	if (!e) return "";
	let r = { ...e.vars };
	return r.value &&= n(`${t}value_${r.value}`), n(`${t}check_${e.key}`, r);
}
function G(e) {
	let { entry: n, policies: r, t: a } = e, o = i.filter((e) => r[e].enabled), s = o.filter((e) => n.report?.results.get(e)?.pass === !1), c = o.filter((e) => n.report?.results.get(e)?.pass), l = n.parentSpace !== e.spaceId && n.parentSpace;
	return /* @__PURE__ */ (0, I.jsxs)("aside", {
		className: "rc-detail",
		"data-testid": "room-checker-detail",
		"aria-label": n.name,
		children: [
			/* @__PURE__ */ (0, I.jsxs)("button", {
				type: "button",
				className: "rc-back",
				onClick: e.onBack,
				children: ["‹ ", a(`${t}back`)]
			}),
			/* @__PURE__ */ (0, I.jsx)("div", {
				className: "rc-detail-name",
				children: n.name
			}),
			/* @__PURE__ */ (0, I.jsx)("div", {
				className: "rc-detail-id",
				children: n.id
			}),
			l && /* @__PURE__ */ (0, I.jsx)("div", {
				className: "rc-detail-id",
				children: a("datanauten_room_checker_in_subspace", { space: e.spaceName(l) })
			}),
			/* @__PURE__ */ (0, I.jsxs)("div", {
				className: "rc-actions",
				children: [/* @__PURE__ */ (0, I.jsx)("button", {
					type: "button",
					className: "rc-button",
					onClick: () => e.onOpenRoom(n.id),
					children: a(`${t}open_room`)
				}), n.room && /* @__PURE__ */ (0, I.jsx)("button", {
					type: "button",
					className: "rc-button",
					onClick: () => e.onRoomSettings(n.id),
					children: a("datanauten_room_checker_room_settings")
				})]
			}),
			n.report ? /* @__PURE__ */ (0, I.jsx)("ul", {
				className: "rc-checks",
				children: [...s, ...c].map((i) => {
					let o = n.report.results.get(i);
					return /* @__PURE__ */ (0, I.jsxs)("li", {
						className: "rc-check",
						children: [/* @__PURE__ */ (0, I.jsx)(U, {
							entry: n,
							id: i,
							severity: r[i].severity,
							t: a
						}), /* @__PURE__ */ (0, I.jsxs)("div", {
							className: "rc-check-body",
							children: [
								/* @__PURE__ */ (0, I.jsxs)("div", {
									className: "rc-check-name",
									children: [a(`${t}policy_${i}`), !o.pass && /* @__PURE__ */ (0, I.jsx)("span", {
										className: `rc-tag rc-tag--${r[i].severity}`,
										children: a(`datanauten_room_checker_severity_${r[i].severity}`)
									})]
								}),
								/* @__PURE__ */ (0, I.jsx)("div", {
									className: "rc-check-detail",
									children: o.pass ? a(`${t}passes`) : W(o.detail, a)
								}),
								!o.pass && /* @__PURE__ */ (0, I.jsx)(K, {
									...e,
									id: i
								})
							]
						})]
					}, i);
				})
			}) : /* @__PURE__ */ (0, I.jsx)("p", {
				className: "rc-note",
				children: a(`${t}not_joined_detail`)
			})
		]
	});
}
function K(e) {
	let { client: n, entry: r, id: i, policies: a, t: o } = e, [s, c] = window.React.useState({ step: "idle" }), l = window.React.useRef(null), u = a[i];
	if (window.React.useEffect(() => c({ step: "idle" }), [r.id, i]), !w[i]) return /* @__PURE__ */ (0, I.jsx)("div", {
		className: "rc-note",
		children: o(`${t}no_fix`)
	});
	if (!E(n, r, i)) return /* @__PURE__ */ (0, I.jsx)("div", {
		className: "rc-note",
		children: o(`${t}no_power`)
	});
	let d = async (e) => {
		c({ step: "busy" });
		try {
			await k(n, r, i, u, e), c({ step: "done" });
		} catch (e) {
			c({
				step: "failed",
				error: e instanceof Error ? e.message : String(e)
			});
		}
	}, f = D(i, u), p = o(`${t}fix_${i}`, f ? { value: o(`${t}value_${f}`) } : void 0), m = T[i];
	return s.step === "busy" ? /* @__PURE__ */ (0, I.jsx)("div", {
		className: "rc-note",
		children: "…"
	}) : s.step === "done" ? /* @__PURE__ */ (0, I.jsx)("div", {
		className: "rc-note rc-note--ok",
		children: o(`${t}fix_done`)
	}) : s.step === "edit" ? /* @__PURE__ */ (0, I.jsxs)("form", {
		className: "rc-fix-form",
		onSubmit: (e) => {
			e.preventDefault(), s.value.trim() && d(s.value);
		},
		children: [i === "topic" ? /* @__PURE__ */ (0, I.jsx)("textarea", {
			"aria-label": p,
			value: s.value,
			autoFocus: !0,
			rows: 3,
			onChange: (e) => c({
				step: "edit",
				value: e.target.value
			})
		}) : /* @__PURE__ */ (0, I.jsx)("input", {
			"aria-label": p,
			value: s.value,
			autoFocus: !0,
			onChange: (e) => c({
				step: "edit",
				value: e.target.value
			})
		}), /* @__PURE__ */ (0, I.jsxs)("div", {
			className: "rc-fix-buttons",
			children: [/* @__PURE__ */ (0, I.jsx)("button", {
				type: "submit",
				className: "rc-button rc-button--primary",
				disabled: !s.value.trim(),
				children: o(`${t}save`)
			}), /* @__PURE__ */ (0, I.jsx)("button", {
				type: "button",
				className: "rc-button",
				onClick: () => c({ step: "idle" }),
				children: o(`${t}cancel`)
			})]
		})]
	}) : s.step === "confirm" ? /* @__PURE__ */ (0, I.jsxs)("div", {
		className: "rc-fix-form",
		children: [/* @__PURE__ */ (0, I.jsx)("div", {
			className: "rc-note",
			children: o(`${t}fix_encryption_confirm`)
		}), /* @__PURE__ */ (0, I.jsxs)("div", {
			className: "rc-fix-buttons",
			children: [/* @__PURE__ */ (0, I.jsx)("button", {
				type: "button",
				className: "rc-button rc-button--primary",
				onClick: () => void d(),
				children: p
			}), /* @__PURE__ */ (0, I.jsx)("button", {
				type: "button",
				className: "rc-button",
				onClick: () => c({ step: "idle" }),
				children: o(`${t}cancel`)
			})]
		})]
	}) : /* @__PURE__ */ (0, I.jsxs)("div", {
		className: "rc-fix",
		children: [
			/* @__PURE__ */ (0, I.jsx)("button", {
				type: "button",
				className: "rc-button rc-button--primary",
				onClick: () => {
					if (m === "file") return l.current?.click();
					if (m === "text") {
						let e = r.room, t = i === "name" ? e?.name ?? "" : i === "topic" ? e ? C(e) : "" : A(r.name);
						return c({
							step: "edit",
							value: t
						});
					}
					if (i === "encryption") return c({ step: "confirm" });
					d();
				},
				children: p
			}),
			m === "file" && /* @__PURE__ */ (0, I.jsx)("input", {
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
			s.step === "failed" && /* @__PURE__ */ (0, I.jsx)("div", {
				className: "rc-note rc-note--error",
				children: o("datanauten_room_checker_fix_failed", { error: s.error })
			})
		]
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
var Y = "de.datanauten.room_checker", X = "de-datanauten-room-checker-style", Z = "de.datanauten.room_checker.space", ie = 300;
function Q(e) {
	let t = e ?? {};
	if (typeof t != "object") throw Error("expected an object");
	let n = { trigger_key: "Alt+R" };
	if (t.trigger_key !== void 0) {
		if (typeof t.trigger_key != "string") throw Error("trigger_key must be a string");
		n.trigger_key = t.trigger_key;
	}
	return M(n.trigger_key), n;
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
		this.trigger = M(e.trigger_key), this.api.i18n.register(n), se(), window.addEventListener("keydown", this.onKeyDown, { capture: !0 });
	}
	dispose() {
		this.close(), window.removeEventListener("keydown", this.onKeyDown, { capture: !0 });
	}
	isOpen() {
		return !!this.root;
	}
	open() {
		if (this.root) return;
		let e = g();
		e?.getUserId?.() ? (this.client = e, e.on?.("RoomState.events", this.onStateEvent), this.restoreFocus = document.activeElement, this.container = document.createElement("div"), this.container.className = "de-datanauten-room-checker", document.body.appendChild(this.container), this.container.addEventListener("keydown", (e) => e.stopPropagation()), this.root = this.api.createRoot(this.container), this.render()) : console.warn("[room-checker] Element's Matrix client isn't available");
	}
	close() {
		this.root && (clearTimeout(this.recheckTimer), this.client?.removeListener?.("RoomState.events", this.onStateEvent), this.root.unmount(), this.container?.remove(), this.root = void 0, this.container = void 0, this.client = void 0, this.restoreFocus?.focus?.(), this.restoreFocus = void 0);
	}
	render() {
		let e = this.client;
		this.root && e && this.root.render(/* @__PURE__ */ (0, I.jsx)(z, {
			client: e,
			spaces: _(e),
			space: ae(Z),
			revision: this.revision,
			language: this.api.i18n.language,
			triggerLabel: P(this.trigger),
			t: this.t,
			onSpaceChange: (e) => oe(Z, e),
			onOpenRoom: (e) => this.openRoom(e),
			onRoomSettings: (e) => this.openRoomSettings(e),
			onClose: () => this.close()
		}));
	}
	onStateEvent = () => {
		clearTimeout(this.recheckTimer), this.recheckTimer = setTimeout(() => {
			this.revision++, this.render();
		}, ie);
	};
	onKeyDown = (e) => {
		e.isComposing || e.defaultPrevented || !N(e, this.trigger) || (e.preventDefault(), e.stopImmediatePropagation(), this.root ? this.close() : this.open());
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
function ae(e) {
	try {
		return localStorage.getItem(e) ?? void 0;
	} catch {
		return;
	}
}
function oe(e, t) {
	try {
		localStorage.setItem(e, t);
	} catch {}
}
function se() {
	if (document.getElementById(X)) return;
	let e = document.createElement("style");
	e.id = X, e.textContent = F, document.head.appendChild(e);
}
export { Y as CONFIG_KEY, $ as RoomCheckerModule, $ as default, Q as parseConfig };

//# sourceMappingURL=index.js.map