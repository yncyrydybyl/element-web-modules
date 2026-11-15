#!/usr/bin/env python3
"""Build docs/presentation/index.html from docs/styleguides/*.json (+ optional screenshots manifest).

Usage: python3 tools/presentation/build.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
ORDER = ["teams", "win311", "kde", "comic", "sketch", "lcars", "enlightenment", "paper", "opendesk", "crossover"]


def main() -> None:
    families = []
    for name in ORDER:
        p = ROOT / "docs" / "styleguides" / f"{name}.json"
        if p.exists():
            families.append(json.loads(p.read_text()))
    shots_path = ROOT / "docs" / "presentation" / "shots.json"
    shots = json.loads(shots_path.read_text()) if shots_path.exists() else {}
    template = (pathlib.Path(__file__).parent / "template.html").read_text()
    data = json.dumps({"families": families, "shots": shots}, ensure_ascii=False).replace("</", "<\\/")
    out = ROOT / "docs" / "presentation" / "index.html"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(template.replace("/*__DATA__*/null", data))
    n = sum(len(f["variants"]) for f in families)
    print(f"wrote {out} ({len(families)} families, {n} variants, {out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
