"""Pen-and-wash kernel: palettes, hatch patterns, wash shadows, export, and reusable
architectural components (raised panel, candle sconce, laurel crest with the SJ mark).

Call order for every drawing: build parts with a D(P) writer -> wrap(P, body, w, h, chalk)
(wrap runs washify, which pairs every hatched shape with a soft tone and masks its lines).
"""
import re
import math
import random
from .primitives import D, SW, BASE_LIGHT, BASE_DARK

LIGHT = dict(BASE_LIGHT, shade="#16191E", shadeK="1", led="0", halo="0", hatch="#B9AE99", hatch2="#9C917C", outline="#B9AE99")
DARK = dict(BASE_DARK, shade="#000000", shadeK="1.9", led="0", halo="0", hatch="#4A515E", hatch2="#5A6270", outline="#3E4551")
_CLIP = [0]


def defs(P, extra=""):
    h, h2 = P["hatch"], P["hatch2"]
    s1 = 760 / (100 * 2 ** 0.5)          # 5.374: lines meet exactly at the 760 tile edges
    s2 = s1 / 2                          # 2.687: dense hatch for deep shadow
    def lines(pid, sp, col, w, ang):
        return (f'<pattern id="{pid}" width="{sp:.4f}" height="{sp:.4f}" patternUnits="userSpaceOnUse" patternTransform="rotate({ang})">'
                f'<line x1="0" y1="-1" x2="0" y2="{sp + 1:.4f}" stroke="{col}" stroke-width="{w}" stroke-linecap="butt"/></pattern>')
    return (f'<defs>'
            + lines("hatch", s1, h, 0.75, 45)
            + lines("hatch2", s2, h2, 0.7, 45)
            + f'<pattern id="xhatch" width="{s2:.4f}" height="{s2:.4f}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'
              f'<line x1="0" y1="-1" x2="0" y2="{s2 + 1:.4f}" stroke="{h2}" stroke-width="0.7"/>'
              f'<line x1="-1" y1="0" x2="{s2 + 1:.4f}" y2="0" stroke="{h}" stroke-width="0.6"/></pattern>'
            + f'<pattern id="hlines" width="8" height="5" patternUnits="userSpaceOnUse"><path d="M0,2.5 H8" stroke="{h}" stroke-width="0.8"/></pattern>'
            f'<pattern id="damask" width="40" height="56" patternUnits="userSpaceOnUse">'
            f'<path d="M0,0 L20,28 L0,56 M40,0 L20,28 L40,56" fill="none" stroke="{h}" stroke-width="0.6"/>'
            f'<path d="M20,20 q4,4 0,8 q-4,-4 0,-8Z M20,36 q4,-4 0,-8 q-4,4 0,8Z M12,28 q4,-4 8,0 q-4,4 -8,0Z M28,28 q-4,-4 -8,0 q4,4 8,0Z" fill="none" stroke="{h}" stroke-width="0.6"/>'
            f'<circle cx="0" cy="0" r="1.6" fill="{h}"/><circle cx="40" cy="0" r="1.6" fill="{h}"/><circle cx="0" cy="56" r="1.6" fill="{h}"/><circle cx="40" cy="56" r="1.6" fill="{h}"/></pattern>'
            f'<filter id="graphite" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="2.1" numOctaves="2" seed="9" result="n"/>'
            f'<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.75 1.22" result="g"/>'
            f'<feGaussianBlur in="SourceGraphic" stdDeviation="0.95" result="b"/><feComposite in="b" in2="g" operator="in"/></filter>'
            f'<filter id="wash" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.3"/></filter>'
            f'<filter id="washIn" x="-20%" y="-20%" width="140%" height="140%"><feMorphology operator="erode" radius="1.2"/><feGaussianBlur stdDeviation="1.1"/></filter>'
            f'<filter id="wash2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6"/></filter>'
            f'<linearGradient id="aoTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{P["shade"]}" stop-opacity="{min(1, 0.30 * float(P["shadeK"])):.2f}"/><stop offset="0.35" stop-color="{P["shade"]}" stop-opacity="{min(1, 0.12 * float(P["shadeK"])):.2f}"/><stop offset="1" stop-color="{P["shade"]}" stop-opacity="{min(1, 0 * float(P["shadeK"])):.2f}"/></linearGradient>'
            f'<linearGradient id="aoLeft" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{P["shade"]}" stop-opacity="{min(1, 0.22 * float(P["shadeK"])):.2f}"/><stop offset="1" stop-color="{P["shade"]}" stop-opacity="{min(1, 0 * float(P["shadeK"])):.2f}"/></linearGradient>'
            f'<linearGradient id="cylR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{P["shade"]}" stop-opacity="{min(1, 0 * float(P["shadeK"])):.2f}"/><stop offset="0.45" stop-color="{P["shade"]}" stop-opacity="{min(1, 0.02 * float(P["shadeK"])):.2f}"/><stop offset="1" stop-color="{P["shade"]}" stop-opacity="{min(1, 0.24 * float(P["shadeK"])):.2f}"/></linearGradient>'
            f'<linearGradient id="under" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{P["shade"]}" stop-opacity="{min(1, 0.26 * float(P["shadeK"])):.2f}"/><stop offset="1" stop-color="{P["shade"]}" stop-opacity="{min(1, 0.04 * float(P["shadeK"])):.2f}"/></linearGradient>'
            f'<filter id="graphiteLine" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="2" seed="13" result="n"/>'
            f'<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.2" result="g"/>'
            f'<feGaussianBlur in="SourceGraphic" stdDeviation="0.55" result="b"/><feComposite in="b" in2="g" operator="in"/></filter>'
            f'<filter id="graphiteEdge" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="2" seed="21" result="n"/>'
            f'<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.8 1.3" result="g"/>'
            f'<feGaussianBlur in="SourceGraphic" stdDeviation="0.3" result="b"/><feComposite in="b" in2="g" operator="in"/></filter>'
            f'<filter id="soft1" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0.6"/></filter>'
            f'<filter id="soft2" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.3"/></filter>'
            f'<filter id="pencil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="2" result="n"/>'
            f'<feDisplacementMap in="SourceGraphic" in2="n" scale="0.9" xChannelSelector="R" yChannelSelector="G"/></filter>'
            f'<radialGradient id="halo"><stop offset="0" stop-color="{P["signal"]}" stop-opacity="0.85"/>'
            f'<stop offset="1" stop-color="{P["signal"]}" stop-opacity="0"/></radialGradient>'
            f'<linearGradient id="led" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE3B3" stop-opacity="0.38"/>'
            f'<stop offset="1" stop-color="#FFE3B3" stop-opacity="0"/></linearGradient>{extra}</defs>')


def chalk_filter():
    return ('<filter id="chalk" x="-2%" y="-2%" width="104%" height="104%">'
            '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n"/>'
            '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.4" xChannelSelector="R" yChannelSelector="G"/></filter>')


def washify(P, body):
    """Shadow + hatching: each hatched shape gets a soft blurred tone beneath its crisp lines."""
    import re
    ink, k = P["shade"], float(P["shadeK"])
    tone = {"hatch": 0.08, "hatch2": 0.14, "xhatch": 0.2}
    n = [0]
    def dup(m):
        tag, pid = m.group(0), m.group(1)
        n[0] += 1
        mid = f"hm{n[0]}"
        soft = tag.replace(f'fill="url(#{pid})"', f'fill="{ink}" fill-opacity="{min(1, tone[pid] * k):.2f}" filter="url(#wash)"')
        shape = tag.replace(f'fill="url(#{pid})"', 'fill="#fff" filter="url(#washIn)"')
        mask = (f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="-200" y="-200" width="3000" height="3000">{shape}</mask>')
        lines = tag.replace('/>', f' mask="url(#{mid})"/>', 1) if tag.endswith('/>') else tag
        return mask + soft + lines
    return re.sub(r'<(?:rect|polygon|path)\b[^>]*fill="url\(#(hatch2?|xhatch)\)"[^>]*/>', dup, body)


def wrap(P, body, w, h, chalk):
    body = washify(P, body)
    g = '<g filter="url(#chalk)">' if chalk else "<g>"
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'{defs(P, chalk_filter() if chalk else "")}{g}\n{body}\n</g></svg>')


def scaled(d, cx, cy, k, fn):
    d.o.append(f'<g transform="translate({cx} {cy}) scale({k}) translate({-cx} {-cy})">')
    fn()
    d.o.append('</g>')


def raised_panel(d, x, y, w, h, t=5):
    """A wooden slab standing proud of the wall: cast shadow, edge thickness, fielded face."""
    d.rect(x + t + 2, y + t + 2, w, h, "url(#hatch2)", None)                                        # cast shadow
    d.poly([(x + w, y), (x + w + t, y + t), (x + w + t, y + h + t), (x + w, y + h)], "c", "ink", 0.9)  # right edge
    d.poly([(x + w, y), (x + w + t, y + t), (x + w + t, y + h + t), (x + w, y + h)], "url(#hatch)", None)
    d.poly([(x, y + h), (x + w, y + h), (x + w + t, y + h + t), (x + t, y + h + t)], "b", "ink", 0.9)  # bottom edge
    d.poly([(x, y + h), (x + w, y + h), (x + w + t, y + h + t), (x + t, y + h + t)], "url(#hatch2)", None)
    d.rect(x, y, w, h, "a", "ink", 1.1)
    b = 14
    ix0, iy0, ix1, iy1 = x + b, y + b, x + w - b, y + h - b
    d.poly([(x + w, y), (ix1, iy0), (ix1, iy1), (x + w, y + h)], "url(#hatch)", None)              # right bevel
    d.poly([(x, y + h), (ix0, iy1), (ix1, iy1), (x + w, y + h)], "url(#hatch2)", None)              # bottom bevel
    for (ox, oy, iix, iiy) in ((x, y, ix0, iy0), (x + w, y, ix1, iy0), (x, y + h, ix0, iy1), (x + w, y + h, ix1, iy1)):
        d.line([(ox, oy), (iix, iiy)], "muted", 0.8)
    d.rect(ix0, iy0, ix1 - ix0, iy1 - iy0, "a", "ink", 0.9)
    d.rect(ix0 + 4, iy0 + 4, ix1 - ix0 - 8, iy1 - iy0 - 8, "none", "muted", 0.6)
    import random
    rg = random.Random(int(x * 7 + y))
    for k in range(4):                                                                              # grain
        gx = ix0 + 10 + k * (ix1 - ix0 - 20) / 3 + rg.uniform(-3, 3)
        d.path(f"M{gx:.1f},{iy0 + 6} c3,{(iy1 - iy0) * 0.25:.1f} -3,{(iy1 - iy0) * 0.5:.1f} 0,{(iy1 - iy0) * 0.75:.1f} "
               f"c2,{(iy1 - iy0) * 0.08:.1f} -1,{(iy1 - iy0) * 0.12:.1f} 0,{(iy1 - iy0) * 0.16:.1f}", "none", "deep", 0.6)
    d.path(f"M{ix0 + (ix1 - ix0) * 0.62:.1f},{(iy0 + iy1) / 2:.1f} a4,7 0 1 0 6,0 a4,7 0 1 0 -6,0", "none", "deep", 0.6)


def candle(d, x, base_y, h=30):
    """Candle standing on a cup at base_y, with wax drips, wick and a two-tone flame."""
    w = 8
    top = base_y - h
    d.rect(x - w / 2, top, w, h, "paper", "ink", 1)
    d.rect(x + 0.5, top + 3, w / 2 - 1.2, h - 4, "url(#hatch2)", None)
    d.path(f"M{x - w / 2},{top + 1} q2,5 3,1 q1,7 3,2 q1,3 2,-3", "none", "muted", 0.8)   # drips
    d.path(f"M{x - w / 2 + 1},{top + 2} v{h - 6}", "none", "muted", 0.6, op=0.6)
    d.line([(x, top), (x, top - 4)], "ink", 1)                                          # wick
    d.path(f"M{x},{top - 18} C{x + 6},{top - 10} {x + 5},{top - 4} {x},{top - 3} C{x - 5},{top - 4} {x - 6},{top - 10} {x},{top - 18}Z",
           "signal", None)
    d.path(f"M{x},{top - 11} C{x + 2.5},{top - 7} {x + 2},{top - 4.5} {x},{top - 4} C{x - 2},{top - 4.5} {x - 2.5},{top - 7} {x},{top - 11}Z",
           "paper", None)
    d.path(f"M{x},{top - 18} C{x + 6},{top - 10} {x + 5},{top - 4} {x},{top - 3} C{x - 5},{top - 4} {x - 6},{top - 10} {x},{top - 18}Z",
           "none", "ink", 0.6)


def sconce(d, c, y, P):
    """Twin-arm brass candle sconce mounted on the stile, candles at c-20 and c+20."""
    d.path(f"M{c - 5},{y - 26} q9,-12 18,0 v34 q0,10 -9,14 q-9,-4 -9,-14Z", "url(#hatch2)", None)
    # backplate: shaped oval with scalloped crest and a drop finial
    d.path(f"M{c - 9},{y - 30} q9,-12 18,0 v34 q0,10 -9,14 q-9,-4 -9,-14Z", "b", "ink", 1.1)
    d.path(f"M{c - 5},{y - 26} q5,-6 10,0 v28 q0,6 -5,9 q-5,-3 -5,-9Z", "none", "muted", 0.8)
    d.circle(c, y - 14, 2.5, "a", "ink", 0.9)
    d.path(f"M{c},{y + 18} q3,4 0,9 q-3,-5 0,-9Z", "b", "ink", 0.9)
    # scrolled arms
    for sgn in (-1, 1):
        ax = c + sgn * 20
        d.path(f"M{c + sgn * 6},{y + 2} C{c + sgn * 14},{y + 10} {ax - sgn * 2},{y + 8} {ax},{y - 2}", "none", "ink", 1.6)
        d.path(f"M{c + sgn * 8},{y + 6} q{sgn * -4},6 {sgn * 2},8", "none", "ink", 1)   # curl
        # bobeche (drip pan) and cup
        d.path(f"M{ax - 9},{y - 4} h18 q-3,4 -9,4 q-6,0 -9,-4Z", "b", "ink", 1)
        d.path(f"M{ax - 6},{y - 1.5} h12 q-2,2.2 -6,2.2 q-4,0 -6,-2.2Z", "url(#hatch2)", None)
        d.rect(ax - 5, y - 9, 10, 5, "a", "ink", 1)
        candle(d, ax, y - 9)


def laurel(d, c, base_y, tip_y, sgn):
    """One laurel branch: a curved stem with paired almond leaves set along its tangent."""
    import math
    p0 = (c + sgn * 3, base_y)
    p1 = (c + sgn * 31, base_y - 8)
    p2 = (c + sgn * 22, tip_y)
    def bez(t):
        u = 1 - t
        return (u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1])
    def tan(t):
        return (2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]), 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]))
    d.path(f"M{p0[0]:.1f},{p0[1]:.1f} Q{p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}", "none", "ink", 1)
    n = 6
    for i in range(n):
        t = 0.16 + i * (0.8 / (n - 1))
        x, y = bez(t)
        tx, ty = tan(t)
        ang = math.atan2(ty, tx)
        L = 9.5 - i * 0.9
        for side in (-1, 1):
            a2 = ang + side * math.radians(38)
            ex, ey = x + L * math.cos(a2), y + L * math.sin(a2)
            mx, my = (x + ex) / 2, (y + ey) / 2
            nx, ny = -math.sin(a2) * L * 0.22, math.cos(a2) * L * 0.22
            d.path(f"M{x:.1f},{y:.1f} Q{mx + nx:.1f},{my + ny:.1f} {ex:.1f},{ey:.1f} Q{mx - nx:.1f},{my - ny:.1f} {x:.1f},{y:.1f}Z",
                   "a", "ink", 0.8)
            d.line([(x, y), (mx, my)], "muted", 0.5)
    # terminal leaf at the tip
    tx, ty = tan(1.0)
    ang = math.atan2(ty, tx)
    ex, ey = p2[0] + 8 * math.cos(ang), p2[1] + 8 * math.sin(ang)
    mx, my = (p2[0] + ex) / 2, (p2[1] + ey) / 2
    nx, ny = -math.sin(ang) * 2, math.cos(ang) * 2
    d.path(f"M{p2[0]:.1f},{p2[1]:.1f} Q{mx + nx:.1f},{my + ny:.1f} {ex:.1f},{ey:.1f} Q{mx - nx:.1f},{my - ny:.1f} {p2[0]:.1f},{p2[1]:.1f}Z",
           "a", "ink", 0.8)


SJ_S = "M122 34 H74 V62 H108 V126 H74"
SJ_J = "M122 34 V126 Q122 150 98 150 Q74 150 74 128"
SJ_TIES = [(108, 82, 122, 82), (108, 104, 122, 104)]
SJ_PINS = [(122, 34), (74, 127)]


def monogram(d, cx, cy, height):
    k = height / 138.0
    ox, oy = cx - 98 * k, cy - 91 * k
    d.o.append(f'<g data-role="logo" transform="translate({ox:.2f} {oy:.2f}) scale({k:.4f})">')
    if d.P.get("led") == "1":
        d.o.append(f'<path d="{SJ_J}" fill="none" stroke="{d.c("signal")}" stroke-width="16" stroke-linecap="round" opacity="0.25"/>')
    for (x1, y1, x2, y2) in SJ_TIES:
        d.o.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{d.c("outline")}" stroke-width="4" stroke-linecap="round"/>')
    d.o.append(f'<path d="{SJ_S}" fill="none" stroke="{d.c("ink")}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>')
    d.o.append(f'<path d="{SJ_J}" fill="none" stroke="{d.c("signal")}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>')
    for (x, y) in SJ_PINS:
        d.o.append(f'<circle cx="{x}" cy="{y}" r="8" fill="{d.c("paper")}" stroke="{d.c("muted")}" stroke-width="4"/>')
    d.o.append('</g>')


def crest(d, c, cy, P):
    """Heater shield carrying the SJ circuit logo, framed by a laurel wreath, coronet and ribbon."""
    W, H = 40, 58
    top = cy - H / 2
    shield = (f"M{c - W / 2},{top} H{c + W / 2} V{top + H * 0.45} "
              f"C{c + W / 2},{top + H * 0.8} {c + 8},{top + H * 0.92} {c},{top + H} "
              f"C{c - 8},{top + H * 0.92} {c - W / 2},{top + H * 0.8} {c - W / 2},{top + H * 0.45}Z")
    d.o.append(f'<g transform="translate(4.5 4.5)"><path d="{shield}" fill="url(#hatch2)"/></g>')
    for sgn in (-1, 1):                                   # wreath behind the shield, in front of its shadow
        laurel(d, c, top + H + 4, top + 6, sgn)
    d.path(shield, "paper", "ink", 1.3)
    inner = (f"M{c - W / 2 + 3.5},{top + 3.5} H{c + W / 2 - 3.5} V{top + H * 0.45} "
             f"C{c + W / 2 - 3.5},{top + H * 0.76} {c + 6},{top + H * 0.86} {c},{top + H - 4.5} "
             f"C{c - 6},{top + H * 0.86} {c - W / 2 + 3.5},{top + H * 0.76} {c - W / 2 + 3.5},{top + H * 0.45}Z")
    d.path(inner, "none", "muted", 0.8)
    monogram(d, c, top + H * 0.44, 38)
    # coronet
    d.path(f"M{c - 11},{top - 2} l3,-8 l4,4 l4,-7 l4,7 l4,-4 l3,8Z", "b", "ink", 1)
    d.line([(c - 10, top - 4.5), (c + 10, top - 4.5)], "muted", 0.6)
    for px, py in ((c - 8, top - 10), (c, top - 11), (c + 8, top - 10)):
        d.circle(px, py, 1.8, "signal" if px == c else "a", "ink", 0.8)
    # ribbon tied across the stems
    ry = top + H + 2
    d.path(f"M{c - 22},{ry} h44 v8 h-44Z", "a", "ink", 1)
    d.path(f"M{c - 22},{ry} l-8,4 l5,4 l-5,4 h11 v-4", "b", "ink", 1)
    d.path(f"M{c + 22},{ry} l8,4 l-5,4 l5,4 h-11 v-4", "b", "ink", 1)
    d.path(f"M{c - 22},{ry + 8} h-3 v4 h3Z", "url(#hatch2)", None)
    d.path(f"M{c + 22},{ry + 8} h3 v4 h-3Z", "url(#hatch2)", None)
    d.line([(c - 18, ry + 4), (c + 18, ry + 4)], "muted", 0.6)
