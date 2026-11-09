import { ROOM_STYLES, type RoomStyle } from './roomstyles';
import type { ThemeId } from './tablethemes';

/** Coordinated roles, not independent random paint. Keep clinical surfaces usable. */
const VARIANTS: Record<ThemeId, readonly Partial<RoomStyle>[]> = {
  dining: [
    {},
    { wall: 'ivory', wood: 'oak', top: 'walnut', accent: 'burgundy', textile: 'linen' },
    { wall: 'sage', wood: 'walnut', top: 'oak', accent: 'clay', textile: 'ivory' },
    { wall: 'plaster', wood: 'oak', top: 'oak', accent: 'blue', textile: 'navy', metal: 'steel' },
  ],
  work: [
    {},
    { wall: 'linen', wood: 'walnut', top: 'walnut', accent: 'sage', textile: 'linen', floor: 'walnut' },
    { wall: 'blue', wood: 'oak', top: 'oak', accent: 'clay', textile: 'navy' },
    { wall: 'ivory', wood: 'walnut', accent: 'burgundy', textile: 'sage' },
  ],
  computer: [
    {},
    { wall: 'graphite', wood: 'oak', top: 'oak', accent: 'clay', textile: 'graphite', metal: 'brass' },
    { wall: 'forest', accent: 'sage', textile: 'forest', floor: 'walnut' },
    { wall: 'burgundy', accent: 'blue', textile: 'navy', wood: 'oak', top: 'oak' },
  ],
  storage: [
    {},
    { wall: 'plaster', accent: 'blue', wood: 'walnut', floor: 'steel' },
    { wall: 'ivory', accent: 'clay', floor: 'graphite' },
    { wall: 'sage', accent: 'forest', floor: 'steel' },
  ],
  messy: [
    {},
    { wall: 'linen', wood: 'walnut', top: 'walnut', accent: 'blue', textile: 'navy' },
    { wall: 'sage', accent: 'burgundy', textile: 'sage', floor: 'oak' },
    { wall: 'ivory', accent: 'teal', textile: 'clay' },
  ],
  study: [
    {},
    { wall: 'sage', wood: 'oak', top: 'oak', accent: 'burgundy', textile: 'linen' },
    { wall: 'blue', accent: 'clay', textile: 'navy', floor: 'walnut' },
    { wall: 'ivory', wood: 'oak', top: 'oak', accent: 'forest', textile: 'sage' },
  ],
  kitchen: [
    {},
    { wall: 'plaster', wood: 'navy', accent: 'blue', floor: 'steel', textile: 'ivory' },
    { wall: 'ivory', wood: 'clay', accent: 'clay', floor: 'graphite' },
    { wall: 'linen', wood: 'forest', accent: 'forest', floor: 'walnut', metal: 'brass' },
  ],
  bar: [
    {},
    { wall: 'forest', accent: 'clay', textile: 'forest', wood: 'oak', top: 'oak' },
    { wall: 'navy', accent: 'burgundy', textile: 'navy', floor: 'walnut' },
    { wall: 'graphite', wood: 'oak', top: 'oak', accent: 'teal', textile: 'clay', metal: 'steel' },
  ],
  lab: [
    {},
    { wall: 'ivory', accent: 'sage', floor: 'steel' },
    { wall: 'plaster', accent: 'teal', floor: 'graphite' },
    { wall: 'daylight', accent: 'blue', floor: 'steel', wood: 'ivory' },
  ],
};
export function roomStyle(theme: ThemeId, variant = 0): RoomStyle {
  return { ...ROOM_STYLES[theme], ...VARIANTS[theme][Math.abs(Math.trunc(variant)) % 4] };
}
