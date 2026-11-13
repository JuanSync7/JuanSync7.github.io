import type { NightKey } from '../../styles/tokens/palette';
import type { Rng } from './rng';

/** The LEGO city is designed as an ordinary isometric city first (streets, blocks, a park, a
 *  plaza, stepped towers with window rows, apartment slabs, houses with roofs, trees) as a
 *  field of voxels, and only then packed into bricks: `legoCity` returns the bricks. */

export interface Brick {
  x: number;
  z: number;
  w: number;
  d: number;
  layer: number;
  tone: NightKey;
  /** When it clicks on during the build, 0..1; the teardown runs the same order backwards. */
  order: number;
}

export const GRID = 22;
const PITCH = 7;
type Voxels = Map<string, NightKey>;
const key = (l: number, x: number, z: number): string => `${l}|${x}|${z}`;

interface Edit {
  vox: Voxels;
  rng: Rng;
}
const put = (e: Edit, l: number, x: number, z: number, tone: NightKey): void => void e.vox.set(key(l, x, z), tone);

/** A hollow storey ring (and a full cap on the last) with a window pattern on the walls. */
function tower(
  e: Edit,
  x0: number,
  z0: number,
  w: number,
  d: number,
  from: number,
  to: number,
  tone: NightKey,
  glass: NightKey,
): void {
  for (let l = from; l <= to; l++) {
    for (let x = x0; x < x0 + w; x++) {
      for (let z = z0; z < z0 + d; z++) {
        const wall = x === x0 || x === x0 + w - 1 || z === z0 || z === z0 + d - 1;
        const window = l > from && l < to && (l - from) % 2 === 1 && (x + z) % 2 === 0 && !(x === x0 && z === z0);
        if (l === to || wall) put(e, l, x, z, window ? glass : tone);
      }
    }
  }
}

function tree(e: Edit, x: number, z: number): void {
  put(e, 1, x, z, 'line4');
  put(e, 2, x, z, 'line4');
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) put(e, 3, x + dx, z + dz, 'inkSoft');
  put(e, 4, x, z, 'inkSoft');
}

function house(e: Edit, x0: number, z0: number, tone: NightKey, roof: NightKey): void {
  tower(e, x0, z0, 3, 3, 1, 3, tone, 'line4');
  for (let x = x0; x < x0 + 3; x++) for (let z = z0 + 1; z < z0 + 2; z++) put(e, 4, x, z, roof);
  for (let x = x0; x < x0 + 3; x++) for (let z = z0; z < z0 + 3; z += 2) put(e, 4, x, z, roof);
  put(e, 5, x0 + 1, z0 + 1, roof);
}

type Kind = 'skyscraper' | 'slab' | 'park' | 'houses' | 'plaza' | 'twin';
const PLAN: Kind[][] = [
  ['twin', 'houses', 'slab'],
  ['park', 'skyscraper', 'plaza'],
  ['slab', 'houses', 'twin'],
];

function block(e: Edit, kind: Kind, x0: number, z0: number): void {
  const r = e.rng;
  if (kind === 'skyscraper') {
    tower(e, x0, z0, 6, 6, 1, 8, 'ink2', 'line4');
    tower(e, x0 + 1, z0 + 1, 4, 4, 9, 15, 'ink2', 'line4');
    tower(e, x0 + 2, z0 + 2, 2, 2, 16, 20, 'inkSoft', 'line4');
    for (let l = 21; l <= 24; l++) put(e, l, x0 + 2, z0 + 2, l === 24 ? 'signal' : 'inkMuted');
  } else if (kind === 'twin') {
    tower(e, x0, z0, 3, 3, 1, 9 + Math.floor(r() * 3), 'inkSoft', 'line4');
    tower(e, x0 + 3, z0 + 3, 3, 3, 1, 6 + Math.floor(r() * 3), 'ink2', 'line4');
    for (let x = x0; x < x0 + 6; x++)
      for (let z = z0; z < z0 + 6; z++) if (!e.vox.has(key(1, x, z))) put(e, 1, x, z, 'inkMuted');
    put(e, 11, x0 + 1, z0 + 1, 'signal');
  } else if (kind === 'slab') {
    tower(e, x0, z0 + 1, 6, 3, 1, 5, 'ink2', 'line4');
    tower(e, x0 + 3, z0 + 1, 3, 3, 6, 7, 'inkSoft', 'line4');
    put(e, 8, x0 + 4, z0 + 2, 'signal');
    for (let x = x0; x < x0 + 6; x++) put(e, 1, x, z0 + 5, 'inkMuted');
  } else if (kind === 'houses') {
    house(e, x0, z0, 'inkSoft', 'signal');
    house(e, x0 + 3, z0 + 3, 'ink2', 'line4');
    tree(e, x0 + 4, z0 + 1);
  } else if (kind === 'park') {
    for (let x = x0; x < x0 + 6; x++) for (let z = z0; z < z0 + 6; z++) put(e, 1, x, z, 'inkMuted');
    tree(e, x0 + 1, z0 + 1);
    tree(e, x0 + 4, z0 + 2);
    tree(e, x0 + 2, z0 + 4);
    for (let x = x0 + 4; x < x0 + 6; x++) put(e, 1, x, z0 + 5, 'line4');
  } else {
    for (let x = x0; x < x0 + 6; x++)
      for (let z = z0; z < z0 + 6; z++) put(e, 1, x, z, (x + z) % 2 ? 'inkSoft' : 'ink2');
    for (let dx = 1; dx <= 4; dx++)
      for (let dz = 1; dz <= 4; dz++)
        if (dx === 1 || dx === 4 || dz === 1 || dz === 4) put(e, 2, x0 + dx, z0 + dz, 'inkMuted');
    put(e, 3, x0 + 2, z0 + 2, 'signal');
    put(e, 3, x0 + 3, z0 + 3, 'signal');
  }
}

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
      for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) left.delete(key(l, x + i, z + j));
      out.push({ x, z, w, d, layer: l, tone, order: 0 });
      break;
    }
  }
  return out;
}

export function legoCity(rng: Rng): Brick[] {
  const e: Edit = { vox: new Map(), rng };
  // The ground: streets in the darkest grey with a pale lane mark, blocks on light plates.
  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const road = x % PITCH === 0 || z % PITCH === 0;
      const lane =
        road &&
        ((x % PITCH === 0 && z % 2 === 0 && z % PITCH !== 0) || (z % PITCH === 0 && x % 2 === 0 && x % PITCH !== 0));
      put(e, 0, x, z, lane ? 'inkFaint' : road ? 'line3' : 'inkMuted');
    }
  }
  PLAN.forEach((row, i) => row.forEach((kind, j) => block(e, kind, 1 + i * PITCH, 1 + j * PITCH)));
  // Shift to the plate's centre.
  const shifted = new Map<string, NightKey>();
  e.vox.forEach((t, k) => shifted.set(k, t));
  const bricks = pack(shifted).map((b) => ({ ...b, x: b.x - GRID / 2, z: b.z - GRID / 2 }));
  const maxLayer = Math.max(...bricks.map((b) => b.layer));
  for (const b of bricks) {
    const wave = (b.x + b.z + GRID) / (2 * GRID);
    b.order = Math.min(
      1,
      (b.layer === 0 ? 0 : 0.16) + (1 - wave) * 0.34 * (b.layer === 0 ? 0.4 : 1) + (b.layer / (maxLayer + 1)) * 0.5,
    );
  }
  return bricks;
}
