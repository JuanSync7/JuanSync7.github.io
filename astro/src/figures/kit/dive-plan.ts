import { cell, core, die, pkg } from './dies';
import { city, district, region } from './maps';
import { between, mulberry32 } from './rng';
import { block, building, floor } from './rooms';
import { board, rack } from './silicon';
import { finish, Sketch, type Plan, type Pt } from './sketch';

export const CHAINS = {
  silicon: [
    ['rack', rack],
    ['board', board],
    ['package', pkg],
    ['die', die],
    ['core', core],
    ['cell', cell],
  ],
  city: [
    ['region', region],
    ['city', city],
    ['district', district],
    ['block', block],
    ['building', building],
    ['floor', floor],
  ],
} as const;

export const DIVE_ERAS = ['testchip', 'bipolar', 'nmos', 'modern'] as const;
export type DiveChain = keyof typeof CHAINS;
export type DiveEra = (typeof DIVE_ERAS)[number];

export function levelKind(chain: DiveChain, n: number): (typeof CHAINS)[DiveChain][number] {
  const kinds = CHAINS[chain];
  return kinds[((n % kinds.length) + kinds.length) % kinds.length] ?? kinds[0];
}

/** A level has an independent stream: cache eviction and inspection order cannot alter it.
 * The initial anchor is a preference. Each domain snaps it to a complete, selected part. */
export function makeDiveSketch(chain: DiveChain, n: number, salt: number, era: DiveEra): Sketch {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(salt) || salt < 0 || salt > 4294967295)
    throw new RangeError('Dive levels must be safe integers and plan salts must be uint32 integers');
  const rng = mulberry32((salt + Math.imul(n, 7919)) >>> 0);
  const anchor: Pt = [between(rng, -0.55, 0.55), between(rng, -0.3, 0.3)];
  const sketch = new Sketch(rng, anchor);
  sketch.era = era;
  sketch.keepDetail = ((n % 6) + 6) % 6 === 5;
  // A physical bond package lands on the next view's actual die pads, including its
  // exact pin count. Independent streams preserve replay and query-order independence.
  if (chain === 'silicon' && ((n % 6) + 6) % 6 === 2 && era !== 'modern')
    sketch.nextPlan = makeDivePlan(chain, n + 1, salt, era);
  levelKind(chain, n)[1](sketch);
  return sketch;
}

export function makeDivePlan(chain: DiveChain, n: number, salt: number, era: DiveEra): Plan {
  return finish(makeDiveSketch(chain, n, salt, era));
}
