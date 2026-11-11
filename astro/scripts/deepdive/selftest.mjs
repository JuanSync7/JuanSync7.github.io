import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadKernel, ROOT } from './load.mjs';
import { inspectLinework, segmentHitsBoxInterior, segmentLength, routeCoveredByLinework } from './geometry.mjs';
import { geometrySignature, inspectDiversity } from './diversity.mjs';

// The repository's ESLint scope is TypeScript; keep the executable QA scripts parseable too.
for (const file of readdirSync(join(ROOT, 'scripts/deepdive')).filter((f) => f.endsWith('.mjs'))) {
  const checked = spawnSync(process.execPath, ['--check', join(ROOT, 'scripts/deepdive', file)], { stdio: 'inherit' });
  if (checked.error) throw checked.error;
  if (checked.status !== 0) process.exit(checked.status ?? 1);
}

const { Sketch, finish, outside, inside, mulberry32, makeDivePlan } = await loadKernel();
for (const salt of [NaN, Infinity, -1, 0.5, 4294967296])
  assert.throws(() => makeDivePlan('city', 0, salt, 'modern'), RangeError);
for (const level of [NaN, Infinity, 0.5]) assert.throws(() => makeDivePlan('city', level, 42, 'modern'), RangeError);
const sketch = new Sketch(mulberry32(42), [0, 0]);
sketch.select([0.4, -0.1], 'macro');
assert(sketch.win.every((value, i) => Math.abs(value - [-0.1, -0.35, 0.9, 0.15][i]) < 1e-12));
assert.equal(sketch.win[0], sketch.w[0] - 0.5);
assert.equal(sketch.win[1], sketch.w[1] - 0.25);
assert.deepEqual(sketch.taken[0], sketch.win);
assert.equal(finish(sketch).selectedKind, 'macro');
assert.equal(sketch.place(9, 9), null);
assert.equal(sketch.place(-1, 1), null);
assert.equal(sketch.place(NaN, 1), null);
assert.equal(sketch.place(1, Infinity), null);
assert.equal(sketch.place(1, 1, [-2, -1, 2, 1], -0.1), null);
const registered = new Sketch(mulberry32(1), [0, 0]);
registered.segs[1].push([-1, 0, 0.2, 0]);
registered.interfaceLinework[1].push([-1, 0, 0.2, 0]);
const registeredPlan = finish(registered);
assert.equal(registeredPlan.interfaces.segs[1].length, 1);
assert(Math.abs(registeredPlan.interfaces.segs[1][0][0] + 0.5) < 1e-10);
assert(Math.abs(registeredPlan.interfaces.segs[1][0][2] - 0.2) < 1e-10);
assert.equal(inspectLinework(registeredPlan.interfaces, registered.win).length, 0);
assert(
  routeCoveredByLinework(
    [
      [-1, 0],
      [0.2, 0],
    ],
    [...registeredPlan.segs.flat(), ...registeredPlan.interfaces.segs.flat()],
  ),
);
assert(
  !routeCoveredByLinework(
    [
      [-1, 0],
      [0.2, 0],
    ],
    registeredPlan.segs.flat(),
  ),
);
const snapshot = finish(sketch);
sketch.select([0, 0], 'other');
assert.deepEqual(snapshot.w, [0.4, -0.1]);
const aperture = [-0.5, -0.25, 0.5, 0.25];
const fixtures = [
  { seg: [-1, 0, 1, 0], count: 2, length: 1 },
  { seg: [0, -1, 0, 1], count: 2, length: 1.5 },
  { seg: [-0.2, 0, 0.2, 0], count: 0, length: 0 },
  { seg: [-1, -0.25, 1, -0.25], count: 2, length: 1 },
  { seg: [-1, -0.4, 1, -0.4], count: 1, length: 2 },
];
for (const fixture of fixtures) {
  const kept = outside(fixture.seg, aperture);
  assert.equal(kept.length, fixture.count);
  assert(Math.abs(kept.reduce((sum, seg) => sum + segmentLength(seg), 0) - fixture.length) < 1e-8);
  assert(kept.every((seg) => !segmentHitsBoxInterior(seg, aperture)));
  const interior = inside(fixture.seg, aperture);
  assert(
    Math.abs(interior.reduce((sum, seg) => sum + segmentLength(seg), 0) + fixture.length - segmentLength(fixture.seg)) <
      1e-8,
  );
}
const rng = mulberry32(71);
for (let i = 0; i < 2000; i++) {
  const seg = Array.from({ length: 4 }, () => rng() * 4 - 2);
  const clipped = outside(seg, aperture);
  assert(
    clipped.every((s) => !segmentHitsBoxInterior(s, aperture)),
    `clipping crossed aperture ${i}`,
  );
  assert(clipped.reduce((sum, s) => sum + segmentLength(s), 0) <= segmentLength(seg) + 1e-8);
}
// A clean semantic model cannot excuse broken emitted linework.
assert(inspectLinework({ segs: [[[0, 0, 0, 0]], [], []], dots: [] }, [-2, -1, 2, 1]).some((s) => s.includes('zero')));
assert(inspectLinework({ segs: [[[0, 0, 3, 0]], [], []], dots: [] }, [-2, -1, 2, 1]).some((s) => s.includes('bounds')));
const drawing = { w: [0, 0], segs: [[[0, 0, 1, 0]], [], []], dots: [] };
assert.equal(geometrySignature(drawing), geometrySignature({ ...drawing, model: { unusedRandomValue: 42 } }));
assert.equal(geometrySignature(drawing), geometrySignature({ ...drawing, segs: [[[1e-12, 0, 1, 0]], [], []] }));
assert.equal(inspectDiversity(new Map([['frozen', new Set([geometrySignature(drawing)])]]), 6).length, 1);
assert.equal(inspectDiversity(new Map(), 6).length, 1);
console.log('kernel: 2000 clipping probes, selection and malformed linework fixtures passed');
for (const script of [
  'geometry-selftest.mjs',
  'camera-selftest.mjs',
  'chip-selftest.mjs',
  'chip-surface-selftest.mjs',
  'chip-routing-selftest.mjs',
  'room-selftest.mjs',
  'map-selftest.mjs',
  'connection-selftest.mjs',
  'room-programme-check.mjs',
  'workflow-selftest.mjs',
]) {
  const path = join(ROOT, 'scripts/deepdive', script);
  if (!existsSync(path)) throw new Error(`Missing required negative fixture suite: ${script}`);
  const result = spawnSync(process.execPath, [path], { cwd: ROOT, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
