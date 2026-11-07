#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chipKernel, generateChipCase, inspectChip } from './chip-check.mjs';
import { inspectLinework } from './geometry.mjs';

const k = await chipKernel();
let fixtures = 0;
const fixture = (name, corrupt, expected, kind = 'board', era = 'modern') => {
  const c = generateChipCase(k, 42, kind, era);
  assert.deepEqual(inspectChip(c.raw, c.model, c.win, c.finished), [], `${name}: baseline is invalid`);
  corrupt(c);
  assert(
    inspectChip(c.raw, c.model, c.win, c.finished).some((s) => s.includes(expected)),
    `${name}: corruption was not detected (${expected})`,
  );
  fixtures++;
};
fixture(
  'endpoint hangs beside its terminal',
  (c) => {
    c.model.nets[0].points[0][0] += 0.013;
  },
  'dangling endpoint',
);
fixture(
  'route crosses unrelated macro',
  (c) => {
    const net = c.model.nets[0],
      b = c.model.components.find((part) => part.id === 'chipset').box;
    net.points = [net.points[0], [b[0], (b[1] + b[3]) / 2], [b[2], (b[1] + b[3]) / 2], net.points.at(-1)];
  },
  'wire traverses chipset',
);
fixture(
  'model wire omitted from drawing',
  (c) => {
    c.raw.segs = [[], [], []];
  },
  'wire missing from emitted linework',
);
fixture(
  'component outside substrate',
  (c) => {
    c.model.components[1].box[2] = 3;
  },
  'component outside boundary',
);
fixture(
  'two components overlap',
  (c) => {
    c.model.components[1].box = [...c.model.components[0].box];
  },
  'overlaps',
);
fixture(
  'missing endpoint declaration',
  (c) => {
    c.model.nets[0].from = 'ghost:pin';
  },
  'missing terminal',
);
fixture(
  'wrong edge pin',
  (c) => {
    c.model.components[0].ports[0].point[0] = -7;
  },
  'port is not on declared edge',
);
fixture(
  'window shears selected macro',
  (c) => {
    c.win[0] += 0.01;
  },
  'selected component must equal aperture',
);
fixture(
  'no selected macro',
  (c) => {
    c.model.components.forEach((part) => {
      part.selected = false;
    });
  },
  'selected component must equal aperture',
);
fixture(
  'no physical evidence',
  (c) => {
    c.model.components = [];
  },
  'missing physical model',
);
fixture(
  'layer-change vias removed',
  (c) => {
    c.model.nets.find((net) => net.vias.length).vias = [];
  },
  'missing layer-change via',
);
fixture(
  'via not actually drawn',
  (c) => {
    c.raw.dots = [];
  },
  'via missing from emitted contacts',
);
fixture(
  'independent nets share metal',
  (c) => {
    const first = c.model.nets[0],
      second = c.model.nets.find((net) => net.signal !== first.signal);
    second.points = structuredClone(first.points);
    second.vias = structuredClone(first.vias);
  },
  'same-layer metal short',
);
fixture(
  'partial ABBA group',
  (c) => {
    c.model.unitCount = 6;
  },
  'incomplete matched ABBA group',
  'die',
  'testchip',
);
fixture(
  'a false signal label hides a metal short',
  (c) => {
    const first = c.model.nets[0],
      second = c.model.nets.find((n) => n.signal !== first.signal);
    second.points = structuredClone(first.points);
    second.vias = structuredClone(first.vias);
    second.signal = first.signal;
  },
  'same-layer metal short',
);
fixture(
  'distinct nets fraudulently share label',
  (c) => {
    const first = c.model.nets[0],
      second = c.model.nets.find((n) => n.signal !== first.signal);
    second.signal = first.signal;
  },
  'unrelated terminals share a signal label',
);
fixture(
  'capacitor pad unconnected',
  (c) => {
    const cap = c.model.components.find((part) => part.kind === 'decap');
    c.model.nets = c.model.nets.filter((net) => net.from !== `${cap.id}:n2` && net.to !== `${cap.id}:n2`);
  },
  'decoupling terminal floats',
);
fixture(
  'CMOS evidence missing',
  (c) => {
    c.model.gates = [];
  },
  'missing physical CMOS gate evidence',
  'cell',
);
fixture(
  'motherboard has no memory',
  (c) => {
    c.model.components
      .filter((part) => part.kind === 'dimm')
      .forEach((part) => {
        part.kind = 'filler';
      });
  },
  'board missing dimm',
);
fixture(
  'RF terminal uses a digital cell',
  (c) => {
    c.model.components.find((part) => part.selected).kind = 'standard-cell';
  },
  'analog terminal expanded into digital logic',
  'cell',
  'testchip',
);
fixture(
  'NMOS era uses a complementary gate',
  (c) => {
    c.model.gates[0].gate.kind = 'cmos';
  },
  'NMOS scene contains complementary CMOS gate',
  'cell',
  'nmos',
);
fixture(
  'ordered wire bonds cross',
  (c) => {
    const a = c.model.nets.find((n) => n.from === 'pinn0:s2');
    const b = c.model.nets.find((n) => n.from === 'pinn1:s2');
    [a.to, b.to] = [b.to, a.to];
    [a.points[1], b.points[1]] = [b.points[1], a.points[1]];
    c.raw.segs[2].push([...a.points[0], ...a.points[1]], [...b.points[0], ...b.points[1]]);
  },
  'crossing bond-wire fanout',
  'pkg',
  'bipolar',
);
fixture(
  'wire bond has a false via',
  (c) => {
    const n = c.model.nets[0],
      mid = [(n.points[0][0] + n.points[1][0]) / 2, (n.points[0][1] + n.points[1][1]) / 2];
    n.vias.push(mid);
    c.raw.dots.push(mid);
  },
  'false bond-wire via',
  'pkg',
  'bipolar',
);
fixture(
  'wire bond becomes an orthogonal metal trace',
  (c) => {
    const n = c.model.nets[0];
    n.points.splice(1, 0, [n.points[1][0], n.points[0][1]]);
  },
  'bond wire must directly join two landing pads',
  'pkg',
  'testchip',
);
fixture(
  'bonded package silently substitutes metal routing',
  (c) => {
    c.model.nets[0].layer = 'metal-hv';
  },
  'bonded package must use physical wire bonds',
  'pkg',
  'nmos',
);
fixture(
  'projected child pad drifts from real next-die pad',
  (c) => {
    const link = c.model.childPadMap[0],
      part = c.model.components.find((v) => v.id === link.parentId);
    part.box[0] += 0.004;
    part.box[2] += 0.004;
    for (const p of part.ports) p.point[0] += 0.004;
  },
  'misregistered child pad',
  'pkg',
  'bipolar',
);
fixture(
  'inside bond span is clipped away',
  (c) => {
    c.finished.interfaces = { segs: [[], [], []], dots: [] };
  },
  'missing retained inside bond interface',
  'pkg',
  'testchip',
);
fixture(
  'unrelated child pad is traversed',
  (c) => {
    const n = c.model.nets[0],
      other = c.model.components.find((v) => v.parent === 'die' && !n.to.startsWith(v.id + ':'));
    n.points.splice(1, 0, [(other.box[0] + other.box[2]) / 2, (other.box[1] + other.box[3]) / 2]);
  },
  'wire traverses die-pad/',
  'pkg',
  'nmos',
);
fixture(
  'parent substitutes a second child pin list',
  (c) => {
    c.model.childPadMap.pop();
  },
  'child pad count/order mismatch',
  'pkg',
  'testchip',
);
fixture(
  'a phantom ancestor excuses pad containment',
  (c) => {
    c.model.components.find((v) => v.parent === 'die').parent = 'ghost';
  },
  'invalid component parent',
  'pkg',
  'bipolar',
);
fixture(
  'inside landing rings disappear',
  (c) => {
    c.finished.interfaces.segs[1] = [];
  },
  'bond landing ring missing from finished linework',
  'pkg',
  'bipolar',
);
fixture(
  'a short landing-ring gap hides between probes',
  (c) => {
    const s = c.finished.interfaces.segs[1][0];
    const at = (t) => [s[0] + (s[2] - s[0]) * t, s[1] + (s[3] - s[1]) * t];
    c.finished.interfaces.segs[1].splice(0, 1, [s[0], s[1], ...at(0.23)], [...at(0.25), s[2], s[3]]);
  },
  'bond landing ring missing from finished linework',
  'pkg',
  'testchip',
);
fixture(
  'a false modern era bypasses package checks',
  (c) => {
    c.model.era = 'modern';
    c.finished.interfaces = undefined;
  },
  'chip era disagrees with production context',
  'pkg',
  'bipolar',
);
fixture(
  'a false rack level bypasses package checks',
  (c) => {
    c.model.level = 'rack';
    c.finished.interfaces = undefined;
  },
  'chip level disagrees with production package context',
  'pkg',
  'testchip',
);
fixture(
  'a copied pad lies about its side',
  (c) => {
    c.model.components.find((p) => p.parent === 'die' && p.side === 'n').side = 'e';
  },
  'misregistered child pad',
  'pkg',
  'nmos',
);
const c = generateChipCase(k, 42, 'board');
c.finished.segs[1].push([0, 0, 0, 0]);
assert(inspectLinework(c.finished, k.BOUND, c.win).some((s) => s.includes('zero length')));
fixtures++;
console.log(`chip selftest: ${fixtures} broken physical-model/linework fixtures rejected`);
for (const script of ['chip-gate-selftest.mjs', 'chip-analog-selftest.mjs']) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url))], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
