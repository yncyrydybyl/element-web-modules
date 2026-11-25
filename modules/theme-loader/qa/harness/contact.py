#!/usr/bin/env python3
"""Contact sheets from the hero screenshots.

    python3 tests/harness/contact.py            # → recordings/contact/<family>.png + all.png

Input: recordings/screens/<id>/hero.png (shoot.mjs --hero). Order and labels from docs/CATALOG.md order and
themes/<family>/themes.json (name, stage, mode). Families with no hero yet are skipped.
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
SCREENS = ROOT / "recordings/screens"
OUT = ROOT / "recordings/contact"
BG, FG, MUTED, ACCENT = (15, 18, 22), (240, 242, 245), (150, 158, 170), (13, 189, 139)


def font(size, bold=False):
    for name in (["Inter-Bold.ttf", "NotoSans-Bold.ttf", "DejaVuSans-Bold.ttf"] if bold else
                 ["Inter-Regular.ttf", "NotoSans-Regular.ttf", "DejaVuSans.ttf"]):
        for d in ("/usr/share/fonts", str(Path.home() / ".local/share/fonts"), "/usr/local/share/fonts"):
            hits = list(Path(d).rglob(name)) if Path(d).exists() else []
            if hits:
                return ImageFont.truetype(str(hits[0]), size)
    return ImageFont.load_default(size)


def variants():
    order = re.findall(r"^\| ([a-z0-9-]+) \|", (ROOT / "docs/CATALOG.md").read_text(), re.M)
    order = [o for o in order if o != "id"]
    meta, fams = {}, {}
    for f in sorted((ROOT / "themes").glob("*/themes.json")):
        j = json.loads(f.read_text())
        for v in j.get("variants", []):
            nm = v.get("name")
            nm = nm.get("en") or next(iter(nm.values())) if isinstance(nm, dict) else nm
            meta[v["id"]] = {"name": nm or v["id"], "stage": v.get("stage", ""), "mode": v.get("mode", ""),
                             "family": f.parent.name, "family_name": j.get("name") or f.parent.name}
    out = [dict(id=i, **meta[i]) for i in order if i in meta]
    for v in out:
        fams.setdefault(v["family"], []).append(v)
    return out, fams


def sheet(items, cols, tw, title=None, small=False):
    th = tw * 900 // 1440
    pad = 10 if small else 18
    lab = 34 if small else 62
    head = 0 if not title else 76
    rows = (len(items) + cols - 1) // cols
    W = cols * tw + (cols + 1) * pad
    H = head + rows * (th + lab) + (rows + 1) * pad
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f1, f2 = font(15 if small else 22, True), font(12 if small else 16)
    if title:
        d.text((pad + 2, 20), title, font=font(34, True), fill=FG)
        d.text((W - pad - 2, 30), "Element Web themes · hero = Showcase timeline", font=font(16), fill=MUTED, anchor="ra")
    for k, v in enumerate(items):
        r, c = divmod(k, cols)
        x = pad + c * (tw + pad)
        y = head + pad + r * (th + lab + pad)
        p = SCREENS / v["id"] / "hero.png"
        if p.exists():
            im = Image.open(p).convert("RGB").resize((tw, th), Image.LANCZOS)
            img.paste(im, (x, y))
        else:
            d.rectangle([x, y, x + tw, y + th], outline=MUTED)
            d.text((x + tw // 2, y + th // 2), "no hero", font=f2, fill=MUTED, anchor="mm")
        d.rectangle([x, y, x + tw - 1, y + th - 1], outline=(45, 50, 58))
        if small:
            d.text((x + 2, y + th + 6), v["id"], font=f1, fill=FG)
        else:
            d.text((x + 2, y + th + 8), v["name"], font=f1, fill=FG)
            d.text((x + 2, y + th + 36), f'{v["id"]}  ·  {v["stage"]}  ·  {v["mode"]}', font=f2, fill=ACCENT)
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    allv, fams = variants()
    for fam, items in fams.items():
        if not any((SCREENS / v["id"] / "hero.png").exists() for v in items):
            continue
        cols = 3 if len(items) != 4 else 2
        img = sheet(items, cols, 640, title=f'{items[0]["family_name"]} — {len(items)} variants')
        img.save(OUT / f"{fam}.png", optimize=True)
        print("→", OUT / f"{fam}.png", img.size)
    img = sheet(allv, 9, 300, title=f"All {len(allv)} Element Web themes", small=True)
    img.save(OUT / "all.png", optimize=True)
    print("→", OUT / "all.png", img.size)


if __name__ == "__main__":
    sys.exit(main())
