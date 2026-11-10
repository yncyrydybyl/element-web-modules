/*! @datanauten/element-web-module-teamwork 0.1.1 */
// \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), t = "tw-save-button", n = "[role=toolbar].mx_MessageActionBar", r = class {
	options;
	observer;
	constructor(e) {
		this.options = e;
	}
	start(e = document.body) {
		this.observer = new MutationObserver((e) => {
			for (let t of e) for (let e of t.addedNodes) e instanceof Element && this.scan(e);
		}), this.observer.observe(e, {
			childList: !0,
			subtree: !0
		}), (e instanceof Element || e instanceof Document) && this.scan(e);
	}
	stop() {
		this.observer?.disconnect(), document.querySelectorAll(`.${t}`).forEach((e) => e.remove());
	}
	refresh() {
		document.querySelectorAll(`.${t}`).forEach((e) => this.paint(e));
	}
	scan(e) {
		let t = e instanceof Element && e.matches(n) ? [e] : [];
		if (t.push(...e.querySelectorAll(n)), e instanceof Element && !t.length) {
			let r = e.closest(n);
			r && t.push(r);
		}
		for (let e of t) this.decorate(e);
	}
	decorate(e) {
		if (e.querySelector(".tw-save-button")) return;
		let n = e.closest("[data-event-id]")?.getAttribute("data-event-id"), r = [...e.querySelectorAll("button, [role=button]")].find((e) => e.getAttribute("aria-label") === this.options.optionsLabel());
		if (!n?.startsWith("$") || !r) return;
		let i = document.createElement("button");
		i.className = `${r.className} ${t}`;
		for (let e of [
			"data-kind",
			"data-presentation",
			"data-size"
		]) {
			let t = r.getAttribute(e);
			t && i.setAttribute(e, t);
		}
		i.type = "button", i.tabIndex = -1, i.dataset.eventId = n, i.addEventListener("click", (e) => {
			e.preventDefault(), e.stopPropagation(), this.options.onClick(n);
		}), this.paint(i), r.before(i);
	}
	paint(e) {
		let t = this.options.isSaved(e.dataset.eventId ?? ""), n = this.options.label(t);
		e.setAttribute("aria-label", n), e.setAttribute("aria-pressed", String(t)), e.title = n, e.innerHTML = t ? a : i;
	}
}, i = "<svg aria-hidden=\"true\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 3h12a1 1 0 0 1 1 1v17.2a.5.5 0 0 1-.8.4L12 17l-6.2 4.6a.5.5 0 0 1-.8-.4V4a1 1 0 0 1 1-1Zm1 2v13.2l5-3.7 5 3.7V5H7Z\"/></svg>", a = "<svg aria-hidden=\"true\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M6 3h12a1 1 0 0 1 1 1v17.2a.5.5 0 0 1-.8.4L12 17l-6.2 4.6a.5.5 0 0 1-.8-.4V4a1 1 0 0 1 1-1Z\"/></svg>";
// src/client.ts
function o() {
	let e = window.mxMatrixClientPeg;
	try {
		return e?.get?.() ?? void 0;
	} catch {
		return;
	}
}
function s(e, t, n = window.location.hash) {
	let r = c(e, n);
	return r && e.getRoom(r)?.findEventById(t) ? r : e.getRooms().find((e) => e.findEventById(t))?.roomId;
}
function c(e, t) {
	let n = /^#\/room\/([^/?]+)/.exec(t);
	if (!n) return null;
	let r = decodeURIComponent(n[1]);
	return r.startsWith("!") ? r : e?.getRooms().find((e) => e.getCanonicalAlias() === r)?.roomId ?? null;
}
function l(e, t) {
	window.location.hash = `#/room/${encodeURIComponent(e)}/${encodeURIComponent(t)}`;
}
// src/composer.ts
var u = [".mx_BasicMessageComposer_input", ".mx_WysiwygComposer_Editor_content"], d = {
	room: u.map((e) => `.mx_RoomView_body .mx_MessageComposer ${e}`).join(", "),
	thread: u.map((e) => `.mx_ThreadView .mx_MessageComposer ${e}`).join(", ")
};
function f(e) {
	return document.querySelector(d[e]);
}
function p(e) {
	return f(e)?.innerText.replace(/ /g, " ").trim() ?? "";
}
async function m(e) {
	let t = f(e);
	if (!t || !t.innerText.trim()) return;
	t.focus();
	let n = document.createRange();
	n.selectNodeContents(t);
	let r = document.getSelection();
	r?.removeAllRanges(), r?.addRange(n), await new Promise((e) => setTimeout(e, 50)), document.execCommand("delete");
}
// src/i18n.ts
var h = "datanauten_teamwork_", g = {
	[`${h}menu_schedule`]: {
		en: "Send later",
		de: "Später senden"
	},
	[`${h}menu_priority`]: {
		en: "Important or urgent",
		de: "Wichtig oder dringend"
	},
	[`${h}menu_praise`]: {
		en: "Praise",
		de: "Lob"
	},
	[`${h}compose_title`]: {
		en: "Message options",
		de: "Nachrichtenoptionen"
	},
	[`${h}message`]: {
		en: "Message",
		de: "Nachricht"
	},
	[`${h}delivery`]: {
		en: "Delivery",
		de: "Zustellung"
	},
	[`${h}standard`]: {
		en: "Standard",
		de: "Normal"
	},
	[`${h}important`]: {
		en: "Important",
		de: "Wichtig"
	},
	[`${h}urgent`]: {
		en: "Urgent",
		de: "Dringend"
	},
	[`${h}urgent_hint`]: {
		en: "Recipients get a loud notification and a reminder every 2 minutes for 20 minutes until they read it, if they want to.",
		de: "Empfänger bekommen eine laute Benachrichtigung und, wenn sie wollen, 20 Minuten lang alle 2 Minuten eine Erinnerung, bis sie sie lesen."
	},
	[`${h}urgent_notify`]: {
		en: "Notify",
		de: "Benachrichtigen"
	},
	[`${h}urgent_notify_hint`]: {
		en: "They are mentioned, so every client notifies them, even in rooms set to mentions only.",
		de: "Sie werden erwähnt, damit jede App sie benachrichtigt, auch in Räumen mit „Nur Erwähnungen“."
	},
	[`${h}when`]: {
		en: "When",
		de: "Wann"
	},
	[`${h}now`]: {
		en: "Now",
		de: "Jetzt"
	},
	[`${h}in_one_hour`]: {
		en: "In an hour",
		de: "In einer Stunde"
	},
	[`${h}tomorrow_morning`]: {
		en: "Tomorrow 9:00",
		de: "Morgen 9:00"
	},
	[`${h}monday_morning`]: {
		en: "Monday 9:00",
		de: "Montag 9:00"
	},
	[`${h}custom_time`]: {
		en: "Pick a time",
		de: "Zeit wählen"
	},
	[`${h}server_holds`]: {
		en: "Your homeserver sends it, end-to-end encrypted, even if all your devices are off.",
		de: "Dein Homeserver sendet sie Ende-zu-Ende-verschlüsselt, auch wenn alle deine Geräte aus sind."
	},
	[`${h}no_scheduling`]: {
		en: "Your homeserver doesn't support scheduled messages (MSC4140).",
		de: "Dein Homeserver unterstützt keine geplanten Nachrichten (MSC4140)."
	},
	[`${h}no_crypto`]: {
		en: "This room is encrypted and the message couldn't be encrypted for scheduling, so it wasn't scheduled.",
		de: "Dieser Raum ist verschlüsselt, und die Nachricht konnte zum Planen nicht verschlüsselt werden. Sie wurde nicht geplant."
	},
	[`${h}too_far`]: {
		en: "Your homeserver allows at most %(max)s ahead.",
		de: "Dein Homeserver erlaubt höchstens %(max)s im Voraus."
	},
	[`${h}in_past`]: {
		en: "Pick a time in the future.",
		de: "Wähle eine Zeit in der Zukunft."
	},
	[`${h}send`]: {
		en: "Send",
		de: "Senden"
	},
	[`${h}schedule`]: {
		en: "Schedule",
		de: "Planen"
	},
	[`${h}cancel`]: {
		en: "Cancel",
		de: "Abbrechen"
	},
	[`${h}failed`]: {
		en: "Couldn't send: %(error)s",
		de: "Senden fehlgeschlagen: %(error)s"
	},
	[`${h}scheduled_button`]: {
		en: "Scheduled messages",
		de: "Geplante Nachrichten"
	},
	[`${h}scheduled_title`]: {
		en: "Scheduled messages",
		de: "Geplante Nachrichten"
	},
	[`${h}scheduled_empty`]: {
		en: "Nothing scheduled.",
		de: "Nichts geplant."
	},
	[`${h}scheduled_at`]: {
		en: "Sends %(when)s",
		de: "Wird %(when)s gesendet"
	},
	[`${h}encrypted_preview`]: {
		en: "🔒 Encrypted, scheduled on another device",
		de: "🔒 Verschlüsselt, auf einem anderen Gerät geplant"
	},
	[`${h}send_now`]: {
		en: "Send now",
		de: "Jetzt senden"
	},
	[`${h}unschedule`]: {
		en: "Delete",
		de: "Löschen"
	},
	[`${h}all_devices`]: {
		en: "Held by your homeserver: you see the same list on every device.",
		de: "Liegt auf deinem Homeserver: Du siehst dieselbe Liste auf jedem Gerät."
	},
	[`${h}save`]: {
		en: "Save message",
		de: "Nachricht merken"
	},
	[`${h}unsave`]: {
		en: "Remove from saved",
		de: "Aus Gemerkten entfernen"
	},
	[`${h}saved_button`]: {
		en: "Saved messages",
		de: "Gemerkte Nachrichten"
	},
	[`${h}saved_title`]: {
		en: "Saved messages",
		de: "Gemerkte Nachrichten"
	},
	[`${h}saved_empty`]: {
		en: "Save a message with the bookmark in its toolbar. Your list follows you to every device.",
		de: "Merke dir eine Nachricht mit dem Lesezeichen in ihrer Werkzeugleiste. Die Liste ist auf allen deinen Geräten da."
	},
	[`${h}saved_privacy`]: {
		en: "Only references are stored in your account; the messages stay encrypted in their rooms.",
		de: "In deinem Konto liegen nur Verweise; die Nachrichten bleiben verschlüsselt in ihren Räumen."
	},
	[`${h}redacted`]: {
		en: "Message deleted",
		de: "Nachricht gelöscht"
	},
	[`${h}unavailable`]: {
		en: "Message not available",
		de: "Nachricht nicht verfügbar"
	},
	[`${h}open`]: {
		en: "Open",
		de: "Öffnen"
	},
	[`${h}loading`]: {
		en: "Loading …",
		de: "Lädt …"
	},
	[`${h}praise_title`]: {
		en: "Praise someone",
		de: "Jemanden loben"
	},
	[`${h}praise_who`]: {
		en: "Who",
		de: "Wen"
	},
	[`${h}praise_badge`]: {
		en: "Badge",
		de: "Abzeichen"
	},
	[`${h}praise_note`]: {
		en: "Add a note (optional)",
		de: "Notiz (optional)"
	},
	[`${h}praise_for`]: {
		en: "for",
		de: "für"
	},
	[`${h}praise_send`]: {
		en: "Send praise",
		de: "Lob senden"
	},
	[`${h}praise_pick`]: {
		en: "Pick at least one person.",
		de: "Wähle mindestens eine Person."
	},
	[`${h}badge_thank_you`]: {
		en: "Thank you",
		de: "Danke"
	},
	[`${h}badge_team_player`]: {
		en: "Team player",
		de: "Teamplayer"
	},
	[`${h}badge_above_and_beyond`]: {
		en: "Above and beyond",
		de: "Über sich hinaus"
	},
	[`${h}badge_problem_solver`]: {
		en: "Problem solver",
		de: "Problemlöser"
	},
	[`${h}badge_creative`]: {
		en: "Creative",
		de: "Kreativ"
	},
	[`${h}badge_mentor`]: {
		en: "Mentor",
		de: "Mentor"
	},
	[`${h}badge_calm`]: {
		en: "Calm under pressure",
		de: "Ruhe in Person"
	},
	[`${h}badge_leader`]: {
		en: "Leader",
		de: "Vorbild"
	},
	[`${h}reminder_title`]: {
		en: "Urgent message from %(sender)s",
		de: "Dringende Nachricht von %(sender)s"
	},
	[`${h}reminder_count`]: {
		en: "Reminder %(n)s of 10",
		de: "Erinnerung %(n)s von 10"
	},
	[`${h}reminder_open`]: {
		en: "Read now",
		de: "Jetzt lesen"
	},
	[`${h}reminder_later`]: {
		en: "Dismiss",
		de: "Ausblenden"
	},
	[`${h}reminder_off`]: {
		en: "Stop urgent reminders",
		de: "Keine Erinnerungen mehr"
	}
}, _ = "de.datanauten.praise", v = [
	{
		id: "thank_you",
		emoji: "🙏"
	},
	{
		id: "team_player",
		emoji: "🤝"
	},
	{
		id: "above_and_beyond",
		emoji: "🚀"
	},
	{
		id: "problem_solver",
		emoji: "🧩"
	},
	{
		id: "creative",
		emoji: "💡"
	},
	{
		id: "mentor",
		emoji: "🌱"
	},
	{
		id: "calm",
		emoji: "🧘"
	},
	{
		id: "leader",
		emoji: "🧭"
	}
];
function y(e) {
	return v.find((t) => t.id === e);
}
function b(e) {
	let t = e?.[_];
	if (t && typeof t.badge == "string" && y(t.badge) && Array.isArray(t.recipients)) return {
		badge: t.badge,
		recipients: t.recipients.filter((e) => typeof e == "string"),
		note: typeof t.note == "string" ? t.note : ""
	};
}
function x(e, t, n, r) {
	let i = y(e.badge), a = e.recipients.map((e) => t[e] ?? e), o = e.recipients.map((e) => `<a href="https://matrix.to/#/${encodeURIComponent(e)}">${S(t[e] ?? e)}</a>`), s = e.note.trim();
	return {
		msgtype: "m.text",
		body: `${i.emoji} ${n(e.badge)} — ${r} ${a.join(", ")}${s ? `\n${s}` : ""}`,
		format: "org.matrix.custom.html",
		formatted_body: `<p>${i.emoji} <strong>${S(n(e.badge))}</strong> — ${S(r)} ${o.join(", ")}</p>` + (s ? `<blockquote>${S(s).replace(/\n/g, "<br>")}</blockquote>` : ""),
		"m.mentions": { user_ids: e.recipients },
		[_]: {
			badge: e.badge,
			recipients: e.recipients,
			note: s
		}
	};
}
function S(e) {
	return e.replace(/[&<>"']/g, (e) => `&#${e.charCodeAt(0)};`);
}
// src/priority.ts
var C = "de.datanauten.priority", w = "de.datanauten.teamwork.urgent", T = "de.datanauten.teamwork.settings", E = 12e4, D = 12e5;
function O(e) {
	let t = e?.[C];
	return t === "important" || t === "urgent" ? t : void 0;
}
function ee(e, t, n) {
	if (!t) return e;
	let r = t === "urgent" ? "🚨" : "❗", i = {
		...e,
		[C]: t,
		body: `${r} ${n(t)}: ${e.body}`
	};
	return e.formatted_body && (i.formatted_body = `<p><strong>${r} ${ie(n(t))}</strong></p>${e.formatted_body}`), i;
}
function te(e) {
	return e.length <= 20 ? e.map((e) => e.userId) : [];
}
function ne(e, t) {
	if (!t.length) return e;
	let n = e["m.mentions"]?.user_ids ?? [];
	return {
		...e,
		"m.mentions": { user_ids: [.../* @__PURE__ */ new Set([...n, ...t])] }
	};
}
function k(e) {
	return e.replace(/^(🚨|❗) [^:]{1,40}: /u, "");
}
var A = {
	conditions: [{
		kind: "event_match",
		key: `content.${C.replace(/\./g, "\\.")}`,
		pattern: "urgent"
	}],
	actions: [
		"notify",
		{
			set_tweak: "sound",
			value: "default"
		},
		{ set_tweak: "highlight" }
	]
};
async function j(e, t) {
	return !e.getPushRules || !e.addPushRule || t || (await e.getPushRules()).global?.override?.some((e) => e.rule_id === "de.datanauten.teamwork.urgent") ? !1 : (await e.addPushRule("global", "override", w, A), !0);
}
var re = class {
	host;
	now;
	pending = /* @__PURE__ */ new Map();
	timer;
	attached;
	constructor(e, t = Date.now) {
		this.host = e, this.now = t;
	}
	attach(e) {
		this.attached !== e && (this.detach(), this.attached = e, e.on("Room.timeline", this.onTimeline), e.on("Event.decrypted", this.onDecrypted), e.on("Room.receipt", this.onReceipt), this.timer = setInterval(this.tick, 15e3));
	}
	detach() {
		this.attached?.off("Room.timeline", this.onTimeline), this.attached?.off("Event.decrypted", this.onDecrypted), this.attached?.off("Room.receipt", this.onReceipt), this.attached = void 0, this.timer && clearInterval(this.timer), this.pending.clear();
	}
	get size() {
		return this.pending.size;
	}
	dismiss(e) {
		this.pending.delete(e), this.host.hide(e);
	}
	consider(e) {
		let t = this.host.client(), n = t?.getUserId(), r = e.getId(), i = e.getRoomId();
		if (!t || !n || !r || !i || this.pending.has(r) || e.getType() !== "m.room.message" || e.getSender() === n || e.isRedacted() || O(e.getContent()) !== "urgent" || !this.host.enabled() || this.now() - e.getTs() > 12e5 || t.getRoom(i)?.hasUserReadEvent(n, r)) return;
		let a = String(e.getContent().body ?? ""), o = {
			roomId: i,
			eventId: r,
			sender: e.sender?.name ?? e.getSender() ?? "",
			text: k(a),
			arrived: e.getTs(),
			count: 1
		};
		this.pending.set(r, o), this.host.show(o);
	}
	tick = () => {
		let e = this.host.client(), t = e?.getUserId();
		for (let n of [...this.pending.values()]) {
			let r = t && e?.getRoom(n.roomId)?.hasUserReadEvent(t, n.eventId), i = this.now() - n.arrived;
			if (r || i > 12e5 || !this.host.enabled()) {
				this.dismiss(n.eventId);
				continue;
			}
			let a = Math.floor(i / E) + 1;
			a > n.count && (n.count = a, this.host.show(n));
		}
	};
	onTimeline = (e, t, n) => {
		n || this.consider(e);
	};
	onDecrypted = (e) => this.consider(e);
	onReceipt = () => this.tick();
};
function ie(e) {
	return e.replace(/[&<>"']/g, (e) => `&#${e.charCodeAt(0)};`);
}
// src/saved.ts
var M = "de.datanauten.teamwork.saved", ae = 500;
function oe(e) {
	let t = e?.items;
	return Array.isArray(t) ? t.filter((e) => !!e && typeof e.room_id == "string" && typeof e.event_id == "string" && typeof e.saved_ts == "number") : [];
}
var se = class {
	api;
	watchable;
	listeners = /* @__PURE__ */ new Set();
	constructor(e) {
		this.api = e;
	}
	attach() {
		if (this.watchable) return !0;
		try {
			return this.watchable = this.api.client.accountData.get(M), this.watchable.watch(() => this.listeners.forEach((e) => e())), !0;
		} catch {
			return !1;
		}
	}
	list() {
		return this.attach(), oe(this.watchable?.value);
	}
	has(e) {
		return this.list().some((t) => t.event_id === e);
	}
	subscribe(e) {
		return this.listeners.add(e), () => this.listeners.delete(e);
	}
	async toggle(e, t, n = Date.now()) {
		let r = this.list(), i = r.some((e) => e.event_id === t), a = i ? r.filter((e) => e.event_id !== t) : [{
			room_id: e,
			event_id: t,
			saved_ts: n
		}, ...r].slice(0, ae);
		return await this.api.client.accountData.set(M, {
			version: 1,
			items: a
		}), !i;
	}
};
async function ce(e, t) {
	let n = e.getRoom(t.room_id), r = {
		ref: t,
		roomName: n?.name ?? t.room_id,
		sender: "",
		text: ""
	};
	if (!n) return {
		...r,
		missing: "unavailable"
	};
	let i = n.findEventById(t.event_id);
	if (!i) try {
		i = (await e.getEventTimeline(n.getUnfilteredTimelineSet(), t.event_id))?.getEvents().find((e) => e.getId() === t.event_id);
	} catch {}
	if (!i) return {
		...r,
		missing: "unavailable"
	};
	i.isBeingDecrypted() && await e.decryptEventIfNeeded?.(i);
	let a = n.getMember(i.getSender() ?? "")?.name ?? i.getSender() ?? "";
	if (i.isRedacted()) return {
		...r,
		sender: a,
		ts: i.getTs(),
		missing: "redacted"
	};
	if (i.isDecryptionFailure()) return {
		...r,
		sender: a,
		ts: i.getTs(),
		missing: "unavailable"
	};
	let o = i.getContent(), s = String(o.body ?? o.msgtype ?? "");
	return {
		...r,
		sender: a,
		ts: i.getTs(),
		text: s
	};
}
// src/schedule.ts
var N = "org.matrix.msc4140", P = "de.datanauten.teamwork.previews";
async function le(e) {
	if (!e?._unstable_sendDelayedEvent || !e._unstable_getDelayedEvents) return !1;
	try {
		return await e.doesServerSupportUnstableFeature(N);
	} catch {
		return !1;
	}
}
async function F(e, t, n, r, i = null, a = Date.now()) {
	let o = Math.max(1e3, Math.round(r - a));
	if (i) {
		let e = n["m.relates_to"]?.["m.in_reply_to"];
		n = {
			...n,
			"m.relates_to": {
				rel_type: "m.thread",
				event_id: i,
				is_falling_back: !e,
				"m.in_reply_to": e ?? { event_id: i }
			}
		};
	}
	let s = await e.getCrypto?.()?.isEncryptionEnabledInRoom(t);
	if (s === void 0) throw new I("no_crypto");
	let c;
	if (s) {
		let r = await L(e, t, n), i = `/rooms/${encodeURIComponent(t)}/send/${encodeURIComponent(r.type)}/${encodeURIComponent(R(e))}`;
		({delay_id: c} = await e.http.authedRequest("PUT", i, { [`${N}.delay`]: o }, r.content));
	} else ({delay_id: c} = await e._unstable_sendDelayedEvent(t, { delay: o }, null, "m.room.message", n));
	return W(c, {
		text: String(n.body ?? ""),
		priority: n["de.datanauten.priority"]
	}), c;
}
var I = class extends Error {};
async function L(e, t, n) {
	let r = e.getRoom(t), i = r?.currentState?.getStateEvents("m.room.create", "")?.constructor;
	if (!r || !i || !e.cryptoBackend || !e.http) throw new I("no_crypto");
	let a = new i({
		type: "m.room.message",
		content: n,
		room_id: t,
		sender: e.getUserId(),
		event_id: `~${t}:${R(e)}`,
		origin_server_ts: Date.now()
	});
	if (await e.cryptoBackend.encryptEvent(a, r), !a.isEncrypted() || a.getWireType() !== "m.room.encrypted") throw new I("no_crypto");
	return {
		type: a.getWireType(),
		content: a.getWireContent()
	};
}
function R(e) {
	return e.makeTxnId?.() ?? `tw${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}
async function z(e) {
	let t = await e._unstable_getDelayedEvents("scheduled"), n = t.delayed_events ?? t.scheduled ?? [], r = U(), i = /* @__PURE__ */ new Set(), a = n.filter((e) => e.type === "m.room.message" || e.type === "m.room.encrypted").map((e) => {
		i.add(e.delay_id);
		let t = e.type === "m.room.message" ? e.content : void 0;
		return {
			delayId: e.delay_id,
			roomId: e.room_id,
			sendAt: e.running_since + e.delay,
			preview: typeof t?.body == "string" ? t.body : r[e.delay_id]?.text,
			priority: typeof t?.["de.datanauten.priority"] == "string" ? t["de.datanauten.priority"] : r[e.delay_id]?.priority
		};
	}).sort((e, t) => e.sendAt - t.sendAt);
	return ue(i), a;
}
async function B(e, t) {
	e._unstable_cancelScheduledDelayedEvent ? await e._unstable_cancelScheduledDelayedEvent(t) : await e._unstable_updateDelayedEvent(t, "cancel");
}
async function V(e, t) {
	e._unstable_sendScheduledDelayedEvent ? await e._unstable_sendScheduledDelayedEvent(t) : await e._unstable_updateDelayedEvent(t, "send");
}
function H(e = /* @__PURE__ */ new Date()) {
	let t = (t, n) => {
		let r = new Date(e);
		return r.setDate(r.getDate() + t), r.setHours(n, 0, 0, 0), r;
	}, n = [], r = new Date(e.getTime() + 36e5);
	r.setSeconds(0, 0), n.push({
		key: "in_one_hour",
		at: r
	}), n.push({
		key: "tomorrow_morning",
		at: t(1, 9)
	});
	let i = (8 - e.getDay()) % 7 || 7;
	return n.push({
		key: "monday_morning",
		at: t(i, 9)
	}), n;
}
function U() {
	try {
		let e = JSON.parse(localStorage.getItem(P) ?? "{}");
		return e && typeof e == "object" ? e : {};
	} catch {
		return {};
	}
}
function W(e, t) {
	try {
		localStorage.setItem(P, JSON.stringify({
			...U(),
			[e]: t
		}));
	} catch {}
}
function ue(e) {
	let t = U(), n = Object.fromEntries(Object.entries(t).filter(([t]) => e.has(t)));
	if (Object.keys(n).length !== Object.keys(t).length) try {
		localStorage.setItem(P, JSON.stringify(n));
	} catch {}
}
function de() {
	let e = window, t = e.deDatanautenTeamsSuite ??= {}, n = t._renderChain;
	if (n?.version === 1) return n;
	let r = {
		version: 1,
		entries: n?.entries ?? [],
		installed: !1
	};
	return t._renderChain = r, r;
}
function G(e, t) {
	return e.entries.filter((e) => {
		try {
			return e.filter(t);
		} catch {
			return !1;
		}
	});
}
function fe(e, t, n) {
	let r = e.find((e) => e.replaces), i = r ? () => r.render(t, n) : n;
	for (let n of e.filter((e) => !e.replaces)) {
		let e = i;
		i = () => n.render(t, e);
	}
	return i();
}
function K(e, t) {
	let n = de(), r = n.entries.findIndex((e) => e.id === t.id);
	if (r >= 0 ? n.entries[r] = t : n.entries.push(t), n.installed) return;
	n.installed = !0;
	let i = (e, t) => fe(G(n, e.mxEvent), e, () => t?.() ?? null);
	e.registerMessageRenderer((e) => {
		let t = G(n, e);
		return t.length > 0 && !t.some((e) => e.replaces);
	}, i), e.registerMessageRenderer((e) => G(n, e).some((e) => e.replaces), i, { allowEditingEvent: !1 });
}
// node_modules/.pnpm/react@19.3.1/node_modules/react/cjs/react-jsx-runtime.production.js
var pe = /* @__PURE__ */ e(((e) => {
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
	t.exports = pe();
})))();
function me(e) {
	let { t, canSchedule: n, members: r, formatTime: i, onSubmit: a, onCancel: o } = e, [s, c] = window.React.useState(e.initialText), [l, u] = window.React.useState(e.initialPriority), [d, f] = window.React.useState(() => te(r)), p = (e) => f((t) => t.includes(e) ? t.filter((t) => t !== e) : [...t, e]), m = H(), [g, _] = window.React.useState(e.startScheduled && n ? m[1].key : "now"), [v, y] = window.React.useState(() => he(m[1].at)), [b, x] = window.React.useState(null), [S, C] = window.React.useState(!1), w = window.React.useRef(null);
	window.React.useEffect(() => {
		let e = w.current;
		e?.focus(), e?.setSelectionRange(e.value.length, e.value.length);
	}, []);
	let T = () => {
		if (g !== "now") return g === "custom" ? new Date(v).getTime() : m.find((e) => e.key === g)?.at.getTime();
	}, E = async (n) => {
		if (n.preventDefault(), !s.trim()) return;
		let r = T();
		if (r !== void 0 && (!Number.isFinite(r) || r <= Date.now())) {
			x(t(`${h}in_past`));
			return;
		}
		let i = {
			text: s.trim(),
			priority: l,
			sendAt: r,
			notify: l === "urgent" ? d : void 0
		};
		C(!0), x(null);
		try {
			await e.submit(i), a(i);
		} catch (e) {
			x(e instanceof Error ? e.message : String(e)), C(!1);
		}
	};
	return /* @__PURE__ */ (0, q.jsxs)("form", {
		className: "tw-dialog",
		onSubmit: (e) => void E(e),
		"data-testid": "teamwork-compose",
		children: [
			/* @__PURE__ */ (0, q.jsx)("label", {
				className: "tw-label",
				htmlFor: "tw-text",
				children: t(`${h}message`)
			}),
			/* @__PURE__ */ (0, q.jsx)("textarea", {
				id: "tw-text",
				ref: w,
				className: "tw-input tw-textarea",
				value: s,
				rows: 3,
				disabled: S,
				onChange: (e) => c(e.target.value),
				onKeyDown: (e) => {
					e.key === "Enter" && (e.ctrlKey || e.metaKey) && E(e);
				}
			}),
			/* @__PURE__ */ (0, q.jsxs)("fieldset", {
				className: "tw-fieldset",
				children: [
					/* @__PURE__ */ (0, q.jsx)("legend", {
						className: "tw-label",
						children: t(`${h}delivery`)
					}),
					/* @__PURE__ */ (0, q.jsx)("div", {
						className: "tw-segmented",
						role: "radiogroup",
						children: [
							void 0,
							"important",
							"urgent"
						].map((e) => /* @__PURE__ */ (0, q.jsxs)("button", {
							type: "button",
							role: "radio",
							"aria-checked": l === e,
							className: `tw-segment ${e ? `tw-segment--${e}` : ""}`,
							onClick: () => u(e),
							children: [e === "urgent" ? "🚨 " : e === "important" ? "❗ " : "", t(`${h}${e ?? "standard"}`)]
						}, e ?? "standard"))
					}),
					l === "urgent" && /* @__PURE__ */ (0, q.jsx)("p", {
						className: "tw-hint",
						children: t("datanauten_teamwork_urgent_hint")
					})
				]
			}),
			l === "urgent" && r.length > 0 && /* @__PURE__ */ (0, q.jsxs)("fieldset", {
				className: "tw-fieldset",
				children: [
					/* @__PURE__ */ (0, q.jsx)("legend", {
						className: "tw-label",
						children: t("datanauten_teamwork_urgent_notify")
					}),
					/* @__PURE__ */ (0, q.jsx)("div", {
						className: "tw-chips",
						children: r.map((e) => /* @__PURE__ */ (0, q.jsx)("button", {
							type: "button",
							role: "checkbox",
							"aria-checked": d.includes(e.userId),
							className: "tw-chip",
							onClick: () => p(e.userId),
							children: e.name
						}, e.userId))
					}),
					/* @__PURE__ */ (0, q.jsx)("p", {
						className: "tw-hint",
						children: t("datanauten_teamwork_urgent_notify_hint")
					})
				]
			}),
			/* @__PURE__ */ (0, q.jsxs)("fieldset", {
				className: "tw-fieldset",
				children: [/* @__PURE__ */ (0, q.jsx)("legend", {
					className: "tw-label",
					children: t(`${h}when`)
				}), n ? /* @__PURE__ */ (0, q.jsxs)(q.Fragment, { children: [
					/* @__PURE__ */ (0, q.jsx)("div", {
						className: "tw-chips",
						role: "radiogroup",
						children: [
							{ key: "now" },
							...m,
							{ key: "custom" }
						].map((e) => /* @__PURE__ */ (0, q.jsx)("button", {
							type: "button",
							role: "radio",
							"aria-checked": g === e.key,
							className: "tw-chip",
							title: "at" in e ? i(e.at.getTime()) : void 0,
							onClick: () => _(e.key),
							children: t(`${h}${e.key === "custom" ? "custom_time" : e.key}`)
						}, e.key))
					}),
					g === "custom" && /* @__PURE__ */ (0, q.jsx)("input", {
						className: "tw-input",
						type: "datetime-local",
						"aria-label": t("datanauten_teamwork_custom_time"),
						value: v,
						onChange: (e) => y(e.target.value)
					}),
					g !== "now" && /* @__PURE__ */ (0, q.jsxs)("p", {
						className: "tw-hint",
						children: [
							/* @__PURE__ */ (0, q.jsx)("strong", { children: i(T() ?? 0) }),
							" · ",
							t("datanauten_teamwork_server_holds")
						]
					})
				] }) : /* @__PURE__ */ (0, q.jsx)("p", {
					className: "tw-hint",
					children: t(`${h}no_scheduling`)
				})]
			}),
			b && /* @__PURE__ */ (0, q.jsx)("div", {
				className: "tw-error",
				role: "alert",
				children: t("datanauten_teamwork_failed", { error: b })
			}),
			/* @__PURE__ */ (0, q.jsxs)("div", {
				className: "tw-actions",
				children: [/* @__PURE__ */ (0, q.jsx)("button", {
					type: "button",
					className: "tw-action",
					onClick: o,
					children: t(`${h}cancel`)
				}), /* @__PURE__ */ (0, q.jsx)("button", {
					type: "submit",
					className: "tw-action tw-action--primary",
					disabled: S || !s.trim(),
					children: t(`${h}${g === "now" ? "send" : "schedule"}`)
				})]
			})
		]
	});
}
function he(e) {
	let t = (e) => String(e).padStart(2, "0");
	return `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())}T${t(e.getHours())}:${t(e.getMinutes())}`;
}
// src/ui/HeaderButtons.tsx
function ge({ t: e, roomId: t, scheduledCount: n, subscribe: r, openSaved: i, openScheduled: a }) {
	let [, o] = window.React.useState(0);
	window.React.useEffect(() => r(() => o((e) => e + 1)), [r]);
	let s = n(t);
	return /* @__PURE__ */ (0, q.jsxs)(q.Fragment, { children: [!!s && /* @__PURE__ */ (0, q.jsxs)("button", {
		type: "button",
		className: "tw-header-button",
		"data-testid": "teamwork-scheduled-button",
		"aria-label": e("datanauten_teamwork_scheduled_button"),
		title: e("datanauten_teamwork_scheduled_button"),
		onClick: () => a(t),
		children: [/* @__PURE__ */ (0, q.jsx)("svg", {
			viewBox: "0 0 24 24",
			width: "24",
			height: "24",
			"aria-hidden": "true",
			fill: "currentColor",
			children: /* @__PURE__ */ (0, q.jsx)("path", { d: "M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 3v4.6l3.2 3.2-1.4 1.4L11 12.4V7h2Z" })
		}), /* @__PURE__ */ (0, q.jsx)("span", {
			className: "tw-count",
			children: s
		})]
	}), /* @__PURE__ */ (0, q.jsx)("button", {
		type: "button",
		className: "tw-header-button",
		"data-testid": "teamwork-saved-button",
		"aria-label": e(`${h}saved_button`),
		title: e(`${h}saved_button`),
		onClick: i,
		children: _e
	})] });
}
var _e = /* @__PURE__ */ (0, q.jsx)("svg", {
	viewBox: "0 0 24 24",
	width: "24",
	height: "24",
	"aria-hidden": "true",
	fill: "currentColor",
	children: /* @__PURE__ */ (0, q.jsx)("path", { d: "M6 3h12a1 1 0 0 1 1 1v17.2a.5.5 0 0 1-.8.4L12 17l-6.2 4.6a.5.5 0 0 1-.8-.4V4a1 1 0 0 1 1-1Zm1 2v13.2l5-3.7 5 3.7V5H7Z" })
});
// src/ui/PraiseCard.tsx
function J({ t: e, praise: t, names: n }) {
	let r = y(t.badge), i = t.recipients.map((e) => n[e] ?? e).join(", ");
	return /* @__PURE__ */ (0, q.jsxs)("div", {
		className: `tw-praise tw-praise--${r.id}`,
		"data-testid": "teamwork-praise-card",
		children: [/* @__PURE__ */ (0, q.jsx)("div", {
			className: "tw-praise-medal",
			"aria-hidden": "true",
			children: r.emoji
		}), /* @__PURE__ */ (0, q.jsxs)("div", {
			className: "tw-praise-body",
			children: [
				/* @__PURE__ */ (0, q.jsx)("div", {
					className: "tw-praise-title",
					children: e(`${h}badge_${r.id}`)
				}),
				/* @__PURE__ */ (0, q.jsxs)("div", {
					className: "tw-praise-who",
					children: [
						e(`${h}praise_for`),
						" ",
						/* @__PURE__ */ (0, q.jsx)("strong", { children: i || "…" })
					]
				}),
				t.note && /* @__PURE__ */ (0, q.jsxs)("div", {
					className: "tw-praise-note",
					children: [
						"“",
						t.note,
						"”"
					]
				})
			]
		})]
	});
}
// src/ui/PraiseDialog.tsx
function ve({ t: e, members: t, submit: n, onSubmit: r, onCancel: i }) {
	let [a, o] = window.React.useState(t.length === 1 ? [t[0].userId] : []), [s, c] = window.React.useState("thank_you"), [l, u] = window.React.useState(""), [d, f] = window.React.useState(null), [p, m] = window.React.useState(!1), g = Object.fromEntries(t.map((e) => [e.userId, e.name])), _ = (e) => o((t) => t.includes(e) ? t.filter((t) => t !== e) : [...t, e]), y = async (t) => {
		if (t.preventDefault(), !a.length) {
			f(e(`${h}praise_pick`));
			return;
		}
		let i = {
			badge: s,
			recipients: a,
			note: l.trim()
		};
		m(!0);
		try {
			await n(i), r(i);
		} catch (t) {
			f(e(`${h}failed`, { error: t instanceof Error ? t.message : String(t) })), m(!1);
		}
	};
	return /* @__PURE__ */ (0, q.jsxs)("form", {
		className: "tw-dialog",
		onSubmit: (e) => void y(e),
		"data-testid": "teamwork-praise",
		children: [
			/* @__PURE__ */ (0, q.jsxs)("fieldset", {
				className: "tw-fieldset",
				children: [/* @__PURE__ */ (0, q.jsx)("legend", {
					className: "tw-label",
					children: e(`${h}praise_who`)
				}), /* @__PURE__ */ (0, q.jsx)("div", {
					className: "tw-chips",
					children: t.map((e) => /* @__PURE__ */ (0, q.jsx)("button", {
						type: "button",
						role: "checkbox",
						"aria-checked": a.includes(e.userId),
						className: "tw-chip",
						onClick: () => _(e.userId),
						children: e.name
					}, e.userId))
				})]
			}),
			/* @__PURE__ */ (0, q.jsxs)("fieldset", {
				className: "tw-fieldset",
				children: [/* @__PURE__ */ (0, q.jsx)("legend", {
					className: "tw-label",
					children: e(`${h}praise_badge`)
				}), /* @__PURE__ */ (0, q.jsx)("div", {
					className: "tw-badges",
					role: "radiogroup",
					children: v.map((t) => /* @__PURE__ */ (0, q.jsxs)("button", {
						type: "button",
						role: "radio",
						"aria-checked": s === t.id,
						className: `tw-badge-pick tw-praise--${t.id}`,
						onClick: () => c(t.id),
						children: [/* @__PURE__ */ (0, q.jsx)("span", {
							className: "tw-badge-emoji",
							children: t.emoji
						}), /* @__PURE__ */ (0, q.jsx)("span", { children: e(`${h}badge_${t.id}`) })]
					}, t.id))
				})]
			}),
			/* @__PURE__ */ (0, q.jsx)("textarea", {
				className: "tw-input tw-textarea",
				rows: 2,
				placeholder: e(`${h}praise_note`),
				"aria-label": e(`${h}praise_note`),
				value: l,
				onChange: (e) => u(e.target.value)
			}),
			/* @__PURE__ */ (0, q.jsx)(J, {
				t: e,
				praise: {
					badge: s,
					recipients: a,
					note: l
				},
				names: g
			}),
			d && /* @__PURE__ */ (0, q.jsx)("div", {
				className: "tw-error",
				role: "alert",
				children: d
			}),
			/* @__PURE__ */ (0, q.jsxs)("div", {
				className: "tw-actions",
				children: [/* @__PURE__ */ (0, q.jsx)("button", {
					type: "button",
					className: "tw-action",
					onClick: i,
					children: e(`${h}cancel`)
				}), /* @__PURE__ */ (0, q.jsx)("button", {
					type: "submit",
					className: "tw-action tw-action--primary",
					disabled: p,
					children: e(`${h}praise_send`)
				})]
			})
		]
	});
}
// src/ui/PriorityMessage.tsx
function ye({ t: e, priority: t, body: n }) {
	return /* @__PURE__ */ (0, q.jsxs)("div", {
		className: `tw-priority tw-priority--${t}`,
		"data-testid": `teamwork-${t}`,
		children: [/* @__PURE__ */ (0, q.jsxs)("span", {
			className: `tw-badge tw-badge--${t}`,
			children: [
				t === "urgent" ? "🚨" : "❗",
				" ",
				e(`${h}${t}`)
			]
		}), /* @__PURE__ */ (0, q.jsx)("div", {
			className: "tw-priority-text mx_EventTile_body",
			children: k(n)
		})]
	});
}
// src/ui/SavedDialog.tsx
function be({ t: e, refs: t, formatTime: n, load: r, open: i, remove: a, onSubmit: o, onCancel: s }) {
	let [c, l] = window.React.useState(() => t.map((e) => ({
		ref: e,
		loading: !0
	})));
	return window.React.useEffect(() => {
		let e = !0;
		return t.forEach((t, n) => r(t).then((t) => e && l((e) => e.map((e, r) => r === n ? t : e)))), () => {
			e = !1;
		};
	}, [t, r]), /* @__PURE__ */ (0, q.jsxs)("div", {
		className: "tw-dialog tw-list-dialog",
		"data-testid": "teamwork-saved",
		children: [
			c.length === 0 && /* @__PURE__ */ (0, q.jsxs)("p", {
				className: "tw-empty",
				children: ["🔖 ", e("datanauten_teamwork_saved_empty")]
			}),
			/* @__PURE__ */ (0, q.jsx)("ul", {
				className: "tw-list",
				children: c.map((t) => /* @__PURE__ */ (0, q.jsxs)("li", {
					className: "tw-item",
					children: ["loading" in t ? /* @__PURE__ */ (0, q.jsx)("div", {
						className: "tw-hint",
						children: e(`${h}loading`)
					}) : /* @__PURE__ */ (0, q.jsxs)(q.Fragment, { children: [/* @__PURE__ */ (0, q.jsxs)("div", {
						className: "tw-item-meta",
						children: [
							/* @__PURE__ */ (0, q.jsx)("span", {
								className: "tw-item-sender",
								children: t.sender
							}),
							/* @__PURE__ */ (0, q.jsx)("span", {
								className: "tw-item-room",
								children: t.roomName
							}),
							t.ts && /* @__PURE__ */ (0, q.jsx)("span", {
								className: "tw-item-when",
								children: n(t.ts)
							})
						]
					}), /* @__PURE__ */ (0, q.jsx)("div", {
						className: `tw-item-text ${t.missing ? "tw-item-text--muted" : ""}`,
						children: t.missing ? e(`${h}${t.missing}`) : t.text
					})] }), /* @__PURE__ */ (0, q.jsxs)("div", {
						className: "tw-item-actions",
						children: [/* @__PURE__ */ (0, q.jsx)("button", {
							type: "button",
							className: "tw-action tw-action--small",
							onClick: () => {
								i(t.ref), o();
							},
							children: e(`${h}open`)
						}), /* @__PURE__ */ (0, q.jsx)("button", {
							type: "button",
							className: "tw-action tw-action--small",
							onClick: () => {
								l((e) => e.filter((e) => e.ref.event_id !== t.ref.event_id)), a(t.ref);
							},
							children: e(`${h}unsave`)
						})]
					})]
				}, t.ref.event_id))
			}),
			/* @__PURE__ */ (0, q.jsxs)("p", {
				className: "tw-footnote",
				children: ["🔒 ", e(`${h}saved_privacy`)]
			}),
			/* @__PURE__ */ (0, q.jsx)("div", {
				className: "tw-actions",
				children: /* @__PURE__ */ (0, q.jsx)("button", {
					type: "button",
					className: "tw-action tw-action--primary",
					onClick: s,
					children: "OK"
				})
			})
		]
	});
}
// src/ui/ScheduledDialog.tsx
function xe({ t: e, roomId: t, roomName: n, formatTime: r, list: i, sendNow: a, cancel: o, onCancel: s }) {
	let [c, l] = window.React.useState(null), [u, d] = window.React.useState(null), f = window.React.useCallback(() => {
		i().then((e) => l([...e.filter((e) => e.roomId === t), ...e.filter((e) => e.roomId !== t)])).catch((e) => d(String(e?.message ?? e)));
	}, [i, t]);
	window.React.useEffect(f, [f]);
	let p = (e, t) => () => {
		l((e) => e?.filter((e) => e.delayId !== t) ?? null), e(t).catch((e) => d(String(e?.message ?? e))).finally(f);
	};
	return /* @__PURE__ */ (0, q.jsxs)("div", {
		className: "tw-dialog tw-list-dialog",
		"data-testid": "teamwork-scheduled",
		children: [
			c === null && !u && /* @__PURE__ */ (0, q.jsx)("p", {
				className: "tw-hint",
				children: e("datanauten_teamwork_loading")
			}),
			c?.length === 0 && /* @__PURE__ */ (0, q.jsx)("p", {
				className: "tw-empty",
				children: e("datanauten_teamwork_scheduled_empty")
			}),
			/* @__PURE__ */ (0, q.jsx)("ul", {
				className: "tw-list",
				children: c?.map((t) => /* @__PURE__ */ (0, q.jsxs)("li", {
					className: "tw-item",
					children: [
						/* @__PURE__ */ (0, q.jsxs)("div", {
							className: "tw-item-meta",
							children: [
								/* @__PURE__ */ (0, q.jsx)("span", {
									className: "tw-item-room",
									children: n(t.roomId)
								}),
								/* @__PURE__ */ (0, q.jsxs)("span", {
									className: "tw-item-when",
									children: ["⏰ ", e(`${h}scheduled_at`, { when: r(t.sendAt) })]
								}),
								t.priority && /* @__PURE__ */ (0, q.jsx)("span", {
									className: `tw-badge tw-badge--${t.priority}`,
									children: e(`datanauten_teamwork_${t.priority}`)
								})
							]
						}),
						/* @__PURE__ */ (0, q.jsx)("div", {
							className: `tw-item-text ${t.preview === void 0 ? "tw-item-text--muted" : ""}`,
							children: t.preview === void 0 ? e(`${h}encrypted_preview`) : k(t.preview)
						}),
						/* @__PURE__ */ (0, q.jsxs)("div", {
							className: "tw-item-actions",
							children: [/* @__PURE__ */ (0, q.jsx)("button", {
								type: "button",
								className: "tw-action tw-action--small",
								onClick: p(a, t.delayId),
								children: e(`${h}send_now`)
							}), /* @__PURE__ */ (0, q.jsx)("button", {
								type: "button",
								className: "tw-action tw-action--small tw-action--danger",
								onClick: p(o, t.delayId),
								children: e(`${h}unschedule`)
							})]
						})
					]
				}, t.delayId))
			}),
			u && /* @__PURE__ */ (0, q.jsx)("div", {
				className: "tw-error",
				role: "alert",
				children: u
			}),
			/* @__PURE__ */ (0, q.jsxs)("p", {
				className: "tw-footnote",
				children: ["🖥️📱 ", e(`${h}all_devices`)]
			}),
			/* @__PURE__ */ (0, q.jsx)("div", {
				className: "tw-actions",
				children: /* @__PURE__ */ (0, q.jsx)("button", {
					type: "button",
					className: "tw-action tw-action--primary",
					onClick: s,
					children: "OK"
				})
			})
		]
	});
}
// src/ui/styles.css?inline
var Se = ".tw-dialog{flex-direction:column;gap:14px;width:min(520px,86vw);display:flex}.tw-label{color:var(--cpd-color-text-secondary,#656d77);padding:0;font-size:13px;font-weight:600}.tw-fieldset{border:0;flex-direction:column;gap:8px;margin:0;padding:0;display:flex}.tw-input{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;border-radius:8px;padding:8px 12px;font-size:15px}.tw-textarea{resize:vertical;min-height:44px}.tw-segmented{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);border-radius:10px;gap:0;display:flex;overflow:hidden}.tw-segment{border:0;border-right:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;background:0 0;flex:1;padding:8px 10px;font-size:14px}.tw-segment:last-child{border-right:0}.tw-segment[aria-checked=true]{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);font-weight:600}.tw-segment--important[aria-checked=true]{background:#c25e00}.tw-segment--urgent[aria-checked=true]{background:var(--cpd-color-bg-critical-primary,#d51928)}.tw-chips{flex-wrap:wrap;gap:6px;display:flex}.tw-chip{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;border-radius:16px;padding:5px 12px;font-size:14px}.tw-chip[aria-checked=true]{border-color:var(--cpd-color-border-accent,#0b8a5f);background:var(--cpd-color-bg-accent-rest,#0b8a5f);color:var(--cpd-color-text-on-solid-primary,#fff)}.tw-hint,.tw-footnote{color:var(--cpd-color-text-secondary,#656d77);margin:0;font-size:13px;line-height:1.4}.tw-footnote{border-top:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);padding-top:4px}.tw-empty{color:var(--cpd-color-text-secondary,#656d77);text-align:center;margin:12px 0}.tw-error{color:var(--cpd-color-text-critical-primary,#d51928);font-size:14px}.tw-actions{justify-content:flex-end;gap:8px;display:flex}.tw-action{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);height:36px;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;background:0 0;border-radius:18px;padding:0 18px;font-size:14px;font-weight:600}.tw-action--small{height:28px;padding:0 12px;font-size:13px}.tw-action--primary{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);border-color:#0000}.tw-action--danger{color:var(--cpd-color-text-critical-primary,#d51928)}.tw-action:disabled{opacity:.5;cursor:default}.tw-link{color:var(--cpd-color-text-secondary,#656d77);font:inherit;cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0;font-size:12px;text-decoration:underline}:is(.tw-action,.tw-chip,.tw-segment,.tw-badge-pick,.tw-input,.tw-link,.tw-header-button):focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}.tw-list{flex-direction:column;gap:8px;max-height:55vh;margin:0;padding:0;list-style:none;display:flex;overflow-y:auto}.tw-item{border:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);background:var(--cpd-color-bg-subtle-secondary,#f7f8fa);border-radius:10px;flex-direction:column;gap:6px;padding:10px 12px;display:flex}.tw-item-meta{color:var(--cpd-color-text-secondary,#656d77);flex-wrap:wrap;align-items:center;gap:8px;font-size:12px;display:flex}.tw-item-sender{color:var(--cpd-color-text-primary,#1b1d22);font-weight:600}.tw-item-room:before{content:\"# \";opacity:.6}.tw-item-text{color:var(--cpd-color-text-primary,#1b1d22);white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px}.tw-item-text--muted{color:var(--cpd-color-text-secondary,#656d77);font-style:italic}.tw-item-actions{gap:6px;display:flex}.tw-badge{letter-spacing:.04em;text-transform:uppercase;border-radius:10px;align-items:center;gap:4px;padding:1px 8px;font-size:11px;font-weight:700;display:inline-flex}.tw-badge--important{color:#a14f00;background:#fff1e0}.tw-badge--urgent{background:var(--cpd-color-bg-critical-subtle,#fff0f0);color:var(--cpd-color-text-critical-primary,#d51928)}.tw-priority{border-left:3px solid #e07b00;flex-direction:column;align-items:flex-start;gap:4px;padding-left:10px;display:flex}.tw-priority--urgent{border-left-color:var(--cpd-color-border-critical-primary,#d51928)}.tw-priority-text{white-space:pre-wrap;overflow-wrap:anywhere}.tw-badges{grid-template-columns:repeat(4,1fr);gap:6px;display:grid}.tw-badge-pick{background:var(--tw-praise-bg);color:#1b1d22;font:inherit;cursor:pointer;border:2px solid #0000;border-radius:10px;flex-direction:column;align-items:center;gap:2px;padding:8px 4px;font-size:12px;display:flex}.tw-badge-pick[aria-checked=true]{border-color:var(--cpd-color-border-accent,#0b8a5f);box-shadow:0 0 0 2px var(--cpd-color-bg-canvas-default,#fff) inset}.tw-badge-emoji{font-size:24px}.tw-praise{background:var(--tw-praise-bg);color:#1b1d22;border-radius:14px;align-items:center;gap:14px;max-width:440px;padding:14px 16px;display:flex}.tw-praise-medal{background:#ffffffbf;border-radius:50%;flex:none;place-items:center;width:56px;height:56px;font-size:30px;display:grid;box-shadow:0 2px 8px #0000001f}.tw-praise-title{font-size:17px;font-weight:700}.tw-praise-who{font-size:14px}.tw-praise-note{white-space:pre-wrap;margin-top:6px;font-size:14px;font-style:italic}.tw-praise--thank_you{--tw-praise-bg:linear-gradient(135deg, #ffe9c7, #ffd0d8)}.tw-praise--team_player{--tw-praise-bg:linear-gradient(135deg, #d4f5e4, #c6e6ff)}.tw-praise--above_and_beyond{--tw-praise-bg:linear-gradient(135deg, #e1d9ff, #ffd6f0)}.tw-praise--problem_solver{--tw-praise-bg:linear-gradient(135deg, #d0f0ff, #dcdcff)}.tw-praise--creative{--tw-praise-bg:linear-gradient(135deg, #fff6b8, #ffd9a8)}.tw-praise--mentor{--tw-praise-bg:linear-gradient(135deg, #dcf7c6, #c9f0e0)}.tw-praise--calm{--tw-praise-bg:linear-gradient(135deg, #d8ecff, #e8e0ff)}.tw-praise--leader{--tw-praise-bg:linear-gradient(135deg, #ffe0c2, #ffeeb0)}.tw-header-button{width:32px;height:32px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:0;border-radius:50%;place-items:center;padding:0;display:inline-grid;position:relative}.tw-header-button:hover{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);color:var(--cpd-color-icon-primary,#1b1d22)}.tw-header-button svg{width:20px;height:20px}.tw-count{background:var(--cpd-color-bg-accent-rest,#0b8a5f);color:#fff;border-radius:8px;min-width:16px;height:16px;padding:0 4px;font-size:10px;font-weight:700;line-height:16px;position:absolute;top:0;right:-2px}.tw-save-button[aria-pressed=true]{color:var(--cpd-color-icon-accent-primary,#0b8a5f)}.tw-toasts{z-index:5000;flex-direction:column;gap:10px;width:min(360px,100vw - 40px);display:flex;position:fixed;bottom:20px;right:20px}.tw-toast{border-left:4px solid var(--cpd-color-border-critical-primary,#d51928);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);border-radius:10px;flex-direction:column;gap:6px;padding:14px 16px;animation:.35s ease-out tw-pop;display:flex;box-shadow:0 6px 24px #0000002e}.tw-toast-title{font-weight:700}.tw-toast-text{white-space:pre-wrap;font-size:14px}.tw-toast-count{color:var(--cpd-color-text-secondary,#656d77);font-size:12px}.tw-toast-actions{align-items:center;gap:6px;display:flex}@keyframes tw-pop{0%{opacity:0;transform:translateY(12px)scale(.97)}60%{opacity:1;transform:translateY(-2px)scale(1.01)}to{transform:none}}@media (prefers-reduced-motion:reduce){.tw-toast{animation:none}}";
// src/ui/UrgentToast.tsx
function Ce({ t: e, reminders: t, open: n, dismiss: r, turnOff: i }) {
	let a = D / E;
	return /* @__PURE__ */ (0, q.jsx)("div", {
		className: "tw-toasts",
		"aria-live": "assertive",
		children: t.map((t) => /* @__PURE__ */ (0, q.jsxs)("div", {
			className: "tw-toast",
			role: "alert",
			"data-testid": "teamwork-urgent-toast",
			children: [
				/* @__PURE__ */ (0, q.jsxs)("div", {
					className: "tw-toast-title",
					children: ["🚨 ", e(`${h}reminder_title`, { sender: t.sender })]
				}),
				/* @__PURE__ */ (0, q.jsx)("div", {
					className: "tw-toast-text",
					children: t.text
				}),
				/* @__PURE__ */ (0, q.jsx)("div", {
					className: "tw-toast-count",
					children: e(`${h}reminder_count`, { n: Math.min(t.count, a) })
				}),
				/* @__PURE__ */ (0, q.jsxs)("div", {
					className: "tw-toast-actions",
					children: [
						/* @__PURE__ */ (0, q.jsx)("button", {
							type: "button",
							className: "tw-action tw-action--small tw-action--primary",
							onClick: () => n(t),
							children: e(`${h}reminder_open`)
						}),
						/* @__PURE__ */ (0, q.jsx)("button", {
							type: "button",
							className: "tw-action tw-action--small",
							onClick: () => r(t),
							children: e(`${h}reminder_later`)
						}),
						/* @__PURE__ */ (0, q.jsx)("button", {
							type: "button",
							className: "tw-link",
							onClick: i,
							children: e(`${h}reminder_off`)
						})
					]
				})
			]
		}, `${t.eventId}-${t.count}`))
	});
}
// src/ui/icons.tsx
function we(e) {
	return /* @__PURE__ */ (0, q.jsx)("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		fill: "currentColor",
		...e,
		children: /* @__PURE__ */ (0, q.jsx)("path", { d: "M8 2v2h8V2h2v2h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V2h2Zm11 8H5v9h14v-9Zm-6 1v3.6l2.2 2.2-1.4 1.4-2.8-2.8V11h2Z" })
	});
}
function Y(e) {
	return /* @__PURE__ */ (0, q.jsx)("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		fill: "currentColor",
		...e,
		children: /* @__PURE__ */ (0, q.jsx)("path", { d: "M11 3h2v12h-2V3Zm0 15h2v3h-2v-3Z" })
	});
}
function Te(e) {
	return /* @__PURE__ */ (0, q.jsx)("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		fill: "currentColor",
		...e,
		children: /* @__PURE__ */ (0, q.jsx)("path", { d: "M7 3h10v2h3v3a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.9V18h3v2H8v-2h3v-3.1A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V5h3V3Zm0 4H6v1a2 2 0 0 0 1 1.7V7Zm10 0v2.7A2 2 0 0 0 18 8V7h-1ZM9 5v5a3 3 0 0 0 6 0V5H9Z" })
	});
}
// src/index.tsx
var X = "[teamwork]", Z = "de-datanauten-teamwork-style", Ee = 6e4, Q = class {
	api;
	static moduleApiVersion = "^2.0.0";
	saved;
	reminders;
	injector;
	settings;
	scheduled;
	canSchedule = !1;
	started;
	pollTimer;
	startTimer;
	listeners = /* @__PURE__ */ new Set();
	toasts = [];
	toastRoot;
	constructor(e) {
		this.api = e, this.saved = new se(e), this.reminders = new re({
			client: o,
			enabled: () => this.getSettings().reminders !== !1,
			show: this.showReminder,
			hide: this.hideReminder
		});
	}
	async load() {
		this.api.i18n.register(g), Oe(), this.api.composer.addFileUploadOption({
			type: "de.datanauten.teamwork.schedule",
			label: this.t(`${h}menu_schedule`),
			icon: we,
			onSelected: (e, t, n) => this.openCompose(e, t, n, { startScheduled: !0 })
		}), this.api.composer.addFileUploadOption({
			type: "de.datanauten.teamwork.priority",
			label: this.t(`${h}menu_priority`),
			icon: Y,
			onSelected: (e, t, n) => this.openCompose(e, t, n, { priority: "important" })
		}), this.api.composer.addFileUploadOption({
			type: "de.datanauten.teamwork.praise",
			label: this.t(`${h}menu_praise`),
			icon: Te,
			onSelected: (e) => this.openPraise(e)
		}), K(this.api.customComponents, {
			id: "teamwork/praise",
			filter: (e) => e.type === "m.room.message" && !!b(e.content),
			render: (e) => /* @__PURE__ */ (0, q.jsx)(J, {
				t: this.t,
				praise: b(e.mxEvent.content),
				names: this.names(e.mxEvent.roomId)
			}),
			replaces: !0
		}), K(this.api.customComponents, {
			id: "teamwork/priority",
			filter: (e) => e.type === "m.room.message" && !!O(e.content),
			render: (e) => /* @__PURE__ */ (0, q.jsx)(ye, {
				t: this.t,
				priority: O(e.mxEvent.content),
				body: String(e.mxEvent.content.body ?? "")
			}),
			replaces: !0
		}), this.api.extras.addRoomHeaderButtonCallback((e) => (this.start(), /* @__PURE__ */ (0, q.jsx)(ge, {
			t: this.t,
			roomId: e,
			scheduledCount: (e) => this.canSchedule ? this.scheduled?.filter((t) => t.roomId === e).length ?? 0 : void 0,
			subscribe: this.subscribe,
			openSaved: this.openSaved,
			openScheduled: this.openScheduled
		}, "teamwork"))), this.injector = new r({
			optionsLabel: () => this.api.i18n.translate("common|options"),
			label: (e) => this.t(`${h}${e ? "unsave" : "save"}`),
			isSaved: (e) => this.saved.has(e),
			onClick: (e) => void this.toggleSaved(e)
		}), this.injector.start(), this.saved.subscribe(() => this.injector?.refresh()), this.api.client.waitForClientStarted?.().then(() => this.start()), this.startTimer = setInterval(() => {
			this.start(), this.started && this.startTimer && clearInterval(this.startTimer);
		}, 2e3);
	}
	dispose() {
		this.injector?.stop(), this.reminders.detach(), this.pollTimer && clearInterval(this.pollTimer), this.startTimer && clearInterval(this.startTimer);
	}
	start() {
		let e = o();
		if (e && this.started !== e && (!e.isInitialSyncComplete || e.isInitialSyncComplete())) {
			this.started = e, this.saved.attach(), this.saved.subscribe(this.notify);
			try {
				this.settings = this.api.client.accountData.get(T), this.settings.watch(this.notify);
			} catch {
				this.started = void 0;
				return;
			}
			this.reminders.attach(e), j(e, !!this.getSettings().urgent_rule_offered).then(async (e) => {
				e && await this.updateSettings({ urgent_rule_offered: !0 });
			}).catch((e) => console.warn(`${X} Adding the urgent push rule failed`, e)), le(e).then((e) => {
				this.canSchedule = e, e && (this.refreshScheduled(), this.pollTimer = setInterval(() => void this.refreshScheduled(), Ee));
			});
		}
	}
	async refreshScheduled() {
		let e = o();
		if (!e || !this.canSchedule) return [];
		try {
			this.scheduled = await z(e), this.notify();
		} catch (e) {
			console.warn(`${X} Listing scheduled messages failed`, e);
		}
		return this.scheduled ?? [];
	}
	openCompose(e, t, n, r) {
		let i = o();
		if (!i || !e) return;
		this.start();
		let a = t?.view === "thread" ? t.threadId ?? null : null, s = t?.view === "thread" ? "thread" : "room", c = i.getUserId(), l = i.getRoom(e)?.getJoinedMembers().filter((e) => e.userId !== c).map((e) => ({
			userId: e.userId,
			name: e.name
		})) ?? [];
		this.api.openDialog({ title: this.t(`${h}compose_title`) }, me, {
			t: this.t,
			initialText: p(s),
			initialPriority: r.priority,
			startScheduled: !!r.startScheduled,
			canSchedule: this.canSchedule,
			members: l,
			formatTime: $,
			submit: async ({ text: t, priority: r, sendAt: o, notify: c }) => {
				let l = De(e, {
					msgtype: "m.text",
					body: t
				});
				if (n?.inReplyToEventId && (l["m.relates_to"] = { "m.in_reply_to": { event_id: n.inReplyToEventId } }), l = ee(l, r, (e) => this.t(`${h}${e}`)), r === "urgent" && (l = ne(l, c ?? [])), o === void 0) await i.sendEvent(e, a, "m.room.message", l);
				else {
					try {
						await F(i, e, l, o, a);
					} catch (e) {
						throw e instanceof I ? Error(this.t(`${h}no_crypto`)) : e;
					}
					this.refreshScheduled();
				}
				m(s);
			}
		});
	}
	openPraise(e) {
		let t = o(), n = e ? t?.getRoom(e) : null;
		if (!t || !n || !e) return;
		let r = t.getUserId(), i = n.getJoinedMembers().filter((e) => e.userId !== r).map((e) => ({
			userId: e.userId,
			name: e.name
		}));
		this.api.openDialog({ title: this.t(`${h}praise_title`) }, ve, {
			t: this.t,
			members: i,
			submit: async (n) => {
				let r = x(n, Object.fromEntries(i.map((e) => [e.userId, e.name])), (e) => this.t(`${h}badge_${e}`), this.t(`${h}praise_for`));
				await t.sendEvent(e, "m.room.message", r);
			}
		});
	}
	openSaved = () => {
		let e = o();
		e && this.api.openDialog({ title: this.t(`${h}saved_title`) }, be, {
			t: this.t,
			refs: this.saved.list(),
			formatTime: $,
			load: (t) => ce(e, t),
			open: (e) => l(e.room_id, e.event_id),
			remove: async (e) => void await this.saved.toggle(e.room_id, e.event_id)
		});
	};
	openScheduled = (e) => {
		let t = o();
		t && this.api.openDialog({ title: this.t(`${h}scheduled_title`) }, xe, {
			t: this.t,
			roomId: e,
			roomName: (e) => t.getRoom(e)?.name ?? e,
			formatTime: $,
			list: () => this.refreshScheduled(),
			sendNow: (e) => V(t, e),
			cancel: (e) => B(t, e)
		});
	};
	async toggleSaved(e) {
		let t = o(), n = t && s(t, e);
		if (n) try {
			await this.saved.toggle(n, e);
		} catch (e) {
			console.warn(`${X} Saving the message failed`, e);
		}
	}
	showReminder = (e) => {
		this.toasts = [...this.toasts.filter((t) => t.eventId !== e.eventId), { ...e }], this.renderToasts(), e.count > 1 && typeof Notification < "u" && Notification.permission === "granted" && new Notification(this.t(`${h}reminder_title`, { sender: e.sender }), {
			body: e.text,
			tag: e.eventId,
			renotify: !0
		});
	};
	hideReminder = (e) => {
		this.toasts = this.toasts.filter((t) => t.eventId !== e), this.renderToasts();
	};
	renderToasts() {
		if (!this.toastRoot) {
			let e = document.createElement("div");
			e.id = "teamwork-toasts", document.body.appendChild(e), this.toastRoot = this.api.createRoot(e);
		}
		this.toastRoot.render(/* @__PURE__ */ (0, q.jsx)(Ce, {
			t: this.t,
			reminders: this.toasts,
			open: (e) => {
				l(e.roomId, e.eventId), this.reminders.dismiss(e.eventId);
			},
			dismiss: (e) => this.reminders.dismiss(e.eventId),
			turnOff: () => {
				this.updateSettings({ reminders: !1 }), this.toasts.forEach((e) => this.reminders.dismiss(e.eventId));
			}
		}));
	}
	getSettings() {
		let e = this.settings?.value;
		return e && typeof e == "object" ? e : {};
	}
	async updateSettings(e) {
		await this.api.client.accountData.set(T, {
			...this.getSettings(),
			...e
		});
	}
	names(e) {
		let t = o()?.getRoom(e);
		return new Proxy({}, { get: (e, n) => t?.getMember(n)?.name ?? n });
	}
	subscribe = (e) => (this.listeners.add(e), () => this.listeners.delete(e));
	notify = () => this.listeners.forEach((e) => e());
	t = (e, t) => this.api.i18n.translate(e, t);
};
function De(e, t) {
	let n = window.deDatanautenTeamsSuite?.["tag-mentions"]?.expand;
	if (typeof n != "function") return t;
	try {
		return n(e, t);
	} catch (e) {
		return console.warn(`${X} Expanding tags failed; sending unchanged`, e), t;
	}
}
function $(e) {
	return new Date(e).toLocaleString(void 0, {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit"
	});
}
function Oe() {
	if (document.getElementById(Z)) return;
	let e = document.createElement("style");
	e.id = Z, e.textContent = Se, document.head.appendChild(e);
}
export { Q as TeamworkModule, Q as default };

//# sourceMappingURL=index.js.map