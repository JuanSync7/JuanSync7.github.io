/** Small objects built from voxels: a cup, a tree, a house, a mushroom, a server, a rocket.
 *  Each is a map of cells to tones, its size in cells, and the cells that change over time
 *  (steam, lights, flame), for a figure to draw block by block. */

export const KINDS = ['cup', 'tree', 'house', 'mushroom', 'server', 'rocket'] as const;
export type Kind = (typeof KINDS)[number];
export type Tone = 'body' | 'dark' | 'hot';

export interface VoxelSpec {
  kind: Kind;
  a: number;
  b: number;
  turn: number;
}

export interface VoxelModel {
  vox: Map<string, Tone>;
  size: number;
  /** Cells that change over time: steam, lights, flame. Drawn over the model each frame. */
  live: [number, number, number][];
}

const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;

export function buildVoxels(p: VoxelSpec, rng: () => number): VoxelModel {
  const vox = new Map<string, Tone>();
  const live: [number, number, number][] = [];
  const set = (x: number, y: number, z: number, t: Tone = 'body'): void => void vox.set(key(x, y, z), t);
  const disc = (cx: number, cz: number, y: number, r: number, t: Tone = 'body', hollow = false): void => {
    for (let x = -r; x <= r; x++)
      for (let z = -r; z <= r; z++) {
        const d = Math.hypot(x, z);
        if (d <= r + 0.3 && (!hollow || d > r - 0.9)) set(cx + x, y, cz + z, t);
      }
  };
  let size = 10;
  switch (p.kind) {
    case 'cup': {
      const r = 3 + Math.round(p.a);
      for (let y = 0; y < 5 + Math.round(p.b * 2); y++) disc(0, 0, y, r, 'body', y > 0);
      disc(0, 0, 4 + Math.round(p.b * 2) - 1, r - 1, 'hot');
      for (let y = 1; y < 4; y++) set(r + 1, y, 0, 'dark');
      set(r + 2, 2, 0, 'dark');
      disc(0, 0, -1, r + 2, 'dark');
      for (let k = 0; k < 6; k++) live.push([Math.round((rng() - 0.5) * r), 7 + k, Math.round((rng() - 0.5) * r)]);
      size = r * 2 + 6;
      break;
    }
    case 'tree': {
      const h = 4 + Math.round(p.a * 3);
      for (let y = 0; y < h; y++) set(0, y, 0, 'dark');
      const R = 3 + Math.round(p.b * 2);
      for (let x = -R; x <= R; x++)
        for (let y = -R; y <= R; y++)
          for (let z = -R; z <= R; z++) {
            if (Math.hypot(x, y * 1.2, z) < R + rng() * 0.8) set(x, h + y, z, 'body');
          }
      // One fruit, on the side that faces the viewer.
      set(Math.round(R * 0.7), h, Math.round(R * 0.7), 'hot');
      disc(0, 0, -1, R + 1, 'dark');
      size = R * 2 + 4;
      break;
    }
    case 'house': {
      const W = 4 + Math.round(p.a * 2);
      const H = 3 + Math.round(p.b * 2);
      for (let x = -W; x <= W; x++)
        for (let z = -3; z <= 3; z++)
          for (let y = 0; y < H; y++) if (Math.abs(x) === W || Math.abs(z) === 3 || y === 0) set(x, y, z);
      for (let k = 0; k <= 4; k++)
        for (let x = -W - 1; x <= W + 1; x++)
          for (let z = -4 + k; z <= 4 - k; z++) if (Math.abs(z) === 4 - k) set(x, H + k, z, 'dark');
      // Gable ends close the roof, so it reads as a pitched roof and not a stack of rails.
      for (let k = 0; k < 4; k++) for (let z = -3 + k; z <= 3 - k; z++) for (const x of [-W, W]) set(x, H + k, z);
      for (let y = H + 1; y < H + 5; y++) set(W - 2, y, -1, 'dark');
      set(-W + 2, 1, 3, 'hot');
      set(-W + 2, 2, 3, 'hot');
      set(W - 2, 1, 3, 'dark');
      size = W * 2 + 6;
      break;
    }
    case 'mushroom': {
      const h = 3 + Math.round(p.a * 3);
      for (let y = 0; y < h; y++) disc(0, 0, y, 1);
      const R = 4 + Math.round(p.b * 2);
      for (let y = 0; y < 3; y++) disc(0, 0, h + y, R - y * 1.5, 'dark');
      for (let k = 0; k < 5; k++)
        set(Math.round((rng() - 0.5) * R), h + 1 + Math.round(rng()), Math.round((rng() - 0.5) * R), 'hot');
      size = R * 2 + 4;
      break;
    }
    case 'server': {
      const U = 4 + Math.round(p.a * 3);
      for (let y = 0; y < U * 2; y++)
        for (let x = -3; x <= 3; x++)
          for (let z = -2; z <= 2; z++)
            if (Math.abs(x) === 3 || Math.abs(z) === 2 || y % 2 === 0) set(x, y, z, y % 2 === 0 ? 'dark' : 'body');
      for (let u = 0; u < U; u++) live.push([2, u * 2 + 1, 3]);
      size = 12;
      break;
    }
    case 'rocket': {
      const h = 8 + Math.round(p.a * 4);
      for (let y = 2; y < h; y++) disc(0, 0, y, y > h - 3 ? 1 : 2);
      set(0, h, 0, 'dark');
      for (const [x, z] of [
        [3, 0],
        [-3, 0],
        [0, 3],
        [0, -3],
      ] as const)
        for (let y = 2; y < 5; y++) set(x, y, z, 'dark');
      set(0, h - 4, 2, 'hot');
      for (let k = 0; k < 6; k++) live.push([Math.round((rng() - 0.5) * 2), 1, Math.round((rng() - 0.5) * 2)]);
      size = Math.round(h * 0.8) + 4;
      break;
    }
  }
  return { vox, size, live };
}
