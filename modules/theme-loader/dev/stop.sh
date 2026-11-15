#!/usr/bin/env bash
# Stops the theme-loader dev server (only if it was started by dev/start.sh).
cd "$(dirname "$0")/.."
PIDF=.dev/server.pid
if [ -f "$PIDF" ]; then
    PID=$(cat "$PIDF")
    kill -TERM -- "-$PID" 2>/dev/null || kill -TERM "$PID" 2>/dev/null || true
    rm -f "$PIDF"
    echo "stopped"
else
    echo "not running (no $PIDF)"
fi
