#!/usr/bin/env bash
# Throwaway test stack, nothing shared is touched (adapted from modules/text-reactions/e2e/stack.sh):
#   - Synapse v1.162.0 on http://127.0.0.1:${SS_HS_PORT:-18459}, server name ss.test,
#     users alice and bob (passwords alice-pass / bob-pass), a space "Team" and ${SS_ROOMS:-40} rooms
#     with a message from bob each, so alice has a room list worth drawing
#   - Element Web ${SS_ELEMENT:-v1.12.33} on http://127.0.0.1:${SS_EL_PORT:-5794}, lib/ mounted at /modules/speed-start
# State lives in e2e/.run/ (git-ignored).    e2e/stack.sh up | down
set -euo pipefail
cd "$(dirname "$0")/.."
HS_PORT=${SS_HS_PORT:-18459}
EL_PORT=${SS_EL_PORT:-5794}
ROOMS=${SS_ROOMS:-40}
HS=ss-e2e-synapse
EL=ss-e2e-element
RUN=$PWD/e2e/.run
case "${1:-up}" in
  up)
    [ -f lib/index.js ] || pnpm build
    mkdir -p "$RUN/synapse"
    fresh=0
    if [ ! -f "$RUN/synapse/homeserver.yaml" ]; then
      fresh=1
      podman run --rm -e UID=0 -e GID=0 -v "$RUN/synapse:/data:z" -e SYNAPSE_SERVER_NAME=ss.test -e SYNAPSE_REPORT_STATS=no \
        docker.io/matrixdotorg/synapse:v1.162.0 generate >/dev/null
      cat >> "$RUN/synapse/homeserver.yaml" <<'YAML'
enable_registration: false
rc_message: {per_second: 1000, burst_count: 1000}
rc_room_creation: {per_second: 1000, burst_count: 1000}
rc_joins:
  local: {per_second: 1000, burst_count: 1000}
rc_invites:
  per_room: {per_second: 1000, burst_count: 1000}
  per_user: {per_second: 1000, burst_count: 1000}
rc_login:
  address: {per_second: 1000, burst_count: 1000}
  account: {per_second: 1000, burst_count: 1000}
  failed_attempts: {per_second: 1000, burst_count: 1000}
YAML
    fi
    podman rm -f "$HS" >/dev/null 2>&1 || true
    podman run -d --name "$HS" -e UID=0 -e GID=0 -p "127.0.0.1:$HS_PORT:8008" -v "$RUN/synapse:/data:z" docker.io/matrixdotorg/synapse:v1.162.0 >/dev/null
    for _ in $(seq 60); do curl -sf "http://127.0.0.1:$HS_PORT/_matrix/client/versions" >/dev/null && break; sleep 1; done
    cat > "$RUN/element-config.json" <<JSON
{ "default_server_config": { "m.homeserver": { "base_url": "http://127.0.0.1:$HS_PORT", "server_name": "ss.test" } },
  "disable_guests": true, "default_theme": "light", "bug_report_endpoint_url": "",
  "setting_defaults": { "UIFeature.feedback": false } }
JSON
    podman rm -f "$EL" >/dev/null 2>&1 || true
    podman run -d --name "$EL" -p "127.0.0.1:$EL_PORT:$EL_PORT" -e ELEMENT_WEB_PORT="$EL_PORT" \
      -v "$RUN/element-config.json:/app/config.json:ro,z" -v "$PWD/lib:/modules/speed-start:ro,z" \
      "ghcr.io/element-hq/element-web:${SS_ELEMENT:-v1.12.33}" >/dev/null
    for _ in $(seq 30); do curl -sf "http://127.0.0.1:$EL_PORT/modules/speed-start/index.js" >/dev/null && break; sleep 1; done
    if [ "$fresh" = 1 ]; then
      for u in alice bob; do
        podman exec "$HS" register_new_matrix_user -c /data/homeserver.yaml -u "$u" -p "$u-pass" --no-admin http://localhost:8008 >/dev/null 2>&1 || true
      done
      api() { local body=${4:-}; [ -n "$body" ] || body='{}'
        curl -sf -X "$1" -H "Authorization: Bearer $2" "http://127.0.0.1:$HS_PORT/_matrix/client/v3/$3" -d "$body"; }
      login() { curl -sf -X POST "http://127.0.0.1:$HS_PORT/_matrix/client/v3/login" -d "{\"type\":\"m.login.password\",\"identifier\":{\"type\":\"m.id.user\",\"user\":\"$1\"},\"password\":\"$1-pass\"}" | jq -r .access_token; }
      BOB=$(login bob); ALICE=$(login alice)
      SPACE=$(api POST "$BOB" createRoom '{"name":"Team","preset":"public_chat","creation_content":{"type":"m.space"},"invite":["@alice:ss.test"]}' | jq -r .room_id)
      api POST "$ALICE" "join/$SPACE" >/dev/null
      for i in $(seq "$ROOMS"); do
        R=$(api POST "$BOB" createRoom "{\"name\":\"Room $i\",\"preset\":\"private_chat\",\"invite\":[\"@alice:ss.test\"]}" | jq -r .room_id)
        api POST "$ALICE" "join/$R" >/dev/null
        [ "$i" -le 10 ] && api PUT "$BOB" "rooms/$SPACE/state/m.space.child/$R" '{"via":["ss.test"]}' >/dev/null
        api PUT "$BOB" "rooms/$R/send/m.room.message/t$i" "{\"msgtype\":\"m.text\",\"body\":\"Secret preview text $i\"}" >/dev/null
      done
    fi
    echo "Synapse http://127.0.0.1:$HS_PORT  Element http://127.0.0.1:$EL_PORT  (alice / alice-pass)" ;;
  down) podman rm -f "$EL" "$HS" >/dev/null 2>&1 || true ;;
esac
