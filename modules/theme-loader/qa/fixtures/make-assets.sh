#!/usr/bin/env bash
# Regenerates the fixture media in qa/fixtures/assets/ (committed; seed.py only uploads them).
# Needs ImageMagick 7 (magick) and ffmpeg. Deterministic enough: re-running produces the same pictures.
set -euo pipefail
D="$(cd "$(dirname "$0")" && pwd)/assets"
mkdir -p "$D"
F=Cantarell-Extra-Bold
avatar() { # name, colour1, colour2, label [font]
  magick -size 512x512 -define gradient:angle=135 "gradient:$2-$3" -gravity center \
    -font "${5:-$F}" -pointsize 210 -fill white -stroke 'rgba(0,0,0,0.18)' -strokewidth 6 -annotate +0+10 "$4" \
    -stroke none -fill white -annotate +0+10 "$4" "$D/$1.png"
}
avatar avatar-mira   '#ff7a59' '#c2185b' M
avatar avatar-jonas  '#26c6da' '#1565c0' J
avatar avatar-lena   '#9ccc65' '#00796b' L
avatar avatar-theo   '#ffca28' '#ef6c00' T
avatar room-space    '#7e57c2' '#311b92' TL
avatar room-showcase '#ec407a' '#6a1b9a' S
avatar room-design   '#ff8a65' '#d84315' D
avatar room-code     '#455a64' '#102027' '{}'
avatar room-release  '#42a5f5' '#0d47a1' R
avatar room-coffee   '#a1887f' '#4e342e' C
avatar room-rtl      '#26a69a' '#004d40' ع '/usr/share/fonts/google-noto-vf/NotoSansArabic[wght].ttf'
avatar room-long     '#78909c' '#263238' …
avatar room-sandbox  '#ffd54f' '#f57f17' SB

# Photos-ish: a landscape, a colour palette card, a tall diagram, a small square sticker-like image
magick -size 1600x1000 gradient:'#ffb36b'-'#5b2a86' \
  \( -size 1600x1000 xc:none -fill '#ffe08a' -draw 'circle 1100,560 1100,420' \) -composite \
  \( -size 1600x1000 xc:none -fill 'rgba(20,10,40,0.85)' -draw 'polygon 0,1000 0,720 260,560 520,700 760,520 1040,690 1300,600 1600,760 1600,1000' \) -composite \
  \( -size 1600x1000 xc:none -fill 'rgba(5,5,20,0.95)' -draw 'polygon 0,1000 0,860 340,760 700,880 1000,800 1600,900 1600,1000' \) -composite \
  "$D/photo-sunset.png"
magick -size 1200x700 xc:'#fafafa' \
  -fill '#0dbd8b' -draw 'roundrectangle 40,40 300,520 24,24' \
  -fill '#368bd6' -draw 'roundrectangle 330,40 590,520 24,24' \
  -fill '#ac3ba8' -draw 'roundrectangle 620,40 880,520 24,24' \
  -fill '#ff5b55' -draw 'roundrectangle 910,40 1160,520 24,24' \
  -font Cantarell-Bold -pointsize 44 -fill '#17191c' -annotate +44+610 'Theme Lab palette · accent / info / highlight / critical' \
  "$D/palette.png"
magick -size 700x1400 xc:'#f4f6fa' -stroke '#3d4a5c' -strokewidth 5 -fill '#ffffff' \
  -draw 'roundrectangle 100,80 600,260 30,30' -draw 'roundrectangle 100,420 600,600 30,30' \
  -draw 'roundrectangle 100,760 600,940 30,30' -draw 'roundrectangle 100,1100 600,1280 30,30' \
  -draw 'line 350,260 350,420' -draw 'line 350,600 350,760' -draw 'line 350,940 350,1100' \
  -stroke none -fill '#3d4a5c' -font Cantarell-Bold -pointsize 46 \
  -annotate +190+185 'themes.json' -annotate +215+525 'loader' -annotate +180+865 '<style> inject' -annotate +210+1205 'Element' \
  "$D/diagram-tall.png"
magick -size 400x400 xc:none -fill '#ffcc4d' -draw 'circle 200,200 200,20' -fill '#664500' \
  -draw 'circle 140,160 140,135' -draw 'circle 260,160 260,135' \
  -stroke '#664500' -strokewidth 18 -fill none -draw 'arc 110,170 290,320 20,160' "$D/sticker-smile.png"

# A small PDF and a JSON "file" attachment
magick -size 1240x1754 xc:white -font Cantarell-Bold -pointsize 64 -fill '#17191c' -annotate +100+200 'Theme Lab — release notes' \
  -font Cantarell-Regular -pointsize 36 -annotate +100+320 'Fixture document used to test file tiles.' "$D/release-notes.pdf"
cat > "$D/compound-tokens.json" <<'JSON'
{
  "--cpd-color-bg-canvas-default": "#ffffff",
  "--cpd-color-text-primary": "#1b1d22",
  "--cpd-color-text-action-accent": "#007a61",
  "--cpd-color-bg-action-primary-rest": "#1b1d22",
  "--cpd-font-family-sans": "Inter, sans-serif"
}
JSON

# Voice message: 7 s Opus with a wobbling tone so the waveform looks alive
ffmpeg -loglevel error -y -f lavfi -i "sine=frequency=220:duration=7" -f lavfi -i "sine=frequency=3:duration=7" \
  -filter_complex "[0][1]amultiply,volume=4,aformat=channel_layouts=mono" -c:a libopus -b:a 24k "$D/voice.ogg"
ls -la "$D"
