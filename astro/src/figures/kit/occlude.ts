import { project, type Camera } from './camera';

type XZ = readonly [number, number];

/** Which of two upright solids is nearer where they overlap on screen: a vertical cylinder
 *  (centre `c`, radius `r` in the ground plane) or a vertical prism over a convex footprint
 *  `poly`. Both stand on the same ground, so the question is a 2D one in x and z: take the
 *  screen column through the middle of their overlap and compare how near each one's front is
 *  along it. For disjoint convex solids the answer holds across the whole overlap, so a scene
 *  can order its parts by it every frame and nothing pops. Returns true when the cylinder is
 *  in front, or when they do not overlap at all. */
export function cylinderInFront(cam: Camera, c: XZ, r: number, poly: readonly XZ[]): boolean {
  const o = project(cam, 0, 0, 0);
  const px = project(cam, 1, 0, 0);
  const pz = project(cam, 0, 0, 1);
  const e: XZ = [px[0] - o[0], pz[0] - o[0]]; // screen x per unit x and z
  const d: XZ = [px[2] - o[2], pz[2] - o[2]]; // nearness per unit x and z
  const dot = (a: XZ, b: XZ) => a[0] * b[0] + a[1] * b[1];
  const ee = dot(e, e);
  const half = r * Math.sqrt(ee);
  const sc = dot(e, c);
  const ps = poly.map((p) => dot(e, p));
  const lo = Math.max(sc - half, Math.min(...ps));
  const hi = Math.min(sc + half, Math.max(...ps));
  if (lo >= hi) return true;
  const mid = (lo + hi) / 2;
  // The cylinder's front along the column: the nearer end of the chord it cuts.
  const off = (mid - sc) / ee;
  const foot: XZ = [c[0] + e[0] * off, c[1] + e[1] * off];
  const v: XZ = [-e[1], e[0]];
  const t = Math.sqrt(Math.max(0, r * r - off * off * ee) / dot(v, v));
  const cyl = Math.max(
    dot(d, [foot[0] + v[0] * t, foot[1] + v[1] * t]),
    dot(d, [foot[0] - v[0] * t, foot[1] - v[1] * t]),
  );
  // The prism's front along the same column: the nearest crossing of its outline.
  let prism = -Infinity;
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length]!;
    const [sa, sb] = [dot(e, a), dot(e, b)];
    if ((sa - mid) * (sb - mid) > 0 || sa === sb) return;
    const k = (mid - sa) / (sb - sa);
    prism = Math.max(prism, dot(d, [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]));
  });
  return cyl >= prism;
}
