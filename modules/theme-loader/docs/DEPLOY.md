# Deploying to element.datanauten.de

Production runs upstream Element 1.12.33, deployed with Ansible (matrix-docker-ansible-deploy) from
`~/projects/dtn10/datanauten.de` to `matrix.datanauten.de`. The theme loader is one entry in
`datanauten_element_modules` in `inventory/host_vars/matrix.datanauten.de/vars.yml`, placed right after
`speed-start` so it loads early. Each module is one flat directory, and every file must be listed in the entry's `files:` list.

## Steps

```sh
# 1. Build (validates manifests, scoping, assets; writes lib/ + lib/files.txt)
cd ~/projects/element-modules/element-web-modules/modules/theme-loader && pnpm build

# 2. Copy into the deploy repo
R=~/projects/dtn10/datanauten.de
D=$R/inventory/host_vars/matrix.datanauten.de/files/element-modules/theme-loader
rm -rf "$D" && mkdir -p "$D" && cp lib/* "$D/" && rm "$D/files.txt"

# 3. Refresh the files: list of the theme-loader entry in vars.yml from lib/files.txt
python3 tools/deploy/update_vars.py        # see below; or edit by hand

# 4. Deploy (≈10 min) and restart the Element container
cd $R && . venv/bin/activate
ansible-playbook -i inventory/hosts matrix-docker-ansible-deploy/setup.yml --tags=setup-aux,setup-client-element
ssh matrix.datanauten.de 'sudo systemctl daemon-reload && sudo systemctl restart matrix-client-element'

# 5. Verify
curl -s https://element.datanauten.de/config.json | jq '.modules'          # theme-loader/index.js?v=<new hash>
curl -sI https://element.datanauten.de/element-modules/theme-loader/index.js
```

Expect a ~20 s window of 404s while the container restarts. Right after the restart Element can show
"Your Element is misconfigured" for a moment; reload after ~1 min before judging.

`daemon-reload` matters whenever the container's mounts change (e.g. the mobile_guide mount): without it the restart
uses the old unit (`systemctl show matrix-client-element -p NeedDaemonReload` says `yes`).

## mobile-themes

Same deploy repo: entry `mobile-themes` in `datanauten_element_modules` (files from `modules/mobile-themes/lib`: `index.js`,
`index.js.map` → `files/element-modules/mobile-themes/`), and the replacement guide page
`mobile/server/mobile_guide/index.html` → `files/element-mobile-guide/index.html`, mounted over
`/app/mobile_guide/index.html`. Check: `node mobile/test/live-guide.mjs --base-url https://element.datanauten.de`.
openDesk: `bin/theme-loader-deploy` in the openDesk repo builds and ships both (runbook §11 there).

## Notes

- `index.js` is cache-busted by the deploy (`?v=<sha1[:12]>`). Theme CSS and assets carry their own `?v=<content hash>`,
  added by the build.
- CSP needs no change: the loader uses inline `<style>`, plus same-origin CSS and fonts.
- The vars entry also adds a description to the remote-modules "Modules" tab (`about.theme-loader`).
- Config key: `de.datanauten.theme_loader: { default_theme: null }`. Set a variant id to change the default for users
  who never picked a theme.
- The deploy repo's working tree may contain other sessions' uncommitted changes. Check first that what's in the tree
  is what's live (for example, compare the sha1 of each module's `index.js` with the live file), because a deploy publishes
  the whole tree.
- Rollback: remove the `theme-loader` entry from vars.yml and redeploy. Users' choices stay in account data
  (`de.datanauten.theme_loader`) and do nothing without the module.
