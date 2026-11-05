import {
  BoxGeometry,
  CylinderGeometry,
  EdgesGeometry,
  Group,
  IcosahedronGeometry,
  LatheGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  TorusGeometry,
  Vector2,
  type BufferGeometry,
} from 'three';
import { defineTemplate } from '../defineTemplate';
import { defineThreeFigure } from '../defineThree';
import { camera, project, type Vec3 } from '../kit/camera';
import { box } from '../kit/draw';
import { hexOf, ink } from '../kit/ink';
import type { Pointer } from '../types';
import { between, type Rng } from '../kit/rng';
import { vessel as spriteVessel, plant, lamp, books, candle, type Sprite } from '../kit/sprites';

const KINDS = ['mug', 'vase', 'bottle', 'teapot', 'plant', 'lamp', 'books', 'candle', 'bowl'] as const;
type Kind = (typeof KINDS)[number];
// Enclose the entire object, including handles, spouts, foliage and lampshades, in any rotation.
const SIZE: Record<Kind, [number, number]> = {
  mug: [0.48, 0.6],
  vase: [0.36, 1.15],
  bottle: [0.28, 1.25],
  teapot: [0.69, 0.78],
  plant: [0.66, 1.5],
  lamp: [0.53, 1.48],
  books: [0.67, 0.48],
  candle: [0.27, 0.88],
  bowl: [0.45, 0.35],
};
const SPRITES = { plant, lamp, books, candle };
const GAP = 0.14;
const [W, D] = [5.8, 3.2];
interface Item {
  kind: Kind;
  x: number;
  z: number;
  s: number;
  turn: number;
  r: number;
  height: number;
  sprite: Sprite;
}
interface P {
  items: Item[];
  yaw: number;
  pitch: number;
  lit: number;
}
interface S {
  edges: LineBasicMaterial[][];
  faces: MeshBasicMaterial[][];
}

function view(p: P, w = 2, h = 1) {
  return camera({
    cx: w / 2,
    cy: h / 2,
    yaw: p.yaw,
    pitch: p.pitch,
    dist: 11.2,
    scale: h / (2 * Math.tan(Math.PI / 12) * 11.2),
  });
}
function closest(p: P, pointer: Pointer, w: number, h: number): number {
  let selected = -1,
    nearest = h * 0.28;
  if (pointer.active)
    p.items.forEach((it, i) => {
      const q = project(view(p, w, h), it.x, it.height / 2, it.z);
      const distance = Math.hypot(q[0] - pointer.x * w, q[1] - pointer.y * h);
      if (distance < nearest) {
        nearest = distance;
        selected = i;
      }
    });
  return selected;
}
function envelope(p: P, it: Item): number[] {
  const cam = view(p);
  const points = [-it.r, it.r].flatMap((x) =>
    [-it.r, it.r].flatMap((z) => [0, it.height].map((y) => project(cam, it.x + x, y, it.z + z))),
  );
  return [
    Math.min(...points.map((q) => q[0])),
    Math.min(...points.map((q) => q[1])),
    Math.max(...points.map((q) => q[0])),
    Math.max(...points.map((q) => q[1])),
  ];
}
const apart = (a: number[], b: number[]): boolean =>
  a[2] + 0.006 < b[0] || b[2] + 0.006 < a[0] || a[3] + 0.006 < b[1] || b[3] + 0.006 < a[1];

export function arrange(rng: Rng): P {
  const p: P = { items: [], yaw: between(rng, 0.25, 0.65), pitch: between(rng, 0.78, 0.98), lit: 0 };
  const count = 4 + Math.floor(rng() * 4);
  const occupied: number[][] = [];
  const kinds = KINDS.map((kind) => ({ kind, order: rng() })).sort((a, b) => a.order - b.order);
  for (const { kind } of kinds) {
    if (p.items.length === count) break;
    const s = between(rng, 0.7, 1);
    const [radius, height] = SIZE[kind];
    const r = radius * s;
    const sprite =
      kind === 'plant' || kind === 'lamp' || kind === 'books' || kind === 'candle'
        ? SPRITES[kind](rng)
        : spriteVessel(rng, kind === 'bowl' ? 'cup' : kind);
    for (let trial = 0; trial < 180; trial++) {
      const it: Item = {
        kind,
        sprite,
        s,
        r,
        height: height * s,
        turn: between(rng, -Math.PI, Math.PI),
        x: between(rng, -W / 2 + r + GAP, W / 2 - r - GAP),
        z: between(rng, -D / 2 + r + GAP, D / 2 - r - GAP),
      };
      if (p.items.some((q) => Math.hypot(it.x - q.x, it.z - q.z) < r + q.r + GAP)) continue;
      // Keep silhouettes separate from the chosen camera as well as the physical objects.
      const rect = envelope(p, it);
      if (occupied.some((q) => !apart(rect, q))) continue;
      p.items.push(it);
      occupied.push(rect);
      break;
    }
  }
  p.lit = Math.floor(rng() * p.items.length);
  return p;
}

function part(g: Group, geometry: BufferGeometry, at: Vec3, bright = false): Mesh {
  const mesh = new Mesh(
    geometry,
    new MeshBasicMaterial({
      color: hexOf(bright ? 'line4' : 'panel2'),
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    }),
  );
  mesh.position.set(...at);
  mesh.material.userData.bright = bright;
  const edge = new LineSegments(
    new EdgesGeometry(geometry, 28),
    new LineBasicMaterial({ color: hexOf('ink'), transparent: true, opacity: 0.5 }),
  );
  mesh.add(edge);
  g.add(mesh);
  return mesh;
}
function cylinder(g: Group, top: number, bottom: number, height: number, y: number, bright = false): Mesh {
  return part(g, new CylinderGeometry(top, bottom, height, 12), [0, y, 0], bright);
}
function vessel(g: Group, profile: [number, number][]): void {
  const points = profile.map(([x, y]) => new Vector2(x, y));
  part(g, new LatheGeometry(points, 16), [0, 0, 0], true);
}
function handle(g: Group, x: number, y: number, radius: number): void {
  part(g, new TorusGeometry(radius, 0.035, 6, 16), [x, y, 0]);
}
export function object(it: Item): Group {
  const g = new Group();
  if (it.kind === 'mug') {
    vessel(g, [
      [0, 0],
      [0.22, 0],
      [0.26, 0.52],
      [0.22, 0.52],
      [0.19, 0.07],
      [0, 0.07],
    ]);
    handle(g, 0.29, 0.3, 0.15);
    cylinder(g, 0.215, 0.215, 0.012, 0.43);
  } else if (it.kind === 'vase' || it.kind === 'bottle') {
    const bottle = it.kind === 'bottle';
    vessel(
      g,
      bottle
        ? [
            [0, 0],
            [0.23, 0],
            [0.23, 0.7],
            [0.1, 0.89],
            [0.1, 1.22],
            [0.07, 1.22],
            [0.07, 0.85],
          ]
        : [
            [0, 0],
            [0.18, 0],
            [0.32, 0.35],
            [0.3, 0.62],
            [0.13, 0.98],
            [0.18, 1.12],
            [0.14, 1.12],
            [0.09, 0.98],
          ],
    );
  } else if (it.kind === 'teapot') {
    vessel(g, [
      [0, 0],
      [0.22, 0],
      [0.35, 0.24],
      [0.32, 0.47],
      [0.18, 0.57],
      [0, 0.57],
    ]);
    cylinder(g, 0.11, 0.25, 0.07, 0.6, true);
    cylinder(g, 0.045, 0.055, 0.1, 0.68);
    handle(g, -0.4, 0.32, 0.2);
    const spout = part(g, new CylinderGeometry(0.055, 0.12, 0.46, 10), [0.43, 0.4, 0]);
    spout.rotation.z = -0.9;
  } else if (it.kind === 'plant') {
    cylinder(g, 0.28, 0.21, 0.4, 0.2, true);
    cylinder(g, 0.3, 0.3, 0.07, 0.39);
    cylinder(g, 0.024, 0.032, 0.85, 0.83);
    for (let k = 0; k < 7; k++) {
      const a = k * 2.4;
      const leaf = part(g, new IcosahedronGeometry(1, 0), [Math.cos(a) * 0.24, 0.65 + k * 0.1, Math.sin(a) * 0.24]);
      leaf.scale.set(0.31, 0.1, 0.14);
      leaf.rotation.set(0, -a, 0.45);
    }
  } else if (it.kind === 'lamp') {
    cylinder(g, 0.33, 0.36, 0.07, 0.035);
    cylinder(g, 0.035, 0.045, 0.95, 0.54);
    cylinder(g, 0.24, 0.5, 0.43, 1.2, true);
    cylinder(g, 0.12, 0.12, 0.06, 1.44);
  } else if (it.kind === 'books') {
    for (let k = 0; k < 3; k++) {
      const b = new Group();
      for (const y of [0.015, 0.135]) part(b, new BoxGeometry(0.94, 0.03, 0.61), [0, y, 0], true);
      part(b, new BoxGeometry(0.87, 0.09, 0.55), [0.015, 0.075, 0]);
      b.position.y = k * 0.15;
      b.rotation.y = (k - 1) * 0.15;
      g.add(b);
    }
  } else if (it.kind === 'candle') {
    cylinder(g, 0.26, 0.26, 0.05, 0.025);
    cylinder(g, 0.12, 0.13, 0.62, 0.36, true);
    cylinder(g, 0.012, 0.012, 0.07, 0.7);
    const flame = part(g, new IcosahedronGeometry(0.06, 0), [0, 0.79, 0], true);
    flame.scale.set(0.6, 1.5, 0.6);
  } else {
    vessel(g, [
      [0, 0],
      [0.15, 0],
      [0.31, 0.08],
      [0.44, 0.32],
      [0.4, 0.32],
      [0.27, 0.1],
      [0, 0.07],
    ]);
  }
  g.scale.setScalar(it.s);
  g.rotation.y = it.turn;
  g.position.set(it.x, 0, it.z);
  return g;
}

export default defineTemplate<P, S>({
  id: 'pixel-still',
  title: 'Tabletop still life',
  idea: 'A seeded three-dimensional tabletop of vessels, plants, lamps, books and candles, each given its own clear space; the pointer inspects one object at a time.',
  style: 'three',
  renderer: defineThreeFigure,
  motion: 'responsive',
  answers: true,
  aspect: 2,
  grammar: (rng) => arrange(rng),
  name: (p) => `${p.items.length} objects · ${p.items.map((it) => it.kind).join(', ')}`,
  alt: (p) =>
    `An angled 3D table holding ${p.items.map((it) => it.kind).join(', ')}, with clear space between every object and one outlined in teal.`,
  build: ({ scene, params: p }) => {
    const table = new Group();
    part(table, new BoxGeometry(W, 0.16, D), [0, -0.08, 0]);
    for (const x of [-W / 2 + 0.3, W / 2 - 0.3])
      for (const z of [-D / 2 + 0.3, D / 2 - 0.3]) part(table, new BoxGeometry(0.13, 1, 0.13), [x, -0.66, z]);
    const objects = p.items.map(object);
    const faces: MeshBasicMaterial[][] = objects.map(() => []);
    const edges = objects.map((g, i) => {
      const materials: LineBasicMaterial[] = [];
      g.traverse((o) => {
        if (o instanceof Mesh && o.material instanceof MeshBasicMaterial) faces[i]?.push(o.material);
        if (o instanceof LineSegments && o.material instanceof LineBasicMaterial) materials.push(o.material);
      });
      return materials;
    });
    scene.add(table, ...objects);
    return { edges, faces };
  },
  update: ({ camera: cam, pointer, hover, params: p, state: s, w, h }) => {
    const dist = 11.2 * Math.max(1, 2 / (w / h));
    cam.position.set(
      Math.sin(p.yaw) * Math.cos(p.pitch) * dist,
      Math.sin(p.pitch) * dist,
      Math.cos(p.yaw) * Math.cos(p.pitch) * dist,
    );
    cam.lookAt(0, 0, 0);
    cam.updateMatrixWorld();
    const selected = hover > 0.1 ? closest(p, pointer, w, h) : -1;
    s.faces.forEach((faces, i) =>
      faces.forEach((m) => m.color.set(hexOf(i === selected ? 'inkMuted' : m.userData.bright ? 'line4' : 'panel2'))),
    );
    s.edges.forEach((edges, i) =>
      edges.forEach((m) => {
        m.color.set(hexOf(i === (selected < 0 ? p.lit : selected) ? 'signal' : 'ink'));
        m.opacity =
          i === (selected < 0 ? p.lit : selected) ? (selected >= 0 ? 1 : 0.85) : 0.42 + (p.items[i]?.z ?? 0) * 0.06;
      }),
    );
    return selected >= 0 ? p.items[selected]?.kind : 'rest';
  },
  fallback: ({ ctx, w, h, pointer, params: p }) => {
    const cam = view(p, w, h);
    const tones = {
      top: ink.face(),
      left: ink.panel(),
      right: ink.ground(),
      edge: ink.line(0.45),
      crease: ink.line(0.2),
    };
    for (const x of [-W / 2 + 0.3, W / 2 - 0.3])
      for (const z of [-D / 2 + 0.3, D / 2 - 0.3])
        box(ctx, cam, x - 0.065, z - 0.065, x + 0.065, z + 0.065, -1.16, -0.16, tones);
    box(ctx, cam, -W / 2, -D / 2, W / 2, D / 2, -0.16, 0, tones);
    const selected = closest(p, pointer, w, h);
    const sorted = p.items
      .map((it, i) => ({ it, i }))
      .sort((a, b) => project(cam, a.it.x, 0, a.it.z)[2] - project(cam, b.it.x, 0, b.it.z)[2]);
    for (const { it, i } of sorted) {
      const q = project(cam, it.x, 0, it.z);
      const size =
        Math.min(it.r / (it.sprite.half + 1), (it.height * Math.cos(p.pitch)) / it.sprite.height) * cam.scale;
      for (const [x, y, role] of it.sprite.px) {
        ctx.fillStyle =
          role === 2 && i === (selected < 0 ? p.lit : selected)
            ? ink.signal(0.85)
            : role === 0
              ? ink.line(0.6)
              : ink.face();
        ctx.fillRect(q[0] + x * size, q[1] + y * size, Math.max(1, size), Math.max(1, size));
      }
    }
    return selected >= 0 ? p.items[selected]?.kind : 'rest';
  },
});
