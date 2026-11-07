import { quadruped } from './quadrupeds';
import { Blocks } from './builder';
import type { Recipe } from './types';

export const ANIMALS = [
  'deer',
  'fox',
  'boar',
  'sheep',
  'cow',
  'camel',
  'penguin',
  'polar bear',
  'frog',
  'turtle',
  'lizard',
  'rabbit',
] as const;

export function animal(r: Recipe, b: Blocks): boolean {
  if (!(ANIMALS as readonly string[]).includes(r.kind)) return false;
  const v = r.variant;
  const skin = ['sheep', 'polar bear', 'rabbit'].includes(r.kind)
    ? 'worldSnow'
    : r.kind === 'camel'
      ? 'worldSand'
      : r.kind === 'fox'
        ? 'worldClay'
        : ['frog', 'turtle', 'lizard'].includes(r.kind)
          ? 'worldMoss'
          : r.kind === 'penguin'
            ? 'line3'
            : 'worldWood';
  if (r.kind === 'penguin') {
    b.box(-1, 1, 0, 0, 0, 1, 'worldEmber');
    b.box(0, 0, 1, 3, 0, 0, 'line3');
    b.put(0, 2, 1, 'worldSnow');
    b.put(0, 3, 1, 'worldEmber');
    for (const x of [-1, 1]) b.box(x, x, 1, 2, 0, 0, 'line3');
    if (v % 2) b.put(0, 4, 0, 'worldSnow');
  } else if (['frog', 'turtle', 'lizard'].includes(r.kind)) {
    b.box(-1, 1, 0, 0, -1, 1, skin);
    b.disc(1, 1, r.kind === 'turtle' ? 'worldLeaf' : skin);
    b.put(0, 1, 2, skin);
    b.put(0, 2, 1, skin);
    for (const x of [-1, 1]) b.put(x, 1, 1, v % 2 ? 'worldHoney' : 'worldSnow');
    if (r.kind === 'lizard') b.box(0, 0, 0, 0, -3, -1, skin);
  } else if (r.kind === 'rabbit') {
    b.box(-1, 1, 0, 0, -1, 1, skin);
    b.box(0, 0, 1, 2, -1, 0, skin);
    b.box(-1, 1, 2, 3, 1, 1, skin);
    b.put(0, 2, 2, 'worldClay');
    for (const x of [-1, 1]) {
      b.box(x, x, 4, 5 + (v % 2), 1, 1, skin);
      b.put(x, 3, 2, 'line3');
    }
    b.put(0, 1, -2, 'worldSnow');
  } else quadruped(r, b, skin);
  return true;
}
