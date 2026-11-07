#!/usr/bin/env node
/** Verify physical layout evidence with geometry independent of the router. */
import { pathToFileURL } from 'node:url';
import { loadKernel } from './load.mjs';
import { inspectGateLayout, inspectSupplyNetwork } from './chip-gate-check.mjs';
import { inspectMatchedFingers } from './chip-analog-check.mjs';
import { chipAncestor, inspectBondRegistration } from './chip-package-check.mjs';
import {
  EPS,
  finitePoint,
  boxOverlapInterior,
  insideBox,
  inspectLinework,
  orthogonalRoute,
  pointOnPolyline,
  polylineSegments,
  routeCoveredByLinework,
  samePoint,
  segmentHitsBoxInterior,
  segmentIntersection,
  selfIntersections,
  validBox,
} from './geometry.mjs';

const sameBox = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= EPS);
const within = (b, outer) => insideBox(b.slice(0, 2), outer) && insideBox(b.slice(2), outer);

/** Electrical equivalence comes from terminal topology and declared conductor groups,
 * never from a net's signal label. A duplicate label must not hide a physical short. */
function electricalGroups(model) {
  const parents = new Map(model.components.flatMap((c) => c.ports.map((p) => [p.id, p.id])));
  const root = (id) => {
    const p = parents.get(id);
    if (p === undefined) return id;
    if (p !== id) parents.set(id, root(p));
    return parents.get(id);
  };
  const join = (a, b) => {
    if (parents.has(a) && parents.has(b)) parents.set(root(a), root(b));
  };
  for (const c of model.components) {
    if (c.kind === 'pad' || c.kind === 'power-rail') for (const p of c.ports.slice(1)) join(c.ports[0].id, p.id);
    for (const pins of c.pinGroups ?? []) for (const id of pins.slice(1)) join(pins[0], id);
  }
  for (const net of model.nets) join(net.from, net.to);
  return root;
}

export function inspectChip(raw, model, win, finished) {
  const issues = [];
  if (model?.type !== 'chip' || !model.components?.length || !model.boundary) return ['chip: missing physical model'];
  if (model.era !== raw.era) issues.push('chip era disagrees with production context');
  if (raw.nextPlan && model.level !== 'package') issues.push('chip level disagrees with production package context');
  const chosen = model.components.filter((c) => c.selected);
  if (chosen.length !== 1 || !sameBox(chosen[0].box, win)) issues.push('selected component must equal aperture');
  if (!validBox(model.boundary) || !within(win, model.boundary)) issues.push('invalid die boundary');
  if (!Number.isInteger(model.unitCount) || model.unitCount < 4 || model.unitCount % 4)
    issues.push('incomplete matched ABBA group');
  const ports = new Map();
  for (const [index, c] of model.components.entries()) {
    if (!validBox(c.box) || !within(c.box, model.boundary)) issues.push(`${c.id}: component outside boundary`);
    if (c.parent) {
      const parent = model.components.find((p) => p.id === c.parent);
      if (!parent || !within(c.box, parent.box) || chipAncestor(model, c.parent, c.id))
        issues.push(`${c.id}: invalid component parent`);
    }
    for (const other of model.components.slice(index + 1))
      if (
        boxOverlapInterior(c.box, other.box) &&
        !chipAncestor(model, c.id, other.id) &&
        !chipAncestor(model, other.id, c.id)
      )
        issues.push(`${c.id}: overlaps ${other.id}`);
    for (const p of c.ports) {
      if (ports.has(p.id)) issues.push(`${p.id}: duplicate port`);
      ports.set(p.id, { ...p, component: c });
      const axis = p.side === 'n' || p.side === 's' ? 1 : 0;
      const edge = p.side === 'n' || p.side === 'w' ? c.box[axis] : c.box[axis + 2];
      if (!insideBox(p.point, c.box) || Math.abs(p.point[axis] - edge) > EPS)
        issues.push(`${p.id}: port is not on declared edge`);
    }
  }
  const group = electricalGroups(model),
    labels = new Map(),
    names = new Map();
  for (const net of model.nets) {
    const id = group(net.from);
    if (labels.has(net.signal) && labels.get(net.signal) !== id)
      issues.push('unrelated terminals share a signal label');
    if (names.has(id) && names.get(id) !== net.signal) issues.push('shared conductor has inconsistent signal labels');
    labels.set(net.signal, id);
    names.set(id, net.signal);
  }
  if (
    !model.nets.length &&
    model.level !== 'rack' &&
    !(model.level === 'cell' && model.components.some((c) => c.kind === 'standard-cell'))
  )
    issues.push('empty interconnect evidence');
  for (const net of model.nets) {
    const from = ports.get(net.from),
      to = ports.get(net.to);
    if (!from || !to) {
      issues.push(`${net.id}: missing terminal`);
      continue;
    }
    if (!samePoint(net.points[0], from.point) || !samePoint(net.points.at(-1), to.point))
      issues.push(`${net.id}: dangling endpoint`);
    if (net.layer === 'bond-wire') {
      if (net.points.length !== 2 || !net.points.every(finitePoint))
        issues.push(`${net.id}: bond wire must directly join two landing pads`);
      if (net.vias.length) issues.push(`${net.id}: false bond-wire via`);
    } else if (net.layer !== 'metal-hv') issues.push(`${net.id}: unknown conductor material`);
    else if (!orthogonalRoute(net.points)) issues.push(`${net.id}: metal route is not orthogonal`);
    if (selfIntersections(net.points).length) issues.push(`${net.id}: malformed or self-crossing route`);
    if (!routeCoveredByLinework(net.points, raw.segs.flat()))
      issues.push(`${net.id}: wire missing from emitted linework`);
    if (net.points.some((p) => !insideBox(p, model.boundary))) issues.push(`${net.id}: net outside boundary`);
    for (const c of model.components)
      if (
        !(net.layer === 'bond-wire' && chipAncestor(model, to.component.id, c.id)) &&
        polylineSegments(net.points).some((s) => segmentHitsBoxInterior(s, c.box))
      )
        issues.push(`${net.id}: wire traverses ${c.id}`);
    if (
      net.layer === 'metal-hv' &&
      (net.vias.length !== Math.max(0, net.points.length - 2) ||
        net.vias.some((p, i) => !samePoint(p, net.points[i + 1])))
    )
      issues.push(`${net.id}: missing layer-change via`);
    if (net.vias.some((p) => !raw.dots.some((q) => samePoint(p, q))))
      issues.push(`${net.id}: via missing from emitted contacts`);
  }
  for (let i = 0; i < model.nets.length; i++)
    for (const b of model.nets.slice(i + 1)) {
      const a = model.nets[i];
      if (a.layer === 'bond-wire' && b.layer === 'bond-wire') {
        for (const first of polylineSegments(a.points))
          for (const second of polylineSegments(b.points)) {
            const hit = segmentIntersection(first, second);
            if (hit.type === 'proper' || hit.type === 'overlap')
              issues.push(`${a.id}/${b.id}: crossing bond-wire fanout`);
          }
      }
      if (group(a.from) === group(b.from)) continue;
      for (const first of polylineSegments(a.points))
        for (const second of polylineSegments(b.points)) {
          const hit = segmentIntersection(first, second);
          if (hit.type === 'overlap') issues.push(`${a.id}/${b.id}: same-layer metal short`);
        }
      for (const p of [...a.vias, a.points[0], a.points.at(-1)])
        if (pointOnPolyline(p, b.points)) issues.push(`${a.id}/${b.id}: contact shorts another signal`);
      for (const p of [...b.vias, b.points[0], b.points.at(-1)])
        if (pointOnPolyline(p, a.points)) issues.push(`${a.id}/${b.id}: contact shorts another signal`);
    }
  if (model.level === 'board')
    for (const kind of ['dimm', 'vrm', 'pcie', 'io'])
      if (!model.components.some((c) => c.kind === kind)) issues.push(`board missing ${kind}`);
  if (raw.nextPlan || (model.level === 'package' && raw.era !== 'modern')) {
    issues.push(...inspectBondRegistration(raw, model, finished));
  }
  const digital =
    (model.level === 'cell' && model.components.some((c) => c.kind === 'standard-cell')) ||
    model.components.some((c) => c.kind === 'datapath');
  if (digital && !model.gates?.length) issues.push('missing physical CMOS gate evidence');
  for (const g of model.gates ?? []) issues.push(...inspectGateLayout(g, raw));
  if (model.level === 'cell' && digital) issues.push(...inspectSupplyNetwork(model, raw));
  if (model.components.some((c) => c.kind === 'mos-pair' && !c.selected) && !model.matches?.length)
    issues.push('missing matched analog geometry');
  for (const array of model.matches ?? []) issues.push(...inspectMatchedFingers(array, raw, model.unitCount));
  if (model.era === 'testchip' && model.level === 'cell') {
    if (!model.matches?.length || model.components.some((c) => c.kind === 'standard-cell') || model.gates?.length)
      issues.push('analog terminal expanded into digital logic');
  }
  if (model.era === 'nmos' && (model.level === 'cell' || model.level === 'core')) {
    if (
      !model.gates?.length ||
      model.gates.some((g) => g.gate.kind !== 'nmos-load' || g.fets.some((f) => f.type === 'p'))
    )
      issues.push('NMOS scene contains complementary CMOS gate');
  }
  for (const c of model.components.filter((c) => c.kind === 'decap')) {
    const power = model.nets.find((n) => n.from === `${c.id}:n2` || n.to === `${c.id}:n2`);
    const ground = model.nets.find((n) => n.from === `${c.id}:s2` || n.to === `${c.id}:s2`);
    if (!power || !ground) issues.push(`${c.id}: decoupling terminal floats`);
    else if (group(power.from) === group(ground.from)) issues.push(`${c.id}: capacitor power-return short`);
  }
  if (model.level === 'die' && model.components.some((c) => c.kind === 'core')) {
    const cores = model.components.filter((c) => c.kind === 'core');
    if (
      cores.length !== 6 ||
      cores.some((c) => Math.abs(c.box[2] - c.box[0] - 1) > EPS || Math.abs(c.box[3] - c.box[1] - 0.5) > EPS)
    )
      issues.push('inconsistent repeated core tiles');
  }
  return [...new Set(issues)];
}

export async function chipKernel() {
  return loadKernel(
    "export {rack,board} from './src/figures/kit/silicon';export {pkg,die,core,cell} from './src/figures/kit/dies';",
  );
}
export function generateChipCase(k, seed, kind, era = 'modern') {
  const index = ['rack', 'board', 'pkg', 'die', 'core', 'cell'].indexOf(kind);
  if (index < 0) throw new Error(`unknown chip level: ${kind}`);
  const raw = k.makeDiveSketch('silicon', index, seed, era);
  return { raw, model: raw.model, win: [...raw.win], finished: k.finish(raw) };
}

export async function runChipCheck(count = 96) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 10000) throw new Error('chip seed count must be 1–10000');
  const k = await chipKernel();
  let layouts = 0,
    components = 0,
    nets = 0,
    segments = 0;
  const failures = [];
  for (const era of k.DIVE_ERAS)
    for (let seed = 1; seed <= count; seed++)
      for (const kind of ['rack', 'board', 'pkg', 'die', 'core', 'cell']) {
        let c;
        try {
          c = generateChipCase(k, seed, kind, era);
        } catch (error) {
          failures.push({ era, seed, kind, issues: [error.message] });
          continue;
        }
        const issues = [
          ...inspectChip(c.raw, c.model, c.win, c.finished),
          ...inspectLinework(c.raw, k.BOUND),
          ...inspectLinework(c.finished, k.BOUND, c.win),
          ...(c.finished.interfaces ? inspectLinework(c.finished.interfaces, c.win) : []),
        ];
        if (issues.length) failures.push({ era, seed, kind, issues: issues.slice(0, 8) });
        layouts++;
        components += c.model.components.length;
        nets += c.model.nets.length;
        segments +=
          c.finished.segs.flat().length +
          (c.finished.detail?.segs.flat().length ?? 0) +
          (c.finished.interfaces?.segs.flat().length ?? 0);
      }
  if (failures.length) {
    console.error(JSON.stringify(failures.slice(0, 8), null, 2));
    throw new Error(`chip check: ${failures.length} failing cases`);
  }
  console.log(
    `chips: ${layouts} layouts · ${components} physical components · ${nets} routed nets · ${segments} emitted segments checked`,
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await runChipCheck(Number(process.argv.find((a) => a.startsWith('--seeds='))?.slice(8) ?? 96));
