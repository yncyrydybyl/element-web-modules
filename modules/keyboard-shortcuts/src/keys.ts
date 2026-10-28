/**
 * Key combos: matching, recording, parsing and display.
 *
 * `KeyCombo` deliberately has the same shape as Element Web's `KeyCombo` (src/KeyBindingsManager.ts)
 * so catalog entries can be copied over verbatim, and `matchesCombo` follows the same rules as
 * Element's `isKeyComboMatch`.
 */

export type KeyCombo = {
    key: string;
    /** On PC: ctrl is pressed; on Mac: meta (⌘) is pressed */
    ctrlOrCmdKey?: boolean;
    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
};

type KeyEventLike = Pick<KeyboardEvent, "key" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey">;

/** Meta-key used by Element for "Ctrl + [0-9]". Matches any digit. */
export const DIGITS = "digits";

const MODIFIER_KEYS = new Set(["Control", "Alt", "AltGraph", "Shift", "Meta", "OS", "Hyper", "Super", "CapsLock"]);

export function matchesCombo(ev: KeyEventLike, combo: KeyCombo, onMac: boolean): boolean {
    if (!ev.key) return false;
    if (combo.key === DIGITS) {
        if (!/^[0-9]$/.test(ev.key)) return false;
    } else if (ev.key.toLowerCase() !== combo.key.toLowerCase()) {
        return false;
    }

    const comboCtrl = combo.ctrlKey ?? false;
    const comboAlt = combo.altKey ?? false;
    const comboShift = combo.shiftKey ?? false;
    const comboMeta = combo.metaKey ?? false;
    const evCtrl = ev.ctrlKey ?? false;
    const evAlt = ev.altKey ?? false;
    const evShift = ev.shiftKey ?? false;
    const evMeta = ev.metaKey ?? false;

    if (combo.ctrlOrCmdKey) {
        if (onMac) {
            return evMeta && evCtrl === comboCtrl && evAlt === comboAlt && evShift === comboShift;
        }
        return evCtrl && evMeta === comboMeta && evAlt === comboAlt && evShift === comboShift;
    }
    return evMeta === comboMeta && evCtrl === comboCtrl && evAlt === comboAlt && evShift === comboShift;
}

/** Normalises a combo so that two combos describing the same physical keys compare equal. */
export function normaliseCombo(combo: KeyCombo, onMac: boolean): Required<Omit<KeyCombo, "ctrlOrCmdKey">> {
    return {
        key: combo.key.length === 1 ? combo.key.toLowerCase() : combo.key,
        ctrlKey: Boolean(combo.ctrlKey || (combo.ctrlOrCmdKey && !onMac)),
        metaKey: Boolean(combo.metaKey || (combo.ctrlOrCmdKey && onMac)),
        altKey: Boolean(combo.altKey),
        shiftKey: Boolean(combo.shiftKey),
    };
}

export function combosEqual(a: KeyCombo, b: KeyCombo, onMac: boolean): boolean {
    const na = normaliseCombo(a, onMac);
    const nb = normaliseCombo(b, onMac);
    return (
        na.key === nb.key &&
        na.ctrlKey === nb.ctrlKey &&
        na.metaKey === nb.metaKey &&
        na.altKey === nb.altKey &&
        na.shiftKey === nb.shiftKey
    );
}

export function hasModifier(combo: KeyCombo): boolean {
    return Boolean(combo.ctrlOrCmdKey || combo.ctrlKey || combo.metaKey || combo.altKey);
}

/**
 * Turns a keydown event into a combo, for recording a custom shortcut.
 * The platform's primary modifier (Ctrl on PC, ⌘ on Mac) is stored as `ctrlOrCmdKey` so a
 * combo recorded on one platform means the same thing on the other.
 * Returns null while only modifiers are held down.
 */
export function comboFromEvent(ev: KeyEventLike, onMac: boolean): KeyCombo | null {
    if (!ev.key || MODIFIER_KEYS.has(ev.key) || ev.key === "Dead" || ev.key === "Unidentified") return null;
    const combo: KeyCombo = { key: ev.key.length === 1 ? ev.key.toLowerCase() : ev.key };
    const primary = onMac ? ev.metaKey : ev.ctrlKey;
    if (primary) combo.ctrlOrCmdKey = true;
    if (onMac && ev.ctrlKey) combo.ctrlKey = true;
    if (!onMac && ev.metaKey) combo.metaKey = true;
    if (ev.altKey) combo.altKey = true;
    if (ev.shiftKey) combo.shiftKey = true;
    return combo;
}

const PARSE_ALIASES: Record<string, string> = {
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
    plus: "+",
};

/**
 * Parses a human-written combo such as "Mod+Shift+K", "Ctrl+Alt+Up" or "?".
 * `Mod` / `CtrlOrCmd` mean Ctrl on PC and ⌘ on Mac.
 * Throws on unknown modifiers so config typos fail loudly.
 */
export function parseCombo(input: string): KeyCombo {
    const trimmed = input.trim();
    if (!trimmed) throw new Error("Empty key combo");
    // A lone "+" or a combo ending in "++" means the plus key.
    const parts = trimmed === "+" ? ["+"] : trimmed.endsWith("++") ? [...trimmed.slice(0, -2).split("+"), "+"] : trimmed.split("+");
    const keyPart = parts.pop()!.trim();
    const combo: KeyCombo = { key: "" };
    for (const raw of parts) {
        const mod = raw.trim().toLowerCase();
        if (mod === "mod" || mod === "ctrlorcmd" || mod === "cmdorctrl") combo.ctrlOrCmdKey = true;
        else if (mod === "ctrl" || mod === "control") combo.ctrlKey = true;
        else if (mod === "cmd" || mod === "meta" || mod === "super" || mod === "win") combo.metaKey = true;
        else if (mod === "alt" || mod === "option" || mod === "opt") combo.altKey = true;
        else if (mod === "shift") combo.shiftKey = true;
        else throw new Error(`Unknown modifier "${raw}" in key combo "${input}"`);
    }
    if (!keyPart) throw new Error(`Missing key in key combo "${input}"`);
    const alias = PARSE_ALIASES[keyPart.toLowerCase()];
    combo.key = alias ?? (keyPart.length === 1 ? keyPart.toLowerCase() : keyPart);
    return combo;
}

/** Serialises a combo into the format accepted by `parseCombo`. */
export function stringifyCombo(combo: KeyCombo): string {
    const parts: string[] = [];
    if (combo.ctrlOrCmdKey) parts.push("Mod");
    if (combo.ctrlKey) parts.push("Ctrl");
    if (combo.metaKey) parts.push("Meta");
    if (combo.altKey) parts.push("Alt");
    if (combo.shiftKey) parts.push("Shift");
    parts.push(combo.key === " " ? "Space" : combo.key === "+" ? "Plus" : combo.key.length === 1 ? combo.key.toUpperCase() : combo.key);
    return parts.join("+");
}

/** Translation function: returns the translation for an Element/module key, or `fallback`. */
export type Translate = (key: string, fallback: string) => string;

const KEY_ICONS: Record<string, string> = {
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
};

// Element's own translation keys for key names, so key caps are localised like in Settings.
const KEY_NAMES: Record<string, [string, string]> = {
    PageUp: ["keyboard|page_up", "Page Up"],
    PageDown: ["keyboard|page_down", "Page Down"],
    Escape: ["keyboard|escape", "Esc"],
    Enter: ["keyboard|enter", "Enter"],
    " ": ["keyboard|space", "Space"],
    Home: ["keyboard|home", "Home"],
    End: ["keyboard|end", "End"],
    Backspace: ["keyboard|backspace", "Backspace"],
    [DIGITS]: ["keyboard|number", "[number]"],
};

function keyLabel(key: string, t: Translate): string {
    if (KEY_ICONS[key]) return KEY_ICONS[key];
    const named = KEY_NAMES[key];
    if (named) return t(named[0], named[1]);
    return key.length === 1 ? key.toUpperCase() : key;
}

/** The individual key caps to render for a combo, e.g. ["Ctrl", "Shift", "L"] or ["⌘", "⇧", "L"]. */
export function comboToKeyCaps(combo: KeyCombo, onMac: boolean, t: Translate): string[] {
    const caps: string[] = [];
    const ctrl = t("keyboard|control", "Ctrl");
    const alt = onMac ? "⌥" : t("keyboard|alt", "Alt");
    const shift = onMac ? "⇧" : t("keyboard|shift", "Shift");
    if (combo.ctrlOrCmdKey) caps.push(onMac ? "⌘" : ctrl);
    if (combo.ctrlKey) caps.push(onMac ? "⌃" : ctrl);
    if (combo.metaKey) caps.push(onMac ? "⌘" : "Meta");
    if (combo.altKey) caps.push(alt);
    if (combo.shiftKey) caps.push(shift);
    caps.push(keyLabel(combo.key, t));
    return caps;
}

/** Event init for replaying a combo as a synthetic keydown, used by the remapper. */
export function comboToEventInit(combo: KeyCombo, onMac: boolean): KeyboardEventInit {
    const n = normaliseCombo(combo, onMac);
    return {
        key: combo.key.length === 1 && n.shiftKey ? combo.key.toUpperCase() : combo.key,
        ctrlKey: n.ctrlKey,
        metaKey: n.metaKey,
        altKey: n.altKey,
        shiftKey: n.shiftKey,
        bubbles: true,
        cancelable: true,
        composed: true,
    };
}
