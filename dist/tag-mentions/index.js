/*! @datanauten/element-web-module-tag-mentions 0.1.1 */
// \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports);
// src/client.ts
function t() {
	let e = window.mxMatrixClientPeg;
	try {
		return e?.get?.() ?? void 0;
	} catch {
		return;
	}
}
function n(e, t) {
	let n = /^#\/room\/([^/?]+)/.exec(t);
	if (!n) return null;
	let r = decodeURIComponent(n[1]);
	return r.startsWith("!") ? r : e?.getRooms().find((e) => e.currentState.getStateEvents("m.room.canonical_alias", "")?.getContent().alias === r)?.roomId ?? null;
}
// src/expand.ts
var r = "de.datanauten.tags", i = /* @__PURE__ */ new Set([
	"m.text",
	"m.emote",
	"m.notice"
]), a = /(^|[^A-Za-z0-9_@:/.-])@([A-Za-z0-9][A-Za-z0-9_-]{0,31})(?![A-Za-z0-9_:-])/g, o = /(```[\s\S]*?```|`[^`\n]*`)/;
function s(e) {
	let t = [];
	for (let n of u(e)) if (n.replaceable) for (let e of n.text.matchAll(a)) {
		let n = e[2].toLowerCase();
		t.includes(n) || t.push(n);
	}
	return t;
}
function c(e, t) {
	if (!i.has(String(e.msgtype)) || typeof e.body != "string" || e["de.datanauten.tags"] || e["m.new_content"] || e["m.relates_to"]?.rel_type === "m.replace") return;
	let n = s(e.body).map((e) => t.tags.find((t) => t.name === e)).filter((e) => !!e);
	if (!n.length) return;
	let a = [], o = [], c = /* @__PURE__ */ new Set();
	for (let e of n) e.allowed ? e.kind === "channel" ? a.push(e) : e.members.length ? (/* @__PURE__ */ new Set([...c, ...e.members])).size > t.max ? o.push({
		tag: e,
		reason: "too_many"
	}) : (a.push(e), e.members.forEach((e) => c.add(e))) : o.push({
		tag: e,
		reason: "empty"
	}) : o.push({
		tag: e,
		reason: "not_allowed"
	});
	if (!a.length) return {
		content: e,
		used: a,
		skipped: o
	};
	let l = (e) => {
		if (e.kind === "channel") return "@room";
		let n = e.members.slice(0, 10).map(t.name), r = e.members.length - n.length;
		return `@${e.name} (${n.join(", ")}${r > 0 ? ` +${r}` : ""})`;
	}, m = (e) => {
		if (e.kind === "channel") return "@room";
		let n = e.members.slice(0, 10).map((e) => `<a href="https://matrix.to/#/${p(e)}">${p(t.name(e))}</a>`), r = e.members.length - n.length;
		return `<strong>@${p(e.name)}</strong> (${n.join(", ")}${r > 0 ? ` +${r}` : ""})`;
	}, h = new Map(a.map((e) => [e.name, e])), g = f(e.body, h, l, u), _ = f(e.format === "org.matrix.custom.html" && typeof e.formatted_body == "string" ? e.formatted_body : p(e.body).replace(/\n/g, "<br>"), h, m, d), v = e["m.mentions"] ?? {}, y = Array.isArray(v.user_ids) ? v.user_ids.filter((e) => typeof e == "string") : [], b = {
		...v,
		user_ids: [.../* @__PURE__ */ new Set([...y, ...c])]
	};
	a.some((e) => e.kind === "channel") && (b.room = !0);
	let x = a.map((e) => e.kind === "channel" ? {
		name: e.name,
		room: !0
	} : {
		name: e.name,
		user_ids: e.members
	});
	return {
		content: {
			...e,
			body: g,
			format: "org.matrix.custom.html",
			formatted_body: _,
			"m.mentions": b,
			[r]: x
		},
		used: a,
		skipped: o
	};
}
function l(e) {
	let t = e?.[r];
	if (!Array.isArray(t)) return;
	let n = t.filter((e) => !!e && typeof e == "object" && typeof e.name == "string").map((e) => ({
		name: String(e.name),
		room: e.room === !0 || void 0,
		user_ids: Array.isArray(e.user_ids) ? e.user_ids.filter((e) => typeof e == "string") : void 0
	}));
	return n.length ? n : void 0;
}
function u(e) {
	return e.split(o).map((e, t) => ({
		text: e,
		replaceable: t % 2 == 0
	}));
}
function d(e) {
	let t = [], n = 0;
	for (let r of e.split(/(<[^>]*>)/)) {
		let e = /^<(\/?)(code|pre|a)\b/i.exec(r);
		e && (n = Math.max(0, n + (e[1] ? -1 : 1))), t.push({
			text: r,
			replaceable: !r.startsWith("<") && n === 0
		});
	}
	return t;
}
function f(e, t, n, r) {
	let i = /* @__PURE__ */ new Set();
	return r(e).map((e) => e.replaceable ? e.text.replace(a, (e, r, a) => {
		let o = t.get(a.toLowerCase());
		return !o || i.has(o.name) ? e : (i.add(o.name), r + n(o));
	}) : e.text).join("");
}
function p(e) {
	return e.replace(/[&<>"']/g, (e) => `&#${e.charCodeAt(0)};`);
}
// src/i18n.ts
var m = "datanauten_tagmentions_", h = {
	[`${m}menu_insert`]: {
		en: "Mention a tag",
		de: "Tag erwähnen"
	},
	[`${m}header_button`]: {
		en: "Tags",
		de: "Tags"
	},
	[`${m}picker_title`]: {
		en: "Mention a tag",
		de: "Tag erwähnen"
	},
	[`${m}picker_hint`]: {
		en: "Adds the tag to your message. When you send it, everyone in the tag gets a mention, in any Matrix app.",
		de: "Fügt den Tag in deine Nachricht ein. Beim Senden bekommt jede Person im Tag eine Erwähnung, in jeder Matrix-App."
	},
	[`${m}picker_direct_hint`]: {
		en: "Everyone in the tag gets a mention, in any Matrix app.",
		de: "Jede Person im Tag bekommt eine Erwähnung, in jeder Matrix-App."
	},
	[`${m}message`]: {
		en: "Message",
		de: "Nachricht"
	},
	[`${m}send`]: {
		en: "Send",
		de: "Senden"
	},
	[`${m}insert`]: {
		en: "Insert",
		de: "Einfügen"
	},
	[`${m}notifies`]: {
		en: "Notifies %(count)s",
		de: "Benachrichtigt %(count)s"
	},
	[`${m}absent`]: {
		en: "Not in this room, so not notified: %(names)s",
		de: "Nicht in diesem Raum, daher nicht benachrichtigt: %(names)s"
	},
	[`${m}channel_desc`]: {
		en: "Everyone in this room (@room)",
		de: "Alle in diesem Raum (@room)"
	},
	[`${m}team_desc`]: {
		en: "Everyone from %(space)s in this room",
		de: "Alle aus %(space)s in diesem Raum"
	},
	[`${m}from_space`]: {
		en: "from %(name)s",
		de: "aus %(name)s"
	},
	[`${m}not_allowed`]: {
		en: "You don't have permission to notify the whole room.",
		de: "Du darfst nicht den ganzen Raum benachrichtigen."
	},
	[`${m}over_max`]: {
		en: "More than %(max)s people, so it won't be expanded.",
		de: "Mehr als %(max)s Personen, daher wird er nicht aufgelöst."
	},
	[`${m}no_tags`]: {
		en: "No tags in this room yet.",
		de: "In diesem Raum gibt es noch keine Tags."
	},
	[`${m}manage`]: {
		en: "Manage tags",
		de: "Tags verwalten"
	},
	[`${m}manage_title`]: {
		en: "Tags",
		de: "Tags"
	},
	[`${m}manage_intro`]: {
		en: "Type @name in a message to mention everyone in a tag. Tags in a space apply in all of its rooms; a room tag with the same name wins.",
		de: "Tippe @name in eine Nachricht, um alle in einem Tag zu erwähnen. Tags eines Space gelten in allen seinen Räumen; ein gleichnamiger Raum-Tag hat Vorrang."
	},
	[`${m}scope_room`]: {
		en: "This room",
		de: "Dieser Raum"
	},
	[`${m}scope_space`]: {
		en: "Space: %(name)s",
		de: "Space: %(name)s"
	},
	[`${m}inherited`]: {
		en: "From spaces",
		de: "Aus Spaces"
	},
	[`${m}members_count`]: {
		en: "%(count)s members",
		de: "%(count)s Mitglieder"
	},
	[`${m}new_tag`]: {
		en: "New tag",
		de: "Neuer Tag"
	},
	[`${m}edit`]: {
		en: "Edit",
		de: "Bearbeiten"
	},
	[`${m}delete`]: {
		en: "Delete",
		de: "Löschen"
	},
	[`${m}delete_confirm`]: {
		en: "Really delete",
		de: "Wirklich löschen"
	},
	[`${m}save`]: {
		en: "Save",
		de: "Speichern"
	},
	[`${m}cancel`]: {
		en: "Cancel",
		de: "Abbrechen"
	},
	[`${m}close`]: {
		en: "Close",
		de: "Schließen"
	},
	[`${m}name`]: {
		en: "Name",
		de: "Name"
	},
	[`${m}label`]: {
		en: "Description",
		de: "Beschreibung"
	},
	[`${m}label_placeholder`]: {
		en: "e.g. Whoever is on call this week",
		de: "z. B. Wer diese Woche Bereitschaft hat"
	},
	[`${m}members`]: {
		en: "Members",
		de: "Mitglieder"
	},
	[`${m}search_members`]: {
		en: "Filter people",
		de: "Personen filtern"
	},
	[`${m}add_user_id`]: {
		en: "Add by Matrix ID (@name:server)",
		de: "Per Matrix-ID hinzufügen (@name:server)"
	},
	[`${m}add`]: {
		en: "Add",
		de: "Hinzufügen"
	},
	[`${m}no_permission`]: {
		en: "You can't change tags here. That needs the power level to send \"de.datanauten.tag\" state events (%(level)s).",
		de: "Du kannst die Tags hier nicht ändern. Dafür braucht es das Power-Level für \"de.datanauten.tag\"-State-Events (%(level)s)."
	},
	[`${m}err_name_invalid`]: {
		en: "Use up to 32 lower-case letters, digits, - or _, starting with a letter or digit.",
		de: "Bis zu 32 Kleinbuchstaben, Ziffern, - oder _, beginnend mit Buchstabe oder Ziffer."
	},
	[`${m}err_name_reserved`]: {
		en: "@%(name)s is built in.",
		de: "@%(name)s ist eingebaut."
	},
	[`${m}err_name_taken`]: {
		en: "There already is a tag @%(name)s here.",
		de: "Hier gibt es schon einen Tag @%(name)s."
	},
	[`${m}err_no_members`]: {
		en: "Pick at least one member.",
		de: "Wähle mindestens ein Mitglied."
	},
	[`${m}err_too_many`]: {
		en: "A tag can have at most %(max)s members.",
		de: "Ein Tag kann höchstens %(max)s Mitglieder haben."
	},
	[`${m}err_user_id`]: {
		en: "That's not a Matrix ID (@name:server).",
		de: "Das ist keine Matrix-ID (@name:server)."
	},
	[`${m}failed`]: {
		en: "Failed: %(error)s",
		de: "Fehlgeschlagen: %(error)s"
	},
	[`${m}skipped_title`]: {
		en: "Not everyone was mentioned",
		de: "Nicht alle wurden erwähnt"
	},
	[`${m}skip_too_many`]: {
		en: "@%(name)s has more than %(max)s members in this room, so it was sent as plain text.",
		de: "@%(name)s hat in diesem Raum mehr als %(max)s Mitglieder und wurde daher als reiner Text gesendet."
	},
	[`${m}skip_not_allowed`]: {
		en: "You don't have permission to notify the whole room, so @%(name)s was sent as plain text.",
		de: "Du darfst nicht den ganzen Raum benachrichtigen, daher wurde @%(name)s als reiner Text gesendet."
	},
	[`${m}skip_empty`]: {
		en: "Nobody from @%(name)s is in this room, so it was sent as plain text.",
		de: "Niemand aus @%(name)s ist in diesem Raum, daher wurde es als reiner Text gesendet."
	},
	[`${m}ok`]: {
		en: "OK",
		de: "OK"
	},
	[`${m}footer`]: {
		en: "Mentioned via tag",
		de: "Per Tag erwähnt"
	},
	[`${m}footer_room`]: {
		en: "whole room",
		de: "ganzer Raum"
	}
}, g = Symbol.for("de.datanauten.tag_mentions.originalSendMessage");
function _(e, t) {
	let n = e.sendMessage;
	if (typeof n != "function") return;
	let r = n[g] ?? n, i = function(n, i, a, o) {
		let s = typeof i != "string" && i !== null, c = s ? i : a, l;
		try {
			l = c && typeof c == "object" ? t(n, c) : void 0;
		} catch (e) {
			console.warn("[tag-mentions] Expanding tags failed; sending unchanged", e);
		}
		return l ? s ? r.call(e, n, l, a, o) : r.call(e, n, i, l, o) : r.call(e, n, i, a, o);
	};
	return i[g] = r, e.sendMessage = i, () => {
		e.sendMessage === i && (e.sendMessage = r);
	};
}
// src/tags.ts
var v = "de.datanauten.tag", y = /^[a-z0-9][a-z0-9_-]{0,31}$/, b = /* @__PURE__ */ new Set([
	"room",
	"here",
	"everyone",
	"all",
	"channel",
	"team"
]);
function x(e) {
	return y.test(e) ? b.has(e) ? "reserved" : null : "invalid";
}
var S = /^@[^:\s]+:[^\s]+$/;
function C(e) {
	return S.test(e);
}
function w(e, t) {
	if (!e || !y.test(e) || b.has(e) || !t) return;
	let n = t.user_ids;
	if (!Array.isArray(n)) return;
	let r = [...new Set(n.filter((e) => typeof e == "string" && C(e)))];
	if (r.length) return {
		label: typeof t.label == "string" ? t.label.slice(0, 200) : void 0,
		user_ids: r
	};
}
function T(e, t) {
	let n = e.trim();
	return {
		...n ? { label: n } : {},
		user_ids: [...new Set(t)]
	};
}
function E(e) {
	let t = !!e.isSpaceRoom?.(), n = [];
	for (let r of e.currentState.getStateEvents(v)) {
		let i = r.getStateKey(), a = w(i, r.getContent());
		a && i && n.push({
			name: i,
			label: a.label ?? "",
			userIds: a.user_ids,
			sourceId: e.roomId,
			sourceName: e.name,
			fromSpace: t
		});
	}
	return n.sort((e, t) => e.name.localeCompare(t.name));
}
function D(e, t) {
	let n = [], r = t.currentState.getStateEvents("m.space.parent").filter((e) => Array.isArray(e.getContent().via)).sort((e, t) => Number(!!t.getContent().canonical) - Number(!!e.getContent().canonical));
	for (let e of r) {
		let t = e.getStateKey();
		t && n.push(t);
	}
	for (let r of e.getRooms()) {
		if (!r.isSpaceRoom?.() || n.includes(r.roomId)) continue;
		let e = r.currentState.getStateEvents("m.space.child", t.roomId);
		e && Array.isArray(e.getContent().via) && n.push(r.roomId);
	}
	return n.map((t) => e.getRoom(t)).filter((e) => !!e && e.roomId !== t.roomId && (e.getMyMembership?.() ?? "join") === "join");
}
function O(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let e of E(t)) n.set(e.name, e);
	for (let r of D(e, t)) for (let e of E(r)) n.has(e.name) || n.set(e.name, {
		...e,
		fromSpace: !0
	});
	return [...n.values()].sort((e, t) => e.name.localeCompare(t.name));
}
function k(e, t) {
	let n = e.getRoom(t), r = e.getUserId();
	if (!n || !r) return [];
	let i = new Set(n.getJoinedMembers().map((e) => e.userId)), a = n.currentState.mayTriggerNotifOfType("room", r), o = [{
		name: "channel",
		label: "",
		kind: "channel",
		members: [],
		absent: [],
		allowed: a
	}], s = D(e, n)[0];
	if (s) {
		let e = s.getJoinedMembers().map((e) => e.userId);
		o.push({
			name: "team",
			label: s.name,
			kind: "team",
			members: e.filter((e) => e !== r && i.has(e)),
			absent: e.filter((e) => e !== r && !i.has(e)),
			allowed: a,
			source: {
				id: s.roomId,
				name: s.name,
				fromSpace: !0
			}
		});
	}
	for (let t of O(e, n)) o.push({
		name: t.name,
		label: t.label,
		kind: "tag",
		members: t.userIds.filter((e) => e !== r && i.has(e)),
		absent: t.userIds.filter((e) => e !== r && !i.has(e)),
		allowed: !0,
		source: {
			id: t.sourceId,
			name: t.sourceName,
			fromSpace: t.fromSpace
		}
	});
	return o;
}
function A(e, t) {
	let n = t.toLowerCase();
	return e.filter((e) => e.name.startsWith(n));
}
// src/suggest.ts
var j = ".mx_BasicMessageComposer_input, .mx_WysiwygComposer_Editor_content", M = ".mx_Autocomplete";
function N(e) {
	let t = /(?:^|[\s(])@([A-Za-z0-9_-]{0,32})$/.exec(e.replace(/ /g, " "));
	return t ? t[1] : void 0;
}
var ee = class {
	opts;
	state = null;
	target;
	constructor(e) {
		this.opts = e;
	}
	start() {
		document.addEventListener("input", this.update, !0), document.addEventListener("selectionchange", this.update), window.addEventListener("keydown", this.onKeyDown, !0), document.addEventListener("focusout", this.onBlur, !0);
	}
	stop() {
		document.removeEventListener("input", this.update, !0), document.removeEventListener("selectionchange", this.update), window.removeEventListener("keydown", this.onKeyDown, !0), document.removeEventListener("focusout", this.onBlur, !0), this.hide();
	}
	get visible() {
		return !!this.state;
	}
	update = () => {
		let e = document.getSelection(), t = e?.anchorNode, n = t?.parentElement?.closest(j);
		if (!e || !e.isCollapsed || !t || t.nodeType !== Node.TEXT_NODE || !n) return this.hide();
		let r = t, i = N(r.data.slice(0, e.anchorOffset));
		if (i === void 0) return this.hide();
		let a = A(this.opts.tagsForComposer(n), i);
		if (!a.length) return this.hide();
		this.target = {
			node: r,
			start: e.anchorOffset - i.length - 1,
			end: e.anchorOffset,
			composer: n
		};
		let o = (n.closest(".mx_MessageComposer") ?? n).getBoundingClientRect(), s = document.querySelector(M)?.getBoundingClientRect(), c = s && s.height > 0 ? Math.min(s.top, o.top) : o.top, l = this.state?.tags.map((e) => e.name).join() === a.map((e) => e.name).join() ? this.state.selected : 0;
		this.state = {
			tags: a,
			selected: Math.min(l, a.length - 1),
			anchor: {
				left: o.left,
				bottom: window.innerHeight - c + 4,
				width: o.width
			}
		}, this.render();
	};
	onKeyDown = (e) => {
		if (!this.state || e.isComposing || (document.querySelector(M)?.childElementCount ?? 0) > 0 && e.key !== "Escape") return;
		let t = this.state.tags.length;
		if (e.key === "ArrowDown" || e.key === "ArrowUp") this.state = {
			...this.state,
			selected: (this.state.selected + (e.key === "ArrowDown" ? 1 : t - 1)) % t
		}, this.render();
		else if ((e.key === "Tab" || e.key === "Enter") && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) this.pick(this.state.tags[this.state.selected]);
		else if (e.key === "Escape") this.hide();
		else return;
		e.preventDefault(), e.stopPropagation();
	};
	onBlur = (e) => {
		e.target?.closest?.(".mx_BasicMessageComposer_input, .mx_WysiwygComposer_Editor_content") && setTimeout(() => this.update(), 0);
	};
	pick = (e) => {
		let t = this.target;
		if (this.hide(), !t || !t.node.isConnected) return;
		t.composer.focus();
		let n = document.createRange();
		n.setStart(t.node, Math.max(0, t.start)), n.setEnd(t.node, Math.min(t.end, t.node.length));
		let r = document.getSelection();
		r?.removeAllRanges(), r?.addRange(n), document.execCommand("insertText", !1, `@${e.name} `);
	};
	hide() {
		this.state && (this.state = null, this.target = void 0, this.render());
	}
	render() {
		this.opts.render(this.state, this.pick);
	}
};
function te() {
	let e = window, t = e.deDatanautenTeamsSuite ??= {}, n = t._renderChain;
	if (n?.version === 1) return n;
	let r = {
		version: 1,
		entries: n?.entries ?? [],
		installed: !1
	};
	return t._renderChain = r, r;
}
function P(e, t) {
	return e.entries.filter((e) => {
		try {
			return e.filter(t);
		} catch {
			return !1;
		}
	});
}
function F(e, t, n) {
	let r = e.find((e) => e.replaces), i = r ? () => r.render(t, n) : n;
	for (let n of e.filter((e) => !e.replaces)) {
		let e = i;
		i = () => n.render(t, e);
	}
	return i();
}
function I(e, t) {
	let n = te(), r = n.entries.findIndex((e) => e.id === t.id);
	if (r >= 0 ? n.entries[r] = t : n.entries.push(t), n.installed) return;
	n.installed = !0;
	let i = (e, t) => F(P(n, e.mxEvent), e, () => t?.() ?? null);
	e.registerMessageRenderer((e) => {
		let t = P(n, e);
		return t.length > 0 && !t.some((e) => e.replaces);
	}, i), e.registerMessageRenderer((e) => P(n, e).some((e) => e.replaces), i, { allowEditingEvent: !1 });
}
// node_modules/.pnpm/react@19.3.1/node_modules/react/cjs/react-jsx-runtime.production.js
var ne = /* @__PURE__ */ e(((e) => {
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
	t.exports = ne();
})))();
function R(e) {
	return /* @__PURE__ */ (0, L.jsx)("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		fill: "currentColor",
		"aria-hidden": "true",
		...e,
		children: /* @__PURE__ */ (0, L.jsx)("path", { d: "M3 4a1 1 0 0 1 1-1h7.6a1 1 0 0 1 .7.3l8.4 8.4a1 1 0 0 1 0 1.4l-7.6 7.6a1 1 0 0 1-1.4 0l-8.4-8.4a1 1 0 0 1-.3-.7V4Zm2 1v6.2l7.4 7.4 6.2-6.2L11.2 5H5Zm3.5 1.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" })
	});
}
function z({ label: e, onClick: t }) {
	return /* @__PURE__ */ (0, L.jsx)("button", {
		type: "button",
		className: "tm-header-button",
		"data-testid": "tag-mentions-header-button",
		"aria-label": e,
		title: e,
		onClick: t,
		children: /* @__PURE__ */ (0, L.jsx)(R, {})
	});
}
// src/ui/ManageDialog.tsx
var B = (e, t) => `${e}\n${t}`;
function V(e) {
	let { t, scopes: n, tagsIn: r, inherited: i, subscribe: a, onCancel: o } = e, [s, c] = window.React.useState(n[0]?.id ?? ""), [l, u] = window.React.useState(null), [d, f] = window.React.useState(null), [p, h] = window.React.useState(null), [, g] = window.React.useState(0), [_, v] = window.React.useState(/* @__PURE__ */ new Map());
	window.React.useEffect(() => a(() => g((e) => e + 1)), [a]);
	let y = n.find((e) => e.id === s) ?? n[0], b = H(r(y.id), y.id, _), x = y === n[0] ? i().filter((e) => !b.some((t) => t.name === e.name)) : [], S = (e, t) => v((n) => new Map(n).set(B(y.id, e), {
		scopeId: y.id,
		tag: t
	})), C = async (n) => {
		if (d !== n) return f(n);
		f(null);
		try {
			await e.remove(y.id, n), S(n, null);
		} catch (e) {
			h(t(`${m}failed`, { error: e instanceof Error ? e.message : String(e) }));
		}
	};
	return l ? /* @__PURE__ */ (0, L.jsx)(U, {
		...e,
		scope: y,
		draft: l,
		taken: (e) => b.some((t) => t.name === e),
		onDone: (e) => {
			e && S(e.name, e), u(null);
		}
	}) : /* @__PURE__ */ (0, L.jsxs)("div", {
		className: "tm-dialog",
		"data-testid": "tag-mentions-manage",
		children: [
			/* @__PURE__ */ (0, L.jsx)("p", {
				className: "tm-hint",
				children: t(`${m}manage_intro`)
			}),
			n.length > 1 && /* @__PURE__ */ (0, L.jsx)("div", {
				className: "tm-segmented",
				role: "radiogroup",
				children: n.map((e) => /* @__PURE__ */ (0, L.jsx)("button", {
					type: "button",
					role: "radio",
					"aria-checked": e.id === y.id,
					className: "tm-segment",
					onClick: () => {
						c(e.id), h(null);
					},
					children: e.isSpace ? t("datanauten_tagmentions_scope_space", { name: e.name }) : t("datanauten_tagmentions_scope_room")
				}, e.id))
			}),
			!y.canEdit && /* @__PURE__ */ (0, L.jsx)("p", {
				className: "tm-note",
				children: t("datanauten_tagmentions_no_permission", { level: y.level })
			}),
			b.length === 0 && /* @__PURE__ */ (0, L.jsx)("p", {
				className: "tm-empty",
				children: t("datanauten_tagmentions_no_tags")
			}),
			/* @__PURE__ */ (0, L.jsx)("ul", {
				className: "tm-list",
				children: b.map((n) => /* @__PURE__ */ (0, L.jsxs)("li", {
					className: "tm-item",
					"data-tag": n.name,
					children: [/* @__PURE__ */ (0, L.jsxs)("span", {
						className: "tm-row",
						children: [/* @__PURE__ */ (0, L.jsxs)("span", {
							className: "tm-row-head",
							children: [/* @__PURE__ */ (0, L.jsxs)("span", {
								className: "tm-tag",
								children: ["@", n.name]
							}), n.label && /* @__PURE__ */ (0, L.jsx)("span", {
								className: "tm-row-desc",
								children: n.label
							})]
						}), /* @__PURE__ */ (0, L.jsxs)("span", {
							className: "tm-row-members",
							children: [
								t(`${m}members_count`, { count: n.userIds.length }),
								": ",
								n.userIds.map(e.name).join(", ")
							]
						})]
					}), y.canEdit && /* @__PURE__ */ (0, L.jsxs)("span", {
						className: "tm-item-actions",
						children: [/* @__PURE__ */ (0, L.jsx)("button", {
							type: "button",
							className: "tm-action tm-action--small",
							onClick: () => u({
								name: n.name,
								label: n.label,
								userIds: n.userIds,
								isNew: !1
							}),
							children: t("datanauten_tagmentions_edit")
						}), /* @__PURE__ */ (0, L.jsx)("button", {
							type: "button",
							className: "tm-action tm-action--small tm-action--danger",
							onClick: () => void C(n.name),
							children: d === n.name ? t("datanauten_tagmentions_delete_confirm") : t("datanauten_tagmentions_delete")
						})]
					})]
				}, n.name))
			}),
			x.length > 0 && /* @__PURE__ */ (0, L.jsxs)(L.Fragment, { children: [/* @__PURE__ */ (0, L.jsx)("h3", {
				className: "tm-label",
				children: t("datanauten_tagmentions_inherited")
			}), /* @__PURE__ */ (0, L.jsx)("ul", {
				className: "tm-list",
				children: x.map((n) => /* @__PURE__ */ (0, L.jsx)("li", {
					className: "tm-item",
					children: /* @__PURE__ */ (0, L.jsxs)("span", {
						className: "tm-row",
						children: [/* @__PURE__ */ (0, L.jsxs)("span", {
							className: "tm-row-head",
							children: [
								/* @__PURE__ */ (0, L.jsxs)("span", {
									className: "tm-tag",
									children: ["@", n.name]
								}),
								n.label && /* @__PURE__ */ (0, L.jsx)("span", {
									className: "tm-row-desc",
									children: n.label
								}),
								/* @__PURE__ */ (0, L.jsx)("span", {
									className: "tm-row-source",
									children: t("datanauten_tagmentions_from_space", { name: n.sourceName })
								})
							]
						}), /* @__PURE__ */ (0, L.jsxs)("span", {
							className: "tm-row-members",
							children: [
								t("datanauten_tagmentions_members_count", { count: n.userIds.length }),
								": ",
								n.userIds.map(e.name).join(", ")
							]
						})]
					})
				}, n.name))
			})] }),
			p && /* @__PURE__ */ (0, L.jsx)("div", {
				className: "tm-error",
				role: "alert",
				children: p
			}),
			/* @__PURE__ */ (0, L.jsxs)("div", {
				className: "tm-actions",
				children: [
					y.canEdit && /* @__PURE__ */ (0, L.jsx)("button", {
						type: "button",
						className: "tm-action tm-action--primary",
						onClick: () => u({
							name: "",
							label: "",
							userIds: [],
							isNew: !0
						}),
						children: t("datanauten_tagmentions_new_tag")
					}),
					/* @__PURE__ */ (0, L.jsx)("span", { className: "tm-spacer" }),
					/* @__PURE__ */ (0, L.jsx)("button", {
						type: "button",
						className: "tm-action",
						onClick: o,
						children: t(`${m}close`)
					})
				]
			})
		]
	});
}
function H(e, t, n) {
	let r = new Map(e.map((e) => [e.name, e]));
	for (let [e, i] of n) {
		if (i.scopeId !== t) continue;
		let n = e.split("\n")[1];
		i.tag ? r.set(n, i.tag) : r.delete(n);
	}
	return [...r.values()].sort((e, t) => e.name.localeCompare(t.name));
}
function U({ t: e, scope: t, draft: n, taken: r, members: i, name: a, save: o, max: s, onDone: c }) {
	let [l, u] = window.React.useState(n.name), [d, f] = window.React.useState(n.label), [p, h] = window.React.useState(n.userIds), [g, _] = window.React.useState([]), [v, y] = window.React.useState(""), [b, S] = window.React.useState(""), [w, T] = window.React.useState(null), [E, D] = window.React.useState(!1);
	window.React.useEffect(() => {
		let e = !0;
		return i(t.id).then((t) => e && _(t)), () => {
			e = !1;
		};
	}, [i, t.id]);
	let O = window.React.useMemo(() => {
		let e = [...g];
		for (let t of p) e.some((e) => e.userId === t) || e.push({
			userId: t,
			name: a(t)
		});
		return e.sort((e, t) => e.name.localeCompare(t.name));
	}, [
		g,
		p,
		a
	]), k = v.trim().toLowerCase(), A = k ? O.filter((e) => e.name.toLowerCase().includes(k) || e.userId.toLowerCase().includes(k)) : O, j = (e) => h((t) => t.includes(e) ? t.filter((t) => t !== e) : [...t, e]), M = () => {
		let t = b.trim();
		if (!C(t)) return T(e(`${m}err_user_id`));
		T(null), h((e) => e.includes(t) ? e : [...e, t]), S("");
	}, N = async (i) => {
		i.preventDefault();
		let a = l.trim().replace(/^@/, "").toLowerCase(), u = x(a);
		if (u === "invalid") return T(e(`${m}err_name_invalid`));
		if (u === "reserved") return T(e(`${m}err_name_reserved`, { name: a }));
		if (n.isNew && r(a)) return T(e(`${m}err_name_taken`, { name: a }));
		if (!p.length) return T(e(`${m}err_no_members`));
		if (p.length > s) return T(e(`${m}err_too_many`, { max: s }));
		D(!0);
		try {
			await o(t.id, a, d, p), c({
				name: a,
				label: d.trim(),
				userIds: p,
				sourceId: t.id,
				sourceName: t.name,
				fromSpace: t.isSpace
			});
		} catch (t) {
			T(e(`${m}failed`, { error: t instanceof Error ? t.message : String(t) })), D(!1);
		}
	};
	return /* @__PURE__ */ (0, L.jsxs)("form", {
		className: "tm-dialog",
		"data-testid": "tag-mentions-editor",
		onSubmit: (e) => void N(e),
		children: [
			/* @__PURE__ */ (0, L.jsxs)("label", {
				className: "tm-field",
				children: [/* @__PURE__ */ (0, L.jsx)("span", {
					className: "tm-label",
					children: e(`${m}name`)
				}), /* @__PURE__ */ (0, L.jsxs)("span", {
					className: "tm-name-input",
					children: [/* @__PURE__ */ (0, L.jsx)("span", {
						"aria-hidden": "true",
						children: "@"
					}), /* @__PURE__ */ (0, L.jsx)("input", {
						className: "tm-input",
						value: l,
						disabled: !n.isNew,
						maxLength: 33,
						autoFocus: n.isNew,
						placeholder: "oncall",
						onChange: (e) => u(e.target.value)
					})]
				})]
			}),
			/* @__PURE__ */ (0, L.jsxs)("label", {
				className: "tm-field",
				children: [/* @__PURE__ */ (0, L.jsx)("span", {
					className: "tm-label",
					children: e(`${m}label`)
				}), /* @__PURE__ */ (0, L.jsx)("input", {
					className: "tm-input",
					value: d,
					maxLength: 200,
					placeholder: e(`${m}label_placeholder`),
					onChange: (e) => f(e.target.value)
				})]
			}),
			/* @__PURE__ */ (0, L.jsxs)("fieldset", {
				className: "tm-fieldset",
				children: [
					/* @__PURE__ */ (0, L.jsxs)("legend", {
						className: "tm-label",
						children: [
							e(`${m}members`),
							" (",
							p.length,
							")"
						]
					}),
					/* @__PURE__ */ (0, L.jsx)("input", {
						className: "tm-input",
						value: v,
						placeholder: e(`${m}search_members`),
						"aria-label": e(`${m}search_members`),
						onChange: (e) => y(e.target.value)
					}),
					/* @__PURE__ */ (0, L.jsx)("div", {
						className: "tm-chips",
						children: A.map((e) => /* @__PURE__ */ (0, L.jsx)("button", {
							type: "button",
							role: "checkbox",
							"aria-checked": p.includes(e.userId),
							className: "tm-chip",
							title: e.userId,
							onClick: () => j(e.userId),
							children: e.name
						}, e.userId))
					}),
					/* @__PURE__ */ (0, L.jsxs)("span", {
						className: "tm-add",
						children: [/* @__PURE__ */ (0, L.jsx)("input", {
							className: "tm-input",
							value: b,
							placeholder: e(`${m}add_user_id`),
							"aria-label": e(`${m}add_user_id`),
							onChange: (e) => S(e.target.value),
							onKeyDown: (e) => {
								e.key === "Enter" && (e.preventDefault(), M());
							}
						}), /* @__PURE__ */ (0, L.jsx)("button", {
							type: "button",
							className: "tm-action tm-action--small",
							onClick: M,
							children: e(`${m}add`)
						})]
					})
				]
			}),
			w && /* @__PURE__ */ (0, L.jsx)("div", {
				className: "tm-error",
				role: "alert",
				children: w
			}),
			/* @__PURE__ */ (0, L.jsxs)("div", {
				className: "tm-actions",
				children: [
					/* @__PURE__ */ (0, L.jsx)("span", { className: "tm-spacer" }),
					/* @__PURE__ */ (0, L.jsx)("button", {
						type: "button",
						className: "tm-action",
						onClick: () => c(null),
						children: e(`${m}cancel`)
					}),
					/* @__PURE__ */ (0, L.jsx)("button", {
						type: "submit",
						className: "tm-action tm-action--primary",
						disabled: E,
						children: e(`${m}save`)
					})
				]
			})
		]
	});
}
// src/ui/TagRow.tsx
function W(e, t) {
	return e.allowed ? e.kind === "channel" || e.members.length > 0 && e.members.length <= t : !1;
}
function G({ t: e, tag: t, name: n, max: r }) {
	let i = t.kind === "channel" ? e(`${m}channel_desc`) : t.kind === "team" ? e(`${m}team_desc`, { space: t.label }) : t.label, a = t.members.slice(0, 6).map(n).join(", ") + (t.members.length > 6 ? ` +${t.members.length - 6}` : "");
	return /* @__PURE__ */ (0, L.jsxs)("span", {
		className: "tm-row",
		children: [
			/* @__PURE__ */ (0, L.jsxs)("span", {
				className: "tm-row-head",
				children: [
					/* @__PURE__ */ (0, L.jsxs)("span", {
						className: "tm-tag",
						children: ["@", t.name]
					}),
					i && /* @__PURE__ */ (0, L.jsx)("span", {
						className: "tm-row-desc",
						children: i
					}),
					t.kind === "tag" && t.source?.fromSpace && /* @__PURE__ */ (0, L.jsx)("span", {
						className: "tm-row-source",
						children: e("datanauten_tagmentions_from_space", { name: t.source.name })
					})
				]
			}),
			t.kind !== "channel" && t.members.length > 0 && /* @__PURE__ */ (0, L.jsxs)("span", {
				className: "tm-row-members",
				children: [
					e("datanauten_tagmentions_notifies", { count: t.members.length }),
					": ",
					a
				]
			}),
			!t.allowed && /* @__PURE__ */ (0, L.jsx)("span", {
				className: "tm-row-warn",
				children: e("datanauten_tagmentions_not_allowed")
			}),
			t.allowed && t.kind !== "channel" && t.members.length > r && /* @__PURE__ */ (0, L.jsx)("span", {
				className: "tm-row-warn",
				children: e("datanauten_tagmentions_over_max", { max: r })
			}),
			t.kind === "tag" && t.absent.length > 0 && /* @__PURE__ */ (0, L.jsx)("span", {
				className: "tm-row-note",
				children: e("datanauten_tagmentions_absent", { names: t.absent.map(n).join(", ") })
			})
		]
	});
}
// src/ui/PickerDialog.tsx
function K({ t: e, tags: t, name: n, max: r, mode: i, initialText: a, insert: o, send: s, openManage: c, onSubmit: l, onCancel: u }) {
	let [d, f] = window.React.useState(null), [p, h] = window.React.useState(a ?? ""), [g, _] = window.React.useState(null), [v, y] = window.React.useState(!1), b = t.filter((e) => e.kind === "tag"), x = (e) => {
		i === "insert" ? (o(e), l(e.name)) : f(e.name);
	}, S = async (n) => {
		n.preventDefault();
		let r = t.find((e) => e.name === d);
		if (r) {
			y(!0);
			try {
				await s(r, p), l(r.name);
			} catch (t) {
				_(e(`${m}failed`, { error: t instanceof Error ? t.message : String(t) })), y(!1);
			}
		}
	};
	return /* @__PURE__ */ (0, L.jsxs)("form", {
		className: "tm-dialog",
		"data-testid": "tag-mentions-picker",
		onSubmit: (e) => void S(e),
		children: [
			/* @__PURE__ */ (0, L.jsx)("p", {
				className: "tm-hint",
				children: e(i === "insert" ? `${m}picker_hint` : `${m}picker_direct_hint`)
			}),
			/* @__PURE__ */ (0, L.jsx)("ul", {
				className: "tm-list",
				role: "listbox",
				"aria-label": e(`${m}picker_title`),
				children: t.map((t) => /* @__PURE__ */ (0, L.jsx)("li", { children: /* @__PURE__ */ (0, L.jsx)("button", {
					type: "button",
					role: "option",
					"aria-selected": d === t.name,
					className: "tm-option",
					disabled: !W(t, r),
					onClick: () => x(t),
					children: /* @__PURE__ */ (0, L.jsx)(G, {
						t: e,
						tag: t,
						name: n,
						max: r
					})
				}) }, t.name))
			}),
			!b.length && /* @__PURE__ */ (0, L.jsx)("p", {
				className: "tm-empty",
				children: e("datanauten_tagmentions_no_tags")
			}),
			i === "send" && /* @__PURE__ */ (0, L.jsx)("textarea", {
				className: "tm-input tm-textarea",
				rows: 3,
				"aria-label": e("datanauten_tagmentions_message"),
				placeholder: e("datanauten_tagmentions_message"),
				value: p,
				onChange: (e) => h(e.target.value)
			}),
			g && /* @__PURE__ */ (0, L.jsx)("div", {
				className: "tm-error",
				role: "alert",
				children: g
			}),
			/* @__PURE__ */ (0, L.jsxs)("div", {
				className: "tm-actions",
				children: [
					/* @__PURE__ */ (0, L.jsx)("button", {
						type: "button",
						className: "tm-link",
						onClick: c,
						children: e(`${m}manage`)
					}),
					/* @__PURE__ */ (0, L.jsx)("span", { className: "tm-spacer" }),
					/* @__PURE__ */ (0, L.jsx)("button", {
						type: "button",
						className: "tm-action",
						onClick: u,
						children: e(`${m}cancel`)
					}),
					i === "send" && /* @__PURE__ */ (0, L.jsx)("button", {
						type: "submit",
						className: "tm-action tm-action--primary",
						disabled: v || !d,
						children: e("datanauten_tagmentions_send")
					})
				]
			})
		]
	});
}
// src/ui/SkippedDialog.tsx
function q({ t: e, lines: t, onCancel: n }) {
	return /* @__PURE__ */ (0, L.jsxs)("div", {
		className: "tm-dialog",
		"data-testid": "tag-mentions-skipped",
		children: [t.map((e) => /* @__PURE__ */ (0, L.jsx)("p", {
			className: "tm-hint",
			children: e
		}, e)), /* @__PURE__ */ (0, L.jsxs)("div", {
			className: "tm-actions",
			children: [/* @__PURE__ */ (0, L.jsx)("span", { className: "tm-spacer" }), /* @__PURE__ */ (0, L.jsx)("button", {
				type: "button",
				className: "tm-action tm-action--primary",
				onClick: n,
				children: e(`${m}ok`)
			})]
		})]
	});
}
// src/ui/styles.css?inline
var J = ".tm-dialog{flex-direction:column;gap:12px;width:min(540px,86vw);display:flex}.tm-hint,.tm-note,.tm-empty{color:var(--cpd-color-text-secondary,#656d77);margin:0;font-size:13px;line-height:1.4}.tm-note{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);border-radius:8px;padding:8px 12px}.tm-label{color:var(--cpd-color-text-secondary,#656d77);margin:0;padding:0;font-size:13px;font-weight:600}.tm-field,.tm-fieldset{border:0;flex-direction:column;gap:6px;margin:0;padding:0;display:flex}.tm-input{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);min-width:0;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;border-radius:8px;flex:1;padding:8px 12px;font-size:15px}.tm-input:disabled{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);color:var(--cpd-color-text-secondary,#656d77)}.tm-textarea{resize:vertical;min-height:60px}.tm-name-input,.tm-add{align-items:center;gap:6px;font-weight:600;display:flex}.tm-segmented{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);border-radius:10px;display:flex;overflow:hidden}.tm-segment{border:0;border-right:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;background:0 0;flex:1;padding:7px 10px;font-size:14px}.tm-segment:last-child{border-right:0}.tm-segment[aria-checked=true]{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);font-weight:600}.tm-chips{flex-wrap:wrap;gap:6px;max-height:30vh;display:flex;overflow-y:auto}.tm-chip{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;border-radius:16px;padding:5px 12px;font-size:14px}.tm-chip[aria-checked=true]{border-color:var(--cpd-color-border-accent,#0b8a5f);background:var(--cpd-color-bg-accent-rest,#0b8a5f);color:var(--cpd-color-text-on-solid-primary,#fff)}.tm-list{flex-direction:column;gap:6px;max-height:50vh;margin:0;padding:0;list-style:none;display:flex;overflow-y:auto}.tm-item{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);border-radius:10px;align-items:center;gap:10px;padding:8px 12px;display:flex}.tm-item-actions{gap:6px;margin-left:auto;display:flex}.tm-option{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);background:var(--cpd-color-bg-canvas-default,#fff);width:100%;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;text-align:left;cursor:pointer;border-radius:10px;padding:8px 12px;display:block}.tm-option:hover:not(:disabled),.tm-option[aria-selected=true]{border-color:var(--cpd-color-border-accent,#0b8a5f);background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}.tm-option:disabled{cursor:default;opacity:.6}.tm-option--compact{border:0;border-radius:8px}.tm-row{flex-direction:column;gap:2px;min-width:0;display:flex}.tm-row-head{flex-wrap:wrap;align-items:baseline;gap:8px;display:flex}.tm-row-desc{color:var(--cpd-color-text-primary,#1b1d22);font-size:14px}.tm-row-source,.tm-row-members,.tm-row-note{color:var(--cpd-color-text-secondary,#656d77);font-size:12px}.tm-row-warn{color:var(--cpd-color-text-critical-primary,#d51928);font-size:12px}.tm-tag{color:var(--cpd-color-text-action-accent,#0b8a5f);font-weight:600}.tm-error{color:var(--cpd-color-text-critical-primary,#d51928);font-size:14px}.tm-actions{align-items:center;gap:8px;display:flex}.tm-spacer{flex:1}.tm-action{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);height:36px;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;background:0 0;border-radius:18px;padding:0 18px;font-size:14px;font-weight:600}.tm-action--small{height:28px;padding:0 12px;font-size:13px}.tm-action--primary{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);border-color:#0000}.tm-action--danger{color:var(--cpd-color-text-critical-primary,#d51928)}.tm-action:disabled{opacity:.5;cursor:default}.tm-link{color:var(--cpd-color-text-action-accent,#0b8a5f);font:inherit;cursor:pointer;background:0 0;border:0;padding:0;font-size:13px}:is(.tm-action,.tm-chip,.tm-segment,.tm-option,.tm-input,.tm-link,.tm-header-button):focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}.tm-suggest{z-index:4000;border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);background:var(--cpd-color-bg-canvas-default,#fff);border-radius:12px;flex-direction:column;gap:2px;max-height:40vh;padding:6px;display:flex;position:fixed;overflow-y:auto;box-shadow:0 4px 24px #00000026}.tm-header-button{width:32px;height:32px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:0;border-radius:50%;place-items:center;padding:0;display:inline-grid}.tm-header-button:hover{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);color:var(--cpd-color-icon-primary,#1b1d22)}.tm-header-button svg{width:20px;height:20px}.tm-footer{flex-wrap:wrap;align-items:center;gap:6px;margin-top:4px;font-size:12px;display:flex}.tm-footer-label{color:var(--cpd-color-text-secondary,#656d77)}.tm-tag--chip{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);cursor:default;border-radius:10px;align-items:center;gap:4px;padding:1px 8px;display:inline-flex}.tm-count{color:var(--cpd-color-text-secondary,#656d77);font-weight:400}";
// src/ui/Suggestions.tsx
function Y({ t: e, state: t, name: n, max: r, pick: i }) {
	return /* @__PURE__ */ (0, L.jsx)("div", {
		className: "tm-suggest",
		role: "listbox",
		"aria-label": e(`${m}picker_title`),
		"data-testid": "tag-mentions-suggest",
		style: {
			left: t.anchor.left,
			bottom: t.anchor.bottom,
			width: Math.min(t.anchor.width, 520)
		},
		onMouseDown: (e) => e.preventDefault(),
		children: t.tags.map((a, o) => /* @__PURE__ */ (0, L.jsx)("button", {
			type: "button",
			role: "option",
			tabIndex: -1,
			"aria-selected": o === t.selected,
			disabled: !W(a, r),
			className: "tm-option tm-option--compact",
			onClick: () => i(a),
			children: /* @__PURE__ */ (0, L.jsx)(G, {
				t: e,
				tag: a,
				name: n,
				max: r
			})
		}, a.name))
	});
}
// src/ui/TagFooter.tsx
function X({ t: e, tags: t, name: n }) {
	return /* @__PURE__ */ (0, L.jsxs)("div", {
		className: "tm-footer",
		"data-testid": "tag-mentions-footer",
		children: [/* @__PURE__ */ (0, L.jsx)("span", {
			className: "tm-footer-label",
			children: e(`${m}footer`)
		}), t.map((t) => {
			let r = t.room ? e(`${m}footer_room`) : (t.user_ids ?? []).map(n).join(", ");
			return /* @__PURE__ */ (0, L.jsxs)("span", {
				className: "tm-tag tm-tag--chip",
				title: r,
				children: [
					"@",
					t.name,
					!t.room && /* @__PURE__ */ (0, L.jsx)("span", {
						className: "tm-count",
						children: t.user_ids?.length ?? 0
					})
				]
			}, t.name);
		})]
	});
}
// src/index.tsx
var Z = "de-datanauten-tag-mentions-style", re = "de.datanauten.tag_mentions", Q = 2e3, $ = class {
	api;
	static moduleApiVersion = "^2.0.0";
	client;
	unhook;
	startTimer;
	suggest;
	suggestRoot;
	listeners = /* @__PURE__ */ new Set();
	max = 50;
	constructor(e) {
		this.api = e, this.suggest = new ee({
			tagsForComposer: () => {
				let e = t(), r = e && n(e, window.location.hash);
				return e && r && this.client === e ? k(e, r) : [];
			},
			render: this.renderSuggestions
		});
	}
	async load() {
		this.api.i18n.register(h), this.max = ie(this.api), se(), this.api.composer.addFileUploadOption({
			type: "de.datanauten.tag_mentions.insert",
			label: this.t(`${m}menu_insert`),
			icon: R,
			onSelected: (e, t) => this.openPicker(e, t)
		}), I(this.api.customComponents, {
			id: "tag-mentions/footer",
			filter: (e) => e.type === "m.room.message" && !!l(e.content),
			render: (e, t) => /* @__PURE__ */ (0, L.jsxs)(L.Fragment, { children: [t(), /* @__PURE__ */ (0, L.jsx)(X, {
				t: this.t,
				tags: l(e.mxEvent.content),
				name: this.nameIn(e.mxEvent.roomId)
			})] })
		}), this.api.extras.addRoomHeaderButtonCallback((e) => (this.start(), /* @__PURE__ */ (0, L.jsx)(z, {
			label: this.t(`${m}header_button`),
			onClick: () => this.openManage(e)
		}, "tag-mentions")));
		let e = window.deDatanautenTeamsSuite ??= {};
		e["tag-mentions"] = {
			version: 1,
			expand: (e, t) => (this.start(), this.transform(e, t) ?? t)
		}, this.suggest.start(), this.startTimer = setInterval(() => this.start(), Q);
	}
	dispose() {
		this.startTimer && clearInterval(this.startTimer), this.suggest.stop(), this.detach();
	}
	start() {
		let e = t();
		e !== this.client && (this.detach(), !e || e.isInitialSyncComplete && !e.isInitialSyncComplete() || (this.client = e, this.unhook = _(e, this.transform), e.on("RoomState.events", this.notify)));
	}
	detach() {
		this.unhook?.(), this.unhook = void 0, this.client?.off("RoomState.events", this.notify), this.client = void 0;
	}
	transform = (e, t) => {
		let n = this.client;
		if (!n) return;
		let r = c(t, {
			tags: k(n, e),
			name: this.nameIn(e),
			max: this.max
		});
		if (r) return r.skipped.length && setTimeout(() => this.showSkipped(r), 0), r.used.length ? r.content : void 0;
	};
	showSkipped(e) {
		let t = e.skipped.map(({ tag: e, reason: t }) => this.t(`${m}skip_${t}`, {
			name: e.name,
			max: this.max
		}));
		this.api.openDialog({ title: this.t(`${m}skipped_title`) }, q, {
			t: this.t,
			lines: t
		});
	}
	openPicker(e, n) {
		this.start();
		let r = t();
		if (!r || !e || !r.getRoom(e)) return;
		let i = n ?? { view: "room" }, a = i.view === "thread" ? i.threadId ?? null : null;
		this.api.openDialog({ title: this.t(`${m}picker_title`) }, K, {
			t: this.t,
			tags: k(r, e),
			name: this.nameIn(e),
			max: this.max,
			mode: this.unhook ? "insert" : "send",
			insert: (e) => {
				let t = oe(i.view === "thread" ? "thread" : "room"), n = `${t && !/\s$/.test(t) ? " " : ""}@${e.name} `;
				this.api.composer.insertPlaintextIntoComposer(n, i);
			},
			send: async (t, n) => {
				let i = {
					msgtype: "m.text",
					body: `@${t.name} ${n.trim()}`.trim()
				}, o = c(i, {
					tags: k(r, e),
					name: this.nameIn(e),
					max: this.max
				});
				await r.sendEvent(e, a, "m.room.message", o?.used.length ? o.content : i);
			},
			openManage: () => this.openManage(e)
		});
	}
	openManage(e) {
		this.start();
		let n = t(), r = n?.getRoom(e), i = n?.getUserId();
		if (!n || !r || !i) return;
		let a = (e) => ({
			id: e.roomId,
			name: e.name,
			isSpace: !!e.isSpaceRoom?.(),
			canEdit: e.currentState.maySendStateEvent(v, i),
			level: ae(e)
		}), o = [a(r), ...D(n, r).map(a)];
		this.api.openDialog({ title: this.t(`${m}manage_title`) }, V, {
			t: this.t,
			scopes: o,
			tagsIn: (e) => {
				let t = n.getRoom(e);
				return t ? E(t) : [];
			},
			inherited: () => O(n, r).filter((e) => e.sourceId !== r.roomId),
			members: async (e) => {
				let t = n.getRoom(e);
				return t ? (await t.loadMembersIfNeeded?.().catch(() => !1), t.getJoinedMembers().map((e) => ({
					userId: e.userId,
					name: e.name
				}))) : [];
			},
			name: this.nameIn(e),
			save: async (e, t, r, i) => {
				await n.sendStateEvent(e, v, T(r, i), t);
			},
			remove: async (e, t) => {
				await n.sendStateEvent(e, v, {}, t);
			},
			subscribe: this.subscribe,
			max: this.max
		});
	}
	renderSuggestions = (e, r) => {
		if (!this.suggestRoot) {
			if (!e) return;
			let t = document.createElement("div");
			t.id = "tag-mentions-suggest", document.body.appendChild(t), this.suggestRoot = this.api.createRoot(t);
		}
		let i = n(t(), window.location.hash) ?? "";
		this.suggestRoot.render(e ? /* @__PURE__ */ (0, L.jsx)(Y, {
			t: this.t,
			state: e,
			name: this.nameIn(i),
			max: this.max,
			pick: r
		}) : null);
	};
	nameIn(e) {
		return (n) => {
			let r = t(), i = r?.getRoom(e), a = i?.getMember(n)?.name;
			if (a) return a;
			for (let e of r && i ? D(r, i) : []) {
				let t = e.getMember(n)?.name;
				if (t) return t;
			}
			return n;
		};
	}
	subscribe = (e) => (this.listeners.add(e), () => this.listeners.delete(e));
	notify = () => this.listeners.forEach((e) => e());
	t = (e, t) => this.api.i18n.translate(e, t);
};
function ie(e) {
	try {
		let t = e.config.get(re)?.max_mentions;
		if (typeof t == "number" && Number.isInteger(t) && t > 0) return t;
	} catch {}
	return 50;
}
function ae(e) {
	let t = e.currentState.getStateEvents("m.room.power_levels", "")?.getContent();
	return t?.events?.["de.datanauten.tag"] ?? t?.state_default ?? 50;
}
function oe(e) {
	let t = e === "thread" ? ".mx_ThreadView .mx_BasicMessageComposer_input" : ".mx_RoomView_body .mx_BasicMessageComposer_input";
	return document.querySelector(t)?.innerText.replace(/\n$/, "") ?? "";
}
function se() {
	if (document.getElementById(Z)) return;
	let e = document.createElement("style");
	e.id = Z, e.textContent = J, document.head.appendChild(e);
}
export { $ as TagMentionsModule, $ as default };

//# sourceMappingURL=index.js.map