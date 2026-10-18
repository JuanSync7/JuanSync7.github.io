import { noise2 } from './noise';
/** City plans: where the towers of a city stand and how tall, laid out by one rule each (a
 *  street grid, a ring road, a river, a hill, a spiral, a coast) with seeded noise for the
 *  heights. City form draws them as flat-shaded towers. */

export const FORMS = ['grid', 'ring', 'river', 'hill', 'spiral', 'coast'] as const;
export type Form = (typeof FORMS)[number];

/** What a plan depends on: its rule, and how densely the towers stand (0..1). */
export interface PlanSpec {
  form: Form;
  density: number;
}

export interface Tower {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

export function layout(p: PlanSpec, rng: () => number): Tower[] {
  const n = noise2(rng);
  const out: Tower[] = [];
  const add = (x: number, z: number, h: number, s = 0.07): void => {
    if (Math.hypot(x, z) > 1.25 || h <= 0.02) return;
    out.push({ x, z, w: s * (0.7 + rng() * 0.5), d: s * (0.7 + rng() * 0.5), h });
  };
  const step = 0.2 - p.density * 0.05;
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      const x = i * step + (rng() - 0.5) * step * 0.3;
      const z = j * step + (rng() - 0.5) * step * 0.3;
      const r = Math.hypot(x, z);
      const a = Math.atan2(z, x);
      const base = 0.1 + Math.max(0, n(x * 2, z * 2)) * 0.5;
      switch (p.form) {
        case 'grid':
          if (i % 3 !== 0 && j % 3 !== 0 && rng() < 0.75) add(x, z, base * (1.3 - r));
          break;
        case 'ring':
          if (r > 0.35 && r < 0.95) add(x, z, base * (1.5 - Math.abs(r - 0.6) * 2));
          break;
        case 'river':
          if (Math.abs(z - Math.sin(x * 3) * 0.15) > 0.16) add(x, z, base * (1.2 - r * 0.6));
          break;
        case 'hill':
          if ((i + j) % 2 === 0) add(x, z, Math.max(0, 0.9 - r) * 0.7 + base * 0.25, 0.08);
          break;
        case 'spiral': {
          const arm = Math.abs(
            ((((a + r * 5) % ((Math.PI * 2) / 3)) + Math.PI * 2) % ((Math.PI * 2) / 3)) - Math.PI / 3,
          );
          if (arm < 0.45) add(x, z, base * (1.6 - r));
          break;
        }
        case 'coast':
          if (x + Math.sin(z * 4) * 0.1 < 0.25) add(x, z, base * (0.5 + (0.25 - x)));
          break;
      }
    }
  }
  return out;
}
