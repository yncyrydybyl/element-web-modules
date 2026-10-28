import { z, type input } from "zod/mini";

import { parseCombo } from "./keys";

z.config(z.locales.en());

export const CONFIG_KEY = "de.datanauten.keyboard_shortcuts";

/** A combo written as text, e.g. "Mod+Shift+K". Validated at load time. */
const ComboString = z.string().check(
    z.refine((value) => {
        try {
            parseCombo(value);
            return true;
        } catch {
            return false;
        }
    }, "Invalid key combo, expected something like \"Mod+Shift+K\""),
);

/** Either a plain string or a map of language tag → string, e.g. { "en": "Open store", "de": "Store öffnen" }. */
const LocalisedText = z.union([z.string(), z.record(z.string(), z.string())]);

export const ExtraShortcut = z.object({
    /** Stable id, required if users should be able to tell entries apart; defaults to the label. */
    id: z.optional(z.string()),
    label: LocalisedText,
    keys: ComboString,
    /** One of the built-in category ids, or omitted for the "More" section. */
    category: z.optional(z.string()),
});

export const KeyboardShortcutsConfig = z.object({
    /** Key that opens the overlay. A bare character is matched by the character produced, regardless of Shift. */
    trigger_key: z._default(ComboString, "?"),
    /** Let users add their own combos for Element's global actions. */
    allow_customisation: z._default(z.boolean(), true),
    /** Category ids to leave out, e.g. ["accessibility", "autocomplete"]. */
    hidden_categories: z._default(z.array(z.string()), []),
    /** Element KeyBindingAction ids to leave out, e.g. ["KeyBinding.toggleHiddenEventVisibility"]. */
    hidden_shortcuts: z._default(z.array(z.string()), []),
    /** Shortcuts provided by other modules or integrations, listed for discoverability only. */
    extra_shortcuts: z._default(z.array(ExtraShortcut), []),
});

export type KeyboardShortcutsConfig = z.infer<typeof KeyboardShortcutsConfig>;
export type ExtraShortcut = z.infer<typeof ExtraShortcut>;

export function parseConfig(raw: unknown): KeyboardShortcutsConfig {
    return KeyboardShortcutsConfig.parse(raw ?? {});
}

declare module "@element-hq/element-web-module-api" {
    export interface Config {
        [CONFIG_KEY]?: input<typeof KeyboardShortcutsConfig>;
    }
}
