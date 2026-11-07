import { camera, type Camera, type Vec3 } from '../camera';
import { ink, mix } from '../ink';
import { hardwareScene } from './scene';
import { VIEWS, type HardwareModel, type HardwareOptions } from './types';

export interface HardwarePath {
  d: string;
  closed: boolean;
  points: [number, number][];
  fill: string;
  stroke: string;
  part: number;
  solid: number;
  front: boolean;
}
export interface HardwareFraming {
  x: number;
  y: number;
  scale: number;
}
export interface HardwareDrawing {
  paths: HardwarePath[];
  centres: ([number, number] | null)[];
  framing: HardwareFraming;
}
const CACHE = new WeakMap<HardwareModel, Map<string, HardwareDrawing>>();
const pathData = (points: [number, number][], close: boolean): string =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join('') + (close ? 'Z' : '');
export function hardwareCamera(view: HardwareOptions['view']): Camera {
  const [yaw, pitch] = VIEWS[view];
  return camera({ yaw, pitch, dist: Infinity, scale: 1, cx: 0, cy: 0 });
}
/** Repeated rest frames reuse the projection; transitions still use the figure clock. */
export function hardwareDrawing(
  model: HardwareModel,
  o: HardwareOptions,
  w: number,
  h: number,
  pose: Camera = hardwareCamera(o.view),
  vector = true,
  framing?: HardwareFraming,
): HardwareDrawing {
  const options = { ...o, detail: o.detail ?? w >= 420 };
  const key = [
    w,
    h,
    o.mode,
    options.detail,
    o.isolate,
    o.pick,
    vector,
    ...[o.open, o.lift ?? 0, pose.yaw, pose.pitch, framing?.x ?? 0, framing?.y ?? 0, framing?.scale ?? 0].map((v) =>
      v.toFixed(4),
    ),
  ].join(':');
  const cache = CACHE.get(model) ?? new Map<string, HardwareDrawing>();
  CACHE.set(model, cache);
  const cached = cache.get(key);
  if (cached) return cached;
  const surfaces = hardwareScene(model, options, pose);
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity,
    near = -Infinity,
    far = Infinity;
  const centres = model.parts.map(() => null as [number, number] | null);
  const sums = model.parts.map(() => ({ x: 0, y: 0, n: 0 }));
  for (const s of surfaces) {
    near = Math.max(near, s.depth);
    far = Math.min(far, s.depth);
    for (const [x, y] of s.points) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      const sum = sums[s.part];
      if (sum) {
        sum.x += x;
        sum.y += y;
        sum.n++;
      }
    }
  }
  const fit = framing ?? {
    x: (x0 + x1) / 2,
    y: (y0 + y1) / 2,
    scale: Math.min((w * 0.76) / (x1 - x0 || 1), (h * 0.76) / (y1 - y0 || 1)),
  };
  const point = ([x, y]: [number, number]): [number, number] => [
    w / 2 + (x - fit.x) * fit.scale,
    h / 2 + (y - fit.y) * fit.scale,
  ];
  sums.forEach((s, i) => {
    if (s.n) centres[i] = point([s.x / s.n, s.y / s.n]);
  });
  const selected = o.pick < 0 ? model.parts.length - 1 : o.pick;
  // A semantic part can contain many repeated solids. Each gets one restrained accent,
  // in painter order, so nearer opaque faces still hide accents behind them.
  const signals = new Map<number, (typeof surfaces)[number]>();
  for (const s of surfaces) {
    if (s.part !== selected || !s.outline || (s.face && s.area <= 0.00001)) continue;
    const previous = signals.get(s.solid);
    if (
      !previous ||
      (s.face && !previous.face) ||
      (s.face === previous.face && (s.face ? s.area > previous.area : s.points.length > previous.points.length))
    )
      signals.set(s.solid, s);
  }
  const wire = o.mode === 'wireframe';
  const paths = surfaces
    .filter((s) => !s.face || ((s.outline || !wire) && (s.area > 0.00001 || wire)))
    .map((s): HardwarePath => {
      const points = s.points.map(point);
      const weight = (s.depth - far) / (near - far || 1);
      return {
        points,
        part: s.part,
        solid: s.solid,
        front: s.area > 0.00001,
        closed: s.face,
        d: vector ? pathData(points, s.face) : '',
        fill: s.face && !wire ? mix('ground', s.top ? 'panel2' : 'panel', s.top ? 1 : 0.7) : 'none',
        stroke: !s.outline
          ? 'none'
          : signals.get(s.solid) === s
            ? ink.signal(0.95)
            : ink.line(s.face && s.area <= 0 ? 0.075 : s.face ? 0.26 + weight * 0.3 : 0.16 + weight * 0.2),
      };
    });
  const drawing = { paths, centres, framing: fit };
  cache.set(key, drawing);
  if (cache.size > 8) {
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  return drawing;
}
export function paintHardware(ctx: CanvasRenderingContext2D, drawing: HardwareDrawing): void {
  for (const p of drawing.paths) {
    ctx.beginPath();
    p.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (p.closed) ctx.closePath();
    if (p.fill !== 'none') {
      ctx.fillStyle = p.fill;
      ctx.fill();
    }
    if (p.stroke !== 'none') {
      ctx.strokeStyle = p.stroke;
      ctx.stroke();
    }
  }
}
function contains(points: [number, number][], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i],
      b = points[j];
    if (a && b && a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
export function nearestPart(drawing: HardwareDrawing, point: Vec3): number {
  for (let i = drawing.paths.length - 1; i >= 0; i--) {
    const path = drawing.paths[i];
    if (path?.closed && contains(path.points, point[0], point[1])) return path.part;
  }
  let picked = 0,
    distance = Infinity;
  drawing.centres.forEach((p, i) => {
    if (!p) return;
    const d = Math.hypot(p[0] - point[0], p[1] - point[1]);
    if (d < distance) {
      picked = i;
      distance = d;
    }
  });
  return picked;
}
