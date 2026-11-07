#!/usr/bin/env bash
# Throwaway test stack, nothing shared is touched (adapted from modules/speed-start/e2e/stack.sh):
#   - Synapse v1.162.0 on http://127.0.0.1:${PM_HS_PORT:-18476}, server name pm.test, users alice
#     (alice-pass) and a dozen others, in two spaces (Engineering, Camp 2026), a big lobby, DMs,
#     a WhatsApp-style puppet and a bot, with some messages, replies and mentions
#   - Element Web ${PM_ELEMENT:-v1.12.33} on http://127.0.0.1:${PM_EL_PORT:-5806}, lib/ mounted at /modules/people-map
# State lives in e2e/.run/ (git-ignored).    e2e/stack.sh up | down
set -euo pipefail
cd "$(dirname "$0")/.."
HS_PORT=${PM_HS_PORT:-18476}
EL_PORT=${PM_EL_PORT:-5806}
HS=pm-e2e-synapse
EL=pm-e2e-element
RUN=$PWD/e2e/.run
USERS="alice bob carol dave erin frank grace heidi ivan judy mallory olivia peggy trent whatsapp_4917612345 githubbot"
case "${1:-up}" in
  up)
    [ -f lib/index.js ] || pnpm build
    mkdir -p "$RUN/synapse"
    fresh=0
    if [ ! -f "$RUN/synapse/homeserver.yaml" ]; then
      fresh=1
      podman run --rm -e UID=0 -e GID=0 -v "$RUN/synapse:/data:z" -e SYNAPSE_SERVER_NAME=pm.test -e SYNAPSE_REPORT_STATS=no \
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
{ "default_server_config": { "m.homeserver": { "base_url": "http://127.0.0.1:$HS_PORT", "server_name": "pm.test" } },
  "disable_guests": true, "default_theme": "light", "bug_report_endpoint_url": "",
  "setting_defaults": { "UIFeature.feedback": false } }
JSON
    podman rm -f "$EL" >/dev/null 2>&1 || true
    podman run -d --name "$EL" -p "127.0.0.1:$EL_PORT:$EL_PORT" -e ELEMENT_WEB_PORT="$EL_PORT" \
      -v "$RUN/element-config.json:/app/config.json:ro,z" -v "$PWD/lib:/modules/people-map:ro,z" \
      "ghcr.io/element-hq/element-web:${PM_ELEMENT:-v1.12.33}" >/dev/null
    for _ in $(seq 30); do curl -sf "http://127.0.0.1:$EL_PORT/modules/people-map/index.js" >/dev/null && break; sleep 1; done
    if [ "$fresh" = 1 ]; then
      for u in $USERS; do
        podman exec "$HS" register_new_matrix_user -c /data/homeserver.yaml -u "$u" -p "$u-pass" --no-admin http://localhost:8008 >/dev/null 2>&1 || true
      done
      api() { local body=${4:-}; [ -n "$body" ] || body='{}'
        curl -sf -X "$1" -H "Authorization: Bearer $2" "http://127.0.0.1:$HS_PORT/_matrix/client/v3/$3" -d "$body"; }
      login() { curl -sf -X POST "http://127.0.0.1:$HS_PORT/_matrix/client/v3/login" -d "{\"type\":\"m.login.password\",\"identifier\":{\"type\":\"m.id.user\",\"user\":\"$1\"},\"password\":\"$1-pass\"}" | jq -r .access_token; }
      declare -A T
      for u in $USERS; do T[$u]=$(login "$u"); done
      name() { api PUT "${T[$1]}" "profile/@$1:pm.test/displayname" "{\"displayname\":\"$2\"}" >/dev/null; }
      for u in $USERS; do name "$u" "${u^}"; done
      name whatsapp_4917612345 "Oma (WA)"; name githubbot "GitHub"
      n=0
      # room NAME CREATOR MEMBERS... -> room id (everyone joined)
      room() { local nm=$1 by=$2; shift 2; local r
        r=$(api POST "${T[$by]}" createRoom "{\"name\":\"$nm\",\"preset\":\"public_chat\"}" | jq -r .room_id)
        for m in "$@"; do api POST "${T[$m]}" "join/$r" >/dev/null; done; echo "$r"; }
      space() { local nm=$1 by=$2; shift 2; local r
        r=$(api POST "${T[$by]}" createRoom "{\"name\":\"$nm\",\"preset\":\"public_chat\",\"creation_content\":{\"type\":\"m.space\"}}" | jq -r .room_id)
        for m in "$@"; do api POST "${T[$m]}" "join/$r" >/dev/null; done; echo "$r"; }
      child() { api PUT "${T[$3]}" "rooms/$1/state/m.space.child/$2" '{"via":["pm.test"]}' >/dev/null; }
      say() { n=$((n+1)); api PUT "${T[$2]}" "rooms/$1/send/m.room.message/m$n" "{\"msgtype\":\"m.text\",\"body\":\"$3\"${4:+,$4}}" | jq -r .event_id; }
      dm() { local r
        r=$(api POST "${T[$1]}" createRoom "{\"preset\":\"trusted_private_chat\",\"is_direct\":true,\"invite\":[\"@$2:pm.test\"]}" | jq -r .room_id)
        api POST "${T[$2]}" "join/$r" >/dev/null; echo "$r"; }
      ENG=$(space Engineering bob alice carol dave erin frank)
      WEB=$(room Web bob alice carol dave); child "$ENG" "$WEB" bob
      OPS=$(room Ops bob alice dave erin frank githubbot); child "$ENG" "$OPS" bob
      CAMP=$(space "Camp 2026" grace alice heidi ivan judy carol)
      ORGA=$(room "Camp orga" grace alice heidi ivan); child "$CAMP" "$ORGA" grace
      FOOD=$(room "Camp food" grace alice heidi ivan judy carol); child "$CAMP" "$FOOD" grace
      LOBBY=$(room Lobby mallory alice bob olivia peggy trent judy)
      FAMILY=$(room Family whatsapp_4917612345 alice)
      Q=$(say "$WEB" alice "Who reviews the release?")
      say "$WEB" bob "I can" "\"m.relates_to\":{\"m.in_reply_to\":{\"event_id\":\"$Q\"}}" >/dev/null
      say "$WEB" carol "Thanks @alice" "\"m.mentions\":{\"user_ids\":[\"@alice:pm.test\"]}" >/dev/null
      say "$OPS" dave "Deploy done" >/dev/null
      say "$OPS" githubbot "CI passed" >/dev/null
      say "$ORGA" heidi "Tents are booked" >/dev/null
      say "$FOOD" ivan "Pizza on Friday?" >/dev/null
      say "$LOBBY" mallory "Hello everyone" >/dev/null
      say "$FAMILY" whatsapp_4917612345 "Kommst du Sonntag?" >/dev/null
      DMB=$(dm alice bob); DMC=$(dm alice carol)
      say "$DMB" bob "Lunch?" >/dev/null; say "$DMC" carol "Got the slides" >/dev/null
      api PUT "${T[alice]}" "user/@alice:pm.test/account_data/m.direct" "{\"@bob:pm.test\":[\"$DMB\"],\"@carol:pm.test\":[\"$DMC\"]}" >/dev/null
      api PUT "${T[bob]}" "presence/@bob:pm.test/status" '{"presence":"online"}' >/dev/null
    fi
    echo "Synapse http://127.0.0.1:$HS_PORT  Element http://127.0.0.1:$EL_PORT  (alice / alice-pass)" ;;
  down) podman rm -f "$EL" "$HS" >/dev/null 2>&1 || true ;;
esac
