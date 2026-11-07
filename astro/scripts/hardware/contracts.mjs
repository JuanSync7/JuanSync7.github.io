import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { routing: limits } = JSON.parse(readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
assert.ok(Number.isInteger(limits.samplesPerSegment) && limits.samplesPerSegment >= 2);
assert.ok(limits.epsilon > 0 && limits.surfaceTolerance > 0);

// Independent geometry predicates: these do not import the construction kernel.
function inside(point, polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    const cross = (point[0] - a[0]) * (b[2] - a[2]) - (point[2] - a[2]) * (b[0] - a[0]);
    if (Math.abs(cross) < limits.epsilon && [0, 2].every(axis => point[axis] >= Math.min(a[axis], b[axis]) - limits.epsilon && point[axis] <= Math.max(a[axis], b[axis]) + limits.epsilon)) return true;
    if ((a[2] > point[2]) !== (b[2] > point[2]) && point[0] < (b[0] - a[0]) * (point[2] - a[2]) / (b[2] - a[2]) + a[0]) hit = !hit;
  }
  return hit;
}
export function checkRouting(model) {
  let count = 0;
  for (const part of model.parts) {
    const traces = part.surfaces.filter(s => s.connection);
    const supports = part.surfaces.filter(s => s.face && s.points.every(p => Math.abs(p[1] - s.points[0][1]) < limits.epsilon));
    const segments = [];
    for (const trace of traces) {
      count++;
      assert.ok(trace.points.every(p => Math.abs(p[1] - trace.points[0][1]) < limits.epsilon), `${model.kind}: planar trace`);
      for (let i = 1; i < trace.points.length; i++) {
        const a = trace.points[i - 1], b = trace.points[i];
        assert.ok((a[0] === b[0]) !== (a[2] === b[2]), `${model.kind}: nonzero Manhattan segment`);
        for (let step = 0; step <= limits.samplesPerSegment; step++) {
          const p = a.map((v, axis) => v + (b[axis] - v) * step / limits.samplesPerSegment);
          assert.ok(supports.some(s => Math.abs(s.points[0][1] - p[1]) < limits.surfaceTolerance && inside(p, s.points)), `${model.kind}: trace stays on its owning support`);
        }
        for (const other of segments.filter(s => s.trace !== trace)) {
          const axis = a[0] === b[0] ? 2 : 0, fixed = axis === 0 ? 2 : 0;
          if (other.a[fixed] === a[fixed] && other.b[fixed] === a[fixed])
            assert.ok(Math.min(Math.max(a[axis], b[axis]), Math.max(other.a[axis], other.b[axis])) - Math.max(Math.min(a[axis], b[axis]), Math.min(other.a[axis], other.b[axis])) <= limits.epsilon, `${model.kind}: independent traces do not share a routing lane`);
          if (other.a[axis] === other.b[axis]) {
            const crosses = other.a[axis] >= Math.min(a[axis],b[axis]) - limits.epsilon && other.a[axis] <= Math.max(a[axis],b[axis]) + limits.epsilon && a[fixed] >= Math.min(other.a[fixed],other.b[fixed]) - limits.epsilon && a[fixed] <= Math.max(other.a[fixed],other.b[fixed]) + limits.epsilon;
            assert.ok(!crosses, `${model.kind}: independent traces do not cross`);
          }
        }
        segments.push({ a, b, trace });
      }
    }
  }
  return count;
}

export function checkSignals(drawing, selected, signal) {
  assert.ok(drawing.paths.every(p => Number.isInteger(p.solid) && typeof p.front === 'boolean'), 'Projection preserves solid identity and face orientation');
  const visible = new Set(drawing.paths.filter(p => p.part === selected && p.closed && p.front && p.stroke !== 'none').map(p => p.solid));
  const signals = drawing.paths.filter(p => p.stroke === signal);
  assert.ok(signals.length > 0, 'Selected assembly has an accent');
  assert.ok(signals.every(p => p.part === selected), 'Accent belongs only to the selected assembly');
  for (const solid of visible) assert.ok(signals.some(p => p.solid === solid), `Repeated solid ${solid} has its own accent`);
}
