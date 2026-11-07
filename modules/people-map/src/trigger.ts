/** Same detection as Element Web's `src/Keyboard.ts`. */
export const IS_MAC = typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");

export interface Combo {
    key: string;
    ctrl: boolean;
    meta: boolean;
    alt: boolean;
    shift: boolean;
}

/**
 * Parses "Mod+I", "Ctrl+Shift+M", "Alt+M". `Mod` is ⌘ on macOS and Ctrl elsewhere, the same
 * syntax as the keyboard-shortcuts module.
 */
export function parseCombo(text: string, isMac = IS_MAC): Combo {
    const parts = text.split("+").map((p) => p.trim());
    const key = parts.pop();
    if (!key) throw new Error(`Invalid key combo "${text}"`);
    const combo: Combo = { key: key.length === 1 ? key.toLowerCase() : key, ctrl: false, meta: false, alt: false, shift: false };
    for (const mod of parts.map((p) => p.toLowerCase())) {
        if (mod === "mod") combo[isMac ? "meta" : "ctrl"] = true;
        else if (mod === "ctrl" || mod === "control") combo.ctrl = true;
        else if (mod === "meta" || mod === "cmd" || mod === "command") combo.meta = true;
        else if (mod === "alt" || mod === "option") combo.alt = true;
        else if (mod === "shift") combo.shift = true;
        else throw new Error(`Unknown modifier "${mod}" in "${text}"`);
    }
    return combo;
}

export function matchesCombo(ev: KeyboardEvent, combo: Combo): boolean {
    const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    // ev.code as well, so Ctrl+I still works on layouts where that key isn't "i".
    const code = /^Key[A-Z]$/.test(ev.code) ? ev.code.slice(3).toLowerCase() : undefined;
    return (
        (key === combo.key || (!/^[a-z]$/.test(key) && code === combo.key)) &&
        ev.ctrlKey === combo.ctrl &&
        ev.metaKey === combo.meta &&
        ev.altKey === combo.alt &&
        ev.shiftKey === combo.shift
    );
}

export function comboLabel(combo: Combo, isMac = IS_MAC): string {
    const mods = [combo.ctrl && (isMac ? "⌃" : "Ctrl"), combo.alt && (isMac ? "⌥" : "Alt"), combo.shift && (isMac ? "⇧" : "Shift"), combo.meta && (isMac ? "⌘" : "Meta")];
    const key = combo.key.length === 1 ? combo.key.toUpperCase() : combo.key;
    return [...mods.filter(Boolean), key].join(isMac ? "" : "+");
}
