#!/usr/bin/env bash
# Throwaway test stack, nothing shared is touched (adapted from modules/teamwork/e2e/stack.sh):
#   - Synapse v1.162.0 on http://127.0.0.1:${TWL_HS_PORT:-18484}, server name welcome.test, users alice,
#     bob and carol (passwords <name>-pass)
#   - Element Web v1.12.33 on http://127.0.0.1:${TWL_EL_PORT:-5815}, lib/ mounted at /modules/teams-welcome,
#     with an example module config (organisation "Contoso", two spaces to join)
#   - alice creates the two public spaces #contoso:welcome.test and #engineering:welcome.test, each with
#     one room, so a fresh user can join them from the guide
# State lives in e2e/.run/ (git-ignored).    e2e/stack.sh up | down
set -euo pipefail
cd "$(dirname "$0")/.."
HS_PORT=${TWL_HS_PORT:-18484}
EL_PORT=${TWL_EL_PORT:-5815}
HS=twl-e2e-synapse
EL=twl-e2e-element
SERVER=welcome.test
RUN=$PWD/e2e/.run
URL=http://127.0.0.1:$HS_PORT/_matrix/client/v3
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
    for u in alice bob carol; do
      podman exec "$HS" register_new_matrix_user -c /data/homeserver.yaml -u "$u" -p "$u-pass" --no-admin http://localhost:8008 >/dev/null 2>&1 || true
    done

    # The example spaces, created by alice (idempotent: skipped when the alias already exists).
    TOKEN=$(curl -sf -X POST "$URL/login" \
      -d '{"type":"m.login.password","identifier":{"type":"m.id.user","user":"alice"},"password":"alice-pass"}' | sed -E 's/.*"access_token":"([^"]+)".*/\1/')
    mkspace() { # alias localpart, name, topic, name of the room inside
      if curl -sf "$URL/directory/room/%23$1:$SERVER" >/dev/null; then return; fi
      local space room
      space=$(curl -sf -X POST -H "Authorization: Bearer $TOKEN" "$URL/createRoom" \
        -d "{\"name\":\"$2\",\"topic\":\"$3\",\"preset\":\"public_chat\",\"visibility\":\"public\",\"room_alias_name\":\"$1\",\"creation_content\":{\"type\":\"m.space\"},\"power_level_content_override\":{\"events_default\":100}}" \
        | sed -E 's/.*"room_id":"([^"]+)".*/\1/')
      room=$(curl -sf -X POST -H "Authorization: Bearer $TOKEN" "$URL/createRoom" \
        -d "{\"name\":\"$4\",\"preset\":\"public_chat\",\"room_alias_name\":\"$1-general\"}" | sed -E 's/.*"room_id":"([^"]+)".*/\1/')
      curl -sf -X PUT -H "Authorization: Bearer $TOKEN" "$URL/rooms/$space/state/m.space.child/$room" \
        -d "{\"via\":[\"$SERVER\"],\"suggested\":true}" >/dev/null
      curl -sf -X PUT -H "Authorization: Bearer $TOKEN" "$URL/rooms/$room/state/m.space.parent/$space" \
        -d "{\"via\":[\"$SERVER\"],\"canonical\":true}" >/dev/null
    }
    mkspace contoso "Contoso" "Everyone at Contoso" "Contoso general"
    mkspace engineering "Engineering" "The engineering team" "Engineering general"

    cat > "$RUN/element-config.json" <<JSON
{ "default_server_config": { "m.homeserver": { "base_url": "http://127.0.0.1:$HS_PORT", "server_name": "$SERVER" } },
  "disable_guests": true, "default_theme": "light", "bug_report_endpoint_url": "",
  "setting_defaults": { "UIFeature.feedback": false },
  "de.datanauten.teamswelcome": {
    "organisation": "Contoso",
    "help_url": "https://intranet.contoso.example/it-help",
    "help_label": "Contoso IT service desk",
    "spaces": [
      { "alias": "#contoso:$SERVER", "name": "Contoso", "description": "Everyone at Contoso: news, announcements, social" },
      "#engineering:$SERVER"
    ],
    "steps": ["secure", "habits", "profile", "spaces"]
  } }
JSON
    podman rm -f "$EL" >/dev/null 2>&1 || true
    podman run -d --name "$EL" -p "127.0.0.1:$EL_PORT:$EL_PORT" -e ELEMENT_WEB_PORT="$EL_PORT" \
      -v "$RUN/element-config.json:/app/config.json:ro,z" -v "$PWD/lib:/modules/teams-welcome:ro,z" \
      ghcr.io/element-hq/element-web:v1.12.33 >/dev/null
    for _ in $(seq 30); do curl -sf "http://127.0.0.1:$EL_PORT/modules/teams-welcome/index.js" >/dev/null && break; sleep 1; done
    echo "Synapse http://127.0.0.1:$HS_PORT  Element http://127.0.0.1:$EL_PORT  (alice / alice-pass, bob / bob-pass, carol / carol-pass)" ;;
  down) podman rm -f "$EL" "$HS" >/dev/null 2>&1 || true ;;
esac
