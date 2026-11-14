import type { NightKey } from '../../styles/tokens/palette';
import type { Rng } from './rng';

/** Small parts of the LEGO city: trees, lamps, benches, cars, domes and spires, as voxels. */
type T = NightKey;
export type Voxels = Map<string, NightKey>;
export interface Edit {
  vox: Voxels;
  rng: Rng;
}
export const put = (e: Edit, l: number, x: number, z: number, t: T): void => void e.vox.set(`${l}|${x}|${z}`, t);
export const fill = (e: Edit, l: number, x0: number, z0: number, w: number, d: number, t: T): void => {
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) put(e, l, x, z, t);
};

export function tree(e: Edit, x: number, z: number, tall = 3): void {
  for (let l = 1; l <= tall; l++) put(e, l, x, z, 'line4');
  fill(e, tall + 1, x - 1, z - 1, 3, 3, 'inkSoft');
  fill(e, tall + 2, x - 1, z - 1, 3, 3, 'inkSoft');
  put(e, tall + 3, x, z, 'inkSoft');
}
export const lamp = (e: Edit, x: number, z: number): void => {
  for (let l = 1; l <= 5; l++) put(e, l, x, z, 'inkMuted');
  put(e, 6, x, z, 'signal');
};
export function bench(e: Edit, x: number, z: number, alongX: boolean): void {
  for (let i = 0; i < 3; i++) {
    const [a, b] = alongX ? [x + i, z] : [x, z + i];
    put(e, 1, a, b, 'line4');
    put(e, 2, alongX ? a : a + 1, alongX ? b + 1 : b, 'line4');
  }
}
export function car(e: Edit, x: number, z: number, alongX: boolean, body: T): void {
  const [w, d] = alongX ? [4, 2] : [2, 4];
  fill(e, 1, x, z, w, d, body);
  fill(e, 2, alongX ? x + 1 : x, alongX ? z : z + 1, alongX ? 2 : 2, alongX ? 2 : 2, 'line4');
}
export function dome(e: Edit, cx: number, cz: number, r: number, l0: number, t: T): void {
  for (let k = 0; k < r; k++) {
    const rad = Math.sqrt(r * r - k * k);
    for (let x = -r; x <= r; x++) {
      for (let z = -r; z <= r; z++) {
        const q = Math.hypot(x, z);
        if (q <= rad && (q > rad - 1.2 || k === r - 1)) put(e, l0 + k, cx + x, cz + z, t);
      }
    }
  }
}
/** A stepped spire from its corner (x0, z0), on whole studs: a brick can't sit half a stud over. */
export function spire(e: Edit, x0: number, z0: number, w: number, l0: number, t: T): number {
  let l = l0;
  for (let s = w; s >= 1; s -= 2) {
    const o = Math.floor((w - s) / 2);
    fill(e, l, x0 + o, z0 + o, s, s, t);
    fill(e, l + 1, x0 + o, z0 + o, s, s, t);
    l += 2;
  }
  return l;
}
