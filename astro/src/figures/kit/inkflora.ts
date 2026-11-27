import type { Pt } from './brush';
import { root, sample, type Ink } from './inkpath';
import { between, type Rng } from './rng';

/** Trees and reeds in ink, the way a landscape painter builds them: a trunk laid with one
 *  tapering stroke, branches off it, then the foliage the kind is known by. A pine carries
 *  flat pads of needles fanned upward; a broadleaf tree is a crown of brush dabs; a willow
 *  lets long strands fall. `s` is the tree's height in pixels and `(x, y)` its foot. */

/** A trunk from the foot up to `s`, leaning and bending. */
function trunk(k: Ink, rng: Rng, x: number, y: number, s: number, width: number): Pt[] {
  const lean = between(rng, -0.22, 0.22) * s;
  const bend = between(rng, 0, Math.PI * 2);
  const pts = sample(14, (u) => [x + lean * u * u + Math.sin(u * 3 + bend) * 0.035 * s, y - u * s]);
  k.stroke(pts, width, root, 0.25, x * 0.01);
  return pts;
}

/** A clump of needles along a pad `pw` wide at (x, y): short strokes bristling up and out,
 *  a few hanging under it, never a regular fan. */
function needles(k: Ink, rng: Rng, x: number, y: number, pw: number, s: number): void {
  for (let j = 0; j < 22; j++) {
    const under = j > 17;
    const sx = x + (rng() - 0.5) * pw * (under ? 0.6 : 0.95);
    const a = under ? Math.PI * between(rng, 0.2, 0.8) : -Math.PI / 2 + (rng() - 0.5) * 1.9;
    const len = between(rng, 0.025, 0.065) * s * (under ? 0.6 : 1);
    k.line([
      [sx, y],
      [sx + Math.cos(a) * len, y + Math.sin(a) * len * 0.8],
    ]);
  }
}

/** A pine: alternating level branches, each holding a flat pad of needle fans. */
export function pine(k: Ink, rng: Rng, x: number, y: number, s: number): void {
  const t = trunk(k, rng, x, y, s, 0.05 * s);
  const n = 4 + Math.floor(rng() * 3);
  let side = rng() < 0.5 ? -1 : 1;
  for (let b = 0; b <= n; b++) {
    const p = t[Math.round(6 + (8 * b) / n)];
    if (!p) continue;
    const len = (0.16 + 0.22 * (1 - b / n)) * s * (b === n ? 0.4 : 1);
    const end: Pt = [p[0] + side * len, p[1] - between(rng, 0.02, 0.07) * s];
    k.stroke([p, [(p[0] + end[0]) / 2, p[1] - 0.01 * s], end], 0.03 * s, root, 0.2);
    const pad = Math.max(len, 0.12 * s);
    k.coverOval(end[0], end[1] - 0.03 * s, pad * 0.55, 0.05 * s);
    k.stroke(
      sample(6, (u) => [end[0] + (u - 0.5) * pad, end[1] + Math.sin(u * Math.PI) * 0.012 * s]),
      0.016 * s,
    );
    needles(k, rng, end[0], end[1], pad, s);
    side = -side;
  }
}

/** A broadleaf tree: a forked trunk under a crown of brush dabs. */
export function leafy(k: Ink, rng: Rng, x: number, y: number, s: number): void {
  const t = trunk(k, rng, x, y, s * 0.7, 0.08 * s);
  const top = t[t.length - 1] ?? [x, y - s * 0.7];
  const crowns = 3 + Math.floor(rng() * 2);
  for (let c = 0; c < crowns; c++) {
    const cx = top[0] + between(rng, -0.25, 0.25) * s;
    const cy = top[1] - between(rng, 0, 0.22) * s;
    const fork = t[Math.round(between(rng, 7, 12))] ?? top;
    k.stroke([fork, [cx, cy]], 0.035 * s, root, 0.2);
    k.coverOval(cx, cy, 0.17 * s, 0.11 * s);
    for (let d = 0; d < 26; d++) {
      const a = rng() * Math.PI * 2;
      const r = Math.sqrt(rng());
      k.dab(cx + Math.cos(a) * r * 0.16 * s, cy + Math.sin(a) * r * 0.1 * s, 0.022 * s, 0.011 * s, rng() * 3);
    }
  }
}

/** A willow: a leaning trunk and long strands falling from its crown. */
export function willow(k: Ink, rng: Rng, x: number, y: number, s: number): void {
  const t = trunk(k, rng, x, y, s * 0.6, 0.08 * s);
  const top = t[t.length - 1] ?? [x, y - s * 0.6];
  for (let j = 0; j < 16; j++) {
    const ox = top[0] + between(rng, -0.3, 0.3) * s;
    const oy = top[1] - between(rng, 0, 0.12) * s;
    const fall = between(rng, 0.3, 0.55) * s;
    const out = (ox - top[0]) * 0.4;
    k.line(sample(8, (u) => [ox + out * Math.sin(u * 1.4), oy - 0.06 * s * Math.sin(u * 2) + fall * u * u]));
    if (j % 3 === 0) k.stroke([top, [ox, oy]], 0.025 * s, root, 0.2);
  }
}

/** A clump of reed blades, each a thin bending stroke. */
export function reeds(k: Ink, rng: Rng, x: number, y: number, s: number): void {
  for (let j = 0; j < 7; j++) {
    const bx = x + between(rng, -0.25, 0.25) * s;
    const tip = between(rng, 0.5, 1) * s;
    const lean = between(rng, -0.35, 0.35) * s;
    k.stroke(
      sample(6, (u) => [bx + lean * u * u, y - tip * u]),
      0.045 * s,
      root,
      0.15,
    );
  }
}
