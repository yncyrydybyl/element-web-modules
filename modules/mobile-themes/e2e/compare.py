#!/usr/bin/env python3
"""Side-by-side sheet for shell.mjs: <dir>/without/*.png vs <dir>/with/*.png -> <dir>/compare.png (rows per step)."""
import os
import sys

from PIL import Image, ImageDraw

d = sys.argv[1]
ls = lambda v: os.listdir(os.path.join(d, v)) if os.path.isdir(os.path.join(d, v)) else []
names = sorted(set(ls("with")) | set(ls("without")))
names = [n for n in names if n.endswith(".png")]
if not names:
    sys.exit(0)
sample = Image.open(os.path.join(d, "with" if os.path.exists(os.path.join(d, "with", names[0])) else "without", names[0]))
s = 0.5 if sample.width < 600 else 0.35
W, H = int(sample.width * s), int(sample.height * s)
cols = 4  # pairs per row
rows = (len(names) + cols - 1) // cols
pad, lab = 6, 18
sheet = Image.new("RGB", (cols * (2 * W + 3 * pad), rows * (H + lab + pad)), "white")
dr = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    r, c = divmod(i, cols)
    x0, y0 = c * (2 * W + 3 * pad), r * (H + lab + pad)
    dr.text((x0 + 2, y0 + 2), n[:-4] + "  (without | with)", fill="black")
    for k, v in enumerate(("without", "with")):
        p = os.path.join(d, v, n)
        if os.path.exists(p):
            im = Image.open(p).convert("RGB")
            sheet.paste(im.resize((int(im.width * s), int(im.height * s))), (x0 + k * (W + pad), y0 + lab))
        else:
            dr.rectangle([x0 + k * (W + pad), y0 + lab, x0 + k * (W + pad) + W, y0 + lab + H], outline="#bbb")
            dr.text((x0 + k * (W + pad) + 8, y0 + lab + 8), "n/a", fill="#888")
sheet.save(os.path.join(d, "compare.png"), optimize=True)
print("compare sheet:", os.path.join(d, "compare.png"))
