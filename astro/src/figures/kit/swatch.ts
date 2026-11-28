import { tone } from './ink';

/** The palette studio's drawings (`swatch-*`) are the one place a figure takes colours from the
 *  page instead of the night tokens: the reader's palette arrives as `data.palette`, token name
 *  to CSS colour, and the drawing spends it 60/30/10. With no data (the bench, the audit, a lab
 *  card) every colour falls back to the night tokens, so the figure is still on-palette. */

export const SWATCH_KEYS = [
  'ground',
  'ground-raised',
  'ground-sunk',
  'line',
  'ink-strong',
  'ink',
  'ink-muted',
  'ink-faint',
  'accent',
  'accent-strong',
  'accent-soft',
  'on-accent',
  'accent2',
  'accent2-soft',
] as const;
export type SwatchKey = (typeof SWATCH_KEYS)[number];
export type Swatch = Record<SwatchKey, string>;

const NIGHT: Swatch = {
  ground: tone('ground'),
  'ground-raised': tone('panel2'),
  'ground-sunk': tone('ground2'),
  line: tone('line4'),
  'ink-strong': tone('inkStrong'),
  ink: tone('ink2'),
  'ink-muted': tone('inkSoft'),
  'ink-faint': tone('inkFaint'),
  accent: tone('signal'),
  'accent-strong': tone('signal', 0.8),
  'accent-soft': tone('signalLine'),
  'on-accent': tone('signalInk'),
  accent2: tone('inkMuted'),
  'accent2-soft': tone('line2'),
};

/** The reader's palette, or the night tokens for anything it does not name. */
export function swatchOf(data: unknown): Swatch {
  const p =
    typeof data === 'object' && data !== null && 'palette' in data ? (data as { palette: unknown }).palette : undefined;
  if (typeof p !== 'object' || p === null) return NIGHT;
  const given = p as Record<string, unknown>;
  const out = { ...NIGHT };
  for (const k of SWATCH_KEYS) {
    const v = given[k];
    if (typeof v === 'string' && v.length < 48) out[k] = v;
  }
  return out;
}

/** A key that changes whenever the palette does, so a still scene knows to repaint. */
export const swatchKey = (s: Swatch): string => SWATCH_KEYS.map((k) => s[k]).join('|');

/** A face set for a box: the top catches the light, the two sides step down. */
export interface Faces {
  top: string;
  left: string;
  right: string;
}

/** The three materials of a 60/30/10 drawing, plus the secondary accent. */
export function materials(s: Swatch): Record<'paper' | 'ink' | 'accent' | 'accent2' | 'sunk', Faces> {
  return {
    paper: { top: s['ground-raised'], left: s.ground, right: s['ground-sunk'] },
    sunk: { top: s['ground-sunk'], left: s['ground-sunk'], right: s.ground },
    ink: { top: s['ink-muted'], left: s.ink, right: s['ink-strong'] },
    accent: { top: s.accent, left: s['accent-strong'], right: s['accent-strong'] },
    accent2: { top: s.accent2, left: s.accent2, right: s['accent2-soft'] },
  };
}

export type V3 = [number, number, number];

/** An isometric camera: x runs right and down, z left and down, y up. */
export interface Iso {
  ctx: CanvasRenderingContext2D;
  ox: number;
  oy: number;
  s: number;
  /** The pen colour for every edge. */
  pen: string;
}

const COS = Math.cos(Math.PI / 6);

export function at(c: Iso, [x, y, z]: V3): [number, number] {
  return [c.ox + (x - z) * COS * c.s, c.oy + (x + z) * 0.5 * c.s - y * c.s];
}

/** A flat polygon in 3D, filled and outlined in the pen. */
export function face(c: Iso, pts: V3[], fill: string | null, width = 1): void {
  const { ctx } = c;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const [x, y] = at(c, p);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (width > 0) {
    ctx.strokeStyle = c.pen;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

/** A box from (x, y, z) of size (w, h, d): its three faces toward the viewer. Drawn back to
 *  front by the caller, each box's fills hide the lines behind it: a hidden-line monoline. */
export function box(c: Iso, x: number, y: number, z: number, w: number, h: number, d: number, f: Faces): void {
  const X = x + w;
  const Y = y + h;
  const Z = z + d;
  face(
    c,
    [
      [x, Y, z],
      [X, Y, z],
      [X, Y, Z],
      [x, Y, Z],
    ],
    f.top,
  );
  face(
    c,
    [
      [x, y, Z],
      [X, y, Z],
      [X, Y, Z],
      [x, Y, Z],
    ],
    f.left,
  );
  face(
    c,
    [
      [X, y, z],
      [X, y, Z],
      [X, Y, Z],
      [X, Y, z],
    ],
    f.right,
  );
}

/** A line in 3D in any colour. */
export function seg(c: Iso, a: V3, b: V3, color: string, width = 1): void {
  const [x0, y0] = at(c, a);
  const [x1, y1] = at(c, b);
  c.ctx.strokeStyle = color;
  c.ctx.lineWidth = width;
  c.ctx.beginPath();
  c.ctx.moveTo(x0, y0);
  c.ctx.lineTo(x1, y1);
  c.ctx.stroke();
}

/** A dot in 3D: an LED, a stud, a sun. */
export function dot(c: Iso, p: V3, r: number, fill: string): void {
  const [x, y] = at(c, p);
  c.ctx.fillStyle = fill;
  c.ctx.beginPath();
  c.ctx.arc(x, y, r * c.s, 0, Math.PI * 2);
  c.ctx.fill();
}

/** A camera that fits a floor of `sx` by `sz` units with things up to `height` tall, centred. */
export function isoFit(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  sx: number,
  sz: number,
  height: number,
  pen: string,
): Iso {
  const deep = (sx + sz) / 2;
  const s = Math.min(w / ((sx + sz) * COS), h / (deep + height)) * 0.92;
  return { ctx, ox: w / 2 - ((sx - sz) * COS * s) / 2, oy: h / 2 - ((deep - height) * s) / 2, s, pen };
}
