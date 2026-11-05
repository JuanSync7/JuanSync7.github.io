import { camera, project, type Camera } from './camera';
import { between, mulberry32, pick, type Rng } from './rng';
import { prop, type PropKind } from './tableprops';
import { corners, finish, TableDraft, world, type Bounds, type PropModel } from './tableparts';
import { recipe, THEMES, type Intent, type TableTheme, type ThemeId } from './tablethemes';

export interface TableItem {
  kind: PropKind;
  role: string;
  x: number;
  z: number;
  s: number;
  turn: number;
  required: boolean;
  zone: readonly [number, number, number, number];
  bounds: Bounds;
}
export interface TableScene {
  theme: TableTheme;
  items: TableItem[];
  yaw: number;
  pitch: number;
  dist: number;
  lit: number;
  mirror: number;
}
export const GAP = 0.075;
export function tableView(p: TableScene, w = 2, h = 1): Camera {
  const dist = p.dist * Math.max(1, (2 * h) / w);
  return camera({
    cx: w / 2,
    cy: h / 2,
    yaw: p.yaw,
    pitch: p.pitch,
    dist,
    scale: h / (2 * Math.tan(Math.PI / 12) * dist),
  });
}
export function footprint(kind: PropKind, x: number, z: number, s: number, turn: number): Bounds {
  const points = corners(prop(kind).bounds).map((v) => world(v, x, z, s, turn));
  return {
    lo: [Math.min(...points.map((v) => v[0])), 0, Math.min(...points.map((v) => v[2]))],
    hi: [
      Math.max(...points.map((v) => v[0])),
      Math.max(...points.map((v) => v[1])),
      Math.max(...points.map((v) => v[2])),
    ],
  };
}
export function projected(p: TableScene, b: Bounds): number[] {
  const points = corners(b).map((v) => project(tableView(p), ...v));
  return [
    Math.min(...points.map((v) => v[0])),
    Math.min(...points.map((v) => v[1])),
    Math.max(...points.map((v) => v[0])),
    Math.max(...points.map((v) => v[1])),
  ];
}
export const apart = (a: readonly number[], b: readonly number[], gap = 0): boolean =>
  a[2] + gap < b[0] || b[2] + gap < a[0] || a[3] + gap < b[1] || b[3] + gap < a[1];
const flat = (b: Bounds): number[] => [b.lo[0], b.lo[2], b.hi[0], b.hi[2]];
function place(p: TableScene, intent: Intent, rng: Rng): boolean {
  const { kind, x, z, jitter, angle, scale: s } = intent;
  for (let k = 0; k < 100; k++) {
    const px = x + between(rng, -jitter, jitter),
      pz = z + between(rng, -jitter, jitter),
      turn = between(rng, -angle, angle);
    const bounds = footprint(kind, px, pz, s, turn);
    if (
      bounds.lo[0] < -p.theme.w / 2 + GAP ||
      bounds.hi[0] > p.theme.w / 2 - GAP ||
      bounds.lo[2] < -p.theme.d / 2 + GAP ||
      bounds.hi[2] > p.theme.d / 2 - GAP
    )
      continue;
    const rect = projected(p, bounds);
    if (
      p.items.some((it) => !apart(flat(bounds), flat(it.bounds), GAP) || !apart(rect, projected(p, it.bounds), 0.0025))
    )
      continue;
    p.items.push({
      kind,
      x: px,
      z: pz,
      s,
      turn,
      role: intent.role,
      required: intent.required,
      zone: [x - jitter, z - jitter, x + jitter, z + jitter],
      bounds,
    });
    return true;
  }
  return false;
}
export function tabletop(p: TableScene): PropModel {
  const q = new TableDraft(),
    { w, d, base } = p.theme;
  const leg = base === 'bar' ? 1.4 : 1.05;
  q.box(0, -0.16, 0, w, 0.16, d, base === 'steel' ? 0.025 : 0.07);
  if (base === 'storage' || base === 'desk') {
    for (const x of base === 'storage' ? [-w / 2 + 0.65, w / 2 - 0.65] : [-w / 2 + 0.65]) {
      q.box(x, -leg, 0, 0.95, leg - 0.16, d - 0.7, 0.025);
      for (const y of [-0.4, -0.7, -1]) {
        q.line([
          [x - 0.44, y, d / 2 - 0.345],
          [x + 0.44, y, d / 2 - 0.345],
        ]);
        q.box(x, y + 0.07, d / 2 - 0.32, 0.28, 0.035, 0.04, 0.01);
      }
    }
  }
  for (const x of [-w / 2 + 0.27, w / 2 - 0.27])
    for (const z of [-d / 2 + 0.27, d / 2 - 0.27]) {
      if (base === 'bar' || base === 'steel') q.cylinder(x, -leg, z, 0.065, leg - 0.16, 8);
      else q.box(x, -leg, z, 0.12, leg - 0.16, 0.12, 0.01);
    }
  if (base === 'steel') for (const z of [-d / 2 + 0.27, d / 2 - 0.27]) q.box(0, -0.82, z, w - 0.54, 0.055, 0.055, 0);
  if (base === 'kitchen') {
    q.box(0, 0, -d / 2 + 0.08, w, 0.18, 0.16, 0.02);
    q.box(0, -0.85, 0, w - 0.7, 0.08, d - 0.7, 0.02);
  }
  if (base === 'bar') q.box(0, -0.95, d / 2 - 0.26, w - 0.54, 0.055, 0.055, 0);
  return finish(q);
}
function compose(rng: Rng, theme: TableTheme): TableScene | null {
  const mirror = rng() < 0.5 ? -1 : 1;
  for (let attempt = 0; attempt < 24; attempt++) {
    const p: TableScene = {
      theme,
      items: [],
      yaw: between(rng, 0.35, 0.55),
      pitch: between(rng, 0.8, 0.95),
      dist: 14,
      lit: 0,
      mirror,
    };
    const intents = recipe(theme.id, rng, mirror);
    let valid = true;
    for (const intent of intents.filter((i) => i.required))
      if (!place(p, intent, rng)) {
        valid = false;
        break;
      }
    if (!valid) continue;
    for (const intent of intents.filter((i) => !i.required)) place(p, intent, rng);
    // Fit the table's feet and every prop, not just the tabletop.
    const boxes = [tabletop(p).bounds, ...p.items.map((i) => i.bounds)];
    p.dist = 11;
    while (
      p.dist < 20 &&
      boxes.some((b) => {
        const r = projected(p, b);
        return r[0] < 0.1 || r[2] > 1.9 || r[1] < 0.06 || r[3] > 0.94;
      })
    )
      p.dist += 0.25;
    // A fitted distance changes perspective: validate the silhouettes again.
    if (
      p.items.some((it, i) =>
        p.items.slice(0, i).some((q) => !apart(projected(p, it.bounds), projected(p, q.bounds), 0.001)),
      )
    )
      continue;
    p.lit = Math.floor(rng() * p.items.length);
    return p;
  }
  return null;
}
export function arrange(rng: Rng, chosen?: ThemeId): TableScene {
  const theme = chosen ? (THEMES.find((t) => t.id === chosen) ?? THEMES[0]) : pick(rng, THEMES);
  // An unlucky random stream falls back to a tested composition of the same theme.
  const result = compose(rng, theme) ?? compose(mulberry32(0), theme);
  if (!result) throw new Error(`Invalid canonical layout for ${theme.name}`);
  return result;
}
export function itemModel(it: TableItem): PropModel {
  return {
    bounds: it.bounds,
    surfaces: prop(it.kind).surfaces.map((s) => ({
      ...s,
      points: s.points.map((v) => world(v, it.x, it.z, it.s, it.turn)),
    })),
  };
}
export { THEMES } from './tablethemes';
export { propName } from './tableprops';
