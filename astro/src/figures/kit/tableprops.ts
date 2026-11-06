import { WARES } from './tablewares';
import { DESKWARES } from './deskwares';
import { LABWARES } from './labwares';
import { OFFICE_EXTRAS } from './officeextras';
import { SERVINGWARES } from './servingwares';
import { finish, TableDraft, type PropModel } from './tableparts';

const BUILDERS = {
  ...WARES,
  ...DESKWARES,
  ...LABWARES,
  ...OFFICE_EXTRAS,
  ...SERVINGWARES,
  jar: WARES.spicejar,
  labels: OFFICE_EXTRAS.sticky,
  timer: OFFICE_EXTRAS.clock,
};
export type PropKind = keyof typeof BUILDERS;
const CACHE = new Map<PropKind, PropModel>();
export const PROP_KINDS = Object.keys(BUILDERS) as PropKind[];
const LABELS: Partial<Record<PropKind, string>> = {
  setting: 'place setting',
  openbook: 'open textbook',
  penholder: 'pencil cup',
  tasklamp: 'task lamp',
  prepboard: 'cutting board & produce',
  spicejar: 'spice jar',
  wineglass: 'wine glass',
  tuberack: 'test-tube rack',
  petridish: 'Petri dish',
  crumple: 'crumpled paper',
  files: 'file binders',
  jar: 'supply jar',
  sticky: 'sticky notes',
  cable: 'coiled cable',
  drive: 'external drive',
  usb: 'USB drive',
  bread: 'bread basket',
  fruitbowl: 'fruit bowl',
  utensils: 'utensil crock',
  labels: 'label cards',
};
export const propName = (kind: PropKind): string => LABELS[kind] ?? kind;
export function prop(kind: PropKind): PropModel {
  const cached = CACHE.get(kind);
  if (cached) return cached;
  const draft = new TableDraft();
  BUILDERS[kind](draft);
  const model = finish(draft);
  CACHE.set(kind, model);
  return model;
}
