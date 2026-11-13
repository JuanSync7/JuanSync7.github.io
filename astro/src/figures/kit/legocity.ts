import type { NightKey } from '../../styles/tokens/palette';
import type { Rng } from './rng';
import { architecture, type Edit, type Voxels } from './legobuildings';

/** The LEGO city is designed as an ordinary isometric city first, a field of voxels (streets,
 *  blocks, a church, a stadium, a domed museum, towers, houses, a factory, lamps, benches, cars),
 *  and only then packed into bricks: `legoCity` returns the voxels (for the smooth model) and
 *  the bricks (for the LEGO) of the same city. */

export interface Brick {
  x: number;
  z: number;
  w: number;
  d: number;
  layer: number;
  tone: NightKey;
  /** When it clicks on during the build, 0..1; the teardown runs the same order backwards. */
  order: number;
  /** Stud cells (offsets inside the brick) with nothing above them. */
  studs: [number, number][];
}
export interface Voxel {
  x: number;
  z: number;
  layer: number;
  tone: NightKey;
  /** Position across the plate, 0 at the front corner to 1 at the back. */
  wave: number;
}
export interface City {
  bricks: Brick[];
  voxels: Voxel[];
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
      const studs: [number, number][] = [];
      for (let i = 0; i < w; i++) {
        for (let j = 0; j < d; j++) {
          left.delete(key(l, x + i, z + j));
          if (!vox.has(key(l + 1, x + i, z + j))) studs.push([i, j]);
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
  const layers = Math.max(...bricks.map((b) => b.layer)) + 1;
  for (const b of bricks) {
    const wave = (b.x + b.z) / (2 * GRID);
    b.order = Math.min(
      1,
      (b.layer === 0 ? 0 : 0.12) + (1 - wave) * 0.3 * (b.layer === 0 ? 0.4 : 1) + (b.layer / layers) * 0.58,
    );
  }
  const voxels: Voxel[] = [...e.vox].map(([k, tone]) => {
    const [layer = 0, x = 0, z = 0] = k.split('|').map(Number);
    return { x, z, layer, tone, wave: (x + z) / (2 * GRID) };
  });
  return { bricks, voxels, layers };
}
