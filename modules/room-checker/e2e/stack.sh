#!/usr/bin/env bash
# Throwaway test stack, nothing shared is touched (adapted from modules/people-map/e2e/stack.sh):
#   - Synapse v1.162.0 on http://127.0.0.1:${RC_HS_PORT:-18477}, server name rc.test, users alice
#     (alice-pass), bob and carol. Space "Acme" (alice is admin) with a well-kept room, rooms that
#     break policies, one where alice has no power, one she isn't in, and a sub-space "Teams";
#     space "Camp" belongs to bob, so alice can't change its policies.
#   - Element Web ${RC_ELEMENT:-v1.12.33} on http://127.0.0.1:${RC_EL_PORT:-5807}, lib/ mounted at /modules/room-checker
# State lives in e2e/.run/ (git-ignored).    e2e/stack.sh up | down | reset
set -euo pipefail
cd "$(dirname "$0")/.."
HS_PORT=${RC_HS_PORT:-18477}
EL_PORT=${RC_EL_PORT:-5807}
HS=rc-e2e-synapse
EL=rc-e2e-element
RUN=$PWD/e2e/.run
USERS="alice bob carol"
case "${1:-up}" in
  up)
    [ -f lib/index.js ] || pnpm build
    mkdir -p "$RUN/synapse"
    fresh=0
    if [ ! -f "$RUN/synapse/homeserver.yaml" ]; then
      fresh=1
      podman run --rm -e UID=0 -e GID=0 -v "$RUN/synapse:/data:z" -e SYNAPSE_SERVER_NAME=rc.test -e SYNAPSE_REPORT_STATS=no \
        docker.io/matrixdotorg/synapse:v1.162.0 generate >/dev/null
      cat >> "$RUN/synapse/homeserver.yaml" <<'YAML'
enable_registration: false
rc_message: {per_second: 1000, burst_count: 1000}
rc_room_creation: {per_second: 1000, burst_count: 1000}
rc_joins:
  local: {per_second: 1000, burst_count: 1000}
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
{ "default_server_config": { "m.homeserver": { "base_url": "http://127.0.0.1:$HS_PORT", "server_name": "rc.test" } },
  "disable_guests": true, "default_theme": "light", "bug_report_endpoint_url": "",
  "setting_defaults": { "UIFeature.feedback": false } }
JSON
    # No "modules" entry: the image loads everything mounted under /modules by itself.
    podman rm -f "$EL" >/dev/null 2>&1 || true
    podman run -d --name "$EL" -p "127.0.0.1:$EL_PORT:$EL_PORT" -e ELEMENT_WEB_PORT="$EL_PORT" \
      -v "$RUN/element-config.json:/app/config.json:ro,z" -v "$PWD/lib:/modules/room-checker:ro,z" \
      "ghcr.io/element-hq/element-web:${RC_ELEMENT:-v1.12.33}" >/dev/null
    for _ in $(seq 30); do curl -sf "http://127.0.0.1:$EL_PORT/modules/room-checker/index.js" >/dev/null && break; sleep 1; done
    if [ "$fresh" = 1 ]; then
      for u in $USERS; do
        podman exec "$HS" register_new_matrix_user -c /data/homeserver.yaml -u "$u" -p "$u-pass" --no-admin http://localhost:8008 >/dev/null 2>&1 || true
      done
      api() { local body=${4:-}; [ -n "$body" ] || body='{}'
        curl -sf -X "$1" -H "Authorization: Bearer $2" "http://127.0.0.1:$HS_PORT/_matrix/client/v3/$3" -d "$body"; }
      login() { curl -sf -X POST "http://127.0.0.1:$HS_PORT/_matrix/client/v3/login" -d "{\"type\":\"m.login.password\",\"identifier\":{\"type\":\"m.id.user\",\"user\":\"$1\"},\"password\":\"$1-pass\"}" | jq -r .access_token; }
      declare -A T
      for u in $USERS; do T[$u]=$(login "$u"); done
      for u in $USERS; do api PUT "${T[$u]}" "profile/@$u:rc.test/displayname" "{\"displayname\":\"${u^}\"}" >/dev/null; done
      # A picture for the well-kept rooms.
      AVATAR=$(printf '\x89PNG\r\n\x1a\n\0\0\0\rIHDR\0\0\0\x01\0\0\0\x01\x08\x06\0\0\0\x1f\x15\xc4\x89\0\0\0\rIDATx\x9cc\xf8\xcf\xc0\xf0\x1f\0\x05\0\x01\xff\x89\x99=\x1d\0\0\0\0IEND\xaeB`\x82' |
        curl -sf -X POST -H "Authorization: Bearer ${T[alice]}" -H "Content-Type: image/png" --data-binary @- "http://127.0.0.1:$HS_PORT/_matrix/media/v3/upload?filename=a.png" | jq -r .content_uri)
      # room CREATOR JSON-EXTRA MEMBERS... -> room id (members joined)
      room() { local by=$1 extra=$2; shift 2; local r
        r=$(api POST "${T[$by]}" createRoom "{\"preset\":\"public_chat\"$extra}" | jq -r .room_id)
        for m in "$@"; do api POST "${T[$m]}" "join/$r" >/dev/null; done; echo "$r"; }
      state() { api PUT "${T[$1]}" "rooms/$2/state/$3/${5:-}" "$4" >/dev/null; }
      child() { state "$3" "$1" m.space.child '{"via":["rc.test"]}' "$2"; }
      parent() { state "$3" "$2" m.space.parent '{"via":["rc.test"],"canonical":true}' "$1"; }
      # Room version 12: the creator has unlimited power and must not be listed.
      admins() { state "$1" "$2" m.room.power_levels "{\"users\":{\"@bob:rc.test\":100}}"; }
      ACME=$(room alice ',"name":"Acme","creation_content":{"type":"m.space"}' bob carol)
      admins alice "$ACME"
      GEN=$(room alice ",\"name\":\"General\",\"topic\":\"Everything about Acme that has no room of its own\",\"initial_state\":[{\"type\":\"m.room.encryption\",\"content\":{\"algorithm\":\"m.megolm.v1.aes-sha2\"}},{\"type\":\"m.room.avatar\",\"content\":{\"url\":\"$AVATAR\"}}]" bob carol)
      admins alice "$GEN"
      state alice "$GEN" m.room.join_rules "{\"join_rule\":\"restricted\",\"allow\":[{\"type\":\"m.room_membership\",\"room_id\":\"$ACME\"}]}"
      RANDOM_ROOM=$(room alice ',"name":"random"' bob)
      GUESTS=$(room alice ',"name":"Visitors","topic":"For guests","initial_state":[{"type":"m.room.guest_access","content":{"guest_access":"can_join"}},{"type":"m.room.history_visibility","content":{"history_visibility":"world_readable"}}]' carol)
      NONAME=$(room alice '' bob)
      PROJ=$(room bob ',"name":"Project X","topic":"Bob runs this one"' alice)
      SECRET=$(room bob ',"name":"Board"' carol)
      TEAMS=$(room alice ',"name":"Teams","creation_content":{"type":"m.space"}' bob)
      BERLIN=$(room alice ',"name":"Team Berlin","topic":"The Berlin office, its people and plans"' bob)
      for r in "$GEN" "$RANDOM_ROOM" "$GUESTS" "$NONAME"; do child "$ACME" "$r" alice; parent "$ACME" "$r" alice; done
      child "$ACME" "$PROJ" alice; child "$ACME" "$SECRET" alice; child "$ACME" "$TEAMS" alice
      parent "$ACME" "$PROJ" bob
      child "$TEAMS" "$BERLIN" alice
      CAMP=$(room bob ',"name":"Camp","creation_content":{"type":"m.space"}' alice)
      ORGA=$(room bob ',"name":"Camp orga"' alice); child "$CAMP" "$ORGA" bob
    fi
    echo "Synapse http://127.0.0.1:$HS_PORT  Element http://127.0.0.1:$EL_PORT  (alice / alice-pass)" ;;
  down) podman rm -f "$EL" "$HS" >/dev/null 2>&1 || true ;;
  # A fresh server with the seed data, as e2e/run.mjs expects it.
  reset) "$0" down; rm -rf "$RUN"; exec "$0" up ;;
esac
