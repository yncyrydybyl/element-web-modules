#!/usr/bin/env bash
# Throwaway test stack, nothing shared is touched (adapted from modules/teams-welcome/e2e/stack.sh):
#   - Synapse v1.162.0 on http://127.0.0.1:${MT_HS_PORT:-18488}, server name mobile.test, users alice and bob
#     (passwords <name>-pass); alice has a room "Lobby" with bob and a few messages
#   - Element Web ${MT_ELEMENT:-v1.12.36} on http://127.0.0.1:${MT_EL_PORT:-5819}, lib/ mounted at /modules/mobile-themes
#   - ../theme-loader/lib is mounted too when it exists (the two modules are meant to run together);
#     try a phone viewport (390x844) or ?mt_mobile=1
# State lives in e2e/.run/ (git-ignored).    e2e/stack.sh up | down
set -euo pipefail
cd "$(dirname "$0")/.."
HS_PORT=${MT_HS_PORT:-18488}
EL_PORT=${MT_EL_PORT:-5819}
IMG="ghcr.io/element-hq/element-web:${MT_ELEMENT:-v1.12.36}"
HS=mt-e2e-synapse
EL=mt-e2e-element
SERVER=mobile.test
RUN=$PWD/e2e/.run
URL=http://127.0.0.1:$HS_PORT/_matrix/client/v3
MODULE=mobile-themes
case "${1:-up}" in
  up)
    [ -f lib/index.js ] || pnpm build
    mkdir -p "$RUN/synapse"
    if [ ! -f "$RUN/synapse/homeserver.yaml" ]; then
      podman run --rm -e UID=0 -e GID=0 -v "$RUN/synapse:/data:z" -e SYNAPSE_SERVER_NAME=$SERVER -e SYNAPSE_REPORT_STATS=no \
        docker.io/matrixdotorg/synapse:v1.162.0 generate >/dev/null
      cat >> "$RUN/synapse/homeserver.yaml" <<'YAML'
enable_registration: false
rc_message: {per_second: 1000, burst_count: 1000}
rc_joins:
  local: {per_second: 1000, burst_count: 1000}
  remote: {per_second: 1000, burst_count: 1000}
rc_login:
  address: {per_second: 1000, burst_count: 1000}
  account: {per_second: 1000, burst_count: 1000}
  failed_attempts: {per_second: 1000, burst_count: 1000}
YAML
    fi
    podman rm -f "$HS" >/dev/null 2>&1 || true
    podman run -d --name "$HS" -e UID=0 -e GID=0 -p "127.0.0.1:$HS_PORT:8008" -v "$RUN/synapse:/data:z" docker.io/matrixdotorg/synapse:v1.162.0 >/dev/null
    for _ in $(seq 60); do curl -sf "$URL/../versions" >/dev/null && break; sleep 1; done
    for u in alice bob; do
      podman exec "$HS" register_new_matrix_user -c /data/homeserver.yaml -u "$u" -p "$u-pass" --no-admin http://localhost:8008 >/dev/null 2>&1 || true
    done
    if [ ! -f "$RUN/seeded" ]; then
      login() { curl -sf -X POST "$URL/login" -d "{\"type\":\"m.login.password\",\"identifier\":{\"type\":\"m.id.user\",\"user\":\"$1\"},\"password\":\"$1-pass\"}" | sed -E 's/.*"access_token":"([^"]+)".*/\1/'; }
      A=$(login alice); B=$(login bob)
      room=$(curl -sf -X POST -H "Authorization: Bearer $A" "$URL/createRoom" -d "{\"name\":\"Lobby\",\"preset\":\"private_chat\",\"invite\":[\"@bob:$SERVER\"]}" | sed -E 's/.*"room_id":"([^"]+)".*/\1/')
      curl -sf -X POST -H "Authorization: Bearer $B" "$URL/rooms/$room/join" -d '{}' >/dev/null
      n=0
      for line in "A:Morning! Does the new theme work for you?" "B:Looks great, even the bold text" "A:Shall we try the daylight one?" "B:Sure, after lunch"; do
        n=$((n+1)); tok=$A; [ "${line%%:*}" = B ] && tok=$B
        curl -sf -X PUT -H "Authorization: Bearer $tok" "$URL/rooms/$room/send/m.room.message/seed$n" -d "{\"msgtype\":\"m.text\",\"body\":\"${line#*:}\"}" >/dev/null
      done
      touch "$RUN/seeded"
    fi
    LOADER=()
    [ -f ../theme-loader/lib/index.js ] && LOADER=(-v "$PWD/../theme-loader/lib:/modules/theme-loader:ro,z")
    cat > "$RUN/element-config.json" <<JSON
{ "default_server_config": { "m.homeserver": { "base_url": "http://127.0.0.1:$HS_PORT", "server_name": "$SERVER" } },
  "disable_guests": true, "bug_report_endpoint_url": "",
  "setting_defaults": { "UIFeature.feedback": false } }
JSON
    podman rm -f "$EL" >/dev/null 2>&1 || true
    podman run -d --name "$EL" -p "127.0.0.1:$EL_PORT:$EL_PORT" -e ELEMENT_WEB_PORT="$EL_PORT" \
      -v "$RUN/element-config.json:/app/config.json:ro,z" -v "$PWD/lib:/modules/$MODULE:ro,z" "${LOADER[@]}" \
      "$IMG" >/dev/null
    for _ in $(seq 30); do curl -sf "http://127.0.0.1:$EL_PORT/modules/$MODULE/index.js" >/dev/null && break; sleep 1; done
    echo "Synapse http://127.0.0.1:$HS_PORT  Element http://127.0.0.1:$EL_PORT ($IMG)  (alice / alice-pass, bob / bob-pass)" ;;
  down) podman rm -f "$EL" "$HS" >/dev/null 2>&1 || true ;;
esac
