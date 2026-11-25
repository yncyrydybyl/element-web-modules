#!/usr/bin/env bash
# Side-by-side / grid video of walkthrough clips with a caption bar per tile.
#   tests/harness/grid.sh <out.mp4> <id1> <id2> [... up to 9]
# Inputs: recordings/walkthroughs/<id>.webm (ids may carry a phase suffix, e.g. teams-2026-daylight--night).
# Layout: 2 → 1x2, 3 → 1x3, 4 → 2x2, 5-6 → 2x3, 7-9 → 3x3 (empty cells black). Output 1920 px wide (x264, yuv420p).
# Caption = theme name from recordings/walkthroughs/<id>.json (written by walkthrough.mjs), else the id.
# Env: GRID_WIDTH (default 1920), GRID_CRF (default 23), GRID_ENCODER (libx264|h264_nvenc, default libx264).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WT="${GRID_SRC:-$ROOT/recordings/walkthroughs}"
[ $# -ge 3 ] || { sed -n '2,7p' "$0"; exit 2; }
OUT="$1"; shift
N=$#
[ "$N" -le 9 ] || { echo "max 9 tiles" >&2; exit 2; }
case $N in 2) C=2; Rw=1;; 3) C=3; Rw=1;; 4) C=2; Rw=2;; 5|6) C=3; Rw=2;; *) C=3; Rw=3;; esac
W=${GRID_WIDTH:-1920}
TW=$(( (W / C) / 2 * 2 ))           # tile width (even)
TH=$(( (TW * 900 / 1440) / 2 * 2 )) # tile video height, 16:10 like the recordings
CAP=$(( TH / 9 < 28 ? 28 : TH / 9 )); CAP=$(( CAP / 2 * 2 ))   # caption bar height
FS=$(( CAP * 55 / 100 ))
FONT=$(fc-match -f '%{file}' 'Inter:bold' 2>/dev/null || fc-match -f '%{file}' 'sans:bold')
ENC=${GRID_ENCODER:-libx264}

TMP=$(mktemp -d "${TMPDIR:-/tmp}/tl-grid.XXXXXX"); trap 'rm -rf "$TMP"' EXIT
inputs=(); filters=""; labels=""
i=0
for id in "$@"; do
  f="$WT/$id.webm"
  [ -f "$f" ] || { echo "missing $f (run walkthrough.mjs --theme ${id%%--*})" >&2; exit 1; }
  # caption: theme name (+ " · <phase>" when the clip was recorded with a forced phase, e.g. --phase day --name <id>)
  name=$(python3 -c "import json,sys;j=json.load(open(sys.argv[1]));print((j.get('name') or sys.argv[2])+(' · '+j['phase'] if j.get('phase') else ''))" "$WT/$id.json" "$id" 2>/dev/null || echo "$id")
  [[ "$id" == *--* && "$name" != *" · ${id##*--}" ]] && name="$name · ${id##*--}"
  printf '%s' "$name" > "$TMP/cap$i.txt"     # textfile= avoids drawtext escaping issues
  inputs+=(-i "$f")
  filters+="[$i:v]setpts=PTS-STARTPTS,fps=25,scale=${TW}:${TH}:flags=lanczos,pad=${TW}:$((TH + CAP)):0:${CAP}:color=0x111318,"
  filters+="drawtext=fontfile='${FONT}':textfile='$TMP/cap$i.txt':expansion=none:x=(w-text_w)/2:y=(${CAP}-text_h)/2:fontsize=${FS}:fontcolor=white[v$i];"
  labels+="[v$i]"
  i=$((i + 1))
done
# fill empty cells
CELLS=$((C * Rw))
while [ $i -lt $CELLS ]; do
  filters+="color=c=black:s=${TW}x$((TH + CAP)):r=25[v$i];"
  labels+="[v$i]"; i=$((i + 1))
done
layout=""
for ((r = 0; r < Rw; r++)); do for ((c = 0; c < C; c++)); do
  x=$([ $c -eq 0 ] && echo 0 || echo "$((c * TW))"); y=$([ $r -eq 0 ] && echo 0 || echo "$((r * (TH + CAP)))")
  layout+="${layout:+|}${x}_${y}"
done; done
filters+="${labels}xstack=inputs=${CELLS}:layout=${layout}:fill=black:shortest=0,format=yuv420p[out]"
if [ "$ENC" = h264_nvenc ]; then CODEC=(-c:v h264_nvenc -preset p5 -cq "${GRID_CRF:-23}"); else CODEC=(-c:v libx264 -preset medium -crf "${GRID_CRF:-23}"); fi
mkdir -p "$(dirname "$OUT")"
# padding cells are endless; -t limits to the longest real clip
DUR=$(for id in "$@"; do ffprobe -v error -show_entries format=duration -of csv=p=0 "$WT/$id.webm"; done | sort -n | tail -1)
ffmpeg -loglevel error -stats -y "${inputs[@]}" -filter_complex "$filters" -map "[out]" -t "$DUR" "${CODEC[@]}" -movflags +faststart "$OUT"
echo "→ $OUT (${N} tiles, ${C}x${Rw}, $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" | cut -c1-5) s)"
