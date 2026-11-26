#!/usr/bin/env bash
PORT=${TL_DEV_PORT:-5400}
curl -fsS -m 3 "http://127.0.0.1:$PORT/tl-dev/status" && echo || { echo "not running on :$PORT"; exit 1; }
