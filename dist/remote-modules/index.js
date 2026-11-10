/*! @datanauten/element-web-module-remote-modules 0.5.0 */
// \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), t = "datanauten_remote_modules_", n = {
	[`${t}title`]: {
		en: "Modules",
		de: "Module"
	},
	[`${t}server_title`]: {
		en: "Provided by the server",
		de: "Vom Server bereitgestellt"
	},
	[`${t}server_description`]: {
		en: "Listed in this Element's config.json and loaded at startup. You can turn them off for your account; that takes effect when Element reloads, on each of your devices.",
		de: "In der config.json dieses Elements eingetragen und beim Start geladen. Du kannst sie für dein Konto ausschalten; das wirkt ab dem nächsten Neuladen, auf jedem deiner Geräte."
	},
	[`${t}how_to_use`]: {
		en: "How to use",
		de: "Bedienung"
	},
	[`${t}version_label`]: {
		en: "Version %(version)s",
		de: "Version %(version)s"
	},
	[`${t}read_more`]: {
		en: "Read more",
		de: "Mehr dazu"
	},
	[`${t}turn_off`]: {
		en: "Turn off",
		de: "Ausschalten"
	},
	[`${t}turn_off_label`]: {
		en: "Turn off %(name)s",
		de: "%(name)s ausschalten"
	},
	[`${t}turn_on`]: {
		en: "Turn on",
		de: "Einschalten"
	},
	[`${t}turn_on_label`]: {
		en: "Turn on %(name)s",
		de: "%(name)s einschalten"
	},
	[`${t}locked`]: {
		en: "Always on",
		de: "Immer an"
	},
	[`${t}locked_hint`]: {
		en: "Starts before this settings tab's own module (or is it), so it can't be turned off here.",
		de: "Startet vor dem Modul dieses Tabs (oder ist es selbst) und lässt sich deshalb hier nicht ausschalten."
	},
	[`${t}status_off`]: {
		en: "Turned off",
		de: "Ausgeschaltet"
	},
	[`${t}status_next_reload`]: {
		en: "Loads when Element reloads",
		de: "Lädt beim nächsten Neuladen"
	},
	[`${t}server_empty`]: {
		en: "None.",
		de: "Keine."
	},
	[`${t}dynamic_title`]: {
		en: "Loaded dynamically",
		de: "Dynamisch geladen"
	},
	[`${t}warning`]: {
		en: "Modules run inside Element with full access to your account, messages and keys. Only add code you wrote or trust.",
		de: "Module laufen in Element mit vollem Zugriff auf dein Konto, deine Nachrichten und Schlüssel. Füge nur Code hinzu, den du selbst geschrieben hast oder dem du vertraust."
	},
	[`${t}safe_mode`]: {
		en: "Safe mode (remote_modules=off in the URL): no remote modules were loaded.",
		de: "Abgesicherter Modus (remote_modules=off in der URL): Es wurden keine eigenen Module geladen."
	},
	[`${t}empty`]: {
		en: "No modules yet.",
		de: "Noch keine Module."
	},
	[`${t}source_label`]: {
		en: "Module URL or mxc:// URI",
		de: "Modul-URL oder mxc://-URI"
	},
	[`${t}add`]: {
		en: "Add",
		de: "Hinzufügen"
	},
	[`${t}upload`]: {
		en: "Upload .js…",
		de: ".js hochladen …"
	},
	[`${t}invalid_source`]: {
		en: "Use an mxc:// URI, an https:// URL or an http://localhost URL.",
		de: "Bitte eine mxc://-URI, eine https://-URL oder eine http://localhost-URL angeben."
	},
	[`${t}load`]: {
		en: "Load",
		de: "Laden"
	},
	[`${t}load_label`]: {
		en: "Load %(name)s",
		de: "%(name)s laden"
	},
	[`${t}unload`]: {
		en: "Unload",
		de: "Entladen"
	},
	[`${t}unload_label`]: {
		en: "Unload %(name)s",
		de: "%(name)s entladen"
	},
	[`${t}unload_hint`]: {
		en: "A running module can't be stopped: it stays active until Element reloads, and isn't loaded after that.",
		de: "Ein laufendes Modul lässt sich nicht anhalten: Es bleibt bis zum Neuladen aktiv und wird danach nicht mehr geladen."
	},
	[`${t}remove`]: {
		en: "Remove",
		de: "Entfernen"
	},
	[`${t}remove_label`]: {
		en: "Remove %(name)s",
		de: "%(name)s entfernen"
	},
	[`${t}retry`]: {
		en: "Retry",
		de: "Erneut versuchen"
	},
	[`${t}reload_element`]: {
		en: "Reload Element",
		de: "Element neu laden"
	},
	[`${t}reload_hint`]: {
		en: "A loaded module can't be swapped while Element runs; reloading Element fetches the latest build.",
		de: "Ein geladenes Modul lässt sich im laufenden Element nicht austauschen; Neuladen holt den neuesten Build."
	},
	[`${t}needs_reload`]: {
		en: "Changes take effect when Element reloads: turned-off or removed modules stay active until then.",
		de: "Änderungen wirken ab dem nächsten Neuladen: Ausgeschaltete oder entfernte Module bleiben bis dahin aktiv."
	},
	[`${t}status_pending`]: {
		en: "Waiting",
		de: "Wartet"
	},
	[`${t}status_loading`]: {
		en: "Loading…",
		de: "Lädt …"
	},
	[`${t}status_loaded`]: {
		en: "Loaded",
		de: "Geladen"
	},
	[`${t}status_loaded_version`]: {
		en: "Loaded (module API %(version)s)",
		de: "Geladen (Modul-API %(version)s)"
	},
	[`${t}status_failed`]: {
		en: "Failed: %(error)s",
		de: "Fehler: %(error)s"
	},
	[`${t}status_disabled`]: {
		en: "Not loaded",
		de: "Nicht geladen"
	},
	[`${t}status_reload`]: {
		en: "Still active until Element reloads",
		de: "Aktiv bis zum Neuladen"
	},
	[`${t}hint`]: {
		en: "A module is one ES module file (e.g. lib/index.js of a vite library build) whose default export is the module class. Uploads go to your homeserver's media repository. A localhost dev server must send CORS headers. Add ?remote_modules=off to Element's URL to start without remote modules.",
		de: "Ein Modul ist eine einzelne ES-Modul-Datei (z. B. lib/index.js eines vite-Library-Builds), deren Default-Export die Modulklasse ist. Uploads landen im Medien-Repository deines Homeservers. Ein localhost-Dev-Server muss CORS-Header senden. Mit ?remote_modules=off in der Element-URL startet Element ohne eigene Module."
	}
};
// src/loader.ts
function r() {
	let e = window.mxMatrixClientPeg;
	try {
		return e?.get?.() ?? void 0;
	} catch {
		return;
	}
}
var i = (e) => import(
	/* @vite-ignore */
	e
);
async function a(e, t) {
	let n = e, r = {};
	if (e.startsWith("mxc://")) {
		if (!t) throw Error("Not logged in");
		if (n = t.mxcUrlToHttp(e, void 0, void 0, void 0, !1, !0, !0) ?? "", !n) throw Error(`Can't resolve ${e}`);
		let i = t.getAccessToken();
		i && (r.Authorization = `Bearer ${i}`);
	}
	let i = await fetch(n, {
		headers: r,
		cache: "no-store"
	});
	if (!i.ok) throw Error(`${i.status} ${i.statusText || "error"} fetching ${e}`);
	return i.text();
}
async function o(e, t, n = i) {
	let r = URL.createObjectURL(new Blob([e], { type: "text/javascript" })), a;
	try {
		a = await n(r);
	} catch (e) {
		throw Error(e instanceof Error && /Content Security Policy|Failed to fetch dynamically imported module|error loading dynamically/i.test(e.message) ? `Element's Content Security Policy blocked it: the server must allow blob: scripts (see the remote-modules README). ${e.message}` : `Import failed: ${e instanceof Error ? e.message : String(e)}`);
	} finally {
		URL.revokeObjectURL(r);
	}
	let o = a.default;
	if (typeof o != "function" || typeof o.prototype?.load != "function") throw Error("Not an Element module: the default export must be a class with a load() method");
	return await new o(t).load(), { apiVersion: o.moduleApiVersion };
}
// src/settingsInjector.ts
var s = "DATANAUTEN_MODULES_TAB", c = "drm-tab-label", l = "drm-tab-panel", u = "data-drm-modules", d = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><path d=\"M17.25 11.6721C16.9959 11.6721 16.7749 11.5782 16.5871 11.3904L12.6096 7.41292C12.4218 7.22509 12.3279 7.00412 12.3279 6.75001C12.3279 6.49589 12.4218 6.27492 12.6096 6.08709L16.5871 2.10962C16.7749 1.92179 16.9959 1.82788 17.25 1.82788C17.5041 1.82788 17.7251 1.92179 17.9129 2.10962L21.8904 6.08709C22.0782 6.27492 22.1721 6.49589 22.1721 6.75001C22.1721 7.00412 22.0782 7.22509 21.8904 7.41292L17.9129 11.3904C17.7251 11.5782 17.5041 11.6721 17.25 11.6721ZM19.7249 6.75001L17.25 4.27513L14.7751 6.75001L17.25 9.22488L19.7249 6.75001Z\"/><path d=\"M4 11C3.71667 11 3.47917 10.9042 3.2875 10.7125C3.09583 10.5208 3 10.2833 3 10V4.00001C3 3.71667 3.09583 3.47917 3.2875 3.28751C3.47917 3.09584 3.71667 3.00001 4 3.00001H10C10.2833 3.00001 10.5208 3.09584 10.7125 3.28751C10.9042 3.47917 11 3.71667 11 4.00001V10C11 10.2833 10.9042 10.5208 10.7125 10.7125C10.5208 10.9042 10.2833 11 10 11H4ZM9 9.00001V5.00001H5V9.00001H9Z\"/><path d=\"M14 21C13.7167 21 13.4792 20.9042 13.2875 20.7125C13.0958 20.5208 13 20.2833 13 20V14C13 13.7167 13.0958 13.4792 13.2875 13.2875C13.4792 13.0958 13.7167 13 14 13H20C20.2833 13 20.5208 13.0958 20.7125 13.2875C20.9042 13.4792 21 13.7167 21 14V20C21 20.2833 20.9042 20.5208 20.7125 20.7125C20.5208 20.9042 20.2833 21 20 21H14ZM19 19V15H15V19H19Z\"/><path d=\"M4 21C3.71667 21 3.47917 20.9042 3.2875 20.7125C3.09583 20.5208 3 20.2833 3 20V14C3 13.7167 3.09583 13.4792 3.2875 13.2875C3.47917 13.0958 3.71667 13 4 13H10C10.2833 13 10.5208 13.0958 10.7125 13.2875C10.9042 13.4792 11 13.7167 11 14V20C11 20.2833 10.9042 20.5208 10.7125 20.7125C10.5208 20.9042 10.2833 21 10 21H4ZM9 19V15H5V19H9Z\"/></svg>", f = class {
	mount;
	label;
	observer;
	mounted;
	constructor(e, t) {
		this.mount = e, this.label = t;
	}
	start() {
		this.observer = new MutationObserver(() => this.check()), this.observer.observe(document.body, {
			childList: !0,
			subtree: !0
		}), this.check();
	}
	stop() {
		this.observer?.disconnect(), this.mounted && (this.setOpen(!1), this.mounted.unmount(), this.mounted.label.remove(), this.mounted.panel.remove()), this.mounted = void 0;
	}
	check() {
		if (this.mounted && !this.mounted.view.isConnected && (this.mounted.unmount(), this.mounted = void 0), this.mounted) {
			let { label: e } = this.mounted;
			e.nextElementSibling && e.parentElement?.appendChild(e);
			return;
		}
		let e = document.querySelector("[aria-controls^=\"mx_tabpanel_USER_\"]")?.closest(".mx_TabbedView_tabLabels"), t = e?.closest(".mx_TabbedView");
		if (!e || !t || e.querySelector(`.${c}`)) return;
		let n = `mx_tabpanel_${s}`, r = document.createElement("li");
		r.className = `mx_TabbedView_tabLabel ${c}`, r.setAttribute("role", "tab"), r.setAttribute("tabindex", "-1"), r.setAttribute("aria-selected", "false"), r.setAttribute("aria-controls", n), r.dataset.testid = `settings-tab-${s}`, r.innerHTML = d;
		let i = document.createElement("span");
		i.className = "mx_TabbedView_tabLabel_text", i.id = `${n}_label`, i.textContent = this.label(), r.appendChild(i), r.setAttribute("aria-labelledby", i.id), r.addEventListener("click", () => this.setOpen(!0)), r.addEventListener("keydown", (e) => {
			(e.key === "Enter" || e.key === " ") && (e.preventDefault(), this.setOpen(!0));
		}), e.addEventListener("click", (e) => {
			r.contains(e.target) || this.setOpen(!1);
		}), e.appendChild(r);
		let a = document.createElement("div");
		a.className = `mx_TabbedView_tabPanel ${l}`, a.id = n, a.setAttribute("role", "tabpanel"), a.setAttribute("aria-labelledby", i.id), a.innerHTML = "<div class=\"mx_AutoHideScrollbar mx_TabbedView_tabPanelContent\"><div class=\"mx_SettingsTab\"><div class=\"mx_SettingsTab_sections\"></div></div></div>", t.appendChild(a), this.mounted = {
			view: t,
			label: r,
			panel: a,
			unmount: this.mount(a.querySelector(".mx_SettingsTab_sections"))
		};
	}
	setOpen(e) {
		let t = this.mounted;
		if (!t) return;
		t.view.toggleAttribute(u, e), t.label.classList.toggle("mx_TabbedView_tabLabel_active", e), t.label.setAttribute("aria-selected", String(e));
		let n = t.view.closest(".mx_UserSettingsDialog")?.querySelector(".mx_UserSettingsDialog_title");
		n && (e ? (n.dataset.drmPrefix = n.querySelector(".mx_UserSettingsDialog_title_strong")?.textContent ?? "", n.dataset.drmTab = this.label()) : (delete n.dataset.drmPrefix, delete n.dataset.drmTab)), e && (t.label.focus(), t.panel.querySelector(".mx_TabbedView_tabPanelContent")?.scrollTo?.(0, 0));
	}
}, p = "de.datanauten.remote_modules", m = "de.datanauten.remote_modules.list", h = 1e3;
function g(e) {
	try {
		let t = new URL(e, window.location.href);
		return t.origin === window.location.origin ? t.pathname : `${t.origin}${t.pathname}`;
	} catch {
		return e.split(/[?#]/)[0];
	}
}
function _() {
	return v().disabled_server;
}
function v() {
	try {
		let e = JSON.parse(localStorage.getItem(m) ?? "null");
		return e?.user && e.user !== localStorage.getItem("mx_user_id") ? b(null) : b(e);
	} catch {
		return b(null);
	}
}
function y(e) {
	if (/^mxc:\/\/[^/]+\/[^/]+$/.test(e)) return !0;
	try {
		let t = new URL(e);
		return t.protocol === "https:" || t.protocol === "http:" && [
			"localhost",
			"127.0.0.1",
			"[::1]"
		].includes(t.hostname);
	} catch {
		return !1;
	}
}
function b(e) {
	let { modules: t, disabled_server: n } = e ?? {};
	return {
		modules: Array.isArray(t) ? t.filter((e) => typeof e?.id == "string" && typeof e.source == "string" && y(e.source)).map((e) => ({
			id: e.id,
			source: e.source,
			name: typeof e.name == "string" && e.name ? e.name : e.source,
			enabled: e.enabled !== !1
		})) : [],
		disabled_server: Array.isArray(n) ? n.filter((e) => typeof e == "string") : []
	};
}
var x = class {
	api;
	modules;
	disabledServer;
	listeners = /* @__PURE__ */ new Set();
	watchable;
	retryTimer;
	constructor(e) {
		this.api = e, {modules: this.modules, disabled_server: this.disabledServer} = v();
	}
	start() {
		return new Promise((e) => {
			if (this.tryAttach()) return e();
			this.retryTimer = setInterval(() => {
				this.tryAttach() && (clearInterval(this.retryTimer), e());
			}, h);
		});
	}
	stop() {
		clearInterval(this.retryTimer), this.watchable?.unwatch(this.onRemote);
	}
	getAll() {
		return this.modules;
	}
	getDisabledServer() {
		return this.disabledServer;
	}
	subscribe(e) {
		return this.listeners.add(e), () => this.listeners.delete(e);
	}
	async add(e, t) {
		let n = {
			id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
			source: e,
			name: t,
			enabled: !0
		};
		return await this.replace([...this.modules, n]), n;
	}
	async update(e, t) {
		await this.replace(this.modules.map((n) => n.id === e ? {
			...n,
			...t
		} : n));
	}
	async remove(e) {
		await this.replace(this.modules.filter((t) => t.id !== e));
	}
	async setServerEnabled(e, t) {
		let n = this.disabledServer.filter((t) => t !== e);
		await this.replace(this.modules, t ? n : [...n, e]);
	}
	async replace(e, t = this.disabledServer) {
		if (this.apply(e, t), !this.watchable) return;
		let n = {
			version: 1,
			modules: e,
			disabled_server: t
		};
		await this.api.client.accountData.set(p, n);
	}
	apply(e, t) {
		this.modules = e, this.disabledServer = t;
		try {
			let n = {
				version: 1,
				modules: e,
				disabled_server: t,
				user: localStorage.getItem("mx_user_id") ?? void 0
			};
			localStorage.setItem(m, JSON.stringify(n));
		} catch {}
		for (let e of this.listeners) e();
	}
	onRemote = (e) => {
		let { modules: t, disabled_server: n } = b(e);
		this.apply(t, n);
	};
	tryAttach() {
		if (this.watchable) return !0;
		try {
			this.watchable = this.api.client.accountData.get(p);
		} catch {
			return !1;
		}
		return this.watchable.watch(this.onRemote), this.watchable.value !== void 0 && this.onRemote(this.watchable.value), !0;
	}
}, S = /* @__PURE__ */ e(((e) => {
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
})), C = (/* @__PURE__ */ e(((e, t) => {
	t.exports = S();
})))();
function w({ controller: e, t: n }) {
	window.React.useSyncExternalStore(e.subscribe, e.getVersion);
	let r = e.getModules(), i = e.getServerModules(), [a, o] = window.React.useState(""), [s, c] = window.React.useState(null), [l, u] = window.React.useState(!1), d = window.React.useRef(null), f = e.needsReload(), p = async (e) => {
		c(null), u(!0);
		try {
			await e();
		} catch (e) {
			c(e instanceof Error ? e.message : String(e));
		} finally {
			u(!1);
		}
	};
	return /* @__PURE__ */ (0, C.jsxs)("div", {
		className: "drm-tab",
		"data-testid": "remote-modules-section",
		children: [/* @__PURE__ */ (0, C.jsxs)(T, {
			title: n(`${t}server_title`),
			description: n(`${t}server_description`),
			testId: "remote-modules-server",
			children: [i.length === 0 ? /* @__PURE__ */ (0, C.jsx)("p", {
				className: "drm-empty",
				children: n(`${t}server_empty`)
			}) : /* @__PURE__ */ (0, C.jsx)("ul", {
				className: "drm-list",
				"aria-label": n(`${t}server_title`),
				children: i.map((t) => /* @__PURE__ */ (0, C.jsx)(D, {
					module: t,
					controller: e,
					t: n,
					busy: l,
					run: p
				}, t.src))
			}), i.some((e) => e.enabled !== e.running) && /* @__PURE__ */ (0, C.jsx)(E, {
				controller: e,
				t: n
			})]
		}), e.canLoadDynamic() && /* @__PURE__ */ (0, C.jsxs)(T, {
			title: n("datanauten_remote_modules_dynamic_title"),
			description: n("datanauten_remote_modules_warning"),
			warning: !0,
			testId: "remote-modules-dynamic",
			children: [
				e.safeMode && /* @__PURE__ */ (0, C.jsx)("div", {
					className: "drm-notice",
					children: n("datanauten_remote_modules_safe_mode")
				}),
				r.length === 0 ? /* @__PURE__ */ (0, C.jsx)("p", {
					className: "drm-empty",
					children: n("datanauten_remote_modules_empty")
				}) : /* @__PURE__ */ (0, C.jsx)("ul", {
					className: "drm-list",
					"aria-label": n("datanauten_remote_modules_dynamic_title"),
					children: r.map((t) => /* @__PURE__ */ (0, C.jsx)(O, {
						entry: t,
						status: e.getStatus(t.id),
						controller: e,
						t: n,
						busy: l,
						run: p
					}, t.id))
				}),
				/* @__PURE__ */ (0, C.jsxs)("form", {
					className: "drm-add",
					onSubmit: (r) => {
						r.preventDefault();
						let i = a.trim();
						y(i) ? p(async () => {
							await e.add(i, j(i)), o("");
						}) : c(n(`${t}invalid_source`));
					},
					children: [
						/* @__PURE__ */ (0, C.jsx)("input", {
							className: "drm-input",
							type: "text",
							value: a,
							onChange: (e) => o(e.target.value),
							placeholder: "mxc://… / https://… / http://localhost:5173/index.js",
							"aria-label": n("datanauten_remote_modules_source_label"),
							spellCheck: !1
						}),
						/* @__PURE__ */ (0, C.jsx)("button", {
							type: "submit",
							className: "drm-button drm-button--primary",
							disabled: l || !a.trim(),
							children: n("datanauten_remote_modules_add")
						}),
						/* @__PURE__ */ (0, C.jsx)("button", {
							type: "button",
							className: "drm-button",
							disabled: l,
							onClick: () => d.current?.click(),
							children: n("datanauten_remote_modules_upload")
						}),
						/* @__PURE__ */ (0, C.jsx)("input", {
							ref: d,
							type: "file",
							accept: ".js,.mjs,text/javascript",
							hidden: !0,
							"data-testid": "remote-modules-file",
							onChange: (t) => {
								let n = t.target.files?.[0];
								t.target.value = "", n && p(() => e.upload(n));
							}
						})
					]
				}),
				s && /* @__PURE__ */ (0, C.jsx)("div", {
					className: "drm-error",
					role: "alert",
					children: s
				}),
				f && /* @__PURE__ */ (0, C.jsx)(E, {
					controller: e,
					t: n
				}),
				/* @__PURE__ */ (0, C.jsx)("p", {
					className: "mx_SettingsSubsection_description drm-hint",
					children: n("datanauten_remote_modules_hint")
				})
			]
		})]
	});
}
function T(e) {
	let t = window.React.useId();
	return /* @__PURE__ */ (0, C.jsxs)("div", {
		className: "mx_SettingsSection",
		role: "group",
		"aria-labelledby": t,
		"data-testid": e.testId,
		children: [/* @__PURE__ */ (0, C.jsx)("h2", {
			id: t,
			className: "mx_Heading_h3",
			children: e.title
		}), /* @__PURE__ */ (0, C.jsx)("div", {
			className: "mx_SettingsSection_subSections",
			children: /* @__PURE__ */ (0, C.jsxs)("div", {
				className: "mx_SettingsSubsection",
				children: [/* @__PURE__ */ (0, C.jsx)("div", {
					className: `mx_SettingsSubsection_description${e.warning ? " drm-warning" : ""}`,
					role: e.warning ? "note" : void 0,
					children: e.description
				}), /* @__PURE__ */ (0, C.jsx)("div", {
					className: "mx_SettingsSubsection_content",
					children: e.children
				})]
			})
		})]
	});
}
function E({ controller: e, t: n }) {
	return /* @__PURE__ */ (0, C.jsxs)("div", {
		className: "drm-notice",
		children: [
			n(`${t}needs_reload`),
			" ",
			/* @__PURE__ */ (0, C.jsx)("button", {
				type: "button",
				className: "drm-button",
				onClick: e.reloadElement,
				children: n(`${t}reload_element`)
			})
		]
	});
}
function D(e) {
	let { module: n, controller: r, t: i, busy: a, run: o } = e, s = j(n.src), [c, l] = n.running ? n.enabled ? ["loaded", "status_loaded"] : ["reload", "status_reload"] : n.enabled ? ["pending", "status_next_reload"] : ["disabled", "status_off"], u = n.enabled ? "turn_off" : "turn_on";
	return /* @__PURE__ */ (0, C.jsxs)("li", {
		className: "drm-row drm-row--server",
		children: [/* @__PURE__ */ (0, C.jsxs)("div", {
			className: "drm-row-text",
			children: [
				/* @__PURE__ */ (0, C.jsxs)("span", {
					className: "drm-name",
					children: [s, n.version && /* @__PURE__ */ (0, C.jsx)(k, {
						version: n.version,
						t: i
					})]
				}),
				n.description && /* @__PURE__ */ (0, C.jsx)("p", {
					className: "drm-description",
					children: n.description
				}),
				/* @__PURE__ */ (0, C.jsx)("span", {
					className: `drm-status drm-status--${c}`,
					children: i(`${t}${l}`)
				}),
				/* @__PURE__ */ (0, C.jsx)("code", {
					className: "drm-source",
					children: n.src
				}),
				(n.usage.length > 0 || n.link) && /* @__PURE__ */ (0, C.jsxs)("details", {
					className: "drm-usage",
					children: [
						/* @__PURE__ */ (0, C.jsx)("summary", { children: i("datanauten_remote_modules_how_to_use") }),
						n.usage.length > 0 && /* @__PURE__ */ (0, C.jsx)("ul", { children: n.usage.map((e) => /* @__PURE__ */ (0, C.jsx)("li", { children: e }, e)) }),
						n.link && /* @__PURE__ */ (0, C.jsx)("a", {
							href: n.link,
							target: "_blank",
							rel: "noreferrer noopener",
							children: i("datanauten_remote_modules_read_more")
						})
					]
				})
			]
		}), n.locked ? /* @__PURE__ */ (0, C.jsx)("span", {
			className: "drm-locked",
			title: i(`${t}locked_hint`),
			children: i(`${t}locked`)
		}) : /* @__PURE__ */ (0, C.jsx)("button", {
			type: "button",
			className: "drm-button",
			disabled: a,
			"aria-label": i(`${t}${u}_label`, { name: s }),
			onClick: () => void o(() => r.setServerEnabled(n.key, !n.enabled)),
			children: i(`${t}${u}`)
		})]
	});
}
function O(e) {
	let { entry: n, status: r, controller: i, t: a, busy: o, run: s } = e, c = r?.state === "loaded", l = n.enabled ? "unload" : "load";
	return /* @__PURE__ */ (0, C.jsxs)("li", {
		className: "drm-row",
		children: [
			/* @__PURE__ */ (0, C.jsxs)("div", {
				className: "drm-row-text",
				children: [
					/* @__PURE__ */ (0, C.jsxs)("span", {
						className: "drm-name",
						children: [n.name, r && "version" in r && r.version && /* @__PURE__ */ (0, C.jsx)(k, {
							version: r.version,
							t: a
						})]
					}),
					/* @__PURE__ */ (0, C.jsx)("code", {
						className: "drm-source",
						children: n.source
					}),
					/* @__PURE__ */ (0, C.jsx)("span", {
						className: `drm-status drm-status--${r?.state ?? "pending"}`,
						children: A(r, a)
					})
				]
			}),
			n.enabled && (r?.state === "failed" || c) && /* @__PURE__ */ (0, C.jsx)("button", {
				type: "button",
				className: "drm-button",
				disabled: o,
				title: c ? a("datanauten_remote_modules_reload_hint") : void 0,
				onClick: () => void s(() => i.reload(n.id)),
				children: a(c ? "datanauten_remote_modules_reload_element" : "datanauten_remote_modules_retry")
			}),
			/* @__PURE__ */ (0, C.jsx)("button", {
				type: "button",
				className: "drm-button",
				disabled: o,
				title: n.enabled && i.isActive(n.id) ? a(`${t}unload_hint`) : void 0,
				"aria-label": a(`${t}${l}_label`, { name: n.name }),
				onClick: () => void s(() => i.setEnabled(n.id, !n.enabled)),
				children: a(`${t}${l}`)
			}),
			/* @__PURE__ */ (0, C.jsx)("button", {
				type: "button",
				className: "drm-button drm-button--danger",
				disabled: o,
				"aria-label": a(`${t}remove_label`, { name: n.name }),
				onClick: () => void s(() => i.remove(n.id)),
				children: a(`${t}remove`)
			})
		]
	});
}
function k({ version: e, t: n }) {
	return /* @__PURE__ */ (0, C.jsx)("span", {
		className: "drm-version",
		"aria-label": n(`${t}version_label`, { version: e }),
		children: e
	});
}
function A(e, n) {
	switch (e?.state) {
		case "loading": return n(`${t}status_loading`);
		case "loaded": return e.apiVersion ? n(`${t}status_loaded_version`, { version: e.apiVersion }) : n(`${t}status_loaded`);
		case "failed": return n(`${t}status_failed`, { error: e.error });
		case "disabled": return n(`${t}status_disabled`);
		case "reload": return n(`${t}status_reload`);
		default: return n(`${t}status_pending`);
	}
}
function j(e) {
	if (e.startsWith("mxc://")) return e.slice(e.lastIndexOf("/") + 1);
	try {
		let t = new URL(e, window.location.href).pathname.split("/").filter(Boolean), n = t.pop() ?? e;
		if (/^index\.m?js$/.test(n) && t.length) {
			let e = t.pop();
			return e === "lib" || e === "dist" ? t.pop() ?? e : e;
		}
		return n;
	} catch {
		return e;
	}
}
// src/ui/section.css?inline
var M = ".mx_TabbedView[data-drm-modules]>.mx_TabbedView_tabPanel:not(.drm-tab-panel),.mx_TabbedView:not([data-drm-modules])>.drm-tab-panel{display:none}.mx_TabbedView[data-drm-modules] .mx_TabbedView_tabLabel_active:not(.drm-tab-label){color:inherit;background-color:#0000}.mx_UserSettingsDialog_title[data-drm-tab]{font-size:0!important}.mx_UserSettingsDialog_title[data-drm-tab]>*{display:none}.mx_UserSettingsDialog_title[data-drm-tab]:before{content:attr(data-drm-prefix) \" \";font:var(--cpd-font-heading-md-semibold);white-space:pre}.mx_UserSettingsDialog_title[data-drm-tab]:after{content:attr(data-drm-tab);font:var(--cpd-font-heading-md-regular)}.drm-warning{background:var(--cpd-color-bg-critical-subtle,#fff0f1);color:var(--cpd-color-text-critical-primary,#d51928);border-radius:8px;padding:8px 12px}.drm-notice{color:var(--cpd-color-text-secondary,#656d77);flex-wrap:wrap;align-items:center;gap:8px;margin:8px 0;font-size:14px;display:flex}.drm-empty{color:var(--cpd-color-text-secondary,#656d77)}.drm-list,.drm-add,.drm-notice,.drm-hint{justify-self:stretch}.drm-list{margin:12px 0;padding:0;list-style:none}.drm-row{border-bottom:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);align-items:center;gap:12px;padding:8px 0;display:flex}.drm-row-text{flex-direction:column;flex:1;min-width:0;display:flex}.drm-name{font-weight:600}.drm-version{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);color:var(--cpd-color-text-secondary,#656d77);font-variant-numeric:tabular-nums;border-radius:4px;margin-left:8px;padding:0 6px;font-size:12px;font-weight:400}.drm-source{color:var(--cpd-color-text-secondary,#656d77);white-space:nowrap;text-overflow:ellipsis;font-size:12px;overflow:hidden}.drm-status{font-size:13px}.drm-status--loaded{color:var(--cpd-color-text-success-primary,#007a62)}.drm-status--failed{color:var(--cpd-color-text-critical-primary,#d51928);white-space:pre-wrap;overflow-wrap:anywhere}.drm-add{flex-flow:wrap;align-items:center;gap:8px;margin-top:12px;display:flex}.drm-input{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);min-width:0;height:36px;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;font-family:var(--cpd-font-family-mono,monospace);border-radius:8px;flex:260px;margin:0;padding:0 12px;font-size:13px}.drm-button{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);height:36px;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;background:0 0;border-radius:18px;padding:0 16px;font-size:14px;font-weight:600}.drm-button:hover:not(:disabled){background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}.drm-button:disabled{opacity:.5;cursor:default}.drm-button--primary,.drm-button--primary:hover:not(:disabled){background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);border-color:#0000}.drm-button--danger{color:var(--cpd-color-text-critical-primary,#d51928)}.drm-input:focus-visible,.drm-button:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}.drm-error{color:var(--cpd-color-text-critical-primary,#d51928);margin-top:8px;font-size:14px}.drm-hint{margin-top:12px}.drm-locked{color:var(--cpd-color-text-secondary);font:var(--cpd-font-body-sm-regular);white-space:nowrap}.drm-row--server{align-items:flex-start}.drm-description{font:var(--cpd-font-body-md-regular);margin:2px 0}.drm-usage{font:var(--cpd-font-body-sm-regular);margin-top:4px}.drm-usage summary{cursor:pointer;color:var(--cpd-color-text-action-accent,#007a62);width:fit-content}.drm-usage ul{margin:4px 0;padding-left:20px}.drm-usage a{color:var(--cpd-color-text-link-external,#0467dd)}", N = String.raw`v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)`, P = new RegExp(String.raw`^\s*\/\*!?\s*[^\s*]+\s+${N}(?=[\s*])`), F = new RegExp(String.raw`@version\s+${N}`);
function I(e) {
	let t = e.slice(0, 1024), n = /^\s*\/\*[\s\S]*?\*\//.exec(t)?.[0];
	if (n) return P.exec(n)?.[1] ?? F.exec(n)?.[1];
}
async function L(e) {
	try {
		let t = await fetch(new URL(e, window.location.href).href, { cache: "force-cache" });
		return t.ok ? I(await t.text()) : void 0;
	} catch {
		return;
	}
}
// src/index.tsx
var R = "de.datanauten.remote_modules", z = "de-datanauten-remote-modules-style";
function B(e) {
	let t = e ?? {};
	if (typeof t != "object") throw Error("expected an object");
	let n = t.allowed_users ?? [];
	if (!Array.isArray(n) || !n.every((e) => typeof e == "string" && /^@[^:]+:.+$/.test(e))) throw Error("allowed_users must be a list of Matrix IDs like @alice:example.org");
	let r = t.about ?? {};
	if (typeof r != "object" || Array.isArray(r)) throw Error("about must be an object, by module name");
	return {
		allowed_users: n,
		about: r
	};
}
function V(e, t, n) {
	if (e === void 0 || n(e)) return e;
	if (typeof e != "object" || !e) return;
	let r = e;
	return [
		t,
		t.split("-")[0],
		"en",
		...Object.keys(r)
	].map((e) => r[e]).find(n);
}
var H = (e) => typeof e == "string", U = (e) => Array.isArray(e) && e.every(H);
function W(e = window.location) {
	let t = [e.search, e.hash.split("?")[1] ?? ""].join("&");
	return new URLSearchParams(t.replace(/^\?/, "")).get("remote_modules") === "off";
}
function G(e, t, n) {
	let r = /* @__PURE__ */ new Set();
	if (!e || !n.length) return r;
	let i = e.findIndex((e) => g(e) === g(t));
	if (i < 0) return r;
	for (let t = e.length - 1; t > i; t--) {
		let i = g(e[t]);
		n.includes(i) && (e.splice(t, 1), r.add(i));
	}
	return r;
}
var K = class {
	api;
	importer;
	static moduleApiVersion = "^2.0.0";
	config;
	store;
	injector;
	statuses = /* @__PURE__ */ new Map();
	active = /* @__PURE__ */ new Set();
	listeners = /* @__PURE__ */ new Set();
	version = 0;
	unsubscribeStore;
	safeMode = W();
	serverModules;
	ownIndex;
	skipped;
	allowed = !1;
	serverVersions;
	constructor(e, t, n = import.meta.url) {
		this.api = e, this.importer = t;
		let r = e.config.get("modules");
		this.serverModules = [...r ?? []], this.ownIndex = this.serverModules.findIndex((e) => g(e) === g(n)), this.skipped = G(r, n, _());
	}
	async load() {
		try {
			this.config = B(this.api.config.get(R));
		} catch (e) {
			throw console.error(`[remote-modules] Invalid "${R}" config`, e), Error("Errors in module configuration for the remote modules module");
		}
		this.api.i18n.register(n), q(), this.start();
	}
	ready;
	dispose() {
		this.unsubscribeStore?.(), this.store?.stop(), this.injector?.stop();
	}
	start() {
		return this.ready = (async () => {
			this.store = new x(this.api), await this.store.start();
			let e = r()?.getUserId() ?? this.api.profile?.value?.userId;
			this.allowed = !!e && this.config.allowed_users.includes(e), this.injector = new f((e) => this.mountSection(e), () => this.t(`${t}title`)), this.injector.start(), this.allowed && (this.unsubscribeStore = this.store.subscribe(() => void this.sync()), await this.sync());
		})().catch((e) => console.error("[remote-modules] Startup failed", e)), this.ready;
	}
	async sync() {
		let e = this.store, t = [];
		for (let n of e.getAll()) {
			let e = this.statuses.get(n.id), r = e && "apiVersion" in e ? {
				apiVersion: e.apiVersion,
				version: e.version
			} : {};
			n.enabled ? this.active.has(n.id) ? e?.state === "reload" && this.setStatus(n.id, {
				state: "loaded",
				...r
			}) : !this.safeMode && e?.state !== "loading" && e?.state !== "failed" && t.push(this.loadOne(n.id)) : this.setStatus(n.id, this.active.has(n.id) ? {
				state: "reload",
				...r
			} : { state: "disabled" });
		}
		await Promise.all(t);
	}
	async loadOne(e) {
		let t = this.store.getAll().find((t) => t.id === e);
		if (t) {
			this.setStatus(e, { state: "loading" });
			try {
				let n = await a(t.source, r()), { apiVersion: i } = await o(n, this.api, this.importer);
				this.active.add(e), this.setStatus(e, {
					state: "loaded",
					apiVersion: i,
					version: I(n)
				}), console.info(`[remote-modules] Loaded ${t.name} from ${t.source}`);
			} catch (n) {
				let r = n instanceof Error ? n.message : String(n);
				console.error(`[remote-modules] ${t.name} (${t.source}) failed`, n), this.setStatus(e, {
					state: "failed",
					error: r
				});
			}
		}
	}
	setStatus(e, t) {
		this.statuses.set(e, t), this.version++;
		for (let e of this.listeners) e();
	}
	getServerModules() {
		let e = this.store.getDisabledServer();
		return this.serverModules.map((t, n) => {
			let r = g(t), i = this.config.about[j(t)], a = this.api.i18n.language;
			return {
				src: t,
				key: r,
				version: this.serverVersions?.get(t),
				description: V(i?.description, a, H),
				usage: V(i?.usage, a, U) ?? [],
				link: i?.link && /^https:\/\//.test(i.link) ? i.link : void 0,
				enabled: !e.includes(r),
				running: !this.skipped.has(r),
				locked: n <= this.ownIndex || this.ownIndex < 0
			};
		});
	}
	controller = {
		subscribe: (e) => {
			this.listeners.add(e);
			let t = this.store.subscribe(() => {
				this.version++, e();
			});
			return () => {
				this.listeners.delete(e), t();
			};
		},
		getModules: () => this.store.getAll(),
		isActive: (e) => this.active.has(e),
		getStatus: (e) => this.statuses.get(e),
		getVersion: () => this.version,
		getServerModules: () => this.getServerModules(),
		canLoadDynamic: () => this.allowed,
		needsReload: () => [...this.active].some((e) => !this.store.getAll().some((t) => t.id === e && t.enabled)),
		safeMode: this.safeMode,
		add: async (e, t) => {
			await this.store.add(e, t);
		},
		upload: async (e) => {
			let t = r();
			if (!t) throw Error("Not logged in");
			let { content_uri: n } = await t.uploadContent(e, {
				name: e.name,
				type: "text/javascript",
				includeFilename: !0
			});
			await this.store.add(n, e.name.replace(/\.m?js$/, ""));
		},
		setEnabled: (e, t) => this.store.update(e, { enabled: t }),
		setServerEnabled: (e, t) => this.store.setServerEnabled(e, t),
		remove: async (e) => {
			await this.store.remove(e), this.statuses.delete(e), this.version++;
			for (let e of this.listeners) e();
		},
		reload: async (e) => {
			this.active.has(e) ? this.controller.reloadElement() : await this.loadOne(e);
		},
		reloadElement: () => window.location.reload()
	};
	t = (e, t) => this.api.i18n.translate(e, t);
	loadServerVersions() {
		if (this.serverVersions) return;
		let e = /* @__PURE__ */ new Map();
		this.serverVersions = e, Promise.all(this.serverModules.map(async (t) => {
			let n = await L(t);
			if (n) {
				e.set(t, n), this.version++;
				for (let e of this.listeners) e();
			}
		}));
	}
	mountSection(e) {
		this.loadServerVersions();
		let t = this.api.createRoot(e);
		return t.render(/* @__PURE__ */ (0, C.jsx)(w, {
			controller: this.controller,
			t: this.t
		})), () => t.unmount();
	}
};
function q() {
	if (document.getElementById(z)) return;
	let e = document.createElement("style");
	e.id = z, e.textContent = M, document.head.appendChild(e);
}
export { R as CONFIG_KEY, K as RemoteModulesModule, K as default, W as isSafeMode, V as localise, B as parseConfig, G as skipDisabledServerModules };

//# sourceMappingURL=index.js.map