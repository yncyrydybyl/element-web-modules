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
}) : o, n)), l = 96, u = 6, d = 100, f = class {
	client;
	urls = /* @__PURE__ */ new Map();
	colours = /* @__PURE__ */ new Map();
	seen = /* @__PURE__ */ new Set();
	queue = [];
	listeners = /* @__PURE__ */ new Set();
	running = 0;
	version = 0;
	notifyTimer;
	disposed = !1;
	constructor(e) {
		this.client = e;
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
		for (; this.running < u && this.queue.length;) {
			let e = this.queue.shift();
			this.running++, this.load(e).finally(() => {
				this.running--, this.pump();
			});
		}
	}
	async load(e) {
		let t = await this.fetch(e, !0) ?? await this.fetch(e, !1);
		if (!t || this.disposed) return;
		let n = await p(t);
		this.disposed || (this.urls.set(e, URL.createObjectURL(t)), n && this.colours.set(e, n), this.notifyTimer ??= setTimeout(() => {
			this.notifyTimer = void 0, this.version++;
			for (let e of this.listeners) e();
		}, d));
	}
	async fetch(e, t) {
		let n = this.client.mxcUrlToHttp?.(e, l, l, "crop", !1, !0, t), r = t ? this.client.getAccessToken?.() : void 0;
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
async function p(e) {
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
// src/i18n.ts
var m = "datanauten_space_room_map_", h = {
	[`${m}title`]: {
		en: "Map",
		de: "Karte"
	},
	[`${m}canvas_label`]: {
		en: "Map of your spaces and rooms",
		de: "Karte deiner Spaces und Räume"
	},
	[`${m}search`]: {
		en: "Search rooms and spaces",
		de: "Räume und Spaces suchen"
	},
	[`${m}close`]: {
		en: "Close",
		de: "Schließen"
	},
	[`${m}district_communities`]: {
		en: "Communities",
		de: "Communities"
	},
	[`${m}district_events`]: {
		en: "Events",
		de: "Events"
	},
	[`${m}district_people`]: {
		en: "People",
		de: "Personen"
	},
	[`${m}district_bridges`]: {
		en: "Bridges",
		de: "Brücken"
	},
	[`${m}district_unsorted`]: {
		en: "Unsorted",
		de: "Unsortiert"
	},
	[`${m}district_archive`]: {
		en: "Archive",
		de: "Archiv"
	},
	[`${m}group_older`]: {
		en: "%(network)s (older)",
		de: "%(network)s (älter)"
	},
	[`${m}group_small`]: {
		en: "Small groups",
		de: "Kleine Gruppen"
	},
	[`${m}group_loose`]: {
		en: "Loose rooms",
		de: "Lose Räume"
	},
	[`${m}group_spaces`]: {
		en: "Other spaces",
		de: "Weitere Spaces"
	},
	[`${m}group_junk`]: {
		en: "Deleted & tests",
		de: "Gelöscht & Tests"
	},
	[`${m}group_nameless`]: {
		en: "No name",
		de: "Ohne Namen"
	},
	[`${m}group_solo`]: {
		en: "Only you",
		de: "Nur du"
	},
	[`${m}results`]: {
		en: "Results",
		de: "Treffer"
	},
	[`${m}no_results`]: {
		en: "Nothing matches “%(query)s”.",
		de: "Nichts passt zu „%(query)s“."
	},
	[`${m}hint`]: {
		en: "Point at a space or use ↑↓ to show it on the map · Enter open · Esc close · scroll to zoom, drag to pan",
		de: "Auf einen Space zeigen oder ↑↓, um ihn auf der Karte zu zeigen · Enter öffnet · Esc schließt · Scrollen zoomt, Ziehen verschiebt"
	},
	[`${m}empty`]: {
		en: "No rooms yet.",
		de: "Noch keine Räume."
	},
	[`${m}spaces`]: {
		en: "Places",
		de: "Orte"
	},
	[`${m}all_spaces`]: {
		en: "Everything",
		de: "Alles"
	},
	[`${m}space_rooms_one`]: {
		en: "%(count)s room",
		de: "%(count)s Raum"
	},
	[`${m}space_rooms_other`]: {
		en: "%(count)s rooms",
		de: "%(count)s Räume"
	},
	[`${m}tip_action_zoom`]: {
		en: "Click to zoom in",
		de: "Klicken zum Hineinzoomen"
	},
	[`${m}tip_group`]: {
		en: "Group",
		de: "Gruppe"
	},
	[`${m}tip_invite`]: {
		en: "Invitation",
		de: "Einladung"
	},
	[`${m}tip_dm`]: {
		en: "Direct message",
		de: "Direktnachricht"
	},
	[`${m}tip_space_one`]: {
		en: "Space · %(count)s room",
		de: "Space · %(count)s Raum"
	},
	[`${m}tip_space_other`]: {
		en: "Space · %(count)s rooms",
		de: "Space · %(count)s Räume"
	},
	[`${m}tip_room_one`]: {
		en: "Room · %(count)s member",
		de: "Raum · %(count)s Mitglied"
	},
	[`${m}tip_room_other`]: {
		en: "Room · %(count)s members",
		de: "Raum · %(count)s Mitglieder"
	},
	[`${m}tip_unread_one`]: {
		en: "%(count)s unread",
		de: "%(count)s ungelesen"
	},
	[`${m}tip_unread_other`]: {
		en: "%(count)s unread",
		de: "%(count)s ungelesen"
	},
	[`${m}tip_mentions_one`]: {
		en: "%(count)s mention",
		de: "%(count)s Erwähnung"
	},
	[`${m}tip_mentions_other`]: {
		en: "%(count)s mentions",
		de: "%(count)s Erwähnungen"
	},
	[`${m}tip_also`]: {
		en: "Also on: %(spaces)s",
		de: "Auch auf: %(spaces)s"
	},
	[`${m}tip_current`]: {
		en: "You're here",
		de: "Du bist hier"
	},
	[`${m}tip_action_open`]: {
		en: "Click to open",
		de: "Klicken zum Öffnen"
	},
	[`${m}tip_action_space`]: {
		en: "Click to zoom in, click again to open",
		de: "Klicken zum Hineinzoomen, nochmal klicken zum Öffnen"
	},
	[`${m}legend`]: {
		en: "Legend",
		de: "Legende"
	},
	[`${m}legend_unread`]: {
		en: "Unread messages",
		de: "Ungelesene Nachrichten"
	},
	[`${m}legend_current`]: {
		en: "Room you're in",
		de: "Raum, in dem du bist"
	},
	[`${m}legend_selected`]: {
		en: "Selected in the list",
		de: "In der Liste ausgewählt"
	},
	[`${m}legend_space_circle`]: {
		en: "Space, with its rooms inside",
		de: "Space, mit seinen Räumen darin"
	},
	[`${m}legend_colour`]: {
		en: "Avatar or colour: just the room's own, like in Element",
		de: "Avatar oder Farbe: nur die des Raums, wie in Element"
	},
	[`${m}legend_dim`]: {
		en: "Pale: nothing unread, or doesn't match the search",
		de: "Blass: nichts Ungelesenes, oder passt nicht zur Suche"
	},
	[`${m}legend_highlight`]: {
		en: "Mentions you (pulses)",
		de: "Erwähnt dich (pulsiert)"
	},
	[`${m}legend_line`]: {
		en: "Line: a space; branches are its sub-spaces",
		de: "Linie: ein Space; Abzweige sind seine Sub-Spaces"
	},
	[`${m}legend_station`]: {
		en: "Station: a room",
		de: "Station: ein Raum"
	},
	[`${m}legend_interchange`]: {
		en: "Interchange: a sub-space, or a room in several spaces",
		de: "Umstieg: ein Sub-Space, oder ein Raum in mehreren Spaces"
	},
	[`${m}view`]: {
		en: "View",
		de: "Ansicht"
	},
	[`${m}view_circles`]: {
		en: "Circles",
		de: "Kreise"
	},
	[`${m}view_tube`]: {
		en: "Tube map",
		de: "U-Bahn-Plan"
	},
	[`${m}tube_label`]: {
		en: "Tube map of your spaces and rooms",
		de: "U-Bahn-Plan deiner Spaces und Räume"
	}
};
// src/rooms.ts
function g() {
	let e = window.mxMatrixClientPeg;
	try {
		return e?.get?.() ?? void 0;
	} catch {
		return;
	}
}
function _(e) {
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
		})).filter((t) => t.id !== e.roomId && r.has(t.id)).sort((e, t) => b(e.order, t.order) || r.get(e.id).name.localeCompare(r.get(t.id).name));
		for (let e of n) t.children.push(e.id), r.get(e.id).parents.push(t.id);
	}
	let a = (e, t) => r.get(e).name.localeCompare(r.get(t).name), o = [...r.values()], s = o.filter((e) => e.kind === "space" && e.parents.length === 0).map((e) => e.id), c = y(r, s);
	for (let e of o) e.kind === "space" && !c.has(e.id) && (s.push(e.id), y(r, [e.id], c));
	return {
		rooms: r,
		topSpaces: s.sort(a),
		orphans: o.filter((e) => e.kind === "room" && e.parents.length === 0).map((e) => e.id).sort(a),
		dms: o.filter((e) => e.kind === "dm" && e.parents.length === 0).map((e) => e.id).sort(a)
	};
}
function v(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e.stores.roomListStore.getRooms().value) t.set(n.id, {
		id: n.id,
		name: n.name.value || n.id,
		kind: "room",
		aliases: [],
		members: 1,
		lastActive: n.getLastActiveTimestamp(),
		unread: 0,
		highlight: 0,
		invite: !1,
		children: [],
		parents: []
	});
	return {
		rooms: t,
		topSpaces: [],
		orphans: [...t.keys()],
		dms: []
	};
}
function y(e, t, n = /* @__PURE__ */ new Set()) {
	let r = [...t];
	for (; r.length;) {
		let t = r.pop();
		n.has(t) || (n.add(t), r.push(...e.get(t)?.children ?? []));
	}
	return n;
}
function b(e, t) {
	let n = (e) => typeof e == "string" && e.length <= 50 && /^[\x20-\x7E]*$/.test(e);
	return n(e) && n(t) ? e < t ? -1 : +(e > t) : n(e) ? -1 : +!!n(t);
}
function x(e, t = window.location.hash) {
	let n = /^#\/room\/([^/?]+)/.exec(t);
	if (!n) return;
	let r = decodeURIComponent(n[1]);
	if (e.rooms.has(r)) return r;
	for (let t of e.rooms.values()) if (t.aliases.includes(r)) return t.id;
}
function S(e, t) {
	let n = [], r = /* @__PURE__ */ new Set([t]), i = e.rooms.get(t)?.parents[0];
	for (; i && !r.has(i);) r.add(i), n.unshift(e.rooms.get(i).name), i = e.rooms.get(i)?.parents[0];
	return n;
}
// src/trigger.ts
var C = typeof navigator < "u" && navigator.platform.toUpperCase().includes("MAC");
function w(e, t = C) {
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
function T(e, t) {
	let n = e.key.length === 1 ? e.key.toLowerCase() : e.key, r = /^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : void 0;
	return (n === t.key || !/^[a-z]$/.test(n) && r === t.key) && e.ctrlKey === t.ctrl && e.metaKey === t.meta && e.altKey === t.alt && e.shiftKey === t.shift;
}
function E(e, t = C) {
	let n = [
		e.ctrl && (t ? "⌃" : "Ctrl"),
		e.alt && (t ? "⌥" : "Alt"),
		e.shift && (t ? "⇧" : "Shift"),
		e.meta && (t ? "⌘" : "Meta")
	], r = e.key.length === 1 ? e.key.toUpperCase() : e.key;
	return [...n.filter(Boolean), r].join(t ? "" : "+");
}
// package.json
var D = "0.3.1", O = [
	"communities",
	"events",
	"people",
	"bridges",
	"unsorted",
	"archive"
], k = {
	older: "%(network)s (older)",
	smallGroups: "Small groups",
	loose: "Loose rooms",
	otherSpaces: "Other spaces",
	junk: "Deleted & tests",
	nameless: "No name",
	solo: "Only you"
}, A = [
	["WhatsApp", /whatsapp|\(WA\)|@whatsapp_/i],
	["Telegram", /telegram|\(TG\)|@telegram_/i],
	["Signal", /signal|@signal_/i],
	["Discord", /discord|@discord_/i],
	["Slack", /slack|@slack_/i],
	["IRC", /\birc\b|libera|oftc/i]
], j = /\b(19|20)\d{2}\b|\b\d{1,2}c3\b|camp|conference|congress|summit|fosdem|froscon|fossasia|hackathon|meetup|festival|workation|easterhegg|ethberlin|ethbrno|\bevents?\b/i, M = /^(deleted|test|testing|tmp|old)\b|^\(deleted|\btest-?room\b/i, N = 15552e6, ee = 10, P = 3, te = /* @__PURE__ */ new Set([
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
function ne(e) {
	return A.find(([, t]) => t.test(e))?.[0];
}
function re(e, t = k, n = Date.now()) {
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
	}, c = (t) => ne(e.rooms.get(t).name), l = (e) => j.test(e.name) || e.aliases.some((e) => /events\.|\.events/.test(e)), u = (t) => {
		let n = /* @__PURE__ */ new Set(), r = e.rooms.get(t)?.parents[0];
		for (; r && !n.has(r);) {
			if (n.add(r), l(e.rooms.get(r))) return r;
			r = e.rooms.get(r)?.parents[0];
		}
	}, d = [...e.rooms.values()].filter((e) => e.kind !== "space"), f = [];
	for (let r of d) {
		let i = [r.name, ...r.aliases].join(" "), o = s(r.id), l = o.map(c).find(Boolean), d = ne(i) ?? l, p = r.name.startsWith("@") || r.name.startsWith("!");
		if (M.test(r.name)) a("archive/junk", "archive", t.junk, r.id);
		else if (r.name.startsWith("!") && !o.length) a("archive/nameless", "archive", t.nameless, r.id);
		else if (r.members <= 1 && r.kind !== "dm" && !o.length) a("archive/solo", "archive", t.solo, r.id);
		else if (r.kind === "dm" || r.members <= 2 && (p || !o.length || l)) {
			let e = d ?? "Matrix";
			e === "Matrix" && r.lastActive > 0 && n - r.lastActive > N ? a("people/Matrix-older", "people", t.older.replace("%(network)s", e), r.id) : a(`people/${e}`, "people", e, r.id);
		} else if (o.length && !l) {
			let t = u(r.id), n = t ?? o[0];
			a(`${t ? "events" : "communities"}/${n}`, t ? "events" : "communities", e.rooms.get(n).name, r.id, n);
		} else d ? a(`bridges/${d}`, "bridges", d, r.id) : f.push(r);
	}
	let p = /* @__PURE__ */ new Map();
	for (let t of e.topSpaces) {
		let n = ie(e.rooms.get(t).name);
		n && !p.has(n) && p.set(n, e.rooms.get(t));
	}
	let m = se(f, (e) => ie(e.name)), h = se(f, (e) => ae(e)), g = ce(d.map(ae));
	for (let n of f) {
		let r = ie(n.name), i = r ? p.get(r) : void 0, o = ae(n);
		if (i && e.rooms.get(i.id)) {
			let e = l(i);
			a(`${e ? "events" : "communities"}/${i.id}`, e ? "events" : "communities", i.name, n.id, i.id);
		} else l(n) && r && (m.get(r)?.length ?? 0) >= P ? a(`events/~${r}`, "events", oe(r), n.id) : r && (m.get(r)?.length ?? 0) >= P ? a(`unsorted/~${r}`, "unsorted", oe(r), n.id) : o && o !== g && (h.get(o)?.length ?? 0) >= P ? a(`unsorted/@${o}`, "unsorted", o, n.id) : n.members <= ee && !n.aliases.length ? a("people/groups", "people", t.smallGroups, n.id) : a("unsorted/loose", "unsorted", t.loose, n.id);
	}
	let _ = new Set([...r.values()].map((e) => e.spaceId));
	for (let n of e.topSpaces) _.has(n) || a("unsorted/spaces", "unsorted", t.otherSpaces, n);
	let v = (e) => O.indexOf(e.district);
	return {
		groups: [...r.values()].sort((e, t) => v(e) - v(t) || t.rooms.length - e.rooms.length || e.label.localeCompare(t.label)),
		home: i
	};
}
function ie(e) {
	let t = /^[\s[(#]*([\p{L}\p{N}][\p{L}\p{N}.+'-]*)/u.exec(e)?.[1]?.toLowerCase().replace(/[.'-]+$/, "");
	return t && t.length >= 2 && !te.has(t) ? t : void 0;
}
function ae(e) {
	return (e.aliases[0] ?? e.id).split(":").slice(1).join(":") || void 0;
}
function oe(e) {
	return e.charAt(0).toUpperCase() + e.slice(1);
}
function se(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e) {
		let e = t(r);
		e !== void 0 && n.set(e, [...n.get(e) ?? [], r]);
	}
	return n;
}
function ce(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) n !== void 0 && t.set(n, (t.get(n) ?? 0) + 1);
	return [...t].sort((e, t) => t[1] - e[1])[0]?.[0];
}
// node_modules/.pnpm/match-sorter@8.3.0/node_modules/match-sorter/dist/match-sorter.esm.js
var le = /* @__PURE__ */ c((/* @__PURE__ */ o(((e, t) => {
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
})))()), F = {
	CASE_SENSITIVE_EQUAL: 7,
	EQUAL: 6,
	STARTS_WITH: 5,
	WORD_STARTS_WITH: 4,
	CONTAINS: 3,
	ACRONYM: 2,
	MATCHES: 1,
	NO_MATCH: 0
}, ue = (e, t) => String(e.rankedValue).localeCompare(String(t.rankedValue));
function de(e, t, n = {}) {
	return fe(e, t, n).map(({ item: e }) => e);
}
function fe(e, t, n) {
	let { keys: r, threshold: i = F.MATCHES, baseSort: a = ue, sorter: o = (e) => e.sort((e, t) => ve(e, t, a)) } = n;
	return o(e.reduce(s, []));
	function s(e, a, o) {
		let s = pe(a, r, t, n), { rank: c, keyThreshold: l = i } = s;
		return c >= l && e.push({
			...s,
			item: a,
			index: o
		}), e;
	}
}
de.rankings = F;
function pe(e, t, n, r) {
	if (!t) {
		let t = e;
		return {
			rankedValue: t,
			rank: he(t, n, r),
			keyIndex: -1,
			keyThreshold: r.threshold
		};
	}
	return Se(e, t).reduce(({ rank: e, rankedValue: t, keyIndex: i, keyThreshold: a }, { itemValue: o, attributes: s }, c) => {
		let l = he(o, n, r), u = t, { minRanking: d, maxRanking: f, threshold: p } = s;
		return l < d && l >= F.MATCHES ? l = d : l > f && (l = f), l > e && (e = l, i = c, a = p, u = o), {
			rankedValue: u,
			rank: e,
			keyIndex: i,
			keyThreshold: a
		};
	}, {
		rankedValue: e,
		rank: F.NO_MATCH,
		keyIndex: -1,
		keyThreshold: r.threshold
	});
}
function* me(e, t) {
	let n = -1;
	for (; (n = e.indexOf(t, n + 1)) > -1;) yield n;
	return -1;
}
function he(e, t, n) {
	if (e = ye(e, n), t = ye(t, n), t.length > e.length) return F.NO_MATCH;
	if (e === t) return F.CASE_SENSITIVE_EQUAL;
	e = e.toLowerCase(), t = t.toLowerCase();
	let r = me(e, t), i = r.next(), a = i.value;
	if (e.length === t.length && a === 0) return F.EQUAL;
	if (a === 0) return F.STARTS_WITH;
	let o = i;
	for (; !o.done;) {
		if (o.value > 0 && e[o.value - 1] === " ") return F.WORD_STARTS_WITH;
		o = r.next();
	}
	return a > 0 ? F.CONTAINS : t.length === 1 ? F.NO_MATCH : ge(e).includes(t) ? F.ACRONYM : _e(e, t);
}
function ge(e) {
	let t = "", n = " ";
	for (let r = 0; r < e.length; r++) {
		let i = e.charAt(r);
		(n === " " || n === "-") && i !== " " && i !== "-" && (t += i), n = i;
	}
	return t;
}
function _e(e, t) {
	let n = 0, r = 0;
	function i(e, t, r) {
		for (let i = r, a = t.length; i < a; i++) if (t[i] === e) return n += 1, i + 1;
		return -1;
	}
	function a(e) {
		let r = 1 / e, i = n / t.length;
		return F.MATCHES + i * r;
	}
	let o = i(t[0], e, 0);
	if (o < 0) return F.NO_MATCH;
	r = o;
	for (let n = 1, a = t.length; n < a; n++) {
		let a = t[n];
		if (r = i(a, e, r), !(r > -1)) return F.NO_MATCH;
	}
	return a(r - o);
}
function ve(e, t, n) {
	let { rank: r, keyIndex: i } = e, { rank: a, keyIndex: o } = t;
	return r === a ? i === o ? n(e, t) : i < o ? -1 : 1 : r > a ? -1 : 1;
}
function ye(e, { keepDiacritics: t }) {
	return e = `${e}`, t || (e = (0, le.default)(e)), e;
}
function be(e, t) {
	typeof t == "object" && (t = t.key);
	let n;
	if (typeof t == "function") n = t(e);
	else if (e == null) n = null;
	else if (Object.hasOwnProperty.call(e, t)) n = e[t];
	else if (t.includes(".")) return xe(t, e);
	else n = null;
	return n == null ? [] : Array.isArray(n) ? n : [String(n)];
}
function xe(e, t) {
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
function Se(e, t) {
	let n = [];
	for (let r = 0, i = t.length; r < i; r++) {
		let i = t[r], a = we(i), o = be(e, i);
		for (let e = 0, t = o.length; e < t; e++) n.push({
			itemValue: o[e],
			attributes: a
		});
	}
	return n;
}
var Ce = {
	maxRanking: Infinity,
	minRanking: -Infinity
};
function we(e) {
	return typeof e == "string" ? Ce : {
		...Ce,
		...e
	};
}
// src/search.ts
function Te(e, t, n) {
	let r = t.trim(), i = n.limit ?? 8, a = [...e.rooms.values()].filter((e) => e.id !== n.exclude);
	return r ? de(a, r, {
		keys: ["name", (e) => e.aliases.map((e) => e.slice(1))],
		baseSort: (e, t) => n.rank(t.item) - n.rank(e.item)
	}).slice(0, i) : [];
}
var Ee = 12, De = 4, Oe = 84, ke = 56, Ae = 40, je = 70, Me = 200, Ne = {
	WhatsApp: "#25a35a",
	Telegram: "#229ed9",
	Signal: "#3a76f0",
	Discord: "#5865f2",
	Slack: "#9b4f96"
}, Pe = 138, Fe = 6e3;
function Ie(e, t, n, r = 1.6) {
	let i = 0, a = 0, o = [], s = (n) => {
		let r = {
			lines: [],
			stations: [],
			width: 0,
			height: 0
		}, o = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Map(), c = (r, i = /* @__PURE__ */ new Set()) => {
			if (!n.spaceId) return !1;
			if (s.has(r)) return s.get(r);
			if (i.has(r)) return !1;
			i.add(r);
			let a = (e.rooms.get(r)?.children ?? []).some((r) => e.rooms.get(r)?.kind === "space" ? c(r, i) : t.home.get(r) === n.key);
			return s.set(r, a), a;
		}, l = (r) => n.spaceId ? e.rooms.get(r)?.kind === "space" ? c(r) : t.home.get(r) === n.key : !0, u = 20, d = 0, f = (t, s, p, m, h) => {
			o.add(t);
			let g = e.rooms.get(t), _ = {
				id: t,
				roomId: g?.id,
				label: s,
				colour: g ? i++ : -1,
				hex: g ? void 0 : Ne[n.label] ?? void 0,
				district: n.district,
				depth: m,
				parent: h?.parent,
				points: [],
				stations: [],
				unread: 0,
				highlight: 0
			};
			r.lines.push(_);
			let v = p.filter((t) => e.rooms.has(t) && l(t)).slice(0, Math.max(0, Fe - a));
			a += v.length;
			let y = (t) => e.rooms.get(t).kind === "space" && !o.has(t) && c(t), b = [...v.filter(y), ...v.filter((e) => !y(e))], x = v.filter(y).length, S = h ? h.col + 1 : 0, C = S + x, w = Math.max(De, Ee - C, Math.ceil(Math.sqrt((b.length - x) * 92 / 36))), T = x + w, E = [], D = 0;
			for (; D < b.length || E.length === 0;) {
				let n = u += 92, i = E.length === 0 ? T : w, a = Math.min(i, b.length - D), o = E.length % 2 == 0, s = E.length === 0 ? Array.from({ length: a }, (e, t) => S + t) : Array.from({ length: a }, (e, t) => o ? C + t : C + w - 1 - t);
				E.push({
					y: n,
					cols: s
				});
				for (let i of s) {
					let a = e.rooms.get(b[D++]), o = {
						key: `${t}/${a.id}`,
						roomId: a.id,
						lineId: t,
						x: i * 36,
						y: n,
						label: a.name,
						kind: a.kind,
						unread: a.kind === "space" ? 0 : a.unread,
						highlight: a.kind === "space" ? 0 : a.highlight,
						invite: a.invite,
						interchange: a.kind === "space"
					};
					_.stations.push(o), r.stations.push(o), d = Math.max(d, o.x);
				}
				if (!a) break;
			}
			let O = h ? [[h.col * 36, h.y], [h.col * 36, E[0].y]] : [[S * 36 - 18, E[0].y]];
			E.forEach((e, t) => {
				let n = t % 2 == 0, r = e.cols.map((e) => e * 36), i = E[t + 1]?.cols.map((e) => e * 36) ?? [], a = n ? Math.max(...r, ...i, S * 36) + 18 : Math.min(...r, ...i) - 18;
				O.push([a, e.y]), E[t + 1] && O.push([a, E[t + 1].y]), d = Math.max(d, a);
			}), _.points = O;
			let k = _.stations.filter((e) => y(e.roomId) && e.y === E[0].y).sort((e, t) => t.x - e.x);
			for (let n of k) {
				if (o.has(n.roomId)) continue;
				let r = e.rooms.get(n.roomId);
				f(r.id, r.name, r.children, m + 1, {
					col: n.x / 36,
					y: n.y,
					parent: t
				});
			}
		}, p = n.spaceId ? e.rooms.get(n.spaceId) : void 0;
		p ? f(p.id, n.label, p.children, 0) : f(n.key, n.label, n.rooms, 0), r.lines[0].anchor = [-18, 0], r.width = d + Oe, r.height = u + 36;
		let m = /* @__PURE__ */ new Map();
		for (let e of [...r.lines].reverse()) {
			let t = new Map(e.stations.filter((e) => e.kind !== "space").map((e) => [e.roomId, e])), n = r.lines.filter((t) => t.parent === e.id);
			for (let e of n) for (let [n, r] of m.get(e.id)) t.set(n, r);
			m.set(e.id, t), e.unread = [...t.values()].reduce((e, t) => e + t.unread, 0), e.highlight = [...t.values()].reduce((e, t) => e + t.highlight, 0);
			for (let t of n) {
				let n = e.stations.find((e) => e.roomId === t.id);
				n && Object.assign(n, {
					unread: t.unread,
					highlight: t.highlight
				});
			}
		}
		return r;
	}, c = {
		lines: [],
		stations: [],
		links: [],
		districts: [],
		bounds: {
			x0: -36,
			y0: 0,
			x1: 36,
			y1: 36
		}
	}, l = [[
		"communities",
		"people",
		"unsorted"
	], [
		"events",
		"bridges",
		"archive"
	]], u = 0;
	for (let e of l) {
		let i = 0, a = 0;
		for (let l of e) {
			let e = t.groups.filter((e) => e.district === l && e.rooms.length).map(s);
			if (!e.length) continue;
			o.push(...e);
			let d = Re(e, r), f = i + je;
			Le(d, u, f), c.lines.push(...d.lines), c.stations.push(...d.stations);
			let p = {
				x0: u,
				y0: i,
				x1: u + d.bounds.x1,
				y1: f + d.bounds.y1
			}, m = t.groups.filter((e) => e.district === l).reduce((e, t) => e + t.rooms.length, 0);
			c.districts.push({
				id: l,
				label: n[l],
				rooms: m,
				...p
			}), a = Math.max(a, d.bounds.x1), i = p.y1 + Me, c.bounds.y1 = Math.max(c.bounds.y1, p.y1);
		}
		u += a + Me, c.bounds.x1 = Math.max(c.bounds.x1, u - Me);
	}
	let d = /* @__PURE__ */ new Map();
	for (let e of c.stations) d.set(e.roomId, [...d.get(e.roomId) ?? [], e]);
	let f = /* @__PURE__ */ new Map();
	o.forEach((e, t) => e.lines.forEach((e) => f.set(e.id, t)));
	for (let [e, t] of d) if (!(t.length < 2)) {
		for (let e of t) e.interchange = !0;
		for (let [, n] of ze(t, (e) => f.get(e.lineId))) {
			let t = n.filter((e) => n.some((t) => t !== e && Math.abs(t.x - e.x) <= Pe && Math.abs(t.y - e.y) <= Pe));
			t.length > 1 && c.links.push({
				roomId: e,
				points: t.map((e) => [e.x, e.y]).sort((e, t) => e[1] - t[1] || e[0] - t[0])
			});
		}
	}
	return c;
}
function Le(e, t, n) {
	for (let r of e.lines) r.points = r.points.map(([e, r]) => [e + t, r + n]), r.anchor &&= [r.anchor[0] + t, r.anchor[1] + n];
	for (let r of e.stations) r.x += t, r.y += n;
}
function Re(e, t) {
	let n = (e) => Math.max(1, Math.ceil((e.width + ke) / 572)), r = [...e.keys()].sort((t, r) => n(e[r]) - n(e[t]) || t - r), i = (t) => {
		let i = Array(t).fill(0), a = Array(e.length);
		for (let o of r) {
			let r = Math.min(n(e[o]), t), s = 0, c = Infinity;
			for (let e = 0; e + r <= t; e++) {
				let t = Math.max(...i.slice(e, e + r));
				t < c && (s = e, c = t);
			}
			a[o] = [s * 572, c];
			for (let t = s; t < s + r; t++) i[t] = c + e[o].height + Ae;
		}
		return {
			at: a,
			width: Math.max(0, ...e.map((e, t) => a[t][0] + e.width)),
			height: Math.max(0, ...i)
		};
	}, a = Math.max(1, ...e.map(n)), o = i(a), s = Infinity;
	for (let n = a; n <= Math.max(a, e.length * a); n++) {
		let e = i(n), r = Math.abs(Math.log(e.width / Math.max(1, e.height) / t));
		if (r < s && (o = e, s = r), e.width / Math.max(1, e.height) > t * 2) break;
	}
	let c = {
		lines: [],
		stations: [],
		links: [],
		bounds: {
			x0: -36,
			y0: 0,
			x1: 36,
			y1: 36
		}
	};
	return e.forEach((e, t) => {
		let [n, r] = o.at[t];
		for (let t of e.lines) t.points = t.points.map(([e, t]) => [e + n, t + r]), t.anchor &&= [t.anchor[0] + n, t.anchor[1] + r], c.lines.push(t);
		for (let t of e.stations) t.x += n, t.y += r, c.stations.push(t);
		c.bounds.x1 = Math.max(c.bounds.x1, n + e.width), c.bounds.y1 = Math.max(c.bounds.y1, r + e.height);
	}), c;
}
function ze(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e) n.set(t(r), [...n.get(t(r)) ?? [], r]);
	return n;
}
function Be(e, t = 14) {
	if (!e.length) return "";
	let n = `M${e[0][0]} ${e[0][1]}`;
	for (let r = 1; r < e.length; r++) {
		let [i, a] = e[r], o = e[r + 1];
		if (!o) {
			n += `L${i} ${a}`;
			break;
		}
		let [s, c] = e[r - 1], l = Math.min(t, Math.hypot(i - s, a - c) / 2, Math.hypot(o[0] - i, o[1] - a) / 2), u = (e, t) => {
			let n = Math.hypot(e - i, t - a) || 1;
			return [i + (e - i) / n * l, a + (t - a) / n * l];
		}, [d, f] = u(s, c), [p, m] = u(o[0], o[1]);
		n += `L${d} ${f}Q${i} ${a} ${p} ${m}`;
	}
	return n;
}
// node_modules/.pnpm/graphology@0.26.0_graphology-types@0.24.8/node_modules/graphology/dist/graphology.mjs
var Ve = (/* @__PURE__ */ o(((e, t) => {
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
function He() {
	let e = arguments[0];
	for (let t = 1, n = arguments.length; t < n; t++) if (arguments[t]) for (let n in arguments[t]) e[n] = arguments[t][n];
	return e;
}
var I = He;
typeof Object.assign == "function" && (I = Object.assign);
function L(e, t, n, r) {
	let i = e._nodes.get(t), a = null;
	return i && (a = r === "mixed" ? i.out && i.out[n] || i.undirected && i.undirected[n] : r === "directed" ? i.out && i.out[n] : i.undirected && i.undirected[n]), a;
}
function R(e) {
	return typeof e == "object" && !!e;
}
function Ue(e) {
	let t;
	for (t in e) return !1;
	return !0;
}
function z(e, t, n) {
	Object.defineProperty(e, t, {
		enumerable: !1,
		configurable: !1,
		writable: !0,
		value: n
	});
}
function B(e, t, n) {
	let r = {
		enumerable: !0,
		configurable: !0
	};
	typeof n == "function" ? r.get = n : (r.value = n, r.writable = !1), Object.defineProperty(e, t, r);
}
function We(e) {
	return !(!R(e) || e.attributes && !Array.isArray(e.attributes));
}
function Ge() {
	let e = Math.floor(Math.random() * 256) & 255;
	return () => e++;
}
function Ke() {
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
function qe() {
	return {
		[Symbol.iterator]() {
			return this;
		},
		next() {
			return { done: !0 };
		}
	};
}
var Je = class extends Error {
	constructor(e) {
		super(), this.name = "GraphError", this.message = e;
	}
}, V = class e extends Je {
	constructor(t) {
		super(t), this.name = "InvalidArgumentsGraphError", typeof Error.captureStackTrace == "function" && Error.captureStackTrace(this, e.prototype.constructor);
	}
}, H = class e extends Je {
	constructor(t) {
		super(t), this.name = "NotFoundGraphError", typeof Error.captureStackTrace == "function" && Error.captureStackTrace(this, e.prototype.constructor);
	}
}, U = class e extends Je {
	constructor(t) {
		super(t), this.name = "UsageGraphError", typeof Error.captureStackTrace == "function" && Error.captureStackTrace(this, e.prototype.constructor);
	}
};
function Ye(e, t) {
	this.key = e, this.attributes = t, this.clear();
}
Ye.prototype.clear = function() {
	this.inDegree = 0, this.outDegree = 0, this.undirectedDegree = 0, this.undirectedLoops = 0, this.directedLoops = 0, this.in = {}, this.out = {}, this.undirected = {};
};
function Xe(e, t) {
	this.key = e, this.attributes = t, this.clear();
}
Xe.prototype.clear = function() {
	this.inDegree = 0, this.outDegree = 0, this.directedLoops = 0, this.in = {}, this.out = {};
};
function Ze(e, t) {
	this.key = e, this.attributes = t, this.clear();
}
Ze.prototype.clear = function() {
	this.undirectedDegree = 0, this.undirectedLoops = 0, this.undirected = {};
};
function Qe(e, t, n, r, i) {
	this.key = t, this.attributes = i, this.undirected = e, this.source = n, this.target = r;
}
Qe.prototype.attach = function() {
	let e = "out", t = "in";
	this.undirected && (e = t = "undirected");
	let n = this.source.key, r = this.target.key;
	this.source[e][r] = this, this.undirected && n === r || (this.target[t][n] = this);
}, Qe.prototype.attachMulti = function() {
	let e = "out", t = "in", n = this.source.key, r = this.target.key;
	this.undirected && (e = t = "undirected");
	let i = this.source[e], a = i[r];
	a === void 0 ? (i[r] = this, this.undirected && n === r || (this.target[t][n] = this)) : (a.previous = this, this.next = a, i[r] = this, this.target[t][n] = this);
}, Qe.prototype.detach = function() {
	let e = this.source.key, t = this.target.key, n = "out", r = "in";
	this.undirected && (n = r = "undirected"), delete this.source[n][t], delete this.target[r][e];
}, Qe.prototype.detachMulti = function() {
	let e = this.source.key, t = this.target.key, n = "out", r = "in";
	this.undirected && (n = r = "undirected"), this.previous === void 0 ? this.next === void 0 ? (delete this.source[n][t], delete this.target[r][e]) : (this.next.previous = void 0, this.source[n][t] = this.next, this.target[r][e] = this.next) : (this.previous.next = this.next, this.next !== void 0 && (this.next.previous = this.previous));
};
var $e = 0, et = 1, tt = 2, nt = 3;
function rt(e, t, n, r, i, a, o) {
	let s, c, l, u;
	if (r = "" + r, n === $e) {
		if (s = e._nodes.get(r), !s) throw new H(`Graph.${t}: could not find the "${r}" node in the graph.`);
		l = i, u = a;
	} else if (n === nt) {
		if (i = "" + i, c = e._edges.get(i), !c) throw new H(`Graph.${t}: could not find the "${i}" edge in the graph.`);
		let n = c.source.key, d = c.target.key;
		if (r === n) s = c.target;
		else if (r === d) s = c.source;
		else throw new H(`Graph.${t}: the "${r}" node is not attached to the "${i}" edge (${n}, ${d}).`);
		l = a, u = o;
	} else {
		if (c = e._edges.get(r), !c) throw new H(`Graph.${t}: could not find the "${r}" edge in the graph.`);
		s = n === et ? c.source : c.target, l = i, u = a;
	}
	return [
		s,
		l,
		u
	];
}
function it(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let [a, o] = rt(this, t, n, e, r, i);
		return a.attributes[o];
	};
}
function at(e, t, n) {
	e.prototype[t] = function(e, r) {
		let [i] = rt(this, t, n, e, r);
		return i.attributes;
	};
}
function ot(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let [a, o] = rt(this, t, n, e, r, i);
		return a.attributes.hasOwnProperty(o);
	};
}
function st(e, t, n) {
	e.prototype[t] = function(e, r, i, a) {
		let [o, s, c] = rt(this, t, n, e, r, i, a);
		return o.attributes[s] = c, this.emit("nodeAttributesUpdated", {
			key: o.key,
			type: "set",
			attributes: o.attributes,
			name: s
		}), this;
	};
}
function ct(e, t, n) {
	e.prototype[t] = function(e, r, i, a) {
		let [o, s, c] = rt(this, t, n, e, r, i, a);
		if (typeof c != "function") throw new V(`Graph.${t}: updater should be a function.`);
		let l = o.attributes;
		return l[s] = c(l[s]), this.emit("nodeAttributesUpdated", {
			key: o.key,
			type: "set",
			attributes: o.attributes,
			name: s
		}), this;
	};
}
function lt(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let [a, o] = rt(this, t, n, e, r, i);
		return delete a.attributes[o], this.emit("nodeAttributesUpdated", {
			key: a.key,
			type: "remove",
			attributes: a.attributes,
			name: o
		}), this;
	};
}
function ut(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let [a, o] = rt(this, t, n, e, r, i);
		if (!R(o)) throw new V(`Graph.${t}: provided attributes are not a plain object.`);
		return a.attributes = o, this.emit("nodeAttributesUpdated", {
			key: a.key,
			type: "replace",
			attributes: a.attributes
		}), this;
	};
}
function dt(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let [a, o] = rt(this, t, n, e, r, i);
		if (!R(o)) throw new V(`Graph.${t}: provided attributes are not a plain object.`);
		return I(a.attributes, o), this.emit("nodeAttributesUpdated", {
			key: a.key,
			type: "merge",
			attributes: a.attributes,
			data: o
		}), this;
	};
}
function ft(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let [a, o] = rt(this, t, n, e, r, i);
		if (typeof o != "function") throw new V(`Graph.${t}: provided updater is not a function.`);
		return a.attributes = o(a.attributes), this.emit("nodeAttributesUpdated", {
			key: a.key,
			type: "update",
			attributes: a.attributes
		}), this;
	};
}
var pt = [
	{
		name: (e) => `get${e}Attribute`,
		attacher: it
	},
	{
		name: (e) => `get${e}Attributes`,
		attacher: at
	},
	{
		name: (e) => `has${e}Attribute`,
		attacher: ot
	},
	{
		name: (e) => `set${e}Attribute`,
		attacher: st
	},
	{
		name: (e) => `update${e}Attribute`,
		attacher: ct
	},
	{
		name: (e) => `remove${e}Attribute`,
		attacher: lt
	},
	{
		name: (e) => `replace${e}Attributes`,
		attacher: ut
	},
	{
		name: (e) => `merge${e}Attributes`,
		attacher: dt
	},
	{
		name: (e) => `update${e}Attributes`,
		attacher: ft
	}
];
function mt(e) {
	pt.forEach(function({ name: t, attacher: n }) {
		n(e, t("Node"), $e), n(e, t("Source"), et), n(e, t("Target"), tt), n(e, t("Opposite"), nt);
	});
}
function ht(e, t, n) {
	e.prototype[t] = function(e, r) {
		let i;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new U(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 2) {
			if (this.multi) throw new U(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let a = "" + e, o = "" + r;
			if (r = arguments[2], i = L(this, a, o, n), !i) throw new H(`Graph.${t}: could not find an edge for the given path ("${a}" - "${o}").`);
		} else {
			if (n !== "mixed") throw new U(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, i = this._edges.get(e), !i) throw new H(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		return i.attributes[r];
	};
}
function gt(e, t, n) {
	e.prototype[t] = function(e) {
		let r;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new U(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 1) {
			if (this.multi) throw new U(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let i = "" + e, a = "" + arguments[1];
			if (r = L(this, i, a, n), !r) throw new H(`Graph.${t}: could not find an edge for the given path ("${i}" - "${a}").`);
		} else {
			if (n !== "mixed") throw new U(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, r = this._edges.get(e), !r) throw new H(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		return r.attributes;
	};
}
function _t(e, t, n) {
	e.prototype[t] = function(e, r) {
		let i;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new U(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 2) {
			if (this.multi) throw new U(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let a = "" + e, o = "" + r;
			if (r = arguments[2], i = L(this, a, o, n), !i) throw new H(`Graph.${t}: could not find an edge for the given path ("${a}" - "${o}").`);
		} else {
			if (n !== "mixed") throw new U(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, i = this._edges.get(e), !i) throw new H(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		return i.attributes.hasOwnProperty(r);
	};
}
function vt(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let a;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new U(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 3) {
			if (this.multi) throw new U(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let o = "" + e, s = "" + r;
			if (r = arguments[2], i = arguments[3], a = L(this, o, s, n), !a) throw new H(`Graph.${t}: could not find an edge for the given path ("${o}" - "${s}").`);
		} else {
			if (n !== "mixed") throw new U(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, a = this._edges.get(e), !a) throw new H(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		return a.attributes[r] = i, this.emit("edgeAttributesUpdated", {
			key: a.key,
			type: "set",
			attributes: a.attributes,
			name: r
		}), this;
	};
}
function yt(e, t, n) {
	e.prototype[t] = function(e, r, i) {
		let a;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new U(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 3) {
			if (this.multi) throw new U(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let o = "" + e, s = "" + r;
			if (r = arguments[2], i = arguments[3], a = L(this, o, s, n), !a) throw new H(`Graph.${t}: could not find an edge for the given path ("${o}" - "${s}").`);
		} else {
			if (n !== "mixed") throw new U(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, a = this._edges.get(e), !a) throw new H(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		if (typeof i != "function") throw new V(`Graph.${t}: updater should be a function.`);
		return a.attributes[r] = i(a.attributes[r]), this.emit("edgeAttributesUpdated", {
			key: a.key,
			type: "set",
			attributes: a.attributes,
			name: r
		}), this;
	};
}
function bt(e, t, n) {
	e.prototype[t] = function(e, r) {
		let i;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new U(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 2) {
			if (this.multi) throw new U(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let a = "" + e, o = "" + r;
			if (r = arguments[2], i = L(this, a, o, n), !i) throw new H(`Graph.${t}: could not find an edge for the given path ("${a}" - "${o}").`);
		} else {
			if (n !== "mixed") throw new U(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, i = this._edges.get(e), !i) throw new H(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		return delete i.attributes[r], this.emit("edgeAttributesUpdated", {
			key: i.key,
			type: "remove",
			attributes: i.attributes,
			name: r
		}), this;
	};
}
function xt(e, t, n) {
	e.prototype[t] = function(e, r) {
		let i;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new U(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 2) {
			if (this.multi) throw new U(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let a = "" + e, o = "" + r;
			if (r = arguments[2], i = L(this, a, o, n), !i) throw new H(`Graph.${t}: could not find an edge for the given path ("${a}" - "${o}").`);
		} else {
			if (n !== "mixed") throw new U(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, i = this._edges.get(e), !i) throw new H(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		if (!R(r)) throw new V(`Graph.${t}: provided attributes are not a plain object.`);
		return i.attributes = r, this.emit("edgeAttributesUpdated", {
			key: i.key,
			type: "replace",
			attributes: i.attributes
		}), this;
	};
}
function St(e, t, n) {
	e.prototype[t] = function(e, r) {
		let i;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new U(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 2) {
			if (this.multi) throw new U(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let a = "" + e, o = "" + r;
			if (r = arguments[2], i = L(this, a, o, n), !i) throw new H(`Graph.${t}: could not find an edge for the given path ("${a}" - "${o}").`);
		} else {
			if (n !== "mixed") throw new U(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, i = this._edges.get(e), !i) throw new H(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		if (!R(r)) throw new V(`Graph.${t}: provided attributes are not a plain object.`);
		return I(i.attributes, r), this.emit("edgeAttributesUpdated", {
			key: i.key,
			type: "merge",
			attributes: i.attributes,
			data: r
		}), this;
	};
}
function Ct(e, t, n) {
	e.prototype[t] = function(e, r) {
		let i;
		if (this.type !== "mixed" && n !== "mixed" && n !== this.type) throw new U(`Graph.${t}: cannot find this type of edges in your ${this.type} graph.`);
		if (arguments.length > 2) {
			if (this.multi) throw new U(`Graph.${t}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`);
			let a = "" + e, o = "" + r;
			if (r = arguments[2], i = L(this, a, o, n), !i) throw new H(`Graph.${t}: could not find an edge for the given path ("${a}" - "${o}").`);
		} else {
			if (n !== "mixed") throw new U(`Graph.${t}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`);
			if (e = "" + e, i = this._edges.get(e), !i) throw new H(`Graph.${t}: could not find the "${e}" edge in the graph.`);
		}
		if (typeof r != "function") throw new V(`Graph.${t}: provided updater is not a function.`);
		return i.attributes = r(i.attributes), this.emit("edgeAttributesUpdated", {
			key: i.key,
			type: "update",
			attributes: i.attributes
		}), this;
	};
}
var wt = [
	{
		name: (e) => `get${e}Attribute`,
		attacher: ht
	},
	{
		name: (e) => `get${e}Attributes`,
		attacher: gt
	},
	{
		name: (e) => `has${e}Attribute`,
		attacher: _t
	},
	{
		name: (e) => `set${e}Attribute`,
		attacher: vt
	},
	{
		name: (e) => `update${e}Attribute`,
		attacher: yt
	},
	{
		name: (e) => `remove${e}Attribute`,
		attacher: bt
	},
	{
		name: (e) => `replace${e}Attributes`,
		attacher: xt
	},
	{
		name: (e) => `merge${e}Attributes`,
		attacher: St
	},
	{
		name: (e) => `update${e}Attributes`,
		attacher: Ct
	}
];
function Tt(e) {
	wt.forEach(function({ name: t, attacher: n }) {
		n(e, t("Edge"), "mixed"), n(e, t("DirectedEdge"), "directed"), n(e, t("UndirectedEdge"), "undirected");
	});
}
var Et = [
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
function Dt(e, t, n, r) {
	let i = !1;
	for (let a in t) {
		if (a === r) continue;
		let o = t[a];
		if (i = n(o.key, o.attributes, o.source.key, o.target.key, o.source.attributes, o.target.attributes, o.undirected), e && i) return o.key;
	}
}
function Ot(e, t, n, r) {
	let i, a, o, s = !1;
	for (let c in t) if (c !== r) {
		i = t[c];
		do {
			if (a = i.source, o = i.target, s = n(i.key, i.attributes, a.key, o.key, a.attributes, o.attributes, i.undirected), e && s) return i.key;
			i = i.next;
		} while (i !== void 0);
	}
}
function kt(e, t) {
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
function At(e, t, n, r) {
	let i = t[n];
	if (!i) return;
	let a = i.source, o = i.target;
	if (r(i.key, i.attributes, a.key, o.key, a.attributes, o.attributes, i.undirected) && e) return i.key;
}
function jt(e, t, n, r) {
	let i = t[n];
	if (!i) return;
	let a = !1;
	do {
		if (a = r(i.key, i.attributes, i.source.key, i.target.key, i.source.attributes, i.target.attributes, i.undirected), e && a) return i.key;
		i = i.next;
	} while (i !== void 0);
}
function Mt(e, t) {
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
function Nt(e, t) {
	if (e.size === 0) return [];
	if (t === "mixed" || t === e.type) return Array.from(e._edges.keys());
	let n = t === "undirected" ? e.undirectedSize : e.directedSize, r = Array(n), i = t === "undirected", a = e._edges.values(), o = 0, s, c;
	for (; s = a.next(), s.done !== !0;) c = s.value, c.undirected === i && (r[o++] = c.key);
	return r;
}
function Pt(e, t, n, r) {
	if (t.size === 0) return;
	let i = n !== "mixed" && n !== t.type, a = n === "undirected", o, s, c = !1, l = t._edges.values();
	for (; o = l.next(), o.done !== !0;) {
		if (s = o.value, i && s.undirected !== a) continue;
		let { key: t, attributes: n, source: l, target: u } = s;
		if (c = r(t, n, l.key, u.key, l.attributes, u.attributes, s.undirected), e && c) return t;
	}
}
function Ft(e, t) {
	if (e.size === 0) return qe();
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
function It(e, t, n, r, i, a) {
	let o = t ? Ot : Dt, s;
	if (n !== "undirected" && (r !== "out" && (s = o(e, i.in, a), e && s) || r !== "in" && (s = o(e, i.out, a, r ? void 0 : i.key), e && s)) || n !== "directed" && (s = o(e, i.undirected, a), e && s)) return s;
}
function Lt(e, t, n, r) {
	let i = [];
	return It(!1, e, t, n, r, function(e) {
		i.push(e);
	}), i;
}
function Rt(e, t, n) {
	let r = qe();
	return e !== "undirected" && (t !== "out" && n.in !== void 0 && (r = Ke(r, kt(n.in))), t !== "in" && n.out !== void 0 && (r = Ke(r, kt(n.out, t ? void 0 : n.key)))), e !== "directed" && n.undirected !== void 0 && (r = Ke(r, kt(n.undirected))), r;
}
function zt(e, t, n, r, i, a, o) {
	let s = n ? jt : At, c;
	if (t !== "undirected" && (i.in !== void 0 && r !== "out" && (c = s(e, i.in, a, o), e && c) || i.out !== void 0 && r !== "in" && (r || i.key !== a) && (c = s(e, i.out, a, o), e && c)) || t !== "directed" && i.undirected !== void 0 && (c = s(e, i.undirected, a, o), e && c)) return c;
}
function Bt(e, t, n, r, i) {
	let a = [];
	return zt(!1, e, t, n, r, i, function(e) {
		a.push(e);
	}), a;
}
function Vt(e, t, n, r) {
	let i = qe();
	return e !== "undirected" && (n.in !== void 0 && t !== "out" && r in n.in && (i = Ke(i, Mt(n.in, r))), n.out !== void 0 && t !== "in" && r in n.out && (t || n.key !== r) && (i = Ke(i, Mt(n.out, r)))), e !== "directed" && n.undirected !== void 0 && r in n.undirected && (i = Ke(i, Mt(n.undirected, r))), i;
}
function Ht(e, t) {
	let { name: n, type: r, direction: i } = t;
	e.prototype[n] = function(e, t) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return [];
		if (!arguments.length) return Nt(this, r);
		if (arguments.length === 1) {
			e = "" + e;
			let t = this._nodes.get(e);
			if (t === void 0) throw new H(`Graph.${n}: could not find the "${e}" node in the graph.`);
			return Lt(this.multi, r === "mixed" ? this.type : r, i, t);
		}
		if (arguments.length === 2) {
			e = "" + e, t = "" + t;
			let a = this._nodes.get(e);
			if (!a) throw new H(`Graph.${n}:  could not find the "${e}" source node in the graph.`);
			if (!this._nodes.has(t)) throw new H(`Graph.${n}:  could not find the "${t}" target node in the graph.`);
			return Bt(r, this.multi, i, a, t);
		}
		throw new V(`Graph.${n}: too many arguments (expecting 0, 1 or 2 and got ${arguments.length}).`);
	};
}
function Ut(e, t) {
	let { name: n, type: r, direction: i } = t, a = "forEach" + n[0].toUpperCase() + n.slice(1, -1);
	e.prototype[a] = function(e, t, n) {
		if (r === "mixed" || this.type === "mixed" || r === this.type) {
			if (arguments.length === 1) return n = e, Pt(!1, this, r, n);
			if (arguments.length === 2) {
				e = "" + e, n = t;
				let o = this._nodes.get(e);
				if (o === void 0) throw new H(`Graph.${a}: could not find the "${e}" node in the graph.`);
				return It(!1, this.multi, r === "mixed" ? this.type : r, i, o, n);
			}
			if (arguments.length === 3) {
				e = "" + e, t = "" + t;
				let o = this._nodes.get(e);
				if (!o) throw new H(`Graph.${a}:  could not find the "${e}" source node in the graph.`);
				if (!this._nodes.has(t)) throw new H(`Graph.${a}:  could not find the "${t}" target node in the graph.`);
				return zt(!1, r, this.multi, i, o, t, n);
			}
			throw new V(`Graph.${a}: too many arguments (expecting 1, 2 or 3 and got ${arguments.length}).`);
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
		if (e.length < 2 || e.length > 4) throw new V(`Graph.${c}: invalid number of arguments (expecting 2, 3 or 4 and got ${e.length}).`);
		if (typeof e[e.length - 1] == "function" && typeof e[e.length - 2] != "function") throw new V(`Graph.${c}: missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array.`);
		let t, n;
		e.length === 2 ? (t = e[0], n = e[1], e = []) : e.length === 3 ? (t = e[1], n = e[2], e = [e[0]]) : e.length === 4 && (t = e[2], n = e[3], e = [e[0], e[1]]);
		let r = n;
		return e.push((e, n, i, a, o, s, c) => {
			r = t(r, e, n, i, a, o, s, c);
		}), this[a].apply(this, e), r;
	};
}
function Wt(e, t) {
	let { name: n, type: r, direction: i } = t, a = "find" + n[0].toUpperCase() + n.slice(1, -1);
	e.prototype[a] = function(e, t, n) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return !1;
		if (arguments.length === 1) return n = e, Pt(!0, this, r, n);
		if (arguments.length === 2) {
			e = "" + e, n = t;
			let o = this._nodes.get(e);
			if (o === void 0) throw new H(`Graph.${a}: could not find the "${e}" node in the graph.`);
			return It(!0, this.multi, r === "mixed" ? this.type : r, i, o, n);
		}
		if (arguments.length === 3) {
			e = "" + e, t = "" + t;
			let o = this._nodes.get(e);
			if (!o) throw new H(`Graph.${a}:  could not find the "${e}" source node in the graph.`);
			if (!this._nodes.has(t)) throw new H(`Graph.${a}:  could not find the "${t}" target node in the graph.`);
			return zt(!0, r, this.multi, i, o, t, n);
		}
		throw new V(`Graph.${a}: too many arguments (expecting 1, 2 or 3 and got ${arguments.length}).`);
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
function Gt(e, t) {
	let { name: n, type: r, direction: i } = t, a = n.slice(0, -1) + "Entries";
	e.prototype[a] = function(e, t) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return qe();
		if (!arguments.length) return Ft(this, r);
		if (arguments.length === 1) {
			e = "" + e;
			let t = this._nodes.get(e);
			if (!t) throw new H(`Graph.${a}: could not find the "${e}" node in the graph.`);
			return Rt(r, i, t);
		}
		if (arguments.length === 2) {
			e = "" + e, t = "" + t;
			let n = this._nodes.get(e);
			if (!n) throw new H(`Graph.${a}:  could not find the "${e}" source node in the graph.`);
			if (!this._nodes.has(t)) throw new H(`Graph.${a}:  could not find the "${t}" target node in the graph.`);
			return Vt(r, i, n, t);
		}
		throw new V(`Graph.${a}: too many arguments (expecting 0, 1 or 2 and got ${arguments.length}).`);
	};
}
function Kt(e) {
	Et.forEach((t) => {
		Ht(e, t), Ut(e, t), Wt(e, t), Gt(e, t);
	});
}
var qt = [
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
function Jt() {
	this.A = null, this.B = null;
}
Jt.prototype.wrap = function(e) {
	this.A === null ? this.A = e : this.B === null && (this.B = e);
}, Jt.prototype.has = function(e) {
	return this.A !== null && e in this.A || this.B !== null && e in this.B;
};
function Yt(e, t, n, r, i) {
	for (let a in r) {
		let o = r[a], s = o.source, c = o.target, l = s === n ? c : s;
		if (t && t.has(l.key)) continue;
		let u = i(l.key, l.attributes);
		if (e && u) return l.key;
	}
}
function Xt(e, t, n, r, i) {
	if (t !== "mixed") {
		if (t === "undirected") return Yt(e, null, r, r.undirected, i);
		if (typeof n == "string") return Yt(e, null, r, r[n], i);
	}
	let a = new Jt(), o;
	if (t !== "undirected") {
		if (n !== "out") {
			if (o = Yt(e, null, r, r.in, i), e && o) return o;
			a.wrap(r.in);
		}
		if (n !== "in") {
			if (o = Yt(e, a, r, r.out, i), e && o) return o;
			a.wrap(r.out);
		}
	}
	if (t !== "directed" && (o = Yt(e, a, r, r.undirected, i), e && o)) return o;
}
function Zt(e, t, n) {
	if (e !== "mixed") {
		if (e === "undirected") return Object.keys(n.undirected);
		if (typeof t == "string") return Object.keys(n[t]);
	}
	let r = [];
	return Xt(!1, e, t, n, function(e) {
		r.push(e);
	}), r;
}
function Qt(e, t, n) {
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
function $t(e, t, n) {
	if (e !== "mixed") {
		if (e === "undirected") return Qt(null, n, n.undirected);
		if (typeof t == "string") return Qt(null, n, n[t]);
	}
	let r = qe(), i = new Jt();
	return e !== "undirected" && (t !== "out" && (r = Ke(r, Qt(i, n, n.in))), t !== "in" && (r = Ke(r, Qt(i, n, n.out)))), e !== "directed" && (r = Ke(r, Qt(i, n, n.undirected))), r;
}
function en(e, t) {
	let { name: n, type: r, direction: i } = t;
	e.prototype[n] = function(e) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return [];
		e = "" + e;
		let t = this._nodes.get(e);
		if (t === void 0) throw new H(`Graph.${n}: could not find the "${e}" node in the graph.`);
		return Zt(r === "mixed" ? this.type : r, i, t);
	};
}
function tn(e, t) {
	let { name: n, type: r, direction: i } = t, a = "forEach" + n[0].toUpperCase() + n.slice(1, -1);
	e.prototype[a] = function(e, t) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return;
		e = "" + e;
		let n = this._nodes.get(e);
		if (n === void 0) throw new H(`Graph.${a}: could not find the "${e}" node in the graph.`);
		Xt(!1, r === "mixed" ? this.type : r, i, n, t);
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
		if (arguments.length < 3) throw new V(`Graph.${c}: missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array.`);
		let r = n;
		return this[a](e, (e, n) => {
			r = t(r, e, n);
		}), r;
	};
}
function nn(e, t) {
	let { name: n, type: r, direction: i } = t, a = n[0].toUpperCase() + n.slice(1, -1), o = "find" + a;
	e.prototype[o] = function(e, t) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return;
		e = "" + e;
		let n = this._nodes.get(e);
		if (n === void 0) throw new H(`Graph.${o}: could not find the "${e}" node in the graph.`);
		return Xt(!0, r === "mixed" ? this.type : r, i, n, t);
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
function rn(e, t) {
	let { name: n, type: r, direction: i } = t, a = n.slice(0, -1) + "Entries";
	e.prototype[a] = function(e) {
		if (r !== "mixed" && this.type !== "mixed" && r !== this.type) return qe();
		e = "" + e;
		let t = this._nodes.get(e);
		if (t === void 0) throw new H(`Graph.${a}: could not find the "${e}" node in the graph.`);
		return $t(r === "mixed" ? this.type : r, i, t);
	};
}
function an(e) {
	qt.forEach((t) => {
		en(e, t), tn(e, t), nn(e, t), rn(e, t);
	});
}
function on(e, t, n, r, i) {
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
function sn(e, t) {
	let n = { key: e };
	return Ue(t.attributes) || (n.attributes = I({}, t.attributes)), n;
}
function cn(e, t, n) {
	let r = {
		key: t,
		source: n.source.key,
		target: n.target.key
	};
	return Ue(n.attributes) || (r.attributes = I({}, n.attributes)), e === "mixed" && n.undirected && (r.undirected = !0), r;
}
function ln(e) {
	if (!R(e)) throw new V("Graph.import: invalid serialized node. A serialized node should be a plain object with at least a \"key\" property.");
	if (!("key" in e)) throw new V("Graph.import: serialized node is missing its key.");
	if ("attributes" in e && (!R(e.attributes) || e.attributes === null)) throw new V("Graph.import: invalid attributes. Attributes should be a plain object, null or omitted.");
}
function un(e) {
	if (!R(e)) throw new V("Graph.import: invalid serialized edge. A serialized edge should be a plain object with at least a \"source\" & \"target\" property.");
	if (!("source" in e)) throw new V("Graph.import: serialized edge is missing its source.");
	if (!("target" in e)) throw new V("Graph.import: serialized edge is missing its target.");
	if ("attributes" in e && (!R(e.attributes) || e.attributes === null)) throw new V("Graph.import: invalid attributes. Attributes should be a plain object, null or omitted.");
	if ("undirected" in e && typeof e.undirected != "boolean") throw new V("Graph.import: invalid undirectedness information. Undirected should be boolean or omitted.");
}
var dn = Ge(), fn = /* @__PURE__ */ new Set([
	"directed",
	"undirected",
	"mixed"
]), pn = /* @__PURE__ */ new Set([
	"domain",
	"_events",
	"_eventsCount",
	"_maxListeners"
]), mn = [
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
], hn = {
	allowSelfLoops: !0,
	multi: !1,
	type: "mixed"
};
function gn(e, t, n) {
	if (n && !R(n)) throw new V(`Graph.addNode: invalid attributes. Expecting an object but got "${n}"`);
	if (t = "" + t, n ||= {}, e._nodes.has(t)) throw new U(`Graph.addNode: the "${t}" node already exist in the graph.`);
	let r = new e.NodeDataClass(t, n);
	return e._nodes.set(t, r), e.emit("nodeAdded", {
		key: t,
		attributes: n
	}), r;
}
function _n(e, t, n) {
	let r = new e.NodeDataClass(t, n);
	return e._nodes.set(t, r), e.emit("nodeAdded", {
		key: t,
		attributes: n
	}), r;
}
function vn(e, t, n, r, i, a, o, s) {
	if (!r && e.type === "undirected") throw new U(`Graph.${t}: you cannot add a directed edge to an undirected graph. Use the #.addEdge or #.addUndirectedEdge instead.`);
	if (r && e.type === "directed") throw new U(`Graph.${t}: you cannot add an undirected edge to a directed graph. Use the #.addEdge or #.addDirectedEdge instead.`);
	if (s && !R(s)) throw new V(`Graph.${t}: invalid attributes. Expecting an object but got "${s}"`);
	if (a = "" + a, o = "" + o, s ||= {}, !e.allowSelfLoops && a === o) throw new U(`Graph.${t}: source & target are the same ("${a}"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false.`);
	let c = e._nodes.get(a), l = e._nodes.get(o);
	if (!c) throw new H(`Graph.${t}: source node "${a}" not found.`);
	if (!l) throw new H(`Graph.${t}: target node "${o}" not found.`);
	let u = {
		key: null,
		undirected: r,
		source: a,
		target: o,
		attributes: s
	};
	if (n) i = e._edgeKeyGenerator();
	else if (i = "" + i, e._edges.has(i)) throw new U(`Graph.${t}: the "${i}" edge already exists in the graph.`);
	if (!e.multi && (r ? c.undirected[o] !== void 0 : c.out[o] !== void 0)) throw new U(`Graph.${t}: an edge linking "${a}" to "${o}" already exists. If you really want to add multiple edges linking those nodes, you should create a multi graph by using the 'multi' option.`);
	let d = new Qe(r, i, c, l, s);
	e._edges.set(i, d);
	let f = a === o;
	return r ? (c.undirectedDegree++, l.undirectedDegree++, f && (c.undirectedLoops++, e._undirectedSelfLoopCount++)) : (c.outDegree++, l.inDegree++, f && (c.directedLoops++, e._directedSelfLoopCount++)), e.multi ? d.attachMulti() : d.attach(), r ? e._undirectedSize++ : e._directedSize++, u.key = i, e.emit("edgeAdded", u), i;
}
function yn(e, t, n, r, i, a, o, s, c) {
	if (!r && e.type === "undirected") throw new U(`Graph.${t}: you cannot merge/update a directed edge to an undirected graph. Use the #.mergeEdge/#.updateEdge or #.addUndirectedEdge instead.`);
	if (r && e.type === "directed") throw new U(`Graph.${t}: you cannot merge/update an undirected edge to a directed graph. Use the #.mergeEdge/#.updateEdge or #.addDirectedEdge instead.`);
	if (s) {
		if (c) {
			if (typeof s != "function") throw new V(`Graph.${t}: invalid updater function. Expecting a function but got "${s}"`);
		} else if (!R(s)) throw new V(`Graph.${t}: invalid attributes. Expecting an object but got "${s}"`);
	}
	a = "" + a, o = "" + o;
	let l;
	if (c && (l = s, s = void 0), !e.allowSelfLoops && a === o) throw new U(`Graph.${t}: source & target are the same ("${a}"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false.`);
	let u = e._nodes.get(a), d = e._nodes.get(o), f, p;
	if (!n && (f = e._edges.get(i), f)) {
		if ((f.source.key !== a || f.target.key !== o) && (!r || f.source.key !== o || f.target.key !== a)) throw new U(`Graph.${t}: inconsistency detected when attempting to merge the "${i}" edge with "${a}" source & "${o}" target vs. ("${f.source.key}", "${f.target.key}").`);
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
		} else I(p.attributes, s), e.emit("edgeAttributesUpdated", {
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
	else if (i = "" + i, e._edges.has(i)) throw new U(`Graph.${t}: the "${i}" edge already exists in the graph.`);
	let h = !1, g = !1;
	u || (u = _n(e, a, {}), h = !0, a === o && (d = u, g = !0)), d || (d = _n(e, o, {}), g = !0), f = new Qe(r, i, u, d, s), e._edges.set(i, f);
	let _ = a === o;
	return r ? (u.undirectedDegree++, d.undirectedDegree++, _ && (u.undirectedLoops++, e._undirectedSelfLoopCount++)) : (u.outDegree++, d.inDegree++, _ && (u.directedLoops++, e._directedSelfLoopCount++)), e.multi ? f.attachMulti() : f.attach(), r ? e._undirectedSize++ : e._directedSize++, m.key = i, e.emit("edgeAdded", m), [
		i,
		!0,
		h,
		g
	];
}
function bn(e, t) {
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
var W = class e extends Ve.EventEmitter {
	constructor(e) {
		if (super(), e = I({}, hn, e), typeof e.multi != "boolean") throw new V(`Graph.constructor: invalid 'multi' option. Expecting a boolean but got "${e.multi}".`);
		if (!fn.has(e.type)) throw new V(`Graph.constructor: invalid 'type' option. Should be one of "mixed", "directed" or "undirected" but got "${e.type}".`);
		if (typeof e.allowSelfLoops != "boolean") throw new V(`Graph.constructor: invalid 'allowSelfLoops' option. Expecting a boolean but got "${e.allowSelfLoops}".`);
		let t = e.type === "mixed" ? Ye : e.type === "directed" ? Xe : Ze;
		z(this, "NodeDataClass", t);
		let n = "geid_" + dn() + "_", r = 0;
		z(this, "_attributes", {}), z(this, "_nodes", /* @__PURE__ */ new Map()), z(this, "_edges", /* @__PURE__ */ new Map()), z(this, "_directedSize", 0), z(this, "_undirectedSize", 0), z(this, "_directedSelfLoopCount", 0), z(this, "_undirectedSelfLoopCount", 0), z(this, "_edgeKeyGenerator", () => {
			let e;
			do
				e = n + r++;
			while (this._edges.has(e));
			return e;
		}), z(this, "_options", e), pn.forEach((e) => z(this, e, this[e])), B(this, "order", () => this._nodes.size), B(this, "size", () => this._edges.size), B(this, "directedSize", () => this._directedSize), B(this, "undirectedSize", () => this._undirectedSize), B(this, "selfLoopCount", () => this._directedSelfLoopCount + this._undirectedSelfLoopCount), B(this, "directedSelfLoopCount", () => this._directedSelfLoopCount), B(this, "undirectedSelfLoopCount", () => this._undirectedSelfLoopCount), B(this, "multi", this._options.multi), B(this, "type", this._options.type), B(this, "allowSelfLoops", this._options.allowSelfLoops), B(this, "implementation", () => "graphology");
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
		throw new V(`Graph.hasDirectedEdge: invalid arity (${arguments.length}, instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.`);
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
		throw new V(`Graph.hasDirectedEdge: invalid arity (${arguments.length}, instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.`);
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
		throw new V(`Graph.hasEdge: invalid arity (${arguments.length}, instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.`);
	}
	directedEdge(e, t) {
		if (this.type === "undirected") return;
		if (e = "" + e, t = "" + t, this.multi) throw new U("Graph.directedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.directedEdges instead.");
		let n = this._nodes.get(e);
		if (!n) throw new H(`Graph.directedEdge: could not find the "${e}" source node in the graph.`);
		if (!this._nodes.has(t)) throw new H(`Graph.directedEdge: could not find the "${t}" target node in the graph.`);
		let r = n.out && n.out[t] || void 0;
		if (r) return r.key;
	}
	undirectedEdge(e, t) {
		if (this.type === "directed") return;
		if (e = "" + e, t = "" + t, this.multi) throw new U("Graph.undirectedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.undirectedEdges instead.");
		let n = this._nodes.get(e);
		if (!n) throw new H(`Graph.undirectedEdge: could not find the "${e}" source node in the graph.`);
		if (!this._nodes.has(t)) throw new H(`Graph.undirectedEdge: could not find the "${t}" target node in the graph.`);
		let r = n.undirected && n.undirected[t] || void 0;
		if (r) return r.key;
	}
	edge(e, t) {
		if (this.multi) throw new U("Graph.edge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.edges instead.");
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new H(`Graph.edge: could not find the "${e}" source node in the graph.`);
		if (!this._nodes.has(t)) throw new H(`Graph.edge: could not find the "${t}" target node in the graph.`);
		let r = n.out && n.out[t] || n.undirected && n.undirected[t] || void 0;
		if (r) return r.key;
	}
	areDirectedNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new H(`Graph.areDirectedNeighbors: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? !1 : t in n.in || t in n.out;
	}
	areOutNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new H(`Graph.areOutNeighbors: could not find the "${e}" node in the graph.`);
		return this.type !== "undirected" && t in n.out;
	}
	areInNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new H(`Graph.areInNeighbors: could not find the "${e}" node in the graph.`);
		return this.type !== "undirected" && t in n.in;
	}
	areUndirectedNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new H(`Graph.areUndirectedNeighbors: could not find the "${e}" node in the graph.`);
		return this.type !== "directed" && t in n.undirected;
	}
	areNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new H(`Graph.areNeighbors: could not find the "${e}" node in the graph.`);
		return this.type !== "undirected" && (t in n.in || t in n.out) || this.type !== "directed" && t in n.undirected;
	}
	areInboundNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new H(`Graph.areInboundNeighbors: could not find the "${e}" node in the graph.`);
		return this.type !== "undirected" && t in n.in || this.type !== "directed" && t in n.undirected;
	}
	areOutboundNeighbors(e, t) {
		e = "" + e, t = "" + t;
		let n = this._nodes.get(e);
		if (!n) throw new H(`Graph.areOutboundNeighbors: could not find the "${e}" node in the graph.`);
		return this.type !== "undirected" && t in n.out || this.type !== "directed" && t in n.undirected;
	}
	inDegree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.inDegree: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? 0 : t.inDegree;
	}
	outDegree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.outDegree: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? 0 : t.outDegree;
	}
	directedDegree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.directedDegree: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? 0 : t.inDegree + t.outDegree;
	}
	undirectedDegree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.undirectedDegree: could not find the "${e}" node in the graph.`);
		return this.type === "directed" ? 0 : t.undirectedDegree;
	}
	inboundDegree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.inboundDegree: could not find the "${e}" node in the graph.`);
		let n = 0;
		return this.type !== "directed" && (n += t.undirectedDegree), this.type !== "undirected" && (n += t.inDegree), n;
	}
	outboundDegree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.outboundDegree: could not find the "${e}" node in the graph.`);
		let n = 0;
		return this.type !== "directed" && (n += t.undirectedDegree), this.type !== "undirected" && (n += t.outDegree), n;
	}
	degree(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.degree: could not find the "${e}" node in the graph.`);
		let n = 0;
		return this.type !== "directed" && (n += t.undirectedDegree), this.type !== "undirected" && (n += t.inDegree + t.outDegree), n;
	}
	inDegreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.inDegreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? 0 : t.inDegree - t.directedLoops;
	}
	outDegreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.outDegreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? 0 : t.outDegree - t.directedLoops;
	}
	directedDegreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.directedDegreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		return this.type === "undirected" ? 0 : t.inDegree + t.outDegree - t.directedLoops * 2;
	}
	undirectedDegreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.undirectedDegreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		return this.type === "directed" ? 0 : t.undirectedDegree - t.undirectedLoops * 2;
	}
	inboundDegreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.inboundDegreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		let n = 0, r = 0;
		return this.type !== "directed" && (n += t.undirectedDegree, r += t.undirectedLoops * 2), this.type !== "undirected" && (n += t.inDegree, r += t.directedLoops), n - r;
	}
	outboundDegreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.outboundDegreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		let n = 0, r = 0;
		return this.type !== "directed" && (n += t.undirectedDegree, r += t.undirectedLoops * 2), this.type !== "undirected" && (n += t.outDegree, r += t.directedLoops), n - r;
	}
	degreeWithoutSelfLoops(e) {
		e = "" + e;
		let t = this._nodes.get(e);
		if (!t) throw new H(`Graph.degreeWithoutSelfLoops: could not find the "${e}" node in the graph.`);
		let n = 0, r = 0;
		return this.type !== "directed" && (n += t.undirectedDegree, r += t.undirectedLoops * 2), this.type !== "undirected" && (n += t.inDegree + t.outDegree, r += t.directedLoops * 2), n - r;
	}
	source(e) {
		e = "" + e;
		let t = this._edges.get(e);
		if (!t) throw new H(`Graph.source: could not find the "${e}" edge in the graph.`);
		return t.source.key;
	}
	target(e) {
		e = "" + e;
		let t = this._edges.get(e);
		if (!t) throw new H(`Graph.target: could not find the "${e}" edge in the graph.`);
		return t.target.key;
	}
	extremities(e) {
		e = "" + e;
		let t = this._edges.get(e);
		if (!t) throw new H(`Graph.extremities: could not find the "${e}" edge in the graph.`);
		return [t.source.key, t.target.key];
	}
	opposite(e, t) {
		e = "" + e, t = "" + t;
		let n = this._edges.get(t);
		if (!n) throw new H(`Graph.opposite: could not find the "${t}" edge in the graph.`);
		let r = n.source.key, i = n.target.key;
		if (e === r) return i;
		if (e === i) return r;
		throw new H(`Graph.opposite: the "${e}" node is not attached to the "${t}" edge (${r}, ${i}).`);
	}
	hasExtremity(e, t) {
		e = "" + e, t = "" + t;
		let n = this._edges.get(e);
		if (!n) throw new H(`Graph.hasExtremity: could not find the "${e}" edge in the graph.`);
		return n.source.key === t || n.target.key === t;
	}
	isUndirected(e) {
		e = "" + e;
		let t = this._edges.get(e);
		if (!t) throw new H(`Graph.isUndirected: could not find the "${e}" edge in the graph.`);
		return t.undirected;
	}
	isDirected(e) {
		e = "" + e;
		let t = this._edges.get(e);
		if (!t) throw new H(`Graph.isDirected: could not find the "${e}" edge in the graph.`);
		return !t.undirected;
	}
	isSelfLoop(e) {
		e = "" + e;
		let t = this._edges.get(e);
		if (!t) throw new H(`Graph.isSelfLoop: could not find the "${e}" edge in the graph.`);
		return t.source === t.target;
	}
	addNode(e, t) {
		return gn(this, e, t).key;
	}
	mergeNode(e, t) {
		if (t && !R(t)) throw new V(`Graph.mergeNode: invalid attributes. Expecting an object but got "${t}"`);
		e = "" + e, t ||= {};
		let n = this._nodes.get(e);
		return n ? (t && (I(n.attributes, t), this.emit("nodeAttributesUpdated", {
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
		if (t && typeof t != "function") throw new V(`Graph.updateNode: invalid updater function. Expecting a function but got "${t}"`);
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
		if (!t) throw new H(`Graph.dropNode: could not find the "${e}" node in the graph.`);
		let n;
		if (this.type !== "undirected") {
			for (let e in t.out) {
				n = t.out[e];
				do
					bn(this, n), n = n.next;
				while (n);
			}
			for (let e in t.in) {
				n = t.in[e];
				do
					bn(this, n), n = n.next;
				while (n);
			}
		}
		if (this.type !== "directed") for (let e in t.undirected) {
			n = t.undirected[e];
			do
				bn(this, n), n = n.next;
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
			if (t = L(this, e, n, this.type), !t) throw new H(`Graph.dropEdge: could not find the "${e}" -> "${n}" edge in the graph.`);
		} else if (e = "" + e, t = this._edges.get(e), !t) throw new H(`Graph.dropEdge: could not find the "${e}" edge in the graph.`);
		return bn(this, t), this;
	}
	dropDirectedEdge(e, t) {
		if (arguments.length < 2) throw new U("Graph.dropDirectedEdge: it does not make sense to try and drop a directed edge by key. What if the edge with this key is undirected? Use #.dropEdge for this purpose instead.");
		if (this.multi) throw new U("Graph.dropDirectedEdge: cannot use a {source,target} combo when dropping an edge in a MultiGraph since we cannot infer the one you want to delete as there could be multiple ones.");
		e = "" + e, t = "" + t;
		let n = L(this, e, t, "directed");
		if (!n) throw new H(`Graph.dropDirectedEdge: could not find a "${e}" -> "${t}" edge in the graph.`);
		return bn(this, n), this;
	}
	dropUndirectedEdge(e, t) {
		if (arguments.length < 2) throw new U("Graph.dropUndirectedEdge: it does not make sense to drop a directed edge by key. What if the edge with this key is undirected? Use #.dropEdge for this purpose instead.");
		if (this.multi) throw new U("Graph.dropUndirectedEdge: cannot use a {source,target} combo when dropping an edge in a MultiGraph since we cannot infer the one you want to delete as there could be multiple ones.");
		let n = L(this, e, t, "undirected");
		if (!n) throw new H(`Graph.dropUndirectedEdge: could not find a "${e}" -> "${t}" edge in the graph.`);
		return bn(this, n), this;
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
		if (typeof t != "function") throw new V("Graph.updateAttribute: updater should be a function.");
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
		if (!R(e)) throw new V("Graph.replaceAttributes: provided attributes are not a plain object.");
		return this._attributes = e, this.emit("attributesUpdated", {
			type: "replace",
			attributes: this._attributes
		}), this;
	}
	mergeAttributes(e) {
		if (!R(e)) throw new V("Graph.mergeAttributes: provided attributes are not a plain object.");
		return I(this._attributes, e), this.emit("attributesUpdated", {
			type: "merge",
			attributes: this._attributes,
			data: e
		}), this;
	}
	updateAttributes(e) {
		if (typeof e != "function") throw new V("Graph.updateAttributes: provided updater is not a function.");
		return this._attributes = e(this._attributes), this.emit("attributesUpdated", {
			type: "update",
			attributes: this._attributes
		}), this;
	}
	updateEachNodeAttributes(e, t) {
		if (typeof e != "function") throw new V("Graph.updateEachNodeAttributes: expecting an updater function.");
		if (t && !We(t)) throw new V("Graph.updateEachNodeAttributes: invalid hints. Expecting an object having the following shape: {attributes?: [string]}");
		let n = this._nodes.values(), r, i;
		for (; r = n.next(), r.done !== !0;) i = r.value, i.attributes = e(i.key, i.attributes);
		this.emit("eachNodeAttributesUpdated", { hints: t || null });
	}
	updateEachEdgeAttributes(e, t) {
		if (typeof e != "function") throw new V("Graph.updateEachEdgeAttributes: expecting an updater function.");
		if (t && !We(t)) throw new V("Graph.updateEachEdgeAttributes: invalid hints. Expecting an object having the following shape: {attributes?: [string]}");
		let n = this._edges.values(), r, i, a, o;
		for (; r = n.next(), r.done !== !0;) i = r.value, a = i.source, o = i.target, i.attributes = e(i.key, i.attributes, a.key, o.key, a.attributes, o.attributes, i.undirected);
		this.emit("eachEdgeAttributesUpdated", { hints: t || null });
	}
	forEachAdjacencyEntry(e) {
		if (typeof e != "function") throw new V("Graph.forEachAdjacencyEntry: expecting a callback.");
		on(!1, !1, !1, this, e);
	}
	forEachAdjacencyEntryWithOrphans(e) {
		if (typeof e != "function") throw new V("Graph.forEachAdjacencyEntryWithOrphans: expecting a callback.");
		on(!1, !1, !0, this, e);
	}
	forEachAssymetricAdjacencyEntry(e) {
		if (typeof e != "function") throw new V("Graph.forEachAssymetricAdjacencyEntry: expecting a callback.");
		on(!1, !0, !1, this, e);
	}
	forEachAssymetricAdjacencyEntryWithOrphans(e) {
		if (typeof e != "function") throw new V("Graph.forEachAssymetricAdjacencyEntryWithOrphans: expecting a callback.");
		on(!1, !0, !0, this, e);
	}
	nodes() {
		return Array.from(this._nodes.keys());
	}
	forEachNode(e) {
		if (typeof e != "function") throw new V("Graph.forEachNode: expecting a callback.");
		let t = this._nodes.values(), n, r;
		for (; n = t.next(), n.done !== !0;) r = n.value, e(r.key, r.attributes);
	}
	findNode(e) {
		if (typeof e != "function") throw new V("Graph.findNode: expecting a callback.");
		let t = this._nodes.values(), n, r;
		for (; n = t.next(), n.done !== !0;) if (r = n.value, e(r.key, r.attributes)) return r.key;
	}
	mapNodes(e) {
		if (typeof e != "function") throw new V("Graph.mapNode: expecting a callback.");
		let t = this._nodes.values(), n, r, i = Array(this.order), a = 0;
		for (; n = t.next(), n.done !== !0;) r = n.value, i[a++] = e(r.key, r.attributes);
		return i;
	}
	someNode(e) {
		if (typeof e != "function") throw new V("Graph.someNode: expecting a callback.");
		let t = this._nodes.values(), n, r;
		for (; n = t.next(), n.done !== !0;) if (r = n.value, e(r.key, r.attributes)) return !0;
		return !1;
	}
	everyNode(e) {
		if (typeof e != "function") throw new V("Graph.everyNode: expecting a callback.");
		let t = this._nodes.values(), n, r;
		for (; n = t.next(), n.done !== !0;) if (r = n.value, !e(r.key, r.attributes)) return !1;
		return !0;
	}
	filterNodes(e) {
		if (typeof e != "function") throw new V("Graph.filterNodes: expecting a callback.");
		let t = this._nodes.values(), n, r, i = [];
		for (; n = t.next(), n.done !== !0;) r = n.value, e(r.key, r.attributes) && i.push(r.key);
		return i;
	}
	reduceNodes(e, t) {
		if (typeof e != "function") throw new V("Graph.reduceNodes: expecting a callback.");
		if (arguments.length < 2) throw new V("Graph.reduceNodes: missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array.");
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
			e[t++] = sn(r, n);
		});
		let n = Array(this._edges.size);
		return t = 0, this._edges.forEach((e, r) => {
			n[t++] = cn(this.type, r, e);
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
		if (!R(t)) throw new V("Graph.import: invalid argument. Expecting a serialized graph or, alternatively, a Graph instance.");
		if (t.attributes) {
			if (!R(t.attributes)) throw new V("Graph.import: invalid attributes. Expecting a plain object.");
			n ? this.mergeAttributes(t.attributes) : this.replaceAttributes(t.attributes);
		}
		let r, i, a, o, s;
		if (t.nodes) {
			if (a = t.nodes, !Array.isArray(a)) throw new V("Graph.import: invalid nodes. Expecting an array.");
			for (r = 0, i = a.length; r < i; r++) {
				o = a[r], ln(o);
				let { key: e, attributes: t } = o;
				n ? this.mergeNode(e, t) : this.addNode(e, t);
			}
		}
		if (t.edges) {
			let e = !1;
			if (this.type === "undirected" && (e = !0), a = t.edges, !Array.isArray(a)) throw new V("Graph.import: invalid edges. Expecting an array.");
			for (r = 0, i = a.length; r < i; r++) {
				s = a[r], un(s);
				let { source: t, target: i, attributes: o, undirected: c = e } = s, l;
				"key" in s ? (l = n ? c ? this.mergeUndirectedEdgeWithKey : this.mergeDirectedEdgeWithKey : c ? this.addUndirectedEdgeWithKey : this.addDirectedEdgeWithKey, l.call(this, s.key, t, i, o)) : (l = n ? c ? this.mergeUndirectedEdge : this.mergeDirectedEdge : c ? this.addUndirectedEdge : this.addDirectedEdge, l.call(this, t, i, o));
			}
		}
		return this;
	}
	nullCopy(t) {
		let n = new e(I({}, this._options, t));
		return n.replaceAttributes(I({}, this.getAttributes())), n;
	}
	emptyCopy(e) {
		let t = this.nullCopy(e);
		return this._nodes.forEach((e, n) => {
			let r = I({}, e.attributes);
			e = new t.NodeDataClass(n, r), t._nodes.set(n, e);
		}), t;
	}
	copy(e) {
		if (e ||= {}, typeof e.type == "string" && e.type !== this.type && e.type !== "mixed") throw new U(`Graph.copy: cannot create an incompatible copy from "${this.type}" type to "${e.type}" because this would mean losing information about the current graph.`);
		if (typeof e.multi == "boolean" && e.multi !== this.multi && e.multi !== !0) throw new U("Graph.copy: cannot create an incompatible copy by downgrading a multi graph to a simple one because this would mean losing information about the current graph.");
		if (typeof e.allowSelfLoops == "boolean" && e.allowSelfLoops !== this.allowSelfLoops && e.allowSelfLoops !== !0) throw new U("Graph.copy: cannot create an incompatible copy from a graph allowing self loops to one that does not because this would mean losing information about the current graph.");
		let t = this.emptyCopy(e), n = this._edges.values(), r, i;
		for (; r = n.next(), r.done !== !0;) i = r.value, vn(t, "copy", !1, i.undirected, i.key, i.source.key, i.target.key, I({}, i.attributes));
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
		for (let e in this) this.hasOwnProperty(e) && !pn.has(e) && typeof this[e] != "function" && typeof e != "symbol" && (r[e] = this[e]);
		return r.attributes = this._attributes, r.nodes = e, r.edges = t, z(r, "constructor", this.constructor), r;
	}
};
typeof Symbol < "u" && (W.prototype[Symbol.for("nodejs.util.inspect.custom")] = W.prototype.inspect), mn.forEach((e) => {
	[
		"add",
		"merge",
		"update"
	].forEach((t) => {
		let n = e.name(t), r = t === "add" ? vn : yn;
		e.generateKey ? W.prototype[n] = function(i, a, o) {
			return r(this, n, !0, (e.type || this.type) === "undirected", null, i, a, o, t === "update");
		} : W.prototype[n] = function(i, a, o, s) {
			return r(this, n, !1, (e.type || this.type) === "undirected", i, a, o, s, t === "update");
		};
	});
}), mt(W), Tt(W), Kt(W), an(W);
var xn = class extends W {
	constructor(e) {
		let t = I({ type: "directed" }, e);
		if ("multi" in t && t.multi !== !1) throw new V("DirectedGraph.from: inconsistent indication that the graph should be multi in given options!");
		if (t.type !== "directed") throw new V("DirectedGraph.from: inconsistent \"" + t.type + "\" type in given options!");
		super(t);
	}
}, Sn = class extends W {
	constructor(e) {
		let t = I({ type: "undirected" }, e);
		if ("multi" in t && t.multi !== !1) throw new V("UndirectedGraph.from: inconsistent indication that the graph should be multi in given options!");
		if (t.type !== "undirected") throw new V("UndirectedGraph.from: inconsistent \"" + t.type + "\" type in given options!");
		super(t);
	}
}, Cn = class extends W {
	constructor(e) {
		let t = I({ multi: !0 }, e);
		if ("multi" in t && t.multi !== !0) throw new V("MultiGraph.from: inconsistent indication that the graph should be simple in given options!");
		super(t);
	}
}, wn = class extends W {
	constructor(e) {
		let t = I({
			type: "directed",
			multi: !0
		}, e);
		if ("multi" in t && t.multi !== !0) throw new V("MultiDirectedGraph.from: inconsistent indication that the graph should be simple in given options!");
		if (t.type !== "directed") throw new V("MultiDirectedGraph.from: inconsistent \"" + t.type + "\" type in given options!");
		super(t);
	}
}, Tn = class extends W {
	constructor(e) {
		let t = I({
			type: "undirected",
			multi: !0
		}, e);
		if ("multi" in t && t.multi !== !0) throw new V("MultiUndirectedGraph.from: inconsistent indication that the graph should be simple in given options!");
		if (t.type !== "undirected") throw new V("MultiUndirectedGraph.from: inconsistent \"" + t.type + "\" type in given options!");
		super(t);
	}
};
function En(e) {
	e.from = function(t, n) {
		let r = new e(I({}, t.options, n));
		return r.import(t), r;
	};
}
En(W), En(xn), En(Sn), En(Cn), En(wn), En(Tn), W.Graph = W, W.DirectedGraph = xn, W.UndirectedGraph = Sn, W.MultiGraph = Cn, W.MultiDirectedGraph = wn, W.MultiUndirectedGraph = Tn, W.InvalidArgumentsGraphError = V, W.NotFoundGraphError = H, W.UsageGraphError = U;
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/count.js
function Dn(e) {
	var t = 0, n = e.children, r = n && n.length;
	if (!r) t = 1;
	else for (; --r >= 0;) t += n[r].value;
	e.value = t;
}
function On() {
	return this.eachAfter(Dn);
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/each.js
function kn(e, t) {
	let n = -1;
	for (let r of this) e.call(t, r, ++n, this);
	return this;
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/eachBefore.js
function An(e, t) {
	for (var n = this, r = [n], i, a, o = -1; n = r.pop();) if (e.call(t, n, ++o, this), i = n.children) for (a = i.length - 1; a >= 0; --a) r.push(i[a]);
	return this;
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/eachAfter.js
function jn(e, t) {
	for (var n = this, r = [n], i = [], a, o, s, c = -1; n = r.pop();) if (i.push(n), a = n.children) for (o = 0, s = a.length; o < s; ++o) r.push(a[o]);
	for (; n = i.pop();) e.call(t, n, ++c, this);
	return this;
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/find.js
function Mn(e, t) {
	let n = -1;
	for (let r of this) if (e.call(t, r, ++n, this)) return r;
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/sum.js
function Nn(e) {
	return this.eachAfter(function(t) {
		for (var n = +e(t.data) || 0, r = t.children, i = r && r.length; --i >= 0;) n += r[i].value;
		t.value = n;
	});
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/sort.js
function Pn(e) {
	return this.eachBefore(function(t) {
		t.children && t.children.sort(e);
	});
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/path.js
function Fn(e) {
	for (var t = this, n = In(t, e), r = [t]; t !== n;) t = t.parent, r.push(t);
	for (var i = r.length; e !== n;) r.splice(i, 0, e), e = e.parent;
	return r;
}
function In(e, t) {
	if (e === t) return e;
	var n = e.ancestors(), r = t.ancestors(), i = null;
	for (e = n.pop(), t = r.pop(); e === t;) i = e, e = n.pop(), t = r.pop();
	return i;
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/ancestors.js
function Ln() {
	for (var e = this, t = [e]; e = e.parent;) t.push(e);
	return t;
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/descendants.js
function Rn() {
	return Array.from(this);
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/leaves.js
function zn() {
	var e = [];
	return this.eachBefore(function(t) {
		t.children || e.push(t);
	}), e;
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/links.js
function Bn() {
	var e = this, t = [];
	return e.each(function(n) {
		n !== e && t.push({
			source: n.parent,
			target: n
		});
	}), t;
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/iterator.js
function* Vn() {
	var e = this, t, n = [e], r, i, a;
	do
		for (t = n.reverse(), n = []; e = t.pop();) if (yield e, r = e.children) for (i = 0, a = r.length; i < a; ++i) n.push(r[i]);
	while (n.length);
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/hierarchy/index.js
function Hn(e, t) {
	e instanceof Map ? (e = [void 0, e], t === void 0 && (t = Gn)) : t === void 0 && (t = Wn);
	for (var n = new Jn(e), r, i = [n], a, o, s, c; r = i.pop();) if ((o = t(r.data)) && (c = (o = Array.from(o)).length)) for (r.children = o, s = c - 1; s >= 0; --s) i.push(a = o[s] = new Jn(o[s])), a.parent = r, a.depth = r.depth + 1;
	return n.eachBefore(qn);
}
function Un() {
	return Hn(this).eachBefore(Kn);
}
function Wn(e) {
	return e.children;
}
function Gn(e) {
	return Array.isArray(e) ? e[1] : null;
}
function Kn(e) {
	e.data.value !== void 0 && (e.value = e.data.value), e.data = e.data.data;
}
function qn(e) {
	var t = 0;
	do
		e.height = t;
	while ((e = e.parent) && e.height < ++t);
}
function Jn(e) {
	this.data = e, this.depth = this.height = 0, this.parent = null;
}
Jn.prototype = Hn.prototype = {
	constructor: Jn,
	count: On,
	each: kn,
	eachAfter: jn,
	eachBefore: An,
	find: Mn,
	sum: Nn,
	sort: Pn,
	path: Fn,
	ancestors: Ln,
	descendants: Rn,
	leaves: zn,
	links: Bn,
	copy: Un,
	[Symbol.iterator]: Vn
};
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/accessors.js
function Yn(e) {
	return e == null ? null : Xn(e);
}
function Xn(e) {
	if (typeof e != "function") throw Error();
	return e;
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/constant.js
function Zn() {
	return 0;
}
function Qn(e) {
	return function() {
		return e;
	};
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/lcg.js
var $n = 1664525, er = 1013904223, tr = 4294967296;
function nr() {
	let e = 1;
	return () => (e = ($n * e + er) % tr) / tr;
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/array.js
function rr(e) {
	return typeof e == "object" && "length" in e ? e : Array.from(e);
}
function ir(e, t) {
	let n = e.length, r, i;
	for (; n;) i = t() * n-- | 0, r = e[n], e[n] = e[i], e[i] = r;
	return e;
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/pack/enclose.js
function ar(e, t) {
	for (var n = 0, r = (e = ir(Array.from(e), t)).length, i = [], a, o; n < r;) a = e[n], o && cr(o, a) ? ++n : (o = ur(i = or(i, a)), n = 0);
	return o;
}
function or(e, t) {
	var n, r;
	if (lr(t, e)) return [t];
	for (n = 0; n < e.length; ++n) if (sr(t, e[n]) && lr(fr(e[n], t), e)) return [e[n], t];
	for (n = 0; n < e.length - 1; ++n) for (r = n + 1; r < e.length; ++r) if (sr(fr(e[n], e[r]), t) && sr(fr(e[n], t), e[r]) && sr(fr(e[r], t), e[n]) && lr(pr(e[n], e[r], t), e)) return [
		e[n],
		e[r],
		t
	];
	throw Error();
}
function sr(e, t) {
	var n = e.r - t.r, r = t.x - e.x, i = t.y - e.y;
	return n < 0 || n * n < r * r + i * i;
}
function cr(e, t) {
	var n = e.r - t.r + Math.max(e.r, t.r, 1) * 1e-9, r = t.x - e.x, i = t.y - e.y;
	return n > 0 && n * n > r * r + i * i;
}
function lr(e, t) {
	for (var n = 0; n < t.length; ++n) if (!cr(e, t[n])) return !1;
	return !0;
}
function ur(e) {
	switch (e.length) {
		case 1: return dr(e[0]);
		case 2: return fr(e[0], e[1]);
		case 3: return pr(e[0], e[1], e[2]);
	}
}
function dr(e) {
	return {
		x: e.x,
		y: e.y,
		r: e.r
	};
}
function fr(e, t) {
	var n = e.x, r = e.y, i = e.r, a = t.x, o = t.y, s = t.r, c = a - n, l = o - r, u = s - i, d = Math.sqrt(c * c + l * l);
	return {
		x: (n + a + c / d * u) / 2,
		y: (r + o + l / d * u) / 2,
		r: (d + i + s) / 2
	};
}
function pr(e, t, n) {
	var r = e.x, i = e.y, a = e.r, o = t.x, s = t.y, c = t.r, l = n.x, u = n.y, d = n.r, f = r - o, p = r - l, m = i - s, h = i - u, g = c - a, _ = d - a, v = r * r + i * i - a * a, y = v - o * o - s * s + c * c, b = v - l * l - u * u + d * d, x = p * m - f * h, S = (m * b - h * y) / (x * 2) - r, C = (h * g - m * _) / x, w = (p * y - f * b) / (x * 2) - i, T = (f * _ - p * g) / x, E = C * C + T * T - 1, D = 2 * (a + S * C + w * T), O = S * S + w * w - a * a, k = -(Math.abs(E) > 1e-6 ? (D + Math.sqrt(D * D - 4 * E * O)) / (2 * E) : O / D);
	return {
		x: r + S + C * k,
		y: i + w + T * k,
		r: k
	};
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/pack/siblings.js
function mr(e, t, n) {
	var r = e.x - t.x, i, a, o = e.y - t.y, s, c, l = r * r + o * o;
	l ? (a = t.r + n.r, a *= a, c = e.r + n.r, c *= c, a > c ? (i = (l + c - a) / (2 * l), s = Math.sqrt(Math.max(0, c / l - i * i)), n.x = e.x - i * r - s * o, n.y = e.y - i * o + s * r) : (i = (l + a - c) / (2 * l), s = Math.sqrt(Math.max(0, a / l - i * i)), n.x = t.x + i * r - s * o, n.y = t.y + i * o + s * r)) : (n.x = t.x + n.r, n.y = t.y);
}
function hr(e, t) {
	var n = e.r + t.r - 1e-6, r = t.x - e.x, i = t.y - e.y;
	return n > 0 && n * n > r * r + i * i;
}
function gr(e) {
	var t = e._, n = e.next._, r = t.r + n.r, i = (t.x * n.r + n.x * t.r) / r, a = (t.y * n.r + n.y * t.r) / r;
	return i * i + a * a;
}
function _r(e) {
	this._ = e, this.next = null, this.previous = null;
}
function vr(e, t) {
	if (!(a = (e = rr(e)).length)) return 0;
	var n = e[0], r, i, a, o, s, c, l, u, d, f;
	if (n.x = 0, n.y = 0, !(a > 1)) return n.r;
	if (r = e[1], n.x = -r.r, r.x = n.r, r.y = 0, !(a > 2)) return n.r + r.r;
	mr(r, n, i = e[2]), n = new _r(n), r = new _r(r), i = new _r(i), n.next = i.previous = r, r.next = n.previous = i, i.next = r.previous = n;
	pack: for (c = 3; c < a; ++c) {
		mr(n._, r._, i = e[c]), i = new _r(i), l = r.next, u = n.previous, d = r._.r, f = n._.r;
		do
			if (d <= f) {
				if (hr(l._, i._)) {
					r = l, n.next = r, r.previous = n, --c;
					continue pack;
				}
				d += l._.r, l = l.next;
			} else {
				if (hr(u._, i._)) {
					n = u, n.next = r, r.previous = n, --c;
					continue pack;
				}
				f += u._.r, u = u.previous;
			}
		while (l !== u.next);
		for (i.previous = n, i.next = r, n.next = r.previous = r = i, o = gr(n); (i = i.next) !== r;) (s = gr(i)) < o && (n = i, o = s);
		r = n.next;
	}
	for (n = [r._], i = r; (i = i.next) !== r;) n.push(i._);
	for (i = ar(n, t), c = 0; c < a; ++c) n = e[c], n.x -= i.x, n.y -= i.y;
	return i.r;
}
// node_modules/.pnpm/d3-hierarchy@3.1.2/node_modules/d3-hierarchy/src/pack/index.js
function yr(e) {
	return Math.sqrt(e.value);
}
function br() {
	var e = null, t = 1, n = 1, r = Zn;
	function i(i) {
		let a = nr();
		return i.x = t / 2, i.y = n / 2, e ? i.eachBefore(xr(e)).eachAfter(Sr(r, .5, a)).eachBefore(Cr(1)) : i.eachBefore(xr(yr)).eachAfter(Sr(Zn, 1, a)).eachAfter(Sr(r, i.r / Math.min(t, n), a)).eachBefore(Cr(Math.min(t, n) / (2 * i.r))), i;
	}
	return i.radius = function(t) {
		return arguments.length ? (e = Yn(t), i) : e;
	}, i.size = function(e) {
		return arguments.length ? (t = +e[0], n = +e[1], i) : [t, n];
	}, i.padding = function(e) {
		return arguments.length ? (r = typeof e == "function" ? e : Qn(+e), i) : r;
	}, i;
}
function xr(e) {
	return function(t) {
		t.children || (t.r = Math.max(0, +e(t) || 0));
	};
}
function Sr(e, t, n) {
	return function(r) {
		if (i = r.children) {
			var i, a, o = i.length, s = e(r) * t || 0, c;
			if (s) for (a = 0; a < o; ++a) i[a].r += s;
			if (c = vr(i, n), s) for (a = 0; a < o; ++a) i[a].r -= s;
			r.r = c + s;
		}
	};
}
function Cr(e) {
	return function(t) {
		var n = t.parent;
		t.r *= e, n && (t.x = n.x + e * t.x, t.y = n.y + e * t.y);
	};
}
// src/views.ts
var wr = 2e4;
function Tr(e) {
	return `d.${e}`;
}
function Er(e) {
	return `${Tr(e.district)}/${e.spaceId ?? `g.${e.key.replace(/\//g, "~")}`}`;
}
function Dr(e, t, n) {
	let r = 0, i = (e) => 1 + Math.log10(1 + e.members) * .5, a = (t, n, o, s) => {
		let c = e.rooms.get(t);
		if (!c || o.has(t) || r >= wr || !s(t)) return;
		r++;
		let l = `${n}/${t}`, u = {
			key: l,
			roomId: t,
			label: c.name,
			kind: c.kind,
			value: i(c)
		};
		if (c.kind === "space" && c.children.length) {
			let e = new Set(o).add(t);
			u.children = c.children.map((t) => a(t, l, e, s)).filter((e) => !!e), u.children.length || delete u.children;
		}
		return u;
	}, o = [];
	for (let r of O) {
		let i = Tr(r), s = [];
		for (let n of t.groups) if (n.district === r) {
			if (n.spaceId) {
				let r = /* @__PURE__ */ new Map(), o = (i, a = /* @__PURE__ */ new Set()) => {
					if (r.has(i)) return r.get(i);
					if (a.has(i)) return !1;
					a.add(i);
					let s = (e.rooms.get(i)?.children ?? []).some((r) => e.rooms.get(r)?.kind === "space" ? o(r, a) : t.home.get(r) === n.key);
					return r.set(i, s), s;
				}, c = a(n.spaceId, i, /* @__PURE__ */ new Set(), (r) => r === n.spaceId || (e.rooms.get(r)?.kind === "space" ? o(r) : t.home.get(r) === n.key));
				c && s.push({
					...c,
					label: n.label
				});
			} else {
				let e = Er(n), t = n.rooms.map((t) => a(t, e, /* @__PURE__ */ new Set(), (e) => e === t)).filter((e) => !!e);
				t.length && s.push({
					key: e,
					label: n.label,
					kind: "group",
					value: 0,
					children: t
				});
			}
		}
		s.length && o.push({
			key: i,
			label: n[r],
			kind: "group",
			value: 0,
			children: s
		});
	}
	let s = Hn({
		key: "",
		label: "",
		kind: "group",
		value: 0,
		children: o
	}).sum((e) => e.children?.length ? 0 : e.value).sort((e, t) => e.depth === 1 ? 0 : (t.value ?? 0) - (e.value ?? 0)), c = 64 * Math.sqrt(Math.max(1, s.leaves().length)) + 200, l = br().size([c, c]).padding((e) => e.depth === 0 ? 24 : 8)(s), u = new W();
	return l.each((t) => {
		if (t.depth === 0) return;
		let n = t.data.roomId ? e.rooms.get(t.data.roomId) : void 0, r = !!t.children?.length;
		u.addNode(t.data.key, {
			x: t.x,
			y: c - t.y,
			size: t.r,
			label: t.data.label,
			roomId: t.data.roomId,
			kind: t.data.kind,
			container: r,
			depth: t.depth,
			zIndex: t.depth,
			avatar: n?.avatar,
			...kr(n, r ? t.leaves().map((t) => e.rooms.get(t.data.roomId ?? "")) : [])
		});
	}), u;
}
function Or(e, t) {
	let n = Math.max(0, (t.now - e.lastActive) / 864e5);
	return t.usage(e.id) * 3 + .5 ** (n / 3) + (e.unread ? .5 : 0) + +!!e.highlight;
}
function kr(e, t) {
	return t.length ? {
		unread: t.reduce((e, t) => e + (t?.unread ?? 0), 0),
		highlight: t.reduce((e, t) => e + (t?.highlight ?? 0), 0),
		invite: !1
	} : {
		unread: e?.unread ?? 0,
		highlight: e?.highlight ?? 0,
		invite: e?.invite ?? !1
	};
}
// node_modules/.pnpm/sigma@3.0.3_graphology-types@0.24.8/node_modules/sigma/dist/inherits-d1a1e29b.esm.js
function Ar(e, t) {
	if (typeof e != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (typeof r != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function jr(e) {
	var t = Ar(e, "string");
	return typeof t == "symbol" ? t : t + "";
}
function G(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function Mr(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, jr(r.key), r);
	}
}
function K(e, t, n) {
	return t && Mr(e.prototype, t), n && Mr(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function Nr(e) {
	return Nr = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
		return e.__proto__ || Object.getPrototypeOf(e);
	}, Nr(e);
}
function Pr() {
	try {
		var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
	} catch {}
	return (Pr = function() {
		return !!e;
	})();
}
function Fr(e) {
	if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
	return e;
}
function Ir(e, t) {
	if (t && (typeof t == "object" || typeof t == "function")) return t;
	if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
	return Fr(e);
}
function q(e, t, n) {
	return t = Nr(t), Ir(e, Pr() ? Reflect.construct(t, n || [], Nr(e).constructor) : t.apply(e, n));
}
function Lr(e, t) {
	return Lr = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
		return e.__proto__ = t, e;
	}, Lr(e, t);
}
function J(e, t) {
	if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
	e.prototype = Object.create(t && t.prototype, { constructor: {
		value: e,
		writable: !0,
		configurable: !0
	} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && Lr(e, t);
}
// node_modules/.pnpm/sigma@3.0.3_graphology-types@0.24.8/node_modules/sigma/dist/colors-beb06eb2.esm.js
function Rr(e) {
	if (Array.isArray(e)) return e;
}
function zr(e, t) {
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
function Br(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function Vr(e, t) {
	if (e) {
		if (typeof e == "string") return Br(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Br(e, t) : void 0;
	}
}
function Hr() {
	throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Ur(e, t) {
	return Rr(e) || zr(e, t) || Vr(e, t) || Hr();
}
var Wr = {
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
}, Gr = /* @__PURE__ */ new Int8Array(4), Kr = new Int32Array(Gr.buffer, 0, 1), qr = new Float32Array(Gr.buffer, 0, 1), Jr = /^\s*rgba?\s*\(/, Yr = /^\s*rgba?\s*\(\s*([0-9]*)\s*,\s*([0-9]*)\s*,\s*([0-9]*)(?:\s*,\s*(.*)?)?\)\s*$/;
function Xr(e) {
	var t = 0, n = 0, r = 0, i = 1;
	if (e[0] === "#") e.length === 4 ? (t = parseInt(e.charAt(1) + e.charAt(1), 16), n = parseInt(e.charAt(2) + e.charAt(2), 16), r = parseInt(e.charAt(3) + e.charAt(3), 16)) : (t = parseInt(e.charAt(1) + e.charAt(2), 16), n = parseInt(e.charAt(3) + e.charAt(4), 16), r = parseInt(e.charAt(5) + e.charAt(6), 16)), e.length === 9 && (i = parseInt(e.charAt(7) + e.charAt(8), 16) / 255);
	else if (Jr.test(e)) {
		var a = e.match(Yr);
		a && (t = +a[1], n = +a[2], r = +a[3], a[4] && (i = +a[4]));
	}
	return {
		r: t,
		g: n,
		b: r,
		a: i
	};
}
var Zr = {};
for (var Qr in Wr) Zr[Qr] = ei(Wr[Qr]), Zr[Wr[Qr]] = Zr[Qr];
function $r(e, t, n, r, i) {
	return Kr[0] = r << 24 | n << 16 | t << 8 | e, i && (Kr[0] &= 4278190079), qr[0];
}
function ei(e) {
	if (e = e.toLowerCase(), Zr[e] !== void 0) return Zr[e];
	var t = Xr(e), n = t.r, r = t.g, i = t.b, a = t.a;
	a = a * 255 | 0;
	var o = $r(n, r, i, a, !0);
	return Zr[e] = o, o;
}
function ti(e, t) {
	qr[0] = ei(e);
	var n = Kr[0];
	return t && (n |= 16777216), [
		n & 255,
		n >> 8 & 255,
		n >> 16 & 255,
		n >> 24 & 255
	];
}
var ni = {};
function ri(e) {
	if (ni[e] !== void 0) return ni[e];
	var t = $r((e & 16711680) >>> 16, (e & 65280) >>> 8, e & 255, 255, !0);
	return ni[e] = t, t;
}
function ii(e, t, n, r) {
	return n + (t << 8) + (e << 16);
}
function ai(e, t, n, r, i, a) {
	var o = Math.floor(n / a * i), s = Math.floor(e.drawingBufferHeight / a - r / a * i), c = /* @__PURE__ */ new Uint8Array(4);
	e.bindFramebuffer(e.FRAMEBUFFER, t), e.readPixels(o, s, 1, 1, e.RGBA, e.UNSIGNED_BYTE, c);
	var l = Ur(c, 4);
	return [
		l[0],
		l[1],
		l[2],
		l[3]
	];
}
// node_modules/.pnpm/sigma@3.0.3_graphology-types@0.24.8/node_modules/sigma/dist/index-fad77a13.esm.js
function Y(e, t, n) {
	return (t = jr(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function oi(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function X(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? oi(Object(n), !0).forEach(function(t) {
			Y(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : oi(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function si(e, t) {
	for (; !{}.hasOwnProperty.call(e, t) && (e = Nr(e)) !== null;);
	return e;
}
function ci() {
	return ci = typeof Reflect < "u" && Reflect.get ? Reflect.get.bind() : function(e, t, n) {
		var r = si(e, t);
		if (r) {
			var i = Object.getOwnPropertyDescriptor(r, t);
			return i.get ? i.get.call(arguments.length < 3 ? e : n) : i.value;
		}
	}, ci.apply(null, arguments);
}
function li(e, t, n, r) {
	var i = ci(Nr(1 & r ? e.prototype : e), t, n);
	return 2 & r && typeof i == "function" ? function(e) {
		return i.apply(n, e);
	} : i;
}
function ui(e) {
	return e.normalized ? 1 : e.size;
}
function di(e) {
	var t = 0;
	return e.forEach(function(e) {
		return t += ui(e);
	}), t;
}
function fi(e, t, n) {
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
function pi(e, t) {
	return fi("VERTEX", e, t);
}
function mi(e, t) {
	return fi("FRAGMENT", e, t);
}
function hi(e, t) {
	var n = e.createProgram();
	if (n === null) throw Error("loadProgram: error while creating the program.");
	for (var r = 0, i = t.length; r < i; r++) e.attachShader(n, t[r]);
	if (e.linkProgram(n), !e.getProgramParameter(n, e.LINK_STATUS)) {
		var a = e.getProgramInfoLog(n);
		throw e.deleteProgram(n), Error(`loadProgram: error while linking the program: ${a}`);
	}
	return n;
}
function gi(e) {
	var t = e.gl, n = e.buffer, r = e.program, i = e.vertexShader, a = e.fragmentShader;
	t.deleteShader(i), t.deleteShader(a), t.deleteProgram(r), t.deleteBuffer(n);
}
function _i(e) {
	return e % 1 == 0 ? e.toFixed(1) : e.toString();
}
var vi = "#define PICKING_MODE\n", yi = Y(Y(Y(Y(Y(Y(Y(Y({}, WebGL2RenderingContext.BOOL, 1), WebGL2RenderingContext.BYTE, 1), WebGL2RenderingContext.UNSIGNED_BYTE, 1), WebGL2RenderingContext.SHORT, 2), WebGL2RenderingContext.UNSIGNED_SHORT, 2), WebGL2RenderingContext.INT, 4), WebGL2RenderingContext.UNSIGNED_INT, 4), WebGL2RenderingContext.FLOAT, 4), bi = /*#__PURE__*/ function() {
	function e(t, n, r) {
		G(this, e), Y(this, "array", /* @__PURE__ */ new Float32Array()), Y(this, "constantArray", /* @__PURE__ */ new Float32Array()), Y(this, "capacity", 0), Y(this, "verticesCount", 0);
		var i = this.getDefinition();
		if (this.VERTICES = i.VERTICES, this.VERTEX_SHADER_SOURCE = i.VERTEX_SHADER_SOURCE, this.FRAGMENT_SHADER_SOURCE = i.FRAGMENT_SHADER_SOURCE, this.UNIFORMS = i.UNIFORMS, this.ATTRIBUTES = i.ATTRIBUTES, this.METHOD = i.METHOD, this.CONSTANT_ATTRIBUTES = "CONSTANT_ATTRIBUTES" in i ? i.CONSTANT_ATTRIBUTES : [], this.CONSTANT_DATA = "CONSTANT_DATA" in i ? i.CONSTANT_DATA : [], this.isInstanced = "CONSTANT_ATTRIBUTES" in i, this.ATTRIBUTES_ITEMS_COUNT = di(this.ATTRIBUTES), this.STRIDE = this.VERTICES * this.ATTRIBUTES_ITEMS_COUNT, this.renderer = r, this.normalProgram = this.getProgramInfo("normal", t, i.VERTEX_SHADER_SOURCE, i.FRAGMENT_SHADER_SOURCE, null), this.pickProgram = n ? this.getProgramInfo("pick", t, vi + i.VERTEX_SHADER_SOURCE, vi + i.FRAGMENT_SHADER_SOURCE, n) : null, this.isInstanced) {
			var a = di(this.CONSTANT_ATTRIBUTES);
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
	return K(e, [
		{
			key: "kill",
			value: function() {
				gi(this.normalProgram), this.pickProgram &&= (gi(this.pickProgram), null);
			}
		},
		{
			key: "getProgramInfo",
			value: function(e, t, n, r, i) {
				var a = this.getDefinition(), o = t.createBuffer();
				if (o === null) throw Error("Program: error while creating the WebGL buffer.");
				var s = pi(t, n), c = mi(t, r), l = hi(t, [s, c]), u = {};
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
				var i = yi[e.type];
				if (typeof i != "number") throw Error(`Program.bind: yet unsupported attribute type "${e.type}"`);
				var a = t.attributeLocations[e.name], o = t.gl;
				if (a !== -1) {
					o.enableVertexAttribArray(a);
					var s = this.isInstanced ? (r ? this.ATTRIBUTES_ITEMS_COUNT : di(this.CONSTANT_ATTRIBUTES)) * Float32Array.BYTES_PER_ELEMENT : this.ATTRIBUTES_ITEMS_COUNT * Float32Array.BYTES_PER_ELEMENT;
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
				this.hasNothingToRender() || (this.pickProgram && (this.pickProgram.gl.viewport(0, 0, e.width * e.pixelRatio / e.downSizingRatio, e.height * e.pixelRatio / e.downSizingRatio), this.bindProgram(this.pickProgram), this.renderProgram(X(X({}, e), {}, { pixelRatio: e.pixelRatio / e.downSizingRatio }), this.pickProgram), this.unbindProgram(this.pickProgram)), this.normalProgram.gl.viewport(0, 0, e.width * e.pixelRatio, e.height * e.pixelRatio), this.bindProgram(this.normalProgram), this.renderProgram(e, this.normalProgram), this.unbindProgram(this.normalProgram));
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
}(), xi = /*#__PURE__*/ function(e) {
	function t() {
		return G(this, t), q(this, t, arguments);
	}
	return J(t, e), K(t, [{
		key: "kill",
		value: function() {
			li(t, "kill", this, 3)([]);
		}
	}, {
		key: "process",
		value: function(e, t, n) {
			var r = t * this.STRIDE;
			if (n.hidden) for (var i = r + this.STRIDE; r < i; r++) this.array[r] = 0;
			else return this.processVisibleItem(ri(e), r, n);
		}
	}]);
}(bi);
function Si(e, t, n) {
	return /*#__PURE__*/ function() {
		function r(i, a, o) {
			G(this, r), Y(this, "drawLabel", t), Y(this, "drawHover", n), this.programs = e.map(function(e) {
				return new e(i, a, o);
			});
		}
		return K(r, [
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
var Ci = /*#__PURE__*/ function(e) {
	function t() {
		var e;
		G(this, t);
		var n = [...arguments];
		return e = q(this, t, [].concat(n)), Y(e, "drawLabel", void 0), e;
	}
	return J(t, e), K(t, [{
		key: "kill",
		value: function() {
			li(t, "kill", this, 3)([]);
		}
	}, {
		key: "process",
		value: function(e, t, n, r, i) {
			var a = t * this.STRIDE;
			if (i.hidden || n.hidden || r.hidden) for (var o = a + this.STRIDE; a < o; a++) this.array[a] = 0;
			else return this.processVisibleItem(ri(e), a, n, r, i);
		}
	}]);
}(bi);
function wi(e, t) {
	return /*#__PURE__*/ function() {
		function n(r, i, a) {
			G(this, n), Y(this, "drawLabel", t), this.programs = e.map(function(e) {
				return new e(r, i, a);
			});
		}
		return K(n, [
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
function Ti(e, t, n, r, i) {
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
function Ei(e, t, n) {
	if (t.label) {
		var r = n.labelSize, i = n.labelFont, a = n.labelWeight;
		e.fillStyle = n.labelColor.attribute ? t[n.labelColor.attribute] || n.labelColor.color || "#000" : n.labelColor.color, e.font = `${a} ${r}px ${i}`, e.fillText(t.label, t.x + t.size + 3, t.y + r / 3);
	}
}
function Di(e, t, n) {
	var r = n.labelSize, i = n.labelFont;
	e.font = `${n.labelWeight} ${r}px ${i}`, e.fillStyle = "#FFF", e.shadowOffsetX = 0, e.shadowOffsetY = 0, e.shadowBlur = 8, e.shadowColor = "#000";
	var a = 2;
	if (typeof t.label == "string") {
		var o = e.measureText(t.label).width, s = Math.round(o + 5), c = Math.round(r + 2 * a), l = Math.max(t.size, r / 2) + a, u = Math.asin(c / 2 / l), d = Math.sqrt(Math.abs(l ** 2 - (c / 2) ** 2));
		e.beginPath(), e.moveTo(t.x + d, t.y + c / 2), e.lineTo(t.x + l + s, t.y + c / 2), e.lineTo(t.x + l + s, t.y - c / 2), e.lineTo(t.x + d, t.y - c / 2), e.arc(t.x, t.y, l, u, -u), e.closePath(), e.fill();
	} else e.beginPath(), e.arc(t.x, t.y, t.size + a, 0, Math.PI * 2), e.closePath(), e.fill();
	e.shadowOffsetX = 0, e.shadowOffsetY = 0, e.shadowBlur = 0, Ei(e, t, n);
}
var Oi = "\nprecision highp float;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\n\nuniform float u_correctionRatio;\n\nconst vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);\n\nvoid main(void) {\n  float border = u_correctionRatio * 2.0;\n  float dist = length(v_diffVector) - v_radius + border;\n\n  // No antialiasing for picking mode:\n  #ifdef PICKING_MODE\n  if (dist > border)\n    gl_FragColor = transparent;\n  else\n    gl_FragColor = v_color;\n\n  #else\n  float t = 0.0;\n  if (dist > border)\n    t = 1.0;\n  else if (dist > 0.0)\n    t = dist / border;\n\n  gl_FragColor = mix(v_color, transparent, t);\n  #endif\n}\n", ki = "\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_position;\nattribute float a_size;\nattribute float a_angle;\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\nvarying float v_border;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float size = a_size * u_correctionRatio / u_sizeRatio * 4.0;\n  vec2 diffVector = size * vec2(cos(a_angle), sin(a_angle));\n  vec2 position = a_position + diffVector;\n  gl_Position = vec4(\n    (u_matrix * vec3(position, 1)).xy,\n    0,\n    1\n  );\n\n  v_diffVector = diffVector;\n  v_radius = size / 2.0;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n", Ai = WebGLRenderingContext, ji = Ai.UNSIGNED_BYTE, Mi = Ai.FLOAT, Ni = [
	"u_sizeRatio",
	"u_correctionRatio",
	"u_matrix"
], Pi = /*#__PURE__*/ function(e) {
	function t() {
		return G(this, t), q(this, t, arguments);
	}
	return J(t, e), K(t, [
		{
			key: "getDefinition",
			value: function() {
				return {
					VERTICES: 3,
					VERTEX_SHADER_SOURCE: ki,
					FRAGMENT_SHADER_SOURCE: Oi,
					METHOD: WebGLRenderingContext.TRIANGLES,
					UNIFORMS: Ni,
					ATTRIBUTES: [
						{
							name: "a_position",
							size: 2,
							type: Mi
						},
						{
							name: "a_size",
							size: 1,
							type: Mi
						},
						{
							name: "a_color",
							size: 4,
							type: ji,
							normalized: !0
						},
						{
							name: "a_id",
							size: 4,
							type: ji,
							normalized: !0
						}
					],
					CONSTANT_ATTRIBUTES: [{
						name: "a_angle",
						size: 1,
						type: Mi
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
				var r = this.array, i = ei(n.color);
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
}(xi);
Y(Pi, "ANGLE_1", 0), Y(Pi, "ANGLE_2", 2 * Math.PI / 3), Y(Pi, "ANGLE_3", 4 * Math.PI / 3);
var Fi = "\nprecision mediump float;\n\nvarying vec4 v_color;\n\nvoid main(void) {\n  gl_FragColor = v_color;\n}\n", Ii = "\nattribute vec2 a_position;\nattribute vec2 a_normal;\nattribute float a_radius;\nattribute vec3 a_barycentric;\n\n#ifdef PICKING_MODE\nattribute vec4 a_id;\n#else\nattribute vec4 a_color;\n#endif\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\nuniform float u_minEdgeThickness;\nuniform float u_lengthToThicknessRatio;\nuniform float u_widenessToThicknessRatio;\n\nvarying vec4 v_color;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float minThickness = u_minEdgeThickness;\n\n  float normalLength = length(a_normal);\n  vec2 unitNormal = a_normal / normalLength;\n\n  // These first computations are taken from edge.vert.glsl and\n  // edge.clamped.vert.glsl. Please read it to get better comments on what's\n  // happening:\n  float pixelsThickness = max(normalLength / u_sizeRatio, minThickness);\n  float webGLThickness = pixelsThickness * u_correctionRatio;\n  float webGLNodeRadius = a_radius * 2.0 * u_correctionRatio / u_sizeRatio;\n  float webGLArrowHeadLength = webGLThickness * u_lengthToThicknessRatio * 2.0;\n  float webGLArrowHeadThickness = webGLThickness * u_widenessToThicknessRatio;\n\n  float da = a_barycentric.x;\n  float db = a_barycentric.y;\n  float dc = a_barycentric.z;\n\n  vec2 delta = vec2(\n      da * (webGLNodeRadius * unitNormal.y)\n    + db * ((webGLNodeRadius + webGLArrowHeadLength) * unitNormal.y + webGLArrowHeadThickness * unitNormal.x)\n    + dc * ((webGLNodeRadius + webGLArrowHeadLength) * unitNormal.y - webGLArrowHeadThickness * unitNormal.x),\n\n      da * (-webGLNodeRadius * unitNormal.x)\n    + db * (-(webGLNodeRadius + webGLArrowHeadLength) * unitNormal.x + webGLArrowHeadThickness * unitNormal.y)\n    + dc * (-(webGLNodeRadius + webGLArrowHeadLength) * unitNormal.x - webGLArrowHeadThickness * unitNormal.y)\n  );\n\n  vec2 position = (u_matrix * vec3(a_position + delta, 1)).xy;\n\n  gl_Position = vec4(position, 0, 1);\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n", Li = WebGLRenderingContext, Ri = Li.UNSIGNED_BYTE, zi = Li.FLOAT, Bi = [
	"u_matrix",
	"u_sizeRatio",
	"u_correctionRatio",
	"u_minEdgeThickness",
	"u_lengthToThicknessRatio",
	"u_widenessToThicknessRatio"
], Vi = {
	extremity: "target",
	lengthToThicknessRatio: 2.5,
	widenessToThicknessRatio: 2
};
function Hi(e) {
	var t = X(X({}, Vi), e || {});
	return /*#__PURE__*/ function(e) {
		function n() {
			return G(this, n), q(this, n, arguments);
		}
		return J(n, e), K(n, [
			{
				key: "getDefinition",
				value: function() {
					return {
						VERTICES: 3,
						VERTEX_SHADER_SOURCE: Ii,
						FRAGMENT_SHADER_SOURCE: Fi,
						METHOD: WebGLRenderingContext.TRIANGLES,
						UNIFORMS: Bi,
						ATTRIBUTES: [
							{
								name: "a_position",
								size: 2,
								type: zi
							},
							{
								name: "a_normal",
								size: 2,
								type: zi
							},
							{
								name: "a_radius",
								size: 1,
								type: zi
							},
							{
								name: "a_color",
								size: 4,
								type: Ri,
								normalized: !0
							},
							{
								name: "a_id",
								size: 4,
								type: Ri,
								normalized: !0
							}
						],
						CONSTANT_ATTRIBUTES: [{
							name: "a_barycentric",
							size: 3,
							type: zi
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
					var s = a.size || 1, c = i.size || 1, l = r.x, u = r.y, d = i.x, f = i.y, p = ei(a.color), m = d - l, h = f - u, g = m * m + h * h, _ = 0, v = 0;
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
	}(Ci);
}
Hi();
var Ui = "\nprecision mediump float;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\nvarying float v_feather;\n\nconst vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);\n\nvoid main(void) {\n  // We only handle antialiasing for normal mode:\n  #ifdef PICKING_MODE\n  gl_FragColor = v_color;\n  #else\n  float dist = length(v_normal) * v_thickness;\n\n  float t = smoothstep(\n    v_thickness - v_feather,\n    v_thickness,\n    dist\n  );\n\n  gl_FragColor = mix(v_color, transparent, t);\n  #endif\n}\n", Wi = "\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_normal;\nattribute float a_normalCoef;\nattribute vec2 a_positionStart;\nattribute vec2 a_positionEnd;\nattribute float a_positionCoef;\nattribute float a_radius;\nattribute float a_radiusCoef;\n\nuniform mat3 u_matrix;\nuniform float u_zoomRatio;\nuniform float u_sizeRatio;\nuniform float u_pixelRatio;\nuniform float u_correctionRatio;\nuniform float u_minEdgeThickness;\nuniform float u_lengthToThicknessRatio;\nuniform float u_feather;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\nvarying float v_feather;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float minThickness = u_minEdgeThickness;\n\n  float radius = a_radius * a_radiusCoef;\n  vec2 normal = a_normal * a_normalCoef;\n  vec2 position = a_positionStart * (1.0 - a_positionCoef) + a_positionEnd * a_positionCoef;\n\n  float normalLength = length(normal);\n  vec2 unitNormal = normal / normalLength;\n\n  // These first computations are taken from edge.vert.glsl. Please read it to\n  // get better comments on what's happening:\n  float pixelsThickness = max(normalLength, minThickness * u_sizeRatio);\n  float webGLThickness = pixelsThickness * u_correctionRatio / u_sizeRatio;\n\n  // Here, we move the point to leave space for the arrow head:\n  float direction = sign(radius);\n  float webGLNodeRadius = direction * radius * 2.0 * u_correctionRatio / u_sizeRatio;\n  float webGLArrowHeadLength = webGLThickness * u_lengthToThicknessRatio * 2.0;\n\n  vec2 compensationVector = vec2(-direction * unitNormal.y, direction * unitNormal.x) * (webGLNodeRadius + webGLArrowHeadLength);\n\n  // Here is the proper position of the vertex\n  gl_Position = vec4((u_matrix * vec3(position + unitNormal * webGLThickness + compensationVector, 1)).xy, 0, 1);\n\n  v_thickness = webGLThickness / u_zoomRatio;\n\n  v_normal = unitNormal;\n\n  v_feather = u_feather * u_correctionRatio / u_zoomRatio / u_pixelRatio * 2.0;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n", Gi = WebGLRenderingContext, Ki = Gi.UNSIGNED_BYTE, qi = Gi.FLOAT, Ji = [
	"u_matrix",
	"u_zoomRatio",
	"u_sizeRatio",
	"u_correctionRatio",
	"u_pixelRatio",
	"u_feather",
	"u_minEdgeThickness",
	"u_lengthToThicknessRatio"
], Yi = { lengthToThicknessRatio: Vi.lengthToThicknessRatio };
function Xi(e) {
	var t = X(X({}, Yi), e || {});
	return /*#__PURE__*/ function(e) {
		function n() {
			return G(this, n), q(this, n, arguments);
		}
		return J(n, e), K(n, [
			{
				key: "getDefinition",
				value: function() {
					return {
						VERTICES: 6,
						VERTEX_SHADER_SOURCE: Wi,
						FRAGMENT_SHADER_SOURCE: Ui,
						METHOD: WebGLRenderingContext.TRIANGLES,
						UNIFORMS: Ji,
						ATTRIBUTES: [
							{
								name: "a_positionStart",
								size: 2,
								type: qi
							},
							{
								name: "a_positionEnd",
								size: 2,
								type: qi
							},
							{
								name: "a_normal",
								size: 2,
								type: qi
							},
							{
								name: "a_color",
								size: 4,
								type: Ki,
								normalized: !0
							},
							{
								name: "a_id",
								size: 4,
								type: Ki,
								normalized: !0
							},
							{
								name: "a_radius",
								size: 1,
								type: qi
							}
						],
						CONSTANT_ATTRIBUTES: [
							{
								name: "a_positionCoef",
								size: 1,
								type: qi
							},
							{
								name: "a_normalCoef",
								size: 1,
								type: qi
							},
							{
								name: "a_radiusCoef",
								size: 1,
								type: qi
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
					var a = i.size || 1, o = n.x, s = n.y, c = r.x, l = r.y, u = ei(i.color), d = c - o, f = l - s, p = r.size || 1, m = d * d + f * f, h = 0, g = 0;
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
	}(Ci);
}
Xi();
function Zi(e) {
	return wi([Xi(e), Hi(e)]);
}
var Qi = Zi(), $i = "\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_normal;\nattribute float a_normalCoef;\nattribute vec2 a_positionStart;\nattribute vec2 a_positionEnd;\nattribute float a_positionCoef;\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_zoomRatio;\nuniform float u_pixelRatio;\nuniform float u_correctionRatio;\nuniform float u_minEdgeThickness;\nuniform float u_feather;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\nvarying float v_feather;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float minThickness = u_minEdgeThickness;\n\n  vec2 normal = a_normal * a_normalCoef;\n  vec2 position = a_positionStart * (1.0 - a_positionCoef) + a_positionEnd * a_positionCoef;\n\n  float normalLength = length(normal);\n  vec2 unitNormal = normal / normalLength;\n\n  // We require edges to be at least \"minThickness\" pixels thick *on screen*\n  // (so we need to compensate the size ratio):\n  float pixelsThickness = max(normalLength, minThickness * u_sizeRatio);\n\n  // Then, we need to retrieve the normalized thickness of the edge in the WebGL\n  // referential (in a ([0, 1], [0, 1]) space), using our \"magic\" correction\n  // ratio:\n  float webGLThickness = pixelsThickness * u_correctionRatio / u_sizeRatio;\n\n  // Here is the proper position of the vertex\n  gl_Position = vec4((u_matrix * vec3(position + unitNormal * webGLThickness, 1)).xy, 0, 1);\n\n  // For the fragment shader though, we need a thickness that takes the \"magic\"\n  // correction ratio into account (as in webGLThickness), but so that the\n  // antialiasing effect does not depend on the zoom level. So here's yet\n  // another thickness version:\n  v_thickness = webGLThickness / u_zoomRatio;\n\n  v_normal = unitNormal;\n\n  v_feather = u_feather * u_correctionRatio / u_zoomRatio / u_pixelRatio * 2.0;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n", ea = WebGLRenderingContext, ta = ea.UNSIGNED_BYTE, na = ea.FLOAT, ra = [
	"u_matrix",
	"u_zoomRatio",
	"u_sizeRatio",
	"u_correctionRatio",
	"u_pixelRatio",
	"u_feather",
	"u_minEdgeThickness"
], ia = /*#__PURE__*/ function(e) {
	function t() {
		return G(this, t), q(this, t, arguments);
	}
	return J(t, e), K(t, [
		{
			key: "getDefinition",
			value: function() {
				return {
					VERTICES: 6,
					VERTEX_SHADER_SOURCE: $i,
					FRAGMENT_SHADER_SOURCE: Ui,
					METHOD: WebGLRenderingContext.TRIANGLES,
					UNIFORMS: ra,
					ATTRIBUTES: [
						{
							name: "a_positionStart",
							size: 2,
							type: na
						},
						{
							name: "a_positionEnd",
							size: 2,
							type: na
						},
						{
							name: "a_normal",
							size: 2,
							type: na
						},
						{
							name: "a_color",
							size: 4,
							type: ta,
							normalized: !0
						},
						{
							name: "a_id",
							size: 4,
							type: ta,
							normalized: !0
						}
					],
					CONSTANT_ATTRIBUTES: [{
						name: "a_positionCoef",
						size: 1,
						type: na
					}, {
						name: "a_normalCoef",
						size: 1,
						type: na
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
				var a = i.size || 1, o = n.x, s = n.y, c = r.x, l = r.y, u = ei(i.color), d = c - o, f = l - s, p = d * d + f * f, m = 0, h = 0;
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
}(Ci), aa = /*#__PURE__*/ function(e) {
	function t() {
		var e;
		return G(this, t), e = q(this, t), e.rawEmitter = e, e;
	}
	return J(t, e), K(t);
}(Ve.EventEmitter), oa = /* @__PURE__ */ c((/* @__PURE__ */ o(((e, t) => {
	t.exports = function(e) {
		return typeof e == "object" && !!e && typeof e.addUndirectedEdgeWithKey == "function" && typeof e.dropNode == "function" && typeof e.multi == "boolean";
	};
})))()), sa = {
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
}, ca = {
	easing: "quadraticInOut",
	duration: 150
};
function la() {
	return Float32Array.of(1, 0, 0, 0, 1, 0, 0, 0, 1);
}
function ua(e, t, n) {
	return e[0] = t, e[4] = typeof n == "number" ? n : t, e;
}
function da(e, t) {
	var n = Math.sin(t), r = Math.cos(t);
	return e[0] = r, e[1] = n, e[3] = -n, e[4] = r, e;
}
function fa(e, t, n) {
	return e[6] = t, e[7] = n, e;
}
function pa(e, t) {
	var n = e[0], r = e[1], i = e[2], a = e[3], o = e[4], s = e[5], c = e[6], l = e[7], u = e[8], d = t[0], f = t[1], p = t[2], m = t[3], h = t[4], g = t[5], _ = t[6], v = t[7], y = t[8];
	return e[0] = d * n + f * a + p * c, e[1] = d * r + f * o + p * l, e[2] = d * i + f * s + p * u, e[3] = m * n + h * a + g * c, e[4] = m * r + h * o + g * l, e[5] = m * i + h * s + g * u, e[6] = _ * n + v * a + y * c, e[7] = _ * r + v * o + y * l, e[8] = _ * i + v * s + y * u, e;
}
function ma(e, t) {
	var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1, r = e[0], i = e[1], a = e[3], o = e[4], s = e[6], c = e[7], l = t.x, u = t.y;
	return {
		x: l * r + u * a + s * n,
		y: l * i + u * o + c * n
	};
}
function ha(e, t) {
	var n = e.height / e.width, r = t.height / t.width;
	return n < 1 && r > 1 || n > 1 && r < 1 ? 1 : Math.min(Math.max(r, 1 / r), Math.max(1 / n, n));
}
function ga(e, t, n, r, i) {
	var a = e.angle, o = e.ratio, s = e.x, c = e.y, l = t.width, u = t.height, d = la(), f = Math.min(l, u) - 2 * r, p = ha(t, n);
	return i ? (pa(d, fa(la(), s, c)), pa(d, ua(la(), o)), pa(d, da(la(), a)), pa(d, ua(la(), l / f / 2 / p, u / f / 2 / p))) : (pa(d, ua(la(), f / l * 2 * p, f / u * 2 * p)), pa(d, da(la(), -a)), pa(d, ua(la(), 1 / o)), pa(d, fa(la(), -s, -c))), d;
}
function _a(e, t, n) {
	var r = ma(e, {
		x: Math.cos(t.angle),
		y: Math.sin(t.angle)
	}, 0), i = r.x, a = r.y;
	return 1 / Math.sqrt(i ** 2 + a ** 2) / n.width;
}
function va(e) {
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
function ya(e) {
	if (!(0, oa.default)(e)) throw Error("Sigma: invalid graph instance.");
	e.forEachNode(function(e, t) {
		if (!Number.isFinite(t.x) || !Number.isFinite(t.y)) throw Error(`Sigma: Coordinates of node ${e} are invalid. A node must have a numeric 'x' and 'y' attribute.`);
	});
}
function ba(e, t, n) {
	var r = document.createElement(e);
	if (t) for (var i in t) r.style[i] = t[i];
	if (n) for (var a in n) r.setAttribute(a, n[a]);
	return r;
}
function xa() {
	return window.devicePixelRatio === void 0 ? 1 : window.devicePixelRatio;
}
function Sa(e, t, n) {
	return n.sort(function(e, n) {
		var r = t(e) || 0, i = t(n) || 0;
		return r < i ? -1 : +(r > i);
	});
}
function Ca(e) {
	var t = Ur(e.x, 2), n = t[0], r = t[1], i = Ur(e.y, 2), a = i[0], o = i[1], s = Math.max(r - n, o - a), c = (r + n) / 2, l = (o + a) / 2;
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
function wa(e) {
	"@babel/helpers - typeof";
	return wa = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, wa(e);
}
function Ta(e, t) {
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
function Ea(e) {
	e ||= {};
	for (var t = 0, n = arguments.length <= 1 ? 0 : arguments.length - 1; t < n; t++) {
		var r = t + 1 < 1 || arguments.length <= t + 1 ? void 0 : arguments[t + 1];
		r && Object.assign(e, r);
	}
	return e;
}
// node_modules/.pnpm/sigma@3.0.3_graphology-types@0.24.8/node_modules/sigma/settings/dist/sigma-settings.esm.js
var Da = {
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
	defaultDrawEdgeLabel: Ti,
	defaultDrawNodeLabel: Ei,
	defaultDrawNodeHover: Di,
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
}, Oa = { circle: Pi }, ka = {
	arrow: Qi,
	line: ia
};
function Aa(e) {
	if (typeof e.labelDensity != "number" || e.labelDensity < 0) throw Error("Settings: invalid `labelDensity`. Expecting a positive number.");
	var t = e.minCameraRatio, n = e.maxCameraRatio;
	if (typeof t == "number" && typeof n == "number" && n < t) throw Error("Settings: invalid camera ratio boundaries. Expecting `maxCameraRatio` to be greater than `minCameraRatio`.");
}
function ja(e) {
	var t = Ea({}, Da, e);
	return t.nodeProgramClasses = Ea({}, Oa, t.nodeProgramClasses), t.edgeProgramClasses = Ea({}, ka, t.edgeProgramClasses), t;
}
// node_modules/.pnpm/sigma@3.0.3_graphology-types@0.24.8/node_modules/sigma/dist/sigma.esm.js
var Ma = 1.5, Na = /*#__PURE__*/ function(e) {
	function t() {
		var e;
		return G(this, t), e = q(this, t), Y(e, "x", .5), Y(e, "y", .5), Y(e, "angle", 0), Y(e, "ratio", 1), Y(e, "minRatio", null), Y(e, "maxRatio", null), Y(e, "enabledZooming", !0), Y(e, "enabledPanning", !0), Y(e, "enabledRotation", !0), Y(e, "clean", null), Y(e, "nextFrame", null), Y(e, "previousState", null), Y(e, "enabled", !0), e.previousState = e.getState(), e;
	}
	return J(t, e), K(t, [
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
				return this.enabledPanning && typeof e.x == "number" && (t.x = e.x), this.enabledPanning && typeof e.y == "number" && (t.y = e.y), this.enabledZooming && typeof e.ratio == "number" && (t.ratio = this.getBoundedRatio(e.ratio)), this.enabledRotation && typeof e.angle == "number" && (t.angle = e.angle), this.clean ? this.clean(X(X({}, this.getState()), t)) : t;
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
					var i = X(X({}, ca), n), a = this.validateState(e), o = typeof i.easing == "function" ? i.easing : sa[i.easing], s = Date.now(), c = this.getState(), l = function() {
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
				return e ? typeof e == "number" ? this.animate({ ratio: this.ratio / e }) : this.animate({ ratio: this.ratio / (e.factor || Ma) }, e) : this.animate({ ratio: this.ratio / Ma });
			}
		},
		{
			key: "animatedUnzoom",
			value: function(e) {
				return e ? typeof e == "number" ? this.animate({ ratio: this.ratio * e }) : this.animate({ ratio: this.ratio * (e.factor || Ma) }, e) : this.animate({ ratio: this.ratio * Ma });
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
}(aa);
function Pa(e, t) {
	var n = t.getBoundingClientRect();
	return {
		x: e.clientX - n.left,
		y: e.clientY - n.top
	};
}
function Fa(e, t) {
	var n = X(X({}, Pa(e, t)), {}, {
		sigmaDefaultPrevented: !1,
		preventSigmaDefault: function() {
			n.sigmaDefaultPrevented = !0;
		},
		original: e
	});
	return n;
}
function Ia(e) {
	var t = "x" in e ? e : X(X({}, e.touches[0] || e.previousTouches[0]), {}, {
		original: e.original,
		sigmaDefaultPrevented: e.sigmaDefaultPrevented,
		preventSigmaDefault: function() {
			e.sigmaDefaultPrevented = !0, t.sigmaDefaultPrevented = !0;
		}
	});
	return t;
}
function La(e, t) {
	return X(X({}, Fa(e, t)), {}, { delta: Va(e) });
}
var Ra = 2;
function za(e) {
	for (var t = [], n = 0, r = Math.min(e.length, Ra); n < r; n++) t.push(e[n]);
	return t;
}
function Ba(e, t, n) {
	var r = {
		touches: za(e.touches).map(function(e) {
			return Pa(e, n);
		}),
		previousTouches: t.map(function(e) {
			return Pa(e, n);
		}),
		sigmaDefaultPrevented: !1,
		preventSigmaDefault: function() {
			r.sigmaDefaultPrevented = !0;
		},
		original: e
	};
	return r;
}
function Va(e) {
	if (e.deltaY !== void 0) return e.deltaY * -3 / 360;
	if (e.detail !== void 0) return e.detail / -9;
	throw Error("Captor: could not extract delta from event.");
}
var Ha = /*#__PURE__*/ function(e) {
	function t(e, n) {
		var r;
		return G(this, t), r = q(this, t), r.container = e, r.renderer = n, r;
	}
	return J(t, e), K(t);
}(aa), Ua = [
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
	return X(X({}, e), {}, Y({}, t, Da[t]));
}, {}), Wa = /*#__PURE__*/ function(e) {
	function t(e, n) {
		var r;
		return G(this, t), r = q(this, t, [e, n]), Y(r, "enabled", !0), Y(r, "draggedEvents", 0), Y(r, "downStartTime", null), Y(r, "lastMouseX", null), Y(r, "lastMouseY", null), Y(r, "isMouseDown", !1), Y(r, "isMoving", !1), Y(r, "movingTimeout", null), Y(r, "startCameraState", null), Y(r, "clicks", 0), Y(r, "doubleClickTimeout", null), Y(r, "currentWheelDirection", 0), Y(r, "settings", Ua), r.handleClick = r.handleClick.bind(r), r.handleRightClick = r.handleRightClick.bind(r), r.handleDown = r.handleDown.bind(r), r.handleUp = r.handleUp.bind(r), r.handleMove = r.handleMove.bind(r), r.handleWheel = r.handleWheel.bind(r), r.handleLeave = r.handleLeave.bind(r), r.handleEnter = r.handleEnter.bind(r), e.addEventListener("click", r.handleClick, { capture: !1 }), e.addEventListener("contextmenu", r.handleRightClick, { capture: !1 }), e.addEventListener("mousedown", r.handleDown, { capture: !1 }), e.addEventListener("wheel", r.handleWheel, { capture: !1 }), e.addEventListener("mouseleave", r.handleLeave, { capture: !1 }), e.addEventListener("mouseenter", r.handleEnter, { capture: !1 }), document.addEventListener("mousemove", r.handleMove, { capture: !1 }), document.addEventListener("mouseup", r.handleUp, { capture: !1 }), r;
	}
	return J(t, e), K(t, [
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
					}, this.settings.doubleClickTimeout), this.draggedEvents < this.settings.draggedEventsTolerance && this.emit("click", Fa(e, this.container));
				}
			}
		},
		{
			key: "handleRightClick",
			value: function(e) {
				this.enabled && this.emit("rightClick", Fa(e, this.container));
			}
		},
		{
			key: "handleDoubleClick",
			value: function(e) {
				if (this.enabled) {
					e.preventDefault(), e.stopPropagation();
					var t = Fa(e, this.container);
					if (this.emit("doubleClick", t), !t.sigmaDefaultPrevented) {
						var n = this.renderer.getCamera(), r = n.getBoundedRatio(n.getState().ratio / this.settings.doubleClickZoomingRatio);
						n.animate(this.renderer.getViewportZoomedState(Pa(e, this.container), r), {
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
						var t = Pa(e, this.container), n = t.x, r = t.y;
						this.lastMouseX = n, this.lastMouseY = r, this.draggedEvents = 0, this.downStartTime = Date.now(), this.isMouseDown = !0;
					}
					this.emit("mousedown", Fa(e, this.container));
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
					var r = Pa(e, this.container), i = r.x, a = r.y, o = n.getState(), s = n.getPreviousState() || {
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
					}, 0), this.emit("mouseup", Fa(e, this.container));
				}
			}
		},
		{
			key: "handleMove",
			value: function(e) {
				var t = this;
				if (this.enabled) {
					var n = Fa(e, this.container);
					if (this.emit("mousemovebody", n), (e.target === this.container || e.composedPath()[0] === this.container) && this.emit("mousemove", n), !n.sigmaDefaultPrevented && this.isMouseDown) {
						this.isMoving = !0, this.draggedEvents++, typeof this.movingTimeout == "number" && clearTimeout(this.movingTimeout), this.movingTimeout = window.setTimeout(function() {
							t.movingTimeout = null, t.isMoving = !1;
						}, this.settings.dragTimeout);
						var r = this.renderer.getCamera(), i = Pa(e, this.container), a = i.x, o = i.y, s = this.renderer.viewportToFramedGraph({
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
				this.emit("mouseleave", Fa(e, this.container));
			}
		},
		{
			key: "handleEnter",
			value: function(e) {
				this.emit("mouseenter", Fa(e, this.container));
			}
		},
		{
			key: "handleWheel",
			value: function(e) {
				var t = this, n = this.renderer.getCamera();
				if (this.enabled && n.enabledZooming) {
					var r = Va(e);
					if (r) {
						var i = La(e, this.container);
						if (this.emit("wheel", i), i.sigmaDefaultPrevented) e.preventDefault(), e.stopPropagation();
						else {
							var a = n.getState().ratio, o = r > 0 ? 1 / this.settings.zoomingRatio : this.settings.zoomingRatio, s = n.getBoundedRatio(a * o), c = r > 0 ? 1 : -1, l = Date.now();
							a !== s && (e.preventDefault(), e.stopPropagation(), this.currentWheelDirection === c && this.lastWheelTriggerTime && l - this.lastWheelTriggerTime < this.settings.zoomDuration / 5 || (n.animate(this.renderer.getViewportZoomedState(Pa(e, this.container), s), {
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
}(Ha), Ga = [
	"dragTimeout",
	"inertiaDuration",
	"inertiaRatio",
	"doubleClickTimeout",
	"doubleClickZoomingRatio",
	"doubleClickZoomingDuration",
	"tapMoveTolerance"
].reduce(function(e, t) {
	return X(X({}, e), {}, Y({}, t, Da[t]));
}, {}), Ka = /*#__PURE__*/ function(e) {
	function t(e, n) {
		var r;
		return G(this, t), r = q(this, t, [e, n]), Y(r, "enabled", !0), Y(r, "isMoving", !1), Y(r, "hasMoved", !1), Y(r, "touchMode", 0), Y(r, "startTouchesPositions", []), Y(r, "lastTouches", []), Y(r, "lastTap", null), Y(r, "settings", Ga), r.handleStart = r.handleStart.bind(r), r.handleLeave = r.handleLeave.bind(r), r.handleMove = r.handleMove.bind(r), e.addEventListener("touchstart", r.handleStart, { capture: !1 }), e.addEventListener("touchcancel", r.handleLeave, { capture: !1 }), document.addEventListener("touchend", r.handleLeave, {
			capture: !1,
			passive: !1
		}), document.addEventListener("touchmove", r.handleMove, {
			capture: !1,
			passive: !1
		}), r;
	}
	return J(t, e), K(t, [
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
					var n = za(e.touches);
					if (this.touchMode = n.length, this.startCameraState = this.renderer.getCamera().getState(), this.startTouchesPositions = n.map(function(e) {
						return Pa(e, t.container);
					}), this.touchMode === 2) {
						var r = Ur(this.startTouchesPositions, 2), i = r[0], a = i.x, o = i.y, s = r[1], c = s.x, l = s.y;
						this.startTouchesAngle = Math.atan2(l - o, c - a), this.startTouchesDistance = Math.sqrt((c - a) ** 2 + (l - o) ** 2);
					}
					this.emit("touchdown", Ba(e, this.lastTouches, this.container)), this.lastTouches = n, this.lastTouchesPositions = this.startTouchesPositions;
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
					if (this.emit("touchup", Ba(e, this.lastTouches, this.container)), !e.touches.length) {
						var i = Pa(this.lastTouches[0], this.container), a = this.startTouchesPositions[0], o = (i.x - a.x) ** 2 + (i.y - a.y) ** 2;
						if (!e.touches.length && o < this.settings.tapMoveTolerance ** 2) {
							if (this.lastTap && Date.now() - this.lastTap.time < this.settings.doubleClickTimeout) {
								var s = Ba(e, this.lastTouches, this.container);
								if (this.emit("doubletap", s), this.lastTap = null, !s.sigmaDefaultPrevented) {
									var c = this.renderer.getCamera(), l = c.getBoundedRatio(c.getState().ratio / this.settings.doubleClickZoomingRatio);
									c.animate(this.renderer.getViewportZoomedState(i, l), {
										easing: "quadraticInOut",
										duration: this.settings.doubleClickZoomingDuration
									});
								}
							} else {
								var u = Ba(e, this.lastTouches, this.container);
								this.emit("tap", u), this.lastTap = {
									time: Date.now(),
									position: u.touches[0] || u.previousTouches[0]
								};
							}
						}
					}
					this.lastTouches = za(e.touches), this.startTouchesPositions = [];
				}
			}
		},
		{
			key: "handleMove",
			value: function(e) {
				var t = this;
				if (this.enabled && this.startTouchesPositions.length) {
					e.preventDefault();
					var n = za(e.touches), r = n.map(function(e) {
						return Pa(e, t.container);
					}), i = this.lastTouches;
					this.lastTouches = n, this.lastTouchesPositions = r;
					var a = Ba(e, i, this.container);
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
								var T = this.getDimensions(), E = this.renderer.viewportToFramedGraph((this.startTouchesPositions || [])[0], { cameraState: s }), D = Math.min(T.width, T.height) - 2 * c, O = D / T.width, k = D / T.height, A = w / D, j = _ - D / 2 / O, M = v - D / 2 / k, N = [j * Math.cos(-h.angle) - M * Math.sin(-h.angle), M * Math.cos(-h.angle) + j * Math.sin(-h.angle)];
								j = N[0], M = N[1], h.x = E.x - j * A, h.y = E.y + M * A, o.setState(h);
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
}(Ha);
function qa(e) {
	if (Array.isArray(e)) return Br(e);
}
function Ja(e) {
	if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Ya() {
	throw TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Xa(e) {
	return qa(e) || Ja(e) || Vr(e) || Ya();
}
function Za(e, t) {
	if (e == null) return {};
	var n = {};
	for (var r in e) if ({}.hasOwnProperty.call(e, r)) {
		if (t.indexOf(r) !== -1) continue;
		n[r] = e[r];
	}
	return n;
}
function Qa(e, t) {
	if (e == null) return {};
	var n, r, i = Za(e, t);
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (r = 0; r < a.length; r++) n = a[r], t.indexOf(n) === -1 && {}.propertyIsEnumerable.call(e, n) && (i[n] = e[n]);
	}
	return i;
}
var $a = /*#__PURE__*/ function() {
	function e(t, n) {
		G(this, e), this.key = t, this.size = n;
	}
	return K(e, null, [{
		key: "compare",
		value: function(e, t) {
			return e.size > t.size ? -1 : e.size < t.size || e.key > t.key ? 1 : -1;
		}
	}]);
}(), eo = /*#__PURE__*/ function() {
	function e() {
		G(this, e), Y(this, "width", 0), Y(this, "height", 0), Y(this, "cellSize", 0), Y(this, "columns", 0), Y(this, "rows", 0), Y(this, "cells", {});
	}
	return K(e, [
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
				var r = new $a(e, t), i = this.getIndex(n), a = this.cells[i];
				a || (a = [], this.cells[i] = a), a.push(r);
			}
		},
		{
			key: "organize",
			value: function() {
				for (var e in this.cells) this.cells[e].sort($a.compare);
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
function to(e) {
	var t = e.graph, n = e.hoveredNode, r = e.highlightedNodes, i = e.displayedNodeLabels, a = [];
	return t.forEachEdge(function(e, t, o, s) {
		(o === n || s === n || r.has(o) || r.has(s) || i.has(o) && i.has(s)) && a.push(e);
	}), a;
}
var no = 150, ro = 50, io = Object.prototype.hasOwnProperty;
function ao(e, t, n) {
	if (!io.call(n, "x") || !io.call(n, "y")) throw Error(`Sigma: could not find a valid position (x, y) for node "${t}". All your nodes must have a number "x" and "y". Maybe your forgot to apply a layout or your "nodeReducer" is not returning the correct data?`);
	return n.color ||= e.defaultNodeColor, !n.label && n.label !== "" && (n.label = null), n.label = n.label !== void 0 && n.label !== null ? "" + n.label : null, n.size ||= 2, io.call(n, "hidden") || (n.hidden = !1), io.call(n, "highlighted") || (n.highlighted = !1), io.call(n, "forceLabel") || (n.forceLabel = !1), n.type && n.type !== "" || (n.type = e.defaultNodeType), n.zIndex ||= 0, n;
}
function oo(e, t, n) {
	return n.color ||= e.defaultEdgeColor, n.label ||= "", n.size ||= .5, io.call(n, "hidden") || (n.hidden = !1), io.call(n, "forceLabel") || (n.forceLabel = !1), n.type && n.type !== "" || (n.type = e.defaultEdgeType), n.zIndex ||= 0, n;
}
var so = /* @__PURE__ */ function(e) {
	function t(e, n) {
		var r, i = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
		if (G(this, t), r = q(this, t), Y(r, "elements", {}), Y(r, "canvasContexts", {}), Y(r, "webGLContexts", {}), Y(r, "pickingLayers", /* @__PURE__ */ new Set()), Y(r, "textures", {}), Y(r, "frameBuffers", {}), Y(r, "activeListeners", {}), Y(r, "labelGrid", new eo()), Y(r, "nodeDataCache", {}), Y(r, "edgeDataCache", {}), Y(r, "nodeProgramIndex", {}), Y(r, "edgeProgramIndex", {}), Y(r, "nodesWithForcedLabels", /* @__PURE__ */ new Set()), Y(r, "edgesWithForcedLabels", /* @__PURE__ */ new Set()), Y(r, "nodeExtent", {
			x: [0, 1],
			y: [0, 1]
		}), Y(r, "nodeZExtent", [Infinity, -Infinity]), Y(r, "edgeZExtent", [Infinity, -Infinity]), Y(r, "matrix", la()), Y(r, "invMatrix", la()), Y(r, "correctionRatio", 1), Y(r, "customBBox", null), Y(r, "normalizationFunction", Ca({
			x: [0, 1],
			y: [0, 1]
		})), Y(r, "graphToViewportRatio", 1), Y(r, "itemIDsIndex", {}), Y(r, "nodeIndices", {}), Y(r, "edgeIndices", {}), Y(r, "width", 0), Y(r, "height", 0), Y(r, "pixelRatio", xa()), Y(r, "pickingDownSizingRatio", 2 * r.pixelRatio), Y(r, "displayedNodeLabels", /* @__PURE__ */ new Set()), Y(r, "displayedEdgeLabels", /* @__PURE__ */ new Set()), Y(r, "highlightedNodes", /* @__PURE__ */ new Set()), Y(r, "hoveredNode", null), Y(r, "hoveredEdge", null), Y(r, "renderFrame", null), Y(r, "renderHighlightedNodesFrame", null), Y(r, "needToProcess", !1), Y(r, "checkEdgesEventsFrame", null), Y(r, "nodePrograms", {}), Y(r, "nodeHoverPrograms", {}), Y(r, "edgePrograms", {}), r.settings = ja(i), Aa(r.settings), ya(e), !(n instanceof HTMLElement)) throw Error("Sigma: container should be an html element.");
		for (var a in r.graph = e, r.container = n, r.createWebGLContext("edges", { picking: i.enableEdgeEvents }), r.createCanvasContext("edgeLabels"), r.createWebGLContext("nodes", { picking: !0 }), r.createCanvasContext("labels"), r.createCanvasContext("hovers"), r.createWebGLContext("hoverNodes"), r.createCanvasContext("mouse", { style: {
			touchAction: "none",
			userSelect: "none"
		} }), r.resize(), r.settings.nodeProgramClasses) r.registerNodeProgram(a, r.settings.nodeProgramClasses[a], r.settings.nodeHoverProgramClasses[a]);
		for (var o in r.settings.edgeProgramClasses) r.registerEdgeProgram(o, r.settings.edgeProgramClasses[o]);
		return r.camera = new Na(), r.bindCameraHandlers(), r.mouseCaptor = new Wa(r.elements.mouse, r), r.mouseCaptor.setSettings(r.settings), r.touchCaptor = new Ka(r.elements.mouse, r), r.touchCaptor.setSettings(r.settings), r.bindEventHandlers(), r.bindGraphHandlers(), r.handleSettingsUpdate(), r.refresh(), r;
	}
	return J(t, e), K(t, [
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
					var t = this.nodePrograms, n = t[e], r = Qa(t, [e].map(jr));
					n.kill(), this.nodePrograms = r;
				}
				if (this.nodeHoverPrograms[e]) {
					var i = this.nodeHoverPrograms, a = i[e], o = Qa(i, [e].map(jr));
					a.kill(), this.nodePrograms = o;
				}
				return this;
			}
		},
		{
			key: "unregisterEdgeProgram",
			value: function(e) {
				if (this.edgePrograms[e]) {
					var t = this.edgePrograms, n = t[e], r = Qa(t, [e].map(jr));
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
				var t = e.x, n = e.y, r = ai(this.webGLContexts.nodes, this.frameBuffers.nodes, t, n, this.pixelRatio, this.pickingDownSizingRatio), i = ii.apply(void 0, Xa(r)), a = this.itemIDsIndex[i];
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
					var n = Ia(t), r = {
						event: n,
						preventSigmaDefault: function() {
							n.preventSigmaDefault();
						}
					}, i = e.getNodeAtPosition(n);
					if (i && e.hoveredNode !== i && !e.nodeDataCache[i].hidden) e.hoveredNode && e.emit("leaveNode", X(X({}, r), {}, { node: e.hoveredNode })), e.hoveredNode = i, e.emit("enterNode", X(X({}, r), {}, { node: i })), e.scheduleHighlightedNodesRender();
					else if (e.hoveredNode && e.getNodeAtPosition(n) !== e.hoveredNode) {
						var a = e.hoveredNode;
						e.hoveredNode = null, e.emit("leaveNode", X(X({}, r), {}, { node: a })), e.scheduleHighlightedNodesRender();
					} else if (e.settings.enableEdgeEvents) {
						var o = e.hoveredNode ? null : e.getEdgeAtPoint(r.event.x, r.event.y);
						o !== e.hoveredEdge && (e.hoveredEdge && e.emit("leaveEdge", X(X({}, r), {}, { edge: e.hoveredEdge })), o && e.emit("enterEdge", X(X({}, r), {}, { edge: o })), e.hoveredEdge = o);
					}
				}, this.activeListeners.handleMoveBody = function(t) {
					var n = Ia(t);
					e.emit("moveBody", {
						event: n,
						preventSigmaDefault: function() {
							n.preventSigmaDefault();
						}
					});
				}, this.activeListeners.handleLeave = function(t) {
					var n = Ia(t), r = {
						event: n,
						preventSigmaDefault: function() {
							n.preventSigmaDefault();
						}
					};
					e.hoveredNode && (e.emit("leaveNode", X(X({}, r), {}, { node: e.hoveredNode })), e.scheduleHighlightedNodesRender()), e.settings.enableEdgeEvents && e.hoveredEdge && (e.emit("leaveEdge", X(X({}, r), {}, { edge: e.hoveredEdge })), e.scheduleHighlightedNodesRender()), e.emit("leaveStage", X({}, r));
				}, this.activeListeners.handleEnter = function(t) {
					var n = Ia(t), r = {
						event: n,
						preventSigmaDefault: function() {
							n.preventSigmaDefault();
						}
					};
					e.emit("enterStage", X({}, r));
				};
				var t = function(t) {
					return function(n) {
						var r = Ia(n), i = {
							event: r,
							preventSigmaDefault: function() {
								r.preventSigmaDefault();
							}
						}, a = e.getNodeAtPosition(r);
						if (a) return e.emit(`${t}Node`, X(X({}, i), {}, { node: a }));
						if (e.settings.enableEdgeEvents) {
							var o = e.getEdgeAtPoint(r.x, r.y);
							if (o) return e.emit(`${t}Edge`, X(X({}, i), {}, { edge: o }));
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
				var n = ai(this.webGLContexts.edges, this.frameBuffers.edges, e, t, this.pixelRatio, this.pickingDownSizingRatio), r = ii.apply(void 0, Xa(n)), i = this.itemIDsIndex[r];
				return i && i.type === "edge" ? i.id : null;
			}
		},
		{
			key: "process",
			value: function() {
				var e = this;
				this.emit("beforeProcess");
				var t = this.graph, n = this.settings, r = this.getDimensions();
				if (this.nodeExtent = va(this.graph), !this.settings.autoRescale) {
					var i = r.width, a = r.height, o = this.nodeExtent, s = o.x, c = o.y;
					this.nodeExtent = {
						x: [(s[0] + s[1]) / 2 - i / 2, (s[0] + s[1]) / 2 + i / 2],
						y: [(c[0] + c[1]) / 2 - a / 2, (c[0] + c[1]) / 2 + a / 2]
					};
				}
				this.normalizationFunction = Ca(this.customBBox || this.nodeExtent);
				var l = ga(new Na().getState(), r, this.getGraphDimensions(), this.getStagePadding());
				this.labelGrid.resizeAndClear(r, n.labelGridCellSize);
				for (var u = {}, d = {}, f = {}, p = {}, m = 1, h = t.nodes(), g = 0, _ = h.length; g < _; g++) {
					var v = h[g], y = this.nodeDataCache[v], b = t.getNodeAttributes(v);
					y.x = b.x, y.y = b.y, this.normalizationFunction.applyTo(y), typeof y.label == "string" && !y.hidden && this.labelGrid.add(v, y.size, this.framedGraphToViewport(y, { matrix: l })), u[y.type] = (u[y.type] || 0) + 1;
				}
				for (var x in this.labelGrid.organize(), this.nodePrograms) {
					if (!io.call(this.nodePrograms, x)) throw Error(`Sigma: could not find a suitable program for node type "${x}"!`);
					this.nodePrograms[x].reallocate(u[x] || 0), u[x] = 0;
				}
				this.settings.zIndex && this.nodeZExtent[0] !== this.nodeZExtent[1] && (h = Sa(this.nodeZExtent, function(t) {
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
				for (var M in this.settings.zIndex && this.edgeZExtent[0] !== this.edgeZExtent[1] && (D = Sa(this.edgeZExtent, function(t) {
					return e.edgeDataCache[t].zIndex;
				}, D)), this.edgePrograms) {
					if (!io.call(this.edgePrograms, M)) throw Error(`Sigma: could not find a suitable program for edge type "${M}"!`);
					this.edgePrograms[M].reallocate(E[M] || 0), E[M] = 0;
				}
				for (var N = 0, ee = D.length; N < ee; N++) {
					var P = D[N];
					f[P] = m, p[f[P]] = {
						type: "edge",
						id: P
					}, m++;
					var te = this.edgeDataCache[P];
					this.addEdgeToProgram(P, f[P], E[te.type]++);
				}
				return this.itemIDsIndex = p, this.nodeIndices = d, this.edgeIndices = f, this.emit("afterProcess"), this;
			}
		},
		{
			key: "handleSettingsUpdate",
			value: function(e) {
				var t = this, n = this.settings;
				if (this.camera.minRatio = n.minCameraRatio, this.camera.maxRatio = n.maxCameraRatio, this.camera.enabledZooming = n.enableCameraZooming, this.camera.enabledPanning = n.enableCameraPanning, this.camera.enabledRotation = n.enableCameraRotation, n.cameraPanBoundaries ? this.camera.clean = function(e) {
					return t.cleanCameraState(e, n.cameraPanBoundaries && wa(n.cameraPanBoundaries) === "object" ? n.cameraPanBoundaries : {});
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
				var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = t.tolerance, r = n === void 0 ? 0 : n, i = t.boundaries, a = X({}, e), o = i || this.nodeExtent, s = Ur(o.x, 2), c = s[0], l = s[1], u = Ur(o.y, 2), d = u[0], f = u[1], p = [
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
				Ta(t, this.nodesWithForcedLabels), this.displayedNodeLabels = /* @__PURE__ */ new Set();
				for (var n = this.canvasContexts.labels, r = 0, i = t.length; r < i; r++) {
					var a = t[r], o = this.nodeDataCache[a];
					if (!this.displayedNodeLabels.has(a) && !o.hidden) {
						var s = this.framedGraphToViewport(o), c = s.x, l = s.y, u = this.scaleSize(o.size);
						if (!(!o.forceLabel && u < this.settings.labelRenderedSizeThreshold) && !(c < -no || c > this.width + no || l < -ro || l > this.height + ro)) {
							this.displayedNodeLabels.add(a);
							var d = this.settings.defaultDrawNodeLabel;
							(this.nodePrograms[o.type]?.drawLabel || d)(n, X(X({ key: a }, o), {}, {
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
				var t = to({
					graph: this.graph,
					hoveredNode: this.hoveredNode,
					displayedNodeLabels: this.displayedNodeLabels,
					highlightedNodes: this.highlightedNodes
				});
				Ta(t, this.edgesWithForcedLabels);
				for (var n = /* @__PURE__ */ new Set(), r = 0, i = t.length; r < i; r++) {
					var a = t[r], o = this.graph.extremities(a), s = this.nodeDataCache[o[0]], c = this.nodeDataCache[o[1]], l = this.edgeDataCache[a];
					if (!n.has(a) && !(l.hidden || s.hidden || c.hidden)) {
						var u = this.settings.defaultDrawEdgeLabel;
						(this.edgePrograms[l.type]?.drawLabel || u)(e, X(X({ key: a }, l), {}, { size: this.scaleSize(l.size) }), X(X(X({ key: o[0] }, s), this.framedGraphToViewport(s)), {}, { size: this.scaleSize(s.size) }), X(X(X({ key: o[1] }, c), this.framedGraphToViewport(c)), {}, { size: this.scaleSize(c.size) }), this.settings), n.add(a);
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
					(e.nodePrograms[r.type]?.drawHover || c)(t, X(X({ key: n }, r), {}, {
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
				this.matrix = ga(i, a, o, s), this.invMatrix = ga(i, a, o, s, !0), this.correctionRatio = _a(this.matrix, i, a), this.graphToViewportRatio = this.getGraphToViewportRatio();
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
				var n = ao(this.settings, e, t);
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
				var n = oo(this.settings, e, t);
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
				this.labelGrid = new eo(), this.nodeExtent = {
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
				var r = ba(t, { position: "absolute" }, { class: `sigma-${e}` });
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
				var r = X({
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
				return X({}, this.settings);
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
				var n = X({}, this.settings);
				return this.settings[e] = t, Aa(this.settings), this.handleSettingsUpdate(n), this.scheduleRefresh(), this;
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
				var t = X({}, this.settings);
				return this.settings = X(X({}, this.settings), e), Aa(this.settings), this.handleSettingsUpdate(t), this.scheduleRefresh(), this;
			}
		},
		{
			key: "resize",
			value: function(e) {
				var t = this.width, n = this.height;
				if (this.width = this.container.offsetWidth, this.height = this.container.offsetHeight, this.pixelRatio = xa(), this.width === 0) {
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
				return this.refresh(X(X({}, e), {}, { schedule: !0 }));
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
				var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = !!t.cameraState || !!t.viewportDimensions || !!t.graphDimensions, r = ma(t.matrix ? t.matrix : n ? ga(t.cameraState || this.camera.getState(), t.viewportDimensions || this.getDimensions(), t.graphDimensions || this.getGraphDimensions(), t.padding || this.getStagePadding()) : this.matrix, e);
				return {
					x: (1 + r.x) * this.width / 2,
					y: (1 - r.y) * this.height / 2
				};
			}
		},
		{
			key: "viewportToFramedGraph",
			value: function(e) {
				var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, n = !!t.cameraState || !!t.viewportDimensions || !t.graphDimensions, r = ma(t.matrix ? t.matrix : n ? ga(t.cameraState || this.camera.getState(), t.viewportDimensions || this.getDimensions(), t.graphDimensions || this.getGraphDimensions(), t.padding || this.getStagePadding(), !0) : this.invMatrix, {
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
}(aa), co = Math.SQRT2, lo = 250, uo = 900;
function fo(e, t, n = po()) {
	let r = e.getState();
	if (n) return e.setState(t), { cancel: () => void 0 };
	let i = ho([
		r.x,
		r.y,
		r.ratio
	], [
		t.x,
		t.y,
		t.ratio
	]), a = Math.min(uo, Math.max(lo, i.duration)), o = performance.now(), s = requestAnimationFrame(function t(n) {
		let r = Math.min(1, (n - o) / a), [c, l, u] = i.at(mo(r));
		e.setState({
			x: c,
			y: l,
			ratio: u
		}), r < 1 && (s = requestAnimationFrame(t));
	});
	return { cancel: () => cancelAnimationFrame(s) };
}
function po() {
	return typeof matchMedia == "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function mo(e) {
	return e < .5 ? 4 * e * e * e : 1 - (-2 * e + 2) ** 3 / 2;
}
function ho([e, t, n], [r, i, a]) {
	let o = r - e, s = i - t, c = o * o + s * s;
	if (c < 1e-12) {
		let r = Math.log(a / n) / co;
		return {
			at: (i) => [
				e + i * o,
				t + i * s,
				n * Math.exp(co * i * r)
			],
			duration: Math.abs(r) * 1e3 * .8
		};
	}
	let l = Math.sqrt(c), u = (a * a - n * n + co ** 4 * c) / (2 * n * co ** 2 * l), d = (a * a - n * n - co ** 4 * c) / (2 * a * co ** 2 * l), f = Math.log(Math.sqrt(u * u + 1) - u), p = (Math.log(Math.sqrt(d * d + 1) - d) - f) / co;
	return {
		at: (r) => {
			let i = r * p, a = Math.cosh(f), c = n / (co * co * l) * (a * Math.tanh(co * i + f) - Math.sinh(f));
			return [
				e + c * o,
				t + c * s,
				n * a / Math.cosh(co * i + f)
			];
		},
		duration: p * 1e3 * .8
	};
}
// src/ui/colour.ts
function go(e) {
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
function _o(e, t, n) {
	let r = typeof e == "string" ? go(e) : e, i = typeof t == "string" ? go(t) : t;
	return !r || !i ? typeof e == "string" ? e : bo(e, 1) : bo(r.map((e, t) => e * n + i[t] * (1 - n)), 1);
}
function vo(e, t) {
	let n = typeof e == "string" ? go(e) : e;
	return n ? bo(n, t) : e;
}
function yo(e, t) {
	let n = typeof e == "string" ? go(e) : e;
	return n ? bo(n.map((e) => e * t), t) : "rgba(0, 0, 0, 0)";
}
function bo([e, t, n], r) {
	return `rgba(${Math.round(e)}, ${Math.round(t)}, ${Math.round(n)}, ${r})`;
}
// node_modules/.pnpm/@sigma+node-border@3.0.0_sigma@3.0.3_graphology-types@0.24.8_/node_modules/@sigma/node-border/dist/sigma-node-border.esm.js
function xo(e) {
	if (Array.isArray(e)) return e;
}
function So(e, t) {
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
function Co(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function wo(e, t) {
	if (e) {
		if (typeof e == "string") return Co(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? Co(e, t) : void 0;
	}
}
function To() {
	throw TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Eo(e, t) {
	return xo(e) || So(e, t) || wo(e, t) || To();
}
function Do(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function Oo(e, t) {
	if (typeof e != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (typeof r != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function ko(e) {
	var t = Oo(e, "string");
	return typeof t == "symbol" ? t : t + "";
}
function Ao(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, ko(r.key), r);
	}
}
function jo(e, t, n) {
	return t && Ao(e.prototype, t), n && Ao(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function Mo(e) {
	return Mo = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
		return e.__proto__ || Object.getPrototypeOf(e);
	}, Mo(e);
}
function No() {
	try {
		var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
	} catch {}
	return (No = function() {
		return !!e;
	})();
}
function Po(e) {
	if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
	return e;
}
function Fo(e, t) {
	if (t && (typeof t == "object" || typeof t == "function")) return t;
	if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
	return Po(e);
}
function Io(e, t, n) {
	return t = Mo(t), Fo(e, No() ? Reflect.construct(t, n || [], Mo(e).constructor) : t.apply(e, n));
}
function Lo(e, t) {
	return Lo = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
		return e.__proto__ = t, e;
	}, Lo(e, t);
}
function Ro(e, t) {
	if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
	e.prototype = Object.create(t && t.prototype, { constructor: {
		value: e,
		writable: !0,
		configurable: !0
	} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && Lo(e, t);
}
function zo(e, t, n) {
	return (t = ko(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function Bo(e) {
	if (Array.isArray(e)) return Co(e);
}
function Vo(e) {
	if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function Ho() {
	throw TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function Uo(e) {
	return Bo(e) || Vo(e) || wo(e) || Ho();
}
function Wo(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function Go(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Wo(Object(n), !0).forEach(function(t) {
			zo(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Wo(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
var Ko = "relative", qo = {
	drawLabel: void 0,
	drawHover: void 0,
	borders: [{
		size: { value: .1 },
		color: { attribute: "borderColor" }
	}, {
		size: { fill: !0 },
		color: { attribute: "color" }
	}]
}, Jo = "#000000";
function Yo(e) {
	var t = e.borders, n = _i(t.filter(function(e) {
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
		var r = "attribute" in n ? `v_borderSize_${t + 1}` : _i(n.value), i = (n.mode || Ko) === "pixels" ? "u_correctionRatio" : "v_radius";
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
function Xo(e) {
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
var Zo = WebGLRenderingContext, Qo = Zo.UNSIGNED_BYTE, $o = Zo.FLOAT;
function es(e) {
	var t, n = Go(Go({}, qo), e || {}), r = n.borders, i = n.drawLabel, a = n.drawHover, o = [
		"u_sizeRatio",
		"u_correctionRatio",
		"u_matrix"
	].concat(Uo(r.flatMap(function(e, t) {
		return "value" in e.color ? [`u_borderColor_${t + 1}`] : [];
	})));
	return t = /*#__PURE__*/ function(e) {
		Ro(t, e);
		function t() {
			var e;
			Do(this, t);
			var n = [...arguments];
			return e = Io(this, t, [].concat(n)), zo(Po(e), "drawLabel", i), zo(Po(e), "drawHover", a), e;
		}
		return jo(t, [
			{
				key: "getDefinition",
				value: function() {
					return {
						VERTICES: 3,
						VERTEX_SHADER_SOURCE: Xo(n),
						FRAGMENT_SHADER_SOURCE: Yo(n),
						METHOD: WebGLRenderingContext.TRIANGLES,
						UNIFORMS: o,
						ATTRIBUTES: [
							{
								name: "a_position",
								size: 2,
								type: $o
							},
							{
								name: "a_id",
								size: 4,
								type: Qo,
								normalized: !0
							},
							{
								name: "a_size",
								size: 1,
								type: $o
							}
						].concat(Uo(r.flatMap(function(e, t) {
							return "attribute" in e.color ? [{
								name: `a_borderColor_${t + 1}`,
								size: 4,
								type: Qo,
								normalized: !0
							}] : [];
						})), Uo(r.flatMap(function(e, t) {
							return "attribute" in e.size ? [{
								name: `a_borderSize_${t + 1}`,
								size: 1,
								type: $o
							}] : [];
						}))),
						CONSTANT_ATTRIBUTES: [{
							name: "a_angle",
							size: 1,
							type: $o
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
						"attribute" in r && (i[t++] = ei(n[r.attribute] || r.defaultValue || Jo));
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
							var a = i[`u_borderColor_${t + 1}`], o = Eo(ti(r.value), 4), s = o[0], c = o[1], l = o[2], u = o[3];
							n.uniform4f(a, s / 255, c / 255, l / 255, u / 255);
						}
					});
				}
			}
		]), t;
	}(xi), zo(t, "ANGLE_1", 0), zo(t, "ANGLE_2", 2 * Math.PI / 3), zo(t, "ANGLE_3", 4 * Math.PI / 3), t;
}
es();
// node_modules/.pnpm/@sigma+node-image@3.0.0_sigma@3.0.3_graphology-types@0.24.8_/node_modules/@sigma/node-image/dist/sigma-node-image.esm.js
function ts(e, t) {
	(t == null || t > e.length) && (t = e.length);
	for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
	return r;
}
function ns(e) {
	if (Array.isArray(e)) return ts(e);
}
function rs(e) {
	if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
}
function is(e, t) {
	if (e) {
		if (typeof e == "string") return ts(e, t);
		var n = {}.toString.call(e).slice(8, -1);
		return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? ts(e, t) : void 0;
	}
}
function as() {
	throw TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function os(e) {
	return ns(e) || rs(e) || is(e) || as();
}
function ss(e, t) {
	if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
}
function cs(e, t) {
	if (typeof e != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (typeof r != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
function ls(e) {
	var t = cs(e, "string");
	return typeof t == "symbol" ? t : t + "";
}
function us(e, t) {
	for (var n = 0; n < t.length; n++) {
		var r = t[n];
		r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, ls(r.key), r);
	}
}
function ds(e, t, n) {
	return t && us(e.prototype, t), n && us(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
function fs(e) {
	return fs = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
		return e.__proto__ || Object.getPrototypeOf(e);
	}, fs(e);
}
function ps() {
	try {
		var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
	} catch {}
	return (ps = function() {
		return !!e;
	})();
}
function ms(e) {
	if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
	return e;
}
function hs(e, t) {
	if (t && (typeof t == "object" || typeof t == "function")) return t;
	if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
	return ms(e);
}
function gs(e, t, n) {
	return t = fs(t), hs(e, ps() ? Reflect.construct(t, n || [], fs(e).constructor) : t.apply(e, n));
}
function _s(e, t) {
	for (; !{}.hasOwnProperty.call(e, t) && (e = fs(e)) !== null;);
	return e;
}
function vs() {
	return vs = typeof Reflect < "u" && Reflect.get ? Reflect.get.bind() : function(e, t, n) {
		var r = _s(e, t);
		if (r) {
			var i = Object.getOwnPropertyDescriptor(r, t);
			return i.get ? i.get.call(arguments.length < 3 ? e : n) : i.value;
		}
	}, vs.apply(null, arguments);
}
function ys(e, t, n, r) {
	var i = vs(fs(1 & r ? e.prototype : e), t, n);
	return 2 & r && typeof i == "function" ? function(e) {
		return i.apply(n, e);
	} : i;
}
function bs(e, t) {
	return bs = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
		return e.__proto__ = t, e;
	}, bs(e, t);
}
function xs(e, t) {
	if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
	e.prototype = Object.create(t && t.prototype, { constructor: {
		value: e,
		writable: !0,
		configurable: !0
	} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && bs(e, t);
}
function Z(e, t, n) {
	return (t = ls(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
function Ss(e, t) {
	if (e == null) return {};
	var n = {};
	for (var r in e) if ({}.hasOwnProperty.call(e, r)) {
		if (t.includes(r)) continue;
		n[r] = e[r];
	}
	return n;
}
function Cs(e, t) {
	if (e == null) return {};
	var n, r, i = Ss(e, t);
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (r = 0; r < a.length; r++) n = a[r], t.includes(n) || {}.propertyIsEnumerable.call(e, n) && (i[n] = e[n]);
	}
	return i;
}
function ws(e, t) {
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
		t % 2 ? ws(Object(n), !0).forEach(function(t) {
			Z(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : ws(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
function Ts(e) {
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

    ${os(Array(t)).map(function(e, t) {
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
var Es = "\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_position;\nattribute float a_size;\nattribute float a_angle;\nattribute vec4 a_texture;\nattribute float a_textureIndex;\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\nvarying vec4 v_texture;\nvarying float v_textureIndex;\n\nconst float bias = 255.0 / 254.0;\nconst float marginRatio = 1.05;\n\nvoid main() {\n  float size = a_size * u_correctionRatio / u_sizeRatio * 4.0;\n  vec2 diffVector = size * vec2(cos(a_angle), sin(a_angle));\n  vec2 position = a_position + diffVector * marginRatio;\n  gl_Position = vec4(\n    (u_matrix * vec3(position, 1)).xy,\n    0,\n    1\n  );\n\n  v_diffVector = diffVector;\n  v_radius = size / 2.0 / marginRatio;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n\n  // Pass the texture coordinates:\n  v_textureIndex = a_textureIndex;\n  v_texture = a_texture;\n  #endif\n\n  v_color.a *= bias;\n}\n";
function Ds() {
	Ds = function() {
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
function Os(e, t, n, r, i, a, o) {
	try {
		var s = e[a](o), c = s.value;
	} catch (e) {
		n(e);
		return;
	}
	s.done ? t(c) : Promise.resolve(c).then(r, i);
}
function ks(e) {
	return function() {
		var t = this, n = arguments;
		return new Promise(function(r, i) {
			var a = e.apply(t, n);
			function o(e) {
				Os(a, r, i, o, s, "next", e);
			}
			function s(e) {
				Os(a, r, i, o, s, "throw", e);
			}
			o(void 0);
		});
	};
}
var As = {
	size: {
		mode: "max",
		value: 512
	},
	objectFit: "cover",
	correctCentering: !1,
	maxTextureSize: 4096,
	debounceTimeout: 500,
	crossOrigin: "anonymous"
}, js = 1;
function Ms(e) {
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
function Ns(e) {
	return Ps.apply(this, arguments);
}
function Ps() {
	return Ps = ks(/*#__PURE__*/ Ds().mark(function e(t) {
		var n, r, i, a, o, s, c, l, u, d, f, p, m, h = arguments;
		return Ds().wrap(function(e) {
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
				case 19: return typeof r == "number" && (c.setAttribute("width", "" + r), c.setAttribute("height", "" + r)), d = new XMLSerializer().serializeToString(s), f = new Blob([d], { type: "image/svg+xml" }), p = URL.createObjectURL(f), m = Ms(p), m.finally(function() {
					return URL.revokeObjectURL(p);
				}), e.abrupt("return", m);
				case 26:
				case "end": return e.stop();
			}
		}, e);
	})), Ps.apply(this, arguments);
}
function Fs(e) {
	return Is.apply(this, arguments);
}
function Is() {
	return Is = ks(/*#__PURE__*/ Ds().mark(function e(t) {
		var n, r, i, a, o, s = arguments;
		return Ds().wrap(function(e) {
			for (;;) switch (e.prev = e.next) {
				case 0:
					if (n = s.length > 1 && s[1] !== void 0 ? s[1] : {}, r = n.size, i = n.crossOrigin, a = t.split(/[#?]/)[0].split(".").pop()?.trim().toLowerCase() === "svg", !(a && r)) {
						e.next = 16;
						break;
					}
					return e.prev = 3, e.next = 6, Ns(t, {
						size: r,
						crossOrigin: i
					});
				case 6:
					o = e.sent, e.next = 14;
					break;
				case 9: return e.prev = 9, e.t0 = e.catch(3), e.next = 13, Ms(t, { crossOrigin: i });
				case 13: o = e.sent;
				case 14:
					e.next = 19;
					break;
				case 16: return e.next = 18, Ms(t, { crossOrigin: i });
				case 18: o = e.sent;
				case 19: return e.abrupt("return", o);
				case 20:
				case "end": return e.stop();
			}
		}, e, null, [[3, 9]]);
	})), Is.apply(this, arguments);
}
function Ls(e, t, n) {
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
function Rs(e, t, n) {
	for (var r = t.canvas, i = r.width, a = r.height, o = [], s = n.x, c = n.y, l = n.rowHeight, u = n.maxRowWidth, d = {}, f = 0, p = e.length; f < p; f++) {
		var m = e[f], h = m.key, g = m.image, _ = m.sourceSize, v = m.sourceX, y = m.sourceY, b = m.destinationSize, x = b + js;
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
		var E = o[w], D = E.image, O = E.sourceSize, k = E.sourceX, A = E.sourceY, j = E.destinationSize, M = E.destinationX, N = E.destinationY;
		t.drawImage(D, k, A, O, O, M, N, j, j);
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
function zs(e, t, n) {
	var r = e.atlas, i = e.textures, a = e.cursor, o = {
		atlas: Q({}, r),
		textures: os(i.slice(0, -1)),
		cursor: Q({}, a)
	}, s = [];
	for (var c in t) {
		var l = t[c];
		l.status === "ready" && typeof r[c]?.textureIndex != "number" && s.push(Q({ key: c }, l));
	}
	for (var u = function() {
		var e = Rs(s, n, o.cursor), t = e.atlas, r = e.texture;
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
var Bs = /*#__PURE__*/ function() {
	function e() {
		ss(this, e), this.canvas = document.createElement("canvas"), this.context = this.canvas.getContext("2d", { willReadFrequently: !0 });
	}
	return ds(e, [{
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
}(), Vs = /*#__PURE__*/ function(e) {
	xs(t, e);
	function t() {
		var e, n = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
		return ss(this, t), e = gs(this, t), Z(ms(e), "canvas", document.createElement("canvas")), Z(ms(e), "ctx", e.canvas.getContext("2d", { willReadFrequently: !0 })), Z(ms(e), "corrector", new Bs()), Z(ms(e), "imageStates", {}), Z(ms(e), "textures", [e.ctx.getImageData(0, 0, 1, 1)]), Z(ms(e), "lastTextureCursor", {
			x: 0,
			y: 0,
			rowHeight: 0,
			maxRowWidth: 0
		}), Z(ms(e), "atlas", {}), e.options = Q(Q({}, As), n), e.canvas.width = e.options.maxTextureSize, e.canvas.height = e.options.maxTextureSize, e;
	}
	return ds(t, [
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
				var e = zs({
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
				var e = ks(/*#__PURE__*/ Ds().mark(function e(t) {
					var n, r;
					return Ds().wrap(function(e) {
						for (;;) switch (e.prev = e.next) {
							case 0:
								if (!this.imageStates[t]) {
									e.next = 2;
									break;
								}
								return e.abrupt("return");
							case 2: return this.imageStates[t] = { status: "loading" }, e.prev = 3, n = this.options.size, e.next = 7, Fs(t, {
								size: n.mode === "force" ? n.value : void 0,
								crossOrigin: this.options.crossOrigin || void 0
							});
							case 7:
								r = e.sent, this.imageStates[t] = Q({
									status: "ready",
									image: r
								}, Ls(r, this.corrector, this.options)), this.scheduleGenerateTexture(), e.next = 15;
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
}(Ve.EventEmitter);
Z(Vs, "NEW_TEXTURE_EVENT", "newTexture");
var Hs = [
	"drawHover",
	"drawLabel",
	"drawingMode",
	"keepWithinCircle",
	"padding",
	"colorAttribute",
	"imageAttribute"
], Us = WebGLRenderingContext, Ws = Us.UNSIGNED_BYTE, Gs = Us.FLOAT, Ks = Q(Q({}, As), {}, {
	drawingMode: "background",
	keepWithinCircle: !0,
	drawLabel: void 0,
	drawHover: void 0,
	padding: 0,
	colorAttribute: "color",
	imageAttribute: "image"
}), qs = [
	"u_sizeRatio",
	"u_correctionRatio",
	"u_cameraAngle",
	"u_percentagePadding",
	"u_matrix",
	"u_colorizeImages",
	"u_keepWithinCircle",
	"u_atlas"
];
function Js(e) {
	var t, n = document.createElement("canvas").getContext("webgl"), r = Math.min(n.getParameter(n.MAX_TEXTURE_SIZE), As.maxTextureSize);
	n.canvas.remove();
	var i = Q(Q(Q({}, Ks), { maxTextureSize: r }), e || {}), a = i.drawHover, o = i.drawLabel, s = i.drawingMode, c = i.keepWithinCircle, l = i.padding, u = i.colorAttribute, d = i.imageAttribute, f = new Vs(Cs(i, Hs));
	return t = /*#__PURE__*/ function(e) {
		xs(t, e);
		function t(e, n, r) {
			var i;
			return ss(this, t), i = gs(this, t, [
				e,
				n,
				r
			]), Z(ms(i), "drawLabel", o), Z(ms(i), "drawHover", a), Z(ms(i), "textureManagerCallback", null), i.textureManagerCallback = function(e) {
				var t = e.atlas, n = e.textures, r = n.length !== i.textures.length;
				i.atlas = t, i.textureImages = n, r && i.upgradeShaders(), i.bindTextures(), i.latestRenderParams && i.render(i.latestRenderParams), i.renderer && i.renderer.refresh && i.renderer.refresh();
			}, f.on(Vs.NEW_TEXTURE_EVENT, i.textureManagerCallback), i.atlas = f.getAtlas(), i.textureImages = f.getTextures(), i.textures = i.textureImages.map(function() {
				return e.createTexture();
			}), i.bindTextures(), i;
		}
		return ds(t, [
			{
				key: "getDefinition",
				value: function() {
					return {
						VERTICES: 3,
						VERTEX_SHADER_SOURCE: Es,
						FRAGMENT_SHADER_SOURCE: Ts({ texturesCount: f.getTextures().length }),
						METHOD: WebGLRenderingContext.TRIANGLES,
						UNIFORMS: qs,
						ATTRIBUTES: [
							{
								name: "a_position",
								size: 2,
								type: Gs
							},
							{
								name: "a_size",
								size: 1,
								type: Gs
							},
							{
								name: "a_color",
								size: 4,
								type: Ws,
								normalized: !0
							},
							{
								name: "a_id",
								size: 4,
								type: Ws,
								normalized: !0
							},
							{
								name: "a_texture",
								size: 4,
								type: Gs
							},
							{
								name: "a_textureIndex",
								size: 1,
								type: Gs
							}
						],
						CONSTANT_ATTRIBUTES: [{
							name: "a_angle",
							size: 1,
							type: Gs
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
					this.textureManagerCallback &&= (f.off(Vs.NEW_TEXTURE_EVENT, this.textureManagerCallback), null), ys(t, "kill", this, 3)([]);
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
					ys(t, "renderProgram", this, 3)([e, n]);
				}
			},
			{
				key: "processVisibleItem",
				value: function(e, t, n) {
					var r = this.array, i = ei(n[u]), a = n[d], o = a ? this.atlas[a] : void 0;
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
					this.latestRenderParams = e, n.uniform1f(a, e.correctionRatio), n.uniform1f(i, c ? e.sizeRatio : e.sizeRatio / Math.SQRT2), n.uniform1f(p, e.cameraAngle), n.uniform1f(m, l), n.uniformMatrix3fv(o, !1, e.matrix), n.uniform1iv(u, os(Array(this.textureImages.length)).map(function(e, t) {
						return t;
					})), n.uniform1i(d, +(s === "color")), n.uniform1i(f, +!!c);
				}
			}
		]), t;
	}(xi), Z(t, "ANGLE_1", 0), Z(t, "ANGLE_2", 2 * Math.PI / 3), Z(t, "ANGLE_3", 4 * Math.PI / 3), Z(t, "textureManager", f), t;
}
Js(), Js({
	keepWithinCircle: !1,
	size: {
		mode: "force",
		value: 256
	},
	drawingMode: "color",
	correctCentering: !0
});
// src/ui/programs.ts
var Ys = 5126, Xs = 5121, Zs = 4, Qs = "\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_position;\nattribute float a_size;\nattribute float a_spread;\nattribute float a_angle;\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\nvarying float v_inner;\n\nvoid main() {\n  float inner = a_size * u_correctionRatio / u_sizeRatio * 2.0;\n  float radius = inner * a_spread;\n  // One triangle around the circle: its inscribed circle has the radius, so the corners reach 2x.\n  vec2 diffVector = radius * 2.0 * vec2(cos(a_angle), sin(a_angle));\n  gl_Position = vec4((u_matrix * vec3(a_position + diffVector, 1)).xy, 0, 1);\n  v_diffVector = diffVector;\n  v_radius = radius;\n  v_inner = inner;\n  #ifdef PICKING_MODE\n  v_color = a_id;\n  #else\n  v_color = a_color;\n  #endif\n}\n", $s = "\nprecision highp float;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\nvarying float v_inner;\n\nvoid main(void) {\n  #ifdef PICKING_MODE\n  // The glow isn't part of the node: clicks there go to whatever is underneath.\n  discard;\n  #else\n  float dist = length(v_diffVector);\n  if (dist > v_radius) discard;\n  // Strongest at the node's edge, fading out smoothly. sigma blends premultiplied colours.\n  float t = clamp((dist - v_inner * 0.8) / (v_radius - v_inner * 0.8), 0.0, 1.0);\n  float glow = pow(1.0 - t, 2.2) * v_color.a;\n  gl_FragColor = vec4(v_color.rgb * glow, glow);\n  #endif\n}\n", ec = class extends xi {
	getDefinition() {
		return {
			VERTICES: 3,
			VERTEX_SHADER_SOURCE: Qs,
			FRAGMENT_SHADER_SOURCE: $s,
			METHOD: Zs,
			UNIFORMS: [
				"u_sizeRatio",
				"u_correctionRatio",
				"u_matrix"
			],
			ATTRIBUTES: [
				{
					name: "a_position",
					size: 2,
					type: Ys
				},
				{
					name: "a_size",
					size: 1,
					type: Ys
				},
				{
					name: "a_spread",
					size: 1,
					type: Ys
				},
				{
					name: "a_color",
					size: 4,
					type: Xs,
					normalized: !0
				},
				{
					name: "a_id",
					size: 4,
					type: Xs,
					normalized: !0
				}
			],
			CONSTANT_ATTRIBUTES: [{
				name: "a_angle",
				size: 1,
				type: Ys
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
		i[t++] = n.x, i[t++] = n.y, i[t++] = n.size, i[t++] = r.haloSpread ?? 2, i[t++] = ei(r.haloColor ?? "rgba(0,0,0,0)"), i[t++] = e;
	}
	setUniforms(e, { gl: t, uniformLocations: n }) {
		t.uniform1f(n.u_correctionRatio, e.correctionRatio), t.uniform1f(n.u_sizeRatio, e.sizeRatio), t.uniformMatrix3fv(n.u_matrix, !1, e.matrix);
	}
};
function tc(e, t) {
	let n = Js({
		drawingMode: "background",
		keepWithinCircle: !0,
		objectFit: "cover",
		size: {
			mode: "max",
			value: 96
		},
		crossOrigin: "anonymous",
		debounceTimeout: 40
	}), r = Si([
		ec,
		n,
		es({ borders: [
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
	], e, t), i = es({
		borders: [{
			size: {
				attribute: "borderSize",
				defaultValue: 1,
				mode: "pixels"
			},
			color: { attribute: "borderColor" }
		}, {
			size: { fill: !0 },
			color: { attribute: "color" }
		}],
		drawLabel: e,
		drawHover: t
	}), a = es({
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
			nodeProgramClasses: {
				container: i,
				room: r
			},
			nodeHoverProgramClasses: {
				container: a,
				room: a
			},
			defaultNodeType: "room"
		},
		textures: n.textureManager
	};
}
// src/ui/theme.ts
function nc(e = document.body) {
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
		highContrast: /(^|\s)cpd-theme-[a-z]+-hc(\s|$)/.test(document.documentElement.className) || typeof matchMedia == "function" && matchMedia("(prefers-contrast: more)").matches
	};
}
// src/ui/tooltip.ts
var rc = 14;
function ic(e, t, n, r) {
	if (!e || !t) return;
	let i = n + rc + e.offsetWidth > t.clientWidth ? n - rc - e.offsetWidth : n + rc, a = r + rc + e.offsetHeight > t.clientHeight ? r - rc - e.offsetHeight : r + rc;
	e.style.transform = `translate(${Math.max(4, i)}px, ${Math.max(4, a)}px)`;
}
// node_modules/.pnpm/react@19.3.1/node_modules/react/cjs/react-jsx-runtime.production.js
var ac = /* @__PURE__ */ o(((e) => {
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
	t.exports = ac();
})))(), oc = 120, sc = 250, cc = 24, lc = {
	x: .5,
	y: .5,
	ratio: 1
}, uc = 1600, dc = 6;
function fc(e) {
	let t = window.React.useRef(null), n = window.React.useRef(e);
	n.current = e;
	let r = window.React.useRef(null), i = window.React.useRef(null), a = window.React.useRef(null), o = window.React.useRef(null), s = window.React.useRef(null), c = window.React.useRef({
		x: 0,
		y: 0
	}), [l, u] = window.React.useState(null), [d, f] = window.React.useState(!1), p = (e) => {
		let t = r.current;
		t && (i.current?.cancel(), i.current = fo(t.getCamera(), e));
	};
	window.React.useEffect(() => {
		let a = t.current, s = nc(), c, l;
		try {
			let { drawLabel: t, drawHover: r } = gc(s);
			l = tc(t, r);
			let i = e.graph.someNode((e, t) => !t.container && (t.unread > 0 || t.highlight > 0));
			c = new so(e.graph, a, {
				...hc(s, n, i),
				...l.settings
			});
		} catch (e) {
			console.warn("[space-room-map] Can't render the map", e), f(!0);
			return;
		}
		r.current = c, mc(c), e.camera && c.getCamera().setState(e.camera), c.getCamera().on("updated", ({ x: e, y: t, ratio: r }) => n.current.onCameraChange?.({
			x: e,
			y: t,
			ratio: r
		}));
		let d, h = () => {
			clearTimeout(d), l.textures?.off("newTexture", g), f(!0);
		}, g = () => void requestAnimationFrame(h);
		c.getGraph().someNode((e, t) => !!n.current.avatarUrl?.(t.avatar)) && l.textures ? (l.textures.on("newTexture", g), d = setTimeout(h, sc)) : h();
		let _ = c.getGraph().filterNodes((e, t) => !t.container && t.highlight > 0), v = _.length > 0 && !po() && !s.highContrast, y = 0, b = () => {
			let e = o.current, t = e?.getContext("2d");
			if (!e || !t) return;
			let r = a.clientWidth, i = a.clientHeight, l = window.devicePixelRatio || 1;
			(e.width !== Math.round(r * l) || e.height !== Math.round(i * l)) && (e.width = Math.round(r * l), e.height = Math.round(i * l)), t.setTransform(l, 0, 0, l, 0, 0), t.clearRect(0, 0, r, i);
			let u = v ? performance.now() % uc / uc : 0, { matches: d } = n.current;
			for (let e of _) {
				let n = c.getGraph().getNodeAttributes(e), a = c.getNodeDisplayData(e);
				if (!a || d && !d.has(n.roomId ?? "")) continue;
				let o = c.framedGraphToViewport(a), l = Math.max(dc, c.scaleSize(a.size));
				o.x < -l - 40 || o.y < -l - 40 || o.x > r + l + 40 || o.y > i + l + 40 || (t.lineWidth = 2.5, t.strokeStyle = s.highlight, t.globalAlpha = v ? (1 - u) * .8 : .8, t.beginPath(), t.arc(o.x, o.y, l + 3 + u * 14, 0, Math.PI * 2), t.stroke(), t.globalAlpha = 1, _c(t, o.x + l * .72, o.y - l * .72, n.highlight, s.highlight, s));
			}
			v && (y = requestAnimationFrame(b));
		};
		v && (y = requestAnimationFrame(b)), c.on("afterRender", () => {
			_.length && !v && b();
			let e = c.framedGraphToViewport({
				x: 0,
				y: 0
			}), t = cc / c.getCamera().ratio;
			for (; t >= 48;) t /= 2;
			for (; t < cc;) t *= 2;
			a.style.setProperty("--srm-grid-size", `${t}px`), a.style.setProperty("--srm-grid-x", `${e.x % t}px`), a.style.setProperty("--srm-grid-y", `${e.y % t}px`);
		});
		let x;
		c.on("enterNode", ({ node: e, event: t }) => {
			clearTimeout(x), a.style.cursor = "pointer", u(c.getGraph().getNodeAttributes(e)), m(t.x, t.y);
		}), c.on("leaveNode", () => {
			a.style.cursor = "", x = setTimeout(() => u(null), oc);
		});
		let S = (e) => {
			let t = a.getBoundingClientRect();
			m(e.clientX - t.left, e.clientY - t.top);
		}, C = () => u(null), w = () => i.current?.cancel();
		return a.addEventListener("mousemove", S), a.addEventListener("mouseleave", C), a.addEventListener("wheel", w, { passive: !0 }), a.addEventListener("mousedown", w), a.addEventListener("touchstart", w, { passive: !0 }), c.on("clickNode", ({ node: e }) => {
			let t = c.getGraph().getNodeAttributes(e);
			if (t.container) {
				let n = pc(c, e);
				if (c.getCamera().ratio > n.ratio * 1.3 || !t.roomId) {
					p(n);
					return;
				}
			}
			t.roomId && n.current.onActivate(t.roomId);
		}), c.on("doubleClickNode", (e) => e.preventSigmaDefault()), c.on("clickStage", () => p(lc)), () => {
			clearTimeout(d), clearTimeout(x), cancelAnimationFrame(y), l.textures?.off("newTexture", g), i.current?.cancel(), a.removeEventListener("mousemove", S), a.removeEventListener("mouseleave", C), a.removeEventListener("wheel", w), a.removeEventListener("mousedown", w), a.removeEventListener("touchstart", w), c.kill(), r.current = null;
		};
	}, []), window.React.useEffect(() => {
		r.current?.refresh({ skipIndexation: !0 });
	}, [
		e.matches,
		e.selected,
		e.current,
		e.avatarVersion
	]), window.React.useEffect(() => {
		let t = r.current, n = e.focus;
		if (!t || !n) return;
		if (n.overview) return p(lc);
		let i = n.nodeKey && t.getGraph().hasNode(n.nodeKey) ? n.nodeKey : void 0;
		!i && n.roomId && t.getGraph().forEachNode((e, t) => {
			!i && t.roomId === n.roomId && (i = e);
		}), i && p(pc(t, i));
	}, [e.focus]), window.React.useLayoutEffect(() => m(c.current.x, c.current.y), [l]);
	let m = (e, n) => {
		c.current = {
			x: e,
			y: n
		}, ic(a.current, t.current, e, n);
	}, h = l && e.tooltip?.(l);
	return h && (s.current = h), /* @__PURE__ */ (0, $.jsxs)("div", {
		className: "srm-stage",
		children: [
			/* @__PURE__ */ (0, $.jsx)("div", {
				ref: t,
				className: `srm-map${d ? " srm-map--ready" : ""}`,
				role: "img",
				"aria-label": e.label
			}),
			/* @__PURE__ */ (0, $.jsx)("canvas", {
				ref: o,
				className: "srm-beacons",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, $.jsx)("div", {
				ref: a,
				className: "srm-tooltip",
				"data-visible": !!h,
				"aria-hidden": "true",
				children: h || s.current
			}),
			e.children
		]
	});
}
function pc(e, t) {
	let n = e.getGraph(), r = e.getNodeDisplayData(t), i = n.getNodeAttributes(t), { x: a, y: o } = e.getCustomBBox() ?? e.getBBox(), s = Math.max(a[1] - a[0], o[1] - o[0]), c = (e, t) => Math.max(5e-4, 2 * e / s * t);
	if (i.container) return {
		x: r.x,
		y: r.y,
		ratio: c(i.size, 1.15)
	};
	let l = t.slice(0, t.lastIndexOf("/"));
	if (l && n.hasNode(l)) {
		let t = c(n.getNodeAttributes(l).size, 1.15);
		if (t <= c(i.size, 10)) {
			let n = e.getNodeDisplayData(l);
			return {
				x: n.x,
				y: n.y,
				ratio: t
			};
		}
	}
	return {
		x: r.x,
		y: r.y,
		ratio: c(i.size, 8)
	};
}
function mc(e) {
	let t = Infinity, n = -Infinity, r = Infinity, i = -Infinity;
	e.getGraph().forEachNode((e, a) => {
		t = Math.min(t, a.x - a.size), n = Math.max(n, a.x + a.size), r = Math.min(r, a.y - a.size), i = Math.max(i, a.y + a.size);
	}), t < n && e.setCustomBBox({
		x: [t, n],
		y: [r, i]
	});
}
function hc(e, t, n) {
	let r = yo(e.bg, .6);
	return {
		allowInvalidContainer: !0,
		renderEdgeLabels: !1,
		zIndex: !0,
		stagePadding: 40,
		labelFont: e.font,
		labelSize: 13,
		labelWeight: "500",
		labelColor: { color: e.text },
		labelRenderedSizeThreshold: 0,
		itemSizesReference: "positions",
		zoomToSizeRatioFunction: (e) => e,
		minCameraRatio: 5e-4,
		maxCameraRatio: 3,
		nodeReducer: (i, a) => {
			let { matches: o, selected: s, current: c, avatarUrl: l, avatarColour: u } = t.current, d = !o || a.roomId !== void 0 && o.has(a.roomId), f = {
				...a,
				forceLabel: !0
			};
			if (a.container) {
				let t = a.kind === "group" ? e.hover : u?.(a.avatar) ?? e.decorative[yc(a.roomId ?? a.label)].fg, n = e.highContrast ? 0 : a.depth % 2 ? .07 : .13;
				return Object.assign(f, {
					type: "container",
					color: _o(t, a.depth % 2 ? e.spaceFill : e.groupFill, n),
					borderColor: e.highContrast ? e.border : _o(t, e.bg, .35),
					borderSize: 1
				}), a.roomId && a.roomId === s && Object.assign(f, {
					borderColor: e.accent,
					borderSize: 3
				}), f;
			}
			f.type = "room", f.color = d ? e.decorative[yc(a.roomId ?? a.label)].bg : e.dim, d ? f.image = l?.(a.avatar) : f.label = "";
			let p, m;
			return a.highlight ? (p = e.highlight, m = e.highlight) : a.unread && (p = e.unread, m = e.unread), a.roomId && a.roomId === c && (p = e.text), p && d && Object.assign(f, {
				borderColor: p,
				borderSize: 3
			}), a.roomId && a.roomId === s && (Object.assign(f, {
				borderColor: e.accent,
				borderSize: 4,
				zIndex: 1e3
			}), m = e.accent), n && !o && !a.unread && !a.highlight && a.roomId !== c && a.roomId !== s && Object.assign(f, {
				quiet: !0,
				veilColor: r
			}), f.borderSize && Object.assign(f, {
				gapSize: 1.5,
				gapColor: e.bg
			}), m && d && !e.highContrast && Object.assign(f, {
				haloColor: vo(m, .5),
				haloSpread: 1.3
			}), f;
		}
	};
}
function gc(e) {
	let t = (e, t, n) => Math.min(1, Math.max(0, (e - t) / (n - t))), n = (n, r, i) => {
		if (!r.label) return;
		let a = r;
		if (n.save(), n.textAlign = "center", n.textBaseline = "middle", a.container) {
			if (n.globalAlpha = t(r.size, 22, 40), n.globalAlpha > 0) {
				n.font = `600 ${i.labelSize}px ${i.labelFont}`;
				let t = r.y - r.size - 9;
				n.lineJoin = "round", n.lineWidth = 3.5, n.strokeStyle = e.bg, n.strokeText(r.label, r.x, t), n.fillStyle = e.text, n.fillText(r.label, r.x, t);
			}
			let o = a.highlight || a.unread;
			if (n.globalAlpha = t(r.size, 18, 30), o && n.globalAlpha > 0) {
				let t = r.size * Math.SQRT1_2;
				_c(n, r.x + t, r.y - t, o, a.highlight ? e.highlight : e.unread, e);
			}
		} else if (a.image) {
			if (n.globalAlpha = t(r.size, 12, 22) * (a.quiet ? .55 : 1), n.globalAlpha > 0) {
				let t = Math.min(14, Math.max(10, r.size / 3));
				n.font = `600 ${t}px ${i.labelFont}`;
				let a = vc(n, r.label, Math.max(r.size * 2.4, 80)), o = n.measureText(a).width, s = t + 6, c = r.y + r.size + 3;
				n.fillStyle = e.labelBg, n.beginPath(), n.roundRect(r.x - o / 2 - 6, c, o + 12, s, s / 2), n.fill(), n.fillStyle = e.text, n.fillText(a, r.x, c + s / 2);
			}
		} else n.globalAlpha = t(r.size, 16, 28) * (a.quiet ? .55 : 1), n.globalAlpha > 0 && (n.font = `600 ${Math.min(14, Math.max(10, r.size / 3))}px ${i.labelFont}`, n.fillStyle = a.roomId ? e.decorative[yc(a.roomId)].fg : e.text, n.fillText(vc(n, r.label, r.size * 1.8), r.x, r.y));
		if (!a.container && a.unread && !a.highlight) {
			n.globalAlpha = t(r.size, 7, 12);
			let i = r.size * Math.SQRT1_2;
			n.globalAlpha > 0 && _c(n, r.x + i, r.y - i, a.unread, e.unread, e);
		}
		n.restore();
	};
	return {
		drawLabel: n,
		drawHover: n
	};
}
function _c(e, t, n, r, i, a) {
	let o = r > 99 ? "99+" : String(r);
	e.save(), e.font = `700 11px ${a.font}`, e.textAlign = "center", e.textBaseline = "middle";
	let s = Math.max(17, e.measureText(o).width + 10);
	e.beginPath(), e.roundRect(t - s / 2, n - 17 / 2, s, 17, 17 / 2), e.fillStyle = i, e.fill(), e.lineWidth = 2, e.strokeStyle = a.bg, e.stroke(), e.fillStyle = "#fff", e.fillText(o, t, n + .5), e.restore();
}
function vc(e, t, n) {
	if (e.measureText(t).width <= n) return t;
	let r = Array.from(t);
	for (; r.length && e.measureText(r.join("") + "…").width > n;) r.pop();
	return r.length ? r.join("").trimEnd() + "…" : "";
}
function yc(e) {
	let t = 0;
	for (let n = 0; n < e.length; n++) t += e.charCodeAt(n);
	return t % 6;
}
// src/ui/TubeMap.tsx
var bc = [
	"#dc241f",
	"#0098d4",
	"#00782a",
	"#b36305",
	"#9b0056",
	"#ee7c0e",
	"#6950a1",
	"#00a4a7",
	"#1c5cd6",
	"#e21d8d"
], xc = "var(--cpd-color-icon-tertiary, #8d97a5)", Sc = 2.5, Cc = 1.3, wc = .85, Tc = 22, Ec = 20, Dc = 24, Oc = 160, kc = 120, Ac = 4;
function jc(e) {
	return e.hex ?? (e.colour < 0 ? xc : bc[e.colour % bc.length]);
}
function Mc(e) {
	let { layout: t, matches: n, current: r, selected: i, selectedLine: a } = e, o = window.React.useRef(null), s = window.React.useRef(null), c = window.React.useRef(null), l = window.React.useRef(/* @__PURE__ */ new Map()), u = window.React.useRef(/* @__PURE__ */ new Map()), d = window.React.useRef(/* @__PURE__ */ new Map()), f = window.React.useRef(null), p = window.React.useRef(null), m = window.React.useRef({
		x: 0,
		y: 0
	}), h = window.React.useRef({
		cx: 0,
		cy: 0,
		w: 1
	}), g = window.React.useRef(null), _ = window.React.useRef(void 0), [v, y] = window.React.useState(null), b = window.React.useMemo(() => new Map(t.lines.map((e) => [e.id, e])), [t]), x = window.React.useMemo(() => new Map(t.stations.map((e) => [e.key, e])), [t]), S = window.React.useMemo(() => {
		let e = /* @__PURE__ */ new Map();
		for (let n of t.stations) e.set(n.roomId, [...e.get(n.roomId) ?? [], n]);
		return e;
	}, [t]), C = window.React.useMemo(() => t.stations.filter((e) => e.highlight > 0 && e.kind !== "space"), [t]), w = window.React.useMemo(() => t.lines.filter((e) => e.anchor), [t]), T = window.React.useMemo(() => t.stations.some((e) => e.unread > 0 || e.highlight > 0), [t]), E = window.React.useMemo(() => getComputedStyle(document.body).getPropertyValue("--cpd-font-family-sans").trim() || "Inter, system-ui, sans-serif", []), D = window.React.useMemo(() => {
		let e = /* @__PURE__ */ new Map();
		for (let t of w) {
			let n = Ic(t.label, 28), r = t.highlight || t.unread;
			e.set(t.id, {
				text: n,
				count: r,
				width: Rc(n, `600 12px ${E}`) + 20 + (r ? Pc(r) + 4 : 0)
			});
		}
		return e;
	}, [w, E]), O = window.React.useMemo(() => new Map(t.districts.map((e) => [e.id, Rc(e.label.toUpperCase(), `700 15px ${E}`) + Rc(String(e.rooms), `600 12px ${E}`) + 36])), [t, E]), k = window.React.useMemo(() => [...w].sort((e, t) => Number(t.highlight > 0) - Number(e.highlight > 0)), [w]), A = window.React.useMemo(() => a && b.has(a) ? Fc(t, a) : null, [
		t,
		b,
		a
	]), j = () => {
		let n = s.current, r = c.current;
		if (!n || !r) return;
		let i = n.clientWidth || 1, a = n.clientHeight || 1, { cx: o, cy: f, w: p } = h.current, m = i / p, g = i / 2 - o * m, _ = a / 2 - f * m;
		r.setAttribute("transform", `translate(${g} ${_}) scale(${m})`), e.onCameraChange?.({
			x: o,
			y: f,
			ratio: p
		}), n.dataset.zoom = m < .45 ? "far" : m < .8 ? "mid" : "near";
		let v = [];
		for (let e of t.districts) {
			let t = u.current.get(e.id);
			if (!t) continue;
			let n = Math.max(8, e.x0 * m + g), r = e.y0 * m + _ + Dc / 2, o = O.get(e.id) ?? 120, s = e.x1 * m + g > 0 && n < i && e.y1 * m + _ > 0 && r < a;
			if (t.style.display = s ? "" : "none", !s) continue;
			let c = Math.min(Math.max(r, 20), e.y1 * m + _ - Dc);
			v.push([
				n,
				c - Dc / 2 - 4,
				n + o,
				c + Dc / 2 + 4
			]), t.setAttribute("transform", `translate(${n} ${c})`);
		}
		for (let e of k) {
			let t = l.current.get(e.id), n = D.get(e.id);
			if (!t || !n || !e.anchor) continue;
			let r = e.anchor[0] * m + g, o = e.anchor[1] * m + _ + Ec / 2, s = [
				r,
				o - Ec / 2 - 2,
				r + n.width,
				o + Ec / 2 + 2
			], c = s[2] > 0 && s[0] < i && s[3] > 0 && s[1] < a && !v.some((e) => e[0] < s[2] && s[0] < e[2] && e[1] < s[3] && s[1] < e[3]);
			t.style.display = c ? "" : "none", c && (v.push(s), t.setAttribute("transform", `translate(${r} ${o})`));
		}
		for (let e of C) {
			let t = d.current.get(e.key);
			if (!t) continue;
			let n = e.x * m + g, r = e.y * m + _;
			t.style.display = n < -30 || r < -30 || n > i + 30 || r > a + 30 ? "none" : "", t.setAttribute("transform", `translate(${n} ${r})`);
		}
	}, M = {
		getState: () => ({
			x: h.current.cx,
			y: h.current.cy,
			ratio: h.current.w,
			angle: 0
		}),
		setState: (e) => {
			h.current = {
				cx: e.x ?? h.current.cx,
				cy: e.y ?? h.current.cy,
				w: e.ratio ?? h.current.w
			}, j();
		}
	}, N = (e) => {
		g.current?.cancel(), g.current = fo(M, {
			x: e.cx,
			y: e.cy,
			ratio: e.w
		});
	}, ee = (e, t, n, r, i = !1) => {
		let a = s.current, o = a?.clientWidth || 1, c = a?.clientHeight || 1, l = Math.max((n - e) * 1.08, (r - t) * 1.08 * (o / c), o / Cc);
		i && (l = Math.min(l, o / wc));
		let u = l * c / o, d = u >= (r - t) * 1.08 ? (t + r) / 2 : t + u / 2 - (r - t) * .04;
		return {
			cx: l >= (n - e) * 1.08 ? (e + n) / 2 : e + l / 2,
			cy: d,
			w: l
		};
	}, P = () => {
		let { x0: e, y0: n, x1: r, y1: i } = t.bounds, a = Oc * ee(e, n, r, i).w / (s.current?.clientWidth || 1);
		return ee(e, n, r + a, i);
	}, te = (e) => {
		let n = Infinity, r = Infinity, i = -Infinity, a = -Infinity;
		for (let o of t.lines) if (Fc(t, e).has(o.id)) for (let [e, t] of o.points) n = Math.min(n, e), i = Math.max(i, e), r = Math.min(r, t), a = Math.max(a, t);
		return ee(n - 36, r - 92 * 1.2, i + 92, a + 36, !0);
	}, ne = window.React.useRef(e.camera);
	window.React.useLayoutEffect(() => {
		let e = ne.current;
		if (ne.current = void 0, h.current = e ? {
			cx: e.x,
			cy: e.y,
			w: e.ratio
		} : P(), j(), typeof ResizeObserver != "function") return;
		let t = new ResizeObserver(() => j());
		return t.observe(s.current), () => t.disconnect();
	}, [t]), window.React.useLayoutEffect(() => j()), window.React.useEffect(() => {
		let e = s.current, n = (n) => {
			let r = e.clientWidth || 1, i = t.bounds;
			return Math.min(Math.max(n, r / Sc), Math.max(i.x1 - i.x0, i.y1 - i.y0) * 4);
		}, r = (t) => {
			t.preventDefault(), g.current?.cancel();
			let r = e.getBoundingClientRect(), i = t.clientX - r.left - r.width / 2, a = t.clientY - r.top - r.height / 2, { cx: o, cy: s, w: c } = h.current, l = r.width / c, u = t.deltaMode === 1 ? t.deltaY * 33 : t.deltaY, d = n(c * Math.exp(u * .0015)), f = r.width / d;
			h.current = {
				cx: o + i / l - i / f,
				cy: s + a / l - a / f,
				w: d
			}, j();
		};
		return e.addEventListener("wheel", r, { passive: !1 }), () => e.removeEventListener("wheel", r);
	}, [t]), window.React.useEffect(() => () => g.current?.cancel(), []);
	let re = window.React.useRef(null), ie = (e) => {
		if (e.button !== 0) return;
		g.current?.cancel(), re.current = {
			x: e.clientX,
			y: e.clientY,
			cx: h.current.cx,
			cy: h.current.cy,
			moved: !1
		};
		let t = (e) => {
			let t = re.current, n = s.current;
			if (!t || !n || !t.moved && Math.hypot(e.clientX - t.x, e.clientY - t.y) < Ac) return;
			t.moved = !0, n.classList.add("srm-tube--dragging");
			let r = (n.clientWidth || 1) / h.current.w;
			h.current = {
				...h.current,
				cx: t.cx - (e.clientX - t.x) / r,
				cy: t.cy - (e.clientY - t.y) / r
			}, j();
		}, n = () => {
			s.current?.classList.remove("srm-tube--dragging"), window.removeEventListener("pointermove", t), window.removeEventListener("pointerup", n);
		};
		window.addEventListener("pointermove", t), window.addEventListener("pointerup", n);
	}, ae = (t) => {
		let n = b.get(t);
		if (n?.roomId && _.current === t) return e.onActivate(n.roomId);
		_.current = t, N(te(t));
	}, oe = (t) => {
		if (re.current?.moved) return;
		let n = t.target.closest("[data-key], [data-line]"), r = n?.getAttribute("data-key") ? x.get(n.getAttribute("data-key")) : void 0, i = n?.getAttribute("data-line");
		r ? r.kind === "space" && b.has(r.roomId) ? ae(r.roomId) : e.onActivate(r.roomId) : i ? ae(i) : (_.current = void 0, N(P()));
	};
	window.React.useEffect(() => {
		let n = e.focus;
		if (!n) return;
		let r = n.line ?? n.roomId, i = n.district ? t.districts.find((e) => e.id === n.district) : void 0;
		if (i) _.current = void 0, N(ee(i.x0 - 36, i.y0, i.x1, i.y1));
		else if (n.overview) _.current = void 0, N(P());
		else if (r && b.has(r)) _.current = r, N(te(r));
		else if (n.roomId) {
			let e = t.stations.find((e) => e.roomId === n.roomId), r = s.current;
			e && r && N({
				cx: e.x + 36,
				cy: e.y - 23,
				w: (r.clientWidth || 1) / Cc
			});
		}
	}, [e.focus]);
	let se = window.React.useRef(void 0);
	window.React.useEffect(() => () => clearTimeout(se.current), []);
	let ce = window.React.useRef(void 0), le = (e) => {
		if (e === ce.current) return;
		let t = s.current;
		t?.querySelectorAll(".is-twin").forEach((e) => e.classList.remove("is-twin")), ce.current = e, t && e && (S.get(e)?.length ?? 0) > 1 && t.querySelectorAll(`[data-room="${CSS.escape(e)}"]`).forEach((e) => e.classList.add("is-twin"));
	}, F = (e) => {
		let t = e.target.closest("[data-key], [data-line]"), n = t?.getAttribute("data-key") ? x.get(t.getAttribute("data-key")) : void 0, r = t?.getAttribute("data-line") ? b.get(t.getAttribute("data-line")) : void 0, i = null;
		if (le(n?.roomId), n) {
			let e = n.kind === "space" ? b.get(n.roomId) : void 0, t = (S.get(n.roomId) ?? []).filter((e) => e !== n);
			i = {
				label: n.label,
				roomId: n.roomId,
				container: !!e,
				unread: e ? e.unread : n.unread,
				highlight: e ? e.highlight : n.highlight,
				also: t.map((e) => b.get(e.lineId).label)
			};
		} else r && (i = {
			label: r.label,
			roomId: r.roomId,
			container: !0,
			unread: r.unread,
			highlight: r.highlight
		});
		clearTimeout(se.current), i ? y(i) : se.current = setTimeout(() => y(null), kc);
	}, ue = (e) => {
		let t = o.current.getBoundingClientRect();
		m.current = {
			x: e.clientX - t.left,
			y: e.clientY - t.top
		}, ic(f.current, o.current, m.current.x, m.current.y);
	};
	window.React.useLayoutEffect(() => ic(f.current, o.current, m.current.x, m.current.y), [v]);
	let de = v && e.tooltip?.(v);
	de && (p.current = de);
	let fe = (e) => {
		let t = ["srm-station"];
		return e.interchange && t.push("is-interchange"), e.highlight && e.kind !== "space" && t.push("is-mention"), e.unread || e.highlight ? t.push("is-unread") : T && !n && e.roomId !== r && t.push("is-quiet"), n && !n.has(e.roomId) && t.push("is-miss"), A && !A.has(e.lineId) && t.push("is-off"), e.roomId === r && t.push("is-current"), e.roomId === i && t.push("is-selected"), e.invite && t.push("is-invite"), b.get(e.lineId)?.district === "archive" && t.push("is-archive"), t.join(" ");
	};
	return /* @__PURE__ */ (0, $.jsxs)("div", {
		ref: o,
		className: "srm-stage",
		children: [
			/* @__PURE__ */ (0, $.jsxs)("svg", {
				ref: s,
				className: "srm-tube",
				role: "img",
				"aria-label": e.label,
				onPointerDown: ie,
				onPointerOver: F,
				onPointerMove: ue,
				onPointerLeave: () => {
					y(null), le(void 0);
				},
				onClick: oe,
				children: [/* @__PURE__ */ (0, $.jsxs)("g", {
					ref: c,
					children: [
						t.lines.map((e) => /* @__PURE__ */ (0, $.jsxs)("g", {
							className: `srm-tube-line${A && !A.has(e.id) ? " is-off" : ""}${e.district === "archive" ? " is-archive" : ""}`,
							"data-line": e.id,
							children: [/* @__PURE__ */ (0, $.jsx)("path", {
								className: "srm-tube-casing",
								d: Be(e.points)
							}), /* @__PURE__ */ (0, $.jsx)("path", {
								className: `srm-tube-track${e.colour < 0 ? " srm-tube-track--group" : ""}`,
								d: Be(e.points),
								style: { stroke: jc(e) }
							})]
						}, e.id)),
						t.links.map((e) => /* @__PURE__ */ (0, $.jsxs)("g", {
							className: `srm-tube-link${n && !n.has(e.roomId) ? " is-miss" : ""}`,
							children: [/* @__PURE__ */ (0, $.jsx)("path", {
								className: "srm-tube-link-outer",
								d: Be(e.points, 0)
							}), /* @__PURE__ */ (0, $.jsx)("path", {
								className: "srm-tube-link-inner",
								d: Be(e.points, 0)
							})]
						}, e.roomId)),
						t.stations.map((e) => /* @__PURE__ */ (0, $.jsxs)("g", {
							className: fe(e),
							transform: `translate(${e.x} ${e.y})`,
							"data-key": e.key,
							"data-room": e.roomId,
							children: [
								/* @__PURE__ */ (0, $.jsx)("circle", {
									className: "srm-station-hit",
									r: 13
								}),
								e.roomId === r && /* @__PURE__ */ (0, $.jsx)("circle", {
									className: "srm-station-here",
									r: e.interchange ? 12 : 10
								}),
								e.roomId === i && /* @__PURE__ */ (0, $.jsx)("circle", {
									className: "srm-station-selected",
									r: e.interchange ? 13 : 11
								}),
								/* @__PURE__ */ (0, $.jsx)("circle", {
									className: "srm-station-dot",
									r: e.interchange ? 7.5 : 5.5,
									style: e.interchange || e.highlight ? void 0 : { stroke: jc(b.get(e.lineId)) }
								}),
								/* @__PURE__ */ (0, $.jsx)("text", {
									className: "srm-station-name",
									transform: "rotate(-45)",
									x: e.interchange ? 12 : 10,
									y: 4,
									children: Ic(e.label, Tc)
								}),
								e.kind === "space" && (e.highlight || e.unread) > 0 ? /* @__PURE__ */ (0, $.jsx)(Nc, {
									x: 11,
									y: 12,
									count: e.highlight || e.unread,
									kind: e.highlight ? "mention" : "unread"
								}) : e.unread > 0 && !e.highlight && /* @__PURE__ */ (0, $.jsx)(Nc, {
									x: 9,
									y: 11,
									count: e.unread,
									kind: "unread"
								})
							]
						}, e.key))
					]
				}), /* @__PURE__ */ (0, $.jsxs)("g", {
					className: "srm-tube-overlay",
					children: [
						t.districts.map((e) => /* @__PURE__ */ (0, $.jsx)("g", {
							ref: (t) => void (t ? u.current.set(e.id, t) : u.current.delete(e.id)),
							className: `srm-tube-district srm-tube-district--${e.id}`,
							children: /* @__PURE__ */ (0, $.jsxs)("text", {
								x: 0,
								y: .5,
								children: [e.label.toUpperCase(), /* @__PURE__ */ (0, $.jsx)("tspan", {
									className: "srm-tube-district-count",
									dx: 8,
									children: e.rooms
								})]
							})
						}, e.id)),
						w.map((e) => {
							let t = D.get(e.id);
							return /* @__PURE__ */ (0, $.jsxs)("g", {
								ref: (t) => void (t ? l.current.set(e.id, t) : l.current.delete(e.id)),
								className: `srm-tube-pill${A && !A.has(e.id) ? " is-off" : ""}`,
								"data-line": e.id,
								children: [
									/* @__PURE__ */ (0, $.jsx)("rect", {
										x: 0,
										y: -10,
										width: t.width,
										height: Ec,
										rx: Ec / 2,
										style: { fill: jc(e) }
									}),
									/* @__PURE__ */ (0, $.jsx)("text", {
										x: 10,
										y: .5,
										children: t.text
									}),
									t.count > 0 && /* @__PURE__ */ (0, $.jsx)(Nc, {
										x: t.width - Pc(t.count) / 2 - 3,
										y: 0,
										count: t.count,
										kind: e.highlight ? "mention" : "unread"
									})
								]
							}, e.id);
						}),
						C.map((e) => /* @__PURE__ */ (0, $.jsxs)("g", {
							ref: (t) => void (t ? d.current.set(e.key, t) : d.current.delete(e.key)),
							className: `srm-beacon${n && !n.has(e.roomId) ? " is-miss" : ""}${A && !A.has(e.lineId) ? " is-off" : ""}`,
							"data-key": e.key,
							children: [/* @__PURE__ */ (0, $.jsx)("circle", {
								className: "srm-beacon-pulse",
								r: 7
							}), /* @__PURE__ */ (0, $.jsx)(Nc, {
								x: 11,
								y: 12,
								count: e.highlight,
								kind: "mention"
							})]
						}, e.key))
					]
				})]
			}),
			/* @__PURE__ */ (0, $.jsx)("div", {
				ref: f,
				className: "srm-tooltip",
				"data-visible": !!de,
				"aria-hidden": "true",
				children: de || p.current
			}),
			e.children
		]
	});
}
function Nc({ x: e, y: t, count: n, kind: r }) {
	let i = Pc(n);
	return /* @__PURE__ */ (0, $.jsxs)("g", {
		className: `srm-tube-badge srm-tube-badge--${r}`,
		transform: `translate(${e} ${t})`,
		children: [/* @__PURE__ */ (0, $.jsx)("rect", {
			x: -i / 2,
			y: -8.5,
			width: i,
			height: 17,
			rx: 8.5
		}), /* @__PURE__ */ (0, $.jsx)("text", {
			y: .5,
			children: n > 99 ? "99+" : n
		})]
	});
}
function Pc(e) {
	return e > 99 ? 28 : e > 9 ? 22 : 17;
}
function Fc(e, t) {
	let n = /* @__PURE__ */ new Set([t]);
	for (let t of e.lines) t.parent && n.has(t.parent) && n.add(t.id);
	return n;
}
function Ic(e, t) {
	let n = Array.from(e);
	return n.length > t ? n.slice(0, t - 1).join("").trimEnd() + "…" : e;
}
var Lc;
function Rc(e, t) {
	if (Lc === void 0) try {
		Lc = document.createElement("canvas").getContext("2d");
	} catch {
		Lc = null;
	}
	return Lc ? (Lc.font = t, Lc.measureText(e).width || e.length * 7) : e.length * 7;
}
// src/ui/MapOverlay.tsx
var zc = ["circles", "tube"], Bc = 8, Vc = 140;
function Hc(e) {
	let { graph: t, current: n, t: r } = e, i = window.React.useId(), a = window.React.useId(), o = window.React.useRef(null), [s, c] = window.React.useState(""), [l, u] = window.React.useState(0), [d, f] = window.React.useState(!1), [p, h] = window.React.useState(null), [g, _] = window.React.useState(e.legendOpen), [v, y] = window.React.useState(e.view);
	window.React.useEffect(() => o.current?.focus(), []);
	let b = window.React.useMemo(() => Object.fromEntries(O.map((e) => [e, r(`${m}district_${e}`)])), [r]), x = window.React.useMemo(() => {
		let e = {
			older: r(`${m}group_older`, { network: "%(network)s" }),
			smallGroups: r(`${m}group_small`),
			loose: r(`${m}group_loose`),
			otherSpaces: r(`${m}group_spaces`),
			junk: r(`${m}group_junk`),
			nameless: r(`${m}group_nameless`),
			solo: r(`${m}group_solo`)
		};
		return re(t, e);
	}, [t, r]), C = window.React.useMemo(() => Dr(t, x, b), [
		t,
		x,
		b
	]), w = window.React.useMemo(() => v === "tube" ? Ie(t, x, b, Math.max(.5, (window.innerWidth - 400) / Math.max(1, window.innerHeight - 160))) : null, [
		t,
		x,
		b,
		v
	]), T = window.React.useMemo(() => ({
		usage: e.usage,
		now: Date.now()
	}), [e.usage]), E = window.React.useMemo(() => (e) => Or(e, T), [T]), k = window.React.useMemo(() => s.trim() ? new Set(Te(t, s, {
		limit: Infinity,
		rank: () => 0
	}).map((e) => e.id)) : null, [t, s]), A = window.React.useMemo(() => {
		let e = (e) => e.map((e) => t.rooms.get(e)).filter((e) => e.kind !== "space"), n = (e) => ({
			meta: qc(r, "space_rooms", e.length),
			unread: e.reduce((e, t) => e + t.unread, 0),
			highlight: e.reduce((e, t) => e + t.highlight, 0)
		}), i = [{
			key: "all",
			overview: !0,
			name: r(`${m}all_spaces`),
			depth: 0,
			...n(e([...t.rooms.keys()]))
		}];
		for (let r of O) {
			let a = x.groups.filter((e) => e.district === r);
			if (a.length) {
				i.push({
					key: `district:${r}`,
					district: r,
					nodeKey: Tr(r),
					name: b[r],
					depth: 0,
					...n(e(a.flatMap((e) => e.rooms)))
				});
				for (let r of a) {
					let a = r.spaceId ? t.rooms.get(r.spaceId) : void 0, o = Er(r);
					i.push({
						key: `group:${r.key}`,
						room: a,
						nodeKey: o,
						line: r.spaceId ?? r.key,
						name: r.label,
						depth: 1,
						...n(e(r.rooms))
					});
					let s = (a, o, c, l) => {
						for (let u of t.rooms.get(a).children) {
							let a = t.rooms.get(u);
							if (a.kind !== "space" || l.has(u)) continue;
							let d = e(r.rooms).filter((e) => Wc(t, e.id, u));
							d.length && (l.add(u), i.push({
								key: `group:${r.key}:${u}`,
								room: a,
								nodeKey: `${o}/${u}`,
								line: u,
								name: a.name,
								depth: c,
								...n(d)
							}), s(u, `${o}/${u}`, c + 1, l));
						}
					};
					a && s(a.id, o, 2, /* @__PURE__ */ new Set([a.id]));
				}
			}
		}
		return i;
	}, [
		t,
		x,
		b,
		r
	]), j = window.React.useMemo(() => s.trim() ? Te(t, s, {
		exclude: n,
		limit: Bc,
		rank: E
	}).map((e) => ({
		key: e.id,
		room: e,
		name: e.name,
		depth: 0,
		meta: S(t, e.id).join(" › ") || void 0,
		unread: e.unread,
		highlight: e.highlight
	})) : A, [
		s,
		A,
		t,
		n,
		E
	]), M = j[Math.min(l, j.length - 1)];
	window.React.useEffect(() => {
		let t = [];
		C.forEachNode((e, n) => void t.push(n.avatar)), e.avatars?.request([...j.map((e) => e.room?.avatar), ...t]);
	}, [
		j,
		C,
		e.avatars
	]), window.React.useEffect(() => {
		if (!M || !d) return;
		let e = setTimeout(() => h(Uc(M)), Vc);
		return () => clearTimeout(e);
	}, [M?.key, d]);
	let N = (t) => {
		t.room ? e.onOpen(t.room.id) : h(Uc(t));
	}, ee = () => {
		_(!g), e.onLegendToggle(!g);
	}, P = (t) => {
		t !== v && (y(t), e.onViewChange(t));
	}, te = (e) => {
		let i = e.roomId ? t.rooms.get(e.roomId) : void 0, a = i ? S(t, i.id) : [], o;
		o = i ? i.invite ? r(`${m}tip_invite`) : i.kind === "space" ? qc(r, "tip_space", i.children.length) : i.kind === "dm" ? r(`${m}tip_dm`) : qc(r, "tip_room", i.members) : r(`${m}tip_group`);
		let s;
		return e.container ? s = r(i ? `${m}tip_action_space` : `${m}tip_action_zoom`) : i && (s = r(`${m}tip_action_open`)), /* @__PURE__ */ (0, $.jsxs)($.Fragment, { children: [
			/* @__PURE__ */ (0, $.jsx)("div", {
				className: "srm-tooltip-name",
				children: e.label
			}),
			/* @__PURE__ */ (0, $.jsx)("div", {
				className: "srm-tooltip-meta",
				children: o
			}),
			a.length > 0 && /* @__PURE__ */ (0, $.jsx)("div", {
				className: "srm-tooltip-meta",
				children: a.join(" › ")
			}),
			e.also && e.also.length > 0 && /* @__PURE__ */ (0, $.jsx)("div", {
				className: "srm-tooltip-meta",
				children: r("datanauten_space_room_map_tip_also", { spaces: e.also.join(", ") })
			}),
			(e.highlight > 0 || e.unread > 0 || e.roomId === n) && /* @__PURE__ */ (0, $.jsxs)("div", {
				className: "srm-tooltip-status",
				children: [
					e.highlight > 0 && /* @__PURE__ */ (0, $.jsx)("span", {
						className: "srm-dot srm-dot--highlight",
						children: qc(r, "tip_mentions", e.highlight)
					}),
					e.unread > 0 && /* @__PURE__ */ (0, $.jsx)("span", {
						className: "srm-dot srm-dot--unread",
						children: qc(r, "tip_unread", e.unread)
					}),
					e.roomId === n && /* @__PURE__ */ (0, $.jsx)("span", {
						className: "srm-dot srm-dot--current",
						children: r("datanauten_space_room_map_tip_current")
					})
				]
			}),
			s && /* @__PURE__ */ (0, $.jsx)("div", {
				className: "srm-tooltip-action",
				children: s
			})
		] });
	};
	return /* @__PURE__ */ (0, $.jsx)("div", {
		className: "srm-backdrop",
		onMouseDown: (t) => {
			t.target === t.currentTarget && e.onClose();
		},
		children: /* @__PURE__ */ (0, $.jsxs)("div", {
			className: "srm-panel",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": i,
			onKeyDown: (t) => {
				if (t.key === "Escape") t.preventDefault(), s ? (c(""), u(0)) : e.onClose();
				else if (t.key === "ArrowDown" || t.key === "ArrowUp") {
					if (t.preventDefault(), !j.length) return;
					let e = t.key === "ArrowDown" ? 1 : -1;
					f(!0), u((t) => (Math.min(t, j.length - 1) + e + j.length) % j.length);
				} else t.key === "Enter" && M && (t.preventDefault(), N(M));
			},
			children: [
				/* @__PURE__ */ (0, $.jsxs)("header", {
					className: "srm-header",
					children: [
						/* @__PURE__ */ (0, $.jsx)("h2", {
							id: i,
							className: "srm-title",
							children: r(`${m}title`)
						}),
						/* @__PURE__ */ (0, $.jsx)("div", {
							className: "srm-tabs",
							role: "tablist",
							"aria-label": r(`${m}view`),
							children: zc.map((e) => /* @__PURE__ */ (0, $.jsx)("button", {
								type: "button",
								role: "tab",
								className: "srm-tab",
								"aria-selected": e === v,
								onMouseDown: (e) => e.preventDefault(),
								onClick: () => P(e),
								children: r(`${m}view_${e}`)
							}, e))
						}),
						/* @__PURE__ */ (0, $.jsx)("input", {
							ref: o,
							className: "srm-search",
							type: "search",
							role: "combobox",
							"aria-expanded": j.length > 0,
							"aria-controls": a,
							"aria-activedescendant": M ? `${a}-${M.key}` : void 0,
							"aria-autocomplete": "list",
							placeholder: r(`${m}search`),
							"aria-label": r(`${m}search`),
							value: s,
							onChange: (e) => {
								c(e.target.value), u(0), f(!!e.target.value.trim());
							}
						}),
						/* @__PURE__ */ (0, $.jsx)("button", {
							type: "button",
							className: "srm-close",
							"aria-label": r(`${m}close`),
							onClick: e.onClose,
							children: "×"
						})
					]
				}),
				/* @__PURE__ */ (0, $.jsxs)("div", {
					className: "srm-body",
					children: [w ? /* @__PURE__ */ (0, $.jsx)(Mc, {
						layout: w,
						matches: k,
						selected: d ? M?.room?.id : void 0,
						selectedLine: d ? M?.line : void 0,
						current: n,
						focus: p,
						label: r(`${m}tube_label`),
						onActivate: (t) => e.onOpen(t),
						tooltip: te,
						camera: e.cameras?.tube,
						onCameraChange: (t) => e.onCameraChange?.("tube", t),
						children: /* @__PURE__ */ (0, $.jsx)(Kc, {
							open: g,
							onToggle: ee,
							t: r,
							view: "tube"
						})
					}) : /* @__PURE__ */ (0, $.jsx)(fc, {
						graph: C,
						matches: k,
						selected: d ? M?.room?.id : void 0,
						current: n,
						focus: p,
						label: r(`${m}canvas_label`),
						onActivate: (t) => e.onOpen(t),
						avatarUrl: e.avatars?.get.bind(e.avatars),
						avatarColour: e.avatars?.colour.bind(e.avatars),
						avatarVersion: e.avatarVersion,
						tooltip: te,
						camera: e.cameras?.circles,
						onCameraChange: (t) => e.onCameraChange?.("circles", t),
						children: /* @__PURE__ */ (0, $.jsx)(Kc, {
							open: g,
							onToggle: ee,
							t: r,
							view: "circles"
						})
					}), /* @__PURE__ */ (0, $.jsxs)("div", {
						className: "srm-results",
						children: [/* @__PURE__ */ (0, $.jsx)("div", {
							className: "srm-results-title",
							children: s.trim() ? r(`${m}results`) : r(`${m}spaces`)
						}), j.length === 0 ? /* @__PURE__ */ (0, $.jsx)("div", {
							className: "srm-empty",
							children: s.trim() ? r(`${m}no_results`, { query: s }) : r(`${m}empty`)
						}) : /* @__PURE__ */ (0, $.jsx)("ul", {
							id: a,
							role: "listbox",
							className: "srm-list",
							"aria-label": s.trim() ? r(`${m}results`) : r(`${m}spaces`),
							children: j.map((t, n) => /* @__PURE__ */ (0, $.jsxs)("li", {
								id: `${a}-${t.key}`,
								role: "option",
								"aria-selected": t === M,
								className: `srm-item${t.highlight || t.unread ? " srm-item--unread" : ""}${t.district ? " srm-item--district" : ""}`,
								style: t.depth ? { paddingInlineStart: 8 + t.depth * 16 } : void 0,
								onMouseMove: () => {
									n !== l && u(n), d || f(!0);
								},
								onMouseDown: (e) => e.preventDefault(),
								onClick: () => N(t),
								children: [
									/* @__PURE__ */ (0, $.jsx)(Gc, {
										row: t,
										url: e.avatars?.get(t.room?.avatar)
									}),
									/* @__PURE__ */ (0, $.jsxs)("span", {
										className: "srm-item-text",
										children: [/* @__PURE__ */ (0, $.jsx)("span", {
											className: "srm-item-name",
											children: t.name
										}), t.meta && /* @__PURE__ */ (0, $.jsx)("span", {
											className: "srm-item-path",
											children: t.meta
										})]
									}),
									(t.highlight > 0 || t.unread > 0) && /* @__PURE__ */ (0, $.jsx)("span", {
										className: `srm-badge${t.highlight ? " srm-badge--highlight" : ""}`,
										children: Yc(t.highlight || t.unread)
									})
								]
							}, t.key))
						})]
					})]
				}),
				/* @__PURE__ */ (0, $.jsxs)("footer", {
					className: "srm-footer",
					children: [
						/* @__PURE__ */ (0, $.jsx)("span", { children: r(`${m}hint`) }),
						/* @__PURE__ */ (0, $.jsx)("kbd", {
							className: "srm-kbd",
							children: e.triggerLabel
						}),
						/* @__PURE__ */ (0, $.jsxs)("span", {
							className: "srm-version",
							children: ["v", D]
						})
					]
				})
			]
		})
	});
}
function Uc(e) {
	return {
		roomId: e.room?.id,
		nodeKey: e.nodeKey,
		line: e.line,
		district: e.district,
		overview: e.overview,
		nonce: Date.now()
	};
}
function Wc(e, t, n) {
	let r = /* @__PURE__ */ new Set(), i = [...e.rooms.get(t)?.parents ?? []];
	for (; i.length;) {
		let t = i.pop();
		if (t === n) return !0;
		r.has(t) || (r.add(t), i.push(...e.rooms.get(t)?.parents ?? []));
	}
	return !1;
}
function Gc({ row: e, url: t }) {
	let [n, r] = window.React.useState(!1);
	if (e.overview) return /* @__PURE__ */ (0, $.jsx)("span", {
		className: "srm-avatar srm-avatar--group",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, $.jsxs)("svg", {
			viewBox: "0 0 16 16",
			width: "16",
			height: "16",
			fill: "currentColor",
			children: [
				/* @__PURE__ */ (0, $.jsx)("circle", {
					cx: "5",
					cy: "5",
					r: "3"
				}),
				/* @__PURE__ */ (0, $.jsx)("circle", {
					cx: "11",
					cy: "5",
					r: "3"
				}),
				/* @__PURE__ */ (0, $.jsx)("circle", {
					cx: "5",
					cy: "11",
					r: "3"
				}),
				/* @__PURE__ */ (0, $.jsx)("circle", {
					cx: "11",
					cy: "11",
					r: "3"
				})
			]
		})
	});
	let i = e.room?.kind ?? "group", a = e.room ? ` srm-avatar--c${yc(e.room.id) + 1}` : "";
	return /* @__PURE__ */ (0, $.jsx)("span", {
		className: `srm-avatar srm-avatar--${i}${a}`,
		"aria-hidden": "true",
		children: t && !n ? /* @__PURE__ */ (0, $.jsx)("img", {
			src: t,
			alt: "",
			onError: () => r(!0)
		}) : Jc(e.name)
	});
}
function Kc(e) {
	let { open: t, t: n } = e, r = window.React.useId(), i = e.view === "tube" ? [
		["srm-swatch--line", n(`${m}legend_line`)],
		["srm-swatch--station", n(`${m}legend_station`)],
		["srm-swatch--interchange", n(`${m}legend_interchange`)],
		["srm-swatch--unread-count", n(`${m}legend_unread`)],
		["srm-swatch--mention", n(`${m}legend_highlight`)],
		["srm-swatch--current", n(`${m}legend_current`)],
		["srm-swatch--dim", n(`${m}legend_dim`)]
	] : [
		["srm-swatch--unread", n(`${m}legend_unread`)],
		["srm-swatch--mention", n(`${m}legend_highlight`)],
		["srm-swatch--current", n(`${m}legend_current`)],
		["srm-swatch--selected", n(`${m}legend_selected`)],
		["srm-swatch--space", n(`${m}legend_space_circle`)],
		["srm-swatch--colour", n(`${m}legend_colour`)],
		["srm-swatch--dim", n(`${m}legend_dim`)]
	];
	return /* @__PURE__ */ (0, $.jsxs)("div", {
		className: "srm-legend",
		children: [/* @__PURE__ */ (0, $.jsxs)("button", {
			type: "button",
			className: "srm-legend-toggle",
			"aria-expanded": t,
			"aria-controls": r,
			onClick: e.onToggle,
			children: [
				n(`${m}legend`),
				" ",
				t ? "▾" : "▸"
			]
		}), t && /* @__PURE__ */ (0, $.jsx)("ul", {
			id: r,
			className: "srm-legend-list",
			children: i.map(([e, t]) => /* @__PURE__ */ (0, $.jsxs)("li", { children: [/* @__PURE__ */ (0, $.jsx)("span", {
				className: `srm-swatch ${e}`,
				"aria-hidden": "true"
			}), t] }, e))
		})]
	});
}
function qc(e, t, n) {
	return e(`${m}${t}_${n === 1 ? "one" : "other"}`, { count: String(n) });
}
function Jc(e) {
	return Array.from(e.replace(/^[#@!+]/, "").trim())[0]?.toUpperCase() ?? "?";
}
function Yc(e) {
	return e > 99 ? "99+" : String(e);
}
// src/ui/map.css?inline
var Xc = ".srm-backdrop{z-index:5000;font-family:var(--cpd-font-family-sans,Inter, system-ui, sans-serif);background:#0000008c;justify-content:center;align-items:center;padding:3vh 3vw;animation:.1s ease-out srm-fade;display:flex;position:fixed;inset:0}.srm-panel{background:var(--cpd-color-bg-canvas-default,#fff);width:100%;height:100%;color:var(--cpd-color-text-primary,#1b1d22);border-radius:16px;flex-direction:column;display:flex;overflow:hidden;box-shadow:0 24px 64px #00000059}.srm-header{border-bottom:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);align-items:center;gap:12px;padding:12px 16px;display:flex}.srm-title{margin:0;font-size:18px;font-weight:600;line-height:24px}.srm-tabs{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);border-radius:10px;flex:none;padding:2px;display:flex}.srm-tab{color:var(--cpd-color-text-secondary,#656d77);font:inherit;cursor:pointer;background:0 0;border:none;border-radius:8px;padding:5px 12px;font-size:13px;font-weight:600}.srm-tab[aria-selected=true]{background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);box-shadow:0 1px 3px #0000001f}.srm-tab:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}.srm-search{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);min-width:0;height:36px;color:inherit;font:inherit;border-radius:8px;flex:1;padding:0 12px;font-size:15px}.srm-search:focus-visible,.srm-close:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}.srm-close{width:36px;height:36px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:none;border-radius:50%;font-size:24px;line-height:1}.srm-close:hover{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);color:inherit}.srm-body{flex:1;min-height:0;display:flex;position:relative}.srm-stage{flex:1;min-width:0;position:relative;overflow:hidden}.srm-map{--srm-dot:color-mix(in srgb, var(--cpd-color-text-primary,#1b1d22) 10%, transparent);background-color:var(--cpd-color-bg-canvas-default,#fff);background-image:radial-gradient(circle, var(--srm-dot) 1px, transparent 1.5px);background-size:var(--srm-grid-size,24px) var(--srm-grid-size,24px);background-position:var(--srm-grid-x,0) var(--srm-grid-y,0);touch-action:none;opacity:0;position:absolute;inset:0}.srm-map--ready{opacity:1;transition:opacity .16s ease-out}.srm-beacons{pointer-events:none;opacity:0;width:100%;height:100%;position:absolute;inset:0}.srm-map--ready+.srm-beacons{opacity:1}.srm-tube{background:var(--cpd-color-bg-canvas-default,#fff);width:100%;height:100%;font-family:var(--cpd-font-family-sans,Inter, system-ui, sans-serif);touch-action:none;cursor:grab;user-select:none;position:absolute;inset:0}.srm-tube--dragging{cursor:grabbing}.srm-tube-line,.srm-tube-link,.srm-station,.srm-tube-pill,.srm-beacon{transition:opacity .16s ease-out}.srm-tube-casing,.srm-tube-track,.srm-tube-link path{fill:none;stroke-linecap:round;stroke-linejoin:round}.srm-tube-casing{stroke:var(--cpd-color-bg-canvas-default,#fff);stroke-width:11px}.srm-tube-track{stroke-width:6px;cursor:pointer}.srm-tube-track--group{stroke-dasharray:2 9}.srm-tube-link-outer{stroke:var(--cpd-color-text-primary,#1b1d22);stroke-width:9px}.srm-tube-link-inner{stroke:var(--cpd-color-bg-canvas-default,#fff);stroke-width:4px}.srm-station{cursor:pointer}.srm-station-hit{fill:#0000}.srm-station-dot{fill:var(--cpd-color-bg-canvas-default,#fff);stroke-width:3px}.srm-station.is-interchange .srm-station-dot{stroke:var(--cpd-color-text-primary,#1b1d22)}.srm-station.is-mention .srm-station-dot{fill:var(--cpd-color-icon-critical-primary,#d51928);stroke:var(--cpd-color-bg-canvas-default,#fff)}.srm-station.is-invite .srm-station-dot{stroke-dasharray:3 2}.srm-station-here{fill:none;stroke:var(--cpd-color-text-primary,#1b1d22);stroke-width:2.5px}.srm-station-selected{fill:none;stroke:var(--cpd-color-border-focused,#0467dd);stroke-width:3.5px}.srm-station-name{fill:var(--cpd-color-text-primary,#1b1d22);paint-order:stroke;stroke:var(--cpd-color-bg-canvas-default,#fff);stroke-width:3px;stroke-linejoin:round;font-size:12px;font-weight:500}.srm-station.is-twin{opacity:1}.srm-station.is-twin .srm-station-dot{stroke-width:4px;stroke:var(--cpd-color-border-focused,#0467dd)!important}.srm-station.is-twin .srm-station-name{fill:var(--cpd-color-text-action-accent,#0467dd);font-weight:700;display:inline!important}.srm-station.is-unread .srm-station-name{font-weight:700}.srm-station.is-mention .srm-station-name{fill:var(--cpd-color-text-critical-primary,#d51928)}.srm-station.is-quiet{opacity:.5}.srm-station.is-miss,.srm-tube-link.is-miss,.srm-beacon.is-miss{opacity:.15}.srm-tube-line.is-off,.srm-station.is-off,.srm-tube-pill.is-off,.srm-beacon.is-off{opacity:.2}.srm-tube[data-zoom=far] .srm-tube-track,.srm-tube[data-zoom=far] .srm-tube-casing{vector-effect:non-scaling-stroke}.srm-tube[data-zoom=far] .srm-tube-track{stroke-width:3px}.srm-tube[data-zoom=far] .srm-tube-casing{stroke-width:5px}.srm-tube[data-zoom=far] .srm-tube-track--group{stroke-dasharray:none;opacity:.6}.srm-tube[data-zoom=far] .srm-station-name,.srm-tube[data-zoom=far] .srm-station .srm-tube-badge,.srm-tube[data-zoom=mid] .srm-station:not(.is-unread,.is-interchange,.is-current) .srm-station-name{display:none}.srm-tube-pill{cursor:pointer}.srm-tube-district>text{fill:var(--cpd-color-text-primary,#1b1d22);letter-spacing:.06em;dominant-baseline:central;paint-order:stroke;stroke:var(--cpd-color-bg-canvas-default,#fff);stroke-width:4px;stroke-linejoin:round;font-size:15px;font-weight:700}.srm-tube-district-count{fill:var(--cpd-color-text-secondary,#656d77);letter-spacing:0;font-size:12px;font-weight:600}.srm-tube-line.is-archive,.srm-station.is-archive{opacity:.45}.srm-tube-pill>text{fill:#fff;dominant-baseline:central;font-size:12px;font-weight:600}.srm-tube-badge rect{stroke:var(--cpd-color-bg-canvas-default,#fff);stroke-width:2px}.srm-tube-badge text{fill:#fff;text-anchor:middle;dominant-baseline:central;font-size:11px;font-weight:700}.srm-tube-badge--unread rect{fill:var(--cpd-color-icon-success-primary,#007a62)}.srm-tube-badge--mention rect{fill:var(--cpd-color-icon-critical-primary,#d51928)}.srm-beacon{pointer-events:none}.srm-beacon-pulse{fill:none;stroke:var(--cpd-color-icon-critical-primary,#d51928);stroke-width:2.5px;transform-box:fill-box;transform-origin:50%;animation:1.6s ease-out infinite srm-pulse}@keyframes srm-pulse{0%{opacity:.8;transform:scale(1)}to{opacity:0;transform:scale(2)}}.srm-stage:after{content:\"\";pointer-events:none;background:radial-gradient(ellipse at center, transparent 60%, color-mix(in srgb, var(--cpd-color-text-primary,#1b1d22) 6%, transparent));position:absolute;inset:0}@media (prefers-contrast:more),(forced-colors:active){.srm-map{background-image:none}.srm-stage:after{display:none}}:root[class*=-hc] .srm-map{background-image:none}:root[class*=-hc] .srm-stage:after{display:none}.srm-tooltip{z-index:2;opacity:0;background:var(--cpd-color-bg-action-primary-rest,#1b1d22);max-width:280px;color:var(--cpd-color-text-on-solid-primary,#fff);pointer-events:none;border-radius:8px;padding:8px 10px;font-size:12px;line-height:16px;transition:opacity .12s ease-out;position:absolute;top:0;left:0;box-shadow:0 4px 16px #00000040}.srm-tooltip[data-visible=true]{opacity:1}.srm-tooltip-name{overflow-wrap:anywhere;font-size:14px;font-weight:600;line-height:20px}.srm-tooltip-meta{opacity:.8;overflow-wrap:anywhere}.srm-tooltip-status{flex-wrap:wrap;gap:4px 10px;margin-top:4px;display:flex}.srm-tooltip-action{opacity:.65;margin-top:6px}.srm-dot:before{content:\"\";background:currentColor;border-radius:50%;width:8px;height:8px;margin-right:4px;display:inline-block}.srm-dot--unread:before{background:var(--cpd-color-icon-success-primary,#007a62)}.srm-dot--highlight:before{background:var(--cpd-color-icon-critical-primary,#d51928)}.srm-dot--current:before{background:var(--cpd-color-text-on-solid-primary,#fff)}.srm-legend{z-index:1;border:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);background:var(--cpd-color-bg-canvas-default,#fff);border-radius:10px;max-width:260px;font-size:12px;position:absolute;bottom:12px;left:12px;box-shadow:0 2px 8px #00000014}.srm-legend-toggle{width:100%;color:var(--cpd-color-text-secondary,#656d77);font:inherit;text-align:left;cursor:pointer;background:0 0;border:none;padding:6px 10px;font-weight:600}.srm-legend-toggle:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:-2px;border-radius:10px}.srm-legend-list{margin:0;padding:0 10px 8px;list-style:none}.srm-legend-list li{align-items:center;gap:8px;padding:3px 0;display:flex}.srm-swatch{box-sizing:border-box;background:var(--cpd-color-bg-decorative-4,#f1efff);border-radius:50%;flex:none;width:16px;height:16px}.srm-swatch--unread,.srm-swatch--mention{position:relative}.srm-swatch--unread{border:3px solid var(--cpd-color-icon-success-primary,#007a62);box-shadow:0 0 6px var(--cpd-color-icon-success-primary,#007a62)}.srm-swatch--mention{border:3px solid var(--cpd-color-icon-critical-primary,#d51928);box-shadow:0 0 6px var(--cpd-color-icon-critical-primary,#d51928)}.srm-swatch--line{background:#dc241f;border-radius:3px;width:22px;height:6px}.srm-swatch--station{background:var(--cpd-color-bg-canvas-default,#fff);border:3px solid #0098d4;width:12px;height:12px;margin:0 5px}.srm-swatch--interchange{border:3px solid var(--cpd-color-text-primary,#1b1d22);background:var(--cpd-color-bg-canvas-default,#fff)}.srm-swatch--unread-count{background:var(--cpd-color-icon-success-primary,#007a62);border-radius:8px;width:18px}.srm-swatch--current{border:3px solid var(--cpd-color-text-primary,#1b1d22)}.srm-swatch--selected{border:4px solid var(--cpd-color-border-focused,#0467dd);box-shadow:0 0 6px var(--cpd-color-border-focused,#0467dd)}@media (prefers-contrast:more){.srm-swatch{box-shadow:none!important}}:root[class*=-hc] .srm-swatch{box-shadow:none!important}.srm-swatch--space{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}.srm-swatch--dim{background:var(--cpd-color-border-disabled,#e1e6ec);opacity:.6}.srm-swatch--colour{background:conic-gradient(var(--cpd-color-text-decorative-1,#005f00) 0 25%, var(--cpd-color-text-decorative-3,#82008f) 0 50%, var(--cpd-color-text-decorative-5,#9f0850) 0 75%, var(--cpd-color-text-decorative-2,#00566e) 0)}.srm-results{border-right:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);background:var(--cpd-color-bg-canvas-default,#fff);flex:none;order:-1;width:320px;padding:8px;overflow-y:auto}.srm-results-title{color:var(--cpd-color-text-secondary,#656d77);text-transform:uppercase;letter-spacing:.04em;padding:4px 8px 6px;font-size:12px;font-weight:600}.srm-empty{color:var(--cpd-color-text-secondary,#656d77);padding:6px 8px 8px;font-size:14px}.srm-list{margin:0;padding:0;list-style:none}.srm-item{cursor:pointer;border-radius:8px;align-items:center;gap:10px;padding:6px 8px;display:flex}.srm-item[aria-selected=true]{background:var(--cpd-color-bg-action-secondary-hovered,#f0f2f5);box-shadow:inset 3px 0 0 var(--cpd-color-border-focused,#0467dd)}.srm-avatar{border-radius:50%;flex:none;justify-content:center;align-items:center;width:28px;height:28px;font-size:14px;font-weight:600;display:flex}.srm-avatar--space,.srm-avatar--group{border-radius:8px}.srm-avatar--group{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);color:var(--cpd-color-text-secondary,#656d77)}.srm-avatar{overflow:hidden}.srm-avatar img{object-fit:cover;width:100%;height:100%}.srm-avatar--c1{background:var(--cpd-color-bg-decorative-1,#e0f8d9);color:var(--cpd-color-text-decorative-1,#005f00)}.srm-avatar--c2{background:var(--cpd-color-bg-decorative-2,#e3f5f8);color:var(--cpd-color-text-decorative-2,#00566e)}.srm-avatar--c3{background:var(--cpd-color-bg-decorative-3,#faeefb);color:var(--cpd-color-text-decorative-3,#82008f)}.srm-avatar--c4{background:var(--cpd-color-bg-decorative-4,#f1efff);color:var(--cpd-color-text-decorative-4,#5d26cd)}.srm-avatar--c5{background:var(--cpd-color-bg-decorative-5,#ffecf0);color:var(--cpd-color-text-decorative-5,#9f0850)}.srm-avatar--c6{background:var(--cpd-color-bg-decorative-6,#ffefe4);color:var(--cpd-color-text-decorative-6,#9b2200)}.srm-item-text{flex-direction:column;flex:1;min-width:0;display:flex}.srm-item-name,.srm-item-path{white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.srm-item-name{font-size:14px;font-weight:500}.srm-item--unread .srm-item-name{font-weight:700}.srm-item--district{margin-top:8px}.srm-item--district .srm-item-name{letter-spacing:.06em;text-transform:uppercase;font-size:12px;font-weight:700}.srm-item-path{color:var(--cpd-color-text-secondary,#656d77);font-size:12px}.srm-badge{background:var(--cpd-color-icon-success-primary,#007a62);min-width:18px;color:var(--cpd-color-text-on-solid-primary,#fff);text-align:center;border-radius:10px;flex:none;padding:1px 6px;font-size:11px;font-weight:600}.srm-badge--highlight{background:var(--cpd-color-icon-critical-primary,#d51928)}.srm-footer{border-top:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);color:var(--cpd-color-text-secondary,#656d77);align-items:center;gap:12px;padding:8px 16px;font-size:12px;display:flex}.srm-footer>span{flex:1}.srm-footer>.srm-version{opacity:.7;font-variant-numeric:tabular-nums;flex:none}.srm-kbd{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);border-radius:4px;padding:1px 6px;font-family:inherit;font-size:12px}@media (width<=640px){.srm-backdrop{padding:0}.srm-panel{border-radius:0}.srm-header{flex-wrap:wrap}.srm-search{flex-basis:100%;order:3}.srm-tabs{margin-left:auto}.srm-results{z-index:1;border:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);border-radius:12px;width:auto;max-height:40%;position:absolute;bottom:12px;left:12px;right:12px;box-shadow:0 4px 16px #0000001f}.srm-footer{display:none}.srm-legend{top:12px;bottom:auto}}@keyframes srm-fade{0%{opacity:0}}@media (prefers-reduced-motion:reduce){.srm-backdrop{animation:none}.srm-map--ready,.srm-tooltip,.srm-tube *,.srm-tube-pill{transition:none}.srm-beacon-pulse{opacity:.6;animation:none;transform:scale(1.5)}}", Zc = "de.datanauten.space_room_map.usage", Qc = 12096e5, $c = 500, el = class {
	resolveRoom;
	now;
	entries;
	lastHash;
	constructor(e, t = () => Date.now()) {
		this.resolveRoom = e, this.now = t, this.entries = this.read();
	}
	start() {
		window.addEventListener("hashchange", this.onHashChange), this.onHashChange();
	}
	stop() {
		window.removeEventListener("hashchange", this.onHashChange);
	}
	record(e) {
		this.entries[e] = {
			score: this.score(e) + 1,
			at: this.now()
		}, this.prune(), this.write();
	}
	score(e) {
		let t = this.entries[e];
		return t ? t.score * .5 ** ((this.now() - t.at) / Qc) : 0;
	}
	onHashChange = () => {
		let e = window.location.hash;
		if (e === this.lastHash) return;
		this.lastHash = e;
		let t = this.resolveRoom(e);
		t && this.record(t);
	};
	prune() {
		let e = Object.keys(this.entries);
		if (!(e.length <= $c)) {
			e.sort((e, t) => this.score(e) - this.score(t));
			for (let t of e.slice(0, e.length - $c)) delete this.entries[t];
		}
	}
	read() {
		try {
			let e = JSON.parse(localStorage.getItem(Zc) ?? "{}");
			return e && typeof e == "object" ? e : {};
		} catch {
			return {};
		}
	}
	write() {
		try {
			localStorage.setItem(Zc, JSON.stringify(this.entries));
		} catch {}
	}
}, tl = "de.datanauten.space_room_map", nl = "de-datanauten-space-room-map-style", rl = "de.datanauten.space_room_map.legend", il = "de.datanauten.space_room_map.view";
function al(e) {
	let t = e ?? {};
	if (typeof t != "object") throw Error("expected an object");
	let n = { trigger_key: "Mod+I" };
	if (t.trigger_key !== void 0) {
		if (typeof t.trigger_key != "string") throw Error("trigger_key must be a string");
		n.trigger_key = t.trigger_key;
	}
	return w(n.trigger_key), n;
}
var ol = class {
	api;
	static moduleApiVersion = "^2.0.0";
	config;
	trigger;
	usage;
	container;
	root;
	cameras = {};
	restoreFocus;
	avatars;
	constructor(e) {
		this.api = e;
	}
	async load() {
		try {
			this.config = al(this.api.config.get(tl));
		} catch (e) {
			throw console.error(`[space-room-map] Invalid "${tl}" config`, e), Error("Errors in module configuration for the space room map module");
		}
		this.trigger = w(this.config.trigger_key), this.api.i18n.register(h), fl(), this.usage = new el((e) => sl(e)), this.usage.start(), window.addEventListener("keydown", this.onKeyDown, { capture: !0 });
	}
	dispose() {
		this.close(), window.removeEventListener("keydown", this.onKeyDown, { capture: !0 }), this.usage?.stop(), this.avatars?.cache.dispose(), this.avatars = void 0;
	}
	open() {
		if (this.root) return;
		let e = g(), t = e ? _(e) : v(this.api);
		e && this.avatars?.client !== e && (this.avatars?.cache.dispose(), this.avatars = {
			client: e,
			cache: new f(e)
		}), this.restoreFocus = document.activeElement, this.container = document.createElement("div"), this.container.className = "de-datanauten-space-room-map", document.body.appendChild(this.container), this.container.addEventListener("keydown", (e) => e.stopPropagation()), this.root = this.api.createRoot(this.container), this.root.render(/* @__PURE__ */ (0, $.jsx)(this.App, { graph: t }));
	}
	close() {
		this.root?.unmount(), this.container?.remove(), this.root = void 0, this.container = void 0, this.restoreFocus?.focus?.(), this.restoreFocus = void 0;
	}
	onKeyDown = (e) => {
		e.isComposing || e.defaultPrevented || !T(e, this.trigger) || !this.root && cl(e.target) && ll() || (e.preventDefault(), e.stopImmediatePropagation(), this.root ? this.close() : this.open());
	};
	openRoom(e) {
		this.close(), this.api.navigation.openRoom(e);
	}
	t = (e, t) => this.api.i18n.translate(e, t);
	usageScore = (e) => this.usage.score(e);
	App = ({ graph: e }) => {
		let t = this.avatars?.cache, n = window.React.useSyncExternalStore((e) => t?.subscribe(e) ?? (() => {}), () => t?.getVersion() ?? 0);
		return /* @__PURE__ */ (0, $.jsx)(Hc, {
			graph: e,
			current: x(e),
			legendOpen: ul(rl) !== "closed",
			view: zc.find((e) => e === ul(il)) ?? "circles",
			avatars: t,
			avatarVersion: n,
			usage: this.usageScore,
			triggerLabel: E(this.trigger),
			t: this.t,
			onLegendToggle: (e) => dl(rl, e ? "open" : "closed"),
			onViewChange: (e) => dl(il, e),
			cameras: this.cameras,
			onCameraChange: (e, t) => this.cameras[e] = t,
			onOpen: (e) => this.openRoom(e),
			onClose: () => this.close()
		});
	};
};
function sl(e) {
	let t = /^#\/room\/([^/?]+)/.exec(e);
	if (!t) return;
	let n = decodeURIComponent(t[1]);
	return n.startsWith("!") ? n : g()?.getVisibleRooms().find((e) => e.getCanonicalAlias() === n || e.getAltAliases?.().includes(n))?.roomId;
}
function cl(e) {
	return e instanceof HTMLElement ? e.isContentEditable || e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement : !1;
}
function ll() {
	let e = document.activeElement;
	if (e instanceof HTMLInputElement || e instanceof HTMLTextAreaElement) return e.selectionStart !== e.selectionEnd;
	let t = document.getSelection();
	return !(!t || t.isCollapsed);
}
function ul(e) {
	try {
		return localStorage.getItem(e) ?? void 0;
	} catch {
		return;
	}
}
function dl(e, t) {
	try {
		localStorage.setItem(e, t);
	} catch {}
}
function fl() {
	if (document.getElementById(nl)) return;
	let e = document.createElement("style");
	e.id = nl, e.textContent = Xc, document.head.appendChild(e);
}
export { tl as CONFIG_KEY, ol as SpaceRoomMapModule, ol as default, al as parseConfig };

//# sourceMappingURL=index.js.map