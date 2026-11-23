"""Graphite pencil kernel: a layered pencil drawing with paper grain.

Layers, in order: tone (gradients through the graphite grain filter) -> eraser highlights ->
soft strokes (graphiteLine) -> core shadows that make edges by value -> foreground objects with
their own tone -> burn/dodge -> vignette. Filters live in penwash.defs.
"""
import math
import random
from .penwash import _CLIP

def _crescent(cx, cy, r, k=0.78):
    """Shadow crescent on the lower right of a round clump (light from the upper left)."""
    import math
    a0, a1 = math.radians(-40), math.radians(140)
    x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
    x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
    ri = r * k
    return (f"M{x0:.1f},{y0:.1f} A{r},{r} 0 0 1 {x1:.1f},{y1:.1f} "
            f"A{ri:.1f},{ri:.1f} 0 0 0 {x0:.1f},{y0:.1f}Z")


def pencil_picture(d, px0, py0, pw, ph, seed=3):
    """A graphite landscape with strong depth: atmospheric perspective (three ranges fading
    and softening with distance, horizon mist), faceted mountains, trees diminishing with
    distance, widening lake ripples, cast shadows, modelled trunk, foliage and cabin, boulders,
    and a dark foreground band. Light comes from the upper left."""
    import math, random
    rg = random.Random(seed)
    INK = d.c("ink")
    PAPER = d.c("paper")
    _CLIP[0] += 1
    p = f"pp{_CLIP[0]}"
    px1, py1 = px0 + pw, py0 + ph
    hz = py0 + ph * 0.52
    dark = d.P.get("theme") == "dark"
    HL, HLop = (INK, 0.55) if dark else ("paper", 1)

    def lg(gid, x1, y1, x2, y2, stops, col=None):
        col = col or INK
        st = "".join(f'<stop offset="{o}" stop-color="{col}" stop-opacity="{a}"/>' for o, a in stops)
        d.o.append(f'<linearGradient id="{p}{gid}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{st}</linearGradient>')

    def rgd(gid, stops, fx, fy, r=0.6):
        st = "".join(f'<stop offset="{o}" stop-color="{INK}" stop-opacity="{a}"/>' for o, a in stops)
        d.o.append(f'<radialGradient id="{p}{gid}" cx="0.5" cy="0.5" r="{r}" fx="{fx}" fy="{fy}">{st}</radialGradient>')

    lg("sky", 0, 0, 0, 1, [(0, 0.46), (0.15, 0.36), (0.32, 0.25), (0.5, 0.16), (0.7, 0.09), (0.86, 0.05), (1, 0.02)])
    lg("xfar", 0, 0, 0, 1, [(0, 0.12), (1, 0.05)])
    lg("far", 0, 0, 0, 1, [(0, 0.24), (1, 0.1)])
    lg("shd", 0, 0, 0, 1, [(0, 0.84), (0.2, 0.74), (0.45, 0.6), (0.7, 0.5), (1, 0.44)])
    lg("mid", 0, 0, 0, 1, [(0, 0.52), (0.3, 0.44), (0.65, 0.35), (1, 0.3)])
    lg("lit", 0, 0, 0, 1, [(0, 0.04), (0.25, 0.08), (0.5, 0.14), (0.75, 0.2), (1, 0.27)])
    lg("lake", 0, 0, 0, 1, [(0, 0.14), (0.18, 0.1), (0.4, 0.17), (0.65, 0.28), (0.85, 0.36), (1, 0.42)])
    lg("hill", 0, 0, 0, 1, [(0, 0.08), (0.2, 0.14), (0.45, 0.26), (0.7, 0.42), (0.88, 0.58), (1, 0.7)])
    lg("treesF", 0, 0, 0, 1, [(0, 0.5), (1, 0.32)])
    lg("trees", 0, 0, 0, 1, [(0, 0.92), (1, 0.66)])
    lg("trunk", 0, 0, 1, 0, [(0, 0.3), (0.15, 0.16), (0.32, 0.12), (0.55, 0.38), (0.78, 0.7), (1, 0.92)])
    lg("cloud", 0, 0, 0, 1, [(0, 0), (0.6, 0.05), (1, 0.3)])
    lg("mist", 0, 0, 0, 1, [(0, 0), (0.55, 0.85), (1, 0)], col=PAPER)          # haze fades towards the paper in both themes
    lg("fore", 0, 0, 0, 1, [(0, 0), (0.35, 0.12), (0.7, 0.42), (1, 0.72)])
    rgd("clump", [(0, 0.02), (0.25, 0.1), (0.5, 0.3), (0.72, 0.55), (0.9, 0.78), (1, 0.86)], 0.3, 0.26)
    rgd("rock", [(0, 0.04), (0.3, 0.16), (0.6, 0.42), (0.85, 0.72), (1, 0.88)], 0.3, 0.25)
    rgd("cast", [(0, 0.66), (0.4, 0.45), (0.75, 0.16), (1, 0)], 0.5, 0.5, 0.5)
    d.o.append(f'<radialGradient id="{p}vig" cx="0.5" cy="0.5" r="0.74"><stop offset="0.66" stop-color="{PAPER}" stop-opacity="0"/>'
               f'<stop offset="1" stop-color="{PAPER}" stop-opacity="0.85"/></radialGradient>')
    d.o.append(f'<pattern id="{p}str" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">'
               f'<line x1="0" y1="0" x2="0" y2="3" stroke="{INK}" stroke-width="0.55" stroke-opacity="0.4"/></pattern>')
    d.o.append(f'<pattern id="{p}str2" width="2.4" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(55)">'
               f'<line x1="0" y1="0" x2="0" y2="3" stroke="{INK}" stroke-width="0.5" stroke-opacity="0.35"/></pattern>')
    rgd("burn", [(0, 0.3), (0.5, 0.16), (1, 0)], 0.5, 0.5, 0.5)
    d.o.append(f'<radialGradient id="{p}dodge" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="{PAPER if not dark else INK}" stop-opacity="0.75"/>'
               f'<stop offset="0.5" stop-color="{PAPER if not dark else INK}" stop-opacity="0.35"/><stop offset="1" stop-color="{PAPER if not dark else INK}" stop-opacity="0"/></radialGradient>')
    d.o.append(f'<clipPath id="{p}c"><rect x="{px0}" y="{py0}" width="{pw}" height="{ph}"/></clipPath>')
    d.rect(px0, py0, pw, ph, "paper", None)
    d.o.append(f'<g clip-path="url(#{p}c)">')

    def P(fx, fy):
        return (px0 + pw * fx, py0 + ph * fy)

    # ---------------- sky and clouds with volume
    d.o.append('<g filter="url(#graphite)">')
    d.rect(px0, py0, pw, hz - py0, f"url(#{p}sky)", None)
    clouds = [(px0 + pw * 0.3, py0 + ph * 0.15, pw * 0.09), (px0 + pw * 0.7, py0 + ph * 0.25, pw * 0.065)]
    for (cx_, cy_, cr) in clouds:
        parts = ((-1.1, 0.25, 0.7), (-0.4, -0.2, 0.98), (0.4, -0.05, 0.85), (1.05, 0.3, 0.6))
        for (dx, dy, k) in parts:
            d.circle(cx_ + dx * cr, cy_ + dy * cr, cr * k, HL, None, op=HLop)
        d.rect(cx_ - cr * 1.7, cy_ + cr * 0.3, cr * 3.4, cr * 0.55, HL, None, op=HLop)
        for (dx, dy, k) in parts:                         # shaded undersides give the clouds body
            d.circle(cx_ + dx * cr, cy_ + dy * cr, cr * k, f"url(#{p}cloud)", None)
    d.o.append('</g>')

    # ---------------- ranges: extreme far (palest, softest), far, near (faceted)
    xfar = [P(-0.02, 0.4), P(0.1, 0.33), P(0.22, 0.37), P(0.36, 0.29), P(0.5, 0.35), P(0.62, 0.3), P(0.8, 0.36), P(1.02, 0.31)]
    d.o.append('<g filter="url(#soft2)">')
    d.poly(xfar + [(px1 + 2, hz), (px0 - 2, hz)], f"url(#{p}xfar)", None)
    d.o.append('</g>')
    far = [(px0 - 2, hz - ph * 0.08), P(0.12, 0.35), P(0.26, 0.4), P(0.42, 0.28), P(0.57, 0.37), P(0.74, 0.26), P(0.88, 0.36), (px1 + 2, hz - ph * 0.2)]
    d.o.append('<g filter="url(#soft1)">')
    d.poly(far + [(px1 + 2, hz), (px0 - 2, hz)], f"url(#{p}far)", None)
    for i in range(len(far) - 1):
        (ax, ay), (bx, by) = far[i], far[i + 1]
        if by > ay:
            d.poly([(ax, ay), (bx, by), (bx, hz), (ax + (bx - ax) * 0.4, hz)], INK, None, op=0.1)
    d.o.append('</g>')
    # horizon mist between the far ranges and the near range
    d.rect(px0, hz - ph * 0.2, pw, ph * 0.18, f"url(#{p}mist)", None, op=0.85)

    near = [(px0 - 2, hz - ph * 0.05), P(0.16, 0.36), P(0.3, 0.42), P(0.5, 0.19), P(0.64, 0.38), P(0.8, 0.31), (px1 + 2, hz - ph * 0.08)]
    d.o.append('<g filter="url(#graphite)">')
    for i in range(len(near) - 1):
        (ax, ay), (bx, by) = near[i], near[i + 1]
        d.poly([(ax, ay), (bx, by), (bx, hz), (ax, hz)], f"url(#{p}shd)" if by > ay else f"url(#{p}lit)", None)
    # edge by value: the shadow plane is darkest right against the lit ridge (core shadow)
    for i in range(len(near) - 1):
        (ax, ay), (bx, by) = near[i], near[i + 1]
        if by > ay:
            ux, uy = bx - ax, by - ay
            ln = (ux * ux + uy * uy) ** 0.5
            nx, ny = -uy / ln * ph * 0.05, ux / ln * ph * 0.05
            d.poly([(ax, ay), (bx, by), (bx + nx, by + ny), (ax + nx, ay + ny)], INK, None, op=0.28)
    # facets: a spur from each main peak down to the base splits light and half-light planes
    for (pk, spur_dx, side) in ((near[3], -0.07, -1), (near[5], 0.04, 1), (near[1], 0.03, 1)):
        (pkx, pky) = pk
        bx = pkx + pw * spur_dx
        d.poly([(pkx, pky), (bx, hz), (pkx + side * pw * 0.11, hz)], f"url(#{p}mid)", None, op=0.55)
    d.o.append('</g>')
    d.o.append('<g filter="url(#graphiteLine)" opacity="0.8">')
    for i in range(len(near) - 1):
        (ax, ay), (bx, by) = near[i], near[i + 1]
        if by > ay:
            d.poly([(ax, ay), (bx, by), (bx, hz), (ax, hz)], f"url(#{p}str)", None)
            for k in range(4):                                  # gullies following the slope
                t = 0.18 + k * 0.2
                gx, gy = ax + (bx - ax) * t, ay + (by - ay) * t
                d.path(f"M{gx:.1f},{gy:.1f} q2.5,{(hz - gy) * 0.4:.1f} 0.5,{(hz - gy) * 0.95:.1f}", "none", INK, 0.7, op=0.45)
        else:
            for k in range(3):                                  # light strata on the sunlit face
                t = 0.3 + k * 0.22
                gx, gy = ax + (bx - ax) * t, ay + (by - ay) * t
                d.path(f"M{gx:.1f},{gy + 2:.1f} l{-pw * 0.03:.1f},{ph * 0.03:.1f}", "none", INK, 0.5, op=0.35)
    for (pk, spur_dx) in ((near[3], -0.07), (near[5], 0.04), (near[1], 0.03)):
        d.line([pk, (pk[0] + pw * spur_dx, hz)], INK, 0.6, op=0.5)
    d.line(xfar, INK, 0.35, op=0.2)
    d.line(far, INK, 0.45, op=0.35)
    d.line(near, INK, 1.1, op=0.55)
    d.o.append('</g>')
    d.o.append('<g filter="url(#graphite)">')
    for (pkx, pky) in (near[3], near[5]):                       # snow caps with a shaded side
        sw = pw * 0.05
        cap = (f"M{pkx - sw * 1.4:.1f},{pky + sw * 1.6:.1f} L{pkx:.1f},{pky:.1f} L{pkx + sw * 1.2:.1f},{pky + sw * 1.5:.1f} "
               f"l{-sw * 0.4:.1f},{-sw * 0.3:.1f} l{-sw * 0.3:.1f},{sw * 0.6:.1f} l{-sw * 0.5:.1f},{-sw * 0.5:.1f} l{-sw * 0.5:.1f},{sw * 0.4:.1f}Z")
        d.path(cap, HL, None, op=HLop)
        d.poly([(pkx, pky), (pkx + sw * 1.2, pky + sw * 1.5), (pkx + sw * 0.2, pky + sw * 1.2)], INK, None, op=0.22)
    d.o.append('</g>')

    # ---------------- two rows of pines: far row small and pale, near row large and dark
    def treeline(base, hmin, hmax, step, grad, seed_off):
        r2 = random.Random(seed + seed_off)
        path = f"M{px0 - 2},{base} "
        x = px0 - 2
        while x < px1 + 4:
            hgt = r2.uniform(hmin, hmax)
            wd = hgt * 0.32
            path += f"L{x:.1f},{base - 1:.1f} L{x + wd:.1f},{base - hgt:.1f} L{x + 2 * wd:.1f},{base - 1:.1f} "
            x += r2.uniform(step * 0.7, step * 1.2)
        path += f"L{px1 + 4},{base} Z"
        d.path(path, grad, None)
        return path
    d.o.append('<g filter="url(#soft1)">')
    treeline(hz - 1.5, ph * 0.03, ph * 0.055, 3.6, f"url(#{p}treesF)", 1)
    d.o.append('</g>')
    d.o.append('<g filter="url(#graphite)">')
    tl = treeline(hz + 0.5, ph * 0.055, ph * 0.11, 5.6, f"url(#{p}trees)", 2)
    d.o.append('</g>')
    d.o.append('<g filter="url(#graphiteLine)" opacity="0.8">')
    d.path(tl, f"url(#{p}str2)", None)
    d.o.append('</g>')

    # ---------------- lake: darker towards the viewer, reflections, ripples widening with nearness
    lake_b = hz + ph * 0.2
    d.o.append('<g filter="url(#graphite)">')
    d.rect(px0, hz, pw, lake_b - hz, f"url(#{p}lake)", None)
    d.o.append(f'<g transform="translate(0 {2 * hz:.1f}) scale(1 -0.6)" opacity="0.5">')
    d.path(tl, f"url(#{p}trees)", None)
    d.poly(near + [(px1 + 2, hz), (px0 - 2, hz)], f"url(#{p}lit)", None)
    d.o.append('</g>')
    d.o.append('</g>')
    d.o.append('<g filter="url(#graphiteLine)" opacity="0.8">')
    y, gap, k = hz + 2.5, 1.6, 0
    while y < lake_b:
        xa = px0 + rg.uniform(0, 10)
        seg = 5 + k * 2.2
        while xa < px1:
            ln = rg.uniform(seg * 0.6, seg * 1.4)
            d.line([(xa, y), (min(px1, xa + ln), y)], HL, 0.5 + k * 0.08, op=0.8 * HLop)
            xa += ln + rg.uniform(seg * 0.4, seg)
        y += gap
        gap *= 1.22
        k += 1
    d.o.append('</g>')

    # ---------------- foreground hill, path in perspective, boulders, cast shadows
    hill = f"M{px0 - 2},{hz + ph * 0.24} C{px0 + pw * 0.3},{hz + ph * 0.15} {px0 + pw * 0.62},{hz + ph * 0.22} {px1 + 2},{hz + ph * 0.16}"
    d.o.append('<g filter="url(#graphite)">')
    d.path(hill + f" V{py1 + 2} H{px0 - 2}Z", f"url(#{p}hill)", None)
    # path: lighter strip widening towards the viewer, darker verges
    path_poly = [P(0.77, 0.73), P(0.8, 0.73), (px0 + pw * 0.74, py1 + 2), (px0 + pw * 0.44, py1 + 2)]
    d.poly(path_poly, HL, None, op=0.75 * HLop)
    d.o.append('</g>')
    d.o.append('<g filter="url(#graphiteLine)" opacity="0.8">')
    d.path(hill + f" V{py1 + 2} H{px0 - 2}Z", f"url(#{p}str)", None, op=0.28)
    d.line([P(0.77, 0.73), (px0 + pw * 0.44, py1 + 2)], INK, 0.9, op=0.35)
    d.line([P(0.8, 0.73), (px0 + pw * 0.74, py1 + 2)], INK, 0.9, op=0.35)
    d.path(hill, "none", INK, 1.0, op=0.45)
    # grass: small and sparse far, larger and denser near (size diminution)
    for k in range(150):
        t = rg.random() ** 0.7
        gy = hz + ph * 0.22 + (py1 - hz - ph * 0.22) * t
        gx = rg.uniform(px0, px1)
        if px0 + pw * 0.45 < gx < px0 + pw * 0.75 and gy > hz + ph * 0.3:
            continue
        hh = 1.5 + 6 * t
        d.line([(gx, gy), (gx + rg.uniform(-1.4, 1.6) * (0.5 + t), gy - hh)], INK, 0.5 + 0.4 * t, op=round(0.18 + 0.35 * t, 2))
    d.o.append('</g>')
    # boulders on the right foreground: rounded with a cast shadow
    for (bx_, by_, br) in ((0.88, 0.9, 0.06), (0.95, 0.94, 0.04), (0.1, 0.95, 0.045)):
        cx_, cy_, r = px0 + pw * bx_, py0 + ph * by_, pw * br
        d.o.append('<g filter="url(#graphite)">')
        d.path(f"M{cx_ - r * 0.2:.1f},{cy_ + r * 0.55:.1f} a{r * 1.4:.1f},{r * 0.3:.1f} 0 1 0 {r * 2.6:.1f},0 a{r * 1.4:.1f},{r * 0.3:.1f} 0 1 0 {-r * 2.6:.1f},0",
               f"url(#{p}cast)", None)
        d.path(f"M{cx_ - r:.1f},{cy_ + r * 0.6:.1f} C{cx_ - r * 1.1:.1f},{cy_ - r * 0.6:.1f} {cx_ - r * 0.2:.1f},{cy_ - r:.1f} {cx_ + r * 0.4:.1f},{cy_ - r * 0.85:.1f} "
               f"C{cx_ + r:.1f},{cy_ - r * 0.6:.1f} {cx_ + r * 1.1:.1f},{cy_ + r * 0.2:.1f} {cx_ + r * 0.9:.1f},{cy_ + r * 0.6:.1f}Z", HL, None, op=HLop)
        d.path(f"M{cx_ - r:.1f},{cy_ + r * 0.6:.1f} C{cx_ - r * 1.1:.1f},{cy_ - r * 0.6:.1f} {cx_ - r * 0.2:.1f},{cy_ - r:.1f} {cx_ + r * 0.4:.1f},{cy_ - r * 0.85:.1f} "
               f"C{cx_ + r:.1f},{cy_ - r * 0.6:.1f} {cx_ + r * 1.1:.1f},{cy_ + r * 0.2:.1f} {cx_ + r * 0.9:.1f},{cy_ + r * 0.6:.1f}Z", f"url(#{p}rock)", None)
        d.path(f"M{cx_ - r * 0.3:.1f},{cy_ - r * 0.7:.1f} q{r * 0.2:.1f},{r * 0.6:.1f} {r * 0.6:.1f},{r * 1.2:.1f}", "none", INK, 0.7, op=0.25)
        d.o.append('</g>')

    # ---------------- cabin with a receding side wall and a cast shadow
    cbx, cby, cs = px0 + pw * 0.8, hz + ph * 0.215, pw * 0.065
    d.o.append('<g filter="url(#graphite)">')
    d.poly([(cbx + cs * 1.7, cby), (cbx + cs * 3.6, cby + cs * 0.5), (cbx + cs * 2.2, cby + cs * 0.55), (cbx - cs, cby)], INK, None, op=0.45)
    d.o.append('</g>')
    d.o.append('<g filter="url(#graphite)">')
    gx0, gx1 = cbx - cs, cbx + cs * 0.6                       # gable face (lit), side wall recedes to the right
    sx1 = cbx + cs * 1.7
    top_y = cby - cs * 1.1
    d.poly([(gx0, cby), (gx1, cby), (gx1, top_y), (gx0, top_y)], HL, None, op=None if not dark else 1)
    d.poly([(gx0, cby), (gx1, cby), (gx1, top_y), (gx0, top_y)], INK, None, op=0.1)
    d.poly([(gx1, cby), (sx1, cby - cs * 0.15), (sx1, top_y - cs * 0.1), (gx1, top_y)], INK, None, op=0.45)
    apex = ((gx0 + gx1) / 2, top_y - cs * 0.9)
    d.poly([(gx0 - cs * 0.15, top_y), apex, (gx1 + cs * 0.15, top_y)], HL, None, op=HLop)
    d.poly([apex, (apex[0] + (sx1 - gx1), apex[1] - cs * 0.1), (sx1 + cs * 0.15, top_y - cs * 0.1), (gx1 + cs * 0.15, top_y)], INK, None, op=0.62)
    d.rect(gx0 + cs * 0.55, cby - cs * 0.65, cs * 0.45, cs * 0.65, "ink", None, op=0.85)
    d.rect(gx1 + cs * 0.3, cby - cs * 0.8, cs * 0.35, cs * 0.3, HL, None, op=0.8 * HLop)
    d.rect(sx1 - cs * 0.5, apex[1] + cs * 0.05, cs * 0.25, cs * 0.6, "ink", None, op=0.7)
    d.path(f"M{sx1 - cs * 0.38:.1f},{apex[1]:.1f} q-3,-4 0,-8 q4,-4 0,-9 q-3,-4 1,-7", "none", INK, 1.6, op=0.18)
    d.o.append('</g>')

    # ---------------- oak: cast shadow, cylinder-shaded trunk, foliage with a dark underside
    tx = px0 + pw * 0.22
    tb = py1 - ph * 0.04
    d.o.append('<g filter="url(#graphite)">')
    d.o.append('</g>')
    d.o.append('<g filter="url(#graphite)">')
    d.path(f"M{tx - pw * 0.02:.1f},{tb:.1f} C{tx + pw * 0.08:.1f},{tb + ph * 0.02:.1f} {tx + pw * 0.2:.1f},{tb + ph * 0.03:.1f} {tx + pw * 0.3:.1f},{tb + ph * 0.02:.1f} "
           f"C{tx + pw * 0.22:.1f},{tb - ph * 0.01:.1f} {tx + pw * 0.08:.1f},{tb - ph * 0.015:.1f} {tx + pw * 0.03:.1f},{tb - ph * 0.01:.1f}Z", INK, None, op=0.55)
    trunk = (f"M{tx - pw * 0.028:.1f},{tb:.1f} C{tx - pw * 0.022:.1f},{hz + ph * 0.2:.1f} {tx - pw * 0.014:.1f},{hz + ph * 0.08:.1f} {tx - pw * 0.008:.1f},{hz:.1f} "
             f"L{tx + pw * 0.014:.1f},{hz:.1f} C{tx + pw * 0.022:.1f},{hz + ph * 0.08:.1f} {tx + pw * 0.032:.1f},{hz + ph * 0.2:.1f} {tx + pw * 0.042:.1f},{tb:.1f}Z")
    d.o.append('</g>')
    r0 = pw * 0.078
    clumps_ = [(tx - r0 * 1.2, hz - r0 * 0.1, r0), (tx + r0 * 1.15, hz - r0 * 0.3, r0), (tx - r0 * 0.1, hz - r0 * 1.2, r0 * 1.2),
              (tx - r0 * 1.75, hz - r0 * 1.3, r0 * 0.8), (tx + r0 * 1.55, hz - r0 * 1.4, r0 * 0.8), (tx - r0 * 0.6, hz - r0 * 2.45, r0),
              (tx + r0 * 0.75, hz - r0 * 2.25, r0 * 0.85)]
    clumps = clumps_
    d.path(trunk, "paper", None)                                  # solid backing
    for (cx_, cy_, r) in clumps:
        d.circle(cx_, cy_, r * 1.02, "paper", None)
    d.o.append('<g filter="url(#graphite)">')
    d.path(trunk, HL, None, op=HLop)
    d.path(trunk, f"url(#{p}trunk)", None)
    # dark mass under the canopy where the clumps overlap
    d.path(f"M{tx - r0 * 2.2:.1f},{hz + r0 * 0.3:.1f} Q{tx:.1f},{hz + r0 * 1.4:.1f} {tx + r0 * 2.1:.1f},{hz + r0 * 0.2:.1f} "
           f"Q{tx:.1f},{hz - r0 * 0.6:.1f} {tx - r0 * 2.2:.1f},{hz + r0 * 0.3:.1f}Z", INK, None, op=0.55)
    for (cx_, cy_, r) in sorted(clumps, key=lambda c: c[1]):
        d.circle(cx_, cy_, r, HL, None, op=HLop)
        d.circle(cx_, cy_, r, f"url(#{p}clump)", None)
    d.o.append('</g>')
    d.o.append('<g filter="url(#graphiteLine)" opacity="0.8">')
    d.path(trunk, "none", INK, 0.8, op=0.28)
    for k in range(8):                                           # bark following the round trunk
        by = hz + ph * 0.03 + k * (tb - hz) / 8
        d.path(f"M{tx + pw * 0.01:.1f},{by:.1f} q{pw * 0.012:.1f},{ph * 0.012:.1f} {pw * 0.02:.1f},{ph * 0.028:.1f}", "none", INK, 0.5, op=0.6)
    for (cx_, cy_, r) in clumps:
        for k in range(6):
            a = rg.uniform(math.pi * 0.05, math.pi * 0.95)
            rr = r * rg.uniform(0.7, 1.0)
            d.path(f"M{cx_ + rr * math.cos(a):.1f},{cy_ + rr * math.sin(a):.1f} q2,2 4,0", "none", INK, 0.5, op=0.6)
        for k in range(2):                                       # light leaf marks on the lit side
            a = rg.uniform(math.pi * 1.1, math.pi * 1.5)
            rr = r * rg.uniform(0.4, 0.75)
            d.path(f"M{cx_ + rr * math.cos(a):.1f},{cy_ + rr * math.sin(a):.1f} q2,-2 4,0", "none", INK, 0.4, op=0.3)
        d.path(f"M{cx_ - r * 0.9:.1f},{cy_ + r * 0.3:.1f} A{r:.1f},{r:.1f} 0 0 0 {cx_ + r * 0.8:.1f},{cy_ + r * 0.5:.1f}", "none", INK, 0.9, op=0.35)
    d.o.append('</g>')

    # ---------------- dark foreground band (repoussoir) pushes the view back
    d.o.append('<g filter="url(#graphite)">')
    d.rect(px0, py1 - ph * 0.1, pw, ph * 0.1, f"url(#{p}fore)", None)
    d.o.append('</g>')
    d.o.append('<g filter="url(#graphite)">')
    for (bx_, by_, rw, rh_) in ((0.0, 0.0, 0.7, 0.4), (1.0, 0.0, 0.6, 0.35), (0.0, 1.0, 0.8, 0.35), (1.0, 1.0, 0.7, 0.3)):
        d.o.append(f'<ellipse cx="{px0 + pw * bx_:.1f}" cy="{py0 + ph * by_:.1f}" rx="{pw * rw:.1f}" ry="{ph * rh_:.1f}" fill="url(#{p}burn)"/>')
    d.o.append(f'<ellipse cx="{px0 + pw * 0.82:.1f}" cy="{py0 + ph * 0.1:.1f}" rx="{pw * 0.22:.1f}" ry="{ph * 0.16:.1f}" fill="url(#{p}dodge)"/>')
    d.o.append(f'<ellipse cx="{px0 + pw * 0.44:.1f}" cy="{hz - ph * 0.22:.1f}" rx="{pw * 0.12:.1f}" ry="{ph * 0.1:.1f}" fill="url(#{p}dodge)" opacity="0.6"/>')
    d.o.append(f'<ellipse cx="{px0 + pw * 0.5:.1f}" cy="{hz + ph * 0.06:.1f}" rx="{pw * 0.45:.1f}" ry="{ph * 0.03:.1f}" fill="url(#{p}dodge)" opacity="0.28"/>')
    d.o.append('</g>')
    d.rect(px0, py0, pw, ph, f"url(#{p}vig)", None)
    d.o.append('</g>')
    d.rect(px0, py0, pw, ph, "none", "ink", 0.9)
