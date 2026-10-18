import { mid } from './maps';
import { BOUND, inset, overlaps, partition, WX, type Box, type Sketch } from './sketch';

/** The inner half of the city chain of plans for a zoom dive (`kit/sketch.ts`): a block (one
 *  building), a building's plan (one wing) and a floor plan (one room). The outer half is
 *  `kit/maps.ts`. */

/** A block: the kerb and pavement round it, lanes, crossings and parked cars on its streets,
 *  street trees, and lots of buildings, car parks and yards; the window is one building. */
export function block(S: Sketch): void {
  const kerb: Box = [-1.6, -0.74, 1.6, 0.74];
  S.rect(kerb, 1);
  S.rect(inset(kerb, 0.05), 2);
  for (const [x0, y0, x1, y1] of [
    [-1.92, -0.85, 1.92, -0.85],
    [-1.92, 0.85, 1.92, 0.85],
    [-1.75, -0.96, -1.75, 0.96],
    [1.75, -0.96, 1.75, 0.96],
  ] as const)
    S.dashed(x0, y0, x1, y1, 0.05, 0.04);
  for (const [cx, cy] of [
    [-1.6, -0.74],
    [1.6, -0.74],
    [-1.6, 0.74],
    [1.6, 0.74],
  ] as const) {
    S.hatch([cx - 0.06, cy + (cy < 0 ? -0.2 : 0.02), cx + 0.06, cy + (cy < 0 ? -0.02 : 0.2)], 0.025, 2);
    S.hatch([cx + (cx < 0 ? -0.15 : 0.02), cy - 0.05, cx + (cx < 0 ? -0.02 : 0.15), cy + 0.05], 0.025, 2, 'v');
  }
  for (let x = -1.45; x < 1.45; x += S.r(0.1, 0.22)) {
    if (S.chance(0.6)) S.rect([x, -0.79, x + 0.08, -0.76], 2);
    if (S.chance(0.6)) S.rect([x, 0.76, x + 0.08, 0.79], 2);
    S.circle(x, -0.715, 0.018);
    S.circle(x, 0.715, 0.018);
  }
  for (const lot of partition(S, inset(kerb, 0.08), inset(S.win, -0.03), 0.5)) {
    S.rect(lot, 2);
    const f = inset(lot, 0.03);
    if (f[2] - f[0] < 0.08 || f[3] - f[1] < 0.08) continue;
    const kind = S.int(0, 3);
    if (kind <= 1) {
      S.rect(f, 1);
      S.rect(inset(f, 0.015), 2);
      for (let k = 0; k < S.int(1, 4); k++) {
        const u: Box = [S.r(f[0] + 0.03, f[2] - 0.08), S.r(f[1] + 0.03, f[3] - 0.06), 0, 0];
        S.rect([u[0], u[1], u[0] + 0.05, u[1] + 0.03], 2);
      }
      if (kind === 1 && f[2] - f[0] > 0.25 && f[3] - f[1] > 0.2) S.rect(inset(f, 0.07), 1);
    } else if (kind === 2) {
      S.hatch(f, 0.035, 2, 'v');
      S.seg(f[0], (f[1] + f[3]) / 2, f[2], (f[1] + f[3]) / 2, 2);
    } else for (let k = 0; k < 6; k++) S.circle(S.r(f[0] + 0.03, f[2] - 0.03), S.r(f[1] + 0.03, f[3] - 0.03), 0.022);
  }
}

/** A building's plan: walls, the column grid in its dash-dot lines, stair and lift cores,
 *  a corridor, and rooms with their doors; the window is one wing. */
export function building(S: Sketch): void {
  const wall = inset(BOUND, 0.02);
  S.rect(wall, 0);
  S.rect(inset(wall, 0.025), 1);
  const [px, py] = [WX, 0.25];
  for (let x = S.win[0] - Math.floor((S.win[0] - wall[0]) / px) * px; x < wall[2]; x += px)
    for (let y = S.win[1] - Math.floor((S.win[1] - wall[1]) / py) * py; y < wall[3]; y += py) {
      S.rect([x - 0.012, y - 0.012, x + 0.012, y + 0.012], 1);
      if (Math.abs(y - S.win[1]) < 1e-6) S.dashed(x, wall[1], x, wall[3], 0.06, 0.03);
    }
  const up = S.win[1] - 0.2 > wall[1];
  const cy = up ? S.win[1] - 0.12 : S.win[3] + 0.04;
  S.seg(wall[0] + 0.025, cy, wall[2] - 0.025, cy, 1);
  S.seg(wall[0] + 0.025, cy + 0.08, wall[2] - 0.025, cy + 0.08, 1);
  S.taken.push([wall[0], cy, wall[2], cy + 0.08]);
  for (let i = 0; i < S.int(1, 2); i++) {
    const c = S.place(0.36, 0.3, inset(wall, 0.05));
    if (!c) continue;
    S.rect(c, 1);
    S.hatch([c[0], c[1], (c[0] + c[2]) / 2, c[3]], 0.025, 2);
    S.rect([(c[0] + c[2]) / 2 + 0.02, c[1] + 0.02, c[2] - 0.02, (c[1] + c[3]) / 2], 2);
    S.seg((c[0] + c[2]) / 2 + 0.02, c[1] + 0.02, c[2] - 0.02, (c[1] + c[3]) / 2, 2);
  }
  for (const room of partition(S, inset(wall, 0.025), inset(S.win, -0.01), 0.4)) {
    if (S.taken.some((t, i) => i > 0 && overlaps(t, room, -0.02))) continue;
    S.rect(room, 2);
    S.arc(room[0], room[3], 0.07, -Math.PI / 2, 0, 2, 6);
    S.seg(room[0], room[3], room[0], room[3] - 0.07, 2);
  }
}

/** A floor plan: outside walls with windows set in them, rooms with doors, and in each room
 *  what it is for: desks and chairs, a meeting table, washrooms, a stair, a lounge, a
 *  kitchen; the window is one room. */
export function floor(S: Sketch): void {
  const wall = inset(BOUND, 0.02);
  S.rect(wall, 0);
  S.rect(inset(wall, 0.03), 0);
  for (let x = wall[0] + 0.15; x < wall[2] - 0.2; x += 0.3)
    for (const y of [wall[1] + 0.015, wall[3] - 0.015]) S.seg(x, y, x + 0.16, y, 2);
  for (const b of partition(S, inset(wall, 0.03), inset(S.win, -0.012), 0.6)) {
    const r = inset(b, 0.012);
    const [w, h] = [r[2] - r[0], r[3] - r[1]];
    if (w < 0.12 || h < 0.12) continue;
    S.rect(r, 1);
    S.arc(r[0] + 0.02, r[1], 0.08, 0, Math.PI / 2, 2, 6);
    S.seg(r[0] + 0.02, r[1], r[0] + 0.02, r[1] + 0.08, 2);
    const [cx, cy] = mid(r);
    const kind = S.int(0, 5);
    if (kind <= 1)
      for (let x = r[0] + 0.12; x < r[2] - 0.14; x += 0.2)
        for (let y = r[1] + 0.12; y < r[3] - 0.1; y += 0.2) {
          S.rect([x, y, x + 0.12, y + 0.06], 2);
          S.circle(x + 0.06, y + 0.085, 0.018);
        }
    else if (kind === 2) {
      const t: Box = [cx - w * 0.28, cy - h * 0.16, cx + w * 0.28, cy + h * 0.16];
      S.rect(t, 1);
      for (let x = t[0] + 0.04; x < t[2]; x += 0.08) {
        S.circle(x, t[1] - 0.03, 0.018);
        S.circle(x, t[3] + 0.03, 0.018);
      }
    } else if (kind === 3) {
      for (let x = r[0]; x < r[2] - 0.08; x += 0.1) S.rect([x, r[1], x + 0.1, r[1] + 0.14], 2);
      for (let x = r[0] + 0.06; x < r[2] - 0.04; x += 0.1) S.circle(x, r[3] - 0.05, 0.022);
    } else if (kind === 4) {
      S.hatch([cx - 0.12, r[1] + 0.05, cx + 0.12, r[3] - 0.05], 0.03, 2);
      S.seg(cx, r[3] - 0.08, cx, r[1] + 0.08, 1);
    } else {
      S.poly(
        [
          [cx - 0.12, cy - 0.06],
          [cx - 0.12, cy + 0.06],
          [cx + 0.12, cy + 0.06],
          [cx + 0.12, cy - 0.06],
        ],
        1,
      );
      S.circle(cx, cy - 0.12, 0.04);
      S.rect([r[0], r[3] - 0.05, r[2], r[3]], 2);
    }
  }
}
