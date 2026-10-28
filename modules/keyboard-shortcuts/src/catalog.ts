/**
 * The catalog of Element Web's built-in keyboard shortcuts.
 *
 * Element Web does not expose its shortcut table through the module API, so this mirrors
 * `apps/web/src/accessibility/KeyboardShortcuts.ts` (KEYBOARD_SHORTCUTS, CATEGORIES) and
 * `KeyboardShortcutUtils.ts` (getUIOnlyShortcuts) from element-web develop @ 2026-09.
 * When Element adds or changes a shortcut, update this file. See docs/ARCHITECTURE.md.
 *
 * `id` is Element's `KeyBindingAction` value and `labelKey` is Element's own translation key,
 * so labels come out in the user's language without this module shipping translations.
 */

import { DIGITS, type KeyCombo } from "./keys";

export type CategoryId =
    | "navigation"
    | "room"
    | "composer"
    | "room_list"
    | "calls"
    | "autocomplete"
    | "accessibility"
    | "labs"
    | "custom";

export interface Category {
    id: CategoryId;
    labelKey: string;
    fallback: string;
}

/** Display order, roughly most-used first (like Gmail's overlay). */
export const CATEGORIES: Category[] = [
    { id: "navigation", labelKey: "keyboard|category_navigation", fallback: "Navigation" },
    { id: "room", labelKey: "common|room", fallback: "Room" },
    { id: "composer", labelKey: "settings|preferences|composer_heading", fallback: "Composer" },
    { id: "room_list", labelKey: "keyboard|category_room_list", fallback: "Room List" },
    { id: "calls", labelKey: "keyboard|category_calls", fallback: "Calls" },
    { id: "autocomplete", labelKey: "keyboard|category_autocomplete", fallback: "Autocomplete" },
    { id: "accessibility", labelKey: "common|accessibility", fallback: "Accessibility" },
    { id: "labs", labelKey: "common|labs", fallback: "Labs" },
    { id: "custom", labelKey: "datanauten_keyboard_shortcuts_category_custom", fallback: "More" },
];

/** Runtime facts some default combos depend on. */
export interface CatalogContext {
    isMac: boolean;
    isElectron: boolean;
    /** Element setting `MessageComposerInput.ctrlEnterToSend` */
    ctrlEnterToSend: boolean;
}

export interface Shortcut {
    /** Element's KeyBindingAction (e.g. "KeyBinding.toggleBoldInComposer"), or a custom id. */
    id: string;
    category: CategoryId;
    labelKey: string;
    fallback: string;
    combo: KeyCombo;
    /**
     * Whether users may add their own combo for it. Only global, unambiguous actions are
     * remappable; context-dependent keys (arrows, Enter, Esc, …) are not.
     */
    remappable: boolean;
}

interface Definition {
    id: string;
    category: CategoryId;
    labelKey: string;
    fallback: string;
    combo: KeyCombo | ((ctx: CatalogContext) => KeyCombo);
    remappable?: boolean;
    /** Only offered when the condition holds (mirrors DESKTOP_SHORTCUTS / MAC_ONLY_SHORTCUTS). */
    when?: (ctx: CatalogContext) => boolean;
}

const desktopOnly = (ctx: CatalogContext): boolean => ctx.isElectron;

const DEFINITIONS: Definition[] = [
    // Navigation
    { id: "de.datanauten.keyboard_shortcuts.show", category: "navigation", labelKey: "datanauten_keyboard_shortcuts_show_shortcuts", fallback: "Show keyboard shortcuts", combo: { key: "?", shiftKey: true } },
    { id: "KeyBinding.toggleTopLeftMenu", category: "navigation", labelKey: "keyboard|toggle_top_left_menu", fallback: "Toggle the top left menu", combo: { ctrlOrCmdKey: true, key: "`" }, remappable: true },
    { id: "KeyBinding.toggleRightPanel", category: "navigation", labelKey: "keyboard|toggle_right_panel", fallback: "Toggle right panel", combo: { ctrlOrCmdKey: true, key: "." }, remappable: true },
    { id: "KeyBinding.toggleSpacePanel", category: "navigation", labelKey: "keyboard|toggle_space_panel", fallback: "Toggle space panel", combo: { ctrlOrCmdKey: true, shiftKey: true, key: "d" }, remappable: true },
    // Element's own label ("Open this settings tab") only makes sense inside Settings.
    { id: "KeyBinding.showKeyBindingsSettings", category: "navigation", labelKey: "datanauten_keyboard_shortcuts_open_keyboard_settings", fallback: "Open keyboard settings", combo: { ctrlOrCmdKey: true, key: "/" }, remappable: true },
    { id: "KeyBinding.goToHomeView", category: "navigation", labelKey: "keyboard|go_home_view", fallback: "Go to Home View", combo: (ctx) => ({ ctrlKey: true, altKey: !ctx.isMac, shiftKey: ctx.isMac, key: "h" }), remappable: true },
    { id: "KeyBinding.filterRooms", category: "navigation", labelKey: "keyboard|jump_room_search", fallback: "Jump to room search", combo: { ctrlOrCmdKey: true, key: "k" }, remappable: true },
    { id: "KeyBinding.nextUnreadRoom", category: "navigation", labelKey: "keyboard|next_unread_room", fallback: "Next unread room or DM", combo: { shiftKey: true, altKey: true, key: "ArrowDown" }, remappable: true },
    { id: "KeyBinding.previousUnreadRoom", category: "navigation", labelKey: "keyboard|prev_unread_room", fallback: "Previous unread room or DM", combo: { shiftKey: true, altKey: true, key: "ArrowUp" }, remappable: true },
    { id: "KeyBinding.nextRoom", category: "navigation", labelKey: "keyboard|next_room", fallback: "Next room or DM", combo: { altKey: true, key: "ArrowDown" }, remappable: true },
    { id: "KeyBinding.previousRoom", category: "navigation", labelKey: "keyboard|prev_room", fallback: "Previous room or DM", combo: { altKey: true, key: "ArrowUp" }, remappable: true },
    { id: "KeyBinding.openUserSettings", category: "navigation", labelKey: "keyboard|open_user_settings", fallback: "Open user settings", combo: { metaKey: true, key: "," }, remappable: true, when: (ctx) => ctx.isElectron && ctx.isMac },
    { id: "KeyBinding.switchToSpaceByNumber", category: "navigation", labelKey: "keyboard|switch_to_space", fallback: "Switch to space by number", combo: { ctrlOrCmdKey: true, key: DIGITS }, when: desktopOnly },
    { id: "KeyBinding.PreviousVisitedRoomOrSpace", category: "navigation", labelKey: "keyboard|navigate_prev_history", fallback: "Previous recently visited room or space", combo: (ctx) => ({ metaKey: ctx.isMac, altKey: !ctx.isMac, key: ctx.isMac ? "[" : "ArrowLeft" }), remappable: true, when: desktopOnly },
    { id: "KeyBinding.NextVisitedRoomOrSpace", category: "navigation", labelKey: "keyboard|navigate_next_history", fallback: "Next recently visited room or space", combo: (ctx) => ({ metaKey: ctx.isMac, altKey: !ctx.isMac, key: ctx.isMac ? "]" : "ArrowRight" }), remappable: true, when: desktopOnly },
    { id: "KeyBinding.nextLandmark", category: "navigation", labelKey: "keyboard|next_landmark", fallback: "Go to next landmark", combo: (ctx) => ({ ctrlOrCmdKey: !ctx.isElectron, key: "F6" }), remappable: true },
    { id: "KeyBinding.previousLandmark", category: "navigation", labelKey: "keyboard|prev_landmark", fallback: "Go to previous landmark", combo: (ctx) => ({ ctrlOrCmdKey: !ctx.isElectron, shiftKey: true, key: "F6" }), remappable: true },

    // Room
    { id: "KeyBinding.searchInRoom", category: "room", labelKey: "keyboard|search", fallback: "Search (must be enabled)", combo: { ctrlOrCmdKey: true, key: "f" } },
    { id: "KeyBinding.uploadFileToRoom", category: "room", labelKey: "keyboard|upload_file", fallback: "Upload a file", combo: { ctrlOrCmdKey: true, shiftKey: true, key: "u" }, remappable: true },
    { id: "KeyBinding.dismissReadMarkerAndJumpToBottom", category: "room", labelKey: "keyboard|dismiss_read_marker_and_jump_bottom", fallback: "Dismiss read marker and jump to bottom", combo: { key: "Escape" } },
    { id: "KeyBinding.jumpToOldestUnreadMessage", category: "room", labelKey: "keyboard|jump_to_read_marker", fallback: "Jump to oldest unread message", combo: { shiftKey: true, key: "PageUp" }, remappable: true },
    { id: "KeyBinding.scrollUpInTimeline", category: "room", labelKey: "keyboard|scroll_up_timeline", fallback: "Scroll up in the timeline", combo: { key: "PageUp" } },
    { id: "KeyBinding.scrollDownInTimeline", category: "room", labelKey: "keyboard|scroll_down_timeline", fallback: "Scroll down in the timeline", combo: { key: "PageDown" } },
    { id: "KeyBinding.jumpToFirstMessageInTimeline", category: "room", labelKey: "keyboard|jump_first_message", fallback: "Jump to first message", combo: { ctrlKey: true, key: "Home" }, remappable: true },
    { id: "KeyBinding.jumpToLastMessageInTimeline", category: "room", labelKey: "keyboard|jump_last_message", fallback: "Jump to last message", combo: { ctrlKey: true, key: "End" }, remappable: true },

    // Composer
    { id: "KeyBinding.sendMessageInComposer", category: "composer", labelKey: "composer|send_button_title", fallback: "Send message", combo: (ctx) => ({ key: "Enter", ctrlOrCmdKey: ctx.ctrlEnterToSend }) },
    { id: "KeyBinding.newLineInComposer", category: "composer", labelKey: "keyboard|composer_new_line", fallback: "New line", combo: (ctx) => ({ key: "Enter", shiftKey: !ctx.ctrlEnterToSend }) },
    { id: "KeyBinding.toggleBoldInComposer", category: "composer", labelKey: "keyboard|composer_toggle_bold", fallback: "Toggle Bold", combo: { ctrlOrCmdKey: true, key: "b" }, remappable: true },
    { id: "KeyBinding.toggleItalicsInComposer", category: "composer", labelKey: "keyboard|composer_toggle_italics", fallback: "Toggle Italics", combo: { ctrlOrCmdKey: true, key: "i" }, remappable: true },
    { id: "KeyBinding.toggleQuoteInComposer", category: "composer", labelKey: "keyboard|composer_toggle_quote", fallback: "Toggle Quote", combo: { ctrlOrCmdKey: true, shiftKey: true, key: ">" }, remappable: true },
    { id: "KeyBinding.FormatLink", category: "composer", labelKey: "keyboard|composer_toggle_link", fallback: "Toggle Link", combo: { ctrlOrCmdKey: true, shiftKey: true, key: "l" }, remappable: true },
    { id: "KeyBinding.FormatCode", category: "composer", labelKey: "keyboard|composer_toggle_code_block", fallback: "Toggle Code Block", combo: { ctrlOrCmdKey: true, key: "e" }, remappable: true },
    { id: "KeyBinding.editUndoInComposer", category: "composer", labelKey: "keyboard|composer_undo", fallback: "Undo edit", combo: { ctrlOrCmdKey: true, key: "z" } },
    { id: "KeyBinding.editRedoInComposer", category: "composer", labelKey: "keyboard|composer_redo", fallback: "Redo edit", combo: (ctx) => ({ ctrlOrCmdKey: true, shiftKey: ctx.isMac, key: ctx.isMac ? "z" : "y" }) },
    { id: "KeyBinding.jumpToStartInComposer", category: "composer", labelKey: "keyboard|composer_jump_start", fallback: "Jump to start of the composer", combo: { ctrlOrCmdKey: true, key: "Home" } },
    { id: "KeyBinding.jumpToEndInComposer", category: "composer", labelKey: "keyboard|composer_jump_end", fallback: "Jump to end of the composer", combo: { ctrlOrCmdKey: true, key: "End" } },
    { id: "KeyBinding.cancelReplyInComposer", category: "composer", labelKey: "keyboard|cancel_reply", fallback: "Cancel replying to a message", combo: { key: "Escape" } },
    { id: "KeyBinding.editNextMessage", category: "composer", labelKey: "keyboard|navigate_next_message_edit", fallback: "Navigate to next message to edit", combo: { key: "ArrowDown" } },
    { id: "KeyBinding.editPreviousMessage", category: "composer", labelKey: "keyboard|navigate_prev_message_edit", fallback: "Navigate to previous message to edit", combo: { key: "ArrowUp" } },
    { id: "KeyBinding.nextMessageInComposerHistory", category: "composer", labelKey: "keyboard|composer_navigate_next_history", fallback: "Navigate to next message in composer history", combo: { altKey: true, ctrlKey: true, key: "ArrowDown" } },
    { id: "KeyBinding.previousMessageInComposerHistory", category: "composer", labelKey: "keyboard|composer_navigate_prev_history", fallback: "Navigate to previous message in composer history", combo: { altKey: true, ctrlKey: true, key: "ArrowUp" } },
    { id: "KeyBinding.showStickerPicker", category: "composer", labelKey: "keyboard|send_sticker", fallback: "Send a sticker", combo: { ctrlOrCmdKey: true, key: ";" }, remappable: true },

    // Room list
    { id: "KeyBinding.selectRoomInRoomList", category: "room_list", labelKey: "keyboard|room_list_select_room", fallback: "Select room from the room list", combo: { key: "Enter" } },
    { id: "KeyBinding.collapseSectionInRoomList", category: "room_list", labelKey: "keyboard|room_list_collapse_section", fallback: "Collapse room list section", combo: { key: "ArrowLeft" } },
    { id: "KeyBinding.expandSectionInRoomList", category: "room_list", labelKey: "keyboard|room_list_expand_section", fallback: "Expand room list section", combo: { key: "ArrowRight" } },
    { id: "KeyBinding.upperRoom", category: "room_list", labelKey: "keyboard|room_list_navigate_down", fallback: "Navigate down in the room list", combo: { key: "ArrowDown" } },
    { id: "KeyBinding.downerRoom", category: "room_list", labelKey: "keyboard|room_list_navigate_up", fallback: "Navigate up in the room list", combo: { key: "ArrowUp" } },

    // Calls
    { id: "KeyBinding.toggleMicInCall", category: "calls", labelKey: "keyboard|toggle_microphone_mute", fallback: "Toggle microphone mute", combo: { ctrlOrCmdKey: true, key: "d" }, remappable: true },
    { id: "KeyBinding.toggleWebcamInCall", category: "calls", labelKey: "keyboard|toggle_webcam_mute", fallback: "Toggle webcam on/off", combo: { ctrlOrCmdKey: true, key: "e" }, remappable: true },

    // Autocomplete
    { id: "KeyBinding.cancelAutoComplete", category: "autocomplete", labelKey: "keyboard|autocomplete_cancel", fallback: "Cancel autocomplete", combo: { key: "Escape" } },
    { id: "KeyBinding.nextOptionInAutoComplete", category: "autocomplete", labelKey: "keyboard|autocomplete_navigate_next", fallback: "Next autocomplete suggestion", combo: { key: "ArrowDown" } },
    { id: "KeyBinding.previousOptionInAutoComplete", category: "autocomplete", labelKey: "keyboard|autocomplete_navigate_prev", fallback: "Previous autocomplete suggestion", combo: { key: "ArrowUp" } },
    { id: "KeyBinding.completeAutocomplete", category: "autocomplete", labelKey: "action|complete", fallback: "Complete", combo: { key: "Enter" } },
    { id: "KeyBinding.forceCompleteAutocomplete", category: "autocomplete", labelKey: "keyboard|autocomplete_force", fallback: "Force complete", combo: { key: "Tab" } },

    // Accessibility (Element only lists the ones that have a display name)
    { id: "KeyBinding.escape", category: "accessibility", labelKey: "keyboard|close_dialog_menu", fallback: "Close dialog or context menu", combo: { key: "Escape" } },
    { id: "KeyBinding.enter", category: "accessibility", labelKey: "keyboard|activate_button", fallback: "Activate selected button", combo: { key: "Enter" } },
    { id: "KeyBinding.save", category: "accessibility", labelKey: "keyboard|save", fallback: "Save", combo: { ctrlOrCmdKey: true, key: "s" } },

    // Labs
    { id: "KeyBinding.toggleHiddenEventVisibility", category: "labs", labelKey: "keyboard|toggle_hidden_events", fallback: "Toggle hidden event visibility", combo: { ctrlKey: true, shiftKey: true, key: "j" }, remappable: true },
];

/** Builds the list of shortcuts that apply on this platform. */
export function buildCatalog(ctx: CatalogContext): Shortcut[] {
    return DEFINITIONS.filter((d) => !d.when || d.when(ctx)).map((d) => ({
        id: d.id,
        category: d.category,
        labelKey: d.labelKey,
        fallback: d.fallback,
        combo: typeof d.combo === "function" ? d.combo(ctx) : d.combo,
        remappable: d.remappable ?? false,
    }));
}

/** The id of this module's own "show overlay" entry, which shows the configured trigger key. */
export const SHOW_OVERLAY_ID = "de.datanauten.keyboard_shortcuts.show";
