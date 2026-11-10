import { P } from "./i18n";
import type { SiblingId } from "./suite";

/**
 * The "In Teams you… / in Element you…" cheat sheet. `via` lists sibling modules that change the
 * answer, best first; the first one that's loaded wins, otherwise stock Element's answer is shown.
 */
export interface CheatEntry {
    id: string;
    via?: SiblingId[];
}

export const CHEAT_SHEET: CheatEntry[] = [
    { id: "team" },
    { id: "channel" },
    { id: "chat" },
    { id: "activity", via: ["activity", "teamwork"] },
    { id: "files", via: ["files-hub"] },
    { id: "meet" },
    { id: "mention", via: ["tag-mentions"] },
    { id: "status", via: ["profile-status"] },
    { id: "saved", via: ["teamwork"] },
    { id: "schedule", via: ["teamwork"] },
    { id: "urgent", via: ["teamwork"] },
    { id: "praise", via: ["teamwork"] },
    { id: "reply" },
    { id: "pin" },
    { id: "search" },
];

export interface ResolvedEntry {
    id: string;
    teamsKey: string;
    elementKey: string;
    /** The sibling module that provides the answer, if any. */
    module?: SiblingId;
}

export function resolveCheatSheet(isLoaded: (id: SiblingId) => boolean, entries = CHEAT_SHEET): ResolvedEntry[] {
    return entries.map((e) => {
        const module = e.via?.find(isLoaded);
        return {
            id: e.id,
            teamsKey: `${P}cs_${e.id}_teams`,
            elementKey: `${P}cs_${e.id}_${module ?? "element"}`,
            module,
        };
    });
}

/**
 * Teams' shortcuts (Windows; ⌘/⌥ on macOS) next to Element's. Keys are written with "Mod" for
 * Ctrl/⌘ and "Alt" for Alt/⌥, and formatted per platform. `null`: no equivalent.
 */
export interface ShortcutRow {
    labelKey: string;
    teams: string | null;
    element: string | null;
}

export const SHORTCUTS: ShortcutRow[] = [
    { labelKey: `${P}key_search`, teams: "Mod+E", element: "Mod+K" },
    { labelKey: `${P}key_shortcuts`, teams: "Mod+.", element: "Mod+/" },
    { labelKey: `${P}key_switch`, teams: "Mod+1…6", element: "Mod+1…9" },
    { labelKey: `${P}key_updown`, teams: "Alt+↑ / Alt+↓", element: "Alt+↑ / Alt+↓" },
    { labelKey: `${P}key_unread`, teams: null, element: "Alt+Shift+↓" },
    { labelKey: `${P}key_attach`, teams: "Mod+O", element: "Mod+Shift+U" },
    { labelKey: `${P}key_newline`, teams: "Shift+Enter", element: "Shift+Enter" },
    { labelKey: `${P}key_edit`, teams: "↑", element: "↑" },
    { labelKey: `${P}key_mute`, teams: "Mod+Shift+M", element: "Mod+D" },
    { labelKey: `${P}key_camera`, teams: "Mod+Shift+O", element: "Mod+E" },
];

export function isMac(platform = typeof navigator === "undefined" ? "" : navigator.platform): boolean {
    return /Mac|iPhone|iPad/i.test(platform);
}

/** "Mod+Shift+U" → ["Ctrl", "Shift", "U"] or ["⌘", "⇧", "U"]. Separators like " / " stay as text. */
export function formatKeys(combo: string, mac = isMac()): string {
    const names: Record<string, string> = mac ? { Mod: "⌘", Alt: "⌥", Shift: "⇧" } : { Mod: "Ctrl", Alt: "Alt", Shift: "Shift" };
    return combo.replace(/\b(Mod|Alt|Shift)\b/g, (m) => names[m]);
}
