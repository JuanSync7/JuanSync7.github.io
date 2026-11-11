/** Independent checks of chip surface geometry. No layout-generator code is imported. */
import {
  EPS,
  finitePoint,
  insideBox,
  validBox,
  samePoint,
  polylineSegments,
  boxOverlapInterior,
  segmentCoveredByLinework,
  segmentHitsBoxInterior,
  selfIntersections,
  segmentIntersection,
} from './geometry.mjs';

const boxEdges = ([a, b, c, d]) => [
  [a, b, c, b],
  [c, b, c, d],
  [c, d, a, d],
  [a, d, a, b],
];
const within = (a, b) => validBox(a) && validBox(b) && insideBox(a.slice(0, 2), b) && insideBox(a.slice(2), b);
const sameBox = (a, b) => validBox(a) && validBox(b) && a.every((n, i) => Math.abs(n - b[i]) <= EPS);
const inflate = (b, r) => [b[0] - r, b[1] - r, b[2] + r, b[3] + r];
const finiteSegment = (s) => Array.isArray(s) && s.length === 4 && s.every(Number.isFinite);
const lines = (drawing) => (drawing?.segs ?? []).flat().filter(finiteSegment);
const distinctCoordinates = (values) => {
  const out = [];
  for (const value of [...values].sort((a, b) => a - b))
    if (!out.length || Math.abs(value - out.at(-1)) > EPS) out.push(value);
  return out;
};
const pointSegmentDistance = (p, s) => {
  const dx = s[2] - s[0],
    dy = s[3] - s[1],
    squared = dx * dx + dy * dy;
  const t = squared ? Math.max(0, Math.min(1, ((p[0] - s[0]) * dx + (p[1] - s[1]) * dy) / squared)) : 0;
  return Math.hypot(p[0] - s[0] - t * dx, p[1] - s[1] - t * dy);
};
const segmentDistance = (a, b) =>
  segmentIntersection(a, b).type !== 'none'
    ? 0
    : Math.min(
        pointSegmentDistance(a.slice(0, 2), b),
        pointSegmentDistance(a.slice(2), b),
        pointSegmentDistance(b.slice(0, 2), a),
        pointSegmentDistance(b.slice(2), a),
      );

/** Small spatial index keeps full-interval verification practical for dense bump fields. */
function lineIndex(segments) {
  const size = 0.05,
    bins = new Map();
  const cells = (b) => {
    const out = [];
    for (let x = Math.floor((b[0] - EPS) / size); x <= Math.floor((b[2] + EPS) / size); x++)
      for (let y = Math.floor((b[1] - EPS) / size); y <= Math.floor((b[3] + EPS) / size); y++) out.push(`${x}:${y}`);
    return out;
  };
  const bounds = ([a, b, c, d]) => [Math.min(a, c), Math.min(b, d), Math.max(a, c), Math.max(b, d)];
  for (const [i, s] of segments.entries())
    for (const key of cells(bounds(s))) {
      if (!bins.has(key)) bins.set(key, []);
      bins.get(key).push(i);
    }
  const near = (b) => [...new Set(cells(b).flatMap((key) => bins.get(key) ?? []))].map((i) => segments[i]);
  return { near, covered: (s) => segmentCoveredByLinework(s, near(bounds(s))) };
}

/** Remove only the selected aperture from an intended stroke, using interval clipping. */
function outsidePieces(segment, aperture) {
  if (!validBox(aperture)) return [segment];
  const a = segment.slice(0, 2),
    d = [segment[2] - a[0], segment[3] - a[1]];
  let enter = 0,
    exit = 1;
  for (let axis = 0; axis < 2; axis++) {
    if (Math.abs(d[axis]) <= EPS) {
      if (a[axis] <= aperture[axis] + EPS || a[axis] >= aperture[axis + 2] - EPS) return [segment];
    } else {
      const lo = (aperture[axis] - a[axis]) / d[axis],
        hi = (aperture[axis + 2] - a[axis]) / d[axis];
      enter = Math.max(enter, Math.min(lo, hi));
      exit = Math.min(exit, Math.max(lo, hi));
    }
  }
  if (exit <= enter + EPS) return [segment];
  const point = (t) => [a[0] + d[0] * t, a[1] + d[1] * t];
  return [
    [0, enter],
    [exit, 1],
  ]
    .filter(([lo, hi]) => hi - lo > EPS)
    .map(([lo, hi]) => [...point(lo), ...point(hi)]);
}

/** Verify all chords of a complete circle. The public circle/arc primitives use
 * 10/24 chords; PCB annuli use 12. Derive mathematical targets, rather than treating
 * coincident pad corners as extra circle vertices. Split collinear strokes are valid. */
function circleSegments(center, radius, index) {
  if (!finitePoint(center) || !Number.isFinite(radius) || radius <= EPS) return [];
  for (const count of [10, 12, 24]) {
    const points = Array.from({ length: count }, (_, i) => [
      center[0] + radius * Math.cos((i * 2 * Math.PI) / count),
      center[1] + radius * Math.sin((i * 2 * Math.PI) / count),
    ]);
    const edges = polylineSegments(points, true);
    if (edges.every((s) => index.covered(s))) return edges;
  }
  return [];
}

function auditContext(raw, model, finished) {
  const issues = [],
    index = lineIndex(lines(raw));
  const retained =
    finished && lineIndex([...lines(finished), ...lines(finished.detail), ...lines(finished.interfaces)]);
  const aperture =
    raw.win ?? (finitePoint(raw.w) ? [raw.w[0] - 0.5, raw.w[1] - 0.25, raw.w[0] + 0.5, raw.w[1] + 0.25] : null);
  const complain = (id, text) => issues.push(`surface ${id}: ${text}`);
  const emitted = (segments, id) => {
    if (!segments.length || segments.some((s) => !index.covered(s))) complain(id, 'missing emitted geometry');
    if (retained && segments.some((s) => outsidePieces(s, aperture).some((part) => !retained.covered(part))))
      complain(id, 'missing finished geometry');
  };
  const rectangle = (box, id) => {
    if (!validBox(box)) {
      complain(id, 'invalid box');
      return;
    }
    emitted(boxEdges(box), id);
  };
  const circle = (point, radius, id) => {
    const ring = circleSegments(point, radius, index);
    if (!ring.length) complain(id, 'missing complete circle');
    else emitted(ring, id);
  };
  const owners = new Map((model.components ?? []).map((c) => [c.id, c]));
  return { issues, index, emitted, rectangle, circle, complain, owners, raw, model };
}

function inspectBoard(layout, ctx) {
  const { complain, rectangle, circle, owners, emitted, model } = ctx;
  if (!layout || !Array.isArray(layout.footprints) || !layout.footprints.length) {
    complain('board', 'missing physical board layout');
    return;
  }
  if (
    !['workstation', 'embedded', 'instrument'].includes(layout.variant) ||
    !Number.isSafeInteger(layout.phaseCount) ||
    layout.phaseCount < 1 ||
    layout.phaseCount > 16 ||
    ['power-stage', 'inductor'].some(
      (kind) => layout.footprints.filter((f) => f.kind === kind).length !== layout.phaseCount,
    )
  )
    complain('board', 'phase count differs from physical stage/inductor pairs');
  const terminals = new Map(),
    pieces = new Map(),
    ids = new Set();
  const unique = (id) => {
    if (typeof id !== 'string' || !id || ids.has(id)) complain(id, 'duplicate or missing identity');
    ids.add(id);
  };
  for (const c of owners.values())
    for (const port of c.ports ?? []) terminals.set(port.id, { point: port.point, owner: c.id });
  const globalPorts = new Set(terminals.keys()),
    usedPorts = new Set((model.nets ?? []).flatMap((n) => [n.from, n.to]));
  if (!Array.isArray(model.routePorts)) complain('board', 'missing predeclared routing terminals');
  else {
    if (new Set(model.routePorts).size !== model.routePorts.length)
      complain('board', 'duplicate predeclared routing terminal');
    if (model.routePorts.some((id) => !globalPorts.has(id))) complain('board', 'ghost predeclared routing terminal');
    if ([...usedPorts].some((id) => !model.routePorts.includes(id)))
      complain('board', 'used routing terminal was not predeclared');
    if (model.routePorts.some((id) => !usedPorts.has(id)))
      complain('board', 'predeclared routing terminals differ from actual net endpoints');
  }
  for (const f of layout.footprints) {
    unique(f.id);
    pieces.set(f.id, f);
    const owner = owners.get(f.owner);
    if (!owner || !within(f.box, owner.box) || !within(f.body, f.box)) complain(f.id, 'footprint outside real owner');
    rectangle(f.box, `${f.id} footprint`);
    rectangle(f.body, `${f.id} body`);
    if (
      f.pinOne &&
      (!finitePoint(f.pinOne) || !insideBox(f.pinOne, f.body) || !ctx.raw.dots?.some((p) => samePoint(p, f.pinOne)))
    )
      complain(f.id, 'missing emitted pin-one marker');
    if (!Array.isArray(f.pads) || f.pads.length < 2) {
      complain(f.id, 'missing physical pads');
      continue;
    }
    for (const pad of f.pads) {
      unique(pad.id);
      pieces.set(pad.id, { ...pad, owner: f.owner });
      if (!within(pad.box, f.box) || !finitePoint(pad.point) || !insideBox(pad.point, pad.box))
        complain(pad.id, 'pad outside footprint');
      rectangle(pad.box, pad.id);
      const port = pad.port && terminals.get(pad.port);
      if (pad.port && (!port || port.owner !== f.owner || !samePoint(port.point, pad.point)))
        complain(pad.id, 'pad misses actual component port');
      terminals.set(pad.id, { point: pad.point, owner: f.owner });
    }
  }
  const parents = new Map([...terminals.keys()].map((id) => [id, id]));
  const root = (id) => {
    if (!parents.has(id)) return id;
    const p = parents.get(id);
    if (p !== id) parents.set(id, root(p));
    return parents.get(id);
  };
  const join = (a, b) => {
    if (parents.has(a) && parents.has(b)) parents.set(root(a), root(b));
  };
  for (const c of owners.values()) {
    if (c.kind === 'pad' || c.kind === 'power-rail') for (const p of c.ports.slice(1)) join(c.ports[0].id, p.id);
    for (const group of c.pinGroups ?? []) for (const p of group.slice(1)) join(group[0], p);
  }
  for (const f of layout.footprints) for (const p of f.pads ?? []) if (p.port) join(p.id, p.port);
  for (const n of model.nets ?? []) join(n.from, n.to);
  for (const t of layout.traces ?? []) join(t.from, t.to);
  for (const t of layout.traces ?? []) {
    unique(t.id);
    const from = terminals.get(t.from),
      to = terminals.get(t.to),
      owner = owners.get(t.owner);
    if (!from || !to || !Array.isArray(t.points) || t.points.length < 2 || !t.points.every(finitePoint)) {
      complain(t.id, 'missing trace terminal or route');
      continue;
    }
    if (!samePoint(t.points[0], from.point) || !samePoint(t.points.at(-1), to.point))
      complain(t.id, 'dangling trace endpoint');
    if (!owner || t.points.some((p) => !insideBox(p, owner.box))) complain(t.id, 'trace outside real owner');
    if (!['top', 'bottom'].includes(t.layer) || selfIntersections(t.points).length)
      complain(t.id, 'invalid trace layer or continuity');
    if (!(Number.isFinite(t.width) && t.width > 0 && Number.isFinite(t.clearance) && t.clearance > 0))
      complain(t.id, 'invalid finite trace width/clearance');
    if (
      t.layer === 'bottom' &&
      [t.points[0], t.points.at(-1)].some((p) => !(t.vias ?? []).some((v) => finitePoint(v) && samePoint(v, p)))
    )
      complain(t.id, 'bottom trace lacks via at top-pad attachment');
    if (
      (t.vias ?? []).some(
        (p) => !finitePoint(p) || !polylineSegments(t.points).some((s) => pointSegmentDistance(p, s) <= EPS),
      )
    )
      complain(t.id, 'via misses local trace');
    const segments = polylineSegments(t.points);
    if (segments.some(([a, b, c, d]) => Math.hypot(c - a, d - b) <= EPS)) complain(t.id, 'degenerate trace');
    emitted(segments, t.id);
    for (const f of layout.footprints)
      if (segments.some((s) => segmentHitsBoxInterior(s, f.body)))
        complain(t.id, `trace crosses component body ${f.id}`);
  }
  const traces = (layout.traces ?? []).filter((t) => t.points?.every(finitePoint) && t.points.length >= 2);
  const conductors = [...(model.nets ?? []), ...traces];
  for (let i = 0; i < traces.length; i++)
    for (const b of traces.slice(i + 1)) {
      const a = traces[i];
      if (a.layer !== b.layer || root(a.from) === root(b.from)) continue;
      if (
        polylineSegments(a.points).some((s) =>
          polylineSegments(b.points).some((v) => segmentIntersection(s, v).type !== 'none'),
        )
      )
        complain(`${a.id}/${b.id}`, 'unrelated same-layer traces intersect');
      else if (
        polylineSegments(a.points).some((s) =>
          polylineSegments(b.points).some(
            (v) => segmentDistance(s, v) < (a.width + b.width) / 2 + Math.max(a.clearance, b.clearance) - EPS,
          ),
        )
      )
        complain(`${a.id}/${b.id}`, 'unrelated same-layer trace clearance');
    }
  for (const c of layout.circles ?? []) {
    unique(c.id);
    if (!(c.innerRadius > EPS && c.outerRadius > c.innerRadius + EPS)) {
      complain(c.id, 'invalid annular contact');
      continue;
    }
    circle(c.center, c.innerRadius, `${c.id} inner`);
    circle(c.center, c.outerRadius, `${c.id} outer`);
    if (!finitePoint(c.center)) continue;
    const footprint = [
      c.center[0] - c.outerRadius,
      c.center[1] - c.outerRadius,
      c.center[0] + c.outerRadius,
      c.center[1] + c.outerRadius,
    ];
    if (c.kind === 'via') {
      const net = conductors.find((n) => n.id === c.owner);
      if (!net || !(net.vias ?? []).some((p) => samePoint(p, c.center)))
        complain(c.id, 'via misses actual routed contact');
      if (!within(footprint, model.boundary)) complain(c.id, 'contact outside board');
      if (net) {
        for (const other of model.nets ?? [])
          if (
            root(net.from) !== root(other.from) &&
            polylineSegments(other.points).some((s) => pointSegmentDistance(c.center, s) < c.outerRadius - EPS)
          )
            complain(c.id, `via contact overlaps unrelated net ${other.id}`);
        for (const trace of traces)
          if (
            root(net.from) !== root(trace.from) &&
            polylineSegments(trace.points).some(
              (s) => pointSegmentDistance(c.center, s) < c.outerRadius + trace.width / 2 - EPS,
            )
          )
            complain(c.id, `via contact overlaps unrelated trace ${trace.id}`);
      }
    } else {
      const owner = owners.get(c.owner);
      if (!owner || !within(footprint, owner.box)) complain(c.id, 'circle outside real owner');
      if (c.kind === 'mount')
        for (const route of [...(model.nets ?? []), ...traces])
          if (polylineSegments(route.points).some((s) => pointSegmentDistance(c.center, s) < c.outerRadius - EPS))
            complain(c.id, `route enters mounting annulus ${route.id}`);
    }
  }
  const vias = (layout.circles ?? []).filter((c) => c.kind === 'via' && finitePoint(c.center));
  for (let i = 0; i < vias.length; i++)
    for (const b of vias.slice(i + 1)) {
      const a = vias[i],
        an = conductors.find((n) => n.id === a.owner),
        bn = conductors.find((n) => n.id === b.owner);
      if (
        an &&
        bn &&
        root(an.from) !== root(bn.from) &&
        Math.hypot(a.center[0] - b.center[0], a.center[1] - b.center[1]) < a.outerRadius + b.outerRadius - EPS
      )
        complain(`${a.id}/${b.id}`, 'unrelated via contact footprints overlap');
    }
  for (const n of conductors)
    for (const p of n.vias ?? [])
      if (!(layout.circles ?? []).some((c) => c.kind === 'via' && c.owner === n.id && samePoint(c.center, p)))
        complain(n.id, 'missing annular via contact');
  for (const r of layout.repeats ?? []) {
    unique(r.id);
    const members = r.members?.map((id) => pieces.get(id)) ?? [],
      axis = r.axis === 'x' ? 0 : 1;
    if (
      !owners.has(r.owner) ||
      members.length < 2 ||
      members.some((p) => !p || p.owner !== r.owner) ||
      new Set(r.members).size !== members.length ||
      !(r.pitch > EPS) ||
      !['x', 'y'].includes(r.axis)
    ) {
      complain(r.id, 'invalid repeated members');
      continue;
    }
    const centers = members.map((p) => [(p.box[0] + p.box[2]) / 2, (p.box[1] + p.box[3]) / 2]);
    const size = [members[0].box[2] - members[0].box[0], members[0].box[3] - members[0].box[1]];
    if (
      members.some(
        (p) => Math.abs(p.box[2] - p.box[0] - size[0]) > EPS || Math.abs(p.box[3] - p.box[1] - size[1]) > EPS,
      )
    )
      complain(r.id, 'inconsistent repeated footprint dimensions');
    if (size[axis] >= r.pitch - EPS) complain(r.id, 'repeated footprints lack physical clearance');
    const uniqueCoordinates = (values) =>
      values.sort((a, b) => a - b).filter((n, i, all) => !i || Math.abs(n - all[i - 1]) > EPS);
    const coords = uniqueCoordinates(centers.map((p) => p[axis]));
    if (coords.some((n, i) => i && Math.abs(n - coords[i - 1] - r.pitch) > EPS))
      complain(r.id, 'irregular repeated pitch');
    if (r.kind === 'bga-grid') {
      const xs = uniqueCoordinates(centers.map((p) => p[0])),
        ys = uniqueCoordinates(centers.map((p) => p[1]));
      if (
        r.rows !== ys.length ||
        r.columns !== xs.length ||
        members.length !== r.rows * r.columns ||
        new Set(
          centers.map(
            (p) =>
              `${xs.findIndex((x) => Math.abs(x - p[0]) <= EPS)}:${ys.findIndex((y) => Math.abs(y - p[1]) <= EPS)}`,
          ),
        ).size !== members.length
      )
        complain(r.id, 'incomplete repeated grid');
      if ([xs, ys].some((values) => values.some((n, i) => i && Math.abs(n - values[i - 1] - r.pitch) > EPS)))
        complain(r.id, 'irregular repeated grid pitch');
    } else if (r.kind === 'pin-row' && centers.some((p) => Math.abs(p[1 - axis] - centers[0][1 - axis]) > EPS))
      complain(r.id, 'misaligned pin row');
  }
  for (const f of layout.footprints) {
    if (['qfp', 'bga', 'connector'].includes(f.kind))
      for (const p of f.pads.filter((p) => !p.port)) {
        if (!(layout.repeats ?? []).some((r) => ['pin-row', 'bga-grid'].includes(r.kind) && r.members.includes(p.id)))
          complain(p.id, 'missing regular pad-array evidence');
      }
    if (
      layout.phaseCount > 1 &&
      ['power-stage', 'inductor'].includes(f.kind) &&
      !(layout.repeats ?? []).some((r) => r.kind === 'phase-bank' && r.members.includes(f.id))
    )
      complain(f.id, 'missing regular phase-bank evidence');
  }
}

function inspectField(field, ctx) {
  const { complain, owners, circle, rectangle } = ctx,
    owner = owners.get(field.owner);
  if (!owner || !within(field.box, owner.box)) complain(field.id, 'contact cutaway outside real owner');
  rectangle(field.box, `${field.id} cutaway`);
  if (
    !['microbump', 'tsv', 'c4'].includes(field.kind) ||
    !finitePoint(field.origin) ||
    !finitePoint(field.pitch) ||
    field.pitch.some((p) => p <= 0) ||
    !(field.radius > EPS) ||
    field.pitch.some((p) => p <= 2 * field.radius + EPS) ||
    !Number.isSafeInteger(field.rows) ||
    !Number.isSafeInteger(field.cols) ||
    field.rows < 1 ||
    field.cols < 1 ||
    field.rows * field.cols < 2 ||
    field.rows * field.cols > 2000
  ) {
    complain(field.id, 'invalid regular contact field');
    return;
  }
  const seen = new Set();
  if (!Array.isArray(field.sites) || field.sites.length !== field.rows * field.cols)
    complain(field.id, 'incomplete regular contact field');
  for (const site of field.sites ?? []) {
    const key = `${site.row}:${site.col}`;
    if (
      !Number.isInteger(site.row) ||
      !Number.isInteger(site.col) ||
      site.row < 0 ||
      site.row >= field.rows ||
      site.col < 0 ||
      site.col >= field.cols ||
      seen.has(key)
    )
      complain(field.id, 'duplicate or invalid contact index');
    seen.add(key);
    const expected = [field.origin[0] + site.col * field.pitch[0], field.origin[1] + site.row * field.pitch[1]];
    if (!finitePoint(site.point) || !samePoint(site.point, expected)) {
      complain(field.id, 'irregular contact pitch');
      continue;
    }
    if (
      !within(
        [
          site.point[0] - field.radius,
          site.point[1] - field.radius,
          site.point[0] + field.radius,
          site.point[1] + field.radius,
        ],
        field.box,
      )
    )
      complain(field.id, 'contact overhangs declared cutaway');
    circle(site.point, field.radius, `${field.id}[${key}]`);
  }
}

function inspectPackaging(layout, ctx) {
  const { complain, owners, rectangle, emitted, model } = ctx;
  if (!layout || !Array.isArray(layout.layers) || !Array.isArray(layout.bumpFields)) {
    complain('package', 'missing physical packaging layout');
    return;
  }
  const substrate = layout.layers.filter((l) => l.kind === 'substrate'),
    interposer = layout.layers.filter((l) => l.kind === 'interposer');
  if (
    substrate.length !== 1 ||
    interposer.length !== 1 ||
    !within(interposer[0]?.bounds, substrate[0]?.bounds) ||
    !within(substrate[0]?.bounds, model.boundary)
  )
    complain('package', 'invalid substrate/interposer containment');
  const layerIds = new Set();
  for (const layer of layout.layers) {
    if (layerIds.has(layer.id)) complain(layer.id, 'duplicate layer');
    layerIds.add(layer.id);
    rectangle(layer.bounds, layer.id);
    if (layer.kind === 'underfill') {
      const owner = owners.get(layer.owner);
      if (
        !owner ||
        !within(owner.box, layer.bounds) ||
        !within(layer.bounds, interposer[0]?.bounds) ||
        sameBox(owner.box, layer.bounds)
      )
        complain(layer.id, 'underfill detached from die or interposer');
      else {
        const margins = [
          owner.box[0] - layer.bounds[0],
          owner.box[1] - layer.bounds[1],
          layer.bounds[2] - owner.box[2],
          layer.bounds[3] - owner.box[3],
        ];
        const maximum = Math.min(owner.box[2] - owner.box[0], owner.box[3] - owner.box[1]) * 0.15;
        if (margins.some((m) => m <= EPS || m > maximum + EPS || Math.abs(m - margins[0]) > EPS))
          complain(layer.id, 'underfill is not a thin attached uniform fillet');
      }
    } else if (!['substrate', 'interposer'].includes(layer.kind)) complain(layer.id, 'unknown package layer');
  }
  const dies = [...owners.values()].filter((c) => c.kind === 'die'),
    io = [...owners.values()].filter((c) => c.kind === 'phy');
  const selected = dies.find((c) => c.selected);
  if (
    !selected ||
    (layout.variant === 'single-logic'
      ? dies.length !== 1 || io.length !== 0
      : layout.variant === 'paired-logic'
        ? dies.length !== 2 || io.length !== 0
        : layout.variant === 'chiplet-io'
          ? dies.length !== 1 ||
            io.length !== 2 ||
            !io.some((c) => c.box[3] <= selected.box[1] + EPS) ||
            !io.some((c) => c.box[1] >= selected.box[3] - EPS)
          : true)
  )
    complain('package', 'variant disagrees with physical die/chiplet arrangement');
  for (const c of owners.values())
    if (c.kind === 'die' || c.kind === 'hbm') {
      if (layout.layers.filter((l) => l.kind === 'underfill' && l.owner === c.id).length !== 1)
        complain(c.id, 'missing unique attached underfill');
    }
  const fields = new Map();
  for (const field of layout.bumpFields) {
    if (fields.has(field.id)) complain(field.id, 'duplicate field identity');
    fields.set(field.id, field);
    inspectField(field, ctx);
    if (!within(field.box, interposer[0]?.bounds)) complain(field.id, 'contact field outside interposer');
  }
  if (!layout.bumpFields.some((f) => f.kind === 'microbump') || !layout.bumpFields.some((f) => f.kind === 'c4'))
    complain('package', 'missing bump pitch hierarchy');
  const micro = layout.bumpFields.filter((f) => f.kind === 'microbump'),
    coarse = layout.bumpFields.filter((f) => f.kind === 'c4');
  if (micro.some((m) => coarse.some((c) => m.pitch?.some((v, i) => v >= c.pitch?.[i] - EPS))))
    complain('package', 'fine bump pitch is not finer than substrate joints');
  const stackOwners = new Set();
  for (const stack of layout.stacks ?? []) {
    const owner = owners.get(stack.owner),
      tsv = fields.get(stack.tsvField);
    if (
      !owner ||
      owner.kind !== 'hbm' ||
      stackOwners.has(stack.owner) ||
      !sameBox(stack.base, owner.box) ||
      !within(stack.top, owner.box) ||
      !within(stack.section, owner.box) ||
      boxOverlapInterior(stack.top, stack.section) ||
      !Number.isSafeInteger(stack.dieCount) ||
      stack.dieCount < 4 ||
      stack.dieCount > 16
    )
      complain(stack.owner, 'invalid physical HBM stack');
    stackOwners.add(stack.owner);
    rectangle(stack.base, `${stack.owner} base`);
    rectangle(stack.top, `${stack.owner} top`);
    rectangle(stack.section, `${stack.owner} section`);
    if (validBox(stack.section) && Number.isInteger(stack.dieCount) && stack.dieCount > 0 && stack.dieCount <= 16) {
      const [x0, y0, x1, y1] = stack.section;
      emitted(
        Array.from({ length: stack.dieCount - 1 }, (_, i) => {
          const y = y0 + ((i + 1) * (y1 - y0)) / stack.dieCount;
          return [x0, y, x1, y];
        }),
        `${stack.owner} stack layers`,
      );
    }
    if (!tsv || tsv.owner !== stack.owner || tsv.kind !== 'tsv' || !within(tsv.box, stack.base))
      complain(stack.owner, 'TSV field misses HBM base');
    for (const f of fields.values())
      if (f.owner === stack.owner && (boxOverlapInterior(f.box, stack.top) || boxOverlapInterior(f.box, stack.section)))
        complain(f.id, 'exposed contact field overlaps opaque HBM stack');
  }
  for (const owner of owners.values())
    if (owner.kind === 'hbm' && !stackOwners.has(owner.id)) complain(owner.id, 'HBM has no physical stack');
  const ports = new Map(model.components.flatMap((c) => c.ports.map((p) => [p.id, { ...p, owner: c.id }])));
  const links = [];
  for (const link of layout.fineLinks ?? []) {
    const from = ports.get(link.fromPort),
      field = fields.get(link.toField),
      owner = owners.get(link.owner);
    const site = field?.sites.find((p) => p.row === link.toSite?.row && p.col === link.toSite?.col);
    if (
      !from ||
      !site ||
      !owner ||
      from.owner !== link.owner ||
      field.owner !== link.owner ||
      !Array.isArray(link.points) ||
      link.points.length < 2 ||
      !link.points.every(finitePoint)
    ) {
      complain(link.id, 'missing physical field contact');
      continue;
    }
    if (!samePoint(link.points[0], from.point) || !samePoint(link.points.at(-1), site.point))
      complain(link.id, 'dangling HBM fine link');
    if (link.points.some((p) => !insideBox(p, owner.box)) || selfIntersections(link.points).length)
      complain(link.id, 'invalid HBM fine-link route');
    for (const otherField of fields.values())
      for (const otherSite of otherField.sites ?? []) {
        if (otherField.id === field.id && otherSite.row === site.row && otherSite.col === site.col) continue;
        if (
          finitePoint(otherSite.point) &&
          polylineSegments(link.points).some((s) => pointSegmentDistance(otherSite.point, s) < otherField.radius - EPS)
        )
          complain(link.id, `fine link intersects another contact ${otherField.id}[${otherSite.row}:${otherSite.col}]`);
      }
    emitted(polylineSegments(link.points), link.id);
    links.push(link);
  }
  for (let i = 0; i < links.length; i++)
    for (const b of links.slice(i + 1)) {
      const a = links[i];
      if (
        polylineSegments(a.points).some((s) =>
          polylineSegments(b.points).some((v) => segmentIntersection(s, v).type !== 'none'),
        )
      )
        complain(`${a.id}/${b.id}`, 'crossing HBM base links');
    }
  for (const n of model.nets ?? [])
    for (const id of [n.from, n.to]) {
      const port = ports.get(id);
      if (owners.get(port?.owner)?.kind === 'hbm' && !links.some((l) => l.fromPort === id))
        complain(id, 'HBM boundary contact misses TSV base field');
    }
}

function inspectDie(layout, ctx) {
  const { complain, owners, rectangle, raw } = ctx;
  if (!layout || !Array.isArray(layout.coreIds) || !Array.isArray(layout.groups)) {
    complain('die', 'missing physical die layout');
    return;
  }
  const cores = [...owners.values()].filter((c) => c.kind === 'core');
  const declared = new Set(layout.coreIds),
    actual = new Set(cores.map((c) => c.id));
  if (
    ![4, 6].includes(cores.length) ||
    declared.size !== layout.coreIds.length ||
    declared.size !== actual.size ||
    [...actual].some((id) => !declared.has(id))
  )
    complain('die', 'core count differs from physical layout');
  const selected = owners.get(layout.selectedId);
  if (!selected?.selected || selected.kind !== 'core' || cores.filter((c) => c.selected).length !== 1)
    complain('die', 'selected core identity mismatch');
  const center = (c) => [(c.box[0] + c.box[2]) / 2, (c.box[1] + c.box[3]) / 2];
  const unique = (xs) => xs.sort((a, b) => a - b).filter((x, i, a) => !i || Math.abs(x - a[i - 1]) > EPS);
  const xs = unique(cores.map((c) => center(c)[0])),
    ys = unique(cores.map((c) => center(c)[1]));
  if (xs.length * ys.length !== cores.length) complain('die', 'incomplete physical core lattice');
  const grouped = [],
    patterns = [];
  for (const [index, group] of layout.groups.entries()) {
    const id = `die group ${index}`,
      members = group.ids?.map((key) => owners.get(key)) ?? [];
    grouped.push(...(group.ids ?? []));
    if (
      members.length < 2 ||
      members.some((c) => !c || c.kind !== 'core') ||
      !finitePoint(group.tile) ||
      group.tile.some((v) => v <= EPS) ||
      !finitePoint(group.pitch) ||
      group.pitch.some((v) => v < 0) ||
      group.pitch.every((v) => v <= EPS) ||
      typeof group.mirrorX !== 'boolean'
    ) {
      complain(id, 'invalid repeated core group');
      continue;
    }
    for (const c of members) {
      if (
        !validBox(c.box) ||
        Math.abs(c.box[2] - c.box[0] - group.tile[0]) > EPS ||
        Math.abs(c.box[3] - c.box[1] - group.tile[1]) > EPS
      )
        complain(id, 'repeated core dimensions disagree');
      if (!c.selected) {
        rectangle(c.box, c.id);
        const inner = inflate(c.box, -Math.min(...group.tile) * 0.12);
        const detail = lines(raw).filter((s) => insideBox(s.slice(0, 2), inner) && insideBox(s.slice(2), inner));
        if (detail.length < 8) complain(c.id, 'core has no emitted internal structure');
        const normalize = (s) => {
          const p = (x, y) => [group.mirrorX ? c.box[2] - x : x - c.box[0], y - c.box[1]];
          return [...p(s[0], s[1]), ...p(s[2], s[3])];
        };
        const fine = (raw.segs?.[2] ?? [])
          .filter((s) => finiteSegment(s) && insideBox(s.slice(0, 2), inner) && insideBox(s.slice(2), inner))
          .map(normalize);
        patterns.push({ id: c.id, segments: fine });
      }
    }
    for (let axis = 0; axis < 2; axis++) {
      const coords = unique(members.map((c) => center(c)[axis]));
      if (coords.length > 1 && coords.some((v, i) => i && Math.abs(v - coords[i - 1] - group.pitch[axis]) > EPS))
        complain(id, 'irregular core placement pitch');
      if (coords.length > 1 && group.pitch[axis] < group.tile[axis] - EPS)
        complain(id, 'core pitch overlaps neighboring tile');
    }
    if (
      xs.length > 1 &&
      (group.pitch[0] < group.tile[0] - EPS ||
        xs.some((x) => Math.abs((x - xs[0]) / group.pitch[0] - Math.round((x - xs[0]) / group.pitch[0])) > EPS))
    )
      complain(id, 'core columns disagree with declared lattice');
  }
  if (
    grouped.length !== cores.length ||
    new Set(grouped).size !== cores.length ||
    grouped.some((id) => !actual.has(id))
  )
    complain('die', 'groups do not cover real cores exactly once');
  if (
    !['six-core', 'four-core', 'paired-columns'].includes(layout.variant) ||
    (layout.variant === 'six-core'
      ? cores.length !== 6 || xs.length !== 3 || ys.length !== 2
      : cores.length !== 4 || xs.length !== 2 || ys.length !== 2)
  )
    complain('die', 'variant disagrees with actual core topology');
  if (patterns.length) {
    const reference = lineIndex(patterns[0].segments);
    for (const pattern of patterns.slice(1)) {
      const other = lineIndex(pattern.segments);
      if (
        !pattern.segments.length ||
        pattern.segments.some((s) => !reference.covered(s)) ||
        patterns[0].segments.some((s) => !other.covered(s))
      )
        complain(pattern.id, 'repeated core interior does not match declared mirroring');
    }
  }
  if (layout.variant === 'four-core' || layout.variant === 'paired-columns') {
    const caches = [...owners.values()].filter((c) => c.kind === 'cache');
    const left = cores.filter((c) => Math.abs(center(c)[0] - xs[0]) <= EPS),
      right = cores.filter((c) => Math.abs(center(c)[0] - xs.at(-1)) <= EPS);
    const west = Math.min(...left.map((c) => c.box[0])),
      east = Math.max(...right.map((c) => c.box[2]));
    const gapLeft = Math.max(...left.map((c) => c.box[2])),
      gapRight = Math.min(...right.map((c) => c.box[0]));
    if (
      caches.length !== 2 ||
      (layout.variant === 'four-core'
        ? !caches.some((c) => c.box[2] <= west + EPS) || !caches.some((c) => c.box[0] >= east - EPS)
        : caches.some((c) => c.box[0] < gapLeft - EPS || c.box[2] > gapRight + EPS))
    )
      complain('die', 'LLC placement disagrees with physical variant');
    for (const c of caches) {
      rectangle(c.box, c.id);
      const inner = inflate(c.box, -Math.min(c.box[2] - c.box[0], c.box[3] - c.box[1]) * 0.05);
      const detail = (raw.segs?.[2] ?? []).filter(
        (s) => finiteSegment(s) && insideBox(s.slice(0, 2), inner) && insideBox(s.slice(2), inner),
      );
      const vertical = detail.filter((s) => Math.abs(s[0] - s[2]) <= EPS && Math.abs(s[1] - s[3]) > EPS);
      const horizontal = detail.filter((s) => Math.abs(s[1] - s[3]) <= EPS && Math.abs(s[0] - s[2]) > EPS);
      const columns = vertical.filter(
        (v) =>
          distinctCoordinates(horizontal.filter((h) => segmentIntersection(v, h).type === 'proper').map((h) => h[1]))
            .length >= 3,
      );
      if (distinctCoordinates(columns.map((s) => s[0])).length < 3) complain(c.id, 'LLC lacks emitted memory array');
    }
  }
}

/** Audit BoardLayout / ChipPackagingLayout / ChipDieLayout against raw strokes and,
 * when supplied, the actual retained geometry after aperture clipping. Returns issues. */
export function inspectChipSurface(raw, model, finished) {
  if (!model || model.type !== 'chip') return ['surface: missing chip model'];
  const ctx = auditContext(raw, model, finished);
  // Scope is anchored to the real selected object. Relabelling a package as a rack
  // must not make missing surface evidence disappear from the audit.
  const expected = { package: 'board', die: 'package', core: 'die' }[raw.selectedKind];
  if (expected && model.level !== expected) ctx.complain(expected, 'level disagrees with actual selected object');
  const level = expected ?? model.level,
    era = raw.era ?? model.era;
  if (level === 'board') inspectBoard(model.board, ctx);
  if (era === 'modern' && level === 'package') inspectPackaging(model.package, ctx);
  if (era === 'modern' && level === 'die') inspectDie(model.dieLayout, ctx);
  return [...new Set(ctx.issues)];
}
