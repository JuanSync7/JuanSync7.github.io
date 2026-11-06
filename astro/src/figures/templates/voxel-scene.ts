import { defineTemplate } from '../defineTemplate';
import {
  BIOMES,
  generateWorld,
  buildWorldView,
  updateWorldView,
  drawWorldFallback,
  type World,
  type WorldSpec,
  type WorldView,
} from '../kit/voxelworld';
import { pick } from '../kit/rng';

interface Params extends WorldSpec {
  layoutSeed: number;
}

export default defineTemplate<Params, World, WorldView>({
  id: 'voxel-scene',
  title: 'Voxel world',
  idea: 'A voxel world grown from a seed: biome-shaped mountains, cliffs, rivers and craters, with cottages, vegetation, sailing boats and rolling waves.',
  style: 'three',
  motion: 'ambient',
  answers: true,
  aspect: 1.6,
  grammar: (rng) => ({
    biome: pick(rng, BIOMES),
    radius: 17 + Math.floor(rng() * 4),
    stretch: 0.86 + rng() * 0.2,
    turn: (rng() - 0.5) * 1.1,
    density: rng(),
    anchor: Math.floor(rng() * 5) - 2,
    layoutSeed: Math.floor(rng() * 999_999_999),
  }),
  name: (p) => `${p.biome} island`,
  alt: (p) =>
    `A miniature ${p.biome} voxel island with sculpted ridges, layered stone cliffs, a cottage, clear paths and boats on voxel water${p.biome === 'volcanic' ? ' and lava' : ''}. Trees, plants and props occupy separate, supported spaces.`,
  setup: ({ params }) => generateWorld(params, params.layoutSeed),
  draw: drawWorldFallback,
  three: {
    build: (env) => buildWorldView(env, env.params, env.params.layoutSeed),
    update: updateWorldView,
  },
});
