# Deployment

The module is one file, `lib/index.js` (plus an optional `index.js.map`). Element Web needs to be able to fetch it, and its URL has to be listed under `modules` in Element's config. Everything below applies to any Element Web module, not just this one.

General rules, whatever the setup:

- **Serve it from Element's own origin** if you can, e.g. at `/element-modules/keyboard-shortcuts/index.js`. Then no CORS headers are needed.
- **Cache-bust the URL** (`index.js?v=<content hash>`). The official image's nginx sends no cache headers for module files, so without a new URL browsers can keep running an old build. `config.json` itself is always re-fetched, so changing the URL there is enough.
- **Restart the container after changing the config.** The image copies the config at startup.

## matrix-docker-ansible-deploy

### With native module support

A pull request adds `matrix_client_element_modules` to the `matrix-client-element` role ([yncyrydybyl/matrix-docker-ansible-deploy#26](https://github.com/yncyrydybyl/matrix-docker-ansible-deploy/pull/26)). With it, a module is one list entry:

```yaml
matrix_client_element_modules:
  - name: keyboard-shortcuts
    src: "{{ inventory_dir }}/files/element-modules/keyboard-shortcuts"   # holds index.js
    config:
      de.datanauten.keyboard_shortcuts:
        hidden_categories: [labs]
```

The role copies the files, mounts them, adds the hashed URL to `modules` and restarts Element Web when needed.

### Without it

The released playbook has no module variables, so three generic hooks do the job. This setup runs in production with two modules. It is driven by one list:

```yaml
my_element_modules_src_dir: "{{ inventory_dir }}/files/element-modules"
my_element_modules:
  - name: keyboard-shortcuts
    files: [index.js, index.js.map]
    # entry: index.js        # the file listed in "modules" (default index.js)
    # config: {…}            # merged into config.json

aux_directory_definitions_custom: |-
  {%- set dirs = [{'dest': matrix_client_element_data_path ~ '/modules'}] -%}
  {%- for m in my_element_modules -%}
  {%-   set _ = dirs.append({'dest': matrix_client_element_data_path ~ '/modules/' ~ m.name}) -%}
  {%- endfor -%}
  {{ dirs }}

aux_file_definitions_custom: |-
  {%- set files = [] -%}
  {%- for m in my_element_modules -%}
  {%-   for f in m.files -%}
  {%-     set _ = files.append({
            'dest': matrix_client_element_data_path ~ '/modules/' ~ m.name ~ '/' ~ f,
            'src': my_element_modules_src_dir ~ '/' ~ m.name ~ '/' ~ f,
            'mode': '0644'}) -%}
  {%-   endfor -%}
  {%- endfor -%}
  {{ files }}

matrix_client_element_container_extra_arguments:
  - "--mount type=bind,src={{ matrix_client_element_data_path }}/modules,dst=/app/element-modules,ro"

matrix_client_element_configuration_extension_json: |-
  {%- set urls = [] -%}
  {%- set extra = {} -%}
  {%- for m in my_element_modules -%}
  {%-   set entry = m.entry | default('index.js') -%}
  {%-   set hash = lookup('ansible.builtin.file', my_element_modules_src_dir ~ '/' ~ m.name ~ '/' ~ entry) | hash('sha1') -%}
  {%-   set _ = urls.append('/element-modules/' ~ m.name ~ '/' ~ entry ~ '?v=' ~ hash[:12]) -%}
  {%-   set _ = extra.update(m.config | default({})) -%}
  {%- endfor -%}
  {{ extra | combine({'modules': urls}) | to_json }}
```

Deploy with `--tags=setup-aux,setup-client-element`, then restart `matrix-client-element`. (In current playbook versions, the `start` tag restarts every service, which a module update doesn't need.)

**Don't use the image's `/modules` auto-loader here.** It only adds modules to `config.json`, but the playbook installs the same config as `config.<element hostname>.json` too, and Element Web reads that file first (`apps/web/src/vector/getconfig.ts`). Modules mounted at `/modules` therefore never load.

## ESS Community (Helm)

ESS has no module setting, but none is needed: it mounts only `config.json`, so the image's `/modules` auto-loader works, and the chart's nginx already serves `/modules`. Mount the module at `/modules/<name>/` and the image adds `/modules/<name>/index.js` to the config at startup:

```yaml
elementWeb:
  extraVolumes:
    - name: keyboard-shortcuts
      configMap:
        name: element-module-keyboard-shortcuts   # kubectl create configmap element-module-keyboard-shortcuts --from-file=lib/index.js
  extraVolumeMounts:
    - name: keyboard-shortcuts
      mountPath: /modules/keyboard-shortcuts
      readOnly: true
  additional:
    keyboard-shortcuts.json: |
      {"de.datanauten.keyboard_shortcuts": {"hidden_categories": ["labs"]}}
```

A ConfigMap holds at most 1 MiB, which is plenty for this module. The auto-loader's URL has no cache-buster, so after an update some browsers may run the old build for a while.

## Verifying

```sh
curl -s https://element.example.com/config.element.example.com.json | jq .modules   # or /config.json
curl -sI "https://element.example.com/element-modules/keyboard-shortcuts/index.js" | head -1   # 200
```

Then open Element, press <kbd>?</kbd> outside the composer, and check the browser console for `[keyboard-shortcuts]` messages.
