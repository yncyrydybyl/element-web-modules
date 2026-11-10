/*! @datanauten/element-web-module-speed-start 0.2.0 */
// src/avatars.ts
var e = class {
	urls = /* @__PURE__ */ new Map();
	get map() {
		return this.urls;
	}
	refresh(e = document) {
		let n = e.defaultView?.devicePixelRatio ?? 1;
		for (let r of e.querySelectorAll(".mx_SpacePanel img, .mx_RoomListPanel img, .mx_RoomHeader img")) {
			let e = r.currentSrc || r.src;
			if (!e || e.startsWith("data:") || this.urls.has(e) || !r.complete || !r.naturalWidth) continue;
			let i = t(r, n);
			i && (this.urls.size >= 300 && this.urls.delete(this.urls.keys().next().value), this.urls.set(e, i));
		}
	}
};
function t(e, t) {
	let n = Math.max(e.clientWidth, e.clientHeight, 32), r = Math.min(80, Math.round(n * t));
	try {
		let t = e.ownerDocument.createElement("canvas");
		t.width = r, t.height = r;
		let n = t.getContext("2d");
		if (!n) return null;
		let i = Math.min(e.naturalWidth, e.naturalHeight), a = (e.naturalWidth - i) / 2, o = (e.naturalHeight - i) / 2;
		n.drawImage(e, a, o, i, i, 0, 0, r, r);
		let s = t.toDataURL("image/webp", .8);
		return s.startsWith("data:image/") ? s : null;
	} catch {
		return null;
	}
}
// src/i18n.ts
var n = "datanauten_speed_start_", r = {
	[`${n}session_title_1`]: {
		en: "Signing you back in",
		de: "Du wirst wieder angemeldet"
	},
	[`${n}session_title_2`]: {
		en: "Finding your account",
		de: "Dein Konto wird gesucht"
	},
	[`${n}session_text_1`]: {
		en: "This browser remembers your login, so you don't have to type your password.",
		de: "Dieser Browser kennt deine Anmeldung, du musst dein Passwort nicht eingeben."
	},
	[`${n}session_text_2`]: {
		en: "Opening the login saved on this device.",
		de: "Die auf diesem Gerät gespeicherte Anmeldung wird geöffnet."
	},
	[`${n}storage_title_1`]: {
		en: "Opening your conversations on this device",
		de: "Deine Unterhaltungen auf diesem Gerät werden geöffnet"
	},
	[`${n}storage_title_2`]: {
		en: "Reading what this device remembers",
		de: "Was dieses Gerät gespeichert hat, wird gelesen"
	},
	[`${n}storage_text_1`]: {
		en: "Element keeps a copy here, so it doesn't have to download everything again.",
		de: "Element hat hier eine Kopie, damit es nicht alles neu herunterladen muss."
	},
	[`${n}storage_text_2`]: {
		en: "Nothing is sent anywhere yet: this all happens on your device.",
		de: "Noch wird nichts gesendet: Das passiert alles auf deinem Gerät."
	},
	[`${n}keys_title_1`]: {
		en: "Unlocking your encrypted messages",
		de: "Deine verschlüsselten Nachrichten werden entsperrt"
	},
	[`${n}keys_title_2`]: {
		en: "Getting your keys ready",
		de: "Deine Schlüssel werden vorbereitet"
	},
	[`${n}keys_text_1`]: {
		en: "Your keys stay on this device. Only you and the people you write to can read your messages.",
		de: "Deine Schlüssel bleiben auf diesem Gerät. Nur du und deine Gesprächspartner können deine Nachrichten lesen."
	},
	[`${n}keys_text_2`]: {
		en: "Not even your server can open them.",
		de: "Nicht einmal dein Server kann sie öffnen."
	},
	[`${n}rooms_title_1`]: {
		en: "Setting up your rooms",
		de: "Deine Räume werden eingerichtet"
	},
	[`${n}rooms_title_2`]: {
		en: "Putting your rooms back in place",
		de: "Deine Räume werden wieder aufgestellt"
	},
	[`${n}rooms_text_1`]: {
		en: "Names, pictures, members and the latest messages.",
		de: "Namen, Bilder, Mitglieder und die neuesten Nachrichten."
	},
	[`${n}rooms_text_2`]: {
		en: "Almost there.",
		de: "Fast geschafft."
	},
	[`${n}rooms_count`]: {
		en: "%(done)s of %(total)s rooms",
		de: "%(done)s von %(total)s Räumen"
	},
	[`${n}rooms_count_open_one`]: {
		en: "%(done)s room",
		de: "%(done)s Raum"
	},
	[`${n}rooms_count_open_other`]: {
		en: "%(done)s rooms",
		de: "%(done)s Räume"
	},
	[`${n}download_title_1`]: {
		en: "Fetching your conversations from %(server)s",
		de: "Deine Unterhaltungen werden von %(server)s geholt"
	},
	[`${n}download_title_2`]: {
		en: "Asking %(server)s for your rooms",
		de: "%(server)s wird nach deinen Räumen gefragt"
	},
	[`${n}download_text_1`]: {
		en: "The first start on a device takes longest. Next time Element remembers, and it's much quicker.",
		de: "Der erste Start auf einem Gerät dauert am längsten. Beim nächsten Mal weiß Element es schon, dann geht es viel schneller."
	},
	[`${n}download_text_2`]: {
		en: "Your server collects everything that happened in your rooms and sends it in one go.",
		de: "Dein Server sammelt alles, was in deinen Räumen passiert ist, und schickt es in einem Rutsch."
	},
	[`${n}waiting_title_1`]: {
		en: "Waiting for %(server)s",
		de: "Warten auf %(server)s"
	},
	[`${n}waiting_text_1`]: {
		en: "Your connection or the server is slow to answer. Element keeps trying.",
		de: "Deine Verbindung oder der Server antwortet langsam. Element versucht es weiter."
	},
	[`${n}ready_title_1`]: {
		en: "All set",
		de: "Alles bereit"
	},
	[`${n}ready_text_1`]: {
		en: "Here you go.",
		de: "Bitte sehr."
	},
	[`${n}step_session`]: {
		en: "Sign-in",
		de: "Anmeldung"
	},
	[`${n}step_storage`]: {
		en: "This device",
		de: "Dieses Gerät"
	},
	[`${n}step_keys`]: {
		en: "Keys",
		de: "Schlüssel"
	},
	[`${n}step_rooms`]: {
		en: "Rooms",
		de: "Räume"
	},
	[`${n}your_device`]: {
		en: "This device",
		de: "Dieses Gerät"
	},
	[`${n}your_server`]: {
		en: "Your server",
		de: "Dein Server"
	},
	[`${n}fact_rooms_one`]: {
		en: "You're in %(rooms)s room.",
		de: "Du bist in %(rooms)s Raum."
	},
	[`${n}fact_rooms_other`]: {
		en: "You're in %(rooms)s rooms.",
		de: "Du bist in %(rooms)s Räumen."
	},
	[`${n}fact_rooms_spaces`]: {
		en: "You're in %(rooms)s rooms across %(spaces)s spaces.",
		de: "Du bist in %(rooms)s Räumen in %(spaces)s Spaces."
	},
	[`${n}fact_people`]: {
		en: "You share rooms with %(people)s people.",
		de: "Du teilst Räume mit %(people)s Personen."
	},
	[`${n}fact_servers`]: {
		en: "Your rooms reach %(servers)s servers. Matrix connects them, the way email connects mail providers.",
		de: "Deine Räume reichen über %(servers)s Server. Matrix verbindet sie, so wie E-Mail verschiedene Anbieter verbindet."
	},
	[`${n}fact_encrypted`]: {
		en: "%(encrypted)s of your rooms are end-to-end encrypted.",
		de: "%(encrypted)s deiner Räume sind Ende-zu-Ende-verschlüsselt."
	},
	[`${n}fact_dms`]: {
		en: "You have %(dms)s direct chats.",
		de: "Du hast %(dms)s Direktnachrichten."
	},
	[`${n}fact_unread_one`]: {
		en: "One room had something new when you left.",
		de: "In einem Raum gab es Neues, als du gegangen bist."
	},
	[`${n}fact_unread_other`]: {
		en: "%(unread)s rooms had something new when you left.",
		de: "In %(unread)s Räumen gab es Neues, als du gegangen bist."
	},
	[`${n}fact_last_seen`]: {
		en: "You were last here %(ago)s.",
		de: "Du warst zuletzt %(ago)s hier."
	},
	[`${n}fact_home`]: {
		en: "Your account lives on %(server)s. You can talk to people on any other Matrix server.",
		de: "Dein Konto liegt auf %(server)s. Du kannst mit Leuten auf jedem anderen Matrix-Server schreiben."
	},
	[`${n}fact_open`]: {
		en: "Matrix is open: anyone can run a server, and they all talk to each other.",
		de: "Matrix ist offen: Jeder kann einen Server betreiben, und alle sprechen miteinander."
	},
	[`${n}fact_copy`]: {
		en: "Element keeps a copy of your rooms on this device, so it starts quicker next time.",
		de: "Element speichert eine Kopie deiner Räume auf diesem Gerät, damit der nächste Start schneller geht."
	},
	[`${n}fact_decrypt`]: {
		en: "Encrypted messages are unlocked on your device, never on the server.",
		de: "Verschlüsselte Nachrichten werden auf deinem Gerät entsperrt, nie auf dem Server."
	},
	[`${n}fact_shield`]: {
		en: "A green shield next to a device means it's been verified: it's really that person.",
		de: "Ein grünes Schild neben einem Gerät heißt: Es wurde verifiziert, es ist wirklich diese Person."
	},
	[`${n}fact_ctrl_k`]: {
		en: "Tip: Ctrl+K takes you to any room by name.",
		de: "Tipp: Mit Strg+K kommst du per Name in jeden Raum."
	},
	[`${n}fact_click`]: {
		en: "Tip: click a room now, and Element opens it as soon as it's ready.",
		de: "Tipp: Klick schon jetzt auf einen Raum, Element öffnet ihn, sobald es bereit ist."
	}
}, i = [
	"session",
	"storage",
	"keys",
	"rooms"
], a = class {
	fresh;
	win;
	now;
	keysAt;
	constructor(e = !1, t = window, n = Date.now) {
		this.fresh = e, this.win = t, this.now = n;
	}
	read() {
		let e;
		try {
			e = this.win.mxMatrixClientPeg?.get?.();
		} catch {
			e = void 0;
		}
		if (!e) return {
			stage: "session",
			rooms: 0
		};
		let t = o(() => e.getDomain?.() ?? void 0), n = o(() => e.getHomeserverUrl?.()), r = o(() => e.getRooms?.().length) ?? 0, i = {
			rooms: r,
			server: t,
			baseUrl: n
		}, a = o(() => e.getSyncState?.());
		return a === "PREPARED" || a === "SYNCING" || a === "CATCHUP" ? {
			...i,
			stage: "ready"
		} : a === "ERROR" || a === "RECONNECTING" ? {
			...i,
			stage: "waiting"
		} : e.store?.startedUp === !1 ? {
			...i,
			stage: "storage"
		} : o(() => e.getCrypto?.()) ? (this.keysAt ??= this.now(), r > 0 ? {
			...i,
			stage: "rooms"
		} : this.fresh || this.now() - this.keysAt >= 2500 ? {
			...i,
			stage: "download"
		} : {
			...i,
			stage: "rooms"
		}) : {
			...i,
			stage: "keys"
		};
	}
};
function o(e) {
	try {
		return e();
	} catch {
		return;
	}
}
function s(e, t) {
	if (typeof PerformanceObserver > "u") return () => {};
	let n;
	try {
		n = new PerformanceObserver((n) => {
			for (let r of n.getEntries()) e(r.name) && t();
		}), n.observe({
			type: "resource",
			buffered: !1
		});
	} catch {
		return () => {};
	}
	return () => n.disconnect();
}
var c = "speed-start-card", l = 4500, u = 12, d = {
	session: 2,
	storage: 2,
	keys: 2,
	rooms: 2,
	download: 2,
	waiting: 1,
	ready: 1
}, f = class {
	opts;
	el;
	title;
	text;
	count;
	fill;
	fact;
	scene;
	pulses;
	shelf;
	steps = /* @__PURE__ */ new Map();
	variant;
	facts;
	factIndex = 0;
	factTimer;
	stage;
	shown = 0;
	random;
	constructor(e, t = document) {
		this.opts = e, this.random = e.random ?? Math.random;
		let r = (e) => 1 + Math.floor(this.random() * e);
		this.variant = Object.fromEntries(Object.entries(d).map(([e, t]) => [e, r(t)]));
		let a = t.createElement("div");
		a.className = c, a.setAttribute("role", "status"), a.setAttribute("data-testid", "speed-start-card"), a.style.setProperty("--ss-accent", `var(--cpd-color-text-decorative-${r(6)}, var(--cpd-color-text-action-accent, #0b7a52))`), a.classList.add(`${c}_${this.random() < .5 ? "pop" : "fly"}`), a.innerHTML = `
            <div class="${c}_scene">
                <div class="${c}_node ${c}_device">${v}<span></span></div>
                <div class="${c}_track"><i></i><i></i><i></i><div class="${c}_lock">${y}</div><div class="${c}_pulses"></div></div>
                <div class="${c}_node ${c}_server">${ee}<span></span></div>
            </div>
            <div class="${c}_shelf"></div>
            <div class="${c}_title"></div>
            <div class="${c}_text"></div>
            <div class="${c}_meter"><div class="${c}_fill"></div></div>
            <div class="${c}_row"><ol class="${c}_steps"></ol><span class="${c}_count"></span></div>
            <div class="${c}_fact"></div>`;
		let o = (e) => a.querySelector(`.${c}_${e}`);
		this.el = a, this.scene = o("scene"), this.title = o("title"), this.text = o("text"), this.count = o("count"), this.fill = o("fill"), this.fact = o("fact"), this.pulses = o("pulses"), this.shelf = o("shelf"), o("device").querySelector("span").textContent = e.t(`${n}your_device`), o("server").querySelector("span").textContent = e.stats?.server ?? e.t("datanauten_speed_start_your_server");
		let s = o("steps");
		for (let r of i) {
			let i = t.createElement("li");
			i.textContent = e.t(`${n}step_${r}`), s.appendChild(i), this.steps.set(r, i);
		}
		this.buildShelf(t);
		let { own: l, general: u } = m(e);
		this.facts = g(_(l, this.random), _(u, this.random)), this.showFact();
	}
	start() {
		this.factTimer === void 0 && this.facts.length > 1 && (this.factTimer = window.setInterval(() => this.showFact(), l));
	}
	dispose() {
		this.factTimer !== void 0 && clearInterval(this.factTimer), this.factTimer = void 0;
	}
	update(e) {
		let { t } = this.opts, r = e.server ?? this.opts.stats?.server ?? "";
		if (e.server && (this.el.querySelector(`.${c}_server span`).textContent = e.server), e.stage !== this.stage) {
			this.stage = e.stage, this.scene.setAttribute("data-stage", e.stage), this.el.setAttribute("data-stage", e.stage);
			let a = this.variant[e.stage];
			this.title.textContent = t(`${n}${e.stage}_title_${a}`, { server: r }), this.text.textContent = t(`${n}${e.stage}_text_${a}`, { server: r });
			let o = p(e.stage);
			i.forEach((t, n) => {
				let r = this.steps.get(t);
				r.className = e.stage === "ready" || n < o ? `${c}_done` : n === o ? `${c}_now` : "";
			});
		}
		let a = this.opts.stats?.rooms ? this.opts.stats.rooms + this.opts.stats.spaces : 0, o = e.stage === "rooms" || e.stage === "download", s = a ? Math.min(e.rooms, a) : e.rooms;
		o && e.rooms > 0 ? this.count.textContent = a ? t(`${n}rooms_count`, {
			done: this.num(s),
			total: this.num(a)
		}) : t(`${n}rooms_count_open_${e.rooms === 1 ? "one" : "other"}`, { done: this.num(e.rooms) }) : this.count.textContent = "";
		let l = e.stage === "ready" ? 1 : (p(e.stage) + (o && a ? s / a : .35)) / i.length;
		this.fill.style.transform = `scaleX(${l.toFixed(3)})`;
		let u = this.shelf.children.length, d = e.stage === "ready" ? u : o ? a ? Math.round(s / a * u) : Math.min(u, e.rooms) : 0;
		for (let e = this.shown; e < d; e++) this.shelf.children[e].classList.add(`${c}_in`);
		this.shown = Math.max(this.shown, d);
	}
	pulse() {
		if (this.pulses.childElementCount > 6) return;
		let e = this.el.ownerDocument.createElement("i");
		e.addEventListener("animationend", () => e.remove()), this.pulses.appendChild(e), window.setTimeout(() => e.remove(), 1500), this.el.querySelector(`.${c}_server`).classList.remove(`${c}_blink`), this.el.offsetWidth, this.el.querySelector(`.${c}_server`).classList.add(`${c}_blink`);
	}
	buildShelf(e) {
		let t = this.opts.stats ? this.opts.stats.rooms + this.opts.stats.spaces : u, n = Math.max(1, Math.min(u, t || u));
		for (let t = 0; t < n; t++) {
			let n = e.createElement("span"), r = this.opts.avatars[t];
			if (r) {
				let e = r.cloneNode(!0);
				e.style.setProperty("--cpd-avatar-size", "26px"), n.appendChild(e);
			} else n.style.background = `var(--cpd-color-text-decorative-${1 + t % 6}, #888)`;
			n.style.setProperty("--i", String(t)), this.shelf.appendChild(n);
		}
	}
	showFact() {
		if (!this.facts.length) return;
		let e = this.facts[this.factIndex % this.facts.length];
		this.factIndex++, this.fact.classList.remove(`${c}_fresh`), this.fact.offsetWidth, this.fact.textContent = e, this.fact.classList.add(`${c}_fresh`);
	}
	num(e) {
		try {
			return new Intl.NumberFormat(this.opts.language).format(e);
		} catch {
			return String(e);
		}
	}
};
function p(e) {
	switch (e) {
		case "session": return 0;
		case "storage": return 1;
		case "keys": return 2;
		default: return 3;
	}
}
function m({ t: e, language: t, stats: r, clickable: i, now: a = Date.now }) {
	let o = (e) => {
		try {
			return new Intl.NumberFormat(t).format(e);
		} catch {
			return String(e);
		}
	}, s = [], c = [];
	if (r) {
		let i = o(r.rooms);
		r.spaces > 0 && r.rooms > 1 ? s.push(e(`${n}fact_rooms_spaces`, {
			rooms: i,
			spaces: o(r.spaces)
		})) : r.rooms > 0 && s.push(e(`${n}fact_rooms_${r.rooms === 1 ? "one" : "other"}`, { rooms: i })), r.people > 1 && s.push(e(`${n}fact_people`, { people: o(r.people) })), r.servers > 1 && s.push(e(`${n}fact_servers`, { servers: o(r.servers) })), r.encrypted > 1 && s.push(e(`${n}fact_encrypted`, { encrypted: o(r.encrypted) })), r.dms > 1 && s.push(e(`${n}fact_dms`, { dms: o(r.dms) })), r.unread > 0 && s.push(e(`${n}fact_unread_${r.unread === 1 ? "one" : "other"}`, { unread: o(r.unread) }));
		let c = h(a() - r.savedAt, t);
		c && s.push(e(`${n}fact_last_seen`, { ago: c })), s.push(e(`${n}fact_home`, { server: r.server }));
	}
	for (let t of [
		"open",
		"copy",
		"decrypt",
		"shield",
		"ctrl_k"
	]) c.push(e(`${n}fact_${t}`));
	return i && c.push(e(`${n}fact_click`)), {
		own: s,
		general: c
	};
}
function h(e, t) {
	for (let [n, r] of [
		["day", 864e5],
		["hour", 36e5],
		["minute", 6e4]
	]) if (e >= r) try {
		return new Intl.RelativeTimeFormat(t, { numeric: "auto" }).format(-Math.floor(e / r), n);
	} catch {
		return "";
	}
	return "";
}
function g(e, t) {
	let n = [];
	for (let r = 0; r < Math.max(e.length, t.length); r++) r < e.length && n.push(e[r]), r < t.length && n.push(t[r]);
	return n;
}
function _(e, t) {
	let n = [...e];
	for (let e = n.length - 1; e > 0; e--) {
		let r = Math.floor(t() * (e + 1));
		[n[e], n[r]] = [n[r], n[e]];
	}
	return n;
}
var v = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19.5h20"/><g class="${c}_bars"><path d="M8 9h8"/><path d="M8 12h5"/></g></svg>`, ee = "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"4\" y=\"4\" width=\"16\" height=\"7\" rx=\"2\"/><rect x=\"4\" y=\"13\" width=\"16\" height=\"7\" rx=\"2\"/><path d=\"M8 7.5h.01M8 16.5h.01\"/></svg>", y = `<svg viewBox="0 0 24 24" aria-hidden="true"><path class="${c}_shackle" d="M8 11V8a4 4 0 0 1 8 0v3"/><rect x="5.5" y="11" width="13" height="9" rx="2"/></svg>`, b = `
.${c} {
    --ss-accent: var(--cpd-color-text-action-accent, #0b7a52);
    position: absolute;
    width: min(380px, calc(100vw - 32px));
    box-sizing: border-box;
    padding: 20px 22px 16px;
    border-radius: 16px;
    background: var(--cpd-color-bg-canvas-default, #fff);
    border: 1px solid var(--cpd-color-border-interactive-secondary, rgba(0, 0, 0, 0.1));
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06);
    color: var(--cpd-color-text-primary, #1b1d22);
    font: var(--cpd-font-body-md-regular, 15px/1.4 Inter, system-ui, sans-serif);
    cursor: default;
    animation: ${c}-enter 420ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}
.${c} svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }

.${c}_scene { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.${c}_node { display: flex; flex-direction: column; align-items: center; gap: 2px; width: 72px; color: var(--cpd-color-icon-secondary, #656d77); transition: color 300ms; }
.${c}_node span { font-size: 11px; line-height: 1.2; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--cpd-color-text-secondary, #656d77); }
.${c}_track { position: relative; flex: 1; height: 26px; }
.${c}_track::before { content: ""; position: absolute; left: 0; right: 0; top: 12px; border-top: 2px dotted var(--cpd-color-border-interactive-primary, #c0c5cc); }
.${c}_track > i, .${c}_pulses > i { position: absolute; top: 9px; left: 0; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: var(--ss-accent); opacity: 0; }
.${c}_pulses > i { animation: ${c}-toDevice 900ms ease-in both; }
.${c}_lock { position: absolute; left: 50%; top: -1px; margin-left: -13px; color: var(--cpd-color-icon-tertiary, #9aa0a8); opacity: 0; transform: scale(0.6); transition: opacity 300ms, transform 300ms, color 300ms; background: var(--cpd-color-bg-canvas-default, #fff); border-radius: 50%; }
.${c}_shackle { transition: transform 400ms cubic-bezier(0.3, 1.6, 0.5, 1); transform-origin: 16px 11px; }
.${c}_bars path { opacity: 0.25; }

/* session: the device looks for its saved login */
.${c}_scene[data-stage="session"] .${c}_device { color: var(--ss-accent); animation: ${c}-breathe 1.4s ease-in-out infinite; }
/* storage: the device reads its copy, line by line */
.${c}_scene[data-stage="storage"] .${c}_device { color: var(--ss-accent); }
.${c}_scene[data-stage="storage"] .${c}_bars path { animation: ${c}-read 900ms ease-in-out infinite; }
.${c}_scene[data-stage="storage"] .${c}_bars path + path { animation-delay: 300ms; }
/* keys: a lock sits on the line and wiggles until it opens */
.${c}_scene[data-stage="keys"] .${c}_lock { opacity: 1; transform: scale(1); color: var(--ss-accent); animation: ${c}-wiggle 1.2s ease-in-out infinite; }
.${c}_scene[data-stage="rooms"] .${c}_lock,
.${c}_scene[data-stage="download"] .${c}_lock,
.${c}_scene[data-stage="ready"] .${c}_lock { opacity: 1; transform: scale(0.8); color: var(--cpd-color-icon-success-primary, #0b7a52); }
.${c}_scene[data-stage="rooms"] .${c}_shackle,
.${c}_scene[data-stage="download"] .${c}_shackle,
.${c}_scene[data-stage="ready"] .${c}_shackle { transform: translateY(-3px) rotate(-28deg); }
/* download: a steady stream from the server */
.${c}_scene[data-stage="download"] .${c}_server, .${c}_scene[data-stage="waiting"] .${c}_server { color: var(--ss-accent); }
.${c}_scene[data-stage="download"] .${c}_track > i { animation: ${c}-toDevice 1.2s linear infinite; }
.${c}_scene[data-stage="download"] .${c}_track > i:nth-child(2) { animation-delay: 400ms; }
.${c}_scene[data-stage="download"] .${c}_track > i:nth-child(3) { animation-delay: 800ms; }
/* waiting: the device keeps calling */
.${c}_scene[data-stage="waiting"] .${c}_track > i { animation: ${c}-toServer 1.6s ease-in-out infinite; background: var(--cpd-color-icon-secondary, #656d77); }
.${c}_server.${c}_blink { animation: ${c}-blink 500ms ease-out; }

.${c}_shelf { display: flex; flex-wrap: wrap; gap: 6px; min-height: 26px; margin-bottom: 12px; }
.${c}_shelf > span { width: 26px; height: 26px; border-radius: 50%; overflow: hidden; opacity: 0.15; transform: scale(0.7); transition: opacity 260ms, transform 360ms cubic-bezier(0.2, 1.4, 0.4, 1); transition-delay: calc(var(--i) * 25ms); }
.${c}_shelf > span > * { width: 26px; height: 26px; }
.${c}_shelf > span img { width: 100%; height: 100%; object-fit: cover; display: block; }
.${c}_fly .${c}_shelf > span { transform: translate(-40px, -30px) scale(0.3); }
.${c}_shelf > span.${c}_in { opacity: 1; transform: none; }

.${c}_title { font: var(--cpd-font-heading-sm-semibold, 600 18px/1.3 Inter, system-ui, sans-serif); margin-bottom: 4px; }
.${c}_text { color: var(--cpd-color-text-secondary, #656d77); font-size: 14px; min-height: 2.8em; }
.${c}_meter { height: 4px; border-radius: 2px; margin: 12px 0 8px; background: var(--cpd-color-bg-subtle-primary, #e1e6ec); overflow: hidden; }
.${c}_fill { height: 100%; background: var(--ss-accent); transform-origin: left; transform: scaleX(0.05); transition: transform 400ms ease-out; }
.${c}_row { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; color: var(--cpd-color-text-secondary, #656d77); }
.${c}_steps { display: flex; gap: 10px; margin: 0; padding: 0; list-style: none; }
.${c}_steps li { display: flex; align-items: center; gap: 4px; opacity: 0.55; transition: opacity 300ms; }
.${c}_steps li::before { content: ""; width: 7px; height: 7px; border-radius: 50%; border: 1.5px solid currentColor; box-sizing: border-box; }
.${c}_steps li.${c}_now { opacity: 1; color: var(--cpd-color-text-primary, #1b1d22); }
.${c}_steps li.${c}_now::before { border-color: var(--ss-accent); animation: ${c}-breathe 1.2s ease-in-out infinite; }
.${c}_steps li.${c}_done { opacity: 1; }
.${c}_steps li.${c}_done::before { background: var(--ss-accent); border-color: var(--ss-accent); }
.${c}_count { font-variant-numeric: tabular-nums; white-space: nowrap; }
.${c}_fact { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--cpd-color-border-disabled, #e8eaed); font-size: 13px; color: var(--cpd-color-text-secondary, #656d77); min-height: 2.8em; }
.${c}_fact.${c}_fresh { animation: ${c}-fact 500ms ease-out; }

@keyframes ${c}-enter { from { opacity: 0; transform: translateY(12px) scale(0.97); } }
@keyframes ${c}-breathe { 50% { transform: scale(1.12); opacity: 0.75; } }
@keyframes ${c}-read { 50% { opacity: 1; } }
@keyframes ${c}-wiggle { 0%, 60%, 100% { transform: rotate(0); } 70% { transform: rotate(-10deg); } 80% { transform: rotate(8deg); } 90% { transform: rotate(-4deg); } }
@keyframes ${c}-toDevice { 0% { left: 100%; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { left: 0; opacity: 0; } }
@keyframes ${c}-toServer { 0% { left: 0; opacity: 0; } 20% { opacity: 0.8; } 70% { opacity: 0.8; } 100% { left: 70%; opacity: 0; } }
@keyframes ${c}-blink { 30% { color: var(--ss-accent); transform: scale(1.08); } }
@keyframes ${c}-fact { from { opacity: 0; transform: translateY(4px); } }
@media (prefers-reduced-motion: reduce) {
    .${c}, .${c} * { animation: none !important; transition: none !important; }
    .${c}_pulses { display: none; }
}
`, x = "de.datanauten.speed_start.snapshot", S = "data-speed-start-room", C = "canvas,video,audio,iframe,input,textarea,script,noscript,template,.mx_AuxPanel,.mx_RoomView_statusArea,.mx_RightPanel,.mx_AppsDrawer,.mx_PinnedMessageBanner,.mx_RoomCallBanner,.mx_ThreadsActivityCentre_container,[data-radix-popper-content-wrapper]", w = /* @__PURE__ */ new Set([
	"id",
	"title",
	"href",
	"src",
	"srcset",
	"tabindex",
	"placeholder",
	"contenteditable",
	"autofocus",
	"draggable",
	"for",
	"name",
	"value"
]);
function T(e = document) {
	let t = e.querySelector("script[src*=\"bundles/\"]")?.getAttribute("src") ?? "";
	return /bundles\/([^/]+)\//.exec(t)?.[1] ?? "";
}
function E({ doc: e, userId: t, rooms: n, avatars: r, now: i = Date.now() }) {
	let a = e.querySelector("#matrixchat .mx_MatrixChat");
	if (!a?.querySelector(".mx_RoomListPanel")) return null;
	let o = a.cloneNode(!0), s = D(n);
	for (let e of o.querySelectorAll(".mx_RoomListItemView")) {
		let t = e.querySelector("[data-testid=\"room-name\"]");
		if (!t) {
			e.remove();
			continue;
		}
		let n = t.nextElementSibling;
		for (; n;) {
			let e = n.nextElementSibling;
			n.remove(), n = e;
		}
		let r = t.parentElement?.nextElementSibling;
		for (; r && r.nextElementSibling;) {
			let e = r.nextElementSibling;
			r.remove(), r = e;
		}
		let i = s.get(t.getAttribute("title") ?? t.textContent ?? "");
		i && e.setAttribute(S, i);
	}
	let c = o.querySelector(".mx_RoomView_wrapper");
	if (c) {
		let e = c.querySelector(".mx_RoomView");
		if (e) {
			for (let t of e.querySelectorAll(".mx_RoomView_timeline")) t.replaceChildren();
			for (let t of e.querySelectorAll(".mx_MessageComposer [contenteditable], .mx_BasicMessageComposer_input")) t.replaceChildren();
			for (let t of e.querySelectorAll(".mx_RoomHeader_topic")) t.remove();
		} else c.replaceChildren();
	}
	for (let e of o.querySelectorAll(C)) e.remove();
	te(o, r);
	let l = o.outerHTML;
	return l.length > 6e5 ? null : {
		format: 1,
		userId: t,
		build: T(e),
		savedAt: i,
		width: e.defaultView?.innerWidth ?? 0,
		html: l
	};
}
function D(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) t.has(n.name) || t.set(n.name, n.id);
	return t;
}
function te(e, t) {
	for (let n of [e, ...e.querySelectorAll("*")]) if (n instanceof HTMLImageElement) {
		let e = t.get(n.currentSrc || n.getAttribute("src") || "");
		if (!e) {
			n.remove();
			continue;
		}
		n.setAttribute("src", e), n.removeAttribute("srcset"), n.setAttribute("alt", ""), O(n, ["src"]);
	} else O(n);
}
function O(e, t = []) {
	for (let { name: n } of [...e.attributes]) t.includes(n) || (w.has(n) || n.startsWith("aria-") || n.startsWith("on") ? e.removeAttribute(n) : n === "style" && /url\(/i.test(e.getAttribute("style") ?? "") && e.setAttribute("style", (e.getAttribute("style") ?? "").replace(/[\w-]+\s*:[^;]*url\([^)]*\)[^;]*;?/gi, "")));
}
function k(e, t = localStorage) {
	try {
		t.setItem(x, JSON.stringify(e));
	} catch (e) {
		console.warn("[speed-start] Couldn't store the snapshot", e);
	}
}
function A(e = localStorage) {
	try {
		e.removeItem(x);
	} catch {}
}
function j(e = localStorage, t = document, n = Date.now()) {
	let r;
	try {
		let t = e.getItem(x);
		if (!t) return null;
		r = JSON.parse(t);
	} catch {
		return null;
	}
	let i = e.getItem("mx_user_id");
	return e.getItem("mx_has_access_token") !== "true" || !i ? null : r.userId === i ? r.format !== 1 || typeof r.html != "string" || r.build !== T(t) || n - r.savedAt > 12096e5 ? null : r : (A(e), null);
}
// src/overlay.ts
function M(e = document) {
	let t = e.getElementById("matrixchat");
	return t?.firstElementChild ? t.querySelector(".mx_LoginSplashView_syncError") ? "other" : t.querySelector(".mx_MatrixChat_splash") ? "loading" : t.querySelector(".mx_MatrixChat .mx_RoomListPanel") ? "ready" : "other" : "booting";
}
function N(e) {
	if (/^#\/(login|register|welcome|forgot_password|start_sso|start_cas|soft_logout)\b/.test(e.hash)) return !1;
	let t = new URLSearchParams(e.search);
	return !(t.has("loginToken") || t.has("code") && t.has("state"));
}
var P = "speed-start-snapshot", F = 160, I = 250, L = class {
	snapshot;
	opts;
	host;
	observer;
	timers = [];
	intervals = [];
	pendingRoom = null;
	readyAt;
	done = !1;
	undecorate;
	doc;
	constructor(e, t = {}) {
		this.snapshot = e, this.opts = t, this.doc = t.doc ?? document;
	}
	get shown() {
		return !!this.host?.isConnected;
	}
	show() {
		let e = this.doc, t = e.createElement("div");
		if (t.className = P, t.setAttribute("data-testid", "speed-start-snapshot"), this.snapshot) {
			let n = e.createElement("div");
			n.className = "mx_MatrixChat_wrapper", n.setAttribute("aria-hidden", "true"), n.innerHTML = this.snapshot.html, t.appendChild(n);
		}
		t.addEventListener("click", this.onClick, !0), e.body.appendChild(t), this.host = t, this.undecorate = this.opts.decorate?.(t), this.observer = new MutationObserver(() => this.check());
		let n = e.getElementById("matrixchat");
		n && this.observer.observe(n, {
			childList: !0,
			subtree: !0
		}), this.timers.push(window.setTimeout(() => this.remove(!1), this.opts.timeoutMs ?? 6e4)), this.opts.hold && this.intervals.push(window.setInterval(() => this.check(), I)), this.check();
	}
	remove(e = !0) {
		if (this.done) return;
		this.done = !0, this.observer?.disconnect();
		for (let e of this.timers) clearTimeout(e);
		for (let e of this.intervals) clearInterval(e);
		this.undecorate?.();
		let t = this.host;
		t && (t.removeEventListener("click", this.onClick, !0), e ? (t.classList.add(`${P}_out`), window.setTimeout(() => t.remove(), F)) : t.remove()), this.opts.onHandover?.(this.pendingRoom);
	}
	check() {
		if (!this.done) switch (M(this.doc)) {
			case "booting":
			case "loading": return;
			case "other":
				if (this.opts.hold?.()) return;
				this.remove(!!this.opts.hold);
				return;
			case "ready": {
				let e = this.doc.querySelector("#matrixchat .mx_RoomListItemView"), t = this.opts.rowsGraceMs ?? 1500;
				this.readyAt === void 0 && (this.readyAt = Date.now(), e || this.timers.push(window.setTimeout(() => this.check(), t))), (e || Date.now() - this.readyAt >= t) && requestAnimationFrame(() => requestAnimationFrame(() => this.remove(!0)));
			}
		}
	}
	onClick = (e) => {
		e.preventDefault(), e.stopPropagation();
		let t = e.target?.closest?.(`[${S}]`);
		t && (this.host?.querySelector(`.${P}_picked`)?.classList.remove(`${P}_picked`), t.classList.add(`${P}_picked`), this.pendingRoom = t.getAttribute(S));
	};
}, R = `
.${P} {
    position: fixed;
    inset: 0;
    z-index: 3000;
    background: var(--cpd-color-bg-canvas-default, #fff);
    cursor: progress;
    opacity: 1;
    transition: opacity ${F}ms ease-out;
}
.${P} > .mx_MatrixChat_wrapper { height: 100%; }
.${P} > .mx_MatrixChat_wrapper * { animation: none !important; }
.${P}_out { opacity: 0; pointer-events: none; }
.${P}_picked { background: var(--cpd-color-bg-action-secondary-pressed, rgba(0, 0, 0, 0.08)) !important; }
`, z = "de.datanauten.speed_start.stats", B = 1, V = 5e4;
function H(e, t, n = Date.now()) {
	let r = e.getDomain();
	if (!r) return null;
	let i = e.getRooms().filter((e) => (e.getMyMembership?.() ?? "join") === "join"), a = /* @__PURE__ */ new Set(), o = e.getAccountData?.("m.direct")?.getContent() ?? {};
	for (let e of Object.values(o)) if (Array.isArray(e)) for (let t of e) a.add(String(t));
	let s = /* @__PURE__ */ new Set(), c = /* @__PURE__ */ new Set([r]), l = 0, u = 0, d = 0, f = 0, p = 0, m = 0;
	for (let e of i) if (e.isSpaceRoom?.()) d++;
	else if (u++, a.has(e.roomId) && f++, e.hasEncryptionStateEvent?.() && p++, (e.getUnreadNotificationCount?.() ?? 0) > 0 && m++, !(l >= V)) for (let n of e.getJoinedMembers?.() ?? []) {
		if (l++, n.userId === t) continue;
		s.add(n.userId);
		let e = n.userId.slice(n.userId.indexOf(":") + 1);
		e && c.add(e);
	}
	return {
		format: B,
		userId: t,
		savedAt: n,
		server: r,
		rooms: u,
		spaces: d,
		dms: f,
		encrypted: p,
		unread: m,
		people: s.size,
		servers: c.size
	};
}
function U(e, t = localStorage) {
	try {
		t.setItem(z, JSON.stringify(e));
	} catch {}
}
function W(e = localStorage) {
	try {
		let t = e.getItem(z);
		if (!t) return null;
		let n = JSON.parse(t), r = e.getItem("mx_user_id");
		return n.format !== B || !r ? null : n.userId === r ? n : (e.removeItem(z), null);
	} catch {
		return null;
	}
}
// src/index.ts
var G = "de-datanauten-speed-start-style", K = 6e4, q = 5e3, J = .4, Y = 200, X = 6e5, Z = 12, Q = class {
	api;
	static moduleApiVersion = "^2.0.0";
	overlay;
	avatars = new e();
	timers = [];
	lastCapture = 0;
	loginWatch;
	constructor(e) {
		this.api = e;
	}
	async load() {
		if (this.api.i18n.register(r), N(window.location) && $()) {
			let e = j();
			this.showOverlay(e && ne(e) ? e : null, !1);
		} else this.watchForLogin();
		this.startCapturing().catch((e) => console.warn("[speed-start] Capturing failed", e));
	}
	dispose() {
		this.overlay?.remove(!1), this.loginWatch?.disconnect();
		for (let e of this.timers) clearInterval(e);
		document.removeEventListener("visibilitychange", this.onVisibility), window.removeEventListener("pagehide", this.onPageHide);
	}
	showOverlay(e, t) {
		ie();
		let n = new a(!0);
		this.overlay = new L(e, {
			timeoutMs: e ? void 0 : X,
			hold: t ? () => $() && n.read().stage !== "ready" : void 0,
			onHandover: (e) => {
				e && this.api.navigation.openRoom(e);
			},
			decorate: (n) => this.decorate(n, !!e, t)
		}), this.overlay.show();
	}
	decorate(e, t, n) {
		let r = (e, t) => this.api.i18n.translate(e, t), i = [...e.querySelectorAll(".mx_RoomListPanel .mx_BaseAvatar")].slice(0, Z), o = new f({
			t: r,
			language: this.api.i18n.language,
			stats: n ? null : W(),
			avatars: i,
			clickable: t
		});
		e.appendChild(o.el);
		let c = () => re(o.el, e);
		c();
		let l = new a(n), u = () => o.update(l.read());
		u(), o.start();
		let d = window.setInterval(u, Y), p = s((e) => e.includes("/_matrix/"), () => o.pulse());
		return window.addEventListener("resize", c), () => {
			clearInterval(d), o.dispose(), p(), window.removeEventListener("resize", c);
		};
	}
	watchForLogin() {
		let e = document.getElementById("matrixchat");
		e && typeof MutationObserver < "u" && !$() && (this.loginWatch = new MutationObserver(() => {
			M() === "ready" ? this.loginWatch?.disconnect() : $() && !this.overlay?.shown && (this.loginWatch?.disconnect(), this.showOverlay(null, !0));
		}), this.loginWatch.observe(e, {
			childList: !0,
			subtree: !0
		}));
	}
	async startCapturing() {
		await this.api.stores.roomListStore.waitForReady(), document.addEventListener("visibilitychange", this.onVisibility), window.addEventListener("pagehide", this.onPageHide), this.timers.push(window.setInterval(this.tick, q));
	}
	tick = () => {
		if (document.visibilityState !== "visible" || Date.now() - this.lastCapture < K) return;
		let e = () => {
			this.avatars.refresh(), this.captureNow(), this.captureStats();
		};
		"requestIdleCallback" in window ? window.requestIdleCallback(e, { timeout: 5e3 }) : e();
	};
	onVisibility = () => {
		document.visibilityState === "hidden" && this.onPageHide();
	};
	onPageHide = () => {
		this.captureNow();
		let e = W();
		e && U({
			...e,
			savedAt: Date.now()
		});
	};
	captureStats() {
		let e = localStorage.getItem("mx_user_id"), t;
		try {
			t = window.mxMatrixClientPeg?.get?.();
		} catch {
			return;
		}
		if (e && t && typeof t.getRooms == "function") try {
			let n = H(t, e);
			n && U(n);
		} catch (e) {
			console.warn("[speed-start] Couldn't count the rooms", e);
		}
	}
	captureNow = () => {
		let e = localStorage.getItem("mx_user_id");
		if (!e) return;
		let t;
		try {
			t = this.api.stores.roomListStore.getRooms().value.map((e) => ({
				id: e.id,
				name: e.name.value
			}));
		} catch {
			return;
		}
		let n = E({
			doc: document,
			userId: e,
			rooms: t,
			avatars: this.avatars.map
		});
		n && (k(n), this.lastCapture = Date.now());
	};
};
function ne(e) {
	return !e.width || Math.abs(window.innerWidth - e.width) / e.width <= J;
}
function $(e = localStorage) {
	try {
		return e.getItem("mx_has_access_token") === "true" && !!e.getItem("mx_user_id");
	} catch {
		return !1;
	}
}
function re(e, t) {
	let n = t.querySelector(".mx_RoomView_wrapper")?.getBoundingClientRect(), r = n && n.width >= 420 && n.height >= 300 ? n : {
		left: 0,
		top: 0,
		width: window.innerWidth,
		height: window.innerHeight
	}, i = e.offsetWidth || 380, a = e.offsetHeight || 300;
	e.style.left = `${Math.max(16, Math.round(r.left + (r.width - i) / 2))}px`, e.style.top = `${Math.max(16, Math.round(r.top + (r.height - a) / 2))}px`;
}
function ie() {
	if (document.getElementById(G)) return;
	let e = document.createElement("style");
	e.id = G, e.textContent = R + b, document.head.appendChild(e);
}
export { Q as SpeedStartModule, Q as default };

//# sourceMappingURL=index.js.map