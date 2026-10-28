// src/react.ts
var e = globalThis.React;
e?.createElement, e?.Fragment;
var t = e?.useState, n = e?.useEffect;
e?.useRef, e?.useCallback, e?.useId, e?.useMemo;
// src/config.ts
var r = "de.minagawa.marcade_element_module", i = "https://marcade.store/apps/de.minagawa.marcade-store/0.1.1/", a = "#/?theme=$org.matrix.msc2873.client_theme&lang=$org.matrix.msc2873.client_language&client=$org.matrix.msc2873.client_id&roomId=$matrix_room_id&userId=$matrix_user_id";
function o(e) {
	if (typeof e != "string" || !e.trim()) return;
	let t;
	try {
		t = new URL(e.trim());
	} catch {
		return;
	}
	if (t.protocol !== "https:" && t.protocol !== "http:" || t.username || t.password) return;
	let n = t.pathname.endsWith("/") ? t.pathname : `${t.pathname}/`;
	return t.origin + n;
}
function s(e) {
	let t = new URL(e);
	return (t.origin + t.pathname.replace(/[^/]*$/, "")).replace(/[^/]*\/$/, (e) => /^(v?\d+(\.\d+)*([-+][^/]*)?|latest)\/$/.test(e) ? "" : e);
}
function c(e, t) {
	if (typeof e != "string") return !1;
	let n;
	try {
		n = new URL(e);
	} catch {
		return !1;
	}
	return n.protocol !== "https:" && n.protocol !== "http:" ? !1 : (n.origin + n.pathname).startsWith(t) || n.origin + n.pathname + "/" === t;
}
var l = (e, t) => t.some((t) => c(e, t));
function u(e) {
	let t = e && typeof e == "object" && !Array.isArray(e) ? e : {}, n = o(t.store_url), r = i;
	if (n && typeof t.store_url == "string") {
		let e = new URL(t.store_url.trim());
		!e.pathname.endsWith("/") && !/\.[a-z][a-z0-9]*$/i.test(e.pathname) && (e.pathname += "/"), r = e.toString();
	} else t.store_url !== void 0 && console.warn("[marcade-element-module] store_url is not an http(s) URL, using the default");
	let l = r.includes("#") ? r : r + a, u = o(t.store_prefix) ?? s(r);
	c(l, u) || (console.warn("[marcade-element-module] store_prefix does not cover store_url, using the store_url folder"), u = s(r));
	let d = Array.isArray(t.approve_prefixes) ? [...new Set(t.approve_prefixes.map(o).filter((e) => !!e))] : [u];
	return {
		storeUrl: r,
		widgetUrl: l,
		storePrefix: u,
		approvePrefixes: d,
		approveIdentity: t.approve_identity === !0,
		hideIntegrations: t.hide_integrations === !0,
		showInDms: t.show_in_dms !== !1,
		openIn: t.open_in === "top" ? "top" : "right"
	};
}
// src/host.ts
var d = () => globalThis;
function f(e = d()) {
	try {
		let t = e.mxMatrixClientPeg?.get?.();
		return t && typeof t.getRoom == "function" && typeof t.sendStateEvent == "function" ? t : void 0;
	} catch {
		return;
	}
}
function p(e, t, n) {
	if (e) try {
		let r = e.getUserId(), i = e.getRoom(t);
		return !r || !i?.currentState?.maySendStateEvent ? void 0 : i.getMyMembership && i.getMyMembership() !== "join" ? !1 : i.currentState.maySendStateEvent(n, r);
	} catch {
		return;
	}
}
function m(e, t) {
	return !t || typeof t != "object" ? !1 : Object.values(t).some((t) => Array.isArray(t) && t.includes(e));
}
function h(e = d()) {
	try {
		let t = e.mxSdkContext?.rightPanelStore;
		return t && typeof t.setCard == "function" ? t : void 0;
	} catch {
		return;
	}
}
function g(e, t, n) {
	try {
		if (!e.isOpenForRoom?.(t)) return !1;
		let r = e.currentCardForRoom?.(t);
		return r?.phase === "Widget" && r.state?.widgetId === n;
	} catch {
		return !1;
	}
}
// src/store.ts
var _ = "im.vector.modular.widgets", v = [
	"org.matrix.msc2762.receive.state_event:im.vector.modular.widgets",
	"org.matrix.msc2762.receive.state_event:m.widget",
	"org.matrix.msc2762.receive.state_event:io.element.widgets.layout",
	"org.matrix.msc2762.send.state_event:im.vector.modular.widgets",
	"org.matrix.msc2762.send.state_event:io.element.widgets.layout",
	"org.matrix.msc4039.upload_file"
];
function y(e, t) {
	return e.find((e) => c(e.url, t.storePrefix));
}
function b(e, t = /* @__PURE__ */ new Set()) {
	let n = `marcade_store_${e}`;
	for (let r = 2; t.has(n); r++) n = `marcade_store_${e}_${r}`;
	return n;
}
function x(e) {
	return {
		type: "m.custom",
		url: e.url,
		name: e.name ?? "Marcade Store",
		data: {},
		id: e.id,
		creatorUserId: e.userId
	};
}
var S = (e) => `/addwidget ${e.widgetUrl}`;
function C(e, t, n) {
	let r = y(e, n);
	return r ? {
		kind: "open",
		widget: r
	} : t === void 0 ? n.hideIntegrations ? { kind: "show_command" } : { kind: "composer" } : t ? { kind: "add" } : { kind: "ask_moderator" };
}
// src/actions.ts
var w = (e, t) => {
	try {
		return e.widgets.getWidgetsInRoom(t) ?? [];
	} catch {
		return [];
	}
};
function T(e, t, n, r = !0) {
	let i = e.widgets;
	if (i.isAppInContainer(t, "center", n) || i.isAppInContainer(t, "top", n)) return "already_visible";
	let a = e.cfg.openIn === "right" ? e.rightPanel() : void 0;
	if (a) try {
		return r && a.hide && g(a, n, t.id) ? (a.hide(n), "closed") : (i.moveAppToContainer(t, "right", n), a.setCard({
			phase: "Widget",
			state: { widgetId: t.id }
		}, !0, n), a.isOpenForRoom && a.show && !a.isOpenForRoom(n) && a.show(n), "opened_right");
	} catch (e) {
		console.warn("[marcade-element-module] right panel failed, pinning instead", e);
	}
	return i.moveAppToContainer(t, "top", n), "opened_top";
}
async function E(e, t) {
	let n = e.client(), r = C(w(e, t), p(n, t, _), e.cfg);
	switch (r.kind) {
		case "open": return T(e, r.widget, t);
		case "ask_moderator": return e.askModerator(S(e.cfg)), "asked_moderator";
		case "show_command": return e.askModerator(S(e.cfg), "manual"), "showed_command";
		case "composer": return e.insertIntoComposer ? (e.insertIntoComposer(S(e.cfg)), e.notify("composer_hint"), "composer") : (e.askModerator(S(e.cfg), "manual"), "showed_command");
		case "add": return D(e, n, t);
	}
}
async function D(e, t, n) {
	let r = e.now ?? Date.now, i = e.sleep ?? ((e) => new Promise((t) => setTimeout(t, e))), a = b(r(), new Set(w(e, n).map((e) => e.id))), o = x({
		url: e.cfg.widgetUrl,
		userId: t.getUserId() ?? "",
		id: a
	});
	e.notify("adding");
	try {
		await t.sendStateEvent(n, _, o, a);
	} catch (t) {
		return e.notify("add_failed", { error: t?.message ?? String(t) }), "add_failed";
	}
	let s = r() + (e.waitMs ?? 15e3);
	for (;;) {
		let t = w(e, n), o = t.find((e) => e.id === a) ?? y(t, e.cfg);
		if (o) return T(e, o, n, !1) === "opened_top" ? "added_opened_top" : "added_opened_right";
		if (r() >= s) break;
		await i(250);
	}
	return e.notify("add_timeout"), "add_timeout";
}
// src/trust.ts
var O = "[marcade-element-module]", k = (e, t) => l(e.templateUrl, t.approvePrefixes);
function A(e, t, n) {
	if (!k(e, n)) return;
	let r = new Set([...t].filter((e) => v.includes(e)));
	return r.size ? r : void 0;
}
function j(e, t) {
	let n = e.widgetLifecycle;
	if (!n || !t.approvePrefixes.length) return;
	let r = (e, t) => {
		try {
			t();
		} catch (t) {
			console.warn(`${O} ${e} approver not registered:`, t.message);
		}
	};
	r("preload", () => n.registerPreloadApprover((e) => k(e, t) || void 0)), t.approveIdentity && r("identity", () => n.registerIdentityApprover((e) => k(e, t) || void 0)), r("capabilities", () => n.registerCapabilitiesApprover((e, n) => A(e, n, t)));
}
// src/i18n.ts
var M = "de.minagawa.marcade_module.", N = [
	"de",
	"de_DE",
	"de-DE"
], P = [
	"en",
	"en_EN",
	"en_US",
	"en-US",
	"en_GB",
	"en-GB"
], F = {
	button_label: {
		de: "Apps",
		en: "Apps"
	},
	button_tooltip: {
		de: "Marcade Store öffnen",
		en: "Open Marcade Store"
	},
	button_tooltip_close: {
		de: "Marcade Store schließen",
		en: "Close Marcade Store"
	},
	button_tooltip_moderator: {
		de: "Marcade Store öffnen (nur Moderatoren können Apps hinzufügen)",
		en: "Open Marcade Store (only moderators can add apps)"
	},
	adding: {
		de: "Marcade Store wird hinzugefügt …",
		en: "Adding the Marcade Store …"
	},
	add_failed: {
		de: "Der Marcade Store konnte nicht hinzugefügt werden: %(error)s",
		en: "Could not add the Marcade Store: %(error)s"
	},
	add_timeout: {
		de: "Der Marcade Store wurde hinzugefügt, ist aber noch nicht angekommen. Bitte gleich noch einmal klicken.",
		en: "The Marcade Store was added but has not arrived yet. Please click again in a moment."
	},
	composer_hint: {
		de: "Der Befehl zum Hinzufügen steht im Eingabefeld – mit Enter absenden.",
		en: "The command that adds the store is in the composer – press Enter to send it."
	},
	moderator_title: {
		de: "Apps hinzufügen",
		en: "Add apps"
	},
	moderator_body: {
		de: "In diesem Raum können nur Moderatoren Apps hinzufügen. Ein Moderator kann selbst auf „Apps“ oben im Raum klicken oder diese Zeile im Raum senden:",
		en: "Only moderators can add apps to this room. A moderator can click “Apps” at the top of the room or send this line in the room:"
	},
	manual_body: {
		de: "Dieses Element kann den Marcade Store nicht selbst hinzufügen. Diese Zeile, in einem Matrix-Client mit /addwidget im Raum gesendet, fügt ihn hinzu:",
		en: "This Element cannot add the Marcade Store by itself. Sent in the room from a Matrix client with /addwidget, this line adds it:"
	},
	copy: {
		de: "Kopieren",
		en: "Copy"
	},
	copied: {
		de: "Kopiert",
		en: "Copied"
	},
	close: {
		de: "Schließen",
		en: "Close"
	}
}, I;
function L(e) {
	I = e;
	let t = {};
	for (let [e, n] of Object.entries(F)) {
		let r = {};
		for (let e of N) r[e] = n.de;
		for (let e of P) r[e] = n.en;
		t[M + e] = r;
	}
	try {
		e.i18n.register(t);
	} catch (e) {
		console.warn("[marcade-element-module] i18n.register failed, using built-in tables", e);
	}
}
function R(e, t) {
	if (I) try {
		let n = I.i18n.translate(M + e, t);
		if (typeof n == "string" && n !== M + e && !n.includes(M)) return n;
	} catch {}
	let n = "en";
	try {
		n = I?.i18n.language ?? "en";
	} catch {}
	let r = n.toLowerCase().startsWith("de") ? F[e].de : F[e].en;
	for (let [e, n] of Object.entries(t ?? {})) r = r.replaceAll(`%(${e})s`, String(n));
	return r;
}
// src/styles.ts
var z = "\n.mcm-apps{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;flex:none;\n  width:32px;height:32px;padding:4px;border:0;border-radius:50%;background:transparent;cursor:pointer;\n  color:var(--cpd-color-icon-secondary,#656d77)}\n.mcm-apps svg{width:24px;height:24px;display:block}\n.mcm-apps:hover{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);color:var(--cpd-color-icon-primary,#1b1d22)}\n.mcm-apps:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}\n.mcm-apps[aria-pressed=\"true\"]{color:var(--cpd-color-icon-accent-primary,var(--cpd-color-icon-primary,#1b1d22));\n  background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}\n.mcm-apps[aria-disabled=\"true\"]{color:var(--cpd-color-icon-disabled,#c0c6cd)}\n.mcm-apps[aria-disabled=\"true\"]:hover{background:transparent;color:var(--cpd-color-icon-secondary,#656d77)}\n.mcm-apps[aria-busy=\"true\"]{cursor:progress;opacity:.6}\n.mcm-dialog p{margin:0 0 12px}\n.mcm-dialog__cmd{display:block;margin:0 0 16px;padding:8px 12px;border-radius:8px;white-space:pre-wrap;word-break:break-all;\n  background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);color:var(--cpd-color-text-primary,#1b1d22);\n  font:var(--cpd-font-body-sm-regular,400 13px/20px ui-monospace,monospace);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;user-select:all}\n.mcm-dialog__buttons{display:flex;gap:8px;justify-content:flex-end}\n.mcm-button{border:1px solid var(--cpd-color-border-interactive-secondary,#c0c6cd);border-radius:999px;padding:6px 16px;background:none;\n  color:var(--cpd-color-text-primary,#1b1d22);font:var(--cpd-font-body-md-semibold,600 14px/20px system-ui);cursor:pointer}\n.mcm-button--primary{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);border-color:transparent}\n.mcm-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:5000;max-width:min(560px,calc(100vw - 32px));\n  padding:10px 16px;border-radius:8px;background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);\n  font:var(--cpd-font-body-md-regular,400 14px/20px system-ui);box-shadow:0 4px 24px rgba(0,0,0,.25)}\n";
function B(e = document) {
	if (e.getElementById("mcm-styles")) return;
	let t = e.createElement("style");
	t.id = "mcm-styles", t.textContent = z, e.head.appendChild(t);
}
var V;
function H(e, t = 5e3, n = document) {
	let r = n.getElementById("mcm-toast");
	r || (r = n.createElement("div"), r.id = "mcm-toast", r.className = "mcm-toast", r.setAttribute("role", "status"), n.body.appendChild(r)), r.textContent = e, r.hidden = !1, clearTimeout(V), V = setTimeout(() => r && (r.hidden = !0), t);
}
// src/components/AppsIcon.tsx
function U() {
	return /* @__PURE__ */ e.createElement("svg", {
		viewBox: "0 0 24 24",
		fill: "currentColor",
		"aria-hidden": "true",
		focusable: "false"
	}, /* @__PURE__ */ e.createElement("rect", {
		x: "3",
		y: "3",
		width: "7.5",
		height: "7.5",
		rx: "2"
	}), /* @__PURE__ */ e.createElement("rect", {
		x: "13.5",
		y: "3",
		width: "7.5",
		height: "7.5",
		rx: "2"
	}), /* @__PURE__ */ e.createElement("rect", {
		x: "3",
		y: "13.5",
		width: "7.5",
		height: "7.5",
		rx: "2"
	}), /* @__PURE__ */ e.createElement("path", { d: "M17.25 13.5a1 1 0 0 1 1 1v1.75H20a1 1 0 1 1 0 2h-1.75V20a1 1 0 1 1-2 0v-1.75H14.5a1 1 0 1 1 0-2h1.75V14.5a1 1 0 0 1 1-1Z" }));
}
// src/components/AppsButton.tsx
function W({ roomId: r, getMode: i, isOpen: a, subscribe: o, onActivate: s }) {
	let [, c] = t(0), [l, u] = t(!1);
	n(() => o(r, () => c((e) => e + 1)), [r, o]);
	let d = i(r), f = a(r), p = R(f ? "button_tooltip_close" : d === "moderator" ? "button_tooltip_moderator" : "button_tooltip");
	return /* @__PURE__ */ e.createElement("button", {
		type: "button",
		className: "mcm-apps",
		"data-testid": "marcade-apps-button",
		"aria-label": R("button_label"),
		"aria-description": p,
		title: p,
		"aria-disabled": d === "moderator" || void 0,
		"aria-pressed": f,
		"aria-busy": l || void 0,
		onClick: () => {
			l || (u(!0), s(r).finally(() => {
				u(!1), c((e) => e + 1);
			}));
		}
	}, /* @__PURE__ */ e.createElement(U, null));
}
// src/components/ModeratorDialog.tsx
function G({ command: n, reason: r, onCancel: i }) {
	let [a, o] = t(!1);
	return /* @__PURE__ */ e.createElement("div", { className: "mcm-dialog" }, /* @__PURE__ */ e.createElement("p", null, R(r === "manual" ? "manual_body" : "moderator_body")), /* @__PURE__ */ e.createElement("code", {
		className: "mcm-dialog__cmd",
		"data-testid": "marcade-addwidget-line"
	}, n), /* @__PURE__ */ e.createElement("div", { className: "mcm-dialog__buttons" }, /* @__PURE__ */ e.createElement("button", {
		type: "button",
		className: "mcm-button",
		onClick: () => navigator.clipboard?.writeText(n).then(() => o(!0), () => o(!1))
	}, R(a ? "copied" : "copy")), /* @__PURE__ */ e.createElement("button", {
		type: "button",
		className: "mcm-button mcm-button--primary",
		onClick: () => i()
	}, R("close"))));
}
// src/index.tsx
var K = "[marcade-element-module]";
function q(e, t, n) {
	try {
		return t();
	} catch (t) {
		return console.warn(`${K} ${e} failed:`, t), n;
	}
}
var J = class {
	api;
	static moduleApiVersion = "^1.14.0 || ^2.0.0";
	cfg;
	constructor(e) {
		this.api = e;
	}
	async load() {
		let e = globalThis;
		if (e.__marcadeElementModule) return console.warn(`${K} already loaded, skipping duplicate`);
		e.__marcadeElementModule = !0, this.cfg = u(q("config", () => this.api.config.get()[r], void 0)), L(this.api), q("styles", () => B(), void 0), q("trust", () => j(this.api, this.cfg), void 0), this.cfg.hideIntegrations && q("registerShouldShowComponent", () => this.api.customisations.registerShouldShowComponent((e) => e !== "UIComponent.addIntegrations" && void 0), void 0);
		let t = this.api.extras, n = this.api.widget;
		typeof t?.addRoomHeaderButtonCallback != "function" || typeof n?.getWidgetsInRoom != "function" ? console.warn(`${K} this Element has no room header button or widget API; the Apps button is not shown`) : (q("addRoomHeaderButtonCallback", () => t.addRoomHeaderButtonCallback((e) => this.renderButton(e)), void 0), console.info(`${K} loaded`, {
			store: this.cfg.widgetUrl,
			prefix: this.cfg.storePrefix,
			approve: this.cfg.approvePrefixes,
			client: !!f(),
			rightPanel: !!h()
		}));
	}
	deps = () => ({
		cfg: this.cfg,
		widgets: this.api.widget,
		client: () => f(),
		rightPanel: () => h(),
		insertIntoComposer: typeof this.api.composer?.insertPlaintextIntoComposer == "function" ? (e) => this.api.composer.insertPlaintextIntoComposer(e, { view: "room" }) : void 0,
		askModerator: (e, t = "moderator") => this.api.openDialog({ title: R("moderator_title") }, G, {
			command: e,
			reason: t
		}),
		notify: (e, t) => H(R(e, t), e === "adding" ? 3e3 : 8e3)
	});
	isDm(e) {
		let t = q("m.direct", () => f()?.getAccountData?.("m.direct")?.getContent(), void 0);
		return t ? m(e, t) : q("m.direct (module api)", () => m(e, this.api.client?.accountData?.get("m.direct").value), !1);
	}
	storeWidget(e) {
		return q("getWidgetsInRoom", () => y(this.api.widget.getWidgetsInRoom(e) ?? [], this.cfg), void 0);
	}
	getMode = (e) => this.storeWidget(e) ? "can" : p(f(), e, "im.vector.modular.widgets") === !1 ? "moderator" : "can";
	isOpen = (e) => {
		let t = this.storeWidget(e), n = h();
		return !!t && !!n && g(n, e, t.id);
	};
	subscribe = (e, t) => {
		let n = [], r = f();
		if (r?.on && r.off) {
			let i = (n) => {
				let r = n;
				r?.getRoomId && r.getRoomId() !== e || t();
			};
			q("subscribe RoomState.events", () => r.on("RoomState.events", i), void 0), n.push(() => q("unsubscribe", () => r.off("RoomState.events", i), void 0));
		}
		let i = h();
		return i?.on && i.off && (q("subscribe right panel", () => i.on("update", t), void 0), n.push(() => q("unsubscribe", () => i.off("update", t), void 0))), () => n.forEach((e) => e());
	};
	onActivate = (e) => E(this.deps(), e).catch((e) => {
		console.error(`${K} click failed`, e), H(R("add_failed", { error: e?.message ?? String(e) }), 8e3);
	});
	renderButton(t) {
		return q("render header button", () => {
			if (this.cfg.showInDms || !this.isDm(t)) return /* @__PURE__ */ e.createElement(W, {
				key: "marcade-apps",
				roomId: t,
				getMode: this.getMode,
				isOpen: this.isOpen,
				subscribe: this.subscribe,
				onActivate: this.onActivate
			});
		}, void 0);
	}
};
export { J as default };

//# sourceMappingURL=index.js.map