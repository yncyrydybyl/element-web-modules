/*! @datanauten/element-web-module-text-reactions 0.1.1 */
// \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), t = "dtr-button", n = "[role=toolbar].mx_MessageActionBar", r = class {
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
	scan(e) {
		let t = e instanceof Element && e.matches(n) ? [e] : [];
		if (t.push(...e.querySelectorAll(n)), e instanceof Element && !t.length) {
			let r = e.closest(n);
			r && t.push(r);
		}
		for (let e of t) this.decorate(e);
	}
	decorate(e) {
		if (e.querySelector(".dtr-button")) return;
		let n = e.closest("[data-event-id]")?.getAttribute("data-event-id"), r = [...e.querySelectorAll("button, [role=button]")].find((e) => e.getAttribute("aria-label") === this.options.reactLabel());
		if (!n || !r) return;
		let a = document.createElement("button");
		a.className = `${r.className} ${t}`;
		for (let e of [
			"data-kind",
			"data-presentation",
			"data-size"
		]) {
			let t = r.getAttribute(e);
			t && a.setAttribute(e, t);
		}
		a.type = "button", a.tabIndex = -1, a.setAttribute("aria-label", this.options.label()), a.title = this.options.label(), a.innerHTML = i, a.addEventListener("click", (e) => {
			e.preventDefault(), e.stopPropagation(), this.options.onClick(n, a);
		}), r.before(a);
	}
}, i = "<svg aria-hidden=\"true\" width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M8.1 5h1.8l5 13h-2.2l-1.2-3.3H6.5L5.3 18H3.1zm-1 7.8h4.2L9.2 7.1z\"/><path d=\"M19.1 10.1q1.5 0 2.3.8t.8 2.3V18h-1.8v-1q-.4.6-1.1.9t-1.6.3q-1.3 0-2.1-.7t-.8-1.8.8-1.8 2.3-.7h2.3v-.2q0-.8-.5-1.2t-1.4-.4q-.6 0-1.2.2t-1 .5l-.7-1.4q.6-.4 1.4-.6t1.6-.2m-.3 6.7q.6 0 1.1-.3t.7-.9v-.9h-2q-1.4 0-1.4.9 0 .5.4.8t1.2.4\"/></svg>", a = "datanauten_text_reactions_", o = {
	[`${a}button`]: {
		en: "React with text",
		de: "Mit Text reagieren"
	},
	[`${a}title`]: {
		en: "React with text",
		de: "Mit Text reagieren"
	},
	[`${a}input_label`]: {
		en: "Reaction",
		de: "Reaktion"
	},
	[`${a}placeholder`]: {
		en: "e.g. +1, same, 🍕 tonight?",
		de: "z. B. +1, dito, 🍕 heute?"
	},
	[`${a}send`]: {
		en: "React",
		de: "Reagieren"
	},
	[`${a}cancel`]: {
		en: "Cancel",
		de: "Abbrechen"
	},
	[`${a}recent`]: {
		en: "Recently used",
		de: "Zuletzt verwendet"
	},
	[`${a}too_long`]: {
		en: "At most %(max)s characters.",
		de: "Höchstens %(max)s Zeichen."
	},
	[`${a}duplicate`]: {
		en: "You already reacted with “%(key)s”.",
		de: "Du hast schon mit „%(key)s“ reagiert."
	},
	[`${a}failed`]: {
		en: "Couldn't send the reaction: %(error)s",
		de: "Reaktion konnte nicht gesendet werden: %(error)s"
	},
	[`${a}no_room`]: {
		en: "Couldn't find the message's room.",
		de: "Der Raum der Nachricht wurde nicht gefunden."
	}
}, s = "de.datanauten.text_reactions", c = 12;
function l() {
	let e = window.mxMatrixClientPeg;
	try {
		return e?.get?.() ?? void 0;
	} catch {
		return;
	}
}
function u(e, t, n = window.location.hash) {
	let r = /^#\/room\/([^/?]+)/.exec(n);
	if (r) {
		let n = decodeURIComponent(r[1]), i = n.startsWith("!") ? e.getRoom(n) : e.getRooms().find((e) => e.getCanonicalAlias() === n);
		if (i?.findEventById(t)) return i.roomId;
	}
	return e.getRooms().find((e) => e.findEventById(t))?.roomId;
}
function d(e) {
	return e.replace(/\s+/g, " ").trim();
}
function f(e, t, n, r) {
	let i = e.getUserId(), a = e.getRoom(t)?.relations?.getChildEventsForEvent(n, "m.annotation", "m.reaction");
	return [...(i ? a?.getAnnotationsBySender()?.[i] : void 0) ?? []].some((e) => !e.isRedacted() && e.getRelation()?.key === r);
}
async function p(e, t, n, r) {
	if (f(e, t, n, r)) throw new h();
	try {
		await e.sendEvent(t, "m.reaction", { "m.relates_to": {
			rel_type: "m.annotation",
			event_id: n,
			key: r
		} });
	} catch (i) {
		throw m(e, t, n, r), i.errcode === "M_DUPLICATE_ANNOTATION" ? new h() : i;
	}
}
function m(e, t, n, r) {
	let i = e.getRoom(t)?.getPendingEvents?.() ?? [];
	for (let t of i) {
		let i = t.getRelation();
		t.getType() === "m.reaction" && i?.event_id === n && i.key === r && e.cancelPendingEvent?.(t);
	}
}
var h = class extends Error {
	constructor() {
		super("duplicate");
	}
}, g = class {
	api;
	watchable;
	constructor(e) {
		this.api = e;
	}
	get() {
		let e = this.attach()?.value?.recent;
		return Array.isArray(e) ? e.filter((e) => typeof e == "string").slice(0, c) : [];
	}
	async use(e) {
		let t = [e, ...this.get().filter((t) => t !== e)].slice(0, c);
		await this.api.client.accountData.set(s, {
			version: 1,
			recent: t
		});
	}
	attach() {
		if (this.watchable) return this.watchable;
		try {
			this.watchable = this.api.client.accountData.get(s), this.watchable.watch(_);
		} catch {}
		return this.watchable;
	}
};
function _() {}
// node_modules/.pnpm/react@19.3.1/node_modules/react/cjs/react-jsx-runtime.production.js
var v = /* @__PURE__ */ e(((e) => {
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
})), y = (/* @__PURE__ */ e(((e, t) => {
	t.exports = v();
})))();
function b({ recent: e, t, send: n, onSubmit: r, onCancel: i }) {
	let [o, s] = window.React.useState(""), [c, l] = window.React.useState(null), [u, f] = window.React.useState(!1), p = window.React.useRef(null);
	window.React.useEffect(() => p.current?.focus(), []);
	let m = async (e) => {
		let i = d(e);
		if (i) {
			if ([...i].length > 64) l(t(`${a}too_long`, { max: "64" }));
			else {
				f(!0), l(null);
				try {
					await n(i), r(i);
				} catch (e) {
					l(e instanceof h ? t(`${a}duplicate`, { key: i }) : t(`${a}failed`, { error: e instanceof Error ? e.message : String(e) })), f(!1);
				}
			}
		}
	};
	return /* @__PURE__ */ (0, y.jsxs)("form", {
		className: "dtr-dialog",
		onSubmit: (e) => {
			e.preventDefault(), m(o);
		},
		children: [
			/* @__PURE__ */ (0, y.jsx)("input", {
				ref: p,
				className: "dtr-input",
				type: "text",
				value: o,
				maxLength: 128,
				disabled: u,
				"aria-label": t(`${a}input_label`),
				placeholder: t(`${a}placeholder`),
				onChange: (e) => {
					s(e.target.value), l(null);
				}
			}),
			e.length > 0 && /* @__PURE__ */ (0, y.jsx)("div", {
				className: "dtr-recent",
				role: "group",
				"aria-label": t("datanauten_text_reactions_recent"),
				children: e.map((e) => /* @__PURE__ */ (0, y.jsx)("button", {
					type: "button",
					className: "dtr-chip",
					disabled: u,
					onClick: () => void m(e),
					children: e
				}, e))
			}),
			c && /* @__PURE__ */ (0, y.jsx)("div", {
				className: "dtr-error",
				role: "alert",
				children: c
			}),
			/* @__PURE__ */ (0, y.jsxs)("div", {
				className: "dtr-actions",
				children: [/* @__PURE__ */ (0, y.jsx)("button", {
					type: "button",
					className: "dtr-action",
					onClick: i,
					children: t(`${a}cancel`)
				}), /* @__PURE__ */ (0, y.jsx)("button", {
					type: "submit",
					className: "dtr-action dtr-action--primary",
					disabled: u || !d(o),
					children: t(`${a}send`)
				})]
			})
		]
	});
}
// src/ui/textReactions.css?inline
var x = ".dtr-dialog{flex-direction:column;gap:12px;min-width:min(360px,80vw);display:flex}.dtr-input{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);height:40px;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;border-radius:8px;padding:0 12px;font-size:15px}.dtr-recent{flex-wrap:wrap;gap:6px;display:flex}.dtr-chip{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);max-width:100%;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;white-space:nowrap;text-overflow:ellipsis;cursor:pointer;border-radius:14px;padding:4px 10px;font-size:14px;overflow:hidden}.dtr-chip:hover:not(:disabled){border-color:var(--cpd-color-border-interactive-primary,#8d97a5)}.dtr-error{color:var(--cpd-color-text-critical-primary,#d51928);font-size:14px}.dtr-actions{justify-content:flex-end;gap:8px;display:flex}.dtr-action{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);height:36px;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;background:0 0;border-radius:18px;padding:0 18px;font-size:14px;font-weight:600}.dtr-action--primary{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);border-color:#0000}.dtr-action:disabled,.dtr-chip:disabled{opacity:.5;cursor:default}.dtr-input:focus-visible,.dtr-chip:focus-visible,.dtr-action:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}", S = "de-datanauten-text-reactions-style", C = class {
	api;
	static moduleApiVersion = "^2.0.0";
	injector;
	recent;
	constructor(e) {
		this.api = e;
	}
	async load() {
		this.api.i18n.register(o), w(), this.recent = new g(this.api), this.injector = new r({
			reactLabel: () => this.api.i18n.translate("action|react"),
			label: () => this.t(`${a}button`),
			onClick: (e) => this.openDialog(e)
		}), this.injector.start();
	}
	dispose() {
		this.injector?.stop();
	}
	openDialog(e) {
		this.api.openDialog({ title: this.t(`${a}title`) }, b, {
			recent: this.recent.get(),
			t: this.t,
			send: async (t) => {
				let n = l(), r = n && u(n, e);
				if (!n || !r) throw Error(this.t(`${a}no_room`));
				await p(n, r, e, t), this.recent.use(t).catch((e) => console.warn("[text-reactions] Saving recent reactions failed", e));
			}
		});
	}
	t = (e, t) => this.api.i18n.translate(e, t);
};
function w() {
	if (document.getElementById(S)) return;
	let e = document.createElement("style");
	e.id = S, e.textContent = x, document.head.appendChild(e);
}
export { C as TextReactionsModule, C as default };

//# sourceMappingURL=index.js.map