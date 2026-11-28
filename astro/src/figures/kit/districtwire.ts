import { project, type Camera, type ScreenPoint, type Vec3 } from './camera';
import { bodyOf, type District, type Part } from './city';
import { ink } from './ink';
import { outlines } from './outlines';
import { along } from './shapes';

/** The district drawn without WebGL (`templates/district.ts`): the earlier wireframe, each solid's
 *  silhouette filled with the ground back to front so it hides what is behind it. Only the
 *  hidden-line drawing's fallback; it holds still at the seed's camera. */

interface Piece {
  segs: number[];
  at: Vec3;
  solid: boolean;
  mark: boolean;
}
export interface Wire {
  city: District;
  pieces: Piece[];
  w: number;
  d: number;
}

export function wireOf(city: District, w: number, d: number, mark?: Part): Wire {
  const pieces = city.parts.map((p) => ({
    mark: p === mark,
    segs: outlines([p]),
    at: [p.x, p.y ?? 0, p.z] as Vec3,
    solid: bodyOf(p.kind) !== null,
  }));
  return { city, pieces, w, d };
}

/** The convex hull of projected points (monotone chain), to fill a solid's silhouette. */
function hull(pts: ScreenPoint[]): ScreenPoint[] {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: ScreenPoint, a: ScreenPoint, b: ScreenPoint): number =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: ScreenPoint[]): ScreenPoint[] => {
    const out: ScreenPoint[] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2] ?? p, out[out.length - 1] ?? p, p) <= 0) out.pop();
      out.push(p);
    }
    return out.slice(0, -1);
  };
  return [...half(s), ...half([...s].reverse())];
}

export function drawWire(
  ctx: CanvasRenderingContext2D,
  wire: Wire,
  w: number,
  h: number,
  t: number,
  yaw: number,
  pitch: number,
): void {
  const scale = Math.min(w / (wire.w * 1.02), h / (wire.d * 1.25));
  const cam: Camera = { yaw, pitch, dist: Infinity, scale, cx: w / 2, cy: h * 0.55 };
  const P = (x: number, y: number, z: number): ScreenPoint => project(cam, x, y, z);
  const stroke = (segs: readonly number[], style: string): void => {
    ctx.strokeStyle = style;
    ctx.beginPath();
    for (let i = 0; i < segs.length; i += 6) {
      const a = P(segs[i] ?? 0, segs[i + 1] ?? 0, segs[i + 2] ?? 0);
      const b = P(segs[i + 3] ?? 0, segs[i + 4] ?? 0, segs[i + 5] ?? 0);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();
  };
  const [hw, hd] = [wire.w / 2, wire.d / 2];
  ctx.fillStyle = ink.panel(0.6);
  ctx.beginPath();
  [P(-hw, 0, -hd), P(hw, 0, -hd), P(hw, 0, hd), P(-hw, 0, hd)].forEach(([x, y], i) =>
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
  );
  ctx.closePath();
  ctx.fill();
  stroke(
    wire.city.traces.flatMap(([a, b, c, d]) => [a, 0, b, c, 0, d]),
    ink.line(0.14),
  );
  const order = wire.pieces
    .map((p) => ({ p, depth: P(p.at[0], p.at[1], p.at[2])[2] }))
    .sort((a, b) => a.depth - b.depth);
  for (const { p } of order) {
    if (p.solid) {
      const pts: ScreenPoint[] = [];
      for (let i = 0; i < p.segs.length; i += 3) pts.push(P(p.segs[i] ?? 0, p.segs[i + 1] ?? 0, p.segs[i + 2] ?? 0));
      ctx.fillStyle = ink.ground();
      ctx.beginPath();
      hull(pts).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.fill();
    }
    stroke(p.segs, p.mark ? ink.signal(0.9) : ink.line(0.7));
  }
  const pipes = wire.city.pipes ?? [];
  stroke(
    pipes.flatMap((q) => q.slice(1).flatMap((b, i) => [...(q[i] ?? b), ...b])),
    ink.signal(0.55),
  );
  ctx.fillStyle = ink.signal(0.95);
  pipes.forEach((q, i) => {
    const [x, y] = P(...along(q, (t * 0.3 + i * 0.37) % 1));
    ctx.fillRect(Math.round(x) - 1.5, Math.round(y) - 1.5, 3, 3);
  });
}
