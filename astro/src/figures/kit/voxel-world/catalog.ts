import type { Biome, Landform } from './types';
import { SUPPORTING_CATALOG } from './supporting-catalog';

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
    plants: ['tree', 'birch', 'pine', 'willow'],
    details: SUPPORTING_CATALOG.woodland,
    treeRate: 0.025,
  },
  rainforest: {
    neighbours: ['woodland', 'mushroom', 'plains'],
    forms: ['slice', 'valley', 'island'],
    plants: ['jungle tree', 'palm', 'bamboo'],
    details: SUPPORTING_CATALOG.rainforest,
    treeRate: 0.055,
  },
  plains: {
    neighbours: ['woodland', 'village', 'desert'],
    forms: ['slice', 'valley', 'island'],
    plants: ['tree'],
    details: SUPPORTING_CATALOG.plains,
    treeRate: 0.004,
  },
  desert: {
    neighbours: ['oasis', 'wasteland', 'plains'],
    forms: ['dunes', 'canyon', 'slice', 'island'],
    plants: [],
    details: SUPPORTING_CATALOG.desert,
    treeRate: 0,
  },
  oasis: {
    neighbours: ['desert', 'plains'],
    forms: ['dunes', 'slice', 'island'],
    plants: ['palm'],
    details: SUPPORTING_CATALOG.oasis,
    treeRate: 0.008,
  },
  tundra: {
    neighbours: ['snow', 'frozen', 'plains'],
    forms: ['slice', 'valley', 'alps', 'island'],
    plants: ['pine'],
    details: SUPPORTING_CATALOG.tundra,
    treeRate: 0.002,
  },
  snow: {
    neighbours: ['tundra', 'frozen', 'woodland'],
    forms: ['alps', 'valley', 'island', 'slice'],
    plants: ['pine'],
    details: SUPPORTING_CATALOG.snow,
    treeRate: 0.015,
  },
  frozen: {
    neighbours: ['tundra', 'snow'],
    forms: ['archipelago', 'alps', 'island', 'slice'],
    plants: [],
    details: SUPPORTING_CATALOG.frozen,
    treeRate: 0,
  },
  wasteland: {
    neighbours: ['desert', 'volcanic', 'plains'],
    forms: ['canyon', 'slice', 'valley', 'island'],
    plants: ['dead tree'],
    details: SUPPORTING_CATALOG.wasteland,
    treeRate: 0.004,
  },
  volcanic: {
    neighbours: ['wasteland', 'desert', 'frozen'],
    forms: ['caldera', 'island', 'slice'],
    plants: [],
    details: SUPPORTING_CATALOG.volcanic,
    treeRate: 0,
  },
  mushroom: {
    neighbours: ['woodland', 'rainforest', 'caves'],
    forms: ['slice', 'island', 'valley'],
    plants: ['giant mushroom'],
    details: SUPPORTING_CATALOG.mushroom,
    treeRate: 0.022,
  },
  village: {
    neighbours: ['plains', 'woodland'],
    forms: ['slice', 'valley', 'island'],
    plants: ['tree', 'birch', 'pine', 'willow'],
    details: SUPPORTING_CATALOG.village,
    treeRate: 0.009,
  },
  city: {
    neighbours: ['plains', 'wasteland'],
    forms: ['slice', 'valley', 'island'],
    plants: ['tree'],
    details: SUPPORTING_CATALOG.city,
    treeRate: 0.004,
  },
  caves: {
    neighbours: ['mushroom', 'wasteland'],
    forms: ['cavern'],
    plants: [],
    details: SUPPORTING_CATALOG.caves,
    treeRate: 0,
  },
};
