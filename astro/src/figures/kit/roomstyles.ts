import type { RoomTone } from '../../styles/tokens/palette';
import type { ThemeId } from './tablethemes';
export type RoomAppearance = 'monochrome' | 'colour';
export type RoomMood = 'warm' | 'day' | 'night' | 'clean' | 'bar';
export interface RoomStyle {
  wall: RoomTone;
  wood: RoomTone;
  top: RoomTone;
  floor: RoomTone;
  accent: RoomTone;
  textile: RoomTone;
  metal: RoomTone;
  mood: RoomMood;
}
export const ROOM_STYLES: Record<ThemeId, RoomStyle> = {
  dining: {
    wall: 'plaster',
    wood: 'walnut',
    top: 'oak',
    floor: 'oak',
    accent: 'sage',
    textile: 'linen',
    metal: 'brass',
    mood: 'warm',
  },
  work: {
    wall: 'plaster',
    wood: 'oak',
    top: 'oak',
    floor: 'graphite',
    accent: 'blue',
    textile: 'teal',
    metal: 'steel',
    mood: 'day',
  },
  computer: {
    wall: 'navy',
    wood: 'walnut',
    top: 'walnut',
    floor: 'graphite',
    accent: 'teal',
    textile: 'navy',
    metal: 'steel',
    mood: 'night',
  },
  storage: {
    wall: 'steel',
    wood: 'oak',
    top: 'oak',
    floor: 'graphite',
    accent: 'sage',
    textile: 'graphite',
    metal: 'steel',
    mood: 'day',
  },
  messy: {
    wall: 'plaster',
    wood: 'oak',
    top: 'oak',
    floor: 'walnut',
    accent: 'clay',
    textile: 'linen',
    metal: 'steel',
    mood: 'warm',
  },
  study: {
    wall: 'linen',
    wood: 'walnut',
    top: 'walnut',
    floor: 'oak',
    accent: 'sage',
    textile: 'navy',
    metal: 'brass',
    mood: 'warm',
  },
  kitchen: {
    wall: 'ivory',
    wood: 'sage',
    top: 'porcelain',
    floor: 'navy',
    accent: 'sage',
    textile: 'linen',
    metal: 'steel',
    mood: 'clean',
  },
  bar: {
    wall: 'burgundy',
    wood: 'walnut',
    top: 'walnut',
    floor: 'graphite',
    accent: 'forest',
    textile: 'burgundy',
    metal: 'brass',
    mood: 'bar',
  },
  lab: {
    wall: 'daylight',
    wood: 'steel',
    top: 'porcelain',
    floor: 'blue',
    accent: 'blue',
    textile: 'graphite',
    metal: 'steel',
    mood: 'clean',
  },
};
