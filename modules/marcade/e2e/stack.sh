#!/usr/bin/env bash
# Throwaway test stack for the live e2e, nothing shared is touched:
# (rootless podman: UID=0 in the container is the calling user on the host, so e2e/.run stays yours)
#   - Synapse  (matrixdotorg/synapse v1.162.0) on http://127.0.0.1:${MCM_HS_PORT:-18448}, server name marcade.test,
#     users alice (room admin) and bob (plain member), passwords alice-pass / bob-pass
#   - Element Web v1.12.30 (same image as opendesk-local) on http://127.0.0.1:${MCM_EL_PORT:-5791}
#     with dist/ mounted at /modules/marcade (the image's entrypoint adds it to config.json)
#   - a second Element on ${MCM_EL2_PORT:-5792} with "hide_integrations": true
# State lives in e2e/.run/ (git-ignored).    e2e/stack.sh up | down | logs
set -euo pipefail
cd "$(dirname "$0")/.."
HS_PORT=${MCM_HS_PORT:-18448}
EL_PORT=${MCM_EL_PORT:-5791}
HS=mcm-e2e-synapse
EL=mcm-e2e-element
EL2=mcm-e2e-element-hide
EL2_PORT=${MCM_EL2_PORT:-5792}
RUN=$PWD/e2e/.run
case "${1:-up}" in
  up)
    [ -f dist/index.js ] || npm run build
    mkdir -p "$RUN/synapse"
    if [ ! -f "$RUN/synapse/homeserver.yaml" ]; then
      podman run --rm -e UID=0 -e GID=0 -v "$RUN/synapse:/data:z" -e SYNAPSE_SERVER_NAME=marcade.test -e SYNAPSE_REPORT_STATS=no \
        docker.io/matrixdotorg/synapse:v1.162.0 generate >/dev/null
      cat >> "$RUN/synapse/homeserver.yaml" <<'YAML'
enable_registration: false
rc_message: {per_second: 1000, burst_count: 1000}
rc_login:
  address: {per_second: 1000, burst_count: 1000}
  account: {per_second: 1000, burst_count: 1000}
  failed_attempts: {per_second: 1000, burst_count: 1000}
rc_joins:
  local: {per_second: 1000, burst_count: 1000}
rc_registration: {per_second: 1000, burst_count: 1000}
YAML
    fi
    podman rm -f "$HS" >/dev/null 2>&1 || true
    podman run -d --name "$HS" -e UID=0 -e GID=0 -p "127.0.0.1:$HS_PORT:8008" -v "$RUN/synapse:/data:z" docker.io/matrixdotorg/synapse:v1.162.0 >/dev/null
    for _ in $(seq 60); do curl -sf "http://127.0.0.1:$HS_PORT/_matrix/client/versions" >/dev/null && break; sleep 1; done
    for u in alice bob; do
      podman exec "$HS" register_new_matrix_user -c /data/homeserver.yaml -u "$u" -p "$u-pass" --no-admin http://localhost:8008 >/dev/null 2>&1 || true
    done
    sed "s#__HS__#http://127.0.0.1:$HS_PORT#g" e2e/element-config.json > "$RUN/element-config.json"
    podman rm -f "$EL" >/dev/null 2>&1 || true
    podman run -d --name "$EL" -p "127.0.0.1:$EL_PORT:$EL_PORT" -e ELEMENT_WEB_PORT="$EL_PORT" \
      -v "$RUN/element-config.json:/app/config.json:ro,z" \
      -v "$PWD/dist:/modules/marcade:ro,z" \
      docker.io/vectorim/element-web:v1.12.30 >/dev/null
    # second Element, same module, "hide_integrations": true
    jq '."de.minagawa.marcade_element_module".hide_integrations = true' "$RUN/element-config.json" > "$RUN/element-config-hide.json"
    podman rm -f "$EL2" >/dev/null 2>&1 || true
    podman run -d --name "$EL2" -p "127.0.0.1:$EL2_PORT:$EL2_PORT" -e ELEMENT_WEB_PORT="$EL2_PORT" \
      -v "$RUN/element-config-hide.json:/app/config.json:ro,z" \
      -v "$PWD/dist:/modules/marcade:ro,z" \
      docker.io/vectorim/element-web:v1.12.30 >/dev/null
    for p in "$EL_PORT" "$EL2_PORT"; do
      for _ in $(seq 30); do curl -sf "http://127.0.0.1:$p/modules/marcade/index.js" >/dev/null && break; sleep 1; done
    done
    echo "Synapse http://127.0.0.1:$HS_PORT  Element http://127.0.0.1:$EL_PORT (hide_integrations: http://127.0.0.1:$EL2_PORT)" ;;
  down) podman rm -f "$EL" "$EL2" "$HS" >/dev/null 2>&1 || true ;;
  logs) podman logs "$EL"; podman logs "$EL2"; podman logs --tail 50 "$HS" ;;
esac
