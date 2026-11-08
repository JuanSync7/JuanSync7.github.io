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

// A supported marking must lie on actual faces, not merely inside a bounding box.
function segmentOnFace(from, to, face) {
  const a = face.points[0];
  for (let i = 1; i + 1 < face.points.length; i++) {
    const u = face.points[i].map((v, axis) => v - a[axis]);
    const v = face.points[i + 1].map((value, axis) => value - a[axis]);
    const n = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
    const length = Math.hypot(...n);
    if (length <= limits.epsilon) continue;
    if ([from,to].some(point => Math.abs(n.reduce((sum, value, axis) => sum + value * (point[axis] - a[axis]), 0)) > limits.epsilon * length)) return false;
    // Choose the dominant normal axis explicitly, including negative-facing faces.
    const dominant = n.map(Math.abs).indexOf(Math.max(...n.map(Math.abs)));
    const [x,z] = [0,1,2].filter(axis => axis !== dominant);
    const polygon = face.points.map(p => [p[x],0,p[z]]);
    const start = [from[x],0,from[z]], end = [to[x],0,to[z]];
    if (!inside(start,polygon) || !inside(end,polygon)) return false;
    const dx = end[0]-start[0], dz = end[2]-start[2], cuts = [0,1];
    for (let j=0;j<polygon.length;j++) {
      const c=polygon[j],d=polygon[(j+1)%polygon.length], ex=d[0]-c[0],ez=d[2]-c[2];
      const det=dx*ez-dz*ex;
      if(Math.abs(det)>limits.epsilon) {
        const t=((c[0]-start[0])*ez-(c[2]-start[2])*ex)/det;
        const u=((c[0]-start[0])*dz-(c[2]-start[2])*dx)/det;
        if(t>0&&t<1&&u>=0&&u<=1) cuts.push(t);
      } else if(Math.abs((c[0]-start[0])*dz-(c[2]-start[2])*dx)<=limits.epsilon) {
        const axis=Math.abs(dx)>=Math.abs(dz)?0:2,delta=end[axis]-start[axis];
        if(Math.abs(delta)>limits.epsilon) for(const point of [c,d]) {
          const t=(point[axis]-start[axis])/delta;if(t>0&&t<1)cuts.push(t);
        }
      }
    }
    cuts.sort((a,b)=>a-b);
    return cuts.slice(1).every((high,i)=>{
      const t=(cuts[i]+high)/2;return inside([start[0]+dx*t,0,start[2]+dz*t],polygon);
    });
  }
  return false;
}
export function checkSupportedMarkings(model) {
  let count = 0;
  for (const part of model.parts) for (const mark of part.surfaces.filter(s => s.support !== undefined)) {
    const faces = part.surfaces.filter(s => s.face && s.solid === mark.support);
    assert.ok(!mark.face && mark.solid === mark.support && faces.length > 0, `${model.kind}: supported marking has its own solid host`);
    for (let i = 1; i < mark.points.length; i++)
      assert.ok(faces.some(face => segmentOnFace(mark.points[i-1],mark.points[i],face)), `${model.kind}: marking segment stays on an actual host face, including chamfers`);
    count++;
  }
  return count;
}
