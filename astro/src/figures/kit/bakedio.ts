import type { Baked, Layer } from './drawing/monodraw';
import type { V3 } from './drawing/monoline';

/** A baked hidden-line drawing as JSON: every coordinate a whole number of 1/8192 of a model
 *  unit (a scene spans a few units, so a step is far under a pixel), each number stored as its
 *  difference from the same axis of the point before, which gzip shrinks to about a third of
 *  the floats. An edge shares its vertices with the faces it bounds, so both round alike and the
 *  edge stays on its face. */

const STEP = 8192;

type Packed<T> = { [K in keyof T]: number[] };
interface PackedLayer {
  fill: Packed<Layer['fill']>;
  line: Packed<Layer['line']>;
}
export interface PackedBaked {
  root: PackedLayer;
  lives: { name: string; pivot: V3; layer: PackedLayer }[];
}

function pack(a: Float32Array): number[] {
  const q = Array.from(a, (v) => Math.round(v * STEP));
  return q.map((v, i) => (i >= 3 ? v - (q[i - 3] ?? 0) : v));
}

function unpack(d: readonly number[]): Float32Array {
  const q = new Int32Array(d.length);
  for (let i = 0; i < d.length; i++) q[i] = (d[i] ?? 0) + (i >= 3 ? (q[i - 3] ?? 0) : 0);
  return Float32Array.from(q, (v) => v / STEP);
}

function mapLayer<A, B>(
  l: { fill: Record<string, A | undefined>; line: Record<string, A | undefined> },
  f: (a: A) => B,
) {
  const each = (r: Record<string, A | undefined>): Record<string, B> => {
    const out: Record<string, B> = {};
    for (const [k, v] of Object.entries(r)) if (v !== undefined) out[k] = f(v);
    return out;
  };
  return { fill: each(l.fill), line: each(l.line) };
}

export function packBaked(b: Baked): PackedBaked {
  return {
    root: mapLayer(b.root, pack),
    lives: b.lives.map((l) => ({ name: l.name, pivot: l.pivot, layer: mapLayer(l.layer, pack) })),
  };
}

export function unpackBaked(p: PackedBaked): Baked {
  return {
    root: mapLayer(p.root, unpack),
    lives: p.lives.map((l) => ({ name: l.name, pivot: l.pivot, layer: mapLayer(l.layer, unpack) })),
  };
}

/** Narrows fetched JSON to a packed drawing, enough to trust its shape. */
export function isPackedBaked(v: unknown): v is PackedBaked {
  if (typeof v !== 'object' || v === null || !('root' in v) || !('lives' in v)) return false;
  const { root, lives } = v;
  return typeof root === 'object' && root !== null && 'fill' in root && 'line' in root && Array.isArray(lives);
}
