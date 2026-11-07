/** Independent room-scale and functional-program checks, separate from scene construction. */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
const limits = JSON.parse(readFileSync('scripts/figures/room-program-limits.json', 'utf8'));
function proportions(row) {
  const share = (row.width * row.depth) / (row.roomWidth * row.roomDepth);
  assert(
    share >= limits.primaryFloorShareMin && share <= limits.primaryFloorShareMax,
    `${row.theme}: primary furniture occupies ${(share * 100).toFixed(1)}% of the room; permitted ${limits.primaryFloorShareMin * 100}–${limits.primaryFloorShareMax * 100}%`,
  );
  if (['work', 'computer', 'study', 'messy'].includes(row.theme)) {
    assert(
      row.depth / limits.unitsPerMetre <= limits.deskDepthMetresMax,
      `${row.theme}: desk too deep for human scale`,
    );
    assert(
      row.width / limits.unitsPerMetre >= limits.deskWidthMetresMin &&
        row.width / limits.unitsPerMetre <= limits.deskWidthMetresMax,
      `${row.theme}: desk width outside ergonomic range`,
    );
  }
  return share;
}
if (process.argv.includes('--baseline')) {
  const data = JSON.parse(readFileSync('scripts/figures/room-proportion-before.json', 'utf8'));
  assert.equal(data.rooms.length, 9);
  for (const row of data.rooms) proportions(row);
  console.log('Baseline proportions passed.');
  process.exit(0);
}
mkdirSync('figures-out', { recursive: true });
const validation = { schema: 'room-program-check/1', passed: false, rooms: [] };
writeFileSync('figures-out/room-program-report.json', JSON.stringify(validation, null, 2) + '\n');
const scratch = mkdtempSync(join(tmpdir(), 'room-program-'));
try {
  const outfile = join(scratch, 'scene.mjs');
  await build({
    stdin: {
      contents:
        "export {arrange,THEMES,tabletop} from './src/figures/kit/tabletop';export {roomPlan} from './src/figures/kit/roomplan';export {roomModels} from './src/figures/kit/tableroom';",
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile,
  });
  const { arrange, THEMES, tabletop, roomPlan, roomModels } = await import(pathToFileURL(outfile));
  assert.equal(THEMES.length, 9);
  assert.equal(Object.keys(limits.required).length, 9);
  const report = [];
  for (const theme of THEMES)
    for (const variant of [0, 1, 2]) {
      const p = { ...arrange(() => 0.5, theme.id), roomVariant: variant },
        r = roomPlan(p),
        b = tabletop(p).bounds,
        parts = roomModels(p);
      const row = {
        theme: theme.id,
        variant,
        width: b.hi[0] - b.lo[0],
        depth: b.hi[2] - b.lo[2],
        height: -b.lo[1],
        roomWidth: r.half * 2,
        roomDepth: r.front - r.back,
      };
      if (theme.id === 'computer') {
        const monitor = p.items.find((it) => it.kind === 'monitor').bounds,
          tower = p.items.find((it) => it.kind === 'tower').bounds;
        const screenWidth = (monitor.hi[0] - monitor.lo[0]) / limits.unitsPerMetre,
          towerHeight = (tower.hi[1] - tower.lo[1]) / limits.unitsPerMetre;
        assert(
          screenWidth >= limits.monitorWidthMetresMin && screenWidth <= limits.monitorWidthMetresMax,
          'Computer monitor is not at human scale',
        );
        assert(
          towerHeight >= limits.towerHeightMetresMin && towerHeight <= limits.towerHeightMetresMax,
          'Computer tower is not at human scale',
        );
      }
      const share = proportions(row),
        floor = parts.filter((s) => s.mount === 'floor' && !s.support);
      assert(floor.length >= limits.floorFurnitureMin, `${theme.id}: incomplete room program`);
      const names = new Set(parts.map((s) => s.label));
      for (const label of limits.required[theme.id]) assert(names.has(label), `${theme.id}: missing ${label}`);
      const seats = parts.filter((s) => s.seat);
      if (theme.id === 'dining') assert.equal(seats.length, 6, 'Dining needs six independently placed seats');
      for (const part of floor) {
        const lift = part.model.bounds.lo[1] - r.floor;
        if (lift > 1e-7)
          assert(
            lift <= 0.025 &&
              parts.some(
                (s) =>
                  s.support &&
                  [0, 2].every(
                    (k) =>
                      s.model.bounds.lo[k] <= part.model.bounds.lo[k] + 0.02 &&
                      s.model.bounds.hi[k] >= part.model.bounds.hi[k] - 0.02,
                  ),
              ),
            `${theme.id}/${part.label}: floating furniture without a textile support`,
          );
      }
      const obstacles = [b, ...floor.map((s) => s.model.bounds)],
        step = limits.walkGridStep,
        rad = limits.walkRadius;
      const nx = Math.floor((2 * r.half - rad * 2) / step) + 1,
        nz = Math.floor((r.front - r.back - rad * 2) / step) + 1;
      const point = (x, z) => [-r.half + rad + x * step, r.back + rad + z * step];
      const free = (x, z) => {
        const [wx, wz] = point(x, z);
        return !obstacles.some(
          (a) => wx > a.lo[0] - rad && wx < a.hi[0] + rad && wz > a.lo[2] - rad && wz < a.hi[2] + rad,
        );
      };
      const index = (x, z) => z * nx + x;
      const cell = (x, z) => [
        Math.max(0, Math.min(nx - 1, Math.round((x + r.half - rad) / step))),
        Math.max(0, Math.min(nz - 1, Math.round((z - r.back - rad) / step))),
      ];
      const start = cell(0, r.front - rad - 0.05),
        queue = [start],
        seen = new Set([index(...start)]);
      assert(free(...start), `${theme.id}: entrance blocked`);
      for (let head = 0; head < queue.length; head++) {
        const [x, z] = queue[head];
        for (const [dx, dz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const a = x + dx,
            c = z + dz,
            id = index(a, c);
          if (a >= 0 && a < nx && c >= 0 && c < nz && !seen.has(id) && free(a, c)) {
            seen.add(id);
            queue.push([a, c]);
          }
        }
      }
      for (const [label, x, z] of [
        ['primary work zone', 0, b.hi[2] + 2.4],
        ['right storage approach', r.half - 1, r.back + 2.6],
      ]) {
        const target = cell(x, z);
        assert(seen.has(index(...target)), `${theme.id}: no walking route to ${label}`);
      }
      report.push({ ...row, primaryFloorShare: share, floorFurniture: floor.length, walkableCells: seen.size });
    }
  mkdirSync('figures-out', { recursive: true });
  validation.passed = true;
  validation.rooms = report;
  writeFileSync('figures-out/room-program-report.json', JSON.stringify(validation, null, 2) + '\n');
  console.log(
    'Exit 0 (PASS): 27 room programs; human furniture scale, themed furnishings, grounded supports and connected circulation.',
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
