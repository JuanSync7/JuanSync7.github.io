"""Checks for the pen-and-wash playbook.

python3 checks/check_penwash.py LIGHT.svg DARK.svg --tile-width 760

P1 monoline weights: every stroke-width sits in the tiers 0.5-2.2 (hairline, line, accent).
P2 palette: every colour comes from the kernel palettes (plus mask white and pure black shade).
P3 shadow + hatching: every hatched shape is masked by its own shadow and has a soft tone just before it.
P4 tile-safe hatching: hatch spacing makes lines meet exactly at the tile edges.
P5 shadows behind: every offset drop shadow is drawn before the shape that casts it.
P6 seamless tile: rendered right edge continues into the left edge like any interior column.
P7 theme parity: light and dark exports have the same structure.
P8 tone tiers: every explicit hatch group draws at its tier's line width, and the tiers run
   from light to deep as closer and never thicker lines (hatching kernel TONES).
P9 wash by medium: an explicit hatch group in the room has a soft wash under it (pen and wash);
   one inside a picture has none (pen and ink).
P10 hand by scene: groups and outlines inside a picture are free hand (bowed lines); groups in
   the room are ruled (straight two-point lines).
P11 picture depth: in each pen picture the far band sits closer to the paper than the near band.
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
from kernel.tokens import palette
from kernel.hatching import TONES

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


def hatch_groups(svg):
    """Every explicit hatch group the hatching kernel wrote, with its tier, hand, line widths,
    points per line, whether a wash lies under it and whether it sits inside a picture."""
    pics = [(m.start(), _close(svg, m.start())) for m in re.finditer(r'<g [^>]*data-picture="pn\d+"', svg)]
    out = []
    for m in re.finditer(r'<g data-hatch="([^"]+)" data-hand="([^"]+)" data-group="(h\d+)">', svg):
        end = svg.index("</g>", m.end())
        inner = svg[m.end():end]
        out.append({
            "id": m.group(3), "tier": m.group(1), "hand": m.group(2),
            "widths": sorted({float(w) for w in re.findall(r'<polyline[^>]*stroke-width="([\d.]+)"', inner)}),
            "points": [len(p.split()) for p in re.findall(r'<polyline points="([^"]+)"', inner)],
            "wash": f'data-wash="{m.group(3)}"' in inner,
            "picture": any(a <= m.start() < b for a, b in pics),
        })
    return out


def _close(svg, start):
    depth = 0
    for t in re.finditer(r"<g\b[^>]*>|</g>", svg[start:]):
        depth += -1 if t.group(0) == "</g>" else 1
        if depth == 0:
            return start + t.end()
    return len(svg)


def picture_depth(path, svg, theme):
    """For each pen picture: mean distance from the paper colour of its far band and of its near
    band, rendered at 2x. A picture names them as boxes (data-far, data-near: x0,y0,x1,y1 in
    fractions of the picture); one that names none is read across its width at 35 to 48 % down
    and in its last 12 %."""
    rects = [(m.group(1), *map(float, m.groups()[1:])) for m in re.finditer(
        r'<clipPath id="(pn\d+)c"><rect x="([\d.\-]+)" y="([\d.\-]+)" width="([\d.]+)" height="([\d.]+)"/>', svg)]
    if not rects:
        return []
    pal = palette(theme)
    img = luminance(render(path, 2.0, background=pal["ground"]))
    paper = luminance(np.array([[int(pal["paper"][i:i + 2], 16) / 255 for i in (1, 3, 5)]], dtype=np.float32))[0]
    out = []
    for pid, x, y, w, h in rects:
        m = re.search(rf'data-picture="{pid}"[^>]*data-far="([\d.,]+)" data-near="([\d.,]+)"', svg)
        far, near = ((tuple(map(float, m.group(1).split(","))), tuple(map(float, m.group(2).split(","))))
                     if m else ((0, 0.35, 1, 0.48), (0, 0.88, 1, 1.0)))

        def band(x0, y0, x1, y1):
            r = img[int(2 * (y + h * y0)):int(2 * (y + h * y1)), int(2 * (x + w * x0)):int(2 * (x + w * x1))]
            return float(np.abs(r - paper).mean())
        out.append((pid, theme, band(*far), band(*near)))
    return out


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
    allowed |= {"#FFF", "#FFFFFF"}  # a mask stencil's white, not a colour
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
        img = luminance(render(a.light, 1.0, background=palette("light")["ground"]))
        edge = np.abs(img[:, -1] - img[:, 0]).mean()
        inner = np.mean([np.abs(img[:, x + 1] - img[:, x]).mean() for x in range(40, img.shape[1] - 41, 37)])
        rep.add("P6 seamless tile", edge <= 3 * inner + 0.01, f"edge step {edge:.4f} vs interior {inner:.4f}")
    else:
        rep.add("P6 seamless tile", True, "not a tile, skipped")

    cl, cd = len(re.findall(r"<[a-zA-Z]", L)), len(re.findall(r"<[a-zA-Z]", Dk))
    rep.add("P7 theme parity", abs(cl - cd) <= max(3, 0.01 * cl), f"light {cl} elements, dark {cd}")

    groups = hatch_groups(L)
    wrong = [f"{g['id']}: tier {g['tier']} at {w}" for g in groups if g["tier"] != "scumble"
             for w in g["widths"] if abs(w - TONES[int(g["tier"])][1]) > 1e-6]
    order = all(TONES[k][0] > TONES[k + 1][0] and TONES[k][1] >= TONES[k + 1][1] for k in range(1, max(TONES)))
    order = order and TONES[1][0] <= 2 * TONES[max(TONES)][0] + 1   # the lightest never far apart
    rep.add("P8 tone tiers", not wrong and order,
            f"{len(groups)} hatch groups, off-tier widths: {wrong[:3] or 'none'}; tiers closer and finer as they deepen: {order}")

    no_wash = [g["id"] for g in groups if not g["picture"] and g["tier"] != "scumble" and not g["wash"]]
    washed = [g["id"] for g in groups if g["picture"] and g["wash"]]
    rep.add("P9 wash by medium", not no_wash and not washed,
            f"room groups without a wash: {no_wash[:3] or 'none'}; picture groups with one: {washed[:3] or 'none'}")

    bad_hand = [g["id"] for g in groups if g["hand"] != ("free" if g["picture"] else "ruled")]
    bent_rules = [g["id"] for g in groups if g["hand"] == "ruled" and max(g["points"], default=2) > 2]
    free = [n for g in groups if g["hand"] == "free" and g["tier"] != "scumble" for n in g["points"]]
    bowed = sum(1 for n in free if n >= 3) / max(1, len(free))
    rep.add("P10 hand by scene", not bad_hand and not bent_rules and (not free or bowed >= 0.9),
            f"in the wrong hand: {bad_hand[:3] or 'none'}; bent ruled lines: {bent_rules[:3] or 'none'}; free lines bowed {bowed:.0%}")

    depth = picture_depth(a.light, L, "light") + picture_depth(a.dark, Dk, "dark")
    flat = [f"{pid} ({th}): far {f:.3f} near {n:.3f}" for pid, th, f, n in depth if f >= n]
    rep.add("P11 picture depth", not flat, f"{len(depth)} pictures, far not closer to the paper: {flat or 'none'}")
    sys.exit(1 if rep.print() else 0)


def selftest(light):
    """Each new rule still catches the drawing it exists to stop: a picture redrawn ruled, a tier
    drawn at another width, a room hatch with its wash taken away."""
    svg = read(light)
    g = hatch_groups(svg)
    pic = next(x for x in g if x["picture"] and x["tier"] != "scumble")
    room = next((x for x in g if not x["picture"] and x["tier"] != "scumble"), None)
    cases = {
        "P10 picture drawn ruled": [x for x in hatch_groups(svg.replace(f'data-hand="free" data-group="{pic["id"]}"', f'data-hand="ruled" data-group="{pic["id"]}"', 1))
                                    if x["hand"] != ("free" if x["picture"] else "ruled")],
        "P8 tier at another width": [w for x in hatch_groups(re.sub(r'(data-group="%s">.*?stroke-width=")[\d.]+' % pic["id"], r"\g<1>0.9", svg, count=1, flags=re.S))
                                     if x["id"] == pic["id"] for w in x["widths"] if abs(w - TONES[int(x["tier"])][1]) > 1e-6],
    }
    if room:
        cases["P9 room hatch without its wash"] = [x for x in hatch_groups(svg.replace(f'data-wash="{room["id"]}"', 'data-wash="gone"', 1))
                                                    if not x["picture"] and x["tier"] != "scumble" and not x["wash"]]
    ok = True
    for name, caught in cases.items():
        print(f"  [{'PASS' if caught else 'FAIL'}] selftest {name}: {'caught' if caught else 'NOT caught'}")
        ok &= bool(caught)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest(sys.argv[sys.argv.index("--selftest") + 1])
    main()
