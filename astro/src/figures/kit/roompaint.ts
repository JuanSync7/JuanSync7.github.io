import type { RoomTone } from '../../styles/tokens/palette';
import type { FurnitureFinish } from './tableparts';
import type { TableObject } from './tablefinish';
import type { ThemeId } from './tablethemes';
import { ROOM_STYLES } from './roomstyles';
import { propPaint } from './roomproppaint';
import { decorPaint } from './roomdecorpaint';

const BOOKS: readonly RoomTone[] = ['navy', 'clay', 'sage', 'burgundy'];
export const MATERIAL_PATTERNS = ['none', 'wood', 'stone', 'metal', 'fabric', 'plaster', 'ceramic'] as const;
export type MaterialPattern = (typeof MATERIAL_PATTERNS)[number];
export interface RoomPaint {
  tone: RoomTone;
  pattern: MaterialPattern;
  roughness: number;
  metalness: number;
  strength: number;
  emission?: RoomTone;
  emissionStrength?: number;
  grainAlong?: 'x' | 'z';
}
export function roomPaint(
  kind: TableObject,
  theme: ThemeId,
  finish: FurnitureFinish | undefined,
  solid: number,
  phase = 0,
): RoomPaint {
  const detail = decorPaint(theme, finish);
  if (detail && (kind === 'table' || kind === 'room')) return detail;
  const style = ROOM_STYLES[theme];
  let tone: RoomTone = style.accent,
    pattern: MaterialPattern = 'none',
    roughness = 0.72,
    metalness = 0,
    strength = 1;
  let emission: RoomTone | undefined;
  if (kind === 'table' || kind === 'room') {
    tone = style.wood;
    pattern = 'wood';
    if (finish === 'top') {
      tone = style.top;
      pattern = theme === 'kitchen' ? 'stone' : theme === 'lab' ? 'ceramic' : 'wood';
      roughness = theme === 'kitchen' ? 0.3 : theme === 'lab' ? 0.28 : 0.5;
    }
    if (finish === 'ceiling') {
      tone = theme === 'bar' ? 'walnut' : theme === 'computer' ? 'graphite' : theme === 'storage' ? 'steel' : 'ivory';
      pattern = theme === 'bar' ? 'wood' : 'plaster';
      roughness = 0.95;
      strength = 0.82;
    }
    if (finish === 'wall') {
      tone = style.wall;
      pattern = 'plaster';
      strength = 0.75;
      roughness = 0.95;
    }
    if (finish === 'floor' || finish === 'floorAlt') {
      tone = style.floor;
      pattern = ['dining', 'study', 'messy', 'work'].includes(theme)
        ? 'wood'
        : theme === 'lab'
          ? 'ceramic'
          : theme === 'computer'
            ? 'fabric'
            : 'stone';
      if (theme === 'kitchen' && finish === 'floorAlt') tone = 'porcelain';
      strength = finish === 'floorAlt' ? 0.94 : 0.75;
      roughness = 0.88;
    }
    if (finish === 'brick') {
      tone = 'rust';
      pattern = 'plaster';
      roughness = 0.95;
    }
    if (finish === 'tile') {
      tone = kind === 'table' ? 'ivory' : theme === 'messy' ? 'clay' : 'steel';
      pattern = 'stone';
      strength = 0.7;
      roughness = 0.45;
    }
    if (finish === 'inlay') {
      tone = style.accent;
      pattern = 'none';
    }
    if (finish === 'panel') {
      tone = theme === 'kitchen' ? 'sage' : theme === 'lab' ? 'steel' : style.wood;
    }
    if (finish === 'cabinet') {
      tone = style.accent;
      pattern = theme === 'lab' ? 'metal' : 'none';
      roughness = 0.42;
    }
    if (finish === 'acoustic') {
      tone = 'navy';
      pattern = 'fabric';
      roughness = 0.95;
    }
    if (finish === 'paper') {
      tone = 'ivory';
      pattern = 'fabric';
      roughness = 0.95;
    }
    if (finish === 'book') {
      tone = BOOKS[solid % BOOKS.length] ?? style.accent;
      pattern = 'fabric';
    }
    if (finish === 'metal') {
      tone = style.metal;
      pattern = 'metal';
      roughness = 0.28;
      metalness = 0.65;
    }
    if (finish === 'rug' || finish === 'shade' || finish === 'stitch' || finish === 'upholstery') {
      tone =
        finish === 'shade'
          ? 'ivory'
          : finish === 'stitch'
            ? 'linen'
            : finish === 'upholstery'
              ? style.accent
              : style.textile;
      pattern = 'fabric';
      roughness = 0.92;
    }
    if (finish === 'ceramic') {
      tone = 'clay';
      pattern = 'ceramic';
      roughness = 0.6;
    }
    if (finish === 'leaf') {
      tone = 'forest';
      pattern = 'none';
      roughness = 0.85;
    }
    if (finish === 'window') {
      tone = style.mood === 'night' || style.mood === 'bar' ? 'navy' : 'daylight';
      pattern = 'none';
      roughness = 0.12;
      metalness = 0.1;
      emission = tone;
      strength = 0.45;
    }
    if (finish === 'light') {
      tone = 'ivory';
      emission = style.mood === 'clean' ? 'daylight' : 'amber';
      pattern = 'none';
      roughness = 0.25;
    }
    if (finish === 'recess' || finish === 'foot') {
      tone = 'ink';
      pattern = 'none';
      roughness = 1;
    }
  } else return propPaint(kind, theme, finish, solid, phase);
  if (finish === 'leaf') {
    tone = 'forest';
    pattern = 'none';
  }
  if (finish === 'ceramic') {
    tone = 'clay';
    pattern = 'ceramic';
  }
  return {
    tone,
    pattern,
    roughness,
    metalness,
    strength,
    emission,
    grainAlong: kind === 'room' && (finish === 'floor' || finish === 'floorAlt') ? 'z' : 'x',
  };
}
