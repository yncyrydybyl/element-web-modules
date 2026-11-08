// \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, o) => (o = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule || !a.call(n, "default") ? t(o, "default", {
	value: n,
	enumerable: !0
}) : o, n)), l = "de.datanauten.people_map.avatars", u = 96, d = 6, f = 100, p = class {
	client;
	persist;
	urls = /* @__PURE__ */ new Map();
	colours = /* @__PURE__ */ new Map();
	seen = /* @__PURE__ */ new Set();
	queue = [];
	listeners = /* @__PURE__ */ new Set();
	running = 0;
	version = 0;
	notifyTimer;
	disposed = !1;
	constructor(e, t = () => !1) {
		this.client = e, this.persist = t;
	}
	static async clearPersisted() {
		try {
			await globalThis.caches?.delete(l);
		} catch {}
	}
	get(e) {
		return e ? this.urls.get(e) : void 0;
	}
	colour(e) {
		return e ? this.colours.get(e) : void 0;
	}
	request(e) {
		for (let t of e) t?.startsWith("mxc://") && !this.seen.has(t) && (this.seen.add(t), this.queue.push(t));
		this.pump();
	}
	getVersion = () => this.version;
	subscribe = (e) => (this.listeners.add(e), () => this.listeners.delete(e));
	dispose() {
		this.disposed = !0, clearTimeout(this.notifyTimer);
		for (let e of this.urls.values()) URL.revokeObjectURL(e);
		this.urls.clear(), this.colours.clear(), this.queue.length = 0;
	}
	pump() {
		for (; this.running < d && this.queue.length;) {
			let e = this.queue.shift();
			this.running++, this.load(e).finally(() => {
				this.running--, this.pump();
			});
		}
	}
	async load(e) {
		let t = await this.readPersisted(e), n = t ?? await this.fetch(e, !0) ?? await this.fetch(e, !1);
		if (!n || this.disposed) return;
		t || this.writePersisted(e, n);
		let r = await h(n);
		this.disposed || (this.urls.set(e, URL.createObjectURL(n)), r && this.colours.set(e, r), this.notifyTimer ??= setTimeout(() => {
			this.notifyTimer = void 0, this.version++;
			for (let e of this.listeners) e();
		}, f));
	}
	async readPersisted(e) {
		if (this.persist()) try {
			let t = await (await (await caches.open(l)).match(m(e)))?.blob();
			return t?.type.startsWith("image/") ? t : void 0;
		} catch {
			return;
		}
	}
	async writePersisted(e, t) {
		if (this.persist()) try {
			await (await caches.open(l)).put(m(e), new Response(t, { headers: { "Content-Type": t.type } }));
		} catch {}
	}
	async fetch(e, t) {
		let n = this.client.mxcUrlToHttp?.(e, u, u, "crop", !1, !0, t), r = t ? this.client.getAccessToken?.() : void 0;
		if (!(!n || t && !r)) try {
			let e = await fetch(n, r ? { headers: { Authorization: `Bearer ${r}` } } : void 0);
			if (!e.ok) return;
			let t = await e.blob();
			return t.type.startsWith("image/") ? t : void 0;
		} catch {
			return;
		}
	}
};
function m(e) {
	return new URL(`/__people_map/avatar/${encodeURIComponent(e.slice(6))}`, window.location.origin).href;
}
async function h(e) {
	if (typeof createImageBitmap == "function" && typeof OffscreenCanvas == "function") try {
		let t = await createImageBitmap(e, {
			resizeWidth: 4,
			resizeHeight: 4,
			resizeQuality: "medium"
		}), n = new OffscreenCanvas(4, 4).getContext("2d");
		if (!n) return;
		n.drawImage(t, 0, 0), t.close();
		let r = n.getImageData(0, 0, 4, 4).data, i = [
			0,
			0,
			0
		], a = 0;
		for (let e = 0; e < r.length; e += 4) {
			let t = r[e + 3] / 255;
			for (let n = 0; n < 3; n++) i[n] += r[e + n] * t;
			a += t;
		}
		return a > 0 ? `rgb(${i.map((e) => Math.round(e / a)).join(", ")})` : void 0;
	} catch {
		return;
	}
}
// src/districts.ts
var g = [
	"communities",
	"events",
	"people",
	"bridges",
	"unsorted",
	"archive"
], _ = {
	older: "%(network)s (older)",
	smallGroups: "Small groups",
	loose: "Loose rooms",
	otherSpaces: "Other spaces",
	junk: "Deleted & tests",
	nameless: "No name",
	solo: "Only you"
}, v = [
	["WhatsApp", /whatsapp|\(WA\)|@whatsapp_/i],
	["Telegram", /telegram|\(TG\)|@telegram_/i],
	["Signal", /signal|@signal_/i],
	["Discord", /discord|@discord_/i],
	["Slack", /slack|@slack_/i],
	["IRC", /\birc\b|libera|oftc/i]
], y = /\b(19|20)\d{2}\b|\b\d{1,2}c3\b|camp|conference|congress|summit|fosdem|froscon|fossasia|hackathon|meetup|festival|workation|easterhegg|ethberlin|ethbrno|\bevents?\b/i, b = /^(deleted|test|testing|tmp|old)\b|^\(deleted|\btest-?room\b/i, x = 15552e6, S = 10, C = 3, w = /* @__PURE__ */ new Set([
	"the",
	"a",
	"an",
	"my",
	"our",
	"der",
	"die",
	"das",
	"re",
	"fwd",
	"new"
]);
function T(e) {
	return v.find(([, t]) => t.test(e))?.[0];
}
function E(e, t = _, n = Date.now()) {
	let r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = (e, t, n, a, o) => {
		let s = r.get(e);
		s || r.set(e, s = {
			key: e,
			district: t,
			label: n,
			spaceId: o,
			rooms: []
		}), s.rooms.push(a), i.set(a, e);
	}, o = /* @__PURE__ */ new Map(), s = (t, n = /* @__PURE__ */ new Set()) => {
		if (o.has(t)) return o.get(t);
		let r = e.rooms.get(t);
		if (!r || n.has(t)) return [];
		n.add(t);
		let i = r.parents.length ? [...new Set(r.parents.flatMap((t) => e.rooms.get(t).parents.length ? s(t, n) : [t]))] : [];
		return o.set(t, i), i;
	}, c = (t) => T(e.rooms.get(t).name), l = (e) => y.test(e.name) || e.aliases.some((e) => /events\.|\.events/.test(e)), u = (t) => {
		let n = /* @__PURE__ */ new Set(), r = e.rooms.get(t)?.parents[0];
		for (; r && !n.has(r);) {
			if (n.add(r), l(e.rooms.get(r))) return r;
			r = e.rooms.get(r)?.parents[0];
		}
	}, d = [...e.rooms.values()].filter((e) => e.kind !== "space"), f = [];
	for (let r of d) {
		let i = [r.name, ...r.aliases].join(" "), o = s(r.id), l = o.map(c).find(Boolean), d = T(i) ?? l, p = r.name.startsWith("@") || r.name.startsWith("!");
		if (b.test(r.name)) a("archive/junk", "archive", t.junk, r.id);
		else if (r.name.startsWith("!") && !o.length) a("archive/nameless", "archive", t.nameless, r.id);
		else if (r.members <= 1 && r.kind !== "dm" && !o.length) a("archive/solo", "archive", t.solo, r.id);
		else if (r.kind === "dm" || r.members <= 2 && (p || !o.length || l)) {
			let e = d ?? "Matrix";
			e === "Matrix" && r.lastActive > 0 && n - r.lastActive > x ? a("people/Matrix-older", "people", t.older.replace("%(network)s", e), r.id) : a(`people/${e}`, "people", e, r.id);
		} else if (o.length && !l) {
			let t = u(r.id), n = t ?? o[0];
			a(`${t ? "events" : "communities"}/${n}`, t ? "events" : "communities", e.rooms.get(n).name, r.id, n);
		} else d ? a(`bridges/${d}`, "bridges", d, r.id) : f.push(r);
	}
	let p = /* @__PURE__ */ new Map();
	for (let t of e.topSpaces) {
		let n = D(e.rooms.get(t).name);
		n && !p.has(n) && p.set(n, e.rooms.get(t));
	}
	let m = A(f, (e) => D(e.name)), h = A(f, (e) => O(e)), v = j(d.map(O));
	for (let n of f) {
		let r = D(n.name), i = r ? p.get(r) : void 0, o = O(n);
		if (i && e.rooms.get(i.id)) {
			let e = l(i);
			a(`${e ? "events" : "communities"}/${i.id}`, e ? "events" : "communities", i.name, n.id, i.id);
		} else l(n) && r && (m.get(r)?.length ?? 0) >= C ? a(`events/~${r}`, "events", k(r), n.id) : r && (m.get(r)?.length ?? 0) >= C ? a(`unsorted/~${r}`, "unsorted", k(r), n.id) : o && o !== v && (h.get(o)?.length ?? 0) >= C ? a(`unsorted/@${o}`, "unsorted", o, n.id) : n.members <= S && !n.aliases.length ? a("people/groups", "people", t.smallGroups, n.id) : a("unsorted/loose", "unsorted", t.loose, n.id);
	}
	let w = new Set([...r.values()].map((e) => e.spaceId));
	for (let n of e.topSpaces) w.has(n) || a("unsorted/spaces", "unsorted", t.otherSpaces, n);
	let E = (e) => g.indexOf(e.district);
	return {
		groups: [...r.values()].sort((e, t) => E(e) - E(t) || t.rooms.length - e.rooms.length || e.label.localeCompare(t.label)),
		home: i
	};
}
function D(e) {
	let t = /^[\s[(#]*([\p{L}\p{N}][\p{L}\p{N}.+'-]*)/u.exec(e)?.[1]?.toLowerCase().replace(/[.'-]+$/, "");
	return t && t.length >= 2 && !w.has(t) ? t : void 0;
}
function O(e) {
	return (e.aliases[0] ?? e.id).split(":").slice(1).join(":") || void 0;
}
function k(e) {
	return e.charAt(0).toUpperCase() + e.slice(1);
}
function A(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e) {
		let e = t(r);
		e !== void 0 && n.set(e, [...n.get(e) ?? [], r]);
	}
	return n;
}
function j(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) n !== void 0 && t.set(n, (t.get(n) ?? 0) + 1);
	return [...t].sort((e, t) => t[1] - e[1])[0]?.[0];
}
// src/i18n.ts
var M = "datanauten_people_map_", ee = {
	[`${M}title`]: {
		en: "People",
		de: "Personen"
	},
	[`${M}canvas_label`]: {
		en: "Map of the people you share rooms with",
		de: "Karte der Personen, mit denen du Räume teilst"
	},
	[`${M}search`]: {
		en: "Search people",
		de: "Personen suchen"
	},
	[`${M}close`]: {
		en: "Close",
		de: "Schließen"
	},
	[`${M}back`]: {
		en: "All people",
		de: "Alle Personen"
	},
	[`${M}you`]: {
		en: "You",
		de: "Du"
	},
	[`${M}count_one`]: {
		en: "%(count)s person",
		de: "%(count)s Person"
	},
	[`${M}count_other`]: {
		en: "%(count)s people",
		de: "%(count)s Personen"
	},
	[`${M}no_results`]: {
		en: "Nobody matches “%(query)s”.",
		de: "Niemand passt zu „%(query)s“."
	},
	[`${M}empty`]: {
		en: "Nobody here yet: you don't share rooms with anyone.",
		de: "Noch niemand: du teilst mit niemandem Räume."
	},
	[`${M}hint`]: {
		en: "↑↓ choose · Enter details · Esc back or close · scroll to zoom, drag to pan",
		de: "↑↓ wählen · Enter Details · Esc zurück oder schließen · Scrollen zoomt, Ziehen verschiebt"
	},
	[`${M}sort`]: {
		en: "Sort",
		de: "Sortieren"
	},
	[`${M}sort_closeness`]: {
		en: "Closest",
		de: "Am nächsten"
	},
	[`${M}sort_recent`]: {
		en: "Recent contact",
		de: "Letzter Kontakt"
	},
	[`${M}sort_rooms`]: {
		en: "Shared rooms",
		de: "Gemeinsame Räume"
	},
	[`${M}sort_name`]: {
		en: "Name",
		de: "Name"
	},
	[`${M}filter`]: {
		en: "Show",
		de: "Zeigen"
	},
	[`${M}filter_all`]: {
		en: "Everyone",
		de: "Alle"
	},
	[`${M}filter_dm`]: {
		en: "With DM",
		de: "Mit DM"
	},
	[`${M}filter_server`]: {
		en: "My server",
		de: "Mein Server"
	},
	[`${M}filter_bridged`]: {
		en: "Bridged",
		de: "Gebrückt"
	},
	[`${M}rooms_one`]: {
		en: "%(count)s shared room",
		de: "%(count)s gemeinsamer Raum"
	},
	[`${M}rooms_other`]: {
		en: "%(count)s shared rooms",
		de: "%(count)s gemeinsame Räume"
	},
	[`${M}spaces_one`]: {
		en: "%(count)s shared space",
		de: "%(count)s gemeinsamer Space"
	},
	[`${M}spaces_other`]: {
		en: "%(count)s shared spaces",
		de: "%(count)s gemeinsame Spaces"
	},
	[`${M}messages_one`]: {
		en: "%(count)s message seen",
		de: "%(count)s Nachricht gesehen"
	},
	[`${M}messages_other`]: {
		en: "%(count)s messages seen",
		de: "%(count)s Nachrichten gesehen"
	},
	[`${M}interactions_one`]: {
		en: "%(count)s reply or mention between you",
		de: "%(count)s Antwort oder Erwähnung zwischen euch"
	},
	[`${M}interactions_other`]: {
		en: "%(count)s replies and mentions between you",
		de: "%(count)s Antworten und Erwähnungen zwischen euch"
	},
	[`${M}admin_one`]: {
		en: "Admin in %(count)s shared room",
		de: "Admin in %(count)s gemeinsamen Raum"
	},
	[`${M}admin_other`]: {
		en: "Admin in %(count)s shared rooms",
		de: "Admin in %(count)s gemeinsamen Räumen"
	},
	[`${M}moderator_one`]: {
		en: "Moderator in %(count)s shared room",
		de: "Moderator in %(count)s gemeinsamen Raum"
	},
	[`${M}moderator_other`]: {
		en: "Moderator in %(count)s shared rooms",
		de: "Moderator in %(count)s gemeinsamen Räumen"
	},
	[`${M}dm`]: {
		en: "Direct message",
		de: "Direktnachricht"
	},
	[`${M}last_contact`]: {
		en: "Last contact %(when)s",
		de: "Letzter Kontakt %(when)s"
	},
	[`${M}known_from`]: {
		en: "Known from %(place)s",
		de: "Bekannt aus %(place)s"
	},
	[`${M}bridged_from`]: {
		en: "Bridged from %(network)s",
		de: "Gebrückt aus %(network)s"
	},
	[`${M}bot`]: {
		en: "Bot",
		de: "Bot"
	},
	[`${M}presence_online`]: {
		en: "Online",
		de: "Online"
	},
	[`${M}presence_unavailable`]: {
		en: "Away",
		de: "Abwesend"
	},
	[`${M}presence_offline`]: {
		en: "Offline",
		de: "Offline"
	},
	[`${M}closeness`]: {
		en: "Closeness",
		de: "Nähe"
	},
	[`${M}closeness_value`]: {
		en: "Closer than %(percent)s of your people",
		de: "Näher als %(percent)s deiner Personen"
	},
	[`${M}open_dm`]: {
		en: "Message",
		de: "Nachricht"
	},
	[`${M}open_profile`]: {
		en: "Profile",
		de: "Profil"
	},
	[`${M}shared_rooms`]: {
		en: "Rooms you share",
		de: "Räume, die ihr teilt"
	},
	[`${M}tip_action`]: {
		en: "Click for details",
		de: "Klicken für Details"
	},
	[`${M}zoom_person`]: {
		en: "Show %(name)s on the map",
		de: "%(name)s auf der Karte zeigen"
	},
	[`${M}zoom_room`]: {
		en: "Show the people of %(name)s on the map",
		de: "Die Leute aus %(name)s auf der Karte zeigen"
	},
	[`${M}legend`]: {
		en: "Legend",
		de: "Legende"
	},
	[`${M}legend_middle`]: {
		en: "Middle: you. Closer to it: closer to you",
		de: "Mitte: du. Näher dran: näher bei dir"
	},
	[`${M}legend_sector`]: {
		en: "Sector: where you know them from (a space, an event, a network, your DMs)",
		de: "Sektor: woher du sie kennst (ein Space, ein Event, ein Netzwerk, deine DMs)"
	},
	[`${M}legend_size`]: {
		en: "Bigger: more in common",
		de: "Größer: mehr gemeinsam"
	},
	[`${M}legend_online`]: {
		en: "Green ring: online now",
		de: "Grüner Ring: gerade online"
	},
	[`${M}legend_dm`]: {
		en: "Dark ring: you have a DM",
		de: "Dunkler Ring: ihr habt eine DM"
	},
	[`${M}district_communities`]: {
		en: "Communities",
		de: "Communities"
	},
	[`${M}district_events`]: {
		en: "Events",
		de: "Events"
	},
	[`${M}district_people`]: {
		en: "Direct messages",
		de: "Direktnachrichten"
	},
	[`${M}district_bridges`]: {
		en: "Bridges",
		de: "Brücken"
	},
	[`${M}district_unsorted`]: {
		en: "Elsewhere",
		de: "Anderswo"
	},
	[`${M}district_archive`]: {
		en: "Archive",
		de: "Archiv"
	},
	[`${M}label_dms`]: {
		en: "Direct messages",
		de: "Direktnachrichten"
	},
	[`${M}label_dms_older`]: {
		en: "Direct messages (older)",
		de: "Direktnachrichten (älter)"
	},
	[`${M}label_other`]: {
		en: "Other places",
		de: "Weitere Orte"
	},
	[`${M}group_older`]: {
		en: "%(network)s (older)",
		de: "%(network)s (älter)"
	},
	[`${M}group_small`]: {
		en: "Small groups",
		de: "Kleine Gruppen"
	},
	[`${M}group_loose`]: {
		en: "Loose rooms",
		de: "Lose Räume"
	},
	[`${M}group_spaces`]: {
		en: "Other spaces",
		de: "Weitere Spaces"
	},
	[`${M}group_junk`]: {
		en: "Deleted & tests",
		de: "Gelöscht & Tests"
	},
	[`${M}group_nameless`]: {
		en: "No name",
		de: "Ohne Namen"
	},
	[`${M}group_solo`]: {
		en: "Only you",
		de: "Nur du"
	},
	[`${M}settings_title`]: {
		en: "People map",
		de: "Personen-Karte"
	},
	[`${M}settings_description`]: {
		en: "The map of the people you share rooms with, which opens with %(key)s. Everything on it is worked out in this browser from what Element has already loaded; nothing is sent anywhere.",
		de: "Die Karte der Personen, mit denen du Räume teilst, die sich mit %(key)s öffnet. Alles darauf wird in diesem Browser aus dem berechnet, was Element schon geladen hat; nichts wird irgendwohin geschickt."
	},
	[`${M}settings_animations`]: {
		en: "Animations",
		de: "Animationen"
	},
	[`${M}settings_animations_help`]: {
		en: "Zoom to a person when you choose them. Always off when your system asks for less motion.",
		de: "Zu einer Person zoomen, wenn du sie wählst. Immer aus, wenn dein System weniger Bewegung wünscht."
	},
	[`${M}settings_largeRooms`]: {
		en: "People from large rooms",
		de: "Personen aus großen Räumen"
	},
	[`${M}settings_largeRooms_help`]: {
		en: "Also show people you only share rooms of more than %(count)s members with and have never talked to.",
		de: "Auch Personen zeigen, mit denen du nur Räume mit mehr als %(count)s Mitgliedern teilst und nie gesprochen hast."
	},
	[`${M}settings_bots`]: {
		en: "Bots",
		de: "Bots"
	},
	[`${M}settings_bots_help`]: {
		en: "Also show bots and integrations.",
		de: "Auch Bots und Integrationen zeigen."
	},
	[`${M}settings_cacheAvatars`]: {
		en: "Keep avatars between sessions",
		de: "Avatare zwischen Sitzungen behalten"
	},
	[`${M}settings_cacheAvatars_help`]: {
		en: "Profile pictures are stored in this browser, so the map doesn't load them again after a reload. Turning this off deletes them.",
		de: "Profilbilder werden in diesem Browser gespeichert, damit die Karte sie nach dem Neuladen nicht wieder lädt. Ausschalten löscht sie."
	},
	[`${M}settings_error`]: {
		en: "Couldn't save the setting. Try again.",
		de: "Die Einstellung konnte nicht gespeichert werden. Versuch es nochmal."
	}
}, te = (/* @__PURE__ */ o(((e, t) => {
	var n = typeof Reflect == "object" ? Reflect : null, r = n && typeof n.apply == "function" ? n.apply : function(e, t, n) {
		return Function.prototype.apply.call(e, t, n);
	}, i = n && typeof n.ownKeys == "function" ? n.ownKeys : Object.getOwnPropertySymbols ? function(e) {
		return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
	} : function(e) {
		return Object.getOwnPropertyNames(e);
	};
	function a(e) {
		console && console.warn && console.warn(e);
	}
	var o = Number.isNaN || function(e) {
		return e !== e;
	};
	function s() {
		s.init.call(this);
	}
	t.exports = s, t.exports.once = y, s.EventEmitter = s, s.prototype._events = void 0, s.prototype._eventsCount = 0, s.prototype._maxListeners = void 0;
	var c = 10;
	function l(e) {
		if (typeof e != "function") throw TypeError("The \"listener\" argument must be of type Function. Received type " + typeof e);
	}
	Object.defineProperty(s, "defaultMaxListeners", {
		enumerable: !0,
		get: function() {
			return c;
		},
		set: function(e) {
			if (typeof e != "number" || e < 0 || o(e)) throw RangeError("The value of \"defaultMaxListeners\" is out of range. It must be a non-negative number. Received " + e + ".");
			c = e;
		}
	}), s.init = function() {
		(this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
	}, s.prototype.setMaxListeners = function(e) {
		if (typeof e != "number" || e < 0 || o(e)) throw RangeError("The value of \"n\" is out of range. It must be a non-negative number. Received " + e + ".");
		return this._maxListeners = e, this;
	};
	function u(e) {
		return e._maxListeners === void 0 ? s.defaultMaxListeners : e._maxListeners;
	}
	s.prototype.getMaxListeners = function() {
		return u(this);
	}, s.prototype.emit = function(e) {
		for (var t = [], n = 1; n < arguments.length; n++) t.push(arguments[n]);
		var i = e === "error", a = this._events;
		if (a !== void 0) i &&= a.error === void 0;
		else if (!i) return !1;
		if (i) {
			var o;
			if (t.length > 0 && (o = t[0]), o instanceof Error) throw o;
			var s = /* @__PURE__ */ Error("Unhandled error." + (o ? " (" + o.message + ")" : ""));
			throw s.context = o, s;
		}
		var c = a[e];
		if (c === void 0) return !1;
		if (typeof c == "function") r(c, this, t);
		else for (var l = c.length, u = g(c, l), n = 0; n < l; ++n) r(u[n], this, t);
		return !0;
	};
	function d(e, t, n, r) {
		var i, o, s;
		if (l(n), o = e._events, o === void 0 ? (o = e._events = Object.create(null), e._eventsCount = 0) : (o.newListener !== void 0 && (e.emit("newListener", t, n.listener ? n.listener : n), o = e._events), s = o[t]), s === void 0) s = o[t] = n, ++e._eventsCount;
		else if (typeof s == "function" ? s = o[t] = r ? [n, s] : [s, n] : r ? s.unshift(n) : s.push(n), i = u(e), i > 0 && s.length > i && !s.warned) {
			s.warned = !0;
			var c = /* @__PURE__ */ Error("Possible EventEmitter memory leak detected. " + s.length + " " + String(t) + " listeners added. Use emitter.setMaxListeners() to increase limit");
			c.name = "MaxListenersExceededWarning", c.emitter = e, c.type = t, c.count = s.length, a(c);
		}
		return e;
	}
	s.prototype.addListener = function(e, t) {
		return d(this, e, t, !1);
	}, s.prototype.on = s.prototype.addListener, s.prototype.prependListener = function(e, t) {
		return d(this, e, t, !0);
	};
	function f() {
		if (!this.fired) return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
	}
	function p(e, t, n) {
		var r = {
			fired: !1,
			wrapFn: void 0,
			target: e,
			type: t,
			listener: n
		}, i = f.bind(r);
		return i.listener = n, r.wrapFn = i, i;
	}
	s.prototype.once = function(e, t) {
		return l(t), this.on(e, p(this, e, t)), this;
	}, s.prototype.prependOnceListener = function(e, t) {
		return l(t), this.prependListener(e, p(this, e, t)), this;
	}, s.prototype.removeListener = function(e, t) {
		var n, r, i, a, o;
		if (l(t), r = this._events, r === void 0 || (n = r[e], n === void 0)) return this;
		if (n === t || n.listener === t) --this._eventsCount === 0 ? this._events = Object.create(null) : (delete r[e], r.removeListener && this.emit("removeListener", e, n.listener || t));
		else if (typeof n != "function") {
			for (i = -1, a = n.length - 1; a >= 0; a--) if (n[a] === t || n[a].listener === t) {
				o = n[a].listener, i = a;
				break;
			}
			if (i < 0) return this;
			i === 0 ? n.shift() : _(n, i), n.length === 1 && (r[e] = n[0]), r.removeListener !== void 0 && this.emit("removeListener", e, o || t);
		}
		return this;
	}, s.prototype.off = s.prototype.removeListener, s.prototype.removeAllListeners = function(e) {
		var t, n = this._events, r;
		if (n === void 0) return this;
		if (n.removeListener === void 0) return arguments.length === 0 ? (this._events = Object.create(null), this._eventsCount = 0) : n[e] !== void 0 && (--this._eventsCount === 0 ? this._events = Object.create(null) : delete n[e]), this;
		if (arguments.length === 0) {
			var i = Object.keys(n), a;
			for (r = 0; r < i.length; ++r) a = i[r], a !== "removeListener" && this.removeAllListeners(a);
			return this.removeAllListeners("removeListener"), this._events = Object.create(null), this._eventsCount = 0, this;
		}
		if (t = n[e], typeof t == "function") this.removeListener(e, t);
		else if (t !== void 0) for (r = t.length - 1; r >= 0; r--) this.removeListener(e, t[r]);
		return this;
	};
	function m(e, t, n) {
		var r = e._events;
		if (r === void 0) return [];
		var i = r[t];
		return i === void 0 ? [] : typeof i == "function" ? n ? [i.listener || i] : [i] : n ? v(i) : g(i, i.length);
	}
	s.prototype.listeners = function(e) {
		return m(this, e, !0);
	}, s.prototype.rawListeners = function(e) {
		return m(this, e, !1);
	}, s.listenerCount = function(e, t) {
		return typeof e.listenerCount == "function" ? e.listenerCount(t) : h.call(e, t);
	}, s.prototype.listenerCount = h;
	function h(e) {
		var t = this._events;
		if (t !== void 0) {
			var n = t[e];
			if (typeof n == "function") return 1;
			if (n !== void 0) return n.length;
		}
		return 0;
	}
	s.prototype.eventNames = function() {
		return this._eventsCount > 0 ? i(this._events) : [];
	};
	function g(e, t) {
		for (var n = Array(t), r = 0; r < t; ++r) n[r] = e[r];
		return n;
	}
	function _(e, t) {
		for (; t + 1 < e.length; t++) e[t] = e[t + 1];
		e.pop();
	}
	function v(e) {
		for (var t = Array(e.length), n = 0; n < t.length; ++n) t[n] = e[n].listener || e[n];
		return t;
	}
	function y(e, t) {
		return new Promise(function(n, r) {
			function i(n) {
				e.removeListener(t, a), r(n);
			}
			function a() {
				typeof e.removeListener == "function" && e.removeListener("error", i), n([].slice.call(arguments));
			}
			x(e, t, a, { once: !0 }), t !== "error" && b(e, i, { once: !0 });
		});
	}
	function b(e, t, n) {
		typeof e.on == "function" && x(e, "error", t, n);
	}
	function x(e, t, n, r) {
		if (typeof e.on == "function") r.once ? e.once(t, n) : e.on(t, n);
		else if (typeof e.addEventListener == "function") e.addEventListener(t, function i(a) {
			r.once && e.removeEventListener(t, i), n(a);
		});
		else throw TypeError("The \"emitter\" argument must be of type EventEmitter. Received type " + typeof e);
	}
})))();
function ne() {
	let e = arguments[0];
	for (let t = 1, n = arguments.length; t < n; t++) if (arguments[t]) for (let n in arguments[t]) e[n] = arguments[t][n];
	return e;
}
var N = ne;
typeof Object.assign == "function" && (N = Object.assign);
function P(e, t, n, r) {
	let i = e._nodes.get(t), a = null;
	return i && (a = r === "mixed" ? i.out && i.out[n] || i.undirected && i.undirected[n] : r === "directed" ? i.out && i.out[n] : i.undirected && i.undirected[n]), a;
}
function F(e) {
	return typeof e == "object" && !!e;
}
function re(e) {
	let t;
	for (t in e) return !1;
	return !0;
}
function I(e, t, n) {
	Object.defineProperty(e, t, {
		enumerable: !1,
		configurable: !1,
		writable: !0,
		value: n
	});
}
function ie(e, t, n) {
	let r = {
		enumerable: !0,
		configurable: !0
	};
	typeof n == "function" ? r.get = n : (r.value = n, r.writable = !1), Object.defineProperty(e, t, r);
}
function ae(e) {
	return !(!F(e) || e.attributes && !Array.isArray(e.attributes));
}
function oe() {
	let e = Math.floor(Math.random() * 256) & 255;
	return () => e++;
}
function se() {
	let e = arguments, t = null, n = -1;
	return {
		[Symbol.iterator]() {
			return this;
		},
		next() {
			let r = null;
			do {
				if (t === null) {
					if (n++, n >= e.length) return { done: !0 };
					t = e[n][Symbol.iterator]();
				}
				if (r = t.next(), r.done) t = null;
				else break;
			} while (1);
			return r;
		}
	};
}
function ce() {
	return {
		[Symbol.iterator]() {
			return this;
		},
		next() {
			return { done: !0 };
		}
	};
}
var le = class extends Error {
	constructor(e) {
		super(), this.name = "GraphError", this.message = e;
	}
}, L = class e extends le {
	constructor(t) {
		super(t), this.name = "InvalidArgumentsGraphError", typeof Error.captureStackTrace == "function" && Error.captureStackTrace(this, e.prototype.constructor);
	}
}, R = class e extends le {
	constructor(t) {
		super(t), this.name = "NotFoundGraphError", typeof Error.captureStackTrace == "function" && Error.captureStackTrace(this, e.prototype.constructor);
	}
}, z = class e extends le {
	constructor(t) {
		super(t), this.name = "UsageGraphError", typeof Error.captureStackTrace == "function" && Error.captureStackTrace(this, e.prototype.constructor);
	}
};
function ue(e, t) {
	this.key = e, this.attributes = t, this.clear();
}
ue.prototype.clear = function() {
	this.inDegree = 0, this.outDegree = 0, this.undirectedDegree = 0, this.undirectedLoops = 0, this.directedLoops = 0, this.in = {}, this.out = {}, this.undirected = {};
};
function de(e, t) {
	this.key = e, this.attributes = t, this.clear();
}
de.prototype.clear = function() {
	this.inDegree = 0, this.outDegree = 0, this.directedLoops = 0, this.in = {}, this.out = {};
};
function fe(e, t) {
	this.key = e, this.attributes = t, this.clear();
}
fe.prototype.clear = function() {
	this.undirectedDegree = 0, this.undirectedLoops = 0, this.undirected = {};
};
function pe(e, t, n, r, i) {
	this.key = t, this.attributes = i, this.undirected = e, this.source = n, this.target = r;
}
pe.prototype.attach = function() {
	let e = "out", t = "in";
	this.undirected && (e = t = "undirected");
	let n = this.source.key, r = this.target.key;
	this.source[e][r] = this, this.undirected && n === r || (this.target[t][n] = this);
}, pe.prototype.attachMulti = function() {
	let e = "out", t = "in", n = this.source.key, r = this.target.key;
	this.undirected && (e = t = "undirected");
	let i = this.source[e], a = i[r];
	a === void 0 ? (i[r] = this, this.undirected && n === r || (this.target[t][n] = this)) : (a.previous = this, this.next = a, i[r] = this, this.target[t][n] = this);
}, pe.prototype.detach = function() {
	let e = this.source.key, t = this.target.key, n = "out", r = "in";
	this.undirected && (n = r = "undirected"), delete this.source[n][t], delete this.target[r][e];
}, pe.prototype.detachMulti = function() {
	let e = this.source.key, t = this.target.key, n = "out", r = "in";
	this.undirected && (n = r = "undirected"), this.previous === void 0 ? this.next === void 0 ? (delete this.source[n][t], delete this.target[r][e]) : (this.next.previous = void 0, this.source[n][t] = this.next, this.target[r][e] = this.next) : (this.previous.next = this.next, this.next !== void 0 && (this.next.previous = this.previous));
};
var me = 0, he = 1, ge = 2, _e = 3;
function ve(e, t, n, r, i, a, o) {
	let s, c, l, u;
	if (r = "" + r, n === me) {
		if (s = e._nodes.get(r), !s) throw new R(`Graph.${t}: could not find the "${r}" node in the graph.`);
		l = i, u = a;
	} else if (n === _e) {
		if (i = "" + i, c = e._edges.get(i), !c) throw new R(`Graph.${t}: could not find the "${i}" edge in the graph.`);
		let n = c.source.key, d = c.target.key;
		if (r === n) s = c.target;
		else if (r === d) s = c.source;
		else throw new R(`Graph.${t}: the "${r}" node is not attached to the "${i}" edge (${n}, ${d}).`);
		l = a, u = o;
	} else {
		if (c = e._edges.get(r), !c) throw new R(`Graph.${t}: could not find the "${r}" edge in the graph.`);
		s = n === he ? c.source : c.target, l = i, u = a;
	}
	return [
		s,
		l,
		u
	];
}
function ye(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let [a, o] = ve(this, t, n, e, r, i);
		return a.attributes[o];
	};
}
function be(e, t, n) {
	e.prototype[t] = function(e, r) {
		let [i] = ve(this, t, n, e, r);
		return i.attributes;
	};
}
function xe(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let [a, o] = ve(this, t, n, e, r, i);
		return a.attributes.hasOwnProperty(o);
	};
}
function Se(e, t, n) {
	e.prototype[t] = function(e, r, i, a) {
		let [o, s, c] = ve(this, t, n, e, r, i, a);
		return o.attributes[s] = c, this.emit("nodeAttributesUpdated", {
			key: o.key,
			type: "set",
			attributes: o.attributes,
			name: s
		}), this;
	};
}
function Ce(e, t, n) {
	e.prototype[t] = function(e, r, i, a) {
		let [o, s, c] = ve(this, t, n, e, r, i, a);
		if (typeof c != "function") throw new L(`Graph.${t}: updater should be a function.`);
		let l = o.attributes;
		return l[s] = c(l[s]), this.emit("nodeAttributesUpdated", {
			key: o.key,
			type: "set",
			attributes: o.attributes,
			name: s
		}), this;
	};
}
function we(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let [a, o] = ve(this, t, n, e, r, i);
		return delete a.attributes[o], this.emit("nodeAttributesUpdated", {
			key: a.key,
			type: "remove",
			attributes: a.attributes,
			name: o
		}), this;
	};
}
function Te(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let [a, o] = ve(this, t, n, e, r, i);
		if (!F(o)) throw new L(`Graph.${t}: provided attributes are not a plain object.`);
		return a.attributes = o, this.emit("nodeAttributesUpdated", {
			key: a.key,
			type: "replace",
			attributes: a.attributes
		}), this;
	};
}
function Ee(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let [a, o] = ve(this, t, n, e, r, i);
		if (!F(o)) throw new L(`Graph.${t}: provided attributes are not a plain object.`);
		return N(a.attributes, o), this.emit("nodeAttributesUpdated", {
			key: a.key,
			type: "merge",
			attributes: a.attributes,
			data: o
		}), this;
	};
}
function De(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let [a, o] = ve(this, t, n, e, r, i);
		if (typeof o != "function") throw new L(`Graph.${t}: provided updater is not a function.`);
		return a.attributes = o(a.attributes), this.emit("nodeAttributesUpdated", {
			key: a.key,
			type: "update",
			attributes: a.attributes
		}), this;
	};
}
var Oe = [
	{
		name: (e) => `get${e}Attribute`,
		attacher: ye
	},
	{
		name: (e) => `get${e}Attributes`,
		attacher: be
	},
	{
		name: (e) => `has${e}Attribute`,
		attacher: xe
	},
	{
		name: (e) => `set${e}Attribute`,
		attacher: Se
	},
	{
		name: (e) => `update${e}Attribute`,
		attacher: Ce
	},
	{
		name: (e) => `remove${e}Attribute`,
		attacher: we
	},
	{
		name: (e) => `replace${e}Attributes`,
		attacher: Te
	},
	{
		name: (e) => `merge${e}Attributes`,
		attacher: Ee
	},
	{
		name: (e) => `update${e}Attributes`,
		attacher: De
	}
];
function ke(e) {
	Oe.forEach(function({ name: t, attacher: n }) {
		n(e, t("Node"), me), n(e, t("Source"), he), n(e, t("Target"), ge), n(e, t("Opposite"), _e);
	});
}
function Ae(e, t, n) {
	e.prototype[t] = function(e, r) {
		let i;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new z(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 2) {
			if (this.multi) throw new z(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let a = "" + e, o = "" + r;
			if (r = arguments[2], i = P(this, a, o, n), !i) throw new R(`Graph.${t}: could not find an edge for the given path ("${a}" - "${o}").`);
		} else {
			if (n !== "mixed") throw new z(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, i = this._edges.get(e), !i) throw new R(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		return i.attributes[r];
	};
}
function je(e, t, n) {
	e.prototype[t] = function(e) {
		let r;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new z(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 1) {
			if (this.multi) throw new z(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let i = "" + e, a = "" + arguments[1];
			if (r = P(this, i, a, n), !r) throw new R(`Graph.${t}: could not find an edge for the given path ("${i}" - "${a}").`);
		} else {
			if (n !== "mixed") throw new z(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, r = this._edges.get(e), !r) throw new R(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		return r.attributes;
	};
}
function Me(e, t, n) {
	e.prototype[t] = function(e, r) {
		let i;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new z(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 2) {
			if (this.multi) throw new z(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let a = "" + e, o = "" + r;
			if (r = arguments[2], i = P(this, a, o, n), !i) throw new R(`Graph.${t}: could not find an edge for the given path ("${a}" - "${o}").`);
		} else {
			if (n !== "mixed") throw new z(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, i = this._edges.get(e), !i) throw new R(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		return i.attributes.hasOwnProperty(r);
	};
}
function Ne(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let a;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new z(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 3) {
			if (this.multi) throw new z(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let o = "" + e, s = "" + r;
			if (r = arguments[2], i = arguments[3], a = P(this, o, s, n), !a) throw new R(`Graph.${t}: could not find an edge for the given path ("${o}" - "${s}").`);
		} else {
			if (n !== "mixed") throw new z(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, a = this._edges.get(e), !a) throw new R(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		return a.attributes[r] = i, this.emit("edgeAttributesUpdated", {
			key: a.key,
			type: "set",
			attributes: a.attributes,
			name: r
		}), this;
	};
}
function Pe(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let a;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new z(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 3) {
			if (this.multi) throw new z(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let o = "" + e, s = "" + r;
			if (r = arguments[2], i = arguments[3], a = P(this, o, s, n), !a) throw new R(`Graph.${t}: could not find an edge for the given path ("${o}" - "${s}").`);
		} else {
			if (n !== "mixed") throw new z(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, a = this._edges.get(e), !a) throw new R(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		if (typeof i != "function") throw new L(`Graph.${t}: updater should be a function.`);
		return a.attributes[r] = i(a.attributes[r]), this.emit("edgeAttributesUpdated", {
			key: a.key,
			type: "set",
			attributes: a.attributes,
			name: r
		}), this;
	};
}
function Fe(e, t, n) {
	e.prototype[t] = function(e, r) {
		let i;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new z(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 2) {
			if (this.multi) throw new z(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let a = "" + e, o = "" + r;
			if (r = arguments[2], i = P(this, a, o, n), !i) throw new R(`Graph.${t}: could not find an edge for the given path ("${a}" - "${o}").`);
		} else {
			if (n !== "mixed") throw new z(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, i = this._edges.get(e), !i) throw new R(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		return delete i.attributes[r], this.emit("edgeAttributesUpdated", {
			key: i.key,
			type: "remove",
			attributes: i.attributes,
			name: r
		}), this;
	};
}
function Ie(e, t, n) {
	e.prototype[t] = function(e, r) {
		let i;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new z(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 2) {
			if (this.multi) throw new z(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let a = "" + e, o = "" + r;
			if (r = arguments[2], i = P(this, a, o, n), !i) throw new R(`Graph.${t}: could not find an edge for the given path ("${a}" - "${o}").`);
		} else {
			if (n !== "mixed") throw new z(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, i = this._edges.get(e), !i) throw new R(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		if (!F(r)) throw new L(`Graph.${t}: provided attributes are not a plain object.`);
		return i.attributes = r, this.emit("edgeAttributesUpdated", {
			key: i.key,
			type: "replace",
			attributes: i.attributes
		}), this;
	};
}
function Le(e, t, n) {
	e.prototype[t] = function(e, r) {
		let i;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new z(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 2) {
			if (this.multi) throw new z(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let a = "" + e, o = "" + r;
			if (r = arguments[2], i = P(this, a, o, n), !i) throw new R(`Graph.${t}: could not find an edge for the given path ("${a}" - "${o}").`);
		} else {
			if (n !== "mixed") throw new z(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, i = this._edges.get(e), !i) throw new R(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		if (!F(r)) throw new L(`Graph.${t}: provided attributes are not a plain object.`);
		return N(i.attributes, r), this.emit("edgeAttributesUpdated", {
			key: i.key,
			type: "merge",
			attributes: i.attributes,
			data: r
		}), this;
	};
}
function Re(e, t, n) {
	e.prototype[t] = function(e, r) {
		let i;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new z(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 2) {
			if (this.multi) throw new z(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let a = "" + e, o = "" + r;
			if (r = arguments[2], i = P(this, a, o, n), !i) throw new R(`Graph.${t}: could not find an edge for the given path ("${a}" - "${o}").`);
		} else {
			if (n !== "mixed") throw new z(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, i = this._edges.get(e), !i) throw new R(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		if (typeof r != "function") throw new L(`Graph.${t}: provided updater is not a function.`);
		return i.attributes = r(i.attributes), this.emit("edgeAttributesUpdated", {
			key: i.key,
			type: "update",
			attributes: i.attributes
		}), this;
	};
}
var ze = [
	{
		name: (e) => `get${e}Attribute`,
		attacher: Ae
	},
	{
		name: (e) => `get${e}Attributes`,
		attacher: je
	},
	{
		name: (e) => `has${e}Attribute`,
		attacher: Me
	},
	{
		name: (e) => `set${e}Attribute`,
		attacher: Ne
	},
	{
		name: (e) => `update${e}Attribute`,
		attacher: Pe
	},
	{
		name: (e) => `remove${e}Attribute`,
		attacher: Fe
	},
	{
		name: (e) => `replace${e}Attributes`,
		attacher: Ie
	},
	{
		name: (e) => `merge${e}Attributes`,
		attacher: Le
	},
	{
		name: (e) => `update${e}Attributes`,
		attacher: Re
	}
];
function Be(e) {
	ze.forEach(function({ name: t, attacher: n }) {
		n(e, t("Edge"), "mixed"), n(e, t("DirectedEdge"), "directed"), n(e, t("UndirectedEdge"), "undirected");
	});
}
var Ve = [
	{
		name: "edges",
		type: "mixed"
	},
	{
		name: "inEdges",
		type: "directed",
		direction: "in"
	},
	{
		name: "outEdges",
		type: "directed",
		direction: "out"
	},
	{
		name: "inboundEdges",
		type: "mixed",
		direction: "in"
	},
	{
		name: "outboundEdges",
		type: "mixed",
		direction: "out"
	},
	{
		name: "directedEdges",
		type: "directed"
	},
	{
		name: "undirectedEdges",
		type: "undirected"
	}
];
function He(e, t, n, r) {
	let i = !1;
	for (let a in t) {
		if (a === r) continue;
		let o = t[a];
		if (i = n(o.key, o.attributes, o.source.key, o.target.key, o.source.attributes, o.target.attributes, o.undirected), e && i) return o.key;
	}
}
function Ue(e, t, n, r) {
	let i, a, o, s = !1;
	for (let c in t) if (c !== r) {
		i = t[c];
		do {
			if (a = i.source, o = i.target, s = n(i.key, i.attributes, a.key, o.key, a.attributes, o.attributes, i.undirected), e && s) return i.key;
			i = i.next;
		} while (i !== void 0);
	}
}
function We(e, t) {
	let n = Object.keys(e), r = n.length, i, a = 0;
	return {
		[Symbol.iterator]() {
			return this;
		},
		next() {
			do
				if (i) i = i.next;
				else {
					if (a >= r) return { done: !0 };
					let o = n[a++];
					if (o === t) {
						i = void 0;
						continue;
					}
					i = e[o];
				}
			while (!i);
			return {
				done: !1,
				value: {
					edge: i.key,
					attributes: i.attributes,
					source: i.source.key,
					target: i.target.key,
					sourceAttributes: i.source.attributes,
					targetAttributes: i.target.attributes,
					undirected: i.undirected
				}
			};
		}
	};
}
function Ge(e, t, n, r) {
	let i = t[n];
	if (!i) return;
	let a = i.source, o = i.target;
	if (r(i.key, i.attributes, a.key, o.key, a.attributes, o.attributes, i.undirected) && e) return i.key;
}
function Ke(e, t, n, r) {
	let i = t[n];
	if (!i) return;
	let a = !1;
	do {
		if (a = r(i.key, i.attributes, i.source.key, i.target.key, i.source.attributes, i.target.attributes, i.undirected), e && a) return i.key;
		i = i.next;
	} while (i !== void 0);
}
function qe(e, t) {
	let n = e[t];
	if (n.next !== void 0) return {
		[Symbol.iterator]() {
			return this;
		},
		next() {
			if (!n) return { done: !0 };
			let e = {
				edge: n.key,
				attributes: n.attributes,
				source: n.source.key,
				target: n.target.key,
				sourceAttributes: n.source.attributes,
				targetAttributes: n.target.attributes,
				undirected: n.undirected
			};
			return n = n.next, {
				done: !1,
				value: e
			};
		}
	};
	let r = !1;
	return {
		[Symbol.iterator]() {
			return this;
		},
		next() {
			return r === !0 ? { done: !0 } : (r = !0, {
				done: !1,
				value: {
					edge: n.key,
					attributes: n.attributes,
					source: n.source.key,
					target: n.target.key,
					sourceAttributes: n.source.attributes,
					targetAttributes: n.target.attributes,
					undirected: n.undirected
				}
			});
		}
	};
}
function Je(e, t) {
	if (e.size === 0) return [];
	if (t === "mixed" || t === e.type) return Array.from(e._edges.keys());
	let n = t === "undirected" ? e.undirectedSize : e.directedSize, r = Array(n), i = t === "undirected", a = e._edges.values(), o = 0, s, c;
	for (; s = a.next(), s.done !== !0;) c = s.value, c.undirected === i && (r[o++] = c.key);
	return r;
}
function Ye(e, t, n, r) {
	if (t.size === 0) return;
	let i = n !== "mixed" && n !== t.type, a = n === "undirected", o, s, c = !1, l = t._edges.values();
	for (; o = l.next(), o.done !== !0;) {
		if (s = o.value, i && s.undirected !== a) continue;
		let { key: t, attributes: n, source: l, target: u } = s;
		if (c = r(t, n, l.key, u.key, l.attributes, u.attributes, s.undirected), e && c) return t;
	}
}
function Xe(e, t) {
	if (e.size === 0) return ce();
	let n = t !== "mixed" && t !== e.type, r = t === "undirected", i = e._edges.values();
	return {
		[Symbol.iterator]() {
			return this;
		},
		next() {
			let e, t;
			for (;;) {
				if (e = i.next(), e.done) return e;
				if (t = e.value, !(n && t.undirected !== r)) break;
			}
			return {
				value: {
					edge: t.key,
					attributes: t.attributes,
					source: t.source.key,
					target: t.target.key,
					sourceAttributes: t.source.attributes,
					targetAttributes: t.target.attributes,
					undirected: t.undirected
				},
				done: !1
			};
		}
	};
}
function Ze(e, t, n, r, i, a) {
	let o = t ? Ue : He, s;
	if (n !== "undirected" && (r !== "out" && (s = o(e, i.in, a), e && s) || r !== "in" && (s = o(e, i.out, a, r ? void 0 : i.key), e && s)) || n !== "directed" && (s = o(e, i.undirected, a), e && s)) return s;
}
function Qe(e, t, n, r) {
	let i = [];
	return Ze(!1, e, t, n, r, function(e) {
		i.push(e);
	}), i;
}
function $e(e, t, n) {
	let r = ce();
	return e !== "undirected" && (t !== "out" && n.in !== void 0 && (r = se(r, We(n.in))), t !== "in" && n.out !== void 0 && (r = se(r, We(n.out, t ? void 0 : n.key)))), e !== "directed" && n.undirected !== void 0 && (r = se(r, We(n.undirected))), r;
}
function et(e, t, n, r, i, a, o) {
	let s = n ? Ke : Ge, c;
	if (t !== "undirected" && (i.in !== void 0 && r !== "out" && (c = s(e, i.in, a, o), e && c) || i.out !== void 0 && r !== "in" && (r || i.key !== a) && (c = s(e, i.out, a, o), e && c)) || t !== "directed" && i.undirected !== void 0 && (c = s(e, i.undirected, a, o), e && c)) return c;
}
function tt(e, t, n, r, i) {
	let a = [];
	return et(!1, e, t, n, r, i, function(e) {
		a.push(e);
	}), a;
}
function nt(e, t, n, r) {
	let i = ce();
	return e !== "undirected" && (n.in !== void 0 && t !== "out" && r in n.in && (i = se(i, qe(n.in, r))), n.out !== void 0 && t !== "in" && r in n.out && (t || n.key !== r) && (i = se(i, qe(n.out, r)))), e !== "directed" && n.undirected !== void 0 && r in n.undirected && (i = se(i, qe(n.undirected, r))), i;
}
function rt(e, t) {
	let { name: n, type: r, direction: i } = t;
	e.prototype[n] = function(e, t) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return [];
		if (!arguments.length) return Je(this, r);
		if (arguments.length === 1) {
			e = "" + e;
			let t = this._nodes.get(e);
			if (t === void 0) throw new R(`Graph.${n}: could not find the "${e}" node in the graph.`);
			return Qe(this.multi, r === "mixed" ? this.type : r, i, t);
		}
		if (arguments.length === 2) {
			e = "" + e, t = "" + t;
			let a = this._nodes.get(e);
			if (!a) throw new R(`Graph.${n}:  could not find the "${e}" source node in the graph.`);
			if (!this._nodes.has(t)) throw new R(`Graph.${n}:  could not find the "${t}" target node in the graph.`);
			return tt(r, this.multi, i, a, t);
		}
		throw new L(`Graph.${n}: too many arguments (expecting 0, 1 or 2 and got ${arguments.length}).`);
	};
}
function it(e, t) {
	let { name: n, type: r, direction: i } = t, a = "forEach" + n[0].toUpperCase() + n.slice(1, -1);
	e.prototype[a] = function(e, t, n) {
		if (r === "mixed" || this.type === "mixed" || r === this.type) {
			if (arguments.length === 1) return n = e, Ye(!1, this, r, n);
			if (arguments.length === 2) {
				e = "" + e, n = t;
				let o = this._nodes.get(e);
				if (o === void 0) throw new R(`Graph.${a}: could not find the "${e}" node in the graph.`);
				return Ze(!1, this.multi, r === "mixed" ? this.type : r, i, o, n);
			}
			if (arguments.length === 3) {
				e = "" + e, t = "" + t;
				let o = this._nodes.get(e);
				if (!o) throw new R(`Graph.${a}:  could not find the "${e}" source node in the graph.`);
				if (!this._nodes.has(t)) throw new R(`Graph.${a}:  could not find the "${t}" target node in the graph.`);
				return et(!1, r, this.multi, i, o, t, n);
			}
			throw new L(`Graph.${a}: too many arguments (expecting 1, 2 or 3 and got ${arguments.length}).`);
		}
	};
	let o = "map" + n[0].toUpperCase() + n.slice(1);
	e.prototype[o] = function() {
		let e = Array.prototype.slice.call(arguments), t = e.pop(), n;
		if (e.length === 0) {
			let i = 0;
			r !== "directed" && (i += this.undirectedSize), r !== "undirected" && (i += this.directedSize), n = Array(i);
			let a = 0;
			e.push((e, r, i, o, s, c, l) => {
				n[a++] = t(e, r, i, o, s, c, l);
			});
		} else n = [], e.push((e, r, i, a, o, s, c) => {
			n.push(t(e, r, i, a, o, s, c));
		});
		return this[a].apply(this, e), n;
	};
	let s = "filter" + n[0].toUpperCase() + n.slice(1);
	e.prototype[s] = function() {
		let e = Array.prototype.slice.call(arguments), t = e.pop(), n = [];
		return e.push((e, r, i, a, o, s, c) => {
			t(e, r, i, a, o, s, c) && n.push(e);
		}), this[a].apply(this, e), n;
	};
	let c = "reduce" + n[0].toUpperCase() + n.slice(1);
	e.prototype[c] = function() {
		let e = Array.prototype.slice.call(arguments);
		if (e.length < 2 || e.length > 4) throw new L(`Graph.${c}: invalid number of arguments (expecting 2, 3 or 4 and got ${e.length}).`);
		if (typeof e[e.length - 1] == "function" && typeof e[e.length - 2] != "function") throw new L(`Graph.${c}: missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array.`);
		let t, n;
		e.length === 2 ? (t = e[0], n = e[1], e = []) : e.length === 3 ? (t = e[1], n = e[2], e = [e[0]]) : e.length === 4 && (t = e[2], n = e[3], e = [e[0], e[1]]);
		let r = n;
		return e.push((e, n, i, a, o, s, c) => {
			r = t(r, e, n, i, a, o, s, c);
		}), this[a].apply(this, e), r;
	};
}
function at(e, t) {
	let { name: n, type: r, direction: i } = t, a = "find" + n[0].toUpperCase() + n.slice(1, -1);
	e.prototype[a] = function(e, t, n) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return !1;
		if (arguments.length === 1) return n = e, Ye(!0, this, r, n);
		if (arguments.length === 2) {
			e = "" + e, n = t;
			let o = this._nodes.get(e);
			if (o === void 0) throw new R(`Graph.${a}: could not find the "${e}" node in the graph.`);
			return Ze(!0, this.multi, r === "mixed" ? this.type : r, i, o, n);
		}
		if (arguments.length === 3) {
			e = "" + e, t = "" + t;
			let o = this._nodes.get(e);
			if (!o) throw new R(`Graph.${a}:  could not find the "${e}" source node in the graph.`);
			if (!this._nodes.has(t)) throw new R(`Graph.${a}:  could not find the "${t}" target node in the graph.`);
			return et(!0, r, this.multi, i, o, t, n);
		}
		throw new L(`Graph.${a}: too many arguments (expecting 1, 2 or 3 and got ${arguments.length}).`);
	};
	let o = "some" + n[0].toUpperCase() + n.slice(1, -1);
	e.prototype[o] = function() {
		let e = Array.prototype.slice.call(arguments), t = e.pop();
		return e.push((e, n, r, i, a, o, s) => t(e, n, r, i, a, o, s)), !!this[a].apply(this, e);
	};
	let s = "every" + n[0].toUpperCase() + n.slice(1, -1);
	e.prototype[s] = function() {
		let e = Array.prototype.slice.call(arguments), t = e.pop();
		return e.push((e, n, r, i, a, o, s) => !t(e, n, r, i, a, o, s)), !this[a].apply(this, e);
	};
}
function ot(e, t) {
	let { name: n, type: r, direction: i } = t, a = n.slice(0, -1) + "Entries";
	e.prototype[a] = function(e, t) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return ce();
		if (!arguments.length) return Xe(this, r);
		if (arguments.length === 1) {
			e = "" + e;
			let t = this._nodes.get(e);
			if (!t) throw new R(`Graph.${a}: could not find the "${e}" node in the graph.`);
			return $e(r, i, t);
		}
		if (arguments.length === 2) {
			e = "" + e, t = "" + t;
			let n = this._nodes.get(e);
			if (!n) throw new R(`Graph.${a}:  could not find the "${e}" source node in the graph.`);
			if (!this._nodes.has(t)) throw new R(`Graph.${a}:  could not find the "${t}" target node in the graph.`);
			return nt(r, i, n, t);
		}
		throw new L(`Graph.${a}: too many arguments (expecting 0, 1 or 2 and got ${arguments.length}).`);
	};
}
function st(e) {
	Ve.forEach((t) => {
		rt(e, t), it(e, t), at(e, t), ot(e, t);
	});
}
var ct = [
	{
		name: "neighbors",
		type: "mixed"
	},
	{
		name: "inNeighbors",
		type: "directed",
		direction: "in"
	},
	{
		name: "outNeighbors",
		type: "directed",
		direction: "out"
	},
	{
		name: "inboundNeighbors",
		type: "mixed",
		direction: "in"
	},
	{
		name: "outboundNeighbors",
		type: "mixed",
		direction: "out"
	},
	{
		name: "directedNeighbors",
		type: "directed"
	},
	{
		name: "undirectedNeighbors",
		type: "undirected"
	}
];
function lt() {
	this.A = null, this.B = null;
}
lt.prototype.wrap = function(e) {
	this.A === null ? this.A = e : this.B === null && (this.B = e);
}, lt.prototype.has = function(e) {
	return this.A !== null && e in this.A || this.B !== null && e in this.B;
};
function ut(e, t, n, r, i) {
	for (let a in r) {
		let o = r[a], s = o.source, c = o.target, l = s === n ? c : s;
		if (t && t.has(l.key)) continue;
		let u = i(l.key, l.attributes);
		if (e && u) return l.key;
	}
}
function dt(e, t, n, r, i) {
	if (t !== "mixed") {
		if (t === "undirected") return ut(e, null, r, r.undirected, i);
		if (typeof n == "string") return ut(e, null, r, r[n], i);
	}
	let a = new lt(), o;
	if (t !== "undirected") {
		if (n !== "out") {
			if (o = ut(e, null, r, r.in, i), e && o) return o;
			a.wrap(r.in);
		}
		if (n !== "in") {
			if (o = ut(e, a, r, r.out, i), e && o) return o;
			a.wrap(r.out);
		}
	}
	if (t !== "directed" && (o = ut(e, a, r, r.undirected, i), e && o)) return o;
}
function ft(e, t, n) {
	if (e !== "mixed") {
		if (e === "undirected") return Object.keys(n.undirected);
		if (typeof t == "string") return Object.keys(n[t]);
	}
	let r = [];
	return dt(!1, e, t, n, function(e) {
		r.push(e);
	}), r;
}
function pt(e, t, n) {
	let r = Object.keys(n), i = r.length, a = 0;
	return {
		[Symbol.iterator]() {
			return this;
		},
		next() {
			let o = null;
			do {
				if (a >= i) return e && e.wrap(n), { done: !0 };
				let s = n[r[a++]], c = s.source, l = s.target;
				o = c === t ? l : c, e && e.has(o.key) && (o = null);
			} while (o === null);
			return {
				done: !1,
				value: {
					neighbor: o.key,
					attributes: o.attributes
				}
			};
		}
	};
}
function mt(e, t, n) {
	if (e !== "mixed") {
		if (e === "undirected") return pt(null, n, n.undirected);
		if (typeof t == "string") return pt(null, n, n[t]);
	}
	let r = ce(), i = new lt();
	return e !== "undirected" && (t !== "out" && (r = se(r, pt(i, n, n.in))), t !== "in" && (r = se(r, pt(i, n, n.out)))), e !== "directed" && (r = se(r, pt(i, n, n.undirected))), r;
}
function ht(e, t) {
	let { name: n, type: r, direction: i } = t;
	e.prototype[n] = function(e) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return [];
		e = "" + e;
		let t = this._nodes.get(e);
		if (t === void 0) throw new R(`Graph.${n}: could not find the "${e}" node in the graph.`);
		return ft(r === "mixed" ? this.type : r, i, t);
	};
}
function gt(e, t) {
	let { name: n, type: r, direction: i } = t, a = "forEach" + n[0].toUpperCase() + n.slice(1, -1);
	e.prototype[a] = function(e, t) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return;
		e = "" + e;
		let n = this._nodes.get(e);
		if (n === void 0) throw new R(`Graph.${a}: could not find the "${e}" node in the graph.`);
		dt(!1, r === "mixed" ? this.type : r, i, n, t);
	};
	let o = "map" + n[0].toUpperCase() + n.slice(1);
	e.prototype[o] = function(e, t) {
		let n = [];
		return this[a](e, (e, r) => {
			n.push(t(e, r));
		}), n;
	};
	let s = "filter" + n[0].toUpperCase() + n.slice(1);
	e.prototype[s] = function(e, t) {
		let n = [];
		return this[a](e, (e, r) => {
			t(e, r) && n.push(e);
		}), n;
	};
	let c = "reduce" + n[0].toUpperCase() + n.slice(1);
	e.prototype[c] = function(e, t, n) {
		if (arguments.length < 3) throw new L(`Graph.${c}: missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array.`);
		let r = n;
		return this[a](e, (e, n) => {
			r = t(r, e, n);
		}), r;
	};
}
function _t(e, t) {
	let { name: n, type: r, direction: i } = t, a = n[0].toUpperCase() + n.slice(1, -1), o = "find" + a;
	e.prototype[o] = function(e, t) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return;
		e = "" + e;
		let n = this._nodes.get(e);
		if (n === void 0) throw new R(`Graph.${o}: could not find the "${e}" node in the graph.`);
		return dt(!0, r === "mixed" ? this.type : r, i, n, t);
	};
	let s = "some" + a;
	e.prototype[s] = function(e, t) {
		return !!this[o](e, t);
	};
	let c = "every" + a;
	e.prototype[c] = function(e, t) {
		return !this[o](e, (e, n) => !t(e, n));
	};
}
function vt(e, t) {
	let { name: n, type: r, direction: i } = t, a = n.slice(0, -1) + "Entries";
	e.prototype[a] = function(e) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return ce();
		e = "" + e;
		let t = this._nodes.get(e);
		if (t === void 0) throw new R(`Graph.${a}: could not find the "${e}" node in the graph.`);
		return mt(r === "mixed" ? this.type : r, i, t);
	};
}
function yt(e) {
	ct.forEach((t) => {
		ht(e, t), gt(e, t), _t(e, t), vt(e, t);
	});
}
function bt(e, t, n, r, i) {
	let a = r._nodes.values(), o = r.type, s, c, l, u, d, f, p;
	for (; s = a.next(), s.done !== !0;) {
		let r = !1;
		if (c = s.value, o !== "undirected") for (l in u = c.out, u) {
			d = u[l];
			do {
				if (f = d.target, r = !0, p = i(c.key, f.key, c.attributes, f.attributes, d.key, d.attributes, d.undirected), e && p) return d;
				d = d.next;
			} while (d);
		}
		if (o !== "directed") {
			for (l in u = c.undirected, u) if (!(t && c.key > l)) {
				d = u[l];
				do {
					if (f = d.target, f.key !== l && (f = d.source), r = !0, p = i(c.key, f.key, c.attributes, f.attributes, d.key, d.attributes, d.undirected), e && p) return d;
					d = d.next;
				} while (d);
			}
		}
		if (n && !r && (p = i(c.key, null, c.attributes, null, null, null, null), e && p)) return null;
	}
}
function xt(e, t) {
	let n = { key: e };
	return re(t.attributes) || (n.attributes = N({}, t.attributes)), n;
}
function St(e, t, n) {
	let r = {
		key: t,
		source: n.source.key,
		target: n.target.key
	};
	return re(n.attributes) || (r.attributes = N({}, n.attributes)), e === "mixed" && n.undirected && (r.undirected = !0), r;
}
function Ct(e) {
	if (!F(e)) throw new L("Graph.import: invalid serialized node. A serialized node should be a plain object with at least a \"key\" property.");
	if (!("key" in e)) throw new L("Graph.import: serialized node is missing its key.");
	if ("attributes" in e && (!F(e.attributes) || e.attributes === null)) throw new L("Graph.import: invalid attributes. Attributes should be a plain object, null or omitted.");
}
function wt(e) {
	if (!F(e)) throw new L("Graph.import: invalid serialized edge. A serialized edge should be a plain object with at least a \"source\" & \"target\" property.");
	if (!("source" in e)) throw new L("Graph.import: serialized edge is missing its source.");
	if (!("target" in e)) throw new L("Graph.import: serialized edge is missing its target.");
	if ("attributes" in e && (!F(e.attributes) || e.attributes === null)) throw new L("Graph.import: invalid attributes. Attributes should be a plain object, null or omitted.");
	if ("undirected" in e && typeof e.undirected != "boolean") throw new L("Graph.import: invalid undirectedness information. Undirected should be boolean or omitted.");
}
var Tt = oe(), Et = /* @__PURE__ */ new Set([
	"directed",
	"undirected",
	"mixed"
]), Dt = /* @__PURE__ */ new Set([
	"domain",
	"_events",
	"_eventsCount",
	"_maxListeners"
]), Ot = [
	{
		name: (e) => `${e}Edge`,
		generateKey: !0
	},
	{
		name: (e) => `${e}DirectedEdge`,
		generateKey: !0,
		type: "directed"
	},
	{
		name: (e) => `${e}UndirectedEdge`,
		generateKey: !0,
		type: "undirected"
	},
	{ name: (e) => `${e}EdgeWithKey` },
	{
		name: (e) => `${e}DirectedEdgeWithKey`,
		type: "directed"
	},
	{
		name: (e) => `${e}UndirectedEdgeWithKey`,
		type: "undirected"
	}
], kt = {
	allowSelfLoops: !0,
	multi: !1,
	type: "mixed"
};
function At(e, t, n) {
	if (n && !F(n)) throw new L(`Graph.addNode: invalid attributes. Expecting an object but got "${n}"`);
	if (t = "" + t, n ||= {}, e._nodes.has(t)) throw new z(`Graph.addNode: the "${t}" node already exist in the graph.`);
	let r = new e.NodeDataClass(t, n);
	return e._nodes.set(t, r), e.emit("nodeAdded", {
		key: t,
		attributes: n
	}), r;
}
function jt(e, t, n) {
	let r = new e.NodeDataClass(t, n);
	return e._nodes.set(t, r), e.emit("nodeAdded", {
		key: t,
		attributes: n
	}), r;
}
function Mt(e, t, n, r, i, a, o, s) {
	if (!r && e.type === "undirected") throw new z(`Graph.${t}: you cannot add a directed edge to an undirected graph. Use the #.addEdge or #.addUndirectedEdge instead.`);
	if (r && e.type === "directed") throw new z(`Graph.${t}: you cannot add an undirected edge to a directed graph. Use the #.addEdge or #.addDirectedEdge instead.`);
	if (s && !F(s)) throw new L(`Graph.${t}: invalid attributes. Expecting an object but got "${s}"`);
	if (a = "" + a, o = "" + o, s ||= {}, !e.allowSelfLoops && a === o) throw new z(`Graph.${t}: source & target are the same ("${a}"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false.`);
	let c = e._nodes.get(a), l = e._nodes.get(o);
	if (!c) throw new R(`Graph.${t}: source node "${a}" not found.`);
	if (!l) throw new R(`Graph.${t}: target node "${o}" not found.`);
	let u = {
		key: null,
		undirected: r,
		source: a,
		target: o,
		attributes: s
	};
	if (n) i = e._edgeKeyGenerator();
	else if (i = "" + i, e._edges.has(i)) throw new z(`Graph.${t}: the "${i}" edge already exists in the graph.`);
	if (!e.multi && (r ? c.undirected[o] !== void 0 : c.out[o] !== void 0)) throw new z(`Graph.${t}: an edge linking "${a}" to "${o}" already exists. If you really want to add multiple edges linking those nodes, you should create a multi graph by using the 'multi' option.`);
	let d = new pe(r, i, c, l, s);
	e._edges.set(i, d);
	let f = a === o;
	return r ? (c.undirectedDegree++, l.undirectedDegree++, f && (c.undirectedLoops++, e._undirectedSelfLoopCount++)) : (c.outDegree++, l.inDegree++, f && (c.directedLoops++, e._directedSelfLoopCount++)), e.multi ? d.attachMulti() : d.attach(), r ? e._undirectedSize++ : e._directedSize++, u.key = i, e.emit("edgeAdded", u), i;
}
function Nt(e, t, n, r, i, a, o, s, c) {
	if (!r && e.type === "undirected") throw new z(`Graph.${t}: you cannot merge/update a directed edge to an undirected graph. Use the #.mergeEdge/#.updateEdge or #.addUndirectedEdge instead.`);
	if (r && e.type === "directed") throw new z(`Graph.${t}: you cannot merge/update an undirected edge to a directed graph. Use the #.mergeEdge/#.updateEdge or #.addDirectedEdge instead.`);
	if (s) {
		if (c) {
			if (typeof s != "function") throw new L(`Graph.${t}: invalid updater function. Expecting a function but got "${s}"`);
		} else if (!F(s)) throw new L(`Graph.${t}: invalid attributes. Expecting an object but got "${s}"`);
	}
	a = "" + a, o = "" + o;
	let l;
	if (c && (l = s, s = void 0), !e.allowSelfLoops && a === o) throw new z(`Graph.${t}: source & target are the same ("${a}"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false.`);
	let u = e._nodes.get(a), d = e._nodes.get(o), f, p;
	if (!n && (f = e._edges.get(i), f)) {
		if ((f.source.key !== a || f.target.key !== o) && (!r || f.source.key !== o || f.target.key !== a)) throw new z(`Graph.${t}: inconsistency detected when attempting to merge the "${i}" edge with "${a}" source & "${o}" target vs. ("${f.source.key}", "${f.target.key}").`);
		p = f;
	}
	if (!p && !e.multi && u && (p = r ? u.undirected[o] : u.out[o]), p) {
		let t = [
			p.key,
			!1,
			!1,
			!1
		];
		if (c ? !l : !s) return t;
		if (c) {
			let t = p.attributes;
			p.attributes = l(t), e.emit("edgeAttributesUpdated", {
				type: "replace",
				key: p.key,
				attributes: p.attributes
			});
		} else N(p.attributes, s), e.emit("edgeAttributesUpdated", {
			type: "merge",
			key: p.key,
			attributes: p.attributes,
			data: s
		});
		return t;
	}
	s ||= {}, c && l && (s = l(s));
	let m = {
		key: null,
		undirected: r,
		source: a,
		target: o,
		attributes: s
	};
	if (n) i = e._edgeKeyGenerator();
	else if (i = "" + i, e._edges.has(i)) throw new z(`Graph.${t}: the "${i}" edge already exists in the graph.`);
	let h = !1, g = !1;
	u || (u = jt(e, a, {}), h = !0, a === o && (d = u, g = !0)), d || (d = jt(e, o, {}), g = !0), f = new pe(r, i, u, d, s), e._edges.set(i, f);
	let _ = a === o;
	return r ? (u.undirectedDegree++, d.undirectedDegree++, _ && (u.undirectedLoops++, e._undirectedSelfLoopCount++)) : (u.outDegree++, d.inDegree++, _ && (u.directedLoops++, e._directedSelfLoopCount++)), e.multi ? f.attachMulti() : f.attach(), r ? e._undirectedSize++ : e._directedSize++, m.key = i, e.emit("edgeAdded", m), [
		i,
		!0,
		h,
		g
	];
}
function Pt(e, t) {
	e._edges.delete(t.key);
	let { source: n, target: r, attributes: i } = t, a = t.undirected, o = n === r;
	a ? (n.undirectedDegree--, r.undirectedDegree--, o && (n.undirectedLoops--, e._undirectedSelfLoopCount--)) : (n.outDegree--, r.inDegree--, o && (n.directedLoops--, e._directedSelfLoopCount--)), e.multi ? t.detachMulti() : t.detach(), a ? e._undirectedSize-- : e._directedSize--, e.emit("edgeDropped", {
		key: t.key,
		attributes: i,
		source: n.key,
		target: r.key,
		undirected: a
	});
}
var B = class e extends te.EventEmitter {
	constructor(e) {
		if (super(), e = N({}, kt, e), typeof e.multi != "boolean") throw new L(`Graph.constructor: invalid 'multi' option. Expecting a boolean but got "${e.multi}".`);
		if (!Et.has(e.type)) throw new L(`Graph.constructor: invalid 'type' option. Should be one of "mixed", "directed" or "undirected" but got "${e.type}".`);
		if (typeof e.allowSelfLoops != "boolean") throw new L(`Graph.constructor: invalid 'allowSelfLoops' option. Expecting a boolean but got "${e.allowSelfLoops}".`);
		let t = e.type === "mixed" ? ue : e.type === "directed" ? de : fe;
		I(this, "NodeDataClass", t);
		let n = "geid_" + Tt() + "_", r = 0;
		I(this, "_attributes", {}), I(this, "_nodes", /* @__PURE__ */ new Map()), I(this, "_edges", /* @__PURE__ */ new Map()), I(this, "_directedSize", 0), I(this, "_undirectedSize", 0), I(this, "_directedSelfLoopCount", 0), I(this, "_undirectedSelfLoopCount", 0), I(this, "_edgeKeyGenerator", () => {
			let e;
			do
				e = n + r++;
			while (this._edges.has(e));
			return e;
		}), I(this, "_options", e), Dt.forEach((e) => I(this, e, this[e])), ie(this, "order", () => this._nodes.size), ie(this, "size", () => this._edges.size), ie(this, "directedSize", () => this._directedSize), ie(this, "undirectedSize", () => this._undirectedSize), ie(this, "selfLoopCount", () => this._directedSelfLoopCount + this._undirectedSelfLoopCount), ie(this, "directedSelfLoopCount", () => this._directedSelfLoopCount), ie(this, "undirectedSelfLoopCount", () => this._undirectedSelfLoopCount), ie(this, "multi", this._options.multi), ie(this, "type", this._options.type), ie(this, "allowSelfLoops", this._options.allowSelfLoops), ie(this, "implementation", () => "graphology");
	}
	_resetInstanceCounters() {
		this._directedSize = 0, this._undirectedSize = 0, this._directedSelfLoopCount = 0, this._undirectedSelfLoopCount = 0;
	}
	hasNode(e) {
		return this._nodes.has("" + e);
	}
	hasDirectedEdge(e, t) {
		if (this.type === "undirected") return !1;
		if (arguments.length === 1) {
			let t = "" + e, n = this._edges.get(t);
			return !!n && !n.undirected;
		}
		if (arguments.length === 2) {
			e = "" + e, t = "" + t;
			let n = this._nodes.get(e);
			return n ? n.out.hasOwnProperty(t) : !1;
		}
		throw new L(`Graph.hasDirectedEdge: invalid arity (${arguments.length}, instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.`);
	}
	hasUndirectedEdge(e, t) {
		if (this.type === "directed") return !1;
		if (arguments.length === 1) {
			let t = "" + e, n = this._edges.get(t);
			return !!n && n.undirected;
		}
		if (arguments.length === 2) {
			e = "" + e, t = "" + t;
			let n = this._nodes.get(e);
			return n ? n.undirected.hasOwnProperty(t) : !1;
		}
		throw new L(`Graph.hasDirectedEdge: invalid arity (${arguments.length}, instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.`);
	}
	hasEdge(e, t) {
		if (arguments.length === 1) {
			let t = "" + e;
			return this._edges.has(t);
		}
		if (arguments.length === 2) {
			e = "" + e, t = "" + t;
			let n = this._nodes.get(e);
			return n ? n.out !== void 0 && n.out.hasOwnProperty(t) || n.undirected !== void 0 && n.undirected.hasOwnProperty(t) : !1;
		}
		throw new L(`Graph.hasEdge: invalid arity (${arguments.length}, instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.`);
	}
	directedEdge(e, t) {
		if (this.type === "undirected") return;
		if (e = "" + e, t = "" + t, this.multi) throw new z("Graph.directedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.directedEdges instead.");
		let n = this._nodes.get(e);
		if (!n) throw new R(`Graph.directedEdge: could not find the "${e}" source node in the graph.`);
		if (!this._nodes.has(t)) throw new R(`Graph.directedEdge: could not find the "${t}" target node in the graph.`);
		let r = n.out && n.out[t] || void 0;
		if (r) return r.key;
	}
	undirectedEdge(e, t) {
		if (this.type === "directed") return;
		if (e = "" + e, t = "" + t, this.multi) throw new z("Graph.undirectedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.undirectedEdges instead.");
		let n = this._nodes.get(e);
		if (!n) throw new R(`Graph.undirectedEdge: could not find the "${e}" source node in the graph.`);
		if (!this._nodes.has(t)) throw new R(`Graph.undirectedEdge: could not find the "${t}" target node in the graph.`);
		let r = n.undirected && n.undirected[t] || void 0;
		if (r) return r.key;
	}
	edge(e, t) {
		if (this.multi) throw new z("Graph.edge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.edges instead.");
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new R(`Graph.edge: could not find the "${e}" source node in the graph.`);
		if (!this._nodes.has(t)) throw new R(`Graph.edge: could not find the "${t}" target node in the graph.`);
		let r = n.out && n.out[t] || n.undirected && n.undirected[t] || void 0;
		if (r) return r.key;
	}
	areDirectedNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new R(`Graph.areDirectedNeighbors: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? !1 : t in n.in || t in n.out;
	}
	areOutNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new R(`Graph.areOutNeighbors: could not find the "${e}" node in the graph.`);
		return this.type !== "undirected" && t in n.out;
	}
	areInNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new R(`Graph.areInNeighbors: could not find the "${e}" node in the graph.`);
		return this.type !== "undirected" && t in n.in;
	}
	areUndirectedNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new R(`Graph.areUndirectedNeighbors: could not find the "${e}" node in the graph.`);
		return this.type !== "directed" && t in n.undirected;
	}
	areNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new R(`Graph.areNeighbors: could not find the "${e}" node in the graph.`);
		return this.type !== "undirected" && (t in n.in || t in n.out) || this.type !== "directed" && t in n.undirected;
	}
	areInboundNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new R(`Graph.areInboundNeighbors: could not find the "${e}" node in the graph.`);
		return this.type !== "undirected" && t in n.in || this.type !== "directed" && t in n.undirected;
	}
	areOutboundNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new R(`Graph.areOutboundNeighbors: could not find the "${e}" node in the graph.`);
		return this.type !== "undirected" && t in n.out || this.type !== "directed" && t in n.undirected;
	}
	inDegree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.inDegree: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? 0 : t.inDegree;
	}
	outDegree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.outDegree: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? 0 : t.outDegree;
	}
	directedDegree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.directedDegree: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? 0 : t.inDegree + t.outDegree;
	}
	undirectedDegree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.undirectedDegree: could not find the "${e}" node in the graph.`);
		return this.type === "directed" ? 0 : t.undirectedDegree;
	}
	inboundDegree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.inboundDegree: could not find the "${e}" node in the graph.`);
		let n = 0;
		return this.type !== "directed" && (n += t.undirectedDegree), this.type !== "undirected" && (n += t.inDegree), n;
	}
	outboundDegree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.outboundDegree: could not find the "${e}" node in the graph.`);
		let n = 0;
		return this.type !== "directed" && (n += t.undirectedDegree), this.type !== "undirected" && (n += t.outDegree), n;
	}
	degree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.degree: could not find the "${e}" node in the graph.`);
		let n = 0;
		return this.type !== "directed" && (n += t.undirectedDegree), this.type !== "undirected" && (n += t.inDegree + t.outDegree), n;
	}
	inDegreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.inDegreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? 0 : t.inDegree - t.directedLoops;
	}
	outDegreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.outDegreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? 0 : t.outDegree - t.directedLoops;
	}
	directedDegreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.directedDegreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? 0 : t.inDegree + t.outDegree - t.directedLoops * 2;
	}
	undirectedDegreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.undirectedDegreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		return this.type === "directed" ? 0 : t.undirectedDegree - t.undirectedLoops * 2;
	}
	inboundDegreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.inboundDegreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		let n = 0, r = 0;
		return this.type !== "directed" && (n += t.undirectedDegree, r += t.undirectedLoops * 2), this.type !== "undirected" && (n += t.inDegree, r += t.directedLoops), n - r;
	}
	outboundDegreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.outboundDegreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		let n = 0, r = 0;
		return this.type !== "directed" && (n += t.undirectedDegree, r += t.undirectedLoops * 2), this.type !== "undirected" && (n += t.outDegree, r += t.directedLoops), n - r;
	}
	degreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.degreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		let n = 0, r = 0;
		return this.type !== "directed" && (n += t.undirectedDegree, r += t.undirectedLoops * 2), this.type !== "undirected" && (n += t.inDegree + t.outDegree, r += t.directedLoops * 2), n - r;
	}
	source(e) {
		e = "" + e;
		let t = this._edges.get(e);
		if (!t) throw new R(`Graph.source: could not find the "${e}" edge in the graph.`);
		return t.source.key;
	}
	target(e) {
		e = "" + e;
		let t = this._edges.get(e);
		if (!t) throw new R(`Graph.target: could not find the "${e}" edge in the graph.`);
		return t.target.key;
	}
	extremities(e) {
		e = "" + e;
		let t = this._edges.get(e);
		if (!t) throw new R(`Graph.extremities: could not find the "${e}" edge in the graph.`);
		return [t.source.key, t.target.key];
	}
	opposite(e, t) {
		e = "" + e, t = "" + t;
		let n = this._edges.get(t);
		if (!n) throw new R(`Graph.opposite: could not find the "${t}" edge in the graph.`);
		let r = n.source.key, i = n.target.key;
		if (e === r) return i;
		if (e === i) return r;
		throw new R(`Graph.opposite: the "${e}" node is not attached to the "${t}" edge (${r}, ${i}).`);
	}
	hasExtremity(e, t) {
		e = "" + e, t = "" + t;
		let n = this._edges.get(e);
		if (!n) throw new R(`Graph.hasExtremity: could not find the "${e}" edge in the graph.`);
		return n.source.key === t || n.target.key === t;
	}
	isUndirected(e) {
		e = "" + e;
		let t = this._edges.get(e);
		if (!t) throw new R(`Graph.isUndirected: could not find the "${e}" edge in the graph.`);
		return t.undirected;
	}
	isDirected(e) {
		e = "" + e;
		let t = this._edges.get(e);
		if (!t) throw new R(`Graph.isDirected: could not find the "${e}" edge in the graph.`);
		return !t.undirected;
	}
	isSelfLoop(e) {
		e = "" + e;
		let t = this._edges.get(e);
		if (!t) throw new R(`Graph.isSelfLoop: could not find the "${e}" edge in the graph.`);
		return t.source === t.target;
	}
	addNode(e, t) {
		return At(this, e, t).key;
	}
	mergeNode(e, t) {
		if (t && !F(t)) throw new L(`Graph.mergeNode: invalid attributes. Expecting an object but got "${t}"`);
		e = "" + e, t ||= {};
		let n = this._nodes.get(e);
		return n ? (t && (N(n.attributes, t), this.emit("nodeAttributesUpdated", {
			type: "merge",
			key: e,
			attributes: n.attributes,
			data: t
		})), [e, !1]) : (n = new this.NodeDataClass(e, t), this._nodes.set(e, n), this.emit("nodeAdded", {
			key: e,
			attributes: t
		}), [e, !0]);
	}
	updateNode(e, t) {
		if (t && typeof t != "function") throw new L(`Graph.updateNode: invalid updater function. Expecting a function but got "${t}"`);
		e = "" + e;
		let n = this._nodes.get(e);
		if (n) {
			if (t) {
				let r = n.attributes;
				n.attributes = t(r), this.emit("nodeAttributesUpdated", {
					type: "replace",
					key: e,
					attributes: n.attributes
				});
			}
			return [e, !1];
		}
		let r = t ? t({}) : {};
		return n = new this.NodeDataClass(e, r), this._nodes.set(e, n), this.emit("nodeAdded", {
			key: e,
			attributes: r
		}), [e, !0];
	}
	dropNode(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new R(`Graph.dropNode: could not find the "${e}" node in the graph.`);
		let n;
		if (this.type !== "undirected") {
			for (let e in t.out) {
				n = t.out[e];
				do
					Pt(this, n), n = n.next;
				while (n);
			}
			for (let e in t.in) {
				n = t.in[e];
				do
					Pt(this, n), n = n.next;
				while (n);
			}
		}
		if (this.type !== "directed") for (let e in t.undirected) {
			n = t.undirected[e];
			do
				Pt(this, n), n = n.next;
			while (n);
		}
		this._nodes.delete(e), this.emit("nodeDropped", {
			key: e,
			attributes: t.attributes
		});
	}
	dropEdge(e) {
		let t;
		if (arguments.length > 1) {
			let e = "" + arguments[0], n = "" + arguments[1];
			if (t = P(this, e, n, this.type), !t) throw new R(`Graph.dropEdge: could not find the "${e}" -> "${n}" edge in the graph.`);
		} else if (e = "" + e, t = this._edges.get(e), !t) throw new R(`Graph.dropEdge: could not find the "${e}" edge in the graph.`);
		return Pt(this, t), this;
	}
	dropDirectedEdge(e, t) {
		if (arguments.length < 2) throw new z("Graph.dropDirectedEdge: it does not make sense to try and drop a directed edge by key. What if the edge with this key is undirected? Use #.dropEdge for this purpose instead.");
		if (this.multi) throw new z("Graph.dropDirectedEdge: cannot use a {source,target} combo when dropping an edge in a MultiGraph since we cannot infer the one you want to delete as there could be multiple ones.");
		e = "" + e, t = "" + t;
		let n = P(this, e, t, "directed");
		if (!n) throw new R(`Graph.dropDirectedEdge: could not find a "${e}" -> "${t}" edge in the graph.`);
		return Pt(this, n), this;
	}
	dropUndirectedEdge(e, t) {
		if (arguments.length < 2) throw new z("Graph.dropUndirectedEdge: it does not make sense to drop a directed edge by key. What if the edge with this key is undirected? Use #.dropEdge for this purpose instead.");
		if (this.multi) throw new z("Graph.dropUndirectedEdge: cannot use a {source,target} combo when dropping an edge in a MultiGraph since we cannot infer the one you want to delete as there could be multiple ones.");
		let n = P(this, e, t, "undirected");
		if (!n) throw new R(`Graph.dropUndirectedEdge: could not find a "${e}" -> "${t}" edge in the graph.`);
		return Pt(this, n), this;
	}
	clear() {
		this._edges.clear(), this._nodes.clear(), this._resetInstanceCounters(), this.emit("cleared");
	}
	clearEdges() {
		let e = this._nodes.values(), t;
		for (; t = e.next(), t.done !== !0;) t.value.clear();
		this._edges.clear(), this._resetInstanceCounters(), this.emit("edgesCleared");
	}
	getAttribute(e) {
		return this._attributes[e];
	}
	getAttributes() {
		return this._attributes;
	}
	hasAttribute(e) {
		return this._attributes.hasOwnProperty(e);
	}
	setAttribute(e, t) {
		return this._attributes[e] = t, this.emit("attributesUpdated", {
			type: "set",
			attributes: this._attributes,
			name: e
		}), this;
	}
	updateAttribute(e, t) {
		if (typeof t != "function") throw new L("Graph.updateAttribute: updater should be a function.");
		let n = this._attributes[e];
		return this._attributes[e] = t(n), this.emit("attributesUpdated", {
			type: "set",
			attributes: this._attributes,
			name: e
		}), this;
	}
	removeAttribute(e) {
		return delete this._attributes[e], this.emit("attributesUpdated", {
			type: "remove",
			attributes: this._attributes,
			name: e
		}), this;
	}
	replaceAttributes(e) {
		if (!F(e)) throw new L("Graph.replaceAttributes: provided attributes are not a plain object.");
		return this._attributes = e, this.emit("attributesUpdated", {
			type: "replace",
			attributes: this._attributes
		}), this;
	}
	mergeAttributes(e) {
		if (!F(e)) throw new L("Graph.mergeAttributes: provided attributes are not a plain object.");
		return N(this._attributes, e), this.emit("attributesUpdated", {
			type: "merge",
			attributes: this._attributes,
			data: e
		}), this;
	}
	updateAttributes(e) {
		if (typeof e != "function") throw new L("Graph.updateAttributes: provided updater is not a function.");
		return this._attributes = e(this._attributes), this.emit("attributesUpdated", {
			type: "update",
			attributes: this._attributes
		}), this;
	}
	updateEachNodeAttributes(e, t) {
		if (typeof e != "function") throw new L("Graph.updateEachNodeAttributes: expecting an updater function.");
		if (t && !ae(t)) throw new L("Graph.updateEachNodeAttributes: invalid hints. Expecting an object having the following shape: {attributes?: [string]}");
		let n = this._nodes.values(), r, i;
		for (; r = n.next(), r.done !== !0;) i = r.value, i.attributes = e(i.key, i.attributes);
		this.emit("eachNodeAttributesUpdated", { hints: t || null });
	}
	updateEachEdgeAttributes(e, t) {
		if (typeof e != "function") throw new L("Graph.updateEachEdgeAttributes: expecting an updater function.");
		if (t && !ae(t)) throw new L("Graph.updateEachEdgeAttributes: invalid hints. Expecting an object having the following shape: {attributes?: [string]}");
		let n = this._edges.values(), r, i, a, o;
		for (; r = n.next(), r.done !== !0;) i = r.value, a = i.source, o = i.target, i.attributes = e(i.key, i.attributes, a.key, o.key, a.attributes, o.attributes, i.undirected);
		this.emit("eachEdgeAttributesUpdated", { hints: t || null });
	}
	forEachAdjacencyEntry(e) {
		if (typeof e != "function") throw new L("Graph.forEachAdjacencyEntry: expecting a callback.");
		bt(!1, !1, !1, this, e);
	}
	forEachAdjacencyEntryWithOrphans(e) {
		if (typeof e != "function") throw new L("Graph.forEachAdjacencyEntryWithOrphans: expecting a callback.");
		bt(!1, !1, !0, this, e);
	}
	forEachAssymetricAdjacencyEntry(e) {
		if (typeof e != "function") throw new L("Graph.forEachAssymetricAdjacencyEntry: expecting a callback.");
		bt(!1, !0, !1, this, e);
	}
	forEachAssymetricAdjacencyEntryWithOrphans(e) {
		if (typeof e != "function") throw new L("Graph.forEachAssymetricAdjacencyEntryWithOrphans: expecting a callback.");
		bt(!1, !0, !0, this, e);
	}
	nodes() {
		return Array.from(this._nodes.keys());
	}
	forEachNode(e) {
		if (typeof e != "function") throw new L("Graph.forEachNode: expecting a callback.");
		let t = this._nodes.values(), n, r;
		for (; n = t.next(), n.done !== !0;) r = n.value, e(r.key, r.attributes);
	}
	findNode(e) {
		if (typeof e != "function") throw new L("Graph.findNode: expecting a callback.");
		let t = this._nodes.values(), n, r;
		for (; n = t.next(), n.done !== !0;) if (r = n.value, e(r.key, r.attributes)) return r.key;
	}
	mapNodes(e) {
		if (typeof e != "function") throw new L("Graph.mapNode: expecting a callback.");
		let t = this._nodes.values(), n, r, i = Array(this.order), a = 0;
		for (; n = t.next(), n.done !== !0;) r = n.value, i[a++] = e(r.key, r.attributes);
		return i;
	}
	someNode(e) {
		if (typeof e != "function") throw new L("Graph.someNode: expecting a callback.");
		let t = this._nodes.values(), n, r;
		for (; n = t.next(), n.done !== !0;) if (r = n.value, e(r.key, r.attributes)) return !0;
		return !1;
	}
	everyNode(e) {
		if (typeof e != "function") throw new L("Graph.everyNode: expecting a callback.");
		let t = this._nodes.values(), n, r;
		for (; n = t.next(), n.done !== !0;) if (r = n.value, !e(r.key, r.attributes)) return !1;
		return !0;
	}
	filterNodes(e) {
		if (typeof e != "function") throw new L("Graph.filterNodes: expecting a callback.");
		let t = this._nodes.values(), n, r, i = [];
		for (; n = t.next(), n.done !== !0;) r = n.value, e(r.key, r.attributes) && i.push(r.key);
		return i;
	}
	reduceNodes(e, t) {
		if (typeof e != "function") throw new L("Graph.reduceNodes: expecting a callback.");
		if (arguments.length < 2) throw new L("Graph.reduceNodes: missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array.");
		let n = t, r = this._nodes.values(), i, a;
		for (; i = r.next(), i.done !== !0;) a = i.value, n = e(n, a.key, a.attributes);
		return n;
	}
	nodeEntries() {
		let e = this._nodes.values();
		return {
			[Symbol.iterator]() {
				return this;
			},
			next() {
				let t = e.next();
				if (t.done) return t;
				let n = t.value;
				return {
					value: {
						node: n.key,
						attributes: n.attributes
					},
					done: !1
				};
			}
		};
	}
	export() {
		let e = Array(this._nodes.size), t = 0;
		this._nodes.forEach((n, r) => {
			e[t++] = xt(r, n);
		});
		let n = Array(this._edges.size);
		return t = 0, this._edges.forEach((e, r) => {
			n[t++] = St(this.type, r, e);
		}), {
			options: {
				type: this.type,
				multi: this.multi,
				allowSelfLoops: this.allowSelfLoops
			},
			attributes: this.getAttributes(),
			nodes: e,
			edges: n
		};
	}
	import(t, n = !1) {
		if (t instanceof e) return t.forEachNode((e, t) => {
			n ? this.mergeNode(e, t) : this.addNode(e, t);
		}), t.forEachEdge((e, t, r, i, a, o, s) => {
			n ? s ? this.mergeUndirectedEdgeWithKey(e, r, i, t) : this.mergeDirectedEdgeWithKey(e, r, i, t) : s ? this.addUndirectedEdgeWithKey(e, r, i, t) : this.addDirectedEdgeWithKey(e, r, i, t);
		}), this;
		if (!F(t)) throw new L("Graph.import: invalid argument. Expecting a serialized graph or, alternatively, a Graph instance.");
		if (t.attributes) {
			if (!F(t.attributes)) throw new L("Graph.import: invalid attributes. Expecting a plain object.");
			n ? this.mergeAttributes(t.attributes) : this.replaceAttributes(t.attributes);
		}
		let r, i, a, o, s;
		if (t.nodes) {
			if (a = t.nodes, !Array.isArray(a)) throw new L("Graph.import: invalid nodes. Expecting an array.");
			for (r = 0, i = a.length; r < i; r++) {
				o = a[r], Ct(o);
				let { key: e, attributes: t } = o;
				n ? this.mergeNode(e, t) : this.addNode(e, t);
			}
		}
		if (t.edges) {
			let e = !1;
			if (this.type === "undirected" && (e = !0), a = t.edges, !Array.isArray(a)) throw new L("Graph.import: invalid edges. Expecting an array.");
			for (r = 0, i = a.length; r < i; r++) {
				s = a[r], wt(s);
				let { source: t, target: i, attributes: o, undirected: c = e } = s, l;
				"key" in s ? (l = n ? c ? this.mergeUndirectedEdgeWithKey : this.mergeDirectedEdgeWithKey : c ? this.addUndirectedEdgeWithKey : this.addDirectedEdgeWithKey, l.call(this, s.key, t, i, o)) : (l = n ? c ? this.mergeUndirectedEdge : this.mergeDirectedEdge : c ? this.addUndirectedEdge : this.addDirectedEdge, l.call(this, t, i, o));
			}
		}
		return this;
	}
	nullCopy(t) {
		let n = new e(N({}, this._options, t));
		return n.replaceAttributes(N({}, this.getAttributes())), n;
	}
	emptyCopy(e) {
		let t = this.nullCopy(e);
		return this._nodes.forEach((e, n) => {
			let r = N({}, e.attributes);
			e = new t.NodeDataClass(n, r), t._nodes.set(n, e);
		}), t;
	}
	copy(e) {
		if (e ||= {}, typeof e.type == "string" && e.type !== this.type && e.type !== "mixed") throw new z(`Graph.copy: cannot create an incompatible copy from "${this.type}" type to "${e.type}" because this would mean losing information about the current graph.`);
		if (typeof e.multi == "boolean" && e.multi !== this.multi && e.multi !== !0) throw new z("Graph.copy: cannot create an incompatible copy by downgrading a multi graph to a simple one because this would mean losing information about the current graph.");
		if (typeof e.allowSelfLoops == "boolean" && e.allowSelfLoops !== this.allowSelfLoops && e.allowSelfLoops !== !0) throw new z("Graph.copy: cannot create an incompatible copy from a graph allowing self loops to one that does not because this would mean losing information about the current graph.");
		let t = this.emptyCopy(e), n = this._edges.values(), r, i;
		for (; r = n.next(), r.done !== !0;) i = r.value, Mt(t, "copy", !1, i.undirected, i.key, i.source.key, i.target.key, N({}, i.attributes));
		return t;
	}
	toJSON() {
		return this.export();
	}
	toString() {
		return "[object Graph]";
	}
	inspect() {
		let e = {};
		this._nodes.forEach((t, n) => {
			e[n] = t.attributes;
		});
		let t = {}, n = {};
		this._edges.forEach((e, r) => {
			let i = e.undirected ? "--" : "->", a = "", o = e.source.key, s = e.target.key, c;
			e.undirected && o > s && (c = o, o = s, s = c);
			let l = `(${o})${i}(${s})`;
			r.startsWith("geid_") ? this.multi && (n[l] === void 0 ? n[l] = 0 : n[l]++, a += `${n[l]}. `) : a += `[${r}]: `, a += l, t[a] = e.attributes;
		});
		let r = {};
		for (let e in this) this.hasOwnProperty(e) && !Dt.has(e) && typeof this[e] != "function" && typeof e != "symbol" && (r[e] = this[e]);
		return r.attributes = this._attributes, r.nodes = e, r.edges = t, I(r, "constructor", this.constructor), r;
	}
};
typeof Symbol < "u" && (B.prototype[Symbol.for("nodejs.util.inspect.custom")] = B.prototype.inspect), Ot.forEach((e) => {
	[
		"add",
		"merge",
		"update"
	].forEach((t) => {
		let n = e.name(t), r = t === "add" ? Mt : Nt;
		e.generateKey ? B.prototype[n] = function(i, a, o) {
			return r(this, n, !0, (e.type || this.type) === "undirected", null, i, a, o, t === "update");
		} : B.prototype[n] = function(i, a, o, s) {
			return r(this, n, !1, (e.type || this.type) === "undirected", i, a, o, s, t === "update");
		};
	});
}), ke(B), Be(B), st(B), yt(B);
var Ft = class extends B {
	constructor(e) {
		let t = N({ type: "directed" }, e);
		if ("multi" in t && t.multi !== !1) throw new L("DirectedGraph.from: inconsistent indication that the graph should be multi in given options!");
		if (t.type !== "directed") throw new L("DirectedGraph.from: inconsistent \"" + t.type + "\" type in given options!");
		super(t);
	}
}, It = class extends B {
	constructor(e) {
		let t = N({ type: "undirected" }, e);
		if ("multi" in t && t.multi !== !1) throw new L("UndirectedGraph.from: inconsistent indication that the graph should be multi in given options!");
		if (t.type !== "undirected") throw new L("UndirectedGraph.from: inconsistent \"" + t.type + "\" type in given options!");
		super(t);
	}
}, Lt = class extends B {
	constructor(e) {
		let t = N({ multi: !0 }, e);
		if ("multi" in t && t.multi !== !0) throw new L("MultiGraph.from: inconsistent indication that the graph should be simple in given options!");
		super(t);
	}
}, Rt = class extends B {
	constructor(e) {
		let t = N({
			type: "directed",
			multi: !0
		}, e);
		if ("multi" in t && t.multi !== !0) throw new L("MultiDirectedGraph.from: inconsistent indication that the graph should be simple in given options!");
		if (t.type !== "directed") throw new L("MultiDirectedGraph.from: inconsistent \"" + t.type + "\" type in given options!");
		super(t);
	}
}, zt = class extends B {
	constructor(e) {
		let t = N({
			type: "undirected",
			multi: !0
		}, e);
		if ("multi" in t && t.multi !== !0) throw new L("MultiUndirectedGraph.from: inconsistent indication that the graph should be simple in given options!");
		if (t.type !== "undirected") throw new L("MultiUndirectedGraph.from: inconsistent \"" + t.type + "\" type in given options!");
		super(t);
	}
};
function Bt(e) {
	e.from = function(t, n) {
		let r = new e(N({}, t.options, n));
		return r.import(t), r;
	};
}
Bt(B), Bt(Ft), Bt(It), Bt(Lt), Bt(Rt), Bt(zt), B.Graph = B, B.DirectedGraph = Ft, B.UndirectedGraph = It, B.MultiGraph = Lt, B.MultiDirectedGraph = Rt, B.MultiUndirectedGraph = zt, B.InvalidArgumentsGraphError = L, B.NotFoundGraphError = R, B.UsageGraphError = z;
var Vt = 28, Ht = .05, Ut = .22;
function Wt(e) {
	return `p:${e}`;
}
function Gt(e, t, n) {
	let r = new B({ type: "undirected" });
	r.addNode("me", {
		x: 0,
		y: 0,
		size: 12,
		label: t,
		me: !0,
		avatar: n,
		district: "people",
		group: "",
		closeness: 1,
		kind: "person",
		hasDm: !1
	});
	let i = e.people.size, a = Math.max(60, Math.sqrt(i * 10 * 10 / Math.PI) * 1.35), o = e.groups.filter((e) => e.people.length), s = Kt(o.map((e) => e.people.length ** .75), Math.PI * 2 - Ht * o.length), c = [], l = Math.PI / 2 + (s[0] ?? 0) / 2, u = Vt;
	return o.forEach((t, n) => {
		let i = l, o = i - s[n];
		l = o - Ht;
		let d = qt(t.people.map((t) => e.people.get(t)), o, i, a), f = Vt;
		for (let { person: e, x: n, y: i } of d) f = Math.max(f, Math.hypot(n, i)), r.addNode(Wt(e.id), {
			x: n,
			y: i,
			size: 2.2 + e.closeness * 2.6,
			label: e.name,
			personId: e.id,
			avatar: e.avatar,
			district: t.district,
			group: t.key,
			closeness: e.closeness,
			kind: e.kind,
			presence: e.presence,
			hasDm: !!e.dm
		});
		u = Math.max(u, f), c.push({
			key: t.key,
			label: t.label,
			district: t.district,
			a0: o,
			a1: i,
			r1: f + 10,
			count: t.people.length
		});
	}), {
		graph: r,
		sectors: c,
		inner: Vt,
		outer: u
	};
}
function Kt(e, t) {
	let n = Math.min(Ut, t / Math.max(1, e.length)), r = /* @__PURE__ */ new Set();
	for (;;) {
		let i = t - r.size * n, a = e.reduce((e, t, n) => r.has(n) ? e : e + t, 0), o = e.map((t, o) => r.has(o) ? n : a > 0 ? t / a * i : i / e.length), s = o.findIndex((e, t) => !r.has(t) && e < n);
		if (s < 0) return o;
		r.add(s);
	}
}
function qt(e, t, n, r) {
	let i = [], a = (e) => {
		for (; i.length <= e;) {
			let e = Vt + i.length * 10, r = Math.max(1, Math.floor((n - t) * e / 10)), a = (t + n) / 2, o = (n - t) / r, s = Array.from({ length: r }, (e, t) => t).sort((e, t) => Math.abs(e - (r - 1) / 2) - Math.abs(t - (r - 1) / 2) || e - t);
			i.push({
				slots: s.map((e) => a - (n - t) / 2 + o * (e + .5)),
				next: 0
			});
		}
		return i[e];
	}, o = [];
	for (let t of e) {
		let e = Math.round((1 - t.closeness) * r / 10);
		for (; a(e).next >= a(e).slots.length;) e++;
		let n = a(e), i = n.slots[n.next++], s = Vt + e * 10;
		o.push({
			person: t,
			x: Math.cos(i) * s,
			y: Math.sin(i) * s
		});
	}
	return o;
}
// src/people.ts
var Jt = {
	dms: "Direct messages",
	dmsOlder: "Direct messages (older)",
	other: "Other places"
}, Yt = 4, Xt = .5, Zt = .02, Qt = 10368e6, $t = "other", en = /(^|[_.-])bot$|^bot[_.-]|^_?[a-z]*bot$|^(hookshot|mjolnir|draupnir|maubot|github|gitlab|jira|rss|feeds|webhook|notifications?|alertmanager|grafana)([_.-]|$)/i, tn = /^_?(whatsapp|telegram|signal|discord|slack|irc|instagram|messenger|facebook|meta|gmessages|imessage|linkedin|twitter|googlechat|gchat|bsky|bluesky)[_=]/i;
function nn(e) {
	return e.slice(1).split(":")[0] ?? e;
}
function rn(e) {
	return e.split(":").slice(1).join(":");
}
function an(e) {
	let t = nn(e), n = tn.exec(t)?.[1];
	return n ? {
		kind: "bridged",
		network: T(n) ?? pn(n)
	} : en.test(t) ? { kind: "bot" } : { kind: "person" };
}
function on(e, t, n) {
	let r = e.getUserId?.() ?? "", i = n.now ?? Date.now(), a = new Set(e.getIgnoredUsers?.() ?? []), o = E(t, n.names, i), s = new Map(o.groups.map((e) => [e.key, e])), c = /* @__PURE__ */ new Map(), l = new Map(e.getVisibleRooms().map((e) => [e.roomId, e])), u = (e) => {
		let t = c.get(e.userId);
		if (!t) {
			let { kind: n, network: r } = an(e.userId);
			t = {
				person: {
					id: e.userId,
					name: e.userId,
					server: rn(e.userId),
					kind: n,
					network: r,
					rooms: [],
					spaces: [],
					messages: 0,
					interactions: 0,
					lastContact: 0,
					admin: 0,
					moderator: 0,
					score: 0,
					closeness: 0,
					group: $t
				},
				names: /* @__PURE__ */ new Map(),
				byGroup: /* @__PURE__ */ new Map(),
				roomWeights: /* @__PURE__ */ new Map(),
				smallRoom: !1
			}, c.set(e.userId, t);
		}
		return t;
	};
	for (let e of t.rooms.values()) {
		if (e.invite) continue;
		let t = l.get(e.id), n = t?.getJoinedMembers?.() ?? [];
		if (!n.length) continue;
		let i = e.members > 150, s = e.kind === "dm" ? Yt : 1 / Math.sqrt(Math.max(1, e.members - 1)), d = o.home.get(e.id);
		for (let t of n) {
			if (t.userId === r || a.has(t.userId)) continue;
			let n = u(t), o = n.person, c = (t.rawDisplayName ?? t.name)?.trim();
			c && c !== t.userId && n.names.set(c, (n.names.get(c) ?? 0) + 1), o.avatar ||= t.getMxcAvatarUrl() || void 0, e.kind === "space" ? o.spaces.push(e.id) : (o.rooms.push(e.id), n.roomWeights.set(e.id, s), e.kind === "dm" && (o.dm ??= e.id, o.lastContact = Math.max(o.lastContact, e.lastActive)), i || (n.smallRoom = !0), e.kind !== "dm" && (t.powerLevel ?? 0) >= 100 ? o.admin++ : e.kind !== "dm" && (t.powerLevel ?? 0) >= 50 && o.moderator++, d && n.byGroup.set(d, (n.byGroup.get(d) ?? 0) + s));
		}
		if (e.kind !== "space" && t) for (let e of t.getLiveTimeline?.().getEvents() ?? []) {
			if (e.getType() !== "m.room.message" && e.getType() !== "m.sticker") continue;
			let n = e.getSender();
			if (!n) continue;
			let i = e.getContent(), a = un(i), o = dn(i), s = o ? t.findEventById?.(o)?.getSender() : void 0;
			if (n === r) {
				for (let t of /* @__PURE__ */ new Set([...a, ...s && s !== r ? [s] : []])) {
					let n = c.get(t);
					n && (n.person.interactions++, n.person.lastContact = Math.max(n.person.lastContact, e.getTs()));
				}
				continue;
			}
			let l = c.get(n);
			l && (l.person.messages++, l.person.lastContact = Math.max(l.person.lastContact, e.getTs()), (a.includes(r) || s === r) && l.person.interactions++);
		}
	}
	let d = /* @__PURE__ */ new Map();
	for (let r of c.values()) {
		let a = r.person;
		if (!a.rooms.length || a.kind === "bot" && !n.bots || !n.largeRooms && !r.smallRoom && !a.dm && !a.interactions) continue;
		a.name = fn(r.names) ?? nn(a.id), a.rooms.sort((e, n) => r.roomWeights.get(n) - r.roomWeights.get(e) || t.rooms.get(n).lastActive - t.rooms.get(e).lastActive);
		let o = [...r.roomWeights.values()].reduce((e, t) => e + t, 0), c = a.lastContact > 0 ? .5 ** (Math.max(0, i - a.lastContact) / Qt) : .3;
		a.score = (o + a.interactions * Xt + Math.min(a.messages, 200) * Zt) * (.4 + .6 * c), a.group = sn(r, s, a);
		let l = e.getUser?.(a.id)?.presence;
		(l === "online" || l === "unavailable" || l === "offline") && (a.presence = l), d.set(a.id, a);
	}
	let f = [...d.values()].sort(ln);
	return f.forEach((e, t) => e.closeness = f.length > 1 ? 1 - t / (f.length - 1) : 1), {
		me: r,
		people: d,
		groups: cn(f, s, n.labels ?? Jt)
	};
}
function sn(e, t, n) {
	if (n.kind === "bridged" && n.network) return `bridges/${n.network}`;
	let r, i = 0, a, o = 0;
	for (let [n, s] of e.byGroup) {
		let e = t.get(n)?.district;
		e === "people" || e === "archive" ? s > o && (a = n, o = s) : s > i && (r = n, i = s);
	}
	return r ?? a ?? "other";
}
function cn(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let i of e) {
		let e = r.get(i.group);
		if (!e) {
			let a = t.get(i.group), o = i.group.startsWith("bridges/") ? i.group.slice(8) : void 0;
			e = {
				key: i.group,
				district: a?.district ?? (o ? "bridges" : "unsorted"),
				label: i.group === "people/Matrix" ? n.dms : i.group === "people/Matrix-older" ? n.dmsOlder : a?.label ?? o ?? n.other,
				people: []
			}, r.set(i.group, e);
		}
		e.people.push(i.id);
	}
	let i = [...r.values()].sort((e, t) => t.people.length - e.people.length || e.label.localeCompare(t.label));
	if (i.length <= 14) return i;
	let a = {
		key: $t,
		district: "unsorted",
		label: n.other,
		people: []
	}, o = i.filter((e, t) => t < 13 && e.key !== "other"), s = new Set(o.map((e) => e.key));
	for (let t of e) s.has(t.group) || (t.group = $t, a.people.push(t.id));
	return [...o, a];
}
function ln(e, t) {
	return t.score - e.score || e.name.localeCompare(t.name);
}
function un(e) {
	let t = e["m.mentions"]?.user_ids;
	return Array.isArray(t) ? t.filter((e) => typeof e == "string") : [];
}
function dn(e) {
	let t = e["m.relates_to"]?.["m.in_reply_to"]?.event_id;
	return typeof t == "string" ? t : void 0;
}
function fn(e) {
	return [...e].sort((e, t) => t[1] - e[1] || e[0].localeCompare(t[0]))[0]?.[0];
}
function pn(e) {
	return e.charAt(0).toUpperCase() + e.slice(1).toLowerCase();
}
// src/rooms.ts
function mn() {
	let e = window.mxMatrixClientPeg;
	try {
		return e?.get?.() ?? void 0;
	} catch {
		return;
	}
}
function hn(e) {
	let t = /* @__PURE__ */ new Set(), n = e.getAccountData("m.direct")?.getContent() ?? {};
	for (let e of Object.values(n)) if (Array.isArray(e)) for (let n of e) t.add(String(n));
	let r = /* @__PURE__ */ new Map(), i = e.getVisibleRooms().filter((e) => ["join", "invite"].includes(e.getMyMembership()));
	for (let e of i) {
		let n = e.isSpaceRoom(), i = n ? "space" : t.has(e.roomId) ? "dm" : "room";
		r.set(e.roomId, {
			id: e.roomId,
			name: e.name || e.getCanonicalAlias() || e.roomId,
			kind: i,
			aliases: [e.getCanonicalAlias(), ...e.getAltAliases?.() ?? []].filter((e) => !!e),
			members: e.getJoinedMemberCount(),
			lastActive: e.getLastActiveTimestamp(),
			unread: n ? 0 : e.getUnreadNotificationCount("total"),
			highlight: n ? 0 : e.getUnreadNotificationCount("highlight"),
			invite: e.getMyMembership() === "invite",
			avatar: e.getMxcAvatarUrl?.() || (i === "dm" ? e.getAvatarFallbackMember?.()?.getMxcAvatarUrl() : void 0) || void 0,
			children: [],
			parents: []
		});
	}
	for (let e of i) {
		let t = r.get(e.roomId);
		if (t?.kind !== "space" || t.invite) continue;
		let n = e.currentState.getStateEvents("m.space.child").filter((e) => Array.isArray(e.getContent().via) && e.getContent().via.length > 0).map((e) => ({
			id: e.getStateKey() ?? "",
			order: e.getContent().order
		})).filter((t) => t.id !== e.roomId && r.has(t.id)).sort((e, t) => _n(e.order, t.order) || r.get(e.id).name.localeCompare(r.get(t.id).name));
		for (let e of n) t.children.push(e.id), r.get(e.id).parents.push(t.id);
	}
	let a = (e, t) => r.get(e).name.localeCompare(r.get(t).name), o = [...r.values()], s = o.filter((e) => e.kind === "space" && e.parents.length === 0).map((e) => e.id), c = gn(r, s);
	for (let e of o) e.kind === "space" && !c.has(e.id) && (s.push(e.id), gn(r, [e.id], c));
	return {
		rooms: r,
		topSpaces: s.sort(a),
		orphans: o.filter((e) => e.kind === "room" && e.parents.length === 0).map((e) => e.id).sort(a),
		dms: o.filter((e) => e.kind === "dm" && e.parents.length === 0).map((e) => e.id).sort(a)
	};
}
function gn(e, t, n = /* @__PURE__ */ new Set()) {
	let r = [...t];
	for (; r.length;) {
		let t = r.pop();
		n.has(t) || (n.add(t), r.push(...e.get(t)?.children ?? []));
	}
	return n;
}
function _n(e, t) {
	let n = (e) => typeof e == "string" && e.length <= 50 && /^[\x20-\x7E]*$/.test(e);
	return n(e) && n(t) ? e < t ? -1 : +(e > t) : n(e) ? -1 : +!!n(t);
}
// src/settings.ts
var vn = "de.datanauten.people_map.settings", yn = "de.datanauten.people_map.settings", bn = 1e3, xn = {
	animations: !0,
	largeRooms: !1,
	bots: !1,
	cacheAvatars: !0
};
function Sn(e) {
	let t = e && typeof e == "object" ? e : {}, n = (e) => typeof t[e] == "boolean" ? t[e] : xn[e];
	return {
		animations: n("animations"),
		largeRooms: n("largeRooms"),
		bots: n("bots"),
		cacheAvatars: n("cacheAvatars")
	};
}
var Cn = class {
	api;
	value;
	listeners = /* @__PURE__ */ new Set();
	watchable;
	retryTimer;
	constructor(e) {
		this.api = e, this.value = Sn(wn());
	}
	start() {
		this.tryAttach() || (this.retryTimer = setInterval(() => {
			this.tryAttach() && clearInterval(this.retryTimer);
		}, bn));
	}
	stop() {
		clearInterval(this.retryTimer), this.watchable?.unwatch(this.onChange), this.watchable = void 0;
	}
	get = () => this.value;
	subscribe = (e) => (this.listeners.add(e), () => this.listeners.delete(e));
	async set(e) {
		this.update({
			...this.value,
			...e
		}), this.watchable && await this.api.client.accountData.set(vn, {
			version: 1,
			...this.value
		});
	}
	tryAttach() {
		try {
			this.watchable = this.api.client.accountData.get(vn);
		} catch {
			return !1;
		}
		return this.watchable.watch(this.onChange), this.watchable.value && this.onChange(this.watchable.value), !0;
	}
	onChange = (e) => {
		e && this.update(Sn(e));
	};
	update(e) {
		if (JSON.stringify(e) !== JSON.stringify(this.value)) {
			this.value = e;
			try {
				localStorage.setItem(yn, JSON.stringify(e));
			} catch {}
			for (let e of this.listeners) e();
		}
	}
};
function wn() {
	try {
		return JSON.parse(localStorage.getItem(yn) ?? "null");
	} catch {
		return null;
	}
}
// src/settingsInjector.ts
var Tn = "#mx_tabpanel_USER_PREFERENCES_TAB", En = "pm-settings-container", Dn = class {
	mount;
	spacesHeading;
	observer;
	mounted;
	constructor(e, t) {
		this.mount = e, this.spacesHeading = t;
	}
	start() {
		this.observer = new MutationObserver(() => this.check()), this.observer.observe(document.body, {
			childList: !0,
			subtree: !0
		}), this.check();
	}
	stop() {
		this.observer?.disconnect(), this.mounted?.unmount(), this.mounted?.container.remove(), this.mounted = void 0;
	}
	check() {
		if (this.mounted && !this.mounted.container.isConnected && (this.mounted.unmount(), this.mounted = void 0), this.mounted) return;
		let e = document.querySelector(Tn);
		if (!e || e.querySelector(`.${En}`)) return;
		let t = this.spacesHeading(), n = [...e.querySelectorAll(".mx_SettingsSubsection")].find((e) => e.querySelector(".mx_SettingsSubsectionHeading_heading")?.textContent?.trim() === t), r = e.querySelector(".mx_SettingsSection") ?? e.querySelector(".mx_SettingsTab_sections");
		if (!n && !r) return;
		let i = document.createElement("div");
		i.className = En, n ? n.after(i) : r.appendChild(i), this.mounted = {
			container: i,
			unmount: this.mount(i)
		};
	}
}, On = typeof navigator < "u" && navigator.platform.toUpperCase().includes("MAC");
function kn(e, t = On) {
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
function An(e, t) {
	let n = e.key.length === 1 ? e.key.toLowerCase() : e.key, r = /^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : void 0;
	return (n === t.key || !/^[a-z]$/.test(n) && r === t.key) && e.ctrlKey === t.ctrl && e.metaKey === t.meta && e.altKey === t.alt && e.shiftKey === t.shift;
}
function jn(e, t = On) {
	let n = [
		e.ctrl && (t ? "⌃" : "Ctrl"),
		e.alt && (t ? "⌥" : "Alt"),
		e.shift && (t ? "⇧" : "Shift"),
		e.meta && (t ? "⌘" : "Meta")
	], r = e.key.length === 1 ? e.key.toUpperCase() : e.key;
	return [...n.filter(Boolean), r].join(t ? "" : "+");
}
// src/ui/camera.ts
var Mn = Math.SQRT2, Nn = 250, Pn = 900;
function Fn(e, t, n = In()) {
	let r = e.getState();
	if (n) return e.setState(t), { cancel: () => void 0 };
	let i = Rn([
		r.x,
		r.y,
		r.ratio
	], [
		t.x,
		t.y,
		t.ratio
	]), a = Math.min(Pn, Math.max(Nn, i.duration)), o = performance.now(), s = requestAnimationFrame(function t(n) {
		let r = Math.min(1, (n - o) / a), [c, l, u] = i.at(Ln(r));
		e.setState({
			x: c,
			y: l,
			ratio: u
		}), r < 1 && (s = requestAnimationFrame(t));
	});
	return { cancel: () => cancelAnimationFrame(s) };
}
function In() {
	return typeof matchMedia == "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function Ln(e) {
	return e < .5 ? 4 * e * e * e : 1 - (-2 * e + 2) ** 3 / 2;
}
function Rn([e, t, n], [r, i, a]) {
	let o = r - e, s = i - t, c = o * o + s * s;
	if (c < 1e-12) {
		let r = Math.log(a / n) / Mn;
		return {
			at: (i) => [
				e + i * o,
				t + i * s,
				n * Math.exp(Mn * i * r)
			],
			duration: Math.abs(r) * 1e3 * .8
		};
	}
	let l = Math.sqrt(c), u = (a * a - n * n + Mn ** 4 * c) / (2 * n * Mn ** 2 * l), d = (a * a - n * n - Mn ** 4 * c) / (2 * a * Mn ** 2 * l), f = Math.log(Math.sqrt(u * u + 1) - u), p = (Math.log(Math.sqrt(d * d + 1) - d) - f) / Mn;
	return {
		at: (r) => {
			let i = r * p, a = Math.cosh(f), c = n / (Mn * Mn * l) * (a * Math.tanh(Mn * i + f) - Math.sinh(f));
			return [
				e + c * o,
				t + c * s,
				n * a / Math.cosh(Mn * i + f)
			];
		},
		duration: p * 1e3 * .8
	};
}
// node_modules/.pnpm/match-sorter@8.3.0/node_modules/match-sorter/dist/match-sorter.esm.js
var zn = /* @__PURE__ */ c((/* @__PURE__ */ o(((e, t) => {
	var n = {
		À: "A",
		Á: "A",
		Â: "A",
		Ã: "A",
		Ä: "A",
		Å: "A",
		Ấ: "A",
		Ắ: "A",
		Ẳ: "A",
		Ẵ: "A",
		Ặ: "A",
		Æ: "AE",
		Ầ: "A",
		Ằ: "A",
		Ȃ: "A",
		Ả: "A",
		Ạ: "A",
		Ẩ: "A",
		Ẫ: "A",
		Ậ: "A",
		Ç: "C",
		Ḉ: "C",
		È: "E",
		É: "E",
		Ê: "E",
		Ë: "E",
		Ế: "E",
		Ḗ: "E",
		Ề: "E",
		Ḕ: "E",
		Ḝ: "E",
		Ȇ: "E",
		Ẻ: "E",
		Ẽ: "E",
		Ẹ: "E",
		Ể: "E",
		Ễ: "E",
		Ệ: "E",
		Ì: "I",
		Í: "I",
		Î: "I",
		Ï: "I",
		Ḯ: "I",
		Ȋ: "I",
		Ỉ: "I",
		Ị: "I",
		Ð: "D",
		Ñ: "N",
		Ò: "O",
		Ó: "O",
		Ô: "O",
		Õ: "O",
		Ö: "O",
		Ø: "O",
		Ố: "O",
		Ṍ: "O",
		Ṓ: "O",
		Ȏ: "O",
		Ỏ: "O",
		Ọ: "O",
		Ổ: "O",
		Ỗ: "O",
		Ộ: "O",
		Ờ: "O",
		Ở: "O",
		Ỡ: "O",
		Ớ: "O",
		Ợ: "O",
		Ù: "U",
		Ú: "U",
		Û: "U",
		Ü: "U",
		Ủ: "U",
		Ụ: "U",
		Ử: "U",
		Ữ: "U",
		Ự: "U",
		Ý: "Y",
		à: "a",
		á: "a",
		â: "a",
		ã: "a",
		ä: "a",
		å: "a",
		ấ: "a",
		ắ: "a",
		ẳ: "a",
		ẵ: "a",
		ặ: "a",
		æ: "ae",
		ầ: "a",
		ằ: "a",
		ȃ: "a",
		ả: "a",
		ạ: "a",
		ẩ: "a",
		ẫ: "a",
		ậ: "a",
		ç: "c",
		ḉ: "c",
		è: "e",
		é: "e",
		ê: "e",
		ë: "e",
		ế: "e",
		ḗ: "e",
		ề: "e",
		ḕ: "e",
		ḝ: "e",
		ȇ: "e",
		ẻ: "e",
		ẽ: "e",
		ẹ: "e",
		ể: "e",
		ễ: "e",
		ệ: "e",
		ì: "i",
		í: "i",
		î: "i",
		ï: "i",
		ḯ: "i",
		ȋ: "i",
		ỉ: "i",
		ị: "i",
		ð: "d",
		ñ: "n",
		ò: "o",
		ó: "o",
		ô: "o",
		õ: "o",
		ö: "o",
		ø: "o",
		ố: "o",
		ṍ: "o",
		ṓ: "o",
		ȏ: "o",
		ỏ: "o",
		ọ: "o",
		ổ: "o",
		ỗ: "o",
		ộ: "o",
		ờ: "o",
		ở: "o",
		ỡ: "o",
		ớ: "o",
		ợ: "o",
		ù: "u",
		ú: "u",
		û: "u",
		ü: "u",
		ủ: "u",
		ụ: "u",
		ử: "u",
		ữ: "u",
		ự: "u",
		ý: "y",
		ÿ: "y",
		Ā: "A",
		ā: "a",
		Ă: "A",
		ă: "a",
		Ą: "A",
		ą: "a",
		Ć: "C",
		ć: "c",
		Ĉ: "C",
		ĉ: "c",
		Ċ: "C",
		ċ: "c",
		Č: "C",
		č: "c",
		C̆: "C",
		c̆: "c",
		Ď: "D",
		ď: "d",
		Đ: "D",
		đ: "d",
		Ē: "E",
		ē: "e",
		Ĕ: "E",
		ĕ: "e",
		Ė: "E",
		ė: "e",
		Ę: "E",
		ę: "e",
		Ě: "E",
		ě: "e",
		Ĝ: "G",
		Ǵ: "G",
		ĝ: "g",
		ǵ: "g",
		Ğ: "G",
		ğ: "g",
		Ġ: "G",
		ġ: "g",
		Ģ: "G",
		ģ: "g",
		Ĥ: "H",
		ĥ: "h",
		Ħ: "H",
		ħ: "h",
		Ḫ: "H",
		ḫ: "h",
		Ĩ: "I",
		ĩ: "i",
		Ī: "I",
		ī: "i",
		Ĭ: "I",
		ĭ: "i",
		Į: "I",
		į: "i",
		İ: "I",
		ı: "i",
		Ĳ: "IJ",
		ĳ: "ij",
		Ĵ: "J",
		ĵ: "j",
		Ķ: "K",
		ķ: "k",
		Ḱ: "K",
		ḱ: "k",
		K̆: "K",
		k̆: "k",
		Ĺ: "L",
		ĺ: "l",
		Ļ: "L",
		ļ: "l",
		Ľ: "L",
		ľ: "l",
		Ŀ: "L",
		ŀ: "l",
		Ł: "l",
		ł: "l",
		Ḿ: "M",
		ḿ: "m",
		M̆: "M",
		m̆: "m",
		Ń: "N",
		ń: "n",
		Ņ: "N",
		ņ: "n",
		Ň: "N",
		ň: "n",
		ŉ: "n",
		N̆: "N",
		n̆: "n",
		Ō: "O",
		ō: "o",
		Ŏ: "O",
		ŏ: "o",
		Ő: "O",
		ő: "o",
		Œ: "OE",
		œ: "oe",
		P̆: "P",
		p̆: "p",
		Ŕ: "R",
		ŕ: "r",
		Ŗ: "R",
		ŗ: "r",
		Ř: "R",
		ř: "r",
		R̆: "R",
		r̆: "r",
		Ȓ: "R",
		ȓ: "r",
		Ś: "S",
		ś: "s",
		Ŝ: "S",
		ŝ: "s",
		Ş: "S",
		Ș: "S",
		ș: "s",
		ş: "s",
		Š: "S",
		š: "s",
		Ţ: "T",
		ţ: "t",
		ț: "t",
		Ț: "T",
		Ť: "T",
		ť: "t",
		Ŧ: "T",
		ŧ: "t",
		T̆: "T",
		t̆: "t",
		Ũ: "U",
		ũ: "u",
		Ū: "U",
		ū: "u",
		Ŭ: "U",
		ŭ: "u",
		Ů: "U",
		ů: "u",
		Ű: "U",
		ű: "u",
		Ų: "U",
		ų: "u",
		Ȗ: "U",
		ȗ: "u",
		V̆: "V",
		v̆: "v",
		Ŵ: "W",
		ŵ: "w",
		Ẃ: "W",
		ẃ: "w",
		X̆: "X",
		x̆: "x",
		Ŷ: "Y",
		ŷ: "y",
		Ÿ: "Y",
		Y̆: "Y",
		y̆: "y",
		Ź: "Z",
		ź: "z",
		Ż: "Z",
		ż: "z",
		Ž: "Z",
		ž: "z",
		ſ: "s",
		ƒ: "f",
		Ơ: "O",
		ơ: "o",
		Ư: "U",
		ư: "u",
		Ǎ: "A",
		ǎ: "a",
		Ǐ: "I",
		ǐ: "i",
		Ǒ: "O",
		ǒ: "o",
		Ǔ: "U",
		ǔ: "u",
		Ǖ: "U",
		ǖ: "u",
		Ǘ: "U",
		ǘ: "u",
		Ǚ: "U",
		ǚ: "u",
		Ǜ: "U",
		ǜ: "u",
		Ứ: "U",
		ứ: "u",
		Ṹ: "U",
		ṹ: "u",
		Ǻ: "A",
		ǻ: "a",
		Ǽ: "AE",
		ǽ: "ae",
		Ǿ: "O",
		ǿ: "o",
		Þ: "TH",
		þ: "th",
		Ṕ: "P",
		ṕ: "p",
		Ṥ: "S",
		ṥ: "s",
		X́: "X",
		x́: "x",
		Ѓ: "Г",
		ѓ: "г",
		Ќ: "К",
		ќ: "к",
		A̋: "A",
		a̋: "a",
		E̋: "E",
		e̋: "e",
		I̋: "I",
		i̋: "i",
		Ǹ: "N",
		ǹ: "n",
		Ồ: "O",
		ồ: "o",
		Ṑ: "O",
		ṑ: "o",
		Ừ: "U",
		ừ: "u",
		Ẁ: "W",
		ẁ: "w",
		Ỳ: "Y",
		ỳ: "y",
		Ȁ: "A",
		ȁ: "a",
		Ȅ: "E",
		ȅ: "e",
		Ȉ: "I",
		ȉ: "i",
		Ȍ: "O",
		ȍ: "o",
		Ȑ: "R",
		ȑ: "r",
		Ȕ: "U",
		ȕ: "u",
		B̌: "B",
		b̌: "b",
		Č̣: "C",
		č̣: "c",
		Ê̌: "E",
		ê̌: "e",
		F̌: "F",
		f̌: "f",
		Ǧ: "G",
		ǧ: "g",
		Ȟ: "H",
		ȟ: "h",
		J̌: "J",
		ǰ: "j",
		Ǩ: "K",
		ǩ: "k",
		M̌: "M",
		m̌: "m",
		P̌: "P",
		p̌: "p",
		Q̌: "Q",
		q̌: "q",
		Ř̩: "R",
		ř̩: "r",
		Ṧ: "S",
		ṧ: "s",
		V̌: "V",
		v̌: "v",
		W̌: "W",
		w̌: "w",
		X̌: "X",
		x̌: "x",
		Y̌: "Y",
		y̌: "y",
		A̧: "A",
		a̧: "a",
		B̧: "B",
		b̧: "b",
		Ḑ: "D",
		ḑ: "d",
		Ȩ: "E",
		ȩ: "e",
		Ɛ̧: "E",
		ɛ̧: "e",
		Ḩ: "H",
		ḩ: "h",
		I̧: "I",
		i̧: "i",
		Ɨ̧: "I",
		ɨ̧: "i",
		M̧: "M",
		m̧: "m",
		O̧: "O",
		o̧: "o",
		Q̧: "Q",
		q̧: "q",
		U̧: "U",
		u̧: "u",
		X̧: "X",
		x̧: "x",
		Z̧: "Z",
		z̧: "z",
		й: "и",
		Й: "И",
		ё: "е",
		Ё: "Е"
	}, r = Object.keys(n).join("|"), i = new RegExp(r, "g"), a = new RegExp(r, "");
	function o(e) {
		return n[e];
	}
	var s = function(e) {
		return e.replace(i, o);
	}, c = function(e) {
		return !!e.match(a);
	};
	t.exports = s, t.exports.has = c, t.exports.remove = s;
})))()), V = {
	CASE_SENSITIVE_EQUAL: 7,
	EQUAL: 6,
	STARTS_WITH: 5,
	WORD_STARTS_WITH: 4,
	CONTAINS: 3,
	ACRONYM: 2,
	MATCHES: 1,
	NO_MATCH: 0
}, Bn = (e, t) => String(e.rankedValue).localeCompare(String(t.rankedValue));
function Vn(e, t, n = {}) {
	return Hn(e, t, n).map(({ item: e }) => e);
}
function Hn(e, t, n) {
	let { keys: r, threshold: i = V.MATCHES, baseSort: a = Bn, sorter: o = (e) => e.sort((e, t) => Jn(e, t, a)) } = n;
	return o(e.reduce(s, []));
	function s(e, a, o) {
		let s = Un(a, r, t, n), { rank: c, keyThreshold: l = i } = s;
		return c >= l && e.push({
			...s,
			item: a,
			index: o
		}), e;
	}
}
Vn.rankings = V;
function Un(e, t, n, r) {
	if (!t) {
		let t = e;
		return {
			rankedValue: t,
			rank: Gn(t, n, r),
			keyIndex: -1,
			keyThreshold: r.threshold
		};
	}
	return Qn(e, t).reduce(({ rank: e, rankedValue: t, keyIndex: i, keyThreshold: a }, { itemValue: o, attributes: s }, c) => {
		let l = Gn(o, n, r), u = t, { minRanking: d, maxRanking: f, threshold: p } = s;
		return l < d && l >= V.MATCHES ? l = d : l > f && (l = f), l > e && (e = l, i = c, a = p, u = o), {
			rankedValue: u,
			rank: e,
			keyIndex: i,
			keyThreshold: a
		};
	}, {
		rankedValue: e,
		rank: V.NO_MATCH,
		keyIndex: -1,
		keyThreshold: r.threshold
	});
}
function* Wn(e, t) {
	let n = -1;
	for (; (n = e.indexOf(t, n + 1)) > -1;) yield n;
	return -1;
}
function Gn(e, t, n) {
	if (e = Yn(e, n), t = Yn(t, n), t.length > e.length) return V.NO_MATCH;
	if (e === t) return V.CASE_SENSITIVE_EQUAL;
	e = e.toLowerCase(), t = t.toLowerCase();
	let r = Wn(e, t), i = r.next(), a = i.value;
	if (e.length === t.length && a === 0) return V.EQUAL;
	if (a === 0) return V.STARTS_WITH;
	let o = i;
	for (; !o.done;) {
		if (o.value > 0 && e[o.value - 1] === " ") return V.WORD_STARTS_WITH;
		o = r.next();
	}
	return a > 0 ? V.CONTAINS : t.length === 1 ? V.NO_MATCH : Kn(e).includes(t) ? V.ACRONYM : qn(e, t);
}
function Kn(e) {
	let t = "", n = " ";
	for (let r = 0; r < e.length; r++) {
		let i = e.charAt(r);
		(n === " " || n === "-") && i !== " " && i !== "-" && (t += i), n = i;
	}
	return t;
}
function qn(e, t) {
	let n = 0, r = 0;
	function i(e, t, r) {
		for (let i = r, a = t.length; i < a; i++) if (t[i] === e) return n += 1, i + 1;
		return -1;
	}
	function a(e) {
		let r = 1 / e, i = n / t.length;
		return V.MATCHES + i * r;
	}
	let o = i(t[0], e, 0);
	if (o < 0) return V.NO_MATCH;
	r = o;
	for (let n = 1, a = t.length; n < a; n++) {
		let a = t[n];
		if (r = i(a, e, r), !(r > -1)) return V.NO_MATCH;
	}
	return a(r - o);
}
function Jn(e, t, n) {
	let { rank: r, keyIndex: i } = e, { rank: a, keyIndex: o } = t;
	return r === a ? i === o ? n(e, t) : i < o ? -1 : 1 : r > a ? -1 : 1;
}
function Yn(e, { keepDiacritics: t }) {
	return e = `${e}`, t || (e = (0, zn.default)(e)), e;
}
function Xn(e, t) {
	typeof t == "object" && (t = t.key);
	let n;
	if (typeof t == "function") n = t(e);
	else if (e == null) n = null;
	else if (Object.hasOwnProperty.call(e, t)) n = e[t];
	else if (t.includes(".")) return Zn(t, e);
	else n = null;
	return n == null ? [] : Array.isArray(n) ? n : [String(n)];
}
function Zn(e, t) {
	let n = e.split("."), r = [t];
	for (let e = 0, t = n.length; e < t; e++) {
		let t = n[e], i = [];
		for (let e = 0, n = r.length; e < n; e++) {
			let n = r[e];
			if (n != null) {
				if (Object.hasOwnProperty.call(n, t)) {
					let e = n[t];
					e != null && i.push(e);
				} else t === "*" && (i = i.concat(n));
			}
		}
		r = i;
	}
	return Array.isArray(r[0]) ? [].concat(...r) : r;
}
function Qn(e, t) {
	let n = [];
	for (let r = 0, i = t.length; r < i; r++) {
		let i = t[r], a = er(i), o = Xn(e, i);
		for (let e = 0, t = o.length; e < t; e++) n.push({
			itemValue: o[e],
			attributes: a
		});
	}
	return n;
}
var $n = {
	maxRanking: Infinity,
	minRanking: -Infinity
};
function er(e) {
	return typeof e == "string" ? $n : {
		...$n,
		...e
	};
}
// package.json
var tr = "0.2.0";
// node_modules/.pnpm/sigma@3.0.3_graphology-types@0.24.8/node_modules/sigma/dist/inherits-d1a1e29b.esm.js
function nr(e, t) {
	if (typeof e != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (typeof r != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function rr(e) {
	var t = nr(e, "string");
	return typeof t == "symbol" ? t : t + "";
}
function H(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function ir(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, rr(r.key), r);
	}
}
function U(e, t, n) {
	return t && ir(e.prototype, t), n && ir(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function ar(e) {
	return ar = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
		return e.__proto__ || Object.getPrototypeOf(e);
	}, ar(e);
}
function or() {
	try {
		var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
	} catch {}
	return (or = function() {
		return !!e;
	})();
}
function sr(e) {
	if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
	return e;
}
function cr(e, t) {
	if (t && (typeof t == "object" || typeof t == "function")) return t;
	if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
	return sr(e);
}
function W(e, t, n) {
	return t = ar(t), cr(e, or() ? Reflect.construct(t, n || [], ar(e).constructor) : t.apply(e, n));
}
function lr(e, t) {
	return lr = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
		return e.__proto__ = t, e;
	}, lr(e, t);
}
function G(e, t) {
	if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
	e.prototype = Object.create(t && t.prototype, { constructor: {
		value: e,
		writable: !0,
		configurable: !0
	} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && lr(e, t);
}
// node_modules/.pnpm/sigma@3.0.3_graphology-types@0.24.8/node_modules/sigma/dist/colors-beb06eb2.esm.js
function ur(e) {
	if (Array.isArray(e)) return e;
}
function dr(e, t) {
	var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n != null) {
		var r, i, a, o, s = [], c = !0, l = !1;
		try {
			if (a = (n = n.call(e)).next, t === 0) {
				if (Object(n) !== n) return;
				c = !1;
			} else for (; !(c = (r = a.call(n)).done) && (s.push(r.value), s.length !== t); c = !0);
		} catch (e) {
			l = !0, i = e;
		} finally {
			try {
				if (!c && n.return != null && (o = n.return(), Object(o) !== o)) return;
			} finally {
				if (l) throw i;
			}
		}
		return s;
	}
}
function fr(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function pr(e, t) {
	if (e) {
		if (typeof e == "string") return fr(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? fr(e, t) : void 0;
	}
}
function mr() {
	throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function hr(e, t) {
	return ur(e) || dr(e, t) || pr(e, t) || mr();
}
var gr = {
	black: "#000000",
	silver: "#C0C0C0",
	gray: "#808080",
	grey: "#808080",
	white: "#FFFFFF",
	maroon: "#800000",
	red: "#FF0000",
	purple: "#800080",
	fuchsia: "#FF00FF",
	green: "#008000",
	lime: "#00FF00",
	olive: "#808000",
	yellow: "#FFFF00",
	navy: "#000080",
	blue: "#0000FF",
	teal: "#008080",
	aqua: "#00FFFF",
	darkblue: "#00008B",
	mediumblue: "#0000CD",
	darkgreen: "#006400",
	darkcyan: "#008B8B",
	deepskyblue: "#00BFFF",
	darkturquoise: "#00CED1",
	mediumspringgreen: "#00FA9A",
	springgreen: "#00FF7F",
	cyan: "#00FFFF",
	midnightblue: "#191970",
	dodgerblue: "#1E90FF",
	lightseagreen: "#20B2AA",
	forestgreen: "#228B22",
	seagreen: "#2E8B57",
	darkslategray: "#2F4F4F",
	darkslategrey: "#2F4F4F",
	limegreen: "#32CD32",
	mediumseagreen: "#3CB371",
	turquoise: "#40E0D0",
	royalblue: "#4169E1",
	steelblue: "#4682B4",
	darkslateblue: "#483D8B",
	mediumturquoise: "#48D1CC",
	indigo: "#4B0082",
	darkolivegreen: "#556B2F",
	cadetblue: "#5F9EA0",
	cornflowerblue: "#6495ED",
	rebeccapurple: "#663399",
	mediumaquamarine: "#66CDAA",
	dimgray: "#696969",
	dimgrey: "#696969",
	slateblue: "#6A5ACD",
	olivedrab: "#6B8E23",
	slategray: "#708090",
	slategrey: "#708090",
	lightslategray: "#778899",
	lightslategrey: "#778899",
	mediumslateblue: "#7B68EE",
	lawngreen: "#7CFC00",
	chartreuse: "#7FFF00",
	aquamarine: "#7FFFD4",
	skyblue: "#87CEEB",
	lightskyblue: "#87CEFA",
	blueviolet: "#8A2BE2",
	darkred: "#8B0000",
	darkmagenta: "#8B008B",
	saddlebrown: "#8B4513",
	darkseagreen: "#8FBC8F",
	lightgreen: "#90EE90",
	mediumpurple: "#9370DB",
	darkviolet: "#9400D3",
	palegreen: "#98FB98",
	darkorchid: "#9932CC",
	yellowgreen: "#9ACD32",
	sienna: "#A0522D",
	brown: "#A52A2A",
	darkgray: "#A9A9A9",
	darkgrey: "#A9A9A9",
	lightblue: "#ADD8E6",
	greenyellow: "#ADFF2F",
	paleturquoise: "#AFEEEE",
	lightsteelblue: "#B0C4DE",
	powderblue: "#B0E0E6",
	firebrick: "#B22222",
	darkgoldenrod: "#B8860B",
	mediumorchid: "#BA55D3",
	rosybrown: "#BC8F8F",
	darkkhaki: "#BDB76B",
	mediumvioletred: "#C71585",
	indianred: "#CD5C5C",
	peru: "#CD853F",
	chocolate: "#D2691E",
	tan: "#D2B48C",
	lightgray: "#D3D3D3",
	lightgrey: "#D3D3D3",
	thistle: "#D8BFD8",
	orchid: "#DA70D6",
	goldenrod: "#DAA520",
	palevioletred: "#DB7093",
	crimson: "#DC143C",
	gainsboro: "#DCDCDC",
	plum: "#DDA0DD",
	burlywood: "#DEB887",
	lightcyan: "#E0FFFF",
	lavender: "#E6E6FA",
	darksalmon: "#E9967A",
	violet: "#EE82EE",
	palegoldenrod: "#EEE8AA",
	lightcoral: "#F08080",
	khaki: "#F0E68C",
	aliceblue: "#F0F8FF",
	honeydew: "#F0FFF0",
	azure: "#F0FFFF",
	sandybrown: "#F4A460",
	wheat: "#F5DEB3",
	beige: "#F5F5DC",
	whitesmoke: "#F5F5F5",
	mintcream: "#F5FFFA",
	ghostwhite: "#F8F8FF",
	salmon: "#FA8072",
	antiquewhite: "#FAEBD7",
	linen: "#FAF0E6",
	lightgoldenrodyellow: "#FAFAD2",
	oldlace: "#FDF5E6",
	magenta: "#FF00FF",
	deeppink: "#FF1493",
	orangered: "#FF4500",
	tomato: "#FF6347",
	hotpink: "#FF69B4",
	coral: "#FF7F50",
	darkorange: "#FF8C00",
	lightsalmon: "#FFA07A",
	orange: "#FFA500",
	lightpink: "#FFB6C1",
	pink: "#FFC0CB",
	gold: "#FFD700",
	peachpuff: "#FFDAB9",
	navajowhite: "#FFDEAD",
	moccasin: "#FFE4B5",
	bisque: "#FFE4C4",
	mistyrose: "#FFE4E1",
	blanchedalmond: "#FFEBCD",
	papayawhip: "#FFEFD5",
	lavenderblush: "#FFF0F5",
	seashell: "#FFF5EE",
	cornsilk: "#FFF8DC",
	lemonchiffon: "#FFFACD",
	floralwhite: "#FFFAF0",
	snow: "#FFFAFA",
	lightyellow: "#FFFFE0",
	ivory: "#FFFFF0"
}, _r = /* @__PURE__ */ new Int8Array(4), vr = new Int32Array(_r.buffer, 0, 1), yr = new Float32Array(_r.buffer, 0, 1), br = /^\s*rgba?\s*\(/, xr = /^\s*rgba?\s*\(\s*([0-9]*)\s*,\s*([0-9]*)\s*,\s*([0-9]*)(?:\s*,\s*(.*)?)?\)\s*$/;
function Sr(e) {
	var t = 0, n = 0, r = 0, i = 1;
	if (e[0] === "#") e.length === 4 ? (t = parseInt(e.charAt(1) + e.charAt(1), 16), n = parseInt(e.charAt(2) + e.charAt(2), 16), r = parseInt(e.charAt(3) + e.charAt(3), 16)) : (t = parseInt(e.charAt(1) + e.charAt(2), 16), n = parseInt(e.charAt(3) + e.charAt(4), 16), r = parseInt(e.charAt(5) + e.charAt(6), 16)), e.length === 9 && (i = parseInt(e.charAt(7) + e.charAt(8), 16) / 255);
	else if (br.test(e)) {
		var a = e.match(xr);
		a && (t = +a[1], n = +a[2], r = +a[3], a[4] && (i = +a[4]));
	}
	return {
		r: t,
		g: n,
		b: r,
		a: i
	};
}
var Cr = {};
for (var wr in gr) Cr[wr] = Er(gr[wr]), Cr[gr[wr]] = Cr[wr];
function Tr(e, t, n, r, i) {
	return vr[0] = r << 24 | n << 16 | t << 8 | e, i && (vr[0] &= 4278190079), yr[0];
}
function Er(e) {
	if (e = e.toLowerCase(), Cr[e] !== void 0) return Cr[e];
	var t = Sr(e), n = t.r, r = t.g, i = t.b, a = t.a;
	a = a * 255 | 0;
	var o = Tr(n, r, i, a, !0);
	return Cr[e] = o, o;
}
function Dr(e, t) {
	yr[0] = Er(e);
	var n = vr[0];
	return t && (n |= 16777216), [
		n & 255,
		n >> 8 & 255,
		n >> 16 & 255,
		n >> 24 & 255
	];
}
var Or = {};
function kr(e) {
	if (Or[e] !== void 0) return Or[e];
	var t = Tr((e & 16711680) >>> 16, (e & 65280) >>> 8, e & 255, 255, !0);
	return Or[e] = t, t;
}
function Ar(e, t, n, r) {
	return n + (t << 8) + (e << 16);
}
function jr(e, t, n, r, i, a) {
	var o = Math.floor(n / a * i), s = Math.floor(e.drawingBufferHeight / a - r / a * i), c = /* @__PURE__ */ new Uint8Array(4);
	e.bindFramebuffer(e.FRAMEBUFFER, t), e.readPixels(o, s, 1, 1, e.RGBA, e.UNSIGNED_BYTE, c);
	var l = hr(c, 4);
	return [
		l[0],
		l[1],
		l[2],
		l[3]
	];
}
// node_modules/.pnpm/sigma@3.0.3_graphology-types@0.24.8/node_modules/sigma/dist/index-fad77a13.esm.js
function K(e, t, n) {
	return (t = rr(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function Mr(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function q(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Mr(Object(n), !0).forEach(function(t) {
			K(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Mr(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function Nr(e, t) {
	for (; !{}.hasOwnProperty.call(e, t) && (e = ar(e)) !== null;);
	return e;
}
function Pr() {
	return Pr = typeof Reflect < "u" && Reflect.get ? Reflect.get.bind() : function(e, t, n) {
		var r = Nr(e, t);
		if (r) {
			var i = Object.getOwnPropertyDescriptor(r, t);
			return i.get ? i.get.call(arguments.length < 3 ? e : n) : i.value;
		}
	}, Pr.apply(null, arguments);
}
function Fr(e, t, n, r) {
	var i = Pr(ar(1 & r ? e.prototype : e), t, n);
	return 2 & r && typeof i == "function" ? function(e) {
		return i.apply(n, e);
	} : i;
}
function Ir(e) {
	return e.normalized ? 1 : e.size;
}
function Lr(e) {
	var t = 0;
	return e.forEach(function(e) {
		return t += Ir(e);
	}), t;
}
function Rr(e, t, n) {
	var r = e === "VERTEX" ? t.VERTEX_SHADER : t.FRAGMENT_SHADER, i = t.createShader(r);
	if (i === null) throw Error("loadShader: error while creating the shader");
	if (t.shaderSource(i, n), t.compileShader(i), !t.getShaderParameter(i, t.COMPILE_STATUS)) {
		var a = t.getShaderInfoLog(i);
		throw t.deleteShader(i), Error(`loadShader: error while compiling the shader:
${a}
${n}`);
	}
	return i;
}
function zr(e, t) {
	return Rr("VERTEX", e, t);
}
function Br(e, t) {
	return Rr("FRAGMENT", e, t);
}
function Vr(e, t) {
	var n = e.createProgram();
	if (n === null) throw Error("loadProgram: error while creating the program.");
	for (var r = 0, i = t.length; r < i; r++) e.attachShader(n, t[r]);
	if (e.linkProgram(n), !e.getProgramParameter(n, e.LINK_STATUS)) {
		var a = e.getProgramInfoLog(n);
		throw e.deleteProgram(n), Error(`loadProgram: error while linking the program: ${a}`);
	}
	return n;
}
function Hr(e) {
	var t = e.gl, n = e.buffer, r = e.program, i = e.vertexShader, a = e.fragmentShader;
	t.deleteShader(i), t.deleteShader(a), t.deleteProgram(r), t.deleteBuffer(n);
}
function Ur(e) {
	return e % 1 == 0 ? e.toFixed(1) : e.toString();
}
var Wr = "#define PICKING_MODE\n", Gr = K(K(K(K(K(K(K(K({}, WebGL2RenderingContext.BOOL, 1), WebGL2RenderingContext.BYTE, 1), WebGL2RenderingContext.UNSIGNED_BYTE, 1), WebGL2RenderingContext.SHORT, 2), WebGL2RenderingContext.UNSIGNED_SHORT, 2), WebGL2RenderingContext.INT, 4), WebGL2RenderingContext.UNSIGNED_INT, 4), WebGL2RenderingContext.FLOAT, 4), Kr = /*#__PURE__*/ function() {
	function e(t, n, r) {
		H(this, e), K(this, "array", /* @__PURE__ */ new Float32Array()), K(this, "constantArray", /* @__PURE__ */ new Float32Array()), K(this, "capacity", 0), K(this, "verticesCount", 0);
		var i = this.getDefinition();
		if (this.VERTICES = i.VERTICES, this.VERTEX_SHADER_SOURCE = i.VERTEX_SHADER_SOURCE, this.FRAGMENT_SHADER_SOURCE = i.FRAGMENT_SHADER_SOURCE, this.UNIFORMS = i.UNIFORMS, this.ATTRIBUTES = i.ATTRIBUTES, this.METHOD = i.METHOD, this.CONSTANT_ATTRIBUTES = "CONSTANT_ATTRIBUTES" in i ? i.CONSTANT_ATTRIBUTES : [], this.CONSTANT_DATA = "CONSTANT_DATA" in i ? i.CONSTANT_DATA : [], this.isInstanced = "CONSTANT_ATTRIBUTES" in i, this.ATTRIBUTES_ITEMS_COUNT = Lr(this.ATTRIBUTES), this.STRIDE = this.VERTICES * this.ATTRIBUTES_ITEMS_COUNT, this.renderer = r, this.normalProgram = this.getProgramInfo("normal", t, i.VERTEX_SHADER_SOURCE, i.FRAGMENT_SHADER_SOURCE, null), this.pickProgram = n ? this.getProgramInfo("pick", t, Wr + i.VERTEX_SHADER_SOURCE, Wr + i.FRAGMENT_SHADER_SOURCE, n) : null, this.isInstanced) {
			var a = Lr(this.CONSTANT_ATTRIBUTES);
			if (this.CONSTANT_DATA.length !== this.VERTICES) throw Error(`Program: error while getting constant data (expected ${this.VERTICES} items, received ${this.CONSTANT_DATA.length} instead)`);
			this.constantArray = new Float32Array(this.CONSTANT_DATA.length * a);
			for (var o = 0; o < this.CONSTANT_DATA.length; o++) {
				var s = this.CONSTANT_DATA[o];
				if (s.length !== a) throw Error(`Program: error while getting constant data (one vector has ${s.length} items instead of ${a})`);
				for (var c = 0; c < s.length; c++) this.constantArray[o * a + c] = s[c];
			}
			this.STRIDE = this.ATTRIBUTES_ITEMS_COUNT;
		}
	}
	return U(e, [
		{
			key: "kill",
			value: function() {
				Hr(this.normalProgram), this.pickProgram &&= (Hr(this.pickProgram), null);
			}
		},
		{
			key: "getProgramInfo",
			value: function(e, t, n, r, i) {
				var a = this.getDefinition(), o = t.createBuffer();
				if (o === null) throw Error("Program: error while creating the WebGL buffer.");
				var s = zr(t, n), c = Br(t, r), l = Vr(t, [s, c]), u = {};
				a.UNIFORMS.forEach(function(e) {
					var n = t.getUniformLocation(l, e);
					n && (u[e] = n);
				});
				var d = {};
				a.ATTRIBUTES.forEach(function(e) {
					d[e.name] = t.getAttribLocation(l, e.name);
				});
				var f;
				if ("CONSTANT_ATTRIBUTES" in a && (a.CONSTANT_ATTRIBUTES.forEach(function(e) {
					d[e.name] = t.getAttribLocation(l, e.name);
				}), f = t.createBuffer(), f === null)) throw Error("Program: error while creating the WebGL constant buffer.");
				return {
					name: e,
					program: l,
					gl: t,
					frameBuffer: i,
					buffer: o,
					constantBuffer: f || {},
					uniformLocations: u,
					attributeLocations: d,
					isPicking: e === "pick",
					vertexShader: s,
					fragmentShader: c
				};
			}
		},
		{
			key: "bindProgram",
			value: function(e) {
				var t = this, n = 0, r = e.gl, i = e.buffer;
				this.isInstanced ? (r.bindBuffer(r.ARRAY_BUFFER, e.constantBuffer), n = 0, this.CONSTANT_ATTRIBUTES.forEach(function(r) {
					return n += t.bindAttribute(r, e, n, !1);
				}), r.bufferData(r.ARRAY_BUFFER, this.constantArray, r.STATIC_DRAW), r.bindBuffer(r.ARRAY_BUFFER, e.buffer), n = 0, this.ATTRIBUTES.forEach(function(r) {
					return n += t.bindAttribute(r, e, n, !0);
				}), r.bufferData(r.ARRAY_BUFFER, this.array, r.DYNAMIC_DRAW)) : (r.bindBuffer(r.ARRAY_BUFFER, i), n = 0, this.ATTRIBUTES.forEach(function(r) {
					return n += t.bindAttribute(r, e, n);
				}), r.bufferData(r.ARRAY_BUFFER, this.array, r.DYNAMIC_DRAW)), r.bindBuffer(r.ARRAY_BUFFER, null);
			}
		},
		{
			key: "unbindProgram",
			value: function(e) {
				var t = this;
				this.isInstanced ? (this.CONSTANT_ATTRIBUTES.forEach(function(n) {
					return t.unbindAttribute(n, e, !1);
				}), this.ATTRIBUTES.forEach(function(n) {
					return t.unbindAttribute(n, e, !0);
				})) : this.ATTRIBUTES.forEach(function(n) {
					return t.unbindAttribute(n, e);
				});
			}
		},
		{
			key: "bindAttribute",
			value: function(e, t, n, r) {
				var i = Gr[e.type];
				if (typeof i != "number") throw Error(`Program.bind: yet unsupported attribute type "${e.type}"`);
				var a = t.attributeLocations[e.name], o = t.gl;
				if (a !== -1) {
					o.enableVertexAttribArray(a);
					var s = this.isInstanced ? (r ? this.ATTRIBUTES_ITEMS_COUNT : Lr(this.CONSTANT_ATTRIBUTES)) * Float32Array.BYTES_PER_ELEMENT : this.ATTRIBUTES_ITEMS_COUNT * Float32Array.BYTES_PER_ELEMENT;
					if (o.vertexAttribPointer(a, e.size, e.type, e.normalized || !1, s, n), this.isInstanced && r) {
						if (o instanceof WebGL2RenderingContext) o.vertexAttribDivisor(a, 1);
						else {
							var c = o.getExtension("ANGLE_instanced_arrays");
							c && c.vertexAttribDivisorANGLE(a, 1);
						}
					}
				}
				return e.size * i;
			}
		},
		{
			key: "unbindAttribute",
			value: function(e, t, n) {
				var r = t.attributeLocations[e.name], i = t.gl;
				if (r !== -1 && (i.disableVertexAttribArray(r), this.isInstanced && n)) {
					if (i instanceof WebGL2RenderingContext) i.vertexAttribDivisor(r, 0);
					else {
						var a = i.getExtension("ANGLE_instanced_arrays");
						a && a.vertexAttribDivisorANGLE(r, 0);
					}
				}
			}
		},
		{
			key: "reallocate",
			value: function(e) {
				e !== this.capacity && (this.capacity = e, this.verticesCount = this.VERTICES * e, this.array = new Float32Array(this.isInstanced ? this.capacity * this.ATTRIBUTES_ITEMS_COUNT : this.verticesCount * this.ATTRIBUTES_ITEMS_COUNT));
			}
		},
		{
			key: "hasNothingToRender",
			value: function() {
				return this.verticesCount === 0;
			}
		},
		{
			key: "renderProgram",
			value: function(e, t) {
				var n = t.gl, r = t.program;
				n.enable(n.BLEND), n.useProgram(r), this.setUniforms(e, t), this.drawWebGL(this.METHOD, t);
			}
		},
		{
			key: "render",
			value: function(e) {
				this.hasNothingToRender() || (this.pickProgram && (this.pickProgram.gl.viewport(0, 0, e.width * e.pixelRatio / e.downSizingRatio, e.height * e.pixelRatio / e.downSizingRatio), this.bindProgram(this.pickProgram), this.renderProgram(q(q({}, e), {}, { pixelRatio: e.pixelRatio / e.downSizingRatio }), this.pickProgram), this.unbindProgram(this.pickProgram)), this.normalProgram.gl.viewport(0, 0, e.width * e.pixelRatio, e.height * e.pixelRatio), this.bindProgram(this.normalProgram), this.renderProgram(e, this.normalProgram), this.unbindProgram(this.normalProgram));
			}
		},
		{
			key: "drawWebGL",
			value: function(e, t) {
				var n = t.gl, r = t.frameBuffer;
				if (n.bindFramebuffer(n.FRAMEBUFFER, r), !this.isInstanced) n.drawArrays(e, 0, this.verticesCount);
				else if (n instanceof WebGL2RenderingContext) n.drawArraysInstanced(e, 0, this.VERTICES, this.capacity);
				else {
					var i = n.getExtension("ANGLE_instanced_arrays");
					i && i.drawArraysInstancedANGLE(e, 0, this.VERTICES, this.capacity);
				}
			}
		}
	]);
}(), qr = /*#__PURE__*/ function(e) {
	function t() {
		return H(this, t), W(this, t, arguments);
	}
	return G(t, e), U(t, [{
		key: "kill",
		value: function() {
			Fr(t, "kill", this, 3)([]);
		}
	}, {
		key: "process",
		value: function(e, t, n) {
			var r = t * this.STRIDE;
			if (n.hidden) for (var i = r + this.STRIDE; r < i; r++) this.array[r] = 0;
			else return this.processVisibleItem(kr(e), r, n);
		}
	}]);
}(Kr);
function Jr(e, t, n) {
	return /*#__PURE__*/ function() {
		function r(i, a, o) {
			H(this, r), K(this, "drawLabel", t), K(this, "drawHover", n), this.programs = e.map(function(e) {
				return new e(i, a, o);
			});
		}
		return U(r, [
			{
				key: "reallocate",
				value: function(e) {
					this.programs.forEach(function(t) {
						return t.reallocate(e);
					});
				}
			},
			{
				key: "process",
				value: function(e, t, n) {
					this.programs.forEach(function(r) {
						return r.process(e, t, n);
					});
				}
			},
			{
				key: "render",
				value: function(e) {
					this.programs.forEach(function(t) {
						return t.render(e);
					});
				}
			},
			{
				key: "kill",
				value: function() {
					this.programs.forEach(function(e) {
						return e.kill();
					});
				}
			}
		]);
	}();
}
var Yr = /*#__PURE__*/ function(e) {
	function t() {
		var e;
		H(this, t);
		var n = [...arguments];
		return e = W(this, t, [].concat(n)), K(e, "drawLabel", void 0), e;
	}
	return G(t, e), U(t, [{
		key: "kill",
		value: function() {
			Fr(t, "kill", this, 3)([]);
		}
	}, {
		key: "process",
		value: function(e, t, n, r, i) {
			var a = t * this.STRIDE;
			if (i.hidden || n.hidden || r.hidden) for (var o = a + this.STRIDE; a < o; a++) this.array[a] = 0;
			else return this.processVisibleItem(kr(e), a, n, r, i);
		}
	}]);
}(Kr);
function Xr(e, t) {
	return /*#__PURE__*/ function() {
		function n(r, i, a) {
			H(this, n), K(this, "drawLabel", t), this.programs = e.map(function(e) {
				return new e(r, i, a);
			});
		}
		return U(n, [
			{
				key: "reallocate",
				value: function(e) {
					this.programs.forEach(function(t) {
						return t.reallocate(e);
					});
				}
			},
			{
				key: "process",
				value: function(e, t, n, r, i) {
					this.programs.forEach(function(a) {
						return a.process(e, t, n, r, i);
					});
				}
			},
			{
				key: "render",
				value: function(e) {
					this.programs.forEach(function(t) {
						return t.render(e);
					});
				}
			},
			{
				key: "kill",
				value: function() {
					this.programs.forEach(function(e) {
						return e.kill();
					});
				}
			}
		]);
	}();
}
function Zr(e, t, n, r, i) {
	var a = i.edgeLabelSize, o = i.edgeLabelFont, s = i.edgeLabelWeight, c = i.edgeLabelColor.attribute ? t[i.edgeLabelColor.attribute] || i.edgeLabelColor.color || "#000" : i.edgeLabelColor.color, l = t.label;
	if (l) {
		e.fillStyle = c, e.font = `${s} ${a}px ${o}`;
		var u = n.size, d = r.size, f = n.x, p = n.y, m = r.x, h = r.y, g = (f + m) / 2, _ = (p + h) / 2, v = m - f, y = h - p, b = Math.sqrt(v * v + y * y);
		if (!(b < u + d)) {
			f += v * u / b, p += y * u / b, m -= v * d / b, h -= y * d / b, g = (f + m) / 2, _ = (p + h) / 2, v = m - f, y = h - p, b = Math.sqrt(v * v + y * y);
			var x = e.measureText(l).width;
			if (x > b) {
				var S = "…";
				for (l += S, x = e.measureText(l).width; x > b && l.length > 1;) l = l.slice(0, -2) + S, x = e.measureText(l).width;
				if (l.length < 4) return;
			}
			var C = v > 0 ? y > 0 ? Math.acos(v / b) : Math.asin(y / b) : y > 0 ? Math.acos(v / b) + Math.PI : Math.asin(v / b) + Math.PI / 2;
			e.save(), e.translate(g, _), e.rotate(C), e.fillText(l, -x / 2, t.size / 2 + a), e.restore();
		}
	}
}
function Qr(e, t, n) {
	if (t.label) {
		var r = n.labelSize, i = n.labelFont, a = n.labelWeight;
		e.fillStyle = n.labelColor.attribute ? t[n.labelColor.attribute] || n.labelColor.color || "#000" : n.labelColor.color, e.font = `${a} ${r}px ${i}`, e.fillText(t.label, t.x + t.size + 3, t.y + r / 3);
	}
}
function $r(e, t, n) {
	var r = n.labelSize, i = n.labelFont;
	e.font = `${n.labelWeight} ${r}px ${i}`, e.fillStyle = "#FFF", e.shadowOffsetX = 0, e.shadowOffsetY = 0, e.shadowBlur = 8, e.shadowColor = "#000";
	var a = 2;
	if (typeof t.label == "string") {
		var o = e.measureText(t.label).width, s = Math.round(o + 5), c = Math.round(r + 2 * a), l = Math.max(t.size, r / 2) + a, u = Math.asin(c / 2 / l), d = Math.sqrt(Math.abs(l ** 2 - (c / 2) ** 2));
		e.beginPath(), e.moveTo(t.x + d, t.y + c / 2), e.lineTo(t.x + l + s, t.y + c / 2), e.lineTo(t.x + l + s, t.y - c / 2), e.lineTo(t.x + d, t.y - c / 2), e.arc(t.x, t.y, l, u, -u), e.closePath(), e.fill();
	} else e.beginPath(), e.arc(t.x, t.y, t.size + a, 0, Math.PI * 2), e.closePath(), e.fill();
	e.shadowOffsetX = 0, e.shadowOffsetY = 0, e.shadowBlur = 0, Qr(e, t, n);
}
var ei = "\nprecision highp float;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\n\nuniform float u_correctionRatio;\n\nconst vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);\n\nvoid main(void) {\n  float border = u_correctionRatio * 2.0;\n  float dist = length(v_diffVector) - v_radius + border;\n\n  // No antialiasing for picking mode:\n  #ifdef PICKING_MODE\n  if (dist > border)\n    gl_FragColor = transparent;\n  else\n    gl_FragColor = v_color;\n\n  #else\n  float t = 0.0;\n  if (dist > border)\n    t = 1.0;\n  else if (dist > 0.0)\n    t = dist / border;\n\n  gl_FragColor = mix(v_color, transparent, t);\n  #endif\n}\n", ti = "\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_position;\nattribute float a_size;\nattribute float a_angle;\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\nvarying float v_border;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float size = a_size * u_correctionRatio / u_sizeRatio * 4.0;\n  vec2 diffVector = size * vec2(cos(a_angle), sin(a_angle));\n  vec2 position = a_position + diffVector;\n  gl_Position = vec4(\n    (u_matrix * vec3(position, 1)).xy,\n    0,\n    1\n  );\n\n  v_diffVector = diffVector;\n  v_radius = size / 2.0;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n", ni = WebGLRenderingContext, ri = ni.UNSIGNED_BYTE, ii = ni.FLOAT, ai = [
	"u_sizeRatio",
	"u_correctionRatio",
	"u_matrix"
], oi = /*#__PURE__*/ function(e) {
	function t() {
		return H(this, t), W(this, t, arguments);
	}
	return G(t, e), U(t, [
		{
			key: "getDefinition",
			value: function() {
				return {
					VERTICES: 3,
					VERTEX_SHADER_SOURCE: ti,
					FRAGMENT_SHADER_SOURCE: ei,
					METHOD: WebGLRenderingContext.TRIANGLES,
					UNIFORMS: ai,
					ATTRIBUTES: [
						{
							name: "a_position",
							size: 2,
							type: ii
						},
						{
							name: "a_size",
							size: 1,
							type: ii
						},
						{
							name: "a_color",
							size: 4,
							type: ri,
							normalized: !0
						},
						{
							name: "a_id",
							size: 4,
							type: ri,
							normalized: !0
						}
					],
					CONSTANT_ATTRIBUTES: [{
						name: "a_angle",
						size: 1,
						type: ii
					}],
					CONSTANT_DATA: [
						[t.ANGLE_1],
						[t.ANGLE_2],
						[t.ANGLE_3]
					]
				};
			}
		},
		{
			key: "processVisibleItem",
			value: function(e, t, n) {
				var r = this.array, i = Er(n.color);
				r[t++] = n.x, r[t++] = n.y, r[t++] = n.size, r[t++] = i, r[t++] = e;
			}
		},
		{
			key: "setUniforms",
			value: function(e, t) {
				var n = t.gl, r = t.uniformLocations, i = r.u_sizeRatio, a = r.u_correctionRatio, o = r.u_matrix;
				n.uniform1f(a, e.correctionRatio), n.uniform1f(i, e.sizeRatio), n.uniformMatrix3fv(o, !1, e.matrix);
			}
		}
	]);
}(qr);
K(oi, "ANGLE_1", 0), K(oi, "ANGLE_2", 2 * Math.PI / 3), K(oi, "ANGLE_3", 4 * Math.PI / 3);
var si = "\nprecision mediump float;\n\nvarying vec4 v_color;\n\nvoid main(void) {\n  gl_FragColor = v_color;\n}\n", ci = "\nattribute vec2 a_position;\nattribute vec2 a_normal;\nattribute float a_radius;\nattribute vec3 a_barycentric;\n\n#ifdef PICKING_MODE\nattribute vec4 a_id;\n#else\nattribute vec4 a_color;\n#endif\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\nuniform float u_minEdgeThickness;\nuniform float u_lengthToThicknessRatio;\nuniform float u_widenessToThicknessRatio;\n\nvarying vec4 v_color;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float minThickness = u_minEdgeThickness;\n\n  float normalLength = length(a_normal);\n  vec2 unitNormal = a_normal / normalLength;\n\n  // These first computations are taken from edge.vert.glsl and\n  // edge.clamped.vert.glsl. Please read it to get better comments on what's\n  // happening:\n  float pixelsThickness = max(normalLength / u_sizeRatio, minThickness);\n  float webGLThickness = pixelsThickness * u_correctionRatio;\n  float webGLNodeRadius = a_radius * 2.0 * u_correctionRatio / u_sizeRatio;\n  float webGLArrowHeadLength = webGLThickness * u_lengthToThicknessRatio * 2.0;\n  float webGLArrowHeadThickness = webGLThickness * u_widenessToThicknessRatio;\n\n  float da = a_barycentric.x;\n  float db = a_barycentric.y;\n  float dc = a_barycentric.z;\n\n  vec2 delta = vec2(\n      da * (webGLNodeRadius * unitNormal.y)\n    + db * ((webGLNodeRadius + webGLArrowHeadLength) * unitNormal.y + webGLArrowHeadThickness * unitNormal.x)\n    + dc * ((webGLNodeRadius + webGLArrowHeadLength) * unitNormal.y - webGLArrowHeadThickness * unitNormal.x),\n\n      da * (-webGLNodeRadius * unitNormal.x)\n    + db * (-(webGLNodeRadius + webGLArrowHeadLength) * unitNormal.x + webGLArrowHeadThickness * unitNormal.y)\n    + dc * (-(webGLNodeRadius + webGLArrowHeadLength) * unitNormal.x - webGLArrowHeadThickness * unitNormal.y)\n  );\n\n  vec2 position = (u_matrix * vec3(a_position + delta, 1)).xy;\n\n  gl_Position = vec4(position, 0, 1);\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n", li = WebGLRenderingContext, ui = li.UNSIGNED_BYTE, di = li.FLOAT, fi = [
	"u_matrix",
	"u_sizeRatio",
	"u_correctionRatio",
	"u_minEdgeThickness",
	"u_lengthToThicknessRatio",
	"u_widenessToThicknessRatio"
], pi = {
	extremity: "target",
	lengthToThicknessRatio: 2.5,
	widenessToThicknessRatio: 2
};
function mi(e) {
	var t = q(q({}, pi), e || {});
	return /*#__PURE__*/ function(e) {
		function n() {
			return H(this, n), W(this, n, arguments);
		}
		return G(n, e), U(n, [
			{
				key: "getDefinition",
				value: function() {
					return {
						VERTICES: 3,
						VERTEX_SHADER_SOURCE: ci,
						FRAGMENT_SHADER_SOURCE: si,
						METHOD: WebGLRenderingContext.TRIANGLES,
						UNIFORMS: fi,
						ATTRIBUTES: [
							{
								name: "a_position",
								size: 2,
								type: di
							},
							{
								name: "a_normal",
								size: 2,
								type: di
							},
							{
								name: "a_radius",
								size: 1,
								type: di
							},
							{
								name: "a_color",
								size: 4,
								type: ui,
								normalized: !0
							},
							{
								name: "a_id",
								size: 4,
								type: ui,
								normalized: !0
							}
						],
						CONSTANT_ATTRIBUTES: [{
							name: "a_barycentric",
							size: 3,
							type: di
						}],
						CONSTANT_DATA: [
							[
								1,
								0,
								0
							],
							[
								0,
								1,
								0
							],
							[
								0,
								0,
								1
							]
						]
					};
				}
			},
			{
				key: "processVisibleItem",
				value: function(e, n, r, i, a) {
					if (t.extremity === "source") {
						var o = [i, r];
						r = o[0], i = o[1];
					}
					var s = a.size || 1, c = i.size || 1, l = r.x, u = r.y, d = i.x, f = i.y, p = Er(a.color), m = d - l, h = f - u, g = m * m + h * h, _ = 0, v = 0;
					g && (g = 1 / Math.sqrt(g), _ = -h * g * s, v = m * g * s);
					var y = this.array;
					y[n++] = d, y[n++] = f, y[n++] = -_, y[n++] = -v, y[n++] = c, y[n++] = p, y[n++] = e;
				}
			},
			{
				key: "setUniforms",
				value: function(e, n) {
					var r = n.gl, i = n.uniformLocations, a = i.u_matrix, o = i.u_sizeRatio, s = i.u_correctionRatio, c = i.u_minEdgeThickness, l = i.u_lengthToThicknessRatio, u = i.u_widenessToThicknessRatio;
					r.uniformMatrix3fv(a, !1, e.matrix), r.uniform1f(o, e.sizeRatio), r.uniform1f(s, e.correctionRatio), r.uniform1f(c, e.minEdgeThickness), r.uniform1f(l, t.lengthToThicknessRatio), r.uniform1f(u, t.widenessToThicknessRatio);
				}
			}
		]);
	}(Yr);
}
mi();
var hi = "\nprecision mediump float;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\nvarying float v_feather;\n\nconst vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);\n\nvoid main(void) {\n  // We only handle antialiasing for normal mode:\n  #ifdef PICKING_MODE\n  gl_FragColor = v_color;\n  #else\n  float dist = length(v_normal) * v_thickness;\n\n  float t = smoothstep(\n    v_thickness - v_feather,\n    v_thickness,\n    dist\n  );\n\n  gl_FragColor = mix(v_color, transparent, t);\n  #endif\n}\n", gi = "\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_normal;\nattribute float a_normalCoef;\nattribute vec2 a_positionStart;\nattribute vec2 a_positionEnd;\nattribute float a_positionCoef;\nattribute float a_radius;\nattribute float a_radiusCoef;\n\nuniform mat3 u_matrix;\nuniform float u_zoomRatio;\nuniform float u_sizeRatio;\nuniform float u_pixelRatio;\nuniform float u_correctionRatio;\nuniform float u_minEdgeThickness;\nuniform float u_lengthToThicknessRatio;\nuniform float u_feather;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\nvarying float v_feather;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float minThickness = u_minEdgeThickness;\n\n  float radius = a_radius * a_radiusCoef;\n  vec2 normal = a_normal * a_normalCoef;\n  vec2 position = a_positionStart * (1.0 - a_positionCoef) + a_positionEnd * a_positionCoef;\n\n  float normalLength = length(normal);\n  vec2 unitNormal = normal / normalLength;\n\n  // These first computations are taken from edge.vert.glsl. Please read it to\n  // get better comments on what's happening:\n  float pixelsThickness = max(normalLength, minThickness * u_sizeRatio);\n  float webGLThickness = pixelsThickness * u_correctionRatio / u_sizeRatio;\n\n  // Here, we move the point to leave space for the arrow head:\n  float direction = sign(radius);\n  float webGLNodeRadius = direction * radius * 2.0 * u_correctionRatio / u_sizeRatio;\n  float webGLArrowHeadLength = webGLThickness * u_lengthToThicknessRatio * 2.0;\n\n  vec2 compensationVector = vec2(-direction * unitNormal.y, direction * unitNormal.x) * (webGLNodeRadius + webGLArrowHeadLength);\n\n  // Here is the proper position of the vertex\n  gl_Position = vec4((u_matrix * vec3(position + unitNormal * webGLThickness + compensationVector, 1)).xy, 0, 1);\n\n  v_thickness = webGLThickness / u_zoomRatio;\n\n  v_normal = unitNormal;\n\n  v_feather = u_feather * u_correctionRatio / u_zoomRatio / u_pixelRatio * 2.0;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n", _i = WebGLRenderingContext, vi = _i.UNSIGNED_BYTE, yi = _i.FLOAT, bi = [
	"u_matrix",
	"u_zoomRatio",
	"u_sizeRatio",
	"u_correctionRatio",
	"u_pixelRatio",
	"u_feather",
	"u_minEdgeThickness",
	"u_lengthToThicknessRatio"
], xi = { lengthToThicknessRatio: pi.lengthToThicknessRatio };
function Si(e) {
	var t = q(q({}, xi), e || {});
	return /*#__PURE__*/ function(e) {
		function n() {
			return H(this, n), W(this, n, arguments);
		}
		return G(n, e), U(n, [
			{
				key: "getDefinition",
				value: function() {
					return {
						VERTICES: 6,
						VERTEX_SHADER_SOURCE: gi,
						FRAGMENT_SHADER_SOURCE: hi,
						METHOD: WebGLRenderingContext.TRIANGLES,
						UNIFORMS: bi,
						ATTRIBUTES: [
							{
								name: "a_positionStart",
								size: 2,
								type: yi
							},
							{
								name: "a_positionEnd",
								size: 2,
								type: yi
							},
							{
								name: "a_normal",
								size: 2,
								type: yi
							},
							{
								name: "a_color",
								size: 4,
								type: vi,
								normalized: !0
							},
							{
								name: "a_id",
								size: 4,
								type: vi,
								normalized: !0
							},
							{
								name: "a_radius",
								size: 1,
								type: yi
							}
						],
						CONSTANT_ATTRIBUTES: [
							{
								name: "a_positionCoef",
								size: 1,
								type: yi
							},
							{
								name: "a_normalCoef",
								size: 1,
								type: yi
							},
							{
								name: "a_radiusCoef",
								size: 1,
								type: yi
							}
						],
						CONSTANT_DATA: [
							[
								0,
								1,
								0
							],
							[
								0,
								-1,
								0
							],
							[
								1,
								1,
								1
							],
							[
								1,
								1,
								1
							],
							[
								0,
								-1,
								0
							],
							[
								1,
								-1,
								-1
							]
						]
					};
				}
			},
			{
				key: "processVisibleItem",
				value: function(e, t, n, r, i) {
					var a = i.size || 1, o = n.x, s = n.y, c = r.x, l = r.y, u = Er(i.color), d = c - o, f = l - s, p = r.size || 1, m = d * d + f * f, h = 0, g = 0;
					m && (m = 1 / Math.sqrt(m), h = -f * m * a, g = d * m * a);
					var _ = this.array;
					_[t++] = o, _[t++] = s, _[t++] = c, _[t++] = l, _[t++] = h, _[t++] = g, _[t++] = u, _[t++] = e, _[t++] = p;
				}
			},
			{
				key: "setUniforms",
				value: function(e, n) {
					var r = n.gl, i = n.uniformLocations, a = i.u_matrix, o = i.u_zoomRatio, s = i.u_feather, c = i.u_pixelRatio, l = i.u_correctionRatio, u = i.u_sizeRatio, d = i.u_minEdgeThickness, f = i.u_lengthToThicknessRatio;
					r.uniformMatrix3fv(a, !1, e.matrix), r.uniform1f(o, e.zoomRatio), r.uniform1f(u, e.sizeRatio), r.uniform1f(l, e.correctionRatio), r.uniform1f(c, e.pixelRatio), r.uniform1f(s, e.antiAliasingFeather), r.uniform1f(d, e.minEdgeThickness), r.uniform1f(f, t.lengthToThicknessRatio);
				}
			}
		]);
	}(Yr);
}
Si();
function Ci(e) {
	return Xr([Si(e), mi(e)]);
}
var wi = Ci(), Ti = "\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_normal;\nattribute float a_normalCoef;\nattribute vec2 a_positionStart;\nattribute vec2 a_positionEnd;\nattribute float a_positionCoef;\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_zoomRatio;\nuniform float u_pixelRatio;\nuniform float u_correctionRatio;\nuniform float u_minEdgeThickness;\nuniform float u_feather;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\nvarying float v_feather;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float minThickness = u_minEdgeThickness;\n\n  vec2 normal = a_normal * a_normalCoef;\n  vec2 position = a_positionStart * (1.0 - a_positionCoef) + a_positionEnd * a_positionCoef;\n\n  float normalLength = length(normal);\n  vec2 unitNormal = normal / normalLength;\n\n  // We require edges to be at least \"minThickness\" pixels thick *on screen*\n  // (so we need to compensate the size ratio):\n  float pixelsThickness = max(normalLength, minThickness * u_sizeRatio);\n\n  // Then, we need to retrieve the normalized thickness of the edge in the WebGL\n  // referential (in a ([0, 1], [0, 1]) space), using our \"magic\" correction\n  // ratio:\n  float webGLThickness = pixelsThickness * u_correctionRatio / u_sizeRatio;\n\n  // Here is the proper position of the vertex\n  gl_Position = vec4((u_matrix * vec3(position + unitNormal * webGLThickness, 1)).xy, 0, 1);\n\n  // For the fragment shader though, we need a thickness that takes the \"magic\"\n  // correction ratio into account (as in webGLThickness), but so that the\n  // antialiasing effect does not depend on the zoom level. So here's yet\n  // another thickness version:\n  v_thickness = webGLThickness / u_zoomRatio;\n\n  v_normal = unitNormal;\n\n  v_feather = u_feather * u_correctionRatio / u_zoomRatio / u_pixelRatio * 2.0;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n", Ei = WebGLRenderingContext, Di = Ei.UNSIGNED_BYTE, Oi = Ei.FLOAT, ki = [
	"u_matrix",
	"u_zoomRatio",
	"u_sizeRatio",
	"u_correctionRatio",
	"u_pixelRatio",
	"u_feather",
	"u_minEdgeThickness"
], Ai = /*#__PURE__*/ function(e) {
	function t() {
		return H(this, t), W(this, t, arguments);
	}
	return G(t, e), U(t, [
		{
			key: "getDefinition",
			value: function() {
				return {
					VERTICES: 6,
					VERTEX_SHADER_SOURCE: Ti,
					FRAGMENT_SHADER_SOURCE: hi,
					METHOD: WebGLRenderingContext.TRIANGLES,
					UNIFORMS: ki,
					ATTRIBUTES: [
						{
							name: "a_positionStart",
							size: 2,
							type: Oi
						},
						{
							name: "a_positionEnd",
							size: 2,
							type: Oi
						},
						{
							name: "a_normal",
							size: 2,
							type: Oi
						},
						{
							name: "a_color",
							size: 4,
							type: Di,
							normalized: !0
						},
						{
							name: "a_id",
							size: 4,
							type: Di,
							normalized: !0
						}
					],
					CONSTANT_ATTRIBUTES: [{
						name: "a_positionCoef",
						size: 1,
						type: Oi
					}, {
						name: "a_normalCoef",
						size: 1,
						type: Oi
					}],
					CONSTANT_DATA: [
						[0, 1],
						[0, -1],
						[1, 1],
						[1, 1],
						[0, -1],
						[1, -1]
					]
				};
			}
		},
		{
			key: "processVisibleItem",
			value: function(e, t, n, r, i) {
				var a = i.size || 1, o = n.x, s = n.y, c = r.x, l = r.y, u = Er(i.color), d = c - o, f = l - s, p = d * d + f * f, m = 0, h = 0;
				p && (p = 1 / Math.sqrt(p), m = -f * p * a, h = d * p * a);
				var g = this.array;
				g[t++] = o, g[t++] = s, g[t++] = c, g[t++] = l, g[t++] = m, g[t++] = h, g[t++] = u, g[t++] = e;
			}
		},
		{
			key: "setUniforms",
			value: function(e, t) {
				var n = t.gl, r = t.uniformLocations, i = r.u_matrix, a = r.u_zoomRatio, o = r.u_feather, s = r.u_pixelRatio, c = r.u_correctionRatio, l = r.u_sizeRatio, u = r.u_minEdgeThickness;
				n.uniformMatrix3fv(i, !1, e.matrix), n.uniform1f(a, e.zoomRatio), n.uniform1f(l, e.sizeRatio), n.uniform1f(c, e.correctionRatio), n.uniform1f(s, e.pixelRatio), n.uniform1f(o, e.antiAliasingFeather), n.uniform1f(u, e.minEdgeThickness);
			}
		}
	]);
}(Yr), ji = /*#__PURE__*/ function(e) {
	function t() {
		var e;
		return H(this, t), e = W(this, t), e.rawEmitter = e, e;
	}
	return G(t, e), U(t);
}(te.EventEmitter), Mi = /* @__PURE__ */ c((/* @__PURE__ */ o(((e, t) => {
	t.exports = function(e) {
		return typeof e == "object" && !!e && typeof e.addUndirectedEdgeWithKey == "function" && typeof e.dropNode == "function" && typeof e.multi == "boolean";
	};
})))()), Ni = {
	linear: function(e) {
		return e;
	},
	quadraticIn: function(e) {
		return e * e;
	},
	quadraticOut: function(e) {
		return e * (2 - e);
	},
	quadraticInOut: function(e) {
		return (e *= 2) < 1 ? .5 * e * e : -.5 * (--e * (e - 2) - 1);
	},
	cubicIn: function(e) {
		return e * e * e;
	},
	cubicOut: function(e) {
		return --e * e * e + 1;
	},
	cubicInOut: function(e) {
		return (e *= 2) < 1 ? .5 * e * e * e : .5 * ((e -= 2) * e * e + 2);
	}
}, Pi = {
	easing: "quadraticInOut",
	duration: 150
};
function J() {
	return Float32Array.of(1, 0, 0, 0, 1, 0, 0, 0, 1);
}
function Fi(e, t, n) {
	return e[0] = t, e[4] = typeof n == "number" ? n : t, e;
}
function Ii(e, t) {
	var n = Math.sin(t), r = Math.cos(t);
	return e[0] = r, e[1] = n, e[3] = -n, e[4] = r, e;
}
function Li(e, t, n) {
	return e[6] = t, e[7] = n, e;
}
function Ri(e, t) {
	var n = e[0], r = e[1], i = e[2], a = e[3], o = e[4], s = e[5], c = e[6], l = e[7], u = e[8], d = t[0], f = t[1], p = t[2], m = t[3], h = t[4], g = t[5], _ = t[6], v = t[7], y = t[8];
	return e[0] = d * n + f * a + p * c, e[1] = d * r + f * o + p * l, e[2] = d * i + f * s + p * u, e[3] = m * n + h * a + g * c, e[4] = m * r + h * o + g * l, e[5] = m * i + h * s + g * u, e[6] = _ * n + v * a + y * c, e[7] = _ * r + v * o + y * l, e[8] = _ * i + v * s + y * u, e;
}
function zi(e, t) {
	var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1, r = e[0], i = e[1], a = e[3], o = e[4], s = e[6], c = e[7], l = t.x, u = t.y;
	return {
		x: l * r + u * a + s * n,
		y: l * i + u * o + c * n
	};
}
function Bi(e, t) {
	var n = e.height / e.width, r = t.height / t.width;
	return n < 1 && r > 1 || n > 1 && r < 1 ? 1 : Math.min(Math.max(r, 1 / r), Math.max(1 / n, n));
}
function Vi(e, t, n, r, i) {
	var a = e.angle, o = e.ratio, s = e.x, c = e.y, l = t.width, u = t.height, d = J(), f = Math.min(l, u) - 2 * r, p = Bi(t, n);
	return i ? (Ri(d, Li(J(), s, c)), Ri(d, Fi(J(), o)), Ri(d, Ii(J(), a)), Ri(d, Fi(J(), l / f / 2 / p, u / f / 2 / p))) : (Ri(d, Fi(J(), f / l * 2 * p, f / u * 2 * p)), Ri(d, Ii(J(), -a)), Ri(d, Fi(J(), 1 / o)), Ri(d, Li(J(), -s, -c))), d;
}
function Hi(e, t, n) {
	var r = zi(e, {
		x: Math.cos(t.angle),
		y: Math.sin(t.angle)
	}, 0), i = r.x, a = r.y;
	return 1 / Math.sqrt(i ** 2 + a ** 2) / n.width;
}
function Ui(e) {
	if (!e.order) return {
		x: [0, 1],
		y: [0, 1]
	};
	var t = Infinity, n = -Infinity, r = Infinity, i = -Infinity;
	return e.forEachNode(function(e, a) {
		var o = a.x, s = a.y;
		o < t && (t = o), o > n && (n = o), s < r && (r = s), s > i && (i = s);
	}), {
		x: [t, n],
		y: [r, i]
	};
}
function Wi(e) {
	if (!(0, Mi.default)(e)) throw Error("Sigma: invalid graph instance.");
	e.forEachNode(function(e, t) {
		if (!Number.isFinite(t.x) || !Number.isFinite(t.y)) throw Error(`Sigma: Coordinates of node ${e} are invalid. A node must have a numeric 'x' and 'y' attribute.`);
	});
}
function Gi(e, t, n) {
	var r = document.createElement(e);
	if (t) for (var i in t) r.style[i] = t[i];
	if (n) for (var a in n) r.setAttribute(a, n[a]);
	return r;
}
function Ki() {
	return window.devicePixelRatio === void 0 ? 1 : window.devicePixelRatio;
}
function qi(e, t, n) {
	return n.sort(function(e, n) {
		var r = t(e) || 0, i = t(n) || 0;
		return r < i ? -1 : +(r > i);
	});
}
function Ji(e) {
	var t = hr(e.x, 2), n = t[0], r = t[1], i = hr(e.y, 2), a = i[0], o = i[1], s = Math.max(r - n, o - a), c = (r + n) / 2, l = (o + a) / 2;
	(s === 0 || Math.abs(s) === Infinity || isNaN(s)) && (s = 1), isNaN(c) && (c = 0), isNaN(l) && (l = 0);
	var u = function(e) {
		return {
			x: .5 + (e.x - c) / s,
			y: .5 + (e.y - l) / s
		};
	};
	return u.applyTo = function(e) {
		e.x = .5 + (e.x - c) / s, e.y = .5 + (e.y - l) / s;
	}, u.inverse = function(e) {
		return {
			x: c + s * (e.x - .5),
			y: l + s * (e.y - .5)
		};
	}, u.ratio = s, u;
}
// node_modules/.pnpm/sigma@3.0.3_graphology-types@0.24.8/node_modules/sigma/dist/data-11df7124.esm.js
function Yi(e) {
	"@babel/helpers - typeof";
	return Yi = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Yi(e);
}
function Xi(e, t) {
	var n = t.size;
	if (n !== 0) {
		var r = e.length;
		e.length += n;
		var i = 0;
		t.forEach(function(t) {
			e[r + i] = t, i++;
		});
	}
}
function Zi(e) {
	e ||= {};
	for (var t = 0, n = arguments.length <= 1 ? 0 : arguments.length - 1; t < n; t++) {
		var r = t + 1 < 1 || arguments.length <= t + 1 ? void 0 : arguments[t + 1];
		r && Object.assign(e, r);
	}
	return e;
}
// node_modules/.pnpm/sigma@3.0.3_graphology-types@0.24.8/node_modules/sigma/settings/dist/sigma-settings.esm.js
var Qi = {
	hideEdgesOnMove: !1,
	hideLabelsOnMove: !1,
	renderLabels: !0,
	renderEdgeLabels: !1,
	enableEdgeEvents: !1,
	defaultNodeColor: "#999",
	defaultNodeType: "circle",
	defaultEdgeColor: "#ccc",
	defaultEdgeType: "line",
	labelFont: "Arial",
	labelSize: 14,
	labelWeight: "normal",
	labelColor: { color: "#000" },
	edgeLabelFont: "Arial",
	edgeLabelSize: 14,
	edgeLabelWeight: "normal",
	edgeLabelColor: { attribute: "color" },
	stagePadding: 30,
	defaultDrawEdgeLabel: Zr,
	defaultDrawNodeLabel: Qr,
	defaultDrawNodeHover: $r,
	minEdgeThickness: 1.7,
	antiAliasingFeather: 1,
	dragTimeout: 100,
	draggedEventsTolerance: 3,
	inertiaDuration: 200,
	inertiaRatio: 3,
	zoomDuration: 250,
	zoomingRatio: 1.7,
	doubleClickTimeout: 300,
	doubleClickZoomingRatio: 2.2,
	doubleClickZoomingDuration: 200,
	tapMoveTolerance: 10,
	zoomToSizeRatioFunction: Math.sqrt,
	itemSizesReference: "screen",
	autoRescale: !0,
	autoCenter: !0,
	labelDensity: 1,
	labelGridCellSize: 100,
	labelRenderedSizeThreshold: 6,
	nodeReducer: null,
	edgeReducer: null,
	zIndex: !1,
	minCameraRatio: null,
	maxCameraRatio: null,
	enableCameraZooming: !0,
	enableCameraPanning: !0,
	enableCameraRotation: !0,
	cameraPanBoundaries: null,
	allowInvalidContainer: !1,
	nodeProgramClasses: {},
	nodeHoverProgramClasses: {},
	edgeProgramClasses: {}
}, $i = { circle: oi }, ea = {
	arrow: wi,
	line: Ai
};
function ta(e) {
	if (typeof e.labelDensity != "number" || e.labelDensity < 0) throw Error("Settings: invalid `labelDensity`. Expecting a positive number.");
	var t = e.minCameraRatio, n = e.maxCameraRatio;
	if (typeof t == "number" && typeof n == "number" && n < t) throw Error("Settings: invalid camera ratio boundaries. Expecting `maxCameraRatio` to be greater than `minCameraRatio`.");
}
function na(e) {
	var t = Zi({}, Qi, e);
	return t.nodeProgramClasses = Zi({}, $i, t.nodeProgramClasses), t.edgeProgramClasses = Zi({}, ea, t.edgeProgramClasses), t;
}
// node_modules/.pnpm/sigma@3.0.3_graphology-types@0.24.8/node_modules/sigma/dist/sigma.esm.js
var ra = 1.5, ia = /*#__PURE__*/ function(e) {
	function t() {
		var e;
		return H(this, t), e = W(this, t), K(e, "x", .5), K(e, "y", .5), K(e, "angle", 0), K(e, "ratio", 1), K(e, "minRatio", null), K(e, "maxRatio", null), K(e, "enabledZooming", !0), K(e, "enabledPanning", !0), K(e, "enabledRotation", !0), K(e, "clean", null), K(e, "nextFrame", null), K(e, "previousState", null), K(e, "enabled", !0), e.previousState = e.getState(), e;
	}
	return G(t, e), U(t, [
		{
			key: "enable",
			value: function() {
				return this.enabled = !0, this;
			}
		},
		{
			key: "disable",
			value: function() {
				return this.enabled = !1, this;
			}
		},
		{
			key: "getState",
			value: function() {
				return {
					x: this.x,
					y: this.y,
					angle: this.angle,
					ratio: this.ratio
				};
			}
		},
		{
			key: "hasState",
			value: function(e) {
				return this.x === e.x && this.y === e.y && this.ratio === e.ratio && this.angle === e.angle;
			}
		},
		{
			key: "getPreviousState",
			value: function() {
				var e = this.previousState;
				return e ? {
					x: e.x,
					y: e.y,
					angle: e.angle,
					ratio: e.ratio
				} : null;
			}
		},
		{
			key: "getBoundedRatio",
			value: function(e) {
				var t = e;
				return typeof this.minRatio == "number" && (t = Math.max(t, this.minRatio)), typeof this.maxRatio == "number" && (t = Math.min(t, this.maxRatio)), t;
			}
		},
		{
			key: "validateState",
			value: function(e) {
				var t = {};
				return this.enabledPanning && typeof e.x == "number" && (t.x = e.x), this.enabledPanning && typeof e.y == "number" && (t.y = e.y), this.enabledZooming && typeof e.ratio == "number" && (t.ratio = this.getBoundedRatio(e.ratio)), this.enabledRotation && typeof e.angle == "number" && (t.angle = e.angle), this.clean ? this.clean(q(q({}, this.getState()), t)) : t;
			}
		},
		{
			key: "isAnimated",
			value: function() {
				return !!this.nextFrame;
			}
		},
		{
			key: "setState",
			value: function(e) {
				if (!this.enabled) return this;
				this.previousState = this.getState();
				var t = this.validateState(e);
				return typeof t.x == "number" && (this.x = t.x), typeof t.y == "number" && (this.y = t.y), typeof t.ratio == "number" && (this.ratio = t.ratio), typeof t.angle == "number" && (this.angle = t.angle), this.hasState(this.previousState) || this.emit("updated", this.getState()), this;
			}
		},
		{
			key: "updateState",
			value: function(e) {
				return this.setState(e(this.getState())), this;
			}
		},
		{
			key: "animate",
			value: function(e) {
				var t = this, n = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, r = arguments.length > 2 ? arguments[2] : void 0;
				if (!r) return new Promise(function(r) {
					return t.animate(e, n, r);
				});
				if (this.enabled) {
					var i = q(q({}, Pi), n), a = this.validateState(e), o = typeof i.easing == "function" ? i.easing : Ni[i.easing], s = Date.now(), c = this.getState(), l = function() {
						var e = (Date.now() - s) / i.duration;
						if (e >= 1) t.nextFrame = null, t.setState(a), t.animationCallback &&= (t.animationCallback.call(null), void 0);
						else {
							var n = o(e), r = {};
							typeof a.x == "number" && (r.x = c.x + (a.x - c.x) * n), typeof a.y == "number" && (r.y = c.y + (a.y - c.y) * n), t.enabledRotation && typeof a.angle == "number" && (r.angle = c.angle + (a.angle - c.angle) * n), typeof a.ratio == "number" && (r.ratio = c.ratio + (a.ratio - c.ratio) * n), t.setState(r), t.nextFrame = requestAnimationFrame(l);
						}
					};
					this.nextFrame ? (cancelAnimationFrame(this.nextFrame), this.animationCallback && this.animationCallback.call(null), this.nextFrame = requestAnimationFrame(l)) : l(), this.animationCallback = r;
				}
			}
		},
		{
			key: "animatedZoom",
			value: function(e) {
				return e ? typeof e == "number" ? this.animate({ ratio: this.ratio / e }) : this.animate({ ratio: this.ratio / (e.factor || ra) }, e) : this.animate({ ratio: this.ratio / ra });
			}
		},
		{
			key: "animatedUnzoom",
			value: function(e) {
				return e ? typeof e == "number" ? this.animate({ ratio: this.ratio * e }) : this.animate({ ratio: this.ratio * (e.factor || ra) }, e) : this.animate({ ratio: this.ratio * ra });
			}
		},
		{
			key: "animatedReset",
			value: function(e) {
				return this.animate({
					x: .5,
					y: .5,
					ratio: 1,
					angle: 0
				}, e);
			}
		},
		{
			key: "copy",
			value: function() {
				return t.from(this.getState());
			}
		}
	], [{
		key: "from",
		value: function(e) {
			return new t().setState(e);
		}
	}]);
}(ji);
function Y(e, t) {
	var n = t.getBoundingClientRect();
	return {
		x: e.clientX - n.left,
		y: e.clientY - n.top
	};
}
function aa(e, t) {
	var n = q(q({}, Y(e, t)), {}, {
		sigmaDefaultPrevented: !1,
		preventSigmaDefault: function() {
			n.sigmaDefaultPrevented = !0;
		},
		original: e
	});
	return n;
}
function oa(e) {
	var t = "x" in e ? e : q(q({}, e.touches[0] || e.previousTouches[0]), {}, {
		original: e.original,
		sigmaDefaultPrevented: e.sigmaDefaultPrevented,
		preventSigmaDefault: function() {
			e.sigmaDefaultPrevented = !0, t.sigmaDefaultPrevented = !0;
		}
	});
	return t;
}
function sa(e, t) {
	return q(q({}, aa(e, t)), {}, { delta: da(e) });
}
var ca = 2;
function la(e) {
	for (var t = [], n = 0, r = Math.min(e.length, ca); n < r; n++) t.push(e[n]);
	return t;
}
function ua(e, t, n) {
	var r = {
		touches: la(e.touches).map(function(e) {
			return Y(e, n);
		}),
		previousTouches: t.map(function(e) {
			return Y(e, n);
		}),
		sigmaDefaultPrevented: !1,
		preventSigmaDefault: function() {
			r.sigmaDefaultPrevented = !0;
		},
		original: e
	};
	return r;
}
function da(e) {
	if (e.deltaY !== void 0) return e.deltaY * -3 / 360;
	if (e.detail !== void 0) return e.detail / -9;
	throw Error("Captor: could not extract delta from event.");
}
var fa = /*#__PURE__*/ function(e) {
	function t(e, n) {
		var r;
		return H(this, t), r = W(this, t), r.container = e, r.renderer = n, r;
	}
	return G(t, e), U(t);
}(ji), pa = [
	"doubleClickTimeout",
	"doubleClickZoomingDuration",
	"doubleClickZoomingRatio",
	"dragTimeout",
	"draggedEventsTolerance",
	"inertiaDuration",
	"inertiaRatio",
	"zoomDuration",
	"zoomingRatio"
].reduce(function(e, t) {
	return q(q({}, e), {}, K({}, t, Qi[t]));
}, {}), ma = /*#__PURE__*/ function(e) {
	function t(e, n) {
		var r;
		return H(this, t), r = W(this, t, [e, n]), K(r, "enabled", !0), K(r, "draggedEvents", 0), K(r, "downStartTime", null), K(r, "lastMouseX", null), K(r, "lastMouseY", null), K(r, "isMouseDown", !1), K(r, "isMoving", !1), K(r, "movingTimeout", null), K(r, "startCameraState", null), K(r, "clicks", 0), K(r, "doubleClickTimeout", null), K(r, "currentWheelDirection", 0), K(r, "settings", pa), r.handleClick = r.handleClick.bind(r), r.handleRightClick = r.handleRightClick.bind(r), r.handleDown = r.handleDown.bind(r), r.handleUp = r.handleUp.bind(r), r.handleMove = r.handleMove.bind(r), r.handleWheel = r.handleWheel.bind(r), r.handleLeave = r.handleLeave.bind(r), r.handleEnter = r.handleEnter.bind(r), e.addEventListener("click", r.handleClick, { capture: !1 }), e.addEventListener("contextmenu", r.handleRightClick, { capture: !1 }), e.addEventListener("mousedown", r.handleDown, { capture: !1 }), e.addEventListener("wheel", r.handleWheel, { capture: !1 }), e.addEventListener("mouseleave", r.handleLeave, { capture: !1 }), e.addEventListener("mouseenter", r.handleEnter, { capture: !1 }), document.addEventListener("mousemove", r.handleMove, { capture: !1 }), document.addEventListener("mouseup", r.handleUp, { capture: !1 }), r;
	}
	return G(t, e), U(t, [
		{
			key: "kill",
			value: function() {
				var e = this.container;
				e.removeEventListener("click", this.handleClick), e.removeEventListener("contextmenu", this.handleRightClick), e.removeEventListener("mousedown", this.handleDown), e.removeEventListener("wheel", this.handleWheel), e.removeEventListener("mouseleave", this.handleLeave), e.removeEventListener("mouseenter", this.handleEnter), document.removeEventListener("mousemove", this.handleMove), document.removeEventListener("mouseup", this.handleUp);
			}
		},
		{
			key: "handleClick",
			value: function(e) {
				var t = this;
				if (this.enabled) {
					if (this.clicks++, this.clicks === 2) return this.clicks = 0, typeof this.doubleClickTimeout == "number" && (clearTimeout(this.doubleClickTimeout), this.doubleClickTimeout = null), this.handleDoubleClick(e);
					setTimeout(function() {
						t.clicks = 0, t.doubleClickTimeout = null;
					}, this.settings.doubleClickTimeout), this.draggedEvents < this.settings.draggedEventsTolerance && this.emit("click", aa(e, this.container));
				}
			}
		},
		{
			key: "handleRightClick",
			value: function(e) {
				this.enabled && this.emit("rightClick", aa(e, this.container));
			}
		},
		{
			key: "handleDoubleClick",
			value: function(e) {
				if (this.enabled) {
					e.preventDefault(), e.stopPropagation();
					var t = aa(e, this.container);
					if (this.emit("doubleClick", t), !t.sigmaDefaultPrevented) {
						var n = this.renderer.getCamera(), r = n.getBoundedRatio(n.getState().ratio / this.settings.doubleClickZoomingRatio);
						n.animate(this.renderer.getViewportZoomedState(Y(e, this.container), r), {
							easing: "quadraticInOut",
							duration: this.settings.doubleClickZoomingDuration
						});
					}
				}
			}
		},
		{
			key: "handleDown",
			value: function(e) {
				if (this.enabled) {
					if (e.button === 0) {
						this.startCameraState = this.renderer.getCamera().getState();
						var t = Y(e, this.container), n = t.x, r = t.y;
						this.lastMouseX = n, this.lastMouseY = r, this.draggedEvents = 0, this.downStartTime = Date.now(), this.isMouseDown = !0;
					}
					this.emit("mousedown", aa(e, this.container));
				}
			}
		},
		{
			key: "handleUp",
			value: function(e) {
				var t = this;
				if (this.enabled && this.isMouseDown) {
					var n = this.renderer.getCamera();
					this.isMouseDown = !1, typeof this.movingTimeout == "number" && (clearTimeout(this.movingTimeout), this.movingTimeout = null);
					var r = Y(e, this.container), i = r.x, a = r.y, o = n.getState(), s = n.getPreviousState() || {
						x: 0,
						y: 0
					};
					this.isMoving ? n.animate({
						x: o.x + this.settings.inertiaRatio * (o.x - s.x),
						y: o.y + this.settings.inertiaRatio * (o.y - s.y)
					}, {
						duration: this.settings.inertiaDuration,
						easing: "quadraticOut"
					}) : (this.lastMouseX !== i || this.lastMouseY !== a) && n.setState({
						x: o.x,
						y: o.y
					}), this.isMoving = !1, setTimeout(function() {
						var e = t.draggedEvents > 0;
						t.draggedEvents = 0, e && t.renderer.getSetting("hideEdgesOnMove") && t.renderer.refresh();
					}, 0), this.emit("mouseup", aa(e, this.container));
				}
			}
		},
		{
			key: "handleMove",
			value: function(e) {
				var t = this;
				if (this.enabled) {
					var n = aa(e, this.container);
					if (this.emit("mousemovebody", n), (e.target === this.container || e.composedPath()[0] === this.container) && this.emit("mousemove", n), !n.sigmaDefaultPrevented && this.isMouseDown) {
						this.isMoving = !0, this.draggedEvents++, typeof this.movingTimeout == "number" && clearTimeout(this.movingTimeout), this.movingTimeout = window.setTimeout(function() {
							t.movingTimeout = null, t.isMoving = !1;
						}, this.settings.dragTimeout);
						var r = this.renderer.getCamera(), i = Y(e, this.container), a = i.x, o = i.y, s = this.renderer.viewportToFramedGraph({
							x: this.lastMouseX,
							y: this.lastMouseY
						}), c = this.renderer.viewportToFramedGraph({
							x: a,
							y: o
						}), l = s.x - c.x, u = s.y - c.y, d = r.getState(), f = d.x + l, p = d.y + u;
						r.setState({
							x: f,
							y: p
						}), this.lastMouseX = a, this.lastMouseY = o, e.preventDefault(), e.stopPropagation();
					}
				}
			}
		},
		{
			key: "handleLeave",
			value: function(e) {
				this.emit("mouseleave", aa(e, this.container));
			}
		},
		{
			key: "handleEnter",
			value: function(e) {
				this.emit("mouseenter", aa(e, this.container));
			}
		},
		{
			key: "handleWheel",
			value: function(e) {
				var t = this, n = this.renderer.getCamera();
				if (this.enabled && n.enabledZooming) {
					var r = da(e);
					if (r) {
						var i = sa(e, this.container);
						if (this.emit("wheel", i), i.sigmaDefaultPrevented) e.preventDefault(), e.stopPropagation();
						else {
							var a = n.getState().ratio, o = r > 0 ? 1 / this.settings.zoomingRatio : this.settings.zoomingRatio, s = n.getBoundedRatio(a * o), c = r > 0 ? 1 : -1, l = Date.now();
							a !== s && (e.preventDefault(), e.stopPropagation(), this.currentWheelDirection === c && this.lastWheelTriggerTime && l - this.lastWheelTriggerTime < this.settings.zoomDuration / 5 || (n.animate(this.renderer.getViewportZoomedState(Y(e, this.container), s), {
								easing: "quadraticOut",
								duration: this.settings.zoomDuration
							}, function() {
								t.currentWheelDirection = 0;
							}), this.currentWheelDirection = c, this.lastWheelTriggerTime = l));
						}
					}
				}
			}
		},
		{
			key: "setSettings",
			value: function(e) {
				this.settings = e;
			}
		}
	]);
}(fa), ha = [
	"dragTimeout",
	"inertiaDuration",
	"inertiaRatio",
	"doubleClickTimeout",
	"doubleClickZoomingRatio",
	"doubleClickZoomingDuration",
	"tapMoveTolerance"
].reduce(function(e, t) {
	return q(q({}, e), {}, K({}, t, Qi[t]));
}, {}), ga = /*#__PURE__*/ function(e) {
	function t(e, n) {
		var r;
		return H(this, t), r = W(this, t, [e, n]), K(r, "enabled", !0), K(r, "isMoving", !1), K(r, "hasMoved", !1), K(r, "touchMode", 0), K(r, "startTouchesPositions", []), K(r, "lastTouches", []), K(r, "lastTap", null), K(r, "settings", ha), r.handleStart = r.handleStart.bind(r), r.handleLeave = r.handleLeave.bind(r), r.handleMove = r.handleMove.bind(r), e.addEventListener("touchstart", r.handleStart, { capture: !1 }), e.addEventListener("touchcancel", r.handleLeave, { capture: !1 }), document.addEventListener("touchend", r.handleLeave, {
			capture: !1,
			passive: !1
		}), document.addEventListener("touchmove", r.handleMove, {
			capture: !1,
			passive: !1
		}), r;
	}
	return G(t, e), U(t, [
		{
			key: "kill",
			value: function() {
				var e = this.container;
				e.removeEventListener("touchstart", this.handleStart), e.removeEventListener("touchcancel", this.handleLeave), document.removeEventListener("touchend", this.handleLeave), document.removeEventListener("touchmove", this.handleMove);
			}
		},
		{
			key: "getDimensions",
			value: function() {
				return {
					width: this.container.offsetWidth,
					height: this.container.offsetHeight
				};
			}
		},
		{
			key: "handleStart",
			value: function(e) {
				var t = this;
				if (this.enabled) {
					e.preventDefault();
					var n = la(e.touches);
					if (this.touchMode = n.length, this.startCameraState = this.renderer.getCamera().getState(), this.startTouchesPositions = n.map(function(e) {
						return Y(e, t.container);
					}), this.touchMode === 2) {
						var r = hr(this.startTouchesPositions, 2), i = r[0], a = i.x, o = i.y, s = r[1], c = s.x, l = s.y;
						this.startTouchesAngle = Math.atan2(l - o, c - a), this.startTouchesDistance = Math.sqrt((c - a) ** 2 + (l - o) ** 2);
					}
					this.emit("touchdown", ua(e, this.lastTouches, this.container)), this.lastTouches = n, this.lastTouchesPositions = this.startTouchesPositions;
				}
			}
		},
		{
			key: "handleLeave",
			value: function(e) {
				if (this.enabled && this.startTouchesPositions.length) {
					switch (e.cancelable && e.preventDefault(), this.movingTimeout && (this.isMoving = !1, clearTimeout(this.movingTimeout)), this.touchMode) {
						case 2: if (e.touches.length === 1) {
							this.handleStart(e), e.preventDefault();
							break;
						}
						case 1:
							if (this.isMoving) {
								var t = this.renderer.getCamera(), n = t.getState(), r = t.getPreviousState() || {
									x: 0,
									y: 0
								};
								t.animate({
									x: n.x + this.settings.inertiaRatio * (n.x - r.x),
									y: n.y + this.settings.inertiaRatio * (n.y - r.y)
								}, {
									duration: this.settings.inertiaDuration,
									easing: "quadraticOut"
								});
							}
							this.hasMoved = !1, this.isMoving = !1, this.touchMode = 0;
					}
					if (this.emit("touchup", ua(e, this.lastTouches, this.container)), !e.touches.length) {
						var i = Y(this.lastTouches[0], this.container), a = this.startTouchesPositions[0], o = (i.x - a.x) ** 2 + (i.y - a.y) ** 2;
						if (!e.touches.length && o < this.settings.tapMoveTolerance ** 2) {
							if (this.lastTap && Date.now() - this.lastTap.time < this.settings.doubleClickTimeout) {
								var s = ua(e, this.lastTouches, this.container);
								if (this.emit("doubletap", s), this.lastTap = null, !s.sigmaDefaultPrevented) {
									var c = this.renderer.getCamera(), l = c.getBoundedRatio(c.getState().ratio / this.settings.doubleClickZoomingRatio);
									c.animate(this.renderer.getViewportZoomedState(i, l), {
										easing: "quadraticInOut",
										duration: this.settings.doubleClickZoomingDuration
									});
								}
							} else {
								var u = ua(e, this.lastTouches, this.container);
								this.emit("tap", u), this.lastTap = {
									time: Date.now(),
									position: u.touches[0] || u.previousTouches[0]
								};
							}
						}
					}
					this.lastTouches = la(e.touches), this.startTouchesPositions = [];
				}
			}
		},
		{
			key: "handleMove",
			value: function(e) {
				var t = this;
				if (this.enabled && this.startTouchesPositions.length) {
					e.preventDefault();
					var n = la(e.touches), r = n.map(function(e) {
						return Y(e, t.container);
					}), i = this.lastTouches;
					this.lastTouches = n, this.lastTouchesPositions = r;
					var a = ua(e, i, this.container);
					if (this.emit("touchmove", a), !a.sigmaDefaultPrevented && (this.hasMoved ||= r.some(function(e, n) {
						var r = t.startTouchesPositions[n];
						return r && (e.x !== r.x || e.y !== r.y);
					}), this.hasMoved)) {
						this.isMoving = !0, this.movingTimeout && clearTimeout(this.movingTimeout), this.movingTimeout = window.setTimeout(function() {
							t.isMoving = !1;
						}, this.settings.dragTimeout);
						var o = this.renderer.getCamera(), s = this.startCameraState, c = this.renderer.getSetting("stagePadding");
						switch (this.touchMode) {
							case 1:
								var l = this.renderer.viewportToFramedGraph((this.startTouchesPositions || [])[0]), u = l.x, d = l.y, f = this.renderer.viewportToFramedGraph(r[0]), p = f.x, m = f.y;
								o.setState({
									x: s.x + u - p,
									y: s.y + d - m
								});
								break;
							case 2:
								var h = {
									x: .5,
									y: .5,
									angle: 0,
									ratio: 1
								}, g = r[0], _ = g.x, v = g.y, y = r[1], b = y.x, x = y.y, S = Math.atan2(x - v, b - _) - this.startTouchesAngle, C = Math.hypot(x - v, b - _) / this.startTouchesDistance, w = o.getBoundedRatio(s.ratio / C);
								h.ratio = w, h.angle = s.angle + S;
								var T = this.getDimensions(), E = this.renderer.viewportToFramedGraph((this.startTouchesPositions || [])[0], { cameraState: s }), D = Math.min(T.width, T.height) - 2 * c, O = D / T.width, k = D / T.height, A = w / D, j = _ - D / 2 / O, M = v - D / 2 / k, ee = [j * Math.cos(-h.angle) - M * Math.sin(-h.angle), M * Math.cos(-h.angle) + j * Math.sin(-h.angle)];
								j = ee[0], M = ee[1], h.x = E.x - j * A, h.y = E.y + M * A, o.setState(h);
						}
					}
				}
			}
		},
		{
			key: "setSettings",
			value: function(e) {
				this.settings = e;
			}
		}
	]);
}(fa);
function _a(e) {
	if (Array.isArray(e)) return fr(e);
}
function va(e) {
	if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function ya() {
	throw TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ba(e) {
	return _a(e) || va(e) || pr(e) || ya();
}
function xa(e, t) {
	if (e == null) return {};
	var n = {};
	for (var r in e) if ({}.hasOwnProperty.call(e, r)) {
		if (t.indexOf(r) !== -1) continue;
		n[r] = e[r];
	}
	return n;
}
function Sa(e, t) {
	if (e == null) return {};
	var n, r, i = xa(e, t);
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (r = 0; r < a.length; r++) n = a[r], t.indexOf(n) === -1 && {}.propertyIsEnumerable.call(e, n) && (i[n] = e[n]);
	}
	return i;
}
var Ca = /*#__PURE__*/ function() {
	function e(t, n) {
		H(this, e), this.key = t, this.size = n;
	}
	return U(e, null, [{
		key: "compare",
		value: function(e, t) {
			return e.size > t.size ? -1 : e.size < t.size || e.key > t.key ? 1 : -1;
		}
	}]);
}(), wa = /*#__PURE__*/ function() {
	function e() {
		H(this, e), K(this, "width", 0), K(this, "height", 0), K(this, "cellSize", 0), K(this, "columns", 0), K(this, "rows", 0), K(this, "cells", {});
	}
	return U(e, [
		{
			key: "resizeAndClear",
			value: function(e, t) {
				this.width = e.width, this.height = e.height, this.cellSize = t, this.columns = Math.ceil(e.width / t), this.rows = Math.ceil(e.height / t), this.cells = {};
			}
		},
		{
			key: "getIndex",
			value: function(e) {
				var t = Math.floor(e.x / this.cellSize);
				return Math.floor(e.y / this.cellSize) * this.columns + t;
			}
		},
		{
			key: "add",
			value: function(e, t, n) {
				var r = new Ca(e, t), i = this.getIndex(n), a = this.cells[i];
				a || (a = [], this.cells[i] = a), a.push(r);
			}
		},
		{
			key: "organize",
			value: function() {
				for (var e in this.cells) this.cells[e].sort(Ca.compare);
			}
		},
		{
			key: "getLabelsToDisplay",
			value: function(e, t) {
				var n = this.cellSize * this.cellSize, r = n / e / e * t / n, i = Math.ceil(r), a = [];
				for (var o in this.cells) for (var s = this.cells[o], c = 0; c < Math.min(i, s.length); c++) a.push(s[c].key);
				return a;
			}
		}
	]);
}();
function Ta(e) {
	var t = e.graph, n = e.hoveredNode, r = e.highlightedNodes, i = e.displayedNodeLabels, a = [];
	return t.forEachEdge(function(e, t, o, s) {
		(o === n || s === n || r.has(o) || r.has(s) || i.has(o) && i.has(s)) && a.push(e);
	}), a;
}
var Ea = 150, Da = 50, Oa = Object.prototype.hasOwnProperty;
function ka(e, t, n) {
	if (!Oa.call(n, "x") || !Oa.call(n, "y")) throw Error(`Sigma: could not find a valid position (x, y) for node "${t}". All your nodes must have a number "x" and "y". Maybe your forgot to apply a layout or your "nodeReducer" is not returning the correct data?`);
	return n.color ||= e.defaultNodeColor, !n.label && n.label !== "" && (n.label = null), n.label = n.label !== void 0 && n.label !== null ? "" + n.label : null, n.size ||= 2, Oa.call(n, "hidden") || (n.hidden = !1), Oa.call(n, "highlighted") || (n.highlighted = !1), Oa.call(n, "forceLabel") || (n.forceLabel = !1), n.type && n.type !== "" || (n.type = e.defaultNodeType), n.zIndex ||= 0, n;
}
function Aa(e, t, n) {
	return n.color ||= e.defaultEdgeColor, n.label ||= "", n.size ||= .5, Oa.call(n, "hidden") || (n.hidden = !1), Oa.call(n, "forceLabel") || (n.forceLabel = !1), n.type && n.type !== "" || (n.type = e.defaultEdgeType), n.zIndex ||= 0, n;
}
var ja = /* @__PURE__ */ function(e) {
	function t(e, n) {
		var r, i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
		if (H(this, t), r = W(this, t), K(r, "elements", {}), K(r, "canvasContexts", {}), K(r, "webGLContexts", {}), K(r, "pickingLayers", /* @__PURE__ */ new Set()), K(r, "textures", {}), K(r, "frameBuffers", {}), K(r, "activeListeners", {}), K(r, "labelGrid", new wa()), K(r, "nodeDataCache", {}), K(r, "edgeDataCache", {}), K(r, "nodeProgramIndex", {}), K(r, "edgeProgramIndex", {}), K(r, "nodesWithForcedLabels", /* @__PURE__ */ new Set()), K(r, "edgesWithForcedLabels", /* @__PURE__ */ new Set()), K(r, "nodeExtent", {
			x: [0, 1],
			y: [0, 1]
		}), K(r, "nodeZExtent", [Infinity, -Infinity]), K(r, "edgeZExtent", [Infinity, -Infinity]), K(r, "matrix", J()), K(r, "invMatrix", J()), K(r, "correctionRatio", 1), K(r, "customBBox", null), K(r, "normalizationFunction", Ji({
			x: [0, 1],
			y: [0, 1]
		})), K(r, "graphToViewportRatio", 1), K(r, "itemIDsIndex", {}), K(r, "nodeIndices", {}), K(r, "edgeIndices", {}), K(r, "width", 0), K(r, "height", 0), K(r, "pixelRatio", Ki()), K(r, "pickingDownSizingRatio", 2 * r.pixelRatio), K(r, "displayedNodeLabels", /* @__PURE__ */ new Set()), K(r, "displayedEdgeLabels", /* @__PURE__ */ new Set()), K(r, "highlightedNodes", /* @__PURE__ */ new Set()), K(r, "hoveredNode", null), K(r, "hoveredEdge", null), K(r, "renderFrame", null), K(r, "renderHighlightedNodesFrame", null), K(r, "needToProcess", !1), K(r, "checkEdgesEventsFrame", null), K(r, "nodePrograms", {}), K(r, "nodeHoverPrograms", {}), K(r, "edgePrograms", {}), r.settings = na(i), ta(r.settings), Wi(e), !(n instanceof HTMLElement)) throw Error("Sigma: container should be an html element.");
		for (var a in r.graph = e, r.container = n, r.createWebGLContext("edges", { picking: i.enableEdgeEvents }), r.createCanvasContext("edgeLabels"), r.createWebGLContext("nodes", { picking: !0 }), r.createCanvasContext("labels"), r.createCanvasContext("hovers"), r.createWebGLContext("hoverNodes"), r.createCanvasContext("mouse", { style: {
			touchAction: "none",
			userSelect: "none"
		} }), r.resize(), r.settings.nodeProgramClasses) r.registerNodeProgram(a, r.settings.nodeProgramClasses[a], r.settings.nodeHoverProgramClasses[a]);
		for (var o in r.settings.edgeProgramClasses) r.registerEdgeProgram(o, r.settings.edgeProgramClasses[o]);
		return r.camera = new ia(), r.bindCameraHandlers(), r.mouseCaptor = new ma(r.elements.mouse, r), r.mouseCaptor.setSettings(r.settings), r.touchCaptor = new ga(r.elements.mouse, r), r.touchCaptor.setSettings(r.settings), r.bindEventHandlers(), r.bindGraphHandlers(), r.handleSettingsUpdate(), r.refresh(), r;
	}
	return G(t, e), U(t, [
		{
			key: "registerNodeProgram",
			value: function(e, t, n) {
				return this.nodePrograms[e] && this.nodePrograms[e].kill(), this.nodeHoverPrograms[e] && this.nodeHoverPrograms[e].kill(), this.nodePrograms[e] = new t(this.webGLContexts.nodes, this.frameBuffers.nodes, this), this.nodeHoverPrograms[e] = new (n || t)(this.webGLContexts.hoverNodes, null, this), this;
			}
		},
		{
			key: "registerEdgeProgram",
			value: function(e, t) {
				return this.edgePrograms[e] && this.edgePrograms[e].kill(), this.edgePrograms[e] = new t(this.webGLContexts.edges, this.frameBuffers.edges, this), this;
			}
		},
		{
			key: "unregisterNodeProgram",
			value: function(e) {
				if (this.nodePrograms[e]) {
					var t = this.nodePrograms, n = t[e], r = Sa(t, [e].map(rr));
					n.kill(), this.nodePrograms = r;
				}
				if (this.nodeHoverPrograms[e]) {
					var i = this.nodeHoverPrograms, a = i[e], o = Sa(i, [e].map(rr));
					a.kill(), this.nodePrograms = o;
				}
				return this;
			}
		},
		{
			key: "unregisterEdgeProgram",
			value: function(e) {
				if (this.edgePrograms[e]) {
					var t = this.edgePrograms, n = t[e], r = Sa(t, [e].map(rr));
					n.kill(), this.edgePrograms = r;
				}
				return this;
			}
		},
		{
			key: "resetWebGLTexture",
			value: function(e) {
				var t = this.webGLContexts[e], n = this.frameBuffers[e], r = this.textures[e];
				r && t.deleteTexture(r);
				var i = t.createTexture();
				return t.bindFramebuffer(t.FRAMEBUFFER, n), t.bindTexture(t.TEXTURE_2D, i), t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, this.width, this.height, 0, t.RGBA, t.UNSIGNED_BYTE, null), t.framebufferTexture2D(t.FRAMEBUFFER, t.COLOR_ATTACHMENT0, t.TEXTURE_2D, i, 0), this.textures[e] = i, this;
			}
		},
		{
			key: "bindCameraHandlers",
			value: function() {
				var e = this;
				return this.activeListeners.camera = function() {
					e.scheduleRender();
				}, this.camera.on("updated", this.activeListeners.camera), this;
			}
		},
		{
			key: "unbindCameraHandlers",
			value: function() {
				return this.camera.removeListener("updated", this.activeListeners.camera), this;
			}
		},
		{
			key: "getNodeAtPosition",
			value: function(e) {
				var t = e.x, n = e.y, r = jr(this.webGLContexts.nodes, this.frameBuffers.nodes, t, n, this.pixelRatio, this.pickingDownSizingRatio), i = Ar.apply(void 0, ba(r)), a = this.itemIDsIndex[i];
				return a && a.type === "node" ? a.id : null;
			}
		},
		{
			key: "bindEventHandlers",
			value: function() {
				var e = this;
				this.activeListeners.handleResize = function() {
					e.scheduleRefresh();
				}, window.addEventListener("resize", this.activeListeners.handleResize), this.activeListeners.handleMove = function(t) {
					var n = oa(t), r = {
						event: n,
						preventSigmaDefault: function() {
							n.preventSigmaDefault();
						}
					}, i = e.getNodeAtPosition(n);
					if (i && e.hoveredNode !== i && !e.nodeDataCache[i].hidden) e.hoveredNode && e.emit("leaveNode", q(q({}, r), {}, { node: e.hoveredNode })), e.hoveredNode = i, e.emit("enterNode", q(q({}, r), {}, { node: i })), e.scheduleHighlightedNodesRender();
					else if (e.hoveredNode && e.getNodeAtPosition(n) !== e.hoveredNode) {
						var a = e.hoveredNode;
						e.hoveredNode = null, e.emit("leaveNode", q(q({}, r), {}, { node: a })), e.scheduleHighlightedNodesRender();
					} else if (e.settings.enableEdgeEvents) {
						var o = e.hoveredNode ? null : e.getEdgeAtPoint(r.event.x, r.event.y);
						o !== e.hoveredEdge && (e.hoveredEdge && e.emit("leaveEdge", q(q({}, r), {}, { edge: e.hoveredEdge })), o && e.emit("enterEdge", q(q({}, r), {}, { edge: o })), e.hoveredEdge = o);
					}
				}, this.activeListeners.handleMoveBody = function(t) {
					var n = oa(t);
					e.emit("moveBody", {
						event: n,
						preventSigmaDefault: function() {
							n.preventSigmaDefault();
						}
					});
				}, this.activeListeners.handleLeave = function(t) {
					var n = oa(t), r = {
						event: n,
						preventSigmaDefault: function() {
							n.preventSigmaDefault();
						}
					};
					e.hoveredNode && (e.emit("leaveNode", q(q({}, r), {}, { node: e.hoveredNode })), e.scheduleHighlightedNodesRender()), e.settings.enableEdgeEvents && e.hoveredEdge && (e.emit("leaveEdge", q(q({}, r), {}, { edge: e.hoveredEdge })), e.scheduleHighlightedNodesRender()), e.emit("leaveStage", q({}, r));
				}, this.activeListeners.handleEnter = function(t) {
					var n = oa(t), r = {
						event: n,
						preventSigmaDefault: function() {
							n.preventSigmaDefault();
						}
					};
					e.emit("enterStage", q({}, r));
				};
				var t = function(t) {
					return function(n) {
						var r = oa(n), i = {
							event: r,
							preventSigmaDefault: function() {
								r.preventSigmaDefault();
							}
						}, a = e.getNodeAtPosition(r);
						if (a) return e.emit(`${t}Node`, q(q({}, i), {}, { node: a }));
						if (e.settings.enableEdgeEvents) {
							var o = e.getEdgeAtPoint(r.x, r.y);
							if (o) return e.emit(`${t}Edge`, q(q({}, i), {}, { edge: o }));
						}
						return e.emit(`${t}Stage`, i);
					};
				};
				return this.activeListeners.handleClick = t("click"), this.activeListeners.handleRightClick = t("rightClick"), this.activeListeners.handleDoubleClick = t("doubleClick"), this.activeListeners.handleWheel = t("wheel"), this.activeListeners.handleDown = t("down"), this.activeListeners.handleUp = t("up"), this.mouseCaptor.on("mousemove", this.activeListeners.handleMove), this.mouseCaptor.on("mousemovebody", this.activeListeners.handleMoveBody), this.mouseCaptor.on("click", this.activeListeners.handleClick), this.mouseCaptor.on("rightClick", this.activeListeners.handleRightClick), this.mouseCaptor.on("doubleClick", this.activeListeners.handleDoubleClick), this.mouseCaptor.on("wheel", this.activeListeners.handleWheel), this.mouseCaptor.on("mousedown", this.activeListeners.handleDown), this.mouseCaptor.on("mouseup", this.activeListeners.handleUp), this.mouseCaptor.on("mouseleave", this.activeListeners.handleLeave), this.mouseCaptor.on("mouseenter", this.activeListeners.handleEnter), this.touchCaptor.on("touchdown", this.activeListeners.handleDown), this.touchCaptor.on("touchdown", this.activeListeners.handleMove), this.touchCaptor.on("touchup", this.activeListeners.handleUp), this.touchCaptor.on("touchmove", this.activeListeners.handleMove), this.touchCaptor.on("tap", this.activeListeners.handleClick), this.touchCaptor.on("doubletap", this.activeListeners.handleDoubleClick), this.touchCaptor.on("touchmove", this.activeListeners.handleMoveBody), this;
			}
		},
		{
			key: "bindGraphHandlers",
			value: function() {
				var e = this, t = this.graph, n = /* @__PURE__ */ new Set([
					"x",
					"y",
					"zIndex",
					"type"
				]);
				return this.activeListeners.eachNodeAttributesUpdatedGraphUpdate = function(r) {
					var i = r.hints?.attributes;
					e.graph.forEachNode(function(t) {
						return e.updateNode(t);
					});
					var a = !i || i.some(function(e) {
						return n.has(e);
					});
					e.refresh({
						partialGraph: { nodes: t.nodes() },
						skipIndexation: !a,
						schedule: !0
					});
				}, this.activeListeners.eachEdgeAttributesUpdatedGraphUpdate = function(n) {
					var r = n.hints?.attributes;
					e.graph.forEachEdge(function(t) {
						return e.updateEdge(t);
					});
					var i = r && ["zIndex", "type"].some(function(e) {
						return r?.includes(e);
					});
					e.refresh({
						partialGraph: { edges: t.edges() },
						skipIndexation: !i,
						schedule: !0
					});
				}, this.activeListeners.addNodeGraphUpdate = function(t) {
					var n = t.key;
					e.addNode(n), e.refresh({
						partialGraph: { nodes: [n] },
						skipIndexation: !1,
						schedule: !0
					});
				}, this.activeListeners.updateNodeGraphUpdate = function(t) {
					var n = t.key;
					e.refresh({
						partialGraph: { nodes: [n] },
						skipIndexation: !1,
						schedule: !0
					});
				}, this.activeListeners.dropNodeGraphUpdate = function(t) {
					var n = t.key;
					e.removeNode(n), e.refresh({ schedule: !0 });
				}, this.activeListeners.addEdgeGraphUpdate = function(t) {
					var n = t.key;
					e.addEdge(n), e.refresh({
						partialGraph: { edges: [n] },
						schedule: !0
					});
				}, this.activeListeners.updateEdgeGraphUpdate = function(t) {
					var n = t.key;
					e.refresh({
						partialGraph: { edges: [n] },
						skipIndexation: !1,
						schedule: !0
					});
				}, this.activeListeners.dropEdgeGraphUpdate = function(t) {
					var n = t.key;
					e.removeEdge(n), e.refresh({ schedule: !0 });
				}, this.activeListeners.clearEdgesGraphUpdate = function() {
					e.clearEdgeState(), e.clearEdgeIndices(), e.refresh({ schedule: !0 });
				}, this.activeListeners.clearGraphUpdate = function() {
					e.clearEdgeState(), e.clearNodeState(), e.clearEdgeIndices(), e.clearNodeIndices(), e.refresh({ schedule: !0 });
				}, t.on("nodeAdded", this.activeListeners.addNodeGraphUpdate), t.on("nodeDropped", this.activeListeners.dropNodeGraphUpdate), t.on("nodeAttributesUpdated", this.activeListeners.updateNodeGraphUpdate), t.on("eachNodeAttributesUpdated", this.activeListeners.eachNodeAttributesUpdatedGraphUpdate), t.on("edgeAdded", this.activeListeners.addEdgeGraphUpdate), t.on("edgeDropped", this.activeListeners.dropEdgeGraphUpdate), t.on("edgeAttributesUpdated", this.activeListeners.updateEdgeGraphUpdate), t.on("eachEdgeAttributesUpdated", this.activeListeners.eachEdgeAttributesUpdatedGraphUpdate), t.on("edgesCleared", this.activeListeners.clearEdgesGraphUpdate), t.on("cleared", this.activeListeners.clearGraphUpdate), this;
			}
		},
		{
			key: "unbindGraphHandlers",
			value: function() {
				var e = this.graph;
				e.removeListener("nodeAdded", this.activeListeners.addNodeGraphUpdate), e.removeListener("nodeDropped", this.activeListeners.dropNodeGraphUpdate), e.removeListener("nodeAttributesUpdated", this.activeListeners.updateNodeGraphUpdate), e.removeListener("eachNodeAttributesUpdated", this.activeListeners.eachNodeAttributesUpdatedGraphUpdate), e.removeListener("edgeAdded", this.activeListeners.addEdgeGraphUpdate), e.removeListener("edgeDropped", this.activeListeners.dropEdgeGraphUpdate), e.removeListener("edgeAttributesUpdated", this.activeListeners.updateEdgeGraphUpdate), e.removeListener("eachEdgeAttributesUpdated", this.activeListeners.eachEdgeAttributesUpdatedGraphUpdate), e.removeListener("edgesCleared", this.activeListeners.clearEdgesGraphUpdate), e.removeListener("cleared", this.activeListeners.clearGraphUpdate);
			}
		},
		{
			key: "getEdgeAtPoint",
			value: function(e, t) {
				var n = jr(this.webGLContexts.edges, this.frameBuffers.edges, e, t, this.pixelRatio, this.pickingDownSizingRatio), r = Ar.apply(void 0, ba(n)), i = this.itemIDsIndex[r];
				return i && i.type === "edge" ? i.id : null;
			}
		},
		{
			key: "process",
			value: function() {
				var e = this;
				this.emit("beforeProcess");
				var t = this.graph, n = this.settings, r = this.getDimensions();
				if (this.nodeExtent = Ui(this.graph), !this.settings.autoRescale) {
					var i = r.width, a = r.height, o = this.nodeExtent, s = o.x, c = o.y;
					this.nodeExtent = {
						x: [(s[0] + s[1]) / 2 - i / 2, (s[0] + s[1]) / 2 + i / 2],
						y: [(c[0] + c[1]) / 2 - a / 2, (c[0] + c[1]) / 2 + a / 2]
					};
				}
				this.normalizationFunction = Ji(this.customBBox || this.nodeExtent);
				var l = Vi(new ia().getState(), r, this.getGraphDimensions(), this.getStagePadding());
				this.labelGrid.resizeAndClear(r, n.labelGridCellSize);
				for (var u = {}, d = {}, f = {}, p = {}, m = 1, h = t.nodes(), g = 0, _ = h.length; g < _; g++) {
					var v = h[g], y = this.nodeDataCache[v], b = t.getNodeAttributes(v);
					y.x = b.x, y.y = b.y, this.normalizationFunction.applyTo(y), typeof y.label == "string" && !y.hidden && this.labelGrid.add(v, y.size, this.framedGraphToViewport(y, { matrix: l })), u[y.type] = (u[y.type] || 0) + 1;
				}
				for (var x in this.labelGrid.organize(), this.nodePrograms) {
					if (!Oa.call(this.nodePrograms, x)) throw Error(`Sigma: could not find a suitable program for node type "${x}"!`);
					this.nodePrograms[x].reallocate(u[x] || 0), u[x] = 0;
				}
				this.settings.zIndex && this.nodeZExtent[0] !== this.nodeZExtent[1] && (h = qi(this.nodeZExtent, function(t) {
					return e.nodeDataCache[t].zIndex;
				}, h));
				for (var S = 0, C = h.length; S < C; S++) {
					var w = h[S];
					d[w] = m, p[d[w]] = {
						type: "node",
						id: w
					}, m++;
					var T = this.nodeDataCache[w];
					this.addNodeToProgram(w, d[w], u[T.type]++);
				}
				for (var E = {}, D = t.edges(), O = 0, k = D.length; O < k; O++) {
					var A = D[O], j = this.edgeDataCache[A];
					E[j.type] = (E[j.type] || 0) + 1;
				}
				for (var M in this.settings.zIndex && this.edgeZExtent[0] !== this.edgeZExtent[1] && (D = qi(this.edgeZExtent, function(t) {
					return e.edgeDataCache[t].zIndex;
				}, D)), this.edgePrograms) {
					if (!Oa.call(this.edgePrograms, M)) throw Error(`Sigma: could not find a suitable program for edge type "${M}"!`);
					this.edgePrograms[M].reallocate(E[M] || 0), E[M] = 0;
				}
				for (var ee = 0, te = D.length; ee < te; ee++) {
					var ne = D[ee];
					f[ne] = m, p[f[ne]] = {
						type: "edge",
						id: ne
					}, m++;
					var N = this.edgeDataCache[ne];
					this.addEdgeToProgram(ne, f[ne], E[N.type]++);
				}
				return this.itemIDsIndex = p, this.nodeIndices = d, this.edgeIndices = f, this.emit("afterProcess"), this;
			}
		},
		{
			key: "handleSettingsUpdate",
			value: function(e) {
				var t = this, n = this.settings;
				if (this.camera.minRatio = n.minCameraRatio, this.camera.maxRatio = n.maxCameraRatio, this.camera.enabledZooming = n.enableCameraZooming, this.camera.enabledPanning = n.enableCameraPanning, this.camera.enabledRotation = n.enableCameraRotation, n.cameraPanBoundaries ? this.camera.clean = function(e) {
					return t.cleanCameraState(e, n.cameraPanBoundaries && Yi(n.cameraPanBoundaries) === "object" ? n.cameraPanBoundaries : {});
				} : this.camera.clean = null, this.camera.setState(this.camera.validateState(this.camera.getState())), e) {
					if (e.edgeProgramClasses !== n.edgeProgramClasses) {
						for (var r in n.edgeProgramClasses) n.edgeProgramClasses[r] !== e.edgeProgramClasses[r] && this.registerEdgeProgram(r, n.edgeProgramClasses[r]);
						for (var i in e.edgeProgramClasses) n.edgeProgramClasses[i] || this.unregisterEdgeProgram(i);
					}
					if (e.nodeProgramClasses !== n.nodeProgramClasses || e.nodeHoverProgramClasses !== n.nodeHoverProgramClasses) {
						for (var a in n.nodeProgramClasses) (n.nodeProgramClasses[a] !== e.nodeProgramClasses[a] || n.nodeHoverProgramClasses[a] !== e.nodeHoverProgramClasses[a]) && this.registerNodeProgram(a, n.nodeProgramClasses[a], n.nodeHoverProgramClasses[a]);
						for (var o in e.nodeProgramClasses) n.nodeProgramClasses[o] || this.unregisterNodeProgram(o);
					}
				}
				return this.mouseCaptor.setSettings(this.settings), this.touchCaptor.setSettings(this.settings), this;
			}
		},
		{
			key: "cleanCameraState",
			value: function(e) {
				var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = t.tolerance, r = n === void 0 ? 0 : n, i = t.boundaries, a = q({}, e), o = i || this.nodeExtent, s = hr(o.x, 2), c = s[0], l = s[1], u = hr(o.y, 2), d = u[0], f = u[1], p = [
					this.graphToViewport({
						x: c,
						y: d
					}, { cameraState: e }),
					this.graphToViewport({
						x: l,
						y: d
					}, { cameraState: e }),
					this.graphToViewport({
						x: c,
						y: f
					}, { cameraState: e }),
					this.graphToViewport({
						x: l,
						y: f
					}, { cameraState: e })
				], m = Infinity, h = -Infinity, g = Infinity, _ = -Infinity;
				p.forEach(function(e) {
					var t = e.x, n = e.y;
					m = Math.min(m, t), h = Math.max(h, t), g = Math.min(g, n), _ = Math.max(_, n);
				});
				var v = h - m, y = _ - g, b = this.getDimensions(), x = b.width, S = b.height, C = 0, w = 0;
				if (v >= x ? h < x - r ? C = h - (x - r) : m > r && (C = m - r) : h > x + r ? C = h - (x + r) : m < -r && (C = m + r), y >= S ? _ < S - r ? w = _ - (S - r) : g > r && (w = g - r) : _ > S + r ? w = _ - (S + r) : g < -r && (w = g + r), C || w) {
					var T = this.viewportToFramedGraph({
						x: 0,
						y: 0
					}, { cameraState: e }), E = this.viewportToFramedGraph({
						x: C,
						y: w
					}, { cameraState: e });
					C = E.x - T.x, w = E.y - T.y, a.x += C, a.y += w;
				}
				return a;
			}
		},
		{
			key: "renderLabels",
			value: function() {
				if (!this.settings.renderLabels) return this;
				var e = this.camera.getState(), t = this.labelGrid.getLabelsToDisplay(e.ratio, this.settings.labelDensity);
				Xi(t, this.nodesWithForcedLabels), this.displayedNodeLabels = /* @__PURE__ */ new Set();
				for (var n = this.canvasContexts.labels, r = 0, i = t.length; r < i; r++) {
					var a = t[r], o = this.nodeDataCache[a];
					if (!this.displayedNodeLabels.has(a) && !o.hidden) {
						var s = this.framedGraphToViewport(o), c = s.x, l = s.y, u = this.scaleSize(o.size);
						if (!(!o.forceLabel && u < this.settings.labelRenderedSizeThreshold) && !(c < -Ea || c > this.width + Ea || l < -Da || l > this.height + Da)) {
							this.displayedNodeLabels.add(a);
							var d = this.settings.defaultDrawNodeLabel;
							(this.nodePrograms[o.type]?.drawLabel || d)(n, q(q({ key: a }, o), {}, {
								size: u,
								x: c,
								y: l
							}), this.settings);
						}
					}
				}
				return this;
			}
		},
		{
			key: "renderEdgeLabels",
			value: function() {
				if (!this.settings.renderEdgeLabels) return this;
				var e = this.canvasContexts.edgeLabels;
				e.clearRect(0, 0, this.width, this.height);
				var t = Ta({
					graph: this.graph,
					hoveredNode: this.hoveredNode,
					displayedNodeLabels: this.displayedNodeLabels,
					highlightedNodes: this.highlightedNodes
				});
				Xi(t, this.edgesWithForcedLabels);
				for (var n = /* @__PURE__ */ new Set(), r = 0, i = t.length; r < i; r++) {
					var a = t[r], o = this.graph.extremities(a), s = this.nodeDataCache[o[0]], c = this.nodeDataCache[o[1]], l = this.edgeDataCache[a];
					if (!n.has(a) && !(l.hidden || s.hidden || c.hidden)) {
						var u = this.settings.defaultDrawEdgeLabel;
						(this.edgePrograms[l.type]?.drawLabel || u)(e, q(q({ key: a }, l), {}, { size: this.scaleSize(l.size) }), q(q(q({ key: o[0] }, s), this.framedGraphToViewport(s)), {}, { size: this.scaleSize(s.size) }), q(q(q({ key: o[1] }, c), this.framedGraphToViewport(c)), {}, { size: this.scaleSize(c.size) }), this.settings), n.add(a);
					}
				}
				return this.displayedEdgeLabels = n, this;
			}
		},
		{
			key: "renderHighlightedNodes",
			value: function() {
				var e = this, t = this.canvasContexts.hovers;
				t.clearRect(0, 0, this.width, this.height);
				var n = function(n) {
					var r = e.nodeDataCache[n], i = e.framedGraphToViewport(r), a = i.x, o = i.y, s = e.scaleSize(r.size), c = e.settings.defaultDrawNodeHover;
					(e.nodePrograms[r.type]?.drawHover || c)(t, q(q({ key: n }, r), {}, {
						size: s,
						x: a,
						y: o
					}), e.settings);
				}, r = [];
				this.hoveredNode && !this.nodeDataCache[this.hoveredNode].hidden && r.push(this.hoveredNode), this.highlightedNodes.forEach(function(t) {
					t !== e.hoveredNode && r.push(t);
				}), r.forEach(function(e) {
					return n(e);
				});
				var i = {};
				for (var a in r.forEach(function(t) {
					var n = e.nodeDataCache[t].type;
					i[n] = (i[n] || 0) + 1;
				}), this.nodeHoverPrograms) this.nodeHoverPrograms[a].reallocate(i[a] || 0), i[a] = 0;
				r.forEach(function(t) {
					var n = e.nodeDataCache[t];
					e.nodeHoverPrograms[n.type].process(0, i[n.type]++, n);
				}), this.webGLContexts.hoverNodes.clear(this.webGLContexts.hoverNodes.COLOR_BUFFER_BIT);
				var o = this.getRenderParams();
				for (var s in this.nodeHoverPrograms) this.nodeHoverPrograms[s].render(o);
			}
		},
		{
			key: "scheduleHighlightedNodesRender",
			value: function() {
				var e = this;
				this.renderHighlightedNodesFrame || this.renderFrame || (this.renderHighlightedNodesFrame = requestAnimationFrame(function() {
					e.renderHighlightedNodesFrame = null, e.renderHighlightedNodes(), e.renderEdgeLabels();
				}));
			}
		},
		{
			key: "render",
			value: function() {
				var e = this;
				this.emit("beforeRender");
				var t = function() {
					return e.emit("afterRender"), e;
				};
				if (this.renderFrame &&= (cancelAnimationFrame(this.renderFrame), null), this.resize(), this.needToProcess && this.process(), this.needToProcess = !1, this.clear(), this.pickingLayers.forEach(function(t) {
					return e.resetWebGLTexture(t);
				}), !this.graph.order) return t();
				var n = this.mouseCaptor, r = this.camera.isAnimated() || n.isMoving || n.draggedEvents || n.currentWheelDirection, i = this.camera.getState(), a = this.getDimensions(), o = this.getGraphDimensions(), s = this.getStagePadding();
				this.matrix = Vi(i, a, o, s), this.invMatrix = Vi(i, a, o, s, !0), this.correctionRatio = Hi(this.matrix, i, a), this.graphToViewportRatio = this.getGraphToViewportRatio();
				var c = this.getRenderParams();
				for (var l in this.nodePrograms) this.nodePrograms[l].render(c);
				if (!this.settings.hideEdgesOnMove || !r) for (var u in this.edgePrograms) this.edgePrograms[u].render(c);
				return this.settings.hideLabelsOnMove && r || (this.renderLabels(), this.renderEdgeLabels(), this.renderHighlightedNodes()), t();
			}
		},
		{
			key: "addNode",
			value: function(e) {
				var t = Object.assign({}, this.graph.getNodeAttributes(e));
				this.settings.nodeReducer && (t = this.settings.nodeReducer(e, t));
				var n = ka(this.settings, e, t);
				this.nodeDataCache[e] = n, this.nodesWithForcedLabels.delete(e), n.forceLabel && !n.hidden && this.nodesWithForcedLabels.add(e), this.highlightedNodes.delete(e), n.highlighted && !n.hidden && this.highlightedNodes.add(e), this.settings.zIndex && (n.zIndex < this.nodeZExtent[0] && (this.nodeZExtent[0] = n.zIndex), n.zIndex > this.nodeZExtent[1] && (this.nodeZExtent[1] = n.zIndex));
			}
		},
		{
			key: "updateNode",
			value: function(e) {
				this.addNode(e);
				var t = this.nodeDataCache[e];
				this.normalizationFunction.applyTo(t);
			}
		},
		{
			key: "removeNode",
			value: function(e) {
				delete this.nodeDataCache[e], delete this.nodeProgramIndex[e], this.highlightedNodes.delete(e), this.hoveredNode === e && (this.hoveredNode = null), this.nodesWithForcedLabels.delete(e);
			}
		},
		{
			key: "addEdge",
			value: function(e) {
				var t = Object.assign({}, this.graph.getEdgeAttributes(e));
				this.settings.edgeReducer && (t = this.settings.edgeReducer(e, t));
				var n = Aa(this.settings, e, t);
				this.edgeDataCache[e] = n, this.edgesWithForcedLabels.delete(e), n.forceLabel && !n.hidden && this.edgesWithForcedLabels.add(e), this.settings.zIndex && (n.zIndex < this.edgeZExtent[0] && (this.edgeZExtent[0] = n.zIndex), n.zIndex > this.edgeZExtent[1] && (this.edgeZExtent[1] = n.zIndex));
			}
		},
		{
			key: "updateEdge",
			value: function(e) {
				this.addEdge(e);
			}
		},
		{
			key: "removeEdge",
			value: function(e) {
				delete this.edgeDataCache[e], delete this.edgeProgramIndex[e], this.hoveredEdge === e && (this.hoveredEdge = null), this.edgesWithForcedLabels.delete(e);
			}
		},
		{
			key: "clearNodeIndices",
			value: function() {
				this.labelGrid = new wa(), this.nodeExtent = {
					x: [0, 1],
					y: [0, 1]
				}, this.nodeDataCache = {}, this.edgeProgramIndex = {}, this.nodesWithForcedLabels = /* @__PURE__ */ new Set(), this.nodeZExtent = [Infinity, -Infinity], this.highlightedNodes = /* @__PURE__ */ new Set();
			}
		},
		{
			key: "clearEdgeIndices",
			value: function() {
				this.edgeDataCache = {}, this.edgeProgramIndex = {}, this.edgesWithForcedLabels = /* @__PURE__ */ new Set(), this.edgeZExtent = [Infinity, -Infinity];
			}
		},
		{
			key: "clearIndices",
			value: function() {
				this.clearEdgeIndices(), this.clearNodeIndices();
			}
		},
		{
			key: "clearNodeState",
			value: function() {
				this.displayedNodeLabels = /* @__PURE__ */ new Set(), this.highlightedNodes = /* @__PURE__ */ new Set(), this.hoveredNode = null;
			}
		},
		{
			key: "clearEdgeState",
			value: function() {
				this.displayedEdgeLabels = /* @__PURE__ */ new Set(), this.highlightedNodes = /* @__PURE__ */ new Set(), this.hoveredEdge = null;
			}
		},
		{
			key: "clearState",
			value: function() {
				this.clearEdgeState(), this.clearNodeState();
			}
		},
		{
			key: "addNodeToProgram",
			value: function(e, t, n) {
				var r = this.nodeDataCache[e], i = this.nodePrograms[r.type];
				if (!i) throw Error(`Sigma: could not find a suitable program for node type "${r.type}"!`);
				i.process(t, n, r), this.nodeProgramIndex[e] = n;
			}
		},
		{
			key: "addEdgeToProgram",
			value: function(e, t, n) {
				var r = this.edgeDataCache[e], i = this.edgePrograms[r.type];
				if (!i) throw Error(`Sigma: could not find a suitable program for edge type "${r.type}"!`);
				var a = this.graph.extremities(e), o = this.nodeDataCache[a[0]], s = this.nodeDataCache[a[1]];
				i.process(t, n, o, s, r), this.edgeProgramIndex[e] = n;
			}
		},
		{
			key: "getRenderParams",
			value: function() {
				return {
					matrix: this.matrix,
					invMatrix: this.invMatrix,
					width: this.width,
					height: this.height,
					pixelRatio: this.pixelRatio,
					zoomRatio: this.camera.ratio,
					cameraAngle: this.camera.angle,
					sizeRatio: 1 / this.scaleSize(),
					correctionRatio: this.correctionRatio,
					downSizingRatio: this.pickingDownSizingRatio,
					minEdgeThickness: this.settings.minEdgeThickness,
					antiAliasingFeather: this.settings.antiAliasingFeather
				};
			}
		},
		{
			key: "getStagePadding",
			value: function() {
				var e = this.settings, t = e.stagePadding;
				return e.autoRescale && t || 0;
			}
		},
		{
			key: "createLayer",
			value: function(e, t) {
				var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
				if (this.elements[e]) throw Error(`Sigma: a layer named "${e}" already exists`);
				var r = Gi(t, { position: "absolute" }, { class: `sigma-${e}` });
				return n.style && Object.assign(r.style, n.style), this.elements[e] = r, "beforeLayer" in n && n.beforeLayer ? this.elements[n.beforeLayer].before(r) : "afterLayer" in n && n.afterLayer ? this.elements[n.afterLayer].after(r) : this.container.appendChild(r), r;
			}
		},
		{
			key: "createCanvas",
			value: function(e) {
				var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
				return this.createLayer(e, "canvas", t);
			}
		},
		{
			key: "createCanvasContext",
			value: function(e) {
				var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = this.createCanvas(e, t), r = {
					preserveDrawingBuffer: !1,
					antialias: !1
				};
				return this.canvasContexts[e] = n.getContext("2d", r), this;
			}
		},
		{
			key: "createWebGLContext",
			value: function(e) {
				var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = t?.canvas || this.createCanvas(e, t);
				t.hidden && n.remove();
				var r = q({
					preserveDrawingBuffer: !1,
					antialias: !1
				}, t), i = n.getContext("webgl2", r);
				i ||= n.getContext("webgl", r), i ||= n.getContext("experimental-webgl", r);
				var a = i;
				if (this.webGLContexts[e] = a, a.blendFunc(a.ONE, a.ONE_MINUS_SRC_ALPHA), t.picking) {
					this.pickingLayers.add(e);
					var o = a.createFramebuffer();
					if (!o) throw Error(`Sigma: cannot create a new frame buffer for layer ${e}`);
					this.frameBuffers[e] = o;
				}
				return a;
			}
		},
		{
			key: "killLayer",
			value: function(e) {
				var t = this.elements[e];
				if (!t) throw Error(`Sigma: cannot kill layer ${e}, which does not exist`);
				if (this.webGLContexts[e]) {
					var n;
					(n = this.webGLContexts[e].getExtension("WEBGL_lose_context")) == null || n.loseContext(), delete this.webGLContexts[e];
				} else this.canvasContexts[e] && delete this.canvasContexts[e];
				return t.remove(), delete this.elements[e], this;
			}
		},
		{
			key: "getCamera",
			value: function() {
				return this.camera;
			}
		},
		{
			key: "setCamera",
			value: function(e) {
				this.unbindCameraHandlers(), this.camera = e, this.bindCameraHandlers();
			}
		},
		{
			key: "getContainer",
			value: function() {
				return this.container;
			}
		},
		{
			key: "getGraph",
			value: function() {
				return this.graph;
			}
		},
		{
			key: "setGraph",
			value: function(e) {
				e !== this.graph && (this.hoveredNode && !e.hasNode(this.hoveredNode) && (this.hoveredNode = null), this.hoveredEdge && !e.hasEdge(this.hoveredEdge) && (this.hoveredEdge = null), this.unbindGraphHandlers(), this.checkEdgesEventsFrame !== null && (cancelAnimationFrame(this.checkEdgesEventsFrame), this.checkEdgesEventsFrame = null), this.graph = e, this.bindGraphHandlers(), this.refresh());
			}
		},
		{
			key: "getMouseCaptor",
			value: function() {
				return this.mouseCaptor;
			}
		},
		{
			key: "getTouchCaptor",
			value: function() {
				return this.touchCaptor;
			}
		},
		{
			key: "getDimensions",
			value: function() {
				return {
					width: this.width,
					height: this.height
				};
			}
		},
		{
			key: "getGraphDimensions",
			value: function() {
				var e = this.customBBox || this.nodeExtent;
				return {
					width: e.x[1] - e.x[0] || 1,
					height: e.y[1] - e.y[0] || 1
				};
			}
		},
		{
			key: "getNodeDisplayData",
			value: function(e) {
				var t = this.nodeDataCache[e];
				return t ? Object.assign({}, t) : void 0;
			}
		},
		{
			key: "getEdgeDisplayData",
			value: function(e) {
				var t = this.edgeDataCache[e];
				return t ? Object.assign({}, t) : void 0;
			}
		},
		{
			key: "getNodeDisplayedLabels",
			value: function() {
				return new Set(this.displayedNodeLabels);
			}
		},
		{
			key: "getEdgeDisplayedLabels",
			value: function() {
				return new Set(this.displayedEdgeLabels);
			}
		},
		{
			key: "getSettings",
			value: function() {
				return q({}, this.settings);
			}
		},
		{
			key: "getSetting",
			value: function(e) {
				return this.settings[e];
			}
		},
		{
			key: "setSetting",
			value: function(e, t) {
				var n = q({}, this.settings);
				return this.settings[e] = t, ta(this.settings), this.handleSettingsUpdate(n), this.scheduleRefresh(), this;
			}
		},
		{
			key: "updateSetting",
			value: function(e, t) {
				return this.setSetting(e, t(this.settings[e])), this;
			}
		},
		{
			key: "setSettings",
			value: function(e) {
				var t = q({}, this.settings);
				return this.settings = q(q({}, this.settings), e), ta(this.settings), this.handleSettingsUpdate(t), this.scheduleRefresh(), this;
			}
		},
		{
			key: "resize",
			value: function(e) {
				var t = this.width, n = this.height;
				if (this.width = this.container.offsetWidth, this.height = this.container.offsetHeight, this.pixelRatio = Ki(), this.width === 0) {
					if (this.settings.allowInvalidContainer) this.width = 1;
					else throw Error("Sigma: Container has no width. You can set the allowInvalidContainer setting to true to stop seeing this error.");
				}
				if (this.height === 0) {
					if (this.settings.allowInvalidContainer) this.height = 1;
					else throw Error("Sigma: Container has no height. You can set the allowInvalidContainer setting to true to stop seeing this error.");
				}
				if (!e && t === this.width && n === this.height) return this;
				for (var r in this.elements) {
					var i = this.elements[r];
					i.style.width = this.width + "px", i.style.height = this.height + "px";
				}
				for (var a in this.canvasContexts) this.elements[a].setAttribute("width", this.width * this.pixelRatio + "px"), this.elements[a].setAttribute("height", this.height * this.pixelRatio + "px"), this.pixelRatio !== 1 && this.canvasContexts[a].scale(this.pixelRatio, this.pixelRatio);
				for (var o in this.webGLContexts) {
					this.elements[o].setAttribute("width", this.width * this.pixelRatio + "px"), this.elements[o].setAttribute("height", this.height * this.pixelRatio + "px");
					var s = this.webGLContexts[o];
					if (s.viewport(0, 0, this.width * this.pixelRatio, this.height * this.pixelRatio), this.pickingLayers.has(o)) {
						var c = this.textures[o];
						c && s.deleteTexture(c);
					}
				}
				return this.emit("resize"), this;
			}
		},
		{
			key: "clear",
			value: function() {
				return this.emit("beforeClear"), this.webGLContexts.nodes.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null), this.webGLContexts.nodes.clear(WebGLRenderingContext.COLOR_BUFFER_BIT), this.webGLContexts.edges.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null), this.webGLContexts.edges.clear(WebGLRenderingContext.COLOR_BUFFER_BIT), this.webGLContexts.hoverNodes.clear(WebGLRenderingContext.COLOR_BUFFER_BIT), this.canvasContexts.labels.clearRect(0, 0, this.width, this.height), this.canvasContexts.hovers.clearRect(0, 0, this.width, this.height), this.canvasContexts.edgeLabels.clearRect(0, 0, this.width, this.height), this.emit("afterClear"), this;
			}
		},
		{
			key: "refresh",
			value: function(e) {
				var t = this, n = e?.skipIndexation !== void 0 && e?.skipIndexation, r = e?.schedule !== void 0 && e.schedule, i = !e || !e.partialGraph;
				if (i) this.clearEdgeIndices(), this.clearNodeIndices(), this.graph.forEachNode(function(e) {
					return t.addNode(e);
				}), this.graph.forEachEdge(function(e) {
					return t.addEdge(e);
				});
				else {
					for (var a, o = e.partialGraph?.nodes || [], s = 0, c = o?.length || 0; s < c; s++) {
						var l = o[s];
						if (this.updateNode(l), n) {
							var u = this.nodeProgramIndex[l];
							if (u === void 0) throw Error(`Sigma: node "${l}" can't be repaint`);
							this.addNodeToProgram(l, this.nodeIndices[l], u);
						}
					}
					for (var d = (e == null || (a = e.partialGraph) == null ? void 0 : a.edges) || [], f = 0, p = d.length; f < p; f++) {
						var m = d[f];
						if (this.updateEdge(m), n) {
							var h = this.edgeProgramIndex[m];
							if (h === void 0) throw Error(`Sigma: edge "${m}" can't be repaint`);
							this.addEdgeToProgram(m, this.edgeIndices[m], h);
						}
					}
				}
				return (i || !n) && (this.needToProcess = !0), r ? this.scheduleRender() : this.render(), this;
			}
		},
		{
			key: "scheduleRender",
			value: function() {
				var e = this;
				return this.renderFrame ||= requestAnimationFrame(function() {
					e.render();
				}), this;
			}
		},
		{
			key: "scheduleRefresh",
			value: function(e) {
				return this.refresh(q(q({}, e), {}, { schedule: !0 }));
			}
		},
		{
			key: "getViewportZoomedState",
			value: function(e, t) {
				var n = this.camera.getState(), r = n.ratio, i = n.angle, a = n.x, o = n.y, s = this.settings, c = s.minCameraRatio, l = s.maxCameraRatio;
				typeof l == "number" && (t = Math.min(t, l)), typeof c == "number" && (t = Math.max(t, c));
				var u = t / r, d = {
					x: this.width / 2,
					y: this.height / 2
				}, f = this.viewportToFramedGraph(e), p = this.viewportToFramedGraph(d);
				return {
					angle: i,
					x: (f.x - p.x) * (1 - u) + a,
					y: (f.y - p.y) * (1 - u) + o,
					ratio: t
				};
			}
		},
		{
			key: "viewRectangle",
			value: function() {
				var e = this.viewportToFramedGraph({
					x: 0,
					y: 0
				}), t = this.viewportToFramedGraph({
					x: this.width,
					y: 0
				}), n = this.viewportToFramedGraph({
					x: 0,
					y: this.height
				});
				return {
					x1: e.x,
					y1: e.y,
					x2: t.x,
					y2: t.y,
					height: t.y - n.y
				};
			}
		},
		{
			key: "framedGraphToViewport",
			value: function(e) {
				var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = !!t.cameraState || !!t.viewportDimensions || !!t.graphDimensions, r = zi(t.matrix ? t.matrix : n ? Vi(t.cameraState || this.camera.getState(), t.viewportDimensions || this.getDimensions(), t.graphDimensions || this.getGraphDimensions(), t.padding || this.getStagePadding()) : this.matrix, e);
				return {
					x: (1 + r.x) * this.width / 2,
					y: (1 - r.y) * this.height / 2
				};
			}
		},
		{
			key: "viewportToFramedGraph",
			value: function(e) {
				var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = !!t.cameraState || !!t.viewportDimensions || !t.graphDimensions, r = zi(t.matrix ? t.matrix : n ? Vi(t.cameraState || this.camera.getState(), t.viewportDimensions || this.getDimensions(), t.graphDimensions || this.getGraphDimensions(), t.padding || this.getStagePadding(), !0) : this.invMatrix, {
					x: e.x / this.width * 2 - 1,
					y: 1 - e.y / this.height * 2
				});
				return isNaN(r.x) && (r.x = 0), isNaN(r.y) && (r.y = 0), r;
			}
		},
		{
			key: "viewportToGraph",
			value: function(e) {
				var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
				return this.normalizationFunction.inverse(this.viewportToFramedGraph(e, t));
			}
		},
		{
			key: "graphToViewport",
			value: function(e) {
				var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
				return this.framedGraphToViewport(this.normalizationFunction(e), t);
			}
		},
		{
			key: "getGraphToViewportRatio",
			value: function() {
				var e = {
					x: 0,
					y: 0
				}, t = {
					x: 1,
					y: 1
				}, n = Math.sqrt((e.x - t.x) ** 2 + (e.y - t.y) ** 2), r = this.graphToViewport(e), i = this.graphToViewport(t);
				return Math.sqrt((r.x - i.x) ** 2 + (r.y - i.y) ** 2) / n;
			}
		},
		{
			key: "getBBox",
			value: function() {
				return this.nodeExtent;
			}
		},
		{
			key: "getCustomBBox",
			value: function() {
				return this.customBBox;
			}
		},
		{
			key: "setCustomBBox",
			value: function(e) {
				return this.customBBox = e, this.scheduleRender(), this;
			}
		},
		{
			key: "kill",
			value: function() {
				this.emit("kill"), this.removeAllListeners(), this.unbindCameraHandlers(), window.removeEventListener("resize", this.activeListeners.handleResize), this.mouseCaptor.kill(), this.touchCaptor.kill(), this.unbindGraphHandlers(), this.clearIndices(), this.clearState(), this.nodeDataCache = {}, this.edgeDataCache = {}, this.highlightedNodes.clear(), this.renderFrame &&= (cancelAnimationFrame(this.renderFrame), null), this.renderHighlightedNodesFrame &&= (cancelAnimationFrame(this.renderHighlightedNodesFrame), null);
				for (var e = this.container; e.firstChild;) e.removeChild(e.firstChild);
				for (var t in this.nodePrograms) this.nodePrograms[t].kill();
				for (var n in this.nodeHoverPrograms) this.nodeHoverPrograms[n].kill();
				for (var r in this.edgePrograms) this.edgePrograms[r].kill();
				for (var i in this.nodePrograms = {}, this.nodeHoverPrograms = {}, this.edgePrograms = {}, this.elements) this.killLayer(i);
				this.canvasContexts = {}, this.webGLContexts = {}, this.elements = {};
			}
		},
		{
			key: "scaleSize",
			value: function() {
				var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1, t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.camera.ratio;
				return e / this.settings.zoomToSizeRatioFunction(t) * (this.getSetting("itemSizesReference") === "positions" ? t * this.graphToViewportRatio : 1);
			}
		},
		{
			key: "getCanvases",
			value: function() {
				var e = {};
				for (var t in this.elements) this.elements[t] instanceof HTMLCanvasElement && (e[t] = this.elements[t]);
				return e;
			}
		}
	]);
}(ji);
// src/ui/colour.ts
function Ma(e) {
	let t = e.trim(), n = /^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i.exec(t);
	if (n) {
		let e = n[1].length === 3 ? [...n[1]].map((e) => e + e).join("") : n[1];
		return [
			0,
			2,
			4
		].map((t) => parseInt(e.slice(t, t + 2), 16));
	}
	let r = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(t);
	return r ? [
		Number(r[1]),
		Number(r[2]),
		Number(r[3])
	] : void 0;
}
function Na(e, t, n) {
	let r = typeof e == "string" ? Ma(e) : e, i = typeof t == "string" ? Ma(t) : t;
	return !r || !i ? typeof e == "string" ? e : Ia(e, 1) : Ia(r.map((e, t) => e * n + i[t] * (1 - n)), 1);
}
function Pa(e, t) {
	let n = typeof e == "string" ? Ma(e) : e;
	return n ? Ia(n, t) : e;
}
function Fa(e, t) {
	let n = typeof e == "string" ? Ma(e) : e;
	return n ? Ia(n.map((e) => e * t), t) : "rgba(0, 0, 0, 0)";
}
function Ia([e, t, n], r) {
	return `rgba(${Math.round(e)}, ${Math.round(t)}, ${Math.round(n)}, ${r})`;
}
// node_modules/.pnpm/@sigma+node-border@3.0.0_sigma@3.0.3_graphology-types@0.24.8_/node_modules/@sigma/node-border/dist/sigma-node-border.esm.js
function La(e) {
	if (Array.isArray(e)) return e;
}
function Ra(e, t) {
	var n = e == null ? null : typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
	if (n != null) {
		var r, i, a, o, s = [], c = !0, l = !1;
		try {
			if (a = (n = n.call(e)).next, t === 0) {
				if (Object(n) !== n) return;
				c = !1;
			} else for (; !(c = (r = a.call(n)).done) && (s.push(r.value), s.length !== t); c = !0);
		} catch (e) {
			l = !0, i = e;
		} finally {
			try {
				if (!c && n.return != null && (o = n.return(), Object(o) !== o)) return;
			} finally {
				if (l) throw i;
			}
		}
		return s;
	}
}
function za(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function Ba(e, t) {
	if (e) {
		if (typeof e == "string") return za(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? za(e, t) : void 0;
	}
}
function Va() {
	throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Ha(e, t) {
	return La(e) || Ra(e, t) || Ba(e, t) || Va();
}
function Ua(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function Wa(e, t) {
	if (typeof e != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (typeof r != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function Ga(e) {
	var t = Wa(e, "string");
	return typeof t == "symbol" ? t : t + "";
}
function Ka(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, Ga(r.key), r);
	}
}
function qa(e, t, n) {
	return t && Ka(e.prototype, t), n && Ka(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function Ja(e) {
	return Ja = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
		return e.__proto__ || Object.getPrototypeOf(e);
	}, Ja(e);
}
function Ya() {
	try {
		var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
	} catch {}
	return (Ya = function() {
		return !!e;
	})();
}
function Xa(e) {
	if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
	return e;
}
function Za(e, t) {
	if (t && (typeof t == "object" || typeof t == "function")) return t;
	if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
	return Xa(e);
}
function Qa(e, t, n) {
	return t = Ja(t), Za(e, Ya() ? Reflect.construct(t, n || [], Ja(e).constructor) : t.apply(e, n));
}
function $a(e, t) {
	return $a = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
		return e.__proto__ = t, e;
	}, $a(e, t);
}
function eo(e, t) {
	if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
	e.prototype = Object.create(t && t.prototype, { constructor: {
		value: e,
		writable: !0,
		configurable: !0
	} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && $a(e, t);
}
function to(e, t, n) {
	return (t = Ga(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function no(e) {
	if (Array.isArray(e)) return za(e);
}
function ro(e) {
	if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function io() {
	throw TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function ao(e) {
	return no(e) || ro(e) || Ba(e) || io();
}
function oo(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function so(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? oo(Object(n), !0).forEach(function(t) {
			to(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : oo(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
var co = "relative", lo = {
	drawLabel: void 0,
	drawHover: void 0,
	borders: [{
		size: { value: .1 },
		color: { attribute: "borderColor" }
	}, {
		size: { fill: !0 },
		color: { attribute: "color" }
	}]
}, uo = "#000000";
function fo(e) {
	var t = e.borders, n = Ur(t.filter(function(e) {
		return "fill" in e.size;
	}).length);
	return `
precision highp float;

varying vec2 v_diffVector;
varying float v_radius;

#ifdef PICKING_MODE
varying vec4 v_color;
#else
// For normal mode, we use the border colors defined in the program:
${t.flatMap(function(e, t) {
		return "attribute" in e.size ? [`varying float v_borderSize_${t + 1};`] : [];
	}).join("\n")}
${t.flatMap(function(e, t) {
		var n = e.color;
		return "attribute" in n ? [`varying vec4 v_borderColor_${t + 1};`] : "value" in n ? [`uniform vec4 u_borderColor_${t + 1};`] : [];
	}).join("\n")}
#endif

uniform float u_correctionRatio;

const float bias = 255.0 / 254.0;
const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);

void main(void) {
  float dist = length(v_diffVector);
  float aaBorder = 2.0 * u_correctionRatio;
  float v_borderSize_0 = v_radius;
  vec4 v_borderColor_0 = transparent;

  // No antialiasing for picking mode:
  #ifdef PICKING_MODE
  if (dist > v_radius)
    gl_FragColor = transparent;
  else {
    gl_FragColor = v_color;
    gl_FragColor.a *= bias;
  }
  #else
  // Sizes:
${t.flatMap(function(e, t) {
		var n = e.size;
		if ("fill" in n) return [];
		n = n;
		var r = "attribute" in n ? `v_borderSize_${t + 1}` : Ur(n.value), i = (n.mode || co) === "pixels" ? "u_correctionRatio" : "v_radius";
		return [`  float borderSize_${t + 1} = ${i} * ${r};`];
	}).join("\n")}
  // Now, let's split the remaining space between "fill" borders:
  float fillBorderSize = (v_radius - (${t.flatMap(function(e, t) {
		return "fill" in e.size ? [] : [`borderSize_${t + 1}`];
	}).join(" + ")}) ) / ${n};
${t.flatMap(function(e, t) {
		return "fill" in e.size ? [`  float borderSize_${t + 1} = fillBorderSize;`] : [];
	}).join("\n")}

  // Finally, normalize all border sizes, to start from the full size and to end with the smallest:
  float adjustedBorderSize_0 = v_radius;
${t.map(function(e, t) {
		return `  float adjustedBorderSize_${t + 1} = adjustedBorderSize_${t} - borderSize_${t + 1};`;
	}).join("\n")}

  // Colors:
  vec4 borderColor_0 = transparent;
${t.map(function(e, t) {
		var n = e.color, r = [];
		return "attribute" in n ? r.push(`  vec4 borderColor_${t + 1} = v_borderColor_${t + 1};`) : "transparent" in n ? r.push(`  vec4 borderColor_${t + 1} = vec4(0.0, 0.0, 0.0, 0.0);`) : r.push(`  vec4 borderColor_${t + 1} = u_borderColor_${t + 1};`), r.push(`  borderColor_${t + 1}.a *= bias;`), r.push(`  if (borderSize_${t + 1} <= 1.0 * u_correctionRatio) { borderColor_${t + 1} = borderColor_${t}; }`), r.join("\n");
	}).join("\n")}
  if (dist > adjustedBorderSize_0) {
    gl_FragColor = borderColor_0;
  } else ${t.map(function(e, t) {
		return `if (dist > adjustedBorderSize_${t} - aaBorder) {
    gl_FragColor = mix(borderColor_${t + 1}, borderColor_${t}, (dist - adjustedBorderSize_${t} + aaBorder) / aaBorder);
  } else if (dist > adjustedBorderSize_${t + 1}) {
    gl_FragColor = borderColor_${t + 1};
  } else `;
	}).join("")} { /* Nothing to add here */ }
  #endif
}
`;
}
function po(e) {
	var t = e.borders;
	return `
attribute vec2 a_position;
attribute float a_size;
attribute float a_angle;

uniform mat3 u_matrix;
uniform float u_sizeRatio;
uniform float u_correctionRatio;

varying vec2 v_diffVector;
varying float v_radius;

#ifdef PICKING_MODE
attribute vec4 a_id;
varying vec4 v_color;
#else
${t.flatMap(function(e, t) {
		return "attribute" in e.size ? [`attribute float a_borderSize_${t + 1};`, `varying float v_borderSize_${t + 1};`] : [];
	}).join("\n")}
${t.flatMap(function(e, t) {
		return "attribute" in e.color ? [`attribute vec4 a_borderColor_${t + 1};`, `varying vec4 v_borderColor_${t + 1};`] : [];
	}).join("\n")}
#endif

const float bias = 255.0 / 254.0;
const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);

void main() {
  float size = a_size * u_correctionRatio / u_sizeRatio * 4.0;
  vec2 diffVector = size * vec2(cos(a_angle), sin(a_angle));
  vec2 position = a_position + diffVector;
  gl_Position = vec4(
    (u_matrix * vec3(position, 1)).xy,
    0,
    1
  );

  v_radius = size / 2.0;
  v_diffVector = diffVector;

  #ifdef PICKING_MODE
  v_color = a_id;
  #else
${t.flatMap(function(e, t) {
		return "attribute" in e.size ? [`  v_borderSize_${t + 1} = a_borderSize_${t + 1};`] : [];
	}).join("\n")}
${t.flatMap(function(e, t) {
		return "attribute" in e.color ? [`  v_borderColor_${t + 1} = a_borderColor_${t + 1};`] : [];
	}).join("\n")}
  #endif
}
`;
}
var mo = WebGLRenderingContext, ho = mo.UNSIGNED_BYTE, go = mo.FLOAT;
function _o(e) {
	var t, n = so(so({}, lo), e || {}), r = n.borders, i = n.drawLabel, a = n.drawHover, o = [
		"u_sizeRatio",
		"u_correctionRatio",
		"u_matrix"
	].concat(ao(r.flatMap(function(e, t) {
		return "value" in e.color ? [`u_borderColor_${t + 1}`] : [];
	})));
	return t = /*#__PURE__*/ function(e) {
		eo(t, e);
		function t() {
			var e;
			Ua(this, t);
			var n = [...arguments];
			return e = Qa(this, t, [].concat(n)), to(Xa(e), "drawLabel", i), to(Xa(e), "drawHover", a), e;
		}
		return qa(t, [
			{
				key: "getDefinition",
				value: function() {
					return {
						VERTICES: 3,
						VERTEX_SHADER_SOURCE: po(n),
						FRAGMENT_SHADER_SOURCE: fo(n),
						METHOD: WebGLRenderingContext.TRIANGLES,
						UNIFORMS: o,
						ATTRIBUTES: [
							{
								name: "a_position",
								size: 2,
								type: go
							},
							{
								name: "a_id",
								size: 4,
								type: ho,
								normalized: !0
							},
							{
								name: "a_size",
								size: 1,
								type: go
							}
						].concat(ao(r.flatMap(function(e, t) {
							return "attribute" in e.color ? [{
								name: `a_borderColor_${t + 1}`,
								size: 4,
								type: ho,
								normalized: !0
							}] : [];
						})), ao(r.flatMap(function(e, t) {
							return "attribute" in e.size ? [{
								name: `a_borderSize_${t + 1}`,
								size: 1,
								type: go
							}] : [];
						}))),
						CONSTANT_ATTRIBUTES: [{
							name: "a_angle",
							size: 1,
							type: go
						}],
						CONSTANT_DATA: [
							[t.ANGLE_1],
							[t.ANGLE_2],
							[t.ANGLE_3]
						]
					};
				}
			},
			{
				key: "processVisibleItem",
				value: function(e, t, n) {
					var i = this.array;
					i[t++] = n.x, i[t++] = n.y, i[t++] = e, i[t++] = n.size, r.forEach(function(e) {
						var r = e.color;
						"attribute" in r && (i[t++] = Er(n[r.attribute] || r.defaultValue || uo));
					}), r.forEach(function(e) {
						var r = e.size;
						"attribute" in r && (i[t++] = n[r.attribute] || r.defaultValue);
					});
				}
			},
			{
				key: "setUniforms",
				value: function(e, t) {
					var n = t.gl, i = t.uniformLocations, a = i.u_sizeRatio, o = i.u_correctionRatio, s = i.u_matrix;
					n.uniform1f(o, e.correctionRatio), n.uniform1f(a, e.sizeRatio), n.uniformMatrix3fv(s, !1, e.matrix), r.forEach(function(e, t) {
						var r = e.color;
						if ("value" in r) {
							var a = i[`u_borderColor_${t + 1}`], o = Ha(Dr(r.value), 4), s = o[0], c = o[1], l = o[2], u = o[3];
							n.uniform4f(a, s / 255, c / 255, l / 255, u / 255);
						}
					});
				}
			}
		]), t;
	}(qr), to(t, "ANGLE_1", 0), to(t, "ANGLE_2", 2 * Math.PI / 3), to(t, "ANGLE_3", 4 * Math.PI / 3), t;
}
_o();
// node_modules/.pnpm/@sigma+node-image@3.0.0_sigma@3.0.3_graphology-types@0.24.8_/node_modules/@sigma/node-image/dist/sigma-node-image.esm.js
function vo(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function yo(e) {
	if (Array.isArray(e)) return vo(e);
}
function bo(e) {
	if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function xo(e, t) {
	if (e) {
		if (typeof e == "string") return vo(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? vo(e, t) : void 0;
	}
}
function So() {
	throw TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Co(e) {
	return yo(e) || bo(e) || xo(e) || So();
}
function wo(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function To(e, t) {
	if (typeof e != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (typeof r != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function Eo(e) {
	var t = To(e, "string");
	return typeof t == "symbol" ? t : t + "";
}
function Do(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, Eo(r.key), r);
	}
}
function Oo(e, t, n) {
	return t && Do(e.prototype, t), n && Do(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function ko(e) {
	return ko = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
		return e.__proto__ || Object.getPrototypeOf(e);
	}, ko(e);
}
function Ao() {
	try {
		var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
	} catch {}
	return (Ao = function() {
		return !!e;
	})();
}
function X(e) {
	if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
	return e;
}
function jo(e, t) {
	if (t && (typeof t == "object" || typeof t == "function")) return t;
	if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
	return X(e);
}
function Mo(e, t, n) {
	return t = ko(t), jo(e, Ao() ? Reflect.construct(t, n || [], ko(e).constructor) : t.apply(e, n));
}
function No(e, t) {
	for (; !{}.hasOwnProperty.call(e, t) && (e = ko(e)) !== null;);
	return e;
}
function Po() {
	return Po = typeof Reflect < "u" && Reflect.get ? Reflect.get.bind() : function(e, t, n) {
		var r = No(e, t);
		if (r) {
			var i = Object.getOwnPropertyDescriptor(r, t);
			return i.get ? i.get.call(arguments.length < 3 ? e : n) : i.value;
		}
	}, Po.apply(null, arguments);
}
function Fo(e, t, n, r) {
	var i = Po(ko(1 & r ? e.prototype : e), t, n);
	return 2 & r && typeof i == "function" ? function(e) {
		return i.apply(n, e);
	} : i;
}
function Io(e, t) {
	return Io = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
		return e.__proto__ = t, e;
	}, Io(e, t);
}
function Lo(e, t) {
	if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
	e.prototype = Object.create(t && t.prototype, { constructor: {
		value: e,
		writable: !0,
		configurable: !0
	} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && Io(e, t);
}
function Z(e, t, n) {
	return (t = Eo(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function Ro(e, t) {
	if (e == null) return {};
	var n = {};
	for (var r in e) if ({}.hasOwnProperty.call(e, r)) {
		if (t.includes(r)) continue;
		n[r] = e[r];
	}
	return n;
}
function zo(e, t) {
	if (e == null) return {};
	var n, r, i = Ro(e, t);
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (r = 0; r < a.length; r++) n = a[r], t.includes(n) || {}.propertyIsEnumerable.call(e, n) && (i[n] = e[n]);
	}
	return i;
}
function Bo(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function Q(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Bo(Object(n), !0).forEach(function(t) {
			Z(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Bo(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function Vo(e) {
	var t = e.texturesCount;
	return `
precision highp float;

varying vec4 v_color;
varying vec2 v_diffVector;
varying float v_radius;
varying vec4 v_texture;
varying float v_textureIndex;

uniform sampler2D u_atlas[${t}];
uniform float u_correctionRatio;
uniform float u_cameraAngle;
uniform float u_percentagePadding;
uniform bool u_colorizeImages;
uniform bool u_keepWithinCircle;

const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);

const float radius = 0.5;

void main(void) {
  float border = 2.0 * u_correctionRatio;
  float dist = length(v_diffVector);
  vec4 color = gl_FragColor;

  float c = cos(-u_cameraAngle);
  float s = sin(-u_cameraAngle);
  vec2 diffVector = mat2(c, s, -s, c) * (v_diffVector);

  // No antialiasing for picking mode:
  #ifdef PICKING_MODE
  border = 0.0;
  color = v_color;

  #else
  // First case: No image to display
  if (v_texture.w <= 0.0) {
    if (!u_colorizeImages) {
      color = v_color;
    }
  }

  // Second case: Image loaded into the texture
  else {
    float paddingRatio = 1.0 + 2.0 * u_percentagePadding;
    float coef = u_keepWithinCircle ? 1.0 : ${Math.SQRT2};
    vec2 coordinateInTexture = diffVector * vec2(paddingRatio, -paddingRatio) / v_radius / 2.0 * coef + vec2(0.5, 0.5);
    int index = int(v_textureIndex + 0.5); // +0.5 avoid rounding errors

    bool noTextureFound = false;
    vec4 texel;

    ${Co(Array(t)).map(function(e, t) {
		return `if (index == ${t}) texel = texture2D(u_atlas[${t}], (v_texture.xy + coordinateInTexture * v_texture.zw), -1.0);`;
	}).join("\n    else ") + "else {\n      texel = texture2D(u_atlas[0], (v_texture.xy + coordinateInTexture * v_texture.zw), -1.0);\n      noTextureFound = true;\n    }"}

    if (noTextureFound) {
      color = v_color;
    } else {
      // Colorize all visible image pixels:
      if (u_colorizeImages) {
        color = mix(gl_FragColor, v_color, texel.a);
      }

      // Colorize background pixels, keep image pixel colors:
      else {
        color = vec4(mix(v_color, texel, texel.a).rgb, max(texel.a, v_color.a));
      }

      // Erase pixels "in the padding":
      if (abs(diffVector.x) > v_radius / paddingRatio || abs(diffVector.y) > v_radius / paddingRatio) {
        color = u_colorizeImages ? gl_FragColor : v_color;
      }
    }
  }
  #endif

  // Crop in a circle when u_keepWithinCircle is truthy:
  if (u_keepWithinCircle) {
    if (dist < v_radius - border) {
      gl_FragColor = color;
    } else if (dist < v_radius) {
      gl_FragColor = mix(transparent, color, (v_radius - dist) / border);
    }
  }

  // Crop in a square else:
  else {
    float squareHalfSize = v_radius * ${Math.SQRT1_2 * Math.cos(Math.PI / 12)};
    if (abs(diffVector.x) > squareHalfSize || abs(diffVector.y) > squareHalfSize) {
      gl_FragColor = transparent;
    } else {
      gl_FragColor = color;
    }
  }
}
`;
}
var Ho = "\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_position;\nattribute float a_size;\nattribute float a_angle;\nattribute vec4 a_texture;\nattribute float a_textureIndex;\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\nvarying vec4 v_texture;\nvarying float v_textureIndex;\n\nconst float bias = 255.0 / 254.0;\nconst float marginRatio = 1.05;\n\nvoid main() {\n  float size = a_size * u_correctionRatio / u_sizeRatio * 4.0;\n  vec2 diffVector = size * vec2(cos(a_angle), sin(a_angle));\n  vec2 position = a_position + diffVector * marginRatio;\n  gl_Position = vec4(\n    (u_matrix * vec3(position, 1)).xy,\n    0,\n    1\n  );\n\n  v_diffVector = diffVector;\n  v_radius = size / 2.0 / marginRatio;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n\n  // Pass the texture coordinates:\n  v_textureIndex = a_textureIndex;\n  v_texture = a_texture;\n  #endif\n\n  v_color.a *= bias;\n}\n";
function Uo() {
	Uo = function() {
		return t;
	};
	var e, t = {}, n = Object.prototype, r = n.hasOwnProperty, i = Object.defineProperty || function(e, t, n) {
		e[t] = n.value;
	}, a = typeof Symbol == "function" ? Symbol : {}, o = a.iterator || "@@iterator", s = a.asyncIterator || "@@asyncIterator", c = a.toStringTag || "@@toStringTag";
	function l(e, t, n) {
		return Object.defineProperty(e, t, {
			value: n,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}), e[t];
	}
	try {
		l({}, "");
	} catch {
		l = function(e, t, n) {
			return e[t] = n;
		};
	}
	function u(e, t, n, r) {
		var a = t && t.prototype instanceof _ ? t : _, o = Object.create(a.prototype);
		return i(o, "_invoke", { value: E(e, n, new A(r || [])) }), o;
	}
	function d(e, t, n) {
		try {
			return {
				type: "normal",
				arg: e.call(t, n)
			};
		} catch (e) {
			return {
				type: "throw",
				arg: e
			};
		}
	}
	t.wrap = u;
	var f = "suspendedStart", p = "suspendedYield", m = "executing", h = "completed", g = {};
	function _() {}
	function v() {}
	function y() {}
	var b = {};
	l(b, o, function() {
		return this;
	});
	var x = Object.getPrototypeOf, S = x && x(x(j([])));
	S && S !== n && r.call(S, o) && (b = S);
	var C = y.prototype = _.prototype = Object.create(b);
	function w(e) {
		[
			"next",
			"throw",
			"return"
		].forEach(function(t) {
			l(e, t, function(e) {
				return this._invoke(t, e);
			});
		});
	}
	function T(e, t) {
		function n(i, a, o, s) {
			var c = d(e[i], e, a);
			if (c.type !== "throw") {
				var l = c.arg, u = l.value;
				return u && typeof u == "object" && r.call(u, "__await") ? t.resolve(u.__await).then(function(e) {
					n("next", e, o, s);
				}, function(e) {
					n("throw", e, o, s);
				}) : t.resolve(u).then(function(e) {
					l.value = e, o(l);
				}, function(e) {
					return n("throw", e, o, s);
				});
			}
			s(c.arg);
		}
		var a;
		i(this, "_invoke", { value: function(e, r) {
			function i() {
				return new t(function(t, i) {
					n(e, r, t, i);
				});
			}
			return a = a ? a.then(i, i) : i();
		} });
	}
	function E(t, n, r) {
		var i = f;
		return function(a, o) {
			if (i === m) throw Error("Generator is already running");
			if (i === h) {
				if (a === "throw") throw o;
				return {
					value: e,
					done: !0
				};
			}
			for (r.method = a, r.arg = o;;) {
				var s = r.delegate;
				if (s) {
					var c = D(s, r);
					if (c) {
						if (c === g) continue;
						return c;
					}
				}
				if (r.method === "next") r.sent = r._sent = r.arg;
				else if (r.method === "throw") {
					if (i === f) throw i = h, r.arg;
					r.dispatchException(r.arg);
				} else r.method === "return" && r.abrupt("return", r.arg);
				i = m;
				var l = d(t, n, r);
				if (l.type === "normal") {
					if (i = r.done ? h : p, l.arg === g) continue;
					return {
						value: l.arg,
						done: r.done
					};
				}
				l.type === "throw" && (i = h, r.method = "throw", r.arg = l.arg);
			}
		};
	}
	function D(t, n) {
		var r = n.method, i = t.iterator[r];
		if (i === e) return n.delegate = null, r === "throw" && t.iterator.return && (n.method = "return", n.arg = e, D(t, n), n.method === "throw") || r !== "return" && (n.method = "throw", n.arg = /* @__PURE__ */ TypeError("The iterator does not provide a '" + r + "' method")), g;
		var a = d(i, t.iterator, n.arg);
		if (a.type === "throw") return n.method = "throw", n.arg = a.arg, n.delegate = null, g;
		var o = a.arg;
		return o ? o.done ? (n[t.resultName] = o.value, n.next = t.nextLoc, n.method !== "return" && (n.method = "next", n.arg = e), n.delegate = null, g) : o : (n.method = "throw", n.arg = /* @__PURE__ */ TypeError("iterator result is not an object"), n.delegate = null, g);
	}
	function O(e) {
		var t = { tryLoc: e[0] };
		1 in e && (t.catchLoc = e[1]), 2 in e && (t.finallyLoc = e[2], t.afterLoc = e[3]), this.tryEntries.push(t);
	}
	function k(e) {
		var t = e.completion || {};
		t.type = "normal", delete t.arg, e.completion = t;
	}
	function A(e) {
		this.tryEntries = [{ tryLoc: "root" }], e.forEach(O, this), this.reset(!0);
	}
	function j(t) {
		if (t || t === "") {
			var n = t[o];
			if (n) return n.call(t);
			if (typeof t.next == "function") return t;
			if (!isNaN(t.length)) {
				var i = -1, a = function n() {
					for (; ++i < t.length;) if (r.call(t, i)) return n.value = t[i], n.done = !1, n;
					return n.value = e, n.done = !0, n;
				};
				return a.next = a;
			}
		}
		throw TypeError(typeof t + " is not iterable");
	}
	return v.prototype = y, i(C, "constructor", {
		value: y,
		configurable: !0
	}), i(y, "constructor", {
		value: v,
		configurable: !0
	}), v.displayName = l(y, c, "GeneratorFunction"), t.isGeneratorFunction = function(e) {
		var t = typeof e == "function" && e.constructor;
		return !!t && (t === v || (t.displayName || t.name) === "GeneratorFunction");
	}, t.mark = function(e) {
		return Object.setPrototypeOf ? Object.setPrototypeOf(e, y) : (e.__proto__ = y, l(e, c, "GeneratorFunction")), e.prototype = Object.create(C), e;
	}, t.awrap = function(e) {
		return { __await: e };
	}, w(T.prototype), l(T.prototype, s, function() {
		return this;
	}), t.AsyncIterator = T, t.async = function(e, n, r, i, a) {
		a === void 0 && (a = Promise);
		var o = new T(u(e, n, r, i), a);
		return t.isGeneratorFunction(n) ? o : o.next().then(function(e) {
			return e.done ? e.value : o.next();
		});
	}, w(C), l(C, c, "Generator"), l(C, o, function() {
		return this;
	}), l(C, "toString", function() {
		return "[object Generator]";
	}), t.keys = function(e) {
		var t = Object(e), n = [];
		for (var r in t) n.push(r);
		return n.reverse(), function e() {
			for (; n.length;) {
				var r = n.pop();
				if (r in t) return e.value = r, e.done = !1, e;
			}
			return e.done = !0, e;
		};
	}, t.values = j, A.prototype = {
		constructor: A,
		reset: function(t) {
			if (this.prev = 0, this.next = 0, this.sent = this._sent = e, this.done = !1, this.delegate = null, this.method = "next", this.arg = e, this.tryEntries.forEach(k), !t) for (var n in this) n.charAt(0) === "t" && r.call(this, n) && !isNaN(+n.slice(1)) && (this[n] = e);
		},
		stop: function() {
			this.done = !0;
			var e = this.tryEntries[0].completion;
			if (e.type === "throw") throw e.arg;
			return this.rval;
		},
		dispatchException: function(t) {
			if (this.done) throw t;
			var n = this;
			function i(r, i) {
				return s.type = "throw", s.arg = t, n.next = r, i && (n.method = "next", n.arg = e), !!i;
			}
			for (var a = this.tryEntries.length - 1; a >= 0; --a) {
				var o = this.tryEntries[a], s = o.completion;
				if (o.tryLoc === "root") return i("end");
				if (o.tryLoc <= this.prev) {
					var c = r.call(o, "catchLoc"), l = r.call(o, "finallyLoc");
					if (c && l) {
						if (this.prev < o.catchLoc) return i(o.catchLoc, !0);
						if (this.prev < o.finallyLoc) return i(o.finallyLoc);
					} else if (c) {
						if (this.prev < o.catchLoc) return i(o.catchLoc, !0);
					} else {
						if (!l) throw Error("try statement without catch or finally");
						if (this.prev < o.finallyLoc) return i(o.finallyLoc);
					}
				}
			}
		},
		abrupt: function(e, t) {
			for (var n = this.tryEntries.length - 1; n >= 0; --n) {
				var i = this.tryEntries[n];
				if (i.tryLoc <= this.prev && r.call(i, "finallyLoc") && this.prev < i.finallyLoc) {
					var a = i;
					break;
				}
			}
			a && (e === "break" || e === "continue") && a.tryLoc <= t && t <= a.finallyLoc && (a = null);
			var o = a ? a.completion : {};
			return o.type = e, o.arg = t, a ? (this.method = "next", this.next = a.finallyLoc, g) : this.complete(o);
		},
		complete: function(e, t) {
			if (e.type === "throw") throw e.arg;
			return e.type === "break" || e.type === "continue" ? this.next = e.arg : e.type === "return" ? (this.rval = this.arg = e.arg, this.method = "return", this.next = "end") : e.type === "normal" && t && (this.next = t), g;
		},
		finish: function(e) {
			for (var t = this.tryEntries.length - 1; t >= 0; --t) {
				var n = this.tryEntries[t];
				if (n.finallyLoc === e) return this.complete(n.completion, n.afterLoc), k(n), g;
			}
		},
		catch: function(e) {
			for (var t = this.tryEntries.length - 1; t >= 0; --t) {
				var n = this.tryEntries[t];
				if (n.tryLoc === e) {
					var r = n.completion;
					if (r.type === "throw") {
						var i = r.arg;
						k(n);
					}
					return i;
				}
			}
			throw Error("illegal catch attempt");
		},
		delegateYield: function(t, n, r) {
			return this.delegate = {
				iterator: j(t),
				resultName: n,
				nextLoc: r
			}, this.method === "next" && (this.arg = e), g;
		}
	}, t;
}
function Wo(e, t, n, r, i, a, o) {
	try {
		var s = e[a](o), c = s.value;
	} catch (e) {
		n(e);
		return;
	}
	s.done ? t(c) : Promise.resolve(c).then(r, i);
}
function Go(e) {
	return function() {
		var t = this, n = arguments;
		return new Promise(function(r, i) {
			var a = e.apply(t, n);
			function o(e) {
				Wo(a, r, i, o, s, "next", e);
			}
			function s(e) {
				Wo(a, r, i, o, s, "throw", e);
			}
			o(void 0);
		});
	};
}
var Ko = {
	size: {
		mode: "max",
		value: 512
	},
	objectFit: "cover",
	correctCentering: !1,
	maxTextureSize: 4096,
	debounceTimeout: 500,
	crossOrigin: "anonymous"
}, qo = 1;
function Jo(e) {
	var t = (arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}).crossOrigin;
	return new Promise(function(n, r) {
		var i = new Image();
		i.addEventListener("load", function() {
			n(i);
		}, { once: !0 }), i.addEventListener("error", function(e) {
			r(e.error);
		}, { once: !0 }), t && i.setAttribute("crossOrigin", t), i.src = e;
	});
}
function Yo(e) {
	return Xo.apply(this, arguments);
}
function Xo() {
	return Xo = Go(/*#__PURE__*/ Uo().mark(function e(t) {
		var n, r, i, a, o, s, c, l, u, d, f, p, m, h = arguments;
		return Uo().wrap(function(e) {
			for (;;) switch (e.prev = e.next) {
				case 0:
					if (n = h.length > 1 && h[1] !== void 0 ? h[1] : {}, r = n.size, i = n.crossOrigin, i !== "use-credentials") {
						e.next = 7;
						break;
					}
					return e.next = 4, fetch(t, { credentials: "include" });
				case 4:
					a = e.sent, e.next = 10;
					break;
				case 7: return e.next = 9, fetch(t);
				case 9: a = e.sent;
				case 10: return e.next = 12, a.text();
				case 12:
					if (o = e.sent, s = new DOMParser().parseFromString(o, "image/svg+xml"), c = s.documentElement, l = c.getAttribute("width"), u = c.getAttribute("height"), l && u) {
						e.next = 19;
						break;
					}
					throw Error("loadSVGImage: cannot use `size` if target SVG has no definite dimensions.");
				case 19: return typeof r == "number" && (c.setAttribute("width", "" + r), c.setAttribute("height", "" + r)), d = new XMLSerializer().serializeToString(s), f = new Blob([d], { type: "image/svg+xml" }), p = URL.createObjectURL(f), m = Jo(p), m.finally(function() {
					return URL.revokeObjectURL(p);
				}), e.abrupt("return", m);
				case 26:
				case "end": return e.stop();
			}
		}, e);
	})), Xo.apply(this, arguments);
}
function Zo(e) {
	return Qo.apply(this, arguments);
}
function Qo() {
	return Qo = Go(/*#__PURE__*/ Uo().mark(function e(t) {
		var n, r, i, a, o, s = arguments;
		return Uo().wrap(function(e) {
			for (;;) switch (e.prev = e.next) {
				case 0:
					if (n = s.length > 1 && s[1] !== void 0 ? s[1] : {}, r = n.size, i = n.crossOrigin, a = t.split(/[#?]/)[0].split(".").pop()?.trim().toLowerCase() === "svg", !(a && r)) {
						e.next = 16;
						break;
					}
					return e.prev = 3, e.next = 6, Yo(t, {
						size: r,
						crossOrigin: i
					});
				case 6:
					o = e.sent, e.next = 14;
					break;
				case 9: return e.prev = 9, e.t0 = e.catch(3), e.next = 13, Jo(t, { crossOrigin: i });
				case 13: o = e.sent;
				case 14:
					e.next = 19;
					break;
				case 16: return e.next = 18, Jo(t, { crossOrigin: i });
				case 18: o = e.sent;
				case 19: return e.abrupt("return", o);
				case 20:
				case "end": return e.stop();
			}
		}, e, null, [[3, 9]]);
	})), Qo.apply(this, arguments);
}
function $o(e, t, n) {
	var r = n.objectFit, i = n.size, a = n.correctCentering, o = r === "contain" ? Math.max(e.width, e.height) : Math.min(e.width, e.height), s = i.mode === "auto" ? o : i.mode === "force" ? i.value : Math.min(i.value, o), c = (e.width - o) / 2, l = (e.height - o) / 2;
	if (a) {
		var u = t.getCorrectionOffset(e, o);
		c = u.x, l = u.y;
	}
	return {
		sourceX: c,
		sourceY: l,
		sourceSize: o,
		destinationSize: s
	};
}
function es(e, t, n) {
	for (var r = t.canvas, i = r.width, a = r.height, o = [], s = n.x, c = n.y, l = n.rowHeight, u = n.maxRowWidth, d = {}, f = 0, p = e.length; f < p; f++) {
		var m = e[f], h = m.key, g = m.image, _ = m.sourceSize, v = m.sourceX, y = m.sourceY, b = m.destinationSize, x = b + qo;
		c + x > a || s + x > i && c + x + l > a || (s + x > i && (u = Math.max(u, s), s = 0, c += l, l = x), o.push({
			key: h,
			image: g,
			sourceX: v,
			sourceY: y,
			sourceSize: _,
			destinationX: s,
			destinationY: c,
			destinationSize: b
		}), d[h] = {
			x: s,
			y: c,
			size: b
		}, s += x, l = Math.max(l, x));
	}
	u = Math.max(u, s);
	for (var S = u, C = c + l, w = 0, T = o.length; w < T; w++) {
		var E = o[w], D = E.image, O = E.sourceSize, k = E.sourceX, A = E.sourceY, j = E.destinationSize, M = E.destinationX, ee = E.destinationY;
		t.drawImage(D, k, A, O, O, M, ee, j, j);
	}
	return {
		atlas: d,
		texture: t.getImageData(0, 0, S, C),
		cursor: {
			x: s,
			y: c,
			rowHeight: l,
			maxRowWidth: u
		}
	};
}
function ts(e, t, n) {
	var r = e.atlas, i = e.textures, a = e.cursor, o = {
		atlas: Q({}, r),
		textures: Co(i.slice(0, -1)),
		cursor: Q({}, a)
	}, s = [];
	for (var c in t) {
		var l = t[c];
		l.status === "ready" && typeof r[c]?.textureIndex != "number" && s.push(Q({ key: c }, l));
	}
	for (var u = function() {
		var e = es(s, n, o.cursor), t = e.atlas, r = e.texture;
		o.cursor = e.cursor;
		var i = [];
		s.forEach(function(e) {
			t[e.key] ? o.atlas[e.key] = Q(Q({}, t[e.key]), {}, { textureIndex: o.textures.length }) : i.push(e);
		}), o.textures.push(r), s = i, s.length && (o.cursor = {
			x: 0,
			y: 0,
			rowHeight: 0,
			maxRowWidth: 0
		}, n.clearRect(0, 0, n.canvas.width, n.canvas.height));
	}; s.length;) u();
	return o;
}
var ns = /*#__PURE__*/ function() {
	function e() {
		wo(this, e), this.canvas = document.createElement("canvas"), this.context = this.canvas.getContext("2d", { willReadFrequently: !0 });
	}
	return Oo(e, [{
		key: "getCorrectionOffset",
		value: function(e, t) {
			this.canvas.width = t, this.canvas.height = t, this.context.clearRect(0, 0, t, t), this.context.drawImage(e, 0, 0, t, t);
			for (var n = this.context.getImageData(0, 0, t, t).data, r = new Uint8ClampedArray(n.length / 4), i = 0; i < n.length; i++) r[i] = n[i * 4 + 3];
			for (var a = 0, o = 0, s = 0, c = 0; c < t; c++) for (var l = 0; l < t; l++) {
				var u = r[c * t + l];
				s += u, a += u * l, o += u * c;
			}
			var d = a / s, f = o / s;
			return {
				x: d - t / 2,
				y: f - t / 2
			};
		}
	}]), e;
}(), rs = /*#__PURE__*/ function(e) {
	Lo(t, e);
	function t() {
		var e, n = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		return wo(this, t), e = Mo(this, t), Z(X(e), "canvas", document.createElement("canvas")), Z(X(e), "ctx", e.canvas.getContext("2d", { willReadFrequently: !0 })), Z(X(e), "corrector", new ns()), Z(X(e), "imageStates", {}), Z(X(e), "textures", [e.ctx.getImageData(0, 0, 1, 1)]), Z(X(e), "lastTextureCursor", {
			x: 0,
			y: 0,
			rowHeight: 0,
			maxRowWidth: 0
		}), Z(X(e), "atlas", {}), e.options = Q(Q({}, Ko), n), e.canvas.width = e.options.maxTextureSize, e.canvas.height = e.options.maxTextureSize, e;
	}
	return Oo(t, [
		{
			key: "scheduleGenerateTexture",
			value: function() {
				var e = this;
				typeof this.frameId != "number" && (typeof this.options.debounceTimeout == "number" ? this.frameId = window.setTimeout(function() {
					e.generateTextures(), e.frameId = void 0;
				}, this.options.debounceTimeout) : this.generateTextures());
			}
		},
		{
			key: "generateTextures",
			value: function() {
				var e = ts({
					atlas: this.atlas,
					textures: this.textures,
					cursor: this.lastTextureCursor
				}, this.imageStates, this.ctx), n = e.atlas, r = e.textures, i = e.cursor;
				this.atlas = n, this.textures = r, this.lastTextureCursor = i, this.emit(t.NEW_TEXTURE_EVENT, {
					atlas: n,
					textures: r
				});
			}
		},
		{
			key: "registerImage",
			value: function() {
				var e = Go(/*#__PURE__*/ Uo().mark(function e(t) {
					var n, r;
					return Uo().wrap(function(e) {
						for (;;) switch (e.prev = e.next) {
							case 0:
								if (!this.imageStates[t]) {
									e.next = 2;
									break;
								}
								return e.abrupt("return");
							case 2: return this.imageStates[t] = { status: "loading" }, e.prev = 3, n = this.options.size, e.next = 7, Zo(t, {
								size: n.mode === "force" ? n.value : void 0,
								crossOrigin: this.options.crossOrigin || void 0
							});
							case 7:
								r = e.sent, this.imageStates[t] = Q({
									status: "ready",
									image: r
								}, $o(r, this.corrector, this.options)), this.scheduleGenerateTexture(), e.next = 15;
								break;
							case 12: e.prev = 12, e.t0 = e.catch(3), this.imageStates[t] = { status: "error" };
							case 15:
							case "end": return e.stop();
						}
					}, e, this, [[3, 12]]);
				}));
				function t(t) {
					return e.apply(this, arguments);
				}
				return t;
			}()
		},
		{
			key: "getAtlas",
			value: function() {
				return this.atlas;
			}
		},
		{
			key: "getTextures",
			value: function() {
				return this.textures;
			}
		}
	]), t;
}(te.EventEmitter);
Z(rs, "NEW_TEXTURE_EVENT", "newTexture");
var is = [
	"drawHover",
	"drawLabel",
	"drawingMode",
	"keepWithinCircle",
	"padding",
	"colorAttribute",
	"imageAttribute"
], as = WebGLRenderingContext, os = as.UNSIGNED_BYTE, ss = as.FLOAT, cs = Q(Q({}, Ko), {}, {
	drawingMode: "background",
	keepWithinCircle: !0,
	drawLabel: void 0,
	drawHover: void 0,
	padding: 0,
	colorAttribute: "color",
	imageAttribute: "image"
}), ls = [
	"u_sizeRatio",
	"u_correctionRatio",
	"u_cameraAngle",
	"u_percentagePadding",
	"u_matrix",
	"u_colorizeImages",
	"u_keepWithinCircle",
	"u_atlas"
];
function us(e) {
	var t, n = document.createElement("canvas").getContext("webgl"), r = Math.min(n.getParameter(n.MAX_TEXTURE_SIZE), Ko.maxTextureSize);
	n.canvas.remove();
	var i = Q(Q(Q({}, cs), { maxTextureSize: r }), e || {}), a = i.drawHover, o = i.drawLabel, s = i.drawingMode, c = i.keepWithinCircle, l = i.padding, u = i.colorAttribute, d = i.imageAttribute, f = new rs(zo(i, is));
	return t = /*#__PURE__*/ function(e) {
		Lo(t, e);
		function t(e, n, r) {
			var i;
			return wo(this, t), i = Mo(this, t, [
				e,
				n,
				r
			]), Z(X(i), "drawLabel", o), Z(X(i), "drawHover", a), Z(X(i), "textureManagerCallback", null), i.textureManagerCallback = function(e) {
				var t = e.atlas, n = e.textures, r = n.length !== i.textures.length;
				i.atlas = t, i.textureImages = n, r && i.upgradeShaders(), i.bindTextures(), i.latestRenderParams && i.render(i.latestRenderParams), i.renderer && i.renderer.refresh && i.renderer.refresh();
			}, f.on(rs.NEW_TEXTURE_EVENT, i.textureManagerCallback), i.atlas = f.getAtlas(), i.textureImages = f.getTextures(), i.textures = i.textureImages.map(function() {
				return e.createTexture();
			}), i.bindTextures(), i;
		}
		return Oo(t, [
			{
				key: "getDefinition",
				value: function() {
					return {
						VERTICES: 3,
						VERTEX_SHADER_SOURCE: Ho,
						FRAGMENT_SHADER_SOURCE: Vo({ texturesCount: f.getTextures().length }),
						METHOD: WebGLRenderingContext.TRIANGLES,
						UNIFORMS: ls,
						ATTRIBUTES: [
							{
								name: "a_position",
								size: 2,
								type: ss
							},
							{
								name: "a_size",
								size: 1,
								type: ss
							},
							{
								name: "a_color",
								size: 4,
								type: os,
								normalized: !0
							},
							{
								name: "a_id",
								size: 4,
								type: os,
								normalized: !0
							},
							{
								name: "a_texture",
								size: 4,
								type: ss
							},
							{
								name: "a_textureIndex",
								size: 1,
								type: ss
							}
						],
						CONSTANT_ATTRIBUTES: [{
							name: "a_angle",
							size: 1,
							type: ss
						}],
						CONSTANT_DATA: [
							[t.ANGLE_1],
							[t.ANGLE_2],
							[t.ANGLE_3]
						]
					};
				}
			},
			{
				key: "upgradeShaders",
				value: function() {
					var e = this.getDefinition(), t = this.normalProgram, n = t.program, r = t.buffer, i = t.vertexShader, a = t.fragmentShader, o = t.gl;
					o.deleteProgram(n), o.deleteBuffer(r), o.deleteShader(i), o.deleteShader(a), this.normalProgram = this.getProgramInfo("normal", o, e.VERTEX_SHADER_SOURCE, e.FRAGMENT_SHADER_SOURCE, null);
				}
			},
			{
				key: "kill",
				value: function() {
					var e = this.normalProgram?.gl;
					if (e) for (var n = 0; n < this.textures.length; n++) e.deleteTexture(this.textures[n]);
					this.textureManagerCallback &&= (f.off(rs.NEW_TEXTURE_EVENT, this.textureManagerCallback), null), Fo(t, "kill", this, 3)([]);
				}
			},
			{
				key: "bindTextures",
				value: function() {
					for (var e = this.normalProgram.gl, t = 0; t < this.textureImages.length; t++) {
						if (t >= this.textures.length) {
							var n = e.createTexture();
							n && this.textures.push(n);
						}
						e.activeTexture(e.TEXTURE0 + t), e.bindTexture(e.TEXTURE_2D, this.textures[t]), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, e.RGBA, e.UNSIGNED_BYTE, this.textureImages[t]), e.generateMipmap(e.TEXTURE_2D);
					}
				}
			},
			{
				key: "renderProgram",
				value: function(e, n) {
					if (!n.isPicking) for (var r = n.gl, i = 0; i < this.textureImages.length; i++) r.activeTexture(r.TEXTURE0 + i), r.bindTexture(r.TEXTURE_2D, this.textures[i]);
					Fo(t, "renderProgram", this, 3)([e, n]);
				}
			},
			{
				key: "processVisibleItem",
				value: function(e, t, n) {
					var r = this.array, i = Er(n[u]), a = n[d], o = a ? this.atlas[a] : void 0;
					if (typeof a == "string" && !o && f.registerImage(a), r[t++] = n.x, r[t++] = n.y, r[t++] = n.size, r[t++] = i, r[t++] = e, o && typeof o.textureIndex == "number") {
						var s = this.textureImages[o.textureIndex], c = s.width, l = s.height;
						r[t++] = o.x / c, r[t++] = o.y / l, r[t++] = o.size / c, r[t++] = o.size / l, r[t++] = o.textureIndex;
					} else r[t++] = 0, r[t++] = 0, r[t++] = 0, r[t++] = 0, r[t++] = 0;
				}
			},
			{
				key: "setUniforms",
				value: function(e, t) {
					var n = t.gl, r = t.uniformLocations, i = r.u_sizeRatio, a = r.u_correctionRatio, o = r.u_matrix, u = r.u_atlas, d = r.u_colorizeImages, f = r.u_keepWithinCircle, p = r.u_cameraAngle, m = r.u_percentagePadding;
					this.latestRenderParams = e, n.uniform1f(a, e.correctionRatio), n.uniform1f(i, c ? e.sizeRatio : e.sizeRatio / Math.SQRT2), n.uniform1f(p, e.cameraAngle), n.uniform1f(m, l), n.uniformMatrix3fv(o, !1, e.matrix), n.uniform1iv(u, Co(Array(this.textureImages.length)).map(function(e, t) {
						return t;
					})), n.uniform1i(d, +(s === "color")), n.uniform1i(f, +!!c);
				}
			}
		]), t;
	}(qr), Z(t, "ANGLE_1", 0), Z(t, "ANGLE_2", 2 * Math.PI / 3), Z(t, "ANGLE_3", 4 * Math.PI / 3), Z(t, "textureManager", f), t;
}
us(), us({
	keepWithinCircle: !1,
	size: {
		mode: "force",
		value: 256
	},
	drawingMode: "color",
	correctCentering: !0
});
// src/ui/programs.ts
var ds = 5126, fs = 5121, ps = 4, ms = "\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_position;\nattribute float a_size;\nattribute float a_spread;\nattribute float a_angle;\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\nvarying float v_inner;\n\nvoid main() {\n  float inner = a_size * u_correctionRatio / u_sizeRatio * 2.0;\n  float radius = inner * a_spread;\n  // One triangle around the circle: its inscribed circle has the radius, so the corners reach 2x.\n  vec2 diffVector = radius * 2.0 * vec2(cos(a_angle), sin(a_angle));\n  gl_Position = vec4((u_matrix * vec3(a_position + diffVector, 1)).xy, 0, 1);\n  v_diffVector = diffVector;\n  v_radius = radius;\n  v_inner = inner;\n  #ifdef PICKING_MODE\n  v_color = a_id;\n  #else\n  v_color = a_color;\n  #endif\n}\n", hs = "\nprecision highp float;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\nvarying float v_inner;\n\nvoid main(void) {\n  #ifdef PICKING_MODE\n  // The glow isn't part of the node: clicks there go to whatever is underneath.\n  discard;\n  #else\n  float dist = length(v_diffVector);\n  if (dist > v_radius) discard;\n  // Strongest at the node's edge, fading out smoothly. sigma blends premultiplied colours.\n  float t = clamp((dist - v_inner * 0.8) / (v_radius - v_inner * 0.8), 0.0, 1.0);\n  float glow = pow(1.0 - t, 2.2) * v_color.a;\n  gl_FragColor = vec4(v_color.rgb * glow, glow);\n  #endif\n}\n", gs = class extends qr {
	getDefinition() {
		return {
			VERTICES: 3,
			VERTEX_SHADER_SOURCE: ms,
			FRAGMENT_SHADER_SOURCE: hs,
			METHOD: ps,
			UNIFORMS: [
				"u_sizeRatio",
				"u_correctionRatio",
				"u_matrix"
			],
			ATTRIBUTES: [
				{
					name: "a_position",
					size: 2,
					type: ds
				},
				{
					name: "a_size",
					size: 1,
					type: ds
				},
				{
					name: "a_spread",
					size: 1,
					type: ds
				},
				{
					name: "a_color",
					size: 4,
					type: fs,
					normalized: !0
				},
				{
					name: "a_id",
					size: 4,
					type: fs,
					normalized: !0
				}
			],
			CONSTANT_ATTRIBUTES: [{
				name: "a_angle",
				size: 1,
				type: ds
			}],
			CONSTANT_DATA: [
				[0],
				[2 * Math.PI / 3],
				[4 * Math.PI / 3]
			]
		};
	}
	processVisibleItem(e, t, n) {
		let r = n, i = this.array;
		i[t++] = n.x, i[t++] = n.y, i[t++] = n.size, i[t++] = r.haloSpread ?? 2, i[t++] = Er(r.haloColor ?? "rgba(0,0,0,0)"), i[t++] = e;
	}
	setUniforms(e, { gl: t, uniformLocations: n }) {
		t.uniform1f(n.u_correctionRatio, e.correctionRatio), t.uniform1f(n.u_sizeRatio, e.sizeRatio), t.uniformMatrix3fv(n.u_matrix, !1, e.matrix);
	}
};
function _s(e, t) {
	let n = us({
		drawingMode: "background",
		keepWithinCircle: !0,
		objectFit: "cover",
		size: {
			mode: "max",
			value: 96
		},
		crossOrigin: "anonymous",
		debounceTimeout: 40
	}), r = Jr([
		gs,
		n,
		_o({ borders: [
			{
				size: {
					attribute: "borderSize",
					defaultValue: 0,
					mode: "pixels"
				},
				color: {
					attribute: "borderColor",
					defaultValue: "rgba(0,0,0,0)"
				}
			},
			{
				size: {
					attribute: "gapSize",
					defaultValue: 0,
					mode: "pixels"
				},
				color: {
					attribute: "gapColor",
					defaultValue: "rgba(0,0,0,0)"
				}
			},
			{
				size: { fill: !0 },
				color: {
					attribute: "veilColor",
					defaultValue: "rgba(0,0,0,0)"
				}
			}
		] })
	], e, t), i = _o({
		borders: [{
			size: { value: 0 },
			color: { transparent: !0 }
		}, {
			size: { fill: !0 },
			color: { transparent: !0 }
		}],
		drawLabel: e,
		drawHover: t
	});
	return {
		settings: {
			nodeProgramClasses: { person: r },
			nodeHoverProgramClasses: { person: i },
			defaultNodeType: "person"
		},
		textures: n.textureManager
	};
}
// src/ui/theme.ts
function vs(e = document.body) {
	let t = getComputedStyle(e), n = (e, n) => t.getPropertyValue(e).trim() || n;
	return {
		font: n("--cpd-font-family-sans", "Inter, system-ui, sans-serif"),
		bg: n("--cpd-color-bg-canvas-default", "#ffffff"),
		text: n("--cpd-color-text-primary", "#1b1d22"),
		border: n("--cpd-color-border-interactive-secondary", "#cdd3da"),
		dim: n("--cpd-color-border-disabled", "#e1e6ec"),
		accent: n("--cpd-color-border-focused", "#0467dd"),
		hover: n("--cpd-color-icon-secondary", "#656d77"),
		spaceFill: n("--cpd-color-bg-subtle-secondary", "#f0f2f5"),
		groupFill: n("--cpd-color-bg-subtle-primary", "#e1e6ec"),
		labelBg: n("--cpd-color-bg-canvas-default", "#ffffff"),
		unread: n("--cpd-color-icon-success-primary", "#007a62"),
		highlight: n("--cpd-color-icon-critical-primary", "#d51928"),
		decorative: [
			["#e0f8d9", "#005f00"],
			["#e3f5f8", "#00566e"],
			["#faeefb", "#82008f"],
			["#f1efff", "#5d26cd"],
			["#ffecf0", "#9f0850"],
			["#ffefe4", "#9b2200"]
		].map(([e, t], r) => ({
			bg: n(`--cpd-color-bg-decorative-${r + 1}`, e),
			fg: n(`--cpd-color-text-decorative-${r + 1}`, t)
		})),
		highContrast: /(^|\s)cpd-theme-[a-z]+-hc(\s|$)/.test(`${document.documentElement.className} ${document.body.className}`) || typeof matchMedia == "function" && matchMedia("(prefers-contrast: more)").matches
	};
}
var ys = {
	communities: 3,
	events: 5,
	people: 2,
	bridges: 1
};
function bs(e, t) {
	let n = ys[t];
	return n === void 0 ? t === "archive" ? {
		bg: e.dim,
		fg: e.border
	} : {
		bg: e.groupFill,
		fg: e.hover
	} : e.decorative[n];
}
// src/ui/tooltip.ts
var xs = 14;
function Ss(e, t, n, r) {
	if (!e || !t) return;
	let i = n + xs + e.offsetWidth > t.clientWidth ? n - xs - e.offsetWidth : n + xs, a = r + xs + e.offsetHeight > t.clientHeight ? r - xs - e.offsetHeight : r + xs;
	e.style.transform = `translate(${Math.max(4, i)}px, ${Math.max(4, a)}px)`;
}
// node_modules/.pnpm/react@19.3.1/node_modules/react/cjs/react-jsx-runtime.production.js
var Cs = /* @__PURE__ */ o(((e) => {
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
})), $ = (/* @__PURE__ */ o(((e, t) => {
	t.exports = Cs();
})))(), ws = 120, Ts = 250, Es = {
	x: .5,
	y: .5,
	ratio: 1
}, Ds = 120, Os = 36, ks = [
	.9,
	.75,
	.5
];
function As(e) {
	let t = window.React.useRef(null), n = window.React.useRef(null), r = window.React.useRef(null), i = window.React.useRef(e);
	i.current = e;
	let a = window.React.useRef(null), o = window.React.useRef(null), s = window.React.useRef(null), c = window.React.useRef({
		x: 0,
		y: 0
	}), [l, u] = window.React.useState(null), [d, f] = window.React.useState(!1), p = (e) => {
		let t = a.current;
		t && (o.current?.cancel(), i.current.animate ? o.current = Fn(t.getCamera(), e) : t.getCamera().setState(e));
	};
	window.React.useEffect(() => {
		let r = t.current, s = vs(), { graph: c, sectors: l } = e.layout, d, h;
		try {
			let e = Ns(s);
			h = _s(e, e), d = new ja(c, r, {
				...Ms(s, i),
				...h.settings
			});
		} catch (e) {
			console.warn("[people-map] Can't render the map", e), f(!0);
			return;
		}
		a.current = d;
		let g = e.layout.outer + 10 + Os;
		d.setCustomBBox({
			x: [-g, g],
			y: [-g, g]
		});
		let _ = !e.camera && e.animate && c.order > 1;
		e.camera ? d.getCamera().setState(e.camera) : _ && d.getCamera().setState({
			x: .5,
			y: .5,
			ratio: js * 2 / (2 * g)
		}), d.getCamera().on("updated", ({ x: e, y: t, ratio: n }) => i.current.onCameraChange?.({
			x: e,
			y: t,
			ratio: n
		}));
		let v, y = () => {
			clearTimeout(v), h.textures?.off("newTexture", b), f(!0), _ && setTimeout(() => p(Es), Ds);
		}, b = () => void requestAnimationFrame(y);
		h.textures && c.someNode((e, t) => !!i.current.avatarUrl?.(t.avatar)) ? (h.textures.on("newTexture", b), v = setTimeout(y, Ts)) : y(), d.on("afterRender", () => {
			let e = n.current, t = e?.getContext("2d");
			if (!e || !t) return;
			let a = r.clientWidth, o = r.clientHeight, c = window.devicePixelRatio || 1;
			(e.width !== Math.round(a * c) || e.height !== Math.round(o * c)) && (e.width = Math.round(a * c), e.height = Math.round(o * c)), t.setTransform(c, 0, 0, c, 0, 0), t.clearRect(0, 0, a, o);
			let u = (e, t) => d.graphToViewport({
				x: Math.cos(t) * e,
				y: Math.sin(t) * e
			}), f = (e, n, r, i = !1) => {
				let a = Math.max(2, Math.ceil((r - n) * 48 / Math.PI));
				for (let o = 0; o <= a; o++) {
					let s = u(e, i ? r - (r - n) * o / a : n + (r - n) * o / a);
					o === 0 && !i ? t.moveTo(s.x, s.y) : t.lineTo(s.x, s.y);
				}
			}, { layout: p, matches: m } = i.current, h = s.highContrast;
			for (let e of l) {
				let n = bs(s, e.district);
				t.beginPath(), f(p.inner - 5, e.a0, e.a1), f(e.r1, e.a0, e.a1, !0), t.closePath(), t.fillStyle = h ? "transparent" : Pa(n.bg, m ? .35 : .6), t.fill(), t.lineWidth = 1, t.strokeStyle = h ? s.border : Na(n.fg, s.bg, .25), t.stroke();
			}
			t.save(), t.setLineDash([3, 5]), t.strokeStyle = s.border, t.lineWidth = 1;
			let g = p.outer - p.inner;
			for (let e of ks) {
				let n = p.inner + (1 - e) * g;
				n >= p.outer || (t.beginPath(), f(n, 0, Math.PI * 2), t.stroke());
			}
			t.restore(), t.font = `600 13px ${s.font}`;
			for (let e of l) {
				let n = (e.a0 + e.a1) / 2, r = u(e.r1, n), i = u(e.r1 + 1, n), a = i.x - r.x, o = i.y - r.y, c = Math.hypot(a, o) || 1, l = r.x + a / c * 10, d = r.y + o / c * 10;
				t.textAlign = a / c > .3 ? "left" : a / c < -.3 ? "right" : "center", t.textBaseline = o / c > .3 ? "top" : o / c < -.3 ? "bottom" : "middle";
				let f = `${e.label} · ${e.count}`;
				t.lineJoin = "round", t.lineWidth = 3.5, t.strokeStyle = s.bg, t.strokeText(f, l, d), t.fillStyle = h ? s.text : bs(s, e.district).fg, t.fillText(f, l, d);
			}
		});
		let x;
		d.on("enterNode", ({ node: e, event: t }) => {
			clearTimeout(x), r.style.cursor = "pointer", u(d.getGraph().getNodeAttributes(e)), m(t.x, t.y);
		}), d.on("leaveNode", () => {
			r.style.cursor = "", x = setTimeout(() => u(null), ws);
		});
		let S = (e) => {
			let t = r.getBoundingClientRect();
			m(e.clientX - t.left, e.clientY - t.top);
		}, C = () => u(null), w = () => o.current?.cancel();
		return r.addEventListener("mousemove", S), r.addEventListener("mouseleave", C), r.addEventListener("wheel", w, { passive: !0 }), r.addEventListener("mousedown", w), r.addEventListener("touchstart", w, { passive: !0 }), d.on("clickNode", ({ node: e }) => i.current.onActivate(d.getGraph().getNodeAttribute(e, "personId"))), d.on("doubleClickNode", (e) => e.preventSigmaDefault()), d.on("clickStage", () => p(Es)), () => {
			clearTimeout(v), clearTimeout(x), h.textures?.off("newTexture", b), o.current?.cancel(), r.removeEventListener("mousemove", S), r.removeEventListener("mouseleave", C), r.removeEventListener("wheel", w), r.removeEventListener("mousedown", w), r.removeEventListener("touchstart", w), d.kill(), a.current = null;
		};
	}, []), window.React.useEffect(() => {
		a.current?.refresh({ skipIndexation: !0 });
	}, [
		e.matches,
		e.selected,
		e.glow,
		e.avatarVersion
	]), window.React.useEffect(() => {
		let t = a.current, n = e.focus;
		if (!t || !n) return;
		let r = (n.people ?? (n.personId ? [n.personId] : [])).map(Wt).filter((e) => t.getGraph().hasNode(e));
		if (n.overview || !r.length) return p(Es);
		let i = t.getGraph(), o = r.map((e) => i.getNodeAttribute(e, "x")), s = r.map((e) => i.getNodeAttribute(e, "y")), c = r.map((e) => t.getNodeDisplayData(e)), { x: l } = t.getCustomBBox() ?? t.getBBox(), u = Math.max(Math.max(...o) - Math.min(...o), Math.max(...s) - Math.min(...s)) * 1.25 + 160;
		p({
			x: (Math.min(...c.map((e) => e.x)) + Math.max(...c.map((e) => e.x))) / 2,
			y: (Math.min(...c.map((e) => e.y)) + Math.max(...c.map((e) => e.y))) / 2,
			ratio: Math.min(1, u / (l[1] - l[0]))
		});
	}, [e.focus]), window.React.useLayoutEffect(() => m(c.current.x, c.current.y), [l]);
	let m = (e, n) => {
		c.current = {
			x: e,
			y: n
		}, Ss(r.current, t.current, e, n);
	}, h = l && e.tooltip?.(l);
	return h && (s.current = h), /* @__PURE__ */ (0, $.jsxs)("div", {
		className: "pm-stage",
		children: [
			/* @__PURE__ */ (0, $.jsx)("canvas", {
				ref: n,
				className: "pm-under",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, $.jsx)("div", {
				ref: t,
				className: `pm-map${d ? " pm-map--ready" : ""}`,
				role: "img",
				"aria-label": e.label
			}),
			/* @__PURE__ */ (0, $.jsx)("div", {
				ref: r,
				className: "pm-tooltip",
				"data-visible": !!h,
				"aria-hidden": "true",
				children: h || s.current
			}),
			e.children
		]
	});
}
var js = 40;
function Ms(e, t) {
	let n = Fa(e.bg, .7);
	return {
		allowInvalidContainer: !0,
		renderEdgeLabels: !1,
		zIndex: !0,
		stagePadding: 24,
		labelFont: e.font,
		labelSize: 12,
		labelWeight: "600",
		labelColor: { color: e.text },
		labelRenderedSizeThreshold: 0,
		itemSizesReference: "positions",
		zoomToSizeRatioFunction: (e) => e,
		minCameraRatio: .01,
		maxCameraRatio: 2,
		nodeReducer: (r, i) => {
			let { matches: a, selected: o, glow: s, avatarUrl: c } = t.current, l = i.personId !== void 0 && !!s?.has(i.personId), u = !a || i.personId !== void 0 && a.has(i.personId), d = l || i.me || u && !(s && s.size > 1), f = {
				...i,
				type: "person",
				forceLabel: !0
			};
			f.color = d ? bs(e, i.district).bg : e.dim, d ? f.image = c?.(i.avatar) : Object.assign(f, {
				label: "",
				veilColor: n,
				zIndex: -1
			});
			let p, m = 0;
			return i.me ? (p = e.text, m = 3) : i.presence === "online" ? (p = e.unread, m = 3) : i.hasDm && (p = Na(e.text, e.bg, .55), m = 1.5), d && p && Object.assign(f, {
				borderColor: p,
				borderSize: m
			}), l ? (Object.assign(f, {
				borderColor: e.accent,
				borderSize: 3,
				zIndex: 1e3,
				label: i.label,
				size: i.size * 1.3
			}), e.highContrast || Object.assign(f, {
				haloColor: Pa(e.accent, .55),
				haloSpread: 3
			}), delete f.veilColor) : i.personId !== void 0 && i.personId === o && (Object.assign(f, {
				borderColor: e.accent,
				borderSize: 4,
				zIndex: 1e3,
				label: i.label
			}), e.highContrast || Object.assign(f, {
				haloColor: Pa(e.accent, .5),
				haloSpread: 1.4
			}), delete f.veilColor), f.borderSize && Object.assign(f, {
				gapSize: 1.5,
				gapColor: e.bg
			}), f;
		}
	};
}
function Ns(e) {
	let t = (e, t, n) => Math.min(1, Math.max(0, (e - t) / (n - t)));
	return (n, r, i) => {
		if (!r.label) return;
		let a = r;
		if (n.save(), n.textAlign = "center", n.textBaseline = "middle", a.image || (n.globalAlpha = t(r.size, 4, 7), n.globalAlpha > 0 && (n.font = `600 ${Math.max(9, Math.min(28, r.size * .9))}px ${i.labelFont}`, n.fillStyle = a.district ? bs(e, a.district).fg : e.text, n.fillText(Ps(r.label), r.x, r.y + .5))), n.globalAlpha = a.me ? 1 : t(r.size, 7, 11), n.globalAlpha > 0) {
			let t = a.me ? 13 : Math.min(13, Math.max(10, r.size / 2.5));
			n.font = `600 ${t}px ${i.labelFont}`;
			let o = Fs(n, r.label, Math.max(r.size * 3, 90)), s = n.measureText(o).width, c = t + 6, l = r.y + r.size + 3;
			n.fillStyle = e.labelBg, n.beginPath(), n.roundRect(r.x - s / 2 - 6, l, s + 12, c, c / 2), n.fill(), n.fillStyle = e.text, n.fillText(o, r.x, l + c / 2);
		}
		n.restore();
	};
}
function Ps(e) {
	return (Array.from(e.replace(/^[@#!+]/, "").trim())[0] ?? "?").toUpperCase();
}
function Fs(e, t, n) {
	if (e.measureText(t).width <= n) return t;
	let r = Array.from(t);
	for (; r.length && e.measureText(r.join("") + "…").width > n;) r.pop();
	return r.length ? r.join("").trimEnd() + "…" : "";
}
// src/ui/PeopleOverlay.tsx
var Is = [
	"closeness",
	"recent",
	"rooms",
	"name"
], Ls = [
	"all",
	"dm",
	"server",
	"bridged"
];
function Rs(e) {
	let { data: t, t: n } = e, r = window.React.useId(), i = window.React.useId(), a = window.React.useRef(null), [o, s] = window.React.useState(""), [c, l] = window.React.useState("all"), [u, d] = window.React.useState(e.sort), [f, p] = window.React.useState(0), [m, h] = window.React.useState(null), [g, _] = window.React.useState(null), [v, y] = window.React.useState(), [b, x] = window.React.useState(null), [S, C] = window.React.useState(e.legendOpen), w = window.React.useRef(0), T = window.React.useMemo(() => [...t.people.values()], [t]), E = (e) => T.filter((t) => t.rooms.includes(e)).map((e) => e.id);
	window.React.useEffect(() => a.current?.focus(), []), window.React.useEffect(() => {
		e.avatars?.request([...T].sort((e, t) => t.closeness - e.closeness).map((e) => e.avatar));
	}, [T]);
	let D = window.React.useMemo(() => {
		let t = T.filter((t) => c === "all" || c === "dm" && !!t.dm || c === "server" && t.server === e.myServer || c === "bridged" && t.kind === "bridged"), n = o.trim();
		return n ? Vn(t, n, {
			keys: ["name", (e) => e.id.slice(1)],
			baseSort: (e, t) => t.item.closeness - e.item.closeness
		}) : t.sort(Ws(u));
	}, [
		T,
		c,
		o,
		u,
		e.myServer
	]), O = window.React.useMemo(() => o.trim() || c !== "all" ? new Set(D.map((e) => e.id)) : null, [
		D,
		o,
		c
	]), k = D.slice(0, 200), A = v ? t.people.get(v) : void 0, j = (e) => {
		y(e), h(null), _(null), x({
			personId: e,
			overview: !e,
			nonce: ++w.current
		});
	}, ee = (e) => {
		_(new Set(e)), x({
			people: e,
			nonce: ++w.current
		});
	};
	return /* @__PURE__ */ (0, $.jsx)("div", {
		className: "pm-backdrop",
		onMouseDown: (t) => t.target === t.currentTarget && e.onClose(),
		children: /* @__PURE__ */ (0, $.jsxs)("div", {
			className: "pm-panel",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": r,
			onKeyDown: (t) => {
				if (t.key === "Escape") t.preventDefault(), A ? j(void 0) : e.onClose();
				else if (!A) {
					if (t.key === "ArrowDown" || t.key === "ArrowUp") {
						t.preventDefault();
						let e = Math.max(0, Math.min(k.length - 1, f + (t.key === "ArrowDown" ? 1 : -1)));
						p(e), h(k[e] ? /* @__PURE__ */ new Set([k[e].id]) : null), document.getElementById(`${i}-${e}`)?.scrollIntoView?.({ block: "nearest" });
					} else t.key === "Enter" && k[f] && (t.preventDefault(), j(k[f].id));
				}
			},
			children: [
				/* @__PURE__ */ (0, $.jsxs)("header", {
					className: "pm-header",
					children: [
						/* @__PURE__ */ (0, $.jsx)("h2", {
							id: r,
							className: "pm-title",
							children: n(`${M}title`)
						}),
						/* @__PURE__ */ (0, $.jsx)("span", {
							className: "pm-count",
							children: Gs(n, "count", t.people.size)
						}),
						/* @__PURE__ */ (0, $.jsx)("input", {
							ref: a,
							className: "pm-search",
							type: "search",
							placeholder: n(`${M}search`),
							"aria-label": n(`${M}search`),
							"aria-controls": i,
							value: o,
							onChange: (e) => {
								s(e.target.value), p(0), h(null), _(null), A && y(void 0);
							}
						}),
						/* @__PURE__ */ (0, $.jsx)("button", {
							type: "button",
							className: "pm-close",
							"aria-label": n(`${M}close`),
							onClick: e.onClose,
							children: "×"
						})
					]
				}),
				/* @__PURE__ */ (0, $.jsxs)("div", {
					className: "pm-body",
					children: [/* @__PURE__ */ (0, $.jsx)(As, {
						layout: e.layout,
						matches: O,
						selected: v,
						glow: m ?? g,
						focus: b,
						label: n(`${M}canvas_label`),
						onActivate: (e) => j(e || void 0),
						avatarUrl: e.avatars?.get.bind(e.avatars),
						avatarVersion: e.avatarVersion,
						tooltip: (r) => {
							let i = r.personId ? t.people.get(r.personId) : void 0;
							return i ? /* @__PURE__ */ (0, $.jsxs)($.Fragment, { children: [
								/* @__PURE__ */ (0, $.jsx)("div", {
									className: "pm-tip-title",
									children: i.name
								}),
								/* @__PURE__ */ (0, $.jsx)("div", {
									className: "pm-tip-meta",
									children: i.id
								}),
								/* @__PURE__ */ (0, $.jsx)("div", {
									className: "pm-tip-meta",
									children: Us(i, e, n)
								}),
								/* @__PURE__ */ (0, $.jsx)("div", {
									className: "pm-tip-action",
									children: n(`${M}tip_action`)
								})
							] }) : /* @__PURE__ */ (0, $.jsx)("div", {
								className: "pm-tip-title",
								children: n(`${M}you`)
							});
						},
						camera: e.camera,
						animate: e.animate,
						onCameraChange: e.onCameraChange,
						children: /* @__PURE__ */ (0, $.jsx)(Hs, {
							open: S,
							t: n,
							onToggle: () => {
								C(!S), e.onLegendToggle(!S);
							}
						})
					}), /* @__PURE__ */ (0, $.jsx)("div", {
						className: "pm-side",
						children: A ? /* @__PURE__ */ (0, $.jsx)(zs, {
							person: A,
							...e,
							onBack: () => j(void 0),
							onPointRoom: (e) => h(e ? new Set(E(e)) : null),
							onZoomRoom: (e) => ee(E(e))
						}) : /* @__PURE__ */ (0, $.jsxs)($.Fragment, { children: [/* @__PURE__ */ (0, $.jsxs)("div", {
							className: "pm-controls",
							children: [/* @__PURE__ */ (0, $.jsx)("div", {
								className: "pm-chips",
								role: "group",
								"aria-label": n(`${M}filter`),
								children: Ls.map((e) => /* @__PURE__ */ (0, $.jsx)("button", {
									type: "button",
									className: "pm-chip",
									"aria-pressed": c === e,
									onMouseDown: (e) => e.preventDefault(),
									onClick: () => {
										l(e), p(0);
									},
									children: n(`${M}filter_${e}`)
								}, e))
							}), /* @__PURE__ */ (0, $.jsxs)("label", {
								className: "pm-sort",
								children: [/* @__PURE__ */ (0, $.jsx)("span", { children: n(`${M}sort`) }), /* @__PURE__ */ (0, $.jsx)("select", {
									value: u,
									onChange: (t) => {
										let n = t.target.value;
										d(n), e.onSortChange(n);
									},
									children: Is.map((e) => /* @__PURE__ */ (0, $.jsx)("option", {
										value: e,
										children: n(`${M}sort_${e}`)
									}, e))
								})]
							})]
						}), k.length === 0 ? /* @__PURE__ */ (0, $.jsx)("div", {
							className: "pm-empty",
							children: o.trim() ? n(`${M}no_results`, { query: o }) : n(`${M}empty`)
						}) : /* @__PURE__ */ (0, $.jsxs)("ul", {
							id: i,
							role: "listbox",
							className: "pm-list",
							"aria-label": n(`${M}title`),
							onMouseLeave: () => h(null),
							children: [k.map((t, r) => /* @__PURE__ */ (0, $.jsxs)("li", {
								id: `${i}-${r}`,
								role: "option",
								"aria-selected": r === f,
								className: "pm-item",
								onMouseEnter: () => h(/* @__PURE__ */ new Set([t.id])),
								onMouseDown: (e) => e.preventDefault(),
								onClick: () => {
									p(r), j(t.id);
								},
								children: [
									/* @__PURE__ */ (0, $.jsx)(Vs, {
										person: t,
										url: e.avatars?.get(t.avatar)
									}),
									/* @__PURE__ */ (0, $.jsxs)("span", {
										className: "pm-item-text",
										children: [/* @__PURE__ */ (0, $.jsx)("span", {
											className: "pm-item-name",
											children: t.name
										}), /* @__PURE__ */ (0, $.jsx)("span", {
											className: "pm-item-meta",
											children: Us(t, e, n)
										})]
									}),
									t.presence === "online" && /* @__PURE__ */ (0, $.jsx)("span", {
										className: "pm-online",
										title: n("datanauten_people_map_presence_online")
									}),
									/* @__PURE__ */ (0, $.jsx)(Bs, {
										label: n(`${M}zoom_person`, { name: t.name }),
										onClick: () => {
											p(r), ee([t.id]);
										}
									})
								]
							}, t.id)), D.length > k.length && /* @__PURE__ */ (0, $.jsxs)("li", {
								className: "pm-more",
								children: ["+", D.length - k.length]
							})]
						})] })
					})]
				}),
				/* @__PURE__ */ (0, $.jsxs)("footer", {
					className: "pm-footer",
					children: [/* @__PURE__ */ (0, $.jsx)("span", { children: n(`${M}hint`) }), /* @__PURE__ */ (0, $.jsxs)("span", {
						className: "pm-version",
						children: ["v", tr]
					})]
				})
			]
		})
	});
}
function zs(e) {
	let { person: t, t: n, graph: r } = e, i = e.data.groups.find((e) => e.key === t.group), a = [
		Gs(n, "rooms", t.rooms.filter((e) => e !== t.dm).length),
		t.spaces.length ? Gs(n, "spaces", t.spaces.length) : "",
		t.dm ? n(`${M}dm`) : "",
		t.admin ? Gs(n, "admin", t.admin) : "",
		t.moderator ? Gs(n, "moderator", t.moderator) : "",
		t.interactions ? Gs(n, "interactions", t.interactions) : "",
		t.messages ? Gs(n, "messages", t.messages) : "",
		t.lastContact ? n(`${M}last_contact`, { when: Ks(t.lastContact, e.language) }) : ""
	].filter(Boolean), o = t.rooms.filter((e) => e !== t.dm);
	return /* @__PURE__ */ (0, $.jsxs)("div", {
		className: "pm-card",
		"data-testid": "people-map-card",
		children: [
			/* @__PURE__ */ (0, $.jsxs)("button", {
				type: "button",
				className: "pm-back",
				onClick: e.onBack,
				children: ["‹ ", n(`${M}back`)]
			}),
			/* @__PURE__ */ (0, $.jsxs)("div", {
				className: "pm-card-head",
				children: [/* @__PURE__ */ (0, $.jsx)(Vs, {
					person: t,
					url: e.avatars?.get(t.avatar),
					large: !0
				}), /* @__PURE__ */ (0, $.jsxs)("div", {
					className: "pm-card-names",
					children: [
						/* @__PURE__ */ (0, $.jsx)("div", {
							className: "pm-card-name",
							children: t.name
						}),
						/* @__PURE__ */ (0, $.jsx)("div", {
							className: "pm-card-id",
							children: t.id
						}),
						/* @__PURE__ */ (0, $.jsxs)("div", {
							className: "pm-card-tags",
							children: [
								t.presence && /* @__PURE__ */ (0, $.jsx)("span", {
									className: `pm-tag pm-tag--${t.presence}`,
									children: n(`datanauten_people_map_presence_${t.presence}`)
								}),
								t.kind === "bridged" && t.network && /* @__PURE__ */ (0, $.jsx)("span", {
									className: "pm-tag",
									children: n("datanauten_people_map_bridged_from", { network: t.network })
								}),
								t.kind === "bot" && /* @__PURE__ */ (0, $.jsx)("span", {
									className: "pm-tag",
									children: n("datanauten_people_map_bot")
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, $.jsxs)("div", {
				className: "pm-card-actions",
				children: [t.dm && /* @__PURE__ */ (0, $.jsx)("button", {
					type: "button",
					className: "pm-button pm-button--primary",
					onClick: () => e.onOpenRoom(t.dm),
					children: n("datanauten_people_map_open_dm")
				}), /* @__PURE__ */ (0, $.jsx)("button", {
					type: "button",
					className: "pm-button",
					onClick: () => e.onOpenProfile(t.id),
					children: n(`${M}open_profile`)
				})]
			}),
			i && /* @__PURE__ */ (0, $.jsx)("div", {
				className: "pm-card-context",
				children: n("datanauten_people_map_known_from", { place: i.label })
			}),
			/* @__PURE__ */ (0, $.jsxs)("div", {
				className: "pm-closeness",
				children: [
					/* @__PURE__ */ (0, $.jsx)("span", { children: n(`${M}closeness`) }),
					/* @__PURE__ */ (0, $.jsx)("span", {
						className: "pm-meter",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, $.jsx)("span", { style: { width: `${Math.round(t.closeness * 100)}%` } })
					}),
					/* @__PURE__ */ (0, $.jsx)("span", {
						className: "pm-closeness-text",
						children: n(`${M}closeness_value`, { percent: `${Math.round(t.closeness * 100)} %` })
					})
				]
			}),
			/* @__PURE__ */ (0, $.jsx)("ul", {
				className: "pm-facts",
				children: a.map((e) => /* @__PURE__ */ (0, $.jsx)("li", { children: e }, e))
			}),
			o.length > 0 && /* @__PURE__ */ (0, $.jsxs)($.Fragment, { children: [/* @__PURE__ */ (0, $.jsx)("div", {
				className: "pm-section-title",
				children: n("datanauten_people_map_shared_rooms")
			}), /* @__PURE__ */ (0, $.jsx)("ul", {
				className: "pm-rooms",
				onMouseLeave: () => e.onPointRoom(void 0),
				children: o.map((t) => {
					let i = r.rooms.get(t)?.name ?? t;
					return /* @__PURE__ */ (0, $.jsxs)("li", {
						className: "pm-room-row",
						onMouseEnter: () => e.onPointRoom(t),
						children: [/* @__PURE__ */ (0, $.jsxs)("button", {
							type: "button",
							className: "pm-room",
							onClick: () => e.onOpenRoom(t),
							onFocus: () => e.onPointRoom(t),
							children: [/* @__PURE__ */ (0, $.jsx)("span", {
								className: "pm-room-name",
								children: i
							}), /* @__PURE__ */ (0, $.jsx)("span", {
								className: "pm-room-meta",
								children: r.rooms.get(t)?.members
							})]
						}), /* @__PURE__ */ (0, $.jsx)(Bs, {
							label: n("datanauten_people_map_zoom_room", { name: i }),
							onClick: () => e.onZoomRoom(t)
						})]
					}, t);
				})
			})] })
		]
	});
}
function Bs(e) {
	return /* @__PURE__ */ (0, $.jsx)("button", {
		type: "button",
		className: "pm-zoom",
		"aria-label": e.label,
		title: e.label,
		onMouseDown: (e) => e.preventDefault(),
		onClick: (t) => {
			t.stopPropagation(), e.onClick();
		},
		children: /* @__PURE__ */ (0, $.jsxs)("svg", {
			viewBox: "0 0 16 16",
			width: "16",
			height: "16",
			"aria-hidden": "true",
			children: [/* @__PURE__ */ (0, $.jsx)("circle", {
				cx: "7",
				cy: "7",
				r: "4.5",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.6"
			}), /* @__PURE__ */ (0, $.jsx)("path", {
				d: "M10.4 10.4 14 14M7 5v4M5 7h4",
				stroke: "currentColor",
				strokeWidth: "1.6",
				strokeLinecap: "round"
			})]
		})
	});
}
function Vs(e) {
	let [t, n] = window.React.useState(!1);
	return /* @__PURE__ */ (0, $.jsx)("span", {
		className: `pm-avatar pm-avatar--c${qs(e.person.id) + 1}${e.large ? " pm-avatar--large" : ""}`,
		"aria-hidden": "true",
		children: e.url && !t ? /* @__PURE__ */ (0, $.jsx)("img", {
			src: e.url,
			alt: "",
			onError: () => n(!0)
		}) : Ps(e.person.name)
	});
}
function Hs(e) {
	let { t } = e, n = window.React.useId();
	return /* @__PURE__ */ (0, $.jsxs)("div", {
		className: "pm-legend",
		"data-open": e.open,
		children: [/* @__PURE__ */ (0, $.jsx)("button", {
			type: "button",
			className: "pm-legend-toggle",
			"aria-expanded": e.open,
			"aria-controls": n,
			onClick: e.onToggle,
			children: t(`${M}legend`)
		}), e.open && /* @__PURE__ */ (0, $.jsx)("ul", {
			id: n,
			className: "pm-legend-list",
			children: [
				"middle",
				"sector",
				"size",
				"online",
				"dm"
			].map((e) => /* @__PURE__ */ (0, $.jsxs)("li", { children: [/* @__PURE__ */ (0, $.jsx)("span", {
				className: `pm-swatch pm-swatch--${e}`,
				"aria-hidden": "true"
			}), t(`datanauten_people_map_legend_${e}`)] }, e))
		})]
	});
}
function Us(e, t, n) {
	let r = t.data.groups.find((t) => t.key === e.group)?.label;
	return [
		Gs(n, "rooms", e.rooms.filter((t) => t !== e.dm).length),
		e.dm ? n(`${M}dm`) : "",
		r ?? "",
		e.lastContact ? Ks(e.lastContact, t.language) : ""
	].filter(Boolean).join(" · ");
}
function Ws(e) {
	let t = (e, t) => e.name.localeCompare(t.name);
	switch (e) {
		case "recent": return (e, t) => t.lastContact - e.lastContact || t.closeness - e.closeness;
		case "rooms": return (e, t) => t.rooms.length - e.rooms.length || t.closeness - e.closeness;
		case "name": return t;
		default: return (e, n) => n.closeness - e.closeness || t(e, n);
	}
}
function Gs(e, t, n) {
	return e(`${M}${t}_${n === 1 ? "one" : "other"}`, { count: String(n) });
}
function Ks(e, t, n = Date.now()) {
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
function qs(e) {
	let t = 0;
	for (let n = 0; n < e.length; n++) t += e.charCodeAt(n);
	return t % 6;
}
// src/ui/people.css?inline
var Js = ".pm-backdrop{z-index:5000;font-family:var(--cpd-font-family-sans,Inter, system-ui, sans-serif);background:#0000008c;justify-content:center;align-items:center;padding:3vh 3vw;animation:.1s ease-out pm-fade;display:flex;position:fixed;inset:0}.pm-panel{background:var(--cpd-color-bg-canvas-default,#fff);width:100%;height:100%;color:var(--cpd-color-text-primary,#1b1d22);border-radius:16px;flex-direction:column;display:flex;overflow:hidden;box-shadow:0 24px 64px #00000059}.pm-header{border-bottom:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);align-items:center;gap:12px;padding:12px 16px;display:flex}.pm-title{margin:0;font-size:18px;font-weight:600;line-height:24px}.pm-search{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);min-width:0;height:36px;color:inherit;font:inherit;border-radius:8px;flex:1;padding:0 12px;font-size:15px}.pm-search:focus-visible,.pm-close:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}.pm-close{width:36px;height:36px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:none;border-radius:50%;font-size:24px;line-height:1}.pm-close:hover{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);color:inherit}.pm-body{flex:1;min-height:0;display:flex;position:relative}.pm-stage{background:var(--cpd-color-bg-canvas-default,#fff);flex:1;min-width:0;position:relative;overflow:hidden}.pm-under,.pm-map{width:100%;height:100%;position:absolute;inset:0}.pm-under{pointer-events:none}.pm-map{touch-action:none;opacity:0}.pm-map--ready{opacity:1;transition:opacity .16s ease-out}.pm-tooltip{z-index:2;opacity:0;background:var(--cpd-color-bg-action-primary-rest,#1b1d22);max-width:280px;color:var(--cpd-color-text-on-solid-primary,#fff);pointer-events:none;border-radius:8px;padding:8px 10px;font-size:12px;line-height:16px;transition:opacity .12s ease-out;position:absolute;top:0;left:0;box-shadow:0 4px 16px #00000040}.pm-tooltip[data-visible=true]{opacity:1}.pm-tip-title{overflow-wrap:anywhere;font-size:14px;font-weight:600;line-height:20px}.pm-tip-meta{opacity:.8;overflow-wrap:anywhere}.pm-tip-action{opacity:.65;margin-top:6px}.pm-legend{z-index:1;border:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);background:var(--cpd-color-bg-canvas-default,#fff);border-radius:10px;max-width:260px;font-size:12px;position:absolute;bottom:12px;left:12px;box-shadow:0 2px 8px #00000014}.pm-legend-toggle{width:100%;color:var(--cpd-color-text-secondary,#656d77);font:inherit;text-align:left;cursor:pointer;background:0 0;border:none;padding:6px 10px;font-weight:600}.pm-legend-toggle:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:-2px;border-radius:10px}.pm-legend-list{margin:0;padding:0 10px 8px;list-style:none}.pm-legend-list li{align-items:center;gap:8px;padding:3px 0;display:flex}.pm-side{border-left:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);background:var(--cpd-color-bg-canvas-default,#fff);flex:none;width:320px;padding:8px;overflow-y:auto}.pm-empty{color:var(--cpd-color-text-secondary,#656d77);padding:6px 8px 8px;font-size:14px}.pm-list{margin:0;padding:0;list-style:none}.pm-item{cursor:pointer;border-radius:8px;align-items:center;gap:10px;padding:6px 8px;display:flex}.pm-item:hover{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}.pm-item[aria-selected=true]{background:var(--cpd-color-bg-action-secondary-hovered,#f0f2f5);box-shadow:inset 3px 0 0 var(--cpd-color-border-focused,#0467dd)}.pm-avatar{border-radius:50%;flex:none;justify-content:center;align-items:center;width:28px;height:28px;font-size:14px;font-weight:600;display:flex;overflow:hidden}.pm-avatar img{object-fit:cover;width:100%;height:100%}.pm-avatar--c1{background:var(--cpd-color-bg-decorative-1,#e0f8d9);color:var(--cpd-color-text-decorative-1,#005f00)}.pm-avatar--c2{background:var(--cpd-color-bg-decorative-2,#e3f5f8);color:var(--cpd-color-text-decorative-2,#00566e)}.pm-avatar--c3{background:var(--cpd-color-bg-decorative-3,#faeefb);color:var(--cpd-color-text-decorative-3,#82008f)}.pm-avatar--c4{background:var(--cpd-color-bg-decorative-4,#f1efff);color:var(--cpd-color-text-decorative-4,#5d26cd)}.pm-avatar--c5{background:var(--cpd-color-bg-decorative-5,#ffecf0);color:var(--cpd-color-text-decorative-5,#9f0850)}.pm-avatar--c6{background:var(--cpd-color-bg-decorative-6,#ffefe4);color:var(--cpd-color-text-decorative-6,#9b2200)}.pm-item-text{flex-direction:column;flex:1;min-width:0;display:flex}.pm-footer{border-top:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);color:var(--cpd-color-text-secondary,#656d77);align-items:center;gap:12px;padding:8px 16px;font-size:12px;display:flex}.pm-footer>span{flex:1}.pm-footer>.pm-version{opacity:.7;font-variant-numeric:tabular-nums;flex:none}@media (width<=640px){.pm-backdrop{padding:0}.pm-panel{border-radius:0}.pm-header{flex-wrap:wrap}.pm-search{flex-basis:100%;order:3}.pm-side{z-index:1;border:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);border-radius:12px;width:auto;max-height:40%;position:absolute;bottom:12px;left:12px;right:12px;box-shadow:0 4px 16px #0000001f}.pm-footer{display:none}.pm-legend{top:12px;bottom:auto}}.pm-settings-container{margin-top:var(--cpd-space-6x,24px)}.pm-settings .mx_SettingsSubsection_content{flex-direction:column;gap:16px;display:flex}.pm-setting{cursor:pointer;align-items:flex-start;gap:12px;display:flex}.pm-setting-text{flex-direction:column;flex:1;gap:2px;display:flex}.pm-setting-label{color:var(--cpd-color-text-primary,#1b1d22);font:var(--cpd-font-body-md-medium,500 1rem/1.5rem Inter, sans-serif);padding:0}.pm-setting-help{color:var(--cpd-color-text-secondary,#656d77);font:var(--cpd-font-body-sm-regular,400 .875rem/1.25rem Inter, sans-serif)}.pm-switch{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);appearance:none;background:var(--cpd-color-bg-canvas-default,#fff);cursor:pointer;border-radius:12px;flex:none;width:44px;height:24px;margin:0;transition:background-color .12s ease-out;position:relative}.pm-switch:after{content:\"\";background:var(--cpd-color-icon-secondary,#656d77);border-radius:50%;width:16px;height:16px;transition:transform .12s ease-out;position:absolute;top:3px;left:3px}.pm-switch:checked{border-color:var(--cpd-color-bg-accent-rest,#0b7a5a);background:var(--cpd-color-bg-accent-rest,#0b7a5a)}.pm-switch:checked:after{background:var(--cpd-color-icon-on-solid-primary,#fff);transform:translate(20px)}.pm-switch:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:2px}.pm-setting-error{color:var(--cpd-color-text-critical-primary,#d51928);font:var(--cpd-font-body-sm-regular,400 .875rem/1.25rem Inter, sans-serif)}@keyframes pm-fade{0%{opacity:0}}@media (prefers-reduced-motion:reduce){.pm-backdrop{animation:none}.pm-map--ready,.pm-tooltip,.pm-switch,.pm-switch:after{transition:none}}.pm-count{color:var(--cpd-color-text-secondary,#656d77);font-variant-numeric:tabular-nums;white-space:nowrap;font-size:13px}.pm-side{flex-direction:column;gap:6px;display:flex}.pm-controls{border-bottom:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);flex-direction:column;gap:8px;padding:4px 4px 8px;display:flex}.pm-chips{flex-wrap:wrap;gap:6px;display:flex}.pm-chip{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;border-radius:999px;padding:4px 10px;font-size:13px;font-weight:500}.pm-chip[aria-pressed=true]{border-color:var(--cpd-color-bg-action-primary-rest,#1b1d22);background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff)}.pm-sort{color:var(--cpd-color-text-secondary,#656d77);align-items:center;gap:8px;font-size:13px;display:flex}.pm-sort select{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;border-radius:6px;padding:3px 6px}.pm-chip:focus-visible,.pm-sort select:focus-visible,.pm-button:focus-visible,.pm-back:focus-visible,.pm-room:focus-visible,.pm-zoom:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}.pm-list{overflow-y:auto}.pm-item-name,.pm-item-meta{white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.pm-item-meta{color:var(--cpd-color-text-secondary,#656d77);font-size:12px}.pm-online{background:var(--cpd-color-icon-success-primary,#007a62);border-radius:50%;flex:none;width:8px;height:8px}.pm-more{color:var(--cpd-color-text-secondary,#656d77);text-align:center;padding:8px;font-size:12px}.pm-avatar--large{width:64px;height:64px;font-size:28px}.pm-card{flex-direction:column;gap:12px;padding:4px;display:flex}.pm-back{color:var(--cpd-color-text-secondary,#656d77);font:inherit;cursor:pointer;background:0 0;border:none;border-radius:6px;align-self:flex-start;padding:4px 8px;font-size:13px;font-weight:600}.pm-back:hover{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}.pm-card-head{align-items:center;gap:12px;display:flex}.pm-card-names{flex-direction:column;gap:2px;min-width:0;display:flex}.pm-card-name{overflow-wrap:anywhere;font-size:18px;font-weight:600;line-height:24px}.pm-card-id{color:var(--cpd-color-text-secondary,#656d77);overflow-wrap:anywhere;font-size:13px}.pm-card-tags{flex-wrap:wrap;gap:4px;margin-top:2px;display:flex}.pm-tag{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);color:var(--cpd-color-text-secondary,#656d77);border-radius:999px;padding:1px 8px;font-size:12px;font-weight:500}.pm-tag--online{background:var(--cpd-color-bg-success-subtle,#e0f8d9);color:var(--cpd-color-text-success-primary,#007a62)}.pm-card-actions{gap:8px;display:flex}.pm-button{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;border-radius:999px;padding:6px 16px;font-size:14px;font-weight:600}.pm-button--primary{border-color:var(--cpd-color-bg-action-primary-rest,#1b1d22);background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff)}.pm-card-context{font-size:14px;font-weight:500}.pm-closeness{grid-template-columns:auto 1fr;align-items:center;gap:4px 10px;font-size:13px;display:grid}.pm-meter{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);border-radius:3px;height:6px;overflow:hidden}.pm-meter>span{background:var(--cpd-color-border-focused,#0467dd);border-radius:3px;height:100%;display:block}.pm-closeness-text{color:var(--cpd-color-text-secondary,#656d77);grid-column:1/-1;font-size:12px}.pm-facts{flex-direction:column;gap:4px;margin:0;padding:0;font-size:13px;list-style:none;display:flex}.pm-section-title{color:var(--cpd-color-text-secondary,#656d77);letter-spacing:.04em;text-transform:uppercase;font-size:12px;font-weight:600}.pm-rooms{margin:0;padding:0;list-style:none}.pm-room-row{border-radius:6px;align-items:center;gap:2px;display:flex}.pm-room-row:hover{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}.pm-room{min-width:0;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;border:none;border-radius:6px;flex:1;gap:8px;padding:5px 8px;font-size:14px;display:flex}.pm-zoom{width:28px;height:28px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:flex}.pm-zoom:hover{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);color:var(--cpd-color-icon-primary,#1b1d22)}.pm-item .pm-zoom{opacity:0}.pm-item:hover .pm-zoom,.pm-item[aria-selected=true] .pm-zoom,.pm-zoom:focus-visible{opacity:1}.pm-room-name{white-space:nowrap;text-overflow:ellipsis;flex:1;min-width:0;overflow:hidden}.pm-room-meta{color:var(--cpd-color-text-secondary,#656d77);font-variant-numeric:tabular-nums;font-size:12px}.pm-swatch{box-sizing:border-box;background:var(--cpd-color-bg-decorative-4,#f1efff);border-radius:50%;flex:none;width:16px;height:16px}.pm-swatch--middle{border:3px solid var(--cpd-color-text-primary,#1b1d22)}.pm-swatch--sector{background:var(--cpd-color-bg-decorative-4,#f1efff);border:1px solid var(--cpd-color-text-decorative-4,#5d26cd);border-radius:2px 14px 2px 2px}.pm-swatch--size{width:10px;height:10px;box-shadow:9px 0 0 -1px var(--cpd-color-bg-decorative-4,#f1efff);margin:0 3px}.pm-swatch--online{border:3px solid var(--cpd-color-icon-success-primary,#007a62)}.pm-swatch--dm{border:2px solid color-mix(in srgb, var(--cpd-color-text-primary,#1b1d22) 45%, transparent)}";
// src/ui/SettingsSection.tsx
function Ys(e) {
	let { store: t, t: n } = e, r = window.React.useSyncExternalStore(t.subscribe, t.get), [i, a] = window.React.useState(!1), o = window.React.useId(), s = (e) => {
		a(!1), t.set(e).catch((e) => {
			console.error("[people-map] Couldn't save the settings", e), a(!0);
		});
	};
	return /* @__PURE__ */ (0, $.jsxs)("div", {
		className: "mx_SettingsSubsection pm-settings",
		"data-testid": "people-map-settings",
		role: "group",
		"aria-labelledby": o,
		children: [
			/* @__PURE__ */ (0, $.jsx)("div", {
				className: "mx_SettingsSubsectionHeading",
				children: /* @__PURE__ */ (0, $.jsx)("h3", {
					id: o,
					className: "mx_Heading_h4 mx_SettingsSubsectionHeading_heading",
					children: n(`${M}settings_title`)
				})
			}),
			/* @__PURE__ */ (0, $.jsx)("div", {
				className: "mx_SettingsSubsection_description",
				children: /* @__PURE__ */ (0, $.jsx)("div", {
					className: "mx_SettingsSubsection_text",
					children: n(`${M}settings_description`, { key: e.triggerLabel })
				})
			}),
			/* @__PURE__ */ (0, $.jsxs)("div", {
				className: "mx_SettingsSubsection_content",
				children: [[
					"largeRooms",
					"bots",
					"animations",
					"cacheAvatars"
				].map((e) => /* @__PURE__ */ (0, $.jsxs)("label", {
					className: "pm-setting",
					children: [/* @__PURE__ */ (0, $.jsx)("input", {
						type: "checkbox",
						role: "switch",
						className: "pm-switch",
						checked: r[e],
						onChange: (t) => s({ [e]: t.target.checked })
					}), /* @__PURE__ */ (0, $.jsxs)("span", {
						className: "pm-setting-text",
						children: [/* @__PURE__ */ (0, $.jsx)("span", {
							className: "pm-setting-label",
							children: n(`${M}settings_${e}`)
						}), /* @__PURE__ */ (0, $.jsx)("span", {
							className: "pm-setting-help",
							children: n(`${M}settings_${e}_help`, { count: "150" })
						})]
					})]
				}, e)), i && /* @__PURE__ */ (0, $.jsx)("div", {
					className: "pm-setting-error",
					role: "alert",
					children: n("datanauten_people_map_settings_error")
				})]
			})
		]
	});
}
// src/index.tsx
var Xs = "de.datanauten.people_map", Zs = "de-datanauten-people-map-style", Qs = "de.datanauten.people_map.legend", $s = "de.datanauten.people_map.sort";
function ec(e) {
	let t = e ?? {};
	if (typeof t != "object") throw Error("expected an object");
	let n = { trigger_key: "Alt+P" };
	if (t.trigger_key !== void 0) {
		if (typeof t.trigger_key != "string") throw Error("trigger_key must be a string");
		n.trigger_key = t.trigger_key;
	}
	return kn(n.trigger_key), n;
}
var tc = class {
	api;
	static moduleApiVersion = "^2.0.0";
	config;
	trigger;
	settings;
	settingsInjector;
	unsubscribeSettings;
	container;
	root;
	built;
	camera;
	restoreFocus;
	avatars;
	constructor(e) {
		this.api = e;
	}
	async load() {
		try {
			this.config = ec(this.api.config.get(Xs));
		} catch (e) {
			throw console.error(`[people-map] Invalid "${Xs}" config`, e), Error("Errors in module configuration for the people map module");
		}
		this.trigger = kn(this.config.trigger_key), this.api.i18n.register(ee), ic(), this.settings = new Cn(this.api), this.settings.start(), this.unsubscribeSettings = this.settings.subscribe(this.onSettingsChange), this.settingsInjector = new Dn((e) => this.mountSettings(e), () => this.api.i18n.translate("common|spaces")), this.settingsInjector.start(), window.addEventListener("keydown", this.onKeyDown, { capture: !0 });
	}
	dispose() {
		this.close(), window.removeEventListener("keydown", this.onKeyDown, { capture: !0 }), this.unsubscribeSettings?.(), this.settings?.stop(), this.settingsInjector?.stop(), this.avatars?.cache.dispose(), this.avatars = void 0;
	}
	isOpen() {
		return !!this.root;
	}
	open() {
		if (this.root) return;
		let e = mn();
		if (!e?.getUserId?.()) {
			console.warn("[people-map] Element's Matrix client isn't available");
			return;
		}
		let t = performance.now();
		this.avatars?.client !== e && (this.avatars?.cache.dispose(), this.avatars = {
			client: e,
			cache: new p(e, () => this.settings.get().cacheAvatars)
		}, this.camera = void 0), this.built = this.build(e), this.restoreFocus = document.activeElement, this.container = document.createElement("div"), this.container.className = "de-datanauten-people-map", document.body.appendChild(this.container), this.container.addEventListener("keydown", (e) => e.stopPropagation()), this.root = this.api.createRoot(this.container), this.render(), requestAnimationFrame(() => requestAnimationFrame(() => console.debug(`[people-map] Opened in ${Math.round(performance.now() - t)} ms (${this.built?.data.people.size} people, ${this.built?.graph.rooms.size} rooms)`)));
	}
	close() {
		this.root && (this.root.unmount(), this.container?.remove(), this.root = void 0, this.container = void 0, this.built = void 0, this.restoreFocus?.focus?.(), this.restoreFocus = void 0);
	}
	build(e) {
		let t = hn(e), n = this.settings.get(), r = on(e, t, {
			largeRooms: n.largeRooms,
			bots: n.bots,
			names: this.groupNames(),
			labels: this.labels()
		}), i = e.getUser?.(r.me), a = Gt(r, i?.displayName || this.t("datanauten_people_map_you"), i?.avatarUrl || void 0);
		return a.graph.getNodeAttribute("me", "avatar") && this.avatars?.cache.request([a.graph.getNodeAttribute("me", "avatar")]), {
			graph: t,
			data: r,
			layout: a
		};
	}
	render() {
		this.root && this.built && this.root.render(/* @__PURE__ */ (0, $.jsx)(this.App, { built: this.built }));
	}
	onSettingsChange = () => {
		if (this.settings.get().cacheAvatars || p.clearPersisted(), !this.root) return;
		let e = this.avatars?.client;
		e && (this.camera = void 0, this.root.unmount(), this.root = this.api.createRoot(this.container), this.built = this.build(e), this.render());
	};
	onKeyDown = (e) => {
		e.isComposing || e.defaultPrevented || !An(e, this.trigger) || (e.preventDefault(), e.stopImmediatePropagation(), this.root ? this.close() : this.open());
	};
	openRoom(e) {
		this.close(), this.api.navigation.openRoom(e);
	}
	openProfile(e) {
		this.close(), this.api.navigation.toMatrixToLink(`https://matrix.to/#/${encodeURIComponent(e)}`);
	}
	mountSettings(e) {
		let t = this.api.createRoot(e);
		return t.render(/* @__PURE__ */ (0, $.jsx)(Ys, {
			store: this.settings,
			t: this.t,
			triggerLabel: jn(this.trigger)
		})), () => t.unmount();
	}
	t = (e, t) => this.api.i18n.translate(e, t);
	groupNames() {
		let e = (e) => this.t(`${M}group_${e}`);
		return {
			..._,
			older: e("older"),
			smallGroups: e("small"),
			loose: e("loose"),
			otherSpaces: e("spaces"),
			junk: e("junk"),
			nameless: e("nameless"),
			solo: e("solo")
		};
	}
	labels() {
		return {
			dms: this.t(`${M}label_dms`),
			dmsOlder: this.t(`${M}label_dms_older`),
			other: this.t(`${M}label_other`)
		};
	}
	App = ({ built: e }) => {
		let t = this.avatars?.cache, n = window.React.useSyncExternalStore((e) => t?.subscribe(e) ?? (() => {}), () => t?.getVersion() ?? 0), r = window.React.useSyncExternalStore(this.settings.subscribe, this.settings.get);
		return /* @__PURE__ */ (0, $.jsx)(Rs, {
			data: e.data,
			layout: e.layout,
			graph: e.graph,
			myServer: rn(e.data.me),
			language: this.api.i18n.language,
			sort: Is.find((e) => e === nc($s)) ?? "closeness",
			legendOpen: nc(Qs) === "open",
			camera: this.camera,
			animate: r.animations && !In(),
			avatars: t,
			avatarVersion: n,
			triggerLabel: jn(this.trigger),
			t: this.t,
			onSortChange: (e) => rc($s, e),
			onLegendToggle: (e) => rc(Qs, e ? "open" : "closed"),
			onCameraChange: (e) => this.camera = e,
			onOpenRoom: (e) => this.openRoom(e),
			onOpenProfile: (e) => this.openProfile(e),
			onClose: () => this.close()
		});
	};
};
function nc(e) {
	try {
		return localStorage.getItem(e) ?? void 0;
	} catch {
		return;
	}
}
function rc(e, t) {
	try {
		localStorage.setItem(e, t);
	} catch {}
}
function ic() {
	if (document.getElementById(Zs)) return;
	let e = document.createElement("style");
	e.id = Zs, e.textContent = Js, document.head.appendChild(e);
}
export { Xs as CONFIG_KEY, tc as PeopleMapModule, tc as default, ec as parseConfig };

//# sourceMappingURL=index.js.map