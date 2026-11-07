import type { FurnitureFinish } from './tableparts';
import type { ThemeId } from './tablethemes';
import type { RoomPaint } from './roompaint';
import { ROOM_STYLES } from './roomstyles';

export function decorPaint(theme: ThemeId, finish?: FurnitureFinish): RoomPaint | undefined {
  const style = ROOM_STYLES[theme];
  const base: RoomPaint = { tone: style.accent, pattern: 'none', roughness: 0.72, metalness: 0, strength: 1 };
  switch (finish) {
    case 'wallpaper':
      return { ...base, tone: theme === 'bar' ? 'brass' : 'linen', pattern: 'fabric', strength: 0.45, roughness: 0.95 };
    case 'walltile':
      return { ...base, tone: theme === 'lab' ? 'porcelain' : 'ivory', pattern: 'ceramic', roughness: 0.32 };
    case 'wallband':
      return { ...base, pattern: 'ceramic', roughness: 0.35 };
    case 'glass':
      return { ...base, tone: theme === 'bar' ? 'forest' : 'glass', roughness: 0.16, metalness: 0.1 };
    case 'porcelain':
      return { ...base, tone: 'ivory', pattern: 'ceramic', roughness: 0.22 };
    case 'equipment':
      return { ...base, tone: 'graphite', roughness: 0.4, metalness: 0.1 };
    case 'kraft':
      return { ...base, tone: 'oak', pattern: 'fabric', roughness: 0.95 };
    default:
      return undefined;
  }
}
