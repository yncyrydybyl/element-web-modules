#!/usr/bin/env python3
"""Rewrite the theme-loader `files:` list in the datanauten.de vars.yml from loader/dist/files.txt."""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
VARS = pathlib.Path.home() / "projects/dtn10/datanauten.de/inventory/host_vars/matrix.datanauten.de/vars.yml"

files = [l.strip() for l in (ROOT / "loader/dist/files.txt").read_text().splitlines() if l.strip() and l.strip() != "files.txt"]
text = VARS.read_text()
block = "  - name: theme-loader\n    files:\n" + "".join(f"      - {f}\n" for f in files) + "    config:\n"
new, n = re.subn(r"  - name: theme-loader\n    files:\n(?:      - .*\n)+    config:\n", lambda m: block, text)
if n != 1:
    sys.exit("theme-loader entry not found in vars.yml (add it once by hand, see docs/DEPLOY.md)")
VARS.write_text(new)
print(f"{len(files)} files listed")
