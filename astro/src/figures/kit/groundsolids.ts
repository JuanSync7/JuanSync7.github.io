import type { Vec3 } from './camera';
import { beam, cuboid, diamond, frustum, loft, ring, type Tris } from './bodies';
import { bow } from './grounds';

/** Solids for the civic grounds and the hydro plant, the kinds `kit/grounds.ts` drew as wire only:
 *  a library's portico, the park's benches, lamps, people, flower beds and fountain, and the dam's
 *  arch wall, reservoir, powerhouse, generators and turbine runners. Each is built in the part's
 *  own frame like `kit/bodies.ts` and follows its wire, so the hidden-line district
 *  (`kit/districtsketch.ts`) draws the same thing, now hiding what stands behind it. */

type Shape = (o: Tris, w: number, d: number, h: number) => void;

/** A pediment over w × d from y up to y + rise, its ridge running along z (front to back). */
function pediment(o: Tris, w: number, d: number, y: number, rise: number): void {
  const [hw, hd] = [w / 2, d / 2];
  const end = (z: number): Vec3[] => [
    [-hw, y, z],
    [hw, y, z],
    [0, y + rise, z],
  ];
  loft(o, [end(-hd), end(hd)]);
}

/** The arch dam's section at s (−1 to 1 along it): upstream face plumb, downstream face battered. */
const section = (w: number, d: number, h: number, s: number): Vec3[] => {
  const [dx, z] = [-bow(d) * (1 - s * s), s * (d / 2)];
  return [
    [dx - w * 0.15, 0, z],
    [dx + w * 0.5, 0, z],
    [dx + w * 0.15, h, z],
    [dx - w * 0.15, h, z],
  ];
};

export const GROUND_SOLIDS: Record<string, Shape> = {
  // Three steps, a row of columns, the entablature and a pediment facing +z.
  portico: (o, w, d, h) => {
    for (let k = 0; k < 3; k++) {
      const g = (2 - k) * 0.012;
      cuboid(o, -w / 2 - g, (h * 0.08 * k) / 3, -d / 2 - g, w / 2 + g, (h * 0.08 * (k + 1)) / 3, d / 2 + g);
    }
    const n = Math.max(4, Math.round(w / 0.05));
    const r = Math.min(0.008, w / n / 3);
    for (let i = 0; i <= n; i++) {
      const x = -w * 0.46 + (i / n) * w * 0.92;
      frustum(o, 8, r, r, h * 0.08, r * 0.85, r * 0.85, h * 0.72, x, d * 0.4);
    }
    cuboid(o, -w / 2, h * 0.08, -d / 2, w / 2, h * 0.72, d * 0.1);
    cuboid(o, -w / 2, h * 0.72, -d / 2, w / 2, h * 0.82, d / 2);
    pediment(o, w, d, h * 0.82, h * 0.18);
  },
  // Seat, back and two end frames.
  bench: (o, w, d, h) => {
    cuboid(o, -w / 2, h * 0.42, -d / 2, w / 2, h * 0.5, d / 2);
    cuboid(o, -w / 2, h * 0.5, -d / 2, w / 2, h, -d / 2 + d * 0.15);
    for (const x of [-w / 2, w / 2 - w * 0.08]) cuboid(o, x, 0, -d / 2, x + w * 0.08, h * 0.42, d / 2);
  },
  // The pole and its lantern.
  lamp: (o, w, d, h) => {
    frustum(o, 6, w * 0.12, d * 0.12, 0, w * 0.08, d * 0.08, h * 0.82);
    cuboid(o, -w * 0.35, h * 0.82, -d * 0.35, w * 0.35, h, d * 0.35);
  },
  // A figure standing: a tapered body and a head.
  person: (o, w, d, h) => {
    frustum(o, 6, w * 0.22, d * 0.18, 0, w * 0.3, d * 0.22, h * 0.76);
    diamond(o, 6, w * 0.16, d * 0.16, h * 0.76, h * 0.88, h);
  },
  // A low kerb round a bed, and blooms standing above it.
  flowers: (o, w, d, h) => {
    loft(o, [ring(10, w / 2, d / 2, 0), ring(10, w / 2, d / 2, h * 0.3)]);
    for (let i = 0; i < 5; i++) {
      const [a, r] = [i * 2.4, 0.3 * Math.sqrt((i + 0.5) / 5)];
      const [x, z] = [Math.cos(a) * r * w, Math.sin(a) * r * d];
      frustum(o, 5, w * 0.08, d * 0.08, h * 0.3, w * 0.1, d * 0.1, h * (0.7 + 0.1 * (i % 3)), x, z);
    }
  },
  // A round basin, a column in the middle and the bowl it spills from.
  fountain: (o, w, d, h) => {
    loft(o, [ring(24, w / 2, d / 2, 0), ring(24, w / 2, d / 2, h * 0.25)]);
    frustum(o, 12, w * 0.06, d * 0.06, h * 0.25, w * 0.05, d * 0.05, h * 0.75);
    loft(o, [ring(16, w * 0.08, d * 0.08, h * 0.75), ring(16, w * 0.2, d * 0.2, h * 0.88)]);
  },
  // The arch wall swept along its curve, the crest a little proud of the downstream face.
  damwall: (o, w, d, h) => {
    const n = 16;
    loft(
      o,
      Array.from({ length: n + 1 }, (_, i) => section(w, d, h, (i / n) * 2 - 1)),
    );
    const crest = (s: number): Vec3 => {
      const [, , c] = section(w, d, h, s);
      return [c?.[0] ?? 0, h, c?.[2] ?? 0];
    };
    // Spillway piers down the middle of the downstream face.
    for (const s of [-1 / 8, 1 / 8]) {
      const [a, b] = [section(w, d, h, s)[1], crest(s)];
      if (a && b) beam(o, [a[0], 0.004, a[2]], [b[0], h * 0.96, b[2]], 0.012);
    }
  },
  // The water's surface: a thin plate inside its wandering shore and the dam's upstream face.
  reservoir: (o, w, d, h) => {
    const [hw, hd] = [w / 2, d / 2];
    const shore = Array.from({ length: 19 }, (_, i): Vec3 => {
      const a = Math.PI / 2 + (i / 18) * Math.PI;
      const r = 1 + (0.07 * Math.sin(a * 5 + 1) + 0.05 * Math.sin(a * 9)) * Math.sin((i / 18) * Math.PI);
      return [hw + Math.cos(a) * w * r, 0, Math.sin(a) * hd * r * (1 + 0.6 * Math.sin((i / 18) * Math.PI))];
    });
    const dam = Array.from({ length: 7 }, (_, i): Vec3 => {
      const s = ((i + 1) / 8) * 2 - 1;
      return [hw - bow(d) * (1 - s * s), 0, s * hd];
    });
    const edge = [...shore, ...dam];
    const at = (y: number): Vec3[] => edge.map(([x, , z]) => [x, y, z]);
    loft(o, [at(h - 0.003), at(h)]);
  },
  // The powerhouse: its hall and a raised roof light along it.
  powerhouse: (o, w, d, h) => {
    cuboid(o, -w / 2, 0, -d / 2, w / 2, h, d / 2);
    cuboid(o, -w * 0.2, h, -d * 0.45, w * 0.2, h + 0.012, d * 0.45);
  },
  // The stator drum and its cooling ring.
  generator: (o, w, d, h) => {
    frustum(o, 24, w / 2, d / 2, 0, w / 2, d / 2, h * 0.8);
    frustum(o, 24, w * 0.3, d * 0.3, h * 0.8, w * 0.3, d * 0.3, h);
  },
  // The spiral case, low under its generator.
  runner: (o, w, d, h) => {
    const rings = [0, 0.6].map((y) =>
      ring(24, w * 0.5, d * 0.5, h * y).map(([x, yy, z], i): Vec3 => {
        const k = 0.64 + 0.36 * (i / 24);
        return [x * k, yy, z * k];
      }),
    );
    loft(o, rings);
  },
};
