# Deployment with matrix-docker-ansible-deploy (datanauten.de)

The datanauten.de Element Web (`matrix.datanauten.de`, upstream image v1.12.32, the playbook default) is configured in `~/projects/dtn10/datanauten.de/inventory/host_vars/matrix.datanauten.de/vars.yml`.

## What MDAD offers for Element modules

**Nothing first-class.** This was checked on 2026-10-28 against MDAD @ `c6c03cde5` (the submodule) and upstream master. The role `roles/custom/matrix-client-element` has no module variables, and its docs don't mention modules. What it does have are two generic hooks:

- `matrix_client_element_container_extra_arguments`: extra `podman/docker run` arguments, used for a bind mount.
- `matrix_client_element_configuration_extension_json`: JSON that MDAD deep-merges into the generated `config.json`.

Plus the playbook-wide `aux_directory_definitions_custom` / `aux_file_definitions_custom`, which copy files from the inventory to the server.

### Why not the image's built-in `/modules` auto-loader?

The image's `18-load-element-modules.sh` adds every `/modules/<name>/` to `modules` in **`config.json` only**. MDAD bind-mounts the same generated file as both `/app/config.json` and `/app/config.element.datanauten.de.json`. Element fetches the host-specific file first and uses it if it's non-empty (`apps/web/src/vector/getconfig.ts`). So anything the auto-loader adds is never seen. Mounting at `/modules` *and* listing the module explicitly would also put it into `config.json` twice. The previous setup (Marcade only) had already worked this out correctly.

## Previous setup and what changed

Before, the Marcade module was wired up by hand: one aux dir, one aux file, a mount of `modules/marcade` at `/app/marcade-module`, and a hard-coded `"modules": ["/marcade-module/index.js"]`. That works, but:

- Each additional module needed edits in **four** places: dirs, files, a new mount, and the modules list.
- One bind mount per module meant more `podman run` arguments over time.
- **No cache-busting.** The image's nginx sends no cache headers for module files, so after updating `index.js` browsers could keep running the old build. That happened during testing for this module.

The new setup is driven by one list. All four variables are generated from it:

```yaml
datanauten_element_modules_src_dir: "{{ inventory_dir }}/host_vars/matrix.datanauten.de/files/element-modules"
datanauten_element_modules:
  - name: marcade
    files: [index.js]
  - name: keyboard-shortcuts
    files: [index.js, index.js.map]
    # optional:
    # entry: index.js                  # file listed in "modules" (default index.js)
    # config:                          # merged into config.json
    #   de.datanauten.keyboard_shortcuts:
    #     hidden_categories: [accessibility]
```

What it renders to, checked with a local `debug` playbook:

| Variable                                         | Value                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `aux_directory_definitions_custom`               | `/matrix/client-element/modules`, `…/modules/marcade`, `…/modules/keyboard-shortcuts`                                                  |
| `aux_file_definitions_custom`                    | each listed file → `/matrix/client-element/modules/<name>/<file>` (mode 0644)                                                          |
| `matrix_client_element_container_extra_arguments` | one mount: `…/modules` → `/app/element-modules` (ro)                                                                                  |
| `matrix_client_element_configuration_extension_json` | `{"modules": ["/element-modules/marcade/index.js?v=<sha1[:12]>", "/element-modules/keyboard-shortcuts/index.js?v=<sha1[:12]>"]}` plus any `config` |

The `?v=` value is the SHA-1 of the entry file in the inventory, so it changes exactly when the build changes. That layout (one mount, two modules, hashed URLs) was tested end-to-end against `ghcr.io/element-hq/element-web:v1.12.32`: both modules load and the overlay works.

Marcade's public URL moves from `/marcade-module/index.js` to `/element-modules/marcade/index.js`. Nothing else references that URL, and the bundle has no path-relative imports. The files stay in the same place on the server.

## Updating the keyboard-shortcuts module

```sh
cd ~/projects/element-modules/keyboard-shortcuts
pnpm test && pnpm build
cp lib/index.js lib/index.js.map \
   ~/projects/dtn10/datanauten.de/inventory/host_vars/matrix.datanauten.de/files/element-modules/keyboard-shortcuts/
# bump the version note next to the list entry in vars.yml, then:
cd ~/projects/dtn10/datanauten.de
ansible-playbook -i inventory/hosts matrix-docker-ansible-deploy/setup.yml --tags=setup-client-element,start
```

(Or `./up.sh` → *Element Web*.) `setup-client-element` re-renders `config.json` and restarts the container. Users get the new build on their next page load.

## Adding another module

1. Build it and copy the output to `files/element-modules/<name>/`.
2. Add `- name: <name>` with its `files` (and `config` if needed) to `datanauten_element_modules`.
3. Deploy as above.

## Verifying after a deploy

```sh
curl -s https://element.datanauten.de/config.element.datanauten.de.json | jq .modules
curl -sI "https://element.datanauten.de/element-modules/keyboard-shortcuts/index.js" | head -1   # 200
```

Then open Element, press <kbd>?</kbd> outside the composer, and check the browser console for `[keyboard-shortcuts]` messages.

## If MDAD ever adds native support

If upstream MDAD gains module variables, move the list over and drop the four generated variables. The `?v=` cache-busting is still worth keeping unless the new variables provide it too.
