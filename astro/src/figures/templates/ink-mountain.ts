import { defineTemplate } from '../defineTemplate';
import { ink } from '../kit/ink';
import { shoreChunk, Strip, waterChunk, type InkWorld, type TreeKind } from '../kit/inkland';
import { farChunk, fogChunk, midChunk } from '../kit/inkrange';
import { drawMark, type Mark } from '../kit/inkpath';
import type { BoatKind } from '../kit/inkwater';
import { follow } from '../kit/motion';
import { noise2, type Noise2 } from '../kit/noise';
import { between, pick } from '../kit/rng';

/** An ink landscape after LingDong-'s shan-shui-inf, unrolling like a hand scroll without end:
 *  pale far ranges with distant trees and fog; nearer ranges edged with shade, wooded with
 *  groves, a river falling from a saddle, and temples and pagodas on terraces cut into their
 *  faces, at their feet or on the near bank; a lake, river or gorge that mirrors them, with
 *  fish, sampans, fishermen and boatmen; a near bank of stones, lilies, pines, willows, rocks,
 *  bonsai and ponds. Each strip scrolls at its own depth. The moon or the setting sun is the
 *  signal. The pointer slows the scroll, as a hand holds a scroll to look, and the thing
 *  under it takes the signal. */

const SCENES = ['lake', 'river', 'gorge'] as const;
type Scene = (typeof SCENES)[number];

const SHAPE: Record<Scene, { water: number; shore: number; rise: number; peak: number }> = {
  lake: { water: 0.62, shore: 0.86, rise: 0.72, peak: 0.6 },
  river: { water: 0.68, shore: 0.85, rise: 0.88, peak: 0.8 },
  gorge: { water: 0.74, shore: 0.88, rise: 1.08, peak: 1 },
};

const GROVES: readonly (readonly TreeKind[])[] = [
  ['pine', 'pine', 'leafy'],
  ['willow', 'leafy', 'pine'],
  ['pine', 'willow'],
];

const CREWS: readonly (readonly BoatKind[])[] = [
  ['fisherman', 'fisherman', 'sampan'],
  ['boatman', 'fisherman'],
  ['sampan', 'boatman', 'fisherman'],
];

/** Share of the scroll each strip moves, far to near. */
const DEPTHS = [0.012, 0.018, 0.028, 0.045, 0.075] as const;

interface P {
  scene: Scene;
  light: 'moon' | 'sun';
  sky: number;
  pace: number;
  temple: number;
  pagoda: number;
  stream: number;
  boat: number;
  bonsai: number;
  pond: number;
  trees: readonly TreeKind[];
  boats: readonly BoatKind[];
}

interface S {
  noise: Noise2;
  strips: Strip[];
  scroll: number;
  slow: number;
  /** The waterline under the near ranges, and the near bank: the water lies between. */
  line: number;
  shore: number;
}

interface View {
  off: number;
  marks: Mark[];
}

/** The near ranges mirrored in the water, faint, then broken by bands of still ground that
 *  drift with the noise: a clear surface catching the mountains in pieces. */
function reflect(ctx: CanvasRenderingContext2D, s: S, w: number, h: number, t: number, paint: () => void): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, s.line, w, s.shore - s.line);
  ctx.clip();
  ctx.save();
  ctx.translate(0, 2 * s.line);
  ctx.scale(1, -1);
  paint();
  ctx.restore();
  const row = Math.max(2, h * 0.008);
  const cell = h * 0.035;
  ctx.beginPath();
  for (let y = s.line + row; y < s.shore; y += row)
    for (let x = 0; x < w; x += cell)
      if (s.noise(x / h + t * 0.08, (y / h) * 30 + t * 0.15) > 0.12) ctx.rect(x, y, cell, row * 0.5);
  ctx.fillStyle = ink.ground();
  ctx.fill();
  ctx.restore();
}

const GROVE_WORDS: Record<TreeKind, string> = { pine: 'pines', leafy: 'broadleaf trees', willow: 'willows' };

export default defineTemplate<P, S>({
  id: 'ink-mountain',
  title: 'Ink mountain',
  idea: 'An endless ink landscape unrolling like a hand scroll, each strip at its own depth: wooded mountains with temples set into them, boats on the water, trees and ponds on the near bank; the pointer holds the scroll and lights the thing under it.',
  style: 'ink',
  motion: 'ambient',
  answers: true,
  bleed: true,
  aspect: 2,
  grammar: (rng) => {
    const scene = pick(rng, SCENES);
    return {
      scene,
      light: rng() < 0.6 ? 'moon' : 'sun',
      sky: between(rng, 0.15, 0.85),
      pace: between(rng, 0.8, 1.25),
      temple: between(rng, 0.5, 0.8),
      pagoda: between(rng, 0.25, 0.6),
      stream: scene === 'gorge' ? between(rng, 0.45, 0.7) : between(rng, 0.15, 0.4),
      boat: scene === 'lake' ? between(rng, 0.6, 0.85) : between(rng, 0.35, 0.6),
      bonsai: between(rng, 0.1, 0.2),
      pond: between(rng, 0.1, 0.22),
      trees: pick(rng, GROVES),
      boats: pick(rng, CREWS),
    };
  },
  name: (p) => (p.light === 'moon' ? `moonlit ${p.scene}` : `${p.scene} at sunset`),
  alt: (p) =>
    `An ink-brush landscape scrolling without end: pale far ranges dotted with distant trees and crossed by fog; nearer ranges with a darker double edge on the sides away from the light, wooded with groves of small trees and pines, with temples and pagodas on terraces cut into their faces or standing at their feet, and a river falling from a saddle and winding down into a ${p.scene}. The water mirrors the mountains and temples in broken, shimmering pieces, with fish hovering under it and sampans with ${p.boats.includes('fisherman') ? 'fishermen' : 'boatmen'} on it. The near bank is set with stones, grass, lily pads and lotus, a moored fishing boat, ${[...new Set(p.trees)].map((t) => GROVE_WORDS[t]).join(' and ')}, rocks, bonsai and ponds. ${p.light === 'moon' ? 'A small orange moon outline hangs in the sky' : 'An orange setting sun sinks behind the far ranges'}.`,
  setup: ({ h, rng, params }) => {
    const noise = noise2(rng);
    const base = Math.floor(rng() * 0x7fffffff);
    const shape = SHAPE[params.scene];
    const world: InkWorld = {
      u: h,
      bottom: h,
      water: shape.water * h,
      shore: shape.shore * h,
      rise: shape.rise,
      peak: shape.peak,
      odds: params,
      trees: params.trees,
      boats: params.boats,
    };
    const strips = [
      new Strip(0.75 * h, DEPTHS[0], farChunk(world, noise)),
      new Strip(0.9 * h, DEPTHS[1], fogChunk(world, noise, base)),
      new Strip(0.6 * h, DEPTHS[2], midChunk(world, noise, base)),
      new Strip(h, DEPTHS[3], waterChunk(world, noise, base)),
      new Strip(0.9 * h, DEPTHS[4], shoreChunk(world, noise, base)),
    ];
    // Start a little way into the scroll so the seed, not chunk 0, decides the first view.
    return {
      noise,
      strips,
      scroll: between(rng, 20, 200) * h,
      slow: 0,
      line: world.water + 0.01 * h,
      shore: world.shore,
    };
  },
  draw: ({ ctx, w, h, t, dt, pointer, hover, still, params, state }) => {
    const holding = pointer.active && hover > 0.3 ? 1 : 0;
    state.slow = still ? holding : follow(state.slow, holding, dt, 3);
    state.scroll += dt * h * params.pace * (1 - 0.85 * state.slow);
    const views: View[] = state.strips.map((s) => {
      const off = state.scroll * s.speed;
      return { off, marks: s.marks(off, w) };
    });
    const sway = (m: Mark): number => (m.swim === null ? 0 : Math.sin(t * 0.35 + (m.bob ?? 0)) * m.swim);
    const bob = (m: Mark): number => (m.bob === null ? 0 : Math.sin(t * 1.1 + m.bob) * 0.004 * h);
    let lit: Mark | null = null;
    if (holding) {
      const px = pointer.x * w;
      const py = pointer.y * h;
      let best = 1;
      for (const v of views)
        for (const m of v.marks) {
          if (!m.kind) continue;
          const d = Math.hypot(m.cx - v.off + sway(m) - px, m.cy - py) / (m.r + 0.05 * h);
          if (d < best) [best, lit] = [d, m];
        }
    }
    const sun = params.light === 'sun';
    ctx.strokeStyle = lit ? ink.line(0.35) : ink.signal(0.9);
    ctx.beginPath();
    ctx.arc(params.sky * w, h * (sun ? 0.42 : 0.17), h * (sun ? 0.08 : 0.045), 0, Math.PI * 2);
    ctx.stroke();
    const at = (v: View, m: Mark, fade = 1): void => drawMark(ctx, m, -v.off + sway(m), bob(m), m === lit, fade, t);
    const [far, fog, near, water, bank] = views;
    for (const v of [far, fog, near]) if (v) for (const m of v.marks) at(v, m);
    if (near) reflect(ctx, state, w, h, t, () => near.marks.forEach((m) => at(near, m, 0.3)));
    for (const v of [water, bank]) if (v) for (const m of v.marks) at(v, m);
    return lit?.kind ?? 'rest';
  },
});
