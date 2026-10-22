import { fine, pt, rect, slab, type Paint } from './iso2d';
import { ink, mix } from './ink';

/** The bottom of one logic die, cut open for `die-section` (`kit/section.ts`): the silicon
 *  with its wells and isolation trenches, the gate-all-around transistors (FEOL), and the
 *  contacts that reach down to them (MOL). The block runs x across the gates and z along
 *  them, and is cut twice: at z = 0, along one nFET's channel, so its sheets show passing
 *  through every gate; and at x = W, through a gate, so that gate shows wrapping the sheets
 *  of an nFET and a pFET at once: one CMOS inverter's input. */

export const W = 1.12;
export const D = 0.9;
export type Lit = (part: string) => Paint;

/** Contacted gate pitch is the unit everything else is drawn to (about 48 nm at N2). */
export const GATES = Array.from({ length: 14 }, (_, i) => -0.96 + i * 0.16);
/** A single diffusion break: a dummy gate with no sheets, cut down into the silicon. */
const BREAK = 6;
/** Source and drain, between gates: one before the first gate, then one after each. */
export const SD = [-1.04, ...GATES.slice(0, -1).map((g) => g + 0.08)];
/** Active strips along x: two nFET rows in front over the p-well, two pFET rows behind. */
const STRIPS = [
  [-0.12, 0],
  [-0.34, -0.22],
  [-0.68, -0.56],
  [-0.9, -0.78],
] as const;
const WELL = -0.45;
const GATE_CONTACT = (i: number): boolean => i % 3 === 1 && i !== BREAK;
const SHEETS = [0.2228, 0.2703, 0.3178];
const SH = 0.023;

/** The two section faces: the cut along the channel (z = 0) and the cut through a gate (x = W). */
type Face = (a: number, y: number) => [number, number];
export const front =
  (p: Paint) =>
  (a: number, y: number): [number, number] =>
    pt(p, a, y, 0);
export const side =
  (p: Paint) =>
  (a: number, y: number): [number, number] =>
    pt(p, W, y, a);

/** Solids the section cuts through: [a0, y0, a1, y1] each, filled and outlined, `taper` wider at
 *  the top as a damascene trench is etched. Metal is a step brighter than the dielectric. */
export function bars(p: Paint, on: (a: number, y: number) => [number, number], q: number[], metal = true, taper = 0) {
  const { ctx } = p;
  ctx.beginPath();
  for (let i = 0; i + 3 < q.length; i += 4) {
    const [a0 = 0, y0 = 0, a1 = 0, y1 = 0] = q.slice(i, i + 4);
    [on(a0 - taper, y1), on(a1 + taper, y1), on(a1, y0), on(a0, y0)].forEach(([x, y], k) =>
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
    );
    ctx.closePath();
  }
  if (metal) {
    ctx.fillStyle = p.lit ? mix('panelSignal', 'signalLine', 0.7) : mix('panel2', 'line4', 0.55);
    ctx.fill();
  }
  ctx.strokeStyle = p.lit ? ink.signal(0.9) : ink.line(metal ? 0.42 : 0.3);
  ctx.stroke();
}

/** Lines across a section face: [a0, y0, a1, y1] each. */
export function marks(p: Paint, on: (a: number, y: number) => [number, number], q: number[], a: number) {
  const { ctx } = p;
  ctx.beginPath();
  for (let i = 0; i + 3 < q.length; i += 4) {
    const [m, n] = [on(q[i] ?? 0, q[i + 1] ?? 0), on(q[i + 2] ?? 0, q[i + 3] ?? 0)];
    ctx.moveTo(m[0], m[1]);
    ctx.lineTo(n[0], n[1]);
  }
  ctx.strokeStyle = p.lit ? ink.signal(Math.min(0.8, a * 2.2)) : ink.line(a);
  ctx.stroke();
}

/** The wafer: a p-well under the nFET rows and an n-well under the pFETs, each strip a ridge
 *  of silicon between oxide-filled trenches (STI), and the diffusion break cut into it. */
export function substrate(at: Lit): void {
  const p = at('substrate');
  slab(p, -W, -D, W, 0, 0, 0.2);
  const [f, s] = [front(p), side(p)];
  marks(p, f, [-W, 0.08, W, 0.08], 0.2);
  marks(p, s, [-D, 0.08, 0, 0.08, WELL, 0.08, WELL, 0.2], 0.24);
  bars(p, f, [-0.03, 0.14, 0.03, 0.2], false);
  bars(p, s, [-0.22, 0.15, -0.12, 0.2, -0.56, 0.15, -0.34, 0.2, -0.78, 0.15, -0.68, 0.2], false, 0.01);
  const o: number[] = [];
  for (const [z0, z1] of STRIPS) rect(o, -W, z0, W, z1, 0.201);
  o.push(-0.03, 0.201, -D, -0.03, 0.201, 0, 0.03, 0.201, -D, 0.03, 0.201, 0);
  fine(p, o, 0.2);
}

/** The transistors. Along the channel: gates of metal over a thin high-k layer, each topped by
 *  a dielectric cap and flanked by spacers, with three silicon sheets passing through it, and
 *  the source and drain grown as epitaxial crystal between gates, each under its trench
 *  contact. Through the gate: the same gate wrapping the sheets of all four strips, its
 *  work-function metal changing between the n and p halves. */
export function transistors(at: Lit): void {
  const p = at('transistors');
  slab(p, -W, -D, W, 0, 0.2, 0.504);
  const [f, s] = [front(p), side(p)];
  const gates: number[] = [];
  const caps: number[] = [];
  const sheets: number[] = [];
  const lines: number[] = [];
  GATES.forEach((g, i) => {
    const g1 = Math.min(W, g + 0.03);
    if (i === BREAK) bars(p, f, [g - 0.03, 0.2, g1, 0.447], false);
    else {
      gates.push(g - 0.03, 0.2, g1, 0.447);
      for (const y of SHEETS) sheets.push(g - 0.05, y, Math.min(W, g + 0.05), y + SH);
    }
    if (!GATE_CONTACT(i)) caps.push(g - 0.03, 0.447, g1, 0.504);
    lines.push(g - 0.042, 0.2, g - 0.042, 0.504);
    if (g + 0.042 < W) lines.push(g + 0.042, 0.2, g + 0.042, 0.504);
  });
  bars(p, f, gates);
  bars(p, f, caps, false);
  marks(p, f, lines, 0.22);
  // The epitaxial source and drain: a faceted crystal between each pair of gates.
  const epi: number[] = [];
  for (const m of SD)
    for (const [a, b] of [
      [-0.05, 0.2],
      [-0.05, 0.3615],
      [0, 0.3995],
      [0.05, 0.3615],
      [0.05, 0.2],
    ] as const)
      epi.push(m + a, b);
  const { ctx } = p;
  ctx.beginPath();
  for (let i = 0; i < epi.length; i += 10)
    for (let k = 0; k < 10; k += 2) {
      const [x, y] = f(Math.max(-W, epi[i + k] ?? 0), epi[i + k + 1] ?? 0);
      if (k) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
      if (k === 8) ctx.closePath();
    }
  ctx.fillStyle = p.lit ? ink.signal(0.14) : ink.line(0.12);
  ctx.fill();
  ctx.strokeStyle = p.lit ? ink.signal(0.8) : ink.line(0.45);
  ctx.stroke();
  // Through the last gate: its metal round the sheets of every strip, and the n/p seam.
  bars(p, s, [-D, 0.2, 0, 0.447]);
  bars(p, s, [-D, 0.447, 0, 0.504], false);
  const along = sheets.length;
  for (const [z0, z1] of STRIPS) for (const y of SHEETS) sheets.push(z0 + 0.01, y, z1 - 0.01, y + SH);
  marks(p, s, [WELL, 0.2, WELL, 0.447], 0.504);
  silicon(p, f, s, sheets, along);
  const o: number[] = [];
  for (const x of GATES.flatMap((g) => [g - 0.03, Math.min(W, g + 0.03)])) o.push(x, 0.506, -D, x, 0.506, 0);
  fine(p, o, 0.12);
  contacts(at, f);
}

/** The sheets are the only crystal the current flows through: drawn brightest of the layer. */
function silicon(p: Paint, f: Face, s: Face, q: number[], along: number): void {
  const { ctx } = p;
  ctx.beginPath();
  for (let i = 0; i + 3 < q.length; i += 4) {
    const on = i < along ? f : s;
    const [a0 = 0, y0 = 0, a1 = 0, y1 = 0] = q.slice(i, i + 4);
    [on(a0, y0), on(a1, y0), on(a1, y1), on(a0, y1)].forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }
  ctx.fillStyle = p.lit ? ink.signal(0.35) : ink.line(0.3);
  ctx.fill();
}

/** Trench contacts down to every source and drain, through a silicide skin, and the gate
 *  contacts' feet through the caps; on top, the trench contacts split between n and p rows. */
function contacts(at: Lit, f: Face): void {
  const p = at('contacts');
  const q = SD.flatMap((m) => [Math.max(-W, m - 0.032), 0.3805, m + 0.032, 0.504]);
  GATES.forEach((g, i) => GATE_CONTACT(i) && q.push(g - 0.015, 0.447, g + 0.015, 0.504));
  bars(p, f, q);
  const o: number[] = [];
  for (const m of SD.slice(1))
    for (const [z0, z1] of [
      [-0.504, -0.02],
      [-0.88, -0.5],
    ] as const)
      rect(o, m - 0.032, z0, m + 0.032, z1, 0.5059);
  fine(p, o, 0.14);
}

/** The middle of the line: a via onto most trench contacts, and a gate contact straight down
 *  through the gate's cap over the active area; through the last gate, the inverter's input
 *  lands on the seam between its n and p halves. */
export function middle(at: Lit): void {
  const body = at('contacts');
  slab(body, -W, -D, W, 0, 0.504, 0.637);
  const [f, s] = [front(body), side(body)];
  const q: number[] = [];
  SD.slice(1).forEach((m, j) => j % 3 !== 1 && q.push(m - 0.018, 0.504, m + 0.018, 0.637));
  GATES.forEach((g, i) => GATE_CONTACT(i) && q.push(g - 0.015, 0.504, g + 0.015, 0.637));
  bars(body, f, q);
  bars(body, s, [WELL - 0.02, 0.504, WELL + 0.02, 0.637]);
  // Their feet on top, over the n rows and the p rows.
  const o: number[] = [];
  for (let i = 0; i + 3 < q.length; i += 4)
    for (const z of [-0.2, -0.72]) rect(o, q[i] ?? 0, z - 0.018, q[i + 2] ?? 0, z + 0.018, 0.6389);
  fine(body, o, 0.22);
}
