// Generates static sketchy SVG assets for themes/sketch/assets with rough.js (offline, zero runtime cost).
// Usage: node gen.js <outdir>
const fs = require("fs");
const path = require("path");
const rough = require("roughjs");
const out = process.argv[2];
const g = rough.generator();

function svg(w, h, body, extra = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none"${extra}>${body}</svg>\n`;
}
function paths(drawable, { stroke = "#000", width, nonScaling = true, fill } = {}) {
  return g
    .toPaths(drawable)
    .map((p) => {
      const isFill = p.fill && p.fill !== "none";
      const s = isFill && !p.stroke ? "none" : stroke;
      return `<path d="${p.d}" fill="${isFill ? fill || stroke : "none"}" stroke="${p.stroke === "none" ? "none" : s}" stroke-width="${width ?? p.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"${nonScaling ? ' vector-effect="non-scaling-stroke"' : ""}/>`;
    })
    .join("");
}
function write(name, content) {
  fs.writeFileSync(path.join(out, name), content);
  console.log(name, content.length);
}

// 1. Box frames (mask for ::before overlays; stretched with non-scaling stroke). 3 seeds for variety.
//    Three roughness grades: designed (r .6, 1 pass), sketch (r 1.2, 2 passes), scribble (r 2.6, 2 passes).
const grades = { d: { roughness: 0.6, bowing: 0.6, disableMultiStroke: true }, s: { roughness: 1.2, bowing: 1 }, x: { roughness: 2.6, bowing: 3 } };
for (const [k, o] of Object.entries(grades)) {
  for (const seed of [1, 2, 3]) {
    const d = g.rectangle(4, 4, 392, 192, { ...o, seed, strokeWidth: 2 });
    write(`frame-${k}${seed}.svg`, svg(400, 200, paths(d, { width: 2 })));
  }
}
// 2. Pill / rounded frames for buttons and inputs.
for (const seed of [4, 5]) {
  const d = g.path("M20 4 H180 Q196 4 196 20 V30 Q196 46 180 46 H20 Q4 46 4 30 V20 Q4 4 20 4 Z", { roughness: 1, bowing: 1, seed, strokeWidth: 2 });
  write(`pill-s${seed - 3}.svg`, svg(200, 50, paths(d, { width: 2 })));
}
// 3. Hand-drawn circles/ellipses (badges, avatars, unread rings). Not closed exactly, slightly overshooting.
for (const [i, r] of [[1, 1], [2, 1.6], [3, 2.8]].entries()) {
  const d = g.ellipse(50, 50, 90, 88, { roughness: r[1], seed: 10 + i, strokeWidth: 2 });
  write(`circle-${r[0]}.svg`, svg(100, 100, paths(d, { width: 2.5 })));
}
// 4. Scribble underlines (links, selected room, active tab, headings).
const underl = [
  "M2 8 C 30 4, 60 9, 98 5",
  "M2 6 C 25 9, 55 2, 98 7 M10 9 C 40 6, 70 8, 95 6",
  "M2 7 Q 12 2 22 7 T 42 7 T 62 7 T 82 7 T 98 6",
];
underl.forEach((dd, i) => {
  const d = g.path(dd, { roughness: 0.8, seed: 20 + i, strokeWidth: 2 });
  write(`underline-${i + 1}.svg`, svg(100, 12, paths(d, { width: 2.2 })));
});
// 5. Hachure tiles (selected rows, badges, placeholders) — rough "hachure" fill, tileable-ish 40x40.
for (const [name, angle, gap] of [["hachure", -41, 6], ["hachure-dense", -41, 3.5], ["crosshatch", 45, 7]]) {
  const d = g.rectangle(-10, -10, 60, 60, { fill: "#000", fillStyle: name === "crosshatch" ? "cross-hatch" : "hachure", hachureAngle: angle, hachureGap: gap, fillWeight: 1, roughness: 1, stroke: "none", seed: 31 });
  write(`${name}.svg`, svg(40, 40, paths(d, { width: 1, nonScaling: false }), ' preserveAspectRatio="xMidYMid slice"').replace(' preserveAspectRatio="none"', ""));
}
// 6. Arrows (day separators, send button, "new messages" marker).
{
  const a = [g.curve([[5, 22], [40, 14], [80, 20], [112, 16]], { roughness: 1, seed: 40, strokeWidth: 2 }), g.linearPath([[98, 6], [114, 16], [100, 28]], { roughness: 1, seed: 41, strokeWidth: 2 })];
  write("arrow-right.svg", svg(120, 32, a.map((d) => paths(d, { width: 2.2 })).join("")));
  const s = [g.circle(24, 24, 40, { roughness: 1.2, seed: 42 }), g.linearPath([[14, 24], [33, 24]], { roughness: 0.8, seed: 43 }), g.linearPath([[26, 16], [34, 24], [26, 32]], { roughness: 0.8, seed: 44 })];
  write("send-circled.svg", svg(48, 48, s.map((d) => paths(d, { width: 2.4, nonScaling: false })).join("")).replace(' preserveAspectRatio="none"', ""));
}
// 7. Scribble-out / strikethrough blob (redacted messages) and checkmark.
{
  const pts = [];
  for (let i = 0; i < 9; i++) pts.push([4 + i * 11, i % 2 ? 4 : 20], [8 + i * 11, i % 2 ? 20 : 4]);
  write("scribble-out.svg", svg(100, 24, paths(g.curve(pts, { roughness: 1.5, seed: 50 }), { width: 2 })));
  write("check.svg", svg(24, 24, paths(g.linearPath([[3, 13], [9, 19], [21, 4]], { roughness: 1, seed: 51 }), { width: 2.6, nonScaling: false })).replace(' preserveAspectRatio="none"', ""));
}
// 8. Napkin coffee ring (decorative, low alpha brown).
{
  const r1 = g.ellipse(100, 100, 170, 166, { roughness: 2, seed: 60, strokeWidth: 9 });
  const r2 = g.ellipse(102, 98, 160, 158, { roughness: 1.4, seed: 61, strokeWidth: 3 });
  write("coffee-ring.svg", svg(200, 200, paths(r1, { stroke: "#6f4e37", width: 7, nonScaling: false }).replace(/<path /g, '<path opacity=".22" ') + paths(r2, { stroke: "#6f4e37", width: 2, nonScaling: false }).replace(/<path /g, '<path opacity=".3" ')).replace(' preserveAspectRatio="none"', ""));
}
