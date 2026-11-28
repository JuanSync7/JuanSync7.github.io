/**
 * The district template's layout check: `npm run figures:district [-- --seeds=N] [--selftest]`.
 *
 * For seeds 1..N, lays each district out (`districtOf`), sketches it and runs the district's clash
 * check (`districtClashes`: the kernel's box test, the terrain held by its height field). It fails
 * when any seed has parts standing in each other (R-FIG-31), when a district loses its landmark,
 * or when a building the wireframe layout kept is left out (only loose rock and pylons, whose
 * lines are restrung, may go). `--selftest` plants the faults the check exists for and fails if
 * one is not caught: two buildings in one place, a part sunk under the terrain, a rotor sweeping
 * through a building.
 */
import tpl from '../../src/figures/templates/district';
import { districtClashes } from '../../src/figures/kit/districtcheck';
import { MOBILE } from '../../src/figures/kit/districtlayout';
import { districtOf, type P } from '../../src/figures/kit/districtscene';
import { districtSketch, type Plan } from '../../src/figures/kit/districtsketch';
import { Sketch } from '../../src/figures/kit/drawing/monoline';
import { terrainOf } from '../../src/figures/kit/terrain';
import type { Part, PartKind } from '../../src/figures/kit/city';

const args = process.argv.slice(2);
const seeds = Number(args.find((a) => a.startsWith('--seeds='))?.slice(8) ?? 48);
/** Kinds the layout may leave out: scenery, machines that move about a site, and pylons (their
 *  line is strung past). */
const MAY_GO: readonly PartKind[] = [
  ...MOBILE,
  'pylon',
  'tree',
  'pine',
  'birch',
  'cypress',
  'oak',
  'bush',
  'flowers',
  'bench',
  'lamp',
  'person',
];

const clashesOf = (plan: Plan): string[] => {
  const k = new Sketch();
  districtSketch(k, plan);
  return districtClashes(k, plan.terrain?.height);
};

function selftest(): number {
  const part = (kind: PartKind, x: number, z: number, w: number, d: number, h: number, y = 0): Part => ({
    kind,
    x,
    z,
    w,
    d,
    h,
    y,
  });
  const plan = (parts: Part[], stones: Part[] = []): Plan => {
    const terrain = terrainOf(stones, 2, 1);
    return {
      city: { parts, traces: [] },
      objects: parts.map((p, i) => `${p.kind}-${i}`),
      w: 2,
      d: 1,
      rides: [],
      left: [],
      ...(terrain ? { terrain } : {}),
    };
  };
  const cases: [string, Plan, boolean][] = [
    ['two buildings apart', plan([part('block', -0.3, 0, 0.1, 0.1, 0.1), part('block', 0.3, 0, 0.1, 0.1, 0.1)]), false],
    [
      'two buildings in one place',
      plan([part('block', 0, 0, 0.1, 0.1, 0.1), part('block', 0.05, 0, 0.1, 0.1, 0.1)]),
      true,
    ],
    [
      'a house beside a hill',
      plan([part('house', 0.5, 0, 0.08, 0.06, 0.04)], [part('rock', -0.4, 0, 0.3, 0.3, 0.12)]),
      false,
    ],
    [
      'a house sunk in a hill',
      plan([part('house', -0.4, 0, 0.08, 0.06, 0.04)], [part('rock', -0.4, 0, 0.3, 0.3, 0.12)]),
      true,
    ],
    [
      'a rotor sweeping through a building',
      plan([part('turbine', 0, 0, 0.03, 0.03, 0.3), part('block', 0.06, 0, 0.1, 0.1, 0.4)]),
      true,
    ],
  ];
  let bad = 0;
  for (const [name, p, fails] of cases) {
    const caught = clashesOf(p).length > 0;
    if (caught !== fails) {
      bad++;
      console.log(`FAIL  selftest: ${name}: ${fails ? 'not caught' : 'caught wrongly'}`);
    } else console.log(`ok    selftest: ${name}`);
  }
  return bad;
}

if (args.includes('--selftest')) process.exit(selftest() ? 1 : 0);

let bad = 0;
for (let seed = 1; seed <= seeds; seed++) {
  const params = (tpl.instance(seed) as unknown as { params: P }).params;
  const plan = districtOf(params.board, params.salt);
  const problems = clashesOf(plan);
  if (!plan.mark || !plan.city.parts.includes(plan.mark)) problems.push('its landmark is left out');
  const lost = plan.left.filter((q) => !MAY_GO.includes(q.kind));
  if (lost.length) problems.push(`left out: ${lost.map((q) => q.kind).join(', ')}`);
  if (problems.length) {
    bad++;
    console.log(`FAIL  district~${seed} (${params.board[2]}): ${problems.join('; ')}`);
  }
}
console.log(bad ? `district check: ${bad} of ${seeds} seeds failed` : `district check passed: ${seeds} seeds`);
process.exit(bad ? 1 : 0);
