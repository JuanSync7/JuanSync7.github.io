import { defineTemplate } from '../defineTemplate';
import { ink, mix } from '../kit/ink';
import { clamp } from '../kit/motion';
import { between, pick } from '../kit/rng';

/** Small isometric voxel objects, flat-shaded block by block like MagicaVoxel models: a cup
 *  with steam, a tree, a house, a mushroom, a server with blinking lights, a rocket. One
 *  part is the signal. The pointer turns the model a quarter at a time. */

const KINDS = ['cup', 'tree', 'house', 'mushroom', 'server', 'rocket'] as const;
type Kind = (typeof KINDS)[number];
type Tone = 'body' | 'dark' | 'hot';

interface P {
  kind: Kind;
  a: number;
  b: number;
  turn: number;
}

interface S {
  vox: Map<string, Tone>;
  size: number;
  /** Cells that change over time: steam, lights, flame. Drawn over the model each frame. */
  live: [number, number, number][];
}

const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;

function build(p: P, rng: () => number): S {
  const vox = new Map<string, Tone>();
  const live: [number, number, number][] = [];
  const set = (x: number, y: number, z: number, t: Tone = 'body'): void => void vox.set(key(x, y, z), t);
  const disc = (cx: number, cz: number, y: number, r: number, t: Tone = 'body', hollow = false): void => {
    for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) {
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
      for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) for (let z = -R; z <= R; z++) {
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
      for (let x = -W; x <= W; x++) for (let z = -3; z <= 3; z++) for (let y = 0; y < H; y++) if (Math.abs(x) === W || Math.abs(z) === 3 || y === 0) set(x, y, z);
      for (let k = 0; k <= 4; k++) for (let x = -W - 1; x <= W + 1; x++) for (let z = -4 + k; z <= 4 - k; z++) if (Math.abs(z) === 4 - k) set(x, H + k, z, 'dark');
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
      for (let k = 0; k < 5; k++) set(Math.round((rng() - 0.5) * R), h + 1 + Math.round(rng()), Math.round((rng() - 0.5) * R), 'hot');
      size = R * 2 + 4;
      break;
    }
    case 'server': {
      const U = 4 + Math.round(p.a * 3);
      for (let y = 0; y < U * 2; y++) for (let x = -3; x <= 3; x++) for (let z = -2; z <= 2; z++) if (Math.abs(x) === 3 || Math.abs(z) === 2 || y % 2 === 0) set(x, y, z, y % 2 === 0 ? 'dark' : 'body');
      for (let u = 0; u < U; u++) live.push([2, u * 2 + 1, 3]);
      size = 12;
      break;
    }
    case 'rocket': {
      const h = 8 + Math.round(p.a * 4);
      for (let y = 2; y < h; y++) disc(0, 0, y, y > h - 3 ? 1 : 2);
      set(0, h, 0, 'dark');
      for (const [x, z] of [[3, 0], [-3, 0], [0, 3], [0, -3]] as const) for (let y = 2; y < 5; y++) set(x, y, z, 'dark');
      set(0, h - 4, 2, 'hot');
      for (let k = 0; k < 6; k++) live.push([Math.round((rng() - 0.5) * 2), 1, Math.round((rng() - 0.5) * 2)]);
      size = Math.round(h * 0.8) + 4;
      break;
    }
  }
  return { vox, size, live };
}

export default defineTemplate<P, S>({
  id: 'voxel-scene',
  title: 'Voxel scene',
  idea: 'A small object built from voxels, flat-shaded like a toy, with one part alive: steam rising off a cup, a server’s lights, a rocket’s exhaust.',
  style: 'pixel',
  motion: 'ambient',
  answers: true,
  aspect: 2,
  grammar: (rng) => ({ kind: pick(rng, KINDS), a: rng(), b: rng(), turn: Math.floor(between(rng, 0, 4)) }),
  name: (p) => p.kind,
  alt: (p) => `An isometric voxel ${p.kind} made of small grey shaded cubes, with a few teal blocks and a little movement.`,
  setup: ({ rng, params }) => build(params, rng),
  draw: ({ ctx, w, h, t, pointer, hover, params, state }) => {
    // The pointer always turns the piece by at least a quarter, so a symmetric one still answers.
    const quarter = (params.turn + (pointer.active && hover > 0.3 ? 1 + Math.floor(pointer.x * 3) : 0)) % 4;
    const c = Math.max(3, Math.floor(Math.min(w / (state.size * 1.8), h / (state.size * 1.35))));
    const rot = (x: number, z: number): [number, number] => {
      let a = x;
      let b = z;
      for (let i = 0; i < quarter; i++) [a, b] = [-b, a];
      return [a, b];
    };
    // The piece floats: a slow bob, and it rises a little under the pointer.
    const bob = Math.round(Math.sin(t * 1.4) * c * 0.35 - hover * c * 0.6);
    const ox = Math.round(w / 2);
    const oy = Math.round(h * 0.6) + bob;
    const iso = (x: number, y: number, z: number): [number, number] => [ox + (x - z) * c, oy + (x + z) * (c / 2) - y * c];
    const cells = [...state.vox.entries()].map(([k, tone]) => {
      const [x0, y, z0] = k.split(',').map(Number) as [number, number, number];
      const [x, z] = rot(x0, z0);
      return { x, y, z, tone };
    });
    cells.sort((m, n) => m.x + m.z - (n.x + n.z) || m.y - n.y);
    const face = (pts: [number, number][], fill: string): void => {
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    };
    for (const v of cells) {
      const top = iso(v.x, v.y + 1, v.z);
      const [tx, ty] = top;
      const hot = v.tone === 'hot';
      const base = v.tone === 'dark' ? 0.55 : 1;
      face([[tx, ty], [tx + c, ty + c / 2], [tx, ty + c], [tx - c, ty + c / 2]], hot ? ink.signal(0.95) : mix('ground', 'line4', 0.95 * base));
      face([[tx - c, ty + c / 2], [tx, ty + c], [tx, ty + 2 * c], [tx - c, ty + 1.5 * c]], hot ? mix('signalLine', 'signal', 0.55) : mix('ground', 'line4', 0.6 * base));
      face([[tx, ty + c], [tx + c, ty + c / 2], [tx + c, ty + 1.5 * c], [tx, ty + 2 * c]], hot ? mix('signalLine', 'signal', 0.3) : mix('ground', 'line4', 0.38 * base));
    }
    state.live.forEach(([x0, y, z0], i) => {
      const [x, z] = rot(x0, z0);
      const phase = (t * (params.kind === 'server' ? 1.5 : 2.2) + i * 0.37) % 1;
      const on = params.kind === 'server' ? Math.sin(t * 3 + i * 2.1) > 0.2 : true;
      if (!on) return;
      const dy = params.kind === 'server' ? 0 : params.kind === 'rocket' ? -phase * 2 : phase * 4;
      const [px, py] = iso(x, y + dy, z);
      const s = Math.max(2, Math.floor(c * (params.kind === 'server' ? 0.6 : 0.8)));
      ctx.fillStyle = params.kind === 'server' && i % 3 === 0 ? ink.signal(0.95) : ink.line(clamp(0.7 - (params.kind === 'server' ? 0 : phase * 0.6), 0, 1));
      ctx.fillRect(Math.round(px - s / 2), Math.round(py + c / 2), s, s);
    });
    return pointer.active ? `${params.kind} · quarter ${quarter}` : 'rest';
  },
});
