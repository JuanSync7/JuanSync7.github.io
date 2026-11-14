// Swaps every LEGO model into catalogue pieces and runs the checks: no clipping, no floating
// piece, every block piece on whole studs and plates. `--selftest` proves each check still
// catches a model that breaks it. Node strips the kit's types, so there is no build step.
import { inspect } from '../../src/figures/kit/legocheck.ts';
import { LEGO_MODELS } from '../../src/figures/kit/legomodels.ts';
import { build } from '../../src/figures/kit/legoswap.ts';

const brick = (x, y, z) => ({ kind: 'block', x, y, z, w: 2, d: 1, h: 3, tone: 'ink' });
/** Each fixture adds one fault to a passing model and names the check that must catch it. */
const FIXTURES = [
  { name: 'a brick inside the chassis', expect: 'clipping', add: [brick(10, 3, 6)] },
  { name: 'a brick in mid-air', expect: 'floating', add: [brick(10, 30, 6)] },
  { name: 'a brick half a stud over', expect: 'offGrid', add: [{ ...brick(10, 30, 6), x: 10.5 }] },
  { name: 'a plate across an axle', expect: 'clipping', add: [{ kind: 'block', x: 7, y: 6, z: 3, w: 1, d: 1, h: 1, tone: 'ink' }] },
  { name: 'a plate inside a wheel', expect: 'clipping', add: [{ kind: 'block', x: 9, y: 4, z: 1, w: 1, d: 1, h: 1, tone: 'ink' }] },
  { name: 'a one-course wing on the airbox', expect: 'floating', add: [{ kind: 'block', x: 20, y: 16, z: 0, w: 4, d: 14, h: 1, tone: 'ink' }] },
];

const report = (shapes) => inspect(build(shapes));
let failed = 0;
if (process.argv.includes('--selftest')) {
  const base = LEGO_MODELS.f1;
  for (const f of FIXTURES) {
    const r = report([...base, ...f.add]);
    const caught = r[f.expect].length > 0;
    console.log(`${caught ? 'ok  ' : 'FAIL'}  ${f.expect} catches ${f.name}`);
    if (!caught) failed++;
  }
} else {
  for (const [id, shapes] of Object.entries(LEGO_MODELS)) {
    const pieces = build(shapes);
    const r = inspect(pieces);
    const bad = [...r.offGrid.map((s) => `off grid  ${s}`), ...r.clipping.map((s) => `clipping  ${s}`), ...r.floating.map((s) => `floating  ${s}`)];
    const kinds = {};
    for (const p of pieces) kinds[p.kind] = (kinds[p.kind] ?? 0) + 1;
    console.log(`${bad.length ? 'FAIL' : 'ok  '}  ${id}: ${pieces.length} pieces ${JSON.stringify(kinds)}`);
    for (const b of bad.slice(0, 20)) console.log(`      ${b}`);
    if (bad.length) failed++;
  }
}
if (failed) process.exit(1);
