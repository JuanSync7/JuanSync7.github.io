// Proves the hidden-line pen's clash check (`Sketch.clashes`, kit/drawing/monoline.ts, R-FIG-31) still
// tells touching from standing inside, in turned frames and for moving parts at their pivots.
//   npm run figures:clash:selftest
import { Sketch } from '../../src/figures/kit/drawing/monoline';

const cases: [string, (k: Sketch) => void, number][] = [
  [
    'touching boxes',
    (k) => (k.object('a', () => k.box(0, 0, 0, 1, 1, 1)), k.object('b', () => k.box(1, 0, 0, 2, 1, 1))),
    0,
  ],
  [
    'overlapping boxes',
    (k) => (k.object('a', () => k.box(0, 0, 0, 1, 1, 1)), k.object('b', () => k.box(0.9, 0, 0, 2, 1, 1))),
    1,
  ],
  ['a turned pen resting on a page', (k) => (k.object('page', () => k.box(-1, -0.01, -1, 1, 0, 1)), k.object('pen', () => k.at([0, 0.0045, 0], -0.9, () => k.cyl(0, -0.07, 0, 0.0045, 0.14), 0, Math.PI / 2))), 0], // prettier-ignore
  ['a turned pen sunk into a page', (k) => (k.object('page', () => k.box(-1, -0.01, -1, 1, 0, 1)), k.object('pen', () => k.at([0, 0, 0], -0.9, () => k.cyl(0, -0.07, 0, 0.0045, 0.14), 0, Math.PI / 2))), 1], // prettier-ignore
  ['a turned part off its origin, inside another', (k) => (k.object('a', () => k.box(0.4, 0, 0.4, 0.6, 0.2, 0.6)), k.object('b', () => k.at([0, 0, 0], -0.7, () => k.box(0.5, 0, -0.05, 0.6, 0.2, 0.05)))), 1], // prettier-ignore
  ['a moving part clear at its pivot', (k) => (k.object('wall', () => k.box(0, 0, -0.1, 1, 1, 0)), k.moving('rotor', [0.5, 0.5, 0.05], () => k.box(-0.1, -0.1, -0.02, 0.1, 0.1, 0.02))), 0], // prettier-ignore
  ['a moving part sunk into the wall', (k) => (k.object('wall', () => k.box(0, 0, -0.1, 1, 1, 0)), k.moving('rotor', [0.5, 0.5, 0], () => k.box(-0.1, -0.1, -0.02, 0.1, 0.1, 0.02))), 1], // prettier-ignore
];
let bad = 0;
for (const [name, build, want] of cases) {
  const k = new Sketch();
  build(k);
  const got = k.clashes().length;
  if (got !== want) bad++;
  console.log(
    `clash selftest: ${got === want ? 'ok' : 'FAILED'} - ${name} (${got} clash${got === 1 ? '' : 'es'}, want ${want})`,
  );
}
process.exit(bad ? 1 : 0);
