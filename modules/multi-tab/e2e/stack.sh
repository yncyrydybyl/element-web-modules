#!/usr/bin/env bash
# Throwaway test stack for multi-tab, nothing shared is touched (adapted from modules/speed-start/e2e/stack.sh):
#   - Synapse v1.162.0 on http://127.0.0.1:${MT_HS_PORT:-18460}, server name mt.test, users alice and bob
#     (passwords alice-pass / bob-pass), a space "MT Team" with ${MT_ROOMS:-30} unencrypted rooms "Room N"
#     (one message from bob each) and ${MT_ENC_ROOMS:-10} megolm rooms "Enc N", alice and bob joined everywhere
#   - logging proxy (e2e/proxy.mjs) on http://127.0.0.1:${MT_PROXY_PORT:-18461} -> Synapse, log in e2e/.run/proxy-18461.jsonl
#   - Element Web ${MT_ELEMENT:-v1.12.33} on http://127.0.0.1:${MT_EL_PORT:-5795}, lib/ mounted at /modules/multi-tab,
#     loaded via the image's /modules auto-loader (only if lib/index.js exists and MT_STOCK is unset), base_url -> proxy
#   - the same Element on http://127.0.0.1:${MT_EL_STOCK_PORT:-5796} WITHOUT the module, base_url -> proxy
# Room ids are written to e2e/.run/stack.json. State lives in e2e/.run/ (git-ignored).
#   e2e/stack.sh up | down | restart-proxy
set -euo pipefail
cd "$(dirname "$0")/.."
HS_PORT=${MT_HS_PORT:-18460}
PX_PORT=${MT_PROXY_PORT:-18461}
EL_PORT=${MT_EL_PORT:-5795}
EL2_PORT=${MT_EL_STOCK_PORT:-5796}
ROOMS=${MT_ROOMS:-30}
ENC_ROOMS=${MT_ENC_ROOMS:-10}
IMG="ghcr.io/element-hq/element-web:${MT_ELEMENT:-v1.12.33}"
HS=mt-e2e-synapse
EL=mt-e2e-element
EL2=mt-e2e-element-stock
RUN=$PWD/e2e/.run

element_config() { # $1 = modules JSON array
  cat <<JSON
{ "default_server_config": { "m.homeserver": { "base_url": "http://127.0.0.1:$PX_PORT", "server_name": "mt.test" } },
  "disable_guests": true, "default_theme": "light", "bug_report_endpoint_url": "",
  "show_labs_settings": false, "disable_3pid_login": true,
  "setting_defaults": { "UIFeature.feedback": false, "Spaces.allRoomsInHome": true },
  "modules": $1 }
JSON
}

start_proxy() {
  if [ -f "$RUN/proxy.pid" ] && kill -0 "$(cat "$RUN/proxy.pid")" 2>/dev/null; then return; fi
  nohup node e2e/proxy.mjs --target "http://127.0.0.1:$HS_PORT" --port "$PX_PORT" --log "$RUN/proxy-$PX_PORT.jsonl" \
    >"$RUN/proxy.out" 2>&1 &
  echo $! >"$RUN/proxy.pid"
  for _ in $(seq 20); do curl -sf "http://127.0.0.1:$PX_PORT/_matrix/client/versions" >/dev/null && break; sleep 0.25; done
}
stop_proxy() { [ -f "$RUN/proxy.pid" ] && kill "$(cat "$RUN/proxy.pid")" 2>/dev/null || true; rm -f "$RUN/proxy.pid"; }

case "${1:-up}" in
  up)
    if [ ! -f lib/index.js ] && [ -d node_modules ] && [ -z "${MT_NO_BUILD:-}" ]; then pnpm build || true; fi
    mkdir -p "$RUN/synapse"
    fresh=0
    if [ ! -f "$RUN/synapse/homeserver.yaml" ]; then
      fresh=1
      podman run --rm -e UID=0 -e GID=0 -v "$RUN/synapse:/data:z" -e SYNAPSE_SERVER_NAME=mt.test -e SYNAPSE_REPORT_STATS=no \
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
rc_key_requests: {per_second: 1000, burst_count: 1000}
rc_delayed_event_mgmt: {per_second: 1000, burst_count: 1000}
YAML
    fi
    podman rm -f "$HS" >/dev/null 2>&1 || true
    podman run -d --name "$HS" -e UID=0 -e GID=0 -p "127.0.0.1:$HS_PORT:8008" -v "$RUN/synapse:/data:z" docker.io/matrixdotorg/synapse:v1.162.0 >/dev/null
    for _ in $(seq 60); do curl -sf "http://127.0.0.1:$HS_PORT/_matrix/client/versions" >/dev/null && break; sleep 1; done
    start_proxy

    # The image's entrypoint (18-load-element-modules.sh) appends every directory mounted under /modules to the
    # config's `modules` at container start, so the config itself lists none (listing it too loads the module twice).
    # Restart the stack (`up` again) after lib/ first appears; rebuilds of lib/index.js are picked up on reload.
    element_config '[]' >"$RUN/element-config.json"
    element_config '[]' >"$RUN/element-config-stock.json"
    libmount=()
    mods='[]'
    if [ -f lib/index.js ] && [ -z "${MT_STOCK:-}" ]; then libmount=(-v "$PWD/lib:/modules/multi-tab:ro,z"); mods='["/modules/multi-tab/index.js"]'; fi
    podman rm -f "$EL" "$EL2" >/dev/null 2>&1 || true
    podman run -d --name "$EL" -p "127.0.0.1:$EL_PORT:$EL_PORT" -e ELEMENT_WEB_PORT="$EL_PORT" \
      -v "$RUN/element-config.json:/app/config.json:ro,z" "${libmount[@]}" "$IMG" >/dev/null
    podman run -d --name "$EL2" -p "127.0.0.1:$EL2_PORT:$EL2_PORT" -e ELEMENT_WEB_PORT="$EL2_PORT" \
      -v "$RUN/element-config-stock.json:/app/config.json:ro,z" "$IMG" >/dev/null
    for _ in $(seq 30); do curl -sf "http://127.0.0.1:$EL_PORT/config.json" >/dev/null && curl -sf "http://127.0.0.1:$EL2_PORT/config.json" >/dev/null && break; sleep 1; done

    if [ "$fresh" = 1 ] || [ ! -f "$RUN/stack.json" ]; then
      for u in alice bob; do
        podman exec "$HS" register_new_matrix_user -c /data/homeserver.yaml -u "$u" -p "$u-pass" --no-admin http://localhost:8008 >/dev/null 2>&1 || true
      done
      api() { local body=${4:-}; [ -n "$body" ] || body='{}'
        curl -sf -X "$1" -H "Authorization: Bearer $2" "http://127.0.0.1:$HS_PORT/_matrix/client/v3/$3" -d "$body"; }
      login() { curl -sf -X POST "http://127.0.0.1:$HS_PORT/_matrix/client/v3/login" -d "{\"type\":\"m.login.password\",\"identifier\":{\"type\":\"m.id.user\",\"user\":\"$1\"},\"password\":\"$1-pass\",\"initial_device_display_name\":\"stack.sh seed\"}" | jq -r .access_token; }
      BOB=$(login bob); ALICE=$(login alice)
      SPACE=$(api POST "$BOB" createRoom '{"name":"MT Team","preset":"public_chat","creation_content":{"type":"m.space"},"invite":["@alice:mt.test"]}' | jq -r .room_id)
      api POST "$ALICE" "join/$SPACE" >/dev/null
      rooms='[]'
      mk() { # name encrypted(0/1) index
        local init='[]'
        [ "$2" = 1 ] && init='[{"type":"m.room.encryption","state_key":"","content":{"algorithm":"m.megolm.v1.aes-sha2"}}]'
        local R
        R=$(api POST "$BOB" createRoom "{\"name\":\"$1\",\"preset\":\"private_chat\",\"invite\":[\"@alice:mt.test\"],\"initial_state\":$init}" | jq -r .room_id)
        api POST "$ALICE" "join/$R" >/dev/null
        api PUT "$BOB" "rooms/$SPACE/state/m.space.child/$R" '{"via":["mt.test"]}' >/dev/null
        [ "$2" = 0 ] && api PUT "$BOB" "rooms/$R/send/m.room.message/seed$3" "{\"msgtype\":\"m.text\",\"body\":\"Seed message $3\"}" >/dev/null
        rooms=$(jq -c --arg n "$1" --arg id "$R" --argjson e "$2" '. + [{name:$n, roomId:$id, encrypted:($e==1)}]' <<<"$rooms")
      }
      for i in $(seq "$ROOMS"); do mk "Room $i" 0 "$i"; done
      for i in $(seq "$ENC_ROOMS"); do mk "Enc $i" 1 "e$i"; done
      # The seed sessions are not needed any more; Element sessions are created per test run.
      api POST "$ALICE" logout >/dev/null || true
      api POST "$BOB" logout >/dev/null || true
      jq -n --arg hs "http://127.0.0.1:$HS_PORT" --arg px "http://127.0.0.1:$PX_PORT" --arg space "$SPACE" --argjson rooms "$rooms" \
        '{server:"local", serverName:"mt.test", homeserver:$hs, proxy:$px, element:"http://127.0.0.1:'"$EL_PORT"'", elementStock:"http://127.0.0.1:'"$EL2_PORT"'",
          users:{main:{userId:"@alice:mt.test", localpart:"alice", password:"alice-pass"}, peer:{userId:"@bob:mt.test", localpart:"bob", password:"bob-pass"}},
          spaceId:$space, rooms:$rooms}' >"$RUN/stack.json"
    fi
    echo "Synapse http://127.0.0.1:$HS_PORT  proxy http://127.0.0.1:$PX_PORT  Element http://127.0.0.1:$EL_PORT (modules: $mods)  stock Element http://127.0.0.1:$EL2_PORT" ;;
  restart-proxy) stop_proxy; start_proxy ;;
  down) stop_proxy; podman rm -f "$EL" "$EL2" "$HS" >/dev/null 2>&1 || true ;;
  *) echo "usage: $0 up | down | restart-proxy" >&2; exit 2 ;;
esac
