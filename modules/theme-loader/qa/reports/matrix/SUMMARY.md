# Test matrix — summary

Generated 2026-11-15 14:28 from 13 report(s) in `qa/reports/matrix/` (21127 results). Cases: `docs/TESTCASES.md`. Screenshots: `recordings/tests/<case-id>/<run>/`.

| run | base | started | mobile/dist | results |
|---|---|---|---|---|
| functional-dev-all | http://localhost:5400 | 2026-11-15T13:14 | 103fa1b5536e | 2474 pass · 14 fail · 18 report-only |
| functional-dev-messaging | http://localhost:5400 | 2026-11-15T14:20 | a854631618c4 | 18 pass · 0 fail · 0 report-only · 6 skip |
| functional-dev-messaging-recheck | http://localhost:5400 | 2026-11-15T14:25 | a854631618c4 | 11 pass · 0 fail · 0 report-only · 5 skip |
| functional-dev-rerun | http://localhost:5400 | 2026-11-15T13:35 | 73a3e17886b4 | 543 pass · 9 fail · 8 report-only |
| functional-prod-modules | https://element.datanauten.de | 2026-11-15T13:46 | c53052f05219 | 39 pass · 3 fail · 3 report-only · 3 skip |
| functional-prod-sample | https://element.datanauten.de | 2026-11-15T13:21 | 040daffb139d | 477 pass · 10 fail · 17 report-only |
| vp-dev-mob04-check | http://localhost:5400 | 2026-11-15T14:17 | a854631618c4 | 19 pass · 5 fail · 0 report-only |
| vp-devices-dev-mm | http://localhost:5400 | 2026-11-15T14:05 | 589fb7cea101 | 775 pass · 197 fail · 0 report-only |
| vp-devices-dev-nomodule | http://localhost:5400 | 2026-11-15T14:05 | 589fb7cea101 | 110 pass · 91 fail · 0 report-only |
| vp-devices-prod-mm | https://element.datanauten.de | 2026-11-15T14:15 | a854631618c4 | 89 pass · 31 fail · 0 report-only |
| vp-login-dev | http://localhost:5400 | 2026-11-15T13:20 | 040daffb139d | 288 pass · 0 fail · 0 report-only |
| vp-matrix-dev | http://localhost:5400 | 2026-11-15T13:20 | 040daffb139d | 7069 pass · 842 fail · 21 report-only |
| vp-matrix-dev-mm | http://localhost:5400 | 2026-11-15T13:42 | 73a3e17886b4 | 7419 pass · 513 fail · 0 report-only |

## By priority

| prio | pass | fail | report-only | skip |
|---|---|---|---|---|
| P0 | 9475 | 616 | 16 | 0 |
| P1 | 9331 | 986 | 51 | 14 |
| P2 | 378 | 113 | 0 | 0 |
| P3 | 147 | 0 | 0 | 0 |

## By case

| case | prio | title | pass | fail | report-only |
|---|---|---|---|---|---|
| AUTH-01 | P0 | Login page usable | 83 | 0 | 2 |
| CMP-01 | P0 | Composer visible, focusable, typed text visible | 85 | 0 | 0 |
| CMP-02 | P0 | Send button / Enter sends | 85 | 0 | 0 |
| DLG-01 | P0 | Modal opens, is readable, closes with Esc | 83 | 0 | 2 |
| MENU-01 | P0 | User menu opens with "All settings" | 82 | 3 | 0 |
| MOB-02 | P0 | Single-pane navigation: list → room → back | 65 | 34 | 0 |
| MOB-03 | P0 | Composer above on-screen keyboard | 74 | 25 | 0 |
| MOD-06 | P0 | mobile-themes and theme-loader coexist | 120 | 0 | 0 |
| MOD-07 | P0 | mobile-themes is a no-op on desktop | 15 | 0 | 0 |
| MSG-01 | P0 | Send plain text | 85 | 0 | 0 |
| RL-01 | P0 | Room list visible and names readable | 81 | 0 | 4 |
| RL-02 | P0 | Open a room from the list by click | 82 | 0 | 3 |
| SHELL-01 | P0 | App boots with the theme applied | 85 | 0 | 0 |
| SHELL-04 | P0 | Overlay root never blocks clicks | 81 | 1 | 3 |
| THM-01 | P0 | `html[data-tl-theme]` equals requested id | 85 | 0 | 0 |
| THM-02 | P0 | Quick switcher Alt+Shift+T opens and is readable | 84 | 1 | 0 |
| THM-03 | P0 | Quick switcher previews and Esc reverts | 85 | 0 | 0 |
| THM-04 | P0 | Themes tab reachable and readable | 85 | 0 | 0 |
| TL-01 | P0 | Message bodies visible and readable | 83 | 0 | 2 |
| VP-01 | P0 | Composer inside the viewport at every size | 1998 | 18 | 0 |
| VP-02 | P0 | Messages visible at every size | 1994 | 22 | 0 |
| VP-03 | P0 | Room list reachable at every size | 1529 | 487 | 0 |
| VP-09 | P0 | Theme switcher fits at every size | 2138 | 25 | 0 |
| VP-15 | P0 | Login page at every width | 288 | 0 | 0 |
| A11Y-03 | P1 | Browser zoom 200 % | 11 | 4 | 0 |
| BDG-01 | P1 | Unread count, highlight and dot badges | 82 | 0 | 3 |
| BTN-01 | P1 | Primary/secondary/danger buttons distinguishable | 85 | 0 | 0 |
| CMP-05 | P1 | Emoji picker | 80 | 5 | 0 |
| DLG-02 | P1 | Dialog close (×) button visible | 85 | 0 | 0 |
| E2E-01 | P1 | Encrypted room content decrypts | 85 | 0 | 0 |
| HDR-01 | P1 | Room name visible in header | 76 | 7 | 2 |
| HDR-02 | P1 | Header buttons clickable (call, threads, info) | 85 | 0 | 0 |
| HDR-06 | P1 | Module header buttons don't overflow | 9 | 2 | 1 |
| ICO-01 | P1 | Icons visible (not same colour as bg) | 68 | 12 | 5 |
| INP-01 | P1 | Text inputs visible with border/label | 83 | 0 | 2 |
| INP-05 | P1 | Search field in room list / spotlight | 85 | 0 | 0 |
| MOB-01 | P1 | Detection attributes | 81 | 0 | 0 |
| MOB-04 | P1 | Right panel full-screen on phones | 0 | 99 | 0 |
| MOB-05 | P1 | Settings full-screen on phones | 63 | 36 | 0 |
| MOB-06 | P1 | Dialogs fit on phones | 92 | 7 | 0 |
| MOD-01 | P1 | All prod modules load next to theme-loader | 9 | 0 | 0 |
| MOD-02 | P1 | teams-welcome guide usable and closable | 9 | 1 | 2 |
| MOD-05 | P1 | Themes tab and Modules tab coexist | 12 | 0 | 0 |
| MOT-01 | P1 | Reduced motion honoured | 85 | 0 | 0 |
| MSG-02 | P1 | Send markdown | 5 | 0 | 0 |
| MSG-03 | P1 | Reply to a message | 4 | 0 | 0 |
| MSG-04 | P1 | Edit own message | 5 | 0 | 0 |
| MSG-05 | P1 | Redact own message | 5 | 0 | 0 |
| MSG-06 | P1 | React with emoji | 5 | 0 | 0 |
| MSG-07 | P1 | Reply in thread | 5 | 0 | 0 |
| MSG-09 | P1 | Upload file | 0 | 0 | 0 |
| MSG-10 | P1 | Upload image | 0 | 0 | 0 |
| NAV-01 | P1 | Room switch via Ctrl+K spotlight | 85 | 0 | 0 |
| RP-01 | P1 | Thread panel opens and shows replies | 83 | 0 | 2 |
| RP-02 | P1 | Room info panel | 83 | 0 | 2 |
| RP-03 | P1 | Member list | 83 | 0 | 2 |
| SCR-02 | P1 | Only panels scroll, never the app root | 85 | 0 | 0 |
| SET-01 | P1 | User settings dialog opens, tabs readable | 85 | 0 | 0 |
| SHELL-02 | P1 | No horizontal page scroll at desktop size | 85 | 0 | 0 |
| THM-06 | P1 | Header palette button opens the switcher | 85 | 0 | 0 |
| TL-03 | P1 | Bubble layout | 83 | 0 | 2 |
| TL-04 | P1 | IRC layout | 83 | 0 | 2 |
| TL-10 | P1 | Reactions row | 83 | 0 | 2 |
| TL-11 | P1 | Thread summary on root | 85 | 0 | 0 |
| TL-22 | P1 | Message action bar on hover | 82 | 2 | 1 |
| TL-23 | P1 | Message context menu | 81 | 2 | 2 |
| VP-04 | P1 | No horizontal page overflow at every size | 1960 | 56 | 0 |
| VP-05 | P1 | Room header name visible at every size | 1646 | 370 | 0 |
| VP-06 | P1 | Dialog fits the viewport at every size | 568 | 8 | 0 |
| VP-07 | P1 | Settings dialog fits at every size | 490 | 86 | 0 |
| VP-10 | P1 | Theme overlays/decorations scale | 1712 | 283 | 21 |
| VP-12 | P1 | Short heights (480, 568) | 570 | 6 | 0 |
| A11Y-04 | P2 | Forced colors / high contrast | 85 | 0 | 0 |
| CMP-03 | P2 | Placeholder readable | 85 | 0 | 0 |
| MOB-08 | P2 | Touch targets ≥ 44 px | 1 | 98 | 0 |
| MOB-10 | P2 | Inputs ≥ 16 px (no iOS zoom) | 87 | 12 | 0 |
| VP-13 | P2 | Portrait ↔ landscape rotation keeps state | 97 | 2 | 0 |
| VP-16 | P2 | Live resize does not break layout | 23 | 1 | 0 |
| VP-14 | P3 | DPR 2 and 3 rendering | 147 | 0 | 0 |

## By viewport

| viewport | pass | fail | report-only | failing cases (themes) |
|---|---|---|---|---|
| 320x480 | 144 | 47 | 1 | VP-03 (12), VP-05 (17), VP-10 (5), VP-04 (8), VP-02 (2), VP-12 (2), VP-01 (1) |
| 320x568 | 186 | 65 | 1 | VP-03 (12), VP-05 (17), VP-07 (14), VP-10 (5), VP-04 (8), VP-02 (2), VP-12 (2), VP-06 (2), VP-01 (1), VP-09 (2) |
| 320x568@2t se | 138 | 72 | 0 | MOB-08 (18), MOB-04 (18), MOB-05 (10), MOB-03 (11), MOB-02 (7), VP-13 (2), MOB-06 (3), VP-09 (1), MOB-10 (2) |
| 320x667 | 122 | 45 | 1 | VP-03 (12), VP-05 (17), VP-10 (5), VP-04 (8), VP-02 (2), VP-01 (1) |
| 320x844 | 121 | 46 | 1 | VP-03 (12), VP-05 (17), VP-10 (4), VP-04 (8), VP-02 (2), VP-01 (2), VP-09 (1) |
| 320x900 | 170 | 57 | 1 | VP-03 (12), VP-05 (17), VP-07 (12), VP-10 (5), VP-04 (8), VP-02 (2), VP-01 (1) |
| 320x1080 | 122 | 45 | 1 | VP-03 (12), VP-05 (17), VP-10 (5), VP-04 (8), VP-02 (2), VP-01 (1) |
| 320x1440 | 122 | 45 | 1 | VP-03 (12), VP-05 (17), VP-10 (5), VP-04 (8), VP-02 (2), VP-01 (1) |
| 360x480 | 163 | 28 | 1 | VP-03 (10), VP-05 (11), VP-10 (5), VP-02 (1), VP-12 (1) |
| 360x568 | 215 | 36 | 1 | VP-03 (10), VP-05 (11), VP-10 (5), VP-02 (1), VP-12 (1), VP-06 (2), VP-07 (6) |
| 360x667 | 140 | 27 | 1 | VP-03 (10), VP-05 (11), VP-10 (5), VP-02 (1) |
| 360x800@3t small-android | 127 | 47 | 0 | MOB-08 (15), MOB-04 (15), MOB-02 (6), MOB-05 (6), MOB-10 (2), VP-09 (3) |
| 360x844 | 138 | 29 | 1 | VP-03 (11), VP-05 (11), VP-10 (4), VP-02 (1), VP-01 (1), VP-09 (1) |
| 360x900 | 193 | 34 | 1 | VP-03 (11), VP-05 (11), VP-10 (5), VP-02 (1), VP-07 (6) |
| 360x1080 | 139 | 28 | 1 | VP-03 (11), VP-05 (11), VP-10 (5), VP-02 (1) |
| 360x1440 | 139 | 28 | 1 | VP-03 (11), VP-05 (11), VP-10 (5), VP-02 (1) |
| 390x480 | 168 | 24 | 0 | VP-03 (10), VP-05 (8), VP-10 (5), VP-09 (1) |
| 390x568 | 221 | 31 | 0 | VP-03 (10), VP-05 (8), VP-10 (5), VP-06 (2), VP-07 (6) |
| 390x667 | 145 | 23 | 0 | VP-03 (10), VP-05 (8), VP-10 (5) |
| 390x844 | 144 | 24 | 0 | VP-03 (10), VP-05 (8), VP-10 (4), VP-01 (1), VP-09 (1) |
| 390x844@3t iphone15 | 158 | 52 | 0 | MOB-08 (18), MOB-04 (18), MOB-05 (4), MOB-02 (6), MOB-10 (2), VP-09 (3), MOB-03 (1) |
| 390x900 | 199 | 29 | 0 | VP-03 (10), VP-05 (8), VP-10 (5), VP-07 (6) |
| 390x1080 | 145 | 23 | 0 | VP-03 (10), VP-05 (8), VP-10 (5) |
| 390x1440 | 145 | 23 | 0 | VP-03 (10), VP-05 (8), VP-10 (5) |
| 414x480 | 169 | 23 | 0 | VP-03 (10), VP-05 (7), VP-10 (5), VP-09 (1) |
| 414x568 | 222 | 30 | 0 | VP-03 (10), VP-05 (7), VP-10 (5), VP-06 (2), VP-07 (6) |
| 414x667 | 146 | 22 | 0 | VP-03 (10), VP-05 (7), VP-10 (5) |
| 414x844 | 145 | 23 | 0 | VP-03 (10), VP-05 (7), VP-10 (4), VP-01 (1), VP-09 (1) |
| 414x896@3t plus | 135 | 39 | 0 | MOB-02 (5), MOB-08 (15), MOB-04 (15), MOB-05 (2), MOB-10 (2) |
| 414x900 | 200 | 28 | 0 | VP-03 (10), VP-05 (7), VP-10 (5), VP-07 (6) |
| 414x1080 | 146 | 22 | 0 | VP-03 (10), VP-05 (7), VP-10 (5) |
| 414x1440 | 146 | 22 | 0 | VP-03 (10), VP-05 (7), VP-10 (5) |
| 600x480 | 175 | 17 | 0 | VP-03 (10), VP-10 (5), VP-09 (2) |
| 600x568 | 231 | 21 | 0 | VP-03 (10), VP-10 (5), VP-07 (6) |
| 600x667 | 153 | 15 | 0 | VP-03 (10), VP-10 (5) |
| 600x844 | 152 | 16 | 0 | VP-03 (10), VP-10 (4), VP-01 (1), VP-09 (1) |
| 600x900 | 207 | 21 | 0 | VP-03 (10), VP-10 (5), VP-07 (6) |
| 600x1080 | 153 | 15 | 0 | VP-03 (10), VP-10 (5) |
| 600x1440 | 153 | 15 | 0 | VP-03 (10), VP-10 (5) |
| 720x450@2 zoom200 | 137 | 52 | 0 | MOB-08 (14), MOB-04 (15), MOB-05 (6), MOB-02 (6), MOB-06 (1), A11Y-03 (4), MOB-03 (4), MOB-10 (2) |
| 768x480 | 177 | 15 | 0 | VP-03 (10), VP-10 (5) |
| 768x568 | 231 | 21 | 0 | VP-03 (10), VP-10 (5), VP-07 (6) |
| 768x667 | 153 | 15 | 0 | VP-03 (10), VP-10 (5) |
| 768x844 | 152 | 16 | 0 | VP-03 (10), VP-10 (4), VP-01 (1), VP-09 (1) |
| 768x900 | 207 | 21 | 0 | VP-03 (10), VP-10 (5), VP-07 (6) |
| 768x1080 | 153 | 15 | 0 | VP-03 (10), VP-10 (5) |
| 768x1440 | 153 | 15 | 0 | VP-03 (10), VP-10 (5) |
| 820x480 | 178 | 13 | 1 | VP-05 (10), VP-10 (2), VP-03 (1) |
| 820x568 | 238 | 13 | 1 | VP-05 (10), VP-10 (2), VP-03 (1) |
| 820x667 | 154 | 13 | 1 | VP-05 (10), VP-10 (2), VP-03 (1) |
| 820x844 | 153 | 14 | 1 | VP-05 (9), VP-10 (1), VP-01 (1), VP-02 (1), VP-09 (1), VP-03 (1) |
| 820x900 | 214 | 13 | 1 | VP-05 (10), VP-10 (2), VP-03 (1) |
| 820x1080 | 154 | 13 | 1 | VP-05 (10), VP-10 (2), VP-03 (1) |
| 820x1180@2t tablet-port | 42 | 0 | 0 |  |
| 820x1440 | 154 | 13 | 1 | VP-05 (10), VP-10 (2), VP-03 (1) |
| 844x390@3t iphone15-land | 148 | 62 | 0 | MOB-08 (18), MOB-04 (18), MOB-05 (8), MOB-03 (9), MOB-06 (3), MOB-02 (4), MOB-10 (2) |
| 1024x480 | 189 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1024x568 | 249 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1024x667 | 165 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1024x844 | 164 | 4 | 0 | VP-10 (1), VP-01 (1), VP-09 (1), VP-03 (1) |
| 1024x900 | 225 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1024x1080 | 165 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1024x1440 | 165 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1180x820@2t tablet-land | 42 | 0 | 0 |  |
| 1280x480 | 189 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1280x568 | 249 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1280x667 | 165 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1280x844 | 164 | 4 | 0 | VP-10 (1), VP-01 (1), VP-09 (1), VP-03 (1) |
| 1280x900 | 225 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1280x1080 | 165 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1280x1440 | 165 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1440x480 | 189 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1440x568 | 249 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1440x667 | 165 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1440x844 | 164 | 4 | 0 | VP-10 (1), VP-01 (1), VP-09 (1), VP-03 (1) |
| 1440x900 | 248 | 4 | 0 | VP-10 (2), VP-03 (1), VP-16 (1) |
| 1440x900@2 desktop-hidpi | 66 | 0 | 0 |  |
| 1440x1080 | 165 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1440x1440 | 165 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1920x480 | 189 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1920x568 | 249 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1920x667 | 165 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1920x844 | 164 | 4 | 0 | VP-10 (1), VP-01 (1), VP-09 (1), VP-03 (1) |
| 1920x900 | 225 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1920x1080 | 165 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 1920x1440 | 165 | 3 | 0 | VP-10 (2), VP-03 (1) |
| 2560x480 | 188 | 4 | 0 | VP-10 (2), VP-03 (2) |
| 2560x568 | 248 | 4 | 0 | VP-10 (2), VP-03 (2) |
| 2560x667 | 164 | 4 | 0 | VP-10 (2), VP-03 (2) |
| 2560x844 | 163 | 5 | 0 | VP-10 (2), VP-03 (2), VP-09 (1) |
| 2560x900 | 224 | 4 | 0 | VP-10 (2), VP-03 (2) |
| 2560x1080 | 164 | 4 | 0 | VP-10 (2), VP-03 (2) |
| 2560x1440 | 164 | 4 | 0 | VP-10 (2), VP-03 (2) |

## By theme

| theme | pass | fail | report-only | failing cases |
|---|---|---|---|---|
| comic-after-midnight | 42 | 0 | 0 |  |
| comic-casual-friday | 42 | 0 | 0 |  |
| comic-geocities | 41 | 1 | 0 | SHELL-04 |
| comic-poster | 40 | 2 | 0 | TL-22, TL-23 |
| comic-unreadable | 1350 | 141 | 25 | MOB-02, MOB-08, MOB-03, MOB-04, MOB-05, VP-09, VP-05, VP-03, VP-07 |
| comic-wordart | 38 | 3 | 1 | TL-22, TL-23, THM-02 |
| e-aurora | 1414 | 102 | 0 | HDR-01, MOB-08, MOB-04, MOB-02, VP-03, VP-05, VP-02, VP-12 |
| e-current | 42 | 0 | 0 |  |
| e-daylight | 42 | 0 | 0 |  |
| e-ember | 42 | 0 | 0 |  |
| e-neon-steel | 42 | 0 | 0 |  |
| e-usable | 42 | 0 | 0 |  |
| e16-brushed-metal | 42 | 0 | 0 |  |
| e17-glow | 42 | 0 | 0 |  |
| element-default | 1465 | 164 | 0 | HDR-06, HDR-01, MOB-08, MOB-02, MOB-03, MOB-04, MOB-05, MOB-10, VP-09, A11Y-03, VP-05, VP-03, VP-07 |
| kde-breeze-dark | 1410 | 106 | 0 | HDR-01, MOB-08, MOB-04, MOB-02, VP-03, VP-05, VP-04 |
| kde-breeze-daylight | 42 | 0 | 0 |  |
| kde-breeze-light | 42 | 0 | 0 |  |
| kde-glass | 42 | 0 | 0 |  |
| kde-ocean | 42 | 0 | 0 |  |
| kde-oxygen | 42 | 0 | 0 |  |
| kde-usable | 42 | 0 | 0 |  |
| lcars-daylight | 41 | 1 | 0 | CMP-05 |
| lcars-lower-decks | 41 | 1 | 0 | CMP-05 |
| lcars-picard | 42 | 0 | 0 |  |
| lcars-red-alert | 41 | 1 | 0 | CMP-05 |
| lcars-tng | 1354 | 276 | 0 | CMP-05, HDR-01, MOB-02, MOB-08, MOB-03, VP-13, MOB-04, MOB-06, MOB-05, VP-09, A11Y-03, VP-10, VP-05, VP-07, VP-01, VP-02 |
| lcars-usable | 42 | 0 | 0 |  |
| lcars-voyager | 41 | 1 | 0 | CMP-05 |
| opendesk-2028 | 42 | 0 | 0 |  |
| opendesk-classic | 42 | 0 | 0 |  |
| opendesk-dark | 42 | 0 | 0 |  |
| opendesk-daylight | 42 | 0 | 0 |  |
| opendesk-hyperdesk | 42 | 0 | 0 |  |
| opendesk-light | 1384 | 133 | 0 | MOD-02, HDR-06, HDR-01, MOB-08, MOB-04, MOB-06, MOB-02, MOB-03, VP-05, VP-03, VP-04, VP-06 |
| opendesk-usable | 42 | 0 | 0 |  |
| paper-black | 42 | 0 | 0 |  |
| paper-black-invisible | 36 | 1 | 5 | MENU-01 |
| paper-black-quiet | 41 | 1 | 0 | ICO-01 |
| paper-daylight | 42 | 0 | 0 |  |
| paper-white | 42 | 0 | 0 |  |
| paper-white-invisible | 1357 | 129 | 31 | MENU-01, MOB-08, MOB-04, MOB-02, A11Y-03, VP-03, VP-01, VP-04, VP-16 |
| paper-white-quiet | 41 | 0 | 1 |  |
| sketch-blueprint | 42 | 0 | 0 |  |
| sketch-chalkboard | 42 | 0 | 0 |  |
| sketch-daylight | 42 | 0 | 0 |  |
| sketch-designed | 42 | 0 | 0 |  |
| sketch-napkin | 42 | 0 | 0 |  |
| sketch-notebook | 42 | 0 | 0 |  |
| sketch-scribble | 42 | 0 | 0 |  |
| sketch-unreadable | 1411 | 110 | 2 | MOB-02, MOB-08, MOB-03, MOB-04, MOB-05, VP-03, VP-05, VP-07 |
| sketch-whiteboard | 42 | 0 | 0 |  |
| sketch-wireframe | 42 | 0 | 0 |  |
| teams-2024 | 41 | 1 | 0 | ICO-01 |
| teams-2026-dark | 41 | 1 | 0 | ICO-01 |
| teams-2026-daylight | 41 | 1 | 0 | ICO-01 |
| teams-2026-light | 1467 | 95 | 1 | HDR-01, ICO-01, MOB-08, MOB-04, MOB-05, VP-05, VP-03, VP-07 |
| teams-2028 | 41 | 1 | 0 | ICO-01 |
| teams-classic-2020 | 41 | 1 | 0 | ICO-01 |
| teams-comic | 41 | 1 | 0 | ICO-01 |
| teams-cyberpunk | 1376 | 141 | 0 | ICO-01, MOB-08, MOB-02, MOB-04, MOB-05, VP-10, VP-05, VP-03, VP-07 |
| teams-usable-dark | 41 | 1 | 0 | ICO-01 |
| teams-usable-light | 41 | 1 | 0 | ICO-01 |
| win311-2030 | 41 | 0 | 1 |  |
| win311-cyberpunk | 42 | 0 | 0 |  |
| win311-daylight | 42 | 0 | 0 |  |
| win311-default | 1389 | 201 | 0 | MOB-08, MOB-03, MOB-02, MOB-04, MOB-05, MOB-06, MOB-10, VP-09, A11Y-03, VP-03, VP-07, VP-10, VP-05 |
| win311-hotdog | 42 | 0 | 0 |  |
| win311-leather | 42 | 0 | 0 |  |
| win311-usable | 42 | 0 | 0 |  |
| x-kde-e16 | 42 | 0 | 0 |  |
| x-teams-sketch | 42 | 0 | 0 |  |
| x-win311-lcars | 1420 | 97 | 0 | HDR-01, MOB-08, MOB-03, MOB-02, MOB-04, VP-03, VP-02, VP-04, VP-05, VP-12, VP-07 |

## Failures (P0/P1 first)

| prio | case | theme | viewport | run | detail | screenshot |
|---|---|---|---|---|---|---|
| P0 | MENU-01 | paper-black-invisible |  | functional-dev-all | exception: locator.click: Timeout 6000ms exceeded. | `recordings/tests/MENU-01/functional-dev-all/paper-black-invisible.png` |
| P0 | MENU-01 | paper-white-invisible |  | functional-dev-rerun | exception: locator.click: Timeout 6000ms exceeded. | `recordings/tests/MENU-01/functional-dev-rerun/paper-white-invisible.png` |
| P0 | MENU-01 | paper-white-invisible |  | functional-prod-sample | exception: locator.click: Timeout 6000ms exceeded. | `recordings/tests/MENU-01/functional-prod-sample/paper-white-invisible.png` |
| P0 | MOB-02 | comic-unreadable | 320x568@2t se | vp-devices-dev-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/comic-unreadable--se.png` |
| P0 | MOB-02 | e-aurora | 720x450@2 zoom200 | vp-devices-dev-mm | exception: locator.click: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/e-aurora--zoom200.png` |
| P0 | MOB-02 | element-default | 414x896@3t plus | vp-devices-dev-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/element-default--plus.png` |
| P0 | MOB-02 | element-default | 320x568@2t se | vp-devices-dev-nomodule | room list not visible on the home view (mt=null, view=null) | `recordings/tests/MOB-02/vp-devices-dev-nomodule/element-default--se.png` |
| P0 | MOB-02 | element-default | 390x844@3t iphone15 | vp-devices-dev-nomodule | room list not visible on the home view (mt=null, view=null) | `recordings/tests/MOB-02/vp-devices-dev-nomodule/element-default--iphone15.png` |
| P0 | MOB-02 | element-default | 360x800@3t small-android | vp-devices-dev-nomodule | room list not visible on the home view (mt=null, view=null) | `recordings/tests/MOB-02/vp-devices-dev-nomodule/element-default--small-android.png` |
| P0 | MOB-02 | element-default | 414x896@3t plus | vp-devices-dev-nomodule | room list not visible on the home view (mt=null, view=null) | `recordings/tests/MOB-02/vp-devices-dev-nomodule/element-default--plus.png` |
| P0 | MOB-02 | element-default | 844x390@3t iphone15-land | vp-devices-dev-nomodule | room view only 404px of 844px (list still shown: true) | `recordings/tests/MOB-02/vp-devices-dev-nomodule/element-default--iphone15-land.png` |
| P0 | MOB-02 | element-default | 720x450@2 zoom200 | vp-devices-dev-nomodule | room list not visible on the home view (mt=null, view=null) | `recordings/tests/MOB-02/vp-devices-dev-nomodule/element-default--zoom200.png` |
| P0 | MOB-02 | kde-breeze-dark | 390x844@3t iphone15 | vp-devices-dev-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/kde-breeze-dark--iphone15.png` |
| P0 | MOB-02 | kde-breeze-dark | 720x450@2 zoom200 | vp-devices-dev-mm | exception: locator.click: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/kde-breeze-dark--zoom200.png` |
| P0 | MOB-02 | lcars-tng | 320x568@2t se | vp-devices-dev-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/lcars-tng--se.png` |
| P0 | MOB-02 | lcars-tng | 360x800@3t small-android | vp-devices-dev-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/lcars-tng--small-android.png` |
| P0 | MOB-02 | lcars-tng | 320x568@2t se | vp-devices-dev-nomodule | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-nomodule/lcars-tng--se.png` |
| P0 | MOB-02 | lcars-tng | 390x844@3t iphone15 | vp-devices-dev-nomodule | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-nomodule/lcars-tng--iphone15.png` |
| P0 | MOB-02 | lcars-tng | 360x800@3t small-android | vp-devices-dev-nomodule | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-nomodule/lcars-tng--small-android.png` |
| P0 | MOB-02 | lcars-tng | 414x896@3t plus | vp-devices-dev-nomodule | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-nomodule/lcars-tng--plus.png` |
| P0 | MOB-02 | lcars-tng | 844x390@3t iphone15-land | vp-devices-dev-nomodule | room view only 351px of 844px (list still shown: true) | `recordings/tests/MOB-02/vp-devices-dev-nomodule/lcars-tng--iphone15-land.png` |
| P0 | MOB-02 | lcars-tng | 720x450@2 zoom200 | vp-devices-dev-nomodule | exception: locator.click: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-nomodule/lcars-tng--zoom200.png` |
| P0 | MOB-02 | lcars-tng | 390x844@3t iphone15 | vp-devices-prod-mm | room opened but composer not in viewport | `recordings/tests/MOB-02/vp-devices-prod-mm/lcars-tng--iphone15.png` |
| P0 | MOB-02 | lcars-tng | 320x568@2t se | vp-devices-prod-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-prod-mm/lcars-tng--se.png` |
| P0 | MOB-02 | opendesk-light | 844x390@3t iphone15-land | vp-devices-dev-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/opendesk-light--iphone15-land.png` |
| P0 | MOB-02 | paper-white-invisible | 414x896@3t plus | vp-devices-dev-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/paper-white-invisible--plus.png` |
| P0 | MOB-02 | paper-white-invisible | 720x450@2 zoom200 | vp-devices-dev-mm | exception: locator.click: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/paper-white-invisible--zoom200.png` |
| P0 | MOB-02 | sketch-unreadable | 320x568@2t se | vp-devices-dev-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/sketch-unreadable--se.png` |
| P0 | MOB-02 | teams-cyberpunk | 360x800@3t small-android | vp-devices-dev-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/teams-cyberpunk--small-android.png` |
| P0 | MOB-02 | win311-default | 360x800@3t small-android | vp-devices-dev-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/win311-default--small-android.png` |
| P0 | MOB-02 | win311-default | 320x568@2t se | vp-devices-dev-nomodule | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-nomodule/win311-default--se.png` |
| P0 | MOB-02 | win311-default | 360x800@3t small-android | vp-devices-dev-nomodule | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-nomodule/win311-default--small-android.png` |
| P0 | MOB-02 | win311-default | 390x844@3t iphone15 | vp-devices-dev-nomodule | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-nomodule/win311-default--iphone15.png` |
| P0 | MOB-02 | win311-default | 414x896@3t plus | vp-devices-dev-nomodule | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-nomodule/win311-default--plus.png` |
| P0 | MOB-02 | win311-default | 844x390@3t iphone15-land | vp-devices-dev-nomodule | room view only 444px of 844px (list still shown: true) | `recordings/tests/MOB-02/vp-devices-dev-nomodule/win311-default--iphone15-land.png` |
| P0 | MOB-02 | win311-default | 720x450@2 zoom200 | vp-devices-dev-nomodule | exception: locator.click: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-nomodule/win311-default--zoom200.png` |
| P0 | MOB-02 | x-win311-lcars | 390x844@3t iphone15 | vp-devices-dev-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-02/vp-devices-dev-mm/x-win311-lcars--iphone15.png` |
| P0 | MOB-03 | comic-unreadable | 320x568@2t se | vp-devices-dev-mm | 320x228: composer 151-283 inVp false, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-mm/comic-unreadable--se.png` |
| P0 | MOB-03 | comic-unreadable | 844x390@3t iphone15-land | vp-devices-dev-mm | 844x190: composer 92-116 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-mm/comic-unreadable--iphone15-land.png` |
| P0 | MOB-03 | comic-unreadable | 720x450@2 zoom200 | vp-devices-dev-mm | 720x250: composer 152-176 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-mm/comic-unreadable--zoom200.png` |
| P0 | MOB-03 | element-default | 320x568@2t se | vp-devices-dev-mm | 320x228: composer 177-219 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-mm/element-default--se.png` |
| P0 | MOB-03 | element-default | 320x568@2t se | vp-devices-dev-nomodule | 320x228: composer 153-213 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-nomodule/element-default--se.png` |
| P0 | MOB-03 | element-default | 844x390@3t iphone15-land | vp-devices-dev-nomodule | 844x190: composer 136-160 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-nomodule/element-default--iphone15-land.png` |
| P0 | MOB-03 | element-default | 320x568@2t se | vp-devices-prod-mm | 320x228: composer 177-219 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-prod-mm/element-default--se.png` |
| P0 | MOB-03 | lcars-tng | 320x568@2t se | vp-devices-dev-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-03/vp-devices-dev-mm/lcars-tng--se.png` |
| P0 | MOB-03 | lcars-tng | 320x568@2t se | vp-devices-dev-nomodule | 320x228: composer none inVp false, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-nomodule/lcars-tng--se.png` |
| P0 | MOB-03 | lcars-tng | 844x390@3t iphone15-land | vp-devices-dev-nomodule | 844x190: composer 113-191 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-nomodule/lcars-tng--iphone15-land.png` |
| P0 | MOB-03 | lcars-tng | 720x450@2 zoom200 | vp-devices-dev-nomodule | 720x250: composer 181-205 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-nomodule/lcars-tng--zoom200.png` |
| P0 | MOB-03 | lcars-tng | 390x844@3t iphone15 | vp-devices-prod-mm | 390x504: composer none inVp false, 5 bodies | `recordings/tests/MOB-03/vp-devices-prod-mm/lcars-tng--iphone15.png` |
| P0 | MOB-03 | lcars-tng | 320x568@2t se | vp-devices-prod-mm | exception: locator.tap: Timeout 6000ms exceeded. | `recordings/tests/MOB-03/vp-devices-prod-mm/lcars-tng--se.png` |
| P0 | MOB-03 | lcars-tng | 844x390@3t iphone15-land | vp-devices-prod-mm | 844x190: composer 115-139 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-prod-mm/lcars-tng--iphone15-land.png` |
| P0 | MOB-03 | opendesk-light | 844x390@3t iphone15-land | vp-devices-dev-mm | 844x190: composer 147-171 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-mm/opendesk-light--iphone15-land.png` |
| P0 | MOB-03 | sketch-unreadable | 320x568@2t se | vp-devices-dev-mm | 320x228: composer 172-215 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-mm/sketch-unreadable--se.png` |
| P0 | MOB-03 | sketch-unreadable | 844x390@3t iphone15-land | vp-devices-dev-mm | 844x190: composer 138-174 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-mm/sketch-unreadable--iphone15-land.png` |
| P0 | MOB-03 | win311-default | 320x568@2t se | vp-devices-dev-mm | 320x228: composer 176-198 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-mm/win311-default--se.png` |
| P0 | MOB-03 | win311-default | 844x390@3t iphone15-land | vp-devices-dev-mm | 844x190: composer 138-160 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-mm/win311-default--iphone15-land.png` |
| P0 | MOB-03 | win311-default | 320x568@2t se | vp-devices-dev-nomodule | 320x228: composer 108-130 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-nomodule/win311-default--se.png` |
| P0 | MOB-03 | win311-default | 844x390@3t iphone15-land | vp-devices-dev-nomodule | 844x190: composer 87-109 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-nomodule/win311-default--iphone15-land.png` |
| P0 | MOB-03 | win311-default | 720x450@2 zoom200 | vp-devices-dev-nomodule | 720x250: composer 130-152 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-nomodule/win311-default--zoom200.png` |
| P0 | MOB-03 | x-win311-lcars | 320x568@2t se | vp-devices-dev-mm | 320x228: composer 108-186 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-mm/x-win311-lcars--se.png` |
| P0 | MOB-03 | x-win311-lcars | 844x390@3t iphone15-land | vp-devices-dev-mm | 844x190: composer 109-133 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-mm/x-win311-lcars--iphone15-land.png` |
| P0 | MOB-03 | x-win311-lcars | 720x450@2 zoom200 | vp-devices-dev-mm | 720x250: composer 169-193 inVp true, 0 bodies | `recordings/tests/MOB-03/vp-devices-dev-mm/x-win311-lcars--zoom200.png` |
| P0 | SHELL-04 | comic-geocities |  | functional-dev-rerun | roomItem: covered by div left-panel | `recordings/tests/SHELL-04/functional-dev-rerun/comic-geocities.png` |
| P0 | THM-02 | comic-wordart |  | functional-dev-rerun | 75 items; name contrast median 11.54 min 1.31 | `recordings/tests/THM-02/functional-dev-rerun/comic-wordart.png` |
| P0 | VP-01 | lcars-tng | 1920x844 | vp-matrix-dev-mm | no visible composer | `recordings/tests/VP-01/vp-matrix-dev-mm/lcars-tng--1920x844.png` |
| P0 | VP-01 | lcars-tng | 1440x844 | vp-matrix-dev-mm | no visible composer | `recordings/tests/VP-01/vp-matrix-dev-mm/lcars-tng--1440x844.png` |
| P0 | VP-01 | lcars-tng | 1280x844 | vp-matrix-dev-mm | no visible composer | `recordings/tests/VP-01/vp-matrix-dev-mm/lcars-tng--1280x844.png` |
| P0 | VP-01 | lcars-tng | 1024x844 | vp-matrix-dev-mm | no visible composer | `recordings/tests/VP-01/vp-matrix-dev-mm/lcars-tng--1024x844.png` |
| P0 | VP-01 | lcars-tng | 820x844 | vp-matrix-dev-mm | no visible composer | `recordings/tests/VP-01/vp-matrix-dev-mm/lcars-tng--820x844.png` |
| P0 | VP-01 | lcars-tng | 768x844 | vp-matrix-dev-mm | no visible composer | `recordings/tests/VP-01/vp-matrix-dev-mm/lcars-tng--768x844.png` |
| P0 | VP-01 | lcars-tng | 600x844 | vp-matrix-dev-mm | no visible composer | `recordings/tests/VP-01/vp-matrix-dev-mm/lcars-tng--600x844.png` |
| P0 | VP-01 | lcars-tng | 414x844 | vp-matrix-dev-mm | no visible composer | `recordings/tests/VP-01/vp-matrix-dev-mm/lcars-tng--414x844.png` |
| P0 | VP-01 | lcars-tng | 390x844 | vp-matrix-dev-mm | no visible composer | `recordings/tests/VP-01/vp-matrix-dev-mm/lcars-tng--390x844.png` |
| P0 | VP-01 | lcars-tng | 360x844 | vp-matrix-dev-mm | no visible composer | `recordings/tests/VP-01/vp-matrix-dev-mm/lcars-tng--360x844.png` |
| P0 | VP-01 | lcars-tng | 320x844 | vp-matrix-dev-mm | no visible composer | `recordings/tests/VP-01/vp-matrix-dev-mm/lcars-tng--320x844.png` |
| P0 | VP-01 | paper-white-invisible | 320x480 | vp-matrix-dev | composer input x 42-240 y 421-454 h33 covered by div left-panel | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--320x480.png` |
| P0 | VP-01 | paper-white-invisible | 320x568 | vp-matrix-dev | composer input x 42-240 y 509-542 h33 covered by div left-panel | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--320x568.png` |
| P0 | VP-01 | paper-white-invisible | 320x667 | vp-matrix-dev | composer input x 42-240 y 608-641 h33 covered by div left-panel | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--320x667.png` |
| P0 | VP-01 | paper-white-invisible | 320x844 | vp-matrix-dev | composer input x 42-240 y 785-818 h33 covered by div left-panel | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--320x844.png` |
| P0 | VP-01 | paper-white-invisible | 320x900 | vp-matrix-dev | composer input x 42-240 y 841-874 h33 covered by div left-panel | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--320x900.png` |
| P0 | VP-01 | paper-white-invisible | 320x1080 | vp-matrix-dev | composer input x 42-240 y 1021-1054 h33 covered by div left-panel | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--320x1080.png` |
| P0 | VP-01 | paper-white-invisible | 320x1440 | vp-matrix-dev | composer input x 42-240 y 1381-1414 h33 covered by div left-panel | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--320x1440.png` |
| P0 | VP-02 | e-aurora | 360x480 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x480.png` |
| P0 | VP-02 | e-aurora | 320x480 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x480.png` |
| P0 | VP-02 | e-aurora | 360x568 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x568.png` |
| P0 | VP-02 | e-aurora | 320x568 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x568.png` |
| P0 | VP-02 | e-aurora | 360x667 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x667.png` |
| P0 | VP-02 | e-aurora | 320x667 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x667.png` |
| P0 | VP-02 | e-aurora | 360x844 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x844.png` |
| P0 | VP-02 | e-aurora | 320x844 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x844.png` |
| P0 | VP-02 | e-aurora | 360x900 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x900.png` |
| P0 | VP-02 | e-aurora | 320x900 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x900.png` |
| P0 | VP-02 | e-aurora | 360x1080 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x1080.png` |
| P0 | VP-02 | e-aurora | 320x1080 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x1080.png` |
| P0 | VP-02 | e-aurora | 360x1440 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x1440.png` |
| P0 | VP-02 | e-aurora | 320x1440 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x1440.png` |
| P0 | VP-02 | lcars-tng | 820x844 | vp-matrix-dev-mm | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev-mm/lcars-tng--820x844.png` |
| P0 | VP-02 | x-win311-lcars | 320x480 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/x-win311-lcars--320x480.png` |
| P0 | VP-02 | x-win311-lcars | 320x568 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/x-win311-lcars--320x568.png` |
| P0 | VP-02 | x-win311-lcars | 320x667 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/x-win311-lcars--320x667.png` |
| P0 | VP-02 | x-win311-lcars | 320x844 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/x-win311-lcars--320x844.png` |
| P0 | VP-02 | x-win311-lcars | 320x900 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/x-win311-lcars--320x900.png` |
| P0 | VP-02 | x-win311-lcars | 320x1080 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/x-win311-lcars--320x1080.png` |
| P0 | VP-02 | x-win311-lcars | 320x1440 | vp-matrix-dev | 0 message bodies visible | `recordings/tests/VP-01/vp-matrix-dev/x-win311-lcars--320x1440.png` |
| P0 | VP-03 | comic-unreadable | 768x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--768x480.png` |
| P0 | VP-03 | comic-unreadable | 600x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--600x480.png` |
| P0 | VP-03 | comic-unreadable | 414x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--414x480.png` |
| P0 | VP-03 | comic-unreadable | 390x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--390x480.png` |
| P0 | VP-03 | comic-unreadable | 360x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--360x480.png` |
| P0 | VP-03 | comic-unreadable | 320x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--320x480.png` |
| P0 | VP-03 | comic-unreadable | 768x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--768x568.png` |
| P0 | VP-03 | comic-unreadable | 600x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--600x568.png` |
| P0 | VP-03 | comic-unreadable | 414x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--414x568.png` |
| P0 | VP-03 | comic-unreadable | 390x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--390x568.png` |
| P0 | VP-03 | comic-unreadable | 360x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--360x568.png` |
| P0 | VP-03 | comic-unreadable | 320x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--320x568.png` |
| P0 | VP-03 | comic-unreadable | 768x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--768x667.png` |
| P0 | VP-03 | comic-unreadable | 600x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--600x667.png` |
| P0 | VP-03 | comic-unreadable | 414x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--414x667.png` |
| P0 | VP-03 | comic-unreadable | 390x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--390x667.png` |
| P0 | VP-03 | comic-unreadable | 360x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--360x667.png` |
| P0 | VP-03 | comic-unreadable | 320x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--320x667.png` |
| P0 | VP-03 | comic-unreadable | 768x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--768x844.png` |
| P0 | VP-03 | comic-unreadable | 600x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--600x844.png` |
| P0 | VP-03 | comic-unreadable | 414x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--414x844.png` |
| P0 | VP-03 | comic-unreadable | 390x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--390x844.png` |
| P0 | VP-03 | comic-unreadable | 360x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--360x844.png` |
| P0 | VP-03 | comic-unreadable | 320x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--320x844.png` |
| P0 | VP-03 | comic-unreadable | 768x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--768x900.png` |
| P0 | VP-03 | comic-unreadable | 600x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--600x900.png` |
| P0 | VP-03 | comic-unreadable | 414x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--414x900.png` |
| P0 | VP-03 | comic-unreadable | 390x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--390x900.png` |
| P0 | VP-03 | comic-unreadable | 360x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--360x900.png` |
| P0 | VP-03 | comic-unreadable | 320x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--320x900.png` |
| P0 | VP-03 | comic-unreadable | 768x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--768x1080.png` |
| P0 | VP-03 | comic-unreadable | 600x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--600x1080.png` |
| P0 | VP-03 | comic-unreadable | 414x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--414x1080.png` |
| P0 | VP-03 | comic-unreadable | 390x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--390x1080.png` |
| P0 | VP-03 | comic-unreadable | 360x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--360x1080.png` |
| P0 | VP-03 | comic-unreadable | 320x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--320x1080.png` |
| P0 | VP-03 | comic-unreadable | 768x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--768x1440.png` |
| P0 | VP-03 | comic-unreadable | 600x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--600x1440.png` |
| P0 | VP-03 | comic-unreadable | 414x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--414x1440.png` |
| P0 | VP-03 | comic-unreadable | 390x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--390x1440.png` |
| P0 | VP-03 | comic-unreadable | 360x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--360x1440.png` |
| P0 | VP-03 | comic-unreadable | 320x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/comic-unreadable--320x1440.png` |
| P0 | VP-03 | e-aurora | 768x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--768x480.png` |
| P0 | VP-03 | e-aurora | 600x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--600x480.png` |
| P0 | VP-03 | e-aurora | 414x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--414x480.png` |
| P0 | VP-03 | e-aurora | 390x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--390x480.png` |
| P0 | VP-03 | e-aurora | 360x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x480.png` |
| P0 | VP-03 | e-aurora | 320x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x480.png` |
| P0 | VP-03 | e-aurora | 768x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--768x568.png` |
| P0 | VP-03 | e-aurora | 600x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--600x568.png` |
| P0 | VP-03 | e-aurora | 414x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--414x568.png` |
| P0 | VP-03 | e-aurora | 390x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--390x568.png` |
| P0 | VP-03 | e-aurora | 360x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x568.png` |
| P0 | VP-03 | e-aurora | 320x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x568.png` |
| P0 | VP-03 | e-aurora | 768x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--768x667.png` |
| P0 | VP-03 | e-aurora | 600x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--600x667.png` |
| P0 | VP-03 | e-aurora | 414x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--414x667.png` |
| P0 | VP-03 | e-aurora | 390x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--390x667.png` |
| P0 | VP-03 | e-aurora | 360x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x667.png` |
| P0 | VP-03 | e-aurora | 320x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x667.png` |
| P0 | VP-03 | e-aurora | 768x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--768x844.png` |
| P0 | VP-03 | e-aurora | 600x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--600x844.png` |
| P0 | VP-03 | e-aurora | 414x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--414x844.png` |
| P0 | VP-03 | e-aurora | 390x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--390x844.png` |
| P0 | VP-03 | e-aurora | 360x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x844.png` |
| P0 | VP-03 | e-aurora | 320x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x844.png` |
| P0 | VP-03 | e-aurora | 768x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--768x900.png` |
| P0 | VP-03 | e-aurora | 600x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--600x900.png` |
| P0 | VP-03 | e-aurora | 414x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--414x900.png` |
| P0 | VP-03 | e-aurora | 390x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--390x900.png` |
| P0 | VP-03 | e-aurora | 360x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x900.png` |
| P0 | VP-03 | e-aurora | 320x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x900.png` |
| P0 | VP-03 | e-aurora | 768x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--768x1080.png` |
| P0 | VP-03 | e-aurora | 600x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--600x1080.png` |
| P0 | VP-03 | e-aurora | 414x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--414x1080.png` |
| P0 | VP-03 | e-aurora | 390x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--390x1080.png` |
| P0 | VP-03 | e-aurora | 360x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x1080.png` |
| P0 | VP-03 | e-aurora | 320x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x1080.png` |
| P0 | VP-03 | e-aurora | 768x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--768x1440.png` |
| P0 | VP-03 | e-aurora | 600x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--600x1440.png` |
| P0 | VP-03 | e-aurora | 414x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--414x1440.png` |
| P0 | VP-03 | e-aurora | 390x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--390x1440.png` |
| P0 | VP-03 | e-aurora | 360x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x1440.png` |
| P0 | VP-03 | e-aurora | 320x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--320x1440.png` |
| P0 | VP-03 | element-default | 768x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--768x480.png` |
| P0 | VP-03 | element-default | 600x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--600x480.png` |
| P0 | VP-03 | element-default | 414x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--414x480.png` |
| P0 | VP-03 | element-default | 390x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--390x480.png` |
| P0 | VP-03 | element-default | 360x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--360x480.png` |
| P0 | VP-03 | element-default | 320x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--320x480.png` |
| P0 | VP-03 | element-default | 768x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--768x568.png` |
| P0 | VP-03 | element-default | 600x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--600x568.png` |
| P0 | VP-03 | element-default | 414x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--414x568.png` |
| P0 | VP-03 | element-default | 390x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--390x568.png` |
| P0 | VP-03 | element-default | 360x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--360x568.png` |
| P0 | VP-03 | element-default | 320x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--320x568.png` |
| P0 | VP-03 | element-default | 768x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--768x667.png` |
| P0 | VP-03 | element-default | 600x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--600x667.png` |
| P0 | VP-03 | element-default | 414x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--414x667.png` |
| P0 | VP-03 | element-default | 390x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--390x667.png` |
| P0 | VP-03 | element-default | 360x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--360x667.png` |
| P0 | VP-03 | element-default | 320x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--320x667.png` |
| P0 | VP-03 | element-default | 768x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--768x844.png` |
| P0 | VP-03 | element-default | 600x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--600x844.png` |
| P0 | VP-03 | element-default | 414x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--414x844.png` |
| P0 | VP-03 | element-default | 390x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--390x844.png` |
| P0 | VP-03 | element-default | 360x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--360x844.png` |
| P0 | VP-03 | element-default | 320x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--320x844.png` |
| P0 | VP-03 | element-default | 768x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--768x900.png` |
| P0 | VP-03 | element-default | 600x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--600x900.png` |
| P0 | VP-03 | element-default | 414x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--414x900.png` |
| P0 | VP-03 | element-default | 390x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--390x900.png` |
| P0 | VP-03 | element-default | 360x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--360x900.png` |
| P0 | VP-03 | element-default | 320x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--320x900.png` |
| P0 | VP-03 | element-default | 768x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--768x1080.png` |
| P0 | VP-03 | element-default | 600x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--600x1080.png` |
| P0 | VP-03 | element-default | 414x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--414x1080.png` |
| P0 | VP-03 | element-default | 390x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--390x1080.png` |
| P0 | VP-03 | element-default | 360x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--360x1080.png` |
| P0 | VP-03 | element-default | 320x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--320x1080.png` |
| P0 | VP-03 | element-default | 768x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--768x1440.png` |
| P0 | VP-03 | element-default | 600x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--600x1440.png` |
| P0 | VP-03 | element-default | 414x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--414x1440.png` |
| P0 | VP-03 | element-default | 390x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--390x1440.png` |
| P0 | VP-03 | element-default | 360x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--360x1440.png` |
| P0 | VP-03 | element-default | 320x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/element-default--320x1440.png` |
| P0 | VP-03 | kde-breeze-dark | 768x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--768x480.png` |
| P0 | VP-03 | kde-breeze-dark | 600x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--600x480.png` |
| P0 | VP-03 | kde-breeze-dark | 414x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--414x480.png` |
| P0 | VP-03 | kde-breeze-dark | 390x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--390x480.png` |
| P0 | VP-03 | kde-breeze-dark | 360x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--360x480.png` |
| P0 | VP-03 | kde-breeze-dark | 320x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--320x480.png` |
| P0 | VP-03 | kde-breeze-dark | 768x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--768x568.png` |
| P0 | VP-03 | kde-breeze-dark | 600x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--600x568.png` |
| P0 | VP-03 | kde-breeze-dark | 414x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--414x568.png` |
| P0 | VP-03 | kde-breeze-dark | 390x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--390x568.png` |
| P0 | VP-03 | kde-breeze-dark | 360x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--360x568.png` |
| P0 | VP-03 | kde-breeze-dark | 320x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--320x568.png` |
| P0 | VP-03 | kde-breeze-dark | 768x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--768x667.png` |
| P0 | VP-03 | kde-breeze-dark | 600x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--600x667.png` |
| P0 | VP-03 | kde-breeze-dark | 414x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--414x667.png` |
| P0 | VP-03 | kde-breeze-dark | 390x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--390x667.png` |
| P0 | VP-03 | kde-breeze-dark | 360x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--360x667.png` |
| P0 | VP-03 | kde-breeze-dark | 320x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--320x667.png` |
| P0 | VP-03 | kde-breeze-dark | 768x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--768x844.png` |
| P0 | VP-03 | kde-breeze-dark | 600x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--600x844.png` |
| P0 | VP-03 | kde-breeze-dark | 414x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--414x844.png` |
| P0 | VP-03 | kde-breeze-dark | 390x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--390x844.png` |
| P0 | VP-03 | kde-breeze-dark | 360x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--360x844.png` |
| P0 | VP-03 | kde-breeze-dark | 320x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--320x844.png` |
| P0 | VP-03 | kde-breeze-dark | 768x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--768x900.png` |
| P0 | VP-03 | kde-breeze-dark | 600x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--600x900.png` |
| P0 | VP-03 | kde-breeze-dark | 414x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--414x900.png` |
| P0 | VP-03 | kde-breeze-dark | 390x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--390x900.png` |
| P0 | VP-03 | kde-breeze-dark | 360x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--360x900.png` |
| P0 | VP-03 | kde-breeze-dark | 320x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--320x900.png` |
| P0 | VP-03 | kde-breeze-dark | 768x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--768x1080.png` |
| P0 | VP-03 | kde-breeze-dark | 600x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--600x1080.png` |
| P0 | VP-03 | kde-breeze-dark | 414x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--414x1080.png` |
| P0 | VP-03 | kde-breeze-dark | 390x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--390x1080.png` |
| P0 | VP-03 | kde-breeze-dark | 360x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--360x1080.png` |
| P0 | VP-03 | kde-breeze-dark | 320x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--320x1080.png` |
| P0 | VP-03 | kde-breeze-dark | 768x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--768x1440.png` |
| P0 | VP-03 | kde-breeze-dark | 600x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--600x1440.png` |
| P0 | VP-03 | kde-breeze-dark | 414x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--414x1440.png` |
| P0 | VP-03 | kde-breeze-dark | 390x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--390x1440.png` |
| P0 | VP-03 | kde-breeze-dark | 360x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--360x1440.png` |
| P0 | VP-03 | kde-breeze-dark | 320x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--320x1440.png` |
| P0 | VP-03 | opendesk-light | 768x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--768x480.png` |
| P0 | VP-03 | opendesk-light | 600x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--600x480.png` |
| P0 | VP-03 | opendesk-light | 414x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--414x480.png` |
| P0 | VP-03 | opendesk-light | 390x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--390x480.png` |
| P0 | VP-03 | opendesk-light | 360x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--360x480.png` |
| P0 | VP-03 | opendesk-light | 320x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--320x480.png` |
| P0 | VP-03 | opendesk-light | 768x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--768x568.png` |
| P0 | VP-03 | opendesk-light | 600x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--600x568.png` |
| P0 | VP-03 | opendesk-light | 414x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--414x568.png` |
| P0 | VP-03 | opendesk-light | 390x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--390x568.png` |
| P0 | VP-03 | opendesk-light | 360x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--360x568.png` |
| P0 | VP-03 | opendesk-light | 320x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--320x568.png` |
| P0 | VP-03 | opendesk-light | 768x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--768x667.png` |
| P0 | VP-03 | opendesk-light | 600x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--600x667.png` |
| P0 | VP-03 | opendesk-light | 414x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--414x667.png` |
| P0 | VP-03 | opendesk-light | 390x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--390x667.png` |
| P0 | VP-03 | opendesk-light | 360x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--360x667.png` |
| P0 | VP-03 | opendesk-light | 320x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--320x667.png` |
| P0 | VP-03 | opendesk-light | 768x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--768x844.png` |
| P0 | VP-03 | opendesk-light | 600x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--600x844.png` |
| P0 | VP-03 | opendesk-light | 414x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--414x844.png` |
| P0 | VP-03 | opendesk-light | 390x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--390x844.png` |
| P0 | VP-03 | opendesk-light | 360x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--360x844.png` |
| P0 | VP-03 | opendesk-light | 320x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--320x844.png` |
| P0 | VP-03 | opendesk-light | 768x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--768x900.png` |
| P0 | VP-03 | opendesk-light | 600x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--600x900.png` |
| P0 | VP-03 | opendesk-light | 414x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--414x900.png` |
| P0 | VP-03 | opendesk-light | 390x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--390x900.png` |
| P0 | VP-03 | opendesk-light | 360x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--360x900.png` |
| P0 | VP-03 | opendesk-light | 320x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--320x900.png` |
| P0 | VP-03 | opendesk-light | 768x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--768x1080.png` |
| P0 | VP-03 | opendesk-light | 600x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--600x1080.png` |
| P0 | VP-03 | opendesk-light | 414x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--414x1080.png` |
| P0 | VP-03 | opendesk-light | 390x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--390x1080.png` |
| P0 | VP-03 | opendesk-light | 360x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--360x1080.png` |
| P0 | VP-03 | opendesk-light | 320x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--320x1080.png` |
| P0 | VP-03 | opendesk-light | 768x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--768x1440.png` |
| P0 | VP-03 | opendesk-light | 600x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--600x1440.png` |
| P0 | VP-03 | opendesk-light | 414x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--414x1440.png` |
| P0 | VP-03 | opendesk-light | 390x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--390x1440.png` |
| P0 | VP-03 | opendesk-light | 360x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--360x1440.png` |
| P0 | VP-03 | opendesk-light | 320x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/opendesk-light--320x1440.png` |
| P0 | VP-03 | paper-white-invisible | 2560x480 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--2560x480.png` |
| P0 | VP-03 | paper-white-invisible | 2560x568 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--2560x568.png` |
| P0 | VP-03 | paper-white-invisible | 2560x667 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--2560x667.png` |
| P0 | VP-03 | paper-white-invisible | 2560x844 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--2560x844.png` |
| P0 | VP-03 | paper-white-invisible | 2560x900 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--2560x900.png` |
| P0 | VP-03 | paper-white-invisible | 2560x1080 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--2560x1080.png` |
| P0 | VP-03 | paper-white-invisible | 2560x1440 | vp-matrix-dev | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev/paper-white-invisible--2560x1440.png` |
| P0 | VP-03 | paper-white-invisible | 2560x480 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--2560x480.png` |
| P0 | VP-03 | paper-white-invisible | 1920x480 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1920x480.png` |
| P0 | VP-03 | paper-white-invisible | 1440x480 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1440x480.png` |
| P0 | VP-03 | paper-white-invisible | 1280x480 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1280x480.png` |
| P0 | VP-03 | paper-white-invisible | 1024x480 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1024x480.png` |
| P0 | VP-03 | paper-white-invisible | 820x480 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--820x480.png` |
| P0 | VP-03 | paper-white-invisible | 768x480 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--768x480.png` |
| P0 | VP-03 | paper-white-invisible | 600x480 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--600x480.png` |
| P0 | VP-03 | paper-white-invisible | 414x480 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--414x480.png` |
| P0 | VP-03 | paper-white-invisible | 390x480 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--390x480.png` |
| P0 | VP-03 | paper-white-invisible | 360x480 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--360x480.png` |
| P0 | VP-03 | paper-white-invisible | 320x480 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--320x480.png` |
| P0 | VP-03 | paper-white-invisible | 2560x568 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--2560x568.png` |
| P0 | VP-03 | paper-white-invisible | 1920x568 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1920x568.png` |
| P0 | VP-03 | paper-white-invisible | 1440x568 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1440x568.png` |
| P0 | VP-03 | paper-white-invisible | 1280x568 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1280x568.png` |
| P0 | VP-03 | paper-white-invisible | 1024x568 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1024x568.png` |
| P0 | VP-03 | paper-white-invisible | 820x568 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--820x568.png` |
| P0 | VP-03 | paper-white-invisible | 768x568 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--768x568.png` |
| P0 | VP-03 | paper-white-invisible | 600x568 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--600x568.png` |
| P0 | VP-03 | paper-white-invisible | 414x568 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--414x568.png` |
| P0 | VP-03 | paper-white-invisible | 390x568 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--390x568.png` |
| P0 | VP-03 | paper-white-invisible | 360x568 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--360x568.png` |
| P0 | VP-03 | paper-white-invisible | 320x568 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--320x568.png` |
| P0 | VP-03 | paper-white-invisible | 2560x667 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--2560x667.png` |
| P0 | VP-03 | paper-white-invisible | 1920x667 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1920x667.png` |
| P0 | VP-03 | paper-white-invisible | 1440x667 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1440x667.png` |
| P0 | VP-03 | paper-white-invisible | 1280x667 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1280x667.png` |
| P0 | VP-03 | paper-white-invisible | 1024x667 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1024x667.png` |
| P0 | VP-03 | paper-white-invisible | 820x667 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--820x667.png` |
| P0 | VP-03 | paper-white-invisible | 768x667 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--768x667.png` |
| P0 | VP-03 | paper-white-invisible | 600x667 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--600x667.png` |
| P0 | VP-03 | paper-white-invisible | 414x667 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--414x667.png` |
| P0 | VP-03 | paper-white-invisible | 390x667 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--390x667.png` |
| P0 | VP-03 | paper-white-invisible | 360x667 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--360x667.png` |
| P0 | VP-03 | paper-white-invisible | 320x667 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--320x667.png` |
| P0 | VP-03 | paper-white-invisible | 2560x844 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--2560x844.png` |
| P0 | VP-03 | paper-white-invisible | 1920x844 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1920x844.png` |
| P0 | VP-03 | paper-white-invisible | 1440x844 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1440x844.png` |
| P0 | VP-03 | paper-white-invisible | 1280x844 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1280x844.png` |
| P0 | VP-03 | paper-white-invisible | 1024x844 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1024x844.png` |
| P0 | VP-03 | paper-white-invisible | 820x844 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--820x844.png` |
| P0 | VP-03 | paper-white-invisible | 768x844 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--768x844.png` |
| P0 | VP-03 | paper-white-invisible | 600x844 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--600x844.png` |
| P0 | VP-03 | paper-white-invisible | 414x844 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--414x844.png` |
| P0 | VP-03 | paper-white-invisible | 390x844 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--390x844.png` |
| P0 | VP-03 | paper-white-invisible | 360x844 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--360x844.png` |
| P0 | VP-03 | paper-white-invisible | 320x844 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--320x844.png` |
| P0 | VP-03 | paper-white-invisible | 2560x900 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--2560x900.png` |
| P0 | VP-03 | paper-white-invisible | 1920x900 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1920x900.png` |
| P0 | VP-03 | paper-white-invisible | 1440x900 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1440x900.png` |
| P0 | VP-03 | paper-white-invisible | 1280x900 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1280x900.png` |
| P0 | VP-03 | paper-white-invisible | 1024x900 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1024x900.png` |
| P0 | VP-03 | paper-white-invisible | 820x900 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--820x900.png` |
| P0 | VP-03 | paper-white-invisible | 768x900 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--768x900.png` |
| P0 | VP-03 | paper-white-invisible | 600x900 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--600x900.png` |
| P0 | VP-03 | paper-white-invisible | 414x900 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--414x900.png` |
| P0 | VP-03 | paper-white-invisible | 390x900 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--390x900.png` |
| P0 | VP-03 | paper-white-invisible | 360x900 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--360x900.png` |
| P0 | VP-03 | paper-white-invisible | 320x900 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--320x900.png` |
| P0 | VP-03 | paper-white-invisible | 2560x1080 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--2560x1080.png` |
| P0 | VP-03 | paper-white-invisible | 1920x1080 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1920x1080.png` |
| P0 | VP-03 | paper-white-invisible | 1440x1080 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1440x1080.png` |
| P0 | VP-03 | paper-white-invisible | 1280x1080 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1280x1080.png` |
| P0 | VP-03 | paper-white-invisible | 1024x1080 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1024x1080.png` |
| P0 | VP-03 | paper-white-invisible | 820x1080 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--820x1080.png` |
| P0 | VP-03 | paper-white-invisible | 768x1080 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--768x1080.png` |
| P0 | VP-03 | paper-white-invisible | 600x1080 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--600x1080.png` |
| P0 | VP-03 | paper-white-invisible | 414x1080 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--414x1080.png` |
| P0 | VP-03 | paper-white-invisible | 390x1080 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--390x1080.png` |
| P0 | VP-03 | paper-white-invisible | 360x1080 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--360x1080.png` |
| P0 | VP-03 | paper-white-invisible | 320x1080 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--320x1080.png` |
| P0 | VP-03 | paper-white-invisible | 2560x1440 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--2560x1440.png` |
| P0 | VP-03 | paper-white-invisible | 1920x1440 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1920x1440.png` |
| P0 | VP-03 | paper-white-invisible | 1440x1440 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1440x1440.png` |
| P0 | VP-03 | paper-white-invisible | 1280x1440 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1280x1440.png` |
| P0 | VP-03 | paper-white-invisible | 1024x1440 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--1024x1440.png` |
| P0 | VP-03 | paper-white-invisible | 820x1440 | vp-matrix-dev-mm | room list items 0, back control false | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--820x1440.png` |
| P0 | VP-03 | paper-white-invisible | 768x1440 | vp-matrix-dev-mm | room list items 0, back control false, mt=narrow view=room | `recordings/tests/VP-01/vp-matrix-dev-mm/paper-white-invisible--768x1440.png` |
| … | 1315 more in the JSON reports | | | | | |

## Curated findings (triaged by hand, 2026-11-15)

Harness false positives found during the run were fixed and re-run (`functional-dev-rerun` supersedes
`functional-dev-all`, etc.); results that remain invalid are labelled `skip` with the reason. Everything below was
checked against the screenshot.

### Theme bugs (theme-loader / themes)

| prio | case | theme(s) | finding | evidence |
|---|---|---|---|---|
| P0→P1 | THM-02 | comic-wordart | quick switcher: the selected/current row is navy text on the navy highlight (contrast 1.31); rest readable | `recordings/tests/THM-02/functional-dev-all/comic-wordart.png` |
| P0 | VP-09 | comic-unreadable | the paper-clip assistant bubble ("It looks like you can't read this") covers the theme-switcher list at ≤ 600 px; PANIC button still works | `recordings/tests/VP-09/vp-matrix-dev/comic-unreadable--600x480.png` (taken after Esc; reproduced on the open dialog during triage) |
| P0 | SHELL-04 | comic-geocities | sticky "PEOPLE" section header (rainbow rule) covers the first room row (Theo) — that room is hidden/unclickable | `recordings/tests/SHELL-04/functional-dev-rerun/comic-geocities.png` |
| P1 | TL-22/23 | comic-wordart, comic-poster (+ unreadable, by design) | assistant bubble covers the hover action bar of the newest message (Options/React unreachable there) | `recordings/tests/TL-22/functional-dev-all/comic-poster.png` |
| P1 | VP-06 | opendesk-light | ≤ 414 px: create-room dialog's × sits under the openDesk top bar, right side cut ("Create room" button clipped) | `recordings/tests/VP-06/vp-matrix-dev/opendesk-light--414x568.png` |
| P1 | MOD-02 | opendesk-light (prod) | openDesk top-bar overlay covers the teams-welcome guide's header/close button | `recordings/tests/MOD-02/functional-prod-sample/opendesk-light.png` |
| P1 | VP-10 | lcars-tng (all widths), teams-cyberpunk (≤ 768) | composer "MORE"/More options pill pushed half past the right edge (centre off-screen) | `recordings/tests/VP-01/vp-matrix-dev/lcars-tng--1440x900.png` |
| P2 | CMP-05 | lcars-tng, -voyager, -red-alert, -daylight, -lower-decks | emoji picker opens partly beyond the right viewport edge at 1440×900 | `recordings/tests/CMP-05/functional-dev-rerun/lcars-tng--open.png` |
| P2 | VP-02/12 | e-aurora (360×480), x-win311-lcars (320) | no message visible at very small sizes (chrome eats the timeline) | `recordings/tests/VP-01/vp-matrix-dev/e-aurora--360x480.png` |
| P2 | VP-04 | kde-breeze-dark, opendesk-light, x-win311-lcars, paper-white-invisible | 5 px horizontal page overflow at 320 px | `recordings/tests/VP-01/vp-matrix-dev/kde-breeze-dark--320x480.png` |
| known | MENU-01/RL-01 | paper-*-invisible | user menu / room list hidden by design; Alt+Shift+T and Themes tab still work (THM-02/03/04 pass) | — |

### Theme × mobile-themes conflicts (mobile/dist as recorded per run)

| prio | case | theme | finding | evidence |
|---|---|---|---|---|
| P0 | VP-03/VP-10 | win311-default | at phone widths the win311 menu bar + second title bar cover the room header incl. the module's back button | `recordings/tests/VP-01/vp-matrix-dev-mm/win311-default--390x844.png` |
| P0 (intermittent) | MOB-02 | lcars-tng (prod, iPhone 15) | room opens without a visible composer (timeline runs past the bottom while loading) | `recordings/tests/MOB-02/vp-devices-prod-mm/lcars-tng--iphone15.png` |

### mobile-themes module (for the mobile agent; dist 589fb7cea101 / a854631618c4)

- MOB-04 (all themes, all phones): opening the right panel widens the layout viewport to ~2× the device width
  (innerWidth 796 at 390 px) — the page zooms out; `recordings/tests/MOB-04/vp-dev-mob04-check/teams-2026-light--iphone15-open.png`.
- After the simulated keyboard closes (viewport 844→504→844) the app stays ~420 px tall (visual-viewport height not
  restored) — may be an emulation artefact, verify on a device; `recordings/tests/MOB-04/vp-devices-dev-mm/` screenshots.
- VP-07/MOB-05: settings dialog 12 px wider than the viewport at 390/600 px and in landscape (844×390); tab panel < 300 px at 320.
- MOB-08: touch targets < 44 px in every theme (header icon buttons 32×32; win311 back button 22×18).
- Without the module (baseline = current prod): MOB-02/04/08 fail everywhere, VP-03 fails at every width ≤ 768 (MOB-09/10).

### Element / other modules (not theme bugs)

- VP-05: room name 0 px wide at 320–414 and at 820 px (room list still expanded) in Element default too.
- Prod, 1440×900: room name 0 px wide in most themes with the 8 module header buttons (HDR-01), and the teams-welcome
  guide covers the member facepile (HDR-06) in Element default too.
- Element collapses the room list below ~768 px and keeps it collapsed when the window grows again (the matrix restores
  device settings per height row to avoid this).
- Homeserver rate limiting (429) under parallel load caused MOD-01 failures — labelled `skip`.
