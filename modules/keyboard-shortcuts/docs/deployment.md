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

ESS has no module setting, but none is needed. The chart mounts only `config.json` (no `config.<hostname>.json`), so the image's `/modules` auto-loader works, and the chart's nginx already serves `/modules`. Mount the module at `/modules/<name>/` and the image adds `/modules/<name>/index.js` to `config.json` when the pod starts.

1. Put the built module into a ConfigMap in the ESS namespace:

   ```sh
   kubectl create configmap element-module-keyboard-shortcuts -n ess --from-file=lib/index.js
   ```

2. Add a values file, e.g. `~/ess-config-values/element-modules.yaml`:

   ```yaml
   elementWeb:
     extraVolumes:
       - name: keyboard-shortcuts
         configMap:
           name: element-module-keyboard-shortcuts
     extraVolumeMounts:
       - name: keyboard-shortcuts
         mountPath: /modules/keyboard-shortcuts
         readOnly: true
     # Optional: the module's settings, merged into config.json
     additional:
       keyboard-shortcuts.json: |
         {"de.datanauten.keyboard_shortcuts": {"hidden_categories": ["labs"]}}
   ```

3. Pass it to your usual `helm upgrade --install … matrix-stack` command with one more `-f ~/ess-config-values/element-modules.yaml`. The Element Web pod restarts and loads the module.

For more modules, repeat the ConfigMap, volume and mount with another name. A ConfigMap holds at most 1 MiB, which is plenty for this module (~73 kB).

**Updating:** replace the ConfigMap (`kubectl create configmap … --dry-run=client -o yaml | kubectl apply -f -`). Kubernetes refreshes the mounted file within about a minute, without a restart. The URL stays the same and has no cache-buster, so browsers may keep a cached copy for a while. If users must get the new build right away, mount each version under a new name (e.g. `/modules/keyboard-shortcuts-0.2.0`) and run the `helm upgrade` again.

This was checked against Element Web v1.12.33 with ESS's nginx configuration and a read-only root filesystem, both with a ConfigMap-style mount and with the init container below downloading the v0.1.0 release: the module was added to `config.json`, served with `200`, and <kbd>?</kbd> opened the overlay.

### Straight from a GitHub release

Each module is published as a [GitHub release](https://github.com/yncyrydybyl/element-web-modules/releases) (tag `<module>-v<version>`, file `index.js`). Instead of a ConfigMap, an init container can download it into an empty volume every time the pod starts:

```yaml
elementWeb:
  extraVolumes:
    - name: keyboard-shortcuts
      emptyDir: {}
  extraVolumeMounts:
    - name: keyboard-shortcuts
      mountPath: /modules/keyboard-shortcuts
      readOnly: true
  extraInitContainers:
    - name: fetch-keyboard-shortcuts
      image: curlimages/curl:8.11.1
      args:
        - -fsSL
        - -o
        - /out/index.js
        - https://github.com/yncyrydybyl/element-web-modules/releases/download/keyboard-shortcuts-v0.1.0/index.js
      volumeMounts:
        - name: keyboard-shortcuts
          mountPath: /out
```

The pod needs outbound access to GitHub when it starts. To upgrade, change the version in the URL and run `helm upgrade` again. For a different module, replace both `keyboard-shortcuts` names and the tag.

**Why not just put the GitHub/CDN URL into `modules`?** Element Web's own Content Security Policy (in its `index.html`) only allows scripts from Element's origin, so the browser refuses to load a module from `cdn.jsdelivr.net` or GitHub. `raw.githubusercontent.com` also serves files as `text/plain`, which browsers never run as a module. The module has to be served by Element Web itself.

## Verifying

```sh
curl -s https://element.example.com/config.element.example.com.json | jq .modules   # or /config.json
curl -sI "https://element.example.com/element-modules/keyboard-shortcuts/index.js" | head -1   # 200
```

Then open Element, press <kbd>?</kbd> outside the composer, and check the browser console for `[keyboard-shortcuts]` messages.
