import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  DoubleSide,
  Raycaster,
  Vector2,
} from 'three';
import { defineTemplate } from '../defineTemplate';
import { defineThreeFigure } from '../defineThree';
import { project, type Vec3 } from '../kit/camera';
import { poly } from '../kit/draw';
import { hexOf, ink, mix } from '../kit/ink';
import { solidMesh, tableFinish, type TableObject } from '../kit/tablemesh';
import {
  arrange,
  itemModel,
  propName,
  tableView,
  tabletop,
  TABLE_ASPECT,
  type TableItem,
  type TableScene,
} from '../kit/tabletop';
import type { PropModel } from '../kit/tableparts';
import type { Pointer } from '../types';

interface S {
  edges: { material: LineBasicMaterial; base: Color; opacity: number }[][];
  faces: { material: MeshStandardMaterial; base: Color }[][];
  marker: Mesh<PlaneGeometry, MeshBasicMaterial>;
  pickables: Mesh[];
  ray: Raycaster;
  at: Vector2;
}
function inside(points: readonly Vec3[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i],
      b = points[j];
    if (a && b && a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
}
/** Keep small accessories easy to locate without enlarging their physical models. */
function selection(it: TableItem): { x: number; z: number; w: number; d: number } {
  const { lo, hi } = it.bounds;
  return {
    x: (lo[0] + hi[0]) / 2,
    z: (lo[2] + hi[2]) / 2,
    w: Math.max(1.4, hi[0] - lo[0] + 0.24),
    d: Math.max(1.1, hi[2] - lo[2] + 0.24),
  };
}
function candidates(p: TableScene, pointer: Pointer, w: number, h: number) {
  if (!pointer.active) return [];
  return p.items
    .map((it, i) => {
      const { lo, hi } = it.bounds;
      const q = project(tableView(p, w, h), (lo[0] + hi[0]) / 2, hi[1] / 2, (lo[2] + hi[2]) / 2);
      return { i, q, distance: Math.hypot(q[0] - pointer.x * w, q[1] - pointer.y * h) };
    })
    .filter((it) => it.distance < h * 0.28)
    .sort((a, b) => a.distance - b.distance);
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
export const object = (it: TableItem): Group => solidMesh(itemModel(it), it.kind, 'work');
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
  aspect: TABLE_ASPECT,
  grammar: (rng) => arrange(rng),
  name: (p) => `${p.theme.name} · ${p.items.length} objects`,
  alt: (p) =>
    `A solid 3D ${p.theme.name.toLowerCase()} seen from eye height with ${p.items.map((it) => propName(it.kind)).join(', ')}, placed for their use with clear space between objects.`,
  build: ({ scene, params: p }) => {
    const models = p.items.map((it) => solidMesh(itemModel(it), it.kind, p.theme.id));
    const faces: S['faces'] = [],
      edges: S['edges'] = [];
    const pickables: Mesh[] = [];
    for (const [i, model] of models.entries()) {
      const f: S['faces'][number] = [],
        e: S['edges'][number] = [];
      model.traverse((o) => {
        if (o instanceof Mesh && o.material instanceof MeshStandardMaterial) {
          f.push({ material: o.material, base: o.material.color.clone() });
          o.userData.item = i;
          pickables.push(o);
        }
        if (o instanceof LineSegments && o.material instanceof LineBasicMaterial)
          e.push({ material: o.material, base: o.material.color.clone(), opacity: o.material.opacity });
      });
      faces.push(f);
      edges.push(e);
    }
    const marker = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({
        color: hexOf('signal'),
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        side: DoubleSide,
      }),
    );
    marker.rotation.x = -Math.PI / 2;
    marker.visible = false;
    const key = new DirectionalLight(hexOf('inkStrong'), 2.4);
    key.position.set(-3, 7, 6);
    const fill = new DirectionalLight(hexOf('inkStrong'), 0.7);
    fill.position.set(5, 4, -4);
    const furniture = solidMesh(tabletop(p), 'table', p.theme.id);
    furniture.traverse((o) => {
      if (o instanceof Mesh) {
        o.userData.item = -1;
        pickables.push(o);
      }
    });
    scene.add(
      new HemisphereLight(hexOf('inkStrong'), hexOf('ground'), 1.7),
      new AmbientLight(hexOf('inkStrong'), 0.3),
      key,
      fill,
      furniture,
      marker,
      ...models,
    );
    scene.updateMatrixWorld(true);
    return { faces, edges, marker, pickables, ray: new Raycaster(), at: new Vector2() };
  },
  update: ({ camera, params: p, state: s, w, h, pointer, hover }) => {
    const view = tableView(p, w, h),
      { dist, pitch } = view;
    camera.position.set(
      Math.sin(p.yaw) * Math.cos(pitch) * dist,
      Math.sin(pitch) * dist,
      Math.cos(p.yaw) * Math.cos(pitch) * dist,
    );
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    let selected = -1;
    if (hover > 0.1 && pointer.active) {
      const pick = (x: number, y: number): number => {
        s.at.set(x * 2 - 1, 1 - y * 2);
        s.ray.setFromCamera(s.at, camera);
        const hit = s.ray.intersectObjects(s.pickables, false)[0];
        return hit && typeof hit.object.userData.item === 'number' ? hit.object.userData.item : -1;
      };
      selected = pick(pointer.x, pointer.y);
      if (selected < 0)
        for (const candidate of candidates(p, pointer, w, h)) {
          if (pick(candidate.q[0] / w, candidate.q[1] / h) === candidate.i) {
            selected = candidate.i;
            break;
          }
        }
    }
    const item = p.items[selected];
    s.marker.visible = Boolean(item);
    if (item) {
      const m = selection(item);
      s.marker.position.set(m.x, 0.008, m.z);
      s.marker.scale.set(m.w, m.d, 1);
    }
    s.faces.forEach((faces, i) =>
      faces.forEach(({ material, base }) => {
        material.color.copy(base);
        if (i === selected) material.color.lerp(new Color(hexOf('inkStrong')), 0.95);
        else if (selected < 0 && i === p.lit) material.color.lerp(new Color(hexOf('signal')), 0.7);
      }),
    );
    s.edges.forEach((edges, i) =>
      edges.forEach(({ material, base, opacity }) => {
        const active = i === (selected < 0 ? p.lit : selected);
        material.color.copy(base);
        if (active) material.color.set(hexOf('signal'));
        material.opacity = active ? 0.9 : opacity;
      }),
    );
    return selected >= 0 ? propName(p.items[selected]?.kind ?? 'paper') : 'rest';
  },
  fallback: ({ ctx, w, h, pointer, params: p }) => {
    const cam = tableView(p, w, h);
    let selected = -1;
    const models = flatModels.get(p) ?? [tabletop(p), ...p.items.map(itemModel)];
    flatModels.set(p, models);
    const surfaces = models.flatMap((model, index) =>
      model.surfaces.map((surface) => ({
        surface,
        index,
        points: surface.points.map((v) => project(cam, ...v)),
      })),
    );
    surfaces.sort(
      (a, b) =>
        // All props sit above the top and in front of the rear furniture. A single
        // depth for a broad tabletop would incorrectly paint over its rear props.
        Number(a.index > 0) - Number(b.index > 0) ||
        a.points.reduce((n, v) => n + v[2] / a.points.length, 0) -
          b.points.reduce((n, v) => n + v[2] / b.points.length, 0),
    );
    if (pointer.active) {
      const pick = (x: number, y: number): number =>
        (surfaces.findLast((s) => s.surface.face && inside(s.points, x, y))?.index ?? 0) - 1;
      selected = pick(pointer.x * w, pointer.y * h);
      if (selected < 0)
        for (const candidate of candidates(p, pointer, w, h)) {
          if (pick(candidate.q[0], candidate.q[1]) === candidate.i) {
            selected = candidate.i;
            break;
          }
        }
    }
    for (const { surface, index, points } of surfaces) {
      const kind: TableObject = index === 0 ? 'table' : (p.items[index - 1]?.kind ?? 'paper');
      const active = index - 1 === (selected < 0 ? p.lit : selected);
      const finish = tableFinish(kind, surface.solid, p.theme.id);
      poly(ctx, points, surface.face);
      if (surface.face) {
        ctx.fillStyle = active
          ? mix('signalLine', 'signal', 0.5 + shade(surface.points) * 0.2)
          : mix('ground', finish.tone, 0.5 + shade(surface.points) * 0.2);
        ctx.fill();
      } else {
        ctx.strokeStyle = active ? ink.signal(0.85) : kind === 'table' ? ink.faint(0.25) : ink.line(0.5);
        ctx.stroke();
      }
    }
    return selected >= 0 ? propName(p.items[selected]?.kind ?? 'paper') : 'rest';
  },
});
