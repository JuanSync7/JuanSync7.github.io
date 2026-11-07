import type { Rng } from './rng';

/** Stick layouts for CMOS and depletion-load NMOS. A gate starts with a random
 *  series-parallel n-type pull-down; CMOS uses its p-type dual, while the NMOS era uses
 *  a weak gate-source-tied depletion load. Seeds yield an inverter, NAND, NOR or a
 *  compound AND-OR-invert. The layout is derived from the networks the way a textbook
 *  does it: one poly column per input, the transistors placed along their diffusion strip
 *  in input order, the strip broken where neighbours share no net, a contact at every
 *  terminal, metal down to the rails, an output strap joining both halves, and straps
 *  for the nets that a break separates. */

export type GateExpr = { leaf: number } | { op: 's' | 'p'; kids: GateExpr[] };
type Expr = GateExpr;
export interface Fet {
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
  kind: 'cmos' | 'nmos-load';
  inputs: number;
  expression: GateExpr;
  pull: { lr: [string, string][]; brk: boolean[] }[];
}

/** A random gate of 1..4 inputs: its pull-down and pull-up, each placed. */
export function gate(rng: Rng, kind: Gate['kind'] = 'cmos'): Gate {
  const n = [1, 2, 2, 3, 3, 4][Math.floor(rng() * 6)] ?? 2;
  const down = tree(rng, 0, n, rng() < 0.5 ? 's' : 'p');
  let k = 0;
  const fresh = (): string => `x${k++}`;
  const [nf, pf]: Fet[][] = [[], []];
  fets(down, 'OUT', 'GND', nf, fresh);
  if (kind === 'nmos-load') {
    // A weak depletion-mode load has gate tied to source (OUT), so VGS=0 still
    // conducts. Unlike CMOS this ratioed family has a static path when OUT is low.
    return { kind, inputs: n, expression: down, pull: [{ lr: [['VDD', 'OUT']], brk: [false] }, place(nf)] };
  }
  fets(dual(down), 'VDD', 'OUT', pf, fresh);
  return { kind, inputs: n, expression: down, pull: [place(pf), place(nf)] };
}

/** How wide gate g draws at `pitch` per column. */
export const width = (g: Gate, pitch: number): number =>
  (g.inputs + 1 + g.pull[0].brk.concat(g.pull[1].brk).filter(Boolean).length * 0.6) * pitch;

/** The placed transistor netlist is independent of the drawing's routes. */
export function gateNetlist(g: Gate): (Fet & { type: 'p' | 'n' | 'd' })[] {
  return g.pull.flatMap((p, side) =>
    p.lr.map(([a, b], input) => ({
      a,
      b,
      g: side === 0 && g.kind === 'nmos-load' ? -1 : input,
      type: side === 0 ? (g.kind === 'nmos-load' ? ('d' as const) : ('p' as const)) : ('n' as const),
    })),
  );
}

export { stick } from './chip-gate-layout';
export type { GateLayout, GateWire, GateContact, GateTerminal } from './chip-gate-layout';
