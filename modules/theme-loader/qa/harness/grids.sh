#!/usr/bin/env bash
# All comparison grids in recordings/grids/ (wraps grid.sh). Needs the walkthrough webms (walkthrough.mjs; daylight
# variants recorded with --phase day --name <id>) and, for daylight-timelapse, recordings/timelapse/*.webm (timelapse.mjs).
#   tests/harness/grids.sh            # all
#   tests/harness/grids.sh lcars pure # only these (output basenames)
set -euo pipefail
H="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$H/../.." && pwd)"; G="$ROOT/recordings/grids"
export GRID_ENCODER=${GRID_ENCODER:-libx264} GRID_CRF=${GRID_CRF:-27}
declare -A GRIDS=(
  [teams-pure-past]="teams-2026-light teams-2026-dark teams-2026-daylight teams-2024 teams-classic-2020"
  [teams-usable-exciting]="teams-usable-light teams-usable-dark teams-2028 teams-comic teams-cyberpunk"
  [win311]="win311-default win311-usable win311-leather win311-daylight win311-2030 win311-hotdog win311-cyberpunk"
  [kde]="kde-breeze-light kde-breeze-dark kde-breeze-daylight kde-oxygen kde-ocean kde-usable kde-glass"
  [comic]="comic-casual-friday comic-geocities comic-wordart comic-poster comic-unreadable comic-after-midnight"
  [sketch-clean]="sketch-designed sketch-wireframe sketch-notebook sketch-whiteboard sketch-daylight"
  [sketch-wild]="sketch-blueprint sketch-chalkboard sketch-napkin sketch-scribble sketch-unreadable"
  [lcars]="lcars-tng lcars-voyager lcars-picard lcars-usable lcars-daylight lcars-red-alert lcars-lower-decks"
  [enlightenment]="e16-brushed-metal e17-glow e-current e-usable e-daylight e-aurora e-ember e-neon-steel"
  [paper]="paper-white paper-white-quiet paper-white-invisible paper-black paper-black-quiet paper-black-invisible paper-daylight"
  [crossover]="x-win311-lcars x-teams-sketch x-kde-e16"
  [pure]="teams-2026-light win311-default kde-breeze-light comic-casual-friday sketch-designed lcars-tng e17-glow paper-white x-teams-sketch"
  [exciting]="teams-cyberpunk win311-hotdog kde-glass comic-unreadable sketch-unreadable lcars-red-alert e-neon-steel paper-daylight x-win311-lcars"
  [daylight-day]="teams-2026-daylight win311-daylight kde-breeze-daylight sketch-daylight lcars-daylight e-daylight paper-daylight"
  [ladder-sketch]="sketch-designed sketch-wireframe sketch-notebook sketch-whiteboard sketch-blueprint sketch-napkin sketch-scribble sketch-unreadable"
  [ladder-comic]="comic-casual-friday comic-geocities comic-wordart comic-poster comic-unreadable"
)
ORDER="teams-pure-past teams-usable-exciting win311 kde comic sketch-clean sketch-wild lcars enlightenment paper crossover pure exciting daylight-day daylight-timelapse ladder-sketch ladder-comic"
want="${*:-$ORDER}"
for g in $want; do
  if [ "$g" = daylight-timelapse ]; then
    GRID_SRC="$ROOT/recordings/timelapse" "$H/grid.sh" "$G/daylight-timelapse.mp4" \
      teams-2026-daylight win311-daylight kde-breeze-daylight sketch-daylight lcars-daylight e-daylight paper-daylight
  else
    # shellcheck disable=SC2086
    "$H/grid.sh" "$G/$g.mp4" ${GRIDS[$g]}
  fi
  sz=$(stat -c %s "$G/$g.mp4")
  if [ "$sz" -gt 15000000 ]; then   # keep each grid ≤ ~15 MB: one more pass with a higher CRF
    echo "  $g: $((sz / 1000000)) MB > 15 MB, re-encoding with CRF $((GRID_CRF + 4))"
    if [ "$g" = daylight-timelapse ]; then
      GRID_CRF=$((GRID_CRF + 4)) GRID_SRC="$ROOT/recordings/timelapse" "$H/grid.sh" "$G/$g.mp4" teams-2026-daylight win311-daylight kde-breeze-daylight sketch-daylight lcars-daylight e-daylight paper-daylight
    else
      # shellcheck disable=SC2086
      GRID_CRF=$((GRID_CRF + 4)) "$H/grid.sh" "$G/$g.mp4" ${GRIDS[$g]}
    fi
  fi
done
ls -la "$G"
