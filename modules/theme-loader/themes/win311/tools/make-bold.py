#!/usr/bin/env python3
"""Make W95FA Overstrike Bold: Windows-style synthetic bold (glyph OR'ed with itself shifted 1 font pixel right,
advance +1 pixel), like the GDI emboldening of the era. W95FA is OFL-1.1 without Reserved Font Name; the
derivative is renamed and stays OFL-1.1.  Needs: pip install fonttools brotli skia-pathops
Usage: python3 make-bold.py assets/w95fa.woff2 assets/w95fa-overstrike-bold.woff2"""
import sys
import pathops
from fontTools.ttLib import TTFont
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen

PX = 80  # one font pixel in W95FA (1000 upm, 12.5px native)
src, dst = sys.argv[1], sys.argv[2]
f = TTFont(src)
gs = f.getGlyphSet()
cff = f["CFF "].cff
top = cff.topDictIndex[0]
cs = top.CharStrings
hmtx = f["hmtx"]
for name in f.getGlyphOrder():
    w, lsb = hmtx[name]
    p = pathops.Path()
    gs[name].draw(p.getPen())
    if not list(p.segments):
        if w:
            hmtx[name] = (w + PX, lsb)
        continue
    q = pathops.Path()
    gs[name].draw(TransformPen(q.getPen(), (1, 0, 0, 1, PX, 0)))
    u = pathops.op(p, q, pathops.PathOp.UNION)
    pen = T2CharStringPen(w + PX, None)
    u.draw(pen)
    old = cs[name]
    new = pen.getCharString(private=old.private, globalSubrs=old.globalSubrs)
    idx = top.CharStrings.charStrings[name]
    top.CharStrings.charStringsIndex[idx] = new
    hmtx[name] = (w + PX, lsb)
f["hhea"].advanceWidthMax += PX
f["OS/2"].usWeightClass = 700
f["OS/2"].fsSelection = (f["OS/2"].fsSelection & ~0x40) | 0x20
f["head"].macStyle |= 1
names = {1: "W95FA Overstrike", 2: "Bold", 3: "1.002;W95FAOverstrike-Bold;win311", 4: "W95FA Overstrike Bold",
         6: "W95FAOverstrike-Bold", 16: "W95FA Overstrike", 17: "Bold",
         5: "Version 1.002; win311 overstrike derivative of W95FA (OFL-1.1)"}
for r in f["name"].names:
    if r.nameID in names:
        r.string = names[r.nameID]
top.FullName = "W95FA Overstrike Bold"; top.FamilyName = "W95FA Overstrike"; top.Weight = "Bold"
cff.fontNames = ["W95FAOverstrike-Bold"]
f.flavor = "woff2"
f.save(dst)
print("ok", dst)
