import type { RoomTone } from '../../styles/tokens/palette';
import type { FurnitureFinish } from './tableparts';
import type { PropKind } from './tableprops';
import type { ThemeId } from './tablethemes';
import type { RoomPaint, MaterialPattern } from './roompaint';
import { ROOM_STYLES, type RoomStyle } from './roomstyles';
const SPINES: readonly RoomTone[] = ['navy', 'clay', 'sage', 'burgundy', 'oak', 'teal'];
export function propPaint(
  kind: PropKind,
  theme: ThemeId,
  finish: FurnitureFinish | undefined,
  solid: number,
  phase: number,
  style: RoomStyle = ROOM_STYLES[theme],
): RoomPaint {
  let tone: RoomTone = 'graphite',
    pattern: MaterialPattern = 'none',
    roughness = 0.72,
    metalness = 0;
  let emission: RoomTone | undefined;
  if (['paper', 'crumple', 'napkins', 'labels', 'towel', 'openbook'].includes(kind)) {
    tone = 'ivory';
    pattern = 'fabric';
    roughness = 0.95;
  } else if (kind === 'sticky') {
    tone = 'amber';
    roughness = 0.92;
  } else if (['books', 'files', 'notebook'].includes(kind)) {
    tone = solid % 3 === 2 ? 'ivory' : (SPINES[(solid + phase) % SPINES.length] ?? 'navy');
    pattern = 'fabric';
    roughness = 0.88;
  } else if (['plant', 'fruitbowl', 'prepboard', 'bread'].includes(kind)) {
    tone =
      kind === 'plant'
        ? solid === 1
          ? 'clay'
          : 'forest'
        : kind === 'bread'
          ? 'oak'
          : solid % 4 === 1
            ? 'teal'
            : solid % 3 === 0
              ? 'clay'
              : 'sage';
    pattern = kind === 'prepboard' ? 'wood' : 'ceramic';
  } else if (['plate', 'bowl', 'mug', 'utensils', 'condiments'].includes(kind)) {
    tone = kind === 'mug' ? style.accent : 'ivory';
    pattern = 'ceramic';
    roughness = 0.22;
  } else if (kind === 'box') {
    tone = solid === 3 ? 'ivory' : 'oak';
    pattern = 'fabric';
    roughness = 0.92;
  } else if (
    ['bottle', 'jar', 'flask', 'beaker', 'tumbler', 'wineglass', 'petridish', 'tuberack', 'spicejar'].includes(kind)
  ) {
    tone = kind === 'bottle' ? 'forest' : 'glass';
    pattern = 'none';
    roughness = 0.16;
    metalness = 0.1;
  } else if (['shaker', 'jigger', 'pot', 'microscope', 'spoon', 'tasklamp'].includes(kind)) {
    tone = style.metal;
    pattern = 'metal';
    roughness = 0.24;
    metalness = 0.65;
  } else {
    tone = 'graphite';
    pattern = 'none';
    roughness = 0.48;
    metalness = 0.1;
    if ((kind === 'monitor' && solid === 4) || (kind === 'laptop' && solid === 34)) {
      tone = 'blue';
      emission = 'blue';
    }
    if (kind === 'keyboard' && solid > 1) tone = 'steel';
  }

  if (kind === 'setting') {
    tone = solid === 1 ? 'linen' : solid === 10000 ? 'ivory' : style.metal;
    pattern = solid === 1 ? 'fabric' : solid === 10000 ? 'ceramic' : 'metal';
    roughness = solid === 1 ? 0.9 : 0.24;
    metalness = solid === 1 || solid === 10000 ? 0 : 0.65;
  }
  if (kind === 'candle') {
    tone = solid === 10000 ? 'amber' : solid === 1 ? style.metal : 'ivory';
    pattern = 'ceramic';
    roughness = 0.5;
    emission = solid === 10000 ? 'amber' : undefined;
  }
  if (kind === 'prepboard') {
    tone = solid === 1 ? 'oak' : solid === 2 ? 'graphite' : solid === 3 ? 'steel' : 'clay';
    pattern = solid === 1 ? 'wood' : 'ceramic';
    roughness = solid === 3 ? 0.25 : 0.65;
    metalness = solid === 3 ? 0.65 : 0;
  }
  if (finish === 'leaf') {
    tone = 'forest';
    pattern = 'none';
  }
  if (finish === 'ceramic') {
    tone = 'clay';
    pattern = 'ceramic';
  }
  if (finish === 'paper') {
    tone = 'ivory';
    pattern = 'fabric';
    roughness = 0.95;
  }
  if (finish === 'book') {
    tone = SPINES[(solid + phase) % SPINES.length] ?? 'navy';
    pattern = 'fabric';
  }
  return { tone, pattern, roughness, metalness, strength: 1, emission };
}
