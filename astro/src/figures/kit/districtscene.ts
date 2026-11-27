import { Matrix4, Quaternion, Vector3, type InstancedMesh, type OrthographicCamera } from 'three';
import { districtClashes } from './districtcheck';
import { moveMovers } from './districtmovers';
import { monodraw, type Drawing } from './drawing/monodraw';
import { Sketch } from './drawing/monoline';
import { settle, unhook } from './districtlayout';
import { reachOf } from './districtsolids';
import { districtSketch, type Plan } from './districtsketch';
import { wireOf, type Wire } from './districtwire';
import { hubLevel } from './hub';
import { DAM_BOARD, hydro } from './hydro';
import { island, size, type Island } from './islands';
import { library } from './library';
import { mulberry32 } from './rng';
import { separate, waysOf } from './separate';
import { STONE, terrainOf } from './terrain';
import { along } from './shapes';
import { onLoop } from './traffic';

/** The district template's scene for one seed (`templates/district.ts`): which board, its parts
 *  laid out for a solid drawing (`districtOf`), the drawing checked and drawn for the seed's
 *  camera, the camera aimed, and its vehicles and flow marks moved each frame. */

export const BOARDS = [
  ['hub', 5, 'housing'],
  ['hub', 1, 'datacentre'],
  ['hub', 3, 'library'],
  ['mine', 2, 'open pit'],
  ['mine', 1, 'smelting line'],
  ['foundry', 1, 'car line'],
  ['foundry', 0, 'press shop'],
  ['energy', 2, 'power station'],
  ['energy', 1, 'geothermal field'],
  ['energy', 0, 'dam'],
  ['exchange', 1, 'exchange'],
  ['airport', 0, 'airport'],
] as const;
export type Board = (typeof BOARDS)[number];

export interface P {
  board: Board;
  salt: number;
  yaw: number;
  pitch: number;
}

/** Half the width kept clear along a road and along a street, as the home page's stack keeps them. */
const [ROAD, LANE] = [0.035, 0.065];
/** How many flow marks run along each pipe, and how many vehicles each road carries. */
const [PULSES, PER_ROAD] = [2, 2];
/** A flow mark's radius, in board units. */
const PULSE_R = 0.011;

/** The seed's district, laid out for a solid drawing. */
export function districtOf(board: Board, salt: number): Plan {
  const [kind, k, name] = board;
  const rng = mulberry32(salt);
  // The library and the dam have boards of their own, richer than their levels in the stack.
  const city =
    name === 'library'
      ? library(rng)
      : name === 'dam'
        ? hydro(rng)
        : kind === 'hub'
          ? hubLevel(k, rng)
          : island(kind as Island, k, rng);
  const [w, d] = name === 'dam' ? DAM_BOARD : kind === 'hub' ? [2.5, 1.5] : size(kind as Island, k);
  // Footprints kept apart at full size (separate), then the solids settled in 3D (settle).
  const ways = waysOf(city.roads ?? [], city.lanes ?? [], ROAD, LANE);
  // Stones are not parts here but the ground itself: every one, as the generator placed it.
  const stones = city.parts.filter((p) => STONE.includes(p.kind));
  const roads = waysOf(city.roads ?? [], [], ROAD, 0);
  const terrain = terrainOf(stones, w, d, roads);
  const apart = separate(city.parts, w, d, city.landmark, ways, 1, reachOf).filter((p) => !STONE.includes(p.kind));
  const top = Math.max(...apart.map((p) => (p.y ?? 0) + p.h));
  const mark = city.landmark
    ? apart.find((p) => p.x === city.landmark?.x && p.kind === city.landmark?.kind)
    : apart.find((p) => (p.y ?? 0) + p.h === top);
  const model = kind === 'mine' ? 'hauler' : 'car';
  const loops = (city.roads ?? []).flatMap((loop) =>
    Array.from({ length: PER_ROAD }, (_, n) => ({ loop, phase: n / PER_ROAD, model }) as const),
  );
  const { parts, objects, open, left } = settle(apart, mark, roads, terrain?.height);
  // A vehicle starts at the first clear place from its phase on (not down in a pit's bowl).
  const rides = loops.map((r) => {
    const tries = Array.from({ length: 48 }, (_, j) => onLoop(r.loop, r.phase + j / 48)[0]);
    return { ...r, start: tries.find(open) ?? tries[0] ?? [0, 0, 0] };
  });
  const pipes = unhook(city.pipes ?? [], left);
  return {
    city: { ...city, parts, pipes },
    objects,
    w,
    d,
    rides,
    left,
    ...(mark ? { mark } : {}),
    ...(terrain ? { terrain } : {}),
  };
}

const at = new Matrix4();
const [pos, turn, scale, up] = [new Vector3(), new Quaternion(), new Vector3(), new Vector3(0, 1, 0)];
const corner = new Vector3();

/** The seed's drawing: the plan sketched, checked (R-FIG-31) and drawn for its one camera. */
export function drawDistrict(plan: Plan, look: Vector3, onDispose: (d: () => void) => void): Drawing {
  const k = new Sketch();
  districtSketch(k, plan);
  const clashes = districtClashes(k, plan.terrain?.height);
  if (clashes.length) throw new Error(`district: parts stand inside each other: ${clashes.join(', ')}`);
  return monodraw(k, look.clone().negate(), onDispose);
}

/** An orthographic camera along `dir` framing the board and everything on it in w × h. */
export function aimDistrict(cam: OrthographicCamera, plan: Plan, dir: Vector3, w: number, h: number): void {
  const top = Math.max(0.1, ...plan.city.parts.map((p) => (p.y ?? 0) + p.h));
  const [hw, hd] = [plan.w / 2, plan.d / 2];
  const target = new Vector3(0, top / 3, 0);
  cam.position.copy(target).addScaledVector(dir, 30);
  cam.lookAt(target);
  cam.near = 1;
  cam.far = 60;
  cam.updateMatrixWorld();
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const x of [-hw, hw])
    for (const y of [-0.03, top])
      for (const z of [-hd, hd]) {
        corner.set(x, y, z).applyMatrix4(cam.matrixWorldInverse);
        [x0, x1, y0, y1] = [
          Math.min(x0, corner.x),
          Math.max(x1, corner.x),
          Math.min(y0, corner.y),
          Math.max(y1, corner.y),
        ];
      }
  const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
  const half = Math.max((x1 - x0) / 2, ((y1 - y0) / 2) * (w / h)) * 1.03;
  Object.assign(cam, { left: cx - half, right: cx + half, top: cy + (half * h) / w, bottom: cy - (half * h) / w });
  cam.updateProjectionMatrix();
}

/** Vehicles round their loops and flow marks along the pipes, at time t (seconds). */
export function moveDistrict(draw: Drawing, plan: Plan, spots: InstancedMesh | undefined, t: number): void {
  moveMovers(draw, plan, t);
  plan.rides.forEach((r, i) => {
    const g = draw.moving.get(`ride-${i}`);
    if (!g) return;
    const [p, heading] = onLoop(r.loop, (t * 0.05 + r.phase) % 1);
    g.position.set(...p);
    g.rotation.y = -heading;
  });
  if (!spots) return;
  (plan.city.pipes ?? []).forEach((q, i) => {
    for (let n = 0; n < PULSES; n++) {
      pos.set(...along(q, (t * 0.3 + i * 0.37 + n / PULSES) % 1));
      at.compose(pos, turn.setFromAxisAngle(up, 0), scale.set(PULSE_R, PULSE_R, PULSE_R));
      spots.setMatrixAt(i * PULSES + n, at);
    }
  });
  spots.instanceMatrix.needsUpdate = true;
}

/** How many flow marks the plan's pipes carry. */
export const pulsesOf = (plan: Plan): number => (plan.city.pipes ?? []).length * PULSES;

/** The plan's fallback wireframe, for a browser without WebGL; kept per seed. */
const wires = new Map<string, Wire>();
export function wireFor(params: P): Wire {
  const key = `${params.board[2]}:${params.salt}`;
  let wire = wires.get(key);
  if (!wire) {
    const { city, w, d, mark } = districtOf(params.board, params.salt);
    wire = wireOf(city, w, d, mark);
    wires.set(key, wire);
  }
  return wire;
}
