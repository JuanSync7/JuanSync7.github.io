interface Dimensions {
  width: [number, number];
  depth: [number, number];
  height: [number, number];
}

export const DIMENSIONS: Record<string, Dimensions> = {
  'sulfur mound': { width: [1, 2], depth: [1, 1], height: [2, 4] },
  campfire: { width: [1, 2], depth: [1, 1], height: [2, 4] },
  watchtower: { width: [2, 3], depth: [2, 3], height: [7, 11] },
  windmill: { width: [2, 3], depth: [2, 3], height: [8, 12] },
  'jungle shrine': { width: [3, 5], depth: [3, 4], height: [4, 7] },
  'sandstone shrine': { width: [3, 5], depth: [3, 4], height: [4, 7] },
  'ruined gateway': { width: [2, 4], depth: [2, 3], height: [3, 6] },
  greenhouse: { width: [2, 4], depth: [3, 5], height: [3, 5] },
  townhouse: { width: [2, 3], depth: [2, 4], height: [5, 9] },
  workshop: { width: [2, 4], depth: [2, 4], height: [3, 5] },
  'clock tower': { width: [2, 3], depth: [2, 3], height: [10, 16] },
  forge: { width: [2, 3], depth: [2, 4], height: [3, 5] },
  'ancient tree': { width: [3, 5], depth: [1, 1], height: [16, 24] },
  baobab: { width: [2, 3], depth: [1, 1], height: [9, 14] },
  acacia: { width: [2, 3], depth: [1, 1], height: [5, 8] },
  mangrove: { width: [2, 3], depth: [1, 1], height: [7, 11] },
  juniper: { width: [1, 2], depth: [1, 1], height: [3, 5] },
  cedar: { width: [2, 3], depth: [1, 1], height: [11, 17] },
  'ice arch': { width: [2, 4], depth: [1, 1], height: [6, 11] },
  'standing stones': { width: [2, 3], depth: [1, 1], height: [3, 6] },
  'crystal geode': { width: [2, 4], depth: [1, 1], height: [4, 7] },
  'giant fossil': { width: [2, 3], depth: [4, 7], height: [3, 5] },
  'hollow log': { width: [1, 1], depth: [2, 4], height: [2, 3] },
  woodpile: { width: [1, 2], depth: [1, 2], height: [2, 3] },
  'fence segment': { width: [1, 3], depth: [1, 1], height: [2, 3] },
  'toppled column': { width: [2, 3], depth: [3, 5], height: [3, 5] },
  fox: { width: [1, 1], depth: [2, 2], height: [3, 4] },
  boar: { width: [1, 2], depth: [2, 3], height: [3, 4] },
  sheep: { width: [1, 1], depth: [2, 3], height: [4, 5] },
  cow: { width: [1, 2], depth: [2, 3], height: [4, 5] },
  'polar bear': { width: [1, 2], depth: [2, 3], height: [4, 5] },
  camel: { width: [1, 1], depth: [2, 3], height: [4, 6] },
  deer: { width: [1, 1], depth: [2, 3], height: [4, 5] },
};
