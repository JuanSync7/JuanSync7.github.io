#!/usr/bin/env node
/** Exercise physical PCB contacts independently of randomized scene acceptance. */
import assert from 'node:assert/strict';
import { loadKernel } from './load.mjs';
import { generateChipCase, inspectChip } from './chip-check.mjs';

const k = await loadKernel(
  [
    "export * from './src/figures/kit/chip-contact-channel';",
    "export * from './src/figures/kit/chip-contact-clearance';",
    "export * from './src/figures/kit/chip-board-router';",
  ].join('\n'),
);
const copper = (points, vias = []) => ({
  id: 'existing',
  from: 'a',
  to: 'b',
  signal: 'other',
  layer: 'metal-hv',
  points,
  vias,
});
const vertical = copper([
  [0, -0.2],
  [0, 0.2],
]);
const horizontal = [
  [-0.2, 0],
  [0.2, 0],
];
const rules = {
  run: (a, b) => !k.parallelConflict(a, b, vertical) && !k.runContactConflict(a, b, vertical),
  turn: (p) => !k.viaConflict(p, vertical),
  startAxis: 0,
  endAxis: 0,
};

// The vertical copper is on the other abstract metal layer. Crossing it at a
// virtual Hanan vertex must not manufacture a plated through contact.
assert.equal(rules.turn([0, 0]), false);
const straight = k.contactChannel(horizontal[0], horizontal[1], [-0.2, 0, 0.2], [0], rules);
assert.ok(straight, 'straight run may pass a virtual contact vertex');
assert.deepEqual(k.simplifyBoardRoute(straight), horizontal);
assert.equal(
  k.contactChannel([-0.2, 0], [0, 0.1], [-0.2, 0], [0, 0.1], {
    ...rules,
    endAxis: 1,
  }),
  undefined,
  'a real turn on unrelated copper must be rejected',
);

const clear = k.contactChannel([-0.2, 0], [0.2, 0.1], [-0.2, 0, 0.2], [0, 0.1], {
  ...rules,
  endAxis: 1,
});
assert.ok(clear, 'a clear bend after the crossing remains routable');
assert.ok(
  k
    .simplifyBoardRoute(clear)
    .slice(1, -1)
    .every((p) => !k.viaConflict(p, vertical)),
);
assert.equal(
  k.parallelConflict(
    [-0.1, -0.2],
    [0.1, -0.2],
    copper([
      [-0.2, -0.2],
      [0.2, -0.2],
    ]),
  ),
  true,
);
assert.equal(
  k.runContactConflict(
    ...horizontal,
    copper(
      [
        [0, -0.2],
        [0, 0],
        [0.2, 0.2],
      ],
      [[0, 0]],
    ),
  ),
  true,
  'a straight run cannot pass through an existing via disc',
);
assert.equal(k.viaConflict([0.0059, 0], vertical), true, 'finite annulus overlaps nearby copper');
assert.equal(k.viaConflict([0.0061, 0], vertical), false, 'finite annulus clears nearby copper');
assert.equal(
  k.viaConflict(
    [0.0119, 0],
    copper(
      [
        [-0.2, 0.3],
        [0.2, 0.3],
      ],
      [[0, 0]],
    ),
  ),
  true,
  'two via discs require the sum of their radii',
);
assert.equal(k.terminalConflict([0.005, 0], vertical), true, 'terminal pad square occupies finite area');
assert.equal(
  k.reservedRunConflict(...horizontal, [[0, 0.005]]),
  true,
  'planned future escapes reserve physical contact area before their net is emitted',
);
assert.equal(k.reservedViaConflict([0.011, 0], [[0, 0]]), true);
assert.equal(k.reservedViaConflict([0.013, 0], [[0, 0]]), false);
assert.ok(k.BOARD_OBSTACLE_MARGIN > 2 * k.BOARD_VIA_RADIUS, 'macro spacing accommodates paired annuli');

// These failed before actual-turn routing and full endpoint preplanning. The
// complete independent inspector also verifies aperture clipping and contacts.
for (const salt of [1, 3, 8, 9, 11, 18, 22, 42, 4294967295]) {
  const c = generateChipCase(k, salt, 'board');
  assert.deepEqual(inspectChip(c.raw, c.model, c.win, c.finished), [], `production board salt ${salt}`);
  const declared = [...c.model.routePorts].sort();
  assert.deepEqual(declared, [...new Set(c.model.nets.flatMap((n) => [n.from, n.to]))].sort());
}
console.log('chip routing selftest: actual/virtual contacts, annuli, future escapes and 9 production regressions pass');
