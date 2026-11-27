"""Pen-and-ink pictures: the framed scenes on the library wall, drawn by a free hand (R-BAKE-15).

A picture is built from real objects with their parts (a tower's bands and gallery, a house's
roof planes, windows with panes and shutters, a mill's sail lattice), each shaped first and then
shaded: lit faces keep the paper, faces turned from the upper-left light take a tone tier, glass
and doorways the deep tiers. Depth comes from the tiers and the line, never from grey: far things
take the light tiers and the fine line, near things the deep tiers and the heavy line. Pen and ink
is line only, no wash (the room around it is pen and wash). One thing may glow in the signal.

pen_picture(d, x, y, w, h, scene, seed) draws a scene in the box: 'lighthouse', 'harbour' or
'windmill'. Each is laid out on a 100-unit-wide grid scaled to the box, so its shapes keep their
proportions; hatch spacing and line weights stay in plate units, so every picture shares the tiers.
"""
import math
import random
from functools import partial
from .hatching import hatch as _hatch, scumble as _scumble, free_line, ellipse, crescent

# A picture's tiers run a little closer than the room's (PICTURE_SCALE of its spacing), keeping their
# order and widths. Judged at the size the page shows them (1x and 2x), not at a zoomed sheet: closer
# than this and a small picture's shadows fill in solid on the page.
PICTURE_SCALE = 0.85
# One light, one hand: every shadow in a picture is hatched at this angle (lines rising to the
# right, the stroke a right hand makes), and the deep tiers cross it square. Only level things
# (water) are drawn level.
HATCH_ANG = -45
hatch = partial(_hatch, colour="ink", wash=False, hand="free", scale=PICTURE_SCALE, clean=True)
LIGHT = (-0.7, -0.7)                 # towards the light, for feathering a shadow's lit edge
scumble = partial(_scumble, colour="ink")
FINE, LINE, BOLD = 0.5, 0.65, 0.85          # the picture's own three weights, inside the monoline tiers
_PIC = [0]


class Pic:
    """A scene's drawing surface: grid units in, plate units out, free-hand outlines."""

    def __init__(self, d, x, y, w, h, seed):
        self.d, self.x, self.y, self.k, self.seed = d, x, y, w / 100.0, seed
        self.H = h / self.k
        self.rg = random.Random(seed)
        self.n = 0

    def P(self, pts):
        return [(self.x + px * self.k, self.y + py * self.k) for px, py in pts]

    def _s(self):
        self.n += 1
        return self.seed * 101 + self.n

    def fill(self, pts, colour="paper"):
        q = " ".join(f"{x:.1f},{y:.1f}" for x, y in self.P(pts))
        self.d.o.append(f'<polygon points="{q}" fill="{self.d.c(colour)}" stroke="none"/>')

    def line(self, pts, w=LINE, closed=False, colour="ink", amp=0.28):
        pts = self.P(pts)
        if closed:
            pts = pts + [pts[0]]
        q = " ".join(f"{x:.1f},{y:.1f}" for x, y in free_line(pts, self._s(), amp))
        self.d.o.append(f'<polyline points="{q}" fill="none" stroke="{self.d.c(colour)}" stroke-width="{w}" '
                        f'stroke-linecap="round" stroke-linejoin="round"/>')

    def shape(self, pts, w=LINE, colour="paper"):
        """A solid object's face: paper to hide what is behind, then its outline."""
        self.fill(pts, colour)
        self.line(pts, w, closed=True)

    def shade(self, pts, tone, ang=None, grade=None, dash=None, curve=0.0, feather=0.35, towards=LIGHT):
        """Hatch a shadow, cleanly: close even lines at HATCH_ANG (an angle is passed only for a
        level thing in broken strokes, or a curved set following a round form), fading out on
        the side towards the light by up to feather of their length."""
        if ang is None or (dash is None and not curve):
            ang = HATCH_ANG
        fe = (feather, *towards) if feather and not dash else None
        hatch(self.d, self.P(pts), tone, ang=ang, seed=self._s(), grade=grade, dash=dash, curve=curve, feather=fe)

    def ground_shadow(self, x, base, w, h, dep):
        """The shadow a block casts on the ground to its lower right, the light upper left."""
        self.shade([(x + w, base), (x + w + dep, base - dep * 0.6), (x + w + dep + h * 0.35, base - dep * 0.6 + 0.01),
                    (x + w + h * 0.35, base + 1.6), (x + w * 0.15, base + 1.6), (x, base)], 3)

    def scrub(self, pts, n, size):
        scumble(self.d, self.P(pts), n, self._s(), size=size * self.k)

    def arc(self, cx, cy, r, a0, a1, w=LINE, n=14):
        self.line([(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
                   for a in (a0 + (a1 - a0) * i / n for i in range(n + 1))], w)


# ---------------------------------------------------------------- reusable parts

def window(p, x, y, w, h, shutters=True, lit=False):
    """A window: frame, four panes, glass dark in its upper right, a sill, shutters either side."""
    if shutters:
        for sx in (x - w * 0.42, x + w):
            p.shape([(sx, y), (sx + w * 0.42, y), (sx + w * 0.42, y + h), (sx, y + h)], FINE)
            for k in range(1, 4):
                p.line([(sx + 0.3, y + h * k / 4), (sx + w * 0.42 - 0.3, y + h * k / 4)], FINE)
    p.shape([(x, y), (x + w, y), (x + w, y + h), (x, y + h)], LINE, "signal" if lit else "paper")
    if not lit:
        p.shade([(x + w * 0.35, y), (x + w, y), (x + w, y + h * 0.7)], 4)
    p.line([(x + w / 2, y), (x + w / 2, y + h)], FINE)
    p.line([(x, y + h / 2), (x + w, y + h / 2)], FINE)
    p.shape([(x - w * 0.15, y + h), (x + w * 1.15, y + h), (x + w * 1.15, y + h + 0.9), (x - w * 0.15, y + h + 0.9)], FINE)
    p.shade([(x - w * 0.05, y + h + 0.9), (x + w * 1.15, y + h + 0.9), (x + w * 1.25, y + h + 1.9), (x + w * 0.05, y + h + 1.9)], 3)


def door(p, x, y, w, h):
    """An arched door, in shadow, with its planks and a step."""
    top = [(x + w / 2 + w / 2 * math.cos(math.radians(a)), y + w / 2 - w / 2 * math.sin(math.radians(a))) for a in range(0, 181, 15)]
    outline = [(x + w, y + h)] + top + [(x, y + h)]
    p.shape(outline, LINE)
    p.shade(outline, 3)
    p.line([(x + w / 2, y + w * 0.1), (x + w / 2, y + h)], FINE)
    p.shape([(x - 1, y + h), (x + w + 1, y + h), (x + w + 1.6, y + h + 1.2), (x - 0.4, y + h + 1.2)], FINE)


def house(p, x, base, w, h, dep, roof=7.0, wins=2, rows=2, chimney=True, lit=None, cast=True):
    """A house seen front on with its right side receding: the front lit, the side and the far
    roof plane in shadow, a gable with a round vent, windows in rows, a door, a chimney."""
    y = base - h
    dx, dy = dep, -dep * 0.6
    if cast:
        p.ground_shadow(x, base, w, h, dep)
    side = [(x + w, y), (x + w + dx, y + dy), (x + w + dx, base + dy), (x + w, base)]
    p.shape(side)
    p.shade(side, 3, grade=(0.8, 1.3, -1))
    ridge = (x + w / 2, y - roof)
    plane = [ridge, (ridge[0] + dx, ridge[1] + dy), (x + w + 0.8 + dx, y + dy), (x + w + 0.8, y)]
    p.shape(plane)
    p.shade(plane, 2)
    for k in range(1, 4):                                         # tile courses on the far plane
        t = k / 4
        a = (ridge[0] + (x + w + 0.8 - ridge[0]) * t, ridge[1] + (y - ridge[1]) * t)
        p.line([a, (a[0] + dx, a[1] + dy)], FINE)
    front = [(x, base), (x, y), (x - 0.8, y), ridge, (x + w + 0.8, y), (x + w, y), (x + w, base)]
    p.shape(front, BOLD)
    p.line([(x - 0.8, y), (x + w + 0.8, y)], LINE)
    p.shade([(x, y), (x + w, y), (x + w, y + 1.6), (x + 1.4, y + 1.6)], 4)          # the eave's shadow on the wall
    p.arc(ridge[0], y - roof * 0.42, roof * 0.16, 0, 360, FINE)
    if chimney:
        cx = x + w * 0.72
        cy = y - roof * (1 - 0.72) * 2 + roof * 0.1
        ch = [(cx, cy), (cx, cy - 4.5), (cx + 2.4, cy - 4.5), (cx + 2.4, cy)]
        p.shape(ch)
        p.shade([(cx + 1.4, cy), (cx + 1.4, cy - 4.5), (cx + 2.4, cy - 4.5), (cx + 2.4, cy)], 4)
        p.shape([(cx - 0.4, cy - 4.5), (cx + 2.8, cy - 4.5), (cx + 2.8, cy - 5.3), (cx - 0.4, cy - 5.3)], FINE)
    ww, wh = min(3.2, w / (wins * 2.4)), min(4.2, h / (rows * 2.3))
    for r in range(rows):
        for c in range(wins):
            wx = x + w * (c + 0.5) / wins - ww / 2
            wy = y + h * 0.12 + r * (wh + h * 0.14)
            if r == rows - 1 and c == wins // 2 and rows > 1:
                continue
            window(p, wx, wy, ww, wh, shutters=w / wins > 7, lit=(lit == (r, c)))
    dw = min(4.0, w * 0.22)
    door(p, x + w / 2 - dw / 2 if wins % 2 else x + w * 0.5 - dw / 2, base - h * 0.34, dw, h * 0.34 - 1.2)


def rock(p, x, y, r, tone=4):
    pts = [(x + r * math.cos(t) * (1.3 + 0.15 * math.sin(3 * t)), y + r * 0.75 * math.sin(t) * (1 + 0.1 * math.cos(2 * t)))
           for t in (2 * math.pi * i / 16 for i in range(16))]
    p.shape(pts, LINE)
    p.shade([q for q in pts if q[0] > x - r * 0.2 or q[1] > y + r * 0.2], tone)


def tree(p, x, base, h, r):
    """A round tree: trunk shaded on its right, crown as one scalloped mass shaded on its lower
    right with a deeper core, a few marks where it is lit."""
    p.shape([(x - 0.6, base), (x - 0.4, base - h), (x + 0.4, base - h), (x + 0.6, base)], FINE)
    p.shade([(x, base), (x, base - h), (x + 0.4, base - h), (x + 0.6, base)], 4)
    cy = base - h - r * 0.7
    crown = [(x + r * math.cos(t) * (1 + 0.09 * math.sin(7 * t)), cy + r * 0.92 * math.sin(t) * (1 + 0.09 * math.sin(7 * t)))
             for t in (2 * math.pi * i / 40 for i in range(40))]
    p.shape(crown, LINE)
    k = p.k
    hatch(p.d, crescent(p.x + x * k, p.y + cy * k, r * 0.96 * k, 0.5), 3, ang=HATCH_ANG, seed=p._s())
    hatch(p.d, crescent(p.x + (x + r * 0.2) * k, p.y + (cy + r * 0.2) * k, r * 0.62 * k, 0.45), 5, ang=HATCH_ANG, seed=p._s())
    p.scrub(ellipse(x - r * 0.25, cy - r * 0.3, r * 0.4, r * 0.3), 2, r * 0.35)


def birds(p, pts):
    for bx, by, s in pts:
        p.line([(bx - s, by - s * 0.3), (bx - s * 0.4, by - s * 0.55), (bx, by)], FINE)
        p.line([(bx, by), (bx + s * 0.4, by - s * 0.55), (bx + s, by - s * 0.3)], FINE)


def sky(p, top_frac=0.1):
    """The sky is the paper: only what is in it (a sun, a cloud, birds) is drawn."""


def water(p, y0, y1, tone=1, reflect=()):
    """Water: level broken strokes, opening out towards the far shore, and under each thing on
    the shore its reflection, broken verticals as long as the water lets them be."""
    p.fill([(0, y0), (100, y0), (100, y1), (0, y1)])
    y, row = y0 + 2.2, 0                                         # ripples: a few short level strokes a row,
    while y < y1:                                                # the rows closing up into the distance
        for _ in range(3 + row % 2):
            rx = p.rg.uniform(-2, 96)
            L = p.rg.uniform(3, 7)
            p.line([(rx, y), (rx + L * 0.5, y - 0.35), (rx + L, y)], FINE, amp=0.1)
        row += 1
        y += 2.4 + row * 0.55
    for x0, x1, depth in reflect:
        x = x0
        while x < x1:
            L = depth * p.rg.uniform(0.4, 1.0)
            p.line([(x, y0 + 0.8), (x + p.rg.uniform(-0.2, 0.2), y0 + 0.8 + L)], FINE)
            x += p.rg.uniform(1.0, 1.8)


def cloud(p, cx, cy, w):
    """A cumulus: puffs along its top, a flat base, its underside shaded."""
    puffs = [(-0.75, 0.0, 0.3), (-0.35, -0.3, 0.42), (0.15, -0.38, 0.48), (0.6, -0.12, 0.34), (0.9, 0.08, 0.22)]
    top = []
    for fx, fy, fr in puffs:
        top += [(cx + w * fx + w * fr * math.cos(math.radians(a)), cy + w * fy + w * fr * math.sin(math.radians(a)))
                for a in range(200, 341, 20)]
    pts = [(cx - w * 1.05, cy + w * 0.2)] + top + [(cx + w * 1.1, cy + w * 0.2)]
    p.shape(pts, FINE)
    p.shade([(cx - w * 0.9, cy + w * 0.02), (cx + w * 1.0, cy + w * 0.02), (cx + w * 1.05, cy + w * 0.2), (cx - w * 1.0, cy + w * 0.2)], 2)


def crescent_grid(cx, cy, r):
    return [(cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a))) for a in range(-40, 141, 20)]


# ---------------------------------------------------------------- the scenes

def lighthouse(p):
    H = p.H
    sky(p)
    birds(p, [(70, 18, 2.6), (78, 24, 2.0), (63, 26, 1.6)])
    sea = H * 0.74
    water(p, sea, H)
    p.line([(0, sea), (100, sea)], FINE)
    # the headland: a grass top over a cliff of stacked rock ledges, each lit on its top and
    # shaded on its face, the faces deepening towards the water
    top = sea - 12
    cliff = [(-2, H), (-2, top + 1), (10, top - 1), (34, top - 1.5), (60, top - 0.5), (70, top + 3), (74, sea + 2), (78, H)]
    p.shape(cliff, BOLD)
    ledges, ly, i = [], top + 4, 0
    while ly < H + 6:
        ledges.append((ly, 72 + min(6, i * 1.5)))
        ly += 4.5 + i * 1.2
        i += 1
    prev = top + 1
    for i, (ly, lx) in enumerate(ledges):
        band = min(ly - prev - 1.2, 2.6 + i * 0.4)
        face = [(-2, prev + 1.2), (lx - 2, prev + 1.2), (lx - 2 + band * 0.3, prev + 1.2 + band), (-2, prev + 1.2 + band)]
        p.shade(face, 3, feather=0.7, towards=(0.15, 1))                 # shadow only under each ledge, fading down
        p.line([(-2, ly), (lx, ly)], FINE)
        for k in range(5):
            cx = 6 + k * 14 + (i % 2) * 7
            p.line([(cx, prev + 1.2), (cx + 1, ly)], FINE)
        prev = ly
    rock(p, 82, sea + 6, 4)
    rock(p, 91, sea + 12, 2.8)
    for wx in (77, 88, 96):                                       # surf curling at the foot of the rocks
        p.arc(wx, sea + 4, 2.2, 180, 330, FINE)
    for gx in range(2, 70, 3):                                     # grass on the top, standing up in front
        g = p.rg.uniform(1.2, 2.6)
        p.line([(gx, top + 1.5), (gx + p.rg.uniform(-0.6, 0.6), top + 1.5 - g)], FINE)
    house(p, 50, top, 15, 9, 3.5, roof=5, wins=1, rows=1, chimney=True)
    # the tower: tapering, two dark bands, a door and windows, light from the left
    b0, b1, t0, t1, ty = 22, 42, 26, 38, H * 0.17
    tower = [(b0, top), (t0, ty), (t1, ty), (b1, top)]
    p.shape(tower, BOLD)
    p.shade([(32 + (b1 - 32) * 0.15, top), (32 + (t1 - 32) * 0.15, ty), (t1, ty), (b1, top)], 2, ang=-84, curve=0.03,
            grade=(1.3, 0.55, 1), feather=0)
    for f0, f1 in ((0.22, 0.34), (0.55, 0.67)):
        ya, yb = ty + (top - ty) * f0, ty + (top - ty) * f1
        xa0, xa1 = t0 + (b0 - t0) * f0, t1 + (b1 - t1) * f0
        xb0, xb1 = t0 + (b0 - t0) * f1, t1 + (b1 - t1) * f1
        sag = 0.9
        band = [(xa0, ya)] + [(xa0 + (xa1 - xa0) * t, ya + sag * 4 * t * (1 - t)) for t in (0.25, 0.5, 0.75)] + [(xa1, ya), (xb1, yb)] + \
               [(xb0 + (xb1 - xb0) * t, yb + sag * 4 * t * (1 - t)) for t in (0.75, 0.5, 0.25)] + [(xb0, yb)]
        p.shade(band, 3, ang=-84, curve=0.03, grade=(1.3, 0.6, 1), feather=0)
        p.line(band[:5], LINE)
        p.line(band[5:10], LINE)
    door(p, 29.5, top - 8, 5, 8)
    for wy in (0.4, 0.78):
        window(p, 30.8, ty + (top - ty) * wy - 2.6, 2.4, 3.4, shutters=False)
    # the gallery, its railing, the lantern with its light, the dome and the vane
    gy = ty
    p.shape([(t0 - 3, gy), (t1 + 3, gy), (t1 + 2, gy + 1.6), (t0 - 2, gy + 1.6)], LINE)
    p.shade([(t0 - 2, gy + 1.6), (t1 + 2, gy + 1.6), (t1, gy + 3.2), (t0, gy + 3.2)], 4)
    p.line([(t0 - 3, gy - 4), (t1 + 3, gy - 4)], LINE)
    for rx in range(int(t0 - 3), int(t1 + 4), 2):
        p.line([(rx, gy), (rx, gy - 4)], FINE)
    lw0, lw1, ly0, ly1 = t0 + 1.5, t1 - 1.5, gy - 11, gy
    mid = (lw0 + lw1) / 2
    p.shape([(lw0, ly1), (lw0, ly0), (lw1, ly0), (lw1, ly1)], LINE)
    p.shape([(lw0 + 2.4, ly1 - 2), (lw0 + 2.4, ly0 + 2), (lw1 - 2.4, ly0 + 2), (lw1 - 2.4, ly1 - 2)], FINE, "signal")
    for mx in (lw0 + 2.4, mid, lw1 - 2.4):
        p.line([(mx, ly0), (mx, ly1)], FINE)
    dome = [(lw0 - 1, ly0)] + [(mid + (lw1 - lw0 + 2) / 2 * math.cos(math.radians(a)), ly0 - 5 * math.sin(math.radians(a)))
                               for a in range(180, -1, -15)]
    p.shape(dome, LINE)
    p.shade([q for q in dome if q[0] >= mid - 1] + [(mid - 1, ly0)], 3, ang=-80, curve=-0.12, feather=0)
    p.line([(mid, ly0 - 5), (mid, ly0 - 9)], LINE)
    p.arc(mid, ly0 - 5.8, 0.8, 0, 360, FINE)
    p.line([(mid, ly0 - 8.5), (mid + 3, ly0 - 7.6)], FINE)


def harbour(p):
    H = p.H
    sky(p)
    p.arc(58, 13, 4.2, 0, 360, FINE)
    for a in range(0, 360, 30):
        r = math.radians(a)
        p.line([(58 + 5.6 * math.cos(r), 13 + 5.6 * math.sin(r)), (58 + 7.2 * math.cos(r), 13 + 7.2 * math.sin(r))], FINE)
    birds(p, [(30, 12, 2.2), (37, 17, 1.6)])
    hills = [(-2, 42), (14, 35), (30, 39), (46, 33), (62, 38), (80, 34), (102, 40), (102, 50), (-2, 50)]
    p.shape(hills, FINE)
    quay_top, quay = H * 0.62, H * 0.72
    water(p, quay, H, reflect=[(3, 74, 9), (76, 88, 12)])
    # the church behind the row: a tower with its spire, clock and louvres
    cx = 76
    p.shape([(cx, quay_top), (cx, 28), (cx + 9, 28), (cx + 9, quay_top)], BOLD)
    side = [(cx + 9, quay_top), (cx + 9, 28), (cx + 12, 26), (cx + 12, quay_top - 2)]
    p.shape(side)
    p.shade(side, 3)
    p.shape([(cx - 0.8, 28), (cx + 4.5, 8), (cx + 9.8, 28)], BOLD)
    p.shade([(cx + 4.5, 8), (cx + 9.8, 28), (cx + 5.6, 28)], 3)
    p.line([(cx + 4.5, 8), (cx + 4.5, 4)], LINE)
    p.line([(cx + 3.2, 5.4), (cx + 5.8, 5.4)], LINE)
    p.arc(cx + 4.5, 33, 2.2, 0, 360, LINE)
    p.line([(cx + 4.5, 33), (cx + 4.5, 31.4)], FINE)
    p.line([(cx + 4.5, 33), (cx + 5.6, 33.6)], FINE)
    for lx in (cx + 2.2, cx + 5.2):
        louvre = [(lx, 38), (lx + 1.8, 38), (lx + 1.8, 43), (lx, 43)]
        p.shape(louvre, FINE)
        p.shade(louvre, 5)
    # the row of houses on the quay
    row = [(3, 14, 22, 2, 2), (19, 11, 27, 1, 3), (32, 15, 19, 2, 2), (49, 12, 24, 2, 2), (63, 11, 17, 1, 2)]
    for i, (x, w, h, wins, rows) in enumerate(row):
        house(p, x, quay_top, w, h, 2.6, roof=5.5 + (i % 2) * 2, wins=wins, rows=rows, chimney=i % 2 == 0,
              lit=(0, 0) if i == 3 else None)
    # the quay wall: a top edge, coursed stone and bollards
    p.shape([(-2, quay_top), (102, quay_top), (102, quay), (-2, quay)], BOLD)
    course = quay_top + 2.4 + (quay - quay_top - 2.4) / 2
    p.shade([(-2, quay_top + 2.4), (102, quay_top + 2.4), (102, quay_top + 4.4), (-2, quay_top + 4.4)], 3, feather=0.6, towards=(0, 1))
    p.line([(-2, quay_top + 2.4), (102, quay_top + 2.4)], FINE)
    p.line([(-2, course), (102, course)], FINE)
    for k in range(14):
        xx = k * 7.4 + (3.7 if k % 2 else 0)
        p.line([(xx, quay_top + 2.4), (xx, course)], FINE)
        p.line([(xx + 3.7, course), (xx + 3.7, quay)], FINE)
    for bx in (24, 44):
        p.shape([(bx, quay_top), (bx, quay_top - 2.6), (bx + 1.8, quay_top - 2.6), (bx + 1.8, quay_top)], LINE)
        p.shade([(bx + 0.9, quay_top), (bx + 0.9, quay_top - 2.6), (bx + 1.8, quay_top - 2.6), (bx + 1.8, quay_top)], 4)
    # a boat at the quay: hull and planking, a cabin, the mast and a furled sail, its reflection
    by = quay + 5.5
    p.shape([(20, by - 3.6), (46, by - 3.6), (43, by + 0.4), (24, by + 0.4)], BOLD)
    p.shade([(20, by - 1.6), (46, by - 1.6), (43, by + 0.4), (24, by + 0.4)], 4)
    p.line([(21, by - 2.6), (45.4, by - 2.6)], FINE)
    p.shape([(30, by - 3.6), (30, by - 7), (37, by - 7), (37, by - 3.6)], LINE)
    p.shade([(34.5, by - 3.6), (34.5, by - 7), (37, by - 7), (37, by - 3.6)], 3)
    window(p, 31, by - 6.2, 2, 1.8, shutters=False)
    p.line([(26, by - 3.6), (26, by - 22)], LINE)
    p.shape([(26.4, by - 21), (26.4, by - 5), (31, by - 5)], FINE)
    p.shade([(26.4, by - 14), (26.4, by - 5), (31, by - 5)], 2)
    p.line([(26, by - 22), (44, by - 3.6)], FINE)
    p.fill([(21, by + 0.6), (46, by + 0.6), (46, by + 6), (21, by + 6)])
    p.shade([(23, by + 0.8), (44, by + 0.8), (42, by + 4), (25, by + 4)], 4, ang=0, dash=(1, 4, 1.2))


def windmill(p):
    H = p.H
    sky(p, 0.18)
    cloud(p, 16, 21, 12)
    birds(p, [(80, 16, 2.2), (87, 21, 1.6)])
    hill = H * 0.73
    hz = H * 0.62
    p.line([(0, hz), (100, hz)], FINE)
    for k in range(9):
        p.line([(k * 12.5 - 10, H), (40 + k * 2.6, hz)], FINE)

    # the mill: a tapering tower, boarded, light from the left, its door and two windows
    b0, b1, t0, t1, ty = 34, 66, 40, 60, H * 0.38
    p.shape([(b0, hill), (t0, ty), (t1, ty), (b1, hill)], BOLD)
    p.shade([(50 + (b1 - 50) * 0.2, hill), (50 + (t1 - 50) * 0.2, ty), (t1, ty), (b1, hill)], 3, ang=-82, curve=0.02,
            grade=(1.3, 0.55, 1), feather=0)
    for f in (0.2, 0.4, 0.6, 0.8):
        y = ty + (hill - ty) * f
        p.line([(t0 + (b0 - t0) * f, y), (t1 + (b1 - t1) * f, y)], FINE)
    door(p, 46, hill - 12, 7, 12)
    window(p, 47.6, ty + 7, 3.6, 4.4, shutters=False, lit=True)
    window(p, 44, ty + 21, 3, 3.6, shutters=False)
    # the cap and the stage around the tower
    cap = [(t0 - 2.4, ty)] + [(50 + 12.4 * math.cos(math.radians(a)), ty - 8 * math.sin(math.radians(a))) for a in range(180, -1, -15)]
    p.shape(cap, BOLD)
    p.shade([q for q in cap if q[0] >= 50] + [(50, ty)], 3, ang=-75, curve=-0.12, grade=(1.3, 0.6, 1), feather=0)
    for k in range(-4, 5, 2):
        p.line([(50 + k * 2.6, ty), (50 + k * 1.6, ty - 6.6)], FINE)
    sy = ty + (hill - ty) * 0.46
    sx0, sx1 = t0 + (b0 - t0) * 0.46 - 5, t1 + (b1 - t1) * 0.46 + 5
    p.shape([(sx0, sy), (sx1, sy), (sx1, sy + 1.4), (sx0, sy + 1.4)], LINE)
    p.line([(sx0, sy - 3.6), (sx1, sy - 3.6)], FINE)
    for rx in range(int(sx0), int(sx1) + 1, 2):
        p.line([(rx, sy), (rx, sy - 3.6)], FINE)
    # the sails: four lattice blades on two stocks, turned a little, in front of the cap
    hx, hy = 50, ty - 4
    for i, a in enumerate((20, 110, 200, 290)):
        r = math.radians(a)
        ux, uy, nx, ny = math.cos(r), math.sin(r), -math.sin(r), math.cos(r)
        L, s0, wb = 34, 6, 5.2
        p.line([(hx, hy), (hx + ux * L, hy + uy * L)], LINE)
        blade = [(hx + ux * s0, hy + uy * s0), (hx + ux * L, hy + uy * L), (hx + ux * L + nx * wb, hy + uy * L + ny * wb),
                 (hx + ux * s0 + nx * wb, hy + uy * s0 + ny * wb)]
        p.shape(blade, LINE)
        for k in range(1, 9):
            t = s0 + (L - s0) * k / 9
            p.line([(hx + ux * t, hy + uy * t), (hx + ux * t + nx * wb, hy + uy * t + ny * wb)], FINE)
        p.line([(hx + ux * s0 + nx * wb / 2, hy + uy * s0 + ny * wb / 2), (hx + ux * L + nx * wb / 2, hy + uy * L + ny * wb / 2)], FINE)
        if i % 2:
            p.shade(blade, 2)
    p.arc(hx, hy, 2.2, 0, 360, BOLD)
    p.shade(crescent_grid(hx, hy, 2.2), 4)
    # the hill in front: a rising meadow, a fence, a path to the door, a cottage and trees
    ground = [(-2, hill + 4), (30, hill - 1), (70, hill - 1), (102, hill + 3), (102, H), (-2, H)]
    p.shape(ground, LINE)
    for k in range(26):                                          # tufts, few far up the hill, more near
        ty_ = hill + 6 + (H - hill - 6) * (k / 26) ** 0.7
        tx = p.rg.uniform(0, 98)
        if not 38 < tx < 64:
            for j in (-0.8, 0, 0.8):
                p.line([(tx + j, ty_), (tx + j * 1.6, ty_ - 1.6 - abs(j))], FINE, amp=0.05)
    path = [(47, hill - 0.4), (53, hill - 0.4), (64, H), (40, H)]
    p.fill(path)
    p.line([path[1], path[2]], FINE)
    p.line([path[0], path[3]], FINE)
    for k in range(9):
        fx = 4 + k * 4.2
        p.line([(fx, hill + 8 - k * 0.5), (fx, hill + 4 - k * 0.5)], LINE)
    p.line([(4, hill + 6), (37.6, hill + 2)], FINE)
    p.line([(4, hill + 7.4), (37.6, hill + 3.4)], FINE)
    p.fill(path)
    p.line([path[1], path[2]], FINE)
    p.line([path[0], path[3]], FINE)
    house(p, 70, hill + 6, 14, 9, 3, roof=5, wins=1, rows=1, chimney=True)
    tree(p, 12, hill + 5, 7, 6.5)
    tree(p, 92, hill + 4, 5, 4.6)
    for gx in range(2, 100, 6):
        g = p.rg.uniform(1.4, 3)
        y0 = H - p.rg.uniform(1, 6)
        p.line([(gx, y0), (gx + p.rg.uniform(-0.8, 0.8), y0 - g)], FINE)


SCENES = {"lighthouse": lighthouse, "harbour": harbour, "windmill": windmill}
# Where each scene's distance and its foreground lie, as boxes (x0, y0, x1, y1) in fractions of the
# picture, for the depth check (P11): the distance must stay closer to the paper than the
# foreground, so the eye reads near over far.
BANDS = {
    "lighthouse": ((0.55, 0.25, 1.0, 0.6), (0.0, 0.76, 0.75, 1.0)),
    "harbour": ((0.0, 0.05, 1.0, 0.4), (0.0, 0.68, 1.0, 0.86)),
    "windmill": ((0.0, 0.55, 0.3, 0.68), (0.0, 0.7, 1.0, 0.86)),
}


def pen_picture(d, px0, py0, pw, ph, scene="harbour", seed=0):
    _PIC[0] += 1
    pid = f"pn{_PIC[0]}"
    d.o.append(f'<clipPath id="{pid}c"><rect x="{px0}" y="{py0}" width="{pw}" height="{ph}"/></clipPath>')
    d.rect(px0, py0, pw, ph, "paper", None)
    far, near = (",".join(f"{v:g}" for v in box) for box in BANDS[scene])
    d.o.append(f'<g clip-path="url(#{pid}c)" data-picture="{pid}" data-hand="free" data-far="{far}" data-near="{near}">')
    SCENES[scene](Pic(d, px0, py0, pw, ph, seed))
    d.o.append('</g>')
    d.rect(px0, py0, pw, ph, "none", "ink", 0.6)
