import { cuboid, prism, rect, ring, type Out } from './shells';

/** Wire outlines for civic grounds and hydro plant (`kit/city.ts` kinds), each in the part's
 *  own frame like `kit/shells.ts`: a library's storeys, portico and clock tower; the benches,
 *  lamps, people, flower beds and fountain of its park; and a dam's arch wall, reservoir,
 *  powerhouse, generators and turbine runners. What turns in them is drawn by `turning`
 *  (`kit/citylife.ts`). */

const TAU = Math.PI * 2;
type Shape = (o: Out, w: number, d: number, h: number) => void;

/** How far an arch dam bows upstream at its middle, for a dam (or its reservoir) d long. */
export const bow = (d: number): number => d * 0.16;
/** A polyline through pts as segments. */
const poly = (o: Out, pts: number[][]): void => {
  for (let i = 0; i + 1 < pts.length; i++) o.push(...(pts[i] ?? []), ...(pts[i + 1] ?? []));
};
/** A circle standing in a vertical face: across x at z = at, or across z at x = at. */
function disc(o: Out, face: 'x' | 'z', at: number, c: number, y: number, r: number, n = 12): void {
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const [u, v] = [c + Math.cos((i / n) * TAU) * r, y + Math.sin((i / n) * TAU) * r];
    return face === 'x' ? [u, v, at] : [at, v, u];
  });
  poly(o, pts);
}

export const GROUNDS: Record<string, Shape> = {
  // A library storey: its walls, a cornice under the top, and tall windows on every face.
  storey: (o, w, d, h) => {
    prism(o, w, d, h, 4, [0, 0.88, 1]);
    const [hw, hd] = [w / 2, d / 2];
    for (let x = -hw + 0.03; x < hw - 0.02; x += 0.05)
      for (const z of [-hd, hd]) o.push(x, h * 0.18, z, x, h * 0.72, z);
    for (let z = -hd + 0.03; z < hd - 0.02; z += 0.05)
      for (const x of [-hw, hw]) o.push(x, h * 0.18, z, x, h * 0.72, z);
  },
  // A portico on the +z face: steps, a row of columns, the entablature and the pediment.
  portico: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    for (let k = 0; k < 3; k++) rect(o, hw + k * 0.012, hd + k * 0.012, h * 0.08 * (1 - k / 3));
    const n = Math.max(4, Math.round(w / 0.05));
    for (let i = 0; i <= n; i++) {
      const x = -hw * 0.92 + (i / n) * hw * 1.84;
      o.push(x, h * 0.08, hd * 0.8, x, h * 0.72, hd * 0.8);
    }
    cuboid(o, -hw, h * 0.72, -hd, hw, h * 0.82, hd);
    for (const z of [-hd, hd])
      poly(o, [
        [-hw, h * 0.82, z],
        [0, h, z],
        [hw, h * 0.82, z],
      ]);
    o.push(0, h, -hd, 0, h, hd);
  },
  // A clock tower: the shaft, the clock stage with a face on every side, the belfry's
  // openings, and a pyramid roof to a finial.
  clocktower: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    prism(o, w, d, h * 0.86, 4, [0, 0.62, 0.84, 1]);
    for (const s of [-1, 1]) {
      disc(o, 'x', s * hd, 0, h * 0.62, w * 0.3);
      disc(o, 'z', s * hw, 0, h * 0.62, d * 0.3);
      for (const f of [-0.25, 0.25]) {
        o.push(f * w, h * 0.74, s * hd, f * w, h * 0.82, s * hd);
        o.push(s * hw, h * 0.74, f * d, s * hw, h * 0.82, f * d);
      }
    }
    for (const [x, z] of [
      [-hw, -hd],
      [hw, -hd],
      [hw, hd],
      [-hw, hd],
    ] as const)
      o.push(x, h * 0.86, z, 0, h * 0.97, 0);
    o.push(0, h * 0.97, 0, 0, h, 0);
  },
  // A park bench: seat, back and legs.
  bench: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    rect(o, hw, hd, h * 0.5);
    o.push(-hw, h, -hd, hw, h, -hd);
    for (const x of [-hw, hw]) o.push(x, 0, hd, x, h * 0.5, hd, x, 0, -hd, x, h, -hd);
  },
  // A lamppost: the pole, its bracket, and the lantern.
  lamp: (o, w, d, h) => {
    o.push(0, 0, 0, 0, h * 0.82, 0);
    cuboid(o, -w * 0.35, h * 0.82, -d * 0.35, w * 0.35, h, d * 0.35);
    ring(o, 0.002, w * 0.5, d * 0.5, 6);
  },
  // A person standing: legs, body, arms and a head.
  person: (o, w, d, h) => {
    o.push(-w * 0.2, 0, 0, 0, h * 0.45, 0, w * 0.2, 0, 0, 0, h * 0.45, 0, 0, h * 0.45, 0, 0, h * 0.78, 0);
    o.push(-w * 0.3, h * 0.5, 0, 0, h * 0.74, 0, w * 0.3, h * 0.5, 0, 0, h * 0.74, 0);
    ring(o, h * 0.88, w * 0.18, d * 0.18, 5);
  },
  // A flower bed: its kerb, and stems each topped with a bloom.
  flowers: (o, w, d, h) => {
    ring(o, 0.002, w / 2, d / 2, 10);
    for (let i = 0; i < 9; i++) {
      const [a, r] = [i * 2.4, 0.38 * Math.sqrt((i + 0.5) / 9)];
      const [x, z] = [Math.cos(a) * r * w, Math.sin(a) * r * d];
      const y = h * (0.6 + (0.4 * ((i * 7) % 3)) / 2);
      o.push(x, 0, z, x, y, z, x - w * 0.05, y, z, x + w * 0.05, y, z, x, y, z - d * 0.05, x, y, z + d * 0.05);
    }
  },
  // A fountain: a basin, its rim, and four jets arching out of the middle.
  fountain: (o, w, d, h) => {
    ring(o, 0, w / 2, d / 2, 16);
    ring(o, h * 0.25, w / 2, d / 2, 16);
    ring(o, h * 0.25, w * 0.12, d * 0.12, 8);
    for (let i = 0; i < 4; i++) {
      const [c, s] = [Math.cos((i / 4) * TAU + 0.4), Math.sin((i / 4) * TAU + 0.4)];
      poly(
        o,
        [0, 0.35, 0.7, 1].map((f) => [
          c * f * w * 0.4,
          h * 0.25 + h * 0.75 * (1 - (2 * f - 0.7) ** 2),
          s * f * d * 0.4,
        ]),
      );
    }
  },
  // An arch dam across z, bowed upstream (−x): the upstream face plumb, the downstream face
  // battered to the crest, ribs between, the crest road, the water line, and a spillway down
  // its middle. Drawn open, so the plant inside it shows.
  damwall: (o, w, d, h) => {
    const n = 16;
    const at = (i: number, dx: number, y: number): number[] => {
      const s = (i / n) * 2 - 1;
      return [dx - bow(d) * (1 - s * s), y, s * (d / 2)];
    };
    const edge = (dx: number, y: number): void =>
      poly(
        o,
        Array.from({ length: n + 1 }, (_, i) => at(i, dx, y)),
      );
    for (const [dx, y] of [
      [-w * 0.15, h],
      [w * 0.15, h],
      [-w * 0.15, 0],
      [w * 0.5, 0],
      [0, h],
      [-w * 0.15, h * 0.8],
    ])
      edge(dx ?? 0, y ?? 0);
    for (let i = 0; i <= n; i += 2)
      o.push(...at(i, -w * 0.15, 0), ...at(i, -w * 0.15, h), ...at(i, w * 0.5, 0), ...at(i, w * 0.15, h));
    for (const i of [n / 2 - 1, n / 2 + 1]) o.push(...at(i, w * 0.15, h * 0.92), ...at(i, w * 0.5, 0.004));
  },
  // The reservoir's surface at h: a wandering shore upstream, and the dam's face downstream.
  reservoir: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    // The shore curves upstream from one end of the dam to the other.
    const shore = Array.from({ length: 19 }, (_, i) => {
      const a = Math.PI / 2 + (i / 18) * Math.PI;
      const r = 1 + (0.07 * Math.sin(a * 5 + 1) + 0.05 * Math.sin(a * 9)) * Math.sin((i / 18) * Math.PI);
      return [hw + Math.cos(a) * w * r, h, Math.sin(a) * hd * r * (1 + 0.6 * Math.sin((i / 18) * Math.PI))];
    });
    const dam = Array.from({ length: 9 }, (_, i) => {
      const s = (i / 8) * 2 - 1;
      return [hw - bow(d) * (1 - s * s), h, s * hd];
    });
    poly(o, shore);
    poly(o, dam);
    for (let k = 0; k < 7; k++) {
      const [x, z] = [-hw * 0.6 + ((k * 0.37) % 1) * hw, (((k * 0.61) % 1) - 0.5) * hd * 1.2];
      o.push(x, h, z, x + w * 0.08, h, z);
    }
  },
  // The powerhouse at the dam's toe, drawn as a frame with its crane rail, so its machines show.
  powerhouse: (o, w, d, h) => {
    prism(o, w, d, h, 4);
    const [hw, hd] = [w / 2, d / 2];
    for (let z = -hd; z <= hd + 0.001; z += d / 6) o.push(-hw, 0, z, -hw, h, z, hw, 0, z, hw, h, z);
    for (const x of [-hw * 0.7, hw * 0.7]) o.push(x, h * 0.85, -hd, x, h * 0.85, hd);
  },
  // A generator: the stator drum with its cooling fins, and the shaft down to the runner.
  generator: (o, w, d, h) => {
    prism(o, w, d, h, 12, [0, 0.5, 1]);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      o.push(Math.cos(a) * w * 0.2, h, Math.sin(a) * d * 0.2, Math.cos(a) * w * 0.5, h, Math.sin(a) * d * 0.5);
    }
    o.push(0, 0, 0, 0, -h * 0.6, 0);
  },
  // A turbine runner's spiral case and draft tube; its blades turn (`turning`).
  runner: (o, w, d, h) => {
    const spiral = Array.from({ length: 25 }, (_, i) => {
      const a = (i / 24) * TAU;
      const r = 0.32 + 0.18 * (i / 24);
      return [Math.cos(a) * w * r, h * 0.6, Math.sin(a) * d * r];
    });
    poly(o, spiral);
    ring(o, 0, w * 0.22, d * 0.22, 10);
    o.push(w * 0.5, h * 0.6, 0, w * 0.5, h * 0.6, -d * 0.6);
  },
};
