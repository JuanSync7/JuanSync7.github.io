#!/usr/bin/env node
import assert from 'node:assert/strict';
import { analogKernel, generateMatchedCase, inspectMatchedFingers, runAnalogCheck } from './chip-analog-check.mjs';

const k = await analogKernel();
let fixtures = 0;
const fixture = (name, corrupt, expected) => {
  const c = generateMatchedCase(k, 42, 8);
  assert.deepEqual(inspectMatchedFingers(c.layout, c.raw, c.count), [], `${name}: baseline must pass`);
  corrupt(c);
  const issues = inspectMatchedFingers(c.layout, c.raw, c.count);
  assert(
    issues.some((s) => s.includes(expected)),
    `${name}: expected ${expected}, got ${issues.join('; ')}`,
  );
  fixtures++;
};
const drawContact = (raw, c) =>
  raw.rect([c.point[0] - c.size, c.point[1] - c.size, c.point[0] + c.size, c.point[1] + c.size], 1);
fixture(
  'wrong analog gate control',
  (c) => {
    c.layout.fets[0].control = 'GB';
  },
  'electrode mismatch',
);
fixture('missing ABBA finger', (c) => c.layout.fingers.pop(), 'incomplete matched-finger');
fixture(
  'wrong ABBA membership',
  (c) => {
    c.layout.fingers[1].group = 'A';
  },
  'breaks ABBA order',
);
fixture('incomplete transistor evidence', (c) => c.layout.fets.pop(), 'missing matched transistor');
fixture(
  'wrong drain on A device',
  (c) => {
    c.layout.fets[0].left.net = 'DB';
  },
  'electrode mismatch',
);
fixture(
  'analog device became complementary CMOS',
  (c) => {
    c.layout.fets[0].type = 'p';
  },
  'electrode mismatch',
);
fixture(
  'wrong A gate input',
  (c) => {
    c.layout.fets[0].input = 1;
  },
  'electrode mismatch',
);
fixture(
  'source/drain wrong physical layer',
  (c) => {
    c.layout.fets[0].left.layer = 'poly';
  },
  'electrode mismatch',
);
fixture(
  'detached channel terminal',
  (c) => {
    c.layout.fets[1].left.point[0] += 0.01;
  },
  'diffusion has conflicting',
);
fixture(
  'channel outside diffusion',
  (c) => {
    c.layout.fets[0].gate[1] = 8;
  },
  'channel placement',
);
fixture(
  'missing source bus',
  (c) => {
    c.layout.wires = c.layout.wires.filter((w) => !(w.net === 'S' && w.layer === 'm2'));
  },
  'S: floating matched electrode',
);
fixture(
  'missing A drain bus',
  (c) => {
    c.layout.wires = c.layout.wires.filter((w) => !(w.net === 'DA' && w.layer === 'm2'));
  },
  'DA: floating matched electrode',
);
fixture(
  'wrong electrode layer',
  (c) => {
    c.layout.wires.find((w) => w.net === 'DB' && w.layer === 'm2').layer = 'poly';
  },
  'DB: floating matched electrode',
);
fixture(
  'missing A gate vias',
  (c) => {
    c.layout.contacts = c.layout.contacts.filter((v) => v.net !== 'GA' || !v.layers.includes('poly'));
  },
  'GA: floating matched electrode',
);
fixture(
  'metal touches active without diffusion contact',
  (c) => {
    const p = c.layout.fets[0].left.point;
    c.layout.contacts = c.layout.contacts.filter((v) => Math.hypot(v.point[0] - p[0], v.point[1] - p[1]) > 1e-8);
  },
  'missing diffusion-to-metal contact',
);
fixture(
  'B gate pin missing',
  (c) => {
    c.layout.pins = c.layout.pins.filter((p) => p.net !== 'GB');
  },
  'GB: missing matched pin',
);
fixture(
  'pin contact land omitted',
  (c) => {
    const p = c.layout.terminals.S;
    c.layout.contacts = c.layout.contacts.filter((v) => Math.hypot(v.point[0] - p[0], v.point[1] - p[1]) > 1e-8);
  },
  'pin has no contact land',
);
fixture(
  'source terminal missing',
  (c) => {
    delete c.layout.terminals.S;
  },
  'S: missing matched terminal',
);
fixture(
  'no emitted geometry',
  (c) => {
    c.raw.segs = [[], [], []];
  },
  'missing from linework',
);
fixture(
  'moved contact has no emitted footprint',
  (c) => {
    c.layout.contacts[0].size *= 1.5;
  },
  'contact missing from linework',
);
fixture(
  'nonfinite contact footprint',
  (c) => {
    c.layout.contacts[0].size = NaN;
  },
  'invalid matched contact footprint',
);
fixture(
  'nonfinite conductor',
  (c) => {
    c.layout.wires[0].points[0][0] = Infinity;
  },
  'malformed matched conductor',
);
fixture(
  'oversized contact cannot expand own bound',
  (c) => {
    const v = c.layout.contacts[0];
    v.size = 10;
    drawContact(c.raw, v);
  },
  'electrode clearance',
);
fixture(
  'contact square shorts despite centre missing adjacent wire',
  (c) => {
    const a = c.layout.contacts.find(
      (v) =>
        v.net === 'DA' &&
        v.layers.includes('m2') &&
        v.point[0] > (c.layout.bounds[0] + c.layout.bounds[2]) / 2 - 0.0001,
    );
    const b = c.layout.wires.find((w) => w.net === 'DB' && w.layer === 'm2');
    a.size = Math.abs(b.points[0][1] - a.point[1]) + 0.0001;
    drawContact(c.raw, a);
  },
  'contact/conductor short',
);
fixture(
  'contact footprints overlap off-centre',
  (c) => {
    const a = c.layout.contacts.find((v) => v.net === 'GA' && v.layers.includes('poly'));
    const v = { net: 'GB', point: [a.point[0] + a.size * 1.5, a.point[1]], layers: ['m2'], size: a.size };
    c.layout.contacts.push(v);
    drawContact(c.raw, v);
  },
  'contact/conductor short',
);
fixture(
  'A gate metal bridged to B gate',
  (c) => {
    const a = c.layout.terminals.GA,
      b = c.layout.terminals.GB;
    const w = { net: 'GA', layer: 'm2', points: [a, [b[0], a[1]], b] };
    c.layout.wires.push(w);
    c.raw.poly(w.points, 1);
  },
  'contact/conductor short',
);
fixture(
  'physical source strap absent from drawing',
  (c) => {
    const w = c.layout.wires.find((w) => w.net === 'S' && w.layer === 'm2');
    for (const tone of c.raw.segs)
      for (let i = tone.length - 1; i >= 0; i--) {
        const s = tone[i];
        if (Math.abs(s[1] - w.points[0][1]) < 1e-8 && Math.abs(s[3] - w.points[0][1]) < 1e-8) tone.splice(i, 1);
      }
  },
  'S: matched conductor missing from linework',
);
fixture(
  'declared drain signal lie does not hide topology',
  (c) => {
    for (const w of c.layout.wires) if (w.net === 'DB') w.net = 'DA';
    for (const v of c.layout.contacts) if (v.net === 'DB') v.net = 'DA';
  },
  'contact/conductor short',
);
console.log(
  `analog selftest: ${fixtures} adverse matching, electrode-connectivity and contact-footprint fixtures rejected`,
);
await runAnalogCheck(128);
