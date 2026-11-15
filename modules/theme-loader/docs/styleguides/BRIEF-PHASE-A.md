# Family agent brief — Phase A (style guide)

You are the design lead for ONE theme family of the element-web-themes project
(/var/home/t/projects/element-web-themes): ~65 Element Web themes delivered by a theme-loader Element module.
Real branding is allowed (internal project; user decision). Layout may change as far as you want.

Read first: docs/CONTRACT.md (binding), docs/CATALOG.md (your rows), docs/styleguides/SCHEMA.md,
research/01-theme-system.md (what can/can't be themed, tokens, selectors), and your family's section in
research/03-styles-platform.md or research/04-styles-artistic.md. Element source (read-only):
/var/home/t/projects/element/element-web (Element 1.12.33 is the target; check `git tag` / `git show v1.12.33:…`
when selectors matter).

Phase A deliverables (do NOT write theme CSS yet; other agents build the loader and test harness in parallel —
don't touch loader/, tests/ or other families):
1. Extra web research specific to your family where the dossier is thin or marked "from memory"; verify key
   values (colours, fonts) against primary sources. Find real reference screenshots.
2. `docs/styleguides/<family>.md`: the human style guide — concept, the stage axis (pure → usable / exciting,
   past/future, seriousness/hype), per-variant design spec, the region map (CONTRACT §4) per variant
   (a table is fine), signature moves, typography, iconography, motion, accessibility stance, what cannot be
   themed and the planned workaround, enhancer plans, sources with licences.
3. `docs/styleguides/<family>.json` following SCHEMA.md exactly (valid JSON, no comments), one entry per
   catalogue variant of your family. You may refine names/ideas of variants but keep the ids and count unless
   you have a strong reason (then explain it in your reply).
4. `themes/<family>/themes.json` manifest skeleton per CONTRACT §2 (css lists may point to files you'll create
   in phase B), and `themes/<family>/assets/` populated with the fonts/icons/images you will need, each with
   licence noted in `themes/<family>/README.md` (only redistributable files; proprietary fonts via local()).
   Fonts as .woff2 (convert if needed; `fonttools`/`woff2_compress` may be available, else pip install --user in a venv).

Reply with a ~200-word summary (key design decisions, any catalogue changes, open risks).
In phase B you will be asked to implement the CSS/enhancer, iterate with screenshots, and test — keep notes.
