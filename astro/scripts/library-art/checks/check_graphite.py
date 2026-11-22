"""Checks for the graphite pencil playbook.

python3 checks/check_graphite.py DRAWING.svg [--background HEX, default: the light ground token]

G1 no vector-crisp marks: every stroke inside a picture sits under a graphite filter.
G2 no hard lines: at 3x zoom, very sharp luminance steps cover under 1.2% of the picture.
G3 full value range: the picture spans light to dark (p2..p98 luminance span >= 0.45).
G4 paper grain present: fine texture is measurable in the mid tones.
G5 depth by value: the distant band sits closer to the paper than the near band (atmospheric
   perspective; on light paper the distance is lighter, on dark paper with chalk it is darker).
"""
import argparse
import os
import re
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from checks.common import Report, read, render, luminance, picture_rects   # noqa: E402
from kernel.tokens import palette


def picture_block(svg, pid):
    m = re.search(rf'<g clip-path="url\(#{pid}c\)">', svg)
    depth = 0
    for t in re.finditer(r"<g\b[^>]*>|</g>", svg[m.start():]):
        depth += -1 if t.group(0) == "</g>" else 1
        if depth == 0:
            return svg[m.start():m.start() + t.end()]
    return svg[m.start():]


def unfiltered_strokes(block):
    """Strokes not inside any <g filter=...> (the outer clip group itself has no filter)."""
    bad, stack = 0, []
    for t in re.finditer(r"<g\b[^>]*>|</g>|<(?:line|polyline|path|polygon|rect|circle)\b[^>]*>", block):
        s = t.group(0)
        if s.startswith("<g"):
            stack.append("filter=" in s)
        elif s == "</g>":
            if stack:
                stack.pop()
        elif 'stroke="' in s and 'stroke="none"' not in s and not any(stack):
            bad += 1
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("svg")
    ap.add_argument("--background", default=palette("light")["ground"])
    a = ap.parse_args()
    svg = read(a.svg)
    pics = picture_rects(svg)
    rep = Report(f"graphite checks: {os.path.basename(a.svg)} ({len(pics)} pictures)")
    if not pics:
        rep.add("G0 pictures found", False, "no graphite pictures in this file")
        sys.exit(rep.print())

    crisp = sum(unfiltered_strokes(picture_block(svg, pid)) for pid, *_ in pics)
    rep.add("G1 no vector-crisp marks", crisp <= 0, f"{max(crisp, 0)} unfiltered strokes inside pictures")

    z = 3.0
    img = luminance(render(a.svg, z, background=a.background))
    bg = a.background.lstrip("#")
    paper = 0.18 if (int(bg[0:2], 16) * 0.2126 + int(bg[2:4], 16) * 0.7152 + int(bg[4:6], 16) * 0.0722) / 255 < 0.5 else 0.97
    worst_hard, worst_span, worst_grain, depth_ok = 0.0, 1.0, 1.0, True
    for pid, x, y, w, h in pics:
        x0, y0, x1, y1 = int((x + 3) * z), int((y + 3) * z), int((x + w - 3) * z), int((y + h - 3) * z)
        p = img[y0:y1, x0:x1]
        gy, gx = np.gradient(p)
        mag = np.hypot(gx, gy)
        hard = float((mag > 0.22).mean())
        worst_hard = max(worst_hard, hard)
        lo, hi = np.percentile(p, [2, 98])
        worst_span = min(worst_span, hi - lo)
        mid = p[(p > 0.35) & (p < 0.75)]
        grain = float(np.std(np.diff(p, axis=1)[(p[:, 1:] > 0.35) & (p[:, 1:] < 0.75)])) if mid.size > 500 else 0.0
        worst_grain = min(worst_grain, grain)
        hh = p.shape[0]
        far = p[int(hh * 0.28):int(hh * 0.38)].mean()
        near = p[int(hh * 0.85):int(hh * 0.95)].mean()
        depth_ok &= abs(far - paper) < abs(near - paper)
    rep.add("G2 no hard lines", worst_hard < 0.012, f"sharp-step coverage {worst_hard * 100:.2f}% (limit 1.2%)")
    rep.add("G3 full value range", worst_span >= 0.45, f"narrowest p2..p98 span {worst_span:.2f}")
    rep.add("G4 paper grain present", worst_grain > 0.008, f"mid-tone grain {worst_grain:.4f}")
    rep.add("G5 depth by value", depth_ok, "distance closer to the paper than the foreground in every picture" if depth_ok else "the distance is not closer to the paper than the foreground")
    sys.exit(1 if rep.print() else 0)


if __name__ == "__main__":
    main()
