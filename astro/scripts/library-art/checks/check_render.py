"""Checks for the render and level-of-detail playbook.

python3 checks/check_render.py SRC.svg OUT_DIR NAME --tile-width 760 [--background HEX, default: the light ground token] [--export]

R1 pyramid budgets: @1x, @2x, @4x WebP sizes within BUDGET.
R2 pyramid tiling: each level is exactly tile_width x scale wide, so tiles meet without a seam.
R3 near detail: the strongest edges at @4x are sharper than @2x upscaled (zooming in gains detail).
R4 far view: @1x matches a Lanczos downsample of @4x (hatching averages to tone, no moire).
R5 no live effects: the print vector holds no feTurbulence / feDisplacementMap.
R6 print parity: the print vector looks like the @2x raster.
R7 picture sharpness: every baked picture in the print vector holds PICTURE_SCALE px per drawn px.
"""
import argparse
import gzip
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from checks.common import Report, read                         # noqa: E402
from kernel import render as R                                 # noqa: E402
from kernel.tokens import palette


def gray(path, background=None):
    """Luminance 0..1. A sprite with transparency is laid on the background first, as the print is."""
    im = Image.open(path)
    if background and im.mode in ("RGBA", "LA"):
        base = Image.new("RGBA", im.size, background)
        im = Image.alpha_composite(base, im.convert("RGBA"))
    return np.asarray(im.convert("L"), dtype=np.float32) / 255


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out_dir")
    ap.add_argument("name")
    ap.add_argument("--tile-width", type=float, required=True)
    ap.add_argument("--background", default=palette("light")["ground"])
    ap.add_argument("--export", action="store_true")
    a = ap.parse_args()
    if a.export:
        R.export(a.src, a.out_dir, a.name, a.tile_width, a.background)
    B = R.BUDGET
    p = {s: os.path.join(a.out_dir, f"{a.name}@{s}x.webp") for s in R.RASTER_SCALES}
    rep = Report(f"render checks: {a.name}")
    kb = {s: os.path.getsize(p[s]) / 1024 for s in p}
    rep.add("R1 pyramid budgets", all(kb[s] <= B[f"kb_{s}x"] for s in kb),
            ", ".join(f"@{s}x {kb[s]:.0f} KB (<= {B[f'kb_{s}x']})" for s in sorted(kb)))
    off = [f"@{s}x {Image.open(p[s]).width}px" for s in p if Image.open(p[s]).width != int(a.tile_width * s)]
    rep.add("R2 pyramid tiling", not off, "; ".join(off) or "every level is an exact multiple of the tile width")
    four = Image.open(p[4]).convert("L")
    two_up = Image.open(p[2]).convert("L").resize(four.size, Image.BICUBIC)
    hf = lambda im: float(np.percentile(np.abs(np.diff(np.asarray(im, dtype=np.float32), axis=1)), 99.5))   # sharpness of the strongest edges
    rep.add("R3 near detail", hf(four) > hf(two_up) * 1.08, f"@4x edge energy {hf(four):.2f} vs @2x upscaled {hf(two_up):.2f}")
    one = gray(p[1]) * 255
    lan = np.asarray(four.resize((four.width // 4, four.height // 4), Image.LANCZOS), dtype=np.float32)
    nea = np.asarray(four.resize((four.width // 4, four.height // 4), Image.NEAREST), dtype=np.float32)
    ok = np.abs(one - lan).mean() < np.abs(one - nea).mean()
    rep.add("R4 far view", bool(ok), "@1x is a Lanczos downsample" if ok else "@1x looks point-sampled (moire risk)")
    pr = os.path.join(a.out_dir, f"{a.name}-print.svg")
    lite = read(pr)
    heavy = [f for f in ("feTurbulence", "feDisplacementMap") if f in lite]
    gz = len(gzip.compress(re.sub(r"<image[^>]*/>", "", lite).encode())) / 1024
    rep.add("R5 no live effects", not heavy and gz <= B["print_gz_kb"], f"{heavy or 'no noise filters'}, {gz:.1f} KB gz")
    with tempfile.TemporaryDirectory() as td:
        png = os.path.join(td, "l.png")
        subprocess.run(["rsvg-convert", "-z", "2", "-b", a.background, pr, "-o", png], check=True, cwd=a.out_dir)
        L, N = gray(png), gray(p[2], a.background)
    hh, ww = min(L.shape[0], N.shape[0]), min(L.shape[1], N.shape[1])
    diff = float(np.abs(L[:hh, :ww] - N[:hh, :ww]).mean())
    rep.add("R6 print parity", diff <= B["parity_diff"], f"mean difference {diff:.3f} (<= {B['parity_diff']})")
    soft = []
    for m in re.finditer(r'<image x="[\d.\-]+" y="[\d.\-]+" width="([\d.]+)" height="([\d.]+)" href="([^"]+)"', lite):
        w, h, href = float(m.group(1)), float(m.group(2)), m.group(3)
        im = Image.open(os.path.join(a.out_dir, href))
        if im.width < w * R.PICTURE_SCALE - 1:
            soft.append(f"{href} {im.width}px for {w:g}")
    rep.add("R7 picture sharpness", not soft, "; ".join(soft) or f"pictures baked at >= {R.PICTURE_SCALE}x (or none present)")
    sys.exit(1 if rep.print() else 0)


if __name__ == "__main__":
    main()
