#!/usr/bin/env node
/** Independent physical connectivity and matching audit for an analog MOS array. */
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { loadKernel } from './load.mjs';
import {
  EPS,
  finitePoint,
  insideBox,
  boxOverlapInterior,
  orthogonalRoute,
  pointOnPolyline,
  pointOnSegment,
  polylineSegments,
  samePoint,
  segmentCoveredByLinework,
  routeCoveredByLinework,
  segmentHitsBoxInterior,
  segmentIntersection,
  validBox,
} from './geometry.mjs';

const NETS = ['GA', 'GB', 'S', 'DA', 'DB'];
const rect = ([a, b, c, d]) => [
  [a, b, c, b],
  [c, b, c, d],
  [c, d, a, d],
  [a, d, a, b],
];
const boxWithin = (a, b) => insideBox(a.slice(0, 2), b) && insideBox(a.slice(2), b);
const contactBox = (c) => [c.point[0] - c.size, c.point[1] - c.size, c.point[0] + c.size, c.point[1] + c.size];
const onBoundary = (p, b) =>
  insideBox(p, b) &&
  Math.min(Math.abs(p[0] - b[0]), Math.abs(p[0] - b[2]), Math.abs(p[1] - b[1]), Math.abs(p[1] - b[3])) <= EPS;

/** Build conductivity from geometry on each layer; labels do not create connections or
 * excuse shorts. Contacts connect every declared layer over their entire drawn square. */
function inspectConnectivity(layout, terminals) {
  const issues = [],
    nodes = [];
  const add = (net, layer, point) => {
    nodes.push({ net, layer, point });
    return nodes.length - 1;
  };
  const wireNodes = layout.wires.map((w) => add(w.net, w.layer, w.points[0]));
  const contactNodes = layout.contacts.map((c) => c.layers.map((layer) => add(c.net, layer, c.point)));
  const terminalNodes = terminals.map((t) => add(t.net, t.layer, t.point));
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
  for (let i = 0; i < layout.wires.length; i++)
    for (let j = i + 1; j < layout.wires.length; j++) {
      const a = layout.wires[i],
        b = layout.wires[j];
      if (
        a.layer === b.layer &&
        polylineSegments(a.points).some((s) =>
          polylineSegments(b.points).some((t) => segmentIntersection(s, t).type !== 'none'),
        )
      )
        union(wireNodes[i], wireNodes[j]);
    }
  for (let i = 0; i < layout.contacts.length; i++) {
    const c = layout.contacts[i],
      box = contactBox(c),
      ids = contactNodes[i];
    for (const id of ids.slice(1)) union(ids[0], id);
    for (let j = 0; j < layout.wires.length; j++) {
      const w = layout.wires[j],
        at = c.layers.indexOf(w.layer);
      if (
        at >= 0 &&
        (pointOnPolyline(c.point, w.points) || polylineSegments(w.points).some((s) => segmentHitsBoxInterior(s, box)))
      )
        union(ids[at], wireNodes[j]);
    }
    for (let j = i + 1; j < layout.contacts.length; j++) {
      const other = layout.contacts[j];
      if (!boxOverlapInterior(box, contactBox(other))) continue;
      for (const layer of c.layers)
        if (other.layers.includes(layer))
          union(ids[c.layers.indexOf(layer)], contactNodes[j][other.layers.indexOf(layer)]);
    }
  }
  for (let i = 0; i < terminals.length; i++) {
    const t = terminals[i],
      id = terminalNodes[i];
    for (let j = i + 1; j < terminals.length; j++)
      if (t.layer === terminals[j].layer && samePoint(t.point, terminals[j].point)) union(id, terminalNodes[j]);
    layout.wires.forEach((w, j) => {
      if (w.layer === t.layer && pointOnPolyline(t.point, w.points)) union(id, wireNodes[j]);
    });
    layout.contacts.forEach((c, j) => {
      const layer = c.layers.indexOf(t.layer);
      if (layer >= 0 && insideBox(t.point, contactBox(c))) union(id, contactNodes[j][layer]);
    });
  }
  const nets = new Map();
  for (let i = 0; i < nodes.length; i++) {
    const id = root(i),
      seen = nets.get(id) ?? new Set();
    seen.add(nodes[i].net);
    nets.set(id, seen);
  }
  for (const seen of nets.values())
    if (seen.size > 1) issues.push(`matched contact/conductor short: ${[...seen].sort().join('/')}`);
  for (const net of NETS) {
    const members = nodes.map((n, i) => (n.net === net ? i : -1)).filter((i) => i >= 0);
    if (!members.length || members.some((i) => root(i) !== root(members[0])))
      issues.push(`${net}: floating matched electrode`);
  }
  return issues;
}

export function inspectMatchedFingers(layout, raw, expectedCount) {
  const issues = [];
  if (
    !layout ||
    !validBox(layout.bounds) ||
    !validBox(layout.active) ||
    !Array.isArray(layout.fingers) ||
    !layout.fingers.length
  )
    return ['missing matched-finger geometry'];
  const outer = layout.footprint ?? layout.bounds;
  if (!validBox(outer) || !boxWithin(layout.bounds, outer) || !boxWithin(layout.active, layout.bounds))
    issues.push('matched active region outside boundary');
  // A contact's own corrupt size must not expand the area allowed to contain it.
  const margin = Math.max(
    EPS,
    Math.min((layout.bounds[2] - layout.bounds[0]) / layout.fingers.length, layout.active[3] - layout.active[1]) / 4,
  );
  const nearby = [outer[0] - margin, outer[1] - margin, outer[2] + margin, outer[3] + margin];
  const linework = raw.segs
    .flat()
    .filter(
      ([x0, y0, x1, y1]) =>
        Math.max(x0, x1) >= nearby[0] &&
        Math.min(x0, x1) <= nearby[2] &&
        Math.max(y0, y1) >= nearby[1] &&
        Math.min(y0, y1) <= nearby[3],
    );
  const fs = layout.fingers;
  if (fs.length !== expectedCount || fs.length % 4) issues.push('incomplete matched-finger unit');
  if (!layout.buses?.length || !layout.buses.every((s) => segmentCoveredByLinework(s, linework)))
    issues.push('matched gate bus missing from drawing');
  if (!rect(layout.active).every((s) => segmentCoveredByLinework(s, linework)))
    issues.push('matched diffusion strip missing from drawing');
  const totals = { A: { x: 0, count: 0 }, B: { x: 0, count: 0 } };
  for (const [i, finger] of fs.entries()) {
    const s = finger.segment,
      group = i % 4 === 0 || i % 4 === 3 ? 'A' : 'B';
    if (finger.group !== group) issues.push('matched array breaks ABBA order');
    if (
      !s?.every(Number.isFinite) ||
      s.length !== 4 ||
      !insideBox(s.slice(0, 2), layout.bounds) ||
      !insideBox(s.slice(2), layout.bounds) ||
      Math.abs(s[0] - s[2]) > EPS ||
      Math.min(s[1], s[3]) > layout.active[1] + EPS ||
      Math.max(s[1], s[3]) < layout.active[3] - EPS
    )
      issues.push('finger outside matched active region');
    if (!segmentCoveredByLinework(s, linework)) issues.push('matched gate missing from drawing');
    const terminal = group === 'A' ? s.slice(0, 2) : s.slice(2),
      bus = layout.buses?.[group === 'A' ? 0 : 1];
    if (!bus || !pointOnSegment(terminal, bus)) issues.push('finger disconnected from intended gate bus');
    totals[group].x += s[0];
    totals[group].count++;
  }
  if (
    !totals.A.count ||
    totals.A.count !== totals.B.count ||
    Math.abs(totals.A.x / totals.A.count - totals.B.x / totals.B.count) > EPS
  )
    issues.push('matched device centroids disagree');
  for (let i = 2; i < fs.length; i++)
    if (Math.abs(fs[i].segment[0] - fs[i - 1].segment[0] - (fs[1].segment[0] - fs[0].segment[0])) > EPS)
      issues.push('inconsistent matched finger pitch');
  if (layout.fets?.length !== fs.length) issues.push('missing matched transistor evidence');
  const terminals = [];
  for (const [i, fet] of (layout.fets ?? []).entries()) {
    const finger = fs[i];
    if (!finger) continue;
    const a = i % 4 === 0 || i % 4 === 3,
      drain = a ? 'DA' : 'DB',
      gateNet = a ? 'GA' : 'GB';
    if (
      fet.type !== 'n' ||
      fet.input !== (a ? 0 : 1) ||
      fet.control !== gateNet ||
      fet.left.layer !== 'm1' ||
      fet.right.layer !== 'm1' ||
      ![fet.left.net, fet.right.net].includes('S') ||
      ![fet.left.net, fet.right.net].includes(drain)
    )
      issues.push('matched transistor electrode mismatch');
    if (
      ![fet.left.point, fet.right.point, fet.gate].every((p) => finitePoint(p) && insideBox(p, layout.active)) ||
      !(fet.left.point[0] < fet.gate[0] - EPS && fet.gate[0] < fet.right.point[0] - EPS) ||
      Math.abs(fet.left.point[1] - fet.gate[1]) > EPS ||
      Math.abs(fet.right.point[1] - fet.gate[1]) > EPS ||
      !pointOnSegment(fet.gate, finger.segment)
    )
      issues.push('invalid matched channel placement');
    if (
      i &&
      (!samePoint(layout.fets[i - 1].right.point, fet.left.point) || layout.fets[i - 1].right.net !== fet.left.net)
    )
      issues.push('unbroken matched diffusion has conflicting electrodes');
    for (const t of [fet.left, fet.right])
      if (
        !layout.contacts?.some(
          (c) =>
            c.net === t.net &&
            c.layers.includes('m1') &&
            samePoint(c.point, t.point) &&
            Number.isFinite(c.size) &&
            boxWithin(contactBox(c), layout.active),
        )
      )
        issues.push(`${t.net}: missing diffusion-to-metal contact`);
    terminals.push(fet.left, fet.right, { net: gateNet, layer: 'poly', point: fet.gate });
  }
  let malformed = false;
  for (const w of layout.wires ?? []) {
    if (!NETS.includes(w.net) || !['poly', 'm1', 'm2'].includes(w.layer) || !orthogonalRoute(w.points)) {
      issues.push('malformed matched conductor');
      malformed = true;
      continue;
    }
    if (w.points.some((p) => !insideBox(p, outer))) issues.push(`${w.net}: conductor outside matched footprint`);
    if (!routeCoveredByLinework(w.points, linework)) issues.push(`${w.net}: matched conductor missing from linework`);
  }
  for (const c of layout.contacts ?? []) {
    if (
      !NETS.includes(c.net) ||
      !finitePoint(c.point) ||
      !Number.isFinite(c.size) ||
      c.size <= EPS ||
      !c.layers?.length ||
      c.layers.some((l) => !['poly', 'm1', 'm2'].includes(l))
    ) {
      issues.push('invalid matched contact footprint');
      malformed = true;
      continue;
    }
    if (c.size > margin + EPS || !boxWithin(contactBox(c), nearby))
      issues.push('matched contact outside footprint or electrode clearance');
    if (!rect(contactBox(c)).every((s) => segmentCoveredByLinework(s, linework)))
      issues.push(`${c.net}: matched contact missing from linework`);
  }
  for (const net of NETS) {
    if (!layout.pins?.some((p) => p.net === net)) issues.push(`${net}: missing matched pin`);
    const terminal = layout.terminals?.[net];
    if (!finitePoint(terminal)) {
      issues.push(`${net}: missing matched terminal`);
      malformed = true;
    } else {
      if (!onBoundary(terminal, layout.bounds)) issues.push(`${net}: matched terminal is not on body boundary`);
      terminals.push({ net, layer: 'm2', point: terminal });
    }
  }
  for (const pin of layout.pins ?? []) {
    if (!NETS.includes(pin.net) || !finitePoint(pin.point) || !['poly', 'm1', 'm2'].includes(pin.layer)) {
      issues.push('invalid matched pin');
      malformed = true;
      continue;
    }
    if (!onBoundary(pin.point, layout.bounds) && !onBoundary(pin.point, outer))
      issues.push(`${pin.net}: matched pin is not on body or macro boundary`);
    if (
      !layout.contacts?.some((c) => c.net === pin.net && c.layers.includes(pin.layer) && samePoint(c.point, pin.point))
    )
      issues.push(`${pin.net}: matched pin has no contact land`);
    terminals.push(pin);
  }
  if (!layout.wires?.length || !layout.contacts?.length) issues.push('missing matched electrical evidence');
  else if (!malformed) issues.push(...inspectConnectivity(layout, terminals));
  return [...new Set(issues)];
}

export async function analogKernel() {
  return loadKernel("export {fingers} from './src/figures/kit/chip-matched-fingers';");
}
export function generateMatchedCase(k, seed, count = 4 * (1 + (seed % 3))) {
  const raw = new k.Sketch(k.mulberry32(seed), [1.5, 0.7]);
  const width = raw.r(1.2, 2.8),
    height = raw.r(0.3, 1.2);
  const layout = k.fingers(raw, [-width / 2, -height / 2, width / 2, height / 2], count);
  return { raw, layout, count };
}
export async function runAnalogCheck(count = 128) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 10000) throw new Error('analog seed count must be 1–10000');
  const k = await analogKernel();
  let devices = 0,
    contacts = 0;
  const failures = [];
  for (let seed = 1; seed <= count; seed++) {
    const c = generateMatchedCase(k, seed),
      issues = inspectMatchedFingers(c.layout, c.raw, c.count);
    devices += c.layout.fets.length;
    contacts += c.layout.contacts.length;
    if (issues.length) failures.push({ seed, issues });
  }
  if (failures.length) {
    console.error(JSON.stringify(failures.slice(0, 8), null, 2));
    throw new Error(`analog check: ${failures.length} failures`);
  }
  console.log(
    `analog: ${count} matched arrays · ${devices} MOS devices · ${contacts} electrode contacts · ABBA/physical connectivity and emitted strokes checked`,
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { seeds: { type: 'string' } } });
  const value = values.seeds ?? '128';
  if (!/^\d+$/.test(value)) throw new Error('Analog seed count must be an unsigned integer');
  await runAnalogCheck(Number(value));
}
