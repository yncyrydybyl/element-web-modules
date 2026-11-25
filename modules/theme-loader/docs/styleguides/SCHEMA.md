# Style guide data schema (`docs/styleguides/<family>.json`)

Rendered into the presentation/gallery. Keep values concrete (hex, font names).

```jsonc
{
  "family": "teams",
  "name": "Microsoft Teams",
  "concept": "2–4 sentences: what this family is about and how the stages differ.",
  "sources": [{ "title": "Fluent 2 tokens", "url": "https://…" }],
  "limits": ["what cannot be achieved and why (iframes stay light/dark, …)"],
  "variants": [
    {
      "id": "teams-2026-light", "name": "Teams 2026 · Light", "stage": "pure", "mode": "light",
      "seriousness": 9, "hype": 3,
      "tagline": "one line",
      "palette": {                 // all hex
        "bg": "#…", "surface": "#…", "sidebar": "#…", "rail": "#…",
        "text": "#…", "muted": "#…", "accent": "#…", "onAccent": "#…",
        "border": "#…", "own": "#…", "other": "#…", "critical": "#…", "success": "#…"
      },
      "phases": null,              // daylight only: { "dawn": {palette…}, "day": {…}, "dusk": {…}, "night": {…} } + "schedule": [...]
      "fonts": { "ui": "Segoe UI Variable → Selawik", "display": "…", "mono": "…" },
      "shape": { "radius": "4px", "border": "hairline|bevel|sketch|pill|elbow|none|glow", "shadow": "…", "density": "compact|normal|airy" },
      "texture": "none | paper | brushed-metal | scanlines | halftone | …",
      "motion": "short description",
      "signature": ["5 details that make it instantly recognizable"],
      "regions": {                 // one short phrase each, see CONTRACT §4
        "shell": "", "spaces": "", "roomlist": "", "header": "", "timeline": "", "names-avatars": "",
        "composer": "", "rightpanel": "", "buttons": "", "inputs": "", "dialogs": "", "menus": "",
        "settings": "", "auth": "", "scrollbars": "", "focus": "", "badges": "", "code": "",
        "iframes": "", "icons": "", "motion": ""
      },
      "difficulty": "easy|medium|hard",   // implementation effort
      "enhancer": "what the optional enhance.ts adds, or null"
    }
  ]
}
```
