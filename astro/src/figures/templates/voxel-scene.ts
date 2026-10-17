import { defineTemplate } from '../defineTemplate';
import { ink, mix } from '../kit/ink';
import { clamp } from '../kit/motion';
import { between, pick } from '../kit/rng';
import { buildVoxels, KINDS, type VoxelModel, type VoxelSpec } from '../kit/voxels';

/** Small isometric voxel objects, flat-shaded block by block like MagicaVoxel models: a cup
 *  with steam, a tree, a house, a mushroom, a server with blinking lights, a rocket. One
 *  part is the signal. The pointer turns the model a quarter at a time. The models are built
 *  in `kit/voxels.ts`. */

type P = VoxelSpec;
type S = VoxelModel;

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
  alt: (p) =>
    `An isometric voxel ${p.kind} made of small grey shaded cubes, with a few teal blocks and a little movement.`,
  setup: ({ rng, params }) => buildVoxels(params, rng),
  draw: ({ ctx, w, h, t, pointer, hover, params, state }) => {
    // The pointer always turns the piece by at least a quarter, so a symmetric one still answers.
    const quarter = (params.turn + (pointer.active && hover > 0.3 ? 1 + Math.floor(pointer.x * 3) : 0)) % 4;
    const c = Math.max(3, Math.floor(Math.min(w / (state.size * 2.1), h / (state.size * 1.6))));
    const rot = (x: number, z: number): [number, number] => {
      let a = x;
      let b = z;
      for (let i = 0; i < quarter; i++) [a, b] = [-b, a];
      return [a, b];
    };
    // The piece floats: a slow bob, and it rises a little under the pointer.
    const bob = Math.round(Math.sin(t * 1.4) * c * 0.35 - hover * c * 0.6);
    const ox = Math.round(w / 2);
    const oy = Math.round(h * 0.66) + bob;
    const iso = (x: number, y: number, z: number): [number, number] => [
      ox + (x - z) * c,
      oy + (x + z) * (c / 2) - y * c,
    ];
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
      face(
        [
          [tx, ty],
          [tx + c, ty + c / 2],
          [tx, ty + c],
          [tx - c, ty + c / 2],
        ],
        hot ? ink.signal(0.95) : mix('ground', 'line4', 0.95 * base),
      );
      face(
        [
          [tx - c, ty + c / 2],
          [tx, ty + c],
          [tx, ty + 2 * c],
          [tx - c, ty + 1.5 * c],
        ],
        hot ? mix('signalLine', 'signal', 0.55) : mix('ground', 'line4', 0.6 * base),
      );
      face(
        [
          [tx, ty + c],
          [tx + c, ty + c / 2],
          [tx + c, ty + 1.5 * c],
          [tx, ty + 2 * c],
        ],
        hot ? mix('signalLine', 'signal', 0.3) : mix('ground', 'line4', 0.38 * base),
      );
    }
    state.live.forEach(([x0, y, z0], i) => {
      const [x, z] = rot(x0, z0);
      const phase = (t * (params.kind === 'server' ? 1.5 : 2.2) + i * 0.37) % 1;
      const on = params.kind === 'server' ? Math.sin(t * 3 + i * 2.1) > 0.2 : true;
      if (!on) return;
      const dy = params.kind === 'server' ? 0 : params.kind === 'rocket' ? -phase * 2 : phase * 4;
      const [px, py] = iso(x, y + dy, z);
      const s = Math.max(2, Math.floor(c * (params.kind === 'server' ? 0.6 : 0.8)));
      ctx.fillStyle =
        params.kind === 'server' && i % 3 === 0
          ? ink.signal(0.95)
          : ink.line(clamp(0.7 - (params.kind === 'server' ? 0 : phase * 0.6), 0, 1));
      ctx.fillRect(Math.round(px - s / 2), Math.round(py + c / 2), s, s);
    });
    return pointer.active ? `${params.kind} · quarter ${quarter}` : 'rest';
  },
});
