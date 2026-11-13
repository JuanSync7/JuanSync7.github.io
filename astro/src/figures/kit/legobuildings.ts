import type { NightKey } from '../../styles/tokens/palette';
type T = NightKey;
import { bench, car, dome, fill, lamp, put, spire, tree, type Edit } from './legoparts';

/** The architecture of the LEGO city: nine blocks of ten by ten studs, each its own building
 *  type, and the street furniture between them. Everything is voxels (layer, x, z) -> tone. */

/** Storeys as walls (the cap is solid), with a window every other storey and column. */
function tower(
  e: Edit,
  x0: number,
  z0: number,
  w: number,
  d: number,
  from: number,
  to: number,
  body: T,
  glass: T = 'line4',
): void {
  for (let l = from; l <= to; l++) {
    for (let x = x0; x < x0 + w; x++) {
      for (let z = z0; z < z0 + d; z++) {
        const edge = x === x0 || x === x0 + w - 1 || z === z0 || z === z0 + d - 1;
        const corner = (x === x0 || x === x0 + w - 1) && (z === z0 || z === z0 + d - 1);
        const win = l > from && l < to && l % 3 !== 0 && !corner && (x + z) % 2 === 0;
        if (l === to || edge) put(e, l, x, z, win ? glass : body);
      }
    }
  }
}

/** A gable roof along x (or z) that closes in one row per layer. */
function gable(e: Edit, x0: number, z0: number, w: number, d: number, l0: number, t: T, alongX = true): void {
  const span = alongX ? d : w;
  for (let k = 0; k * 2 < span; k++) {
    for (let a = 0; a < (alongX ? w : d); a++) {
      for (const s of [k, span - 1 - k]) put(e, l0 + k, alongX ? x0 + a : x0 + s, alongX ? z0 + s : z0 + a, t);
    }
  }
}

type Kind = 'twin' | 'church' | 'slab' | 'park' | 'skyscraper' | 'stadium' | 'houses' | 'museum' | 'factory';
const PLAN: Kind[][] = [
  ['twin', 'church', 'slab'],
  ['park', 'skyscraper', 'stadium'],
  ['houses', 'museum', 'factory'],
];

function block(e: Edit, kind: Kind, x: number, z: number): void {
  const r = e.rng;
  if (kind === 'skyscraper') {
    tower(e, x, z, 10, 10, 1, 4, 'inkSoft');
    fill(e, 5, x, z, 10, 1, 'signal');
    tower(e, x + 1, z + 1, 8, 8, 5, 16, 'ink2');
    tower(e, x + 2, z + 2, 6, 6, 17, 26, 'ink2');
    tower(e, x + 3, z + 3, 4, 4, 27, 33, 'inkSoft');
    spire(e, x + 4, z + 4, 2, 34, 'inkMuted');
    for (let l = 39; l <= 46; l++) put(e, l, x + 4, z + 4, l === 46 ? 'signal' : 'inkMuted');
  } else if (kind === 'twin') {
    fill(e, 1, x, z, 10, 10, 'inkSoft');
    tower(e, x, z, 4, 4, 2, 22 + Math.floor(r() * 3), 'ink2');
    tower(e, x + 6, z + 6, 4, 4, 2, 15 + Math.floor(r() * 3), 'inkSoft');
    fill(e, 11, x + 4, z + 1, 2, 2, 'line4');
    tower(e, x + 3, z + 5, 4, 2, 10, 12, 'inkMuted');
    put(e, 23, x + 1, z + 1, 'signal');
    tree(e, x + 8, z + 1, 2);
  } else if (kind === 'slab') {
    tower(e, x, z + 2, 10, 5, 1, 14, 'ink2');
    for (let l = 3; l <= 13; l += 3) for (let a = 1; a < 10; a += 3) fill(e, l, x + a, z + 7, 2, 1, 'line4');
    fill(e, 15, x + 1, z + 3, 8, 3, 'inkMuted');
    for (let a = 0; a < 3; a++) tree(e, x + 2 + a * 3, z + 4, 1);
    tower(e, x + 6, z + 3, 3, 3, 16, 18, 'line4');
    gable(e, x + 6, z + 3, 3, 3, 19, 'inkMuted');
    lamp(e, x + 1, z + 8);
    bench(e, x + 4, z + 9, true);
  } else if (kind === 'park') {
    fill(e, 1, x + 3, z + 3, 4, 4, 'line4');
    fill(e, 1, x, z + 4, 10, 2, 'inkSoft');
    fill(e, 1, x + 4, z, 2, 10, 'inkSoft');
    fill(e, 1, x + 4, z + 4, 2, 2, 'ink2');
    put(e, 2, x + 4, z + 4, 'signal');
    tree(e, x + 1, z + 1, 4);
    tree(e, x + 8, z + 1, 3);
    tree(e, x + 1, z + 8, 3);
    tree(e, x + 8, z + 8, 4);
    bench(e, x + 1, z + 3, true);
    bench(e, x + 7, z + 6, true);
    lamp(e, x + 3, z + 3);
    lamp(e, x + 6, z + 6);
  } else if (kind === 'church') {
    tower(e, x + 1, z + 3, 4, 7, 1, 5, 'inkSoft');
    gable(e, x + 1, z + 3, 4, 7, 6, 'inkMuted', false);
    tower(e, x + 1, z, 4, 4, 1, 12, 'ink2');
    const top = spire(e, x + 2, z + 1, 2, 13, 'inkMuted');
    for (let l = top; l < top + 3; l++) put(e, l, x + 2, z + 1, l === top + 2 ? 'signal' : 'inkMuted');
    fill(e, 1, x + 6, z + 3, 4, 7, 'inkMuted');
    tree(e, x + 8, z + 4, 3);
    tree(e, x + 8, z + 8, 2);
    lamp(e, x + 6, z + 1);
  } else if (kind === 'stadium') {
    fill(e, 1, x, z + 1, 10, 8, 'inkSoft');
    fill(e, 1, x + 2, z + 3, 6, 4, 'inkMuted');
    for (let k = 0; k < 3; k++) {
      for (let a = k; a < 10 - k; a++)
        for (const s of [z + 1 + k, z + 8 - k]) put(e, 2 + k, x + a, s, k === 2 ? 'ink2' : 'inkSoft');
      for (let s = z + 1 + k; s <= z + 8 - k; s++)
        for (const a of [x + k, x + 9 - k]) put(e, 2 + k, a, s, k === 2 ? 'ink2' : 'inkSoft');
    }
    for (const [a, b] of [
      [x, z],
      [x + 9, z],
      [x, z + 9],
      [x + 9, z + 9],
    ] as const)
      for (let l = 1; l <= 7; l++) put(e, l, a, b, l === 7 ? 'signal' : 'inkMuted');
    fill(e, 2, x + 4, z + 3, 2, 4, 'inkFaint');
  } else if (kind === 'houses') {
    for (const [a, b, hx, t] of [
      [0, 0, true, 'inkSoft'],
      [5, 0, false, 'ink2'],
      [0, 5, false, 'ink2'],
      [5, 5, true, 'inkSoft'],
    ] as const) {
      tower(e, x + a, z + b, 5, 5, 1, 5, t);
      gable(e, x + a, z + b, 5, 5, 6, hx ? 'signal' : 'line4', hx);
      for (let l = 6; l < 9; l++) put(e, l, x + a + 3, z + b + 1, 'line4');
    }
    tree(e, x + 4, z + 4, 2);
  } else if (kind === 'museum') {
    fill(e, 1, x, z, 10, 10, 'ink2');
    tower(e, x + 1, z + 1, 8, 8, 2, 5, 'inkSoft');
    for (let a = 1; a < 10; a += 2) for (let l = 2; l <= 5; l++) put(e, l, x + a, z, 'ink2');
    fill(e, 6, x + 1, z, 8, 1, 'inkMuted');
    dome(e, x + 5, z + 5, 4, 6, 'inkMuted');
    for (let l = 10; l <= 13; l++) put(e, l, x + 5, z + 5, l === 13 ? 'signal' : 'inkMuted');
    lamp(e, x, z + 9);
    lamp(e, x + 9, z + 9);
  } else {
    for (let a = 0; a < 3; a++) {
      tower(e, x, z + a * 3, 7, 3, 1, 4, 'inkSoft');
      gable(e, x, z + a * 3, 7, 3, 5, a % 2 ? 'inkMuted' : 'line4', false);
    }
    for (const [a, b] of [
      [7, 1],
      [7, 6],
    ] as const) {
      tower(e, x + a, z + b, 3, 3, 1, 15, 'ink2');
      fill(e, 16, x + a, z + b, 3, 3, 'signal');
    }
    fill(e, 1, x + 8, z + 4, 2, 1, 'line4');
  }
}

export function architecture(e: Edit, pitch: number, grid: number): void {
  PLAN.forEach((row, i) => row.forEach((kind, j) => block(e, kind, 3 + i * pitch, 3 + j * pitch)));
  // Street furniture on the roads between blocks: cars in the lanes, lamps on the kerbs.
  const tones: NightKey[] = ['ink2', 'inkSoft', 'inkStrong', 'signal', 'inkMuted'];
  let n = 0;
  for (let s = 5; s < grid - 6; s += 7) {
    for (let r = 0; r < 4; r++) {
      const lane = r * pitch;
      if ((s + r) % 3 === 0) continue;
      const t = tones[n++ % tones.length] ?? 'ink2';
      if (r % 2 === 0) car(e, s, lane, true, t);
      else car(e, lane, s, false, t);
    }
  }
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) lamp(e, 2 + i * pitch, 2 + j * pitch);
}
