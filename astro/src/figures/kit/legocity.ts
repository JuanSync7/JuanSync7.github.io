import type { NightKey } from '../../styles/tokens/palette';
import type { Rng } from './rng';
import { architecture } from './legobuildings';
import type { Edit, Voxels } from './legoparts';

/** The LEGO city is designed as an ordinary isometric city, a field of voxels (streets, blocks, a
 *  church, a stadium, a domed museum, towers, houses, a factory, lamps, benches, cars), which is
 *  only the plan: what is drawn is that plan packed into bricks. Layer 0 is the baseplate's own
 *  tiles and plates (roads, pavements, blocks), there from the start; every brick above it is
 *  placed by hand, block by block and course by course. */

export interface Brick {
  x: number;
  z: number;
  w: number;
  d: number;
  layer: number;
  tone: NightKey;
  /** When it clicks on during the build, 0..1 (the base is 0); the teardown runs it backwards. */
  order: number;
  /** Every stud on its top, with the brick that later covers it (-1: none, it stays visible). */
  studs: { at: [number, number]; cover: number }[];
}
export interface City {
  bricks: Brick[];
  layers: number;
}

export const GRID = 44;
const PITCH = 14;
const key = (l: number, x: number, z: number): string => `${l}|${x}|${z}`;

/** Packs each layer's voxels into bricks, largest first, one tone per brick. */
function pack(vox: Voxels): Brick[] {
  const out: Brick[] = [];
  const left = new Map(vox);
  const SIZES: [number, number][] = [
    [4, 2],
    [2, 4],
    [3, 2],
    [2, 3],
    [2, 2],
    [4, 1],
    [1, 4],
    [2, 1],
    [1, 2],
    [1, 1],
  ];
  const cells = [...vox.keys()].map((k) => k.split('|').map(Number) as [number, number, number]);
  cells.sort((a, b) => a[0] - b[0] || a[2] - b[2] || a[1] - b[1]);
  for (const [l, x, z] of cells) {
    const tone = left.get(key(l, x, z));
    if (!tone) continue;
    for (const [w, d] of SIZES) {
      let ok = true;
      for (let i = 0; i < w && ok; i++) for (let j = 0; j < d && ok; j++) ok = left.get(key(l, x + i, z + j)) === tone;
      if (!ok) continue;
      const studs: Brick['studs'] = [];
      for (let i = 0; i < w; i++) {
        for (let j = 0; j < d; j++) {
          left.delete(key(l, x + i, z + j));
          studs.push({ at: [i, j], cover: -1 });
        }
      }
      out.push({ x, z, w, d, layer: l, tone, order: 0, studs });
      break;
    }
  }
  return out;
}

export function legoCity(rng: Rng): City {
  const e: Edit = { vox: new Map(), rng };
  // The ground: streets two studs wide in the darkest grey with a pale lane mark, blocks on
  // a mid plate edged by a pale pavement.
  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const rx = x % PITCH;
      const rz = z % PITCH;
      const road = rx < 2 || rz < 2 || x >= GRID - 2 || z >= GRID - 2;
      const kerb = !road && (rx === 2 || rx === PITCH - 1 || rz === 2 || rz === PITCH - 1);
      const lane =
        road && ((rx < 2 && rx === 0 && z % 4 < 2 && rz >= 2) || (rz < 2 && rz === 0 && x % 4 < 2 && rx >= 2));
      e.vox.set(key(0, x, z), lane ? 'inkFaint' : road ? 'line3' : kerb ? 'inkSoft' : 'inkMuted');
    }
  }
  architecture(e, PITCH, GRID);
  const bricks = pack(e.vox);
  // Road tiles are smooth; every other part has studs, hidden while a brick sits on them.
  const at = new Map<string, number>();
  bricks.forEach((b, i) => {
    for (let a = 0; a < b.w; a++) for (let c = 0; c < b.d; c++) at.set(key(b.layer, b.x + a, b.z + c), i);
  });
  for (const b of bricks) {
    if (b.layer === 0 && (b.tone === 'line3' || b.tone === 'inkFaint')) b.studs = [];
    for (const s of b.studs) s.cover = at.get(key(b.layer + 1, b.x + s.at[0], b.z + s.at[1])) ?? -1;
  }
  // Every brick sits on whole studs and on the plate: half a stud over, or past the edge, is a
  // brick no builder could place.
  for (const b of bricks) {
    const off =
      [b.x, b.z].some((v) => !Number.isInteger(v)) || b.x < 0 || b.z < 0 || b.x + b.w > GRID || b.z + b.d > GRID;
    if (off) throw new Error(`bounds: a brick at ${b.x},${b.z} (layer ${b.layer}) is off the studs or the plate`);
  }
  buildOrder(bricks);
  return { bricks, layers: Math.max(...bricks.map((b) => b.layer)) + 1 };
}

/** The build, as nine builders at once: one per block, each laying its block course by course,
 *  back to front within a course (so a new brick is never hidden behind the last), from the start of the build to the end; the street furniture
 *  (cars, lamps on the roads) is a tenth queue. The base is there before anyone starts. */
function buildOrder(bricks: Brick[]): void {
  const queues = new Map<string, Brick[]>();
  for (const b of bricks) {
    if (b.layer === 0) continue;
    const cx = b.x + b.w / 2;
    const cz = b.z + b.d / 2;
    const rx = cx % PITCH;
    const rz = cz % PITCH;
    const street = rx < 2.5 || rz < 2.5 || rx > PITCH - 1 || rz > PITCH - 1;
    const q = street ? 'street' : `${Math.floor(cx / PITCH)}|${Math.floor(cz / PITCH)}`;
    queues.set(q, [...(queues.get(q) ?? []), b]);
  }
  queues.forEach((list) => {
    list.sort((a, b) => a.layer - b.layer || a.z - b.z || a.x - b.x);
    list.forEach((b, i) => (b.order = 0.02 + (0.96 * i) / Math.max(1, list.length - 1)));
  });
}
