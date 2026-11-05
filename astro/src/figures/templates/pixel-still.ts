import {
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
} from 'three';
import { defineTemplate } from '../defineTemplate';
import { defineThreeFigure } from '../defineThree';
import { project, type Vec3 } from '../kit/camera';
import { poly } from '../kit/draw';
import { hexOf, ink, mix } from '../kit/ink';
import { arrange, itemModel, propName, tableView, tabletop, type TableItem, type TableScene } from '../kit/tabletop';
import type { PropModel } from '../kit/tableparts';
import type { Pointer } from '../types';

interface S {
  edges: LineBasicMaterial[][];
  faces: { material: MeshBasicMaterial; base: Color }[][];
}
function closest(p: TableScene, pointer: Pointer, w: number, h: number): number {
  let selected = -1,
    nearest = h * 0.28;
  if (pointer.active)
    p.items.forEach((it, i) => {
      const { lo, hi } = it.bounds;
      const q = project(tableView(p, w, h), (lo[0] + hi[0]) / 2, hi[1] / 2, (lo[2] + hi[2]) / 2);
      const d = Math.hypot(q[0] - pointer.x * w, q[1] - pointer.y * h);
      if (d < nearest) {
        selected = i;
        nearest = d;
      }
    });
  return selected;
}
function shade(points: Vec3[]): number {
  const [a, b, c] = points;
  if (!a || !b || !c) return 0;
  const ux = b[0] - a[0],
    uy = b[1] - a[1],
    uz = b[2] - a[2];
  const vx = c[0] - a[0],
    vy = c[1] - a[1],
    vz = c[2] - a[2];
  const ny = Math.abs(uz * vx - ux * vz),
    nx = Math.abs(uy * vz - uz * vy);
  return ny > nx ? 2 : nx > 0.00001 ? 1 : 0;
}
function mesh(model: PropModel, isTable = false): Group {
  const group = new Group(),
    buckets: number[][] = [[], [], []],
    edges: number[] = [];
  const seen = new Set<string>();
  for (const surface of model.surfaces) {
    const { points, face } = surface;
    const first = points[0];
    if (face && first)
      for (let i = 1; i + 1 < points.length; i++) {
        const a = points[i],
          b = points[i + 1];
        if (a && b) buckets[shade(points)]?.push(...first, ...a, ...b);
      }
    for (let i = 0; i < (face ? points.length : points.length - 1); i++) {
      const a = points[i],
        b = points[(i + 1) % points.length];
      if (!a || !b) continue;
      const key = [a.map((n) => n.toFixed(5)).join(','), b.map((n) => n.toFixed(5)).join(',')].sort().join('/');
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push(...a, ...b);
    }
  }
  buckets.forEach((positions, i) => {
    if (!positions.length) return;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    const color = isTable ? new Color(hexOf('panel2')) : new Color(hexOf('inkFaint')).multiplyScalar(0.14 + i * 0.09);
    group.add(
      new Mesh(
        geometry,
        new MeshBasicMaterial({
          color,
          side: DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        }),
      ),
    );
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(edges, 3));
  group.add(
    new LineSegments(
      geometry,
      new LineBasicMaterial({ color: hexOf('ink'), transparent: true, opacity: isTable ? 0.3 : 0.48 }),
    ),
  );
  return group;
}

export const object = (it: TableItem): Group => mesh(itemModel(it));
export { arrange };
const flatModels = new WeakMap<TableScene, PropModel[]>();

export default defineTemplate<TableScene, S>({
  id: 'pixel-still',
  title: 'Tabletop still life',
  idea: 'A seed chooses a dining, work, computer, storage, messy, study, kitchen, bar or lab table, then arranges its equipment in functional zones with clear space around every object.',
  style: 'three',
  renderer: defineThreeFigure,
  motion: 'responsive',
  answers: true,
  aspect: 2,
  grammar: (rng) => arrange(rng),
  name: (p) => `${p.theme.name} · ${p.items.length} objects`,
  alt: (p) =>
    `An angled ${p.theme.name.toLowerCase()} with ${p.items.map((it) => propName(it.kind)).join(', ')}, placed for their use with clear space between objects.`,
  build: ({ scene, params: p }) => {
    const models = p.items.map(object);
    const faces: S['faces'] = [],
      edges: S['edges'] = [];
    for (const model of models) {
      const f: S['faces'][number] = [],
        e: LineBasicMaterial[] = [];
      model.traverse((o) => {
        if (o instanceof Mesh && o.material instanceof MeshBasicMaterial)
          f.push({ material: o.material, base: o.material.color.clone() });
        if (o instanceof LineSegments && o.material instanceof LineBasicMaterial) e.push(o.material);
      });
      faces.push(f);
      edges.push(e);
    }
    scene.add(mesh(tabletop(p), true), ...models);
    return { faces, edges };
  },
  update: ({ camera, params: p, state: s, w, h, pointer, hover }) => {
    const dist = tableView(p, w, h).dist;
    camera.position.set(
      Math.sin(p.yaw) * Math.cos(p.pitch) * dist,
      Math.sin(p.pitch) * dist,
      Math.cos(p.yaw) * Math.cos(p.pitch) * dist,
    );
    camera.lookAt(0, 0, 0);
    const selected = hover > 0.1 ? closest(p, pointer, w, h) : -1;
    s.faces.forEach((faces, i) =>
      faces.forEach(({ material, base }) => {
        if (i === selected) material.color.set(hexOf('inkStrong'));
        else material.color.copy(base);
      }),
    );
    s.edges.forEach((edges, i) =>
      edges.forEach((m) => {
        m.color.set(hexOf(i === (selected < 0 ? p.lit : selected) ? 'signal' : 'ink'));
        m.opacity = i === (selected < 0 ? p.lit : selected) ? 0.9 : 0.42 + (p.items[i]?.z ?? 0) * 0.035;
      }),
    );
    return selected >= 0 ? propName(p.items[selected]?.kind ?? 'paper') : 'rest';
  },
  fallback: ({ ctx, w, h, pointer, params: p }) => {
    const cam = tableView(p, w, h),
      selected = closest(p, pointer, w, h);
    const models = flatModels.get(p) ?? [tabletop(p), ...p.items.map(itemModel)];
    flatModels.set(p, models);
    models.forEach((model, i) => {
      const active = i - 1 === (selected < 0 ? p.lit : selected);
      const surfaces = model.surfaces.map((s) => ({ s, points: s.points.map((v) => project(cam, ...v)) }));
      surfaces.sort(
        (a, b) =>
          a.points.reduce((n, v) => n + v[2] / a.points.length, 0) -
          b.points.reduce((n, v) => n + v[2] / b.points.length, 0),
      );
      for (const { s, points } of surfaces) {
        poly(ctx, points, s.face);
        if (s.face) {
          ctx.fillStyle = i === 0 ? ink.face() : mix('ground', 'inkFaint', 0.22 + shade(s.points) * 0.07);
          ctx.fill();
        }
        ctx.strokeStyle = active ? ink.signal(0.75) : ink.line(i === 0 ? 0.28 : 0.4);
        ctx.stroke();
      }
    });
    return selected >= 0 ? propName(p.items[selected]?.kind ?? 'paper') : 'rest';
  },
});
