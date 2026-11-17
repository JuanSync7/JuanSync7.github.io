import type { NightKey } from '../../styles/tokens/palette.ts';
import { architecture } from './legobuildings.ts';
import { yOf, type Edit } from './legoparts.ts';
import type { Piece } from './legoset.ts';
import type { Shape } from './legoswap.ts';
import type { Rng } from './rng.ts';

/** The LEGO city as a model for the generic pipeline: a 44 x 44 base of real plates, two courses (the root),
 *  the street layer on it (smooth road tiles with pale lane marks, studded pavements and block plates, a
 *  plate wherever a car or lamp stands), nine blocks of buildings planned as voxels and laid as
 *  plates two to a voxel, and the shaped parts (`legoparts.ts`). `cityQueue` gives the build its
 *  nine builders, one per block, and a tenth for the street; the street layer is the base, there
 *  from the first frame. */

export const GRID = 44;
const PITCH = 14;

/** Each layer's voxels of one tone as rectangles, largest first along rows: the plan as blocks. */
function rectangles(cells: Map<string, NightKey>): { x: number; z: number; w: number; d: number; tone: NightKey }[] {
  const left = new Map(cells);
  const out: { x: number; z: number; w: number; d: number; tone: NightKey }[] = [];
  const keys = [...cells.keys()].map((k) => k.split('|').map(Number) as [number, number]);
  keys.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  for (const [x, z] of keys) {
    const tone = left.get(`${x}|${z}`);
    if (!tone) continue;
    let w = 1;
    while (w < 8 && left.get(`${x + w}|${z}`) === tone) w++;
    let d = 1;
    for (;;) {
      let row = d < 8;
      for (let i = 0; row && i < w; i++) row = left.get(`${x + i}|${z + d}`) === tone;
      if (!row) break;
      d++;
    }
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) left.delete(`${x + i}|${z + j}`);
    out.push({ x, z, w, d, tone });
  }
  return out;
}

/** The base under the street layer: two courses of 2 x 8 plates, the lower along x and the upper
 *  across it, each row's seams four studs off the row before so no seam runs through both. A
 *  plate below the street layer, so nothing above moves; there is no 44 x 44 plate to stand in. */
function base(): Shape[] {
  const out: Shape[] = [];
  for (let k = 0; k < GRID; k += 2) {
    let at = 0;
    for (const len of (k / 2) % 2 ? [4, 8, 8, 8, 8, 8] : [8, 8, 8, 8, 8, 4]) {
      out.push({ kind: 'part', part: 'plate', x: at, y: -1, z: k, w: len, d: 2, h: 1, tone: 'line2' });
      out.push({ kind: 'part', part: 'plate', x: k, y: 0, z: at, w: 2, d: len, h: 1, tone: 'line2' });
      at += len;
    }
  }
  return out.map((s, i) => (i === 0 ? { ...s, root: true } : s));
}

const ROAD: NightKey[] = ['line3', 'inkFaint'];

export function cityShapes(rng: Rng): Shape[] {
  const e: Edit = { vox: new Map(), rng, shapes: [], later: [] };
  architecture(e, PITCH, GRID);
  // Parts on the ground stand on the highest voxel under them, or on the street layer.
  const top = (x: number, z: number): number => {
    let l = 0;
    for (const k of e.vox.keys()) {
      const [kl, kx, kz] = k.split('|').map(Number);
      if (kx === x && kz === z && (kl ?? 0) > l) l = kl ?? 0;
    }
    return l;
  };
  const studded = new Set<string>();
  for (const p of e.later) {
    const l = Math.max(...p.cells.map(([x, z]) => top(x, z)));
    if (l === 0) for (const [x, z] of p.cells) studded.add(`${x}|${z}`);
    e.shapes.push(...p.make(yOf(l + 1)));
  }
  const shapes: Shape[] = [...base()];
  // The street layer: roads smooth, everything else (and the road under a car or lamp) studded.
  const street = new Map<string, NightKey>();
  const smooth = new Map<string, NightKey>();
  for (let x = 0; x < GRID; x++) {
    for (let z = 0; z < GRID; z++) {
      const rx = x % PITCH;
      const rz = z % PITCH;
      const road = rx < 2 || rz < 2 || x >= GRID - 2 || z >= GRID - 2;
      const kerb = !road && (rx === 2 || rx === PITCH - 1 || rz === 2 || rz === PITCH - 1);
      const lane = road && ((rx === 0 && z % 4 < 2 && rz >= 2) || (rz === 0 && x % 4 < 2 && rx >= 2));
      const tone: NightKey = lane ? 'inkFaint' : road ? 'line3' : kerb ? 'inkSoft' : 'inkMuted';
      (ROAD.includes(tone) && !studded.has(`${x}|${z}`) ? smooth : street).set(`${x}|${z}`, tone);
    }
  }
  for (const r of rectangles(smooth)) shapes.push({ kind: 'block', ...r, y: 1, h: 1, top: 'tiles' });
  for (const r of rectangles(street)) shapes.push({ kind: 'block', ...r, y: 1, h: 1 });
  // The buildings: each voxel layer two plates, laid in rectangles of one tone.
  const layers = new Map<number, Map<string, NightKey>>();
  for (const [k, tone] of e.vox) {
    const [l, x, z] = k.split('|').map(Number);
    if (l === undefined || l < 1) continue;
    const m = layers.get(l) ?? new Map<string, NightKey>();
    m.set(`${x}|${z}`, tone);
    layers.set(l, m);
  }
  for (const [l, cells] of [...layers].sort((a, b) => a[0] - b[0])) {
    for (const r of rectangles(cells)) shapes.push({ kind: 'block', ...r, y: yOf(l), h: 2, lay: (l % 2 ? 'x' : 'z') }); // prettier-ignore
  }
  return [...shapes, ...e.shapes];
}

/** Which builder lays a piece: the street layer is the base (null), each block has its own
 *  builder, and whatever stands on the roads (cars, corner lamps) is the street builder's. */
export function cityQueue(p: Piece): string | null {
  if (p.y <= 1) return null;
  const cx = p.x + (p.w || 1) / 2;
  const cz = p.z + (p.d || 1) / 2;
  const rx = cx % PITCH;
  const rz = cz % PITCH;
  const road = rx < 2.5 || rz < 2.5 || rx > PITCH - 1 || rz > PITCH - 1;
  return road ? 'street' : `${Math.floor(cx / PITCH)}|${Math.floor(cz / PITCH)}`;
}
