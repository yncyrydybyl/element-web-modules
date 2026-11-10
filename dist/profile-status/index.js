/*! @datanauten/element-web-module-profile-status 0.1.1 */
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
function n(e) {
	return typeof e.getExtendedProfile == "function" && typeof e.setExtendedProfileProperty == "function" && typeof e.deleteExtendedProfileProperty == "function";
}
function r(e, t) {
	let n = e.getUserId(), r = e.getAccountData?.("m.direct")?.getContent();
	if (r && typeof r == "object") {
		for (let [i, a] of Object.entries(r)) if (Array.isArray(a) && a.includes(t) && i !== n) {
			let n = e.getRoom(t)?.getMember(i)?.membership;
			return n && n !== "join" && n !== "invite" ? void 0 : i;
		}
	}
}
function i(e, t, n) {
	e.off ? e.off(t, n) : e.removeListener?.(t, n);
}
var a = /@[^\s:]+:[^\s]+/;
function o(e) {
	let t = e ? a.exec(e) : null;
	return t ? t[0].replace(/[)\]]+$/, "") : void 0;
}
// src/autoReply.ts
var s = "de.datanauten.profile_status", c = "de.datanauten.auto_reply";
function l(e) {
	let t = new Date(e);
	return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}
var u = class {
	opts;
	client;
	seen = /* @__PURE__ */ new Set();
	sentToday = /* @__PURE__ */ new Map();
	constructor(e) {
		this.opts = e;
	}
	attach(e) {
		this.client !== e && (this.detach(), this.client = e, e.on("Room.timeline", this.onTimeline), e.on("Event.decrypted", this.onDecrypted));
	}
	detach() {
		this.client &&= (i(this.client, "Room.timeline", this.onTimeline), i(this.client, "Event.decrypted", this.onDecrypted), void 0);
	}
	onTimeline = (e, t, n, r, i) => {
		n || r || i?.liveEvent === !1 || e.getType() !== "m.room.encrypted" && this.handle(e);
	};
	onDecrypted = (e) => {
		this.handle(e);
	};
	async handle(e) {
		let t = this.client ?? this.opts.client();
		if (!t || !this.opts.allowed()) return !1;
		let n = this.opts.settings();
		if (!n.auto_reply) return !1;
		let i = e.getId();
		if (!i || this.seen.has(i) || e.getType() !== "m.room.message" || e.isRedacted?.() || e.isDecryptionFailure?.()) return !1;
		let a = t.getUserId(), o = e.getSender();
		if (!o || o === a) return !1;
		let s = e.getContent();
		if (s.msgtype === "m.notice" || s["de.datanauten.auto_reply"]) return !1;
		let u = this.opts.now?.() ?? Date.now();
		if (u - e.getTs() > 12e4) return !1;
		let d = this.opts.ooo();
		if (!d.active) return !1;
		let f = e.getRoomId();
		if (!f || r(t, f) !== o) return !1;
		this.seen.add(i);
		let p = l(u);
		if (n.replied?.[f] === p || this.sentToday.get(f) === p) return !1;
		this.sentToday.set(f, p);
		let m = Object.fromEntries(Object.entries(n.replied ?? {}).filter(([, e]) => e === p));
		m[f] = p;
		try {
			await this.opts.saveSettings({ replied: m });
			let e = this.opts.message(d.until);
			return await t.sendEvent(f, "m.room.message", {
				msgtype: "m.notice",
				body: e,
				[c]: !0
			}), !0;
		} catch (e) {
			return console.warn("[profile-status] Sending the out-of-office reply failed", e), !1;
		}
	}
}, d = "connected_calls", f = "datanauten_profilestatus_call_set", p = 2e3;
function m() {
	let e = window.mxCallStatusListener?.callStore;
	if (e && typeof e.on == "function" && e.connectedCalls instanceof Set) return e;
}
var h = class {
	opts;
	store;
	written = !1;
	timer;
	constructor(e) {
		this.opts = e;
	}
	attach() {
		let e = this.opts.store();
		return e ? (e === this.store || (this.detach(), this.store = e, e.on(d, this.onConnectedCalls)), !0) : !1;
	}
	detach() {
		this.timer && clearTimeout(this.timer), this.store &&= (this.store.off ? this.store.off(d, this.onConnectedCalls) : this.store.removeListener?.(d, this.onConnectedCalls), void 0);
	}
	get inCall() {
		return (this.store?.connectedCalls.size ?? 0) > 0;
	}
	async cleanUp(e, t = Date.now()) {
		!this.opts.enabled() || this.inCall || e === void 0 ? e === void 0 && v() : (g() || t - e > 432e5) && await this.apply(!1);
	}
	onConnectedCalls = (e, t) => {
		let n = e.size > 0;
		n !== t.size > 0 && (this.opts.onChange?.(n), this.opts.enabled() && (this.timer && clearTimeout(this.timer), this.timer = setTimeout(() => {
			this.timer = void 0, this.written !== this.inCall && this.apply(this.inCall);
		}, p)));
	};
	async apply(e) {
		try {
			await this.opts.write(e), this.written = e, e ? _() : v();
		} catch (e) {
			console.warn("[profile-status] Updating m.call failed", e);
		}
	}
};
function g() {
	try {
		return localStorage.getItem(f) === "1";
	} catch {
		return !1;
	}
}
function _() {
	try {
		localStorage.setItem(f, "1");
	} catch {}
}
function v() {
	try {
		localStorage.removeItem(f);
	} catch {}
}
// src/i18n.ts
var y = "datanauten_profilestatus_", b = {
	[`${y}menu_set_status`]: {
		en: "Set status",
		de: "Status festlegen"
	},
	[`${y}menu_edit_card`]: {
		en: "Edit profile card",
		de: "Profilkarte bearbeiten"
	},
	[`${y}avail_available`]: {
		en: "Available",
		de: "Verfügbar"
	},
	[`${y}avail_busy`]: {
		en: "Busy",
		de: "Beschäftigt"
	},
	[`${y}avail_dnd`]: {
		en: "Do not disturb",
		de: "Nicht stören"
	},
	[`${y}avail_brb`]: {
		en: "Be right back",
		de: "Bin gleich zurück"
	},
	[`${y}avail_away`]: {
		en: "Away",
		de: "Abwesend"
	},
	[`${y}avail_ooo`]: {
		en: "Out of office",
		de: "Nicht im Büro"
	},
	[`${y}avail_in_call`]: {
		en: "In a call",
		de: "In einem Anruf"
	},
	[`${y}dialog_title`]: {
		en: "Set your status",
		de: "Status festlegen"
	},
	[`${y}availability`]: {
		en: "Availability",
		de: "Verfügbarkeit"
	},
	[`${y}message`]: {
		en: "Status message",
		de: "Statusnachricht"
	},
	[`${y}message_placeholder`]: {
		en: "e.g. Working from Munich",
		de: "z. B. Heute aus München"
	},
	[`${y}public_hint`]: {
		en: "Your status is public: anyone who can look up your profile can see it, in any Matrix app.",
		de: "Dein Status ist öffentlich: Jeder, der dein Profil abrufen kann, sieht ihn, in jeder Matrix-App."
	},
	[`${y}too_long`]: {
		en: "That's too long.",
		de: "Das ist zu lang."
	},
	[`${y}clear_after`]: {
		en: "Clear status after",
		de: "Status löschen nach"
	},
	[`${y}clear_never`]: {
		en: "Never",
		de: "Nie"
	},
	[`${y}clear_1h`]: {
		en: "1 hour",
		de: "1 Stunde"
	},
	[`${y}clear_today`]: {
		en: "Today",
		de: "Heute"
	},
	[`${y}clear_week`]: {
		en: "This week",
		de: "Diese Woche"
	},
	[`${y}ooo_until`]: {
		en: "Back on (optional)",
		de: "Zurück am (optional)"
	},
	[`${y}ooo_back`]: {
		en: "Out of office, back on %(date)s",
		de: "Nicht im Büro, zurück am %(date)s"
	},
	[`${y}back_on`]: {
		en: "Back on %(date)s",
		de: "Zurück am %(date)s"
	},
	[`${y}past_date`]: {
		en: "Pick a day in the future.",
		de: "Wähle einen Tag in der Zukunft."
	},
	[`${y}auto_reply`]: {
		en: "Reply automatically to direct messages, once per chat and day",
		de: "Direktnachrichten automatisch beantworten, einmal pro Chat und Tag"
	},
	[`${y}auto_reply_hint`]: {
		en: "Only works while Element is open on one of your devices.",
		de: "Funktioniert nur, solange Element auf einem deiner Geräte offen ist."
	},
	[`${y}auto_reply_text`]: {
		en: "Automatic reply",
		de: "Automatische Antwort"
	},
	[`${y}auto_reply_default`]: {
		en: "I'm out of office and will reply when I'm back. (Automatic reply)",
		de: "Ich bin nicht im Büro und antworte, wenn ich zurück bin. (Automatische Antwort)"
	},
	[`${y}auto_reply_default_until`]: {
		en: "I'm out of office and back on %(date)s. I'll reply then. (Automatic reply)",
		de: "Ich bin nicht im Büro und ab %(date)s zurück. Dann antworte ich. (Automatische Antwort)"
	},
	[`${y}call_status`]: {
		en: "Show “In a call” while I'm in a call",
		de: "„In einem Anruf“ anzeigen, während ich telefoniere"
	},
	[`${y}save`]: {
		en: "Save",
		de: "Speichern"
	},
	[`${y}cancel`]: {
		en: "Cancel",
		de: "Abbrechen"
	},
	[`${y}clear`]: {
		en: "Clear status",
		de: "Status löschen"
	},
	[`${y}close`]: {
		en: "Close",
		de: "Schließen"
	},
	[`${y}failed`]: {
		en: "Couldn't save: %(error)s",
		de: "Speichern fehlgeschlagen: %(error)s"
	},
	[`${y}no_support`]: {
		en: "Your homeserver doesn't support profile fields (MSC4133), so a status can't be saved.",
		de: "Dein Homeserver unterstützt keine Profilfelder (MSC4133), daher kann kein Status gespeichert werden."
	},
	[`${y}until`]: {
		en: "until %(time)s",
		de: "bis %(time)s"
	},
	[`${y}until_today`]: {
		en: "until end of today",
		de: "bis heute Abend"
	},
	[`${y}until_end_of`]: {
		en: "until end of %(day)s",
		de: "bis einschließlich %(day)s"
	},
	[`${y}in_call_since`]: {
		en: "since %(time)s",
		de: "seit %(time)s"
	},
	[`${y}status_and_card`]: {
		en: "Status and profile card",
		de: "Status und Profilkarte"
	},
	[`${y}no_status`]: {
		en: "No status",
		de: "Kein Status"
	},
	[`${y}card_title`]: {
		en: "Profile card",
		de: "Profilkarte"
	},
	[`${y}job_title`]: {
		en: "Job title",
		de: "Position"
	},
	[`${y}department`]: {
		en: "Department",
		de: "Abteilung"
	},
	[`${y}phone`]: {
		en: "Phone",
		de: "Telefon"
	},
	[`${y}card_hint`]: {
		en: "Public like your display name: anyone who can look up your profile can see these fields.",
		de: "Öffentlich wie dein Anzeigename: Jeder, der dein Profil abrufen kann, sieht diese Felder."
	},
	[`${y}card_locked`]: {
		en: "Managed by your organisation",
		de: "Von deiner Organisation verwaltet"
	},
	[`${y}edit`]: {
		en: "Edit",
		de: "Bearbeiten"
	}
}, x = {
	userMenu: "[role=\"menu\"]",
	userMenuUserId: "[data-testid=\"userId\"]",
	userMenuItem: "[role=\"menuitem\"]",
	userMenuTrigger: ".mx_UserMenu button",
	userInfoProfile: ".mx_UserInfo_profile",
	userInfoMxid: ".mx_UserInfo_profile_mxid",
	memberTile: ".mx_MemberTileView",
	memberAvatar: ".mx_MemberTileView_avatar [title]",
	memberName: ".mx_MemberTileView_name .mx_DisambiguatedProfile",
	eventTile: ".mx_EventTile[data-event-id]",
	senderProfile: ".mx_DisambiguatedProfile",
	eventAvatar: ".mx_EventTile_avatar [title]",
	elementStatus: ".mx_DisambiguatedProfile_userStatus"
}, S = "ps-inline";
function C(e, t, n) {
	e.querySelectorAll(x.userMenu).forEach((e) => {
		e.querySelector(x.userMenuUserId) && (e.querySelector(".ps-menu-item") || t.userMenu(e, e.querySelector(x.userMenuItem)));
	}), e.querySelectorAll(x.userMenuTrigger).forEach((e) => t.userMenuTrigger(e)), e.querySelectorAll(x.userInfoProfile).forEach((e) => {
		let n = e.querySelector(x.userInfoMxid), r = o(n?.textContent);
		n && r && t.userInfo(e, n, r);
	}), n.memberList && e.querySelectorAll(x.memberTile).forEach((e) => {
		let n = e.querySelector(x.memberName), r = o(e.querySelector(x.memberAvatar)?.getAttribute("title")) ?? o(n?.getAttribute("title"));
		n && !T(n) && r && t.inline(n, r);
	}), n.timeline && e.querySelectorAll(x.eventTile).forEach((e) => {
		let r = e.querySelector(x.senderProfile);
		if (!r || T(r) || r.closest(".mx_ReplyTile")) return;
		let i = e.getAttribute("data-event-id") ?? void 0, a = i && n.eventSender?.(i) || o(e.querySelector(x.eventAvatar)?.getAttribute("title"));
		a && t.inline(r, a, i);
	});
}
var w = class {
	run;
	observer;
	scheduled = !1;
	constructor(e) {
		this.run = e;
	}
	start() {
		this.observer || typeof MutationObserver > "u" || (this.observer = new MutationObserver((e) => {
			e.every((e) => E(e.target) && [...e.addedNodes].every(E)) || this.schedule();
		}), this.observer.observe(document.body, {
			childList: !0,
			subtree: !0
		}), this.schedule());
	}
	stop() {
		this.observer?.disconnect(), this.observer = void 0;
	}
	schedule() {
		this.scheduled || (this.scheduled = !0, (typeof requestAnimationFrame == "function" ? requestAnimationFrame : (e) => setTimeout(e, 16))(() => {
			this.scheduled = !1;
			try {
				this.run();
			} catch (e) {
				console.warn("[profile-status] Decorating the page failed", e);
			}
		}));
	}
};
function T(e) {
	return e.querySelector(x.elementStatus) ? (e.querySelectorAll(`.${S}`).forEach((e) => e.remove()), !0) : !1;
}
function E(e) {
	return !!(e instanceof Element ? e : e.parentElement)?.closest("[class^=\"ps-\"], [class*=\" ps-\"]");
}
// src/status.ts
var D = "org.matrix.msc4426.status", O = "org.matrix.msc4426.call", ee = "de.datanauten.job_title", te = "de.datanauten.department", ne = "de.datanauten.phone", k = "de.datanauten.availability", A = "de.datanauten.expires_ts", j = "de.datanauten.ooo_until", re = "de.datanauten.auto_text", M = [
	"available",
	"busy",
	"dnd",
	"brb",
	"away",
	"ooo"
], N = {
	available: "🟢",
	busy: "🔴",
	dnd: "⛔",
	brb: "⏳",
	away: "🟡",
	ooo: "🌴",
	in_call: "📞"
}, P = [
	"job_title",
	"department",
	"phone"
], F = {
	job_title: ee,
	department: te,
	phone: ne
}, ie = typeof Intl < "u" && "Segmenter" in Intl ? new Intl.Segmenter() : void 0;
function I(e) {
	return new TextEncoder().encode(e).length;
}
function L(e, t) {
	if (I(e) <= t) return e;
	let n = "";
	for (let r of e) {
		if (I(n + r) > t) break;
		n += r;
	}
	return n;
}
function ae(e) {
	if (!ie) return [...e][0] ?? "";
	for (let { segment: t } of ie.segment(e)) return t;
	return "";
}
function R(e) {
	return typeof e == "string" && /^\d{4}-\d{2}-\d{2}$/.test(e) && !Number.isNaN(z(e));
}
function z(e) {
	let [t, n, r] = e.split("-").map(Number);
	return new Date(t, n - 1, r).getTime();
}
function oe(e) {
	let t = new Date(e);
	return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}
function B(e) {
	if (!e || typeof e != "object") return;
	let t = e;
	if (typeof t.emoji != "string" || !t.emoji || typeof t.text != "string" || !t.text) return;
	let n = M.includes(t["de.datanauten.availability"]) ? t[k] : void 0, r = t[A];
	return {
		emoji: ae(t.emoji),
		text: L(t.text, 256),
		availability: n,
		autoText: !!n && t["de.datanauten.auto_text"] === !0,
		expiresTs: typeof r == "number" && Number.isFinite(r) && r > 0 ? r : void 0,
		oooUntil: n === "ooo" && R(t["de.datanauten.ooo_until"]) ? t[j] : void 0
	};
}
function V(e) {
	if (!e || typeof e != "object") return;
	let t = e.call_joined_ts;
	if (!(typeof t != "number" || !Number.isFinite(t) || t <= 0)) return t < 1e11 ? t * 1e3 : t;
}
function se(e) {
	if (typeof e != "string") return;
	let t = e.trim();
	return t ? t.slice(0, 100) : void 0;
}
function H(e) {
	let t = e ?? {}, n = {};
	for (let e of P) {
		let r = se(t[F[e]]);
		r && (n[e] = r);
	}
	return {
		status: B(t["org.matrix.msc4426.status"]) ?? B(t["m.status"]),
		callSince: V(t["org.matrix.msc4426.call"]) ?? V(t["m.call"]),
		card: n
	};
}
function ce(e, t) {
	return e.expiresTs !== void 0 && e.expiresTs <= t;
}
function U(e, t) {
	if (!e) return;
	let n = e.status && !ce(e.status, t) ? e.status : void 0, r = n && !n.autoText ? n.text : void 0;
	if (e.callSince && (!n || n.availability !== "dnd" && n.availability !== "ooo")) return {
		availability: "in_call",
		emoji: N.in_call,
		text: r,
		callSince: e.callSince
	};
	if (n) return {
		availability: n.availability,
		emoji: n.emoji,
		text: n.availability ? r : n.text,
		oooUntil: n.oooUntil,
		expiresTs: n.expiresTs
	};
}
var le = [
	"never",
	"1h",
	"today",
	"week"
];
function ue(e, t) {
	switch (e) {
		case "never": return;
		case "1h": return t.getTime() + 36e5;
		case "today": return new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1).getTime();
		case "week": {
			let e = (8 - t.getDay()) % 7 || 7;
			return new Date(t.getFullYear(), t.getMonth(), t.getDate() + e).getTime();
		}
	}
}
var W = class extends Error {};
function de(e, t, n) {
	let r = e.text.trim();
	if (I(r) > 256) throw new W("too_long");
	let i = e.availability === "ooo";
	if (i && e.oooUntil && (!R(e.oooUntil) || z(e.oooUntil) <= n.getTime())) throw new W("past_date");
	if (e.availability === "available" && !r) return null;
	let a = r, o = !1;
	a ||= (o = !0, i && e.oooUntil ? t.oooBack(e.oooUntil) : t.availability(e.availability));
	let s = {
		emoji: N[e.availability],
		text: L(a, 256),
		[k]: e.availability
	};
	o && (s[re] = !0);
	let c = i ? e.oooUntil ? z(e.oooUntil) : void 0 : ue(e.clearAfter, n);
	return c !== void 0 && (s[A] = c), i && e.oooUntil && (s[j] = e.oooUntil), s;
}
function fe(e) {
	return e ? {
		availability: e.availability ?? "available",
		text: e.autoText ? "" : e.text,
		clearAfter: "never",
		oooUntil: e.oooUntil
	} : {
		availability: "available",
		text: "",
		clearAfter: "never"
	};
}
// src/profileStore.ts
var G = "[profile-status]", pe = 12e4, K = 3e4, me = class {
	opts;
	entries = /* @__PURE__ */ new Map();
	listeners = /* @__PURE__ */ new Set();
	queue = [];
	running = 0;
	pausedUntil = 0;
	resumeTimer;
	supported = !0;
	constructor(e) {
		this.opts = e;
	}
	now() {
		return this.opts.now?.() ?? Date.now();
	}
	get(e) {
		return this.entries.get(e)?.info;
	}
	request(e, t = pe) {
		let n = this.entries.get(e);
		return (!n || !n.pending && !n.queued && this.now() - n.fetchedAt > t) && this.enqueue(e), n?.info;
	}
	refresh(e) {
		let t = this.entries.get(e);
		return t?.pending ? t.pending : this.load(e);
	}
	set(e, t) {
		this.entries.set(e, {
			...this.entries.get(e),
			info: t,
			fetchedAt: this.now()
		}), this.emit(e);
	}
	subscribe(e) {
		return this.listeners.add(e), () => this.listeners.delete(e);
	}
	dispose() {
		this.resumeTimer && clearTimeout(this.resumeTimer), this.queue.length = 0;
	}
	emit(e) {
		this.listeners.forEach((t) => t(e));
	}
	enqueue(e) {
		if (!this.supported) return;
		let t = this.entries.get(e) ?? { fetchedAt: 0 };
		t.queued = !0, this.entries.set(e, t), this.queue.push(e), this.pump();
	}
	pump() {
		let e = this.opts.concurrency ?? 3, t = this.pausedUntil - this.now();
		if (t > 0) this.resumeTimer ||= setTimeout(() => {
			this.resumeTimer = void 0, this.pump();
		}, t);
		else for (; this.running < e && this.queue.length;) {
			let e = this.queue.shift(), t = this.entries.get(e);
			t && (t.queued = !1), this.running++, this.load(e).finally(() => {
				this.running--, this.pump();
			});
		}
	}
	load(e) {
		let t = this.opts.client();
		if (!t || !n(t) || !this.supported) return Promise.resolve(this.get(e));
		let r = this.entries.get(e) ?? { fetchedAt: 0 };
		this.entries.set(e, r);
		let i = (async () => {
			try {
				let n = await t.getExtendedProfile(e);
				r.info = H(n);
			} catch (t) {
				let n = t;
				if (n.httpStatus === 404 || n.errcode === "M_NOT_FOUND") r.info = H({});
				else if (n.httpStatus === 429 || n.errcode === "M_LIMIT_EXCEEDED") return this.pausedUntil = this.now() + (n.data?.retry_after_ms ?? 5e3), r.pending = void 0, this.enqueue(e), r.info;
				else /does not support extended profiles/i.test(n.message ?? "") ? (this.supported = !1, console.info(`${G} The homeserver has no extended profiles (MSC4133); statuses are off`)) : n.httpStatus === 403 ? r.info = H({}) : console.warn(`${G} Fetching the profile of ${e} failed`, t);
			}
			return r.fetchedAt = this.now(), r.pending = void 0, this.emit(e), r.info;
		})();
		return r.pending = i, i;
	}
}, he = /* @__PURE__ */ e(((e) => {
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
})), q = (/* @__PURE__ */ e(((e, t) => {
	t.exports = he();
})))();
function ge(e) {
	let { t, initial: n, editable: r, onSubmit: i, onCancel: a } = e, [o, s] = window.React.useState(n), [c, l] = window.React.useState(null), [u, d] = window.React.useState(!1), f = async (n) => {
		n.preventDefault();
		let a = {};
		for (let e of r) a[e] = (o[e] ?? "").trim();
		d(!0), l(null);
		try {
			await e.submit(a), i(a);
		} catch (e) {
			l(t(`${y}failed`, { error: e instanceof Error ? e.message : String(e) })), d(!1);
		}
	};
	return /* @__PURE__ */ (0, q.jsxs)("form", {
		className: "ps-dialog",
		onSubmit: (e) => void f(e),
		"data-testid": "profile-status-card-dialog",
		children: [
			P.map((e) => {
				let n = !r.includes(e);
				return /* @__PURE__ */ (0, q.jsxs)("div", {
					className: "ps-field",
					children: [/* @__PURE__ */ (0, q.jsxs)("label", {
						className: "ps-label",
						htmlFor: `ps-card-${e}`,
						children: [t(`${y}${e}`), n && /* @__PURE__ */ (0, q.jsxs)("span", {
							className: "ps-locked",
							children: [" · ", t("datanauten_profilestatus_card_locked")]
						})]
					}), /* @__PURE__ */ (0, q.jsx)("input", {
						id: `ps-card-${e}`,
						className: "ps-input",
						"data-testid": `profile-status-card-${e}`,
						type: e === "phone" ? "tel" : "text",
						maxLength: 100,
						value: o[e] ?? "",
						readOnly: n,
						disabled: n,
						onChange: (t) => s({
							...o,
							[e]: t.target.value
						})
					})]
				}, e);
			}),
			/* @__PURE__ */ (0, q.jsx)("p", {
				className: "ps-hint",
				children: t(`${y}card_hint`)
			}),
			c && /* @__PURE__ */ (0, q.jsx)("p", {
				className: "ps-error",
				children: c
			}),
			/* @__PURE__ */ (0, q.jsxs)("div", {
				className: "ps-buttons",
				children: [
					/* @__PURE__ */ (0, q.jsx)("span", { className: "ps-spacer" }),
					/* @__PURE__ */ (0, q.jsx)("button", {
						type: "button",
						className: "ps-button",
						disabled: u,
						onClick: a,
						children: t(`${y}cancel`)
					}),
					/* @__PURE__ */ (0, q.jsx)("button", {
						type: "submit",
						className: "ps-button ps-button--primary",
						"data-testid": "profile-status-card-save",
						disabled: u || !r.length,
						children: t(`${y}save`)
					})
				]
			})
		]
	});
}
// src/ui/common.tsx
var _e = 3e4;
function ve(e, t, n) {
	let [, r] = window.React.useState(0);
	return window.React.useEffect(() => {
		if (!t) return;
		e.request(t, n);
		let i = e.subscribe((e) => e === t && r((e) => e + 1)), a = setInterval(() => {
			e.request(t, n), r((e) => e + 1);
		}, _e);
		return () => {
			i(), clearInterval(a);
		};
	}, [
		e,
		t,
		n
	]), t ? e.get(t) : void 0;
}
function J(e, t = Date.now()) {
	let n = new Date(e), r = n.toLocaleTimeString(void 0, {
		hour: "2-digit",
		minute: "2-digit"
	});
	return n.toDateString() === new Date(t).toDateString() ? r : `${n.toLocaleDateString(void 0, {
		weekday: "short",
		day: "numeric",
		month: "short"
	})} ${r}`;
}
function Y(e) {
	return new Date(z(e)).toLocaleDateString(void 0, {
		weekday: "short",
		day: "numeric",
		month: "short"
	});
}
function ye(e, t, n = Date.now()) {
	let r = new Date(e);
	if (r.getHours() !== 0 || r.getMinutes() !== 0) return t(`${y}until`, { time: J(e, n) });
	let i = /* @__PURE__ */ new Date(e - 1);
	return i.toDateString() === new Date(n).toDateString() ? t(`${y}until_today`) : t(`${y}until_end_of`, { day: i.toLocaleDateString(void 0, {
		weekday: "short",
		day: "numeric",
		month: "short"
	}) });
}
function be(e, t) {
	return e.availability ? t(`${y}avail_${e.availability}`) : e.text ?? "";
}
function xe(e, t) {
	if (e.availability === "in_call" && e.callSince) return t(`${y}in_call_since`, { time: J(e.callSince) });
	if (e.oooUntil) return t(`${y}back_on`, { date: Y(e.oooUntil) });
	if (e.expiresTs) return ye(e.expiresTs, t);
}
function X(e, t) {
	let n = [be(e, t)];
	e.availability && e.text && n.push(e.text);
	let r = xe(e, t);
	return r && n.push(r), n.filter(Boolean).join(" · ");
}
function Se({ p: e, t, className: n }) {
	let r = X(e, t);
	return e.availability ? /* @__PURE__ */ (0, q.jsx)("span", {
		className: `ps-dot ps-dot--${e.availability}${n ? ` ${n}` : ""}`,
		role: "img",
		"aria-label": r,
		title: r,
		"data-testid": "profile-status-badge"
	}) : /* @__PURE__ */ (0, q.jsx)("span", {
		className: `ps-emoji${n ? ` ${n}` : ""}`,
		role: "img",
		"aria-label": r,
		title: r,
		"data-testid": "profile-status-badge",
		children: e.emoji
	});
}
function Ce({ p: e, t, compact: n }) {
	let r = xe(e, t);
	return /* @__PURE__ */ (0, q.jsxs)("span", {
		className: `ps-status${n ? " ps-status--compact" : ""}`,
		"data-testid": "profile-status-line",
		title: X(e, t),
		children: [/* @__PURE__ */ (0, q.jsx)(Se, {
			p: e,
			t
		}), /* @__PURE__ */ (0, q.jsxs)("span", {
			className: "ps-status-text",
			children: [/* @__PURE__ */ (0, q.jsxs)("span", {
				className: "ps-status-main",
				children: [/* @__PURE__ */ (0, q.jsx)("span", {
					className: "ps-status-headline",
					children: be(e, t)
				}), e.availability && e.text && /* @__PURE__ */ (0, q.jsx)("span", {
					className: "ps-status-message",
					children: e.text
				})]
			}), r && !n && /* @__PURE__ */ (0, q.jsx)("span", {
				className: "ps-status-detail",
				children: r
			})]
		})]
	});
}
function we({ card: e, t }) {
	let n = P.filter((t) => e[t]);
	return n.length ? /* @__PURE__ */ (0, q.jsx)("dl", {
		className: "ps-card",
		"data-testid": "profile-status-card",
		children: n.map((n) => /* @__PURE__ */ (0, q.jsxs)("div", {
			className: "ps-card-row",
			children: [/* @__PURE__ */ (0, q.jsx)("dt", { children: t(`${y}${n}`) }), /* @__PURE__ */ (0, q.jsx)("dd", { children: n === "phone" ? /* @__PURE__ */ (0, q.jsx)("a", {
				href: `tel:${e.phone.replace(/[^\d+]/g, "")}`,
				children: e.phone
			}) : e[n] })]
		}, n))
	}) : null;
}
function Te(e) {
	return U(e, Date.now());
}
// src/ui/DmHeaderChip.tsx
function Ee({ t: e, store: t, userId: n, open: r }) {
	let i = Te(ve(t, n, K));
	return !n || !i ? null : /* @__PURE__ */ (0, q.jsx)("button", {
		type: "button",
		className: `ps-header-chip${i.availability === "ooo" ? " ps-header-chip--ooo" : ""}`,
		"data-testid": "profile-status-header-chip",
		"aria-label": `${e(`${y}status_and_card`)}: ${X(i, e)}`,
		onClick: () => r(n),
		children: /* @__PURE__ */ (0, q.jsx)(Ce, {
			p: i,
			t: e,
			compact: i.availability !== "ooo"
		})
	});
}
// src/ui/PersonView.tsx
function De({ t: e, store: t, userId: n, hideStatus: r, onEditStatus: i, onEditCard: a, showEmpty: o }) {
	let s = ve(t, n, K), c = Te(s), l = s?.card ?? {}, u = Object.keys(l).length > 0;
	return !c && !u && !i && !a ? o ? /* @__PURE__ */ (0, q.jsx)("p", {
		className: "ps-hint",
		children: e(`${y}no_status`)
	}) : null : /* @__PURE__ */ (0, q.jsxs)("div", {
		className: "ps-person",
		"data-testid": "profile-status-person",
		"data-user-id": n,
		children: [
			!r && c && /* @__PURE__ */ (0, q.jsx)(Ce, {
				p: c,
				t: e
			}),
			/* @__PURE__ */ (0, q.jsx)(we, {
				card: l,
				t: e
			}),
			(i || a) && /* @__PURE__ */ (0, q.jsxs)("div", {
				className: "ps-person-actions",
				children: [i && /* @__PURE__ */ (0, q.jsx)("button", {
					type: "button",
					className: "ps-button ps-button--link",
					"data-testid": "profile-status-edit-status",
					onClick: i,
					children: e("datanauten_profilestatus_menu_set_status")
				}), a && /* @__PURE__ */ (0, q.jsx)("button", {
					type: "button",
					className: "ps-button ps-button--link",
					"data-testid": "profile-status-edit-card",
					onClick: a,
					children: e("datanauten_profilestatus_menu_edit_card")
				})]
			})
		]
	});
}
function Oe(e) {
	return /* @__PURE__ */ (0, q.jsxs)("div", {
		className: "ps-dialog",
		"data-testid": "profile-status-person-dialog",
		children: [/* @__PURE__ */ (0, q.jsx)(De, {
			...e,
			showEmpty: !0
		}), /* @__PURE__ */ (0, q.jsxs)("div", {
			className: "ps-buttons",
			children: [/* @__PURE__ */ (0, q.jsx)("span", { className: "ps-spacer" }), /* @__PURE__ */ (0, q.jsx)("button", {
				type: "button",
				className: "ps-button ps-button--primary",
				onClick: e.onCancel,
				children: e.t(`${y}close`)
			})]
		})]
	});
}
// src/ui/SetStatusDialog.tsx
function ke(e) {
	let { t, initial: n, onSubmit: r, onCancel: i } = e, [a, o] = window.React.useState(n.availability), [s, c] = window.React.useState(n.text), [l, u] = window.React.useState(n.clearAfter), [d, f] = window.React.useState(n.oooUntil ?? ""), [p, m] = window.React.useState(n.autoReply), [h, g] = window.React.useState(n.autoReplyText), [_, v] = window.React.useState(n.callStatus), [b, x] = window.React.useState(null), [S, C] = window.React.useState(!1), w = window.React.useRef(null);
	window.React.useEffect(() => w.current?.focus(), []);
	let T = a === "ooo", E = I(s.trim()) > 256, D = oe(Date.now() + 864e5), O = async (e, n) => {
		C(!0), x(null);
		try {
			await e(), n ? r(n) : i();
		} catch (e) {
			x(t(`${y}failed`, { error: e instanceof Error ? e.message : String(e) })), C(!1);
		}
	};
	return e.supported ? /* @__PURE__ */ (0, q.jsxs)("form", {
		className: "ps-dialog",
		onSubmit: (n) => {
			if (n.preventDefault(), E) return;
			if (T && d && d < D) {
				x(t(`${y}past_date`));
				return;
			}
			let r = {
				availability: a,
				text: s.trim(),
				clearAfter: l,
				oooUntil: T && d ? d : void 0,
				autoReply: p,
				autoReplyText: h.trim(),
				callStatus: _
			};
			O(() => e.submit(r), r);
		},
		"data-testid": "profile-status-dialog",
		children: [
			/* @__PURE__ */ (0, q.jsxs)("fieldset", {
				className: "ps-fieldset",
				children: [/* @__PURE__ */ (0, q.jsx)("legend", {
					className: "ps-label",
					children: t(`${y}availability`)
				}), /* @__PURE__ */ (0, q.jsx)("div", {
					className: "ps-availabilities",
					role: "radiogroup",
					"aria-label": t(`${y}availability`),
					children: M.map((e) => /* @__PURE__ */ (0, q.jsxs)("button", {
						type: "button",
						role: "radio",
						"aria-checked": a === e,
						className: "ps-availability",
						"data-testid": `profile-status-avail-${e}`,
						onClick: () => o(e),
						children: [/* @__PURE__ */ (0, q.jsx)("span", {
							className: `ps-dot ps-dot--${e}`,
							"aria-hidden": "true"
						}), t(`${y}avail_${e}`)]
					}, e))
				})]
			}),
			/* @__PURE__ */ (0, q.jsx)("label", {
				className: "ps-label",
				htmlFor: "ps-text",
				children: t(`${y}message`)
			}),
			/* @__PURE__ */ (0, q.jsx)("input", {
				id: "ps-text",
				ref: w,
				className: "ps-input",
				"data-testid": "profile-status-text",
				value: s,
				size: 30,
				placeholder: t(`${y}message_placeholder`),
				"aria-invalid": E,
				onChange: (e) => c(e.target.value)
			}),
			E && /* @__PURE__ */ (0, q.jsx)("p", {
				className: "ps-error",
				children: t("datanauten_profilestatus_too_long")
			}),
			T ? /* @__PURE__ */ (0, q.jsxs)(q.Fragment, { children: [
				/* @__PURE__ */ (0, q.jsx)("label", {
					className: "ps-label",
					htmlFor: "ps-ooo-until",
					children: t(`${y}ooo_until`)
				}),
				/* @__PURE__ */ (0, q.jsx)("input", {
					id: "ps-ooo-until",
					type: "date",
					className: "ps-input",
					"data-testid": "profile-status-ooo-until",
					min: D,
					value: d,
					onChange: (e) => f(e.target.value)
				}),
				e.canAutoReply && /* @__PURE__ */ (0, q.jsxs)(q.Fragment, { children: [/* @__PURE__ */ (0, q.jsxs)("label", {
					className: "ps-check",
					children: [/* @__PURE__ */ (0, q.jsx)("input", {
						type: "checkbox",
						"data-testid": "profile-status-auto-reply",
						checked: p,
						onChange: (e) => m(e.target.checked)
					}), /* @__PURE__ */ (0, q.jsxs)("span", { children: [t("datanauten_profilestatus_auto_reply"), /* @__PURE__ */ (0, q.jsx)("small", {
						className: "ps-hint",
						children: t("datanauten_profilestatus_auto_reply_hint")
					})] })]
				}), p && /* @__PURE__ */ (0, q.jsx)("textarea", {
					className: "ps-input ps-textarea",
					"aria-label": t("datanauten_profilestatus_auto_reply_text"),
					"data-testid": "profile-status-auto-reply-text",
					value: h,
					placeholder: e.defaultReply(d || void 0),
					onChange: (e) => g(e.target.value)
				})] })
			] }) : /* @__PURE__ */ (0, q.jsxs)("fieldset", {
				className: "ps-fieldset",
				children: [/* @__PURE__ */ (0, q.jsx)("legend", {
					className: "ps-label",
					children: t(`${y}clear_after`)
				}), /* @__PURE__ */ (0, q.jsx)("div", {
					className: "ps-segmented",
					role: "radiogroup",
					"aria-label": t(`${y}clear_after`),
					children: le.map((e) => /* @__PURE__ */ (0, q.jsx)("button", {
						type: "button",
						role: "radio",
						"aria-checked": l === e,
						className: "ps-segment",
						"data-testid": `profile-status-clear-${e}`,
						onClick: () => u(e),
						children: t(`${y}clear_${e}`)
					}, e))
				})]
			}),
			e.canCallStatus && /* @__PURE__ */ (0, q.jsxs)("label", {
				className: "ps-check",
				children: [/* @__PURE__ */ (0, q.jsx)("input", {
					type: "checkbox",
					checked: _,
					onChange: (e) => v(e.target.checked)
				}), /* @__PURE__ */ (0, q.jsx)("span", { children: t("datanauten_profilestatus_call_status") })]
			}),
			/* @__PURE__ */ (0, q.jsx)("p", {
				className: "ps-hint",
				children: t(`${y}public_hint`)
			}),
			b && /* @__PURE__ */ (0, q.jsx)("p", {
				className: "ps-error",
				children: b
			}),
			/* @__PURE__ */ (0, q.jsxs)("div", {
				className: "ps-buttons",
				children: [
					/* @__PURE__ */ (0, q.jsx)("button", {
						type: "button",
						className: "ps-button ps-button--link",
						"data-testid": "profile-status-clear",
						disabled: S,
						onClick: () => void O(e.clear),
						children: t(`${y}clear`)
					}),
					/* @__PURE__ */ (0, q.jsx)("span", { className: "ps-spacer" }),
					/* @__PURE__ */ (0, q.jsx)("button", {
						type: "button",
						className: "ps-button",
						disabled: S,
						onClick: i,
						children: t(`${y}cancel`)
					}),
					/* @__PURE__ */ (0, q.jsx)("button", {
						type: "submit",
						className: "ps-button ps-button--primary",
						"data-testid": "profile-status-save",
						disabled: S || E,
						children: t(`${y}save`)
					})
				]
			})
		]
	}) : /* @__PURE__ */ (0, q.jsxs)("div", {
		className: "ps-dialog",
		"data-testid": "profile-status-dialog",
		children: [/* @__PURE__ */ (0, q.jsx)("p", {
			className: "ps-error",
			children: t(`${y}no_support`)
		}), /* @__PURE__ */ (0, q.jsx)("div", {
			className: "ps-buttons",
			children: /* @__PURE__ */ (0, q.jsx)("button", {
				type: "button",
				className: "ps-button ps-button--primary",
				onClick: i,
				children: t(`${y}close`)
			})
		})]
	});
}
// src/ui/styles.css?inline
var Ae = ".ps-dot{box-sizing:border-box;vertical-align:middle;background:var(--cpd-color-icon-tertiary,#8d97a5);border-radius:50%;flex:none;width:10px;height:10px;display:inline-block}.ps-dot--available{background:var(--cpd-color-icon-success-primary,#0b6b3f)}.ps-dot--busy,.ps-dot--in_call{background:var(--cpd-color-icon-critical-primary,#d51928)}.ps-dot--dnd{background:linear-gradient(var(--cpd-color-bg-canvas-default,#fff), var(--cpd-color-bg-canvas-default,#fff)) center / 6px 2px no-repeat, var(--cpd-color-icon-critical-primary,#d51928)}.ps-dot--brb,.ps-dot--away{background:#e5a500}.ps-dot--ooo{background:#8f5bd4}.ps-dot--none{border:1.5px solid var(--cpd-color-icon-tertiary,#8d97a5);background:0 0}.ps-emoji{font-size:.95em;line-height:1}.ps-inline{cursor:default;align-items:center;margin-inline:4px;display:inline-flex}.ps-trigger-badge{background:var(--cpd-color-bg-canvas-default,#fff);pointer-events:none;border-radius:50%;padding:2px;line-height:1;display:flex;position:absolute;bottom:-1px;right:-1px}.mx_UserMenu button>div:has(>.ps-trigger-badge){position:relative}.ps-menu-icon{flex:none;justify-content:center;align-items:center;width:24px;height:24px;display:inline-flex}.ps-menu-item--status [role=img],.ps-menu-item--status .ps-dot{width:12px;height:12px}.ps-status{min-width:0;max-width:100%;color:var(--cpd-color-text-primary,#1b1d22);align-items:center;gap:8px;font-size:14px;line-height:1.35;display:inline-flex}.ps-status-text{flex-direction:column;min-width:0;display:flex}.ps-status-main{flex-wrap:wrap;align-items:baseline;gap:0 6px;min-width:0;display:flex}.ps-status-headline{font-weight:600}.ps-status-message{overflow-wrap:anywhere}.ps-status-message:before{content:\"· \";color:var(--cpd-color-text-secondary,#656d77)}.ps-status-detail{color:var(--cpd-color-text-secondary,#656d77);font-size:12px}.ps-status--compact .ps-status-main{white-space:nowrap;flex-wrap:nowrap;overflow:hidden}.ps-status--compact .ps-status-message{text-overflow:ellipsis;overflow:hidden}.ps-header-chip{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);background:var(--cpd-color-bg-canvas-default,#fff);cursor:pointer;min-width:0;max-width:200px;font:inherit;border-radius:999px;flex-shrink:1;align-items:center;margin-inline-end:4px;padding:4px 10px;display:inline-flex}.ps-header-chip:hover{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}.ps-header-chip .ps-status{font-size:13px}.ps-header-chip--ooo{border-color:#8f5bd4}.ps-userinfo{width:100%;margin-top:8px}.ps-person{text-align:center;flex-direction:column;align-items:center;gap:10px;display:flex}.ps-person .ps-status-main{justify-content:center}.ps-card{text-align:start;background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);border-radius:8px;gap:4px;margin:0;padding:10px 12px;font-size:13px;display:grid}.ps-card-row{grid-template-columns:max-content 1fr;gap:12px;display:grid}.ps-card dt{color:var(--cpd-color-text-secondary,#656d77)}.ps-card dd{color:var(--cpd-color-text-primary,#1b1d22);overflow-wrap:anywhere;margin:0}.ps-card a{color:var(--cpd-color-text-link-external,#0467dd)}.ps-person-actions{flex-wrap:wrap;justify-content:center;gap:4px 12px;display:flex}.ps-dialog{flex-direction:column;gap:12px;width:min(480px,86vw);display:flex}.ps-dialog .ps-person{text-align:start;align-items:flex-start}.ps-dialog .ps-person .ps-status-main{justify-content:flex-start}.ps-label{color:var(--cpd-color-text-secondary,#656d77);padding:0;font-size:13px;font-weight:600}.ps-locked{font-weight:400}.ps-field{flex-direction:column;gap:6px;display:flex}.ps-fieldset{border:0;flex-direction:column;gap:8px;margin:0;padding:0;display:flex}.ps-availabilities{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;display:grid}.ps-availability{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;text-align:start;cursor:pointer;background:0 0;border-radius:8px;align-items:center;gap:10px;padding:8px 12px;font-size:14px;display:flex}.ps-availability[aria-checked=true]{border-color:var(--cpd-color-border-interactive-primary,#1b1d22);box-shadow:inset 0 0 0 1px var(--cpd-color-border-interactive-primary,#1b1d22);font-weight:600}.ps-input{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;border-radius:8px;padding:8px 12px;font-size:15px}.ps-input:disabled{border-color:var(--cpd-color-border-disabled,#e1e6ec);color:var(--cpd-color-text-secondary,#656d77)}.ps-input[aria-invalid=true]{border-color:var(--cpd-color-border-critical-primary,#d51928)}.ps-textarea{resize:vertical;min-height:60px}.ps-segmented{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);border-radius:10px;display:flex;overflow:hidden}.ps-segment{border:0;border-right:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;background:0 0;flex:1;padding:8px 6px;font-size:14px}.ps-segment:last-child{border-right:0}.ps-segment[aria-checked=true]{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);font-weight:600}.ps-check{color:var(--cpd-color-text-primary,#1b1d22);align-items:flex-start;gap:8px;font-size:14px;display:flex}.ps-check input{margin-top:3px}.ps-check small{display:block}.ps-hint{color:var(--cpd-color-text-secondary,#656d77);margin:0;font-size:12px}.ps-error{color:var(--cpd-color-text-critical-primary,#d51928);margin:0;font-size:13px}.ps-buttons{align-items:center;gap:8px;display:flex}.ps-spacer{flex:1}.ps-button{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;background:0 0;border-radius:999px;padding:7px 16px;font-size:14px;font-weight:600}.ps-button--primary{border-color:var(--cpd-color-bg-action-primary-rest,#1b1d22);background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff)}.ps-button--link{color:var(--cpd-color-text-action-accent,#0b6b3f);border:0;padding:4px 0}.ps-button:disabled{opacity:.5;cursor:default}", Z = "[profile-status]", je = "de-datanauten-profile-status-style", Me = "de.datanauten.profile_status", Ne = class {
	api;
	static moduleApiVersion = "^2.0.0";
	store = new me({ client: t });
	calls;
	replier;
	dom = new w(() => this.decorate());
	roots = /* @__PURE__ */ new Map();
	started;
	startTimer;
	expiryTimer;
	settings;
	config = {};
	constructor(e) {
		this.api = e, this.calls = new h({
			store: m,
			enabled: () => !this.elementOwnsStatus() && this.getSettings().call_status !== !1 && this.store.supported,
			write: (e) => this.writeCall(e)
		}), this.replier = new u({
			client: t,
			settings: () => this.getSettings(),
			saveSettings: (e) => this.updateSettings(e),
			ooo: () => {
				let e = this.me(), t = e ? U(this.store.get(e), Date.now()) : void 0;
				return {
					active: t?.availability === "ooo",
					until: t?.oooUntil
				};
			},
			message: (e) => this.getSettings().auto_reply_text?.trim() || this.defaultReply(e),
			allowed: () => this.config.auto_reply !== !1
		});
	}
	async load() {
		this.api.i18n.register(b), Re(), this.config = Le(this.api), this.api.extras.addRoomHeaderButtonCallback((e) => {
			this.start();
			let n = t(), i = n ? r(n, e) : void 0;
			return /* @__PURE__ */ (0, q.jsx)(Ee, {
				t: this.t,
				store: this.store,
				userId: i,
				open: this.openPerson
			}, "profile-status");
		}), this.store.subscribe(this.onProfileChanged), this.dom.start(), this.api.client.waitForClientStarted?.().then(() => this.start()), this.startTimer = setInterval(() => {
			this.start(), this.started && this.calls.attach() && this.startTimer && clearInterval(this.startTimer);
		}, 2e3);
	}
	dispose() {
		this.dom.stop(), this.calls.detach(), this.replier.detach(), this.store.dispose(), this.startTimer && clearInterval(this.startTimer), this.expiryTimer && clearTimeout(this.expiryTimer), this.roots.forEach((e) => e.unmount()), this.roots.clear();
	}
	start() {
		let e = t();
		if (e && this.started !== e && (!e.isInitialSyncComplete || e.isInitialSyncComplete())) {
			if (!n(e)) console.warn(`${Z} This Element's matrix-js-sdk has no extended profile API; the module is off`), this.store.supported = !1, this.started = e;
			else {
				try {
					this.settings = this.api.client.accountData.get(s), this.settings.watch(() => this.dom.schedule());
				} catch {
					return;
				}
				this.started = e, (async () => {
					let t = await e.doesServerSupportExtendedProfiles?.().catch(() => !1) ?? !0;
					if (this.store.supported = t, !t) {
						console.info(`${Z} The homeserver has no extended profiles (MSC4133); statuses are off`);
						return;
					}
					let n = e.getUserId(), r = n ? await this.store.refresh(n) : void 0;
					this.calls.attach(), await this.calls.cleanUp(r?.callSince), this.replier.attach(e);
				})();
			}
		}
	}
	me() {
		return t()?.getUserId() ?? void 0;
	}
	elementOwnsStatus() {
		try {
			return this.api.settings?.getValue?.("feature_user_status") === !0;
		} catch {
			return !1;
		}
	}
	onProfileChanged = (e) => {
		this.dom.schedule(), e === this.me() && this.scheduleExpiry();
	};
	scheduleExpiry() {
		this.expiryTimer && clearTimeout(this.expiryTimer);
		let e = this.me(), t = e ? this.store.get(e)?.status?.expiresTs : void 0;
		if (!e || t === void 0) return;
		let n = Math.max(0, Math.min(t - Date.now(), 2 ** 31 - 1));
		this.expiryTimer = setTimeout(() => void this.expireOwnStatus(e, t), n);
	}
	async expireOwnStatus(e, t) {
		if (Date.now() < t) return this.scheduleExpiry();
		let n = await this.store.refresh(e);
		if (n?.status?.expiresTs === t) try {
			await this.deleteField(D), this.store.set(e, {
				...n,
				status: void 0
			});
		} catch (e) {
			console.warn(`${Z} Clearing the expired status failed`, e);
		}
	}
	client() {
		let e = t();
		if (!e || !n(e)) throw Error("Not logged in");
		return e;
	}
	async deleteField(e) {
		try {
			await this.client().deleteExtendedProfileProperty(e);
		} catch (e) {
			if (e.httpStatus !== 404) throw e;
		}
	}
	async writeCall(e) {
		let t = this.me();
		e ? await this.client().setExtendedProfileProperty(O, { call_joined_ts: Math.floor(Date.now() / 1e3) }) : await this.deleteField(O), t && this.store.set(t, {
			...this.ownInfo(),
			callSince: e ? Date.now() : void 0
		});
	}
	ownInfo() {
		let e = this.me();
		return e && this.store.get(e) || { card: {} };
	}
	saveStatus = async (e) => {
		let t = this.me(), n;
		try {
			n = de(e, {
				availability: (e) => this.t(`${y}avail_${e}`),
				oooBack: (e) => this.t(`${y}ooo_back`, { date: Y(e) })
			}, /* @__PURE__ */ new Date());
		} catch (e) {
			throw e instanceof W ? Error(this.t(e.message === "past_date" ? `${y}past_date` : `${y}too_long`)) : e;
		}
		n ? await this.client().setExtendedProfileProperty(D, n) : await this.deleteField(D), t && this.store.set(t, {
			...this.ownInfo(),
			status: n ? B(n) : void 0
		});
		let r = this.getSettings(), i = {};
		!!r.auto_reply !== e.autoReply && (i.auto_reply = e.autoReply), (r.auto_reply_text ?? "") !== e.autoReplyText && (i.auto_reply_text = e.autoReplyText), r.call_status !== !1 !== e.callStatus && (i.call_status = e.callStatus), Object.keys(i).length && await this.updateSettings(i), !e.callStatus && this.ownInfo().callSince && !this.elementOwnsStatus() && await this.writeCall(!1);
	};
	clearStatus = async () => {
		await this.deleteField(D);
		let e = this.me();
		e && this.store.set(e, {
			...this.ownInfo(),
			status: void 0
		});
	};
	saveCard = async (e) => {
		let t = this.client();
		for (let n of this.editableFields()) {
			let r = e[n]?.trim();
			r ? await t.setExtendedProfileProperty(F[n], r) : await this.deleteField(F[n]);
		}
		let n = this.me();
		n && await this.store.refresh(n);
	};
	openSetStatus = () => {
		this.start();
		let e = this.me(), t = e ? this.store.get(e) : void 0, n = this.getSettings(), r = t?.status && U({
			card: {},
			status: t.status
		}, Date.now()) ? t.status : void 0;
		this.api.openDialog({ title: this.t(`${y}dialog_title`) }, ke, {
			t: this.t,
			initial: {
				...fe(r),
				autoReply: !!n.auto_reply,
				autoReplyText: n.auto_reply_text ?? "",
				callStatus: n.call_status !== !1
			},
			canAutoReply: this.config.auto_reply !== !1,
			canCallStatus: !!m() && !this.elementOwnsStatus(),
			supported: this.store.supported,
			defaultReply: (e) => this.defaultReply(e),
			submit: this.saveStatus,
			clear: this.clearStatus
		}), e && this.store.refresh(e);
	};
	openCard = async () => {
		this.start();
		let e = this.me(), t = e ? await this.store.refresh(e) : void 0;
		this.api.openDialog({ title: this.t(`${y}card_title`) }, ge, {
			t: this.t,
			initial: t?.card ?? {},
			editable: this.editableFields(),
			submit: this.saveCard
		});
	};
	openPerson = (e) => {
		let n = t()?.getRooms?.().map((t) => t.getMember(e)?.name).find(Boolean) ?? e;
		this.api.openDialog({ title: n }, Oe, {
			t: this.t,
			store: this.store,
			userId: e
		});
	};
	decorate() {
		for (let [e, t] of this.roots) e.isConnected || (t.unmount(), this.roots.delete(e));
		let e = t();
		if (!e || !this.started || !this.store.supported) return;
		let n = this.elementOwnsStatus();
		C(document, {
			userMenu: (e, t) => this.decorateUserMenu(e, t),
			userMenuTrigger: (e) => !n && this.decorateTrigger(e),
			userInfo: (e, t, r) => this.decorateUserInfo(e, t, r, n),
			inline: (t, n, r) => this.decorateInline(e, t, n, r)
		}, {
			timeline: this.config.timeline !== !1 && !n,
			memberList: this.config.member_list !== !1 && !n,
			eventSender: (t) => Fe(e, t)?.getSender()
		});
	}
	decorateUserMenu(e, t) {
		let n = this.me(), r = n ? U(this.store.request(n), Date.now()) : void 0, i = document.createElement("span");
		i.className = "ps-menu-icon";
		let a = this.api.createRoot(i);
		this.roots.set(i, a), a.render(r ? /* @__PURE__ */ (0, q.jsx)(Se, {
			p: r,
			t: this.t
		}) : /* @__PURE__ */ (0, q.jsx)("span", { className: "ps-dot ps-dot--none" }));
		let o = this.menuItem(t, r ? X(r, this.t) : this.t(`${y}menu_set_status`), "ps-menu-item--status", i, this.openSetStatus), s = this.menuItem(t, this.t(`${y}menu_edit_card`), "ps-menu-item--card", Pe, () => void this.openCard()), c = t ?? e.lastElementChild;
		c?.parentElement ? (c.parentElement.insertBefore(o, c), c.parentElement.insertBefore(s, c)) : e.append(o, s);
	}
	menuItem(e, t, n, r, i) {
		let a;
		if (e) {
			a = e.cloneNode(!0);
			let n = a.querySelector("svg");
			n && typeof r == "string" ? n.innerHTML = r : n && typeof r != "string" && n.replaceWith(r), a.querySelectorAll("svg ~ svg").forEach((e) => e.remove());
			let i = [...a.querySelectorAll("span, div")].find((e) => e.children.length === 0 && e.textContent?.trim());
			i ? i.textContent = t : a.textContent = t, a.removeAttribute("id"), a.removeAttribute("data-highlighted");
		} else a = document.createElement("button"), a.setAttribute("role", "menuitem"), a.textContent = t;
		return a.classList.add("ps-menu-item", n), a.setAttribute("data-testid", n.replace("ps-menu-item--", "profile-status-menu-")), a.setAttribute("title", t), a.addEventListener("click", (e) => {
			e.preventDefault(), e.stopPropagation(), Ie(a), i();
		}), a;
	}
	decorateTrigger(e) {
		let t = this.me(), n = t ? U(this.store.request(t), Date.now()) : void 0, r = e.querySelector(":scope > .ps-trigger-badge, .ps-trigger-badge");
		n ? (r || (r = document.createElement("span"), r.className = "ps-trigger-badge", (e.firstElementChild ?? e).appendChild(r)), Q(r, n, this.t)) : r?.remove();
	}
	decorateUserInfo(e, t, n, r) {
		let i = e.querySelector(":scope > .ps-userinfo") ?? e.querySelector(".ps-userinfo");
		if (i?.dataset.userId === n) return;
		i || (i = document.createElement("div"), i.className = "ps-userinfo", t.insertAdjacentElement("afterend", i)), i.dataset.userId = n;
		let a = this.roots.get(i);
		a || (a = this.api.createRoot(i), this.roots.set(i, a));
		let o = n === this.me();
		a.render(/* @__PURE__ */ (0, q.jsx)(De, {
			t: this.t,
			store: this.store,
			userId: n,
			hideStatus: r,
			onEditStatus: o ? this.openSetStatus : void 0,
			onEditCard: o ? () => void this.openCard() : void 0
		}, n));
	}
	decorateInline(e, t, n, r) {
		let i = t.querySelector(`.${S}`), a = U(this.store.request(n), Date.now());
		if (a && r) {
			let t = $(e, r)?.getMember(n)?.membership;
			t && t !== "join" && (a = void 0);
		}
		if (!a) i?.remove();
		else {
			if (!i) {
				i = document.createElement("span"), i.className = S;
				let e = t.firstElementChild;
				e ? e.insertAdjacentElement("afterend", i) : t.appendChild(i);
			}
			i.dataset.userId = n, Q(i, a, this.t);
		}
	}
	getSettings() {
		let e = this.settings?.value;
		return e && typeof e == "object" ? e : {};
	}
	async updateSettings(e) {
		await this.api.client.accountData.set(s, {
			...this.getSettings(),
			...e
		});
	}
	editableFields() {
		let e = this.config.editable_fields;
		return Array.isArray(e) ? P.filter((t) => e.includes(t)) : [...P];
	}
	defaultReply(e) {
		return e ? this.t(`${y}auto_reply_default_until`, { date: Y(e) }) : this.t(`${y}auto_reply_default`);
	}
	t = (e, t) => this.api.i18n.translate(e, t);
}, Pe = "<path d=\"M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v12h16V6H4Zm2 9.5c0-1.4 1.8-2.5 3-2.5s3 1.1 3 2.5V16H6v-.5ZM9 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm5 1h4v2h-4V9Zm0 4h4v2h-4v-2Z\"/>";
function Q(e, t, n) {
	let r = X(t, n), i = t.availability ? `ps-dot ps-dot--${t.availability}` : "ps-emoji", a = t.availability ? "" : t.emoji, o = e.firstElementChild;
	o || (o = document.createElement("span"), o.setAttribute("role", "img"), o.setAttribute("data-testid", "profile-status-badge"), e.appendChild(o)), o.className !== i && (o.className = i), o.textContent !== a && (o.textContent = a), o.getAttribute("aria-label") !== r && (o.setAttribute("aria-label", r), e.title = r), e.dataset.availability = t.availability ?? "";
}
function Fe(e, t) {
	return $(e, t)?.findEventById?.(t);
}
function $(e, t) {
	let n = /^#\/room\/(![^/?]+)/.exec(window.location.hash)?.[1], r = n ? e.getRoom(decodeURIComponent(n)) : null;
	return r?.findEventById?.(t) ? r : e.getRooms?.().find((e) => e.findEventById?.(t)) ?? null;
}
function Ie(e) {
	e.closest("[role=\"menu\"]")?.dispatchEvent(new KeyboardEvent("keydown", {
		key: "Escape",
		bubbles: !0,
		cancelable: !0
	}));
}
function Le(e) {
	try {
		let t = e.config.get()[Me];
		return t && typeof t == "object" ? t : {};
	} catch {
		return {};
	}
}
function Re() {
	if (document.getElementById(je)) return;
	let e = document.createElement("style");
	e.id = je, e.textContent = Ae, document.head.appendChild(e);
}
export { Me as CONFIG_KEY, Ne as ProfileStatusModule, Ne as default, Q as renderInlineBadge };

//# sourceMappingURL=index.js.map