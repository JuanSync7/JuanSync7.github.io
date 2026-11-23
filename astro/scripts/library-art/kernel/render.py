"""Render and level-of-detail kernel: turn a full-quality drawing into what the browser loads.

The browser never evaluates the art's filters. Everything is baked at build time into a pyramid:
  FAR    @1x WebP  shown when the drawing is < 0.75 CSS px per drawing px (Lanczos from @4x,
                   so fine hatching averages into tone instead of moire)
  NORMAL @2x WebP  0.75-1.5x, and DPR-2 screens at 1x
  NEAR   @4x WebP  > 1.5x (zoom, pinch, large DPR 3 views); fetched lazily only when needed
  PRINT  vector "lite" SVG for print and archive: pictures embedded at PICTURE_SCALE, no noise
                   filters; not used live because its wash blurs are too costly to repaint
python3 -m kernel.render SRC.svg OUT_DIR NAME [--tile-width 760]
"""
import base64
import io
import os
import re
import subprocess
import sys
import tempfile

from PIL import Image

PICTURE_SCALE = 4            # graphite pictures baked at 4x their drawn size, sharp up to 4x zoom
RASTER_SCALES = (1, 2, 4)    # far, normal, near
WEBP_QUALITY = 82
BUDGET = {                   # checked by checks/check_render.py
    "kb_1x": 120,            # far, loaded eagerly for every visible tile
    "kb_2x": 400,            # normal
    "kb_4x": 1200,           # near, lazy: only on zoom
    "print_gz_kb": 60,       # print vector, gzipped, pictures excluded
    "parity_diff": 0.06,     # print vector vs @2x raster
}
HEAVY_FILTERS = ("graphite", "graphiteLine", "graphiteEdge", "pencil", "chalk")


def rsvg(svg_path, scale, png_path, background=None):
    cmd = ["rsvg-convert", "-z", str(scale), svg_path, "-o", png_path]
    if background:
        cmd[1:1] = ["-b", background]
    subprocess.run(cmd, check=True)


def _block_end(svg, start):
    depth = 0
    for t in re.finditer(r"<g\b[^>]*>|</g>", svg[start:]):
        depth += -1 if t.group(0) == "</g>" else 1
        if depth == 0:
            return start + t.end()
    return len(svg)


def pictures(svg):
    """(pid, x, y, w, h, block_start, block_end) for every graphite picture."""
    out = []
    for m in re.finditer(r'<clipPath id="(pp\d+)c"><rect x="([\d.\-]+)" y="([\d.\-]+)" width="([\d.]+)" height="([\d.]+)"/></clipPath>', svg):
        pid = m.group(1)
        g = svg.find(f'<g clip-path="url(#{pid}c)">', m.end())
        out.append((pid, float(m.group(2)), float(m.group(3)), float(m.group(4)), float(m.group(5)), g, _block_end(svg, g)))
    return out


def _defs_for(svg, pid):
    """The inline gradients, patterns and clip path that belong to one picture."""
    return "".join(re.findall(rf'<(?:linearGradient|radialGradient|pattern|clipPath) id="{pid}[a-z0-9]*".*?</(?:linearGradient|radialGradient|pattern|clipPath)>', svg, flags=re.S))


def bake_picture(svg, pid, x, y, w, h, start, end, scale=PICTURE_SCALE):
    """Render one picture alone (fast: nothing else in the file) and return WebP bytes."""
    head = re.match(r"<svg[^>]*>", svg).group(0)
    head = re.sub(r'viewBox="[^"]*"', f'viewBox="{x} {y} {w} {h}"', head)
    head = re.sub(r'width="[\d.]+"', f'width="{w}"', head, count=1)
    head = re.sub(r'height="[\d.]+"', f'height="{h}"', head, count=1)
    root_defs = re.search(r"<defs>.*?</defs>", svg, flags=re.S).group(0)
    doc = head + root_defs + _defs_for(svg, pid) + svg[start:end] + "</svg>"
    with tempfile.TemporaryDirectory() as td:
        sp, pp = os.path.join(td, "p.svg"), os.path.join(td, "p.png")
        open(sp, "w").write(doc)
        rsvg(sp, scale, pp)
        buf = io.BytesIO()
        Image.open(pp).convert("RGB").save(buf, "WEBP", quality=WEBP_QUALITY, method=6)
    return buf.getvalue()


def lod_style(tile_width):
    """In-SVG media query: when the drawing is shown smaller than 75%, hatch lines give way to tone.
    Works for <img> too, because an SVG image evaluates media queries against its own rendered size."""
    return (f"<style>@media (max-width: {int(tile_width * 0.75)}px) {{ .h {{ display: none }} }}</style>")


def lite(svg, tile_width, picture_files=None):
    """Vector lite: bake pictures, drop heavy filters, mark hatch lines for the LOD style."""
    for (pid, x, y, w, h, s, e) in reversed(pictures(svg)):
        data = bake_picture(svg, pid, x, y, w, h, s, e)
        if picture_files is not None:
            fname = f"{pid}.webp"
            picture_files[fname] = data
            href = fname
        else:
            href = "data:image/webp;base64," + base64.b64encode(data).decode()
        svg = svg[:s] + f'<image x="{x}" y="{y}" width="{w}" height="{h}" href="{href}" preserveAspectRatio="none"/>' + svg[e:]
    svg = svg.replace('<g filter="url(#chalk)">', "<g>")
    for f in HEAVY_FILTERS:
        svg = re.sub(rf'<filter id="{f}".*?</filter>', "", svg, flags=re.S)
    svg = re.sub(r'(<(?:rect|polygon|path)\b[^>]*mask="url\(#hm\d+\)")', r'\1 class="h"', svg)
    svg = re.sub(r"(<svg[^>]*>)", lambda m: m.group(1) + lod_style(tile_width), svg, count=1)
    return svg


def rasters(src_svg, out_base, background=None):
    """Render once at the top scale, then Lanczos down to every lower scale (no moire, one source)."""
    with tempfile.TemporaryDirectory() as td:
        png = os.path.join(td, "r.png")
        rsvg(src_svg, max(RASTER_SCALES), png, background)
        big = Image.open(png).convert("RGB")
        paths = {}
        for s in RASTER_SCALES:
            img = big if s == max(RASTER_SCALES) else big.resize((big.width * s // max(RASTER_SCALES), big.height * s // max(RASTER_SCALES)), Image.LANCZOS)
            p = f"{out_base}@{s}x.webp"
            img.save(p, "WEBP", quality=WEBP_QUALITY, method=6)
            paths[s] = p
        return paths


def export(src_svg, out_dir, name, tile_width, background=None):
    os.makedirs(out_dir, exist_ok=True)
    svg = open(src_svg, encoding="utf-8").read()
    files = {}
    lite_svg = lite(svg, tile_width, files)
    for fname, data in files.items():
        open(os.path.join(out_dir, f"{name}-{fname}"), "wb").write(data)
        lite_svg = lite_svg.replace(f'href="{fname}"', f'href="{name}-{fname}"')
    open(os.path.join(out_dir, f"{name}-print.svg"), "w").write(lite_svg)
    r = rasters(src_svg, os.path.join(out_dir, name), background)
    return {"print": os.path.join(out_dir, f"{name}-print.svg"), "far": r[1], "normal": r[2], "near": r[4]}


def srcset_html(name, tile_width, height, alt=""):
    """The <img> the page uses: the browser picks 1x/2x/4x by density and zoom; 4x is lazy."""
    return (f'<img src="{name}@2x.webp" srcset="{name}@1x.webp 1x, {name}@2x.webp 2x, {name}@4x.webp 4x" '
            f'width="{int(tile_width)}" height="{int(height)}" loading="lazy" decoding="async" alt="{alt}">')


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out_dir")
    ap.add_argument("name")
    ap.add_argument("--tile-width", type=float, default=760)
    ap.add_argument("--background", default=None)
    a = ap.parse_args()
    print(export(a.src, a.out_dir, a.name, a.tile_width, a.background))
