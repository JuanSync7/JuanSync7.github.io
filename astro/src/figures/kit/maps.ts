import { BOUND, inset, partition, type Box, type Pt, type Sketch } from './sketch';

/** The outer half of the city chain of plans for a zoom dive (`kit/sketch.ts`), each the
 *  window into the next: a region map (one city), a city (one district), a district (one
 *  block). The inner half is `kit/rooms.ts`. Coasts, rivers, streets and lots are seeded. */

export const mid = (b: Box): Pt => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

/** A region: a coast with its depth lines, hills in contours, a river to the sea, a lake,
 *  towns joined to the city by roads, a railway with its sleepers, and woods. */
export function region(S: Sketch): void {
  const [wx, wy] = S.w;
  const sea = wy > 0 ? S.win[1] - S.r(0.15, 0.3) : S.win[3] + S.r(0.15, 0.3);
  const coast = Math.abs(sea) < 0.85 ? S.wavy([BOUND[0], sea], [BOUND[2], sea + S.r(-0.1, 0.1)], 0.12) : null;
  if (coast) {
    S.poly(coast, 0);
    for (const d of [0.05, 0.11, 0.2])
      S.poly(
        coast.map(([x, y]): Pt => [x, y + (wy > 0 ? -d : d)]),
        2,
      );
    S.taken.push(wy > 0 ? [BOUND[0], BOUND[1], BOUND[2], sea + 0.15] : [BOUND[0], sea - 0.15, BOUND[2], BOUND[3]]);
  }
  for (let i = 0; i < S.int(1, 2); i++) {
    const b = S.place(S.r(0.5, 0.9), S.r(0.3, 0.5));
    if (!b) continue;
    const [cx, cy] = mid(b);
    for (let k = 1; k <= 4; k++)
      S.poly(S.blob(cx, cy, ((b[2] - b[0]) / 2) * (k / 4), ((b[3] - b[1]) / 2) * (k / 4), 0.2), 2, true);
  }
  const lake = S.place(0.3, 0.16);
  if (lake) {
    const [cx, cy] = mid(lake);
    S.poly(S.blob(cx, cy, 0.15, 0.08), 1, true);
    S.poly(S.blob(cx, cy, 0.1, 0.05), 2, true);
  }
  const src: Pt = [S.chance(0.5) ? BOUND[0] + 0.1 : BOUND[2] - 0.1, wy > 0 ? BOUND[3] : BOUND[1]];
  S.poly(S.wavy(src, [wx + S.r(-1, 1), coast ? sea : -src[1]], 0.25), 1);
  const towns: Pt[] = [];
  for (let i = 0; i < S.int(4, 7); i++) {
    const s = S.r(0.1, 0.22);
    const b = S.place(s, s * 0.7);
    if (!b) continue;
    S.rect(b, 1);
    S.grid(b, S.int(2, 4), S.int(2, 3), 2);
    towns.push(mid(b));
  }
  for (const t of towns) S.poly(S.wavy(t, [wx, wy], 0.08), 1);
  const end: Pt = [wx < 0 ? BOUND[2] : BOUND[0], S.r(-0.6, 0.6)];
  const rail = S.wavy([wx, wy], end, 0.1, 40);
  S.poly(rail, 2);
  for (let i = 1; i < rail.length; i++) {
    const [a, b] = [rail[i - 1], rail[i]];
    if (!a || !b) continue;
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(dx, dy) || 1;
    S.seg(b[0] - (dy / l) * 0.015, b[1] + (dx / l) * 0.015, b[0] + (dy / l) * 0.015, b[1] - (dx / l) * 0.015, 2);
  }
  for (let i = 0; i < S.int(2, 4); i++) {
    const b = S.place(0.3, 0.2);
    if (b) for (let k = 0; k < 18; k++) S.dot(S.r(b[0], b[2]), S.r(b[1], b[3]));
  }
}

/** A city: blocks between streets, a river with its banks, a ring road and avenues, parks. */
export function city(S: Sketch): void {
  const side = S.w[0] > 0 ? S.win[0] - S.r(0.3, 0.6) : S.win[2] + S.r(0.3, 0.6);
  const bank = S.wavy([side, BOUND[1] - 0.1], [side + S.r(-0.3, 0.3), BOUND[3] + 0.1], 0.12);
  const at = (y: number): number => {
    const i = Math.round(((y - BOUND[1] + 0.1) / (BOUND[3] - BOUND[1] + 0.2)) * (bank.length - 1));
    return bank[Math.max(0, Math.min(bank.length - 1, i))]?.[0] ?? side;
  };
  const river = Math.abs(side) < 1.8;
  if (river) {
    S.poly(
      bank.map(([x, y]): Pt => [x - 0.06, y]),
      1,
    );
    S.poly(
      bank.map(([x, y]): Pt => [x + 0.06, y]),
      1,
    );
  }
  for (const b of partition(S, BOUND, S.win, 0.24)) {
    const r = inset(b, 0.018);
    const [cx, cy] = mid(r);
    if (river && Math.abs(cx - at(cy)) < 0.1 + (r[2] - r[0]) / 2) continue;
    S.rect(r, 2);
    if (S.chance(0.1)) for (let k = 0; k < 12; k++) S.dot(S.r(r[0], r[2]), S.r(r[1], r[3]));
    else if (r[2] - r[0] > r[3] - r[1]) S.seg(cx, r[1], cx, r[3], 2);
    else S.seg(r[0], cy, r[2], cy, 2);
  }
  S.poly(S.blob(S.w[0] * 0.5, S.w[1] * 0.5, S.r(1.1, 1.5), S.r(0.55, 0.75), 0.08, 48), 1, true);
  for (let i = 0; i < S.int(1, 3); i++) S.seg(S.w[0], S.w[1], S.r(-1.8, 1.8), i % 2 ? BOUND[1] : BOUND[3], 1);
}

/** A district: blocks of lots and buildings, a park, a plaza or a sports ground, with the
 *  streets' centre lines dashed. */
export function district(S: Sketch): void {
  for (const b of partition(S, BOUND, inset(S.win, -0.04), 0.6)) {
    if (b[1] > BOUND[1] + 0.01) S.dashed(b[0], b[1], b[2], b[1], 0.03, 0.03);
    if (b[0] > BOUND[0] + 0.01) S.dashed(b[0], b[1], b[0], b[3], 0.03, 0.03);
    const r = inset(b, 0.05);
    if (r[2] - r[0] < 0.1 || r[3] - r[1] < 0.1) continue;
    S.rect(r, 1);
    const [cx, cy] = mid(r);
    const kind = S.int(0, 6);
    if (kind === 4) {
      S.poly(S.wavy([r[0], cy], [r[2], cy + S.r(-0.1, 0.1)], 0.08), 2);
      for (let k = 0; k < 14; k++) S.circle(S.r(r[0] + 0.03, r[2] - 0.03), S.r(r[1] + 0.03, r[3] - 0.03), 0.018);
    } else if (kind === 5) {
      const rad = Math.min(r[2] - r[0], r[3] - r[1]) * 0.35;
      S.circle(cx, cy, rad, 1);
      for (let a = 0; a < 8; a++) S.seg(cx, cy, cx + Math.cos(a * 0.785) * rad, cy + Math.sin(a * 0.785) * rad, 2);
    } else if (kind === 6 && r[2] - r[0] > 0.3) {
      const [hw, hh] = [(r[2] - r[0]) * 0.4, (r[3] - r[1]) * 0.35];
      S.arc(cx - hw + hh, cy, hh, Math.PI / 2, Math.PI * 1.5, 1);
      S.arc(cx + hw - hh, cy, hh, -Math.PI / 2, Math.PI / 2, 1);
      S.seg(cx - hw + hh, cy - hh, cx + hw - hh, cy - hh, 1);
      S.seg(cx - hw + hh, cy + hh, cx + hw - hh, cy + hh, 1);
      S.rect([cx - hw + hh, cy - hh * 0.6, cx + hw - hh, cy + hh * 0.6], 2);
    } else
      for (const lot of partition(S, r, null, 0.14)) {
        const f = inset(lot, S.r(0.012, 0.03));
        S.rect(lot, 2);
        S.rect(f, 1);
        if (S.chance(0.3) && f[2] - f[0] > 0.08 && f[3] - f[1] > 0.08) S.rect(inset(f, 0.03), 2);
      }
  }
}
