// \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), t = /* @__PURE__ */ new Set(["m.capability.screenshot", "io.element.requires_client"]), n = /* @__PURE__ */ new Set([
	"org.matrix.msc3869.read_relations",
	"org.matrix.msc3973.user_directory_search",
	"org.matrix.msc4039.upload_file",
	"org.matrix.msc4039.download_file"
]), r = [
	"org.matrix.msc2762.send.event:",
	"org.matrix.msc2762.receive.event:",
	"org.matrix.msc2762.send.state_event:",
	"org.matrix.msc2762.receive.state_event:",
	"org.matrix.msc2762.timeline:",
	"org.matrix.msc3819.send.to_device:",
	"org.matrix.msc3819.receive.to_device:"
], i = /^org\.matrix\.msc2762\.(send|receive)\.state_event:(im\.vector\.modular\.widgets|m\.widget|io\.element\.widgets\.layout)(#|$)/;
function a(e) {
	let a = {
		auto: [],
		ask: [],
		unsupported: []
	};
	for (let o of new Set(e)) t.has(o) ? a.auto.push(o) : i.test(o) ? a.unsupported.push(o) : n.has(o) || r.some((e) => o.startsWith(e) && o.length > e.length) ? a.ask.push(o) : a.unsupported.push(o);
	return a;
}
function o(e) {
	return e.startsWith("org.matrix.msc2762.timeline:") || e.startsWith("org.matrix.msc3819.") || e === "org.matrix.msc3973.user_directory_search";
}
function s(e) {
	let t = /^org\.matrix\.msc2762\.(send|receive)\.(event|state_event):([^#]+)(?:#(.*))?$/.exec(e);
	if (t) {
		let [, e, n, r, i] = t;
		return n === "event" ? r === "m.room.message" ? {
			key: `${e}_message`,
			vars: { msgtype: i || "*" }
		} : {
			key: `${e}_event`,
			vars: { type: r }
		} : {
			key: `${e}_state`,
			vars: {
				type: r,
				state_key: i ?? "*"
			}
		};
	}
	let n = /^org\.matrix\.msc2762\.timeline:(.+)$/.exec(e);
	if (n) return n[1] === "*" ? {
		key: "timeline_any",
		vars: {}
	} : {
		key: "timeline_room",
		vars: { room: n[1] }
	};
	let r = /^org\.matrix\.msc3819\.(send|receive)\.to_device:(.+)$/.exec(e);
	if (r) return {
		key: `${r[1]}_to_device`,
		vars: { type: r[2] }
	};
	switch (e) {
		case "org.matrix.msc3869.read_relations": return {
			key: "read_relations",
			vars: {}
		};
		case "org.matrix.msc3973.user_directory_search": return {
			key: "user_directory",
			vars: {}
		};
		case "org.matrix.msc4039.upload_file": return {
			key: "upload_file",
			vars: {}
		};
		case "org.matrix.msc4039.download_file": return {
			key: "download_file",
			vars: {}
		};
	}
	return {
		key: "unknown",
		vars: { cap: e }
	};
}
var c = "de.datanauten.user_account_widgets";
function l(e) {
	let t = e?.approvals;
	if (!t || typeof t != "object") return {};
	let n = {};
	for (let [e, r] of Object.entries(t)) typeof r?.url == "string" && Array.isArray(r.capabilities) && (n[e] = {
		url: r.url,
		capabilities: r.capabilities.filter((e) => typeof e == "string")
	});
	return n;
}
function u(e, t, n, r) {
	if (r.some((e) => t.startsWith(e))) return [];
	let i = n?.url === t ? new Set(n.capabilities) : /* @__PURE__ */ new Set();
	return e.filter((e) => !i.has(e));
}
function d(e, t, n, r) {
	let i = l(e), a = i[t]?.url === n ? i[t].capabilities : [];
	return i[t] = {
		url: n,
		capabilities: [.../* @__PURE__ */ new Set([...a, ...r])].sort()
	}, {
		...e,
		approvals: i
	};
}
function f(e, t) {
	let n = l(e);
	return delete n[t], {
		...e,
		approvals: n
	};
}
// src/client.ts
function p() {
	let e = window.mxMatrixClientPeg;
	try {
		return e?.get?.() ?? void 0;
	} catch {
		return;
	}
}
function m() {
	let e = window.mxSdkContext?.roomViewStore;
	return typeof e?.getRoomId == "function" && typeof e.on == "function" ? e : void 0;
}
function h(e = p(), t = window.location.hash) {
	let n = m();
	return n ? n.getRoomId() ?? null : g(e, t);
}
function g(e, t) {
	let n = /^#\/room\/([^/?]+)/.exec(t);
	if (!n) return null;
	let r = decodeURIComponent(n[1]);
	return r.startsWith("!") ? r : e?.getRooms().find((e) => e.getCanonicalAlias() === r)?.roomId ?? null;
}
function _(e) {
	let t = m();
	return t?.on("update", e), window.addEventListener("hashchange", e), () => {
		t?.off("update", e), window.removeEventListener("hashchange", e);
	};
}
function v() {
	return /\bcpd-theme-dark/.test(document.documentElement.className) ? "dark" : "light";
}
function y(e) {
	let t = v(), n = new MutationObserver(() => {
		let n = v();
		n !== t && e(t = n);
	});
	return n.observe(document.documentElement, {
		attributes: !0,
		attributeFilter: ["class"]
	}), () => n.disconnect();
}
// src/config.ts
var b = "de.datanauten.user_account_widgets";
function x(e) {
	let t = e && typeof e == "object" ? e : {};
	return {
		suggested: Array.isArray(t.suggested) ? t.suggested.filter((e) => !!e && typeof e.name == "string" && typeof e.url == "string" && S(e.url)) : [],
		approvePrefixes: Array.isArray(t.approve_prefixes) ? t.approve_prefixes.filter((e) => typeof e == "string" && S(e)) : []
	};
}
function S(e) {
	try {
		let { protocol: t } = new URL(e);
		return t === "https:" || t === "http:";
	} catch {
		return !1;
	}
}
// src/i18n.ts
var C = "datanauten_user_account_widgets_", w = Object.fromEntries(Object.entries({
	button: {
		en: "My apps",
		de: "Meine Apps"
	},
	button_open: {
		en: "Open my apps",
		de: "Meine Apps öffnen"
	},
	button_close: {
		en: "Close my apps",
		de: "Meine Apps schließen"
	},
	panel_label: {
		en: "My apps",
		de: "Meine Apps"
	},
	select_label: {
		en: "App",
		de: "App"
	},
	manage: {
		en: "Manage my apps",
		de: "Meine Apps verwalten"
	},
	close: {
		en: "Close",
		de: "Schließen"
	},
	empty: {
		en: "You have no apps yet. Your apps are only yours: they open in every room, and the room doesn't get them.",
		de: "Du hast noch keine Apps. Deine Apps gehören nur dir: Sie öffnen sich in jedem Raum, ohne dass der Raum sie bekommt."
	},
	add_app: {
		en: "Add an app",
		de: "App hinzufügen"
	},
	same_origin: {
		en: "%(url)s is served from Element's own address and could read your session. It is not opened.",
		de: "%(url)s liegt auf Elements eigener Adresse und könnte deine Sitzung lesen. Sie wird nicht geöffnet."
	},
	manage_title: {
		en: "My apps",
		de: "Meine Apps"
	},
	manage_intro: {
		en: "Apps here are stored in your account, not in a room. Open them from the header of any room; they act in the room you open them in.",
		de: "Diese Apps liegen in deinem Konto, nicht in einem Raum. Du öffnest sie in der Kopfzeile jedes Raums; sie arbeiten in dem Raum, in dem du sie öffnest."
	},
	manage_none: {
		en: "No apps yet.",
		de: "Noch keine Apps."
	},
	open: {
		en: "Open",
		de: "Öffnen"
	},
	remove: {
		en: "Remove",
		de: "Entfernen"
	},
	remove_label: {
		en: "Remove %(name)s",
		de: "%(name)s entfernen"
	},
	suggested: {
		en: "Suggested",
		de: "Vorschläge"
	},
	add: {
		en: "Add",
		de: "Hinzufügen"
	},
	add_title: {
		en: "Add by URL",
		de: "Per URL hinzufügen"
	},
	name: {
		en: "Name",
		de: "Name"
	},
	url: {
		en: "Widget URL",
		de: "Widget-URL"
	},
	url_placeholder: {
		en: "https://…",
		de: "https://…"
	},
	url_invalid: {
		en: "Enter an http(s) URL.",
		de: "Gib eine http(s)-URL ein."
	},
	url_same_origin: {
		en: "Widgets can't be served from Element's own address.",
		de: "Widgets dürfen nicht auf Elements eigener Adresse liegen."
	},
	failed: {
		en: "That didn't work: %(error)s",
		de: "Das hat nicht geklappt: %(error)s"
	},
	done: {
		en: "Done",
		de: "Fertig"
	},
	consent_title: {
		en: "Allow “%(name)s”?",
		de: "„%(name)s“ erlauben?"
	},
	consent_intro: {
		en: "This app is yours, not the room's. In this room it asks to:",
		de: "Diese App gehört dir, nicht dem Raum. In diesem Raum möchte sie:"
	},
	consent_broad: {
		en: "reaches beyond this room",
		de: "reicht über diesen Raum hinaus"
	},
	consent_remember: {
		en: "Remember for every room",
		de: "Für alle Räume merken"
	},
	allow: {
		en: "Allow",
		de: "Erlauben"
	},
	deny: {
		en: "Deny",
		de: "Ablehnen"
	},
	send_message: {
		en: "Send messages (%(msgtype)s) as you",
		de: "Nachrichten (%(msgtype)s) in deinem Namen senden"
	},
	receive_message: {
		en: "See messages (%(msgtype)s)",
		de: "Nachrichten (%(msgtype)s) sehen"
	},
	send_event: {
		en: "Send %(type)s events as you",
		de: "%(type)s-Ereignisse in deinem Namen senden"
	},
	receive_event: {
		en: "See %(type)s events",
		de: "%(type)s-Ereignisse sehen"
	},
	send_state: {
		en: "Change room state %(type)s (%(state_key)s)",
		de: "Raumzustand %(type)s (%(state_key)s) ändern"
	},
	receive_state: {
		en: "See room state %(type)s (%(state_key)s)",
		de: "Raumzustand %(type)s (%(state_key)s) sehen"
	},
	timeline_any: {
		en: "Read every room you're in",
		de: "Alle deine Räume lesen"
	},
	timeline_room: {
		en: "Read room %(room)s",
		de: "Raum %(room)s lesen"
	},
	send_to_device: {
		en: "Send %(type)s directly to devices",
		de: "%(type)s direkt an Geräte senden"
	},
	receive_to_device: {
		en: "Receive %(type)s sent directly to your devices",
		de: "%(type)s empfangen, das direkt an deine Geräte geht"
	},
	read_relations: {
		en: "Read replies, threads and reactions",
		de: "Antworten, Threads und Reaktionen lesen"
	},
	user_directory: {
		en: "Search the user directory",
		de: "Das Nutzerverzeichnis durchsuchen"
	},
	upload_file: {
		en: "Upload files",
		de: "Dateien hochladen"
	},
	download_file: {
		en: "Download files shared in the room",
		de: "Im Raum geteilte Dateien herunterladen"
	},
	unknown: {
		en: "%(cap)s",
		de: "%(cap)s"
	}
}).map(([e, t]) => [C + e, t])), ee = /* @__PURE__ */ e(((e, t) => {
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
})), te = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.VideoConferenceCapabilities = e.StickerpickerCapabilities = e.MatrixCapabilities = void 0, e.getTimelineRoomIDFromCapability = i, e.isTimelineCapability = n, e.isTimelineCapabilityFor = r;
	var t = /*#__PURE__*/ function(e) {
		return e.Screenshots = "m.capability.screenshot", e.StickerSending = "m.sticker", e.AlwaysOnScreen = "m.always_on_screen", e.RequiresClient = "io.element.requires_client", e.MSC2931Navigate = "org.matrix.msc2931.navigate", e.MSC3846TurnServers = "town.robin.msc3846.turn_servers", e.MSC3973UserDirectorySearch = "org.matrix.msc3973.user_directory_search", e.MSC4039UploadFile = "org.matrix.msc4039.upload_file", e.MSC4039DownloadFile = "org.matrix.msc4039.download_file", e.MSC4157SendDelayedEvent = "org.matrix.msc4157.send.delayed_event", e.MSC4157UpdateDelayedEvent = "org.matrix.msc4157.update_delayed_event", e.MSC4407SendStickyEvent = "org.matrix.msc4407.send.sticky_event", e.MSC4407ReceiveStickyEvent = "org.matrix.msc4407.receive.sticky_event", e.MSC4515RtcTransports = "org.matrix.msc4515.rtc_transports", e.MSC4533RtcLivekitGetToken = "org.matrix.msc4533.rtc_livekit_get_token", e.MSC4533RtcLivekitDelegateDelayedLeave = "org.matrix.msc4533.rtc_livekit_delegate_delayed_leave", e;
	}({});
	e.MatrixCapabilities = t, e.StickerpickerCapabilities = [t.StickerSending], e.VideoConferenceCapabilities = [t.AlwaysOnScreen];
	function n(e) {
		return e?.startsWith("org.matrix.msc2762.timeline:");
	}
	function r(e, t) {
		return e === `org.matrix.msc2762.timeline:${t}`;
	}
	function i(e) {
		return e.substring(e.indexOf(":") + 1);
	}
})), ne = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.WidgetApiDirection = void 0, e.invertedDirection = n;
	var t = /*#__PURE__*/ function(e) {
		return e.ToWidget = "toWidget", e.FromWidget = "fromWidget", e;
	}({});
	e.WidgetApiDirection = t;
	function n(e) {
		if (e === t.ToWidget) return t.FromWidget;
		if (e === t.FromWidget) return t.ToWidget;
		throw Error("Invalid direction");
	}
})), re = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.UnstableApiVersion = e.MatrixApiVersion = e.CurrentApiVersions = void 0;
	var t = /*#__PURE__*/ function(e) {
		return e.Prerelease1 = "0.0.1", e.Prerelease2 = "0.0.2", e;
	}({});
	e.MatrixApiVersion = t;
	var n = /*#__PURE__*/ function(e) {
		return e.MSC2762 = "org.matrix.msc2762", e.MSC2762_UPDATE_STATE = "org.matrix.msc2762_update_state", e.MSC2871 = "org.matrix.msc2871", e.MSC2873 = "org.matrix.msc2873", e.MSC2931 = "org.matrix.msc2931", e.MSC2974 = "org.matrix.msc2974", e.MSC2876 = "org.matrix.msc2876", e.MSC3819 = "org.matrix.msc3819", e.MSC3846 = "town.robin.msc3846", e.MSC3869 = "org.matrix.msc3869", e.MSC3973 = "org.matrix.msc3973", e.MSC4039 = "org.matrix.msc4039", e.MSC4515 = "org.matrix.msc4515", e.MSC4533 = "org.matrix.msc4533", e;
	}({});
	e.UnstableApiVersion = n, e.CurrentApiVersions = [
		t.Prerelease1,
		t.Prerelease2,
		n.MSC2762,
		n.MSC2762_UPDATE_STATE,
		n.MSC2871,
		n.MSC2873,
		n.MSC2931,
		n.MSC2974,
		n.MSC2876,
		n.MSC3819,
		n.MSC3846,
		n.MSC3869,
		n.MSC3973,
		n.MSC4039,
		n.MSC4515,
		n.MSC4533
	];
})), ie = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.PostmessageTransport = void 0;
	var t = ee(), n = L(), r = ["message"];
	function i(e) {
		"@babel/helpers - typeof";
		return i = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
			return typeof e;
		} : function(e) {
			return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
		}, i(e);
	}
	function a(e, t) {
		if (e == null) return {};
		var n, r, i = o(e, t);
		if (Object.getOwnPropertySymbols) {
			var a = Object.getOwnPropertySymbols(e);
			for (r = 0; r < a.length; r++) n = a[r], t.indexOf(n) === -1 && {}.propertyIsEnumerable.call(e, n) && (i[n] = e[n]);
		}
		return i;
	}
	function o(e, t) {
		if (e == null) return {};
		var n = {};
		for (var r in e) if ({}.hasOwnProperty.call(e, r)) {
			if (t.indexOf(r) !== -1) continue;
			n[r] = e[r];
		}
		return n;
	}
	function s(e, t) {
		var n = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var r = Object.getOwnPropertySymbols(e);
			t && (r = r.filter(function(t) {
				return Object.getOwnPropertyDescriptor(e, t).enumerable;
			})), n.push.apply(n, r);
		}
		return n;
	}
	function c(e) {
		for (var t = 1; t < arguments.length; t++) {
			var n = arguments[t] == null ? {} : arguments[t];
			t % 2 ? s(Object(n), !0).forEach(function(t) {
				y(e, t, n[t]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : s(Object(n)).forEach(function(t) {
				Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
			});
		}
		return e;
	}
	function l(e, t) {
		if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
	}
	function u(e, t) {
		for (var n = 0; n < t.length; n++) {
			var r = t[n];
			r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, b(r.key), r);
		}
	}
	function d(e, t, n) {
		return t && u(e.prototype, t), n && u(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
	}
	function f(e, t) {
		if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
		e.prototype = Object.create(t && t.prototype, { constructor: {
			value: e,
			writable: !0,
			configurable: !0
		} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && p(e, t);
	}
	function p(e, t) {
		return p = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
			return e.__proto__ = t, e;
		}, p(e, t);
	}
	function m(e) {
		var t = _();
		return function() {
			var n, r = v(e);
			if (t) {
				var i = v(this).constructor;
				n = Reflect.construct(r, arguments, i);
			} else n = r.apply(this, arguments);
			return h(this, n);
		};
	}
	function h(e, t) {
		if (t && (i(t) == "object" || typeof t == "function")) return t;
		if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
		return g(e);
	}
	function g(e) {
		if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
		return e;
	}
	function _() {
		try {
			var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
		} catch {}
		return (_ = function() {
			return !!e;
		})();
	}
	function v(e) {
		return v = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
			return e.__proto__ || Object.getPrototypeOf(e);
		}, v(e);
	}
	function y(e, t, n) {
		return (t = b(t)) in e ? Object.defineProperty(e, t, {
			value: n,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[t] = n, e;
	}
	function b(e) {
		var t = x(e, "string");
		return i(t) == "symbol" ? t : t + "";
	}
	function x(e, t) {
		if (i(e) != "object" || !e) return e;
		var n = e[Symbol.toPrimitive];
		if (n !== void 0) {
			var r = n.call(e, t || "default");
			if (i(r) != "object") return r;
			throw TypeError("@@toPrimitive must return a primitive value.");
		}
		return (t === "string" ? String : Number)(e);
	}
	e.PostmessageTransport = /* @__PURE__ */ function(e) {
		f(i, e);
		var t = m(i);
		function i(e, r, a, o) {
			var s;
			return l(this, i), s = t.call(this), s.sendDirection = e, s.transportWindow = a, s.inboundWindow = o, y(g(s), "strictOriginCheck", !1), y(g(s), "targetOrigin", "*"), y(g(s), "timeoutSeconds", 10), y(g(s), "_ready", !1), y(g(s), "_widgetId", void 0), y(g(s), "outboundRequests", /* @__PURE__ */ new Map()), y(g(s), "stopController", new AbortController()), y(g(s), "handleMessage", function(e) {
				if (!s.stopController.signal.aborted && e.data && !(s.strictOriginCheck && e.origin !== globalThis.origin)) {
					var t = e.data;
					if (t.action && t.requestId && t.widgetId) {
						if (t.response) {
							if (t.api !== s.sendDirection) return;
							s.handleResponse(t);
						} else {
							var r = t;
							if (r.api !== (0, n.invertedDirection)(s.sendDirection)) return;
							s.handleRequest(r);
						}
					}
				}
			}), s._widgetId = r, s;
		}
		return d(i, [
			{
				key: "ready",
				get: function() {
					return this._ready;
				}
			},
			{
				key: "widgetId",
				get: function() {
					return this._widgetId || null;
				}
			},
			{
				key: "nextRequestId",
				get: function() {
					for (var e = `widgetapi-${Date.now()}`, t = 0, n = e; this.outboundRequests.has(n);) n = `${e}-${t++}`;
					return this.outboundRequests.set(n, null), n;
				}
			},
			{
				key: "sendInternal",
				value: function(e) {
					console.log(`[PostmessageTransport] Sending object to ${this.targetOrigin}: `, e), this.transportWindow.postMessage(e, this.targetOrigin);
				}
			},
			{
				key: "reply",
				value: function(e, t) {
					return this.sendInternal(c(c({}, e), {}, { response: t }));
				}
			},
			{
				key: "send",
				value: function(e, t) {
					return this.sendComplete(e, t).then(function(e) {
						return e.response;
					});
				}
			},
			{
				key: "sendComplete",
				value: function(e, t) {
					var r = this;
					if (!this.ready || !this.widgetId) return Promise.reject(/* @__PURE__ */ Error("Not ready or unknown widget ID"));
					var i = {
						api: this.sendDirection,
						widgetId: this.widgetId,
						requestId: this.nextRequestId,
						action: e,
						data: t
					};
					return e === n.WidgetApiToWidgetAction.UpdateVisibility && (i.visible = t.visible), new Promise(function(e, t) {
						var n = function(t) {
							c(), e(t);
						}, a = function(e) {
							c(), t(e);
						}, o = setTimeout(function() {
							return a(/* @__PURE__ */ Error("Request timed out"));
						}, (r.timeoutSeconds || 1) * 1e3), s = function() {
							return a(/* @__PURE__ */ Error("Transport stopped"));
						};
						r.stopController.signal.addEventListener("abort", s);
						var c = function() {
							r.outboundRequests.delete(i.requestId), clearTimeout(o), r.stopController.signal.removeEventListener("abort", s);
						};
						r.outboundRequests.set(i.requestId, {
							request: i,
							resolve: n,
							reject: a
						}), r.sendInternal(i);
					});
				}
			},
			{
				key: "start",
				value: function() {
					this.inboundWindow.addEventListener("message", this.handleMessage), this._ready = !0;
				}
			},
			{
				key: "stop",
				value: function() {
					this._ready = !1, this.stopController.abort(), this.inboundWindow.removeEventListener("message", this.handleMessage);
				}
			},
			{
				key: "handleRequest",
				value: function(e) {
					if (this.widgetId) {
						if (this.widgetId !== e.widgetId) return;
					} else this._widgetId = e.widgetId;
					this.emit("message", new CustomEvent("message", { detail: e }));
				}
			},
			{
				key: "handleResponse",
				value: function(e) {
					if (e.widgetId === this.widgetId) {
						var t = this.outboundRequests.get(e.requestId);
						if (t) {
							if ((0, n.isErrorResponse)(e.response)) {
								var i = e.response.error, o = i.message, s = a(i, r);
								t.reject(new n.WidgetApiResponseError(o, s));
							} else t.resolve(e);
						}
					}
				}
			}
		]), i;
	}(t.EventEmitter);
})), ae = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.WidgetApiToWidgetAction = e.WidgetApiFromWidgetAction = void 0, e.WidgetApiToWidgetAction = /* @__PURE__ */ function(e) {
		return e.SupportedApiVersions = "supported_api_versions", e.Capabilities = "capabilities", e.NotifyCapabilities = "notify_capabilities", e.ThemeChange = "theme_change", e.LanguageChange = "language_change", e.TakeScreenshot = "screenshot", e.UpdateVisibility = "visibility", e.OpenIDCredentials = "openid_credentials", e.WidgetConfig = "widget_config", e.CloseModalWidget = "close_modal", e.ButtonClicked = "button_clicked", e.SendEvent = "send_event", e.SendToDevice = "send_to_device", e.UpdateState = "update_state", e.UpdateTurnServers = "update_turn_servers", e;
	}({}), e.WidgetApiFromWidgetAction = /* @__PURE__ */ function(e) {
		return e.SupportedApiVersions = "supported_api_versions", e.ContentLoaded = "content_loaded", e.SendSticker = "m.sticker", e.UpdateAlwaysOnScreen = "set_always_on_screen", e.GetOpenIDCredentials = "get_openid", e.CloseModalWidget = "close_modal", e.OpenModalWidget = "open_modal", e.SetModalButtonEnabled = "set_button_enabled", e.SendEvent = "send_event", e.SendToDevice = "send_to_device", e.WatchTurnServers = "watch_turn_servers", e.UnwatchTurnServers = "unwatch_turn_servers", e.BeeperReadRoomAccountData = "com.beeper.read_room_account_data", e.MSC2876ReadEvents = "org.matrix.msc2876.read_events", e.MSC2931Navigate = "org.matrix.msc2931.navigate", e.MSC2974RenegotiateCapabilities = "org.matrix.msc2974.request_capabilities", e.MSC3869ReadRelations = "org.matrix.msc3869.read_relations", e.MSC3973UserDirectorySearch = "org.matrix.msc3973.user_directory_search", e.MSC4039GetMediaConfigAction = "org.matrix.msc4039.get_media_config", e.MSC4039UploadFileAction = "org.matrix.msc4039.upload_file", e.MSC4039DownloadFileAction = "org.matrix.msc4039.download_file", e.MSC4157UpdateDelayedEvent = "org.matrix.msc4157.update_delayed_event", e.MSC4515GetRtcTransports = "org.matrix.msc4515.get_rtc_transports", e.MSC4533RtcLivekitGetToken = "org.matrix.msc4533.rtc_livekit_get_token", e.MSC4533RtcLivekitDelegateDelayedLeave = "org.matrix.msc4533.rtc_livekit_delegate_delayed_leave", e;
	}({});
})), oe = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.OpenIDRequestState = void 0, e.OpenIDRequestState = /* @__PURE__ */ function(e) {
		return e.Allowed = "allowed", e.Blocked = "blocked", e.PendingUserConfirmation = "request", e;
	}({});
})), se = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.MatrixWidgetType = void 0, e.MatrixWidgetType = /* @__PURE__ */ function(e) {
		return e.Custom = "m.custom", e.JitsiMeet = "m.jitsi", e.Stickerpicker = "m.stickerpicker", e;
	}({});
})), T = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.BuiltInModalButtonID = void 0, e.BuiltInModalButtonID = /* @__PURE__ */ function(e) {
		return e.Close = "m.close", e;
	}({});
})), ce = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.WidgetEventCapability = e.EventKind = e.EventDirection = void 0;
	function t(e) {
		"@babel/helpers - typeof";
		return t = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
			return typeof e;
		} : function(e) {
			return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
		}, t(e);
	}
	function n(e, t) {
		var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
		if (!n) {
			if (Array.isArray(e) || (n = r(e)) || t && e && typeof e.length == "number") {
				n && (e = n);
				var i = 0, a = function() {};
				return {
					s: a,
					n: function() {
						return i >= e.length ? { done: !0 } : {
							done: !1,
							value: e[i++]
						};
					},
					e: function(e) {
						throw e;
					},
					f: a
				};
			}
			throw TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}
		var o, s = !0, c = !1;
		return {
			s: function() {
				n = n.call(e);
			},
			n: function() {
				var e = n.next();
				return s = e.done, e;
			},
			e: function(e) {
				c = !0, o = e;
			},
			f: function() {
				try {
					s || n.return == null || n.return();
				} finally {
					if (c) throw o;
				}
			}
		};
	}
	function r(e, t) {
		if (e) {
			if (typeof e == "string") return i(e, t);
			var n = {}.toString.call(e).slice(8, -1);
			return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? i(e, t) : void 0;
		}
	}
	function i(e, t) {
		(t == null || t > e.length) && (t = e.length);
		for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
		return r;
	}
	function a(e, t) {
		if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
	}
	function o(e, t) {
		for (var n = 0; n < t.length; n++) {
			var r = t[n];
			r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, c(r.key), r);
		}
	}
	function s(e, t, n) {
		return t && o(e.prototype, t), n && o(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
	}
	function c(e) {
		var n = l(e, "string");
		return t(n) == "symbol" ? n : n + "";
	}
	function l(e, n) {
		if (t(e) != "object" || !e) return e;
		var r = e[Symbol.toPrimitive];
		if (r !== void 0) {
			var i = r.call(e, n || "default");
			if (t(i) != "object") return i;
			throw TypeError("@@toPrimitive must return a primitive value.");
		}
		return (n === "string" ? String : Number)(e);
	}
	var u = /*#__PURE__*/ function(e) {
		return e.Event = "event", e.State = "state_event", e.ToDevice = "to_device", e.RoomAccount = "room_account", e;
	}({});
	e.EventKind = u;
	var d = /*#__PURE__*/ function(e) {
		return e.Send = "send", e.Receive = "receive", e;
	}({});
	e.EventDirection = d, e.WidgetEventCapability = /* @__PURE__ */ function() {
		function e(t, n, r, i, o) {
			a(this, e), this.direction = t, this.eventType = n, this.kind = r, this.keyStr = i, this.raw = o;
		}
		return s(e, [
			{
				key: "matchesAsStateEvent",
				value: function(e, t, n) {
					return this.kind !== u.State || this.direction !== e || this.eventType !== t ? !1 : this.keyStr === null || this.keyStr === n;
				}
			},
			{
				key: "matchesAsToDeviceEvent",
				value: function(e, t) {
					return this.kind === u.ToDevice && this.direction === e && this.eventType === t;
				}
			},
			{
				key: "matchesAsRoomEvent",
				value: function(e, t) {
					var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
					if (this.kind !== u.Event || this.direction !== e || this.eventType !== t) return !1;
					if (this.eventType === "m.room.message") {
						if (this.keyStr === null || this.keyStr === n) return !0;
					} else return !0;
					return !1;
				}
			},
			{
				key: "matchesAsRoomAccountData",
				value: function(e, t) {
					return this.kind === u.RoomAccount && this.direction === e && this.eventType === t;
				}
			}
		], [
			{
				key: "forStateEvent",
				value: function(t, n, r) {
					n = n.replace(/#/g, "\\#"), r = r == null ? "" : `#${r}`;
					var i = `org.matrix.msc2762.${t}.state_event:${n}${r}`;
					return e.findEventCapabilities([i])[0];
				}
			},
			{
				key: "forToDeviceEvent",
				value: function(t, n) {
					var r = `org.matrix.msc3819.${t}.to_device:${n}`;
					return e.findEventCapabilities([r])[0];
				}
			},
			{
				key: "forRoomEvent",
				value: function(t, n) {
					var r = `org.matrix.msc2762.${t}.event:${n}`;
					return e.findEventCapabilities([r])[0];
				}
			},
			{
				key: "forRoomMessageEvent",
				value: function(t, n) {
					n ??= "";
					var r = `org.matrix.msc2762.${t}.event:m.room.message#${n}`;
					return e.findEventCapabilities([r])[0];
				}
			},
			{
				key: "forRoomAccountData",
				value: function(t, n) {
					var r = `com.beeper.capabilities.${t}.room_account_data:${n}`;
					return e.findEventCapabilities([r])[0];
				}
			},
			{
				key: "findEventCapabilities",
				value: function(t) {
					var r = [], i = n(t), a;
					try {
						for (i.s(); !(a = i.n()).done;) {
							var o = a.value, s = null, c = void 0, l = null;
							if (o.startsWith("org.matrix.msc2762.send.event:") ? (s = d.Send, l = u.Event, c = o.substring(30)) : o.startsWith("org.matrix.msc2762.send.state_event:") ? (s = d.Send, l = u.State, c = o.substring(36)) : o.startsWith("org.matrix.msc3819.send.to_device:") ? (s = d.Send, l = u.ToDevice, c = o.substring(34)) : o.startsWith("org.matrix.msc2762.receive.event:") ? (s = d.Receive, l = u.Event, c = o.substring(33)) : o.startsWith("org.matrix.msc2762.receive.state_event:") ? (s = d.Receive, l = u.State, c = o.substring(39)) : o.startsWith("org.matrix.msc3819.receive.to_device:") ? (s = d.Receive, l = u.ToDevice, c = o.substring(37)) : o.startsWith("com.beeper.capabilities.receive.room_account_data:") && (s = d.Receive, l = u.RoomAccount, c = o.substring(50)), s !== null && l !== null && c !== void 0) {
								var f = c.startsWith("m.room.message#") || l === u.State, p = null;
								if (c.includes("#") && f) {
									var m = c.split("#"), h = m.findIndex(function(e) {
										return !e.endsWith("\\");
									});
									c = m.slice(0, h + 1).map(function(e) {
										return e.endsWith("\\") ? e.substring(0, e.length - 1) : e;
									}).join("#"), p = m.slice(h + 1).join("#");
								}
								r.push(new e(s, c, l, p, o));
							}
						}
					} catch (e) {
						i.e(e);
					} finally {
						i.f();
					}
					return r;
				}
			}
		]), e;
	}();
})), le = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.Symbols = void 0, e.Symbols = /* @__PURE__ */ function(e) {
		return e.AnyRoom = "*", e;
	}({});
})), ue = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.UpdateDelayedEventAction = void 0, e.UpdateDelayedEventAction = /* @__PURE__ */ function(e) {
		return e.Cancel = "cancel", e.Restart = "restart", e.Send = "send", e;
	}({});
})), E = /* @__PURE__ */ e(((e) => {
	function t(e) {
		"@babel/helpers - typeof";
		return t = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
			return typeof e;
		} : function(e) {
			return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
		}, t(e);
	}
	Object.defineProperty(e, "__esModule", { value: !0 }), e.WidgetApiResponseError = e.WidgetApi = void 0;
	var n = ee(), r = te(), i = ne(), a = re(), o = ie(), s = ae(), c = oe(), l = se(), u = T(), d = ce(), f = le(), p = ue();
	function m() {
		var e = b(), t = e.m(m), n = (Object.getPrototypeOf ? Object.getPrototypeOf(t) : t.__proto__).constructor;
		function r(e) {
			var t = typeof e == "function" && e.constructor;
			return !!t && (t === n || (t.displayName || t.name) === "GeneratorFunction");
		}
		var i = {
			throw: 1,
			return: 2,
			break: 3,
			continue: 3
		};
		function a(e) {
			var t, n;
			return function(r) {
				t || (t = {
					stop: function() {
						return n(r.a, 2);
					},
					catch: function() {
						return r.v;
					},
					abrupt: function(e, t) {
						return n(r.a, i[e], t);
					},
					delegateYield: function(e, i, a) {
						return t.resultName = i, n(r.d, h(e), a);
					},
					finish: function(e) {
						return n(r.f, e);
					}
				}, n = function(e, n, i) {
					r.p = t.prev, r.n = t.next;
					try {
						return e(n, i);
					} finally {
						t.next = r.n;
					}
				}), t.resultName && (t[t.resultName] = r.v, t.resultName = void 0), t.sent = r.v, t.next = r.n;
				try {
					return e.call(this, t);
				} finally {
					r.p = t.prev, r.n = t.next;
				}
			};
		}
		return (m = function() {
			return {
				wrap: function(t, n, r, i) {
					return e.w(a(t), n, r, i && i.reverse());
				},
				isGeneratorFunction: r,
				mark: e.m,
				awrap: function(e, t) {
					return new J(e, t);
				},
				AsyncIterator: y,
				async: function(e, t, n, i, o) {
					return (r(t) ? v : _)(a(e), t, n, i, o);
				},
				keys: g,
				values: h
			};
		})();
	}
	function h(e) {
		if (e != null) {
			var n = e[typeof Symbol == "function" && Symbol.iterator || "@@iterator"], r = 0;
			if (n) return n.call(e);
			if (typeof e.next == "function") return e;
			if (!isNaN(e.length)) return { next: function() {
				return e && r >= e.length && (e = void 0), {
					value: e && e[r++],
					done: !e
				};
			} };
		}
		throw TypeError(t(e) + " is not iterable");
	}
	function g(e) {
		var t = Object(e), n = [];
		for (var r in t) n.unshift(r);
		return function e() {
			for (; n.length;) if ((r = n.pop()) in t) return e.value = r, e.done = !1, e;
			return e.done = !0, e;
		};
	}
	function _(e, t, n, r, i) {
		var a = v(e, t, n, r, i);
		return a.next().then(function(e) {
			return e.done ? e.value : a.next();
		});
	}
	function v(e, t, n, r, i) {
		return new y(b().w(e, t, n, r), i || Promise);
	}
	function y(e, t) {
		function n(r, i, a, o) {
			try {
				var s = e[r](i), c = s.value;
				return c instanceof J ? t.resolve(c.v).then(function(e) {
					n("next", e, a, o);
				}, function(e) {
					n("throw", e, a, o);
				}) : t.resolve(c).then(function(e) {
					s.value = e, a(s);
				}, function(e) {
					return n("throw", e, a, o);
				});
			} catch (e) {
				o(e);
			}
		}
		var r;
		this.next || (x(y.prototype), x(y.prototype, typeof Symbol == "function" && Symbol.asyncIterator || "@asyncIterator", function() {
			return this;
		})), x(this, "_invoke", function(e, i, a) {
			function o() {
				return new t(function(t, r) {
					n(e, a, t, r);
				});
			}
			return r = r ? r.then(o, o) : o();
		}, !0);
	}
	function b() {
		var e, t, n = typeof Symbol == "function" ? Symbol : {}, r = n.iterator || "@@iterator", i = n.toStringTag || "@@toStringTag";
		function a(n, r, i, a) {
			var c = r && r.prototype instanceof s ? r : s, l = Object.create(c.prototype);
			return x(l, "_invoke", function(n, r, i) {
				var a, s, c, l = 0, u = i || [], d = !1, f = {
					p: 0,
					n: 0,
					v: e,
					a: p,
					f: p.bind(e, 4),
					d: function(t, n) {
						return a = t, s = 0, c = e, f.n = n, o;
					}
				};
				function p(n, r) {
					for (s = n, c = r, t = 0; !d && l && !i && t < u.length; t++) {
						var i, a = u[t], p = f.p, m = a[2];
						n > 3 ? (i = m === r) && (c = a[(s = a[4]) ? 5 : (s = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((i = n < 2 && p < a[1]) ? (s = 0, f.v = r, f.n = a[1]) : p < m && (i = n < 3 || a[0] > r || r > m) && (a[4] = n, a[5] = r, f.n = m, s = 0));
					}
					if (i || n > 1) return o;
					throw d = !0, r;
				}
				return function(i, u, m) {
					if (l > 1) throw TypeError("Generator is already running");
					for (d && u === 1 && p(u, m), s = u, c = m; (t = s < 2 ? e : c) || !d;) {
						a || (s ? s < 3 ? (s > 1 && (f.n = -1), p(s, c)) : f.n = c : f.v = c);
						try {
							if (l = 2, a) {
								if (s || (i = "next"), t = a[i]) {
									if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
									if (!t.done) return t;
									c = t.value, s < 2 && (s = 0);
								} else s === 1 && (t = a.return) && t.call(a), s < 2 && (c = TypeError("The iterator does not provide a '" + i + "' method"), s = 1);
								a = e;
							} else if ((t = (d = f.n < 0) ? c : n.call(r, f)) !== o) break;
						} catch (t) {
							a = e, s = 1, c = t;
						} finally {
							l = 1;
						}
					}
					return {
						value: t,
						done: d
					};
				};
			}(n, i, a), !0), l;
		}
		var o = {};
		function s() {}
		function c() {}
		function l() {}
		t = Object.getPrototypeOf;
		var u = [][r] ? t(t([][r]())) : (x(t = {}, r, function() {
			return this;
		}), t), d = l.prototype = s.prototype = Object.create(u);
		function f(e) {
			return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, x(e, i, "GeneratorFunction")), e.prototype = Object.create(d), e;
		}
		return c.prototype = l, x(d, "constructor", l), x(l, "constructor", c), c.displayName = "GeneratorFunction", x(l, i, "GeneratorFunction"), x(d), x(d, i, "Generator"), x(d, r, function() {
			return this;
		}), x(d, "toString", function() {
			return "[object Generator]";
		}), (b = function() {
			return {
				w: a,
				m: f
			};
		})();
	}
	function x(e, t, n, r) {
		var i = Object.defineProperty;
		try {
			i({}, "", {});
		} catch {
			i = 0;
		}
		x = function(e, t, n, r) {
			function a(t, n) {
				x(e, t, function(e) {
					return this._invoke(t, n, e);
				});
			}
			t ? i ? i(e, t, {
				value: n,
				enumerable: !r,
				configurable: !r,
				writable: !r
			}) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
		}, x(e, t, n, r);
	}
	function S(e, t, n, r, i, a, o) {
		try {
			var s = e[a](o), c = s.value;
		} catch (e) {
			n(e);
			return;
		}
		s.done ? t(c) : Promise.resolve(c).then(r, i);
	}
	function C(e) {
		return function() {
			var t = this, n = arguments;
			return new Promise(function(r, i) {
				var a = e.apply(t, n);
				function o(e) {
					S(a, r, i, o, s, "next", e);
				}
				function s(e) {
					S(a, r, i, o, s, "throw", e);
				}
				o(void 0);
			});
		};
	}
	function w(e, t) {
		var n = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var r = Object.getOwnPropertySymbols(e);
			t && (r = r.filter(function(t) {
				return Object.getOwnPropertyDescriptor(e, t).enumerable;
			})), n.push.apply(n, r);
		}
		return n;
	}
	function E(e) {
		for (var t = 1; t < arguments.length; t++) {
			var n = arguments[t] == null ? {} : arguments[t];
			t % 2 ? w(Object(n), !0).forEach(function(t) {
				k(e, t, n[t]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : w(Object(n)).forEach(function(t) {
				Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
			});
		}
		return e;
	}
	function de(e, t) {
		var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
		if (!n) {
			if (Array.isArray(e) || (n = D(e)) || t && e && typeof e.length == "number") {
				n && (e = n);
				var r = 0, i = function() {};
				return {
					s: i,
					n: function() {
						return r >= e.length ? { done: !0 } : {
							done: !1,
							value: e[r++]
						};
					},
					e: function(e) {
						throw e;
					},
					f: i
				};
			}
			throw TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}
		var a, o = !0, s = !1;
		return {
			s: function() {
				n = n.call(e);
			},
			n: function() {
				var e = n.next();
				return o = e.done, e;
			},
			e: function(e) {
				s = !0, a = e;
			},
			f: function() {
				try {
					o || n.return == null || n.return();
				} finally {
					if (s) throw a;
				}
			}
		};
	}
	function D(e, t) {
		if (e) {
			if (typeof e == "string") return O(e, t);
			var n = {}.toString.call(e).slice(8, -1);
			return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? O(e, t) : void 0;
		}
	}
	function O(e, t) {
		(t == null || t > e.length) && (t = e.length);
		for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
		return r;
	}
	function k(e, t, n) {
		return (t = M(t)) in e ? Object.defineProperty(e, t, {
			value: n,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[t] = n, e;
	}
	function A(e, t) {
		for (var n = 0; n < t.length; n++) {
			var r = t[n];
			r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, M(r.key), r);
		}
	}
	function j(e, t, n) {
		return t && A(e.prototype, t), n && A(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
	}
	function M(e) {
		var n = N(e, "string");
		return t(n) == "symbol" ? n : n + "";
	}
	function N(e, n) {
		if (t(e) != "object" || !e) return e;
		var r = e[Symbol.toPrimitive];
		if (r !== void 0) {
			var i = r.call(e, n || "default");
			if (t(i) != "object") return i;
			throw TypeError("@@toPrimitive must return a primitive value.");
		}
		return (n === "string" ? String : Number)(e);
	}
	function P(e, t) {
		if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
	}
	function F(e, t) {
		if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
		e.prototype = Object.create(t && t.prototype, { constructor: {
			value: e,
			writable: !0,
			configurable: !0
		} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && U(e, t);
	}
	function I(e) {
		var t = V();
		return function() {
			var n, r = W(e);
			if (t) {
				var i = W(this).constructor;
				n = Reflect.construct(r, arguments, i);
			} else n = r.apply(this, arguments);
			return L(this, n);
		};
	}
	function L(e, n) {
		if (n && (t(n) == "object" || typeof n == "function")) return n;
		if (n !== void 0) throw TypeError("Derived constructors may only return object or undefined");
		return R(e);
	}
	function R(e) {
		if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
		return e;
	}
	function z(e) {
		var t = typeof Map == "function" ? /* @__PURE__ */ new Map() : void 0;
		return z = function(e) {
			if (e === null || !H(e)) return e;
			if (typeof e != "function") throw TypeError("Super expression must either be null or a function");
			if (t !== void 0) {
				if (t.has(e)) return t.get(e);
				t.set(e, n);
			}
			function n() {
				return B(e, arguments, W(this).constructor);
			}
			return n.prototype = Object.create(e.prototype, { constructor: {
				value: n,
				enumerable: !1,
				writable: !0,
				configurable: !0
			} }), U(n, e);
		}, z(e);
	}
	function B(e, t, n) {
		if (V()) return Reflect.construct.apply(null, arguments);
		var r = [null];
		r.push.apply(r, t);
		var i = new (e.bind.apply(e, r))();
		return n && U(i, n.prototype), i;
	}
	function V() {
		try {
			var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
		} catch {}
		return (V = function() {
			return !!e;
		})();
	}
	function H(e) {
		try {
			return Function.toString.call(e).indexOf("[native code]") !== -1;
		} catch {
			return typeof e == "function";
		}
	}
	function U(e, t) {
		return U = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
			return e.__proto__ = t, e;
		}, U(e, t);
	}
	function W(e) {
		return W = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
			return e.__proto__ || Object.getPrototypeOf(e);
		}, W(e);
	}
	function G(e) {
		return new J(e, 0);
	}
	function K(e) {
		return function() {
			return new q(e.apply(this, arguments));
		};
	}
	function q(e) {
		var t, n;
		function r(t, n) {
			try {
				var a = e[t](n), o = a.value, s = o instanceof J;
				Promise.resolve(s ? o.v : o).then(function(n) {
					if (s) {
						var c = t === "return" && o.k ? t : "next";
						if (!o.k || n.done) return r(c, n);
						n = e[c](n).value;
					}
					i(!!a.done, n);
				}, function(e) {
					r("throw", e);
				});
			} catch (e) {
				i(2, e);
			}
		}
		function i(e, i) {
			e === 2 ? t.reject(i) : t.resolve({
				value: i,
				done: e
			}), (t = t.next) ? r(t.key, t.arg) : n = null;
		}
		this._invoke = function(e, i) {
			return new Promise(function(a, o) {
				var s = {
					key: e,
					arg: i,
					resolve: a,
					reject: o,
					next: null
				};
				n ? n = n.next = s : (t = n = s, r(e, i));
			});
		}, typeof e.return != "function" && (this.return = void 0);
	}
	q.prototype[typeof Symbol == "function" && Symbol.asyncIterator || "@@asyncIterator"] = function() {
		return this;
	}, q.prototype.next = function(e) {
		return this._invoke("next", e);
	}, q.prototype.throw = function(e) {
		return this._invoke("throw", e);
	}, q.prototype.return = function(e) {
		return this._invoke("return", e);
	};
	function J(e, t) {
		this.v = e, this.k = t;
	}
	var Y = /*#__PURE__*/ function(e) {
		F(n, e);
		var t = I(n);
		function n(e, r) {
			var i;
			return P(this, n), i = t.call(this, e), i.data = r, i;
		}
		return j(n);
	}(/*#__PURE__*/ z(Error));
	e.WidgetApiResponseError = Y, Y.prototype.name = Y.name, e.WidgetApi = /* @__PURE__ */ function(e) {
		F(n, e);
		var t = I(n);
		function n() {
			var e, r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null, a = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
			if (P(this, n), e = t.call(this), k(R(e), "transport", void 0), k(R(e), "capabilitiesFinished", !1), k(R(e), "supportsMSC2974Renegotiate", !1), k(R(e), "requestedCapabilities", []), k(R(e), "approvedCapabilities", void 0), k(R(e), "cachedClientVersions", void 0), k(R(e), "turnServerWatchers", 0), !globalThis.parent) throw Error("No parent window. This widget doesn't appear to be embedded properly.");
			return e.transport = new o.PostmessageTransport(i.WidgetApiDirection.FromWidget, r, globalThis.parent, globalThis), e.transport.targetOrigin = a, e.transport.on("message", e.handleMessage.bind(R(e))), e;
		}
		return j(n, [
			{
				key: "hasCapability",
				value: function(e) {
					return Array.isArray(this.approvedCapabilities) ? this.approvedCapabilities.includes(e) : this.requestedCapabilities.includes(e);
				}
			},
			{
				key: "requestCapability",
				value: function(e) {
					if (this.capabilitiesFinished && !this.supportsMSC2974Renegotiate) throw Error("Capabilities have already been negotiated");
					this.requestedCapabilities.push(e);
				}
			},
			{
				key: "requestCapabilities",
				value: function(e) {
					var t = de(e), n;
					try {
						for (t.s(); !(n = t.n()).done;) {
							var r = n.value;
							this.requestCapability(r);
						}
					} catch (e) {
						t.e(e);
					} finally {
						t.f();
					}
				}
			},
			{
				key: "requestCapabilityForRoomTimeline",
				value: function(e) {
					this.requestCapability(`org.matrix.msc2762.timeline:${e}`);
				}
			},
			{
				key: "requestCapabilityToSendState",
				value: function(e, t) {
					this.requestCapability(d.WidgetEventCapability.forStateEvent(d.EventDirection.Send, e, t).raw);
				}
			},
			{
				key: "requestCapabilityToReceiveState",
				value: function(e, t) {
					this.requestCapability(d.WidgetEventCapability.forStateEvent(d.EventDirection.Receive, e, t).raw);
				}
			},
			{
				key: "requestCapabilityToSendToDevice",
				value: function(e) {
					this.requestCapability(d.WidgetEventCapability.forToDeviceEvent(d.EventDirection.Send, e).raw);
				}
			},
			{
				key: "requestCapabilityToReceiveToDevice",
				value: function(e) {
					this.requestCapability(d.WidgetEventCapability.forToDeviceEvent(d.EventDirection.Receive, e).raw);
				}
			},
			{
				key: "requestCapabilityToSendEvent",
				value: function(e) {
					this.requestCapability(d.WidgetEventCapability.forRoomEvent(d.EventDirection.Send, e).raw);
				}
			},
			{
				key: "requestCapabilityToReceiveEvent",
				value: function(e) {
					this.requestCapability(d.WidgetEventCapability.forRoomEvent(d.EventDirection.Receive, e).raw);
				}
			},
			{
				key: "requestCapabilityToSendMessage",
				value: function(e) {
					this.requestCapability(d.WidgetEventCapability.forRoomMessageEvent(d.EventDirection.Send, e).raw);
				}
			},
			{
				key: "requestCapabilityToReceiveMessage",
				value: function(e) {
					this.requestCapability(d.WidgetEventCapability.forRoomMessageEvent(d.EventDirection.Receive, e).raw);
				}
			},
			{
				key: "requestCapabilityToReceiveRoomAccountData",
				value: function(e) {
					this.requestCapability(d.WidgetEventCapability.forRoomAccountData(d.EventDirection.Receive, e).raw);
				}
			},
			{
				key: "requestCapabilityToGetRtcLivekitToken",
				value: function() {
					this.requestCapability(r.MatrixCapabilities.MSC4533RtcLivekitGetToken);
				}
			},
			{
				key: "requestCapabilityToDelegateRtcLivekitDelayedLeave",
				value: function() {
					this.requestCapability(r.MatrixCapabilities.MSC4533RtcLivekitDelegateDelayedLeave);
				}
			},
			{
				key: "requestOpenIDConnectToken",
				value: function() {
					var e = this;
					return new Promise(function(t, n) {
						e.transport.sendComplete(s.WidgetApiFromWidgetAction.GetOpenIDCredentials, {}).then(function(r) {
							var i = r.response;
							i.state === c.OpenIDRequestState.Allowed ? t(i) : i.state === c.OpenIDRequestState.Blocked ? n(/* @__PURE__ */ Error("User declined to verify their identity")) : i.state === c.OpenIDRequestState.PendingUserConfirmation ? e.on(`action:${s.WidgetApiToWidgetAction.OpenIDCredentials}`, function a(o) {
								o.preventDefault();
								var l = o.detail;
								l.data.original_request_id === r.requestId && (l.data.state === c.OpenIDRequestState.Allowed ? (t(l.data), e.transport.reply(l, {})) : l.data.state === c.OpenIDRequestState.Blocked ? (n(/* @__PURE__ */ Error("User declined to verify their identity")), e.transport.reply(l, {})) : (n(/* @__PURE__ */ Error("Invalid state on reply: " + i.state)), e.transport.reply(l, { error: { message: "Invalid state" } })), e.off(`action:${s.WidgetApiToWidgetAction.OpenIDCredentials}`, a));
							}) : n(/* @__PURE__ */ Error("Invalid state: " + i.state));
						}).catch(n);
					});
				}
			},
			{
				key: "updateRequestedCapabilities",
				value: function() {
					return this.transport.send(s.WidgetApiFromWidgetAction.MSC2974RenegotiateCapabilities, { capabilities: this.requestedCapabilities }).then();
				}
			},
			{
				key: "sendContentLoaded",
				value: function() {
					return this.transport.send(s.WidgetApiFromWidgetAction.ContentLoaded, {}).then();
				}
			},
			{
				key: "sendSticker",
				value: function(e) {
					return this.transport.send(s.WidgetApiFromWidgetAction.SendSticker, e).then();
				}
			},
			{
				key: "setAlwaysOnScreen",
				value: function(e) {
					return this.transport.send(s.WidgetApiFromWidgetAction.UpdateAlwaysOnScreen, { value: e }).then(function(e) {
						return e.success;
					});
				}
			},
			{
				key: "openModalWidget",
				value: function(e, t) {
					var n = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [], r = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {}, i = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : l.MatrixWidgetType.Custom;
					return this.transport.send(s.WidgetApiFromWidgetAction.OpenModalWidget, {
						type: i,
						url: e,
						name: t,
						buttons: n,
						data: r
					}).then();
				}
			},
			{
				key: "closeModalWidget",
				value: function() {
					var e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
					return this.transport.send(s.WidgetApiFromWidgetAction.CloseModalWidget, e).then();
				}
			},
			{
				key: "sendRoomEvent",
				value: function(e, t, n, r, i, a) {
					var o;
					return typeof i == "number" ? a = i : o = i, this.sendEvent(e, void 0, t, n, r, o, a);
				}
			},
			{
				key: "sendStateEvent",
				value: function(e, t, n, r, i, a) {
					return this.sendEvent(e, t, n, r, i, a);
				}
			},
			{
				key: "sendEvent",
				value: function(e, t, n, r, i, a, o) {
					return this.transport.send(s.WidgetApiFromWidgetAction.SendEvent, E(E(E(E(E({
						type: e,
						content: n
					}, t !== void 0 && { state_key: t }), r !== void 0 && { room_id: r }), i !== void 0 && { delay: i }), a !== void 0 && { parent_delay_id: a }), o !== void 0 && { sticky_duration_ms: o }));
				}
			},
			{
				key: "cancelScheduledDelayedEvent",
				value: function(e) {
					return this.transport.send(s.WidgetApiFromWidgetAction.MSC4157UpdateDelayedEvent, {
						delay_id: e,
						action: p.UpdateDelayedEventAction.Cancel
					});
				}
			},
			{
				key: "restartScheduledDelayedEvent",
				value: function(e) {
					return this.transport.send(s.WidgetApiFromWidgetAction.MSC4157UpdateDelayedEvent, {
						delay_id: e,
						action: p.UpdateDelayedEventAction.Restart
					});
				}
			},
			{
				key: "sendScheduledDelayedEvent",
				value: function(e) {
					return this.transport.send(s.WidgetApiFromWidgetAction.MSC4157UpdateDelayedEvent, {
						delay_id: e,
						action: p.UpdateDelayedEventAction.Send
					});
				}
			},
			{
				key: "sendToDevice",
				value: function(e, t, n) {
					return this.transport.send(s.WidgetApiFromWidgetAction.SendToDevice, {
						type: e,
						encrypted: t,
						messages: n
					});
				}
			},
			{
				key: "readRoomAccountData",
				value: function(e, t) {
					var n = { type: e };
					return t && (n.room_ids = t.includes(f.Symbols.AnyRoom) ? f.Symbols.AnyRoom : t), this.transport.send(s.WidgetApiFromWidgetAction.BeeperReadRoomAccountData, n).then(function(e) {
						return e.events;
					});
				}
			},
			{
				key: "readRoomEvents",
				value: function(e, t, n, r, i) {
					var a = {
						type: e,
						msgtype: n
					};
					return t !== void 0 && (a.limit = t), r && (a.room_ids = r.includes(f.Symbols.AnyRoom) ? f.Symbols.AnyRoom : r), i && (a.since = i), this.transport.send(s.WidgetApiFromWidgetAction.MSC2876ReadEvents, a).then(function(e) {
						return e.events;
					});
				}
			},
			{
				key: "readEventRelations",
				value: function() {
					var e = C(/*#__PURE__*/ m().mark(function e(t, n, r, i, o, c, l, u) {
						var d, f;
						return m().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0: return e.next = 2, this.getClientVersions();
								case 2:
									if (d = e.sent, d.includes(a.UnstableApiVersion.MSC3869)) {
										e.next = 5;
										break;
									}
									throw Error("The read_relations action is not supported by the client.");
								case 5: return f = {
									event_id: t,
									rel_type: r,
									event_type: i,
									room_id: n,
									to: l,
									from: c,
									limit: o,
									direction: u
								}, e.abrupt("return", this.transport.send(s.WidgetApiFromWidgetAction.MSC3869ReadRelations, f));
								case 7:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t(t, n, r, i, a, o, s, c) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "readStateEvents",
				value: function(e, t, n, r) {
					var i = {
						type: e,
						state_key: n === void 0 || n
					};
					return t !== void 0 && (i.limit = t), r && (i.room_ids = r.includes(f.Symbols.AnyRoom) ? f.Symbols.AnyRoom : r), this.transport.send(s.WidgetApiFromWidgetAction.MSC2876ReadEvents, i).then(function(e) {
						return e.events;
					});
				}
			},
			{
				key: "setModalButtonEnabled",
				value: function(e, t) {
					if (e === u.BuiltInModalButtonID.Close) throw Error("The close button cannot be disabled");
					return this.transport.send(s.WidgetApiFromWidgetAction.SetModalButtonEnabled, {
						button: e,
						enabled: t
					}).then();
				}
			},
			{
				key: "navigateTo",
				value: function(e) {
					if (!e || !e.startsWith("https://matrix.to/#")) throw Error("Invalid matrix.to URI");
					return this.transport.send(s.WidgetApiFromWidgetAction.MSC2931Navigate, { uri: e }).then();
				}
			},
			{
				key: "getTurnServers",
				value: function() {
					var e = this;
					return K(/*#__PURE__*/ m().mark(function t() {
						var n, r;
						return m().wrap(function(t) {
							for (;;) switch (t.prev = t.next) {
								case 0:
									if (r = /*#__PURE__*/ function() {
										var t = C(/*#__PURE__*/ m().mark(function t(r) {
											return m().wrap(function(t) {
												for (;;) switch (t.prev = t.next) {
													case 0: r.preventDefault(), n(r.detail.data), e.transport.reply(r.detail, {});
													case 3:
													case "end": return t.stop();
												}
											}, t);
										}));
										return function(e) {
											return t.apply(this, arguments);
										};
									}(), e.on(`action:${s.WidgetApiToWidgetAction.UpdateTurnServers}`, r), e.turnServerWatchers !== 0) {
										t.next = 12;
										break;
									}
									return t.prev = 3, t.next = 6, G(e.transport.send(s.WidgetApiFromWidgetAction.WatchTurnServers, {}));
								case 6:
									t.next = 12;
									break;
								case 8: throw t.prev = 8, t.t0 = t.catch(3), e.off(`action:${s.WidgetApiToWidgetAction.UpdateTurnServers}`, r), t.t0;
								case 12: e.turnServerWatchers++, t.prev = 13;
								case 14: return t.next = 17, G(new Promise(function(e) {
									return n = e;
								}));
								case 17: return t.next = 19, t.sent;
								case 19:
									t.next = 14;
									break;
								case 21:
									if (t.prev = 21, e.off(`action:${s.WidgetApiToWidgetAction.UpdateTurnServers}`, r), e.turnServerWatchers--, e.turnServerWatchers !== 0) {
										t.next = 27;
										break;
									}
									return t.next = 27, G(e.transport.send(s.WidgetApiFromWidgetAction.UnwatchTurnServers, {}));
								case 27: return t.finish(21);
								case 28:
								case "end": return t.stop();
							}
						}, t, null, [[3, 8], [
							13,
							,
							21,
							28
						]]);
					}))();
				}
			},
			{
				key: "searchUserDirectory",
				value: function() {
					var e = C(/*#__PURE__*/ m().mark(function e(t, n) {
						var r, i;
						return m().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0: return e.next = 2, this.getClientVersions();
								case 2:
									if (r = e.sent, r.includes(a.UnstableApiVersion.MSC3973)) {
										e.next = 5;
										break;
									}
									throw Error("The user_directory_search action is not supported by the client.");
								case 5: return i = {
									search_term: t,
									limit: n
								}, e.abrupt("return", this.transport.send(s.WidgetApiFromWidgetAction.MSC3973UserDirectorySearch, i));
								case 7:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t(t, n) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "getMediaConfig",
				value: function() {
					var e = C(/*#__PURE__*/ m().mark(function e() {
						var t, n;
						return m().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0: return e.next = 2, this.getClientVersions();
								case 2:
									if (t = e.sent, t.includes(a.UnstableApiVersion.MSC4039)) {
										e.next = 5;
										break;
									}
									throw Error("The get_media_config action is not supported by the client.");
								case 5: return n = {}, e.abrupt("return", this.transport.send(s.WidgetApiFromWidgetAction.MSC4039GetMediaConfigAction, n));
								case 7:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t() {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "getRtcTransports",
				value: function() {
					var e = C(/*#__PURE__*/ m().mark(function e() {
						var t, n;
						return m().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0: return e.next = 2, this.getClientVersions();
								case 2:
									if (t = e.sent, t.includes(a.UnstableApiVersion.MSC4515)) {
										e.next = 5;
										break;
									}
									throw Error("The get_rtc_transports action is not supported by the client.");
								case 5: return n = {}, e.abrupt("return", this.transport.send(s.WidgetApiFromWidgetAction.MSC4515GetRtcTransports, n));
								case 7:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t() {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "uploadFile",
				value: function() {
					var e = C(/*#__PURE__*/ m().mark(function e(t) {
						var n, r;
						return m().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0: return e.next = 2, this.getClientVersions();
								case 2:
									if (n = e.sent, n.includes(a.UnstableApiVersion.MSC4039)) {
										e.next = 5;
										break;
									}
									throw Error("The upload_file action is not supported by the client.");
								case 5: return r = { file: t }, e.abrupt("return", this.transport.send(s.WidgetApiFromWidgetAction.MSC4039UploadFileAction, r));
								case 7:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "downloadFile",
				value: function() {
					var e = C(/*#__PURE__*/ m().mark(function e(t) {
						var n, r;
						return m().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0: return e.next = 2, this.getClientVersions();
								case 2:
									if (n = e.sent, n.includes(a.UnstableApiVersion.MSC4039)) {
										e.next = 5;
										break;
									}
									throw Error("The download_file action is not supported by the client.");
								case 5: return r = { content_uri: t }, e.abrupt("return", this.transport.send(s.WidgetApiFromWidgetAction.MSC4039DownloadFileAction, r));
								case 7:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "getRtcLivekitToken",
				value: function() {
					var e = C(/*#__PURE__*/ m().mark(function e(t) {
						var n;
						return m().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0: return e.next = 2, this.getClientVersions();
								case 2:
									if (n = e.sent, n.includes(a.UnstableApiVersion.MSC4533)) {
										e.next = 5;
										break;
									}
									throw Error("The rtc_livekit_get_token action is not supported by the client.");
								case 5: return e.abrupt("return", this.transport.send(s.WidgetApiFromWidgetAction.MSC4533RtcLivekitGetToken, t));
								case 6:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "delegateRtcLivekitDelayedLeave",
				value: function() {
					var e = C(/*#__PURE__*/ m().mark(function e(t) {
						var n;
						return m().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0: return e.next = 2, this.getClientVersions();
								case 2:
									if (n = e.sent, n.includes(a.UnstableApiVersion.MSC4533)) {
										e.next = 5;
										break;
									}
									throw Error("The rtc_livekit_delegate_delayed_leave action is not supported by the client.");
								case 5: return e.abrupt("return", this.transport.send(s.WidgetApiFromWidgetAction.MSC4533RtcLivekitDelegateDelayedLeave, t));
								case 6:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "start",
				value: function() {
					var e = this;
					this.transport.start(), this.getClientVersions().then(function(t) {
						t.includes(a.UnstableApiVersion.MSC2974) && (e.supportsMSC2974Renegotiate = !0);
					});
				}
			},
			{
				key: "handleMessage",
				value: function(e) {
					var t = new CustomEvent(`action:${e.detail.action}`, {
						detail: e.detail,
						cancelable: !0
					});
					if (this.emit(`action:${e.detail.action}`, t), !t.defaultPrevented) switch (e.detail.action) {
						case s.WidgetApiToWidgetAction.SupportedApiVersions: return this.replyVersions(e.detail);
						case s.WidgetApiToWidgetAction.Capabilities: return this.handleCapabilities(e.detail);
						case s.WidgetApiToWidgetAction.UpdateVisibility: return this.transport.reply(e.detail, {});
						case s.WidgetApiToWidgetAction.NotifyCapabilities: return this.transport.reply(e.detail, {});
						default: return this.transport.reply(e.detail, { error: { message: "Unknown or unsupported to-widget action: " + e.detail.action } });
					}
				}
			},
			{
				key: "replyVersions",
				value: function(e) {
					this.transport.reply(e, { supported_versions: a.CurrentApiVersions });
				}
			},
			{
				key: "getClientVersions",
				value: function() {
					var e = this;
					return Array.isArray(this.cachedClientVersions) ? Promise.resolve(this.cachedClientVersions) : this.transport.send(s.WidgetApiFromWidgetAction.SupportedApiVersions, {}).then(function(t) {
						return e.cachedClientVersions = t.supported_versions, t.supported_versions;
					}).catch(function(e) {
						return console.warn("non-fatal error getting supported client versions: ", e), [];
					});
				}
			},
			{
				key: "handleCapabilities",
				value: function(e) {
					var t = this;
					return this.capabilitiesFinished ? this.transport.reply(e, { error: { message: "Capability negotiation already completed" } }) : this.getClientVersions().then(function(n) {
						return n.includes(a.UnstableApiVersion.MSC2871) ? t.once(`action:${s.WidgetApiToWidgetAction.NotifyCapabilities}`, function(e) {
							t.approvedCapabilities = e.detail.data.approved, t.emit("ready");
						}) : t.emit("ready"), t.capabilitiesFinished = !0, t.transport.reply(e, { capabilities: t.requestedCapabilities });
					});
				}
			}
		]), n;
	}(n.EventEmitter);
})), de = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.SimpleObservable = void 0;
	function t(e) {
		"@babel/helpers - typeof";
		return t = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
			return typeof e;
		} : function(e) {
			return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
		}, t(e);
	}
	function n(e, t) {
		var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
		if (!n) {
			if (Array.isArray(e) || (n = r(e)) || t && e && typeof e.length == "number") {
				n && (e = n);
				var i = 0, a = function() {};
				return {
					s: a,
					n: function() {
						return i >= e.length ? { done: !0 } : {
							done: !1,
							value: e[i++]
						};
					},
					e: function(e) {
						throw e;
					},
					f: a
				};
			}
			throw TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}
		var o, s = !0, c = !1;
		return {
			s: function() {
				n = n.call(e);
			},
			n: function() {
				var e = n.next();
				return s = e.done, e;
			},
			e: function(e) {
				c = !0, o = e;
			},
			f: function() {
				try {
					s || n.return == null || n.return();
				} finally {
					if (c) throw o;
				}
			}
		};
	}
	function r(e, t) {
		if (e) {
			if (typeof e == "string") return i(e, t);
			var n = {}.toString.call(e).slice(8, -1);
			return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? i(e, t) : void 0;
		}
	}
	function i(e, t) {
		(t == null || t > e.length) && (t = e.length);
		for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
		return r;
	}
	function a(e, t) {
		if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
	}
	function o(e, t) {
		for (var n = 0; n < t.length; n++) {
			var r = t[n];
			r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, l(r.key), r);
		}
	}
	function s(e, t, n) {
		return t && o(e.prototype, t), n && o(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
	}
	function c(e, t, n) {
		return (t = l(t)) in e ? Object.defineProperty(e, t, {
			value: n,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[t] = n, e;
	}
	function l(e) {
		var n = u(e, "string");
		return t(n) == "symbol" ? n : n + "";
	}
	function u(e, n) {
		if (t(e) != "object" || !e) return e;
		var r = e[Symbol.toPrimitive];
		if (r !== void 0) {
			var i = r.call(e, n || "default");
			if (t(i) != "object") return i;
			throw TypeError("@@toPrimitive must return a primitive value.");
		}
		return (n === "string" ? String : Number)(e);
	}
	e.SimpleObservable = /* @__PURE__ */ function() {
		function e(t) {
			a(this, e), c(this, "listeners", []), t && this.listeners.push(t);
		}
		return s(e, [
			{
				key: "onUpdate",
				value: function(e) {
					this.listeners.push(e);
				}
			},
			{
				key: "update",
				value: function(e) {
					var t = n(this.listeners), r;
					try {
						for (t.s(); !(r = t.n()).done;) {
							var i = r.value;
							i(e);
						}
					} catch (e) {
						t.e(e);
					} finally {
						t.f();
					}
				}
			},
			{
				key: "close",
				value: function() {
					this.listeners = [];
				}
			}
		]), e;
	}();
})), D = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.ClientWidgetApi = void 0;
	var t = ee(), n = ie(), r = ne(), i = ae(), a = te(), o = re(), s = ce(), c = oe(), l = de(), u = le(), d = ue();
	function f(e) {
		"@babel/helpers - typeof";
		return f = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
			return typeof e;
		} : function(e) {
			return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
		}, f(e);
	}
	function p(e, t) {
		var n = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var r = Object.getOwnPropertySymbols(e);
			t && (r = r.filter(function(t) {
				return Object.getOwnPropertyDescriptor(e, t).enumerable;
			})), n.push.apply(n, r);
		}
		return n;
	}
	function m(e) {
		for (var t = 1; t < arguments.length; t++) {
			var n = arguments[t] == null ? {} : arguments[t];
			t % 2 ? p(Object(n), !0).forEach(function(t) {
				H(e, t, n[t]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : p(Object(n)).forEach(function(t) {
				Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
			});
		}
		return e;
	}
	function h(e, t) {
		var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
		if (!n) {
			if (Array.isArray(e) || (n = v(e)) || t && e && typeof e.length == "number") {
				n && (e = n);
				var r = 0, i = function() {};
				return {
					s: i,
					n: function() {
						return r >= e.length ? { done: !0 } : {
							done: !1,
							value: e[r++]
						};
					},
					e: function(e) {
						throw e;
					},
					f: i
				};
			}
			throw TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}
		var a, o = !0, s = !1;
		return {
			s: function() {
				n = n.call(e);
			},
			n: function() {
				var e = n.next();
				return o = e.done, e;
			},
			e: function(e) {
				s = !0, a = e;
			},
			f: function() {
				try {
					o || n.return == null || n.return();
				} finally {
					if (s) throw a;
				}
			}
		};
	}
	function g(e) {
		return b(e) || y(e) || v(e) || _();
	}
	function _() {
		throw TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	function v(e, t) {
		if (e) {
			if (typeof e == "string") return x(e, t);
			var n = {}.toString.call(e).slice(8, -1);
			return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? x(e, t) : void 0;
		}
	}
	function y(e) {
		if (typeof Symbol < "u" && e[Symbol.iterator] != null || e["@@iterator"] != null) return Array.from(e);
	}
	function b(e) {
		if (Array.isArray(e)) return x(e);
	}
	function x(e, t) {
		(t == null || t > e.length) && (t = e.length);
		for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
		return r;
	}
	function S() {
		var e = D(), t = e.m(S), n = (Object.getPrototypeOf ? Object.getPrototypeOf(t) : t.__proto__).constructor;
		function r(e) {
			var t = typeof e == "function" && e.constructor;
			return !!t && (t === n || (t.displayName || t.name) === "GeneratorFunction");
		}
		var i = {
			throw: 1,
			return: 2,
			break: 3,
			continue: 3
		};
		function a(e) {
			var t, n;
			return function(r) {
				t || (t = {
					stop: function() {
						return n(r.a, 2);
					},
					catch: function() {
						return r.v;
					},
					abrupt: function(e, t) {
						return n(r.a, i[e], t);
					},
					delegateYield: function(e, i, a) {
						return t.resultName = i, n(r.d, C(e), a);
					},
					finish: function(e) {
						return n(r.f, e);
					}
				}, n = function(e, n, i) {
					r.p = t.prev, r.n = t.next;
					try {
						return e(n, i);
					} finally {
						t.next = r.n;
					}
				}), t.resultName && (t[t.resultName] = r.v, t.resultName = void 0), t.sent = r.v, t.next = r.n;
				try {
					return e.call(this, t);
				} finally {
					r.p = t.prev, r.n = t.next;
				}
			};
		}
		return (S = function() {
			return {
				wrap: function(t, n, r, i) {
					return e.w(a(t), n, r, i && i.reverse());
				},
				isGeneratorFunction: r,
				mark: e.m,
				awrap: function(e, t) {
					return new k(e, t);
				},
				AsyncIterator: E,
				async: function(e, t, n, i, o) {
					return (r(t) ? T : se)(a(e), t, n, i, o);
				},
				keys: w,
				values: C
			};
		})();
	}
	function C(e) {
		if (e != null) {
			var t = e[typeof Symbol == "function" && Symbol.iterator || "@@iterator"], n = 0;
			if (t) return t.call(e);
			if (typeof e.next == "function") return e;
			if (!isNaN(e.length)) return { next: function() {
				return e && n >= e.length && (e = void 0), {
					value: e && e[n++],
					done: !e
				};
			} };
		}
		throw TypeError(f(e) + " is not iterable");
	}
	function w(e) {
		var t = Object(e), n = [];
		for (var r in t) n.unshift(r);
		return function e() {
			for (; n.length;) if ((r = n.pop()) in t) return e.value = r, e.done = !1, e;
			return e.done = !0, e;
		};
	}
	function se(e, t, n, r, i) {
		var a = T(e, t, n, r, i);
		return a.next().then(function(e) {
			return e.done ? e.value : a.next();
		});
	}
	function T(e, t, n, r, i) {
		return new E(D().w(e, t, n, r), i || Promise);
	}
	function E(e, t) {
		function n(r, i, a, o) {
			try {
				var s = e[r](i), c = s.value;
				return c instanceof k ? t.resolve(c.v).then(function(e) {
					n("next", e, a, o);
				}, function(e) {
					n("throw", e, a, o);
				}) : t.resolve(c).then(function(e) {
					s.value = e, a(s);
				}, function(e) {
					return n("throw", e, a, o);
				});
			} catch (e) {
				o(e);
			}
		}
		var r;
		this.next || (O(E.prototype), O(E.prototype, typeof Symbol == "function" && Symbol.asyncIterator || "@asyncIterator", function() {
			return this;
		})), O(this, "_invoke", function(e, i, a) {
			function o() {
				return new t(function(t, r) {
					n(e, a, t, r);
				});
			}
			return r = r ? r.then(o, o) : o();
		}, !0);
	}
	function D() {
		var e, t, n = typeof Symbol == "function" ? Symbol : {}, r = n.iterator || "@@iterator", i = n.toStringTag || "@@toStringTag";
		function a(n, r, i, a) {
			var c = r && r.prototype instanceof s ? r : s, l = Object.create(c.prototype);
			return O(l, "_invoke", function(n, r, i) {
				var a, s, c, l = 0, u = i || [], d = !1, f = {
					p: 0,
					n: 0,
					v: e,
					a: p,
					f: p.bind(e, 4),
					d: function(t, n) {
						return a = t, s = 0, c = e, f.n = n, o;
					}
				};
				function p(n, r) {
					for (s = n, c = r, t = 0; !d && l && !i && t < u.length; t++) {
						var i, a = u[t], p = f.p, m = a[2];
						n > 3 ? (i = m === r) && (c = a[(s = a[4]) ? 5 : (s = 3, 3)], a[4] = a[5] = e) : a[0] <= p && ((i = n < 2 && p < a[1]) ? (s = 0, f.v = r, f.n = a[1]) : p < m && (i = n < 3 || a[0] > r || r > m) && (a[4] = n, a[5] = r, f.n = m, s = 0));
					}
					if (i || n > 1) return o;
					throw d = !0, r;
				}
				return function(i, u, m) {
					if (l > 1) throw TypeError("Generator is already running");
					for (d && u === 1 && p(u, m), s = u, c = m; (t = s < 2 ? e : c) || !d;) {
						a || (s ? s < 3 ? (s > 1 && (f.n = -1), p(s, c)) : f.n = c : f.v = c);
						try {
							if (l = 2, a) {
								if (s || (i = "next"), t = a[i]) {
									if (!(t = t.call(a, c))) throw TypeError("iterator result is not an object");
									if (!t.done) return t;
									c = t.value, s < 2 && (s = 0);
								} else s === 1 && (t = a.return) && t.call(a), s < 2 && (c = TypeError("The iterator does not provide a '" + i + "' method"), s = 1);
								a = e;
							} else if ((t = (d = f.n < 0) ? c : n.call(r, f)) !== o) break;
						} catch (t) {
							a = e, s = 1, c = t;
						} finally {
							l = 1;
						}
					}
					return {
						value: t,
						done: d
					};
				};
			}(n, i, a), !0), l;
		}
		var o = {};
		function s() {}
		function c() {}
		function l() {}
		t = Object.getPrototypeOf;
		var u = [][r] ? t(t([][r]())) : (O(t = {}, r, function() {
			return this;
		}), t), d = l.prototype = s.prototype = Object.create(u);
		function f(e) {
			return Object.setPrototypeOf ? Object.setPrototypeOf(e, l) : (e.__proto__ = l, O(e, i, "GeneratorFunction")), e.prototype = Object.create(d), e;
		}
		return c.prototype = l, O(d, "constructor", l), O(l, "constructor", c), c.displayName = "GeneratorFunction", O(l, i, "GeneratorFunction"), O(d), O(d, i, "Generator"), O(d, r, function() {
			return this;
		}), O(d, "toString", function() {
			return "[object Generator]";
		}), (D = function() {
			return {
				w: a,
				m: f
			};
		})();
	}
	function O(e, t, n, r) {
		var i = Object.defineProperty;
		try {
			i({}, "", {});
		} catch {
			i = 0;
		}
		O = function(e, t, n, r) {
			function a(t, n) {
				O(e, t, function(e) {
					return this._invoke(t, n, e);
				});
			}
			t ? i ? i(e, t, {
				value: n,
				enumerable: !r,
				configurable: !r,
				writable: !r
			}) : e[t] = n : (a("next", 0), a("throw", 1), a("return", 2));
		}, O(e, t, n, r);
	}
	function k(e, t) {
		this.v = e, this.k = t;
	}
	function A(e, t, n, r, i, a, o) {
		try {
			var s = e[a](o), c = s.value;
		} catch (e) {
			n(e);
			return;
		}
		s.done ? t(c) : Promise.resolve(c).then(r, i);
	}
	function j(e) {
		return function() {
			var t = this, n = arguments;
			return new Promise(function(r, i) {
				var a = e.apply(t, n);
				function o(e) {
					A(a, r, i, o, s, "next", e);
				}
				function s(e) {
					A(a, r, i, o, s, "throw", e);
				}
				o(void 0);
			});
		};
	}
	function M(e, t) {
		if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
	}
	function N(e, t) {
		for (var n = 0; n < t.length; n++) {
			var r = t[n];
			r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, U(r.key), r);
		}
	}
	function P(e, t, n) {
		return t && N(e.prototype, t), n && N(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
	}
	function F(e, t) {
		if (typeof t != "function" && t !== null) throw TypeError("Super expression must either be null or a function");
		e.prototype = Object.create(t && t.prototype, { constructor: {
			value: e,
			writable: !0,
			configurable: !0
		} }), Object.defineProperty(e, "prototype", { writable: !1 }), t && I(e, t);
	}
	function I(e, t) {
		return I = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(e, t) {
			return e.__proto__ = t, e;
		}, I(e, t);
	}
	function L(e) {
		var t = B();
		return function() {
			var n, r = V(e);
			if (t) {
				var i = V(this).constructor;
				n = Reflect.construct(r, arguments, i);
			} else n = r.apply(this, arguments);
			return R(this, n);
		};
	}
	function R(e, t) {
		if (t && (f(t) == "object" || typeof t == "function")) return t;
		if (t !== void 0) throw TypeError("Derived constructors may only return object or undefined");
		return z(e);
	}
	function z(e) {
		if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
		return e;
	}
	function B() {
		try {
			var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
		} catch {}
		return (B = function() {
			return !!e;
		})();
	}
	function V(e) {
		return V = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(e) {
			return e.__proto__ || Object.getPrototypeOf(e);
		}, V(e);
	}
	function H(e, t, n) {
		return (t = U(t)) in e ? Object.defineProperty(e, t, {
			value: n,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[t] = n, e;
	}
	function U(e) {
		var t = W(e, "string");
		return f(t) == "symbol" ? t : t + "";
	}
	function W(e, t) {
		if (f(e) != "object" || !e) return e;
		var n = e[Symbol.toPrimitive];
		if (n !== void 0) {
			var r = n.call(e, t || "default");
			if (f(r) != "object") return r;
			throw TypeError("@@toPrimitive must return a primitive value.");
		}
		return (t === "string" ? String : Number)(e);
	}
	function G(e) {
		var t, n, r, i = 2;
		for (typeof Symbol < "u" && (n = Symbol.asyncIterator, r = Symbol.iterator); i--;) {
			if (n && (t = e[n]) != null) return t.call(e);
			if (r && (t = e[r]) != null) return new K(t.call(e));
			n = "@@asyncIterator", r = "@@iterator";
		}
		throw TypeError("Object is not async iterable");
	}
	function K(e) {
		function t(e) {
			if (Object(e) !== e) return Promise.reject(/* @__PURE__ */ TypeError(e + " is not an object."));
			var t = e.done;
			return Promise.resolve(e.value).then(function(e) {
				return {
					value: e,
					done: t
				};
			});
		}
		return K = function(e) {
			this.s = e, this.n = e.next;
		}, K.prototype = {
			s: null,
			n: null,
			next: function() {
				return t(this.n.apply(this.s, arguments));
			},
			return: function(e) {
				var n = this.s.return;
				return n === void 0 ? Promise.resolve({
					value: e,
					done: !0
				}) : t(n.apply(this.s, arguments));
			},
			throw: function(e) {
				var n = this.s.return;
				return n === void 0 ? Promise.reject(e) : t(n.apply(this.s, arguments));
			}
		}, new K(e);
	}
	e.ClientWidgetApi = /* @__PURE__ */ function(e) {
		F(f, e);
		var t = L(f);
		function f(e, i, a) {
			var o;
			if (M(this, f), o = t.call(this), o.widget = e, o.driver = a, H(z(o), "transport", void 0), H(z(o), "cachedWidgetVersions", null), H(z(o), "contentLoadedActionSent", !1), H(z(o), "allowedCapabilities", /* @__PURE__ */ new Set()), H(z(o), "allowedEvents", []), H(z(o), "isStopped", !1), H(z(o), "turnServers", null), H(z(o), "contentLoadedWaitTimer", void 0), H(z(o), "pushRoomStateTasks", /* @__PURE__ */ new Set()), H(z(o), "pushRoomStateResult", /* @__PURE__ */ new Map()), H(z(o), "flushRoomStateTask", null), H(z(o), "viewedRoomId", null), !(i != null && i.contentWindow)) throw Error("No iframe supplied");
			if (!e) throw Error("Invalid widget");
			if (!a) throw Error("Invalid driver");
			return o.transport = new n.PostmessageTransport(r.WidgetApiDirection.ToWidget, e.id, i.contentWindow, globalThis), o.transport.targetOrigin = e.origin, o.transport.on("message", o.handleMessage.bind(z(o))), i.addEventListener("load", o.onIframeLoad.bind(z(o))), o.transport.start(), o;
		}
		return P(f, [
			{
				key: "hasCapability",
				value: function(e) {
					return this.allowedCapabilities.has(e);
				}
			},
			{
				key: "canUseRoomTimeline",
				value: function(e) {
					return this.hasCapability(`org.matrix.msc2762.timeline:${u.Symbols.AnyRoom}`) || this.hasCapability(`org.matrix.msc2762.timeline:${e}`);
				}
			},
			{
				key: "canSendRoomEvent",
				value: function(e) {
					var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
					return this.allowedEvents.some(function(n) {
						return n.matchesAsRoomEvent(s.EventDirection.Send, e, t);
					});
				}
			},
			{
				key: "canSendStateEvent",
				value: function(e, t) {
					return this.allowedEvents.some(function(n) {
						return n.matchesAsStateEvent(s.EventDirection.Send, e, t);
					});
				}
			},
			{
				key: "canSendToDeviceEvent",
				value: function(e) {
					return this.allowedEvents.some(function(t) {
						return t.matchesAsToDeviceEvent(s.EventDirection.Send, e);
					});
				}
			},
			{
				key: "canReceiveRoomEvent",
				value: function(e) {
					var t = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
					return this.allowedEvents.some(function(n) {
						return n.matchesAsRoomEvent(s.EventDirection.Receive, e, t);
					});
				}
			},
			{
				key: "canReceiveStateEvent",
				value: function(e, t) {
					return this.allowedEvents.some(function(n) {
						return n.matchesAsStateEvent(s.EventDirection.Receive, e, t);
					});
				}
			},
			{
				key: "canReceiveToDeviceEvent",
				value: function(e) {
					return this.allowedEvents.some(function(t) {
						return t.matchesAsToDeviceEvent(s.EventDirection.Receive, e);
					});
				}
			},
			{
				key: "canReceiveRoomAccountData",
				value: function(e) {
					return this.allowedEvents.some(function(t) {
						return t.matchesAsRoomAccountData(s.EventDirection.Receive, e);
					});
				}
			},
			{
				key: "stop",
				value: function() {
					this.isStopped = !0, this.transport.stop();
				}
			},
			{
				key: "getWidgetVersions",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e() {
						var t;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (!Array.isArray(this.cachedWidgetVersions)) {
										e.next = 2;
										break;
									}
									return e.abrupt("return", this.cachedWidgetVersions);
								case 2: return e.prev = 2, e.next = 5, this.transport.send(i.WidgetApiToWidgetAction.SupportedApiVersions, {});
								case 5: return t = e.sent, this.cachedWidgetVersions = t.supported_versions, e.abrupt("return", t.supported_versions);
								case 10: return e.prev = 10, e.t0 = e.catch(2), console.warn("non-fatal error getting supported widget versions: ", e.t0), e.abrupt("return", []);
								case 14:
								case "end": return e.stop();
							}
						}, e, this, [[2, 10]]);
					}));
					function t() {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "beginCapabilities",
				value: function() {
					var e = this;
					this.emit("preparing");
					var t;
					this.transport.send(i.WidgetApiToWidgetAction.Capabilities, {}).then(function(n) {
						return t = n.capabilities, e.driver.validateCapabilities(new Set(n.capabilities));
					}).then(function(n) {
						e.allowCapabilities(g(n), t), e.emit("ready");
					}).catch(function(t) {
						e.emit("error:preparing", t);
					});
				}
			},
			{
				key: "allowCapabilities",
				value: function(e, t) {
					var n, r = this;
					console.log(`Widget ${this.widget.id} is allowed capabilities:`, e);
					var o = h(e), c;
					try {
						for (o.s(); !(c = o.n()).done;) {
							var l = c.value;
							this.allowedCapabilities.add(l);
						}
					} catch (e) {
						o.e(e);
					} finally {
						o.f();
					}
					var d = s.WidgetEventCapability.findEventCapabilities(e);
					(n = this.allowedEvents).push.apply(n, g(d)), this.transport.send(i.WidgetApiToWidgetAction.NotifyCapabilities, {
						requested: t,
						approved: Array.from(this.allowedCapabilities)
					}).catch(function(e) {
						console.warn("non-fatal error notifying widget of approved capabilities:", e);
					}).then(function() {
						r.emit("capabilitiesNotified");
					});
					var f = h(e), p;
					try {
						for (f.s(); !(p = f.n()).done;) {
							var m = p.value;
							if ((0, a.isTimelineCapability)(m)) {
								var _ = (0, a.getTimelineRoomIDFromCapability)(m);
								if (_ === u.Symbols.AnyRoom) {
									var v = h(this.driver.getKnownRooms()), y;
									try {
										for (v.s(); !(y = v.n()).done;) {
											var b = y.value;
											this.pushRoomState(b);
										}
									} catch (e) {
										v.e(e);
									} finally {
										v.f();
									}
								} else this.pushRoomState(_);
							}
						}
					} catch (e) {
						f.e(e);
					} finally {
						f.f();
					}
					if (e.includes(a.MatrixCapabilities.MSC4407ReceiveStickyEvent)) {
						console.debug(`Widget ${this.widget.id} is allowed to receive sticky events, check current sticky state.`);
						var x = e.filter(function(e) {
							return (0, a.isTimelineCapability)(e);
						}).map(function(e) {
							return (0, a.getTimelineRoomIDFromCapability)(e);
						}).flatMap(function(e) {
							return e === u.Symbols.AnyRoom ? r.driver.getKnownRooms() : e;
						});
						console.debug(`Widget ${this.widget.id} is allowed to receive sticky events in rooms:`, x);
						var S = h(x), C;
						try {
							var w = function() {
								var e = C.value;
								r.pushStickyState(e).catch(function(t) {
									console.error(`Failed to push sticky events to widget ${r.widget.id} for room ${e}:`, t);
								});
							};
							for (S.s(); !(C = S.n()).done;) w();
						} catch (e) {
							S.e(e);
						} finally {
							S.f();
						}
					}
					d.length > 0 && this.viewedRoomId !== null && !this.canUseRoomTimeline(this.viewedRoomId) && this.pushRoomState(this.viewedRoomId);
				}
			},
			{
				key: "onIframeLoad",
				value: function(e) {
					this.widget.waitForIframeLoad ? this.beginCapabilities() : (console.log("waitForIframeLoad is false: waiting for widget to send contentLoaded"), this.contentLoadedWaitTimer = setTimeout(function() {
						console.error("Widget specified waitForIframeLoad=false but timed out waiting for contentLoaded event!");
					}, 1e4), this.contentLoadedActionSent = !1);
				}
			},
			{
				key: "handleContentLoadedAction",
				value: function(e) {
					if (this.contentLoadedWaitTimer !== void 0 && (clearTimeout(this.contentLoadedWaitTimer), this.contentLoadedWaitTimer = void 0), this.contentLoadedActionSent) throw Error("Improper sequence: ContentLoaded Action can only be sent once after the widget loaded and should only be used if waitForIframeLoad is false (default=true)");
					this.widget.waitForIframeLoad ? this.transport.reply(e, { error: { message: "Improper sequence: not expecting ContentLoaded event if waitForIframeLoad is true (default=true)" } }) : (this.transport.reply(e, {}), this.beginCapabilities()), this.contentLoadedActionSent = !0;
				}
			},
			{
				key: "replyVersions",
				value: function(e) {
					this.transport.reply(e, { supported_versions: o.CurrentApiVersions });
				}
			},
			{
				key: "supportsUpdateState",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e() {
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0: return e.next = 2, this.getWidgetVersions();
								case 2: return e.abrupt("return", e.sent.includes(o.UnstableApiVersion.MSC2762_UPDATE_STATE));
								case 3:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t() {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "handleCapabilitiesRenegotiate",
				value: function(e) {
					var t = this;
					this.transport.reply(e, {});
					var n = e.data?.capabilities || [], r = new Set(n.filter(function(e) {
						return !t.hasCapability(e);
					}));
					r.size === 0 && this.allowCapabilities([], []), this.driver.validateCapabilities(r).then(function(e) {
						return t.allowCapabilities(g(e), g(r));
					});
				}
			},
			{
				key: "handleNavigate",
				value: function(e) {
					var t, n = this;
					if (!this.hasCapability(a.MatrixCapabilities.MSC2931Navigate)) return this.transport.reply(e, { error: { message: "Missing capability" } });
					if (!((t = e.data) != null && t.uri.startsWith("https://matrix.to/#"))) return this.transport.reply(e, { error: { message: "Invalid matrix.to URI" } });
					var r = function(t) {
						console.error("[ClientWidgetApi] Failed to handle navigation: ", t), n.handleDriverError(t, e, "Error handling navigation");
					};
					try {
						this.driver.navigate(e.data.uri.toString()).catch(function(e) {
							return r(e);
						}).then(function() {
							return n.transport.reply(e, {});
						});
					} catch (e) {
						return r(e);
					}
				}
			},
			{
				key: "handleOIDC",
				value: function(e) {
					var t = this, n = 1, r = function(r, a) {
						return a ||= {}, n > 1 ? t.transport.send(i.WidgetApiToWidgetAction.OpenIDCredentials, m({
							state: r,
							original_request_id: e.requestId
						}, a)) : t.transport.reply(e, m({ state: r }, a));
					}, a = function(i) {
						return console.error("[ClientWidgetApi] Failed to handle OIDC: ", i), n > 1 ? r(c.OpenIDRequestState.Blocked) : t.transport.reply(e, { error: { message: i } });
					}, o = new l.SimpleObservable(function(e) {
						if (e.state === c.OpenIDRequestState.PendingUserConfirmation && n > 1) return o.close(), a("client provided out-of-phase response to OIDC flow");
						if (e.state === c.OpenIDRequestState.PendingUserConfirmation) r(e.state), n++;
						else return e.state === c.OpenIDRequestState.Allowed && !e.token ? a("client provided invalid OIDC token for an allowed request") : (e.state === c.OpenIDRequestState.Blocked && (e.token = void 0), o.close(), r(e.state, e.token));
					});
					this.driver.askOpenID(o);
				}
			},
			{
				key: "handleReadRoomAccountData",
				value: function(e) {
					var t = this, n = this.driver.readRoomAccountData(e.data.type);
					return this.canReceiveRoomAccountData(e.data.type) ? n.then(function(n) {
						t.transport.reply(e, { events: n });
					}) : this.transport.reply(e, { error: { message: "Cannot read room account data of this type" } });
				}
			},
			{
				key: "handleReadEvents",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						var n = this, r, i, a, o, s, c, l, d, f;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (t.data.type) {
										e.next = 2;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Invalid request - missing event type" } }));
								case 2:
									if (!(t.data.limit !== void 0 && (!t.data.limit || t.data.limit < 0))) {
										e.next = 4;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Invalid request - limit out of range" } }));
								case 4:
									if (t.data.room_ids !== void 0) {
										e.next = 8;
										break;
									}
									r = this.viewedRoomId === null ? [] : [this.viewedRoomId], e.next = 30;
									break;
								case 8:
									if (t.data.room_ids !== u.Symbols.AnyRoom) {
										e.next = 12;
										break;
									}
									r = this.driver.getKnownRooms().filter(function(e) {
										return n.canUseRoomTimeline(e);
									}), e.next = 30;
									break;
								case 12: r = t.data.room_ids, i = h(r), e.prev = 14, i.s();
								case 16:
									if ((a = i.n()).done) {
										e.next = 22;
										break;
									}
									if (o = a.value, this.canUseRoomTimeline(o)) {
										e.next = 20;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: `Unable to access room timeline: ${o}` } }));
								case 20:
									e.next = 16;
									break;
								case 22:
									e.next = 27;
									break;
								case 24: e.prev = 24, e.t0 = e.catch(14), i.e(e.t0);
								case 27: return e.prev = 27, i.f(), e.finish(27);
								case 30:
									if (s = t.data.limit || 0, c = t.data.since, l = void 0, d = void 0, t.data.state_key === void 0) {
										e.next = 40;
										break;
									}
									if (l = t.data.state_key === !0 ? void 0 : t.data.state_key.toString(), this.canReceiveStateEvent(t.data.type, l ?? null)) {
										e.next = 38;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Cannot read state events of this type" } }));
								case 38:
									e.next = 43;
									break;
								case 40:
									if (d = t.data.msgtype, this.canReceiveRoomEvent(t.data.type, d)) {
										e.next = 43;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Cannot read room events of this type" } }));
								case 43:
									if (t.data.room_ids !== void 0 || r.length !== 0) {
										e.next = 50;
										break;
									}
									return console.warn("The widgetDriver uses deprecated behaviour:\n It does not set the viewedRoomId using `setViewedRoomId`"), e.next = 47, t.data.state_key === void 0 ? this.driver.readRoomEvents(t.data.type, d, s, null, c) : this.driver.readStateEvents(t.data.type, l, s, null);
								case 47:
									f = e.sent, e.next = 68;
									break;
								case 50: return e.next = 52, this.supportsUpdateState();
								case 52:
									if (!e.sent) {
										e.next = 58;
										break;
									}
									return e.next = 55, Promise.all(r.map(function(e) {
										return n.driver.readRoomTimeline(e, t.data.type, d, l, s, c);
									}));
								case 55:
									f = e.sent.flat(1), e.next = 68;
									break;
								case 58:
									if (t.data.state_key !== void 0) {
										e.next = 64;
										break;
									}
									return e.next = 61, Promise.all(r.map(function(e) {
										return n.driver.readRoomTimeline(e, t.data.type, d, l, s, c);
									}));
								case 61:
									e.t1 = e.sent, e.next = 67;
									break;
								case 64: return e.next = 66, Promise.all(r.map(function(e) {
									return n.driver.readRoomState(e, t.data.type, l);
								}));
								case 66: e.t1 = e.sent;
								case 67: f = e.t1.flat(1);
								case 68: this.transport.reply(t, { events: f });
								case 69:
								case "end": return e.stop();
							}
						}, e, this, [[
							14,
							24,
							27,
							30
						]]);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "handleSendEvent",
				value: function(e) {
					var t = this;
					if (!e.data.type) return this.transport.reply(e, { error: { message: "Invalid request - missing event type" } });
					if (e.data.room_id && !this.canUseRoomTimeline(e.data.room_id)) return this.transport.reply(e, { error: { message: `Unable to access room timeline: ${e.data.room_id}` } });
					e.data.parent_delay_id !== void 0 && console.warn("Data includes parent_delay_id, but the widgetDriver ignores it");
					var n = e.data.delay;
					if (n !== void 0 && !this.hasCapability(a.MatrixCapabilities.MSC4157SendDelayedEvent)) return this.transport.reply(e, { error: { message: `Missing capability for ${a.MatrixCapabilities.MSC4157SendDelayedEvent}` } });
					var r = e.data.sticky_duration_ms !== void 0;
					if (r && !this.hasCapability(a.MatrixCapabilities.MSC4407SendStickyEvent)) return this.transport.reply(e, { error: { message: `Missing capability for ${a.MatrixCapabilities.MSC4407SendStickyEvent}` } });
					var i;
					if (e.data.state_key !== void 0) {
						if (!this.canSendStateEvent(e.data.type, e.data.state_key)) return this.transport.reply(e, { error: { message: "Cannot send state events of this type" } });
						if (r) return this.transport.reply(e, { error: { message: "Cannot send a state event with a sticky duration" } });
						i = n === void 0 ? this.driver.sendEvent(e.data.type, e.data.content || {}, e.data.state_key, e.data.room_id) : this.driver.sendDelayedEvent(n, e.data.type, e.data.content || {}, e.data.state_key, e.data.room_id);
					} else {
						var o = e.data.content || {}, s = o.msgtype;
						if (!this.canSendRoomEvent(e.data.type, s)) return this.transport.reply(e, { error: { message: "Cannot send room events of this type" } });
						var c = [
							e.data.type,
							o,
							null,
							e.data.room_id
						];
						if (n !== void 0 && e.data.sticky_duration_ms) i = this.driver.sendDelayedStickyEvent(n, e.data.sticky_duration_ms, e.data.type, o, e.data.room_id);
						else if (n !== void 0) {
							var l;
							i = (l = this.driver).sendDelayedEvent.apply(l, [n].concat(c));
						} else if (e.data.sticky_duration_ms) i = this.driver.sendStickyEvent(e.data.sticky_duration_ms, e.data.type, o, e.data.room_id);
						else {
							var u;
							i = (u = this.driver).sendEvent.apply(u, c);
						}
					}
					i.then(function(n) {
						return t.transport.reply(e, m({ room_id: n.roomId }, "eventId" in n ? { event_id: n.eventId } : { delay_id: n.delayId }));
					}).catch(function(n) {
						console.error("error sending event: ", n), t.handleDriverError(n, e, "Error sending event");
					});
				}
			},
			{
				key: "handleUpdateDelayedEvent",
				value: function(e) {
					var t = this;
					if (!e.data.delay_id) return this.transport.reply(e, { error: { message: "Invalid request - missing delay_id" } });
					if (!this.hasCapability(a.MatrixCapabilities.MSC4157UpdateDelayedEvent)) return this.transport.reply(e, { error: { message: "Missing capability" } });
					var n;
					switch (e.data.action) {
						case d.UpdateDelayedEventAction.Cancel:
							n = this.driver.cancelScheduledDelayedEvent;
							break;
						case d.UpdateDelayedEventAction.Restart:
							n = this.driver.restartScheduledDelayedEvent;
							break;
						case d.UpdateDelayedEventAction.Send:
							n = this.driver.sendScheduledDelayedEvent;
							break;
						default: return this.transport.reply(e, { error: { message: "Invalid request - unsupported action" } });
					}
					n.call(this.driver, e.data.delay_id).then(function() {
						return t.transport.reply(e, {});
					}).catch(function(n) {
						console.error("error updating delayed event: ", n), t.handleDriverError(n, e, "Error updating delayed event");
					});
				}
			},
			{
				key: "handleSendToDevice",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (t.data.type) {
										e.next = 4;
										break;
									}
									this.transport.reply(t, { error: { message: "Invalid request - missing event type" } }), e.next = 26;
									break;
								case 4:
									if (t.data.messages) {
										e.next = 8;
										break;
									}
									this.transport.reply(t, { error: { message: "Invalid request - missing event contents" } }), e.next = 26;
									break;
								case 8:
									if (typeof t.data.encrypted == "boolean") {
										e.next = 12;
										break;
									}
									this.transport.reply(t, { error: { message: "Invalid request - missing encryption flag" } }), e.next = 26;
									break;
								case 12:
									if (this.canSendToDeviceEvent(t.data.type)) {
										e.next = 16;
										break;
									}
									this.transport.reply(t, { error: { message: "Cannot send to-device events of this type" } }), e.next = 26;
									break;
								case 16: return e.prev = 16, e.next = 19, this.driver.sendToDevice(t.data.type, t.data.encrypted, t.data.messages);
								case 19:
									this.transport.reply(t, {}), e.next = 26;
									break;
								case 22: e.prev = 22, e.t0 = e.catch(16), console.error("error sending to-device event", e.t0), this.handleDriverError(e.t0, t, "Error sending event");
								case 26:
								case "end": return e.stop();
							}
						}, e, this, [[16, 22]]);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "pollTurnServers",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t, n) {
						var r, a, o, s, c, l;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0: return e.prev = 0, e.next = 3, this.transport.send(i.WidgetApiToWidgetAction.UpdateTurnServers, n);
								case 3: r = !1, a = !1, e.prev = 5, s = G(t);
								case 7: return e.next = 9, s.next();
								case 9:
									if (!(r = !(c = e.sent).done)) {
										e.next = 16;
										break;
									}
									return l = c.value, e.next = 13, this.transport.send(i.WidgetApiToWidgetAction.UpdateTurnServers, l);
								case 13:
									r = !1, e.next = 7;
									break;
								case 16:
									e.next = 22;
									break;
								case 18: e.prev = 18, e.t0 = e.catch(5), a = !0, o = e.t0;
								case 22:
									if (e.prev = 22, e.prev = 23, !(r && s.return != null)) {
										e.next = 27;
										break;
									}
									return e.next = 27, s.return();
								case 27:
									if (e.prev = 27, !a) {
										e.next = 30;
										break;
									}
									throw o;
								case 30: return e.finish(27);
								case 31: return e.finish(22);
								case 32:
									e.next = 37;
									break;
								case 34: e.prev = 34, e.t1 = e.catch(0), console.error("error polling for TURN servers", e.t1);
								case 37:
								case "end": return e.stop();
							}
						}, e, this, [
							[0, 34],
							[
								5,
								18,
								22,
								32
							],
							[
								23,
								,
								27,
								31
							]
						]);
					}));
					function t(t, n) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "handleWatchTurnServers",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						var n, r, i, o;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (this.hasCapability(a.MatrixCapabilities.MSC3846TurnServers)) {
										e.next = 4;
										break;
									}
									this.transport.reply(t, { error: { message: "Missing capability" } }), e.next = 26;
									break;
								case 4:
									if (!this.turnServers) {
										e.next = 8;
										break;
									}
									this.transport.reply(t, {}), e.next = 26;
									break;
								case 8: return e.prev = 8, n = this.driver.getTurnServers(), e.next = 12, n.next();
								case 12:
									if (r = e.sent, i = r.done, o = r.value, !i) {
										e.next = 17;
										break;
									}
									throw Error("Client refuses to provide any TURN servers");
								case 17:
									this.transport.reply(t, {}), this.pollTurnServers(n, o), this.turnServers = n, e.next = 26;
									break;
								case 22: e.prev = 22, e.t0 = e.catch(8), console.error("error getting first TURN server results", e.t0), this.transport.reply(t, { error: { message: "TURN servers not available" } });
								case 26:
								case "end": return e.stop();
							}
						}, e, this, [[8, 22]]);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "handleUnwatchTurnServers",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (this.hasCapability(a.MatrixCapabilities.MSC3846TurnServers)) {
										e.next = 4;
										break;
									}
									this.transport.reply(t, { error: { message: "Missing capability" } }), e.next = 12;
									break;
								case 4:
									if (this.turnServers) {
										e.next = 8;
										break;
									}
									this.transport.reply(t, {}), e.next = 12;
									break;
								case 8: return e.next = 10, this.turnServers.return(void 0);
								case 10: this.turnServers = null, this.transport.reply(t, {});
								case 12:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "handleReadRelations",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						var n = this, r, i;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (t.data.event_id) {
										e.next = 2;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Invalid request - missing event ID" } }));
								case 2:
									if (!(t.data.limit !== void 0 && t.data.limit < 0)) {
										e.next = 4;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Invalid request - limit out of range" } }));
								case 4:
									if (t.data.room_id === void 0 || this.canUseRoomTimeline(t.data.room_id)) {
										e.next = 6;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: `Unable to access room timeline: ${t.data.room_id}` } }));
								case 6: return e.prev = 6, e.next = 9, this.driver.readEventRelations(t.data.event_id, t.data.room_id, t.data.rel_type, t.data.event_type, t.data.from, t.data.to, t.data.limit, t.data.direction);
								case 9: return r = e.sent, i = r.chunk.filter(function(e) {
									return e.state_key === void 0 ? n.canReceiveRoomEvent(e.type, e.content.msgtype) : n.canReceiveStateEvent(e.type, e.state_key);
								}), e.abrupt("return", this.transport.reply(t, {
									chunk: i,
									prev_batch: r.prevBatch,
									next_batch: r.nextBatch
								}));
								case 14: e.prev = 14, e.t0 = e.catch(6), console.error("error getting the relations", e.t0), this.handleDriverError(e.t0, t, "Unexpected error while reading relations");
								case 18:
								case "end": return e.stop();
							}
						}, e, this, [[6, 14]]);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "handleUserDirectorySearch",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						var n;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (this.hasCapability(a.MatrixCapabilities.MSC3973UserDirectorySearch)) {
										e.next = 2;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Missing capability" } }));
								case 2:
									if (typeof t.data.search_term == "string") {
										e.next = 4;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Invalid request - missing search term" } }));
								case 4:
									if (!(t.data.limit !== void 0 && t.data.limit < 0)) {
										e.next = 6;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Invalid request - limit out of range" } }));
								case 6: return e.prev = 6, e.next = 9, this.driver.searchUserDirectory(t.data.search_term, t.data.limit);
								case 9: return n = e.sent, e.abrupt("return", this.transport.reply(t, {
									limited: n.limited,
									results: n.results.map(function(e) {
										return {
											user_id: e.userId,
											display_name: e.displayName,
											avatar_url: e.avatarUrl
										};
									})
								}));
								case 13: e.prev = 13, e.t0 = e.catch(6), console.error("error searching in the user directory", e.t0), this.handleDriverError(e.t0, t, "Unexpected error while searching in the user directory");
								case 17:
								case "end": return e.stop();
							}
						}, e, this, [[6, 13]]);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "handleGetMediaConfig",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						var n;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (this.hasCapability(a.MatrixCapabilities.MSC4039UploadFile)) {
										e.next = 2;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Missing capability" } }));
								case 2: return e.prev = 2, e.next = 5, this.driver.getMediaConfig();
								case 5: return n = e.sent, e.abrupt("return", this.transport.reply(t, n));
								case 9: e.prev = 9, e.t0 = e.catch(2), console.error("error while getting the media configuration", e.t0), this.handleDriverError(e.t0, t, "Unexpected error while getting the media configuration");
								case 13:
								case "end": return e.stop();
							}
						}, e, this, [[2, 9]]);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "handleRtcTransports",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						var n;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (this.hasCapability(a.MatrixCapabilities.MSC4515RtcTransports)) {
										e.next = 2;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Missing capability" } }));
								case 2: return e.prev = 2, e.next = 5, this.driver.getRtcTransports();
								case 5: return n = e.sent, e.abrupt("return", this.transport.reply(t, { rtc_transports: n.rtc_transports }));
								case 9: e.prev = 9, e.t0 = e.catch(2), console.error("error while getting the RTC transports", e.t0), this.handleDriverError(e.t0, t, "Unexpected error while getting the RTC transports");
								case 13:
								case "end": return e.stop();
							}
						}, e, this, [[2, 9]]);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "handleUploadFile",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						var n;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (this.hasCapability(a.MatrixCapabilities.MSC4039UploadFile)) {
										e.next = 2;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Missing capability" } }));
								case 2: return e.prev = 2, e.next = 5, this.driver.uploadFile(t.data.file);
								case 5: return n = e.sent, e.abrupt("return", this.transport.reply(t, { content_uri: n.contentUri }));
								case 9: e.prev = 9, e.t0 = e.catch(2), console.error("error while uploading a file", e.t0), this.handleDriverError(e.t0, t, "Unexpected error while uploading a file");
								case 13:
								case "end": return e.stop();
							}
						}, e, this, [[2, 9]]);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "handleDownloadFile",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						var n;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (this.hasCapability(a.MatrixCapabilities.MSC4039DownloadFile)) {
										e.next = 2;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Missing capability" } }));
								case 2: return e.prev = 2, e.next = 5, this.driver.downloadFile(t.data.content_uri);
								case 5: return n = e.sent, e.abrupt("return", this.transport.reply(t, { file: n.file }));
								case 9: e.prev = 9, e.t0 = e.catch(2), console.error("error while downloading a file", e.t0), this.handleDriverError(e.t0, t, "Unexpected error while downloading a file");
								case 13:
								case "end": return e.stop();
							}
						}, e, this, [[2, 9]]);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "handleRtcLivekitGetToken",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						var n;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (this.hasCapability(a.MatrixCapabilities.MSC4533RtcLivekitGetToken)) {
										e.next = 2;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Missing capability" } }));
								case 2: return e.prev = 2, e.next = 5, this.driver.getRtcLivekitToken(t.data);
								case 5: return n = e.sent, e.abrupt("return", this.transport.reply(t, n));
								case 9: e.prev = 9, e.t0 = e.catch(2), console.error("error while getting a LiveKit token", e.t0), this.handleDriverError(e.t0, t, "Unexpected error while getting a LiveKit token");
								case 13:
								case "end": return e.stop();
							}
						}, e, this, [[2, 9]]);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "handleRtcLivekitDelegateDelayedLeave",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						var n;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (this.hasCapability(a.MatrixCapabilities.MSC4533RtcLivekitDelegateDelayedLeave)) {
										e.next = 2;
										break;
									}
									return e.abrupt("return", this.transport.reply(t, { error: { message: "Missing capability" } }));
								case 2: return e.prev = 2, e.next = 5, this.driver.delegateRtcLivekitDelayedLeave(t.data);
								case 5: return n = e.sent, e.abrupt("return", this.transport.reply(t, n));
								case 9: e.prev = 9, e.t0 = e.catch(2), console.error("error while delegating a LiveKit delayed leave", e.t0), this.handleDriverError(e.t0, t, "Unexpected error while delegating a LiveKit delayed leave");
								case 13:
								case "end": return e.stop();
							}
						}, e, this, [[2, 9]]);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "handleDriverError",
				value: function(e, t, n) {
					var r = this.driver.processError(e);
					this.transport.reply(t, { error: m({ message: n }, r) });
				}
			},
			{
				key: "handleMessage",
				value: function(e) {
					if (!this.isStopped) {
						var t = new CustomEvent(`action:${e.detail.action}`, {
							detail: e.detail,
							cancelable: !0
						});
						if (this.emit(`action:${e.detail.action}`, t), !t.defaultPrevented) switch (e.detail.action) {
							case i.WidgetApiFromWidgetAction.ContentLoaded: return this.handleContentLoadedAction(e.detail);
							case i.WidgetApiFromWidgetAction.SupportedApiVersions: return this.replyVersions(e.detail);
							case i.WidgetApiFromWidgetAction.SendEvent: return this.handleSendEvent(e.detail);
							case i.WidgetApiFromWidgetAction.SendToDevice: return this.handleSendToDevice(e.detail);
							case i.WidgetApiFromWidgetAction.GetOpenIDCredentials: return this.handleOIDC(e.detail);
							case i.WidgetApiFromWidgetAction.MSC2931Navigate: return this.handleNavigate(e.detail);
							case i.WidgetApiFromWidgetAction.MSC2974RenegotiateCapabilities: return this.handleCapabilitiesRenegotiate(e.detail);
							case i.WidgetApiFromWidgetAction.MSC2876ReadEvents: return this.handleReadEvents(e.detail);
							case i.WidgetApiFromWidgetAction.WatchTurnServers: return this.handleWatchTurnServers(e.detail);
							case i.WidgetApiFromWidgetAction.UnwatchTurnServers: return this.handleUnwatchTurnServers(e.detail);
							case i.WidgetApiFromWidgetAction.MSC3869ReadRelations: return this.handleReadRelations(e.detail);
							case i.WidgetApiFromWidgetAction.MSC3973UserDirectorySearch: return this.handleUserDirectorySearch(e.detail);
							case i.WidgetApiFromWidgetAction.BeeperReadRoomAccountData: return this.handleReadRoomAccountData(e.detail);
							case i.WidgetApiFromWidgetAction.MSC4039GetMediaConfigAction: return this.handleGetMediaConfig(e.detail);
							case i.WidgetApiFromWidgetAction.MSC4515GetRtcTransports: return this.handleRtcTransports(e.detail);
							case i.WidgetApiFromWidgetAction.MSC4039UploadFileAction: return this.handleUploadFile(e.detail);
							case i.WidgetApiFromWidgetAction.MSC4039DownloadFileAction: return this.handleDownloadFile(e.detail);
							case i.WidgetApiFromWidgetAction.MSC4157UpdateDelayedEvent: return this.handleUpdateDelayedEvent(e.detail);
							case i.WidgetApiFromWidgetAction.MSC4533RtcLivekitGetToken: return this.handleRtcLivekitGetToken(e.detail);
							case i.WidgetApiFromWidgetAction.MSC4533RtcLivekitDelegateDelayedLeave: return this.handleRtcLivekitDelegateDelayedLeave(e.detail);
							default: return this.transport.reply(e.detail, { error: { message: "Unknown or unsupported from-widget action: " + e.detail.action } });
						}
					}
				}
			},
			{
				key: "updateTheme",
				value: function(e) {
					return this.transport.send(i.WidgetApiToWidgetAction.ThemeChange, e);
				}
			},
			{
				key: "updateLanguage",
				value: function(e) {
					return this.transport.send(i.WidgetApiToWidgetAction.LanguageChange, { lang: e });
				}
			},
			{
				key: "takeScreenshot",
				value: function() {
					return this.transport.send(i.WidgetApiToWidgetAction.TakeScreenshot, {});
				}
			},
			{
				key: "updateVisibility",
				value: function(e) {
					return this.transport.send(i.WidgetApiToWidgetAction.UpdateVisibility, { visible: e });
				}
			},
			{
				key: "sendWidgetConfig",
				value: function(e) {
					return this.transport.send(i.WidgetApiToWidgetAction.WidgetConfig, e).then();
				}
			},
			{
				key: "notifyModalWidgetButtonClicked",
				value: function(e) {
					return this.transport.send(i.WidgetApiToWidgetAction.ButtonClicked, { id: e }).then();
				}
			},
			{
				key: "notifyModalWidgetClose",
				value: function(e) {
					return this.transport.send(i.WidgetApiToWidgetAction.CloseModalWidget, e).then();
				}
			},
			{
				key: "feedEvent",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t, n) {
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (n !== void 0 && this.setViewedRoomId(n), t.room_id === this.viewedRoomId || this.canUseRoomTimeline(t.room_id)) {
										e.next = 3;
										break;
									}
									return e.abrupt("return");
								case 3:
									if (t.state_key === void 0 || t.state_key === null) {
										e.next = 8;
										break;
									}
									if (this.canReceiveStateEvent(t.type, t.state_key)) {
										e.next = 6;
										break;
									}
									return e.abrupt("return");
								case 6:
									e.next = 10;
									break;
								case 8:
									if (this.canReceiveRoomEvent(t.type, t.content?.msgtype)) {
										e.next = 10;
										break;
									}
									return e.abrupt("return");
								case 10: return e.next = 12, this.transport.send(i.WidgetApiToWidgetAction.SendEvent, t);
								case 12:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t(t, n) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "feedToDevice",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t, n) {
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (!this.canReceiveToDeviceEvent(t.type)) {
										e.next = 3;
										break;
									}
									return e.next = 3, this.transport.send(i.WidgetApiToWidgetAction.SendToDevice, m(m({}, t), {}, { encrypted: n }));
								case 3:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t(t, n) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "setViewedRoomId",
				value: function(e) {
					this.viewedRoomId = e, e !== null && !this.canUseRoomTimeline(e) && this.pushRoomState(e);
				}
			},
			{
				key: "flushRoomState",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e() {
						var t, n, r, a, s, c, l;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0: e.prev = 0;
								case 1: return e.next = 3, Promise.all(this.pushRoomStateTasks);
								case 3: if (this.pushRoomStateTasks.size > 0) {
									e.next = 1;
									break;
								}
								case 4:
									t = [], n = h(this.pushRoomStateResult.values());
									try {
										for (n.s(); !(r = n.n()).done;) {
											a = r.value, s = h(a.values());
											try {
												for (s.s(); !(c = s.n()).done;) l = c.value, t.push.apply(t, g(l.values()));
											} catch (e) {
												s.e(e);
											} finally {
												s.f();
											}
										}
									} catch (e) {
										n.e(e);
									} finally {
										n.f();
									}
									return e.next = 9, this.getWidgetVersions();
								case 9:
									if (!e.sent.includes(o.UnstableApiVersion.MSC2762_UPDATE_STATE)) {
										e.next = 12;
										break;
									}
									return e.next = 12, this.transport.send(i.WidgetApiToWidgetAction.UpdateState, { state: t });
								case 12: return e.prev = 12, this.flushRoomStateTask = null, e.finish(12);
								case 15:
								case "end": return e.stop();
							}
						}, e, this, [[
							0,
							,
							12,
							15
						]]);
					}));
					function t() {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "pushStickyState",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						var n = this;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0: return console.debug("Pushing sticky state to widget for room", t), e.abrupt("return", this.driver.readStickyEvents(t).then(function(e) {
									return {
										roomId: t,
										stickyEvents: e.filter(function(e) {
											return n.canReceiveRoomEvent(e.type, typeof e.content?.msgtype == "string" ? e.content.msgtype : null);
										})
									};
								}).then(/*#__PURE__*/ function() {
									var e = j(/*#__PURE__*/ S().mark(function e(t) {
										var r, a, o;
										return S().wrap(function(e) {
											for (;;) switch (e.prev = e.next) {
												case 0: return r = t.roomId, a = t.stickyEvents, console.debug("Pushing", a.length, "sticky events to widget for room", r), o = a.map(function(e) {
													return n.transport.send(i.WidgetApiToWidgetAction.SendEvent, e);
												}), e.next = 5, Promise.all(o);
												case 5:
												case "end": return e.stop();
											}
										}, e);
									}));
									return function(t) {
										return e.apply(this, arguments);
									};
								}()));
								case 2:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			},
			{
				key: "pushRoomState",
				value: function(e) {
					var t = this, n = h(this.allowedEvents), r;
					try {
						var i = function() {
							var n = r.value;
							if (n.kind === s.EventKind.State && n.direction === s.EventDirection.Receive) {
								var i = t.driver.readRoomState(e, n.eventType, n.keyStr ?? void 0).then(function(r) {
									var i = h(r), a;
									try {
										for (i.s(); !(a = i.n()).done;) {
											var o = a.value, s = t.pushRoomStateResult.get(e);
											s === void 0 && (s = /* @__PURE__ */ new Map(), t.pushRoomStateResult.set(e, s));
											var c = s.get(n.eventType);
											c === void 0 && (c = /* @__PURE__ */ new Map(), s.set(n.eventType, c)), c.has(o.state_key) || c.set(o.state_key, o);
										}
									} catch (e) {
										i.e(e);
									} finally {
										i.f();
									}
								}, function(t) {
									return console.error(`Failed to read room state for ${e} (${n.eventType}, ${n.keyStr})`, t);
								}).then(function() {
									t.pushRoomStateTasks.delete(i);
								});
								t.pushRoomStateTasks.add(i), t.flushRoomStateTask ??= t.flushRoomState(), t.flushRoomStateTask.catch(function(e) {
									return console.error("Failed to push room state", e);
								});
							}
						};
						for (n.s(); !(r = n.n()).done;) i();
					} catch (e) {
						n.e(e);
					} finally {
						n.f();
					}
				}
			},
			{
				key: "feedStateUpdate",
				value: function() {
					var e = j(/*#__PURE__*/ S().mark(function e(t) {
						var n, r;
						return S().wrap(function(e) {
							for (;;) switch (e.prev = e.next) {
								case 0:
									if (t.state_key !== void 0) {
										e.next = 2;
										break;
									}
									throw Error("Not a state event");
								case 2:
									if (t.room_id !== this.viewedRoomId && !this.canUseRoomTimeline(t.room_id) || !this.canReceiveStateEvent(t.type, t.state_key)) {
										e.next = 21;
										break;
									}
									if (this.pushRoomStateTasks.size !== 0) {
										e.next = 11;
										break;
									}
									return e.next = 6, this.getWidgetVersions();
								case 6:
									if (!e.sent.includes(o.UnstableApiVersion.MSC2762_UPDATE_STATE)) {
										e.next = 9;
										break;
									}
									return e.next = 9, this.transport.send(i.WidgetApiToWidgetAction.UpdateState, { state: [t] });
								case 9:
									e.next = 21;
									break;
								case 11: n = this.pushRoomStateResult.get(t.room_id), n === void 0 && (n = /* @__PURE__ */ new Map(), this.pushRoomStateResult.set(t.room_id, n)), r = n.get(t.type), r === void 0 && (r = /* @__PURE__ */ new Map(), n.set(t.type, r)), r.has(t.type) || r.set(t.state_key, t);
								case 16: return e.next = 18, Promise.all(this.pushRoomStateTasks);
								case 18: if (this.pushRoomStateTasks.size > 0) {
									e.next = 16;
									break;
								}
								case 19: return e.next = 21, this.flushRoomStateTask;
								case 21:
								case "end": return e.stop();
							}
						}, e, this);
					}));
					function t(t) {
						return e.apply(this, arguments);
					}
					return t;
				}()
			}
		]), f;
	}(t.EventEmitter);
})), O = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.isErrorResponse = n;
	function t(e) {
		"@babel/helpers - typeof";
		return t = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
			return typeof e;
		} : function(e) {
			return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
		}, t(e);
	}
	function n(e) {
		var n = e.error;
		return t(n) === "object" && n !== null && "message" in n && typeof n.message == "string";
	}
})), k = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.WidgetKind = void 0, e.WidgetKind = /* @__PURE__ */ function(e) {
		return e.Room = "room", e.Account = "account", e.Modal = "modal", e;
	}({});
})), A = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.ModalButtonKind = void 0, e.ModalButtonKind = /* @__PURE__ */ function(e) {
		return e.Primary = "m.primary", e.Secondary = "m.secondary", e.Warning = "m.warning", e.Danger = "m.danger", e.Link = "m.link", e;
	}({});
})), j = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.isValidUrl = t;
	function t(e) {
		if (!e) return !1;
		try {
			var t = new URL(e);
			return t.protocol === "http" || t.protocol === "https";
		} catch (e) {
			if (e instanceof TypeError) return !1;
			throw e;
		}
	}
})), M = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.assertPresent = t;
	function t(e, t) {
		if (!e[t]) throw Error(`${String(t)} is required`);
	}
})), N = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.Widget = void 0;
	var t = L(), n = M();
	function r(e) {
		"@babel/helpers - typeof";
		return r = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
			return typeof e;
		} : function(e) {
			return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
		}, r(e);
	}
	function i(e, t) {
		if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
	}
	function a(e, t) {
		for (var n = 0; n < t.length; n++) {
			var r = t[n];
			r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, s(r.key), r);
		}
	}
	function o(e, t, n) {
		return t && a(e.prototype, t), n && a(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
	}
	function s(e) {
		var t = c(e, "string");
		return r(t) == "symbol" ? t : t + "";
	}
	function c(e, t) {
		if (r(e) != "object" || !e) return e;
		var n = e[Symbol.toPrimitive];
		if (n !== void 0) {
			var i = n.call(e, t || "default");
			if (r(i) != "object") return i;
			throw TypeError("@@toPrimitive must return a primitive value.");
		}
		return (t === "string" ? String : Number)(e);
	}
	e.Widget = /* @__PURE__ */ function() {
		function e(t) {
			if (i(this, e), this.definition = t, !this.definition) throw Error("Definition is required");
			(0, n.assertPresent)(t, "id"), (0, n.assertPresent)(t, "creatorUserId"), (0, n.assertPresent)(t, "type"), (0, n.assertPresent)(t, "url");
		}
		return o(e, [
			{
				key: "creatorUserId",
				get: function() {
					return this.definition.creatorUserId;
				}
			},
			{
				key: "type",
				get: function() {
					return this.definition.type;
				}
			},
			{
				key: "id",
				get: function() {
					return this.definition.id;
				}
			},
			{
				key: "name",
				get: function() {
					return this.definition.name || null;
				}
			},
			{
				key: "title",
				get: function() {
					return this.rawData.title || null;
				}
			},
			{
				key: "templateUrl",
				get: function() {
					return this.definition.url;
				}
			},
			{
				key: "origin",
				get: function() {
					return new URL(this.templateUrl).origin;
				}
			},
			{
				key: "waitForIframeLoad",
				get: function() {
					return this.definition.waitForIframeLoad !== !1 && (this.definition.waitForIframeLoad, !0);
				}
			},
			{
				key: "rawData",
				get: function() {
					return this.definition.data || {};
				}
			},
			{
				key: "getCompleteUrl",
				value: function(e) {
					return (0, t.runTemplate)(this.templateUrl, this.definition, e);
				}
			}
		]), e;
	}();
})), P = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.WidgetParser = void 0;
	var t = N(), n = j();
	function r(e) {
		"@babel/helpers - typeof";
		return r = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
			return typeof e;
		} : function(e) {
			return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
		}, r(e);
	}
	function i(e, t) {
		var n = typeof Symbol < "u" && e[Symbol.iterator] || e["@@iterator"];
		if (!n) {
			if (Array.isArray(e) || (n = a(e)) || t && e && typeof e.length == "number") {
				n && (e = n);
				var r = 0, i = function() {};
				return {
					s: i,
					n: function() {
						return r >= e.length ? { done: !0 } : {
							done: !1,
							value: e[r++]
						};
					},
					e: function(e) {
						throw e;
					},
					f: i
				};
			}
			throw TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
		}
		var o, s = !0, c = !1;
		return {
			s: function() {
				n = n.call(e);
			},
			n: function() {
				var e = n.next();
				return s = e.done, e;
			},
			e: function(e) {
				c = !0, o = e;
			},
			f: function() {
				try {
					s || n.return == null || n.return();
				} finally {
					if (c) throw o;
				}
			}
		};
	}
	function a(e, t) {
		if (e) {
			if (typeof e == "string") return o(e, t);
			var n = {}.toString.call(e).slice(8, -1);
			return n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set" ? Array.from(e) : n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n) ? o(e, t) : void 0;
		}
	}
	function o(e, t) {
		(t == null || t > e.length) && (t = e.length);
		for (var n = 0, r = Array(t); n < t; n++) r[n] = e[n];
		return r;
	}
	function s(e, t) {
		if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
	}
	function c(e, t) {
		for (var n = 0; n < t.length; n++) {
			var r = t[n];
			r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, u(r.key), r);
		}
	}
	function l(e, t, n) {
		return t && c(e.prototype, t), n && c(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
	}
	function u(e) {
		var t = d(e, "string");
		return r(t) == "symbol" ? t : t + "";
	}
	function d(e, t) {
		if (r(e) != "object" || !e) return e;
		var n = e[Symbol.toPrimitive];
		if (n !== void 0) {
			var i = n.call(e, t || "default");
			if (r(i) != "object") return i;
			throw TypeError("@@toPrimitive must return a primitive value.");
		}
		return (t === "string" ? String : Number)(e);
	}
	e.WidgetParser = /* @__PURE__ */ function() {
		function e() {
			s(this, e);
		}
		return l(e, null, [
			{
				key: "parseAccountData",
				value: function(t) {
					if (!t) return [];
					for (var n = [], r = 0, i = Object.keys(t); r < i.length; r++) {
						var a = i[r], o = t[a];
						if (o && (o.type === "m.widget" || o.type === "im.vector.modular.widgets") && o.sender && (o.state_key || o.id) === a) {
							var s = {
								content: o.content,
								sender: o.sender,
								type: "m.widget",
								state_key: a,
								event_id: "$example",
								room_id: "!example",
								origin_server_ts: 1
							}, c = e.parseRoomWidget(s);
							c && n.push(c);
						}
					}
					return n;
				}
			},
			{
				key: "parseWidgetsFromRoomState",
				value: function(t) {
					if (!t) return [];
					var n = [], r = i(t), a;
					try {
						for (r.s(); !(a = r.n()).done;) {
							var o = a.value, s = e.parseRoomWidget(o);
							s && n.push(s);
						}
					} catch (e) {
						r.e(e);
					} finally {
						r.f();
					}
					return n;
				}
			},
			{
				key: "parseRoomWidget",
				value: function(t) {
					if (!t || t.type !== "m.widget" && t.type !== "im.vector.modular.widgets") return null;
					var n = t.content || {}, r = {
						id: t.state_key,
						creatorUserId: n.creatorUserId || t.sender,
						name: n.name,
						type: n.type,
						url: n.url,
						waitForIframeLoad: n.waitForIframeLoad,
						data: n.data
					};
					return e.processEstimatedWidget(r);
				}
			},
			{
				key: "processEstimatedWidget",
				value: function(e) {
					return !e.id || !e.creatorUserId || !e.type || !(0, n.isValidUrl)(e.url) ? null : new t.Widget(e);
				}
			}
		]), e;
	}();
})), F = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.runTemplate = t, e.toString = n;
	function t(e, t, r) {
		for (var i = Object.assign({}, t.data, {
			matrix_room_id: r.widgetRoomId || "",
			matrix_user_id: r.currentUserId,
			matrix_display_name: r.userDisplayName || r.currentUserId,
			matrix_avatar_url: r.userHttpAvatarUrl || "",
			matrix_widget_id: t.id,
			"org.matrix.msc2873.client_id": r.clientId || "",
			"org.matrix.msc2873.client_theme": r.clientTheme || "",
			"org.matrix.msc2873.client_language": r.clientLanguage || "",
			"org.matrix.msc3819.matrix_device_id": r.deviceId || "",
			"org.matrix.msc4039.matrix_base_url": r.baseUrl || ""
		}), a = e, o = 0, s = Object.keys(i); o < s.length; o++) {
			var c = s[o], l = `\$${c}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), u = new RegExp(l, "g");
			a = a.replace(u, encodeURIComponent(n(i[c])));
		}
		return a;
	}
	function n(e) {
		return e == null ? `${e}` : String(e);
	}
})), I = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.WidgetDriver = void 0;
	var t = L();
	function n(e) {
		"@babel/helpers - typeof";
		return n = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
			return typeof e;
		} : function(e) {
			return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
		}, n(e);
	}
	function r(e, t) {
		if (!(e instanceof t)) throw TypeError("Cannot call a class as a function");
	}
	function i(e, t) {
		for (var n = 0; n < t.length; n++) {
			var r = t[n];
			r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, o(r.key), r);
		}
	}
	function a(e, t, n) {
		return t && i(e.prototype, t), n && i(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
	}
	function o(e) {
		var t = s(e, "string");
		return n(t) == "symbol" ? t : t + "";
	}
	function s(e, t) {
		if (n(e) != "object" || !e) return e;
		var r = e[Symbol.toPrimitive];
		if (r !== void 0) {
			var i = r.call(e, t || "default");
			if (n(i) != "object") return i;
			throw TypeError("@@toPrimitive must return a primitive value.");
		}
		return (t === "string" ? String : Number)(e);
	}
	e.WidgetDriver = /* @__PURE__ */ function() {
		function e() {
			r(this, e);
		}
		return a(e, [
			{
				key: "validateCapabilities",
				value: function(e) {
					return Promise.resolve(/* @__PURE__ */ new Set());
				}
			},
			{
				key: "sendEvent",
				value: function(e, t) {
					return arguments.length > 2 && arguments[2] !== void 0 && arguments[2], arguments.length > 3 && arguments[3] !== void 0 && arguments[3], Promise.reject(/* @__PURE__ */ Error("Failed to override function"));
				}
			},
			{
				key: "sendStickyEvent",
				value: function(e, t, n) {
					throw arguments.length > 3 && arguments[3] !== void 0 && arguments[3], Error("Method not implemented.");
				}
			},
			{
				key: "sendDelayedEvent",
				value: function(e, t, n) {
					return arguments.length > 3 && arguments[3] !== void 0 && arguments[3], arguments.length > 4 && arguments[4] !== void 0 && arguments[4], Promise.reject(/* @__PURE__ */ Error("Failed to override function"));
				}
			},
			{
				key: "sendDelayedStickyEvent",
				value: function(e, t, n, r) {
					throw arguments.length > 4 && arguments[4] !== void 0 && arguments[4], Error("Method not implemented.");
				}
			},
			{
				key: "cancelScheduledDelayedEvent",
				value: function(e) {
					return Promise.reject(/* @__PURE__ */ Error("Failed to override function"));
				}
			},
			{
				key: "restartScheduledDelayedEvent",
				value: function(e) {
					return Promise.reject(/* @__PURE__ */ Error("Failed to override function"));
				}
			},
			{
				key: "sendScheduledDelayedEvent",
				value: function(e) {
					return Promise.reject(/* @__PURE__ */ Error("Failed to override function"));
				}
			},
			{
				key: "sendToDevice",
				value: function(e, t, n) {
					return Promise.reject(/* @__PURE__ */ Error("Failed to override function"));
				}
			},
			{
				key: "readRoomAccountData",
				value: function(e) {
					return arguments.length > 1 && arguments[1] !== void 0 && arguments[1], Promise.resolve([]);
				}
			},
			{
				key: "readRoomEvents",
				value: function(e, t, n) {
					return arguments.length > 3 && arguments[3] !== void 0 && arguments[3], arguments.length > 4 && arguments[4], Promise.resolve([]);
				}
			},
			{
				key: "readStateEvents",
				value: function(e, t, n) {
					return arguments.length > 3 && arguments[3] !== void 0 && arguments[3], Promise.resolve([]);
				}
			},
			{
				key: "readStickyEvents",
				value: function(e) {
					throw Error("readStickyEvents is not implemented");
				}
			},
			{
				key: "readRoomTimeline",
				value: function(e, t, n, r, i, a) {
					return r === void 0 ? this.readRoomEvents(t, n, i, [e], a) : this.readStateEvents(t, r, i, [e]);
				}
			},
			{
				key: "readRoomState",
				value: function(e, t, n) {
					return this.readStateEvents(t, n, 2 ** 53 - 1, [e]);
				}
			},
			{
				key: "readEventRelations",
				value: function(e, t, n, r, i, a, o, s) {
					return Promise.resolve({ chunk: [] });
				}
			},
			{
				key: "askOpenID",
				value: function(e) {
					e.update({ state: t.OpenIDRequestState.Blocked });
				}
			},
			{
				key: "navigate",
				value: function(e) {
					throw Error("Navigation is not implemented");
				}
			},
			{
				key: "getTurnServers",
				value: function() {
					throw Error("TURN server support is not implemented");
				}
			},
			{
				key: "searchUserDirectory",
				value: function(e, t) {
					return Promise.resolve({
						limited: !1,
						results: []
					});
				}
			},
			{
				key: "getMediaConfig",
				value: function() {
					throw Error("Get media config is not implemented");
				}
			},
			{
				key: "getRtcTransports",
				value: function() {
					throw Error("Get RTC transports is not implemented");
				}
			},
			{
				key: "uploadFile",
				value: function(e) {
					throw Error("Upload file is not implemented");
				}
			},
			{
				key: "downloadFile",
				value: function(e) {
					throw Error("Download file is not implemented");
				}
			},
			{
				key: "getRtcLivekitToken",
				value: function(e) {
					throw Error("Getting a LiveKit token is not implemented");
				}
			},
			{
				key: "delegateRtcLivekitDelayedLeave",
				value: function(e) {
					throw Error("Delegating a LiveKit delayed leave is not implemented");
				}
			},
			{
				key: "getKnownRooms",
				value: function() {
					throw Error("Querying known rooms is not implemented");
				}
			},
			{
				key: "processError",
				value: function(e) {}
			}
		]), e;
	}();
})), L = /* @__PURE__ */ e(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 });
	var t = E();
	Object.keys(t).forEach(function(n) {
		n !== "default" && n !== "__esModule" && (n in e && e[n] === t[n] || Object.defineProperty(e, n, {
			enumerable: !0,
			get: function() {
				return t[n];
			}
		}));
	});
	var n = D();
	Object.keys(n).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === n[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return n[t];
			}
		}));
	});
	var r = le();
	Object.keys(r).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === r[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return r[t];
			}
		}));
	});
	var i = ie();
	Object.keys(i).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === i[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return i[t];
			}
		}));
	});
	var a = se();
	Object.keys(a).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === a[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return a[t];
			}
		}));
	});
	var o = O();
	Object.keys(o).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === o[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return o[t];
			}
		}));
	});
	var s = ae();
	Object.keys(s).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === s[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return s[t];
			}
		}));
	});
	var c = ne();
	Object.keys(c).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === c[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return c[t];
			}
		}));
	});
	var l = re();
	Object.keys(l).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === l[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return l[t];
			}
		}));
	});
	var u = te();
	Object.keys(u).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === u[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return u[t];
			}
		}));
	});
	var d = oe();
	Object.keys(d).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === d[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return d[t];
			}
		}));
	});
	var f = k();
	Object.keys(f).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === f[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return f[t];
			}
		}));
	});
	var p = A();
	Object.keys(p).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === p[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return p[t];
			}
		}));
	});
	var m = T();
	Object.keys(m).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === m[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return m[t];
			}
		}));
	});
	var h = ue();
	Object.keys(h).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === h[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return h[t];
			}
		}));
	});
	var g = ce();
	Object.keys(g).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === g[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return g[t];
			}
		}));
	});
	var _ = j();
	Object.keys(_).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === _[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return _[t];
			}
		}));
	});
	var v = M();
	Object.keys(v).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === v[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return v[t];
			}
		}));
	});
	var y = N();
	Object.keys(y).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === y[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return y[t];
			}
		}));
	});
	var b = P();
	Object.keys(b).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === b[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return b[t];
			}
		}));
	});
	var x = F();
	Object.keys(x).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === x[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return x[t];
			}
		}));
	});
	var S = de();
	Object.keys(S).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === S[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return S[t];
			}
		}));
	});
	var C = I();
	Object.keys(C).forEach(function(t) {
		t !== "default" && t !== "__esModule" && (t in e && e[t] === C[t] || Object.defineProperty(e, t, {
			enumerable: !0,
			get: function() {
				return C[t];
			}
		}));
	});
})), R = L(), z = class extends R.WidgetDriver {
	client;
	roomId;
	approve;
	constructor(e, t, n) {
		super(), this.client = e, this.roomId = t, this.approve = n;
	}
	validateCapabilities(e) {
		return this.approve(e);
	}
	async sendEvent(e, t, n = null, r = null) {
		let i = r || this.roomId, a;
		return a = n === null ? e === "m.room.redaction" ? await this.client.redactEvent(i, t.redacts) : await this.client.sendEvent(i, e, t) : await this.client.sendStateEvent(i, e, t, n), {
			roomId: i,
			eventId: a.event_id
		};
	}
	async sendToDevice(e, t, n) {
		if (!t) {
			await this.client.queueToDevice({
				eventType: e,
				batch: Object.entries(n).flatMap(([e, t]) => Object.entries(t).map(([t, n]) => ({
					userId: e,
					deviceId: t,
					payload: n
				})))
			});
			return;
		}
		let r = this.client.getCrypto();
		if (!r) throw Error("E2EE not enabled");
		let i = /* @__PURE__ */ new Map();
		for (let [e, t] of Object.entries(n)) for (let [n, a] of Object.entries(t)) {
			let t = JSON.stringify(a), o = i.get(t) ?? [];
			i.set(t, o);
			let s = n === "*" ? [...(await r.getUserDeviceInfo([e], !0)).get(e)?.keys() ?? []] : [n];
			for (let t of s) o.push({
				userId: e,
				deviceId: t
			});
		}
		await Promise.all([...i].map(async ([t, n]) => this.client.queueToDevice(await r.encryptToDeviceMessages(e, n, JSON.parse(t)))));
	}
	async readRoomTimeline(e, t, n, r, i, a) {
		i = i > 0 ? i : 2 ** 53 - 1;
		let o = this.client.getRoom(e);
		if (!o) return [];
		let s = [], c = o.getLiveTimeline().getEvents();
		for (let e = c.length - 1; e >= 0 && s.length < i; e--) {
			let i = c[e];
			if (i.getId() === a) break;
			i.getType() === t && (t === "m.room.message" && n && n !== i.getContent().msgtype || (r === void 0 || i.getStateKey() === r) && s.push(B(i)));
		}
		return s;
	}
	async readRoomState(e, t, n) {
		let r = this.client.getRoom(e)?.getLiveTimeline().getState("f");
		if (!r) return [];
		if (n === void 0) return r.getStateEvents(t).map(B);
		let i = r.getStateEvents(t, n);
		return i ? [B(i)] : [];
	}
	async readEventRelations(e, t, n, r, i, a, o, s) {
		let { events: c, nextBatch: l, prevBatch: u } = await this.client.relations(t ?? this.roomId, e, n ?? null, r ?? null, {
			from: i,
			to: a,
			limit: o,
			dir: s
		});
		return {
			chunk: c.map(B),
			nextBatch: l ?? void 0,
			prevBatch: u ?? void 0
		};
	}
	askOpenID(e) {
		e.update({ state: R.OpenIDRequestState.Blocked });
	}
	async searchUserDirectory(e, t) {
		let { limited: n, results: r } = await this.client.searchUserDirectory({
			term: e,
			limit: t
		});
		return {
			limited: n,
			results: r.map((e) => ({
				userId: e.user_id,
				displayName: e.display_name,
				avatarUrl: e.avatar_url
			}))
		};
	}
	async getMediaConfig() {
		return await this.client.getMediaConfig();
	}
	async uploadFile(e) {
		let { content_uri: t } = await this.client.uploadContent(e);
		return { contentUri: t };
	}
	async downloadFile(e) {
		let t = this.client.mxcUrlToHttp(e, void 0, void 0, void 0, !1, !0, !0);
		if (!t) throw Error(`Not a media URI: ${e}`);
		let n = this.client.getAccessToken(), r = await fetch(t, n ? { headers: { Authorization: `Bearer ${n}` } } : void 0);
		if (!r.ok) throw Error(`Download failed: HTTP ${r.status}`);
		return { file: await r.blob() };
	}
	getKnownRooms() {
		return this.client.getRooms().map((e) => e.roomId);
	}
	processError(e) {
		let t = e;
		return typeof t?.asWidgetApiErrorData == "function" ? { matrix_api_error: t.asWidgetApiErrorData() } : void 0;
	}
};
function B(e) {
	return e.getEffectiveEvent();
}
// src/host.ts
var V = "[user-account-widgets]", H = "allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-presentation allow-downloads", U = "clipboard-write; fullscreen; autoplay; encrypted-media";
function W(e, t = window.location.origin) {
	try {
		return new URL(e).origin === t;
	} catch {
		return !0;
	}
}
function G(e, t) {
	return new R.Widget({
		...e,
		creatorUserId: e.creatorUserId || t.getUserId() || "unknown"
	});
}
function K(e, t, n, r) {
	let i = n.getUserId() ?? "", a = G(e, n).getCompleteUrl({
		widgetRoomId: t,
		currentUserId: i,
		userDisplayName: r?.getMember(i)?.name,
		clientId: "io.element.web",
		clientTheme: v(),
		clientLanguage: document.documentElement.lang || navigator.language,
		deviceId: n.getDeviceId() ?? void 0,
		baseUrl: n.baseUrl
	}), o = new URL(a);
	return o.searchParams.set("widgetId", e.id), o.searchParams.set("parentUrl", window.location.href.split("#", 2)[0]), o.toString().replace(/%24/g, "$");
}
var q = class {
	widget;
	roomId;
	client;
	iframe;
	api;
	pendingDecryption = /* @__PURE__ */ new WeakSet();
	stopTheme;
	stopped = !1;
	constructor(e, t, n, r, i) {
		this.widget = e, this.roomId = t, this.client = r, this.iframe = document.createElement("iframe"), this.iframe.className = "uaw-frame", this.iframe.title = e.name, this.iframe.setAttribute("sandbox", H), this.iframe.setAttribute("allow", U), this.iframe.referrerPolicy = "no-referrer", n.appendChild(this.iframe);
		let a = new z(r, t, (t) => i(e, t));
		this.api = new R.ClientWidgetApi(G(e, r), this.iframe, a), this.api.setViewedRoomId(t), this.api.once("ready", () => void this.api.updateTheme({ name: v() })), this.stopTheme = y((e) => void this.api.updateTheme({ name: e }).catch(J)), r.on("Room.timeline", this.onTimeline), r.on("Event.decrypted", this.onDecrypted), r.on("RoomState.events", this.onState), r.on("receivedToDeviceMessage", this.onToDevice), this.iframe.src = K(e, t, r, r.getRoom(t));
	}
	get widgetId() {
		return this.widget.id;
	}
	stop() {
		this.stopped || (this.stopped = !0, this.client.off("Room.timeline", this.onTimeline), this.client.off("Event.decrypted", this.onDecrypted), this.client.off("RoomState.events", this.onState), this.client.off("receivedToDeviceMessage", this.onToDevice), this.stopTheme(), this.api.stop(), this.api.removeAllListeners(), this.iframe.src = "about:blank", this.iframe.remove());
	}
	onTimeline = (e, t, n, r, i) => {
		n || r || !i?.liveEvent || t?.roomId !== this.roomId || (this.client.decryptEventIfNeeded?.(e), this.feed(e));
	};
	onDecrypted = (e) => {
		this.pendingDecryption.delete(e) && this.feed(e);
	};
	feed(e) {
		e.isBeingDecrypted() || e.isDecryptionFailure() ? this.pendingDecryption.add(e) : this.api.feedEvent(e.getEffectiveEvent()).catch((e) => console.warn(`${V} feeding an event failed`, e));
	}
	onState = (e) => {
		e.getRoomId() === this.roomId && this.api.feedStateUpdate(e.getEffectiveEvent()).catch((e) => console.warn(`${V} feeding state failed`, e));
	};
	onToDevice = ({ message: e, encryptionInfo: t }) => {
		this.api.feedToDevice(e, t != null).catch(J);
	};
};
function J() {}
// src/panel.ts
var Y = "de.datanauten.user_account_widgets.width", fe = "de.datanauten.user_account_widgets.selected", pe = 420, me = 280, he = class {
	deps;
	root;
	select;
	body;
	widgets = [];
	roomId = null;
	isOpen = !1;
	selectedId = ve(fe);
	host;
	listeners = /* @__PURE__ */ new Set();
	constructor(e) {
		this.deps = e;
		let { t } = e;
		this.root = X("aside", "uaw-panel"), this.root.setAttribute("aria-label", t("panel_label")), this.root.hidden = !0, this.root.style.width = `${ge(Number(ve(Y)) || pe)}px`;
		let n = X("div", "uaw-resize");
		n.setAttribute("role", "separator"), n.setAttribute("aria-orientation", "vertical"), n.addEventListener("pointerdown", this.onResizeStart);
		let r = X("div", "uaw-header");
		this.select = X("select", "uaw-select"), this.select.setAttribute("aria-label", t("select_label")), this.select.addEventListener("change", () => this.show(this.select.value));
		let i = _e("uaw-icon-button", t("manage"), be);
		i.addEventListener("click", () => e.manage());
		let a = _e("uaw-icon-button", t("close"), xe);
		a.addEventListener("click", () => this.close()), r.append(this.select, i, a), this.body = X("div", "uaw-body"), this.root.append(n, r, this.body), window.addEventListener("resize", this.place);
	}
	mount() {
		if (this.root.isConnected) return;
		let e = X("div");
		e.id = "uaw-container", e.style.isolation = "isolate", e.appendChild(this.root);
		let t = document.getElementById("mx_PersistedElement_container") ?? document.getElementById("mx_Dialog_StaticContainer");
		document.body.insertBefore(e, t);
	}
	get open() {
		return this.isOpen;
	}
	get selected() {
		return this.widgets.find((e) => e.id === this.selectedId) ?? this.widgets[0];
	}
	subscribe(e) {
		return this.listeners.add(e), () => this.listeners.delete(e);
	}
	toggle() {
		this.isOpen ? this.close() : this.show();
	}
	show(e) {
		e && (this.selectedId = e, ye(fe, e)), this.isOpen = !0, this.render();
	}
	close() {
		this.isOpen = !1, this.render();
	}
	setWidgets(e) {
		this.widgets = e, this.render();
	}
	setRoom(e) {
		e !== this.roomId && (this.roomId = e, this.render());
	}
	dispose() {
		this.stopHost(), window.removeEventListener("resize", this.place), (this.root.parentElement ?? this.root).remove();
	}
	render() {
		let e = this.isOpen && this.roomId !== null;
		this.root.hidden = !e, this.renderSelect(), e ? (this.place(), this.renderBody()) : this.stopHost();
		for (let e of this.listeners) e();
	}
	renderSelect() {
		let e = this.selected;
		this.select.replaceChildren(...this.widgets.map((t) => {
			let n = X("option");
			return n.value = t.id, n.textContent = t.name, n.selected = t.id === e?.id, n;
		})), this.select.hidden = this.widgets.length === 0;
	}
	renderBody() {
		let e = this.selected, t = this.deps.client();
		if (!e || !t || !this.roomId) {
			this.stopHost(), this.message(this.deps.t("empty"), this.deps.t("add_app"), () => this.deps.manage());
			return;
		}
		let n = `${e.id}\n${e.url}\n${this.roomId}`;
		this.host?.key !== n && (this.stopHost(), W(e.url) ? (this.message(this.deps.t("same_origin", { url: e.url })), this.host = { key: n }) : (this.body.replaceChildren(), this.host = {
			key: n,
			host: new q(e, this.roomId, this.body, t, this.deps.approve)
		}));
	}
	message(e, t, n) {
		let r = X("div", "uaw-message"), i = X("p");
		if (i.textContent = e, r.append(i), t && n) {
			let e = X("button", "uaw-button uaw-button--primary");
			e.type = "button", e.textContent = t, e.addEventListener("click", n), r.append(e);
		}
		this.body.replaceChildren(r);
	}
	stopHost() {
		this.host?.host?.stop(), this.host = void 0;
	}
	place = () => {
		let e = document.querySelector(".mx_RoomHeader"), t = e ? Math.max(0, Math.round(e.getBoundingClientRect().bottom)) : 0;
		this.root.style.top = `${t}px`, this.root.style.width = `${ge(parseFloat(this.root.style.width) || pe)}px`;
	};
	onResizeStart = (e) => {
		e.preventDefault();
		let t = e.clientX, n = this.root.getBoundingClientRect().width;
		this.root.classList.add("uaw-panel--resizing");
		let r = (e) => {
			this.root.style.width = `${ge(n + t - e.clientX)}px`;
		}, i = () => {
			window.removeEventListener("pointermove", r), window.removeEventListener("pointerup", i), this.root.classList.remove("uaw-panel--resizing"), ye(Y, String(Math.round(this.root.getBoundingClientRect().width)));
		};
		window.addEventListener("pointermove", r), window.addEventListener("pointerup", i);
	};
};
function ge(e) {
	let t = Math.max(me, window.innerWidth - 240);
	return Math.min(t, Math.max(me, Math.round(e)));
}
function X(e, t) {
	let n = document.createElement(e);
	return t && (n.className = t), n;
}
function _e(e, t, n) {
	let r = X("button", e);
	return r.type = "button", r.setAttribute("aria-label", t), r.title = t, r.innerHTML = n, r;
}
function ve(e) {
	try {
		return localStorage.getItem(e);
	} catch {
		return null;
	}
}
function ye(e, t) {
	try {
		localStorage.setItem(e, t);
	} catch {}
}
var be = "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" aria-hidden=\"true\" fill=\"currentColor\"><path d=\"M12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm0-2a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z\"/><path d=\"M10.3 2h3.4l.5 2.6c.6.2 1.1.5 1.6.9l2.5-.9 1.7 3-2 1.7a6.6 6.6 0 0 1 0 1.8l2 1.7-1.7 3-2.5-.9c-.5.4-1 .7-1.6.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.1-.5-1.6-.9l-2.5.9-1.7-3 2-1.7a6.6 6.6 0 0 1 0-1.8l-2-1.7 1.7-3 2.5.9c.5-.4 1-.7 1.6-.9l.5-2.6Zm1.6 2-.4 2.2-.6.2c-.8.2-1.4.6-2 1.1l-.5.4-2.1-.7-.5.8 1.7 1.4-.1.7a4.6 4.6 0 0 0 0 1.4l.1.7-1.7 1.4.5.8 2.1-.7.5.4c.6.5 1.2.9 2 1.1l.6.2.4 2.2h.2l.4-2.2.6-.2c.8-.2 1.4-.6 2-1.1l.5-.4 2.1.7.5-.8-1.7-1.4.1-.7a4.6 4.6 0 0 0 0-1.4l-.1-.7 1.7-1.4-.5-.8-2.1.7-.5-.4c-.6-.5-1.2-.9-2-1.1l-.6-.2-.4-2.2h-.2Z\"/></svg>", xe = "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" aria-hidden=\"true\" fill=\"currentColor\"><path d=\"M6.3 6.3a1 1 0 0 1 1.4 0L12 10.6l4.3-4.3a1 1 0 1 1 1.4 1.4L13.4 12l4.3 4.3a1 1 0 0 1-1.4 1.4L12 13.4l-4.3 4.3a1 1 0 0 1-1.4-1.4l4.3-4.3-4.3-4.3a1 1 0 0 1 0-1.4Z\"/></svg>", Se = /* @__PURE__ */ e(((e) => {
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
})), Z = (/* @__PURE__ */ e(((e, t) => {
	t.exports = Se();
})))();
function Ce({ t: e, url: t, capabilities: n, onSubmit: r, onCancel: i }) {
	let [a, c] = window.React.useState(() => new Set(n)), [l, u] = window.React.useState(!0), d = (e) => c((t) => {
		let n = new Set(t);
		return n.delete(e) || n.add(e), n;
	});
	return /* @__PURE__ */ (0, Z.jsxs)("div", {
		className: "uaw-dialog",
		children: [
			/* @__PURE__ */ (0, Z.jsx)("p", {
				className: "uaw-dialog__url",
				children: t
			}),
			/* @__PURE__ */ (0, Z.jsx)("p", { children: e("consent_intro") }),
			/* @__PURE__ */ (0, Z.jsx)("ul", {
				className: "uaw-caps",
				children: n.map((t) => {
					let n = s(t);
					return /* @__PURE__ */ (0, Z.jsx)("li", { children: /* @__PURE__ */ (0, Z.jsxs)("label", {
						className: "uaw-cap",
						children: [/* @__PURE__ */ (0, Z.jsx)("input", {
							type: "checkbox",
							checked: a.has(t),
							onChange: () => d(t)
						}), /* @__PURE__ */ (0, Z.jsxs)("span", { children: [
							e(n.key, n.vars),
							o(t) && /* @__PURE__ */ (0, Z.jsxs)("strong", {
								className: "uaw-cap__broad",
								children: [" · ", e("consent_broad")]
							}),
							/* @__PURE__ */ (0, Z.jsx)("code", {
								className: "uaw-cap__raw",
								children: t
							})
						] })]
					}) }, t);
				})
			}),
			/* @__PURE__ */ (0, Z.jsxs)("label", {
				className: "uaw-cap",
				children: [/* @__PURE__ */ (0, Z.jsx)("input", {
					type: "checkbox",
					checked: l,
					onChange: (e) => u(e.target.checked)
				}), /* @__PURE__ */ (0, Z.jsx)("span", { children: e("consent_remember") })]
			}),
			/* @__PURE__ */ (0, Z.jsxs)("div", {
				className: "uaw-dialog__buttons",
				children: [/* @__PURE__ */ (0, Z.jsx)("button", {
					type: "button",
					className: "uaw-button",
					onClick: i,
					children: e("deny")
				}), /* @__PURE__ */ (0, Z.jsx)("button", {
					type: "button",
					className: "uaw-button uaw-button--primary",
					onClick: () => r({
						approved: n.filter((e) => a.has(e)),
						remember: l
					}),
					children: e("allow")
				})]
			})
		]
	});
}
// src/ui/ManageDialog.tsx
function we({ t: e, widgets: t, subscribe: n, suggested: r, add: i, remove: a, open: o, onSubmit: s }) {
	let [c, l] = window.React.useState(t), [u, d] = window.React.useState(""), [f, p] = window.React.useState(""), [m, h] = window.React.useState(null), [g, _] = window.React.useState(!1);
	window.React.useEffect(() => n(() => l(t())), [n, t]);
	let v = async (t) => {
		_(!0), h(null);
		try {
			await t();
		} catch (t) {
			h(e("failed", { error: t instanceof Error ? t.message : String(t) }));
		} finally {
			_(!1);
		}
	}, y = (e, t) => v(async () => {
		o(await i(e.trim() || new URL(t).hostname, t.trim())), s();
	}), b = (t) => {
		if (t.preventDefault(), !S(f.trim())) return h(e("url_invalid"));
		if (W(f.trim())) return h(e("url_same_origin"));
		y(u, f);
	}, x = new Set(c.map((e) => e.url)), C = r.filter((e) => !x.has(e.url));
	return /* @__PURE__ */ (0, Z.jsxs)("div", {
		className: "uaw-dialog",
		children: [
			/* @__PURE__ */ (0, Z.jsx)("p", {
				className: "uaw-dialog__intro",
				children: e("manage_intro")
			}),
			c.length === 0 ? /* @__PURE__ */ (0, Z.jsx)("p", {
				className: "uaw-dialog__none",
				children: e("manage_none")
			}) : /* @__PURE__ */ (0, Z.jsx)("ul", {
				className: "uaw-list",
				children: c.map((t) => /* @__PURE__ */ (0, Z.jsxs)("li", {
					className: "uaw-list__item",
					children: [
						/* @__PURE__ */ (0, Z.jsxs)("span", {
							className: "uaw-list__text",
							children: [/* @__PURE__ */ (0, Z.jsx)("span", {
								className: "uaw-list__name",
								children: t.name
							}), /* @__PURE__ */ (0, Z.jsx)("span", {
								className: "uaw-list__url",
								children: t.url
							})]
						}),
						/* @__PURE__ */ (0, Z.jsx)("button", {
							type: "button",
							className: "uaw-button",
							disabled: g,
							onClick: () => {
								o(t.id), s();
							},
							children: e("open")
						}),
						/* @__PURE__ */ (0, Z.jsx)("button", {
							type: "button",
							className: "uaw-button uaw-button--danger",
							disabled: g,
							"aria-label": e("remove_label", { name: t.name }),
							onClick: () => void v(() => a(t.id)),
							children: e("remove")
						})
					]
				}, t.id))
			}),
			C.length > 0 && /* @__PURE__ */ (0, Z.jsxs)(Z.Fragment, { children: [/* @__PURE__ */ (0, Z.jsx)("h3", {
				className: "uaw-dialog__heading",
				children: e("suggested")
			}), /* @__PURE__ */ (0, Z.jsx)("ul", {
				className: "uaw-list",
				children: C.map((t) => /* @__PURE__ */ (0, Z.jsxs)("li", {
					className: "uaw-list__item",
					children: [/* @__PURE__ */ (0, Z.jsxs)("span", {
						className: "uaw-list__text",
						children: [/* @__PURE__ */ (0, Z.jsx)("span", {
							className: "uaw-list__name",
							children: t.name
						}), /* @__PURE__ */ (0, Z.jsx)("span", {
							className: "uaw-list__url",
							children: t.url
						})]
					}), /* @__PURE__ */ (0, Z.jsx)("button", {
						type: "button",
						className: "uaw-button uaw-button--primary",
						disabled: g,
						onClick: () => void y(t.name, t.url),
						children: e("add")
					})]
				}, t.url))
			})] }),
			/* @__PURE__ */ (0, Z.jsxs)("form", {
				className: "uaw-form",
				onSubmit: b,
				children: [
					/* @__PURE__ */ (0, Z.jsx)("h3", {
						className: "uaw-dialog__heading",
						children: e("add_title")
					}),
					/* @__PURE__ */ (0, Z.jsxs)("label", {
						className: "uaw-field",
						children: [/* @__PURE__ */ (0, Z.jsx)("span", { children: e("name") }), /* @__PURE__ */ (0, Z.jsx)("input", {
							type: "text",
							value: u,
							disabled: g,
							onChange: (e) => d(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, Z.jsxs)("label", {
						className: "uaw-field",
						children: [/* @__PURE__ */ (0, Z.jsx)("span", { children: e("url") }), /* @__PURE__ */ (0, Z.jsx)("input", {
							type: "url",
							value: f,
							required: !0,
							disabled: g,
							placeholder: e("url_placeholder"),
							onChange: (e) => p(e.target.value)
						})]
					}),
					m && /* @__PURE__ */ (0, Z.jsx)("p", {
						className: "uaw-error",
						role: "alert",
						children: m
					}),
					/* @__PURE__ */ (0, Z.jsxs)("div", {
						className: "uaw-dialog__buttons",
						children: [/* @__PURE__ */ (0, Z.jsx)("button", {
							type: "button",
							className: "uaw-button",
							onClick: () => s(),
							children: e("done")
						}), /* @__PURE__ */ (0, Z.jsx)("button", {
							type: "submit",
							className: "uaw-button uaw-button--primary",
							disabled: g || !f.trim(),
							children: e("add")
						})]
					})
				]
			})
		]
	});
}
// src/ui/MyAppsButton.tsx
function Te({ t: e, isOpen: t, subscribe: n, onClick: r }) {
	let [, i] = window.React.useState(0);
	window.React.useEffect(() => n(() => i((e) => e + 1)), [n]);
	let a = t(), o = e(a ? "button_close" : "button_open");
	return /* @__PURE__ */ (0, Z.jsx)("button", {
		type: "button",
		className: "uaw-header-button",
		"data-testid": "user-account-widgets-button",
		"aria-label": e("button"),
		"aria-description": o,
		title: o,
		"aria-pressed": a,
		onClick: r,
		children: /* @__PURE__ */ (0, Z.jsxs)("svg", {
			viewBox: "0 0 24 24",
			width: "24",
			height: "24",
			"aria-hidden": "true",
			fill: "currentColor",
			children: [/* @__PURE__ */ (0, Z.jsx)("path", { d: "M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Zm2 0v14h7V5H6Zm9 0v14h3V5h-3Z" }), /* @__PURE__ */ (0, Z.jsx)("path", { d: "M7.5 8h4v1.5h-4zM7.5 11h4v1.5h-4zM7.5 14h2.5v1.5H7.5z" })]
		})
	});
}
// src/ui/styles.css?inline
var Ee = ".uaw-header-button{box-sizing:border-box;cursor:pointer;width:32px;height:32px;color:var(--cpd-color-icon-secondary,#656d77);background:0 0;border:0;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:4px;display:inline-flex}.uaw-header-button svg{display:block}.uaw-header-button:hover{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);color:var(--cpd-color-icon-primary,#1b1d22)}.uaw-header-button:focus-visible,.uaw-icon-button:focus-visible,.uaw-button:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}.uaw-header-button[aria-pressed=true]{color:var(--cpd-color-icon-accent-primary,#1b1d22);background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}.uaw-panel{z-index:100;box-sizing:border-box;background:var(--cpd-color-bg-canvas-default,#fff);max-width:calc(100vw - 240px);color:var(--cpd-color-text-primary,#1b1d22);border-left:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);font:var(--cpd-font-body-md-regular,400 15px/22px Inter, sans-serif);flex-direction:column;display:flex;position:fixed;bottom:0;right:0;box-shadow:-4px 0 16px #00000014}.uaw-panel[hidden]{display:none}.uaw-resize{cursor:ew-resize;width:6px;position:absolute;top:0;bottom:0;left:-3px}.uaw-panel--resizing .uaw-frame{pointer-events:none}.uaw-header{border-bottom:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);align-items:center;gap:4px;padding:8px 8px 8px 12px;display:flex}.uaw-select{border:1px solid var(--cpd-color-border-interactive-secondary,#c0c6cd);background:var(--cpd-color-bg-canvas-default,#fff);min-width:0;color:inherit;font:inherit;border-radius:8px;flex:1;padding:4px 8px}.uaw-select[hidden]{visibility:hidden;display:block}.uaw-icon-button{width:32px;height:32px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:0;border-radius:50%;justify-content:center;align-items:center;display:inline-flex}.uaw-icon-button:hover{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);color:var(--cpd-color-icon-primary,#1b1d22)}.uaw-body{flex:1;min-height:0;position:relative}.uaw-frame{border:0;width:100%;height:100%;display:block}.uaw-message{color:var(--cpd-color-text-secondary,#656d77);padding:24px 16px}.uaw-message p{margin:0 0 16px}.uaw-dialog p{margin:0 0 12px}.uaw-dialog__intro,.uaw-dialog__none,.uaw-list__url,.uaw-dialog__url,.uaw-cap__raw{color:var(--cpd-color-text-secondary,#656d77)}.uaw-dialog__url{word-break:break-all}.uaw-dialog__heading{font:var(--cpd-font-body-md-semibold,600 15px/22px Inter, sans-serif);margin:16px 0 8px}.uaw-list,.uaw-caps{margin:0 0 12px;padding:0;list-style:none}.uaw-list__item{border-bottom:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);align-items:center;gap:8px;padding:8px 0;display:flex}.uaw-list__text{flex-direction:column;flex:1;min-width:0;display:flex}.uaw-list__name{font-weight:600}.uaw-list__url{text-overflow:ellipsis;white-space:nowrap;font-size:13px;overflow:hidden}.uaw-cap{align-items:flex-start;gap:8px;padding:4px 0;display:flex}.uaw-cap__raw{word-break:break-all;font:12px/18px ui-monospace,SFMono-Regular,Menlo,monospace;display:block}.uaw-cap__broad{color:var(--cpd-color-text-critical-primary,#d51928);font-weight:600}.uaw-form{flex-direction:column;gap:8px;display:flex}.uaw-field{flex-direction:column;gap:4px;display:flex}.uaw-field input{border:1px solid var(--cpd-color-border-interactive-primary,#9199a4);background:var(--cpd-color-bg-canvas-default,#fff);color:var(--cpd-color-text-primary,#1b1d22);font:inherit;border-radius:8px;margin:0;padding:8px 12px}.uaw-error{color:var(--cpd-color-text-critical-primary,#d51928)}.uaw-dialog__buttons{justify-content:flex-end;gap:8px;margin-top:8px;display:flex}.uaw-button{border:1px solid var(--cpd-color-border-interactive-secondary,#c0c6cd);color:var(--cpd-color-text-primary,#1b1d22);font:var(--cpd-font-body-md-semibold,600 15px/22px Inter, sans-serif);cursor:pointer;white-space:nowrap;background:0 0;border-radius:999px;padding:4px 16px}.uaw-button--primary{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);border-color:#0000}.uaw-button--danger{color:var(--cpd-color-text-critical-primary,#d51928)}.uaw-button:disabled{opacity:.5;cursor:default}", Q = "m.widgets", De = "m.stickerpicker", Oe = "m.custom";
function ke(e) {
	if (!e || typeof e != "object") return [];
	let t = [];
	for (let [n, r] of Object.entries(e)) {
		let e = r?.content;
		if (!e || typeof e.url != "string" || !S(e.url)) continue;
		let i = typeof e.type == "string" ? e.type : Oe;
		i !== De && t.push({
			id: n,
			name: typeof e.name == "string" && e.name.trim() ? e.name : new URL(e.url).hostname,
			url: e.url,
			type: i,
			creatorUserId: typeof e.creatorUserId == "string" ? e.creatorUserId : String(r.sender ?? ""),
			data: e.data && typeof e.data == "object" ? e.data : {}
		});
	}
	return t.sort((e, t) => e.name.localeCompare(t.name));
}
function Ae(e, t, n, r, i = Me()) {
	let a = { ...Ne(e) };
	return a[i] = {
		type: "m.widget",
		state_key: i,
		sender: t,
		id: i,
		content: {
			id: i,
			type: Oe,
			url: r,
			name: n,
			data: {},
			creatorUserId: t
		}
	}, a;
}
function je(e, t) {
	let n = { ...Ne(e) };
	return delete n[t], n;
}
function Me() {
	let e = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(8));
	return `de.datanauten.uaw_${Array.from(e, (e) => e.toString(16).padStart(2, "0")).join("")}`;
}
function Ne(e) {
	return e && typeof e == "object" ? e : {};
}
// src/index.tsx
var $ = "[user-account-widgets]", Pe = "de-datanauten-user-account-widgets-style", Fe = class {
	api;
	static moduleApiVersion = "^2.0.0";
	config;
	panel;
	widgets;
	approvals;
	stopRoomWatch;
	consentQueue = Promise.resolve();
	constructor(e) {
		this.api = e;
	}
	async load() {
		this.api.i18n.register(w), this.config = x(this.api.config.get(b)), typeof this.api.extras?.addRoomHeaderButtonCallback == "function" ? (Le(), this.panel = new he({
			t: this.t,
			client: p,
			approve: this.approve,
			manage: this.openManageDialog
		}), this.api.extras.addRoomHeaderButtonCallback(() => {
			if (this.start()) return /* @__PURE__ */ (0, Z.jsx)(Te, {
				t: this.t,
				isOpen: () => this.panel.open,
				subscribe: this.subscribe,
				onClick: this.onButton
			}, "user-account-widgets");
		})) : console.warn(`${$} this Element has no room header buttons; the module stays off`);
	}
	dispose() {
		this.stopRoomWatch?.(), this.widgets?.unwatch(this.onWidgets), this.panel?.dispose();
	}
	start() {
		if (this.widgets) return !0;
		if (!p()) return !1;
		try {
			this.widgets = this.api.client.accountData.get(Q), this.approvals = this.api.client.accountData.get(c);
		} catch (e) {
			return console.warn(`${$} account data is not available yet`, e), !1;
		}
		return this.widgets.watch(this.onWidgets), this.approvals.watch(Re), this.panel.mount(), this.onWidgets(), this.stopRoomWatch = _(() => this.panel.setRoom(h())), this.panel.setRoom(h()), !0;
	}
	onWidgets = () => this.panel.setWidgets(this.list());
	list() {
		return ke(this.current(Q, this.widgets));
	}
	current(e, t) {
		return p()?.getAccountData?.(e)?.getContent() ?? t?.value;
	}
	subscribe = (e) => {
		let t = this.panel.subscribe(e);
		return this.widgets?.watch(e), () => {
			t(), this.widgets?.unwatch(e);
		};
	};
	onButton = () => {
		this.list().length === 0 && !this.panel.open ? this.openManageDialog() : this.panel.toggle();
	};
	openManageDialog = () => {
		this.api.openDialog({ title: this.t("manage_title") }, we, {
			t: this.t,
			widgets: () => this.list(),
			subscribe: this.subscribe,
			suggested: this.config.suggested,
			add: this.add,
			remove: this.remove,
			open: (e) => this.panel.show(e)
		});
	};
	add = async (e, t) => {
		let n = p()?.getUserId();
		if (!n || !this.widgets) throw Error("not logged in");
		let r = Me();
		return await this.api.client.accountData.set(Q, Ae(this.current(Q, this.widgets), n, e, t, r)), await Ie(this.widgets, () => this.list().some((e) => e.id === r)), r;
	};
	remove = async (e) => {
		if (!this.widgets) return;
		await this.api.client.accountData.set(Q, je(this.current(Q, this.widgets), e));
		let t = this.current(c, this.approvals);
		l(t)[e] && await this.api.client.accountData.set(c, f(t, e));
	};
	approve = (e, t) => {
		let n = this.consentQueue.then(() => this.decide(e, t));
		return this.consentQueue = n.catch(Re), n;
	};
	async decide(e, t) {
		let { auto: n, ask: r, unsupported: i } = a(t);
		i.length && console.info(`${$} ${e.name}: not offered here`, i);
		let o = l(this.current(c, this.approvals))[e.id], s = u(r, e.url, o, this.config.approvePrefixes), f = /* @__PURE__ */ new Set([...n, ...r.filter((e) => !s.includes(e))]);
		if (s.length === 0) return f;
		let { finished: p } = this.api.openDialog({ title: this.t("consent_title", { name: e.name }) }, Ce, {
			t: this.t,
			url: e.url,
			capabilities: s
		}), { ok: m, model: h } = await p;
		if (!m || !h) return f;
		for (let e of h.approved) f.add(e);
		return h.remember && h.approved.length && await this.api.client.accountData.set(c, d(this.current(c, this.approvals), e.id, e.url, h.approved)).catch((e) => console.warn(`${$} remembering the approval failed`, e)), f;
	}
	t = (e, t) => this.api.i18n.translate(C + e, t);
};
function Ie(e, t, n = 1e4) {
	return t(e.value) ? Promise.resolve() : new Promise((r) => {
		let i = () => {
			clearTimeout(o), e.unwatch(a), r();
		}, a = (e) => {
			t(e) && i();
		}, o = setTimeout(i, n);
		e.watch(a);
	});
}
function Le() {
	if (document.getElementById(Pe)) return;
	let e = document.createElement("style");
	e.id = Pe, e.textContent = Ee, document.head.appendChild(e);
}
function Re() {}
export { Fe as UserAccountWidgetsModule, Fe as default };

//# sourceMappingURL=index.js.map