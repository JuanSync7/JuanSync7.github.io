import type { Biome, Landform } from './types';

export interface Habitat {
  neighbours: Biome[];
  forms: Landform[];
  plants: string[];
  details: string[];
  treeRate: number;
}
export const HABITATS: Record<Biome, Habitat> = {
  woodland: {
    neighbours: ['plains', 'rainforest', 'mushroom'],
    forms: ['slice', 'valley', 'island', 'archipelago'],
    plants: ['tree', 'pine'],
    details: ['fern', 'bush', 'mushroom', 'rock', 'flower'],
    treeRate: 0.025,
  },
  rainforest: {
    neighbours: ['woodland', 'mushroom', 'plains'],
    forms: ['slice', 'valley', 'island'],
    plants: ['jungle tree', 'palm'],
    details: ['fern', 'bush', 'mushroom', 'fallen log', 'flower'],
    treeRate: 0.055,
  },
  plains: {
    neighbours: ['woodland', 'village', 'desert'],
    forms: ['slice', 'valley', 'island'],
    plants: ['tree'],
    details: ['grass', 'flower', 'bush', 'rock', 'tent'],
    treeRate: 0.004,
  },
  desert: {
    neighbours: ['oasis', 'wasteland', 'plains'],
    forms: ['dunes', 'canyon', 'slice', 'island'],
    plants: [],
    details: ['cactus', 'bones', 'skull', 'dead bush', 'rock', 'tent'],
    treeRate: 0,
  },
  oasis: {
    neighbours: ['desert', 'plains'],
    forms: ['dunes', 'slice', 'island'],
    plants: ['palm'],
    details: ['cactus', 'bones', 'reeds', 'tent', 'well'],
    treeRate: 0.008,
  },
  tundra: {
    neighbours: ['snow', 'frozen', 'plains'],
    forms: ['slice', 'valley', 'alps', 'island'],
    plants: ['pine'],
    details: ['bush', 'snow tuft', 'rock', 'fallen log', 'tent'],
    treeRate: 0.002,
  },
  snow: {
    neighbours: ['tundra', 'frozen', 'woodland'],
    forms: ['alps', 'valley', 'island', 'slice'],
    plants: ['pine'],
    details: ['rock', 'snowman', 'snow tuft', 'lantern'],
    treeRate: 0.015,
  },
  frozen: {
    neighbours: ['tundra', 'snow'],
    forms: ['archipelago', 'alps', 'island', 'slice'],
    plants: [],
    details: ['ice spire', 'snow tuft', 'rock', 'bones'],
    treeRate: 0,
  },
  wasteland: {
    neighbours: ['desert', 'volcanic', 'plains'],
    forms: ['canyon', 'slice', 'valley', 'island'],
    plants: ['dead tree'],
    details: ['bones', 'skull', 'ruin', 'rock', 'dead bush', 'tent'],
    treeRate: 0.004,
  },
  volcanic: {
    neighbours: ['wasteland', 'desert', 'frozen'],
    forms: ['caldera', 'island', 'slice'],
    plants: [],
    details: ['basalt spire', 'crystal', 'rock', 'cauldron'],
    treeRate: 0,
  },
  mushroom: {
    neighbours: ['woodland', 'rainforest', 'caves'],
    forms: ['slice', 'island', 'valley'],
    plants: ['giant mushroom'],
    details: ['mushroom', 'fern', 'crystal', 'cauldron'],
    treeRate: 0.022,
  },
  village: {
    neighbours: ['plains', 'woodland'],
    forms: ['slice', 'valley', 'island'],
    plants: ['tree', 'pine'],
    details: ['crop patch', 'well', 'lantern', 'flower', 'bush'],
    treeRate: 0.009,
  },
  city: {
    neighbours: ['plains', 'wasteland'],
    forms: ['slice', 'valley', 'island'],
    plants: ['tree'],
    details: ['lantern', 'crate', 'bush', 'park bench'],
    treeRate: 0.004,
  },
  caves: {
    neighbours: ['mushroom', 'wasteland'],
    forms: ['cavern'],
    plants: [],
    details: ['stalagmite', 'crystal', 'mushroom', 'rock', 'bones'],
    treeRate: 0,
  },
};
