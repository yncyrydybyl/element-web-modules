# 02 – Infrastructure: deploy, test accounts, GitLab, recording

Discovery date: 2026-11-15. Nothing remote was changed. Secrets are referenced by path only.

## TL;DR

| Topic | Answer |
|---|---|
| Element at element.datanauten.de | **Upstream** `ghcr.io/element-hq/element-web` **v1.12.33** (`/version`), *not* the fork any more. The 1.12.27 fork (`yncyrydybyl/element-web`, tag `datanauten-widgets-6`) was dropped on 2026-10-24 (comment in vars.yml). |
| How it's deployed | Ansible, matrix-docker-ansible-deploy (MDAD) as a git submodule. Repo `~/projects/dtn10/datanauten.de` (remote `git@gitlab.com:datanauten/matrix-hosting/datanauten.de.git`). Host `matrix.datanauten.de` = 83.125.106.115, ssh user `t` + sudo (key works, `sudo -n` works). |
| How to add a module | Copy the build to `inventory/host_vars/matrix.datanauten.de/files/element-modules/<name>/`, add `- name: <name>` + `files:` (+ optional `config:`) to `datanauten_element_modules` in `vars.yml`, then `--tags=setup-aux,setup-client-element` + `systemctl restart matrix-client-element`. `?v=<sha1[:12]>` cache busting is automatic. |
| CSP | `<meta>` CSP in index.html: `style-src 'self' 'unsafe-inline'` (inline `<style>` OK, **no blob:/data: stylesheets**), `font-src 'self' data:` (**no Google Fonts / external fonts**), `img-src * blob: data:` (external images fine), `script-src 'self' blob: 'wasm-unsafe-eval'` (blob: added locally for remote-modules). HTTP header only adds `frame-ancestors 'self'`. |
| Homeserver | `https://matrix.datanauten.de`, server_name `datanauten` (MXIDs `@x:datanauten.de`), Synapse + MAS. `disable_custom_urls: true` → **only datanauten accounts can log in there**; BPC users cannot. |
| Test users | BPC kit (`blackpony.club`, ESS Pro) is self-service: `bpc-agent register` via MAS admin API, creds in `.state/mas-admin.env`. datanauten users need ansible `--tags=register-user` or `mas-cli` over ssh (a prod write → user approval). |
| GitLab | `glab` is logged in to code.fe80.eu as `t` (token in `~/.config/glab-cli/config.yml`), ssh `git@code.fe80.eu` works. Group `dtn10` (id 96, private). `dtn10/element-web-themes` does not exist yet. |
| Recording | ffmpeg 9.0.2 (+NVENC/VAAPI), ImageMagick, edge-tts, Node 25.6.1, Playwright 1.62.1 (via `NODE_PATH=~/projects/matrix-search-widget/node_modules`), Chrome flatpak 157, podman 6.1.3. Skills: test-video, scripted-element-demo, demo-video; marcade-show `edit/tools/concat_scenes.py` for split screens. |

---

## 1. element.datanauten.de deploy path

### 1.1 Facts (verified)

- `curl -s https://element.datanauten.de/version` → `1.12.33` (upstream). Live config saved to
  `research/live-config.json` (identical to `research/live-config.element.datanauten.de.json`; MDAD mounts the same
  file under both names and Element reads the host-specific one first).
- Live config already has **24 custom themes** in `setting_defaults.custom_themes` (Catppuccin x4, Discord, Dracula,
  Nord, Gruvbox, Solarized, Selenized, Monokai Pro, Night Owl, …) because `matrix_client_element_themes_enabled: true`
  pulls `https://github.com/aaronraimist/element-themes` (MDAD role default repo). Our ~65 themes overlap; watch for name
  clashes (`custom-<name>` theme IDs) and decide whether the loader replaces that switch.
- `default_theme: "light"`, `show_labs_settings`, `disable_custom_urls: true`, `disable_guests: true`.
- 15 modules loaded today, order matters (remote-modules first, it can skip later ones):
  remote-modules, speed-start, marcade, keyboard-shortcuts, space-room-map, people-map, multi-tab, room-checker,
  teamwork, activity, tag-mentions, profile-status, files-hub, teams-welcome, user-account-widgets.
- Server side (read-only ssh): `/matrix/client-element/{config.json,modules/<name>/,nginx/csp-blob.conf.template,…}`,
  unit `matrix-client-element` is active.
- Module files get `etag` but no cache-control; config.json/index.html get `cache-control: no-cache`.

### 1.2 Mechanism (vars.yml, lines ~171–523)

File: `~/projects/dtn10/datanauten.de/inventory/host_vars/matrix.datanauten.de/vars.yml`

- `datanauten_element_modules` list → Jinja generates
  - `aux_directory_definitions_custom`: `/matrix/client-element/modules` + **one** dir per module (no subdirs!)
  - `aux_file_definitions_custom`: each listed file → `/matrix/client-element/modules/<name>/<file>`
  - `matrix_client_element_container_extra_arguments`: bind mount `…/modules` → `/app/element-modules` (ro), plus the
    CSP sub_filter template
  - `matrix_client_element_configuration_extension_json`: `{"modules": ["/element-modules/<name>/<entry>?v=<sha1[:12]>"], …merged config dicts}`
- CSP tweak: `files/element-nginx/csp-blob.conf.template` does `sub_filter "script-src 'self'" "script-src 'self' blob:"`.
  The same trick could add e.g. a font host to `font-src` if ever needed (prefer self-hosting).
- Docs: `~/projects/dtn10/datanauten.de/readme.md` ("Element Web modules"),
  `~/projects/element-modules/keyboard-shortcuts/docs/deployment.md` (full rationale, MDAD + ESS).

### 1.3 Adding the theme-loader (exact steps, for later)

```sh
R=~/projects/dtn10/datanauten.de
D=$R/inventory/host_vars/matrix.datanauten.de/files/element-modules/theme-loader
mkdir -p $D && cp ~/projects/element-web-themes/loader/lib/index.js ~/projects/element-web-themes/loader/lib/index.js.map $D/
# vars.yml, in datanauten_element_modules (after the existing ones, or right after speed-start
# if the theme must apply before first paint):
#  - name: theme-loader
#    files: [index.js, index.js.map]          # every file must be listed; flat dir only
#    config:
#      de.datanauten.theme_loader: { ... }
# (+ an entry under de.datanauten.remote_modules.about.theme-loader so the Modules tab describes it)
cd $R && . venv/bin/activate          # ansible core 2.20.11; vault pw file ~/datanauten-pw.txt (ansible.cfg)
ansible-playbook -i inventory/hosts matrix-docker-ansible-deploy/setup.yml --tags=setup-aux,setup-client-element
ssh matrix.datanauten.de sudo systemctl restart matrix-client-element
# verify
curl -s https://element.datanauten.de/config.element.datanauten.de.json | jq .modules
curl -sI https://element.datanauten.de/element-modules/theme-loader/index.js | head -1
```

Design consequences for the loader:
- **Bundle themes into `index.js`** (or few flat, listed files). The aux template creates no subdirectories and only
  `index.js` gets `?v=`; any other fetched file needs a content-hashed filename to avoid stale caches.
- Fonts: only `'self'` or `data:` → ship woff2 next to index.js (listed in `files`) or inline as data: URIs.
  No `@import url(https://fonts.googleapis.com…)`.
- Styles: inject `<style>` elements (allowed by `'unsafe-inline'`); `URL.createObjectURL` stylesheets are blocked.
- Background images from any https host are OK (`img-src *`).
- Don't add `start` to the tags (restarts every service). Use `--check` for a dry run first if desired.

### 1.4 Caveats before deploying

- **The datanauten.de working tree is dirty**: uncommitted changes in `vars.yml` (marcade 0.2.0 description), the
  marcade `index.js` (its hash `d5dc0312ad0c` already matches live, so it *was* deployed from the dirty tree), the
  MDAD submodule pointer, and untracked `agents.md`, `foo`, `matrix-cross-sign.py`, `tasks/`. Another session owns
  those; deploy from this tree only after checking/committing with the user, never `git stash/checkout` it.
- A deploy re-renders config.json from the local tree, so whatever is uncommitted goes live too.
- Fork source if ever needed: `~/projects/dtn10/matrix-code/element-web` (origin `git@github.com:yncyrydybyl/element-web.git`,
  branch develop). Upstream checkout for reading internals: `~/projects/element/element-web` (develop, v1.12.32-249).
- Module source repo convention: `~/projects/element-modules/element-web-modules` (GitHub `yncyrydybyl/element-web-modules`,
  releases via `gh workflow run release.yml -f module=<name>`); see its CLAUDE.md for build/vite conventions
  (copy `vite.config.ts`, banner line, React external, CSS `?inline`).

### 1.5 Alternative host: chat.blackpony.club

ESS Helm, v1.12.33, modules via ConfigMap + helm `--reuse-values` (precedent: multi-tab, commit `94d9ec8` in
`~/projects/blackponyclub/services/bpc-ess`). Its CSP has **no** blob: in script-src, same style/font rules.
No custom themes in its config. Good place to test with BPC users, but needs a helm deploy (cluster `oc login`).

---

## 2. Homeservers and test accounts

### 2.1 datanauten (behind element.datanauten.de)

- `default_server_config`: base_url `https://matrix.datanauten.de`, server_name `datanauten` (MXIDs use `datanauten.de`).
- Login only via MAS; `disable_custom_urls: true`, so recording on element.datanauten.de needs a datanauten account.
- Known accounts: `@yan:datanauten.de` (user), `@claude-dev:datanauten.de` (in remote-modules allowlist; no credential
  file found locally — **ask the user** for it or create a new one).
- Creating a user (prod write, needs approval):
  ```sh
  cd ~/projects/dtn10/datanauten.de && . venv/bin/activate
  ansible-playbook -i inventory/hosts matrix-docker-ansible-deploy/setup.yml \
    --extra-vars='username=themes-demo-1 password=<pw> admin=no' --tags=register-user
  # or directly:
  ssh matrix.datanauten.de sudo /matrix/matrix-authentication-service/bin/register-user themes-demo-1 '<pw>' 0
  ssh matrix.datanauten.de sudo /matrix/matrix-authentication-service/bin/mas-cli manage register-user --help
  ```
  New users auto-join `#welcome:datanauten.de` (real community room) – mind what ends up on camera.

### 2.2 Black Pony Club kit (self-service, isolated)

Kit: `~/projects/blackponyclub/services/bpc-ess/agents/` (read `AGENTS.md`, `README.md`). Endpoints: HS
`https://matrix.blackpony.club`, MAS `https://account.blackpony.club`, Element `https://chat.blackpony.club`.

```sh
cd ~/projects/blackponyclub/services/bpc-ess/agents
source .state/mas-admin.env                 # BPC_MAS_ADMIN_CLIENT_ID/SECRET → admin-api backend (no oc needed)
export BPC_AGENT_ID=element-web-themes      # prefix for all localparts/rooms; state in .state/element-web-themes.json
./bpc-agent register alice --display "Alice Example"   # → @element-web-themes-alice:blackpony.club, password + token stored in state (600)
./bpc-agent register bob
./bpc-agent room "Theme Lab" --as alice --invite bob [--encrypted] [--topic …] [--public]
./bpc-agent join '<room_id>' --as bob
./bpc-agent send '<room_id>' "hello" --as alice
./bpc-agent read '<room_id>' --as bob
./bpc-agent widget '<room_id>' <url>
./bpc-agent status
./bpc-agent cleanup [--purge]                # leave rooms + lock accounts
./bpc-agent logs element-web --tail 50       # needs oc
```
MCP alternative: `claude mcp add bpc-matrix -e BPC_AGENT_ID=… -- uv run --with 'mcp>=1.2,<2' python …/agents/mcp/server.py`.
The kit has no space/avatar/history/account-data commands; marcade-show built those on top:

**marcade-show casting scripts** (`~/projects/marcade/marcade-show/cast/`, doc `cast/CAST.md`):
| Script | Use for themes project |
|---|---|
| `scripts/seed.py [profiles|spaces|rooms|dms|register-kit|seed|encrypt|themes]` | stdlib Matrix client; reads tokens from the kit state `agents/.state/marcade-show.json`; creates spaces (restricted join), rooms with `club.blackpony.agent` tag, DMs (`m.direct`), avatars (media upload), seeded history (`messages.py`: replies, reactions, threads, code blocks), and **theme account data** `PUT /user/<id>/account_data/im.vector.web.settings` (`{"theme":"custom-<Name>","use_system_theme":false,"custom_themes":[…]}`). Copy + change `CAST`, `KIT_STATE`, `AGENT_TAG`. |
| `scripts/element-bootstrap.mjs <user> [setup|verify]` | Playwright: MAS password login in Element + cross-signing/4S bootstrap; recovery key → `.state/<user>.recovery` (never printed). Hard-codes chat.blackpony.club and cast paths. |
| `scripts/check-crypto.py [users]` | server-side check of cross-signing/backup/4S |
| `scripts/cleanup.sh` | kit cleanup + MAS admin lock |
| `scripts/render-avatars.mjs` | DiceBear avatars + contact sheet from `set.json` |

Existing cast (5 users, ~28 rooms, ~220 messages) is owned by `BPC_AGENT_ID=marcade-show`; creds in
`cast/.state/credentials.json`, logged-in profiles in `cast/profiles/<user>-element`. Don't reuse them without
coordinating with that crew (CREW.md, `locks/user-<name>`); use our own agent id.

Notes from CAST.md that matter for theme recordings:
- Device-level `mx_local_settings` beats account settings; force a theme in Playwright with
  `ctx.addInitScript` writing `localStorage.mx_local_settings = {theme:'custom-<Name>', use_system_theme:false}`.
- Seeded history must stay unencrypted (stdlib seeder); never enable encryption on a seeded room.
- New devices show "Confirm your identity", "Introducing Sections", notification toasts – dismiss off camera.

**Recommendation:** for per-theme clips use a **local throwaway stack** (no private data, no prod writes):
`~/.claude/skills/scripted-element-demo/scripts/stack.sh` (Synapse v1.162.0 `demo.test` :18490 + Element v1.12.33 :5820,
`DEMO_MODULES="theme-loader=/abs/path/loader/lib"`), and its `lib.cjs` (`L.register`, `L.createRoom`, `L.apiSend`, `L.login`).
Use BPC/datanauten only for the final "live on element.datanauten.de" shots.

---

## 3. code.fe80.eu GitLab

- `glab auth status --hostname code.fe80.eu` → logged in as `t`, ssh protocol; token plaintext in
  `~/.config/glab-cli/config.yml` (read into a variable, never print).
- ssh: `ssh -T git@code.fe80.eu` → "Welcome to GitLab, @t!". `Host code-fe80` in `~/.ssh/config` is the *root admin*
  login to the box – don't use it for git.
- Existing remotes: `dtn10/marcade-store` (id 453), `dtn10/handbook`, `dtn10/webxdc-show`, `dtn10/roomipedia`,
  `dtn10/opendesk-od-blackpony`, `dtn10/whatsup-mailinglist`, `oikotec/website`, `base45/sphinx_docs`, `websites/tej`.
- Fitting namespace: **`dtn10`** (group id 96, private). `GET projects/dtn10%2Felement-web-themes` → 404 (free).
- Create + push (needs a commit first; local repo is `git init`-ed on `main` with no commits):
  ```sh
  cd ~/projects/element-web-themes
  GITLAB_HOST=code.fe80.eu glab repo create dtn10/element-web-themes --private \
    --defaultBranch main -d "Theme loader Element Web module + themes"
  # (equivalent API: GITLAB_HOST=code.fe80.eu glab api -X POST projects -f name=element-web-themes -f namespace_id=96 -f visibility=private)
  git remote add origin git@code.fe80.eu:dtn10/element-web-themes.git   # if glab didn't add it
  git push -u origin main
  ```
  Check `glab repo create` didn't try to init/clone in cwd; `--help` shows it also accepts `--group dtn10`.

---

## 4. Recording tooling

Available: `ffmpeg 9.0.2` (libx264, h264_nvenc, h264_vaapi), `magick`, `edge-tts` (~/.local/bin), Node 25.6.1,
podman 6.1.3, Chrome flatpak `com.google.Chrome` 157 (launcher: `flatpak run --branch=stable --arch=x86_64 --command=/app/bin/chrome com.google.Chrome "$@"`),
Playwright 1.62.1 at `~/projects/matrix-search-widget/node_modules` (`export NODE_PATH=…`), many bundled chromium builds in
`~/.cache/ms-playwright`. Playwright MCP tools are also available in Claude sessions.

| Tool | Path | Use |
|---|---|---|
| test-video skill | `~/.claude/skills/test-video/SKILL.md` | Playwright + flatpak Chrome, `recordVideo`, phone frame (magick), ASS subtitles, ffmpeg composite. Mobile-portrait; good for a quick QA clip. |
| scripted-element-demo skill | `~/.claude/skills/scripted-element-demo/` (`scripts/stack.sh, lib.cjs, clip.cjs, record.example.cjs, build.py, shot.cjs`, `references/video.example.json, learnings.md`) | **Best fit**: local stack with modules mounted, `Clip` per scene (CDP screencast → mp4, injected cursor, click ripples, `c.now()` cue times), `build.py video.json [--plan|--test|--only]` → 1920x1080 narrated film (en-GB Libby, −16 LUFS, cards, music bed). Reference production `~/projects/element/customer-success/presentations/teams-vs-element/`. |
| demo-video skill | `~/.claude/skills/demo-video/` | for editing a real OBS screencast (zooms, cuts, re-narration, blur variant). |
| marcade-show edit pipeline | `~/projects/marcade/marcade-show/edit/PIPELINE.md`, `edit/tools/{concat_scenes.py,overlays.py,render.py,shot.cjs,theme_datanauten.py}` | multi-clip master + **split screen** (`hstack`/`vstack`/`grid`, 2–3 panes with name/theme header tags, frame-exact sync) + datanauten look (rail, chapter cards, lower thirds). |

### How to produce

**a) Per-theme scripted walkthrough clips** (≈65 short identical clips)
1. `DEMO_RUN=$PWD/.demo-stack DEMO_MODULES="theme-loader=$PWD/loader/lib" ~/.claude/skills/scripted-element-demo/scripts/stack.sh up`
2. Seed once via `lib.cjs` (2–3 users, a space, rooms with replies/reactions/code/thread so every theme surface shows).
3. One Playwright script loops over themes: set theme (addInitScript `mx_local_settings` or the loader's own API/UI),
   reload, run the same fixed path (room list → timeline → hover message → settings appearance → a dialog), one `Clip`
   per theme → `recordings/<theme>.mp4`. Use system Chrome for fonts; fixed viewport (e.g. 1250x780 or 1500x1000).
4. Contact sheet per clip: `ffmpeg -i x.mp4 -vf fps=1/2,scale=400:-1,tile=4x4 sheet.jpg` – look at it.

**b) Side-by-side comparison grids**
- 2–3 themes with headers: `concat_scenes.py` scene with `files`+`labels`, `layout: hstack|grid`.
- Larger grids (3x3, 4x4…): plain ffmpeg xstack on the per-theme clips (same length because the script is identical):
  ```sh
  ffmpeg -i a.mp4 -i b.mp4 -i c.mp4 -i d.mp4 -filter_complex \
   "[0]scale=960:540,drawtext=text='Nord':x=20:y=20:fontsize=32:fontcolor=white:box=1:boxcolor=black@0.5[a];…;\
    [a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0" -c:v h264_nvenc grid.mp4
  ```
- Stills grid: `magick montage shots/*.png -tile 8x -geometry 480x300+8+8 -label '%t' grid.png`.

**c) Narrated showcase**
- `scripted-element-demo/build.py video.json`: intro card, scenes from the clips (loader install, theme picker, highlights
  per family), `say` cues with points, outro links; `--plan` first, `--test`, then final. Or the marcade-show fork
  (`edit/tools/render.py`) for the datanauten look + chapter cards (needs `locks/gpu` per its CREW.md if run there).
- Optional "live" segment: record element.datanauten.de with a datanauten test account after the prod deploy.

---

## Blockers / needs user action

1. **Prod deploy** uses the dirty `~/projects/dtn10/datanauten.de` tree (other session's uncommitted marcade changes,
   submodule bump). Ask before deploying; don't touch that WIP.
2. **datanauten test account**: no credentials for `@claude-dev:datanauten.de` found; creating one is a prod write
   (ansible `register-user` / `mas-cli`). BPC accounts can't log in to element.datanauten.de (`disable_custom_urls`).
3. Vault password file `~/datanauten-pw.txt` exists, so ansible should run unattended; not exercised (no `--check` run).
4. GitLab: ready (`glab` token + ssh work). Project `dtn10/element-web-themes` must be created; local repo has no commits.
5. Theme naming collision with the 24 MDAD themes already in `setting_defaults.custom_themes`.
