// One source: the experience vault's Playbooks/drawing/kernel. A project's copy is synced from it, never edited.
import {
  Box3,
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Matrix4,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import type { OBB } from 'three/examples/jsm/math/OBB.js';
import { clashesOf, oriented } from './clash';

/** A "3D isometric hidden-line drawing, monoline" of a whole scene, one line width throughout
 *  (drawn by `monodraw.ts`).
 *  Every solid is a plate in the ground colour and its lines are the drawing kernel's: the hard
 *  edges, plus the silhouette for the one direction the scene is seen from. So a flask is drawn
 *  by its outline and its rim, never by its facets, and the depth buffer hides whatever stands
 *  behind it. Glass is a solid with no plate.
 *
 *  This file is the pen: parts in a stack of frames, grouped into named objects, and a check that
 *  no part of one object stands inside a part of another (`clashes`). */

export type V3 = [number, number, number];
export type Fill = 'ground' | 'signal' | 'none';
/** Line brightness: outlines, detail, what recedes, and the signal. */
export type Tier = 'edge' | 'soft' | 'faint' | 'hot';
export interface Ink {
  fill?: Fill;
  tier?: Tier;
}
export interface Part {
  geo: BufferGeometry;
  fill: Fill;
  tier: Tier;
  obj: string;
  /** The part's own box, turned with it: what `clashes` tests. */
  obb: OBB;
}
export interface Lines {
  pts: number[];
  tier: Tier;
}
export interface Live {
  name: string;
  pivot: V3;
  parts: Part[];
  lines: Lines[];
}

export { posOf } from './clash';

export class Sketch {
  readonly parts: Part[] = [];
  readonly lines: Lines[] = [];
  readonly lives: Live[] = [];
  private live: Live | null = null;
  private stack: Matrix4[] = [new Matrix4()];
  private obj = 'scene';

  private get m(): Matrix4 {
    return this.stack[this.stack.length - 1] ?? new Matrix4();
  }

  /** Everything drawn inside `draw` belongs to the object `name` (for the clash check). */
  object(name: string, draw: () => void): void {
    const was = this.obj;
    this.obj = name;
    draw();
    this.obj = was;
  }

  /** Draws in a frame moved by `m` (applied after the current one). */
  frame(m: Matrix4, draw: () => void): void {
    this.stack.push(this.m.clone().multiply(m));
    draw();
    this.stack.pop();
  }

  /** A frame at `at`, turned `yaw` about the vertical, then tipped by `pitch` (x) and `roll` (z). */
  at(at: V3, yaw: number, draw: () => void, pitch = 0, roll = 0): void {
    const m = new Matrix4().makeTranslation(...at);
    m.multiply(new Matrix4().makeRotationY(yaw));
    m.multiply(new Matrix4().makeRotationX(pitch));
    m.multiply(new Matrix4().makeRotationZ(roll));
    this.frame(m, draw);
  }

  /** Parts that move: drawn about `pivot`, kept apart, and handed back as their own group. */
  moving(name: string, pivot: V3, draw: () => void): void {
    const live: Live = { name, pivot, parts: [], lines: [] };
    this.lives.push(live);
    this.live = live;
    this.stack.push(new Matrix4());
    this.object(name, draw);
    this.stack.pop();
    this.live = null;
  }

  mesh(geo: BufferGeometry, ink: Ink = {}): void {
    geo.computeBoundingBox();
    const obb = oriented(geo.boundingBox ?? new Box3(), this.m);
    geo.applyMatrix4(this.m);
    const part = {
      geo,
      fill: ink.fill ?? 'ground',
      tier: ink.tier ?? 'edge',
      obj: this.obj,
      obb,
    };
    (this.live ? this.live.parts : this.parts).push(part);
  }

  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, ink?: Ink): void {
    const g = new BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    this.mesh(g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ink);
  }

  /** An upright cylinder (a cone, with `r2` at the top) standing on (x, y, z). */
  cyl(x: number, y: number, z: number, r: number, h: number, ink?: Ink & { r2?: number; n?: number }): void {
    const g = new CylinderGeometry(ink?.r2 ?? r, r, h, ink?.n ?? 24);
    this.mesh(g.translate(x, y + h / 2, z), ink);
  }

  /** A solid of revolution about the vertical through (x, y, z): profile points [radius, height]. */
  lathe(x: number, y: number, z: number, profile: [number, number][], ink?: Ink & { n?: number }): void {
    const g = new LatheGeometry(
      profile.map(([r, h]) => new Vector2(r, h)),
      ink?.n ?? 28,
    );
    this.mesh(g.translate(x, y, z), ink);
  }

  ball(x: number, y: number, z: number, r: number, ink?: Ink): void {
    this.mesh(new SphereGeometry(r, 24, 14).translate(x, y, z), ink);
  }

  /** A ring of tube in the x-y plane of the current frame. */
  torus(x: number, y: number, z: number, R: number, r: number, ink?: Ink): void {
    this.mesh(new TorusGeometry(R, r, 10, 40).translate(x, y, z), ink);
  }

  /** A round tube through points, smoothed unless `sharp`. */
  tube(pts: V3[], r: number, ink?: Ink & { sharp?: boolean }): void {
    const v = pts.map((p) => new Vector3(...p));
    const curve = ink?.sharp ? new CatmullRomCurve3(v, false, 'catmullrom', 0) : new CatmullRomCurve3(v);
    this.mesh(new TubeGeometry(curve, Math.max(8, pts.length * 10), r, 16), ink);
  }

  /** A flat outline (x, y) pulled along z from z0 to z1. */
  slab(outline: [number, number][], z0: number, z1: number, ink?: Ink): void {
    const s = new Shape(outline.map(([x, y]) => new Vector2(x, y)));
    const g = new ExtrudeGeometry(s, {
      depth: z1 - z0,
      bevelEnabled: false,
      curveSegments: 12,
    });
    this.mesh(g.translate(0, 0, z0), ink);
  }

  /** A line with no solid: detail drawn on a surface (place it a hair proud of it). */
  line(pts: V3[], tier: Tier = 'soft'): void {
    const out: number[] = [];
    const a = new Vector3();
    for (let i = 1; i < pts.length; i++)
      for (const p of [pts[i - 1], pts[i]])
        if (p)
          out.push(
            ...a
              .set(...p)
              .applyMatrix4(this.m)
              .toArray(),
          );
    (this.live ? this.live.lines : this.lines).push({ pts: out, tier });
  }

  /** A circle of line about `c`, in the plane normal to `axis`. */
  circle(c: V3, r: number, axis: 'x' | 'y' | 'z', tier: Tier = 'soft', n = 32): void {
    const pts: V3[] = [];
    for (let i = 0; i <= n; i++) {
      const [u, v] = [Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r];
      pts.push(
        axis === 'x'
          ? [c[0], c[1] + u, c[2] + v]
          : axis === 'y'
            ? [c[0] + u, c[1], c[2] + v]
            : [c[0] + u, c[1] + v, c[2]],
      );
    }
    this.line(pts, tier);
  }

  /** A rectangle of line in the plane normal to `axis`, at `at` on it: (a, b) are the other two
   *  axes in order (y, z for x; x, z for y; x, y for z). */
  rect(axis: 'x' | 'y' | 'z', at: number, a0: number, b0: number, a1: number, b1: number, tier: Tier = 'soft'): void {
    const p = (a: number, b: number): V3 => (axis === 'x' ? [at, a, b] : axis === 'y' ? [a, at, b] : [a, b, at]);
    this.line([p(a0, b0), p(a1, b0), p(a1, b1), p(a0, b1), p(a0, b0)], tier);
  }

  /** Every pair of objects with a part standing in the other's by more than `tol` (clash.ts). */
  clashes(tol = 0.002): string[] {
    return clashesOf(this.parts, this.lives, tol);
  }
}
