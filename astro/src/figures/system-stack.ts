import { AmbientLight, BoxGeometry, BufferGeometry, ConeGeometry, CylinderGeometry, DirectionalLight, EdgesGeometry, Float32BufferAttribute, Group, IcosahedronGeometry, InstancedMesh, LineBasicMaterial, LineSegments, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, type Material } from 'three';
import { defineThreeFigure } from './defineThree';
import { isometric, type Vec3 } from './kit/camera';
import { district, isBox, isRound, outlines, STREETS, type Part } from './kit/city';
import { box } from './kit/draw';
import { hexOf, ink, mix } from './kit/ink';
import { clamp, follow } from './kit/motion';
import { along } from './kit/shapes';

/** The platform as a city built in levels, each a board like a PCB: traces on the ground,
 *  round parts standing on it, districts on top. The silicon undercity is standard-cell rows
 *  and memory macros; then racks with cooling tanks, a walled gateway, a knowledge district
 *  round a park, a skyline of apps, and the overcity where people live and walk the streets.
 *  Vias are pipes between the boards with fluid running through them; one request (the
 *  signal) flows from a person down every pipe to the silicon and back. The pointer's height
 *  lifts a board out and names it; at rest the request is the only lit thing. */

const LEVELS = ['silicon · undercity', 'compute · models', 'gateway · identity', 'core · knowledge', 'surfaces · apps', 'people · overcity'];
const W = 2.5;
const D = 1.5;
const GAP = 0.52;
const R = 0.028;
const SLUGS = 3;
const PEOPLE = 44;

interface Via { x: number; z: number; lo: number; hi: number; up: boolean; pipe: Mesh; pads: [Mesh, Mesh] }
interface Level { group: Group; edge: LineBasicMaterial; lift: number }
interface Walker { line: number; along: boolean; u: number; v: number }
interface State { levels: Level[]; vias: Via[]; slugs: InstancedMesh; people: InstancedMesh; walkers: Walker[]; path: LineSegments; packet: Mesh; yaw: number }

const m4 = new Matrix4();
const lines = (p: number[], key: 'line4' | 'inkFaint' | 'signal', opacity: number): LineSegments => {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(p, 3));
  return new LineSegments(g, new LineBasicMaterial({ color: hexOf(key), transparent: true, opacity }));
};

/** One instanced batch of a level's parts, each scaled from a unit shape to its footprint. */
function batch(parts: Part[], keep: (p: Part) => boolean, geo: BufferGeometry, mat: Material, lift = 0.5): InstancedMesh | null {
  const mine = parts.filter(keep);
  if (!mine.length) return null;
  const mesh = new InstancedMesh(geo, mat, mine.length);
  mine.forEach((p, i) => mesh.setMatrixAt(i, m4.makeScale(p.w, p.h, p.d).setPosition(p.x, p.h * lift, p.z)));
  return mesh;
}

const pickOf = (y: number): number => clamp(Math.floor((1 - y) * LEVELS.length), 0, LEVELS.length - 1);

export default defineThreeFigure<State>({
  id: 'system-stack',
  title: 'System stack',
  alt: 'Six boards stacked like the levels of a city, each with traces and round parts like a circuit board: a silicon undercity of cell rows and memory blocks, racks with cooling tanks, a walled gateway, a knowledge district round a park of low-poly trees, a skyline of apps, and a top level of wireframe apartments, parks and a stadium with people walking the streets. Pipes join the boards with grey fluid running through them, and one teal request flows from the top down to the silicon and back.',
  idea: 'The platform as a layered city on stacked boards, silicon undercity to the people on top: pipes carry traffic between levels and one request makes the whole round trip, so the stack reads as one working system.',
  motion: 'ambient',
  answers: true,
  group: 'hero',
  seed: 2026,
  aspect: 1,
  build: ({ scene, rng }) => {
    scene.add(new AmbientLight(hexOf('ink'), 0.55));
    const sun = new DirectionalLight(hexOf('ink'), 1.1);
    sun.position.set(2, 5, 3);
    scene.add(sun);
    const body = new MeshBasicMaterial({ color: hexOf('panel'), polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const leaf = new MeshLambertMaterial({ color: hexOf('inkFaint'), flatShading: true });
    const levels: Level[] = LEVELS.map((_, k) => {
      const group = new Group();
      const slab = new BoxGeometry(W, 0.025, D);
      const plate = new Mesh(slab, new MeshBasicMaterial({ color: hexOf('panel2'), transparent: true, opacity: 0.66, depthWrite: false }));
      const edge = new LineBasicMaterial({ color: hexOf('line4'), transparent: true, opacity: 0.9 });
      const rim = new LineSegments(new EdgesGeometry(slab), edge);
      plate.position.y = rim.position.y = -0.013;
      const { parts, traces } = district(k, rng);
      group.add(plate, rim, lines(traces.flatMap(([a, b, c, d]) => [a, 0.002, b, c, 0.002, d]), 'line4', 0.75));
      const meshes = [
        batch(parts, (p) => isBox(p.kind), new BoxGeometry(1, 1, 1), body),
        batch(parts, (p) => isRound(p.kind), new CylinderGeometry(0.5, 0.5, 1, 12), body),
        batch(parts, (p) => p.kind === 'tree', new IcosahedronGeometry(0.5, 0), leaf, 0.75),
        batch(parts, (p) => p.kind === 'pine', new ConeGeometry(0.5, 1, 5), leaf),
      ];
      for (const m of meshes) if (m) group.add(m);
      group.add(lines(outlines(parts), 'inkFaint', 0.5 + k * 0.05));
      scene.add(group);
      return { group, edge, lift: 0 };
    });
    // Pipes: one per gap carries the request (alternating sides); the rest carry traffic.
    const spots: [number, number, number, number][] = LEVELS.slice(1).map((_, i) => [(i % 2 ? -0.55 : 0.5) + (rng() - 0.5) * 0.3, (rng() - 0.5) * 0.9, i, i + 1]);
    for (let n = 0; n < 8; n++) {
      const lo = Math.floor(rng() * 4);
      spots.push([(rng() - 0.5) * 2.2, (rng() - 0.5) * 1.2, lo, lo + (rng() > 0.7 ? 2 : 1)]);
    }
    const glass = new MeshBasicMaterial({ color: hexOf('line4'), transparent: true, opacity: 0.5, depthWrite: false });
    const padMat = new MeshBasicMaterial({ color: hexOf('line4') });
    const vias: Via[] = spots.map(([x, z, lo, hi], i) => {
      const tube = new CylinderGeometry(R, R, 1, 10, 1, true);
      const pipe = new Mesh(tube, glass);
      // Only the rims are outlined (no facet lines), so the fluid inside stays readable.
      pipe.add(new LineSegments(new EdgesGeometry(tube, 40), new LineBasicMaterial({ color: hexOf('inkFaint') })));
      const pad = (): Mesh => new Mesh(new CylinderGeometry(R * 2.2, R * 2.2, 0.012, 14), padMat);
      const pads: [Mesh, Mesh] = [pad(), pad()];
      scene.add(pipe, ...pads);
      return { x, z, lo, hi, up: i % 2 === 1, pipe, pads };
    });
    const slugs = new InstancedMesh(new CylinderGeometry(R * 0.8, R * 0.8, 1, 8), new MeshBasicMaterial({ color: hexOf('ink2') }), vias.length * SLUGS);
    const people = new InstancedMesh(new BoxGeometry(0.014, 0.03, 0.014), new MeshBasicMaterial({ color: hexOf('inkSoft') }), PEOPLE);
    const walkers = Array.from({ length: PEOPLE }, () => {
      const alongX = rng() > 0.5;
      return { line: Math.floor(rng() * (alongX ? STREETS.z.length : STREETS.x.length)), along: alongX, u: rng(), v: (rng() - 0.5) * 0.1 };
    });
    const path = lines(new Array(64 * 6).fill(0), 'signal', 0.6);
    const packet = new Mesh(new IcosahedronGeometry(0.04, 1), new MeshBasicMaterial({ color: hexOf('signal') }));
    scene.add(slugs, people, path, packet);
    return { levels, vias, slugs, people, walkers, path, packet, yaw: 0.7 };
  },
  update: ({ camera, t, dt, pointer, hover, still, state: s, w, h }) => {
    const pick = pointer.active && hover > 0.3 ? pickOf(pointer.y) : -1;
    const yawTarget = 0.7 + Math.sin(t * 0.16) * 0.4 + (pointer.active ? (pointer.x - 0.5) * 0.8 * hover : 0);
    s.yaw = still ? yawTarget : follow(s.yaw, yawTarget, dt, 2);
    const dist = w / h < 0.9 ? 9.4 : 8.2;
    camera.position.set(Math.sin(s.yaw) * dist, dist * 0.5, Math.cos(s.yaw) * dist);
    camera.lookAt(0, -0.12, 0);
    // The boards breathe apart and together, slowly, so the pipes between them stretch.
    const gap = GAP * (1 + 0.08 * Math.sin(t * 0.5));
    const ys = s.levels.map((l, k) => {
      const lift = k === pick ? 0.14 : 0;
      l.lift = still ? lift : follow(l.lift, lift, dt, 7);
      l.group.position.y = (k - (LEVELS.length - 1) / 2) * gap + l.lift;
      l.edge.color.set(hexOf(k === pick ? 'signal' : 'line4'));
      return l.group.position.y;
    });
    const y = (k: number): number => ys[k] ?? 0;
    s.vias.forEach((v, i) => {
      const [a, b] = [y(v.lo), y(v.hi)];
      v.pipe.position.set(v.x, (a + b) / 2, v.z);
      v.pipe.scale.set(1, b - a, 1);
      v.pads[0].position.set(v.x, a + 0.006, v.z);
      v.pads[1].position.set(v.x, b - 0.006, v.z);
      // Slugs of fluid, evenly spaced, running up or down the pipe.
      for (let n = 0; n < SLUGS; n++) {
        const f = (n / SLUGS + t * 0.18 * (v.up ? 1 : -1) + 4) % 1;
        s.slugs.setMatrixAt(i * SLUGS + n, m4.makeScale(1, 0.05, 1).setPosition(v.x, a + 0.03 + f * (b - a - 0.06), v.z));
      }
    });
    s.slugs.instanceMatrix.needsUpdate = true;
    s.walkers.forEach((p, i) => {
      const span = p.along ? W * 0.9 : D * 0.9;
      const u = ((((p.u + (p.v * t) / span) % 1) + 1) % 1 - 0.5) * span;
      const fixed = p.along ? STREETS.z[p.line] ?? 0 : STREETS.x[p.line] ?? 0;
      s.people.setMatrixAt(i, m4.makeTranslation(p.along ? u : fixed, y(5) + 0.016, p.along ? fixed : u));
    });
    s.people.instanceMatrix.needsUpdate = true;
    // The request: from a person, along the street to the first pipe, down it, across the next
    // board to its pipe, and so on to the silicon; then the answer climbs back.
    const pts: Vec3[] = [[STREETS.x[0] ?? 0, y(5), STREETS.z[2] ?? 0]];
    for (let k = 5; k >= 1; k--) {
      const v = s.vias[k - 1];
      const last = pts[pts.length - 1];
      if (v && last) pts.push([v.x, y(k), last[2]], [v.x, y(k), v.z], [v.x, y(k - 1), v.z]);
    }
    pts.push([0.72, y(0), -0.34]);
    const cycle = (t / 9) % 1;
    const u = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
    const at = along(pts, u);
    s.packet.position.set(at[0], at[1] + 0.03, at[2]);
    const attr = s.path.geometry.getAttribute('position');
    for (let i = 0; i < 64; i++) {
      const a = along(pts, (u * i) / 64);
      const b = along(pts, (u * (i + 1)) / 64);
      attr.setXYZ(i * 2, a[0], a[1] + 0.005, a[2]);
      attr.setXYZ(i * 2 + 1, b[0], b[1] + 0.005, b[2]);
    }
    attr.needsUpdate = true;
    return pointer.active && hover > 0.3 ? LEVELS[pick] ?? 'rest' : 'rest';
  },
  fallback: ({ ctx, w, h, pointer, hover }) => {
    const cam = isometric(w / 2, h * 0.5, Math.min(w, h) * 0.22);
    const pick = pointer.active && hover > 0.3 ? pickOf(pointer.y) : -1;
    LEVELS.forEach((_, i) => {
      const y = (i - (LEVELS.length - 1) / 2) * GAP + (i === pick ? 0.14 : 0);
      const lit = i === pick;
      box(ctx, cam, -W / 2, -D / 2, W / 2, D / 2, y, y + 0.03, { top: lit ? mix('panelSignal', 'signalLine', 0.5) : mix('panel', 'panel2', 0.8), left: mix('ground', 'panel', 0.9), right: mix('ground', 'panel', 0.5), edge: lit ? ink.signal(0.95) : ink.line(0.5), crease: lit ? ink.signal(0.35) : ink.line(0.14) });
    });
    return pointer.active && hover > 0.3 ? LEVELS[pick] ?? 'rest' : 'rest';
  },
});
