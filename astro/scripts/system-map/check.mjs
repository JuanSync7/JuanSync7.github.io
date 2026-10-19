// The system map's drawing rules, measured. Each failure names the wire or label and the rule.
// Node strips the data file's types, so there is no build step.
//   length     every wire runs at least MIN_WIRE (the length of Slurm → EDA tools)
//   clearance  a wire passes no box it does not join closer than WIRE_CLEARANCE
//   corner     a wire meets a box at least CORNER_INSET from its corners
//   label      a label is never cut by a wire, never sits on a box, and sits next to a wire
//   crossings  at most MAX_CROSSINGS wire crossings
import { CORNER_INSET, EDGES, LABELS, MAP_W, MAX_CROSSINGS, MIN_WIRE, NODES, WIRE_CLEARANCE } from '../../src/data/system-map.ts';

// Labels are 11px mono, 0.6em a character. Measured at the narrowest map (the 1000px
// breakpoint less the gutters, about 920px), where a character covers the most map units.
const NARROWEST = 920;
const LABEL_CHAR = 11 * 0.6 * (MAP_W / NARROWEST);
const LABEL_H = 11 * 1.4 * (MAP_W / NARROWEST);
const LABEL_REACH = 24;
const END_GAP = 4; // an arrowhead stops this short of its box

const segs = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);
const length = (pts) => segs(pts).reduce((sum, [[ax, ay], [bx, by]]) => sum + Math.hypot(bx - ax, by - ay), 0);
const near = (n, [x, y], pad) => x >= n.x - pad && x <= n.x + n.w + pad && y >= n.y - pad && y <= n.y + n.h + pad;
const inside = (inner, outer) => inner !== outer && inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;
const area = (n) => n.w * n.h;
// The box a wire end belongs to: the smallest box it sits on, or stops END_GAP short of.
const endBox = (p) => NODES.filter((n) => near(n, p, END_GAP)).sort((a, b) => area(a) - area(b))[0];
const name = (n, p) => (n ? n.title : `(${p[0]}, ${p[1]})`);
const wireName = (e) => `${name(endBox(e.pts[0]), e.pts[0])} → ${name(endBox(e.pts.at(-1)), e.pts.at(-1))}`;

// Distance from an axis-aligned segment to a rectangle (0 if they touch or overlap).
const segRectGap = ([[ax, ay], [bx, by]], r) => {
  const dx = Math.max(r.x - Math.max(ax, bx), Math.min(ax, bx) - (r.x + r.w), 0);
  const dy = Math.max(r.y - Math.max(ay, by), Math.min(ay, by) - (r.y + r.h), 0);
  return Math.hypot(dx, dy);
};

const failures = [];
const fail = (rule, what) => failures.push(`  ${rule}: ${what}`);

for (const e of EDGES) {
  const len = length(e.pts);
  if (len < MIN_WIRE) fail('length', `${wireName(e)} runs ${len.toFixed(0)}, under ${MIN_WIRE}`);

  const ends = [e.pts[0], e.pts.at(-1)].map(endBox).filter(Boolean);
  // A wire may run through the box it joins, inside a frame holding that box, and past the boxes
  // inside a frame it joins (the frame's padding sets that spacing).
  const exempt = new Set(ends.flatMap((b) => [b, ...NODES.filter((n) => inside(b, n) || inside(n, b))]));
  for (const n of NODES) {
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

const allSegs = EDGES.flatMap((e) => segs(e.pts).map((s) => ({ s, e })));
for (const l of LABELS) {
  const tw = l.text.length * LABEL_CHAR;
  const x = l.align === 'left' ? l.x : l.align === 'right' ? l.x + l.w - tw : l.x + (l.w - tw) / 2;
  const r = { x, y: l.y, w: tw, h: LABEL_H };
  const cut = allSegs.filter(({ s }) => segRectGap(s, r) === 0);
  for (const { e } of cut) fail('label', `"${l.text}" is cut by ${wireName(e)}`);
  for (const n of NODES) if (segRectGap([[r.x, r.y], [r.x + r.w, r.y + r.h]], n) === 0 && n.kind !== 'frame') fail('label', `"${l.text}" sits on ${n.title}`);
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
if (crossings > MAX_CROSSINGS) fail('crossings', `${crossings} wire crossings, over ${MAX_CROSSINGS}`);

if (failures.length) {
  console.error(`system map: ${failures.length} rule failure(s):\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`system map: ${EDGES.length} wires and ${LABELS.length} labels pass (length ≥ ${MIN_WIRE}, clearance ≥ ${WIRE_CLEARANCE}, corners ≥ ${CORNER_INSET}, ${crossings}/${MAX_CROSSINGS} crossings)`);
