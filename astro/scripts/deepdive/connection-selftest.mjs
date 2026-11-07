#!/usr/bin/env node
import assert from 'node:assert/strict';
import { connectionCase, connectionKernel, inspectConnection } from './connection-check.mjs';
const k = await connectionKernel();
const fixture = (name, corrupt, expected, n = 4) => {
  const c = connectionCase(k, 42, n);
  assert.deepEqual(inspectConnection(c.parent, c.child, c.connection, c.outline), []);
  corrupt(c);
  assert(
    inspectConnection(c.parent, c.child, c.connection, c.outline).some((s) => s.includes(expected)),
    `${name} not caught`,
  );
};
fixture(
  'severed emitted curb',
  (c) => {
    c.connection.linework.segs[1].splice(1, 1);
  },
  'gap in emitted',
);
fixture(
  'source detached',
  (c) => {
    c.connection.routes[0].source.opening[0][0] += 0.01;
  },
  'misses parent',
);
fixture(
  'target detached',
  (c) => {
    c.connection.routes[0].target.opening[0][1] += 0.01;
  },
  'misses child',
);
fixture(
  'curb through room',
  (c) => {
    c.connection.routes[0].curbs[0][1] = [
      (c.connection.childShell[0] + c.connection.childShell[2]) / 2,
      (c.connection.childShell[1] + c.connection.childShell[3]) / 2,
    ];
  },
  'child shell interior',
);
fixture(
  'teal outline seals source',
  (c) => {
    const [a, b] = c.connection.routes[0].source.opening;
    c.outline.push([...a, ...b]);
  },
  'seals parent',
);
fixture(
  'unrelated outline gap',
  (c) => {
    c.outline.shift();
  },
  'undeclared gap',
);
fixture(
  'ribbon collapsed',
  (c) => {
    c.connection.routes[0].curbs[1][0] = [...c.connection.routes[0].curbs[0][0]];
  },
  'collapses',
);
fixture(
  'rear service route omitted',
  (c) => {
    c.connection.routes.pop();
  },
  'not every parent',
  3,
);
fixture(
  'spurious interior emitted stroke',
  (c) => {
    const b = c.connection.childShell;
    c.connection.linework.segs[1].push([b[0] - 0.01, (b[1] + b[3]) / 2, b[2], (b[1] + b[3]) / 2]);
  },
  'emitted curb crosses',
);
fixture(
  'parent threshold seals approach',
  (c) => {
    const [a, b] = c.connection.routes[0].source.opening;
    c.parent.segs[1].push([...a, ...b]);
  },
  'parent linework seals',
  3,
);
fixture(
  'child doorway sealed by wall',
  (c) => {
    const [a, b] = c.child.model.entrances[0];
    c.child.segs[1].push([...a, ...b]);
  },
  'child linework seals',
);
const unsupported = k.makeDivePlan('silicon', 3, 42, 'modern');
assert.equal(k.nestConnections(unsupported, unsupported), null);
console.log(
  'connections selftest: 11 severed/sealed/interior/collapsed ribbon fixtures rejected; unsupported pair skipped',
);
