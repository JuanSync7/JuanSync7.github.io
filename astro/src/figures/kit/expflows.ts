import {
  along,
  bead,
  card,
  cube,
  draw,
  ease,
  lerp,
  onFront,
  plinth,
  seg,
  type Part,
  type Pen,
  type V,
} from './hairline';

/** Experience icons, second half: agents, platform, visibility (see `experience-icon`). */

/** A requirement sheet; its path lights hop by hop into one task and out to that task's typed
 *  output (a square port in, a round port out). */
export function agents(p: Pen): void {
  plinth(p);
  const rows = [-2, 0, 2];
  const k = Math.floor(p.t * 0.45) % 3;
  const u = (p.t * 0.45) % 1;
  const root: V = [-2.1, 0.02, 0];
  rows.forEach((z, i) => {
    const on = i === k;
    seg(p, root, [-0.6, 0.02, z], on && u < 0.45 ? 'hi' : 'mid');
    seg(p, [0.6, 0.02, z], [1.9, 0.02, z], on && u > 0.45 && u < 0.85 ? 'hi' : 'mid');
  });
  const z = rows[k] ?? 0;
  if (u < 0.4) along(p, root, [-0.6, 0.02, z], u / 0.4);
  else if (u > 0.45 && u < 0.85) along(p, [0.6, 0.02, z], [1.9, 0.02, z], (u - 0.45) / 0.4);
  const parts: Part[] = [
    {
      box: { x0: -3.1, x1: -2.1, z0: -0.7, z1: 0.7, y0: 0, y1: 0.12 },
      then: () => [-0.35, 0, 0.35].forEach((r) => seg(p, [-2.95, 0.12, r], [-2.3, 0.12, r], 'lo')),
    },
    ...rows.map(
      (rz, i): Part => ({
        box: cube(0, rz, 0.6, 0.6, 0, 0.95),
        edge: i === k && u > 0.4 ? 'hi' : 'edge',
        then: () => {
          card(p, -0.3, -0.1, 0.35, 0.55, rz + 0.6, 'mid');
          bead(p, 0.3, 0.45, rz + 0.6, 2.2, i === k && u > 0.45 ? 'hi' : 'mid');
        },
      }),
    ),
    ...rows.map(
      (rz, i): Part => ({ box: cube(2.4, rz, 0.5, 0.5, 0, 0.14), edge: i === k && u > 0.85 ? 'hi' : 'edge' }),
    ),
  ];
  draw(p, parts);
}

/** Teams on the left, models on the right, one gateway between: every call goes through it. */
export function platform(p: Pen): void {
  plinth(p);
  const rows = [-1.9, 0, 1.9];
  const a = Math.floor(p.t * 0.5) % 3;
  const b = (a * 2 + 1) % 3;
  const u = (p.t * 0.5) % 1;
  const gw: V = [0, 0.02, 0];
  rows.forEach((z, i) => {
    const inbound = i === a && u < 0.45;
    const outbound = i === b && u > 0.55;
    seg(p, [-2.3, 0.02, z], gw, inbound ? 'hi' : 'mid', !inbound);
    seg(p, gw, [2.1, 0.02, z], outbound ? 'hi' : 'mid', !outbound);
  });
  if (u < 0.45) along(p, [-2.3, 0.02, rows[a] ?? 0], gw, u / 0.45);
  else if (u > 0.55) along(p, gw, [2.1, 0.02, rows[b] ?? 0], (u - 0.55) / 0.45);
  const at = u >= 0.4 && u <= 0.6;
  const parts: Part[] = [
    // A team: a plate with two people on it.
    ...rows.flatMap((z): Part[] => [
      { box: cube(-2.7, z, 0.5, 0.6, 0, 0.12) },
      { box: cube(-2.85, z - 0.25, 0.12, 0.12, 0.12, 0.5) },
      { box: cube(-2.55, z + 0.25, 0.12, 0.12, 0.12, 0.42) },
    ]),
    {
      box: cube(0, 0, 0.6, 0.6, 0, 0.6),
      edge: at ? 'hi' : 'edge',
      then: () => {
        for (const x of [-0.4, 0.4]) {
          seg(p, [x, 0.6, -0.4], [x, 1.35, -0.4], 'edge');
          bead(p, x, 1.35, -0.4, 2.2, at ? 'hi' : 'edge');
        }
      },
    },
    ...rows.map((z, i): Part => ({ box: cube(2.6, z, 0.42, 0.42, 0, 0.8 + 0.25 * i), edge: 'edge' })),
  ];
  draw(p, parts);
}

/** A rack of blades scanned top to bottom; beside it, the usage line and its forecast extending
 *  toward the dashed licence cap. */
export function visibility(p: Pen): void {
  plinth(p);
  const c = (p.t * 0.35) % 1;
  const ys = 2.75 - c * 2.6;
  const blades = (): void => {
    for (let i = 0; i < 6; i++) {
      const y = 0.2 + i * 0.43;
      const near = Math.abs(y + 0.16 - ys) < 0.25;
      onFront(p, -2.3, -0.5, y, y + 0.32, 0.4, near ? 'edge' : 'mid');
      bead(p, -0.7, y + 0.16, 0.4, 1.6, near ? 'hi' : 'lo');
    }
    seg(p, [-2.4, ys, 0.4], [-0.4, ys, 0.4], 'hi');
  };
  draw(p, [{ box: { x0: -2.4, x1: -0.4, z0: -1.8, z1: 0.4, y0: 0, y1: 2.9 }, then: blades }]);
  const z = 1.3;
  card(p, 0.2, 3, 0, 2.2, z, 'edge');
  seg(p, [0.4, 1.75, z], [2.8, 1.75, z], 'lo', true);
  const hist: V[] = [
    [0.4, 0.4, z],
    [0.8, 0.75, z],
    [1.2, 0.6, z],
    [1.6, 1, z],
    [1.9, 0.95, z],
  ];
  hist.slice(1).forEach((q, i) => seg(p, hist[i] ?? q, q, 'mid'));
  seg(p, [1.9, 0.95, z], lerp([1.9, 0.95, z], [2.75, 1.45, z], ease(c / 0.8)), 'hi', true);
}
