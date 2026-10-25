// The drawing rules (the vault's Drawing diagrams deck), measured on the system map and on every
// learn diagram in src/data/diagrams/. Each failure names the diagram, the wire or label and the rule.
// Node strips the data files' types, so there is no build step.
//   length     every wire runs at least MIN_WIRE (the length of Slurm → EDA tools)      R-DIAG-1
//   clearance  a wire passes no box it does not join closer than WIRE_CLEARANCE         R-DIAG-3
//   corner     a wire meets a box at least CORNER_INSET from its corners                R-DIAG-4
//   label      a label is never cut by a wire, never sits on a box, and sits next to a wire  R-DIAG-15
//   crossings  at most the diagram's allowed crossings                                  R-DIAG-8
//   joined     every box but a band or a frame is touched by a wire                     R-DIAG-11
//   width      a learn diagram is at most DIAGRAM_MAX_W wide and has steps              R-DIAG-17, 19
import { readdirSync } from 'node:fs';
import { CORNER_INSET, EDGES, LABELS, MAP_W, MAX_CROSSINGS, MIN_WIRE, NODES, WIRE_CLEARANCE } from '../../src/data/system-map.ts';
import { DIAGRAM_MAX_W, DIAGRAM_NARROWEST } from '../../src/data/diagram.ts';

// Labels are 11px mono, 0.6em a character, measured where the drawing is narrowest, so where a
// character covers the most diagram units. The map is drawn down to about 920px (the 1000px
// breakpoint less the gutters); a learn diagram down to DIAGRAM_NARROWEST.
const LABEL_REACH = 24;
const END_GAP = 4; // an arrowhead stops this short of its box

const segs = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);
const length = (pts) => segs(pts).reduce((sum, [[ax, ay], [bx, by]]) => sum + Math.hypot(bx - ax, by - ay), 0);
const near = (n, [x, y], pad) => x >= n.x - pad && x <= n.x + n.w + pad && y >= n.y - pad && y <= n.y + n.h + pad;
const inside = (inner, outer) => inner !== outer && inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
const area = (n) => n.w * n.h;

// Distance from an axis-aligned segment to a rectangle (0 if they touch or overlap).
const segRectGap = ([[ax, ay], [bx, by]], r) => {
  const dx = Math.max(r.x - Math.max(ax, bx), Math.min(ax, bx) - (r.x + r.w), 0);
  const dy = Math.max(r.y - Math.max(ay, by), Math.min(ay, by) - (r.y + r.h), 0);
  return Math.hypot(dx, dy);
};

const failures = [];

function check(diagram, { nodes, edges, labels, unitsPerPx, maxCrossings }) {
  const fail = (rule, what) => failures.push(`  ${diagram} · ${rule}: ${what}`);
  const charW = 11 * 0.6 * unitsPerPx;
  const lineH = 11 * 1.4 * unitsPerPx;
  // The box a wire end belongs to: the smallest box it sits on, or stops END_GAP short of.
  const endBox = (p) => nodes.filter((n) => near(n, p, END_GAP)).sort((a, b) => area(a) - area(b))[0];
  const name = (n, p) => (n ? n.title : `(${p[0]}, ${p[1]})`);
  const wireName = (e) => `${name(endBox(e.pts[0]), e.pts[0])} → ${name(endBox(e.pts.at(-1)), e.pts.at(-1))}`;

  for (const e of edges) {
    const len = length(e.pts);
    if (len < MIN_WIRE) fail('length', `${wireName(e)} runs ${len.toFixed(0)}, under ${MIN_WIRE}`);

    const ends = [e.pts[0], e.pts.at(-1)].map(endBox).filter(Boolean);
    // A wire may run through the box it joins, inside a frame holding that box, and past the boxes
    // inside a frame it joins (the frame's padding sets that spacing).
    const exempt = new Set(ends.flatMap((b) => [b, ...nodes.filter((n) => inside(b, n) || inside(n, b))]));
    for (const n of nodes) {
      if (exempt.has(n)) continue;
      const gap = Math.min(...segs(e.pts).map((s) => segRectGap(s, n)));
      if (gap < WIRE_CLEARANCE) fail('clearance', `${wireName(e)} passes ${n.title} at ${gap.toFixed(0)}, under ${WIRE_CLEARANCE}`);
    }

    for (const p of [e.pts[0], e.pts.at(-1)]) {
      const b = endBox(p);
      if (!b) continue;
      const onSide = Math.abs(p[0] - b.x) <= END_GAP || Math.abs(p[0] - (b.x + b.w)) <= END_GAP;
      const fromCorner = onSide ? Math.min(p[1] - b.y, b.y + b.h - p[1]) : Math.min(p[0] - b.x, b.x + b.w - p[0]);
      if (fromCorner < CORNER_INSET) fail('corner', `${wireName(e)} meets ${b.title} ${fromCorner.toFixed(0)} from a corner, under ${CORNER_INSET}`);
    }
  }

  const touched = new Set(edges.flatMap((e) => [e.pts[0], e.pts.at(-1)].map(endBox)));
  for (const n of nodes) if (!touched.has(n) && n.kind !== 'band' && n.kind !== 'frame') fail('joined', `${n.title} has no wire`);

  const allSegs = edges.flatMap((e) => segs(e.pts).map((s) => ({ s, e })));
  for (const l of labels) {
    const tw = l.text.length * charW;
    const x = l.align === 'left' ? l.x : l.align === 'right' ? l.x + l.w - tw : l.x + (l.w - tw) / 2;
    const r = { x, y: l.y, w: tw, h: lineH };
    for (const { e } of allSegs.filter(({ s }) => segRectGap(s, r) === 0)) fail('label', `"${l.text}" is cut by ${wireName(e)}`);
    for (const n of nodes) if (segRectGap([[r.x, r.y], [r.x + r.w, r.y + r.h]], n) === 0 && n.kind !== 'frame') fail('label', `"${l.text}" sits on ${n.title}`);
    const reach = Math.min(...allSegs.map(({ s }) => segRectGap(s, r)));
    if (reach > LABEL_REACH) fail('label', `"${l.text}" is ${reach.toFixed(0)} from the nearest wire, over ${LABEL_REACH}`);
  }

  let crossings = 0;
  for (let i = 0; i < allSegs.length; i++) {
    for (let j = i + 1; j < allSegs.length; j++) {
      if (allSegs[i].e === allSegs[j].e) continue;
      const [[ax, ay], [bx, by]] = allSegs[i].s;
      const [[cx, cy], [dx, dy]] = allSegs[j].s;
      const h1 = ay === by, h2 = cy === dy;
      if (h1 === h2) continue; // parallel segments do not cross
      const [h, v] = h1 ? [allSegs[i].s, allSegs[j].s] : [allSegs[j].s, allSegs[i].s];
      const [hx0, hx1] = [Math.min(h[0][0], h[1][0]), Math.max(h[0][0], h[1][0])];
      const [vy0, vy1] = [Math.min(v[0][1], v[1][1]), Math.max(v[0][1], v[1][1])];
      if (v[0][0] > hx0 && v[0][0] < hx1 && h[0][1] > vy0 && h[0][1] < vy1) crossings++;
    }
  }
  if (crossings > maxCrossings) fail('crossings', `${crossings} wire crossings, over ${maxCrossings}`);
  return crossings;
}

const mapCrossings = check('system map', { nodes: NODES, edges: EDGES, labels: LABELS, unitsPerPx: MAP_W / 920, maxCrossings: MAX_CROSSINGS });

const dir = new URL('../../src/data/diagrams/', import.meta.url);
const diagrams = [];
for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts')).sort()) {
  const { DIAGRAMS } = await import(new URL(file, dir).href);
  diagrams.push(...DIAGRAMS);
}
const ids = new Set();
for (const d of diagrams) {
  if (ids.has(d.id)) failures.push(`  ${d.id} · id: used twice`);
  ids.add(d.id);
  if (d.w > DIAGRAM_MAX_W) failures.push(`  ${d.id} · width: ${d.w}, over ${DIAGRAM_MAX_W}`);
  if (!d.steps.length) failures.push(`  ${d.id} · steps: none, so narrow screens and screen readers get nothing`);
  check(d.id, { ...d, unitsPerPx: Math.max(1, d.w / DIAGRAM_NARROWEST), maxCrossings: d.maxCrossings ?? 0 });
}

if (failures.length) {
  console.error(`diagrams: ${failures.length} rule failure(s):\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`system map: ${EDGES.length} wires and ${LABELS.length} labels pass (length ≥ ${MIN_WIRE}, clearance ≥ ${WIRE_CLEARANCE}, corners ≥ ${CORNER_INSET}, ${mapCrossings}/${MAX_CROSSINGS} crossings)`);
console.log(`learn diagrams: ${diagrams.length} pass the same rules (${diagrams.map((d) => d.id).join(', ') || 'none'})`);
