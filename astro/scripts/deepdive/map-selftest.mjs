import { loadKernel } from './load.mjs';
import { inspectMap } from './map-checks.mjs';
const K = await loadKernel(
  "export {makeUrban} from './src/figures/kit/map-layout';export {makeRegion} from './src/figures/kit/map-region';",
);
const urban = () => K.makeUrban(new K.Sketch(K.mulberry32(42), [0, 0]), 'city');
const region = () => K.makeRegion(new K.Sketch(K.mulberry32(42), [0, 0]));
const fixtures = [
  [
    'disconnected street',
    urban,
    (m) => {
      const r = m.roads[0];
      r.points = r.points.map(([x, y]) => [x + 0.011, y + 0.011]);
    },
    'disconnected graph',
  ],
  [
    'unbridged river crossing',
    urban,
    (m) => {
      m.roads.find((r) => r.bridge).bridge = false;
    },
    'water crossing without bridge',
  ],
  [
    'building beyond parcel',
    urban,
    (m) => {
      m.blocks.find((b) => b.buildings.length).buildings[0].bounds = [-2, -2, 2, 2];
    },
    'building outside parcel',
  ],
  [
    'overlapping buildings',
    urban,
    (m) => {
      const b = m.blocks.find((b) => b.buildings.length);
      b.buildings.push({ ...b.buildings[0] });
    },
    'overlapping buildings',
  ],
  [
    'detached entrance',
    urban,
    (m) => {
      m.blocks.find((b) => b.buildings.length).buildings[0].entry = [0, 0];
    },
    'entry detached',
  ],
  [
    'waterfront encroachment',
    urban,
    (m) => {
      m.blocks[0].bounds = [...m.river.corridor];
    },
    'occupies water corridor',
  ],
  [
    'arbitrary zoom cutout',
    urban,
    (m) => {
      m.blocks.find((b) => b.kind === 'selected').kind = 'park';
    },
    'one actual block',
  ],
  [
    'uphill drainage',
    region,
    (m) => {
      m.river.banks = m.river.banks.map((b) => b.toReversed());
    },
    'flows uphill',
  ],
  [
    'river disconnected from coast',
    region,
    (m) => {
      m.river.banks = m.river.banks.map((b) => b.slice(0, -6));
    },
    'mouth disconnected',
  ],
  [
    'town road absent',
    region,
    (m) => {
      m.roads = m.roads.filter((r) => !r.id.startsWith('town-'));
    },
    'no road access',
  ],
  [
    'town street through a roof',
    region,
    (m) => {
      m.towns[0].buildings[0] = [...m.towns[0].bounds];
    },
    'internal road cuts building',
  ],
  [
    'detached station path',
    region,
    (m) => {
      m.station.access[1] = [0, 0];
    },
    'access detached from road',
  ],
  [
    'crossing elevations',
    region,
    (m) => {
      m.contours.push(
        {
          elevation: 0.7,
          points: [
            [-1, -0.2],
            [1, 0.2],
          ],
        },
        {
          elevation: 0.8,
          points: [
            [-1, 0.2],
            [1, -0.2],
          ],
        },
      );
    },
    'contour crossing',
  ],
  [
    'hanging contour',
    region,
    (m) => {
      m.contours.push({
        elevation: 0.8,
        points: [
          [0.1, 0.1],
          [0.2, 0.2],
        ],
      });
    },
    'hanging endpoint',
  ],
];
for (const [label, make, mutate, expected] of fixtures) {
  const clean = make();
  const before = inspectMap(clean);
  if (before.length) throw new Error(`${label}: baseline failed ${before}`);
  mutate(clean);
  const issues = inspectMap(clean);
  if (!issues.some((i) => i.includes(expected))) throw new Error(`${label}: mutation escaped; ${issues}`);
}
console.log(`map selftest: ${fixtures.length} independent adverse geometry/topology mutations were rejected`);
