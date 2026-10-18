import {
  BoxGeometry,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  LatheGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector2,
  type Material,
} from 'three';
import type { Vec3 } from './camera';
import { bodyOf, place, type Body, type District, type Part } from './city';
import { bridges, rotors, windows, type Lights } from './citylife';
import type { NightKey } from '../../styles/tokens/palette';
import { hexOf } from './ink';
import { COOLER, outlines } from './outlines';
import type { Rng } from './rng';
import { strip } from './transit';

/** three.js boards for city scenes: one district (`kit/city.ts`, `kit/islands.ts`) on a
 *  translucent PCB plate, its parts as instanced solids under wire outlines, its windows,
 *  wind rotors and teal power lines; and teal glass tubes (vias) that join boards, as one
 *  instanced batch. Everything here is built once; scenes move it each frame. */

const TEAL = new Color(hexOf('signal'));
const WHITE = new Color(hexOf('inkStrong'));
const DARK = new Color(hexOf('line3'));
const RIM = new Color(hexOf('line4'));

/** Segments in several inks drawn as one batch: each run keeps its own colour and opacity
 *  (per-vertex RGBA), so a board's lines cost one draw call. `add` returns the run's first
 *  vertex, for writing it again later. */
export class Pen {
  pos: number[] = [];
  col: number[] = [];
  add(p: readonly number[], key: NightKey, alpha: number): number {
    const at = this.pos.length / 3;
    const c = new Color(hexOf(key));
    this.pos.push(...p);
    for (let i = 0; i < p.length / 3; i++) this.col.push(c.r, c.g, c.b, alpha);
    return at;
  }
  lines(): LineSegments {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new Float32BufferAttribute(this.col, 4));
    return new LineSegments(g, new LineBasicMaterial({ vertexColors: true, transparent: true }));
  }
}

/** Write positions into a line batch from vertex `at` on. */
export function write(l: LineSegments, p: readonly number[], at = 0): void {
  const a = l.geometry.getAttribute('position');
  for (let i = 0; i < p.length / 3; i++) a.setXYZ(at + i, p[i * 3] ?? 0, p[i * 3 + 1] ?? 0, p[i * 3 + 2] ?? 0);
  a.needsUpdate = true;
}

/** A batch of line segments in one ink. */
export const lines = (p: readonly number[], key: NightKey, alpha: number): LineSegments => {
  const pen = new Pen();
  pen.add(p, key, alpha);
  return pen.lines();
};

/** A low-poly rock, the same octahedron kit/shells.ts outlines: waist low, top off-centre. */
function rockGeometry(): BufferGeometry {
  const v = [0.5, 0.3, 0, 0, 0.3, 0.5, -0.5, 0.3, 0, 0, 0.3, -0.5, 0.125, 1, -0.1, 0, 0, 0];
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(v, 3));
  g.setIndex([0, 4, 1, 1, 4, 2, 2, 4, 3, 3, 4, 0, 0, 1, 5, 1, 2, 5, 2, 3, 5, 3, 0, 5]);
  return g;
}

/** The unit solids every board's parts are scaled from, and the fill they share. */
export interface Solids {
  geo: Record<Exclude<Body, null>, BufferGeometry>;
  fill: Material;
}
export function solids(): Solids {
  return {
    geo: {
      box: new BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
      // Prisms turn a quarter so their corners sit where kit/shells.ts draws them.
      round: new CylinderGeometry(0.5, 0.5, 1, 12).rotateY(Math.PI / 2).translate(0, 0.5, 0),
      hex: new CylinderGeometry(0.5, 0.5, 1, 6).rotateY(Math.PI / 2).translate(0, 0.5, 0),
      tri: new CylinderGeometry(0.5, 0.5, 1, 3).rotateY(Math.PI / 2).translate(0, 0.5, 0),
      // A half-round hall lying along x, one unit high.
      hall: new CylinderGeometry(0.5, 0.5, 1, 8, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 2, 1),
      rock: rockGeometry(),
      cone: new ConeGeometry(0.5, 1, 7).translate(0, 0.5, 0),
      dome: new SphereGeometry(0.5, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 2, 1),
      cooler: new LatheGeometry(
        COOLER.map(([r, y]) => new Vector2(r, y)),
        16,
      ),
    },
    fill: new MeshBasicMaterial({
      color: hexOf('panel'),
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
      // Rotated parts and the hand-built rock turn some faces away; fill both sides.
      side: DoubleSide,
    }),
  };
}

export interface Board {
  group: Group;
  parts: Part[];
  lights: Lights;
  /** Every line on the board in one batch; windows and rotors are runs inside it. */
  ink: LineSegments;
  rimAt: number;
  windowsAt: number;
  rotorsAt: number;
  /** Teal lines in the board's own coordinates (power, skybridges, pipelines): flow runs along them. */
  wires: Vec3[][];
}

/** One district on a w × d plate. `bright` sets how strongly its outlines read (0..1). */
export function board(city: District, w: number, d: number, rng: Rng, kit: Solids, bright: number): Board {
  const group = new Group();
  const slab = new BoxGeometry(w, 0.025, d);
  const plate = new Mesh(
    slab,
    new MeshBasicMaterial({ color: hexOf('panel2'), transparent: true, opacity: 0.66, depthWrite: false }),
  );
  plate.position.y = -0.013;
  // Every solid on the board baked into one mesh: a board is a few draw calls, not dozens.
  const pos: number[] = [];
  const index: number[] = [];
  for (const p of city.parts) {
    const body = bodyOf(p.kind);
    if (!body) continue;
    const g = kit.geo[body];
    const v = g.getAttribute('position');
    const base = pos.length / 3;
    for (let i = 0; i < v.count; i++) pos.push(...place(p, v.getX(i) * p.w, v.getY(i) * p.h, v.getZ(i) * p.d));
    const ix = g.getIndex();
    for (let i = 0; i < (ix?.count ?? v.count); i++) index.push(base + (ix ? ix.getX(i) : i));
  }
  const solid = new BufferGeometry();
  solid.setAttribute('position', new Float32BufferAttribute(pos, 3));
  solid.setIndex(index);
  group.add(plate, new Mesh(solid, kit.fill));
  const lights = windows(city.parts, rng, 140);
  const wires = [...bridges(city.parts, rng), ...(city.pipes ?? [])];
  const pen = new Pen();
  const rimAt = pen.add(
    [...new EdgesGeometry(slab).translate(0, -0.013, 0).getAttribute('position').array],
    'line4',
    0.9,
  );
  pen.add(
    city.traces.flatMap(([a, b, c, e]) => [a, 0.002, b, c, 0.002, e]),
    'line4',
    0.75,
  );
  pen.add(outlines(city.parts), 'inkFaint', 0.5 + bright * 0.3);
  pen.add(wires.flatMap(strip), 'signal', 0.65);
  const windowsAt = pen.add(lights.pos, 'signal', 0.95);
  const rotorsAt = pen.add(rotors(city.parts, 0), 'inkSoft', 0.8);
  const ink = pen.lines();
  group.add(ink);
  return { group, parts: city.parts, lights, ink, rimAt, windowsAt, rotorsAt, wires };
}

/** Bring a board to time t: each window keeps its own slow rhythm, the rotors turn, and the
 *  rim lights teal while the board is `lit`. */
export function animate(b: Board, t: number, lit: boolean): void {
  const col = b.ink.geometry.getAttribute('color');
  const rim = lit ? TEAL : RIM;
  for (let i = 0; i < 24; i++) col.setXYZ(b.rimAt + i, rim.r, rim.g, rim.b);
  b.lights.phase.forEach((ph, i) => {
    const c = Math.sin(t * 0.7 + ph * 40) > -0.1 ? (b.lights.white[i] ? WHITE : TEAL) : DARK;
    for (const v of [0, 1]) col.setXYZ(b.windowsAt + i * 2 + v, c.r, c.g, c.b);
  });
  col.needsUpdate = true;
  if (b.parts.some((p) => p.kind === 'turbine')) write(b.ink, rotors(b.parts, t), b.rotorsAt);
}
