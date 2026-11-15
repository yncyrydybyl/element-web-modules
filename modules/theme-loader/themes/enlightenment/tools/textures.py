# Self-made textures for the enlightenment family (CC0, generated procedurally).
import sys, random, math
from PIL import Image, ImageFilter
out = sys.argv[1]
random.seed(16)

def brushed(w, h, base, spread, streak_len=60, seed=1):
    """Horizontal brushed-metal streaks, tileable in both directions."""
    rnd = random.Random(seed)
    rows = []
    for y in range(h):
        # per-row luminance offset -> fine horizontal lines
        rows.append(rnd.gauss(0, spread) + spread*0.9*math.sin(2*math.pi*y/h*2+1.3) + spread*0.5*math.sin(2*math.pi*y/h*5))
    img = Image.new("L", (w, h))
    px = img.load()
    for y in range(h):
        # along the row: low-frequency wobble, periodic in w for seamless tiling
        ph1, ph2 = rnd.random() * 6.283, rnd.random() * 6.283
        a1, a2 = rnd.gauss(0, spread * .35), rnd.gauss(0, spread * .25)
        for x in range(w):
            v = base + rows[y] + a1 * math.sin(2 * math.pi * x / w + ph1) + a2 * math.sin(4 * math.pi * x / w + ph2) + rnd.gauss(0, spread * .25)
            px[x, y] = max(0, min(255, int(v)))
    # horizontal blur with wrap for streaks
    big = Image.new("L", (w * 3, h)); [big.paste(img, (i * w, 0)) for i in range(3)]
    big = big.filter(ImageFilter.BoxBlur(0)).resize((w * 3, h))
    # 1-D horizontal box blur via resize trick
    small = big.resize((w * 3 // 4, h), Image.BILINEAR).resize((w * 3, h), Image.BILINEAR)
    return small.crop((w, 0, 2 * w, h))

# 1. light aluminium (E16 BrushedMetal-Tigert), full colour, mean ~#C8C8C6
lum = brushed(256, 128, 200, 9, seed=3)
rgb = Image.merge("RGB", (lum, lum, lum.point(lambda v: max(0, v - 2))))
rgb.save(f"{out}/brushed-aluminium.png", optimize=True)

# 2. neutral brush overlay with alpha: tint any base colour (steel, copper, graphite)
lum = brushed(256, 128, 128, 22, seed=7)
a = Image.new("RGBA", lum.size)
px, lp = a.load(), lum.load()
for y in range(lum.height):
    for x in range(lum.width):
        d = lp[x, y] - 128
        px[x, y] = (255, 255, 255, min(255, int(d * 1.1))) if d > 0 else (0, 0, 0, min(255, int(-d * 1.1)))
a.save(f"{out}/brush-overlay.png", optimize=True)

# 3. fine film grain (aurora / ember backgrounds), 128x128, alpha only
rnd = random.Random(42)
g = Image.new("RGBA", (128, 128))
gp = g.load()
for y in range(128):
    for x in range(128):
        v = rnd.random()
        gp[x, y] = (255, 255, 255, int(v * 18)) if v > .5 else (0, 0, 0, int((1 - v) * 18))
g.save(f"{out}/grain.png", optimize=True)
print("ok")
