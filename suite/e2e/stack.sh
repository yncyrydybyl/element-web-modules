#!/usr/bin/env bash
# Throwaway stack with the whole Teams suite loaded into one Element, to check the modules side by side:
#   - Synapse v1.162.0 on http://127.0.0.1:${SUITE_HS_PORT:-18485}, server name suite.test, with the
#     homeserver settings from suite/README.md (delayed events, profile updates in sync), users alice,
#     bob and carol (passwords <name>-pass), and the spaces #contoso and #engineering
#   - Element Web v1.12.33 on http://127.0.0.1:${SUITE_EL_PORT:-5816} with every suite module's lib/
#     mounted under /modules/<name>, and the example config.json from suite/README.md
# Builds a module first if its lib/ is missing. State lives in suite/e2e/.run/ (git-ignored).
#   suite/e2e/stack.sh up | down
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT=$(cd .. && pwd)
MODULES="teamwork activity tag-mentions profile-status files-hub teams-welcome"
HS_PORT=${SUITE_HS_PORT:-18485}
EL_PORT=${SUITE_EL_PORT:-5816}
SERVER=suite.test
URL=http://127.0.0.1:$HS_PORT/_matrix/client/v3
HS=suite-e2e-synapse
EL=suite-e2e-element
RUN=$PWD/e2e/.run
case "${1:-up}" in
  up)
    mounts=()
    for m in $MODULES; do
      [ -f "$ROOT/modules/$m/lib/index.js" ] || (cd "$ROOT/modules/$m" && pnpm install --frozen-lockfile && pnpm build)
      mounts+=(-v "$ROOT/modules/$m/lib:/modules/$m:ro,z")
    done
    mkdir -p "$RUN/synapse"
    if [ ! -f "$RUN/synapse/homeserver.yaml" ]; then
      podman run --rm -e UID=0 -e GID=0 -v "$RUN/synapse:/data:z" -e SYNAPSE_SERVER_NAME=$SERVER -e SYNAPSE_REPORT_STATS=no \
        docker.io/matrixdotorg/synapse:v1.162.0 generate >/dev/null
      cat >> "$RUN/synapse/homeserver.yaml" <<'YAML'
enable_registration: false
# teamwork "Send later": MSC4140 delayed events.
max_event_delay_duration: 30d
# profile-status: advertises MSC4429, so Element's own MSC4426 status display turns on as well.
include_profile_updates_in_sync: true
rc_message: {per_second: 1000, burst_count: 1000}
rc_delayed_event_mgmt: {per_second: 1000, burst_count: 1000}
rc_profile: {per_second: 100, burst_count: 1000}
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

    # The spaces teams-welcome offers, created by alice (skipped when the alias already exists).
    TOKEN=$(curl -sf -X POST "$URL/login" \
      -d '{"type":"m.login.password","identifier":{"type":"m.id.user","user":"alice"},"password":"alice-pass"}' | sed -E 's/.*"access_token":"([^"]+)".*/\1/')
    mkspace() { # alias localpart, name, topic, name of the room inside
      if curl -sf "$URL/directory/room/%23$1:$SERVER" >/dev/null; then return; fi
      local space room
      space=$(curl -sf -X POST -H "Authorization: Bearer $TOKEN" "$URL/createRoom" \
        -d "{\"name\":\"$2\",\"topic\":\"$3\",\"preset\":\"public_chat\",\"visibility\":\"public\",\"room_alias_name\":\"$1\",\"creation_content\":{\"type\":\"m.space\"}}" \
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
  "features": { "feature_wysiwyg_composer": true },
  "de.datanauten.teamswelcome": {
    "organisation": "Contoso",
    "help_url": "https://intranet.contoso.example/it-help",
    "help_label": "Contoso IT service desk",
    "spaces": ["#contoso:$SERVER", "#engineering:$SERVER"]
  },
  "de.datanauten.tag_mentions": { "max_mentions": 50 },
  "de.datanauten.profile_status": { "auto_reply": true },
  "de.datanauten.files_hub": { "cloud_link_cards": true } }
JSON
    podman rm -f "$EL" >/dev/null 2>&1 || true
    podman run -d --name "$EL" -p "127.0.0.1:$EL_PORT:$EL_PORT" -e ELEMENT_WEB_PORT="$EL_PORT" \
      -v "$RUN/element-config.json:/app/config.json:ro,z" "${mounts[@]}" \
      ghcr.io/element-hq/element-web:v1.12.33 >/dev/null
    for _ in $(seq 30); do curl -sf "http://127.0.0.1:$EL_PORT/modules/teams-welcome/index.js" >/dev/null && break; sleep 1; done
    echo "Synapse http://127.0.0.1:$HS_PORT  Element http://127.0.0.1:$EL_PORT  (alice / alice-pass, bob / bob-pass, carol / carol-pass)" ;;
  down) podman rm -f "$EL" "$HS" >/dev/null 2>&1 || true ;;
esac
