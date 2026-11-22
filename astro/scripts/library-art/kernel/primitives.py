"""Drawing primitives shared by both kernels: one SVG writer with monoline weights.

Line weights (monoline tiers): hairline 0.5-0.8, line 0.9-1.3, accent 1.6-2.0.
Palette keys used by every call: a, b, c (three surface tones), deep, paper, ink, muted, signal.
"""
import math
from .tokens import palette

SW = 1.25

# Every colour comes from the site's tokens (kernel/tokens.py); only non-colour knobs live here.
BASE_LIGHT = dict(palette("light"), theme="light", halo="0")
BASE_DARK = dict(palette("dark"), theme="dark", halo="0.3")


class D:
    def __init__(self, P):
        self.P, self.o = P, []

    def c(self, k):
        return self.P.get(k, k)

    def rect(self, x, y, w, h, fill="a", stroke="ink", sw=SW, rx=0, op=None, extra=""):
        st = self.c(stroke) if stroke else "none"
        o = f' opacity="{op}"' if op is not None else ""
        self.o.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{rx}" fill="{self.c(fill)}" '
                      f'stroke="{st}" stroke-width="{sw}"{o}{extra}/>')

    def line(self, pts, stroke="ink", sw=SW, op=None, dash=None):
        o = f' opacity="{op}"' if op is not None else ""
        o += f' stroke-dasharray="{dash}"' if dash else ""
        p = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        self.o.append(f'<polyline points="{p}" fill="none" stroke="{self.c(stroke)}" stroke-width="{sw}" '
                      f'stroke-linecap="round" stroke-linejoin="round"{o}/>')

    def poly(self, pts, fill="a", stroke="ink", sw=SW, op=None):
        o = f' opacity="{op}"' if op is not None else ""
        p = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
        st = self.c(stroke) if stroke else "none"
        self.o.append(f'<polygon points="{p}" fill="{self.c(fill)}" stroke="{st}" stroke-width="{sw}" stroke-linejoin="round"{o}/>')

    def circle(self, x, y, r, fill="a", stroke="ink", sw=SW, op=None):
        st = self.c(stroke) if stroke else "none"
        o = f' opacity="{op}"' if op is not None else ""
        self.o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{self.c(fill)}" stroke="{st}" stroke-width="{sw}"{o}/>')

    def path(self, d, fill="none", stroke="ink", sw=SW, op=None):
        o = f' opacity="{op}"' if op is not None else ""
        st = self.c(stroke) if stroke else "none"
        self.o.append(f'<path d="{d}" fill="{self.c(fill)}" stroke="{st}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"{o}/>')

    def text(self, x, y, t, size=13, fill="muted", anchor="middle"):
        self.o.append(f'<text x="{x}" y="{y}" font-family="JetBrains Mono, ui-monospace, monospace" font-size="{size}" '
                      f'font-weight="500" fill="{self.c(fill)}" text-anchor="{anchor}">{t}</text>')

    def halo(self, x, y, r):
        self.o.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#halo)" opacity="{self.c("halo")}"/>')

    def group(self, inner_fn, transform):
        self.o.append(f'<g transform="{transform}">')
        inner_fn()
        self.o.append('</g>')
