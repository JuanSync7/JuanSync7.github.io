import { card, cube, draw, ease, onFront, plinth, seg, shackle, type Part, type Pen, type Tier } from './hairline';

/** Experience icons, first half: adoption, knowledge, measurement (see `experience-icon`). */

/** One console wiring up the eight desks round it, one by one; then all of them hold, and reset. */
export function adoption(p: Pen): void {
  plinth(p);
  const ring = [-2.3, -2.3, 0, -2.6, 2.3, -2.3, 2.6, 0, 2.3, 2.3, 0, 2.6, -2.3, 2.3, -2.6, 0];
  const beat = p.t * 1.3;
  const n = Math.floor(beat) % 11;
  const parts: Part[] = [];
  for (let i = 0; i < 8; i++) {
    const x = ring[i * 2] ?? 0;
    const z = ring[i * 2 + 1] ?? 0;
    seg(p, [0, 0.02, 0], [x, 0.02, z], i < n ? (i === n - 1 ? 'hi' : 'mid') : 'lo', i >= n);
    const up = i < n - 1 ? 0.3 : i === n - 1 ? 0.3 * ease((beat % 1) * 2) : 0;
    const lit: Tier = i === n - 1 ? 'hi' : i < n ? 'edge' : 'mid';
    // A desk: a plate with a screen standing at its back edge.
    parts.push({
      box: cube(x, z, 0.5, 0.5, 0.02 + up, 0.14 + up),
      edge: lit,
      then: () => card(p, x - 0.32, x + 0.32, 0.14 + up, 0.56 + up, z - 0.3, lit),
    });
  }
  parts.push({
    box: cube(0, 0, 0.85, 0.85, 0.02, 1),
    then: () => {
      // A prompt drawn on the console's top: a chevron and a cursor.
      seg(p, [-0.5, 1, -0.35], [-0.15, 1, 0], 'edge');
      seg(p, [-0.15, 1, 0], [-0.5, 1, 0.35], 'edge');
      seg(p, [0, 1, 0.4], [0.5, 1, 0.4], n > 0 && n <= 8 ? 'hi' : 'mid');
    },
  });
  draw(p, parts);
}

/** The shared cabinet: a drawer slides out and a card is drawn from it; two locked project boxes
 *  stand apart. */
export function knowledge(p: Pen): void {
  plinth(p);
  const c = (p.t * 0.32) % 1;
  const out = 1.1 * ease(c / 0.2) * (1 - ease((c - 0.85) / 0.15));
  const lift = ease((c - 0.25) / 0.2) * (1 - ease((c - 0.75) / 0.12));
  const rows = [0.15, 0.9, 0.98, 1.73, 1.81, 2.56];
  const fronts = (): void => {
    for (let i = 0; i < 3; i++) {
      const a = rows[i * 2] ?? 0;
      const b = rows[i * 2 + 1] ?? 0;
      if (i !== 1) onFront(p, -2.65, -0.75, a, b, 0.6, 'mid');
      seg(p, [-1.95, (a + b) / 2, 0.6], [-1.45, (a + b) / 2, 0.6], 'mid');
    }
  };
  const open = (): void => {
    for (const k of [0.35, 0.7]) seg(p, [-2.6, 1.73, 0.6 + out * k], [-0.8, 1.73, 0.6 + out * k], 'lo');
    if (lift <= 0) return;
    const z = 0.6 + out * 0.52;
    const top = 1.73 + 0.9 * lift;
    card(p, -2.2, -1.2, 1.5, top, z, 'hi');
    for (const k of [0.45, 0.7]) seg(p, [-2.05, 1.5 + (top - 1.5) * k, z], [-1.35, 1.5 + (top - 1.5) * k, z], 'lo');
  };
  const locked = (x: number, z: number): Part => ({
    box: cube(x, z, 0.7, 0.7, 0, 1.1),
    then: () => {
      seg(p, [x - 0.7, 0.75, z + 0.7], [x + 0.7, 0.75, z + 0.7], 'lo');
      shackle(p, x, 1.1, z);
    },
  });
  draw(p, [
    { box: { x0: -2.8, x1: -0.6, z0: -1.4, z1: 0.6, y0: 0, y1: 2.7 }, then: fronts },
    { box: { x0: -2.65, x1: -0.75, z0: 0.5, z1: 0.6 + out, y0: 0.98, y1: 1.73 }, then: open },
    locked(1.7, -1.6),
    locked(1.7, 1.2),
  ]);
}

/** Seven bars; the reranker's drops 39 % below the dashed line of its old height, and recovers. */
export function measurement(p: Pen): void {
  plinth(p);
  const H = [1.4, 2, 1.7, 2.5, 3.1, 2.3, 1.8];
  const c = (p.t * 0.3) % 1;
  const drop = 0.39 * ease((c - 0.2) / 0.15) * (1 - ease((c - 0.85) / 0.12));
  draw(
    p,
    H.map((h, i): Part => {
      const x = -2.55 + i * 0.85;
      const mine = i === 4;
      return {
        box: cube(x, 0.9, 0.3, 0.3, 0, mine ? h * (1 - drop) : h),
        edge: mine ? 'hi' : 'edge',
        then: () => {
          if (!mine || drop < 0.02) return;
          seg(p, [x - 0.3, h, 1.2], [x + 0.3, h, 1.2], 'mid', true);
          seg(p, [x + 0.3, h, 1.2], [x + 0.3, h, 0.6], 'mid', true);
        },
      };
    }),
  );
}
