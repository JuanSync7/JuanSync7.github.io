import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PerspectiveCamera, OrthographicCamera, Raycaster, Vector2, Vector3 } from 'three';
const scratch = mkdtempSync(join(tmpdir(), 'room-depth-')),
  w = 960,
  h = 600,
  triangles = new WeakMap();
function inside(points, x, y) {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i],
      b = points[j];
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
}
function visible(points) {
  return (
    points.reduce((s, a, i) => {
      const b = points[(i + 1) % points.length];
      return s + a[0] * b[1] - b[0] * a[1];
    }, 0) < -1e-8
  );
}
function modelTriangles(model) {
  let list = triangles.get(model);
  if (list) return list;
  list = [];
  for (const surface of model.surfaces.filter((s) => s.face))
    for (let i = 1; i + 1 < surface.points.length; i++)
      list.push({
        surface,
        a: new Vector3(...surface.points[0]),
        b: new Vector3(...surface.points[i]),
        c: new Vector3(...surface.points[i + 1]),
      });
  triangles.set(model, list);
  return list;
}
function check(model, ordered, view, project) {
  const v = view,
    cam =
      v.controls.view === 'eye'
        ? new PerspectiveCamera(v.fov, w / h, 0.1, 120)
        : new OrthographicCamera(
            (-v.height * w) / h / 2 + v.offset[0],
            (v.height * w) / h / 2 + v.offset[0],
            v.height / 2 + v.offset[1],
            -v.height / 2 + v.offset[1],
            0.1,
            120,
          );
  cam.position.set(...v.position);
  cam.lookAt(...v.target);
  cam.updateMatrixWorld();
  const caster = new Raycaster(),
    at = new Vector3();
  let samples = 0,
    bad = 0;
  const candidates = model.surfaces.filter((s) => s.face && ['book', 'kraft', 'glass', 'porcelain'].includes(s.finish));
  for (let i = 0; i < candidates.length; i += 7) {
    const s = candidates[i],
      p = s.points.reduce((a, q) => a.map((n, k) => n + q[k] / s.points.length), [0, 0, 0]),
      projected = project(v, p),
      // Compare pixel centres: exact shared polygon edges have no unique owner.
      q = [Math.floor(projected[0]) + 0.5, Math.floor(projected[1]) + 0.5];
    if (q[0] < 0 || q[0] > w || q[1] < 0 || q[1] > h) continue;
    caster.setFromCamera(new Vector2((q[0] / w) * 2 - 1, 1 - (q[1] / h) * 2), cam);
    let nearest = null,
      distance = Infinity;
    for (const t of modelTriangles(model)) {
      const hit = caster.ray.intersectTriangle(t.a, t.b, t.c, false, at);
      if (hit) {
        const d = hit.distanceToSquared(caster.ray.origin);
        if (d < distance - 1e-7) {
          distance = d;
          nearest = t.surface;
        }
      }
    }
    if (!nearest || !['book', 'paper', 'kraft', 'glass', 'porcelain'].includes(nearest.finish)) continue;
    const painted = ordered.findLast((f) => f.surface.face && inside(f.points, q[0], q[1]));
    samples++;
    if (!painted || painted.surface.finish !== nearest.finish) bad++;
  }
  return { samples, bad };
}
mkdirSync('figures-out', { recursive: true });
writeFileSync(
  'figures-out/room-depth-report.json',
  JSON.stringify({ schema: 'room-depth-check/1', passed: false }) + '\n',
);
try {
  const file = join(scratch, 'scene.mjs');
  await build({
    stdin: {
      contents:
        "export{arrange}from './src/figures/kit/tabletop';export{sceneModels}from './src/figures/kit/roomscene';export{roomView,roomProject}from './src/figures/kit/roomview';export{flatRoomSurfaces}from './src/figures/kit/roomflatorder';",
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: file,
  });
  const k = await import(pathToFileURL(file));
  let samples = 0,
    bad = 0,
    poses = 0,
    negative = 0;
  const details = [];
  for (const theme of ['dining', 'work', 'computer', 'storage', 'messy', 'study', 'kitchen', 'bar', 'lab'])
    for (const roomVariant of [0, 1, 2]) {
      const p = { ...k.arrange(() => 0.5, theme), roomVariant },
        models = k.sceneModels(p);
      const shelves = models
        .map((s, index) => ({ ...s, index }))
        .filter(
          (s) =>
            s.kind === 'room' &&
            /shel|bookcase|cabinet|display/i.test(s.label) &&
            s.model.surfaces.some((f) => ['book', 'kraft', 'glass', 'porcelain'].includes(f.finish)),
        );
      for (const projection of ['eye', 'isometric'])
        for (const angle of [60, 90, 135]) {
          const view = k.roomView(p, w, h, { view: projection, angle }),
            ordered = k.flatRoomSurfaces(p, models, view);
          poses++;
          for (const shelf of shelves) {
            const result = check(
              shelf.model,
              ordered.filter((f) => f.index === shelf.index),
              view,
              k.roomProject,
            );
            samples += result.samples;
            bad += result.bad;
            if (result.bad) details.push({ theme, roomVariant, projection, angle, label: shelf.label, ...result });
            if (
              theme === 'study' &&
              roomVariant === 1 &&
              projection === 'isometric' &&
              angle === 135 &&
              shelf.label === 'Library bookcase'
            ) {
              const legacy = shelf.model.surfaces
                .map((surface) => ({ surface, points: surface.points.map((q) => k.roomProject(view, q)) }))
                .filter((f) => f.surface.face && visible(f.points))
                .sort(
                  (a, b) =>
                    a.points.reduce((s, q) => s + q[2] / a.points.length, 0) -
                    b.points.reduce((s, q) => s + q[2] / b.points.length, 0),
                );
              negative = check(shelf.model, legacy, view, k.roomProject).bad;
            }
          }
        }
    }
  mkdirSync('figures-out', { recursive: true });
  writeFileSync(
    'figures-out/room-depth-report.json',
    JSON.stringify(
      { schema: 'room-depth-check/1', passed: false, samples, poses, bad, legacyFailures: negative, details },
      null,
      2,
    ) + '\n',
  );
  assert(samples > 100, 'Occlusion check sampled no contents');
  assert(negative > 0, 'Legacy average-depth failure was not caught');
  assert.equal(
    bad,
    0,
    `Shelf occlusion: ${bad}/${samples} content samples painted with an occluding case face. First: ${JSON.stringify(details.slice(0, 3))}`,
  );
  writeFileSync(
    'figures-out/room-depth-report.json',
    JSON.stringify(
      { schema: 'room-depth-check/1', passed: true, samples, poses, bad, legacyFailures: negative, details },
      null,
      2,
    ) + '\n',
  );
  console.log(
    `Room depth passed: ${samples} ray-checked shelf samples across ${poses} poses; legacy painter rejected ${negative} samples.`,
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
