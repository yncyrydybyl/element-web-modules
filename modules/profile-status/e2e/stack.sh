#!/usr/bin/env bash
# Throwaway test stack, nothing shared is touched (adapted from modules/teamwork/e2e/stack.sh):
#   - Synapse v1.162.0 on http://127.0.0.1:${PS_HS_PORT:-18482}, server name status.test, users alice,
#     bob and carol (passwords <name>-pass) and a server admin "admin" (admin-pass). Arbitrary profile
#     fields (MSC4133, spec v1.16) need no extra config in this Synapse version; the profile lookup
#     rate limit is raised because the module fetches the profiles of everyone on screen.
#     PS_MSC4429=1 sets include_profile_updates_in_sync, which advertises org.matrix.msc4429 and thereby
#     turns on Element's own MSC4426 implementation (labs "feature_user_status", default on in 1.12.33
#     when the server supports it), to test the module side by side with it.
#     Carol's profile card is prefilled through the admin's token, the way an IdP/HR sync would.
#   - Element Web v1.12.33 on http://127.0.0.1:${PS_EL_PORT:-5813}, lib/ mounted at /modules/profile-status
# State lives in e2e/.run/ (git-ignored).    e2e/stack.sh up | down
set -euo pipefail
cd "$(dirname "$0")/.."
HS_PORT=${PS_HS_PORT:-18482}
EL_PORT=${PS_EL_PORT:-5813}
HS=ps-e2e-synapse
EL=ps-e2e-element
RUN=$PWD/e2e/.run
HSURL=http://127.0.0.1:$HS_PORT
case "${1:-up}" in
  up)
    [ -f lib/index.js ] || pnpm build
    mkdir -p "$RUN/synapse"
    if [ ! -f "$RUN/synapse/homeserver.yaml" ]; then
      podman run --rm -e UID=0 -e GID=0 -v "$RUN/synapse:/data:z" -e SYNAPSE_SERVER_NAME=status.test -e SYNAPSE_REPORT_STATS=no \
        docker.io/matrixdotorg/synapse:v1.162.0 generate >/dev/null
      cat >> "$RUN/synapse/homeserver.yaml" <<'YAML'
enable_registration: false
rc_profile: {per_second: 100, burst_count: 1000}
rc_message: {per_second: 1000, burst_count: 1000}
rc_login:
  address: {per_second: 1000, burst_count: 1000}
  account: {per_second: 1000, burst_count: 1000}
  failed_attempts: {per_second: 1000, burst_count: 1000}
YAML
    fi
    sed -i '/^include_profile_updates_in_sync:/d' "$RUN/synapse/homeserver.yaml"
    [ "${PS_MSC4429:-0}" = 1 ] && echo "include_profile_updates_in_sync: true" >> "$RUN/synapse/homeserver.yaml"
    podman rm -f "$HS" >/dev/null 2>&1 || true
    podman run -d --name "$HS" -e UID=0 -e GID=0 -p "127.0.0.1:$HS_PORT:8008" -v "$RUN/synapse:/data:z" docker.io/matrixdotorg/synapse:v1.162.0 >/dev/null
    for _ in $(seq 60); do curl -sf "$HSURL/_matrix/client/versions" >/dev/null && break; sleep 1; done
    for u in alice bob carol; do
      podman exec "$HS" register_new_matrix_user -c /data/homeserver.yaml -u "$u" -p "$u-pass" --no-admin http://localhost:8008 >/dev/null 2>&1 || true
    done
    podman exec "$HS" register_new_matrix_user -c /data/homeserver.yaml -u admin -p admin-pass --admin http://localhost:8008 >/dev/null 2>&1 || true
    TOKEN=$(curl -sf -X POST "$HSURL/_matrix/client/v3/login" -H 'Content-Type: application/json' \
      -d '{"type":"m.login.password","identifier":{"type":"m.id.user","user":"admin"},"password":"admin-pass"}' | sed -E 's/.*"access_token":"([^"]+)".*/\1/')
    put() { curl -sf -X PUT "$HSURL/_matrix/client/v3/profile/%40carol%3Astatus.test/$1" -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' -d "{\"$1\": \"$2\"}" >/dev/null; }
    put de.datanauten.job_title "Head of Support"
    put de.datanauten.department "Customer Success"
    put de.datanauten.phone "+49 30 1234567"
    cat > "$RUN/element-config.json" <<JSON
{ "default_server_config": { "m.homeserver": { "base_url": "$HSURL", "server_name": "status.test" } },
  "disable_guests": true, "default_theme": "light", "bug_report_endpoint_url": "",
  "setting_defaults": { "UIFeature.feedback": false },
  "de.datanauten.profile_status": { "auto_reply": true } }
JSON
    podman rm -f "$EL" >/dev/null 2>&1 || true
    podman run -d --name "$EL" -p "127.0.0.1:$EL_PORT:$EL_PORT" -e ELEMENT_WEB_PORT="$EL_PORT" \
      -v "$RUN/element-config.json:/app/config.json:ro,z" -v "$PWD/lib:/modules/profile-status:ro,z" \
      ghcr.io/element-hq/element-web:v1.12.33 >/dev/null
    for _ in $(seq 30); do curl -sf "http://127.0.0.1:$EL_PORT/modules/profile-status/index.js" >/dev/null && break; sleep 1; done
    echo "Synapse $HSURL  Element http://127.0.0.1:$EL_PORT  (alice / alice-pass, bob / bob-pass, carol / carol-pass, admin / admin-pass)" ;;
  down) podman rm -f "$EL" "$HS" >/dev/null 2>&1 || true ;;
esac
