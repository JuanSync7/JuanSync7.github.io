import { BoxGeometry, BufferGeometry, EdgesGeometry, Float32BufferAttribute, Group, InstancedMesh, LineBasicMaterial, LineSegments, Matrix4, Mesh, MeshBasicMaterial } from 'three';
import { defineThreeFigure } from './defineThree';
import { isometric, type Vec3 } from './kit/camera';
import { box } from './kit/draw';
import { hexOf, ink, mix } from './kit/ink';
import { clamp, follow } from './kit/motion';
import type { Rng } from './kit/rng';
import { along } from './kit/shapes';

/** The platform as a city built in levels. The undercity is silicon: rows of standard cells
 *  and two memory macros. Above it, racks of compute; a walled gateway with four gates; a
 *  knowledge district round a plaza; a skyline of apps; and on the roof, people walking.
 *  Vias join the levels, traffic runs up and down them, and one request (the signal) walks
 *  from a person down through every level to the silicon and back. The pointer's height
 *  lifts a level out and the read-out names it; at rest the request is the only lit thing. */

const LEVELS = ['silicon · undercity', 'compute · models', 'gateway · identity', 'core · knowledge', 'surfaces · apps', 'people · overcity'];
const W = 2.5;
const D = 1.5;
const GAP = 0.5;
const PEOPLE = 48;
const TRAFFIC = 16;

type B = [x: number, z: number, w: number, d: number, h: number];
interface Via { x: number; z: number; lo: number; hi: number }
interface Level { group: Group; edge: LineBasicMaterial; lift: number }
interface Walker { x: number; z: number; along: boolean; v: number }
interface State {
  levels: Level[]; vias: Via[]; route: Via[]; walkers: Walker[]; traffic: { via: number; phase: number; up: boolean }[];
  wires: LineSegments; motes: LineSegments; path: LineSegments; packet: Mesh; yaw: number;
}

/** Each level's buildings, by the rules of what lives there. */
function district(k: number, rng: Rng): B[] {
  const r = (a: number, b: number): number => a + rng() * (b - a);
  const out: B[] = [];
  if (k === 0) {
    const macros: B[] = [[0.72, -0.34, 0.6, 0.36, 0.06], [-0.68, 0.36, 0.52, 0.34, 0.06]];
    const inMacro = (x: number, z: number): boolean => macros.some(([mx, mz, mw, md]) => Math.abs(x - mx) < mw / 2 + 0.03 && Math.abs(z - mz) < md / 2 + 0.03);
    out.push(...macros);
    for (let z = -0.66; z <= 0.66; z += 0.088) {
      for (let x = -1.18; x < 1.16; ) {
        const w = r(0.04, 0.12);
        if (!inMacro(x + w / 2, z)) out.push([x + w / 2, z, w * 0.82, 0.058, r(0.012, 0.03)]);
        x += w;
      }
    }
  } else if (k === 1) {
    for (let z = -0.56; z <= 0.57; z += 0.28) for (let x = -1.05; x <= 1.06; x += 0.15) if (rng() > 0.12) out.push([x, z, 0.1, 0.16, r(0.12, 0.24)]);
  } else if (k === 2) {
    for (let a = 0; a < 40; a++) if (a % 10 !== 5) out.push([Math.cos((a / 40) * Math.PI * 2) * 0.92, Math.sin((a / 40) * Math.PI * 2) * 0.52, 0.1, 0.1, 0.07]);
    out.push([0, 0, 0.16, 0.16, 0.32], [0.26, 0.1, 0.08, 0.08, 0.14], [-0.24, -0.12, 0.08, 0.08, 0.1]);
  } else if (k === 3) {
    for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) if (Math.abs(i) > 1 || Math.abs(j) > 1) out.push([i * 0.32, j * 0.27, r(0.14, 0.22), r(0.12, 0.19), r(0.05, 0.2)]);
  } else if (k === 4) {
    for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) if (rng() > 0.3) out.push([i * 0.33 + r(-0.05, 0.05), j * 0.27 + r(-0.04, 0.04), r(0.08, 0.17), r(0.08, 0.16), rng() > 0.85 ? r(0.3, 0.38) : r(0.05, 0.17)]);
  }
  return out;
}

/** The twelve edges of every building, as one set of line segments. */
function outlines(bs: B[]): BufferGeometry {
  const p: number[] = [];
  for (const [x, z, w, d, h] of bs) {
    const [x0, x1, z0, z1] = [x - w / 2, x + w / 2, z - d / 2, z + d / 2];
    for (const y of [0, h]) p.push(x0, y, z0, x1, y, z0, x1, y, z0, x1, y, z1, x1, y, z1, x0, y, z1, x0, y, z1, x0, y, z0);
    for (const [cx, cz] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]] as const) p.push(cx, 0, cz, cx, h, cz);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(p, 3));
  return g;
}

/** Line segments whose points are rewritten every frame (vias, walkers, the request's trail). */
function dynamic(n: number, key: 'signal' | 'inkMuted', opacity: number): LineSegments {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(new Float32Array(n * 6), 3));
  return new LineSegments(g, new LineBasicMaterial({ color: hexOf(key), transparent: true, opacity }));
}

function write(seg: LineSegments, pts: number[]): void {
  const a = seg.geometry.getAttribute('position');
  (a.array as Float32Array).fill(0).set(pts.slice(0, a.array.length));
  a.needsUpdate = true;
}

const pickOf = (y: number): number => clamp(Math.floor((1 - y) * LEVELS.length), 0, LEVELS.length - 1);

export default defineThreeFigure<State>({
  id: 'system-stack',
  title: 'System stack',
  alt: 'Six translucent plates stacked like the levels of a city: a silicon undercity of cell rows and memory blocks, racks of compute, a walled gateway, a knowledge district round a plaza, a skyline of apps, and people walking on the roof. Thin vias join the levels with traffic running along them, and one teal request travels down through every level and back.',
  idea: 'The platform as a layered city, from the silicon undercity to the people on the roof: vias carry traffic between levels and one request makes the whole round trip, so the stack reads as one working system.',
  motion: 'ambient',
  answers: true,
  group: 'hero',
  seed: 2026,
  aspect: 1,
  build: ({ scene, rng }) => {
    const levels: Level[] = LEVELS.map((_, k) => {
      const group = new Group();
      const slab = new BoxGeometry(W, 0.025, D);
      const plate = new Mesh(slab, new MeshBasicMaterial({ color: hexOf('panel2'), transparent: true, opacity: 0.62, depthWrite: false }));
      plate.position.y = -0.013;
      const edge = new LineBasicMaterial({ color: hexOf('line4'), transparent: true, opacity: 0.9 });
      const rim = new LineSegments(new EdgesGeometry(slab), edge);
      rim.position.y = -0.013;
      group.add(plate, rim);
      const bs = district(k, rng);
      if (bs.length) {
        // Solid dark bodies hide what stands behind them; the outlines carry the drawing.
        const body = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: hexOf('panel'), polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }), bs.length);
        const m = new Matrix4();
        bs.forEach(([x, z, w, d, h], i) => body.setMatrixAt(i, m.makeScale(w, h, d).setPosition(x, h / 2, z)));
        group.add(body, new LineSegments(outlines(bs), new LineBasicMaterial({ color: hexOf('inkFaint'), transparent: true, opacity: 0.5 + k * 0.04 })));
      }
      scene.add(group);
      return { group, edge, lift: 0 };
    });
    // One via per gap carries the request; the rest carry traffic, some through two levels.
    const route: Via[] = LEVELS.slice(1).map((_, i) => ({ x: (i % 2 ? -0.5 : 0.55) + (rng() - 0.5) * 0.3, z: (rng() - 0.5) * 0.9, lo: i, hi: i + 1 }));
    const vias: Via[] = [...route];
    for (let n = 0; n < 9; n++) {
      const lo = Math.floor(rng() * 4);
      vias.push({ x: (rng() - 0.5) * 2.2, z: (rng() - 0.5) * 1.2, lo, hi: lo + (rng() > 0.7 ? 2 : 1) });
    }
    const walkers = Array.from({ length: PEOPLE }, () => ({ x: (rng() - 0.5) * W * 0.9, z: (rng() - 0.5) * D * 0.9, along: rng() > 0.5, v: (rng() - 0.5) * 0.24 }));
    const traffic = Array.from({ length: TRAFFIC }, () => ({ via: Math.floor(rng() * vias.length), phase: rng(), up: rng() > 0.5 }));
    const wires = dynamic(vias.length * 9, 'inkMuted', 0.8);
    const motes = dynamic(PEOPLE + TRAFFIC, 'inkMuted', 0.9);
    const path = dynamic(64, 'signal', 0.6);
    const packet = new Mesh(new BoxGeometry(0.05, 0.05, 0.05), new MeshBasicMaterial({ color: hexOf('signal') }));
    scene.add(wires, motes, path, packet);
    return { levels, vias, route, walkers, traffic, wires, motes, path, packet, yaw: 0.7 };
  },
  update: ({ camera, t, dt, pointer, hover, still, state: s, w, h }) => {
    // At rest no level is lifted: the request is the one lit thing.
    const pick = pointer.active && hover > 0.3 ? pickOf(pointer.y) : -1;
    const yawTarget = 0.7 + Math.sin(t * 0.16) * 0.4 + (pointer.active ? (pointer.x - 0.5) * 0.8 * hover : 0);
    s.yaw = still ? yawTarget : follow(s.yaw, yawTarget, dt, 2);
    const dist = w / h < 0.9 ? 9 : 7.8;
    camera.position.set(Math.sin(s.yaw) * dist, dist * 0.5, Math.cos(s.yaw) * dist);
    camera.lookAt(0, -0.12, 0);
    // The levels breathe apart and together, slowly, so the vias between them stretch.
    const gap = GAP * (1 + 0.1 * Math.sin(t * 0.5));
    const ys = s.levels.map((l, k) => {
      const lift = k === pick ? 0.14 : 0;
      l.lift = still ? lift : follow(l.lift, lift, dt, 7);
      l.group.position.y = (k - (LEVELS.length - 1) / 2) * gap + l.lift;
      l.edge.color.set(hexOf(k === pick ? 'signal' : 'line4'));
      return l.group.position.y;
    });
    const y = (k: number): number => ys[k] ?? 0;
    const wire: number[] = [];
    for (const v of s.vias) {
      wire.push(v.x, y(v.lo), v.z, v.x, y(v.hi), v.z);
      // A square landing pad where the via meets each of its two levels.
      for (const k of [v.lo, v.hi]) for (const [a, b, c, d] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]] as const) wire.push(v.x + a * 0.025, y(k) + 0.002, v.z + b * 0.025, v.x + c * 0.025, y(k) + 0.002, v.z + d * 0.025);
    }
    write(s.wires, wire);
    const mote: number[] = [];
    for (const p of s.walkers) {
      const at = (q: number, span: number): number => ((((q + span / 2) % span) + span) % span) - span / 2;
      const x = p.along ? at(p.x + p.v * t, W * 0.92) : p.x;
      const z = p.along ? p.z : at(p.z + p.v * t, D * 0.92);
      mote.push(x, y(5) + 0.003, z, x + (p.along ? 0.025 : 0), y(5) + 0.003, z + (p.along ? 0 : 0.025));
    }
    for (const c of s.traffic) {
      const v = s.vias[c.via];
      if (!v) continue;
      const f = (c.phase + t * 0.22) % 1;
      const yy = c.up ? y(v.lo) + (y(v.hi) - y(v.lo)) * f : y(v.hi) - (y(v.hi) - y(v.lo)) * f;
      mote.push(v.x, yy, v.z, v.x, yy + 0.05, v.z);
    }
    write(s.motes, mote);
    // The request: from a person on the roof, along the roof to the first via, down it, across
    // the next level to its via, and so on to the silicon; then the answer climbs back.
    const pts: Vec3[] = [[-0.9, y(5), 0.5]];
    for (let k = 5; k >= 1; k--) {
      const v = s.route[k - 1];
      const last = pts[pts.length - 1];
      if (!v || !last) continue;
      pts.push([v.x, y(k), last[2]], [v.x, y(k), v.z], [v.x, y(k - 1), v.z]);
    }
    pts.push([0.72, y(0), -0.34]);
    const cycle = (t / 9) % 1;
    const u = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
    const at = along(pts, u);
    s.packet.position.set(at[0], at[1] + 0.03, at[2]);
    const trail: number[] = [];
    for (let i = 0; i < 32; i++) {
      const a = along(pts, (u * i) / 32);
      const b = along(pts, (u * (i + 1)) / 32);
      trail.push(a[0], a[1] + 0.004, a[2], b[0], b[1] + 0.004, b[2]);
    }
    write(s.path, trail);
    return pointer.active && hover > 0.3 ? LEVELS[pick] ?? 'rest' : 'rest';
  },
  fallback: ({ ctx, w, h, pointer, hover }) => {
    const cam = isometric(w / 2, h * 0.5, Math.min(w, h) * 0.24);
    const pick = pointer.active && hover > 0.3 ? pickOf(pointer.y) : -1;
    LEVELS.forEach((_, i) => {
      const y = (i - (LEVELS.length - 1) / 2) * GAP + (i === pick ? 0.14 : 0);
      const lit = i === pick;
      box(ctx, cam, -W / 2, -D / 2, W / 2, D / 2, y, y + 0.03, { top: lit ? mix('panelSignal', 'signalLine', 0.5) : mix('panel', 'panel2', 0.8), left: mix('ground', 'panel', 0.9), right: mix('ground', 'panel', 0.5), edge: lit ? ink.signal(0.95) : ink.line(0.5), crease: lit ? ink.signal(0.35) : ink.line(0.14) });
    });
    return pointer.active && hover > 0.3 ? LEVELS[pick] ?? 'rest' : 'rest';
  },
});
