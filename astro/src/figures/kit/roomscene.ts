import { itemModel, tabletop, propName, type TableScene } from './tabletop';
import type { PropModel } from './tableparts';
import type { TableObject } from './tablemesh';
import { roomModels } from './tableroom';
import type { RoomSide } from './roomplan';

export interface SceneModel {
  label: string;
  model: PropModel;
  kind: TableObject;
  interactive: boolean;
  side?: RoomSide;
  cutaway?: boolean;
}
const CACHE = new WeakMap<TableScene, SceneModel[]>();
export function sceneModels(p: TableScene): SceneModel[] {
  const cached = CACHE.get(p);
  if (cached) return cached;
  const models: SceneModel[] = [
    ...p.items.map((it) => ({ label: propName(it.kind), model: itemModel(it), kind: it.kind, interactive: true })),
    { label: p.theme.name, model: tabletop(p), kind: 'table', interactive: false },
    ...roomModels(p).map((part) => ({ ...part, kind: 'room' as const })),
  ];
  CACHE.set(p, models);
  return models;
}
