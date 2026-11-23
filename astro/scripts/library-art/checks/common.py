"""Shared helpers for the art checks: render with rsvg-convert, load as luminance arrays, report."""
import os
import re
import subprocess
import tempfile

import numpy as np
from PIL import Image


def render(svg_path, scale=1.0, background=None):
    """Render an SVG file at a zoom factor and return an RGB numpy array (float 0..1)."""
    fd, png = tempfile.mkstemp(suffix=".png")
    os.close(fd)
    cmd = ["rsvg-convert", "-z", str(scale), svg_path, "-o", png]
    if background:
        cmd[1:1] = ["-b", background]
    subprocess.run(cmd, check=True)
    arr = np.asarray(Image.open(png).convert("RGB"), dtype=np.float32) / 255.0
    os.remove(png)
    return arr


def luminance(rgb):
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def picture_rects(svg_text):
    """Picture areas drawn by the graphite kernel: the rect inside each <clipPath id="ppNc">."""
    out = []
    for m in re.finditer(r'<clipPath id="(pp\d+)c"><rect x="([\d.\-]+)" y="([\d.\-]+)" width="([\d.]+)" height="([\d.]+)"/>', svg_text):
        out.append((m.group(1), float(m.group(2)), float(m.group(3)), float(m.group(4)), float(m.group(5))))
    return out


class Report:
    def __init__(self, title):
        self.title, self.rows = title, []

    def add(self, rule, ok, detail):
        self.rows.append((rule, ok, detail))

    def print(self):
        print(f"\n{self.title}")
        for rule, ok, detail in self.rows:
            print(f"  [{'PASS' if ok else 'FAIL'}] {rule}: {detail}")
        failed = sum(1 for r in self.rows if not r[1])
        print(f"  -> {len(self.rows) - failed}/{len(self.rows)} passed")
        return failed
