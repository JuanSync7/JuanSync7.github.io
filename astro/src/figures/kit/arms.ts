import type { Galaxy, Star } from './cosmos';
import { between, pick, type Rng } from './rng';

/** Spiral galaxies built arm by arm, for flying into (`templates/galaxy-dive.ts`). Each
 *  galaxy picks a design: a grand-design pair, many arms, a flocculent swirl of short arm
 *  pieces, a bar with two arms, or an inner ring with arms off it. Each arm then gets its
 *  own length, width and brightness along it (fading out, brightening to the rim, beaded
 *  with knots, or even), and some branch a spur. One arm star in nine carries a soft glow,
 *  so an arm reads as a gradient of light, not only as points. */

export const DESIGNS = ['grand', 'grand', 'multi', 'flocculent', 'barred', 'barred', 'ringed'] as const;
export type Design = (typeof DESIGNS)[number];
const PROFILES = ['fade', 'fade', 'rim', 'knots', 'knots', 'even'] as const;
type Profile = (typeof PROFILES)[number];

interface Arm {
  /** Where the arm leaves the centre: its angle and radius; where it ends; how wide. */
  a0: number;
  r0: number;
  r1: number;
  width: number;
  profile: Profile;
  knots: number;
}

const gauss = (rng: Rng): number => (rng() + rng() + rng() - 1.5) / 1.5;

function shine(p: Profile, u: number, knots: number, rng: Rng): number {
  if (p === 'fade') return (1 - u) * 0.8 + rng() * 0.2;
  if (p === 'rim') return 0.2 + u * 0.6 + rng() * 0.2;
  if (p === 'knots') return Math.pow(Math.abs(Math.sin(u * knots * Math.PI)), 6) * 0.7 + rng() * 0.3;
  return rng() * 0.7;
}

export function spiral(rng: Rng, n: number, design: Design = pick(rng, DESIGNS)): Galaxy {
  const core = between(rng, 0.07, 0.18);
  const bar = design === 'barred' ? between(rng, 0.2, 0.38) : 0;
  const ring = design === 'ringed' ? between(rng, 0.3, 0.45) : 0;
  const wind = (rng() < 0.5 ? 1 : -1) * between(rng, 1.8, design === 'grand' ? 5.5 : 4);
  const count =
    design === 'flocculent' ? 10 + Math.floor(rng() * 10) : design === 'multi' ? 3 + Math.floor(rng() * 4) : 2;
  const start = Math.max(core * 0.7, bar, ring);
  const arms: Arm[] = Array.from({ length: count }, (_, k) => {
    const r0 = design === 'flocculent' ? between(rng, 0.15, 0.7) : start;
    return {
      a0: (k / count) * Math.PI * 2 + gauss(rng) * (design === 'flocculent' ? 1.2 : 0.15),
      r0,
      r1: design === 'flocculent' ? Math.min(1, r0 + between(rng, 0.15, 0.35)) : between(rng, 0.6, 1),
      width: between(rng, 0.05, design === 'grand' ? 0.16 : 0.24),
      profile: pick(rng, PROFILES),
      knots: 3 + Math.floor(rng() * 6),
    };
  });
  // A spur: a short arm branching off one arm partway out, winding more loosely.
  const spurs = design === 'flocculent' ? [] : arms.filter(() => rng() < 0.35);
  for (const s of spurs) {
    const r0 = s.r0 + (s.r1 - s.r0) * between(rng, 0.3, 0.5);
    arms.push({ ...s, a0: s.a0 + (r0 - s.r0) * wind, r0, r1: Math.min(1, r0 + 0.3), width: s.width * 0.7 });
  }
  const stars: Star[] = [];
  for (let i = 0; i < n; i++) {
    const u = rng();
    if (u < 0.16) {
      const r = Math.abs(gauss(rng)) * core * 1.6;
      stars.push({ r, a: rng() * Math.PI * 2, y: gauss(rng) * core * 0.5, b: 0.4 + rng() * 0.5 });
    } else if (u < 0.34) {
      const r = Math.min(1, -Math.log(1 - rng() * 0.95) * 0.28);
      stars.push({ r, a: rng() * Math.PI * 2, y: gauss(rng) * 0.03, b: rng() * 0.3 });
    } else if (bar && u < 0.44) {
      const x = gauss(rng) * bar;
      stars.push({ r: Math.abs(x), a: (x < 0 ? Math.PI : 0) + gauss(rng) * 0.1, y: 0, b: 0.3 + rng() * 0.5 });
    } else if (ring && u < 0.44) {
      stars.push({ r: ring + gauss(rng) * 0.025, a: rng() * Math.PI * 2, y: 0, b: 0.3 + rng() * 0.6 });
    } else {
      const arm = arms[i % arms.length];
      if (!arm) continue;
      const t = Math.pow(rng(), 0.85);
      const r = arm.r0 + t * (arm.r1 - arm.r0);
      const a = arm.a0 + (r - arm.r0) * wind + (gauss(rng) * arm.width) / (r + 0.25);
      const dust = u > 0.92;
      const b = dust ? -0.5 : shine(arm.profile, t, arm.knots, rng);
      const glow = !dust && i % 9 === 0 ? arm.width * (0.6 + b) : undefined;
      // Dust sits on the inner edge of the arm, where the gas is compressed.
      stars.push({ r, a: dust ? a - Math.sign(wind) * arm.width * 0.8 : a, y: gauss(rng) * 0.02, b, glow });
    }
  }
  return {
    kind: bar ? 'barred' : 'spiral',
    stars,
    tilt: between(rng, 0.3, 1.2),
    roll: rng() * Math.PI * 2,
    // Arms trail: the disc turns against the way they wind outward.
    spin: -Math.sign(wind) * between(rng, 0.02, 0.05),
    core,
  };
}
