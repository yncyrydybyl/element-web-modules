// \0rolldown/runtime.js
var e = (e, t) => () => (t || (e((t = { exports: {} }).exports, t, t.exports), e = null), t.exports), t = "digits", n = /* @__PURE__ */ new Set([
	"Control",
	"Alt",
	"AltGraph",
	"Shift",
	"Meta",
	"OS",
	"Hyper",
	"Super",
	"CapsLock"
]);
function r(e, t, n) {
	if (!e.key) return !1;
	if (t.key === "digits") {
		if (!/^[0-9]$/.test(e.key)) return !1;
	} else if (e.key.toLowerCase() !== t.key.toLowerCase()) return !1;
	let r = t.ctrlKey ?? !1, i = t.altKey ?? !1, a = t.shiftKey ?? !1, o = t.metaKey ?? !1, s = e.ctrlKey ?? !1, c = e.altKey ?? !1, l = e.shiftKey ?? !1, u = e.metaKey ?? !1;
	return t.ctrlOrCmdKey ? n ? u && s === r && c === i && l === a : s && u === o && c === i && l === a : u === o && s === r && c === i && l === a;
}
function i(e, t) {
	return {
		key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
		ctrlKey: !!(e.ctrlKey || e.ctrlOrCmdKey && !t),
		metaKey: !!(e.metaKey || e.ctrlOrCmdKey && t),
		altKey: !!e.altKey,
		shiftKey: !!e.shiftKey
	};
}
function a(e, t, n) {
	let r = i(e, n), a = i(t, n);
	return r.key === a.key && r.ctrlKey === a.ctrlKey && r.metaKey === a.metaKey && r.altKey === a.altKey && r.shiftKey === a.shiftKey;
}
function o(e) {
	return !!(e.ctrlOrCmdKey || e.ctrlKey || e.metaKey || e.altKey);
}
function s(e, t) {
	if (!e.key || n.has(e.key) || e.key === "Dead" || e.key === "Unidentified") return null;
	let r = { key: e.key.length === 1 ? e.key.toLowerCase() : e.key };
	return (t ? e.metaKey : e.ctrlKey) && (r.ctrlOrCmdKey = !0), t && e.ctrlKey && (r.ctrlKey = !0), !t && e.metaKey && (r.metaKey = !0), e.altKey && (r.altKey = !0), e.shiftKey && (r.shiftKey = !0), r;
}
var c = {
	esc: "Escape",
	escape: "Escape",
	enter: "Enter",
	return: "Enter",
	space: " ",
	tab: "Tab",
	up: "ArrowUp",
	down: "ArrowDown",
	left: "ArrowLeft",
	right: "ArrowRight",
	pageup: "PageUp",
	pagedown: "PageDown",
	home: "Home",
	end: "End",
	backspace: "Backspace",
	delete: "Delete",
	del: "Delete",
	plus: "+"
};
function l(e) {
	let t = e.trim();
	if (!t) throw Error("Empty key combo");
	let n = t === "+" ? ["+"] : t.endsWith("++") ? [...t.slice(0, -2).split("+"), "+"] : t.split("+"), r = n.pop().trim(), i = { key: "" };
	for (let t of n) {
		let n = t.trim().toLowerCase();
		if (n === "mod" || n === "ctrlorcmd" || n === "cmdorctrl") i.ctrlOrCmdKey = !0;
		else if (n === "ctrl" || n === "control") i.ctrlKey = !0;
		else if (n === "cmd" || n === "meta" || n === "super" || n === "win") i.metaKey = !0;
		else if (n === "alt" || n === "option" || n === "opt") i.altKey = !0;
		else if (n === "shift") i.shiftKey = !0;
		else throw Error(`Unknown modifier "${t}" in key combo "${e}"`);
	}
	if (!r) throw Error(`Missing key in key combo "${e}"`);
	return i.key = c[r.toLowerCase()] ?? (r.length === 1 ? r.toLowerCase() : r), i;
}
function u(e) {
	let t = [];
	return e.ctrlOrCmdKey && t.push("Mod"), e.ctrlKey && t.push("Ctrl"), e.metaKey && t.push("Meta"), e.altKey && t.push("Alt"), e.shiftKey && t.push("Shift"), t.push(e.key === " " ? "Space" : e.key === "+" ? "Plus" : e.key.length === 1 ? e.key.toUpperCase() : e.key), t.join("+");
}
var d = {
	ArrowUp: "↑",
	ArrowDown: "↓",
	ArrowLeft: "←",
	ArrowRight: "→"
}, f = {
	PageUp: ["keyboard|page_up", "Page Up"],
	PageDown: ["keyboard|page_down", "Page Down"],
	Escape: ["keyboard|escape", "Esc"],
	Enter: ["keyboard|enter", "Enter"],
	" ": ["keyboard|space", "Space"],
	Home: ["keyboard|home", "Home"],
	End: ["keyboard|end", "End"],
	Backspace: ["keyboard|backspace", "Backspace"],
	[t]: ["keyboard|number", "[number]"]
};
function p(e, t) {
	if (d[e]) return d[e];
	let n = f[e];
	return n ? t(n[0], n[1]) : e.length === 1 ? e.toUpperCase() : e;
}
function ee(e, t, n) {
	let r = [], i = n("keyboard|control", "Ctrl"), a = t ? "⌥" : n("keyboard|alt", "Alt"), o = t ? "⇧" : n("keyboard|shift", "Shift");
	return e.ctrlOrCmdKey && r.push(t ? "⌘" : i), e.ctrlKey && r.push(t ? "⌃" : i), e.metaKey && r.push(t ? "⌘" : "Meta"), e.altKey && r.push(a), e.shiftKey && r.push(o), r.push(p(e.key, n)), r;
}
function m(e, t) {
	let n = i(e, t);
	return {
		key: e.key.length === 1 && n.shiftKey ? e.key.toUpperCase() : e.key,
		ctrlKey: n.ctrlKey,
		metaKey: n.metaKey,
		altKey: n.altKey,
		shiftKey: n.shiftKey,
		bubbles: !0,
		cancelable: !0,
		composed: !0
	};
}
// src/catalog.ts
var h = [
	{
		id: "navigation",
		labelKey: "keyboard|category_navigation",
		fallback: "Navigation"
	},
	{
		id: "room",
		labelKey: "common|room",
		fallback: "Room"
	},
	{
		id: "composer",
		labelKey: "settings|preferences|composer_heading",
		fallback: "Composer"
	},
	{
		id: "room_list",
		labelKey: "keyboard|category_room_list",
		fallback: "Room List"
	},
	{
		id: "calls",
		labelKey: "keyboard|category_calls",
		fallback: "Calls"
	},
	{
		id: "autocomplete",
		labelKey: "keyboard|category_autocomplete",
		fallback: "Autocomplete"
	},
	{
		id: "accessibility",
		labelKey: "common|accessibility",
		fallback: "Accessibility"
	},
	{
		id: "labs",
		labelKey: "common|labs",
		fallback: "Labs"
	},
	{
		id: "custom",
		labelKey: "datanauten_keyboard_shortcuts_category_custom",
		fallback: "More"
	}
], g = (e) => e.isElectron, _ = [
	{
		id: "de.datanauten.keyboard_shortcuts.show",
		category: "navigation",
		labelKey: "datanauten_keyboard_shortcuts_show_shortcuts",
		fallback: "Show keyboard shortcuts",
		combo: {
			key: "?",
			shiftKey: !0
		}
	},
	{
		id: "KeyBinding.toggleTopLeftMenu",
		category: "navigation",
		labelKey: "keyboard|toggle_top_left_menu",
		fallback: "Toggle the top left menu",
		combo: {
			ctrlOrCmdKey: !0,
			key: "`"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.toggleRightPanel",
		category: "navigation",
		labelKey: "keyboard|toggle_right_panel",
		fallback: "Toggle right panel",
		combo: {
			ctrlOrCmdKey: !0,
			key: "."
		},
		remappable: !0
	},
	{
		id: "KeyBinding.toggleSpacePanel",
		category: "navigation",
		labelKey: "keyboard|toggle_space_panel",
		fallback: "Toggle space panel",
		combo: {
			ctrlOrCmdKey: !0,
			shiftKey: !0,
			key: "d"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.showKeyBindingsSettings",
		category: "navigation",
		labelKey: "datanauten_keyboard_shortcuts_open_keyboard_settings",
		fallback: "Open keyboard settings",
		combo: {
			ctrlOrCmdKey: !0,
			key: "/"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.goToHomeView",
		category: "navigation",
		labelKey: "keyboard|go_home_view",
		fallback: "Go to Home View",
		combo: (e) => ({
			ctrlKey: !0,
			altKey: !e.isMac,
			shiftKey: e.isMac,
			key: "h"
		}),
		remappable: !0
	},
	{
		id: "KeyBinding.filterRooms",
		category: "navigation",
		labelKey: "keyboard|jump_room_search",
		fallback: "Jump to room search",
		combo: {
			ctrlOrCmdKey: !0,
			key: "k"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.nextUnreadRoom",
		category: "navigation",
		labelKey: "keyboard|next_unread_room",
		fallback: "Next unread room or DM",
		combo: {
			shiftKey: !0,
			altKey: !0,
			key: "ArrowDown"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.previousUnreadRoom",
		category: "navigation",
		labelKey: "keyboard|prev_unread_room",
		fallback: "Previous unread room or DM",
		combo: {
			shiftKey: !0,
			altKey: !0,
			key: "ArrowUp"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.nextRoom",
		category: "navigation",
		labelKey: "keyboard|next_room",
		fallback: "Next room or DM",
		combo: {
			altKey: !0,
			key: "ArrowDown"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.previousRoom",
		category: "navigation",
		labelKey: "keyboard|prev_room",
		fallback: "Previous room or DM",
		combo: {
			altKey: !0,
			key: "ArrowUp"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.openUserSettings",
		category: "navigation",
		labelKey: "keyboard|open_user_settings",
		fallback: "Open user settings",
		combo: {
			metaKey: !0,
			key: ","
		},
		remappable: !0,
		when: (e) => e.isElectron && e.isMac
	},
	{
		id: "KeyBinding.switchToSpaceByNumber",
		category: "navigation",
		labelKey: "keyboard|switch_to_space",
		fallback: "Switch to space by number",
		combo: {
			ctrlOrCmdKey: !0,
			key: t
		},
		when: g
	},
	{
		id: "KeyBinding.PreviousVisitedRoomOrSpace",
		category: "navigation",
		labelKey: "keyboard|navigate_prev_history",
		fallback: "Previous recently visited room or space",
		combo: (e) => ({
			metaKey: e.isMac,
			altKey: !e.isMac,
			key: e.isMac ? "[" : "ArrowLeft"
		}),
		remappable: !0,
		when: g
	},
	{
		id: "KeyBinding.NextVisitedRoomOrSpace",
		category: "navigation",
		labelKey: "keyboard|navigate_next_history",
		fallback: "Next recently visited room or space",
		combo: (e) => ({
			metaKey: e.isMac,
			altKey: !e.isMac,
			key: e.isMac ? "]" : "ArrowRight"
		}),
		remappable: !0,
		when: g
	},
	{
		id: "KeyBinding.nextLandmark",
		category: "navigation",
		labelKey: "keyboard|next_landmark",
		fallback: "Go to next landmark",
		combo: (e) => ({
			ctrlOrCmdKey: !e.isElectron,
			key: "F6"
		}),
		remappable: !0
	},
	{
		id: "KeyBinding.previousLandmark",
		category: "navigation",
		labelKey: "keyboard|prev_landmark",
		fallback: "Go to previous landmark",
		combo: (e) => ({
			ctrlOrCmdKey: !e.isElectron,
			shiftKey: !0,
			key: "F6"
		}),
		remappable: !0
	},
	{
		id: "KeyBinding.searchInRoom",
		category: "room",
		labelKey: "keyboard|search",
		fallback: "Search (must be enabled)",
		combo: {
			ctrlOrCmdKey: !0,
			key: "f"
		}
	},
	{
		id: "KeyBinding.uploadFileToRoom",
		category: "room",
		labelKey: "keyboard|upload_file",
		fallback: "Upload a file",
		combo: {
			ctrlOrCmdKey: !0,
			shiftKey: !0,
			key: "u"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.dismissReadMarkerAndJumpToBottom",
		category: "room",
		labelKey: "keyboard|dismiss_read_marker_and_jump_bottom",
		fallback: "Dismiss read marker and jump to bottom",
		combo: { key: "Escape" }
	},
	{
		id: "KeyBinding.jumpToOldestUnreadMessage",
		category: "room",
		labelKey: "keyboard|jump_to_read_marker",
		fallback: "Jump to oldest unread message",
		combo: {
			shiftKey: !0,
			key: "PageUp"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.scrollUpInTimeline",
		category: "room",
		labelKey: "keyboard|scroll_up_timeline",
		fallback: "Scroll up in the timeline",
		combo: { key: "PageUp" }
	},
	{
		id: "KeyBinding.scrollDownInTimeline",
		category: "room",
		labelKey: "keyboard|scroll_down_timeline",
		fallback: "Scroll down in the timeline",
		combo: { key: "PageDown" }
	},
	{
		id: "KeyBinding.jumpToFirstMessageInTimeline",
		category: "room",
		labelKey: "keyboard|jump_first_message",
		fallback: "Jump to first message",
		combo: {
			ctrlKey: !0,
			key: "Home"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.jumpToLastMessageInTimeline",
		category: "room",
		labelKey: "keyboard|jump_last_message",
		fallback: "Jump to last message",
		combo: {
			ctrlKey: !0,
			key: "End"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.sendMessageInComposer",
		category: "composer",
		labelKey: "composer|send_button_title",
		fallback: "Send message",
		combo: (e) => ({
			key: "Enter",
			ctrlOrCmdKey: e.ctrlEnterToSend
		})
	},
	{
		id: "KeyBinding.newLineInComposer",
		category: "composer",
		labelKey: "keyboard|composer_new_line",
		fallback: "New line",
		combo: (e) => ({
			key: "Enter",
			shiftKey: !e.ctrlEnterToSend
		})
	},
	{
		id: "KeyBinding.toggleBoldInComposer",
		category: "composer",
		labelKey: "keyboard|composer_toggle_bold",
		fallback: "Toggle Bold",
		combo: {
			ctrlOrCmdKey: !0,
			key: "b"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.toggleItalicsInComposer",
		category: "composer",
		labelKey: "keyboard|composer_toggle_italics",
		fallback: "Toggle Italics",
		combo: {
			ctrlOrCmdKey: !0,
			key: "i"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.toggleQuoteInComposer",
		category: "composer",
		labelKey: "keyboard|composer_toggle_quote",
		fallback: "Toggle Quote",
		combo: {
			ctrlOrCmdKey: !0,
			shiftKey: !0,
			key: ">"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.FormatLink",
		category: "composer",
		labelKey: "keyboard|composer_toggle_link",
		fallback: "Toggle Link",
		combo: {
			ctrlOrCmdKey: !0,
			shiftKey: !0,
			key: "l"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.FormatCode",
		category: "composer",
		labelKey: "keyboard|composer_toggle_code_block",
		fallback: "Toggle Code Block",
		combo: {
			ctrlOrCmdKey: !0,
			key: "e"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.editUndoInComposer",
		category: "composer",
		labelKey: "keyboard|composer_undo",
		fallback: "Undo edit",
		combo: {
			ctrlOrCmdKey: !0,
			key: "z"
		}
	},
	{
		id: "KeyBinding.editRedoInComposer",
		category: "composer",
		labelKey: "keyboard|composer_redo",
		fallback: "Redo edit",
		combo: (e) => ({
			ctrlOrCmdKey: !0,
			shiftKey: e.isMac,
			key: e.isMac ? "z" : "y"
		})
	},
	{
		id: "KeyBinding.jumpToStartInComposer",
		category: "composer",
		labelKey: "keyboard|composer_jump_start",
		fallback: "Jump to start of the composer",
		combo: {
			ctrlOrCmdKey: !0,
			key: "Home"
		}
	},
	{
		id: "KeyBinding.jumpToEndInComposer",
		category: "composer",
		labelKey: "keyboard|composer_jump_end",
		fallback: "Jump to end of the composer",
		combo: {
			ctrlOrCmdKey: !0,
			key: "End"
		}
	},
	{
		id: "KeyBinding.cancelReplyInComposer",
		category: "composer",
		labelKey: "keyboard|cancel_reply",
		fallback: "Cancel replying to a message",
		combo: { key: "Escape" }
	},
	{
		id: "KeyBinding.editNextMessage",
		category: "composer",
		labelKey: "keyboard|navigate_next_message_edit",
		fallback: "Navigate to next message to edit",
		combo: { key: "ArrowDown" }
	},
	{
		id: "KeyBinding.editPreviousMessage",
		category: "composer",
		labelKey: "keyboard|navigate_prev_message_edit",
		fallback: "Navigate to previous message to edit",
		combo: { key: "ArrowUp" }
	},
	{
		id: "KeyBinding.nextMessageInComposerHistory",
		category: "composer",
		labelKey: "keyboard|composer_navigate_next_history",
		fallback: "Navigate to next message in composer history",
		combo: {
			altKey: !0,
			ctrlKey: !0,
			key: "ArrowDown"
		}
	},
	{
		id: "KeyBinding.previousMessageInComposerHistory",
		category: "composer",
		labelKey: "keyboard|composer_navigate_prev_history",
		fallback: "Navigate to previous message in composer history",
		combo: {
			altKey: !0,
			ctrlKey: !0,
			key: "ArrowUp"
		}
	},
	{
		id: "KeyBinding.showStickerPicker",
		category: "composer",
		labelKey: "keyboard|send_sticker",
		fallback: "Send a sticker",
		combo: {
			ctrlOrCmdKey: !0,
			key: ";"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.selectRoomInRoomList",
		category: "room_list",
		labelKey: "keyboard|room_list_select_room",
		fallback: "Select room from the room list",
		combo: { key: "Enter" }
	},
	{
		id: "KeyBinding.collapseSectionInRoomList",
		category: "room_list",
		labelKey: "keyboard|room_list_collapse_section",
		fallback: "Collapse room list section",
		combo: { key: "ArrowLeft" }
	},
	{
		id: "KeyBinding.expandSectionInRoomList",
		category: "room_list",
		labelKey: "keyboard|room_list_expand_section",
		fallback: "Expand room list section",
		combo: { key: "ArrowRight" }
	},
	{
		id: "KeyBinding.upperRoom",
		category: "room_list",
		labelKey: "keyboard|room_list_navigate_down",
		fallback: "Navigate down in the room list",
		combo: { key: "ArrowDown" }
	},
	{
		id: "KeyBinding.downerRoom",
		category: "room_list",
		labelKey: "keyboard|room_list_navigate_up",
		fallback: "Navigate up in the room list",
		combo: { key: "ArrowUp" }
	},
	{
		id: "KeyBinding.toggleMicInCall",
		category: "calls",
		labelKey: "keyboard|toggle_microphone_mute",
		fallback: "Toggle microphone mute",
		combo: {
			ctrlOrCmdKey: !0,
			key: "d"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.toggleWebcamInCall",
		category: "calls",
		labelKey: "keyboard|toggle_webcam_mute",
		fallback: "Toggle webcam on/off",
		combo: {
			ctrlOrCmdKey: !0,
			key: "e"
		},
		remappable: !0
	},
	{
		id: "KeyBinding.cancelAutoComplete",
		category: "autocomplete",
		labelKey: "keyboard|autocomplete_cancel",
		fallback: "Cancel autocomplete",
		combo: { key: "Escape" }
	},
	{
		id: "KeyBinding.nextOptionInAutoComplete",
		category: "autocomplete",
		labelKey: "keyboard|autocomplete_navigate_next",
		fallback: "Next autocomplete suggestion",
		combo: { key: "ArrowDown" }
	},
	{
		id: "KeyBinding.previousOptionInAutoComplete",
		category: "autocomplete",
		labelKey: "keyboard|autocomplete_navigate_prev",
		fallback: "Previous autocomplete suggestion",
		combo: { key: "ArrowUp" }
	},
	{
		id: "KeyBinding.completeAutocomplete",
		category: "autocomplete",
		labelKey: "action|complete",
		fallback: "Complete",
		combo: { key: "Enter" }
	},
	{
		id: "KeyBinding.forceCompleteAutocomplete",
		category: "autocomplete",
		labelKey: "keyboard|autocomplete_force",
		fallback: "Force complete",
		combo: { key: "Tab" }
	},
	{
		id: "KeyBinding.escape",
		category: "accessibility",
		labelKey: "keyboard|close_dialog_menu",
		fallback: "Close dialog or context menu",
		combo: { key: "Escape" }
	},
	{
		id: "KeyBinding.enter",
		category: "accessibility",
		labelKey: "keyboard|activate_button",
		fallback: "Activate selected button",
		combo: { key: "Enter" }
	},
	{
		id: "KeyBinding.save",
		category: "accessibility",
		labelKey: "keyboard|save",
		fallback: "Save",
		combo: {
			ctrlOrCmdKey: !0,
			key: "s"
		}
	},
	{
		id: "KeyBinding.toggleHiddenEventVisibility",
		category: "labs",
		labelKey: "keyboard|toggle_hidden_events",
		fallback: "Toggle hidden event visibility",
		combo: {
			ctrlKey: !0,
			shiftKey: !0,
			key: "j"
		},
		remappable: !0
	}
];
function v(e) {
	return _.filter((t) => !t.when || t.when(e)).map((t) => ({
		id: t.id,
		category: t.category,
		labelKey: t.labelKey,
		fallback: t.fallback,
		combo: typeof t.combo == "function" ? t.combo(e) : t.combo,
		remappable: t.remappable ?? !1
	}));
}
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/util.js
function y(e, t = "|") {
	return e.map((e) => ie(e)).join(t);
}
function b(e, t) {
	return typeof t == "bigint" ? t.toString() : t;
}
var x = class {
	constructor(e) {
		this._getter = e, this._value = void 0;
	}
	get value() {
		let e = this._getter;
		return e !== void 0 && (this._value = e(), this._getter = void 0), this._value;
	}
};
function S(e) {
	return new x(e);
}
function C(e) {
	let t = +!!e.startsWith("^"), n = e.endsWith("$") ? e.length - 1 : e.length;
	return e.slice(t, n);
}
function w(e, t, n) {
	Object.defineProperty(e, t, {
		value: n,
		writable: !0,
		enumerable: !0,
		configurable: !0
	});
}
var te = "captureStackTrace" in Error ? Error.captureStackTrace : (...e) => {};
function T(e) {
	return typeof e == "object" && !!e && !Array.isArray(e);
}
function E(e) {
	if (T(e) === !1) return !1;
	let t = e.constructor;
	if (t === void 0 || typeof t != "function") return !0;
	let n = t.prototype;
	return T(n) !== !1 && Object.prototype.hasOwnProperty.call(n, "isPrototypeOf") !== !1;
}
function ne(e) {
	return E(e) ? { ...e } : Array.isArray(e) ? [...e] : e instanceof Map ? new Map(e) : e instanceof Set ? new Set(e) : e;
}
function re(e, t, n) {
	let r = new e._zod.constr(t ?? e._zod.def);
	return (!t || n?.parent) && (r._zod.parent = e), r;
}
function D(e) {
	let t = e;
	if (!t) return {};
	if (typeof t == "string") return { error: () => t };
	if (t?.message !== void 0) {
		if (t?.error !== void 0) throw Error("Cannot specify both `message` and `error` params");
		t.error = t.message;
	}
	return delete t.message, typeof t.error == "string" ? {
		...t,
		error: () => t.error
	} : t;
}
function ie(e) {
	return typeof e == "bigint" ? e.toString() + "n" : typeof e == "string" ? `"${e}"` : `${e}`;
}
function ae(e) {
	return Object.keys(e).filter((t) => e[t]._zod.optin !== void 0 && e[t]._zod.optout === "optional");
}
function O(e, t = 0) {
	if (e.aborted === !0) return !0;
	for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue !== !0) return !0;
	return !1;
}
function oe(e, t = 0) {
	if (e.aborted === !0) return !0;
	for (let n = t; n < e.issues.length; n++) if (e.issues[n]?.continue === !1) return !0;
	return !1;
}
function k(e, t) {
	return t.map((t) => {
		var n;
		return (n = t).path ?? (n.path = []), t.path.unshift(e), t;
	});
}
function A(e) {
	return typeof e == "string" ? e : e?.message;
}
function se(e) {
	let t = [];
	for (let n of e ?? []) {
		let e = n._zod.def;
		if (!/_(length|size)$|_equals$/.test(e.check)) break;
		let r = e.maximum ?? e.length ?? e.size;
		r >= 0 && t.push([r, n]);
	}
	return t;
}
function j(e, t, n) {
	var r;
	for (let i = t; i < e.length; i++) (r = e[i]).schema ?? (r.schema = n);
}
function M(e, t, n) {
	var r;
	let i = e.inst?._zod?.traits;
	i?.has("$ZodType") && (i.has("$ZodCheck") ? (r = e).schema ?? (r.schema = e.inst) : e.schema = e.inst);
	let a = e.schema === e.inst ? void 0 : e.schema?._zod.def?.error, o = e.message ? e.message : A(e.inst?._zod.def?.error?.(e)) ?? A(a?.(e)) ?? A(t?.error?.(e)) ?? A(n.customError?.(e)) ?? A(n.localeError?.(e)) ?? "Invalid input", s = {};
	for (let t of Object.keys(e)) t !== "inst" && t !== "schema" && t !== "continue" && t !== "input" && t !== "__proto__" && (s[t] = e[t]);
	return s.path ??= [], s.message = o, t?.reportInput && (s.input = e.input), s;
}
function ce(e) {
	let t = typeof e;
	switch (t) {
		case "number": return Number.isNaN(e) ? "nan" : "number";
		case "object": {
			if (e === null) return "null";
			if (Array.isArray(e)) return "array";
			let t = e;
			if (t && Object.getPrototypeOf(t) !== Object.prototype && "constructor" in t && t.constructor) return t.constructor.name;
		}
	}
	return t;
}
function le(...e) {
	let [t, n, r] = e;
	return typeof t == "string" ? {
		message: t,
		code: "custom",
		input: n,
		inst: r
	} : { ...t };
}
function ue(e, t) {
	for (let n in t) {
		let r = Object.getOwnPropertyDescriptor(t, n);
		r.get ? Object.defineProperty(e, n, {
			...r,
			enumerable: !1
		}) : fe(e, n, r.value);
	}
}
function N(e, t, n, r = !0) {
	return Object.defineProperty(e, t, {
		configurable: !0,
		writable: !0,
		enumerable: r,
		value: n
	}), n;
}
function de(e, t, n) {
	return N(e, t, n, !1);
}
function fe(e, t, n) {
	Object.defineProperty(e, t, {
		configurable: !0,
		get() {
			return this == null ? n : N(this, t, n.bind(this));
		},
		set(e) {
			N(this, t, e);
		}
	});
}
function pe(e, t) {
	let n = Object.getPrototypeOf(e);
	return t in n ? void 0 : n;
}
var P, F = !1, me = {
	configurable: !0,
	get() {
		F = !0;
	}
};
function I(e, t, n) {
	let r = Object.getPrototypeOf(e._zod);
	t in r && P !== e._zod ? P = void 0 : (P = e._zod, Object.defineProperty(r, t, {
		configurable: !0,
		get() {
			Object.defineProperty(this, t, me);
			let e = F;
			F = !1;
			try {
				let r = n(this);
				return F ? delete this[t] : Object.defineProperty(this, t, {
					configurable: !0,
					writable: !0,
					value: r
				}), F ||= e, r;
			} catch (n) {
				throw delete this[t], F ||= e, n;
			}
		},
		set(e) {
			Object.defineProperty(this, t, {
				configurable: !0,
				writable: !0,
				value: e
			});
		}
	}));
}
function he(e, t, n, r) {
	let i = pe(e, t);
	i && Object.defineProperty(i, t, {
		configurable: !0,
		get() {
			let e = {
				configurable: !0,
				writable: !0,
				enumerable: r,
				value: void 0
			};
			return Object.defineProperty(this, t, e), e.value = n(this), Object.defineProperty(this, t, e), e.value;
		},
		set(e) {
			Object.defineProperty(this, t, {
				configurable: !0,
				writable: !0,
				enumerable: r,
				value: e
			});
		}
	});
}
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/core.js
var ge, L = {
	value: void 0,
	enumerable: !1
}, _e = "captureStackTrace" in Error ? Error : null;
function ve(e) {
	let t = _e;
	if (t) {
		let n = t.stackTraceLimit;
		if (typeof n == "number") {
			try {
				t.stackTraceLimit = 0;
			} catch {
				return _e = null, new e();
			}
			try {
				return new e();
			} finally {
				t.stackTraceLimit = n;
			}
		}
	}
	return new e();
}
/* @__NO_SIDE_EFFECTS__ */
function R(e, t, n, r) {
	let i = {};
	function a(e) {
		this.def = e, this.constr = d, this.traits = /* @__PURE__ */ new Set();
	}
	a.prototype = i;
	let o = n, s = o && /* @__PURE__ */ new WeakSet();
	function c(n, r) {
		if (!n._zod) {
			L.value = new a(r);
			try {
				Object.defineProperty(n, "_zod", L);
			} finally {
				L.value = void 0;
			}
		} else if (n._zod.traits.has(e)) return;
		if (n._zod.traits.add(e), t(n, r), s) {
			let e = Object.getPrototypeOf(n), t = n._zod.constr.prototype, r = e;
			for (; r && r !== t;) r = Object.getPrototypeOf(r);
			let i = r ?? e;
			s.has(i) || (s.add(i), ue(i, o));
		}
		let i = d.prototype;
		for (let e in i) Object.prototype.hasOwnProperty.call(i, e) && (e in n || (n[e] = i[e].bind(n)));
	}
	let l = r?.Parent ?? Object;
	class u extends l {}
	Object.defineProperty(u, "name", { value: e });
	function d(e) {
		let t = r?.Parent ? ve(u) : this;
		c(t, e);
		let n = t._zod.deferred;
		if (n) {
			for (let e of n) e();
			t._zod.deferred = void 0;
		}
		let i = globalThis.__zod_globalConfig?.postProcessor;
		return i && i(t), t;
	}
	return Object.defineProperty(d, "init", { value: c }), Object.defineProperty(d, Symbol.hasInstance, { value: (t) => r?.Parent && t instanceof r.Parent ? !0 : t?._zod?.traits?.has(e) }), Object.defineProperty(d, "name", { value: e }), d;
}
var z = class extends Error {
	constructor() {
		super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
	}
};
(ge = globalThis).__zod_globalConfig ?? (ge.__zod_globalConfig = {});
var B = globalThis.__zod_globalConfig;
function V(e) {
	return e && Object.assign(B, e), B;
}
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/errors.js
function ye() {
	let e = this._zod;
	return e.message ??= JSON.stringify(e.def, b, 2), e.message;
}
function be(e) {
	this._zod.message = e;
}
var xe = {
	get: ye,
	set: be,
	enumerable: !0,
	configurable: !0
}, Se = {
	value: void 0,
	enumerable: !1
}, Ce = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]), H = /* @__PURE__ */ R("$ZodError", (e, t) => {
	e.name = "$ZodError", Se.value = t, Object.defineProperty(e, "issues", Se), Se.value = void 0, Object.defineProperty(e, "message", xe);
	let n = Object.getPrototypeOf(e);
	Ce.has(n) || (Ce.add(n), Object.defineProperty(n, "toString", {
		configurable: !0,
		enumerable: !1,
		get() {
			let e = () => this.message;
			return Object.defineProperty(this, "toString", {
				value: e,
				configurable: !0,
				writable: !0
			}), e;
		},
		set(e) {
			Object.defineProperty(this, "toString", {
				value: e,
				configurable: !0,
				writable: !0
			});
		}
	}));
}, void 0, { Parent: Error }), we = /* @__PURE__*/ ((e) => {
	let t = (n, r, i, a) => {
		let o = i ? {
			...i,
			async: !1
		} : { async: !1 }, s = n._zod.run({
			value: r,
			issues: []
		}, o);
		if (s instanceof Promise) throw new z();
		if (s.issues.length) {
			let n = new ((a?.Err) ?? e)(s.issues.map((e) => M(e, o, V())));
			throw te(n, a?.callee ?? t), n;
		}
		return s.value;
	};
	return t;
})(H), Te = /* @__PURE__*/ ((e) => {
	let t = async (n, r, i, a) => {
		let o = i ? {
			...i,
			async: !0
		} : { async: !0 }, s = n._zod.run({
			value: r,
			issues: []
		}, o);
		if (s instanceof Promise && (s = await s), s.issues.length) {
			let n = new ((a?.Err) ?? e)(s.issues.map((e) => M(e, o, V())));
			throw te(n, a?.callee ?? t), n;
		}
		return s.value;
	};
	return t;
})(H), Ee = /* @__PURE__*/ ((e) => (t, n, r) => {
	let i = r ? {
		...r,
		async: !1
	} : { async: !1 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	if (a instanceof Promise) throw new z();
	return a.issues.length ? De(e, a.issues, i) : {
		success: !0,
		data: a.value
	};
})(H);
function De(e, t, n) {
	let r;
	return {
		success: !1,
		get error() {
			return r || (r = new e(t.map((e) => M(e, n, V()))), t = void 0, n = void 0), r;
		},
		set error(e) {
			r = e, t = void 0, n = void 0;
		}
	};
}
var Oe = /* @__PURE__*/ ((e) => async (t, n, r) => {
	let i = r ? {
		...r,
		async: !0
	} : { async: !0 }, a = t._zod.run({
		value: n,
		issues: []
	}, i);
	return a instanceof Promise && (a = await a), a.issues.length ? De(e, a.issues, i) : {
		success: !0,
		data: a.value
	};
})(H), ke = /^[\s\S]{0,}$/, Ae = /^-?\d+(?:\.\d+)?$/, je = /^(?:true|false)$/i, Me = /*@__PURE__*/ R("$ZodCheck", (e, t) => {
	var n;
	e._zod ??= {}, e._zod.def = t, (n = e._zod).onattach ?? (n.onattach = []);
}), Ne = {
	major: 4,
	minor: 6,
	patch: 7
}, U = /*@__PURE__*/ R("$ZodType", (e, t) => {
	var n;
	e ??= {}, e._zod.def = t, e._zod.bag = e._zod.bag || {}, e._zod.version = Ne;
	let r = e._zod.def.checks, i = e._zod.traits.has("$ZodCheck") ? [e, ...r ?? []] : r?.length ? [...r] : [];
	for (let t of i) for (let n of t._zod.onattach) n(e);
	if (i.length === 0) (n = e._zod).deferred ?? (n.deferred = []), e._zod.deferred?.push(() => {
		e._zod.run = e._zod.parse;
	});
	else {
		let t = (t, n, r) => {
			if (t.memo) return t;
			let i = O(t), a;
			for (let o of n) {
				if (o._zod.def.when) {
					if (oe(t) || !o._zod.def.when(t)) continue;
				} else if (i) continue;
				let n = t.issues.length, s = o._zod.check(t);
				if (s instanceof Promise && r?.async === !1) throw new z();
				if (a || s instanceof Promise) a = (a ?? Promise.resolve()).then(async () => {
					await s, t.issues.length !== n && (j(t.issues, n, e), i ||= O(t, n));
				});
				else {
					if (t.issues.length === n) continue;
					j(t.issues, n, e), i ||= O(t, n);
				}
			}
			return a ? a.then(() => t) : t;
		}, n = (n, r, a) => {
			if (O(n)) return n.aborted = !0, n;
			let o = t(r, i, a);
			if (o instanceof Promise) {
				if (a.async === !1) throw new z();
				return o.then((t) => e._zod.parse(t, a));
			}
			return e._zod.parse(o, a);
		};
		e._zod.run = (r, a) => {
			if (a.skipChecks) return e._zod.parse(r, a);
			if (a.direction === "backward") {
				let t = e._zod.parse({
					value: r.value,
					issues: []
				}, {
					...a,
					skipChecks: !0
				});
				return t instanceof Promise ? t.then((e) => n(e, r, a)) : n(t, r, a);
			}
			let o = e._zod.parse(r, a);
			if (o instanceof Promise) {
				if (a.async === !1) throw new z();
				return o.then((e) => t(e, i, a));
			}
			return t(o, i, a);
		};
	}
}, {
	get "~standard"() {
		return de(this, "~standard", Ie(this));
	},
	set "~standard"(e) {
		N(this, "~standard", e);
	}
}), Pe = (e, t) => e.issues.length ? { issues: e.issues.map((e) => M(e, t, V())) } : { value: e.value };
async function Fe(e, t) {
	let n = { async: !0 };
	return Pe(await e._zod.run({
		value: t,
		issues: []
	}, n), n);
}
function Ie(e) {
	return {
		validate: (t) => {
			let n = { async: !1 };
			try {
				let r = e._zod.run({
					value: t,
					issues: []
				}, n);
				if (!(r instanceof Promise)) return Pe(r, n);
			} catch {}
			return Fe(e, t);
		},
		vendor: "zod",
		version: 1
	};
}
var Le = /*@__PURE__*/ R("$ZodString", (e, t) => {
	U.init(e, t), e._zod.pattern = t.pattern ?? ke, e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = String(n.value);
		} catch {}
		return typeof n.value == "string" || n.issues.push({
			expected: "string",
			code: "invalid_type",
			input: n.value,
			inst: e
		}), n;
	};
}), Re = /*@__PURE__*/ R("$ZodBoolean", (e, t) => {
	U.init(e, t), e._zod.pattern = je, e._zod.parse = (n, r) => {
		if (t.coerce) try {
			n.value = !!n.value;
		} catch {}
		let i = n.value;
		return typeof i == "boolean" || n.issues.push({
			expected: "boolean",
			code: "invalid_type",
			input: i,
			inst: e
		}), n;
	};
});
function ze(e, t) {
	let n = se(e._zod.def.checks);
	if (!n.length) return;
	let r = Math.min(...n.map((e) => e[0])), i = e._zod.parse;
	e._zod.parse = (n, a) => {
		let o = t(n.value);
		if (o > r && !a?.skipChecks && a?.direction !== "backward") {
			for (let [t, r] of se(e._zod.def.checks)) if (o > t && r._zod.def.when(n)) {
				let t = n.issues.length;
				return r._zod.check(n), n.issues[t].continue = !1, j(n.issues, t, e), n;
			}
		}
		return i(n, a);
	};
}
var Be = (e) => Array.isArray(e) ? e.length : -1;
function Ve(e, t, n) {
	e.issues.length && t.issues.push(...k(n, e.issues)), t.value[n] = e.value;
}
var He = /*@__PURE__*/ R("$ZodArray", (e, t) => {
	U.init(e, t);
	let n = B.memoizer;
	n?.attach(e), e._zod.parse = (r, i) => {
		let a = r.value;
		if (!Array.isArray(a)) return r.issues.push({
			expected: "array",
			code: "invalid_type",
			input: a,
			inst: e
		}), r;
		r.value = n ? n.alloc(e, r, Array(a.length), i) : Array(a.length);
		let o = [], s = i?.abortEarly;
		for (let e = 0; e < a.length; e++) {
			let n = a[e], c = t.element._zod.run({
				value: n,
				issues: []
			}, i);
			if (c instanceof Promise) o.push(c.then((t) => Ve(t, r, e)));
			else if (Ve(c, r, e), s && c.issues.length !== 0 && O(c)) break;
		}
		return o.length ? Promise.all(o).then(() => r) : r;
	}, ze(e, Be);
});
function W(e, t, n, r, i, a) {
	let o = n in r, s = a === "optional";
	if (o || !s || i !== "optional") {
		if (e.issues.length) {
			if (i !== void 0 && s && !o) return;
			t.issues.push(...k(n, e.issues));
		}
		!o && i === void 0 ? e.issues.length || t.issues.push({
			code: "invalid_type",
			expected: "nonoptional",
			input: void 0,
			path: [n]
		}) : e.value === void 0 ? (o || i === "defaulted" && !s) && (t.value[n] = void 0) : t.value[n] = e.value;
	}
}
var Ue = [];
function We(e) {
	let t = Object.keys(e.shape), n = Object.getOwnPropertySymbols(e.shape), r = n.length ? n : Ue, i = r.length ? [...t, ...r] : t;
	for (let t of i) if (!e.shape?.[t]?._zod?.traits?.has("$ZodType")) throw Error(`Invalid element at key "${String(t)}": expected a Zod schema`);
	let a = ae(e.shape);
	return {
		...e,
		allKeys: i,
		symbolKeys: r,
		keySet: new Set(t),
		numKeys: t.length,
		optionalKeys: new Set(a)
	};
}
function Ge(e, t, n, r, i, a, o) {
	let s = [], c = i.keySet, l = i.catchall._zod, u = l.def.type, d = l.optin, f = l.optout, p = 0;
	for (let i in t) {
		if (o && n.issues.length !== p) {
			if (O(n, p)) break;
			p = n.issues.length;
		}
		if (c.has(i)) continue;
		if (i === "__proto__") {
			u === "never" && s.push(i);
			continue;
		}
		if (u === "never") {
			s.push(i);
			continue;
		}
		let a = l.run({
			value: t[i],
			issues: []
		}, r);
		a instanceof Promise ? e.push(a.then((e) => W(e, n, i, t, d, f))) : W(a, n, i, t, d, f);
	}
	return s.length && n.issues.push({
		code: "unrecognized_keys",
		keys: s,
		input: t,
		inst: a,
		continue: !0
	}), e.length ? Promise.all(e).then(() => n) : n;
}
var Ke = /*@__PURE__*/ R("$ZodObject", (e, t) => {
	U.init(e, t);
	let n = Object.getOwnPropertyDescriptor(t, "shape"), r = n?.get ? n.get.raw : t.shape ?? {};
	if (r) {
		let e = () => {
			let n = { ...r };
			return Object.defineProperty(t, "shape", { value: n }), e.raw = n, n;
		};
		e.raw = r, Object.defineProperty(t, "shape", { get: e });
	}
	let i = S(() => We(t));
	I(e, "propValues", (e) => {
		let t = e.def.shape, n = {};
		for (let e in t) {
			let r = t[e]._zod;
			if (r.values) {
				Object.prototype.hasOwnProperty.call(n, e) || w(n, e, /* @__PURE__ */ new Set());
				for (let t of r.values) n[e].add(t);
				r.optin !== void 0 && n[e].add(void 0);
			}
		}
		return n;
	});
	let a = T, o = t.catchall, s, c = B.memoizer;
	c?.attach(e), e._zod.parse = (t, n) => {
		s ??= i.value;
		let r = t.value;
		if (!a(r)) return t.issues.push({
			expected: "object",
			code: "invalid_type",
			input: r,
			inst: e
		}), t;
		t.value = c ? c.alloc(e, t, {}, n) : {};
		let l = [], u = s.shape, d = n?.abortEarly, f = t.issues.length;
		for (let e of s.allKeys) {
			if (d && t.issues.length !== f) {
				if (O(t, f)) break;
				f = t.issues.length;
			}
			if (e === "__proto__") continue;
			let i = u[e], a = i._zod.optin, o = i._zod.optout, s = i._zod.run({
				value: r[e],
				issues: []
			}, n);
			s instanceof Promise ? l.push(s.then((n) => W(n, t, e, r, a, o))) : W(s, t, e, r, a, o);
		}
		return o ? Ge(l, r, t, n, i.value, e, d === !0) : l.length ? Promise.all(l).then(() => t) : t;
	};
});
function qe(e, t, n, r) {
	for (let n of e) if (n.issues.length === 0) return t.value = n.value, t;
	let i = e.filter((e) => !O(e));
	return i.length === 1 ? (t.value = i[0].value, i[0]) : (t.issues.push({
		code: "invalid_union",
		input: t.value,
		inst: n,
		errors: e.map((e) => e.issues.map((e) => M(e, r, V())))
	}), t);
}
var Je = /*@__PURE__*/ R("$ZodUnion", (e, t) => {
	U.init(e, t), I(e, "optin", (e) => e.def.options.some((e) => e._zod.optin === "defaulted") ? "defaulted" : e.def.options.some((e) => e._zod.optin !== void 0) ? "optional" : void 0), I(e, "optout", (e) => e.def.options.some((e) => e._zod.optout === "optional") ? "optional" : void 0), I(e, "values", (e) => {
		if (e.def.options.every((e) => e._zod.values)) return new Set(e.def.options.flatMap((e) => Array.from(e._zod.values)));
	}), I(e, "pattern", (e) => {
		if (e.def.options.every((e) => e._zod.pattern)) {
			let t = e.def.options.map((e) => e._zod.pattern);
			return RegExp(`^(${t.map((e) => C(e.source)).join("|")})$`);
		}
	});
	let n = t.options.length === 1 ? t.options[0]._zod.run : null;
	e._zod.parse = (r, i) => {
		if (n) return n(r, i);
		let a = !1, o = [];
		for (let e of t.options) {
			let t = e._zod.run({
				value: r.value,
				issues: []
			}, i);
			if (t instanceof Promise) o.push(t), a = !0;
			else {
				if (t.issues.length === 0) return t;
				o.push(t);
			}
		}
		return a ? Promise.all(o).then((t) => qe(t, r, e, i)) : qe(o, r, e, i);
	};
}), Ye = /*@__PURE__*/ R("$ZodRecord", (e, t) => {
	U.init(e, t);
	let n = B.memoizer;
	n?.attach(e), e._zod.parse = (r, i) => {
		let a = r.value;
		if (!E(a)) return r.issues.push({
			expected: "record",
			code: "invalid_type",
			input: a,
			inst: e
		}), r;
		let o = [], s = t.keyType._zod.values;
		if (s && !t.partial) {
			r.value = n ? n.alloc(e, r, {}, i) : {};
			let c = /* @__PURE__ */ new Set();
			for (let n of s) if (typeof n == "string" || typeof n == "number" || typeof n == "symbol") {
				if (c.add(typeof n == "number" ? n.toString() : n), n === "__proto__") continue;
				let s = t.keyType._zod.run({
					value: n,
					issues: []
				}, i);
				if (s instanceof Promise) throw Error("Async schemas not supported in object keys currently");
				if (s.issues.length) {
					r.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: s.issues.map((e) => M(e, i, V())),
						input: n,
						path: [n],
						inst: e
					});
					continue;
				}
				let l = s.value;
				if (l === "__proto__") continue;
				let u = t.valueType._zod.run({
					value: a[n],
					issues: []
				}, i);
				u instanceof Promise ? o.push(u.then((e) => {
					e.issues.length && r.issues.push(...k(n, e.issues)), r.value[l] = e.value;
				})) : (u.issues.length && r.issues.push(...k(n, u.issues)), r.value[l] = u.value);
			}
			let l;
			for (let e in a) if (!c.has(e)) {
				if (t.mode === "loose") {
					if (e === "__proto__") continue;
					r.value[e] = a[e];
				} else l ??= [], l.push(e);
			}
			l && l.length > 0 && r.issues.push({
				code: "unrecognized_keys",
				input: a,
				inst: e,
				keys: l,
				continue: !0
			});
		} else {
			r.value = n ? n.alloc(e, r, {}, i) : {};
			let c;
			for (let n of Reflect.ownKeys(a)) {
				if (n === "__proto__" || !Object.prototype.propertyIsEnumerable.call(a, n)) continue;
				let l = t.keyType._zod.run({
					value: n,
					issues: []
				}, i);
				if (l instanceof Promise) throw Error("Async schemas not supported in object keys currently");
				if (typeof n == "string" && Ae.test(n) && l.issues.length) {
					let e = t.keyType._zod.run({
						value: Number(n),
						issues: []
					}, i);
					if (e instanceof Promise) throw Error("Async schemas not supported in object keys currently");
					e.issues.length === 0 && (l = e);
				}
				if (l.issues.length) {
					t.mode === "loose" ? r.value[n] = a[n] : s ? (c ??= [], c.push(n)) : r.issues.push({
						code: "invalid_key",
						origin: "record",
						issues: l.issues.map((e) => M(e, i, V())),
						input: n,
						path: [n],
						inst: e
					});
					continue;
				}
				let u = l.value;
				if (u === "__proto__") continue;
				let d = t.valueType._zod.run({
					value: a[n],
					issues: []
				}, i);
				d instanceof Promise ? o.push(d.then((e) => {
					e.issues.length && r.issues.push(...k(n, e.issues)), r.value[u] = e.value;
				})) : (d.issues.length && r.issues.push(...k(n, d.issues)), r.value[u] = d.value);
			}
			c && c.length > 0 && r.issues.push({
				code: "unrecognized_keys",
				input: a,
				inst: e,
				keys: c,
				continue: !0
			});
		}
		return o.length ? Promise.all(o).then(() => r) : r;
	};
});
function Xe(e, t) {
	return e.value = t.issues.length ? void 0 : t.value, e;
}
var Ze = /*@__PURE__*/ R("$ZodOptional", (e, t) => {
	U.init(e, t), I(e, "optin", (e) => e.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional"), e._zod.optout = "optional", I(e, "values", (e) => {
		let t = e.def.innerType._zod.values;
		return t ? /* @__PURE__ */ new Set([...t, void 0]) : void 0;
	}), I(e, "pattern", (e) => {
		let t = e.def.innerType._zod.pattern;
		return t ? RegExp(`^(${C(t.source)})?$`) : void 0;
	}), e._zod.parse = (e, n) => {
		if (e.value === void 0) {
			if (t.innerType._zod.optin !== "defaulted") return e;
			let r = t.innerType._zod.run({
				value: e.value,
				issues: []
			}, n);
			return r instanceof Promise ? r.then((t) => Xe(e, t)) : Xe(e, r);
		}
		return t.innerType._zod.run(e, n);
	};
}), Qe = /*@__PURE__*/ R("$ZodDefault", (e, t) => {
	U.init(e, t), e._zod.optin = "defaulted", I(e, "values", (e) => e.def.innerType._zod.values), e._zod.parse = (e, n) => {
		if (n.direction === "backward") return t.innerType._zod.run(e, n);
		if (e.value === void 0) return e.value = t.defaultValue, e;
		let r = t.innerType._zod.run(e, n);
		return r instanceof Promise ? r.then((e) => $e(e, t)) : $e(r, t);
	};
});
function $e(e, t) {
	return e.value === void 0 && (e.value = t.defaultValue), e;
}
var et = /*@__PURE__*/ R("$ZodCustom", (e, t) => {
	Me.init(e, t), U.init(e, t), e._zod.parse = (e, t) => e, e._zod.check = (n) => {
		let r = n.value, i = t.fn(r);
		if (i instanceof Promise) return i.then((t) => tt(t, n, r, e));
		tt(i, n, r, e);
	};
});
function tt(e, t, n, r) {
	if (!e) {
		let e = {
			code: "custom",
			input: n,
			inst: r,
			path: [...r._zod.def.path ?? []],
			continue: !r._zod.def.abort
		};
		r._zod.def.params && (e.params = r._zod.def.params), t.issues.push(le(e));
	}
}
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/locales/en.js
var nt = () => {
	let e = {
		string: {
			unit: "characters",
			verb: "to have"
		},
		file: {
			unit: "bytes",
			verb: "to have"
		},
		array: {
			unit: "items",
			verb: "to have"
		},
		set: {
			unit: "items",
			verb: "to have"
		},
		map: {
			unit: "entries",
			verb: "to have"
		}
	};
	function t(t) {
		return e[t] ?? null;
	}
	let n = {
		regex: "input",
		email: "email address",
		url: "URL",
		emoji: "emoji",
		uuid: "UUID",
		uuidv4: "UUIDv4",
		uuidv6: "UUIDv6",
		nanoid: "nanoid",
		guid: "GUID",
		cuid: "cuid",
		cuid2: "cuid2",
		ulid: "ULID",
		xid: "XID",
		ksuid: "KSUID",
		datetime: "ISO datetime",
		date: "ISO date",
		time: "ISO time",
		duration: "ISO duration",
		ipv4: "IPv4 address",
		ipv6: "IPv6 address",
		mac: "MAC address",
		cidrv4: "IPv4 range",
		cidrv6: "IPv6 range",
		base64: "base64-encoded string",
		base64url: "base64url-encoded string",
		json_string: "JSON string",
		e164: "E.164 number",
		currency_code: "currency code",
		credit_card: "credit card number",
		iban: "IBAN",
		jwt: "JWT",
		template_literal: "input"
	}, r = { nan: "NaN" };
	function i(e, t) {
		return e === "number" && typeof t == "number" && !Number.isFinite(t) ? String(t) : r[e] ?? e;
	}
	return (e) => {
		switch (e.code) {
			case "invalid_type": return `Invalid input: expected ${i(e.expected)}, received ${i(ce(e.input), e.input)}`;
			case "invalid_value": return e.values.length === 1 ? `Invalid input: expected ${ie(e.values[0])}` : `Invalid option: expected one of ${y(e.values, "|")}`;
			case "too_big": {
				let n = e.exact ? "exactly " : e.inclusive ? "<=" : "<", r = t(e.origin);
				return r ? `Too big: expected ${e.origin ?? "value"} to have ${n}${e.maximum.toString()} ${r.unit ?? "elements"}` : `Too big: expected ${e.origin ?? "value"} to be ${n}${e.maximum.toString()}`;
			}
			case "too_small": {
				let n = e.exact ? "exactly " : e.inclusive ? ">=" : ">", r = t(e.origin);
				return r ? `Too small: expected ${e.origin} to have ${n}${e.minimum.toString()} ${r.unit}` : `Too small: expected ${e.origin} to be ${n}${e.minimum.toString()}`;
			}
			case "invalid_format": {
				let t = e;
				return t.format === "starts_with" ? `Invalid string: must start with "${t.prefix}"` : t.format === "ends_with" ? `Invalid string: must end with "${t.suffix}"` : t.format === "includes" ? `Invalid string: must include "${t.includes}"` : t.format === "regex" ? `Invalid string: must match pattern ${t.pattern}` : `Invalid ${n[t.format] ?? e.format}`;
			}
			case "not_multiple_of": return `Invalid number: must be a multiple of ${e.divisor}`;
			case "unrecognized_keys": return `Unrecognized key${e.keys.length > 1 ? "s" : ""}: ${y(e.keys, ", ")}`;
			case "invalid_key": return `Invalid key in ${e.origin}`;
			case "invalid_union": return e.options && Array.isArray(e.options) && e.options.length > 0 ? `Invalid discriminator value. Expected ${e.options.map((e) => `'${e}'`).join(" | ")}` : e.inclusive === !1 ? "Invalid input: more than one option matched" : "Invalid input";
			case "invalid_element": return `Invalid value in ${e.origin}`;
			default: return "Invalid input";
		}
	};
};
function rt() {
	return { localeError: nt() };
}
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/core/api.js
function it(e) {
	return e.checks &&= [...e.checks], e;
}
// @__NO_SIDE_EFFECTS__
function at(e, t) {
	return new e(it({
		type: "string",
		...D(t)
	}));
}
// @__NO_SIDE_EFFECTS__
function ot(e, t) {
	return new e({
		type: "boolean",
		...D(t)
	});
}
// @__NO_SIDE_EFFECTS__
function st(e, t, n) {
	return new e({
		type: "custom",
		check: "custom",
		fn: t,
		...D(n)
	});
}
// node_modules/.pnpm/zod@4.6.7/node_modules/zod/v4/mini/schemas.js
var G = /*@__PURE__*/ R("ZodMiniType", (e, t) => {
	if (!e._zod) throw Error("Uninitialized schema in ZodMiniType.");
	U.init(e, t), e.def = t, e.type = t.type;
}, {
	get with() {
		return this.check;
	},
	set with(e) {
		N(this, "with", e);
	},
	parse(e, t) {
		return we(this, e, t, { callee: this.parse });
	},
	parseAsync(e, t) {
		return Te(this, e, t, { callee: this.parseAsync });
	},
	safeParse(e, t) {
		return Ee(this, e, t);
	},
	safeParseAsync(e, t) {
		return Oe(this, e, t);
	},
	check(...e) {
		let t = this.def;
		return this.clone({
			...t,
			checks: [...t.checks ?? [], ...e.map((e) => typeof e == "function" ? { _zod: {
				check: e,
				def: { check: "custom" },
				onattach: []
			} } : e)]
		}, { parent: !0 });
	},
	clone(e, t) {
		return re(this, e, t);
	},
	brand() {
		return this;
	},
	register(e, t) {
		return e.add(this, t), this;
	},
	apply(e, ...t) {
		return t.length === 0 ? e(this) : e(this, ...t);
	}
}), ct = /*@__PURE__*/ R("ZodMiniString", (e, t) => {
	Le.init(e, t), G.init(e, t);
});
// @__NO_SIDE_EFFECTS__
function K(e) {
	return /* @__PURE__ */ at(ct, e);
}
var lt = /*@__PURE__*/ R("ZodMiniBoolean", (e, t) => {
	Re.init(e, t), G.init(e, t);
});
// @__NO_SIDE_EFFECTS__
function ut(e) {
	return /* @__PURE__ */ ot(lt, e);
}
var dt = /*@__PURE__*/ R("ZodMiniArray", (e, t) => {
	He.init(e, t), G.init(e, t);
});
// @__NO_SIDE_EFFECTS__
function q(e, t) {
	return new dt({
		type: "array",
		element: e,
		...D(t)
	});
}
var ft = /*@__PURE__*/ R("ZodMiniObject", (e, t) => {
	Ke.init(e, t), G.init(e, t), he(e, "shape", (e) => e._zod.def.shape, !1);
});
// @__NO_SIDE_EFFECTS__
function pt(e, t) {
	return new ft({
		type: "object",
		shape: e ?? {},
		...D(t)
	});
}
var mt = /*@__PURE__*/ R("ZodMiniUnion", (e, t) => {
	Je.init(e, t), G.init(e, t);
});
// @__NO_SIDE_EFFECTS__
function ht(e, t) {
	return new mt({
		type: "union",
		options: e,
		...D(t)
	});
}
var gt = /*@__PURE__*/ R("ZodMiniRecord", (e, t) => {
	Ye.init(e, t), G.init(e, t);
});
// @__NO_SIDE_EFFECTS__
function _t(e, t, n) {
	return !t || !t._zod ? new gt({
		type: "record",
		keyType: /* @__PURE__ */ K(),
		valueType: e,
		...D(t)
	}) : new gt({
		type: "record",
		keyType: e,
		valueType: t,
		...D(n)
	});
}
var vt = /*@__PURE__*/ R("ZodMiniOptional", (e, t) => {
	Ze.init(e, t), G.init(e, t);
});
// @__NO_SIDE_EFFECTS__
function yt(e) {
	return new vt({
		type: "optional",
		innerType: e
	});
}
var bt = /*@__PURE__*/ R("ZodMiniDefault", (e, t) => {
	Qe.init(e, t), G.init(e, t);
});
// @__NO_SIDE_EFFECTS__
function J(e, t) {
	return new bt({
		type: "default",
		innerType: e,
		get defaultValue() {
			return typeof t == "function" ? t() : ne(t);
		}
	});
}
var xt = /*@__PURE__*/ R("ZodMiniCustom", (e, t) => {
	et.init(e, t), G.init(e, t);
});
// @__NO_SIDE_EFFECTS__
function St(e, t = {}) {
	return /* @__PURE__ */ st(xt, e, t);
}
// src/config.ts
V(rt());
var Ct = "de.datanauten.keyboard_shortcuts", wt = (/* @__PURE__ */ K()).check(/* @__PURE__ */ St((e) => {
	try {
		return l(e), !0;
	} catch {
		return !1;
	}
}, "Invalid key combo, expected something like \"Mod+Shift+K\"")), Tt = /* @__PURE__ */ pt({
	trigger_key: /* @__PURE__ */ J(wt, "?"),
	allow_customisation: /* @__PURE__ */ J(/* @__PURE__ */ ut(), !0),
	hidden_categories: /* @__PURE__ */ J(/* @__PURE__ */ q(/* @__PURE__ */ K()), []),
	hidden_shortcuts: /* @__PURE__ */ J(/* @__PURE__ */ q(/* @__PURE__ */ K()), []),
	extra_shortcuts: /* @__PURE__ */ J(/* @__PURE__ */ q(/* @__PURE__ */ pt({
		id: /* @__PURE__ */ yt(/* @__PURE__ */ K()),
		label: /* @__PURE__ */ ht([/* @__PURE__ */ K(), /* @__PURE__ */ _t(/* @__PURE__ */ K(), /* @__PURE__ */ K())]),
		keys: wt,
		category: /* @__PURE__ */ yt(/* @__PURE__ */ K())
	})), [])
});
function Et(e) {
	return Tt.parse(e ?? {});
}
// src/i18n.ts
var Dt = {
	datanauten_keyboard_shortcuts_title: {
		en: "Keyboard shortcuts",
		de: "Tastenkombinationen"
	},
	datanauten_keyboard_shortcuts_show_shortcuts: {
		en: "Show keyboard shortcuts",
		de: "Tastenkombinationen anzeigen"
	},
	datanauten_keyboard_shortcuts_open_keyboard_settings: {
		en: "Open keyboard settings",
		de: "Tastatur-Einstellungen öffnen"
	},
	datanauten_keyboard_shortcuts_category_custom: {
		en: "More",
		de: "Weitere"
	},
	datanauten_keyboard_shortcuts_filter_placeholder: {
		en: "Search shortcuts",
		de: "Tastenkombinationen suchen"
	},
	datanauten_keyboard_shortcuts_close: {
		en: "Close",
		de: "Schließen"
	},
	datanauten_keyboard_shortcuts_customise: {
		en: "Customise",
		de: "Anpassen"
	},
	datanauten_keyboard_shortcuts_done: {
		en: "Done",
		de: "Fertig"
	},
	datanauten_keyboard_shortcuts_edit: {
		en: "Set a custom shortcut for “%(action)s”",
		de: "Eigene Tastenkombination für „%(action)s“ festlegen"
	},
	datanauten_keyboard_shortcuts_reset: {
		en: "Remove custom shortcut for “%(action)s”",
		de: "Eigene Tastenkombination für „%(action)s“ entfernen"
	},
	datanauten_keyboard_shortcuts_reset_all: {
		en: "Remove all custom shortcuts",
		de: "Alle eigenen Tastenkombinationen entfernen"
	},
	datanauten_keyboard_shortcuts_recording: {
		en: "Press the new shortcut… (Esc to cancel)",
		de: "Neue Tastenkombination drücken … (Esc bricht ab)"
	},
	datanauten_keyboard_shortcuts_needs_modifier: {
		en: "Use at least one of Ctrl, Alt or ⌘ so it doesn't clash with typing.",
		de: "Bitte mindestens Strg, Alt oder ⌘ verwenden, damit es nicht mit dem Tippen kollidiert."
	},
	datanauten_keyboard_shortcuts_conflict: {
		en: "Already used for “%(action)s”.",
		de: "Bereits belegt für „%(action)s“."
	},
	datanauten_keyboard_shortcuts_custom_badge: {
		en: "custom",
		de: "eigene"
	},
	datanauten_keyboard_shortcuts_or: {
		en: "or",
		de: "oder"
	},
	datanauten_keyboard_shortcuts_no_results: {
		en: "No shortcuts match “%(query)s”.",
		de: "Keine Tastenkombination passt zu „%(query)s“."
	},
	datanauten_keyboard_shortcuts_footer_toggle: {
		en: "Press %(key)s to open or close this overview",
		de: "%(key)s öffnet und schließt diese Übersicht"
	},
	datanauten_keyboard_shortcuts_footer_customise: {
		en: "Custom shortcuts work in addition to the defaults and sync across your devices.",
		de: "Eigene Tastenkombinationen gelten zusätzlich zu den Standards und werden zwischen deinen Geräten synchronisiert."
	}
}, Ot = /* @__PURE__ */ new WeakSet();
function kt(e) {
	return e instanceof HTMLElement ? e.isContentEditable || e instanceof HTMLTextAreaElement || e instanceof HTMLSelectElement ? !0 : e instanceof HTMLInputElement ? ![
		"button",
		"checkbox",
		"radio",
		"range",
		"reset",
		"submit",
		"color",
		"file",
		"image"
	].includes(e.type) : e.getAttribute("role") === "textbox" : !1;
}
function At() {
	return document.querySelector("#mx_Dialog_Container > *, #mx_Dialog_StaticContainer > *") !== null;
}
function Y(e, t, n) {
	return !o(t) && t.key.length === 1 ? e.key === t.key && !e.ctrlKey && !e.metaKey && !e.altKey : r(e, t, n);
}
var jt = class {
	options;
	constructor(e) {
		this.options = e;
	}
	start() {
		window.addEventListener("keydown", this.onKeyDown, { capture: !0 });
	}
	stop() {
		window.removeEventListener("keydown", this.onKeyDown, { capture: !0 });
	}
	onKeyDown = (e) => {
		if (Ot.has(e) || e.isComposing || e.defaultPrevented) return;
		let { options: t } = this;
		if (t.isOverlayOpen()) {
			if (t.isInOverlay(e.target)) return;
			(e.key === "Escape" || Y(e, t.trigger, t.isMac)) && (X(e), t.closeOverlay());
		} else if (Y(e, t.trigger, t.isMac) && !kt(e.target) && !At()) X(e), t.toggleOverlay();
		else for (let n of t.getAliases()) if (r(e, n.from, t.isMac)) {
			X(e), Mt(e.target, n.to, t.isMac);
			return;
		}
	};
};
function X(e) {
	e.preventDefault(), e.stopImmediatePropagation();
}
function Mt(e, t, n) {
	let r = e instanceof Node && e.isConnected ? e : document.activeElement ?? document.body, i = new KeyboardEvent("keydown", m(t, n));
	Ot.add(i), r.dispatchEvent(i);
}
// src/platform.ts
var Z = typeof navigator < "u" && navigator.platform.toUpperCase().includes("MAC"), Nt = typeof window < "u" && !!window.electron, Pt = "de.datanauten.keyboard_shortcuts", Ft = "de.datanauten.keyboard_shortcuts.overrides", It = 3e3;
function Lt(e) {
	let t = e?.overrides;
	if (!t || typeof t != "object") return {};
	let n = {};
	for (let [e, r] of Object.entries(t)) if (typeof r == "string") try {
		l(r), n[e] = r;
	} catch {}
	return n;
}
var Rt = class {
	api;
	overrides = {};
	listeners = /* @__PURE__ */ new Set();
	watchable;
	retryTimer;
	constructor(e) {
		this.api = e, this.overrides = this.readLocal();
	}
	start() {
		this.tryAttach() || (this.retryTimer = setInterval(() => {
			this.tryAttach() && clearInterval(this.retryTimer);
		}, It));
	}
	stop() {
		clearInterval(this.retryTimer), this.watchable?.unwatch(this.onRemote);
	}
	getAll() {
		return this.overrides;
	}
	getCombo(e) {
		let t = this.overrides[e];
		return t ? l(t) : void 0;
	}
	async set(e, t) {
		let n = { ...this.overrides };
		t ? n[e] = u(t) : delete n[e], await this.replace(n);
	}
	async clear() {
		await this.replace({});
	}
	subscribe(e) {
		return this.listeners.add(e), () => this.listeners.delete(e);
	}
	async replace(e) {
		if (this.apply(e), !this.watchable) return;
		let t = {
			version: 1,
			overrides: e
		};
		await this.api.client.accountData.set(Pt, t);
	}
	apply(e) {
		this.overrides = e, this.writeLocal(e);
		for (let e of this.listeners) e();
	}
	onRemote = (e) => {
		this.apply(Lt(e));
	};
	tryAttach() {
		if (this.watchable) return !0;
		try {
			this.watchable = this.api.client.accountData.get(Pt);
		} catch {
			return !1;
		}
		return this.watchable.watch(this.onRemote), this.watchable.value === void 0 ? Object.keys(this.overrides).length > 0 && this.replace(this.overrides).catch((e) => console.warn("[keyboard-shortcuts] sync failed", e)) : this.apply(Lt(this.watchable.value)), !0;
	}
	readLocal() {
		try {
			return Lt(JSON.parse(localStorage.getItem(Ft) ?? "null"));
		} catch {
			return {};
		}
	}
	writeLocal(e) {
		try {
			localStorage.setItem(Ft, JSON.stringify({
				version: 1,
				overrides: e
			}));
		} catch {}
	}
}, zt = /* @__PURE__ */ e(((e) => {
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
})), Q = (/* @__PURE__ */ e(((e, t) => {
	t.exports = zt();
})))(), $ = "datanauten_keyboard_shortcuts_";
function Bt(e) {
	let { sections: t, entries: n, isMac: r, trigger: i, allowCustomisation: c, t: l, translateKey: u, onClose: d } = e, f = window.React.useId(), p = window.React.useRef(null), m = window.React.useRef(null), [h, g] = window.React.useState(""), [_, v] = window.React.useState(!1), [y, b] = window.React.useState(null), [x, S] = window.React.useState(null);
	window.React.useEffect(() => m.current?.focus(), []);
	let C = (e) => ee(e, r, u), w = window.React.useMemo(() => {
		let e = h.trim().toLowerCase();
		return e ? n.filter((t) => [
			t.label,
			...C(t.combo),
			...t.custom ? C(t.custom) : []
		].join(" ").toLowerCase().includes(e)) : n;
	}, [
		n,
		h,
		r
	]), te = n.some((e) => e.custom), T = (e) => {
		S(null), b(e);
	}, E = (t, c) => {
		if (t.preventDefault(), t.stopPropagation(), t.key === "Tab") return;
		if (t.key === "Escape") {
			b(null), S(null);
			return;
		}
		let u = s(t.nativeEvent, r);
		if (!u) return;
		if (!o(u)) {
			S({
				id: c.id,
				message: l($ + "needs_modifier")
			});
			return;
		}
		let d = a(u, i, r) && { label: l($ + "show_shortcuts") } || n.find((e) => e.id !== c.id && (a(u, e.combo, r) || e.custom && a(u, e.custom, r)));
		d ? S({
			id: c.id,
			message: l($ + "conflict", { action: d.label })
		}) : (b(null), S(null), e.onSetCustom(c.id, u));
	}, ne = (e) => {
		e.key === "Escape" || Y(e.nativeEvent, i, r) && !kt(e.target) ? (e.preventDefault(), d()) : e.key === "Tab" && Ht(e, p.current);
	}, re = C(i).join("+");
	return /* @__PURE__ */ (0, Q.jsx)("div", {
		className: "ks-backdrop",
		onMouseDown: (e) => e.target === e.currentTarget && d(),
		children: /* @__PURE__ */ (0, Q.jsxs)("div", {
			ref: p,
			className: "ks-panel",
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": f,
			onKeyDown: ne,
			children: [
				/* @__PURE__ */ (0, Q.jsxs)("header", {
					className: "ks-header",
					children: [
						/* @__PURE__ */ (0, Q.jsx)("h2", {
							id: f,
							className: "ks-title",
							children: l($ + "title")
						}),
						/* @__PURE__ */ (0, Q.jsx)("input", {
							ref: m,
							className: "ks-search",
							type: "search",
							value: h,
							placeholder: l($ + "filter_placeholder"),
							"aria-label": l($ + "filter_placeholder"),
							onChange: (e) => g(e.target.value)
						}),
						c && /* @__PURE__ */ (0, Q.jsx)("button", {
							type: "button",
							className: "ks-button" + (_ ? " ks-button--primary" : ""),
							"aria-pressed": _,
							onClick: () => {
								v(!_), b(null), S(null);
							},
							children: l(_ ? $ + "done" : $ + "customise")
						}),
						/* @__PURE__ */ (0, Q.jsx)("button", {
							type: "button",
							className: "ks-close",
							"aria-label": l($ + "close"),
							onClick: d,
							children: "×"
						})
					]
				}),
				/* @__PURE__ */ (0, Q.jsxs)("div", {
					className: "ks-body",
					children: [w.length === 0 && /* @__PURE__ */ (0, Q.jsx)("p", {
						className: "ks-empty",
						children: l($ + "no_results", { query: h })
					}), t.map((t) => {
						let n = w.filter((e) => e.category === t.id);
						return n.length === 0 ? null : /* @__PURE__ */ (0, Q.jsxs)("section", {
							className: "ks-section",
							"aria-label": t.label,
							children: [/* @__PURE__ */ (0, Q.jsx)("h3", {
								className: "ks-section-title",
								children: t.label
							}), /* @__PURE__ */ (0, Q.jsx)("dl", {
								className: "ks-list",
								children: n.map((t) => /* @__PURE__ */ (0, Q.jsxs)("div", {
									className: "ks-row",
									children: [
										/* @__PURE__ */ (0, Q.jsx)("dt", {
											className: "ks-label",
											children: t.label
										}),
										/* @__PURE__ */ (0, Q.jsxs)("dd", {
											className: "ks-keys",
											children: [y === t.id ? /* @__PURE__ */ (0, Q.jsx)("button", {
												type: "button",
												className: "ks-recorder",
												autoFocus: !0,
												onKeyDown: (e) => E(e, t),
												onBlur: () => b(null),
												children: l($ + "recording")
											}) : /* @__PURE__ */ (0, Q.jsxs)(Q.Fragment, { children: [t.custom && /* @__PURE__ */ (0, Q.jsxs)(Q.Fragment, { children: [/* @__PURE__ */ (0, Q.jsx)(Vt, {
												caps: C(t.custom),
												custom: !0,
												title: l($ + "custom_badge")
											}), /* @__PURE__ */ (0, Q.jsx)("span", {
												className: "ks-or",
												children: l($ + "or")
											})] }), /* @__PURE__ */ (0, Q.jsx)(Vt, { caps: C(t.combo) })] }), _ && t.remappable && y !== t.id && /* @__PURE__ */ (0, Q.jsxs)("span", {
												className: "ks-actions",
												children: [/* @__PURE__ */ (0, Q.jsx)("button", {
													type: "button",
													className: "ks-icon-button",
													"aria-label": l($ + "edit", { action: t.label }),
													title: l($ + "edit", { action: t.label }),
													onClick: () => T(t.id),
													children: "✎"
												}), t.custom && /* @__PURE__ */ (0, Q.jsx)("button", {
													type: "button",
													className: "ks-icon-button",
													"aria-label": l($ + "reset", { action: t.label }),
													title: l($ + "reset", { action: t.label }),
													onClick: () => void e.onSetCustom(t.id, null),
													children: "↺"
												})]
											})]
										}),
										x?.id === t.id && /* @__PURE__ */ (0, Q.jsx)("dd", {
											className: "ks-error",
											role: "alert",
											children: x.message
										})
									]
								}, t.id))
							})]
						}, t.id);
					})]
				}),
				/* @__PURE__ */ (0, Q.jsxs)("footer", {
					className: "ks-footer",
					children: [
						/* @__PURE__ */ (0, Q.jsx)("span", { children: l($ + "footer_toggle", { key: re }) }),
						_ && /* @__PURE__ */ (0, Q.jsx)("span", { children: l($ + "footer_customise") }),
						_ && te && /* @__PURE__ */ (0, Q.jsx)("button", {
							type: "button",
							className: "ks-link",
							onClick: () => void e.onResetAll(),
							children: l($ + "reset_all")
						})
					]
				})
			]
		})
	});
}
function Vt({ caps: e, custom: t, title: n }) {
	return /* @__PURE__ */ (0, Q.jsx)("span", {
		className: "ks-combo" + (t ? " ks-combo--custom" : ""),
		title: n,
		children: e.map((e, t) => /* @__PURE__ */ (0, Q.jsx)("kbd", {
			className: "ks-kbd",
			children: e
		}, t))
	});
}
function Ht(e, t) {
	if (!t) return;
	let n = t.querySelectorAll("button, input, [tabindex]:not([tabindex='-1'])");
	if (n.length === 0) return;
	let r = n[0], i = n[n.length - 1];
	e.shiftKey && document.activeElement === r ? (e.preventDefault(), i.focus()) : !e.shiftKey && document.activeElement === i && (e.preventDefault(), r.focus());
}
// src/ui/overlay.css?inline
var Ut = ".ks-backdrop{z-index:5000;font-family:var(--cpd-font-family-sans,Inter, system-ui, sans-serif);background:#0000008c;justify-content:center;align-items:center;padding:24px;animation:.12s ease-out ks-fade;display:flex;position:fixed;inset:0}.ks-panel{background:var(--cpd-color-bg-canvas-default,#fff);width:min(1180px,100%);max-height:min(88vh,100%);color:var(--cpd-color-text-primary,#1b1d22);border-radius:16px;flex-direction:column;animation:.14s ease-out ks-rise;display:flex;overflow:hidden;box-shadow:0 24px 64px #00000059}.ks-header{border-bottom:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);align-items:center;gap:12px;padding:20px 24px 16px;display:flex}.ks-title{margin:0 auto 0 0;font-size:20px;font-weight:600;line-height:28px}.ks-search{border:1px solid var(--cpd-color-border-interactive-primary,#8d97a5);background:var(--cpd-color-bg-canvas-default,#fff);width:min(280px,40vw);height:36px;color:inherit;font:inherit;border-radius:8px;padding:0 12px;font-size:14px}.ks-search:focus-visible,.ks-button:focus-visible,.ks-close:focus-visible,.ks-icon-button:focus-visible,.ks-link:focus-visible,.ks-recorder:focus-visible{outline:2px solid var(--cpd-color-border-focused,#0467dd);outline-offset:1px}.ks-button{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);height:36px;color:inherit;font:inherit;cursor:pointer;background:0 0;border-radius:18px;padding:0 16px;font-size:14px;font-weight:600}.ks-button:hover{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5)}.ks-button--primary,.ks-button--primary:hover{background:var(--cpd-color-bg-action-primary-rest,#1b1d22);color:var(--cpd-color-text-on-solid-primary,#fff);border-color:#0000}.ks-close{width:36px;height:36px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:none;border-radius:50%;font-size:24px;line-height:1}.ks-close:hover{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);color:inherit}.ks-body{columns:3 320px;column-gap:40px;padding:8px 24px 16px;overflow-y:auto}.ks-section{break-inside:avoid;padding-top:16px}.ks-section-title{letter-spacing:.04em;text-transform:uppercase;color:var(--cpd-color-text-action-accent,#0b7e5a);margin:0 0 8px;font-size:13px;font-weight:600}.ks-list{margin:0}.ks-row{border-bottom:1px solid var(--cpd-color-border-interactive-secondary,#eef0f3);break-inside:avoid;grid-template-columns:1fr auto;align-items:center;gap:4px 16px;padding:5px 0;display:grid}.ks-row:last-child{border-bottom:none}.ks-label{color:var(--cpd-color-text-secondary,#4c5562);font-size:14px;line-height:20px}.ks-keys{white-space:nowrap;justify-content:flex-end;align-items:center;gap:6px;margin:0;display:flex}.ks-combo{gap:3px;display:inline-flex}.ks-kbd{border:1px solid var(--cpd-color-border-interactive-secondary,#cdd3da);background:var(--cpd-color-bg-subtle-secondary,#f6f7f9);min-width:22px;color:var(--cpd-color-text-primary,#1b1d22);font-family:var(--cpd-font-family-sans,Inter, system-ui, sans-serif);text-align:center;border-bottom-width:2px;border-radius:5px;padding:1px 6px;font-size:12px;font-weight:600;line-height:18px;display:inline-block}.ks-combo--custom .ks-kbd{border-color:var(--cpd-color-border-accent-subtle,#0b7e5a);background:var(--cpd-color-bg-success-subtle,#e3f7ed);color:var(--cpd-color-text-action-accent,#0b7e5a)}.ks-or{color:var(--cpd-color-text-secondary,#656d77);font-size:12px}.ks-actions{gap:2px;margin-left:4px;display:inline-flex}.ks-icon-button{width:26px;height:26px;color:var(--cpd-color-icon-secondary,#656d77);cursor:pointer;background:0 0;border:none;border-radius:6px;font-size:15px}.ks-icon-button:hover{background:var(--cpd-color-bg-subtle-secondary,#f0f2f5);color:var(--cpd-color-text-primary,#1b1d22)}.ks-recorder{border:1px dashed var(--cpd-color-border-accent-subtle,#0b7e5a);background:var(--cpd-color-bg-success-subtle,#e3f7ed);color:var(--cpd-color-text-action-accent,#0b7e5a);font:inherit;cursor:text;border-radius:6px;padding:2px 10px;font-size:12px;font-weight:600}.ks-error{text-align:right;color:var(--cpd-color-text-critical-primary,#d51928);grid-column:1/-1;margin:0;font-size:12px}.ks-empty{color:var(--cpd-color-text-secondary,#656d77);margin:24px 0}.ks-footer{border-top:1px solid var(--cpd-color-border-interactive-secondary,#e1e6ec);color:var(--cpd-color-text-secondary,#656d77);flex-wrap:wrap;align-items:center;gap:8px 24px;padding:12px 24px;font-size:12px;display:flex}.ks-link{color:var(--cpd-color-text-critical-primary,#d51928);font:inherit;cursor:pointer;background:0 0;border:none;margin-left:auto;padding:0}.ks-link:hover{text-decoration:underline}@media (width<=600px){.ks-backdrop{padding:0}.ks-panel{border-radius:0;height:100%;max-height:100%}.ks-header{flex-wrap:wrap}.ks-search{order:3;width:100%}}@media (prefers-reduced-motion:reduce){.ks-backdrop,.ks-panel{animation:none}}@keyframes ks-fade{0%{opacity:0}}@keyframes ks-rise{0%{opacity:0;transform:translateY(8px)scale(.99)}}", Wt = "de-datanauten-keyboard-shortcuts-style", Gt = class {
	api;
	static moduleApiVersion = "^2.0.0";
	config;
	trigger;
	catalog = [];
	store;
	controller;
	aliases = [];
	container;
	root;
	restoreFocus;
	constructor(e) {
		this.api = e;
	}
	async load() {
		try {
			this.config = Et(this.api.config.get(Ct));
		} catch (e) {
			throw console.error(`[keyboard-shortcuts] Invalid "${Ct}" config`, e), Error("Errors in module configuration for the keyboard shortcuts module");
		}
		this.trigger = l(this.config.trigger_key), this.api.i18n.register(Dt), qt(), this.catalog = v({
			isMac: Z,
			isElectron: Nt,
			ctrlEnterToSend: !1
		}), this.store = new Rt(this.api), this.store.subscribe(() => this.updateAliases()), this.updateAliases(), this.store.start(), this.controller = new jt({
			isMac: Z,
			trigger: this.trigger,
			getAliases: () => this.aliases,
			isOverlayOpen: () => this.root !== void 0,
			isInOverlay: (e) => e instanceof Node && !!this.container?.contains(e),
			toggleOverlay: () => this.root ? this.close() : this.open(),
			closeOverlay: () => this.close()
		}), this.controller.start();
	}
	dispose() {
		this.close(), this.controller?.stop(), this.store?.stop();
	}
	open() {
		this.root || (this.restoreFocus = document.activeElement, this.container = document.createElement("div"), this.container.className = "de-datanauten-keyboard-shortcuts", document.body.appendChild(this.container), this.container.addEventListener("keydown", (e) => e.stopPropagation()), this.root = this.api.createRoot(this.container), this.root.render(/* @__PURE__ */ (0, Q.jsx)(this.App, {})));
	}
	close() {
		this.root?.unmount(), this.container?.remove(), this.root = void 0, this.container = void 0, this.restoreFocus?.focus?.();
	}
	updateAliases() {
		if (!this.config.allow_customisation) {
			this.aliases = [];
			return;
		}
		let e = this.store.getAll();
		this.aliases = this.catalog.filter((t) => t.remappable && e[t.id]).map((t) => ({
			from: l(e[t.id]),
			to: t.combo
		}));
	}
	translateKey = (e, t) => {
		let n = this.api.i18n.translate(e);
		return n && n !== e ? n : t;
	};
	t = (e, t) => this.api.i18n.translate(e, t);
	localise(e) {
		if (typeof e == "string") return e;
		let t = this.api.i18n.language;
		return e[t] ?? e[t.split("-")[0]] ?? e.en ?? Object.values(e)[0] ?? "";
	}
	showLabs() {
		return !!(this.api.config.get().show_labs_settings || this.api.settings?.getValue("developerMode"));
	}
	buildView() {
		let e = new Set(this.config.hidden_categories);
		this.showLabs() || e.add("labs");
		let t = new Set(this.config.hidden_shortcuts), n = this.store.getAll(), r = v({
			isMac: Z,
			isElectron: Nt,
			ctrlEnterToSend: !!this.api.settings?.getValue("MessageComposerInput.ctrlEnterToSend")
		}).filter((e) => !t.has(e.id)).map((e) => ({
			id: e.id,
			category: e.category,
			label: this.translateKey(e.labelKey, e.fallback),
			combo: e.id === "de.datanauten.keyboard_shortcuts.show" ? this.trigger : e.combo,
			custom: this.config.allow_customisation && e.remappable && n[e.id] ? l(n[e.id]) : void 0,
			remappable: e.remappable
		})), i = new Set(h.map((e) => e.id)), a = this.config.extra_shortcuts.map((e, t) => {
			let n = this.localise(e.label);
			return {
				id: `extra:${e.id ?? n ?? t}`,
				category: e.category && i.has(e.category) ? e.category : "custom",
				label: n,
				combo: l(e.keys),
				remappable: !1
			};
		}), o = [...r, ...a].filter((t) => !e.has(t.category));
		return {
			sections: h.filter((t) => !e.has(t.id)).map((e) => ({
				id: e.id,
				label: this.translateKey(e.labelKey, e.fallback)
			})),
			entries: o
		};
	}
	App = () => {
		window.React.useSyncExternalStore((e) => this.store.subscribe(e), () => this.store.getAll());
		let { sections: e, entries: t } = this.buildView();
		return /* @__PURE__ */ (0, Q.jsx)(Bt, {
			sections: e,
			entries: t,
			isMac: Z,
			trigger: this.trigger,
			allowCustomisation: this.config.allow_customisation,
			t: this.t,
			translateKey: this.translateKey,
			onSetCustom: (e, t) => this.store.set(e, t).catch(Kt),
			onResetAll: () => this.store.clear().catch(Kt),
			onClose: () => this.close()
		});
	};
};
function Kt(e) {
	console.error("[keyboard-shortcuts] Saving custom shortcuts to account data failed", e);
}
function qt() {
	if (document.getElementById(Wt)) return;
	let e = document.createElement("style");
	e.id = Wt, e.textContent = Ut, document.head.appendChild(e);
}
export { Gt as KeyboardShortcutsModule, Gt as default };

//# sourceMappingURL=index.js.map