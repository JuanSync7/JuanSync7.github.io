import { defineTemplate } from '../defineTemplate';
import { defineThreeFigure } from '../defineThree';
import {
  planWorld,
  generateWorld,
  buildWorldView,
  updateWorldView,
  drawWorldFallback,
  type World,
  type WorldSpec,
  type WorldView,
} from '../kit/voxelworld';

export default defineTemplate<WorldSpec, World, WorldView>({
  id: 'voxel-scene',
  title: 'Voxel Worlds',
  idea: 'A seed chooses the terrain, biome transitions, settlements, vegetation and atmosphere: from empty dunes and alpine valleys to dense rainforest, caves and cities, with cast shadows, glowing practical lights and visible biome weather.',
  style: 'three',
  fullColour: true,
  motion: 'ambient',
  answers: true,
  aspect: 1.6,
  grammar: (rng) => planWorld(Math.floor(rng() * 999_999_999)),
  name: (p) => `${p.biome} · ${p.landform}`,
  alt: (p) =>
    `A generated ${p.landform} of ${p.biome}${p.secondary ? ` transitioning into ${p.secondary}` : ''}, with seeded atmospheric lighting and biome weather. Object numbers, shapes, sizes and positions follow the seed. Drag to turn the view.`,
  setup: ({ params }) => generateWorld(params),
  draw: drawWorldFallback,
  three: {
    renderer: defineThreeFigure,
    build: (env) => buildWorldView(env, env.params, env.params.layoutSeed),
    update: updateWorldView,
  },
});
