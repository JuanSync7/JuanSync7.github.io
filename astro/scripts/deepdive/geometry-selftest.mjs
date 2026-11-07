import assert from 'node:assert/strict';
import {
  validBox,
  insideBox,
  boxOverlapInterior,
  pointOnSegment,
  pointOnPolyline,
  segmentCoveredByLinework,
  routeCoveredByLinework,
  segmentIntersection,
  segmentHitsBoxInterior,
  routeHitsBoxInterior,
  orthogonalRoute,
  routeConflicts,
  selfIntersections,
  reachable,
  inspectLinework,
} from './geometry.mjs';

// Deliberate bad layouts, paired with the nearest legitimate boundary case.
const fixtures = [
  [
    'split emitted wire',
    () =>
      assert.equal(
        segmentCoveredByLinework(
          [0, 0, 1, 0],
          [
            [0, 0, 0.3, 0],
            [0.3, 0, 0.8, 0],
            [0.8, 0, 1, 0],
          ],
        ),
        true,
      ),
  ],
  [
    'emitted wire gap between sample points',
    () =>
      assert.equal(
        segmentCoveredByLinework(
          [0, 0, 1, 0],
          [
            [0, 0, 0.3, 0],
            [0.31, 0, 1, 0],
          ],
        ),
        false,
      ),
  ],
  [
    'wrong parallel emitted wire',
    () => assert.equal(segmentCoveredByLinework([0, 0, 1, 0], [[0, 0.001, 1, 0.001]]), false),
  ],
  [
    'wire represented by longer stroke',
    () => assert.equal(segmentCoveredByLinework([0, 0, 1, 0], [[2, 0, -1, 0]]), true),
  ],
  [
    'diagonal wire splits',
    () =>
      assert.equal(
        segmentCoveredByLinework(
          [1, 1, 0, 0],
          [
            [0, 0, 0.5, 0.5],
            [0.5, 0.5, 1, 1],
          ],
        ),
        true,
      ),
  ],
  [
    'route corner missing leg',
    () =>
      assert.equal(
        routeCoveredByLinework(
          [
            [0, 0],
            [1, 0],
            [1, 1],
          ],
          [[0, 0, 1, 0]],
        ),
        false,
      ),
  ],
  [
    'route all legs emitted',
    () =>
      assert.equal(
        routeCoveredByLinework(
          [
            [0, 0],
            [1, 0],
            [1, 1],
          ],
          [
            [0, 0, 1, 0],
            [1, 0, 1, 1],
          ],
        ),
        true,
      ),
  ],
  ['inverted room', () => assert.equal(validBox([0, 1, 1, 0]), false)],
  ['empty room', () => assert.equal(validBox([0, 0, 0, 1]), false)],
  ['nonfinite room', () => assert.equal(validBox([0, 0, Infinity, 1]), false)],
  ['valid narrow room', () => assert.equal(validBox([0, 0, 0.01, 1]), true)],
  ['point beyond boundary', () => assert.equal(insideBox([1.01, 0], [-1, -1, 1, 1]), false)],
  ['point on boundary', () => assert.equal(insideBox([1, 0], [-1, -1, 1, 1]), true)],
  ['room overlaps corridor', () => assert.equal(boxOverlapInterior([0, 0, 1, 1], [0.9, 0.5, 2, 2]), true)],
  ['rooms share wall', () => assert.equal(boxOverlapInterior([0, 0, 1, 1], [1, 0, 2, 1]), false)],
  [
    'terminal on track interior',
    () =>
      assert.equal(
        pointOnPolyline(
          [0.5, 0],
          [
            [0, 0],
            [1, 0],
            [1, 1],
          ],
        ),
        true,
      ),
  ],
  [
    'terminal hanging near track',
    () =>
      assert.equal(
        pointOnPolyline(
          [0.5, 0.001],
          [
            [0, 0],
            [1, 0],
          ],
        ),
        false,
      ),
  ],
  ['terminal beyond track', () => assert.equal(pointOnSegment([1.001, 0], [0, 0, 1, 0]), false)],
  ['reversed diagonal terminal', () => assert.equal(pointOnSegment([0.25, 0.25], [1, 1, 0, 0]), true)],
  ['proper crossing', () => assert.equal(segmentIntersection([0, 0, 1, 1], [0, 1, 1, 0]).type, 'proper')],
  ['T crossing', () => assert.equal(segmentIntersection([0, 0, 1, 0], [0.5, 1, 0.5, 0]).type, 'touch')],
  ['collinear short circuit', () => assert.equal(segmentIntersection([0, 0, 2, 0], [3, 0, 1, 0]).type, 'overlap')],
  ['separated collinear tracks', () => assert.equal(segmentIntersection([0, 0, 1, 0], [1.1, 0, 2, 0]).type, 'none')],
  ['degenerate contact', () => assert.equal(segmentIntersection([0.5, 0, 0.5, 0], [0, 0, 1, 0]).type, 'touch')],
  ['parallel tracks', () => assert.equal(segmentIntersection([0, 0, 1, 0], [0, 0.1, 1, 0.1]).type, 'none')],
  ['wire through component', () => assert.equal(segmentHitsBoxInterior([-1, 0.5, 2, 0.5], [0, 0, 1, 1]), true)],
  ['wire starts inside component', () => assert.equal(segmentHitsBoxInterior([0.5, 0.5, 2, 0.5], [0, 0, 1, 1]), true)],
  ['diagonal through room', () => assert.equal(segmentHitsBoxInterior([-1, -1, 2, 2], [0, 0, 1, 1]), true)],
  ['wire follows boundary', () => assert.equal(segmentHitsBoxInterior([-1, 0, 2, 0], [0, 0, 1, 1]), false)],
  ['wire touches corner', () => assert.equal(segmentHitsBoxInterior([-1, 1, 1, -1], [0, 0, 1, 1]), false)],
  ['wire terminates at pad edge', () => assert.equal(segmentHitsBoxInterior([-1, 0.5, 0, 0.5], [0, 0, 1, 1]), false)],
  [
    'route crosses room on second leg',
    () =>
      assert.equal(
        routeHitsBoxInterior(
          [
            [-1, 2],
            [0.5, 2],
            [0.5, -0.5],
          ],
          [0, 0, 1, 1],
        ),
        true,
      ),
  ],
  [
    'Manhattan route',
    () =>
      assert.equal(
        orthogonalRoute([
          [0, 0],
          [1, 0],
          [1, 1],
        ]),
        true,
      ),
  ],
  [
    'accidental diagonal',
    () =>
      assert.equal(
        orthogonalRoute([
          [0, 0],
          [1, 0.001],
        ]),
        false,
      ),
  ],
  [
    'different nets X',
    () =>
      assert.equal(
        routeConflicts(
          [
            [0, 0],
            [1, 1],
          ],
          [
            [0, 1],
            [1, 0],
          ],
        ).length,
        1,
      ),
  ],
  [
    'undeclared T junction',
    () =>
      assert.equal(
        routeConflicts(
          [
            [0, 0],
            [1, 0],
          ],
          [
            [0.5, 1],
            [0.5, 0],
          ],
        ).length,
        1,
      ),
  ],
  [
    'legitimate endpoint join',
    () =>
      assert.equal(
        routeConflicts(
          [
            [0, 0],
            [1, 0],
          ],
          [
            [1, 0],
            [1, 1],
          ],
        ).length,
        0,
      ),
  ],
  [
    'forbidden endpoint join',
    () =>
      assert.equal(
        routeConflicts(
          [
            [0, 0],
            [1, 0],
          ],
          [
            [1, 0],
            [1, 1],
          ],
          { allowSharedEndpoints: false },
        ).length,
        1,
      ),
  ],
  [
    'overlapping nets',
    () =>
      assert.equal(
        routeConflicts(
          [
            [0, 0],
            [2, 0],
          ],
          [
            [1, 0],
            [3, 0],
          ],
        ).length,
        1,
      ),
  ],
  [
    'crossed contour',
    () =>
      assert.equal(
        selfIntersections(
          [
            [0, 0],
            [1, 1],
            [0, 1],
            [1, 0],
          ],
          true,
        ).length,
        1,
      ),
  ],
  [
    'simple closed contour',
    () =>
      assert.equal(
        selfIntersections(
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ],
          true,
        ).length,
        0,
      ),
  ],
  [
    'explicitly closed contour',
    () =>
      assert.equal(
        selfIntersections(
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
          true,
        ).length,
        0,
      ),
  ],
  [
    'doubled-back contour',
    () =>
      assert.equal(
        selfIntersections([
          [0, 0],
          [1, 0],
          [0.5, 0],
        ]).length,
        1,
      ),
  ],
  [
    'isolated room graph',
    () =>
      assert.equal(
        reachable('entrance', [
          ['entrance', 'hall'],
          ['hall', 'room1'],
          ['room2', 'bath'],
        ]).has('room2'),
        false,
      ),
  ],
  [
    'hall reaches rooms',
    () =>
      assert.equal(
        reachable('entrance', [
          ['entrance', 'hall'],
          ['hall', 'room1'],
        ]).has('room1'),
        true,
      ),
  ],
  [
    'directed signal flow',
    () =>
      assert.equal(
        reachable(
          'output',
          [
            ['input', 'gate'],
            ['gate', 'output'],
          ],
          true,
        ).has('input'),
        false,
      ),
  ],
  [
    'emitted stub not metadata',
    () => assert.match(inspectLinework({ segs: [[[0, 0, 0, 0]], [], []], dots: [] }, [-2, -1, 2, 1])[0], /zero length/),
  ],
  [
    'emitted boundary overrun',
    () =>
      assert.match(inspectLinework({ segs: [[[0, 0, 3, 0]], [], []], dots: [] }, [-2, -1, 2, 1])[0], /outside bounds/),
  ],
  [
    'unclipped parent trace',
    () =>
      assert.match(
        inspectLinework({ segs: [[[-1, 0, 1, 0]], [], []], dots: [] }, [-2, -1, 2, 1], [-0.5, -0.25, 0.5, 0.25])[0],
        /aperture/,
      ),
  ],
  [
    'aperture boundary stays',
    () =>
      assert.deepEqual(
        inspectLinework(
          { segs: [[[-0.5, -0.25, 0.5, -0.25]], [], []], dots: [] },
          [-2, -1, 2, 1],
          [-0.5, -0.25, 0.5, 0.25],
        ),
        [],
      ),
  ],
];
for (const [name, test] of fixtures) {
  try {
    test();
  } catch (error) {
    throw new Error(`geometry fixture: ${name}`, { cause: error });
  }
}
console.log(`deepdive geometry: ${fixtures.length} adversarial and boundary fixtures passed`);
