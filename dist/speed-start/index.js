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
// src/snapshot.ts
var n = "de.datanauten.speed_start.snapshot", r = "data-speed-start-room", i = "canvas,video,audio,iframe,input,textarea,script,noscript,template,.mx_AuxPanel,.mx_RoomView_statusArea,.mx_RightPanel,.mx_AppsDrawer,.mx_PinnedMessageBanner,.mx_RoomCallBanner,.mx_ThreadsActivityCentre_container,[data-radix-popper-content-wrapper]", a = /* @__PURE__ */ new Set([
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
function o(e = document) {
	let t = e.querySelector("script[src*=\"bundles/\"]")?.getAttribute("src") ?? "";
	return /bundles\/([^/]+)\//.exec(t)?.[1] ?? "";
}
function s({ doc: e, userId: t, rooms: n, avatars: a, now: s = Date.now() }) {
	let u = e.querySelector("#matrixchat .mx_MatrixChat");
	if (!u?.querySelector(".mx_RoomListPanel")) return null;
	let d = u.cloneNode(!0), f = c(n);
	for (let e of d.querySelectorAll(".mx_RoomListItemView")) {
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
		let i = t.parentElement?.nextElementSibling;
		for (; i && i.nextElementSibling;) {
			let e = i.nextElementSibling;
			i.remove(), i = e;
		}
		let a = f.get(t.getAttribute("title") ?? t.textContent ?? "");
		a && e.setAttribute(r, a);
	}
	let p = d.querySelector(".mx_RoomView_wrapper");
	if (p) {
		let e = p.querySelector(".mx_RoomView");
		if (e) {
			for (let t of e.querySelectorAll(".mx_RoomView_timeline")) t.replaceChildren();
			for (let t of e.querySelectorAll(".mx_MessageComposer [contenteditable], .mx_BasicMessageComposer_input")) t.replaceChildren();
			for (let t of e.querySelectorAll(".mx_RoomHeader_topic")) t.remove();
		} else p.replaceChildren();
	}
	for (let e of d.querySelectorAll(i)) e.remove();
	l(d, a);
	let m = d.outerHTML;
	return m.length > 6e5 ? null : {
		format: 1,
		userId: t,
		build: o(e),
		savedAt: s,
		width: e.defaultView?.innerWidth ?? 0,
		html: m
	};
}
function c(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) t.has(n.name) || t.set(n.name, n.id);
	return t;
}
function l(e, t) {
	for (let n of [e, ...e.querySelectorAll("*")]) if (n instanceof HTMLImageElement) {
		let e = t.get(n.currentSrc || n.getAttribute("src") || "");
		if (!e) {
			n.remove();
			continue;
		}
		n.setAttribute("src", e), n.removeAttribute("srcset"), n.setAttribute("alt", ""), u(n, ["src"]);
	} else u(n);
}
function u(e, t = []) {
	for (let { name: n } of [...e.attributes]) t.includes(n) || (a.has(n) || n.startsWith("aria-") || n.startsWith("on") ? e.removeAttribute(n) : n === "style" && /url\(/i.test(e.getAttribute("style") ?? "") && e.setAttribute("style", (e.getAttribute("style") ?? "").replace(/[\w-]+\s*:[^;]*url\([^)]*\)[^;]*;?/gi, "")));
}
function d(e, t = localStorage) {
	try {
		t.setItem(n, JSON.stringify(e));
	} catch (e) {
		console.warn("[speed-start] Couldn't store the snapshot", e);
	}
}
function f(e = localStorage) {
	try {
		e.removeItem(n);
	} catch {}
}
function p(e = localStorage, t = document, r = Date.now()) {
	let i;
	try {
		let t = e.getItem(n);
		if (!t) return null;
		i = JSON.parse(t);
	} catch {
		return null;
	}
	let a = e.getItem("mx_user_id");
	return e.getItem("mx_has_access_token") !== "true" || !a ? null : i.userId === a ? i.format !== 1 || typeof i.html != "string" || i.build !== o(t) || r - i.savedAt > 12096e5 ? null : i : (f(e), null);
}
// src/overlay.ts
function m(e = document) {
	let t = e.getElementById("matrixchat");
	return t?.firstElementChild ? t.querySelector(".mx_LoginSplashView_syncError") ? "other" : t.querySelector(".mx_MatrixChat_splash") ? "loading" : t.querySelector(".mx_MatrixChat .mx_RoomListPanel") ? "ready" : "other" : "booting";
}
function h(e) {
	if (/^#\/(login|register|welcome|forgot_password|start_sso|start_cas|soft_logout)\b/.test(e.hash)) return !1;
	let t = new URLSearchParams(e.search);
	return !(t.has("loginToken") || t.has("code") && t.has("state"));
}
var g = "speed-start-snapshot", _ = 160, v = class {
	snapshot;
	opts;
	host;
	observer;
	timers = [];
	pendingRoom = null;
	readyAt;
	done = !1;
	doc;
	constructor(e, t = {}) {
		this.snapshot = e, this.opts = t, this.doc = t.doc ?? document;
	}
	get shown() {
		return !!this.host?.isConnected;
	}
	show() {
		let e = this.doc, t = e.createElement("div");
		t.className = g, t.setAttribute("aria-hidden", "true"), t.setAttribute("data-testid", "speed-start-snapshot");
		let n = e.createElement("div");
		n.className = "mx_MatrixChat_wrapper", n.innerHTML = this.snapshot.html;
		let r = e.createElement("div");
		r.className = `${g}_bar`, t.append(n, r), t.addEventListener("click", this.onClick, !0), e.body.appendChild(t), this.host = t, this.observer = new MutationObserver(() => this.check());
		let i = e.getElementById("matrixchat");
		i && this.observer.observe(i, {
			childList: !0,
			subtree: !0
		}), this.timers.push(window.setTimeout(() => this.remove(!1), this.opts.timeoutMs ?? 6e4)), this.check();
	}
	remove(e = !0) {
		if (this.done) return;
		this.done = !0, this.observer?.disconnect();
		for (let e of this.timers) clearTimeout(e);
		let t = this.host;
		t && (t.removeEventListener("click", this.onClick, !0), e ? (t.classList.add(`${g}_out`), window.setTimeout(() => t.remove(), _)) : t.remove()), this.opts.onHandover?.(this.pendingRoom);
	}
	check() {
		if (!this.done) switch (m(this.doc)) {
			case "booting":
			case "loading": return;
			case "other":
				this.remove(!1);
				return;
			case "ready": {
				let e = this.doc.querySelector("#matrixchat .mx_RoomListItemView"), t = this.opts.rowsGraceMs ?? 1500;
				this.readyAt === void 0 && (this.readyAt = Date.now(), e || this.timers.push(window.setTimeout(() => this.check(), t))), (e || Date.now() - this.readyAt >= t) && requestAnimationFrame(() => requestAnimationFrame(() => this.remove(!0)));
			}
		}
	}
	onClick = (e) => {
		e.preventDefault(), e.stopPropagation();
		let t = e.target?.closest?.(`[${r}]`);
		t && (this.host?.querySelector(`.${g}_picked`)?.classList.remove(`${g}_picked`), t.classList.add(`${g}_picked`), this.pendingRoom = t.getAttribute(r));
	};
}, y = `
.${g} {
    position: fixed;
    inset: 0;
    z-index: 3000;
    background: var(--cpd-color-bg-canvas-default, #fff);
    cursor: progress;
    opacity: 1;
    transition: opacity ${_}ms ease-out;
}
.${g} > .mx_MatrixChat_wrapper { height: 100%; }
.${g} * { animation: none !important; }
.${g}_out { opacity: 0; pointer-events: none; }
.${g}_picked { background: var(--cpd-color-bg-action-secondary-pressed, rgba(0, 0, 0, 0.08)) !important; }
.${g}_bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 2px;
    width: 30%;
    background: var(--cpd-color-bg-accent-rest, #0b7a52);
    animation: speed-start-bar 1.1s ease-in-out infinite !important;
}
@keyframes speed-start-bar {
    from { transform: translateX(-100%); }
    to { transform: translateX(340%); }
}
@media (prefers-reduced-motion: reduce) {
    .${g}_bar { animation: none !important; width: 100%; opacity: 0.4; }
}
`, b = "de-datanauten-speed-start-style", x = 6e4, S = 5e3, C = .4, w = class {
	api;
	static moduleApiVersion = "^2.0.0";
	overlay;
	avatars = new e();
	timers = [];
	lastCapture = 0;
	constructor(e) {
		this.api = e;
	}
	async load() {
		let e = h(window.location) ? p() : null;
		e && T(e) && (E(), this.overlay = new v(e, { onHandover: (e) => {
			e && this.api.navigation.openRoom(e);
		} }), this.overlay.show()), this.startCapturing().catch((e) => console.warn("[speed-start] Capturing failed", e));
	}
	dispose() {
		this.overlay?.remove(!1);
		for (let e of this.timers) clearInterval(e);
		document.removeEventListener("visibilitychange", this.onVisibility), window.removeEventListener("pagehide", this.captureNow);
	}
	async startCapturing() {
		await this.api.stores.roomListStore.waitForReady(), document.addEventListener("visibilitychange", this.onVisibility), window.addEventListener("pagehide", this.captureNow), this.timers.push(window.setInterval(this.tick, S));
	}
	tick = () => {
		if (document.visibilityState !== "visible" || Date.now() - this.lastCapture < x) return;
		let e = () => {
			this.avatars.refresh(), this.captureNow();
		};
		"requestIdleCallback" in window ? window.requestIdleCallback(e, { timeout: 5e3 }) : e();
	};
	onVisibility = () => {
		document.visibilityState === "hidden" && this.captureNow();
	};
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
		let n = s({
			doc: document,
			userId: e,
			rooms: t,
			avatars: this.avatars.map
		});
		n && (d(n), this.lastCapture = Date.now());
	};
};
function T(e) {
	return !e.width || Math.abs(window.innerWidth - e.width) / e.width <= C;
}
function E() {
	if (document.getElementById(b)) return;
	let e = document.createElement("style");
	e.id = b, e.textContent = y, document.head.appendChild(e);
}
export { w as SpeedStartModule, w as default };

//# sourceMappingURL=index.js.map