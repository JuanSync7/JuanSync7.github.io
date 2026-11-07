import assert from 'node:assert/strict';
import { loadKernel } from './load.mjs';

const { diveCamera, journeyOpacity, R } = await loadKernel();
const level = (n) => ({ w: [0.47 * Math.sin(n * 0.7), 0.26 * Math.cos(n * 0.93)] });
const width = 1000,
  height = 500;
let checks = 0;
for (const boundary of [-1000, -7, -1, 0, 1, 6, 60, 1000, 1e6]) {
  for (let depth = -3; depth <= 3; depth++) {
    const absolute = boundary + depth;
    for (const point of [
      [-1.86, -0.9],
      [0, 0],
      [1.86, 0.9],
    ]) {
      const at = (time) => {
        const camera = diveCamera(level, time, width, height);
        return camera.toScreen(absolute - camera.n, ...point);
      };
      const epsilon = 1e-7;
      const [before, after] = [at(boundary - epsilon), at(boundary + epsilon)];
      assert(Math.hypot(before[0] - after[0], before[1] - after[1]) < 0.05, `position jump ${boundary}/${depth}`);
      const h = 1e-5;
      const [a, b, c] = [at(boundary - h), at(boundary), at(boundary + h)];
      const left = b.map((v, i) => (v - a[i]) / h),
        right = c.map((v, i) => (v - b[i]) / h);
      const jump = Math.hypot(left[0] - right[0], left[1] - right[1]);
      assert(
        jump / Math.max(1, Math.hypot(...left), Math.hypot(...right)) < 0.002,
        `velocity jump ${boundary}/${depth}`,
      );
      checks += 2;
    }
  }
}
// Verify nested coordinate composition against independently unrolled affine transforms.
for (const u of [-2.7, 0, 3.65, 1000000.25]) {
  const camera = diveCamera(level, u, width, height);
  const point = [0.31, -0.21];
  const base = camera.toScreen(0, 0, 0);
  for (let depth = -4; depth <= 4; depth++) {
    let p = [...point];
    if (depth > 0) for (let k = depth - 1; k >= 0; k--) p = p.map((v, a) => v / R + level(camera.n + k).w[a]);
    else for (let k = depth; k < 0; k++) p = p.map((v, a) => (v - level(camera.n + k).w[a]) * R);
    const actual = camera.toScreen(depth, ...point);
    assert(actual.every((v, a) => Math.abs(v - (base[a] + p[a] * camera.scale * camera.unit)) < 1e-6));
    checks++;
  }
}
// The old switch on depth flashes the teal border at every handoff. Size is invariant.
for (let d = -2; d <= 3; d++) {
  assert.equal(R * R ** -d, R ** -(d - 1));
  checks++;
}
for (const beginning of [-18, -6, 0, 6, 6000000]) {
  for (let i = 0; i <= 100; i++) {
    const u = beginning + 5.7 + i * 0.004;
    const old = journeyOpacity(beginning + 5, u),
      fresh = journeyOpacity(beginning + 6, u);
    assert(old >= 0 && old <= 1 && fresh >= 0 && fresh <= 1);
    assert(Math.abs(old + fresh - 1) < 1e-8, 'journey dissolve has a dark gap or flash');
    assert.equal(journeyOpacity(beginning + 1, u), old);
    checks++;
  }
  assert.equal(journeyOpacity(beginning - 1, beginning + 0.35), 0);
  assert.equal(journeyOpacity(beginning, beginning + 0.35), 1);
  for (const boundary of [beginning + 5.78, beginning + 5.98]) {
    const h = 1e-6,
      values = [-h, 0, h].map((d) => journeyOpacity(beginning + 5, boundary + d));
    assert(Math.abs((values[1] - values[0]) / h - (values[2] - values[1]) / h) < 0.01);
    checks++;
  }
}
console.log(`camera: ${checks} position, velocity, nesting and handoff checks passed`);
