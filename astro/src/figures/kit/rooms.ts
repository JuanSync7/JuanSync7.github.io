import { drawArchitecturePlan } from './architecture-draw';
import { makeArchitecturePlan } from './architecture-plan';
import { drawUrbanBlock, makeUrbanBlock } from './urban-block';
import type { Sketch } from './sketch';

/** Cadastral footprints, then a cut through walls: each portal belongs to a real bay. */
export function block(S: Sketch): void {
  const model = makeUrbanBlock(S);
  S.model = model;
  drawUrbanBlock(S, model);
}

export function building(S: Sketch): void {
  const model = makeArchitecturePlan(S, 'building');
  S.model = model;
  drawArchitecturePlan(S, model);
}

export function floor(S: Sketch): void {
  const model = makeArchitecturePlan(S, 'floor');
  S.model = model;
  drawArchitecturePlan(S, model);
}
