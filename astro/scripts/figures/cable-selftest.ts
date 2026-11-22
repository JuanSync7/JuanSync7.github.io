// Proves the cable check (`cableIssues`, kit/drawing/cable.ts, R-FIG-32) still tells a
// cable run properly from one left in the air, run through a solid, or floating across a gap.
//   npm run figures:cable:selftest
import { cable, cableIssues, FLOOR } from '../../src/figures/kit/drawing/cable';
import { Sketch } from '../../src/figures/kit/drawing/monoline';

/** A floor, a desk and a box on the floor: the furniture every case cables between. */
function room(k: Sketch): void {
  k.object('floor', () => k.box(-1, -0.03, -1, 2, 0, 2));
  k.object('desk', () => k.box(0, 0.7, 0, 0.6, 0.73, 0.6));
  k.object('box', () => k.box(1.2, 0, 0, 1.6, 0.4, 0.4));
}
const px = 70;
/** Each case, and the issue it must raise ('' for none). */
const cases: [string, (k: Sketch) => void, string][] = [
  ['a lead over the desk edge, down and along the floor into the box', (k) => cable(k, { name: 'ok', r: 0.004, px, pts: [[0.3, 0.73 + 0.008, 0.3], [0.62, 0.738, 0.3], [0.62, FLOOR, 0.3], [1.0, FLOOR, 0.3], [1.0, FLOOR, 0.2], [1.2, FLOOR, 0.2]] }), ''], // prettier-ignore
  ['a lead that stops short of the box', (k) => cable(k, { name: 'short', r: 0.004, px, pts: [[0.62, FLOOR, 0.3], [1.1, FLOOR, 0.3]] }), 'end is in the air'], // prettier-ignore
  ['a lead straight from desk to box through the air', (k) => cable(k, { name: 'diagonal', r: 0.004, px, pts: [[0.3, 0.738, 0.3], [1.2, 0.2, 0.2]] }), 'floats'], // prettier-ignore
  ['a lead run through the box', (k) => cable(k, { name: 'through', r: 0.004, px, pts: [[1.0, FLOOR, 0.2], [1.8, FLOOR, 0.2], [1.8, FLOOR, 0.6]] , plugs: [false, false] }), 'runs through box'], // prettier-ignore
  ['a thick cable drawn as a tube, resting on the floor', (k) => cable(k, { name: 'tube', r: 0.03, px, pts: [[0.62, 0.03, 0.9], [1.2, 0.03, 0.9], [1.2, 0.03, 0.4]], plugs: [false, false] }), ''], // prettier-ignore
];
let bad = 0;
for (const [name, build, want] of cases) {
  const k = new Sketch();
  room(k);
  build(k);
  const got = cableIssues(k);
  const ok = want ? got.some((g) => g.includes(want)) : got.length === 0;
  if (!ok) bad++;
  console.log(
    `cable selftest: ${ok ? 'ok' : 'FAILED'} - ${name} (${got.join('; ') || 'no issues'}; want ${want || 'none'})`,
  );
}
process.exit(bad ? 1 : 0);
