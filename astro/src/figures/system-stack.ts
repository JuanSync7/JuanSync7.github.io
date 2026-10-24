import {
  BoxGeometry,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
} from 'three';
import { defineThreeFigure } from './defineThree';
import { animate, board, lines, solids, write, type Board, type Look } from './kit/boards';
import { showLook } from './kit/movers';
import type { Vec3 } from './kit/camera';
import type { District } from './kit/city';
import { stationOn } from './kit/civic';
import { hubLevel, HUB_LEVELS } from './kit/hub';
import { hexOf } from './kit/ink';
import { DEPTH, island, size, type Island } from './kit/islands';
import { flight, links, monorail, parked, settle, type Links } from './kit/links';
import { follow } from './kit/motion';
import { along } from './kit/shapes';
import { commit, lay, request, tube, tubes, type Tubes, type Via, type ViaKind } from './kit/vias';
import { aim, flatStacks, heading, pickAt } from './kit/stackview';
import { separate, waysOf } from './kit/separate';
import { crowd, gather, type Crowd } from './kit/crowd';
import { fleet, move, plan, type Fleet, type Model, type Ride } from './kit/traffic';
import { circuit, type Timed } from './kit/transit';

/** The platform as an archipelago of cities built in levels, each level a board like a PCB.
 *  The hub is the tall stack in the middle: from the silicon undercity (cell rows, an I/O
 *  ring) up through compute, a walled gateway, a knowledge district and a skyline of apps to
 *  the overcity where people live; one request (in white) walks from a person down to the
 *  silicon and back. Around it, shorter islands each make one thing (a mine, a foundry's
 *  production line, a finance exchange, an energy island of reactor, cooling towers, wind
 *  solar, geothermal and hydro, and an airport) and send it by monorail, station to station,
 *  to the hub level that uses it; the grid's teal conduit runs under every track from the
 *  energy island, through each station's substation, out on pylons; lorries, haulers and
 *  cars drive the roads, an open line builds cars, planes fly circuits from the airport and
 *  satellites orbit overhead. Teal is the city's energy: vias are wireframe lift shafts, pipes and bucket elevators carrying teal up and down, windows light
 *  teal and white. The pointer flies the camera to the stack under it: from one person's
 *  work to the whole company's. The page picks the look (`data.look`): hard-surface by
 *  default, toned bevelled solids lined only at their folds (`kit/hardsurface.ts`), or the
 *  original wireframe. */

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
  { kind: 'mine', name: 'mine · dig, smelt, refine', x: -1.36, z: 3.62, base: -1.0, feeds: 3 },
  { kind: 'foundry', name: 'foundry · the car line', x: 3.76, z: -1.08, base: -0.6, feeds: 0 },
  { kind: 'exchange', name: 'exchange · finance', x: -3.45, z: 0.83, base: 0.3, feeds: 2 },
  { kind: 'energy', name: 'energy · reactor, wind, sun, earth, water', x: 1.0, z: -3.44, base: -0.1, feeds: 1 },
  { kind: 'airport', name: 'airport · flights out', x: -2.43, z: -2.89, base: 1.25, feeds: 5 },
];
/** Island-to-island lines: metal to the foundry, power to the mine and the foundry, cars
 *  out to the airport; each its own monorail between two island stations. */
const LINKS: [number, number][] = [
  [1, 2],
  [4, 1],
  [4, 2],
  [2, 5],
];
const ENERGY = 4;
const AIRPORT = 5;
const [W, D] = [2.5, 1.5];
const R = 0.026;
const PEOPLE = 44;
const PLANES = 2;
/** The vehicle each stack's roads carry. */
const MODEL: Record<Kind, Model> = {
  hub: 'car',
  mine: 'hauler',
  foundry: 'lorry',
  exchange: 'car',
  energy: 'lorry',
  airport: 'lorry',
};
/** What the vias between a stack's levels are: lifts for people and requests, pipes for
 *  power, bucket elevators for ore, metal and parts. */
const VIA: Record<Kind, ViaKind> = {
  hub: 'lift',
  mine: 'bucket',
  foundry: 'bucket',
  exchange: 'lift',
  energy: 'pipe',
  airport: 'lift',
};
/** The overview's distance, and how far from a stack the camera stops (hub, island). */
const FAR = 15.5;
/** The overview aims at the hub's middle, so the airport above and the islands below both fit. */
const LOOK = -0.05;
const NEAR = [6.8, 3.8];

interface Stack {
  spec: Spec;
  boards: Board[];
  cities: District[];
  /** Each board's width and depth, and its height this frame. */
  dims: [number, number][];
  ys: number[];
  gap: number;
  /** Where the monorail stops: the island's station (on its top board) and its hub station. */
  stop: Vec3;
  hubStop: Vec3;
}
interface State {
  stacks: Stack[];
  vias: Via[];
  tubes: Tubes;
  pulses: InstancedMesh;
  links: Links;
  flights: Timed;
  fleet: Fleet;
  rides: Ride[];
  people: Crowd;
  path: ReturnType<typeof lines>;
  packet: Mesh;
  over: PerspectiveCamera;
  across: (readonly [Vec3, Vec3])[];
  view: { x: number; y: number; z: number; dist: number; orbit: number };
  look: Look | '';
}

const m4 = new Matrix4();
const levels = (c: Spec): number => (c.kind === 'hub' ? HUB_LEVELS : DEPTH[c.kind]);
const dimsOf = (c: Spec, k: number): [number, number] => (c.kind === 'hub' ? [W, D] : size(c.kind, k));
/** A board-local point on stack S's level k, in the world. */
const world = (S: Stack, k: number, p: Vec3): Vec3 => [S.spec.x + p[0], (S.ys[k] ?? 0) + p[1], S.spec.z + p[2]];

export default defineThreeFigure<State>({
  id: 'system-stack',
  title: 'System stack',
  alt: 'A tall stack of six boards like the levels of a city, each with traces and round parts like a circuit board, from a silicon undercity through a datacentre, a walled gateway and a library by a lake to an overcity of houses, a school, shops and parks with people walking, ringed by five floating islands of several levels each: a mine with mountains and mesas behind an open pit, a mining shovel, drill rigs, haul trucks, a hopper and crusher, and below a rotary kiln, smelter and refinery columns; a foundry with an open car line, a warehouse with its crane yard and a second enclosed line; a finance exchange of towers round a dome; an energy island with a reactor, cooling towers, wind turbines, solar rows, fuel cells, a fuel-rod store, transformers and a battery station by a dam; and an airport whose planes take off, circle and land. Each level has its substation and poles; goods climb between levels by teal glass tubes from each gathering point, and monorails join the islands to the hub and to each other',
  idea: 'From one person to the whole company: the platform is a living city on stacked boards, and the islands round it each make one thing (ore and metal, cars, money, power, flights) and ship it in by monorail along a grid that carries the power. Drawn hard-surface (toned, bevelled solids lined at their folds) or, on request, in wireframe.',
  motion: 'ambient',
  answers: true,
  group: 'hero',
  seed: 2026,
  aspect: 1,
  build: ({ scene, rng }) => {
    const kit = solids();
    // Every level is built, then its parts are moved apart so none stands in another.
    const cities = STACKS.map((c) =>
      Array.from({ length: levels(c) }, (_, k) => {
        const city = c.kind === 'hub' ? hubLevel(k, rng) : island(c.kind, k, rng);
        const [w, d] = dimsOf(c, k);
        return {
          ...city,
          parts: separate(city.parts, w, d, undefined, waysOf(city.roads ?? [], city.lanes ?? [], 0.035, 0.065)),
        };
      }),
    );
    // Stations first, so each board is built with its platform, substation and power line.
    const stops = STACKS.slice(1).map((c, i) => {
      const top = levels(c) - 1;
      const [w, d] = dimsOf(c, top);
      const here = cities[i + 1]?.[top];
      const there = cities[0]?.[c.feeds];
      const a: Vec3 = here ? stationOn(here, w, d, -c.x, -c.z, rng) : [0, 0, 0];
      const b: Vec3 = there ? stationOn(there, W, D, c.x, c.z, rng) : [0, 0, 0];
      return [a, b];
    });
    const across = LINKS.map(([a, b]) => {
      const [A, B] = [STACKS[a], STACKS[b]];
      const on = (c: Spec | undefined, i: number, o: Spec | undefined): Vec3 => {
        const top = c ? levels(c) - 1 : 0;
        const city = cities[i]?.[top];
        const [w, d] = c ? dimsOf(c, top) : [W, D];
        return city && c && o ? stationOn(city, w, d, o.x - c.x, o.z - c.z, rng) : [0, 0, 0];
      };
      return [on(A, a, B), on(B, b, A)] as const;
    });
    const stacks: Stack[] = STACKS.map((spec, i) => {
      const dims = cities[i]?.map((_, k) => dimsOf(spec, k)) ?? [];
      const boards = (cities[i] ?? []).map((city, k) => {
        const [w, d] = dims[k] ?? [W, D];
        const b = board(city, w, d, rng, kit, k / dims.length);
        b.group.position.set(spec.x, 0, spec.z);
        scene.add(b.group);
        return b;
      });
      const [stop, hubStop] = stops[i - 1] ?? [
        [0, 0, 0],
        [0, 0, 0],
      ];
      const gap = i ? 0.42 : 0.52;
      const ys = boards.map((_, k) => spec.base + (k - (boards.length - 1) / 2) * gap);
      return { spec, boards, cities: cities[i] ?? [], dims, ys, gap, stop, hubStop };
    });
    // Vias: on the hub the first per gap carries the request; the energy island is plumbed
    // thickest, with wider pipes.
    const vias = lay(
      stacks.map((S, i) => ({
        cities: S.cities,
        dims: S.dims,
        parts: S.boards.map((b) => b.parts),
        kind: VIA[S.spec.kind],
        wide: i === ENERGY,
        roofs: i === 0 ? 8 : i === ENERGY ? 3 : 2,
      })),
      R,
      rng,
    );
    const T = tubes(vias.map((v) => v.kind));
    const wires = stacks.reduce((n, S) => n + S.boards.reduce((m, b) => m + b.wires.length, 0), 0);
    const pulses = new InstancedMesh(
      new BoxGeometry(0.014, 0.014, 0.014),
      new MeshBasicMaterial({ color: hexOf('signal') }),
      wires,
    );
    const people = crowd(cities, PEOPLE, rng);
    const rides = plan(cities, (i) => MODEL[STACKS[i]?.kind ?? 'hub'], rng);
    const port = stacks[AIRPORT];
    const runway = port?.cities[0]?.runway;
    const flights =
      port && runway ? circuit(world(port, 0, runway[0]), world(port, 0, runway[1]), [0, 0, 0], 6.2, 2.6) : [];
    const path = lines(new Array(64 * 6).fill(0), 'inkStrong', 0.7);
    const packet = new Mesh(new IcosahedronGeometry(0.04, 1), new MeshBasicMaterial({ color: hexOf('inkStrong') }));
    const F = fleet(rides.length);
    if (port)
      scene.add(
        parked(
          (port.cities[0]?.apron ?? []).map(([p, h]) => [world(port, 0, p), h]),
          0.2,
        ),
      );
    scene.add(T.frame, T.movers, pulses, people.mesh, path, packet, F.ink, ...Object.values(F.solids));
    return {
      stacks,
      vias,
      tubes: T,
      pulses,
      links: links(scene, STACKS.length - 1 + LINKS.length, PLANES, 3),
      across,
      flights,
      fleet: F,
      rides,
      people,
      path,
      packet,
      over: new PerspectiveCamera(30, 1, 0.1, 60),
      view: { x: 0, y: LOOK, z: 0, dist: FAR, orbit: 0 },
      look: '',
    };
  },
  update: ({ scene, camera, t, dt, pointer, hover, still, data, state: s, w, h }) => {
    // The look the page asks for: hard-surface unless it asks for the wireframe.
    const look: Look =
      typeof data === 'object' && data !== null && 'look' in data && data.look === 'wire' ? 'wire' : 'solid';
    if (look !== s.look) showLook(scene, look);
    s.look = look;
    // The overview frames the whole archipelago and turns slowly; the pointer picks the stack
    // nearest it there (so flying in never moves what is under the pointer), and the camera
    // flies to it, levelling out as it nears.
    const wide = w / h < 0.9 ? 1.18 : 1;
    const v = s.view;
    const near = 1 - Math.min(1, Math.max(0, (v.dist - 3) / (FAR * wide - 3)));
    s.over.aspect = w / h;
    aim(s.over, 0, LOOK, 0, FAR * wide, heading(t, 0));
    s.over.updateProjectionMatrix();
    s.over.updateMatrixWorld();
    const pick = pointer.active && hover > 0.3 ? pickAt(s.over, STACKS, pointer.x, pointer.y) : -1;
    const c = STACKS[pick];
    const goal = c ? [c.x, c.base, c.z, (NEAR[c.kind === 'hub' ? 0 : 1] ?? 5) * wide] : [0, LOOK, 0, FAR * wide];
    const ease = (a: number, b = 0): number => (still ? b : follow(a, b, dt, 1.3));
    [v.x, v.y, v.z, v.dist] = [ease(v.x, goal[0]), ease(v.y, goal[1]), ease(v.z, goal[2]), ease(v.dist, goal[3])];
    // Circle a stack slowly once close: the turn builds up a frame at a time and unwinds as
    // the camera pulls back, so the overview matches the one the pointer picks against.
    v.orbit = still ? 0 : follow(v.orbit + dt * 0.05 * near, 0, dt, 1.2 * (1 - near));
    aim(camera, v.x, v.y, v.z, v.dist, heading(t, v.orbit));
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
    const hub = s.stacks[0];
    if (!hub) return 'rest';
    // Each island ships to the hub level it feeds by monorail, station to station; current
    // runs under every track, out from the energy island and on from the hub to the rest.
    s.stacks.slice(1).forEach((S, j) => {
      const from = world(S, S.ys.length - 1, S.stop);
      monorail(s.links, j, from, world(hub, S.spec.feeds, S.hubStop), t, j + 1 === ENERGY ? 1 : -1);
    });
    s.across.forEach(([a, b], e) => {
      const [A, B] = [s.stacks[LINKS[e]?.[0] ?? 0], s.stacks[LINKS[e]?.[1] ?? 0]];
      if (A && B)
        monorail(s.links, STACKS.length - 1 + e, world(A, A.ys.length - 1, a), world(B, B.ys.length - 1, b), t, 1);
    });
    for (let j = 0; j < PLANES; j++) flight(s.links, j, s.flights, t);
    settle(s.links, t);
    const at = (i: number, k: number, p: Vec3): Vec3 => {
      const S = s.stacks[i];
      return S ? world(S, k, p) : p;
    };
    move(s.fleet, s.rides, t, at);
    gather(s.people, t, at, 0, HUB_LEVELS - 1, W, D);
    const req = request((k) => hub.ys[k] ?? 0, s.vias, HUB_LEVELS - 1, t);
    s.packet.position.set(req.head[0], req.head[1] + 0.03, req.head[2]);
    write(s.path, req.trail);
    return c ? c.name : 'rest';
  },
  fallback: ({ ctx, w, h, pointer, hover }) => {
    const pick =
      pointer.active && hover > 0.3 ? Math.min(STACKS.length - 1, Math.floor(pointer.x * STACKS.length)) : -1;
    flatStacks(
      ctx,
      w,
      h,
      STACKS,
      (i) =>
        Array.from({ length: STACKS[i] ? levels(STACKS[i]) : 0 }, (_, k) =>
          STACKS[i] ? dimsOf(STACKS[i], k) : [W, D],
        ),
      (i) => (i ? 0.42 : 0.52),
      pick,
    );
    return pick >= 0 ? (STACKS[pick]?.name ?? 'rest') : 'rest';
  },
});
