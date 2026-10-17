import {
  BoxGeometry,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Vector3,
} from 'three';
import { defineThreeFigure } from './defineThree';
import { animate, board, commit, lines, solids, tube, tubes, write, type Board, type Tubes } from './kit/boards';
import { isometric, type Vec3 } from './kit/camera';
import { district, STREETS } from './kit/city';
import { roof } from './kit/citylife';
import { box } from './kit/draw';
import { hexOf, ink, mix } from './kit/ink';
import { DEPTH, ID, island, IW, type Island } from './kit/islands';
import { cable, flight, links, monorail, settle, type Links } from './kit/links';
import { follow } from './kit/motion';
import { along } from './kit/shapes';
import { edgePoint } from './kit/transit';

/** The platform as an archipelago of cities built in levels, each level a board like a PCB.
 *  The hub is the tall stack in the middle: from the silicon undercity (cell rows, an I/O
 *  ring) up through compute, a walled gateway, a knowledge district and a skyline of apps to
 *  the overcity where people live; one request (in white) walks from a person down to the
 *  silicon and back. Around it, shorter islands each make one thing (a mine, a foundry's
 *  production line, a finance exchange, an energy island of reactor, cooling towers, wind
 *  and solar) and send it by monorail to the hub level that uses it; the energy island's
 *  teal cables power every other stack; planes fly between islands; satellites orbit
 *  overhead. Teal is the city's energy: vias are glass tubes with flow inside, windows light
 *  teal and white. The pointer flies the camera to the stack under it: from one person's
 *  work to the whole company's. */

type Kind = 'hub' | Island;
interface Spec {
  kind: Kind;
  name: string;
  x: number;
  z: number;
  /** Height of the stack's middle, and the hub level its goods arrive at. */
  base: number;
  feeds: number;
}
const STACKS: Spec[] = [
  { kind: 'hub', name: 'hub · the platform', x: 0, z: 0, base: 0, feeds: 0 },
  { kind: 'mine', name: 'mine · raw material', x: -0.9, z: 3.6, base: -1.0, feeds: 3 },
  { kind: 'foundry', name: 'foundry · production line', x: 3.7, z: -0.3, base: -0.6, feeds: 0 },
  { kind: 'exchange', name: 'exchange · finance', x: -3.7, z: 0.3, base: 0.3, feeds: 2 },
  { kind: 'energy', name: 'energy · reactor, wind and sun', x: 0.9, z: -3.6, base: -0.2, feeds: 1 },
];
const ENERGY = 4;
const HUB = 6;
const [W, D] = [2.5, 1.5];
const R = 0.026;
const PEOPLE = 44;
/** Island pairs a plane shuttles between. */
const FLIGHTS: [number, number][] = [
  [1, 3],
  [2, 4],
  [3, 2],
];
/** The overview's distance, and how far from a stack the camera stops (hub, island). */
const FAR = 14.2;
/** The overview aims a little below the hub's middle, so the orbits overhead stay in frame. */
const LOOK = -0.15;
const NEAR = [8.4, 4.4];

interface Stack {
  spec: Spec;
  boards: Board[];
  ys: number[];
  gap: number;
  w: number;
  d: number;
}
interface Via {
  s: number;
  x: number;
  z: number;
  lo: number;
  foot: number;
  r: number;
  up: boolean;
}
interface State {
  stacks: Stack[];
  vias: Via[];
  tubes: Tubes;
  pulses: InstancedMesh;
  links: Links;
  people: InstancedMesh;
  walkers: { line: number; along: boolean; u: number; v: number }[];
  path: ReturnType<typeof lines>;
  packet: Mesh;
  over: PerspectiveCamera;
  view: { x: number; y: number; z: number; dist: number };
}

const m4 = new Matrix4();
const v3 = new Vector3();
const top = (S: Stack): number => S.ys[S.ys.length - 1] ?? 0;
/** Where a stack's level k meets the line toward (tx, tz), at that level's height. */
const dock = (S: Stack, k: number, tx: number, tz: number, lift = 0): Vec3 => {
  const [x, z] = edgePoint(S.spec.x, S.spec.z, S.w * 0.96, S.d * 0.96, tx, tz);
  return [x, (S.ys[k] ?? 0) + lift, z];
};
/** The stack nearest the pointer as the overview camera sees it, if any is close. */
function pickAt(over: PerspectiveCamera, px: number, py: number): number {
  let [best, pick] = [0.55, -1];
  STACKS.forEach((c, i) => {
    v3.set(c.x, c.base, c.z).project(over);
    const d = Math.hypot(v3.x - (px * 2 - 1), v3.y - (1 - py * 2));
    if (d < best) [best, pick] = [d, i];
  });
  return pick;
}

export default defineThreeFigure<State>({
  id: 'system-stack',
  title: 'System stack',
  alt: 'A tall stack of six boards like the levels of a city, each with traces and round parts like a circuit board, from a silicon undercity up to wireframe apartments and parks with people walking, ringed by four shorter floating islands: a mine with an open pit, headframes and ore heaps; a foundry of saw-tooth halls and chimneys; a finance exchange of towers round a dome; and an energy island with a reactor dome, two cooling towers, wind turbines and solar rows. Monorails run from each island to a level of the hub, teal power cables sag from the energy island to all the others, three low-poly airliners fly between islands, and wireframe satellites orbit above. Teal glass tubes join the levels with flow running through them and windows flicker teal and white.',
  idea: 'From one person to the whole company: the platform is a living city on stacked boards, and the islands round it each make one thing (raw material, products, money, energy) and ship it in by monorail, cable and plane.',
  motion: 'ambient',
  answers: true,
  group: 'hero',
  seed: 2026,
  aspect: 1,
  build: ({ scene, rng }) => {
    const kit = solids();
    const stacks: Stack[] = STACKS.map((spec) => {
      const hub = spec.kind === 'hub';
      const n = spec.kind === 'hub' ? HUB : DEPTH[spec.kind];
      const [w, d] = hub ? [W, D] : [IW, ID];
      const boards = Array.from({ length: n }, (_, k) => {
        const b = board(spec.kind === 'hub' ? district(k, rng) : island(spec.kind, k, rng), w, d, rng, kit, k / n);
        b.group.position.set(spec.x, 0, spec.z);
        scene.add(b.group);
        return b;
      });
      return { spec, boards, ys: boards.map(() => 0), gap: hub ? 0.52 : 0.42, w, d };
    });
    // Tubes: on the hub the first per gap carries the request (alternating sides), the rest
    // land on rooftops; the energy island is plumbed thickest, with wider pipes.
    const vias: Via[] = [];
    stacks.forEach((S, s) => {
      const energy = s === ENERGY;
      const via = (x: number, z: number, lo: number, foot: number): number =>
        vias.push({ s, x, z, lo, foot, r: energy && !foot ? R * 1.5 : R, up: vias.length % 2 === 1 });
      for (let k = 0; k + 1 < S.boards.length; k++)
        for (let j = 0; j < (energy ? 3 : 1); j++)
          via(((k + j) % 2 ? -1 : 1) * S.w * (0.2 + (rng() - 0.5) * 0.12), (rng() - 0.5) * S.d * 0.6, k, 0);
      for (let n = 0; n < (s === 0 ? 8 : energy ? 5 : 2); n++) {
        const lo = Math.floor(rng() * (S.boards.length - 1));
        const p = roof(S.boards[lo]?.parts ?? [], rng);
        if (p) via(p.x, p.z, lo, p.h);
      }
    });
    const T = tubes(vias.length, 3);
    const wires = stacks.reduce((n, S) => n + S.boards.reduce((m, b) => m + b.wires.length, 0), 0);
    const pulses = new InstancedMesh(
      new BoxGeometry(0.022, 0.022, 0.022),
      new MeshBasicMaterial({ color: hexOf('signal') }),
      wires,
    );
    const people = new InstancedMesh(
      new BoxGeometry(0.014, 0.03, 0.014),
      new MeshBasicMaterial({ color: hexOf('inkSoft') }),
      PEOPLE,
    );
    const walkers = Array.from({ length: PEOPLE }, () => {
      const alongX = rng() > 0.5;
      const n = alongX ? STREETS.z.length : STREETS.x.length;
      return { line: Math.floor(rng() * n), along: alongX, u: rng(), v: (rng() - 0.5) * 0.1 };
    });
    const path = lines(new Array(64 * 6).fill(0), 'inkStrong', 0.7);
    const packet = new Mesh(new IcosahedronGeometry(0.04, 1), new MeshBasicMaterial({ color: hexOf('inkStrong') }));
    scene.add(T.glass, T.pads, T.slugs, T.rims, pulses, people, path, packet);
    return {
      stacks,
      vias,
      tubes: T,
      pulses,
      links: links(scene, STACKS.length - 1, STACKS.length - 1, FLIGHTS.length, 3),
      people,
      walkers,
      path,
      packet,
      over: new PerspectiveCamera(30, 1, 0.1, 60),
      view: { x: 0, y: LOOK, z: 0, dist: FAR },
    };
  },
  update: ({ camera, t, dt, pointer, hover, still, state: s, w, h }) => {
    // The overview frames the whole archipelago and turns slowly; the pointer picks the stack
    // nearest it there (so flying in never moves what is under the pointer), and the camera
    // flies to it, levelling out as it nears.
    const wide = w / h < 0.9 ? 1.18 : 1;
    const yaw = 0.7 + Math.sin(t * 0.12) * 0.25;
    const place = (cam: PerspectiveCamera, x: number, y: number, z: number, dist: number): void => {
      const el = 0.5 + 0.12 * Math.min(1, Math.max(0, (dist - 5) / 10));
      cam.position.set(x + Math.sin(yaw) * dist, y + dist * el, z + Math.cos(yaw) * dist);
      cam.lookAt(x, y - 0.1, z);
    };
    s.over.aspect = w / h;
    place(s.over, 0, LOOK, 0, FAR * wide);
    s.over.updateProjectionMatrix();
    s.over.updateMatrixWorld();
    const pick = pointer.active && hover > 0.3 ? pickAt(s.over, pointer.x, pointer.y) : -1;
    const c = STACKS[pick];
    const goal = c ? [c.x, c.base, c.z, (NEAR[c.kind === 'hub' ? 0 : 1] ?? 5) * wide] : [0, LOOK, 0, FAR * wide];
    const v = s.view;
    const ease = (a: number, b = 0): number => (still ? b : follow(a, b, dt, 1.6));
    [v.x, v.y, v.z, v.dist] = [ease(v.x, goal[0]), ease(v.y, goal[1]), ease(v.z, goal[2]), ease(v.dist, goal[3])];
    place(camera, v.x, v.y, v.z, v.dist);
    // Every stack breathes on its own phase, so the tubes between its boards stretch.
    let pulse = 0;
    s.stacks.forEach((S, i) => {
      const gap = S.gap * (1 + 0.08 * Math.sin(t * 0.5 + i * 1.3));
      S.boards.forEach((b, k) => {
        const y = S.spec.base + (k - (S.boards.length - 1) / 2) * gap;
        S.ys[k] = y;
        b.group.position.y = y;
        animate(b, t, i === pick);
        b.wires.forEach((q, j) => {
          const p = along(q, (t * 0.35 + j * 0.27) % 1);
          s.pulses.setMatrixAt(pulse++, m4.makeTranslation(S.spec.x + p[0], y + p[1] + 0.012, S.spec.z + p[2]));
        });
      });
    });
    s.pulses.instanceMatrix.needsUpdate = true;
    s.vias.forEach((q, i) => {
      const S = s.stacks[q.s];
      if (!S) return;
      const [a, b] = [(S.ys[q.lo] ?? 0) + q.foot, (S.ys[q.lo + 1] ?? 0) - 0.013];
      tube(s.tubes, i, S.spec.x + q.x, S.spec.z + q.z, a, b, q.r, t * 0.18 * (q.up ? 1 : -1));
    });
    commit(s.tubes);
    const [hub, energy] = [s.stacks[0], s.stacks[ENERGY]];
    if (!hub || !energy) return 'rest';
    // Each island ships to the hub level it feeds by monorail; energy cables run to every
    // other stack (the hub's compute level), and planes fly out and back between islands.
    s.stacks.slice(1).forEach((S, j) => {
      monorail(s.links, j, dock(S, S.ys.length - 1, 0, 0), dock(hub, S.spec.feeds, S.spec.x, S.spec.z), t);
    });
    [1, 2, 3, 0].forEach((to, j) => {
      const S = s.stacks[to];
      if (!S) return;
      const [x, z] = edgePoint(energy.spec.x, energy.spec.z, IW * 0.7, ID * 0.7, S.spec.x, S.spec.z);
      const end = dock(S, to === 0 ? 1 : S.ys.length - 1, energy.spec.x, energy.spec.z, 0.12);
      cable(s.links, j, [x, top(energy) + 0.35, z], end, t);
    });
    FLIGHTS.forEach(([a, b], j) => {
      const [A, B] = [s.stacks[a], s.stacks[b]];
      if (A && B) flight(s.links, j, [A.spec.x, top(A) + 0.5, A.spec.z], [B.spec.x, top(B) + 0.5, B.spec.z], t);
    });
    settle(s.links, t);
    const y = (k: number): number => hub.ys[k] ?? 0;
    s.walkers.forEach((p, i) => {
      const span = p.along ? W * 0.9 : D * 0.9;
      const u = (((((p.u + (p.v * t) / span) % 1) + 1) % 1) - 0.5) * span;
      const fixed = p.along ? (STREETS.z[p.line] ?? 0) : (STREETS.x[p.line] ?? 0);
      s.people.setMatrixAt(i, m4.makeTranslation(p.along ? u : fixed, y(5) + 0.016, p.along ? fixed : u));
    });
    s.people.instanceMatrix.needsUpdate = true;
    // The request: from a person, along the street to the first tube, down it, across the
    // next board to its tube, and so on to the silicon; then the answer climbs back.
    const pts: Vec3[] = [[STREETS.x[0] ?? 0, y(5), STREETS.z[2] ?? 0]];
    for (let k = 5; k >= 1; k--) {
      const q = s.vias[k - 1];
      const last = pts[pts.length - 1];
      if (q && last) pts.push([q.x, y(k), last[2]], [q.x, y(k), q.z], [q.x, y(k - 1), q.z]);
    }
    pts.push([0.72, y(0), -0.34]);
    const cycle = (t / 9) % 1;
    const u = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
    const at = along(pts, u);
    s.packet.position.set(at[0], at[1] + 0.03, at[2]);
    const trail: number[] = [];
    for (let i = 0; i < 64; i++) {
      const [a, b] = [along(pts, (u * i) / 64), along(pts, (u * (i + 1)) / 64)];
      trail.push(a[0], a[1] + 0.005, a[2], b[0], b[1] + 0.005, b[2]);
    }
    write(s.path, trail);
    return c ? c.name : 'rest';
  },
  fallback: ({ ctx, w, h, pointer, hover }) => {
    const cam = isometric(w / 2, h * 0.5, Math.min(w, h) * 0.075);
    const pick = pointer.active && hover > 0.3 ? Math.min(4, Math.floor(pointer.x * 5)) : -1;
    STACKS.forEach((c, i) => {
      const n = c.kind === 'hub' ? HUB : DEPTH[c.kind];
      const [hw, hd] = c.kind === 'hub' ? [W / 2, D / 2] : [IW / 2, ID / 2];
      const lit = i === pick;
      for (let k = 0; k < n; k++) {
        const y = c.base + (k - (n - 1) / 2) * (c.kind === 'hub' ? 0.52 : 0.42);
        box(ctx, cam, c.x - hw, c.z - hd, c.x + hw, c.z + hd, y, y + 0.03, {
          top: lit ? mix('panelSignal', 'signalLine', 0.5) : mix('panel', 'panel2', 0.8),
          left: mix('ground', 'panel', 0.9),
          right: mix('ground', 'panel', 0.5),
          edge: lit ? ink.signal(0.95) : ink.line(0.5),
          crease: lit ? ink.signal(0.35) : ink.line(0.14),
        });
      }
    });
    return pick >= 0 ? (STACKS[pick]?.name ?? 'rest') : 'rest';
  },
});
