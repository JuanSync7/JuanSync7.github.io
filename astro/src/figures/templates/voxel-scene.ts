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
  title: 'Voxel worlds',
  idea: 'A seed chooses the terrain, biome transitions, settlements, vegetation and light: from empty dunes and alpine valleys to dense rainforest, caves and cities.',
  style: 'three',
  motion: 'ambient',
  answers: true,
  aspect: 1.6,
  grammar: (rng) => planWorld(Math.floor(rng() * 999_999_999)),
  name: (p) => `${p.biome} · ${p.landform}`,
  alt: (p) =>
    `A generated ${p.landform} of ${p.biome}${p.secondary ? ` transitioning into ${p.secondary}` : ''}, in ${p.daylight} light. Object numbers, shapes, sizes and positions follow the seed. Drag to turn the view.`,
  setup: ({ params }) => generateWorld(params),
  draw: drawWorldFallback,
  three: {
    renderer: defineThreeFigure,
    build: (env) => buildWorldView(env, env.params, env.params.layoutSeed),
    update: updateWorldView,
  },
});
