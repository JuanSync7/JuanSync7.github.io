#!/usr/bin/env node
/** Independent electrical and emitted-geometry checks for the CMOS stick diagrams. */
import { pathToFileURL } from 'node:url';
import { loadKernel } from './load.mjs';
import {
  EPS,
  boxOverlapInterior,
  insideBox,
  pointOnPolyline,
  polylineSegments,
  reachable,
  routeCoveredByLinework,
  samePoint,
  segmentCoveredByLinework,
  segmentHitsBoxInterior,
  segmentIntersection,
  validBox,
} from './geometry.mjs';

const expressionValue = (e, bits) =>
  'leaf' in e
    ? bits[e.leaf]
    : e.op === 's'
      ? e.kids.every((k) => expressionValue(k, bits))
      : e.kids.some((k) => expressionValue(k, bits));
const netlist = (g) =>
  g.pull.flatMap((side, index) =>
    side.lr.map(([a, b], input) => ({
      a,
      b,
      input: index === 0 && g.kind === 'nmos-load' ? -1 : input,
      type: index ? 'n' : g.kind === 'nmos-load' ? 'd' : 'p',
    })),
  );

export function inspectGateTruth(g) {
  const issues = [];
  if (
    !['cmos', 'nmos-load'].includes(g.kind) ||
    !Number.isInteger(g.inputs) ||
    g.inputs < 1 ||
    g.inputs > 4 ||
    g.pull.length !== 2
  )
    return ['invalid gate topology'];
  const fets = netlist(g);
  if (g.kind === 'cmos' && fets.length !== g.inputs * 2) issues.push('missing CMOS transistor');
  if (
    g.kind === 'nmos-load' &&
    (fets.length !== g.inputs + 1 ||
      fets.filter((f) => f.type === 'd').length !== 1 ||
      fets.some((f) => f.type === 'p') ||
      g.pull[0].lr.length !== 1 ||
      g.pull[0].lr[0][0] !== 'VDD' ||
      g.pull[0].lr[0][1] !== 'OUT')
  )
    issues.push('NMOS load topology mismatch');
  for (let state = 0; state < 2 ** g.inputs; state++) {
    const bits = Array.from({ length: g.inputs }, (_, i) => Boolean(state & (1 << i)));
    const active = fets
      .filter((f) => f.type === 'd' || (f.type === 'n' ? bits[f.input] : !bits[f.input]))
      .map((f) => [f.a, f.b]);
    const connected = reachable('OUT', active);
    const low = connected.has('GND'),
      high = connected.has('VDD');
    if (g.kind === 'nmos-load' && !high) issues.push(`state ${state}: NMOS load missing`);
    if (g.kind === 'cmos' && low === high) issues.push(`state ${state}: ${low ? 'VDD/GND short' : 'floating output'}`);
    if (low !== expressionValue(g.expression, bits))
      issues.push(`state ${state}: transistor netlist disagrees with logic`);
  }
  return [...new Set(issues)];
}

const rectangle = ([x0, y0, x1, y1]) => [
  [x0, y0, x1, y0],
  [x1, y0, x1, y1],
  [x1, y1, x0, y1],
  [x0, y1, x0, y0],
];

const contactBounds = (c) => [c.point[0] - c.size, c.point[1] - c.size, c.point[0] + c.size, c.point[1] + c.size];

/** A contact occupies a metal square, not just its centre. Its full footprint must
 * stay clear of every unrelated conductor/contact on each layer it joins. */
export function inspectContactFootprints(wires, contacts) {
  const issues = [];
  const conductors = wires.map((wire) => ({
    wire,
    segments: polylineSegments(wire.points),
    bounds: [
      Math.min(...wire.points.map((p) => p[0])),
      Math.min(...wire.points.map((p) => p[1])),
      Math.max(...wire.points.map((p) => p[0])),
      Math.max(...wire.points.map((p) => p[1])),
    ],
  }));
  const pads = contacts.map((contact) => ({ contact, bounds: contactBounds(contact) }));
  for (const { contact, bounds } of pads)
    for (const { wire, segments, bounds: extent } of conductors) {
      if (
        wire.net === contact.net ||
        !contact.layers.includes(wire.layer) ||
        extent[2] < bounds[0] ||
        extent[0] > bounds[2] ||
        extent[3] < bounds[1] ||
        extent[1] > bounds[3]
      )
        continue;
      if (segments.some((s) => segmentHitsBoxInterior(s, bounds)))
        issues.push(`${contact.net}/${wire.net}: contact footprint shorts signals`);
    }
  for (let i = 0; i < pads.length; i++)
    for (const other of pads.slice(i + 1)) {
      const { contact, bounds } = pads[i];
      if (
        contact.net !== other.contact.net &&
        contact.layers.some((layer) => other.contact.layers.includes(layer)) &&
        boxOverlapInterior(bounds, other.bounds)
      )
        issues.push(`${contact.net}/${other.contact.net}: contact footprints overlap`);
    }
  return [...new Set(issues)];
}

function electricallyConnected(layout, terminals) {
  const wires = layout.wires.filter((w) => w.net === terminals[0].net);
  const contacts = layout.contacts.filter((c) => c.net === terminals[0].net);
  const nodes = [
    ...terminals,
    ...wires.flatMap((w) => w.points.map((point) => ({ net: w.net, layer: w.layer, point }))),
    ...contacts.flatMap((c) => c.layers.map((layer) => ({ net: c.net, layer, point: c.point }))),
  ];
  const parent = nodes.map((_, i) => i);
  const root = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (a, b) => {
    parent[root(a)] = root(b);
  };
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++)
      if (nodes[i].layer === nodes[j].layer && samePoint(nodes[i].point, nodes[j].point)) union(i, j);
  for (const wire of wires) {
    const hits = nodes
      .map((n, i) => (n.layer === wire.layer && pointOnPolyline(n.point, wire.points) ? i : -1))
      .filter((i) => i >= 0);
    for (const i of hits.slice(1)) union(hits[0], i);
  }
  for (const via of contacts) {
    const hits = nodes
      .map((n, i) => (via.layers.includes(n.layer) && samePoint(n.point, via.point) ? i : -1))
      .filter((i) => i >= 0);
    for (const i of hits.slice(1)) union(hits[0], i);
  }
  return terminals.every((_, i) => root(i) === root(0));
}

export function inspectGateLayout(layout, raw) {
  const issues = [...inspectGateTruth(layout.gate)];
  const margin = Math.max(1e-6, ...layout.contacts.map((c) => c.size)) + EPS;
  const local = [
    layout.bounds[0] - margin,
    layout.bounds[1] - margin,
    layout.bounds[2] + margin,
    layout.bounds[3] + margin,
  ];
  // Keep complete intersecting candidates, including long global rails. A conductor
  // covering local geometry must intersect this box, so this pruning is lossless.
  const linework = raw.segs
    .flat()
    .filter(
      ([x0, y0, x1, y1]) =>
        Math.max(x0, x1) >= local[0] &&
        Math.min(x0, x1) <= local[2] &&
        Math.max(y0, y1) >= local[1] &&
        Math.min(y0, y1) <= local[3],
    );
  if (
    !validBox(layout.bounds) ||
    layout.fets.length !== (layout.gate.kind === 'nmos-load' ? layout.gate.inputs + 1 : layout.gate.inputs * 2)
  )
    issues.push('missing physical transistor evidence');
  const expected = netlist(layout.gate);
  for (const transistor of layout.fets) {
    const f = expected.find((f) => f.type === transistor.type && f.input === transistor.input);
    if (!f || f.a !== transistor.left.net || f.b !== transistor.right.net)
      issues.push('physical transistor netlist mismatch');
    if (![transistor.gate, transistor.left.point, transistor.right.point].every((p) => insideBox(p, layout.bounds)))
      issues.push('transistor outside cell boundary');
    if (
      !(
        transistor.left.point[0] < transistor.gate[0] - EPS &&
        transistor.gate[0] < transistor.right.point[0] - EPS &&
        Math.abs(transistor.left.point[1] - transistor.gate[1]) <= EPS &&
        Math.abs(transistor.right.point[1] - transistor.gate[1]) <= EPS
      )
    )
      issues.push('invalid physical channel placement');
    if (
      !layout.strips.some(
        (b) =>
          insideBox(transistor.gate, b) && insideBox(transistor.left.point, b) && insideBox(transistor.right.point, b),
      )
    )
      issues.push('transistor outside diffusion strip');
    const control = transistor.type === 'd' ? 'OUT' : `IN${transistor.input}`;
    if (transistor.control !== control) issues.push('incorrect physical gate control');
    const poly = layout.wires.find((w) => w.net === control && w.layer === 'poly');
    if (!poly || !pointOnPolyline(transistor.gate, poly.points)) issues.push('gate disconnected from input poly');
  }
  for (const strip of layout.strips)
    if (!validBox(strip) || !rectangle(strip).every((s) => segmentCoveredByLinework(s, linework)))
      issues.push('diffusion strip missing from linework');
  for (const wire of layout.wires) {
    if (wire.points.some((p) => !insideBox(p, layout.bounds))) issues.push(`${wire.net}: wire outside cell boundary`);
    if (!routeCoveredByLinework(wire.points, linework)) issues.push(`${wire.net}: conductor missing from linework`);
  }
  for (const contact of layout.contacts) {
    const [x, y] = contact.point,
      r = contact.size;
    if (
      !Number.isFinite(r) ||
      r <= EPS ||
      !rectangle([x - r, y - r, x + r, y + r]).every((s) => segmentCoveredByLinework(s, linework))
    )
      issues.push(`${contact.net}: contact missing from linework`);
    const wireLayers = layout.wires
      .filter((w) => w.net === contact.net && pointOnPolyline(contact.point, w.points))
      .map((w) => w.layer);
    if (
      contact.layers.length > 1 &&
      contact.layers.some((layer) => !wireLayers.includes(layer)) &&
      !layout.pins.some((pin) => pin.net === contact.net && samePoint(pin.point, contact.point))
    )
      issues.push(`${contact.net}: via misses conductor`);
  }
  for (let i = 0; i < layout.wires.length; i++)
    for (const other of layout.wires.slice(i + 1)) {
      const wire = layout.wires[i];
      if (wire.net === other.net || wire.layer !== other.layer) continue;
      if (
        polylineSegments(wire.points).some((a) =>
          polylineSegments(other.points).some((b) => segmentIntersection(a, b).type !== 'none'),
        )
      )
        issues.push(`${wire.net}/${other.net}: same-layer short`);
    }
  for (const contact of layout.contacts)
    for (const wire of layout.wires) {
      if (
        wire.net !== contact.net &&
        contact.layers.includes(wire.layer) &&
        pointOnPolyline(contact.point, wire.points)
      )
        issues.push(`${contact.net}/${wire.net}: contact shorts signals`);
    }
  issues.push(...inspectContactFootprints(layout.wires, layout.contacts));
  const terminals = [
    ...layout.fets.flatMap((f) => [f.left, f.right, { net: f.control, point: f.gate, layer: 'poly' }]),
    ...layout.pins,
  ];
  for (let i = 0; i < terminals.length; i++)
    for (const other of terminals.slice(i + 1))
      if (
        terminals[i].net !== other.net &&
        terminals[i].layer === other.layer &&
        samePoint(terminals[i].point, other.point)
      )
        issues.push('different nets share an unbroken diffusion terminal');
  for (const net of new Set(terminals.map((p) => p.net))) {
    const sameNet = terminals.filter((p) => p.net === net);
    if (!electricallyConnected(layout, sameNet)) issues.push(`${net}: floating physical terminal`);
  }
  for (const net of ['VDD', 'GND', 'OUT', ...Array.from({ length: layout.gate.inputs }, (_, i) => `IN${i}`)])
    if (!layout.pins.some((p) => p.net === net)) issues.push(`${net}: missing pin`);
  return [...new Set(issues)];
}

/** Every cell's local supply pins must reach the global margin straps through real
 * rail centerlines and declared vias. Individual gate correctness alone cannot prove it. */
export function inspectSupplyNetwork(plan, raw) {
  if (!plan.gates?.length || !plan.supplyWires?.length || !plan.supplyContacts?.length || !plan.supplyPins?.length)
    return ['missing shared cell supply evidence'];
  const issues = [],
    linework = raw.segs.flat();
  const wires = [
    ...plan.supplyWires,
    ...plan.gates.flatMap((g) => g.wires.filter((w) => w.net === 'VDD' || w.net === 'GND')),
  ];
  const contacts = [
    ...plan.supplyContacts,
    ...plan.gates.flatMap((g) => g.contacts.filter((c) => c.net === 'VDD' || c.net === 'GND')),
  ];
  for (const wire of plan.supplyWires) {
    if (!routeCoveredByLinework(wire.points, linework)) issues.push(`${wire.net}: shared supply missing from linework`);
    for (const point of [wire.points[0], wire.points.at(-1)])
      if (
        !plan.supplyContacts.some(
          (c) => c.net === wire.net && c.layers.includes(wire.layer) && samePoint(c.point, point),
        )
      )
        issues.push(`${wire.net}: hanging shared supply endpoint`);
  }
  for (const contact of plan.supplyContacts) {
    const [x, y] = contact.point,
      r = contact.size;
    if (!rectangle([x - r, y - r, x + r, y + r]).every((s) => segmentCoveredByLinework(s, linework)))
      issues.push(`${contact.net}: shared supply contact not drawn`);
    if (
      contact.layers.some(
        (layer) =>
          !wires.some((w) => w.net === contact.net && w.layer === layer && pointOnPolyline(contact.point, w.points)),
      )
    )
      issues.push(`${contact.net}: shared supply contact misses conductor`);
  }
  for (const net of ['VDD', 'GND']) {
    const terminals = [
      ...plan.gates.flatMap((g) => g.pins.filter((p) => p.net === net)),
      ...plan.supplyPins.filter((p) => p.net === net),
    ];
    if (plan.supplyPins.filter((p) => p.net === net && p.layer === 'm1').length !== 2)
      issues.push(`${net}: missing global supply IO pads`);
    if (!terminals.length || !electricallyConnected({ wires, contacts }, terminals))
      issues.push(`${net}: cell row disconnected from global supply`);
  }
  for (let i = 0; i < wires.length; i++)
    for (const other of wires.slice(i + 1)) {
      const wire = wires[i];
      if (wire.net === other.net || wire.layer !== other.layer) continue;
      if (
        polylineSegments(wire.points).some((a) =>
          polylineSegments(other.points).some((b) => segmentIntersection(a, b).type !== 'none'),
        )
      )
        issues.push('shared VDD/GND same-layer short');
    }
  for (const contact of contacts)
    for (const wire of wires)
      if (
        contact.net !== wire.net &&
        contact.layers.includes(wire.layer) &&
        pointOnPolyline(contact.point, wire.points)
      )
        issues.push('shared supply via shorts VDD/GND');
  const scoped = (net, index) => (net === 'VDD' || net === 'GND' ? net : `gate${index}:${net}`);
  const allWires = [
    ...plan.supplyWires,
    ...plan.gates.flatMap((g, index) => g.wires.map((wire) => ({ ...wire, net: scoped(wire.net, index) }))),
  ];
  const allContacts = [
    ...plan.supplyContacts,
    ...plan.gates.flatMap((g, index) => g.contacts.map((contact) => ({ ...contact, net: scoped(contact.net, index) }))),
  ];
  issues.push(...inspectContactFootprints(allWires, allContacts));
  return [...new Set(issues)];
}

export async function gateKernel() {
  return loadKernel(
    "export {gate,gateNetlist,stick,width} from './src/figures/kit/gates';export {physicalCells,physicalDatapath} from './src/figures/kit/chip-cells';",
  );
}
export function generateGateCase(k, seed, flip = false, kind = 'cmos') {
  const raw = new k.Sketch(k.mulberry32(seed), [1.2, 0.5]),
    g = k.gate(raw.rng, kind);
  const layout = k.stick(raw, g, -1.6, -0.6, 1.1, 0.35, flip);
  return { raw, layout };
}
export async function runGateCheck(count = 256) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 10000) throw new Error('gate seed count must be 1–10000');
  const k = await gateKernel(),
    failures = [];
  let states = 0,
    transistors = 0;
  for (const kind of ['cmos', 'nmos-load'])
    for (let seed = 1; seed <= count; seed++)
      for (const flip of [false, true]) {
        const c = generateGateCase(k, seed, flip, kind),
          issues = inspectGateLayout(c.layout, c.raw);
        if (issues.length) failures.push({ kind, seed, flip, issues });
        states += 2 ** c.layout.gate.inputs;
        transistors += c.layout.fets.length;
      }
  if (failures.length) {
    console.error(JSON.stringify(failures.slice(0, 8), null, 2));
    throw new Error(`gate check: ${failures.length} failures`);
  }
  console.log(
    `gates: ${count * 4} CMOS/NMOS layouts · ${transistors} transistor placements · ${states} exhaustive truth-table states · emitted conductors/contacts checked`,
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await runGateCheck(Number(process.argv.find((a) => a.startsWith('--seeds='))?.slice(8) ?? 256));
