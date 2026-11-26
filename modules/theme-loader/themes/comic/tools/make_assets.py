#!/usr/bin/env python3
"""Generate the self-made period assets for the `comic` family.

Everything produced here is original work for this repo (CC0 1.0): 90s-web-style
re-creations drawn from scratch with Pillow/numpy, no pixels copied from GifCities,
Cameron's World or Microsoft clip art.

    python3 -I themes/comic/tools/make_assets.py themes/comic/assets
needs: pillow numpy (fonts are read from the assets dir for the 88x31 buttons)
"""
import math
import os
import random
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = sys.argv[1] if len(sys.argv) > 1 else "assets"
os.makedirs(OUT, exist_ok=True)

RAINBOW = ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#8B00FF"]
WEB16 = ["#000000", "#800000", "#008000", "#808000", "#000080", "#800080", "#008080", "#C0C0C0",
         "#808080", "#FF0000", "#00FF00", "#FFFF00", "#0000FF", "#FF00FF", "#00FFFF", "#FFFFFF"]


def p(name):
    return os.path.join(OUT, name)


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def save_gif(frames, name, ms, transparent=False):
    """frames: list of RGBA images. One global palette for all frames; alpha<128 -> transparent index."""
    KEY = (255, 0, 254)
    rgbs = []
    for f in frames:
        rgba = f.convert("RGBA")
        rgb = Image.new("RGB", rgba.size, KEY)
        rgb.paste(rgba, mask=rgba.getchannel("A").point(lambda a: 255 if a >= 128 else 0))
        rgbs.append(rgb)
    w, h = rgbs[0].size
    strip = Image.new("RGB", (w, h * len(rgbs)))
    for i, im in enumerate(rgbs):
        strip.paste(im, (0, i * h))
    master = strip.quantize(colors=255 if transparent else 256, method=Image.Quantize.MEDIANCUT,
                            dither=Image.Dither.NONE)
    pal = master.getpalette()[:768]
    key = None
    if transparent:
        cols = [tuple(pal[i:i + 3]) for i in range(0, len(pal), 3)]
        # the key colour is present in the strip, median cut keeps it as its own (exact or nearest) entry
        key = min(range(len(cols)), key=lambda i: sum((a - b) ** 2 for a, b in zip(cols[i], KEY)))
    q = [im.quantize(palette=master, dither=Image.Dither.NONE) for im in rgbs]
    kw = dict(save_all=True, append_images=q[1:], duration=ms, loop=0, optimize=False, disposal=2)
    if transparent:
        kw["transparency"] = key
    q[0].save(p(name), **kw)


# ---------------------------------------------------------------- periodic noise
def tile_noise(size, octaves, seed, base=4):
    """Seamless value noise (sum of periodic sinusoids with random phases)."""
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:size, 0:size] / size * 2 * np.pi
    acc = np.zeros((size, size))
    amp = 1.0
    for o in range(octaves):
        f = base * (2 ** o)
        for _ in range(6):
            kx, ky = rng.integers(-f, f + 1, 2)
            if kx == 0 and ky == 0:
                kx = 1
            acc += amp * np.sin(kx * x + ky * y + rng.uniform(0, 2 * np.pi))
        amp *= 0.5
    acc -= acc.min()
    return acc / acc.max()


# ---------------------------------------------------------------- tiles
def tile_stars(name, size=256, seed=7, dark="#000000", count=90, colours=None, animated=False):
    rng = random.Random(seed)
    colours = colours or ["#FFFFFF"] * 6 + ["#FFFF00", "#00FFFF", "#FF00FF"]
    stars = [(rng.randrange(size), rng.randrange(size), rng.choice(colours), rng.random()) for _ in range(count)]

    def draw(phase):
        im = Image.new("RGB", (size, size), dark)
        d = ImageDraw.Draw(im)
        for x, y, c, r in stars:
            on = (not animated) or ((r * 4 + phase) % 4 < 3)
            if not on:
                continue
            if r > 0.93:  # big cross star
                for dx in range(-3, 4):
                    d.point(((x + dx) % size, y), fill=c)
                for dy in range(-3, 4):
                    d.point((x, (y + dy) % size), fill=c)
            elif r > 0.75:
                d.rectangle([x, y, x + 1, y + 1], fill=c)
            else:
                d.point((x, y), fill=c)
        return im

    if animated:
        save_gif([draw(i) for i in range(4)], name, 350)
    else:
        draw(0).save(p(name), optimize=True)


def tile_marble(name, size=200, seed=3, c1=(240, 220, 230), c2=(120, 70, 140), c3=(60, 160, 170)):
    n = tile_noise(size, 4, seed)
    y, x = np.mgrid[0:size, 0:size] / size * 2 * np.pi
    veins = np.abs(np.sin(2 * x + 1 * y + 6 * n))
    t = veins ** 0.35
    n2 = tile_noise(size, 3, seed + 1)
    a = np.array(c1, float)
    b = np.array(c2, float)
    c = np.array(c3, float)
    img = (a * t[..., None] + b * (1 - t[..., None]))
    img = img * (1 - 0.35 * n2[..., None]) + c * 0.35 * n2[..., None]
    Image.fromarray(img.clip(0, 255).astype("uint8")).quantize(64).save(p(name), optimize=True)


def tile_clouds(name, size=256, seed=11):
    n = tile_noise(size, 5, seed, base=2)
    y = np.linspace(0, 1, size)[:, None] * np.ones((1, size))
    sky_top = np.array([40, 100, 220.0])
    sky_bot = np.array([140, 190, 255.0])
    sky = sky_top * (1 - y[..., None]) + sky_bot * y[..., None]
    cl = np.clip((n - 0.52) * 4, 0, 1)[..., None]
    img = sky * (1 - cl) + np.array([255, 255, 255.0]) * cl
    Image.fromarray(img.clip(0, 255).astype("uint8")).quantize(48).save(p(name), optimize=True)


def tile_confetti(name, size=128, seed=5, bg="#FFFFFF"):
    rng = random.Random(seed)
    im = Image.new("RGB", (size, size), bg)
    d = ImageDraw.Draw(im)
    cols = ["#FF00FF", "#00FFFF", "#FFFF00", "#FF6600", "#33CC33", "#9900FF", "#FF0066"]
    for _ in range(38):
        x, y = rng.randrange(size), rng.randrange(size)
        c = rng.choice(cols)
        kind = rng.random()
        for ox in (-size, 0, size):
            for oy in (-size, 0, size):
                X, Y = x + ox, y + oy
                if kind < 0.4:  # squiggle
                    pts = [(X + i * 3, Y + (2 if i % 2 else -2)) for i in range(5)]
                    d.line(pts, fill=c, width=2)
                elif kind < 0.7:
                    d.rectangle([X, Y, X + 4, Y + 4], fill=c)
                elif kind < 0.9:
                    d.polygon([(X, Y + 6), (X + 3, Y), (X + 6, Y + 6)], fill=c)
                else:
                    d.ellipse([X, Y, X + 5, Y + 5], fill=c)
    im.save(p(name), optimize=True)


def tile_psych(name, size=64, frames=12):
    """Rainbow checkerboard whose hues drift slowly (no hard flashes: max ~30deg hue step)."""
    out = []
    y, x = np.mgrid[0:size, 0:size]
    base = (((x // 16) + (y // 16)) % 2) * 0.5 + (x + y) / (2 * size) * 0.5
    for f in range(frames):
        h = (base + f / frames) % 1.0
        hsv = np.stack([h * 255, np.full_like(h, 255), np.full_like(h, 255)], -1).astype("uint8")
        out.append(Image.fromarray(hsv, "HSV").convert("RGB"))
    save_gif(out, name, 160)


def tile_stripes(name, size=32, a="#FFD200", b="#000000"):
    im = Image.new("RGB", (size, size), a)
    d = ImageDraw.Draw(im)
    w = size // 4
    for k in range(-2, 3):
        o = k * size
        d.polygon([(o, size), (o + w * 2, size), (o + w * 2 + size, 0), (o + size, 0)], fill=b)
    im.save(p(name), optimize=True)


def tile_neongrid(name, size=64):
    im = Image.new("RGB", (size, size), "#05000F")
    d = ImageDraw.Draw(im)
    d.line([(0, 0), (size, 0)], fill="#FF00CC")
    d.line([(0, 0), (0, size)], fill="#00E5FF")
    d.point((size // 2, size // 2), fill="#FFFF66")
    im.save(p(name), optimize=True)


# ---------------------------------------------------------------- strips / bars
def hr_rainbow(name, w=480, h=8, frames=14):
    cols = [hexrgb(c) for c in RAINBOW]
    out = []
    for f in range(frames):
        im = Image.new("RGB", (w, h))
        px = im.load()
        for x in range(w):
            t = ((x / w) * 2 + f / frames) % 1.0 * len(cols)
            i = int(t)
            fr = t - i
            c0, c1 = cols[i % len(cols)], cols[(i + 1) % len(cols)]
            c = tuple(int(c0[k] + (c1[k] - c0[k]) * fr) for k in range(3))
            for y in range(h):
                shade = 1.0 - 0.45 * abs(y - h / 2 + 0.5) / (h / 2)
                px[x, y] = tuple(int(v * shade) for v in c)
        out.append(im)
    save_gif(out, name, 90)


def bar_flames(name, w=240, h=24, frames=8, seed=2):
    rng = np.random.default_rng(seed)
    pal = []
    for i in range(256):
        r = min(255, i * 3)
        g = max(0, min(255, i * 3 - 255))
        b = max(0, min(255, i * 3 - 510))
        pal.append((r, g, b))
    pal = np.array(pal, "uint8")
    # simulate classic demo fire, keep a loop by cross-fading the last frames
    field = np.zeros((h + 2, w))
    sims = []
    for step in range(frames * 6 + 30):
        field[-1] = rng.integers(140, 256, w) * (rng.random(w) > 0.3)
        f = field
        nf = (np.roll(f, 1, 1) + np.roll(f, -1, 1) + f + np.roll(f, -1, 0)) / 4.18
        nf[:-1] = nf[1:].copy()
        field = nf
        field[-1] = f[-1]
        sims.append(field[:h].copy())
    sims = sims[30:]
    out = []
    for i in range(frames):
        a = sims[i * 6]
        img = pal[np.clip(a, 0, 255).astype(int)]
        alpha = np.where(a > 75, 255, 0).astype("uint8")
        rgba = np.dstack([img, alpha])
        out.append(Image.fromarray(rgba, "RGBA"))
    save_gif(out, name, 80, transparent=True)


# ---------------------------------------------------------------- sprites
def under_construction(name):
    """96x84: yellow diamond road sign with a digging worker (4 frames) + blinking lamp."""
    W, H = 96, 84
    frames = []
    for f in range(4):
        im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        cx, cy, r = 48, 40, 38
        d.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], fill="#000000")
        r2 = r - 3
        d.polygon([(cx, cy - r2), (cx + r2, cy), (cx, cy + r2), (cx - r2, cy)], fill="#FFD200")
        r3 = r - 6
        d.polygon([(cx, cy - r3), (cx + r3, cy), (cx, cy + r3), (cx - r3, cy)], outline="#000000")
        # dirt pile
        d.polygon([(56, 58), (66, 50), (74, 58)], fill="#000000")
        # worker: head, hat, body, legs
        lean = [0, 2, 4, 2][f]
        hx, hy = 38 + lean, 26 + lean // 2
        d.ellipse([hx - 4, hy - 4, hx + 4, hy + 4], fill="#000000")
        d.chord([hx - 6, hy - 8, hx + 6, hy + 2], 180, 360, fill="#000000")
        d.line([(hx - 7, hy - 3), (hx + 7, hy - 3)], fill="#000000", width=2)
        bx, by = hx - 2, hy + 18
        d.line([(hx, hy + 4), (bx, by)], fill="#000000", width=5)
        d.line([(bx, by), (bx - 6, by + 14)], fill="#000000", width=4)
        d.line([(bx, by), (bx + 6, by + 12), (bx + 6, by + 14)], fill="#000000", width=4)
        # arms + shovel
        sx = [52, 56, 60, 56][f]
        sy = [44, 52, 56, 52][f]
        d.line([(hx + 1, hy + 8), (hx + 10, hy + 12 + lean)], fill="#000000", width=3)
        d.line([(hx + 10, hy + 12 + lean), (sx, sy)], fill="#000000", width=2)
        d.line([(hx + 6, hy + 3 + lean), (sx - 16, sy - 20)], fill="#000000", width=2)
        d.polygon([(sx - 1, sy - 3), (sx + 5, sy + 1), (sx + 2, sy + 6), (sx - 4, sy + 2)], fill="#000000")
        if f == 3:  # dirt fleck
            d.rectangle([60, 40, 62, 42], fill="#000000")
        # lamp on top
        lamp = "#FF2200" if f % 2 == 0 else "#7A1000"
        d.ellipse([cx - 5, 0, cx + 5, 8], fill=lamp, outline="#000000")
        if f % 2 == 0:
            d.line([(cx - 9, 2), (cx - 13, 0)], fill="#FF2200")
            d.line([(cx + 9, 2), (cx + 13, 0)], fill="#FF2200")
        # label plate
        d.rectangle([4, 70, 91, 83], fill="#000000")
        frames.append(im)
    # text on plate with VT323
    try:
        fnt = ImageFont.truetype(p("vt323-400.woff2"), 13)
    except OSError:
        fnt = ImageFont.load_default()
    for i, im in enumerate(frames):
        d = ImageDraw.Draw(im)
        d.text((48, 76), "UNDER CONSTRUCTION", fill="#FFD200" if i % 2 == 0 else "#FFFFFF", font=fnt,
               anchor="mm")
    save_gif(frames, name, 220, transparent=True)


def starburst(n=16, r1=30, r2=21, cx=32, cy=32, rot=0.0):
    pts = []
    for i in range(n * 2):
        r = r1 if i % 2 == 0 else r2
        a = math.pi * i / n + rot
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def new_burst(name_svg, name_gif):
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in starburst())
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
<!-- comic family, original work, CC0 1.0 -->
<polygon points="{pts}" fill="#FF0000" stroke="#FFFF00" stroke-width="2" stroke-linejoin="miter"/>
<text x="32" y="38" text-anchor="middle" font-family="Impact, Anton, 'Arial Black', sans-serif" font-size="17"
 fill="#FFFF00" stroke="#000" stroke-width="0.8" transform="rotate(-12 32 32)">NEW!</text>
</svg>
'''
    open(p(name_svg), "w").write(svg)
    try:
        fnt = ImageFont.truetype(p("anton-400.woff2"), 15)
    except OSError:
        fnt = ImageFont.load_default()
    frames = []
    for f in range(4):
        im = Image.new("RGBA", (40, 40), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        d.polygon(starburst(14, 19, 13, 20, 20, rot=f * math.pi / 28), fill="#FF0000", outline="#FFFF00")
        txt = Image.new("RGBA", (40, 40), (0, 0, 0, 0))
        ImageDraw.Draw(txt).text((20, 20), "NEW!", font=fnt, anchor="mm",
                                 fill="#FFFF00" if f < 2 else "#FFFFFF", stroke_width=1, stroke_fill="#000000")
        im.alpha_composite(txt.rotate(12, resample=Image.NEAREST))
        frames.append(im)
    save_gif(frames, name_gif, 200, transparent=True)


def email_spin(name):
    frames = []
    for f in range(8):
        im = Image.new("RGBA", (32, 24), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        sx = abs(math.cos(f * math.pi / 8))
        w = max(2, int(14 * sx))
        x0, x1 = 16 - w, 16 + w
        face = "#FFFFFF" if f < 4 else "#FFFFCC"
        d.rectangle([x0, 4, x1, 20], fill=face, outline="#000000")
        if w > 4:
            d.line([(x0, 4), (16, 13), (x1, 4)], fill="#000000")
            d.rectangle([x1 - max(3, w // 3), 6, x1 - 2, 10], fill="#FF0000")
        frames.append(im)
    save_gif(frames, name, 110, transparent=True)


def smiley(name):
    frames = []
    for f in range(8):
        im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        dy = int(3 * abs(math.sin(f * math.pi / 8)))
        d.ellipse([3, 3 - dy, 28, 28 - dy], fill="#FFE600", outline="#000000")
        wink = f in (5, 6)
        if wink:
            d.line([(10, 12 - dy), (14, 12 - dy)], fill="#000000", width=2)
        else:
            d.ellipse([10, 9 - dy, 13, 14 - dy], fill="#000000")
        d.ellipse([18, 9 - dy, 21, 14 - dy], fill="#000000")
        d.arc([8, 10 - dy, 23, 23 - dy], 20, 160, fill="#000000", width=2)
        frames.append(im)
    save_gif(frames, name, 120, transparent=True)


def sparkle(name_gif, name_png):
    frames = []
    for f in range(6):
        im = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
        d = ImageDraw.Draw(im)
        s = [2, 5, 9, 11, 7, 3][f]
        c = ["#FFFFFF", "#FFFF66", "#FFFFFF", "#66FFFF", "#FF99FF", "#FFFFFF"][f]
        d.polygon([(12, 12 - s), (13, 11), (12 + s, 12), (13, 13), (12, 12 + s), (11, 13), (12 - s, 12), (11, 11)],
                  fill=c)
        if s > 6:
            d.point([(5, 5), (19, 5), (5, 19), (19, 19)], fill=c)
        frames.append(im)
    save_gif(frames, name_gif, 90, transparent=True)
    frames[3].crop((4, 4, 20, 20)).save(p(name_png), optimize=True)


def cursor_rainbow(name):
    arrow = [(0, 0), (0, 21), (5, 16), (9, 25), (12, 24), (8, 15), (15, 15)]
    W, H = 32, 32
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).polygon([(x + 1, y + 1) for x, y in arrow], fill=255)
    grad = Image.new("RGBA", (W, H))
    gd = ImageDraw.Draw(grad)
    for y in range(H):
        gd.line([(0, y), (W, y)], fill=RAINBOW[min(6, y * 7 // 27)])
    im.paste(grad, mask=mask)
    ImageDraw.Draw(im).polygon([(x + 1, y + 1) for x, y in arrow], outline="#000000")
    im.save(p(name), optimize=True)


def button_88x31(name, top, bottom, bg, fg, accent, font_file, style):
    im = Image.new("RGB", (88, 31), bg)
    d = ImageDraw.Draw(im)
    # bevel
    d.line([(0, 0), (87, 0)], fill="#FFFFFF")
    d.line([(0, 0), (0, 30)], fill="#FFFFFF")
    d.line([(87, 0), (87, 30)], fill="#404040")
    d.line([(0, 30), (87, 30)], fill="#404040")
    try:
        big = ImageFont.truetype(p(font_file), 14)
        small = ImageFont.truetype(p("vt323-400.woff2"), 11)
    except OSError:
        big = small = ImageFont.load_default()
    if style == "element":
        d.ellipse([4, 5, 24, 25], fill=accent)
        for i, (x0, y0, x1, y1) in enumerate([(9, 10, 19, 10), (9, 20, 19, 20), (9, 10, 9, 20), (19, 10, 19, 20)]):
            d.line([(x0, y0), (x1, y1)], fill="#FFFFFF", width=2)
        d.text((56, 10), top, font=small, fill=fg, anchor="mm")
        d.text((56, 21), bottom, font=big, fill=accent, anchor="mm")
    elif style == "matrix":
        d.rectangle([2, 2, 30, 28], fill="#000000")
        d.text((16, 15), "[m]", font=small, fill="#00FF00", anchor="mm")
        d.text((59, 10), top, font=small, fill=fg, anchor="mm")
        d.text((59, 21), bottom, font=big, fill=accent, anchor="mm")
    else:
        d.text((44, 10), top, font=small, fill=fg, anchor="mm")
        d.text((44, 21), bottom, font=big, fill=accent, anchor="mm")
    im.save(p(name), optimize=True)


def paperclip_svg(name):
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 120" width="80" height="120">
<!-- "Klammi", the comic family's self-drawn office helper. Original work, CC0 1.0. Not Clippit. -->
<path d="M30 112 V30 a16 16 0 0 1 32 0 V92 a10 10 0 0 1 -20 0 V40" fill="none" stroke="#8A8F98" stroke-width="7"
 stroke-linecap="round"/>
<path d="M30 112 V30 a16 16 0 0 1 32 0 V92 a10 10 0 0 1 -20 0 V40" fill="none" stroke="#E6E9EE" stroke-width="2.5"
 stroke-linecap="round"/>
<ellipse cx="34" cy="44" rx="9" ry="11" fill="#fff" stroke="#000" stroke-width="2"/>
<ellipse cx="56" cy="44" rx="9" ry="11" fill="#fff" stroke="#000" stroke-width="2"/>
<circle class="pupil" cx="37" cy="47" r="4"/><circle class="pupil" cx="59" cy="47" r="4"/>
<path d="M24 28 q10 -8 18 -2 M48 26 q8 -6 18 2" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/>
</svg>
'''
    open(p(name), "w").write(svg)


def wave_divider_svg(name):
    stops = "".join(f'<stop offset="{i / 6:.3f}" stop-color="{c}"/>' for i, c in enumerate(RAINBOW))
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 12" width="120" height="12">
<!-- comic family, original work, CC0 1.0: tileable rainbow wave separator -->
<defs><linearGradient id="r" x1="0" x2="1">{stops}</linearGradient></defs>
<path d="M0 6 Q15 0 30 6 T60 6 T90 6 T120 6" fill="none" stroke="url(#r)" stroke-width="4"/>
</svg>
'''
    open(p(name), "w").write(svg)


if __name__ == "__main__":
    tile_stars("tile-stars.png")
    tile_stars("tile-stars-twinkle.gif", animated=True, seed=9)
    tile_stars("tile-stars-deep.png", seed=21, dark="#07001A", count=140,
               colours=["#FFFFFF"] * 4 + ["#FF3CF0", "#39FFF5", "#FFF34D", "#7DFF5A"])
    tile_marble("tile-marble.png")
    tile_marble("tile-marble-green.png", seed=8, c1=(225, 240, 225), c2=(20, 90, 60), c3=(200, 170, 60))
    tile_clouds("tile-clouds.png")
    tile_confetti("tile-confetti.png")
    tile_psych("tile-psych.gif")
    tile_stripes("tile-hazard.png")
    tile_neongrid("tile-neongrid.png")
    hr_rainbow("hr-rainbow.gif")
    bar_flames("bar-flames.gif")
    under_construction("under-construction.gif")
    new_burst("new-burst.svg", "new-burst.gif")
    email_spin("email-spin.gif")
    smiley("smiley.gif")
    sparkle("sparkle.gif", "sparkle.png")
    cursor_rainbow("cursor-rainbow.png")
    button_88x31("btn-element-now.png", "VIEWED WITH", "ELEMENT", "#C0C0C0", "#000000", "#0DBD8B",
                 "luckiest-guy-400.woff2", "element")
    button_88x31("btn-matrix-powered.png", "POWERED BY", "MATRIX", "#000080", "#FFFFFF", "#FFFF00",
                 "luckiest-guy-400.woff2", "matrix")
    button_88x31("btn-notepad.png", "MADE WITH", "NOTEPAD", "#FFFFFF", "#000080", "#FF0000",
                 "chewy-400.woff2", "plain")
    button_88x31("btn-comic-sans.png", "SET IN", "COMIC SANS", "#FF00FF", "#FFFF00", "#00FFFF",
                 "chewy-400.woff2", "plain")
    paperclip_svg("klammi.svg")
    wave_divider_svg("hr-wave.svg")
    # first-frame PNGs for prefers-reduced-motion (CSS animation:none does not stop GIFs)
    for g in sorted(os.listdir(OUT)):
        if g.endswith(".gif"):
            im = Image.open(p(g))
            im.seek(0)
            im.convert("RGBA").save(p(g[:-4] + "-static.png"), optimize=True)
    print("done")
