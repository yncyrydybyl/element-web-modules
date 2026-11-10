/*! @datanauten/element-web-module-files-hub 0.1.1 */
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
function n(e, t) {
	window.location.hash = `#/room/${encodeURIComponent(e)}/${encodeURIComponent(t)}`;
}
function r(e) {
	return (e.getMyMembership?.() ?? "join") === "join";
}
function i(e) {
	return e.isSpaceRoom?.() ?? e.getType?.() === "m.space";
}
function a(e) {
	return e.hasEncryptionStateEvent ? e.hasEncryptionStateEvent() : !!e.currentState?.getStateEvents("m.room.encryption", "");
}
// src/files.ts
var o = /* @__PURE__ */ new Set([
	"m.file",
	"m.image",
	"m.video",
	"m.audio"
]);
function s(e) {
	if (e.type !== "m.room.message" || e.redacted) return null;
	let t = e.content, n = typeof t.msgtype == "string" ? t.msgtype : "";
	if (!o.has(n)) return null;
	let r = t["m.relates_to"];
	if (r?.rel_type === "m.replace") return null;
	let i = c(t.file) ? t.file : void 0, a = typeof t.url == "string" && t.url.startsWith("mxc://") ? t.url : void 0;
	if (!i && !a) return null;
	let s = t.info ?? {}, l = String(typeof t.filename == "string" && t.filename || t.body || "file"), u = typeof s.mimetype == "string" ? s.mimetype : void 0, d = typeof s.size == "number" && s.size >= 0 ? s.size : void 0, m = e.threadId ?? (r?.rel_type === "m.thread" ? r.event_id : void 0);
	return {
		roomId: e.roomId,
		eventId: e.eventId,
		sender: e.sender,
		ts: e.ts,
		name: l,
		mimetype: u,
		size: d,
		msgtype: n,
		category: f(n, u, l),
		office: p(u, l),
		url: i ? void 0 : a,
		file: i,
		threadId: m
	};
}
function c(e) {
	let t = e;
	return !!t && typeof t.url == "string" && typeof t.iv == "string" && !!t.key && !!t.hashes;
}
function l(e) {
	let t = /\.([a-z0-9]{1,8})$/i.exec(e.trim());
	return t ? t[1].toLowerCase() : "";
}
var u = /* @__PURE__ */ new Set([
	"pdf",
	"doc",
	"docx",
	"docm",
	"dot",
	"dotx",
	"odt",
	"rtf",
	"txt",
	"md",
	"xls",
	"xlsx",
	"xlsm",
	"csv",
	"ods",
	"ppt",
	"pptx",
	"pptm",
	"odp",
	"key",
	"pages",
	"numbers",
	"one",
	"vsdx",
	"epub"
]), d = /^(application\/(pdf|msword|rtf|vnd\.ms-|vnd\.openxmlformats-officedocument|vnd\.oasis\.opendocument|epub)|text\/)/;
function f(e, t, n) {
	let r = (t ?? "").toLowerCase();
	return e === "m.image" || r.startsWith("image/") ? "image" : e === "m.video" || r.startsWith("video/") ? "video" : d.test(r) || u.has(l(n)) ? "document" : "other";
}
function p(e, t) {
	let n = (e ?? "").toLowerCase(), r = l(t);
	return n === "application/pdf" || r === "pdf" ? "pdf" : /wordprocessingml|msword|opendocument\.text/.test(n) || [
		"doc",
		"docx",
		"docm",
		"dot",
		"dotx",
		"odt",
		"rtf"
	].includes(r) ? "word" : /spreadsheetml|ms-excel|opendocument\.spreadsheet/.test(n) || [
		"xls",
		"xlsx",
		"xlsm",
		"ods",
		"csv"
	].includes(r) ? "excel" : /presentationml|ms-powerpoint|opendocument\.presentation/.test(n) || [
		"ppt",
		"pptx",
		"pptm",
		"odp"
	].includes(r) ? "powerpoint" : n.startsWith("text/") || ["txt", "md"].includes(r) ? "text" : null;
}
function m(e) {
	if (e === void 0) return "";
	if (e < 1024) return `${e} B`;
	let t = [
		"KB",
		"MB",
		"GB"
	], n = e / 1024, r = 0;
	for (; n >= 1024 && r < t.length - 1;) n /= 1024, r++;
	return `${n < 10 ? n.toFixed(1) : Math.round(n)} ${t[r]}`;
}
function h(e, t, n = "date") {
	let r = (t.query ?? "").trim().toLowerCase(), i = [];
	for (let n of e) t.category && t.category !== "all" && n.category !== t.category || t.sender && n.sender !== t.sender || t.roomIds && !t.roomIds.has(n.roomId) || r && !n.name.toLowerCase().includes(r) || i.push(n);
	return i.sort({
		date: (e, t) => t.ts - e.ts,
		name: (e, t) => e.name.localeCompare(t.name) || t.ts - e.ts,
		size: (e, t) => (t.size ?? -1) - (e.size ?? -1) || t.ts - e.ts
	}[n]);
}
// src/scanner.ts
var g = {
	maxAgeDays: 90,
	maxEventsPerRoom: 500,
	concurrency: 3
}, _ = 864e5, v = 100, y = 100, b = class {
	getClient;
	opts;
	now;
	client;
	rooms = /* @__PURE__ */ new Map();
	listeners = /* @__PURE__ */ new Set();
	run;
	running = !1;
	notifyTimer;
	cached;
	constructor(e, t = g, n = Date.now) {
		this.getClient = e, this.opts = t, this.now = n;
	}
	list() {
		if (this.cached) return this.cached;
		let e = this.ensureClient(), t = [];
		for (let [n, i] of this.rooms) {
			let a = e?.getRoom(n);
			a && r(a) && t.push(...i.items.values());
		}
		return this.cached = t, t;
	}
	subscribe(e) {
		return this.listeners.add(e), () => this.listeners.delete(e);
	}
	isRunning() {
		return this.running;
	}
	progress(e) {
		let t = 0, n = 0, r = 0, i = 0, a = this.now() - this.opts.maxAgeDays * _;
		for (let o of e) {
			let e = this.rooms.get(o);
			e && (e.done && t++, e.done && (e.reason === "age" || e.reason === "budget") && n++, e.reason === "error" && i++, r += e.undecryptable, a = Math.max(Math.min(a, e.limitTs), 0));
		}
		return {
			running: this.running,
			rooms: e.length,
			roomsDone: t,
			roomsWithMore: n,
			undecryptable: r,
			errors: i,
			sinceTs: a
		};
	}
	scannableRooms(e) {
		let t = this.ensureClient();
		return t ? t.getRooms().filter((t) => r(t) && !i(t) && (!e || e.has(t.roomId))).sort((e, t) => (t.getLastActiveTimestamp?.() ?? 0) - (e.getLastActiveTimestamp?.() ?? 0)).map((e) => e.roomId) : [];
	}
	scan(e) {
		this.cancel();
		let t = this.ensureClient();
		if (!t) return Promise.resolve();
		this.attachLive(t);
		let n = new AbortController();
		this.run = n;
		let r = e.filter((e) => !this.state(e).done);
		for (let n of e) this.harvest(t, n);
		if (this.changed(), r.length === 0) return Promise.resolve();
		this.running = !0;
		let i = Array.from({ length: Math.max(1, this.opts.concurrency) }, async () => {
			for (; !n.signal.aborted;) {
				let e = r.shift();
				if (!e) return;
				await this.scanRoom(t, e, n.signal);
			}
		});
		return Promise.all(i).then(() => {
			this.run === n && (this.running = !1, this.run = void 0, this.changed());
		});
	}
	cancel() {
		this.run && (this.run.abort(), this.run = void 0, this.running = !1, this.changed());
	}
	searchOlder(e) {
		for (let t of e) {
			let e = this.state(t);
			e.done && e.reason !== "start" && (e.limitTs -= this.opts.maxAgeDays * _, e.budget += this.opts.maxEventsPerRoom, e.done = !1, e.reason = void 0);
		}
		return this.scan(e);
	}
	addEvent(e) {
		if (e.isBeingDecrypted() || e.isDecryptionFailure()) return;
		let t = s(x(e));
		if (!t) return;
		let n = this.state(t.roomId);
		n.items.has(t.eventId) || (n.items.set(t.eventId, t), this.changed());
	}
	removeEvent(e, t) {
		this.rooms.get(e)?.items.delete(t) && this.changed();
	}
	dispose() {
		this.cancel(), this.detachLive();
	}
	async scanRoom(e, t, n) {
		let r = this.state(t), i = e.getRoom(t);
		if (!i || !e.http) {
			r.done = !0, r.reason = "error";
			return;
		}
		r.encrypted = a(i);
		let o = e.getEventMapper?.({
			preventReEmit: !0,
			decrypt: !0
		});
		if (r.encrypted && (!o || !e.decryptEventIfNeeded)) {
			r.done = !0, r.reason = "error";
			return;
		}
		let s = r.encrypted ? {
			types: ["m.room.encrypted", "m.room.message"],
			lazy_load_members: !0
		} : {
			types: ["m.room.message"],
			contains_url: !0,
			lazy_load_members: !0
		}, c = `/rooms/${encodeURIComponent(t)}/messages`;
		try {
			for (; !r.done && !n.aborted;) {
				let i = Math.min(r.encrypted ? y : v, r.budget - r.fetched);
				if (i <= 0) {
					this.stop(r, "budget");
					break;
				}
				let a = await e.http.authedRequest("GET", c, {
					dir: "b",
					limit: i,
					filter: JSON.stringify(s),
					...r.token ? { from: r.token } : {}
				}, void 0, { abortSignal: n });
				if (n.aborted) return;
				let l = Array.isArray(a.chunk) ? a.chunk : [], u = !1, d = [];
				for (let e of l) {
					if (e.origin_server_ts < r.limitTs) {
						u = !0;
						break;
					}
					d.push({
						...e,
						room_id: t
					});
				}
				if (await this.ingest(e, r, t, d, o), n.aborted) return;
				if (r.fetched += l.length, u) {
					this.stop(r, "age"), this.changed();
					break;
				}
				r.token = a.end && l.length > 0 ? a.end : null, r.token === null ? this.stop(r, "start") : r.fetched >= r.budget && this.stop(r, "budget"), this.changed();
			}
		} catch (e) {
			if (n.aborted) return;
			console.warn("[files-hub] Scanning a room failed", t, e), this.stop(r, "error"), this.changed();
		}
	}
	async ingest(e, t, n, r, i) {
		let a = (e) => {
			e && !t.items.has(e.eventId) && (t.items.set(e.eventId, e), this.cached = void 0);
		}, o = r.filter((e) => e.type === "m.room.encrypted");
		for (let e of r) e.type !== "m.room.encrypted" && a(s(S(e, n)));
		o.length !== 0 && i && await Promise.all(o.map(async (r) => {
			let o = i(r);
			try {
				await e.decryptEventIfNeeded?.(o);
			} catch {}
			o.isDecryptionFailure() ? t.undecryptable++ : a(s(x(o, n)));
		}));
	}
	harvest(e, t) {
		let n = this.state(t);
		if (n.harvested) return;
		n.harvested = !0;
		let r = e.getRoom(t);
		if (!r) return;
		let i = [...r.getLiveTimeline?.().getEvents() ?? []];
		for (let e of r.getThreads?.() ?? []) i.push(...e.events ?? []);
		for (let e of i) {
			if (e.isBeingDecrypted() || e.isDecryptionFailure()) continue;
			let r = s(x(e, t));
			r && !n.items.has(r.eventId) && n.items.set(r.eventId, r);
		}
		this.cached = void 0;
	}
	stop(e, t) {
		e.done = !0, e.reason = t;
	}
	state(e) {
		let t = this.rooms.get(e);
		return t || (t = {
			items: /* @__PURE__ */ new Map(),
			harvested: !1,
			limitTs: this.now() - this.opts.maxAgeDays * _,
			budget: this.opts.maxEventsPerRoom,
			fetched: 0,
			done: !1,
			undecryptable: 0,
			encrypted: !1
		}, this.rooms.set(e, t)), t;
	}
	ensureClient() {
		let e = this.getClient();
		return e !== this.client && (this.cancel(), this.detachLive(), this.rooms.clear(), this.cached = void 0, this.client = e), e;
	}
	live;
	attachLive(e) {
		if (this.live?.client === e) return;
		this.detachLive();
		let t = (e, t, n) => {
			n || this.addEvent(e);
		}, n = (e) => {
			this.rooms.has(e.getRoomId() ?? "") && this.addEvent(e);
		}, r = (e) => {
			let t = e.getAssociatedId?.() ?? e.getContent().redacts, n = e.getRoomId();
			t && n && this.removeEvent(n, t);
		};
		e.on("Room.timeline", t), e.on("Event.decrypted", n), e.on("Room.redaction", r), this.live = {
			client: e,
			timeline: t,
			decrypted: n,
			redaction: r
		};
	}
	detachLive() {
		this.live &&= (this.live.client.off("Room.timeline", this.live.timeline), this.live.client.off("Event.decrypted", this.live.decrypted), this.live.client.off("Room.redaction", this.live.redaction), void 0);
	}
	changed() {
		this.cached = void 0, this.notifyTimer ||= setTimeout(() => {
			this.notifyTimer = void 0, this.listeners.forEach((e) => e());
		}, 50);
	}
};
function x(e, t) {
	return {
		eventId: e.getId() ?? "",
		roomId: e.getRoomId() ?? t ?? "",
		type: e.getType(),
		sender: e.getSender() ?? "",
		ts: e.getTs(),
		content: e.getContent(),
		redacted: e.isRedacted(),
		threadId: e.threadRootId
	};
}
function S(e, t) {
	return {
		eventId: e.event_id,
		roomId: e.room_id ?? t,
		type: e.type,
		sender: e.sender,
		ts: e.origin_server_ts,
		content: e.content ?? {},
		redacted: !!e.unsigned?.redacted_because
	};
}
// src/config.ts
var C = "de.datanauten.files_hub";
function w(e) {
	let t = {
		...g,
		preview_max_mb: 25,
		cloud_link_cards: !0
	};
	if (e == null) return t;
	if (typeof e != "object") throw Error("expected an object");
	let n = e, r = (e, t, r) => {
		let i = n[e];
		if (i !== void 0) {
			if (typeof i != "number" || !Number.isFinite(i) || i < t || i > r) throw Error(`${e} must be a number from ${t} to ${r}`);
			return i;
		}
	};
	if (t.maxAgeDays = r("max_age_days", 1, 3650) ?? t.maxAgeDays, t.maxEventsPerRoom = Math.round(r("max_events_per_room", 10, 1e5) ?? t.maxEventsPerRoom), t.concurrency = Math.round(r("concurrency", 1, 10) ?? t.concurrency), t.preview_max_mb = r("preview_max_mb", 0, 1024) ?? t.preview_max_mb, n.cloud_link_cards !== void 0) {
		if (typeof n.cloud_link_cards != "boolean") throw Error("cloud_link_cards must be true or false");
		t.cloud_link_cards = n.cloud_link_cards;
	}
	return t;
}
// src/i18n.ts
var T = "datanauten_fileshub_", E = {
	[`${T}title`]: {
		en: "Files",
		de: "Dateien"
	},
	[`${T}button`]: {
		en: "Files in this room",
		de: "Dateien in diesem Raum"
	},
	[`${T}search`]: {
		en: "Search by file name",
		de: "Nach Dateinamen suchen"
	},
	[`${T}type_all`]: {
		en: "All",
		de: "Alle"
	},
	[`${T}type_document`]: {
		en: "Documents",
		de: "Dokumente"
	},
	[`${T}type_image`]: {
		en: "Images",
		de: "Bilder"
	},
	[`${T}type_video`]: {
		en: "Videos",
		de: "Videos"
	},
	[`${T}type_other`]: {
		en: "Other",
		de: "Sonstige"
	},
	[`${T}filter_type`]: {
		en: "File type",
		de: "Dateityp"
	},
	[`${T}filter_space`]: {
		en: "Space",
		de: "Space"
	},
	[`${T}filter_room`]: {
		en: "Room",
		de: "Raum"
	},
	[`${T}filter_person`]: {
		en: "Shared by",
		de: "Geteilt von"
	},
	[`${T}all_spaces`]: {
		en: "All spaces",
		de: "Alle Spaces"
	},
	[`${T}all_rooms`]: {
		en: "All rooms",
		de: "Alle Räume"
	},
	[`${T}anyone`]: {
		en: "Anyone",
		de: "Alle"
	},
	[`${T}col_name`]: {
		en: "Name",
		de: "Name"
	},
	[`${T}col_shared_by`]: {
		en: "Shared by",
		de: "Geteilt von"
	},
	[`${T}col_room`]: {
		en: "Room",
		de: "Raum"
	},
	[`${T}col_date`]: {
		en: "Date",
		de: "Datum"
	},
	[`${T}col_size`]: {
		en: "Size",
		de: "Größe"
	},
	[`${T}sort_by`]: {
		en: "Sort by %(column)s",
		de: "Nach %(column)s sortieren"
	},
	[`${T}encrypted`]: {
		en: "End-to-end encrypted",
		de: "Ende-zu-Ende-verschlüsselt"
	},
	[`${T}in_thread`]: {
		en: "in a thread",
		de: "in einem Thread"
	},
	[`${T}open`]: {
		en: "Go to message",
		de: "Zur Nachricht"
	},
	[`${T}download`]: {
		en: "Download",
		de: "Herunterladen"
	},
	[`${T}preview`]: {
		en: "Preview",
		de: "Vorschau"
	},
	[`${T}close_preview`]: {
		en: "Close preview",
		de: "Vorschau schließen"
	},
	[`${T}stop`]: {
		en: "Stop",
		de: "Stopp"
	},
	[`${T}search_older`]: {
		en: "Search older messages",
		de: "Ältere Nachrichten durchsuchen"
	},
	[`${T}rescan`]: {
		en: "Try again",
		de: "Erneut versuchen"
	},
	[`${T}scanning`]: {
		en: "Looking for files: %(done)s of %(total)s rooms…",
		de: "Suche Dateien: %(done)s von %(total)s Räumen…"
	},
	[`${T}stopped`]: {
		en: "Stopped after %(done)s of %(total)s rooms. Open the view again to continue.",
		de: "Nach %(done)s von %(total)s Räumen angehalten. Öffne die Ansicht erneut, um weiterzumachen."
	},
	[`${T}since`]: {
		en: "Files shared since %(date)s.",
		de: "Seit %(date)s geteilte Dateien."
	},
	[`${T}more_history`]: {
		en: "%(count)s rooms have older messages that weren't searched.",
		de: "In %(count)s Räumen gibt es ältere Nachrichten, die nicht durchsucht wurden."
	},
	[`${T}undecryptable`]: {
		en: "%(count)s encrypted messages couldn't be decrypted on this device (missing keys), so files in them can't be listed.",
		de: "%(count)s verschlüsselte Nachrichten konnten auf diesem Gerät nicht entschlüsselt werden (fehlende Schlüssel); Dateien darin fehlen in der Liste."
	},
	[`${T}errors`]: {
		en: "%(count)s rooms couldn't be searched.",
		de: "%(count)s Räume konnten nicht durchsucht werden."
	},
	[`${T}count`]: {
		en: "%(count)s files",
		de: "%(count)s Dateien"
	},
	[`${T}empty`]: {
		en: "No files found.",
		de: "Keine Dateien gefunden."
	},
	[`${T}empty_filtered`]: {
		en: "No files match these filters.",
		de: "Keine Dateien passen zu diesen Filtern."
	},
	[`${T}privacy`]: {
		en: "Collected on this device from your rooms. Encrypted files are downloaded and decrypted locally only when you preview or download them; nothing is stored after you close Element.",
		de: "Auf diesem Gerät aus deinen Räumen zusammengestellt. Verschlüsselte Dateien werden erst beim Anzeigen oder Herunterladen geladen und lokal entschlüsselt; nach dem Schließen von Element bleibt nichts gespeichert."
	},
	[`${T}loading_preview`]: {
		en: "Loading preview…",
		de: "Vorschau wird geladen…"
	},
	[`${T}preview_failed`]: {
		en: "Couldn't load the file: %(error)s",
		de: "Die Datei konnte nicht geladen werden: %(error)s"
	},
	[`${T}too_large`]: {
		en: "This file is larger than %(max)s MB. Download it to open it.",
		de: "Diese Datei ist größer als %(max)s MB. Lade sie herunter, um sie zu öffnen."
	},
	[`${T}load_anyway`]: {
		en: "Show preview anyway",
		de: "Vorschau trotzdem anzeigen"
	},
	[`${T}no_preview`]: {
		en: "No preview for this file type. Download it to open it.",
		de: "Für diesen Dateityp gibt es keine Vorschau. Lade die Datei herunter, um sie zu öffnen."
	},
	[`${T}office_hint`]: {
		en: "%(app)s file. Download it to open it in %(app)s or another office app.",
		de: "%(app)s-Datei. Lade sie herunter, um sie in %(app)s oder einer anderen Office-App zu öffnen."
	},
	[`${T}no_pdf_viewer`]: {
		en: "This browser can't show PDFs inline. Download the file to open it.",
		de: "Dieser Browser kann PDFs nicht direkt anzeigen. Lade die Datei herunter, um sie zu öffnen."
	},
	[`${T}not_pdf`]: {
		en: "This file isn't a valid PDF.",
		de: "Diese Datei ist kein gültiges PDF."
	},
	[`${T}download_failed`]: {
		en: "Download failed: %(error)s",
		de: "Download fehlgeschlagen: %(error)s"
	},
	[`${T}cloud_sharepoint`]: {
		en: "SharePoint",
		de: "SharePoint"
	},
	[`${T}cloud_onedrive`]: {
		en: "OneDrive",
		de: "OneDrive"
	},
	[`${T}cloud_kind_word`]: {
		en: "Word document",
		de: "Word-Dokument"
	},
	[`${T}cloud_kind_excel`]: {
		en: "Excel workbook",
		de: "Excel-Arbeitsmappe"
	},
	[`${T}cloud_kind_powerpoint`]: {
		en: "PowerPoint presentation",
		de: "PowerPoint-Präsentation"
	},
	[`${T}cloud_kind_pdf`]: {
		en: "PDF",
		de: "PDF"
	},
	[`${T}cloud_kind_onenote`]: {
		en: "OneNote notebook",
		de: "OneNote-Notizbuch"
	},
	[`${T}cloud_kind_folder`]: {
		en: "Folder",
		de: "Ordner"
	},
	[`${T}cloud_kind_image`]: {
		en: "Image",
		de: "Bild"
	},
	[`${T}cloud_kind_video`]: {
		en: "Video",
		de: "Video"
	},
	[`${T}cloud_kind_file`]: {
		en: "File",
		de: "Datei"
	},
	[`${T}cloud_hint`]: {
		en: "Stored in Microsoft 365, not in this room. Opening it may ask you to sign in to Microsoft.",
		de: "Liegt in Microsoft 365, nicht in diesem Raum. Beim Öffnen musst du dich eventuell bei Microsoft anmelden."
	}
}, D = /https:\/\/[^\s<>"')\]]+/g, O = 3, k = {
	w: "word",
	x: "excel",
	p: "powerpoint",
	b: "pdf",
	o: "onenote",
	f: "folder",
	i: "image",
	v: "video",
	u: "file",
	t: "file"
}, A = {
	doc: "word",
	docx: "word",
	docm: "word",
	xls: "excel",
	xlsx: "excel",
	xlsm: "excel",
	csv: "excel",
	ppt: "powerpoint",
	pptx: "powerpoint",
	pdf: "pdf",
	one: "onenote",
	png: "image",
	jpg: "image",
	jpeg: "image",
	gif: "image",
	mp4: "video",
	mov: "video"
};
function j(e) {
	let t;
	try {
		t = new URL(e.replace(/[.,;:!?]+$/, ""));
	} catch {
		return null;
	}
	if (t.protocol !== "https:") return null;
	let n = t.hostname.toLowerCase(), r, i, a = /^([a-z0-9-]+?)(-my)?\.sharepoint\.com$/.exec(n);
	if (a) r = a[2] ? "onedrive" : "sharepoint", i = a[1];
	else if (n === "1drv.ms" || n === "onedrive.live.com") r = "onedrive";
	else return null;
	let o = t.pathname, s = "file", c = /^\/:([a-z]):\//i.exec(o) ?? (n === "1drv.ms" ? /^\/([a-z])\//i.exec(o) : null);
	c && (s = k[c[1].toLowerCase()] ?? "file");
	let l, u = M(o.split("/").filter(Boolean).pop() ?? ""), d = t.searchParams.get("file") ?? u, f = /\.([a-z0-9]{2,5})$/i.exec(d)?.[1]?.toLowerCase();
	return f && A[f] && (l = d, s === "file" && (s = A[f])), {
		url: t.toString(),
		service: r,
		kind: s,
		name: l,
		tenant: i
	};
}
function M(e) {
	try {
		return decodeURIComponent(e);
	} catch {
		return e;
	}
}
function N(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of e.matchAll(D)) {
		let e = j(r[0]);
		if (e && !n.has(e.url) && (n.add(e.url), t.push(e), t.length >= O)) break;
	}
	return t;
}
function P(e) {
	return /sharepoint\.com|1drv\.ms|onedrive\.live\.com/i.test(e);
}
// src/media.ts
var F = /* @__PURE__ */ new Set([
	"image/jpeg",
	"image/gif",
	"image/png",
	"image/apng",
	"image/webp",
	"image/avif",
	"video/mp4",
	"video/webm",
	"video/ogg",
	"video/quicktime",
	"audio/mp4",
	"audio/webm",
	"audio/aac",
	"audio/mpeg",
	"audio/ogg",
	"audio/wave",
	"audio/wav",
	"audio/x-wav",
	"audio/x-pn-wav",
	"audio/flac",
	"audio/x-flac"
]);
function I(e) {
	let t = (e ?? "").split(";")[0].trim().toLowerCase();
	return F.has(t) ? t : "application/octet-stream";
}
function L(e) {
	let t = I(e.mimetype);
	return e.category === "image" && t.startsWith("image/") ? "image" : e.category === "video" && t.startsWith("video/") ? "video" : e.office === "pdf" ? "pdf" : null;
}
function R(e) {
	let t = /^mxc:\/\/([^/]+)\/([^/?#]+)$/.exec(e);
	return t ? {
		server: t[1],
		id: t[2]
	} : null;
}
async function z(e, t, n) {
	let r = R(t);
	if (!r || !e.baseUrl) throw Error("Invalid media URL");
	let i = e.baseUrl.replace(/\/$/, ""), a = `${encodeURIComponent(r.server)}/${encodeURIComponent(r.id)}`, o = e.getAccessToken?.(), s = o ? { Authorization: `Bearer ${o}` } : {}, c = await fetch(`${i}/_matrix/client/v1/media/download/${a}`, {
		headers: s,
		signal: n
	});
	if (c.status !== 404 && c.status !== 400 && c.status !== 405 || (await c.clone().json().catch(() => ({}))).errcode !== "M_UNRECOGNIZED" && c.status !== 405 || (c = await fetch(`${i}/_matrix/media/v3/download/${a}`, {
		headers: s,
		signal: n
	})), !c.ok) throw Error(`Download failed (${c.status})`);
	return c.arrayBuffer();
}
async function B(e, t) {
	if (!t?.key || !t.iv || !t.hashes?.sha256) throw Error("Invalid encrypted file info");
	if (t.v && !/^v[1-2]$/.test(t.v)) throw Error(`Unsupported attachment version: ${t.v}`);
	let n = globalThis.crypto.subtle, r = await n.digest("SHA-256", e);
	if (V(new Uint8Array(r)) !== t.hashes.sha256.replace(/=+$/, "")) throw Error("Mismatched SHA-256 digest");
	let i = await n.importKey("jwk", t.key, { name: "AES-CTR" }, !1, ["decrypt"]), a = t.v === "v1" || t.v === "v2" ? 64 : 128;
	return n.decrypt({
		name: "AES-CTR",
		counter: H(t.iv),
		length: a
	}, i, e);
}
function V(e) {
	let t = "";
	for (let n of e) t += String.fromCharCode(n);
	return btoa(t).replace(/=+$/, "");
}
function H(e) {
	let t = e.replace(/-/g, "+").replace(/_/g, "/"), n = atob(t + "===".slice(0, (4 - t.length % 4) % 4)), r = new Uint8Array(n.length);
	for (let e = 0; e < n.length; e++) r[e] = n.charCodeAt(e);
	return r;
}
async function U(e, t, n) {
	if (t.file) return B(await z(e, t.file.url, n), t.file);
	if (t.url) return z(e, t.url, n);
	throw Error("No media");
}
function W(e) {
	let t = new Uint8Array(e, 0, Math.min(1024, e.byteLength));
	return String.fromCharCode(...t).includes("%PDF-") ? new Blob([e], { type: "application/pdf" }) : null;
}
function G(e, t, n) {
	let r = URL.createObjectURL(new Blob([e], { type: I(n) })), i = document.createElement("a");
	i.href = r, i.download = t, i.rel = "noopener", document.body.appendChild(i), i.click(), i.remove(), setTimeout(() => URL.revokeObjectURL(r), 6e4);
}
// src/spaces.ts
function K(e) {
	return e.getRooms().filter((e) => i(e) && r(e)).map((e) => ({
		roomId: e.roomId,
		name: e.name
	})).sort((e, t) => e.name.localeCompare(t.name));
}
function ee(e, t) {
	let n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), a = (t) => {
		if (r.has(t)) return;
		r.add(t);
		let o = e.getRoom(t)?.currentState?.getStateEvents("m.space.child") ?? [];
		for (let t of o) {
			let r = t.getStateKey?.();
			if (!r || !Array.isArray(t.getContent().via)) continue;
			let o = e.getRoom(r);
			o && i(o) ? a(r) : n.add(r);
		}
	};
	return a(t), n;
}
function te() {
	let e = window, t = e.deDatanautenTeamsSuite ??= {}, n = t._renderChain;
	if (n?.version === 1) return n;
	let r = {
		version: 1,
		entries: n?.entries ?? [],
		installed: !1
	};
	return t._renderChain = r, r;
}
function q(e, t) {
	return e.entries.filter((e) => {
		try {
			return e.filter(t);
		} catch {
			return !1;
		}
	});
}
function ne(e, t, n) {
	let r = e.find((e) => e.replaces), i = r ? () => r.render(t, n) : n;
	for (let n of e.filter((e) => !e.replaces)) {
		let e = i;
		i = () => n.render(t, e);
	}
	return i();
}
function re(e, t) {
	let n = te(), r = n.entries.findIndex((e) => e.id === t.id);
	if (r >= 0 ? n.entries[r] = t : n.entries.push(t), n.installed) return;
	n.installed = !0;
	let i = (e, t) => ne(q(n, e.mxEvent), e, () => t?.() ?? null);
	e.registerMessageRenderer((e) => {
		let t = q(n, e);
		return t.length > 0 && !t.some((e) => e.replaces);
	}, i), e.registerMessageRenderer((e) => q(n, e).some((e) => e.replaces), i, { allowEditingEvent: !1 });
}
// node_modules/.pnpm/react@19.3.1/node_modules/react/cjs/react-jsx-runtime.production.js
var ie = /* @__PURE__ */ e(((e) => {
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
})), J = (/* @__PURE__ */ e(((e, t) => {
	t.exports = ie();
})))();
function Y() {
	return /* @__PURE__ */ (0, J.jsx)("svg", {
		viewBox: "0 0 24 24",
		width: "24",
		height: "24",
		"aria-hidden": "true",
		fill: "currentColor",
		children: /* @__PURE__ */ (0, J.jsx)("path", { d: "M3 5a2 2 0 0 1 2-2h4.6a2 2 0 0 1 1.4.6L12.4 5H19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm6.6 0H5v13h14V7h-7.4L9.6 5Z" })
	});
}
function ae() {
	return /* @__PURE__ */ (0, J.jsx)("svg", {
		viewBox: "0 0 24 24",
		width: "20",
		height: "20",
		"aria-hidden": "true",
		fill: "currentColor",
		children: /* @__PURE__ */ (0, J.jsx)("path", { d: "M11 3h2v9.6l3.3-3.3 1.4 1.4L12 16.4l-5.7-5.7 1.4-1.4 3.3 3.3V3ZM4 18h16v2H4v-2Z" })
	});
}
function oe(e) {
	return /* @__PURE__ */ (0, J.jsxs)("svg", {
		viewBox: "0 0 24 24",
		width: "14",
		height: "14",
		fill: "currentColor",
		role: e.title ? "img" : void 0,
		"aria-hidden": !e.title || void 0,
		"aria-label": e.title,
		children: [e.title && /* @__PURE__ */ (0, J.jsx)("title", { children: e.title }), /* @__PURE__ */ (0, J.jsx)("path", { d: "M12 2a5 5 0 0 1 5 5v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5Zm6 10H6v8h12v-8Zm-6-8a3 3 0 0 0-3 3v3h6V7a3 3 0 0 0-3-3Z" })]
	});
}
var se = {
	word: {
		label: "W",
		color: "#185abd"
	},
	excel: {
		label: "X",
		color: "#107c41"
	},
	powerpoint: {
		label: "P",
		color: "#c43e1c"
	},
	pdf: {
		label: "PDF",
		color: "#d51928"
	},
	text: {
		label: "TXT",
		color: "#656d77"
	}
};
function X({ office: e, category: t, size: n = 28 }) {
	let r = e ? se[e] : void 0;
	return /* @__PURE__ */ (0, J.jsxs)("svg", {
		viewBox: "0 0 32 32",
		width: n,
		height: n,
		"aria-hidden": "true",
		className: "fh-type-icon",
		children: [
			/* @__PURE__ */ (0, J.jsx)("path", {
				d: "M8 3h11l7 7v17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
				fill: "var(--cpd-color-bg-canvas-default, #fff)",
				stroke: "var(--cpd-color-border-interactive-primary, #8d97a5)",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ (0, J.jsx)("path", {
				d: "M19 3v7h7",
				fill: "none",
				stroke: "var(--cpd-color-border-interactive-primary, #8d97a5)",
				strokeWidth: "1.5"
			}),
			r ? /* @__PURE__ */ (0, J.jsxs)(J.Fragment, { children: [/* @__PURE__ */ (0, J.jsx)("rect", {
				x: "2",
				y: "15",
				width: r.label.length > 1 ? 20 : 14,
				height: "11",
				rx: "2",
				fill: r.color
			}), /* @__PURE__ */ (0, J.jsx)("text", {
				x: r.label.length > 1 ? 12 : 9,
				y: "23.5",
				textAnchor: "middle",
				fontSize: r.label.length > 1 ? 7 : 9,
				fontWeight: "700",
				fill: "#fff",
				fontFamily: "Inter, sans-serif",
				children: r.label
			})] }) : t === "image" ? /* @__PURE__ */ (0, J.jsx)("path", {
				d: "M10 24l4-5 3 3.5 2.5-3 3.5 4.5H10Zm3-9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z",
				fill: "var(--cpd-color-icon-secondary, #656d77)"
			}) : t === "video" ? /* @__PURE__ */ (0, J.jsx)("path", {
				d: "M13 15v9l7-4.5-7-4.5Z",
				fill: "var(--cpd-color-icon-secondary, #656d77)"
			}) : /* @__PURE__ */ (0, J.jsx)("path", {
				d: "M10 16h12v1.5H10V16Zm0 4h12v1.5H10V20Zm0 4h8v1.5h-8V24Z",
				fill: "var(--cpd-color-icon-secondary, #656d77)"
			})
		]
	});
}
// src/ui/CloudLinkCards.tsx
var ce = {
	word: "word",
	excel: "excel",
	powerpoint: "powerpoint",
	pdf: "pdf"
};
function le({ t: e, links: t }) {
	return /* @__PURE__ */ (0, J.jsx)("div", {
		className: "fh-cloud-cards",
		"data-testid": "fileshub-cloud-cards",
		children: t.map((t) => {
			let n = e(`${T}cloud_kind_${t.kind}`), r = e(`${T}cloud_${t.service}`);
			return /* @__PURE__ */ (0, J.jsxs)("a", {
				className: "fh-cloud-card",
				href: t.url,
				target: "_blank",
				rel: "noreferrer noopener",
				title: e(`${T}cloud_hint`),
				children: [/* @__PURE__ */ (0, J.jsx)(X, {
					office: ce[t.kind] ?? null,
					category: t.kind === "image" ? "image" : t.kind === "video" ? "video" : "document",
					size: 32
				}), /* @__PURE__ */ (0, J.jsxs)("span", {
					className: "fh-cloud-text",
					children: [/* @__PURE__ */ (0, J.jsx)("span", {
						className: "fh-cloud-title",
						children: t.name ?? n
					}), /* @__PURE__ */ (0, J.jsxs)("span", {
						className: "fh-cloud-sub",
						children: [
							t.name ? `${n} · ` : "",
							r,
							t.tenant ? ` (${t.tenant})` : ""
						]
					})]
				})]
			}, t.url);
		})
	});
}
// src/ui/Preview.tsx
var ue = {
	word: "Word",
	excel: "Excel",
	powerpoint: "PowerPoint"
};
function de({ t: e, item: t, maxMb: n, loadBytes: r }) {
	let i = typeof navigator < "u" && navigator.pdfViewerEnabled === !1, a = L(t), o = a === "pdf" && i ? null : a, s = t.size !== void 0 && t.size > n * 1024 * 1024, [c, l] = window.React.useState(!1), [u, d] = window.React.useState({ status: "idle" });
	window.React.useEffect(() => {
		l(!1);
	}, [t.eventId]), window.React.useEffect(() => {
		if (!o || s && !c) {
			d({ status: "idle" });
			return;
		}
		let n = new AbortController(), i;
		return d({ status: "loading" }), r(t, n.signal).then((r) => {
			if (n.signal.aborted) return;
			let a = o === "pdf" ? W(r) : new Blob([r], { type: I(t.mimetype) });
			a ? (i = URL.createObjectURL(a), d({
				status: "ready",
				url: i
			})) : d({
				status: "error",
				message: e(`${T}not_pdf`)
			});
		}).catch((t) => {
			n.signal.aborted || d({
				status: "error",
				message: e(`${T}preview_failed`, { error: t?.message ?? String(t) })
			});
		}), () => {
			n.abort(), i && URL.revokeObjectURL(i);
		};
	}, [
		t,
		o,
		s,
		c,
		r,
		e
	]);
	let f;
	if (o) f = s && !c ? /* @__PURE__ */ (0, J.jsxs)("div", {
		className: "fh-preview-placeholder",
		children: [
			/* @__PURE__ */ (0, J.jsx)(X, {
				office: t.office,
				category: t.category,
				size: 72
			}),
			/* @__PURE__ */ (0, J.jsx)("p", { children: e(`${T}too_large`, { max: n }) }),
			/* @__PURE__ */ (0, J.jsx)("button", {
				type: "button",
				className: "fh-button",
				onClick: () => l(!0),
				children: e(`${T}load_anyway`)
			})
		]
	}) : u.status === "ready" ? o === "image" ? /* @__PURE__ */ (0, J.jsx)("img", {
		className: "fh-preview-media",
		src: u.url,
		alt: t.name,
		"data-testid": "fileshub-preview-image"
	}) : o === "video" ? /* @__PURE__ */ (0, J.jsx)("video", {
		className: "fh-preview-media",
		src: u.url,
		controls: !0,
		"data-testid": "fileshub-preview-video"
	}) : /* @__PURE__ */ (0, J.jsx)("iframe", {
		className: "fh-preview-pdf",
		src: u.url,
		title: t.name,
		"data-testid": "fileshub-preview-pdf"
	}) : u.status === "error" ? /* @__PURE__ */ (0, J.jsx)("p", {
		className: "fh-preview-error",
		children: u.message
	}) : /* @__PURE__ */ (0, J.jsx)("p", {
		className: "fh-hint",
		children: e(`${T}loading_preview`)
	});
	else {
		let n = t.office ? ue[t.office] : void 0;
		f = /* @__PURE__ */ (0, J.jsxs)("div", {
			className: "fh-preview-placeholder",
			children: [/* @__PURE__ */ (0, J.jsx)(X, {
				office: t.office,
				category: t.category,
				size: 72
			}), /* @__PURE__ */ (0, J.jsx)("p", { children: n ? e(`${T}office_hint`, { app: n }) : e(a === "pdf" ? `${T}no_pdf_viewer` : `${T}no_preview`) })]
		});
	}
	return /* @__PURE__ */ (0, J.jsxs)("div", {
		className: "fh-preview-body",
		"data-testid": "fileshub-preview",
		children: [f, /* @__PURE__ */ (0, J.jsxs)("div", {
			className: "fh-preview-meta",
			children: [/* @__PURE__ */ (0, J.jsx)("span", {
				className: "fh-preview-name",
				children: t.name
			}), /* @__PURE__ */ (0, J.jsx)("span", {
				className: "fh-hint",
				children: [t.mimetype, m(t.size)].filter(Boolean).join(" · ")
			})]
		})]
	});
}
// src/ui/FilesView.tsx
var fe = [
	"all",
	"document",
	"image",
	"video",
	"other"
], pe = 400;
function Z(e) {
	let { t, index: n, variant: r } = e, i = window.React.useSyncExternalStore(window.React.useCallback((e) => n.subscribe(e), [n]), () => n.list()), [a, o] = window.React.useState("all"), [s, c] = window.React.useState(""), [l, u] = window.React.useState(e.initialRoomId ?? ""), [d, f] = window.React.useState(""), [p, g] = window.React.useState(""), [_, v] = window.React.useState("date"), [y, b] = window.React.useState(null), [x, S] = window.React.useState(null), [C, w] = window.React.useState(null), { spaces: E, roomsInSpace: D, rooms: O, senderName: k, ready: A } = e, [j, M] = window.React.useState(A);
	window.React.useEffect(() => {
		if (j) return;
		let e = setInterval(() => A() && M(!0), 1e3);
		return () => clearInterval(e);
	}, [j, A]);
	let N = window.React.useMemo(() => j ? E() : [], [E, j]), P = window.React.useMemo(() => s ? [...D(s)].sort().join("\n") : "", [D, s]), F = window.React.useMemo(() => s ? new Set(P.split("\n").filter(Boolean)) : void 0, [s, P]), I = window.React.useMemo(() => O().filter((e) => !F || F.has(e.roomId) || e.roomId === l).sort((e, t) => e.name.localeCompare(t.name)), [
		O,
		F,
		l,
		j
	]), L = window.React.useMemo(() => l ? /* @__PURE__ */ new Set([l]) : F, [l, F]), R = j ? n.scannableRooms(L).join("\n") : "", z = window.React.useMemo(() => R.split("\n").filter(Boolean), [R]);
	window.React.useEffect(() => {
		n.scan(z);
	}, [n, z]), window.React.useEffect(() => () => n.cancel(), [n]);
	let B = window.React.useMemo(() => h(i, {
		roomIds: L,
		category: a
	}), [
		i,
		L,
		a
	]), V = window.React.useMemo(() => {
		let e = /* @__PURE__ */ new Map();
		for (let t of B) e.has(t.sender) || e.set(t.sender, k(t.roomId, t.sender));
		return [...e].sort((e, t) => e[1].localeCompare(t[1]));
	}, [B, k]), H = window.React.useMemo(() => h(B, {
		sender: d || void 0,
		query: p
	}, _), [
		B,
		d,
		p,
		_
	]), U = n.progress(z);
	window.React.useEffect(() => {
		y && !H.some((e) => e.eventId === y.eventId) && b(null);
	}, [H, y]);
	let W = async (n) => {
		S(n.eventId), w(null);
		try {
			await e.download(n);
		} catch (e) {
			w(t(`${T}download_failed`, { error: e?.message ?? String(e) }));
		} finally {
			S(null);
		}
	}, G = (t) => {
		e.open(t), e.onClose?.();
	}, K = (e, n) => /* @__PURE__ */ (0, J.jsxs)("button", {
		type: "button",
		className: "fh-sort",
		"aria-pressed": _ === e,
		title: t(`${T}sort_by`, { column: n }),
		onClick: () => v(e),
		children: [n, _ === e && /* @__PURE__ */ (0, J.jsx)("span", {
			"aria-hidden": "true",
			children: " ▾"
		})]
	});
	return /* @__PURE__ */ (0, J.jsxs)("div", {
		className: `fh-view fh-view--${r}`,
		"data-testid": "fileshub-view",
		children: [
			r === "page" && /* @__PURE__ */ (0, J.jsx)("h2", {
				className: "fh-page-title",
				children: t("datanauten_fileshub_title")
			}),
			/* @__PURE__ */ (0, J.jsxs)("div", {
				className: "fh-toolbar",
				children: [/* @__PURE__ */ (0, J.jsx)("input", {
					type: "search",
					className: "fh-input fh-search",
					placeholder: t(`${T}search`),
					"aria-label": t(`${T}search`),
					value: p,
					onChange: (e) => g(e.target.value),
					"data-testid": "fileshub-search"
				}), /* @__PURE__ */ (0, J.jsx)("div", {
					className: "fh-chips",
					role: "radiogroup",
					"aria-label": t(`${T}filter_type`),
					children: fe.map((e) => /* @__PURE__ */ (0, J.jsx)("button", {
						type: "button",
						role: "radio",
						"aria-checked": a === e,
						className: "fh-chip",
						onClick: () => o(e),
						"data-testid": `fileshub-type-${e}`,
						children: t(`${T}type_${e}`)
					}, e))
				})]
			}),
			/* @__PURE__ */ (0, J.jsxs)("div", {
				className: "fh-toolbar",
				children: [
					N.length > 0 && /* @__PURE__ */ (0, J.jsxs)("select", {
						className: "fh-input fh-select",
						"aria-label": t("datanauten_fileshub_filter_space"),
						value: s,
						onChange: (e) => {
							c(e.target.value), u("");
						},
						"data-testid": "fileshub-space",
						children: [/* @__PURE__ */ (0, J.jsx)("option", {
							value: "",
							children: t("datanauten_fileshub_all_spaces")
						}), N.map((e) => /* @__PURE__ */ (0, J.jsx)("option", {
							value: e.roomId,
							children: e.name
						}, e.roomId))]
					}),
					/* @__PURE__ */ (0, J.jsxs)("select", {
						className: "fh-input fh-select",
						"aria-label": t(`${T}filter_room`),
						value: l,
						onChange: (e) => u(e.target.value),
						"data-testid": "fileshub-room",
						children: [/* @__PURE__ */ (0, J.jsx)("option", {
							value: "",
							children: t(`${T}all_rooms`)
						}), I.map((e) => /* @__PURE__ */ (0, J.jsx)("option", {
							value: e.roomId,
							children: e.name
						}, e.roomId))]
					}),
					/* @__PURE__ */ (0, J.jsxs)("select", {
						className: "fh-input fh-select",
						"aria-label": t(`${T}filter_person`),
						value: d,
						onChange: (e) => f(e.target.value),
						"data-testid": "fileshub-person",
						children: [/* @__PURE__ */ (0, J.jsx)("option", {
							value: "",
							children: t(`${T}anyone`)
						}), V.map(([e, t]) => /* @__PURE__ */ (0, J.jsx)("option", {
							value: e,
							children: t
						}, e))]
					})
				]
			}),
			/* @__PURE__ */ (0, J.jsxs)("div", {
				className: "fh-status",
				role: "status",
				"data-testid": "fileshub-status",
				children: [
					U.running ? /* @__PURE__ */ (0, J.jsxs)(J.Fragment, { children: [
						/* @__PURE__ */ (0, J.jsx)("span", {
							className: "fh-spinner",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, J.jsx)("span", { children: t(`${T}scanning`, {
							done: U.roomsDone,
							total: U.rooms
						}) }),
						/* @__PURE__ */ (0, J.jsx)("button", {
							type: "button",
							className: "fh-link",
							onClick: () => n.cancel(),
							children: t(`${T}stop`)
						})
					] }) : U.roomsDone < U.rooms ? /* @__PURE__ */ (0, J.jsx)("span", { children: t(`${T}stopped`, {
						done: U.roomsDone,
						total: U.rooms
					}) }) : /* @__PURE__ */ (0, J.jsxs)(J.Fragment, { children: [/* @__PURE__ */ (0, J.jsxs)("span", { children: [
						t(`${T}count`, { count: H.length }),
						" · ",
						t(`${T}since`, { date: e.formatDate(U.sinceTs) })
					] }), U.roomsWithMore > 0 && /* @__PURE__ */ (0, J.jsxs)(J.Fragment, { children: [/* @__PURE__ */ (0, J.jsx)("span", { children: t("datanauten_fileshub_more_history", { count: U.roomsWithMore }) }), /* @__PURE__ */ (0, J.jsx)("button", {
						type: "button",
						className: "fh-link",
						onClick: () => void n.searchOlder(z),
						"data-testid": "fileshub-older",
						children: t("datanauten_fileshub_search_older")
					})] })] }),
					U.errors > 0 && !U.running && /* @__PURE__ */ (0, J.jsx)("span", {
						className: "fh-warn",
						children: t("datanauten_fileshub_errors", { count: U.errors })
					}),
					U.undecryptable > 0 && /* @__PURE__ */ (0, J.jsx)("span", {
						className: "fh-warn",
						children: t("datanauten_fileshub_undecryptable", { count: U.undecryptable })
					}),
					C && /* @__PURE__ */ (0, J.jsx)("span", {
						className: "fh-warn",
						children: C
					})
				]
			}),
			/* @__PURE__ */ (0, J.jsxs)("div", {
				className: `fh-body ${y ? "fh-body--split" : ""}`,
				children: [/* @__PURE__ */ (0, J.jsx)("div", {
					className: "fh-table-wrap",
					children: H.length === 0 ? /* @__PURE__ */ (0, J.jsx)("p", {
						className: "fh-empty",
						children: i.length === 0 && !U.running ? t(`${T}empty`) : U.running ? "" : t(`${T}empty_filtered`)
					}) : /* @__PURE__ */ (0, J.jsxs)("table", {
						className: "fh-table",
						"data-testid": "fileshub-table",
						children: [/* @__PURE__ */ (0, J.jsx)("thead", { children: /* @__PURE__ */ (0, J.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, J.jsx)("th", {
								className: "fh-col-name",
								children: K("name", t(`${T}col_name`))
							}),
							/* @__PURE__ */ (0, J.jsx)("th", { children: t(`${T}col_shared_by`) }),
							!l && /* @__PURE__ */ (0, J.jsx)("th", { children: t("datanauten_fileshub_col_room") }),
							/* @__PURE__ */ (0, J.jsx)("th", { children: K("date", t(`${T}col_date`)) }),
							/* @__PURE__ */ (0, J.jsx)("th", {
								className: "fh-col-size",
								children: K("size", t(`${T}col_size`))
							}),
							/* @__PURE__ */ (0, J.jsx)("th", { "aria-label": t(`${T}download`) })
						] }) }), /* @__PURE__ */ (0, J.jsx)("tbody", { children: H.slice(0, pe).map((n) => /* @__PURE__ */ (0, J.jsxs)("tr", {
							className: y?.eventId === n.eventId ? "fh-row fh-row--selected" : "fh-row",
							onClick: () => b(n),
							"data-testid": "fileshub-row",
							children: [
								/* @__PURE__ */ (0, J.jsx)("td", {
									className: "fh-col-name",
									children: /* @__PURE__ */ (0, J.jsxs)("button", {
										type: "button",
										className: "fh-name",
										onClick: (e) => {
											e.stopPropagation(), b(n);
										},
										title: n.name,
										children: [
											/* @__PURE__ */ (0, J.jsx)(X, {
												office: n.office,
												category: n.category
											}),
											/* @__PURE__ */ (0, J.jsx)("span", {
												className: "fh-name-text",
												children: n.name
											}),
											n.file && /* @__PURE__ */ (0, J.jsx)(oe, { title: t("datanauten_fileshub_encrypted") })
										]
									})
								}),
								/* @__PURE__ */ (0, J.jsx)("td", {
									className: "fh-cell-muted",
									children: e.senderName(n.roomId, n.sender)
								}),
								!l && /* @__PURE__ */ (0, J.jsx)("td", {
									className: "fh-cell-muted fh-cell-room",
									children: e.roomName(n.roomId)
								}),
								/* @__PURE__ */ (0, J.jsx)("td", {
									className: "fh-cell-muted fh-nowrap",
									children: e.formatDate(n.ts)
								}),
								/* @__PURE__ */ (0, J.jsx)("td", {
									className: "fh-cell-muted fh-nowrap fh-col-size",
									children: m(n.size)
								}),
								/* @__PURE__ */ (0, J.jsx)("td", { children: /* @__PURE__ */ (0, J.jsx)("button", {
									type: "button",
									className: "fh-icon-button",
									"aria-label": `${t(`${T}download`)}: ${n.name}`,
									title: t(`${T}download`),
									disabled: x === n.eventId,
									onClick: (e) => {
										e.stopPropagation(), W(n);
									},
									children: /* @__PURE__ */ (0, J.jsx)(ae, {})
								}) })
							]
						}, n.eventId)) })]
					})
				}), y && /* @__PURE__ */ (0, J.jsxs)("aside", {
					className: "fh-preview",
					"aria-label": t("datanauten_fileshub_preview"),
					children: [
						/* @__PURE__ */ (0, J.jsxs)("div", {
							className: "fh-preview-actions",
							children: [
								/* @__PURE__ */ (0, J.jsx)("button", {
									type: "button",
									className: "fh-button fh-button--primary",
									onClick: () => G(y),
									"data-testid": "fileshub-open",
									children: t("datanauten_fileshub_open")
								}),
								/* @__PURE__ */ (0, J.jsx)("button", {
									type: "button",
									className: "fh-button",
									disabled: x === y.eventId,
									onClick: () => void W(y),
									"data-testid": "fileshub-download",
									children: t("datanauten_fileshub_download")
								}),
								/* @__PURE__ */ (0, J.jsx)("button", {
									type: "button",
									className: "fh-icon-button fh-close",
									"aria-label": t("datanauten_fileshub_close_preview"),
									title: t("datanauten_fileshub_close_preview"),
									onClick: () => b(null),
									children: "×"
								})
							]
						}),
						/* @__PURE__ */ (0, J.jsxs)("div", {
							className: "fh-hint",
							children: [
								e.senderName(y.roomId, y.sender),
								" · ",
								e.roomName(y.roomId),
								y.threadId ? ` · ${t("datanauten_fileshub_in_thread")}` : "",
								" · ",
								e.formatDate(y.ts)
							]
						}),
						/* @__PURE__ */ (0, J.jsx)(de, {
							t,
							item: y,
							maxMb: e.previewMaxMb,
							loadBytes: e.loadBytes
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, J.jsxs)("p", {
				className: "fh-footnote",
				children: ["🔒 ", t(`${T}privacy`)]
			})
		]
	});
}
// src/ui/styles.css?inline
var me = ".fh-view{min-height:0;color:var(--cpd-color-text-primary,#1b1d22);flex-direction:column;gap:10px;font-size:14px;display:flex}.fh-view--dialog{width:min(1040px,100vw - 140px);height:min(680px,72vh)}.mx_Dialog_fixedWidth:has(>.fh-view--dialog){width:auto;max-width:none}.fh-view--page{box-sizing:border-box;background:var(--cpd-color-bg-canvas-default,#fff);width:100%;height:100%;padding:20px 24px 12px;overflow:hidden}.fh-page-title{margin:0 0 4px;font-size:22px;font-weight:600}.fh-toolbar{flex-wrap:wrap;align-items:center;gap:8px;display:flex}.fh-input{box-sizing:border-box;border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);height:36px;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;border-radius:8px;padding:0 12px}.fh-search{flex:240px;min-width:180px}.fh-select{flex:0 220px;min-width:140px;padding-right:4px}.fh-chips{flex-wrap:wrap;gap:6px;display:flex}.fh-chip{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);height:32px;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;background:0 0;border-radius:16px;padding:0 12px}.fh-chip:hover{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}.fh-chip[aria-checked=true]{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);border-color:#0000;font-weight:600}.fh-status{min-height:20px;color:var(--cpd-color-text-secondary,#656d77);flex-wrap:wrap;align-items:center;gap:4px 10px;font-size:13px;display:flex}.fh-warn{color:var(--cpd-color-text-critical-primary,#d51928)}.fh-spinner{border:2px solid var(--cpd-color-border-interactive-secondary,#cdd3da);border-top-color:var(--cpd-color-icon-accent-primary,#0467dd);border-radius:50%;width:12px;height:12px;animation:.9s linear infinite fh-spin}@keyframes fh-spin{to{transform:rotate(360deg)}}.fh-link{color:var(--cpd-color-text-action-accent,#0467dd);font:inherit;cursor:pointer;background:0 0;border:0;padding:0;text-decoration:underline}.fh-body{flex:1;grid-template-columns:minmax(0,1fr);gap:12px;min-height:0;display:grid}.fh-body--split{grid-template-columns:minmax(0,1.5fr) minmax(260px,1fr)}.fh-table-wrap{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);border-radius:10px;min-height:0;overflow:auto}.fh-table{border-collapse:collapse;width:100%}.fh-table th{z-index:1;border-bottom:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);color:var(--cpd-color-text-secondary,#656d77);text-align:left;white-space:nowrap;padding:8px 10px;font-size:12px;font-weight:600;position:sticky;top:0}.fh-table td{border-bottom:1px solid var(--cpd-color-gray-300,#ebeef2);vertical-align:middle;padding:4px 10px}.fh-row{cursor:pointer}.fh-row:hover{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}.fh-row--selected,.fh-row--selected:hover{background:var(--cpd-color-bg-info-subtle,#ecf4ff)}.fh-col-name{width:40%;max-width:0}.fh-col-size{text-align:right}.fh-sort{color:inherit;font:inherit;cursor:pointer;background:0 0;border:0;padding:0}.fh-sort[aria-pressed=true]{color:var(--cpd-color-text-primary,#1b1d22)}.fh-name{width:100%;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;align-items:center;gap:8px;padding:2px 0;font-weight:500;display:flex}.fh-name>svg:last-child:not(.fh-type-icon){color:var(--cpd-color-icon-secondary,#656d77);flex:none}.fh-name-text{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.fh-type-icon{flex:none}.fh-cell-muted{color:var(--cpd-color-text-secondary,#656d77);font-size:13px}.fh-cell-room{text-overflow:ellipsis;white-space:nowrap;max-width:180px;overflow:hidden}.fh-nowrap{white-space:nowrap}.fh-icon-button{width:32px;height:32px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:0;border-radius:50%;place-items:center;padding:0;font-size:20px;display:inline-grid}.fh-icon-button:hover{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);color:var(--cpd-color-icon-primary,#1b1d22)}.fh-icon-button:disabled{opacity:.5;cursor:progress}.fh-empty{color:var(--cpd-color-text-secondary,#656d77);text-align:center;margin:24px}.fh-preview{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);border-radius:10px;flex-direction:column;gap:8px;min-height:0;padding:10px;display:flex}.fh-preview-actions{align-items:center;gap:8px;display:flex}.fh-close{margin-left:auto}.fh-preview-body{flex-direction:column;flex:1;gap:8px;min-height:0;display:flex}.fh-preview-media{object-fit:contain;background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);border-radius:6px;flex:1;max-width:100%;min-height:0}.fh-preview-pdf{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);border:0;border-radius:6px;flex:1;width:100%;min-height:240px}.fh-preview-placeholder{color:var(--cpd-color-text-secondary,#656d77);text-align:center;flex-direction:column;flex:1;justify-content:center;align-items:center;gap:12px;padding:16px;display:flex}.fh-preview-placeholder p{margin:0}.fh-preview-meta{flex-direction:column;gap:2px;display:flex}.fh-preview-name{word-break:break-word;font-weight:600}.fh-preview-error{color:var(--cpd-color-text-critical-primary,#d51928)}.fh-hint{color:var(--cpd-color-text-secondary,#656d77);font-size:13px}.fh-button{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);height:32px;color:var(--cpd-color-text-primary,#1b1d22);font:inherit;cursor:pointer;background:0 0;border-radius:16px;padding:0 14px;font-weight:600}.fh-button--primary{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);border-color:#0000}.fh-button:disabled{opacity:.5;cursor:progress}.fh-footnote{color:var(--cpd-color-text-secondary,#656d77);margin:0;font-size:12px}:is(.fh-chip,.fh-button,.fh-icon-button,.fh-link,.fh-name,.fh-sort,.fh-header-button,.fh-cloud-card):focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}.fh-header-button{width:32px;height:32px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:0;border-radius:50%;place-items:center;padding:0;display:inline-grid}.fh-header-button:hover{background:var(--cpd-color-bg-subtle-primary,#e1e6ec);color:var(--cpd-color-icon-primary,#1b1d22)}.fh-header-button svg{width:20px;height:20px}.fh-space-item svg{width:20px;height:20px;color:var(--cpd-color-icon-secondary,#656d77)}.fh-cloud-cards{flex-wrap:wrap;gap:8px;margin-top:6px;display:flex}.fh-cloud-card{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);background:var(--cpd-color-bg-canvas-default,#fff);max-width:360px;color:var(--cpd-color-text-primary,#1b1d22);border-radius:10px;align-items:center;gap:10px;padding:8px 12px;text-decoration:none;display:flex}.fh-cloud-card:hover{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);text-decoration:none}.fh-cloud-text{flex-direction:column;min-width:0;display:flex}.fh-cloud-title{text-overflow:ellipsis;white-space:nowrap;font-weight:600;overflow:hidden}.fh-cloud-sub{color:var(--cpd-color-text-secondary,#656d77);font-size:12px}@media (width<=720px){.fh-body--split{grid-template-rows:minmax(0,1fr) minmax(0,1fr);grid-template-columns:minmax(0,1fr)}}", Q = "de-datanauten-files-hub-style", $ = "files-hub", he = "de.datanauten.files_hub", ge = class {
	api;
	static moduleApiVersion = "^2.0.0";
	config;
	index;
	viewProps;
	constructor(e) {
		this.api = e;
	}
	async load() {
		try {
			this.config = w(this.api.config.get(C));
		} catch (e) {
			throw console.error(`[files-hub] Invalid "${C}" config`, e), Error("Errors in module configuration for the Files hub module");
		}
		this.api.i18n.register(E), ye(), this.index = new b(t, this.config), this.viewProps = this.makeViewProps(), this.api.extras.addRoomHeaderButtonCallback((e) => /* @__PURE__ */ (0, J.jsx)("button", {
			type: "button",
			className: "fh-header-button",
			"data-testid": "fileshub-header-button",
			"aria-label": this.t(`${T}button`),
			title: this.t(`${T}button`),
			onClick: () => this.openDialog(e),
			children: /* @__PURE__ */ (0, J.jsx)(Y, {})
		}, "files-hub")), this.registerPage(), this.config.cloud_link_cards && re(this.api.customComponents, {
			id: "files-hub/cloud-links",
			filter: (e) => e.type === "m.room.message" && typeof e.content.body == "string" && P(e.content.body) && N(e.content.body).length > 0,
			render: (e, t) => /* @__PURE__ */ (0, J.jsxs)("div", {
				className: "fh-cloud-wrap",
				children: [t(), /* @__PURE__ */ (0, J.jsx)(le, {
					t: this.t,
					links: N(String(e.mxEvent.content.body))
				})]
			})
		});
	}
	registerPage() {
		let e = this.api.extras, t = this.api.navigation;
		e.setSpacePanelItem && t?.registerLocationRenderer && (t.registerLocationRenderer($, () => /* @__PURE__ */ (0, J.jsx)(Z, {
			...this.viewProps,
			variant: "page"
		})), e.setSpacePanelItem(he, {
			label: this.t(`${T}title`),
			tooltip: this.t(`${T}title`),
			className: "fh-space-item",
			icon: /* @__PURE__ */ (0, J.jsx)(Y, {}),
			onSelected: () => {
				window.location.hash = `#/${$}`;
			}
		}));
	}
	openDialog(e) {
		t() && this.api.openDialog({ title: this.t(`${T}title`) }, _e, {
			...this.viewProps,
			initialRoomId: e
		});
	}
	makeViewProps() {
		let e = () => t();
		return {
			t: this.t,
			index: this.index,
			previewMaxMb: this.config.preview_max_mb,
			spaces: () => {
				let t = e();
				return t ? K(t) : [];
			},
			roomsInSpace: (t) => {
				let n = e();
				return n ? ee(n, t) : /* @__PURE__ */ new Set();
			},
			rooms: () => (e()?.getRooms() ?? []).filter((e) => r(e) && !i(e)).map((e) => ({
				roomId: e.roomId,
				name: e.name
			})),
			roomName: (t) => e()?.getRoom(t)?.name ?? t,
			senderName: (t, n) => e()?.getRoom(t)?.getMember(n)?.name ?? n,
			formatDate: ve,
			ready: () => {
				let t = e();
				return !!t && (t.isInitialSyncComplete?.() ?? !0);
			},
			open: (e) => n(e.roomId, e.eventId),
			loadBytes: (t, n) => {
				let r = e();
				return r ? U(r, t, n) : Promise.reject(/* @__PURE__ */ Error("Not logged in"));
			},
			download: async (t) => {
				let n = e();
				if (!n) throw Error("Not logged in");
				G(await U(n, t), t.name, t.mimetype);
			}
		};
	}
	t = (e, t) => this.api.i18n.translate(e, t);
};
function _e(e) {
	return /* @__PURE__ */ (0, J.jsx)(Z, {
		...e,
		variant: "dialog",
		onClose: e.onCancel
	});
}
function ve(e) {
	let t = new Date(e), n = t.getFullYear() === (/* @__PURE__ */ new Date()).getFullYear();
	return t.toLocaleDateString(void 0, {
		day: "numeric",
		month: "short",
		...n ? {} : { year: "numeric" }
	});
}
function ye() {
	if (document.getElementById(Q)) return;
	let e = document.createElement("style");
	e.id = Q, e.textContent = me, document.head.appendChild(e);
}
export { ge as FilesHubModule, ge as default, $ as PAGE_PATH };

//# sourceMappingURL=index.js.map