#!/usr/bin/env bash
# Throwaway test stack, nothing shared is touched (adapted from modules/teamwork/e2e/stack.sh):
#   - Synapse v1.162.0 on http://127.0.0.1:${TM_HS_PORT:-18481}, server name tags.test,
#     users alice, bob and carol (passwords <name>-pass)
#   - Element Web v1.12.33 on http://127.0.0.1:${TM_EL_PORT:-5812}, lib/ mounted at /modules/tag-mentions
# Rooms are created from the browser or by API (encrypted rooms need a browser to post into them).
# State lives in e2e/.run/ (git-ignored).    e2e/stack.sh up | down
set -euo pipefail
cd "$(dirname "$0")/.."
HS_PORT=${TM_HS_PORT:-18481}
EL_PORT=${TM_EL_PORT:-5812}
HS=tagm-e2e-synapse
EL=tagm-e2e-element
RUN=$PWD/e2e/.run
case "${1:-up}" in
  up)
    [ -f lib/index.js ] || pnpm build
    mkdir -p "$RUN/synapse"
    if [ ! -f "$RUN/synapse/homeserver.yaml" ]; then
      podman run --rm -e UID=0 -e GID=0 -v "$RUN/synapse:/data:z" -e SYNAPSE_SERVER_NAME=tags.test -e SYNAPSE_REPORT_STATS=no \
        docker.io/matrixdotorg/synapse:v1.162.0 generate >/dev/null
      cat >> "$RUN/synapse/homeserver.yaml" <<'YAML'
enable_registration: false
rc_message: {per_second: 1000, burst_count: 1000}
rc_login:
  address: {per_second: 1000, burst_count: 1000}
  account: {per_second: 1000, burst_count: 1000}
  failed_attempts: {per_second: 1000, burst_count: 1000}
YAML
    fi
    podman rm -f "$HS" >/dev/null 2>&1 || true
    podman run -d --name "$HS" -e UID=0 -e GID=0 -p "127.0.0.1:$HS_PORT:8008" -v "$RUN/synapse:/data:z" docker.io/matrixdotorg/synapse:v1.162.0 >/dev/null
    for _ in $(seq 60); do curl -sf "http://127.0.0.1:$HS_PORT/_matrix/client/versions" >/dev/null && break; sleep 1; done
    for u in alice bob carol; do
      podman exec "$HS" register_new_matrix_user -c /data/homeserver.yaml -u "$u" -p "$u-pass" --no-admin http://localhost:8008 >/dev/null 2>&1 || true
    done
    cat > "$RUN/element-config.json" <<JSON
{ "default_server_config": { "m.homeserver": { "base_url": "http://127.0.0.1:$HS_PORT", "server_name": "tags.test" } },
  "disable_guests": true, "default_theme": "light", "bug_report_endpoint_url": "",
  "setting_defaults": { "UIFeature.feedback": false } }
JSON
    podman rm -f "$EL" >/dev/null 2>&1 || true
    podman run -d --name "$EL" -p "127.0.0.1:$EL_PORT:$EL_PORT" -e ELEMENT_WEB_PORT="$EL_PORT" \
      -v "$RUN/element-config.json:/app/config.json:ro,z" -v "$PWD/lib:/modules/tag-mentions:ro,z" \
      ghcr.io/element-hq/element-web:v1.12.33 >/dev/null
    for _ in $(seq 30); do curl -sf "http://127.0.0.1:$EL_PORT/modules/tag-mentions/index.js" >/dev/null && break; sleep 1; done
    echo "Synapse http://127.0.0.1:$HS_PORT  Element http://127.0.0.1:$EL_PORT  (alice / alice-pass, bob / bob-pass, carol / carol-pass)" ;;
  down) podman rm -f "$EL" "$HS" >/dev/null 2>&1 || true ;;
esac
