"""Checks for the pen-and-wash playbook.

python3 checks/check_penwash.py LIGHT.svg DARK.svg --tile-width 760

P1 monoline weights: every stroke-width sits in the tiers 0.5-2.2 (hairline, line, accent).
P2 palette: every colour comes from the kernel palettes (plus mask white and pure black shade).
P3 shadow + hatching: every hatched shape is masked by its own shadow and has a soft tone just before it.
P4 tile-safe hatching: hatch spacing makes lines meet exactly at the tile edges.
P5 shadows behind: every offset drop shadow is drawn before the shape that casts it.
P6 seamless tile: rendered right edge continues into the left edge like any interior column.
P7 theme parity: light and dark exports have the same structure.
"""
import argparse
import math
import os
import re
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from checks.common import Report, read, render, luminance          # noqa: E402
from kernel.penwash import LIGHT, DARK                             # noqa: E402

PICTURE_IDS = re.compile(r'id="pp\d+')


def strip_pictures(svg):
    """Remove graphite picture blocks; they follow the graphite playbook, not this one."""
    out, i = [], 0
    for m in re.finditer(r'<g clip-path="url\(#pp\d+c\)">', svg):
        if m.start() < i:
            continue
        depth, j = 0, m.start()
        for t in re.finditer(r"<g\b|</g>", svg[m.start():]):
            depth += 1 if t.group(0) == "<g" else -1
            if depth == 0:
                j = m.start() + t.end()
                break
        out.append(svg[i:m.start()])
        i = j
    out.append(svg[i:])
    return "".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("light")
    ap.add_argument("dark")
    ap.add_argument("--tile-width", type=float, default=0, help="width of a repeating tile; 0 = not tiled")
    a = ap.parse_args()
    rep = Report(f"pen-and-wash checks: {os.path.basename(a.light)} / {os.path.basename(a.dark)}")
    L, Dk = read(a.light), read(a.dark)
    body = strip_pictures(L)
    body = re.sub(r'<g data-role="logo".*?</g>', "", body, flags=re.S)       # the logo keeps its own scaled weights

    widths = [float(w) for w in re.findall(r'stroke-width="([\d.]+)"', body)]
    bad = sorted({w for w in widths if not 0.5 <= w <= 2.2 and w != 0})
    rep.add("P1 monoline weights", not bad, f"{len(widths)} strokes, out of tier: {bad or 'none'}")

    allowed = {v.upper() for P in (LIGHT, DARK) for v in P.values() if isinstance(v, str) and v.startswith("#")}
    allowed |= {"#FFF", "#FFFFFF", "#000000", "#FFE3B3"}
    used = {c.upper() for c in re.findall(r'(?:fill|stroke|stop-color)="(#[0-9A-Fa-f]{3,6})"', strip_pictures(L) + strip_pictures(Dk))}
    stray = sorted(used - allowed)
    rep.add("P2 palette", not stray, f"{len(used)} colours used, off-palette: {stray or 'none'}")

    hatched = re.findall(r'<(?:rect|polygon|path)\b[^>]*fill="url\(#(?:hatch2?|xhatch)\)"[^>]*/>', body)
    unmasked = [h for h in hatched if 'mask="url(#hm' not in h]
    pairs = len(re.findall(r'<(?:rect|polygon|path)\b[^>]*filter="url\(#wash\)"[^>]*/><(?:rect|polygon|path)\b[^>]*fill="url\(#(?:hatch2?|xhatch)\)"', body))
    rep.add("P3 shadow + hatching", not unmasked and pairs == len(hatched),
            f"{len(hatched)} hatched shapes, {len(unmasked)} unmasked, {pairs} with a tone beneath")

    if a.tile_width:
        bad_p = []
        for pid, w, ang in re.findall(r'<pattern id="(hatch2?|xhatch)" width="([\d.]+)"[^>]*rotate\((\d+)\)', L):
            period = float(w) * math.sqrt(2) if ang == "45" else float(w)
            n = a.tile_width / period
            if abs(n - round(n)) > 1e-3:
                bad_p.append(f"{pid}: {n:.3f} periods")
        rep.add("P4 tile-safe hatching", not bad_p, "; ".join(bad_p) or f"all hatch periods divide {a.tile_width:g}")
    else:
        rep.add("P4 tile-safe hatching", True, "not a tile, skipped")

    late = []
    for m in re.finditer(r'<g transform="translate\([\d. ]+\)"><path d="([^"]+)"', body):
        d = m.group(1)
        nxt = body.find(f'd="{d}"', m.end())
        if nxt == -1:
            late.append(d[:24])
    rep.add("P5 shadows behind", not late, f"{len(late)} drop shadows without a later casting shape" if late else "all drop shadows precede their shape")

    if a.tile_width:
        img = luminance(render(a.light, 1.0, background="#F3ECDF"))
        edge = np.abs(img[:, -1] - img[:, 0]).mean()
        inner = np.mean([np.abs(img[:, x + 1] - img[:, x]).mean() for x in range(40, img.shape[1] - 41, 37)])
        rep.add("P6 seamless tile", edge <= 3 * inner + 0.01, f"edge step {edge:.4f} vs interior {inner:.4f}")
    else:
        rep.add("P6 seamless tile", True, "not a tile, skipped")

    cl, cd = len(re.findall(r"<[a-zA-Z]", L)), len(re.findall(r"<[a-zA-Z]", Dk))
    rep.add("P7 theme parity", abs(cl - cd) <= max(3, 0.01 * cl), f"light {cl} elements, dark {cd}")
    sys.exit(1 if rep.print() else 0)


if __name__ == "__main__":
    main()
