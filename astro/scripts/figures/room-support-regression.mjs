import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkRoomSupports } from './room-support-check.mjs';

const scratch = mkdtempSync(join(tmpdir(), 'room-supports-'));
mkdirSync('figures-out', { recursive: true });
const report = { schema: 'room-support-check/1', passed: false, rooms: 0, contents: 0, negativeFixtures: 0 };
writeFileSync('figures-out/room-support-report.json', JSON.stringify(report, null, 2) + '\n');
try {
  const file = join(scratch, 'scene.mjs');
  await build({
    stdin: {
      contents:
        "export {arrange,THEMES} from './src/figures/kit/tabletop';export {roomPlan} from './src/figures/kit/roomplan';export {roomModels} from './src/figures/kit/tableroom';",
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: file,
  });
  const { arrange, THEMES, roomPlan, roomModels } = await import(pathToFileURL(file));
  for (const theme of THEMES)
    for (const roomVariant of [0, 1, 2])
      for (const layoutVariant of [0, 1, 2])
        for (const furnitureVariant of [0, 1, 2]) {
          const p = { ...arrange(() => 0.5, theme.id), roomVariant, layoutVariant, furnitureVariant };
          report.contents += checkRoomSupports(p, roomModels(p), roomPlan(p));
          report.rooms++;
        }
  const p = { ...arrange(() => 0.5, 'study'), roomVariant: 1 },
    plan = roomPlan(p),
    original = roomModels(p);
  for (const amount of [0.04, -0.04]) {
    const parts = structuredClone(original),
      shelf = parts.find((s) => s.label === 'Built-in book shelves');
    for (const s of shelf.model.surfaces.filter((s) => s.finish === 'book'))
      for (const point of s.points) point[1] += amount;
    assert.throws(() => checkRoomSupports(p, parts, plan), /Unsupported shelf contents/);
    report.negativeFixtures++;
  }
  const detached = structuredClone(original),
    shelf = detached.find((s) => s.label === 'Built-in book shelves');
  for (const s of shelf.model.surfaces) for (const point of s.points) point[2] += 0.12;
  shelf.model.bounds.lo[2] += 0.12;
  shelf.model.bounds.hi[2] += 0.12;
  assert.throws(() => checkRoomSupports(p, detached, plan), /Floating wall fixture/);
  report.negativeFixtures++;
  assert.throws(
    () =>
      checkRoomSupports(
        p,
        original.filter((s) => s.label !== 'Ceiling fixture mounting rails'),
        plan,
      ),
    /Floating wall fixture/,
  );
  report.negativeFixtures++;
  const unsupported = structuredClone(original),
    unit = unsupported.find((s) => s.label === 'Built-in book shelves');
  unit.model.surfaces = unit.model.surfaces.filter((s) => s.finish === 'book' || s.finish === 'paper');
  assert.throws(() => checkRoomSupports(p, unsupported, plan), /Unsupported shelf contents/);
  report.negativeFixtures++;
  const kitchen = { ...arrange(() => 0.5, 'kitchen'), roomVariant: 1 },
    kitchenPlan = roomPlan(kitchen),
    withoutCleat = structuredClone(roomModels(kitchen)),
    cabinet = withoutCleat.find((s) => s.label === 'Kitchen wall cupboards');
  cabinet.model.surfaces = cabinet.model.surfaces.filter(
    (s) => !(s.finish === 'metal' && s.points.every((q) => q[2] <= kitchenPlan.back + 1e-7)),
  );
  cabinet.model.bounds.lo[2] = Math.min(...cabinet.model.surfaces.flatMap((s) => s.points.map((q) => q[2])));
  assert.throws(() => checkRoomSupports(kitchen, withoutCleat, kitchenPlan), /Floating wall fixture/);
  report.negativeFixtures++;
  report.passed = true;
  writeFileSync('figures-out/room-support-report.json', JSON.stringify(report, null, 2) + '\n');
  console.log(
    `Room supports passed: ${report.rooms} theme/variant rooms, ${report.contents} content solids, ${report.negativeFixtures} rejected floating/buried/detached fixtures.`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
