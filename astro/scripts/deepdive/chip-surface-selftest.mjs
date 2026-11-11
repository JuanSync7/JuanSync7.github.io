#!/usr/bin/env node
/** Hand-built evidence and destructive mutations, independent of surface generators. */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { inspectChipSurface } from './chip-surface-check.mjs';

const clone = (v) => structuredClone(v);
const drawing = () => ({ segs: [[], [], []], dots: [], w: [0, 0.7], era: 'modern' });
const edge = (raw, a, b, tone = 2) => raw.segs[tone].push([...a, ...b]);
const rectangle = (raw, [a, b, c, d], tone = 2) => {
  for (const [p, q] of [
    [
      [a, b],
      [c, b],
    ],
    [
      [c, b],
      [c, d],
    ],
    [
      [c, d],
      [a, d],
    ],
    [
      [a, d],
      [a, b],
    ],
  ])
    edge(raw, p, q, tone);
};
const circle = (raw, center, radius) => {
  const points = Array.from({ length: 10 }, (_, i) => [
    center[0] + radius * Math.cos((i * Math.PI) / 5),
    center[1] + radius * Math.sin((i * Math.PI) / 5),
  ]);
  for (let i = 0; i < points.length; i++) edge(raw, points[i], points[(i + 1) % points.length]);
};
const component = (id, kind, box, ports = []) => ({ id, kind, box, ports, selected: false });
const model = (level) => ({
  type: 'chip',
  level,
  era: 'modern',
  boundary: [-1.86, -0.9, 1.86, 0.9],
  components: [],
  nets: [],
});

function boardCase() {
  const raw = drawing(),
    m = model('board');
  raw.selectedKind = 'package';
  m.routePorts = [];
  m.components.push(
    component('power', 'vrm', [-1.7, -0.6, 1.7, 0.6]),
    component('mount', 'mount', [-0.1, 0.55, 0.1, 0.75]),
  );
  const footprint = (id, kind, x, y, w = 0.7, h = 0.5) => {
    const box = [x, y, x + w, y + h],
      body = [x + 0.12, y + 0.08, x + w - 0.12, y + h - 0.08];
    const pads = [
      { id: `${id}-in`, box: [x, y + 0.2 * h, x + 0.12, y + 0.4 * h], point: [x + 0.06, y + 0.3 * h] },
      { id: `${id}-out`, box: [x + w - 0.12, y + 0.2 * h, x + w, y + 0.4 * h], point: [x + w - 0.06, y + 0.3 * h] },
    ];
    for (const b of [box, body, ...pads.map((p) => p.box)]) rectangle(raw, b);
    return { id, owner: 'power', kind, box, body, pads };
  };
  const driver = footprint('driver', 'power-stage', -1.5, -0.4),
    coil = footprint('coil', 'inductor', 0.1, -0.4);
  const caps = [
    footprint('cap0', 'passive', -1.3, 0.25, 0.35, 0.25),
    footprint('cap1', 'passive', -0.7, 0.25, 0.35, 0.25),
  ];
  const points = clone([driver.pads[1].point, coil.pads[0].point]);
  edge(raw, ...points);
  const rings = [
    { id: 'mount-ring', owner: 'mount', kind: 'mount', center: [0, 0.65], innerRadius: 0.035, outerRadius: 0.075 },
  ];
  for (const c of rings) for (const r of [c.innerRadius, c.outerRadius]) circle(raw, c.center, r);
  m.board = {
    variant: 'workstation',
    phaseCount: 1,
    footprints: [driver, coil, ...caps],
    traces: [
      {
        id: 'switch',
        owner: 'power',
        from: driver.pads[1].id,
        to: coil.pads[0].id,
        points,
        net: 'SW',
        layer: 'top',
        width: 0.001,
        clearance: 0.001,
      },
    ],
    circles: rings,
    repeats: [
      { id: 'caps', owner: 'power', kind: 'passive-bank', members: caps.map((f) => f.id), axis: 'x', pitch: 0.6 },
    ],
  };
  return { raw, model: m };
}

function packageCase(withHbm = false) {
  const raw = drawing(),
    m = model('package');
  raw.selectedKind = 'die';
  m.components.push(
    component('logic', 'die', [-0.6, -0.4, 0.4, 0.2]),
    component('lands', 'substrate-lands', [-1.6, 0.3, -0.8, 0.55]),
  );
  m.components[0].selected = true;
  const field = (id, owner, kind, origin, pitch, radius) => {
    const sites = Array.from({ length: 6 }, (_, i) => ({
      row: Math.floor(i / 3),
      col: i % 3,
      point: [origin[0] + (i % 3) * pitch, origin[1] + Math.floor(i / 3) * pitch],
    }));
    const box = [
      origin[0] - radius * 1.5,
      origin[1] - radius * 1.5,
      origin[0] + 2 * pitch + radius * 1.5,
      origin[1] + pitch + radius * 1.5,
    ];
    rectangle(raw, box, 1);
    for (const s of sites) circle(raw, s.point, radius);
    return { id, owner, kind, origin, pitch: [pitch, pitch], radius, rows: 2, cols: 3, sites, box };
  };
  m.package = {
    variant: 'single-logic',
    layers: [
      { id: 'substrate', kind: 'substrate', bounds: [-1.8, -0.8, 1.8, 0.8] },
      { id: 'interposer', kind: 'interposer', bounds: [-1.7, -0.6, 1.7, 0.6] },
      { id: 'underfill', kind: 'underfill', owner: 'logic', bounds: [-0.63, -0.43, 0.43, 0.23] },
    ],
    bumpFields: [
      field('micro', 'logic', 'microbump', [-0.4, -0.3], 0.06, 0.01),
      field('coarse', 'lands', 'c4', [-1.5, 0.38], 0.1, 0.02),
    ],
    stacks: [],
    fineLinks: [],
  };
  for (const l of m.package.layers) rectangle(raw, l.bounds, 1);
  if (withHbm) {
    const port = { id: 'hbm:w2', side: 'w', point: [0.7, 0.045] };
    const hbm = component('hbm', 'hbm', [0.7, -0.4, 1.1, 0.3], [port]);
    m.components.push(hbm);
    const tsv = field('tsv', 'hbm', 'tsv', [0.77, 0.045], 0.03, 0.004);
    m.package.bumpFields.push(tsv);
    const underfill = { id: 'hbm-fill', kind: 'underfill', owner: 'hbm', bounds: [0.68, -0.42, 1.12, 0.32] };
    m.package.layers.push(underfill);
    rectangle(raw, underfill.bounds, 1);
    const stack = {
      owner: 'hbm',
      dieCount: 4,
      base: [...hbm.box],
      top: [0.74, -0.36, 1.06, 0.01],
      section: [0.74, 0.13, 1.06, 0.27],
      tsvField: 'tsv',
    };
    m.package.stacks.push(stack);
    for (const b of [stack.base, stack.top, stack.section]) rectangle(raw, b, 1);
    for (let i = 1; i < stack.dieCount; i++) {
      const y = stack.section[1] + (i * (stack.section[3] - stack.section[1])) / stack.dieCount;
      edge(raw, [stack.section[0], y], [stack.section[2], y]);
    }
    const link = {
      id: 'base-link',
      owner: 'hbm',
      fromPort: port.id,
      toField: 'tsv',
      toSite: { row: 0, col: 0 },
      points: [[...port.point], [...tsv.sites[0].point]],
    };
    m.package.fineLinks.push(link);
    edge(raw, ...link.points);
    m.nets.push({ id: 'hbm-data', from: port.id, to: 'logic:w2', points: [port.point, [0.4, 0.045]], vias: [] });
  }
  return { raw, model: m };
}

function viaCase() {
  const c = boardCase(),
    owner = c.model.components[0];
  const net = (id, points) => {
    for (const [index, point] of [points[0], points.at(-1)].entries())
      owner.ports.push({ id: `${id}-${index}`, side: 'w', point });
    return { id, from: `${id}-0`, to: `${id}-1`, points, vias: [points[1]] };
  };
  const a = net('viaA', [
      [0.9, -0.55],
      [1, -0.55],
      [1, -0.45],
    ]),
    b = net('nearby', [
      [1.03, -0.6],
      [1.03, -0.5],
      [1.15, -0.5],
    ]);
  c.model.nets.push(a, b);
  c.model.routePorts = [...new Set(c.model.nets.flatMap((n) => [n.from, n.to]))];
  for (const n of [a, b]) for (let i = 1; i < n.points.length; i++) edge(c.raw, n.points[i - 1], n.points[i]);
  for (const n of [a, b]) {
    const ring = {
      id: `${n.id}-ring`,
      owner: n.id,
      kind: 'via',
      center: [...n.vias[0]],
      innerRadius: 0.003,
      outerRadius: 0.006,
    };
    c.model.board.circles.push(ring);
    circle(c.raw, ring.center, ring.innerRadius);
    circle(c.raw, ring.center, ring.outerRadius);
  }
  return c;
}

function boardGridCase() {
  const c = boardCase(),
    pads = [];
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 3; col++) {
      const x = 1.1 + col * 0.1,
        y = -0.15 + row * 0.1;
      const p = { id: `ball-${row}-${col}`, box: [x - 0.01, y - 0.01, x + 0.01, y + 0.01], point: [x, y] };
      pads.push(p);
      rectangle(c.raw, p.box);
    }
  const f = { id: 'bga', owner: 'power', kind: 'bga', box: [1, -0.3, 1.5, 0.3], body: [1.04, -0.26, 1.46, 0.26], pads };
  c.model.board.footprints.push(f);
  rectangle(c.raw, f.box);
  rectangle(c.raw, f.body);
  c.model.board.repeats.push({
    id: 'balls',
    owner: 'power',
    kind: 'bga-grid',
    members: pads.map((p) => p.id),
    axis: 'x',
    pitch: 0.1,
    rows: 2,
    columns: 3,
  });
  return c;
}

function dieCase() {
  const raw = drawing(),
    m = model('die');
  raw.selectedKind = 'core';
  raw.w = [-0.55, -0.28];
  const groups = [];
  for (let col = 0; col < 2; col++) {
    const ids = [];
    for (let row = 0; row < 2; row++) {
      const id = `c${col}${row}`,
        x = col ? 0.55 : -0.55,
        y = row ? 0.28 : -0.28;
      const c = component(id, 'core', [x - 0.5, y - 0.25, x + 0.5, y + 0.25]);
      c.selected = col === 0 && row === 0;
      m.components.push(c);
      ids.push(id);
      if (c.selected) continue;
      rectangle(raw, c.box, 1);
      for (let i = 0; i < 10; i++) {
        const local = [0.1 + i * 0.06, 0.12, 0.13 + i * 0.06, 0.35];
        const project = (u, v) => [col ? c.box[2] - u : c.box[0] + u, c.box[1] + v];
        edge(raw, project(...local.slice(0, 2)), project(...local.slice(2)));
      }
    }
    groups.push({ ids, pitch: [1.1, 0.56], tile: [1, 0.5], mirrorX: col === 1 });
  }
  for (const [id, box] of [
    ['cacheL', [-1.5, -0.5, -1.15, 0.5]],
    ['cacheR', [1.15, -0.5, 1.5, 0.5]],
  ]) {
    m.components.push(component(id, 'cache', box));
    rectangle(raw, box);
    for (let i = 1; i <= 5; i++) {
      const x = box[0] + ((box[2] - box[0]) * i) / 6,
        y = box[1] + ((box[3] - box[1]) * i) / 6;
      edge(raw, [x, box[1] + 0.04], [x, box[3] - 0.04]);
      edge(raw, [box[0] + 0.04, y], [box[2] - 0.04, y]);
    }
  }
  m.dieLayout = {
    variant: 'four-core',
    coreIds: m.components.filter((c) => c.kind === 'core').map((c) => c.id),
    selectedId: 'c00',
    groups,
  };
  return { raw, model: m };
}

/** Exported for the aggregate adverse-fixture runner; imports do not execute tests. */
export async function runChipSurfaceSelftest() {
  let fixtures = 0;
  const fixture = (name, make, mutate, expected) => {
    const c = make();
    assert.deepEqual(inspectChipSurface(c.raw, c.model, c.finished), [], `${name}: hand-built baseline`);
    mutate(c);
    const issues = inspectChipSurface(c.raw, c.model, c.finished);
    assert(
      issues.some((s) => s.includes(expected)),
      `${name}: expected ${expected}, got ${issues.join('; ')}`,
    );
    fixtures++;
  };
  fixture('board metadata erased', boardCase, (c) => delete c.model.board, 'missing physical board layout');
  fixture(
    'preplanned routing terminals missing',
    viaCase,
    (c) => delete c.model.routePorts,
    'missing predeclared routing terminals',
  );
  fixture(
    'preplanned routing terminal is imaginary',
    viaCase,
    (c) => c.model.routePorts.push('ghost:pin'),
    'ghost predeclared routing terminal',
  );
  fixture(
    'preplanned routing terminal duplicated',
    viaCase,
    (c) => c.model.routePorts.push(c.model.routePorts[0]),
    'duplicate predeclared routing terminal',
  );
  fixture(
    'actual routed terminal was not predeclared',
    viaCase,
    (c) => c.model.routePorts.pop(),
    'used routing terminal was not predeclared',
  );
  fixture(
    'unused real terminal falsely predeclared',
    viaCase,
    (c) => {
      c.model.components[0].ports.push({ id: 'spare:pin', side: 'e', point: [1.7, 0] });
      c.model.routePorts.push('spare:pin');
    },
    'differ from actual net endpoints',
  );
  fixture('false phase count', boardCase, (c) => c.model.board.phaseCount++, 'phase count');
  fixture('floating board footprint', boardCase, (c) => (c.model.board.footprints[0].owner = 'invented'), 'real owner');
  fixture(
    'pad outside owner',
    boardCase,
    (c) => (c.model.board.footprints[0].pads[0].box[0] -= 0.5),
    'pad outside footprint',
  );
  fixture(
    'pad port lie',
    boardCase,
    (c) => (c.model.board.footprints[0].pads[0].port = 'missing-port'),
    'actual component port',
  );
  fixture('unemitted body edge', boardCase, (c) => c.raw.segs[2].splice(4, 1), 'missing emitted geometry');
  fixture(
    'dangling local trace',
    boardCase,
    (c) => (c.model.board.traces[0].points[0][0] += 0.02),
    'dangling trace endpoint',
  );
  fixture(
    'trace missing finite clearance',
    boardCase,
    (c) => (c.model.board.traces[0].clearance = 0),
    'finite trace width/clearance',
  );
  fixture(
    'bottom copper has no top-pad vias',
    boardCase,
    (c) => (c.model.board.traces[0].layer = 'bottom'),
    'bottom trace lacks via',
  );
  fixture(
    'same-layer traces cross between valid endpoints',
    boardCase,
    (c) => {
      const owner = c.model.components[0],
        points = [
          [-0.35, -0.6],
          [-0.35, 0.6],
        ];
      owner.ports.push({ id: 'crossN', side: 'n', point: points[0] }, { id: 'crossS', side: 's', point: points[1] });
      c.model.board.traces.push({
        id: 'cross',
        owner: owner.id,
        from: 'crossN',
        to: 'crossS',
        points,
        net: 'SW',
        layer: 'top',
        width: 0.001,
        clearance: 0.001,
      });
      edge(c.raw, ...points);
    },
    'same-layer traces intersect',
  );
  fixture(
    'parallel traces violate finite clearance without crossing',
    boardCase,
    (c) => {
      const points = [
        [-0.6, -0.2485],
        [0, -0.2485],
      ];
      const a = component(
        'extraPad0',
        'pad',
        [-0.62, -0.2495, -0.6, -0.2475],
        [{ id: 'extraP0', side: 'e', point: points[0] }],
      );
      const b = component(
        'extraPad1',
        'pad',
        [0, -0.2495, 0.02, -0.2475],
        [{ id: 'extraP1', side: 'w', point: points[1] }],
      );
      c.model.components.push(a, b);
      rectangle(c.raw, a.box);
      rectangle(c.raw, b.box);
      c.model.board.traces.push({
        id: 'too-close',
        owner: 'power',
        from: 'extraP0',
        to: 'extraP1',
        points,
        net: 'OTHER',
        layer: 'top',
        width: 0.001,
        clearance: 0.001,
      });
      edge(c.raw, ...points);
    },
    'same-layer trace clearance',
  );
  fixture(
    'local trace gap between samples',
    boardCase,
    (c) => {
      const t = c.model.board.traces[0],
        s = [...t.points[0], ...t.points[1]],
        arr = c.raw.segs[2],
        i = arr.findIndex((v) => v.every((n, j) => n === s[j]));
      const at = (u) => [s[0] + u * (s[2] - s[0]), s[1] + u * (s[3] - s[1])];
      arr.splice(i, 1, [...at(0), ...at(0.23)], [...at(0.25), ...at(1)]);
    },
    'missing emitted geometry',
  );
  fixture(
    'finite via footprint hits nearby trace while center stays valid',
    viaCase,
    (c) => {
      const ring = c.model.board.circles.find((v) => v.owner === 'viaA');
      ring.outerRadius = 0.035;
      circle(c.raw, ring.center, ring.outerRadius);
    },
    'via contact overlaps unrelated net',
  );
  fixture(
    'finite via footprints overlap without touching centerlines',
    viaCase,
    (c) => {
      const a = c.model.board.circles.find((v) => v.owner === 'viaA'),
        b = c.model.board.circles.find((v) => v.owner === 'nearby');
      // Neither ring reaches the other's routed segments, but the finite annuli overlap.
      a.outerRadius = 0.0298;
      b.outerRadius = 0.0298;
      circle(c.raw, a.center, a.outerRadius);
      circle(c.raw, b.center, b.outerRadius);
    },
    'via contact footprints overlap',
  );
  fixture('via evidence omitted', viaCase, (c) => c.model.board.circles.splice(1, 1), 'missing annular via contact');
  fixture(
    'body-crossing trace',
    boardCase,
    (c) => {
      const t = c.model.board.traces[0];
      t.points.splice(1, 0, [-1.1, -0.15]);
      for (let i = 1; i < t.points.length; i++) edge(c.raw, t.points[i - 1], t.points[i]);
    },
    'crosses component body',
  );
  fixture(
    'hole represented by dot',
    boardCase,
    (c) => {
      c.raw.segs[2].splice(-20);
      c.raw.dots.push([0, 0.65]);
    },
    'missing complete circle',
  );
  fixture(
    'irregular repeated bank',
    boardCase,
    (c) => (c.model.board.repeats[0].pitch += 0.02),
    'irregular repeated pitch',
  );
  fixture(
    'repeated member duplicate',
    boardCase,
    (c) => (c.model.board.repeats[0].members[1] = 'cap0'),
    'invalid repeated members',
  );
  fixture('package metadata erased', packageCase, (c) => delete c.model.package, 'missing physical packaging layout');
  fixture(
    'finished bump chord erased',
    () => {
      const c = packageCase();
      c.finished = clone(c.raw);
      return c;
    },
    (c) => c.finished.segs[2].splice(3, 1),
    'missing finished geometry',
  );
  fixture(
    'package variant relabelled without companion die',
    packageCase,
    (c) => (c.model.package.variant = 'paired-logic'),
    'physical die/chiplet arrangement',
  );
  fixture(
    'contact field escaped owner',
    packageCase,
    (c) => (c.model.package.bumpFields[0].owner = 'lands'),
    'cutaway outside real owner',
  );
  fixture(
    'missing field site',
    packageCase,
    (c) => c.model.package.bumpFields[0].sites.pop(),
    'incomplete regular contact field',
  );
  fixture(
    'duplicated field site',
    packageCase,
    (c) => (c.model.package.bumpFields[0].sites[1] = clone(c.model.package.bumpFields[0].sites[0])),
    'duplicate or invalid contact index',
  );
  fixture(
    'field pitch lie',
    packageCase,
    (c) => (c.model.package.bumpFields[0].pitch[0] += 0.001),
    'irregular contact pitch',
  );
  fixture(
    'bump overhang',
    packageCase,
    (c) => (c.model.package.bumpFields[0].box[0] = -0.4),
    'overhangs declared cutaway',
  );
  fixture(
    'circles overlap',
    packageCase,
    (c) => (c.model.package.bumpFields[0].radius = 0.04),
    'invalid regular contact field',
  );
  fixture('missing bump chord', packageCase, (c) => c.raw.segs[2].splice(3, 1), 'missing complete circle');
  fixture(
    'tiny gap with chord endpoints and midpoint retained',
    packageCase,
    (c) => {
      const s = c.raw.segs[2][3],
        at = (u) => [s[0] + u * (s[2] - s[0]), s[1] + u * (s[3] - s[1])];
      c.raw.segs[2].splice(3, 1, [...at(0), ...at(0.23)], [...at(0.25), ...at(1)]);
    },
    'missing complete circle',
  );
  fixture('detached underfill', packageCase, (c) => (c.model.package.layers[2].bounds[0] += 0.1), 'underfill detached');
  fixture(
    'underfill metadata erased',
    packageCase,
    (c) => c.model.package.layers.pop(),
    'missing unique attached underfill',
  );
  fixture(
    'stretched enclosing underfill',
    packageCase,
    (c) => (c.model.package.layers[2].bounds = [-0.8, -0.6, 0.6, 0.4]),
    'thin attached uniform fillet',
  );
  fixture(
    'offset enclosing underfill',
    packageCase,
    (c) => (c.model.package.layers[2].bounds[0] -= 0.02),
    'thin attached uniform fillet',
  );
  fixture(
    'interposer outside substrate',
    packageCase,
    (c) => (c.model.package.layers[1].bounds[0] = -1.85),
    'containment',
  );
  fixture(
    'HBM stack metadata omitted',
    () => packageCase(true),
    (c) => c.model.package.stacks.pop(),
    'HBM has no physical stack',
  );
  fixture(
    'HBM layer count changed without real layers',
    () => packageCase(true),
    (c) => (c.model.package.stacks[0].dieCount = 8),
    'missing emitted geometry',
  );
  fixture(
    'HBM fine link omitted',
    () => packageCase(true),
    (c) => c.model.package.fineLinks.pop(),
    'misses TSV base field',
  );
  fixture(
    'contact patch lies under opaque stack',
    () => packageCase(true),
    (c) => (c.model.package.stacks[0].top[3] = 0.12),
    'overlaps opaque HBM stack',
  );
  fixture(
    'HBM endpoint correct but crosses nearer TSV circles',
    () => packageCase(true),
    (c) => {
      const link = c.model.package.fineLinks[0],
        field = c.model.package.bumpFields.find((f) => f.id === 'tsv');
      link.toSite.col = 2;
      link.points[1] = [...field.sites[2].point];
      edge(c.raw, ...link.points);
    },
    'fine link intersects another contact',
  );
  fixture('die metadata erased', dieCase, (c) => delete c.model.dieLayout, 'missing physical die layout');
  fixture(
    'false repeated dimensions',
    dieCase,
    (c) => (c.model.dieLayout.groups[0].tile[0] += 0.01),
    'dimensions disagree',
  );
  fixture('false repeated pitch', dieCase, (c) => (c.model.dieLayout.groups[0].pitch[1] += 0.01), 'placement pitch');
  fixture(
    'unused horizontal pitch lies about real columns',
    dieCase,
    (c) => (c.model.dieLayout.groups[0].pitch[0] = 1.2),
    'declared lattice',
  );
  fixture('unregistered selected tile', dieCase, (c) => (c.model.dieLayout.selectedId = 'c01'), 'selected core');
  fixture(
    'variant label changed without physical layout',
    dieCase,
    (c) => (c.model.dieLayout.variant = 'six-core'),
    'actual core topology',
  );
  fixture(
    'side LLC relabelled central',
    dieCase,
    (c) => (c.model.dieLayout.variant = 'paired-columns'),
    'LLC placement',
  );
  fixture(
    'false core mirror label',
    dieCase,
    (c) => (c.model.dieLayout.groups[1].mirrorX = false),
    'declared mirroring',
  );
  fixture(
    'core interior omitted',
    dieCase,
    (c) => {
      const b = c.model.components.find((v) => v.id === 'c11').box;
      c.raw.segs[2] = c.raw.segs[2].filter((s) => !(s[0] > b[0] && s[0] < b[2] && s[1] > b[1] && s[1] < b[3]));
    },
    'internal structure',
  );
  fixture(
    'board evidence hidden by false level',
    boardCase,
    (c) => {
      c.model.level = 'rack';
      delete c.model.board;
    },
    'missing physical board layout',
  );
  fixture(
    'package evidence hidden by false level',
    packageCase,
    (c) => {
      c.model.level = 'rack';
      delete c.model.package;
    },
    'missing physical packaging layout',
  );
  fixture(
    'die evidence hidden by false level',
    dieCase,
    (c) => {
      c.model.level = 'rack';
      delete c.model.dieLayout;
    },
    'missing physical die layout',
  );
  fixture(
    'package evidence hidden by false era',
    packageCase,
    (c) => {
      c.model.era = 'nmos';
      delete c.model.package;
    },
    'missing physical packaging layout',
  );
  fixture(
    'LLC is an empty labelled rectangle',
    dieCase,
    (c) => {
      const cache = c.model.components.find((v) => v.id === 'cacheR'),
        b = cache.box;
      c.raw.segs[2] = c.raw.segs[2].filter(
        (s) =>
          !(
            s[0] > b[0] &&
            s[0] < b[2] &&
            s[1] > b[1] &&
            s[1] < b[3] &&
            s[2] > b[0] &&
            s[2] < b[2] &&
            s[3] > b[1] &&
            s[3] < b[3]
          ),
      );
    },
    'LLC lacks emitted memory array',
  );
  // Positive cases distinguish geometric requirements from implementation conventions.
  fixture(
    'BGA grid evidence erased',
    boardGridCase,
    (c) => c.model.board.repeats.pop(),
    'missing regular pad-array evidence',
  );
  fixture(
    'BGA row pitch differs while columns remain regular',
    boardGridCase,
    (c) => {
      const f = c.model.board.footprints.at(-1);
      for (const p of f.pads.slice(3)) {
        p.box[1] += 0.01;
        p.box[3] += 0.01;
        p.point[1] += 0.01;
        rectangle(c.raw, p.box);
      }
    },
    'irregular repeated grid pitch',
  );
  fixture(
    'BGA grid member omitted',
    boardGridCase,
    (c) => c.model.board.repeats.at(-1).members.pop(),
    'incomplete repeated grid',
  );
  fixture(
    'mounting annulus crosses trace while its center stays clear',
    boardCase,
    (c) => {
      const ring = c.model.board.circles[0];
      ring.center = [-0.35, -0.3];
      c.model.components.find((v) => v.id === ring.owner).box = [-0.45, -0.4, -0.25, -0.2];
      circle(c.raw, ring.center, ring.innerRadius);
      circle(c.raw, ring.center, ring.outerRadius);
    },
    'route enters mounting annulus',
  );
  fixture(
    'contact radius is nonfinite',
    packageCase,
    (c) => (c.model.package.bumpFields[0].radius = NaN),
    'invalid regular contact field',
  );
  const angled = boardCase(),
    trace = angled.model.board.traces[0];
  trace.points.splice(1, 0, [-0.5, 0.11], [-0.2, 0.11]);
  for (let i = 1; i < trace.points.length; i++) edge(angled.raw, trace.points[i - 1], trace.points[i]);
  assert.deepEqual(
    inspectChipSurface(angled.raw, angled.model),
    [],
    '45-degree traces do not require phantom bend vias',
  );
  const split = packageCase(),
    chord = split.raw.segs[2][3],
    middle = [(chord[0] + chord[2]) / 2, (chord[1] + chord[3]) / 2];
  split.raw.segs[2].splice(3, 1, [...chord.slice(0, 2), ...middle], [...middle, ...chord.slice(2)]);
  assert.deepEqual(
    inspectChipSurface(split.raw, split.model),
    [],
    'complete circles may contain split collinear chords',
  );
  const incidental = packageCase(),
    f = incidental.model.package.bumpFields[0],
    p = f.sites[0].point;
  edge(incidental.raw, [p[0], p[1] - f.radius], [p[0], p[1] + f.radius]);
  assert.deepEqual(
    inspectChipSurface(incidental.raw, incidental.model),
    [],
    'incidental radial pad corners do not redefine the circle polygon',
  );
  console.log(
    `chip surface selftest: ${fixtures} adverse field, footprint, route and physical-variant fixtures rejected`,
  );
  return fixtures;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await runChipSurfaceSelftest();
