#!/usr/bin/env bash
# Starts the theme-loader dev server on :5400 as a background service. Idempotent: if it already runs, do nothing.
set -eu
cd "$(dirname "$0")/.."
LOADER=$(pwd)
PORT=${TL_DEV_PORT:-5400}
RUN="$LOADER/.dev"
EL_VER=1.12.33
EL_DIR="$LOADER/.element/element-v$EL_VER"
mkdir -p "$RUN"

if curl -fsS -m 3 "http://127.0.0.1:$PORT/tl-dev/status" 2>/dev/null | grep -q '"theme-loader-dev"'; then
    echo "theme-loader dev server already running: http://127.0.0.1:$PORT/"
    exit 0
fi
if (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then
    echo "port $PORT is taken by something else; not starting" >&2
    exit 1
fi

# One starter at a time (several agents may run this concurrently).
exec 9>"$RUN/start.lock"
if command -v flock >/dev/null; then flock -w 60 9; fi
if curl -fsS -m 3 "http://127.0.0.1:$PORT/tl-dev/status" 2>/dev/null | grep -q '"theme-loader-dev"'; then
    echo "theme-loader dev server already running: http://127.0.0.1:$PORT/"
    exit 0
fi

[ -d node_modules ] || pnpm install --frozen-lockfile >/dev/null
if [ ! -f "$EL_DIR/index.html" ]; then
    echo "downloading Element $EL_VER …"
    mkdir -p "$LOADER/.element"
    curl -fsSL -o "$LOADER/.element/element.tar.gz" "https://github.com/element-hq/element-web/releases/download/v$EL_VER/element-v$EL_VER.tar.gz"
    tar xzf "$LOADER/.element/element.tar.gz" -C "$LOADER/.element"
fi

# Supervisor loop: restarts the server if it ever dies; killed as a process group by stop.sh.
setsid sh -c '
    while :; do
        node dev/server.mjs
        code=$?
        [ "$code" = 3 ] && exit 3           # port taken
        echo "$(date -Is) server exited ($code), restarting in 1s"
        sleep 1
    done
' >>"$RUN/server.log" 2>&1 </dev/null &
echo $! >"$RUN/server.pid"

i=0
until curl -fsS -m 2 "http://127.0.0.1:$PORT/tl-dev/status" >/dev/null 2>&1; do
    i=$((i + 1))
    if [ $i -gt 40 ]; then echo "dev server did not come up; see $RUN/server.log" >&2; exit 1; fi
    sleep 0.25
done
echo "theme-loader dev server started: http://127.0.0.1:$PORT/ (log: $RUN/server.log)"
