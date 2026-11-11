import type { NightKey } from '../../styles/tokens/palette';
import type { FurnitureFinish } from './tableparts';
import type { PropKind } from './tableprops';
import type { ThemeId } from './tablethemes';
import { roomMonochrome } from './roommono';

export type TableObject = PropKind | 'table' | 'room';
export function tableFinish(
  kind: TableObject,
  solid: number,
  theme: ThemeId,
  detail?: FurnitureFinish,
): {
  tone: NightKey;
  roughness: number;
  metalness: number;
  strength: number;
} {
  let tone: NightKey = 'inkMuted',
    roughness = 0.75,
    metalness = 0,
    strength = 1;
  if (kind === 'room' || kind === 'table') return roomMonochrome(kind, theme, solid, detail);
  if (['paper', 'openbook', 'napkins', 'towel', 'plate', 'bowl', 'mug', 'labels', 'sticky'].includes(kind)) {
    tone = 'ink2';
    roughness = ['plate', 'bowl', 'mug'].includes(kind) ? 0.3 : 0.95;
  } else if (
    ['laptop', 'monitor', 'keyboard', 'mouse', 'tower', 'speaker', 'phone', 'drive', 'gamepad', 'usb'].includes(kind)
  ) {
    tone = 'inkFaint';
    strength = 0.7;
    roughness = 0.45;
    metalness = 0.12;
    if ((kind === 'monitor' && solid === 4) || (kind === 'laptop' && solid === 34)) tone = 'inkMuted';
    if (kind === 'keyboard' && solid > 1) tone = 'inkSoft';
    if (kind === 'laptop' && solid >= 2 && solid <= 32) tone = 'inkFaint';
  } else if (kind === 'books' || kind === 'notebook' || kind === 'files') {
    tone = solid % 3 === 2 ? 'ink2' : 'inkMuted';
  } else if (kind === 'box') tone = solid === 3 ? 'ink2' : solid === 2 ? 'inkSoft' : 'inkFaint';
  else if (['bottle', 'wineglass', 'tumbler', 'flask', 'beaker', 'petridish', 'tuberack', 'jar'].includes(kind)) {
    tone = 'inkSoft';
    roughness = 0.2;
    metalness = 0.08;
  } else if (['shaker', 'jigger', 'pot', 'microscope', 'spoon', 'utensils', 'tasklamp'].includes(kind)) {
    tone = solid % 2 ? 'inkMuted' : 'line4';
    roughness = 0.35;
    metalness = 0.25;
  }
  return { tone, roughness, metalness, strength };
}
