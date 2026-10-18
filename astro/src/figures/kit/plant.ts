import { cone, cuboid, prism, rect, ring, ringAt, type Out } from './shells';

/** Wire outlines for the parts of a power island (battery containers, fuel cells,
 *  transformers, a fuel-rod rack), big sheds (a warehouse, a factory with a monitor roof),
 *  flat-topped mesas, and four more trees, in the part's own frame like `kit/shells.ts`.
 *  `kit/rigs.ts` dispatches to them. */

const TAU = Math.PI * 2;

export const PLANT: Record<string, (o: Out, w: number, d: number, h: number) => void> = {
  // A battery container: ribbed steel walls, doors at one end, cooling units on the roof.
  battery: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    prism(o, w, d, h, 4);
    for (let x = -hw + 0.02; x < hw - 0.01; x += 0.02) for (const z of [-hd, hd]) o.push(x, 0, z, x, h, z);
    o.push(hw, 0, 0, hw, h * 0.9, 0);
    for (const x of [-hw * 0.5, hw * 0.3]) cuboid(o, x - 0.015, h, -hd * 0.6, x + 0.015, h + 0.015, hd * 0.6);
  },
  // A fuel-cell module: its stack of plates showing as bands, a feed manifold on top.
  fuelcell: (o, w, d, h) => {
    prism(
      o,
      w,
      d,
      h,
      4,
      Array.from({ length: 7 }, (_, i) => i / 6),
    );
    o.push(
      -w / 2,
      h + 0.012,
      0,
      w / 2,
      h + 0.012,
      0,
      -w / 2,
      h,
      0,
      -w / 2,
      h + 0.012,
      0,
      w / 2,
      h,
      0,
      w / 2,
      h + 0.012,
      0,
    );
  },
  // A transformer: the tank, radiator fins down both sides, three bushings on top.
  transformer: (o, w, d, h) => {
    const [hw, hd] = [w * 0.35, d * 0.35];
    cuboid(o, -hw, 0, -hd, hw, h * 0.6, hd);
    for (let x = -hw; x <= hw + 1e-6; x += (hw * 2) / 5)
      for (const s of [-1, 1])
        o.push(x, h * 0.08, s * hd, x, h * 0.08, s * d * 0.5, x, h * 0.08, s * d * 0.5, x, h * 0.52, s * d * 0.5);
    for (const x of [-hw * 0.6, 0, hw * 0.6]) {
      o.push(x, h * 0.6, 0, x, h, 0);
      ringAt(o, x, h * 0.85, 0, w * 0.05, 5);
    }
  },
  // A rack of fuel rods standing in a pool: the pool's rim, then rows of rods.
  rods: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    rect(o, hw, hd, 0.004);
    rect(o, hw * 0.9, hd * 0.9, h * 0.15);
    const [nx, nz] = [Math.max(2, Math.round(w / 0.025)), Math.max(2, Math.round(d / 0.025))];
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < nz; j++) {
        const [x, z] = [-hw * 0.8 + (hw * 1.6 * i) / (nx - 1), -hd * 0.8 + (hd * 1.6 * j) / (nz - 1)];
        o.push(x, 0, z, x, h, z);
      }
  },
  // A warehouse: a long shed under a shallow gable, loading doors down one side, vents on
  // the ridge.
  warehouse: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    prism(o, w, d, h, 4);
    const top = h + d * 0.12;
    for (const x of [-hw, hw]) o.push(x, h, -hd, x, top, 0, x, top, 0, x, h, hd);
    o.push(-hw, top, 0, hw, top, 0);
    for (let x = -hw + 0.05; x < hw - 0.03; x += 0.07) {
      o.push(
        x,
        0,
        hd,
        x,
        h * 0.55,
        hd,
        x,
        h * 0.55,
        hd,
        x + 0.04,
        h * 0.55,
        hd,
        x + 0.04,
        h * 0.55,
        hd,
        x + 0.04,
        0,
        hd,
      );
      cuboid(o, x, top - 0.004, -0.008, x + 0.02, top + 0.01, 0.008);
    }
  },
  // A factory: a tall bay under a monitor roof (a raised strip of clerestory windows along
  // the ridge), a band of windows down its sides.
  factory: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    prism(o, w, d, h, 4, [0, 0.62, 0.78, 1]);
    cuboid(o, -hw * 0.95, h, -hd * 0.3, hw * 0.95, h * 1.18, hd * 0.3);
    for (let x = -hw * 0.9; x < hw * 0.9; x += 0.04)
      for (const z of [-hd * 0.3, hd * 0.3]) o.push(x, h, z, x, h * 1.18, z);
  },
  // A mesa: a flat-topped rock with its strata showing as bands, narrowing as it rises.
  mesa: (o, w, d, h) => {
    const shape = [1, 0.8, 0.95, 0.75, 0.9, 0.85, 0.7];
    const at = (i: number, f: number): [number, number, number] => {
      const a = (i / 7) * TAU;
      const k = (shape[i % 7] ?? 1) * (1 - f * 0.3);
      return [Math.cos(a) * (w / 2) * k, f * h, Math.sin(a) * (d / 2) * k];
    };
    for (const f of [0, 0.35, 0.7, 1]) for (let i = 0; i < 7; i++) o.push(...at(i, f), ...at(i + 1, f));
    for (let i = 0; i < 7; i++) o.push(...at(i, 0), ...at(i, 1));
  },
};

export const TREES: Record<string, (o: Out, w: number, d: number, h: number) => void> = {
  // A birch: a tall bare trunk and a narrow crown.
  birch: (o, w, d, h) => {
    o.push(0, 0, 0, 0, h * 0.45, 0);
    ring(o, h * 0.7, w * 0.3, d * 0.3, 5);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU;
      o.push(Math.cos(a) * w * 0.3, h * 0.7, Math.sin(a) * d * 0.3, 0, h, 0);
      o.push(Math.cos(a) * w * 0.3, h * 0.7, Math.sin(a) * d * 0.3, 0, h * 0.45, 0);
    }
  },
  // A bush: low and wide, a dome of two rings.
  bush: (o, w, d, h) => {
    ring(o, h * 0.25, w / 2, d / 2, 6);
    ring(o, h * 0.7, w * 0.32, d * 0.32, 6);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      o.push(
        Math.cos(a) * (w / 2),
        h * 0.25,
        Math.sin(a) * (d / 2),
        Math.cos(a) * w * 0.32,
        h * 0.7,
        Math.sin(a) * d * 0.32,
      );
    }
  },
  // A cypress: a tall flame of two tiers.
  cypress: (o, w, d, h) => {
    cone(o, w * 0.4, d * 0.4, h * 0.1, h * 0.65, 5);
    cone(o, w * 0.3, d * 0.3, h * 0.5, h, 5);
  },
  // An oak: a short trunk under a broad crown of three rings.
  oak: (o, w, d, h) => {
    o.push(0, 0, 0, 0, h * 0.4, 0);
    const rings: [number, number][] = [
      [0.4, 0.38],
      [0.68, 0.5],
      [0.95, 0.28],
    ];
    rings.forEach(([f, r]) => ring(o, f * h, w * r, d * r, 6));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      for (let k = 0; k < 2; k++) {
        const [[f0, r0], [f1, r1]] = [rings[k] ?? [0, 0], rings[k + 1] ?? [0, 0]];
        o.push(Math.cos(a) * w * r0, f0 * h, Math.sin(a) * d * r0, Math.cos(a) * w * r1, f1 * h, Math.sin(a) * d * r1);
      }
    }
  },
};
