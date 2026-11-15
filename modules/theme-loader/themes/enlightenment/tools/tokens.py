"""Full Compound token set derived from a style-guide palette (see palettes.json).

Used by gen_styleguide.py for themes.json and for the e-daylight phase CSS.
"""


def _rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def _hex(c):
    return "#%02X%02X%02X" % tuple(max(0, min(255, round(x))) for x in c)


def mix(a, b, t):
    """t=0 -> a, t=1 -> b"""
    ra, rb = _rgb(a), _rgb(b)
    return _hex([ra[i] + (rb[i] - ra[i]) * t for i in range(3)])


def rgba(h, a):
    r, g, b = _rgb(h)
    return f"rgba({r}, {g}, {b}, {a})"


# Username / default-avatar colours per variant (style guide "names-avatars").
DECORATIVE = {
    "e16-brushed-metal": ["#9FE8E3", "#F2D29B", "#D7B8F5", "#A8E39A", "#F5A9A0", "#A9C8FF"],
    "e17-glow": ["#66B8FF", "#FF9933", "#99FF33", "#FF66B3", "#B57BFF", "#33FF99"],
    "e-current": ["#66B8FF", "#FF9933", "#99FF33", "#FF85C2", "#C49BFF", "#33FF99"],
    "e-aurora": ["#2EE6C5", "#33A1FF", "#B08CFF", "#FF5FC8", "#FFD166", "#7CF29A"],
    "e-ember": ["#FFB547", "#FF7A1A", "#F0506A", "#E8C39E", "#B5D86A", "#7FC8D9"],
    "e-neon-steel": ["#33E0FF", "#FF3399", "#99FF33", "#FFB547", "#B57BFF", "#5EA0FF"],
    "e-usable": ["#7DBEFF", "#FFB060", "#A8F070", "#FF85C2", "#C49BFF", "#5EF0B0"],
    "dawn": ["#2A64A8", "#A34A16", "#356B1A", "#A02C64", "#653FB5", "#1A6B59"],
    "day": ["#1F5FA8", "#A64B12", "#357017", "#A02A63", "#5F3DB3", "#17705D"],
    "dusk": ["#FFB547", "#FF7A1A", "#F0506A", "#E8C39E", "#B5D86A", "#7FC8D9"],
    "night": ["#66B8FF", "#FF9933", "#99FF33", "#FF66B3", "#B57BFF", "#33FF99"],
}

WARNING = {True: "#FF9933", False: "#9A5200"}  # dark / light


def build(p, dark, deco, fonts=None):
    bg, text, accent = p["bg"], p["text"], p["accent"]
    t = {}
    # canvas & subtle
    t["--cpd-color-theme-bg"] = bg
    t["--cpd-color-bg-canvas-default"] = bg
    t["--cpd-color-bg-canvas-default-level-1"] = p["surface"]
    t["--cpd-color-bg-canvas-disabled"] = mix(bg, text, .06)
    t["--cpd-color-bg-subtle-primary"] = mix(bg, text, .10)
    t["--cpd-color-bg-subtle-secondary"] = p["sidebar"]
    t["--cpd-color-bg-subtle-secondary-level-0"] = p["sidebar"]
    t["--cpd-color-bg-subtle-tertiary"] = mix(bg, text, .04)
    # actions
    t["--cpd-color-bg-action-primary-rest"] = accent
    t["--cpd-color-bg-action-primary-hovered"] = mix(accent, text, .18)
    t["--cpd-color-bg-action-primary-pressed"] = mix(accent, bg, .18)
    t["--cpd-color-bg-action-primary-disabled"] = mix(bg, text, .22)
    t["--cpd-color-bg-action-secondary-rest"] = p["surface"]
    t["--cpd-color-bg-action-secondary-hovered"] = mix(p["surface"], text, .08)
    t["--cpd-color-bg-action-secondary-pressed"] = mix(p["surface"], text, .14)
    t["--cpd-color-bg-action-tertiary-rest"] = "transparent"
    t["--cpd-color-bg-action-tertiary-hovered"] = mix(p["sidebar"], text, .08)
    t["--cpd-color-bg-action-tertiary-pressed"] = mix(p["sidebar"], text, .12)
    t["--cpd-color-bg-action-tertiary-selected"] = mix(p["sidebar"], accent, .22)
    t["--cpd-color-bg-accent-rest"] = accent
    t["--cpd-color-bg-accent-hovered"] = mix(accent, text, .18)
    t["--cpd-color-bg-accent-pressed"] = mix(accent, bg, .18)
    t["--cpd-color-bg-accent-selected"] = mix(bg, accent, .20)
    t["--cpd-color-bg-accent-subtle"] = mix(bg, accent, .12)
    t["--cpd-color-bg-critical-primary"] = p["critical"]
    t["--cpd-color-bg-critical-hovered"] = mix(p["critical"], text, .15)
    t["--cpd-color-bg-critical-subtle"] = mix(bg, p["critical"], .15)
    t["--cpd-color-bg-critical-subtle-hovered"] = mix(bg, p["critical"], .25)
    t["--cpd-color-bg-success-subtle"] = mix(bg, p["success"], .15)
    t["--cpd-color-bg-success-rest"] = p["success"]
    t["--cpd-color-bg-success-hovered"] = mix(p["success"], text, .15)
    t["--cpd-color-bg-success-pressed"] = mix(p["success"], bg, .15)
    t["--cpd-color-bg-info-subtle"] = mix(bg, accent, .12)
    t["--cpd-color-bg-badge-default"] = mix(bg, text, .16)
    t["--cpd-color-bg-badge-accent"] = accent
    t["--cpd-color-bg-badge-info"] = mix(bg, accent, .25)
    t["--cpd-color-bg-badge-critical"] = p["critical"]
    t["--cpd-color-bg-badge-secondary"] = mix(bg, text, .12)
    t["--cpd-color-text-badge-info"] = text
    t["--cpd-color-text-badge-accent"] = p["onAccent"]
    for i, c in enumerate(deco, 1):
        t[f"--cpd-color-bg-decorative-{i}"] = mix(bg, c, .30)
        t[f"--cpd-color-text-decorative-{i}"] = c
    # text
    t["--cpd-color-text-primary"] = text
    t["--cpd-color-text-secondary"] = p["muted"]
    t["--cpd-color-text-placeholder"] = p["muted"]
    t["--cpd-color-text-disabled"] = mix(bg, text, .42)
    t["--cpd-color-text-action-primary"] = text
    t["--cpd-color-text-action-accent"] = accent
    t["--cpd-color-text-link-external"] = accent
    t["--cpd-color-text-on-solid-primary"] = p["onAccent"]
    t["--cpd-color-text-critical-primary"] = p["critical"]
    t["--cpd-color-text-success-primary"] = p["success"]
    t["--cpd-color-text-info-primary"] = accent
    t["--cpd-color-text-warning-primary"] = WARNING[dark]
    t["--cpd-color-text-action-success"] = p["success"]
    # icons
    t["--cpd-color-icon-primary"] = text
    t["--cpd-color-icon-secondary"] = p["muted"]
    t["--cpd-color-icon-tertiary"] = mix(p["muted"], bg, .15)
    t["--cpd-color-icon-quaternary"] = mix(bg, text, .38)
    t["--cpd-color-icon-disabled"] = mix(bg, text, .32)
    t["--cpd-color-icon-primary-alpha"] = rgba(text, .9)
    t["--cpd-color-icon-secondary-alpha"] = rgba(p["muted"], .9)
    t["--cpd-color-icon-tertiary-alpha"] = rgba(p["muted"], .75)
    t["--cpd-color-icon-quaternary-alpha"] = rgba(text, .35)
    t["--cpd-color-icon-accent-primary"] = accent
    t["--cpd-color-icon-accent-tertiary"] = accent
    t["--cpd-color-icon-critical-primary"] = p["critical"]
    t["--cpd-color-icon-success-primary"] = p["success"]
    t["--cpd-color-icon-info-primary"] = accent
    t["--cpd-color-icon-warning-primary"] = WARNING[dark]
    t["--cpd-color-icon-on-solid-primary"] = p["onAccent"]
    # borders
    t["--cpd-color-border-interactive-primary"] = mix(bg, text, .45)
    t["--cpd-color-border-interactive-secondary"] = mix(bg, text, .25)
    t["--cpd-color-border-interactive-hovered"] = mix(bg, text, .62)
    t["--cpd-color-border-interactive-pressed"] = accent
    t["--cpd-color-border-focused"] = accent
    t["--cpd-color-border-disabled"] = mix(bg, text, .15)
    t["--cpd-color-border-critical-primary"] = p["critical"]
    t["--cpd-color-border-critical-subtle"] = mix(bg, p["critical"], .45)
    t["--cpd-color-border-critical-hovered"] = mix(p["critical"], text, .2)
    t["--cpd-color-border-success-subtle"] = mix(bg, p["success"], .45)
    t["--cpd-color-border-success-primary"] = p["success"]
    t["--cpd-color-border-accent-subtle"] = mix(bg, accent, .45)
    t["--cpd-color-border-info-subtle"] = mix(bg, accent, .45)
    t["--cpd-color-separator-primary"] = mix(bg, text, .18)
    t["--cpd-color-separator-secondary"] = mix(bg, text, .10)
    # base palettes used directly by Element
    for n in (25, 50, 75, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400):
        f = min(1.0, n / 1400) ** 0.9
        t[f"--cpd-color-gray-{n}"] = mix(bg, text, f * .98 + .01)
        t[f"--cpd-color-alpha-gray-{n}"] = rgba(text, round(min(.95, n / 1400 * .9), 3))
        t[f"--cpd-color-green-{n}"] = mix(bg, accent, min(1.0, n / 900))
    if fonts:
        t["--cpd-font-family-sans"] = fonts["sans"]
        t["--cpd-font-family-mono"] = fonts["mono"]
    return t


def css_block(selector, tokens):
    body = "\n".join(f"  {k}: {v};" for k, v in tokens.items())
    return f"{selector} {{\n{body}\n}}\n"
