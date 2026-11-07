import { type Box, type Pt, type Sketch } from './sketch';
import { makeUrban } from './map-layout';
import { paintUrban } from './map-paint';
import { makeRegion } from './map-region';
import { paintRegion } from './map-region-paint';

export const mid = (b: Box): Pt => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

/** Contours, roads and settlements share a single coastal valley model. */
export function region(S: Sketch): void {
  const model = makeRegion(S);
  S.model = model;
  paintRegion(S, model);
}

/** A city's streets reserve blocks before any buildings are generated. */
export function city(S: Sketch): void {
  const model = makeUrban(S, 'city');
  S.model = model;
  paintUrban(S, model);
}

/** A district resolves the same grammar into kerbs, roof plans, entrances and frontages. */
export function district(S: Sketch): void {
  const model = makeUrban(S, 'district');
  S.model = model;
  paintUrban(S, model);
}
