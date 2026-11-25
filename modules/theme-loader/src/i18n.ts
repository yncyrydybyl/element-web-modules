import type { Api } from "@element-hq/element-web-module-api";

/** Flat keys only: Element's i18n treats "|" as nesting. */
export const translations = {
    tl_tab: { en: "Themes", de: "Themes" },
    tl_title: { en: "Themes", de: "Themes" },
    tl_intro: {
        en: "Pick a theme for Element. It is saved to your account and follows you to other devices.",
        de: "Wähle ein Theme für Element. Es wird in deinem Konto gespeichert und gilt auch auf deinen anderen Geräten.",
    },
    tl_default: { en: "Element default", de: "Element-Standard" },
    tl_default_desc: {
        en: "No loader theme: Element's own Appearance settings apply.",
        de: "Kein Loader-Theme: Es gelten Elements eigene Darstellungs-Einstellungen.",
    },
    tl_active: { en: "Active", de: "Aktiv" },
    tl_filter_stage: { en: "Stage", de: "Stufe" },
    tl_filter_mode: { en: "Mode", de: "Modus" },
    tl_all: { en: "All", de: "Alle" },
    tl_mode_light: { en: "Light", de: "Hell" },
    tl_mode_dark: { en: "Dark", de: "Dunkel" },
    tl_mode_daylight: { en: "Daylight", de: "Tageslicht" },
    tl_search: { en: "Search themes", de: "Themes suchen" },
    tl_none_match: { en: "No theme matches the filters.", de: "Kein Theme passt zu den Filtern." },
    tl_phase: { en: "Daylight phase", de: "Tageslicht-Phase" },
    tl_phase_auto: { en: "Automatic (local clock)", de: "Automatisch (lokale Uhr)" },
    tl_phase_now: { en: "Current phase", de: "Aktuelle Phase" },
    tl_url_override: {
        en: "A theme is forced by the URL (?tl_theme=…). Your choice is saved but only applies without it.",
        de: "Ein Theme wird per URL erzwungen (?tl_theme=…). Deine Auswahl wird gespeichert, gilt aber erst ohne.",
    },
    tl_seriousness: { en: "Seriousness", de: "Ernsthaftigkeit" },
    tl_hype: { en: "Hype", de: "Hype" },
    tl_quick_title: { en: "Switch theme", de: "Theme wechseln" },
    tl_quick_hint: {
        en: "↑↓ preview · Enter apply · Esc cancel · Alt+Shift+T opens this anywhere",
        de: "↑↓ Vorschau · Enter übernehmen · Esc abbrechen · Alt+Shift+T öffnet das überall",
    },
    tl_button_label: { en: "Switch theme (Alt+Shift+T)", de: "Theme wechseln (Alt+Shift+T)" },
    tl_dev_problems: { en: "Theme validation problems (dev server)", de: "Theme-Validierungsfehler (Dev-Server)" },
    tl_hidden: { en: "hidden", de: "versteckt" },
} as const;

export type TKey = keyof typeof translations;

export class I18n {
    public constructor(private readonly api: Api) {}
    public register(): void {
        try {
            this.api.i18n.register(translations as never);
        } catch {
            /* old API */
        }
    }
    public get lang(): string {
        try {
            return this.api.i18n.language || "en";
        } catch {
            return "en";
        }
    }
    public t(key: TKey): string {
        try {
            const s = this.api.i18n.translate(key as never);
            if (s && s !== key) return s;
        } catch {
            /* fall through */
        }
        const e = translations[key] as Record<string, string>;
        return e[this.lang.split("-")[0]] ?? e.en;
    }
}
