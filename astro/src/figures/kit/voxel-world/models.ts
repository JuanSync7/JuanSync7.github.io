import { BUILDINGS, TREES, type Recipe, type Block } from './types';
import { building } from './buildings';
import { plant } from './plants';
import { detail } from './details';

/** Realize the seeded recipe before measuring its placement envelope. */
export function componentModel(recipe: Recipe): Block[] {
  return BUILDINGS.has(recipe.kind) ? building(recipe) : TREES.has(recipe.kind) ? plant(recipe) : detail(recipe);
}
