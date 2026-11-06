import { camera, project, type Camera } from './camera';
import { between, mulberry32, pick, type Rng } from './rng';
import { prop, type PropKind } from './tableprops';
import { corners, world, type Bounds, type PropModel } from './tableparts';
import { THEMES, TABLE_ASPECT, type Intent, type TableTheme, type ThemeId } from './tablethemes';
import { recipe } from './tablerecipes';
import { tableModel, surfaceContains } from './tableframes';

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
  eye: number;
  dist: number;
  lit: number;
  mirror: number;
  roomVariant: number;
}
export const GAP = 0.075;
export function tableView(p: TableScene, w = TABLE_ASPECT, h = 1): Camera {
  const dist = p.dist * Math.max(1, (TABLE_ASPECT * h) / w);
  return camera({
    cx: w / 2,
    cy: h / 2,
    yaw: p.yaw,
    pitch: Math.asin(p.eye / dist),
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
    if (!surfaceContains(p.theme, bounds)) continue;
    // A lower viewpoint permits natural occlusion; the solids still cannot touch.
    if (p.items.some((it) => !apart(flat(bounds), flat(it.bounds), GAP))) continue;
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
export const tabletop = (p: TableScene): PropModel => tableModel(p.theme);
function compose(rng: Rng, theme: TableTheme): TableScene | null {
  const mirror = rng() < 0.5 ? -1 : 1;
  for (let attempt = 0; attempt < 24; attempt++) {
    const p: TableScene = {
      theme,
      items: [],
      yaw: between(rng, 0.16, 0.3),
      eye: between(rng, 2.1, 2.45),
      dist: 14,
      lit: 0,
      mirror,
      roomVariant: 0,
    };
    const intents = recipe(theme.id, rng, mirror);
    let valid = true;
    for (const intent of intents.filter((i) => i.required))
      if (!place(p, intent, rng)) {
        valid = false;
        break;
      }
    if (!valid) continue;
    const optional = intents
      .filter((i) => !i.required)
      .map((intent) => ({ intent, order: rng() }))
      .sort((a, b) => a.order - b.order);
    for (const { intent } of optional) {
      if (p.items.length >= theme.targetItems) break;
      place(p, intent, rng);
    }
    if (p.items.length < theme.minItems) continue;
    // Fit the table's feet and every prop, not just the tabletop.
    const boxes = [tabletop(p).bounds, ...p.items.map((i) => i.bounds)];
    p.dist = 11;
    while (
      p.dist < 20 &&
      boxes.some((b) => {
        const r = projected(p, b);
        return r[0] < TABLE_ASPECT * 0.05 || r[2] > TABLE_ASPECT * 0.95 || r[1] < 0.06 || r[3] > 0.94;
      })
    )
      p.dist += 0.25;
    const highlights = p.items.map((it, i) => ({ it, i })).filter(({ it }) => it.z > 0 && it.bounds.hi[1] > 0.2);
    p.lit = highlights.length
      ? (highlights[Math.floor(rng() * highlights.length)]?.i ?? 0)
      : Math.floor(rng() * p.items.length);
    p.roomVariant = Math.floor(rng() * 3);
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
export { THEMES, TABLE_ASPECT } from './tablethemes';
export { propName } from './tableprops';
