#!/usr/bin/env python3
"""Generate the win311 pixel-art SVG assets (original artwork for this project, CC0).

Run: python3 themes/win311/tools/make-assets.py   (writes into ../assets)

Chrome geometry follows the Windows 3.1 VGA.DRV OBM_* bitmaps as documented by libwinui
(docs/background/themes/win3x.md): 1px black frame, 1px white highlight top/left,
2px #808080 shadow bottom/right; pressed = 1px grey top/left only, content +1,+1.
"""
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets")
P = {"K": "#000000", "W": "#FFFFFF", "G": "#C0C0C0", "D": "#808080", "N": "#000080", "T": "#008080",
     "Y": "#FFFF00", "R": "#FF0000", "r": "#800000", "B": "#0000FF", "C": "#00FFFF", "g": "#008000",
     "L": "#00FF00", "M": "#FF00FF", "o": "#808000"}


def svg(name, w, h, rects, comment=""):
    body = "".join(f'<rect x="{x}" y="{y}" width="{rw}" height="{rh}" fill="{P.get(c, c)}"/>'
                   for x, y, rw, rh, c in rects)
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
         f'shape-rendering="crispEdges"><!-- {comment} -->{body}</svg>\n')
    with open(os.path.join(OUT, name), "w") as f:
        f.write(s)


def from_map(name, rows, comment=""):
    rects = []
    for y, row in enumerate(rows):
        x = 0
        while x < len(row):
            c = row[x]
            if c == ".":
                x += 1
                continue
            run = 1
            while x + run < len(row) and row[x + run] == c:
                run += 1
            rects.append((x, y, run, 1, c))
            x += run
    svg(name, len(rows[0]), len(rows), rects, comment)


def bevel_box(w, h, pressed=False):
    r = [(0, 0, w, h, "K"), (1, 1, w - 2, h - 2, "G")]
    if pressed:
        r += [(1, 1, w - 2, 1, "D"), (1, 1, 1, h - 2, "D")]
    else:
        r += [(1, 1, w - 2, 1, "W"), (1, 1, 1, h - 2, "W"),
              (w - 3, 2, 2, h - 3, "D"), (2, h - 3, w - 3, 2, "D")]
    return r


def tri(cx, top, rows, up, d=0):
    out = []
    for i in range(rows):
        y = top + (i if up else rows - 1 - i)
        out.append((cx - i + d, y + d, 2 * i + 1, 1, "K"))
    return out


def arrow(direction, d):
    g = []
    for i in range(4):
        wdt = 2 * i + 1
        if direction in ("up", "down"):
            y = 4 + i if direction == "up" else 11 - i
            g.append((8 - i + d, y + d, wdt, 1, "K"))
        else:
            x = 4 + i if direction == "left" else 11 - i
            g.append((x + d, 8 - i + d, 1, wdt, "K"))
    if direction == "up":
        g.append((7 + d, 8 + d, 3, 3, "K"))
    elif direction == "down":
        g.append((7 + d, 5 + d, 3, 3, "K"))
    elif direction == "left":
        g.append((8 + d, 7 + d, 3, 3, "K"))
    else:
        g.append((5 + d, 7 + d, 3, 3, "K"))
    return g


# caption buttons 19x18 (OBM_REDUCE / OBM_ZOOM / OBM_RESTORE) and scroll arrows 17x17
for pressed in (False, True):
    sfx = "-pressed" if pressed else ""
    d = 1 if pressed else 0
    svg(f"btn-min{sfx}.svg", 19, 18, bevel_box(19, 18, pressed) + tri(8, 7, 4, False, d), "minimize")
    svg(f"btn-max{sfx}.svg", 19, 18, bevel_box(19, 18, pressed) + tri(8, 6, 4, True, d), "maximize")
    svg(f"btn-restore{sfx}.svg", 19, 18,
        bevel_box(19, 18, pressed) + tri(8, 3, 4, True, d) + tri(8, 9, 4, False, d), "restore")
    for dirn in ("up", "down", "left", "right"):
        svg(f"scroll-{dirn}{sfx}.svg", 17, 17, bevel_box(17, 17, pressed) + arrow(dirn, d), f"scroll arrow {dirn}")

svg("scroll-thumb.svg", 17, 17, bevel_box(17, 17), "scroll box (fixed size)")


def ctlbox(w, h, bar_w, pressed=False):
    bx = (w - bar_w) // 2
    by = h // 2 - 1
    return [(0, 0, w, h, "K"), (1, 1, w - 2, h - 2, "D" if pressed else "G"),
            (bx, by, bar_w + 1, 4, "D"),            # drop shadow
            (bx - 1, by - 1, bar_w + 1, 4, "K"),    # outline
            (bx, by, bar_w - 1, 2, "W")]            # white bar


svg("ctl-app.svg", 18, 18, ctlbox(18, 18, 12), "control-menu box (application window)")
svg("ctl-mdi.svg", 18, 18, ctlbox(18, 18, 7), "control-menu box (MDI child)")
svg("ctl-app-pressed.svg", 18, 18, ctlbox(18, 18, 12, True), "control-menu box (menu open)")

cb = [(0, 0, 13, 13, "K"), (1, 1, 11, 11, "W")]
svg("check-off.svg", 13, 13, cb, "check box")
svg("check-on.svg", 13, 13, cb + [(1 + i, 1 + i, 1, 1, "K") for i in range(11)]
    + [(11 - i, 1 + i, 1, 1, "K") for i in range(11)], "check box checked (X, not a tick)")
from_map("radio-off.svg", [
    "....KKKK....", "..KKWWWWKK..", ".KWWWWWWWWK.", ".KWWWWWWWWK.", "KWWWWWWWWWWK", "KWWWWWWWWWWK",
    "KWWWWWWWWWWK", "KWWWWWWWWWWK", ".KWWWWWWWWK.", ".KWWWWWWWWK.", "..KKWWWWKK..", "....KKKK...."],
    "option button")
from_map("radio-on.svg", [
    "....KKKK....", "..KKWWWWKK..", ".KWWWWWWWWK.", ".KWWWKKWWWK.", "KWWWKKKKWWWK", "KWWKKKKKKWWK",
    "KWWKKKKKKWWK", "KWWWKKKKWWWK", ".KWWWKKWWWK.", ".KWWWWWWWWK.", "..KKWWWWKK..", "....KKKK...."],
    "option button selected")


def group_icon(name, title="N", cells=("Y", "R", "T", "B", "g", "M", "C", "o", "D")):
    r = [(2, 4, 28, 24, "K"), (3, 5, 26, 4, title), (3, 5, 4, 4, "G"), (4, 6, 2, 1, "W"),
         (3, 9, 26, 1, "K"), (3, 10, 26, 17, "W")]
    i = 0
    for gy in range(3):
        for gx in range(3):
            x = 6 + gx * 8
            y = 12 + gy * 5
            r += [(x, y, 5, 4, "K"), (x + 1, y + 1, 3, 2, cells[i])]
            i += 1
    svg(name, 32, 32, r, "minimized program group icon")


group_icon("icon-group.svg")
group_icon("icon-group-hotdog.svg", title="K", cells=("R", "Y", "R", "Y", "R", "Y", "R", "Y", "R"))
group_icon("icon-group-neon.svg", title="M", cells=("C", "M", "L", "Y", "C", "M", "L", "Y", "C"))

ROOM = [
    "................................",
    "................................",
    "..KKKKKKKKKKKKKKKKKKKKKKKKKK....",
    "..KNNNNNNNNNNNNNNNNNNNNNNNNKK...",
    "..KGGKNNNNNNNNNNNNNNNNNNNNNKDK..",
    "..KKKKKKKKKKKKKKKKKKKKKKKKKKDK..",
    "..KWWWWWWWWWWWWWWWWWWWWWWWWKDK..",
    "..KWKKKKKKWWWWWWWWWWWWWWWWWKDK..",
    "..KWWWWWWWWWWWWWWWWWWWWWWWWKDK..",
    "..KWKKKKKKKKKKKKKWWWWWWWWWWKDK..",
    "..KWWWWWWWWWWWWWWWWWWWWWWWWKDK..",
    "..KWWWWWWWWWWWWWKKKKKKKKKWWKDK..",
    "..KWWWWWWWWWWWWWWWWWWWWWWWWKDK..",
    "..KWWWWWWWWWWKKKKKKKKKKKKWWKDK..",
    "..KWWWWWWWWWWWWWWWWWWWWWWWWKDK..",
    "..KWKKKKKWWWWWWWWWWWWWWWWWWKDK..",
    "..KWWWWWWWWWWWWWWWWWWWWWWWWKDK..",
    "..KWKKKKKKKKKKWWWWWWWWWWWWWKDK..",
    "..KWWWWWWWWWWWWWWWWWWWWWWWWKDK..",
    "..KKKKKKKKKKKKKKKKKKKKKKKKKKDK..",
    "..KGGGGGGGGGGGGGGGGGGGGGGGGKDK..",
    "..KGKKKKKKKKKKKKKKKKKKKGKKGKDK..",
    "..KGKWWWWWWWWWWWWWWWWWKGKRGKDK..",
    "..KGKKKKKKKKKKKKKKKKKKKGKKGKDK..",
    "..KGGGGGGGGGGGGGGGGGGGGGGGGKDK..",
    "..KKKKKKKKKKKKKKKKKKKKKKKKKKDK..",
    "...KDDDDDDDDDDDDDDDDDDDDDDDDDK..",
    "....KKKKKKKKKKKKKKKKKKKKKKKKKK..",
    "................................",
    "................................",
    "................................",
    "................................"]
from_map("icon-room.svg", ROOM, "chat room program item (window with lines and a composer)")

DM = [
    "................................",
    "................................",
    "................................",
    "..........KKKKKK................",
    "........KKYYYYYYKK..............",
    ".......KYYYYYYYYYYK.............",
    "......KYYYYYYYYYYYYK............",
    "......KYYKKYYYYKKYYK............",
    "......KYYKKYYYYKKYYK............",
    "......KYYYYYYYYYYYYK............",
    "......KYYKYYYYYYKYYK............",
    "......KYYYKKKKKKYYYK............",
    ".......KYYYYYYYYYYK.............",
    "........KKYYYYYYKK..............",
    "..........KKKKKK................",
    "................KKKKKKKKKKKKKK..",
    "...............KWWWWWWWWWWWWWWK.",
    "...............KWKKKKKKKKKKKKWK.",
    "...............KWWWWWWWWWWWWWWK.",
    "...............KWKKKKKKKKWWWWWK.",
    "...............KWWWWWWWWWWWWWWK.",
    "...............KWWWWWWWWWWWWWWK.",
    "................KKKKWKKKKKKKKK..",
    "...................KWK..........",
    "..................KWK...........",
    ".................KK.............",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................",
    "................................"]
from_map("icon-dm.svg", DM, "direct message program item (smiley + speech balloon)")

from_map("cursor-hourglass.svg", [
    "KKKKKKKKKKKKKK",
    "KWWWWWWWWWWWWK",
    ".KKKKKKKKKKKK.",
    ".KWWWWWWWWWWK.",
    ".KWKKKKKKKKWK.",
    "..KWKKKKKKWK..",
    "...KWKKKKWK...",
    "....KWKKWK....",
    ".....KWWK.....",
    "....KWWWWK....",
    "...KWWWKWWK...",
    "..KWWWWWWWWK..",
    ".KWWWKKKKWWWK.",
    ".KWKKKKKKKKWK.",
    ".KKKKKKKKKKKK.",
    "KWWWWWWWWWWWWK",
    "KKKKKKKKKKKKKK"], "hourglass (busy)")

svg("dither-grey.svg", 2, 2, [(0, 0, 2, 2, "W"), (0, 0, 1, 1, "G"), (1, 1, 1, 1, "G")], "50% dither W/G")
svg("dither-hotdog.svg", 2, 2, [(0, 0, 2, 2, "Y"), (0, 0, 1, 1, "R"), (1, 1, 1, 1, "R")], "50% dither Y/R")
svg("dither-leather.svg", 2, 2, [(0, 0, 2, 2, "W"), (0, 0, 1, 1, "G"), (1, 1, 1, 1, "G")],
    "Black Leather Jacket scrollbar 0x10E0E0E0 = dithered E0E0E0")


def pattern(name, rows, fg="K", bg="G"):
    r = [(0, 0, 8, 8, bg)]
    for y, v in enumerate(rows):
        for x in range(8):
            if v & (0x80 >> x):
                r.append((x, y, 1, 1, fg))
    svg(name, 8, 8, r, "desktop pattern, 8x8 bits from CONTROL.INI [Patterns]")


pattern("pattern-boxes.svg", [127, 65, 65, 65, 65, 65, 127, 0])
pattern("pattern-weave.svg", [136, 84, 34, 69, 136, 21, 34, 81])
pattern("pattern-paisley.svg", [2, 7, 7, 2, 32, 80, 80, 32])
pattern("pattern-50gray.svg", [170, 85, 170, 85, 170, 85, 170, 85])
pattern("pattern-scanline.svg", [255, 0, 255, 0, 255, 0, 255, 0], fg="#000000", bg="#00000000")
print("ok")
