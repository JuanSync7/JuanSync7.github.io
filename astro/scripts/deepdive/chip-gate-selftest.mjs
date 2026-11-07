#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
  gateKernel,
  generateGateCase,
  inspectGateLayout,
  inspectGateTruth,
  inspectSupplyNetwork,
  runGateCheck,
} from './chip-gate-check.mjs';

const k = await gateKernel();
let fixtures = 0;
const fixture = (name, corrupt, expected, seed = 42, kind = 'cmos') => {
  const c = generateGateCase(k, seed, false, kind);
  assert.deepEqual(inspectGateLayout(c.layout, c.raw), [], `${name}: baseline must pass`);
  corrupt(c);
  assert(
    inspectGateLayout(c.layout, c.raw).some((s) => s.includes(expected)),
    `${name}: broken gate was not detected (${expected})`,
  );
  fixtures++;
};
fixture(
  'pullup connected to ground',
  (c) => {
    c.layout.gate.pull[0].lr.forEach((f) => {
      for (let i = 0; i < 2; i++) if (f[i] === 'VDD') f[i] = 'GND';
    });
  },
  'disagrees with logic',
);
fixture(
  'missing transistor layout',
  (c) => {
    c.layout.fets.pop();
  },
  'missing physical transistor',
);
fixture(
  'physical transistor outside active',
  (c) => {
    c.layout.fets[0].gate = [8, 8];
  },
  'transistor outside diffusion',
);
fixture(
  'no rendered wire evidence',
  (c) => {
    c.raw.segs = [[], [], []];
  },
  'conductor missing from linework',
);
fixture(
  'diffusion drawn nowhere',
  (c) => {
    c.layout.strips[0][0] -= 0.07;
  },
  'diffusion strip missing',
);
fixture(
  'gate input poly disconnected',
  (c) => {
    c.layout.wires = c.layout.wires.filter((w) => w.net !== 'IN0');
  },
  'gate disconnected from input',
);
fixture(
  'output strap missing',
  (c) => {
    c.layout.wires = c.layout.wires.filter((w) => !(w.net === 'OUT' && w.layer === 'm2'));
  },
  'floating physical terminal',
);
fixture(
  'unrelated signals share metal',
  (c) => {
    const rail = c.layout.wires.find((w) => w.net === 'VDD' && w.layer === 'm2');
    c.layout.wires.push({ ...structuredClone(rail), net: 'OUT' });
  },
  'same-layer short',
);
fixture(
  'no output pin',
  (c) => {
    c.layout.pins = c.layout.pins.filter((p) => p.net !== 'OUT');
  },
  'missing pin',
);
fixture(
  'contact not drawn',
  (c) => {
    c.layout.contacts[0].size *= 1.7;
  },
  'contact missing from linework',
);
fixture(
  'via touches only one layer',
  (c) => {
    const via = c.layout.contacts.find((v) => v.layers.length === 2 && v.net === 'OUT');
    via.point[0] += 0.06;
  },
  'via misses conductor',
);
fixture(
  'physical source drain renamed',
  (c) => {
    c.layout.fets[0].left.net = 'fiction';
  },
  'physical transistor netlist mismatch',
);
fixture(
  'enlarged contact reaches off-centre wire',
  (c) => {
    const contact = c.layout.contacts.find((p) => p.net === 'IN0');
    const [x, y] = contact.point,
      original = contact.size;
    contact.size *= 2;
    c.raw.rect([x - contact.size, y - contact.size, x + contact.size, y + contact.size], 1);
    const wire = {
      net: 'ALIEN',
      layer: 'm1',
      points: [
        [x + original * 1.5, y - original * 0.5],
        [x + original * 1.5, y + original * 0.5],
      ],
    };
    c.layout.wires.push(wire);
    c.raw.poly(wire.points, 1);
  },
  'contact footprint shorts signals',
);
fixture(
  'different-net contact squares overlap',
  (c) => {
    const original = c.layout.contacts.find((p) => p.net === 'IN0');
    const [x, y] = original.point,
      r = original.size;
    const contact = { net: 'ALIEN', point: [x + r * 1.5, y], layers: ['m1'], size: r };
    c.layout.contacts.push(contact);
    c.raw.rect([contact.point[0] - r, y - r, contact.point[0] + r, y + r], 1);
  },
  'contact footprints overlap',
);
fixture(
  'NMOS depletion load omitted',
  (c) => {
    c.layout.gate.pull[0].lr = [];
  },
  'NMOS load topology mismatch',
  42,
  'nmos-load',
);
fixture(
  'NMOS diagram mislabeled CMOS',
  (c) => {
    c.layout.gate.kind = 'cmos';
  },
  'physical transistor netlist mismatch',
  42,
  'nmos-load',
);
fixture(
  'depletion gate-source tie omitted',
  (c) => {
    c.layout.wires = c.layout.wires.filter((w) => !(w.net === 'OUT' && w.layer === 'poly'));
  },
  'gate disconnected from input poly',
  42,
  'nmos-load',
);
fixture(
  'depletion gate tied to external input',
  (c) => {
    c.layout.fets.find((f) => f.type === 'd').control = 'IN0';
  },
  'incorrect physical gate control',
  42,
  'nmos-load',
);
const truth = k.gate(k.mulberry32(4));
truth.inputs = 8;
assert(inspectGateTruth(truth).some((s) => s.includes('invalid gate topology')));
fixtures++;
let brokenSeed;
for (let seed = 1; seed <= 256; seed++) {
  const c = generateGateCase(k, seed);
  if (c.layout.wires.some((w) => w.net.startsWith('x') && w.layer === 'm2')) {
    brokenSeed = seed;
    break;
  }
}
assert(brokenSeed !== undefined, 'must exercise a broken diffusion net');
fixture(
  'broken diffusion pieces lose bridge',
  (c) => {
    const net = c.layout.wires.find((w) => w.net.startsWith('x') && w.layer === 'm2').net;
    c.layout.wires = c.layout.wires.filter((w) => w.net !== net);
  },
  'floating physical terminal',
  brokenSeed,
);
const supplyFixture = (name, corrupt, expected) => {
  const raw = new k.Sketch(k.mulberry32(42), [0, 0]);
  k.physicalCells(raw);
  assert.deepEqual(inspectSupplyNetwork(raw.model, raw), [], `${name}: baseline supply must pass`);
  corrupt(raw.model, raw);
  assert(
    inspectSupplyNetwork(raw.model, raw).some((s) => s.includes(expected)),
    `${name}: broken supply was not detected (${expected})`,
  );
  fixtures++;
};
supplyFixture(
  'missing global VDD strap',
  (p) => {
    p.supplyWires = p.supplyWires.filter((w) => !(w.net === 'VDD' && w.layer === 'm1'));
  },
  'row disconnected',
);
supplyFixture(
  'missing row-to-strap via',
  (p) => {
    p.supplyContacts = p.supplyContacts.filter((c) => !(c.net === 'VDD' && c.layers.length === 2 && c.point[1] < 0));
  },
  'row disconnected',
);
supplyFixture(
  'wrong-potential strap via',
  (p) => {
    p.supplyContacts.find((c) => c.net === 'VDD' && c.layers.length === 2).net = 'GND';
  },
  'shorts VDD/GND',
);
supplyFixture(
  'uncapped row rail',
  (p) => {
    p.supplyContacts = p.supplyContacts.filter(
      (c) => !(c.net === 'VDD' && c.layers.length === 1 && Math.abs(c.point[0] - 1.81) < 1e-8),
    );
  },
  'hanging shared supply endpoint',
);
supplyFixture(
  'no global pad declarations',
  (p) => {
    p.supplyPins = p.supplyPins.filter((pin) => pin.layer !== 'm1');
  },
  'missing global supply IO pads',
);
supplyFixture(
  'global pad hangs away from strap',
  (p) => {
    p.supplyPins[0].point = [0.9, 0.2];
  },
  'row disconnected',
);
supplyFixture(
  'shared rail not rendered',
  (p, raw) => {
    raw.segs = [[], [], []];
  },
  'shared supply missing from linework',
);
supplyFixture(
  'cell rail pin disconnected',
  (p) => {
    p.gates[0].pins.find((pin) => pin.net === 'VDD').point = [0.8, 0.2];
  },
  'row disconnected',
);
supplyFixture(
  'oversized power contact reaches opposite rail',
  (p, raw) => {
    const contact = p.supplyContacts.find(
      (c) => c.net === 'VDD' && Math.abs(c.point[0] - 0.5) < 1e-8 && Math.abs(c.point[1] - 0.25) < 1e-8,
    );
    assert(contact);
    contact.size = 0.6;
    const [x, y] = contact.point;
    raw.rect([x - 0.6, y - 0.6, x + 0.6, y + 0.6], 1);
  },
  'contact footprint shorts signals',
);
supplyFixture(
  'contacts in different gates do not share local input identity',
  (p, raw) => {
    const a = p.gates[0].contacts.find((c) => c.net === 'IN0');
    const b = p.gates[1].contacts.find((c) => c.net === 'IN0');
    b.point = [a.point[0] + a.size * 0.5, a.point[1]];
    raw.rect([b.point[0] - b.size, b.point[1] - b.size, b.point[0] + b.size, b.point[1] + b.size], 1);
  },
  'contact footprints overlap',
);
for (const era of ['modern', 'nmos']) {
  const raw = new k.Sketch(k.mulberry32(42), [0, 0]);
  raw.era = era;
  k.physicalCells(raw);
  assert(raw.model.gates.length > 0);
  assert(
    raw.model.gates.every((layout) => layout.gate.kind === (era === 'nmos' ? 'nmos-load' : 'cmos')),
    'actual cell renderer uses wrong era',
  );
  assert(
    raw.model.gates.every((layout) => era !== 'nmos' || layout.fets.every((fet) => fet.type !== 'p')),
    'NMOS scene contains PFET',
  );
}
const datapath = new k.Sketch(k.mulberry32(42), [0, 0]);
datapath.era = 'nmos';
k.physicalDatapath(datapath);
assert(
  datapath.model.gates.length > 0 &&
    datapath.model.gates.every(
      (layout) => layout.gate.kind === 'nmos-load' && layout.fets.every((fet) => fet.type !== 'p'),
    ),
  'actual NMOS datapath uses CMOS',
);
console.log(`gate selftest: ${fixtures} broken topology/physical-connectivity fixtures rejected`);
await runGateCheck(256);
