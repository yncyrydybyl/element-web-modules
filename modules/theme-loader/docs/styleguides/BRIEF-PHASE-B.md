# Family agent brief — Phase B (build, iterate, test)

Implement your family's variants exactly as your style guide (docs/styleguides/<family>.md/.json) specifies.

## Tools (shared — other agents use them concurrently)
- **Dev server** http://localhost:5400 serves Element 1.12.33 + the loader, reading `themes/` live (no rebuild).
  Usage details: `loader/README.md`. Do not restart/kill it; if it's down, start it with the documented idempotent
  command. Never edit `loader/` — ask via your reply if the loader lacks something.
- **Harness** `qa/README.md`: `shoot.mjs --theme <id>` (standard screenshot set to recordings/screens/<id>/),
  `edgecheck.mjs --theme <id>` (axe/contrast/overflow/console → qa/reports/<id>.md),
  `walkthrough.mjs --theme <id>` (scripted video), `--phase` for daylight phases, `--mobile`.
  Test users and seeded rooms live on matrix.datanauten.de (`.state/`, never print secrets).
  Only send messages into the "Theme Lab · Sandbox" room.
- Build check: `cd loader && npm run build` validates manifests + CSS scoping; it must pass for your family.

## Loop per variant
1. Write `themes/<family>/shared.css`, `<variant>.css`, `enhance.ts` per CONTRACT.
2. `shoot.mjs` → look at EVERY screenshot (Read the PNGs). Compare against your style guide and reference
   screenshots. Fix what looks wrong, broken, clipped, unreadable or off-brand. Repeat until it looks great —
   the user wants these to be genuinely impressive, faithful at "pure", genuinely pleasant at "usable",
   wild at the exciting end.
3. Daylight variants: shoot every phase.
4. `edgecheck.mjs`; fix real problems (usable/pure must pass contrast + focus; deliberate-unreadable variants
   report only, but the `.tl-ui` theme picker must stay usable everywhere).
5. Check also: modals, context menus, settings, login screen, mobile width, threads, code blocks, polls,
   E2EE shields, unread badges, very long names, RTL.

## Finish
- `walkthrough.mjs` for every variant (videos in recordings/walkthroughs/).
- Pick the best screenshot per variant as `recordings/screens/<id>/hero.png` (main timeline view).
- Update `themes/<family>/README.md`: what's implemented per variant, known gaps, edge-case results table.
- Don't commit (the lead commits). Reply ≤250 words: status per variant (done / partial + why), loader issues,
  notable edge-case findings.
