// The system map's wire rule: every wire runs at least MIN_WIRE map units, the length of
// Slurm → EDA tools, so no arrowhead crowds the boxes it joins. Exits 1 and names each short
// wire by its two ends; Node strips the data file's types, so there is no build step.
import { EDGES, MIN_WIRE, NODES } from '../../src/data/system-map.ts';

const length = (pts) => pts.slice(1).reduce((sum, [x, y], i) => sum + Math.hypot(x - pts[i][0], y - pts[i][1]), 0);

// The box a point sits on or just outside (within the 4-unit gap an arrowhead leaves).
const boxAt = ([x, y]) => {
  const hits = NODES.filter((n) => x >= n.x - 4 && x <= n.x + n.w + 4 && y >= n.y - 4 && y <= n.y + n.h + 4);
  return hits.length ? hits[hits.length - 1].title : `(${x}, ${y})`;
};

const short = EDGES.map((e) => ({ e, len: length(e.pts) })).filter(({ len }) => len < MIN_WIRE);

if (short.length) {
  console.error(`system map: ${short.length} wire(s) shorter than MIN_WIRE (${MIN_WIRE}):`);
  for (const { e, len } of short) {
    console.error(`  ${boxAt(e.pts[0])} → ${boxAt(e.pts[e.pts.length - 1])}: ${len.toFixed(0)}`);
  }
  process.exit(1);
}
console.log(`system map: ${EDGES.length} wires, all at least ${MIN_WIRE}`);
