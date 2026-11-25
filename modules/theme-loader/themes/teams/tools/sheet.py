#!/usr/bin/env python3
"""Contact sheet: sheet.py out.png img1 img2 ... (2 columns, each scaled to 960 wide)."""
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
W = 960
ims = []
for f in files:
    im = Image.open(f).convert("RGB")
    im = im.resize((W, int(im.height * W / im.width)))
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 300, 18], fill="black"); d.text((4, 3), f.split("/")[-1], fill="yellow")
    ims.append(im)
cols = 2
rows = (len(ims) + 1) // cols
h = max(i.height for i in ims)
sheet = Image.new("RGB", (W * cols + 8, rows * (h + 8)), "magenta")
for n, im in enumerate(ims):
    sheet.paste(im, ((n % cols) * (W + 8), (n // cols) * (h + 8)))
sheet.save(out)
