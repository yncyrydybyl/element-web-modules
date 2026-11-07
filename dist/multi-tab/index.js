var e = {
	name: "@datanauten/element-web-module-multi-tab",
	version: "0.1.0",
	description: "Element Web module: keep several Element tabs open at once; one tab syncs and holds the crypto, the others mirror it",
	private: !0,
	type: "module",
	main: "lib/index.js",
	license: "AGPL-3.0-only",
	packageManager: "pnpm@10.29.3",
	files: ["lib"],
	scripts: {
		build: "vite build",
		dev: "vite build --watch",
		"lint:types": "tsc --noEmit",
		test: "vitest run",
		"test:watch": "vitest"
	},
	devDependencies: {
		"@element-hq/element-web-module-api": "^2.3.0",
		"@types/node": "^24.19.2",
		"@types/react": "^19.3.0",
		"@types/react-dom": "^19.3.0",
		"@vitejs/plugin-react": "^6.1.2",
		jsdom: "^27.4.0",
		"matrix-js-sdk": "45.0.0",
		playwright: "^1.64.1",
		react: "^19.3.1",
		"react-dom": "^19.3.1",
		rollup: "^4.66.0",
		"rollup-plugin-external-globals": "^0.13.0",
		typescript: "^5.9.3",
		vite: "^8.3.5",
		vitest: "^4.1.12"
	}
}, t = 2e4, n = 32, r = class extends Error {
	code;
	constructor(e, t, n = "RpcError") {
		super(e), this.code = t, this.name = n;
	}
}, i = class extends r {
	constructor(e, t) {
		super(`No answer to "${e}" within ${t} ms`, "TIMEOUT", "TimeoutError");
	}
}, a = class {
	open;
	base;
	tabId;
	fp;
	nextId = 1;
	pending = /* @__PURE__ */ new Map();
	handlers = /* @__PURE__ */ new Map();
	shared;
	inbox;
	engineInbox = null;
	toEngine = null;
	toTabs = /* @__PURE__ */ new Map();
	constructor(e, t, n, r) {
		this.open = e, this.base = t, this.tabId = n, this.fp = r, this.shared = this.listen(t), this.inbox = this.listen(`${t}/tab/${n}`);
	}
	listen(e) {
		let t = this.open(e);
		return t.addEventListener("message", (e) => this.onMessage(e.data)), t;
	}
	get isEngine() {
		return this.engineInbox !== null;
	}
	set isEngine(e) {
		e !== this.isEngine && (e ? this.engineInbox = this.listen(`${this.base}/engine`) : (this.engineInbox.close(), this.engineInbox = null));
	}
	handle(e, t) {
		this.handlers.set(e, t);
	}
	send(e, t, n) {
		this.post({
			v: 2,
			fp: this.fp,
			from: this.tabId,
			to: e,
			type: t,
			payload: n
		});
	}
	request(e, t, n, r) {
		let a = this.nextId++;
		return new Promise((o, s) => {
			let c = setTimeout(() => {
				this.pending.delete(a), s(new i(t, r));
			}, r);
			this.pending.set(a, {
				resolve: o,
				reject: s,
				timer: c
			}), this.post({
				v: 2,
				fp: this.fp,
				from: this.tabId,
				to: e,
				type: t,
				id: a,
				payload: n
			});
		});
	}
	collect(e, t, n) {
		let r = this.nextId++, i = Date.now(), a = [];
		return new Promise((o) => {
			let s = setTimeout(() => {
				this.pending.delete(r), o(a);
			}, n);
			this.pending.set(r, {
				resolve: () => {},
				reject: () => {},
				timer: s,
				each: (e, t) => a.push({
					from: e,
					payload: t,
					receivedMs: Date.now() - i
				})
			}), this.post({
				v: 2,
				fp: this.fp,
				from: this.tabId,
				to: "*",
				type: e,
				id: r,
				payload: t
			});
		});
	}
	failPending(e) {
		for (let [t, n] of this.pending) n.each || (clearTimeout(n.timer), n.reject(e), this.pending.delete(t));
	}
	close() {
		this.failPending(new r("Channel closed", "CLOSED"));
		for (let e of [
			this.shared,
			this.inbox,
			this.engineInbox,
			this.toEngine,
			...this.toTabs.values()
		]) e?.close();
		this.engineInbox = this.toEngine = null, this.toTabs.clear();
	}
	post(e) {
		this.portFor(e.to).postMessage(e);
	}
	portFor(e) {
		if (e === "*") return this.shared;
		if (e === "engine") return this.toEngine ??= this.open(`${this.base}/engine`);
		let t = this.toTabs.get(e);
		if (t ? this.toTabs.delete(e) : t = this.open(`${this.base}/tab/${e}`), this.toTabs.set(e, t), this.toTabs.size > n) {
			let [e, t] = this.toTabs.entries().next().value;
			this.toTabs.delete(e), t.close();
		}
		return t;
	}
	addressedToMe(e) {
		return e.to === this.tabId || e.to === "*" || e.to === "engine" && this.isEngine;
	}
	onMessage(e) {
		if (!e || e.v !== 2 || e.fp !== this.fp || e.from === this.tabId || !this.addressedToMe(e)) return;
		if (e.re !== void 0) {
			let t = this.pending.get(e.re);
			if (!t) return;
			if (t.each) {
				e.error || t.each(e.from, e.payload);
				return;
			}
			this.pending.delete(e.re), clearTimeout(t.timer), e.error ? t.reject(new r(e.error.message, e.error.code, e.error.name)) : t.resolve(e.payload);
			return;
		}
		let t = this.handlers.get(e.type);
		if (!t) return;
		if (e.id === void 0) {
			Promise.resolve().then(() => t(e.payload, e)).catch((t) => console.warn(`[multi-tab] Handler for "${e.type}" failed`, t));
			return;
		}
		let n = e.id;
		Promise.resolve().then(() => t(e.payload, e)).then((t) => this.post({
			v: 2,
			fp: this.fp,
			from: this.tabId,
			to: e.from,
			type: e.type,
			re: n,
			payload: t
		}), (t) => this.post({
			v: 2,
			fp: this.fp,
			from: this.tabId,
			to: e.from,
			type: e.type,
			re: n,
			error: o(t)
		}));
	}
};
function o(e) {
	if (e instanceof Error) {
		let t = e.code;
		return {
			name: e.name,
			message: e.message,
			code: typeof t == "string" ? t : void 0
		};
	}
	return {
		name: "Error",
		message: String(e)
	};
}
// src/util.ts
function s(e, t, n, r) {
	e.delete(t), e.set(t, n), e.size > r && e.delete(e.keys().next().value);
}
function c(e, t) {
	try {
		return e();
	} catch {
		return t;
	}
}
function l(e) {
	return new Promise((t) => setTimeout(t, e));
}
function u(e, t, n) {
	return Promise.race([e.catch(() => n), new Promise((e) => setTimeout(() => e(n), t))]);
}
// src/election.ts
var d = "de.datanauten.multi_tab.engine", f = "de.datanauten.multi_tab.claim", p = "de.datanauten.multi_tab.promote", ee = 15e3, m = 3e4, te = 5e3, ne = 500;
function h(e) {
	return c(() => {
		let t = e.getItem(f);
		return t ? JSON.parse(t) : null;
	}, null);
}
function g(e, t) {
	let n = h(e.local), r = e.now();
	return !n || typeof n.until != "number" || n.until < r || n.tabId === t ? null : {
		...n,
		until: Math.min(n.until, r + m)
	};
}
function re(e, t, n) {
	let r;
	try {
		let t = e.session.getItem(p);
		e.session.removeItem(p);
		let n = t ? h(e.local) : null;
		n && n.tabId === t && n.until >= e.now() && (r = n);
	} catch {}
	return new Promise((i) => {
		let a = (e) => (i({
			role: "engine",
			claim: e
		}), new Promise(() => {})), o = (e) => {
			e?.name === "AbortError" && n.onLockLost();
		};
		if (r) {
			let t = r;
			e.locks.request(d, { steal: !0 }, () => a(t)).catch(o);
		} else e.locks.request(d, { ifAvailable: !0 }, (n) => {
			if (n && !g(e, t)) return a();
			i({ role: "mirror" });
		}).catch(o);
	});
}
function _(e, t, n) {
	e.locks.request(d, () => {
		if (g(e, t)) setTimeout(() => _(e, t, n), ne);
		else return v(e, {
			tabId: t,
			until: e.now() + ee
		}, n);
	}).catch(() => {});
}
function v(e, t, n) {
	try {
		e.local.setItem(f, JSON.stringify(t)), e.session.setItem(p, t.tabId);
	} catch (e) {
		console.warn("[multi-tab] Can't store the promotion claim", e);
	}
	return n.onPromote(t), new Promise(() => {});
}
function y(e, t, n) {
	e.locks.request(d, { steal: !0 }, () => v(e, t, n)).catch(() => {});
}
function ie(e, t) {
	let n = () => c(() => e.local.removeItem(f), void 0);
	return n(), new Promise((r) => {
		e.locks.request(d, () => (n(), r(), new Promise(() => {}))).catch((e) => {
			e?.name === "AbortError" && t.onLockLost();
		});
	});
}
function ae(e) {
	c(() => e.removeItem(p), void 0);
}
function oe(e, t, n) {
	window.addEventListener("pagehide", () => {
		if (!n()) return b(e, t);
		let r = h(e);
		r?.tabId === t && (r.until = Math.min(r.until, Date.now() + te), c(() => e.setItem(f, JSON.stringify(r)), void 0));
	});
}
function b(e, t) {
	h(e)?.tabId === t && c(() => e.removeItem(f), void 0);
}
// src/codec.ts
var se = class {
	crossSigningVerified;
	crossSigningVerifiedBefore;
	known;
	needsUserApproval;
	constructor(e, t, n, r = !1) {
		this.crossSigningVerified = e, this.crossSigningVerifiedBefore = t, this.known = n, this.needsUserApproval = r;
	}
	isVerified() {
		return this.crossSigningVerified;
	}
	isCrossSigningVerified() {
		return this.crossSigningVerified;
	}
	wasCrossSigningVerified() {
		return this.crossSigningVerifiedBefore;
	}
	isTofu() {
		return !1;
	}
}, ce = class {
	signedByOwner;
	crossSigningVerified;
	tofu;
	localVerified;
	blocked;
	trustCrossSignedDevices;
	constructor(e) {
		this.signedByOwner = e.signedByOwner ?? !1, this.crossSigningVerified = e.crossSigningVerified ?? !1, this.tofu = e.tofu ?? !1, this.localVerified = e.localVerified ?? !1, this.blocked = e.blocked ?? !1, this.trustCrossSignedDevices = e.trustCrossSignedDevices ?? !1;
	}
	isVerified() {
		return this.localVerified || this.trustCrossSignedDevices && this.crossSigningVerified;
	}
}, le = class {
	deviceId;
	userId;
	algorithms;
	keys;
	verified;
	signatures;
	displayName;
	dehydrated;
	constructor(e) {
		this.deviceId = e.deviceId, this.userId = e.userId, this.algorithms = e.algorithms ?? [], this.keys = e.keys instanceof Map ? e.keys : new Map(Object.entries(e.keys ?? {})), this.verified = e.verified ?? 0, this.signatures = e.signatures instanceof Map ? e.signatures : /* @__PURE__ */ new Map(), this.displayName = e.displayName, this.dehydrated = !!e.dehydrated;
	}
	getFingerprint() {
		return this.keys.get(`ed25519:${this.deviceId}`);
	}
	getIdentityKey() {
		return this.keys.get(`curve25519:${this.deviceId}`);
	}
};
function x(e) {
	return e && {
		v: e.isCrossSigningVerified(),
		b: e.wasCrossSigningVerified(),
		k: !!e.known,
		n: !!e.needsUserApproval
	};
}
function S(e) {
	return e ? new se(e.v, e.b, e.k, e.n) : null;
}
function ue(e) {
	return e ? {
		signedByOwner: e.signedByOwner,
		crossSigningVerified: e.crossSigningVerified,
		tofu: e.tofu,
		localVerified: e.localVerified,
		blocked: e.blocked,
		trustCrossSignedDevices: e.trustCrossSignedDevices
	} : null;
}
function de(e) {
	return e ? new ce(e) : null;
}
function fe(e) {
	let t = /* @__PURE__ */ new Map();
	for (let [n, r] of e) {
		let e = /* @__PURE__ */ new Map();
		for (let [t, n] of r) e.set(t, new le(n));
		t.set(n, e);
	}
	return t;
}
var C = {
	userTrustStatusChanged: 2,
	"crypto.keyBackupStatus": 1,
	"crypto.keyBackupSessionsRemaining": 1,
	"crypto.keyBackupFailed": 1,
	"crypto.keyBackupDecryptionKeyCached": 1,
	"crossSigning.keysChanged": 1,
	"crypto.devicesUpdated": 2,
	"crypto.willUpdateDevices": 2
}, pe = Object.keys(C);
function me(e, t) {
	return e === "userTrustStatusChanged" ? {
		name: e,
		args: [t[0], x(t[1])]
	} : {
		name: e,
		args: t.slice(0, C[e] ?? 0)
	};
}
function he(e, t) {
	return !Object.hasOwn(C, e) || !Array.isArray(t) ? null : e === "userTrustStatusChanged" ? [t[0], S(t[1])] : t;
}
// src/endpoints.ts
var w = "/_matrix/client/";
function T(e, t) {
	return {
		url: typeof e == "string" ? e : e instanceof URL ? e.href : e.url,
		method: t?.method ?? (e instanceof Request ? e.method : "GET")
	};
}
var ge = [
	/^keys\//,
	/^sendToDevice\//,
	/^room_keys\//,
	/dehydrated_device/,
	/^refresh$/,
	/^org\.matrix\.simplified_msc3575\/sync$/
], _e = /^sync$/;
function ve(e) {
	if (!e.startsWith(w)) return null;
	let t = e.slice(16), n = t.indexOf("/");
	return n < 0 ? "" : t.slice(n + 1);
}
function E(e, t, n, r) {
	if (typeof r == "string" && /(^|&)grant_type=refresh_token(&|$)/.test(r)) return "forbidden";
	let i, a;
	try {
		i = new URL(e, globalThis.location?.href), a = new URL(n);
	} catch {
		return "foreign";
	}
	if (i.origin !== a.origin) return "foreign";
	let o = a.pathname.replace(/\/$/, "");
	if (!i.pathname.startsWith(o + w)) return "homeserver";
	let s = ve(i.pathname.slice(o.length));
	return s === null ? "homeserver" : ge.some((e) => e.test(s)) ? "forbidden" : _e.test(s) && t.toUpperCase() === "GET" ? "sync" : "homeserver";
}
var ye = [
	"to_device",
	"device_lists",
	"device_one_time_keys_count",
	"device_unused_fallback_key_types",
	"org.matrix.msc2732.device_unused_fallback_key_types"
], be = "matrix-js-sdk:riot-web-sync";
function D() {
	return window;
}
var O = {
	ping: "react_sdk_session_lock_ping",
	owner: "react_sdk_session_lock_owner"
};
function k(e) {
	try {
		let t = e.getItem("mx_user_id"), n = e.getItem("mx_device_id"), r = e.getItem("mx_hs_url"), i = e.getItem("mx_is_guest"), a = e.getItem("mx_soft_logout"), o = e.getItem("mx_has_access_token") === "true" || !!e.getItem("mx_access_token");
		return !t || !n || !r || !o || i === "true" || a === "true" ? null : {
			userId: t,
			deviceId: n,
			hsUrl: r
		};
	} catch {
		return null;
	}
}
// src/cryptoTable.ts
var xe = {
	stop: "local",
	encryptEvent: "local",
	decryptEvent: "local",
	getBackupDecryptor: "unsupported",
	importBackedUpRoomKeys: "unsupported",
	shareRoomHistoryWithUser: "forward",
	maybeAcceptKeyBundle: "forward",
	markRoomAsPendingKeyBundle: "forward",
	globalErrorOnUnknownDevices: "local",
	processSyncChanges: "local",
	onCryptoEvent: "local",
	onSyncCompleted: "local",
	markAllTrackedUsersAsDirty: "local",
	globalBlacklistUnverifiedDevices: "local",
	setDeviceIsolationMode: "forward",
	getVersion: "local",
	getOwnDeviceKeys: "forward",
	isEncryptionEnabledInRoom: "forward",
	isStateEncryptionEnabledInRoom: "forward",
	prepareToEncrypt: "forward",
	forceDiscardSession: "forward",
	exportRoomKeys: "unsupported",
	exportRoomKeysAsJson: "unsupported",
	importRoomKeys: "unsupported",
	importRoomKeysAsJson: "unsupported",
	userHasCrossSigningKeys: "forward",
	getUserDeviceInfo: "forward",
	setTrustCrossSignedDevices: "local",
	getTrustCrossSignedDevices: "local",
	getUserVerificationStatus: "forward",
	pinCurrentUserIdentity: "unsupported",
	withdrawVerificationRequirement: "unsupported",
	getUserCrossSigningKeys: "forward",
	getDeviceVerificationStatus: "forward",
	setDeviceVerified: "unsupported",
	setDeviceBlocked: "unsupported",
	crossSignDevice: "unsupported",
	isCrossSigningReady: "forward",
	getCrossSigningKeyId: "forward",
	bootstrapCrossSigning: "unsupported",
	isSecretStorageReady: "forward",
	getSecretStorageStatus: "forward",
	bootstrapSecretStorage: "unsupported",
	getCrossSigningStatus: "forward",
	createRecoveryKeyFromPassphrase: "unsupported",
	getEncryptionInfoForEvent: "forward",
	encryptToDeviceMessages: "unsupported",
	resetEncryption: "unsupported",
	getVerificationRequestsToDeviceInProgress: "local",
	findVerificationRequestDMInProgress: "local",
	requestVerificationDM: "unsupported",
	requestOwnUserVerification: "unsupported",
	requestDeviceVerification: "unsupported",
	getSessionBackupPrivateKey: "secret",
	storeSessionBackupPrivateKey: "unsupported",
	loadSessionBackupPrivateKeyFromSecretStorage: "unsupported",
	getActiveSessionBackupVersion: "forward",
	isKeyBackupTrusted: "forward",
	getKeyBackupInfo: "forward",
	checkKeyBackupAndEnable: "unsupported",
	resetKeyBackup: "unsupported",
	disableKeyStorage: "unsupported",
	deleteKeyBackupVersion: "unsupported",
	restoreKeyBackup: "unsupported",
	restoreKeyBackupWithPassphrase: "unsupported",
	isDehydrationSupported: "local",
	startDehydration: "unsupported",
	exportSecretsBundle: "unsupported",
	importSecretsBundle: "unsupported"
};
function A(e) {
	return xe[e];
}
function j(e, t) {
	switch (e) {
		case "prepareToEncrypt": return [t[0]?.roomId];
		case "getEncryptionInfoForEvent": {
			let e = t[0];
			return [{
				roomId: e.getRoomId(),
				raw: e.event
			}];
		}
		default: return t;
	}
}
function M(e, t) {
	switch (e) {
		case "getUserVerificationStatus": return S(t);
		case "getDeviceVerificationStatus": return de(t);
		case "getUserDeviceInfo": return fe(t);
		default: return t;
	}
}
async function Se(e, t, n, r, i) {
	if (A(n) !== "forward") throw Error(`multi-tab: "${n}" is not forwarded`);
	switch (n) {
		case "prepareToEncrypt": {
			let n = t.getRoom(r[0]);
			n && e.prepareToEncrypt(n);
			return;
		}
		case "getEncryptionInfoForEvent": {
			let { roomId: n, raw: a } = r[0], o = t.getRoom(n)?.findEventById(a.event_id);
			return (!o || o.isDecryptionFailure()) && (o = i(a, n), await t.decryptEventIfNeeded(o)), e.getEncryptionInfoForEvent(o);
		}
		case "getUserVerificationStatus": return x(await e.getUserVerificationStatus(...r));
		case "getDeviceVerificationStatus": return ue(await e.getDeviceVerificationStatus(...r));
		default: return e[n](...r);
	}
}
// src/protocol.ts
var N = "STOPPED", Ce = 3, we = 6e4, Te = 200, Ee = class {
	maxBytes;
	bySince = /* @__PURE__ */ new Map();
	waiters = [];
	latestNext = null;
	saved = [];
	pins = /* @__PURE__ */ new Map();
	totalBytes = 0;
	constructor(e = 20971520) {
		this.maxBytes = e;
	}
	get head() {
		return this.latestNext;
	}
	get wantsSave() {
		return this.totalBytes > this.maxBytes;
	}
	add(e, t) {
		let n;
		try {
			n = JSON.parse(t);
		} catch {
			return null;
		}
		let r = n.next_batch;
		if (typeof r != "string") return null;
		if (!e) return this.latestNext = r, null;
		let i = !!n.to_device?.events?.length;
		for (let e of ye) delete n[e];
		let a = JSON.stringify(n);
		if (r === e && e === this.latestNext) {
			let t = {
				since: e,
				next: r,
				text: a,
				bytes: 0,
				hadToDevice: i,
				ready: !0
			};
			return this.wake(t), t;
		}
		let o = this.bySince.get(e);
		o && (this.totalBytes -= o.bytes);
		let s = {
			since: e,
			next: r,
			text: a,
			bytes: a.length * 2,
			hadToDevice: i,
			ready: !1
		};
		return this.bySince.set(e, s), this.totalBytes += s.bytes, this.latestNext = r, this.enforceHardLimit(), s;
	}
	enforceHardLimit() {
		for (let [e, t] of this.bySince) {
			if (this.totalBytes <= this.maxBytes * 2) return;
			this.waiters.some((t) => t.since === e) || (this.bySince.delete(e), this.totalBytes -= t.bytes);
		}
	}
	startChain(e) {
		this.latestNext = e;
	}
	pin(e, t = Date.now()) {
		e && this.pins.set(e, t + we);
	}
	markProcessed(e) {
		for (let t of this.bySince.values()) if (!(t.next !== e || t.ready)) return t.ready = !0, this.wake(t), t;
		return null;
	}
	lookup(e) {
		let t = this.bySince.get(e);
		return t?.ready ? Promise.resolve({ entry: t }) : t || e === this.latestNext ? new Promise((t) => {
			this.waiters.push({
				since: e,
				resolve: t
			}), this.waiters.length > Te && this.waiters.shift().resolve({ resync: !0 });
		}) : Promise.resolve({ resync: !0 });
	}
	onSaved(e, t = Date.now()) {
		if (!e || e === this.saved.at(-1)) return;
		this.saved.push(e), this.saved.length > Ce && this.saved.shift();
		for (let [e, n] of this.pins) n < t && this.pins.delete(e);
		let n = /* @__PURE__ */ new Set();
		for (let e of [...this.saved, ...this.pins.keys()]) for (let t = e; t && this.bySince.has(t) && !n.has(t);) n.add(t), t = this.bySince.get(t).next;
		for (let [e, t] of this.bySince) n.has(e) || this.waiters.some((t) => t.since === e) || (this.bySince.delete(e), this.totalBytes -= t.bytes);
	}
	entriesSince(e) {
		let t = 0;
		for (let n = e; n !== this.latestNext; t++) {
			let e = n === void 0 ? void 0 : this.bySince.get(n);
			if (!e) return null;
			n = e.next;
		}
		return t;
	}
	get size() {
		return this.bySince.size;
	}
	wake(e) {
		for (let t = this.waiters.length - 1; t >= 0; t--) this.waiters[t].since === e.since && (this.waiters[t].resolve({ entry: e }), this.waiters.splice(t, 1));
	}
}, De = 50, P = 5e3, Oe = 20, ke = [3e3, 15e3], Ae = class {
	channel;
	homeserver;
	buffer = new Ee();
	client = null;
	fenced = !1;
	savingForSize = !1;
	readyWaiters = [];
	hookedStore = null;
	savedToken = null;
	mapped = /* @__PURE__ */ new Map();
	failed = /* @__PURE__ */ new Map();
	cryptoGeneration = 0;
	lastToken = null;
	tokenSeq = 0;
	lastSyncAt = null;
	initialSyncPending = !1;
	announced = !1;
	stats = {
		served: 0,
		parked: 0,
		resync: 0,
		decrypts: 0,
		encrypts: 0,
		cryptoCalls: 0,
		teeMsTotal: 0,
		teeMsMax: 0,
		maxBodyBytes: 0,
		flushMs: []
	};
	constructor(e, t) {
		this.channel = e, this.homeserver = t, e.isEngine = !0, e.handle("hello", () => this.onHello()), e.handle("flush", () => this.onFlush()), e.handle("sync", (e) => this.onSync(e)), e.handle("decrypt", (e) => this.onDecrypt(e)), e.handle("encrypt", (e) => this.onEncrypt(e)), e.handle("crypto", (e) => this.onCrypto(e.method, e.args)), e.handle("token", (e) => this.onToken(e?.stale ?? null)), e.handle("ping", () => ({ state: this.fenced ? N : this.client?.getSyncState() ?? null })), e.handle("cryptoSet", (e) => this.onCryptoSet(e.prop, e.value)), e.handle("logout", () => this.onLogout()), e.handle("cryptoBatch", (e) => this.onCryptoBatch(e.calls));
	}
	installFetchTee() {
		let e = window.fetch.bind(window);
		window.fetch = async (t, n) => {
			let { url: r, method: i } = T(t, n);
			if (this.fenced) throw TypeError("multi-tab: this tab lost the engine role");
			let a = this.homeserver();
			if (!a || E(r, i, a) !== "sync") return e(t, n);
			let o = await e(t, n);
			if (o.ok && !this.fenced) {
				let e = new URL(r, location.href).searchParams.get("since");
				if (!e) return this.initialSyncPending = !0, o;
				o.clone().text().then((t) => {
					let n = performance.now();
					this.buffer.add(e, t);
					let r = performance.now() - n;
					this.stats.teeMsTotal += r, this.stats.teeMsMax = Math.max(this.stats.teeMsMax, r), this.stats.maxBodyBytes = Math.max(this.stats.maxBodyBytes, t.length), this.maybeSaveForSize();
				}).catch((e) => console.warn("[multi-tab] Couldn't read /sync response", e));
			}
			return o;
		};
	}
	watchClientPeg(e) {
		let t = e.set.bind(e);
		e.set = (e) => {
			t(e), this.attach(e);
		};
		let n = e.get();
		n && this.attach(n);
	}
	attach(e) {
		if (this.client === e) return;
		this.client = e, e.on("sync", (e, t, n) => {
			let r = n?.nextSyncToken;
			r && (this.lastSyncAt = Date.now()), r && this.initialSyncPending ? (this.initialSyncPending = !1, this.buffer.startChain(r)) : r && this.buffer.markProcessed(r), (e === "PREPARED" || e === "SYNCING") && this.wakeReady();
		});
		let t = e.store;
		this.hookedStore = t;
		let n = t.startup.bind(t);
		t.startup = async () => {
			await n(), this.savedToken = await t.getSavedSyncToken().catch(() => null), this.buffer.onSaved(this.savedToken);
		};
		let r = t.save.bind(t);
		t.save = async (e) => {
			if (this.fenced) return;
			let n = e || t.wantsSave() ? await t.getSavedSyncToken().catch(() => null) : null;
			await r(e), n && (this.savedToken = n, this.buffer.onSaved(n));
		};
		let i = e.initRustCrypto.bind(e);
		e.initRustCrypto = async (t) => {
			await i(t), this.hookCrypto(e);
		};
		for (let t of pe) e.on(t, (...e) => {
			this.cryptoGeneration++;
			try {
				this.channel.send("*", "cryptoEvent", me(t, e));
			} catch (e) {
				console.warn(`[multi-tab] Couldn't pass on "${t}"`, e);
			}
		});
	}
	hookCrypto(e) {
		let t = e.cryptoBackend;
		if (!t || typeof t.onRoomKeysUpdated != "function") return;
		let n = t.onRoomKeysUpdated.bind(t);
		t.onRoomKeysUpdated = async (e) => {
			let t = await n(e);
			this.cryptoGeneration++;
			try {
				let t = {};
				for (let n of e) (t[n.roomId.toString()] ??= []).push(n.sessionId);
				this.channel.send("*", "roomKeys", t);
			} catch (e) {
				console.warn("[multi-tab] Couldn't announce room keys", e);
			}
			return t;
		};
	}
	fence() {
		this.fenced = !0, this.channel.isEngine = !1;
		try {
			this.client?.stopClient();
		} catch {}
	}
	goodbye() {
		this.channel.send("*", "goodbye");
	}
	isReady() {
		let e = this.client?.getSyncState();
		return e === "PREPARED" || e === "SYNCING" || e === "CATCHUP" || e === "RECONNECTING" || e === "ERROR";
	}
	whenReady() {
		return this.isReady() ? Promise.resolve() : new Promise((e) => this.readyWaiters.push(e));
	}
	wakeReady() {
		this.announced || (this.announced = !0, this.channel.send("*", "engineUp", { engineTab: this.channel.tabId }));
		for (let e of this.readyWaiters.splice(0)) e();
	}
	onHello() {
		let e = c(() => localStorage.getItem(O.owner), null);
		return {
			ready: this.isReady() && !this.storeBroken(),
			broken: this.storeBroken(),
			engineTab: this.channel.tabId,
			owner: e
		};
	}
	storeBroken() {
		return !!this.client && !!this.hookedStore && this.client.store !== this.hookedStore;
	}
	async onFlush() {
		await this.whenReady();
		let e = this.client, t = performance.now(), n = this.savedToken ? this.buffer.entriesSince(this.savedToken) : null;
		(n === null || n > De) && await e.store.save(!0), this.stats.flushMs.push(Math.round(performance.now() - t)), this.stats.flushMs.length > Oe && this.stats.flushMs.shift();
		let r = this.savedToken;
		this.buffer.pin(r), this.repersistTokensSoon();
		let { accessToken: i, seq: a } = this.currentToken();
		return {
			token: r,
			accessToken: i,
			tokenSeq: a
		};
	}
	repersistTokensSoon() {
		let e = this.client?.http.opts;
		if (e?.refreshToken && typeof e.onTokenRefresh == "function") for (let e of ke) setTimeout(() => {
			let e = this.client?.http.opts;
			e?.refreshToken && Promise.resolve(e.onTokenRefresh({
				accessToken: e.accessToken,
				refreshToken: e.refreshToken
			})).catch((e) => console.warn("[multi-tab] Couldn't re-persist tokens", e));
		}, e);
	}
	async onToken(e) {
		let t = this.client;
		if (!t?.getAccessToken()) throw new r("The engine has no session yet", "NOT_READY");
		return e && t.getAccessToken() === e && await t.whoami?.().catch(() => {}), { accessToken: t.getAccessToken() };
	}
	async onSync({ since: e, tokenSeq: t }) {
		!this.buffer.head || e !== this.buffer.head ? this.stats.served++ : this.stats.parked++;
		let n = await this.buffer.lookup(e);
		if ("resync" in n) return this.stats.resync++, { resync: !0 };
		let r = this.currentToken(), i = {
			text: n.entry.text,
			next: n.entry.next,
			tokenSeq: r.seq
		};
		return t !== r.seq && (i.accessToken = r.accessToken), i;
	}
	currentToken() {
		let e = this.client?.getAccessToken() ?? null;
		return e !== this.lastToken && (this.lastToken = e, this.tokenSeq++), {
			accessToken: e,
			seq: this.tokenSeq
		};
	}
	crypto() {
		let e = this.client?.cryptoBackend;
		if (!e) throw new r("The engine has no crypto", "NO_CRYPTO");
		return e;
	}
	async onDecrypt(e) {
		let t = this.crypto();
		this.stats.decrypts += e.events.length;
		let n = this.client.getRoom(e.roomId);
		return Promise.all(e.events.map(async (r) => {
			let i = typeof r.event_id == "string" ? r.event_id : void 0, a = this.cryptoGeneration;
			try {
				let o = i ? n?.findEventById(i) : void 0, s = o && !o.isBeingDecrypted?.() && !o.isDecryptionFailure() ? o.clearEvent : void 0;
				if (o && s) return { ok: {
					clearEvent: s,
					senderCurve25519Key: o.getSenderKey() ?? void 0,
					claimedEd25519Key: o.getClaimedEd25519Key() ?? void 0,
					keyForwardedBy: o.getKeyForwardingUser?.() ?? void 0
				} };
				let c = i ? this.failed.get(i) : void 0;
				if (c?.gen === a) return c.err;
				let l = await t.decryptEvent(this.mappedEvent(r, e.roomId));
				return i && this.failed.delete(i), { ok: l };
			} catch (e) {
				let t = e.code, n = { err: {
					code: typeof t == "string" ? t : "UNKNOWN_ERROR",
					message: String(e)
				} };
				return i && s(this.failed, i, {
					gen: a,
					err: n
				}, P), n;
			}
		}));
	}
	mappedEvent(e, t) {
		let n = typeof e.event_id == "string" ? e.event_id : void 0, r = n ? this.mapped.get(n) : void 0;
		if (r) return r;
		let i = this.client.getEventMapper({
			preventReEmit: !0,
			decrypt: !1
		})({
			...e,
			room_id: e.room_id ?? t
		});
		return n && s(this.mapped, n, i, P), i;
	}
	async onLogout() {
		let e = this.client;
		if (!e?.logout) throw new r("The engine has no client", "NOT_READY");
		await e.logout(!0);
	}
	onCryptoSet(e, t) {
		(e === "globalBlacklistUnverifiedDevices" || e === "globalErrorOnUnknownDevices") && (this.crypto()[e] = t);
	}
	async onEncrypt(e) {
		let t = this.client, n = this.crypto(), i = t.getRoom(e.roomId);
		if (!i) throw new r(`The engine doesn't know room ${e.roomId}`, "UNKNOWN_ROOM");
		let a = {
			type: e.type,
			content: e.content,
			room_id: e.roomId,
			sender: t.getUserId(),
			event_id: `~multi-tab-${Date.now()}-${Math.random()}`
		};
		e.stateKey !== void 0 && (a.state_key = e.stateKey);
		let o = t.getEventMapper({
			preventReEmit: !0,
			decrypt: !1
		})(a);
		return await n.encryptEvent(o, i), this.stats.encrypts++, {
			type: o.getWireType(),
			content: o.getWireContent(),
			senderKey: o.getSenderKey(),
			claimedKey: o.getClaimedEd25519Key()
		};
	}
	async onCrypto(e, t) {
		return this.stats.cryptoCalls++, Se(this.crypto(), this.client, e, t, (e, t) => this.mappedEvent(e, t));
	}
	onCryptoBatch(e) {
		return Promise.all(e.map((e) => this.onCrypto(e.method, e.args).then((e) => ({ ok: e }), (e) => ({ err: o(e) }))));
	}
	maybeSaveForSize() {
		this.buffer.wantsSave && !this.savingForSize && this.client && (this.savingForSize = !0, this.client.store.save(!0).catch((e) => console.warn("[multi-tab] Forced save failed", e)).finally(() => this.savingForSize = !1));
	}
};
function je(e, t) {
	t && c(() => {
		e.getItem(O.owner) === t && (e.removeItem(O.ping), e.removeItem(O.owner));
	}, void 0);
}
// src/toast.ts
var F = "de-datanauten-multi-tab-toast", I = "de-datanauten-multi-tab-signed-out", L = "de-datanauten-multi-tab-notice-style", Me = `
#${I} {
    --mt-fg: #1b1d22;
    --mt-bg: #fff;
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    text-align: center;
    font: 16px/1.5 Inter, system-ui, sans-serif;
    color: var(--cpd-color-text-primary, var(--mt-fg));
    background: var(--cpd-color-bg-canvas-default, var(--mt-bg));
}
@media (prefers-color-scheme: dark) {
    #${I} {
        --mt-fg: #ebeef2;
        --mt-bg: #101317;
    }
}`, Ne = 6e3, Pe = 3e4, R = 0, Fe = "";
function z(e) {
	let t = Date.now();
	if (e === Fe && t - R < Pe || (R = t, Fe = e, typeof document > "u" || !document.body)) return;
	document.getElementById(F)?.remove();
	let n = document.createElement("div");
	n.id = F, n.setAttribute("role", "status"), n.textContent = e, Object.assign(n.style, {
		position: "fixed",
		left: "50%",
		bottom: "24px",
		transform: "translateX(-50%)",
		zIndex: "10000",
		maxWidth: "min(480px, calc(100vw - 32px))",
		padding: "12px 16px",
		borderRadius: "8px",
		font: "var(--cpd-font-body-md-regular, 14px sans-serif)",
		color: "var(--cpd-color-text-on-solid-primary, #fff)",
		background: "var(--cpd-color-bg-action-primary-rest, #1b1d22)",
		boxShadow: "0 4px 24px rgba(0, 0, 0, 0.2)"
	}), document.body.appendChild(n), setTimeout(() => n.remove(), Ne);
}
function B(e) {
	let t = () => {
		let t = document.getElementById(I);
		if (t) {
			t.textContent = e;
			return;
		}
		if (!document.getElementById(L)) {
			let e = document.createElement("style");
			e.id = L, e.textContent = Me, document.head.appendChild(e);
		}
		let n = document.createElement("div");
		n.id = I, n.setAttribute("role", "status"), n.textContent = e, document.body.appendChild(n);
	};
	document.body ? t() : document.addEventListener("DOMContentLoaded", t, { once: !0 });
}
function Ie() {
	document.getElementById(I)?.remove();
}
// src/login.ts
var V = "de.datanauten.multi_tab.login";
function Le(e) {
	return /[?&#](loginToken|code)=/.test(e.search + e.hash);
}
function Re(e) {
	return new Promise((t) => {
		e.request(V, { ifAvailable: !0 }, (e) => {
			if (!e) t("waiting");
			else return t("login"), new Promise(() => {});
		}).catch(() => {});
	});
}
function ze(e, t) {
	B("You're signed out. Sign in in your other Element tab: this tab will follow by itself.");
	let n = () => location.reload();
	return window.addEventListener("storage", (e) => {
		e.storageArea === t && k(t) && setTimeout(n, 500);
	}), e.request(V, () => n()).catch(() => {}), new Promise(() => {});
}
// src/mirrorCrypto.ts
var Be = 2e3, H = "UNKNOWN_ERROR", Ve = 6e4, He = 5e3, Ue = 3e4, U = "\0rpc", We = class extends Error {
	constructor(e) {
		super(`"${e}" is only available in the main Element tab`), this.name = "MirrorUnsupportedError";
	}
}, Ge = class {
	channel;
	backend;
	client = null;
	pending = /* @__PURE__ */ new Map();
	pendingCount = 0;
	encryptedRooms = /* @__PURE__ */ new Set();
	unencryptedUntil = /* @__PURE__ */ new Map();
	shieldCache = /* @__PURE__ */ new Map();
	decryptQueue = /* @__PURE__ */ new Map();
	flushScheduled = !1;
	shieldQueue = [];
	listeners = /* @__PURE__ */ new Map();
	stats = {
		decrypted: 0,
		failed: 0,
		retried: 0,
		unsupported: []
	};
	constructor(e) {
		this.channel = e;
		let n = this, r = {
			globalBlacklistUnverifiedDevices: !1,
			globalErrorOnUnknownDevices: !1,
			stop: () => {},
			processSyncChanges: async () => [],
			onCryptoEvent: async () => {},
			onSyncCompleted: () => {},
			markAllTrackedUsersAsDirty: async () => {},
			getVersion: () => "Rust SDK (via the main tab, multi-tab)",
			setTrustCrossSignedDevices: () => {},
			getTrustCrossSignedDevices: () => !0,
			getVerificationRequestsToDeviceInProgress: () => [],
			findVerificationRequestDMInProgress: () => void 0,
			isDehydrationSupported: async () => !1,
			getSessionBackupPrivateKey: async () => null,
			decryptEvent: (e) => n.decryptEvent(e),
			encryptEvent: (e, t) => n.encryptEvent(e, t),
			on: (e, t) => (n.addListener(e, t), n.backend),
			off: (e, t) => (n.listeners.get(e)?.delete(t), n.backend),
			addListener: (e, t) => (n.addListener(e, t), n.backend),
			removeListener: (e, t) => (n.listeners.get(e)?.delete(t), n.backend),
			once: (e, t) => (n.addListener(e, t), n.backend),
			emit: (e, ...t) => n.emit(e, ...t),
			listenerCount: (e) => n.listeners.get(e)?.size ?? 0
		};
		this.backend = new Proxy(r, {
			get(e, t, r) {
				if (typeof t != "string" || t in e) return Reflect.get(e, t, r);
				if (t === "then" || t === "toJSON") return;
				let i = A(t);
				return i === "forward" ? (...e) => n.forward(t, e) : i === "secret" ? async () => null : (...e) => {
					n.stats.unsupported.includes(t) || n.stats.unsupported.push(t), i === void 0 && console.warn(`[multi-tab] Unknown crypto method "${t}" called in a mirror tab`), z("This needs your main Element tab: switch to the tab you opened first.");
					let r = new We(t);
					return Promise.reject(r);
				};
			},
			set(e, r, i) {
				return e[r] = i, (r === "globalBlacklistUnverifiedDevices" || r === "globalErrorOnUnknownDevices") && n.channel.request("engine", "cryptoSet", {
					prop: r,
					value: i
				}, t).catch(() => {}), !0;
			}
		});
	}
	get waiting() {
		return this.pendingCount;
	}
	attach(e) {
		this.client = e;
	}
	addListener(e, t) {
		let n = this.listeners.get(e);
		n || this.listeners.set(e, n = /* @__PURE__ */ new Set()), n.add(t);
	}
	emit(e, ...t) {
		let n = this.listeners.get(e);
		if (!n?.size) return !1;
		for (let e of [...n]) e(...t);
		return !0;
	}
	decodeEvent(e, t) {
		let n = he(e, t);
		return n ? (e === "userTrustStatusChanged" ? this.dropShields([n[0]]) : e === "crypto.devicesUpdated" ? this.dropShields(n[0]) : e === "crossSigning.keysChanged" && this.clearShieldCache(), n) : null;
	}
	async forward(e, t) {
		if (e === "isEncryptionEnabledInRoom") {
			let e = this.knownEncryption(t[0]);
			if (e !== void 0) return e;
		}
		return e === "getEncryptionInfoForEvent" ? this.encryptionInfo(t[0]) : this.forwardNow(e, t);
	}
	knownEncryption(e) {
		if (this.encryptedRooms.has(e)) return !0;
		if (this.client?.getRoom(e)?.hasEncryptionStateEvent?.()) return this.encryptedRooms.add(e), !0;
		if ((this.unencryptedUntil.get(e) ?? 0) > Date.now()) return !1;
	}
	encryptionInfo(e) {
		let t = e?.getId?.(), n = t ? this.shieldCache.get(t) : void 0;
		if (n && n.until > Date.now()) return n.value;
		let r = new Promise((t, n) => {
			this.shieldQueue.push({
				args: j("getEncryptionInfoForEvent", [e]),
				resolve: t,
				reject: n
			}), this.shieldQueue.length === 1 && queueMicrotask(() => void this.flushShields());
		});
		return t && (s(this.shieldCache, t, {
			value: r,
			until: Date.now() + Ve,
			sender: e.getSender?.() ?? null
		}, He), r.catch(() => this.shieldCache.delete(t))), r;
	}
	async flushShields() {
		let e = this.shieldQueue;
		this.shieldQueue = [];
		let n = e.map((e) => ({
			method: "getEncryptionInfoForEvent",
			args: e.args
		})), i;
		try {
			i = await this.channel.request("engine", "cryptoBatch", { calls: n }, t);
		} catch (t) {
			for (let n of e) n.reject(t);
			return;
		}
		e.forEach((e, t) => {
			let n = i[t];
			n && "ok" in n ? e.resolve(M("getEncryptionInfoForEvent", n.ok)) : e.reject(new r(n?.err.message ?? "No answer", n?.err.code, n?.err.name));
		});
	}
	dropShields(e) {
		if (!Array.isArray(e)) return this.clearShieldCache();
		let t = new Set(e);
		for (let [e, n] of this.shieldCache) (n.sender === null || t.has(n.sender)) && this.shieldCache.delete(e);
	}
	clearShieldCache() {
		this.shieldCache.clear();
	}
	async forwardNow(e, n) {
		let r = await this.channel.request("engine", "crypto", {
			method: e,
			args: j(e, n)
		}, t);
		return e === "isEncryptionEnabledInRoom" && (r === !0 ? this.encryptedRooms.add(n[0]) : this.unencryptedUntil.set(n[0], Date.now() + Ue)), M(e, r);
	}
	decryptEvent(e) {
		let t = e.getRoomId();
		return new Promise((n, r) => {
			let i = this.decryptQueue.get(t);
			i || this.decryptQueue.set(t, i = []), i.push({
				ev: e,
				resolve: n,
				reject: r
			}), this.flushScheduled || (this.flushScheduled = !0, queueMicrotask(() => void this.flushDecrypts()));
		});
	}
	async flushDecrypts() {
		this.flushScheduled = !1;
		let e = [...this.decryptQueue.entries()];
		this.decryptQueue.clear(), await Promise.all(e.map(async ([e, n]) => {
			let r = {
				roomId: e,
				events: n.map((e) => e.ev.event)
			}, i;
			try {
				i = await this.channel.request("engine", "decrypt", r, t);
			} catch (e) {
				for (let t of n) this.remember(t.ev, !0), t.reject(e);
				return;
			}
			n.forEach((e, t) => {
				let n = i[t];
				n && "ok" in n ? (this.forget(e.ev), this.stats.decrypted++, e.resolve(n.ok)) : (this.stats.failed++, this.remember(e.ev), Ke(e.ev, n?.err.code ?? H), e.reject(Object.assign(Error(n?.err.message ?? "Decryption failed"), { code: n?.err.code })));
			});
		}));
	}
	async encryptEvent(e, n) {
		let r = {
			roomId: e.getRoomId(),
			type: e.getType(),
			content: e.getContent(),
			stateKey: e.isState() ? e.getStateKey() : void 0
		}, i = await this.channel.request("engine", "encrypt", r, t);
		e.makeEncrypted(i.type, i.content, i.senderKey, i.claimedKey);
	}
	sessionOf(e) {
		return e.getWireContent?.()?.session_id;
	}
	remember(e, t = !1) {
		let n = t ? U : this.sessionOf(e) ?? "*", r = this.pending.get(n);
		if (r || this.pending.set(n, r = /* @__PURE__ */ new Set()), !r.has(e) && (r.add(e), this.pendingCount++, this.pendingCount > Be)) {
			let [e, t] = this.pending.entries().next().value, n = t.values().next().value;
			t.delete(n), this.pendingCount--, t.size || this.pending.delete(e);
		}
	}
	forget(e) {
		for (let t of [this.sessionOf(e) ?? "*", U]) {
			let n = this.pending.get(t);
			n?.delete(e) && (this.pendingCount--, n.size || this.pending.delete(t));
		}
	}
	onRoomKeys(e) {
		let t = new Set(Object.values(e).flat());
		this.retry([...this.pending.keys()].filter((e) => t.has(e) || e === "*"));
	}
	retryRpcFailures() {
		this.retryBucket(U, !0);
	}
	retry(e) {
		for (let t of e) this.retryBucket(t, !1);
	}
	retryBucket(e, t) {
		let n = this.pending.get(e);
		if (n) {
			t && (this.pending.delete(e), this.pendingCount -= n.size);
			for (let e of [...n]) this.stats.retried++, e.attemptDecryption(this.backend, { isRetry: !0 });
		}
	}
}, W = /* @__PURE__ */ new WeakMap();
function Ke(e, t) {
	if (W.set(e, t), Object.prototype.hasOwnProperty.call(e, "_multiTabReason")) return;
	let n = e._decryptionFailureReason ?? null;
	try {
		Object.defineProperty(e, "_decryptionFailureReason", {
			configurable: !0,
			enumerable: !1,
			get: () => n,
			set: (t) => {
				n = t === H && W.has(e) ? W.get(e) : t, t === null && W.delete(e);
			}
		}), Object.defineProperty(e, "_multiTabReason", { value: !0 });
	} catch {}
}
// src/mirror.ts
var G = 1e3, qe = 2e3, Je = "force_verification_on_at_login", K = 9e4, q = 15e3, Ye = 5e3, Xe = 5e3, Ze = 3, Qe = [
	"save",
	"setSyncData",
	"deleteAllData",
	"saveToDeviceBatches",
	"removeToDeviceBatch"
], $e = [
	"storeClientOptions",
	"setOutOfBandMembers",
	"clearOutOfBandMembers",
	"storeUserProfiles",
	"removeUserProfiles"
], et = class {
	deps;
	client = null;
	crypto;
	engineOwner = null;
	engineTab = null;
	engineUp;
	markEngineUp;
	accessToken = null;
	tokenSeq;
	missedPings = 0;
	lastSyncAt = null;
	stats = {
		syncs: 0,
		forbidden: 0,
		retries401: 0
	};
	constructor(e) {
		this.deps = e, this.engineUp = new Promise((e) => this.markEngineUp = e), this.crypto = new Ge(e.channel), e.channel.handle("goodbye", (e, t) => {
			this.engineTab && t.from !== this.engineTab || this.onEngineGone();
		}), e.channel.handle("engineUp", (e) => this.onEngineUp(e.engineTab)), e.channel.handle("roomKeys", (e) => this.crypto.onRoomKeys(e)), e.channel.handle("cryptoEvent", (e) => this.onCryptoEvent(e));
	}
	patchPlatform(e) {
		e.getSessionLock = async () => !0, e.checkSessionLockFree = () => !0, e.displayNotification = () => {}, e.loudNotification = () => {};
	}
	suppressDeviceListener() {
		let e = window, t = (e) => (e && typeof e == "object" && "start" in e && (e.start = () => {}), e), n = t(e.mxDeviceListener);
		try {
			Object.defineProperty(e, "mxDeviceListener", {
				configurable: !0,
				get: () => n,
				set: (e) => n = t(e)
			});
		} catch (e) {
			console.warn("[multi-tab] Couldn't hook the device listener", e);
		}
	}
	installFetchRouter() {
		let e = window.fetch.bind(window);
		window.fetch = async (t, n) => {
			let { url: r, method: i } = T(t, n), a = n?.body instanceof URLSearchParams ? n.body.toString() : n?.body;
			switch (E(r, i, this.deps.homeserver, a)) {
				case "foreign": return e(t, n);
				case "forbidden": return this.stats.forbidden++, console.warn(`[multi-tab] Blocked ${i} ${new URL(r, location.href).pathname} in a mirror tab`), nt(403, {
					errcode: "M_FORBIDDEN",
					error: "Not available in this tab (multi-tab)"
				});
				case "sync": return this.syncViaEngine(r, n?.signal ?? void 0);
				case "homeserver": return e(t, n);
			}
		};
	}
	async freshToken() {
		await this.engineUp;
		let e = await this.deps.channel.request("engine", "token", { stale: this.client?.getAccessToken() ?? null }, t);
		return this.setToken(e.accessToken), e.accessToken;
	}
	setToken(e, t) {
		if (t !== void 0 && (this.tokenSeq = t), !e || e === this.accessToken) return;
		this.accessToken = e;
		let n = this.client;
		n && n.getAccessToken() !== e && n.setAccessToken?.(e);
	}
	async syncViaEngine(e, t) {
		let n = new URL(e, location.href).searchParams.get("since");
		if (!n) return this.deps.reload("mirror would need an initial sync"), new Promise(() => {});
		let r = await rt((async () => {
			await this.engineUp;
			let e = {
				since: n,
				tokenSeq: this.tokenSeq
			};
			return this.deps.channel.request("engine", "sync", e, K);
		})(), t).catch((e) => {
			throw e?.name === "AbortError" ? e : TypeError(`multi-tab: no answer from the engine (${e?.message ?? e})`);
		});
		return r.resync ? (this.deps.reload(`engine doesn't know sync token ${n}`), new Promise(() => {})) : (this.stats.syncs++, this.lastSyncAt = Date.now(), r.accessToken !== void 0 && this.setToken(r.accessToken, r.tokenSeq), new Response(r.text, {
			status: 200,
			headers: { "Content-Type": "application/json" }
		}));
	}
	watchClientPeg(e) {
		let t = e.set.bind(e);
		e.set = (e) => {
			this.patchClient(e), t(e);
		};
	}
	patchClient(e) {
		this.client = e, this.crypto.attach(e), e.initRustCrypto = async () => {
			e.cryptoBackend = this.crypto.backend;
		};
		let t = e.store, n = Object.getPrototypeOf(Object.getPrototypeOf(t));
		for (let e of Qe) typeof t[e] == "function" && (t[e] = async () => {});
		for (let e of $e) {
			let r = n?.[e];
			typeof t[e] == "function" && (t[e] = async (...e) => {
				typeof r == "function" && await r.apply(t, e);
			});
		}
		t.wantsSave = () => !1;
		let r = () => {
			let e = t._backend ?? t.backend;
			e && typeof e.clearDatabase == "function" && (e.clearDatabase = async () => console.warn("[multi-tab] Kept the shared sync store from being deleted"));
		};
		r();
		let i = t.startup.bind(t);
		t.startup = async () => {
			await this.handshake(), await i(), r();
		}, tt(e, () => this.freshToken()), this.redirectLogout(e);
		let a = e.toDeviceMessageQueue;
		a && (a.start = () => {}, a.stop?.());
		let o = `m.local_notification_settings.${e.getDeviceId()}`, s = e.getAccountData?.bind(e);
		s && (e.getAccountData = (e) => e === o ? {
			getContent: () => ({ is_silenced: !0 }),
			getType: () => e
		} : s(e));
	}
	redirectLogout(e) {
		let n = e.logout?.bind(e);
		n && (e.logout = async (r) => {
			r && e.stopClient();
			try {
				return await this.deps.channel.request("engine", "logout", null, t), {};
			} catch (e) {
				return console.warn("[multi-tab] The engine tab didn't sign out; signing out from this tab", e), n(!1);
			}
		});
	}
	async handshake() {
		await this.helloUntilReady((e) => {
			e.broken && z("Your main Element tab can't share its data (storage error). Reload that tab.");
		}), await this.waitForVerifiedEngine();
		let e = await this.deps.channel.request("engine", "flush", null, K);
		this.setToken(e.accessToken, e.tokenSeq), this.markEngineUp(), this.crypto.retryRpcFailures(), this.startWatchdog();
	}
	async helloUntilReady(e) {
		for (;;) {
			try {
				let t = await this.deps.channel.request("engine", "hello", null, G);
				if (this.engineOwner = t.owner, this.engineTab = t.engineTab, t.ready) return;
				e?.(t);
			} catch {}
			await l(G);
		}
	}
	async waitForVerifiedEngine() {
		let e = !1;
		for (;;) {
			let t = !0;
			try {
				localStorage.getItem(Je) && (t = await this.deps.channel.request("engine", "crypto", {
					method: "isCrossSigningReady",
					args: []
				}, G));
			} catch {
				t = !1;
			}
			if (t) break;
			e || (e = !0, console.info("[multi-tab] Waiting until the engine tab has confirmed this device's identity"), B("Finish signing in in your other Element tab: this tab will follow by itself.")), await l(qe);
		}
		e && Ie();
	}
	onEngineGone() {
		this.engineUp = new Promise((e) => this.markEngineUp = e), this.deps.channel.failPending(new r("The engine tab went away", "ENGINE_GONE")), this.helloUntilReady().then(() => {
			this.markEngineUp(), this.crypto.retryRpcFailures();
		});
	}
	onEngineUp(e) {
		this.engineTab && e !== this.engineTab && this.deps.reload("a new engine tab took over");
	}
	onCryptoEvent(e) {
		let t = this.crypto.decodeEvent(e.name, e.args);
		t && this.client?.emit(e.name, ...t);
	}
	startWatchdog() {
		let e = async () => {
			let t = !1;
			try {
				t = (await this.deps.channel.request("engine", "ping", null, Ye))?.state !== N;
			} catch {}
			t ? this.missedPings = 0 : await this.deps.engineLockHeld() ? this.missedPings++ : this.missedPings = 0, this.missedPings >= Ze ? (console.warn("[multi-tab] The engine tab stopped answering; taking over"), this.deps.takeover()) : setTimeout(() => void e(), this.missedPings ? Xe : q);
		};
		setTimeout(() => void e(), q);
	}
};
function tt(e, t) {
	let n = e.http.tokenManager;
	n && (n.doTokenRefresh = async () => {
		let e = n.opts.accessToken;
		try {
			let r = await t();
			return !r || r === e ? "failure" : (n.opts.accessToken = r, "success");
		} catch {
			return "failure";
		}
	});
}
function nt(e, t) {
	return new Response(JSON.stringify(t), {
		status: e,
		headers: { "Content-Type": "application/json" }
	});
}
function rt(e, t) {
	return t ? t.aborted ? Promise.reject(new DOMException("Aborted", "AbortError")) : new Promise((n, r) => {
		let i = () => r(new DOMException("Aborted", "AbortError"));
		t.addEventListener("abort", i, { once: !0 }), e.then(n, r).finally(() => t.removeEventListener("abort", i));
	}) : e;
}
// src/preflight.ts
function it(e = window) {
	let t = e.navigator;
	if (!t.locks || typeof t.locks.request != "function") return {
		ok: !1,
		reason: "no Web Locks"
	};
	if (typeof e.BroadcastChannel != "function") return {
		ok: !1,
		reason: "no BroadcastChannel"
	};
	if (e.electron) return {
		ok: !1,
		reason: "Element Desktop runs a single instance already"
	};
	let n = D(), r = n.mxMatrixClientPeg;
	if (!r || typeof r.set != "function" || typeof r.get != "function") return {
		ok: !1,
		reason: "window.mxMatrixClientPeg missing"
	};
	let i = n.mxPlatformPeg?.get();
	if (!i || typeof i.getSessionLock != "function" || typeof i.checkSessionLockFree != "function") return {
		ok: !1,
		reason: "platform session lock missing"
	};
	if (r.get()) return {
		ok: !1,
		reason: "client already created before the module loaded"
	};
	try {
		if (n.mxSettingsStore?.getValue("feature_simplified_sliding_sync")) return {
			ok: !1,
			reason: "sliding sync is on"
		};
		if (n.mxSettingsStore?.getValue("lowBandwidth")) return {
			ok: !1,
			reason: "low bandwidth mode is on"
		};
	} catch {}
	let a = null;
	try {
		a = k(e.localStorage);
	} catch {
		return {
			ok: !1,
			reason: "localStorage unavailable"
		};
	}
	return {
		ok: !0,
		session: a
	};
}
function J(e, t) {
	return [
		e.userId,
		e.deviceId,
		e.hsUrl.replace(/\/+$/, ""),
		t
	].join("\n");
}
// src/tabs.ts
var at = 400, ot = 3e3;
function st(e, t) {
	e.handle("status", t);
}
async function Y(e, t) {
	let n = t(), r = performance.now(), i = () => Math.round(performance.now() - r), a = e.collect("status", null, at).then((e) => e.map((e) => ({
		...e.payload,
		isThis: !1,
		replyMs: e.receivedMs
	}))), o = n.role === "engine" ? Promise.resolve(null) : e.request("engine", "status", null, ot).then((e) => ({
		...e,
		isThis: !1,
		replyMs: i()
	})).catch(() => null), [s, c] = await Promise.all([a, o]), l = /* @__PURE__ */ new Map();
	for (let e of s) l.set(e.tabId, e);
	return c && !l.has(c.tabId) && l.set(c.tabId, c), l.set(n.tabId, {
		...n,
		isThis: !0,
		replyMs: 0
	}), [...l.values()].sort((e, t) => X(e) - X(t) || e.openedAt - t.openedAt);
}
function X(e) {
	return e.role === "engine" ? 0 : 1;
}
function ct(e, t, n, r, i) {
	return {
		tabId: e,
		role: t,
		version: n,
		openedAt: r,
		title: document.title,
		place: lt(location.hash, i),
		visible: document.visibilityState === "visible",
		focused: document.hasFocus()
	};
}
function lt(e, t) {
	let [, n, r] = /^#\/([^/?]+)\/?([^?]*)/.exec(e) ?? [];
	if (!n || n === "home") return "Home";
	if (n === "room" && r) {
		let e = decodeURIComponent(r.split("/")[0]);
		return t?.getRoom(e)?.name ?? (e.startsWith("#") ? e : null);
	}
	return null;
}
function ut(e) {
	return e < 1024 ? `${e} B` : e < 1048576 ? `${(e / 1024).toFixed(0)} kB` : `${(e / 1024 / 1024).toFixed(1)} MB`;
}
// src/ui/tabs.css?inline
var dt = ".mt-tabs-list{gap:var(--cpd-space-2x,8px);flex-direction:column;margin:0;padding:0;list-style:none;display:flex}.mt-tab{border:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);padding:var(--cpd-space-3x,12px) var(--cpd-space-4x,16px);gap:var(--cpd-space-1x,4px);border-radius:8px;flex-direction:column;min-width:0;display:flex}.mt-tab[data-this=true]{border-color:var(--cpd-color-border-interactive-primary,#656d77)}.mt-tab-head{align-items:center;gap:var(--cpd-space-2x,8px);flex-wrap:wrap;min-width:0;display:flex}.mt-tab-title{font:var(--cpd-font-body-md-semibold,600 15px/22px Inter, sans-serif);color:var(--cpd-color-text-primary,#1b1d22);text-overflow:ellipsis;white-space:nowrap;flex:12em;min-width:0;overflow:hidden}.mt-badge{font:var(--cpd-font-body-xs-medium,500 12px/16px Inter, sans-serif);white-space:nowrap;color:var(--cpd-color-text-secondary,#656d77);background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);border-radius:999px;padding:2px 8px}.mt-badge-main{color:var(--cpd-color-text-success-primary,#007a61);background:var(--cpd-color-bg-success-subtle,#e3f7ed)}.mt-badge-warn{color:var(--cpd-color-text-critical-primary,#d51928);background:var(--cpd-color-bg-critical-subtle,#fff0f0)}.mt-tab-facts{font:var(--cpd-font-body-sm-regular,400 14px/20px Inter, sans-serif);color:var(--cpd-color-text-secondary,#656d77);overflow-wrap:anywhere}.mt-tabs-note{font:var(--cpd-font-body-sm-regular,400 14px/20px Inter, sans-serif);color:var(--cpd-color-text-secondary,#656d77);margin-top:var(--cpd-space-2x,8px)}", Z = "de-datanauten-multi-tab-tabs", ft = "de-datanauten-multi-tab-style", pt = "#mx_tabpanel_USER_PREFERENCES_TAB", mt = 2e3, ht = class {
	list;
	observer;
	section = null;
	timer;
	constructor(e) {
		this.list = e;
	}
	start() {
		this.observer = new MutationObserver(() => this.check()), this.observer.observe(document.body, {
			childList: !0,
			subtree: !0
		}), this.check();
	}
	check() {
		if (this.section?.isConnected) return;
		this.section = null, clearTimeout(this.timer);
		let e = document.querySelector(pt);
		if (!e || document.getElementById("de-datanauten-multi-tab-tabs")) return;
		let t = e.querySelector(".mx_SettingsSubsection"), n = e.querySelector(".mx_SettingsSection") ?? e.querySelector(".mx_SettingsTab_sections");
		if (!t && !n) return;
		bt();
		let r = gt();
		t ? t.after(r) : n.appendChild(r), this.section = r, this.refresh();
	}
	async refresh() {
		let e = this.section;
		if (!e?.isConnected) return;
		let t = null;
		try {
			t = await this.list();
		} catch (e) {
			console.warn("[multi-tab] Couldn't list the open tabs", e);
		}
		e.isConnected && (_t(e, t), this.timer = setTimeout(() => void this.refresh(), mt));
	}
};
function gt() {
	let e = $("div", "mx_SettingsSubsection");
	e.id = Z, e.setAttribute("role", "group"), e.setAttribute("aria-labelledby", `${Z}-heading`);
	let t = $("div", "mx_SettingsSubsectionHeading"), n = $("h3", "mx_Heading_h4 mx_SettingsSubsectionHeading_heading", "Open tabs");
	n.id = `${Z}-heading`, t.appendChild(n);
	let r = $("div", "mx_SettingsSubsection_description");
	r.appendChild($("div", "mx_SettingsSubsection_text", "Element is open in these tabs. The main tab talks to the server and holds your encryption keys; the others get everything through it."));
	let i = $("div", "mx_SettingsSubsection_content"), a = $("ul", "mt-tabs-list");
	return a.setAttribute("aria-live", "polite"), i.appendChild(a), e.append(t, r, i), e;
}
function _t(e, t) {
	let n = e.querySelector(".mx_SettingsSubsection_content"), r = n.querySelector("ul");
	if (n.querySelector(".mt-tabs-note")?.remove(), !t) {
		r.replaceChildren(), n.appendChild($("div", "mt-tabs-note", "The list isn't available right now."));
		return;
	}
	let i = Date.now();
	r.replaceChildren(...t.map((e) => vt(e, i))), t.some((e) => e.role === "engine") || n.appendChild($("div", "mt-tabs-note", "The main tab doesn't answer. Another tab takes over shortly."));
}
function vt(e, t) {
	let n = $("li", "mt-tab");
	n.dataset.tabId = e.tabId, n.dataset.role = e.role, e.isThis && (n.dataset.this = "true");
	let r = $("div", "mt-tab-head");
	r.appendChild($("span", "mt-tab-title", e.place ?? yt(e.title))), e.role === "engine" && r.appendChild($("span", "mt-badge mt-badge-main", "Main tab")), e.isThis && r.appendChild($("span", "mt-badge", "This tab")), (e.syncState === "ERROR" || e.syncState === "STOPPED") && r.appendChild($("span", "mt-badge mt-badge-warn", e.syncState === "ERROR" ? "Connection problem" : "Stopped")), n.appendChild(r);
	let i = [
		e.visible ? e.focused ? "In front" : "Visible" : "In the background",
		`open ${Q(t - e.openedAt)}`,
		e.lastSyncAt ? `last update ${Q(t - e.lastSyncAt)} ago` : "no update yet",
		...e.isThis ? [] : [`answers in ${e.replyMs} ms`],
		...e.details
	];
	return n.appendChild($("div", "mt-tab-facts", i.join(" · "))), n;
}
function yt(e) {
	let t = e.split(" | ").map((e) => e.trim()), n = t.length > 1 ? t.at(-1) : void 0;
	return n && !/^\[?\d+\]?$/.test(n) ? n : e || "Element";
}
function Q(e) {
	let t = Math.max(0, Math.round(e / 1e3));
	if (t < 60) return `${t} s`;
	let n = Math.round(t / 60);
	return n < 60 ? `${n} min` : `${Math.floor(n / 60)} h ${n % 60} min`;
}
function $(e, t, n) {
	let r = document.createElement(e);
	return r.className = t, n !== void 0 && (r.textContent = n), r;
}
function bt() {
	if (document.getElementById(ft)) return;
	let e = document.createElement("style");
	e.id = ft, e.textContent = dt, document.head.appendChild(e);
}
// src/index.ts
var xt = "de.datanauten.multi_tab", St = 2500, Ct = 45e3, wt = "de.datanauten.multi_tab.engine_build", Tt = 2e4, Et = 500, Dt = 500, Ot = 1e3, kt = 300, At = 500, jt = 15e3, Mt = class {
	static moduleApiVersion = "^1.0.0 || ^2.0.0";
	status = {
		role: "pending",
		tabId: It(),
		version: e.version,
		stats: () => ({}),
		tabs: async () => []
	};
	openedAt = Date.now();
	engine;
	mirror;
	build = "";
	reloading = !1;
	signedOut = !1;
	constructor(e) {
		window.__multiTab = this.status;
	}
	async load() {
		let t = it();
		if (!t.ok) return this.off(t.reason);
		let n = await u(D().mxPlatformPeg.get().getAppVersion?.() ?? Promise.resolve("?"), Et, "?");
		this.build = `${e.version}/${n}`;
		let r = {
			locks: navigator.locks,
			local: localStorage,
			session: sessionStorage,
			now: Date.now
		};
		if (!t.session) return this.loggedOut(r);
		let i = t.session, a = Ft(this.status.tabId, J(i, this.build));
		for (let e = 0;; e++) {
			let t = await re(r, this.status.tabId, this.electionCallbacks());
			if (t.role === "engine") {
				this.startEngine(a, () => i.hsUrl, t.claim);
				return;
			}
			let n = await this.probeEngine(a);
			if (n === "answered") break;
			if (!(n === "vacant" && e < 3)) return n === "frozen" ? (console.warn("[multi-tab] The engine tab doesn't answer; taking over"), y(r, {
				tabId: this.status.tabId,
				until: Date.now() + m
			}, this.takeoverCallbacks()), new Promise(() => {})) : (a.close(), this.off("the engine tab runs another build or session (or doesn't answer)"));
		}
		this.startMirror(a, i.hsUrl, r), _(r, this.status.tabId, this.electionCallbacks());
	}
	electionCallbacks() {
		return {
			onPromote: (e) => this.promote(e),
			onLockLost: () => this.onLockLost()
		};
	}
	takeoverCallbacks() {
		return {
			onPromote: (e) => this.promote(e),
			onLockLost: () => {}
		};
	}
	off(e) {
		this.status.role = "off", this.status.reason = e, console.info(`[multi-tab] Off: ${e}`);
	}
	async loggedOut(e) {
		if (ae(e.session), await Re(e.locks) === "waiting" && !Le(location)) return this.status.role = "waiting", console.info("[multi-tab] Signed out; waiting for a login in another tab"), ze(e.locks, e.local);
		this.status.role = "login", console.info("[multi-tab] Signed out; this tab shows the login and becomes the engine after it");
		let t = !1;
		await u(ie(e, this.electionCallbacks()).then(() => t = !0), Tt, !1);
		let n = D().mxMatrixClientPeg, r = n.set.bind(n);
		n.set = (e) => {
			n.set = r, r(e);
			let i = {
				userId: e.getUserId() ?? "",
				deviceId: e.getDeviceId() ?? "",
				hsUrl: e.getHomeserverUrl()
			};
			t || console.warn("[multi-tab] Signed in before the old engine tab let go of the engine role");
			let a = Ft(this.status.tabId, J(i, this.build));
			this.startEngine(a, () => i.hsUrl);
		};
	}
	async probeEngine(e) {
		let t = c(() => localStorage.getItem(wt) === this.build, !1), n = () => {
			let e = g({
				local: localStorage,
				now: Date.now
			});
			return Math.max(r + (t ? Ct : St), e?.until ?? 0);
		}, r = Date.now();
		for (; Date.now() < n();) {
			try {
				return await e.request("engine", "hello", null, Dt), "answered";
			} catch {}
			if (!g({
				local: localStorage,
				now: Date.now
			}) && !await Nt()) return "vacant";
		}
		return t ? "frozen" : "silent";
	}
	startEngine(e, t, n) {
		this.status.role = "engine", c(() => localStorage.setItem(wt, this.build), void 0), je(localStorage, n?.deadOwner);
		let r = this.engine = new Ae(e, t);
		if (r.installFetchTee(), r.watchClientPeg(D().mxMatrixClientPeg), n) {
			let e = () => {
				r.client?.getSyncState() === "SYNCING" ? b(localStorage, n.tabId) : setTimeout(e, Ot);
			};
			e();
		}
		window.addEventListener("pagehide", () => r.goodbye()), this.watchLogout(e), this.showTabs(e, () => ({
			syncState: r.client?.getSyncState() ?? null,
			lastSyncAt: r.lastSyncAt,
			details: [`${r.buffer.size} sync responses kept for other tabs (${ut(r.buffer.totalBytes)})`, `${r.stats.decrypts} messages decrypted for them`]
		})), this.status.stats = () => ({
			...r.stats,
			buffered: r.buffer.size,
			bufferBytes: r.buffer.totalBytes
		}), console.info("[multi-tab] This tab is the engine");
	}
	startMirror(e, t, n) {
		this.status.role = "mirror";
		let r = this.mirror = new et({
			channel: e,
			homeserver: t,
			reload: (e) => {
				console.info(`[multi-tab] Reloading: ${e}`), location.reload();
			},
			takeover: () => y(n, {
				tabId: this.status.tabId,
				until: Date.now() + m
			}, this.takeoverCallbacks()),
			engineLockHeld: Nt
		});
		r.patchPlatform(D().mxPlatformPeg.get()), r.suppressDeviceListener(), r.installFetchRouter(), r.watchClientPeg(D().mxMatrixClientPeg), this.watchLogout(e), this.showTabs(e, () => ({
			syncState: r.client?.getSyncState() ?? null,
			lastSyncAt: r.lastSyncAt,
			details: [`${r.crypto.stats.decrypted} messages decrypted through the main tab`, ...r.crypto.waiting ? [`${r.crypto.waiting} without their keys`] : []]
		})), this.status.stats = () => ({
			...r.stats,
			crypto: r.crypto.stats,
			engineTab: r.engineTab
		}), console.info("[multi-tab] This tab mirrors the engine tab");
	}
	showTabs(e, t) {
		let n = () => ({
			...ct(this.status.tabId, this.status.role, this.build, this.openedAt, D().mxMatrixClientPeg?.get() ?? null),
			...t()
		});
		st(e, n), this.status.tabs = () => Y(e, n), new ht(() => Y(e, n)).start();
	}
	promote(e) {
		this.signedOut || (e.deadOwner = this.mirror?.engineOwner ?? c(() => localStorage.getItem(O.owner), null) ?? void 0, c(() => localStorage.setItem(f, JSON.stringify(e)), void 0), console.info("[multi-tab] The engine tab is gone; this tab takes over"), this.reloading = !0, oe(localStorage, e.tabId, () => this.reloading), location.reload());
	}
	onLockLost() {
		console.warn("[multi-tab] Another tab took over the engine role"), this.engine?.fence(), location.reload();
	}
	watchLogout(e) {
		e.handle("loggedOut", () => {
			this.signedOut = !0, setTimeout(() => location.reload(), kt);
		}), D().mxDispatcher?.register((t) => {
			t.action === "on_logged_out" && (this.signedOut = !0, e.send("*", "loggedOut"), Pt());
		});
	}
};
async function Nt() {
	return !!(await navigator.locks.query()).held?.some((e) => e.name === d);
}
async function Pt() {
	let e = Date.now() + jt, t = location.href;
	for (;;) {
		if (await l(At), location.href !== t && !location.href.startsWith(t.split("#")[0])) return;
		let n = !0;
		try {
			n = !(await indexedDB.databases?.() ?? []).some((e) => e.name === be);
		} catch {}
		if (n || Date.now() > e) break;
	}
	location.reload();
}
function Ft(e, t) {
	return new a((e) => new BroadcastChannel(e), `${xt}:${t}`, e, t);
}
function It() {
	return Math.random().toString(36).slice(2, 10);
}
export { Mt as MultiTabModule, Mt as default };

//# sourceMappingURL=index.js.map