import { Plot, STREETS, type District } from './city';
import { datacentre, housing, lake, school, shops, substation, powerline } from './civic';
import { capacitors } from './industry';
import type { Rng } from './rng';

/** The hub's six levels, bottom (silicon) to top (where people live), each a district on a
 *  board 2.5 wide and 1.5 deep (`kit/city.ts`). Trains dock at the boards' edges; the
 *  stations are added where the tracks land, so these leave the edges clear. */

export const HUB_LEVELS = 6;

function silicon(P: Plot): void {
  const macros = [P.add('macro', 0.72, -0.34, 0.6, 0.36, 0.06), P.add('macro', -0.68, 0.36, 0.52, 0.34, 0.06)];
  const free = (x: number, z: number): boolean =>
    macros.every((m) => Math.abs(x - m.x) > m.w / 2 + 0.03 || Math.abs(z - m.z) > m.d / 2 + 0.03);
  for (let z = -0.58; z <= 0.58; z += 0.083)
    for (let x = -1.08; x < 1.06; ) {
      const w = P.r(0.04, 0.12);
      if (free(x + w / 2, z)) P.add('cell', x + w / 2, z, w * 0.82, 0.058, P.r(0.012, 0.03));
      x += w;
    }
  for (let x = -1.0; x <= 1.0; x += 0.25) P.line(x, -0.62, x, 0.62);
  // The die's edge: a power ring inside a ring of I/O pads, and a PLL in one corner.
  P.line(-1.12, -0.64, 1.12, -0.64);
  P.line(1.12, -0.64, 1.12, 0.64);
  P.line(1.12, 0.64, -1.12, 0.64);
  P.line(-1.12, 0.64, -1.12, -0.64);
  for (let x = -1.1; x <= 1.11; x += 0.11) for (const z of [-0.7, 0.7]) P.add('cell', x, z, 0.06, 0.035, 0.04);
  for (let z = -0.6; z <= 0.61; z += 0.12) for (const x of [-1.2, 1.2]) P.add('cell', x, z, 0.035, 0.06, 0.04);
  P.add('tank', 1.0, 0.5, 0.12, 0.12, 0.05);
}

function compute(P: Plot): void {
  // Open server rows on the left, the datacentre's halls on the right, fed by a substation.
  for (let z = -0.56; z <= 0.57; z += 0.28)
    for (let x = -1.05; x <= -0.2; x += 0.15) if (P.rng() > 0.1) P.add('rack', x, z, 0.1, 0.16, P.r(0.12, 0.22));
  for (let z = -0.42; z <= 0.43; z += 0.28) P.line(-1.15, z, -0.1, z);
  datacentre(P, 0.42, -0.1, 3);
  const out = substation(P, 0.95, 0.5);
  capacitors(P, 0.55, 0.42, 2, 5);
  powerline(P, out, [
    [0.75, 0.28],
    [0.2, 0.28],
    [-0.3, 0.6],
  ]);
}

function gateway(P: Plot): void {
  // A walled checkpoint: four gates, offices of odd shapes inside, a keep at the centre.
  for (let a = 0; a < 40; a++) {
    if (a % 10 === 5) continue;
    const t = (a / 40) * Math.PI * 2;
    P.add('wall', Math.cos(t) * 0.92, Math.sin(t) * 0.52, 0.1, 0.1, 0.07, 0, t);
  }
  for (let g = 0; g < 4; g++) {
    const a = ((g * 10 + 5) / 40) * Math.PI * 2;
    for (const s of [-1, 1])
      P.add('tank', Math.cos(a + s * 0.09) * 0.92, Math.sin(a + s * 0.09) * 0.52, 0.07, 0.07, 0.15);
    P.line(0, 0, Math.cos(a) * 1.2, Math.sin(a) * 0.7);
  }
  P.add('tower', 0, 0, 0.2, 0.2, 0.32);
  const shapes = ['hex', 'tri', 'block'] as const;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const kind = shapes[i % 3] ?? 'block';
    P.add(kind, Math.cos(a) * 0.55, Math.sin(a) * 0.3, P.r(0.08, 0.12), P.r(0.08, 0.12), P.r(0.08, 0.18), 0, a);
  }
  P.trees(0, 0.27, 0.3, 0.08, 4, false);
}

function knowledge(P: Plot): void {
  for (let i = -3; i <= 3; i++)
    for (let j = -2; j <= 2; j++)
      if (Math.abs(i) > 1 || Math.abs(j) > 1)
        P.add('block', i * 0.32, j * 0.27, P.r(0.14, 0.22), P.r(0.12, 0.19), P.r(0.05, 0.2));
  // The library stands in a park by a lake.
  lake(P, -0.08, 0.04, 0.3, 0.2);
  P.trees(0.16, -0.08, 0.16, 0.2, 5, false);
  P.add('tower', 0.18, 0.12, 0.1, 0.1, 0.24);
  for (const x of [-0.48, -0.16, 0.16, 0.48]) P.line(x, -0.7, x, 0.7);
  for (const z of [-0.4, -0.13, 0.13, 0.4]) P.line(-1.2, z, 1.2, z);
}

function apps(P: Plot): void {
  const kinds = ['block', 'block', 'tower', 'hex', 'tri'] as const;
  for (let i = -3; i <= 3; i++)
    for (let j = -2; j <= 2; j++) {
      if (P.rng() < 0.28) continue;
      const tall = P.rng() > 0.85;
      const kind = kinds[Math.floor(P.rng() * kinds.length)] ?? 'block';
      const s = kind === 'block' ? P.r(0.08, 0.17) : 0.1;
      P.add(
        kind,
        i * 0.33 + P.r(-0.04, 0.04),
        j * 0.27 + P.r(-0.03, 0.03),
        s,
        s,
        tall ? P.r(0.3, 0.38) : P.r(0.06, 0.18),
      );
    }
  for (const x of [-0.83, -0.17, 0.5]) P.line(x, -0.7, x, 0.7);
  for (const z of [-0.14, 0.4]) P.line(-1.2, z, 1.2, z);
}

function overcity(P: Plot): void {
  // Where people live: two streets of houses, apartment rows, a school, shops with a clinic
  // and a playground, a park and the stadium, all on the walkers' street grid.
  housing(P, -0.64, -0.5, 6);
  housing(P, -0.64, 0.5, 6);
  for (let i = 0; i < 3; i++) P.add('apartment', -0.82 + i * 0.17, 0, 0.12, 0.14, P.r(0.16, 0.3));
  for (let i = 0; i < 2; i++) P.add('apartment', -0.12 + i * 0.17, -0.25, 0.12, 0.14, P.r(0.18, 0.3));
  school(P, 0.62, -0.5);
  shops(P, 0.08, 0.17, 3);
  P.trees(0.0, 0.42, 0.42, 0.2, 7);
  P.add('tank', 0.66, 0.0, 0.38, 0.32, 0.05);
  P.trees(1.12, 0.25, 0.2, 0.4, 5);
  for (const x of STREETS.x) P.line(x, -0.7, x, 0.7);
  for (const z of STREETS.z) P.line(-1.2, z, 1.2, z);
}

/** Level k of the hub. */
export function hubLevel(k: number, rng: Rng): District {
  const P = new Plot(rng);
  [silicon, compute, gateway, knowledge, apps, overcity][k]?.(P);
  return P.done();
}
