// \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), t = 50;
function n(e) {
	let t = e.getContent()["m.relates_to"], n = e.getWireContent?.()["m.relates_to"];
	return {
		...i(n) ? n : {},
		...i(t) ? t : {}
	};
}
function r(e) {
	if (!(e.rel_type === "m.thread" && e.is_falling_back)) return e["m.in_reply_to"]?.event_id;
}
function i(e) {
	return !!e && typeof e == "object";
}
function a(e) {
	let t = String(e ?? "").split("\n"), n = 0;
	if (t[0]?.startsWith("> ")) {
		for (; n < t.length && t[n].startsWith(">");) n++;
		t[n] === "" && n++;
	}
	return t.slice(n).join("\n").replace(/^(🚨|❗) [^:]{1,40}: /u, "").trim();
}
function o(e, t) {
	if (e.getSender() === t.me || e.isRedacted() || e.isDecryptionFailure()) return;
	let a = e.getType(), o = n(e);
	if (o.rel_type === "m.replace") return;
	let s = (e) => !!e && t.find(e)?.getSender() === t.me;
	if (a === "m.reaction") return o.rel_type === "m.annotation" && s(o.event_id) ? "reaction" : void 0;
	if (a !== "m.room.message") return;
	if (s(r(o))) return "reply";
	if (o.rel_type === "m.thread" && o.event_id && t.myThreads.has(o.event_id)) return "thread";
	let c = e.getContent()["m.mentions"];
	if (i(c)) {
		let e = c.user_ids;
		if (Array.isArray(e) && e.includes(t.me) || c.room === !0) return "mention";
	}
}
function s(e, t, i, o, s) {
	let l = e.getSender() ?? "", u = n(e), d = t === "reaction" ? u.event_id : t === "reply" ? r(u) : void 0, f = d ? a(o.find(d)?.getContent().body) : void 0, p = e.getId();
	return {
		eventId: p,
		roomId: e.getRoomId() ?? i?.roomId ?? "",
		kind: t,
		sender: i?.getMember(l)?.name ?? e.sender?.name ?? l,
		ts: e.getTs(),
		text: t === "reaction" ? String(u.key ?? "") : a(e.getContent().body),
		about: f || void 0,
		read: i ? c(i, o.me, p, e.getTs()) : !!s
	};
}
function c(e, t, n, r) {
	if (e.hasUserReadEvent(t, n)) return !0;
	if (e.findEventById(n)) return !1;
	let i = e.getLiveTimeline?.().getEvents() ?? [];
	for (let n = i.length - 1; n >= 0; n--) {
		let a = i[n].getId();
		if (a && e.hasUserReadEvent(t, a)) return i[n].getTs() >= r;
	}
	return !1;
}
function l(e) {
	let t = [...e.getLiveTimeline?.().getEvents() ?? []];
	for (let n of e.getThreads?.() ?? []) n.rootEvent && t.push(n.rootEvent), t.push(...n.events ?? []);
	return t;
}
var u = class {
	client;
	onLoaded;
	maxInFlight;
	events = /* @__PURE__ */ new Map();
	inFlight = 0;
	constructor(e, t, n = 4) {
		this.client = e, this.onLoaded = t, this.maxInFlight = n;
	}
	get(e, t) {
		let n = this.events.get(t);
		if (n !== void 0) return n ?? void 0;
		this.inFlight >= this.maxInFlight || !this.client.http || (this.events.set(t, null), this.inFlight++, this.load(e, t).finally(() => this.inFlight--));
	}
	async load(e, t) {
		try {
			let n = await this.client.http.authedRequest("GET", `/rooms/${encodeURIComponent(e)}/event/${encodeURIComponent(t)}`), r = await d(this.client, e, n);
			if (!r) return;
			this.events.set(t, r), this.onLoaded();
		} catch {}
	}
};
async function d(e, t, n) {
	let r = e.getRoom(t)?.currentState?.getStateEvents("m.room.create", "")?.constructor;
	if (!r) return;
	let i = new r({
		...n,
		room_id: t
	});
	if (i.getType() === "m.room.encrypted" || i.isEncrypted?.()) try {
		await e.decryptEventIfNeeded?.(i);
	} catch {}
	return i;
}
function f(e, t, r, i) {
	let a = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Set();
	for (let e of t) {
		let t = e.getId();
		if (t && a.set(t, e), e.getSender() !== r) continue;
		let i = n(e);
		i.rel_type === "m.thread" && i.event_id && o.add(i.event_id);
	}
	for (let t of e.getThreads?.() ?? []) t.rootEvent?.getSender() === r && o.add(t.id);
	return {
		me: r,
		myThreads: o,
		find: (t) => a.get(t) ?? e.findEventById(t) ?? i?.get(e.roomId, t)
	};
}
function p(e, t = Date.now(), n, r = []) {
	let i = e.getUserId();
	if (!i) return [];
	let a = [];
	for (let c of e.getRooms()) {
		if (c.getMyMembership && c.getMyMembership() !== "join") continue;
		let e = [...l(c), ...r.filter((e) => e.getRoomId() === c.roomId)], u = f(c, e, i, n), d = /* @__PURE__ */ new Set();
		for (let n of e) {
			let e = n.getId();
			if (!e || d.has(e) || t - n.getTs() > 12096e5) continue;
			d.add(e);
			let r = o(n, u);
			r && a.push(s(n, r, c, u));
		}
	}
	return _(a);
}
async function m(e, n = Date.now(), r) {
	let i = e.getUserId();
	if (!i || !e.http) return [];
	let a = [], o, s = 0;
	for (; s < 200;) {
		let c = { limit: t };
		o && (c.from = o);
		let l = await e.http.authedRequest("GET", "/notifications", c), u = l.notifications ?? [];
		s += u.length;
		let d = !1;
		for (let t of u) {
			if (n - t.ts > 12096e5) {
				d = !0;
				break;
			}
			let o = await h(e, i, t, r);
			o && a.push(o);
		}
		if (d || !l.next_token || u.length === 0) break;
		o = l.next_token;
	}
	return a;
}
async function h(e, t, n, r) {
	let i = e.getRoom(n.room_id);
	if (!i) return;
	let a = i.findEventById(n.event.event_id) ?? await d(e, n.room_id, n.event);
	if (!a) return;
	let c = f(i, l(i), t, r), u = o(a, c);
	return u ? s(a, u, i, c, n.read) : void 0;
}
function g(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let e of t) n.set(e.eventId, e);
	for (let t of e) n.set(t.eventId, t);
	return _([...n.values()]);
}
function _(e) {
	return e.sort((e, t) => t.ts - e.ts).slice(0, 200);
}
var v = class {
	onAdded;
	max;
	events = /* @__PURE__ */ new Map();
	client;
	constructor(e = () => {}, t = 500) {
		this.onAdded = e, this.max = t;
	}
	watch(e) {
		this.client !== e && (this.client?.off("event", this.onEvent), this.events.clear(), this.client = e, e.on("event", this.onEvent));
	}
	stop() {
		this.client?.off("event", this.onEvent), this.client = void 0;
	}
	list() {
		for (let [e, t] of this.events) t.getType() !== "m.reaction" && !t.isBeingDecrypted() && t.getType() !== "m.room.encrypted" && this.events.delete(e);
		return [...this.events.values()];
	}
	onEvent = (e) => {
		let t = e.getType(), n = e.getId();
		!n || t !== "m.reaction" && t !== "m.room.encrypted" || (this.events.set(n, e), this.events.size > this.max && this.events.delete(this.events.keys().next().value), this.onAdded());
	};
}, y = class {
	debounceMs;
	reactions = new v(() => this.schedule());
	client;
	targets;
	server = [];
	items = [];
	timer;
	listeners = /* @__PURE__ */ new Set();
	constructor(e = 400) {
		this.debounceMs = e;
	}
	attach(e) {
		if (this.client !== e) {
			this.detach(), this.client = e, this.reactions.watch(e), this.targets = new u(e, this.schedule);
			for (let t of b) e.on(t, this.schedule);
			this.recompute(), this.refresh();
		}
	}
	detach() {
		for (let e of b) this.client?.off(e, this.schedule);
		this.reactions.stop(), this.client = void 0, this.timer && clearTimeout(this.timer);
	}
	list() {
		return this.items;
	}
	unreadCount() {
		return this.items.filter((e) => !e.read).length;
	}
	subscribe(e) {
		return this.listeners.add(e), () => this.listeners.delete(e);
	}
	async refresh() {
		let e = this.client;
		if (e) {
			try {
				this.server = await m(e, Date.now(), this.targets);
			} catch (e) {
				console.warn("[activity] Loading notifications failed", e);
			}
			this.recompute();
		}
	}
	async markAllRead() {
		let e = this.client;
		if (!e?.sendReadReceipt) return;
		let t = /* @__PURE__ */ new Map();
		for (let e of this.items) !e.read && !t.has(e.roomId) && t.set(e.roomId, e);
		await Promise.all([...t.values()].map(async (t) => {
			let n = e.getRoom(t.roomId), r = n?.findEventById(t.eventId) ?? n?.getLiveTimeline?.().getEvents().at(-1);
			r && await e.sendReadReceipt(r).catch(() => void 0);
		})), this.recompute();
	}
	recompute = () => {
		if (!this.client) return;
		let e = this.client.getUserId(), t = this.server.map((t) => {
			let n = this.client.getRoom(t.roomId);
			return n && e ? {
				...t,
				read: c(n, e, t.eventId, t.ts)
			} : t;
		});
		this.items = g(p(this.client, Date.now(), this.targets, this.reactions.list()), t), this.listeners.forEach((e) => e());
	};
	schedule = () => {
		this.timer && clearTimeout(this.timer), this.timer = setTimeout(this.recompute, this.debounceMs);
	};
}, b = [
	"Room.timeline",
	"Event.decrypted",
	"Room.receipt",
	"Thread.update",
	"Thread.new",
	"Room.redaction"
];
// src/client.ts
function x() {
	let e = window.mxMatrixClientPeg;
	try {
		return e?.get?.() ?? void 0;
	} catch {
		return;
	}
}
function S(e, t) {
	window.location.hash = `#/room/${encodeURIComponent(e)}/${encodeURIComponent(t)}`;
}
// src/i18n.ts
var C = "datanauten_activity_", w = {
	[`${C}title`]: {
		en: "Activity",
		de: "Aktivität"
	},
	[`${C}unread`]: {
		en: "%(n)s unread",
		de: "%(n)s ungelesen"
	},
	[`${C}unread_item`]: {
		en: "Unread",
		de: "Ungelesen"
	},
	[`${C}filter`]: {
		en: "Show",
		de: "Anzeigen"
	},
	[`${C}filter_all`]: {
		en: "All",
		de: "Alle"
	},
	[`${C}filter_unread`]: {
		en: "Unread",
		de: "Ungelesen"
	},
	[`${C}filter_mention`]: {
		en: "Mentions",
		de: "Erwähnungen"
	},
	[`${C}filter_reply`]: {
		en: "Replies",
		de: "Antworten"
	},
	[`${C}filter_reaction`]: {
		en: "Reactions",
		de: "Reaktionen"
	},
	[`${C}filter_thread`]: {
		en: "Threads",
		de: "Threads"
	},
	[`${C}mark_all`]: {
		en: "Mark all as read",
		de: "Alle als gelesen markieren"
	},
	[`${C}mention`]: {
		en: "mentioned you",
		de: "hat dich erwähnt"
	},
	[`${C}reply`]: {
		en: "replied to you",
		de: "hat dir geantwortet"
	},
	[`${C}reaction`]: {
		en: "reacted to your message",
		de: "hat auf deine Nachricht reagiert"
	},
	[`${C}thread`]: {
		en: "replied in a thread",
		de: "hat in einem Thread geantwortet"
	},
	[`${C}loading`]: {
		en: "Loading …",
		de: "Lädt …"
	},
	[`${C}empty`]: {
		en: "Nothing in the last 14 days. Mentions, replies, reactions and thread replies show up here.",
		de: "In den letzten 14 Tagen nichts. Erwähnungen, Antworten, Reaktionen und Thread-Antworten erscheinen hier."
	},
	[`${C}privacy`]: {
		en: "Put together on this device from your rooms; encrypted messages are decrypted locally. Read state is your read receipts, so it matches your other devices.",
		de: "Auf diesem Gerät aus deinen Räumen zusammengestellt; verschlüsselte Nachrichten werden lokal entschlüsselt. Gelesen heißt: deine Lesebestätigung, also wie auf deinen anderen Geräten."
	}
}, T = /* @__PURE__ */ e(((e) => {
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
})), E = (/* @__PURE__ */ e(((e, t) => {
	t.exports = T();
})))(), D = [
	"all",
	"unread",
	"mention",
	"reply",
	"reaction",
	"thread"
], O = {
	mention: "@",
	reply: "↩",
	reaction: "☺",
	thread: "🧵"
};
function k({ t: e, list: t, subscribe: n, refresh: r, markAllRead: i, roomName: a, formatTime: o, open: s, variant: c, onClose: l }) {
	let [u, d] = window.React.useState(t), [f, p] = window.React.useState("all"), [m, h] = window.React.useState(!0);
	window.React.useEffect(() => n(() => d(t())), [n, t]), window.React.useEffect(() => {
		let e = !0;
		return r().finally(() => e && h(!1)), () => {
			e = !1;
		};
	}, [r]);
	let g = u.filter((e) => f === "all" || (f === "unread" ? !e.read : e.kind === f)), _ = u.filter((e) => !e.read).length;
	return /* @__PURE__ */ (0, E.jsxs)("div", {
		className: `act-feed act-feed--${c}`,
		"data-testid": "activity-feed",
		children: [
			c === "page" && /* @__PURE__ */ (0, E.jsxs)("header", {
				className: "act-head",
				children: [/* @__PURE__ */ (0, E.jsx)("h2", { children: e("datanauten_activity_title") }), !!_ && /* @__PURE__ */ (0, E.jsx)("span", {
					className: "act-unread",
					children: e("datanauten_activity_unread", { n: _ })
				})]
			}),
			/* @__PURE__ */ (0, E.jsxs)("div", {
				className: "act-bar",
				children: [/* @__PURE__ */ (0, E.jsx)("div", {
					className: "act-chips",
					role: "radiogroup",
					"aria-label": e(`${C}filter`),
					children: D.map((t) => /* @__PURE__ */ (0, E.jsx)("button", {
						type: "button",
						role: "radio",
						"aria-checked": f === t,
						className: "act-chip",
						onClick: () => p(t),
						children: e(`${C}filter_${t}`)
					}, t))
				}), /* @__PURE__ */ (0, E.jsx)("button", {
					type: "button",
					className: "act-link",
					disabled: !_,
					onClick: () => void i(),
					children: e(`${C}mark_all`)
				})]
			}),
			g.length === 0 && /* @__PURE__ */ (0, E.jsx)("p", {
				className: "act-empty",
				children: e(m ? "datanauten_activity_loading" : "datanauten_activity_empty")
			}),
			/* @__PURE__ */ (0, E.jsx)("ul", {
				className: "act-list",
				children: g.map((t) => /* @__PURE__ */ (0, E.jsx)("li", { children: /* @__PURE__ */ (0, E.jsxs)("button", {
					type: "button",
					className: `act-item ${t.read ? "" : "act-item--unread"}`,
					"data-kind": t.kind,
					onClick: () => {
						s(t), l?.();
					},
					children: [
						/* @__PURE__ */ (0, E.jsx)("span", {
							className: `act-icon act-icon--${t.kind}`,
							"aria-hidden": "true",
							children: t.kind === "reaction" ? t.text : O[t.kind]
						}),
						/* @__PURE__ */ (0, E.jsxs)("span", {
							className: "act-body",
							children: [/* @__PURE__ */ (0, E.jsxs)("span", {
								className: "act-line",
								children: [
									/* @__PURE__ */ (0, E.jsx)("strong", { children: t.sender }),
									" ",
									e(`${C}${t.kind}`),
									/* @__PURE__ */ (0, E.jsx)("span", {
										className: "act-room",
										children: a(t.roomId)
									})
								]
							}), t.kind === "reaction" ? t.about && /* @__PURE__ */ (0, E.jsx)("span", {
								className: "act-text act-text--quote",
								children: t.about
							}) : /* @__PURE__ */ (0, E.jsxs)(E.Fragment, { children: [t.about && /* @__PURE__ */ (0, E.jsx)("span", {
								className: "act-text act-text--quote",
								children: t.about
							}), /* @__PURE__ */ (0, E.jsx)("span", {
								className: "act-text",
								children: t.text
							})] })]
						}),
						/* @__PURE__ */ (0, E.jsx)("span", {
							className: "act-when",
							children: o(t.ts)
						}),
						!t.read && /* @__PURE__ */ (0, E.jsx)("span", {
							className: "act-dot",
							"aria-label": e("datanauten_activity_unread_item")
						})
					]
				}) }, t.eventId))
			}),
			/* @__PURE__ */ (0, E.jsxs)("p", {
				className: "act-footnote",
				children: ["🔒 ", e(`${C}privacy`)]
			}),
			c === "dialog" && /* @__PURE__ */ (0, E.jsx)("div", {
				className: "act-actions",
				children: /* @__PURE__ */ (0, E.jsx)("button", {
					type: "button",
					className: "act-action act-action--primary",
					onClick: l,
					children: "OK"
				})
			})
		]
	});
}
function A({ count: e, size: t = 20 }) {
	return /* @__PURE__ */ (0, E.jsxs)("span", {
		className: "act-bell",
		"data-testid": "activity-feed-bell",
		children: [/* @__PURE__ */ (0, E.jsx)("svg", {
			viewBox: "0 0 24 24",
			width: t,
			height: t,
			"aria-hidden": "true",
			fill: "currentColor",
			children: /* @__PURE__ */ (0, E.jsx)("path", { d: "M12 2a6 6 0 0 1 6 6v3.6l1.8 3.6A1 1 0 0 1 18.9 17H5.1a1 1 0 0 1-.9-1.8L6 11.6V8a6 6 0 0 1 6-6Zm0 2a4 4 0 0 0-4 4v4.1L6.7 15h10.6L16 12.1V8a4 4 0 0 0-4-4Zm-2.5 14h5a2.5 2.5 0 0 1-5 0Z" })
		}), e > 0 && /* @__PURE__ */ (0, E.jsx)("span", {
			className: "act-count",
			children: e > 99 ? "99+" : e
		})]
	});
}
function j({ count: e, subscribe: t, size: n }) {
	let [r, i] = window.React.useState(e);
	return window.React.useEffect(() => t(() => i(e())), [t, e]), /* @__PURE__ */ (0, E.jsx)(A, {
		count: r,
		size: n
	});
}
// src/ui/styles.css?inline
var M = ".act-feed{color:var(--cpd-color-text-primary,#1b1d22);flex-direction:column;gap:12px;display:flex}.act-feed--dialog{width:min(560px,80vw)}.act-feed--page{box-sizing:border-box;background:var(--cpd-color-bg-canvas-default,#fff);flex:1;min-width:0;max-width:760px;height:100%;padding:24px 32px;overflow-y:auto}.act-head{align-items:baseline;gap:12px;display:flex}.act-head h2{margin:0;font-size:22px}.act-unread{color:var(--cpd-color-text-secondary,#656d77);font-size:14px}.act-bar{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.act-chips{flex-wrap:wrap;gap:6px;display:flex}.act-chip{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;border-radius:16px;padding:5px 12px;font-size:14px}.act-chip[aria-checked=true]{border-color:var(--cpd-color-border-accent,#0b8a5f);background:var(--cpd-color-bg-accent-rest,#0b8a5f);color:var(--cpd-color-text-on-solid-primary,#fff)}.act-link{color:var(--cpd-color-text-secondary,#656d77);font:inherit;cursor:pointer;background:0 0;border:0;margin-left:auto;padding:0;font-size:12px;text-decoration:underline}.act-link:disabled{opacity:.4;cursor:default}.act-empty{color:var(--cpd-color-text-secondary,#656d77);text-align:center;margin:12px 0}.act-footnote{border-top:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);color:var(--cpd-color-text-secondary,#656d77);margin:0;padding-top:4px;font-size:13px;line-height:1.4}.act-actions{justify-content:flex-end;gap:8px;display:flex}.act-action{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);height:36px;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;background:0 0;border-radius:18px;padding:0 18px;font-size:14px;font-weight:600}.act-action--primary{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);border-color:#0000}.act-list{flex-direction:column;margin:0;padding:0;list-style:none;display:flex}.act-feed--dialog .act-list{max-height:55vh;overflow-y:auto}.act-item{border:0;border-bottom:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);width:100%;color:inherit;font:inherit;text-align:left;cursor:pointer;background:0 0;grid-template-columns:32px 1fr auto;align-items:start;gap:12px;padding:10px 28px 10px 8px;display:grid;position:relative}.act-item:hover{background:var(--cpd-color-bg-subtle-secondary,#f7f8fa)}.act-item--unread{background:var(--cpd-color-bg-subtle-secondary,#f4f6f8)}.act-item--unread .act-line strong{font-weight:700}.act-icon{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);border-radius:50%;place-items:center;width:32px;height:32px;font-size:16px;font-weight:700;display:grid}.act-icon--mention{color:#2a55c6;background:#e0eaff}.act-icon--reply{color:#0b6e4c;background:#def5ea}.act-icon--reaction{background:#fff4d6}.act-icon--thread{background:#efe6ff}.act-body{flex-direction:column;gap:3px;min-width:0;display:flex}.act-line{font-size:14px}.act-room{color:var(--cpd-color-text-secondary,#656d77);margin-left:6px;font-size:13px}.act-room:before{content:\"· # \";opacity:.6}.act-text{text-overflow:ellipsis;white-space:nowrap;font-size:14px;overflow:hidden}.act-text--quote{border-left:3px solid var(--cpd-color-border-interactive-secondary,#cdd3da);color:var(--cpd-color-text-secondary,#656d77);padding-left:8px;font-size:13px}.act-when{color:var(--cpd-color-text-secondary,#656d77);white-space:nowrap;font-size:12px}.act-dot{background:var(--cpd-color-bg-accent-rest,#0b8a5f);border-radius:50%;width:8px;height:8px;margin-top:-4px;position:absolute;top:50%;right:10px}.act-header-button{width:32px;height:32px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:0;border-radius:50%;place-items:center;padding:0;display:inline-grid;position:relative}.act-header-button:hover{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);color:var(--cpd-color-icon-primary,#1b1d22)}.act-bell{place-items:center;display:inline-grid;position:relative}.act-count{background:var(--cpd-color-bg-accent-rest,#0b8a5f);color:#fff;text-align:center;box-sizing:border-box;border-radius:8px;min-width:16px;height:16px;padding:0 4px;font-size:10px;font-weight:700;line-height:16px;position:absolute;top:-7px;right:-11px}.act-space-item .act-bell{color:var(--cpd-color-icon-secondary,#656d77)}.act-space-item.mx_SpaceButton_active .act-bell,.act-space-item:hover .act-bell{color:var(--cpd-color-icon-primary,#1b1d22)}.act-space-item .act-count{top:-12px;right:-14px}:is(.act-chip,.act-link,.act-item,.act-action,.act-header-button):focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}", N = "de-datanauten-activity-style", P = "activity", F = "de.datanauten.activity", I = 200, L = class {
	api;
	static moduleApiVersion = "^2.0.0";
	feed = new y();
	started;
	watched;
	pollTimer;
	constructor(e) {
		this.api = e;
	}
	async load() {
		this.api.i18n.register(w), B(), this.registerPage(), this.api.extras.addRoomHeaderButtonCallback(() => /* @__PURE__ */ (0, E.jsx)("button", {
			type: "button",
			className: "act-header-button",
			"data-testid": "activity-button",
			"aria-label": this.t(`${C}title`),
			title: this.t(`${C}title`),
			onClick: this.openDialog,
			children: /* @__PURE__ */ (0, E.jsx)(j, {
				count: this.count,
				subscribe: this.subscribe
			})
		}, "activity")), this.pollTimer = setInterval(this.tick, I), this.tick();
	}
	dispose() {
		this.pollTimer && clearInterval(this.pollTimer), this.feed.detach();
	}
	tick = () => {
		let e = x();
		e && (this.watched !== e && (this.watched = e, this.feed.reactions.watch(e)), this.started !== e && (!e.isInitialSyncComplete || e.isInitialSyncComplete()) && (this.started = e, this.feed.attach(e), this.pollTimer && clearInterval(this.pollTimer)));
	};
	registerPage() {
		let e = this.api.extras, t = this.api.navigation;
		e.setSpacePanelItem && t?.registerLocationRenderer && (t.registerLocationRenderer(P, () => /* @__PURE__ */ (0, E.jsx)(k, {
			...this.props(),
			variant: "page"
		})), e.setSpacePanelItem(F, {
			label: this.t(`${C}title`),
			tooltip: this.t(`${C}title`),
			className: "act-space-item",
			icon: /* @__PURE__ */ (0, E.jsx)(j, {
				count: this.count,
				subscribe: this.subscribe
			}),
			onSelected: () => {
				window.location.hash = `#/${P}`;
			}
		}));
	}
	props() {
		return {
			t: this.t,
			list: this.list,
			subscribe: this.subscribe,
			refresh: this.refresh,
			markAllRead: this.markAllRead,
			roomName: (e) => x()?.getRoom(e)?.name ?? e,
			formatTime: z,
			open: (e) => S(e.roomId, e.eventId)
		};
	}
	openDialog = () => {
		this.tick(), this.api.openDialog({ title: this.t(`${C}title`) }, R, this.props());
	};
	list = () => this.feed.list();
	count = () => this.feed.unreadCount();
	refresh = () => this.feed.refresh();
	markAllRead = () => this.feed.markAllRead();
	subscribe = (e) => this.feed.subscribe(e);
	t = (e, t) => this.api.i18n.translate(e, t);
};
function R(e) {
	return /* @__PURE__ */ (0, E.jsx)(k, {
		...e,
		variant: "dialog",
		onClose: e.onCancel
	});
}
function z(e) {
	let t = new Date(e);
	return t.toDateString() === (/* @__PURE__ */ new Date()).toDateString() ? t.toLocaleTimeString(void 0, {
		hour: "2-digit",
		minute: "2-digit"
	}) : t.toLocaleDateString(void 0, {
		day: "numeric",
		month: "short"
	});
}
function B() {
	if (document.getElementById(N)) return;
	let e = document.createElement("style");
	e.id = N, e.textContent = M, document.head.appendChild(e);
}
export { L as ActivityModule, L as default };

//# sourceMappingURL=index.js.map