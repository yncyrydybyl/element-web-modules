import type { Api } from "@element-hq/element-web-module-api";

// Element uses "|" as its key separator (counterpart), so the prefix must not contain one.
const P = "de.minagawa.marcade_module.";
const DE = ["de", "de_DE", "de-DE"];
const EN = ["en", "en_EN", "en_US", "en-US", "en_GB", "en-GB"];

/** Registered with Element's i18n, so the user's Element language picks the text. */
export const STRINGS = {
  button_label: { de: "Apps", en: "Apps" },
  button_tooltip: { de: "Marcade Store öffnen", en: "Open Marcade Store" },
  button_tooltip_close: { de: "Marcade Store schließen", en: "Close Marcade Store" },
  button_tooltip_moderator: {
    de: "Marcade Store öffnen (nur Moderatoren können Apps hinzufügen)",
    en: "Open Marcade Store (only moderators can add apps)",
  },
  adding: { de: "Marcade Store wird hinzugefügt …", en: "Adding the Marcade Store …" },
  add_failed: { de: "Der Marcade Store konnte nicht hinzugefügt werden: %(error)s", en: "Could not add the Marcade Store: %(error)s" },
  add_timeout: {
    de: "Der Marcade Store wurde hinzugefügt, ist aber noch nicht angekommen. Bitte gleich noch einmal klicken.",
    en: "The Marcade Store was added but has not arrived yet. Please click again in a moment.",
  },
  composer_hint: {
    de: "Der Befehl zum Hinzufügen steht im Eingabefeld – mit Enter absenden.",
    en: "The command that adds the store is in the composer – press Enter to send it.",
  },
  moderator_title: { de: "Apps hinzufügen", en: "Add apps" },
  moderator_body: {
    de: "In diesem Raum können nur Moderatoren Apps hinzufügen. Ein Moderator kann selbst auf „Apps“ oben im Raum klicken oder diese Zeile im Raum senden:",
    en: "Only moderators can add apps to this room. A moderator can click “Apps” at the top of the room or send this line in the room:",
  },
  manual_body: {
    de: "Dieses Element kann den Marcade Store nicht selbst hinzufügen. Diese Zeile, in einem Matrix-Client mit /addwidget im Raum gesendet, fügt ihn hinzu:",
    en: "This Element cannot add the Marcade Store by itself. Sent in the room from a Matrix client with /addwidget, this line adds it:",
  },
  copy: { de: "Kopieren", en: "Copy" },
  copied: { de: "Kopiert", en: "Copied" },
  close: { de: "Schließen", en: "Close" },
} as const;

export type StringKey = keyof typeof STRINGS;

let api: Api | undefined;

export function initI18n(a: Api): void {
  api = a;
  const translations: Record<string, Record<string, string>> = {};
  for (const [k, v] of Object.entries(STRINGS)) {
    const e: Record<string, string> = {};
    for (const l of DE) e[l] = v.de;
    for (const l of EN) e[l] = v.en;
    translations[P + k] = e;
  }
  try {
    a.i18n.register(translations as never);
  } catch (e) {
    console.warn("[marcade-element-module] i18n.register failed, using built-in tables", e);
  }
}

/** Translate with Element's i18n; falls back to the tables here (English unless the language is German). */
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  if (api) {
    try {
      const r = api.i18n.translate((P + key) as never, vars);
      if (typeof r === "string" && r !== P + key && !r.includes(P)) return r;
    } catch {
      /* fall through */
    }
  }
  let lang = "en";
  try {
    lang = api?.i18n.language ?? "en";
  } catch {
    /* ignore */
  }
  let s: string = lang.toLowerCase().startsWith("de") ? STRINGS[key].de : STRINGS[key].en;
  for (const [k, v] of Object.entries(vars ?? {})) s = s.replaceAll(`%(${k})s`, String(v));
  return s;
}
