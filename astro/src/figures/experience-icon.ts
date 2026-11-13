import { defineCanvasFigure } from './define';
import { isometric, project, type Camera } from './kit/camera';
import { clear, dot, line } from './kit/draw';
import { ink } from './kit/ink';

/** The six experience cards as hairline isometric icons, one figure picking its icon from the
 *  page's data (`{ kind }`): pillars rising in a wave (adoption), a stack of sheets answering
 *  into one box (knowledge), bars falling (measurement), three nodes passing a packet (agents),
 *  layers behind one line (platform), a scan lifting a grid (visibility). Lines only. */

export const KINDS = ['adoption', 'knowledge', 'measurement', 'agents', 'platform', 'visibility'] as const;
type Kind = (typeof KINDS)[number];
type Ctx = CanvasRenderingContext2D;
interface Pen {
  ctx: Ctx;
  cam: Camera;
  t: number;
}
type Tone = 'line' | 'signal' | 'soft';
const stroke = (k: Tone): string => (k === 'signal' ? ink.signal(1) : k === 'soft' ? ink.faint(0.9) : ink.line(0.9));

function wire(p: Pen, x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, k: Tone = 'line'): void {
  const q = (x: number, y: number, z: number): number[] => project(p.cam, x, y, z);
  const s = stroke(k);
  const [tb, tr, tf, tl] = [q(x0, y1, z0), q(x1, y1, z0), q(x1, y1, z1), q(x0, y1, z1)];
  const [br, bf, bl] = [q(x1, y0, z0), q(x1, y0, z1), q(x0, y0, z1)];
  const edges = [
    [tb, tr],
    [tr, tf],
    [tf, tl],
    [tl, tb],
    [tr, br],
    [tf, bf],
    [tl, bl],
    [br, bf],
    [bf, bl],
  ];
  edges.forEach(([a, b]) => a && b && line(p.ctx, a, b, s));
}
const tile = (p: Pen, r: number): void => wire(p, -r, -r, r, r, -0.12, 0, 'soft');
const wave = (t: number, ph: number): number => 0.5 + 0.5 * Math.sin(t * 1.6 - ph);
const pt = (p: Pen, x: number, y: number, z: number, r: number, k: Tone): void => {
  const s = project(p.cam, x, y, z);
  dot(p.ctx, s[0], s[1], r, stroke(k));
};

const DRAW: Record<Kind, (p: Pen) => void> = {
  adoption: (p) => {
    tile(p, 3);
    [-2, 0, 2].forEach((x, i) =>
      [-2, 0, 2].forEach((z, j) => {
        const h = 0.4 + 1.9 * wave(p.t, (i + j) * 0.7);
        wire(p, x - 0.55, z - 0.55, x + 0.55, z + 0.55, 0, h, h > 1.9 ? 'signal' : 'line');
      }),
    );
  },
  knowledge: (p) => {
    tile(p, 3);
    const on = Math.floor(p.t * 0.9) % 4;
    for (let i = 0; i < 4; i++) {
      const lift = i === on ? 0.35 : 0;
      wire(p, -2.4, -1.4, 0.6, 1.4, 0.15 + i * 0.42 + lift, 0.27 + i * 0.42 + lift, i === on ? 'signal' : 'line');
    }
    wire(p, 1.6, -0.6, 2.8, 0.6, 0, 1.2, 'line');
    const u = (p.t * 0.9) % 1;
    const a = project(p.cam, -0.9, 0.4 + on * 0.42, 0);
    const b = project(p.cam, 2.2, 1.2, 0);
    line(p.ctx, a, b, stroke('soft'));
    dot(p.ctx, a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, 3, stroke('signal'));
  },
  measurement: (p) => {
    tile(p, 3);
    [3, 2.4, 1.9, 1.2].forEach((h, i) => {
      const g = Math.min(1, Math.max(0, p.t * 1.2 - i * 0.35)) % 1.01;
      const grow = g > 0 ? g : 0;
      wire(
        p,
        -2.6 + i * 1.5,
        -0.7,
        -1.6 + i * 1.5,
        0.7,
        0,
        h * (0.85 + 0.15 * Math.sin(p.t + i)) * Math.max(0.15, grow),
        i === 3 ? 'signal' : 'line',
      );
    });
  },
  agents: (p) => {
    tile(p, 3);
    const nodes: [number, number][] = [
      [-2, -1.6],
      [1.8, -1.6],
      [0, 1.8],
    ];
    nodes.forEach(([x, z], i) => wire(p, x - 0.6, z - 0.6, x + 0.6, z + 0.6, 0, 0.8 + 0.3 * wave(p.t, i * 2), 'line'));
    const at = (i: number): number[] => project(p.cam, nodes[i % 3]?.[0] ?? 0, 0.5, nodes[i % 3]?.[1] ?? 0);
    for (let i = 0; i < 3; i++) line(p.ctx, at(i), at(i + 1), stroke('soft'));
    const s = (p.t * 0.5) % 3;
    const i = Math.floor(s);
    const a = at(i);
    const b = at(i + 1);
    const u = s - i;
    dot(
      p.ctx,
      (a[0] ?? 0) + ((b[0] ?? 0) - (a[0] ?? 0)) * u,
      (a[1] ?? 0) + ((b[1] ?? 0) - (a[1] ?? 0)) * u,
      3.5,
      stroke('signal'),
    );
  },
  platform: (p) => {
    tile(p, 3);
    [3.4, 2.8, 2.2].forEach((r, i) => {
      const up = 0.25 * wave(p.t, i * 1.1);
      wire(p, -r / 2, -r / 2, r / 2, r / 2, 0.15 + i * 0.75 + up, 0.45 + i * 0.75 + up, i === 2 ? 'signal' : 'line');
    });
    const a = project(p.cam, 0, 0, 0);
    const b = project(p.cam, 0, 2.6, 0);
    line(p.ctx, a, b, stroke('soft'));
    const u = (p.t * 0.6) % 1;
    dot(p.ctx, a[0], a[1] + (b[1] - a[1]) * u, 3.5, stroke('signal'));
  },
  visibility: (p) => {
    tile(p, 3);
    const sweep = -2.4 + ((p.t * 0.9) % 1) * 4.8;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        const x = -2.4 + i * 1.2;
        const near = Math.max(0, 1 - Math.abs(x - sweep) / 1.1);
        wire(
          p,
          x - 0.35,
          -2.4 + j * 1.2 - 0.35,
          x + 0.35,
          -2.4 + j * 1.2 + 0.35,
          0,
          0.15 + near * 1.1,
          near > 0.5 ? 'signal' : 'line',
        );
      }
    }
    pt(p, sweep, 0, -3, 0, 'soft');
  },
};

function kindOf(data: unknown): Kind {
  const k = typeof data === 'object' && data !== null && 'kind' in data ? (data as { kind: unknown }).kind : undefined;
  return KINDS.find((x) => x === k) ?? 'adoption';
}

export default defineCanvasFigure<null>({
  id: 'experience-icon',
  title: 'Experience icons',
  alt: 'A small hairline isometric icon: pillars, sheets, bars, linked nodes, layers or a scanned grid, one for each experience card.',
  idea: 'Each card gets one moving isometric icon in lines: its motion says what the work does (rise, answer, measure, pass, stack, scan).',
  style: 'hairline',
  motion: 'ambient',
  answers: false,
  group: 'feature',
  seed: 903,
  aspect: 1.3,
  setup: () => null,
  draw: ({ ctx, w, h, t, data }) => {
    clear(ctx, w, h);
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    const cam = isometric(w * 0.5, h * 0.72, Math.min(w * 0.8, h * 1.1) * 0.1);
    DRAW[kindOf(data)]({ ctx, cam, t });
  },
});
