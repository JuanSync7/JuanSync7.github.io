"""Scenes for the juansync.dev writing archive, built from the two kernels.

python3 -m kernel.scenes OUT_DIR  -> shelf-unit-{light,dark}.svg, table-{light,dark}.svg, glow-dark.svg
"""
import sys
from .primitives import D, SW
from .penwash import LIGHT, DARK, wrap, scaled, raised_panel, sconce, crest, flame, archive_box, bookend, book_stack, SHADOW
from .graphite import pencil_picture

ROWS_TOP = [58, 228, 386, 544]
BOARDS = [214, 372, 530, 688]
UW, SX, SWID = 760, 120, 520          # unit width, shelf left, shelf width
HALF = 120
RUN_INSET = 32                        # a shelf's standing room starts this far in from its sides
PLAQUE = (SX + SWID // 2 - 75, 34, 150, 20)
WALL_SCONCE = (150, 1.35)             # the bay sconces: height and scale
DESK_W, DESK_H, DESK_TOP, DESK_SPOT = 1440, 640, 458, 720
DESK_SCONCES = ((440, 1000), 190, 1.25)


def etching2(d, c, top, w, h, seed=3):
    """A detailed pen-and-ink landscape in an ornate frame: graded sky, clouds, layered
    mountains with snow, a pine treeline mirrored in a lake, a cabin, a shaded oak and grass."""
    import math, random
    rg = random.Random(seed)
    x0, x1, y0, y1 = c - w / 2, c + w / 2, top, top + h
    # ---- frame
    d.o.append(f'<g transform="translate(4 4)"><rect x="{x0}" y="{y0}" width="{w}" height="{h}" fill="url(#hatch2)"/></g>')
    d.rect(x0, y0, w, h, "b", "ink", 1.3)
    d.rect(x0 + 5, y0 + 5, w - 10, h - 10, "a", "ink", 0.9)
    d.rect(x0 + 9, y0 + 9, w - 18, h - 18, "none", "muted", 0.7)
    d.rect(x0 + w - 14, y0 + 6, 8, h - 12, "url(#hatch)", None)
    d.rect(x0 + 6, y0 + h - 14, w - 12, 8, "url(#hatch)", None)
    for (cx_, cy_, sx, sy) in ((x0 + 9, y0 + 9, 1, 1), (x1 - 9, y0 + 9, -1, 1), (x0 + 9, y1 - 9, 1, -1), (x1 - 9, y1 - 9, -1, -1)):
        d.path(f"M{cx_},{cy_ + sy * 14} q0,{-sy * 14} {sx * 14},{-sy * 14} q-{sx * 2},{sy * 8} {-sx * 4},{sy * 6} q{sx * 6},{-sy * 2} {sx * 2},{sy * 6}",
               "none", "ink", 0.9)
    d.path(f"M{c - 16},{y0} q16,-22 32,0Z", "a", "ink", 1)
    for k in range(-2, 3):
        d.line([(c, y0 - 2), (c + k * 6, y0 - 12 + abs(k) * 2)], "muted", 0.6)
    d.rect(c - 24, y1 + 8, 48, 10, "b", "ink", 0.9)
    d.line([(c - 16, y1 + 13), (c + 16, y1 + 13)], "muted", 0.6)
    # ---- the picture: a graphite drawing
    pencil_picture(d, x0 + 14, y0 + 14, w - 28, h - 28, seed)


def divider(d, c, P):
    """The wall bay between two shelves, 240 wide: sconce, crest, framed etching."""
    L, R = c - HALF + 4, c + HALF - 4
    d.rect(L, 72, R - L, 616, "a", "ink", 1.1)
    d.rect(L + 6, 78, R - L - 12, 604, "none", "muted", 0.8)
    d.rect(R - 10, 84, 6, 592, "url(#hatch)", None)
    # capital and base blocks with shadows
    d.rect(L, 72, R - L, 12, "b", "ink", 1)
    d.line([(L, 78), (R, 78)], "muted", 0.8)
    d.rect(L + 6, 84, R - L - 12, 4, "url(#hatch2)", None)
    d.rect(L, 676, R - L, 12, "b", "ink", 1)
    d.rect(L + 6, 672, R - L - 12, 4, "url(#hatch2)", None)
    sy, sk = WALL_SCONCE
    scaled(d, c, sy, sk, lambda: sconce(d, c, sy, P, lit=False))
    scaled(d, c, 290, 1.4, lambda: crest(d, c, 290, P))
    # moulded band with small dentils
    d.line([(L + 6, 372), (R - 6, 372)], "ink", 1)
    d.line([(L + 6, 376), (R - 6, 376)], "muted", 0.8)
    d.rect(L + 6, 377, R - L - 12, 3, "url(#hatch2)", None)
    raised_panel(d, c - 82, 400, 164, 252, t=6)


def unit(P):
    """One 760-wide carousel unit: shelf at x 120-640, half a wall bay at each edge.
    Units tile side by side into one continuous built-in wall with no seams."""
    d = D(P)
    x0, xr = SX, SX + SWID
    iw = SWID - 56                       # interior width
    d.rect(-1, 58, UW + 2, 644, "b", None)
    for c in (0, UW):
        divider(d, c, P)
    # ---- the shelf
    d.rect(x0 + 28, 58, iw, 630, "c", None)
    for x in range(x0 + 28 + 58, xr - 28, 58):
        d.line([(x, 58), (x, 688)], "deep", 1)
        d.line([(x + 2, 58), (x + 2, 688)], "deep", 0.6)
    import random as _r
    rg = _r.Random(5)
    for x in range(x0 + 28, xr - 28, 58):
        for k in range(2):
            gx = x + 14 + k * 20 + rg.randint(-3, 3)
            d.path(f"M{gx},62 c3,60 -3,120 0,180 c3,60 -3,120 0,180 c2,60 -2,140 0,200", "none", "deep", 0.6)
    for rt in ROWS_TOP:
        rh = 156 if rt != 544 else 144
        d.rect(x0 + 28, rt, iw, 48, "url(#aoTop)", None)
        d.rect(x0 + 28, rt, 30, rh, "url(#aoLeft)", None)
        d.rect(xr - 52, rt, 24, rh, "url(#cylR)", None, op=0.6)
        d.rect(x0 + 28, rt, iw, 12 if rt == 58 else 14, "url(#hatch)", None)
        d.rect(x0 + 28, rt, iw, 5, "url(#hatch2)", None)
        d.rect(x0 + 28, rt, 8, rh, "url(#hatch)", None)
        d.rect(x0 + 28, rt, 8, 30, "url(#hatch2)", None)
    for bt in BOARDS:
        d.rect(x0 + 24, bt, iw + 8, 14, "a")
        d.line([(x0 + 24, bt + 4), (xr - 24, bt + 4)], "ink", 0.8)
        d.rect(x0 + 24, bt + 5, iw + 8, 9, "url(#under)", None)
        d.rect(x0 + 24, bt + 10, iw + 8, 4, "url(#hatch)", None)
        for gx, gl in ((60, 40), (150, 26), (232, 52), (318, 30), (410, 44)):
            d.path(f"M{x0 + gx},{bt + 9} q{gl / 2},-2 {gl},0", "none", "muted", 0.7)
    d.rect(x0 + 28, 58, iw, 630, "none")
    for px in (x0, xr - 28):
        d.rect(px, 58, 28, 644, "a")
        d.rect(px - 3, 58, 34, 14, "a")
        d.line([(px - 3, 66), (px + 31, 66)], "ink", 0.8)
        d.rect(px - 3, 676, 34, 26, "a")
        d.line([(px - 3, 682), (px + 31, 682)], "ink", 0.8)
        d.line([(px - 3, 690), (px + 31, 690)], "ink", 0.8)
        for fx in (7, 14, 21):
            x = px + fx
            d.path(f"M{x - 1.5},88 v574 a1.5,1.5 0 0 0 3,0 v-574 a1.5,1.5 0 0 0 -3,0Z", "c", "ink", 0.8)
        d.rect(px, 72, 28, 604, "url(#cylR)", None)
        for fx in (7, 14, 21):
            d.line([(px + fx + 1, 90), (px + fx + 1, 660)], "hatch2", 0.7)
        d.rect(px + 22, 72, 6, 604, "url(#hatch)", None)
        d.rect(px, 72, 28, 4, "url(#hatch2)", None)
    d.rect(xr, 72, 4, 604, "url(#hatch2)", None)
    d.rect(HALF - 4, 72, 4, 604, "url(#hatch2)", None)
    # ---- continuous crown
    def band(y0, h, fill):
        d.rect(-1, y0, UW + 2, h, fill, None)
        d.line([(-1, y0), (UW + 1, y0)], "ink", SW)
        d.line([(-1, y0 + h), (UW + 1, y0 + h)], "ink", SW)
    band(0, 8, "a")
    band(8, 10, "b")
    d.path(f"M-1,13 C190,17 570,17 {UW + 1},13", "none", "muted", 0.8)
    band(18, 12, "a")
    for x in range(0, UW, 8):
        d.rect(x + 1, 20, 5, 8, "b", "ink", 0.7)
        d.line([(x + 5.5, 21), (x + 5.5, 28)], "hatch2", 0.7)
    band(30, 28, "b")
    d.rect(-1, 31, UW + 2, 4, "url(#hatch2)", None)
    d.rect(-1, 19, UW + 2, 1.5, "deep", None)
    for c in (0, UW):
        d.circle(c, 44, 8, "a", "ink", 1)
        d.circle(c, 44, 3.5, "c", "ink", 0.8)
        for k in (-1, 1):
            d.path(f"M{c + k * 14},44 q{k * 10},-8 {k * 22},0 q{k * 10},8 {k * 22},0", "none", "muted", 0.8)
    pl = PLAQUE[0]
    for (la, lb) in ((x0 + 24, pl - 12), (pl + 162, xr - 24)):
        d.line([(la, 38), (lb, 38)], "muted", 0.8)
        d.line([(la, 50), (lb, 50)], "muted", 0.8)
    d.rect(pl, PLAQUE[1], PLAQUE[2], PLAQUE[3], "paper", "ink", 1)
    d.rect(pl + 3, 37, 144, 14, "none", "muted", 0.7)
    # ---- continuous plinth
    band(702, 50, "b")
    d.line([(-1, 708), (UW + 1, 708)], "ink", 0.8)
    d.line([(-1, 712), (UW + 1, 712)], "muted", 0.8)
    d.rect(-1, 713, UW + 2, 4, "url(#hatch)", None)
    pw = (SWID - 48) / 2
    for px0 in (x0 + 16, x0 + 32 + pw):
        d.rect(px0, 720, pw, 24, "a", "ink", 1)
        d.rect(px0 + 5, 724, pw - 10, 16, "none", "muted", 0.8)
        d.rect(px0 + 5.5, 724.5, pw - 11, 3, "url(#hatch2)", None)
    for c in (0, UW):
        d.rect(c - 96, 720, 192, 24, "a", "ink", 1)
        d.rect(c - 91, 724, 182, 16, "none", "muted", 0.8)
        d.rect(c - 90.5, 724.5, 181, 3, "url(#hatch2)", None)
    band(752, 8, "a")
    return d.o


def glow():
    out = []
    for rt in ROWS_TOP:
        out.append(f'<rect x="68" y="{rt}" width="344" height="120" fill="url(#led)"/>')
    return out


def table(P):
    d = D(P)
    # damask wallpaper with three detailed etchings above the desk
    d.rect(60, 0, 1320, 286, "url(#damask)", None, op=0.9)
    etching2(d, 230, 40, 150, 200, seed=7)
    etching2(d, 720, 30, 250, 210, seed=11)
    d.o.append('<g transform="translate(2420 0) scale(-1 1)">')
    etching2(d, 1210, 40, 150, 200, seed=5)
    d.o.append('</g>')
    xs, sy, sk = DESK_SCONCES
    for wx in xs:
        scaled(d, wx, sy, sk, lambda wx=wx: sconce(d, wx, sy, P, lit=False))
    # wainscot on the wall behind
    d.rect(60, 286, 1320, 10, "b", "ink", 1)
    for x in range(64, 1376, 8):
        d.rect(x, 288, 5, 6, "a", "ink", 0.6)
    d.rect(60, 296, 1320, 3, "url(#hatch2)", None)
    d.line([(60, 300), (1380, 300)], "ink", 1)
    d.line([(60, 306), (1380, 306)], "muted", 0.8)
    d.rect(60, 307, 1320, 4, "url(#hatch2)", None)
    for x in range(80, 1360, 160):
        d.rect(x, 330, 140, 250, "none", "muted", 0.8)
        d.rect(x + 8, 338, 124, 234, "none", "muted", 0.6)
        d.rect(x + 132, 338, 8, 242, "url(#hatch)", None)
        d.rect(x + 8, 572, 124, 8, "url(#hatch)", None)
    d.rect(60, 596, 1320, 24, "b")                 # skirting
    d.line([(60, 602), (1380, 602)], "muted", 0.8)
    d.line([(40, 620), (1400, 620)], "ink", 1)      # floor
    # floorboards
    for x in range(40, 1400, 110):
        d.line([(x, 620), (x - 18, 640)], "muted", 0.7)
    d.rect(360, 597, 800, 22, "url(#hatch)", None)
    d.poly([(350, 621), (1140, 621), (1160, 632), (370, 632)], "url(#hatch2)", None)
    # ---- reading table
    for lx in (330, 1086):
        x = lx
        d.rect(x, 510, 24, 110, "a")
        for by in (530, 560, 590):
            d.rect(x - 3, by, 30, 6, "b", "ink", 0.9)
        d.path(f"M{x + 3},538 q9,10 0,20 M{x + 21},538 q-9,10 0,20", "none", "muted", 0.7)
        d.rect(x + 4, 604, 16, 16, "b")
        d.rect(x + 17, 511, 6, 108, "url(#hatch)", None)
        for by in (530, 560, 590):
            d.rect(x + 20, by + 1, 6, 4, "url(#hatch2)", None)
    d.rect(354, 584, 732, 10, "b")                 # stretcher
    d.rect(355, 590, 730, 4, "url(#hatch)", None)
    d.rect(300, 476, 840, 34, "b")                 # apron
    d.line([(300, 506), (1140, 506)], "muted", 0.8)                 # apron bead
    for (x0, w) in ((330, 240), (870, 240)):
        d.rect(x0, 482, w, 22, "a", "ink", 1)
        d.rect(x0 + 4, 485, w - 8, 16, "none", "muted", 0.7)
        d.rect(x0 + 1, 483, w - 2, 3, "url(#hatch2)", None)
        cxp = x0 + w / 2                                              # brass bail pull
        d.rect(cxp - 14, 488, 28, 6, "b", "ink", 0.9)
        d.circle(cxp - 10, 491, 1.5, "ink", None)
        d.circle(cxp + 10, 491, 1.5, "ink", None)
        d.path(f"M{cxp - 10},492 q10,12 20,0", "none", "ink", 1.2)
        d.rect(cxp - 6, 484.5, 12, 3, "paper", "ink", 0.6)              # label holder
    d.rect(620, 482, 200, 22, "b", "ink", 0.9)                          # centre panel with carved rosette
    d.circle(720, 493, 6, "a", "ink", 0.9)
    for k in range(6):
        import math
        a = k * math.pi / 3
        d.line([(720 + 2.5 * math.cos(a), 493 + 2.5 * math.sin(a)), (720 + 6 * math.cos(a), 493 + 6 * math.sin(a))], "ink", 0.7)
    for (ax, sg) in ((354, 1), (1086, -1)):                             # scroll brackets
        d.path(f"M{ax},510 q{sg * 22},0 {sg * 22},14 q0,-6 {-sg * 8},-6 q{-sg * 6},0 {-sg * 6},4", "a", "ink", 1)
    d.rect(290, DESK_TOP, 860, 18, "a")            # top
    d.line([(290, 464), (1150, 464)], "ink", 0.8)
    d.rect(300, 477, 840, 4, "url(#hatch2)", None)
    for gx, gl in ((320, 60), (600, 80), (900, 50), (1060, 70)):
        d.path(f"M{gx},{471} q{gl / 2},-2 {gl},0", "none", "muted", 0.7)
    # ---- on the table: binder stack, pen, mug (left)
    for i, (dx, w) in enumerate(((0, 120), (6, 110), (-4, 116))):
        y = DESK_TOP - (i + 1) * 16
        d.rect(318 + dx, y, w, 16, ["a", "b", "a"][i], rx=2)
        d.rect(318 + dx + 14, y + 4, 34, 8, "paper", "ink", 0.8)
        d.rect(318 + dx + w - 8, y + 2, 4, 12, "deep", None)
        d.rect(318 + dx + 1, y + 11, w - 2, 4, "url(#hatch2)", None)
    d.rect(446, 432, 22, 26, "a", rx=3)
    d.path("M468,438 q9,0 9,9 q0,8 -9,8", "none", "ink", 1.1)
    d.line([(480, 455), (540, 449)], "ink", 2)
    d.line([(540, 449), (546, 448.5)], "signal", 2)
    # inkwell with quill, and a letter rack
    d.rect(822, 444, 24, 14, "a", "ink", 1, rx=3)
    d.rect(828, 438, 12, 6, "b", "ink", 0.9)
    d.rect(824, 452, 20, 4, "url(#hatch2)", None)
    d.path("M836,438 C850,410 866,392 880,378 C872,396 862,414 838,440Z", "paper", "ink", 0.9)
    for k in range(5):
        d.line([(842 + k * 7, 430 - k * 10), (848 + k * 7, 424 - k * 10)], "muted", 0.6)
    d.rect(900, 446, 64, 12, "b", "ink", 1)
    for k, h in enumerate((30, 24, 34)):
        d.rect(906 + k * 18, DESK_TOP - 12 - h, 14, h, "paper", "ink", 0.8)
        d.line([(909 + k * 18, DESK_TOP - 12 - h + 6), (916 + k * 18, DESK_TOP - 12 - h + 6)], "muted", 0.6)
    d.rect(900, 438, 64, 8, "a", "ink", 1)
    # ---- banker's lamp (right)
    d.rect(1048, 448, 64, 10, "a", rx=3)
    d.rect(1077, 404, 6, 44, "b")
    d.path("M1026,404 h108 a54,26 0 0 0 -108,0Z", "a", "ink", 1.25)
    d.path("M1080,382 a50,20 0 0 1 50,20 h-12 a38,14 0 0 0 -38,-14Z", "url(#hatch2)", None)
    d.line([(1030, 404), (1130, 404)], "signal", 2, op=0.9)
    d.rect(1050, 456, 62, 2, "url(#hatch2)", None)
    d.line([(1080, 404), (1080, 420), (1086, 430)], "muted", 0.9)
    return d.o


# Shelf fillers, each its own small plate drawn with no background: (draw, width, height, left
# inset, foot width). The foot is the part that stands on the board; the rest is lid, scroll or shadow.
FILLERS = {
    "library-box": (lambda d: archive_box(d, 2, 76), 96, 76, 0, 92),
    "library-bookend": (lambda d: bookend(d, 3, 78), 31, 78, 3, 24),
    "library-books": (lambda d: book_stack(d, 0, 40), 108, 40, 0, 103),
}


def filler(name, P):
    d = D(P)
    FILLERS[name][0](d)
    return d.o


def anchors():
    """Where things stand on each plate, in the plate's own units, from the constants it is drawn
    with: the site lays its live parts (binders, the paper, live flames) out by these."""
    sy, sk = WALL_SCONCE
    xs, dy, dk = DESK_SCONCES
    wall_flames = [f for c in (0, UW) for g in (-1, 1) for f in [flame(c, sy, sk, g)] if 0 <= f["x"] <= UW]
    return {
        "library-wall": {
            "size": [UW, 760],
            "rows": BOARDS,
            "run": [SX + RUN_INSET, SX + SWID - RUN_INSET],
            "plaque": list(PLAQUE),
            "flames": wall_flames,
        },
        "library-desk": {
            "size": [DESK_W, DESK_H],
            "rest": DESK_TOP - 2,
            "spot": DESK_SPOT,
            "flames": [flame(wx, dy, dk, g) for wx in xs for g in (-1, 1)],
        },
        **{
            name: {"size": [w, h], "foot": [x0, x0 + fw], "shadow": SHADOW}
            for name, (_, w, h, x0, fw) in FILLERS.items()
        },
    }


def build(out):
    for name, P, ch in (("light", LIGHT, False), ("dark", DARK, True)):
        open(f"{out}/shelf-unit-{name}.svg", "w").write(wrap(P, "\n".join(unit(P)), UW, 760, ch))
        open(f"{out}/table-{name}.svg", "w").write(wrap(P, "\n".join(table(P)), DESK_W, DESK_H, ch))
    for name, (_, w, h, _x0, _fw) in FILLERS.items():
        for theme, P, ch in (("light", LIGHT, False), ("dark", DARK, True)):
            open(f"{out}/{name}-{theme}.svg", "w").write(wrap(P, "\n".join(filler(name, P)), w, h, ch))
    open(f"{out}/glow-dark.svg", "w").write(wrap(DARK, "\n".join(glow()), UW, 760, False))


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else ".")
