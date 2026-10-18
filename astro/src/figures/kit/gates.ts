import { contact } from './analog';
import type { Rng } from './rng';
import type { Sketch } from './sketch';

/** Real CMOS gates as stick diagrams, for the silicon dive's cell level. A gate is drawn
 *  from a random series-parallel network of n-type transistors (the pull-down) and its dual
 *  of p-types (the pull-up), so every seed is a valid gate: an inverter, NAND, NOR or a
 *  compound AND-OR-invert. The layout is derived from the networks the way a textbook
 *  does it: one poly column per input, the transistors placed along their diffusion strip
 *  in input order, the strip broken where neighbours share no net, a contact at every
 *  terminal, metal down to the rails, an output strap joining both halves, and straps
 *  for the nets that a break separates. */

type Expr = { leaf: number } | { op: 's' | 'p'; kids: Expr[] };
interface Fet {
  a: string;
  b: string;
  g: number;
}

/** A random series-parallel tree over inputs first..first+n-1, in order. */
function tree(rng: Rng, first: number, n: number, op: 's' | 'p'): Expr {
  if (n === 1) return { leaf: first };
  const parts = 2 + Math.floor(rng() * Math.min(2, n - 1));
  const kids: Expr[] = [];
  let at = first;
  for (let k = 0; k < parts; k++) {
    const left = first + n - at;
    const size =
      k === parts - 1
        ? left
        : Math.max(1, Math.min(left - (parts - 1 - k), 1 + Math.floor(rng() * (left - (parts - 1 - k)))));
    kids.push(tree(rng, at, size, op === 's' ? 'p' : 's'));
    at += size;
  }
  return { op, kids };
}
const dual = (e: Expr): Expr => ('leaf' in e ? e : { op: e.op === 's' ? 'p' : 's', kids: e.kids.map(dual) });

/** The transistors of network e between nets a and b, in input order. */
function fets(e: Expr, a: string, b: string, out: Fet[], fresh: () => string): void {
  if ('leaf' in e) out.push({ a, b, g: e.leaf });
  else if (e.op === 'p') for (const k of e.kids) fets(k, a, b, out, fresh);
  else {
    let at = a;
    e.kids.forEach((k, i) => {
      const next = i === e.kids.length - 1 ? b : fresh();
      fets(k, at, next, out, fresh);
      at = next;
    });
  }
}

/** Each transistor turned so it shares its left net with its neighbour where it can;
 *  `brk[i]` is true where the strip must break before transistor i. */
function place(f: Fet[]): { lr: [string, string][]; brk: boolean[] } {
  const lr: [string, string][] = [];
  const brk: boolean[] = [];
  f.forEach((t, i) => {
    const prev = lr[i - 1]?.[1];
    const next = f[i + 1];
    if (prev === t.a) lr.push([t.a, t.b]);
    else if (prev === t.b) lr.push([t.b, t.a]);
    else lr.push(next && (next.a === t.a || next.b === t.a) ? [t.b, t.a] : [t.a, t.b]);
    brk.push(i > 0 && prev !== lr[i]?.[0]);
  });
  return { lr, brk };
}

export interface Gate {
  inputs: number;
  pull: { lr: [string, string][]; brk: boolean[] }[];
}

/** A random gate of 1..4 inputs: its pull-down and pull-up, each placed. */
export function gate(rng: Rng): Gate {
  const n = [1, 2, 2, 3, 3, 4][Math.floor(rng() * 6)] ?? 2;
  const down = tree(rng, 0, n, rng() < 0.5 ? 's' : 'p');
  let k = 0;
  const fresh = (): string => `x${k++}`;
  const [nf, pf]: Fet[][] = [[], []];
  fets(down, 'OUT', 'GND', nf, fresh);
  fets(dual(down), 'VDD', 'OUT', pf, fresh);
  return { inputs: n, pull: [place(pf), place(nf)] };
}

/** How wide gate g draws at `pitch` per column. */
export const width = (g: Gate, pitch: number): number =>
  (g.inputs + 1 + g.pull[0].brk.concat(g.pull[1].brk).filter(Boolean).length * 0.6) * pitch;

/** Draw gate g from x0 in a row whose VDD rail is at y = top and ground at top + h (or
 *  mirrored, `flip`, so neighbouring rows share their rails). */
export function stick(S: Sketch, g: Gate, x0: number, top: number, h: number, pitch: number, flip: boolean): void {
  const y = (f: number): number => (flip ? top + h * (1 - f) : top + h * f);
  // A column per input; a gap is widened where either strip breaks there.
  const xs: number[] = [];
  let x = x0 + pitch;
  for (let i = 0; i < g.inputs; i++) {
    if (g.pull.some((p) => p.brk[i])) x += pitch * 0.6;
    xs.push(x);
    x += pitch;
  }
  const c = pitch * 0.13;
  const outs: number[] = [];
  g.pull.forEach((p, side) => {
    const [b0, b1] = side === 0 ? [0.16, 0.38] : [0.62, 0.84];
    const rail = side === 0 ? 0 : 1;
    const strap = side === 0 ? 0.1 : 0.9;
    const nets = new Map<string, number[]>();
    const add = (net: string, at: number): void => {
      nets.set(net, [...(nets.get(net) ?? []), at]);
    };
    // Diffusion runs from transistor to transistor and stops at each break.
    let start = (xs[0] ?? x0) - pitch / 2;
    p.lr.forEach(([l, r], i) => {
      const [gx, nxt] = [xs[i] ?? 0, xs[i + 1]];
      if (i > 0 && p.brk[i]) {
        S.rect([start, Math.min(y(b0), y(b1)), (xs[i - 1] ?? 0) + pitch / 2, Math.max(y(b0), y(b1))], 2);
        start = gx - pitch / 2;
      }
      if (i === 0 || p.brk[i]) add(l, gx - pitch / 2);
      add(r, nxt === undefined || p.brk[i + 1] ? gx + pitch / 2 : (gx + nxt) / 2);
    });
    S.rect([start, Math.min(y(b0), y(b1)), (xs[xs.length - 1] ?? 0) + pitch / 2, Math.max(y(b0), y(b1))], 2);
    const mid = y((b0 + b1) / 2);
    for (const [net, at] of nets) {
      for (const tx of at) {
        contact(S, tx, mid, c);
        if (net === 'VDD' || net === 'GND') S.seg(tx, mid, tx, y(rail), 0);
        if (net === 'OUT') outs.push(tx);
      }
      if (at.length > 1 && net !== 'VDD' && net !== 'GND' && net !== 'OUT') {
        for (const tx of at) S.seg(tx, mid, tx, y(strap), 0);
        S.seg(Math.min(...at), y(strap), Math.max(...at), y(strap), 0);
      }
      if (net === 'OUT') for (const tx of at) S.seg(tx, mid, tx, y(0.5), 0);
    }
  });
  // The output strap joins both halves, out to the pin at the right; each input's poly
  // runs over both strips with its contact pad between them.
  const right = (xs[xs.length - 1] ?? x0) + pitch * 0.75;
  S.seg(Math.min(...outs, right), y(0.5), right, y(0.5), 0);
  S.rect([right - c, Math.min(y(0.42), y(0.58)), right + c, Math.max(y(0.42), y(0.58))], 1);
  xs.forEach((gx, i) => {
    S.seg(gx, y(0.1), gx, y(0.9), 1);
    const py = y(i % 2 ? 0.44 : 0.56);
    S.rect([gx - c * 1.4, py - c * 1.4, gx + c * 1.4, py + c * 1.4], 1);
  });
}
