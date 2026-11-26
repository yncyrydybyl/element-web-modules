#!/usr/bin/env python3
"""Find Element 1.12.33 CSS rules whose selector contains a substring.
usage: cssgrep.py <substring> [maxrules] [file-glob]"""
import glob, re, sys

pat = sys.argv[1]
mx = int(sys.argv[2]) if len(sys.argv) > 2 else 30
files = sys.argv[3] if len(sys.argv) > 3 else "theme-light.css"
base = "/var/home/t/projects/element-web-themes/loader/.element/element-v1.12.33/bundles/*/"
n = 0
for f in glob.glob(base + files):
    css = open(f, encoding="utf8").read()
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", css):
        sel, body = m.group(1).strip(), m.group(2).strip()
        if pat in sel:
            print(f"{sel[:200]} {{ {body[:400]} }}")
            n += 1
            if n >= mx:
                sys.exit(0)
