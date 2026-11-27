"""Hatching kernel for pen and wash (and its chalk twin): tone by line, the way the pen does it.

Tone comes from how close and how fine the lines are, never from grey: a light shadow is a few
lines far apart, a deep one is many fine lines close together, and the deepest crosses them.
Every hatch group is explicit lines clipped to its shape by geometry (so no line leaves its
shadow, R-BAKE-2), drawn over a soft wash of the same shape (R-BAKE-1), in one of two hands:

  ruled  straight lines at one angle, even spacing: architecture, furniture, anything built
  free   each line bows a little, starts and stops a little early, its angle drifts: a painting,
         a landscape, anything drawn from life

Call order: hatch(d, shape, tone, ...) after the shape's outline is drawn, or scumble(...) for
the random short strokes that give a lit front face its depth without a direction.
"""
import math
import random

# Tone tiers, light to deep: (spacing, line width, crossed). The tiers stay close together, never
# wide apart (lines far apart read as stray marks, not tone): a light shadow is a small or short
# patch of hatching (feather it), not a sparse one. Darker is closer and finer, so a deep
# shadow reads dark without blocking up; only the deepest crosses a second set, square to the
# first (a crossed mid tone reads as mesh, not as shadow).
TONES = {
    1: (4.4, 0.6, False),
    2: (3.6, 0.56, False),
    3: (2.9, 0.53, False),
    4: (2.3, 0.5, False),
    5: (1.8, 0.5, True),
}
CROSS = 90                      # the second set of a crossed tier runs square to the first
WASH = {1: 0.05, 2: 0.08, 3: 0.11, 4: 0.15, 5: 0.19}   # the soft tone laid under each tier
HANDS = ("ruled", "free")
_N = [0]


def _clip_line(poly, ox, oy, dx, dy):
    """Where the infinite line through (ox, oy) along (dx, dy) runs inside the polygon: a list of
    (t0, t1) parameter spans, from even-odd crossings of its edges."""
    ts = []
    n = len(poly)
    for i in range(n):
        (ax, ay), (bx, by) = poly[i], poly[(i + 1) % n]
        ex, ey = bx - ax, by - ay
        den = dx * ey - dy * ex
        if abs(den) < 1e-9:
            continue
        t = ((ax - ox) * ey - (ay - oy) * ex) / den
        u = ((ax - ox) * dy - (ay - oy) * dx) / den
        if 0 <= u < 1:
            ts.append(t)
    ts.sort()
    return [(ts[k], ts[k + 1]) for k in range(0, len(ts) - 1, 2)]


def _offsets(lo, hi, sp, grade):
    """Line positions across [lo, hi]. With a grade (dense_k, sparse_k) the spacing runs from
    sp * dense_k at lo to sp * sparse_k at hi: the shadow fades out into the light."""
    out, s = [], lo + sp * 0.5
    while s < hi:
        out.append(s)
        if grade:
            f = (s - lo) / max(hi - lo, 1e-6)
            k = grade[0] + (grade[1] - grade[0]) * f
        else:
            k = 1.0
        s += sp * k
    return out


def _stroke(x0, y0, x1, y1, hand, rg, curve=0.0):
    """One hatch line, as polyline points: straight when ruled, bowed and trimmed when free. With
    a curve every line bends the same way by curve x its length, so the set follows a rounded
    surface (contour hatching) instead of lying flat across it."""
    if curve:
        L = math.hypot(x1 - x0, y1 - y0)
        if L < 0.8:
            return None
        nx, ny = -(y1 - y0) / L, (x1 - x0) / L
        sag = curve * L
        return [(x0 + (x1 - x0) * t + nx * sag * 4 * t * (1 - t), y0 + (y1 - y0) * t + ny * sag * 4 * t * (1 - t))
                for t in (0, 0.25, 0.5, 0.75, 1)]
    if hand == "ruled":
        return [(x0, y0), (x1, y1)]
    L = math.hypot(x1 - x0, y1 - y0)
    if L < 1.2:
        return None
    a, b = rg.uniform(0, 0.03) * min(L, 8), rg.uniform(0, 0.04) * min(L, 8)   # runs edge to edge, barely short
    ux, uy = (x1 - x0) / L, (y1 - y0) / L
    sx, sy, ex, ey = x0 + ux * a, y0 + uy * a, x1 - ux * b, y1 - uy * b
    bow = rg.uniform(-0.12, 0.12) * min(1.0, L / 14)
    mx, my = (sx + ex) / 2 - uy * bow, (sy + ey) / 2 + ux * bow
    return [(sx, sy), (mx, my), (ex, ey)]


def _set(poly, sp, ang, hand, rg, grade, feather=None, curve=0.0, clean=False):
    """One set of parallel lines at angle ang (degrees) across the polygon."""
    th = math.radians(ang)
    dx, dy = math.cos(th), math.sin(th)
    nx, ny = -dy, dx
    proj = [x * nx + y * ny for x, y in poly]
    lo, hi = min(proj), max(proj)
    if feather:                                       # how far each line sits towards the light, 0..1
        amt, lx, ly = feather
        lp = [x * lx + y * ly for x, y in poly]
        l0, l1 = min(lp), max(lp)
    if grade and grade[2] < 0:                        # dense at the far side instead
        lo, hi = -hi, -lo
        nx, ny = -nx, -ny
    # Each line passes through the shape's centre line, so a free line's drift turns it about
    # the shape and never swings it off a narrow shape far from the origin.
    cx, cy = sum(p[0] for p in poly) / len(poly), sum(p[1] for p in poly) / len(poly)
    c0 = cx * nx + cy * ny
    lines = []
    for s in _offsets(lo, hi, sp, grade):
        jit = rg.uniform(-0.08, 0.08) * sp if hand == "free" and not clean else 0.0
        drift = math.radians(rg.uniform(-0.8, 0.8)) if hand == "free" and not clean else 0.0
        ddx, ddy = math.cos(th + drift), math.sin(th + drift)
        ox, oy = cx + nx * (s + jit - c0), cy + ny * (s + jit - c0)
        for t0, t1 in _clip_line(poly, ox, oy, ddx, ddy):
            if feather:                                   # lines nearer the light stop shorter: a soft edge
                mx, my = ox + ddx * (t0 + t1) / 2, oy + ddy * (t0 + t1) / 2
                f = ((mx * lx + my * ly) - l0) / max(l1 - l0, 1e-6)
                cut = amt * max(0.0, f) ** 1.3 * (1.0 if clean else rg.uniform(0.8, 1.0)) * (t1 - t0)
                if ddx * lx + ddy * ly > 0:
                    t1 -= cut
                else:
                    t0 += cut
            pts = _stroke(ox + ddx * t0, oy + ddy * t0, ox + ddx * t1, oy + ddy * t1, hand, rg, curve)
            if pts:
                lines.append(pts)
    return lines


def _dashes(line, rg, dash):
    """Break a free line into strokes of dash = (shortest, longest, gap) length, as a pen lifts."""
    (sx, sy), (ex, ey) = line[0], line[-1]
    L = math.hypot(ex - sx, ey - sy)
    if L <= dash[1]:
        return [line]
    ux, uy = (ex - sx) / L, (ey - sy) / L
    out, t = [], rg.uniform(0, dash[2])
    while t < L:
        n = min(L, t + rg.uniform(dash[0], dash[1]))
        if n - t > 1:
            m, bow = (t + n) / 2, rg.uniform(-0.25, 0.25)          # every stroke bows a little, like the line it was cut from
            out.append([(sx + ux * t, sy + uy * t), (sx + ux * m - uy * bow, sy + uy * m + ux * bow), (sx + ux * n, sy + uy * n)])
        t = n + rg.uniform(dash[2] * 0.5, dash[2] * 1.5)
    return out


def hatch(d, shape, tone, ang=45, hand="ruled", seed=0, grade=None, colour="hatch", wash=True, dash=None, scale=1.0,
          feather=None, curve=0.0, clean=False):
    """Shade a polygon with explicit hatching over a soft wash.

    tone  1 (light, far apart) to 5 (deepest, close and crossed): TONES
    ang   the first set's angle in degrees; 45 runs down to the right, the light's way
    hand  'ruled' (built things) or 'free' (drawn from life)
    grade None, or (dense_k, sparse_k, side): spacing runs from dense_k to sparse_k times the
          tier's across the shape, from its low side (side 1) or high side (side -1), so the
          shadow is darkest at its edge and opens towards the light
    wash  True, False, or a factor on the tier's wash (a picture keeps its paper lighter)
    dash  None, or (shortest, longest, gap): free lines broken into strokes (sky, water, earth)
    scale the tier spacing for a drawing at a smaller size (a framed picture): every tier
          scales together, so their order and their line widths are kept
    feather None, or (amount, lx, ly): each line stops short at its end towards (lx, ly), by up
          to amount of its length, so a shadow's edge on the light side is soft and uneven, the
          way a pen fades a tone out, instead of a hard clipped edge
    curve every line bends by this fraction of its length, the same way, to follow a rounded
          surface (a bowl, a rolled edge, a curling sheet); 0 lies flat
    clean no jitter: even spacing and smooth gradients, the hand only in the bend of the line
    """
    assert hand in HANDS and tone in TONES
    sp, w, crossed = TONES[tone]
    sp *= scale
    rg = random.Random(seed * 7919 + tone)
    _N[0] += 1
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in shape)
    col = d.c(colour)
    d.o.append(f'<g data-hatch="{tone}" data-hand="{hand}" data-group="h{_N[0]}">')
    if wash:
        k = float(d.P.get("shadeK", "1")) * (1.0 if wash is True else float(wash))
        d.o.append(f'<polygon points="{pts}" fill="{d.c("shade")}" fill-opacity="{min(1, WASH[tone] * k):.2f}" '
                   f'filter="url(#washIn)" data-wash="h{_N[0]}"/>')
    sets = [(ang, sp)] + ([(ang - CROSS, sp * 1.25)] if crossed else [])
    for a, s in sets:
        lines = _set(shape, s, a, hand, rg, grade, feather, curve, clean)
        if dash and hand == "free":
            lines = [seg for ln in lines for seg in _dashes(ln, rg, dash)]
        for line in lines:
            p = " ".join(f"{x:.1f},{y:.1f}" for x, y in line)
            d.o.append(f'<polyline points="{p}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round"/>')
    d.o.append('</g>')


def scumble(d, shape, n, seed=0, size=5.0, colour="hatch", hand="free"):
    """Random short strokes inside a lit shape: little groups of three or four parallel marks,
    each group turned its own way, for the depth of a front face that has no single shadow
    direction (foliage, turned earth, an old board). Each mark is a straight stroke in either
    hand; a ruled scumble only turns its groups to the hatch angles (45 and 135 degrees)."""
    rg = random.Random(seed * 104729 + n)
    xs, ys = [p[0] for p in shape], [p[1] for p in shape]
    col = d.c(colour)
    _N[0] += 1
    assert hand in HANDS
    d.o.append(f'<g data-hatch="scumble" data-hand="{hand}" data-group="h{_N[0]}">')
    placed, tries = 0, 0
    while placed < n and tries < n * 30:
        tries += 1
        cx, cy = rg.uniform(min(xs), max(xs)), rg.uniform(min(ys), max(ys))
        if not _inside(shape, cx, cy):
            continue
        th = rg.uniform(0, math.pi) if hand == "free" else math.radians(rg.choice((45, 135)))
        dx, dy = math.cos(th), math.sin(th)
        nx, ny = -dy, dx
        for k in range(rg.choice((3, 3, 4))):
            off = (k - 1.5) * size * 0.32
            L = size * rg.uniform(0.7, 1.0)
            ox, oy = cx + nx * off, cy + ny * off
            spans = _clip_line(shape, ox, oy, dx, dy)
            for t0, t1 in spans:
                a, b = max(t0, -L / 2), min(t1, L / 2)
                if b - a > 0.8:
                    d.o.append(f'<polyline points="{ox + dx * a:.1f},{oy + dy * a:.1f} {ox + dx * b:.1f},{oy + dy * b:.1f}" '
                               f'fill="none" stroke="{col}" stroke-width="0.5" stroke-linecap="round"/>')
        placed += 1
    d.o.append('</g>')


def _inside(poly, x, y):
    c, n = False, len(poly)
    for i in range(n):
        (ax, ay), (bx, by) = poly[i], poly[(i + 1) % n]
        if (ay > y) != (by > y) and x < ax + (y - ay) * (bx - ax) / (by - ay):
            c = not c
    return c


def free_line(pts, seed=0, amp=0.5):
    """A drawn-from-life outline through pts: each segment split and nudged sideways by a little
    smooth noise, so a long edge breathes instead of running like a rule. Returns points."""
    rg = random.Random(seed * 31337 + len(pts))
    out = [pts[0]]
    for (ax, ay), (bx, by) in zip(pts, pts[1:]):
        L = math.hypot(bx - ax, by - ay)
        n = max(1, int(L / 9))
        nx, ny = (-(by - ay) / L, (bx - ax) / L) if L else (0, 0)
        ph = rg.uniform(0, math.tau)
        for i in range(1, n + 1):
            t = i / n
            w = 0 if i == n else math.sin(t * math.pi + ph) * amp * rg.uniform(0.6, 1)
            out.append((ax + (bx - ax) * t + nx * w, ay + (by - ay) * t + ny * w))
    return out


def ellipse(cx, cy, rx, ry, n=28, rot=0.0):
    """A polygon for an ellipse, for hatching round shapes (a clump, a cast shadow, a rock)."""
    c, s = math.cos(rot), math.sin(rot)
    return [(cx + rx * math.cos(t) * c - ry * math.sin(t) * s, cy + rx * math.cos(t) * s + ry * math.sin(t) * c)
            for t in (2 * math.pi * k / n for k in range(n))]


def crescent(cx, cy, r, k=0.62, n=24):
    """The shadow side of a round form lit from the upper left: the disc minus a disc shifted
    up and left, as one polygon (lower right)."""
    sx, sy = -r * (1 - k) * 0.85, -r * (1 - k) * 0.85
    outer = [(cx + r * math.cos(t), cy + r * math.sin(t))
             for t in (math.radians(-30 + 210 * i / n) for i in range(n + 1))]
    inner = [(cx + sx + r * math.cos(t), cy + sy + r * math.sin(t))
             for t in (math.radians(180 - 210 * i / n) for i in range(n + 1))]
    inner = [(x, y) for x, y in inner if math.hypot(x - cx, y - cy) <= r + 0.01]
    return outer + inner
