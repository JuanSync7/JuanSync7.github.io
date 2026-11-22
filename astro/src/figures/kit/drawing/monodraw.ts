// One source: the experience vault's Playbooks/drawing/kernel. A project's copy is synced from it, never edited.
import {
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Vector3,
  type Object3D,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { edgeModel, viewEdges } from './edges';
import { hexOf } from './host';
import { posOf, type Fill, type Lines, type Part, type Sketch, type Tier, type V3 } from './monoline';

/** Draws a `monoline.ts` sketch: plates merged per fill, lines merged per brightness, each
 *  moving set as its own group. Lines are the drawing kernel's fat lines, one CSS pixel wide at
 *  any pixel ratio, drawn after the plates (which are pushed back a hair) so a part's own outline
 *  is never lost in its face.
 *
 *  Working out the lines (each part's edges and silhouettes seen along `look`) and merging the
 *  plates is the cost; drawing the result is cheap. So it is split in two: `bake` turns a sketch
 *  into plain numbers, which a project can do once at its build and ship, and `drawBaked` draws
 *  them. `monodraw` is both, for a sketch drawn where it is made. */

const TIERS: Tier[] = ['edge', 'soft', 'faint', 'hot'];
const ALPHA: Record<Tier, number> = { edge: 0.9, soft: 0.5, faint: 0.22, hot: 1 };

type Own = (d: () => void) => void;
interface Mats {
  fill: Record<Exclude<Fill, 'none'>, MeshBasicMaterial>;
  line: Record<Tier, LineMaterial>;
}

export interface Drawing {
  root: Group;
  moving: Map<string, Group>;
  /** Sets the line width to one CSS pixel for a canvas of w × h CSS pixels at `dpr`. */
  fit: (w: number, h: number, dpr: number) => void;
  /** Flat signal discs, for marks that come and go in numbers (`grow`). */
  spots: (n: number) => InstancedMesh;
}

/** The ink at opacity `a` over the ground, as one solid colour (a host may give colours as
 *  '#rrggbb' or as numbers). */
function onGround(a: number): number {
  const num = (v: string | number): number => (typeof v === 'number' ? v : Number.parseInt(v.replace('#', ''), 16));
  const rgb = (n: number): number[] => [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const [g, i] = [rgb(num(hexOf('ground'))), rgb(num(hexOf('ink')))];
  const [r, gr, b] = g.map((v, k) => Math.round(v + ((i[k] ?? v) - v) * a));
  return ((r ?? 0) << 16) | ((gr ?? 0) << 8) | (b ?? 0);
}

function materials(own: Own): Mats {
  const plate = (key: 'ground' | 'signal'): MeshBasicMaterial =>
    new MeshBasicMaterial({
      color: hexOf(key),
      side: DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
  // Opaque, mixed down onto the ground: a translucent line doubles up where its segments meet.
  const line = (t: Tier): LineMaterial =>
    new LineMaterial({ color: t === 'hot' ? hexOf('signal') : onGround(ALPHA[t]) });
  const mats: Mats = {
    fill: { ground: plate('ground'), signal: plate('signal') },
    line: { edge: line('edge'), soft: line('soft'), faint: line('faint'), hot: line('hot') },
  };
  own(() => [...Object.values(mats.fill), ...Object.values(mats.line)].forEach((m) => m.dispose()));
  return mats;
}

/** A drawing's geometry as plain numbers: each fill's plates as triangle positions, each tier's
 *  lines as segment ends (x, y, z, x, y, z per segment). */
export interface Layer {
  fill: Partial<Record<Exclude<Fill, 'none'>, Float32Array>>;
  line: Partial<Record<Tier, Float32Array>>;
}

/** A whole drawing baked: what stands still, and each moving set about its pivot. */
export interface Baked {
  root: Layer;
  lives: { name: string; pivot: V3; layer: Layer }[];
}

function layerOf(parts: Part[], extra: Lines[], look: Vector3): Layer {
  const lines: Record<Tier, number[]> = { edge: [], soft: [], faint: [], hot: [] };
  for (const p of parts) {
    const plain = new BufferGeometry().setAttribute('position', posOf(p.geo));
    if (p.geo.index) plain.setIndex(p.geo.index);
    for (const v of viewEdges(edgeModel(plain), look)) lines[p.tier].push(v);
    plain.dispose();
  }
  for (const e of extra) for (const v of e.pts) lines[e.tier].push(v);
  const out: Layer = { fill: {}, line: {} };
  for (const fill of ['ground', 'signal'] as const) {
    const geos = parts
      .filter((p) => p.fill === fill)
      .map((p) => new BufferGeometry().setAttribute('position', posOf(p.geo.index ? p.geo.toNonIndexed() : p.geo)));
    if (!geos.length) continue;
    const merged = mergeGeometries(geos);
    geos.forEach((g) => g.dispose());
    out.fill[fill] = Float32Array.from(merged.getAttribute('position').array);
    merged.dispose();
  }
  parts.forEach((p) => p.geo.dispose());
  for (const t of TIERS) if (lines[t].length) out.line[t] = Float32Array.from(lines[t]);
  return out;
}

function objectsOf(l: Layer, mats: Mats, own: Own): Object3D[] {
  const out: Object3D[] = [];
  for (const fill of ['ground', 'signal'] as const) {
    const pos = l.fill[fill];
    if (!pos) continue;
    const g = new BufferGeometry().setAttribute('position', new BufferAttribute(pos, 3));
    own(() => g.dispose());
    out.push(new Mesh(g, mats.fill[fill]));
  }
  for (const t of TIERS) {
    const pos = l.line[t];
    if (!pos) continue;
    const g = new LineSegmentsGeometry().setPositions(pos);
    own(() => g.dispose());
    const line = new LineSegments2(g, mats.line[t]);
    line.renderOrder = 1;
    out.push(line);
  }
  return out;
}

/** `k` seen along `look`, as plain numbers: the costly half of drawing it. */
export function bake(k: Sketch, look: Vector3): Baked {
  return {
    root: layerOf(k.parts, k.lines, look),
    lives: k.lives.map((l) => ({ name: l.name, pivot: l.pivot, layer: layerOf(l.parts, l.lines, look) })),
  };
}

/** Draws a baked drawing: the cheap half. */
export function drawBaked(b: Baked, own: Own): Drawing {
  const mats = materials(own);
  const root = new Group();
  root.add(...objectsOf(b.root, mats, own));
  const moving = new Map<string, Group>();
  for (const l of b.lives) {
    const g = new Group();
    g.position.set(...l.pivot);
    g.add(...objectsOf(l.layer, mats, own));
    root.add(g);
    moving.set(l.name, g);
  }
  const fit = (w: number, h: number, dpr: number): void =>
    Object.values(mats.line).forEach((m) => {
      m.resolution.set(w * dpr, h * dpr);
      m.linewidth = dpr;
    });
  const spots = (n: number): InstancedMesh => {
    const disc = new CylinderGeometry(1, 1, 1, 16);
    own(() => disc.dispose());
    const mesh = new InstancedMesh(disc, mats.fill.signal, n);
    root.add(mesh);
    return mesh;
  };
  return { root, moving, fit, spots };
}

/** The finished drawing of `k` seen along `look`. */
export function monodraw(k: Sketch, look: Vector3, own: Own): Drawing {
  return drawBaked(bake(k, look), own);
}

/** Shows the first `u` (0..1) of every line in a moving group: a trace being drawn. */
export function reveal(g: Group, u: number): void {
  g.traverse((o) => {
    if (!(o instanceof LineSegments2)) return;
    const n = o.geometry.getAttribute('instanceStart')?.count ?? 0;
    o.geometry.instanceCount = Math.round(Math.max(0, Math.min(1, u)) * n);
  });
}
