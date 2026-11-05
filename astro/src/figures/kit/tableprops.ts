import { WARES } from './tablewares';
import { DESKWARES } from './deskwares';
import { LABWARES } from './labwares';
import { finish, TableDraft, type PropModel } from './tableparts';

const BUILDERS = { ...WARES, ...DESKWARES, ...LABWARES, jar: WARES.spicejar };
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
